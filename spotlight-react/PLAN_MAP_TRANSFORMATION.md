# Map Experience Transformation: Implementation Plan

## Aesthetic Direction: "Editorial Cartography"

**Concept**: A luxury travel magazine brought to life. The map should feel like a beautifully illustrated spread from Condé Nast Traveler or Monocle - warm, sophisticated, story-driven. Every element should evoke the romance of travel and the anticipation of adventure.

**Core Principles**:
- **Warmth over sterility** - No cold blues or harsh grays
- **Story over data** - The journey matters more than the coordinates
- **Craft over default** - Every pixel intentionally designed
- **Motion with purpose** - Animations that enhance, not distract

---

## Color System (Extending Existing Brand)

```css
/* Map-specific palette - warm editorial tones */
--map-land: #F4EDE4;           /* Warm parchment */
--map-land-dark: #E8DFD3;      /* Darker parchment for terrain */
--map-water: #A8C5C8;          /* Muted teal (not bright blue) */
--map-water-deep: #8FB3B7;     /* Deeper water */
--map-roads-major: #D4C4B0;    /* Warm taupe */
--map-roads-minor: #E8DFD3;    /* Light taupe */
--map-parks: #C5D4B8;          /* Sage green */
--map-buildings: #E0D6CA;      /* Warm gray */
--map-labels: #5C4D3D;         /* Dark warm brown */
--map-borders: #C9B89C;        /* Soft border tan */

/* Journey visualization */
--route-start: #C45830;        /* Terracotta (existing) */
--route-end: #D4A853;          /* Gold (existing) */
--route-glow: rgba(196, 88, 48, 0.3);

/* Marker accents */
--marker-shadow: rgba(92, 77, 61, 0.25);
--marker-highlight: rgba(255, 251, 245, 0.9);
```

---

## Phase 1: Custom Map Style (Foundation)

### 1.1 Create Mapbox Studio Style

**File**: Create style in Mapbox Studio, export style URL

**Visual Specifications**:

| Layer | Color | Notes |
|-------|-------|-------|
| Land | `#F4EDE4` | Warm parchment base |
| Water | `#A8C5C8` | Muted teal, not bright blue |
| Water labels | `#6B9599` | Darker teal for contrast |
| Parks/Nature | `#C5D4B8` | Sage green, low saturation |
| Roads (highway) | `#D4C4B0` | Warm taupe, 2px width |
| Roads (major) | `#E0D6CA` | Lighter taupe, 1.5px |
| Roads (minor) | `#E8DFD3` | Very subtle, 1px |
| Buildings | `#E0D6CA` | Minimal, only at high zoom |
| Country borders | `#C9B89C` | Dashed, subtle |
| City labels | `#5C4D3D` | Warm brown, serif font |
| POI labels | Hidden | We use custom markers |

**Typography in Map**:
- City labels: **Playfair Display** or **Cormorant Garamond** (serif)
- Country labels: **Outfit** or **DM Sans** (sans-serif, caps, letterspaced)
- Water labels: Italic serif

**Terrain/Hillshade**:
- Enable subtle hillshade with warm tones
- Opacity: 15-20%
- Highlight: `#FFFBF5`
- Shadow: `#D4C4B0`

### 1.2 Implementation in MapViewV2

```typescript
// New map style URL (after creating in Mapbox Studio)
const MAP_STYLE = 'mapbox://styles/YOUR_USERNAME/editorial-cartography';

// Or use style object for dynamic theming
const mapStyle = {
  version: 8,
  name: 'Editorial Cartography',
  sources: { /* ... */ },
  layers: [ /* ... */ ]
};
```

### 1.3 New Files to Create

```
src/
├── components/
│   └── spotlight/
│       └── v2/
│           └── map/
│               ├── MapStyleProvider.tsx    # Custom style configuration
│               ├── mapStyle.json           # Full style definition
│               └── mapConstants.ts         # Colors, fonts, etc.
```

---

## Phase 2: Animated Journey Line

### 2.1 Route Line Enhancement

**File**: `src/components/spotlight/v2/map/AnimatedRouteLine.tsx`

**Features**:
- Gradient from terracotta → gold along route length
- Animated dashed pattern flowing toward destination
- Soft glow/halo effect beneath main line
- Smooth corners with rounded line caps

**Implementation Approach**:

```typescript
// Layer structure (bottom to top):
// 1. Glow layer (blurred, wider)
// 2. Base line (solid gradient)
// 3. Animated dash overlay

// Glow effect using line-blur
map.addLayer({
  id: 'route-glow',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#C45830',
    'line-width': 20,
    'line-blur': 12,
    'line-opacity': 0.3
  }
});

// Main route with gradient
map.addLayer({
  id: 'route-main',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#C45830',
    'line-width': 5,
    'line-opacity': 0.9
  }
});

// Animated dash overlay
map.addLayer({
  id: 'route-dash',
  type: 'line',
  source: 'route',
  paint: {
    'line-color': '#D4A853',
    'line-width': 3,
    'line-dasharray': [0, 4, 3], // Animated via JS
    'line-opacity': 0.8
  }
});

// Animation loop for flowing dashes
const animateDash = (timestamp: number) => {
  const dashOffset = (timestamp / 50) % 7;
  map.setPaintProperty('route-dash', 'line-dasharray', [
    dashOffset, 4, 3
  ]);
  requestAnimationFrame(animateDash);
};
```

### 2.2 Route Drawing Animation

**On initial load or route change**:
- Route "draws itself" from origin to destination
- Duration: 2-3 seconds with easing
- Camera follows the drawing

```typescript
// Use line-gradient with animated trim
// Or use Turf.js to animate along route geometry
import * as turf from '@turf/turf';

const animateRouteDrawing = async (routeGeometry: GeoJSON.LineString) => {
  const totalLength = turf.length(routeGeometry);
  const steps = 60; // 60 frames

  for (let i = 0; i <= steps; i++) {
    const slice = turf.lineSliceAlong(routeGeometry, 0, (i / steps) * totalLength);
    map.getSource('route').setData(slice);
    await new Promise(r => setTimeout(r, 33)); // ~30fps
  }
};
```

### 2.3 Distance Markers Along Route

Small typographic badges at intervals:

```typescript
// Generate distance markers every 100km
const distanceMarkers = generateDistanceMarkers(routeGeometry, 100);

// Render as custom HTML markers
distanceMarkers.forEach(marker => {
  new mapboxgl.Marker({
    element: createDistanceMarkerElement(marker.km),
    anchor: 'center'
  })
    .setLngLat(marker.coordinates)
    .addTo(map);
});
```

**Marker Design**:
```html
<div class="distance-marker">
  <span class="km">150</span>
  <span class="unit">km</span>
</div>
```

---

## Phase 3: Travel Stamp Markers

### 3.1 City Marker Redesign

**File**: `src/components/spotlight/v2/map/TravelStampMarker.tsx`

**Concept**: Markers that look like elegant luggage tags or passport stamps

**Visual Design**:
```
┌─────────────────────────┐
│  ┌─────────────────┐    │
│  │                 │    │
│  │   [City Photo]  │ 1  │  ← Number badge
│  │                 │    │
│  └─────────────────┘    │
│  ────────────────────   │
│  BORDEAUX               │  ← City name (serif, elegant)
│  France · 2 nights      │  ← Subtitle (small)
└─────────────────────────┘
         ▼                   ← Pin pointer
```

**States**:
- **Default**: Compact (photo + number only)
- **Hover**: Expands to show name + info
- **Selected**: Full expansion + golden border glow

**Implementation**:

```tsx
interface TravelStampMarkerProps {
  index: number;
  cityName: string;
  country?: string;
  nights: number;
  imageUrl?: string;
  isSelected: boolean;
  isHovered: boolean;
  agentColors: AgentColors;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const TravelStampMarker = ({ ... }: TravelStampMarkerProps) => {
  return (
    <motion.div
      className="travel-stamp-marker"
      initial={{ scale: 0, y: -20 }}
      animate={{
        scale: 1,
        y: 0,
        width: isHovered || isSelected ? 160 : 56,
        height: isHovered || isSelected ? 100 : 56
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Glow effect for selected */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-2xl blur-xl"
          style={{ background: agentColors.accent, opacity: 0.4 }}
        />
      )}

      {/* Main stamp body */}
      <div className="stamp-body">
        {/* Photo with vintage border */}
        <div className="stamp-photo">
          <img src={imageUrl} alt={cityName} />
          <div className="vintage-border" />
        </div>

        {/* Number badge */}
        <div className="stamp-number">{index + 1}</div>

        {/* Expandable info */}
        <AnimatePresence>
          {(isHovered || isSelected) && (
            <motion.div
              className="stamp-info"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="stamp-city">{cityName}</h3>
              <p className="stamp-details">{country} · {nights} nights</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pin pointer */}
      <div className="stamp-pointer" />
    </motion.div>
  );
};
```

**CSS** (in Tailwind + custom):
```css
.travel-stamp-marker {
  @apply relative flex flex-col items-center cursor-pointer;
  filter: drop-shadow(0 4px 12px var(--marker-shadow));
}

.stamp-body {
  @apply relative bg-[#FFFBF5] rounded-2xl overflow-hidden;
  border: 3px solid white;
  box-shadow:
    inset 0 0 0 1px rgba(196, 88, 48, 0.1),
    0 2px 8px rgba(92, 77, 61, 0.15);
}

.stamp-photo {
  @apply relative w-full aspect-square overflow-hidden;
}

.stamp-photo img {
  @apply w-full h-full object-cover;
  filter: saturate(0.9) contrast(1.05);
}

.vintage-border {
  @apply absolute inset-0 pointer-events-none;
  box-shadow: inset 0 0 20px rgba(139, 115, 85, 0.2);
}

.stamp-number {
  @apply absolute top-2 right-2 w-6 h-6 rounded-full
         flex items-center justify-center
         text-white text-xs font-bold;
  background: linear-gradient(135deg, var(--route-start), var(--route-end));
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.stamp-city {
  font-family: 'Playfair Display', serif;
  @apply text-sm font-semibold text-[#2C2417] tracking-tight;
}

.stamp-details {
  @apply text-xs text-[#8B7355];
}

.stamp-pointer {
  @apply w-0 h-0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 14px solid white;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
}
```

### 3.2 Landmark Marker Redesign

**File**: `src/components/spotlight/v2/map/LandmarkStampMarker.tsx`

**Concept**: Smaller, illustrated-style markers with category icons

**Visual Design**:
- Circular with subtle pattern/texture
- Category-specific icon (cathedral, mountain, museum, etc.)
- Warm amber/gold accent ring
- Subtle pulse animation when in viewport

```tsx
const LANDMARK_ICONS = {
  historic: '🏛️',
  natural: '🏔️',
  museum: '🎨',
  religious: '⛪',
  castle: '🏰',
  garden: '🌳',
  default: '⭐'
};
```

### 3.3 Marker Connection Lines

When hovering a city, show subtle dotted lines to next/previous city:

```typescript
// On city hover, draw connection preview
const showConnectionLines = (cityIndex: number) => {
  const prevCity = route.cities[cityIndex - 1];
  const nextCity = route.cities[cityIndex + 1];

  // Draw dotted lines with distance labels
  if (prevCity) drawConnectionLine(prevCity, currentCity, 'prev');
  if (nextCity) drawConnectionLine(currentCity, nextCity, 'next');
};
```

---

## Phase 4: Atmospheric Overlays

### 4.1 Vignette Effect

**File**: `src/components/spotlight/v2/map/MapOverlays.tsx`

Darkened edges to focus attention on center:

```tsx
const VignetteOverlay = () => (
  <div
    className="absolute inset-0 pointer-events-none z-10"
    style={{
      background: `radial-gradient(
        ellipse 80% 70% at 50% 50%,
        transparent 0%,
        transparent 60%,
        rgba(44, 36, 23, 0.08) 100%
      )`
    }}
  />
);
```

### 4.2 Paper Grain Texture

Subtle noise overlay for vintage feel:

```tsx
const GrainOverlay = () => (
  <div
    className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] mix-blend-multiply"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat'
    }}
  />
);
```

### 4.3 Fog of War (Optional)

Areas far from route appear slightly faded:

```typescript
// Create a buffer around the route
const routeBuffer = turf.buffer(routeGeometry, 50, { units: 'kilometers' });

// Add fog layer that's inverse of buffer
map.addLayer({
  id: 'fog-of-war',
  type: 'fill',
  source: {
    type: 'geojson',
    data: invertedBuffer
  },
  paint: {
    'fill-color': '#F4EDE4',
    'fill-opacity': 0.4
  }
});
```

---

## Phase 5: Journey Orchestration

### 5.1 Initial Load Animation

**Sequence**:
1. Map fades in with subtle zoom (1s)
2. Route draws itself from origin to destination (2.5s)
3. City markers drop in sequentially with spring animation (0.1s stagger)
4. Landmark markers fade in with subtle scale (0.5s)
5. Camera settles to fit all waypoints

```tsx
const JourneyOrchestrator = ({ route, map }: Props) => {
  useEffect(() => {
    const orchestrate = async () => {
      // 1. Fade in map
      await fadeInMap(map, 1000);

      // 2. Draw route
      await animateRouteDrawing(map, route.geometry, 2500);

      // 3. Drop in city markers
      for (let i = 0; i < route.cities.length; i++) {
        await dropInMarker(cityMarkers[i], i * 100);
      }

      // 4. Fade in landmarks
      await fadeInLandmarks(landmarkMarkers, 500);

      // 5. Fit bounds
      map.fitBounds(bounds, { padding: 100, duration: 1000 });
    };

    orchestrate();
  }, [route]);
};
```

### 5.2 City Selection Animation

When selecting a city:

```typescript
const focusCity = (cityIndex: number) => {
  const city = route.cities[cityIndex];

  map.flyTo({
    center: [city.coordinates.lng, city.coordinates.lat],
    zoom: 11,
    pitch: 30, // Subtle tilt for drama
    bearing: 0,
    duration: 1500,
    easing: easeOutCubic
  });
};
```

### 5.3 Journey Progress Indicator

Animated icon that can "travel" along route:

```tsx
const JourneyProgressIcon = ({ progress }: { progress: number }) => {
  const position = turf.along(routeGeometry, progress * totalLength);

  return (
    <motion.div
      className="journey-icon"
      animate={{
        x: position.geometry.coordinates[0],
        y: position.geometry.coordinates[1]
      }}
    >
      {/* Vintage car or compass icon */}
      <Car className="w-6 h-6 text-[#C45830]" />
    </motion.div>
  );
};
```

---

## Phase 6: Typographic Annotations

### 6.1 Journey Leg Labels

Between cities, show driving info:

```tsx
const JourneyLegLabel = ({ from, to, distance, duration }: Props) => {
  const midpoint = getMidpoint(from.coordinates, to.coordinates);

  return (
    <div
      className="journey-leg-label"
      style={{
        position: 'absolute',
        left: midpoint.x,
        top: midpoint.y
      }}
    >
      <span className="duration">{formatDuration(duration)}</span>
      <span className="divider">·</span>
      <span className="description">scenic drive</span>
    </div>
  );
};
```

**Styling**:
```css
.journey-leg-label {
  @apply px-3 py-1.5 rounded-full text-xs font-medium
         bg-white/90 backdrop-blur-sm text-[#8B7355]
         shadow-sm border border-[#E8DFD3];
  font-family: 'DM Sans', sans-serif;
}

.journey-leg-label .duration {
  @apply text-[#2C2417] font-semibold;
}
```

### 6.2 Landmark Callouts

Editorial-style floating labels:

```tsx
const LandmarkCallout = ({ landmark, type }: Props) => {
  const calloutText = {
    'must-see': '✦ Must See',
    'hidden-gem': '◈ Hidden Gem',
    'photo-spot': '◎ Photo Spot'
  };

  return (
    <motion.div
      className="landmark-callout"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {calloutText[type]}
    </motion.div>
  );
};
```

---

## Phase 7: Micro-Interactions

### 7.1 Marker Hover Effects

```css
.travel-stamp-marker {
  transition: transform 0.2s ease, filter 0.2s ease;
}

.travel-stamp-marker:hover {
  transform: translateY(-4px);
  filter: drop-shadow(0 8px 20px var(--marker-shadow));
}
```

### 7.2 Route Hover Preview

When hovering the route line, show elevation or detail:

```typescript
map.on('mouseenter', 'route-main', (e) => {
  // Show tooltip with route info at cursor position
  showRouteTooltip(e.lngLat, getRouteInfoAtPoint(e.lngLat));
});
```

### 7.3 Celebration Particles

When adding a landmark:

```tsx
const CelebrationParticles = ({ trigger, position }: Props) => {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div className="particles-container">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              initial={{
                x: 0, y: 0,
                scale: 1,
                opacity: 1
              }}
              animate={{
                x: Math.cos(i * 30 * Math.PI / 180) * 50,
                y: Math.sin(i * 30 * Math.PI / 180) * 50,
                scale: 0,
                opacity: 0
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                background: i % 2 === 0 ? '#C45830' : '#D4A853'
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

---

## File Structure (New/Modified)

```
src/components/spotlight/v2/
├── map/
│   ├── index.ts                    # Barrel export
│   ├── MapStyleProvider.tsx        # Custom style management
│   ├── mapStyle.ts                 # Style configuration
│   ├── mapConstants.ts             # Colors, settings
│   │
│   ├── layers/
│   │   ├── AnimatedRouteLine.tsx   # Route with animation
│   │   ├── RouteGlowLayer.tsx      # Glow effect
│   │   ├── DistanceMarkers.tsx     # Km markers along route
│   │   └── FogOfWar.tsx            # Optional area fading
│   │
│   ├── markers/
│   │   ├── TravelStampMarker.tsx   # Redesigned city markers
│   │   ├── LandmarkStampMarker.tsx # Redesigned landmark markers
│   │   ├── MarkerConnections.tsx   # Lines between markers
│   │   └── JourneyProgressIcon.tsx # Animated travel icon
│   │
│   ├── overlays/
│   │   ├── MapOverlays.tsx         # Combined overlays
│   │   ├── VignetteOverlay.tsx     # Edge darkening
│   │   ├── GrainOverlay.tsx        # Paper texture
│   │   └── CelebrationParticles.tsx# Add landmark celebration
│   │
│   ├── annotations/
│   │   ├── JourneyLegLabel.tsx     # Between-city labels
│   │   ├── LandmarkCallout.tsx     # Editorial callouts
│   │   └── DistanceBadge.tsx       # Small km indicators
│   │
│   └── orchestration/
│       ├── JourneyOrchestrator.tsx # Animation sequencing
│       ├── useMapAnimations.ts     # Animation hooks
│       └── easings.ts              # Custom easing functions
│
├── MapViewV2.tsx                   # MODIFIED - integrate new components
├── CityMarker.tsx                  # DEPRECATED - replaced by TravelStampMarker
└── LandmarkMarker.tsx              # DEPRECATED - replaced by LandmarkStampMarker

src/styles/
├── map.css                         # NEW - map-specific styles
└── premium.css                     # MODIFIED - add map variables
```

---

## Implementation Order

### Sprint 1: Foundation (Days 1-2)
1. [ ] Create custom Mapbox style in Studio OR local style.json
2. [ ] Set up `mapConstants.ts` with color system
3. [ ] Create `MapStyleProvider.tsx` to manage style
4. [ ] Update `MapViewV2.tsx` to use new style
5. [ ] Add `map.css` with base styles

### Sprint 2: Route Enhancement (Days 3-4)
1. [ ] Create `AnimatedRouteLine.tsx` with glow + dash animation
2. [ ] Implement route drawing animation on load
3. [ ] Add `DistanceMarkers.tsx` along route
4. [ ] Create `JourneyLegLabel.tsx` between cities

### Sprint 3: Marker Redesign (Days 5-7)
1. [ ] Build `TravelStampMarker.tsx` component
2. [ ] Add city photo integration (Wikipedia API)
3. [ ] Build `LandmarkStampMarker.tsx` component
4. [ ] Implement marker hover/selection states
5. [ ] Add marker connection lines

### Sprint 4: Atmosphere & Polish (Days 8-9)
1. [ ] Create overlay components (Vignette, Grain)
2. [ ] Implement `JourneyOrchestrator.tsx`
3. [ ] Add celebration particles for landmark addition
4. [ ] Fine-tune all animations and timings

### Sprint 5: Integration & QA (Day 10)
1. [ ] Full integration testing
2. [ ] Performance optimization
3. [ ] Mobile responsiveness check
4. [ ] Cross-browser testing

---

## Dependencies to Add

```bash
npm install @turf/turf  # For route geometry manipulation
```

No other dependencies needed - we're using existing Mapbox GL, Framer Motion, and React.

---

## Performance Considerations

1. **Marker rendering**: Use `useMemo` for marker positions
2. **Animation frames**: Use `requestAnimationFrame` for smooth dash animation
3. **Route geometry**: Cache sliced geometries for drawing animation
4. **Image loading**: Lazy load city photos with blur placeholders
5. **Layer management**: Remove/hide layers when not in viewport

---

## Preserved Functionality Checklist

- [ ] City marker click → select city
- [ ] City marker drag-to-reorder (bottom sheet)
- [ ] Landmark click → open details modal
- [ ] Add landmark to route → route recalculation
- [ ] Map pan/zoom controls
- [ ] Fly-to animation from companion
- [ ] Route geometry from Mapbox Directions API
- [ ] Bottom sheet city selection → map highlight

---

## Questions Before Starting

1. **Mapbox Studio access**: Do you have a Mapbox Studio account to create custom styles?
2. **City photos**: Should we use Wikipedia images (current) or add Unsplash/Pexels?
3. **Performance budget**: Any concerns about animation performance on mobile?
4. **Font loading**: Should we add Playfair Display for map labels?

---

## Ready to Execute?

This plan transforms every aspect of the map while preserving all existing functionality. Each phase builds on the previous, and we can ship incrementally.

**Estimated total effort**: 8-10 focused implementation sessions

Let me know which phase to start with, or if you want to tackle them in order!
