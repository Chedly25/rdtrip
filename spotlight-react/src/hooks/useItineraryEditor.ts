/**
 * useItineraryEditor
 *
 * WI-5.6: Hook for managing itinerary edit operations
 *
 * Features:
 * - Reorder activities within a day
 * - Move activities between days
 * - Remove activities with options (fill gap or leave free time)
 * - Add activities from favourites, search, or AI suggestion
 * - Swap activities with alternatives
 * - Adjust time allocations
 * - Undo/redo support
 *
 * Architecture Decisions:
 * - Immutable state updates for predictable behavior
 * - Operation history for undo/redo
 * - Optimistic updates with rollback on error
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  Itinerary,
  ItineraryDay,
  ItineraryActivity,
  PlaceActivity,
  FreeTimeActivity,
  TimeSlot,
  ItineraryPlace,
} from '../services/itinerary';
import { CATEGORY_DURATION_ESTIMATES } from '../services/itinerary';

// ============================================================================
// Types
// ============================================================================

export type RemoveOption = 'fill-gap' | 'leave-free-time';

export interface EditOperation {
  type: 'reorder' | 'move' | 'remove' | 'add' | 'swap' | 'adjust-time';
  timestamp: number;
  /** Snapshot before the operation for undo */
  previousState: Itinerary;
  /** Description for UI display */
  description: string;
}

export interface UseItineraryEditorOptions {
  /** Callback when itinerary changes */
  onChange?: (itinerary: Itinerary) => void;
  /** Callback when operation fails */
  onError?: (error: string) => void;
  /** Maximum undo history size */
  maxHistorySize?: number;
}

export interface UseItineraryEditorReturn {
  // State
  itinerary: Itinerary | null;
  isEditing: boolean;
  hasChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setItinerary: (itinerary: Itinerary) => void;
  startEditing: () => void;
  stopEditing: () => void;

  // Reorder operations
  reorderActivitiesInSlot: (
    dayNumber: number,
    slot: TimeSlot,
    fromIndex: number,
    toIndex: number
  ) => void;

  // Move operations
  moveActivityToDay: (
    fromDayNumber: number,
    toDayNumber: number,
    activityId: string,
    targetSlot?: TimeSlot
  ) => void;

  moveActivityToSlot: (
    dayNumber: number,
    activityId: string,
    fromSlot: TimeSlot,
    toSlot: TimeSlot
  ) => void;

  // Remove operations
  removeActivity: (
    dayNumber: number,
    activityId: string,
    option: RemoveOption
  ) => void;

  // Add operations
  addActivity: (
    dayNumber: number,
    slot: TimeSlot,
    activity: Omit<PlaceActivity, 'id' | 'slot' | 'orderInSlot'>
  ) => void;

  addFreeTime: (
    dayNumber: number,
    slot: TimeSlot,
    durationMinutes: number,
    suggestion?: string
  ) => void;

  // Swap operations
  swapActivity: (
    dayNumber: number,
    activityId: string,
    newActivity: Omit<PlaceActivity, 'id' | 'slot' | 'orderInSlot'>
  ) => void;

  // Time adjustments
  adjustActivityDuration: (
    dayNumber: number,
    activityId: string,
    newDurationMinutes: number
  ) => void;

  adjustActivityTime: (
    dayNumber: number,
    activityId: string,
    newStartTime: string
  ) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Utilities
  recalculateTimings: (dayNumber: number) => void;
  getActivityById: (activityId: string) => { activity: ItineraryActivity; day: ItineraryDay } | null;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone an itinerary
 */
function cloneItinerary(itinerary: Itinerary): Itinerary {
  return JSON.parse(JSON.stringify(itinerary));
}

/**
 * Parse time string to minutes from midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get slot start time
 */
const SLOT_START_TIMES: Record<TimeSlot, string> = {
  morning: '09:00',
  afternoon: '12:00',
  evening: '18:00',
};

/**
 * Recalculate activity timings for a slot
 */
function recalculateSlotTimings(
  activities: ItineraryActivity[],
  slot: TimeSlot
): ItineraryActivity[] {
  let currentTime = parseTimeToMinutes(SLOT_START_TIMES[slot]);
  const BUFFER_MINUTES = 15;

  return activities.map((activity, index) => ({
    ...activity,
    orderInSlot: index,
    startTime: minutesToTime(currentTime),
    endTime: minutesToTime(currentTime + activity.durationMinutes),
  })).map((activity, index, arr) => {
    if (index < arr.length - 1) {
      currentTime = parseTimeToMinutes(activity.endTime!) + BUFFER_MINUTES;
    }
    return activity;
  });
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useItineraryEditor(
  options: UseItineraryEditorOptions = {}
): UseItineraryEditorReturn {
  const { onChange, onError, maxHistorySize = 20 } = options;

  // State
  const [itinerary, setItineraryState] = useState<Itinerary | null>(null);
  const [originalItinerary, setOriginalItinerary] = useState<Itinerary | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState<EditOperation[]>([]);
  const [redoStack, setRedoStack] = useState<EditOperation[]>([]);

  // Computed
  const hasChanges = useMemo(() => {
    if (!itinerary || !originalItinerary) return false;
    return JSON.stringify(itinerary) !== JSON.stringify(originalItinerary);
  }, [itinerary, originalItinerary]);

  const canUndo = history.length > 0;
  const canRedo = redoStack.length > 0;

  // Helper to update itinerary with history
  const updateItinerary = useCallback(
    (
      newItinerary: Itinerary,
      operation: Omit<EditOperation, 'timestamp' | 'previousState'>
    ) => {
      if (!itinerary) return;

      // Save to history
      const historyEntry: EditOperation = {
        ...operation,
        timestamp: Date.now(),
        previousState: cloneItinerary(itinerary),
      };

      setHistory((prev) => {
        const newHistory = [...prev, historyEntry];
        if (newHistory.length > maxHistorySize) {
          return newHistory.slice(-maxHistorySize);
        }
        return newHistory;
      });

      // Clear redo stack on new operation
      setRedoStack([]);

      // Update state
      setItineraryState(newItinerary);
      onChange?.(newItinerary);
    },
    [itinerary, maxHistorySize, onChange]
  );

  // Set itinerary
  const setItinerary = useCallback((newItinerary: Itinerary) => {
    setItineraryState(newItinerary);
    setOriginalItinerary(cloneItinerary(newItinerary));
    setHistory([]);
    setRedoStack([]);
  }, []);

  // Start/stop editing
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    if (itinerary) {
      setOriginalItinerary(cloneItinerary(itinerary));
    }
    setHistory([]);
    setRedoStack([]);
  }, [itinerary]);

  // Get activity by ID
  const getActivityById = useCallback(
    (activityId: string): { activity: ItineraryActivity; day: ItineraryDay } | null => {
      if (!itinerary) return null;

      for (const day of itinerary.days) {
        for (const slot of ['morning', 'afternoon', 'evening'] as TimeSlot[]) {
          const activity = day.slots[slot].find((a) => a.id === activityId);
          if (activity) {
            return { activity, day };
          }
        }
      }
      return null;
    },
    [itinerary]
  );

  // Reorder activities within a slot
  const reorderActivitiesInSlot = useCallback(
    (dayNumber: number, slot: TimeSlot, fromIndex: number, toIndex: number) => {
      if (!itinerary) return;

      const newItinerary = cloneItinerary(itinerary);
      const day = newItinerary.days.find((d) => d.dayNumber === dayNumber);
      if (!day) {
        onError?.(`Day ${dayNumber} not found`);
        return;
      }

      const activities = [...day.slots[slot]];
      const [moved] = activities.splice(fromIndex, 1);
      activities.splice(toIndex, 0, moved);

      // Recalculate timings
      day.slots[slot] = recalculateSlotTimings(activities, slot);

      updateItinerary(newItinerary, {
        type: 'reorder',
        description: `Reordered activities in ${slot}`,
      });
    },
    [itinerary, onError, updateItinerary]
  );

  // Move activity to different day
  const moveActivityToDay = useCallback(
    (
      fromDayNumber: number,
      toDayNumber: number,
      activityId: string,
      targetSlot?: TimeSlot
    ) => {
      if (!itinerary) return;

      const newItinerary = cloneItinerary(itinerary);
      const fromDay = newItinerary.days.find((d) => d.dayNumber === fromDayNumber);
      const toDay = newItinerary.days.find((d) => d.dayNumber === toDayNumber);

      if (!fromDay || !toDay) {
        onError?.('Day not found');
        return;
      }

      // Find and remove activity from source
      let activity: ItineraryActivity | null = null;
      let sourceSlot: TimeSlot | null = null;

      for (const slot of ['morning', 'afternoon', 'evening'] as TimeSlot[]) {
        const index = fromDay.slots[slot].findIndex((a) => a.id === activityId);
        if (index !== -1) {
          activity = fromDay.slots[slot].splice(index, 1)[0];
          sourceSlot = slot;
          break;
        }
      }

      if (!activity || !sourceSlot) {
        onError?.('Activity not found');
        return;
      }

      // Add to target day
      const destSlot = targetSlot || sourceSlot;
      activity.slot = destSlot;
      toDay.slots[destSlot].push(activity);

      // Recalculate timings for both days
      fromDay.slots[sourceSlot] = recalculateSlotTimings(fromDay.slots[sourceSlot], sourceSlot);
      toDay.slots[destSlot] = recalculateSlotTimings(toDay.slots[destSlot], destSlot);

      updateItinerary(newItinerary, {
        type: 'move',
        description: `Moved activity to Day ${toDayNumber}`,
      });
    },
    [itinerary, onError, updateItinerary]
  );

  // Move activity to different slot within same day
  const moveActivityToSlot = useCallback(
    (dayNumber: number, activityId: string, fromSlot: TimeSlot, toSlot: TimeSlot) => {
      if (!itinerary || fromSlot === toSlot) return;

      const newItinerary = cloneItinerary(itinerary);
      const day = newItinerary.days.find((d) => d.dayNumber === dayNumber);

      if (!day) {
        onError?.('Day not found');
        return;
      }

      // Find and remove from source slot
      const index = day.slots[fromSlot].findIndex((a) => a.id === activityId);
      if (index === -1) {
        onError?.('Activity not found');
        return;
      }

      const [activity] = day.slots[fromSlot].splice(index, 1);
      activity.slot = toSlot;

      // Add to target slot
      day.slots[toSlot].push(activity);

      // Recalculate timings for both slots
      day.slots[fromSlot] = recalculateSlotTimings(day.slots[fromSlot], fromSlot);
      day.slots[toSlot] = recalculateSlotTimings(day.slots[toSlot], toSlot);

      updateItinerary(newItinerary, {
        type: 'move',
        description: `Moved activity to ${toSlot}`,
      });
    },
    [itinerary, onError, updateItinerary]
  );

  // Remove activity
  const removeActivity = useCallback(
    (dayNumber: number, activityId: string, option: RemoveOption) => {
      if (!itinerary) return;

      const newItinerary = cloneItinerary(itinerary);
      const day = newItinerary.days.find((d) => d.dayNumber === dayNumber);

      if (!day) {
        onError?.('Day not found');
        return;
      }

      // Find and remove activity
      let removedActivity: ItineraryActivity | null = null;
      let slot: TimeSlot | null = null;
      let index = -1;

      for (const s of ['morning', 'afternoon', 'evening'] as TimeSlot[]) {
        index = day.slots[s].findIndex((a) => a.id === activityId);
        if (index !== -1) {
          removedActivity = day.slots[s][index];
          slot = s;
          day.slots[s].splice(index, 1);
          break;
        }
      }

      if (!removedActivity || !slot) {
        onError?.('Activity not found');
        return;
      }

      // Handle removal option
      if (option === 'leave-free-time' && removedActivity.type === 'place') {
        // Create free time block in place of removed activity
        const freeTime: FreeTimeActivity = {
          type: 'free_time',
          id: generateId(),
          slot,
          orderInSlot: index,
          durationMinutes: removedActivity.durationMinutes,
          suggestion: 'Explore on your own',
        };
        day.slots[slot].splice(index, 0, freeTime);
      }

      // Recalculate timings
      day.slots[slot] = recalculateSlotTimings(day.slots[slot], slot);

      // Update summary
      if (removedActivity.type === 'place') {
        newItinerary.summary.totalActivities = Math.max(
          0,
          newItinerary.summary.totalActivities - 1
        );
        if (removedActivity.isHiddenGem) {
          newItinerary.summary.hiddenGemsCount = Math.max(
            0,
            newItinerary.summary.hiddenGemsCount - 1
          );
        }
        if (removedActivity.isFavourited) {
          newItinerary.summary.favouritedCount = Math.max(
            0,
            newItinerary.summary.favouritedCount - 1
          );
        }
      }

      updateItinerary(newItinerary, {
        type: 'remove',
        description: `Removed activity`,
      });
    },
    [itinerary, onError, updateItinerary]
  );

  // Add activity
  const addActivity = useCallback(
    (
      dayNumber: number,
      slot: TimeSlot,
      activity: Omit<PlaceActivity, 'id' | 'slot' | 'orderInSlot'>
    ) => {
      if (!itinerary) return;

      const newItinerary = cloneItinerary(itinerary);
      const day = newItinerary.days.find((d) => d.dayNumber === dayNumber);

      if (!day) {
        onError?.('Day not found');
        return;
      }

      const newActivity: PlaceActivity = {
        ...activity,
        id: generateId(),
        slot,
        orderInSlot: day.slots[slot].length,
      };

      day.slots[slot].push(newActivity);
      day.slots[slot] = recalculateSlotTimings(day.slots[slot], slot);

      // Update summary
      newItinerary.summary.totalActivities++;
      if (newActivity.isHiddenGem) {
        newItinerary.summary.hiddenGemsCount++;
      }
      if (newActivity.isFavourited) {
        newItinerary.summary.favouritedCount++;
      }

      updateItinerary(newItinerary, {
        type: 'add',
        description: `Added ${newActivity.place.name}`,
      });
    },
    [itinerary, onError, updateItinerary]
  );

  // Add free time
  const addFreeTime = useCallback(
    (dayNumber: number, slot: TimeSlot, durationMinutes: number, suggestion?: string) => {
      if (!itinerary) return;

      const newItinerary = cloneItinerary(itinerary);
      const day = newItinerary.days.find((d) => d.dayNumber === dayNumber);

      if (!day) {
        onError?.('Day not found');
        return;
      }

      const freeTime: FreeTimeActivity = {
        type: 'free_time',
        id: generateId(),
        slot,
        orderInSlot: day.slots[slot].length,
        durationMinutes,
        suggestion,
      };

      day.slots[slot].push(freeTime);
      day.slots[slot] = recalculateSlotTimings(day.slots[slot], slot);

      updateItinerary(newItinerary, {
        type: 'add',
        description: 'Added free time',
      });
    },
    [itinerary, onError, updateItinerary]
  );

  // Swap activity
  const swapActivity = useCallback(
    (
      dayNumber: number,
      activityId: string,
      newActivity: Omit<PlaceActivity, 'id' | 'slot' | 'orderInSlot'>
    ) => {
      if (!itinerary) return;

      const newItinerary = cloneItinerary(itinerary);
      const day = newItinerary.days.find((d) => d.dayNumber === dayNumber);

      if (!day) {
        onError?.('Day not found');
        return;
      }

      // Find activity to swap
      for (const slot of ['morning', 'afternoon', 'evening'] as TimeSlot[]) {
        const index = day.slots[slot].findIndex((a) => a.id === activityId);
        if (index !== -1) {
          const oldActivity = day.slots[slot][index];

          // Update summary if swapping place activities
          if (oldActivity.type === 'place') {
            if (oldActivity.isHiddenGem) {
              newItinerary.summary.hiddenGemsCount = Math.max(0, newItinerary.summary.hiddenGemsCount - 1);
            }
            if (oldActivity.isFavourited) {
              newItinerary.summary.favouritedCount = Math.max(0, newItinerary.summary.favouritedCount - 1);
            }
          }

          // Create new activity with same position
          const swappedActivity: PlaceActivity = {
            ...newActivity,
            id: generateId(),
            slot,
            orderInSlot: index,
            startTime: oldActivity.startTime,
          };

          day.slots[slot][index] = swappedActivity;

          // Update summary
          if (swappedActivity.isHiddenGem) {
            newItinerary.summary.hiddenGemsCount++;
          }
          if (swappedActivity.isFavourited) {
            newItinerary.summary.favouritedCount++;
          }

          // Recalculate if duration changed
          if (swappedActivity.durationMinutes !== oldActivity.durationMinutes) {
            day.slots[slot] = recalculateSlotTimings(day.slots[slot], slot);
          }

          updateItinerary(newItinerary, {
            type: 'swap',
            description: `Swapped for ${swappedActivity.place.name}`,
          });
          return;
        }
      }

      onError?.('Activity not found');
    },
    [itinerary, onError, updateItinerary]
  );

  // Adjust activity duration
  const adjustActivityDuration = useCallback(
    (dayNumber: number, activityId: string, newDurationMinutes: number) => {
      if (!itinerary) return;

      const newItinerary = cloneItinerary(itinerary);
      const day = newItinerary.days.find((d) => d.dayNumber === dayNumber);

      if (!day) {
        onError?.('Day not found');
        return;
      }

      for (const slot of ['morning', 'afternoon', 'evening'] as TimeSlot[]) {
        const activity = day.slots[slot].find((a) => a.id === activityId);
        if (activity) {
          activity.durationMinutes = newDurationMinutes;
          day.slots[slot] = recalculateSlotTimings(day.slots[slot], slot);

          updateItinerary(newItinerary, {
            type: 'adjust-time',
            description: 'Adjusted duration',
          });
          return;
        }
      }

      onError?.('Activity not found');
    },
    [itinerary, onError, updateItinerary]
  );

  // Adjust activity start time
  const adjustActivityTime = useCallback(
    (dayNumber: number, activityId: string, newStartTime: string) => {
      if (!itinerary) return;

      const newItinerary = cloneItinerary(itinerary);
      const day = newItinerary.days.find((d) => d.dayNumber === dayNumber);

      if (!day) {
        onError?.('Day not found');
        return;
      }

      for (const slot of ['morning', 'afternoon', 'evening'] as TimeSlot[]) {
        const activity = day.slots[slot].find((a) => a.id === activityId);
        if (activity) {
          activity.startTime = newStartTime;
          const endMinutes = parseTimeToMinutes(newStartTime) + activity.durationMinutes;
          activity.endTime = minutesToTime(endMinutes);

          updateItinerary(newItinerary, {
            type: 'adjust-time',
            description: 'Adjusted start time',
          });
          return;
        }
      }

      onError?.('Activity not found');
    },
    [itinerary, onError, updateItinerary]
  );

  // Recalculate all timings for a day
  const recalculateTimings = useCallback(
    (dayNumber: number) => {
      if (!itinerary) return;

      const newItinerary = cloneItinerary(itinerary);
      const day = newItinerary.days.find((d) => d.dayNumber === dayNumber);

      if (!day) return;

      for (const slot of ['morning', 'afternoon', 'evening'] as TimeSlot[]) {
        day.slots[slot] = recalculateSlotTimings(day.slots[slot], slot);
      }

      setItineraryState(newItinerary);
      onChange?.(newItinerary);
    },
    [itinerary, onChange]
  );

  // Undo
  const undo = useCallback(() => {
    if (history.length === 0 || !itinerary) return;

    const lastOperation = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    // Save current state to redo stack
    setRedoStack((prev) => [
      ...prev,
      {
        ...lastOperation,
        previousState: cloneItinerary(itinerary),
      },
    ]);

    // Restore previous state
    setItineraryState(lastOperation.previousState);
    setHistory(newHistory);
    onChange?.(lastOperation.previousState);
  }, [history, itinerary, onChange]);

  // Redo
  const redo = useCallback(() => {
    if (redoStack.length === 0 || !itinerary) return;

    const lastRedo = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    // Save current state to history
    setHistory((prev) => [
      ...prev,
      {
        ...lastRedo,
        previousState: cloneItinerary(itinerary),
      },
    ]);

    // Restore redo state
    setItineraryState(lastRedo.previousState);
    setRedoStack(newRedoStack);
    onChange?.(lastRedo.previousState);
  }, [redoStack, itinerary, onChange]);

  return {
    // State
    itinerary,
    isEditing,
    hasChanges,
    canUndo,
    canRedo,

    // Actions
    setItinerary,
    startEditing,
    stopEditing,

    // Operations
    reorderActivitiesInSlot,
    moveActivityToDay,
    moveActivityToSlot,
    removeActivity,
    addActivity,
    addFreeTime,
    swapActivity,
    adjustActivityDuration,
    adjustActivityTime,

    // Undo/Redo
    undo,
    redo,

    // Utilities
    recalculateTimings,
    getActivityById,
  };
}

// ============================================================================
// Helper function to create a place activity from ItineraryPlace
// ============================================================================

export function createPlaceActivity(
  place: ItineraryPlace,
  options: {
    isFavourited?: boolean;
    isHiddenGem?: boolean;
    preferenceScore?: number;
    notes?: string;
  } = {}
): Omit<PlaceActivity, 'id' | 'slot' | 'orderInSlot'> {
  return {
    type: 'place',
    place,
    durationMinutes: CATEGORY_DURATION_ESTIMATES[place.category] || 60,
    isFavourited: options.isFavourited ?? false,
    isHiddenGem: options.isHiddenGem ?? (place.hiddenGemScore ? place.hiddenGemScore > 0.5 : false),
    preferenceScore: options.preferenceScore,
    notes: options.notes,
  };
}
