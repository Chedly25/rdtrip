import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Waypoint, City } from '../types'
import { addLandmarkToRoute } from '../utils/routeOptimization'
import { enrichCityData } from '../services/cityEnrichment'

interface SpotlightState {
  waypoints: Waypoint[]
  originalCities: Waypoint[] // Track original cities for route optimization
  addedLandmarks: Waypoint[] // Track added landmarks
  isLoading: boolean
  error: string | null

  // Actions
  setWaypoints: (waypoints: Waypoint[]) => void
  setOriginalCities: (cities: Waypoint[]) => void
  addWaypoint: (waypoint: City, afterIndex: number) => Promise<void>
  addLandmark: (landmark: Waypoint) => void
  removeWaypoint: (id: string) => void
  reorderWaypoints: (startIndex: number, endIndex: number) => void
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

// Helper to save to localStorage
function saveToLocalStorage(waypoints: Waypoint[], addedLandmarks: Waypoint[]) {
  try {
    const spotlightData = JSON.parse(localStorage.getItem('spotlightData') || '{}')
    spotlightData.waypoints = waypoints
    spotlightData.addedLandmarks = addedLandmarks
    localStorage.setItem('spotlightData', JSON.stringify(spotlightData))
    console.log('✅ Saved to localStorage:', { waypoints: waypoints.length, landmarks: addedLandmarks.length })
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export const useSpotlightStore = create<SpotlightState>()(
  devtools(
    (set, get) => ({
      waypoints: [],
      originalCities: [],
      addedLandmarks: [],
      isLoading: false,
      error: null,

      setWaypoints: (waypoints) => {
        set({ waypoints }, false, 'setWaypoints')
        saveToLocalStorage(waypoints, get().addedLandmarks)
      },

      setOriginalCities: (cities) =>
        set({ originalCities: cities }, false, 'setOriginalCities'),

      addWaypoint: async (city, afterIndex) => {
        // Geocode the city to get coordinates
        const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ'
        let coordinates = city.coordinates

        if (!coordinates) {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city.name)}.json?access_token=${MAPBOX_TOKEN}&types=place&limit=1`
            )
            const data = await response.json()

            if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].center
              coordinates = { lat, lng }
            }
          } catch (error) {
            console.error(`Failed to geocode ${city.name}:`, error)
            // Fallback coordinates (center of Europe)
            coordinates = { lat: 48.8566, lng: 2.3522 }
          }
        }

        const newWaypoint: Waypoint = {
          ...city,
          id: city.id || `waypoint-${Date.now()}`,
          order: afterIndex + 1,
          coordinates,
          activities: city.activities || ['Explore the city', 'Try local cuisine', 'Visit landmarks'],
          imageUrl: city.imageUrl,
        }

        // Add waypoint immediately
        set((state) => {
          const newWaypoints = [...state.waypoints]
          newWaypoints.splice(afterIndex + 1, 0, newWaypoint)

          const orderedWaypoints = newWaypoints.map((wp, idx) => ({
            ...wp,
            order: idx,
          }))

          // Save to localStorage
          saveToLocalStorage(orderedWaypoints, state.addedLandmarks)

          return {
            waypoints: orderedWaypoints,
          }
        }, false, 'addWaypoint')

        // Enrich the city data in the background
        try {
          console.log(`Starting enrichment for ${city.name}...`)
          const { activities, imageUrl } = await enrichCityData(city.name)

          console.log(`Got enriched data for ${city.name}:`, {
            activities,
            imageUrl: imageUrl ? 'YES' : 'NO',
          })

          set((state) => {
            const updatedWaypoints = state.waypoints.map((wp) =>
              wp.id === newWaypoint.id
                ? {
                    ...wp,
                    activities: activities.length > 0 ? activities : wp.activities,
                    imageUrl: imageUrl || wp.imageUrl,
                  }
                : wp
            )

            // Save enriched data to localStorage
            saveToLocalStorage(updatedWaypoints, state.addedLandmarks)

            console.log(`Updated waypoint ${newWaypoint.id} with enriched data`)
            return { waypoints: updatedWaypoints }
          }, false, 'enrichWaypoint')

          console.log(`✅ Successfully enriched ${city.name} with ${activities.length} activities`)
        } catch (error) {
          console.error(`❌ Failed to enrich city data for ${city.name}:`, error)
        }
      },

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

          const newAddedLandmarks = [...state.addedLandmarks, landmarkWaypoint]

          // Save to localStorage
          saveToLocalStorage(optimizedWaypoints, newAddedLandmarks)

          return {
            waypoints: optimizedWaypoints,
            addedLandmarks: newAddedLandmarks,
          }
        }, false, 'addLandmark'),

      removeWaypoint: (id) =>
        set((state) => {
          const updatedWaypoints = state.waypoints
            .filter((wp) => wp.id !== id)
            .map((wp, idx) => ({ ...wp, order: idx }))

          // Remove from landmarks list if it was a landmark
          const updatedLandmarks = state.addedLandmarks.filter((l) => l.id !== id)

          // Save to localStorage
          saveToLocalStorage(updatedWaypoints, updatedLandmarks)

          return {
            waypoints: updatedWaypoints,
            addedLandmarks: updatedLandmarks,
          }
        }, false, 'removeWaypoint'),

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
