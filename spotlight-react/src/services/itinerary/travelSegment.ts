/**
 * Travel Segment Calculator
 *
 * WI-5.4: Calculate travel segments between locations with caching
 *
 * Features:
 * - Distance calculation (Haversine with road factor adjustments)
 * - Duration estimation for multiple travel modes
 * - Suggested departure times to arrive by target time
 * - In-memory caching for route calculations
 * - Traffic-aware time estimates (peak hours adjustment)
 *
 * Architecture Decisions:
 * - Uses Haversine formula with road factor (1.3x) for realistic estimates
 * - Cache key includes origin, destination, and mode for uniqueness
 * - TTL-based cache expiry (1 hour default)
 * - Modular design allows future Google Directions API integration
 */

import type { Coordinates } from '../hiddenGems';

// ============================================================================
// Types
// ============================================================================

/**
 * Travel mode options
 */
export type TravelMode = 'driving' | 'walking' | 'transit' | 'cycling';

/**
 * Location with name and coordinates
 */
export interface TravelLocation {
  /** Location name */
  name: string;
  /** Coordinates */
  coordinates: Coordinates;
  /** Optional place ID for caching */
  placeId?: string;
}

/**
 * Traffic condition estimates
 */
export type TrafficCondition = 'light' | 'moderate' | 'heavy';

/**
 * Detailed travel segment between two locations
 */
export interface TravelSegment {
  /** Origin location */
  origin: TravelLocation;
  /** Destination location */
  destination: TravelLocation;
  /** Travel mode used */
  mode: TravelMode;
  /** Distance in kilometers */
  distanceKm: number;
  /** Base duration in minutes (no traffic) */
  baseDurationMinutes: number;
  /** Estimated duration with typical traffic */
  estimatedDurationMinutes: number;
  /** Duration range (min to max) */
  durationRange: {
    min: number;
    max: number;
  };
  /** Formatted distance string */
  formattedDistance: string;
  /** Formatted duration string */
  formattedDuration: string;
  /** Calculation source */
  source: 'estimated' | 'cached' | 'api';
  /** Timestamp of calculation */
  calculatedAt: Date;
}

/**
 * Departure time suggestion
 */
export interface DepartureSuggestion {
  /** Suggested departure time */
  departureTime: Date;
  /** Target arrival time */
  arrivalTime: Date;
  /** Buffer time included (minutes) */
  bufferMinutes: number;
  /** Expected traffic condition at departure */
  expectedTraffic: TrafficCondition;
  /** Formatted departure time */
  formattedDeparture: string;
  /** Formatted arrival time */
  formattedArrival: string;
  /** Human-readable suggestion */
  suggestion: string;
}

/**
 * Options for travel calculation
 */
export interface TravelCalculationOptions {
  /** Travel mode (default: driving) */
  mode?: TravelMode;
  /** Date for traffic estimation */
  date?: Date;
  /** Time of day for traffic estimation (HH:MM format) */
  timeOfDay?: string;
  /** Use cached result if available */
  useCache?: boolean;
  /** Include traffic adjustments */
  includeTraffic?: boolean;
}

/**
 * Options for departure suggestion
 */
export interface DepartureSuggestionOptions {
  /** Buffer time in minutes (default: 15) */
  bufferMinutes?: number;
  /** Consider traffic conditions */
  considerTraffic?: boolean;
  /** Preferred departure window start (HH:MM) */
  earliestDeparture?: string;
  /** Preferred departure window end (HH:MM) */
  latestDeparture?: string;
}

/**
 * Cache entry with expiry
 */
interface CacheEntry {
  segment: TravelSegment;
  expiresAt: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Average speeds by mode (km/h) */
const MODE_SPEEDS: Record<TravelMode, number> = {
  driving: 60,
  walking: 4.5,
  transit: 35,
  cycling: 15,
};

/** Road factor multiplier (straight line to actual road distance) */
const ROAD_FACTOR: Record<TravelMode, number> = {
  driving: 1.3,   // Roads aren't straight
  walking: 1.2,   // Pedestrian paths more direct
  transit: 1.4,   // Transit routes less direct
  cycling: 1.25,  // Bike paths moderate
};

/** Traffic multipliers by condition */
const TRAFFIC_MULTIPLIERS: Record<TrafficCondition, number> = {
  light: 1.0,
  moderate: 1.25,
  heavy: 1.6,
};

/** Peak hours (24h format) - when traffic is typically heavy */
const PEAK_HOURS = {
  morning: { start: 7, end: 9 },
  evening: { start: 17, end: 19 },
};

/** Moderate traffic hours */
const MODERATE_HOURS = {
  preMorning: { start: 6, end: 7 },
  postMorning: { start: 9, end: 10 },
  preEvening: { start: 16, end: 17 },
  postEvening: { start: 19, end: 20 },
};

/** Cache TTL in milliseconds (1 hour) */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Maximum cache entries */
const MAX_CACHE_SIZE = 500;

// ============================================================================
// Cache Implementation
// ============================================================================

/** In-memory route cache */
const routeCache = new Map<string, CacheEntry>();

/**
 * Generate cache key for a route
 */
function getCacheKey(
  origin: Coordinates,
  destination: Coordinates,
  mode: TravelMode
): string {
  // Round coordinates to 4 decimal places for cache key
  const oLat = origin.lat.toFixed(4);
  const oLng = origin.lng.toFixed(4);
  const dLat = destination.lat.toFixed(4);
  const dLng = destination.lng.toFixed(4);
  return `${oLat},${oLng}|${dLat},${dLng}|${mode}`;
}

/**
 * Get cached segment if available and not expired
 */
function getCachedSegment(
  origin: Coordinates,
  destination: Coordinates,
  mode: TravelMode
): TravelSegment | null {
  const key = getCacheKey(origin, destination, mode);
  const entry = routeCache.get(key);

  if (!entry) return null;

  // Check expiry
  if (Date.now() > entry.expiresAt) {
    routeCache.delete(key);
    return null;
  }

  return { ...entry.segment, source: 'cached' };
}

/**
 * Cache a travel segment
 */
function cacheSegment(segment: TravelSegment): void {
  // Evict oldest entries if cache is full
  if (routeCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = routeCache.keys().next().value;
    if (oldestKey) {
      routeCache.delete(oldestKey);
    }
  }

  const key = getCacheKey(
    segment.origin.coordinates,
    segment.destination.coordinates,
    segment.mode
  );

  routeCache.set(key, {
    segment,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Clear the route cache
 */
export function clearRouteCache(): void {
  routeCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: routeCache.size,
    maxSize: MAX_CACHE_SIZE,
  };
}

// ============================================================================
// Core Calculation Functions
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers (straight line)
 */
function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate road distance from straight-line distance
 */
function calculateRoadDistance(
  straightLineKm: number,
  mode: TravelMode
): number {
  return straightLineKm * ROAD_FACTOR[mode];
}

/**
 * Estimate base travel time (no traffic)
 */
function estimateBaseDuration(distanceKm: number, mode: TravelMode): number {
  const speedKmh = MODE_SPEEDS[mode];
  return Math.round((distanceKm / speedKmh) * 60);
}

/**
 * Determine traffic condition based on time
 */
export function getTrafficCondition(date: Date): TrafficCondition {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();

  // Weekends typically have lighter traffic
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    if (hour >= 10 && hour <= 18) return 'moderate';
    return 'light';
  }

  // Weekday peak hours
  if (
    (hour >= PEAK_HOURS.morning.start && hour < PEAK_HOURS.morning.end) ||
    (hour >= PEAK_HOURS.evening.start && hour < PEAK_HOURS.evening.end)
  ) {
    return 'heavy';
  }

  // Moderate hours around peak
  if (
    (hour >= MODERATE_HOURS.preMorning.start && hour < MODERATE_HOURS.preMorning.end) ||
    (hour >= MODERATE_HOURS.postMorning.start && hour < MODERATE_HOURS.postMorning.end) ||
    (hour >= MODERATE_HOURS.preEvening.start && hour < MODERATE_HOURS.preEvening.end) ||
    (hour >= MODERATE_HOURS.postEvening.start && hour < MODERATE_HOURS.postEvening.end)
  ) {
    return 'moderate';
  }

  return 'light';
}

/**
 * Calculate duration with traffic adjustment
 */
function calculateDurationWithTraffic(
  baseDurationMinutes: number,
  mode: TravelMode,
  trafficCondition: TrafficCondition
): number {
  // Only driving and transit affected by traffic
  if (mode === 'walking' || mode === 'cycling') {
    return baseDurationMinutes;
  }

  return Math.round(baseDurationMinutes * TRAFFIC_MULTIPLIERS[trafficCondition]);
}

/**
 * Calculate duration range (min/max)
 */
function calculateDurationRange(
  baseDurationMinutes: number,
  mode: TravelMode
): { min: number; max: number } {
  if (mode === 'walking' || mode === 'cycling') {
    return {
      min: baseDurationMinutes,
      max: Math.round(baseDurationMinutes * 1.1), // Slight variation
    };
  }

  return {
    min: baseDurationMinutes, // Best case (light traffic)
    max: Math.round(baseDurationMinutes * TRAFFIC_MULTIPLIERS.heavy), // Worst case
  };
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }
  return `${Math.round(distanceKm)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

/**
 * Format time (HH:MM to display format)
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Calculate a travel segment between two locations
 *
 * @param origin - Starting location
 * @param destination - Ending location
 * @param options - Calculation options
 * @returns Travel segment with distance and duration
 *
 * @example
 * ```typescript
 * const segment = calculateTravelSegment(
 *   { name: 'Paris', coordinates: { lat: 48.8566, lng: 2.3522 } },
 *   { name: 'Lyon', coordinates: { lat: 45.7640, lng: 4.8357 } },
 *   { mode: 'driving', includeTraffic: true }
 * );
 * console.log(segment.formattedDuration); // "4 hr 30 min"
 * ```
 */
export function calculateTravelSegment(
  origin: TravelLocation,
  destination: TravelLocation,
  options: TravelCalculationOptions = {}
): TravelSegment {
  const {
    mode = 'driving',
    date = new Date(),
    useCache = true,
    includeTraffic = true,
  } = options;

  // Check cache first
  if (useCache) {
    const cached = getCachedSegment(
      origin.coordinates,
      destination.coordinates,
      mode
    );
    if (cached) {
      return cached;
    }
  }

  // Calculate straight-line distance
  const straightLineKm = calculateHaversineDistance(
    origin.coordinates,
    destination.coordinates
  );

  // Adjust for road distance
  const distanceKm = calculateRoadDistance(straightLineKm, mode);

  // Calculate base duration
  const baseDurationMinutes = estimateBaseDuration(distanceKm, mode);

  // Calculate traffic-adjusted duration
  let estimatedDurationMinutes = baseDurationMinutes;
  if (includeTraffic) {
    const trafficCondition = getTrafficCondition(date);
    estimatedDurationMinutes = calculateDurationWithTraffic(
      baseDurationMinutes,
      mode,
      trafficCondition
    );
  }

  // Calculate duration range
  const durationRange = calculateDurationRange(baseDurationMinutes, mode);

  // Build segment
  const segment: TravelSegment = {
    origin,
    destination,
    mode,
    distanceKm: Math.round(distanceKm * 10) / 10,
    baseDurationMinutes,
    estimatedDurationMinutes,
    durationRange,
    formattedDistance: formatDistance(distanceKm),
    formattedDuration: formatDuration(estimatedDurationMinutes),
    source: 'estimated',
    calculatedAt: new Date(),
  };

  // Cache the result
  if (useCache) {
    cacheSegment(segment);
  }

  return segment;
}

/**
 * Calculate travel between multiple waypoints
 *
 * @param waypoints - Array of locations to visit in order
 * @param options - Calculation options
 * @returns Array of segments between consecutive waypoints
 */
export function calculateMultiPointRoute(
  waypoints: TravelLocation[],
  options: TravelCalculationOptions = {}
): TravelSegment[] {
  if (waypoints.length < 2) {
    return [];
  }

  const segments: TravelSegment[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = calculateTravelSegment(
      waypoints[i],
      waypoints[i + 1],
      options
    );
    segments.push(segment);
  }

  return segments;
}

/**
 * Calculate suggested departure time to arrive by target time
 *
 * @param origin - Starting location
 * @param destination - Ending location
 * @param targetArrival - Target arrival time
 * @param options - Suggestion options
 * @returns Departure suggestion
 *
 * @example
 * ```typescript
 * const suggestion = suggestDepartureTime(
 *   { name: 'Hotel', coordinates: { lat: 48.8566, lng: 2.3522 } },
 *   { name: 'Museum', coordinates: { lat: 48.8606, lng: 2.3376 } },
 *   new Date('2024-06-15T10:00:00'),
 *   { bufferMinutes: 15, considerTraffic: true }
 * );
 * console.log(suggestion.suggestion); // "Leave at 9:15 AM to arrive by 10:00 AM"
 * ```
 */
export function suggestDepartureTime(
  origin: TravelLocation,
  destination: TravelLocation,
  targetArrival: Date,
  options: DepartureSuggestionOptions = {}
): DepartureSuggestion {
  const {
    bufferMinutes = 15,
    considerTraffic = true,
  } = options;

  // Calculate segment for estimated time at target arrival time
  const segment = calculateTravelSegment(origin, destination, {
    mode: 'driving',
    date: targetArrival,
    includeTraffic: considerTraffic,
  });

  // Calculate departure time
  const totalMinutesNeeded = segment.estimatedDurationMinutes + bufferMinutes;
  const departureTime = new Date(
    targetArrival.getTime() - totalMinutesNeeded * 60 * 1000
  );

  // Get expected traffic at departure time
  const expectedTraffic = getTrafficCondition(departureTime);

  // Build human-readable suggestion
  const formattedDeparture = formatTime(departureTime);
  const formattedArrival = formatTime(targetArrival);

  let suggestion = `Leave at ${formattedDeparture} to arrive by ${formattedArrival}`;

  // Add traffic info for driving
  if (considerTraffic && expectedTraffic !== 'light') {
    const trafficNote =
      expectedTraffic === 'heavy'
        ? ' (expect heavy traffic)'
        : ' (moderate traffic expected)';
    suggestion += trafficNote;
  }

  return {
    departureTime,
    arrivalTime: targetArrival,
    bufferMinutes,
    expectedTraffic,
    formattedDeparture,
    formattedArrival,
    suggestion,
  };
}

/**
 * Suggest multiple departure options for flexibility
 *
 * @param origin - Starting location
 * @param destination - Ending location
 * @param targetArrival - Target arrival time
 * @returns Array of departure options (early, recommended, latest)
 */
export function suggestDepartureOptions(
  origin: TravelLocation,
  destination: TravelLocation,
  targetArrival: Date
): DepartureSuggestion[] {
  return [
    // Early departure (plenty of buffer)
    suggestDepartureTime(origin, destination, targetArrival, {
      bufferMinutes: 30,
      considerTraffic: true,
    }),
    // Recommended (standard buffer)
    suggestDepartureTime(origin, destination, targetArrival, {
      bufferMinutes: 15,
      considerTraffic: true,
    }),
    // Latest possible (minimal buffer)
    suggestDepartureTime(origin, destination, targetArrival, {
      bufferMinutes: 5,
      considerTraffic: true,
    }),
  ];
}

/**
 * Calculate total route statistics
 *
 * @param segments - Array of travel segments
 * @returns Total distance, duration, and formatted strings
 */
export function calculateRouteTotal(segments: TravelSegment[]): {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  formattedTotalDistance: string;
  formattedTotalDuration: string;
  segmentCount: number;
} {
  const totalDistanceKm = segments.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalDurationMinutes = segments.reduce(
    (sum, s) => sum + s.estimatedDurationMinutes,
    0
  );

  return {
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalDurationMinutes: Math.round(totalDurationMinutes),
    formattedTotalDistance: formatDistance(totalDistanceKm),
    formattedTotalDuration: formatDuration(totalDurationMinutes),
    segmentCount: segments.length,
  };
}

/**
 * Quick estimate travel time between coordinates
 * Lightweight function for use in scheduling
 *
 * @param from - Origin coordinates
 * @param to - Destination coordinates
 * @param mode - Travel mode
 * @returns Estimated minutes
 */
export function quickTravelEstimate(
  from: Coordinates,
  to: Coordinates,
  mode: TravelMode = 'driving'
): number {
  const straightLineKm = calculateHaversineDistance(from, to);
  const distanceKm = calculateRoadDistance(straightLineKm, mode);
  return estimateBaseDuration(distanceKm, mode);
}

/**
 * Check if two locations are within walking distance
 *
 * @param coord1 - First location
 * @param coord2 - Second location
 * @param maxWalkingMinutes - Maximum walking time (default 15)
 * @returns True if walkable
 */
export function isWalkingDistance(
  coord1: Coordinates,
  coord2: Coordinates,
  maxWalkingMinutes: number = 15
): boolean {
  const walkingTime = quickTravelEstimate(coord1, coord2, 'walking');
  return walkingTime <= maxWalkingMinutes;
}

/**
 * Recommend travel mode based on distance
 *
 * @param from - Origin coordinates
 * @param to - Destination coordinates
 * @returns Recommended mode and reason
 */
export function recommendTravelMode(
  from: Coordinates,
  to: Coordinates
): { mode: TravelMode; reason: string } {
  const straightLineKm = calculateHaversineDistance(from, to);

  if (straightLineKm < 0.8) {
    return {
      mode: 'walking',
      reason: 'Short distance - walking is quick and convenient',
    };
  }

  if (straightLineKm < 3) {
    return {
      mode: 'cycling',
      reason: 'Medium distance - cycling is fast and avoids traffic',
    };
  }

  if (straightLineKm < 10) {
    return {
      mode: 'transit',
      reason: 'Urban distance - transit may be faster than driving with parking',
    };
  }

  return {
    mode: 'driving',
    reason: 'Longer distance - driving is most practical',
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Pre-calculate segments for a list of locations (for caching)
 *
 * @param locations - Array of locations
 * @param mode - Travel mode
 */
export function precalculateSegments(
  locations: TravelLocation[],
  mode: TravelMode = 'driving'
): void {
  for (let i = 0; i < locations.length - 1; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      // Calculate both directions
      calculateTravelSegment(locations[i], locations[j], { mode, useCache: true });
      calculateTravelSegment(locations[j], locations[i], { mode, useCache: true });
    }
  }
}

/**
 * Format a travel segment for display
 */
export function formatTravelSegment(segment: TravelSegment): string {
  return `${segment.origin.name} → ${segment.destination.name}: ${segment.formattedDistance} (${segment.formattedDuration})`;
}

/**
 * Format multiple segments as a route summary
 */
export function formatRouteSummary(segments: TravelSegment[]): string {
  if (segments.length === 0) return 'No route';

  const total = calculateRouteTotal(segments);
  const stops = [
    segments[0].origin.name,
    ...segments.map((s) => s.destination.name),
  ];

  return `${stops.join(' → ')}\nTotal: ${total.formattedTotalDistance}, ${total.formattedTotalDuration}`;
}
