import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Discovery Phase Store
 *
 * Manages state for the discovery phase where users explore suggested cities
 * along their route before committing to a full itinerary.
 *
 * Architecture Decision:
 * - Separate store from spotlightStoreV2 to keep concerns isolated
 * - Discovery is a distinct phase with different data needs
 * - Will pass selected cities to spotlightStoreV2 when proceeding to itinerary
 * - Persists to localStorage for session recovery (WI-1.6)
 * - Tracks inferred preferences from passive observation (WI-1.6)
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Place type categories for display
 */
export type PlaceType =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'museum'
  | 'gallery'
  | 'park'
  | 'landmark'
  | 'shop'
  | 'market'
  | 'viewpoint'
  | 'experience'
  | 'other';

/**
 * Individual place/POI within a city
 * Used for the city preview panel to show top places
 */
export interface DiscoveryPlace {
  id: string;
  name: string;
  type: PlaceType;
  /** Rating out of 5 */
  rating?: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Photo URL from Google Places or similar */
  photoUrl?: string;
  /** Whether this is a hidden gem (high quality, low popularity) */
  isHiddenGem?: boolean;
  /** Brief description or tagline */
  description?: string;
  /** Price level 1-4 */
  priceLevel?: number;
}

export interface DiscoveryCity {
  id: string;
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
  /** Distance from route line in km */
  distanceFromRoute?: number;
  /** Approximate driving time to reach from previous city */
  drivingMinutes?: number;
  /** Number of hidden gems/places available */
  placeCount?: number;
  /** Brief description or tagline */
  description?: string;
  /** Photo URL */
  imageUrl?: string;
  /** Whether this city is selected for the trip */
  isSelected: boolean;
  /** Whether this is origin or destination (always selected, can't remove) */
  isFixed: boolean;
  /** Suggested number of nights */
  suggestedNights?: number;
  /** User-adjusted nights (if different from suggested) */
  nights?: number;
  /** Top places in this city for preview */
  places?: DiscoveryPlace[];
}

export interface DiscoveryRoute {
  origin: DiscoveryCity;
  destination: DiscoveryCity;
  suggestedCities: DiscoveryCity[];
  /** Route polyline coordinates */
  routeGeometry?: GeoJSON.LineString;
  /** Total distance in km */
  totalDistanceKm?: number;
  /** Total driving time in minutes */
  totalDrivingMinutes?: number;
}

export interface TripSummary {
  startDate: Date;
  endDate: Date;
  totalNights: number;
  travellerType: string;
}

export type DiscoveryPhase =
  | 'loading'      // Fetching initial suggestions
  | 'exploring'    // User is exploring cities
  | 'confirming'   // User has made selections, ready to proceed
  | 'generating';  // Generating full itinerary

export interface CompanionMessage {
  id: string;
  type: 'assistant' | 'user' | 'suggestion';
  content: string;
  timestamp: Date;
}

/**
 * Inferred Preferences - Learned from passive observation (WI-1.6)
 *
 * Tracks user behaviour signals to personalize recommendations.
 * Updated when user:
 * - Adds/removes cities
 * - Favourites/unfavourites places
 * - Adjusts nights
 * - Interacts with city previews
 */
export interface InferredPreferences {
  /** Place types user has favourited, weighted by frequency */
  favouritePlaceTypes: Record<PlaceType, number>;
  /** Average nights user allocates per city */
  averageNightsPerCity: number;
  /** Whether user prefers hidden gems (vs popular spots) */
  prefersHiddenGems: boolean;
  /** Cities user has shown interest in (viewed preview, hovered) */
  interestedCityIds: string[];
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * User action for analytics and companion sync
 */
export interface DiscoveryAction {
  type: 'city_added' | 'city_removed' | 'city_selected' | 'city_reordered' |
        'place_favourited' | 'place_unfavourited' | 'nights_adjusted' |
        'city_preview_viewed' | 'proceed_clicked';
  data?: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// Store Interface
// ============================================================================

interface DiscoveryState {
  // Core data
  route: DiscoveryRoute | null;
  tripSummary: TripSummary | null;
  phase: DiscoveryPhase;

  // UI state
  selectedCityId: string | null;
  isCompanionExpanded: boolean;
  companionMessages: CompanionMessage[];

  // Favourited places (stored as array for persistence)
  favouritedPlaceIds: string[];

  // Removed cities - track explicitly removed for undo/re-suggestions (WI-1.6)
  removedCityIds: string[];

  // Inferred preferences from passive observation (WI-1.6)
  inferredPreferences: InferredPreferences;

  // Recent actions for companion sync (WI-1.6)
  recentActions: DiscoveryAction[];

  // Map state
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number;

  // Session metadata
  sessionId: string;
  sessionStartedAt: Date;

  // Actions
  setRoute: (route: DiscoveryRoute) => void;
  setTripSummary: (summary: TripSummary) => void;
  setPhase: (phase: DiscoveryPhase) => void;

  // City selection
  selectCity: (cityId: string | null) => void;
  toggleCitySelection: (cityId: string) => void;
  updateCityNights: (cityId: string, nights: number) => void;

  // Add/remove custom cities
  addCity: (city: Omit<DiscoveryCity, 'id' | 'isFixed'>, insertAfterIndex?: number) => string;
  removeCity: (cityId: string) => void;
  reorderCities: (orderedCityIds: string[]) => void;

  // Companion
  toggleCompanion: () => void;
  setCompanionExpanded: (expanded: boolean) => void;
  addCompanionMessage: (message: Omit<CompanionMessage, 'id' | 'timestamp'>) => void;

  // Map
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  flyToCity: (cityId: string) => void;

  // Selectors / Computed (WI-1.6 enhanced)
  getSelectedCities: () => DiscoveryCity[];
  getTotalSelectedNights: () => number;
  getRemovedCities: () => DiscoveryCity[];
  getPreferenceSignals: () => {
    topPlaceTypes: PlaceType[];
    prefersHiddenGems: boolean;
    averageNights: number;
  };

  // Favourites
  togglePlaceFavourite: (placeId: string, placeType?: PlaceType, isHiddenGem?: boolean) => void;
  isPlaceFavourited: (placeId: string) => boolean;
  getFavouritedPlaces: () => DiscoveryPlace[];

  // Undo remove (WI-1.6)
  undoRemoveCity: (cityId: string) => void;
  clearRemovedCities: () => void;

  // Action recording for companion sync (WI-1.6)
  recordAction: (action: Omit<DiscoveryAction, 'timestamp'>) => void;
  getRecentActions: (since?: Date) => DiscoveryAction[];
  clearRecentActions: () => void;

  // City preview tracking for preference inference (WI-1.6)
  recordCityPreviewView: (cityId: string) => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const createInitialPreferences = (): InferredPreferences => ({
  favouritePlaceTypes: {} as Record<PlaceType, number>,
  averageNightsPerCity: 1,
  prefersHiddenGems: false,
  interestedCityIds: [],
  lastUpdated: new Date(),
});

const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialState = {
  route: null as DiscoveryRoute | null,
  tripSummary: null as TripSummary | null,
  phase: 'loading' as DiscoveryPhase,
  selectedCityId: null as string | null,
  isCompanionExpanded: false,
  companionMessages: [] as CompanionMessage[],
  favouritedPlaceIds: [] as string[],
  removedCityIds: [] as string[],
  inferredPreferences: createInitialPreferences(),
  recentActions: [] as DiscoveryAction[],
  mapCenter: null as { lat: number; lng: number } | null,
  mapZoom: 6,
  sessionId: generateSessionId(),
  sessionStartedAt: new Date(),
};

// ============================================================================
// Store with Persistence (WI-1.6)
// ============================================================================

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Core data actions
      setRoute: (route) => {
        set({
          route,
          mapCenter: route.origin.coordinates,
          phase: 'exploring',
          // Clear old companion messages when setting a new route
          companionMessages: [],
        });
      },

      setTripSummary: (summary) => set({ tripSummary: summary }),

      setPhase: (phase) => set({ phase }),

      // City selection actions
      selectCity: (cityId) => {
        set({ selectedCityId: cityId });
        if (cityId) {
          get().recordAction({ type: 'city_selected', data: { cityId } });
        }
      },

      toggleCitySelection: (cityId) => {
        const { route, removedCityIds } = get();
        if (!route) return;

        // Can't toggle fixed cities (origin/destination)
        const city = [route.origin, route.destination, ...route.suggestedCities]
          .find((c) => c.id === cityId);

        if (!city || city.isFixed) return;

        const isNowSelected = !city.isSelected;

        set({
          route: {
            ...route,
            suggestedCities: route.suggestedCities.map((c) =>
              c.id === cityId ? { ...c, isSelected: isNowSelected } : c
            ),
          },
          // If unselecting, track as removed
          removedCityIds: isNowSelected
            ? removedCityIds.filter((id) => id !== cityId)
            : [...removedCityIds, cityId],
        });

        // Record action for companion sync
        get().recordAction({
          type: isNowSelected ? 'city_added' : 'city_removed',
          data: { cityId, cityName: city.name },
        });
      },

      updateCityNights: (cityId, nights) => {
        const { route } = get();
        if (!route) return;

        const updateNights = (city: DiscoveryCity): DiscoveryCity =>
          city.id === cityId ? { ...city, nights } : city;

        set({
          route: {
            ...route,
            origin: updateNights(route.origin),
            destination: updateNights(route.destination),
            suggestedCities: route.suggestedCities.map(updateNights),
          },
        });

        // Record action and update preference inference
        get().recordAction({ type: 'nights_adjusted', data: { cityId, nights } });

        // Update average nights preference
        const selectedCities = get().getSelectedCities();
        const totalNights = selectedCities.reduce((sum, c) => sum + (c.nights ?? c.suggestedNights ?? 1), 0);
        const avgNights = totalNights / selectedCities.length;

        set((state) => ({
          inferredPreferences: {
            ...state.inferredPreferences,
            averageNightsPerCity: avgNights,
            lastUpdated: new Date(),
          },
        }));
      },

      // Add/remove custom cities
      // insertAfterIndex: if provided, insert after that index (for geographic ordering)
      addCity: (cityData, insertAfterIndex?: number) => {
        const { route } = get();
        if (!route) return '';

        // Generate unique ID for the new city
        const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const newCity: DiscoveryCity = {
          ...cityData,
          id,
          isFixed: false,
          isSelected: true, // Auto-select newly added cities
        };

        // Build new cities array with proper insertion
        let newCities: DiscoveryCity[];
        if (typeof insertAfterIndex === 'number' && insertAfterIndex >= 0 && insertAfterIndex < route.suggestedCities.length) {
          // Insert after the specified index for geographic ordering
          newCities = [
            ...route.suggestedCities.slice(0, insertAfterIndex + 1),
            newCity,
            ...route.suggestedCities.slice(insertAfterIndex + 1),
          ];
          console.log(`📍 [Store] Inserted ${cityData.name} after index ${insertAfterIndex}`);
        } else {
          // Default: append to end
          newCities = [...route.suggestedCities, newCity];
          console.log(`📍 [Store] Appended ${cityData.name} to end`);
        }

        set({
          route: {
            ...route,
            suggestedCities: newCities,
          },
          selectedCityId: id, // Select the newly added city
        });

        // Record action
        get().recordAction({ type: 'city_added', data: { cityId: id, cityName: cityData.name } });

        return id;
      },

      removeCity: (cityId) => {
        const { route, selectedCityId, removedCityIds } = get();
        if (!route) return;

        // Can't remove fixed cities (origin/destination)
        const city = route.suggestedCities.find((c) => c.id === cityId);
        if (!city || city.isFixed) return;

        set({
          route: {
            ...route,
            suggestedCities: route.suggestedCities.filter((c) => c.id !== cityId),
          },
          // Clear selection if removed city was selected
          selectedCityId: selectedCityId === cityId ? null : selectedCityId,
          // Track removed city
          removedCityIds: [...removedCityIds, cityId],
        });

        // Record action
        get().recordAction({ type: 'city_removed', data: { cityId, cityName: city.name } });
      },

      reorderCities: (orderedCityIds) => {
        const { route } = get();
        if (!route) return;

        // Create a map for quick lookup
        const cityMap = new Map(
          route.suggestedCities.map((city) => [city.id, city])
        );

        // Reorder based on the provided order
        const reorderedCities = orderedCityIds
          .filter((id) => cityMap.has(id))
          .map((id) => cityMap.get(id)!);

        // Add any cities that weren't in the ordered list (safety)
        route.suggestedCities.forEach((city) => {
          if (!orderedCityIds.includes(city.id)) {
            reorderedCities.push(city);
          }
        });

        set({
          route: {
            ...route,
            suggestedCities: reorderedCities,
          },
        });

        // Record action
        get().recordAction({ type: 'city_reordered', data: { newOrder: orderedCityIds } });
      },

      // Companion actions
      toggleCompanion: () => set((state) => ({ isCompanionExpanded: !state.isCompanionExpanded })),

      setCompanionExpanded: (expanded) => set({ isCompanionExpanded: expanded }),

      addCompanionMessage: (message) => {
        set((state) => ({
          companionMessages: [
            ...state.companionMessages,
            {
              ...message,
              id: `msg-${Date.now()}`,
              timestamp: new Date(),
            },
          ],
        }));
      },

      // Map actions
      setMapCenter: (center) => set({ mapCenter: center }),

      setMapZoom: (zoom) => set({ mapZoom: zoom }),

      flyToCity: (cityId) => {
        const { route } = get();
        if (!route) return;

        const city = [route.origin, route.destination, ...route.suggestedCities]
          .find((c) => c.id === cityId);

        if (city) {
          set({
            selectedCityId: cityId,
            mapCenter: city.coordinates,
            mapZoom: 10,
          });
        }
      },

      // Selectors / Computed
      getSelectedCities: () => {
        const { route } = get();
        if (!route) return [];

        return [
          route.origin,
          ...route.suggestedCities.filter((c) => c.isSelected),
          route.destination,
        ];
      },

      getTotalSelectedNights: () => {
        const { route } = get();
        if (!route) return 0;

        const selectedCities = [
          route.origin,
          ...route.suggestedCities.filter((c) => c.isSelected),
          route.destination,
        ];

        return selectedCities.reduce((total, city) => {
          return total + (city.nights ?? city.suggestedNights ?? 1);
        }, 0);
      },

      // Get cities that were explicitly removed (for undo or re-suggestions) (WI-1.6)
      getRemovedCities: () => {
        const { route, removedCityIds } = get();
        if (!route) return [];

        return route.suggestedCities.filter((c) => removedCityIds.includes(c.id));
      },

      // Get preference signals for AI/recommendations (WI-1.6)
      getPreferenceSignals: () => {
        const { inferredPreferences, favouritedPlaceIds, route } = get();

        // Get top place types from favourites
        const typeEntries = Object.entries(inferredPreferences.favouritePlaceTypes) as [PlaceType, number][];
        const topPlaceTypes = typeEntries
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([type]) => type);

        // Calculate hidden gem preference from favourited places
        let hiddenGemCount = 0;
        let totalFavourited = 0;

        if (route) {
          const allCities = [route.origin, ...route.suggestedCities, route.destination];
          allCities.forEach((city) => {
            if (city.places) {
              city.places.forEach((place) => {
                if (favouritedPlaceIds.includes(place.id)) {
                  totalFavourited++;
                  if (place.isHiddenGem) hiddenGemCount++;
                }
              });
            }
          });
        }

        return {
          topPlaceTypes,
          prefersHiddenGems: totalFavourited > 0 ? hiddenGemCount / totalFavourited > 0.5 : false,
          averageNights: inferredPreferences.averageNightsPerCity,
        };
      },

      // Favourites (enhanced for preference tracking) (WI-1.6)
      togglePlaceFavourite: (placeId, placeType, isHiddenGem) => {
        const { favouritedPlaceIds, inferredPreferences } = get();
        const isFavourited = favouritedPlaceIds.includes(placeId);

        if (isFavourited) {
          // Unfavourite
          set({
            favouritedPlaceIds: favouritedPlaceIds.filter((id) => id !== placeId),
          });
          get().recordAction({ type: 'place_unfavourited', data: { placeId } });
        } else {
          // Favourite - update preference tracking
          const newFavourites = [...favouritedPlaceIds, placeId];
          const newPreferences = { ...inferredPreferences };

          // Track place type preference
          if (placeType) {
            newPreferences.favouritePlaceTypes = {
              ...newPreferences.favouritePlaceTypes,
              [placeType]: (newPreferences.favouritePlaceTypes[placeType] || 0) + 1,
            };
          }

          // Track hidden gem preference
          if (isHiddenGem !== undefined) {
            // Calculate running preference
            const totalFavourites = newFavourites.length;
            const hiddenGemWeight = isHiddenGem ? 1 : 0;
            const currentWeight = newPreferences.prefersHiddenGems ? 0.7 : 0.3;
            newPreferences.prefersHiddenGems =
              (currentWeight * (totalFavourites - 1) + hiddenGemWeight) / totalFavourites > 0.5;
          }

          newPreferences.lastUpdated = new Date();

          set({
            favouritedPlaceIds: newFavourites,
            inferredPreferences: newPreferences,
          });

          get().recordAction({ type: 'place_favourited', data: { placeId, placeType, isHiddenGem } });
        }
      },

      isPlaceFavourited: (placeId) => {
        return get().favouritedPlaceIds.includes(placeId);
      },

      getFavouritedPlaces: () => {
        const { route, favouritedPlaceIds } = get();
        if (!route) return [];

        const allCities = [route.origin, ...route.suggestedCities, route.destination];
        const favouritedPlaces: DiscoveryPlace[] = [];

        allCities.forEach((city) => {
          if (city.places) {
            city.places.forEach((place) => {
              if (favouritedPlaceIds.includes(place.id)) {
                favouritedPlaces.push(place);
              }
            });
          }
        });

        return favouritedPlaces;
      },

      // Undo remove functionality (WI-1.6)
      undoRemoveCity: (cityId) => {
        const { route, removedCityIds } = get();
        if (!route) return;

        // Find the city and re-select it
        const city = route.suggestedCities.find((c) => c.id === cityId);
        if (!city) return;

        set({
          route: {
            ...route,
            suggestedCities: route.suggestedCities.map((c) =>
              c.id === cityId ? { ...c, isSelected: true } : c
            ),
          },
          removedCityIds: removedCityIds.filter((id) => id !== cityId),
        });

        get().recordAction({ type: 'city_added', data: { cityId, cityName: city.name, isUndo: true } });
      },

      clearRemovedCities: () => {
        set({ removedCityIds: [] });
      },

      // Action recording for companion sync (WI-1.6)
      recordAction: (action) => {
        const newAction: DiscoveryAction = {
          ...action,
          timestamp: new Date(),
        };

        set((state) => ({
          recentActions: [...state.recentActions.slice(-49), newAction], // Keep last 50 actions
        }));
      },

      getRecentActions: (since) => {
        const { recentActions } = get();
        if (!since) return recentActions;
        return recentActions.filter((a) => a.timestamp > since);
      },

      clearRecentActions: () => {
        set({ recentActions: [] });
      },

      // City preview tracking for preference inference (WI-1.6)
      recordCityPreviewView: (cityId) => {
        const { inferredPreferences } = get();

        // Track interest in this city
        const interestedCityIds = inferredPreferences.interestedCityIds.includes(cityId)
          ? inferredPreferences.interestedCityIds
          : [...inferredPreferences.interestedCityIds, cityId];

        set({
          inferredPreferences: {
            ...inferredPreferences,
            interestedCityIds,
            lastUpdated: new Date(),
          },
        });

        get().recordAction({ type: 'city_preview_viewed', data: { cityId } });
      },

      // Reset
      reset: () => set({
        ...initialState,
        sessionId: generateSessionId(),
        sessionStartedAt: new Date(),
      }),
    }),
    {
      name: 'waycraft-discovery-store',
      storage: createJSONStorage(() => localStorage),
      // Custom serialization for Date objects and Sets
      partialize: (state) => ({
        route: state.route,
        tripSummary: state.tripSummary,
        phase: state.phase,
        selectedCityId: state.selectedCityId,
        favouritedPlaceIds: state.favouritedPlaceIds,
        removedCityIds: state.removedCityIds,
        inferredPreferences: state.inferredPreferences,
        companionMessages: state.companionMessages,
        sessionId: state.sessionId,
        sessionStartedAt: state.sessionStartedAt,
        // Don't persist: mapCenter, mapZoom, isCompanionExpanded, recentActions
      }),
      // Handle Date deserialization
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore Date objects
          if (state.tripSummary) {
            state.tripSummary.startDate = new Date(state.tripSummary.startDate);
            state.tripSummary.endDate = new Date(state.tripSummary.endDate);
          }
          if (state.inferredPreferences) {
            state.inferredPreferences.lastUpdated = new Date(state.inferredPreferences.lastUpdated);
          }
          if (state.companionMessages) {
            state.companionMessages = state.companionMessages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }));
          }
          if (state.sessionStartedAt) {
            state.sessionStartedAt = new Date(state.sessionStartedAt);
          }
        }
      },
      // Version for migrations
      version: 1,
    }
  )
);

// ============================================================================
// Selectors (for use outside of store) (WI-1.6)
// ============================================================================

/**
 * Get all cities including origin, destination, and suggested
 */
export const selectAllCities = (state: DiscoveryState): DiscoveryCity[] => {
  if (!state.route) return [];
  return [state.route.origin, ...state.route.suggestedCities, state.route.destination];
};

/**
 * Get only suggested cities (not origin/destination)
 */
export const selectSuggestedCities = (state: DiscoveryState): DiscoveryCity[] => {
  if (!state.route) return [];
  return state.route.suggestedCities;
};

/**
 * Get city by ID
 */
export const selectCityById = (state: DiscoveryState, cityId: string): DiscoveryCity | undefined => {
  if (!state.route) return undefined;
  return [state.route.origin, ...state.route.suggestedCities, state.route.destination]
    .find((c) => c.id === cityId);
};

/**
 * Check if trip has minimum requirements to proceed
 */
export const selectCanProceed = (state: DiscoveryState): boolean => {
  if (!state.route) return false;
  // Need at least origin and destination (both are fixed and always selected)
  return true;
};

/**
 * Get trip completion percentage based on nights allocated
 */
export const selectTripProgress = (state: DiscoveryState): number => {
  if (!state.route || !state.tripSummary) return 0;

  const selectedCities = [
    state.route.origin,
    ...state.route.suggestedCities.filter((c) => c.isSelected),
    state.route.destination,
  ];

  const totalAllocatedNights = selectedCities.reduce(
    (sum, city) => sum + (city.nights ?? city.suggestedNights ?? 0),
    0
  );

  return Math.min(100, Math.round((totalAllocatedNights / state.tripSummary.totalNights) * 100));
};
