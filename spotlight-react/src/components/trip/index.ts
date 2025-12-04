/**
 * Trip Mode Components
 *
 * Components for the "Trip in Progress" mode - transforming rdtrip
 * from a planning tool into a live travel companion.
 */

export { TripActivation } from './TripActivation';
export { TodayView } from './TodayView';
export { TripHeader, TripHeaderCompact } from './TripHeader';
export { QuickActions, NearbyPlaceCard } from './QuickActions';
export { CheckinModal } from './CheckinModal';

// Re-export types
export type { TimeSlot } from './TodayView';
export type { NearbyPlace } from './QuickActions';
export type { CheckinData } from './CheckinModal';
