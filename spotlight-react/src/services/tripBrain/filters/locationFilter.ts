/**
 * Location Filter
 *
 * WI-6.4: Location-based filtering for the Trip Brain intelligence system
 *
 * Provides:
 * - Distance calculation (Haversine formula)
 * - Distance scoring with configurable decay curves
 * - Filtering activities by proximity
 * - Sorting by distance
 * - Human-readable distance formatting
 * - Walking/driving time estimates
 *
 * Key Design Decisions:
 * - Distance scores use configurable decay curves (linear, exponential, stepped)
 * - All distances in meters for consistency
 * - Walking speed defaults to 80m/min (average pedestrian)
 * - Driving speed defaults to 30km/h (urban average)
 * - Distance brackets allow semantic grouping ("nearby", "walking distance", etc.)
 */

import type { Coordinates } from '../../hiddenGems';
import type { PlaceActivity } from '../../itinerary';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Distance bracket for semantic categorization
 */
export interface DistanceBracket {
  /** Bracket name */
  name: string;
  /** Maximum distance in meters for this bracket */
  maxDistance: number;
  /** Human-readable label */
  label: string;
  /** Short label for UI */
  shortLabel: string;
  /** Score multiplier for this bracket */
  scoreMultiplier: number;
}

/**
 * Score decay curve type
 * - linear: Score decreases linearly with distance
 * - exponential: Score drops faster at greater distances
 * - stepped: Score uses bracket-based steps
 * - inverse: Score = 1 / (1 + distance/halfLife)
 */
export type ScoreDecayCurve = 'linear' | 'exponential' | 'stepped' | 'inverse';

/**
 * Location filter configuration
 */
export interface LocationFilterConfig {
  /** Maximum distance to consider (meters) */
  maxDistance: number;

  /** Score decay curve type */
  decayCurve: ScoreDecayCurve;

  /** For exponential decay: distance at which score is 0.5 */
  halfLifeDistance: number;

  /** Walking speed in meters per minute */
  walkingSpeedMpm: number;

  /** Driving speed in meters per minute (urban) */
  drivingSpeedMpm: number;

  /** Cycling speed in meters per minute */
  cyclingSpeedMpm: number;

  /** Distance considered "right here" (meters) */
  immediateDistance: number;

  /** Distance brackets for semantic categorization */
  distanceBrackets: DistanceBracket[];

  /** Whether to penalize unknown distances */
  penalizeUnknownDistance: boolean;

  /** Default score for unknown distance (0-1) */
  unknownDistanceScore: number;
}

/**
 * Default distance brackets
 */
export const DEFAULT_DISTANCE_BRACKETS: DistanceBracket[] = [
  {
    name: 'immediate',
    maxDistance: 100,
    label: 'Right here',
    shortLabel: 'Here',
    scoreMultiplier: 1.0,
  },
  {
    name: 'very_close',
    maxDistance: 300,
    label: 'Very close',
    shortLabel: '~300m',
    scoreMultiplier: 0.95,
  },
  {
    name: 'walking',
    maxDistance: 800,
    label: 'Short walk',
    shortLabel: '~5 min',
    scoreMultiplier: 0.85,
  },
  {
    name: 'moderate_walk',
    maxDistance: 1500,
    label: 'Walking distance',
    shortLabel: '~15 min',
    scoreMultiplier: 0.70,
  },
  {
    name: 'long_walk',
    maxDistance: 3000,
    label: 'Longer walk',
    shortLabel: '~30 min',
    scoreMultiplier: 0.50,
  },
  {
    name: 'short_drive',
    maxDistance: 5000,
    label: 'Short drive',
    shortLabel: '~10 min drive',
    scoreMultiplier: 0.35,
  },
  {
    name: 'moderate_drive',
    maxDistance: 15000,
    label: 'Drive required',
    shortLabel: '~20 min drive',
    scoreMultiplier: 0.20,
  },
  {
    name: 'far',
    maxDistance: Infinity,
    label: 'Far away',
    shortLabel: 'Far',
    scoreMultiplier: 0.10,
  },
];

/**
 * Default location filter configuration
 */
export const DEFAULT_LOCATION_FILTER_CONFIG: LocationFilterConfig = {
  maxDistance: 5000, // 5km
  decayCurve: 'exponential',
  halfLifeDistance: 1000, // Score is 0.5 at 1km
  walkingSpeedMpm: 80, // ~5 km/h
  drivingSpeedMpm: 500, // ~30 km/h urban
  cyclingSpeedMpm: 250, // ~15 km/h
  immediateDistance: 100,
  distanceBrackets: DEFAULT_DISTANCE_BRACKETS,
  penalizeUnknownDistance: false,
  unknownDistanceScore: 0.5,
};

// ============================================================================
// Core Distance Calculation
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;
  const deltaLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing between two coordinates
 * @param from Starting coordinate
 * @param to Destination coordinate
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const lat1Rad = (from.lat * Math.PI) / 180;
  const lat2Rad = (to.lat * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Get cardinal direction from bearing
 * @param bearing Bearing in degrees
 * @returns Cardinal direction (N, NE, E, SE, S, SW, W, NW)
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// ============================================================================
// Distance Formatting
// ============================================================================

/**
 * Format distance for human display
 * @param meters Distance in meters
 * @param config Optional config
 * @returns Human-readable distance string
 */
export function formatDistance(
  meters: number,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): string {
  if (meters < config.immediateDistance) return 'Right here';
  if (meters < 1000) return `${Math.round(meters)}m`;
  if (meters < 10000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters / 1000)}km`;
}

/**
 * Format distance with walking context
 * @param meters Distance in meters
 * @param config Optional config
 * @returns Distance with walking time
 */
export function formatDistanceWithContext(
  meters: number,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): string {
  const distance = formatDistance(meters, config);
  const walkTime = estimateWalkingTime(meters, config);

  if (meters < config.immediateDistance) {
    return distance;
  }

  if (walkTime <= 2) {
    return `${distance} · 2 min walk`;
  }

  if (walkTime <= 30) {
    return `${distance} · ${walkTime} min walk`;
  }

  const driveTime = estimateDrivingTime(meters, config);
  return `${distance} · ${driveTime} min drive`;
}

// ============================================================================
// Time Estimates
// ============================================================================

/**
 * Estimate walking time in minutes
 * @param meters Distance in meters
 * @param config Optional config
 * @returns Walking time in minutes
 */
export function estimateWalkingTime(
  meters: number,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): number {
  return Math.ceil(meters / config.walkingSpeedMpm);
}

/**
 * Estimate driving time in minutes (urban)
 * @param meters Distance in meters
 * @param config Optional config
 * @returns Driving time in minutes
 */
export function estimateDrivingTime(
  meters: number,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): number {
  // Add 2 minutes for parking/getting in car
  return Math.ceil(meters / config.drivingSpeedMpm) + 2;
}

/**
 * Estimate cycling time in minutes
 * @param meters Distance in meters
 * @param config Optional config
 * @returns Cycling time in minutes
 */
export function estimateCyclingTime(
  meters: number,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): number {
  return Math.ceil(meters / config.cyclingSpeedMpm);
}

/**
 * Get best travel mode for distance
 * @param meters Distance in meters
 * @returns Recommended travel mode
 */
export function getRecommendedTravelMode(meters: number): {
  mode: 'walk' | 'cycle' | 'drive' | 'transit';
  reason: string;
} {
  if (meters < 800) {
    return { mode: 'walk', reason: 'Quick walk' };
  }
  if (meters < 3000) {
    return { mode: 'walk', reason: 'Pleasant walk' };
  }
  if (meters < 8000) {
    return { mode: 'cycle', reason: 'Great for cycling' };
  }
  return { mode: 'drive', reason: 'Drive recommended' };
}

// ============================================================================
// Distance Scoring
// ============================================================================

/**
 * Get distance bracket for a given distance
 * @param meters Distance in meters
 * @param config Optional config
 * @returns Matching distance bracket
 */
export function getDistanceBracket(
  meters: number,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): DistanceBracket {
  for (const bracket of config.distanceBrackets) {
    if (meters <= bracket.maxDistance) {
      return bracket;
    }
  }
  // Return the last bracket (far) as fallback
  return config.distanceBrackets[config.distanceBrackets.length - 1];
}

/**
 * Calculate distance score using linear decay
 */
function calculateLinearScore(
  meters: number,
  maxDistance: number
): number {
  return Math.max(0, 1 - meters / maxDistance);
}

/**
 * Calculate distance score using exponential decay
 */
function calculateExponentialScore(
  meters: number,
  halfLifeDistance: number
): number {
  return Math.exp(-Math.log(2) * (meters / halfLifeDistance));
}

/**
 * Calculate distance score using stepped brackets
 */
function calculateSteppedScore(
  meters: number,
  config: LocationFilterConfig
): number {
  const bracket = getDistanceBracket(meters, config);
  return bracket.scoreMultiplier;
}

/**
 * Calculate distance score using inverse function
 */
function calculateInverseScore(
  meters: number,
  halfLifeDistance: number
): number {
  return 1 / (1 + meters / halfLifeDistance);
}

/**
 * Get distance score (0-1) for an activity
 * Higher score = closer = better
 *
 * @param meters Distance in meters
 * @param config Optional config
 * @returns Score from 0 to 1
 */
export function getDistanceScore(
  meters: number | undefined,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): number {
  // Handle unknown distance
  if (meters === undefined) {
    return config.penalizeUnknownDistance ? 0 : config.unknownDistanceScore;
  }

  // Immediate proximity gets perfect score
  if (meters <= config.immediateDistance) {
    return 1.0;
  }

  // Beyond max distance gets zero
  if (meters > config.maxDistance) {
    return 0;
  }

  // Calculate based on decay curve
  switch (config.decayCurve) {
    case 'linear':
      return calculateLinearScore(meters, config.maxDistance);

    case 'exponential':
      return calculateExponentialScore(meters, config.halfLifeDistance);

    case 'stepped':
      return calculateSteppedScore(meters, config);

    case 'inverse':
      return calculateInverseScore(meters, config.halfLifeDistance);

    default:
      return calculateExponentialScore(meters, config.halfLifeDistance);
  }
}

/**
 * Detailed distance score result
 */
export interface DistanceScoreResult {
  /** The calculated score (0-1) */
  score: number;
  /** Distance in meters */
  distanceMeters: number | undefined;
  /** Formatted distance string */
  distanceFormatted: string | undefined;
  /** Distance bracket */
  bracket: DistanceBracket | undefined;
  /** Walking time in minutes */
  walkingTimeMinutes: number | undefined;
  /** Driving time in minutes */
  drivingTimeMinutes: number | undefined;
  /** Recommended travel mode */
  travelMode: ReturnType<typeof getRecommendedTravelMode> | undefined;
  /** Human-readable reason */
  reason: string;
}

/**
 * Get detailed distance score with context
 */
export function getDistanceScoreResult(
  userLocation: Coordinates | undefined,
  activityLocation: Coordinates | undefined,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): DistanceScoreResult {
  // Handle missing locations
  if (!userLocation || !activityLocation) {
    return {
      score: config.unknownDistanceScore,
      distanceMeters: undefined,
      distanceFormatted: undefined,
      bracket: undefined,
      walkingTimeMinutes: undefined,
      drivingTimeMinutes: undefined,
      travelMode: undefined,
      reason: 'Distance unknown',
    };
  }

  const meters = calculateDistance(userLocation, activityLocation);
  const score = getDistanceScore(meters, config);
  const bracket = getDistanceBracket(meters, config);
  const walkingTime = estimateWalkingTime(meters, config);
  const drivingTime = estimateDrivingTime(meters, config);
  const travelMode = getRecommendedTravelMode(meters);

  // Generate reason
  let reason: string;
  if (meters < config.immediateDistance) {
    reason = 'Right around the corner';
  } else if (meters < 300) {
    reason = `${Math.round(meters)}m away`;
  } else if (meters < 1000) {
    reason = `${walkingTime} min walk`;
  } else if (meters < 3000) {
    reason = `${walkingTime} min walk from you`;
  } else {
    reason = `${(meters / 1000).toFixed(1)}km away`;
  }

  return {
    score,
    distanceMeters: meters,
    distanceFormatted: formatDistance(meters, config),
    bracket,
    walkingTimeMinutes: walkingTime,
    drivingTimeMinutes: drivingTime,
    travelMode,
    reason,
  };
}

// ============================================================================
// Activity Filtering
// ============================================================================

/**
 * Check if activity is within range
 * @param activity Activity to check
 * @param userLocation User's location
 * @param maxDistance Maximum distance in meters
 * @returns true if within range
 */
export function isWithinRange(
  activity: PlaceActivity,
  userLocation: Coordinates,
  maxDistance: number
): boolean {
  if (!activity.place.coordinates) return false;

  const distance = calculateDistance(userLocation, activity.place.coordinates);
  return distance <= maxDistance;
}

/**
 * Filter activities by distance
 * @param activities Activities to filter
 * @param userLocation User's location
 * @param maxDistance Maximum distance in meters
 * @returns Filtered activities within range
 */
export function filterByDistance(
  activities: PlaceActivity[],
  userLocation: Coordinates,
  maxDistance: number
): PlaceActivity[] {
  return activities.filter((activity) => {
    if (!activity.place.coordinates) return false;
    return isWithinRange(activity, userLocation, maxDistance);
  });
}

/**
 * Sort activities by distance (nearest first)
 * @param activities Activities to sort
 * @param userLocation User's location
 * @returns Sorted activities
 */
export function sortByDistance(
  activities: PlaceActivity[],
  userLocation: Coordinates
): PlaceActivity[] {
  return [...activities].sort((a, b) => {
    const distA = a.place.coordinates
      ? calculateDistance(userLocation, a.place.coordinates)
      : Infinity;
    const distB = b.place.coordinates
      ? calculateDistance(userLocation, b.place.coordinates)
      : Infinity;
    return distA - distB;
  });
}

/**
 * Sort activities by distance score (highest first)
 * @param activities Activities to sort
 * @param userLocation User's location
 * @param config Optional config
 * @returns Sorted activities
 */
export function sortByDistanceScore(
  activities: PlaceActivity[],
  userLocation: Coordinates,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): PlaceActivity[] {
  return [...activities].sort((a, b) => {
    const distA = a.place.coordinates
      ? calculateDistance(userLocation, a.place.coordinates)
      : undefined;
    const distB = b.place.coordinates
      ? calculateDistance(userLocation, b.place.coordinates)
      : undefined;
    const scoreA = getDistanceScore(distA, config);
    const scoreB = getDistanceScore(distB, config);
    return scoreB - scoreA;
  });
}

/**
 * Advanced distance filter options
 */
export interface AdvancedDistanceFilterOptions {
  /** Maximum distance in meters */
  maxDistance?: number;

  /** Minimum score threshold */
  minimumScore?: number;

  /** Whether to sort by distance */
  sortByDistance?: boolean;

  /** Whether to include activities without coordinates */
  includeNoCoordinates?: boolean;

  /** Maximum results */
  limit?: number;
}

/**
 * Advanced distance filtering with multiple options
 * @param activities Activities to filter
 * @param userLocation User's location
 * @param options Filter options
 * @param config Location filter config
 * @returns Filtered and optionally sorted activities
 */
export function filterByDistanceAdvanced(
  activities: PlaceActivity[],
  userLocation: Coordinates | undefined,
  options: AdvancedDistanceFilterOptions = {},
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): PlaceActivity[] {
  const {
    maxDistance = config.maxDistance,
    minimumScore = 0,
    sortByDistance: shouldSort = true,
    includeNoCoordinates = false,
    limit,
  } = options;

  // If no user location, can only include activities without coordinates check
  if (!userLocation) {
    if (includeNoCoordinates) {
      return limit ? activities.slice(0, limit) : activities;
    }
    return [];
  }

  // Filter by distance and score
  let filtered = activities.filter((activity) => {
    if (!activity.place.coordinates) {
      return includeNoCoordinates;
    }

    const distance = calculateDistance(userLocation, activity.place.coordinates);
    const score = getDistanceScore(distance, config);

    return distance <= maxDistance && score >= minimumScore;
  });

  // Sort if requested
  if (shouldSort) {
    filtered = sortByDistance(filtered, userLocation);
  }

  // Apply limit
  if (limit && limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

// ============================================================================
// Nearby Activities
// ============================================================================

/**
 * Get activities grouped by distance bracket
 */
export interface GroupedByDistanceResult {
  /** Bracket name */
  bracket: string;
  /** Bracket label */
  label: string;
  /** Activities in this bracket */
  activities: PlaceActivity[];
  /** Count of activities */
  count: number;
}

/**
 * Group activities by distance bracket
 * @param activities Activities to group
 * @param userLocation User's location
 * @param config Optional config
 * @returns Activities grouped by distance bracket
 */
export function groupByDistanceBracket(
  activities: PlaceActivity[],
  userLocation: Coordinates,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): GroupedByDistanceResult[] {
  const groups: Map<string, PlaceActivity[]> = new Map();

  // Initialize groups
  for (const bracket of config.distanceBrackets) {
    groups.set(bracket.name, []);
  }

  // Categorize activities
  for (const activity of activities) {
    if (!activity.place.coordinates) continue;

    const distance = calculateDistance(userLocation, activity.place.coordinates);
    const bracket = getDistanceBracket(distance, config);
    const group = groups.get(bracket.name);
    if (group) {
      group.push(activity);
    }
  }

  // Build result
  const results: GroupedByDistanceResult[] = [];
  for (const bracket of config.distanceBrackets) {
    const activities = groups.get(bracket.name) || [];
    if (activities.length > 0) {
      results.push({
        bracket: bracket.name,
        label: bracket.label,
        activities: sortByDistance(activities, userLocation),
        count: activities.length,
      });
    }
  }

  return results;
}

/**
 * Get the N nearest activities
 * @param activities Activities to search
 * @param userLocation User's location
 * @param count Number of results
 * @returns Nearest activities sorted by distance
 */
export function getNearestActivities(
  activities: PlaceActivity[],
  userLocation: Coordinates,
  count: number = 5
): PlaceActivity[] {
  const sorted = sortByDistance(activities, userLocation);
  return sorted.slice(0, count);
}

/**
 * Activity with distance info
 */
export interface ActivityWithDistance {
  activity: PlaceActivity;
  distanceMeters: number;
  distanceFormatted: string;
  walkingTimeMinutes: number;
  bracket: DistanceBracket;
  score: number;
  bearing: number;
  direction: string;
}

/**
 * Get activities with full distance information
 * @param activities Activities to process
 * @param userLocation User's location
 * @param config Optional config
 * @returns Activities enriched with distance info
 */
export function getActivitiesWithDistance(
  activities: PlaceActivity[],
  userLocation: Coordinates,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): ActivityWithDistance[] {
  return activities
    .filter((activity) => activity.place.coordinates)
    .map((activity) => {
      const coords = activity.place.coordinates!;
      const distance = calculateDistance(userLocation, coords);
      const bearing = calculateBearing(userLocation, coords);

      return {
        activity,
        distanceMeters: distance,
        distanceFormatted: formatDistance(distance, config),
        walkingTimeMinutes: estimateWalkingTime(distance, config),
        bracket: getDistanceBracket(distance, config),
        score: getDistanceScore(distance, config),
        bearing,
        direction: getCardinalDirection(bearing),
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// ============================================================================
// "Why Now" Distance Reasons
// ============================================================================

/**
 * Generate "Why Now" text based on distance
 * @param meters Distance in meters
 * @param config Optional config
 * @returns Human-readable recommendation reason
 */
export function generateDistanceWhyNow(
  meters: number,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): string {
  if (meters < config.immediateDistance) {
    return 'Right around the corner';
  }

  if (meters < 200) {
    return `Just ${Math.round(meters)}m away`;
  }

  if (meters < 500) {
    const minutes = estimateWalkingTime(meters, config);
    return `${minutes} min walk from you`;
  }

  if (meters < 1000) {
    const minutes = estimateWalkingTime(meters, config);
    return `${minutes} min walk`;
  }

  if (meters < 2000) {
    return `${(meters / 1000).toFixed(1)}km walk`;
  }

  if (meters < 5000) {
    const bracket = getDistanceBracket(meters, config);
    return bracket.label;
  }

  return `${(meters / 1000).toFixed(1)}km away`;
}

/**
 * Get urgency-based distance message
 * Useful for activities that might be closing soon
 */
export function getUrgencyDistanceMessage(
  meters: number,
  urgencyMinutes: number,
  config: LocationFilterConfig = DEFAULT_LOCATION_FILTER_CONFIG
): string | undefined {
  const walkTime = estimateWalkingTime(meters, config);

  if (walkTime <= urgencyMinutes) {
    return `${walkTime} min walk - still time!`;
  }

  const driveTime = estimateDrivingTime(meters, config);
  if (driveTime <= urgencyMinutes) {
    return `${driveTime} min drive - can make it`;
  }

  if (urgencyMinutes > 0) {
    return `Closes in ${urgencyMinutes} min - might not make it`;
  }

  return undefined;
}
