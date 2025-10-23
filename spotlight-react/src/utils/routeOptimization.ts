import type { Waypoint } from '../types'

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Find the optimal position to insert a landmark into the route
 * Minimizes the total additional distance
 */
export function findOptimalPosition(waypoints: Waypoint[], newWaypoint: Waypoint): number {
  if (!waypoints || waypoints.length === 0) {
    return 0
  }

  let bestPosition = 0
  let minTotalDistance = Infinity

  // Try inserting at each possible position and calculate total route distance
  for (let i = 0; i <= waypoints.length; i++) {
    let totalDistance = 0

    // Create a temporary route with the new waypoint inserted
    const tempRoute = [...waypoints]
    tempRoute.splice(i, 0, newWaypoint)

    // Calculate total distance of this route
    for (let j = 0; j < tempRoute.length - 1; j++) {
      const wp1 = tempRoute[j]
      const wp2 = tempRoute[j + 1]

      if (wp1.coordinates && wp2.coordinates) {
        totalDistance += calculateDistance(
          wp1.coordinates.lat,
          wp1.coordinates.lng,
          wp2.coordinates.lat,
          wp2.coordinates.lng
        )
      }
    }

    // Track the position with minimum total distance
    if (totalDistance < minTotalDistance) {
      minTotalDistance = totalDistance
      bestPosition = i
    }
  }

  return bestPosition
}

/**
 * Optimize the full route by inserting landmarks at optimal positions
 * Preserves the order of original cities, only optimizes landmark placement
 */
export function optimizeFullRoute(
  waypoints: Waypoint[],
  originalCities: Waypoint[]
): Waypoint[] {
  if (!waypoints || waypoints.length <= 2) {
    return waypoints
  }

  // Separate cities from landmarks
  const cities = waypoints.filter(
    (wp) => !wp.isLandmark && wp.id !== 'origin' && wp.id !== 'destination'
  )

  const landmarks = waypoints.filter((wp) => wp.isLandmark)

  console.log('Optimizing route - Cities:', cities.length, 'Landmarks:', landmarks.length)

  // Use original cities as the base route
  const baseRoute = originalCities.length > 0 ? [...originalCities] : [...cities]

  // Now insert each landmark at its optimal position in the base route
  const optimizedRoute = [...baseRoute]

  // For each landmark, find the best position to insert it
  landmarks.forEach((landmark) => {
    const position = findOptimalPosition(optimizedRoute, landmark)
    optimizedRoute.splice(position, 0, landmark)
  })

  console.log('Optimized route:', optimizedRoute.length, 'waypoints')
  return optimizedRoute
}

/**
 * Add a landmark to the route and optimize its position
 */
export function addLandmarkToRoute(
  currentWaypoints: Waypoint[],
  landmark: Waypoint,
  originalCities: Waypoint[]
): Waypoint[] {
  // Combine all waypoints
  const allWaypoints = [...currentWaypoints, landmark]

  // Use the full route optimization
  const optimizedWaypoints = optimizeFullRoute(allWaypoints, originalCities)

  // Update order numbers
  return optimizedWaypoints.map((wp, index) => ({
    ...wp,
    order: index,
  }))
}
