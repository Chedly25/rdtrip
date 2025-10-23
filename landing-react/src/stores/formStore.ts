import { create } from 'zustand'
import type { AgentType, BudgetLevel, RouteFormData } from '../types'

interface FormState extends RouteFormData {
  isLoading: boolean
  error: string | null
  
  // Actions
  setOrigin: (origin: string) => void
  setDestination: (destination: string) => void
  setStops: (stops: number) => void
  setBudget: (budget: BudgetLevel) => void
  toggleAgent: (agent: AgentType) => void
  setAgents: (agents: AgentType[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  origin: 'Aix-en-Provence',
  destination: '',
  stops: 3,
  budget: 'comfort' as BudgetLevel,
  agents: ['adventure', 'culture', 'food', 'hidden-gems'] as AgentType[],
  isLoading: false,
  error: null,
}

export const useFormStore = create<FormState>((set) => ({
  ...initialState,

  setOrigin: (origin) => set({ origin }),
  
  setDestination: (destination) => set({ destination }),
  
  setStops: (stops) => set({ stops }),
  
  setBudget: (budget) => set({ budget }),
  
  toggleAgent: (agent) =>
    set((state) => {
      const agents = state.agents.includes(agent)
        ? state.agents.filter((a) => a !== agent)
        : [...state.agents, agent]
      return { agents }
    }),
  
  setAgents: (agents) => set({ agents }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set(initialState),
}))
