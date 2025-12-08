/**
 * Itinerary Types
 *
 * WI-5.1: Core types for itinerary generation
 *
 * Architecture Decisions:
 * - Days are the primary unit (derived from nights per city)
 * - Three time slots per day: morning, afternoon, evening
 * - Activities can be places or travel segments
 * - Each activity has timing metadata for scheduling
 * - Preferences influence place selection via scoring (WI-4.6)
 */

import type { HiddenGemPlace, OpeningHours, Coordinates } from '../hiddenGems';
import type { UserPreferences, TripPace } from '../preferences';
import type { WaycraftCategory } from '../../utils/placeCategories';

// ============================================================================
// Time & Scheduling Types
// ============================================================================

/**
 * Time slots in a day
 */
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

/**
 * Time slot configuration
 */
export interface TimeSlotConfig {
  slot: TimeSlot;
  /** Start time in 24h format, e.g., "09:00" */
  startTime: string;
  /** End time in 24h format, e.g., "12:00" */
  endTime: string;
  /** Slot duration in minutes */
  durationMinutes: number;
}

/**
 * Default time slot definitions
 */
export const DEFAULT_TIME_SLOTS: Record<TimeSlot, TimeSlotConfig> = {
  morning: {
    slot: 'morning',
    startTime: '09:00',
    endTime: '12:00',
    durationMinutes: 180,
  },
  afternoon: {
    slot: 'afternoon',
    startTime: '13:00',
    endTime: '17:00',
    durationMinutes: 240,
  },
  evening: {
    slot: 'evening',
    startTime: '18:00',
    endTime: '22:00',
    durationMinutes: 240,
  },
};

// ============================================================================
// Activity Types
// ============================================================================

/**
 * Base activity interface
 */
interface ActivityBase {
  /** Unique ID for this activity */
  id: string;
  /** Time slot this activity belongs to */
  slot: TimeSlot;
  /** Order within the slot (for sequencing) */
  orderInSlot: number;
  /** Suggested start time (24h format) */
  startTime?: string;
  /** Suggested end time (24h format) */
  endTime?: string;
  /** Duration in minutes */
  durationMinutes: number;
}

/**
 * Place activity - visiting a location
 */
export interface PlaceActivity extends ActivityBase {
  type: 'place';
  /** The place to visit */
  place: ItineraryPlace;
  /** User notes for this activity */
  notes?: string;
  /** Whether this was favourited by user */
  isFavourited: boolean;
  /** Whether this is a hidden gem */
  isHiddenGem: boolean;
  /** Preference match score from WI-4.6 (0-1) */
  preferenceScore?: number;
}

/**
 * Travel segment between cities or within a city
 */
export interface TravelActivity extends ActivityBase {
  type: 'travel';
  /** Starting point */
  from: {
    name: string;
    coordinates: Coordinates;
  };
  /** Destination */
  to: {
    name: string;
    coordinates: Coordinates;
  };
  /** Distance in kilometers */
  distanceKm: number;
  /** Travel mode */
  mode: 'driving' | 'walking' | 'transit';
  /** Optional notes (e.g., "Scenic route along the coast") */
  notes?: string;
}

/**
 * Free time block
 */
export interface FreeTimeActivity extends ActivityBase {
  type: 'free_time';
  /** Suggestion for free time */
  suggestion?: string;
}

/**
 * Meal break
 */
export interface MealActivity extends ActivityBase {
  type: 'meal';
  /** Meal type */
  mealType: 'breakfast' | 'lunch' | 'dinner';
  /** Optional restaurant suggestion */
  suggestedPlace?: ItineraryPlace;
}

/**
 * Any activity type
 */
export type ItineraryActivity =
  | PlaceActivity
  | TravelActivity
  | FreeTimeActivity
  | MealActivity;

// ============================================================================
// Place Types for Itinerary
// ============================================================================

/**
 * Simplified place for itinerary (subset of HiddenGemPlace)
 */
export interface ItineraryPlace {
  /** Google Place ID */
  placeId: string;
  /** Place name */
  name: string;
  /** Coordinates */
  coordinates: Coordinates;
  /** Rating (1-5) */
  rating?: number;
  /** Review count */
  reviewCount?: number;
  /** Primary type/category */
  category: WaycraftCategory;
  /** Google Places types */
  types: string[];
  /** Price level (1-4) */
  priceLevel?: number | null;
  /** Photo URL */
  photoUrl?: string;
  /** Opening hours */
  openingHours?: OpeningHours | null;
  /** Hidden gem score (0-1) */
  hiddenGemScore?: number;
  /** Short description */
  description?: string;
  /** Address */
  address?: string;
}

// ============================================================================
// City Types for Itinerary
// ============================================================================

/**
 * City in the itinerary
 */
export interface ItineraryCity {
  /** City ID */
  id: string;
  /** City name */
  name: string;
  /** Country */
  country?: string;
  /** Coordinates */
  coordinates: Coordinates;
  /** Number of nights staying */
  nights: number;
  /** Number of full days (usually nights, but first/last city might differ) */
  days: number;
  /** Order in the trip (0-indexed) */
  order: number;
  /** Whether this is the origin city */
  isOrigin: boolean;
  /** Whether this is the destination city */
  isDestination: boolean;
}

// ============================================================================
// Day Types
// ============================================================================

/**
 * Single day in the itinerary
 */
export interface ItineraryDay {
  /** Day number (1-indexed for display) */
  dayNumber: number;
  /** Date for this day */
  date: Date;
  /** City for this day */
  city: ItineraryCity;
  /** Is this a travel day (moving between cities)? */
  isTravelDay: boolean;
  /** Activities organized by time slot */
  slots: {
    morning: ItineraryActivity[];
    afternoon: ItineraryActivity[];
    evening: ItineraryActivity[];
  };
  /** Optional day theme (from personalization) */
  theme?: string;
  /** Theme icon (lucide icon name) */
  themeIcon?: string;
  /** Brief summary of the day */
  summary?: string;
}

// ============================================================================
// Complete Itinerary
// ============================================================================

/**
 * Itinerary summary statistics
 */
export interface ItinerarySummary {
  /** Total number of days */
  totalDays: number;
  /** Total number of nights */
  totalNights: number;
  /** Cities visited (in order) */
  cities: string[];
  /** Total activities planned */
  totalActivities: number;
  /** Number of hidden gems included */
  hiddenGemsCount: number;
  /** Number of favourited places included */
  favouritedCount: number;
  /** Total driving distance in km */
  totalDrivingDistanceKm: number;
  /** Total driving time in minutes */
  totalDrivingMinutes: number;
  /** Breakdown by category */
  categoryCounts: Partial<Record<WaycraftCategory, number>>;
}

/**
 * Complete trip itinerary
 */
export interface Itinerary {
  /** Unique itinerary ID */
  id: string;
  /** Associated trip ID */
  tripId: string;
  /** When this itinerary was generated */
  generatedAt: Date;
  /** Version number (for regeneration tracking) */
  version: number;
  /** All days in the itinerary */
  days: ItineraryDay[];
  /** Summary statistics */
  summary: ItinerarySummary;
  /** Generation metadata */
  metadata: {
    /** Pace used for generation */
    pace: TripPace;
    /** Whether hidden gems were prioritized */
    prioritizedHiddenGems: boolean;
    /** Number of favourited places included */
    favouritedIncluded: number;
    /** Generation source */
    source: 'auto' | 'manual' | 'ai';
  };
}

// ============================================================================
// Generation Input Types
// ============================================================================

/**
 * Input for itinerary generation
 */
export interface ItineraryGenerationInput {
  /** Trip ID */
  tripId: string;
  /** Trip start date */
  startDate: Date;
  /** Trip end date */
  endDate: Date;
  /** Cities to visit (in order) with nights allocation */
  cities: Array<{
    id: string;
    name: string;
    country?: string;
    coordinates: Coordinates;
    nights: number;
    isOrigin?: boolean;
    isDestination?: boolean;
  }>;
  /** User preferences */
  preferences: UserPreferences;
  /** IDs of favourited places */
  favouritedPlaceIds: string[];
  /** Places already fetched for each city (keyed by city ID) */
  cityPlaces?: Map<string, HiddenGemPlace[]>;
  /** Traveller type for theming */
  travellerType?: string;
  /** Optional day themes (from personalization) */
  dayThemes?: Array<{
    day: number;
    theme: string;
    icon?: string;
  }>;
}

/**
 * Options for customizing generation
 */
export interface ItineraryGenerationOptions {
  /** Override pace (defaults to preferences.pace) */
  pace?: TripPace;
  /** Target hidden gems ratio (0-1, default 0.3) */
  hiddenGemsRatio?: number;
  /** Include meal suggestions */
  includeMeals?: boolean;
  /** Include free time blocks */
  includeFreeTime?: boolean;
  /** Maximum activities per day (overrides pace-based limit) */
  maxActivitiesPerDay?: number;
  /** Minimum activities per day */
  minActivitiesPerDay?: number;
}

// ============================================================================
// Slot Appropriateness Types
// ============================================================================

/**
 * Category to time slot appropriateness mapping
 */
export type SlotAppropriateness = Record<TimeSlot, number>;

/**
 * Default appropriateness scores for categories by time slot
 * Score: 0 = never, 0.5 = possible, 1 = ideal
 */
export const CATEGORY_SLOT_APPROPRIATENESS: Record<WaycraftCategory, SlotAppropriateness> = {
  food_drink: {
    morning: 0.7,    // Breakfast spots, cafes
    afternoon: 0.9,  // Lunch
    evening: 1.0,    // Dinner - ideal
  },
  culture: {
    morning: 1.0,    // Museums often open in morning - ideal
    afternoon: 0.9,  // Still good
    evening: 0.3,    // Most close
  },
  nature: {
    morning: 1.0,    // Best time for nature - ideal
    afternoon: 0.8,  // Good but hot in summer
    evening: 0.4,    // Limited daylight
  },
  nightlife: {
    morning: 0.0,    // Not appropriate
    afternoon: 0.1,  // Very rare
    evening: 1.0,    // Perfect - ideal
  },
  shopping: {
    morning: 0.6,    // Some shops open late
    afternoon: 1.0,  // Peak shopping - ideal
    evening: 0.5,    // Some close early
  },
  activities: {
    morning: 0.9,    // Good energy
    afternoon: 1.0,  // Ideal
    evening: 0.5,    // Depends on activity
  },
  wellness: {
    morning: 0.9,    // Morning spa
    afternoon: 0.8,  // Afternoon relaxation
    evening: 0.7,    // Evening wind-down
  },
  services: {
    morning: 0.8,
    afternoon: 0.8,
    evening: 0.3,
  },
  accommodation: {
    morning: 0.5,    // Check-out
    afternoon: 0.7,  // Check-in
    evening: 0.3,
  },
  other: {
    morning: 0.7,
    afternoon: 0.7,
    evening: 0.5,
  },
};

// ============================================================================
// Activity Duration Estimates
// ============================================================================

/**
 * Estimated duration in minutes by category
 */
export const CATEGORY_DURATION_ESTIMATES: Record<WaycraftCategory, number> = {
  food_drink: 60,      // 1 hour for a meal
  culture: 90,         // 1.5 hours for museum/gallery
  nature: 120,         // 2 hours for park/nature
  nightlife: 120,      // 2 hours
  shopping: 60,        // 1 hour browsing
  activities: 120,     // 2 hours for experiences
  wellness: 90,        // 1.5 hours for spa/wellness
  services: 30,        // 30 min for essentials
  accommodation: 30,   // Check-in time
  other: 60,           // Default 1 hour
};

// ============================================================================
// Pace Configuration
// ============================================================================

/**
 * Activities per day based on pace
 */
export const PACE_ACTIVITY_COUNTS: Record<TripPace, { min: number; max: number; target: number }> = {
  relaxed: { min: 2, max: 3, target: 2 },
  balanced: { min: 3, max: 5, target: 4 },
  packed: { min: 5, max: 8, target: 6 },
};

/**
 * Free time allocation based on pace (minutes per day)
 */
export const PACE_FREE_TIME: Record<TripPace, number> = {
  relaxed: 180,   // 3 hours
  balanced: 90,   // 1.5 hours
  packed: 30,     // 30 minutes
};
