/**
 * Trip Brain Filters
 *
 * Modular filters for the Trip Brain intelligence system
 *
 * WI-6.3: Time Filter
 * WI-6.4: Location Filter
 */

// Time Filter (WI-6.3)
export {
  // Core functions
  isActivityTimeAppropriate,
  getTimeAppropriatenessResult,
  getTimeScore,
  filterByTime,
  sortByTimeScore,
  filterByTimeAdvanced,

  // Utility functions
  getTimeGreeting,
  getSuggestedCategories,
  isGoodForOutdoor,
  isMealTime,

  // Configuration
  DEFAULT_TIME_FILTER_CONFIG,
  DEFAULT_CATEGORY_RULES,
  DEFAULT_NIGHTLIFE_KEYWORDS,
  DEFAULT_DAYLIGHT_ONLY_KEYWORDS,
  DEFAULT_EARLY_OPEN_KEYWORDS,
  DEFAULT_LATE_NIGHT_KEYWORDS,
  DEFAULT_PERIOD_HOURS,

  // Types
  type TimeFilterConfig,
  type CategoryTimeRule,
  type TimeAppropriatenessResult,
  type AdvancedTimeFilterOptions,
} from './timeFilter';

// Re-export TimePeriod from types
export { getTimePeriod, type TimePeriod } from '../types';

// Location Filter (WI-6.4)
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
} from './locationFilter';
