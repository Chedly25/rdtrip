/**
 * Weather Proactive Triggers
 *
 * WI-7.10: Intelligent weather-based notifications
 *
 * Generates proactive messages when weather conditions warrant:
 * - Rain incoming alerts
 * - Perfect weather for outdoor activities
 * - Temperature extreme warnings
 * - Golden hour reminders
 * - Weather-pivoting suggestions
 *
 * Design Philosophy:
 * - Alert only when actionable
 * - One clear suggestion per alert
 * - Rate-limited to avoid spam
 * - Context-aware (time, location, plan)
 */

import type { ProactiveMessage, ProactiveTrigger, ActiveCompanionContext } from './types';
import type { EnrichedActivity, WeatherContext } from '../types';
import { getWeatherScore } from '../scoring/weatherScorer';

// ============================================================================
// Types
// ============================================================================

export interface WeatherTriggerConfig {
  /** Minimum hours before rain to alert */
  rainAlertHours: number;
  /** Minimum precipitation chance to alert */
  minPrecipChance: number;
  /** Temperature threshold for heat warning */
  heatWarningTemp: number;
  /** Temperature threshold for cold warning */
  coldWarningTemp: number;
  /** Cooldown between weather alerts (seconds) */
  cooldownSeconds: number;
  /** Minutes before sunset for golden hour alert */
  goldenHourMinutes: number;
}

export const DEFAULT_WEATHER_TRIGGER_CONFIG: WeatherTriggerConfig = {
  rainAlertHours: 2,
  minPrecipChance: 50,
  heatWarningTemp: 32,
  coldWarningTemp: 5,
  cooldownSeconds: 30 * 60, // 30 minutes
  goldenHourMinutes: 45,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `weather-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * Find best indoor alternative from recommendations
 */
function findIndoorAlternative(
  recommendations: EnrichedActivity[],
  weather: WeatherContext
): EnrichedActivity | undefined {
  return recommendations.find((rec) => {
    const score = getWeatherScore(rec.activity, weather);
    return score.score > 0.6 && score.multiplier > 1.0;
  });
}

/**
 * Find best outdoor activity for good weather
 */
function findOutdoorActivity(
  recommendations: EnrichedActivity[],
  weather: WeatherContext
): EnrichedActivity | undefined {
  return recommendations.find((rec) => {
    const category = rec.activity.place.category;
    const isOutdoor = category === 'nature' || category === 'activities';
    const score = getWeatherScore(rec.activity, weather);
    return isOutdoor && score.score > 0.7;
  });
}

/**
 * Calculate minutes until sunset
 */
function minutesUntilSunset(weather: WeatherContext): number | null {
  if (!weather.sunset) return null;
  const now = new Date();
  const sunset = new Date(weather.sunset);
  return Math.round((sunset.getTime() - now.getTime()) / (1000 * 60));
}

// ============================================================================
// Rain Incoming Trigger
// ============================================================================

export function createRainIncomingTrigger(
  config: WeatherTriggerConfig = DEFAULT_WEATHER_TRIGGER_CONFIG
): ProactiveTrigger {
  let lastTriggered: number | null = null;

  return {
    type: 'weather_alert',
    priority: 'high',
    cooldownSeconds: config.cooldownSeconds,

    condition: (context: ActiveCompanionContext, _recommendations: EnrichedActivity[]) => {
      const weather = context.weather;
      if (!weather) return false;

      // Check cooldown
      if (lastTriggered && Date.now() - lastTriggered < config.cooldownSeconds * 1000) {
        return false;
      }

      // Check precipitation chance
      if (weather.precipitationChance < config.minPrecipChance) return false;

      // Check if currently raining (don't alert if already raining)
      if (weather.condition === 'rainy' || weather.condition === 'stormy') {
        return false;
      }

      return true;
    },

    generateMessage: (
      context: ActiveCompanionContext,
      recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      lastTriggered = Date.now();
      const weather = context.weather!;
      const indoorOption = findIndoorAlternative(recommendations, weather);

      const detail = indoorOption
        ? `${indoorOption.activity.place.name} is a great indoor option nearby`
        : 'Consider moving outdoor plans earlier';

      return {
        type: 'weather_alert',
        message: `Rain likely in the next few hours (${weather.precipitationChance}% chance)`,
        detail,
        priority: 'medium',
        relatedActivity: indoorOption,
        action: indoorOption
          ? {
              label: 'View indoor option',
              type: 'view',
              payload: indoorOption.activity.id,
            }
          : undefined,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      };
    },
  };
}

// ============================================================================
// Perfect Weather Trigger
// ============================================================================

export function createPerfectWeatherTrigger(
  config: WeatherTriggerConfig = DEFAULT_WEATHER_TRIGGER_CONFIG
): ProactiveTrigger {
  let lastTriggered: number | null = null;

  return {
    type: 'recommendation',
    priority: 'medium',
    cooldownSeconds: config.cooldownSeconds * 2, // Longer cooldown for positive alerts

    condition: (context: ActiveCompanionContext, recommendations: EnrichedActivity[]) => {
      const weather = context.weather;
      if (!weather) return false;

      // Check cooldown
      if (lastTriggered && Date.now() - lastTriggered < config.cooldownSeconds * 2 * 1000) {
        return false;
      }

      // Perfect conditions
      if (
        (weather.condition !== 'sunny' && weather.condition !== 'partly_cloudy') ||
        weather.temperatureCelsius < 18 ||
        weather.temperatureCelsius > 28
      ) {
        return false;
      }

      // Must have outdoor recommendations
      const hasOutdoor = recommendations.some(
        (r) =>
          r.activity.place.category === 'nature' ||
          r.activity.place.category === 'activities'
      );

      return hasOutdoor;
    },

    generateMessage: (
      context: ActiveCompanionContext,
      recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      lastTriggered = Date.now();
      const weather = context.weather!;
      const outdoorActivity = findOutdoorActivity(recommendations, weather);

      return {
        type: 'recommendation',
        message: `Perfect weather for outdoor activities (${Math.round(weather.temperatureCelsius)}°C, ${weather.description})`,
        detail: outdoorActivity
          ? `${outdoorActivity.activity.place.name} would be ideal right now`
          : 'Great conditions for exploring outside',
        priority: 'low',
        relatedActivity: outdoorActivity,
        action: outdoorActivity
          ? {
              label: 'View suggestion',
              type: 'view',
              payload: outdoorActivity.activity.id,
            }
          : undefined,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
      };
    },
  };
}

// ============================================================================
// Heat Warning Trigger
// ============================================================================

export function createHeatWarningTrigger(
  config: WeatherTriggerConfig = DEFAULT_WEATHER_TRIGGER_CONFIG
): ProactiveTrigger {
  let lastTriggered: number | null = null;

  return {
    type: 'weather_alert',
    priority: 'medium',
    cooldownSeconds: config.cooldownSeconds * 2,

    condition: (context: ActiveCompanionContext, _recommendations: EnrichedActivity[]) => {
      const weather = context.weather;
      if (!weather) return false;

      // Check cooldown
      if (lastTriggered && Date.now() - lastTriggered < config.cooldownSeconds * 2 * 1000) {
        return false;
      }

      return weather.temperatureCelsius >= config.heatWarningTemp;
    },

    generateMessage: (
      context: ActiveCompanionContext,
      recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      lastTriggered = Date.now();
      const weather = context.weather!;

      // Find a cooling spot
      const coolingSpot = recommendations.find((rec) => {
        const types = rec.activity.place.types || [];
        return (
          types.some(
            (t) =>
              t.includes('cafe') ||
              t.includes('ice_cream') ||
              t.includes('indoor')
          ) || rec.activity.place.category === 'wellness'
        );
      });

      return {
        type: 'weather_alert',
        message: `It's quite hot out there (${Math.round(weather.temperatureCelsius)}°C)`,
        detail: coolingSpot
          ? `${coolingSpot.activity.place.name} would be a refreshing break`
          : 'Stay hydrated and seek shade when you can',
        priority: 'medium',
        relatedActivity: coolingSpot,
        action: coolingSpot
          ? {
              label: 'Cool down here',
              type: 'view',
              payload: coolingSpot.activity.id,
            }
          : undefined,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      };
    },
  };
}

// ============================================================================
// Golden Hour Trigger
// ============================================================================

export function createGoldenHourTrigger(
  config: WeatherTriggerConfig = DEFAULT_WEATHER_TRIGGER_CONFIG
): ProactiveTrigger {
  let lastTriggered: number | null = null;

  return {
    type: 'time_trigger',
    priority: 'medium',
    cooldownSeconds: 60 * 60, // 1 hour cooldown

    condition: (context: ActiveCompanionContext, recommendations: EnrichedActivity[]) => {
      const weather = context.weather;
      if (!weather || !weather.isDaylight) return false;

      // Check cooldown
      if (lastTriggered && Date.now() - lastTriggered < 60 * 60 * 1000) {
        return false;
      }

      // Must be clear weather
      if (weather.condition !== 'sunny' && weather.condition !== 'partly_cloudy') {
        return false;
      }

      // Check if golden hour is approaching
      const minutes = minutesUntilSunset(weather);
      if (minutes === null || minutes < 15 || minutes > config.goldenHourMinutes) {
        return false;
      }

      // Must have a viewpoint or scenic activity
      const hasViewpoint = recommendations.some((rec) => {
        const types = rec.activity.place.types || [];
        return types.some(
          (t) =>
            t.includes('viewpoint') ||
            t.includes('scenic') ||
            t.includes('beach') ||
            t.includes('rooftop')
        );
      });

      return hasViewpoint;
    },

    generateMessage: (
      context: ActiveCompanionContext,
      recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      lastTriggered = Date.now();
      const weather = context.weather!;
      const minutes = minutesUntilSunset(weather) || 30;

      // Find viewpoint
      const viewpoint = recommendations.find((rec) => {
        const types = rec.activity.place.types || [];
        return types.some(
          (t) =>
            t.includes('viewpoint') ||
            t.includes('scenic') ||
            t.includes('beach')
        );
      });

      return {
        type: 'time_trigger',
        message: `Golden hour in about ${minutes} minutes`,
        detail: viewpoint
          ? `The light at ${viewpoint.activity.place.name} will be magical`
          : 'Great time for photos anywhere with a view',
        priority: 'medium',
        relatedActivity: viewpoint,
        action: viewpoint
          ? {
              label: 'Catch the light',
              type: 'view',
              payload: viewpoint.activity.id,
            }
          : undefined,
        expiresAt: new Date(Date.now() + minutes * 60 * 1000),
      };
    },
  };
}

// ============================================================================
// Storm Warning Trigger
// ============================================================================

export function createStormWarningTrigger(
  _config: WeatherTriggerConfig = DEFAULT_WEATHER_TRIGGER_CONFIG
): ProactiveTrigger {
  let lastTriggered: number | null = null;

  return {
    type: 'weather_alert',
    priority: 'high',
    cooldownSeconds: 60 * 60, // 1 hour

    condition: (context: ActiveCompanionContext, _recommendations: EnrichedActivity[]) => {
      const weather = context.weather;
      if (!weather) return false;

      // Check cooldown
      if (lastTriggered && Date.now() - lastTriggered < 60 * 60 * 1000) {
        return false;
      }

      return weather.condition === 'stormy';
    },

    generateMessage: (
      _context: ActiveCompanionContext,
      recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      lastTriggered = Date.now();

      // Find safe indoor option
      const indoorOption = recommendations.find(
        (rec) =>
          rec.activity.place.category === 'culture' ||
          rec.activity.place.category === 'shopping' ||
          rec.activity.place.category === 'wellness'
      );

      return {
        type: 'weather_alert',
        message: 'Storms in the area - best to stay sheltered',
        detail: indoorOption
          ? `${indoorOption.activity.place.name} is safe and nearby`
          : 'Find indoor shelter until it passes',
        priority: 'high',
        relatedActivity: indoorOption,
        action: indoorOption
          ? {
              label: 'Find shelter',
              type: 'view',
              payload: indoorOption.activity.id,
            }
          : undefined,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      };
    },
  };
}

// ============================================================================
// All Weather Triggers
// ============================================================================

/**
 * Get all weather triggers with default config
 */
export function getAllWeatherTriggers(
  config: WeatherTriggerConfig = DEFAULT_WEATHER_TRIGGER_CONFIG
): ProactiveTrigger[] {
  return [
    createRainIncomingTrigger(config),
    createPerfectWeatherTrigger(config),
    createHeatWarningTrigger(config),
    createGoldenHourTrigger(config),
    createStormWarningTrigger(config),
  ];
}

/**
 * Check all weather triggers and return any that should fire
 */
export function checkWeatherTriggers(
  context: ActiveCompanionContext,
  recommendations: EnrichedActivity[],
  triggers: ProactiveTrigger[] = getAllWeatherTriggers()
): ProactiveMessage[] {
  const messages: ProactiveMessage[] = [];

  for (const trigger of triggers) {
    if (trigger.condition(context, recommendations)) {
      const messageData = trigger.generateMessage(context, recommendations);
      messages.push({
        ...messageData,
        id: generateId(),
        createdAt: new Date(),
        isDismissed: false,
      });
    }
  }

  return messages;
}
