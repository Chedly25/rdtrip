import { useEffect, useRef, useState } from 'react';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const MapViewV2 = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const {
    route,
    mapCenter,
    mapZoom,
    setMapCenter,
    getCityCoordinates,
    getAgentColors
  } = useSpotlightStoreV2();

  const agentColors = getAgentColors();

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || map.current) return;

    // Initialize map
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialCenter: [number, number] = mapCenter || [2.3522, 48.8566]; // Default to Paris
    const initialZoom = mapZoom || 6;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
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

  useEffect(() => {
    if (!map.current || !isMapLoaded || !route) return;

    // Clear existing markers and routes
    // TODO: Implement in Phase 2

    // Add city markers
    route.cities.forEach((city, index) => {
      const coords = getCityCoordinates(city.city);
      if (!coords) return;

      // Create marker
      const el = document.createElement('div');
      el.className = 'city-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: ${agentColors.primary};
        border: 3px solid ${agentColors.accent};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      `;
      el.textContent = (index + 1).toString();

      new mapboxgl.Marker(el)
        .setLngLat([coords.lng, coords.lat])
        .addTo(map.current!);
    });

    // Fit bounds to show all cities
    if (route.cities.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      route.cities.forEach(city => {
        const coords = getCityCoordinates(city.city);
        if (coords) {
          bounds.extend([coords.lng, coords.lat]);
        }
      });

      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: { top: 100, bottom: 200, left: 100, right: 100 },
          duration: 1000
        });
      }
    }
  }, [isMapLoaded, route, agentColors]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
        <div className="text-center p-8">
          <p className="text-white text-lg mb-2">Map unavailable</p>
          <p className="text-gray-400 text-sm">
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
