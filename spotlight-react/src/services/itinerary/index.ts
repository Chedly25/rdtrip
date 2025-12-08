/**
 * Itinerary Generation Module
 *
 * WI-5.1, WI-5.2, WI-5.3: Core services for generating trip itineraries
 *
 * This module provides:
 * - Complete type definitions for itineraries
 * - Itinerary generation from cities, dates, and preferences
 * - Time slot distribution with opening hours awareness
 * - Travel segment calculation
 * - Pace-based activity limits
 * - Intelligent time allocation across cities (WI-5.2)
 * - Daily schedule generation with precise timing (WI-5.3)
 *
 * Usage:
 * ```typescript
 * import {
 *   generateItinerary,
 *   type Itinerary,
 *   type ItineraryGenerationInput,
 * } from '@/services/itinerary';
 *
 * const input: ItineraryGenerationInput = {
 *   tripId: 'trip-123',
 *   startDate: new Date('2024-06-01'),
 *   endDate: new Date('2024-06-10'),
 *   cities: [
 *     { id: 'paris', name: 'Paris', coordinates: {...}, nights: 3 },
 *     { id: 'lyon', name: 'Lyon', coordinates: {...}, nights: 2 },
 *   ],
 *   preferences: userPreferences,
 *   favouritedPlaceIds: ['place-1', 'place-2'],
 * };
 *
 * const itinerary = await generateItinerary(input);
 * ```
 */

// Types
export {
  // Time & Scheduling
  type TimeSlot,
  type TimeSlotConfig,
  DEFAULT_TIME_SLOTS,

  // Activities
  type PlaceActivity,
  type TravelActivity,
  type FreeTimeActivity,
  type MealActivity,
  type ItineraryActivity,

  // Places
  type ItineraryPlace,

  // Cities
  type ItineraryCity,

  // Days
  type ItineraryDay,

  // Complete Itinerary
  type Itinerary,
  type ItinerarySummary,

  // Generation Input
  type ItineraryGenerationInput,
  type ItineraryGenerationOptions,

  // Configuration
  CATEGORY_SLOT_APPROPRIATENESS,
  CATEGORY_DURATION_ESTIMATES,
  PACE_ACTIVITY_COUNTS,
  PACE_FREE_TIME,
} from './types';

// Re-export Coordinates from hiddenGems for convenience
export type { Coordinates } from '../hiddenGems';

// Generator
export {
  // Main function
  generateItinerary,

  // Utilities
  calculateDistance,
  estimateTravelTime,
  isOpenDuringSlot,
  toItineraryPlace,
  calculateSlotTiming,
  getEstimatedDuration,
  isDayFullyBooked,
} from './generator';

// Time Allocation (WI-5.2)
export {
  // Types
  type AllocationCity,
  type AllocationOptions,
  type CityAllocation,
  type AllocationResult,

  // Main function
  allocateTripTime,

  // Utilities
  quickAllocate,
  suggestCityCount,
  validateAllocation,
  formatAllocation,
  formatAllocationSummary,
} from './timeAllocation';

// Daily Schedule (WI-5.3)
export {
  // Types
  type DaySlotConfig,
  type ScheduledActivity,
  type DailySchedule,
  type DailyScheduleInput,
  type ScheduleOptions,

  // Configuration
  DAY_SLOTS,

  // Main function
  generateDailySchedule,

  // Utilities
  optimizePlaceOrder,
  formatScheduledActivity,
  formatDailySchedule,
  validateSchedule,
  getActivityCountForPace,
} from './dailySchedule';

// Travel Segment (WI-5.4)
export {
  // Types
  type TravelMode,
  type TravelLocation,
  type TrafficCondition,
  type TravelSegment,
  type DepartureSuggestion,
  type TravelCalculationOptions,
  type DepartureSuggestionOptions,

  // Main functions
  calculateTravelSegment,
  calculateMultiPointRoute,
  suggestDepartureTime,
  suggestDepartureOptions,
  calculateRouteTotal,

  // Quick utilities
  quickTravelEstimate,
  isWalkingDistance,
  recommendTravelMode,

  // Batch operations
  precalculateSegments,

  // Formatting
  formatDistance,
  formatDuration,
  formatTravelSegment,
  formatRouteSummary,

  // Cache management
  clearRouteCache,
  getCacheStats,
  getTrafficCondition,
} from './travelSegment';

// Alternatives (WI-5.7)
export {
  // Types
  type AlternativePlace,
  type AlternativeReason,
  type GetAlternativesInput,
  type AlternativesResult,

  // Main functions
  getAlternatives,
  getSuggestionsForSlot,
  getAlternativesByCategory,

  // Utilities
  getReasonLabel,
  getReasonIcon,
  formatScore,
} from './alternatives';
