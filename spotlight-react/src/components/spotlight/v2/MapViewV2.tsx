import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { fetchMapboxRoute, formatDistance, formatDuration } from '../../../services/mapboxRoutes';
import { fetchLandmarksInRegion, calculateBoundingBox, getLandmarkImagePath, type Landmark } from '../../../services/landmarks';
import CityMarker from './CityMarker';
import LandmarkMarker from './LandmarkMarker';
import LandmarkDetailsModal from './LandmarkDetailsModal';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

  // Use explicit selectors to ensure proper reactivity
  const route = useSpotlightStoreV2((state) => state.route);
  const selectedCityIndex = useSpotlightStoreV2((state) => state.selectedCityIndex);
  const setSelectedCity = useSpotlightStoreV2((state) => state.setSelectedCity);
  const mapCenter = useSpotlightStoreV2((state) => state.mapCenter);
  const mapZoom = useSpotlightStoreV2((state) => state.mapZoom);
  const setMapCenter = useSpotlightStoreV2((state) => state.setMapCenter);
  const getCityName = useSpotlightStoreV2((state) => state.getCityName);
  const getAgentColors = useSpotlightStoreV2((state) => state.getAgentColors);

  const agentColors = getAgentColors();

  console.log('🔍 MapViewV2 render - Landmarks in route:', route?.landmarks.length || 0);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialCenter: [number, number] = mapCenter || [2.3522, 48.8566]; // Default to Paris
    const initialZoom = mapZoom || 6;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      bearing: 0,
      // Disable 3D features for strictly 2D map
      projection: { name: 'mercator' },
      minPitch: 0,
      maxPitch: 0
    });

    map.current.on('load', () => {
      console.log('✅ Map loaded (2D mode)');
      setIsMapLoaded(true);

      // Disable 3D buildings layer if it exists
      const layers = map.current!.getStyle().layers;
      const buildingLayer = layers?.find(l => l.id === 'building');
      if (buildingLayer) {
        map.current!.removeLayer('building');
      }
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

    // Remove existing route layers
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
      // Add route as a source
      map.current!.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: mapboxRoute.geometry
        }
      });

      // Add route line layer
      map.current!.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': agentColors.accent,
          'line-width': 6,
          'line-opacity': 0.8
        }
      });

      // Store total distance and duration in route
      console.log(`📍 Route: ${formatDistance(mapboxRoute.distance)}, ${formatDuration(mapboxRoute.duration)}`);
    }

    // Add city markers
    route.cities.forEach((city, index) => {
      console.log(`🎯 Adding marker for city ${index}:`, {
        cityObject: city.city,
        topLevelCoords: city.coordinates
      });
      // Use top-level coordinates directly
      const coords = city.coordinates;
      console.log(`  → Using coords:`, coords);
      console.log(`  → coords type check:`, {
        isArray: Array.isArray(coords),
        hasLat: coords && 'lat' in coords,
        hasLng: coords && 'lng' in coords,
        latValue: coords?.lat,
        lngValue: coords?.lng
      });
      if (!coords) {
        console.warn(`  ⚠️ No coordinates for city ${index}`);
        return;
      }

      const cityName = getCityName(city.city);
      const markerId = `city-${index}`;
      console.log(`  📍 Placing marker at [lng=${coords.lng}, lat=${coords.lat}]`);
      console.log(`  📍 Geographic check: ${cityName} should be at latitude ${coords.lat}° (positive = north of equator)`);
      console.log(`  📍 Geographic check: ${cityName} should be at longitude ${coords.lng}° (negative = west, positive = east)`);

      // VERIFY: Mapbox uses [lng, lat] format, not [lat, lng]
      const mapboxCoords: [number, number] = [coords.lng, coords.lat];
      console.log(`  📍 Final Mapbox coords for ${cityName}: [${mapboxCoords[0]}, ${mapboxCoords[1]}]`);

      // Create a div for the marker
      const el = document.createElement('div');
      const root = createRoot(el);

      // Render CityMarker component
      root.render(
        <CityMarker
          index={index}
          cityName={cityName}
          isSelected={selectedCityIndex === index}
          isHovered={hoveredMarkerId === markerId}
          agentColors={agentColors}
          onClick={() => setSelectedCity(index)}
          onMouseEnter={() => setHoveredMarkerId(markerId)}
          onMouseLeave={() => setHoveredMarkerId(null)}
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
      const el = document.createElement('div');
      el.style.position = 'relative';
      el.style.cursor = 'pointer';

      // Main pin circle
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
      pin.style.position = 'relative';

      if (landmarkImagePath) {
        // Use landmark image if available
        pin.style.background = 'white';
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
        pin.textContent = '⭐';
      }

      // Pin pointer triangle
      const pointer = document.createElement('div');
      pointer.style.position = 'absolute';
      pointer.style.left = '50%';
      pointer.style.transform = 'translateX(-50%)';
      pointer.style.width = '0';
      pointer.style.height = '0';
      pointer.style.borderLeft = '6px solid transparent';
      pointer.style.borderRight = '6px solid transparent';
      pointer.style.borderTop = `8px solid ${agentColors.secondary}`;
      pointer.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

      el.appendChild(pin);
      el.appendChild(pointer);

      // Add click handler
      el.onclick = () => {
        console.log('Clicked route landmark:', landmark.name);
        // TODO: Show landmark details or allow removal
      };

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([landmark.coordinates.lng, landmark.coordinates.lat])
        .addTo(map.current!);

      console.log(`     ✅ Marker created and added to map!`);
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
      <div ref={mapContainer} className="w-full h-full" />

      {/* Landmark Details Modal */}
      <LandmarkDetailsModal
        landmark={selectedLandmark}
        onClose={() => setSelectedLandmark(null)}
      />
    </div>
  );
};

export default MapViewV2;
