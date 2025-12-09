/**
 * Supabase Database Types
 *
 * WI-12.1: TypeScript types for Supabase database
 *
 * Auto-generated types can be created with:
 * npx supabase gen types typescript --project-id jnkeqsavgpgsugepvuiw > src/lib/supabase/database.types.ts
 *
 * These manual types provide better DX with documentation.
 */

// ============================================================================
// Enums
// ============================================================================

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'none';

export type TravellerType = 'solo' | 'couple' | 'family' | 'friends' | 'group';
export type TripStatus = 'planning' | 'confirmed' | 'active' | 'completed' | 'archived';

export type TripPace = 'relaxed' | 'balanced' | 'packed';
export type BudgetLevel = 'budget' | 'moderate' | 'comfort' | 'luxury';
export type DiningStyle = 'street_food' | 'casual' | 'mixed' | 'fine_dining';
export type AccommodationStyle = 'budget' | 'comfortable' | 'luxury' | 'unique';
export type TimePreference = 'early_bird' | 'flexible' | 'late_riser';
export type CrowdPreference = 'avoid_crowds' | 'dont_mind' | 'like_busy';

export type BookingPlatform = 'booking_com' | 'getyourguide' | 'thefork' | 'viator' | 'airbnb' | 'other';

export type FeedbackType = 'trip_rating' | 'app_rating' | 'feature_request' | 'bug_report' | 'general';
export type FeedbackStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';

// ============================================================================
// JSON Types
// ============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SelectedCity {
  id: string;
  name: string;
  country?: string;
  coordinates: Coordinates;
  nights: number;
  order: number;
}

export interface FavouritedPlace {
  placeId: string;
  name: string;
  type: string;
  cityId: string;
}

export interface InterestCategories {
  food: number;
  culture: number;
  nature: number;
  nightlife: number;
  shopping: number;
  adventure: number;
  relaxation: number;
  photography: number;
  beach: number;
  localExperiences: number;
}

export interface SpecificInterest {
  tag: string;
  confidence: number;
  source: 'stated' | 'observed' | 'historical';
  category?: keyof InterestCategories;
}

export interface Avoidance {
  tag: string;
  strength: number;
  source: 'stated' | 'observed' | 'historical';
  reason?: string;
}

export interface DietaryRequirement {
  tag: string;
  isStrict: boolean;
}

export interface AccessibilityNeed {
  tag: string;
  details?: string;
}

export interface PreferenceSources {
  hasStated: boolean;
  hasObserved: boolean;
  hasHistorical: boolean;
}

export interface MemoryHighlight {
  type: 'place' | 'moment' | 'food' | 'view' | 'activity';
  title: string;
  description?: string;
  photoUrl?: string;
  placeId?: string;
  dayNumber?: number;
}

export interface MemoryPhoto {
  url: string;
  caption?: string;
  placeId?: string;
  dayNumber?: number;
  takenAt?: string;
}

export interface TripStats {
  totalDistanceKm?: number;
  daysCount?: number;
  citiesCount?: number;
  placesVisited?: number;
  photosCount?: number;
  checkinsCount?: number;
}

export interface ItineraryActivity {
  id: string;
  type: 'place' | 'travel' | 'free_time' | 'meal';
  placeId?: string;
  placeName?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  notes?: string;
  status?: 'planned' | 'completed' | 'skipped';
}

// ============================================================================
// Table Types
// ============================================================================

/**
 * Profile - User profile data (linked to auth.users)
 */
export interface Profile {
  id: string; // UUID, same as auth.users.id
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;

  // Subscription
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;

  // Usage
  ai_interactions_count: number;
  ai_interactions_reset_at: string;
  trips_count: number;

  // OAuth
  google_id: string | null;

  // Metadata
  onboarding_completed: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  trial_ends_at?: string | null;
  google_id?: string | null;
  onboarding_completed?: boolean;
}

export interface ProfileUpdate {
  display_name?: string | null;
  avatar_url?: string | null;
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  trial_ends_at?: string | null;
  ai_interactions_count?: number;
  ai_interactions_reset_at?: string;
  onboarding_completed?: boolean;
  last_seen_at?: string;
}

/**
 * Trip - Core trip data
 */
export interface Trip {
  id: string;
  user_id: string;

  // Basic info
  name: string | null;
  origin: string;
  origin_coordinates: Coordinates | null;
  destination: string;
  destination_coordinates: Coordinates | null;

  // Dates
  start_date: string | null;
  end_date: string | null;

  // Configuration
  traveller_type: TravellerType;
  traveller_count: number;

  // Selected cities
  selected_cities: SelectedCity[];
  favourited_places: FavouritedPlace[];

  // Route data
  route_geometry: unknown | null;
  total_distance_km: number | null;
  total_duration_minutes: number | null;

  // Status
  status: TripStatus;
  current_day: number;
  current_city_index: number;
  trip_started_at: string | null;
  trip_completed_at: string | null;

  // Legacy
  heroku_route_id: string | null;

  // Sharing
  is_public: boolean;
  share_token: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TripInsert {
  user_id: string;
  name?: string | null;
  origin: string;
  origin_coordinates?: Coordinates | null;
  destination: string;
  destination_coordinates?: Coordinates | null;
  start_date?: string | null;
  end_date?: string | null;
  traveller_type?: TravellerType;
  traveller_count?: number;
  selected_cities?: SelectedCity[];
  favourited_places?: FavouritedPlace[];
  status?: TripStatus;
  heroku_route_id?: string | null;
  is_public?: boolean;
}

export interface TripUpdate {
  name?: string | null;
  origin?: string;
  origin_coordinates?: Coordinates | null;
  destination?: string;
  destination_coordinates?: Coordinates | null;
  start_date?: string | null;
  end_date?: string | null;
  traveller_type?: TravellerType;
  traveller_count?: number;
  selected_cities?: SelectedCity[];
  favourited_places?: FavouritedPlace[];
  route_geometry?: unknown | null;
  total_distance_km?: number | null;
  total_duration_minutes?: number | null;
  status?: TripStatus;
  current_day?: number;
  current_city_index?: number;
  trip_started_at?: string | null;
  trip_completed_at?: string | null;
  is_public?: boolean;
  share_token?: string | null;
  deleted_at?: string | null;
}

/**
 * Itinerary - Day-by-day plans
 */
export interface Itinerary {
  id: string;
  trip_id: string;

  day_number: number;
  date: string | null;
  city_id: string;
  city_name: string;

  morning_activities: ItineraryActivity[];
  afternoon_activities: ItineraryActivity[];
  evening_activities: ItineraryActivity[];

  theme: string | null;
  theme_icon: string | null;
  summary: string | null;
  is_travel_day: boolean;

  user_notes: string | null;
  completed_activities: string[];

  generated_at: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ItineraryInsert {
  trip_id: string;
  day_number: number;
  date?: string | null;
  city_id: string;
  city_name: string;
  morning_activities?: ItineraryActivity[];
  afternoon_activities?: ItineraryActivity[];
  evening_activities?: ItineraryActivity[];
  theme?: string | null;
  theme_icon?: string | null;
  summary?: string | null;
  is_travel_day?: boolean;
}

export interface ItineraryUpdate {
  morning_activities?: ItineraryActivity[];
  afternoon_activities?: ItineraryActivity[];
  evening_activities?: ItineraryActivity[];
  theme?: string | null;
  summary?: string | null;
  user_notes?: string | null;
  completed_activities?: string[];
  version?: number;
}

/**
 * Preferences - User preferences (global or per-trip)
 */
export interface Preferences {
  id: string;
  user_id: string;
  trip_id: string | null;

  interests: InterestCategories;
  specific_interests: SpecificInterest[];
  avoidances: Avoidance[];

  pace: TripPace;
  budget: BudgetLevel;
  dining_style: DiningStyle;
  dietary_requirements: DietaryRequirement[];
  accommodation_style: AccommodationStyle;
  time_preference: TimePreference;
  crowd_preference: CrowdPreference;

  prefers_hidden_gems: boolean;
  hidden_gems_confidence: number;
  accessibility_needs: AccessibilityNeed[];

  overall_confidence: number;
  sources: PreferenceSources;
  version: number;

  created_at: string;
  updated_at: string;
}

export interface PreferencesInsert {
  user_id: string;
  trip_id?: string | null;
  interests?: InterestCategories;
  specific_interests?: SpecificInterest[];
  avoidances?: Avoidance[];
  pace?: TripPace;
  budget?: BudgetLevel;
  dining_style?: DiningStyle;
  dietary_requirements?: DietaryRequirement[];
  accommodation_style?: AccommodationStyle;
  time_preference?: TimePreference;
  crowd_preference?: CrowdPreference;
  prefers_hidden_gems?: boolean;
}

export interface PreferencesUpdate {
  interests?: InterestCategories;
  specific_interests?: SpecificInterest[];
  avoidances?: Avoidance[];
  pace?: TripPace;
  budget?: BudgetLevel;
  dining_style?: DiningStyle;
  dietary_requirements?: DietaryRequirement[];
  accommodation_style?: AccommodationStyle;
  time_preference?: TimePreference;
  crowd_preference?: CrowdPreference;
  prefers_hidden_gems?: boolean;
  hidden_gems_confidence?: number;
  accessibility_needs?: AccessibilityNeed[];
  overall_confidence?: number;
  sources?: PreferenceSources;
  version?: number;
}

/**
 * Memory - Post-trip memories
 */
export interface Memory {
  id: string;
  trip_id: string;
  user_id: string;

  trip_summary: string | null;
  ai_generated_summary: string | null;
  highlights: MemoryHighlight[];
  photos: MemoryPhoto[];
  cover_photo_url: string | null;
  stats: TripStats;

  is_public: boolean;
  share_token: string | null;
  view_count: number;

  created_at: string;
  updated_at: string;
}

export interface MemoryInsert {
  trip_id: string;
  user_id: string;
  trip_summary?: string | null;
  ai_generated_summary?: string | null;
  highlights?: MemoryHighlight[];
  photos?: MemoryPhoto[];
  cover_photo_url?: string | null;
  stats?: TripStats;
  is_public?: boolean;
}

export interface MemoryUpdate {
  trip_summary?: string | null;
  ai_generated_summary?: string | null;
  highlights?: MemoryHighlight[];
  photos?: MemoryPhoto[];
  cover_photo_url?: string | null;
  stats?: TripStats;
  is_public?: boolean;
  share_token?: string | null;
  view_count?: number;
}

/**
 * Booking - Affiliate booking tracking
 */
export interface Booking {
  id: string;
  user_id: string;
  trip_id: string | null;

  place_id: string;
  place_name: string;
  place_type: string | null;
  city_name: string | null;

  platform: BookingPlatform;
  affiliate_url: string;

  clicked_at: string;
  converted_at: string | null;
  conversion_value: number | null;
  conversion_currency: string;

  booking_date: string | null;
  booking_reference: string | null;
  notes: string | null;

  created_at: string;
}

export interface BookingInsert {
  user_id: string;
  trip_id?: string | null;
  place_id: string;
  place_name: string;
  place_type?: string | null;
  city_name?: string | null;
  platform: BookingPlatform;
  affiliate_url: string;
  booking_date?: string | null;
  notes?: string | null;
}

export interface BookingUpdate {
  converted_at?: string | null;
  conversion_value?: number | null;
  conversion_currency?: string;
  booking_reference?: string | null;
  notes?: string | null;
}

/**
 * Feedback - User ratings and reviews
 */
export interface Feedback {
  id: string;
  user_id: string;
  trip_id: string | null;

  feedback_type: FeedbackType;
  rating: number | null;
  title: string | null;
  message: string;
  category: string | null;
  tags: string[];
  status: FeedbackStatus;

  admin_response: string | null;
  responded_at: string | null;
  responded_by: string | null;

  app_version: string | null;
  device_info: unknown | null;

  created_at: string;
  updated_at: string;
}

export interface FeedbackInsert {
  user_id: string;
  trip_id?: string | null;
  feedback_type: FeedbackType;
  rating?: number | null;
  title?: string | null;
  message: string;
  category?: string | null;
  tags?: string[];
  app_version?: string | null;
  device_info?: unknown | null;
}

/**
 * PlacesCache - Cached place data
 */
export interface PlacesCache {
  id: string;
  location_hash: string;
  city_name: string | null;
  places_data: unknown[];
  category: string | null;
  radius_km: number | null;
  created_at: string;
  expires_at: string;
  hit_count: number;
  last_hit_at: string | null;
}

export interface PlacesCacheInsert {
  location_hash: string;
  city_name?: string | null;
  places_data: unknown[];
  category?: string | null;
  radius_km?: number | null;
  expires_at?: string;
}

/**
 * Checkin - Active trip check-ins
 */
export interface Checkin {
  id: string;
  trip_id: string;
  user_id: string;

  place_id: string | null;
  place_name: string | null;
  city_name: string | null;
  coordinates: Coordinates | null;

  photo_url: string | null;
  note: string | null;

  day_number: number | null;
  activity_id: string | null;

  checked_in_at: string;
  created_at: string;
}

export interface CheckinInsert {
  trip_id: string;
  user_id: string;
  place_id?: string | null;
  place_name?: string | null;
  city_name?: string | null;
  coordinates?: Coordinates | null;
  photo_url?: string | null;
  note?: string | null;
  day_number?: number | null;
  activity_id?: string | null;
}

// ============================================================================
// Database Schema Type
// ============================================================================

/**
 * Complete database schema type
 * Used by Supabase client for type safety
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      trips: {
        Row: Trip;
        Insert: TripInsert;
        Update: TripUpdate;
        Relationships: [
          {
            foreignKeyName: 'trips_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      itineraries: {
        Row: Itinerary;
        Insert: ItineraryInsert;
        Update: ItineraryUpdate;
        Relationships: [
          {
            foreignKeyName: 'itineraries_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          }
        ];
      };
      preferences: {
        Row: Preferences;
        Insert: PreferencesInsert;
        Update: PreferencesUpdate;
        Relationships: [
          {
            foreignKeyName: 'preferences_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'preferences_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          }
        ];
      };
      memories: {
        Row: Memory;
        Insert: MemoryInsert;
        Update: MemoryUpdate;
        Relationships: [
          {
            foreignKeyName: 'memories_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memories_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      bookings: {
        Row: Booking;
        Insert: BookingInsert;
        Update: BookingUpdate;
        Relationships: [
          {
            foreignKeyName: 'bookings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          }
        ];
      };
      feedback: {
        Row: Feedback;
        Insert: FeedbackInsert;
        Update: Partial<Feedback>;
        Relationships: [
          {
            foreignKeyName: 'feedback_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'feedback_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          }
        ];
      };
      places_cache: {
        Row: PlacesCache;
        Insert: PlacesCacheInsert;
        Update: Partial<PlacesCache>;
        Relationships: [];
      };
      checkins: {
        Row: Checkin;
        Insert: CheckinInsert;
        Update: Partial<Checkin>;
        Relationships: [
          {
            foreignKeyName: 'checkins_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'checkins_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      trips_with_stats: {
        Row: Trip & {
          itinerary_days_count: number;
          user_display_name: string | null;
          user_avatar_url: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      clean_expired_cache: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ============================================================================
// Helper Types
// ============================================================================

/** Type for a row from a specific table */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Type for inserting into a specific table */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Type for updating a specific table */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
