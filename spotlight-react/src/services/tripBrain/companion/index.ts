/**
 * Trip Brain Companion Module
 *
 * WI-7.1: Active trip companion integration
 * WI-7.2: Active companion system prompts
 * WI-7.10: Weather integration triggers
 *
 * This module provides:
 * - Mode detection (planning vs active)
 * - Active companion provider and hooks
 * - Proactive message system
 * - TripBrain-powered recommendations
 * - Comprehensive system prompts for active mode
 * - Weather-based proactive triggers
 */

// Types
export * from './types';

// Mode detection hook
export {
  useCompanionMode,
  getSubModeLabel,
  getSubModeIcon,
  type UseCompanionModeOptions,
  type UseCompanionModeReturn,
} from './useCompanionMode';

// Active companion hook
export {
  useActiveCompanion,
  type UseActiveCompanionOptions,
} from './useActiveCompanion';

// Provider and context hooks
export {
  ActiveCompanionProvider,
  useActiveCompanionContext,
  useActiveCompanionContextSafe,
  useActiveRecommendations,
  useProactiveMessages,
  useCompanionMode as useCompanionModeFromContext,
  useCravingMode,
  useSerendipityMode,
  useActivityActions,
  type ActiveCompanionProviderProps,
} from './ActiveCompanionProvider';

// WI-7.2: Active companion prompts
export {
  // Main prompt generators
  generateActiveCompanionPrompt,
  generateCompactActivePrompt,
  generateProactivePrompt,

  // Context section generators
  generateLocationContext,
  generateTimeContext,
  generateWeatherContext,
  generateTodayContext,
  generatePreferencesContext,

  // Prompt constants (for customization)
  PERSONALITY_CORE,
  COMMUNICATION_STYLE,
  ACTIVE_BEHAVIOUR,
  PROACTIVE_RULES,
  PROACTIVE_MESSAGE_FORMATS,
  SUB_MODE_PROMPTS,
  ACTIVE_EXAMPLES,

  // Types
  type ActivePromptContext,
} from './activeCompanionPrompts';

// WI-7.10: Weather triggers
export {
  // Trigger creators
  createRainIncomingTrigger,
  createPerfectWeatherTrigger,
  createHeatWarningTrigger,
  createGoldenHourTrigger,
  createStormWarningTrigger,

  // Utilities
  getAllWeatherTriggers,
  checkWeatherTriggers,

  // Configuration
  DEFAULT_WEATHER_TRIGGER_CONFIG,

  // Types
  type WeatherTriggerConfig,
} from './weatherTriggers';

// WI-10.2: Booking triggers
export {
  // Trigger creators
  createNewCityHotelTrigger,
  createEveningHotelReminderTrigger,

  // Utilities
  getAllBookingTriggers,
  checkBookingTriggers,
  markCityAccommodationBooked,
  isCityAccommodationBooked,

  // Configuration
  DEFAULT_BOOKING_TRIGGER_CONFIG,

  // Types
  type BookingTriggerConfig,
} from './bookingTriggers';

// WI-10.3: Activity booking triggers
export {
  // Trigger creators
  createPopularAttractionTrigger,
  createMorningActivitySuggestionTrigger,

  // Utilities
  getAllActivityTriggers,
  checkActivityTriggers,
  dismissActivitySuggestion,
  isActivitySuggestionDismissed,

  // Configuration
  DEFAULT_ACTIVITY_TRIGGER_CONFIG,

  // Types
  type ActivityTriggerConfig,
} from './activityTriggers';

// WI-10.4: Restaurant booking triggers
export {
  // Trigger creators
  createMealTimeTrigger,
  createPopularRestaurantTrigger,

  // Utilities
  getAllRestaurantTriggers,
  checkRestaurantTriggers,
  dismissRestaurantSuggestion,
  isRestaurantSuggestionDismissed,

  // Configuration
  DEFAULT_RESTAURANT_TRIGGER_CONFIG,

  // Types
  type RestaurantTriggerConfig,
} from './restaurantTriggers';

// WI-10.5: Companion booking prompts
export {
  // Prompt constants
  BOOKING_BEHAVIOUR,
  BOOKING_PROACTIVE_FORMATS,

  // Context generators
  generateBookingContext,
  generateBookingContextFromRecommendations,

  // Learning system
  getBookingLearningData,
  recordBookingSuggestion,
  recordBookingDismissal,
  recordBookingClick,
  shouldReduceBookingSuggestions,
  shouldAvoidCategory,
  getMinutesSinceLastSuggestion,

  // Conversation helpers
  generateBookingConversationPrompt,

  // Utilities
  isBookableActivity,
  isDiningPlace,

  // Types
  type BookingContext,
  type BookingLearningData,
} from './bookingPrompts';
