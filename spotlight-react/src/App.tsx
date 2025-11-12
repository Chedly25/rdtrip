import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router } from 'react-router-dom'
import SpotlightV2 from './components/spotlight/v2/SpotlightV2'
import { useSpotlightStore } from './stores/spotlightStore'
import { useRouteDataStore } from './stores/routeDataStore'
import { enrichCityData } from './services/cityEnrichment'
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

// Geocode a city name to coordinates using Google Places API via backend
async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number }> {
  try {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cityName }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.coordinates
    }

    throw new Error(`Geocoding request failed: ${response.status}`)
  } catch (error) {
    console.error(`Geocoding failed for ${cityName}:`, error)
    // Return a fallback coordinate (center of France)
    return { lat: 46.603354, lng: 1.888334 }
  }
}

// Function to extract waypoints from route data (same logic as old spotlight.js)
function extractWaypoints(routeData: any): Waypoint[] {
  console.log('🔍 extractWaypoints called with routeData:', {
    hasAgentResults: !!routeData?.agentResults,
    agentResultsLength: routeData?.agentResults?.length || 0,
    agentTypes: routeData?.agentResults?.map((ar: any) => ar.agent),
    routeAgent: routeData?.agent
  });

  if (!routeData?.agentResults?.length) {
    console.warn('❌ No agentResults found in routeData');
    return [];
  }

  const waypoints: Waypoint[] = []

  routeData.agentResults.forEach((agentResult: any, index: number) => {
    console.log(`\n📊 Processing agent result #${index}:`, {
      agent: agentResult.agent,
      recommendationsLength: agentResult.recommendations?.length || 0
    });

    try {
      // Check if recommendations exist and are a string
      if (!agentResult.recommendations || typeof agentResult.recommendations !== 'string') {
        console.warn(`⚠️ Invalid recommendations for agent ${agentResult.agent}:`, agentResult.recommendations);
        return;
      }

      let cleanedRecommendations = agentResult.recommendations
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim()

      let parsed
      try {
        parsed = JSON.parse(cleanedRecommendations)
        console.log(`  ✅ Successfully parsed JSON for agent: ${agentResult.agent}`, {
          hasWaypoints: !!parsed.waypoints,
          waypointsLength: parsed.waypoints?.length || 0
        });
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
        console.log(`📍 [${agentResult.agent}] Parsing ${parsed.waypoints.length} waypoints`);
        parsed.waypoints.forEach((waypoint: any, idx: number) => {
          if (waypoint.name) {
            console.log(`  [${idx}] ${waypoint.name}:`, {
              hasLatitude: !!waypoint.latitude,
              hasLongitude: !!waypoint.longitude,
              latValue: waypoint.latitude,
              lngValue: waypoint.longitude,
              hasCoordinates: !!waypoint.coordinates,
              coordinatesType: Array.isArray(waypoint.coordinates) ? 'array' : typeof waypoint.coordinates
            });

            // Handle coordinates from backend (latitude, longitude fields)
            let coords;
            if (waypoint.latitude && waypoint.longitude) {
              coords = { lat: waypoint.latitude, lng: waypoint.longitude };
              console.log(`    ✅ Using lat/lng fields → lat=${coords.lat}, lng=${coords.lng}`);
            } else if (waypoint.coordinates && Array.isArray(waypoint.coordinates)) {
              // Fallback for old array format [lng, lat]
              coords = { lat: waypoint.coordinates[1], lng: waypoint.coordinates[0] };
              console.log(`    ⚠️ Using array format → lat=${coords.lat}, lng=${coords.lng}`);
            } else if (waypoint.coordinates && waypoint.coordinates.lat && waypoint.coordinates.lng) {
              // Already in correct format
              coords = waypoint.coordinates;
              console.log(`    ✅ Using object format → lat=${coords.lat}, lng=${coords.lng}`);
            } else {
              // Random fallback
              coords = { lat: 44.0 + Math.random() * 6.0, lng: 2.0 + Math.random() * 8.0 };
              console.log(`    ❌ NO COORDINATES! Using random → lat=${coords.lat}, lng=${coords.lng}`);
            }

            waypoints.push({
              id: `city-${waypoints.length + 1}`,
              name: extractCityName(waypoint.name),
              order: waypoints.length,
              activities: waypoint.activities || ['Explore the city', 'Try local cuisine'],
              imageUrl: waypoint.imageUrl,
              coordinates: coords,
            })
          }
        })
      }
    } catch (error) {
      console.error('Error extracting waypoints for agent:', agentResult.agent, error)
    }
  })

  // Ensure we have at least some waypoints (fallback)
  // Note: With nights-based system, waypoints come from backend route planning
  const minWaypoints = 3
  while (waypoints.length < minWaypoints) {
    waypoints.push({
      id: `city-${waypoints.length + 1}`,
      name: `City ${waypoints.length + 1}`,
      order: waypoints.length,
      activities: ['Explore the area', 'Discover local attractions'],
      coordinates: { lat: 44.0 + Math.random() * 6.0, lng: 2.0 + Math.random() * 8.0 },
    })
  }

  // Return all waypoints (backend determines optimal number based on totalNights + tripPace)
  return waypoints
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

        // PRIORITY 1: Check if agentResults have modified waypoints in recommendations
        if (routeData.agentResults && routeData.agentResults.length > 0) {
          const agentResult = routeData.agentResults[0];
          if (agentResult.recommendations && typeof agentResult.recommendations === 'string') {
            try {
              const parsed = JSON.parse(agentResult.recommendations);
              // Check if this agent result has modified waypoints (from RouteResults customization)
              if (parsed.modified && parsed.waypoints && parsed.waypoints.length > 0) {
                console.log('✅ Using MODIFIED waypoints from recommendations:', parsed.waypoints);
                waypointsToSet = parsed.waypoints.map((wp: any, index: number) => {
                  // Handle multiple coordinate formats
                  let coords;
                  if (wp.latitude && wp.longitude) {
                    // Backend format: latitude/longitude fields
                    coords = { lat: wp.latitude, lng: wp.longitude };
                  } else if (Array.isArray(wp.coordinates)) {
                    // Array format: [lat, lng] - our geocoding returns this
                    coords = { lat: wp.coordinates[0], lng: wp.coordinates[1] };
                  } else if (wp.coordinates && typeof wp.coordinates === 'object') {
                    // Object format: {lat, lng}
                    coords = wp.coordinates;
                  } else {
                    // No coordinates found
                    coords = undefined;
                  }

                  return {
                    id: wp.id || `waypoint-${index}`,
                    name: wp.name,
                    order: index,
                    activities: wp.activities || [],
                    coordinates: coords,
                    description: wp.description,
                    imageUrl: wp.imageUrl || wp.image,
                    themes: wp.themes,
                  };
                });
              }
            } catch (e) {
              console.warn('Could not parse recommendations for modified waypoints:', e);
            }
          }
        }

        // PRIORITY 2: Check for top-level waypoints (backwards compatibility)
        if (waypointsToSet.length === 0 && routeData.waypoints && routeData.waypoints.length > 0) {
          console.log('Using pre-extracted waypoints:', routeData.waypoints);
          waypointsToSet = routeData.waypoints.map((wp: any, index: number) => ({
            id: wp.id || `waypoint-${index}`,
            name: wp.name,
            order: index,
            activities: wp.activities || [],
            coordinates: Array.isArray(wp.coordinates)
              ? { lat: wp.coordinates[0], lng: wp.coordinates[1] }
              : wp.coordinates,
          }));
        }

        // PRIORITY 3: Extract from route data if nothing found above
        if (waypointsToSet.length === 0) {
          console.log('Extracting waypoints from route data...');
          console.log('Calling extractWaypoints with:', routeData);
          waypointsToSet = extractWaypoints(routeData);
          console.log('extractWaypoints returned:', waypointsToSet);
        }

        // Add origin and destination if they exist
        const finalWaypoints: Waypoint[] = [];

        // Check if origin is already in waypoints (to avoid duplication)
        const hasOrigin = waypointsToSet.some(wp =>
          wp.name === routeData.origin || wp.id === 'origin'
        );

        // Add origin as first waypoint only if not already present
        if (routeData.origin && !hasOrigin) {
          console.log('Adding origin:', routeData.origin);

          // CRITICAL FIX: Use coordinates from backend if available (already swap-corrected)
          let originCoords;

          // Check if backend sent origin object with coordinates
          const agentResult = routeData.agentResults && routeData.agentResults[0];
          if (agentResult && agentResult.recommendations && typeof agentResult.recommendations === 'string') {
            try {
              const parsed = JSON.parse(agentResult.recommendations);
              if (parsed.origin && parsed.origin.latitude && parsed.origin.longitude) {
                originCoords = { lat: parsed.origin.latitude, lng: parsed.origin.longitude };
                console.log(`✅ Using backend coordinates for origin: lat=${originCoords.lat}, lng=${originCoords.lng}`);
              }
            } catch (e) {
              console.warn('Could not parse origin coordinates from backend:', e);
            }
          }

          // Fallback: geocode if no backend coordinates
          if (!originCoords) {
            try {
              console.log('⚠️ No backend coordinates for origin, geocoding...');
              originCoords = await geocodeCity(routeData.origin);
            } catch (error) {
              console.error('Failed to geocode origin:', error);
              originCoords = { lat: 43.5297, lng: 5.4474 }; // Default Aix-en-Provence
            }
          }

          finalWaypoints.push({
            id: 'origin',
            name: routeData.origin,
            order: 0,
            activities: ['Starting point'],
            coordinates: originCoords,
          });
        }

        // Add intermediate waypoints
        waypointsToSet.forEach((wp) => {
          finalWaypoints.push({
            ...wp,
            order: finalWaypoints.length,
          });
        });

        // Check if destination is already in waypoints (to avoid duplication)
        const hasDestination = waypointsToSet.some(wp =>
          wp.name === routeData.destination || wp.id === 'destination'
        );

        // Add destination as last waypoint only if not already present
        if (routeData.destination && !hasDestination) {
          console.log('Adding destination:', routeData.destination);

          // CRITICAL FIX: Use coordinates from backend if available (already swap-corrected)
          let destCoords;

          // Check if backend sent destination object with coordinates
          const agentResult = routeData.agentResults && routeData.agentResults[0];
          if (agentResult && agentResult.recommendations && typeof agentResult.recommendations === 'string') {
            try {
              const parsed = JSON.parse(agentResult.recommendations);
              if (parsed.destination && parsed.destination.latitude && parsed.destination.longitude) {
                destCoords = { lat: parsed.destination.latitude, lng: parsed.destination.longitude };
                console.log(`✅ Using backend coordinates for destination: lat=${destCoords.lat}, lng=${destCoords.lng}`);
              }
            } catch (e) {
              console.warn('Could not parse destination coordinates from backend:', e);
            }
          }

          // Fallback: geocode if no backend coordinates
          if (!destCoords) {
            try {
              console.log('⚠️ No backend coordinates for destination, geocoding...');
              destCoords = await geocodeCity(routeData.destination);
            } catch (error) {
              console.error('Failed to geocode destination:', error);
              destCoords = { lat: 48.8566, lng: 2.3522 }; // Default Paris
            }
          }

          finalWaypoints.push({
            id: 'destination',
            name: routeData.destination,
            order: finalWaypoints.length,
            activities: ['Final destination'],
            coordinates: destCoords,
          });
        }

        console.log('Final waypoints with origin and destination:', finalWaypoints);
        setWaypoints(finalWaypoints);

        // Store original cities (non-landmarks) for route optimization
        const cities = finalWaypoints.filter((wp) => !wp.isLandmark)
        setOriginalCities(cities)
        console.log('Stored original cities for optimization:', cities.length)

        // Fetch Wikipedia images and enrich activities for all waypoints asynchronously
        finalWaypoints.forEach(async (wp) => {
          const cityName = wp.name || wp.city
          if (!cityName) {
            console.warn('Cannot enrich waypoint without name:', wp)
            return
          }

          // Check if waypoint needs enrichment (has generic/placeholder activities)
          const needsEnrichment = !wp.activities ||
            wp.activities.length === 0 ||
            wp.activities.some((activity: string) =>
              activity === 'Starting point' ||
              activity === 'Final destination' ||
              activity === 'Explore the city' ||
              activity === 'Try local cuisine' ||
              activity === 'Visit landmarks'
            )

          // Enrich city data (activities + image) if needed
          if (needsEnrichment || !wp.imageUrl) {
            console.log(`🔄 Enriching ${cityName}...`)
            try {
              const { activities, imageUrl } = await enrichCityData(cityName)

              const updates: Partial<Waypoint> = {}

              // Update activities if we got good ones back
              if (Array.isArray(activities) && activities.length > 0 && needsEnrichment) {
                updates.activities = activities
                console.log(`✅ Updated activities for ${cityName}:`, activities)
              }

              // Update image if we got one back
              if (imageUrl && !wp.imageUrl) {
                updates.imageUrl = imageUrl
                console.log(`✅ Updated image for ${cityName}`)
              }

              // Apply updates if we have any
              if (Object.keys(updates).length > 0) {
                updateWaypoint(wp.id, updates)
              }
            } catch (error) {
              console.error(`❌ Failed to enrich ${cityName}:`, error)
            }
          }
        })
      };

      processWaypoints();
    } else {
      console.warn('No route data available in localStorage!');
    }
  }, [routeData, setWaypoints, setOriginalCities, updateWaypoint]);

  // Note: Old spotlight enrichment logic is preserved above but not used by SpotlightV2
  // SpotlightV2 handles data loading from localStorage directly
  return <SpotlightV2 />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  )
}

export default App
