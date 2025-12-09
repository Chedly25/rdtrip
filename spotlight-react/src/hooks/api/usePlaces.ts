/**
 * Places API Hooks
 *
 * WI-12.2: React Query hooks for places and hidden gems operations
 *
 * Wraps the existing hiddenGems and cityPlaces services with React Query
 * for caching, deduplication, and optimistic updates.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, type PlacesCache } from '../../lib/supabase';
import { ApiError, API_ERROR_CODES } from '../../services/api/errors';
import { withRateLimit, RATE_LIMITS } from '../../services/api/rateLimit';
import { useState, useCallback, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface PlaceCoordinates {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  type: string;
  category?: string;
  coordinates: PlaceCoordinates;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  description?: string;
  imageUrl?: string;
  isHiddenGem?: boolean;
  hiddenGemScore?: number;
  openNow?: boolean;
  address?: string;
  phone?: string;
  website?: string;
  tags?: string[];
}

export interface PlaceSearchParams {
  coordinates: PlaceCoordinates;
  radiusKm?: number;
  category?: string;
  limit?: number;
  hiddenGemsOnly?: boolean;
}

export interface HiddenGemCriteria {
  maxReviewCount?: number;
  minRating?: number;
  preferLocal?: boolean;
  avoidTouristTraps?: boolean;
}

// ============================================================================
// Query Keys
// ============================================================================

export const placesKeys = {
  all: ['places'] as const,
  search: (params: PlaceSearchParams) => [...placesKeys.all, 'search', params] as const,
  nearby: (coordinates: PlaceCoordinates, radius: number) =>
    [...placesKeys.all, 'nearby', coordinates, radius] as const,
  hiddenGems: (cityId: string) => [...placesKeys.all, 'hidden-gems', cityId] as const,
  detail: (placeId: string) => [...placesKeys.all, 'detail', placeId] as const,
  cache: () => [...placesKeys.all, 'cache'] as const,
};

// ============================================================================
// Cache Helpers
// ============================================================================

/**
 * Generate a cache key for location-based queries
 */
function generateLocationHash(
  coordinates: PlaceCoordinates,
  radiusKm: number,
  category?: string
): string {
  const lat = coordinates.lat.toFixed(3);
  const lng = coordinates.lng.toFixed(3);
  return `${lat},${lng}:${radiusKm}:${category || 'all'}`;
}

/**
 * Check places cache in Supabase
 */
async function checkPlacesCache(
  locationHash: string
): Promise<PlacesCache | null> {
  const { data, error } = await supabase
    .from('places_cache')
    .select('*')
    .eq('location_hash', locationHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;

  // Update hit count
  await supabase
    .from('places_cache')
    .update({
      hit_count: (data.hit_count || 0) + 1,
      last_hit_at: new Date().toISOString(),
    })
    .eq('id', data.id);

  return data;
}

/**
 * Store places in cache
 */
async function storePlacesCache(
  locationHash: string,
  cityName: string | null,
  places: Place[],
  category?: string,
  radiusKm?: number
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour TTL

  await supabase.from('places_cache').upsert(
    {
      location_hash: locationHash,
      city_name: cityName,
      places_data: places,
      category: category || 'all',
      radius_km: radiusKm,
      expires_at: expiresAt.toISOString(),
      hit_count: 0,
    },
    { onConflict: 'location_hash' }
  );
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch places from external API (Google Places, etc.)
 * This would typically call your backend or Google Places API
 */
async function fetchPlacesFromAPI(params: PlaceSearchParams): Promise<Place[]> {
  // This is a placeholder - in production, this would call your backend
  // which wraps Google Places API or similar
  const apiUrl = import.meta.env.VITE_API_URL || '/api';

  const response = await fetch(`${apiUrl}/places/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new ApiError(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch places');
  }

  const data = await response.json();
  return data.places || [];
}

/**
 * Apply hidden gem scoring to places
 */
function scoreHiddenGems(places: Place[], criteria: HiddenGemCriteria = {}): Place[] {
  const {
    maxReviewCount = 500,
    minRating = 4.0,
    preferLocal = true,
    avoidTouristTraps = true,
  } = criteria;

  return places.map((place) => {
    let score = 0;

    // Low review count = more hidden
    if (place.reviewCount && place.reviewCount < maxReviewCount) {
      score += (maxReviewCount - place.reviewCount) / maxReviewCount * 0.4;
    }

    // High rating = better quality
    if (place.rating && place.rating >= minRating) {
      score += ((place.rating - minRating) / (5 - minRating)) * 0.3;
    }

    // Local tags boost
    if (preferLocal && place.tags) {
      const localTags = ['local favorite', 'authentic', 'family-owned', 'traditional'];
      const hasLocalTag = place.tags.some((tag) =>
        localTags.some((lt) => tag.toLowerCase().includes(lt))
      );
      if (hasLocalTag) score += 0.2;
    }

    // Tourist trap penalty
    if (avoidTouristTraps && place.tags) {
      const touristTags = ['tourist', 'chain', 'international'];
      const isTouristy = place.tags.some((tag) =>
        touristTags.some((tt) => tag.toLowerCase().includes(tt))
      );
      if (isTouristy) score -= 0.15;
    }

    return {
      ...place,
      isHiddenGem: score > 0.5,
      hiddenGemScore: Math.max(0, Math.min(1, score)),
    };
  });
}

// ============================================================================
// Rate-Limited Functions
// ============================================================================

const rateLimitedFetchPlaces = withRateLimit(
  fetchPlacesFromAPI,
  'places:search',
  RATE_LIMITS.search
);

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Search for places near coordinates
 *
 * @example
 * const { data: places } = usePlacesSearch({
 *   coordinates: { lat: 48.8566, lng: 2.3522 },
 *   radiusKm: 5,
 *   category: 'restaurant',
 * });
 */
export function usePlacesSearch(
  params: PlaceSearchParams | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: placesKeys.search(params!),
    queryFn: async () => {
      if (!params) return [];

      const locationHash = generateLocationHash(
        params.coordinates,
        params.radiusKm || 5,
        params.category
      );

      // Check cache first
      const cached = await checkPlacesCache(locationHash);
      if (cached) {
        const places = cached.places_data as unknown as Place[];
        return params.hiddenGemsOnly
          ? (places as Place[]).filter((p) => p.isHiddenGem)
          : (places as Place[]);
      }

      // Fetch from API
      try {
        const places = await rateLimitedFetchPlaces(params);
        const scoredPlaces = scoreHiddenGems(places);

        // Store in cache
        await storePlacesCache(
          locationHash,
          null,
          scoredPlaces,
          params.category,
          params.radiusKm
        );

        return params.hiddenGemsOnly
          ? scoredPlaces.filter((p) => p.isHiddenGem)
          : scoredPlaces;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to search places');
      }
    },
    enabled: !!params && (options?.enabled !== false),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get hidden gems for a city
 *
 * @example
 * const { data: gems } = useHiddenGems('paris');
 */
export function useHiddenGems(
  cityId: string | null,
  coordinates?: PlaceCoordinates
) {
  return usePlacesSearch(
    cityId && coordinates
      ? {
          coordinates,
          radiusKm: 10,
          hiddenGemsOnly: true,
          limit: 20,
        }
      : null
  );
}

/**
 * Get nearby places with live position
 */
export function useNearbyPlaces(
  coordinates: PlaceCoordinates | null,
  options?: {
    radiusKm?: number;
    category?: string;
    enabled?: boolean;
  }
) {
  return usePlacesSearch(
    coordinates
      ? {
          coordinates,
          radiusKm: options?.radiusKm || 1,
          category: options?.category,
        }
      : null,
    { enabled: options?.enabled }
  );
}

/**
 * Get a single place's details
 */
export function usePlaceDetails(placeId: string | null) {
  return useQuery({
    queryKey: placesKeys.detail(placeId!),
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/places/${placeId}`);

      if (!response.ok) {
        throw new ApiError(API_ERROR_CODES.NOT_FOUND, 'Place not found');
      }

      return response.json() as Promise<Place>;
    },
    enabled: !!placeId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ============================================================================
// Debounced Search Hook
// ============================================================================

/**
 * Places search with debouncing for text input
 *
 * @example
 * const { query, setQuery, results, isSearching } = useDebouncedPlaceSearch();
 */
export function useDebouncedPlaceSearch(
  coordinates: PlaceCoordinates | null,
  delayMs = 300
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [query, delayMs]);

  const searchQuery = useQuery({
    queryKey: ['places', 'text-search', debouncedQuery, coordinates],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !coordinates) {
        return [];
      }

      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/places/text-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: debouncedQuery,
          coordinates,
          radiusKm: 20,
        }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.places || []) as Place[];
    },
    enabled: debouncedQuery.length >= 2 && !!coordinates,
    staleTime: 5 * 60 * 1000,
  });

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    setQuery,
    results: searchQuery.data || [],
    isSearching: searchQuery.isLoading,
    clearSearch,
  };
}

// ============================================================================
// Prefetch Hooks
// ============================================================================

/**
 * Prefetch places for upcoming cities
 */
export function usePrefetchCityPlaces() {
  const queryClient = useQueryClient();

  return useCallback(
    (coordinates: PlaceCoordinates, cityId: string) => {
      queryClient.prefetchQuery({
        queryKey: placesKeys.search({
          coordinates,
          radiusKm: 10,
          hiddenGemsOnly: false,
        }),
        queryFn: async () => {
          const locationHash = generateLocationHash(coordinates, 10);
          const cached = await checkPlacesCache(locationHash);
          if (cached) return cached.places_data as unknown as Place[];

          const places = await fetchPlacesFromAPI({
            coordinates,
            radiusKm: 10,
          });
          const scoredPlaces = scoreHiddenGems(places);
          await storePlacesCache(locationHash, cityId, scoredPlaces);
          return scoredPlaces;
        },
        staleTime: 15 * 60 * 1000,
      });
    },
    [queryClient]
  );
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Filter and sort places by preferences
 */
export function useFilteredPlaces(
  places: Place[] | undefined,
  filters: {
    categories?: string[];
    minRating?: number;
    hiddenGemsOnly?: boolean;
    openNow?: boolean;
  }
) {
  if (!places) return [];

  return places
    .filter((place) => {
      if (filters.categories?.length && !filters.categories.includes(place.category || '')) {
        return false;
      }
      if (filters.minRating && (place.rating || 0) < filters.minRating) {
        return false;
      }
      if (filters.hiddenGemsOnly && !place.isHiddenGem) {
        return false;
      }
      if (filters.openNow && !place.openNow) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by hidden gem score, then rating
      if (filters.hiddenGemsOnly) {
        return (b.hiddenGemScore || 0) - (a.hiddenGemScore || 0);
      }
      return (b.rating || 0) - (a.rating || 0);
    });
}
