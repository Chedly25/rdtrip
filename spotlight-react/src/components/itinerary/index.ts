/**
 * Itinerary Display & Edit Components
 *
 * WI-5.5: UI components for displaying generated itineraries
 * WI-5.6: Edit capabilities for itinerary customization
 * WI-5.7: Show alternatives feature
 * WI-5.8: Companion integration for itinerary
 *
 * Display Components:
 * - ItineraryDisplay: Main container with full trip view
 * - ItineraryTimeline: Bird's-eye trip overview
 * - ItineraryDayCard: Expandable day view with activities
 * - ItineraryActivityCard: Individual activity card
 *
 * Edit Components (WI-5.6):
 * - DraggableActivityList: Drag-to-reorder activities within slots
 * - DayActivityList: Full day activity list with all time slots
 * - AddActivitySheet: Bottom sheet for adding activities
 * - RemoveActivitySheet: Bottom sheet for removing activities
 * - SwapActivitySheet: Bottom sheet for swapping activities
 *
 * Alternatives Components (WI-5.7):
 * - AlternativesPanel: Display alternative places for activities
 * - SwapActivitySheetEnhanced: Bottom sheet with auto-fetching alternatives
 *
 * Companion Components (WI-5.8):
 * - ItineraryCompanionPanel: AI companion chat for itinerary modifications
 */

// Main display component
export { ItineraryDisplay, default } from './ItineraryDisplay';

// Timeline components
export { ItineraryTimeline, ItineraryTimelineMini } from './ItineraryTimeline';

// Day card
export { ItineraryDayCard } from './ItineraryDayCard';

// Activity card
export { ItineraryActivityCard } from './ItineraryActivityCard';

// Draggable activity list (WI-5.6)
export { DraggableActivityList, DayActivityList } from './DraggableActivityList';

// Edit sheets (WI-5.6)
export { AddActivitySheet } from './AddActivitySheet';
export { RemoveActivitySheet } from './RemoveActivitySheet';
export { SwapActivitySheet } from './SwapActivitySheet';

// Alternatives (WI-5.7)
export { AlternativesPanel, useAlternatives } from './AlternativesPanel';
export { SwapActivitySheetEnhanced } from './SwapActivitySheetEnhanced';

// Companion Integration (WI-5.8)
export { ItineraryCompanionPanel } from './ItineraryCompanionPanel';
