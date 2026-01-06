import { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DiscoveryCityPin } from './DiscoveryCityPin';
import type { DiscoveryRoute } from '../../stores/discoveryStore';

// Mapbox access token - use env var or fallback to hardcoded token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';

interface DiscoveryMapProps {
  route: DiscoveryRoute | null;
  selectedCityId: string | null;
  onCitySelect: (cityId: string) => void;
  onCityRemove?: (cityId: string) => void;
}

/**
 * DiscoveryMap
 *
 * Map component for the discovery phase showing the route and suggested cities.
 * Uses a warm, editorial cartography style matching the Waycraft aesthetic.
 */
export function DiscoveryMap({
  route,
  selectedCityId,
  onCitySelect,
  onCityRemove,
}: DiscoveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  // Track route drawing state to prevent race conditions
  const routeDrawingRef = useRef<{ abortController: AbortController | null; isDrawing: boolean }>({
    abortController: null,
    isDrawing: false,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [2.3522, 48.8566], // Default to Paris
      zoom: 5,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);

      // Add custom styling for warm editorial look
      if (map.current) {
        // Warm up the water color
        map.current.setPaintProperty('water', 'fill-color', '#E8E4DE');

        // Soften land colors
        map.current.setPaintProperty('land', 'background-color', '#F5F2ED');
      }
    });

    // Disable scroll zoom for cleaner experience
    map.current.scrollZoom.disable();

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'bottom-right'
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Track previous route reference for bounds fitting
  const prevRouteRef = useRef<DiscoveryRoute | null>(null);

  // Helper to check if coordinates are valid (not 0,0 or missing)
  const isValidCoordinate = (coord: { lat: number; lng: number } | undefined): coord is { lat: number; lng: number } => {
    if (!coord) return false;
    // Filter out (0, 0) coordinates - this is in the Atlantic Ocean and indicates missing data
    if (coord.lat === 0 && coord.lng === 0) return false;
    // Also check for reasonable bounds
    if (Math.abs(coord.lat) > 90 || Math.abs(coord.lng) > 180) return false;
    return true;
  };

  // Update map when route changes
  useEffect(() => {
    if (!map.current || !isMapLoaded || !route) return;

    // Only fit bounds when route first loads or cities are added (not just selection changes)
    const routeChanged = !prevRouteRef.current ||
      prevRouteRef.current.suggestedCities.length !== route.suggestedCities.length;

    if (routeChanged) {
      // Fit bounds to show full route - filter out invalid coordinates
      const allCoords = [
        route.origin.coordinates,
        ...route.suggestedCities.map((c) => c.coordinates),
        route.destination.coordinates,
      ].filter(isValidCoordinate);

      // Only fit bounds if we have at least 2 valid coordinates
      if (allCoords.length >= 2) {
        const bounds = new mapboxgl.LngLatBounds();
        allCoords.forEach((coord) => {
          bounds.extend([coord.lng, coord.lat]);
        });

        map.current.fitBounds(bounds, {
          padding: { top: 180, bottom: 200, left: 60, right: 60 },
          duration: 1500,
          easing: (t) => 1 - Math.pow(1 - t, 3), // Ease out cubic
        });
      }
    }

    prevRouteRef.current = route;
  }, [route, isMapLoaded]);

  // Draw route line between cities using Mapbox Directions API
  const drawRouteLine = useCallback(async (route: DiscoveryRoute) => {
    if (!map.current) return;

    const sourceId = 'discovery-route';
    const layerId = 'discovery-route-line';

    // Cancel any previous route drawing request
    if (routeDrawingRef.current.abortController) {
      routeDrawingRef.current.abortController.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    routeDrawingRef.current.abortController = abortController;
    routeDrawingRef.current.isDrawing = true;

    // Helper to safely remove existing source/layer
    const cleanupExistingRoute = () => {
      try {
        if (map.current?.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }
      } catch (e) {
        // Ignore cleanup errors
        console.log('Route cleanup:', e);
      }
    };

    // Remove existing layer/source first
    cleanupExistingRoute();

    // Build coordinates for selected cities only - filter out invalid coordinates
    const waypoints = [
      route.origin.coordinates,
      ...route.suggestedCities
        .filter((c) => c.isSelected)
        .map((c) => c.coordinates),
      route.destination.coordinates,
    ].filter((coord) => coord && (coord.lat !== 0 || coord.lng !== 0));

    // Format coordinates for Mapbox Directions API: lng,lat pairs separated by ;
    const coordsString = waypoints
      .map((c) => `${c.lng},${c.lat}`)
      .join(';');

    try {
      // Fetch actual driving route from Mapbox Directions API
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`,
        { signal: abortController.signal }
      );

      // Check if this request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch driving route');
      }

      const data = await response.json();

      // Check again after JSON parsing
      if (abortController.signal.aborted) {
        return;
      }

      if (data.routes && data.routes.length > 0 && map.current) {
        const routeGeometry = data.routes[0].geometry;

        // Clean up again before adding (in case another call started)
        cleanupExistingRoute();

        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 10));

        // Final check before adding
        if (abortController.signal.aborted || !map.current) {
          return;
        }

        // Add the actual driving route
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: routeGeometry,
          },
        });

        // Add solid route line layer
        map.current.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#C45830', // Terracotta
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });

        console.log('✅ Driving route drawn successfully');
      }
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Route fetch aborted (new request started)');
        return;
      }
      console.warn('⚠️ Could not fetch driving route:', err);
      // No fallback - just don't show a line if API fails
    } finally {
      routeDrawingRef.current.isDrawing = false;
    }
  }, []);

  // Update markers for cities
  const updateMarkers = useCallback(
    (route: DiscoveryRoute) => {
      if (!map.current) return;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();

      // All cities to display - filter out those with invalid coordinates
      const allCities = [
        route.origin,
        ...route.suggestedCities,
        route.destination,
      ].filter((city) => isValidCoordinate(city.coordinates));

      allCities.forEach((city, index) => {
        const el = document.createElement('div');
        el.className = 'discovery-marker';

        // Render React component into marker element
        const root = createRoot(el);
        root.render(
          <DiscoveryCityPin
            city={city}
            isSelected={selectedCityId === city.id}
            onClick={() => onCitySelect(city.id)}
            onRemove={onCityRemove ? () => onCityRemove(city.id) : undefined}
            delay={index * 0.1} // Staggered entrance animation
          />
        );

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
        })
          .setLngLat([city.coordinates.lng, city.coordinates.lat])
          .addTo(map.current!);

        markersRef.current.set(city.id, marker);
      });
    },
    [selectedCityId, onCitySelect, onCityRemove]
  );

  // Update markers when selection changes
  useEffect(() => {
    if (route && isMapLoaded) {
      updateMarkers(route);
      drawRouteLine(route);
    }
  }, [route, selectedCityId, isMapLoaded, updateMarkers, drawRouteLine]);

  return (
    <div className="w-full h-full" style={{ minHeight: '100vh' }}>
      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '100vh' }} />

      {/* Subtle grain overlay for editorial texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />
    </div>
  );
}
