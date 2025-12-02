import { create } from 'zustand'
import type {
  BudgetLevel,
  CityData,
  TravelCompanion,
  SelectedInterest,
  TripPreferences,
  TripPersonalization
} from '../types'

export type TripPace = 'leisurely' | 'balanced' | 'fast-paced'

interface FormState {
  // Location
  origin: CityData | null
  destination: CityData | null
  originError: string | null
  destinationError: string | null

  // Trip basics
  budget: BudgetLevel
  totalNights: number
  tripPace: TripPace

  // New unified preferences
  preferences: TripPreferences

  // Personalization (new)
  personalization: TripPersonalization

  // UI state
  isLoading: boolean
  error: string | null

  // Actions - Location
  setOrigin: (origin: CityData) => void
  setDestination: (destination: CityData) => void
  setOriginError: (error: string | null) => void
  setDestinationError: (error: string | null) => void

  // Actions - Trip basics
  setBudget: (budget: BudgetLevel) => void
  setTotalNights: (nights: number) => void
  setTripPace: (pace: TripPace) => void

  // Actions - Preferences
  setCompanions: (companions: TravelCompanion) => void
  setInterests: (interests: SelectedInterest[]) => void
  toggleInterest: (interestId: string) => void
  setInterestWeight: (interestId: string, weight: number) => void
  setTripStyle: (style: number) => void
  setConstraints: (constraints: TripPreferences['constraints']) => void

  // Actions - Personalization (new)
  setTripStory: (story: string) => void
  setPersonalization: (data: Partial<TripPersonalization>) => void
  clearPersonalization: () => void

  // Actions - UI state
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const defaultPreferences: TripPreferences = {
  companions: 'couple',
  interests: [
    { id: 'local-cuisine', weight: 4 },
    { id: 'architecture', weight: 3 },
    { id: 'off-beaten-path', weight: 3 }
  ],
  tripStyle: 50, // Balanced between relaxation and exploration
  constraints: {}
}

const defaultPersonalization: TripPersonalization = {
  tripStory: '',
}

const initialState = {
  origin: null,
  destination: null,
  originError: null,
  destinationError: null,
  budget: 'comfort' as BudgetLevel,
  totalNights: 10,
  tripPace: 'balanced' as TripPace,
  preferences: defaultPreferences,
  personalization: defaultPersonalization,
  isLoading: false,
  error: null,
}

export const useFormStore = create<FormState>((set) => ({
  ...initialState,

  // Location actions
  setOrigin: (origin) => set({ origin, originError: null }),
  setDestination: (destination) => set({ destination, destinationError: null }),
  setOriginError: (originError) => set({ originError }),
  setDestinationError: (destinationError) => set({ destinationError }),

  // Trip basics actions
  setBudget: (budget) => set({ budget }),
  setTotalNights: (totalNights) => set({ totalNights }),
  setTripPace: (tripPace) => set({ tripPace }),

  // Preference actions
  setCompanions: (companions) =>
    set((state) => ({
      preferences: { ...state.preferences, companions }
    })),

  setInterests: (interests) =>
    set((state) => ({
      preferences: { ...state.preferences, interests }
    })),

  toggleInterest: (interestId) =>
    set((state) => {
      const existing = state.preferences.interests.find((i) => i.id === interestId)
      let newInterests: SelectedInterest[]

      if (existing) {
        // Remove if already selected (but keep at least 1)
        if (state.preferences.interests.length > 1) {
          newInterests = state.preferences.interests.filter((i) => i.id !== interestId)
        } else {
          return state // Don't remove the last one
        }
      } else {
        // Add with default weight of 3
        newInterests = [...state.preferences.interests, { id: interestId, weight: 3 }]
      }

      return {
        preferences: { ...state.preferences, interests: newInterests }
      }
    }),

  setInterestWeight: (interestId, weight) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        interests: state.preferences.interests.map((i) =>
          i.id === interestId ? { ...i, weight } : i
        )
      }
    })),

  setTripStyle: (tripStyle) =>
    set((state) => ({
      preferences: { ...state.preferences, tripStyle }
    })),

  setConstraints: (constraints) =>
    set((state) => ({
      preferences: { ...state.preferences, constraints }
    })),

  // Personalization actions
  setTripStory: (tripStory) =>
    set((state) => ({
      personalization: { ...state.personalization, tripStory }
    })),

  setPersonalization: (data) =>
    set((state) => ({
      personalization: { ...state.personalization, ...data }
    })),

  clearPersonalization: () =>
    set({ personalization: defaultPersonalization }),

  // UI state actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
