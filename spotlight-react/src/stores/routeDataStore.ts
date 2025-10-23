import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface RouteData {
  agent: 'adventure' | 'culture' | 'food' | 'hidden-gems'
  destination: string
  origin: string
  totalStops: number
  waypoints?: any[]
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
        console.log('Loading from localStorage/sessionStorage...')
        const localData = localStorage.getItem('spotlightData')
        const sessionData = sessionStorage.getItem('spotlightData')
        console.log('localStorage spotlightData:', localData ? 'EXISTS' : 'NULL')
        console.log('sessionStorage spotlightData:', sessionData ? 'EXISTS' : 'NULL')

        const data = localData || sessionData
        if (data) {
          try {
            const parsed = JSON.parse(data)
            console.log('Parsed spotlight data:', parsed)
            set({ routeData: parsed })
          } catch (error) {
            console.error('Failed to parse spotlight data:', error)
          }
        } else {
          console.error('No spotlightData found in localStorage or sessionStorage!')
        }
      },
    }),
    { name: 'route-data-store' }
  )
)
