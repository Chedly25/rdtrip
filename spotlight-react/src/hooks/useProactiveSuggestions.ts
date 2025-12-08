/**
 * useProactiveSuggestions
 *
 * WI-3.5: Gentle proactive suggestions from the planning companion
 *
 * Philosophy:
 * - Less is more - companion should be helpful, not annoying
 * - Only suggest when it adds clear value
 * - Respect users who don't want to chat
 * - Never interrupt flow, only enhance it
 *
 * Architecture Decision:
 * - Separate from useContextObserver (observation) and usePlanningCompanion (conversation)
 * - This hook focuses specifically on when/how to proactively surface suggestions
 * - Rate limiting and engagement tracking live here
 *
 * Triggers:
 * 1. User adds a city → Offer to highlight hidden gems
 * 2. User removes multiple cities → Ask what kind of stops they want
 * 3. User idle for 2+ minutes → Gently offer assistance
 *
 * Constraints:
 * - Maximum 1 proactive suggestion per 5 minutes
 * - Disabled if user hasn't engaged with companion at all
 * - Can be dismissed without consequence
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDiscoveryStore, type DiscoveryAction } from '../stores/discoveryStore';
import type { CompanionSuggestion } from '../services/planningCompanion';

// ============================================================================
// Types
// ============================================================================

export type ProactiveTrigger =
  | 'city_added'           // User added a city to trip
  | 'cities_removed'       // User removed multiple cities
  | 'idle_browsing'        // User has been silent for 2+ minutes
  | 'trip_nearly_ready'    // Trip looks complete, prompt to proceed
  | 'hidden_gem_match';    // Found hidden gems matching their style

export interface ProactiveSuggestion extends CompanionSuggestion {
  trigger: ProactiveTrigger;
  triggeredAt: Date;
  cityName?: string;       // Context for city-specific suggestions
  dismissed: boolean;
}

export interface UseProactiveSuggestionsReturn {
  // Current active suggestion (null if none or rate limited)
  activeSuggestion: ProactiveSuggestion | null;

  // Dismiss the current suggestion
  dismissSuggestion: () => void;

  // Act on suggestion (sends to companion)
  actOnSuggestion: () => string | null;

  // State
  isCompanionEngaged: boolean;
  lastSuggestionTime: Date | null;
  secondsUntilNextSuggestion: number;

  // Debug info
  debug: {
    recentTriggers: Array<{ trigger: ProactiveTrigger; time: Date }>;
    suppressionReason: string | null;
  };
}

// ============================================================================
// Constants
// ============================================================================

const RATE_LIMIT_MS = 5 * 60 * 1000;        // 5 minutes between suggestions
const IDLE_THRESHOLD_MS = 2 * 60 * 1000;    // 2 minutes idle before suggesting
const MULTIPLE_REMOVALS_THRESHOLD = 2;       // Number of removals to trigger
const ENGAGEMENT_MEMORY_MS = 30 * 60 * 1000; // Remember engagement for 30 mins

// ============================================================================
// Suggestion Templates
// ============================================================================

/**
 * Generate suggestion for city addition
 */
function createCityAddedSuggestion(cityName: string): ProactiveSuggestion {
  return {
    type: 'explore_places',
    trigger: 'city_added',
    message: `Nice choice! ${cityName} has some incredible hidden spots. Want me to highlight a few?`,
    action: {
      label: 'Show me',
      handler: 'show_hidden_gems',
      data: { cityName },
    },
    priority: 'medium',
    triggeredAt: new Date(),
    cityName,
    dismissed: false,
  };
}

/**
 * Generate suggestion for multiple city removals
 */
function createRemovalsSuggestion(_removedCount: number): ProactiveSuggestion {
  // Note: removedCount available for future personalization
  return {
    type: 'compare_cities',
    trigger: 'cities_removed',
    message: `Narrowing it down! What kind of stops are you hoping for?`,
    action: {
      label: 'Help me choose',
      handler: 'help_choose_cities',
    },
    priority: 'medium',
    triggeredAt: new Date(),
    dismissed: false,
  };
}

/**
 * Generate suggestion for idle browsing
 */
function createIdleSuggestion(_hasRoute: boolean, selectedCount: number): ProactiveSuggestion {
  // Customize message based on progress
  // Note: hasRoute available for future context-aware messaging
  let message: string;
  let actionLabel: string;
  let handler: string;

  if (selectedCount === 0) {
    message = `Finding what you're looking for? I can suggest some stops based on your route.`;
    actionLabel = 'Suggest stops';
    handler = 'suggest_stops';
  } else if (selectedCount < 3) {
    message = `Your trip is shaping up! Want me to suggest a few more hidden gems?`;
    actionLabel = 'Find more';
    handler = 'suggest_more';
  } else {
    message = `Looking good so far! Need any help with your selections?`;
    actionLabel = 'Get help';
    handler = 'general_help';
  }

  return {
    type: 'explore_places',
    trigger: 'idle_browsing',
    message,
    action: {
      label: actionLabel,
      handler,
    },
    priority: 'low',
    triggeredAt: new Date(),
    dismissed: false,
  };
}

/**
 * Generate suggestion when trip looks ready
 */
function createReadySuggestion(totalNights: number, selectedCities: number): ProactiveSuggestion {
  return {
    type: 'proceed_prompt',
    trigger: 'trip_nearly_ready',
    message: `Your ${totalNights}-night adventure through ${selectedCities} cities is looking great! Ready to see your detailed itinerary?`,
    action: {
      label: 'Generate itinerary',
      handler: 'proceed_to_itinerary',
    },
    priority: 'low',
    triggeredAt: new Date(),
    dismissed: false,
  };
}

// ============================================================================
// Main Hook
// ============================================================================

export function useProactiveSuggestions(): UseProactiveSuggestionsReturn {
  const {
    route,
    recentActions,
    getRecentActions,
    tripSummary,
  } = useDiscoveryStore();

  // ==================== State ====================
  const [activeSuggestion, setActiveSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [isCompanionEngaged, setIsCompanionEngaged] = useState(false);
  const [lastSuggestionTime, setLastSuggestionTime] = useState<Date | null>(null);
  const [suppressionReason, setSuppressionReason] = useState<string | null>(null);
  const [recentTriggers, setRecentTriggers] = useState<Array<{ trigger: ProactiveTrigger; time: Date }>>([]);

  // ==================== Refs ====================
  const lastProcessedActionRef = useRef<string | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef<Date>(new Date());
  const engagementTimeRef = useRef<Date | null>(null);
  const removalCountRef = useRef(0);

  // ==================== Computed ====================
  const secondsUntilNextSuggestion = useMemo(() => {
    if (!lastSuggestionTime) return 0;
    const elapsed = Date.now() - lastSuggestionTime.getTime();
    const remaining = Math.max(0, RATE_LIMIT_MS - elapsed);
    return Math.ceil(remaining / 1000);
  }, [lastSuggestionTime]);

  const selectedCities = useMemo(() => {
    if (!route) return [];
    return [route.origin, ...route.suggestedCities.filter(c => c.isSelected), route.destination];
  }, [route]);

  // ==================== Rate Limiting ====================
  const canShowSuggestion = useCallback((): { allowed: boolean; reason: string | null } => {
    // Check if companion has been engaged
    if (!isCompanionEngaged) {
      return { allowed: false, reason: 'Companion not yet engaged' };
    }

    // Check rate limit
    if (lastSuggestionTime) {
      const elapsed = Date.now() - lastSuggestionTime.getTime();
      if (elapsed < RATE_LIMIT_MS) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
        return { allowed: false, reason: `Rate limited (${remainingSeconds}s remaining)` };
      }
    }

    // Check if there's already an active suggestion
    if (activeSuggestion && !activeSuggestion.dismissed) {
      return { allowed: false, reason: 'Suggestion already active' };
    }

    return { allowed: true, reason: null };
  }, [isCompanionEngaged, lastSuggestionTime, activeSuggestion]);

  // ==================== Show Suggestion ====================
  const showSuggestion = useCallback((suggestion: ProactiveSuggestion) => {
    const { allowed, reason } = canShowSuggestion();

    if (!allowed) {
      setSuppressionReason(reason);
      return false;
    }

    setActiveSuggestion(suggestion);
    setLastSuggestionTime(new Date());
    setSuppressionReason(null);
    setRecentTriggers(prev => [
      ...prev.slice(-4),
      { trigger: suggestion.trigger, time: new Date() }
    ]);

    return true;
  }, [canShowSuggestion]);

  // ==================== Dismiss Suggestion ====================
  const dismissSuggestion = useCallback(() => {
    setActiveSuggestion(prev =>
      prev ? { ...prev, dismissed: true } : null
    );

    // Clear after animation
    setTimeout(() => {
      setActiveSuggestion(null);
    }, 300);
  }, []);

  // ==================== Act On Suggestion ====================
  const actOnSuggestion = useCallback((): string | null => {
    if (!activeSuggestion) return null;

    // Return the message to send to companion
    const message = activeSuggestion.message;
    dismissSuggestion();
    return message;
  }, [activeSuggestion, dismissSuggestion]);

  // Note: markEngaged is exposed via return value for components to call
  // when user first interacts with companion

  // ==================== Watch Actions ====================
  useEffect(() => {
    const actions = getRecentActions();
    if (actions.length === 0) return;

    const latestAction = actions[actions.length - 1];
    const actionKey = `${latestAction.type}-${latestAction.timestamp.getTime()}`;

    // Skip if we've already processed this action
    if (lastProcessedActionRef.current === actionKey) return;
    lastProcessedActionRef.current = actionKey;

    // Update activity time
    lastActivityTimeRef.current = new Date();

    // Process action for triggers
    processAction(latestAction);
  }, [recentActions, getRecentActions]);

  // Process action to check for triggers
  const processAction = useCallback((action: DiscoveryAction) => {
    const data = action.data as Record<string, unknown> | undefined;

    switch (action.type) {
      case 'city_added': {
        const cityName = (data?.cityName as string) || 'this city';
        const suggestion = createCityAddedSuggestion(cityName);
        showSuggestion(suggestion);
        removalCountRef.current = 0; // Reset removal counter
        break;
      }

      case 'city_removed': {
        removalCountRef.current += 1;
        if (removalCountRef.current >= MULTIPLE_REMOVALS_THRESHOLD) {
          const suggestion = createRemovalsSuggestion(removalCountRef.current);
          showSuggestion(suggestion);
          removalCountRef.current = 0; // Reset after suggesting
        }
        break;
      }

      // Mark companion engaged when user interacts with chat
      case 'proceed_clicked': {
        // User is moving forward, clear any pending suggestions
        setActiveSuggestion(null);
        break;
      }
    }
  }, [showSuggestion]);

  // ==================== Idle Detection ====================
  useEffect(() => {
    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Only run idle detection if companion is engaged
    if (!isCompanionEngaged) return;

    // Set new timer
    idleTimerRef.current = setTimeout(() => {
      const timeSinceActivity = Date.now() - lastActivityTimeRef.current.getTime();

      if (timeSinceActivity >= IDLE_THRESHOLD_MS) {
        const suggestion = createIdleSuggestion(
          !!route,
          selectedCities.length
        );
        showSuggestion(suggestion);
      }
    }, IDLE_THRESHOLD_MS);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isCompanionEngaged, route, selectedCities.length, showSuggestion, recentActions]);

  // ==================== Trip Ready Detection ====================
  useEffect(() => {
    if (!tripSummary || !route || !isCompanionEngaged) return;

    const totalNights = tripSummary.totalNights || 0;
    const allocatedNights = selectedCities.reduce((sum, c) => sum + (c.nights ?? 1), 0);
    const nightsDiff = Math.abs(totalNights - allocatedNights);

    // If nights are close to matching and we have 3+ cities, trip might be ready
    if (nightsDiff <= 1 && selectedCities.length >= 3) {
      const suggestion = createReadySuggestion(totalNights, selectedCities.length);
      // Use a slight delay to not interrupt active planning
      const timer = setTimeout(() => {
        showSuggestion(suggestion);
      }, 30000); // 30 seconds after trip looks ready

      return () => clearTimeout(timer);
    }
  }, [tripSummary, route, selectedCities, isCompanionEngaged, showSuggestion]);

  // ==================== Engagement Expiry ====================
  useEffect(() => {
    if (!engagementTimeRef.current) return;

    const timer = setInterval(() => {
      if (engagementTimeRef.current) {
        const elapsed = Date.now() - engagementTimeRef.current.getTime();
        if (elapsed > ENGAGEMENT_MEMORY_MS) {
          setIsCompanionEngaged(false);
          engagementTimeRef.current = null;
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, []);

  // ==================== Return ====================
  return {
    activeSuggestion: activeSuggestion?.dismissed ? null : activeSuggestion,
    dismissSuggestion,
    actOnSuggestion,
    isCompanionEngaged,
    lastSuggestionTime,
    secondsUntilNextSuggestion,
    debug: {
      recentTriggers,
      suppressionReason,
    },
  };
}

// ============================================================================
// Companion Engagement Hook
// ============================================================================

/**
 * Hook to track when user engages with the companion
 * Use this in the chat component to mark engagement
 */
export function useCompanionEngagement() {
  const [hasEngaged, setHasEngaged] = useState(false);
  const engagementTimeRef = useRef<Date | null>(null);

  const markEngaged = useCallback(() => {
    if (!hasEngaged) {
      setHasEngaged(true);
      engagementTimeRef.current = new Date();
    }
  }, [hasEngaged]);

  const isEngaged = useMemo(() => {
    if (!hasEngaged || !engagementTimeRef.current) return false;
    const elapsed = Date.now() - engagementTimeRef.current.getTime();
    return elapsed < ENGAGEMENT_MEMORY_MS;
  }, [hasEngaged]);

  return { isEngaged, markEngaged };
}

// ============================================================================
// Exports
// ============================================================================

// Types ProactiveTrigger and ProactiveSuggestion are exported inline above
