import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Waypoint, City } from '../types'

interface SpotlightState {
  waypoints: Waypoint[]
  isLoading: boolean
  error: string | null

  // Actions
  setWaypoints: (waypoints: Waypoint[]) => void
  addWaypoint: (waypoint: City, afterIndex: number) => void
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
      isLoading: false,
      error: null,

      setWaypoints: (waypoints) =>
        set({ waypoints }, false, 'setWaypoints'),

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
