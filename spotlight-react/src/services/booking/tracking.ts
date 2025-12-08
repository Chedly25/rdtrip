/**
 * Booking Click Tracking
 *
 * WI-10.1: Track booking link clicks for attribution and analytics
 *
 * Design Philosophy:
 * - NON-BLOCKING - Tracking never delays the user's action
 * - PERSISTENT - Track events even if analytics fails
 * - EXTENSIBLE - Easy to add new analytics providers
 * - PRIVACY-AWARE - No PII, just behavioral data
 */

import type {
  BookingLink,
  BookingClickEvent,
  BookingClickSource,
  BookingPartner,
  BookingPartnerCategory,
} from './types';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY = 'waycraft_booking_clicks';
const MAX_STORED_EVENTS = 100;

// ============================================================================
// Event Generation
// ============================================================================

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create a click event from a booking link
 */
export function createClickEvent(
  link: BookingLink,
  source: BookingClickSource
): BookingClickEvent {
  return {
    eventId: generateEventId(),
    timestamp: new Date(),
    partner: link.partner,
    category: link.category,
    url: link.url,
    trackingId: link.trackingId,
    sourceContext: source,
  };
}

// ============================================================================
// Click Handlers
// ============================================================================

/**
 * Registered click handlers
 */
type ClickHandler = (event: BookingClickEvent) => void;
const clickHandlers: ClickHandler[] = [];

/**
 * Register a click handler
 */
export function onBookingClick(handler: ClickHandler): () => void {
  clickHandlers.push(handler);
  return () => {
    const index = clickHandlers.indexOf(handler);
    if (index > -1) {
      clickHandlers.splice(index, 1);
    }
  };
}

/**
 * Track a booking click
 *
 * This is the main function to call when a booking link is clicked.
 * It's non-blocking and won't delay the user's navigation.
 */
export function trackBookingClick(
  link: BookingLink,
  source: BookingClickSource
): void {
  const event = createClickEvent(link, source);

  // Call registered handlers asynchronously
  setTimeout(() => {
    for (const handler of clickHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('[BookingTracking] Handler error:', error);
      }
    }
  }, 0);

  // Also store locally for persistence
  storeClickEvent(event);

  // Log in development
  if (import.meta.env.DEV) {
    console.log(
      '%c[BookingTracking] Click tracked',
      'color: #6B8E7B; font-weight: bold;',
      {
        partner: event.partner,
        category: event.category,
        trackingId: event.trackingId,
        source: event.sourceContext.page,
      }
    );
  }
}

// ============================================================================
// Local Storage Persistence
// ============================================================================

/**
 * Serialized click event for storage
 */
export interface StoredClickEvent extends Omit<BookingClickEvent, 'timestamp'> {
  timestamp: string;
}

/**
 * Store click event in localStorage for later sync
 */
function storeClickEvent(event: BookingClickEvent): void {
  try {
    const stored = getStoredClickEventsRaw();
    const serialized: StoredClickEvent = {
      ...event,
      timestamp: event.timestamp.toISOString(),
    };
    stored.push(serialized);

    // Keep only last N events
    const trimmed = stored.slice(-MAX_STORED_EVENTS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    // localStorage might be full or disabled
    console.warn('[BookingTracking] Failed to store event:', error);
  }
}

/**
 * Get raw stored events (internal)
 */
function getStoredClickEventsRaw(): StoredClickEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Get stored click events from localStorage
 */
export function getStoredClickEvents(): StoredClickEvent[] {
  return getStoredClickEventsRaw();
}

/**
 * Clear stored click events (e.g., after successful sync to server)
 */
export function clearStoredClickEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Get click events since a specific date
 */
export function getClickEventsSince(since: Date): StoredClickEvent[] {
  const events = getStoredClickEvents();
  const sinceTime = since.getTime();
  return events.filter(e => new Date(e.timestamp).getTime() >= sinceTime);
}

// ============================================================================
// Analytics Integration
// ============================================================================

/**
 * Analytics event properties for booking clicks
 */
export interface BookingClickAnalyticsProperties {
  partner: BookingPartner;
  category: BookingPartnerCategory;
  tracking_id: string;
  source_page: string;
  source_trip_id?: string;
  source_city_id?: string;
  source_day?: number;
  source_activity_id?: string;
  source_place_id?: string;
  is_deep_link: boolean;
}

/**
 * Convert click event to analytics properties
 */
export function toAnalyticsProperties(
  event: BookingClickEvent,
  isDeepLink: boolean = false
): BookingClickAnalyticsProperties {
  return {
    partner: event.partner,
    category: event.category,
    tracking_id: event.trackingId,
    source_page: event.sourceContext.page,
    source_trip_id: event.sourceContext.tripId,
    source_city_id: event.sourceContext.cityId,
    source_day: event.sourceContext.dayNumber,
    source_activity_id: event.sourceContext.activityId,
    source_place_id: event.sourceContext.placeId,
    is_deep_link: isDeepLink,
  };
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get click statistics for a time period
 */
export function getClickStatistics(since?: Date): {
  total: number;
  byPartner: Partial<Record<BookingPartner, number>>;
  byCategory: Partial<Record<BookingPartnerCategory, number>>;
  bySource: Record<string, number>;
} {
  const events = since ? getClickEventsSince(since) : getStoredClickEvents();

  const byPartner: Partial<Record<BookingPartner, number>> = {};
  const byCategory: Partial<Record<BookingPartnerCategory, number>> = {};
  const bySource: Record<string, number> = {};

  for (const event of events) {
    // By partner
    byPartner[event.partner] = (byPartner[event.partner] || 0) + 1;
    // By category
    byCategory[event.category] = (byCategory[event.category] || 0) + 1;
    // By source page
    bySource[event.sourceContext.page] = (bySource[event.sourceContext.page] || 0) + 1;
  }

  return {
    total: events.length,
    byPartner,
    byCategory,
    bySource,
  };
}

// ============================================================================
// Default Analytics Handler
// ============================================================================

/**
 * Setup default analytics tracking
 *
 * Call this once at app startup to connect booking tracking
 * to your analytics service.
 */
export function setupBookingAnalytics(
  trackFn: (eventName: string, properties: BookingClickAnalyticsProperties) => void
): () => void {
  return onBookingClick((event) => {
    trackFn('booking_link_clicked', toAnalyticsProperties(event));
  });
}

// ============================================================================
// Click Helper for UI Components
// ============================================================================

/**
 * Create click handler for a booking link
 *
 * Use this in React components to get a pre-bound click handler
 * that tracks the click and opens the link.
 */
export function createBookingClickHandler(
  link: BookingLink,
  source: BookingClickSource
): () => void {
  return () => {
    // Track the click
    trackBookingClick(link, source);

    // Open the link in a new tab
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };
}

/**
 * Create click handler that returns the event instead of opening
 *
 * Useful when you need more control over the navigation.
 */
export function createTrackingOnlyHandler(
  link: BookingLink,
  source: BookingClickSource
): () => BookingClickEvent {
  return () => {
    const event = createClickEvent(link, source);
    trackBookingClick(link, source);
    return event;
  };
}
