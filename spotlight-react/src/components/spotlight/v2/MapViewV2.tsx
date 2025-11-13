import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import { fetchMapboxRoute, formatDistance, formatDuration } from '../../../services/mapboxRoutes';
import CityMarker from './CityMarker';
import LandmarkMarker from './LandmarkMarker';
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

  const {
    route,
    selectedCityIndex,
    setSelectedCity,
    mapCenter,
    mapZoom,
    setMapCenter,
    getCityCoordinates,
    getCityName,
    getAgentColors,
    removeLandmark
  } = useSpotlightStoreV2();

  const agentColors = getAgentColors();

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
      bearing: 0
    });

    map.current.on('load', () => {
      console.log('✅ Map loaded');
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

  // Render route and markers when data changes
  useEffect(() => {
    if (!map.current || !isMapLoaded || !route) return;

    renderRouteAndMarkers();
  }, [isMapLoaded, route, selectedCityIndex, hoveredMarkerId, agentColors]);

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
    const cityCoords: [number, number][] = route.cities
      .map(city => getCityCoordinates(city.city))
      .filter((coord): coord is { lat: number; lng: number } => coord !== null)
      .map(coord => [coord.lng, coord.lat]);

    if (cityCoords.length < 2) {
      console.warn('Not enough coordinates to render route');
      return;
    }

    // Fetch route from Mapbox
    const mapboxRoute = await fetchMapboxRoute(cityCoords);

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
      const coords = getCityCoordinates(city.city);
      if (!coords) return;

      const cityName = getCityName(city.city);
      const markerId = `city-${index}`;

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
        .setLngLat([coords.lng, coords.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Add landmark markers
    route.landmarks.forEach((landmark, index) => {
      const markerId = `landmark-${index}`;

      // Try to find matching landmark image
      const landmarkImagePath = getLandmarkImage(landmark.name);

      // Create a div for the marker
      const el = document.createElement('div');
      const root = createRoot(el);

      // Render LandmarkMarker component
      root.render(
        <LandmarkMarker
          landmarkName={landmark.name}
          landmarkImage={landmarkImagePath}
          isHovered={hoveredMarkerId === markerId}
          detourInfo={
            landmark.detourKm && landmark.detourMinutes
              ? { km: landmark.detourKm, minutes: landmark.detourMinutes }
              : undefined
          }
          agentColors={agentColors}
          onClick={() => {
            // TODO: Show landmark details modal
            console.log('Clicked landmark:', landmark.name);
          }}
          onRemove={() => removeLandmark(landmark.id)}
          onMouseEnter={() => setHoveredMarkerId(markerId)}
          onMouseLeave={() => setHoveredMarkerId(null)}
        />
      );

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
        .setLngLat([landmark.coordinates.lng, landmark.coordinates.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all points
    if (cityCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      cityCoords.forEach(coord => {
        bounds.extend(coord);
      });

      route.landmarks.forEach(landmark => {
        bounds.extend([landmark.coordinates.lng, landmark.coordinates.lat]);
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

  // Helper to get landmark image path
  const getLandmarkImage = (landmarkName: string): string | undefined => {
    // Map landmark names to image filenames
    const landmarkMap: Record<string, string> = {
      'Eiffel Tower': '/images/landmarks/eiffel_tower.png',
      'Colosseum': '/images/landmarks/colosseum.png',
      'Big Ben': '/images/landmarks/big_ben.png',
      'Sagrada Familia': '/images/landmarks/sagrada_familia.png',
      'Arc de Triomphe': '/images/landmarks/arc_de_triomphe.png',
      'Notre Dame': '/images/landmarks/notre_dame.png',
      'Acropolis': '/images/landmarks/acropolis_athens.png',
      'Parthenon': '/images/landmarks/parthenon.png',
      'Leaning Tower of Pisa': '/images/landmarks/pisa.png',
      'Trevi Fountain': '/images/landmarks/trevi_fountain.png',
      'Brandenburg Gate': '/images/landmarks/brandenburg_gate.png',
      'Neuschwanstein Castle': '/images/landmarks/neuschwanstein_castle.png',
      'Stonehenge': '/images/landmarks/stonehenge.png',
      'Tower Bridge': '/images/landmarks/tower_bridge.png',
      'Edinburgh Castle': '/images/landmarks/edinburgh_castle.png',
      'Mont Saint-Michel': '/images/landmarks/mont_saint_michel.png',
      'Versailles': '/images/landmarks/versailles.png',
      'Charles Bridge': '/images/landmarks/charles_bridge_prague.png',
      'St. Peter\'s Basilica': '/images/landmarks/st_peter.png',
      'Alhambra': '/images/landmarks/alhambra_granada.png',
      'Atomium': '/images/landmarks/atomium_brussels.png',
      'Cologne Cathedral': '/images/landmarks/cologne_cathedral.png',
      'Duomo di Milano': '/images/landmarks/duomo_milano.png',
      'Cliffs of Moher': '/images/landmarks/cliffs_of_moher.png',
      'Geirangerfjord': '/images/landmarks/geirangerfjord_norway.png',
      'Hallstatt': '/images/landmarks/hallstatt_village_austria.png',
      'Kinderdijk Windmills': '/images/landmarks/kinderdijk_windmills.png',
      'Little Mermaid': '/images/landmarks/little_mermaid_copenhagen.png',
      'Matterhorn': '/images/landmarks/matterhorn.png',
      'Pena Palace': '/images/landmarks/pena_palace.png',
      'Jerónimos Monastery': '/images/landmarks/jeronimo-monestary.png',
      'Schönbrunn Palace': '/images/landmarks/schonnbrun_vienna.png',
      'St. Basil\'s Cathedral': '/images/landmarks/st_basils_moscow.png',
      'St. Mark\'s Basilica': '/images/landmarks/st_mark_venice.png'
    };

    // Try exact match first
    if (landmarkMap[landmarkName]) {
      return landmarkMap[landmarkName];
    }

    // Try partial match
    const partialMatch = Object.keys(landmarkMap).find(key =>
      landmarkName.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(landmarkName.toLowerCase())
    );

    return partialMatch ? landmarkMap[partialMatch] : undefined;
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
    </div>
  );
};

export default MapViewV2;
