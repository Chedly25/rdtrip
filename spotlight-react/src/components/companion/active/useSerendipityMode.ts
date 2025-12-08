/**
 * useSerendipityMode Hook
 *
 * WI-7.5: Integration hook for Serendipity "Surprise Me" mode
 *
 * This hook provides:
 * - One-tap surprise discovery
 * - Session tracking (never repeats rejected)
 * - Accept/reject flow with automatic refetch
 * - Integration with ActiveCompanion context
 *
 * Design Philosophy:
 * - Wrapper around ActiveCompanion serendipity functions
 * - Tracks session state (surprises shown, rejected IDs)
 * - Provides clean API for SerendipityMode component
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useActiveCompanionContextSafe } from '../../../services/tripBrain/companion';
import { useTripBrainSafe } from '../../../services/tripBrain/hooks';
import type { SerendipityResult } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface UseSerendipityModeOptions {
  /** Auto-fetch first surprise when entering mode */
  autoFetch?: boolean;
  /** Max surprises to show before suggesting break */
  maxSurprises?: number;
}

export interface UseSerendipityModeReturn {
  /** Current surprise result */
  result: SerendipityResult | null | undefined;
  /** Whether loading a surprise */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Number of surprises shown this session */
  surprisesShown: number;
  /** IDs of rejected surprises (won't repeat) */
  rejectedIds: Set<string>;
  /** Get a new surprise */
  getSurprise: () => void;
  /** Accept current surprise */
  acceptSurprise: () => void;
  /** Reject current and get another */
  rejectSurprise: () => void;
  /** Go back to choice mode */
  goBackToChoice: () => void;
  /** Reset session (clear rejected, reset count) */
  resetSession: () => void;
  /** Whether the mode is ready */
  isReady: boolean;
  /** Whether max surprises reached */
  isSessionExhausted: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useSerendipityMode(
  options: UseSerendipityModeOptions = {}
): UseSerendipityModeReturn {
  const { maxSurprises = 10 } = options;

  // Context access
  const companion = useActiveCompanionContextSafe();
  const tripBrain = useTripBrainSafe();

  // Session state (persists during mode but resets on unmount)
  const [surprisesShown, setSurprisesShown] = useState(0);
  const rejectedIdsRef = useRef<Set<string>>(new Set());
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  // Get result from companion context
  const result = companion?.serendipityResult;

  // Loading state
  const isLoading = companion?.isLoading ?? false;

  // Error state
  const error = companion?.error ?? null;

  // Ready state
  const isReady = companion?.isReady ?? tripBrain?.isReady ?? false;

  // Session exhausted
  const isSessionExhausted = surprisesShown >= maxSurprises;

  // ==================== Actions ====================

  const getSurprise = useCallback(() => {
    if (companion) {
      companion.getSurprise();
      setSurprisesShown((prev) => prev + 1);
    } else if (tripBrain?.tripBrain) {
      // Direct TripBrain fallback
      const surprise = tripBrain.tripBrain.getSerendipity();
      if (surprise) {
        setSurprisesShown((prev) => prev + 1);
      }
    }
  }, [companion, tripBrain]);

  const acceptSurprise = useCallback(() => {
    if (companion) {
      companion.acceptSurprise();
    } else if (result?.activity && tripBrain) {
      tripBrain.recordChoice(result.activity.activity.id);
    }
  }, [companion, tripBrain, result]);

  const rejectSurprise = useCallback(() => {
    // Track rejected ID to avoid repeats
    if (result?.activity) {
      const activityId = result.activity.activity.id;
      rejectedIdsRef.current.add(activityId);
      setRejectedIds(new Set(rejectedIdsRef.current));
    }

    if (companion) {
      companion.rejectSurprise();
    } else {
      // Manual rejection + get new surprise
      if (result?.activity && tripBrain) {
        tripBrain.recordSkip(result.activity.activity.id, 'not_interested');
      }
      getSurprise();
    }
  }, [companion, tripBrain, result, getSurprise]);

  const goBackToChoice = useCallback(() => {
    if (companion) {
      companion.switchMode('choice');
    }
  }, [companion]);

  const resetSession = useCallback(() => {
    setSurprisesShown(0);
    rejectedIdsRef.current.clear();
    setRejectedIds(new Set());
  }, []);

  // ==================== Return ====================

  return useMemo(
    () => ({
      result,
      isLoading,
      error,
      surprisesShown,
      rejectedIds,
      getSurprise,
      acceptSurprise,
      rejectSurprise,
      goBackToChoice,
      resetSession,
      isReady,
      isSessionExhausted,
    }),
    [
      result,
      isLoading,
      error,
      surprisesShown,
      rejectedIds,
      getSurprise,
      acceptSurprise,
      rejectSurprise,
      goBackToChoice,
      resetSession,
      isReady,
      isSessionExhausted,
    ]
  );
}

export default useSerendipityMode;
