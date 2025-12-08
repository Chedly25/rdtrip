/**
 * useWeatherContext Hook
 *
 * WI-7.10: Weather integration for active trip companion
 *
 * Features:
 * - Fetches weather data based on user location
 * - Smart caching with configurable expiration
 * - Periodic refresh with battery-efficient intervals
 * - Converts weather service types to TripBrain WeatherContext
 * - Provides weather-aware activity suggestions
 * - Triggers proactive alerts for weather changes
 *
 * Battery Efficiency:
 * - Default refresh: 15 minutes
 * - Only fetches when location is available
 * - Pauses when app is backgrounded (future)
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  fetchWeatherForecast,
  isWeatherDisruptive,
  getWeatherSuggestions,
  getWeatherGreeting,
  type WeatherData,
  type CurrentWeather,
  type HourlyForecast,
  type WeatherCondition,
} from '../../weather';
import type { WeatherContext, LocationContext } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseWeatherContextOptions {
  /** User's current location */
  location: LocationContext | null;
  /** Refresh interval in ms (default 15 min) */
  refreshIntervalMs?: number;
  /** Cache duration in ms (default 10 min) */
  cacheDurationMs?: number;
  /** Enable/disable weather fetching */
  enabled?: boolean;
  /** Called when weather changes significantly */
  onWeatherChange?: (weather: WeatherContext, previous: WeatherContext | null) => void;
  /** Called when rain is predicted */
  onRainPredicted?: (hourlyForecast: HourlyForecast[]) => void;
}

export interface UseWeatherContextReturn {
  /** Current weather context for TripBrain */
  weather: WeatherContext | null;
  /** Full weather data including forecast */
  weatherData: WeatherData | null;
  /** Is loading weather */
  isLoading: boolean;
  /** Error if any */
  error: string | null;
  /** Manually refresh weather */
  refresh: () => Promise<void>;
  /** When weather was last fetched */
  lastFetchedAt: Date | null;
  /** Weather greeting for UI */
  greeting: string;
  /** Activity suggestions based on weather */
  suggestions: string[];
  /** Is weather disruptive to outdoor activities */
  isDisruptive: boolean;
  /** Hours until rain (null if no rain predicted) */
  hoursUntilRain: number | null;
  /** Is weather data stale */
  isStale: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
const DEFAULT_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = 'weather_cache';

// ============================================================================
// Weather Condition Mapping
// ============================================================================

/**
 * Map weather service condition to TripBrain WeatherCondition
 */
function mapWeatherCondition(condition: WeatherCondition): WeatherContext['condition'] {
  const mapping: Record<WeatherCondition, WeatherContext['condition']> = {
    clear: 'sunny',
    clouds: 'cloudy',
    rain: 'rainy',
    drizzle: 'rainy',
    thunderstorm: 'stormy',
    snow: 'snowy',
    mist: 'foggy',
    fog: 'foggy',
    haze: 'foggy',
  };
  return mapping[condition] || 'cloudy';
}

/**
 * Convert weather service data to TripBrain WeatherContext
 */
function toWeatherContext(
  current: CurrentWeather,
  locationName: string
): WeatherContext {
  const now = new Date();
  const hour = now.getHours();

  // Parse sunrise/sunset if available
  let sunrise: Date | undefined;
  let sunset: Date | undefined;

  if (current.sunrise) {
    sunrise = new Date(current.sunrise);
  }
  if (current.sunset) {
    sunset = new Date(current.sunset);
  }

  // Determine if daylight
  const isDaylight =
    sunrise && sunset
      ? now >= sunrise && now <= sunset
      : hour >= 6 && hour < 20;

  return {
    condition: mapWeatherCondition(current.condition),
    temperatureCelsius: current.temperature,
    feelsLikeCelsius: current.feelsLike,
    humidity: current.humidity,
    windSpeedKmh: current.windSpeed,
    precipitationChance: 0, // Will be updated from hourly
    uvIndex: current.uvIndex || 0,
    sunrise: sunrise || new Date(now.setHours(6, 0, 0, 0)),
    sunset: sunset || new Date(now.setHours(20, 0, 0, 0)),
    isDaylight,
    description: current.description,
    fetchedAt: new Date(),
    forLocation: locationName,
  };
}

// ============================================================================
// Cache Helpers
// ============================================================================

interface CachedWeather {
  weatherData: WeatherData;
  fetchedAt: number;
  locationKey: string;
}

function getCachedWeather(locationKey: string): CachedWeather | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const cached = JSON.parse(stored) as CachedWeather;
    if (cached.locationKey !== locationKey) return null;

    return cached;
  } catch {
    return null;
  }
}

function setCachedWeather(
  weatherData: WeatherData,
  locationKey: string
): void {
  try {
    const cached: CachedWeather = {
      weatherData,
      fetchedAt: Date.now(),
      locationKey,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
}

function getLocationKey(location: LocationContext): string {
  // Round coordinates to reduce cache misses from GPS jitter
  const lat = Math.round(location.coordinates.lat * 100) / 100;
  const lng = Math.round(location.coordinates.lng * 100) / 100;
  return `${lat},${lng}`;
}

// ============================================================================
// Rain Prediction
// ============================================================================

function findHoursUntilRain(hourly: HourlyForecast[]): number | null {
  const now = new Date();

  for (let i = 0; i < Math.min(hourly.length, 12); i++) {
    const forecast = hourly[i];
    if (forecast.precipProbability > 50) {
      const forecastTime = new Date(forecast.time);
      const hoursUntil = (forecastTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return Math.max(0, Math.round(hoursUntil * 10) / 10);
    }
  }

  return null;
}

function hasSignificantWeatherChange(
  current: WeatherContext,
  previous: WeatherContext | null
): boolean {
  if (!previous) return true;

  // Temperature change > 5°C
  if (Math.abs(current.temperatureCelsius - previous.temperatureCelsius) > 5) {
    return true;
  }

  // Condition category change
  if (current.condition !== previous.condition) {
    return true;
  }

  // Precipitation chance increased significantly
  if (current.precipitationChance - previous.precipitationChance > 30) {
    return true;
  }

  return false;
}

// ============================================================================
// Hook
// ============================================================================

export function useWeatherContext(
  options: UseWeatherContextOptions
): UseWeatherContextReturn {
  const {
    location,
    refreshIntervalMs = DEFAULT_REFRESH_INTERVAL,
    cacheDurationMs = DEFAULT_CACHE_DURATION,
    enabled = true,
    onWeatherChange,
    onRainPredicted,
  } = options;

  // State
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // Refs
  const previousWeatherRef = useRef<WeatherContext | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Fetch weather
  const fetchWeather = useCallback(async () => {
    if (!location || !enabled) return;

    const locationKey = getLocationKey(location);

    // Check cache first
    const cached = getCachedWeather(locationKey);
    if (cached && Date.now() - cached.fetchedAt < cacheDurationMs) {
      // Use cached data
      const ctx = toWeatherContext(
        cached.weatherData.current,
        cached.weatherData.location.name
      );

      // Update precip chance from hourly
      if (cached.weatherData.hourly.length > 0) {
        ctx.precipitationChance = cached.weatherData.hourly[0].precipProbability;
      }

      setWeatherData(cached.weatherData);
      setWeather(ctx);
      setLastFetchedAt(new Date(cached.fetchedAt));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWeatherForecast(
        location.coordinates.lat,
        location.coordinates.lng,
        3 // 3 days forecast
      );

      if (!isMountedRef.current) return;

      // Convert to TripBrain context
      const ctx = toWeatherContext(data.current, data.location.name);

      // Add precipitation chance from hourly
      if (data.hourly.length > 0) {
        ctx.precipitationChance = data.hourly[0].precipProbability;
      }

      // Cache the result
      setCachedWeather(data, locationKey);

      // Check for significant change
      if (hasSignificantWeatherChange(ctx, previousWeatherRef.current)) {
        onWeatherChange?.(ctx, previousWeatherRef.current);
      }

      // Check for rain prediction
      const hoursUntilRain = findHoursUntilRain(data.hourly);
      if (hoursUntilRain !== null && hoursUntilRain < 3) {
        onRainPredicted?.(data.hourly);
      }

      previousWeatherRef.current = ctx;
      setWeatherData(data);
      setWeather(ctx);
      setLastFetchedAt(new Date());
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [location, enabled, cacheDurationMs, onWeatherChange, onRainPredicted]);

  // Manual refresh
  const refresh = useCallback(async () => {
    // Clear cache to force fresh fetch
    localStorage.removeItem(STORAGE_KEY);
    await fetchWeather();
  }, [fetchWeather]);

  // Initial fetch and refresh timer
  useEffect(() => {
    if (!enabled || !location) return;

    // Fetch immediately
    fetchWeather();

    // Set up refresh interval
    refreshTimerRef.current = setInterval(fetchWeather, refreshIntervalMs);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [enabled, location, fetchWeather, refreshIntervalMs]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derived values
  const greeting = useMemo(() => {
    if (!weatherData?.current) return 'Enjoy your day!';
    return getWeatherGreeting(weatherData.current);
  }, [weatherData?.current]);

  const suggestions = useMemo(() => {
    if (!weatherData?.current) return [];
    return getWeatherSuggestions(weatherData.current);
  }, [weatherData?.current]);

  const isDisruptive = useMemo(() => {
    if (!weatherData?.current) return false;
    return isWeatherDisruptive(weatherData.current.condition);
  }, [weatherData?.current]);

  const hoursUntilRain = useMemo(() => {
    if (!weatherData?.hourly) return null;
    return findHoursUntilRain(weatherData.hourly);
  }, [weatherData?.hourly]);

  const isStale = useMemo(() => {
    if (!lastFetchedAt) return true;
    return Date.now() - lastFetchedAt.getTime() > cacheDurationMs;
  }, [lastFetchedAt, cacheDurationMs]);

  // Return
  return useMemo(
    () => ({
      weather,
      weatherData,
      isLoading,
      error,
      refresh,
      lastFetchedAt,
      greeting,
      suggestions,
      isDisruptive,
      hoursUntilRain,
      isStale,
    }),
    [
      weather,
      weatherData,
      isLoading,
      error,
      refresh,
      lastFetchedAt,
      greeting,
      suggestions,
      isDisruptive,
      hoursUntilRain,
      isStale,
    ]
  );
}

export default useWeatherContext;
