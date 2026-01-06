/**
 * PlanningMap - Real Mapbox Integration with Vintage Travel Aesthetic
 *
 * A beautiful, functional map showing real locations, routes, and walking distances.
 * Vintage travel journal styling with warm tones and premium interactions.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MapPin,
  Plus,
  X,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { CATEGORY_ICONS } from '../../utils/planningEnrichment';
import type { Slot, PlannedItem } from '../../types/planning';

// Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Debug: Log token status (not the actual token for security)
if (!mapboxgl.accessToken) {
  console.error('❌ VITE_MAPBOX_TOKEN is not set in environment variables');
} else {
  console.log('✓ Mapbox token loaded:', mapboxgl.accessToken.substring(0, 10) + '...');
}

// ============================================================================
// Slot Colors - Vintage Travel Palette
// ============================================================================

const SLOT_COLORS: Record<Slot, {
  primary: string;
  light: string;
  rgb: string;
}> = {
  morning: {
    primary: '#f59e0b',
    light: '#fbbf24',
    rgb: '245, 158, 11',
  },
  afternoon: {
    primary: '#f97316',
    light: '#fb923c',
    rgb: '249, 115, 22',
  },
  evening: {
    primary: '#f43f5e',
    light: '#fb7185',
    rgb: '244, 63, 94',
  },
  night: {
    primary: '#6366f1',
    light: '#818cf8',
    rgb: '99, 102, 241',
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function PlanningMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const {
    tripPlan,
    currentDayIndex,
    getDayItems,
    getCurrentDay,
    openAddPanel,
  } = usePlanningStore();

  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeData, setRouteData] = useState<Array<{ distance: number; duration: number }>>([]);

  const currentDay = getCurrentDay();
  const dayItems = getDayItems(currentDayIndex);

  // Initialize map - only once on mount
  useEffect(() => {
    console.log('🗺️ Map init useEffect triggered', {
      hasContainer: !!mapContainer.current,
      hasExistingMap: !!map.current,
      hasCurrentDay: !!currentDay,
      hasToken: !!mapboxgl.accessToken,
    });

    if (!mapContainer.current) {
      console.error('❌ Map container ref is null');
      return;
    }

    if (map.current) {
      console.log('ℹ️ Map already initialized, skipping');
      return;
    }

    // Verify Mapbox token
    if (!mapboxgl.accessToken) {
      console.error('❌ Mapbox token is not set. Map will not load.');
      return;
    }

    const initialCenter = currentDay?.city.coordinates
      ? [currentDay.city.coordinates.lng, currentDay.city.coordinates.lat]
      : [-9.1393, 38.7223]; // Lisbon default

    console.log('🚀 Initializing Mapbox map with center:', initialCenter);

    try {
      // Log container dimensions for debugging
      const containerRect = mapContainer.current.getBoundingClientRect();
      console.log('📐 Map container dimensions:', {
        width: containerRect.width,
        height: containerRect.height,
        top: containerRect.top,
        left: containerRect.left,
      });

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12', // Warm, vintage-friendly style
        center: initialCenter as [number, number],
        zoom: 13,
        attributionControl: false,
      });

      console.log('✅ Mapbox Map object created');

      // Custom attribution
      map.current.addControl(
        new mapboxgl.AttributionControl({
          compact: true,
          customAttribution: '© Mapbox',
        }),
        'bottom-left'
      );

      map.current.on('load', () => {
        console.log('✅ Mapbox map loaded successfully');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('❌ Mapbox error:', e);
      });
    } catch (error) {
      console.error('❌ Error initializing Mapbox map:', error);
    }

    return () => {
      console.log('🧹 Cleaning up map on unmount');
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, []); // Empty deps - only run once on mount

  // Update map center when day changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !currentDay?.city.coordinates) return;

    console.log('📍 Updating map center for new day');
    map.current.flyTo({
      center: [currentDay.city.coordinates.lng, currentDay.city.coordinates.lat],
      zoom: 13,
      duration: 1000,
    });
  }, [currentDayIndex, mapLoaded]);

  // Update markers and routes when items change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log('🎯 Creating markers for', dayItems.length, 'activities');

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    if (!dayItems.length) {
      console.log('⚠️ No activities to display');
      return;
    }

    // Add new markers
    dayItems.forEach((item, index) => {
      const coords = item.place.geometry.location;
      console.log(`📍 Creating marker ${index + 1} for ${item.place.name} at`, coords);

      const el = createMarkerElement(item, index, () => setSelectedMarker(item.id));

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map.current!);

      markers.current.push(marker);
    });

    console.log('✅ Created', markers.current.length, 'markers on map');

    // Fit bounds to show all markers
    if (dayItems.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      dayItems.forEach(item => {
        const coords = item.place.geometry.location;
        bounds.extend([coords.lng, coords.lat]);
      });

      map.current.fitBounds(bounds, {
        padding: { top: 120, bottom: 120, left: 120, right: 120 },
        maxZoom: 14,
        duration: 1000,
      });
    }

    // Fetch and display routes
    if (dayItems.length > 1) {
      console.log('🛤️ Fetching routes between', dayItems.length, 'points');
      fetchRoutes(dayItems);
    }
  }, [dayItems, mapLoaded]);

  // Fetch walking routes from Mapbox Directions API
  const fetchRoutes = async (items: PlannedItem[]) => {
    if (!map.current || !mapLoaded) return;

    const coordinates = items.map(item =>
      `${item.place.geometry.location.lng},${item.place.geometry.location.lat}`
    ).join(';');

    console.log('🗺️ Fetching route for coordinates:', coordinates);

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinates}?` +
        `geometries=geojson&overview=full&steps=true&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      console.log('📍 Route response:', data);

      // Check if map still exists after async operation
      if (!map.current) return;

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];

        // Store route data for distance/duration display
        const legs = route.legs.map((leg: any) => ({
          distance: leg.distance, // meters
          duration: leg.duration, // seconds
        }));

        console.log('🚶 Route legs:', legs.map((leg: { distance: number; duration: number }, i: number) =>
          `Segment ${i + 1}: ${(leg.distance / 1000).toFixed(2)}km, ${Math.round(leg.duration / 60)} min`
        ).join(' | '));

        setRouteData(legs);

        // Add route to map
        const routeGeoJSON = {
          type: 'Feature' as const,
          properties: {},
          geometry: route.geometry,
        };

        // Check again before manipulating map
        if (!map.current) return;

        // Remove existing route layers
        if (map.current.getSource('route')) {
          if (map.current.getLayer('route')) map.current.removeLayer('route');
          if (map.current.getLayer('route-outline')) map.current.removeLayer('route-outline');
          map.current.removeSource('route');
        }

        // Check again before adding new layers
        if (!map.current) return;

        // Add route source
        map.current.addSource('route', {
          type: 'geojson',
          data: routeGeoJSON as any,
        });

        // Add route outline (darker)
        map.current.addLayer({
          id: 'route-outline',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#8B4513',
            'line-width': 8,
            'line-opacity': 0.3,
          },
        });

        // Add route line (terracotta)
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#C45830',
            'line-width': 5,
            'line-opacity': 0.8,
            'line-dasharray': [2, 2],
          },
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // Map controls
  const handleZoomIn = useCallback(() => {
    map.current?.zoomIn({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    map.current?.zoomOut({ duration: 300 });
  }, []);

  const handleFitBounds = useCallback(() => {
    if (!map.current || dayItems.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    dayItems.forEach(item => {
      const coords = item.place.geometry.location;
      bounds.extend([coords.lng, coords.lat]);
    });

    map.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 100, right: 100 },
      maxZoom: 15,
      duration: 1000,
    });
  }, [dayItems]);

  const handleRecenter = useCallback(() => {
    if (!map.current || !currentDay?.city.coordinates) return;

    map.current.flyTo({
      center: [currentDay.city.coordinates.lng, currentDay.city.coordinates.lat],
      zoom: 13,
      duration: 1000,
    });
  }, [currentDay]);

  if (!tripPlan || !currentDay) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#F5EFE0] to-[#E8DCC5]">
        <p className="text-body-1 text-rui-grey-60 font-medium">No day selected</p>
      </div>
    );
  }

  const itemsBySlot = {
    morning: currentDay.slots.morning || [],
    afternoon: currentDay.slots.afternoon || [],
    evening: currentDay.slots.evening || [],
    night: currentDay.slots.night || [],
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Mapbox Container */}
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* City Label - Vintage Style */}
      <motion.div
        className="absolute top-6 left-6 z-10 pointer-events-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative bg-gradient-to-br from-rui-white/95 to-rui-cream/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-rui-3 border-2 border-rui-accent/30">
          <div className="absolute -top-2 -left-2 w-6 h-6">
            <svg viewBox="0 0 24 24" className="text-rui-accent/30" fill="currentColor">
              <path d="M0 0 L24 0 L0 24 Z" />
            </svg>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-rui-accent" />
            <span className="text-[10px] uppercase tracking-widest text-rui-grey-50 font-semibold">
              Planning in
            </span>
          </div>
          <p className="font-display text-2xl text-rui-black font-semibold tracking-tight">
            {currentDay.city.name}
          </p>
        </div>
      </motion.div>

      {/* Slot Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-6 right-6 z-10 pointer-events-auto"
          >
            <div className="relative bg-gradient-to-br from-rui-white/95 to-rui-cream/95 backdrop-blur-md rounded-2xl p-4 shadow-rui-3 border-2 border-rui-accent/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rui-accent" />
                  <span className="font-display text-base text-rui-black font-semibold">
                    Timeline
                  </span>
                </div>
                <button
                  onClick={() => setShowLegend(false)}
                  className="p-1 rounded-lg hover:bg-rui-grey-10 transition-colors"
                >
                  <X className="w-4 h-4 text-rui-grey-50" />
                </button>
              </div>
              <div className="space-y-2">
                {(['morning', 'afternoon', 'evening', 'night'] as Slot[]).map((slot) => (
                  <div key={slot} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shadow-md"
                      style={{ background: SLOT_COLORS[slot].primary }}
                    />
                    <span className="text-body-2 text-rui-grey-70 font-medium capitalize flex-1">
                      {slot}
                    </span>
                    <span className="text-body-3 text-rui-grey-50 font-semibold bg-rui-grey-5 px-2 py-0.5 rounded-md">
                      {itemsBySlot[slot].length}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Walking Distance */}
              {routeData.length > 0 && (
                <div className="mt-3 pt-3 border-t border-rui-grey-10">
                  <div className="text-body-3 text-rui-grey-60">
                    <div className="flex items-center justify-between">
                      <span>Total walking:</span>
                      <span className="font-semibold text-rui-black">
                        {formatDistance(routeData.reduce((sum, leg) => sum + leg.distance, 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span>Estimated time:</span>
                      <span className="font-semibold text-rui-black">
                        {formatDuration(routeData.reduce((sum, leg) => sum + leg.duration, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Controls - Vintage Brass Style */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2 pointer-events-auto">
        <motion.button
          onClick={handleZoomIn}
          className="w-12 h-12 bg-gradient-to-br from-[#D4A574] to-[#C4A57B] rounded-xl shadow-rui-3 flex items-center justify-center text-rui-white border-2 border-[#B8975E] hover:shadow-rui-4 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Zoom in"
        >
          <ZoomIn className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
        <motion.button
          onClick={handleZoomOut}
          className="w-12 h-12 bg-gradient-to-br from-[#D4A574] to-[#C4A57B] rounded-xl shadow-rui-3 flex items-center justify-center text-rui-white border-2 border-[#B8975E] hover:shadow-rui-4 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Zoom out"
        >
          <ZoomOut className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
        <motion.button
          onClick={handleFitBounds}
          className="w-12 h-12 bg-gradient-to-br from-[#D4A574] to-[#C4A57B] rounded-xl shadow-rui-3 flex items-center justify-center text-rui-white border-2 border-[#B8975E] hover:shadow-rui-4 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Fit to view"
        >
          <Maximize2 className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
        <motion.button
          onClick={handleRecenter}
          className="w-12 h-12 bg-gradient-to-br from-[#D4A574] to-[#C4A57B] rounded-xl shadow-rui-3 flex items-center justify-center text-rui-white border-2 border-[#B8975E] hover:shadow-rui-4 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Recenter"
        >
          <Navigation className="w-5 h-5" strokeWidth={2.5} />
        </motion.button>
        {!showLegend && (
          <motion.button
            onClick={() => setShowLegend(true)}
            className="w-12 h-12 bg-gradient-to-br from-[#D4A574] to-[#C4A57B] rounded-xl shadow-rui-3 flex items-center justify-center text-rui-white border-2 border-[#B8975E] hover:shadow-rui-4 transition-all"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Show legend"
          >
            <Layers className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        )}
      </div>

      {/* Empty State */}
      {dayItems.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="text-center max-w-md pointer-events-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rui-accent/10 to-rui-accent/5 border-2 border-rui-accent/20" />
              <MapPin className="absolute inset-0 m-auto w-12 h-12 text-rui-accent/60" />
            </div>
            <p className="font-display text-2xl text-rui-black mb-2">
              Your map awaits
            </p>
            <p className="text-body-1 text-rui-grey-60 mb-6 leading-relaxed">
              Add activities to plot your journey across {currentDay.city.name}
            </p>
            <motion.button
              onClick={() => openAddPanel('morning')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rui-accent to-orange-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-body-1 shadow-md border-2 border-rui-accent"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              Add your first stop
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Selected Marker Popup */}
      <AnimatePresence>
        {selectedMarker && (
          <MarkerPopup
            item={dayItems.find((i) => i.id === selectedMarker)!}
            routeData={routeData}
            itemIndex={dayItems.findIndex((i) => i.id === selectedMarker)}
            onClose={() => setSelectedMarker(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Create Custom Marker Element
// ============================================================================

function createMarkerElement(
  item: PlannedItem,
  index: number,
  onClick: () => void
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'custom-marker';
  el.style.cssText = 'cursor: pointer; transform-origin: bottom center; position: relative; z-index: ' + (100 + index);

  const colors = SLOT_COLORS[item.slot];
  const icon = CATEGORY_ICONS[item.place.category] || '📍';

  // Get photo URL from Google Places API
  const photoUrl = item.place.photos && item.place.photos.length > 0
    ? item.place.photos[0].url
    : null;

  console.log(`📸 Photo for ${item.place.name}:`, photoUrl || 'No photo');

  // Create marker with photo or icon
  if (photoUrl) {
    // Photo-enhanced marker
    el.innerHTML = `
      <div class="flex flex-col items-center transition-all hover:scale-110 hover:-translate-y-1"
           style="filter: drop-shadow(0 6px 20px rgba(0,0,0,0.35));">
        <!-- Photo Container with Vintage Frame -->
        <div class="relative" style="perspective: 1000px;">
          <!-- Vintage Paper Frame -->
          <div class="relative w-20 h-20 rounded-xl overflow-hidden"
               style="background: linear-gradient(135deg, #FFFBF5 0%, #F5F0E8 100%);
                      border: 3px solid ${colors.primary};
                      box-shadow:
                        0 10px 30px rgba(${colors.rgb}, 0.5),
                        0 0 0 5px rgba(255,255,255,0.95),
                        inset 0 -2px 8px rgba(0,0,0,0.1);
                      transform: rotateX(2deg);">
            <!-- Photo -->
            <img src="${photoUrl}"
                 alt="${item.place.name}"
                 crossorigin="anonymous"
                 onerror="this.parentElement.parentElement.parentElement.innerHTML = '${icon.replace(/'/g, "\\'")}';"
                 style="width: 100%; height: 100%; object-fit: cover; opacity: 0.95;" />

            <!-- Vintage Vignette -->
            <div style="position: absolute; inset: 0;
                        background: radial-gradient(circle at center, transparent 40%, rgba(44, 36, 23, 0.15) 100%);
                        pointer-events: none;"></div>
          </div>

          <!-- Order Badge - Vintage Wax Seal Style -->
          <div class="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center"
               style="background: radial-gradient(circle at 30% 30%, ${colors.light} 0%, ${colors.primary} 100%);
                      box-shadow:
                        0 4px 12px rgba(${colors.rgb}, 0.6),
                        0 0 0 3px rgba(255,255,255,0.95),
                        inset 0 2px 4px rgba(255,255,255,0.3);
                      border: 2px solid rgba(255,255,255,0.4);">
            <span style="font-size: 15px; font-weight: 800; color: #FFFBF5;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3); font-family: 'Fraunces', serif;">${index + 1}</span>
          </div>

          <!-- Category Icon Badge -->
          <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center"
               style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.light} 100%);
                      box-shadow: 0 4px 12px rgba(${colors.rgb}, 0.5), 0 0 0 3px rgba(255,255,255,0.95);
                      border: 2px solid rgba(255,255,255,0.3);">
            <span style="font-size: 14px;">${icon}</span>
          </div>
        </div>

        <!-- Pin Stem -->
        <div style="width: 8px; height: 28px; margin-top: 4px;
                    background: linear-gradient(180deg, ${colors.primary} 0%, ${colors.primary} 100%);
                    border-radius: 4px;
                    box-shadow: 0 3px 10px rgba(${colors.rgb}, 0.4), inset 0 1px 2px rgba(255,255,255,0.2);"></div>

        <!-- Pin Point -->
        <div style="width: 14px; height: 14px;
                    background: radial-gradient(circle at 30% 30%, ${colors.light} 0%, ${colors.primary} 100%);
                    border-radius: 50%; margin-top: -3px;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3);"></div>
      </div>
    `;
  } else {
    // Icon-based marker (fallback)
    el.innerHTML = `
      <div class="flex flex-col items-center transition-all hover:scale-110 hover:-translate-y-1"
           style="filter: drop-shadow(0 6px 20px rgba(0,0,0,0.35));">
        <!-- Pin Body with Icon -->
        <div class="relative flex items-center justify-center w-16 h-16 rounded-2xl"
             style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.light} 100%);
                    box-shadow:
                      0 10px 30px rgba(${colors.rgb}, 0.5),
                      0 0 0 5px rgba(255,255,255,0.95),
                      inset 0 -4px 8px rgba(0,0,0,0.1),
                      inset 0 2px 4px rgba(255,255,255,0.3);
                    border: 3px solid rgba(255,255,255,0.3);">
          <span style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">${icon}</span>

          <!-- Order Badge -->
          <div class="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center"
               style="background: radial-gradient(circle at 30% 30%, ${colors.light} 0%, ${colors.primary} 100%);
                      box-shadow:
                        0 4px 12px rgba(${colors.rgb}, 0.6),
                        0 0 0 3px rgba(255,255,255,0.95);
                      border: 2px solid rgba(255,255,255,0.4);">
            <span style="font-size: 15px; font-weight: 800; color: #FFFBF5;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.3); font-family: 'Fraunces', serif;">${index + 1}</span>
          </div>
        </div>

        <!-- Pin Stem -->
        <div style="width: 8px; height: 28px; margin-top: 4px;
                    background: linear-gradient(180deg, ${colors.primary} 0%, ${colors.primary} 100%);
                    border-radius: 4px;
                    box-shadow: 0 3px 10px rgba(${colors.rgb}, 0.4);"></div>

        <!-- Pin Point -->
        <div style="width: 14px; height: 14px;
                    background: radial-gradient(circle at 30% 30%, ${colors.light} 0%, ${colors.primary} 100%);
                    border-radius: 50%; margin-top: -3px;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.3);"></div>
      </div>
    `;
  }

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });

  return el;
}

// ============================================================================
// Marker Popup
// ============================================================================

interface MarkerPopupProps {
  item: PlannedItem;
  routeData: Array<{ distance: number; duration: number }>;
  itemIndex: number;
  onClose: () => void;
}

function MarkerPopup({ item, routeData, itemIndex, onClose }: MarkerPopupProps) {
  const { place, slot } = item;
  const colors = SLOT_COLORS[slot];
  const icon = CATEGORY_ICONS[place.category] || '📍';
  const legData = routeData[itemIndex - 1]; // Route to this marker from previous

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.9 }}
      className="absolute bottom-6 left-6 right-6 z-40 pointer-events-auto"
    >
      <div className="bg-gradient-to-br from-rui-white to-rui-cream rounded-2xl shadow-rui-4 border-2 border-rui-accent/30 overflow-hidden">
        {/* Colored Top Bar */}
        <div className="h-2" style={{ background: colors.primary }} />

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-xl shadow-md"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.light})` }}
            >
              <span className="text-3xl">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-xl text-rui-black font-semibold truncate leading-tight">
                {place.name}
              </h4>
              <p className="text-body-2 text-rui-grey-60 capitalize mt-1 font-medium">
                {slot} · ~{place.estimated_duration_mins} min
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-rui-grey-50 hover:bg-rui-grey-5 hover:text-rui-grey-70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Walking Info */}
          {legData && (
            <div className="mt-4 p-3 bg-rui-grey-2/50 rounded-xl border border-rui-grey-10">
              <div className="flex items-center gap-2 text-body-3 text-rui-grey-60 mb-1">
                <Navigation className="w-3.5 h-3.5" />
                <span className="font-semibold text-rui-black">Walking from previous stop:</span>
              </div>
              <div className="flex items-center gap-4 text-body-2">
                <span className="text-rui-black font-semibold">
                  {formatDistance(legData.distance)}
                </span>
                <span className="text-rui-grey-50">·</span>
                <span className="text-rui-black font-semibold">
                  {formatDuration(legData.duration)}
                </span>
              </div>
            </div>
          )}

          {place.rating && (
            <div className="mt-4 flex items-center gap-4 text-body-2">
              <span className="flex items-center gap-1.5 text-rui-grey-70 font-medium">
                <span className="text-amber-500 text-lg">★</span>
                {place.rating.toFixed(1)}
              </span>
              {place.is_hidden_gem && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[11px] font-semibold uppercase tracking-wide">
                  Hidden Gem
                </span>
              )}
            </div>
          )}

          {item.user_notes && (
            <p className="mt-3 text-body-2 text-rui-grey-70 italic leading-relaxed bg-rui-grey-2/50 p-3 rounded-xl">
              "{item.user_notes}"
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export default PlanningMap;
