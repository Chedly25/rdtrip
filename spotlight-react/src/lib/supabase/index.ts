/**
 * Supabase Library Barrel Export
 *
 * WI-12.1: Central export for Supabase client and types
 */

// Client and helpers
export {
  supabase,
  getCurrentUser,
  getSession,
  isAuthenticated,
  signOut,
  getProfile,
  getCurrentProfile,
  updateProfile,
  getUserTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripItinerary,
  upsertItineraryDay,
  getGlobalPreferences,
  getTripPreferences,
  upsertPreferences,
  trackBookingClick,
  recordBookingConversion,
  submitFeedback,
  createCheckin,
  getTripCheckins,
} from './client';

// Types
export type {
  // Database
  Database,

  // Enums
  SubscriptionTier,
  SubscriptionStatus,
  TravellerType,
  TripStatus,
  TripPace,
  BudgetLevel,
  DiningStyle,
  AccommodationStyle,
  TimePreference,
  CrowdPreference,
  BookingPlatform,
  FeedbackType,
  FeedbackStatus,

  // JSON Types
  Coordinates,
  SelectedCity,
  FavouritedPlace,
  InterestCategories,
  SpecificInterest,
  Avoidance,
  DietaryRequirement,
  AccessibilityNeed,
  PreferenceSources,
  MemoryHighlight,
  MemoryPhoto,
  TripStats,
  ItineraryActivity,

  // Table Types
  Profile,
  ProfileInsert,
  ProfileUpdate,
  Trip,
  TripInsert,
  TripUpdate,
  Itinerary,
  ItineraryInsert,
  ItineraryUpdate,
  Preferences,
  PreferencesInsert,
  PreferencesUpdate,
  Memory,
  MemoryInsert,
  MemoryUpdate,
  Booking,
  BookingInsert,
  BookingUpdate,
  Feedback,
  FeedbackInsert,
  PlacesCache,
  PlacesCacheInsert,
  Checkin,
  CheckinInsert,

  // Helper Types
  TableRow,
  TableInsert,
  TableUpdate,
} from './types';
