/**
 * Trip Brain Hooks
 *
 * React hooks for Trip Brain integration
 *
 * WI-6.8: Geolocation Hook
 * WI-6.9: Context Provider
 * WI-7.10: Weather Context Hook
 */

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
} from './useGeolocation';

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
} from './TripBrainProvider';

// WI-7.10: Weather Context Hook
export {
  useWeatherContext,
  type UseWeatherContextOptions,
  type UseWeatherContextReturn,
} from './useWeatherContext';
