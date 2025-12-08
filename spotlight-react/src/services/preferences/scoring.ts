/**
 * Preference-Based Place Scoring
 *
 * WI-4.6: Integrates user preferences into place recommendations
 *
 * Architecture:
 * - Multi-factor scoring formula with tuneable weights
 * - Interest alignment based on category mapping
 * - Budget matching with tolerance zones
 * - Avoid list filtering with keyword matching
 * - Pace-based daily limits
 *
 * Scoring Formula:
 * preferenceMatchScore =
 *   (interestAlignment * 0.4) +
 *   (budgetMatch * 0.2) +
 *   (notInAvoid * 0.3) +
 *   (specificInterestMatch * 0.1)
 */

import type {
  UserPreferences,
  InterestCategories,
  BudgetLevel,
  TripPace,
  Avoidance,
  SpecificInterest,
} from './types';
import type { WaycraftCategory } from '../../utils/placeCategories';
import { getPrimaryCategory, getAllCategories } from '../../utils/placeCategories';

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal place interface for scoring
 * Compatible with HiddenGemPlace, CategorizedPlace, DiscoveryPlace
 */
export interface ScorablePlace {
  /** Place ID */
  id?: string;
  placeId?: string;
  /** Place name */
  name: string;
  /** Google Places types */
  types: string[];
  /** Price level (1-4, null if unknown) */
  priceLevel?: number | null;
  /** Existing hidden gem score (0-1) */
  hiddenGemScore?: number;
  /** Rating (1-5) */
  rating?: number;
  /** Is this a hidden gem? */
  isHiddenGem?: boolean;
}

/**
 * Scoring configuration with tuneable weights
 */
export interface ScoringWeights {
  /** Weight for interest category alignment (default: 0.4) */
  interestAlignment: number;
  /** Weight for budget matching (default: 0.2) */
  budgetMatch: number;
  /** Weight for not being in avoid list (default: 0.3) */
  notInAvoid: number;
  /** Weight for specific interest match (default: 0.1) */
  specificInterestMatch: number;
}

/**
 * Individual score breakdown for debugging/transparency
 */
export interface ScoreBreakdown {
  /** Overall preference match score (0-1) */
  total: number;
  /** Interest alignment score (0-1) */
  interestAlignment: number;
  /** Budget match score (0-1) */
  budgetMatch: number;
  /** Avoid list score (0 if avoided, 1 if not) */
  notInAvoid: number;
  /** Specific interest match (0-1) */
  specificInterestMatch: number;
  /** Hidden gem bonus if user prefers hidden gems */
  hiddenGemBonus: number;
  /** Which avoidances matched (if any) */
  matchedAvoidances: string[];
  /** Which specific interests matched (if any) */
  matchedInterests: string[];
  /** Primary category used for scoring */
  primaryCategory: WaycraftCategory;
}

/**
 * Place with preference score attached
 */
export interface ScoredPlace<T extends ScorablePlace> {
  /** Original place data */
  place: T;
  /** Preference match score (0-1) */
  preferenceScore: number;
  /** Combined score (preference + hidden gem if applicable) */
  combinedScore: number;
  /** Full breakdown for debugging */
  breakdown: ScoreBreakdown;
}

/**
 * Pace-based daily limits
 */
export interface PaceLimits {
  /** Minimum places per day */
  min: number;
  /** Maximum places per day */
  max: number;
  /** Recommended places per day */
  recommended: number;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default scoring weights (from spec)
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  interestAlignment: 0.4,
  budgetMatch: 0.2,
  notInAvoid: 0.3,
  specificInterestMatch: 0.1,
};

/**
 * Pace to daily limits mapping
 */
export const PACE_LIMITS: Record<TripPace, PaceLimits> = {
  relaxed: { min: 2, max: 3, recommended: 2 },
  balanced: { min: 3, max: 4, recommended: 4 },
  packed: { min: 5, max: 8, recommended: 6 },
};

/**
 * Budget level to acceptable price level ranges
 * priceLevel: 1 = budget, 2 = moderate, 3 = expensive, 4 = very expensive
 */
export const BUDGET_PRICE_RANGES: Record<BudgetLevel, { ideal: number[]; acceptable: number[] }> = {
  budget: { ideal: [1], acceptable: [1, 2] },
  moderate: { ideal: [1, 2], acceptable: [1, 2, 3] },
  comfort: { ideal: [2, 3], acceptable: [1, 2, 3, 4] },
  luxury: { ideal: [3, 4], acceptable: [2, 3, 4] },
};

// ============================================================================
// Interest Category Mapping
// ============================================================================

/**
 * Maps user interest categories to place categories
 *
 * Some interests map to multiple categories with different weights.
 * The primary mapping gets full weight, secondary mappings get partial weight.
 */
export const INTEREST_TO_CATEGORY_MAP: Record<
  keyof InterestCategories,
  { primary: WaycraftCategory[]; secondary?: WaycraftCategory[]; secondaryWeight?: number }
> = {
  food: {
    primary: ['food_drink'],
  },
  culture: {
    primary: ['culture'],
  },
  nature: {
    primary: ['nature'],
  },
  nightlife: {
    primary: ['nightlife'],
    secondary: ['food_drink'], // bars often overlap
    secondaryWeight: 0.3,
  },
  shopping: {
    primary: ['shopping'],
  },
  adventure: {
    primary: ['activities'],
    secondary: ['nature'], // outdoor adventure
    secondaryWeight: 0.5,
  },
  relaxation: {
    primary: ['wellness'],
    secondary: ['nature'], // peaceful nature spots
    secondaryWeight: 0.4,
  },
  photography: {
    primary: ['nature', 'culture'], // scenic spots
    secondary: ['activities'],
    secondaryWeight: 0.3,
  },
  beach: {
    primary: ['nature'], // beaches are in nature category
  },
  localExperiences: {
    primary: ['food_drink', 'culture', 'shopping'], // local gems
    secondary: ['activities'],
    secondaryWeight: 0.5,
  },
};

/**
 * Reverse mapping: category to relevant interests
 */
export const CATEGORY_TO_INTERESTS_MAP: Record<WaycraftCategory, (keyof InterestCategories)[]> = {
  food_drink: ['food', 'localExperiences'],
  culture: ['culture', 'photography', 'localExperiences'],
  nature: ['nature', 'adventure', 'relaxation', 'photography', 'beach'],
  nightlife: ['nightlife'],
  shopping: ['shopping', 'localExperiences'],
  activities: ['adventure', 'photography', 'localExperiences'],
  wellness: ['relaxation'],
  services: [],
  accommodation: [],
  other: [],
};

// ============================================================================
// Core Scoring Functions
// ============================================================================

/**
 * Calculate interest alignment score for a place
 *
 * Maps the place's category to user interests and returns
 * the highest matching interest strength.
 *
 * @param place - Place to score
 * @param interests - User's interest categories (0-1 values)
 * @returns Interest alignment score (0-1)
 */
export function calculateInterestAlignment(
  place: ScorablePlace,
  interests: InterestCategories
): { score: number; matchedCategory: WaycraftCategory } {
  const primaryCategory = getPrimaryCategory(place.types);
  const allCategories = getAllCategories(place.types);

  // Get relevant interests for this place's categories
  const relevantInterests = CATEGORY_TO_INTERESTS_MAP[primaryCategory] || [];

  if (relevantInterests.length === 0) {
    // No mapped interests - return neutral
    return { score: 0.5, matchedCategory: primaryCategory };
  }

  // Find the highest interest strength
  let maxScore = 0;
  for (const interestKey of relevantInterests) {
    const interestValue = interests[interestKey];
    if (interestValue > maxScore) {
      maxScore = interestValue;
    }
  }

  // Check secondary categories for additional boost
  for (const category of allCategories) {
    if (category === primaryCategory) continue;

    const secondaryInterests = CATEGORY_TO_INTERESTS_MAP[category] || [];
    for (const interestKey of secondaryInterests) {
      // Secondary categories contribute at 50% weight
      const boostedScore = interests[interestKey] * 0.5;
      if (boostedScore > maxScore) {
        maxScore = Math.min(1, maxScore + boostedScore * 0.2); // Small boost, capped at 1
      }
    }
  }

  return { score: maxScore, matchedCategory: primaryCategory };
}

/**
 * Calculate budget match score
 *
 * @param place - Place to score
 * @param budget - User's budget preference
 * @returns Budget match score (0-1)
 */
export function calculateBudgetMatch(
  place: ScorablePlace,
  budget: BudgetLevel
): number {
  const priceLevel = place.priceLevel;

  // Unknown price level - neutral score
  if (priceLevel === null || priceLevel === undefined) {
    return 0.5;
  }

  const priceRange = BUDGET_PRICE_RANGES[budget];

  // Ideal match
  if (priceRange.ideal.includes(priceLevel)) {
    return 1.0;
  }

  // Acceptable match
  if (priceRange.acceptable.includes(priceLevel)) {
    return 0.7;
  }

  // Out of range - calculate penalty based on distance
  const idealMin = Math.min(...priceRange.ideal);
  const idealMax = Math.max(...priceRange.ideal);

  if (priceLevel < idealMin) {
    // Cheaper than preferred - mild penalty
    return 0.4;
  } else {
    // More expensive than preferred - stronger penalty
    const distance = priceLevel - idealMax;
    return Math.max(0, 0.3 - distance * 0.1);
  }
}

/**
 * Check if a place matches any avoidances
 *
 * @param place - Place to check
 * @param avoidances - User's avoid list
 * @returns Object with score and matched avoidances
 */
export function checkAvoidances(
  place: ScorablePlace,
  avoidances: Avoidance[]
): { score: number; matched: string[] } {
  if (avoidances.length === 0) {
    return { score: 1.0, matched: [] };
  }

  const matched: string[] = [];
  const placeName = place.name.toLowerCase();
  const placeTypes = place.types.map((t) => t.toLowerCase());
  const primaryCategory = getPrimaryCategory(place.types).toLowerCase();

  for (const avoidance of avoidances) {
    const tag = avoidance.tag.toLowerCase();

    // Check name match
    if (placeName.includes(tag)) {
      matched.push(avoidance.tag);
      continue;
    }

    // Check type match
    if (placeTypes.some((type) => type.includes(tag) || tag.includes(type))) {
      matched.push(avoidance.tag);
      continue;
    }

    // Check category match
    if (primaryCategory.includes(tag) || tag.includes(primaryCategory)) {
      matched.push(avoidance.tag);
      continue;
    }

    // Common keyword mappings
    const keywordMappings: Record<string, string[]> = {
      museum: ['museum', 'gallery', 'culture'],
      museums: ['museum', 'gallery', 'culture'],
      crowded: ['tourist_attraction', 'popular'],
      crowds: ['tourist_attraction', 'popular'],
      tourist: ['tourist_attraction'],
      'tourist spots': ['tourist_attraction'],
      hiking: ['hiking_area', 'trail', 'nature'],
      'long walks': ['hiking_area', 'park'],
      nightlife: ['night_club', 'bar', 'nightlife'],
      bars: ['bar', 'pub', 'nightlife'],
      clubs: ['night_club', 'nightlife'],
      shopping: ['store', 'shopping', 'mall'],
      malls: ['shopping_mall', 'mall'],
      'fine dining': ['fine_dining', 'luxury'],
      expensive: ['luxury'],
      chains: ['chain', 'franchise'],
      'fast food': ['fast_food', 'fast_food_restaurant'],
    };

    const mappedTypes = keywordMappings[tag] || [];
    if (mappedTypes.some((mapped) => placeTypes.includes(mapped) || primaryCategory === mapped)) {
      matched.push(avoidance.tag);
    }
  }

  if (matched.length === 0) {
    return { score: 1.0, matched: [] };
  }

  // Calculate weighted penalty based on avoidance strength
  let totalPenalty = 0;
  for (const matchedTag of matched) {
    const avoidance = avoidances.find((a) => a.tag === matchedTag);
    if (avoidance) {
      totalPenalty += avoidance.strength;
    }
  }

  // Clamp penalty to max of 1
  const clampedPenalty = Math.min(1, totalPenalty);

  return { score: 1 - clampedPenalty, matched };
}

/**
 * Check if a place matches any specific interests
 *
 * @param place - Place to check
 * @param specificInterests - User's specific interests
 * @returns Object with score and matched interests
 */
export function checkSpecificInterests(
  place: ScorablePlace,
  specificInterests: SpecificInterest[]
): { score: number; matched: string[] } {
  if (specificInterests.length === 0) {
    return { score: 0, matched: [] };
  }

  const matched: string[] = [];
  const placeName = place.name.toLowerCase();
  const placeTypes = place.types.map((t) => t.toLowerCase());

  for (const interest of specificInterests) {
    const tag = interest.tag.toLowerCase();

    // Check name match
    if (placeName.includes(tag)) {
      matched.push(interest.tag);
      continue;
    }

    // Check type match
    if (placeTypes.some((type) => type.includes(tag) || tag.includes(type))) {
      matched.push(interest.tag);
      continue;
    }

    // Common interest keyword mappings
    const interestMappings: Record<string, string[]> = {
      wine: ['winery', 'wine_bar', 'wine'],
      coffee: ['cafe', 'coffee_shop', 'coffee'],
      beer: ['brewery', 'pub', 'bar'],
      'street art': ['art', 'gallery'],
      art: ['art_gallery', 'museum', 'art'],
      history: ['historical_landmark', 'museum', 'culture'],
      architecture: ['historical_landmark', 'culture'],
      'local markets': ['market', 'farmers_market'],
      markets: ['market', 'farmers_market', 'flea_market'],
      'street food': ['food', 'restaurant', 'street'],
      'live music': ['live_music_venue', 'jazz_club', 'concert_hall'],
      jazz: ['jazz_club', 'live_music_venue'],
      vintage: ['vintage_store', 'antique_shop'],
      antiques: ['antique_shop'],
      books: ['book_store', 'library'],
      bookshops: ['book_store'],
      viewpoints: ['scenic_point', 'viewpoint', 'nature'],
      views: ['scenic_point', 'viewpoint'],
      gardens: ['garden', 'botanical_garden'],
      beaches: ['beach'],
      hiking: ['hiking_area', 'trail', 'nature'],
      trails: ['hiking_area', 'trail'],
      photography: ['scenic_point', 'nature', 'culture'],
      sunset: ['scenic_point', 'beach', 'viewpoint'],
    };

    const mappedTypes = interestMappings[tag] || [];
    if (mappedTypes.some((mapped) => placeTypes.includes(mapped) || placeName.includes(mapped))) {
      matched.push(interest.tag);
    }
  }

  if (matched.length === 0) {
    return { score: 0, matched: [] };
  }

  // Calculate weighted score based on interest confidence
  let totalScore = 0;
  for (const matchedTag of matched) {
    const interest = specificInterests.find((i) => i.tag === matchedTag);
    if (interest) {
      totalScore += interest.confidence;
    }
  }

  // Normalize and cap at 1
  return { score: Math.min(1, totalScore / matched.length), matched };
}

/**
 * Calculate hidden gem bonus
 *
 * If user prefers hidden gems, places that are hidden gems get a bonus.
 *
 * @param place - Place to score
 * @param prefersHiddenGems - Whether user prefers hidden gems
 * @returns Hidden gem bonus (0 or positive value)
 */
export function calculateHiddenGemBonus(
  place: ScorablePlace,
  prefersHiddenGems: boolean
): number {
  if (!prefersHiddenGems) {
    return 0;
  }

  if (place.isHiddenGem) {
    // Strong bonus for confirmed hidden gems
    return 0.2;
  }

  if (place.hiddenGemScore && place.hiddenGemScore > 0.5) {
    // Partial bonus based on hidden gem score
    return place.hiddenGemScore * 0.1;
  }

  return 0;
}

// ============================================================================
// Main Scoring Function
// ============================================================================

/**
 * Calculate full preference score for a place
 *
 * Uses the formula from WI-4.6 spec:
 * preferenceMatchScore =
 *   (interestAlignment * 0.4) +
 *   (budgetMatch * 0.2) +
 *   (notInAvoid * 0.3) +
 *   (specificInterestMatch * 0.1)
 *
 * @param place - Place to score
 * @param preferences - User preferences
 * @param weights - Optional custom weights
 * @returns Full score breakdown
 */
export function calculatePreferenceScore(
  place: ScorablePlace,
  preferences: UserPreferences,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): ScoreBreakdown {
  // Calculate individual components
  const { score: interestScore, matchedCategory } = calculateInterestAlignment(
    place,
    preferences.interests.value
  );

  const budgetScore = calculateBudgetMatch(place, preferences.budget.value);

  const { score: avoidScore, matched: matchedAvoidances } = checkAvoidances(
    place,
    preferences.avoidances
  );

  const { score: specificScore, matched: matchedInterests } = checkSpecificInterests(
    place,
    preferences.specificInterests
  );

  const hiddenGemBonus = calculateHiddenGemBonus(
    place,
    preferences.prefersHiddenGems.value
  );

  // Apply weights
  const weightedTotal =
    interestScore * weights.interestAlignment +
    budgetScore * weights.budgetMatch +
    avoidScore * weights.notInAvoid +
    specificScore * weights.specificInterestMatch;

  // Add hidden gem bonus (additive, not weighted)
  const total = Math.min(1, weightedTotal + hiddenGemBonus);

  return {
    total,
    interestAlignment: interestScore,
    budgetMatch: budgetScore,
    notInAvoid: avoidScore,
    specificInterestMatch: specificScore,
    hiddenGemBonus,
    matchedAvoidances,
    matchedInterests,
    primaryCategory: matchedCategory,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Score and rank a list of places by preference match
 *
 * @param places - Places to score
 * @param preferences - User preferences
 * @param weights - Optional custom weights
 * @returns Scored places sorted by combined score (descending)
 */
export function rankPlacesByPreference<T extends ScorablePlace>(
  places: T[],
  preferences: UserPreferences,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): ScoredPlace<T>[] {
  const scored = places.map((place) => {
    const breakdown = calculatePreferenceScore(place, preferences, weights);

    // Combined score: preference score + partial hidden gem score if available
    const hiddenGemContribution = place.hiddenGemScore ? place.hiddenGemScore * 0.3 : 0;
    const combinedScore = breakdown.total * 0.7 + hiddenGemContribution;

    return {
      place,
      preferenceScore: breakdown.total,
      combinedScore,
      breakdown,
    };
  });

  // Sort by combined score, then by preference score, then by rating
  return scored.sort((a, b) => {
    if (b.combinedScore !== a.combinedScore) {
      return b.combinedScore - a.combinedScore;
    }
    if (b.preferenceScore !== a.preferenceScore) {
      return b.preferenceScore - a.preferenceScore;
    }
    const ratingA = a.place.rating || 0;
    const ratingB = b.place.rating || 0;
    return ratingB - ratingA;
  });
}

/**
 * Filter places that are avoided
 *
 * @param places - Places to filter
 * @param avoidances - User's avoid list
 * @returns Places not in avoid list
 */
export function filterAvoidedPlaces<T extends ScorablePlace>(
  places: T[],
  avoidances: Avoidance[]
): T[] {
  if (avoidances.length === 0) return places;

  return places.filter((place) => {
    const { score } = checkAvoidances(place, avoidances);
    return score > 0; // Keep places with any positive score
  });
}

/**
 * Get the daily place limit based on pace preference
 *
 * @param pace - User's pace preference
 * @returns Daily limits object
 */
export function getPaceLimits(pace: TripPace): PaceLimits {
  return PACE_LIMITS[pace];
}

/**
 * Get recommended number of places for a day
 *
 * @param pace - User's pace preference
 * @returns Recommended number of places
 */
export function getRecommendedPlacesPerDay(pace: TripPace): number {
  return PACE_LIMITS[pace].recommended;
}

/**
 * Limit places based on pace preference
 *
 * @param places - Ranked places
 * @param pace - User's pace preference
 * @param daysCount - Number of days (optional, for multi-day planning)
 * @returns Limited places
 */
export function limitByPace<T extends ScorablePlace>(
  places: ScoredPlace<T>[],
  pace: TripPace,
  daysCount: number = 1
): ScoredPlace<T>[] {
  const limits = getPaceLimits(pace);
  const maxPlaces = limits.max * daysCount;
  return places.slice(0, maxPlaces);
}

/**
 * Get top places per category based on preferences
 *
 * @param places - All places
 * @param preferences - User preferences
 * @param topN - Number of places per category
 * @returns Map of category to top scored places
 */
export function getTopPlacesPerCategory<T extends ScorablePlace>(
  places: T[],
  preferences: UserPreferences,
  topN: number = 5
): Map<WaycraftCategory, ScoredPlace<T>[]> {
  const scored = rankPlacesByPreference(places, preferences);
  const categoryMap = new Map<WaycraftCategory, ScoredPlace<T>[]>();

  for (const scoredPlace of scored) {
    const category = scoredPlace.breakdown.primaryCategory;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }

    const categoryPlaces = categoryMap.get(category)!;
    if (categoryPlaces.length < topN) {
      categoryPlaces.push(scoredPlace);
    }
  }

  return categoryMap;
}

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Format score breakdown for display/logging
 */
export function formatScoreBreakdown(breakdown: ScoreBreakdown): string {
  const lines = [
    `Total Score: ${(breakdown.total * 100).toFixed(1)}%`,
    `  Interest Alignment: ${(breakdown.interestAlignment * 100).toFixed(1)}% (category: ${breakdown.primaryCategory})`,
    `  Budget Match: ${(breakdown.budgetMatch * 100).toFixed(1)}%`,
    `  Not Avoided: ${(breakdown.notInAvoid * 100).toFixed(1)}%`,
    `  Specific Interests: ${(breakdown.specificInterestMatch * 100).toFixed(1)}%`,
    `  Hidden Gem Bonus: +${(breakdown.hiddenGemBonus * 100).toFixed(1)}%`,
  ];

  if (breakdown.matchedAvoidances.length > 0) {
    lines.push(`  Avoided: ${breakdown.matchedAvoidances.join(', ')}`);
  }

  if (breakdown.matchedInterests.length > 0) {
    lines.push(`  Matched Interests: ${breakdown.matchedInterests.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Get scoring configuration for transparency
 */
export function getScoringConfig(): {
  weights: ScoringWeights;
  paceLimits: Record<TripPace, PaceLimits>;
  budgetRanges: typeof BUDGET_PRICE_RANGES;
} {
  return {
    weights: { ...DEFAULT_SCORING_WEIGHTS },
    paceLimits: { ...PACE_LIMITS },
    budgetRanges: { ...BUDGET_PRICE_RANGES },
  };
}
