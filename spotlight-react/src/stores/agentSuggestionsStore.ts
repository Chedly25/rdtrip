/**
 * Agent Suggestions Store
 * Phase 2: Manages city suggestions from all agents
 */

import { create } from 'zustand';

export type AgentType = 'best-overall' | 'adventure' | 'culture' | 'food' | 'hidden-gems' | 'scenic' | 'photo-stops';

export interface AgentCity {
  id: string;
  name: string;
  country: string;
  displayName: string; // e.g., "Lyon, France"
  image?: string;
  coordinates: { lat: number; lng: number };
  highlights: string[];
  agentType: AgentType;
  suggestedDay?: number;
  nights?: number;
  isInItinerary: boolean;
}

interface AgentSuggestionsState {
  // Data
  allCities: AgentCity[];
  selectedAgentFilter: AgentType | 'all';

  // UI State
  isPanelExpanded: boolean;

  // Actions
  loadCities: (cities: AgentCity[]) => void;
  setAgentFilter: (agent: AgentType | 'all') => void;
  togglePanel: () => void;
  markCityAsAdded: (cityId: string) => void;
  markCityAsRemoved: (cityId: string) => void;

  // Getters
  getFilteredCities: () => AgentCity[];
  getCitiesByAgent: (agent: AgentType) => AgentCity[];
}

export const useAgentSuggestionsStore = create<AgentSuggestionsState>((set, get) => ({
  // Initial state
  allCities: [],
  selectedAgentFilter: 'all',
  isPanelExpanded: false,

  // Actions
  loadCities: (cities) => set({ allCities: cities }),

  setAgentFilter: (agent) => set({ selectedAgentFilter: agent }),

  togglePanel: () => set((state) => ({ isPanelExpanded: !state.isPanelExpanded })),

  markCityAsAdded: (cityId) => set((state) => ({
    allCities: state.allCities.map(city =>
      city.id === cityId ? { ...city, isInItinerary: true } : city
    )
  })),

  markCityAsRemoved: (cityId) => set((state) => ({
    allCities: state.allCities.map(city =>
      city.id === cityId ? { ...city, isInItinerary: false } : city
    )
  })),

  // Getters
  getFilteredCities: () => {
    const { allCities, selectedAgentFilter } = get();
    if (selectedAgentFilter === 'all') {
      return allCities;
    }
    return allCities.filter(city => city.agentType === selectedAgentFilter);
  },

  getCitiesByAgent: (agent) => {
    const { allCities } = get();
    return allCities.filter(city => city.agentType === agent);
  }
}));
