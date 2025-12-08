/**
 * Analytics Service
 *
 * A simple, extensible event tracking pattern that can be connected to any
 * analytics provider (Google Analytics, Mixpanel, PostHog, Amplitude, etc.)
 *
 * Architecture Decision:
 * - Uses a handler-based pattern for flexibility
 * - Default handler logs to console in development
 * - Easy to swap in real providers via setHandler()
 * - All events are typed for safety and autocomplete
 */

// ============================================================================
// Event Types
// ============================================================================

/**
 * Entry Form Events - Track the new trip entry flow
 */
export type EntryFormEventName =
  | 'entry_form_started'
  | 'entry_form_completed'
  | 'entry_form_abandoned'
  | 'entry_form_field_focused'
  | 'entry_form_field_completed';

/**
 * General App Events - Extend as needed
 */
export type AppEventName =
  | 'page_view'
  | 'error_occurred';

export type AnalyticsEventName = EntryFormEventName | AppEventName;

// ============================================================================
// Event Properties
// ============================================================================

export interface EntryFormStartedProperties {
  /** ISO timestamp when form was started */
  startedAt: string;
}

export interface EntryFormCompletedProperties {
  /** Time from form start to completion in milliseconds */
  timeToCompleteMs: number;
  /** Selected traveller type */
  travellerType: string;
  /** Trip duration in nights */
  tripDurationNights: number;
  /** Approximate distance between origin and destination in km */
  distanceKm: number;
  /** Number of waypoints added (0 for simplified form) */
  waypointsAdded: number;
}

export interface EntryFormAbandonedProperties {
  /** Time spent on form before abandonment in milliseconds */
  timeSpentMs: number;
  /** Last field the user interacted with */
  lastActiveField: 'origin' | 'destination' | 'dates' | 'traveller_type' | null;
  /** List of fields that were completed before abandonment */
  fieldsCompleted: Array<'origin' | 'destination' | 'dates' | 'traveller_type'>;
  /** Abandonment trigger: tab close, navigation, or visibility change */
  abandonmentTrigger: 'beforeunload' | 'visibilitychange' | 'navigation';
}

export interface EntryFormFieldFocusedProperties {
  /** Which field was focused */
  field: 'origin' | 'destination' | 'dates' | 'traveller_type';
  /** Time since form started in milliseconds */
  timeSinceStartMs: number;
}

export interface EntryFormFieldCompletedProperties {
  /** Which field was completed */
  field: 'origin' | 'destination' | 'dates' | 'traveller_type';
  /** Time since form started in milliseconds */
  timeSinceStartMs: number;
}

export interface PageViewProperties {
  path: string;
  referrer?: string;
}

export interface ErrorProperties {
  message: string;
  stack?: string;
  context?: string;
}

// Map event names to their property types
export interface EventPropertiesMap {
  entry_form_started: EntryFormStartedProperties;
  entry_form_completed: EntryFormCompletedProperties;
  entry_form_abandoned: EntryFormAbandonedProperties;
  entry_form_field_focused: EntryFormFieldFocusedProperties;
  entry_form_field_completed: EntryFormFieldCompletedProperties;
  page_view: PageViewProperties;
  error_occurred: ErrorProperties;
}

// ============================================================================
// Analytics Handler Interface
// ============================================================================

export interface AnalyticsHandler {
  track: <T extends AnalyticsEventName>(
    eventName: T,
    properties: EventPropertiesMap[T]
  ) => void;
  identify?: (userId: string, traits?: Record<string, unknown>) => void;
  page?: (name: string, properties?: Record<string, unknown>) => void;
}

// ============================================================================
// Default Console Handler (Development)
// ============================================================================

const consoleHandler: AnalyticsHandler = {
  track: (eventName, properties) => {
    if (import.meta.env.DEV) {
      console.log(
        `%c[Analytics] ${eventName}`,
        'color: #6B8E7B; font-weight: bold;',
        properties
      );
    }
  },
  identify: (userId, traits) => {
    if (import.meta.env.DEV) {
      console.log(
        '%c[Analytics] identify',
        'color: #6B8E7B; font-weight: bold;',
        { userId, traits }
      );
    }
  },
  page: (name, properties) => {
    if (import.meta.env.DEV) {
      console.log(
        '%c[Analytics] page',
        'color: #6B8E7B; font-weight: bold;',
        { name, properties }
      );
    }
  },
};

// ============================================================================
// Analytics Service
// ============================================================================

class AnalyticsService {
  private handler: AnalyticsHandler = consoleHandler;
  private enabled: boolean = true;

  /**
   * Set a custom analytics handler (e.g., for Google Analytics, Mixpanel)
   *
   * @example
   * // Google Analytics 4
   * analytics.setHandler({
   *   track: (event, props) => gtag('event', event, props),
   *   identify: (userId) => gtag('config', 'GA_ID', { user_id: userId }),
   * });
   *
   * @example
   * // Mixpanel
   * analytics.setHandler({
   *   track: (event, props) => mixpanel.track(event, props),
   *   identify: (userId, traits) => {
   *     mixpanel.identify(userId);
   *     mixpanel.people.set(traits);
   *   },
   * });
   */
  setHandler(handler: AnalyticsHandler): void {
    this.handler = handler;
  }

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Track an analytics event with typed properties
   */
  track<T extends AnalyticsEventName>(
    eventName: T,
    properties: EventPropertiesMap[T]
  ): void {
    if (!this.enabled) return;

    try {
      this.handler.track(eventName, properties);
    } catch (error) {
      // Silently fail - analytics should never break the app
      if (import.meta.env.DEV) {
        console.error('[Analytics] Error tracking event:', error);
      }
    }
  }

  /**
   * Identify a user for analytics
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.enabled || !this.handler.identify) return;

    try {
      this.handler.identify(userId, traits);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Analytics] Error identifying user:', error);
      }
    }
  }

  /**
   * Track a page view
   */
  page(name: string, properties?: Record<string, unknown>): void {
    if (!this.enabled || !this.handler.page) return;

    try {
      this.handler.page(name, properties);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Analytics] Error tracking page:', error);
      }
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
