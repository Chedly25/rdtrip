/**
 * Transitions & Animations
 *
 * WI-11.2: Smooth transitions between major app phases
 * WI-11.3: Card animations and micro-interactions
 */

// Page Transitions
export {
  PageTransition,
  PageTransitionForward,
  PageTransitionBack,
  PageTransitionReveal,
  PageTransitionFade,
  type PageTransitionProps,
  type TransitionVariant,
} from './PageTransition';

export {
  AnimatedRoutes,
  type AnimatedRoutesProps,
} from './AnimatedRoutes';

// Card Animations (WI-11.3)
export {
  // Components
  AnimatedCard,
  AnimatedCardList,
  CardSkeleton,
  CardAppear,
  CardButton,
  PulsingBadge,
  // Types
  type AnimatedCardProps,
  type AnimatedCardListProps,
  type CardSkeletonProps,
  type CardAppearProps,
  type CardButtonProps,
  type PulsingBadgeProps,
  type CardEntryVariant,
  type CardHoverEffect,
  type CardPressEffect,
  // Utilities
  getEntryVariants,
  getHoverConfig,
  getPressConfig,
  staggerDelay,
  // Constants
  EASING,
  DURATION,
} from './CardAnimations';

// Loading States (WI-11.4)
export {
  // Spinners
  Spinner,
  LoadingDots,
  // Skeletons
  Shimmer,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  CardLoading,
  ListLoading,
  // Overlays & Indicators
  LoadingOverlay,
  InlineLoading,
  PageLoading,
  // Button helper
  ButtonLoadingContent,
  // Types
  type SpinnerProps,
  type SpinnerSize,
  type SpinnerVariant,
  type LoadingDotsProps,
  type ShimmerProps,
  type SkeletonTextProps,
  type LoadingOverlayProps,
  type InlineLoadingProps,
  type PageLoadingProps,
  type CardLoadingProps,
  type ListLoadingProps,
  type ButtonLoadingContentProps,
} from './LoadingStates';

// Error States (WI-11.6)
export {
  // Full-page errors
  ErrorDisplay,
  NotFoundError,
  NetworkError,
  ServerError,
  PermissionError,
  // Inline errors
  InlineError,
  ErrorBanner,
  // Empty states
  EmptyState,
  // Types
  type ErrorDisplayProps,
  type NotFoundErrorProps,
  type NetworkErrorProps,
  type ServerErrorProps,
  type PermissionErrorProps,
  type InlineErrorProps,
  type ErrorBannerProps,
  type EmptyStateProps,
  type ErrorVariant,
  type ErrorSize,
} from './ErrorStates';
