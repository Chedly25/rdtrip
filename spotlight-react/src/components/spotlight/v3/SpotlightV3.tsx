/**
 * SpotlightV3 - Apple-Grade Redesign
 * Phase 1: Main Layout (70% Map | 30% Sidebar)
 *
 * Preserves ALL existing features while adding:
 * - Glassmorphism design
 * - Tabbed sidebar (Route, Chat, Expenses, Tasks)
 * - Smooth macOS animations
 * - 60fps performance
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useSpotlightStoreV2, type SpotlightRoute, type CityData } from '../../../stores/spotlightStoreV2';
import { useAgentSuggestionsStore, type AgentCity } from '../../../stores/agentSuggestionsStore';
import { useAutoSave } from '../../../hooks/useAutoSave';
import { useToast } from '../../toast/ToastProvider';
import { useSpotlightKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import MapSection from './MapSection';
import ItinerarySidebar from './ItinerarySidebar';
import SpotlightHeader from '../v2/SpotlightHeader';
import { AgentSuggestionsPanel } from './AgentSuggestionsPanel';
import { GlassPanel } from '../../design-system';
import { FlyingCardAnimation } from './FlyingCardAnimation';

const SpotlightV3 = () => {
  // URL parameters and routing
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('routeId');
  const itineraryId = searchParams.get('itinerary');
  const navigate = useNavigate();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flying card animation state
  const [flyingCity, setFlyingCity] = useState<AgentCity | null>(null);
  const [flyingStartRect, setFlyingStartRect] = useState<DOMRect | null>(null);
  const [flyingTargetRect, setFlyingTargetRect] = useState<DOMRect | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Zustand stores
  const {
    route,
    setRoute,
    setIsLoadingRoute,
    getCityName,
    addCityAtDay
  } = useSpotlightStoreV2();

  const { loadCities, markCityAsAdded, togglePanel } = useAgentSuggestionsStore();

  // Phase 6: Toast notifications
  const { showToast } = useToast();

  // Auto-save functionality (preserves existing auto-save)
  const { lastSaved, isSaving } = useAutoSave(
    route?.id || null,
    route,
    !!route?.id
  );

  // Phase 6: Keyboard shortcuts
  useSpotlightKeyboardShortcuts(
    () => {
      // Cmd+S - Save (auto-save is already running, just show feedback)
      showToast('success', 'Trip auto-saved!', 2000);
    },
    () => {
      // Cmd+E - Export menu (TODO: implement when export menu is ready)
      showToast('info', 'Export feature coming soon!', 2000);
    },
    () => {
      // Cmd+/ - Toggle suggestions panel
      togglePanel();
    },
    () => {
      // Esc - Close panels (toggle suggestions if open)
      const { isPanelExpanded } = useAgentSuggestionsStore.getState();
      if (isPanelExpanded) {
        togglePanel();
      }
    }
  );

  // Load route data on mount
  useEffect(() => {
    if (!itineraryId) {
      loadRouteData();
    } else {
      setIsLoading(false);
    }
  }, [routeId, itineraryId]);

  // Load agent cities when route loads
  useEffect(() => {
    if (route && route.agentResults) {
      loadAgentCities(route);
    }
  }, [route?.id]);

  /**
   * Load all agent cities from agentResults into suggestions store
   */
  const loadAgentCities = (routeData: SpotlightRoute) => {
    if (!routeData.agentResults) return;

    const agentCities: AgentCity[] = [];
    const currentCityNames = new Set(
      routeData.cities.map(city => getCityName(city.city))
    );

    // Process each agent's recommendations
    routeData.agentResults.forEach((agentResult: any) => {
      try {
        const recommendations = typeof agentResult.recommendations === 'string'
          ? JSON.parse(agentResult.recommendations)
          : agentResult.recommendations;

        if (recommendations.waypoints && Array.isArray(recommendations.waypoints)) {
          recommendations.waypoints.forEach((waypoint: any, idx: number) => {
            const cityName = getCityName(waypoint.city || waypoint.name || waypoint);
            const isInItinerary = currentCityNames.has(cityName);

            agentCities.push({
              id: `${agentResult.agent}-${idx}`,
              name: cityName,
              country: waypoint.country || '',
              displayName: `${cityName}${waypoint.country ? ', ' + waypoint.country : ''}`,
              image: waypoint.image,
              coordinates: extractCoordinates(waypoint),
              highlights: waypoint.highlights || [],
              agentType: agentResult.agent,
              suggestedDay: idx + 1,
              nights: waypoint.nights || 1,
              isInItinerary
            });
          });
        }
      } catch (err) {
        console.error(`Failed to parse agent ${agentResult.agent} recommendations:`, err);
      }
    });

    loadCities(agentCities);
  };

  /**
   * Handle adding a city to itinerary from suggestions panel
   * Memoized with useCallback to prevent unnecessary re-renders
   */
  const handleAddCity = useCallback(async (city: AgentCity, day: number, cardElement: HTMLElement) => {
    try {
      console.log('Adding city to day', day, city);

      // Trigger fly-to-itinerary animation
      if (sidebarRef.current) {
        const startRect = cardElement.getBoundingClientRect();
        const targetRect = sidebarRef.current.getBoundingClientRect();

        setFlyingCity(city);
        setFlyingStartRect(startRect);
        setFlyingTargetRect(targetRect);
      }

      // Create CityData from AgentCity
      const cityData = {
        city: {
          name: city.name,
          country: city.country,
          coordinates: city.coordinates
        },
        coordinates: city.coordinates,
        nights: city.nights || 1,
        activities: [],
        restaurants: [],
        accommodation: [],
        events: [],
        agentData: {
          source: city.agentType,
          highlights: city.highlights
        }
      };

      // Add to itinerary via store (also flies map to city)
      await addCityAtDay(cityData, day);

      // Mark as added in suggestions panel
      markCityAsAdded(city.id);

      console.log(`✅ Successfully added ${city.name} to day ${day}`);

      // Phase 6: Success toast notification
      showToast('success', `${city.name} added to your trip!`, 3000);
    } catch (error) {
      console.error('Failed to add city:', error);

      // Phase 6: Error toast notification
      showToast('error', `Failed to add ${city.name}. Please try again.`, 4000);
    }
  }, [addCityAtDay, markCityAsAdded, showToast]);

  // Reset flying animation state
  const handleAnimationComplete = useCallback(() => {
    setFlyingCity(null);
    setFlyingStartRect(null);
    setFlyingTargetRect(null);
  }, []);

  /**
   * Load route data from backend or localStorage
   * PRESERVES EXISTING LOGIC from SpotlightV2
   */
  const loadRouteData = async () => {
    try {
      setIsLoadingRoute(true);
      setIsLoading(true);

      // PRIORITY 1: Fetch from backend if routeId exists
      if (routeId) {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/routes/${routeId}`, {
          headers
        });

        if (response.ok) {
          const routeData = await response.json();
          const transformedRoute = transformBackendDataToRoute(routeData);
          setRoute(transformedRoute);
          return;
        }
      }

      // PRIORITY 2: Fallback to localStorage
      const spotlightDataStr = localStorage.getItem('spotlightData');
      if (spotlightDataStr) {
        const spotlightData = JSON.parse(spotlightDataStr);
        const transformedRoute = transformLandingDataToRoute(spotlightData);
        setRoute(transformedRoute);
        return;
      }

      setError('No route data found. Please generate a route from the landing page first.');
    } catch (err) {
      console.error('Error loading route:', err);
      setError(err instanceof Error ? err.message : 'Failed to load route data');
    } finally {
      setIsLoading(false);
      setIsLoadingRoute(false);
    }
  };

  /**
   * Transform backend data to SpotlightRoute format
   * PRESERVES EXISTING LOGIC - Delegates to transformLandingDataToRoute
   */
  const transformBackendDataToRoute = (data: any): SpotlightRoute => {
    const backendRoute = data.route || data;
    const routeData = backendRoute.routeData || {};

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

  /**
   * Helper to extract coordinates from city data
   * Memoized with useCallback for performance
   */
  const extractCoordinates = useCallback((city: any): { lat: number; lng: number } => {
    if (typeof city === 'string') {
      return { lat: 0, lng: 0 };
    }

    const coords = city.coordinates || city;

    if (typeof coords === 'object' && coords.lat !== undefined && coords.lng !== undefined) {
      return { lat: coords.lat, lng: coords.lng };
    }

    if (Array.isArray(coords) && coords.length === 2) {
      return { lat: coords[0], lng: coords[1] };
    }

    return { lat: 0, lng: 0 };
  }, []);

  /**
   * Transform landing page data to SpotlightRoute format
   * PRESERVES EXISTING LOGIC
   */
  const transformLandingDataToRoute = (data: any): SpotlightRoute => {
    const cities: CityData[] = [];
    const cityDataMap = new Map<string, any>();

    let agentWaypoints: any[] = [];
    const selectedAgent = data.agent || 'best-overall';

    if (data.agentResults && Array.isArray(data.agentResults)) {
      const agentResult = data.agentResults.find((result: any) => result.agent === selectedAgent);

      if (agentResult && agentResult.recommendations) {
        try {
          const recommendations = typeof agentResult.recommendations === 'string'
            ? JSON.parse(agentResult.recommendations)
            : agentResult.recommendations;

          if (recommendations.waypoints && Array.isArray(recommendations.waypoints)) {
            agentWaypoints = recommendations.waypoints;
            agentWaypoints.forEach((waypoint: any) => {
              const cityName = getCityName(waypoint.city || waypoint.name || waypoint);
              if (!cityDataMap.has(cityName)) {
                cityDataMap.set(cityName, waypoint);
              }
            });
          }
        } catch (err) {
          console.error('Failed to parse agent recommendations:', err);
        }
      }
    }

    if (agentWaypoints.length === 0 && data.waypoints && Array.isArray(data.waypoints)) {
      agentWaypoints = data.waypoints;
      agentWaypoints.forEach((waypoint: any) => {
        const cityName = getCityName(waypoint.name || waypoint.city || waypoint);
        if (!cityDataMap.has(cityName)) {
          cityDataMap.set(cityName, waypoint);
        }
      });
    }

    let orderedCities: string[] = [];

    if (agentWaypoints.length > 0) {
      orderedCities = [
        getCityName(data.origin),
        ...agentWaypoints.map((w: any) => getCityName(w.city || w.name || w)),
        getCityName(data.destination)
      ];
    } else {
      orderedCities = [getCityName(data.origin), getCityName(data.destination)];
    }

    if (orderedCities.length > 0) {
      orderedCities.forEach((cityName: string) => {
        let cityData = cityDataMap.get(cityName);
        let coordinates = { lat: 0, lng: 0 };

        if (cityName === getCityName(data.origin)) {
          coordinates = extractCoordinates(data.origin);
        } else if (cityName === getCityName(data.destination)) {
          coordinates = extractCoordinates(data.destination);
        } else if (cityData) {
          if (cityData.coordinates) {
            coordinates = extractCoordinates(cityData);
          } else {
            coordinates = extractCoordinates(cityData.city || cityData);
          }
        }

        let nights = data.nightAllocations?.[cityName] || 0;

        if (!nights && cityData?.nights) {
          nights = cityData.nights;
        }

        if (!nights && cityData?.recommended_min_nights) {
          nights = cityData.recommended_min_nights;
        }

        if (!nights) {
          if (cityName === getCityName(data.origin) || cityName === getCityName(data.destination)) {
            nights = 0;
          } else {
            nights = 1;
          }
        }

        const normalizedCityData = cityData ? {
          ...cityData,
          name: cityData.city || cityData.name || cityName,
          country: cityData.country || '',
          coordinates
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
    }

    return {
      id: data.id || data.routeId,
      origin: data.origin,
      destination: data.destination,
      budget: data.budget,
      agent: data.agent || 'best-overall',
      cities,
      landmarks: data.landmarks || [],
      nightAllocations: data.nightAllocations || {},
      agentResults: data.agentResults || []
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <GlassPanel blur="lg" opacity={0.8} className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
            <p className="text-lg font-medium text-gray-700">Loading your trip...</p>
          </div>
        </GlassPanel>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <GlassPanel blur="lg" opacity={0.8} className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-6xl">😕</div>
            <h2 className="text-xl font-bold text-gray-900">Oops!</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header - Preserves existing SpotlightHeader */}
      <SpotlightHeader
        lastSaved={lastSaved}
        isSaving={isSaving}
      />

      {/* Main Layout: 70% Map | 30% Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Map Section (70%) */}
        <div className="flex-[0_0_70%] relative">
          <MapSection />
        </div>

        {/* Right: Itinerary Sidebar (30%) */}
        <div ref={sidebarRef} className="flex-[0_0_30%] relative">
          <ItinerarySidebar
            route={route}
            routeId={routeId}
            userId={localStorage.getItem('userId') || undefined}
          />
        </div>
      </div>

      {/* Phase 2: Agent Suggestions Panel */}
      <AgentSuggestionsPanel onAddCity={handleAddCity} />

      {/* Flying Card Animation */}
      <FlyingCardAnimation
        city={flyingCity}
        startRect={flyingStartRect}
        targetRect={flyingTargetRect}
        onComplete={handleAnimationComplete}
      />
    </div>
  );
};

export default SpotlightV3;
