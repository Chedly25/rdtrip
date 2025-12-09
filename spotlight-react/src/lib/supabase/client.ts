/**
 * Supabase Client
 *
 * WI-12.1: Supabase client configuration
 *
 * Provides a typed Supabase client for database operations.
 * Uses environment variables for configuration.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Profile,
  ProfileUpdate,
  Trip,
  TripInsert,
  TripUpdate,
  TripStatus,
  Itinerary,
  ItineraryInsert,
  Preferences,
  PreferencesInsert,
  Booking,
  BookingInsert,
  Feedback,
  FeedbackInsert,
  Checkin,
  CheckinInsert,
} from './types';

// ============================================================================
// Environment Variables
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// ============================================================================
// Supabase Client
// ============================================================================

/**
 * Supabase client for database operations
 *
 * @example
 * // Query trips
 * const { data, error } = await supabase
 *   .from('trips')
 *   .select('*')
 *   .eq('user_id', userId);
 *
 * @example
 * // Insert a new trip
 * const { data, error } = await supabase
 *   .from('trips')
 *   .insert({ user_id: userId, origin: 'Paris', destination: 'Rome' })
 *   .select()
 *   .single();
 *
 * @example
 * // Auth operations
 * const { data: { user } } = await supabase.auth.getUser();
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage
    persistSession: true,
    // Auto-refresh token before expiry
    autoRefreshToken: true,
    // Detect session from URL (for OAuth redirects)
    detectSessionInUrl: true,
    // Storage key prefix
    storageKey: 'waycraft-auth',
  },
  // Global fetch options
  global: {
    headers: {
      'x-client-info': 'waycraft-web',
    },
  },
  // Realtime configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ============================================================================
// Auth Helpers
// ============================================================================

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
}

/**
 * Get current session
 * Returns null if no session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// ============================================================================
// Database Helpers
// ============================================================================

/**
 * Get user's profile
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error getting profile:', error);
    return null;
  }
  return data as Profile;
}

/**
 * Get current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getProfile(user.id);
}

/**
 * Update user's profile
 */
export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
  return data as Profile;
}

// ============================================================================
// Trip Helpers
// ============================================================================

/**
 * Get all trips for the current user
 */
export async function getUserTrips(userId: string, options?: {
  status?: TripStatus;
  limit?: number;
  offset?: number;
}): Promise<Trip[]> {
  let query = supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting trips:', error);
    throw error;
  }
  return (data || []) as Trip[];
}

/**
 * Get a single trip by ID
 */
export async function getTrip(tripId: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) {
    console.error('Error getting trip:', error);
    return null;
  }
  return data as Trip;
}

/**
 * Create a new trip
 */
export async function createTrip(trip: TripInsert): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select()
    .single();

  if (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
  return data as Trip;
}

/**
 * Update a trip
 */
export async function updateTrip(tripId: string, updates: TripUpdate): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', tripId)
    .select()
    .single();

  if (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
  return data as Trip;
}

/**
 * Soft delete a trip
 */
export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', tripId);

  if (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
}

// ============================================================================
// Itinerary Helpers
// ============================================================================

/**
 * Get itinerary for a trip
 */
export async function getTripItinerary(tripId: string): Promise<Itinerary[]> {
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true });

  if (error) {
    console.error('Error getting itinerary:', error);
    throw error;
  }
  return (data || []) as Itinerary[];
}

/**
 * Upsert itinerary day (insert or update)
 */
export async function upsertItineraryDay(itinerary: ItineraryInsert): Promise<Itinerary> {
  const { data, error } = await supabase
    .from('itineraries')
    .upsert(itinerary, {
      onConflict: 'trip_id,day_number',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting itinerary:', error);
    throw error;
  }
  return data as Itinerary;
}

// ============================================================================
// Preferences Helpers
// ============================================================================

/**
 * Get user's global preferences
 */
export async function getGlobalPreferences(userId: string): Promise<Preferences | null> {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .is('trip_id', null)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error getting preferences:', error);
    throw error;
  }
  return data as Preferences | null;
}

/**
 * Get trip-specific preferences
 */
export async function getTripPreferences(tripId: string): Promise<Preferences | null> {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('trip_id', tripId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting trip preferences:', error);
    throw error;
  }
  return data as Preferences | null;
}

/**
 * Upsert preferences
 */
export async function upsertPreferences(preferences: PreferencesInsert): Promise<Preferences> {
  const { data, error } = await supabase
    .from('preferences')
    .upsert(preferences, {
      onConflict: 'user_id,trip_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting preferences:', error);
    throw error;
  }
  return data as Preferences;
}

// ============================================================================
// Booking Helpers
// ============================================================================

/**
 * Track a booking click
 */
export async function trackBookingClick(booking: BookingInsert): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();

  if (error) {
    console.error('Error tracking booking:', error);
    throw error;
  }
  return data as Booking;
}

/**
 * Record a booking conversion
 */
export async function recordBookingConversion(
  bookingId: string,
  conversionValue?: number,
  currency?: string
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      converted_at: new Date().toISOString(),
      conversion_value: conversionValue,
      conversion_currency: currency || 'EUR',
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error recording conversion:', error);
    throw error;
  }
  return data as Booking;
}

// ============================================================================
// Feedback Helpers
// ============================================================================

/**
 * Submit feedback
 */
export async function submitFeedback(feedback: FeedbackInsert): Promise<Feedback> {
  const { data, error } = await supabase
    .from('feedback')
    .insert(feedback)
    .select()
    .single();

  if (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
  return data as Feedback;
}

// ============================================================================
// Check-in Helpers
// ============================================================================

/**
 * Create a check-in
 */
export async function createCheckin(checkin: CheckinInsert): Promise<Checkin> {
  const { data, error } = await supabase
    .from('checkins')
    .insert(checkin)
    .select()
    .single();

  if (error) {
    console.error('Error creating checkin:', error);
    throw error;
  }
  return data as Checkin;
}

/**
 * Get check-ins for a trip
 */
export async function getTripCheckins(tripId: string): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('trip_id', tripId)
    .order('checked_in_at', { ascending: false });

  if (error) {
    console.error('Error getting checkins:', error);
    throw error;
  }
  return (data || []) as Checkin[];
}

// ============================================================================
// Export Types
// ============================================================================

export type { Database } from './types';
export * from './types';
