/**
 * useHotelBooking Hook
 *
 * WI-10.2: Hotel booking state management
 *
 * Features:
 * - Manages booking context from trip/city data
 * - Tracks dismissals per city (localStorage)
 * - Provides booking link generation
 * - Handles click tracking
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  BookingLink,
  BookingOptions,
  HotelBookingContext,
  BookingClickSource,
} from '../../services/booking';
import {
  generateHotelOptions,
  trackBookingClick,
  getDefaultCheckout,
} from '../../services/booking';

// ============================================================================
// Types
// ============================================================================

export interface UseHotelBookingOptions {
  /** City name */
  cityName: string;
  /** Country */
  country?: string;
  /** City ID for tracking */
  cityId?: string;
  /** Trip ID for tracking */
  tripId?: string;
  /** Check-in date */
  checkIn?: Date;
  /** Check-out date */
  checkOut?: Date;
  /** Number of nights (overrides date calculation) */
  nights?: number;
  /** Number of guests */
  guests?: number;
  /** Source context type */
  sourceType?: 'city_preview' | 'itinerary' | 'companion';
  /** Day number (for itinerary context) */
  dayNumber?: number;
  /** Whether booking is enabled */
  enabled?: boolean;
}

export interface UseHotelBookingReturn {
  /** Whether booking UI should be shown */
  shouldShow: boolean;
  /** Booking options with links */
  options: BookingOptions | null;
  /** Handle clicking a booking link */
  handleBookingClick: (link: BookingLink) => void;
  /** Dismiss the booking card for this city */
  dismiss: () => void;
  /** Check if dismissed */
  isDismissed: boolean;
  /** Booking context */
  context: HotelBookingContext;
  /** Date range string */
  dateRange: string;
  /** Number of nights */
  nights: number;
}

// ============================================================================
// Storage
// ============================================================================

const DISMISSED_KEY = 'waycraft_dismissed_hotel_bookings';
const DISMISSED_EXPIRY_HOURS = 24; // Re-show after 24 hours

interface DismissedEntry {
  cityId: string;
  dismissedAt: number;
}

function getDismissedCities(): DismissedEntry[] {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (!stored) return [];
    const entries: DismissedEntry[] = JSON.parse(stored);
    // Filter out expired entries
    const now = Date.now();
    const validEntries = entries.filter(
      (e) => now - e.dismissedAt < DISMISSED_EXPIRY_HOURS * 60 * 60 * 1000
    );
    // Update storage if we filtered anything
    if (validEntries.length !== entries.length) {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(validEntries));
    }
    return validEntries;
  } catch {
    return [];
  }
}

function dismissCity(cityId: string): void {
  try {
    const entries = getDismissedCities();
    const filtered = entries.filter((e) => e.cityId !== cityId);
    filtered.push({ cityId, dismissedAt: Date.now() });
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore storage errors
  }
}

function isCityDismissed(cityId: string): boolean {
  const entries = getDismissedCities();
  return entries.some((e) => e.cityId === cityId);
}

// ============================================================================
// Hook
// ============================================================================

export function useHotelBooking({
  cityName,
  country,
  cityId,
  tripId,
  checkIn,
  checkOut,
  nights: explicitNights,
  guests = 2,
  sourceType = 'city_preview',
  dayNumber,
  enabled = true,
}: UseHotelBookingOptions): UseHotelBookingReturn {
  // Track dismissal state
  const [isDismissed, setIsDismissed] = useState(() =>
    cityId ? isCityDismissed(cityId) : false
  );

  // Calculate dates and nights
  const effectiveCheckOut = checkOut || (checkIn ? getDefaultCheckout(checkIn) : undefined);
  const nights = useMemo(() => {
    if (explicitNights) return explicitNights;
    if (checkIn && effectiveCheckOut) {
      const diff = effectiveCheckOut.getTime() - checkIn.getTime();
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return 1;
  }, [explicitNights, checkIn, effectiveCheckOut]);

  // Build booking context
  const context: HotelBookingContext = useMemo(
    () => ({
      cityName,
      country,
      checkIn,
      checkOut: effectiveCheckOut,
      adults: guests,
      rooms: 1,
    }),
    [cityName, country, checkIn, effectiveCheckOut, guests]
  );

  // Generate booking options
  const options = useMemo(() => {
    if (!enabled) return null;
    return generateHotelOptions(context);
  }, [context, enabled]);

  // Format date range for display
  const dateRange = useMemo(() => {
    if (!checkIn) return '';
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const checkInStr = checkIn.toLocaleDateString('en-US', opts);
    if (!effectiveCheckOut) return checkInStr;
    const checkOutStr = effectiveCheckOut.toLocaleDateString('en-US', opts);
    return `${checkInStr} – ${checkOutStr}`;
  }, [checkIn, effectiveCheckOut]);

  // Build click source
  const clickSource: BookingClickSource = useMemo(
    () => ({
      page: sourceType,
      tripId,
      cityId,
      dayNumber,
    }),
    [sourceType, tripId, cityId, dayNumber]
  );

  // Handle booking click
  const handleBookingClick = useCallback(
    (link: BookingLink) => {
      trackBookingClick(link, clickSource);
      window.open(link.url, '_blank', 'noopener,noreferrer');
    },
    [clickSource]
  );

  // Handle dismiss
  const dismiss = useCallback(() => {
    if (cityId) {
      dismissCity(cityId);
    }
    setIsDismissed(true);
  }, [cityId]);

  // Reset dismissal if city changes
  useEffect(() => {
    if (cityId) {
      setIsDismissed(isCityDismissed(cityId));
    }
  }, [cityId]);

  // Determine if we should show
  const shouldShow = enabled && !isDismissed && options?.primary !== null;

  return {
    shouldShow,
    options,
    handleBookingClick,
    dismiss,
    isDismissed,
    context,
    dateRange,
    nights,
  };
}

export default useHotelBooking;
