/**
 * Active Companion Types
 *
 * WI-7.1: Types for the active trip companion mode
 *
 * The companion has two distinct modes:
 * - Planning mode: Helps users discover and plan their trip
 * - Active mode: Provides real-time guidance during the trip
 *
 * This file defines the types for the active mode, which:
 * - Uses TripBrain for intelligent recommendations
 * - Is proactive (can initiate messages)
 * - Uses geolocation for context
 * - Provides real-time context (weather, time, location)
 */

import type {
  EnrichedActivity,
  LocationContext,
  WeatherContext,
  RecommendationMode,
  WhyNowReason,
  CravingSearchResult,
  SerendipityResult,
} from '../types';

// ============================================================================
// Companion Mode Types
// ============================================================================

/**
 * The two primary modes of the companion
 */
export type CompanionMode = 'planning' | 'active';

/**
 * Sub-modes within active mode
 */
export type ActiveCompanionSubMode =
  | 'choice'      // Default: curated recommendations
  | 'craving'     // "I want..." search mode
  | 'serendipity' // "Surprise me" mode
  | 'rest'        // "I'm tired" mode
  | 'nearby'      // "What's near me" mode
  | 'chat';       // Free-form conversation

/**
 * Context for determining companion mode
 */
export interface CompanionModeContext {
  /** Current detected mode */
  mode: CompanionMode;

  /** Sub-mode if in active mode */
  activeSubMode?: ActiveCompanionSubMode;

  /** Is the user on an active trip */
  hasActiveTrip: boolean;

  /** Trip ID if active */
  tripId?: string;

  /** Itinerary ID if available */
  itineraryId?: string;

  /** Current route/page */
  currentRoute: string;

  /** Is trip in progress (started and not completed) */
  isTripInProgress: boolean;

  /** Current day number if trip is active */
  currentDay?: number;

  /** Total days in trip */
  totalDays?: number;
}

// ============================================================================
// Active Companion State Types
// ============================================================================

/**
 * Real-time context for the active companion
 */
export interface ActiveCompanionContext {
  /** User's current location */
  location: LocationContext | null;

  /** Is location being tracked */
  isTrackingLocation: boolean;

  /** Location error if any */
  locationError: string | null;

  /** Current weather */
  weather: WeatherContext | null;

  /** Current time period */
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'night';

  /** Current hour (0-23) */
  currentHour: number;

  /** Day of trip */
  dayNumber: number;

  /** City user is in (if known) */
  currentCity?: string;
}

/**
 * Proactive message from the companion
 */
export interface ProactiveMessage {
  /** Unique ID */
  id: string;

  /** Message type */
  type:
    | 'location_trigger'    // "You're near X"
    | 'time_trigger'        // "It's almost golden hour"
    | 'weather_alert'       // "Rain expected in 30 min"
    | 'activity_reminder'   // "Your reservation is in 1 hour"
    | 'recommendation'      // "Great time for a coffee break"
    | 'discovery'           // "Hidden gem nearby"
    | 'encouragement';      // "You've seen 3 spots today!"

  /** Main message text */
  message: string;

  /** Optional secondary text */
  detail?: string;

  /** Priority level */
  priority: 'low' | 'medium' | 'high';

  /** Related activity if any */
  relatedActivity?: EnrichedActivity;

  /** Why this message is relevant */
  reason?: WhyNowReason;

  /** Action the user can take */
  action?: {
    label: string;
    type: 'navigate' | 'add' | 'skip' | 'view' | 'dismiss';
    payload?: unknown;
  };

  /** When this message was created */
  createdAt: Date;

  /** When this message expires */
  expiresAt?: Date;

  /** Has user dismissed this */
  isDismissed: boolean;
}

/**
 * Active companion recommendation set
 */
export interface ActiveRecommendations {
  /** Current top recommendations */
  items: EnrichedActivity[];

  /** How recommendations were determined */
  mode: RecommendationMode;

  /** When these were generated */
  generatedAt: Date;

  /** Should refresh (context changed) */
  isStale: boolean;
}

/**
 * State for the active companion
 */
export interface ActiveCompanionState {
  /** Current sub-mode */
  subMode: ActiveCompanionSubMode;

  /** Real-time context */
  context: ActiveCompanionContext;

  /** Current recommendations */
  recommendations: ActiveRecommendations;

  /** Pending proactive messages */
  proactiveMessages: ProactiveMessage[];

  /** Craving search results (if in craving mode) */
  cravingResults?: CravingSearchResult;

  /** Serendipity result (if in serendipity mode) */
  serendipityResult?: SerendipityResult | null;

  /** Is companion panel expanded */
  isExpanded: boolean;

  /** Is loading */
  isLoading: boolean;

  /** Error if any */
  error: string | null;

  /** Last user interaction */
  lastInteractionAt: Date;

  /** Is companion in "proactive" state (will initiate) */
  isProactive: boolean;
}

// ============================================================================
// Active Companion Actions
// ============================================================================

/**
 * Actions available in active companion mode
 */
export interface ActiveCompanionActions {
  // Mode switching
  /** Switch to a different sub-mode */
  switchMode: (mode: ActiveCompanionSubMode) => void;

  // Recommendation actions
  /** Refresh recommendations */
  refreshRecommendations: () => void;

  /** Select an activity */
  selectActivity: (activityId: string) => void;

  /** Skip an activity */
  skipActivity: (activityId: string, reason?: string) => void;

  /** Complete an activity */
  completeActivity: (activityId: string) => void;

  // Craving mode
  /** Search for a craving */
  searchCraving: (query: string) => void;

  /** Clear craving search */
  clearCraving: () => void;

  // Serendipity mode
  /** Get a surprise */
  getSurprise: () => void;

  /** Accept the surprise */
  acceptSurprise: () => void;

  /** Reject and get another */
  rejectSurprise: () => void;

  // Proactive messages
  /** Dismiss a proactive message */
  dismissMessage: (messageId: string) => void;

  /** Act on a proactive message */
  actOnMessage: (messageId: string) => void;

  /** Clear all proactive messages */
  clearMessages: () => void;

  // Location
  /** Start location tracking */
  startLocationTracking: () => void;

  /** Stop location tracking */
  stopLocationTracking: () => void;

  /** Manually refresh location */
  refreshLocation: () => void;

  // UI
  /** Expand/collapse panel */
  togglePanel: () => void;

  /** Enable/disable proactive mode */
  setProactive: (enabled: boolean) => void;
}

// ============================================================================
// Hook Return Type
// ============================================================================

/**
 * Return type for useActiveCompanion hook
 */
export interface UseActiveCompanionReturn extends ActiveCompanionState, ActiveCompanionActions {
  /** Mode context */
  modeContext: CompanionModeContext;

  /** Is this hook ready to use */
  isReady: boolean;

  /** Get system prompt for current mode */
  getSystemPrompt: () => string;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the active companion
 */
export interface ActiveCompanionConfig {
  /** Enable proactive messages */
  enableProactive: boolean;

  /** Enable location tracking */
  enableLocation: boolean;

  /** Proactive message cooldown in seconds */
  proactiveCooldown: number;

  /** Number of recommendations to show */
  recommendationCount: number;

  /** Enable haptic feedback */
  enableHaptics: boolean;

  /** Maximum proactive messages to queue */
  maxProactiveMessages: number;
}

/**
 * Default configuration
 */
export const DEFAULT_ACTIVE_COMPANION_CONFIG: ActiveCompanionConfig = {
  enableProactive: true,
  enableLocation: true,
  proactiveCooldown: 120, // 2 minutes
  recommendationCount: 3,
  enableHaptics: true,
  maxProactiveMessages: 5,
};

// ============================================================================
// Proactive Trigger Types
// ============================================================================

/**
 * Trigger conditions for proactive messages
 */
export interface ProactiveTrigger {
  /** Trigger type */
  type: ProactiveMessage['type'];

  /** Condition to check */
  condition: (context: ActiveCompanionContext, recommendations: EnrichedActivity[]) => boolean;

  /** Generate message if triggered */
  generateMessage: (
    context: ActiveCompanionContext,
    recommendations: EnrichedActivity[]
  ) => Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'>;

  /** Cooldown for this specific trigger type */
  cooldownSeconds?: number;

  /** Priority of this trigger */
  priority: ProactiveMessage['priority'];
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Quick action chip for the companion UI
 */
export interface QuickActionChip {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'muted';
}

/**
 * Get time period from hour
 */
export function getTimePeriodFromHour(hour: number): ActiveCompanionContext['timePeriod'] {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
