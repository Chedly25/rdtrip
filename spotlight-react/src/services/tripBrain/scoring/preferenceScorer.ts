/**
 * Preference Scorer
 *
 * WI-6.5: Scores activities based on user preferences
 *
 * The preference scorer takes user preferences (from Epic 4) and calculates
 * how well an activity matches those preferences. It considers:
 *
 * - Category interest strength (food, culture, nature, etc.)
 * - Specific interest tags (wine, street art, local markets)
 * - Avoidances (crowded places, museums, hiking)
 * - Hidden gem preference
 * - Budget/price level match
 * - Dining style match (for food & drink)
 *
 * Key Design Decisions:
 * - Scores normalized to 0-1 range
 * - Category mapping handles WaycraftCategory → InterestCategories
 * - Specific interests use fuzzy text matching
 * - Avoidances can reduce score below 0.5 (dispreference)
 * - Confidence reflects how much preference data we have
 */

import type { PlaceActivity } from '../../itinerary';
import type {
  UserPreferences,
  InterestCategories,
  SpecificInterest,
  Avoidance,
  BudgetLevel,
  DiningStyle,
} from '../../preferences';
import type { WaycraftCategory } from '../../../utils/placeCategories';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for preference scoring
 */
export interface PreferenceScorerConfig {
  /** Weight for category interest match (0-1) */
  categoryWeight: number;

  /** Weight for specific interest matches (0-1) */
  specificInterestWeight: number;

  /** Weight for avoidance penalties (0-1) */
  avoidanceWeight: number;

  /** Weight for hidden gem preference (0-1) */
  hiddenGemWeight: number;

  /** Weight for budget/price match (0-1) */
  budgetWeight: number;

  /** Weight for dining style match (0-1) */
  diningStyleWeight: number;

  /** Minimum confidence to apply strong scores */
  minimumConfidence: number;

  /** Base score when no preferences available */
  defaultScore: number;

  /** Penalty multiplier for avoidances */
  avoidancePenaltyMultiplier: number;

  /** Bonus for matching specific interests */
  specificInterestBonus: number;
}

/**
 * Default preference scorer configuration
 */
export const DEFAULT_PREFERENCE_SCORER_CONFIG: PreferenceScorerConfig = {
  categoryWeight: 0.35,
  specificInterestWeight: 0.25,
  avoidanceWeight: 0.15,
  hiddenGemWeight: 0.10,
  budgetWeight: 0.10,
  diningStyleWeight: 0.05,
  minimumConfidence: 0.3,
  defaultScore: 0.5,
  avoidancePenaltyMultiplier: 0.5,
  specificInterestBonus: 0.15,
};

// ============================================================================
// Category to Interest Mapping
// ============================================================================

/**
 * Maps WaycraftCategory to InterestCategories keys
 * Some categories map to multiple interests with weights
 */
export interface CategoryInterestMapping {
  /** Primary interest category */
  primary: keyof InterestCategories;
  /** Weight for primary (0-1) */
  primaryWeight: number;
  /** Secondary interest category (optional) */
  secondary?: keyof InterestCategories;
  /** Weight for secondary (0-1) */
  secondaryWeight?: number;
}

/**
 * Category to interest mapping
 */
export const CATEGORY_INTEREST_MAP: Record<WaycraftCategory, CategoryInterestMapping> = {
  food_drink: {
    primary: 'food',
    primaryWeight: 1.0,
  },
  culture: {
    primary: 'culture',
    primaryWeight: 1.0,
  },
  nature: {
    primary: 'nature',
    primaryWeight: 0.8,
    secondary: 'adventure',
    secondaryWeight: 0.2,
  },
  nightlife: {
    primary: 'nightlife',
    primaryWeight: 1.0,
  },
  shopping: {
    primary: 'shopping',
    primaryWeight: 0.8,
    secondary: 'localExperiences',
    secondaryWeight: 0.2,
  },
  activities: {
    primary: 'adventure',
    primaryWeight: 0.6,
    secondary: 'localExperiences',
    secondaryWeight: 0.4,
  },
  wellness: {
    primary: 'relaxation',
    primaryWeight: 1.0,
  },
  services: {
    primary: 'localExperiences',
    primaryWeight: 0.5,
  },
  accommodation: {
    primary: 'relaxation',
    primaryWeight: 0.5,
  },
  other: {
    primary: 'localExperiences',
    primaryWeight: 0.5,
  },
};

/**
 * Get interest score for a category from user interests
 */
export function getCategoryInterestScore(
  category: WaycraftCategory,
  interests: InterestCategories
): number {
  const mapping = CATEGORY_INTEREST_MAP[category];
  if (!mapping) return 0.5;

  let score = interests[mapping.primary] * mapping.primaryWeight;

  if (mapping.secondary && mapping.secondaryWeight) {
    score += interests[mapping.secondary] * mapping.secondaryWeight;
  }

  return Math.min(1, Math.max(0, score));
}

// ============================================================================
// Specific Interest Matching
// ============================================================================

/**
 * Keywords associated with specific interests for fuzzy matching
 */
export const INTEREST_KEYWORDS: Record<string, string[]> = {
  // Food & Drink related
  wine: ['wine', 'winery', 'vineyard', 'sommelier', 'cellar'],
  coffee: ['coffee', 'cafe', 'espresso', 'barista', 'roaster'],
  craft_beer: ['brewery', 'craft beer', 'taproom', 'ale', 'microbrewery'],
  fine_dining: ['michelin', 'fine dining', 'gourmet', 'tasting menu', 'haute cuisine'],
  street_food: ['street food', 'food truck', 'market food', 'hawker', 'stall'],
  local_cuisine: ['local', 'traditional', 'authentic', 'regional', 'specialty'],

  // Culture related
  art: ['art', 'gallery', 'exhibition', 'museum', 'painting', 'sculpture'],
  history: ['history', 'historic', 'heritage', 'ancient', 'medieval', 'colonial'],
  architecture: ['architecture', 'building', 'design', 'facade', 'structure'],
  music: ['music', 'concert', 'jazz', 'live music', 'orchestra', 'symphony'],

  // Nature related
  hiking: ['hiking', 'trail', 'trek', 'walking path', 'nature walk'],
  beach: ['beach', 'coast', 'seaside', 'shore', 'oceanfront'],
  gardens: ['garden', 'botanical', 'flowers', 'plants', 'greenhouse'],
  wildlife: ['wildlife', 'animals', 'zoo', 'safari', 'birds'],

  // Activity related
  adventure: ['adventure', 'extreme', 'thrill', 'exciting', 'adrenaline'],
  water_sports: ['surfing', 'kayak', 'diving', 'snorkeling', 'swimming'],
  photography: ['photography', 'photo', 'scenic', 'viewpoint', 'panoramic'],

  // Lifestyle related
  wellness: ['spa', 'wellness', 'massage', 'yoga', 'meditation', 'relax'],
  nightlife: ['nightlife', 'club', 'bar', 'pub', 'lounge', 'dancing'],
  shopping: ['shopping', 'boutique', 'market', 'store', 'mall'],
};

/**
 * Build searchable text from an activity
 */
function buildActivitySearchText(activity: PlaceActivity): string {
  const parts = [
    activity.place.name,
    activity.place.description || '',
    activity.place.category,
    ...(activity.place.types || []),
    activity.notes || '',
  ];
  return parts.join(' ').toLowerCase();
}

/**
 * Check if activity matches a specific interest tag
 */
export function matchesInterestTag(
  activity: PlaceActivity,
  tag: string
): { matches: boolean; strength: number } {
  const searchText = buildActivitySearchText(activity);
  const tagLower = tag.toLowerCase();

  // Direct match
  if (searchText.includes(tagLower)) {
    return { matches: true, strength: 1.0 };
  }

  // Check keyword synonyms
  const keywords = INTEREST_KEYWORDS[tagLower] || [];
  for (const keyword of keywords) {
    if (searchText.includes(keyword.toLowerCase())) {
      return { matches: true, strength: 0.8 };
    }
  }

  // Partial match (any word in the tag)
  const tagWords = tagLower.split(/\s+/);
  for (const word of tagWords) {
    if (word.length > 3 && searchText.includes(word)) {
      return { matches: true, strength: 0.5 };
    }
  }

  return { matches: false, strength: 0 };
}

/**
 * Calculate score from specific interest matches
 */
export function getSpecificInterestScore(
  activity: PlaceActivity,
  specificInterests: SpecificInterest[]
): { score: number; matchedInterests: string[] } {
  if (!specificInterests || specificInterests.length === 0) {
    return { score: 0.5, matchedInterests: [] };
  }

  const matchedInterests: string[] = [];
  let totalMatchStrength = 0;
  let totalWeight = 0;

  for (const interest of specificInterests) {
    const match = matchesInterestTag(activity, interest.tag);
    if (match.matches) {
      matchedInterests.push(interest.tag);
      totalMatchStrength += match.strength * interest.confidence;
      totalWeight += interest.confidence;
    }
  }

  if (matchedInterests.length === 0) {
    return { score: 0.5, matchedInterests: [] };
  }

  // Score based on matches (bonus above neutral)
  const matchScore = 0.5 + (totalMatchStrength / totalWeight) * 0.5;
  return {
    score: Math.min(1, matchScore),
    matchedInterests,
  };
}

// ============================================================================
// Avoidance Matching
// ============================================================================

/**
 * Keywords for common avoidances
 */
export const AVOIDANCE_KEYWORDS: Record<string, string[]> = {
  crowds: ['popular', 'famous', 'tourist', 'crowded', 'busy', 'landmark'],
  museums: ['museum', 'gallery', 'exhibition', 'art museum'],
  hiking: ['hiking', 'trail', 'trek', 'climb', 'mountain'],
  nightlife: ['club', 'bar', 'nightlife', 'pub', 'party'],
  shopping: ['shopping', 'mall', 'store', 'boutique', 'market'],
  outdoor: ['outdoor', 'nature', 'park', 'trail', 'hiking'],
  expensive: ['luxury', 'fine dining', 'upscale', 'premium', 'exclusive'],
  spicy_food: ['spicy', 'hot', 'chili', 'pepper'],
  seafood: ['seafood', 'fish', 'sushi', 'shellfish', 'oyster'],
};

/**
 * Check if activity matches an avoidance
 */
export function matchesAvoidance(
  activity: PlaceActivity,
  avoidance: Avoidance
): { matches: boolean; strength: number } {
  const searchText = buildActivitySearchText(activity);
  const tagLower = avoidance.tag.toLowerCase();

  // Direct match
  if (searchText.includes(tagLower)) {
    return { matches: true, strength: avoidance.strength };
  }

  // Check keyword synonyms
  const keywords = AVOIDANCE_KEYWORDS[tagLower] || [];
  for (const keyword of keywords) {
    if (searchText.includes(keyword.toLowerCase())) {
      return { matches: true, strength: avoidance.strength * 0.8 };
    }
  }

  // Category-level avoidance
  if (activity.place.category === tagLower) {
    return { matches: true, strength: avoidance.strength };
  }

  return { matches: false, strength: 0 };
}

/**
 * Calculate penalty from avoidance matches
 */
export function getAvoidancePenalty(
  activity: PlaceActivity,
  avoidances: Avoidance[]
): { penalty: number; matchedAvoidances: string[] } {
  if (!avoidances || avoidances.length === 0) {
    return { penalty: 0, matchedAvoidances: [] };
  }

  const matchedAvoidances: string[] = [];
  let maxPenalty = 0;

  for (const avoidance of avoidances) {
    const match = matchesAvoidance(activity, avoidance);
    if (match.matches) {
      matchedAvoidances.push(avoidance.tag);
      maxPenalty = Math.max(maxPenalty, match.strength);
    }
  }

  return {
    penalty: maxPenalty,
    matchedAvoidances,
  };
}

// ============================================================================
// Budget & Price Matching
// ============================================================================

/**
 * Budget level to price level mapping
 */
export const BUDGET_PRICE_MAP: Record<BudgetLevel, { min: number; max: number; ideal: number }> = {
  budget: { min: 1, max: 2, ideal: 1 },
  moderate: { min: 1, max: 3, ideal: 2 },
  comfort: { min: 2, max: 4, ideal: 3 },
  luxury: { min: 3, max: 4, ideal: 4 },
};

/**
 * Calculate budget match score
 */
export function getBudgetMatchScore(
  priceLevel: number | null | undefined,
  budgetLevel: BudgetLevel
): number {
  if (priceLevel === null || priceLevel === undefined) {
    return 0.5; // Neutral if no price info
  }

  const budget = BUDGET_PRICE_MAP[budgetLevel];
  if (!budget) return 0.5;

  // Perfect match
  if (priceLevel === budget.ideal) return 1.0;

  // Within acceptable range
  if (priceLevel >= budget.min && priceLevel <= budget.max) {
    const distance = Math.abs(priceLevel - budget.ideal);
    return 1.0 - distance * 0.2;
  }

  // Outside range - penalty
  const distance = priceLevel < budget.min
    ? budget.min - priceLevel
    : priceLevel - budget.max;
  return Math.max(0.2, 0.5 - distance * 0.15);
}

// ============================================================================
// Dining Style Matching
// ============================================================================

/**
 * Keywords for dining styles
 */
export const DINING_STYLE_KEYWORDS: Record<DiningStyle, string[]> = {
  street_food: ['street food', 'food truck', 'stall', 'hawker', 'market food', 'casual', 'takeaway'],
  casual: ['casual', 'bistro', 'cafe', 'diner', 'pub food', 'family'],
  mixed: [], // Matches anything
  fine_dining: ['fine dining', 'michelin', 'upscale', 'gourmet', 'tasting menu', 'elegant', 'sophisticated'],
};

/**
 * Calculate dining style match score
 */
export function getDiningStyleScore(
  activity: PlaceActivity,
  diningStyle: DiningStyle
): number {
  // Only applies to food & drink
  if (activity.place.category !== 'food_drink') {
    return 0.5;
  }

  // Mixed style matches everything
  if (diningStyle === 'mixed') {
    return 0.6;
  }

  const searchText = buildActivitySearchText(activity);
  const keywords = DINING_STYLE_KEYWORDS[diningStyle];

  for (const keyword of keywords) {
    if (searchText.includes(keyword.toLowerCase())) {
      return 0.9;
    }
  }

  // Price level can indicate dining style
  const priceLevel = activity.place.priceLevel;
  if (priceLevel !== null && priceLevel !== undefined) {
    if (diningStyle === 'fine_dining' && priceLevel >= 3) return 0.8;
    if (diningStyle === 'street_food' && priceLevel <= 1) return 0.8;
    if (diningStyle === 'casual' && priceLevel <= 2) return 0.7;
  }

  return 0.5;
}

// ============================================================================
// Hidden Gem Preference
// ============================================================================

/**
 * Calculate hidden gem preference score
 */
export function getHiddenGemScore(
  activity: PlaceActivity,
  prefersHiddenGems: boolean
): number {
  const isHiddenGem = activity.isHiddenGem || (activity.place.hiddenGemScore ?? 0) > 0.6;

  if (prefersHiddenGems) {
    return isHiddenGem ? 1.0 : 0.4;
  } else {
    // Slight bonus for non-hidden gems (more mainstream)
    return isHiddenGem ? 0.5 : 0.6;
  }
}

// ============================================================================
// Main Scoring Functions
// ============================================================================

/**
 * Detailed preference score result
 */
export interface PreferenceScoreResult {
  /** Final preference score (0-1) */
  score: number;

  /** Confidence in this score based on preference data quality */
  confidence: number;

  /** Score breakdown by component */
  breakdown: {
    category: {
      score: number;
      weight: number;
      contribution: number;
      interestLevel: number;
    };
    specificInterests: {
      score: number;
      weight: number;
      contribution: number;
      matchedTags: string[];
    };
    avoidances: {
      score: number;
      weight: number;
      contribution: number;
      matchedTags: string[];
    };
    hiddenGem: {
      score: number;
      weight: number;
      contribution: number;
    };
    budget: {
      score: number;
      weight: number;
      contribution: number;
    };
    diningStyle: {
      score: number;
      weight: number;
      contribution: number;
    };
  };

  /** Human-readable reasons */
  reasons: string[];

  /** Is this a strong match (score > 0.7)? */
  isStrongMatch: boolean;

  /** Should avoid this activity? */
  shouldAvoid: boolean;
}

/**
 * Get detailed preference score for an activity
 */
export function getPreferenceScoreResult(
  activity: PlaceActivity,
  preferences: UserPreferences | null,
  config: PreferenceScorerConfig = DEFAULT_PREFERENCE_SCORER_CONFIG
): PreferenceScoreResult {
  // Default result for no preferences
  if (!preferences) {
    return {
      score: config.defaultScore,
      confidence: 0,
      breakdown: {
        category: { score: 0.5, weight: config.categoryWeight, contribution: config.categoryWeight * 0.5, interestLevel: 0.5 },
        specificInterests: { score: 0.5, weight: config.specificInterestWeight, contribution: config.specificInterestWeight * 0.5, matchedTags: [] },
        avoidances: { score: 1.0, weight: config.avoidanceWeight, contribution: config.avoidanceWeight * 1.0, matchedTags: [] },
        hiddenGem: { score: 0.5, weight: config.hiddenGemWeight, contribution: config.hiddenGemWeight * 0.5 },
        budget: { score: 0.5, weight: config.budgetWeight, contribution: config.budgetWeight * 0.5 },
        diningStyle: { score: 0.5, weight: config.diningStyleWeight, contribution: config.diningStyleWeight * 0.5 },
      },
      reasons: ['No preference data available'],
      isStrongMatch: false,
      shouldAvoid: false,
    };
  }

  const reasons: string[] = [];

  // 1. Category interest score
  const categoryInterestLevel = getCategoryInterestScore(
    activity.place.category,
    preferences.interests.value
  );
  const categoryScore = categoryInterestLevel;
  const categoryContribution = categoryScore * config.categoryWeight;

  if (categoryInterestLevel > 0.7) {
    reasons.push(`Matches your love for ${activity.place.category.replace('_', ' ')}`);
  }

  // 2. Specific interest matches
  const specificResult = getSpecificInterestScore(activity, preferences.specificInterests);
  const specificScore = specificResult.score;
  const specificContribution = specificScore * config.specificInterestWeight;

  if (specificResult.matchedInterests.length > 0) {
    reasons.push(`Matches: ${specificResult.matchedInterests.slice(0, 2).join(', ')}`);
  }

  // 3. Avoidance penalties
  const avoidanceResult = getAvoidancePenalty(activity, preferences.avoidances);
  const avoidanceScore = 1.0 - avoidanceResult.penalty * config.avoidancePenaltyMultiplier;
  const avoidanceContribution = avoidanceScore * config.avoidanceWeight;

  if (avoidanceResult.matchedAvoidances.length > 0) {
    reasons.push(`Note: You typically avoid ${avoidanceResult.matchedAvoidances[0]}`);
  }

  // 4. Hidden gem preference
  const hiddenGemScore = getHiddenGemScore(
    activity,
    preferences.prefersHiddenGems.value
  );
  const hiddenGemContribution = hiddenGemScore * config.hiddenGemWeight;

  if (preferences.prefersHiddenGems.value && activity.isHiddenGem) {
    reasons.push('Hidden gem - just your style');
  }

  // 5. Budget match
  const budgetScore = getBudgetMatchScore(
    activity.place.priceLevel,
    preferences.budget.value
  );
  const budgetContribution = budgetScore * config.budgetWeight;

  // 6. Dining style match
  const diningStyleScore = getDiningStyleScore(activity, preferences.diningStyle.value);
  const diningStyleContribution = diningStyleScore * config.diningStyleWeight;

  // Calculate final score
  const totalContribution =
    categoryContribution +
    specificContribution +
    avoidanceContribution +
    hiddenGemContribution +
    budgetContribution +
    diningStyleContribution;

  // Normalize to 0-1 (weights should sum to 1)
  const totalWeight =
    config.categoryWeight +
    config.specificInterestWeight +
    config.avoidanceWeight +
    config.hiddenGemWeight +
    config.budgetWeight +
    config.diningStyleWeight;

  const finalScore = totalContribution / totalWeight;

  // Calculate confidence based on preference data quality
  const confidence = Math.min(
    1,
    (preferences.overallConfidence +
      (preferences.specificInterests.length > 0 ? 0.2 : 0) +
      (preferences.avoidances.length > 0 ? 0.1 : 0)) /
      1.3
  );

  const isStrongMatch = finalScore > 0.7 && confidence >= config.minimumConfidence;
  const shouldAvoid = avoidanceResult.penalty > 0.7;

  return {
    score: finalScore,
    confidence,
    breakdown: {
      category: {
        score: categoryScore,
        weight: config.categoryWeight,
        contribution: categoryContribution,
        interestLevel: categoryInterestLevel,
      },
      specificInterests: {
        score: specificScore,
        weight: config.specificInterestWeight,
        contribution: specificContribution,
        matchedTags: specificResult.matchedInterests,
      },
      avoidances: {
        score: avoidanceScore,
        weight: config.avoidanceWeight,
        contribution: avoidanceContribution,
        matchedTags: avoidanceResult.matchedAvoidances,
      },
      hiddenGem: {
        score: hiddenGemScore,
        weight: config.hiddenGemWeight,
        contribution: hiddenGemContribution,
      },
      budget: {
        score: budgetScore,
        weight: config.budgetWeight,
        contribution: budgetContribution,
      },
      diningStyle: {
        score: diningStyleScore,
        weight: config.diningStyleWeight,
        contribution: diningStyleContribution,
      },
    },
    reasons,
    isStrongMatch,
    shouldAvoid,
  };
}

/**
 * Get simple preference score for an activity
 */
export function getPreferenceScore(
  activity: PlaceActivity,
  preferences: UserPreferences | null,
  config: PreferenceScorerConfig = DEFAULT_PREFERENCE_SCORER_CONFIG
): number {
  return getPreferenceScoreResult(activity, preferences, config).score;
}

// ============================================================================
// Activity Filtering & Sorting
// ============================================================================

/**
 * Filter activities by preference score threshold
 */
export function filterByPreferenceScore(
  activities: PlaceActivity[],
  preferences: UserPreferences | null,
  minimumScore: number = 0.4,
  config: PreferenceScorerConfig = DEFAULT_PREFERENCE_SCORER_CONFIG
): PlaceActivity[] {
  return activities.filter(
    (activity) => getPreferenceScore(activity, preferences, config) >= minimumScore
  );
}

/**
 * Sort activities by preference score (highest first)
 */
export function sortByPreferenceScore(
  activities: PlaceActivity[],
  preferences: UserPreferences | null,
  config: PreferenceScorerConfig = DEFAULT_PREFERENCE_SCORER_CONFIG
): PlaceActivity[] {
  return [...activities].sort((a, b) => {
    const scoreA = getPreferenceScore(a, preferences, config);
    const scoreB = getPreferenceScore(b, preferences, config);
    return scoreB - scoreA;
  });
}

/**
 * Filter out activities that match avoidances
 */
export function filterOutAvoidances(
  activities: PlaceActivity[],
  avoidances: Avoidance[],
  strictness: number = 0.7
): PlaceActivity[] {
  return activities.filter((activity) => {
    const { penalty } = getAvoidancePenalty(activity, avoidances);
    return penalty < strictness;
  });
}

// ============================================================================
// Preference Learning from History
// ============================================================================

/**
 * Activity completion record for learning
 */
export interface ActivityCompletion {
  activity: PlaceActivity;
  completedAt: Date;
  rating?: number; // User rating if provided
  duration?: number; // Time spent in minutes
}

/**
 * Activity skip record for learning
 */
export interface ActivitySkip {
  activity: PlaceActivity;
  skippedAt: Date;
  reason?: string;
}

/**
 * Learned preference adjustment
 */
export interface LearnedPreferenceAdjustment {
  /** Interest adjustments (delta to apply) */
  interestAdjustments: Partial<InterestCategories>;

  /** New specific interests discovered */
  discoveredInterests: SpecificInterest[];

  /** Potential avoidances based on skips */
  potentialAvoidances: Avoidance[];

  /** Hidden gem preference adjustment */
  hiddenGemAdjustment: number;

  /** Confidence in these adjustments */
  confidence: number;

  /** Number of activities analyzed */
  sampleSize: number;
}

/**
 * Build preference adjustments from user history
 *
 * Analyzes completed and skipped activities to learn user preferences.
 * Returns adjustments that can be applied to existing preferences.
 */
export function buildPreferencesFromHistory(
  completions: ActivityCompletion[],
  skips: ActivitySkip[]
): LearnedPreferenceAdjustment {
  const interestAdjustments: Partial<InterestCategories> = {};
  const discoveredInterests: SpecificInterest[] = [];
  const potentialAvoidances: Avoidance[] = [];
  let hiddenGemAdjustment = 0;

  // Track category engagement
  const categoryCompletions: Record<string, number> = {};
  const categorySkips: Record<string, number> = {};
  const totalCompletions = completions.length;
  const totalSkips = skips.length;

  // Analyze completions
  for (const completion of completions) {
    const category = completion.activity.place.category;
    categoryCompletions[category] = (categoryCompletions[category] || 0) + 1;

    // Track hidden gem engagement
    if (completion.activity.isHiddenGem) {
      hiddenGemAdjustment += 0.1;
    }

    // Extract specific interests from highly rated activities
    if (completion.rating && completion.rating >= 4) {
      const types = completion.activity.place.types || [];
      for (const type of types.slice(0, 3)) {
        const existing = discoveredInterests.find((i) => i.tag === type);
        if (!existing) {
          discoveredInterests.push({
            tag: type,
            confidence: 0.6,
            source: 'observed',
            addedAt: new Date(),
            category: mapWaycraftToInterestCategory(category as WaycraftCategory),
          });
        }
      }
    }
  }

  // Analyze skips
  for (const skip of skips) {
    const category = skip.activity.place.category;
    categorySkips[category] = (categorySkips[category] || 0) + 1;

    // Repeated skips of same category suggest avoidance
    if ((categorySkips[category] || 0) >= 3) {
      const existing = potentialAvoidances.find((a) => a.tag === category);
      if (!existing) {
        potentialAvoidances.push({
          tag: category,
          strength: 0.5,
          source: 'observed',
          addedAt: new Date(),
          reason: 'Frequently skipped',
        });
      }
    }
  }

  // Calculate interest adjustments
  const allCategories = new Set([
    ...Object.keys(categoryCompletions),
    ...Object.keys(categorySkips),
  ]);

  for (const category of allCategories) {
    const completed = categoryCompletions[category] || 0;
    const skipped = categorySkips[category] || 0;
    const total = completed + skipped;

    if (total < 2) continue;

    const completionRate = completed / total;
    const interestKey = mapWaycraftToInterestCategory(category as WaycraftCategory);

    if (interestKey) {
      // Adjust based on completion rate vs expected (0.5)
      const adjustment = (completionRate - 0.5) * 0.3;
      interestAdjustments[interestKey] = adjustment;
    }
  }

  const sampleSize = totalCompletions + totalSkips;
  const confidence = Math.min(1, sampleSize / 20);

  return {
    interestAdjustments,
    discoveredInterests: discoveredInterests.slice(0, 5),
    potentialAvoidances,
    hiddenGemAdjustment: Math.min(0.3, Math.max(-0.3, hiddenGemAdjustment)),
    confidence,
    sampleSize,
  };
}

/**
 * Map WaycraftCategory to InterestCategories key
 */
function mapWaycraftToInterestCategory(
  category: WaycraftCategory
): keyof InterestCategories | undefined {
  const mapping: Partial<Record<WaycraftCategory, keyof InterestCategories>> = {
    food_drink: 'food',
    culture: 'culture',
    nature: 'nature',
    nightlife: 'nightlife',
    shopping: 'shopping',
    activities: 'adventure',
    wellness: 'relaxation',
  };
  return mapping[category];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get best activities for user preferences
 */
export function getTopPreferenceMatches(
  activities: PlaceActivity[],
  preferences: UserPreferences | null,
  count: number = 5,
  config: PreferenceScorerConfig = DEFAULT_PREFERENCE_SCORER_CONFIG
): Array<{ activity: PlaceActivity; result: PreferenceScoreResult }> {
  const scored = activities.map((activity) => ({
    activity,
    result: getPreferenceScoreResult(activity, preferences, config),
  }));

  return scored
    .filter((item) => !item.result.shouldAvoid)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, count);
}

/**
 * Generate "Why You'll Love It" reason
 */
export function generatePreferenceReason(
  result: PreferenceScoreResult
): string | undefined {
  if (result.reasons.length === 0) return undefined;

  // Filter out avoidance notes for positive messaging
  const positiveReasons = result.reasons.filter(
    (r) => !r.toLowerCase().includes('avoid')
  );

  return positiveReasons[0];
}
