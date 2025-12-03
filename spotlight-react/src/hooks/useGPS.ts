/**
 * useGPS - Real-time GPS location tracking hook
 *
 * Features:
 * - Continuous location tracking with Geolocation API
 * - Reverse geocoding to get city/address from coordinates
 * - Distance calculation to next destination
 * - Battery-efficient tracking with configurable intervals
 * - Permission handling and error states
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  city?: string;
  country?: string;
  address?: string;
}

interface UseGPSReturn {
  location: GPSLocation | null;
  isTracking: boolean;
  error: string | null;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  startTracking: () => void;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<GPSLocation | null>;
}

interface UseGPSOptions {
  enableHighAccuracy?: boolean;
  trackingInterval?: number; // milliseconds between updates
  autoStart?: boolean;
  enableReverseGeocode?: boolean;
}

export function useGPS(options: UseGPSOptions = {}): UseGPSReturn {
  const {
    enableHighAccuracy = true,
    trackingInterval = 30000, // 30 seconds default
    autoStart = false,
    enableReverseGeocode = true
  } = options;

  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  const watchIdRef = useRef<number | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if geolocation is supported
  const isGeolocationSupported = 'geolocation' in navigator;

  // Reverse geocode coordinates to get city/address
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<{ city?: string; country?: string; address?: string }> => {
    if (!enableReverseGeocode) return {};

    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Waycraft/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        console.warn('Reverse geocoding failed:', response.status);
        return {};
      }

      const data = await response.json();

      return {
        city: data.address?.city || data.address?.town || data.address?.village || undefined,
        country: data.address?.country || undefined,
        address: data.display_name || undefined
      };
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return {};
    }
  }, [enableReverseGeocode]);

  // Get current position once
  const getCurrentLocation = useCallback(async (): Promise<GPSLocation | null> => {
    if (!isGeolocationSupported) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const timestamp = position.timestamp;

          // Reverse geocode to get city
          const geocodeData = await reverseGeocode(latitude, longitude);

          const locationData: GPSLocation = {
            latitude,
            longitude,
            accuracy,
            timestamp,
            ...geocodeData
          };

          setLocation(locationData);
          setError(null);
          resolve(locationData);
        },
        (err) => {
          const errorMessage = `GPS Error: ${err.message}`;
          setError(errorMessage);
          console.error('Geolocation error:', err);
          resolve(null);
        },
        {
          enableHighAccuracy,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, [isGeolocationSupported, enableHighAccuracy, reverseGeocode]);

  // Start continuous tracking
  const startTracking = useCallback(() => {
    if (!isGeolocationSupported) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (isTracking) {
      console.log('GPS tracking already active');
      return;
    }

    console.log('🌍 Starting GPS tracking...');
    setIsTracking(true);
    setError(null);

    // Use watchPosition for continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = position.timestamp;

        console.log(`📍 GPS Update: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy.toFixed(0)}m)`);

        // Reverse geocode to get city
        const geocodeData = await reverseGeocode(latitude, longitude);

        const locationData: GPSLocation = {
          latitude,
          longitude,
          accuracy,
          timestamp,
          ...geocodeData
        };

        setLocation(locationData);
        setError(null);
      },
      (err) => {
        const errorMessage = `GPS Error: ${err.message}`;
        setError(errorMessage);
        console.error('Geolocation error:', err);

        // Update permission state on error
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionState('denied');
        }
      },
      {
        enableHighAccuracy,
        timeout: 10000,
        maximumAge: trackingInterval
      }
    );
  }, [isGeolocationSupported, isTracking, enableHighAccuracy, trackingInterval, reverseGeocode]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    console.log('🛑 Stopping GPS tracking');

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (trackingIntervalRef.current !== null) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    setIsTracking(false);
  }, []);

  // Check permission state
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((result) => {
          setPermissionState(result.state as 'prompt' | 'granted' | 'denied');

          // Listen for permission changes
          result.addEventListener('change', () => {
            setPermissionState(result.state as 'prompt' | 'granted' | 'denied');
          });
        })
        .catch(() => {
          setPermissionState('unknown');
        });
    }
  }, []);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (autoStart && permissionState === 'granted') {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [autoStart, permissionState, startTracking, stopTracking]);

  return {
    location,
    isTracking,
    error,
    permissionState,
    startTracking,
    stopTracking,
    getCurrentLocation
  };
}
