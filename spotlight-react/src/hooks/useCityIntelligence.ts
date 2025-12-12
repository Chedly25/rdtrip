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
  selectCityIntelligence,
  selectAgentStates,
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
  // Store state
  const isProcessing = useCityIntelligenceStore(selectIsProcessing);
  const overallProgress = useCityIntelligenceStore(selectOverallProgress);
  const currentPhase = useCityIntelligenceStore(selectCurrentPhase);
  const goal = useCityIntelligenceStore(selectGoal);
  const errors = useCityIntelligenceStore(selectErrors);
  const allCityIntelligence = useCityIntelligenceStore(selectAllCityIntelligence);
  const completedCities = useCityIntelligenceStore(selectCompletedCities);

  // Store actions
  const startIntelligence = useCityIntelligenceStore((s) => s.startIntelligence);
  const cancelIntelligence = useCityIntelligenceStore((s) => s.cancelIntelligence);
  const reset = useCityIntelligenceStore((s) => s.reset);

  // Memoized start function with typed parameters
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
      return startIntelligence(params);
    },
    [startIntelligence]
  );

  // Computed values
  const isComplete = currentPhase === 'complete';
  const hasErrors = errors.length > 0;
  const citiesCount = allCityIntelligence.length;
  const completedCount = completedCities.length;

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
    reset,
  };
}

// =============================================================================
// City-Specific Hook
// =============================================================================

/**
 * Hook for accessing intelligence for a specific city
 */
export function useCityIntelligenceForCity(cityId: string) {
  const intelligence = useCityIntelligenceStore(selectCityIntelligence(cityId));
  const agentStates = useCityIntelligenceStore(selectAgentStates(cityId));
  const isProcessing = useCityIntelligenceStore(selectIsProcessing);

  // Calculate city-specific progress
  const progress = useMemo(() => {
    if (!agentStates || Object.keys(agentStates).length === 0) return 0;

    const states = Object.values(agentStates);
    const totalProgress = states.reduce((sum, state) => {
      if (state.status === 'completed') return sum + 100;
      if (state.status === 'running') return sum + (state.progress || 0);
      return sum;
    }, 0);

    return Math.round(totalProgress / states.length);
  }, [agentStates]);

  // Check if any agents are running
  const hasRunningAgents = useMemo(() => {
    if (!agentStates) return false;
    return Object.values(agentStates).some((s) => s.status === 'running');
  }, [agentStates]);

  // Get completed agent count
  const completedAgentsCount = useMemo(() => {
    if (!agentStates) return 0;
    return Object.values(agentStates).filter((s) => s.status === 'completed').length;
  }, [agentStates]);

  // Get total agents count
  const totalAgentsCount = Object.keys(agentStates || {}).length;

  return {
    intelligence,
    agentStates,
    progress,
    isProcessing: isProcessing && (intelligence?.status === 'processing' || hasRunningAgents),
    isComplete: intelligence?.status === 'complete',
    hasRunningAgents,
    completedAgentsCount,
    totalAgentsCount,
    quality: intelligence?.quality || 0,
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
// =============================================================================

/**
 * Hook for accessing the story section
 */
export function useCityStory(cityId: string) {
  const intelligence = useCityIntelligenceStore(selectCityIntelligence(cityId));
  return intelligence?.story || null;
}

/**
 * Hook for accessing time blocks
 */
export function useCityTimeBlocks(cityId: string) {
  const intelligence = useCityIntelligenceStore(selectCityIntelligence(cityId));
  return intelligence?.timeBlocks || null;
}

/**
 * Hook for accessing clusters
 */
export function useCityClusters(cityId: string) {
  const intelligence = useCityIntelligenceStore(selectCityIntelligence(cityId));
  return intelligence?.clusters || null;
}

/**
 * Hook for accessing match score
 */
export function useCityMatchScore(cityId: string) {
  const intelligence = useCityIntelligenceStore(selectCityIntelligence(cityId));
  return intelligence?.matchScore || null;
}

/**
 * Hook for accessing hidden gems
 */
export function useCityHiddenGems(cityId: string) {
  const intelligence = useCityIntelligenceStore(selectCityIntelligence(cityId));
  return intelligence?.hiddenGems || null;
}

/**
 * Hook for accessing logistics
 */
export function useCityLogistics(cityId: string) {
  const intelligence = useCityIntelligenceStore(selectCityIntelligence(cityId));
  return intelligence?.logistics || null;
}

/**
 * Hook for accessing weather
 */
export function useCityWeather(cityId: string) {
  const intelligence = useCityIntelligenceStore(selectCityIntelligence(cityId));
  return intelligence?.weather || null;
}

/**
 * Hook for accessing photo spots
 */
export function useCityPhotoSpots(cityId: string) {
  const intelligence = useCityIntelligenceStore(selectCityIntelligence(cityId));
  return intelligence?.photoSpots || null;
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
