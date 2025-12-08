/**
 * useGeolocation - Trip Brain Geolocation Hook
 *
 * WI-6.8: React hook for location tracking with Trip Brain integration
 *
 * Features:
 * - Geolocation API integration with permission handling
 * - Error mapping to Trip Brain error types
 * - Movement detection based on speed/accuracy changes
 * - Accuracy tracking and quality indicators
 * - TripBrain integration via callback
 * - Battery-efficient watch mode
 *
 * Usage:
 * ```tsx
 * const { location, isLoading, error, permissionStatus } = useGeolocation({
 *   enableHighAccuracy: true,
 *   onLocationUpdate: (location) => tripBrain.updateLocation(location),
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  LocationContext,
  GeolocationState,
  GeolocationError,
  LocationPermissionStatus,
} from '../types';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Options for the useGeolocation hook
 */
export interface UseGeolocationOptions {
  /** Use high accuracy mode (GPS) - uses more battery */
  enableHighAccuracy?: boolean;

  /** Timeout for position requests in milliseconds */
  timeout?: number;

  /** Maximum age of cached position in milliseconds */
  maximumAge?: number;

  /** Minimum movement in meters to trigger update */
  movementThreshold?: number;

  /** Speed threshold (m/s) to consider user as moving */
  movingSpeedThreshold?: number;

  /** Auto-start watching on mount */
  autoStart?: boolean;

  /** Enable reverse geocoding for city name */
  enableReverseGeocode?: boolean;

  /** Callback when location updates (for Trip Brain integration) */
  onLocationUpdate?: (location: LocationContext) => void;

  /** Callback when error occurs */
  onError?: (error: GeolocationError) => void;

  /** Callback when permission changes */
  onPermissionChange?: (status: LocationPermissionStatus) => void;
}

/**
 * Default configuration
 */
export const DEFAULT_GEOLOCATION_OPTIONS: Required<Omit<UseGeolocationOptions, 'onLocationUpdate' | 'onError' | 'onPermissionChange'>> = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 30000,
  movementThreshold: 10, // 10 meters
  movingSpeedThreshold: 0.5, // 0.5 m/s (~2 km/h)
  autoStart: false,
  enableReverseGeocode: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map Geolocation API error code to Trip Brain error
 */
function mapGeolocationError(error: GeolocationPositionError): GeolocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        code: 'PERMISSION_DENIED',
        message: 'Location access was denied. Please enable location permissions in your browser settings.',
      };
    case error.POSITION_UNAVAILABLE:
      return {
        code: 'POSITION_UNAVAILABLE',
        message: 'Unable to determine your location. Please check your device settings.',
      };
    case error.TIMEOUT:
      return {
        code: 'TIMEOUT',
        message: 'Location request timed out. Please try again.',
      };
    default:
      return {
        code: 'UNKNOWN',
        message: error.message || 'An unknown error occurred while getting your location.',
      };
  }
}

/**
 * Check if geolocation is supported in this browser
 */
function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Detect if user is moving based on speed or position change
 */
function detectMovement(
  current: GeolocationPosition,
  previous: LocationContext | null,
  movingSpeedThreshold: number,
  movementThreshold: number
): boolean {
  // If we have speed data, use it
  if (current.coords.speed !== null && current.coords.speed !== undefined) {
    return current.coords.speed > movingSpeedThreshold;
  }

  // Fall back to position comparison
  if (previous) {
    const distance = calculateDistanceMeters(
      previous.coordinates.lat,
      previous.coordinates.lng,
      current.coords.latitude,
      current.coords.longitude
    );
    const timeDiff = (current.timestamp - previous.timestamp.getTime()) / 1000;

    // Calculate implied speed
    if (timeDiff > 0) {
      const impliedSpeed = distance / timeDiff;
      return impliedSpeed > movingSpeedThreshold;
    }

    // Just check if moved beyond threshold
    return distance > movementThreshold;
  }

  return false;
}

/**
 * Reverse geocode coordinates to get city name
 */
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ cityName?: string; countryCode?: string }> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Waycraft/1.0',
        },
      }
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();

    return {
      cityName:
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality,
      countryCode: data.address?.country_code?.toUpperCase(),
    };
  } catch {
    console.warn('Reverse geocoding failed');
    return {};
  }
}

/**
 * Get accuracy quality indicator
 */
export function getAccuracyQuality(
  accuracy: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (accuracy <= 10) return 'excellent';
  if (accuracy <= 30) return 'good';
  if (accuracy <= 100) return 'fair';
  return 'poor';
}

/**
 * Check if accuracy is acceptable for navigation
 */
export function isAccuracyAcceptable(accuracy: number): boolean {
  return accuracy <= 100; // 100 meters is generally acceptable
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * React hook for geolocation with Trip Brain integration
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): GeolocationState {
  const {
    enableHighAccuracy = DEFAULT_GEOLOCATION_OPTIONS.enableHighAccuracy,
    timeout = DEFAULT_GEOLOCATION_OPTIONS.timeout,
    maximumAge = DEFAULT_GEOLOCATION_OPTIONS.maximumAge,
    movementThreshold = DEFAULT_GEOLOCATION_OPTIONS.movementThreshold,
    movingSpeedThreshold = DEFAULT_GEOLOCATION_OPTIONS.movingSpeedThreshold,
    autoStart = DEFAULT_GEOLOCATION_OPTIONS.autoStart,
    enableReverseGeocode = DEFAULT_GEOLOCATION_OPTIONS.enableReverseGeocode,
    onLocationUpdate: _onLocationUpdate, // Used via optionsRef to avoid stale closures
    onError,
    onPermissionChange,
  } = options;

  // Suppress unused variable warning - we access via optionsRef.current
  void _onLocationUpdate;

  // State
  const [location, setLocation] = useState<LocationContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>('prompt');

  // Refs
  const watchIdRef = useRef<number | null>(null);
  const isWatchingRef = useRef(false);
  const previousLocationRef = useRef<LocationContext | null>(null);
  const optionsRef = useRef(options);

  // Keep options ref updated
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Check and monitor permission status
  useEffect(() => {
    if (!isGeolocationSupported()) {
      setPermissionStatus('unavailable');
      return;
    }

    // Check initial permission status
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          const status = result.state as LocationPermissionStatus;
          setPermissionStatus(status);
          onPermissionChange?.(status);

          // Listen for permission changes
          const handleChange = () => {
            const newStatus = result.state as LocationPermissionStatus;
            setPermissionStatus(newStatus);
            onPermissionChange?.(newStatus);

            // If permission was revoked, stop watching
            if (newStatus === 'denied' && isWatchingRef.current) {
              stopWatching();
            }
          };

          result.addEventListener('change', handleChange);
          return () => result.removeEventListener('change', handleChange);
        })
        .catch(() => {
          // Permission API not supported, assume prompt
          setPermissionStatus('prompt');
        });
    }
  }, [onPermissionChange]);

  /**
   * Process a position and update state
   */
  const processPosition = useCallback(
    async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      const timestamp = new Date(position.timestamp);

      // Detect movement
      const isMoving = detectMovement(
        position,
        previousLocationRef.current,
        movingSpeedThreshold,
        movementThreshold
      );

      // Build location context
      let locationContext: LocationContext = {
        coordinates: { lat: latitude, lng: longitude },
        accuracy,
        timestamp,
        heading: heading ?? undefined,
        speed: speed ?? undefined,
        isMoving,
      };

      // Reverse geocode if enabled
      if (enableReverseGeocode) {
        const geocodeResult = await reverseGeocode(latitude, longitude);
        locationContext = {
          ...locationContext,
          cityName: geocodeResult.cityName,
          countryCode: geocodeResult.countryCode,
        };
      }

      // Update state
      setLocation(locationContext);
      setError(null);
      setIsLoading(false);

      // Store for movement detection
      previousLocationRef.current = locationContext;

      // Notify Trip Brain
      optionsRef.current.onLocationUpdate?.(locationContext);
    },
    [enableReverseGeocode, movementThreshold, movingSpeedThreshold]
  );

  /**
   * Handle position error
   */
  const handleError = useCallback(
    (positionError: GeolocationPositionError) => {
      const tripBrainError = mapGeolocationError(positionError);
      setError(tripBrainError);
      setIsLoading(false);

      // Update permission status if denied
      if (positionError.code === positionError.PERMISSION_DENIED) {
        setPermissionStatus('denied');
      }

      // Notify callback
      onError?.(tripBrainError);
    },
    [onError]
  );

  /**
   * Get current position once
   */
  const refresh = useCallback(() => {
    if (!isGeolocationSupported()) {
      setError({
        code: 'POSITION_UNAVAILABLE',
        message: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(processPosition, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge, processPosition, handleError]);

  /**
   * Start watching position
   */
  const startWatching = useCallback(() => {
    if (!isGeolocationSupported()) {
      setError({
        code: 'POSITION_UNAVAILABLE',
        message: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    if (isWatchingRef.current) {
      console.log('Already watching location');
      return;
    }

    console.log('🌍 Starting location watching...');
    setIsLoading(true);
    setError(null);
    isWatchingRef.current = true;

    watchIdRef.current = navigator.geolocation.watchPosition(
      processPosition,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, processPosition, handleError]);

  /**
   * Stop watching position
   */
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      console.log('🛑 Stopping location watching');
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    isWatchingRef.current = false;
    setIsLoading(false);
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && permissionStatus === 'granted') {
      startWatching();
    }
  }, [autoStart, permissionStatus, startWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    isLoading,
    error,
    permissionStatus,
    refresh,
    startWatching,
    stopWatching,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get distance from user to a specific point
 */
export function useDistanceToPoint(
  targetLat: number,
  targetLon: number,
  geolocationState: GeolocationState
): {
  distance: number | null;
  isCalculating: boolean;
  formattedDistance: string | null;
} {
  const { location, isLoading } = geolocationState;

  if (!location) {
    return {
      distance: null,
      isCalculating: isLoading,
      formattedDistance: null,
    };
  }

  const distance = calculateDistanceMeters(
    location.coordinates.lat,
    location.coordinates.lng,
    targetLat,
    targetLon
  );

  const formattedDistance =
    distance < 1000
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`;

  return {
    distance,
    isCalculating: false,
    formattedDistance,
  };
}

/**
 * Hook to track if user is approaching a destination
 */
export function useApproaching(
  targetLat: number,
  targetLon: number,
  geolocationState: GeolocationState,
  thresholdMeters: number = 200
): {
  isApproaching: boolean;
  isNearby: boolean;
  distance: number | null;
} {
  const { distance } = useDistanceToPoint(targetLat, targetLon, geolocationState);
  const previousDistanceRef = useRef<number | null>(null);

  const isApproaching =
    distance !== null &&
    previousDistanceRef.current !== null &&
    distance < previousDistanceRef.current;

  const isNearby = distance !== null && distance <= thresholdMeters;

  // Update previous distance for next comparison
  useEffect(() => {
    if (distance !== null) {
      previousDistanceRef.current = distance;
    }
  }, [distance]);

  return {
    isApproaching,
    isNearby,
    distance,
  };
}

