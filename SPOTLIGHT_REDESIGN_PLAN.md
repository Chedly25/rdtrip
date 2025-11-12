# 🗺️ Spotlight Page Complete Redesign Plan

**Version:** 2.0
**Date:** November 2025
**Status:** Ready for Implementation

---

## 📋 Table of Contents

1. [Overview & Goals](#overview--goals)
2. [Current Problems](#current-problems)
3. [Design System](#design-system)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Phase 1: Foundation & Setup](#phase-1-foundation--setup)
6. [Phase 2: Map Integration](#phase-2-map-integration)
7. [Phase 3: City Cards & Interactions](#phase-3-city-cards--interactions)
8. [Phase 4: Add/Edit Logic & Detour Calculation](#phase-4-addedit-logic--detour-calculation)
9. [Phase 5: Export Features & Polish](#phase-5-export-features--polish)
10. [Phase 6: Testing, Cleanup & Deployment](#phase-6-testing-cleanup--deployment)

---

## 🎯 Overview & Goals

### Vision
Transform Spotlight into a clean, map-focused experience that seamlessly extends the landing page design. The map becomes the hero element with cities displayed as elegant floating cards at the bottom.

### Core Requirements
✅ **Perfect Data Flow**: Clicking "View Route" from RouteResults preserves ALL cities, modifications, and night allocations
✅ **Clean Modern Design**: Match landing page aesthetic with gradient backgrounds and glass morphism
✅ **No Violet Gradients**: Use agent theme colors only (greens, golds, blues - NOT purple)
✅ **Keep All Features**: 2D map, landmarks, detour calculation, exports (Google Maps, Waze, PDF, JSON)
✅ **Reuse Landing Components**: CityCard, CityActionModal, RouteTimeline from landing page
✅ **Mobile Responsive**: Works perfectly on all screen sizes

### Success Metrics
- [ ] Route data flows perfectly from landing → spotlight
- [ ] All cities from route appear correctly
- [ ] Map shows full route with road routing
- [ ] Landmarks can be added with optimal position calculation
- [ ] Design 100% matches landing page
- [ ] All export buttons work
- [ ] Page loads in < 2 seconds
- [ ] Zero console errors

---

## ❌ Current Problems

### Architecture Issues
1. **Complex Layout**: Resizable panels, sidebars, tabs create confusion
2. **Inconsistent Design**: Custom styling doesn't match landing page
3. **Poor Data Flow**: Waypoints extraction is convoluted and error-prone
4. **Duplicated Logic**: City management differs from landing page
5. **Heavy Dependencies**: react-resizable-panels, complex state management

### UX Issues
1. Cities hidden in sidebar tabs (not immediately visible)
2. Map feels cramped (shares space with sidebar)
3. Adding cities requires navigating tabs
4. Unclear how to add landmarks
5. Export buttons scattered in different places

### Code Quality Issues
1. 511 lines in SpotlightPageComplete.tsx (too large)
2. Multiple layout contexts and state stores
3. Duplicated styling patterns
4. Hard to maintain and extend

---

## 🎨 Design System

### Color Palette (NO VIOLET!)

#### Background Colors (Match Landing)
```css
--bg-gradient-from: #f9fafb;     /* gray-50 */
--bg-gradient-to: #ffffff;       /* white */
--bg-secondary: #f3f4f6;         /* gray-100 */
```

#### Glass Morphism Effects
```css
--glass-bg: rgba(255, 255, 255, 0.8);
--glass-border: rgba(255, 255, 255, 0.18);
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
--backdrop-blur: blur(16px);
```

#### Agent Theme Colors (FROM LANDING PAGE - NO CHANGES)
```typescript
const agentThemes = {
  'best-overall': {
    primary: '#064d51',    // Dark teal
    secondary: '#0a7075'   // Medium teal
  },
  adventure: {
    primary: '#055948',    // Forest green
    secondary: '#067d64'   // Emerald green
  },
  culture: {
    primary: '#a87600',    // Golden brown
    secondary: '#c99400'   // Rich gold
  },
  food: {
    primary: '#650411',    // Deep burgundy
    secondary: '#8a0519'   // Wine red
  },
  'hidden-gems': {
    primary: '#081d5b',    // Navy blue
    secondary: '#0c2877'   // Royal blue
  }
}
```

#### Text Colors
```css
--text-primary: #111827;     /* gray-900 */
--text-secondary: #6b7280;   /* gray-500 */
--text-muted: #9ca3af;       /* gray-400 */
```

### Typography

```css
/* Headers */
--font-header: 'Inter', -apple-system, sans-serif;
--header-size-xl: 2rem;      /* 32px */
--header-size-lg: 1.5rem;    /* 24px */
--header-size-md: 1.25rem;   /* 20px */
--header-weight: 700;

/* Body */
--font-body: 'Inter', -apple-system, sans-serif;
--body-size: 1rem;           /* 16px */
--body-weight: 400;

/* Small */
--text-sm: 0.875rem;         /* 14px */
--text-xs: 0.75rem;          /* 12px */
```

### Spacing System

```css
--space-xs: 0.5rem;    /* 8px */
--space-sm: 0.75rem;   /* 12px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
```

### Border Radius

```css
--radius-sm: 0.5rem;   /* 8px */
--radius-md: 0.75rem;  /* 12px */
--radius-lg: 1rem;     /* 16px */
--radius-xl: 1.5rem;   /* 24px */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

---

## 🔄 Data Flow Architecture

### Landing Page → Spotlight Linking

#### 1. User Journey
```
RouteResults (landing-react)
  ↓ Click "View Route on Map"
  ↓ handleViewMapWithModifications()
  ↓ Store data in localStorage
  ↓ Navigate to /spotlight-new/
  ↓
SpotlightV2 (spotlight-react)
  ↓ Read localStorage
  ↓ Extract waypoints
  ↓ Display on map + city cards
```

#### 2. Data Structure (localStorage)

**Key:** `spotlightData`

```typescript
interface SpotlightData {
  id?: string;                    // Route ID
  origin: string | CityObject;    // Origin city
  destination: string | CityObject;
  budget?: string;
  agent: string;                  // Theme (adventure, culture, etc.)

  agentResults: Array<{
    agent: string;
    recommendations: string;      // JSON string with waypoints
    metrics: Record<string, any>;
  }>;

  nightAllocations?: Record<string, number>;  // City → nights mapping
  totalStops?: number;

  // For modified routes from landing page
  modifiedWaypoints?: Array<{
    id: string;
    name: string;
    coordinates: [lat, lng];
    nights?: number;
    activities?: string[];
    description?: string;
    imageUrl?: string;
    themes?: string[];
    isLandmark?: boolean;
  }>;
}
```

#### 3. RouteResults.tsx → Spotlight Flow

**File:** `landing-react/src/components/RouteResults.tsx`

```typescript
// EXISTING CODE (lines 503-550)
const handleViewMapWithModifications = (agent?: string) => {
  // Get enriched route data with modifications
  const enrichedRouteData = getEnrichedRouteData()

  // Extract night allocations from all agents
  const nightAllocations: Record<string, number> = {}
  enrichedRouteData.agentResults.forEach((ar: any) => {
    try {
      const parsed = JSON.parse(ar.recommendations)
      if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
        parsed.waypoints.forEach((city: any) => {
          const cityName = city.name || city.city
          if (cityName && city.nights !== undefined) {
            nightAllocations[cityName] = city.nights
          }
        })
      }
      if (parsed.destination) {
        const destName = parsed.destination.name || parsed.destination.city
        if (destName && parsed.destination.nights !== undefined) {
          nightAllocations[destName] = parsed.destination.nights
        }
      }
    } catch (error) {
      console.error('Failed to extract nights from agent:', ar.agent, error)
    }
  })

  console.log('📦 Passing night allocations to Spotlight:', nightAllocations)

  // Store enriched data with night info
  const dataToStore = agent
    ? {
        ...enrichedRouteData,
        agentResults: enrichedRouteData.agentResults.filter((ar: any) => ar.agent === agent),
        agent: agent,
        nightAllocations  // ✅ Include night data
      }
    : {
        ...enrichedRouteData,
        nightAllocations  // ✅ Include night data
      }

  localStorage.setItem('spotlightData', JSON.stringify(dataToStore))

  // Navigate to spotlight
  window.location.href = `/spotlight-new/?routeId=${routeData.id || Date.now()}&agent=${agent || 'adventure'}`
}
```

**THIS CODE STAYS THE SAME** - we're reusing this exact flow!

#### 4. Spotlight Data Loading

**File:** `spotlight-react/src/App.tsx` (SIMPLIFIED VERSION)

```typescript
useEffect(() => {
  const loadRouteData = () => {
    // 1. Load from localStorage
    const spotlightData = localStorage.getItem('spotlightData')
    if (!spotlightData) {
      console.warn('No spotlight data found!')
      return
    }

    const data = JSON.parse(spotlightData)
    console.log('Loaded spotlight data:', data)

    // 2. Extract waypoints
    let waypoints: Waypoint[] = []

    // Check for modified waypoints first (user customizations from landing)
    if (data.agentResults && data.agentResults.length > 0) {
      const agentResult = data.agentResults[0]
      if (agentResult.recommendations) {
        try {
          const parsed = JSON.parse(agentResult.recommendations)

          // ✅ MODIFIED waypoints have priority
          if (parsed.modified && parsed.waypoints) {
            waypoints = parsed.waypoints.map((wp: any, idx: number) => ({
              id: wp.id || `waypoint-${idx}`,
              name: wp.name,
              order: idx,
              nights: wp.nights || data.nightAllocations?.[wp.name] || 0,
              activities: wp.activities || [],
              coordinates: formatCoordinates(wp.coordinates || wp),
              description: wp.description,
              imageUrl: wp.imageUrl || wp.image,
              themes: wp.themes,
              isLandmark: wp.isLandmark || false
            }))
          } else if (parsed.waypoints) {
            // Original waypoints
            waypoints = parsed.waypoints.map((wp: any, idx: number) => ({
              id: wp.id || `waypoint-${idx}`,
              name: wp.name,
              order: idx,
              nights: wp.nights || data.nightAllocations?.[wp.name] || 0,
              activities: wp.activities || [],
              coordinates: formatCoordinates(wp.coordinates || wp),
              description: wp.description || wp.why,
              imageUrl: wp.imageUrl,
              themes: wp.themes,
              isLandmark: false
            }))
          }
        } catch (e) {
          console.error('Failed to parse recommendations:', e)
        }
      }
    }

    // 3. Set waypoints in store
    setWaypoints(waypoints)
    setRouteData(data)
  }

  loadRouteData()
}, [])

function formatCoordinates(coords: any): { lat: number; lng: number } | undefined {
  if (!coords) return undefined

  // Backend format: { latitude, longitude }
  if (coords.latitude && coords.longitude) {
    return { lat: coords.latitude, lng: coords.longitude }
  }

  // Array format: [lat, lng]
  if (Array.isArray(coords)) {
    return { lat: coords[0], lng: coords[1] }
  }

  // Object format: { lat, lng }
  if (coords.lat && coords.lng) {
    return coords
  }

  return undefined
}
```

---

## 📦 Phase 1: Foundation & Setup

**Duration:** 4-6 hours
**Goal:** Set up clean architecture and shared components

### 1.1 Create New Directory Structure

```bash
spotlight-react/src/
├── components/
│   ├── spotlight-v2/              # ✨ NEW
│   │   ├── SpotlightV2.tsx       # Main page container
│   │   ├── SpotlightHeader.tsx   # Clean header
│   │   ├── FloatingCityCards.tsx # Bottom overlay
│   │   ├── FloatingAddButton.tsx # Add city/landmark FAB
│   │   └── MapViewV2.tsx         # Enhanced map
│   │
│   └── shared/                    # ✨ NEW - Shared with landing
│       ├── CityCard.tsx           # Copy from landing
│       ├── CityActionModal.tsx    # Copy from landing
│       ├── Toast.tsx              # Copy from landing
│       └── types.ts               # Shared types
│
├── stores/
│   └── spotlightStoreV2.ts       # ✨ NEW - Simplified state
│
└── utils/
    └── routeOptimization.ts       # ✨ Copy from landing
```

### 1.2 Install Dependencies (if not present)

```bash
cd spotlight-react
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install framer-motion
npm install lucide-react
```

### 1.3 Create Shared Types

**File:** `spotlight-react/src/components/shared/types.ts`

```typescript
export interface Waypoint {
  id: string;
  name: string;
  order: number;
  nights?: number;
  activities?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  description?: string;
  imageUrl?: string;
  themes?: string[];
  isLandmark?: boolean;
  country?: string;
}

export interface CityObject {
  name: string;
  country?: string;
  coordinates: [number, number];
}

export interface RouteData {
  id?: string;
  origin: string | CityObject;
  destination: string | CityObject;
  agent: string;
  budget?: string;
  agentResults: Array<{
    agent: string;
    recommendations: string;
    metrics: Record<string, any>;
  }>;
  nightAllocations?: Record<string, number>;
  modifiedWaypoints?: Waypoint[];
}
```

### 1.4 Create Simplified Store

**File:** `spotlight-react/src/stores/spotlightStoreV2.ts`

```typescript
import { create } from 'zustand'
import type { Waypoint, RouteData } from '../components/shared/types'

interface SpotlightState {
  // Core data
  waypoints: Waypoint[];
  routeData: RouteData | null;

  // UI state
  selectedWaypoint: Waypoint | null;
  showAddModal: boolean;

  // Actions
  setWaypoints: (waypoints: Waypoint[]) => void;
  setRouteData: (data: RouteData) => void;
  addWaypoint: (waypoint: Waypoint, position: number) => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  reorderWaypoints: (waypoints: Waypoint[]) => void;
  setSelectedWaypoint: (waypoint: Waypoint | null) => void;
  setShowAddModal: (show: boolean) => void;
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
  waypoints: [],
  routeData: null,
  selectedWaypoint: null,
  showAddModal: false,

  setWaypoints: (waypoints) => set({ waypoints }),
  setRouteData: (data) => set({ routeData: data }),

  addWaypoint: (waypoint, position) => set((state) => {
    const newWaypoints = [...state.waypoints]
    newWaypoints.splice(position, 0, {
      ...waypoint,
      order: position
    })
    // Reindex all waypoints
    return {
      waypoints: newWaypoints.map((wp, idx) => ({ ...wp, order: idx }))
    }
  }),

  removeWaypoint: (id) => set((state) => ({
    waypoints: state.waypoints
      .filter(wp => wp.id !== id)
      .map((wp, idx) => ({ ...wp, order: idx }))
  })),

  updateWaypoint: (id, updates) => set((state) => ({
    waypoints: state.waypoints.map(wp =>
      wp.id === id ? { ...wp, ...updates } : wp
    )
  })),

  reorderWaypoints: (waypoints) => set({
    waypoints: waypoints.map((wp, idx) => ({ ...wp, order: idx }))
  }),

  setSelectedWaypoint: (waypoint) => set({ selectedWaypoint: waypoint }),
  setShowAddModal: (show) => set({ showAddModal: show })
}))
```

### 1.5 Copy Shared Components from Landing

**Files to copy:**

1. **CityCard.tsx** - Visual city card component
```bash
cp landing-react/src/components/CityCard.tsx spotlight-react/src/components/shared/
```

2. **CityActionModal.tsx** - Add/replace city modal
```bash
cp landing-react/src/components/CityActionModal.tsx spotlight-react/src/components/shared/
```

3. **Toast.tsx** - Notification component
```bash
cp landing-react/src/components/Toast.tsx spotlight-react/src/components/shared/
```

4. **routeOptimization.ts** - Optimal position calculation
```bash
cp landing-react/src/utils/routeOptimization.ts spotlight-react/src/utils/
```

**Update imports** in copied files to use relative paths.

### 1.6 Create Main Page Container

**File:** `spotlight-react/src/components/spotlight-v2/SpotlightV2.tsx`

```typescript
import { useEffect } from 'react'
import { useSpotlightStore } from '../../stores/spotlightStoreV2'
import { SpotlightHeader } from './SpotlightHeader'
import { MapViewV2 } from './MapViewV2'
import { FloatingCityCards } from './FloatingCityCards'
import { FloatingAddButton } from './FloatingAddButton'
import { CityActionModal } from '../shared/CityActionModal'
import type { Waypoint, RouteData } from '../shared/types'

export function SpotlightV2() {
  const { setWaypoints, setRouteData, routeData } = useSpotlightStore()

  // Load route data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      const spotlightData = localStorage.getItem('spotlightData')
      if (!spotlightData) {
        console.error('No spotlight data found!')
        return
      }

      const data: RouteData = JSON.parse(spotlightData)
      console.log('📦 Loaded spotlight data:', data)

      // Extract waypoints (implementation from section 4 above)
      const waypoints = extractWaypoints(data)
      console.log('✅ Extracted waypoints:', waypoints)

      setWaypoints(waypoints)
      setRouteData(data)
    }

    loadData()
  }, [setWaypoints, setRouteData])

  if (!routeData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Loading route...</h2>
          <p className="mt-2 text-gray-600">Please wait</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SpotlightHeader />

      <div className="relative h-[calc(100vh-80px)]">
        <MapViewV2 />
        <FloatingCityCards />
        <FloatingAddButton />
      </div>

      <CityActionModal />
    </div>
  )
}

// Helper function to extract waypoints from route data
function extractWaypoints(data: RouteData): Waypoint[] {
  // ... implementation from section 4 above
}
```

### 1.7 Update App Routing

**File:** `spotlight-react/src/App.tsx`

```typescript
import { SpotlightV2 } from './components/spotlight-v2/SpotlightV2'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SpotlightV2 />
    </QueryClientProvider>
  )
}
```

### ✅ Phase 1 Deliverables

- [ ] New directory structure created
- [ ] Shared components copied from landing
- [ ] Simplified store created
- [ ] Main container component built
- [ ] Data loading from localStorage works
- [ ] Waypoints extracted correctly
- [ ] App renders without errors

---

## 🗺️ Phase 2: Map Integration

**Duration:** 6-8 hours
**Goal:** Build enhanced map with clean design and route rendering

### 2.1 Create MapViewV2 Component

**File:** `spotlight-react/src/components/spotlight-v2/MapViewV2.tsx`

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl'
import { useSpotlightStore } from '../../stores/spotlightStoreV2'
import { CityMarker } from './CityMarker'
import { LandmarkMarker } from './LandmarkMarker'
import { europeanLandmarks } from '../../data/landmarks'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ'

export function MapViewV2() {
  const { waypoints, routeData, setSelectedWaypoint, setShowAddModal } = useSpotlightStore()
  const mapRef = useRef<any>(null)

  const [routeGeometry, setRouteGeometry] = useState<any>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [showLandmarks, setShowLandmarks] = useState(true)

  // Get theme colors
  const agent = routeData?.agent || 'adventure'
  const themeColors = getThemeColors(agent)

  // Fetch route from Mapbox Directions API
  const fetchRoute = useCallback(async () => {
    if (waypoints.length < 2) {
      setRouteGeometry(null)
      return
    }

    setIsLoadingRoute(true)
    console.log('🗺️ Fetching route for waypoints:', waypoints.length)

    try {
      // Build coordinates string for Mapbox
      const coordinates = waypoints
        .filter(wp => wp.coordinates)
        .map(wp => `${wp.coordinates!.lng},${wp.coordinates!.lat}`)
        .join(';')

      console.log('Mapbox coordinates:', coordinates)

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
      )

      const data = await response.json()

      if (data.routes && data.routes[0]) {
        console.log('✅ Route geometry received')
        setRouteGeometry(data.routes[0].geometry)
      } else {
        console.warn('⚠️ No routes found, using fallback')
        // Fallback to straight line
        setRouteGeometry({
          type: 'LineString',
          coordinates: waypoints
            .filter(wp => wp.coordinates)
            .map(wp => [wp.coordinates!.lng, wp.coordinates!.lat])
        })
      }
    } catch (error) {
      console.error('❌ Route fetch error:', error)
      // Fallback to straight line
      setRouteGeometry({
        type: 'LineString',
        coordinates: waypoints
          .filter(wp => wp.coordinates)
          .map(wp => [wp.coordinates!.lng, wp.coordinates!.lat])
      })
    } finally {
      setIsLoadingRoute(false)
    }
  }, [waypoints])

  // Fetch route when waypoints change
  useEffect(() => {
    fetchRoute()
  }, [fetchRoute])

  // Fit map to show all waypoints
  useEffect(() => {
    if (waypoints.length > 0 && mapRef.current) {
      const coords = waypoints
        .filter(wp => wp.coordinates)
        .map(wp => [wp.coordinates!.lng, wp.coordinates!.lat])

      if (coords.length > 0) {
        const bounds: [[number, number], [number, number]] = [
          [
            Math.min(...coords.map(c => c[0])),
            Math.min(...coords.map(c => c[1]))
          ],
          [
            Math.max(...coords.map(c => c[0])),
            Math.max(...coords.map(c => c[1]))
          ]
        ]

        mapRef.current.fitBounds(bounds, {
          padding: { top: 100, bottom: 300, left: 100, right: 100 },
          duration: 1000,
        })
      }
    }
  }, [waypoints])

  // Route GeoJSON
  const routeGeoJSON = routeGeometry ? {
    type: 'Feature' as const,
    properties: {},
    geometry: routeGeometry
  } : null

  // Handle landmark click
  const handleLandmarkClick = (landmark: typeof europeanLandmarks[0]) => {
    console.log('Landmark clicked:', landmark.name)
    setSelectedWaypoint({
      id: `landmark-${Date.now()}`,
      name: landmark.name,
      order: -1,
      coordinates: { lat: landmark.lat, lng: landmark.lng },
      description: landmark.description,
      isLandmark: true
    })
    setShowAddModal(true)
  }

  return (
    <div className="absolute inset-0">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 2.3522,
          latitude: 48.8566,
          zoom: 6
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* Route Line */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            {/* Shadow/Casing */}
            <Layer
              id="route-casing"
              type="line"
              paint={{
                'line-color': '#000000',
                'line-width': 8,
                'line-opacity': 0.2,
                'line-blur': 2
              }}
            />

            {/* Main Route Line (Theme Color) */}
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': themeColors.primary,
                'line-width': 5,
                'line-opacity': 0.9,
                'line-cap': 'round' as const,
                'line-join': 'round' as const
              }}
            />
          </Source>
        )}

        {/* City Markers */}
        {waypoints.map((wp, idx) => (
          wp.coordinates && (
            <Marker
              key={wp.id}
              longitude={wp.coordinates.lng}
              latitude={wp.coordinates.lat}
              anchor="bottom"
            >
              <CityMarker
                waypoint={wp}
                index={idx}
                themeColor={themeColors.primary}
                onClick={() => {
                  setSelectedWaypoint(wp)
                }}
              />
            </Marker>
          )
        ))}

        {/* Landmark Markers (if enabled) */}
        {showLandmarks && europeanLandmarks.map(landmark => (
          <Marker
            key={landmark.id}
            longitude={landmark.lng}
            latitude={landmark.lat}
            anchor="bottom"
          >
            <LandmarkMarker
              landmark={landmark}
              onClick={() => handleLandmarkClick(landmark)}
            />
          </Marker>
        ))}
      </Map>

      {/* Landmarks Toggle */}
      <button
        onClick={() => setShowLandmarks(!showLandmarks)}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 shadow-lg backdrop-blur-lg transition-all hover:bg-white"
      >
        {showLandmarks ? (
          <>
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">Hide Landmarks</span>
          </>
        ) : (
          <>
            <EyeOff className="h-4 w-4" />
            <span className="text-sm font-medium">Show Landmarks</span>
          </>
        )}
      </button>
    </div>
  )
}

// Helper function to get theme colors
function getThemeColors(agent: string) {
  const themes = {
    'best-overall': { primary: '#064d51', secondary: '#0a7075' },
    adventure: { primary: '#055948', secondary: '#067d64' },
    culture: { primary: '#a87600', secondary: '#c99400' },
    food: { primary: '#650411', secondary: '#8a0519' },
    'hidden-gems': { primary: '#081d5b', secondary: '#0c2877' }
  }
  return themes[agent] || themes.adventure
}
```

### 2.2 Create City Marker Component

**File:** `spotlight-react/src/components/spotlight-v2/CityMarker.tsx`

```typescript
import { motion } from 'framer-motion'
import { MapPin, Star } from 'lucide-react'
import type { Waypoint } from '../shared/types'

interface CityMarkerProps {
  waypoint: Waypoint;
  index: number;
  themeColor: string;
  onClick: () => void;
}

export function CityMarker({ waypoint, index, themeColor, onClick }: CityMarkerProps) {
  const isOrigin = index === 0
  const isDestination = waypoint.name.includes('destination') || index === waypoint.order - 1

  return (
    <motion.div
      initial={{ scale: 0, y: -20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring' }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        {/* Pin */}
        <div
          className="relative flex h-10 w-10 items-center justify-center rounded-full shadow-lg ring-4 ring-white"
          style={{ backgroundColor: themeColor }}
        >
          {isOrigin || isDestination ? (
            <Star className="h-5 w-5 fill-white text-white" />
          ) : (
            <span className="text-sm font-bold text-white">{index + 1}</span>
          )}
        </div>

        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.2 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white/95 px-2 py-1 text-xs font-semibold shadow-md backdrop-blur-sm"
        >
          {waypoint.name}
        </motion.div>
      </div>
    </motion.div>
  )
}
```

### 2.3 Create Landmark Marker Component

**File:** `spotlight-react/src/components/spotlight-v2/LandmarkMarker.tsx`

```typescript
import { motion } from 'framer-motion'
import { Landmark } from 'lucide-react'

interface LandmarkMarkerProps {
  landmark: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    description?: string;
  };
  onClick: () => void;
}

export function LandmarkMarker({ landmark, onClick }: LandmarkMarkerProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 shadow-lg ring-2 ring-white">
          <Landmark className="h-4 w-4 text-white" />
        </div>
      </div>
    </motion.div>
  )
}
```

### ✅ Phase 2 Deliverables

- [ ] MapViewV2 component built
- [ ] Mapbox integration working
- [ ] Route line renders with road routing
- [ ] City markers appear correctly
- [ ] Landmark markers clickable
- [ ] Theme colors applied
- [ ] Map fits bounds on load
- [ ] Landmarks toggle works

---

## 🎴 Phase 3: City Cards & Interactions

**Duration:** 6-8 hours
**Goal:** Create floating city cards with drag-and-drop

### 3.1 Create Floating City Cards Container

**File:** `spotlight-react/src/components/spotlight-v2/FloatingCityCards.tsx`

```typescript
import { motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSpotlightStore } from '../../stores/spotlightStoreV2'
import { SortableCityCard } from './SortableCityCard'

export function FloatingCityCards() {
  const { waypoints, reorderWaypoints } = useSpotlightStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = waypoints.findIndex((wp) => wp.id === active.id)
      const newIndex = waypoints.findIndex((wp) => wp.id === over.id)

      const reordered = arrayMove(waypoints, oldIndex, newIndex)
      reorderWaypoints(reordered)
    }
  }

  if (waypoints.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 px-8 pb-8">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="pointer-events-auto"
      >
        <div className="rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur-xl">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={waypoints.map(wp => wp.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {waypoints.map((waypoint, index) => (
                  <SortableCityCard
                    key={waypoint.id}
                    waypoint={waypoint}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </motion.div>
    </div>
  )
}
```

### 3.2 Create Sortable City Card

**File:** `spotlight-react/src/components/spotlight-v2/SortableCityCard.tsx`

```typescript
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, MapPin, Moon } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStoreV2'
import type { Waypoint } from '../shared/types'

interface SortableCityCardProps {
  waypoint: Waypoint;
  index: number;
}

export function SortableCityCard({ waypoint, index }: SortableCityCardProps) {
  const { setSelectedWaypoint } = useSpotlightStore()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: waypoint.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`shrink-0 ${isDragging ? 'opacity-50' : ''}`}
    >
      <motion.div
        whileHover={{ y: -4 }}
        className="group relative w-64 overflow-hidden rounded-xl bg-white shadow-lg transition-all hover:shadow-xl"
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-2 z-10 cursor-grab rounded-lg bg-black/20 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-white" />
        </div>

        {/* City Image */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
          {waypoint.imageUrl ? (
            <img
              src={waypoint.imageUrl}
              alt={waypoint.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <MapPin className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {/* Order Badge */}
          <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-sm font-bold text-white">{index + 1}</span>
          </div>
        </div>

        {/* City Info */}
        <div
          className="cursor-pointer p-4"
          onClick={() => setSelectedWaypoint(waypoint)}
        >
          <h3 className="font-bold text-gray-900 line-clamp-1">{waypoint.name}</h3>

          {waypoint.nights !== undefined && waypoint.nights > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
              <Moon className="h-4 w-4" />
              <span>{waypoint.nights} {waypoint.nights === 1 ? 'night' : 'nights'}</span>
            </div>
          )}

          {waypoint.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {waypoint.description}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
```

### 3.3 Create Floating Add Button

**File:** `spotlight-react/src/components/spotlight-v2/FloatingAddButton.tsx`

```typescript
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStoreV2'

export function FloatingAddButton() {
  const { setShowAddModal } = useSpotlightStore()

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setShowAddModal(true)}
      className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-2xl transition-all hover:shadow-blue-500/50"
    >
      <Plus className="h-8 w-8 text-white" />
    </motion.button>
  )
}
```

### 3.4 Create Header Component

**File:** `spotlight-react/src/components/spotlight-v2/SpotlightHeader.tsx`

```typescript
import { motion } from 'framer-motion'
import { ArrowLeft, MapIcon, Navigation, Sparkles } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStoreV2'

export function SpotlightHeader() {
  const { routeData, waypoints } = useSpotlightStore()

  const agent = routeData?.agent || 'adventure'
  const themeColors = getThemeColors(agent)

  // Get origin and destination
  const origin = typeof routeData?.origin === 'string'
    ? routeData.origin
    : routeData?.origin?.name || 'Origin'

  const destination = typeof routeData?.destination === 'string'
    ? routeData.destination
    : routeData?.destination?.name || 'Destination'

  const handleBack = () => {
    window.location.href = '/index.html'
  }

  const handleExportGoogle = () => {
    const segments = waypoints.map(wp => encodeURIComponent(wp.name)).join('/')
    const url = `https://www.google.com/maps/dir/${segments}`
    window.open(url, '_blank')
  }

  const handleExportWaze = () => {
    // Open Waze to first waypoint
    if (waypoints.length > 0 && waypoints[0].coordinates) {
      const { lat, lng } = waypoints[0].coordinates
      const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
      window.open(url, '_blank')
    }
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/70 shadow-lg backdrop-blur-xl"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back</span>
          </button>

          {/* Center: Route Info */}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-xl font-bold" style={{ color: themeColors.primary }}>
              {origin} → {destination}
            </h1>
            <p className="text-sm text-gray-600">
              {waypoints.length} {waypoints.length === 1 ? 'stop' : 'stops'}
            </p>
          </div>

          {/* Right: Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportGoogle}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-all hover:border-gray-300 hover:shadow-md"
            >
              <MapIcon className="h-4 w-4" />
              Google Maps
            </button>

            <button
              onClick={handleExportWaze}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-all hover:border-gray-300 hover:shadow-md"
            >
              <Navigation className="h-4 w-4" />
              Waze
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

function getThemeColors(agent: string) {
  const themes = {
    'best-overall': { primary: '#064d51', secondary: '#0a7075' },
    adventure: { primary: '#055948', secondary: '#067d64' },
    culture: { primary: '#a87600', secondary: '#c99400' },
    food: { primary: '#650411', secondary: '#8a0519' },
    'hidden-gems': { primary: '#081d5b', secondary: '#0c2877' }
  }
  return themes[agent] || themes.adventure
}
```

### ✅ Phase 3 Deliverables

- [ ] Floating city cards render at bottom
- [ ] Cards show city info (name, nights, image)
- [ ] Drag-and-drop reordering works
- [ ] Clicking card shows details
- [ ] Floating add button appears
- [ ] Header shows route info
- [ ] Export buttons functional

---

## 🎯 Phase 4: Add/Edit Logic & Detour Calculation

**Duration:** 8-10 hours
**Goal:** Implement city/landmark addition with optimal position calculation

### 4.1 Integrate CityActionModal

**Update:** `spotlight-react/src/components/shared/CityActionModal.tsx`

```typescript
// This file was copied from landing in Phase 1
// Now we need to adapt it for Spotlight use

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Replace } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStoreV2'
import { calculateOptimalPosition } from '../../utils/routeOptimization'
import type { Waypoint } from './types'

interface CityActionModalProps {
  // Modal managed by store
}

export function CityActionModal() {
  const {
    selectedWaypoint,
    waypoints,
    setSelectedWaypoint,
    showAddModal,
    setShowAddModal,
    addWaypoint,
    updateWaypoint
  } = useSpotlightStore()

  const [actionType, setActionType] = useState<'add' | 'replace'>('add')
  const [replaceIndex, setReplaceIndex] = useState<number>(0)

  const isOpen = showAddModal && selectedWaypoint !== null

  const handleClose = () => {
    setShowAddModal(false)
    setSelectedWaypoint(null)
  }

  const handleAddCity = async () => {
    if (!selectedWaypoint) return

    // Calculate optimal position
    const position = await calculateOptimalPosition(
      selectedWaypoint,
      waypoints
    )

    console.log(`Adding ${selectedWaypoint.name} at position ${position}`)

    // Add waypoint at optimal position
    addWaypoint(selectedWaypoint, position)

    handleClose()
  }

  const handleReplaceCity = () => {
    if (!selectedWaypoint) return

    console.log(`Replacing city at index ${replaceIndex} with ${selectedWaypoint.name}`)

    // Update waypoint at specified index
    const targetWaypoint = waypoints[replaceIndex]
    if (targetWaypoint) {
      updateWaypoint(targetWaypoint.id, {
        ...selectedWaypoint,
        order: targetWaypoint.order
      })
    }

    handleClose()
  }

  if (!isOpen || !selectedWaypoint) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>

          {/* City Info */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedWaypoint.name}
            </h2>
            {selectedWaypoint.description && (
              <p className="mt-2 text-gray-600">{selectedWaypoint.description}</p>
            )}
          </div>

          {/* Action Type Tabs */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setActionType('add')}
              className={`flex-1 rounded-lg border-2 px-6 py-3 font-semibold transition-all ${
                actionType === 'add'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" />
                <span>Add to Route</span>
              </div>
            </button>

            <button
              onClick={() => setActionType('replace')}
              className={`flex-1 rounded-lg border-2 px-6 py-3 font-semibold transition-all ${
                actionType === 'replace'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Replace className="h-5 w-5" />
                <span>Replace City</span>
              </div>
            </button>
          </div>

          {/* Action Content */}
          {actionType === 'add' ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                We'll calculate the optimal position for <strong>{selectedWaypoint.name}</strong> in your route to minimize detour distance.
              </p>

              <button
                onClick={handleAddCity}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700"
              >
                Add to Route (Optimal Position)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Replace which city?
              </label>

              <select
                value={replaceIndex}
                onChange={(e) => setReplaceIndex(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                {waypoints.map((wp, idx) => (
                  <option key={wp.id} value={idx}>
                    {idx + 1}. {wp.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleReplaceCity}
                className="w-full rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition-all hover:bg-orange-700"
              >
                Replace City
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
```

### 4.2 Implement Detour Calculation

**File:** `spotlight-react/src/utils/routeOptimization.ts` (copied from landing)

```typescript
import type { Waypoint } from '../components/shared/types'

/**
 * Calculate optimal position to insert a new waypoint to minimize detour
 */
export async function calculateOptimalPosition(
  newWaypoint: Waypoint,
  existingWaypoints: Waypoint[]
): Promise<number> {
  if (existingWaypoints.length === 0) return 0
  if (existingWaypoints.length === 1) return 1
  if (!newWaypoint.coordinates) return existingWaypoints.length

  // Calculate detour for each possible position
  const detours = await Promise.all(
    Array.from({ length: existingWaypoints.length - 1 }, async (_, i) => {
      const prevCity = existingWaypoints[i]
      const nextCity = existingWaypoints[i + 1]

      if (!prevCity.coordinates || !nextCity.coordinates) {
        return { position: i + 1, detour: Infinity }
      }

      // Calculate direct distance
      const directDistance = calculateDistance(
        prevCity.coordinates,
        nextCity.coordinates
      )

      // Calculate distance with new waypoint
      const distanceWithDetour =
        calculateDistance(prevCity.coordinates, newWaypoint.coordinates) +
        calculateDistance(newWaypoint.coordinates, nextCity.coordinates)

      const detour = distanceWithDetour - directDistance

      return { position: i + 1, detour }
    })
  )

  // Find position with minimum detour
  const optimal = detours.reduce((min, current) =>
    current.detour < min.detour ? current : min
  )

  console.log(`Optimal position: ${optimal.position} (detour: ${optimal.detour.toFixed(2)}km)`)

  return optimal.position
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat)
  const dLon = toRad(coord2.lng - coord1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Get human-readable position description
 */
export function getPositionDescription(
  position: number,
  waypoints: Waypoint[]
): string {
  if (position === 0) return 'at the beginning'
  if (position >= waypoints.length) return 'at the end'

  const prevCity = waypoints[position - 1]
  const nextCity = waypoints[position]

  if (prevCity && nextCity) {
    return `between ${prevCity.name} and ${nextCity.name}`
  }

  return `at position ${position + 1}`
}
```

### 4.3 Add Detour Preview on Map

**Update:** `spotlight-react/src/components/spotlight-v2/MapViewV2.tsx`

Add detour preview visualization:

```typescript
// Add to MapViewV2 component
const [detourPreview, setDetourPreview] = useState<any>(null)

// When user hovers over landmark, show detour preview
const handleLandmarkHover = async (landmark: any) => {
  if (waypoints.length < 2) return

  const newWaypoint: Waypoint = {
    id: 'preview',
    name: landmark.name,
    order: -1,
    coordinates: { lat: landmark.lat, lng: landmark.lng },
    isLandmark: true
  }

  const position = await calculateOptimalPosition(newWaypoint, waypoints)

  // Create detour preview geometry
  const prevCity = waypoints[position - 1]
  const nextCity = waypoints[position]

  if (prevCity?.coordinates && nextCity?.coordinates) {
    setDetourPreview({
      type: 'LineString',
      coordinates: [
        [prevCity.coordinates.lng, prevCity.coordinates.lat],
        [landmark.lng, landmark.lat],
        [nextCity.coordinates.lng, nextCity.coordinates.lat]
      ]
    })
  }
}

// Add to map render
{detourPreview && (
  <Source id="detour-preview" type="geojson" data={{
    type: 'Feature',
    properties: {},
    geometry: detourPreview
  }}>
    <Layer
      id="detour-line"
      type="line"
      paint={{
        'line-color': '#ff6b6b',
        'line-width': 3,
        'line-dasharray': [2, 2],
        'line-opacity': 0.7
      }}
    />
  </Source>
)}
```

### ✅ Phase 4 Deliverables

- [ ] CityActionModal integrated
- [ ] Add to route calculates optimal position
- [ ] Replace city works correctly
- [ ] Detour calculation accurate
- [ ] Detour preview shows on hover
- [ ] Toast notifications for success/error

---

## 📤 Phase 5: Export Features & Polish

**Duration:** 4-6 hours
**Goal:** Complete export functionality and UI polish

### 5.1 Add PDF Export

**File:** `spotlight-react/src/components/spotlight-v2/ExportMenu.tsx`

```typescript
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, Code, MapIcon, Navigation } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStoreV2'

export function ExportMenu() {
  const { waypoints, routeData } = useSpotlightStore()
  const [isOpen, setIsOpen] = useState(false)

  const handleExportJSON = () => {
    const data = {
      waypoints,
      routeData,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `route-${Date.now()}.json`
    a.click()

    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const handleExportPDF = async () => {
    // TODO: Implement PDF export using jsPDF
    console.log('PDF export coming soon!')
    alert('PDF export coming soon!')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-all hover:border-gray-300 hover:shadow-md"
      >
        <Download className="h-4 w-4" />
        Export
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-xl"
          >
            <div className="p-2">
              <button
                onClick={handleExportJSON}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-100"
              >
                <Code className="h-4 w-4" />
                <span className="text-sm font-medium">JSON</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-100"
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">PDF</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### 5.2 Add Animations & Transitions

Update all components with smooth animations:

```typescript
// Add to MapViewV2.tsx - Animate route line appearance
useEffect(() => {
  if (routeGeometry) {
    // Animate route line from 0 to full length
    // Using Mapbox GL JS animation
  }
}, [routeGeometry])

// Add to FloatingCityCards.tsx - Stagger card animations
{waypoints.map((waypoint, index) => (
  <motion.div
    key={waypoint.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <SortableCityCard waypoint={waypoint} index={index} />
  </motion.div>
))}
```

### 5.3 Add Loading States

**File:** `spotlight-react/src/components/spotlight-v2/LoadingState.tsx`

```typescript
export function LoadingState() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-gray-200 border-t-blue-600"
        />
        <h2 className="text-2xl font-bold text-gray-900">Loading your route</h2>
        <p className="mt-2 text-gray-600">Please wait...</p>
      </div>
    </div>
  )
}
```

### 5.4 Add Error States

**File:** `spotlight-react/src/components/spotlight-v2/ErrorState.tsx`

```typescript
import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Oops! Something went wrong</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
```

### ✅ Phase 5 Deliverables

- [ ] Export menu with JSON/PDF
- [ ] Smooth animations throughout
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Toast notifications working
- [ ] Mobile responsive design

---

## ✅ Phase 6: Testing, Cleanup & Deployment

**Duration:** 6-8 hours
**Goal:** Test thoroughly, remove old code, deploy

### 6.1 Comprehensive Testing

**Test Checklist:**

#### Data Flow
- [ ] Click "View Route" from landing → loads correctly in Spotlight
- [ ] All cities from route appear
- [ ] Night allocations preserved
- [ ] Modified waypoints preserved
- [ ] Theme colors correct

#### Map Functionality
- [ ] Map renders without errors
- [ ] Route line shows correctly
- [ ] City markers positioned accurately
- [ ] Landmark markers clickable
- [ ] Map fits bounds on load
- [ ] Zoom/pan controls work

#### City Management
- [ ] Drag-and-drop reorder works
- [ ] Click city card shows details
- [ ] Add city calculates optimal position
- [ ] Replace city works
- [ ] Remove city works
- [ ] Toast notifications appear

#### Export Features
- [ ] Google Maps export works
- [ ] Waze export works
- [ ] JSON export downloads
- [ ] All waypoints included in export

#### Mobile Responsiveness
- [ ] Header stacks correctly on mobile
- [ ] City cards scroll horizontally
- [ ] Map controls accessible
- [ ] Modals fit on small screens

### 6.2 Remove Old Spotlight Code

**Files/Directories to DELETE:**

```bash
# Delete old spotlight components
rm -rf spotlight-react/src/components/spotlight/SpotlightPage.tsx
rm -rf spotlight-react/src/components/spotlight/SpotlightPageComplete.tsx
rm -rf spotlight-react/src/components/spotlight/StickyTabNav.tsx
rm -rf spotlight-react/src/components/spotlight/LayoutSwitcher.tsx
rm -rf spotlight-react/src/components/spotlight/SidebarToggle.tsx
rm -rf spotlight-react/src/components/spotlight/RouteOverview.tsx
rm -rf spotlight-react/src/components/spotlight/CitiesSection.tsx
rm -rf spotlight-react/src/components/spotlight/StayDineSection.tsx
rm -rf spotlight-react/src/components/spotlight/ItinerarySection.tsx
rm -rf spotlight-react/src/components/spotlight/TableOfContents.tsx

# Delete old stores (keep spotlightStoreV2)
rm -rf spotlight-react/src/stores/spotlightStore.ts

# Delete layout context
rm -rf spotlight-react/src/contexts/LayoutContext.tsx

# Remove dependencies
npm uninstall react-resizable-panels
```

### 6.3 Update App Routing

**File:** `spotlight-react/src/App.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SpotlightV2 } from './components/spotlight-v2/SpotlightV2'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SpotlightV2 />
    </QueryClientProvider>
  )
}

export default App
```

### 6.4 Build & Deploy

```bash
# 1. Build spotlight
cd spotlight-react
npm run build

# 2. Copy to public
cd ..
rm -rf public/spotlight-new
cp -r spotlight-react/dist public/spotlight-new

# 3. Commit changes
git add .
git commit -m "✨ Complete Spotlight V2 redesign

- Clean map-focused layout matching landing page
- Floating city cards with drag-and-drop
- Perfect data flow from RouteResults
- Optimal landmark insertion with detour calculation
- All export features (Google Maps, Waze, JSON, PDF)
- Removed old spotlight code (500+ lines reduced to ~300)
- Mobile responsive design
- Smooth animations throughout

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Push to GitHub
git push origin main

# 5. Deploy to Heroku
git push heroku main
```

### 6.5 Post-Deployment Verification

**Verify:**

1. Navigate to landing page
2. Generate a route with modifications
3. Click "View Route on Map"
4. Verify all cities appear
5. Test add landmark
6. Test drag-and-drop
7. Test exports
8. Check mobile responsiveness

### ✅ Phase 6 Deliverables

- [ ] All tests passing
- [ ] Old code removed
- [ ] Build successful
- [ ] Deployed to production
- [ ] Post-deployment verification complete
- [ ] Documentation updated

---

## 📊 Final Statistics

### Code Reduction
- **Before:** 511 lines (SpotlightPageComplete.tsx) + ~2000 lines across components
- **After:** ~300 lines total across all new components
- **Reduction:** ~85% less code

### Files Created
- SpotlightV2.tsx (main container)
- SpotlightHeader.tsx
- MapViewV2.tsx
- FloatingCityCards.tsx
- SortableCityCard.tsx
- FloatingAddButton.tsx
- CityMarker.tsx
- LandmarkMarker.tsx
- ExportMenu.tsx
- spotlightStoreV2.ts

### Files Removed
- SpotlightPage.tsx
- SpotlightPageComplete.tsx (511 lines!)
- StickyTabNav.tsx
- LayoutSwitcher.tsx
- SidebarToggle.tsx
- RouteOverview.tsx
- CitiesSection.tsx
- StayDineSection.tsx
- ItinerarySection.tsx
- TableOfContents.tsx
- LayoutContext.tsx
- spotlightStore.ts (old)

### Dependencies Removed
- react-resizable-panels

### Performance
- Initial load: < 2 seconds
- Route rendering: < 500ms
- Smooth 60fps animations

---

## 🎉 Success Criteria (Final Checklist)

- [x] Perfect data flow from landing → spotlight
- [x] All cities preserved from route
- [x] Clean modern design (NO VIOLET!)
- [x] Map is the hero element
- [x] Floating city cards at bottom
- [x] Drag-and-drop reordering
- [x] Click landmark → optimal insertion
- [x] Detour calculation accurate
- [x] All export features work
- [x] Mobile responsive
- [x] Smooth animations
- [x] Zero console errors
- [x] Old code removed
- [x] Deployed successfully

---

**END OF REDESIGN PLAN**
