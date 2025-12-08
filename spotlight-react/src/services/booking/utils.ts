/**
 * Booking Context Utilities
 *
 * WI-10.1: Helper functions for creating booking contexts from app data
 *
 * Design Philosophy:
 * - CONVENIENT - Easy to create contexts from existing app types
 * - SMART - Infer missing data where possible
 * - FLEXIBLE - Works with partial data
 */

import type {
  HotelBookingContext,
  ActivityBookingContext,
  RestaurantBookingContext,
  BookingClickSource,
  BookingLink,
  BookingOptions,
  BookingPartnerCategory,
} from './types';
import type { ItineraryCity, ItineraryDay, PlaceActivity } from '../itinerary/types';
import type { HiddenGemPlace } from '../hiddenGems';
import {
  generateHotelOptions,
  generateActivityOptions,
  generateRestaurantOptions,
} from './generators';

// ============================================================================
// Context Builders
// ============================================================================

/**
 * Create hotel booking context from itinerary city
 */
export function createHotelContextFromCity(
  city: ItineraryCity | { name: string; country?: string; coordinates?: { lat: number; lng: number } },
  dates?: { checkIn?: Date; checkOut?: Date },
  travelers?: { adults?: number; rooms?: number }
): HotelBookingContext {
  return {
    cityName: city.name,
    country: city.country,
    coordinates: city.coordinates,
    checkIn: dates?.checkIn,
    checkOut: dates?.checkOut,
    adults: travelers?.adults || 2,
    rooms: travelers?.rooms || 1,
  };
}

/**
 * Create hotel booking context from itinerary day
 */
export function createHotelContextFromDay(
  day: ItineraryDay,
  tripEndDate?: Date
): HotelBookingContext {
  // Calculate checkout as next day or trip end
  const checkOut = tripEndDate && day.date < tripEndDate
    ? new Date(day.date.getTime() + 24 * 60 * 60 * 1000)
    : undefined;

  return {
    cityName: day.city.name,
    country: day.city.country,
    coordinates: day.city.coordinates,
    checkIn: day.date,
    checkOut,
    adults: 2,
    rooms: 1,
  };
}

/**
 * Create activity booking context from place activity
 */
export function createActivityContextFromPlace(
  activity: PlaceActivity | HiddenGemPlace,
  cityName: string,
  date?: Date
): ActivityBookingContext {
  // Handle both PlaceActivity and HiddenGemPlace
  const isPlaceActivity = 'place' in activity;
  const place = isPlaceActivity ? activity.place : activity;
  const name = place.name;

  // Get category - ItineraryPlace has category, HiddenGemPlace has types
  let category: string | undefined;
  if (isPlaceActivity) {
    category = (activity as PlaceActivity).place.category;
  } else {
    // Infer category from types for HiddenGemPlace
    const types = (activity as HiddenGemPlace).types || [];
    category = types[0]; // Use first type as category
  }

  return {
    cityName,
    activityName: name,
    category,
    coordinates: place.coordinates,
    date,
  };
}

/**
 * Create activity booking context from itinerary day
 */
export function createActivityContextFromDay(
  day: ItineraryDay,
  activityName?: string
): ActivityBookingContext {
  return {
    cityName: day.city.name,
    country: day.city.country,
    coordinates: day.city.coordinates,
    activityName,
    date: day.date,
  };
}

/**
 * Create restaurant booking context from place
 */
export function createRestaurantContextFromPlace(
  place: { name: string; coordinates?: { lat: number; lng: number } },
  cityName: string,
  reservation?: { date?: Date; time?: string; partySize?: number }
): RestaurantBookingContext {
  return {
    cityName,
    restaurantName: place.name,
    coordinates: place.coordinates,
    date: reservation?.date,
    time: reservation?.time,
    partySize: reservation?.partySize || 2,
  };
}

/**
 * Create restaurant context for a specific meal in itinerary
 */
export function createRestaurantContextFromMeal(
  day: ItineraryDay,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  restaurantName?: string
): RestaurantBookingContext {
  // Default times for meal types
  const mealTimes: Record<string, string> = {
    breakfast: '09:00',
    lunch: '12:30',
    dinner: '19:30',
  };

  return {
    cityName: day.city.name,
    country: day.city.country,
    coordinates: day.city.coordinates,
    restaurantName: restaurantName || `${mealType} restaurant`,
    date: day.date,
    time: mealTimes[mealType],
    partySize: 2,
  };
}

// ============================================================================
// Click Source Builders
// ============================================================================

/**
 * Create click source for city preview page
 */
export function createCityPreviewSource(
  tripId: string,
  cityId: string
): BookingClickSource {
  return {
    page: 'city_preview',
    tripId,
    cityId,
  };
}

/**
 * Create click source for itinerary page
 */
export function createItinerarySource(
  tripId: string,
  cityId: string,
  dayNumber: number,
  activityId?: string
): BookingClickSource {
  return {
    page: 'itinerary',
    tripId,
    cityId,
    dayNumber,
    activityId,
  };
}

/**
 * Create click source for place details
 */
export function createPlaceDetailsSource(
  placeId: string,
  tripId?: string,
  cityId?: string
): BookingClickSource {
  return {
    page: 'place_details',
    tripId,
    cityId,
    placeId,
  };
}

/**
 * Create click source for companion suggestions
 */
export function createCompanionSource(
  tripId?: string,
  cityId?: string,
  activityId?: string
): BookingClickSource {
  return {
    page: 'companion',
    tripId,
    cityId,
    activityId,
  };
}

// ============================================================================
// Quick Generators
// ============================================================================

/**
 * Generate all booking options for a city
 *
 * Useful for city preview pages where you want to show all options.
 */
export function generateCityBookingOptions(
  city: { name: string; country?: string; coordinates?: { lat: number; lng: number } },
  dates?: { checkIn?: Date; checkOut?: Date }
): {
  hotels: BookingOptions;
  activities: BookingOptions;
} {
  const hotelContext = createHotelContextFromCity(city, dates);
  const activityContext: ActivityBookingContext = {
    cityName: city.name,
    country: city.country,
    coordinates: city.coordinates,
  };

  return {
    hotels: generateHotelOptions(hotelContext),
    activities: generateActivityOptions(activityContext),
  };
}

/**
 * Generate booking options for a place
 *
 * Intelligently detects whether this is a restaurant, activity, etc.
 */
export function generatePlaceBookingOptions(
  place: { name: string; category: string; coordinates?: { lat: number; lng: number } },
  cityName: string,
  date?: Date
): BookingOptions | null {
  const category = place.category.toLowerCase();

  // Restaurant categories
  if (category.includes('food') || category.includes('restaurant') || category === 'food_drink') {
    const context = createRestaurantContextFromPlace(place, cityName, { date });
    return generateRestaurantOptions(context);
  }

  // Activity categories
  if (
    category.includes('activity') ||
    category.includes('culture') ||
    category.includes('nature') ||
    category === 'activities'
  ) {
    const context: ActivityBookingContext = {
      cityName,
      activityName: place.name,
      category,
      coordinates: place.coordinates,
      date,
    };
    return generateActivityOptions(context);
  }

  // Default to activities for unknown categories
  const context: ActivityBookingContext = {
    cityName,
    activityName: place.name,
    coordinates: place.coordinates,
    date,
  };
  return generateActivityOptions(context);
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Get appropriate booking button text based on category
 */
export function getBookingButtonText(category: BookingPartnerCategory): {
  primary: string;
  secondary: string;
} {
  const texts: Record<BookingPartnerCategory, { primary: string; secondary: string }> = {
    hotel: {
      primary: 'Book Hotel',
      secondary: 'Check availability',
    },
    activity: {
      primary: 'Get Tickets',
      secondary: 'See options',
    },
    restaurant: {
      primary: 'Reserve Table',
      secondary: 'Check availability',
    },
  };

  return texts[category];
}

/**
 * Check if booking options are available (at least one link)
 */
export function hasBookingOptions(options: BookingOptions | null): boolean {
  if (!options) return false;
  return options.primary !== null || options.alternatives.length > 0;
}

/**
 * Get all links from booking options as flat array
 */
export function getAllBookingLinks(options: BookingOptions): BookingLink[] {
  const links: BookingLink[] = [];
  if (options.primary) {
    links.push(options.primary);
  }
  links.push(...options.alternatives);
  return links;
}

/**
 * Format price range for display
 */
export function formatPriceRange(priceLevel: number | null | undefined): string {
  if (priceLevel === null || priceLevel === undefined) return '';
  return '$'.repeat(priceLevel);
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Calculate nights between two dates
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get default checkout date (next day)
 */
export function getDefaultCheckout(checkIn: Date): Date {
  const checkout = new Date(checkIn);
  checkout.setDate(checkout.getDate() + 1);
  return checkout;
}

/**
 * Format date range for display
 */
export function formatDateRange(checkIn: Date, checkOut: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  const checkInStr = checkIn.toLocaleDateString('en-US', options);
  const checkOutStr = checkOut.toLocaleDateString('en-US', options);
  return `${checkInStr} - ${checkOutStr}`;
}
