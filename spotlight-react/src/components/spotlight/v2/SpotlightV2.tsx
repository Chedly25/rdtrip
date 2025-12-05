import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpotlightStoreV2, type SpotlightRoute, type CityData } from '../../../stores/spotlightStoreV2';
import MapViewV2 from './MapViewV2';
import { BottomSheet } from '../v3/BottomSheet';
import { CityDetailModal } from '../v3/CityDetailModal';
import { SaveRouteModal } from '../v3/SaveRouteModal';
import SpotlightHeader from './SpotlightHeader';
import { EditorialItineraryPanel } from '../../itinerary/editorial';
import { CommandBar } from './CommandBar';
import { CityReplacementSheet } from './CityReplacementSheet';
import { ConstraintChangeSheet } from './ConstraintChangeSheet';
import { TripActivation } from '../../trip/TripActivation';
import { LiveTripPanel } from '../../trip/LiveTripPanel';
import { Loader2, CalendarDays, Command, Clock, Plane } from 'lucide-react';
import { CollaborationPanel } from '../../collaboration/CollaborationPanel';
import { CompanionPanel, CompanionTab, ProactiveBubble, MobileCompanionDrawer } from '../../companion/CompanionPanel';
import { useCompanion } from '../../../contexts/CompanionProvider';
import { useAgent } from '../../../contexts/AgentProvider';
import { getStoredItineraryId } from '../../../hooks/useItineraryGeneration';
import { PersonalizedIntroBanner } from './PersonalizedIntroBanner';
import { FeatureTour, MarketplacePrompt } from '../../onboarding';

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
  const [mobileCompanionOpen, setMobileCompanionOpen] = useState(false);
  const [showItineraryPanel, setShowItineraryPanel] = useState(false);
  const [hasStoredItinerary, setHasStoredItinerary] = useState(false);
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [replacementSheet, setReplacementSheet] = useState<{
    isOpen: boolean;
    cityIndex: number;
    cityName: string;
  }>({ isOpen: false, cityIndex: -1, cityName: '' });
  const [constraintSheet, setConstraintSheet] = useState<{
    isOpen: boolean;
    type: 'duration' | 'budget' | 'travelers' | 'dates';
  }>({ isOpen: false, type: 'duration' });
  const [showTripActivation, setShowTripActivation] = useState(false);
  const [showLiveTripPanel, setShowLiveTripPanel] = useState(false);

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
    getAgentColors,
    tripMode,
    startTrip,
  } = useSpotlightStoreV2();

  useEffect(() => {
    // Always load route data - we need it for the Spotlight view
    loadRouteData();
  }, [routeId]);

  // Check for stored itinerary on mount AND handle URL param migration
  useEffect(() => {
    // If there's an ?itinerary= URL param, migrate it to localStorage and clean URL
    if (itineraryId) {
      console.log(`🔄 Migrating itinerary ID from URL to localStorage: ${itineraryId}`);
      // Store in localStorage
      try {
        localStorage.setItem('spotlight_itinerary_id', JSON.stringify({
          itineraryId: itineraryId,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to store itinerary ID:', e);
      }

      // Clean the URL - remove the itinerary param but keep routeId if present
      const newUrl = routeId
        ? `${window.location.pathname}?routeId=${routeId}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);

      // Set hasStoredItinerary and auto-open panel
      setHasStoredItinerary(true);
      setShowItineraryPanel(true);
      return;
    }

    // Otherwise just check localStorage
    const storedId = getStoredItineraryId();
    setHasStoredItinerary(!!storedId);
    console.log('📋 Stored itinerary check:', storedId ? `Found: ${storedId}` : 'None found');
  }, [itineraryId, routeId]);

  // Cmd+K keyboard shortcut for command bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle command bar actions
  const handleCommandAction = (action: {
    type: 'remove' | 'replace' | 'add' | 'reorder' | 'nights' | 'custom';
    cityIndex?: number;
    cityName?: string;
    value?: any;
  }) => {
    if (!route) return;

    console.log('🎯 Command action:', action);

    switch (action.type) {
      case 'remove':
        if (action.cityIndex !== undefined && action.cityIndex > 0 && action.cityIndex < route.cities.length - 1) {
          // Remove city from route
          const newCities = [...route.cities];
          newCities.splice(action.cityIndex, 1);
          setRoute({ ...route, cities: newCities });
        }
        break;

      case 'replace':
        if (action.cityIndex !== undefined && action.cityName) {
          // Open replacement sheet
          setReplacementSheet({
            isOpen: true,
            cityIndex: action.cityIndex,
            cityName: action.cityName
          });
        }
        break;

      case 'nights':
        if (action.cityIndex !== undefined && action.value !== undefined) {
          // Update nights for city
          const newCities = [...route.cities];
          newCities[action.cityIndex] = {
            ...newCities[action.cityIndex],
            nights: action.value
          };
          setRoute({ ...route, cities: newCities });
        }
        break;

      case 'add':
        // Open companion panel to discuss adding a city
        if (!isPanelExpanded) {
          togglePanel();
        }
        sendMessage('I want to add a new city to my route. Can you suggest some options?');
        break;

      default:
        console.log('Unknown command action:', action.type);
    }
  };

  // Handle city replacement from command bar or FloatingCityCards
  const handleReplaceCity = (newCity: {
    name: string;
    country: string;
    coordinates: { lat: number; lng: number };
    whyReplace?: string;
    highlights?: string[];
    matchScore?: number;
    matchReasons?: string[];
    estimatedDetourKm?: number;
    bestFor?: 'culture' | 'nature' | 'food' | 'adventure' | 'relaxation';
  }) => {
    if (!route || replacementSheet.cityIndex < 0) return;

    const newCities = [...route.cities];
    newCities[replacementSheet.cityIndex] = {
      ...newCities[replacementSheet.cityIndex],
      city: {
        name: newCity.name,
        country: newCity.country,
        coordinates: newCity.coordinates
      },
      coordinates: newCity.coordinates
    };

    setRoute({ ...route, cities: newCities });
    setReplacementSheet({ isOpen: false, cityIndex: -1, cityName: '' });
  };

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
          // If route not found, unauthorized, or invalid ID format (500), fall back to localStorage
          // This handles cases where routeId is a timestamp format (not a real DB UUID)
          // 500 occurs when the route ID format doesn't match UUID (e.g., "route_timestamp_random")
          if (response.status === 404 || response.status === 401 || response.status === 403 || response.status === 500) {
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

    // ============================================================
    // PRIORITY 1: Check for NEW UnifiedRouteAgent format (data.route.waypoints)
    // ============================================================
    if (data.route && data.route.waypoints && Array.isArray(data.route.waypoints)) {
      console.log('✅ Found UNIFIED route format (data.route.waypoints)');
      agentWaypoints = data.route.waypoints;
      console.log('✅ Unified waypoints:', agentWaypoints.map((w: any) => w.name));

      // Build cityDataMap from unified waypoints
      agentWaypoints.forEach((waypoint: any) => {
        const cityName = getCityName(waypoint.name || waypoint.city || waypoint);
        if (!cityDataMap.has(cityName)) {
          cityDataMap.set(cityName, waypoint);
        }
      });

      // Also add destination from route object (has nights allocated)
      if (data.route.destination) {
        const destName = getCityName(data.route.destination.name || data.route.destination);
        cityDataMap.set(destName, data.route.destination);
      }
    }
    // ============================================================
    // PRIORITY 2: Check for OLD multi-agent format (agentResults)
    // ============================================================
    else if (data.agentResults && Array.isArray(data.agentResults)) {
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

    // ============================================================
    // PRIORITY 3: Fallback to global waypoints
    // ============================================================
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
    // Handle both unified format (data.route.origin) and old format (data.origin)
    const originData = data.route?.origin || data.origin;
    const destinationData = data.route?.destination || data.destination;
    const originName = getCityName(originData);
    const destinationName = getCityName(destinationData);

    let orderedCities: string[] = [];

    if (agentWaypoints.length > 0) {
      // Use agent-specific waypoints
      orderedCities = [
        originName,
        ...agentWaypoints.map((w: any) => getCityName(w.city || w.name || w)),
        destinationName
      ];
      console.log('✅ Using agent waypoints:', orderedCities);
    } else {
      // Last fallback: just origin and destination
      orderedCities = [originName, destinationName];
      console.log('⚠️ Using origin/destination only:', orderedCities);
    }

    // Store origin/destination data in cityDataMap for coordinate/night lookup
    if (!cityDataMap.has(originName)) {
      cityDataMap.set(originName, originData);
    }
    if (!cityDataMap.has(destinationName)) {
      cityDataMap.set(destinationName, destinationData);
    }

    console.log('🏙️ Processing cities in order:', orderedCities);

    if (orderedCities.length > 0) {
      orderedCities.forEach((cityName: string) => {
        console.log(`  🌆 ${cityName}`);

        // Get city data from cityDataMap (built from agent's waypoints + origin/destination)
        const cityData = cityDataMap.get(cityName);
        let coordinates = { lat: 0, lng: 0 };

        // Extract coordinates from cityData (works for all city types now)
        if (cityData) {
          if (cityData.coordinates) {
            coordinates = extractCoordinates(cityData);
            console.log(`    ✅ Using cityData coordinates:`, coordinates);
          } else if (cityData.city?.coordinates) {
            coordinates = extractCoordinates(cityData.city);
            console.log(`    ✅ Using nested city coordinates:`, coordinates);
          }
        }

        if (coordinates.lat === 0 && coordinates.lng === 0) {
          console.log(`    ⚠️ No coordinates found for ${cityName}`);
        }

        // Get nights from multiple sources:
        // 1. nightAllocations (from old format)
        // 2. cityData.nights (from unified format waypoints)
        // 3. recommended_nights (from AI)
        // 4. recommended_min_nights (fallback)
        let nights = data.nightAllocations?.[cityName] || 0;

        // If not in nightAllocations, check the cityData directly
        if (!nights && cityData?.nights !== undefined) {
          nights = cityData.nights;
        }

        // Fallback to recommended_nights
        if (!nights && cityData?.recommended_nights) {
          nights = cityData.recommended_nights;
        }

        // Fallback to recommended_min_nights
        if (!nights && cityData?.recommended_min_nights) {
          nights = cityData.recommended_min_nights;
        }

        // Default to 2 nights for waypoints, 0 for origin (but keep destination nights)
        if (!nights) {
          if (cityName === originName) {
            nights = 0; // Origin has 0 nights (starting point)
          } else if (cityName === destinationName) {
            nights = 2; // Default 2 nights at destination
          } else {
            nights = 2; // Default 2 nights for waypoints
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
      agentResults: data.agentResults || [],
      // Include personalization data if present
      personalization: data.personalization || data.preferences?.personalization || undefined,
      // Include AI-generated personalization content (from UnifiedRouteAgent)
      personalizedIntro: data.personalizedIntro || undefined,
      tripStyleProfile: data.tripStyleProfile || undefined,
      tripNarrative: data.tripNarrative || undefined,
    };
  };

  // Transform backend saved route to SpotlightRoute format
  const transformBackendDataToRoute = (data: any): SpotlightRoute => {
    console.log('🔄 transformBackendDataToRoute received:', data);

    // Backend returns { route: { id, routeData, ... } }
    const backendRoute = data.route || data;
    const routeData = backendRoute.routeData || {};

    console.log('📦 Extracted routeData:', routeData);
    console.log('📦 Cities in routeData:', routeData.cities?.length || 0);
    console.log('📦 Landmarks in routeData:', routeData.landmarks?.length || 0);

    // If routeData has a pre-built cities array, use it directly!
    // This is the case for saved routes - they already have properly formatted cities
    if (routeData.cities && Array.isArray(routeData.cities) && routeData.cities.length > 0) {
      console.log('✅ Using pre-built cities array from saved route');

      // Ensure each city has proper coordinates format
      const cities: CityData[] = routeData.cities.map((cityData: any) => {
        // Extract coordinates - handle both {lat,lng} and [lat,lng] formats
        let coordinates = { lat: 0, lng: 0 };

        // Try cityData.coordinates first
        if (cityData.coordinates) {
          if (Array.isArray(cityData.coordinates)) {
            coordinates = { lat: cityData.coordinates[0], lng: cityData.coordinates[1] };
          } else if (cityData.coordinates.lat !== undefined) {
            coordinates = { lat: cityData.coordinates.lat, lng: cityData.coordinates.lng };
          }
        }
        // Try cityData.city.coordinates as fallback
        else if (cityData.city?.coordinates) {
          if (Array.isArray(cityData.city.coordinates)) {
            coordinates = { lat: cityData.city.coordinates[0], lng: cityData.city.coordinates[1] };
          } else if (cityData.city.coordinates.lat !== undefined) {
            coordinates = { lat: cityData.city.coordinates.lat, lng: cityData.city.coordinates.lng };
          }
        }

        return {
          ...cityData,
          coordinates,
          city: cityData.city || { name: 'Unknown', country: '', coordinates }
        };
      });

      console.log('✅ Processed cities:', cities.map(c => `${getCityName(c.city)} @ [${c.coordinates.lat}, ${c.coordinates.lng}]`));

      return {
        id: backendRoute.id,
        origin: backendRoute.origin || routeData.origin || cities[0]?.city,
        destination: backendRoute.destination || routeData.destination || cities[cities.length - 1]?.city,
        budget: backendRoute.budget || routeData.budget,
        agent: backendRoute.selectedAgents?.[0] || routeData.agent || 'best-overall',
        cities,
        landmarks: routeData.landmarks || [],
        nightAllocations: routeData.nightAllocations || {},
        agentResults: routeData.agentResults || [],
        personalization: routeData.personalization,
        personalizedIntro: routeData.personalizedIntro,
        tripStyleProfile: routeData.tripStyleProfile,
        tripNarrative: routeData.tripNarrative,
        routeData, // Keep for reference
      };
    }

    // Fallback: No pre-built cities array - use the landing page transformation
    console.log('⚠️ No pre-built cities array, falling back to transformLandingDataToRoute');

    const mergedData = {
      ...routeData,
      ...backendRoute,
      id: backendRoute.id,
      agent: backendRoute.selectedAgents || routeData.agent || 'best-overall'
    };

    const transformed = transformLandingDataToRoute(mergedData);
    transformed.routeData = routeData;

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

  // Handler for Generate Itinerary button - open the editorial panel
  const handleGenerateItinerary = () => {
    console.log('🎯 Opening itinerary panel');
    setShowItineraryPanel(true);
  };

  // Handler for when itinerary panel closes - re-check for stored itinerary
  const handleItineraryPanelClose = () => {
    setShowItineraryPanel(false);
    // Re-check for stored itinerary (in case one was just generated)
    const storedId = getStoredItineraryId();
    setHasStoredItinerary(!!storedId);
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

  // NOTE: We no longer redirect to ItineraryView - instead we use the Editorial Panel
  // The URL param migration happens in the useEffect above

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

  // Calculate totals for the intro banner
  const totalDays = (route?.cities?.reduce((sum, city) => sum + (city.nights || 0), 0) || 0) + 1;
  const totalCities = route?.cities?.length || 0;

  // Check if we should show the personalized intro banner
  const hasPersonalizedIntro = route?.personalizedIntro?.headline;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FFFBF5] relative">
      {/* Main Content Area - Uses margin-right to make space for companion panel */}
      <div
        className="h-full relative transition-[margin] duration-300"
        style={{
          marginRight: isPanelExpanded ? '280px' : '0px',
        }}
      >
        {/* Header */}
        <SpotlightHeader
          onGenerateItinerary={handleGenerateItinerary}
          onSave={() => setShowSaveModal(true)}
        />

        {/* Personalized Intro Card - Compact floating notification */}
        <AnimatePresence>
          {hasPersonalizedIntro && route?.personalizedIntro && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="absolute top-[68px] left-0 z-30 max-w-md"
              style={{
                // Account for companion panel on desktop
                maxWidth: isPanelExpanded ? 'calc(100% - 360px)' : '420px',
              }}
            >
              <PersonalizedIntroBanner
                intro={route.personalizedIntro}
                tripStyleProfile={route.tripStyleProfile}
                tripNarrative={route.tripNarrative}
                totalDays={totalDays}
                totalCities={totalCities}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map - Fullscreen hero element */}
        <MapViewV2 />

        {/* Bottom Sheet - Apple Maps style */}
        <BottomSheet onCityDetailsClick={setCityDetailIndex} />
      </div>

      {/* Companion Panel - Desktop Sidebar (fixed positioned, hidden on mobile) */}
      <div className="hidden md:block">
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

      {/* Editorial Itinerary Panel */}
      <EditorialItineraryPanel
        isOpen={showItineraryPanel}
        onClose={handleItineraryPanelClose}
      />

      {/* Floating Action Buttons - Fixed position, below personalized intro banner */}
      <div className="fixed top-20 left-4 z-30 flex flex-col gap-2" style={{ top: hasPersonalizedIntro ? '140px' : '80px' }}>
        {/* View Itinerary Button - Shows when stored itinerary exists */}
        {hasStoredItinerary && (
          <motion.button
            onClick={() => setShowItineraryPanel(true)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-[#C45830] to-[#D4A853] hover:from-[#B04726] hover:to-[#C49843] text-white rounded-xl px-4 py-2.5 shadow-lg transition-all duration-200 flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-medium">View Itinerary</span>
          </motion.button>
        )}
      </div>

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

      {/* Mobile Companion Drawer */}
      <MobileCompanionDrawer
        isOpen={mobileCompanionOpen}
        onOpen={() => setMobileCompanionOpen(true)}
        onClose={() => setMobileCompanionOpen(false)}
      />

      {/* Feature Tour - Shows for first-time users */}
      <FeatureTour />

      {/* Marketplace Prompt - Shows after delay for discovery */}
      <MarketplacePrompt
        delay={10000}
        className="fixed bottom-[300px] left-4 z-30"
      />

      {/* Command Bar - Cmd+K interface */}
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onExecuteAction={handleCommandAction}
      />

      {/* City Replacement Sheet - Triggered from command bar or city cards */}
      <CityReplacementSheet
        isOpen={replacementSheet.isOpen}
        onClose={() => setReplacementSheet({ isOpen: false, cityIndex: -1, cityName: '' })}
        cityName={replacementSheet.cityName}
        cityIndex={replacementSheet.cityIndex}
        onReplace={handleReplaceCity}
      />

      {/* Constraint Change Sheet - Adapt trip when constraints change */}
      <ConstraintChangeSheet
        isOpen={constraintSheet.isOpen}
        onClose={() => setConstraintSheet({ isOpen: false, type: 'duration' })}
        initialType={constraintSheet.type}
      />

      {/* Trip Activation Modal */}
      <TripActivation
        isOpen={showTripActivation}
        onClose={() => setShowTripActivation(false)}
        onActivate={() => {
          startTrip();
          setShowTripActivation(false);
          setShowLiveTripPanel(true);
        }}
      />

      {/* Live Trip Panel - Shows during active trip */}
      <AnimatePresence>
        {showLiveTripPanel && route?.id && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 z-50 shadow-2xl"
          >
            <LiveTripPanel
              routeId={route.id}
              itineraryId={getStoredItineraryId() || undefined}
              onClose={() => setShowLiveTripPanel(false)}
              className="h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Buttons - Positioned to left of companion panel */}
      <div className="fixed bottom-6 z-40 hidden md:flex flex-col gap-2" style={{ right: '296px' }}>
        {/* Start Trip Button - Only show when trip mode is not active */}
        {!tripMode.isActive && (
          <motion.button
            onClick={() => setShowTripActivation(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all"
            style={{
              background: 'linear-gradient(135deg, #6B8E7B 0%, #8BA99A 100%)',
              border: '1px solid rgba(107, 142, 123, 0.3)',
              boxShadow: '0 4px 20px rgba(107, 142, 123, 0.3)'
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 6px 24px rgba(107, 142, 123, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            title="Start your trip to unlock live companion features"
          >
            <Plane className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Start Trip</span>
          </motion.button>
        )}

        {/* Trip Active Indicator - Show when trip mode is active */}
        {tripMode.isActive && (
          <motion.button
            onClick={() => setShowLiveTripPanel(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #6B8E7B 0%, #8BA99A 100%)',
              border: '1px solid rgba(107, 142, 123, 0.3)',
              boxShadow: '0 4px 20px rgba(107, 142, 123, 0.3)'
            }}
            whileHover={{ scale: 1.05, boxShadow: '0 6px 24px rgba(107, 142, 123, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            title="Open trip panel"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-medium text-white">Day {tripMode.currentDay}</span>
          </motion.button>
        )}

        {/* Adapt Trip Button */}
        <motion.button
          onClick={() => setConstraintSheet({ isOpen: true, type: 'duration' })}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, #C45830 0%, #D96A42 100%)',
            border: '1px solid rgba(196, 88, 48, 0.3)',
            boxShadow: '0 4px 20px rgba(196, 88, 48, 0.3)'
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 6px 24px rgba(196, 88, 48, 0.4)' }}
          whileTap={{ scale: 0.98 }}
          title="Adapt your trip (change duration, budget, etc.)"
        >
          <Clock className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">Adapt Trip</span>
        </motion.button>

        {/* Command Button */}
        <motion.button
          onClick={() => setIsCommandBarOpen(true)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, #1A1814 0%, #252220 100%)',
            border: '1px solid rgba(212, 168, 83, 0.3)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(212, 168, 83, 0.1)'
          }}
          whileHover={{ scale: 1.05, boxShadow: '0 6px 24px rgba(0,0,0,0.4), 0 0 20px rgba(212, 168, 83, 0.2)' }}
          whileTap={{ scale: 0.98 }}
        >
          <Command className="w-4 h-4 text-[#D4A853]" />
          <span className="text-sm font-medium text-[#F5F0EB]">Command</span>
          <kbd className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-[#2D2A27] text-[#9B8E82] border border-[#3D3835]">
            ⌘K
          </kbd>
        </motion.button>
      </div>

    </div>
  );
};

export default SpotlightV2;
