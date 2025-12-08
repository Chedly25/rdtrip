/**
 * Monetisation Analytics Service
 *
 * WI-10.7: Track and analyze monetisation metrics
 *
 * Provides:
 * - Subscription event tracking
 * - Affiliate click aggregation
 * - Revenue metrics
 * - Exportable data
 *
 * Architecture:
 * - localStorage persistence (ready for backend sync)
 * - Aggregation computed on-demand
 * - Non-blocking event recording
 */

import {
  type AnalyticsEvent,
  type SubscriptionEvent,
  type SubscriptionEventType,
  type BookingClickAnalyticsEvent,
  type SubscriptionMetrics,
  type BookingMetrics,
  type UpgradePromptMetrics,
  type MonetisationDashboard,
  type TimeSeriesData,
  type TimePeriod,
  type AnalyticsExport,
} from './types';

import {
  getStoredClickEvents,
} from '../booking/tracking';

import { TIER_PRICING } from '../subscription/types';

// ============================================================================
// Storage
// ============================================================================

const SUBSCRIPTION_EVENTS_KEY = 'waycraft_subscription_events';
const MAX_STORED_EVENTS = 500;

// ============================================================================
// Event Generation
// ============================================================================

function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function getSessionId(): string {
  // Simple session ID based on browser session
  let sessionId = sessionStorage.getItem('waycraft_session_id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    sessionStorage.setItem('waycraft_session_id', sessionId);
  }
  return sessionId;
}

// ============================================================================
// Subscription Event Storage
// ============================================================================

interface StoredSubscriptionEvent extends Omit<SubscriptionEvent, 'timestamp'> {
  timestamp: string;
}

function getStoredSubscriptionEvents(): StoredSubscriptionEvent[] {
  try {
    const stored = localStorage.getItem(SUBSCRIPTION_EVENTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function storeSubscriptionEvent(event: SubscriptionEvent): void {
  try {
    const stored = getStoredSubscriptionEvents();
    const serialized: StoredSubscriptionEvent = {
      ...event,
      timestamp: event.timestamp.toISOString(),
    };
    stored.push(serialized);

    // Keep only last N events
    const trimmed = stored.slice(-MAX_STORED_EVENTS);
    localStorage.setItem(SUBSCRIPTION_EVENTS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.warn('[Analytics] Failed to store subscription event:', error);
  }
}

// ============================================================================
// Subscription Event Tracking
// ============================================================================

/**
 * Track a subscription-related event
 */
export function trackSubscriptionEvent(
  type: SubscriptionEventType,
  data: {
    tier: 'free' | 'premium';
    billingPeriod?: 'monthly' | 'yearly';
    valueCents?: number;
    context?: string;
    previousState?: string;
  }
): void {
  const event: SubscriptionEvent = {
    eventId: generateEventId(),
    type,
    timestamp: new Date(),
    sessionId: getSessionId(),
    tier: data.tier,
    billingPeriod: data.billingPeriod,
    valueCents: data.valueCents,
    context: data.context,
    previousState: data.previousState,
  };

  // Store asynchronously
  setTimeout(() => {
    storeSubscriptionEvent(event);

    if (import.meta.env.DEV) {
      console.log(
        '%c[Analytics] Subscription event',
        'color: #F59E0B; font-weight: bold;',
        type,
        data
      );
    }
  }, 0);
}

/**
 * Track trial start
 */
export function trackTrialStarted(): void {
  trackSubscriptionEvent('trial_started', {
    tier: 'premium',
    context: 'trial_signup',
  });
}

/**
 * Track trial conversion to paid
 */
export function trackTrialConverted(billingPeriod: 'monthly' | 'yearly'): void {
  const valueCents = billingPeriod === 'monthly'
    ? TIER_PRICING.premium.monthly
    : TIER_PRICING.premium.yearly;

  trackSubscriptionEvent('trial_converted', {
    tier: 'premium',
    billingPeriod,
    valueCents,
    previousState: 'trialing',
  });
}

/**
 * Track subscription start (direct, no trial)
 */
export function trackSubscriptionStarted(billingPeriod: 'monthly' | 'yearly'): void {
  const valueCents = billingPeriod === 'monthly'
    ? TIER_PRICING.premium.monthly
    : TIER_PRICING.premium.yearly;

  trackSubscriptionEvent('subscription_started', {
    tier: 'premium',
    billingPeriod,
    valueCents,
  });
}

/**
 * Track subscription cancellation
 */
export function trackSubscriptionCanceled(): void {
  trackSubscriptionEvent('subscription_canceled', {
    tier: 'premium',
    previousState: 'active',
  });
}

/**
 * Track subscription resumed after cancel
 */
export function trackSubscriptionResumed(): void {
  trackSubscriptionEvent('subscription_resumed', {
    tier: 'premium',
    previousState: 'canceled',
  });
}

/**
 * Track upgrade prompt shown
 */
export function trackUpgradePromptShown(context: string): void {
  trackSubscriptionEvent('upgrade_prompt_shown', {
    tier: 'free',
    context,
  });
}

/**
 * Track upgrade prompt CTA clicked
 */
export function trackUpgradePromptClicked(context: string): void {
  trackSubscriptionEvent('upgrade_prompt_clicked', {
    tier: 'free',
    context,
  });
}

/**
 * Track upgrade prompt dismissed
 */
export function trackUpgradePromptDismissed(context: string): void {
  trackSubscriptionEvent('upgrade_prompt_dismissed', {
    tier: 'free',
    context,
  });
}

// ============================================================================
// Aggregation Helpers
// ============================================================================

function getPeriodBounds(period: TimePeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'all':
      start.setFullYear(2020); // Far enough back
      break;
  }

  return { start, end };
}

function filterEventsByPeriod<T extends { timestamp: string }>(
  events: T[],
  start: Date,
  end: Date
): T[] {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return events.filter((e) => {
    const eventTime = new Date(e.timestamp).getTime();
    return eventTime >= startTime && eventTime <= endTime;
  });
}

// ============================================================================
// Subscription Metrics
// ============================================================================

export function getSubscriptionMetrics(period: TimePeriod = 'all'): SubscriptionMetrics {
  const { start, end } = getPeriodBounds(period);
  const events = filterEventsByPeriod(getStoredSubscriptionEvents(), start, end);

  let trialsStarted = 0;
  let trialsConverted = 0;
  let canceled = 0;
  let resumed = 0;
  let totalRevenueCents = 0;
  let subscriptionsStarted = 0;

  for (const event of events) {
    switch (event.type) {
      case 'trial_started':
        trialsStarted++;
        break;
      case 'trial_converted':
        trialsConverted++;
        totalRevenueCents += event.valueCents || 0;
        break;
      case 'subscription_started':
        subscriptionsStarted++;
        totalRevenueCents += event.valueCents || 0;
        break;
      case 'subscription_canceled':
        canceled++;
        break;
      case 'subscription_resumed':
        resumed++;
        break;
      case 'subscription_renewed':
        totalRevenueCents += event.valueCents || 0;
        break;
    }
  }

  // Current premium count is rough estimate
  const currentPremium = subscriptionsStarted + trialsConverted - canceled + resumed;

  // Trial conversion rate
  const trialConversionRate = trialsStarted > 0
    ? trialsConverted / trialsStarted
    : 0;

  // Churn rate
  const totalActive = subscriptionsStarted + trialsConverted;
  const churnRate = totalActive > 0
    ? canceled / totalActive
    : 0;

  // MRR estimate (assuming all are monthly for simplicity)
  const mrrCents = currentPremium * TIER_PRICING.premium.monthly;

  return {
    currentPremium: Math.max(0, currentPremium),
    trialsStarted,
    trialsConverted,
    trialConversionRate,
    canceled,
    resumed,
    churnRate,
    totalRevenueCents,
    mrrCents,
  };
}

// ============================================================================
// Booking Metrics
// ============================================================================

export function getBookingMetrics(period: TimePeriod = 'all'): BookingMetrics {
  const { start, end } = getPeriodBounds(period);
  const events = filterEventsByPeriod(getStoredClickEvents(), start, end);

  const clicksByPartner: Record<string, number> = {};
  const clicksByCategory: Record<string, number> = {};
  const clicksBySource: Record<string, number> = {};

  for (const event of events) {
    // By partner
    clicksByPartner[event.partner] = (clicksByPartner[event.partner] || 0) + 1;

    // By category
    clicksByCategory[event.category] = (clicksByCategory[event.category] || 0) + 1;

    // By source page
    const sourcePage = event.sourceContext?.page || 'unknown';
    clicksBySource[sourcePage] = (clicksBySource[sourcePage] || 0) + 1;
  }

  return {
    totalClicks: events.length,
    clicksByPartner,
    clicksByCategory,
    clicksBySource,
  };
}

// ============================================================================
// Upgrade Prompt Metrics
// ============================================================================

export function getUpgradePromptMetrics(period: TimePeriod = 'all'): UpgradePromptMetrics {
  const { start, end } = getPeriodBounds(period);
  const events = filterEventsByPeriod(getStoredSubscriptionEvents(), start, end);

  let shown = 0;
  let clicked = 0;
  let dismissed = 0;
  const byContext: Record<string, { shown: number; clicked: number }> = {};

  for (const event of events) {
    const context = event.context || 'unknown';

    if (event.type === 'upgrade_prompt_shown') {
      shown++;
      byContext[context] = byContext[context] || { shown: 0, clicked: 0 };
      byContext[context].shown++;
    } else if (event.type === 'upgrade_prompt_clicked') {
      clicked++;
      byContext[context] = byContext[context] || { shown: 0, clicked: 0 };
      byContext[context].clicked++;
    } else if (event.type === 'upgrade_prompt_dismissed') {
      dismissed++;
    }
  }

  const ctr = shown > 0 ? clicked / shown : 0;

  return {
    shown,
    clicked,
    dismissed,
    ctr,
    byContext,
  };
}

// ============================================================================
// Time Series
// ============================================================================

export function getTimeSeries(period: TimePeriod = 'week'): TimeSeriesData[] {
  const { start, end } = getPeriodBounds(period);
  const subEvents = filterEventsByPeriod(getStoredSubscriptionEvents(), start, end);
  const bookingEvents = filterEventsByPeriod(getStoredClickEvents(), start, end);

  // Group by date
  const byDate: Record<string, TimeSeriesData> = {};

  // Initialize dates
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateKey = currentDate.toISOString().split('T')[0];
    byDate[dateKey] = {
      date: dateKey,
      subscriptionEvents: 0,
      bookingClicks: 0,
      revenueCents: 0,
      newTrials: 0,
      conversions: 0,
    };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Count subscription events
  for (const event of subEvents) {
    const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
    if (byDate[dateKey]) {
      byDate[dateKey].subscriptionEvents++;

      if (event.type === 'trial_started') {
        byDate[dateKey].newTrials++;
      }
      if (event.type === 'trial_converted' || event.type === 'subscription_started') {
        byDate[dateKey].conversions++;
        byDate[dateKey].revenueCents += event.valueCents || 0;
      }
    }
  }

  // Count booking clicks
  for (const event of bookingEvents) {
    const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
    if (byDate[dateKey]) {
      byDate[dateKey].bookingClicks++;
    }
  }

  // Convert to array, sorted by date
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// Dashboard Data
// ============================================================================

/**
 * Get full monetisation dashboard data
 */
export function getMonetisationDashboard(period: TimePeriod = 'month'): MonetisationDashboard {
  const { start, end } = getPeriodBounds(period);

  return {
    period,
    periodStart: start,
    periodEnd: end,
    subscription: getSubscriptionMetrics(period),
    booking: getBookingMetrics(period),
    upgradePrompts: getUpgradePromptMetrics(period),
    timeSeries: getTimeSeries(period),
  };
}

// ============================================================================
// Export
// ============================================================================

/**
 * Export all analytics data
 */
export function exportAnalytics(): AnalyticsExport {
  const subEvents = getStoredSubscriptionEvents().map((e) => ({
    ...e,
    timestamp: new Date(e.timestamp),
  })) as SubscriptionEvent[];

  const bookingEvents = getStoredClickEvents().map((e) => ({
    eventId: e.eventId,
    type: 'booking_link_clicked' as const,
    timestamp: new Date(e.timestamp),
    partner: e.partner,
    category: e.category,
    trackingId: e.trackingId,
    sourcePage: e.sourceContext?.page || 'unknown',
    tripId: e.sourceContext?.tripId,
    cityId: e.sourceContext?.cityId,
    dayNumber: e.sourceContext?.dayNumber,
  })) as BookingClickAnalyticsEvent[];

  const allEvents: AnalyticsEvent[] = [...subEvents, ...bookingEvents];

  return {
    exportedAt: new Date(),
    version: '1.0',
    events: allEvents,
    summary: {
      subscription: getSubscriptionMetrics('all'),
      booking: getBookingMetrics('all'),
    },
  };
}

/**
 * Export as JSON string
 */
export function exportAnalyticsJSON(): string {
  return JSON.stringify(exportAnalytics(), null, 2);
}

/**
 * Download analytics as JSON file
 */
export function downloadAnalytics(): void {
  const data = exportAnalyticsJSON();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `waycraft-analytics-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ============================================================================
// Clear Data (for testing)
// ============================================================================

export function clearAnalyticsData(): void {
  localStorage.removeItem(SUBSCRIPTION_EVENTS_KEY);
}
