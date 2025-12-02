/**
 * Editorial Cartography Map Style
 *
 * Programmatic style transformations applied to the base Mapbox style.
 * Creates a warm, vintage-inspired map aesthetic reminiscent of
 * hand-illustrated travel magazines.
 */

import { MAP_COLORS } from './mapConstants';

// Using 'any' for Mapbox map instance to avoid strict type conflicts
// with the dynamic style property modifications
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapboxMap = any;

// =============================================================================
// STYLE TRANSFORMATION LAYERS
// =============================================================================

/**
 * Layer modifications to apply on top of base style
 * Each entry defines how to modify a specific layer type
 */
const LAYER_MODIFICATIONS: Record<string, Record<string, any>> = {
  // -------------------------------------------------------------------------
  // BACKGROUND & LAND
  // -------------------------------------------------------------------------
  background: {
    paint: {
      'background-color': MAP_COLORS.land.base,
    },
  },

  land: {
    paint: {
      'background-color': MAP_COLORS.land.base,
    },
  },

  landcover: {
    paint: {
      'fill-color': [
        'match',
        ['get', 'class'],
        'grass', MAP_COLORS.nature.grass,
        'scrub', MAP_COLORS.nature.park,
        'wood', MAP_COLORS.nature.forest,
        'crop', MAP_COLORS.nature.grass,
        MAP_COLORS.land.base,
      ],
      'fill-opacity': 0.6,
    },
  },

  // -------------------------------------------------------------------------
  // WATER
  // -------------------------------------------------------------------------
  water: {
    paint: {
      'fill-color': MAP_COLORS.water.base,
    },
  },

  'water-depth': {
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['get', 'depth'],
        0, MAP_COLORS.water.base,
        200, MAP_COLORS.water.deep,
      ],
    },
  },

  waterway: {
    paint: {
      'line-color': MAP_COLORS.water.base,
      'line-opacity': 0.8,
    },
  },

  // -------------------------------------------------------------------------
  // PARKS & NATURE
  // -------------------------------------------------------------------------
  landuse: {
    paint: {
      'fill-color': [
        'match',
        ['get', 'class'],
        'park', MAP_COLORS.nature.park,
        'pitch', MAP_COLORS.nature.grass,
        'cemetery', MAP_COLORS.nature.park,
        'hospital', MAP_COLORS.land.dark,
        'school', MAP_COLORS.land.dark,
        'industrial', MAP_COLORS.land.dark,
        MAP_COLORS.land.base,
      ],
      'fill-opacity': 0.5,
    },
  },

  park: {
    paint: {
      'fill-color': MAP_COLORS.nature.park,
      'fill-opacity': 0.6,
    },
  },

  'national-park': {
    paint: {
      'fill-color': MAP_COLORS.nature.forest,
      'fill-opacity': 0.4,
    },
  },

  // -------------------------------------------------------------------------
  // BUILDINGS
  // -------------------------------------------------------------------------
  building: {
    paint: {
      'fill-color': MAP_COLORS.land.building,
      'fill-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14, 0,
        16, 0.4,
      ],
    },
    minzoom: 14,
  },

  // -------------------------------------------------------------------------
  // ROADS
  // -------------------------------------------------------------------------
  'road-motorway': {
    paint: {
      'line-color': MAP_COLORS.roads.highway,
      'line-width': [
        'interpolate',
        ['exponential', 1.5],
        ['zoom'],
        5, 0.5,
        10, 2,
        18, 12,
      ],
    },
  },

  'road-trunk': {
    paint: {
      'line-color': MAP_COLORS.roads.highway,
      'line-width': [
        'interpolate',
        ['exponential', 1.5],
        ['zoom'],
        5, 0.3,
        10, 1.5,
        18, 10,
      ],
    },
  },

  'road-primary': {
    paint: {
      'line-color': MAP_COLORS.roads.major,
      'line-width': [
        'interpolate',
        ['exponential', 1.5],
        ['zoom'],
        5, 0.2,
        10, 1,
        18, 8,
      ],
    },
  },

  'road-secondary': {
    paint: {
      'line-color': MAP_COLORS.roads.major,
      'line-width': [
        'interpolate',
        ['exponential', 1.5],
        ['zoom'],
        8, 0.2,
        12, 0.8,
        18, 6,
      ],
    },
  },

  'road-street': {
    paint: {
      'line-color': MAP_COLORS.roads.minor,
      'line-width': [
        'interpolate',
        ['exponential', 1.5],
        ['zoom'],
        12, 0.3,
        18, 4,
      ],
    },
  },

  'road-minor': {
    paint: {
      'line-color': MAP_COLORS.roads.minor,
      'line-opacity': 0.6,
    },
  },

  'road-path': {
    paint: {
      'line-color': MAP_COLORS.roads.path,
      'line-opacity': 0.5,
      'line-dasharray': [2, 2],
    },
  },

  // -------------------------------------------------------------------------
  // BOUNDARIES
  // -------------------------------------------------------------------------
  'admin-0-boundary': {
    paint: {
      'line-color': MAP_COLORS.borders.country,
      'line-width': 1.5,
      'line-dasharray': [3, 2],
    },
  },

  'admin-1-boundary': {
    paint: {
      'line-color': MAP_COLORS.borders.state,
      'line-width': 0.8,
      'line-dasharray': [2, 2],
      'line-opacity': 0.6,
    },
  },

  // -------------------------------------------------------------------------
  // LABELS - PLACES
  // -------------------------------------------------------------------------
  'place-city': {
    paint: {
      'text-color': MAP_COLORS.labels.city,
      'text-halo-color': MAP_COLORS.land.base,
      'text-halo-width': 1.5,
    },
    layout: {
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 11,
        8, 14,
        12, 18,
      ],
      'text-letter-spacing': 0.02,
    },
  },

  'place-town': {
    paint: {
      'text-color': MAP_COLORS.labels.town,
      'text-halo-color': MAP_COLORS.land.base,
      'text-halo-width': 1.2,
    },
    layout: {
      'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        6, 10,
        12, 14,
      ],
    },
  },

  'place-village': {
    paint: {
      'text-color': MAP_COLORS.labels.town,
      'text-halo-color': MAP_COLORS.land.base,
      'text-halo-width': 1,
      'text-opacity': 0.8,
    },
  },

  // -------------------------------------------------------------------------
  // LABELS - COUNTRIES
  // -------------------------------------------------------------------------
  'country-label': {
    paint: {
      'text-color': MAP_COLORS.labels.country,
      'text-halo-color': MAP_COLORS.land.base,
      'text-halo-width': 1.5,
    },
    layout: {
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        2, 10,
        6, 14,
      ],
      'text-letter-spacing': 0.15,
      'text-transform': 'uppercase',
    },
  },

  'state-label': {
    paint: {
      'text-color': MAP_COLORS.labels.country,
      'text-halo-color': MAP_COLORS.land.base,
      'text-halo-width': 1,
      'text-opacity': 0.7,
    },
    layout: {
      'text-letter-spacing': 0.1,
      'text-transform': 'uppercase',
    },
  },

  // -------------------------------------------------------------------------
  // LABELS - WATER
  // -------------------------------------------------------------------------
  'water-point-label': {
    paint: {
      'text-color': MAP_COLORS.water.label,
      'text-halo-color': MAP_COLORS.water.base,
      'text-halo-width': 1,
    },
    layout: {
      'text-font': ['DIN Pro Italic', 'Arial Unicode MS Regular'],
    },
  },

  'water-line-label': {
    paint: {
      'text-color': MAP_COLORS.water.label,
      'text-halo-color': MAP_COLORS.water.base,
      'text-halo-width': 1,
    },
    layout: {
      'text-font': ['DIN Pro Italic', 'Arial Unicode MS Regular'],
    },
  },

  // -------------------------------------------------------------------------
  // LABELS - ROADS (minimize)
  // -------------------------------------------------------------------------
  'road-label': {
    paint: {
      'text-color': MAP_COLORS.labels.road,
      'text-halo-color': MAP_COLORS.land.base,
      'text-halo-width': 1,
      'text-opacity': 0.7,
    },
    layout: {
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12, 9,
        18, 12,
      ],
    },
  },

  // -------------------------------------------------------------------------
  // POI LABELS (hide most - we use custom markers)
  // -------------------------------------------------------------------------
  'poi-label': {
    paint: {
      'text-opacity': 0, // Hide default POI labels
    },
  },

  'transit-label': {
    paint: {
      'text-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 0,
        14, 0.5,
      ],
    },
  },
};

// =============================================================================
// HILLSHADE LAYER (for terrain depth)
// =============================================================================

const HILLSHADE_LAYER = {
  id: 'editorial-hillshade',
  type: 'hillshade',
  source: 'mapbox-dem',
  paint: {
    'hillshade-shadow-color': MAP_COLORS.land.dark,
    'hillshade-highlight-color': MAP_COLORS.land.highlight,
    'hillshade-accent-color': MAP_COLORS.land.dark,
    'hillshade-illumination-direction': 315,
    'hillshade-exaggeration': 0.15,
  },
};

// =============================================================================
// APPLY STYLE TRANSFORMATIONS
// =============================================================================

/**
 * Apply editorial cartography style transformations to a loaded map
 */
export const applyEditorialStyle = (map: MapboxMap): void => {
  // Wait for style to be fully loaded
  if (!map.isStyleLoaded()) {
    map.once('style.load', () => applyEditorialStyle(map));
    return;
  }

  const style = map.getStyle();
  if (!style || !style.layers) return;

  // Apply modifications to existing layers
  style.layers.forEach((layer: { id: string; type: string }) => {
    const layerId = layer.id;

    // Find matching modification (check for partial matches)
    const modificationKey = Object.keys(LAYER_MODIFICATIONS).find((key) => {
      return layerId.includes(key) || layerId === key;
    });

    if (modificationKey) {
      const modification = LAYER_MODIFICATIONS[modificationKey];

      // Apply paint properties
      if (modification.paint) {
        Object.entries(modification.paint).forEach(([prop, value]) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            map.setPaintProperty(layerId, prop as any, value);
          } catch {
            // Layer might not support this property
          }
        });
      }

      // Apply layout properties
      if (modification.layout) {
        Object.entries(modification.layout).forEach(([prop, value]) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            map.setLayoutProperty(layerId, prop as any, value);
          } catch {
            // Layer might not support this property
          }
        });
      }

      // Apply zoom constraints
      if (modification.minzoom !== undefined) {
        try {
          map.setLayerZoomRange(layerId, modification.minzoom, modification.maxzoom || 24);
        } catch {
          // Ignore
        }
      }
    }
  });

  // Add terrain source if not exists
  if (!map.getSource('mapbox-dem')) {
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });
  }

  // Add hillshade layer for subtle terrain
  if (!map.getLayer('editorial-hillshade')) {
    // Find the first symbol layer to insert hillshade below labels
    const firstSymbolId = style.layers.find((layer: { id: string; type: string }) => layer.type === 'symbol')?.id;

    map.addLayer(HILLSHADE_LAYER, firstSymbolId);
  }

  console.log('✨ Editorial cartography style applied');
};

// =============================================================================
// REMOVE UNWANTED LAYERS
// =============================================================================

/**
 * Remove or hide layers we don't want in the editorial style
 */
export const cleanupUnwantedLayers = (map: MapboxMap): void => {
  const layersToHide = [
    'poi-label',
    'airport-label',
    'building-number-label',
    'building-entrance',
  ];

  const layersToRemove = [
    'building-extrusion', // No 3D buildings
    'sky', // No sky effect
  ];

  layersToHide.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', 'none');
    }
  });

  layersToRemove.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      try {
        map.removeLayer(layerId);
      } catch {
        // Ignore
      }
    }
  });
};

// =============================================================================
// FULL STYLE APPLICATION
// =============================================================================

/**
 * Complete style initialization for editorial cartography map
 */
export const initializeEditorialMap = (map: MapboxMap): void => {
  // Apply on initial load
  map.on('load', () => {
    applyEditorialStyle(map);
    cleanupUnwantedLayers(map);
  });

  // Reapply if style changes
  map.on('style.load', () => {
    applyEditorialStyle(map);
    cleanupUnwantedLayers(map);
  });
};

// =============================================================================
// CSS VARIABLES FOR COMPONENTS
// =============================================================================

/**
 * Inject CSS variables for map-related components
 */
export const injectMapCSSVariables = (): void => {
  const root = document.documentElement;

  // Land & terrain
  root.style.setProperty('--map-land', MAP_COLORS.land.base);
  root.style.setProperty('--map-land-dark', MAP_COLORS.land.dark);
  root.style.setProperty('--map-land-highlight', MAP_COLORS.land.highlight);

  // Water
  root.style.setProperty('--map-water', MAP_COLORS.water.base);
  root.style.setProperty('--map-water-deep', MAP_COLORS.water.deep);

  // Nature
  root.style.setProperty('--map-park', MAP_COLORS.nature.park);

  // Roads
  root.style.setProperty('--map-road-major', MAP_COLORS.roads.major);
  root.style.setProperty('--map-road-minor', MAP_COLORS.roads.minor);

  // Journey
  root.style.setProperty('--route-start', MAP_COLORS.journey.routeStart);
  root.style.setProperty('--route-end', MAP_COLORS.journey.routeEnd);
  root.style.setProperty('--route-glow', MAP_COLORS.journey.routeGlow);

  // Markers
  root.style.setProperty('--marker-shadow', MAP_COLORS.markers.shadow);
  root.style.setProperty('--marker-highlight', MAP_COLORS.markers.highlight);

  // Labels
  root.style.setProperty('--map-label-city', MAP_COLORS.labels.city);
  root.style.setProperty('--map-label-country', MAP_COLORS.labels.country);
};
