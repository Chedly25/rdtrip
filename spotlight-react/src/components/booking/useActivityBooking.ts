/**
 * useActivityBooking Hook
 *
 * WI-10.3: Activity booking state management
 *
 * Manages:
 * - Dismissed activities tracking (localStorage)
 * - Activity booking eligibility
 * - Booking link generation
 */

import { useState, useCallback, useEffect } from 'react';
import type { BookingOptions, ActivityBookingContext } from '../../services/booking';
import { generateActivityOptions } from '../../services/booking';

// ============================================================================
// Types
// ============================================================================

export interface UseActivityBookingOptions {
  /** City name */
  cityName: string;
  /** Country */
  country?: string;
  /** Activity/place name */
  activityName?: string;
  /** Activity category */
  category?: string;
  /** Activity date */
  date?: Date;
  /** Number of participants */
  participants?: number;
  /** Unique key for dismissal tracking */
  dismissKey?: string;
}

export interface UseActivityBookingReturn {
  /** Generated booking options */
  options: BookingOptions | null;
  /** Whether booking has been dismissed for this activity */
  isDismissed: boolean;
  /** Dismiss the booking suggestion */
  dismiss: () => void;
  /** Reset dismissed state */
  resetDismissed: () => void;
  /** Whether this activity type is typically bookable */
  isBookable: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DISMISSED_ACTIVITIES_KEY = 'waycraft_dismissed_activities';
const DISMISSED_EXPIRY_DAYS = 7; // Dismissals expire after 7 days

/**
 * Activity categories that are typically bookable via GetYourGuide/Viator
 */
const BOOKABLE_CATEGORIES = [
  'museum',
  'gallery',
  'landmark',
  'monument',
  'attraction',
  'experience',
  'tour',
  'viewpoint',
  'castle',
  'palace',
  'church',
  'temple',
  'park', // Some parks have tours
  'wine',
  'food_tour',
  'cooking_class',
  'adventure',
  'water_activity',
];

// ============================================================================
// Storage Helpers
// ============================================================================

interface DismissedEntry {
  timestamp: number;
}

function getDismissedActivities(): Map<string, DismissedEntry> {
  try {
    const stored = localStorage.getItem(DISMISSED_ACTIVITIES_KEY);
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

function setDismissedActivities(entries: Map<string, DismissedEntry>): void {
  try {
    const obj: Record<string, DismissedEntry> = {};
    entries.forEach((value, key) => {
      obj[key] = value;
    });
    localStorage.setItem(DISMISSED_ACTIVITIES_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage errors
  }
}

function isActivityDismissed(key: string): boolean {
  const dismissed = getDismissedActivities();
  return dismissed.has(key);
}

function dismissActivity(key: string): void {
  const dismissed = getDismissedActivities();
  dismissed.set(key, { timestamp: Date.now() });
  setDismissedActivities(dismissed);
}

function undismissActivity(key: string): void {
  const dismissed = getDismissedActivities();
  dismissed.delete(key);
  setDismissedActivities(dismissed);
}

// ============================================================================
// Hook
// ============================================================================

export function useActivityBooking({
  cityName,
  country,
  activityName,
  category,
  date,
  participants = 2,
  dismissKey,
}: UseActivityBookingOptions): UseActivityBookingReturn {
  // Generate stable dismiss key
  const stableKey = dismissKey || `activity-${cityName}-${activityName || 'general'}`.toLowerCase().replace(/\s+/g, '-');

  // State
  const [isDismissed, setIsDismissed] = useState(() => isActivityDismissed(stableKey));

  // Check if bookable
  const isBookable = !category || BOOKABLE_CATEGORIES.some(
    (bc) => category.toLowerCase().includes(bc)
  );

  // Generate options
  const context: ActivityBookingContext = {
    cityName,
    country,
    activityName,
    category,
    date,
    participants,
  };

  const options = isBookable && !isDismissed ? generateActivityOptions(context) : null;

  // Sync dismissed state with localStorage
  useEffect(() => {
    setIsDismissed(isActivityDismissed(stableKey));
  }, [stableKey]);

  // Dismiss handler
  const dismiss = useCallback(() => {
    dismissActivity(stableKey);
    setIsDismissed(true);
  }, [stableKey]);

  // Reset handler
  const resetDismissed = useCallback(() => {
    undismissActivity(stableKey);
    setIsDismissed(false);
  }, [stableKey]);

  return {
    options,
    isDismissed,
    dismiss,
    resetDismissed,
    isBookable,
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

/**
 * Check if a category is typically bookable
 */
export function isCategoryBookable(category: string): boolean {
  return BOOKABLE_CATEGORIES.some(
    (bc) => category.toLowerCase().includes(bc)
  );
}

/**
 * Get all dismissed activities
 */
export function getAllDismissedActivities(): string[] {
  return Array.from(getDismissedActivities().keys());
}

/**
 * Clear all dismissed activities
 */
export function clearAllDismissedActivities(): void {
  localStorage.removeItem(DISMISSED_ACTIVITIES_KEY);
}

export default useActivityBooking;
