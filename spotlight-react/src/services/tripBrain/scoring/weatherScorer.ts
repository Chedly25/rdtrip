/**
 * Weather Scorer
 *
 * WI-7.10: Weather-based scoring adjustments for activities
 *
 * Adjusts activity scores based on current weather conditions:
 * - Boosts indoor activities during rain/storms
 * - Boosts outdoor activities during good weather
 * - Suggests shaded spots during hot weather
 * - Suggests warm indoor spots during cold weather
 * - Penalizes weather-inappropriate activities
 *
 * Score adjustments are multiplicative modifiers (0.5 - 1.5)
 * applied to the base activity score.
 */

import type { PlaceActivity } from '../../itinerary';
import type { WeatherContext, ScoreComponent } from '../types';
import type { WaycraftCategory } from '../../../utils/placeCategories';

// ============================================================================
// Types
// ============================================================================

export interface WeatherScoreResult {
  /** Weather score (0-1) */
  score: number;
  /** Multiplier to apply to final score */
  multiplier: number;
  /** Human-readable reason */
  reason: string;
  /** Weather-specific tip */
  tip?: string;
  /** Is this activity weather-appropriate */
  isAppropriate: boolean;
  /** Urgency message if weather-sensitive */
  urgency?: string;
}

export interface WeatherScorerConfig {
  /** Base score for neutral weather */
  neutralScore: number;
  /** Bonus for perfect weather match */
  perfectBonus: number;
  /** Penalty for poor weather match */
  poorPenalty: number;
  /** Temperature thresholds */
  temperature: {
    cold: number;      // Below this is cold
    comfortable: number; // Comfortable range start
    warm: number;      // Comfortable range end
    hot: number;       // Above this is hot
  };
  /** High precipitation chance threshold */
  precipThreshold: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_WEATHER_SCORER_CONFIG: WeatherScorerConfig = {
  neutralScore: 0.5,
  perfectBonus: 0.3,
  poorPenalty: 0.3,
  temperature: {
    cold: 10,
    comfortable: 15,
    warm: 25,
    hot: 30,
  },
  precipThreshold: 40,
};

// ============================================================================
// Category Classifications
// ============================================================================

/** Categories primarily indoor */
const INDOOR_CATEGORIES: WaycraftCategory[] = [
  'culture',
  'shopping',
  'wellness',
];

/** Categories primarily outdoor */
const OUTDOOR_CATEGORIES: WaycraftCategory[] = [
  'nature',
  'activities',
];

/** Place types that indicate outdoor seating/activity */
const OUTDOOR_TYPES = [
  'park',
  'garden',
  'beach',
  'viewpoint',
  'hiking',
  'outdoor',
  'terrace',
  'rooftop',
  'scenic',
  'trail',
];

/** Place types that indicate indoor/covered */
const INDOOR_TYPES = [
  'museum',
  'gallery',
  'theater',
  'cinema',
  'mall',
  'covered',
  'indoor',
  'spa',
];

/** Place types that provide cooling */
const COOLING_TYPES = [
  'ice_cream',
  'pool',
  'spa',
  'cafe',
  'air_conditioned',
];

/** Place types that provide warmth */
const WARMING_TYPES = [
  'cafe',
  'restaurant',
  'bar',
  'spa',
  'sauna',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if activity is primarily outdoor
 */
function isOutdoorActivity(activity: PlaceActivity): boolean {
  const category = activity.place.category;
  const types = activity.place.types || [];

  // Check category first
  if (OUTDOOR_CATEGORIES.includes(category)) return true;
  if (INDOOR_CATEGORIES.includes(category)) return false;

  // Check place types
  return types.some((t) =>
    OUTDOOR_TYPES.some((outdoor) => t.toLowerCase().includes(outdoor))
  );
}

/**
 * Check if activity is primarily indoor
 */
function isIndoorActivity(activity: PlaceActivity): boolean {
  const category = activity.place.category;
  const types = activity.place.types || [];

  // Check category first
  if (INDOOR_CATEGORIES.includes(category)) return true;
  if (OUTDOOR_CATEGORIES.includes(category)) return false;

  // Check place types
  return types.some((t) =>
    INDOOR_TYPES.some((indoor) => t.toLowerCase().includes(indoor))
  );
}

/**
 * Check if activity provides cooling
 */
function providesCooling(activity: PlaceActivity): boolean {
  const types = activity.place.types || [];
  return types.some((t) =>
    COOLING_TYPES.some((cool) => t.toLowerCase().includes(cool))
  );
}

/**
 * Check if activity provides warmth
 */
function providesWarmth(activity: PlaceActivity): boolean {
  const types = activity.place.types || [];
  return types.some((t) =>
    WARMING_TYPES.some((warm) => t.toLowerCase().includes(warm))
  );
}

/**
 * Get temperature comfort level
 */
function getTemperatureComfort(
  temp: number,
  config: WeatherScorerConfig
): 'cold' | 'comfortable' | 'hot' {
  if (temp < config.temperature.cold) return 'cold';
  if (temp > config.temperature.hot) return 'hot';
  return 'comfortable';
}

// ============================================================================
// Main Scoring Function
// ============================================================================

/**
 * Calculate weather-based score for an activity
 */
export function getWeatherScore(
  activity: PlaceActivity,
  weather: WeatherContext | null,
  config: WeatherScorerConfig = DEFAULT_WEATHER_SCORER_CONFIG
): WeatherScoreResult {
  // No weather data - return neutral
  if (!weather) {
    return {
      score: config.neutralScore,
      multiplier: 1.0,
      reason: 'Weather conditions unknown',
      isAppropriate: true,
    };
  }

  const isOutdoor = isOutdoorActivity(activity);
  const isIndoor = isIndoorActivity(activity);
  const hasCooling = providesCooling(activity);
  const hasWarmth = providesWarmth(activity);
  const tempComfort = getTemperatureComfort(weather.temperatureCelsius, config);

  let score = config.neutralScore;
  let multiplier = 1.0;
  let reason = '';
  let tip: string | undefined;
  let urgency: string | undefined;
  let isAppropriate = true;

  // ==================== Precipitation Check ====================

  const isRaining =
    weather.condition === 'rainy' || weather.condition === 'stormy';
  const rainLikely = weather.precipitationChance >= config.precipThreshold;

  if (isRaining || weather.condition === 'stormy') {
    if (isOutdoor) {
      // Outdoor during rain - penalize
      score -= config.poorPenalty;
      multiplier = 0.6;
      reason = 'Not ideal for rainy weather';
      isAppropriate = false;
      urgency = 'Consider indoor alternatives';
    } else if (isIndoor) {
      // Indoor during rain - boost
      score += config.perfectBonus;
      multiplier = 1.3;
      reason = 'Great choice to stay dry';
      tip = 'Perfect spot to wait out the rain';
    }
  } else if (rainLikely) {
    if (isOutdoor) {
      // Rain expected - slight penalty
      score -= config.poorPenalty * 0.5;
      multiplier = 0.85;
      reason = 'Rain may be coming';
      tip = 'Check the forecast - rain possible';
      urgency = `${weather.precipitationChance}% chance of rain`;
    }
  }

  // ==================== Clear Weather Check ====================

  if (
    weather.condition === 'sunny' ||
    weather.condition === 'partly_cloudy'
  ) {
    if (isOutdoor && tempComfort === 'comfortable') {
      // Perfect outdoor weather
      score += config.perfectBonus;
      multiplier = 1.4;
      reason = 'Perfect weather for this';
      tip = 'Ideal conditions - enjoy!';
    } else if (isOutdoor && tempComfort === 'hot') {
      // Hot but clear - mixed
      score += config.perfectBonus * 0.3;
      multiplier = 1.1;
      reason = 'Good weather, might be warm';
      tip = 'Bring water and sunscreen';
    }
  }

  // ==================== Temperature Adjustments ====================

  if (tempComfort === 'hot') {
    if (hasCooling) {
      // Cooling spot in hot weather - boost
      score += config.perfectBonus;
      multiplier = Math.max(multiplier, 1.3);
      reason = 'Great spot to cool down';
      tip = 'A refreshing escape from the heat';
    } else if (isOutdoor) {
      // Outdoor in hot weather - slight penalty
      score -= config.poorPenalty * 0.4;
      multiplier = Math.min(multiplier, 0.9);
      if (!reason) reason = 'May be quite warm outside';
      tip = 'Seek shade and stay hydrated';
    }
  }

  if (tempComfort === 'cold') {
    if (hasWarmth) {
      // Warming spot in cold weather - boost
      score += config.perfectBonus;
      multiplier = Math.max(multiplier, 1.3);
      reason = 'Cozy spot to warm up';
      tip = 'A perfect place to get cozy';
    } else if (isOutdoor) {
      // Outdoor in cold weather - penalty
      score -= config.poorPenalty * 0.5;
      multiplier = Math.min(multiplier, 0.85);
      if (!reason) reason = 'May be quite cold outside';
      tip = 'Dress in layers';
    }
  }

  // ==================== Special Conditions ====================

  // Stormy weather - strong indoor preference
  if (weather.condition === 'stormy') {
    if (isOutdoor) {
      score -= config.poorPenalty;
      multiplier = 0.4;
      reason = 'Not safe during storms';
      isAppropriate = false;
      urgency = 'Seek shelter - storms expected';
    } else if (isIndoor) {
      score += config.perfectBonus;
      multiplier = 1.5;
      reason = 'Safe and cozy inside';
    }
  }

  // Foggy weather - affects viewpoints
  if (weather.condition === 'foggy') {
    const types = activity.place.types || [];
    const isViewpoint = types.some(
      (t) => t.includes('viewpoint') || t.includes('scenic')
    );
    if (isViewpoint) {
      score -= config.poorPenalty * 0.7;
      multiplier = 0.7;
      reason = 'Limited visibility in fog';
      tip = 'Views may be obscured';
    }
  }

  // Snow - affects outdoor activities significantly
  if (weather.condition === 'snowy') {
    if (isOutdoor) {
      score -= config.poorPenalty * 0.6;
      multiplier = 0.75;
      reason = 'Snowy conditions outside';
      tip = 'Watch for slippery surfaces';
    } else if (isIndoor) {
      score += config.perfectBonus * 0.5;
      multiplier = 1.2;
      reason = 'Warm inside while it snows';
    }
  }

  // ==================== Default Reason ====================

  if (!reason) {
    if (tempComfort === 'comfortable' && !isRaining) {
      reason = 'Pleasant weather';
    } else {
      reason = 'Weather considered';
    }
  }

  // ==================== Clamp Score ====================

  score = Math.max(0, Math.min(1, score));

  return {
    score,
    multiplier,
    reason,
    tip,
    isAppropriate,
    urgency,
  };
}

/**
 * Create a ScoreComponent from weather score
 */
export function createWeatherScoreComponent(
  result: WeatherScoreResult,
  weight: number
): ScoreComponent {
  return {
    value: result.score,
    weight,
    contribution: result.score * weight,
    reason: result.reason,
  };
}

/**
 * Filter activities by weather appropriateness
 */
export function filterByWeather(
  activities: PlaceActivity[],
  weather: WeatherContext | null,
  config: WeatherScorerConfig = DEFAULT_WEATHER_SCORER_CONFIG
): PlaceActivity[] {
  if (!weather) return activities;

  return activities.filter((activity) => {
    const result = getWeatherScore(activity, weather, config);
    return result.isAppropriate;
  });
}

/**
 * Sort activities by weather score (best first)
 */
export function sortByWeatherScore(
  activities: PlaceActivity[],
  weather: WeatherContext | null,
  config: WeatherScorerConfig = DEFAULT_WEATHER_SCORER_CONFIG
): PlaceActivity[] {
  if (!weather) return activities;

  return [...activities].sort((a, b) => {
    const scoreA = getWeatherScore(a, weather, config);
    const scoreB = getWeatherScore(b, weather, config);
    return scoreB.score - scoreA.score;
  });
}

/**
 * Get weather-boosted activities (score > 0.6)
 */
export function getWeatherBoostedActivities(
  activities: PlaceActivity[],
  weather: WeatherContext | null,
  config: WeatherScorerConfig = DEFAULT_WEATHER_SCORER_CONFIG
): PlaceActivity[] {
  if (!weather) return [];

  return activities.filter((activity) => {
    const result = getWeatherScore(activity, weather, config);
    return result.score > 0.6;
  });
}

/**
 * Generate weather-specific "Why Now" text
 */
export function generateWeatherWhyNow(
  activity: PlaceActivity,
  weather: WeatherContext | null,
  config: WeatherScorerConfig = DEFAULT_WEATHER_SCORER_CONFIG
): string | null {
  if (!weather) return null;

  const result = getWeatherScore(activity, weather, config);

  // Only return if score is notably good or bad
  if (result.score > 0.65) {
    return result.reason;
  }

  if (result.urgency) {
    return result.urgency;
  }

  return null;
}
