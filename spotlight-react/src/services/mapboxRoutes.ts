const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export interface RouteSegment {
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  distance: number; // meters
  duration: number; // seconds
  legs: {
    distance: number;
    duration: number;
    steps: any[];
  }[];
}

export interface MapboxRoute {
  geometry: any;
  distance: number; // Total distance in meters
  duration: number; // Total duration in seconds
  segments: RouteSegment[];
}

/**
 * Fetch a route between multiple waypoints using Mapbox Directions API
 * @param coordinates Array of [lng, lat] coordinates
 * @returns Route data with geometry and metrics
 */
export async function fetchMapboxRoute(
  coordinates: [number, number][]
): Promise<MapboxRoute | null> {
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token not configured');
    return null;
  }

  if (coordinates.length < 2) {
    console.error('Need at least 2 coordinates for a route');
    return null;
  }

  try {
    // Build coordinates string for Mapbox API
    const coordsString = coordinates
      .map(coord => `${coord[0]},${coord[1]}`)
      .join(';');

    // Fetch route from Mapbox Directions API
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error('No routes found');
      return null;
    }

    const route = data.routes[0];

    return {
      geometry: route.geometry,
      distance: route.distance,
      duration: route.duration,
      segments: route.legs || []
    };
  } catch (error) {
    console.error('Error fetching Mapbox route:', error);
    return null;
  }
}

/**
 * Calculate detour for adding a landmark to an existing route
 * @param routeCoordinates Original route coordinates [lng, lat]
 * @param landmarkCoord Landmark coordinate [lng, lat]
 * @param insertAfterIndex Index to insert landmark after
 * @returns Detour distance in km and time in minutes
 */
export async function calculateDetour(
  routeCoordinates: [number, number][],
  landmarkCoord: [number, number],
  insertAfterIndex: number
): Promise<{ detourKm: number; detourMinutes: number; newRoute: MapboxRoute | null }> {
  // Fetch original route
  const originalRoute = await fetchMapboxRoute(routeCoordinates);

  if (!originalRoute) {
    return { detourKm: 0, detourMinutes: 0, newRoute: null };
  }

  // Insert landmark into route
  const newCoordinates = [...routeCoordinates];
  newCoordinates.splice(insertAfterIndex + 1, 0, landmarkCoord);

  // Fetch new route with landmark
  const newRoute = await fetchMapboxRoute(newCoordinates);

  if (!newRoute) {
    return { detourKm: 0, detourMinutes: 0, newRoute: null };
  }

  // Calculate detour
  const detourMeters = newRoute.distance - originalRoute.distance;
  const detourSeconds = newRoute.duration - originalRoute.duration;

  return {
    detourKm: detourMeters / 1000,
    detourMinutes: detourSeconds / 60,
    newRoute
  };
}

/**
 * Find optimal position to insert a landmark with minimal detour
 * @param routeCoordinates Route coordinates [lng, lat]
 * @param landmarkCoord Landmark coordinate [lng, lat]
 * @returns Optimal index to insert after and detour info
 */
export async function findOptimalInsertPosition(
  routeCoordinates: [number, number][],
  landmarkCoord: [number, number]
): Promise<{
  insertAfterIndex: number;
  detourKm: number;
  detourMinutes: number;
  newRoute: MapboxRoute | null;
}> {
  let minDetour = Infinity;
  let optimalIndex = 0;
  let optimalRoute: MapboxRoute | null = null;
  let optimalDetourMinutes = 0;

  // Try inserting landmark at each position
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const result = await calculateDetour(routeCoordinates, landmarkCoord, i);

    if (result.detourKm < minDetour) {
      minDetour = result.detourKm;
      optimalIndex = i;
      optimalRoute = result.newRoute;
      optimalDetourMinutes = result.detourMinutes;
    }
  }

  return {
    insertAfterIndex: optimalIndex,
    detourKm: minDetour,
    detourMinutes: optimalDetourMinutes,
    newRoute: optimalRoute
  };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km < 1) {
    return `${Math.round(meters)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }
  return `${hours}h ${minutes}m`;
}
