import { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { fetchMapboxRoute, formatDistance, formatDuration } from '../../../services/mapboxRoutes';
import { fetchLandmarksInRegion, calculateBoundingBox, getLandmarkImagePath, type Landmark } from '../../../services/landmarks';
// Legacy marker - keeping for reference, now using TravelStampMarker
// import CityMarker from './CityMarker';
import LandmarkMarker from './LandmarkMarker';
import LandmarkDetailsModal from './LandmarkDetailsModal';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Editorial Cartography Map System
import {
  initializeEditorialMap,
  injectMapCSSVariables,
  MapOverlays,
  MAP_CONFIG,
  addRouteLayersToMap,
  ROUTE_LAYER_IDS,
  TravelStampMarker,
  useJourneyOrchestrator,
  CelebrationParticles,
  RouteOverviewBadge,
  useMapInteractions,
} from './map';

// Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MapViewV2 = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [nearbyLandmarks, setNearbyLandmarks] = useState<Landmark[]>([]);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);

  // Orchestration state
  const [routeGeometry, setRouteGeometry] = useState<GeoJSON.LineString | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_visibleMarkerIndices, setVisibleMarkerIndices] = useState<Set<number>>(new Set());
  const [celebrationTrigger, setCelebrationTrigger] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [celebrationPosition, _setCelebrationPosition] = useState({ x: 0, y: 0 });
  const hasPlayedInitialAnimation = useRef(false);

  // Route statistics for overview badge
  const [routeStats, setRouteStats] = useState<{
    totalDistance: string;
    totalDuration: string;
  } | null>(null);

  // Use explicit selectors to ensure proper reactivity
  const route = useSpotlightStoreV2((state) => state.route);
  const selectedCityIndex = useSpotlightStoreV2((state) => state.selectedCityIndex);
  const setSelectedCity = useSpotlightStoreV2((state) => state.setSelectedCity);
  const mapCenter = useSpotlightStoreV2((state) => state.mapCenter);
  const mapZoom = useSpotlightStoreV2((state) => state.mapZoom);
  const setMapCenter = useSpotlightStoreV2((state) => state.setMapCenter);
  const getCityName = useSpotlightStoreV2((state) => state.getCityName);
  const getAgentColors = useSpotlightStoreV2((state) => state.getAgentColors);

  // Animation triggers from companion
  const pendingFlyTo = useSpotlightStoreV2((state) => state.pendingFlyTo);
  const clearFlyTo = useSpotlightStoreV2((state) => state.clearFlyTo);

  const agentColors = getAgentColors();

  // Marker drop callback for orchestration
  const handleMarkerDrop = useCallback((index: number, type: 'city' | 'landmark') => {
    setVisibleMarkerIndices(prev => new Set([...prev, type === 'city' ? index : index + 100]));
  }, []);

  // Journey orchestrator hook
  const orchestrator = useJourneyOrchestrator({
    map: map.current,
    isMapLoaded,
    routeGeometry,
    cityCount: route?.cities.length || 0,
    landmarkCount: route?.landmarks.length || 0,
    onMarkerDrop: handleMarkerDrop,
    onPhaseChange: (phase) => {
      console.log(`🎬 Orchestration phase: ${phase}`);
    },
  });

  // Map interactions hook for micro-interactions
  const mapInteractions = useMapInteractions({
    map: map.current,
    isMapLoaded,
  });

  console.log('🔍 MapViewV2 render - Landmarks in route:', route?.landmarks.length || 0);

  // Inject CSS variables for map styling on mount
  useEffect(() => {
    injectMapCSSVariables();
  }, []);

  // Initialize map with Editorial Cartography style
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialCenter: [number, number] = mapCenter || [2.3522, 48.8566]; // Default to Paris
    const initialZoom = mapZoom || MAP_CONFIG.defaultZoom;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Base style, will be transformed
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      projection: { name: 'mercator' },
      minPitch: MAP_CONFIG.defaultPitch,
      maxPitch: MAP_CONFIG.maxPitch,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    });

    // Apply editorial cartography style transformations
    initializeEditorialMap(map.current);

    map.current.on('load', () => {
      console.log('✨ Map loaded with Editorial Cartography style');
      setIsMapLoaded(true);
    });

    map.current.on('move', () => {
      if (map.current) {
        const center = map.current.getCenter();
        setMapCenter([center.lng, center.lat]);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle animated fly-to requests from companion
  useEffect(() => {
    if (!pendingFlyTo || !map.current || !isMapLoaded) return;

    // Execute fly animation with smooth easing
    map.current.flyTo({
      center: pendingFlyTo.center,
      zoom: pendingFlyTo.zoom || 10,
      duration: 2000,
      essential: true,
      easing: (t) => {
        // Smooth ease-in-out curve
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      }
    });

    // Clear the pending fly-to after animation starts
    clearFlyTo();
  }, [pendingFlyTo, isMapLoaded, clearFlyTo]);

  // Fetch nearby landmarks when route changes
  useEffect(() => {
    if (!route) return;

    const fetchLandmarks = async () => {
      // Get all city coordinates
      const cityCoords = route.cities
        .map(city => city.coordinates)
        .filter((coord): coord is { lat: number; lng: number } => coord !== null);

      if (cityCoords.length === 0) return;

      // Calculate bounding box with 30% padding
      const bounds = calculateBoundingBox(cityCoords, 30);

      // Fetch landmarks in the region
      const landmarks = await fetchLandmarksInRegion(bounds);
      console.log(`🏛️ Loaded ${landmarks.length} nearby landmarks`);
      setNearbyLandmarks(landmarks);
    };

    fetchLandmarks();
  }, [route]);

  // Render route and markers when data changes
  useEffect(() => {
    if (!map.current || !isMapLoaded || !route) return;

    console.log('🔄 MapViewV2 useEffect triggered! Landmarks in route:', route.landmarks.length);
    renderRouteAndMarkers();
  }, [isMapLoaded, route, selectedCityIndex, agentColors, nearbyLandmarks]); // Added nearbyLandmarks to re-render when landmarks load

  const renderRouteAndMarkers = async () => {
    if (!map.current || !route) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Remove existing route layers (all animated layers)
    Object.values(ROUTE_LAYER_IDS).forEach(layerId => {
      if (map.current!.getLayer(layerId)) {
        try {
          map.current!.removeLayer(layerId);
        } catch {
          // Ignore
        }
      }
    });
    // Also check for legacy 'route' layer
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Get all coordinates for the route (cities + landmarks in order)
    console.log('🗺️ MapViewV2: Building route waypoints from', route.cities.length, 'cities and', route.landmarks.length, 'landmarks');

    // Build route waypoints by inserting landmarks at their optimal positions
    const waypoints: [number, number][] = [];

    route.cities.forEach((city, cityIndex) => {
      const coords = city.coordinates;
      if (!coords) {
        console.warn(`  ⚠️ No coordinates for city ${cityIndex}`);
        return;
      }

      // Add city coordinate
      waypoints.push([coords.lng, coords.lat]);
      console.log(`  📍 Added city ${cityIndex} at [${coords.lng}, ${coords.lat}]`);

      // Add any landmarks that should be inserted after this city
      const landmarksAfterThisCity = route.landmarks.filter(
        landmark => landmark.insertAfterCityIndex === cityIndex
      );

      landmarksAfterThisCity.forEach(landmark => {
        waypoints.push([landmark.coordinates.lng, landmark.coordinates.lat]);
        console.log(`  ⭐ Added landmark "${landmark.name}" at [${landmark.coordinates.lng}, ${landmark.coordinates.lat}]`);
      });
    });

    console.log(`🛣️ Total waypoints for route: ${waypoints.length} (${route.cities.length} cities + ${route.landmarks.length} landmarks)`);

    if (waypoints.length < 2) {
      console.warn('Not enough waypoints to render route');
      return;
    }

    // Fetch route from Mapbox with all waypoints (cities + landmarks)
    const mapboxRoute = await fetchMapboxRoute(waypoints);

    if (mapboxRoute && mapboxRoute.geometry) {
      // Store geometry for orchestration
      setRouteGeometry(mapboxRoute.geometry as GeoJSON.LineString);

      // Add animated route line with glow effect
      // This replaces the old simple route layer with our editorial design
      addRouteLayersToMap(map.current, mapboxRoute.geometry, agentColors);

      // Store route stats for the overview badge
      const formattedDistance = formatDistance(mapboxRoute.distance);
      const formattedDuration = formatDuration(mapboxRoute.duration);
      setRouteStats({
        totalDistance: formattedDistance,
        totalDuration: formattedDuration,
      });
      console.log(`📍 Route: ${formattedDistance}, ${formattedDuration}`);

      // Trigger initial orchestration on first route load
      if (!hasPlayedInitialAnimation.current && waypoints.length >= 2) {
        hasPlayedInitialAnimation.current = true;
        const bounds: [[number, number], [number, number]] = [
          [Math.min(...waypoints.map(w => w[0])), Math.min(...waypoints.map(w => w[1]))],
          [Math.max(...waypoints.map(w => w[0])), Math.max(...waypoints.map(w => w[1]))]
        ];
        // Small delay to let markers render first
        setTimeout(() => {
          orchestrator.playSequence(bounds);
        }, 100);
      }
    }

    // Add city markers with Travel Stamp design
    route.cities.forEach((city, index) => {
      const coords = city.coordinates;
      if (!coords) {
        console.warn(`⚠️ No coordinates for city ${index}`);
        return;
      }

      const cityName = getCityName(city.city);
      const country = typeof city.city === 'object' ? city.city.country : undefined;
      const markerId = `city-${index}`;
      const mapboxCoords: [number, number] = [coords.lng, coords.lat];

      // Create a div for the Travel Stamp marker
      const el = document.createElement('div');
      const root = createRoot(el);

      // Render TravelStampMarker - the new editorial design
      root.render(
        <TravelStampMarker
          index={index}
          cityName={cityName}
          country={country}
          nights={city.nights || 0}
          isSelected={selectedCityIndex === index}
          isHovered={hoveredMarkerId === markerId}
          agentColors={agentColors}
          onClick={() => setSelectedCity(index)}
          onMouseEnter={() => {
            setHoveredMarkerId(markerId);
            // Highlight route segment on hover
            if (index < route.cities.length - 1) {
              mapInteractions.highlightRouteSegment(index, index + 1);
            }
          }}
          onMouseLeave={() => {
            setHoveredMarkerId(null);
            mapInteractions.resetRouteHighlight();
          }}
        />
      );

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat(mapboxCoords)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Add markers for landmarks already added to route (with remove button)
    console.log('📍 Rendering route landmarks:', route.landmarks.length);
    route.landmarks.forEach((landmark, index) => {
      console.log(`  → Adding marker for route landmark ${index}: ${landmark.name}`);
      console.log(`     Coordinates:`, landmark.coordinates);
      console.log(`     Mapbox LngLat: [${landmark.coordinates.lng}, ${landmark.coordinates.lat}]`);

      const landmarkImagePath = getLandmarkImagePath(landmark.name);

      // Create landmark marker with HTML (not React to avoid rendering issues)
      // IMPORTANT: Use flexbox column layout so the pointer is INSIDE the element bounds
      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.cursor = 'pointer';
      el.style.width = '40px';

      // Pin circle
      const pin = document.createElement('div');
      pin.style.width = '40px';
      pin.style.height = '40px';
      pin.style.borderRadius = '50%';
      pin.style.border = '3px solid white';
      pin.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
      pin.style.display = 'flex';
      pin.style.alignItems = 'center';
      pin.style.justifyContent = 'center';
      pin.style.overflow = 'hidden';
      pin.style.background = 'white';
      pin.style.flexShrink = '0';

      if (landmarkImagePath) {
        // Use landmark image if available
        const img = document.createElement('img');
        img.src = landmarkImagePath;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        pin.appendChild(img);
      } else {
        // Use gradient with star icon
        pin.style.background = `linear-gradient(135deg, ${agentColors.accent}, ${agentColors.secondary})`;
        pin.style.fontSize = '20px';
        pin.style.color = 'white';
        pin.textContent = '⭐';
      }

      el.appendChild(pin);

      // Pin pointer triangle (INSIDE the flex container, so it's part of element height)
      const pointer = document.createElement('div');
      pointer.style.width = '0';
      pointer.style.height = '0';
      pointer.style.borderLeft = '8px solid transparent';
      pointer.style.borderRight = '8px solid transparent';
      pointer.style.borderTop = '10px solid white';
      pointer.style.marginTop = '-2px'; // Overlap slightly with circle
      pointer.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
      pointer.style.flexShrink = '0';

      el.appendChild(pointer);

      // Add click handler
      el.onclick = () => {
        console.log('Clicked route landmark:', landmark.name);
        // TODO: Show landmark details or allow removal
      };

      console.log(`     🎨 Created landmark pin with ${landmarkImagePath ? 'image' : 'star icon'}`);

      // Validate coordinates before creating marker
      const lng = landmark.coordinates?.lng;
      const lat = landmark.coordinates?.lat;

      if (!lng || !lat || isNaN(lng) || isNaN(lat)) {
        console.error(`     ❌ Invalid coordinates for landmark ${landmark.name}:`, landmark.coordinates);
        return;
      }

      console.log(`     📍 Setting marker at [${lng}, ${lat}]`);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      console.log(`     ✅ Marker created and added to map at [${lng}, ${lat}]`);
      markersRef.current.push(marker);
    });

    // Add markers for nearby landmarks (clickable to view details and add to route)
    nearbyLandmarks.forEach((landmark, index) => {
      // Don't show landmarks already in route
      const isInRoute = route.landmarks.some(rl => rl.name === landmark.name);
      if (isInRoute) return;

      const markerId = `nearby-landmark-${index}`;
      const landmarkImagePath = getLandmarkImagePath(landmark.name);

      const el = document.createElement('div');
      const root = createRoot(el);

      root.render(
        <LandmarkMarker
          landmarkName={landmark.name}
          landmarkImage={landmarkImagePath}
          isHovered={hoveredMarkerId === markerId}
          agentColors={agentColors}
          onClick={() => {
            console.log('Clicked nearby landmark:', landmark.name);
            setSelectedLandmark(landmark);
          }}
          onMouseEnter={() => setHoveredMarkerId(markerId)}
          onMouseLeave={() => setHoveredMarkerId(null)}
        />
      );

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([landmark.lng, landmark.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all waypoints
    if (waypoints.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      waypoints.forEach(coord => {
        bounds.extend(coord);
      });

      if (!bounds.isEmpty()) {
        map.current!.fitBounds(bounds, {
          padding: { top: 120, bottom: 250, left: 100, right: 100 },
          duration: 1000,
          maxZoom: 12
        });
      }
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-gray-900 text-lg mb-2">Map unavailable</p>
          <p className="text-gray-600 text-sm">
            Mapbox token not configured. Set VITE_MAPBOX_TOKEN in your environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Editorial Cartography Atmospheric Overlays */}
      <MapOverlays showDecorations={true} />

      {/* Celebration Particles for landmark additions */}
      <CelebrationParticles
        trigger={celebrationTrigger}
        position={celebrationPosition}
        onComplete={() => setCelebrationTrigger(false)}
      />

      {/* Route Overview Badge */}
      {routeStats && route && (
        <RouteOverviewBadge
          totalDistance={routeStats.totalDistance}
          totalDuration={routeStats.totalDuration}
          cityCount={route.cities.length}
          landmarkCount={route.landmarks.length}
          isVisible={orchestrator.isComplete || !orchestrator.isPlaying}
        />
      )}

      {/* Landmark Details Modal */}
      <LandmarkDetailsModal
        landmark={selectedLandmark}
        onClose={() => setSelectedLandmark(null)}
      />
    </div>
  );
};

export default MapViewV2;
