/**
 * Preferences Store
 *
 * WI-4.2: Zustand store for user preferences with localStorage persistence
 *
 * Architecture Decisions:
 * - Store-first approach: local Zustand store is source of truth for UI reactivity
 * - Async sync: changes sync to remote with debounce to avoid too many requests
 * - Merge on load: fetch remote and merge with local (stated wins over observed/historical)
 * - Offline-first: app works without remote, syncs when connected
 * - Per-trip isolation: trip preferences stored separately from global preferences
 *
 * Storage Strategy:
 * - Global preferences: stored at user level (userId)
 * - Trip preferences: stored at trip level (tripId) and merged with global on access
 * - Local: localStorage via Zustand persist middleware
 * - Remote: Supabase via API endpoints (synced with debounce)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type UserPreferences,
  type PreferenceSource,
  type InterestCategories,
  type TripPace,
  type BudgetLevel,
  type DiningStyle,
  type AccommodationStyle,
  type TimePreference,
  type CrowdPreference,
  type SpecificInterest,
  type Avoidance,
  type DietaryRequirement,
  type AccessibilityNeed,
  createEmptyPreferences,
  updateInterestCategory,
  adjustInterest,
  addSpecificInterest,
  removeSpecificInterest,
  addAvoidance,
  removeAvoidance,
  addDietaryRequirement,
  addAccessibilityNeed,
  updatePace,
  updateBudget,
  updateDiningStyle,
  updateAccommodationStyle,
  updatePrefersHiddenGems,
  mergePreferences,
  updateOverallConfidence,
  serializePreferences,
  deserializePreferences,
} from '../services/preferences';

// ============================================================================
// Types
// ============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface PreferenceSyncState {
  /** Current sync status */
  status: SyncStatus;
  /** Last successful sync timestamp */
  lastSyncedAt: Date | null;
  /** Last error message if any */
  lastError: string | null;
  /** Whether there are unsaved local changes */
  hasUnsavedChanges: boolean;
}

export interface PreferencesState {
  // ==================== Core Data ====================
  /** Global user preferences (tripId = null) */
  globalPreferences: UserPreferences | null;

  /** Trip-specific preferences map */
  tripPreferences: Record<string, UserPreferences>;

  /** Currently active trip ID (for convenience) */
  activeTripId: string | null;

  // ==================== Sync State ====================
  syncState: PreferenceSyncState;

  // ==================== User Context ====================
  userId: string | null;

  // ==================== Actions ====================

  // Initialization
  initialize: (userId: string | null, tripId?: string | null) => void;
  setActiveTripId: (tripId: string | null) => void;

  // Get effective preferences (merges global + trip)
  getEffectivePreferences: (tripId?: string | null) => UserPreferences;

  // Interest updates
  updateInterest: (
    category: keyof InterestCategories,
    strength: number,
    source?: PreferenceSource,
    tripId?: string | null
  ) => void;
  adjustInterestBy: (
    category: keyof InterestCategories,
    delta: number,
    source?: PreferenceSource,
    tripId?: string | null
  ) => void;

  // Specific interests
  addInterest: (
    tag: string,
    source?: PreferenceSource,
    confidence?: number,
    category?: keyof InterestCategories,
    tripId?: string | null
  ) => void;
  removeInterest: (tag: string, tripId?: string | null) => void;

  // Avoidances
  addAvoidanceTag: (
    tag: string,
    strength?: number,
    source?: PreferenceSource,
    reason?: string,
    tripId?: string | null
  ) => void;
  removeAvoidanceTag: (tag: string, tripId?: string | null) => void;

  // Dietary
  addDietary: (
    tag: string,
    isStrict?: boolean,
    source?: PreferenceSource,
    tripId?: string | null
  ) => void;

  // Accessibility
  addAccessibility: (
    tag: string,
    details?: string,
    source?: PreferenceSource,
    tripId?: string | null
  ) => void;

  // Style preferences
  setPace: (pace: TripPace, source?: PreferenceSource, tripId?: string | null) => void;
  setBudget: (budget: BudgetLevel, source?: PreferenceSource, tripId?: string | null) => void;
  setDiningStyle: (style: DiningStyle, source?: PreferenceSource, tripId?: string | null) => void;
  setAccommodationStyle: (
    style: AccommodationStyle,
    source?: PreferenceSource,
    tripId?: string | null
  ) => void;
  setTimePreference: (
    pref: TimePreference,
    source?: PreferenceSource,
    tripId?: string | null
  ) => void;
  setCrowdPreference: (
    pref: CrowdPreference,
    source?: PreferenceSource,
    tripId?: string | null
  ) => void;
  setHiddenGemsPreference: (
    prefers: boolean,
    source?: PreferenceSource,
    tripId?: string | null
  ) => void;

  // Bulk operations
  mergeIntoPreferences: (
    incoming: Partial<UserPreferences>,
    tripId?: string | null
  ) => void;

  // Clear operations
  clearTripPreferences: (tripId: string) => void;
  clearAllPreferences: () => void;

  // Sync operations
  setSyncStatus: (status: SyncStatus, error?: string) => void;
  markSynced: () => void;
  markUnsaved: () => void;

  // Import/Export (for storage service)
  exportPreferences: (tripId?: string | null) => string;
  importPreferences: (json: string, tripId?: string | null) => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const createInitialSyncState = (): PreferenceSyncState => ({
  status: 'idle',
  lastSyncedAt: null,
  lastError: null,
  hasUnsavedChanges: false,
});

const initialState = {
  globalPreferences: null as UserPreferences | null,
  tripPreferences: {} as Record<string, UserPreferences>,
  activeTripId: null as string | null,
  syncState: createInitialSyncState(),
  userId: null as string | null,
};

// ============================================================================
// Helper: Get or create preferences for scope
// ============================================================================

function getOrCreatePreferences(
  state: Pick<PreferencesState, 'globalPreferences' | 'tripPreferences' | 'userId'>,
  tripId: string | null | undefined
): UserPreferences {
  if (tripId) {
    // Trip-specific
    if (!state.tripPreferences[tripId]) {
      return createEmptyPreferences(state.userId, tripId);
    }
    return state.tripPreferences[tripId];
  } else {
    // Global
    if (!state.globalPreferences) {
      return createEmptyPreferences(state.userId, null);
    }
    return state.globalPreferences;
  }
}

// ============================================================================
// Store
// ============================================================================

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ==================== Initialization ====================

      initialize: (userId, tripId = null) => {
        const { globalPreferences } = get();

        set({
          userId,
          activeTripId: tripId,
          // Create global preferences if not exists
          globalPreferences: globalPreferences || createEmptyPreferences(userId, null),
        });
      },

      setActiveTripId: (tripId) => {
        set({ activeTripId: tripId });
      },

      // ==================== Get Effective Preferences ====================

      getEffectivePreferences: (tripId) => {
        const { globalPreferences, tripPreferences, activeTripId, userId } = get();
        const effectiveTripId = tripId ?? activeTripId;

        // Start with global preferences
        const global = globalPreferences || createEmptyPreferences(userId, null);

        // If no trip, return global
        if (!effectiveTripId) {
          return global;
        }

        // Merge trip-specific on top of global
        const tripSpecific = tripPreferences[effectiveTripId];
        if (!tripSpecific) {
          return global;
        }

        // Merge: trip preferences override global
        return mergePreferences(global, tripSpecific);
      },

      // ==================== Interest Updates ====================

      updateInterest: (category, strength, source = 'observed', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = updateInterestCategory(prefs, category, strength, source);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      adjustInterestBy: (category, delta, source = 'observed', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = adjustInterest(prefs, category, delta, source);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      // ==================== Specific Interests ====================

      addInterest: (tag, source = 'observed', confidence = 0.7, category, tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = addSpecificInterest(prefs, tag, source, confidence, category);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      removeInterest: (tag, tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = removeSpecificInterest(prefs, tag);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: updated,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: updated,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      // ==================== Avoidances ====================

      addAvoidanceTag: (tag, strength = 0.8, source = 'stated', reason, tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = addAvoidance(prefs, tag, source, strength, reason);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      removeAvoidanceTag: (tag, tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = removeAvoidance(prefs, tag);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: updated,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: updated,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      // ==================== Dietary ====================

      addDietary: (tag, isStrict = false, source = 'stated', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = addDietaryRequirement(prefs, tag, isStrict, source);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      // ==================== Accessibility ====================

      addAccessibility: (tag, details, source = 'stated', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = addAccessibilityNeed(prefs, tag, source, details);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      // ==================== Style Preferences ====================

      setPace: (pace, source = 'stated', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = updatePace(prefs, pace, source);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      setBudget: (budget, source = 'stated', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = updateBudget(prefs, budget, source);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      setDiningStyle: (style, source = 'stated', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = updateDiningStyle(prefs, style, source);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      setAccommodationStyle: (style, source = 'stated', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = updateAccommodationStyle(prefs, style, source);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      setTimePreference: (pref, source = 'stated', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        // Update time preference using createPreferenceValue pattern
        const updated: UserPreferences = {
          ...prefs,
          timePreference: {
            value: pref,
            confidence: source === 'stated' ? 0.9 : source === 'historical' ? 0.7 : 0.5,
            sources: {
              stated: source === 'stated',
              observed: source === 'observed',
              historical: source === 'historical',
              lastUpdated: {
                [source]: new Date(),
              },
            },
            updatedAt: new Date(),
          },
          updatedAt: new Date(),
        };
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      setCrowdPreference: (pref, source = 'stated', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        // Update crowd preference using createPreferenceValue pattern
        const updated: UserPreferences = {
          ...prefs,
          crowdPreference: {
            value: pref,
            confidence: source === 'stated' ? 0.9 : source === 'historical' ? 0.7 : 0.5,
            sources: {
              stated: source === 'stated',
              observed: source === 'observed',
              historical: source === 'historical',
              lastUpdated: {
                [source]: new Date(),
              },
            },
            updatedAt: new Date(),
          },
          updatedAt: new Date(),
        };
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      setHiddenGemsPreference: (prefers, source = 'observed', tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        const updated = updatePrefersHiddenGems(prefs, prefers, source);
        const withConfidence = updateOverallConfidence(updated);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      // ==================== Bulk Operations ====================

      mergeIntoPreferences: (incoming, tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const prefs = getOrCreatePreferences(get(), effectiveTripId);

        // Merge incoming into existing
        const merged = mergePreferences(prefs, incoming as UserPreferences);
        const withConfidence = updateOverallConfidence(merged);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: withConfidence,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: withConfidence,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      // ==================== Clear Operations ====================

      clearTripPreferences: (tripId) => {
        const { tripPreferences } = get();
        const { [tripId]: _, ...rest } = tripPreferences;
        set({
          tripPreferences: rest,
          syncState: { ...get().syncState, hasUnsavedChanges: true },
        });
      },

      clearAllPreferences: () => {
        set({
          globalPreferences: null,
          tripPreferences: {},
          syncState: { ...get().syncState, hasUnsavedChanges: true },
        });
      },

      // ==================== Sync Operations ====================

      setSyncStatus: (status, error) => {
        set({
          syncState: {
            ...get().syncState,
            status,
            lastError: error || null,
          },
        });
      },

      markSynced: () => {
        set({
          syncState: {
            ...get().syncState,
            status: 'synced',
            lastSyncedAt: new Date(),
            hasUnsavedChanges: false,
            lastError: null,
          },
        });
      },

      markUnsaved: () => {
        set({
          syncState: {
            ...get().syncState,
            hasUnsavedChanges: true,
          },
        });
      },

      // ==================== Import/Export ====================

      exportPreferences: (tripId) => {
        const prefs = get().getEffectivePreferences(tripId);
        return serializePreferences(prefs);
      },

      importPreferences: (json, tripId) => {
        const { tripPreferences, activeTripId } = get();
        const effectiveTripId = tripId ?? activeTripId;
        const imported = deserializePreferences(json);

        if (effectiveTripId) {
          set({
            tripPreferences: {
              ...tripPreferences,
              [effectiveTripId]: imported,
            },
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        } else {
          set({
            globalPreferences: imported,
            syncState: { ...get().syncState, hasUnsavedChanges: true },
          });
        }
      },

      // ==================== Reset ====================

      reset: () => {
        set({
          ...initialState,
          syncState: createInitialSyncState(),
        });
      },
    }),
    {
      name: 'waycraft-preferences-store',
      storage: createJSONStorage(() => localStorage),

      // Only persist these fields
      partialize: (state) => ({
        globalPreferences: state.globalPreferences,
        tripPreferences: state.tripPreferences,
        userId: state.userId,
        syncState: {
          lastSyncedAt: state.syncState.lastSyncedAt,
          hasUnsavedChanges: state.syncState.hasUnsavedChanges,
        },
      }),

      // Handle Date deserialization
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore Date objects in globalPreferences
          if (state.globalPreferences) {
            rehydrateDates(state.globalPreferences);
          }

          // Restore Date objects in tripPreferences
          Object.values(state.tripPreferences).forEach((prefs) => {
            rehydrateDates(prefs);
          });

          // Restore sync state dates
          if (state.syncState?.lastSyncedAt) {
            state.syncState.lastSyncedAt = new Date(state.syncState.lastSyncedAt);
          }
        }
      },

      // Version for migrations
      version: 1,
    }
  )
);

// ============================================================================
// Helper: Rehydrate Dates
// ============================================================================

function rehydrateDates(prefs: UserPreferences): void {
  // Root dates
  prefs.createdAt = new Date(prefs.createdAt);
  prefs.updatedAt = new Date(prefs.updatedAt);

  // Preference values
  const preferenceFields = [
    'interests',
    'prefersHiddenGems',
    'pace',
    'timePreference',
    'crowdPreference',
    'budget',
    'diningStyle',
    'accommodationStyle',
  ] as const;

  for (const field of preferenceFields) {
    const pv = prefs[field];
    if (pv && typeof pv === 'object' && 'updatedAt' in pv) {
      pv.updatedAt = new Date(pv.updatedAt);
      if (pv.sources?.lastUpdated) {
        if (pv.sources.lastUpdated.stated) {
          pv.sources.lastUpdated.stated = new Date(pv.sources.lastUpdated.stated);
        }
        if (pv.sources.lastUpdated.observed) {
          pv.sources.lastUpdated.observed = new Date(pv.sources.lastUpdated.observed);
        }
        if (pv.sources.lastUpdated.historical) {
          pv.sources.lastUpdated.historical = new Date(pv.sources.lastUpdated.historical);
        }
      }
    }
  }

  // Arrays with dates
  prefs.specificInterests.forEach((si: SpecificInterest) => {
    si.addedAt = new Date(si.addedAt);
  });

  prefs.avoidances.forEach((a: Avoidance) => {
    a.addedAt = new Date(a.addedAt);
  });

  prefs.dietaryRequirements.forEach((d: DietaryRequirement) => {
    d.addedAt = new Date(d.addedAt);
  });

  prefs.accessibilityNeeds.forEach((a: AccessibilityNeed) => {
    a.addedAt = new Date(a.addedAt);
  });
}

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get the effective preferences for rendering
 */
export const selectEffectivePreferences = (state: PreferencesState): UserPreferences => {
  return state.getEffectivePreferences();
};

/**
 * Check if user has any stated preferences
 */
export const selectHasStatedPreferences = (state: PreferencesState): boolean => {
  const prefs = state.getEffectivePreferences();
  return prefs.sources.hasStated;
};

/**
 * Get overall preference confidence
 */
export const selectOverallConfidence = (state: PreferencesState): number => {
  const prefs = state.getEffectivePreferences();
  return prefs.overallConfidence;
};

/**
 * Check if preferences need sync
 */
export const selectNeedsSync = (state: PreferencesState): boolean => {
  return state.syncState.hasUnsavedChanges;
};

/**
 * Get top interest categories (above neutral)
 */
export const selectTopInterests = (
  state: PreferencesState,
  limit = 3
): Array<{ category: keyof InterestCategories; strength: number }> => {
  const prefs = state.getEffectivePreferences();
  const interests = prefs.interests.value;

  return (Object.entries(interests) as Array<[keyof InterestCategories, number]>)
    .filter(([_, strength]) => strength > 0.5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, strength]) => ({
      category,
      strength,
    }));
};
