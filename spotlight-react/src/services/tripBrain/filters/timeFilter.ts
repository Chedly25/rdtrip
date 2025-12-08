/**
 * Time Filter
 *
 * WI-6.3: Filter activities based on current time appropriateness
 *
 * Extracted and enhanced from PocketLocal.tsx time intelligence system.
 *
 * Key Features:
 * - Time period detection (early morning → late night)
 * - Category-based appropriateness rules
 * - Keyword detection for special cases (nightlife, museums)
 * - Configurable time slots
 * - Opening hours awareness
 *
 * Design Decisions:
 * - Uses WaycraftCategory from itinerary types for consistency
 * - More granular time periods than PocketLocal for better filtering
 * - Supports both strict filtering and soft scoring
 * - Keywords are extensible via configuration
 */

import type { PlaceActivity } from '../../itinerary';
import type { TimePeriod } from '../types';
import { getTimePeriod } from '../types';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for time-based filtering
 */
export interface TimeFilterConfig {
  /** Categories appropriate for each time period */
  categoryRules: Record<TimePeriod, CategoryTimeRule>;

  /** Keywords that indicate nightlife-friendly activities */
  nightlifeKeywords: string[];

  /** Keywords that indicate daylight-only activities */
  daylightOnlyKeywords: string[];

  /** Keywords that indicate early-opening activities (cafés, bakeries) */
  earlyOpenKeywords: string[];

  /** Keywords that indicate late-night friendly activities */
  lateNightKeywords: string[];

  /** Hours definition for each time period */
  periodHours: Record<TimePeriod, { start: number; end: number }>;
}

/**
 * Rule for a category at a specific time
 */
export interface CategoryTimeRule {
  /** Categories that are fully appropriate */
  appropriate: string[];

  /** Categories that are marginally appropriate (lower score) */
  marginal: string[];

  /** Categories that are inappropriate (filtered out) */
  inappropriate: string[];
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Keywords indicating nightlife activities
 * These are allowed during evening/night even if category wouldn't normally be
 */
export const DEFAULT_NIGHTLIFE_KEYWORDS = [
  'bar', 'bars', 'wine', 'wine bar', 'cocktail', 'cocktails',
  'pub', 'pubs', 'lounge', 'nightclub', 'club', 'disco',
  'jazz', 'live music', 'karaoke', 'speakeasy', 'rooftop bar',
  'brewery', 'taproom', 'beer garden', 'tavern', 'cabaret',
  'late night', 'after dark', 'evening entertainment',
];

/**
 * Keywords indicating daylight-only activities
 * These are blocked during late night / early morning
 */
export const DEFAULT_DAYLIGHT_ONLY_KEYWORDS = [
  'museum', 'musée', 'museo', 'museums',
  'gallery', 'galerie', 'galleries',
  'château', 'chateau', 'castle', 'palace', 'palais',
  'church', 'cathedral', 'basilica', 'chapel', 'abbey',
  'temple', 'mosque', 'synagogue',
  'monument', 'memorial', 'historic site',
  'tour', 'guided tour', 'walking tour',
  'botanical garden', 'zoo', 'aquarium',
  'archaeological', 'ruins', 'excavation',
];

/**
 * Keywords for early-opening establishments
 */
export const DEFAULT_EARLY_OPEN_KEYWORDS = [
  'café', 'cafe', 'coffee', 'bakery', 'boulangerie',
  'breakfast', 'brunch', 'patisserie', 'pastry',
  'market', 'marché', 'farmers market',
  'sunrise', 'early bird', 'morning',
];

/**
 * Keywords for late-night friendly places
 */
export const DEFAULT_LATE_NIGHT_KEYWORDS = [
  '24 hour', '24h', 'open late', 'late night',
  'night owl', 'after hours', 'all night',
  'diner', 'kebab', 'pizza', 'fast food',
];

/**
 * Default time period hour ranges
 */
export const DEFAULT_PERIOD_HOURS: Record<TimePeriod, { start: number; end: number }> = {
  early_morning: { start: 5, end: 8 },
  morning: { start: 8, end: 12 },
  lunch: { start: 12, end: 14 },
  afternoon: { start: 14, end: 17 },
  evening: { start: 17, end: 21 },
  night: { start: 21, end: 5 }, // Wraps around midnight
};

/**
 * Default category rules for each time period
 * Uses WaycraftCategory values: food_drink, culture, nature, nightlife, shopping, activities, wellness
 */
export const DEFAULT_CATEGORY_RULES: Record<TimePeriod, CategoryTimeRule> = {
  early_morning: {
    appropriate: ['food_drink', 'nature', 'wellness'],
    marginal: ['activities'],
    inappropriate: ['culture', 'nightlife', 'shopping'],
  },
  morning: {
    appropriate: ['food_drink', 'culture', 'nature', 'activities', 'wellness', 'shopping'],
    marginal: [],
    inappropriate: ['nightlife'],
  },
  lunch: {
    appropriate: ['food_drink', 'shopping', 'culture'],
    marginal: ['activities', 'nature', 'wellness'],
    inappropriate: ['nightlife'],
  },
  afternoon: {
    appropriate: ['culture', 'activities', 'nature', 'shopping', 'food_drink', 'wellness'],
    marginal: [],
    inappropriate: ['nightlife'],
  },
  evening: {
    appropriate: ['food_drink', 'nightlife', 'culture'],
    marginal: ['activities', 'nature', 'shopping', 'wellness'],
    inappropriate: [],
  },
  night: {
    appropriate: ['food_drink', 'nightlife'],
    marginal: [],
    inappropriate: ['culture', 'nature', 'shopping', 'activities', 'wellness'],
  },
};

/**
 * Default time filter configuration
 */
export const DEFAULT_TIME_FILTER_CONFIG: TimeFilterConfig = {
  categoryRules: DEFAULT_CATEGORY_RULES,
  nightlifeKeywords: DEFAULT_NIGHTLIFE_KEYWORDS,
  daylightOnlyKeywords: DEFAULT_DAYLIGHT_ONLY_KEYWORDS,
  earlyOpenKeywords: DEFAULT_EARLY_OPEN_KEYWORDS,
  lateNightKeywords: DEFAULT_LATE_NIGHT_KEYWORDS,
  periodHours: DEFAULT_PERIOD_HOURS,
};

// ============================================================================
// Core Filter Functions
// ============================================================================

/**
 * Check if an activity is appropriate for a given time
 *
 * @param activity - The activity to check
 * @param hour - Hour of day (0-23)
 * @param config - Optional custom configuration
 * @returns true if activity is time-appropriate
 */
export function isActivityTimeAppropriate(
  activity: PlaceActivity,
  hour: number,
  config: TimeFilterConfig = DEFAULT_TIME_FILTER_CONFIG
): boolean {
  const result = getTimeAppropriatenessResult(activity, hour, config);
  return result.isAppropriate;
}

/**
 * Result of time appropriateness check
 */
export interface TimeAppropriatenessResult {
  /** Whether activity is time-appropriate */
  isAppropriate: boolean;

  /** Score from 0-1 (1 = perfect timing) */
  score: number;

  /** Current time period */
  period: TimePeriod;

  /** Reason for the result */
  reason: string;

  /** Special keywords detected */
  detectedKeywords: string[];

  /** Whether this was overridden by keywords */
  keywordOverride: boolean;
}

/**
 * Get detailed time appropriateness result
 *
 * @param activity - The activity to check
 * @param hour - Hour of day (0-23)
 * @param config - Optional custom configuration
 * @returns Detailed result with score and reason
 */
export function getTimeAppropriatenessResult(
  activity: PlaceActivity,
  hour: number,
  config: TimeFilterConfig = DEFAULT_TIME_FILTER_CONFIG
): TimeAppropriatenessResult {
  const period = getTimePeriod(hour);
  const category = activity.place.category;
  const rules = config.categoryRules[period];

  // Build searchable text from activity
  const searchText = buildSearchText(activity);
  const detectedKeywords: string[] = [];

  // Check for keyword overrides first
  const isNightTime = period === 'night' || (period === 'evening' && hour >= 20);
  const isEarlyTime = period === 'early_morning';

  // Nightlife keyword check - allows activity during night/evening
  if (isNightTime) {
    const nightlifeMatch = findMatchingKeywords(searchText, config.nightlifeKeywords);
    if (nightlifeMatch.length > 0) {
      detectedKeywords.push(...nightlifeMatch);
      return {
        isAppropriate: true,
        score: 1.0,
        period,
        reason: 'Nightlife activity - perfect for this time',
        detectedKeywords,
        keywordOverride: true,
      };
    }

    // Late night keywords (24h places, etc)
    const lateNightMatch = findMatchingKeywords(searchText, config.lateNightKeywords);
    if (lateNightMatch.length > 0) {
      detectedKeywords.push(...lateNightMatch);
      return {
        isAppropriate: true,
        score: 0.9,
        period,
        reason: 'Open late - available at this hour',
        detectedKeywords,
        keywordOverride: true,
      };
    }
  }

  // Daylight-only check - blocks activity during night/early morning
  if (isNightTime || isEarlyTime) {
    const daylightMatch = findMatchingKeywords(searchText, config.daylightOnlyKeywords);
    if (daylightMatch.length > 0) {
      detectedKeywords.push(...daylightMatch);
      return {
        isAppropriate: false,
        score: 0.1,
        period,
        reason: isNightTime
          ? 'Typically closed at night'
          : 'Not open this early',
        detectedKeywords,
        keywordOverride: true,
      };
    }
  }

  // Early morning - check for early-open keywords
  if (isEarlyTime) {
    const earlyMatch = findMatchingKeywords(searchText, config.earlyOpenKeywords);
    if (earlyMatch.length > 0) {
      detectedKeywords.push(...earlyMatch);
      return {
        isAppropriate: true,
        score: 1.0,
        period,
        reason: 'Opens early - great morning option',
        detectedKeywords,
        keywordOverride: true,
      };
    }
  }

  // Standard category-based check
  if (rules.appropriate.includes(category)) {
    return {
      isAppropriate: true,
      score: 1.0,
      period,
      reason: `${formatCategory(category)} is ideal for ${formatPeriod(period)}`,
      detectedKeywords,
      keywordOverride: false,
    };
  }

  if (rules.marginal.includes(category)) {
    return {
      isAppropriate: true,
      score: 0.6,
      period,
      reason: `${formatCategory(category)} is okay for ${formatPeriod(period)}`,
      detectedKeywords,
      keywordOverride: false,
    };
  }

  if (rules.inappropriate.includes(category)) {
    return {
      isAppropriate: false,
      score: 0.2,
      period,
      reason: `${formatCategory(category)} not ideal for ${formatPeriod(period)}`,
      detectedKeywords,
      keywordOverride: false,
    };
  }

  // Default - assume marginal if not explicitly listed
  return {
    isAppropriate: true,
    score: 0.5,
    period,
    reason: 'May be available at this time',
    detectedKeywords,
    keywordOverride: false,
  };
}

/**
 * Get a time-based score for an activity (0-1)
 *
 * @param activity - The activity to score
 * @param hour - Hour of day (0-23)
 * @param config - Optional custom configuration
 * @returns Score from 0 (inappropriate) to 1 (perfect timing)
 */
export function getTimeScore(
  activity: PlaceActivity,
  hour: number,
  config: TimeFilterConfig = DEFAULT_TIME_FILTER_CONFIG
): number {
  return getTimeAppropriatenessResult(activity, hour, config).score;
}

/**
 * Filter a list of activities by time appropriateness
 *
 * @param activities - Activities to filter
 * @param hour - Hour of day (0-23)
 * @param config - Optional custom configuration
 * @returns Filtered list of time-appropriate activities
 */
export function filterByTime(
  activities: PlaceActivity[],
  hour: number,
  config: TimeFilterConfig = DEFAULT_TIME_FILTER_CONFIG
): PlaceActivity[] {
  return activities.filter(activity =>
    isActivityTimeAppropriate(activity, hour, config)
  );
}

/**
 * Sort activities by time appropriateness score
 *
 * @param activities - Activities to sort
 * @param hour - Hour of day (0-23)
 * @param config - Optional custom configuration
 * @returns Sorted list (most appropriate first)
 */
export function sortByTimeScore(
  activities: PlaceActivity[],
  hour: number,
  config: TimeFilterConfig = DEFAULT_TIME_FILTER_CONFIG
): PlaceActivity[] {
  return [...activities].sort((a, b) => {
    const scoreA = getTimeScore(a, hour, config);
    const scoreB = getTimeScore(b, hour, config);
    return scoreB - scoreA;
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build searchable text from an activity
 */
function buildSearchText(activity: PlaceActivity): string {
  const parts = [
    activity.place.name,
    activity.place.description,
    activity.place.category,
    ...(activity.place.types || []),
  ].filter(Boolean);

  return parts.join(' ').toLowerCase();
}

/**
 * Find matching keywords in text
 */
function findMatchingKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * Format category for display
 */
function formatCategory(category: string): string {
  const formats: Record<string, string> = {
    food_drink: 'Dining',
    culture: 'Cultural attractions',
    nature: 'Outdoor activities',
    nightlife: 'Nightlife',
    shopping: 'Shopping',
    activities: 'Activities',
    wellness: 'Wellness',
  };
  return formats[category] || category;
}

/**
 * Format time period for display
 */
function formatPeriod(period: TimePeriod): string {
  const formats: Record<TimePeriod, string> = {
    early_morning: 'early morning',
    morning: 'the morning',
    lunch: 'lunchtime',
    afternoon: 'the afternoon',
    evening: 'the evening',
    night: 'late night',
  };
  return formats[period] || period;
}

// ============================================================================
// Advanced Filtering
// ============================================================================

/**
 * Options for advanced time filtering
 */
export interface AdvancedTimeFilterOptions {
  /** Hour to check (defaults to current hour) */
  hour?: number;

  /** Minimum score to include (0-1) */
  minScore?: number;

  /** Categories to always include regardless of time */
  alwaysIncludeCategories?: string[];

  /** Categories to always exclude regardless of time */
  alwaysExcludeCategories?: string[];

  /** Custom configuration */
  config?: TimeFilterConfig;
}

/**
 * Filter activities with advanced options
 */
export function filterByTimeAdvanced(
  activities: PlaceActivity[],
  options: AdvancedTimeFilterOptions = {}
): PlaceActivity[] {
  const {
    hour = new Date().getHours(),
    minScore = 0.3,
    alwaysIncludeCategories = [],
    alwaysExcludeCategories = [],
    config = DEFAULT_TIME_FILTER_CONFIG,
  } = options;

  return activities.filter(activity => {
    const category = activity.place.category;

    // Check exclusion list first
    if (alwaysExcludeCategories.includes(category)) {
      return false;
    }

    // Check inclusion list
    if (alwaysIncludeCategories.includes(category)) {
      return true;
    }

    // Standard time check
    const score = getTimeScore(activity, hour, config);
    return score >= minScore;
  });
}

// ============================================================================
// Time-Aware Suggestions
// ============================================================================

/**
 * Get a contextual greeting based on time of day
 */
export function getTimeGreeting(hour: number): {
  headline: string;
  subtext: string;
  mood: 'peaceful' | 'energetic' | 'relaxed' | 'intimate';
} {
  const period = getTimePeriod(hour);

  switch (period) {
    case 'early_morning':
      return {
        headline: 'First light',
        subtext: 'The city awakens',
        mood: 'peaceful',
      };
    case 'morning':
      return {
        headline: 'Good morning',
        subtext: 'A day of discovery awaits',
        mood: 'energetic',
      };
    case 'lunch':
      return {
        headline: 'Midday',
        subtext: 'Time to refuel',
        mood: 'relaxed',
      };
    case 'afternoon':
      return {
        headline: 'Afternoon',
        subtext: 'The perfect time to explore',
        mood: 'energetic',
      };
    case 'evening':
      return {
        headline: 'Good evening',
        subtext: 'Golden hour approaches',
        mood: 'relaxed',
      };
    case 'night':
      return {
        headline: 'The night is yours',
        subtext: 'Where the city reveals its secrets',
        mood: 'intimate',
      };
    default:
      return {
        headline: 'Hello',
        subtext: 'Ready to explore?',
        mood: 'relaxed',
      };
  }
}

/**
 * Get suggested activity types for the current time
 */
export function getSuggestedCategories(
  hour: number,
  config: TimeFilterConfig = DEFAULT_TIME_FILTER_CONFIG
): string[] {
  const period = getTimePeriod(hour);
  const rules = config.categoryRules[period];
  return rules.appropriate;
}

/**
 * Check if current time is good for outdoor activities
 */
export function isGoodForOutdoor(hour: number): boolean {
  const period = getTimePeriod(hour);
  return ['morning', 'afternoon', 'evening'].includes(period);
}

/**
 * Check if it's meal time
 */
export function isMealTime(hour: number): 'breakfast' | 'lunch' | 'dinner' | null {
  if (hour >= 7 && hour < 10) return 'breakfast';
  if (hour >= 12 && hour < 14) return 'lunch';
  if (hour >= 18 && hour < 21) return 'dinner';
  return null;
}

// ============================================================================
// Exports
// ============================================================================

export {
  getTimePeriod,
  type TimePeriod,
};
