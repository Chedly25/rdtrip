/**
 * useCravingMode Hook
 *
 * WI-7.4: Integration hook connecting CravingMode UI with TripBrain
 *
 * This hook provides:
 * - Search function with debouncing
 * - Results from TripBrain craving search
 * - Actions: search, clear, select
 * - Integration with ActiveCompanion context
 */

import { useCallback, useMemo } from 'react';
import { useActiveCompanionContextSafe } from '../../../services/tripBrain/companion';
import { useTripBrainSafe } from '../../../services/tripBrain/hooks';
import type { CravingSearchResult } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface UseCravingModeOptions {
  /** Maximum results to return */
  maxResults?: number;
  /** Whether to require open places */
  requireOpen?: boolean;
  /** Maximum distance in meters */
  maxDistance?: number;
}

export interface UseCravingModeReturn {
  /** Current search results */
  results: CravingSearchResult | undefined;
  /** Whether search is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Search for a craving */
  searchCraving: (query: string) => void;
  /** Clear search and results */
  clearCraving: () => void;
  /** Select an activity from results */
  selectActivity: (activityId: string) => void;
  /** Switch back to choice mode */
  goBackToChoice: () => void;
  /** Whether the mode is ready */
  isReady: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useCravingMode(
  options: UseCravingModeOptions = {}
): UseCravingModeReturn {
  const { maxResults = 5, requireOpen = false, maxDistance } = options;

  // Try to get ActiveCompanion context (may be null)
  const companion = useActiveCompanionContextSafe();

  // Also try TripBrain directly as fallback
  const tripBrain = useTripBrainSafe();

  // Get results from companion context
  const results = useMemo(() => {
    return companion?.cravingResults;
  }, [companion?.cravingResults]);

  // Loading state
  const isLoading = companion?.isLoading ?? false;

  // Error state
  const error = companion?.error ?? null;

  // Ready state
  const isReady = companion?.isReady ?? tripBrain?.isReady ?? false;

  // ==================== Actions ====================

  const searchCraving = useCallback((query: string) => {
    if (companion) {
      companion.searchCraving(query);
    } else if (tripBrain?.tripBrain) {
      // Direct TripBrain fallback
      const searchResults = tripBrain.tripBrain.searchCraving({
        query,
        limit: maxResults,
        maxDistance,
        requireOpen,
      });
      // Note: This won't update state in this case - companion context is preferred
      console.log('Direct TripBrain search:', searchResults);
    }
  }, [companion, tripBrain, maxResults, maxDistance, requireOpen]);

  const clearCraving = useCallback(() => {
    if (companion) {
      companion.clearCraving();
    }
  }, [companion]);

  const selectActivity = useCallback((activityId: string) => {
    if (companion) {
      companion.selectActivity(activityId);
    } else if (tripBrain) {
      tripBrain.recordChoice(activityId);
    }
  }, [companion, tripBrain]);

  const goBackToChoice = useCallback(() => {
    if (companion) {
      companion.switchMode('choice');
    }
  }, [companion]);

  return {
    results,
    isLoading,
    error,
    searchCraving,
    clearCraving,
    selectActivity,
    goBackToChoice,
    isReady,
  };
}

export default useCravingMode;
