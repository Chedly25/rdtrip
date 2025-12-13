/**
 * Planning Shared Components
 *
 * Centralized exports for shared planning components:
 * - Skeletons (loading states)
 * - Error handling
 * - Empty states & onboarding
 */

// Skeletons
export {
  CardSkeleton,
  ClusterSkeleton,
  PlanItemSkeleton,
  CategoryHeaderSkeleton,
  CompanionMessageSkeleton,
  CityTabSkeleton,
  PlanningPageSkeleton,
  CardGridSkeleton,
} from './Skeletons';

// Error handling
export {
  PlanningErrorBoundary,
  ErrorRecoveryUI,
  InlineError,
  NetworkError,
  NotFoundError,
} from './ErrorBoundary';

// Empty states & onboarding
export {
  EmptyState,
  EmptyPlan,
  EmptyCluster,
  EmptySuggestions,
  PlanningOnboarding,
} from './EmptyStates';
