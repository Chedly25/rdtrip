import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X, MapPin, Maximize2, Minimize2 } from 'lucide-react';

// Mapbox access token - you'll need to add this to your .env
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface MapLocation {
  id: string;
  name: string;
  type: 'activity' | 'restaurant' | 'accommodation' | 'scenic';
  coordinates: [number, number]; // [lng, lat]
  color: string;
  time?: string;
  day?: number;
}

interface MapSidebarProps {
  locations: MapLocation[];
  activeLocationId?: string;
  onLocationClick?: (id: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function MapSidebar({
  locations,
  activeLocationId,
  onLocationClick,
  onClose,
  isOpen = true
}: MapSidebarProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: locations.length > 0 ? locations[0].coordinates : [-3.7038, 40.4168], // Default to Madrid
      zoom: 12,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add attribution control (required by Mapbox)
    map.current.addControl(
      new mapboxgl.AttributionControl({
        compact: true
      }),
      'bottom-left'
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers
    locations.forEach((location) => {
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = location.color;
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      el.style.transition = 'all 0.2s ease';

      // Add icon based on type
      const icon = document.createElement('div');
      icon.style.color = 'white';
      icon.style.display = 'flex';
      icon.style.alignItems = 'center';
      icon.style.justifyContent = 'center';
      icon.style.height = '100%';
      icon.style.fontSize = '14px';
      icon.innerHTML = getIconForType(location.type);
      el.appendChild(icon);

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.zIndex = '1000';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      });

      // Click handler
      el.addEventListener('click', () => {
        if (onLocationClick) {
          onLocationClick(location.id);
        }
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat(location.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px;">${location.name}</h3>
              ${location.time ? `<p style="margin: 0; font-size: 12px; color: #666;">📍 ${location.time}</p>` : ''}
            </div>`
          )
        )
        .addTo(map.current!);

      markers.current[location.id] = marker;
    });

    // Fit map to bounds if we have multiple locations
    if (locations.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(loc => bounds.extend(loc.coordinates));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    } else if (locations.length === 1) {
      map.current.setCenter(locations[0].coordinates);
      map.current.setZoom(14);
    }
  }, [locations, onLocationClick]);

  // Highlight active location
  useEffect(() => {
    if (!activeLocationId || !markers.current[activeLocationId]) return;

    // Pan to active marker
    const marker = markers.current[activeLocationId];
    map.current?.flyTo({
      center: marker.getLngLat(),
      zoom: 15,
      duration: 1000
    });

    // Show popup
    marker.togglePopup();
  }, [activeLocationId]);

  // Draw route lines
  useEffect(() => {
    if (!map.current || locations.length < 2) return;

    // Wait for map to load
    map.current.on('load', () => {
      if (!map.current) return;

      // Remove existing route layer and source
      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }

      // Create route coordinates (in order of timeline)
      const sortedLocations = [...locations].sort((a, b) => {
        if (a.day !== b.day) return (a.day || 0) - (b.day || 0);
        return (a.time || '').localeCompare(b.time || '');
      });

      const coordinates = sortedLocations.map(loc => loc.coordinates);

      // Add route source
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      // Add route layer
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3B82F6',
          'line-width': 3,
          'line-opacity': 0.6,
          'line-dasharray': [2, 2]
        }
      });
    });
  }, [locations]);

  if (!isOpen) return null;

  return (
    <div
      className={`${
        isFullscreen
          ? 'fixed inset-0 z-50'
          : 'sticky top-20 h-[600px] lg:h-[calc(100vh-120px)]'
      } bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200`}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Route Map</h3>
          <span className="text-sm text-gray-500">
            {locations.length} {locations.length === 1 ? 'location' : 'locations'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 text-gray-600" />
            ) : (
              <Maximize2 className="h-4 w-4 text-gray-600" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close map"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Accommodation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Scenic Stop</span>
          </div>
        </div>
      </div>

      {/* Mobile overlay hint */}
      <div className="lg:hidden absolute top-16 left-0 right-0 p-2 bg-blue-50 border-b border-blue-100 text-center text-xs text-blue-700">
        Tap markers to see details • Pinch to zoom
      </div>
    </div>
  );
}

function getIconForType(type: string): string {
  switch (type) {
    case 'activity':
      return '🎯';
    case 'restaurant':
      return '🍽️';
    case 'accommodation':
      return '🏨';
    case 'scenic':
      return '📸';
    default:
      return '📍';
  }
}
