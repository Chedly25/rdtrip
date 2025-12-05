/**
 * Weather Service
 * Sprint 2.3: Real-Time Adaptations
 *
 * Frontend service for fetching weather data during trips
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get auth token from localStorage
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Weather condition codes and descriptions
export type WeatherCondition =
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'mist'
  | 'fog'
  | 'haze';

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
  visibility: number;
  uvIndex?: number;
  sunrise?: string;
  sunset?: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
  precipProbability: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  high: number;
  low: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
  precipProbability: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  event: string;
  headline: string;
  description: string;
  severity: 'extreme' | 'severe' | 'moderate' | 'minor';
  start: string;
  end: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  location: {
    name: string;
    country: string;
  };
  lastUpdated: string;
  source: 'openweathermap' | 'mock';
}

/**
 * Fetch current weather for a location
 */
export async function fetchCurrentWeather(lat: number, lng: number): Promise<CurrentWeather> {
  const response = await fetch(
    `${API_BASE_URL}/weather/current?lat=${lat}&lng=${lng}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch weather: ${response.statusText}`);
  }

  const data = await response.json();
  return data.current;
}

/**
 * Fetch weather forecast for a location
 */
export async function fetchWeatherForecast(
  lat: number,
  lng: number,
  days: number = 5
): Promise<WeatherData> {
  const response = await fetch(
    `${API_BASE_URL}/weather/forecast?lat=${lat}&lng=${lng}&days=${days}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch forecast: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch weather alerts for a location
 */
export async function fetchWeatherAlerts(lat: number, lng: number): Promise<WeatherAlert[]> {
  const response = await fetch(
    `${API_BASE_URL}/weather/alerts?lat=${lat}&lng=${lng}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`);
  }

  const data = await response.json();
  return data.alerts || [];
}

/**
 * Get weather icon component name based on condition
 */
export function getWeatherIcon(condition: WeatherCondition, isDay: boolean = true): string {
  const icons: Record<WeatherCondition, { day: string; night: string }> = {
    clear: { day: 'Sun', night: 'Moon' },
    clouds: { day: 'Cloud', night: 'Cloud' },
    rain: { day: 'CloudRain', night: 'CloudRain' },
    drizzle: { day: 'CloudDrizzle', night: 'CloudDrizzle' },
    thunderstorm: { day: 'CloudLightning', night: 'CloudLightning' },
    snow: { day: 'CloudSnow', night: 'CloudSnow' },
    mist: { day: 'CloudFog', night: 'CloudFog' },
    fog: { day: 'CloudFog', night: 'CloudFog' },
    haze: { day: 'Haze', night: 'Haze' },
  };

  return icons[condition]?.[isDay ? 'day' : 'night'] || 'Cloud';
}

/**
 * Check if weather condition affects outdoor activities
 */
export function isWeatherDisruptive(condition: WeatherCondition): boolean {
  const disruptive: WeatherCondition[] = ['rain', 'thunderstorm', 'snow', 'drizzle'];
  return disruptive.includes(condition);
}

/**
 * Get activity suggestions based on weather
 */
export function getWeatherSuggestions(weather: CurrentWeather): string[] {
  const suggestions: string[] = [];

  if (isWeatherDisruptive(weather.condition)) {
    suggestions.push('Consider indoor activities');
    suggestions.push('Bring an umbrella or rain jacket');
  }

  if (weather.temperature > 30) {
    suggestions.push('Stay hydrated');
    suggestions.push('Seek shade during midday');
  }

  if (weather.temperature < 10) {
    suggestions.push('Dress in layers');
    suggestions.push('Warm beverages recommended');
  }

  if (weather.uvIndex && weather.uvIndex > 6) {
    suggestions.push('Apply sunscreen');
    suggestions.push('Wear a hat and sunglasses');
  }

  if (weather.windSpeed > 30) {
    suggestions.push('Expect windy conditions');
  }

  return suggestions;
}

/**
 * Format temperature with unit
 */
export function formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'F') {
    return `${Math.round(temp * 9/5 + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
}

/**
 * Get weather-appropriate greeting
 */
export function getWeatherGreeting(weather: CurrentWeather): string {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 18;

  if (weather.condition === 'clear' && isDay) {
    return 'Beautiful day for exploring!';
  }
  if (weather.condition === 'clear' && !isDay) {
    return 'Perfect evening for a stroll';
  }
  if (weather.condition === 'rain' || weather.condition === 'drizzle') {
    return 'Pack an umbrella today';
  }
  if (weather.condition === 'thunderstorm') {
    return 'Stormy weather ahead';
  }
  if (weather.condition === 'snow') {
    return 'Winter wonderland awaits';
  }
  if (weather.condition === 'clouds') {
    return 'Overcast but pleasant';
  }

  return 'Enjoy your day!';
}
