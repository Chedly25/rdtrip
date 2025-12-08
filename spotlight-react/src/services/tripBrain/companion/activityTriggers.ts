/**
 * Activity Booking Proactive Triggers
 *
 * WI-10.3: Intelligent activity booking suggestions
 *
 * Generates proactive messages when activity booking suggestions are timely:
 * - Near a popular attraction - suggest booking
 * - Morning of activity-heavy day - suggest advance booking
 *
 * Design Philosophy:
 * - RELEVANT - Only suggest for actual bookable activities
 * - TIMELY - Suggest at the right moment (before arrival)
 * - HELPFUL - Like a travel companion's advice
 * - NOT PUSHY - Easy to dismiss, respect user choice
 */

import type { ProactiveMessage, ProactiveTrigger, ActiveCompanionContext } from './types';
import type { EnrichedActivity } from '../types';
import { generateActivityLink } from '../../booking';

// ============================================================================
// Types
// ============================================================================

export interface ActivityTriggerConfig {
  /** Cooldown between activity suggestions (seconds) */
  cooldownSeconds: number;
  /** Hour of day for morning activity suggestions (24h format) */
  morningSuggestionHour: number;
}

export const DEFAULT_ACTIVITY_TRIGGER_CONFIG: ActivityTriggerConfig = {
  cooldownSeconds: 6 * 60 * 60, // 6 hours
  morningSuggestionHour: 8, // 8 AM
};

// ============================================================================
// Storage for tracking
// ============================================================================

const SUGGESTED_ACTIVITIES_KEY = 'waycraft_suggested_activities';
const DISMISSED_ACTIVITY_SUGGESTIONS_KEY = 'waycraft_dismissed_activity_suggestions';

interface SuggestionEntry {
  timestamp: number;
}

function getSuggestedActivities(): Map<string, SuggestionEntry> {
  try {
    const stored = localStorage.getItem(SUGGESTED_ACTIVITIES_KEY);
    if (!stored) return new Map();
    const entries: Record<string, SuggestionEntry> = JSON.parse(stored);
    return new Map(Object.entries(entries));
  } catch {
    return new Map();
  }
}

function recordActivitySuggestion(activityId: string): void {
  try {
    const suggestions = getSuggestedActivities();
    suggestions.set(activityId, { timestamp: Date.now() });
    const obj: Record<string, SuggestionEntry> = {};
    suggestions.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(SUGGESTED_ACTIVITIES_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage errors
  }
}

function wasRecentlySuggested(activityId: string, cooldownSeconds: number): boolean {
  const suggestions = getSuggestedActivities();
  const entry = suggestions.get(activityId);
  if (!entry) return false;
  const elapsed = (Date.now() - entry.timestamp) / 1000;
  return elapsed < cooldownSeconds;
}

function getDismissedActivitySuggestions(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_ACTIVITY_SUGGESTIONS_KEY);
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
  return `activity-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/** Categories that are typically bookable on GetYourGuide/Viator */
const BOOKABLE_CATEGORIES = [
  'museum',
  'gallery',
  'landmark',
  'monument',
  'attraction',
  'experience',
  'tour',
  'viewpoint',
  'castle',
  'palace',
  'church',
  'temple',
];

function isBookableCategory(category: string): boolean {
  return BOOKABLE_CATEGORIES.some(bc =>
    category.toLowerCase().includes(bc)
  );
}

// ============================================================================
// Activity Booking Trigger - Popular Attraction
// ============================================================================

/**
 * Trigger when recommendations include a popular bookable attraction
 * Suggests booking tickets in advance
 */
export function createPopularAttractionTrigger(
  config: ActivityTriggerConfig = DEFAULT_ACTIVITY_TRIGGER_CONFIG
): ProactiveTrigger {
  return {
    type: 'recommendation',
    priority: 'low',
    cooldownSeconds: config.cooldownSeconds,

    condition: (context: ActiveCompanionContext, recommendations: EnrichedActivity[]) => {
      // Must have current city
      if (!context.currentCity) return false;

      // Look for popular bookable activities in recommendations
      const popularBookable = recommendations.find(rec => {
        const place = rec.activity.place;
        if (!place) return false;
        const category = place.category;
        if (!isBookableCategory(category)) return false;

        // Consider "popular" if it has a high relevance score
        if ((rec.score?.score || 0) < 0.7) return false;

        // Check if recently suggested
        const activityKey = `${context.currentCity}-${place.placeId}`;
        if (wasRecentlySuggested(activityKey, config.cooldownSeconds)) return false;

        // Check if user dismissed suggestions for this activity
        if (getDismissedActivitySuggestions().has(activityKey)) return false;

        return true;
      });

      return !!popularBookable;
    },

    generateMessage: (
      context: ActiveCompanionContext,
      recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      // Find the popular bookable activity
      const enrichedActivity = recommendations.find(rec => {
        const place = rec.activity.place;
        if (!place) return false;
        const category = place.category;
        return isBookableCategory(category) && (rec.score?.score || 0) >= 0.7;
      });

      if (!enrichedActivity) {
        // Fallback - shouldn't happen given condition check
        return {
          type: 'recommendation',
          message: `Tours available in ${context.currentCity}`,
          detail: 'Skip the lines with advance booking',
          priority: 'low',
          action: {
            label: 'Browse tours',
            type: 'view',
            payload: generateActivityLink({
              cityName: context.currentCity!,
            }).url,
          },
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        };
      }

      const cityName = context.currentCity!;
      const place = enrichedActivity.activity.place;
      const activityKey = `${cityName}-${place.placeId}`;

      // Record suggestion
      recordActivitySuggestion(activityKey);

      // Generate booking link
      const bookingLink = generateActivityLink({
        cityName,
        activityName: place.name,
        category: place.category,
      });

      return {
        type: 'recommendation',
        message: `${place.name} is popular`,
        detail: 'Consider booking in advance to skip lines',
        priority: 'low',
        relatedActivity: enrichedActivity,
        action: {
          label: 'Book tickets',
          type: 'view',
          payload: bookingLink.url,
        },
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
      };
    },
  };
}

// ============================================================================
// Activity Booking Trigger - Morning Suggestion
// ============================================================================

/**
 * Trigger in the morning to suggest booking for today's activities
 */
export function createMorningActivitySuggestionTrigger(
  config: ActivityTriggerConfig = DEFAULT_ACTIVITY_TRIGGER_CONFIG
): ProactiveTrigger {
  return {
    type: 'recommendation',
    priority: 'low',
    cooldownSeconds: config.cooldownSeconds,

    condition: (context: ActiveCompanionContext, recommendations: EnrichedActivity[]) => {
      // Must have current city
      if (!context.currentCity) return false;

      // Only trigger in the morning
      if (context.currentHour < config.morningSuggestionHour ||
          context.currentHour > config.morningSuggestionHour + 2) {
        return false;
      }

      // Check if there are bookable activities in recommendations
      const hasBookableActivities = recommendations.some(rec => {
        const place = rec.activity.place;
        if (!place) return false;
        const category = place.category;
        return isBookableCategory(category);
      });

      if (!hasBookableActivities) return false;

      // Check cooldown for general morning suggestions
      const suggestionKey = `morning-${context.currentCity}-${context.dayNumber}`;
      return !wasRecentlySuggested(suggestionKey, 24 * 60 * 60); // Once per day
    },

    generateMessage: (
      context: ActiveCompanionContext,
      recommendations: EnrichedActivity[]
    ): Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'> => {
      const cityName = context.currentCity!;
      const suggestionKey = `morning-${cityName}-${context.dayNumber}`;

      // Record suggestion
      recordActivitySuggestion(suggestionKey);

      // Count bookable activities
      const bookableCount = recommendations.filter(rec => {
        const place = rec.activity.place;
        if (!place) return false;
        const category = place.category;
        return isBookableCategory(category);
      }).length;

      // Generate booking link
      const bookingLink = generateActivityLink({
        cityName,
      });

      return {
        type: 'recommendation',
        message: `${bookableCount} attraction${bookableCount > 1 ? 's' : ''} today`,
        detail: 'Book tickets online to save time',
        priority: 'low',
        action: {
          label: 'Browse options',
          type: 'view',
          payload: bookingLink.url,
        },
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      };
    },
  };
}

// ============================================================================
// All Activity Triggers
// ============================================================================

/**
 * Get all activity triggers with default config
 */
export function getAllActivityTriggers(
  config: ActivityTriggerConfig = DEFAULT_ACTIVITY_TRIGGER_CONFIG
): ProactiveTrigger[] {
  return [
    createPopularAttractionTrigger(config),
    createMorningActivitySuggestionTrigger(config),
  ];
}

/**
 * Check all activity triggers and return any that should fire
 */
export function checkActivityTriggers(
  context: ActiveCompanionContext,
  recommendations: EnrichedActivity[],
  triggers: ProactiveTrigger[] = getAllActivityTriggers()
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
 * Dismiss activity suggestion for a specific activity
 */
export function dismissActivitySuggestion(activityId: string): void {
  try {
    const dismissed = getDismissedActivitySuggestions();
    dismissed.add(activityId);
    localStorage.setItem(DISMISSED_ACTIVITY_SUGGESTIONS_KEY, JSON.stringify([...dismissed]));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if activity suggestion was dismissed
 */
export function isActivitySuggestionDismissed(activityId: string): boolean {
  return getDismissedActivitySuggestions().has(activityId);
}
