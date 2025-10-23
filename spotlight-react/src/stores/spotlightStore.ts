import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Waypoint, City } from '../types'
import { addLandmarkToRoute } from '../utils/routeOptimization'

interface SpotlightState {
  waypoints: Waypoint[]
  originalCities: Waypoint[] // Track original cities for route optimization
  addedLandmarks: Waypoint[] // Track added landmarks
  isLoading: boolean
  error: string | null

  // Actions
  setWaypoints: (waypoints: Waypoint[]) => void
  setOriginalCities: (cities: Waypoint[]) => void
  addWaypoint: (waypoint: City, afterIndex: number) => void
  addLandmark: (landmark: Waypoint) => void
  removeWaypoint: (id: string) => void
  reorderWaypoints: (startIndex: number, endIndex: number) => void
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useSpotlightStore = create<SpotlightState>()(
  devtools(
    (set) => ({
      waypoints: [],
      originalCities: [],
      addedLandmarks: [],
      isLoading: false,
      error: null,

      setWaypoints: (waypoints) =>
        set({ waypoints }, false, 'setWaypoints'),

      setOriginalCities: (cities) =>
        set({ originalCities: cities }, false, 'setOriginalCities'),

      addWaypoint: (city, afterIndex) =>
        set((state) => {
          const newWaypoint: Waypoint = {
            ...city,
            id: city.id || `waypoint-${Date.now()}`,
            order: afterIndex + 1,
          }

          const newWaypoints = [...state.waypoints]
          newWaypoints.splice(afterIndex + 1, 0, newWaypoint)

          // Reorder all waypoints
          return {
            waypoints: newWaypoints.map((wp, idx) => ({
              ...wp,
              order: idx,
            })),
          }
        }, false, 'addWaypoint'),

      addLandmark: (landmark) =>
        set((state) => {
          // Check if landmark already exists
          const exists = state.addedLandmarks.some((l) => l.name === landmark.name)
          if (exists) {
            console.warn('Landmark already added:', landmark.name)
            return state
          }

          // Mark as landmark
          const landmarkWaypoint: Waypoint = {
            ...landmark,
            id: `landmark-${Date.now()}`,
            isLandmark: true,
            activities: landmark.activities || [
              `Explore ${landmark.name}`,
              'Learn about the history',
              'Take photos',
            ],
          }

          // Add landmark to the route using optimal positioning
          const optimizedWaypoints = addLandmarkToRoute(
            state.waypoints,
            landmarkWaypoint,
            state.originalCities
          )

          return {
            waypoints: optimizedWaypoints,
            addedLandmarks: [...state.addedLandmarks, landmarkWaypoint],
          }
        }, false, 'addLandmark'),

      removeWaypoint: (id) =>
        set((state) => ({
          waypoints: state.waypoints
            .filter((wp) => wp.id !== id)
            .map((wp, idx) => ({ ...wp, order: idx })),
        }), false, 'removeWaypoint'),

      reorderWaypoints: (startIndex, endIndex) =>
        set((state) => {
          const result = Array.from(state.waypoints)
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)

          return {
            waypoints: result.map((wp, idx) => ({ ...wp, order: idx })),
          }
        }, false, 'reorderWaypoints'),

      updateWaypoint: (id, updates) =>
        set((state) => ({
          waypoints: state.waypoints.map((wp) =>
            wp.id === id ? { ...wp, ...updates } : wp
          ),
        }), false, 'updateWaypoint'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),
    })
  )
)
