/**
 * Booking Proactive Triggers
 *
 * WI-10.2: Intelligent booking-related notifications
 *
 * Generates proactive messages when booking suggestions are timely:
 * - Arriving in new city - suggest accommodation
 * - First day in city - remind about hotels
 *
 * Design Philosophy:
 * - HELPFUL, NOT PUSHY - like a friend reminding you
 * - TIMELY - suggest at the right moment
 * - DISMISSIBLE - respect user choice to skip
 * - RATE-LIMITED - avoid spam
 */

import type { ProactiveMessage, ProactiveTrigger, ActiveCompanionContext } from './types';
import type { EnrichedActivity } from '../types';
import { generateHotelLink } from '../../booking';

// ============================================================================
// Types
// ============================================================================

export interface BookingTriggerConfig {
  /** Cooldown between booking suggestions (seconds) */
  cooldownSeconds: number;
  /** Hour of day to suggest next city's hotel (24h format) */
  eveningSuggestionHour: number;
  /** How many days ahead to look for unbooked cities */
  lookaheadDays: number;
}

export const DEFAULT_BOOKING_TRIGGER_CONFIG: BookingTriggerConfig = {
  cooldownSeconds: 4 * 60 * 60, // 4 hours
  eveningSuggestionHour: 19, // 7 PM
  lookaheadDays: 3,
};

// ============================================================================
// Storage for dismissed/booked tracking
// ============================================================================

const BOOKED_CITIES_KEY = 'waycraft_booked_cities';
const SUGGESTION_TIMES_KEY = 'waycraft_booking_suggestions';

function getBookedCities(): Set<string> {
  try {
    const stored = localStorage.getItem(BOOKED_CITIES_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

function markCityAsBooked(cityId: string): void {
  const booked = getBookedCities();
  booked.add(cityId);
  localStorage.setItem(BOOKED_CITIES_KEY, JSON.stringify([...booked]));
}

function getLastSuggestionTime(cityId: string): number | null {
  try {
    const stored = localStorage.getItem(SUGGESTION_TIMES_KEY);
    if (!stored) return null;
    const times: Record<string, number> = JSON.parse(stored);
    return times[cityId] || null;
  } catch {
    return null;
  }
}

function recordSuggestionTime(cityId: string): void {
  try {
    const stored = localStorage.getItem(SUGGESTION_TIMES_KEY);
    const times: Record<string, number> = stored ? JSON.parse(stored) : {};
    times[cityId] = Date.now();
    localStorage.setItem(SUGGESTION_TIMES_KEY, JSON.stringify(times));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `booking-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Check if a city needs hotel booking suggestion
 */
function cityNeedsSuggestion(
  cityId: string,
  cooldownSeconds: number
): boolean {
  // Already marked as booked
  if (getBookedCities().has(cityId)) return false;

  // Check cooldown
  const lastSuggestion = getLastSuggestionTime(cityId);
  if (lastSuggestion) {
    const elapsed = (Date.now() - lastSuggestion) / 1000;
    if (elapsed < cooldownSeconds) return false;
  }

  return true;
}

// ============================================================================
// Hotel Booking Trigger - New City Arrival
// ============================================================================

/**
 * Trigger when arriving in a new city (day 1)
 * Suggests booking accommodation
 */
export function createNewCityHotelTrigger(
  config: BookingTriggerConfig = DEFAULT_BOOKING_TRIGGER_CONFIG
): ProactiveTrigger {
  return {
    type: 'recommendation',
    priority: 'low', // Non-urgent
    cooldownSeconds: config.cooldownSeconds,

    condition: (context: ActiveCompanionContext, _recommendations: EnrichedActivity[]) => {
      // Must have current city info
      if (!context.currentCity) return false;

      // Create a city ID from the name
      const cityId = context.currentCity.toLowerCase().replace(/\s+/g, '-');

      // Check if we should suggest for this city
      if (!cityNeedsSuggestion(cityId, config.cooldownSeconds)) return false;

      // Only suggest on first day in this city
      return context.dayNumber === 1;
    },

    generateMessage: (
      context: ActiveCompanionContext,
      _recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      const cityName = context.currentCity!;
      const cityId = cityName.toLowerCase().replace(/\s+/g, '-');

      // Record that we suggested for this city
      recordSuggestionTime(cityId);

      // Generate booking link
      const bookingLink = generateHotelLink({
        cityName: cityName,
        adults: 2,
        rooms: 1,
      });

      return {
        type: 'recommendation',
        message: `Need a place to stay in ${cityName}?`,
        detail: 'Find great deals on hotels nearby',
        priority: 'low',
        action: {
          label: 'Find hotels',
          type: 'view',
          payload: bookingLink.url,
        },
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
      };
    },
  };
}

// ============================================================================
// Hotel Booking Trigger - Evening Reminder
// ============================================================================

/**
 * Trigger in the evening to remind about hotel booking
 * Only if they haven't already booked
 */
export function createEveningHotelReminderTrigger(
  config: BookingTriggerConfig = DEFAULT_BOOKING_TRIGGER_CONFIG
): ProactiveTrigger {
  return {
    type: 'recommendation',
    priority: 'low',
    cooldownSeconds: config.cooldownSeconds,

    condition: (context: ActiveCompanionContext, _recommendations: EnrichedActivity[]) => {
      // Must have current city
      if (!context.currentCity) return false;

      // Check if it's evening time
      if (context.currentHour < config.eveningSuggestionHour || context.currentHour > 22) {
        return false;
      }

      // Create a city ID from the name
      const cityId = context.currentCity.toLowerCase().replace(/\s+/g, '-');

      // Check if we should suggest for this city
      return cityNeedsSuggestion(cityId, config.cooldownSeconds);
    },

    generateMessage: (
      context: ActiveCompanionContext,
      _recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      const cityName = context.currentCity!;
      const cityId = cityName.toLowerCase().replace(/\s+/g, '-');

      // Record suggestion
      recordSuggestionTime(cityId);

      // Generate booking link
      const bookingLink = generateHotelLink({
        cityName: cityName,
        adults: 2,
        rooms: 1,
      });

      return {
        type: 'recommendation',
        message: `Sorted accommodation for tonight?`,
        detail: `Browse hotels in ${cityName}`,
        priority: 'low',
        action: {
          label: 'Find hotels',
          type: 'view',
          payload: bookingLink.url,
        },
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      };
    },
  };
}

// ============================================================================
// All Booking Triggers
// ============================================================================

/**
 * Get all booking triggers with default config
 */
export function getAllBookingTriggers(
  config: BookingTriggerConfig = DEFAULT_BOOKING_TRIGGER_CONFIG
): ProactiveTrigger[] {
  return [
    createNewCityHotelTrigger(config),
    createEveningHotelReminderTrigger(config),
  ];
}

/**
 * Check all booking triggers and return any that should fire
 */
export function checkBookingTriggers(
  context: ActiveCompanionContext,
  recommendations: EnrichedActivity[],
  triggers: ProactiveTrigger[] = getAllBookingTriggers()
): ProactiveMessage[] {
  const messages: ProactiveMessage[] = [];

  for (const trigger of triggers) {
    if (trigger.condition(context, recommendations)) {
      const messageData = trigger.generateMessage(context, recommendations);
      messages.push({
        ...messageData,
        id: generateId(),
        createdAt: new Date(),
        isDismissed: false,
      });
    }
  }

  return messages;
}

/**
 * Mark a city as having accommodation booked
 * (Called when user clicks "Already booked" or similar)
 */
export function markCityAccommodationBooked(cityId: string): void {
  markCityAsBooked(cityId);
}

/**
 * Check if city has accommodation marked as booked
 */
export function isCityAccommodationBooked(cityId: string): boolean {
  return getBookedCities().has(cityId);
}
