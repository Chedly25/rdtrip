# Spotlight Page Redesign Plan

## Overview

Redesign the Spotlight page to create a premium, Revolut-style map-first experience while migrating all critical features from RouteResults.

---

## Current State Analysis

### What Works (Keep)
- Full-screen interactive Mapbox map
- City cards at the bottom
- Drag-and-drop city reordering
- Landmark discovery and management
- Export to Google Maps/Waze

### What Needs Improvement
- Design feels dated, not matching landing page's Revolut aesthetic
- City cards are cramped and lack visual hierarchy
- Header is cluttered with too many buttons
- No budget display or trip summary
- Missing save/share functionality from RouteResults
- No alternative cities feature
- No night allocation editing
- No undo/history system

### Features to Migrate from RouteResults
1. **Save Route** (authenticated users)
2. **Share Route** (generate shareable links)
3. **Budget Display** with breakdown
4. **Night Allocation Editor** per city
5. **Alternative Cities** with add/replace
6. **Route Timeline** visualization
7. **Undo/Reset** history system
8. **City Detail Modal** with full info

---

## Design Philosophy

### Revolut Design Principles
1. **Clean Monochrome** - Primary black (#191C1F), grays, white
2. **Bold Typography** - Plus Jakarta Sans for headings, Inter for UI
3. **Generous Whitespace** - Let elements breathe
4. **Subtle Shadows** - rui-shadow-1 through rui-shadow-4
5. **Smooth Animations** - cubic-bezier(0.15, 0.5, 0.5, 1)
6. **Rounded Corners** - 12px-24px for cards, full for buttons

### Layout Vision
```
+------------------------------------------------------------------+
|  [Back] Route: Paris → Barcelona    [Save] [Share] [Export ▼]    |  <- Slim header
+------------------------------------------------------------------+
|                                                                   |
|                                                                   |
|                         FULL-SCREEN MAP                           |
|                    (80% of viewport height)                       |
|                                                                   |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  [Trip Summary Panel]              [City Cards Carousel]          |
|   • 5 cities, 12 nights            [Paris] [Lyon] [Nice] [...]    |
|   • €1,200 estimated               Drag to reorder                |
|   • Balanced pace                                                 |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Component Architecture

### 1. SpotlightLayout (Main Container)
```
SpotlightLayout/
├── SpotlightHeader.tsx      (redesigned - slim, clean)
├── MapContainer.tsx         (full-screen map wrapper)
├── BottomPanel.tsx          (new - trip summary + city cards)
│   ├── TripSummaryCard.tsx  (new - stats, budget, timeline)
│   └── CityCarousel.tsx     (redesigned city cards)
├── Modals/
│   ├── CityDetailModal.tsx  (new - full city info)
│   ├── SaveRouteModal.tsx   (migrate from RouteResults)
│   ├── ShareRouteModal.tsx  (migrate from RouteResults)
│   └── AddCityModal.tsx     (redesigned)
└── store/spotlightStore.ts  (enhanced with history)
```

### 2. Header Redesign

**Before:** Cluttered with 6+ buttons
**After:** Clean, minimal with grouped actions

```tsx
<header className="h-14 bg-white border-b border-rui-grey-10">
  {/* Left: Back + Route Title */}
  <div className="flex items-center gap-4">
    <BackButton />
    <RouteTitle>Paris → Barcelona</RouteTitle>
    <Badge>5 cities</Badge>
  </div>

  {/* Right: Primary Actions */}
  <div className="flex items-center gap-2">
    <SaveButton />      {/* Icon + "Save" */}
    <ShareButton />     {/* Icon only */}
    <ExportDropdown />  {/* Grouped exports */}
  </div>
</header>
```

### 3. Bottom Panel (New Component)

Two-column layout at bottom:

**Left Column: Trip Summary Card (Fixed Width)**
- Route overview (cities count, total nights)
- Budget estimate with confidence
- Trip pace indicator
- Mini timeline visualization
- Quick stats (driving time, distance)

**Right Column: City Carousel (Scrollable)**
- Horizontal scrolling cards
- Larger cards with better imagery
- Night count with +/- controls
- Activity count badge
- Drag handle for reordering

### 4. City Card Redesign

**Current:** Small, cramped, 224px wide
**New:** Larger, cleaner, 280px wide

```tsx
<CityCard>
  {/* Full-width image with gradient overlay */}
  <div className="h-32 relative">
    <img src={cityImage} className="object-cover" />
    <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60" />
    <span className="absolute bottom-2 left-3 text-white font-semibold">
      {cityName}
    </span>
    <DragHandle className="absolute top-2 right-2" />
  </div>

  {/* Card body */}
  <div className="p-4">
    {/* Night allocation with inline editing */}
    <div className="flex items-center justify-between mb-3">
      <span className="text-rui-grey-50">Nights</span>
      <NightStepper value={nights} onChange={setNights} />
    </div>

    {/* Activities preview */}
    <div className="flex items-center gap-2 text-sm">
      <ActivityBadge count={activities.length} />
      <RestaurantBadge count={restaurants.length} />
    </div>

    {/* Expand button */}
    <button className="mt-3 w-full py-2 text-rui-accent text-sm font-medium">
      View Details →
    </button>
  </div>
</CityCard>
```

### 5. Trip Summary Card (New)

```tsx
<TripSummaryCard>
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-heading-3">Trip Overview</h3>
    <Badge variant="subtle">{tripPace}</Badge>
  </div>

  {/* Stats Grid */}
  <div className="grid grid-cols-2 gap-4 mb-4">
    <Stat icon={MapPin} label="Cities" value="5" />
    <Stat icon={Moon} label="Nights" value="12" />
    <Stat icon={Clock} label="Drive Time" value="8h 30m" />
    <Stat icon={Route} label="Distance" value="892 km" />
  </div>

  {/* Budget Section */}
  <div className="p-4 bg-rui-grey-2 rounded-rui-16 mb-4">
    <div className="flex justify-between items-center">
      <span className="text-rui-grey-50">Estimated Budget</span>
      <span className="text-heading-2">€1,200</span>
    </div>
    <p className="text-body-3 text-rui-grey-50 mt-1">
      Per person • High confidence
    </p>
  </div>

  {/* Mini Timeline */}
  <MiniTimeline cities={cities} />
</TripSummaryCard>
```

### 6. City Detail Modal (New)

Full-screen or large modal with comprehensive city info:

```tsx
<CityDetailModal>
  {/* Hero Image */}
  <div className="h-64 relative">
    <img src={cityImage} />
    <CloseButton />
  </div>

  {/* Content */}
  <div className="p-6">
    <h2 className="text-display-3 mb-2">{cityName}</h2>
    <p className="text-body-1 text-rui-grey-50 mb-6">{description}</p>

    {/* Night Editor */}
    <NightAllocationEditor nights={nights} onChange={updateNights} />

    {/* Tabs: Activities | Restaurants | Hotels */}
    <Tabs>
      <Tab label="Activities">
        <ActivityList activities={activities} />
      </Tab>
      <Tab label="Restaurants">
        <RestaurantList restaurants={restaurants} />
      </Tab>
      <Tab label="Hotels">
        <HotelList hotels={hotels} />
      </Tab>
    </Tabs>

    {/* Actions */}
    <div className="flex gap-3 mt-6">
      <Button variant="secondary" onClick={removeCity}>
        Remove from Route
      </Button>
      <Button variant="primary" onClick={close}>
        Done
      </Button>
    </div>
  </div>
</CityDetailModal>
```

### 7. Save/Share Modals (Migrate)

Adapt RouteResults modals to Revolut styling:

```tsx
<SaveRouteModal>
  <h2 className="text-heading-2 mb-4">Save Your Route</h2>

  <Input
    label="Route Name"
    placeholder="My Europe Adventure"
    value={name}
    onChange={setName}
  />

  <Textarea
    label="Notes (optional)"
    placeholder="Add any notes..."
  />

  <div className="flex gap-3 mt-6">
    <Button variant="secondary" onClick={close}>Cancel</Button>
    <Button variant="primary" onClick={save} loading={saving}>
      Save Route
    </Button>
  </div>
</SaveRouteModal>
```

### 8. State Management Enhancements

Add to spotlightStore:

```typescript
interface SpotlightState {
  // Existing...
  route: SpotlightRoute | null;
  selectedCityIndex: number | null;

  // New: History for undo
  history: HistoryEntry[];
  historyIndex: number;

  // New: Budget
  budget: BudgetData | null;
  isBudgetLoading: boolean;

  // New: Save/Share
  isSaved: boolean;
  shareToken: string | null;

  // Actions
  undo: () => void;
  redo: () => void;
  updateCityNights: (cityIndex: number, nights: number) => void;
  saveRoute: () => Promise<string>;
  shareRoute: () => Promise<string>;
  calculateBudget: () => Promise<void>;
}
```

---

## Implementation Phases

### Phase 1: Foundation (Day 1)
1. Copy Revolut design tokens to spotlight-react
2. Set up shared Tailwind config
3. Create base UI components (Button, Badge, Card, Input)
4. Implement new SpotlightLayout structure

### Phase 2: Core Redesign (Day 2-3)
1. Redesign SpotlightHeader (slim, clean)
2. Create BottomPanel component
3. Implement TripSummaryCard
4. Redesign CityCarousel with larger cards
5. Add NightStepper inline editing

### Phase 3: Feature Migration (Day 4-5)
1. Implement CityDetailModal
2. Migrate SaveRouteModal
3. Migrate ShareRouteModal
4. Add budget calculation integration
5. Implement history/undo system

### Phase 4: Polish (Day 6)
1. Animation refinements (Revolut easing)
2. Mobile responsive adjustments
3. Loading states and skeletons
4. Error handling improvements
5. Accessibility audit

---

## Technical Decisions

### 1. Share Tailwind Config
- Create `shared/tailwind.config.js` with Revolut tokens
- Import in both landing-react and spotlight-react
- Ensures design consistency

### 2. Component Library
- Build reusable UI components in spotlight-react
- Match landing-react patterns where possible
- Use same animation timing functions

### 3. State Persistence
- Use localStorage for unsaved route changes
- Sync to backend on explicit save
- Handle offline gracefully

### 4. Map Integration
- Keep existing Mapbox setup
- Add smooth flyTo animations on city select
- Update route line on reorder

---

## Success Criteria

1. **Visual Consistency** - Matches landing page Revolut aesthetic
2. **Feature Parity** - All RouteResults features available
3. **Performance** - Map interactions remain smooth
4. **Usability** - Clear information hierarchy, obvious actions
5. **Mobile Ready** - Responsive layout, touch-friendly

---

## Files to Create/Modify

### New Files
- `src/components/spotlight/v3/SpotlightV3.tsx`
- `src/components/spotlight/v3/SpotlightHeader.tsx`
- `src/components/spotlight/v3/BottomPanel.tsx`
- `src/components/spotlight/v3/TripSummaryCard.tsx`
- `src/components/spotlight/v3/CityCarousel.tsx`
- `src/components/spotlight/v3/CityCard.tsx`
- `src/components/spotlight/v3/CityDetailModal.tsx`
- `src/components/spotlight/v3/SaveRouteModal.tsx`
- `src/components/spotlight/v3/ShareRouteModal.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/NightStepper.tsx`
- `src/components/ui/Stat.tsx`

### Modify
- `tailwind.config.js` - Add Revolut tokens
- `src/index.css` - Add Revolut CSS variables
- `src/stores/spotlightStoreV2.ts` - Enhance with history/budget
- `src/App.tsx` - Route to new SpotlightV3

---

## Design Decisions (Confirmed)

1. **Budget Display** - **Detailed breakdown** showing accommodation, food, and activities costs separately

2. **Color Theme** - **Full monochrome** matching the landing page (black #191C1F, grays, white). Remove agent-based colors.

3. **Collaboration** - **Keep the collaboration panel** but style it to match monochrome theme. Move trigger to a more subtle location.

4. **Alternative Cities** - Keep for future but lower priority. Focus on core flow first.
