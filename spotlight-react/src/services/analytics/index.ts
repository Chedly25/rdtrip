/**
 * Analytics Service
 *
 * WI-10.7: Monetisation Analytics
 *
 * Unified analytics for tracking monetisation metrics.
 */

// General Analytics (app-level event tracking)
export * from './generalAnalytics';

// Types - re-export commonly used types
export type {
  TimePeriod,
  MonetisationDashboard,
  SubscriptionMetrics,
  BookingMetrics,
  UpgradePromptMetrics,
  TimeSeriesData,
  AnalyticsEvent,
  SubscriptionEvent,
  BookingClickAnalyticsEvent,
  AnalyticsExport,
} from './types';

// Monetisation Analytics
export {
  // Subscription tracking
  trackSubscriptionEvent,
  trackTrialStarted,
  trackTrialConverted,
  trackSubscriptionStarted,
  trackSubscriptionCanceled,
  trackSubscriptionResumed,
  trackUpgradePromptShown,
  trackUpgradePromptClicked,
  trackUpgradePromptDismissed,

  // Metrics
  getSubscriptionMetrics,
  getBookingMetrics,
  getUpgradePromptMetrics,
  getTimeSeries,
  getMonetisationDashboard,

  // Export
  exportAnalytics,
  exportAnalyticsJSON,
  downloadAnalytics,

  // Utilities
  clearAnalyticsData,
} from './monetisationAnalytics';
