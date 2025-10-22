import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SpotlightPageComplete } from './components/spotlight/SpotlightPageComplete'
import { useSpotlightStore } from './stores/spotlightStore'
import { useRouteDataStore } from './stores/routeDataStore'
import type { Waypoint } from './types'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Function to extract waypoints from route data (same logic as old spotlight.js)
function extractWaypoints(routeData: any): Waypoint[] {
  if (!routeData?.agentResults?.length) return []

  const waypoints: Waypoint[] = []

  routeData.agentResults.forEach((agentResult: any) => {
    try {
      let cleanedRecommendations = agentResult.recommendations
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim()

      let parsed
      try {
        parsed = JSON.parse(cleanedRecommendations)
      } catch (jsonError) {
        // Extract location names from the text
        const locationMatches = cleanedRecommendations.match(/"name":\s*"([^"]+)"/g) ||
          cleanedRecommendations.match(/\*\*([^*]+)\*\*/g) ||
          cleanedRecommendations.match(/(\w+(?:\s+\w+)*),\s*\w+/g)

        if (locationMatches && locationMatches.length > 0) {
          locationMatches.slice(0, 3).forEach((match: string) => {
            let name = match.replace(/["*]/g, '').replace(/name:\s*/g, '').trim()
            if (name.length > 0) {
              waypoints.push({
                id: `city-${waypoints.length + 1}`,
                name: extractCityName(name),
                order: waypoints.length,
                activities: ['Explore the city', 'Try local cuisine', 'Visit landmarks'],
                coordinates: { lat: 44.0 + Math.random() * 6.0, lng: 2.0 + Math.random() * 8.0 },
              })
            }
          })
        }
        return
      }

      // If we have parsed JSON with waypoints
      if (parsed && parsed.waypoints && Array.isArray(parsed.waypoints)) {
        parsed.waypoints.forEach((waypoint: any) => {
          if (waypoint.name) {
            waypoints.push({
              id: `city-${waypoints.length + 1}`,
              name: extractCityName(waypoint.name),
              order: waypoints.length,
              activities: waypoint.activities || ['Explore the city', 'Try local cuisine'],
              imageUrl: waypoint.imageUrl,
              coordinates: waypoint.coordinates
                ? { lat: waypoint.coordinates[1], lng: waypoint.coordinates[0] }
                : { lat: 44.0 + Math.random() * 6.0, lng: 2.0 + Math.random() * 8.0 },
            })
          }
        })
      }
    } catch (error) {
      console.error('Error extracting waypoints for agent:', agentResult.agent, error)
    }
  })

  // Ensure we have at least as many waypoints as requested
  const targetWaypoints = routeData?.totalStops || 3
  while (waypoints.length < targetWaypoints) {
    waypoints.push({
      id: `city-${waypoints.length + 1}`,
      name: `Stop ${waypoints.length + 1}`,
      order: waypoints.length,
      activities: ['Explore the area', 'Discover local attractions'],
      coordinates: { lat: 44.0 + Math.random() * 6.0, lng: 2.0 + Math.random() * 8.0 },
    })
  }

  return waypoints.slice(0, targetWaypoints)
}

function extractCityName(locationName: string): string {
  const patterns = [
    /^([^,]+),/,
    /^([^-]+)-/,
    /^([^(]+)\(/,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
  ]

  for (const pattern of patterns) {
    const match = locationName.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  const words = locationName.split(/\s+/)
  return words.slice(0, Math.min(3, words.length)).join(' ').trim()
}

function AppContent() {
  const { setWaypoints } = useSpotlightStore()
  const { loadFromLocalStorage, routeData } = useRouteDataStore()

  useEffect(() => {
    console.log('AppContent mounted, loading from localStorage...')
    // Load route data from localStorage
    loadFromLocalStorage()
  }, [loadFromLocalStorage])

  useEffect(() => {
    console.log('Route data changed:', routeData);
    if (routeData) {
      let waypointsToSet: Waypoint[] = [];
      if (routeData.waypoints && routeData.waypoints.length > 0) {
        console.log('Using pre-extracted waypoints:', routeData.waypoints);
        waypointsToSet = routeData.waypoints.map((wp: any, index: number) => ({
          id: wp.id || `waypoint-${index}`,
          name: wp.name,
          order: index,
          activities: wp.activities || [],
          coordinates: Array.isArray(wp.coordinates)
            ? { lng: wp.coordinates[0], lat: wp.coordinates[1] }
            : wp.coordinates,
        }));
      } else {
        console.log('Extracting waypoints from route data...');
        waypointsToSet = extractWaypoints(routeData);
      }
      
      console.log('Setting waypoints:', waypointsToSet);
      setWaypoints(waypointsToSet);

    } else {
      console.warn('No route data available in localStorage!');
    }
  }, [routeData, setWaypoints]);

  return <SpotlightPageComplete />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
