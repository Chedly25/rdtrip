/**
 * Discovery Phase Components
 *
 * The discovery phase lets users explore AI-suggested cities along their route
 * before committing to a full itinerary.
 */

export { DiscoveryPhaseContainer } from './DiscoveryPhaseContainer';
export { DiscoveryHeader } from './DiscoveryHeader';
export { DiscoveryMap } from './DiscoveryMap';
export { DiscoveryCityPin } from './DiscoveryCityPin';
export { DiscoveryCompanionPanel } from './DiscoveryCompanionPanel';
export { DiscoveryCityPreview } from './DiscoveryCityPreview';
export { DiscoveryLoadingState } from './DiscoveryLoadingState';
export { PlaceCard } from './PlaceCard';
export { AddCityModal } from './AddCityModal';
export { SortableCityList } from './SortableCityList';
export { ProceedConfirmationModal } from './ProceedConfirmationModal';

// City Intelligence Components (Phase 4)
export { CityIntelligenceCard } from './CityIntelligenceCard';
export { CityIntelligenceDetailView } from './CityIntelligenceDetailView';
export { ClusterMapOverlay } from './ClusterMapOverlay';
export { IntelligenceSidebar } from './IntelligenceSidebar';
export { IntelligenceProgressPanel, IntelligenceBadge } from './IntelligenceProgressPanel';
export {
  AgentStatusIndicator,
  AgentStatusGroup,
  AgentProgressBar,
  AgentTimeline,
} from './AgentStatusIndicator';

// Deep Dive & Feedback Components (Phase 4)
export {
  DeepDiveRequest,
  DeepDiveButton,
  DeepDiveResponse,
  type DeepDiveTopic,
} from './DeepDiveRequest';
export {
  IntelligenceFeedback,
  QuickFeedbackBar,
  FloatingFeedbackPrompt,
} from './IntelligenceFeedback';

// City Intelligence Display Components (Phase 3)
export { HiddenGemsDisplay, HiddenGemCard } from './HiddenGemsDisplay';
export { LogisticsPanel } from './LogisticsPanel';
export { WeatherDisplay } from './WeatherDisplay';
export { PhotoSpotsDisplay } from './PhotoSpotsDisplay';

// City Intelligence Visualization Components (Phase 2)
export { MatchScoreRing, MatchReasonsDisplay } from './MatchScoreRing';
export { TimeBlocksDisplay, TimeBlockCard } from './TimeBlocksDisplay';
export { ClusterVisualization, ClusterCard } from './ClusterVisualization';

// Phase 5: Refinement & Polish Components
export { IntelligenceSettingsPanel, DEFAULT_INTELLIGENCE_SETTINGS } from './IntelligenceSettingsPanel';
export { IntelligenceCacheManager } from './IntelligenceCacheManager';
export { ErrorRecoveryPanel, InlineError } from './ErrorRecoveryPanel';
export {
  IntelligenceErrorBoundary,
  withIntelligenceErrorBoundary,
  ErrorTrigger,
} from './IntelligenceErrorBoundary';
export {
  Shimmer,
  SkeletonLine,
  SkeletonCircle,
  SkeletonRect,
  CityIntelligenceCardSkeleton,
  DetailViewSkeleton,
  AgentStatusSkeleton,
  SidebarSkeleton,
  ProgressPanelSkeleton,
  ClusterMapOverlaySkeleton,
  HiddenGemsSkeleton,
  TimeBlocksSkeleton,
  MatchScoreSkeleton,
  Skeletons,
} from './IntelligenceSkeletons';

// Accessibility Utilities
export {
  A11yProvider,
  useA11y,
  useFocusTrap,
  useKeyboardNav,
  useRovingTabIndex,
  SkipLink,
  FocusRing,
  ScreenReaderOnly,
  LoadingAnnouncer,
  AccessibleModal,
  AccessibleTabs,
  ProgressAnnouncer,
  HighContrastStyles,
} from './IntelligenceA11y';

// Empty States
export {
  EmptyState,
  NoCitiesSelectedEmpty,
  IntelligencePendingEmpty,
  NoHiddenGemsEmpty,
  NoClustersEmpty,
  NoFeedbackEmpty,
  NoTimeBlocksEmpty,
  NoPhotoSpotsEmpty,
  NoCacheDataEmpty,
  NoSearchResultsEmpty,
  DeepDiveWelcomeEmpty,
  OfflineEmpty,
  createEmptyState,
  EmptyStates,
} from './IntelligenceEmptyStates';

// Animations & Micro-interactions
export {
  // Animation variants
  fadeVariants,
  slideUpVariants,
  slideDownVariants,
  scaleVariants,
  springVariants,
  staggerContainerVariants,
  staggerItemVariants,
  cardHoverVariants,
  pulseVariants,
  shimmerVariants,
  // Transition presets
  transitions,
  // Components
  MagneticButton,
  Floating,
  GlowOnHover,
  AnimatedProgressRing,
  Confetti,
  ToastProvider,
  useToast,
  AnimatedCounter,
  RippleButton,
  Shake,
  Typewriter,
  StaggerList,
  SuccessCheckmark,
} from './IntelligenceAnimations';
