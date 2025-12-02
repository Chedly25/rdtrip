/**
 * Animated Route Line
 *
 * A beautiful, multi-layered route visualization:
 * 1. Glow layer - soft ambient light beneath the route
 * 2. Base line - solid gradient from terracotta to gold
 * 3. Animated dash - flowing dashes suggesting movement toward destination
 *
 * The animation creates a sense of journey and anticipation.
 */

import { useEffect, useRef, useCallback } from 'react';
import { MAP_COLORS, ROUTE_STYLE } from '../mapConstants';

// Layer IDs for the route visualization
export const ROUTE_LAYER_IDS = {
  glow: 'route-glow',
  base: 'route-base',
  dash: 'route-dash',
} as const;

interface AnimatedRouteLineProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any;
  routeGeometry: GeoJSON.Geometry | null;
  isMapLoaded: boolean;
}

/**
 * Hook to manage the animated route line layers
 */
export const useAnimatedRouteLine = ({
  map,
  routeGeometry,
  isMapLoaded,
}: AnimatedRouteLineProps) => {
  const animationRef = useRef<number | null>(null);
  const dashOffsetRef = useRef(0);

  // Cleanup function to remove all route layers
  const cleanupRouteLayers = useCallback(() => {
    if (!map) return;

    // Cancel any running animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Remove layers in reverse order (top to bottom)
    Object.values(ROUTE_LAYER_IDS).reverse().forEach((layerId) => {
      if (map.getLayer(layerId)) {
        try {
          map.removeLayer(layerId);
        } catch {
          // Ignore
        }
      }
    });

    // Remove source
    if (map.getSource('route')) {
      try {
        map.removeSource('route');
      } catch {
        // Ignore
      }
    }
  }, [map]);

  // Add route layers
  const addRouteLayers = useCallback(() => {
    if (!map || !routeGeometry || !isMapLoaded) return;

    // Clean up any existing route layers first
    cleanupRouteLayers();

    // Add route source
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: routeGeometry,
      },
    });

    // Layer 1: Glow effect (bottom layer)
    // Creates a soft ambient light beneath the route
    map.addLayer({
      id: ROUTE_LAYER_IDS.glow,
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': MAP_COLORS.journey.routeStart,
        'line-width': ROUTE_STYLE.glow.width,
        'line-blur': ROUTE_STYLE.glow.blur,
        'line-opacity': ROUTE_STYLE.glow.opacity,
      },
    });

    // Layer 2: Base route line (middle layer)
    // Solid line with the primary route color
    map.addLayer({
      id: ROUTE_LAYER_IDS.base,
      type: 'line',
      source: 'route',
      layout: {
        'line-join': ROUTE_STYLE.main.lineJoin,
        'line-cap': ROUTE_STYLE.main.lineCap,
      },
      paint: {
        'line-color': MAP_COLORS.journey.routeStart,
        'line-width': ROUTE_STYLE.main.width,
        'line-opacity': ROUTE_STYLE.main.opacity,
      },
    });

    // Layer 3: Animated dash overlay (top layer)
    // Creates flowing movement toward destination
    map.addLayer({
      id: ROUTE_LAYER_IDS.dash,
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': MAP_COLORS.journey.routeDash,
        'line-width': ROUTE_STYLE.dash.width,
        'line-opacity': ROUTE_STYLE.dash.opacity,
        'line-dasharray': ROUTE_STYLE.dash.dashArray,
      },
    });

    // Start the dash animation
    startDashAnimation();
  }, [map, routeGeometry, isMapLoaded, cleanupRouteLayers]);

  // Animate the dash pattern to create flowing movement
  const startDashAnimation = useCallback(() => {
    if (!map) return;

    const animate = () => {
      // Increment the offset to create movement
      dashOffsetRef.current = (dashOffsetRef.current + 0.15) % 7;

      // Update the dash array to simulate movement
      // The pattern cycles through to create a flowing effect
      const offset = dashOffsetRef.current;
      const dashArray = [offset, 4, 3];

      try {
        if (map.getLayer(ROUTE_LAYER_IDS.dash)) {
          map.setPaintProperty(ROUTE_LAYER_IDS.dash, 'line-dasharray', dashArray);
        }
      } catch {
        // Layer might not exist yet
      }

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animationRef.current = requestAnimationFrame(animate);
  }, [map]);

  // Setup effect
  useEffect(() => {
    if (map && isMapLoaded && routeGeometry) {
      addRouteLayers();
    }

    return () => {
      cleanupRouteLayers();
    };
  }, [map, isMapLoaded, routeGeometry, addRouteLayers, cleanupRouteLayers]);

  return {
    cleanupRouteLayers,
    addRouteLayers,
  };
};

/**
 * Standalone function to add route layers to a map
 * Use this when not using the hook (e.g., in MapViewV2's render function)
 */
export const addRouteLayersToMap = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  routeGeometry: GeoJSON.Geometry,
  agentColors?: { primary: string; secondary: string; accent: string }
): (() => void) | null => {
  if (!map || !routeGeometry) return null;

  // Use agent colors or default journey colors
  const startColor = agentColors?.accent || MAP_COLORS.journey.routeStart;
  const dashColor = agentColors?.secondary || MAP_COLORS.journey.routeDash;

  // Clean up any existing route
  Object.values(ROUTE_LAYER_IDS).reverse().forEach((layerId) => {
    if (map.getLayer(layerId)) {
      try {
        map.removeLayer(layerId);
      } catch {
        // Ignore
      }
    }
  });

  if (map.getSource('route')) {
    try {
      map.removeSource('route');
    } catch {
      // Ignore
    }
  }

  // Add route source
  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: routeGeometry,
    },
  });

  // Layer 1: Glow effect
  map.addLayer({
    id: ROUTE_LAYER_IDS.glow,
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': startColor,
      'line-width': ROUTE_STYLE.glow.width,
      'line-blur': ROUTE_STYLE.glow.blur,
      'line-opacity': ROUTE_STYLE.glow.opacity,
    },
  });

  // Layer 2: Base route line
  map.addLayer({
    id: ROUTE_LAYER_IDS.base,
    type: 'line',
    source: 'route',
    layout: {
      'line-join': ROUTE_STYLE.main.lineJoin,
      'line-cap': ROUTE_STYLE.main.lineCap,
    },
    paint: {
      'line-color': startColor,
      'line-width': ROUTE_STYLE.main.width,
      'line-opacity': ROUTE_STYLE.main.opacity,
    },
  });

  // Layer 3: Animated dash overlay
  map.addLayer({
    id: ROUTE_LAYER_IDS.dash,
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': dashColor,
      'line-width': ROUTE_STYLE.dash.width,
      'line-opacity': ROUTE_STYLE.dash.opacity,
      'line-dasharray': ROUTE_STYLE.dash.dashArray,
    },
  });

  // Start animation
  let dashOffset = 0;
  let animationFrame: number | null = null;

  const animate = () => {
    dashOffset = (dashOffset + 0.15) % 7;
    const dashArray = [dashOffset, 4, 3];

    try {
      if (map.getLayer(ROUTE_LAYER_IDS.dash)) {
        map.setPaintProperty(ROUTE_LAYER_IDS.dash, 'line-dasharray', dashArray);
      }
    } catch {
      // Layer might not exist
    }

    animationFrame = requestAnimationFrame(animate);
  };

  animationFrame = requestAnimationFrame(animate);

  // Return cleanup function
  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    Object.values(ROUTE_LAYER_IDS).reverse().forEach((layerId) => {
      if (map.getLayer(layerId)) {
        try {
          map.removeLayer(layerId);
        } catch {
          // Ignore
        }
      }
    });

    if (map.getSource('route')) {
      try {
        map.removeSource('route');
      } catch {
        // Ignore
      }
    }
  };
};

export default useAnimatedRouteLine;
