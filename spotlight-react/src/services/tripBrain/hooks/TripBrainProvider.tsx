/**
 * TripBrainProvider - React Context for Trip Brain
 *
 * WI-6.9: Context Provider for Trip Brain integration
 *
 * This provider wraps the Trip Brain service in React Context,
 * enabling components to access trip intelligence features:
 * - Activity recommendations
 * - Real-time scoring and ranking
 * - "Why Now" reasoning
 * - Location-aware suggestions
 * - Completion/skip tracking
 *
 * Features:
 * - Automatic state synchronization from TripBrain events
 * - Optional geolocation integration
 * - Lazy initialization (only loads when itinerary provided)
 * - Clean cleanup on unmount
 *
 * Usage:
 * ```tsx
 * // In app root
 * <TripBrainProvider itinerary={itinerary} preferences={prefs} enableLocation>
 *   <App />
 * </TripBrainProvider>
 *
 * // In components
 * const { recommendations, recordChoice } = useTripBrain();
 * ```
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';

import {
  TripBrain,
  createTripBrain,
  type TripBrainEvent,
} from '../tripBrain';

import {
  type TripBrainState,
  type TripBrainConfig,
  type EnrichedActivity,
  type LocationContext,
  type WeatherContext,
  type GetRecommendationsOptions,
  type CravingSearchOptions,
  type CravingSearchResult,
  type SerendipityResult,
  type SkipReason,
  type CrossTripMemory,
} from '../types';

import {
  useGeolocation,
  type UseGeolocationOptions,
} from './useGeolocation';

import type { Itinerary } from '../../itinerary';
import type { UserPreferences } from '../../preferences';

// ============================================================================
// Context Types
// ============================================================================

/**
 * Actions available on the Trip Brain context
 */
export interface TripBrainActions {
  // Data Loading
  /** Load new trip data */
  loadTrip: (
    itinerary: Itinerary,
    preferences?: UserPreferences,
    memory?: CrossTripMemory
  ) => Promise<void>;

  /** Update user preferences */
  updatePreferences: (preferences: UserPreferences) => void;

  /** Update weather context */
  updateWeather: (weather: WeatherContext) => void;

  // Recommendations
  /** Get current recommendations */
  getRecommendations: (options?: GetRecommendationsOptions) => EnrichedActivity[];

  /** Search for activities matching a craving */
  searchCraving: (options: CravingSearchOptions) => CravingSearchResult;

  /** Get a serendipitous recommendation */
  getSerendipity: () => SerendipityResult | null;

  /** Get activities for a specific day */
  getActivitiesForDay: (dayNumber: number) => EnrichedActivity[];

  // Activity Tracking
  /** Record that user chose an activity */
  recordChoice: (activityId: string) => void;

  /** Record that user completed an activity */
  recordCompletion: (activityId: string) => void;

  /** Record that user skipped an activity */
  recordSkip: (
    activityId: string,
    reason?: string,
    category?: SkipReason['category']
  ) => void;

  /** Undo a skip */
  undoSkip: (activityId: string) => void;

  /** Undo a completion */
  undoCompletion: (activityId: string) => void;

  // Location
  /** Manually update location */
  updateLocation: (location: LocationContext) => void;

  /** Start location tracking */
  startLocationTracking: () => void;

  /** Stop location tracking */
  stopLocationTracking: () => void;

  /** Refresh location */
  refreshLocation: () => void;

  // Utilities
  /** Reset all progress */
  resetProgress: () => void;

  /** Get completion statistics */
  getStats: () => {
    total: number;
    completed: number;
    skipped: number;
    remaining: number;
    percentComplete: number;
  };
}

/**
 * Derived state computed from TripBrain
 */
export interface TripBrainDerivedState {
  /** Is trip brain ready with data */
  isReady: boolean;

  /** Top recommendations for current context */
  recommendations: EnrichedActivity[];

  /** Current location (if available) */
  location: LocationContext | null;

  /** Is location being tracked */
  isTrackingLocation: boolean;

  /** Location error (if any) */
  locationError: string | null;

  /** Completion statistics */
  stats: {
    total: number;
    completed: number;
    skipped: number;
    remaining: number;
    percentComplete: number;
  };
}

/**
 * Complete Trip Brain context value
 */
export interface TripBrainContextValue extends TripBrainDerivedState, TripBrainActions {
  /** Raw TripBrain state */
  state: TripBrainState | null;

  /** Direct access to TripBrain instance (advanced usage) */
  tripBrain: TripBrain | null;
}

// ============================================================================
// Context
// ============================================================================

const TripBrainContext = createContext<TripBrainContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

export interface TripBrainProviderProps {
  children: React.ReactNode;

  /** Initial itinerary to load */
  itinerary?: Itinerary;

  /** User preferences */
  preferences?: UserPreferences;

  /** Cross-trip memory */
  memory?: CrossTripMemory;

  /** Enable automatic location tracking */
  enableLocation?: boolean;

  /** Geolocation options */
  geolocationOptions?: UseGeolocationOptions;

  /** TripBrain configuration */
  config?: Partial<TripBrainConfig>;

  /** Number of recommendations to fetch by default */
  recommendationCount?: number;

  /** Called when TripBrain emits an event */
  onEvent?: (event: TripBrainEvent) => void;
}

// ============================================================================
// Provider Component
// ============================================================================

export function TripBrainProvider({
  children,
  itinerary,
  preferences,
  memory,
  enableLocation = false,
  geolocationOptions,
  config,
  recommendationCount = 3,
  onEvent,
}: TripBrainProviderProps) {
  // ==================== TripBrain Instance ====================

  // Create stable TripBrain instance
  const tripBrainRef = useRef<TripBrain | null>(null);

  if (!tripBrainRef.current) {
    tripBrainRef.current = createTripBrain(config);
  }

  const tripBrain = tripBrainRef.current;

  // ==================== State ====================

  const [state, setState] = useState<TripBrainState | null>(null);
  const [recommendations, setRecommendations] = useState<EnrichedActivity[]>([]);
  const [isLocationTracking, setIsLocationTracking] = useState(false);

  // ==================== Geolocation Integration ====================

  const handleLocationUpdate = useCallback((location: LocationContext) => {
    tripBrain.updateLocation(location);
  }, [tripBrain]);

  const geolocation = useGeolocation({
    ...geolocationOptions,
    autoStart: false, // We control this
    onLocationUpdate: handleLocationUpdate,
  });

  // ==================== Subscribe to TripBrain Events ====================

  useEffect(() => {
    const unsubscribe = tripBrain.subscribe((event) => {
      // Update state on state changes
      if (event.type === 'state_changed') {
        setState(event.state);
      }

      // Update recommendations when they change
      if (event.type === 'recommendations_updated') {
        setRecommendations(event.recommendations);
      }

      // Forward events to callback
      onEvent?.(event);
    });

    // Get initial state
    setState(tripBrain.getState());

    return unsubscribe;
  }, [tripBrain, onEvent]);

  // ==================== Load Initial Data ====================

  useEffect(() => {
    if (itinerary) {
      tripBrain.loadTripData(itinerary, preferences, memory).then(() => {
        // Fetch initial recommendations
        const recs = tripBrain.getRecommendations({ count: recommendationCount });
        setRecommendations(recs);
      });
    }
  }, [tripBrain, itinerary, preferences, memory, recommendationCount]);

  // ==================== Location Tracking ====================

  useEffect(() => {
    if (enableLocation && geolocation.permissionStatus === 'granted') {
      geolocation.startWatching();
      setIsLocationTracking(true);
    }

    return () => {
      if (isLocationTracking) {
        geolocation.stopWatching();
      }
    };
  }, [enableLocation, geolocation.permissionStatus]);

  // Sync geolocation loading state
  useEffect(() => {
    if (geolocation.location) {
      // Location updated via callback, but we might want to track state
      setIsLocationTracking(!geolocation.isLoading && geolocation.permissionStatus === 'granted');
    }
  }, [geolocation.location, geolocation.isLoading, geolocation.permissionStatus]);

  // ==================== Actions ====================

  const loadTrip = useCallback(
    async (
      newItinerary: Itinerary,
      newPreferences?: UserPreferences,
      newMemory?: CrossTripMemory
    ) => {
      await tripBrain.loadTripData(newItinerary, newPreferences, newMemory);
      const recs = tripBrain.getRecommendations({ count: recommendationCount });
      setRecommendations(recs);
    },
    [tripBrain, recommendationCount]
  );

  const updatePreferences = useCallback(
    (newPreferences: UserPreferences) => {
      tripBrain.updatePreferences(newPreferences);
      // Refresh recommendations
      const recs = tripBrain.getRecommendations({ count: recommendationCount });
      setRecommendations(recs);
    },
    [tripBrain, recommendationCount]
  );

  const updateWeather = useCallback(
    (weather: WeatherContext) => {
      tripBrain.updateWeather(weather);
      // Refresh recommendations
      const recs = tripBrain.getRecommendations({ count: recommendationCount });
      setRecommendations(recs);
    },
    [tripBrain, recommendationCount]
  );

  const getRecommendations = useCallback(
    (options?: GetRecommendationsOptions) => {
      return tripBrain.getRecommendations(options);
    },
    [tripBrain]
  );

  const searchCraving = useCallback(
    (options: CravingSearchOptions) => {
      return tripBrain.searchCraving(options);
    },
    [tripBrain]
  );

  const getSerendipity = useCallback(() => {
    return tripBrain.getSerendipity();
  }, [tripBrain]);

  const getActivitiesForDay = useCallback(
    (dayNumber: number) => {
      return tripBrain.getActivitiesForDay(dayNumber);
    },
    [tripBrain]
  );

  const recordChoice = useCallback(
    (activityId: string) => {
      tripBrain.recordChoice(activityId);
    },
    [tripBrain]
  );

  const recordCompletion = useCallback(
    (activityId: string) => {
      tripBrain.recordCompletion(activityId);
      // Refresh recommendations
      const recs = tripBrain.getRecommendations({ count: recommendationCount });
      setRecommendations(recs);
    },
    [tripBrain, recommendationCount]
  );

  const recordSkip = useCallback(
    (activityId: string, reason?: string, category?: SkipReason['category']) => {
      tripBrain.recordSkip(activityId, reason, category);
      // Refresh recommendations
      const recs = tripBrain.getRecommendations({ count: recommendationCount });
      setRecommendations(recs);
    },
    [tripBrain, recommendationCount]
  );

  const undoSkip = useCallback(
    (activityId: string) => {
      tripBrain.undoSkip(activityId);
      // Refresh recommendations
      const recs = tripBrain.getRecommendations({ count: recommendationCount });
      setRecommendations(recs);
    },
    [tripBrain, recommendationCount]
  );

  const undoCompletion = useCallback(
    (activityId: string) => {
      tripBrain.undoCompletion(activityId);
      // Refresh recommendations
      const recs = tripBrain.getRecommendations({ count: recommendationCount });
      setRecommendations(recs);
    },
    [tripBrain, recommendationCount]
  );

  const updateLocation = useCallback(
    (location: LocationContext) => {
      tripBrain.updateLocation(location);
      // Refresh recommendations with new distances
      const recs = tripBrain.getRecommendations({ count: recommendationCount });
      setRecommendations(recs);
    },
    [tripBrain, recommendationCount]
  );

  const startLocationTracking = useCallback(() => {
    geolocation.startWatching();
    setIsLocationTracking(true);
  }, [geolocation]);

  const stopLocationTracking = useCallback(() => {
    geolocation.stopWatching();
    setIsLocationTracking(false);
  }, [geolocation]);

  const refreshLocation = useCallback(() => {
    geolocation.refresh();
  }, [geolocation]);

  const resetProgress = useCallback(() => {
    tripBrain.resetProgress();
    // Refresh recommendations
    const recs = tripBrain.getRecommendations({ count: recommendationCount });
    setRecommendations(recs);
  }, [tripBrain, recommendationCount]);

  const getStats = useCallback(() => {
    return tripBrain.getStats();
  }, [tripBrain]);

  // ==================== Derived State ====================

  const isReady = tripBrain.isReady;
  const location = state?.userLocation ?? null;
  const locationError = geolocation.error?.message ?? null;

  const stats = useMemo(() => {
    return tripBrain.getStats();
  }, [tripBrain, state]); // Recalculate when state changes

  // ==================== Context Value ====================

  const value = useMemo<TripBrainContextValue>(
    () => ({
      // Raw state
      state,
      tripBrain,

      // Derived state
      isReady,
      recommendations,
      location,
      isTrackingLocation: isLocationTracking,
      locationError,
      stats,

      // Actions
      loadTrip,
      updatePreferences,
      updateWeather,
      getRecommendations,
      searchCraving,
      getSerendipity,
      getActivitiesForDay,
      recordChoice,
      recordCompletion,
      recordSkip,
      undoSkip,
      undoCompletion,
      updateLocation,
      startLocationTracking,
      stopLocationTracking,
      refreshLocation,
      resetProgress,
      getStats,
    }),
    [
      state,
      tripBrain,
      isReady,
      recommendations,
      location,
      isLocationTracking,
      locationError,
      stats,
      loadTrip,
      updatePreferences,
      updateWeather,
      getRecommendations,
      searchCraving,
      getSerendipity,
      getActivitiesForDay,
      recordChoice,
      recordCompletion,
      recordSkip,
      undoSkip,
      undoCompletion,
      updateLocation,
      startLocationTracking,
      stopLocationTracking,
      refreshLocation,
      resetProgress,
      getStats,
    ]
  );

  // ==================== Cleanup ====================

  useEffect(() => {
    return () => {
      tripBrain.destroy();
    };
  }, [tripBrain]);

  return (
    <TripBrainContext.Provider value={value}>
      {children}
    </TripBrainContext.Provider>
  );
}

// ============================================================================
// Consumer Hooks
// ============================================================================

/**
 * Main hook to access Trip Brain context
 *
 * @throws If used outside of TripBrainProvider
 */
export function useTripBrain(): TripBrainContextValue {
  const context = useContext(TripBrainContext);

  if (context === undefined) {
    throw new Error('useTripBrain must be used within a TripBrainProvider');
  }

  return context;
}

/**
 * Hook to access just the recommendations
 */
export function useTripBrainRecommendations(): EnrichedActivity[] {
  const { recommendations } = useTripBrain();
  return recommendations;
}

/**
 * Hook to access trip completion stats
 */
export function useTripBrainStats(): TripBrainDerivedState['stats'] {
  const { stats } = useTripBrain();
  return stats;
}

/**
 * Hook to access location state
 */
export function useTripBrainLocation(): {
  location: LocationContext | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
  refresh: () => void;
} {
  const {
    location,
    isTrackingLocation,
    locationError,
    startLocationTracking,
    stopLocationTracking,
    refreshLocation,
  } = useTripBrain();

  return {
    location,
    isTracking: isTrackingLocation,
    error: locationError,
    startTracking: startLocationTracking,
    stopTracking: stopLocationTracking,
    refresh: refreshLocation,
  };
}

/**
 * Hook to access activity tracking actions
 */
export function useTripBrainTracking(): {
  recordChoice: TripBrainActions['recordChoice'];
  recordCompletion: TripBrainActions['recordCompletion'];
  recordSkip: TripBrainActions['recordSkip'];
  undoSkip: TripBrainActions['undoSkip'];
  undoCompletion: TripBrainActions['undoCompletion'];
} {
  const {
    recordChoice,
    recordCompletion,
    recordSkip,
    undoSkip,
    undoCompletion,
  } = useTripBrain();

  return {
    recordChoice,
    recordCompletion,
    recordSkip,
    undoSkip,
    undoCompletion,
  };
}

/**
 * Hook for craving search functionality
 */
export function useTripBrainCraving(): {
  search: (query: string, options?: Omit<CravingSearchOptions, 'query'>) => CravingSearchResult;
  getSerendipity: () => SerendipityResult | null;
} {
  const { searchCraving, getSerendipity } = useTripBrain();

  const search = useCallback(
    (query: string, options?: Omit<CravingSearchOptions, 'query'>) => {
      return searchCraving({ query, ...options });
    },
    [searchCraving]
  );

  return {
    search,
    getSerendipity,
  };
}

// ============================================================================
// Optional: Safe hook that returns null outside provider
// ============================================================================

/**
 * Safe version of useTripBrain that returns null outside provider
 * Useful for components that may or may not be inside the provider
 */
export function useTripBrainSafe(): TripBrainContextValue | null {
  const context = useContext(TripBrainContext);
  return context ?? null;
}
