/**
 * Itinerary Companion Service
 *
 * WI-5.8: Service for AI-powered itinerary modifications
 *
 * Architecture:
 * - Extracts actions from AI responses [ACTION:type:params]
 * - Maps actions to itinerary editor operations
 * - Provides context building for the AI
 * - Handles proactive issue detection
 */

import type {
  Itinerary,
  ItineraryDay,
  ItineraryActivity,
  PlaceActivity,
  TimeSlot,
} from './itinerary';
import type { UserPreferences } from './preferences';
import {
  generateItineraryCompanionPrompt,
  generateCompactItineraryPrompt,
  generateQuickSuggestions,
  type ItineraryCompanionContext,
  type QuickSuggestion,
  type WeatherForecast,
} from './itineraryCompanionPrompts';

// ============================================================================
// Types
// ============================================================================

/**
 * Action types the companion can emit
 */
export type ItineraryActionType =
  | 'swap_days'
  | 'lighten_day'
  | 'add_activity'
  | 'move_activity'
  | 'remove_activity'
  | 'swap_activity'
  | 'adjust_time';

/**
 * Parsed action from AI response
 */
export interface ParsedAction {
  type: ItineraryActionType;
  params: string[];
  raw: string;
}

/**
 * Structured action ready for execution
 */
export interface ItineraryAction {
  type: ItineraryActionType;
  description: string;
  execute: (editor: ItineraryEditor) => void;
}

/**
 * Interface for itinerary editor (matches useItineraryEditor)
 */
export interface ItineraryEditor {
  reorderActivitiesInSlot: (dayNumber: number, slot: TimeSlot, fromIndex: number, toIndex: number) => void;
  moveActivityToDay: (fromDayNumber: number, toDayNumber: number, activityId: string, targetSlot?: TimeSlot) => void;
  removeActivity: (dayNumber: number, activityId: string, option: 'fill-gap' | 'leave-free-time') => void;
  addActivity: (dayNumber: number, slot: TimeSlot, activity: Omit<PlaceActivity, 'id' | 'slot' | 'orderInSlot'>) => void;
  swapActivity: (dayNumber: number, activityId: string, newActivity: Omit<PlaceActivity, 'id' | 'slot' | 'orderInSlot'>) => void;
}

/**
 * Issue detected in itinerary
 */
export interface ItineraryIssue {
  type: 'packed_day' | 'venue_closed' | 'weather' | 'travel_time' | 'gap';
  severity: 'info' | 'warning' | 'error';
  dayNumber: number;
  message: string;
  suggestion?: string;
  action?: ParsedAction;
}

/**
 * Companion message with optional actions
 */
export interface CompanionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ParsedAction[];
}

// ============================================================================
// Action Parsing
// ============================================================================

/**
 * Parse actions from AI response text
 *
 * Format: [ACTION:type:param1,param2,...]
 */
export function parseActionsFromResponse(response: string): ParsedAction[] {
  const actions: ParsedAction[] = [];
  const actionPattern = /\[ACTION:(\w+):([^\]]+)\]/g;

  let match;
  while ((match = actionPattern.exec(response)) !== null) {
    const type = match[1] as ItineraryActionType;
    const paramsStr = match[2];
    const params = paramsStr.split(',').map(p => p.trim());

    actions.push({
      type,
      params,
      raw: match[0],
    });
  }

  return actions;
}

/**
 * Remove action tags from response text for display
 */
export function cleanResponseText(response: string): string {
  return response.replace(/\[ACTION:[^\]]+\]/g, '').trim();
}

/**
 * Convert parsed action to executable action
 */
export function createExecutableAction(
  parsed: ParsedAction,
  itinerary: Itinerary
): ItineraryAction | null {
  switch (parsed.type) {
    case 'swap_days': {
      const [day1, day2] = parsed.params.map(Number);
      if (isNaN(day1) || isNaN(day2)) return null;
      return {
        type: 'swap_days',
        description: `Swap day ${day1} and day ${day2}`,
        execute: (_editor) => {
          // Swap days by moving all activities
          // This is a complex operation that needs careful handling
          console.log(`Would swap days ${day1} and ${day2}`);
          // Implementation would swap all activities between the two days
        },
      };
    }

    case 'lighten_day': {
      const dayNumber = Number(parsed.params[0]);
      if (isNaN(dayNumber)) return null;
      const day = itinerary.days.find(d => d.dayNumber === dayNumber);
      if (!day) return null;

      // Find lowest priority activity to remove
      const activity = findLowestPriorityActivity(day);
      if (!activity) return null;

      return {
        type: 'lighten_day',
        description: `Remove activity from day ${dayNumber}`,
        execute: (editor) => {
          editor.removeActivity(dayNumber, activity.id, 'leave-free-time');
        },
      };
    }

    case 'add_activity': {
      const [dayStr, category] = parsed.params;
      const dayNumber = Number(dayStr);
      if (isNaN(dayNumber)) return null;
      return {
        type: 'add_activity',
        description: `Add ${category} activity to day ${dayNumber}`,
        execute: (_editor) => {
          // This would trigger the alternatives service to get suggestions
          console.log(`Would add ${category} to day ${dayNumber}`);
        },
      };
    }

    case 'move_activity': {
      const [activityId, fromDayStr, toDayStr] = parsed.params;
      const fromDay = Number(fromDayStr);
      const toDay = Number(toDayStr);
      if (isNaN(fromDay) || isNaN(toDay)) return null;
      return {
        type: 'move_activity',
        description: `Move activity from day ${fromDay} to day ${toDay}`,
        execute: (editor) => {
          editor.moveActivityToDay(fromDay, toDay, activityId);
        },
      };
    }

    case 'remove_activity': {
      const activityId = parsed.params[0];
      const day = findDayContainingActivity(itinerary, activityId);
      if (!day) return null;
      return {
        type: 'remove_activity',
        description: `Remove activity`,
        execute: (editor) => {
          editor.removeActivity(day.dayNumber, activityId, 'leave-free-time');
        },
      };
    }

    case 'swap_activity': {
      const activityId = parsed.params[0];
      return {
        type: 'swap_activity',
        description: `Find alternative for activity`,
        execute: (_editor) => {
          // This would trigger the alternatives panel
          console.log(`Would swap activity ${activityId}`);
        },
      };
    }

    case 'adjust_time': {
      const [activityId, durationStr] = parsed.params;
      const duration = Number(durationStr);
      if (isNaN(duration)) return null;
      return {
        type: 'adjust_time',
        description: `Adjust activity duration to ${duration} minutes`,
        execute: (_editor) => {
          console.log(`Would adjust ${activityId} to ${duration} minutes`);
        },
      };
    }

    default:
      return null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find the lowest priority activity in a day
 */
function findLowestPriorityActivity(day: ItineraryDay): ItineraryActivity | null {
  const allActivities: ItineraryActivity[] = [
    ...day.slots.morning,
    ...day.slots.afternoon,
    ...day.slots.evening,
  ];

  // Filter to place activities only
  const placeActivities = allActivities.filter(
    (a): a is PlaceActivity => a.type === 'place'
  );

  if (placeActivities.length === 0) return null;

  // Sort by preference score (lowest first)
  placeActivities.sort((a, b) => {
    const scoreA = a.preferenceScore ?? 0.5;
    const scoreB = b.preferenceScore ?? 0.5;
    return scoreA - scoreB;
  });

  return placeActivities[0];
}

/**
 * Find the day containing a specific activity
 */
function findDayContainingActivity(
  itinerary: Itinerary,
  activityId: string
): ItineraryDay | null {
  for (const day of itinerary.days) {
    const allActivities = [
      ...day.slots.morning,
      ...day.slots.afternoon,
      ...day.slots.evening,
    ];
    if (allActivities.some(a => a.id === activityId)) {
      return day;
    }
  }
  return null;
}

// ============================================================================
// Issue Detection
// ============================================================================

/**
 * Detect issues in the itinerary
 */
export function detectItineraryIssues(
  itinerary: Itinerary,
  weather?: WeatherForecast[]
): ItineraryIssue[] {
  const issues: ItineraryIssue[] = [];

  for (const day of itinerary.days) {
    // Check for packed days (5+ activities)
    const activityCount =
      day.slots.morning.length +
      day.slots.afternoon.length +
      day.slots.evening.length;

    if (activityCount >= 5) {
      issues.push({
        type: 'packed_day',
        severity: 'warning',
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber} has ${activityCount} activities - that's quite packed.`,
        suggestion: 'Consider removing or moving an activity to another day.',
        action: {
          type: 'lighten_day',
          params: [day.dayNumber.toString()],
          raw: `[ACTION:lighten_day:${day.dayNumber}]`,
        },
      });
    }

    // Check for weather issues on outdoor activities
    if (weather) {
      const dayWeather = weather.find(
        w => w.date.toDateString() === day.date.toDateString()
      );
      if (dayWeather && (dayWeather.condition === 'rainy' || dayWeather.condition === 'stormy')) {
        const outdoorActivities = [...day.slots.morning, ...day.slots.afternoon]
          .filter((a): a is PlaceActivity => a.type === 'place')
          .filter(a => a.place.category === 'nature' || a.place.category === 'activities');

        if (outdoorActivities.length > 0) {
          issues.push({
            type: 'weather',
            severity: 'warning',
            dayNumber: day.dayNumber,
            message: `Day ${day.dayNumber} has outdoor activities but weather looks ${dayWeather.condition}.`,
            suggestion: 'Consider swapping with a better weather day or planning indoor alternatives.',
          });
        }
      }
    }

    // Check for gaps (empty slots)
    if (day.slots.morning.length === 0 && day.slots.afternoon.length > 0) {
      issues.push({
        type: 'gap',
        severity: 'info',
        dayNumber: day.dayNumber,
        message: `Day ${day.dayNumber} morning is empty.`,
        suggestion: 'You could add a breakfast spot or morning activity.',
      });
    }
  }

  return issues;
}

/**
 * Get proactive message for detected issues
 */
export function getProactiveMessage(issues: ItineraryIssue[]): string | null {
  if (issues.length === 0) return null;

  // Prioritize by severity
  const highPriority = issues.filter(i => i.severity === 'error');
  const mediumPriority = issues.filter(i => i.severity === 'warning');

  if (highPriority.length > 0) {
    return highPriority[0].message + ' ' + (highPriority[0].suggestion || '');
  }

  if (mediumPriority.length > 0) {
    return mediumPriority[0].message + ' ' + (mediumPriority[0].suggestion || '');
  }

  return null;
}

// ============================================================================
// Context Building
// ============================================================================

/**
 * Build companion context from current state
 */
export function buildItineraryCompanionContext(
  itinerary: Itinerary,
  preferences: UserPreferences,
  selectedDay?: number,
  weather?: WeatherForecast[]
): ItineraryCompanionContext {
  return {
    itinerary,
    preferences,
    selectedDay,
    currentTime: new Date(),
    weather,
  };
}

/**
 * Generate system prompt from context
 */
export function generateSystemPrompt(
  context: ItineraryCompanionContext,
  compact = false
): string {
  return compact
    ? generateCompactItineraryPrompt(context)
    : generateItineraryCompanionPrompt(context);
}

// ============================================================================
// Conversation Management
// ============================================================================

/**
 * Create a new companion message
 */
export function createMessage(
  role: 'user' | 'assistant',
  content: string,
  actions?: ParsedAction[]
): CompanionMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date(),
    actions,
  };
}

/**
 * Process assistant response and extract actions
 */
export function processAssistantResponse(
  response: string,
  itinerary: Itinerary
): {
  message: CompanionMessage;
  cleanContent: string;
  executableActions: ItineraryAction[];
} {
  const actions = parseActionsFromResponse(response);
  const cleanContent = cleanResponseText(response);

  const executableActions = actions
    .map(a => createExecutableAction(a, itinerary))
    .filter((a): a is ItineraryAction => a !== null);

  return {
    message: createMessage('assistant', cleanContent, actions),
    cleanContent,
    executableActions,
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  generateQuickSuggestions,
  type QuickSuggestion,
  type ItineraryCompanionContext,
  type WeatherForecast,
};
