/**
 * Journey Orchestrator
 *
 * Choreographs the initial map experience with a cinematic sequence:
 * 1. Map fades in with subtle zoom
 * 2. Route line draws itself from origin to destination
 * 3. City markers drop in sequentially with spring physics
 * 4. Landmark markers fade in with scale
 * 5. Camera settles to fit all waypoints
 *
 * This creates a sense of anticipation and storytelling - the journey
 * unfolds before the traveler's eyes.
 */

import { useCallback, useRef, useState } from 'react';
import { ORCHESTRATION, MAP_CONFIG } from '../mapConstants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapboxMap = any;

interface OrchestrationState {
  phase: 'idle' | 'fading-in' | 'drawing-route' | 'dropping-markers' | 'settling' | 'complete';
  progress: number; // 0-1 for current phase
}

interface UseJourneyOrchestratorProps {
  map: MapboxMap | null;
  isMapLoaded: boolean;
  routeGeometry: GeoJSON.LineString | null;
  cityCount: number;
  landmarkCount: number;
  onPhaseChange?: (phase: OrchestrationState['phase']) => void;
  onMarkerDrop?: (index: number, type: 'city' | 'landmark') => void;
}

/**
 * Custom easing functions for cinematic animations
 */
export const easings = {
  // Smooth ease-out for settling movements
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),

  // Bouncy spring-like effect
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // Smooth ease-in-out
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Dramatic slow-fast-slow
  easeInOutQuart: (t: number): number =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
};

/**
 * Hook for orchestrating the journey animation sequence
 */
export const useJourneyOrchestrator = ({
  map,
  isMapLoaded,
  routeGeometry,
  cityCount,
  landmarkCount,
  onPhaseChange,
  onMarkerDrop,
}: UseJourneyOrchestratorProps) => {
  const [state, setState] = useState<OrchestrationState>({
    phase: 'idle',
    progress: 0,
  });

  const animationFrameRef = useRef<number | null>(null);
  const hasPlayedRef = useRef(false);

  /**
   * Cancel any running animation
   */
  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Animate a value over time with easing
   */
  const animateValue = useCallback(
    (
      duration: number,
      onUpdate: (progress: number) => void,
      onComplete?: () => void,
      easing: (t: number) => number = easings.easeOutCubic
    ): Promise<void> => {
      return new Promise((resolve) => {
        const startTime = performance.now();

        const tick = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const rawProgress = Math.min(elapsed / duration, 1);
          const easedProgress = easing(rawProgress);

          onUpdate(easedProgress);

          if (rawProgress < 1) {
            animationFrameRef.current = requestAnimationFrame(tick);
          } else {
            onComplete?.();
            resolve();
          }
        };

        animationFrameRef.current = requestAnimationFrame(tick);
      });
    },
    []
  );

  /**
   * Phase 1: Fade in the map with subtle zoom
   */
  const fadeInMap = useCallback(async () => {
    if (!map) return;

    setState({ phase: 'fading-in', progress: 0 });
    onPhaseChange?.('fading-in');

    const container = map.getContainer();
    container.style.opacity = '0';
    container.style.transform = 'scale(0.98)';
    container.style.transition = 'none';

    // Force reflow
    container.offsetHeight;

    await animateValue(
      ORCHESTRATION.initialLoad.mapFadeIn,
      (progress) => {
        container.style.opacity = String(progress);
        container.style.transform = `scale(${0.98 + 0.02 * progress})`;
        setState({ phase: 'fading-in', progress });
      },
      () => {
        container.style.opacity = '1';
        container.style.transform = 'none';
      },
      easings.easeOutCubic
    );
  }, [map, animateValue, onPhaseChange]);

  /**
   * Phase 2: Draw the route line progressively
   * Uses line trimming or progressive geometry update
   */
  const drawRoute = useCallback(async () => {
    if (!map || !routeGeometry) return;

    setState({ phase: 'drawing-route', progress: 0 });
    onPhaseChange?.('drawing-route');

    const coordinates = routeGeometry.coordinates;
    const totalPoints = coordinates.length;

    await animateValue(
      ORCHESTRATION.initialLoad.routeDrawDuration,
      (progress) => {
        // Calculate how many points to show
        const pointsToShow = Math.floor(progress * totalPoints);
        const visibleCoords = coordinates.slice(0, Math.max(2, pointsToShow));

        // Update the route source with partial geometry
        const source = map.getSource('route');
        if (source && 'setData' in source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: visibleCoords,
            },
          });
        }

        setState({ phase: 'drawing-route', progress });
      },
      undefined,
      easings.easeInOutCubic
    );

    // Ensure full route is shown at end
    const source = map.getSource('route');
    if (source && 'setData' in source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: routeGeometry,
      });
    }
  }, [map, routeGeometry, animateValue, onPhaseChange]);

  /**
   * Phase 3: Drop in city markers sequentially
   */
  const dropMarkers = useCallback(async () => {
    setState({ phase: 'dropping-markers', progress: 0 });
    onPhaseChange?.('dropping-markers');

    const totalMarkers = cityCount + landmarkCount;
    const markerDelay = ORCHESTRATION.initialLoad.markerDropDelay;

    // Drop city markers first
    for (let i = 0; i < cityCount; i++) {
      onMarkerDrop?.(i, 'city');
      setState({
        phase: 'dropping-markers',
        progress: (i + 1) / totalMarkers,
      });
      await new Promise((r) => setTimeout(r, markerDelay));
    }

    // Then landmark markers
    for (let i = 0; i < landmarkCount; i++) {
      onMarkerDrop?.(i, 'landmark');
      setState({
        phase: 'dropping-markers',
        progress: (cityCount + i + 1) / totalMarkers,
      });
      await new Promise((r) => setTimeout(r, markerDelay * 0.7)); // Faster for landmarks
    }
  }, [cityCount, landmarkCount, onMarkerDrop, onPhaseChange]);

  /**
   * Phase 4: Settle camera to fit bounds
   */
  const settleCameraToFit = useCallback(
    async (bounds: [[number, number], [number, number]]) => {
      if (!map) return;

      setState({ phase: 'settling', progress: 0 });
      onPhaseChange?.('settling');

      map.fitBounds(bounds, {
        padding: MAP_CONFIG.fitBoundsPadding,
        duration: ORCHESTRATION.initialLoad.finalSettleDuration,
        easing: easings.easeOutCubic,
      });

      // Wait for animation to complete
      await new Promise((r) =>
        setTimeout(r, ORCHESTRATION.initialLoad.finalSettleDuration)
      );

      setState({ phase: 'complete', progress: 1 });
      onPhaseChange?.('complete');
    },
    [map, onPhaseChange]
  );

  /**
   * Run the full orchestration sequence
   */
  const playSequence = useCallback(
    async (bounds: [[number, number], [number, number]]) => {
      if (!map || !isMapLoaded || hasPlayedRef.current) return;

      hasPlayedRef.current = true;

      try {
        // Phase 1: Fade in
        await fadeInMap();

        // Small pause for dramatic effect
        await new Promise((r) => setTimeout(r, 200));

        // Phase 2: Draw route (skip if no geometry yet)
        if (routeGeometry) {
          await drawRoute();
        }

        // Phase 3: Drop markers
        await dropMarkers();

        // Phase 4: Settle
        await settleCameraToFit(bounds);
      } catch (error) {
        console.error('Orchestration error:', error);
        setState({ phase: 'complete', progress: 1 });
      }
    },
    [
      map,
      isMapLoaded,
      routeGeometry,
      fadeInMap,
      drawRoute,
      dropMarkers,
      settleCameraToFit,
    ]
  );

  /**
   * Reset the orchestrator for replay
   */
  const reset = useCallback(() => {
    cancelAnimation();
    hasPlayedRef.current = false;
    setState({ phase: 'idle', progress: 0 });
  }, [cancelAnimation]);

  /**
   * Focus on a specific city with cinematic camera move
   */
  const focusCity = useCallback(
    (coordinates: [number, number], cityName?: string) => {
      if (!map) return;

      const { duration, zoom, pitch } = ORCHESTRATION.cityFocus;

      map.flyTo({
        center: coordinates,
        zoom,
        pitch,
        duration,
        easing: easings.easeInOutQuart,
      });

      if (cityName) {
        console.log(`🎬 Focusing on ${cityName}`);
      }
    },
    [map]
  );

  return {
    state,
    playSequence,
    reset,
    focusCity,
    cancelAnimation,
    isComplete: state.phase === 'complete',
    isPlaying: !['idle', 'complete'].includes(state.phase),
  };
};

/**
 * Celebration particles component for when adding landmarks
 */
export { default as CelebrationParticles } from './CelebrationParticles';

export default useJourneyOrchestrator;
