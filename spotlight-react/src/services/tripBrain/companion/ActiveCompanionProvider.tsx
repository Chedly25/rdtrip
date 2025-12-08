/**
 * ActiveCompanionProvider
 *
 * WI-7.1: Context provider for active trip companion mode
 *
 * This provider combines:
 * - TripBrainProvider for intelligence features
 * - useActiveCompanion hook for active mode state
 * - Mode detection for planning vs active switching
 *
 * Usage:
 * ```tsx
 * <ActiveCompanionProvider
 *   tripId="trip-123"
 *   itinerary={itinerary}
 *   preferences={preferences}
 * >
 *   <App />
 * </ActiveCompanionProvider>
 * ```
 */

import React, { createContext, useContext, useMemo } from 'react';

import { TripBrainProvider, type TripBrainProviderProps } from '../hooks/TripBrainProvider';
import { useActiveCompanion, type UseActiveCompanionOptions } from './useActiveCompanion';
import type { UseActiveCompanionReturn, ActiveCompanionConfig } from './types';

// ============================================================================
// Context
// ============================================================================

const ActiveCompanionContext = createContext<UseActiveCompanionReturn | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

export interface ActiveCompanionProviderProps extends Omit<TripBrainProviderProps, 'children'> {
  children: React.ReactNode;

  /** Trip ID */
  tripId?: string;

  /** Current day number */
  dayNumber?: number;

  /** Active companion configuration */
  companionConfig?: Partial<ActiveCompanionConfig>;
}

// ============================================================================
// Inner Provider (uses TripBrain context)
// ============================================================================

interface InnerProviderProps {
  children: React.ReactNode;
  options: UseActiveCompanionOptions;
}

function InnerActiveCompanionProvider({ children, options }: InnerProviderProps) {
  const companion = useActiveCompanion(options);

  return (
    <ActiveCompanionContext.Provider value={companion}>
      {children}
    </ActiveCompanionContext.Provider>
  );
}

// ============================================================================
// Main Provider
// ============================================================================

export function ActiveCompanionProvider({
  children,
  tripId,
  dayNumber = 1,
  companionConfig,
  // TripBrain props
  itinerary,
  preferences,
  memory,
  enableLocation = true,
  geolocationOptions,
  config,
  recommendationCount,
  onEvent,
}: ActiveCompanionProviderProps) {
  // Build options for useActiveCompanion
  const activeCompanionOptions = useMemo<UseActiveCompanionOptions>(
    () => ({
      tripId,
      dayNumber,
      config: companionConfig,
    }),
    [tripId, dayNumber, companionConfig]
  );

  return (
    <TripBrainProvider
      itinerary={itinerary}
      preferences={preferences}
      memory={memory}
      enableLocation={enableLocation}
      geolocationOptions={geolocationOptions}
      config={config}
      recommendationCount={recommendationCount}
      onEvent={onEvent}
    >
      <InnerActiveCompanionProvider options={activeCompanionOptions}>
        {children}
      </InnerActiveCompanionProvider>
    </TripBrainProvider>
  );
}

// ============================================================================
// Consumer Hook
// ============================================================================

/**
 * Hook to access the active companion context
 *
 * @throws If used outside of ActiveCompanionProvider
 */
export function useActiveCompanionContext(): UseActiveCompanionReturn {
  const context = useContext(ActiveCompanionContext);

  if (context === undefined) {
    throw new Error(
      'useActiveCompanionContext must be used within an ActiveCompanionProvider'
    );
  }

  return context;
}

/**
 * Safe version that returns null outside provider
 */
export function useActiveCompanionContextSafe(): UseActiveCompanionReturn | null {
  const context = useContext(ActiveCompanionContext);
  return context ?? null;
}

// ============================================================================
// Selector Hooks
// ============================================================================

/**
 * Hook to get just the recommendations
 */
export function useActiveRecommendations() {
  const { recommendations, isLoading, refreshRecommendations } = useActiveCompanionContext();
  return { recommendations, isLoading, refresh: refreshRecommendations };
}

/**
 * Hook to get proactive messages
 */
export function useProactiveMessages() {
  const { proactiveMessages, dismissMessage, actOnMessage, clearMessages } =
    useActiveCompanionContext();
  return { messages: proactiveMessages, dismiss: dismissMessage, act: actOnMessage, clear: clearMessages };
}

/**
 * Hook to get companion mode info
 */
export function useCompanionMode() {
  const { modeContext, subMode, switchMode } = useActiveCompanionContext();
  return { modeContext, subMode, switchMode };
}

/**
 * Hook for craving/search mode
 */
export function useCravingMode() {
  const { subMode, cravingResults, searchCraving, clearCraving } = useActiveCompanionContext();
  return {
    isActive: subMode === 'craving',
    results: cravingResults,
    search: searchCraving,
    clear: clearCraving,
  };
}

/**
 * Hook for serendipity mode
 */
export function useSerendipityMode() {
  const { subMode, serendipityResult, getSurprise, acceptSurprise, rejectSurprise } =
    useActiveCompanionContext();
  return {
    isActive: subMode === 'serendipity',
    result: serendipityResult,
    getSurprise,
    accept: acceptSurprise,
    reject: rejectSurprise,
  };
}

/**
 * Hook for activity actions
 */
export function useActivityActions() {
  const { selectActivity, skipActivity, completeActivity } = useActiveCompanionContext();
  return { select: selectActivity, skip: skipActivity, complete: completeActivity };
}

// ============================================================================
// Export
// ============================================================================

export default ActiveCompanionProvider;
