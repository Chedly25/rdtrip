/**
 * Restaurant Booking Proactive Triggers
 *
 * WI-10.4: Intelligent restaurant booking suggestions
 *
 * Generates proactive messages when restaurant reservation suggestions are timely:
 * - Near meal time - suggest making a reservation
 * - Special restaurant in itinerary - suggest booking ahead
 *
 * Design Philosophy:
 * - RELEVANT - Only suggest for dining establishments
 * - TIMELY - Suggest before meal time, not during
 * - HELPFUL - Like a travel companion's advice
 * - NOT PUSHY - Easy to dismiss, respect user choice
 */

import type { ProactiveMessage, ProactiveTrigger, ActiveCompanionContext } from './types';
import type { EnrichedActivity } from '../types';
import { generateRestaurantOptions } from '../../booking';

// ============================================================================
// Types
// ============================================================================

export interface RestaurantTriggerConfig {
  /** Cooldown between restaurant suggestions (seconds) */
  cooldownSeconds: number;
  /** Hours before meal to suggest reservation */
  hoursBeforeMeal: number;
  /** Meal times (24h format) */
  mealTimes: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

export const DEFAULT_RESTAURANT_TRIGGER_CONFIG: RestaurantTriggerConfig = {
  cooldownSeconds: 4 * 60 * 60, // 4 hours
  hoursBeforeMeal: 2, // Suggest 2 hours before meal
  mealTimes: {
    breakfast: 9,
    lunch: 13,
    dinner: 19,
  },
};

// ============================================================================
// Storage for tracking
// ============================================================================

const SUGGESTED_RESTAURANTS_KEY = 'waycraft_suggested_restaurants';
const DISMISSED_RESTAURANT_SUGGESTIONS_KEY = 'waycraft_dismissed_restaurant_suggestions';

interface SuggestionEntry {
  timestamp: number;
}

function getSuggestedRestaurants(): Map<string, SuggestionEntry> {
  try {
    const stored = localStorage.getItem(SUGGESTED_RESTAURANTS_KEY);
    if (!stored) return new Map();
    const entries: Record<string, SuggestionEntry> = JSON.parse(stored);
    return new Map(Object.entries(entries));
  } catch {
    return new Map();
  }
}

function recordRestaurantSuggestion(restaurantId: string): void {
  try {
    const suggestions = getSuggestedRestaurants();
    suggestions.set(restaurantId, { timestamp: Date.now() });
    const obj: Record<string, SuggestionEntry> = {};
    suggestions.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(SUGGESTED_RESTAURANTS_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage errors
  }
}

function wasRecentlySuggested(restaurantId: string, cooldownSeconds: number): boolean {
  const suggestions = getSuggestedRestaurants();
  const entry = suggestions.get(restaurantId);
  if (!entry) return false;
  const elapsed = (Date.now() - entry.timestamp) / 1000;
  return elapsed < cooldownSeconds;
}

function getDismissedRestaurantSuggestions(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_RESTAURANT_SUGGESTIONS_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `restaurant-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/** Categories that are dining establishments */
const DINING_CATEGORIES = [
  'restaurant',
  'cafe',
  'bar',
  'bistro',
  'brasserie',
  'trattoria',
  'tavern',
  'pub',
  'food',
  'dining',
];

function isDiningCategory(category: string): boolean {
  return DINING_CATEGORIES.some(dc =>
    category.toLowerCase().includes(dc)
  );
}

function getMealTypeForHour(hour: number): 'breakfast' | 'lunch' | 'dinner' | null {
  if (hour >= 7 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 17 && hour < 22) return 'dinner';
  return null;
}

// ============================================================================
// Restaurant Booking Trigger - Approaching Meal Time
// ============================================================================

/**
 * Trigger when approaching meal time and there's a dining recommendation
 * Suggests making a reservation
 */
export function createMealTimeTrigger(
  config: RestaurantTriggerConfig = DEFAULT_RESTAURANT_TRIGGER_CONFIG
): ProactiveTrigger {
  return {
    type: 'recommendation',
    priority: 'low',
    cooldownSeconds: config.cooldownSeconds,

    condition: (context: ActiveCompanionContext, recommendations: EnrichedActivity[]) => {
      // Must have current city
      if (!context.currentCity) return false;

      // Check if we're approaching a meal time
      const currentHour = context.currentHour;
      let upcomingMeal: 'breakfast' | 'lunch' | 'dinner' | null = null;

      // Check each meal time
      for (const [meal, mealHour] of Object.entries(config.mealTimes)) {
        const hoursUntilMeal = mealHour - currentHour;
        if (hoursUntilMeal > 0 && hoursUntilMeal <= config.hoursBeforeMeal) {
          upcomingMeal = meal as 'breakfast' | 'lunch' | 'dinner';
          break;
        }
      }

      if (!upcomingMeal) return false;

      // Look for dining recommendations
      const diningRecommendation = recommendations.find(rec => {
        const place = rec.activity.place;
        if (!place) return false;
        const category = place.category;
        if (!isDiningCategory(category)) return false;

        // Check if recently suggested
        const restaurantKey = `${context.currentCity}-${place.placeId}`;
        if (wasRecentlySuggested(restaurantKey, config.cooldownSeconds)) return false;

        // Check if dismissed
        if (getDismissedRestaurantSuggestions().has(restaurantKey)) return false;

        return true;
      });

      return !!diningRecommendation;
    },

    generateMessage: (
      context: ActiveCompanionContext,
      recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      // Find the dining recommendation
      const diningRec = recommendations.find(rec => {
        const place = rec.activity.place;
        if (!place) return false;
        const category = place.category;
        return isDiningCategory(category);
      });

      const cityName = context.currentCity!;
      const currentHour = context.currentHour;
      const mealType = getMealTypeForHour(currentHour + 2) || 'dinner';

      if (!diningRec) {
        // Generic restaurant suggestion
        const options = generateRestaurantOptions({
          cityName,
          restaurantName: '',
          partySize: 2,
        });

        return {
          type: 'recommendation',
          message: `Time for ${mealType}?`,
          detail: 'Find a great restaurant nearby',
          priority: 'low',
          action: options.primary ? {
            label: 'Find restaurants',
            type: 'view',
            payload: options.primary.url,
          } : undefined,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        };
      }

      const place = diningRec.activity.place;
      const restaurantKey = `${cityName}-${place.placeId}`;

      // Record suggestion
      recordRestaurantSuggestion(restaurantKey);

      // Generate booking options
      const options = generateRestaurantOptions({
        cityName,
        restaurantName: place.name,
        partySize: 2,
      });

      return {
        type: 'recommendation',
        message: `${place.name} for ${mealType}?`,
        detail: 'Reserve a table in advance',
        priority: 'low',
        relatedActivity: diningRec,
        action: options.primary ? {
          label: 'Make reservation',
          type: 'view',
          payload: options.primary.url,
        } : undefined,
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
      };
    },
  };
}

// ============================================================================
// Restaurant Booking Trigger - High-Rated Restaurant
// ============================================================================

/**
 * Trigger when a highly-rated restaurant is in recommendations
 * Suggests booking ahead as it might be popular
 */
export function createPopularRestaurantTrigger(
  config: RestaurantTriggerConfig = DEFAULT_RESTAURANT_TRIGGER_CONFIG
): ProactiveTrigger {
  return {
    type: 'recommendation',
    priority: 'low',
    cooldownSeconds: config.cooldownSeconds,

    condition: (context: ActiveCompanionContext, recommendations: EnrichedActivity[]) => {
      // Must have current city
      if (!context.currentCity) return false;

      // Look for highly-rated dining recommendations
      const popularDining = recommendations.find(rec => {
        const place = rec.activity.place;
        if (!place) return false;
        const category = place.category;
        if (!isDiningCategory(category)) return false;

        // Must be popular (high score or rating)
        const score = rec.score?.score || 0;
        const rating = place.rating || 0;
        if (score < 0.75 && rating < 4.3) return false;

        // Check if recently suggested
        const restaurantKey = `popular-${context.currentCity}-${place.placeId}`;
        if (wasRecentlySuggested(restaurantKey, config.cooldownSeconds * 2)) return false;

        // Check if dismissed
        if (getDismissedRestaurantSuggestions().has(restaurantKey)) return false;

        return true;
      });

      return !!popularDining;
    },

    generateMessage: (
      context: ActiveCompanionContext,
      recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      const cityName = context.currentCity!;

      // Find the popular dining spot
      const popularDining = recommendations.find(rec => {
        const place = rec.activity.place;
        if (!place) return false;
        const category = place.category;
        if (!isDiningCategory(category)) return false;
        const score = rec.score?.score || 0;
        const rating = place.rating || 0;
        return score >= 0.75 || rating >= 4.3;
      });

      if (!popularDining) {
        return {
          type: 'recommendation',
          message: 'Popular restaurants nearby',
          detail: 'Book in advance for the best spots',
          priority: 'low',
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        };
      }

      const place = popularDining.activity.place;
      const restaurantKey = `popular-${cityName}-${place.placeId}`;

      // Record suggestion
      recordRestaurantSuggestion(restaurantKey);

      // Generate booking options
      const options = generateRestaurantOptions({
        cityName,
        restaurantName: place.name,
        partySize: 2,
      });

      const ratingText = place.rating ? ` (${place.rating.toFixed(1)}⭐)` : '';

      return {
        type: 'recommendation',
        message: `${place.name}${ratingText}`,
        detail: 'Popular spot - consider reserving ahead',
        priority: 'low',
        relatedActivity: popularDining,
        action: options.primary ? {
          label: 'Reserve table',
          type: 'view',
          payload: options.primary.url,
        } : undefined,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
      };
    },
  };
}

// ============================================================================
// All Restaurant Triggers
// ============================================================================

/**
 * Get all restaurant triggers with default config
 */
export function getAllRestaurantTriggers(
  config: RestaurantTriggerConfig = DEFAULT_RESTAURANT_TRIGGER_CONFIG
): ProactiveTrigger[] {
  return [
    createMealTimeTrigger(config),
    createPopularRestaurantTrigger(config),
  ];
}

/**
 * Check all restaurant triggers and return any that should fire
 */
export function checkRestaurantTriggers(
  context: ActiveCompanionContext,
  recommendations: EnrichedActivity[],
  triggers: ProactiveTrigger[] = getAllRestaurantTriggers()
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

/**
 * Dismiss restaurant suggestion for a specific restaurant
 */
export function dismissRestaurantSuggestion(restaurantId: string): void {
  try {
    const dismissed = getDismissedRestaurantSuggestions();
    dismissed.add(restaurantId);
    localStorage.setItem(DISMISSED_RESTAURANT_SUGGESTIONS_KEY, JSON.stringify([...dismissed]));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if restaurant suggestion was dismissed
 */
export function isRestaurantSuggestionDismissed(restaurantId: string): boolean {
  return getDismissedRestaurantSuggestions().has(restaurantId);
}
