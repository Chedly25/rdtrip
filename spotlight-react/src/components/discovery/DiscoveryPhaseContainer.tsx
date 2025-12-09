import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useDiscoveryStore } from '../../stores/discoveryStore';
import { useSpotlightStoreV2 } from '../../stores/spotlightStoreV2';
import { DiscoveryHeader } from './DiscoveryHeader';
import { DiscoveryMap } from './DiscoveryMap';
import { DiscoveryCompanionPanel } from './DiscoveryCompanionPanel';
import { DiscoveryCityPreview } from './DiscoveryCityPreview';
import { DiscoveryLoadingState } from './DiscoveryLoadingState';
import { AddCityModal } from './AddCityModal';
import { ProceedConfirmationModal } from './ProceedConfirmationModal';
import { searchHiddenGemsInCity } from '../../services/hiddenGems';
import type { DiscoveryRoute, DiscoveryCity, DiscoveryPlace, PlaceType } from '../../stores/discoveryStore';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3000' : ''
);

/**
 * DiscoveryPhaseContainer
 *
 * Main orchestrator for the Discovery phase. Users explore AI-suggested cities
 * along their route before committing to a full itinerary.
 *
 * Layout:
 * - Mobile: Full-screen map with floating header and bottom sheet companion
 * - Desktop: Map (70%) | Companion sidebar (30%)
 *
 * The map is the hero - companion is supportive, not dominant.
 */
export function DiscoveryPhaseContainer() {
  const navigate = useNavigate();

  // Store state
  const {
    route,
    tripSummary,
    phase,
    selectedCityId,
    isCompanionExpanded,
    setRoute,
    setTripSummary,
    setPhase,
    selectCity,
    addCity,
    addCompanionMessage,
    reset,
  } = useDiscoveryStore();

  // Local state
  const [isDesktop, setIsDesktop] = useState(false);
  const [showCityPreview, setShowCityPreview] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Check viewport size
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Load route data from URL params or localStorage
  useEffect(() => {
    const loadDiscoveryData = async () => {
      // Try to get data from URL params or sessionStorage
      const storedData = sessionStorage.getItem('discoveryData');

      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          setTripSummary({
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            totalNights: data.totalNights,
            travellerType: data.travellerType,
          });

          // Fetch suggested cities for the route
          await fetchSuggestedCities(data);
        } catch (err) {
          console.error('Failed to parse discovery data:', err);
          navigate('/new');
        }
      } else {
        // No data - redirect to entry form
        navigate('/new');
      }
    };

    loadDiscoveryData();

    return () => {
      // Cleanup on unmount
    };
  }, [navigate, setTripSummary]);

  // Fetch suggested cities from API
  const fetchSuggestedCities = async (data: any) => {
    setPhase('loading');

    try {
      // Create the route structure
      const discoveryRoute: DiscoveryRoute = {
        origin: {
          id: 'origin',
          name: data.origin.name,
          country: data.origin.country,
          coordinates: {
            lat: data.origin.coordinates[0],
            lng: data.origin.coordinates[1],
          },
          isSelected: true,
          isFixed: true,
          suggestedNights: 1,
          placeCount: 0,
          description: 'Your starting point',
        },
        destination: {
          id: 'destination',
          name: data.destination.name,
          country: data.destination.country,
          coordinates: {
            lat: data.destination.coordinates[0],
            lng: data.destination.coordinates[1],
          },
          isSelected: true,
          isFixed: true,
          suggestedNights: 2,
          placeCount: 0,
          description: 'Your final destination',
        },
        suggestedCities: [],
        totalDistanceKm: 0,
        totalDrivingMinutes: 0,
      };

      // Call the real API to get city suggestions
      console.log('🔍 Calling /api/discover-cities...');
      const response = await fetch(`${API_BASE_URL}/api/discover-cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: {
            name: data.origin.name,
            country: data.origin.country,
            coordinates: data.origin.coordinates,
          },
          destination: {
            name: data.destination.name,
            country: data.destination.country,
            coordinates: data.destination.coordinates,
          },
          totalNights: data.totalNights,
          travellerType: data.travellerType,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ City suggestions received:', result);

      // Transform API response to DiscoveryCity format
      const suggestedCities: DiscoveryCity[] = await Promise.all(
        (result.cities || []).map(async (city: any, index: number) => {
          // Fetch hidden gems for each city (in parallel)
          let places: DiscoveryPlace[] = [];
          let placeCount = city.hiddenGemCount || 20;

          try {
            const hiddenGems = await searchHiddenGemsInCity(
              city.name,
              { lat: city.coordinates.lat, lng: city.coordinates.lng },
              { limit: 10 }
            );
            places = hiddenGems.places.map((place) => ({
              id: place.placeId,
              name: place.name,
              type: mapToPlaceType(place.types[0]),
              rating: place.rating,
              reviewCount: place.reviewCount,
              isHiddenGem: place.isHiddenGem,
              description: place.editorialSummary,
              priceLevel: place.priceLevel || undefined,
            }));
            placeCount = hiddenGems.totalCount || places.length;
          } catch (err) {
            console.warn(`Could not fetch places for ${city.name}:`, err);
            // Use fallback places if API fails
            places = generateMockPlaces(city.name, index);
          }

          return {
            id: `city-${index}`,
            name: city.name,
            country: city.country,
            description: city.description || `Discover ${city.name}`,
            placeCount,
            coordinates: {
              lat: city.coordinates.lat,
              lng: city.coordinates.lng,
            },
            isSelected: index === 0, // First suggestion selected by default
            isFixed: false,
            suggestedNights: city.suggestedNights || 1,
            distanceFromRoute: city.distanceFromRouteKm || 0,
            places,
          };
        })
      );

      discoveryRoute.suggestedCities = suggestedCities;

      // Also try to get places for origin and destination
      try {
        const originPlaces = await searchHiddenGemsInCity(
          data.origin.name,
          { lat: data.origin.coordinates[0], lng: data.origin.coordinates[1] },
          { limit: 5 }
        );
        discoveryRoute.origin.placeCount = originPlaces.totalCount || originPlaces.places.length;
        discoveryRoute.origin.places = originPlaces.places.map((place) => ({
          id: place.placeId,
          name: place.name,
          type: mapToPlaceType(place.types[0]),
          rating: place.rating,
          reviewCount: place.reviewCount,
          isHiddenGem: place.isHiddenGem,
        }));
      } catch (err) {
        console.warn('Could not fetch origin places:', err);
        discoveryRoute.origin.placeCount = 42;
      }

      try {
        const destPlaces = await searchHiddenGemsInCity(
          data.destination.name,
          { lat: data.destination.coordinates[0], lng: data.destination.coordinates[1] },
          { limit: 5 }
        );
        discoveryRoute.destination.placeCount = destPlaces.totalCount || destPlaces.places.length;
        discoveryRoute.destination.places = destPlaces.places.map((place) => ({
          id: place.placeId,
          name: place.name,
          type: mapToPlaceType(place.types[0]),
          rating: place.rating,
          reviewCount: place.reviewCount,
          isHiddenGem: place.isHiddenGem,
        }));
      } catch (err) {
        console.warn('Could not fetch destination places:', err);
        discoveryRoute.destination.placeCount = 67;
      }

      setRoute(discoveryRoute);

      // Add welcome message from companion
      addCompanionMessage({
        type: 'assistant',
        content: `I've found ${discoveryRoute.suggestedCities.length} amazing stops along your route from ${data.origin.name} to ${data.destination.name}. Each one has been chosen for its unique character and hidden gems. Tap any city to explore!`,
      });

      setPhase('exploring');
    } catch (err) {
      console.error('Failed to fetch suggested cities:', err);
      // Fallback to mock data if API fails
      await fetchSuggestedCitiesFallback(data);
    }
  };

  // Fallback function using mock data if API fails
  const fetchSuggestedCitiesFallback = async (data: any) => {
    console.warn('⚠️ Using fallback mock data for city suggestions');

    const mockRoute: DiscoveryRoute = {
      origin: {
        id: 'origin',
        name: data.origin.name,
        country: data.origin.country,
        coordinates: {
          lat: data.origin.coordinates[0],
          lng: data.origin.coordinates[1],
        },
        isSelected: true,
        isFixed: true,
        suggestedNights: 1,
        placeCount: 42,
        description: 'Your starting point',
      },
      destination: {
        id: 'destination',
        name: data.destination.name,
        country: data.destination.country,
        coordinates: {
          lat: data.destination.coordinates[0],
          lng: data.destination.coordinates[1],
        },
        isSelected: true,
        isFixed: true,
        suggestedNights: 2,
        placeCount: 67,
        description: 'Your final destination',
      },
      suggestedCities: generateMockCities(
        { coordinates: { lat: data.origin.coordinates[0], lng: data.origin.coordinates[1] } },
        { coordinates: { lat: data.destination.coordinates[0], lng: data.destination.coordinates[1] } },
        data.totalNights
      ),
      totalDistanceKm: 0,
      totalDrivingMinutes: 0,
    };

    setRoute(mockRoute);
    addCompanionMessage({
      type: 'assistant',
      content: `I've found ${mockRoute.suggestedCities.length} amazing stops along your route from ${data.origin.name} to ${data.destination.name}. Each one has been chosen for its unique character and hidden gems. Tap any city to explore!`,
    });
    setPhase('exploring');
  };

  // Handle city selection on map
  const handleCitySelect = useCallback(
    (cityId: string) => {
      selectCity(cityId);
      setShowCityPreview(true);
    },
    [selectCity]
  );

  // Handle proceeding - show confirmation modal first (WI-1.7)
  const handleProceed = useCallback(() => {
    // Clear any previous errors
    setGenerationError(null);
    // Show confirmation modal
    setShowConfirmModal(true);
  }, []);

  // Handle confirmed generation (WI-1.7)
  const handleConfirmGenerate = useCallback(async () => {
    const store = useDiscoveryStore.getState();
    const selectedCities = store.getSelectedCities();
    const favouritedPlaces = store.getFavouritedPlaces();
    const preferenceSignals = store.getPreferenceSignals();

    // Validation - minimum requirements
    if (selectedCities.length < 2) {
      setGenerationError('Please select at least an origin and destination.');
      return;
    }

    // Record the proceed action
    store.recordAction({ type: 'proceed_clicked' });

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Prepare route data for itinerary generation
      const routeData = {
        origin: {
          name: route?.origin.name,
          coordinates: route?.origin.coordinates,
          country: route?.origin.country,
        },
        destination: {
          name: route?.destination.name,
          coordinates: route?.destination.coordinates,
          country: route?.destination.country,
        },
        waypoints: selectedCities
          .filter((c) => !c.isFixed)
          .map((city) => ({
            name: city.name,
            coordinates: city.coordinates,
            country: city.country,
            nights: city.nights ?? city.suggestedNights ?? 1,
          })),
        startDate: tripSummary?.startDate,
        endDate: tripSummary?.endDate,
        totalNights: tripSummary?.totalNights,
      };

      // Prepare preferences including inferred preferences
      const preferences = {
        travellerType: tripSummary?.travellerType,
        favouritedPlaceIds: favouritedPlaces.map((p) => p.id),
        favouritedPlaceNames: favouritedPlaces.map((p) => p.name),
        topPlaceTypes: preferenceSignals.topPlaceTypes,
        prefersHiddenGems: preferenceSignals.prefersHiddenGems,
        averageNightsPerCity: preferenceSignals.averageNights,
      };

      // Store data for the generation page
      sessionStorage.setItem('discoveryRouteData', JSON.stringify(routeData));
      sessionStorage.setItem('discoveryPreferences', JSON.stringify(preferences));
      sessionStorage.setItem('selectedCities', JSON.stringify(selectedCities));
      sessionStorage.setItem('favouritedPlaces', JSON.stringify(favouritedPlaces));

      // CRITICAL: Also set route in spotlightStoreV2 for ItineraryGenerationPage
      // Transform discovery data to SpotlightRoute format
      const spotlightRoute = {
        id: `discovery-${Date.now()}`,
        origin: route?.origin.name || '',
        destination: route?.destination.name || '',
        agent: tripSummary?.travellerType || 'couple',
        budget: 'mid',
        cities: selectedCities.map((city, index) => ({
          city: city.name,
          name: city.name,
          country: city.country,
          coordinates: city.coordinates,
          nights: city.nights ?? city.suggestedNights ?? 1,
          isSelected: city.isSelected,
          position: index,
        })),
        landmarks: [],
        nightAllocations: selectedCities.reduce((acc, city) => {
          acc[city.name] = city.nights ?? city.suggestedNights ?? 1;
          return acc;
        }, {} as Record<string, number>),
      };

      useSpotlightStoreV2.getState().setRoute(spotlightRoute);
      console.log('📦 Set route in spotlightStoreV2:', spotlightRoute);

      // Update phase
      setPhase('generating');

      // Navigate to generation page
      navigate('/generate');
    } catch (err) {
      console.error('Failed to prepare itinerary generation:', err);
      setGenerationError(
        err instanceof Error
          ? err.message
          : 'Failed to prepare your itinerary. Please try again.'
      );
      setIsGenerating(false);
    }
  }, [route, tripSummary, navigate, setPhase]);

  // Handle going back to entry form
  const handleBack = useCallback(() => {
    reset();
    navigate('/new');
  }, [navigate, reset]);

  // Handle adding a new city from the modal
  const handleAddCity = useCallback(
    (cityData: {
      name: string;
      country: string;
      coordinates: { lat: number; lng: number };
      isSelected: boolean;
      suggestedNights: number;
      distanceFromRoute?: number;
    }) => {
      // Add the city to the store
      addCity({
        name: cityData.name,
        country: cityData.country,
        coordinates: cityData.coordinates,
        isSelected: cityData.isSelected,
        suggestedNights: cityData.suggestedNights,
        distanceFromRoute: cityData.distanceFromRoute,
        placeCount: 0, // Will be populated when Hidden Gems Engine is ready
        description: `Added by you`,
        // Mock places for now - will be fetched from API later
        places: generateMockPlacesForCity(cityData.name),
      });

      // Add companion message about the new city
      addCompanionMessage({
        type: 'assistant',
        content: `Great choice! I've added ${cityData.name} to your trip. ${
          cityData.distanceFromRoute && cityData.distanceFromRoute > 50
            ? `It's about ${cityData.distanceFromRoute}km from your main route, but it looks like it'll be worth the detour!`
            : `It fits nicely along your route.`
        }`,
      });

      // Show the city preview
      setShowCityPreview(true);
    },
    [addCity, addCompanionMessage]
  );

  // Loading state
  if (phase === 'loading') {
    return <DiscoveryLoadingState tripSummary={tripSummary} />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-rui-cream relative">
      {/* Map - Full screen on mobile, 70% on desktop */}
      <div
        className={`
          absolute inset-0
          ${isDesktop ? 'right-[380px]' : ''}
          transition-all duration-500 ease-out
        `}
      >
        <DiscoveryMap
          route={route}
          selectedCityId={selectedCityId}
          onCitySelect={handleCitySelect}
          onCityRemove={(cityId) => {
            // Toggle selection off (remove from trip but keep visible)
            useDiscoveryStore.getState().toggleCitySelection(cityId);
          }}
        />

        {/* Floating header - always visible */}
        <DiscoveryHeader
          tripSummary={tripSummary}
          route={route}
          onBack={handleBack}
          onProceed={handleProceed}
          onAddCity={() => setShowAddCityModal(true)}
          isDesktop={isDesktop}
        />

        {/* Map overlays for atmosphere */}
        <div className="pointer-events-none absolute inset-0">
          {/* Top vignette */}
          <div
            className="absolute top-0 left-0 right-0 h-32"
            style={{
              background: 'linear-gradient(to bottom, rgba(251, 249, 246, 0.8) 0%, transparent 100%)',
            }}
          />
          {/* Bottom vignette for mobile */}
          {!isDesktop && (
            <div
              className="absolute bottom-0 left-0 right-0 h-48"
              style={{
                background: 'linear-gradient(to top, rgba(251, 249, 246, 0.9) 0%, transparent 100%)',
              }}
            />
          )}
        </div>
      </div>

      {/* Companion Panel - Sidebar on desktop, bottom sheet on mobile */}
      <DiscoveryCompanionPanel
        route={route}
        tripSummary={tripSummary}
        isDesktop={isDesktop}
        isExpanded={isCompanionExpanded}
        onProceed={handleProceed}
      />

      {/* City Preview Modal - Shows when a city is selected */}
      <AnimatePresence>
        {showCityPreview && selectedCityId && route && (
          <DiscoveryCityPreview
            city={findCityById(route, selectedCityId)}
            onClose={() => {
              setShowCityPreview(false);
              selectCity(null);
            }}
            onToggleSelection={() => {
              useDiscoveryStore.getState().toggleCitySelection(selectedCityId);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add City Modal - Search and add custom cities */}
      <AnimatePresence>
        {showAddCityModal && (
          <AddCityModal
            isOpen={showAddCityModal}
            onClose={() => setShowAddCityModal(false)}
            onAddCity={handleAddCity}
            route={route}
          />
        )}
      </AnimatePresence>

      {/* Proceed Confirmation Modal (WI-1.7) */}
      <AnimatePresence>
        {showConfirmModal && route && tripSummary && (
          <ProceedConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => {
              setShowConfirmModal(false);
              setIsGenerating(false);
              setGenerationError(null);
            }}
            onConfirm={handleConfirmGenerate}
            route={route}
            tripSummary={tripSummary}
            selectedCities={useDiscoveryStore.getState().getSelectedCities()}
            favouritedPlaces={useDiscoveryStore.getState().getFavouritedPlaces()}
            inferredPreferences={useDiscoveryStore.getState().inferredPreferences}
            isGenerating={isGenerating}
            error={generationError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to find city by ID
function findCityById(route: DiscoveryRoute, cityId: string) {
  if (route.origin.id === cityId) return route.origin;
  if (route.destination.id === cityId) return route.destination;
  return route.suggestedCities.find((c) => c.id === cityId) || null;
}

// Helper to map Google Places types to our PlaceType enum
const PLACE_TYPE_MAP: Record<string, PlaceType> = {
  restaurant: 'restaurant',
  food: 'restaurant',
  cafe: 'cafe',
  coffee_shop: 'cafe',
  bar: 'bar',
  night_club: 'bar',
  museum: 'museum',
  art_gallery: 'gallery',
  gallery: 'gallery',
  park: 'park',
  natural_feature: 'park',
  tourist_attraction: 'landmark',
  point_of_interest: 'landmark',
  landmark: 'landmark',
  church: 'landmark',
  place_of_worship: 'landmark',
  store: 'shop',
  shopping_mall: 'shop',
  shop: 'shop',
  market: 'market',
  supermarket: 'market',
  viewpoint: 'viewpoint',
  experience: 'experience',
  spa: 'experience',
  gym: 'experience',
};

function mapToPlaceType(type: string | undefined): PlaceType {
  if (!type) return 'other';
  return PLACE_TYPE_MAP[type.toLowerCase()] || 'other';
}

// Generate mock places for a custom city added by the user
// Uses generic places since we don't have predefined data for custom cities
// Note: cityName could be used later to fetch real places from API
function generateMockPlacesForCity(_cityName: string): DiscoveryPlace[] {
  const customCityIndex = Date.now(); // Use timestamp for unique IDs
  return [
    { id: `${customCityIndex}-1`, name: 'Local Market', type: 'market', rating: 4.3, reviewCount: 450, isHiddenGem: false, description: 'Traditional local market', priceLevel: 1 },
    { id: `${customCityIndex}-2`, name: 'Historic Center', type: 'landmark', rating: 4.5, reviewCount: 1200, isHiddenGem: false, description: 'The heart of the old town' },
    { id: `${customCityIndex}-3`, name: 'Hidden Bistro', type: 'restaurant', rating: 4.6, reviewCount: 180, isHiddenGem: true, description: 'A local favorite off the tourist path', priceLevel: 2 },
    { id: `${customCityIndex}-4`, name: 'City Park', type: 'park', rating: 4.4, reviewCount: 890, isHiddenGem: false, description: 'Green oasis in the city center' },
  ];
}

// Generate mock places for a city
function generateMockPlaces(cityName: string, cityIndex: number): DiscoveryPlace[] {
  // Sample places data organized by city for realistic mock data
  const placesData: Record<string, DiscoveryPlace[]> = {
    Lyon: [
      { id: `lyon-1`, name: 'Les Halles de Lyon Paul Bocuse', type: 'market', rating: 4.7, reviewCount: 12400, isHiddenGem: false, description: 'Legendary covered market with gourmet delicacies', priceLevel: 3 },
      { id: `lyon-2`, name: 'Bouchon Chez Hugon', type: 'restaurant', rating: 4.5, reviewCount: 890, isHiddenGem: true, description: 'Authentic Lyonnaise cuisine in a historic setting', priceLevel: 2 },
      { id: `lyon-3`, name: 'Musée des Confluences', type: 'museum', rating: 4.6, reviewCount: 8200, isHiddenGem: false, description: 'Striking architecture housing science and anthropology exhibits' },
      { id: `lyon-4`, name: 'La Traboule', type: 'bar', rating: 4.3, reviewCount: 340, isHiddenGem: true, description: 'Hidden speakeasy in a Renaissance passageway', priceLevel: 2 },
      { id: `lyon-5`, name: 'Parc de la Tête d\'Or', type: 'park', rating: 4.8, reviewCount: 15600, isHiddenGem: false, description: 'Sprawling urban park with botanical garden and zoo' },
      { id: `lyon-6`, name: 'Café Comptoir Abel', type: 'cafe', rating: 4.4, reviewCount: 520, isHiddenGem: true, description: 'Historic café dating back to 1928', priceLevel: 2 },
    ],
    Dijon: [
      { id: `dijon-1`, name: 'Marché des Halles', type: 'market', rating: 4.6, reviewCount: 3200, isHiddenGem: false, description: 'Eiffel-designed market hall with regional specialties', priceLevel: 2 },
      { id: `dijon-2`, name: 'Musée des Beaux-Arts', type: 'museum', rating: 4.5, reviewCount: 2800, isHiddenGem: false, description: 'One of France\'s oldest art museums in the Ducal Palace' },
      { id: `dijon-3`, name: 'Le Pré aux Clercs', type: 'restaurant', rating: 4.7, reviewCount: 1100, isHiddenGem: true, description: 'Michelin-starred Burgundian cuisine', priceLevel: 4 },
      { id: `dijon-4`, name: 'La Chouette', type: 'landmark', rating: 4.4, reviewCount: 5600, isHiddenGem: false, description: 'Lucky owl statue - rub for good fortune' },
      { id: `dijon-5`, name: 'Jardin Darcy', type: 'park', rating: 4.3, reviewCount: 890, isHiddenGem: true, description: 'Romantic 19th-century garden with polar bear statue' },
    ],
    Avignon: [
      { id: `avignon-1`, name: 'Palais des Papes', type: 'landmark', rating: 4.7, reviewCount: 22000, isHiddenGem: false, description: 'Largest Gothic palace in the world' },
      { id: `avignon-2`, name: 'Le Moutardier du Pape', type: 'restaurant', rating: 4.4, reviewCount: 680, isHiddenGem: true, description: 'Traditional Provençal in a medieval setting', priceLevel: 3 },
      { id: `avignon-3`, name: 'Pont Saint-Bénézet', type: 'landmark', rating: 4.3, reviewCount: 8900, isHiddenGem: false, description: 'The famous "Pont d\'Avignon" from the song' },
      { id: `avignon-4`, name: 'Rocher des Doms', type: 'viewpoint', rating: 4.6, reviewCount: 4200, isHiddenGem: false, description: 'Hilltop garden with panoramic Rhône views' },
      { id: `avignon-5`, name: 'La Mirande', type: 'cafe', rating: 4.8, reviewCount: 290, isHiddenGem: true, description: 'Elegant tea salon in a cardinal\'s palace', priceLevel: 3 },
      { id: `avignon-6`, name: 'Collection Lambert', type: 'gallery', rating: 4.5, reviewCount: 1200, isHiddenGem: true, description: 'Contemporary art in an 18th-century mansion' },
    ],
    Marseille: [
      { id: `marseille-1`, name: 'Le Panier', type: 'landmark', rating: 4.5, reviewCount: 6800, isHiddenGem: false, description: 'Historic quarter with artisan shops and street art' },
      { id: `marseille-2`, name: 'Chez Fonfon', type: 'restaurant', rating: 4.6, reviewCount: 2100, isHiddenGem: true, description: 'Legendary bouillabaisse by the sea', priceLevel: 4 },
      { id: `marseille-3`, name: 'MuCEM', type: 'museum', rating: 4.7, reviewCount: 15400, isHiddenGem: false, description: 'Mediterranean civilizations in stunning architecture' },
      { id: `marseille-4`, name: 'Calanques National Park', type: 'park', rating: 4.9, reviewCount: 28000, isHiddenGem: false, description: 'Dramatic limestone cliffs and turquoise coves' },
      { id: `marseille-5`, name: 'Bar de la Marine', type: 'bar', rating: 4.2, reviewCount: 890, isHiddenGem: true, description: 'Historic bar from Pagnol\'s Marseille trilogy', priceLevel: 1 },
      { id: `marseille-6`, name: 'Notre-Dame de la Garde', type: 'viewpoint', rating: 4.8, reviewCount: 19200, isHiddenGem: false, description: 'Iconic basilica with city-wide panoramas' },
      { id: `marseille-7`, name: 'La Cantinetta', type: 'restaurant', rating: 4.4, reviewCount: 340, isHiddenGem: true, description: 'Tiny Italian gem in the Vieux Port', priceLevel: 2 },
    ],
    Montpellier: [
      { id: `montpellier-1`, name: 'Place de la Comédie', type: 'landmark', rating: 4.4, reviewCount: 5600, isHiddenGem: false, description: 'Grand pedestrian square with the Three Graces fountain' },
      { id: `montpellier-2`, name: 'Jardin des Plantes', type: 'park', rating: 4.6, reviewCount: 3400, isHiddenGem: false, description: 'France\'s oldest botanical garden (1593)' },
      { id: `montpellier-3`, name: 'Le Terminal #1', type: 'bar', rating: 4.3, reviewCount: 420, isHiddenGem: true, description: 'Craft cocktails in a converted warehouse', priceLevel: 2 },
      { id: `montpellier-4`, name: 'Musée Fabre', type: 'museum', rating: 4.7, reviewCount: 4100, isHiddenGem: false, description: 'World-class collection from Rubens to Soulages' },
      { id: `montpellier-5`, name: 'La Diligence', type: 'restaurant', rating: 4.5, reviewCount: 280, isHiddenGem: true, description: 'Slow-food Languedoc cuisine', priceLevel: 3 },
    ],
  };

  // Return places for the city, or generate generic ones
  const cityPlaces = placesData[cityName];
  if (cityPlaces) return cityPlaces;

  // Generic fallback places
  return [
    { id: `${cityIndex}-1`, name: 'Local Market', type: 'market', rating: 4.3, reviewCount: 450, isHiddenGem: false, priceLevel: 1 },
    { id: `${cityIndex}-2`, name: 'Historic Cathedral', type: 'landmark', rating: 4.5, reviewCount: 1200, isHiddenGem: false },
    { id: `${cityIndex}-3`, name: 'Hidden Bistro', type: 'restaurant', rating: 4.6, reviewCount: 180, isHiddenGem: true, priceLevel: 2 },
    { id: `${cityIndex}-4`, name: 'City Park', type: 'park', rating: 4.4, reviewCount: 890, isHiddenGem: false },
  ];
}

// Generate mock cities for development
function generateMockCities(
  origin: any,
  destination: any,
  totalNights: number
): DiscoveryCity[] {
  // Calculate midpoints along the route
  const latDiff = destination.coordinates.lat - origin.coordinates.lat;
  const lngDiff = destination.coordinates.lng - origin.coordinates.lng;

  const cityCount = Math.min(Math.max(2, Math.floor(totalNights / 2)), 5);

  const mockCities = [
    { name: 'Lyon', country: 'France', description: 'Gastronomic capital of France with 2,000 years of history', placeCount: 34 },
    { name: 'Dijon', country: 'France', description: 'Heart of Burgundy wine country and mustard capital', placeCount: 28 },
    { name: 'Avignon', country: 'France', description: 'Medieval city of Popes with stunning Provençal charm', placeCount: 31 },
    { name: 'Marseille', country: 'France', description: 'France\'s oldest city with Mediterranean soul', placeCount: 45 },
    { name: 'Montpellier', country: 'France', description: 'Vibrant student city with medieval charm', placeCount: 26 },
  ];

  return mockCities.slice(0, cityCount).map((city, index) => {
    const t = (index + 1) / (cityCount + 1);
    return {
      id: `city-${index}`,
      name: city.name,
      country: city.country,
      description: city.description,
      placeCount: city.placeCount,
      coordinates: {
        lat: origin.coordinates.lat + latDiff * t + (Math.random() - 0.5) * 0.5,
        lng: origin.coordinates.lng + lngDiff * t + (Math.random() - 0.5) * 0.5,
      },
      isSelected: index === 0, // First suggestion selected by default
      isFixed: false,
      suggestedNights: 1 + Math.floor(Math.random() * 2),
      distanceFromRoute: Math.floor(Math.random() * 20),
      places: generateMockPlaces(city.name, index),
    };
  });
}

export default DiscoveryPhaseContainer;
