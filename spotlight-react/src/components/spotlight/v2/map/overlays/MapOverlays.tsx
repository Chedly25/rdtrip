/**
 * Map Overlays: Atmospheric Effects
 *
 * Visual layers that add depth and character to the map:
 * - Vignette: Subtle darkening around edges to focus attention
 * - Grain: Paper-like texture for vintage feel
 *
 * These are purely decorative CSS overlays - no interaction with map data.
 */

import { memo } from 'react';
import { OVERLAY_CONFIG, MAP_COLORS } from '../mapConstants';

// =============================================================================
// VIGNETTE OVERLAY
// =============================================================================

/**
 * Subtle radial gradient that darkens the edges of the map,
 * drawing focus to the center where the route typically sits.
 */
const VignetteOverlay = memo(() => {
  if (!OVERLAY_CONFIG.vignette.enabled) return null;

  const intensity = OVERLAY_CONFIG.vignette.intensity;
  const spread = OVERLAY_CONFIG.vignette.spread;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[5]"
      aria-hidden="true"
      style={{
        background: `radial-gradient(
          ellipse 85% 75% at 50% 50%,
          transparent 0%,
          transparent ${spread * 100}%,
          ${MAP_COLORS.overlays.vignette.replace('0.12', String(intensity))} 100%
        )`,
      }}
    />
  );
});

VignetteOverlay.displayName = 'VignetteOverlay';

// =============================================================================
// GRAIN OVERLAY
// =============================================================================

/**
 * Subtle noise texture that gives the map a paper-like quality.
 * Uses SVG filter for performant, resolution-independent noise.
 */
const GrainOverlay = memo(() => {
  if (!OVERLAY_CONFIG.grain.enabled) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[5]"
      aria-hidden="true"
      style={{
        opacity: OVERLAY_CONFIG.grain.opacity,
        mixBlendMode: OVERLAY_CONFIG.grain.blendMode,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
      }}
    />
  );
});

GrainOverlay.displayName = 'GrainOverlay';

// =============================================================================
// CORNER ACCENT (Decorative)
// =============================================================================

/**
 * Subtle decorative accent in corners for editorial feel.
 * Inspired by vintage map ornaments.
 */
const CornerAccents = memo(() => {
  const accentColor = MAP_COLORS.roads.highway;

  return (
    <>
      {/* Top-left corner accent */}
      <div
        className="absolute top-4 left-4 pointer-events-none z-[5] opacity-20"
        aria-hidden="true"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M0 40V0H40"
            stroke={accentColor}
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="0" cy="0" r="3" fill={accentColor} />
        </svg>
      </div>

      {/* Top-right corner accent */}
      <div
        className="absolute top-4 right-4 pointer-events-none z-[5] opacity-20"
        aria-hidden="true"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M40 40V0H0"
            stroke={accentColor}
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="40" cy="0" r="3" fill={accentColor} />
        </svg>
      </div>

      {/* Bottom-left corner accent */}
      <div
        className="absolute bottom-[290px] left-4 pointer-events-none z-[5] opacity-20"
        aria-hidden="true"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path
            d="M0 0V40H40"
            stroke={accentColor}
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="0" cy="40" r="3" fill={accentColor} />
        </svg>
      </div>

      {/* Bottom-right corner - skip due to bottom sheet overlap */}
    </>
  );
});

CornerAccents.displayName = 'CornerAccents';

// =============================================================================
// COMPASS ROSE (Decorative)
// =============================================================================

/**
 * Elegant compass rose in a corner for cartographic authenticity.
 */
const CompassRose = memo(() => {
  const primaryColor = MAP_COLORS.labels.city;
  const secondaryColor = MAP_COLORS.roads.highway;

  return (
    <div
      className="absolute top-20 right-4 pointer-events-none z-[5] opacity-30"
      aria-hidden="true"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        {/* Outer circle */}
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke={secondaryColor}
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />

        {/* Inner circle */}
        <circle
          cx="24"
          cy="24"
          r="16"
          stroke={secondaryColor}
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
        />

        {/* North pointer */}
        <path
          d="M24 4L27 20H21L24 4Z"
          fill={primaryColor}
        />

        {/* South pointer */}
        <path
          d="M24 44L21 28H27L24 44Z"
          fill={secondaryColor}
          opacity="0.5"
        />

        {/* East pointer */}
        <path
          d="M44 24L28 21V27L44 24Z"
          fill={secondaryColor}
          opacity="0.5"
        />

        {/* West pointer */}
        <path
          d="M4 24L20 27V21L4 24Z"
          fill={secondaryColor}
          opacity="0.5"
        />

        {/* N label */}
        <text
          x="24"
          y="11"
          textAnchor="middle"
          fontSize="6"
          fill={primaryColor}
          fontFamily="serif"
          fontWeight="600"
        >
          N
        </text>
      </svg>
    </div>
  );
});

CompassRose.displayName = 'CompassRose';

// =============================================================================
// COMBINED MAP OVERLAYS
// =============================================================================

interface MapOverlaysProps {
  showDecorations?: boolean;
}

/**
 * All atmospheric overlays combined into a single component.
 * Place this as a sibling to the map container, absolutely positioned.
 */
const MapOverlays = memo(({ showDecorations = true }: MapOverlaysProps) => {
  return (
    <>
      <VignetteOverlay />
      <GrainOverlay />
      {showDecorations && (
        <>
          <CornerAccents />
          <CompassRose />
        </>
      )}
    </>
  );
});

MapOverlays.displayName = 'MapOverlays';

export {
  MapOverlays,
  VignetteOverlay,
  GrainOverlay,
  CornerAccents,
  CompassRose,
};

export default MapOverlays;
