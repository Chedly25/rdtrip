/**
 * useSerendipity - Discovery Engine Hook
 *
 * Fetches nearby hidden gems, local secrets, and serendipitous discoveries
 * based on the user's current location during a trip.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { tripCompanionApi } from '../services/tripCompanion';
import type { SerendipityCard } from '../services/tripCompanion';

interface UseSerendipityOptions {
  tripId: string;
  enabled?: boolean;
  radius?: number;
  refreshInterval?: number; // ms, 0 to disable auto-refresh
}

interface UseSerendipityReturn {
  discoveries: SerendipityCard[];
  loading: boolean;
  error: Error | null;
  location: GeolocationCoordinates | null;
  refresh: () => Promise<void>;
  shuffle: () => void;
  saveDiscovery: (card: SerendipityCard) => void;
  savedIds: Set<string>;
}

export function useSerendipity(options: UseSerendipityOptions): UseSerendipityReturn {
  const { tripId, enabled = true, radius = 500, refreshInterval = 0 } = options;

  const [discoveries, setDiscoveries] = useState<SerendipityCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const lastFetchLocation = useRef<{ lat: number; lng: number } | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch user location
  useEffect(() => {
    if (!enabled) return;

    let watchId: number;

    const startWatching = () => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation(position.coords);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          // Don't set error state - just log it, we might get location later
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000, // Cache for 30 seconds
          timeout: 10000,
        }
      );
    };

    // Check if geolocation is available
    if ('geolocation' in navigator) {
      startWatching();
    } else {
      setError(new Error('Geolocation not available'));
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled]);

  // Fetch discoveries when location changes significantly
  const fetchDiscoveries = useCallback(async () => {
    if (!location || !tripId) return;

    // Check if location changed significantly (> 100m)
    if (lastFetchLocation.current) {
      const distance = calculateDistance(
        lastFetchLocation.current,
        { lat: location.latitude, lng: location.longitude }
      );
      if (distance < 100) {
        // Location hasn't changed much, skip fetch
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const data = await tripCompanionApi.getSerendipity({
        tripId,
        lat: location.latitude,
        lng: location.longitude,
        radius,
      });

      setDiscoveries(data.discoveries);
      lastFetchLocation.current = {
        lat: location.latitude,
        lng: location.longitude,
      };
    } catch (err) {
      console.error('Serendipity fetch error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [location, tripId, radius]);

  // Auto-fetch when location changes
  useEffect(() => {
    if (!enabled || !location) return;

    // Debounce fetching to avoid too many requests
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchDiscoveries();
    }, 1000); // 1 second debounce

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [enabled, location, fetchDiscoveries]);

  // Auto-refresh interval
  useEffect(() => {
    if (!enabled || refreshInterval <= 0 || !location) return;

    const interval = setInterval(() => {
      fetchDiscoveries();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, refreshInterval, location, fetchDiscoveries]);

  // Manual refresh
  const refresh = useCallback(async () => {
    // Force refetch by clearing last location
    lastFetchLocation.current = null;
    await fetchDiscoveries();
  }, [fetchDiscoveries]);

  // Shuffle discoveries (client-side)
  const shuffle = useCallback(() => {
    setDiscoveries((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  }, []);

  // Save a discovery (client-side tracking)
  const saveDiscovery = useCallback((card: SerendipityCard) => {
    setSavedIds((prev) => new Set([...prev, card.id]));
    // Could also persist to backend here
  }, []);

  return {
    discoveries,
    loading,
    error,
    location,
    refresh,
    shuffle,
    saveDiscovery,
    savedIds,
  };
}

// Helper to calculate distance between two points in meters
function calculateDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default useSerendipity;
