import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface RouteData {
  agent: 'adventure' | 'culture' | 'food' | 'hidden-gems'
  destination: string
  origin: string
  totalStops: number
  agentResults: Array<{
    agent: string
    recommendations: string
  }>
}

interface RouteDataState {
  routeData: RouteData | null
  setRouteData: (data: RouteData) => void
  loadFromLocalStorage: () => void
}

export const useRouteDataStore = create<RouteDataState>()(
  devtools(
    (set) => ({
      routeData: null,

      setRouteData: (data) => set({ routeData: data }),

      loadFromLocalStorage: () => {
        // Try localStorage first (as set by the main app), then sessionStorage as fallback
        const data = localStorage.getItem('spotlightData') || sessionStorage.getItem('spotlightData')
        if (data) {
          try {
            const parsed = JSON.parse(data)
            set({ routeData: parsed })
          } catch (error) {
            console.error('Failed to parse spotlight data:', error)
          }
        }
      },
    }),
    { name: 'route-data-store' }
  )
)
