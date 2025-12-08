/**
 * TripBrain TypeScript Types
 *
 * WI-6.1: Core types for the Trip Brain intelligence service
 *
 * Architecture Overview:
 * The Trip Brain is the intelligence layer that powers the active trip companion.
 * It takes raw itinerary data and enriches it with:
 * - Time filtering (appropriate for current time)
 * - Location scoring (proximity to user)
 * - Preference scoring (matches user taste)
 * - "Why Now" reasoning (human-readable recommendations)
 *
 * Integration Points:
 * - Uses UserPreferences from Epic 4 (preferences service)
 * - Uses Itinerary types from Epic 5 (itinerary service)
 * - Prepares for CrossTripMemory from Epic 9 (future)
 *
 * Key Design Decisions:
 * - EnrichedActivity extends itinerary activities with scoring
 * - All scores normalized to 0-1 range
 * - WhyNow reasons are tiered (primary, secondary, tip)
 * - State management designed for React Context integration
 */

import type {
  PlaceActivity,
  Itinerary,
} from '../itinerary';
import type { UserPreferences } from '../preferences';
import type { Coordinates } from '../hiddenGems';

// Re-exported types for convenience (used by consumers of this module)
export type { ItineraryActivity, TimeSlot, ItineraryPlace } from '../itinerary';

// ============================================================================
// Core State Types
// ============================================================================

/**
 * Main state object for the Trip Brain
 */
export interface TripBrainState {
  /** Current trip's itinerary */
  itinerary: Itinerary | null;

  /** Is trip data currently loading */
  isLoading: boolean;

  /** Error if any occurred */
  error: string | null;

  /** User's current location (if available) */
  userLocation: LocationContext | null;

  /** Current weather conditions */
  weather: WeatherContext | null;

  /** User preferences (from preferences service) */
  preferences: UserPreferences | null;

  /** Cross-trip memory (future: from Epic 9) */
  memory: CrossTripMemory | null;

  /** IDs of completed activities */
  completedActivityIds: Set<string>;

  /** IDs of skipped activities with optional reasons */
  skippedActivities: Map<string, SkipReason>;

  /** Current time period */
  currentTimePeriod: TimePeriod;

  /** Last update timestamp */
  lastUpdated: Date;

  /** Session ID for tracking */
  sessionId: string;
}

/**
 * Reason for skipping an activity
 */
export interface SkipReason {
  /** When it was skipped */
  skippedAt: Date;
  /** Optional reason provided by user */
  reason?: string;
  /** Category of skip reason */
  category?: 'not_interested' | 'no_time' | 'weather' | 'closed' | 'other';
}

/**
 * Time periods for activity filtering
 */
export type TimePeriod =
  | 'early_morning'   // 5-8
  | 'morning'         // 8-12
  | 'lunch'           // 12-14
  | 'afternoon'       // 14-17
  | 'evening'         // 17-21
  | 'night';          // 21-5

/**
 * Get current time period from hour
 */
export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 8) return 'early_morning';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// ============================================================================
// Location Context
// ============================================================================

/**
 * User's location context
 */
export interface LocationContext {
  /** Current coordinates */
  coordinates: Coordinates;

  /** Accuracy in meters */
  accuracy: number;

  /** When this location was captured */
  timestamp: Date;

  /** Heading in degrees (if available) */
  heading?: number;

  /** Speed in m/s (if available) */
  speed?: number;

  /** Is user currently moving */
  isMoving: boolean;

  /** City name (reverse geocoded) */
  cityName?: string;

  /** Country code */
  countryCode?: string;
}

/**
 * Location permission status
 */
export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unavailable';

/**
 * Geolocation hook return type
 */
export interface GeolocationState {
  /** Current location */
  location: LocationContext | null;

  /** Is location being fetched */
  isLoading: boolean;

  /** Error if location failed */
  error: GeolocationError | null;

  /** Permission status */
  permissionStatus: LocationPermissionStatus;

  /** Manually refresh location */
  refresh: () => void;

  /** Start watching location */
  startWatching: () => void;

  /** Stop watching location */
  stopWatching: () => void;
}

/**
 * Geolocation error
 */
export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

// ============================================================================
// Weather Context
// ============================================================================

/**
 * Weather condition type
 */
export type WeatherCondition =
  | 'sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy'
  | 'windy';

/**
 * Current weather context
 */
export interface WeatherContext {
  /** Weather condition */
  condition: WeatherCondition;

  /** Temperature in Celsius */
  temperatureCelsius: number;

  /** Feels like temperature */
  feelsLikeCelsius: number;

  /** Humidity percentage */
  humidity: number;

  /** Wind speed in km/h */
  windSpeedKmh: number;

  /** Precipitation chance (0-100) */
  precipitationChance: number;

  /** UV index */
  uvIndex: number;

  /** Sunrise time */
  sunrise: Date;

  /** Sunset time */
  sunset: Date;

  /** Is it currently daylight */
  isDaylight: boolean;

  /** Human-readable description */
  description: string;

  /** When this weather was fetched */
  fetchedAt: Date;

  /** Location this weather is for */
  forLocation: string;
}

/**
 * Check if weather is suitable for outdoor activities
 */
export function isOutdoorFriendly(weather: WeatherContext): boolean {
  const badConditions: WeatherCondition[] = ['rainy', 'stormy', 'snowy'];
  return (
    !badConditions.includes(weather.condition) &&
    weather.precipitationChance < 40 &&
    weather.temperatureCelsius > 5 &&
    weather.temperatureCelsius < 38
  );
}

// ============================================================================
// Scoring Types
// ============================================================================

/**
 * Individual score component
 */
export interface ScoreComponent {
  /** Score value (0-1) */
  value: number;

  /** Weight applied to this score */
  weight: number;

  /** Weighted contribution to final score */
  contribution: number;

  /** Human-readable reason */
  reason?: string;
}

/**
 * Complete score breakdown for an activity
 */
export interface ScoreBreakdown {
  /** Time appropriateness score */
  time: ScoreComponent;

  /** Distance/proximity score */
  distance: ScoreComponent;

  /** User preference match score */
  preference: ScoreComponent;

  /** Hidden gem / serendipity bonus */
  serendipity: ScoreComponent;

  /** Quality rating score */
  rating: ScoreComponent;

  /** Weather suitability score */
  weather: ScoreComponent;

  /** Final combined score (0-1) */
  finalScore: number;

  /** Confidence in this score (0-1) */
  confidence: number;
}

/**
 * Default scoring weights
 */
export const DEFAULT_SCORING_WEIGHTS: Record<keyof Omit<ScoreBreakdown, 'finalScore' | 'confidence'>, number> = {
  time: 0.20,       // Must be time-appropriate
  distance: 0.25,   // Closer is better
  preference: 0.25, // Matches user taste
  serendipity: 0.10,// Hidden gem bonus
  rating: 0.10,     // Quality indicator
  weather: 0.10,    // Weather suitability
};

/**
 * Create empty score component
 */
export function createEmptyScoreComponent(weight: number): ScoreComponent {
  return {
    value: 0.5, // Neutral default
    weight,
    contribution: 0.5 * weight,
  };
}

// ============================================================================
// Recommendation Types
// ============================================================================

/**
 * Recommendation score with context
 */
export interface RecommendationScore {
  /** Overall score (0-1) */
  score: number;

  /** Detailed breakdown */
  breakdown: ScoreBreakdown;

  /** Rank among current recommendations */
  rank: number;

  /** Why this is recommended now */
  whyNow: WhyNowReason;

  /** Confidence in this recommendation */
  confidence: number;
}

/**
 * Recommendation mode (what the user is looking for)
 */
export type RecommendationMode =
  | 'choice'       // Default: curated options
  | 'craving'      // User has specific desire
  | 'serendipity'  // Surprise me
  | 'rest'         // User needs a break
  | 'nearby'       // What's closest
  | 'scheduled';   // What's planned for now

// ============================================================================
// WhyNow Reason Types
// ============================================================================

/**
 * Reason category for "Why Now"
 */
export type WhyNowCategory =
  | 'distance'     // "3 min walk from you"
  | 'time'         // "Opens in 10 minutes"
  | 'preference'   // "You loved the last café"
  | 'weather'      // "Perfect patio weather"
  | 'serendipity'  // "Hidden gem - only 47 reviews"
  | 'timing'       // "Golden hour in 30 min"
  | 'crowd'        // "Beat the lunch crowd"
  | 'scheduled'    // "On your itinerary for today"
  | 'trending'     // "Popular right now"
  | 'special';     // "Today's special event"

/**
 * Human-readable reason for recommendation
 */
export interface WhyNowReason {
  /** Primary reason (most important) */
  primary: {
    category: WhyNowCategory;
    text: string;
    icon?: string; // Icon name for UI
  };

  /** Secondary reason (supporting) */
  secondary?: {
    category: WhyNowCategory;
    text: string;
    icon?: string;
  };

  /** Insider tip */
  tip?: {
    text: string;
    source?: string; // "Locals say..." or "Pro tip:"
  };

  /** Time-sensitive urgency */
  urgency?: {
    text: string;
    expiresAt?: Date;
  };
}

/**
 * Generate distance-based why now text
 */
export function generateDistanceWhyNow(distanceMeters: number): string {
  if (distanceMeters < 100) return 'Right around the corner';
  if (distanceMeters < 300) return `${Math.round(distanceMeters / 100) * 100}m walk`;
  if (distanceMeters < 1000) {
    const minutes = Math.ceil(distanceMeters / 80); // ~80m per minute walking
    return `${minutes} min walk from you`;
  }
  const km = (distanceMeters / 1000).toFixed(1);
  return `${km}km away`;
}

// ============================================================================
// Enriched Activity Types
// ============================================================================

/**
 * Activity enriched with Trip Brain intelligence
 * Extends the base ItineraryActivity with scoring and recommendations
 */
export interface EnrichedActivity {
  /** Original activity from itinerary */
  activity: PlaceActivity;

  /** Distance from user in meters (if location available) */
  distanceMeters?: number;

  /** Formatted distance string */
  distanceFormatted?: string;

  /** Travel time in minutes (walking) */
  walkingTimeMinutes?: number;

  /** Complete score information */
  score: RecommendationScore;

  /** Is this activity appropriate for current time */
  isTimeAppropriate: boolean;

  /** Is this activity weather-appropriate */
  isWeatherAppropriate: boolean;

  /** Is this activity currently open (if hours known) */
  isOpen?: boolean;

  /** When it opens/closes next */
  openingInfo?: {
    opensAt?: string;
    closesAt?: string;
    status: 'open' | 'closed' | 'closing_soon' | 'opens_soon' | 'unknown';
  };

  /** Was this already completed */
  isCompleted: boolean;

  /** Was this skipped */
  isSkipped: boolean;

  /** Tags for filtering */
  tags: string[];

  /** Enrichment timestamp */
  enrichedAt: Date;
}

/**
 * Check if an enriched activity should be shown
 */
export function shouldShowActivity(
  activity: EnrichedActivity,
  options: {
    includeCompleted?: boolean;
    includeSkipped?: boolean;
    requireTimeAppropriate?: boolean;
    requireWeatherAppropriate?: boolean;
    requireOpen?: boolean;
  } = {}
): boolean {
  const {
    includeCompleted = false,
    includeSkipped = false,
    requireTimeAppropriate = true,
    requireWeatherAppropriate = false,
    requireOpen = false,
  } = options;

  if (!includeCompleted && activity.isCompleted) return false;
  if (!includeSkipped && activity.isSkipped) return false;
  if (requireTimeAppropriate && !activity.isTimeAppropriate) return false;
  if (requireWeatherAppropriate && !activity.isWeatherAppropriate) return false;
  if (requireOpen && activity.openingInfo?.status === 'closed') return false;

  return true;
}

// ============================================================================
// Cross-Trip Memory Types (Epic 9 Integration)
// ============================================================================

/**
 * Stub types for cross-trip memory integration
 * Full implementation in Epic 9
 */

/**
 * Memory of a specific place the user loved
 */
export interface PlaceMemory {
  type: 'place_loved';
  placeId: string;
  placeName: string;
  city: string;
  tripId: string;
  visitedAt: Date;
  rating?: number;
  note?: string;
}

/**
 * Memory of a stated preference
 */
export interface PreferenceMemory {
  type: 'preference_stated';
  statement: string;
  tripId: string;
  statedAt: Date;
  category?: string;
}

/**
 * Memory of a behavioural pattern
 */
export interface PatternMemory {
  type: 'pattern_observed';
  pattern: string;
  confidence: number;
  observedCount: number;
  lastObservedAt: Date;
}

/**
 * Any specific memory type
 */
export type SpecificMemory = PlaceMemory | PreferenceMemory | PatternMemory;

/**
 * Learned behavioural patterns
 */
export interface LearnedPatterns {
  /** Tends to overplan and skip activities */
  typicallyOverplans: boolean;

  /** Prefers early morning activities */
  prefersEarlyMornings: boolean;

  /** Often skips museums */
  skipsMuseums: boolean;

  /** Prefers outdoor activities */
  prefersOutdoor: boolean;

  /** Takes longer at restaurants */
  lingersAtMeals: boolean;

  /** Likes to explore spontaneously */
  embracesSpontaneity: boolean;

  /** Sticks closely to schedule */
  followsSchedule: boolean;
}

/**
 * Summary of a past trip
 */
export interface PastTripSummary {
  tripId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  citiesVisited: string[];
  highlights: string[];
  overallRating?: number;
}

/**
 * Complete cross-trip memory
 */
export interface CrossTripMemory {
  /** User ID this memory belongs to */
  userId: string;

  /** Aggregated travel style */
  travelStyle: {
    preferredPace: 'relaxed' | 'balanced' | 'packed';
    preferredBudget: string;
    typicalTripLength: number;
    preferredAccommodation: string;
  };

  /** Aggregated interests (from all trips) */
  aggregatedInterests: Record<string, number>;

  /** Specific memories */
  specificMemories: SpecificMemory[];

  /** Forever List - places to revisit */
  foreverList: string[];

  /** Past trip summaries */
  pastTrips: PastTripSummary[];

  /** Learned patterns */
  patterns: Partial<LearnedPatterns>;

  /** When this memory was last updated */
  lastUpdatedAt: Date;

  /** Version for migrations */
  version: number;
}

/**
 * Create empty cross-trip memory
 */
export function createEmptyCrossTripMemory(userId: string): CrossTripMemory {
  return {
    userId,
    travelStyle: {
      preferredPace: 'balanced',
      preferredBudget: 'moderate',
      typicalTripLength: 5,
      preferredAccommodation: 'comfortable',
    },
    aggregatedInterests: {},
    specificMemories: [],
    foreverList: [],
    pastTrips: [],
    patterns: {},
    lastUpdatedAt: new Date(),
    version: 1,
  };
}

// ============================================================================
// TripBrain Configuration
// ============================================================================

/**
 * Configuration options for Trip Brain
 */
export interface TripBrainConfig {
  /** Scoring weights */
  scoringWeights: typeof DEFAULT_SCORING_WEIGHTS;

  /** Maximum distance to consider (meters) */
  maxDistanceMeters: number;

  /** How many recommendations to return by default */
  defaultRecommendationCount: number;

  /** Whether to use cross-trip memory */
  useCrossTripMemory: boolean;

  /** Whether to use weather data */
  useWeatherData: boolean;

  /** Minimum score to include in recommendations */
  minimumScore: number;

  /** Cache duration for enrichments (ms) */
  enrichmentCacheDuration: number;
}

/**
 * Default Trip Brain configuration
 */
export const DEFAULT_TRIP_BRAIN_CONFIG: TripBrainConfig = {
  scoringWeights: DEFAULT_SCORING_WEIGHTS,
  maxDistanceMeters: 5000, // 5km
  defaultRecommendationCount: 3,
  useCrossTripMemory: true,
  useWeatherData: true,
  minimumScore: 0.3,
  enrichmentCacheDuration: 5 * 60 * 1000, // 5 minutes
};

// ============================================================================
// API Types for TripBrain Service
// ============================================================================

/**
 * Options for getting recommendations
 */
export interface GetRecommendationsOptions {
  /** Number of recommendations to return */
  count?: number;

  /** Mode of recommendation */
  mode?: RecommendationMode;

  /** Filter by category */
  category?: string;

  /** Include completed activities */
  includeCompleted?: boolean;

  /** Include skipped activities */
  includeSkipped?: boolean;

  /** Minimum score threshold */
  minimumScore?: number;
}

/**
 * Options for craving search
 */
export interface CravingSearchOptions {
  /** The craving query (e.g., "sushi", "coffee") */
  query: string;

  /** Maximum results */
  limit?: number;

  /** Maximum distance in meters */
  maxDistance?: number;

  /** Require currently open */
  requireOpen?: boolean;
}

/**
 * Result of a craving search
 */
export interface CravingSearchResult {
  /** Matching enriched activities */
  results: EnrichedActivity[];

  /** Search query used */
  query: string;

  /** Total matches found */
  totalMatches: number;

  /** Interpretation of the query */
  interpretation?: string;
}

/**
 * Serendipity (surprise) result
 */
export interface SerendipityResult {
  /** The surprise recommendation */
  activity: EnrichedActivity;

  /** Why this was chosen as a surprise */
  reason: string;

  /** Serendipity score (how "surprising" it is) */
  serendipityScore: number;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { Coordinates } from '../hiddenGems';
export type { PlaceActivity, Itinerary } from '../itinerary';
export type { UserPreferences } from '../preferences';
