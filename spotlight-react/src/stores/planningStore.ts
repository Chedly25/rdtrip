/**
 * Planning Store
 *
 * Zustand store for the proximity-based trip planner.
 * Manages trip plans, clusters, suggestions, and companion state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  PlanningStore,
  PlanningState,
  TripPlan,
  CityPlan,
  Cluster,
  PlanCard,
  PlanCardType,
  CompanionMessage,
  PlanningFilters,
  LatLng,
} from '../types/planning';
import {
  findBestClusterForItem,
  generateClusterId,
  orderItemsOptimally,
} from '../utils/autoClustering';

// ============================================
// Initial State
// ============================================

const initialFilters: PlanningFilters = {
  priceRange: undefined,
  sortBy: 'proximity',
};

const initialState: PlanningState = {
  routeId: null,
  tripPlan: null,
  currentCityId: null,
  cityPlans: {},
  suggestions: {},
  companionMessages: {},
  filters: initialFilters,
  isLoading: false,
  isSaving: false,
  companionLoading: false,
  companionExpanded: false,
  error: null,
  isInitialized: false,
  isGenerating: {},
};

// ============================================
// Helper Functions
// ============================================

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Estimate walking time between two points using Haversine formula
 * Returns walking time in minutes
 */
function estimateWalkingTime(from: LatLng, to: LatLng): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Average walking speed: ~5 km/h = ~12 min per km
  // Add 20% for non-straight paths
  return Math.round(distanceKm * 12 * 1.2);
}

function computeClusterStats(cluster: Cluster): { totalDuration: number; maxWalkingDistance: number } {
  const totalDuration = cluster.items.reduce((sum, item) => sum + (item.duration || 0), 0);

  // Calculate actual max walking distance between any two items
  let maxWalkingDistance = 0;

  if (cluster.items.length >= 2) {
    for (let i = 0; i < cluster.items.length; i++) {
      for (let j = i + 1; j < cluster.items.length; j++) {
        const itemA = cluster.items[i];
        const itemB = cluster.items[j];

        // Only calculate if both items have location data
        if (itemA.location && itemB.location) {
          const walkingTime = estimateWalkingTime(itemA.location, itemB.location);
          maxWalkingDistance = Math.max(maxWalkingDistance, walkingTime);
        }
      }
    }
  }

  return { totalDuration, maxWalkingDistance };
}

// ============================================
// Store Implementation
// ============================================

export const usePlanningStore = create<PlanningStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================
      // Initialization
      // ============================================

      initializePlan: (tripPlan: TripPlan) => {
        // Build cityPlans map from tripPlan.cities
        const cityPlans: Record<string, CityPlan> = {};
        tripPlan.cities.forEach((cityPlan) => {
          cityPlans[cityPlan.cityId] = cityPlan;
        });

        // Set first non-origin city as current, or first city
        const firstEditableCity = tripPlan.cities.find((c) => !c.city.isOrigin);
        const currentCityId = firstEditableCity?.cityId || tripPlan.cities[0]?.cityId || null;

        set({
          tripPlan,
          routeId: tripPlan.routeId,
          currentCityId,
          cityPlans,
          isInitialized: true,
          isLoading: false,
          error: null,
        });
      },

      loadPlan: async (routeId: string, token?: string) => {
        set({ isLoading: true, error: null });

        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const response = await fetch(`/api/planning/${routeId}`, { headers });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to load plan');
          }

          const data = await response.json();
          get().initializePlan(data.tripPlan);
        } catch (error) {
          console.error('[planningStore] loadPlan error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load plan',
          });
        }
      },

      savePlan: async (routeId: string, token?: string) => {
        const { cityPlans } = get();

        set({ isSaving: true, error: null });

        try {
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const cities = Object.values(cityPlans);

          const response = await fetch(`/api/planning/${routeId}/save`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ cities }),
          });

          if (!response.ok) {
            throw new Error('Failed to save plan');
          }

          set({ isSaving: false });
        } catch (error) {
          console.error('[planningStore] savePlan error:', error);
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Failed to save plan',
          });
        }
      },

      reset: () => {
        set(initialState);
      },

      // ============================================
      // City Navigation
      // ============================================

      setCurrentCity: (cityId: string) => {
        set({ currentCityId: cityId });
      },

      // ============================================
      // Cluster Operations
      // ============================================

      createCluster: (cityId: string, name: string, center?: LatLng): string => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return '';

        const clusterId = generateId('cluster');
        const newCluster: Cluster = {
          id: clusterId,
          name,
          center: center || cityPlan.city.coordinates,
          items: [],
          totalDuration: 0,
          maxWalkingDistance: 0,
        };

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              clusters: [...cityPlan.clusters, newCluster],
            },
          },
        });

        return clusterId;
      },

      updateCluster: (cityId: string, clusterId: string, updates: Partial<Cluster>) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              clusters: cityPlan.clusters.map((cluster) => {
                if (cluster.id !== clusterId) return cluster;
                const updated = { ...cluster, ...updates };
                const stats = computeClusterStats(updated);
                return { ...updated, ...stats };
              }),
            },
          },
        });
      },

      deleteCluster: (cityId: string, clusterId: string) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        // Move items from deleted cluster to unclustered
        const clusterToDelete = cityPlan.clusters.find((c) => c.id === clusterId);
        const itemsToMove = clusterToDelete?.items || [];

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              clusters: cityPlan.clusters.filter((c) => c.id !== clusterId),
              unclustered: [...cityPlan.unclustered, ...itemsToMove],
            },
          },
        });
      },

      renameCluster: (cityId: string, clusterId: string, name: string) => {
        get().updateCluster(cityId, clusterId, { name });
      },

      // ============================================
      // Item Operations
      // ============================================

      addItemToCluster: (cityId: string, clusterId: string, card: PlanCard) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              clusters: cityPlan.clusters.map((cluster) => {
                if (cluster.id !== clusterId) return cluster;
                const updated = {
                  ...cluster,
                  items: [...cluster.items, card],
                };
                const stats = computeClusterStats(updated);
                return { ...updated, ...stats };
              }),
            },
          },
        });
      },

      removeItemFromCluster: (cityId: string, clusterId: string, itemId: string) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              clusters: cityPlan.clusters.map((cluster) => {
                if (cluster.id !== clusterId) return cluster;
                const updated = {
                  ...cluster,
                  items: cluster.items.filter((item) => item.id !== itemId),
                };
                const stats = computeClusterStats(updated);
                return { ...updated, ...stats };
              }),
            },
          },
        });
      },

      moveItemToCluster: (cityId: string, fromClusterId: string, toClusterId: string, itemId: string) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        // Find the item
        const fromCluster = cityPlan.clusters.find((c) => c.id === fromClusterId);
        const item = fromCluster?.items.find((i) => i.id === itemId);
        if (!item) return;

        // Remove from source and add to target
        get().removeItemFromCluster(cityId, fromClusterId, itemId);
        get().addItemToCluster(cityId, toClusterId, item);
      },

      reorderItemsInCluster: (cityId: string, clusterId: string, reorderedItems: PlanCard[]) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              clusters: cityPlan.clusters.map((cluster) => {
                if (cluster.id !== clusterId) return cluster;
                return { ...cluster, items: reorderedItems };
              }),
            },
          },
        });
      },

      addToUnclustered: (cityId: string, card: PlanCard) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              unclustered: [...cityPlan.unclustered, card],
            },
          },
        });
      },

      removeFromUnclustered: (cityId: string, itemId: string) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              unclustered: cityPlan.unclustered.filter((item) => item.id !== itemId),
            },
          },
        });
      },

      /**
       * Add item with auto-clustering - system determines the best cluster
       * This is the main entry point for adding items in the new UX
       *
       * Does optimistic local update for immediate feedback, then syncs with backend
       * Backend returns proper cluster naming via reverse geocoding
       */
      addItemAutoClustered: (cityId: string, card: PlanCard, cityCenter?: LatLng) => {
        const { cityPlans, routeId } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        // Find the best cluster for this item (local calculation for immediate update)
        const { clusterId, shouldCreateNew, suggestedName } = findBestClusterForItem(cityPlan, card);

        // Generate temporary IDs for new cluster/item
        const tempClusterId = shouldCreateNew ? generateClusterId() : clusterId;
        const itemWithId = { ...card, id: card.id || generateId('item') };

        if (shouldCreateNew) {
          // Optimistic: Create a new cluster and add the item locally
          const center = card.location || cityCenter || { lat: 0, lng: 0 };

          const newCluster: Cluster = {
            id: tempClusterId!,
            name: suggestedName, // Temporary name until backend responds
            center,
            items: [itemWithId],
            totalDuration: card.duration || 0,
            maxWalkingDistance: 0,
          };

          set({
            cityPlans: {
              ...cityPlans,
              [cityId]: {
                ...cityPlan,
                clusters: [...cityPlan.clusters, newCluster],
              },
            },
          });
        } else if (clusterId) {
          // Optimistic: Add to existing cluster locally with smart ordering
          set({
            cityPlans: {
              ...cityPlans,
              [cityId]: {
                ...cityPlan,
                clusters: cityPlan.clusters.map((cluster) => {
                  if (cluster.id !== clusterId) return cluster;
                  // Add item and apply smart ordering for optimal day flow
                  const newItems = [...cluster.items, itemWithId];
                  const orderedItems = orderItemsOptimally(newItems);
                  const updatedCluster = {
                    ...cluster,
                    items: orderedItems,
                  };
                  const stats = computeClusterStats(updatedCluster);
                  return {
                    ...updatedCluster,
                    totalDuration: stats.totalDuration,
                    maxWalkingDistance: stats.maxWalkingDistance,
                  };
                }),
              },
            },
          });
        }

        // Sync with backend (non-blocking - don't await)
        if (routeId) {
          fetch(`/api/planning/${routeId}/add-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cityId, card: itemWithId }),
          })
            .then(async (response) => {
              if (response.ok) {
                const result = await response.json();
                // Update cluster name from backend (which has reverse geocoding)
                if (result.isNewCluster && result.clusterName && result.clusterName !== suggestedName) {
                  const { cityPlans: currentPlans } = get();
                  const currentCityPlan = currentPlans[cityId];
                  if (currentCityPlan) {
                    set({
                      cityPlans: {
                        ...currentPlans,
                        [cityId]: {
                          ...currentCityPlan,
                          clusters: currentCityPlan.clusters.map((c) => {
                            if (c.id === tempClusterId) {
                              return { ...c, name: result.clusterName };
                            }
                            return c;
                          }),
                        },
                      },
                    });
                  }
                }
              }
            })
            .catch((error) => {
              console.error('[planningStore] Backend sync failed:', error);
              // Item was already added locally, so user experience is preserved
            });
        }
      },

      // ============================================
      // Hotel Operations
      // ============================================

      selectHotel: (cityId: string, hotel: PlanCard) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              selectedHotel: hotel,
            },
          },
        });
      },

      removeHotel: (cityId: string) => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return;

        set({
          cityPlans: {
            ...cityPlans,
            [cityId]: {
              ...cityPlan,
              selectedHotel: null,
            },
          },
        });
      },

      getSelectedHotel: (cityId: string): PlanCard | null => {
        const { cityPlans } = get();
        return cityPlans[cityId]?.selectedHotel || null;
      },

      // ============================================
      // Suggestions
      // ============================================

      setSuggestions: (cityId: string, type: string, cards: PlanCard[]) => {
        const { suggestions } = get();
        set({
          suggestions: {
            ...suggestions,
            [cityId]: {
              ...(suggestions[cityId] || {}),
              [type]: cards,
            },
          },
        });
      },

      addSuggestions: (cityId: string, type: string, cards: PlanCard[]) => {
        const { suggestions } = get();
        const existing = suggestions[cityId]?.[type] || [];
        set({
          suggestions: {
            ...suggestions,
            [cityId]: {
              ...(suggestions[cityId] || {}),
              [type]: [...existing, ...cards],
            },
          },
        });
      },

      generateSuggestions: async (type: PlanCardType | 'all', count: number) => {
        const { currentCityId, routeId, cityPlans, suggestions, filters } = get();
        if (!currentCityId || !routeId) return;

        const cityPlan = cityPlans[currentCityId];
        if (!cityPlan) return;

        // Set loading state for this type
        set((state) => ({
          isGenerating: { ...state.isGenerating, [type]: true },
        }));

        // Collect existing IDs to exclude
        const existingIds = [
          ...cityPlan.clusters.flatMap((c) => c.items.map((i) => i.id)),
          ...cityPlan.unclustered.map((i) => i.id),
          ...(suggestions[currentCityId]?.[type] || []).map((c) => c.id),
        ];

        try {
          const response = await fetch(`/api/planning/${routeId}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cityId: currentCityId,
              type,
              count,
              filters: {
                priceMax: filters.priceRange ? Math.max(...filters.priceRange) : undefined,
              },
              excludeIds: existingIds,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate suggestions');
          }

          const { cards } = await response.json();
          get().addSuggestions(currentCityId, type, cards);
        } catch (error) {
          console.error('[planningStore] generateSuggestions error:', error);
        } finally {
          // Clear loading state
          set((state) => ({
            isGenerating: { ...state.isGenerating, [type]: false },
          }));
        }
      },

      // ============================================
      // Companion
      // ============================================

      addCompanionMessage: (cityId: string, message: CompanionMessage) => {
        const { companionMessages } = get();
        const existing = companionMessages[cityId] || [];
        set({
          companionMessages: {
            ...companionMessages,
            [cityId]: [...existing, message],
          },
        });
      },

      /**
       * Non-streaming fallback for companion messages.
       * Note: SSE streaming is handled by the useCompanionSSE hook in CompanionPanel.
       * This method provides a fallback for non-streaming contexts.
       */
      sendToCompanion: async (message: string) => {
        const { currentCityId, routeId, cityPlans } = get();
        if (!currentCityId || !routeId) return;

        const cityPlan = cityPlans[currentCityId];
        if (!cityPlan) return;

        // Add user message
        const userMessage: CompanionMessage = {
          id: generateId('msg'),
          role: 'user',
          content: message,
          timestamp: new Date(),
        };
        get().addCompanionMessage(currentCityId, userMessage);

        set({ companionLoading: true });

        try {
          const response = await fetch(`/api/planning/${routeId}/companion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cityId: currentCityId,
              message,
              context: {
                cityId: currentCityId,
                currentPlan: cityPlan,
              },
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to send to companion');
          }

          // Handle JSON response
          const data = await response.json();

          const assistantMessage: CompanionMessage = {
            id: generateId('msg'),
            role: 'assistant',
            content: data.message || 'I received your message.',
            cards: data.cards,
            actions: data.actions,
            timestamp: new Date(),
          };
          get().addCompanionMessage(currentCityId, assistantMessage);
        } catch (error) {
          console.error('[planningStore] sendToCompanion error:', error);
          const errorMessage: CompanionMessage = {
            id: generateId('msg'),
            role: 'assistant',
            content: 'Sorry, I had trouble processing that. Please try again.',
            timestamp: new Date(),
          };
          get().addCompanionMessage(currentCityId, errorMessage);
        } finally {
          set({ companionLoading: false });
        }
      },

      toggleCompanion: () => {
        set((state) => ({ companionExpanded: !state.companionExpanded }));
      },

      setCompanionExpanded: (expanded: boolean) => {
        set({ companionExpanded: expanded });
      },

      // ============================================
      // Filters
      // ============================================

      setFilters: (filters: Partial<PlanningFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      // ============================================
      // Error Handling
      // ============================================

      setError: (error: string | null) => {
        set({ error });
      },

      // ============================================
      // Selectors
      // ============================================

      getCurrentCityPlan: (): CityPlan | null => {
        const { currentCityId, cityPlans } = get();
        if (!currentCityId) return null;
        return cityPlans[currentCityId] || null;
      },

      getClusterById: (cityId: string, clusterId: string): Cluster | null => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return null;
        return cityPlan.clusters.find((c) => c.id === clusterId) || null;
      },

      getTotalItemCount: (cityId: string): number => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return 0;
        const clusterItems = cityPlan.clusters.reduce((sum, c) => sum + c.items.length, 0);
        return clusterItems + cityPlan.unclustered.length;
      },

      getAllItemIds: (cityId: string): string[] => {
        const { cityPlans } = get();
        const cityPlan = cityPlans[cityId];
        if (!cityPlan) return [];
        const clusterItemIds = cityPlan.clusters.flatMap((c) => c.items.map((i) => i.id));
        const unclusteredIds = cityPlan.unclustered.map((i) => i.id);
        return [...clusterItemIds, ...unclusteredIds];
      },
    }),
    {
      name: 'rdtrip-planning',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential data
        routeId: state.routeId,
        currentCityId: state.currentCityId,
        cityPlans: state.cityPlans,
        filters: state.filters,
      }),
      // Handle Date deserialization
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Mark as initialized if we have data
          if (state.routeId && Object.keys(state.cityPlans).length > 0) {
            state.isInitialized = true;
          }
        }
      },
    }
  )
);

// ============================================
// Selectors (for use outside store)
// ============================================

// Stable empty arrays to prevent infinite re-render loops
// In JavaScript, [] !== [], so returning a new empty array each time
// causes Zustand to think the state changed, triggering re-renders.
const EMPTY_ARRAY: never[] = [];
const EMPTY_CITIES_ARRAY: { id: string; name: string; nights: number; isOrigin?: boolean; isDestination?: boolean; itemCount: number; isComplete: boolean }[] = [];

export const selectCurrentCityPlan = (state: PlanningStore) => {
  if (!state.currentCityId) return null;
  return state.cityPlans[state.currentCityId] || null;
};

export const selectCitiesForTabs = (state: PlanningStore) => {
  if (!state.tripPlan) return EMPTY_CITIES_ARRAY;
  return state.tripPlan.cities.map((cityPlan) => ({
    id: cityPlan.cityId,
    name: cityPlan.city.name,
    nights: cityPlan.city.nights || 1,
    isOrigin: cityPlan.city.isOrigin,
    isDestination: cityPlan.city.isDestination,
    itemCount: state.getTotalItemCount(cityPlan.cityId),
    isComplete: false,
  }));
};

export const selectSuggestionsForType = (state: PlanningStore, type: string) => {
  if (!state.currentCityId) return EMPTY_ARRAY;
  return state.suggestions[state.currentCityId]?.[type] || EMPTY_ARRAY;
};

export const selectCompanionMessages = (state: PlanningStore) => {
  if (!state.currentCityId) return EMPTY_ARRAY;
  return state.companionMessages[state.currentCityId] || EMPTY_ARRAY;
};

export const selectIsGenerating = (state: PlanningStore, type: string) => {
  return state.isGenerating[type] || false;
};
