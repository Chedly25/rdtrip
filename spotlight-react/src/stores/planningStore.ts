/**
 * Planning Store
 *
 * Zustand store for Planning Mode state management.
 * Features:
 * - Full undo/redo support
 * - Optimistic updates
 * - Persistence to IndexedDB
 * - Collaboration-ready mutation layer
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { useEffect } from 'react';
import type {
  Slot,
  EnrichedPlace,
  PlannedItem,
  DayPlan,
  TripPlan,
  FilterState,
  AddPanelState,
  ConflictWarning,
  PlanAction,
  CompanionSuggestion,
} from '../types/planning';

// ============================================================================
// Types
// ============================================================================

interface CompanionMessage {
  id: string;
  type: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: Date;
  quick_actions?: { label: string; action: string }[];
}

// ============================================================================
// Store Interface
// ============================================================================

interface PlanningState {
  // Core State
  tripPlan: TripPlan | null;
  currentDayIndex: number;
  isLoading: boolean;
  error: string | null;

  // UI State
  selectedSlot: Slot | null;
  addPanelState: AddPanelState;
  filters: FilterState;
  warnings: ConflictWarning[];

  // Companion State
  companionMessages: CompanionMessage[];
  pendingSuggestions: CompanionSuggestion[];
  isCompanionMinimized: boolean;

  // Undo/Redo
  undoStack: PlanAction[];
  redoStack: PlanAction[];
  lastToast: { message: string; action?: PlanAction } | null;

  // Session
  sessionId: string;

  // ==================== Actions ====================

  // Plan Management
  setTripPlan: (plan: TripPlan) => void;
  initializePlan: (routeId: string, cities: { id: string; name: string; country: string; coordinates: { lat: number; lng: number }; nights: number }[], startDate: Date) => void;
  clearPlan: () => void;

  // Day Navigation
  setCurrentDay: (index: number) => void;
  nextDay: () => void;
  prevDay: () => void;

  // Item Actions
  addItem: (place: EnrichedPlace, dayIndex: number, slot: Slot, addedBy?: 'user' | 'ai') => string;
  removeItem: (itemId: string) => void;
  moveItem: (itemId: string, targetDay: number, targetSlot: Slot, targetOrder?: number) => void;
  reorderInSlot: (dayIndex: number, slot: Slot, fromIndex: number, toIndex: number) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  toggleItemLock: (itemId: string) => void;

  // Add Panel
  openAddPanel: (slot: Slot, dayIndex?: number) => void;
  closeAddPanel: () => void;
  setAddPanelAnchor: (lat: number, lng: number, name: string) => void;

  // Filters
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Warnings
  addWarning: (warning: ConflictWarning) => void;
  dismissWarning: (index: number) => void;
  clearWarnings: () => void;

  // Companion
  addCompanionMessage: (message: Omit<CompanionMessage, 'id' | 'timestamp'>) => void;
  addSuggestion: (suggestion: Omit<CompanionSuggestion, 'id'>) => void;
  dismissSuggestion: (id: string) => void;
  toggleCompanion: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearToast: () => void;

  // Selectors
  getCurrentDay: () => DayPlan | null;
  getDayItems: (dayIndex: number) => PlannedItem[];
  getSlotItems: (dayIndex: number, slot: Slot) => PlannedItem[];
  getTotalDuration: (dayIndex: number) => number;
  getItemById: (itemId: string) => { item: PlannedItem; dayIndex: number; slot: Slot } | null;
  getAllPlacedPlaceIds: () => Set<string>;

  // Reset
  reset: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const generateSessionId = () => `planning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createEmptySlots = () => ({
  morning: [] as PlannedItem[],
  afternoon: [] as PlannedItem[],
  evening: [] as PlannedItem[],
  night: [] as PlannedItem[],
});

// ============================================================================
// Initial State
// ============================================================================

const DEFAULT_FILTERS: FilterState = {
  types: [],
  price_levels: [],
  min_rating: 0,
  max_duration: null,
  vibes: [],
  show_hidden_gems_only: false,
};

const initialState = {
  tripPlan: null as TripPlan | null,
  currentDayIndex: 0,
  isLoading: false,
  error: null as string | null,

  selectedSlot: null as Slot | null,
  addPanelState: {
    isOpen: false,
    targetSlot: null,
    targetDayIndex: 0,
    anchor: null,
    anchorName: null,
  } as AddPanelState,
  filters: DEFAULT_FILTERS,
  warnings: [] as ConflictWarning[],

  companionMessages: [] as CompanionMessage[],
  pendingSuggestions: [] as CompanionSuggestion[],
  isCompanionMinimized: false,

  undoStack: [] as PlanAction[],
  redoStack: [] as PlanAction[],
  lastToast: null as { message: string; action?: PlanAction } | null,

  sessionId: generateSessionId(),
};

// ============================================================================
// Store
// ============================================================================

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ==================== Plan Management ====================

      setTripPlan: (plan) => {
        set({
          tripPlan: plan,
          currentDayIndex: 0,
          undoStack: [],
          redoStack: [],
        });
      },

      initializePlan: (routeId, cities, startDate) => {
        const days: DayPlan[] = [];
        // Ensure startDate is a valid Date object
        let currentDate = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
        if (isNaN(currentDate.getTime())) {
          console.error('[PlanningStore] Invalid startDate, using today');
          currentDate = new Date();
        }
        let dayIndex = 0;

        for (const city of cities) {
          for (let n = 0; n < city.nights; n++) {
            days.push({
              day_index: dayIndex,
              date: new Date(currentDate),
              city: {
                id: city.id,
                name: city.name,
                country: city.country,
                coordinates: city.coordinates,
              },
              slots: createEmptySlots(),
            });

            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex++;
          }
        }

        const plan: TripPlan = {
          id: uuid(),
          route_id: routeId,
          days,
          unassigned: [],
          filters: DEFAULT_FILTERS,
          created_at: new Date(),
          updated_at: new Date(),
        };

        set({
          tripPlan: plan,
          currentDayIndex: 0,
          undoStack: [],
          redoStack: [],
          companionMessages: [{
            id: uuid(),
            type: 'assistant',
            content: `Your trip is ready to plan! You have ${days.length} days across ${cities.length} ${cities.length === 1 ? 'city' : 'cities'}. Start by adding activities to each day's slots - morning, afternoon, evening, or night. I'll help you build a balanced itinerary.`,
            timestamp: new Date(),
          }],
        });
      },

      clearPlan: () => {
        set({
          tripPlan: null,
          currentDayIndex: 0,
          undoStack: [],
          redoStack: [],
        });
      },

      // ==================== Day Navigation ====================

      setCurrentDay: (index) => {
        const { tripPlan } = get();
        if (!tripPlan || index < 0 || index >= tripPlan.days.length) return;
        set({ currentDayIndex: index });
      },

      nextDay: () => {
        const { tripPlan, currentDayIndex } = get();
        if (!tripPlan || currentDayIndex >= tripPlan.days.length - 1) return;
        set({ currentDayIndex: currentDayIndex + 1 });
      },

      prevDay: () => {
        const { currentDayIndex } = get();
        if (currentDayIndex <= 0) return;
        set({ currentDayIndex: currentDayIndex - 1 });
      },

      // ==================== Item Actions ====================

      addItem: (place, dayIndex, slot, addedBy = 'user') => {
        const { tripPlan } = get();
        if (!tripPlan || dayIndex < 0 || dayIndex >= tripPlan.days.length) {
          console.error('Invalid day index for addItem');
          return '';
        }

        const itemId = uuid();
        const day = tripPlan.days[dayIndex];
        const orderInSlot = day.slots[slot].length;

        const newItem: PlannedItem = {
          id: itemId,
          place,
          day_index: dayIndex,
          slot,
          order_in_slot: orderInSlot,
          is_locked: false,
          added_at: new Date(),
          added_by: addedBy,
        };

        // Create action for undo
        const action: PlanAction = {
          id: uuid(),
          type: 'add',
          timestamp: new Date(),
          payload: {
            item_id: itemId,
            place,
            to_day: dayIndex,
            to_slot: slot,
            to_order: orderInSlot,
          },
          description: `Added ${place.name} to ${slot}`,
        };

        // Update state
        const newDays = [...tripPlan.days];
        newDays[dayIndex] = {
          ...day,
          slots: {
            ...day.slots,
            [slot]: [...day.slots[slot], newItem],
          },
        };

        set({
          tripPlan: {
            ...tripPlan,
            days: newDays,
            updated_at: new Date(),
          },
          undoStack: [...get().undoStack.slice(-49), action],
          redoStack: [],
          lastToast: { message: `Added ${place.name} to ${slot}`, action },
        });

        return itemId;
      },

      removeItem: (itemId) => {
        const { tripPlan, getItemById } = get();
        if (!tripPlan) return;

        const found = getItemById(itemId);
        if (!found) return;

        const { item, dayIndex, slot } = found;

        // Create action for undo
        const action: PlanAction = {
          id: uuid(),
          type: 'remove',
          timestamp: new Date(),
          payload: {
            item_id: itemId,
            place: item.place,
            from_day: dayIndex,
            from_slot: slot,
            from_order: item.order_in_slot,
          },
          description: `Removed ${item.place.name}`,
        };

        // Update state
        const newDays = [...tripPlan.days];
        const day = newDays[dayIndex];
        const newSlotItems = day.slots[slot]
          .filter((i) => i.id !== itemId)
          .map((i, idx) => ({ ...i, order_in_slot: idx }));

        newDays[dayIndex] = {
          ...day,
          slots: {
            ...day.slots,
            [slot]: newSlotItems,
          },
        };

        set({
          tripPlan: {
            ...tripPlan,
            days: newDays,
            updated_at: new Date(),
          },
          undoStack: [...get().undoStack.slice(-49), action],
          redoStack: [],
          lastToast: { message: `Removed ${item.place.name}`, action },
        });
      },

      moveItem: (itemId, targetDay, targetSlot, targetOrder) => {
        const { tripPlan, getItemById } = get();
        if (!tripPlan) return;

        const found = getItemById(itemId);
        if (!found) return;

        const { item, dayIndex: fromDay, slot: fromSlot } = found;

        // Create action for undo
        const action: PlanAction = {
          id: uuid(),
          type: 'move',
          timestamp: new Date(),
          payload: {
            item_id: itemId,
            from_day: fromDay,
            to_day: targetDay,
            from_slot: fromSlot,
            to_slot: targetSlot,
            from_order: item.order_in_slot,
            to_order: targetOrder,
          },
          description: `Moved ${item.place.name} to ${targetSlot}`,
        };

        const newDays = [...tripPlan.days];

        // Remove from source
        const sourceDay = newDays[fromDay];
        const sourceSlotItems = sourceDay.slots[fromSlot]
          .filter((i) => i.id !== itemId)
          .map((i, idx) => ({ ...i, order_in_slot: idx }));

        newDays[fromDay] = {
          ...sourceDay,
          slots: {
            ...sourceDay.slots,
            [fromSlot]: sourceSlotItems,
          },
        };

        // Add to target
        const targetDayObj = newDays[targetDay];
        const targetSlotItems = [...targetDayObj.slots[targetSlot]];
        const insertOrder = targetOrder ?? targetSlotItems.length;

        const movedItem: PlannedItem = {
          ...item,
          day_index: targetDay,
          slot: targetSlot,
          order_in_slot: insertOrder,
        };

        targetSlotItems.splice(insertOrder, 0, movedItem);
        const reorderedTargetItems = targetSlotItems.map((i, idx) => ({
          ...i,
          order_in_slot: idx,
        }));

        newDays[targetDay] = {
          ...targetDayObj,
          slots: {
            ...targetDayObj.slots,
            [targetSlot]: reorderedTargetItems,
          },
        };

        set({
          tripPlan: {
            ...tripPlan,
            days: newDays,
            updated_at: new Date(),
          },
          undoStack: [...get().undoStack.slice(-49), action],
          redoStack: [],
          lastToast: { message: `Moved ${item.place.name}`, action },
        });
      },

      reorderInSlot: (dayIndex, slot, fromIndex, toIndex) => {
        const { tripPlan } = get();
        if (!tripPlan) return;

        const day = tripPlan.days[dayIndex];
        if (!day) return;

        const items = [...day.slots[slot]];
        if (fromIndex < 0 || fromIndex >= items.length) return;
        if (toIndex < 0 || toIndex >= items.length) return;

        const [movedItem] = items.splice(fromIndex, 1);

        // Create action for undo
        const action: PlanAction = {
          id: uuid(),
          type: 'reorder',
          timestamp: new Date(),
          payload: {
            item_id: movedItem.id,
            from_day: dayIndex,
            to_day: dayIndex,
            from_slot: slot,
            to_slot: slot,
            from_order: fromIndex,
            to_order: toIndex,
          },
          description: `Reordered ${movedItem.place.name}`,
        };

        items.splice(toIndex, 0, movedItem);
        const reorderedItems = items.map((i, idx) => ({
          ...i,
          order_in_slot: idx,
        }));

        const newDays = [...tripPlan.days];
        newDays[dayIndex] = {
          ...day,
          slots: {
            ...day.slots,
            [slot]: reorderedItems,
          },
        };

        set({
          tripPlan: {
            ...tripPlan,
            days: newDays,
            updated_at: new Date(),
          },
          undoStack: [...get().undoStack.slice(-49), action],
          redoStack: [],
        });
      },

      updateItemNotes: (itemId, notes) => {
        const { tripPlan, getItemById } = get();
        if (!tripPlan) return;

        const found = getItemById(itemId);
        if (!found) return;

        const { item, dayIndex, slot } = found;

        const action: PlanAction = {
          id: uuid(),
          type: 'update_notes',
          timestamp: new Date(),
          payload: {
            item_id: itemId,
            notes: item.user_notes, // Old notes for undo
          },
          description: 'Updated notes',
        };

        const newDays = [...tripPlan.days];
        const day = newDays[dayIndex];
        const newSlotItems = day.slots[slot].map((i) =>
          i.id === itemId ? { ...i, user_notes: notes } : i
        );

        newDays[dayIndex] = {
          ...day,
          slots: {
            ...day.slots,
            [slot]: newSlotItems,
          },
        };

        set({
          tripPlan: {
            ...tripPlan,
            days: newDays,
            updated_at: new Date(),
          },
          undoStack: [...get().undoStack.slice(-49), action],
          redoStack: [],
        });
      },

      toggleItemLock: (itemId) => {
        const { tripPlan, getItemById } = get();
        if (!tripPlan) return;

        const found = getItemById(itemId);
        if (!found) return;

        const { dayIndex, slot } = found;

        const newDays = [...tripPlan.days];
        const day = newDays[dayIndex];
        const newSlotItems = day.slots[slot].map((i) =>
          i.id === itemId ? { ...i, is_locked: !i.is_locked } : i
        );

        newDays[dayIndex] = {
          ...day,
          slots: {
            ...day.slots,
            [slot]: newSlotItems,
          },
        };

        set({
          tripPlan: {
            ...tripPlan,
            days: newDays,
            updated_at: new Date(),
          },
        });
      },

      // ==================== Add Panel ====================

      openAddPanel: (slot, dayIndex) => {
        const { currentDayIndex, tripPlan } = get();
        const targetDay = dayIndex ?? currentDayIndex;
        const day = tripPlan?.days[targetDay];

        // Find anchor (last item in slot or previous slot)
        let anchor: { lat: number; lng: number } | null = null;
        let anchorName: string | null = null;

        if (day) {
          const slotOrder: Slot[] = ['morning', 'afternoon', 'evening', 'night'];
          const slotIndex = slotOrder.indexOf(slot);

          // Check current slot first
          const currentSlotItems = day.slots[slot];
          if (currentSlotItems.length > 0) {
            const lastItem = currentSlotItems[currentSlotItems.length - 1];
            anchor = lastItem.place.geometry.location;
            anchorName = lastItem.place.name;
          } else {
            // Check previous slots
            for (let i = slotIndex - 1; i >= 0; i--) {
              const prevSlotItems = day.slots[slotOrder[i]];
              if (prevSlotItems.length > 0) {
                const lastItem = prevSlotItems[prevSlotItems.length - 1];
                anchor = lastItem.place.geometry.location;
                anchorName = lastItem.place.name;
                break;
              }
            }
          }

          // Fall back to city center
          if (!anchor) {
            anchor = day.city.coordinates;
            anchorName = day.city.name;
          }
        }

        set({
          addPanelState: {
            isOpen: true,
            targetSlot: slot,
            targetDayIndex: targetDay,
            anchor,
            anchorName,
          },
          selectedSlot: slot,
        });
      },

      closeAddPanel: () => {
        set({
          addPanelState: {
            isOpen: false,
            targetSlot: null,
            targetDayIndex: 0,
            anchor: null,
            anchorName: null,
          },
          selectedSlot: null,
        });
      },

      setAddPanelAnchor: (lat, lng, name) => {
        set({
          addPanelState: {
            ...get().addPanelState,
            anchor: { lat, lng },
            anchorName: name,
          },
        });
      },

      // ==================== Filters ====================

      setFilters: (filters) => {
        set({
          filters: {
            ...get().filters,
            ...filters,
          },
        });
      },

      resetFilters: () => {
        set({ filters: DEFAULT_FILTERS });
      },

      // ==================== Warnings ====================

      addWarning: (warning) => {
        set({
          warnings: [...get().warnings, warning],
        });
      },

      dismissWarning: (index) => {
        set({
          warnings: get().warnings.filter((_, i) => i !== index),
        });
      },

      clearWarnings: () => {
        set({ warnings: [] });
      },

      // ==================== Companion ====================

      addCompanionMessage: (message) => {
        set({
          companionMessages: [
            ...get().companionMessages,
            {
              ...message,
              id: uuid(),
              timestamp: new Date(),
            },
          ],
        });
      },

      addSuggestion: (suggestion) => {
        set({
          pendingSuggestions: [
            ...get().pendingSuggestions,
            {
              ...suggestion,
              id: uuid(),
            },
          ],
        });
      },

      dismissSuggestion: (id) => {
        set({
          pendingSuggestions: get().pendingSuggestions.filter((s) => s.id !== id),
        });
      },

      toggleCompanion: () => {
        set({
          isCompanionMinimized: !get().isCompanionMinimized,
        });
      },

      // ==================== Undo/Redo ====================

      undo: () => {
        const { undoStack, tripPlan } = get();
        if (undoStack.length === 0 || !tripPlan) return;

        const action = undoStack[undoStack.length - 1];

        // Apply inverse action based on type
        switch (action.type) {
          case 'add': {
            // Undo add = remove
            const { item_id } = action.payload;
            if (!item_id) return;

            const found = get().getItemById(item_id);
            if (!found) return;

            const { dayIndex, slot } = found;
            const newDays = [...tripPlan.days];
            const day = newDays[dayIndex];
            const newSlotItems = day.slots[slot]
              .filter((i) => i.id !== item_id)
              .map((i, idx) => ({ ...i, order_in_slot: idx }));

            newDays[dayIndex] = {
              ...day,
              slots: { ...day.slots, [slot]: newSlotItems },
            };

            set({
              tripPlan: { ...tripPlan, days: newDays, updated_at: new Date() },
              undoStack: undoStack.slice(0, -1),
              redoStack: [...get().redoStack, action],
              lastToast: { message: `Undo: removed ${action.payload.place?.name}` },
            });
            break;
          }

          case 'remove': {
            // Undo remove = add back
            const { place, from_day, from_slot, from_order } = action.payload;
            if (!place || from_day === undefined || !from_slot) return;

            const newItem: PlannedItem = {
              id: action.payload.item_id || uuid(),
              place,
              day_index: from_day,
              slot: from_slot,
              order_in_slot: from_order || 0,
              is_locked: false,
              added_at: new Date(),
              added_by: 'user',
            };

            const newDays = [...tripPlan.days];
            const day = newDays[from_day];
            const newSlotItems = [...day.slots[from_slot]];
            newSlotItems.splice(from_order || 0, 0, newItem);
            const reorderedItems = newSlotItems.map((i, idx) => ({
              ...i,
              order_in_slot: idx,
            }));

            newDays[from_day] = {
              ...day,
              slots: { ...day.slots, [from_slot]: reorderedItems },
            };

            set({
              tripPlan: { ...tripPlan, days: newDays, updated_at: new Date() },
              undoStack: undoStack.slice(0, -1),
              redoStack: [...get().redoStack, action],
              lastToast: { message: `Undo: restored ${place.name}` },
            });
            break;
          }

          case 'move': {
            // Undo move = move back
            const { item_id, from_day, from_slot, from_order, to_day, to_slot } = action.payload;
            if (!item_id || from_day === undefined || !from_slot || to_day === undefined || !to_slot) return;

            // Find item in target location and move back
            const found = get().getItemById(item_id);
            if (!found) return;

            const { item } = found;

            const newDays = [...tripPlan.days];

            // Remove from current (to) location
            const toDay = newDays[to_day];
            const toSlotItems = toDay.slots[to_slot]
              .filter((i) => i.id !== item_id)
              .map((i, idx) => ({ ...i, order_in_slot: idx }));

            newDays[to_day] = {
              ...toDay,
              slots: { ...toDay.slots, [to_slot]: toSlotItems },
            };

            // Add back to original (from) location
            const fromDayObj = newDays[from_day];
            const fromSlotItems = [...fromDayObj.slots[from_slot]];
            const restoredItem: PlannedItem = {
              ...item,
              day_index: from_day,
              slot: from_slot,
              order_in_slot: from_order || 0,
            };

            fromSlotItems.splice(from_order || 0, 0, restoredItem);
            const reorderedFromItems = fromSlotItems.map((i, idx) => ({
              ...i,
              order_in_slot: idx,
            }));

            newDays[from_day] = {
              ...fromDayObj,
              slots: { ...fromDayObj.slots, [from_slot]: reorderedFromItems },
            };

            set({
              tripPlan: { ...tripPlan, days: newDays, updated_at: new Date() },
              undoStack: undoStack.slice(0, -1),
              redoStack: [...get().redoStack, action],
              lastToast: { message: `Undo: moved ${item.place.name} back` },
            });
            break;
          }

          case 'reorder': {
            const { item_id, from_day, from_slot, from_order, to_order } = action.payload;
            if (!item_id || from_day === undefined || !from_slot || from_order === undefined || to_order === undefined) return;

            // Swap back
            get().reorderInSlot(from_day, from_slot, to_order, from_order);

            set({
              undoStack: undoStack.slice(0, -1),
              redoStack: [...get().redoStack, action],
            });
            break;
          }

          default:
            set({
              undoStack: undoStack.slice(0, -1),
              redoStack: [...get().redoStack, action],
            });
        }
      },

      redo: () => {
        const { redoStack, tripPlan } = get();
        if (redoStack.length === 0 || !tripPlan) return;

        const action = redoStack[redoStack.length - 1];

        // Re-apply action based on type
        switch (action.type) {
          case 'add': {
            const { place, to_day, to_slot } = action.payload;
            if (!place || to_day === undefined || !to_slot) return;

            get().addItem(place, to_day, to_slot);

            set({
              redoStack: redoStack.slice(0, -1),
            });
            break;
          }

          case 'remove': {
            const { item_id } = action.payload;
            if (!item_id) return;

            get().removeItem(item_id);

            set({
              redoStack: redoStack.slice(0, -1),
            });
            break;
          }

          case 'move': {
            const { item_id, to_day, to_slot, to_order } = action.payload;
            if (!item_id || to_day === undefined || !to_slot) return;

            get().moveItem(item_id, to_day, to_slot, to_order);

            set({
              redoStack: redoStack.slice(0, -1),
            });
            break;
          }

          case 'reorder': {
            const { from_day, from_slot, from_order, to_order } = action.payload;
            if (from_day === undefined || !from_slot || from_order === undefined || to_order === undefined) return;

            get().reorderInSlot(from_day, from_slot, from_order, to_order);

            set({
              redoStack: redoStack.slice(0, -1),
            });
            break;
          }

          default:
            set({
              redoStack: redoStack.slice(0, -1),
            });
        }
      },

      canUndo: () => get().undoStack.length > 0,
      canRedo: () => get().redoStack.length > 0,

      clearToast: () => {
        set({ lastToast: null });
      },

      // ==================== Selectors ====================

      getCurrentDay: () => {
        const { tripPlan, currentDayIndex } = get();
        if (!tripPlan || currentDayIndex >= tripPlan.days.length) return null;
        return tripPlan.days[currentDayIndex];
      },

      getDayItems: (dayIndex) => {
        const { tripPlan } = get();
        if (!tripPlan || dayIndex >= tripPlan.days.length) return [];

        const day = tripPlan.days[dayIndex];
        const slotOrder: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

        return slotOrder.flatMap((slot) => day.slots[slot]);
      },

      getSlotItems: (dayIndex, slot) => {
        const { tripPlan } = get();
        if (!tripPlan || dayIndex >= tripPlan.days.length) return [];
        return tripPlan.days[dayIndex].slots[slot];
      },

      getTotalDuration: (dayIndex) => {
        const items = get().getDayItems(dayIndex);
        return items.reduce((sum, item) => sum + item.place.estimated_duration_mins, 0);
      },

      getItemById: (itemId) => {
        const { tripPlan } = get();
        if (!tripPlan) return null;

        for (const day of tripPlan.days) {
          const slotOrder: Slot[] = ['morning', 'afternoon', 'evening', 'night'];
          for (const slot of slotOrder) {
            const item = day.slots[slot].find((i) => i.id === itemId);
            if (item) {
              return { item, dayIndex: day.day_index, slot };
            }
          }
        }
        return null;
      },

      getAllPlacedPlaceIds: () => {
        const { tripPlan } = get();
        if (!tripPlan) return new Set<string>();

        const ids = new Set<string>();
        for (const day of tripPlan.days) {
          const slotOrder: Slot[] = ['morning', 'afternoon', 'evening', 'night'];
          for (const slot of slotOrder) {
            for (const item of day.slots[slot]) {
              ids.add(item.place.place_id);
            }
          }
        }
        return ids;
      },

      // ==================== Reset ====================

      reset: () => {
        set({
          ...initialState,
          sessionId: generateSessionId(),
        });
      },
    }),
    {
      name: 'waycraft-planning-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tripPlan: state.tripPlan,
        currentDayIndex: state.currentDayIndex,
        filters: state.filters,
        sessionId: state.sessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore Date objects
          if (state.tripPlan) {
            state.tripPlan.created_at = new Date(state.tripPlan.created_at);
            state.tripPlan.updated_at = new Date(state.tripPlan.updated_at);
            state.tripPlan.days = state.tripPlan.days.map((day) => ({
              ...day,
              date: new Date(day.date),
              slots: {
                morning: day.slots.morning.map((i) => ({ ...i, added_at: new Date(i.added_at) })),
                afternoon: day.slots.afternoon.map((i) => ({ ...i, added_at: new Date(i.added_at) })),
                evening: day.slots.evening.map((i) => ({ ...i, added_at: new Date(i.added_at) })),
                night: day.slots.night.map((i) => ({ ...i, added_at: new Date(i.added_at) })),
              },
            }));
          }
        }
      },
      version: 1,
    }
  )
);

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

export function usePlanningKeyboardShortcuts() {
  const { undo, redo, canUndo, canRedo } = usePlanningStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'z' && !e.shiftKey && canUndo()) {
        e.preventDefault();
        undo();
      } else if (modifier && e.key === 'z' && e.shiftKey && canRedo()) {
        e.preventDefault();
        redo();
      } else if (modifier && e.key === 'y' && canRedo()) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);
}
