/**
 * Trip Mode Components
 *
 * Components for the "Trip in Progress" mode - transforming rdtrip
 * from a planning tool into a live travel companion.
 */

// Core Trip Components
export { TripActivation } from './TripActivation';
export { TodayView } from './TodayView';
export { TripHeader, TripHeaderCompact } from './TripHeader';

// Quick Actions & Check-in
export { QuickActions, NearbyPlaceCard } from './QuickActions';
export { CheckinModal } from './CheckinModal';

// Navigation & Discovery
export { NavigationSheet } from './NavigationSheet';
export { NearbySheet } from './NearbySheet';

// Alerts & Plan Changes
export { AlertBannerStack, useAlerts, createWeatherAlert, createReservationReminder, createDrivingWarning, createCheckoutReminder } from './AlertBanner';
export { PlanChangeSheet } from './PlanChangeSheet';

// Progress & Completion
export { TripProgress } from './TripProgress';
export { TripCompleteFlow } from './TripCompleteFlow';

// Memories & Gallery
export { TripMemories } from './TripMemories';
export { CheckinSummaryCard, CheckinSummaryCompact } from './CheckinSummaryCard';

// Offline Support
export { useOfflineManager } from './OfflineManager';
export { OfflineIndicator, OfflineBanner } from './OfflineIndicator';
export { PreTripDownload } from './PreTripDownload';

// Re-export types
export type { TimeSlot } from './TodayView';
export type { NearbyPlace } from './QuickActions';
export type { CheckinData } from './CheckinModal';
export type { TripAlert } from './AlertBanner';
export type { OfflineState, PendingAction, OfflineTripData } from './OfflineManager';
export type { TripMemory } from './TripMemories';
