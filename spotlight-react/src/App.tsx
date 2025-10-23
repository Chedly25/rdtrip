import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SpotlightPageComplete } from './components/spotlight/SpotlightPageComplete'
import { useSpotlightStore } from './stores/spotlightStore'
import { useRouteDataStore } from './stores/routeDataStore'
import { getWikipediaImage } from './utils/wikipedia'
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

// Geocode a city name to coordinates using Mapbox Geocoding API
async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number }> {
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ'

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${MAPBOX_TOKEN}&types=place&limit=1`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng }
    }

    throw new Error(`No coordinates found for ${cityName}`)
  } catch (error) {
    console.error(`Geocoding failed for ${cityName}:`, error)
    // Return a fallback coordinate (center of France)
    return { lat: 46.603354, lng: 1.888334 }
  }
}

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
  const { setWaypoints, setOriginalCities, updateWaypoint } = useSpotlightStore()
  const { loadFromLocalStorage, routeData } = useRouteDataStore()

  useEffect(() => {
    console.log('AppContent mounted, loading from localStorage...')
    // Load route data from localStorage
    loadFromLocalStorage()
  }, [loadFromLocalStorage])

  useEffect(() => {
    console.log('Route data changed:', routeData);
    if (routeData) {
      // DEBUG: Log full structure
      console.log('Full routeData structure:', JSON.stringify(routeData, null, 2));
      console.log('routeData.waypoints:', routeData.waypoints);
      console.log('routeData.agentResults:', routeData.agentResults);
      console.log('routeData keys:', Object.keys(routeData));

      const processWaypoints = async () => {
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
          console.log('Calling extractWaypoints with:', routeData);
          waypointsToSet = extractWaypoints(routeData);
          console.log('extractWaypoints returned:', waypointsToSet);
        }

        // Add origin and destination if they exist
        const finalWaypoints: Waypoint[] = [];

        // Add origin as first waypoint
        if (routeData.origin) {
          console.log('Adding origin:', routeData.origin);
          try {
            const originCoords = await geocodeCity(routeData.origin);
            finalWaypoints.push({
              id: 'origin',
              name: routeData.origin,
              order: 0,
              activities: ['Starting point'],
              coordinates: originCoords,
            });
          } catch (error) {
            console.error('Failed to geocode origin:', error);
          }
        }

        // Add intermediate waypoints
        waypointsToSet.forEach((wp) => {
          finalWaypoints.push({
            ...wp,
            order: finalWaypoints.length,
          });
        });

        // Add destination as last waypoint
        if (routeData.destination) {
          console.log('Adding destination:', routeData.destination);
          try {
            const destCoords = await geocodeCity(routeData.destination);
            finalWaypoints.push({
              id: 'destination',
              name: routeData.destination,
              order: finalWaypoints.length,
              activities: ['Final destination'],
              coordinates: destCoords,
            });
          } catch (error) {
            console.error('Failed to geocode destination:', error);
          }
        }

        console.log('Final waypoints with origin and destination:', finalWaypoints);
        setWaypoints(finalWaypoints);

        // Store original cities (non-landmarks) for route optimization
        const cities = finalWaypoints.filter((wp) => !wp.isLandmark)
        setOriginalCities(cities)
        console.log('Stored original cities for optimization:', cities.length)

        // Fetch Wikipedia images for all waypoints asynchronously
        finalWaypoints.forEach(async (wp) => {
          if (!wp.imageUrl) {
            const imageUrl = await getWikipediaImage(wp.name, 800, 600)
            if (imageUrl) {
              // Update the waypoint with the fetched image
              updateWaypoint(wp.id, { imageUrl })
              console.log(`Fetched Wikipedia image for ${wp.name}:`, imageUrl)
            }
          }
        })
      };

      processWaypoints();
    } else {
      console.warn('No route data available in localStorage!');
    }
  }, [routeData, setWaypoints, setOriginalCities, updateWaypoint]);

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
