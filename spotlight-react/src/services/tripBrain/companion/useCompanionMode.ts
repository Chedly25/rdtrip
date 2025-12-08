/**
 * useCompanionMode Hook
 *
 * WI-7.1: Hook for detecting and managing companion mode
 *
 * Determines whether the companion should be in:
 * - Planning mode: User is planning/discovering their trip
 * - Active mode: User is on an active trip
 *
 * Detection is based on:
 * 1. URL path (e.g., /trip/123 indicates active)
 * 2. Trip status from useTrip hook
 * 3. Explicit mode override
 */

import { useMemo, useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import type { CompanionMode, CompanionModeContext, ActiveCompanionSubMode } from './types';

// ============================================================================
// Route Pattern Detection
// ============================================================================

/**
 * Route patterns that indicate active trip mode
 */
const ACTIVE_ROUTE_PATTERNS = [
  /^\/trip\/[^/]+/,           // /trip/:tripId
  /^\/active/,                 // /active/*
  /^\/live/,                   // /live/*
  /^\/companion\/active/,      // /companion/active
];

/**
 * Route patterns that indicate planning mode
 */
const PLANNING_ROUTE_PATTERNS = [
  /^\/discover/,               // /discover
  /^\/plan/,                   // /plan
  /^\/itinerary\/[^/]+\/edit/, // /itinerary/:id/edit
  /^\/route/,                  // /route
  /^\/spotlight/,              // /spotlight
];

/**
 * Check if path matches active mode
 */
function isActivePath(path: string): boolean {
  return ACTIVE_ROUTE_PATTERNS.some(pattern => pattern.test(path));
}

/**
 * Check if path matches planning mode
 */
function isPlanningPath(path: string): boolean {
  return PLANNING_ROUTE_PATTERNS.some(pattern => pattern.test(path));
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseCompanionModeOptions {
  /** Force a specific mode */
  forceMode?: CompanionMode;

  /** Trip status from useTrip hook */
  tripStatus?: 'active' | 'paused' | 'completed' | 'none';

  /** Trip ID if known */
  tripId?: string;

  /** Itinerary ID if known */
  itineraryId?: string;
}

export interface UseCompanionModeReturn {
  /** Current mode context */
  modeContext: CompanionModeContext;

  /** Current mode */
  mode: CompanionMode;

  /** Is in active mode */
  isActive: boolean;

  /** Is in planning mode */
  isPlanning: boolean;

  /** Force switch to a mode */
  forceMode: (mode: CompanionMode) => void;

  /** Clear forced mode */
  clearForceMode: () => void;

  /** Get mode-specific system prompt prefix */
  getModePromptPrefix: () => string;
}

// ============================================================================
// Hook
// ============================================================================

export function useCompanionMode(options: UseCompanionModeOptions = {}): UseCompanionModeReturn {
  const { forceMode: initialForceMode, tripStatus, tripId, itineraryId } = options;

  // Router
  const location = useLocation();
  const params = useParams<{ tripId?: string }>();

  // Forced mode state
  const [forcedMode, setForcedMode] = useState<CompanionMode | undefined>(initialForceMode);

  // Detect mode from context
  const detectedMode = useMemo<CompanionMode>(() => {
    // Forced mode takes precedence
    if (forcedMode) return forcedMode;

    // Check trip status
    if (tripStatus === 'active') return 'active';

    // Check URL path
    if (isActivePath(location.pathname)) return 'active';
    if (isPlanningPath(location.pathname)) return 'planning';

    // Check if trip ID is in URL
    if (params.tripId) return 'active';

    // Default to planning
    return 'planning';
  }, [forcedMode, tripStatus, location.pathname, params.tripId]);

  // Build mode context
  const modeContext = useMemo<CompanionModeContext>(() => {
    const effectiveTripId = tripId || params.tripId;

    return {
      mode: detectedMode,
      activeSubMode: detectedMode === 'active' ? 'choice' : undefined,
      hasActiveTrip: Boolean(effectiveTripId) || tripStatus === 'active',
      tripId: effectiveTripId,
      itineraryId,
      currentRoute: location.pathname,
      isTripInProgress: tripStatus === 'active',
    };
  }, [detectedMode, tripId, params.tripId, tripStatus, itineraryId, location.pathname]);

  // Actions
  const forceMode = useCallback((mode: CompanionMode) => {
    setForcedMode(mode);
  }, []);

  const clearForceMode = useCallback(() => {
    setForcedMode(undefined);
  }, []);

  // Get mode-specific prompt prefix
  const getModePromptPrefix = useCallback(() => {
    if (detectedMode === 'active') {
      return `[ACTIVE TRIP MODE] The user is currently on an active trip. Be proactive, location-aware, and time-sensitive.`;
    }
    return `[PLANNING MODE] The user is planning their trip. Help them discover and decide.`;
  }, [detectedMode]);

  return {
    modeContext,
    mode: detectedMode,
    isActive: detectedMode === 'active',
    isPlanning: detectedMode === 'planning',
    forceMode,
    clearForceMode,
    getModePromptPrefix,
  };
}

// ============================================================================
// Utility: Get Sub-Mode Label
// ============================================================================

export function getSubModeLabel(subMode: ActiveCompanionSubMode): string {
  const labels: Record<ActiveCompanionSubMode, string> = {
    choice: 'Recommendations',
    craving: 'What do you want?',
    serendipity: 'Surprise me',
    rest: 'Need a break',
    nearby: 'What\'s nearby',
    chat: 'Chat',
  };
  return labels[subMode];
}

export function getSubModeIcon(subMode: ActiveCompanionSubMode): string {
  const icons: Record<ActiveCompanionSubMode, string> = {
    choice: '✨',
    craving: '🔍',
    serendipity: '🎲',
    rest: '☕',
    nearby: '📍',
    chat: '💬',
  };
  return icons[subMode];
}

export default useCompanionMode;
