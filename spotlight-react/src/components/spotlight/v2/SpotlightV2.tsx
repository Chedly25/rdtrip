import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpotlightStoreV2, type SpotlightRoute, type CityData } from '../../../stores/spotlightStoreV2';
import MapViewV2 from './MapViewV2';
import { BottomSheet } from '../v3/BottomSheet';
import { CityDetailModal } from '../v3/CityDetailModal';
import { SaveRouteModal } from '../v3/SaveRouteModal';
import SpotlightHeader from './SpotlightHeader';
import { ItineraryView } from '../../itinerary/ItineraryView';
import { Loader2, Users } from 'lucide-react';
import { CollaborationPanel } from '../../collaboration/CollaborationPanel';
import { CompanionPanel, CompanionTab, ProactiveBubble } from '../../companion/CompanionPanel';
import { useCompanion } from '../../../contexts/CompanionProvider';
import { useAgent } from '../../../contexts/AgentProvider';

const SpotlightV2 = () => {
  // Get routeId from query params (?routeId=123) not path params
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('routeId');
  const itineraryId = searchParams.get('itinerary');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [cityDetailIndex, setCityDetailIndex] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Companion state
  const {
    isPanelExpanded,
    togglePanel,
    showProactiveBubble,
    currentSuggestion,
    dismissSuggestion,
    acceptSuggestion,
    hasUnreadMessages,
  } = useCompanion();

  const { sendMessage } = useAgent();

  const {
    route,
    setRoute,
    setIsLoadingRoute,
    getCityName,
    getAgentColors
  } = useSpotlightStoreV2();

  useEffect(() => {
    // Skip loading route data if we're viewing an itinerary
    // ItineraryView loads its own data independently
    if (!itineraryId) {
      loadRouteData();
    } else {
      setIsLoading(false);
    }
  }, [routeId, itineraryId]);

  const loadRouteData = async () => {
    try {
      setIsLoadingRoute(true);
      setIsLoading(true);

      // PRIORITY 1: If we have a routeId in URL, fetch from backend (saved route with landmarks)
      if (routeId) {
        // Get auth token from localStorage
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('🔐 Fetching route with authentication:', routeId);
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/routes/${routeId}`, {
          headers
        });

        if (!response.ok) {
          // If route not found or unauthorized, fall back to localStorage
          // This handles cases where routeId is a timestamp (not a real DB ID)
          if (response.status === 404 || response.status === 401 || response.status === 403) {
            console.warn(`⚠️ Backend fetch failed (${response.status}), falling back to localStorage`);
            // Don't throw - let it fall through to localStorage fallback
          } else {
            throw new Error(`Failed to load route: ${response.status} ${response.statusText}`);
          }
        } else {
          // Success - route found in database
          const routeData = await response.json();
          console.log('📦 Fetched route data from backend:', routeData);
          const transformedRoute = transformBackendDataToRoute(routeData);
          setRoute(transformedRoute);
          return;
        }
      }

      // PRIORITY 2: No routeId OR backend fetch failed - fallback to localStorage (from landing page navigation)
      const spotlightDataStr = localStorage.getItem('spotlightData');
      if (spotlightDataStr) {
        const spotlightData = JSON.parse(spotlightDataStr);
        console.log('📍 Loading Spotlight data from localStorage:', spotlightData);
        const transformedRoute = transformLandingDataToRoute(spotlightData);
        setRoute(transformedRoute);
        return;
      }

      // No data found anywhere
      setError('No route data found. Please generate a route from the landing page first.');
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
          ...cityData,  // Spread first to get all properties
          name: cityData.city || cityData.name || cityName,  // Then override with correct values
          country: cityData.country || '',
          coordinates  // Use the extracted coordinates object (always {lat, lng})
        } : { name: cityName, country: '', coordinates };

        console.log(`    Normalized city data for ${cityName}:`, { name: normalizedCityData.name, coordinates: normalizedCityData.coordinates });

        cities.push({
          city: normalizedCityData,
          coordinates,  // Store coordinates at top level too
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
      landmarks: data.landmarks || [],  // Load landmarks from localStorage if they exist
      nightAllocations: data.nightAllocations || {},
      agentResults: data.agentResults || []
    };
  };

  // Transform backend saved route to SpotlightRoute format
  const transformBackendDataToRoute = (data: any): SpotlightRoute => {
    console.log('🔄 transformBackendDataToRoute received:', data);

    // Backend returns { route: { id, routeData, ... } }
    // Extract the route object and merge routeData into it
    const backendRoute = data.route || data;
    const routeData = backendRoute.routeData || {};

    console.log('📦 Extracted routeData:', routeData);
    console.log('📦 Landmarks in routeData:', routeData.landmarks?.length || 0);

    // Merge routeData fields into the main data for transformation
    const mergedData = {
      ...routeData,
      ...backendRoute,
      id: backendRoute.id,
      agent: backendRoute.selectedAgents || routeData.agent || 'best-overall'
    };

    // Call the transformation with the merged data
    const transformed = transformLandingDataToRoute(mergedData);

    // Preserve routeData for the store's setRoute to load landmarks
    transformed.routeData = routeData;

    console.log('✅ Transformed route with', transformed.landmarks?.length || 0, 'landmarks from initial transform');
    console.log('✅ RouteData attached with', transformed.routeData?.landmarks?.length || 0, 'landmarks for store loading');

    return transformed;
  };

  // Helper to extract coordinates from city data
  const extractCoordinates = (city: any): { lat: number; lng: number } => {
    if (typeof city === 'string') {
      return { lat: 0, lng: 0 }; // Will need to geocode
    }

    // Handle direct coordinates property
    const coords = city.coordinates || city;

    // DEBUG: Log the actual coordinate format
    if (city && city.city) {
      console.log(`🔍 extractCoordinates for ${getCityName(city.city)}:`, {
        isArray: Array.isArray(coords),
        isObject: coords && typeof coords === 'object',
        hasLatLng: coords && 'lat' in coords && 'lng' in coords,
        rawValue: coords
      });
    }

    // If coordinates is an array [lat, lng]
    if (Array.isArray(coords)) {
      console.log(`  → Treating as [lat, lng] array: [${coords[0]}, ${coords[1]}]`);
      return {
        lat: typeof coords[0] === 'number' ? coords[0] : 0,
        lng: typeof coords[1] === 'number' ? coords[1] : 0
      };
    }

    // If coordinates is an object {lat, lng}
    if (coords && typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
      console.log(`  → Treating as {lat, lng} object: lat=${coords.lat}, lng=${coords.lng}`);
      return {
        lat: typeof coords.lat === 'number' ? coords.lat : 0,
        lng: typeof coords.lng === 'number' ? coords.lng : 0
      };
    }

    return { lat: 0, lng: 0 };
  };

  const agentColors = getAgentColors();

  // Handler for Generate Itinerary button - navigate to full-screen experience
  const handleGenerateItinerary = () => {
    console.log('🎯 Navigating to itinerary generation');
    navigate(`/generate?routeId=${routeId}`);
  };

  // Handler for saving route
  const handleSaveRoute = async (name: string) => {
    if (!route) throw new Error('No route to save');

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please log in to save routes');
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        origin: route.origin,
        destination: route.destination,
        budget: route.budget,
        selectedAgents: route.agent,
        routeData: {
          cities: route.cities,
          landmarks: route.landmarks,
          nightAllocations: route.nightAllocations,
          agentResults: route.agentResults,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save route');
    }

    const savedRoute = await response.json();
    console.log('✅ Route saved:', savedRoute);

    // Update URL with new routeId
    if (savedRoute.route?.id) {
      navigate(`/spotlight-new/?routeId=${savedRoute.route.id}`, { replace: true });
    }
  };

  // If itinerary param exists, show ItineraryView instead of normal spotlight
  // Check this FIRST before loading/error states - ItineraryView loads its own data
  if (itineraryId) {
    return <ItineraryView itineraryId={itineraryId} routeData={route} />;
  }

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

  // Handle accepting a proactive suggestion
  const handleAcceptSuggestion = () => {
    if (currentSuggestion) {
      acceptSuggestion();
      sendMessage(currentSuggestion.prompt);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FFFBF5] relative flex">
      {/* Main Content Area - Takes remaining space when companion is open */}
      <div className={`flex-1 h-full relative transition-all duration-300 ${isPanelExpanded ? 'mr-0' : ''}`}>
        {/* Header */}
        <SpotlightHeader
          onGenerateItinerary={handleGenerateItinerary}
          onSave={() => setShowSaveModal(true)}
        />

        {/* Map - Fullscreen hero element */}
        <MapViewV2 />

        {/* Bottom Sheet - Apple Maps style */}
        <BottomSheet onCityDetailsClick={setCityDetailIndex} />
      </div>

      {/* Companion Panel - Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block h-full">
        <AnimatePresence mode="wait">
          {isPanelExpanded ? (
            <CompanionPanel
              key="companion-panel"
              isExpanded={isPanelExpanded}
              onToggleExpand={togglePanel}
            />
          ) : (
            <CompanionTab
              key="companion-tab"
              onClick={togglePanel}
              hasUnread={hasUnreadMessages}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Proactive Bubble - Shows when companion suggests something */}
      <AnimatePresence>
        {showProactiveBubble && currentSuggestion && (
          <ProactiveBubble
            message={currentSuggestion.message}
            onAccept={handleAcceptSuggestion}
            onDismiss={dismissSuggestion}
            priority={currentSuggestion.priority}
          />
        )}
      </AnimatePresence>

      {/* City Detail Modal */}
      <CityDetailModal
        cityIndex={cityDetailIndex}
        onClose={() => setCityDetailIndex(null)}
      />

      {/* Save Route Modal */}
      <SaveRouteModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveRoute}
      />

      {/* Collaborate Button - Fixed position */}
      {routeId && (
        <motion.button
          onClick={() => setShowCollaboration(!showCollaboration)}
          className="fixed top-20 left-4 z-50 bg-[#2C2417] hover:bg-[#3D3328] text-white rounded-xl px-4 py-2.5 shadow-lg transition-all duration-200 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Collaborate</span>
        </motion.button>
      )}

      {/* Collaboration Panel - Slide in from left (moved to avoid companion overlap) */}
      <AnimatePresence>
        {showCollaboration && routeId && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-96 z-50 shadow-2xl"
          >
            <CollaborationPanel
              routeId={routeId}
              currentUserId={localStorage.getItem('userId') || ''}
              onInviteClick={() => {/* TODO: Open invite modal */}}
              onClose={() => setShowCollaboration(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SpotlightV2;
