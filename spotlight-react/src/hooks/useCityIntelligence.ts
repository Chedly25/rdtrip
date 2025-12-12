/**
 * useCityIntelligence Hook
 *
 * React hook for consuming city intelligence data and managing
 * the intelligence gathering lifecycle.
 */

import { useCallback, useMemo } from 'react';
import {
  useCityIntelligenceStore,
  selectIsProcessing,
  selectOverallProgress,
  selectCurrentPhase,
  selectGoal,
  selectErrors,
  selectAllCityIntelligence,
  selectCompletedCities,
} from '../stores/cityIntelligenceStore';
import type {
  AgentName,
  CityData,
  UserPreferences,
  AgentExecutionState,
} from '../types/cityIntelligence';

// =============================================================================
// Main Hook
// =============================================================================

export function useCityIntelligence() {
  // Store state - with defensive fallbacks
  const isProcessing = useCityIntelligenceStore(selectIsProcessing) ?? false;
  const overallProgress = useCityIntelligenceStore(selectOverallProgress) ?? 0;
  const currentPhase = useCityIntelligenceStore(selectCurrentPhase) ?? 'planning';
  const goal = useCityIntelligenceStore(selectGoal) ?? '';
  const errors = useCityIntelligenceStore(selectErrors) ?? [];
  const allCityIntelligence = useCityIntelligenceStore(selectAllCityIntelligence) ?? [];
  const completedCities = useCityIntelligenceStore(selectCompletedCities) ?? [];

  // Store actions
  const startIntelligence = useCityIntelligenceStore((s) => s.startIntelligence);
  const cancelIntelligence = useCityIntelligenceStore((s) => s.cancelIntelligence);
  const resetStore = useCityIntelligenceStore((s) => s.reset);

  // Memoized start function with typed parameters and error handling
  const start = useCallback(
    async (params: {
      cities: CityData[];
      nights: Record<string, number>;
      preferences: UserPreferences;
      trip: {
        origin: CityData;
        destination: CityData;
        totalNights: number;
        travellerType: string;
        transportMode: 'car' | 'train' | 'mixed';
        startDate?: string;
        endDate?: string;
      };
      sessionId?: string;
    }) => {
      try {
        return await startIntelligence(params);
      } catch (error) {
        console.error('[useCityIntelligence] Error starting intelligence:', error);
        // Don't throw - let the component continue working
        return undefined;
      }
    },
    [startIntelligence]
  );

  // Computed values with defensive checks
  const isComplete = currentPhase === 'complete';
  const hasErrors = Array.isArray(errors) && errors.length > 0;
  const citiesCount = Array.isArray(allCityIntelligence) ? allCityIntelligence.length : 0;
  const completedCount = Array.isArray(completedCities) ? completedCities.length : 0;

  return {
    // State
    isProcessing,
    isComplete,
    overallProgress,
    currentPhase,
    goal,
    errors,
    hasErrors,

    // City data
    allCityIntelligence,
    completedCities,
    citiesCount,
    completedCount,

    // Actions
    start,
    cancel: cancelIntelligence,
    reset: resetStore,
  };
}

// =============================================================================
// City-Specific Hook
// =============================================================================

/**
 * Hook for accessing intelligence for a specific city
 * Made defensive against corrupted/missing data
 */
export function useCityIntelligenceForCity(cityId: string) {
  // Defensive: handle empty/invalid cityId
  const safeId = cityId || '';

  // IMPORTANT: Select the whole sub-objects and access by key to avoid creating
  // new selector functions on every render (which causes infinite re-render loops)
  const allIntelligence = useCityIntelligenceStore((state) => state.cityIntelligence);
  const allAgentStates = useCityIntelligenceStore((state) => state.agentStates);
  const isProcessing = useCityIntelligenceStore(selectIsProcessing) ?? false;

  // Access the specific city's data from the selected objects
  const intelligence = allIntelligence[safeId] || null;
  const agentStates = allAgentStates[safeId] || {};

  // Calculate city-specific progress with defensive checks
  const progress = useMemo(() => {
    if (!agentStates || typeof agentStates !== 'object') return 0;
    const keys = Object.keys(agentStates);
    if (keys.length === 0) return 0;

    try {
      const states = Object.values(agentStates);
      const totalProgress = states.reduce((sum, state) => {
        if (!state || typeof state !== 'object') return sum;
        if (state.status === 'completed') return sum + 100;
        if (state.status === 'running') return sum + (state.progress || 0);
        return sum;
      }, 0);

      return Math.round(totalProgress / states.length);
    } catch {
      return 0;
    }
  }, [agentStates]);

  // Check if any agents are running
  const hasRunningAgents = useMemo(() => {
    if (!agentStates || typeof agentStates !== 'object') return false;
    try {
      return Object.values(agentStates).some((s) => s?.status === 'running');
    } catch {
      return false;
    }
  }, [agentStates]);

  // Get completed agent count
  const completedAgentsCount = useMemo(() => {
    if (!agentStates || typeof agentStates !== 'object') return 0;
    try {
      return Object.values(agentStates).filter((s) => s?.status === 'completed').length;
    } catch {
      return 0;
    }
  }, [agentStates]);

  // Get total agents count
  const totalAgentsCount = agentStates && typeof agentStates === 'object'
    ? Object.keys(agentStates).length
    : 0;

  return {
    intelligence,
    agentStates,
    progress,
    isProcessing: Boolean(isProcessing && (intelligence?.status === 'processing' || hasRunningAgents)),
    isComplete: intelligence?.status === 'complete',
    hasRunningAgents,
    completedAgentsCount,
    totalAgentsCount,
    quality: intelligence?.quality ?? 0,
  };
}

// =============================================================================
// Agent-Specific Hook
// =============================================================================

/**
 * Hook for accessing a specific agent's state for a city
 */
export function useAgentState(
  cityId: string,
  agentName: AgentName
): AgentExecutionState | null {
  return useCityIntelligenceStore((state) => state.agentStates[cityId]?.[agentName] || null);
}

// =============================================================================
// Intelligence Sections Hooks
// NOTE: These hooks select the whole cityIntelligence object to avoid creating
// new selector functions on every render (which causes infinite re-render loops)
// =============================================================================

/**
 * Hook for accessing the story section
 */
export function useCityStory(cityId: string) {
  const allIntelligence = useCityIntelligenceStore((state) => state.cityIntelligence);
  return allIntelligence[cityId]?.story || null;
}

/**
 * Hook for accessing time blocks
 */
export function useCityTimeBlocks(cityId: string) {
  const allIntelligence = useCityIntelligenceStore((state) => state.cityIntelligence);
  return allIntelligence[cityId]?.timeBlocks || null;
}

/**
 * Hook for accessing clusters
 */
export function useCityClusters(cityId: string) {
  const allIntelligence = useCityIntelligenceStore((state) => state.cityIntelligence);
  return allIntelligence[cityId]?.clusters || null;
}

/**
 * Hook for accessing match score
 */
export function useCityMatchScore(cityId: string) {
  const allIntelligence = useCityIntelligenceStore((state) => state.cityIntelligence);
  return allIntelligence[cityId]?.matchScore || null;
}

/**
 * Hook for accessing hidden gems
 */
export function useCityHiddenGems(cityId: string) {
  const allIntelligence = useCityIntelligenceStore((state) => state.cityIntelligence);
  return allIntelligence[cityId]?.hiddenGems || null;
}

/**
 * Hook for accessing logistics
 */
export function useCityLogistics(cityId: string) {
  const allIntelligence = useCityIntelligenceStore((state) => state.cityIntelligence);
  return allIntelligence[cityId]?.logistics || null;
}

/**
 * Hook for accessing weather
 */
export function useCityWeather(cityId: string) {
  const allIntelligence = useCityIntelligenceStore((state) => state.cityIntelligence);
  return allIntelligence[cityId]?.weather || null;
}

/**
 * Hook for accessing photo spots
 */
export function useCityPhotoSpots(cityId: string) {
  const allIntelligence = useCityIntelligenceStore((state) => state.cityIntelligence);
  return allIntelligence[cityId]?.photoSpots || null;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get agent display name
 */
export function getAgentDisplayName(agentName: AgentName): string {
  const displayNames: Record<AgentName, string> = {
    TimeAgent: 'Time Planning',
    StoryAgent: 'City Story',
    PreferenceAgent: 'Preference Matching',
    ClusterAgent: 'Activity Clusters',
    GemsAgent: 'Hidden Gems',
    LogisticsAgent: 'Logistics',
    WeatherAgent: 'Weather',
    PhotoAgent: 'Photo Spots',
    SynthesisAgent: 'Synthesis',
  };
  return displayNames[agentName] || agentName;
}

/**
 * Get agent icon name (for use with icon libraries)
 */
export function getAgentIcon(agentName: AgentName): string {
  const icons: Record<AgentName, string> = {
    TimeAgent: 'clock',
    StoryAgent: 'book-open',
    PreferenceAgent: 'heart',
    ClusterAgent: 'map-pin',
    GemsAgent: 'gem',
    LogisticsAgent: 'truck',
    WeatherAgent: 'cloud-sun',
    PhotoAgent: 'camera',
    SynthesisAgent: 'layers',
  };
  return icons[agentName] || 'cpu';
}

/**
 * Get status color class
 */
export function getStatusColor(
  status: AgentExecutionState['status']
): string {
  switch (status) {
    case 'completed':
      return 'text-emerald-500';
    case 'running':
      return 'text-amber-500';
    case 'failed':
      return 'text-rose-500';
    default:
      return 'text-gray-400';
  }
}
