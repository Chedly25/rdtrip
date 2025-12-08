/**
 * Preferences Module
 *
 * WI-4.1 to WI-4.6: Comprehensive preference system for Waycraft
 *
 * This module provides:
 * - Complete type definitions for user preferences (WI-4.1)
 * - Operations for updating and merging preferences (WI-4.1)
 * - Remote storage and sync (WI-4.2)
 * - Preference extraction from conversation (WI-4.3)
 * - Behaviour inference from passive observation (WI-4.4)
 * - Preference-based place scoring (WI-4.6)
 *
 * Usage:
 * ```typescript
 * // Types and operations (WI-4.1)
 * import {
 *   createEmptyPreferences,
 *   updateInterestCategory,
 *   generatePreferenceSummary,
 * } from '@/services/preferences';
 *
 * // Storage service (WI-4.2)
 * import { setupAutoSync, loadAndMergePreferences } from '@/services/preferences';
 *
 * // Conversation extraction (WI-4.3)
 * import { extractAndApplyPreferences } from '@/services/preferences';
 * await extractAndApplyPreferences("We love wine and hidden gems!");
 *
 * // Behaviour inference (WI-4.4)
 * import { setupBehaviourTracking, usePreferenceInference } from '@/services/preferences';
 * const cleanup = setupBehaviourTracking(tripId);
 * // Inferences run automatically when user favourites, removes cities, etc.
 *
 * // Place scoring (WI-4.6)
 * import { rankPlacesByPreference, getPaceLimits } from '@/services/preferences';
 * const scoredPlaces = rankPlacesByPreference(places, userPreferences);
 * const dailyLimit = getPaceLimits(userPreferences.pace.value);
 * ```
 */

// Types
export {
  // Core types
  type PreferenceSource,
  type PreferenceSources,
  type PreferenceValue,
  type InterestStrength,

  // Interest categories
  type InterestCategories,

  // Specific preference types
  type TripPace,
  type BudgetLevel,
  type DiningStyle,
  type AccommodationStyle,
  type TimePreference,
  type CrowdPreference,

  // Tagged items
  type SpecificInterest,
  type Avoidance,
  type DietaryRequirement,
  type AccessibilityNeed,

  // Complete profile
  type UserPreferences,

  // Factory functions
  createPreferenceValue,
  createDefaultInterests,
  createEmptyPreferenceValue,
  createEmptyPreferences,

  // Type guards
  isValidInterestCategory,
  isValidPace,
  isValidBudgetLevel,
  isValidDiningStyle,
  isValidAccommodationStyle,
  isValidTimePreference,
  isValidCrowdPreference,

  // Constants
  PREFERENCE_VERSION,
} from './types';

// Operations
export {
  // Source priority
  getHighestPrioritySource,

  // Update operations
  updatePreferenceValue,
  updateInterestCategory,
  adjustInterest,
  addSpecificInterest,
  removeSpecificInterest,
  addAvoidance,
  removeAvoidance,
  addDietaryRequirement,
  addAccessibilityNeed,
  updatePace,
  updateBudget,
  updateDiningStyle,
  updateAccommodationStyle,
  updatePrefersHiddenGems,

  // Merge
  mergePreferences,

  // Confidence
  calculateOverallConfidence,
  updateOverallConfidence,

  // Serialization
  serializePreferences,
  deserializePreferences,

  // Summary
  generatePreferenceSummary,
} from './operations';

// Storage Service (WI-4.2)
export {
  // Types
  type StorageResult,
  type SyncOptions,

  // API operations
  fetchRemotePreferences,
  saveRemotePreferences,
  deleteRemotePreferences,

  // Sync operations
  scheduleSyncDebounced,
  syncNow,
  loadAndMergePreferences,
  refreshIfStale,
  isStale,
  clearTripPreferences,

  // Setup
  setupAutoSync,

  // React hook
  usePreferenceSync,
} from './storage';

// Extraction Service (WI-4.3)
export {
  // Types
  type ExtractedSignal,
  type ExtractionResult,

  // Extraction functions
  extractPreferencesLocally,
  callExtractionAPI,
  applyExtractedPreferences,
  extractAndApplyPreferences,

  // React hook
  usePreferenceExtraction,
} from './extraction';

// Inference Service (WI-4.4)
export {
  // Types
  type InferenceRule,
  type InferenceContext,
  type InferenceAction,

  // Rules
  DEFAULT_INFERENCE_RULES,

  // Functions
  buildInferenceContext,
  runInferenceRules,
  applyInferenceActions,
  setupBehaviourTracking,
  evaluateInferenceRules,

  // React hook
  usePreferenceInference,

  // Debug utilities
  getInferenceDebugState,
  resetRuleCooldowns,
} from './inference';

// Scoring Service (WI-4.6)
export {
  // Types
  type ScorablePlace,
  type ScoringWeights,
  type ScoreBreakdown,
  type ScoredPlace,
  type PaceLimits,

  // Configuration
  DEFAULT_SCORING_WEIGHTS,
  PACE_LIMITS,
  BUDGET_PRICE_RANGES,
  INTEREST_TO_CATEGORY_MAP,
  CATEGORY_TO_INTERESTS_MAP,

  // Score calculation
  calculateInterestAlignment,
  calculateBudgetMatch,
  checkAvoidances,
  checkSpecificInterests,
  calculateHiddenGemBonus,
  calculatePreferenceScore,

  // Utility functions
  rankPlacesByPreference,
  filterAvoidedPlaces,
  getPaceLimits,
  getRecommendedPlacesPerDay,
  limitByPace,
  getTopPlacesPerCategory,

  // Debug utilities
  formatScoreBreakdown,
  getScoringConfig,
} from './scoring';
