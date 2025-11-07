import { create } from 'zustand'
import type { AgentType, BudgetLevel, RouteFormData } from '../types'

export type TripPace = 'leisurely' | 'balanced' | 'fast-paced'

interface FormState extends RouteFormData {
  isLoading: boolean
  error: string | null
  totalNights: number
  tripPace: TripPace

  // Actions
  setOrigin: (origin: string) => void
  setDestination: (destination: string) => void
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
  origin: 'Aix-en-Provence',
  destination: '',
  budget: 'comfort' as BudgetLevel,
  agents: ['adventure', 'culture', 'food', 'hidden-gems'] as AgentType[],
  totalNights: 10,
  tripPace: 'balanced' as TripPace,
  isLoading: false,
  error: null,
}

export const useFormStore = create<FormState>((set) => ({
  ...initialState,

  setOrigin: (origin) => set({ origin }),

  setDestination: (destination) => set({ destination }),

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
