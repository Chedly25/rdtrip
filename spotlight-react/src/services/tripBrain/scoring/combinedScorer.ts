/**
 * Combined Scorer
 *
 * WI-6.6: Combines individual scores into a final recommendation score
 *
 * The combined scorer takes individual score components (time, distance,
 * preference, serendipity, rating, weather) and produces a weighted
 * final score with configurable modes.
 *
 * Key Features:
 * - Multiple scoring modes (balanced, nearby, personalized, etc.)
 * - Preset weight configurations for each mode
 * - Confidence calculation based on available data
 * - Activity ranking with tie-breaking
 * - WhyNow reason generation from top factors
 *
 * Architecture Decision:
 * - Scores are always 0-1 normalized
 * - Weights sum to 1.0 for interpretability
 * - Confidence reflects data quality, not score value
 * - Modes can be switched dynamically based on user context
 */

import type {
  ScoreBreakdown,
  ScoreComponent,
  RecommendationScore,
  WhyNowReason,
  WhyNowCategory,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Score input values (all 0-1 normalized)
 */
export interface ScoreInputs {
  /** Time appropriateness (1 = perfect time, 0 = wrong time) */
  time: number;
  /** Distance/proximity (1 = right here, 0 = too far) */
  distance: number;
  /** Preference match (1 = perfect match, 0 = no match) */
  preference: number;
  /** Serendipity/hidden gem (1 = rare find, 0 = common) */
  serendipity: number;
  /** Quality rating (1 = 5 stars, 0 = no rating) */
  rating: number;
  /** Weather suitability (1 = perfect weather, 0 = bad weather) */
  weather: number;
}

/**
 * Additional context for scoring
 */
export interface ScoreContext {
  /** Whether user location is available */
  hasLocation: boolean;
  /** Whether weather data is available */
  hasWeather: boolean;
  /** Whether preference data is available */
  hasPreferences: boolean;
  /** Preference data confidence (0-1) */
  preferenceConfidence: number;
  /** Whether activity is a hidden gem */
  isHiddenGem: boolean;
  /** Activity rating (1-5) */
  activityRating?: number;
  /** Distance in meters (for reason generation) */
  distanceMeters?: number;
}

/**
 * Reason metadata for each score component
 */
export interface ScoreReasons {
  time?: string;
  distance?: string;
  preference?: string;
  serendipity?: string;
  rating?: string;
  weather?: string;
}

/**
 * Scoring mode determines weight distribution
 */
export type ScoringMode =
  | 'balanced'      // Default balanced weights
  | 'nearby'        // Prioritize distance/proximity
  | 'personalized'  // Prioritize user preferences
  | 'spontaneous'   // Prioritize serendipity/discovery
  | 'quality'       // Prioritize ratings
  | 'time_sensitive'// Prioritize time appropriateness
  | 'explorer'      // Balanced discovery + quality
  | 'custom';       // Use provided custom weights

/**
 * Weight configuration
 */
export interface ScoringWeights {
  time: number;
  distance: number;
  preference: number;
  serendipity: number;
  rating: number;
  weather: number;
}

/**
 * Combined scorer configuration
 */
export interface CombinedScorerConfig {
  /** Scoring mode */
  mode: ScoringMode;
  /** Custom weights (only used when mode is 'custom') */
  customWeights?: ScoringWeights;
  /** Minimum score to consider valid (0-1) */
  minimumScore: number;
  /** Boost factor for hidden gems in spontaneous mode */
  hiddenGemBoost: number;
  /** Penalty factor for missing data */
  missingDataPenalty: number;
  /** Whether to normalize weights to sum to 1 */
  normalizeWeights: boolean;
}

/**
 * Default combined scorer configuration
 */
export const DEFAULT_COMBINED_SCORER_CONFIG: CombinedScorerConfig = {
  mode: 'balanced',
  minimumScore: 0.3,
  hiddenGemBoost: 0.1,
  missingDataPenalty: 0.1,
  normalizeWeights: true,
};

// ============================================================================
// Preset Weight Configurations
// ============================================================================

/**
 * Preset weights for each scoring mode
 */
export const SCORING_MODE_WEIGHTS: Record<ScoringMode, ScoringWeights> = {
  balanced: {
    time: 0.20,
    distance: 0.25,
    preference: 0.25,
    serendipity: 0.10,
    rating: 0.10,
    weather: 0.10,
  },
  nearby: {
    time: 0.15,
    distance: 0.40,
    preference: 0.15,
    serendipity: 0.10,
    rating: 0.10,
    weather: 0.10,
  },
  personalized: {
    time: 0.15,
    distance: 0.15,
    preference: 0.40,
    serendipity: 0.10,
    rating: 0.10,
    weather: 0.10,
  },
  spontaneous: {
    time: 0.15,
    distance: 0.15,
    preference: 0.15,
    serendipity: 0.35,
    rating: 0.10,
    weather: 0.10,
  },
  quality: {
    time: 0.15,
    distance: 0.15,
    preference: 0.20,
    serendipity: 0.05,
    rating: 0.35,
    weather: 0.10,
  },
  time_sensitive: {
    time: 0.40,
    distance: 0.20,
    preference: 0.15,
    serendipity: 0.05,
    rating: 0.10,
    weather: 0.10,
  },
  explorer: {
    time: 0.15,
    distance: 0.20,
    preference: 0.20,
    serendipity: 0.20,
    rating: 0.15,
    weather: 0.10,
  },
  custom: {
    // Default to balanced if custom but no weights provided
    time: 0.20,
    distance: 0.25,
    preference: 0.25,
    serendipity: 0.10,
    rating: 0.10,
    weather: 0.10,
  },
};

/**
 * Get weights for a scoring mode
 */
export function getWeightsForMode(
  mode: ScoringMode,
  customWeights?: ScoringWeights
): ScoringWeights {
  if (mode === 'custom' && customWeights) {
    return customWeights;
  }
  return SCORING_MODE_WEIGHTS[mode];
}

/**
 * Normalize weights to sum to 1
 */
export function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total === 0) return weights;

  return {
    time: weights.time / total,
    distance: weights.distance / total,
    preference: weights.preference / total,
    serendipity: weights.serendipity / total,
    rating: weights.rating / total,
    weather: weights.weather / total,
  };
}

// ============================================================================
// Core Scoring Functions
// ============================================================================

/**
 * Calculate combined score from inputs
 */
export function calculateCombinedScore(
  inputs: ScoreInputs,
  context: ScoreContext,
  reasons: ScoreReasons = {},
  config: CombinedScorerConfig = DEFAULT_COMBINED_SCORER_CONFIG
): { breakdown: ScoreBreakdown; confidence: number } {
  // Get weights for mode
  let weights = getWeightsForMode(config.mode, config.customWeights);

  // Normalize if configured
  if (config.normalizeWeights) {
    weights = normalizeWeights(weights);
  }

  // Apply hidden gem boost in spontaneous mode
  let adjustedInputs = { ...inputs };
  if (config.mode === 'spontaneous' && context.isHiddenGem) {
    adjustedInputs.serendipity = Math.min(1, inputs.serendipity + config.hiddenGemBoost);
  }

  // Calculate contributions
  const timeContribution = adjustedInputs.time * weights.time;
  const distanceContribution = adjustedInputs.distance * weights.distance;
  const preferenceContribution = adjustedInputs.preference * weights.preference;
  const serendipityContribution = adjustedInputs.serendipity * weights.serendipity;
  const ratingContribution = adjustedInputs.rating * weights.rating;
  const weatherContribution = adjustedInputs.weather * weights.weather;

  // Calculate final score
  let finalScore =
    timeContribution +
    distanceContribution +
    preferenceContribution +
    serendipityContribution +
    ratingContribution +
    weatherContribution;

  // Apply missing data penalty
  if (!context.hasLocation) {
    finalScore -= config.missingDataPenalty * weights.distance;
  }
  if (!context.hasWeather) {
    finalScore -= config.missingDataPenalty * weights.weather * 0.5;
  }

  // Clamp to 0-1
  finalScore = Math.max(0, Math.min(1, finalScore));

  // Calculate confidence
  const confidence = calculateConfidence(context, weights);

  // Build breakdown
  const breakdown: ScoreBreakdown = {
    time: {
      value: adjustedInputs.time,
      weight: weights.time,
      contribution: timeContribution,
      reason: reasons.time,
    },
    distance: {
      value: adjustedInputs.distance,
      weight: weights.distance,
      contribution: distanceContribution,
      reason: reasons.distance,
    },
    preference: {
      value: adjustedInputs.preference,
      weight: weights.preference,
      contribution: preferenceContribution,
      reason: reasons.preference,
    },
    serendipity: {
      value: adjustedInputs.serendipity,
      weight: weights.serendipity,
      contribution: serendipityContribution,
      reason: reasons.serendipity,
    },
    rating: {
      value: adjustedInputs.rating,
      weight: weights.rating,
      contribution: ratingContribution,
      reason: reasons.rating,
    },
    weather: {
      value: adjustedInputs.weather,
      weight: weights.weather,
      contribution: weatherContribution,
      reason: reasons.weather,
    },
    finalScore,
    confidence,
  };

  return { breakdown, confidence };
}

/**
 * Calculate confidence based on available context
 */
export function calculateConfidence(
  context: ScoreContext,
  _weights: ScoringWeights
): number {
  let confidence = 0.5; // Base confidence

  // Location data boosts confidence significantly
  if (context.hasLocation) {
    confidence += 0.2;
  }

  // Weather data adds some confidence
  if (context.hasWeather) {
    confidence += 0.1;
  }

  // Preference data adds confidence based on its own confidence
  if (context.hasPreferences) {
    confidence += 0.15 * context.preferenceConfidence;
  }

  // Having a rating adds confidence
  if (context.activityRating !== undefined) {
    confidence += 0.05;
  }

  return Math.min(1, confidence);
}

// ============================================================================
// Full Recommendation Score
// ============================================================================

/**
 * Create a full recommendation score with WhyNow
 */
export function createRecommendationScore(
  inputs: ScoreInputs,
  context: ScoreContext,
  reasons: ScoreReasons = {},
  config: CombinedScorerConfig = DEFAULT_COMBINED_SCORER_CONFIG
): RecommendationScore {
  const { breakdown, confidence } = calculateCombinedScore(
    inputs,
    context,
    reasons,
    config
  );

  const whyNow = generateWhyNow(breakdown, context);

  return {
    score: breakdown.finalScore,
    breakdown,
    rank: 0, // Set later when ranking multiple activities
    whyNow,
    confidence,
  };
}

// ============================================================================
// WhyNow Generation
// ============================================================================

/**
 * Generate WhyNow reason from score breakdown
 */
export function generateWhyNow(
  breakdown: ScoreBreakdown,
  context: ScoreContext
): WhyNowReason {
  // Collect factors with their contributions
  const factors: Array<{
    key: keyof ScoreInputs;
    component: ScoreComponent;
    category: WhyNowCategory;
  }> = [
    { key: 'distance', component: breakdown.distance, category: 'distance' },
    { key: 'time', component: breakdown.time, category: 'time' },
    { key: 'preference', component: breakdown.preference, category: 'preference' },
    { key: 'serendipity', component: breakdown.serendipity, category: 'serendipity' },
    { key: 'rating', component: breakdown.rating, category: 'trending' },
    { key: 'weather', component: breakdown.weather, category: 'weather' },
  ];

  // Filter to factors with reasons and sort by contribution
  const validFactors = factors
    .filter(f => f.component.reason && f.component.contribution > 0)
    .sort((a, b) => b.component.contribution - a.component.contribution);

  // Primary reason (highest contribution)
  const primary = validFactors[0] || {
    key: 'time',
    component: { reason: 'Recommended for you' },
    category: 'scheduled' as WhyNowCategory,
  };

  // Secondary reason (second highest)
  const secondary = validFactors[1];

  // Generate tip based on context
  let tip: { text: string; source?: string } | undefined;
  if (context.isHiddenGem) {
    tip = {
      text: 'A local favorite that most tourists miss',
      source: 'Hidden gem',
    };
  } else if (context.activityRating && context.activityRating >= 4.5) {
    tip = {
      text: 'Consistently excellent reviews',
    };
  }

  return {
    primary: {
      category: primary.category,
      text: primary.component.reason || 'Recommended for you',
    },
    secondary: secondary
      ? {
          category: secondary.category,
          text: secondary.component.reason || '',
        }
      : undefined,
    tip,
  };
}

/**
 * Get the dominant factor in a score breakdown
 */
export function getDominantFactor(
  breakdown: ScoreBreakdown
): { factor: keyof ScoreInputs; contribution: number; reason?: string } {
  const factors: Array<{ factor: keyof ScoreInputs; contribution: number; reason?: string }> = [
    { factor: 'time', contribution: breakdown.time.contribution, reason: breakdown.time.reason },
    { factor: 'distance', contribution: breakdown.distance.contribution, reason: breakdown.distance.reason },
    { factor: 'preference', contribution: breakdown.preference.contribution, reason: breakdown.preference.reason },
    { factor: 'serendipity', contribution: breakdown.serendipity.contribution, reason: breakdown.serendipity.reason },
    { factor: 'rating', contribution: breakdown.rating.contribution, reason: breakdown.rating.reason },
    { factor: 'weather', contribution: breakdown.weather.contribution, reason: breakdown.weather.reason },
  ];

  factors.sort((a, b) => b.contribution - a.contribution);
  return factors[0];
}

// ============================================================================
// Activity Ranking
// ============================================================================

/**
 * Ranked activity result
 */
export interface RankedActivity<T> {
  item: T;
  score: RecommendationScore;
}

/**
 * Rank activities by score
 */
export function rankActivities<T>(
  activities: Array<{ item: T; score: number; breakdown?: ScoreBreakdown }>,
  tieBreaker: 'distance' | 'rating' | 'serendipity' = 'distance'
): RankedActivity<T>[] {
  // Sort by score descending
  const sorted = [...activities].sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) > 0.01) return scoreDiff;

    // Tie-breaker
    if (a.breakdown && b.breakdown) {
      switch (tieBreaker) {
        case 'distance':
          return b.breakdown.distance.value - a.breakdown.distance.value;
        case 'rating':
          return b.breakdown.rating.value - a.breakdown.rating.value;
        case 'serendipity':
          return b.breakdown.serendipity.value - a.breakdown.serendipity.value;
      }
    }
    return 0;
  });

  // Assign ranks
  return sorted.map((activity, index) => ({
    item: activity.item,
    score: {
      score: activity.score,
      breakdown: activity.breakdown || createDefaultBreakdown(),
      rank: index + 1,
      whyNow: { primary: { category: 'scheduled', text: 'On your list' } },
      confidence: activity.breakdown?.confidence || 0.5,
    },
  }));
}

/**
 * Create a default breakdown for cases where one isn't provided
 */
function createDefaultBreakdown(): ScoreBreakdown {
  const defaultComponent: ScoreComponent = {
    value: 0.5,
    weight: 1 / 6,
    contribution: 0.5 / 6,
  };

  return {
    time: { ...defaultComponent },
    distance: { ...defaultComponent },
    preference: { ...defaultComponent },
    serendipity: { ...defaultComponent },
    rating: { ...defaultComponent },
    weather: { ...defaultComponent },
    finalScore: 0.5,
    confidence: 0.5,
  };
}

// ============================================================================
// Score Comparison & Analysis
// ============================================================================

/**
 * Compare two scores and explain the difference
 */
export function compareScores(
  scoreA: ScoreBreakdown,
  scoreB: ScoreBreakdown
): { betterScore: 'A' | 'B' | 'equal'; reasons: string[] } {
  const diff = scoreA.finalScore - scoreB.finalScore;
  const reasons: string[] = [];

  if (Math.abs(diff) < 0.05) {
    return { betterScore: 'equal', reasons: ['Scores are very similar'] };
  }

  const betterScore = diff > 0 ? 'A' : 'B';
  const better = diff > 0 ? scoreA : scoreB;
  const worse = diff > 0 ? scoreB : scoreA;

  // Find biggest contributing differences
  const components: Array<keyof ScoreInputs> = [
    'time', 'distance', 'preference', 'serendipity', 'rating', 'weather'
  ];

  for (const component of components) {
    const compDiff = better[component].contribution - worse[component].contribution;
    if (compDiff > 0.05) {
      reasons.push(`Better ${component} score`);
    }
  }

  return { betterScore, reasons };
}

/**
 * Get score category (excellent, good, fair, poor)
 */
export function getScoreCategory(
  score: number
): { category: 'excellent' | 'good' | 'fair' | 'poor'; label: string } {
  if (score >= 0.8) return { category: 'excellent', label: 'Excellent match' };
  if (score >= 0.6) return { category: 'good', label: 'Good match' };
  if (score >= 0.4) return { category: 'fair', label: 'Fair match' };
  return { category: 'poor', label: 'Not ideal' };
}

/**
 * Check if score meets minimum threshold for recommendation
 */
export function meetsMinimumScore(
  score: number,
  config: CombinedScorerConfig = DEFAULT_COMBINED_SCORER_CONFIG
): boolean {
  return score >= config.minimumScore;
}

// ============================================================================
// Mode Selection Helpers
// ============================================================================

/**
 * Suggest scoring mode based on user context
 */
export function suggestScoringMode(
  context: {
    isInAHurry?: boolean;
    wantsNearby?: boolean;
    feelsAdventurous?: boolean;
    hasStrongPreferences?: boolean;
    prioritizesQuality?: boolean;
    timeConstrained?: boolean;
  }
): ScoringMode {
  if (context.wantsNearby || context.isInAHurry) {
    return 'nearby';
  }
  if (context.feelsAdventurous) {
    return 'spontaneous';
  }
  if (context.hasStrongPreferences) {
    return 'personalized';
  }
  if (context.prioritizesQuality) {
    return 'quality';
  }
  if (context.timeConstrained) {
    return 'time_sensitive';
  }
  return 'balanced';
}

/**
 * Get human-readable description for a scoring mode
 */
export function getScoringModeDescription(mode: ScoringMode): {
  name: string;
  description: string;
  emoji: string;
} {
  const descriptions: Record<ScoringMode, { name: string; description: string; emoji: string }> = {
    balanced: {
      name: 'Balanced',
      description: 'Well-rounded recommendations considering all factors',
      emoji: '⚖️',
    },
    nearby: {
      name: 'Nearby',
      description: 'Prioritizes places closest to you',
      emoji: '📍',
    },
    personalized: {
      name: 'For You',
      description: 'Tailored to your preferences and interests',
      emoji: '❤️',
    },
    spontaneous: {
      name: 'Discover',
      description: 'Hidden gems and unexpected finds',
      emoji: '✨',
    },
    quality: {
      name: 'Top Rated',
      description: 'Highest rated and most reviewed places',
      emoji: '⭐',
    },
    time_sensitive: {
      name: 'Right Now',
      description: 'Best for the current time of day',
      emoji: '🕐',
    },
    explorer: {
      name: 'Explorer',
      description: 'Balance of discovery and quality',
      emoji: '🧭',
    },
    custom: {
      name: 'Custom',
      description: 'Your personalized scoring weights',
      emoji: '⚙️',
    },
  };

  return descriptions[mode];
}

// ============================================================================
// Batch Scoring
// ============================================================================

/**
 * Score multiple activities at once
 */
export function batchScore<T>(
  items: T[],
  getInputs: (item: T) => ScoreInputs,
  getContext: (item: T) => ScoreContext,
  getReasons?: (item: T) => ScoreReasons,
  config: CombinedScorerConfig = DEFAULT_COMBINED_SCORER_CONFIG
): Array<{ item: T; score: RecommendationScore }> {
  const scored = items.map(item => {
    const inputs = getInputs(item);
    const context = getContext(item);
    const reasons = getReasons ? getReasons(item) : {};
    const score = createRecommendationScore(inputs, context, reasons, config);
    return { item, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score.score - a.score.score);

  // Assign ranks
  scored.forEach((result, index) => {
    result.score.rank = index + 1;
  });

  return scored;
}

/**
 * Filter and rank activities by minimum score
 */
export function filterAndRank<T>(
  items: T[],
  getInputs: (item: T) => ScoreInputs,
  getContext: (item: T) => ScoreContext,
  getReasons?: (item: T) => ScoreReasons,
  config: CombinedScorerConfig = DEFAULT_COMBINED_SCORER_CONFIG
): Array<{ item: T; score: RecommendationScore }> {
  const scored = batchScore(items, getInputs, getContext, getReasons, config);
  return scored.filter(result => result.score.score >= config.minimumScore);
}
