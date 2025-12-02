/**
 * Map Interactions Hook
 *
 * Handles advanced map interactions including:
 * - Route segment highlighting on marker hover
 * - Smooth camera transitions when focusing elements
 * - Cursor state management
 *
 * Design: Provides delightful micro-interactions that
 * make the map feel responsive and alive.
 */

import { useCallback, useRef } from 'react';
import { ROUTE_LAYER_IDS } from '../layers/AnimatedRouteLine';
import { easings } from '../orchestration/JourneyOrchestrator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapboxMap = any;

interface UseMapInteractionsProps {
  map: MapboxMap | null;
  isMapLoaded: boolean;
}

interface FocusOptions {
  zoom?: number;
  pitch?: number;
  duration?: number;
  offset?: [number, number];
}

export const useMapInteractions = ({
  map,
  isMapLoaded,
}: UseMapInteractionsProps) => {
  const previousHighlightRef = useRef<number | null>(null);

  /**
   * Highlight a specific segment of the route
   * by adjusting the line opacity/glow
   */
  const highlightRouteSegment = useCallback(
    (_startIndex: number, _endIndex: number) => {
      if (!map || !isMapLoaded) return;

      // For now, pulse the entire route on hover
      // Future: could use line-gradient or filter for segment-specific highlighting
      try {
        const glowLayer = map.getLayer(ROUTE_LAYER_IDS.glow);
        if (glowLayer) {
          map.setPaintProperty(ROUTE_LAYER_IDS.glow, 'line-opacity', 0.5);
        }

        const baseLayer = map.getLayer(ROUTE_LAYER_IDS.base);
        if (baseLayer) {
          map.setPaintProperty(ROUTE_LAYER_IDS.base, 'line-opacity', 1);
        }
      } catch (error) {
        console.warn('Could not highlight route segment:', error);
      }
    },
    [map, isMapLoaded]
  );

  /**
   * Reset route highlighting to default state
   */
  const resetRouteHighlight = useCallback(() => {
    if (!map || !isMapLoaded) return;

    try {
      const glowLayer = map.getLayer(ROUTE_LAYER_IDS.glow);
      if (glowLayer) {
        map.setPaintProperty(ROUTE_LAYER_IDS.glow, 'line-opacity', 0.35);
      }

      const baseLayer = map.getLayer(ROUTE_LAYER_IDS.base);
      if (baseLayer) {
        map.setPaintProperty(ROUTE_LAYER_IDS.base, 'line-opacity', 0.92);
      }
    } catch (error) {
      console.warn('Could not reset route highlight:', error);
    }

    previousHighlightRef.current = null;
  }, [map, isMapLoaded]);

  /**
   * Focus the map on a specific location with smooth animation
   */
  const focusLocation = useCallback(
    (
      coordinates: [number, number],
      options: FocusOptions = {}
    ) => {
      if (!map || !isMapLoaded) return;

      const {
        zoom = 11,
        pitch = 30,
        duration = 1500,
        offset = [0, 0],
      } = options;

      map.flyTo({
        center: coordinates,
        zoom,
        pitch,
        duration,
        offset,
        easing: easings.easeInOutQuart,
      });
    },
    [map, isMapLoaded]
  );

  /**
   * Fit the map to show multiple coordinates
   */
  const fitToCoordinates = useCallback(
    (
      coordinates: [number, number][],
      padding = { top: 100, bottom: 200, left: 80, right: 80 }
    ) => {
      if (!map || !isMapLoaded || coordinates.length === 0) return;

      // Calculate bounds
      const bounds = coordinates.reduce(
        (acc, coord) => {
          return {
            minLng: Math.min(acc.minLng, coord[0]),
            maxLng: Math.max(acc.maxLng, coord[0]),
            minLat: Math.min(acc.minLat, coord[1]),
            maxLat: Math.max(acc.maxLat, coord[1]),
          };
        },
        {
          minLng: Infinity,
          maxLng: -Infinity,
          minLat: Infinity,
          maxLat: -Infinity,
        }
      );

      map.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        {
          padding,
          duration: 1200,
          maxZoom: 14,
          easing: easings.easeOutCubic,
        }
      );
    },
    [map, isMapLoaded]
  );

  /**
   * Add a subtle pulse effect to the map
   * (for attention-grabbing moments)
   */
  const pulseMap = useCallback(() => {
    if (!map || !isMapLoaded) return;

    const container = map.getContainer();
    if (!container) return;

    // Add pulse animation class
    container.style.transition = 'transform 0.2s ease-out';
    container.style.transform = 'scale(1.01)';

    setTimeout(() => {
      container.style.transform = 'scale(1)';
    }, 200);

    setTimeout(() => {
      container.style.transition = '';
    }, 400);
  }, [map, isMapLoaded]);

  /**
   * Set cursor style on the map container
   */
  const setCursor = useCallback(
    (cursor: 'default' | 'pointer' | 'grab' | 'grabbing') => {
      if (!map) return;
      map.getCanvas().style.cursor = cursor;
    },
    [map]
  );

  return {
    highlightRouteSegment,
    resetRouteHighlight,
    focusLocation,
    fitToCoordinates,
    pulseMap,
    setCursor,
  };
};

export default useMapInteractions;
