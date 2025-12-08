/**
 * useRestaurantBooking Hook
 *
 * WI-10.4: Restaurant booking state management
 *
 * Manages:
 * - Dismissed restaurants tracking (localStorage)
 * - Restaurant booking eligibility
 * - Booking link generation
 */

import { useState, useCallback, useEffect } from 'react';
import type { BookingOptions, RestaurantBookingContext } from '../../services/booking';
import { generateRestaurantOptions } from '../../services/booking';

// ============================================================================
// Types
// ============================================================================

export interface UseRestaurantBookingOptions {
  /** City name */
  cityName: string;
  /** Country */
  country?: string;
  /** Restaurant name */
  restaurantName: string;
  /** Reservation date */
  date?: Date;
  /** Reservation time */
  time?: string;
  /** Party size */
  partySize?: number;
  /** Meal type */
  mealType?: 'breakfast' | 'lunch' | 'dinner';
  /** Unique key for dismissal tracking */
  dismissKey?: string;
}

export interface UseRestaurantBookingReturn {
  /** Generated booking options */
  options: BookingOptions | null;
  /** Whether booking has been dismissed for this restaurant */
  isDismissed: boolean;
  /** Dismiss the booking suggestion */
  dismiss: () => void;
  /** Reset dismissed state */
  resetDismissed: () => void;
  /** Default time based on meal type */
  suggestedTime: string;
}

// ============================================================================
// Constants
// ============================================================================

const DISMISSED_RESTAURANTS_KEY = 'waycraft_dismissed_restaurants';
const DISMISSED_EXPIRY_DAYS = 7; // Dismissals expire after 7 days

// ============================================================================
// Storage Helpers
// ============================================================================

interface DismissedEntry {
  timestamp: number;
}

function getDismissedRestaurants(): Map<string, DismissedEntry> {
  try {
    const stored = localStorage.getItem(DISMISSED_RESTAURANTS_KEY);
    if (!stored) return new Map();

    const entries: Record<string, DismissedEntry> = JSON.parse(stored);
    const now = Date.now();
    const expiryMs = DISMISSED_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // Filter out expired entries
    const valid = new Map<string, DismissedEntry>();
    for (const [key, entry] of Object.entries(entries)) {
      if (now - entry.timestamp < expiryMs) {
        valid.set(key, entry);
      }
    }

    return valid;
  } catch {
    return new Map();
  }
}

function setDismissedRestaurants(entries: Map<string, DismissedEntry>): void {
  try {
    const obj: Record<string, DismissedEntry> = {};
    entries.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(DISMISSED_RESTAURANTS_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage errors
  }
}

function isRestaurantDismissed(key: string): boolean {
  const dismissed = getDismissedRestaurants();
  return dismissed.has(key);
}

function dismissRestaurant(key: string): void {
  const dismissed = getDismissedRestaurants();
  dismissed.set(key, { timestamp: Date.now() });
  setDismissedRestaurants(dismissed);
}

function undismissRestaurant(key: string): void {
  const dismissed = getDismissedRestaurants();
  dismissed.delete(key);
  setDismissedRestaurants(dismissed);
}

// ============================================================================
// Helpers
// ============================================================================

function getDefaultTimeForMeal(mealType?: 'breakfast' | 'lunch' | 'dinner'): string {
  switch (mealType) {
    case 'breakfast': return '09:00';
    case 'lunch': return '12:30';
    case 'dinner': return '19:30';
    default: return '19:00';
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useRestaurantBooking({
  cityName,
  country,
  restaurantName,
  date,
  time,
  partySize = 2,
  mealType,
  dismissKey,
}: UseRestaurantBookingOptions): UseRestaurantBookingReturn {
  // Generate stable dismiss key
  const stableKey = dismissKey || `restaurant-${cityName}-${restaurantName}`.toLowerCase().replace(/\s+/g, '-');

  // State
  const [isDismissed, setIsDismissed] = useState(() => isRestaurantDismissed(stableKey));

  // Suggested time based on meal type
  const suggestedTime = time || getDefaultTimeForMeal(mealType);

  // Generate options
  const context: RestaurantBookingContext = {
    cityName,
    country,
    restaurantName,
    date,
    time: suggestedTime,
    partySize,
  };

  const options = !isDismissed ? generateRestaurantOptions(context) : null;

  // Sync dismissed state with localStorage
  useEffect(() => {
    setIsDismissed(isRestaurantDismissed(stableKey));
  }, [stableKey]);

  // Dismiss handler
  const dismiss = useCallback(() => {
    dismissRestaurant(stableKey);
    setIsDismissed(true);
  }, [stableKey]);

  // Reset handler
  const resetDismissed = useCallback(() => {
    undismissRestaurant(stableKey);
    setIsDismissed(false);
  }, [stableKey]);

  return {
    options,
    isDismissed,
    dismiss,
    resetDismissed,
    suggestedTime,
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Check if a place type is a restaurant/dining type
 */
export function isDiningPlaceType(type: string): boolean {
  const diningTypes = ['restaurant', 'cafe', 'bar', 'food', 'bakery', 'meal_takeaway'];
  return diningTypes.some(dt => type.toLowerCase().includes(dt));
}

/**
 * Get all dismissed restaurants
 */
export function getAllDismissedRestaurants(): string[] {
  return Array.from(getDismissedRestaurants().keys());
}

/**
 * Clear all dismissed restaurants
 */
export function clearAllDismissedRestaurants(): void {
  localStorage.removeItem(DISMISSED_RESTAURANTS_KEY);
}

export default useRestaurantBooking;
