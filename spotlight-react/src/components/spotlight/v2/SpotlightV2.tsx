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
    const cities: CityData[] = [];

    // Add origin if it has data
    if (data.origin) {
      cities.push({
        city: data.origin,
        coordinates: extractCoordinates(data.origin),
        nights: data.nightAllocations?.[getCityName(data.origin)] || 0,
        agentData: {}
      });
    }

    // Add intermediate cities from agentResults
    if (data.agentResults && Array.isArray(data.agentResults)) {
      data.agentResults.forEach((result: any) => {
        if (result.cities && Array.isArray(result.cities)) {
          result.cities.forEach((cityData: any) => {
            const cityName = getCityName(cityData.city || cityData.name);

            // Skip if it's origin or destination
            if (cityName === getCityName(data.origin) || cityName === getCityName(data.destination)) {
              return;
            }

            // Check if city already exists
            const existingCity = cities.find(c => getCityName(c.city) === cityName);

            if (!existingCity) {
              cities.push({
                city: cityData.city || cityData.name,
                coordinates: extractCoordinates(cityData.city || cityData),
                nights: data.nightAllocations?.[cityName] || cityData.nights || 0,
                activities: cityData.activities || [],
                restaurants: cityData.restaurants || [],
                accommodation: cityData.accommodation || [],
                practicalInfo: cityData.practicalInfo,
                weather: cityData.weather,
                events: cityData.events || [],
                agentData: {
                  [result.agent]: result
                }
              });
            } else {
              // Merge agent data
              existingCity.agentData = {
                ...existingCity.agentData,
                [result.agent]: result
              };
            }
          });
        }
      });
    }

    // Add destination if it has data
    if (data.destination) {
      const destName = getCityName(data.destination);
      const existingDest = cities.find(c => getCityName(c.city) === destName);

      if (!existingDest) {
        cities.push({
          city: data.destination,
          coordinates: extractCoordinates(data.destination),
          nights: data.nightAllocations?.[destName] || 0,
          agentData: {}
        });
      }
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
  const extractCoordinates = (city: any) => {
    if (typeof city === 'string') {
      return { lat: 0, lng: 0 }; // Will need to geocode
    }
    return city.coordinates || { lat: 0, lng: 0 };
  };

  const agentColors = getAgentColors();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: agentColors.accent }} />
          <p className="text-white text-lg">Loading your route...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-4">
            <p className="text-red-400 text-lg mb-4">{error}</p>
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
    <div className="h-screen w-screen overflow-hidden bg-slate-900 relative">
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
          background: `radial-gradient(circle at 50% 0%, ${agentColors.primary}08 0%, transparent 50%)`
        }}
      />
    </div>
  );
};

export default SpotlightV2;
