/**
 * Planning Mode Components
 *
 * Slot-based trip planning system.
 * Philosophy: "Chill over precise" - Morning, Afternoon, Evening, Night slots
 */

export { PlanningMode } from './PlanningMode';
export { DayNavigator, CompactDayNavigator } from './DayNavigator';
export { DayView, AllDaysOverview, DayOverviewCard } from './DayView';
export { SlotContainer, DaySummary } from './SlotContainer';
export { PlannedItemCard, TravelIndicator } from './PlannedItemCard';
export { AddPanel } from './AddPanel';

// Phase 2 Components
export { PlanningCompanion } from './PlanningCompanion';
export { ConflictWarnings, WarningToast, InlineWarning } from './ConflictWarnings';
export { FlowScoreCard, CompactFlowScore, ProgressRing } from './FlowScoreCard';
export { PlanningMap } from './PlanningMap';

// Phase 3-5 Components
export { CrossDayMoveModal } from './CrossDayMoveModal';
export { EnhancedAIPickCard, CompactAIPickBadge } from './EnhancedAIPickCard';
export { TripOverviewHeader } from './TripOverviewHeader';
export { ExportModal } from './ExportModal';
export { DayComparisonView } from './DayComparisonView';

// Phase 6 Components (Export & Sync)
export {
  OfflineIndicator,
  SyncStatus,
  PendingBadge,
  useOnlineStatus,
  type ConnectionStatus,
} from './OfflineIndicator';
export { QuickActionsBar, CompactQuickActions } from './QuickActionsBar';
export {
  ProactiveSuggestionCard,
  ProactiveSuggestionList,
  CompactSuggestion,
  NightSuggestionCard,
  type ProactiveSuggestion,
  type SuggestionType,
} from './ProactiveSuggestionCard';
export {
  ItemContextMenu,
  useItemContextMenu,
} from './ItemContextMenu';

// Re-export types
export type {
  Slot,
  PlaceCategory,
  VibeTags,
  EnrichedPlace,
  PlannedItem,
  DayPlan,
  TripPlan,
  FilterState,
} from '../../types/planning';

// Re-export store
export { usePlanningStore, usePlanningKeyboardShortcuts } from '../../stores/planningStore';

// Re-export utils
export {
  enrichPlace,
  inferCategory,
  inferValidSlots,
  inferBestSlot,
  estimateDuration,
  isHiddenGem,
  inferVibeTags,
  haversineDistance,
  estimateWalkingTime,
  estimateDrivingTime,
  clusterPlaces,
  formatPriceLevel,
  CATEGORY_ICONS,
} from '../../utils/planningEnrichment';

// Re-export export utilities
export {
  exportTripPlan,
  generateICS,
  generateJSON,
  generateGoogleMapsURL,
  generateGoogleMapsListData,
  downloadFile,
  type ExportFormat,
} from '../../utils/planningExport';
