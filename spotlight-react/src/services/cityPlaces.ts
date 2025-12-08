/**
 * City Places Service
 * WI-2.3: Fetches all relevant places for a given city
 *
 * This service aggregates places across multiple categories for a city,
 * applies hidden gem filtering, and returns a rich response optimized
 * for the discovery phase UI.
 *
 * Architecture Decisions:
 * - Parallel requests for each category to minimize load time
 * - City-level caching with configurable TTL
 * - Background refresh to keep data fresh without blocking UI
 * - Leverages hiddenGems service for core API calls
 * - Uses placeCategories for consistent categorization
 *
 * Performance Optimizations:
 * - Promise.allSettled for parallel category fetches
 * - Stale-while-revalidate pattern for cache freshness
 * - Deduplicated places across categories
 */

import {
  type HiddenGemPlace,
  type HiddenGemPlaceType,
  type Coordinates,
  searchHiddenGems,
  generateMockHiddenGems,
} from './hiddenGems';

import {
  type WaycraftCategory,
  getPrimaryCategory,
  groupByCategory,
  countByCategory,
  getDiscoveryCategories,
  CATEGORY_META,
} from '../utils/placeCategories';

// ============================================================================
// Types
// ============================================================================

/**
 * Place with category information added
 */
export interface CategorizedPlace extends HiddenGemPlace {
  /** Primary Waycraft category */
  category: WaycraftCategory;
}

/**
 * Stats for a city's places
 */
export interface CityPlacesStats {
  /** Total places found */
  totalCount: number;
  /** Number of hidden gems */
  hiddenGemCount: number;
  /** Average rating across all places */
  averageRating: number;
  /** Count per category */
  byCategory: Record<WaycraftCategory, number>;
  /** Hidden gem count per category */
  hiddenGemsByCategory: Record<WaycraftCategory, number>;
}

/**
 * Top places for a category
 */
export interface CategoryTopPlaces {
  category: WaycraftCategory;
  label: string;
  icon: string;
  places: CategorizedPlace[];
  totalInCategory: number;
}

/**
 * Full city places response
 */
export interface CityPlacesResponse {
  /** City identifier (coordinates as string) */
  cityId: string;
  /** City name (if provided) */
  cityName?: string;
  /** Search location */
  location: Coordinates;
  /** Search radius used */
  radius: number;

  /** All places found */
  allPlaces: CategorizedPlace[];
  /** Only hidden gems */
  hiddenGems: CategorizedPlace[];
  /** Top places by category (for category tabs/sections) */
  topByCategory: CategoryTopPlaces[];
  /** Aggregated statistics */
  stats: CityPlacesStats;

  /** Cache metadata */
  meta: {
    /** When this data was fetched */
    fetchedAt: Date;
    /** Whether data came from cache */
    fromCache: boolean;
    /** Whether cache is stale (background refresh triggered) */
    isStale: boolean;
    /** Categories that had errors (partial results) */
    failedCategories: WaycraftCategory[];
  };
}

/**
 * Fetch options
 */
export interface FetchCityPlacesOptions {
  /** Search radius in meters (default: 15000 for city coverage) */
  radius?: number;
  /** Categories to fetch (default: all discovery categories) */
  categories?: WaycraftCategory[];
  /** Number of top places per category (default: 5) */
  topPerCategory?: number;
  /** Skip cache and force fresh fetch */
  forceRefresh?: boolean;
  /** Use mock data (for development) */
  useMock?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Default search radius for city-wide coverage (15km) */
const DEFAULT_CITY_RADIUS = 15000;

/** Default number of top places per category */
const DEFAULT_TOP_PER_CATEGORY = 5;

/** Cache TTL in milliseconds (30 minutes) */
const CACHE_TTL = 30 * 60 * 1000;

/** Stale threshold - after this, trigger background refresh (15 minutes) */
const STALE_THRESHOLD = 15 * 60 * 1000;

/** Maximum places to fetch per category */
const MAX_PLACES_PER_CATEGORY = 15;

/**
 * Map Waycraft categories to Google Places types for searching
 */
const CATEGORY_TO_SEARCH_TYPES: Record<WaycraftCategory, HiddenGemPlaceType[]> = {
  food_drink: ['restaurant', 'cafe', 'bar', 'bakery'],
  culture: ['museum', 'art_gallery'],
  nature: ['park', 'natural_feature'],
  nightlife: ['bar'], // Will be filtered to nightlife-specific
  shopping: ['store', 'market'],
  activities: ['tourist_attraction', 'point_of_interest'],
  wellness: [], // Less common, skip for now
  services: [], // Not relevant for discovery
  accommodation: [], // Not relevant for discovery
  other: [],
};

// ============================================================================
// City Cache
// ============================================================================

interface CityCacheEntry {
  data: CityPlacesResponse;
  fetchedAt: Date;
  expiresAt: Date;
}

class CityPlacesCache {
  private cache: Map<string, CityCacheEntry> = new Map();
  private refreshingCities: Set<string> = new Set();

  /**
   * Generate cache key for a city
   */
  private generateKey(location: Coordinates, radius: number): string {
    // Round coordinates to ~1km precision for cache hits
    const lat = Math.round(location.lat * 100) / 100;
    const lng = Math.round(location.lng * 100) / 100;
    return `${lat},${lng}:${radius}`;
  }

  /**
   * Get cached data for a city
   */
  get(location: Coordinates, radius: number): {
    data: CityPlacesResponse | null;
    isStale: boolean;
  } {
    const key = this.generateKey(location, radius);
    const entry = this.cache.get(key);

    if (!entry) {
      return { data: null, isStale: false };
    }

    const now = new Date();

    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return { data: null, isStale: false };
    }

    // Check if stale (but still usable)
    const isStale = now.getTime() - entry.fetchedAt.getTime() > STALE_THRESHOLD;

    return {
      data: {
        ...entry.data,
        meta: {
          ...entry.data.meta,
          fromCache: true,
          isStale,
        },
      },
      isStale,
    };
  }

  /**
   * Store city data in cache
   */
  set(location: Coordinates, radius: number, data: CityPlacesResponse): void {
    const key = this.generateKey(location, radius);
    const now = new Date();

    this.cache.set(key, {
      data,
      fetchedAt: now,
      expiresAt: new Date(now.getTime() + CACHE_TTL),
    });

    // Cleanup old entries
    this.cleanup();
  }

  /**
   * Check if a city is currently being refreshed
   */
  isRefreshing(location: Coordinates, radius: number): boolean {
    return this.refreshingCities.has(this.generateKey(location, radius));
  }

  /**
   * Mark a city as being refreshed
   */
  setRefreshing(location: Coordinates, radius: number, refreshing: boolean): void {
    const key = this.generateKey(location, radius);
    if (refreshing) {
      this.refreshingCities.add(key);
    } else {
      this.refreshingCities.delete(key);
    }
  }

  /**
   * Remove old cache entries
   */
  private cleanup(): void {
    const now = new Date();
    const maxEntries = 50; // Keep cache size reasonable

    // Remove expired
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // If still too many, remove oldest
    if (this.cache.size > maxEntries) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].fetchedAt.getTime() - b[1].fetchedAt.getTime());

      const toRemove = entries.slice(0, this.cache.size - maxEntries);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.refreshingCities.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; refreshing: number } {
    return {
      size: this.cache.size,
      refreshing: this.refreshingCities.size,
    };
  }
}

// Singleton cache instance
const cityCache = new CityPlacesCache();

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate a city ID from coordinates
 */
function generateCityId(location: Coordinates): string {
  return `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
}

/**
 * Add category to a place
 */
function categorizePlaces(places: HiddenGemPlace[]): CategorizedPlace[] {
  return places.map((place) => ({
    ...place,
    category: getPrimaryCategory(place.types),
  }));
}

/**
 * Deduplicate places by placeId
 */
function deduplicatePlaces(places: CategorizedPlace[]): CategorizedPlace[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    if (seen.has(place.placeId)) return false;
    seen.add(place.placeId);
    return true;
  });
}

/**
 * Calculate stats from places
 */
function calculateStats(places: CategorizedPlace[]): CityPlacesStats {
  const hiddenGems = places.filter((p) => p.isHiddenGem);
  const totalRating = places.reduce((sum, p) => sum + p.rating, 0);

  // Count by category
  const byCategory = countByCategory(places);

  // Hidden gems by category
  const hiddenGemsByCategory: Record<WaycraftCategory, number> = {
    food_drink: 0,
    culture: 0,
    nature: 0,
    nightlife: 0,
    shopping: 0,
    activities: 0,
    wellness: 0,
    services: 0,
    accommodation: 0,
    other: 0,
  };

  hiddenGems.forEach((place) => {
    hiddenGemsByCategory[place.category]++;
  });

  return {
    totalCount: places.length,
    hiddenGemCount: hiddenGems.length,
    averageRating: places.length > 0 ? Math.round((totalRating / places.length) * 10) / 10 : 0,
    byCategory,
    hiddenGemsByCategory,
  };
}

/**
 * Build top places by category
 */
function buildTopByCategory(
  places: CategorizedPlace[],
  topCount: number
): CategoryTopPlaces[] {
  const grouped = groupByCategory(places);
  const categories = getDiscoveryCategories();

  return categories
    .map((category) => {
      const categoryPlaces = grouped[category] || [];

      // Sort by hidden gem score, then rating
      const sorted = [...categoryPlaces].sort((a, b) => {
        if (a.isHiddenGem !== b.isHiddenGem) {
          return a.isHiddenGem ? -1 : 1;
        }
        if (a.hiddenGemScore !== b.hiddenGemScore) {
          return b.hiddenGemScore - a.hiddenGemScore;
        }
        return b.rating - a.rating;
      });

      const meta = CATEGORY_META[category];

      return {
        category,
        label: meta.label,
        icon: meta.icon,
        places: sorted.slice(0, topCount),
        totalInCategory: categoryPlaces.length,
      };
    })
    .filter((cat) => cat.totalInCategory > 0); // Only categories with places
}

/**
 * Fetch places for a single category
 */
async function fetchCategoryPlaces(
  location: Coordinates,
  radius: number,
  category: WaycraftCategory,
  useMock: boolean
): Promise<{ category: WaycraftCategory; places: HiddenGemPlace[]; error?: string }> {
  const searchTypes = CATEGORY_TO_SEARCH_TYPES[category];

  // Skip categories without search types
  if (!searchTypes || searchTypes.length === 0) {
    return { category, places: [] };
  }

  try {
    if (useMock) {
      // Generate mock data for development
      const mockPlaces = generateMockHiddenGems(location, MAX_PLACES_PER_CATEGORY);
      // Assign types based on category
      const typedPlaces = mockPlaces.map((place) => ({
        ...place,
        types: [searchTypes[0], 'point_of_interest', 'establishment'],
      }));
      return { category, places: typedPlaces };
    }

    const response = await searchHiddenGems({
      location,
      radius,
      types: searchTypes,
      limit: MAX_PLACES_PER_CATEGORY,
    });

    return { category, places: response.places };
  } catch (error) {
    console.warn(`Failed to fetch ${category} places:`, error);
    return {
      category,
      places: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch all places for a city
 *
 * Main entry point for the city places service.
 * Makes parallel requests for each category and aggregates results.
 *
 * @param location City center coordinates
 * @param cityName Optional city name for display
 * @param options Fetch options
 * @returns Promise with full city places response
 */
export async function fetchCityPlaces(
  location: Coordinates,
  cityName?: string,
  options: FetchCityPlacesOptions = {}
): Promise<CityPlacesResponse> {
  const {
    radius = DEFAULT_CITY_RADIUS,
    categories = getDiscoveryCategories(),
    topPerCategory = DEFAULT_TOP_PER_CATEGORY,
    forceRefresh = false,
    useMock = false,
  } = options;

  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = cityCache.get(location, radius);

    if (cached.data) {
      // If stale, trigger background refresh
      if (cached.isStale && !cityCache.isRefreshing(location, radius)) {
        // Fire and forget background refresh
        backgroundRefresh(location, cityName, options);
      }
      return cached.data;
    }
  }

  // Fetch fresh data
  return fetchFreshCityPlaces(location, cityName, {
    ...options,
    radius,
    categories,
    topPerCategory,
    useMock,
  });
}

/**
 * Fetch fresh city places (bypasses cache)
 */
async function fetchFreshCityPlaces(
  location: Coordinates,
  cityName: string | undefined,
  options: Required<Omit<FetchCityPlacesOptions, 'forceRefresh'>> & { forceRefresh?: boolean }
): Promise<CityPlacesResponse> {
  const { radius, categories, topPerCategory, useMock } = options;

  // Parallel fetch for all categories
  const categoryPromises = categories.map((category) =>
    fetchCategoryPlaces(location, radius, category, useMock)
  );

  const results = await Promise.allSettled(categoryPromises);

  // Collect results and track failures
  const allPlaces: HiddenGemPlace[] = [];
  const failedCategories: WaycraftCategory[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const { places, error } = result.value;
      allPlaces.push(...places);
      if (error) {
        failedCategories.push(categories[index]);
      }
    } else {
      failedCategories.push(categories[index]);
    }
  });

  // Categorize and deduplicate
  const categorizedPlaces = categorizePlaces(allPlaces);
  const uniquePlaces = deduplicatePlaces(categorizedPlaces);

  // Sort by hidden gem score
  const sortedPlaces = [...uniquePlaces].sort((a, b) => {
    if (a.isHiddenGem !== b.isHiddenGem) {
      return a.isHiddenGem ? -1 : 1;
    }
    return b.hiddenGemScore - a.hiddenGemScore;
  });

  // Build response
  const response: CityPlacesResponse = {
    cityId: generateCityId(location),
    cityName,
    location,
    radius,
    allPlaces: sortedPlaces,
    hiddenGems: sortedPlaces.filter((p) => p.isHiddenGem),
    topByCategory: buildTopByCategory(sortedPlaces, topPerCategory),
    stats: calculateStats(sortedPlaces),
    meta: {
      fetchedAt: new Date(),
      fromCache: false,
      isStale: false,
      failedCategories,
    },
  };

  // Cache the response
  cityCache.set(location, radius, response);

  return response;
}

/**
 * Background refresh for stale cache
 */
async function backgroundRefresh(
  location: Coordinates,
  cityName: string | undefined,
  options: FetchCityPlacesOptions
): Promise<void> {
  const radius = options.radius || DEFAULT_CITY_RADIUS;

  // Mark as refreshing to prevent duplicate refreshes
  cityCache.setRefreshing(location, radius, true);

  try {
    await fetchFreshCityPlaces(location, cityName, {
      radius,
      categories: options.categories || getDiscoveryCategories(),
      topPerCategory: options.topPerCategory || DEFAULT_TOP_PER_CATEGORY,
      useMock: options.useMock || false,
    });
  } catch (error) {
    console.warn('Background refresh failed:', error);
  } finally {
    cityCache.setRefreshing(location, radius, false);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get just the hidden gems for a city
 */
export async function fetchCityHiddenGems(
  location: Coordinates,
  cityName?: string,
  options?: Omit<FetchCityPlacesOptions, 'topPerCategory'>
): Promise<CategorizedPlace[]> {
  const response = await fetchCityPlaces(location, cityName, options);
  return response.hiddenGems;
}

/**
 * Get places for a specific category in a city
 */
export async function fetchCityCategoryPlaces(
  location: Coordinates,
  category: WaycraftCategory,
  options?: Omit<FetchCityPlacesOptions, 'categories'>
): Promise<CategorizedPlace[]> {
  const response = await fetchCityPlaces(location, undefined, {
    ...options,
    categories: [category],
  });
  return response.allPlaces;
}

/**
 * Prefetch places for multiple cities (e.g., along a route)
 * Returns immediately, fetches in background
 */
export function prefetchCitiesPlaces(
  cities: Array<{ location: Coordinates; name?: string }>,
  options?: FetchCityPlacesOptions
): void {
  // Stagger requests to avoid overwhelming the API
  cities.forEach((city, index) => {
    setTimeout(() => {
      fetchCityPlaces(city.location, city.name, options).catch((error) => {
        console.warn(`Prefetch failed for ${city.name || 'city'}:`, error);
      });
    }, index * 500); // 500ms between each city
  });
}

/**
 * Clear the city places cache
 */
export function clearCityPlacesCache(): void {
  cityCache.clear();
}

/**
 * Get cache statistics
 */
export function getCityPlacesCacheStats(): { size: number; refreshing: number } {
  return cityCache.getStats();
}

// ============================================================================
// Mock Data Generator
// ============================================================================

/**
 * Generate mock city places response (for development/testing)
 */
export function generateMockCityPlaces(
  location: Coordinates,
  cityName?: string
): CityPlacesResponse {
  const mockPlaces = generateMockHiddenGems(location, 50);

  // Distribute across categories
  const categories = getDiscoveryCategories();
  const categorizedPlaces: CategorizedPlace[] = mockPlaces.map((place, index) => ({
    ...place,
    category: categories[index % categories.length],
    types: [CATEGORY_TO_SEARCH_TYPES[categories[index % categories.length]][0] || 'point_of_interest'],
  }));

  return {
    cityId: generateCityId(location),
    cityName,
    location,
    radius: DEFAULT_CITY_RADIUS,
    allPlaces: categorizedPlaces,
    hiddenGems: categorizedPlaces.filter((p) => p.isHiddenGem),
    topByCategory: buildTopByCategory(categorizedPlaces, DEFAULT_TOP_PER_CATEGORY),
    stats: calculateStats(categorizedPlaces),
    meta: {
      fetchedAt: new Date(),
      fromCache: false,
      isStale: false,
      failedCategories: [],
    },
  };
}
