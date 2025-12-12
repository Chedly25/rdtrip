/**
 * ClusterMapOverlay
 *
 * A floating overlay that displays cluster information and controls
 * for map visualization of city intelligence clusters.
 *
 * Design Philosophy:
 * - Glass morphism panel floating over map
 * - Quick-glance cluster info with expand capability
 * - Color-coded to match cluster themes
 * - Walking time prominently displayed
 * - Integrates with Mapbox for marker placement
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import {
  Layers,
  MapPin,
  Footprints,
  ChevronRight,
  ChevronDown,
  X,
  Building2,
  Utensils,
  TreePine,
  ShoppingBag,
  Wine,
  Eye,
  EyeOff,
  Compass,
  Route,
} from 'lucide-react';
import type { Cluster, ClusterPlace } from '../../types/cityIntelligence';

// =============================================================================
// Walking Route Layer ID
// =============================================================================

const WALKING_ROUTE_SOURCE = 'cluster-walking-route';
const WALKING_ROUTE_LAYER = 'cluster-walking-route-layer';
const WALKING_ROUTE_DASH_LAYER = 'cluster-walking-route-dash-layer';
const WALKING_ROUTE_GLOW_LAYER = 'cluster-walking-route-glow-layer';

// =============================================================================
// Types
// =============================================================================

interface ClusterMapOverlayProps {
  clusters: Cluster[];
  /** The mapbox map instance */
  map: mapboxgl.Map | null;
  /** Currently selected cluster ID */
  selectedClusterId?: string;
  /** Callback when cluster is selected */
  onClusterSelect?: (cluster: Cluster | null) => void;
  /** Callback when place is selected */
  onPlaceSelect?: (place: ClusterPlace, cluster: Cluster) => void;
  /** Position of the overlay */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface ClusterMarkerData {
  cluster: Cluster;
  marker: mapboxgl.Marker;
  placeMarkers: mapboxgl.Marker[];
}

// =============================================================================
// Configuration
// =============================================================================

const THEME_CONFIG = {
  cultural: {
    icon: Building2,
    color: '#6366f1', // Indigo
    label: 'Cultural',
  },
  food: {
    icon: Utensils,
    color: '#f43f5e', // Rose
    label: 'Food & Drink',
  },
  nature: {
    icon: TreePine,
    color: '#10b981', // Emerald
    label: 'Nature',
  },
  shopping: {
    icon: ShoppingBag,
    color: '#f59e0b', // Amber
    label: 'Shopping',
  },
  nightlife: {
    icon: Wine,
    color: '#a855f7', // Purple
    label: 'Nightlife',
  },
  mixed: {
    icon: Layers,
    color: '#64748b', // Slate
    label: 'Mixed',
  },
};

// =============================================================================
// Main Component
// =============================================================================

export function ClusterMapOverlay({
  clusters,
  map,
  selectedClusterId,
  onClusterSelect,
  onPlaceSelect,
  position = 'top-left',
}: ClusterMapOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const markersRef = useRef<ClusterMarkerData[]>([]);
  const routeLayersAddedRef = useRef(false);

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Get theme config for cluster
  const getThemeConfig = (theme: string) => {
    return THEME_CONFIG[theme as keyof typeof THEME_CONFIG] || THEME_CONFIG.mixed;
  };

  // Create cluster marker element
  const createClusterMarkerElement = useCallback((cluster: Cluster, isSelected: boolean) => {
    const theme = getThemeConfig(cluster.theme);
    const el = document.createElement('div');
    el.className = 'cluster-marker';
    el.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${isSelected ? '48px' : '40px'};
        height: ${isSelected ? '48px' : '40px'};
        border-radius: 50%;
        background: ${theme.color};
        box-shadow: 0 4px 12px ${theme.color}40;
        border: 3px solid white;
        cursor: pointer;
        transition: all 0.2s ease;
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
      ">
        <span style="color: white; font-weight: 600; font-size: 14px;">
          ${cluster.places?.length || 0}
        </span>
      </div>
      <div style="
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 4px;
        padding: 2px 8px;
        background: white;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        color: ${theme.color};
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      ">
        ${cluster.name}
      </div>
    `;

    return el;
  }, []);

  // Create place marker element
  const createPlaceMarkerElement = useCallback((_place: ClusterPlace, theme: { color: string }) => {
    const el = document.createElement('div');
    el.className = 'place-marker';
    el.innerHTML = `
      <div style="
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: ${theme.color};
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        cursor: pointer;
      "></div>
    `;
    return el;
  }, []);

  // Generate walking route coordinates from cluster places
  const generateRouteCoordinates = useCallback((cluster: Cluster): [number, number][] => {
    if (!cluster.places || cluster.places.length < 2) return [];

    // Sort places by a simple nearest-neighbor algorithm for better walking order
    const placesWithCoords = cluster.places.filter(p => p.coordinates);
    if (placesWithCoords.length < 2) return [];

    const ordered: ClusterPlace[] = [placesWithCoords[0]];
    const remaining = placesWithCoords.slice(1);

    while (remaining.length > 0) {
      const last = ordered[ordered.length - 1];
      let nearestIdx = 0;
      let nearestDist = Infinity;

      remaining.forEach((place, idx) => {
        if (!place.coordinates || !last.coordinates) return;
        const dist = Math.sqrt(
          Math.pow(place.coordinates.lng - last.coordinates.lng, 2) +
          Math.pow(place.coordinates.lat - last.coordinates.lat, 2)
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      });

      ordered.push(remaining[nearestIdx]);
      remaining.splice(nearestIdx, 1);
    }

    return ordered
      .filter(p => p.coordinates)
      .map(p => [p.coordinates!.lng, p.coordinates!.lat] as [number, number]);
  }, []);

  // Manage walking route layer
  useEffect(() => {
    if (!map || !selectedClusterId || !showRoutes) {
      // Remove route layers if they exist
      if (map && routeLayersAddedRef.current) {
        try {
          if (map.getLayer(WALKING_ROUTE_GLOW_LAYER)) map.removeLayer(WALKING_ROUTE_GLOW_LAYER);
          if (map.getLayer(WALKING_ROUTE_DASH_LAYER)) map.removeLayer(WALKING_ROUTE_DASH_LAYER);
          if (map.getLayer(WALKING_ROUTE_LAYER)) map.removeLayer(WALKING_ROUTE_LAYER);
          if (map.getSource(WALKING_ROUTE_SOURCE)) map.removeSource(WALKING_ROUTE_SOURCE);
          routeLayersAddedRef.current = false;
        } catch (e) {
          // Layers may not exist
        }
      }
      return;
    }

    const cluster = clusters.find(c => c.id === selectedClusterId);
    if (!cluster) return;

    const theme = getThemeConfig(cluster.theme);
    const coordinates = generateRouteCoordinates(cluster);

    if (coordinates.length < 2) return;

    // Create GeoJSON for the route
    const routeGeoJson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };

    // Add or update the source and layers
    const addLayers = () => {
      try {
        // Remove existing if present
        if (map.getLayer(WALKING_ROUTE_GLOW_LAYER)) map.removeLayer(WALKING_ROUTE_GLOW_LAYER);
        if (map.getLayer(WALKING_ROUTE_DASH_LAYER)) map.removeLayer(WALKING_ROUTE_DASH_LAYER);
        if (map.getLayer(WALKING_ROUTE_LAYER)) map.removeLayer(WALKING_ROUTE_LAYER);
        if (map.getSource(WALKING_ROUTE_SOURCE)) map.removeSource(WALKING_ROUTE_SOURCE);

        // Add source
        map.addSource(WALKING_ROUTE_SOURCE, {
          type: 'geojson',
          data: routeGeoJson,
        });

        // Add glow layer (wider, semi-transparent)
        map.addLayer({
          id: WALKING_ROUTE_GLOW_LAYER,
          type: 'line',
          source: WALKING_ROUTE_SOURCE,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': theme.color,
            'line-width': 8,
            'line-opacity': 0.25,
            'line-blur': 3,
          },
        });

        // Add main route layer (solid line)
        map.addLayer({
          id: WALKING_ROUTE_LAYER,
          type: 'line',
          source: WALKING_ROUTE_SOURCE,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': theme.color,
            'line-width': 3,
            'line-opacity': 0.8,
          },
        });

        // Add dashed overlay for walking path effect
        map.addLayer({
          id: WALKING_ROUTE_DASH_LAYER,
          type: 'line',
          source: WALKING_ROUTE_SOURCE,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ffffff',
            'line-width': 2,
            'line-dasharray': [0, 2, 1],
            'line-opacity': 0.6,
          },
        });

        routeLayersAddedRef.current = true;
      } catch (e) {
        console.error('Failed to add walking route layers:', e);
      }
    };

    // Wait for map style to load if needed
    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once('styledata', addLayers);
    }

    return () => {
      try {
        if (map.getLayer(WALKING_ROUTE_GLOW_LAYER)) map.removeLayer(WALKING_ROUTE_GLOW_LAYER);
        if (map.getLayer(WALKING_ROUTE_DASH_LAYER)) map.removeLayer(WALKING_ROUTE_DASH_LAYER);
        if (map.getLayer(WALKING_ROUTE_LAYER)) map.removeLayer(WALKING_ROUTE_LAYER);
        if (map.getSource(WALKING_ROUTE_SOURCE)) map.removeSource(WALKING_ROUTE_SOURCE);
        routeLayersAddedRef.current = false;
      } catch (e) {
        // Cleanup errors can be ignored
      }
    };
  }, [map, selectedClusterId, showRoutes, clusters, generateRouteCoordinates]);

  // Update markers on map
  useEffect(() => {
    if (!map || !clusters.length) return;

    // Clear existing markers
    markersRef.current.forEach(({ marker, placeMarkers }) => {
      marker.remove();
      placeMarkers.forEach(pm => pm.remove());
    });
    markersRef.current = [];

    if (!showClusters) return;

    // Add new markers
    clusters.forEach(cluster => {
      if (!cluster.centerPoint) return;

      const theme = getThemeConfig(cluster.theme);
      const isSelected = selectedClusterId === cluster.id;

      // Cluster center marker
      const markerEl = createClusterMarkerElement(cluster, isSelected);
      markerEl.addEventListener('click', () => {
        onClusterSelect?.(isSelected ? null : cluster);
      });

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'center',
      })
        .setLngLat([cluster.centerPoint.lng, cluster.centerPoint.lat])
        .addTo(map);

      // Place markers (only if showing places and cluster selected)
      const placeMarkers: mapboxgl.Marker[] = [];

      if (showPlaces && isSelected && cluster.places) {
        cluster.places.forEach(place => {
          if (!place.coordinates) return;

          const placeEl = createPlaceMarkerElement(place, theme);
          placeEl.addEventListener('click', (e) => {
            e.stopPropagation();
            onPlaceSelect?.(place, cluster);
          });

          const placeMarker = new mapboxgl.Marker({
            element: placeEl,
            anchor: 'center',
          })
            .setLngLat([place.coordinates.lng, place.coordinates.lat])
            .addTo(map);

          placeMarkers.push(placeMarker);
        });
      }

      markersRef.current.push({ cluster, marker, placeMarkers });
    });

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(({ marker, placeMarkers }) => {
        marker.remove();
        placeMarkers.forEach(pm => pm.remove());
      });
      markersRef.current = [];
    };
  }, [map, clusters, showClusters, showPlaces, selectedClusterId, createClusterMarkerElement, createPlaceMarkerElement, onClusterSelect, onPlaceSelect]);

  // Fly to cluster when selected
  useEffect(() => {
    if (!map || !selectedClusterId) return;

    const cluster = clusters.find(c => c.id === selectedClusterId);
    if (cluster?.centerPoint) {
      map.flyTo({
        center: [cluster.centerPoint.lng, cluster.centerPoint.lat],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [map, selectedClusterId, clusters]);

  const selectedCluster = clusters.find(c => c.id === selectedClusterId);

  return (
    <div className={`absolute ${positionClasses[position]} z-10`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-72"
      >
        {/* Main panel */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 text-sm">Activity Zones</h3>
                <p className="text-xs text-gray-500">{clusters.length} clusters</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </button>

          {/* Expandable content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Controls */}
                <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
                  <ToggleButton
                    active={showClusters}
                    onClick={() => setShowClusters(!showClusters)}
                    icon={showClusters ? Eye : EyeOff}
                    label="Clusters"
                  />
                  <ToggleButton
                    active={showPlaces}
                    onClick={() => setShowPlaces(!showPlaces)}
                    icon={MapPin}
                    label="Places"
                    disabled={!showClusters}
                  />
                  <ToggleButton
                    active={showRoutes}
                    onClick={() => setShowRoutes(!showRoutes)}
                    icon={Route}
                    label="Routes"
                    disabled={!showClusters}
                  />
                </div>

                {/* Cluster list */}
                <div className="max-h-64 overflow-y-auto border-t border-gray-100">
                  {clusters.map((cluster) => {
                    const theme = getThemeConfig(cluster.theme);
                    const Icon = theme.icon;
                    const isSelected = selectedClusterId === cluster.id;

                    return (
                      <button
                        key={cluster.id}
                        onClick={() => onClusterSelect?.(isSelected ? null : cluster)}
                        className={`
                          w-full flex items-center gap-3 p-3
                          transition-colors text-left
                          ${isSelected
                            ? 'bg-gray-100'
                            : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${theme.color}15` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: theme.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {cluster.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">
                              {cluster.places?.length || 0} places
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="flex items-center gap-0.5 text-xs text-gray-500">
                              <Footprints className="w-3 h-3" />
                              {cluster.walkingMinutes}m
                            </span>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isSelected ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected cluster detail card */}
        <AnimatePresence>
          {selectedCluster && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden"
            >
              <ClusterDetailCard
                cluster={selectedCluster}
                onClose={() => onClusterSelect?.(null)}
                onPlaceSelect={onPlaceSelect}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Toggle Button
// =============================================================================

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  icon: typeof Eye;
  label: string;
  disabled?: boolean;
}

function ToggleButton({ active, onClick, icon: Icon, label, disabled }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        transition-colors
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : active
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// =============================================================================
// Cluster Detail Card
// =============================================================================

interface ClusterDetailCardProps {
  cluster: Cluster;
  onClose: () => void;
  onPlaceSelect?: (place: ClusterPlace, cluster: Cluster) => void;
}

function ClusterDetailCard({ cluster, onClose, onPlaceSelect }: ClusterDetailCardProps) {
  const theme = THEME_CONFIG[cluster.theme as keyof typeof THEME_CONFIG] || THEME_CONFIG.mixed;
  const Icon = theme.icon;

  return (
    <div>
      {/* Header */}
      <div
        className="p-4"
        style={{ backgroundColor: `${theme.color}10` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.color }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{cluster.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs" style={{ color: theme.color }}>
                  {theme.label}
                </span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-500">
                  {cluster.bestFor}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">
              {cluster.places?.length || 0} places
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">
              {cluster.walkingMinutes} min walk
            </span>
          </div>
        </div>
      </div>

      {/* Places list */}
      {cluster.places && cluster.places.length > 0 && (
        <div className="max-h-48 overflow-y-auto">
          {cluster.places.slice(0, 5).map((place, idx) => (
            <button
              key={place.id || idx}
              onClick={() => onPlaceSelect?.(place, cluster)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
            >
              {place.photoUrl ? (
                <img
                  src={place.photoUrl}
                  alt={place.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {place.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {place.type}
                </p>
              </div>
              {place.rating && (
                <span className="text-xs font-medium text-amber-600">
                  ★ {place.rating.toFixed(1)}
                </span>
              )}
            </button>
          ))}

          {cluster.places.length > 5 && (
            <div className="p-3 text-center border-t border-gray-100">
              <span className="text-xs text-gray-500">
                +{cluster.places.length - 5} more places
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClusterMapOverlay;
