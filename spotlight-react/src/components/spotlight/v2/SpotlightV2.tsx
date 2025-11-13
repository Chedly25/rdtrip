import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSpotlightStoreV2, type SpotlightRoute, type CityData } from '../../../stores/spotlightStoreV2';
import MapViewV2 from './MapViewV2';
import FloatingCityCards from './FloatingCityCards';
import SpotlightHeader from './SpotlightHeader';
import { Loader2 } from 'lucide-react';

const SpotlightV2 = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    route,
    setRoute,
    setIsLoadingRoute,
    getCityName,
    getAgentColors
  } = useSpotlightStoreV2();

  useEffect(() => {
    loadRouteData();
  }, [routeId]);

  const loadRouteData = async () => {
    try {
      setIsLoadingRoute(true);
      setIsLoading(true);

      // First check localStorage for spotlight data (from landing page)
      const spotlightDataStr = localStorage.getItem('spotlightData');

      if (spotlightDataStr) {
        const spotlightData = JSON.parse(spotlightDataStr);
        console.log('📍 Loading Spotlight data from localStorage:', spotlightData);

        // Transform the data into our SpotlightRoute format
        const transformedRoute = transformLandingDataToRoute(spotlightData);
        setRoute(transformedRoute);
        setIsLoading(false);
        return;
      }

      // If no localStorage data and we have a routeId, fetch from backend
      if (routeId) {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/routes/${routeId}`);

        if (!response.ok) {
          throw new Error('Failed to load route');
        }

        const routeData = await response.json();
        const transformedRoute = transformBackendDataToRoute(routeData);
        setRoute(transformedRoute);
      } else {
        setError('No route data found. Please generate a route from the landing page first.');
      }
    } catch (err) {
      console.error('Error loading route:', err);
      setError(err instanceof Error ? err.message : 'Failed to load route data');
    } finally {
      setIsLoading(false);
      setIsLoadingRoute(false);
    }
  };

  // Transform landing page data to SpotlightRoute format
  const transformLandingDataToRoute = (data: any): SpotlightRoute => {
    console.log('🔍 Transforming data:', data);
    const cities: CityData[] = [];
    const cityDataMap = new Map<string, any>();

    // Find the specific agent's recommendations
    let agentWaypoints: any[] = [];
    const selectedAgent = data.agent || 'best-overall';
    console.log('🎯 Selected agent:', selectedAgent);

    if (data.agentResults && Array.isArray(data.agentResults)) {
      const agentResult = data.agentResults.find((result: any) => result.agent === selectedAgent);
      console.log('📊 Agent result found:', agentResult?.agent);

      if (agentResult && agentResult.recommendations) {
        try {
          const recommendations = typeof agentResult.recommendations === 'string'
            ? JSON.parse(agentResult.recommendations)
            : agentResult.recommendations;

          console.log('📦 Parsed recommendations:', recommendations);

          if (recommendations.waypoints && Array.isArray(recommendations.waypoints)) {
            agentWaypoints = recommendations.waypoints;
            console.log('✅ Found agent waypoints:', agentWaypoints.map((w: any) => w.city));

            // Build cityDataMap from agent's waypoints
            agentWaypoints.forEach((waypoint: any) => {
              const cityName = getCityName(waypoint.city || waypoint.name || waypoint);
              if (!cityDataMap.has(cityName)) {
                cityDataMap.set(cityName, waypoint);
              }
            });
          }
        } catch (err) {
          console.error('❌ Failed to parse agent recommendations:', err);
        }
      }
    }

    // Fallback: check global waypoints if agent waypoints not found
    if (agentWaypoints.length === 0 && data.waypoints && Array.isArray(data.waypoints)) {
      console.log('⚠️ Using global waypoints as fallback');
      agentWaypoints = data.waypoints;
      agentWaypoints.forEach((waypoint: any) => {
        const cityName = getCityName(waypoint.name || waypoint.city || waypoint);
        if (!cityDataMap.has(cityName)) {
          cityDataMap.set(cityName, waypoint);
        }
      });
    }

    console.log('📍 City data map size:', cityDataMap.size, 'entries:', Array.from(cityDataMap.keys()));

    // Build ordered cities from agent's waypoints
    let orderedCities: string[] = [];

    if (agentWaypoints.length > 0) {
      // Use agent-specific waypoints
      orderedCities = [
        getCityName(data.origin),
        ...agentWaypoints.map((w: any) => getCityName(w.city || w.name || w)),
        getCityName(data.destination)
      ];
      console.log('✅ Using agent waypoints:', orderedCities);
    } else {
      // Last fallback: just origin and destination
      orderedCities = [getCityName(data.origin), getCityName(data.destination)];
      console.log('⚠️ Using origin/destination only:', orderedCities);
    }

    console.log('🏙️ Processing cities in order:', orderedCities);

    if (orderedCities.length > 0) {
      orderedCities.forEach((cityName: string) => {
        console.log(`  🌆 ${cityName}`);

        // Get city data from cityDataMap (built from agent's waypoints)
        let cityData = cityDataMap.get(cityName);
        let coordinates = { lat: 0, lng: 0 };

        // Try to get coordinates from origin/destination first
        if (cityName === getCityName(data.origin)) {
          coordinates = extractCoordinates(data.origin);
          console.log(`    ✅ Using origin coordinates:`, coordinates);
        } else if (cityName === getCityName(data.destination)) {
          coordinates = extractCoordinates(data.destination);
          console.log(`    ✅ Using destination coordinates:`, coordinates);
        } else if (cityData) {
          // Check if cityData has coordinates directly (from agent recommendations)
          if (cityData.coordinates) {
            coordinates = extractCoordinates(cityData);
            console.log(`    ✅ Using agent waypoint coordinates:`, coordinates);
          } else {
            coordinates = extractCoordinates(cityData.city || cityData);
            console.log(`    ✅ Using cityData coordinates:`, coordinates);
          }
        } else {
          console.log(`    ⚠️ No coordinates found for ${cityName}`);
        }

        // Get nights from nightAllocations or agent's waypoint data
        let nights = data.nightAllocations?.[cityName] || 0;

        // If not in nightAllocations, check the agent's waypoint data
        if (!nights && cityData?.nights) {
          nights = cityData.nights;
        }

        // Fallback to recommended_min_nights or default to 1
        if (!nights && cityData?.recommended_min_nights) {
          nights = cityData.recommended_min_nights;
        }

        // Default to 1 night for waypoints, 0 for origin/destination
        if (!nights) {
          if (cityName === getCityName(data.origin) || cityName === getCityName(data.destination)) {
            nights = 0;
          } else {
            nights = 1; // Default for waypoints
          }
        }

        console.log(`    Nights: ${nights}, Coordinates: [${coordinates.lat}, ${coordinates.lng}]`);

        // Normalize city data structure - waypoints have `city` property, but we need `name`
        const normalizedCityData = cityData ? {
          name: cityData.city || cityData.name || cityName,
          country: cityData.country || '',
          coordinates: cityData.coordinates || coordinates,
          ...cityData
        } : { name: cityName, country: '', coordinates };

        cities.push({
          city: normalizedCityData,
          coordinates,
          nights: nights,
          activities: cityData?.activities || [],
          restaurants: cityData?.restaurants || [],
          accommodation: cityData?.accommodation || [],
          practicalInfo: cityData?.practicalInfo,
          weather: cityData?.weather,
          events: cityData?.events || [],
          agentData: {}
        });
      });

      console.log('✅ Final cities array:', cities.length, 'cities');
      cities.forEach((city, i) => {
        console.log(`  ${i + 1}. ${getCityName(city.city)} - ${city.nights} nights - coords: [${city.coordinates.lat}, ${city.coordinates.lng}]`);
      });
    }

    // Validation: ensure we have at least some cities
    if (cities.length === 0) {
      console.error('❌ No cities found! Check routePlan.cities, waypoints, and origin/destination');
    }

    return {
      id: data.id || routeId,
      origin: data.origin,
      destination: data.destination,
      budget: data.budget,
      agent: data.agent || 'best-overall',
      cities,
      landmarks: [],
      nightAllocations: data.nightAllocations || {},
      agentResults: data.agentResults || []
    };
  };

  // Transform backend saved route to SpotlightRoute format
  const transformBackendDataToRoute = (data: any): SpotlightRoute => {
    // Similar transformation logic for backend data
    return transformLandingDataToRoute(data);
  };

  // Helper to extract coordinates from city data
  const extractCoordinates = (city: any): { lat: number; lng: number } => {
    if (typeof city === 'string') {
      return { lat: 0, lng: 0 }; // Will need to geocode
    }

    // Handle direct coordinates property
    const coords = city.coordinates || city;

    // If coordinates is an array [lat, lng]
    if (Array.isArray(coords)) {
      return {
        lat: typeof coords[0] === 'number' ? coords[0] : 0,
        lng: typeof coords[1] === 'number' ? coords[1] : 0
      };
    }

    // If coordinates is an object {lat, lng}
    if (coords && typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
      return {
        lat: typeof coords.lat === 'number' ? coords.lat : 0,
        lng: typeof coords.lng === 'number' ? coords.lng : 0
      };
    }

    return { lat: 0, lng: 0 };
  };

  const agentColors = getAgentColors();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: agentColors.accent }} />
          <p className="text-gray-900 text-lg">Loading your route...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!route) {
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 relative">
      {/* Header */}
      <SpotlightHeader />

      {/* Map - Fullscreen hero element */}
      <MapViewV2 />

      {/* Floating City Cards - Bottom overlay */}
      <FloatingCityCards />

      {/* Background gradient overlay for visual polish */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${agentColors.primary}05 0%, transparent 50%)`
        }}
      />
    </div>
  );
};

export default SpotlightV2;
