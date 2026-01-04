/**
 * API Hooks
 *
 * WI-12.2: Centralized exports for all API hooks
 *
 * Provides React Query hooks for all API operations using Supabase.
 */

// ============================================================================
// Trip Hooks
// ============================================================================
export {
  // Query hooks
  useTrips,
  useTrip,
  useSharedTrip,
  useActiveTrip,
  useHasTrips,
  // Mutation hooks
  useCreateTrip,
  useUpdateTrip,
  useDeleteTrip,
  useUpdateTripStatus,
  useShareTrip,
  // Utilities
  usePrefetchTrip,
  // Query keys
  tripKeys,
} from './useTrips';

// ============================================================================
// Itinerary Hooks
// ============================================================================
export {
  // Query hooks
  useItinerary,
  useItineraryDay,
  useTodayItinerary,
  // Mutation hooks
  useUpsertItineraryDay,
  useUpdateItineraryDay,
  useDeleteItineraryDay,
  useMarkActivityComplete,
  useUnmarkActivityComplete,
  useReorderActivities,
  useAddDayNotes,
  // Utilities
  calculateItineraryProgress,
  getAllDayActivities,
  // Query keys
  itineraryKeys,
} from './useItineraries';

// ============================================================================
// Places Hooks
// ============================================================================
export {
  // Query hooks
  usePlacesSearch,
  useHiddenGems,
  useNearbyPlaces,
  usePlaceDetails,
  useDebouncedPlaceSearch,
  // Utilities
  usePrefetchCityPlaces,
  useFilteredPlaces,
  // Query keys
  placesKeys,
  // Types
  type Place,
  type PlaceCoordinates,
  type PlaceSearchParams,
  type HiddenGemCriteria,
} from './usePlaces';

// ============================================================================
// Companion Hooks - REMOVED (Planning feature being rebuilt)
// ============================================================================
// Companion hooks have been removed while the planning feature is being rebuilt.
// See useProactiveSuggestions.ts for local stub implementations.

// ============================================================================
// Memory Hooks
// ============================================================================
export {
  // Query hooks
  useMemories,
  useMemory,
  useTripMemory,
  useSharedMemory,
  useUserMemory,
  // Mutation hooks
  useCreateMemory,
  useUpdateMemory,
  useDeleteMemory,
  useAddHighlight,
  useRemoveHighlight,
  useAddPhoto,
  useUpdateMemoryStats,
  useShareMemory,
  useGenerateMemorySummary,
  // Utilities
  calculateMemoryCompleteness,
  getMemoryPreview,
  // Query keys
  memoryKeys,
  // Types
  type UserMemory,
} from './useMemories';

// ============================================================================
// Booking Hooks
// ============================================================================
export {
  // Query hooks
  useBookings,
  useTripBookings,
  useBooking,
  useBookingAnalytics,
  // Mutation hooks
  useTrackBookingClick,
  useRecordConversion,
  useUpdateBooking,
  // Utilities
  useAffiliateUrl,
  useHasRecentBooking,
  getPlatformInfo,
  PLATFORM_INFO,
  // Query keys
  bookingKeys,
} from './useBookings';
