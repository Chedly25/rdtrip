/**
 * Alternatives Service
 *
 * WI-5.7: Provides alternative activity suggestions for any itinerary slot
 *
 * Architecture:
 * - Fetches places from cityPlaces service
 * - Filters by time-appropriateness using CATEGORY_SLOT_APPROPRIATENESS
 * - Scores by user preferences using scoring.ts
 * - Returns a mix of similar (same category) and different (variety) options
 *
 * The service provides:
 * - Same category alternatives (similar to what's currently scheduled)
 * - Different category alternatives (for variety)
 * - All alternatives are time-appropriate for the slot
 * - All alternatives are preference-scored
 */

import { fetchCityPlaces, type CategorizedPlace } from '../cityPlaces';
import {
  rankPlacesByPreference,
  filterAvoidedPlaces,
  type ScoredPlace,
} from '../preferences/scoring';
import type { UserPreferences } from '../preferences/types';
import type { WaycraftCategory } from '../../utils/placeCategories';
import {
  type TimeSlot,
  type ItineraryPlace,
  type PlaceActivity,
  CATEGORY_SLOT_APPROPRIATENESS,
} from './types';
import type { Coordinates } from '../hiddenGems';

// ============================================================================
// Types
// ============================================================================

/**
 * Alternative with scoring and metadata
 */
export interface AlternativePlace {
  /** The place data */
  place: ItineraryPlace;
  /** Why this is suggested as alternative */
  reason: AlternativeReason;
  /** Preference match score (0-1) */
  preferenceScore: number;
  /** Time slot appropriateness score (0-1) */
  timeScore: number;
  /** Combined score for ranking */
  combinedScore: number;
  /** Whether this is same category as current activity */
  isSameCategory: boolean;
  /** Hidden gem indicator */
  isHiddenGem: boolean;
}

/**
 * Reason for suggesting this alternative
 */
export type AlternativeReason =
  | 'similar' // Same category, good match
  | 'hidden_gem' // Hidden gem in same/related category
  | 'variety' // Different category for variety
  | 'highly_rated' // Top rated in this slot
  | 'preference_match'; // Strong preference match

/**
 * Input for fetching alternatives
 */
export interface GetAlternativesInput {
  /** Current activity to find alternatives for */
  currentActivity: PlaceActivity;
  /** Time slot */
  slot: TimeSlot;
  /** City coordinates */
  cityCoordinates: Coordinates;
  /** City name */
  cityName?: string;
  /** User preferences for scoring */
  preferences: UserPreferences;
  /** IDs of places already in the itinerary (to exclude) */
  excludePlaceIds?: string[];
  /** Maximum alternatives to return (default: 10) */
  limit?: number;
}

/**
 * Output from fetching alternatives
 */
export interface AlternativesResult {
  /** Similar alternatives (same category) */
  similar: AlternativePlace[];
  /** Variety alternatives (different categories) */
  variety: AlternativePlace[];
  /** All alternatives combined and ranked */
  all: AlternativePlace[];
  /** Metadata */
  meta: {
    /** Current activity category */
    currentCategory: WaycraftCategory;
    /** Number of places considered */
    placesConsidered: number;
    /** Time slot appropriateness threshold used */
    timeThreshold: number;
  };
}

// ============================================================================
// Configuration
// ============================================================================

/** Minimum time appropriateness score to consider (0-1) */
const MIN_TIME_APPROPRIATENESS = 0.3;

/** Default number of alternatives to return */
const DEFAULT_LIMIT = 10;

/** Ratio of similar vs variety alternatives */
const SIMILAR_RATIO = 0.6; // 60% similar, 40% variety

/** Bonus for hidden gems in scoring */
const HIDDEN_GEM_BONUS = 0.15;

/** Categories to consider for variety (excludes services, accommodation) */
const VARIETY_CATEGORIES: WaycraftCategory[] = [
  'food_drink',
  'culture',
  'nature',
  'nightlife',
  'shopping',
  'activities',
  'wellness',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert CategorizedPlace to ItineraryPlace
 */
function toItineraryPlace(place: CategorizedPlace): ItineraryPlace {
  // Get photo URL from photos array if available
  const photoUrl = place.photos && place.photos.length > 0
    ? place.photos[0].url
    : undefined;

  return {
    placeId: place.placeId,
    name: place.name,
    coordinates: place.coordinates,
    rating: place.rating,
    reviewCount: place.reviewCount,
    category: place.category,
    types: place.types,
    priceLevel: place.priceLevel,
    photoUrl,
    openingHours: place.openingHours,
    hiddenGemScore: place.hiddenGemScore,
    description: place.editorialSummary,
    address: place.address,
  };
}

/**
 * Get time appropriateness score for a category in a slot
 */
function getTimeAppropriatenessScore(
  category: WaycraftCategory,
  slot: TimeSlot
): number {
  const appropriateness = CATEGORY_SLOT_APPROPRIATENESS[category];
  return appropriateness ? appropriateness[slot] : 0.5;
}

/**
 * Determine the reason for suggesting an alternative
 */
function determineReason(
  place: ScoredPlace<CategorizedPlace>,
  isSameCategory: boolean,
  isHiddenGem: boolean
): AlternativeReason {
  if (isHiddenGem && place.preferenceScore >= 0.6) {
    return 'hidden_gem';
  }
  if (isSameCategory) {
    return 'similar';
  }
  if (place.preferenceScore >= 0.8) {
    return 'preference_match';
  }
  if (place.place.rating && place.place.rating >= 4.5) {
    return 'highly_rated';
  }
  return 'variety';
}

/**
 * Calculate combined score for ranking
 */
function calculateCombinedScore(
  preferenceScore: number,
  timeScore: number,
  isHiddenGem: boolean,
  isSameCategory: boolean
): number {
  // Base: preference score weighted heavily
  let score = preferenceScore * 0.5;

  // Time appropriateness
  score += timeScore * 0.25;

  // Hidden gem bonus
  if (isHiddenGem) {
    score += HIDDEN_GEM_BONUS;
  }

  // Same category slight boost (helps keep similar at top of similar list)
  if (isSameCategory) {
    score += 0.05;
  }

  return Math.min(1, score);
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Get alternative activities for a slot
 *
 * This is the main function for WI-5.7. It:
 * 1. Fetches places for the city
 * 2. Filters by time appropriateness for the slot
 * 3. Scores by user preferences
 * 4. Returns a mix of similar and variety alternatives
 *
 * @param input - Input parameters
 * @returns Promise with alternatives result
 */
export async function getAlternatives(
  input: GetAlternativesInput
): Promise<AlternativesResult> {
  const {
    currentActivity,
    slot,
    cityCoordinates,
    cityName,
    preferences,
    excludePlaceIds = [],
    limit = DEFAULT_LIMIT,
  } = input;

  const currentCategory = currentActivity.place.category;
  const currentPlaceId = currentActivity.place.placeId;

  // Add current place to exclusion list
  const excludeSet = new Set([currentPlaceId, ...excludePlaceIds]);

  // Fetch city places
  const cityPlaces = await fetchCityPlaces(
    cityCoordinates,
    cityName,
    { useMock: false }
  );

  // Filter out excluded places
  const availablePlaces = cityPlaces.allPlaces.filter(
    (place) => !excludeSet.has(place.placeId)
  );

  // Filter out avoided places
  const notAvoided = filterAvoidedPlaces(availablePlaces, preferences.avoidances);

  // Filter by time appropriateness
  const timeAppropriate = notAvoided.filter((place) => {
    const timeScore = getTimeAppropriatenessScore(place.category, slot);
    return timeScore >= MIN_TIME_APPROPRIATENESS;
  });

  // Score by preferences
  const scoredPlaces = rankPlacesByPreference(timeAppropriate, preferences);

  // Separate into same category and different categories
  const sameCategoryPlaces: AlternativePlace[] = [];
  const differentCategoryPlaces: AlternativePlace[] = [];

  for (const scored of scoredPlaces) {
    const isSameCategory = scored.place.category === currentCategory;
    const isHiddenGem = scored.place.isHiddenGem || false;
    const timeScore = getTimeAppropriatenessScore(scored.place.category, slot);

    const alternative: AlternativePlace = {
      place: toItineraryPlace(scored.place),
      reason: determineReason(scored, isSameCategory, isHiddenGem),
      preferenceScore: scored.preferenceScore,
      timeScore,
      combinedScore: calculateCombinedScore(
        scored.preferenceScore,
        timeScore,
        isHiddenGem,
        isSameCategory
      ),
      isSameCategory,
      isHiddenGem,
    };

    if (isSameCategory) {
      sameCategoryPlaces.push(alternative);
    } else if (VARIETY_CATEGORIES.includes(scored.place.category)) {
      differentCategoryPlaces.push(alternative);
    }
  }

  // Sort each list by combined score
  sameCategoryPlaces.sort((a, b) => b.combinedScore - a.combinedScore);
  differentCategoryPlaces.sort((a, b) => b.combinedScore - a.combinedScore);

  // Calculate how many of each to return
  const similarLimit = Math.ceil(limit * SIMILAR_RATIO);
  const varietyLimit = limit - similarLimit;

  const similar = sameCategoryPlaces.slice(0, similarLimit);
  const variety = differentCategoryPlaces.slice(0, varietyLimit);

  // Combine and sort all
  const all = [...similar, ...variety].sort(
    (a, b) => b.combinedScore - a.combinedScore
  );

  return {
    similar,
    variety,
    all,
    meta: {
      currentCategory,
      placesConsidered: timeAppropriate.length,
      timeThreshold: MIN_TIME_APPROPRIATENESS,
    },
  };
}

/**
 * Get alternatives for an empty slot (no current activity)
 *
 * Similar to getAlternatives but without a current activity to compare against.
 * Returns the best options for this time slot based on preferences.
 *
 * @param slot - Time slot
 * @param cityCoordinates - City coordinates
 * @param cityName - Optional city name
 * @param preferences - User preferences
 * @param excludePlaceIds - Place IDs to exclude
 * @param limit - Maximum results
 * @returns Promise with alternatives
 */
export async function getSuggestionsForSlot(
  slot: TimeSlot,
  cityCoordinates: Coordinates,
  cityName: string | undefined,
  preferences: UserPreferences,
  excludePlaceIds: string[] = [],
  limit: number = DEFAULT_LIMIT
): Promise<AlternativePlace[]> {
  const excludeSet = new Set(excludePlaceIds);

  // Fetch city places
  const cityPlaces = await fetchCityPlaces(
    cityCoordinates,
    cityName,
    { useMock: false }
  );

  // Filter out excluded places
  const availablePlaces = cityPlaces.allPlaces.filter(
    (place) => !excludeSet.has(place.placeId)
  );

  // Filter out avoided places
  const notAvoided = filterAvoidedPlaces(availablePlaces, preferences.avoidances);

  // Filter by time appropriateness
  const timeAppropriate = notAvoided.filter((place) => {
    const timeScore = getTimeAppropriatenessScore(place.category, slot);
    return timeScore >= MIN_TIME_APPROPRIATENESS;
  });

  // Score by preferences
  const scoredPlaces = rankPlacesByPreference(timeAppropriate, preferences);

  // Convert to AlternativePlace
  const alternatives: AlternativePlace[] = scoredPlaces.map((scored) => {
    const isHiddenGem = scored.place.isHiddenGem || false;
    const timeScore = getTimeAppropriatenessScore(scored.place.category, slot);

    return {
      place: toItineraryPlace(scored.place),
      reason: isHiddenGem ? 'hidden_gem' : 'preference_match',
      preferenceScore: scored.preferenceScore,
      timeScore,
      combinedScore: calculateCombinedScore(
        scored.preferenceScore,
        timeScore,
        isHiddenGem,
        false
      ),
      isSameCategory: false, // No current activity to compare
      isHiddenGem,
    };
  });

  // Sort by combined score and limit
  return alternatives
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);
}

/**
 * Get quick alternatives for a specific category
 *
 * Useful for quick category-specific suggestions.
 *
 * @param category - Category to get alternatives for
 * @param slot - Time slot
 * @param cityCoordinates - City coordinates
 * @param preferences - User preferences
 * @param excludePlaceIds - Place IDs to exclude
 * @param limit - Maximum results
 * @returns Promise with alternatives
 */
export async function getAlternativesByCategory(
  category: WaycraftCategory,
  slot: TimeSlot,
  cityCoordinates: Coordinates,
  preferences: UserPreferences,
  excludePlaceIds: string[] = [],
  limit: number = 5
): Promise<AlternativePlace[]> {
  const excludeSet = new Set(excludePlaceIds);

  // Fetch city places
  const cityPlaces = await fetchCityPlaces(cityCoordinates, undefined, {
    categories: [category],
    useMock: false,
  });

  // Filter
  const availablePlaces = cityPlaces.allPlaces.filter(
    (place) =>
      !excludeSet.has(place.placeId) &&
      place.category === category
  );

  // Filter out avoided
  const notAvoided = filterAvoidedPlaces(availablePlaces, preferences.avoidances);

  // Check time appropriateness for the category
  const timeScore = getTimeAppropriatenessScore(category, slot);

  // Score by preferences
  const scoredPlaces = rankPlacesByPreference(notAvoided, preferences);

  // Convert and return
  return scoredPlaces.slice(0, limit).map((scored) => {
    const isHiddenGem = scored.place.isHiddenGem || false;

    return {
      place: toItineraryPlace(scored.place),
      reason: 'similar' as AlternativeReason,
      preferenceScore: scored.preferenceScore,
      timeScore,
      combinedScore: calculateCombinedScore(
        scored.preferenceScore,
        timeScore,
        isHiddenGem,
        true
      ),
      isSameCategory: true,
      isHiddenGem,
    };
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get reason label for display
 */
export function getReasonLabel(reason: AlternativeReason): string {
  switch (reason) {
    case 'similar':
      return 'Similar option';
    case 'hidden_gem':
      return 'Hidden gem';
    case 'variety':
      return 'Try something different';
    case 'highly_rated':
      return 'Highly rated';
    case 'preference_match':
      return 'Matches your style';
    default:
      return 'Suggested';
  }
}

/**
 * Get appropriate icon for reason
 */
export function getReasonIcon(reason: AlternativeReason): string {
  switch (reason) {
    case 'similar':
      return 'ArrowLeftRight';
    case 'hidden_gem':
      return 'Gem';
    case 'variety':
      return 'Sparkles';
    case 'highly_rated':
      return 'Star';
    case 'preference_match':
      return 'Heart';
    default:
      return 'MapPin';
  }
}

/**
 * Format score as percentage
 */
export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}
