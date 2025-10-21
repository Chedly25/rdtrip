import type { City, Waypoint } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Error handling helper
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchWithError(url: string, options?: RequestInit) {
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `API Error: ${response.status} ${response.statusText}`
    )
  }

  return response.json()
}

// City search API
export async function searchCities(query: string): Promise<City[]> {
  try {
    const params = new URLSearchParams({ q: query })
    return await fetchWithError(`${API_BASE_URL}/cities/search?${params}`)
  } catch (error) {
    console.error('Failed to search cities:', error)
    // Return mock data as fallback
    return [
      {
        id: `city-${Date.now()}`,
        name: query,
        description: `Discover the beauty of ${query}`,
        activities: [
          'Explore the historic city center',
          'Visit local museums and galleries',
          'Try authentic local cuisine',
          'Walk through beautiful parks',
        ],
        imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(query)},city`,
      }
    ]
  }
}

// Get city details by ID
export async function getCityById(cityId: string): Promise<City> {
  try {
    return await fetchWithError(`${API_BASE_URL}/cities/${cityId}`)
  } catch (error) {
    console.error('Failed to fetch city details:', error)
    throw error
  }
}

// Waypoints/Trip management
export async function getWaypoints(tripId?: string): Promise<Waypoint[]> {
  try {
    const url = tripId
      ? `${API_BASE_URL}/trips/${tripId}/waypoints`
      : `${API_BASE_URL}/waypoints`
    return await fetchWithError(url)
  } catch (error) {
    console.error('Failed to fetch waypoints:', error)
    return []
  }
}

export async function saveWaypoints(waypoints: Waypoint[], tripId?: string): Promise<void> {
  try {
    const url = tripId
      ? `${API_BASE_URL}/trips/${tripId}/waypoints`
      : `${API_BASE_URL}/waypoints`

    await fetchWithError(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(waypoints),
    })
  } catch (error) {
    console.error('Failed to save waypoints:', error)
    throw error
  }
}

export async function deleteWaypoint(waypointId: string, tripId?: string): Promise<void> {
  try {
    const url = tripId
      ? `${API_BASE_URL}/trips/${tripId}/waypoints/${waypointId}`
      : `${API_BASE_URL}/waypoints/${waypointId}`

    await fetchWithError(url, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Failed to delete waypoint:', error)
    throw error
  }
}

// Get city recommendations based on current waypoints
export async function getCityRecommendations(currentCities: string[]): Promise<City[]> {
  try {
    return await fetchWithError(`${API_BASE_URL}/cities/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cities: currentCities }),
    })
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
    return []
  }
}

// Export trip data
export async function exportTrip(tripId: string, format: 'pdf' | 'json' | 'csv'): Promise<Blob> {
  try {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/export?format=${format}`)

    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to export trip')
    }

    return await response.blob()
  } catch (error) {
    console.error('Failed to export trip:', error)
    throw error
  }
}
