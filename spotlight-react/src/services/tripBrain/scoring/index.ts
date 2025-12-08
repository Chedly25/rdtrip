/**
 * Trip Brain Scoring
 *
 * Modular scorers for the Trip Brain intelligence system
 *
 * WI-6.5: Preference Scorer
 * WI-6.6: Combined Scoring
 * WI-7.10: Weather Scorer
 */

// Preference Scorer (WI-6.5)
export {
  // Main scoring functions
  getPreferenceScore,
  getPreferenceScoreResult,

  // Component scoring
  getCategoryInterestScore,
  getSpecificInterestScore,
  getAvoidancePenalty,
  getHiddenGemScore,
  getBudgetMatchScore,
  getDiningStyleScore,

  // Matching functions
  matchesInterestTag,
  matchesAvoidance,

  // Filtering & sorting
  filterByPreferenceScore,
  sortByPreferenceScore,
  filterOutAvoidances,

  // Preference learning
  buildPreferencesFromHistory,

  // Utilities
  getTopPreferenceMatches,
  generatePreferenceReason,

  // Configuration
  DEFAULT_PREFERENCE_SCORER_CONFIG,
  CATEGORY_INTEREST_MAP,
  INTEREST_KEYWORDS,
  AVOIDANCE_KEYWORDS,
  BUDGET_PRICE_MAP,
  DINING_STYLE_KEYWORDS,

  // Types
  type PreferenceScorerConfig,
  type CategoryInterestMapping,
  type PreferenceScoreResult,
  type ActivityCompletion,
  type ActivitySkip,
  type LearnedPreferenceAdjustment,
} from './preferenceScorer';

// Combined Scoring (WI-6.6)
export {
  // Core scoring functions
  calculateCombinedScore,
  calculateConfidence,
  createRecommendationScore,

  // WhyNow generation
  generateWhyNow,
  getDominantFactor,

  // Activity ranking
  rankActivities,

  // Score comparison & analysis
  compareScores,
  getScoreCategory,
  meetsMinimumScore,

  // Mode helpers
  getWeightsForMode,
  normalizeWeights,
  suggestScoringMode,
  getScoringModeDescription,

  // Batch scoring
  batchScore,
  filterAndRank,

  // Configuration
  DEFAULT_COMBINED_SCORER_CONFIG,
  SCORING_MODE_WEIGHTS,

  // Types
  type ScoreInputs,
  type ScoreContext,
  type ScoreReasons,
  type ScoringMode,
  type ScoringWeights,
  type CombinedScorerConfig,
  type RankedActivity,
} from './combinedScorer';

// Weather Scorer (WI-7.10)
export {
  // Main scoring function
  getWeatherScore,
  createWeatherScoreComponent,

  // Filtering & sorting
  filterByWeather,
  sortByWeatherScore,
  getWeatherBoostedActivities,

  // Why Now generation
  generateWeatherWhyNow,

  // Configuration
  DEFAULT_WEATHER_SCORER_CONFIG,

  // Types
  type WeatherScoreResult,
  type WeatherScorerConfig,
} from './weatherScorer';
