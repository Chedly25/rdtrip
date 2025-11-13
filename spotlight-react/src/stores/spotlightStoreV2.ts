import { create } from 'zustand';
import type { Landmark } from '../services/landmarks';

// Agent theme colors (NO VIOLET!)
export const AGENT_COLORS = {
  'best-overall': { primary: '#064d51', secondary: '#0a7075', accent: '#0fc5d1' },
  adventure: { primary: '#055948', secondary: '#067d64', accent: '#08b894' },
  culture: { primary: '#a87600', secondary: '#c99400', accent: '#f5b800' },
  food: { primary: '#650411', secondary: '#8a0519', accent: '#c70a2a' },
  'hidden-gems': { primary: '#081d5b', secondary: '#0c2877', accent: '#1a4ed8' },
  scenic: { primary: '#055948', secondary: '#067d64', accent: '#08b894' },
  'photo-stops': { primary: '#a87600', secondary: '#c99400', accent: '#f5b800' }
};

export interface CityCoordinates {
  lat: number;
  lng: number;
}

export interface CityObject {
  name: string;
  country: string;
  coordinates: CityCoordinates;
}

export interface LandmarkStop {
  id: string;
  name: string;
  coordinates: CityCoordinates;
  description?: string;
  detourKm?: number;
  detourMinutes?: number;
  insertAfterCityIndex?: number;
}

export interface CityData {
  city: string | CityObject;
  coordinates: CityCoordinates;
  nights: number;
  activities?: any[];
  restaurants?: any[];
  accommodation?: any[];
  practicalInfo?: any;
  weather?: any;
  events?: any[];
  agentData?: Record<string, any>;
}

export interface SpotlightRoute {
  id?: string;
  origin: string | CityObject;
  destination: string | CityObject;
  budget?: string;
  agent: string;
  cities: CityData[];
  landmarks: LandmarkStop[];
  nightAllocations: Record<string, number>;
  totalDistance?: number;
  totalDuration?: number;
  routeGeometry?: any;
  agentResults?: Array<{
    agent: string;
    recommendations: string;
    metrics: Record<string, any>;
  }>;
}

interface SpotlightStoreV2 {
  // Core route data
  route: SpotlightRoute | null;

  // UI state
  selectedCityIndex: number | null;
  isAddingLandmark: boolean;
  isEditingCity: boolean;
  isDragging: boolean;

  // Map state
  mapCenter: [number, number] | null;
  mapZoom: number;
  hoveredMarker: string | null;

  // Loading states
  isCalculatingDetour: boolean;
  isLoadingRoute: boolean;

  // Actions
  setRoute: (route: SpotlightRoute) => void;
  updateCities: (cities: CityData[]) => void;
  addLandmark: (landmark: LandmarkStop) => void;
  addLandmarkToRoute: (landmark: Landmark) => Promise<void>;
  removeLandmark: (landmarkId: string) => void;
  updateLandmark: (landmarkId: string, updates: Partial<LandmarkStop>) => void;
  reorderCities: (oldIndex: number, newIndex: number) => void;
  updateCityNights: (cityName: string, nights: number) => void;

  // UI actions
  setSelectedCity: (index: number | null) => void;
  setIsAddingLandmark: (isAdding: boolean) => void;
  setIsEditingCity: (isEditing: boolean) => void;
  setIsDragging: (isDragging: boolean) => void;
  setMapCenter: (center: [number, number] | null) => void;
  setMapZoom: (zoom: number) => void;
  setHoveredMarker: (markerId: string | null) => void;

  // Loading actions
  setIsCalculatingDetour: (isCalculating: boolean) => void;
  setIsLoadingRoute: (isLoading: boolean) => void;

  // Helper methods
  getCityName: (city: string | CityObject) => string;
  getCityCoordinates: (city: string | CityObject) => CityCoordinates | null;
  getAgentColors: () => { primary: string; secondary: string; accent: string };
}

export const useSpotlightStoreV2 = create<SpotlightStoreV2>((set, get) => ({
  // Initial state
  route: null,
  selectedCityIndex: null,
  isAddingLandmark: false,
  isEditingCity: false,
  isDragging: false,
  mapCenter: null,
  mapZoom: 6,
  hoveredMarker: null,
  isCalculatingDetour: false,
  isLoadingRoute: false,

  // Core actions
  setRoute: (route) => set({ route, isLoadingRoute: false }),

  updateCities: (cities) => set((state) => ({
    route: state.route ? { ...state.route, cities } : null
  })),

  addLandmark: (landmark) => set((state) => ({
    route: state.route
      ? { ...state.route, landmarks: [...state.route.landmarks, landmark] }
      : null
  })),

  addLandmarkToRoute: async (landmark) => {
    const state = get();
    if (!state.route) return;

    set({ isCalculatingDetour: true });

    try {
      // Find optimal insertion point (between which two cities)
      const cities = state.route.cities;
      let bestInsertIndex = 0;
      let minDetour = Infinity;

      // Helper function to calculate Haversine distance
      const calculateDistance = (coord1: CityCoordinates, coord2: CityCoordinates): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
        const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(coord1.lat * Math.PI / 180) *
          Math.cos(coord2.lat * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Calculate detour for each possible insertion point
      for (let i = 0; i < cities.length - 1; i++) {
        const city1 = cities[i].coordinates;
        const city2 = cities[i + 1].coordinates;
        const landmarkCoords = { lat: landmark.lat, lng: landmark.lng };

        // Calculate direct distance between cities
        const directDistance = calculateDistance(city1, city2);

        // Calculate detour: city1 -> landmark -> city2
        const detourDistance =
          calculateDistance(city1, landmarkCoords) +
          calculateDistance(landmarkCoords, city2);

        const detourKm = detourDistance - directDistance;

        if (detourKm < minDetour) {
          minDetour = detourKm;
          bestInsertIndex = i;
        }
      }

      // Create landmark stop with detour info
      const landmarkStop: LandmarkStop = {
        id: `landmark-${Date.now()}`,
        name: landmark.name,
        coordinates: { lat: landmark.lat, lng: landmark.lng },
        description: landmark.description,
        detourKm: minDetour,
        detourMinutes: Math.round(minDetour / 80 * 60), // Assume 80 km/h average
        insertAfterCityIndex: bestInsertIndex
      };

      // Add landmark to route
      set((state) => ({
        route: state.route
          ? { ...state.route, landmarks: [...state.route.landmarks, landmarkStop] }
          : null
      }));

      // TODO: Call backend API to recalculate route with landmark
      // For now, we just add it to the store
      console.log(`✅ Added ${landmark.name} to route (${minDetour.toFixed(1)} km detour)`);

    } catch (error) {
      console.error('Failed to add landmark to route:', error);
      throw error;
    } finally {
      set({ isCalculatingDetour: false });
    }
  },

  removeLandmark: (landmarkId) => set((state) => ({
    route: state.route
      ? {
          ...state.route,
          landmarks: state.route.landmarks.filter(l => l.id !== landmarkId)
        }
      : null
  })),

  updateLandmark: (landmarkId, updates) => set((state) => ({
    route: state.route
      ? {
          ...state.route,
          landmarks: state.route.landmarks.map(l =>
            l.id === landmarkId ? { ...l, ...updates } : l
          )
        }
      : null
  })),

  reorderCities: (oldIndex, newIndex) => set((state) => {
    if (!state.route) return state;

    const cities = [...state.route.cities];
    const [removed] = cities.splice(oldIndex, 1);
    cities.splice(newIndex, 0, removed);

    return {
      route: { ...state.route, cities }
    };
  }),

  updateCityNights: (cityName, nights) => set((state) => {
    if (!state.route) return state;

    const nightAllocations = {
      ...state.route.nightAllocations,
      [cityName]: nights
    };

    const cities = state.route.cities.map(city => {
      const name = get().getCityName(city.city);
      if (name === cityName) {
        return { ...city, nights };
      }
      return city;
    });

    return {
      route: { ...state.route, cities, nightAllocations }
    };
  }),

  // UI actions
  setSelectedCity: (index) => set({ selectedCityIndex: index }),
  setIsAddingLandmark: (isAdding) => set({ isAddingLandmark: isAdding }),
  setIsEditingCity: (isEditing) => set({ isEditingCity: isEditing }),
  setIsDragging: (isDragging) => set({ isDragging: isDragging }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setHoveredMarker: (markerId) => set({ hoveredMarker: markerId }),

  // Loading actions
  setIsCalculatingDetour: (isCalculating) => set({ isCalculatingDetour: isCalculating }),
  setIsLoadingRoute: (isLoading) => set({ isLoadingRoute: isLoading }),

  // Helper methods
  getCityName: (city) => {
    if (typeof city === 'string') return city;
    return city?.name || 'Unknown';
  },

  getCityCoordinates: (city) => {
    if (typeof city === 'string') return null;

    const coords = city?.coordinates;
    if (!coords) return null;

    // If coordinates is an array [lat, lng]
    if (Array.isArray(coords)) {
      return {
        lat: typeof coords[0] === 'number' ? coords[0] : 0,
        lng: typeof coords[1] === 'number' ? coords[1] : 0
      };
    }

    // If coordinates is already an object {lat, lng}
    if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
      return coords;
    }

    return null;
  },

  getAgentColors: () => {
    const state = get();
    const agent = state.route?.agent || 'best-overall';
    return AGENT_COLORS[agent as keyof typeof AGENT_COLORS] || AGENT_COLORS['best-overall'];
  }
}));
