/**
 * Daily Schedule Generator
 *
 * WI-5.3: Creates realistic day schedules within a city
 *
 * Features:
 * - Precise timing for each activity (not just slots)
 * - Travel time between places within the city
 * - Natural meal breaks at appropriate times
 * - Buffer time between activities
 * - Place ordering to minimize travel
 * - Opening hours awareness
 *
 * Slot Definitions (per spec):
 * - Morning: 9am - 12pm
 * - Afternoon: 12pm - 6pm (includes lunch)
 * - Evening: 6pm - 10pm (includes dinner)
 */

import type { Coordinates } from '../hiddenGems';
import type { TripPace } from '../preferences';
import { calculateDistance } from './generator';
import {
  type ItineraryPlace,
  type ItineraryActivity,
  type PlaceActivity,
  type MealActivity,
  type TimeSlot,
  CATEGORY_DURATION_ESTIMATES,
} from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Updated time slot configuration per WI-5.3 spec
 */
export interface DaySlotConfig {
  slot: TimeSlot;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  /** Whether this slot typically includes a meal */
  includesMeal: boolean;
  /** The meal type for this slot */
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  /** Ideal time for the meal in this slot */
  idealMealTime?: string;
}

/**
 * Day schedule configuration
 */
export const DAY_SLOTS: Record<TimeSlot, DaySlotConfig> = {
  morning: {
    slot: 'morning',
    startTime: '09:00',
    endTime: '12:00',
    durationMinutes: 180,
    includesMeal: false, // Breakfast assumed before morning slot
  },
  afternoon: {
    slot: 'afternoon',
    startTime: '12:00',
    endTime: '18:00',
    durationMinutes: 360,
    includesMeal: true,
    mealType: 'lunch',
    idealMealTime: '12:30', // Lunch at 12:30
  },
  evening: {
    slot: 'evening',
    startTime: '18:00',
    endTime: '22:00',
    durationMinutes: 240,
    includesMeal: true,
    mealType: 'dinner',
    idealMealTime: '19:30', // Dinner at 7:30pm
  },
};

/**
 * Scheduled activity with precise timing
 */
export interface ScheduledActivity {
  activity: ItineraryActivity;
  /** Precise start time (HH:MM format) */
  startTime: string;
  /** Precise end time (HH:MM format) */
  endTime: string;
  /** Travel time to get here from previous activity (minutes) */
  travelTimeFromPrevious: number;
  /** Distance from previous activity (km) */
  distanceFromPrevious: number;
  /** Notes about timing */
  timingNotes?: string;
}

/**
 * Complete daily schedule
 */
export interface DailySchedule {
  /** The date for this schedule */
  date: Date;
  /** City name */
  cityName: string;
  /** All scheduled activities in chronological order */
  activities: ScheduledActivity[];
  /** Summary */
  summary: {
    /** First activity start time */
    dayStart: string;
    /** Last activity end time */
    dayEnd: string;
    /** Total active hours */
    totalActiveHours: number;
    /** Total travel time within city (minutes) */
    totalTravelMinutes: number;
    /** Total free/buffer time (minutes) */
    totalBufferMinutes: number;
    /** Number of place visits */
    placeCount: number;
    /** Meals included */
    mealsIncluded: ('lunch' | 'dinner')[];
  };
}

/**
 * Input for daily schedule generation
 */
export interface DailyScheduleInput {
  /** Date for the schedule */
  date: Date;
  /** City name */
  cityName: string;
  /** Places to visit (will be ordered optimally) */
  places: ItineraryPlace[];
  /** User's pace preference */
  pace: TripPace;
  /** Starting location (hotel/accommodation) */
  startLocation?: Coordinates;
  /** Whether to include lunch break */
  includeLunch?: boolean;
  /** Whether to include dinner break */
  includeDinner?: boolean;
  /** Favourited place IDs (for prioritization) */
  favouritedIds?: Set<string>;
  /** Custom start time (default: 09:00) */
  customStartTime?: string;
  /** Custom end time (default: 22:00) */
  customEndTime?: string;
}

/**
 * Schedule generation options
 */
export interface ScheduleOptions {
  /** Buffer time between activities in minutes (default: 15) */
  bufferMinutes?: number;
  /** Walking speed for intra-city travel in km/h (default: 4) */
  walkingSpeedKmh?: number;
  /** Meal duration in minutes (default: 60) */
  mealDurationMinutes?: number;
  /** Maximum activities for the day (overrides pace) */
  maxActivities?: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Default buffer between activities */
const DEFAULT_BUFFER_MINUTES = 15;

/** Default walking speed for urban areas */
const DEFAULT_WALKING_SPEED_KMH = 4;

/** Default meal duration */
const DEFAULT_MEAL_DURATION = 60;

/** Pace-based activity targets */
const PACE_TARGETS: Record<TripPace, { min: number; max: number; ideal: number }> = {
  relaxed: { min: 2, max: 3, ideal: 2 },
  balanced: { min: 3, max: 5, ideal: 4 },
  packed: { min: 5, max: 7, ideal: 5 },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse time string to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculate walking time between two points
 */
function calculateWalkingTime(
  from: Coordinates,
  to: Coordinates,
  speedKmh: number = DEFAULT_WALKING_SPEED_KMH
): { minutes: number; distanceKm: number } {
  const distanceKm = calculateDistance(from, to);
  // Add 20% for non-direct routes in urban areas
  const adjustedDistance = distanceKm * 1.2;
  const minutes = Math.round((adjustedDistance / speedKmh) * 60);
  return { minutes, distanceKm: adjustedDistance };
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Place Ordering (Minimize Travel)
// ============================================================================

/**
 * Order places to minimize total travel distance using nearest neighbor heuristic
 * This is a simple greedy algorithm - not optimal but fast and good enough
 */
export function optimizePlaceOrder(
  places: ItineraryPlace[],
  startLocation?: Coordinates
): ItineraryPlace[] {
  if (places.length <= 1) return places;

  const ordered: ItineraryPlace[] = [];
  const remaining = [...places];

  // Start from the given location or the first place
  let currentLocation = startLocation || places[0].coordinates;

  while (remaining.length > 0) {
    // Find nearest unvisited place
    let nearestIdx = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const distance = calculateDistance(currentLocation, remaining[i].coordinates);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIdx = i;
      }
    }

    // Add nearest place to ordered list
    const nearest = remaining.splice(nearestIdx, 1)[0];
    ordered.push(nearest);
    currentLocation = nearest.coordinates;
  }

  return ordered;
}

/**
 * Group places by time-appropriateness
 */
function groupPlacesByTimePreference(
  places: ItineraryPlace[]
): { morning: ItineraryPlace[]; afternoon: ItineraryPlace[]; evening: ItineraryPlace[] } {
  const morning: ItineraryPlace[] = [];
  const afternoon: ItineraryPlace[] = [];
  const evening: ItineraryPlace[] = [];

  for (const place of places) {
    const category = place.category;

    // Nightlife and bars are evening only
    if (category === 'nightlife') {
      evening.push(place);
      continue;
    }

    // Culture/museums better in morning
    if (category === 'culture') {
      morning.push(place);
      continue;
    }

    // Nature best in morning/afternoon
    if (category === 'nature') {
      if (morning.length <= afternoon.length) {
        morning.push(place);
      } else {
        afternoon.push(place);
      }
      continue;
    }

    // Food/restaurants can go anywhere, but dinner is common
    if (category === 'food_drink') {
      if (evening.length < 2) {
        evening.push(place);
      } else if (afternoon.length <= morning.length) {
        afternoon.push(place);
      } else {
        morning.push(place);
      }
      continue;
    }

    // Shopping typically afternoon
    if (category === 'shopping') {
      afternoon.push(place);
      continue;
    }

    // Default: distribute evenly
    const counts = [morning.length, afternoon.length, evening.length];
    const minCount = Math.min(...counts);
    if (morning.length === minCount) {
      morning.push(place);
    } else if (afternoon.length === minCount) {
      afternoon.push(place);
    } else {
      evening.push(place);
    }
  }

  return { morning, afternoon, evening };
}

// ============================================================================
// Meal Break Creation
// ============================================================================

/**
 * Create a meal activity
 */
function createMealActivity(
  mealType: 'lunch' | 'dinner',
  slot: TimeSlot,
  duration: number,
  suggestedRestaurant?: ItineraryPlace
): MealActivity {
  return {
    type: 'meal',
    id: generateId(),
    slot,
    orderInSlot: 0, // Will be set later
    durationMinutes: duration,
    mealType,
    suggestedPlace: suggestedRestaurant,
  };
}

// ============================================================================
// Main Schedule Generator
// ============================================================================

/**
 * Generate a detailed daily schedule
 *
 * @param input - Schedule input parameters
 * @param options - Optional configuration
 * @returns Complete daily schedule with precise timing
 */
export function generateDailySchedule(
  input: DailyScheduleInput,
  options: ScheduleOptions = {}
): DailySchedule {
  const {
    date,
    cityName,
    places,
    pace,
    startLocation,
    includeLunch = true,
    includeDinner = true,
    favouritedIds = new Set(),
    customStartTime,
    customEndTime,
  } = input;

  const {
    bufferMinutes = DEFAULT_BUFFER_MINUTES,
    walkingSpeedKmh = DEFAULT_WALKING_SPEED_KMH,
    mealDurationMinutes = DEFAULT_MEAL_DURATION,
    maxActivities,
  } = options;

  // Determine activity count based on pace
  const paceTarget = PACE_TARGETS[pace];
  const targetActivities = maxActivities || paceTarget.ideal;

  // Limit places to target count, prioritizing favourites
  let selectedPlaces = [...places];
  if (selectedPlaces.length > targetActivities) {
    // Sort by favourite status, then keep top N
    selectedPlaces.sort((a, b) => {
      const aFav = favouritedIds.has(a.placeId) ? 1 : 0;
      const bFav = favouritedIds.has(b.placeId) ? 1 : 0;
      return bFav - aFav;
    });
    selectedPlaces = selectedPlaces.slice(0, targetActivities);
  }

  // Group places by time preference
  const grouped = groupPlacesByTimePreference(selectedPlaces);

  // Optimize order within each group
  const morningPlaces = optimizePlaceOrder(grouped.morning, startLocation);
  const afternoonPlaces = optimizePlaceOrder(
    grouped.afternoon,
    morningPlaces.length > 0
      ? morningPlaces[morningPlaces.length - 1].coordinates
      : startLocation
  );
  const eveningPlaces = optimizePlaceOrder(
    grouped.evening,
    afternoonPlaces.length > 0
      ? afternoonPlaces[afternoonPlaces.length - 1].coordinates
      : morningPlaces.length > 0
        ? morningPlaces[morningPlaces.length - 1].coordinates
        : startLocation
  );

  // Schedule activities with precise timing
  const scheduledActivities: ScheduledActivity[] = [];
  let currentTime = timeToMinutes(customStartTime || DAY_SLOTS.morning.startTime);
  let previousLocation = startLocation;
  let totalTravelMinutes = 0;
  let totalBufferMinutes = 0;
  const mealsIncluded: ('lunch' | 'dinner')[] = [];

  // Helper to add a place activity
  const addPlaceActivity = (
    place: ItineraryPlace,
    slot: TimeSlot
  ): void => {
    // Calculate travel time from previous
    let travelTime = 0;
    let travelDistance = 0;
    if (previousLocation) {
      const travel = calculateWalkingTime(previousLocation, place.coordinates, walkingSpeedKmh);
      travelTime = travel.minutes;
      travelDistance = travel.distanceKm;
      totalTravelMinutes += travelTime;
    }

    // Add travel time to current time
    currentTime += travelTime;

    const duration = CATEGORY_DURATION_ESTIMATES[place.category] || 60;
    const startTime = minutesToTime(currentTime);
    currentTime += duration;
    const endTime = minutesToTime(currentTime);

    const activity: PlaceActivity = {
      type: 'place',
      id: generateId(),
      slot,
      orderInSlot: scheduledActivities.filter((a) => a.activity.slot === slot).length,
      durationMinutes: duration,
      startTime,
      endTime,
      place,
      isFavourited: favouritedIds.has(place.placeId),
      isHiddenGem: (place.hiddenGemScore ?? 0) > 0.5,
    };

    scheduledActivities.push({
      activity,
      startTime,
      endTime,
      travelTimeFromPrevious: travelTime,
      distanceFromPrevious: travelDistance,
    });

    // Add buffer after activity
    currentTime += bufferMinutes;
    totalBufferMinutes += bufferMinutes;
    previousLocation = place.coordinates;
  };

  // Helper to add a meal
  const addMeal = (mealType: 'lunch' | 'dinner', slot: TimeSlot): void => {
    const slotConfig = DAY_SLOTS[slot];
    const idealTime = slotConfig.idealMealTime
      ? timeToMinutes(slotConfig.idealMealTime)
      : currentTime;

    // Try to schedule at ideal time, but don't go backward
    const mealStart = Math.max(currentTime, idealTime);
    currentTime = mealStart;

    const startTime = minutesToTime(currentTime);
    currentTime += mealDurationMinutes;
    const endTime = minutesToTime(currentTime);

    const activity = createMealActivity(mealType, slot, mealDurationMinutes);
    activity.startTime = startTime;
    activity.endTime = endTime;

    scheduledActivities.push({
      activity,
      startTime,
      endTime,
      travelTimeFromPrevious: 0,
      distanceFromPrevious: 0,
      timingNotes: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} break`,
    });

    mealsIncluded.push(mealType);
    currentTime += bufferMinutes;
    totalBufferMinutes += bufferMinutes;
  };

  // Schedule morning activities
  for (const place of morningPlaces) {
    const slotEnd = timeToMinutes(DAY_SLOTS.morning.endTime);
    if (currentTime >= slotEnd) break;
    addPlaceActivity(place, 'morning');
  }

  // Lunch (if afternoon slot and lunch included)
  if (includeLunch && (afternoonPlaces.length > 0 || eveningPlaces.length > 0)) {
    // Ensure we're in afternoon slot
    const afternoonStart = timeToMinutes(DAY_SLOTS.afternoon.startTime);
    if (currentTime < afternoonStart) {
      currentTime = afternoonStart;
    }
    addMeal('lunch', 'afternoon');
  }

  // Schedule afternoon activities
  for (const place of afternoonPlaces) {
    const slotEnd = timeToMinutes(DAY_SLOTS.afternoon.endTime);
    if (currentTime >= slotEnd) break;
    addPlaceActivity(place, 'afternoon');
  }

  // Dinner (if evening slot and dinner included)
  if (includeDinner && eveningPlaces.length > 0) {
    // Ensure we're in evening slot
    const eveningStart = timeToMinutes(DAY_SLOTS.evening.startTime);
    if (currentTime < eveningStart) {
      currentTime = eveningStart;
    }
    addMeal('dinner', 'evening');
  }

  // Schedule evening activities
  const dayEnd = timeToMinutes(customEndTime || DAY_SLOTS.evening.endTime);
  for (const place of eveningPlaces) {
    if (currentTime >= dayEnd) break;
    addPlaceActivity(place, 'evening');
  }

  // Calculate summary
  const dayStartTime = scheduledActivities.length > 0
    ? scheduledActivities[0].startTime
    : customStartTime || '09:00';
  const dayEndTime = scheduledActivities.length > 0
    ? scheduledActivities[scheduledActivities.length - 1].endTime
    : customEndTime || '22:00';

  const totalMinutes = timeToMinutes(dayEndTime) - timeToMinutes(dayStartTime);
  const totalActiveHours = Math.round((totalMinutes / 60) * 10) / 10;

  const placeCount = scheduledActivities.filter(
    (a) => a.activity.type === 'place'
  ).length;

  return {
    date,
    cityName,
    activities: scheduledActivities,
    summary: {
      dayStart: dayStartTime,
      dayEnd: dayEndTime,
      totalActiveHours,
      totalTravelMinutes,
      totalBufferMinutes,
      placeCount,
      mealsIncluded,
    },
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Format a scheduled activity for display
 */
export function formatScheduledActivity(scheduled: ScheduledActivity): string {
  const { activity, startTime, endTime, travelTimeFromPrevious } = scheduled;

  let travelNote = '';
  if (travelTimeFromPrevious > 0) {
    travelNote = ` (${travelTimeFromPrevious}min walk)`;
  }

  switch (activity.type) {
    case 'place':
      return `${startTime}-${endTime}: ${activity.place.name}${travelNote}`;
    case 'meal':
      return `${startTime}-${endTime}: ${activity.mealType.charAt(0).toUpperCase() + activity.mealType.slice(1)} break`;
    case 'free_time':
      return `${startTime}-${endTime}: Free time${activity.suggestion ? ` - ${activity.suggestion}` : ''}`;
    default:
      return `${startTime}-${endTime}: Activity`;
  }
}

/**
 * Format entire daily schedule for display
 */
export function formatDailySchedule(schedule: DailySchedule): string {
  const lines = [
    `📅 ${schedule.cityName} - ${schedule.date.toLocaleDateString()}`,
    `⏰ ${schedule.summary.dayStart} - ${schedule.summary.dayEnd} (${schedule.summary.totalActiveHours}h)`,
    '',
    ...schedule.activities.map((a) => `  ${formatScheduledActivity(a)}`),
    '',
    `📊 ${schedule.summary.placeCount} places | ${schedule.summary.totalTravelMinutes}min walking`,
  ];
  return lines.join('\n');
}

/**
 * Check if a schedule has conflicts or issues
 */
export function validateSchedule(schedule: DailySchedule): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for overlapping activities
  for (let i = 0; i < schedule.activities.length - 1; i++) {
    const current = schedule.activities[i];
    const next = schedule.activities[i + 1];

    const currentEnd = timeToMinutes(current.endTime);
    const nextStart = timeToMinutes(next.startTime);

    if (currentEnd > nextStart) {
      issues.push(
        `Overlap: ${current.activity.type} ends at ${current.endTime} but next starts at ${next.startTime}`
      );
    }
  }

  // Check for too-early or too-late activities
  const firstStart = schedule.activities[0]?.startTime;
  const lastEnd = schedule.activities[schedule.activities.length - 1]?.endTime;

  if (firstStart && timeToMinutes(firstStart) < timeToMinutes('07:00')) {
    issues.push(`Day starts very early: ${firstStart}`);
  }

  if (lastEnd && timeToMinutes(lastEnd) > timeToMinutes('23:00')) {
    issues.push(`Day ends very late: ${lastEnd}`);
  }

  // Check for unreasonably long gaps
  for (let i = 0; i < schedule.activities.length - 1; i++) {
    const current = schedule.activities[i];
    const next = schedule.activities[i + 1];

    const gap = timeToMinutes(next.startTime) - timeToMinutes(current.endTime);
    if (gap > 120) {
      issues.push(`Large gap (${gap}min) between ${current.endTime} and ${next.startTime}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Get activity count recommendation based on pace
 */
export function getActivityCountForPace(pace: TripPace): {
  min: number;
  max: number;
  ideal: number;
} {
  return PACE_TARGETS[pace];
}
