/**
 * useArrivalDetection Hook
 *
 * WI-7.9: Smart arrival detection for trip activities
 *
 * Features:
 * - Detects when user arrives at planned activities (default 50m threshold)
 * - Battery-efficient with smart polling (faster when near, slower when far)
 * - Tracks arrival history within session
 * - Cooldown prevents duplicate triggers
 * - Integrates with existing geolocation infrastructure
 * - Provides callbacks for arrival events
 *
 * Battery Efficiency Strategy:
 * - When user is far (>500m from nearest): Poll every 30s
 * - When user is approaching (100-500m): Poll every 15s
 * - When user is near (<100m): Poll every 5s
 * - When user is stationary: Reduce polling frequency
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useGeolocation } from '../../../services/tripBrain/hooks';
import { calculateDistance } from '../../../services/tripBrain/filters/locationFilter';
import type { EnrichedActivity, LocationContext } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface ArrivalEvent {
  /** Activity that was arrived at */
  activity: EnrichedActivity;
  /** When arrival was detected */
  arrivedAt: Date;
  /** Distance when arrival was triggered (in meters) */
  triggerDistance: number;
  /** User location at arrival */
  location: LocationContext;
}

export interface ArrivalDetectionState {
  /** Currently nearby activities (within extended threshold) */
  nearbyActivities: NearbyActivity[];
  /** Activities user has arrived at this session */
  arrivedActivities: ArrivalEvent[];
  /** Is actively detecting */
  isDetecting: boolean;
  /** Current polling interval in ms */
  pollingInterval: number;
  /** Nearest activity distance in meters */
  nearestDistance: number | null;
  /** Is location available */
  hasLocation: boolean;
  /** Error if any */
  error: string | null;
}

export interface NearbyActivity {
  activity: EnrichedActivity;
  distance: number;
  isApproaching: boolean;
  estimatedArrivalMinutes: number | null;
}

export interface UseArrivalDetectionOptions {
  /** Activities to monitor for arrivals */
  activities: EnrichedActivity[];
  /** Distance threshold for arrival (default 50m) */
  arrivalThreshold?: number;
  /** Extended threshold for "nearby" status (default 200m) */
  nearbyThreshold?: number;
  /** Cooldown before same activity can trigger again (ms) */
  arrivalCooldown?: number;
  /** Enable/disable detection */
  enabled?: boolean;
  /** Called when user arrives at an activity */
  onArrival?: (event: ArrivalEvent) => void;
  /** Called when user leaves an activity area */
  onDeparture?: (activityId: string) => void;
}

export interface UseArrivalDetectionReturn extends ArrivalDetectionState {
  /** Start detection */
  startDetection: () => void;
  /** Stop detection */
  stopDetection: () => void;
  /** Mark an arrival as acknowledged (user took action) */
  acknowledgeArrival: (activityId: string) => void;
  /** Clear arrival history */
  clearArrivals: () => void;
  /** Check if user has arrived at specific activity */
  hasArrivedAt: (activityId: string) => boolean;
  /** Get arrival event for activity */
  getArrival: (activityId: string) => ArrivalEvent | undefined;
  /** Manually trigger location refresh */
  refreshLocation: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Polling intervals based on proximity */
const POLLING_INTERVALS = {
  FAR: 30000,       // >500m: 30 seconds
  APPROACHING: 15000, // 100-500m: 15 seconds
  NEAR: 5000,       // <100m: 5 seconds
  STATIONARY: 60000, // Not moving: 60 seconds
} as const;

/** Distance thresholds for polling adjustment */
const DISTANCE_THRESHOLDS = {
  NEAR: 100,
  APPROACHING: 500,
} as const;

/** Average walking speed in m/s */
const WALKING_SPEED_MS = 1.4;

/** Storage key for persisting arrivals */
const STORAGE_KEY = 'arrival_detection_history';

// ============================================================================
// Helper Functions
// ============================================================================

function getActivityCoordinates(activity: EnrichedActivity): { lat: number; lng: number } | null {
  const place = activity.activity.place;
  if (place?.coordinates) {
    return { lat: place.coordinates.lat, lng: place.coordinates.lng };
  }
  return null;
}

function calculatePollingInterval(
  nearestDistance: number | null,
  isMoving: boolean
): number {
  if (!isMoving) {
    return POLLING_INTERVALS.STATIONARY;
  }
  if (nearestDistance === null) {
    return POLLING_INTERVALS.FAR;
  }
  if (nearestDistance < DISTANCE_THRESHOLDS.NEAR) {
    return POLLING_INTERVALS.NEAR;
  }
  if (nearestDistance < DISTANCE_THRESHOLDS.APPROACHING) {
    return POLLING_INTERVALS.APPROACHING;
  }
  return POLLING_INTERVALS.FAR;
}

function estimateArrivalTime(distance: number, speed: number | undefined): number | null {
  const effectiveSpeed = speed && speed > 0.5 ? speed : WALKING_SPEED_MS;
  const timeSeconds = distance / effectiveSpeed;
  return Math.ceil(timeSeconds / 60); // Convert to minutes
}

// ============================================================================
// Hook
// ============================================================================

export function useArrivalDetection(
  options: UseArrivalDetectionOptions
): UseArrivalDetectionReturn {
  const {
    activities,
    arrivalThreshold = 50,
    nearbyThreshold = 200,
    arrivalCooldown = 30 * 60 * 1000, // 30 minutes
    enabled = true,
    onArrival,
    onDeparture,
  } = options;

  // Geolocation
  const {
    location,
    isLoading: locationLoading,
    error: locationError,
    permissionStatus,
    startWatching,
    stopWatching,
    refresh: refreshLocation,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000,
  });

  // State
  const [isDetecting, setIsDetecting] = useState(false);
  const [arrivedActivities, setArrivedActivities] = useState<ArrivalEvent[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [pollingInterval, setPollingInterval] = useState<number>(POLLING_INTERVALS.FAR);

  // Refs for tracking
  const lastDistancesRef = useRef<Map<string, number>>(new Map());
  const arrivalCooldownRef = useRef<Map<string, number>>(new Map());
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load persisted arrivals on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ArrivalEvent[];
        // Only keep arrivals from today
        const today = new Date().toDateString();
        const todayArrivals = parsed.filter(
          (a) => new Date(a.arrivedAt).toDateString() === today
        );
        setArrivedActivities(todayArrivals);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist arrivals
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arrivedActivities));
    } catch {
      // Ignore storage errors
    }
  }, [arrivedActivities]);

  // Calculate nearby activities and distances
  const { nearbyActivities, nearestDistance } = useMemo(() => {
    if (!location) {
      return { nearbyActivities: [], nearestDistance: null };
    }

    const { coordinates } = location;
    const nearby: NearbyActivity[] = [];
    let nearest: number | null = null;

    activities.forEach((activity) => {
      const coords = getActivityCoordinates(activity);
      if (!coords) return;

      const distance = calculateDistance(
        { lat: coordinates.lat, lng: coordinates.lng },
        coords
      );

      if (nearest === null || distance < nearest) {
        nearest = distance;
      }

      if (distance <= nearbyThreshold) {
        const lastDistance = lastDistancesRef.current.get(activity.activity.id);
        const isApproaching = lastDistance !== undefined && distance < lastDistance;

        nearby.push({
          activity,
          distance,
          isApproaching,
          estimatedArrivalMinutes: distance > arrivalThreshold
            ? estimateArrivalTime(distance, location.speed)
            : null,
        });
      }

      lastDistancesRef.current.set(activity.activity.id, distance);
    });

    // Sort by distance
    nearby.sort((a, b) => a.distance - b.distance);

    return { nearbyActivities: nearby, nearestDistance: nearest };
  }, [activities, location, nearbyThreshold, arrivalThreshold]);

  // Check for arrivals
  const checkArrivals = useCallback(() => {
    if (!location || !isDetecting) return;

    const now = Date.now();

    nearbyActivities.forEach(({ activity, distance }) => {
      const activityId = activity.activity.id;

      // Check if within arrival threshold
      if (distance <= arrivalThreshold) {
        // Check cooldown
        const lastArrival = arrivalCooldownRef.current.get(activityId);
        if (lastArrival && now - lastArrival < arrivalCooldown) {
          return;
        }

        // Check if not already in current session arrivals
        const alreadyArrived = arrivedActivities.some(
          (a) => a.activity.activity.id === activityId
        );
        if (alreadyArrived) {
          return;
        }

        // Trigger arrival!
        const arrivalEvent: ArrivalEvent = {
          activity,
          arrivedAt: new Date(),
          triggerDistance: distance,
          location,
        };

        setArrivedActivities((prev) => [...prev, arrivalEvent]);
        arrivalCooldownRef.current.set(activityId, now);

        onArrival?.(arrivalEvent);
      }
    });

    // Check for departures (activities user was near but no longer)
    if (onDeparture) {
      const currentNearbyIds = new Set(
        nearbyActivities.map((n) => n.activity.activity.id)
      );

      arrivedActivities.forEach((arrival) => {
        const activityId = arrival.activity.activity.id;
        if (!currentNearbyIds.has(activityId) && !acknowledgedIds.has(activityId)) {
          onDeparture(activityId);
        }
      });
    }
  }, [
    location,
    isDetecting,
    nearbyActivities,
    arrivalThreshold,
    arrivalCooldown,
    arrivedActivities,
    acknowledgedIds,
    onArrival,
    onDeparture,
  ]);

  // Update polling interval based on proximity and movement
  useEffect(() => {
    const isMoving = location?.isMoving ?? false;
    const newInterval = calculatePollingInterval(nearestDistance, isMoving);
    setPollingInterval(newInterval);
  }, [nearestDistance, location?.isMoving]);

  // Run arrival checks
  useEffect(() => {
    if (!isDetecting || !enabled) return;

    checkArrivals();

    // Set up periodic checks
    pollTimerRef.current = setInterval(checkArrivals, pollingInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isDetecting, enabled, checkArrivals, pollingInterval]);

  // ==================== Actions ====================

  const startDetection = useCallback(() => {
    if (permissionStatus === 'denied') {
      return;
    }
    setIsDetecting(true);
    startWatching();
  }, [permissionStatus, startWatching]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    stopWatching();
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, [stopWatching]);

  const acknowledgeArrival = useCallback((activityId: string) => {
    setAcknowledgedIds((prev) => new Set([...prev, activityId]));
  }, []);

  const clearArrivals = useCallback(() => {
    setArrivedActivities([]);
    setAcknowledgedIds(new Set());
    arrivalCooldownRef.current.clear();
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasArrivedAt = useCallback(
    (activityId: string) => {
      return arrivedActivities.some((a) => a.activity.activity.id === activityId);
    },
    [arrivedActivities]
  );

  const getArrival = useCallback(
    (activityId: string) => {
      return arrivedActivities.find((a) => a.activity.activity.id === activityId);
    },
    [arrivedActivities]
  );

  // Auto-start if enabled
  useEffect(() => {
    if (enabled && activities.length > 0 && permissionStatus === 'granted') {
      startDetection();
    } else {
      stopDetection();
    }

    return () => stopDetection();
  }, [enabled, activities.length, permissionStatus, startDetection, stopDetection]);

  // ==================== Return ====================

  return useMemo(
    () => ({
      // State
      nearbyActivities,
      arrivedActivities,
      isDetecting,
      pollingInterval,
      nearestDistance,
      hasLocation: !!location && !locationLoading,
      error: locationError?.message ?? null,

      // Actions
      startDetection,
      stopDetection,
      acknowledgeArrival,
      clearArrivals,
      hasArrivedAt,
      getArrival,
      refreshLocation,
    }),
    [
      nearbyActivities,
      arrivedActivities,
      isDetecting,
      pollingInterval,
      nearestDistance,
      location,
      locationLoading,
      locationError,
      startDetection,
      stopDetection,
      acknowledgeArrival,
      clearArrivals,
      hasArrivedAt,
      getArrival,
      refreshLocation,
    ]
  );
}

export default useArrivalDetection;
