/**
 * useActiveCompanion Hook
 *
 * WI-7.1: React hook for active trip companion mode
 *
 * This hook provides the active companion functionality:
 * - Mode detection (planning vs active)
 * - TripBrain integration for recommendations
 * - Proactive message generation
 * - Location-aware suggestions
 * - Real-time context (weather, time)
 *
 * Usage:
 * ```tsx
 * const {
 *   subMode,
 *   recommendations,
 *   proactiveMessages,
 *   switchMode,
 *   selectActivity,
 * } = useActiveCompanion();
 * ```
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useTripBrainSafe } from '../hooks/TripBrainProvider';

import type {
  CompanionModeContext,
  ActiveCompanionSubMode,
  ActiveCompanionContext,
  ActiveCompanionState,
  ProactiveMessage,
  ActiveRecommendations,
  UseActiveCompanionReturn,
  ActiveCompanionConfig,
} from './types';

import {
  DEFAULT_ACTIVE_COMPANION_CONFIG,
  getTimePeriodFromHour,
} from './types';

import type { CravingSearchResult, SerendipityResult } from '../types';

import {
  generateActiveCompanionPrompt,
  type ActivePromptContext,
} from './activeCompanionPrompts';

// ============================================================================
// Helper: Generate unique ID
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Hook: useActiveCompanion
// ============================================================================

export interface UseActiveCompanionOptions {
  /** Trip ID */
  tripId?: string;

  /** Current day number */
  dayNumber?: number;

  /** Configuration overrides */
  config?: Partial<ActiveCompanionConfig>;
}

export function useActiveCompanion(
  options: UseActiveCompanionOptions = {}
): UseActiveCompanionReturn {
  const { tripId, dayNumber = 1, config: configOverrides } = options;

  // Merge config
  const config = useMemo(
    () => ({
      ...DEFAULT_ACTIVE_COMPANION_CONFIG,
      ...configOverrides,
    }),
    [configOverrides]
  );

  // Router location for mode detection
  const routerLocation = useLocation();

  // TripBrain context (may be null if not in provider)
  const tripBrain = useTripBrainSafe();

  // ==================== State ====================

  const [subMode, setSubMode] = useState<ActiveCompanionSubMode>('choice');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProactive, setIsProactiveState] = useState(config.enableProactive);
  const [lastInteractionAt, setLastInteractionAt] = useState(new Date());
  const [proactiveMessages, setProactiveMessages] = useState<ProactiveMessage[]>([]);
  const [cravingResults, setCravingResults] = useState<CravingSearchResult | undefined>();
  const [serendipityResult, setSerendipityResult] = useState<SerendipityResult | null | undefined>();

  // Refs
  const lastProactiveRef = useRef<Date | null>(null);

  // ==================== Mode Context ====================

  const modeContext = useMemo<CompanionModeContext>(() => {
    // Detect if we're in active trip mode based on:
    // 1. URL path contains /trip/ or /active/
    // 2. tripId is provided
    // 3. TripBrain has loaded itinerary
    const isActiveRoute =
      routerLocation.pathname.includes('/trip/') ||
      routerLocation.pathname.includes('/active/');
    const hasTripBrainData = tripBrain?.isReady ?? false;
    const hasActiveTrip = Boolean(tripId) || isActiveRoute || hasTripBrainData;

    return {
      mode: hasActiveTrip ? 'active' : 'planning',
      activeSubMode: hasActiveTrip ? subMode : undefined,
      hasActiveTrip,
      tripId,
      currentRoute: routerLocation.pathname,
      isTripInProgress: hasActiveTrip,
      currentDay: dayNumber,
      totalDays: tripBrain?.state?.itinerary?.days.length,
    };
  }, [routerLocation.pathname, tripId, tripBrain?.isReady, tripBrain?.state?.itinerary, subMode, dayNumber]);

  // ==================== Active Context ====================

  const activeContext = useMemo<ActiveCompanionContext>(() => {
    const hour = new Date().getHours();
    const location = tripBrain?.location ?? null;

    return {
      location,
      isTrackingLocation: tripBrain?.isTrackingLocation ?? false,
      locationError: tripBrain?.locationError ?? null,
      weather: tripBrain?.state?.weather ?? null,
      timePeriod: getTimePeriodFromHour(hour),
      currentHour: hour,
      dayNumber,
      currentCity: location?.cityName,
    };
  }, [tripBrain?.location, tripBrain?.isTrackingLocation, tripBrain?.locationError, tripBrain?.state?.weather, dayNumber]);

  // ==================== Recommendations ====================

  const recommendations = useMemo<ActiveRecommendations>(() => {
    const items = tripBrain?.recommendations ?? [];

    return {
      items,
      mode: 'choice',
      generatedAt: new Date(),
      isStale: false,
    };
  }, [tripBrain?.recommendations]);

  // ==================== Actions ====================

  const recordInteraction = useCallback(() => {
    setLastInteractionAt(new Date());
  }, []);

  const switchMode = useCallback((mode: ActiveCompanionSubMode) => {
    setSubMode(mode);
    recordInteraction();

    // Clear mode-specific state when switching
    if (mode !== 'craving') {
      setCravingResults(undefined);
    }
    if (mode !== 'serendipity') {
      setSerendipityResult(undefined);
    }
  }, [recordInteraction]);

  const refreshRecommendations = useCallback(() => {
    if (tripBrain) {
      const recs = tripBrain.getRecommendations({ count: config.recommendationCount });
      // Recommendations will be updated via context
      void recs;
    }
    recordInteraction();
  }, [tripBrain, config.recommendationCount, recordInteraction]);

  const selectActivity = useCallback((activityId: string) => {
    tripBrain?.recordChoice(activityId);
    recordInteraction();
  }, [tripBrain, recordInteraction]);

  const skipActivity = useCallback((activityId: string, reason?: string) => {
    tripBrain?.recordSkip(activityId, reason);
    recordInteraction();
  }, [tripBrain, recordInteraction]);

  const completeActivity = useCallback((activityId: string) => {
    tripBrain?.recordCompletion(activityId);
    recordInteraction();
  }, [tripBrain, recordInteraction]);

  // Craving mode
  const searchCraving = useCallback((query: string) => {
    if (!tripBrain) return;

    setIsLoading(true);
    setSubMode('craving');

    try {
      const results = tripBrain.searchCraving({ query, limit: 5 });
      setCravingResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }

    recordInteraction();
  }, [tripBrain, recordInteraction]);

  const clearCraving = useCallback(() => {
    setCravingResults(undefined);
    setSubMode('choice');
    recordInteraction();
  }, [recordInteraction]);

  // Serendipity mode
  const getSurprise = useCallback(() => {
    if (!tripBrain) return;

    setIsLoading(true);
    setSubMode('serendipity');

    try {
      const result = tripBrain.getSerendipity();
      setSerendipityResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Surprise failed');
    } finally {
      setIsLoading(false);
    }

    recordInteraction();
  }, [tripBrain, recordInteraction]);

  const acceptSurprise = useCallback(() => {
    if (serendipityResult?.activity) {
      tripBrain?.recordChoice(serendipityResult.activity.activity.id);
    }
    setSerendipityResult(undefined);
    setSubMode('choice');
    recordInteraction();
  }, [tripBrain, serendipityResult, recordInteraction]);

  const rejectSurprise = useCallback(() => {
    if (serendipityResult?.activity) {
      tripBrain?.recordSkip(serendipityResult.activity.activity.id, 'not_interested');
    }
    // Get another surprise
    getSurprise();
  }, [tripBrain, serendipityResult, getSurprise]);

  // Proactive messages
  const dismissMessage = useCallback((messageId: string) => {
    setProactiveMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, isDismissed: true } : m)
    );
    recordInteraction();
  }, [recordInteraction]);

  const actOnMessage = useCallback((messageId: string) => {
    const message = proactiveMessages.find(m => m.id === messageId);
    if (!message?.relatedActivity) return;

    // Select the related activity
    selectActivity(message.relatedActivity.activity.id);
    dismissMessage(messageId);
  }, [proactiveMessages, selectActivity, dismissMessage]);

  const clearMessages = useCallback(() => {
    setProactiveMessages([]);
    recordInteraction();
  }, [recordInteraction]);

  // Location
  const startLocationTracking = useCallback(() => {
    tripBrain?.startLocationTracking();
    recordInteraction();
  }, [tripBrain, recordInteraction]);

  const stopLocationTracking = useCallback(() => {
    tripBrain?.stopLocationTracking();
    recordInteraction();
  }, [tripBrain, recordInteraction]);

  const refreshLocation = useCallback(() => {
    tripBrain?.refreshLocation();
    recordInteraction();
  }, [tripBrain, recordInteraction]);

  // UI
  const togglePanel = useCallback(() => {
    setIsExpanded(prev => !prev);
    recordInteraction();
  }, [recordInteraction]);

  const setProactive = useCallback((enabled: boolean) => {
    setIsProactiveState(enabled);
    recordInteraction();
  }, [recordInteraction]);

  // System prompt - uses WI-7.2 comprehensive prompt
  const getSystemPrompt = useCallback(() => {
    const promptContext: ActivePromptContext = {
      timePeriod: activeContext.timePeriod,
      currentHour: activeContext.currentHour,
      dayNumber: activeContext.dayNumber,
      location: activeContext.location,
      weather: activeContext.weather,
      recommendations: recommendations.items,
      preferences: tripBrain?.state?.preferences ?? null,
      subMode,
      cityName: activeContext.currentCity,
    };
    return generateActiveCompanionPrompt(promptContext);
  }, [activeContext, recommendations.items, tripBrain?.state?.preferences, subMode]);

  // ==================== Proactive Message Generation ====================

  useEffect(() => {
    if (!isProactive || !config.enableProactive) return;
    if (modeContext.mode !== 'active') return;
    if (!tripBrain?.isReady) return;

    // Check cooldown
    if (lastProactiveRef.current) {
      const elapsed = (Date.now() - lastProactiveRef.current.getTime()) / 1000;
      if (elapsed < config.proactiveCooldown) return;
    }

    // Generate proactive message based on context
    const recs = recommendations.items;
    if (recs.length === 0) return;

    const topRec = recs[0];
    const whyNow = topRec.score.whyNow;

    // Only generate if we have a compelling "why now"
    if (topRec.score.score < 0.6) return;

    // Check if this is distance-triggered
    if (
      whyNow.primary.category === 'distance' &&
      topRec.distanceMeters &&
      topRec.distanceMeters < 200
    ) {
      const newMessage: ProactiveMessage = {
        id: generateId(),
        type: 'location_trigger',
        message: `You're just ${topRec.distanceFormatted} from ${topRec.activity.place.name}`,
        detail: whyNow.primary.text,
        priority: 'medium',
        relatedActivity: topRec,
        reason: whyNow,
        action: {
          label: 'View',
          type: 'view',
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
        isDismissed: false,
      };

      setProactiveMessages(prev => {
        // Limit queue size
        const filtered = prev.filter(m => !m.isDismissed).slice(0, config.maxProactiveMessages - 1);
        return [newMessage, ...filtered];
      });

      lastProactiveRef.current = new Date();
    }
  }, [
    isProactive,
    config.enableProactive,
    config.proactiveCooldown,
    config.maxProactiveMessages,
    modeContext.mode,
    tripBrain?.isReady,
    recommendations.items,
  ]);

  // ==================== Auto-start location if configured ====================

  useEffect(() => {
    if (config.enableLocation && modeContext.mode === 'active' && tripBrain) {
      tripBrain.startLocationTracking();
    }

    return () => {
      if (tripBrain) {
        tripBrain.stopLocationTracking();
      }
    };
  }, [config.enableLocation, modeContext.mode, tripBrain]);

  // ==================== Build State Object ====================

  const state: ActiveCompanionState = {
    subMode,
    context: activeContext,
    recommendations,
    proactiveMessages: proactiveMessages.filter(m => !m.isDismissed),
    cravingResults,
    serendipityResult,
    isExpanded,
    isLoading,
    error,
    lastInteractionAt,
    isProactive,
  };

  // ==================== Return ====================

  return {
    // State
    ...state,

    // Mode context
    modeContext,

    // Is ready
    isReady: modeContext.mode === 'active' && (tripBrain?.isReady ?? false),

    // Actions
    switchMode,
    refreshRecommendations,
    selectActivity,
    skipActivity,
    completeActivity,
    searchCraving,
    clearCraving,
    getSurprise,
    acceptSurprise,
    rejectSurprise,
    dismissMessage,
    actOnMessage,
    clearMessages,
    startLocationTracking,
    stopLocationTracking,
    refreshLocation,
    togglePanel,
    setProactive,
    getSystemPrompt,
  };
}

export default useActiveCompanion;
