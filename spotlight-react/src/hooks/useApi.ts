import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../services/api'
import type { City, Waypoint } from '../types'

// Search cities hook
export function useSearchCities(query: string, enabled = true) {
  return useQuery({
    queryKey: ['cities', 'search', query],
    queryFn: () => api.searchCities(query),
    enabled: enabled && query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get city by ID hook
export function useCityById(cityId: string | null) {
  return useQuery({
    queryKey: ['cities', cityId],
    queryFn: () => api.getCityById(cityId!),
    enabled: !!cityId,
  })
}

// Get waypoints hook
export function useWaypoints(tripId?: string) {
  return useQuery({
    queryKey: ['waypoints', tripId],
    queryFn: () => api.getWaypoints(tripId),
  })
}

// Save waypoints mutation
export function useSaveWaypoints(tripId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (waypoints: Waypoint[]) => api.saveWaypoints(waypoints, tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waypoints', tripId] })
    },
  })
}

// Delete waypoint mutation
export function useDeleteWaypoint(tripId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (waypointId: string) => api.deleteWaypoint(waypointId, tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waypoints', tripId] })
    },
  })
}

// Get city recommendations hook
export function useCityRecommendations(currentCities: string[], enabled = false) {
  return useQuery({
    queryKey: ['cities', 'recommendations', currentCities],
    queryFn: () => api.getCityRecommendations(currentCities),
    enabled: enabled && currentCities.length > 0,
  })
}

// Export trip mutation
export function useExportTrip() {
  return useMutation({
    mutationFn: ({ tripId, format }: { tripId: string; format: 'pdf' | 'json' | 'csv' }) =>
      api.exportTrip(tripId, format),
    onSuccess: (blob, variables) => {
      // Auto-download the exported file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trip-export.${variables.format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })
}
