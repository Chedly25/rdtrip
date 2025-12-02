/**
 * Map Constants: Editorial Cartography Design System
 *
 * Warm, sophisticated color palette inspired by luxury travel magazines.
 * Every color chosen to evoke the romance of travel and hand-illustrated maps.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const MAP_COLORS = {
  // Land & Terrain - Warm parchment tones
  land: {
    base: '#F4EDE4',           // Warm parchment
    dark: '#E8DFD3',           // Darker parchment for terrain shadows
    highlight: '#FFFBF5',      // Highlight for hillshade
    building: '#E0D6CA',       // Subtle building fill
  },

  // Water - Muted teal (not bright blue)
  water: {
    base: '#A8C5C8',           // Muted teal
    deep: '#8FB3B7',           // Deeper water areas
    label: '#6B9599',          // Water labels
  },

  // Nature & Parks
  nature: {
    park: '#C5D4B8',           // Sage green
    forest: '#B8C9A8',         // Slightly darker for forests
    grass: '#D4DEC8',          // Light grass areas
  },

  // Roads - Warm taupe hierarchy
  roads: {
    highway: '#C9B89C',        // Prominent taupe
    major: '#D4C4B0',          // Medium taupe
    minor: '#E0D6CA',          // Subtle taupe
    path: '#E8DFD3',           // Very subtle
  },

  // Borders & Boundaries
  borders: {
    country: '#C9B89C',        // Soft tan
    state: '#D4C4B0',          // Lighter
    admin: '#E0D6CA',          // Very subtle
  },

  // Typography
  labels: {
    city: '#5C4D3D',           // Dark warm brown
    town: '#7A6B5A',           // Medium brown
    country: '#8B7355',        // Lighter brown
    water: '#6B9599',          // Teal for water labels
    road: '#9A8B7A',           // Muted road labels
  },

  // Journey Visualization
  journey: {
    routeStart: '#C45830',     // Terracotta
    routeEnd: '#D4A853',       // Gold
    routeGlow: 'rgba(196, 88, 48, 0.35)',
    routeDash: '#D4A853',      // Gold dashes
  },

  // Markers
  markers: {
    shadow: 'rgba(92, 77, 61, 0.25)',
    highlight: 'rgba(255, 251, 245, 0.95)',
    border: '#FFFFFF',
  },

  // Overlays
  overlays: {
    vignette: 'rgba(44, 36, 23, 0.12)',
    fog: 'rgba(244, 237, 228, 0.5)',
  },
} as const;

// =============================================================================
// ROUTE STYLING
// =============================================================================

export const ROUTE_STYLE = {
  // Main route line
  main: {
    width: 5,
    opacity: 0.92,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  },

  // Glow effect (beneath main line)
  glow: {
    width: 22,
    blur: 14,
    opacity: 0.35,
  },

  // Animated dash overlay
  dash: {
    width: 3,
    opacity: 0.85,
    dashArray: [0, 4, 3] as number[],
    animationSpeed: 50, // ms per frame
  },

  // Distance markers
  distanceMarker: {
    intervalKm: 100,
    size: 24,
  },
} as const;

// =============================================================================
// MARKER STYLING
// =============================================================================

export const MARKER_STYLE = {
  // City "Travel Stamp" markers
  city: {
    collapsedSize: 56,
    expandedWidth: 180,
    expandedHeight: 120,
    borderRadius: 16,
    borderWidth: 3,
    photoAspectRatio: 1.2,
    numberBadgeSize: 24,
  },

  // Landmark markers
  landmark: {
    size: 44,
    borderRadius: 22,
    borderWidth: 3,
    iconSize: 20,
    pulseRadius: 60,
  },

  // Animation timings
  animation: {
    hoverDuration: 0.2,
    expandDuration: 0.3,
    springStiffness: 400,
    springDamping: 25,
  },
} as const;

// =============================================================================
// MAP CONFIGURATION
// =============================================================================

export const MAP_CONFIG = {
  // Default view settings
  defaultZoom: 6,
  minZoom: 3,
  maxZoom: 18,
  defaultPitch: 0,
  maxPitch: 60,

  // Animation settings
  flyToDuration: 2000,
  fitBoundsPadding: {
    top: 120,
    bottom: 280,
    left: 100,
    right: 100,
  },

  // Performance
  maxMarkerRenderDistance: 500, // km
  labelCollisionPadding: 2,
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const MAP_TYPOGRAPHY = {
  // Font families (loaded separately)
  fonts: {
    display: 'Playfair Display, Georgia, serif',
    body: 'DM Sans, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },

  // City label sizes by zoom level
  cityLabel: {
    minZoom: 4,
    maxZoom: 12,
    minSize: 11,
    maxSize: 16,
    letterSpacing: 0.02,
  },

  // Country label styling
  countryLabel: {
    size: 12,
    letterSpacing: 0.15,
    textTransform: 'uppercase' as const,
  },
} as const;

// =============================================================================
// OVERLAY SETTINGS
// =============================================================================

export const OVERLAY_CONFIG = {
  // Vignette
  vignette: {
    enabled: true,
    intensity: 0.08,
    spread: 0.7,
  },

  // Paper grain texture
  grain: {
    enabled: true,
    opacity: 0.025,
    blendMode: 'multiply' as const,
  },

  // Fog of war (unexplored areas)
  fog: {
    enabled: false, // Optional feature
    bufferKm: 50,
    opacity: 0.4,
  },
} as const;

// =============================================================================
// ANIMATION ORCHESTRATION
// =============================================================================

export const ORCHESTRATION = {
  // Initial load sequence timings (ms)
  initialLoad: {
    mapFadeIn: 800,
    routeDrawDuration: 2500,
    markerDropDelay: 100,      // Stagger between markers
    markerDropDuration: 400,
    landmarkFadeIn: 500,
    finalSettleDuration: 1000,
  },

  // City selection animation
  cityFocus: {
    duration: 1500,
    zoom: 11,
    pitch: 25,
  },

  // Celebration particles
  celebration: {
    particleCount: 12,
    duration: 600,
    spread: 50,
  },
} as const;

// =============================================================================
// LANDMARK ICONS BY TYPE
// =============================================================================

export const LANDMARK_ICONS: Record<string, string> = {
  historic: '🏛️',
  natural: '🏔️',
  museum: '🎨',
  religious: '⛪',
  castle: '🏰',
  garden: '🌳',
  beach: '🏖️',
  viewpoint: '🌄',
  monument: '🗿',
  bridge: '🌉',
  default: '⭐',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get gradient color along route based on progress (0-1)
 */
export const getRouteGradientColor = (progress: number): string => {
  const start = hexToRgb(MAP_COLORS.journey.routeStart);
  const end = hexToRgb(MAP_COLORS.journey.routeEnd);

  if (!start || !end) return MAP_COLORS.journey.routeStart;

  const r = Math.round(start.r + (end.r - start.r) * progress);
  const g = Math.round(start.g + (end.g - start.g) * progress);
  const b = Math.round(start.b + (end.b - start.b) * progress);

  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Convert hex color to RGB object
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Get landmark icon by type
 */
export const getLandmarkIcon = (type: string): string => {
  return LANDMARK_ICONS[type.toLowerCase()] || LANDMARK_ICONS.default;
};
