/**
 * Hidden Gems Service
 * WI-2.1: Core service for discovering hidden gem places
 *
 * This service queries the Google Places API and applies the hidden gems algorithm
 * to surface high-quality, lesser-known spots that make road trips special.
 *
 * Hidden Gem Criteria:
 * - Rating >= 4.3 (high quality)
 * - Review count 10-150 (not brand new, not over-touristy)
 *
 * Architecture:
 * - Frontend service calls backend API (which proxies to Google Places)
 * - Caching layer to avoid redundant API calls
 * - Rate limiting to stay within API quotas
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Coordinates for location-based searches
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Photo reference from Google Places
 */
export interface PhotoReference {
  reference: string;
  width: number;
  height: number;
  /** Resolved URL (if available) */
  url?: string;
}

/**
 * Opening hours information
 */
export interface OpeningHours {
  openNow: boolean;
  weekdayText?: string[];
  periods?: Array<{
    open: { day: number; time: string };
    close?: { day: number; time: string };
  }>;
}

/**
 * Place types we search for (aligned with Google Places types)
 */
export type HiddenGemPlaceType =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'bakery'
  | 'museum'
  | 'art_gallery'
  | 'park'
  | 'tourist_attraction'
  | 'point_of_interest'
  | 'store'
  | 'market'
  | 'viewpoint'
  | 'natural_feature';

/**
 * Search request parameters
 */
export interface HiddenGemSearchRequest {
  /** Location to search around */
  location: Coordinates;
  /** Search radius in meters (default: 5000) */
  radius?: number;
  /** Place types to search for (default: all) */
  types?: HiddenGemPlaceType[];
  /** Minimum rating threshold (default: 4.3) */
  minRating?: number;
  /** Maximum review count for hidden gem status (default: 150) */
  maxReviewCount?: number;
  /** Minimum review count to filter suspicious places (default: 10) */
  minReviewCount?: number;
  /** Maximum number of results (default: 20) */
  limit?: number;
  /** Optional keyword for text search */
  keyword?: string;
}

/**
 * Core hidden gem place data structure
 */
export interface HiddenGemPlace {
  /** Google Places ID */
  placeId: string;
  /** Place name */
  name: string;
  /** Coordinates */
  coordinates: Coordinates;
  /** Rating (1-5) */
  rating: number;
  /** Number of reviews */
  reviewCount: number;
  /** Google Places types */
  types: string[];
  /** Price level (1-4, null if unavailable) */
  priceLevel: number | null;
  /** Photo references */
  photos: PhotoReference[];
  /** Opening hours (null if unavailable) */
  openingHours: OpeningHours | null;
  /**
   * Hidden gem score (0-1)
   * Higher = better hidden gem
   * Formula: (rating - 4.0) * reviewScarcityFactor
   * where reviewScarcityFactor = 1 - (reviewCount / maxReviewCount)
   */
  hiddenGemScore: number;
  /** Whether this qualifies as a hidden gem */
  isHiddenGem: boolean;
  /** Optional address */
  address?: string;
  /** Optional brief description/editorial summary */
  editorialSummary?: string;
  /** Distance from search location in meters */
  distanceMeters?: number;
}

/**
 * Search response
 */
export interface HiddenGemSearchResponse {
  /** Found places, sorted by hidden gem score */
  places: HiddenGemPlace[];
  /** Total count before limiting */
  totalCount: number;
  /** Search metadata */
  meta: {
    /** Search location */
    location: Coordinates;
    /** Radius used */
    radius: number;
    /** Types searched */
    types: HiddenGemPlaceType[];
    /** Whether results came from cache */
    fromCache: boolean;
    /** Cache timestamp if from cache */
    cacheTimestamp?: Date;
  };
}

// ============================================================================
// Constants
// ============================================================================

/** Default search radius in meters (5km) */
const DEFAULT_RADIUS = 5000;

/** Default minimum rating for hidden gems */
const DEFAULT_MIN_RATING = 4.3;

/** Default maximum review count for hidden gem status */
const DEFAULT_MAX_REVIEW_COUNT = 150;

/** Default minimum review count to filter suspicious places */
const DEFAULT_MIN_REVIEW_COUNT = 10;

/** Default result limit */
const DEFAULT_LIMIT = 20;

/** Cache TTL in milliseconds (1 hour - places don't change frequently) */
const CACHE_TTL = 60 * 60 * 1000;

/** Rate limit: max requests per minute */
const RATE_LIMIT_MAX_REQUESTS = 30;

/** Rate limit window in milliseconds (1 minute) */
const RATE_LIMIT_WINDOW = 60 * 1000;

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'
);

// ============================================================================
// Caching Layer
// ============================================================================

interface CacheEntry {
  data: HiddenGemSearchResponse;
  timestamp: Date;
  expiresAt: Date;
}

class HiddenGemsCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Generate a cache key from search parameters
   */
  private generateKey(request: HiddenGemSearchRequest): string {
    const { location, radius, types, minRating, maxReviewCount, keyword } = request;
    return JSON.stringify({
      lat: Math.round(location.lat * 1000) / 1000, // Round to ~100m precision
      lng: Math.round(location.lng * 1000) / 1000,
      radius: radius || DEFAULT_RADIUS,
      types: (types || []).sort(),
      minRating: minRating || DEFAULT_MIN_RATING,
      maxReviewCount: maxReviewCount || DEFAULT_MAX_REVIEW_COUNT,
      keyword: keyword || '',
    });
  }

  /**
   * Get cached response if valid
   */
  get(request: HiddenGemSearchRequest): HiddenGemSearchResponse | null {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return {
      ...entry.data,
      meta: {
        ...entry.data.meta,
        fromCache: true,
        cacheTimestamp: entry.timestamp,
      },
    };
  }

  /**
   * Store response in cache
   */
  set(request: HiddenGemSearchRequest, response: HiddenGemSearchResponse): void {
    const key = this.generateKey(request);
    const now = new Date();

    this.cache.set(key, {
      data: response,
      timestamp: now,
      expiresAt: new Date(now.getTime() + CACHE_TTL),
    });

    // Cleanup old entries (keep cache size reasonable)
    this.cleanup();
  }

  /**
   * Remove expired entries and limit cache size
   */
  private cleanup(): void {
    const now = new Date();
    const maxEntries = 100;

    // Remove expired
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // If still too many, remove oldest
    if (this.cache.size > maxEntries) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());

      const toRemove = entries.slice(0, this.cache.size - maxEntries);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): { size: number; oldestEntry: Date | null } {
    let oldest: Date | null = null;
    for (const entry of this.cache.values()) {
      if (!oldest || entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
    }
    return { size: this.cache.size, oldestEntry: oldest };
  }
}

// Singleton cache instance
const cache = new HiddenGemsCache();

// ============================================================================
// Rate Limiting
// ============================================================================

class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request can be made
   */
  canMakeRequest(): boolean {
    this.cleanup();
    return this.timestamps.length < this.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(): void {
    this.timestamps.push(Date.now());
  }

  /**
   * Get time until next available request slot (in ms)
   */
  getWaitTime(): number {
    this.cleanup();
    if (this.timestamps.length < this.maxRequests) return 0;

    const oldestInWindow = this.timestamps[0];
    const nextAvailable = oldestInWindow + this.windowMs;
    return Math.max(0, nextAvailable - Date.now());
  }

  /**
   * Remove timestamps outside the window
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((ts) => ts > cutoff);
  }

  /**
   * Get current usage stats
   */
  getStats(): { used: number; max: number; windowMs: number } {
    this.cleanup();
    return {
      used: this.timestamps.length,
      max: this.maxRequests,
      windowMs: this.windowMs,
    };
  }
}

// Singleton rate limiter instance
const rateLimiter = new RateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW);

// ============================================================================
// Scoring Algorithm
// ============================================================================

/**
 * Calculate the hidden gem score for a place
 *
 * Formula: (rating - 4.0) * reviewScarcityFactor
 * where reviewScarcityFactor = 1 - (reviewCount / maxReviewCount)
 *
 * This rewards:
 * - Higher ratings (above 4.0 baseline)
 * - Fewer reviews (more "hidden")
 *
 * @param rating Place rating (1-5)
 * @param reviewCount Number of reviews
 * @param maxReviewCount Maximum review count threshold
 * @returns Score between 0 and 1
 */
export function calculateHiddenGemScore(
  rating: number,
  reviewCount: number,
  maxReviewCount: number = DEFAULT_MAX_REVIEW_COUNT
): number {
  // Normalize rating contribution (0-1 scale from 4.0-5.0)
  const ratingContribution = Math.max(0, Math.min(1, rating - 4.0));

  // Calculate review scarcity factor (1 = very few reviews, 0 = at threshold)
  const reviewScarcityFactor = Math.max(0, 1 - reviewCount / maxReviewCount);

  // Combined score
  const score = ratingContribution * reviewScarcityFactor;

  // Normalize to 0-1 range
  return Math.round(score * 1000) / 1000;
}

/**
 * Determine if a place qualifies as a hidden gem
 */
export function isHiddenGem(
  rating: number,
  reviewCount: number,
  config: {
    minRating?: number;
    minReviewCount?: number;
    maxReviewCount?: number;
  } = {}
): boolean {
  const {
    minRating = DEFAULT_MIN_RATING,
    minReviewCount = DEFAULT_MIN_REVIEW_COUNT,
    maxReviewCount = DEFAULT_MAX_REVIEW_COUNT,
  } = config;

  return (
    rating >= minRating &&
    reviewCount >= minReviewCount &&
    reviewCount <= maxReviewCount
  );
}

// ============================================================================
// API Integration
// ============================================================================

/**
 * Get auth headers for API requests
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Transform raw API response to HiddenGemPlace
 */
function transformPlace(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawPlace: any,
  searchLocation: Coordinates,
  maxReviewCount: number
): HiddenGemPlace {
  const rating = rawPlace.rating || 0;
  const reviewCount = rawPlace.user_ratings_total || rawPlace.reviewCount || 0;

  // Calculate distance from search location
  const placeCoords = rawPlace.geometry?.location || rawPlace.coordinates || {};
  const distanceMeters = calculateDistance(
    searchLocation.lat,
    searchLocation.lng,
    placeCoords.lat || 0,
    placeCoords.lng || 0
  );

  // Transform photos
  const photos: PhotoReference[] = (rawPlace.photos || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (photo: any) => ({
      reference: photo.photo_reference || photo.reference || '',
      width: photo.width || 400,
      height: photo.height || 300,
      url: photo.url,
    })
  );

  // Transform opening hours
  let openingHours: OpeningHours | null = null;
  if (rawPlace.opening_hours || rawPlace.openingHours) {
    const hours = rawPlace.opening_hours || rawPlace.openingHours;
    openingHours = {
      openNow: hours.open_now ?? hours.openNow ?? false,
      weekdayText: hours.weekday_text || hours.weekdayText,
      periods: hours.periods,
    };
  }

  return {
    placeId: rawPlace.place_id || rawPlace.placeId || rawPlace.id,
    name: rawPlace.name,
    coordinates: {
      lat: placeCoords.lat || 0,
      lng: placeCoords.lng || 0,
    },
    rating,
    reviewCount,
    types: rawPlace.types || [],
    priceLevel: rawPlace.price_level ?? rawPlace.priceLevel ?? null,
    photos,
    openingHours,
    hiddenGemScore: calculateHiddenGemScore(rating, reviewCount, maxReviewCount),
    isHiddenGem: isHiddenGem(rating, reviewCount, { maxReviewCount }),
    address: rawPlace.vicinity || rawPlace.formatted_address || rawPlace.address,
    editorialSummary: rawPlace.editorial_summary?.overview || rawPlace.editorialSummary,
    distanceMeters,
  };
}

/**
 * Search for hidden gem places near a location
 *
 * @param request Search parameters
 * @returns Promise with hidden gem places
 * @throws Error if rate limited or API error
 */
export async function searchHiddenGems(
  request: HiddenGemSearchRequest
): Promise<HiddenGemSearchResponse> {
  const {
    location,
    radius = DEFAULT_RADIUS,
    types = [],
    minRating = DEFAULT_MIN_RATING,
    maxReviewCount = DEFAULT_MAX_REVIEW_COUNT,
    minReviewCount = DEFAULT_MIN_REVIEW_COUNT,
    limit = DEFAULT_LIMIT,
    keyword,
  } = request;

  // Check cache first
  const cached = cache.get(request);
  if (cached) {
    return cached;
  }

  // Check rate limit
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getWaitTime();
    throw new Error(
      `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
    );
  }

  // Build query parameters
  const params = new URLSearchParams({
    lat: location.lat.toString(),
    lng: location.lng.toString(),
    radius: radius.toString(),
    minRating: minRating.toString(),
    maxReviews: maxReviewCount.toString(),
    minReviews: minReviewCount.toString(),
    limit: limit.toString(),
  });

  if (types.length > 0) {
    params.set('types', types.join(','));
  }

  if (keyword) {
    params.set('keyword', keyword);
  }

  // Make API request
  rateLimiter.recordRequest();

  const response = await fetch(
    `${API_BASE_URL}/hidden-gems?${params.toString()}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to fetch hidden gems: ${response.statusText}`);
  }

  const data = await response.json();

  // Transform and filter places
  const places: HiddenGemPlace[] = (data.places || data.results || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((place: any) => transformPlace(place, location, maxReviewCount))
    .filter((place: HiddenGemPlace) =>
      isHiddenGem(place.rating, place.reviewCount, {
        minRating,
        minReviewCount,
        maxReviewCount,
      })
    )
    .sort((a: HiddenGemPlace, b: HiddenGemPlace) => b.hiddenGemScore - a.hiddenGemScore)
    .slice(0, limit);

  const result: HiddenGemSearchResponse = {
    places,
    totalCount: places.length,
    meta: {
      location,
      radius,
      types: types.length > 0 ? types : ['all' as HiddenGemPlaceType],
      fromCache: false,
    },
  };

  // Cache the result
  cache.set(request, result);

  return result;
}

/**
 * Search for hidden gems in a specific city
 * Convenience wrapper around searchHiddenGems
 *
 * @param _cityName City name (for logging/context, coords used for actual search)
 * @param cityCoordinates City center coordinates
 * @param options Additional search options
 */
export async function searchHiddenGemsInCity(
  _cityName: string,
  cityCoordinates: Coordinates,
  options: Partial<Omit<HiddenGemSearchRequest, 'location'>> = {}
): Promise<HiddenGemSearchResponse> {
  return searchHiddenGems({
    location: cityCoordinates,
    radius: options.radius || 8000, // Larger radius for city-wide search
    ...options,
  });
}

/**
 * Search for hidden gems along a route
 * Takes multiple points and searches around each
 */
export async function searchHiddenGemsAlongRoute(
  waypoints: Coordinates[],
  options: Partial<Omit<HiddenGemSearchRequest, 'location'>> = {}
): Promise<Map<string, HiddenGemSearchResponse>> {
  const results = new Map<string, HiddenGemSearchResponse>();

  // Search around each waypoint (with staggered delays to avoid rate limits)
  for (let i = 0; i < waypoints.length; i++) {
    const waypoint = waypoints[i];
    const key = `${waypoint.lat.toFixed(4)},${waypoint.lng.toFixed(4)}`;

    try {
      const response = await searchHiddenGems({
        location: waypoint,
        ...options,
      });
      results.set(key, response);
    } catch (error) {
      console.warn(`Failed to search hidden gems at waypoint ${i}:`, error);
      // Continue with other waypoints
    }

    // Small delay between requests
    if (i < waypoints.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a photo URL from a photo reference
 * (Assumes backend provides a proxy endpoint)
 */
export function getPhotoUrl(
  photoReference: string,
  maxWidth: number = 400
): string {
  if (!photoReference) return '';

  // If already a full URL, return as-is
  if (photoReference.startsWith('http')) {
    return photoReference;
  }

  // Otherwise, use backend proxy
  return `${API_BASE_URL}/places/photo?reference=${encodeURIComponent(
    photoReference
  )}&maxwidth=${maxWidth}`;
}

/**
 * Get the primary type for display
 */
export function getPrimaryType(types: string[]): string {
  // Priority order for display
  const priorityTypes = [
    'restaurant',
    'cafe',
    'bar',
    'bakery',
    'museum',
    'art_gallery',
    'park',
    'tourist_attraction',
    'store',
    'market',
  ];

  for (const type of priorityTypes) {
    if (types.includes(type)) {
      return type.replace(/_/g, ' ');
    }
  }

  return types[0]?.replace(/_/g, ' ') || 'place';
}

/**
 * Format price level to dollar signs
 */
export function formatPriceLevel(level: number | null): string {
  if (level === null || level === undefined) return '';
  return '$'.repeat(Math.min(4, Math.max(1, level)));
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export function getCacheStats(): { size: number; oldestEntry: Date | null } {
  return cache.getStats();
}

/**
 * Get rate limiter statistics (for debugging/monitoring)
 */
export function getRateLimitStats(): {
  used: number;
  max: number;
  windowMs: number;
} {
  return rateLimiter.getStats();
}

/**
 * Clear the cache (useful for testing or forced refresh)
 */
export function clearCache(): void {
  cache.clear();
}

// ============================================================================
// Mock Data (for development/testing without backend)
// ============================================================================

/**
 * Generate mock hidden gem data for development
 */
export function generateMockHiddenGems(
  location: Coordinates,
  count: number = 10
): HiddenGemPlace[] {
  const mockNames = [
    "Artisan's Corner Café",
    'The Secret Garden Bistro',
    "Grandma's Kitchen",
    'Hidden Valley Vineyards',
    'The Cozy Bookshelf',
    'Sunset Point Lookout',
    "Local's Favorite Diner",
    'The Ancient Oak Gallery',
    'Riverside Roasters',
    'Moonlight Bakery',
    'The Wanderer\'s Rest',
    'Heritage Market',
    'The Quiet Nook',
    "Farmer's Table",
    'Starlight Cinema',
  ];

  const mockTypes: HiddenGemPlaceType[] = [
    'restaurant',
    'cafe',
    'bar',
    'museum',
    'park',
    'store',
    'market',
  ];

  return Array.from({ length: count }, (_, i) => {
    const rating = 4.3 + Math.random() * 0.7; // 4.3 - 5.0
    const reviewCount = 10 + Math.floor(Math.random() * 140); // 10 - 150
    const type = mockTypes[Math.floor(Math.random() * mockTypes.length)];

    return {
      placeId: `mock-${Date.now()}-${i}`,
      name: mockNames[i % mockNames.length],
      coordinates: {
        lat: location.lat + (Math.random() - 0.5) * 0.05,
        lng: location.lng + (Math.random() - 0.5) * 0.05,
      },
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      types: [type, 'point_of_interest', 'establishment'],
      priceLevel: Math.floor(Math.random() * 3) + 1,
      photos: [],
      openingHours: {
        openNow: Math.random() > 0.3,
        weekdayText: [
          'Monday: 9:00 AM – 9:00 PM',
          'Tuesday: 9:00 AM – 9:00 PM',
          'Wednesday: 9:00 AM – 9:00 PM',
          'Thursday: 9:00 AM – 9:00 PM',
          'Friday: 9:00 AM – 10:00 PM',
          'Saturday: 10:00 AM – 10:00 PM',
          'Sunday: 10:00 AM – 6:00 PM',
        ],
      },
      hiddenGemScore: calculateHiddenGemScore(rating, reviewCount),
      isHiddenGem: true,
      address: `${100 + i} Main Street`,
      distanceMeters: Math.floor(Math.random() * 5000),
    };
  }).sort((a, b) => b.hiddenGemScore - a.hiddenGemScore);
}

/**
 * Search with mock data (for development without backend)
 */
export async function searchHiddenGemsMock(
  request: HiddenGemSearchRequest
): Promise<HiddenGemSearchResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const places = generateMockHiddenGems(request.location, request.limit || 20);

  return {
    places,
    totalCount: places.length,
    meta: {
      location: request.location,
      radius: request.radius || DEFAULT_RADIUS,
      types: request.types || ['all' as HiddenGemPlaceType],
      fromCache: false,
    },
  };
}
