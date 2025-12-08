/**
 * Trip Brain Service
 *
 * Epic 6: Intelligence layer for active trip companion
 *
 * The Trip Brain takes raw itinerary data and enriches it with:
 * - Time filtering (appropriate for current time)
 * - Location scoring (proximity to user)
 * - Preference scoring (matches user taste)
 * - "Why Now" reasoning (human-readable recommendations)
 *
 * Work Items:
 * - WI-6.1: TypeScript Types ✓
 * - WI-6.2: Core Service ✓
 * - WI-6.3: Time Filter ✓
 * - WI-6.4: Location Filter ✓
 * - WI-6.5: Preference Scorer ✓
 * - WI-6.6: Combined Scoring ✓
 * - WI-6.7: Why Now Generator ✓
 * - WI-6.8: Geolocation Hook ✓
 * - WI-6.9: Context Provider ✓
 *
 * Epic 7: Active Trip Companion
 * - WI-7.1: Active Mode Companion ✓
 * - WI-7.2: Active Companion Prompts ✓
 * - WI-7.3: Choice Mode UI ✓ (see components/companion/active/)
 * - WI-7.4: Craving Mode UI ✓ (see components/companion/active/)
 * - WI-7.5: Serendipity Mode UI ✓ (see components/companion/active/)
 * - WI-7.6: Rest Mode UI ✓ (see components/companion/active/)
 * - WI-7.7: Mode Switcher UI ✓ (see components/companion/active/)
 * - WI-7.8: Proactive Notifications ✓ (see components/companion/active/)
 * - WI-7.9: Arrival Detection ✓ (see components/companion/active/)
 * - WI-7.10: Weather Integration ✓ (see scoring/weatherScorer, companion/weatherTriggers)
 */

// ============================================================================
// Type Exports
// ============================================================================

export * from './types';

// ============================================================================
// Service Exports
// ============================================================================

// WI-6.2: Core Service
export {
  TripBrain,
  createTripBrain,
  getDefaultTripBrain,
  resetDefaultTripBrain,
  type TripBrainEvent,
  type TripBrainEventListener,
} from './tripBrain';

// WI-6.3: Time Filter
export {
  isActivityTimeAppropriate,
  getTimeAppropriatenessResult,
  getTimeScore,
  filterByTime,
  sortByTimeScore,
  filterByTimeAdvanced,
  getTimeGreeting,
  getSuggestedCategories,
  isGoodForOutdoor,
  isMealTime,
  DEFAULT_TIME_FILTER_CONFIG,
  type TimeFilterConfig,
  type CategoryTimeRule,
  type TimeAppropriatenessResult,
  type AdvancedTimeFilterOptions,
} from './filters/timeFilter';

// WI-6.4: Location Filter
export {
  // Core distance calculation
  calculateDistance,
  calculateBearing,
  getCardinalDirection,

  // Distance formatting
  formatDistance,
  formatDistanceWithContext,

  // Time estimates
  estimateWalkingTime,
  estimateDrivingTime,
  estimateCyclingTime,
  getRecommendedTravelMode,

  // Distance scoring
  getDistanceBracket,
  getDistanceScore,
  getDistanceScoreResult,

  // Activity filtering
  isWithinRange,
  filterByDistance,
  sortByDistance,
  sortByDistanceScore,
  filterByDistanceAdvanced,

  // Nearby activities
  groupByDistanceBracket,
  getNearestActivities,
  getActivitiesWithDistance,

  // Why Now generation
  generateDistanceWhyNow,
  getUrgencyDistanceMessage,

  // Configuration
  DEFAULT_LOCATION_FILTER_CONFIG,
  DEFAULT_DISTANCE_BRACKETS,

  // Types
  type LocationFilterConfig,
  type DistanceBracket,
  type ScoreDecayCurve,
  type DistanceScoreResult,
  type AdvancedDistanceFilterOptions,
  type GroupedByDistanceResult,
  type ActivityWithDistance,
} from './filters/locationFilter';

// WI-6.5: Preference Scorer
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
} from './scoring/preferenceScorer';

// WI-6.6: Combined Scoring
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
} from './scoring/combinedScorer';

// WI-6.7: Why Now Generator
export {
  // Main generation function
  generateWhyNowReason,
  generateWhyNowFromBreakdown,

  // Component generators
  generateDistanceReason,
  generateTimeReason,
  generateWeatherReason,
  generatePreferenceWhyNow,
  generateSerendipityReason,
  generateUrgency,
  generateTip,

  // Utility functions
  getWhyNowIcon,
  getWhyNowSummary,
  hasUrgency,
  getWhyNowIcons,
  getRandomTip,
  getHiddenGemTip,

  // Configuration
  DEFAULT_WHY_NOW_CONFIG,
  WHY_NOW_ICONS,

  // Types
  type MessageStyle,
  type WhyNowGeneratorConfig,
  type WhyNowContext,
} from './enrichment/whyNowGenerator';

// ============================================================================
// Hook Exports
// ============================================================================

// WI-6.8: Geolocation Hook
export {
  // Main hook
  useGeolocation,

  // Utility hooks
  useDistanceToPoint,
  useApproaching,

  // Utilities
  getAccuracyQuality,
  isAccuracyAcceptable,

  // Configuration
  DEFAULT_GEOLOCATION_OPTIONS,

  // Types
  type UseGeolocationOptions,
} from './hooks';

// WI-6.9: Context Provider
export {
  // Provider
  TripBrainProvider,

  // Main hook
  useTripBrain,
  useTripBrainSafe,

  // Selector hooks
  useTripBrainRecommendations,
  useTripBrainStats,
  useTripBrainLocation,
  useTripBrainTracking,
  useTripBrainCraving,

  // Types
  type TripBrainProviderProps,
  type TripBrainContextValue,
  type TripBrainActions,
  type TripBrainDerivedState,
} from './hooks';

// ============================================================================
// Companion Exports (WI-7.1)
// ============================================================================

// WI-7.1: Active Companion
export {
  // Types
  type CompanionMode,
  type ActiveCompanionSubMode,
  type CompanionModeContext,
  type ActiveCompanionContext,
  type ActiveCompanionState,
  type ProactiveMessage,
  type ActiveRecommendations,
  type UseActiveCompanionReturn,
  type ActiveCompanionConfig,
  type ProactiveTrigger,
  type QuickActionChip,

  // Configuration
  DEFAULT_ACTIVE_COMPANION_CONFIG,
  getTimePeriodFromHour,

  // Mode detection hook
  useCompanionMode,
  getSubModeLabel,
  getSubModeIcon,
  type UseCompanionModeOptions,
  type UseCompanionModeReturn,

  // Active companion hook
  useActiveCompanion,
  type UseActiveCompanionOptions,

  // Provider and context hooks
  ActiveCompanionProvider,
  useActiveCompanionContext,
  useActiveCompanionContextSafe,
  useActiveRecommendations,
  useProactiveMessages,
  useCravingMode,
  useSerendipityMode,
  useActivityActions,
  type ActiveCompanionProviderProps,

  // WI-7.2: Active Companion Prompts
  generateActiveCompanionPrompt,
  generateCompactActivePrompt,
  generateProactivePrompt,
  generateLocationContext,
  generateTimeContext,
  generateWeatherContext,
  generateTodayContext,
  generatePreferencesContext,
  PERSONALITY_CORE,
  COMMUNICATION_STYLE,
  ACTIVE_BEHAVIOUR,
  PROACTIVE_RULES,
  PROACTIVE_MESSAGE_FORMATS,
  SUB_MODE_PROMPTS,
  ACTIVE_EXAMPLES,
  type ActivePromptContext,
} from './companion';
