/**
 * useWeather Hook
 * Sprint 2.3: Real-Time Adaptations
 *
 * React hook for real-time weather data during trips
 * Provides current conditions, forecasts, and weather alerts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  WeatherData,
  CurrentWeather,
  WeatherAlert,
} from '../services/weather';
import {
  fetchWeatherForecast,
  fetchWeatherAlerts,
  isWeatherDisruptive,
  getWeatherSuggestions,
} from '../services/weather';

interface UseWeatherOptions {
  /** Auto-refresh interval in milliseconds (default: 10 minutes) */
  refreshInterval?: number;
  /** Enable weather alerts monitoring */
  enableAlerts?: boolean;
  /** Callback when disruptive weather is detected */
  onDisruptiveWeather?: (weather: CurrentWeather, suggestions: string[]) => void;
  /** Callback when weather alert is received */
  onWeatherAlert?: (alert: WeatherAlert) => void;
}

interface UseWeatherReturn {
  /** Current weather data */
  weather: WeatherData | null;
  /** Current conditions only */
  current: CurrentWeather | null;
  /** Active weather alerts */
  alerts: WeatherAlert[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Last successful update timestamp */
  lastUpdated: Date | null;
  /** Whether current weather is disruptive for outdoor activities */
  isDisruptive: boolean;
  /** Activity suggestions based on weather */
  suggestions: string[];
  /** Manually refresh weather data */
  refresh: () => Promise<void>;
  /** Update location for weather tracking */
  setLocation: (lat: number, lng: number) => void;
}

export function useWeather(
  initialLat?: number,
  initialLng?: number,
  options: UseWeatherOptions = {}
): UseWeatherReturn {
  const {
    refreshInterval = 10 * 60 * 1000, // 10 minutes
    enableAlerts = true,
    onDisruptiveWeather,
    onWeatherAlert,
  } = options;

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [location, setLocationState] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  // Track previous alerts to detect new ones
  const previousAlertsRef = useRef<Set<string>>(new Set());

  // Fetch weather data
  const fetchWeather = useCallback(async () => {
    if (!location) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch forecast (includes current weather)
      const forecastData = await fetchWeatherForecast(location.lat, location.lng);
      setWeather(forecastData);
      setLastUpdated(new Date());

      // Check for disruptive weather
      if (forecastData.current && isWeatherDisruptive(forecastData.current.condition)) {
        const suggestions = getWeatherSuggestions(forecastData.current);
        onDisruptiveWeather?.(forecastData.current, suggestions);
      }

      // Fetch alerts if enabled
      if (enableAlerts) {
        const alertsData = await fetchWeatherAlerts(location.lat, location.lng);
        setAlerts(alertsData);

        // Check for new alerts
        const currentAlertIds = new Set(alertsData.map(a => a.id));
        alertsData.forEach(alert => {
          if (!previousAlertsRef.current.has(alert.id)) {
            onWeatherAlert?.(alert);
          }
        });
        previousAlertsRef.current = currentAlertIds;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch weather'));
    } finally {
      setIsLoading(false);
    }
  }, [location, enableAlerts, onDisruptiveWeather, onWeatherAlert]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (!location) return;

    fetchWeather();

    const intervalId = setInterval(fetchWeather, refreshInterval);
    return () => clearInterval(intervalId);
  }, [location, fetchWeather, refreshInterval]);

  // Update location
  const setLocation = useCallback((lat: number, lng: number) => {
    setLocationState({ lat, lng });
  }, []);

  // Computed values
  const current = weather?.current || null;
  const isDisruptive = current ? isWeatherDisruptive(current.condition) : false;
  const suggestions = current ? getWeatherSuggestions(current) : [];

  return {
    weather,
    current,
    alerts,
    isLoading,
    error,
    lastUpdated,
    isDisruptive,
    suggestions,
    refresh: fetchWeather,
    setLocation,
  };
}

/**
 * useWeatherForTrip Hook
 *
 * Specialized hook for tracking weather across multiple trip locations
 */
interface TripLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  date?: string;
}

interface TripWeatherData {
  locationId: string;
  weather: WeatherData | null;
  isLoading: boolean;
  error: Error | null;
}

export function useWeatherForTrip(locations: TripLocation[]) {
  const [weatherMap, setWeatherMap] = useState<Map<string, TripWeatherData>>(new Map());
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const fetchAllWeather = useCallback(async () => {
    if (locations.length === 0) return;

    setIsLoadingAll(true);

    const results = await Promise.allSettled(
      locations.map(async (loc) => {
        const weather = await fetchWeatherForecast(loc.lat, loc.lng);
        return { locationId: loc.id, weather };
      })
    );

    const newMap = new Map<string, TripWeatherData>();

    results.forEach((result, index) => {
      const loc = locations[index];
      if (result.status === 'fulfilled') {
        newMap.set(loc.id, {
          locationId: loc.id,
          weather: result.value.weather,
          isLoading: false,
          error: null,
        });
      } else {
        newMap.set(loc.id, {
          locationId: loc.id,
          weather: null,
          isLoading: false,
          error: result.reason instanceof Error ? result.reason : new Error('Failed'),
        });
      }
    });

    setWeatherMap(newMap);
    setIsLoadingAll(false);
  }, [locations]);

  useEffect(() => {
    fetchAllWeather();
  }, [fetchAllWeather]);

  const getWeatherForLocation = useCallback(
    (locationId: string) => weatherMap.get(locationId) || null,
    [weatherMap]
  );

  // Find locations with disruptive weather
  const disruptiveLocations = Array.from(weatherMap.values())
    .filter(data => data.weather?.current && isWeatherDisruptive(data.weather.current.condition))
    .map(data => data.locationId);

  return {
    weatherMap,
    isLoadingAll,
    refresh: fetchAllWeather,
    getWeatherForLocation,
    disruptiveLocations,
  };
}

export default useWeather;
