/**
 * useTrip Hook - Trip in Progress Mode State Management
 *
 * Phase 2: React hook for managing trip state and API calls
 *
 * Features:
 * - Active trip detection and loading
 * - Today's activities with real-time status
 * - Check-in management
 * - Location tracking integration
 * - Progress dashboard data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getActiveTrip,
  getTripById,
  getTodayActivities,
  getTripProgress,
  startTrip,
  pauseTrip,
  completeTrip,
  advanceDay,
  createCheckin,
  updateTripLocation,
  type ActiveTrip,
  type TodayData,
  type TripProgress,
  type CheckinData,
  type LocationData,
} from '../services/trip';

interface UseTripState {
  // Data
  trip: ActiveTrip | null;
  todayData: TodayData | null;
  progress: TripProgress | null;

  // Loading states
  loading: boolean;
  todayLoading: boolean;
  progressLoading: boolean;

  // Error state
  error: string | null;

  // Computed
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  currentDay: number;
  totalDays: number;
}

interface UseTripActions {
  // Trip lifecycle
  start: (routeId: string, itineraryId?: string) => Promise<ActiveTrip | null>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  complete: () => Promise<void>;
  nextDay: () => Promise<void>;

  // Data refresh
  refresh: () => Promise<void>;
  refreshToday: () => Promise<void>;
  refreshProgress: () => Promise<void>;

  // Check-in
  checkin: (data: CheckinData) => Promise<void>;

  // Location
  updateLocation: (location: LocationData) => Promise<void>;
}

export function useTrip(tripId?: string): UseTripState & UseTripActions {
  // State
  const [trip, setTrip] = useState<ActiveTrip | null>(null);
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [progress, setProgress] = useState<TripProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayLoading, setTodayLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed values
  const isActive = trip?.status === 'active';
  const isPaused = trip?.status === 'paused';
  const isCompleted = trip?.status === 'completed';
  const currentDay = trip?.current_day || 1;
  const totalDays = todayData?.totalDays || progress?.totalDays || 1;

  // Load trip data
  const loadTrip = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (tripId) {
        // Load specific trip
        const result = await getTripById(tripId);
        setTrip(result.trip);
      } else {
        // Load active trip for user
        const result = await getActiveTrip();
        setTrip(result.trip);
      }
    } catch (err) {
      console.error('[useTrip] Failed to load trip:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trip');
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Load today's activities
  const loadToday = useCallback(async () => {
    if (!trip?.id) return;

    setTodayLoading(true);

    try {
      const data = await getTodayActivities(trip.id);
      setTodayData(data);
    } catch (err) {
      console.error('[useTrip] Failed to load today:', err);
    } finally {
      setTodayLoading(false);
    }
  }, [trip?.id]);

  // Load progress data
  const loadProgress = useCallback(async () => {
    if (!trip?.id) return;

    setProgressLoading(true);

    try {
      const data = await getTripProgress(trip.id);
      setProgress(data);
    } catch (err) {
      console.error('[useTrip] Failed to load progress:', err);
    } finally {
      setProgressLoading(false);
    }
  }, [trip?.id]);

  // Initial load
  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  // Load today data when trip is available
  useEffect(() => {
    if (trip?.id && isActive) {
      loadToday();
      loadProgress();
    }
  }, [trip?.id, isActive, loadToday, loadProgress]);

  // Actions
  const start = useCallback(
    async (routeId: string, itineraryId?: string): Promise<ActiveTrip | null> => {
      setError(null);

      try {
        const result = await startTrip(routeId, itineraryId);
        setTrip(result.trip);
        return result.trip;
      } catch (err) {
        console.error('[useTrip] Failed to start trip:', err);
        setError(err instanceof Error ? err.message : 'Failed to start trip');
        return null;
      }
    },
    []
  );

  const pause = useCallback(async () => {
    if (!trip?.id) return;

    try {
      const result = await pauseTrip(trip.id);
      setTrip(result.trip);
    } catch (err) {
      console.error('[useTrip] Failed to pause trip:', err);
      setError(err instanceof Error ? err.message : 'Failed to pause trip');
    }
  }, [trip?.id]);

  const resume = useCallback(async () => {
    if (!trip?.route_id) return;

    try {
      const result = await startTrip(trip.route_id, trip.itinerary_id);
      setTrip(result.trip);
    } catch (err) {
      console.error('[useTrip] Failed to resume trip:', err);
      setError(err instanceof Error ? err.message : 'Failed to resume trip');
    }
  }, [trip?.route_id, trip?.itinerary_id]);

  const complete = useCallback(async () => {
    if (!trip?.id) return;

    try {
      const result = await completeTrip(trip.id);
      setTrip(result.trip);
    } catch (err) {
      console.error('[useTrip] Failed to complete trip:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete trip');
    }
  }, [trip?.id]);

  const nextDay = useCallback(async () => {
    if (!trip?.id) return;

    try {
      const result = await advanceDay(trip.id);
      setTrip((prev) => (prev ? { ...prev, current_day: result.currentDay } : null));

      // Refresh today data for new day
      await loadToday();
    } catch (err) {
      console.error('[useTrip] Failed to advance day:', err);
      setError(err instanceof Error ? err.message : 'Failed to advance day');
    }
  }, [trip?.id, loadToday]);

  const checkin = useCallback(
    async (data: CheckinData) => {
      if (!trip?.id) return;

      try {
        await createCheckin(trip.id, {
          ...data,
          dayNumber: currentDay,
        });

        // Refresh data
        await Promise.all([loadToday(), loadProgress()]);
      } catch (err) {
        console.error('[useTrip] Failed to create check-in:', err);
        setError(err instanceof Error ? err.message : 'Failed to check in');
        throw err;
      }
    },
    [trip?.id, currentDay, loadToday, loadProgress]
  );

  const updateLocation = useCallback(
    async (location: LocationData) => {
      if (!trip?.id) return;

      try {
        await updateTripLocation(trip.id, location);

        // Update local state with new location
        setTrip((prev) =>
          prev
            ? {
                ...prev,
                last_location: {
                  lat: location.latitude,
                  lng: location.longitude,
                  accuracy: location.accuracy,
                  timestamp: new Date().toISOString(),
                  city: location.city,
                  country: location.country,
                  address: location.address,
                },
                last_location_update: new Date().toISOString(),
              }
            : null
        );
      } catch (err) {
        console.error('[useTrip] Failed to update location:', err);
        // Don't throw - location updates are not critical
      }
    },
    [trip?.id]
  );

  // Refresh functions
  const refresh = useCallback(async () => {
    await loadTrip();
  }, [loadTrip]);

  const refreshToday = useCallback(async () => {
    await loadToday();
  }, [loadToday]);

  const refreshProgress = useCallback(async () => {
    await loadProgress();
  }, [loadProgress]);

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Data
      trip,
      todayData,
      progress,

      // Loading states
      loading,
      todayLoading,
      progressLoading,

      // Error state
      error,

      // Computed
      isActive,
      isPaused,
      isCompleted,
      currentDay,
      totalDays,

      // Actions
      start,
      pause,
      resume,
      complete,
      nextDay,
      refresh,
      refreshToday,
      refreshProgress,
      checkin,
      updateLocation,
    }),
    [
      trip,
      todayData,
      progress,
      loading,
      todayLoading,
      progressLoading,
      error,
      isActive,
      isPaused,
      isCompleted,
      currentDay,
      totalDays,
      start,
      pause,
      resume,
      complete,
      nextDay,
      refresh,
      refreshToday,
      refreshProgress,
      checkin,
      updateLocation,
    ]
  );
}

export default useTrip;
