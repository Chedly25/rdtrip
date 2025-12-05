/**
 * useSmartHints - Contextual Time Intelligence Hook
 *
 * Fetches smart time-based hints for current activity:
 * - Departure alerts (when to leave)
 * - Crowd levels (best times to visit)
 * - Golden hour notifications (photography timing)
 * - Weather warnings
 * - Closing time alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { tripCompanionApi } from '../services/tripCompanion';
import type { SmartHint } from '../services/tripCompanion';

interface UseSmartHintsOptions {
  tripId: string;
  activityId: string | null;
  enabled?: boolean;
  refreshInterval?: number; // ms, 0 to disable
}

interface UseSmartHintsReturn {
  hints: SmartHint[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  dismissHint: (index: number) => void;
  activeHint: SmartHint | null;
}

export function useSmartHints(options: UseSmartHintsOptions): UseSmartHintsReturn {
  const { tripId, activityId, enabled = true, refreshInterval = 60000 } = options;

  const [hints, setHints] = useState<SmartHint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [dismissedIndexes, setDismissedIndexes] = useState<Set<number>>(new Set());

  const lastActivityId = useRef<string | null>(null);

  // Fetch hints for current activity
  const fetchHints = useCallback(async () => {
    if (!tripId || !activityId) {
      setHints([]);
      return;
    }

    // Only show loading on initial fetch or activity change
    if (lastActivityId.current !== activityId) {
      setLoading(true);
      setDismissedIndexes(new Set()); // Reset dismissed on activity change
    }
    setError(null);

    try {
      const data = await tripCompanionApi.getSmartHints({
        tripId,
        activityId,
        currentTime: new Date().toISOString(),
      });

      setHints(data.hints);
      lastActivityId.current = activityId;
    } catch (err) {
      console.error('Smart hints fetch error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [tripId, activityId]);

  // Fetch on mount and activity change
  useEffect(() => {
    if (!enabled || !activityId) return;
    fetchHints();
  }, [enabled, activityId, fetchHints]);

  // Auto-refresh interval (hints are time-sensitive)
  useEffect(() => {
    if (!enabled || refreshInterval <= 0 || !activityId) return;

    const interval = setInterval(() => {
      fetchHints();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, refreshInterval, activityId, fetchHints]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchHints();
  }, [fetchHints]);

  // Dismiss a hint (client-side only)
  const dismissHint = useCallback((index: number) => {
    setDismissedIndexes((prev) => new Set([...prev, index]));
  }, []);

  // Filter out dismissed hints and get active (most urgent non-dismissed)
  const visibleHints = hints.filter((_, i) => !dismissedIndexes.has(i));

  // Sort by urgency: high > medium > low
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  const sortedHints = [...visibleHints].sort(
    (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
  );

  const activeHint = sortedHints[0] || null;

  return {
    hints: sortedHints,
    loading,
    error,
    refresh,
    dismissHint,
    activeHint,
  };
}

export default useSmartHints;
