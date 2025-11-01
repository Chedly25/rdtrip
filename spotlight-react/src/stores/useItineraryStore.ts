/**
 * Itinerary Customization Store
 * Manages user modifications to AI-generated itineraries
 * Supports optimistic updates with background sync to database
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Customizations {
  removed?: {
    activities?: string[];
    restaurants?: string[];
    accommodations?: string[];
    scenicStops?: string[];
  };
  added?: {
    activities?: any[];
    restaurants?: any[];
    accommodations?: any[];
    scenicStops?: any[];
  };
  edited?: {
    [key: string]: Partial<any>;
  };
  reordered?: {
    [key: string]: string[];
  };
  notes?: {
    [key: string]: string;
  };
  flags?: {
    [key: string]: 'must-see' | 'optional' | 'skip-if-time';
  };
}

interface ItineraryState {
  itineraryId: string | null;
  originalData: any | null;
  customizations: Customizations;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;

  // Actions
  setItinerary: (id: string, data: any, customizations?: Customizations) => void;

  // Item actions
  removeItem: (itemType: string, itemId: string) => void;
  addCustomItem: (itemType: string, dayId: string, item: any) => void;
  editItem: (itemId: string, updates: Partial<any>) => void;
  regenerateItem: (itemType: string, itemId: string) => Promise<void>;

  // Reordering
  reorderItems: (dayId: string, itemType: string, itemIds: string[]) => void;

  // Notes & flags
  addNote: (itemId: string, note: string) => void;
  setFlag: (itemId: string, flag: 'must-see' | 'optional' | 'skip-if-time' | null) => void;

  // Persistence
  saveToDatabase: () => Promise<void>;
  resetChanges: () => void;

  // Computed
  getEffectiveItinerary: () => any;
}

export const useItineraryStore = create<ItineraryState>()(
  devtools(
    (set, get) => ({
      itineraryId: null,
      originalData: null,
      customizations: {},
      isDirty: false,
      isSaving: false,
      lastSaved: null,

      setItinerary: (id, data, customizations = {}) => {
        set({
          itineraryId: id,
          originalData: data,
          customizations,
          isDirty: false,
          lastSaved: new Date()
        });
      },

      removeItem: (itemType, itemId) => {
        const { customizations } = get();
        const removed = customizations.removed || {};
        const items = removed[itemType as keyof typeof removed] || [];

        set({
          customizations: {
            ...customizations,
            removed: {
              ...removed,
              [itemType]: [...items, itemId]
            }
          },
          isDirty: true
        });

        // Trigger auto-save
        get().saveToDatabase();
      },

      addCustomItem: (itemType, dayId, item) => {
        const { customizations } = get();
        const added = customizations.added || {};
        const items = added[itemType as keyof typeof added] || [];

        const customItem = {
          ...item,
          dayId,
          customId: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isCustom: true
        };

        set({
          customizations: {
            ...customizations,
            added: {
              ...added,
              [itemType]: [...items, customItem]
            }
          },
          isDirty: true
        });

        get().saveToDatabase();
      },

      editItem: (itemId, updates) => {
        const { customizations } = get();
        const edited = customizations.edited || {};

        set({
          customizations: {
            ...customizations,
            edited: {
              ...edited,
              [itemId]: {
                ...(edited[itemId] || {}),
                ...updates
              }
            }
          },
          isDirty: true
        });

        get().saveToDatabase();
      },

      regenerateItem: async (itemType, itemId) => {
        const { itineraryId } = get();
        if (!itineraryId) return;

        try {
          const response = await fetch(`/api/itinerary/${itineraryId}/regenerate-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemType, itemId })
          });

          if (!response.ok) {
            throw new Error('Failed to regenerate item');
          }

          const result = await response.json();
          console.log('Item regenerated:', result);

          // TODO: Update the itinerary with the new item
        } catch (error) {
          console.error('Regeneration error:', error);
          throw error;
        }
      },

      reorderItems: (dayId, itemType, itemIds) => {
        const { customizations } = get();
        const reordered = customizations.reordered || {};
        const key = `${dayId}-${itemType}`;

        set({
          customizations: {
            ...customizations,
            reordered: {
              ...reordered,
              [key]: itemIds
            }
          },
          isDirty: true
        });

        get().saveToDatabase();
      },

      addNote: (itemId, note) => {
        const { customizations } = get();
        const notes = customizations.notes || {};

        set({
          customizations: {
            ...customizations,
            notes: {
              ...notes,
              [itemId]: note
            }
          },
          isDirty: true
        });

        get().saveToDatabase();
      },

      setFlag: (itemId, flag) => {
        const { customizations } = get();
        const flags = customizations.flags || {};

        if (flag === null) {
          const { [itemId]: removed, ...rest } = flags;
          set({
            customizations: {
              ...customizations,
              flags: rest
            },
            isDirty: true
          });
        } else {
          set({
            customizations: {
              ...customizations,
              flags: {
                ...flags,
                [itemId]: flag
              }
            },
            isDirty: true
          });
        }

        get().saveToDatabase();
      },

      saveToDatabase: async () => {
        const { itineraryId, customizations, isSaving } = get();

        if (!itineraryId || isSaving) return;

        set({ isSaving: true });

        try {
          const response = await fetch(`/api/itinerary/${itineraryId}/customize`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customizations })
          });

          if (!response.ok) {
            throw new Error('Failed to save customizations');
          }

          set({
            isDirty: false,
            lastSaved: new Date(),
            isSaving: false
          });

          console.log('✅ Customizations saved');
        } catch (error) {
          console.error('❌ Save failed:', error);
          set({ isSaving: false });
          throw error;
        }
      },

      resetChanges: () => {
        set({
          customizations: {},
          isDirty: false
        });
      },

      getEffectiveItinerary: () => {
        const { originalData, customizations } = get();
        if (!originalData) return null;

        // Deep clone original data
        const effective = JSON.parse(JSON.stringify(originalData));

        // Apply removals
        if (customizations.removed) {
          Object.entries(customizations.removed).forEach(([itemType, ids]) => {
            if (ids && ids.length > 0) {
              const dataKey = itemType === 'activities' ? 'activities' :
                            itemType === 'restaurants' ? 'restaurants' :
                            itemType === 'accommodations' ? 'accommodations' :
                            itemType === 'scenicStops' ? 'scenic_stops' : null;

              if (dataKey && effective[dataKey]) {
                effective[dataKey] = effective[dataKey].filter((item: any) =>
                  !ids.includes(item.id || item.customId || item.name)
                );
              }
            }
          });
        }

        // Apply additions
        if (customizations.added) {
          Object.entries(customizations.added).forEach(([itemType, items]) => {
            if (items && items.length > 0) {
              const dataKey = itemType === 'activities' ? 'activities' :
                            itemType === 'restaurants' ? 'restaurants' :
                            itemType === 'accommodations' ? 'accommodations' :
                            itemType === 'scenicStops' ? 'scenic_stops' : null;

              if (dataKey) {
                effective[dataKey] = [...(effective[dataKey] || []), ...items];
              }
            }
          });
        }

        // Apply edits
        if (customizations.edited) {
          Object.entries(customizations.edited).forEach(([itemId, updates]) => {
            // Find and update the item across all arrays
            ['activities', 'restaurants', 'accommodations', 'scenic_stops'].forEach(key => {
              if (effective[key]) {
                const index = effective[key].findIndex((item: any) =>
                  (item.id || item.customId || item.name) === itemId
                );
                if (index !== -1) {
                  effective[key][index] = { ...effective[key][index], ...updates };
                }
              }
            });
          });
        }

        // Apply reordering
        if (customizations.reordered) {
          Object.entries(customizations.reordered).forEach(([key, itemIds]) => {
            const [dayId, itemType] = key.split('-');
            const dataKey = itemType === 'activities' ? 'activities' : itemType;

            if (effective[dataKey]) {
              // Reorder based on itemIds array
              const reordered = itemIds
                .map(id => effective[dataKey].find((item: any) =>
                  (item.id || item.customId || item.name) === id
                ))
                .filter(Boolean);

              // Keep items not in the reorder list at the end
              const notReordered = effective[dataKey].filter((item: any) =>
                !itemIds.includes(item.id || item.customId || item.name)
              );

              effective[dataKey] = [...reordered, ...notReordered];
            }
          });
        }

        // Attach notes and flags
        if (customizations.notes || customizations.flags) {
          ['activities', 'restaurants', 'accommodations', 'scenic_stops'].forEach(key => {
            if (effective[key]) {
              effective[key] = effective[key].map((item: any) => {
                const itemId = item.id || item.customId || item.name;
                return {
                  ...item,
                  userNote: customizations.notes?.[itemId],
                  userFlag: customizations.flags?.[itemId]
                };
              });
            }
          });
        }

        return effective;
      }
    }),
    { name: 'ItineraryStore' }
  )
);
