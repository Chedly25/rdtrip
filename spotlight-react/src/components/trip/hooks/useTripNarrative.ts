/**
 * useTripNarrative - Living Story Hook
 *
 * Fetches and manages the evolving trip narrative that builds
 * throughout the day based on moments and activities.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { tripCompanionApi } from '../services/tripCompanion';
import type { TripNarrative, TripMoment } from '../services/tripCompanion';

interface UseTripNarrativeOptions {
  tripId: string;
  dayNumber: number;
  enabled?: boolean;
  refreshInterval?: number; // ms, 0 to disable
}

interface UseTripNarrativeReturn {
  narrative: TripNarrative | null;
  moments: TripMoment[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  recordMoment: (moment: RecordMomentInput) => Promise<TripMoment | null>;
  recordingMoment: boolean;
}

interface RecordMomentInput {
  activityId?: string;
  activityName: string;
  momentType: 'highlight' | 'memory' | 'completed' | 'skipped' | 'discovery';
  note?: string;
  photo?: string;
  rating?: number;
  coordinates?: { lat: number; lng: number };
}

export function useTripNarrative(options: UseTripNarrativeOptions): UseTripNarrativeReturn {
  const { tripId, dayNumber, enabled = true, refreshInterval = 120000 } = options;

  const [narrative, setNarrative] = useState<TripNarrative | null>(null);
  const [moments, setMoments] = useState<TripMoment[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordingMoment, setRecordingMoment] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastDayNumber = useRef<number | null>(null);

  // Fetch narrative and moments
  const fetchNarrativeData = useCallback(async () => {
    if (!tripId || dayNumber < 1) return;

    // Only show loading on initial fetch or day change
    if (lastDayNumber.current !== dayNumber) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch both narrative and moments in parallel
      const [narrativeRes, momentsRes] = await Promise.all([
        tripCompanionApi.getNarrative(tripId, dayNumber),
        tripCompanionApi.getMoments(tripId, dayNumber),
      ]);

      setNarrative(narrativeRes.narrative);
      setMoments(momentsRes.moments);
      lastDayNumber.current = dayNumber;
    } catch (err) {
      console.error('Narrative fetch error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [tripId, dayNumber]);

  // Fetch on mount and day change
  useEffect(() => {
    if (!enabled) return;
    fetchNarrativeData();
  }, [enabled, fetchNarrativeData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchNarrativeData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, refreshInterval, fetchNarrativeData]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await fetchNarrativeData();
  }, [fetchNarrativeData]);

  // Record a new moment
  const recordMoment = useCallback(
    async (momentInput: RecordMomentInput): Promise<TripMoment | null> => {
      if (!tripId) return null;

      setRecordingMoment(true);

      try {
        const result = await tripCompanionApi.recordMoment(tripId, {
          ...momentInput,
          dayNumber,
        });

        if (result.success && result.moment) {
          // Add to local moments list
          setMoments((prev) => [...prev, result.moment]);

          // Refresh narrative after a delay (give AI time to update)
          setTimeout(() => {
            fetchNarrativeData();
          }, 2000);

          return result.moment;
        }

        return null;
      } catch (err) {
        console.error('Record moment error:', err);
        setError(err as Error);
        return null;
      } finally {
        setRecordingMoment(false);
      }
    },
    [tripId, dayNumber, fetchNarrativeData]
  );

  return {
    narrative,
    moments,
    loading,
    error,
    refresh,
    recordMoment,
    recordingMoment,
  };
}

export default useTripNarrative;
