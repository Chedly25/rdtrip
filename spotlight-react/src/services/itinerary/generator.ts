/**
 * Itinerary Generation Service
 *
 * WI-5.1: Core service that generates a complete trip itinerary
 *
 * Generation Logic:
 * 1. Calculate days per city based on nights allocation
 * 2. For each city, fetch/use top places matching preferences
 * 3. Distribute places across time slots considering:
 *    - Opening hours
 *    - Time-appropriateness (no museums at night)
 *    - Travel time between places
 *    - User's pace preference
 * 4. Prioritize favourited places
 * 5. Include mix of iconic + hidden gems
 * 6. Add travel segments between cities
 * 7. Build final itinerary structure
 */

import type { HiddenGemPlace, Coordinates, OpeningHours } from '../hiddenGems';
import { rankPlacesByPreference, type ScoredPlace, type ScorablePlace } from '../preferences/scoring';
import { getPrimaryCategory } from '../../utils/placeCategories';
import type { WaycraftCategory } from '../../utils/placeCategories';

import {
  type Itinerary,
  type ItineraryDay,
  type ItineraryCity,
  type ItineraryPlace,
  type ItineraryActivity,
  type PlaceActivity,
  type TravelActivity,
  type FreeTimeActivity,
  type MealActivity,
  type TimeSlot,
  type ItineraryGenerationInput,
  type ItineraryGenerationOptions,
  type ItinerarySummary,
  DEFAULT_TIME_SLOTS,
  CATEGORY_SLOT_APPROPRIATENESS,
  CATEGORY_DURATION_ESTIMATES,
  PACE_ACTIVITY_COUNTS,
} from './types';

// ============================================================================
// Constants
// ============================================================================

/** Average driving speed in km/h for time estimation */
const AVERAGE_DRIVING_SPEED_KMH = 60;

/** Walking speed in km/h */
const WALKING_SPEED_KMH = 4;

/** Day of week names for opening hours parsing */
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate travel time between two points
 * @returns Travel time in minutes
 */
export function estimateTravelTime(
  coord1: Coordinates,
  coord2: Coordinates,
  mode: 'driving' | 'walking' = 'driving'
): number {
  const distanceKm = calculateDistance(coord1, coord2);
  const speedKmh = mode === 'driving' ? AVERAGE_DRIVING_SPEED_KMH : WALKING_SPEED_KMH;
  return Math.round((distanceKm / speedKmh) * 60);
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Parse time string to minutes from midnight
 * @param time Time in "HH:MM" format
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// ============================================================================
// Opening Hours Logic
// ============================================================================

/**
 * Check if a place is open during a specific time slot on a given day
 */
export function isOpenDuringSlot(
  openingHours: OpeningHours | null | undefined,
  slot: TimeSlot,
  date: Date
): { isOpen: boolean; confidence: 'high' | 'medium' | 'low' } {
  if (!openingHours) {
    // No hours data - assume open with low confidence
    return { isOpen: true, confidence: 'low' };
  }

  const slotConfig = DEFAULT_TIME_SLOTS[slot];
  const slotStart = parseTimeToMinutes(slotConfig.startTime);
  const slotEnd = parseTimeToMinutes(slotConfig.endTime);
  const dayOfWeek = date.getDay(); // 0 = Sunday

  // Try to use periods (structured data)
  if (openingHours.periods && openingHours.periods.length > 0) {
    const todayPeriods = openingHours.periods.filter(
      (p: { open: { day: number; time: string }; close?: { day: number; time: string } }) =>
        p.open.day === dayOfWeek
    );

    if (todayPeriods.length === 0) {
      // No periods for this day - likely closed
      return { isOpen: false, confidence: 'high' };
    }

    for (const period of todayPeriods) {
      const openTime = parseGoogleTime(period.open.time);
      const closeTime = period.close ? parseGoogleTime(period.close.time) : 24 * 60;

      // Check if slot overlaps with opening period
      if (slotStart < closeTime && slotEnd > openTime) {
        return { isOpen: true, confidence: 'high' };
      }
    }

    return { isOpen: false, confidence: 'high' };
  }

  // Fall back to weekdayText parsing
  if (openingHours.weekdayText && openingHours.weekdayText.length > 0) {
    const dayName = DAY_NAMES[dayOfWeek];
    const dayText = openingHours.weekdayText.find((text: string) =>
      text.toLowerCase().startsWith(dayName.toLowerCase())
    );

    if (dayText) {
      if (dayText.toLowerCase().includes('closed')) {
        return { isOpen: false, confidence: 'medium' };
      }
      if (dayText.toLowerCase().includes('open 24 hours')) {
        return { isOpen: true, confidence: 'high' };
      }
      // Parse time range like "Monday: 9:00 AM – 10:00 PM"
      const timeMatch = dayText.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?\s*[–-]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
      if (timeMatch) {
        const openHour = parseInt(timeMatch[1]);
        const openMin = parseInt(timeMatch[2] || '0');
        const openAmPm = timeMatch[3]?.toUpperCase();
        const closeHour = parseInt(timeMatch[4]);
        const closeMin = parseInt(timeMatch[5] || '0');
        const closeAmPm = timeMatch[6]?.toUpperCase();

        const openMinutes = convertTo24Hour(openHour, openMin, openAmPm);
        const closeMinutes = convertTo24Hour(closeHour, closeMin, closeAmPm);

        if (slotStart < closeMinutes && slotEnd > openMinutes) {
          return { isOpen: true, confidence: 'medium' };
        }
        return { isOpen: false, confidence: 'medium' };
      }
    }
  }

  // Use openNow as last resort (less reliable for future dates)
  if (openingHours.openNow !== undefined) {
    return { isOpen: openingHours.openNow, confidence: 'low' };
  }

  return { isOpen: true, confidence: 'low' };
}

/**
 * Parse Google time format (HHMM) to minutes from midnight
 */
function parseGoogleTime(time: string): number {
  const hours = parseInt(time.substring(0, 2));
  const minutes = parseInt(time.substring(2, 4));
  return hours * 60 + minutes;
}

/**
 * Convert 12-hour time to minutes from midnight
 */
function convertTo24Hour(hour: number, min: number, amPm?: string): number {
  let h = hour;
  if (amPm === 'PM' && hour !== 12) h += 12;
  if (amPm === 'AM' && hour === 12) h = 0;
  return h * 60 + min;
}

// ============================================================================
// Place Selection & Scoring
// ============================================================================

/**
 * Convert HiddenGemPlace to ItineraryPlace
 */
export function toItineraryPlace(place: HiddenGemPlace, photoUrl?: string): ItineraryPlace {
  return {
    placeId: place.placeId,
    name: place.name,
    coordinates: place.coordinates,
    rating: place.rating,
    reviewCount: place.reviewCount,
    category: getPrimaryCategory(place.types),
    types: place.types,
    priceLevel: place.priceLevel,
    photoUrl: photoUrl,
    openingHours: place.openingHours,
    hiddenGemScore: place.hiddenGemScore,
    description: place.editorialSummary,
    address: place.address,
  };
}

/**
 * Score places for slot appropriateness
 */
function scoreForSlot(
  place: ItineraryPlace,
  slot: TimeSlot,
  date: Date
): number {
  // Base appropriateness score for this category in this slot
  const categoryScore = CATEGORY_SLOT_APPROPRIATENESS[place.category]?.[slot] ?? 0.5;

  // Check opening hours
  const { isOpen, confidence } = isOpenDuringSlot(place.openingHours, slot, date);

  if (!isOpen) {
    return 0; // Can't visit if closed
  }

  // Adjust based on confidence
  const confidenceMultiplier = confidence === 'high' ? 1.0 : confidence === 'medium' ? 0.9 : 0.7;

  return categoryScore * confidenceMultiplier;
}

/**
 * Get place ID from a scored place
 */
function getPlaceId(scoredPlace: ScoredPlace<ScorablePlace>): string {
  const place = scoredPlace.place as HiddenGemPlace;
  return place.placeId || '';
}

/**
 * Select and rank places for a specific day and slot
 */
function selectPlacesForSlot(
  availablePlaces: ScoredPlace<ScorablePlace>[],
  slot: TimeSlot,
  date: Date,
  count: number,
  usedPlaceIds: Set<string>
): ScoredPlace<ScorablePlace>[] {
  // Filter out already used places and score for slot
  const slotScored = availablePlaces
    .filter((sp) => !usedPlaceIds.has(getPlaceId(sp)))
    .map((sp) => {
      const place = sp.place as HiddenGemPlace;
      const itineraryPlace: ItineraryPlace = {
        placeId: place.placeId || '',
        name: place.name,
        coordinates: place.coordinates,
        category: getPrimaryCategory(place.types),
        types: place.types,
        openingHours: place.openingHours,
        rating: place.rating,
        priceLevel: place.priceLevel,
        hiddenGemScore: place.hiddenGemScore,
      };
      const slotScore = scoreForSlot(itineraryPlace, slot, date);
      return {
        ...sp,
        slotScore,
        combinedSlotScore: sp.combinedScore * 0.6 + slotScore * 0.4,
      };
    })
    .filter((sp) => sp.slotScore > 0) // Must be open/appropriate
    .sort((a, b) => b.combinedSlotScore - a.combinedSlotScore);

  return slotScored.slice(0, count);
}

// ============================================================================
// Day Generation
// ============================================================================

/**
 * Distribute places across time slots for a single day
 */
function distributePlacesToDay(
  scoredPlaces: ScoredPlace<ScorablePlace>[],
  date: Date,
  pace: 'relaxed' | 'balanced' | 'packed',
  favouritedIds: Set<string>,
  usedPlaceIds: Set<string>,
  includeMeals: boolean
): { slots: ItineraryDay['slots'] } {
  const paceConfig = PACE_ACTIVITY_COUNTS[pace];
  const targetActivities = paceConfig.target;

  // Distribute activities across slots
  // Morning: ~30%, Afternoon: ~40%, Evening: ~30%
  const morningCount = Math.max(1, Math.round(targetActivities * 0.3));
  const afternoonCount = Math.max(1, Math.round(targetActivities * 0.4));
  const eveningCount = Math.max(1, targetActivities - morningCount - afternoonCount);

  const morningPlaces = selectPlacesForSlot(scoredPlaces, 'morning', date, morningCount, usedPlaceIds);
  morningPlaces.forEach((p) => usedPlaceIds.add(getPlaceId(p)));

  const afternoonPlaces = selectPlacesForSlot(scoredPlaces, 'afternoon', date, afternoonCount, usedPlaceIds);
  afternoonPlaces.forEach((p) => usedPlaceIds.add(getPlaceId(p)));

  const eveningPlaces = selectPlacesForSlot(scoredPlaces, 'evening', date, eveningCount, usedPlaceIds);
  eveningPlaces.forEach((p) => usedPlaceIds.add(getPlaceId(p)));

  // Convert to activities
  const createPlaceActivity = (
    sp: ScoredPlace<ScorablePlace>,
    slot: TimeSlot,
    order: number
  ): PlaceActivity => {
    const place = sp.place as HiddenGemPlace;
    const placeId = place.placeId || '';
    const category = getPrimaryCategory(place.types);

    return {
      type: 'place',
      id: generateId(),
      slot,
      orderInSlot: order,
      durationMinutes: CATEGORY_DURATION_ESTIMATES[category] || 60,
      place: {
        placeId,
        name: place.name,
        coordinates: place.coordinates,
        rating: place.rating,
        reviewCount: place.reviewCount,
        category,
        types: place.types,
        priceLevel: place.priceLevel,
        openingHours: place.openingHours,
        hiddenGemScore: place.hiddenGemScore,
        description: place.editorialSummary,
        address: place.address,
      },
      isFavourited: favouritedIds.has(placeId),
      isHiddenGem: place.isHiddenGem || (place.hiddenGemScore ?? 0) > 0.5,
      preferenceScore: sp.preferenceScore,
    };
  };

  // Build slot arrays
  const morning: ItineraryActivity[] = morningPlaces.map((p, i) =>
    createPlaceActivity(p, 'morning', i)
  );

  const afternoon: ItineraryActivity[] = afternoonPlaces.map((p, i) =>
    createPlaceActivity(p, 'afternoon', i)
  );

  const evening: ItineraryActivity[] = eveningPlaces.map((p, i) =>
    createPlaceActivity(p, 'evening', i)
  );

  // Optionally add meal suggestions
  if (includeMeals) {
    // Add lunch break between morning and afternoon if there are activities
    if (morning.length > 0 && afternoon.length > 0) {
      const lunchBreak: MealActivity = {
        type: 'meal',
        id: generateId(),
        slot: 'afternoon',
        orderInSlot: -1, // Before other afternoon activities
        durationMinutes: 60,
        mealType: 'lunch',
      };
      afternoon.unshift(lunchBreak);
      // Re-order
      afternoon.forEach((a, i) => (a.orderInSlot = i));
    }

    // Add dinner suggestion in evening
    if (evening.length > 0) {
      const dinnerBreak: MealActivity = {
        type: 'meal',
        id: generateId(),
        slot: 'evening',
        orderInSlot: 0,
        durationMinutes: 90,
        mealType: 'dinner',
      };
      evening.unshift(dinnerBreak);
      evening.forEach((a, i) => (a.orderInSlot = i));
    }
  }

  return {
    slots: { morning, afternoon, evening },
  };
}

/**
 * Create a travel day between cities
 */
function createTravelDay(
  dayNumber: number,
  date: Date,
  fromCity: ItineraryCity,
  toCity: ItineraryCity
): ItineraryDay {
  const distanceKm = calculateDistance(fromCity.coordinates, toCity.coordinates);
  const durationMinutes = estimateTravelTime(fromCity.coordinates, toCity.coordinates, 'driving');

  const travelActivity: TravelActivity = {
    type: 'travel',
    id: generateId(),
    slot: 'morning',
    orderInSlot: 0,
    durationMinutes,
    from: {
      name: fromCity.name,
      coordinates: fromCity.coordinates,
    },
    to: {
      name: toCity.name,
      coordinates: toCity.coordinates,
    },
    distanceKm,
    mode: 'driving',
    notes: `Drive from ${fromCity.name} to ${toCity.name}`,
  };

  // Add free time in afternoon after arriving
  const freeTime: FreeTimeActivity = {
    type: 'free_time',
    id: generateId(),
    slot: 'afternoon',
    orderInSlot: 0,
    durationMinutes: 180,
    suggestion: `Settle in and explore ${toCity.name} at your own pace`,
  };

  return {
    dayNumber,
    date,
    city: toCity, // Arriving city
    isTravelDay: true,
    slots: {
      morning: [travelActivity],
      afternoon: [freeTime],
      evening: [],
    },
    summary: `Travel day: ${fromCity.name} → ${toCity.name}`,
  };
}

// ============================================================================
// Main Generation Function
// ============================================================================

/**
 * Generate a complete trip itinerary
 *
 * @param input - Generation input with cities, dates, preferences
 * @param options - Optional configuration
 * @returns Complete itinerary
 */
export async function generateItinerary(
  input: ItineraryGenerationInput,
  options: ItineraryGenerationOptions = {}
): Promise<Itinerary> {
  const {
    tripId,
    startDate,
    endDate,
    cities,
    preferences,
    favouritedPlaceIds,
    cityPlaces,
    dayThemes,
  } = input;

  const {
    pace = preferences.pace.value,
    hiddenGemsRatio = 0.3,
    includeMeals = true,
    // includeFreeTime can be used in future for adding explicit free time blocks
  } = options;

  // Suppress unused variable warnings for future use
  void hiddenGemsRatio;

  // Calculate total days
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Build city objects with day allocation
  const itineraryCities: ItineraryCity[] = cities.map((city, index) => ({
    id: city.id,
    name: city.name,
    country: city.country,
    coordinates: city.coordinates,
    nights: city.nights,
    days: city.nights, // Simplified: days = nights for now
    order: index,
    isOrigin: city.isOrigin || index === 0,
    isDestination: city.isDestination || index === cities.length - 1,
  }));

  // Track used places across the entire trip
  const usedPlaceIds = new Set<string>();
  const favouritedSet = new Set(favouritedPlaceIds);

  // Generate days
  const days: ItineraryDay[] = [];
  let currentDate = new Date(startDate);
  let dayNumber = 1;
  let currentCityIndex = 0;

  // Summary tracking
  let totalActivities = 0;
  let hiddenGemsCount = 0;
  let favouritedCount = 0;
  let totalDrivingKm = 0;
  let totalDrivingMinutes = 0;
  const categoryCounts: Partial<Record<WaycraftCategory, number>> = {};

  while (dayNumber <= totalDays && currentCityIndex < itineraryCities.length) {
    const currentCity = itineraryCities[currentCityIndex];

    // Check if we need to travel to next city
    const daysSpentInCity = days.filter(
      (d) => d.city.id === currentCity.id && !d.isTravelDay
    ).length;

    if (daysSpentInCity >= currentCity.days && currentCityIndex < itineraryCities.length - 1) {
      // Travel day
      const nextCity = itineraryCities[currentCityIndex + 1];
      const travelDay = createTravelDay(dayNumber, currentDate, currentCity, nextCity);

      // Add travel stats
      const travelActivity = travelDay.slots.morning[0] as TravelActivity;
      if (travelActivity?.type === 'travel') {
        totalDrivingKm += travelActivity.distanceKm;
        totalDrivingMinutes += travelActivity.durationMinutes;
      }

      days.push(travelDay);
      currentCityIndex++;
      dayNumber++;
      currentDate = addDays(currentDate, 1);
      continue;
    }

    // Regular day in city - get places for this city
    let places: HiddenGemPlace[] = [];
    if (cityPlaces && cityPlaces.has(currentCity.id)) {
      places = cityPlaces.get(currentCity.id)!;
    }

    // Score places by preference
    const scoredPlaces = rankPlacesByPreference(places, preferences);

    // Prioritize favourited places
    const sortedPlaces = [...scoredPlaces].sort((a, b) => {
      const aFav = favouritedSet.has(getPlaceId(a)) ? 1 : 0;
      const bFav = favouritedSet.has(getPlaceId(b)) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return b.combinedScore - a.combinedScore;
    });

    // Distribute places to slots
    const { slots } = distributePlacesToDay(
      sortedPlaces,
      currentDate,
      pace,
      favouritedSet,
      usedPlaceIds,
      includeMeals
    );

    // Count activities for summary
    const dayActivities = [...slots.morning, ...slots.afternoon, ...slots.evening];
    dayActivities.forEach((activity) => {
      if (activity.type === 'place') {
        totalActivities++;
        if (activity.isHiddenGem) hiddenGemsCount++;
        if (activity.isFavourited) favouritedCount++;
        const cat = activity.place.category;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    });

    // Get day theme if provided
    const theme = dayThemes?.find((t) => t.day === dayNumber);

    // Create the day
    const day: ItineraryDay = {
      dayNumber,
      date: new Date(currentDate),
      city: currentCity,
      isTravelDay: false,
      slots,
      theme: theme?.theme,
      themeIcon: theme?.icon,
      summary: generateDaySummary(slots, currentCity.name),
    };

    days.push(day);
    dayNumber++;
    currentDate = addDays(currentDate, 1);
  }

  // Build summary
  const summary: ItinerarySummary = {
    totalDays: days.length,
    totalNights: cities.reduce((sum, c) => sum + c.nights, 0),
    cities: itineraryCities.map((c) => c.name),
    totalActivities,
    hiddenGemsCount,
    favouritedCount,
    totalDrivingDistanceKm: Math.round(totalDrivingKm),
    totalDrivingMinutes: Math.round(totalDrivingMinutes),
    categoryCounts,
  };

  // Build itinerary
  const itinerary: Itinerary = {
    id: `itin-${generateId()}`,
    tripId,
    generatedAt: new Date(),
    version: 1,
    days,
    summary,
    metadata: {
      pace,
      prioritizedHiddenGems: hiddenGemsRatio > 0,
      favouritedIncluded: favouritedCount,
      source: 'auto',
    },
  };

  return itinerary;
}

/**
 * Generate a summary for a day
 */
function generateDaySummary(slots: ItineraryDay['slots'], cityName: string): string {
  const placeActivities = [
    ...slots.morning,
    ...slots.afternoon,
    ...slots.evening,
  ].filter((a): a is PlaceActivity => a.type === 'place');

  if (placeActivities.length === 0) {
    return `Free day to explore ${cityName}`;
  }

  const categories = [...new Set(placeActivities.map((a) => a.place.category))];

  if (categories.length === 1) {
    const catName = categories[0].replace('_', ' ');
    return `${cityName}: ${catName} exploration`;
  }

  if (categories.includes('culture') && categories.includes('food_drink')) {
    return `${cityName}: Culture & cuisine`;
  }

  if (categories.includes('nature')) {
    return `${cityName}: Nature & discovery`;
  }

  return `${cityName}: Mixed exploration`;
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Calculate time allocations for a slot
 */
export function calculateSlotTiming(
  activities: ItineraryActivity[],
  slotStartTime: string
): ItineraryActivity[] {
  let currentTime = parseTimeToMinutes(slotStartTime);

  return activities.map((activity) => {
    const startTime = minutesToTime(currentTime);
    currentTime += activity.durationMinutes;
    const endTime = minutesToTime(currentTime);
    currentTime += 15; // 15 min buffer between activities

    return {
      ...activity,
      startTime,
      endTime,
    };
  });
}

/**
 * Get estimated duration for a category
 */
export function getEstimatedDuration(category: WaycraftCategory): number {
  return CATEGORY_DURATION_ESTIMATES[category] || 60;
}

/**
 * Check if a day is fully booked
 */
export function isDayFullyBooked(day: ItineraryDay, pace: 'relaxed' | 'balanced' | 'packed'): boolean {
  const paceConfig = PACE_ACTIVITY_COUNTS[pace];
  const totalActivities =
    day.slots.morning.filter((a) => a.type === 'place').length +
    day.slots.afternoon.filter((a) => a.type === 'place').length +
    day.slots.evening.filter((a) => a.type === 'place').length;

  return totalActivities >= paceConfig.max;
}
