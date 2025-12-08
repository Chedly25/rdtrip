/**
 * Monetisation Analytics Types
 *
 * WI-10.7: Analytics for tracking monetisation metrics
 *
 * Tracks:
 * - Affiliate link clicks by partner
 * - Premium subscription conversions
 * - Churn and retention
 * - Revenue attribution
 */

// ============================================================================
// Event Types
// ============================================================================

/**
 * Subscription-related events
 */
export type SubscriptionEventType =
  | 'trial_started'
  | 'trial_converted'
  | 'trial_expired'
  | 'subscription_started'
  | 'subscription_renewed'
  | 'subscription_canceled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'upgrade_prompt_shown'
  | 'upgrade_prompt_clicked'
  | 'upgrade_prompt_dismissed';

/**
 * Booking/affiliate events
 */
export type BookingEventType =
  | 'booking_link_clicked'
  | 'booking_link_conversion'; // If we can track via callback

/**
 * All analytics event types
 */
export type AnalyticsEventType = SubscriptionEventType | BookingEventType;

// ============================================================================
// Event Payloads
// ============================================================================

/**
 * Base event structure
 */
export interface AnalyticsEventBase {
  /** Unique event ID */
  eventId: string;
  /** Event type */
  type: AnalyticsEventType;
  /** When the event occurred */
  timestamp: Date;
  /** Optional user/session identifier (anonymized) */
  sessionId?: string;
}

/**
 * Subscription event payload
 */
export interface SubscriptionEvent extends AnalyticsEventBase {
  type: SubscriptionEventType;
  /** Subscription tier involved */
  tier: 'free' | 'premium';
  /** Billing period if applicable */
  billingPeriod?: 'monthly' | 'yearly';
  /** Value in cents (for revenue tracking) */
  valueCents?: number;
  /** Context where event occurred */
  context?: string;
  /** Previous state (for transitions) */
  previousState?: string;
}

/**
 * Booking click event (mirrors existing type for unification)
 */
export interface BookingClickAnalyticsEvent extends AnalyticsEventBase {
  type: 'booking_link_clicked';
  /** Partner name */
  partner: string;
  /** Booking category */
  category: 'accommodation' | 'activity' | 'restaurant';
  /** Tracking ID for attribution */
  trackingId: string;
  /** Source page/context */
  sourcePage: string;
  /** Trip context */
  tripId?: string;
  cityId?: string;
  dayNumber?: number;
}

/**
 * Union of all event types
 */
export type AnalyticsEvent = SubscriptionEvent | BookingClickAnalyticsEvent;

// ============================================================================
// Aggregation Types
// ============================================================================

/**
 * Time period for aggregation
 */
export type TimePeriod = 'day' | 'week' | 'month' | 'all';

/**
 * Subscription metrics
 */
export interface SubscriptionMetrics {
  /** Total premium subscribers (current) */
  currentPremium: number;
  /** Total trials started */
  trialsStarted: number;
  /** Trials that converted to paid */
  trialsConverted: number;
  /** Trial conversion rate */
  trialConversionRate: number;
  /** Subscriptions canceled */
  canceled: number;
  /** Subscriptions resumed after cancel */
  resumed: number;
  /** Churn rate (canceled / total) */
  churnRate: number;
  /** Total revenue in cents */
  totalRevenueCents: number;
  /** Monthly recurring revenue (estimated) */
  mrrCents: number;
}

/**
 * Booking/affiliate metrics
 */
export interface BookingMetrics {
  /** Total clicks */
  totalClicks: number;
  /** Clicks by partner */
  clicksByPartner: Record<string, number>;
  /** Clicks by category */
  clicksByCategory: Record<string, number>;
  /** Clicks by source page */
  clicksBySource: Record<string, number>;
  /** Click-through rate (if we have impressions) */
  ctr?: number;
  /** Estimated revenue from affiliates (if trackable) */
  estimatedRevenueCents?: number;
}

/**
 * Upgrade prompt metrics
 */
export interface UpgradePromptMetrics {
  /** Times prompt was shown */
  shown: number;
  /** Times CTA was clicked */
  clicked: number;
  /** Times dismissed */
  dismissed: number;
  /** Click-through rate */
  ctr: number;
  /** By context */
  byContext: Record<string, { shown: number; clicked: number }>;
}

/**
 * Combined monetisation dashboard data
 */
export interface MonetisationDashboard {
  /** Data period */
  period: TimePeriod;
  /** Period start date */
  periodStart: Date;
  /** Period end date */
  periodEnd: Date;
  /** Subscription metrics */
  subscription: SubscriptionMetrics;
  /** Booking/affiliate metrics */
  booking: BookingMetrics;
  /** Upgrade prompt metrics */
  upgradePrompts: UpgradePromptMetrics;
  /** Time series data for charts */
  timeSeries: TimeSeriesData[];
}

/**
 * Time series data point
 */
export interface TimeSeriesData {
  /** Date bucket */
  date: string;
  /** Subscription events count */
  subscriptionEvents: number;
  /** Booking clicks count */
  bookingClicks: number;
  /** Revenue in cents */
  revenueCents: number;
  /** New trials */
  newTrials: number;
  /** Conversions */
  conversions: number;
}

// ============================================================================
// Export Format
// ============================================================================

/**
 * Exportable analytics data
 */
export interface AnalyticsExport {
  /** Export timestamp */
  exportedAt: Date;
  /** Export format version */
  version: string;
  /** Raw events */
  events: AnalyticsEvent[];
  /** Summary metrics */
  summary: {
    subscription: SubscriptionMetrics;
    booking: BookingMetrics;
  };
}
