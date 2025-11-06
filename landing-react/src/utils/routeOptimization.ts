/**
 * Route Optimization Utilities
 * Based on the proven algorithm from destination-manager.js
 * Uses Haversine formula to calculate optimal city insertion positions
 */

interface Activity {
  name?: string
  activity?: string
  difficulty?: number
}

export interface City {
  name: string
  coordinates?: [number, number] // [lat, lng]
  description?: string
  themes?: string[]
  themesDisplay?: string
  activities?: (string | Activity)[]
  image?: string
  imageUrl?: string
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Check if a coordinate value is valid (finite number, not NaN)
 */
function isValidCoordinate(coord: any): boolean {
  return typeof coord === 'number' && isFinite(coord) && !isNaN(coord)
}

/**
 * Extract [lat, lng] from coordinates - handles both array and object formats
 * Backend sometimes returns {lat, lng} instead of [lat, lng]
 */
function extractCoordinates(coords: any): [number, number] | null {
  if (!coords) return null

  // Handle array format: [lat, lng]
  if (Array.isArray(coords) && coords.length >= 2) {
    const [lat, lng] = coords
    if (isValidCoordinate(lat) && isValidCoordinate(lng)) {
      return [lat, lng]
    }
  }

  // Handle object format: {lat, lng} or {latitude, longitude}
  if (typeof coords === 'object') {
    const lat = coords.lat ?? coords.latitude
    const lng = coords.lng ?? coords.longitude
    if (isValidCoordinate(lat) && isValidCoordinate(lng)) {
      return [lat, lng]
    }
  }

  return null
}

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

/**
 * Calculate optimal insertion position for a new city in existing route
 * Based on the algorithm from destination-manager.js:1956-2029
 *
 * Algorithm: For each possible position, calculate the "detour cost":
 * - detour_cost = distance(prev → new) + distance(new → next) - distance(prev → next)
 * - Choose position with minimum detour cost
 *
 * @param currentRoute - Array of existing cities in the route
 * @param newCity - The city to be inserted
 * @param originCoords - Starting point coordinates [lat, lng] (default: Aix-en-Provence)
 * @returns The optimal index position to insert the new city
 */
export function calculateOptimalInsertPosition(
  currentRoute: City[],
  newCity: City,
  originCoords: [number, number] = [43.5297, 5.4474] // Aix-en-Provence [lat, lng]
): number {
  // Defensive: Ensure currentRoute is actually an array
  if (!Array.isArray(currentRoute)) {
    console.error('❌ currentRoute is not an array:', typeof currentRoute, currentRoute)
    return 0 // Add at start as fallback
  }

  // Edge case: Empty route
  if (currentRoute.length === 0) {
    return 0
  }

  // Edge case: No coordinates for new city
  if (!newCity.coordinates) {
    console.warn('⚠️ New city has no coordinates, adding at end')
    return currentRoute.length // Add at end as fallback
  }

  const [newLat, newLng] = newCity.coordinates

  // Validate new city coordinates
  if (!isValidCoordinate(newLat) || !isValidCoordinate(newLng)) {
    console.error(`❌ Invalid coordinates for ${newCity.name}: [${newLat}, ${newLng}]`)
    return currentRoute.length // Add at end as fallback
  }

  const [originLat, originLng] = originCoords

  // Log current route with coordinates for debugging
  console.log(`📍 Calculating optimal position for ${newCity.name} [${newLat.toFixed(4)}, ${newLng.toFixed(4)}]:`)
  console.log('Current route:')
  currentRoute.forEach((c, i) => {
    const coords = extractCoordinates(c.coordinates)
    if (coords) {
      const [lat, lng] = coords
      console.log(`  ${i}: ${c.name} [${lat.toFixed(4)}, ${lng.toFixed(4)}]`)
    } else {
      console.log(`  ${i}: ${c.name} [NO VALID COORDINATES]`)
    }
  })

  let bestPosition = 0
  let minAdditionalDistance = Infinity

  // Try each possible insertion position (0 to route.length)
  const positionAnalysis: Array<{ position: number; description: string; addedDistance: number }> = []

  for (let i = 0; i <= currentRoute.length; i++) {
    let additionalDistance = Infinity // Default to Infinity for invalid positions
    let description = ''

    if (i === 0) {
      // Insert at beginning (before first city)
      const distanceFromOrigin = haversineDistance(originLat, originLng, newLat, newLng)

      if (currentRoute.length > 0) {
        const firstCoords = extractCoordinates(currentRoute[0].coordinates)
        if (firstCoords) {
          const [firstLat, firstLng] = firstCoords
          const distanceToFirst = haversineDistance(newLat, newLng, firstLat, firstLng)
          const originalDistanceToFirst = haversineDistance(originLat, originLng, firstLat, firstLng)
          additionalDistance = distanceFromOrigin + distanceToFirst - originalDistanceToFirst
        } else {
          additionalDistance = distanceFromOrigin
        }
      } else {
        additionalDistance = distanceFromOrigin
      }
      description = `Start (before ${currentRoute[0]?.name || 'route'})`
    } else if (i === currentRoute.length) {
      // Insert at end (after last city)
      const prevCity = currentRoute[i - 1]
      const prevCoords = extractCoordinates(prevCity?.coordinates)
      if (prevCoords) {
        const [prevLat, prevLng] = prevCoords
        additionalDistance = haversineDistance(prevLat, prevLng, newLat, newLng)
        description = `End (after ${prevCity.name})`
      } else {
        description = `End (after ${prevCity.name}) [INVALID COORDS]`
      }
    } else {
      // Insert between two cities
      const prevCity = currentRoute[i - 1]
      const nextCity = currentRoute[i]

      const prevCoords = extractCoordinates(prevCity?.coordinates)
      const nextCoords = extractCoordinates(nextCity?.coordinates)

      if (prevCoords && nextCoords) {
        const [prevLat, prevLng] = prevCoords
        const [nextLat, nextLng] = nextCoords

        const distanceFromPrev = haversineDistance(prevLat, prevLng, newLat, newLng)
        const distanceToNext = haversineDistance(newLat, newLng, nextLat, nextLng)
        const originalDistance = haversineDistance(prevLat, prevLng, nextLat, nextLng)

        additionalDistance = distanceFromPrev + distanceToNext - originalDistance
        description = `Between ${prevCity.name} and ${nextCity.name}`
      } else {
        description = `Between ${prevCity.name} and ${nextCity.name} [INVALID COORDS]`
      }
    }

    positionAnalysis.push({ position: i, description, addedDistance: additionalDistance })

    // Only consider positions with valid finite distances
    if (isFinite(additionalDistance) && additionalDistance < minAdditionalDistance) {
      minAdditionalDistance = additionalDistance
      bestPosition = i
    }
  }

  console.log('Position analysis:')
  positionAnalysis.forEach(p => {
    const marker = p.position === bestPosition ? '✅ BEST' : '  '
    const distStr = isFinite(p.addedDistance) ? `+${p.addedDistance.toFixed(1)} km` : 'INVALID'
    console.log(`  ${marker} Position ${p.position}: ${p.description} → ${distStr}`)
  })
  console.log(`✅ Optimal position: ${bestPosition} (adds ${minAdditionalDistance.toFixed(1)} km)`)

  return bestPosition
}

/**
 * Calculate total route distance given an array of cities
 * @param route - Array of cities in the route
 * @param originCoords - Starting point coordinates [lat, lng]
 * @returns Total distance in kilometers
 */
export function calculateTotalDistance(
  route: City[],
  originCoords: [number, number] = [43.5297, 5.4474]
): number {
  if (route.length === 0) return 0

  let totalDistance = 0
  const [originLat, originLng] = originCoords

  // Distance from origin to first city
  if (route[0]?.coordinates) {
    totalDistance += haversineDistance(
      originLat,
      originLng,
      route[0].coordinates[0],
      route[0].coordinates[1]
    )
  }

  // Distances between consecutive cities
  for (let i = 0; i < route.length - 1; i++) {
    const currentCity = route[i]
    const nextCity = route[i + 1]
    if (currentCity?.coordinates && nextCity?.coordinates) {
      totalDistance += haversineDistance(
        currentCity.coordinates[0],
        currentCity.coordinates[1],
        nextCity.coordinates[0],
        nextCity.coordinates[1]
      )
    }
  }

  return Math.round(totalDistance)
}

/**
 * Get a human-readable description of where a city was inserted
 * @param position - The index where the city was inserted
 * @param route - The route before insertion
 * @returns Description string like "at the start", "between Lyon and Geneva", etc.
 */
export function getPositionDescription(position: number, route: City[]): string {
  if (position === 0) {
    return 'at the start of the route'
  } else if (position === route.length) {
    return 'at the end of the route'
  } else {
    const prevCity = route[position - 1].name
    const nextCity = route[position].name
    return `between ${prevCity} and ${nextCity}`
  }
}
