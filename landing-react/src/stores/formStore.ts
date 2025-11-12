import { create } from 'zustand'
import type { AgentType, BudgetLevel, RouteFormData, CityData } from '../types'

export type TripPace = 'leisurely' | 'balanced' | 'fast-paced'

interface FormState extends RouteFormData {
  isLoading: boolean
  error: string | null
  originError: string | null
  destinationError: string | null
  totalNights: number
  tripPace: TripPace

  // Actions
  setOrigin: (origin: CityData) => void
  setDestination: (destination: CityData) => void
  setOriginError: (error: string | null) => void
  setDestinationError: (error: string | null) => void
  setBudget: (budget: BudgetLevel) => void
  toggleAgent: (agent: AgentType) => void
  setAgents: (agents: AgentType[]) => void
  setTotalNights: (nights: number) => void
  setTripPace: (pace: TripPace) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  origin: null,  // No hardcoded default - user must select
  destination: null,
  originError: null,
  destinationError: null,
  budget: 'comfort' as BudgetLevel,
  agents: ['adventure', 'culture', 'food', 'hidden-gems'] as AgentType[],
  totalNights: 10,
  tripPace: 'balanced' as TripPace,
  isLoading: false,
  error: null,
}

export const useFormStore = create<FormState>((set) => ({
  ...initialState,

  setOrigin: (origin) => set({ origin, originError: null }),

  setDestination: (destination) => set({ destination, destinationError: null }),

  setOriginError: (originError) => set({ originError }),

  setDestinationError: (destinationError) => set({ destinationError }),

  setBudget: (budget) => set({ budget }),

  toggleAgent: (agent) =>
    set((state) => {
      const agents = state.agents.includes(agent)
        ? state.agents.filter((a) => a !== agent)
        : [...state.agents, agent]
      return { agents }
    }),

  setAgents: (agents) => set({ agents }),

  setTotalNights: (totalNights) => set({ totalNights }),

  setTripPace: (tripPace) => set({ tripPace }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}))
