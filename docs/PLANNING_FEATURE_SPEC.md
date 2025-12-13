# rdtrip Planning Feature - Complete Specification

> **Version:** 1.0
> **Status:** Ready for Implementation
> **Last Updated:** December 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Journey](#2-user-journey)
3. [Core Concepts](#3-core-concepts)
4. [Page Layouts](#4-page-layouts)
5. [Component Specification](#5-component-specification)
6. [Backend Architecture](#6-backend-architecture)
7. [Data Models](#7-data-models)
8. [Planning Companion Agent](#8-planning-companion-agent)
9. [Card Generation System](#9-card-generation-system)
10. [Frontend State Management](#10-frontend-state-management)
11. [File Structure](#11-file-structure)
12. [Implementation Phases](#12-implementation-phases)
13. [Design System](#13-design-system)

---

## 1. Overview

### The Problem

The current City Intelligence feature shows users **information about places** but doesn't help them **actually plan their trip**. Users see lists of hidden gems, photo spots, and restaurants, but have no way to:

- Organize activities into a coherent itinerary
- Understand what's close to what (to minimize wasted travel time)
- Get more options if they don't like the initial suggestions
- Build a plan they can actually follow

### The Solution

A **proximity-based trip planner** where users build geographic clusters of activities, with an AI companion that helps them discover and organize their perfect trip.

**Key Innovation:** Instead of rigid hour-by-hour scheduling, users build **area-based clusters** ("things to do in Le Panier", "things to do around Vieux Port") that naturally group walkable activities together.

### Core Value Propositions

1. **Proximity is king** — Everything organized by "what's near what"
2. **Infinite generation** — Don't like the suggestions? Generate more. Forever.
3. **Reactive companion** — AI comments on every choice, warns about issues, suggests improvements
4. **Flexible, not rigid** — No forced schedules, just intelligent groupings

---

## 2. User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   DISCOVERY (existing)                                                  │
│   ────────────────────                                                  │
│   • User sets up trip (origin, destination, dates, preferences)         │
│   • Route generated with suggested cities                               │
│   • City Intelligence runs for each city                                │
│   • User reviews cities, adjusts route                                  │
│                                                                         │
│                              ↓                                          │
│                    "Plan Your Trip" button                              │
│                              ↓                                          │
│                                                                         │
│   PLANNING (NEW) ← THIS DOCUMENT                                        │
│   ───────────────                                                       │
│   • User enters /plan/:routeId                                          │
│   • For each city: browse suggestions, build clusters                   │
│   • Companion helps discover and organize                               │
│   • Save completed plan                                                 │
│                                                                         │
│                              ↓                                          │
│                     "Start Trip" button                                 │
│                              ↓                                          │
│                                                                         │
│   TODAY / TRIP EXECUTION (existing)                                     │
│   ─────────────────────────────────                                     │
│   • Day-by-day guidance                                                 │
│   • Clusters become daily activities                                    │
│   • Companion available for questions                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Entry Points

| From | Action | Result |
|------|--------|--------|
| Discovery page | Click "Plan Your Trip" | Navigate to `/plan/:routeId` |
| My Routes page | Click "Continue Planning" | Navigate to `/plan/:routeId` |
| Direct URL | Enter `/plan/:routeId` | Load existing plan or initialize |

### Exit Points

| From | Action | Result |
|------|--------|--------|
| Planning page | Click "Start Trip" | Navigate to Today page |
| Planning page | Click "Save & Exit" | Save plan, return to My Routes |
| Planning page | Click back | Confirm unsaved changes, return |

---

## 3. Core Concepts

### 3.1 Clusters (Geographic Areas)

A **cluster** is a collection of places that are walkable from each other.

```typescript
interface Cluster {
  id: string;
  name: string;              // "Le Panier", "Vieux Port"
  center: LatLng;            // Geographic center point
  items: PlanCard[];         // Activities, restaurants, etc.

  // Computed
  totalDuration: number;     // Sum of item durations (minutes)
  maxWalkingDistance: number; // Longest walk between items (minutes)
}
```

**Why clusters instead of time slots:**
- Travel is fluid, not corporate
- Users care about "what's near what" not "what time is it"
- Clusters naturally optimize for minimal walking
- More flexible — users can do items in any order within a cluster

### 3.2 Plan Cards

A **PlanCard** represents any plannable item: restaurant, activity, photo spot, hotel, bar, etc.

```typescript
interface PlanCard {
  id: string;
  type: 'restaurant' | 'activity' | 'photo_spot' | 'hotel' | 'bar' | 'cafe' | 'experience';
  name: string;
  description: string;       // 1-2 sentences
  whyGreat: string;          // Why this matches their preferences

  location: {
    lat: number;
    lng: number;
    address: string;
    area: string;            // "Le Panier", "Vieux Port"
  };

  duration: number;          // Minutes
  priceLevel: 1 | 2 | 3 | 4; // € to €€€€
  priceEstimate?: string;    // "€25-40 per person"
  bestTime?: string;         // "sunset", "morning", "lunch"
  tags: string[];            // ["romantic", "outdoor", "local-favorite"]

  // Optional
  imageUrl?: string;
  rating?: number;
  bookingRequired?: boolean;
  openingHours?: string;
}
```

### 3.3 Proximity-First Design

Every card displayed shows its distance from the user's current picks:

```
┌─────────────────────┐
│ 🍽️ Chez Fonfon      │
│ Legendary seafood   │
│                     │
│ €€€ · 1.5h          │
│ 8 min from Vieux Port ← Proximity badge
│                     │
│ [+ Add to Plan]     │
└─────────────────────┘
```

**Distance color coding:**
- 🟢 Green: < 10 min walk (fits in cluster)
- 🟡 Yellow: 10-20 min walk (borderline)
- 🔴 Red: > 20 min walk (new area needed)

### 3.4 Infinite Generation

Users are **never stuck** with suggestions they don't like.

```
┌─────────────────────────────────────┐
│ 🍽️ RESTAURANTS                      │
│                                     │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │     │ │     │ │     │ │     │    │
│ │ ••• │ │ ••• │ │ ••• │ │ ••• │    │
│ │     │ │     │ │     │ │     │    │
│ └─────┘ └─────┘ └─────┘ └─────┘    │
│                                     │
│ [Show 10 more restaurants]          │ ← Generates fresh batch
│                                     │
│ Don't see what you want?            │
│ [Ask companion for specific request]│
└─────────────────────────────────────┘
```

Generation is:
- **Additive**: New cards added, old ones remain
- **Context-aware**: Prioritizes cards near user's existing clusters
- **Preference-matched**: Uses traveler type and stated preferences
- **Deduplicated**: Excludes already-shown and already-added items

---

## 4. Page Layouts

### 4.1 Initial State (Empty Plan)

When user first enters planning for a city:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ┌─────────┐ ┌───────────┐ ┌───────────┐                    [Save] [Help] │
│   │ PARIS   │ │ MARSEILLE │ │ BARCELONA │                                  │
│   │ origin  │ │ ★ 2 nights│ │ 2 nights  │                                  │
│   └─────────┘ └───────────┘ └───────────┘                                  │
│                     ↑                                                       │
│              Currently editing                                              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐│
│  │                                    │  │                                ││
│  │  YOUR PLAN FOR MARSEILLE           │  │  DISCOVER                      ││
│  │                                    │  │                                ││
│  │  ┌──────────────────────────────┐  │  │  Suggestions based on your    ││
│  │  │                              │  │  │  preferences as a couple      ││
│  │  │  Welcome! I've suggested     │  │  │                                ││
│  │  │  some areas based on what    │  │  │  ┌────────────────────────┐   ││
│  │  │  couples love in Marseille.  │  │  │  │ 🍽️ RESTAURANTS         │   ││
│  │  │                              │  │  │  │                        │   ││
│  │  │  Pick an area to start, or   │  │  │  │ ┌──────┐ ┌──────┐     │   ││
│  │  │  browse suggestions on the   │  │  │  │ │Chez  │ │AM by │     │   ││
│  │  │  right and add what you      │  │  │  │ │Fonfon│ │Peron │     │   ││
│  │  │  like.                       │  │  │  │ │€€€   │ │€€€€  │     │   ││
│  │  │                              │  │  │  │ │ [+]  │ │ [+]  │     │   ││
│  │  └──────────────────────────────┘  │  │  │ └──────┘ └──────┘     │   ││
│  │                                    │  │  │                        │   ││
│  │  SUGGESTED AREAS                   │  │  │ ┌──────┐ ┌──────┐     │   ││
│  │                                    │  │  │ │La    │ │Le Rho│     │   ││
│  │  ┌──────────────────────────────┐  │  │  │ │Canti-│ │de    │     │   ││
│  │  │ 📍 LE PANIER            [?] │  │  │  │ │na €€ │ │€€    │     │   ││
│  │  │    Historic Quarter          │  │  │  │ │ [+]  │ │ [+]  │     │   ││
│  │  │                              │  │  │  │ └──────┘ └──────┘     │   ││
│  │  │    Narrow medieval streets,  │  │  │  │                        │   ││
│  │  │    street art, artisan shops │  │  │  │ [Show 10 more]         │   ││
│  │  │                              │  │  │  └────────────────────────┘   ││
│  │  │    [Start building here →]   │  │  │                                ││
│  │  └──────────────────────────────┘  │  │  ┌────────────────────────┐   ││
│  │                                    │  │  │ ✨ ACTIVITIES           │   ││
│  │  ┌──────────────────────────────┐  │  │  │                        │   ││
│  │  │ 📍 VIEUX PORT           [?] │  │  │  │ ┌──────┐ ┌──────┐     │   ││
│  │  │    The Old Harbor            │  │  │  │ │Chât- │ │Calan-│     │   ││
│  │  │                              │  │  │  │ │eau   │ │ques  │     │   ││
│  │  │    Fishing boats, seafood    │  │  │  │ │d'If  │ │Boat  │     │   ││
│  │  │    restaurants, sunset views │  │  │  │ │ [+]  │ │ [+]  │     │   ││
│  │  │                              │  │  │  │ └──────┘ └──────┘     │   ││
│  │  │    [Start building here →]   │  │  │  │                        │   ││
│  │  └──────────────────────────────┘  │  │  │ [Show 10 more]         │   ││
│  │                                    │  │  └────────────────────────┘   ││
│  │  ┌──────────────────────────────┐  │  │                                ││
│  │  │ 📍 CORNICHE              [?] │  │  │  ┌────────────────────────┐   ││
│  │  │    Coastal Road              │  │  │  │ 📸 PHOTO SPOTS         │   ││
│  │  │    ...                       │  │  │  │ ...                    │   ││
│  │  └──────────────────────────────┘  │  │  └────────────────────────┘   ││
│  │                                    │  │                                ││
│  │  ┌──────────────────────────────┐  │  │  ┌────────────────────────┐   ││
│  │  │ + Create your own area       │  │  │  │ 🏨 HOTELS              │   ││
│  │  └──────────────────────────────┘  │  │  │ ...                    │   ││
│  │                                    │  │  └────────────────────────┘   ││
│  │                                    │  │                                ││
│  │                                    │  │  [🎲 Surprise me]             ││
│  │                                    │  │                                ││
│  └────────────────────────────────────┘  └────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🤖 Welcome to planning! I've suggested some areas based on what couples   │
│     love in Marseille. You can start by picking an area, or browse the     │
│     suggestions on the right and add things you like. What sounds good?    │
│                                                                             │
│  [Show me romantic spots]  [What's unique here?]  [Help me decide]         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Ask me anything: [Where should we have dinner?___________________] [→]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Active Planning State

After user has added items to clusters:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   PARIS → MARSEILLE → BARCELONA                              [Save] [Share]│
│            ★ editing                                                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐│
│  │                                    │  │                                ││
│  │  YOUR PLAN                         │  │  DISCOVER                      ││
│  │  5 places · ~7 hours total         │  │                                ││
│  │                                    │  │  ┌────────────────────────┐   ││
│  │  ┌──────────────────────────────┐  │  │  │ 📍 NEAR YOUR PICKS     │   ││
│  │  │ 📍 LE PANIER            [⋮] │  │  │  │    Within 10 min walk  │   ││
│  │  │    Historic Quarter          │  │  │  │                        │   ││
│  │  │                              │  │  │  │ ┌──────┐ ┌──────┐     │   ││
│  │  │  ┌────────────────────────┐  │  │  │  │ │Café  │ │Secret│     │   ││
│  │  │  │ 🚶 Walk the old town   │  │  │  │  │ │Paris-│ │Wine  │     │   ││
│  │  │  │    ~2h · Free          │  │  │  │  │ │ien   │ │Bar   │     │   ││
│  │  │  └────────────────────────┘  │  │  │  │ │ 3min │ │ 5min │     │   ││
│  │  │  ┌────────────────────────┐  │  │  │  │ │ [+]  │ │ [+]  │     │   ││
│  │  │  │ 🎨 Street art tour     │  │  │  │  │ └──────┘ └──────┘     │   ││
│  │  │  │    ~1.5h · €15         │  │  │  │  │                        │   ││
│  │  │  └────────────────────────┘  │  │  │  │ ┌──────┐ ┌──────┐     │   ││
│  │  │  ┌────────────────────────┐  │  │  │  │ │Photo │ │Bakery│     │   ││
│  │  │  │ 🍽️ La Cantina          │  │  │  │  │ │Spot  │ │Four  │     │   ││
│  │  │  │    Lunch · €€          │  │  │  │  │ │      │ │des   │     │   ││
│  │  │  └────────────────────────┘  │  │  │  │ │ 4min │ │ 6min │     │   ││
│  │  │                              │  │  │  │ │ [+]  │ │ [+]  │     │   ││
│  │  │  ⏱ ~4.5h · 🚶 all <5 min    │  │  │  │ └──────┘ └──────┘     │   ││
│  │  │                              │  │  │  │                        │   ││
│  │  │  [+ Add more to Le Panier]   │  │  │  └────────────────────────┘   ││
│  │  └──────────────────────────────┘  │  │                                ││
│  │                                    │  │  ─────────────────────────────  ││
│  │  ┌──────────────────────────────┐  │  │                                ││
│  │  │ 📍 VIEUX PORT           [⋮] │  │  │  🍽️ Restaurants                ││
│  │  │    The Old Harbor            │  │  │  ┌──────┐ ┌──────┐ ┌──────┐   ││
│  │  │                              │  │  │  │Chez  │ │AM by │ │Le    │   ││
│  │  │  ┌────────────────────────┐  │  │  │  │Fonfon│ │Peron │ │Rhul  │   ││
│  │  │  │ 🍽️ Chez Fonfon         │  │  │  │  │€€€   │ │€€€€  │ │€€    │   ││
│  │  │  │    Dinner · €€€        │  │  │  │  │8min  │ │12min │ │15min │   ││
│  │  │  └────────────────────────┘  │  │  │  │ [+]  │ │ [+]  │ │ [+]  │   ││
│  │  │  ┌────────────────────────┐  │  │  │  └──────┘ └──────┘ └──────┘   ││
│  │  │  │ 📸 Sunset at Vallon    │  │  │  │                                ││
│  │  │  │    Photo · Best 6-7pm  │  │  │  │  [Show 10 more restaurants]    ││
│  │  │  └────────────────────────┘  │  │  │                                ││
│  │  │                              │  │  │  ✨ Activities                  ││
│  │  │  ⏱ ~3h · 🚶 all <8 min      │  │  │  ┌──────┐ ┌──────┐ ┌──────┐   ││
│  │  │                              │  │  │  │Château│ │Calan-│ │Diving│   ││
│  │  │  [+ Add more to Vieux Port]  │  │  │  │d'If  │ │ques  │ │Intro │   ││
│  │  └──────────────────────────────┘  │  │  │~2h   │ │~4h   │ │~3h   │   ││
│  │                                    │  │  │ [+]  │ │ [+]  │ │ [+]  │   ││
│  │  ┌──────────────────────────────┐  │  │  └──────┘ └──────┘ └──────┘   ││
│  │  │ + Create new area            │  │  │                                ││
│  │  └──────────────────────────────┘  │  │  [Show 10 more activities]     ││
│  │                                    │  │                                ││
│  │                                    │  │  📸 Photo Spots                ││
│  │                                    │  │  🏨 Hotels                     ││
│  │                                    │  │  🍷 Bars & Cafes               ││
│  │                                    │  │                                ││
│  │                                    │  │  [🎲 Surprise me]             ││
│  │                                    │  │                                ││
│  └────────────────────────────────────┘  └────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🤖 Great picks so far! Your Le Panier morning is shaping up nicely —      │
│     the street art tour is a hidden gem most tourists miss. I noticed      │
│     you don't have anything planned between lunch and dinner. Want me      │
│     to suggest some afternoon activities near Vieux Port?                  │
│                                                                             │
│  [Yes, show me options]  [I'll figure it out]  [What do you recommend?]    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Ask me anything: [_______________________________________________] [→]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Mobile Layout

On mobile, the two columns stack with tabs:

```
┌─────────────────────────────┐
│ MARSEILLE · 2 nights   [≡] │
├─────────────────────────────┤
│                             │
│  ┌──────────┐ ┌──────────┐  │
│  │ Your Plan│ │ Discover │  │
│  │    ★     │ │          │  │
│  └──────────┘ └──────────┘  │
│                             │
│  YOUR PLAN                  │
│  5 places · ~7h             │
│                             │
│  ┌───────────────────────┐  │
│  │ 📍 LE PANIER      [⋮]│  │
│  │                       │  │
│  │  🚶 Walk old town     │  │
│  │  🎨 Street art tour   │  │
│  │  🍽️ La Cantina        │  │
│  │                       │  │
│  │  ⏱ ~4.5h · 🚶 <5min   │  │
│  │                       │  │
│  │  [+ Add more]         │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📍 VIEUX PORT     [⋮]│  │
│  │  ...                  │  │
│  └───────────────────────┘  │
│                             │
│  [+ Create new area]        │
│                             │
├─────────────────────────────┤
│ 🤖 Looking good! Need help  │
│    with afternoon plans?    │
│                             │
│ [Yes] [No] [Ask something]  │
│                             │
│ [_____________________] [→] │
└─────────────────────────────┘
```

---

## 5. Component Specification

### 5.1 Page-Level Components

#### `PlanningPage`
**Path:** `/pages/PlanningPage.tsx`

**Responsibilities:**
- Route parameter handling (`/plan/:routeId`)
- Initialize planning state from route data
- Coordinate layout and data fetching
- Handle save/exit flows

**Props:** None (uses route params)

**State:**
- Loading state for initial data fetch
- Save status (saving, saved, error)

---

#### `CityTabs`
**Path:** `/components/planning/CityTabs.tsx`

**Visual:**
```
┌─────────┐ ┌───────────┐ ┌───────────┐
│ PARIS   │ │ MARSEILLE │ │ BARCELONA │
│ origin  │ │ ★ 2 nights│ │ 2 nights  │
└─────────┘ └───────────┘ └───────────┘
```

**Props:**
```typescript
interface CityTabsProps {
  cities: CityData[];
  currentCityId: string;
  onCityChange: (cityId: string) => void;
  planProgress: Record<string, { itemCount: number; isComplete: boolean }>;
}
```

**Behavior:**
- Origin city is non-clickable (display only)
- Shows nights per city
- Shows progress indicator (items added / complete checkmark)
- Current city highlighted

---

#### `PlanningLayout`
**Path:** `/components/planning/PlanningLayout.tsx`

**Responsibilities:**
- Two-column responsive layout
- Left panel: Your Plan
- Right panel: Discover
- Bottom panel: Companion (always visible)

**Props:**
```typescript
interface PlanningLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  companionPanel: React.ReactNode;
}
```

---

### 5.2 Left Panel Components (Your Plan)

#### `YourPlan`
**Path:** `/components/planning/plan/YourPlan.tsx`

**Responsibilities:**
- Container for all clusters
- Shows summary stats (total items, total time)
- Empty state with welcome message
- "Create new area" button

**Props:**
```typescript
interface YourPlanProps {
  cityId: string;
  clusters: Cluster[];
  suggestedClusters: SuggestedCluster[]; // From City Intelligence
  onCreateCluster: (name: string) => void;
}
```

---

#### `ClusterCard`
**Path:** `/components/planning/plan/ClusterCard.tsx`

**Visual:**
```
┌──────────────────────────────────────┐
│ 📍 LE PANIER                    [⋮] │
│    Historic Quarter                  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🚶 Walk the old town           │  │
│  │    ~2h · Free                  │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ 🎨 Street art tour             │  │
│  │    ~1.5h · €15                 │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ 🍽️ La Cantina                  │  │
│  │    Lunch · €€                  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ⏱ ~4.5h total · 🚶 all <5 min walk │
│                                      │
│  [+ Add more to Le Panier]           │
└──────────────────────────────────────┘
```

**Props:**
```typescript
interface ClusterCardProps {
  cluster: Cluster;
  onAddItem: (card: PlanCard) => void;
  onRemoveItem: (itemId: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  isExpanded?: boolean;
}
```

**Computed displays:**
- Total duration: Sum of item durations
- Walking distance: Max distance between any two items
- Cluster health: Green if all <10min apart, yellow if some 10-15, red if >15

---

#### `PlanItem`
**Path:** `/components/planning/plan/PlanItem.tsx`

**Visual:**
```
┌────────────────────────────────────┐
│ 🍽️ La Cantina                  [×] │
│    Lunch · €€ · ~1h                │
└────────────────────────────────────┘
```

**Props:**
```typescript
interface PlanItemProps {
  item: PlanCard;
  onRemove: () => void;
  onMove: (targetClusterId: string) => void;
}
```

---

#### `EmptyClusterSuggestion`
**Path:** `/components/planning/plan/EmptyClusterSuggestion.tsx`

For suggested areas the user hasn't started building yet:

**Visual:**
```
┌──────────────────────────────────────┐
│ 📍 LE PANIER                    [?] │
│    Historic Quarter                  │
│                                      │
│    Narrow medieval streets, street   │
│    art, artisan shops, and hidden    │
│    courtyards perfect for exploring  │
│                                      │
│    [Start building here →]           │
└──────────────────────────────────────┘
```

**Props:**
```typescript
interface EmptyClusterSuggestionProps {
  area: {
    name: string;
    description: string;
    center: LatLng;
  };
  onStart: () => void;
  onDismiss: () => void;
}
```

---

#### `CreateClusterModal`
**Path:** `/components/planning/plan/CreateClusterModal.tsx`

**Visual:**
```
┌────────────────────────────────────────┐
│ Create New Area                    [×] │
├────────────────────────────────────────┤
│                                        │
│  Area Name                             │
│  ┌──────────────────────────────────┐  │
│  │ Notre-Dame area                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Or let me suggest based on a place:   │
│  ┌──────────────────────────────────┐  │
│  │ Search for a place...            │  │
│  └──────────────────────────────────┘  │
│                                        │
│              [Cancel]  [Create Area]   │
│                                        │
└────────────────────────────────────────┘
```

---

### 5.3 Right Panel Components (Discover)

#### `DiscoverPanel`
**Path:** `/components/planning/discover/DiscoverPanel.tsx`

**Responsibilities:**
- Container for all suggestion categories
- NearbySection at top (if user has picks)
- Category sections below
- "Surprise me" button

**Props:**
```typescript
interface DiscoverPanelProps {
  cityId: string;
  userClusters: Cluster[]; // To calculate proximity
  onAddCard: (card: PlanCard, clusterId?: string) => void;
}
```

---

#### `NearbySection`
**Path:** `/components/planning/discover/NearbySection.tsx`

Shows items specifically close to user's current picks:

**Visual:**
```
┌────────────────────────────────────────┐
│ 📍 NEAR YOUR PICKS                     │
│    Within 10 min walk                  │
│                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Café     │ │ Secret   │ │ Photo    │ │
│ │ Parisien │ │ Wine Bar │ │ Spot     │ │
│ │ 3min ↗  │ │ 5min ↗  │ │ 4min ↗  │ │
│ │ [+]      │ │ [+]      │ │ [+]      │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                        │
└────────────────────────────────────────┘
```

**Props:**
```typescript
interface NearbySectionProps {
  nearbyCards: PlanCard[]; // Pre-filtered to <10min
  onAddCard: (card: PlanCard) => void;
}
```

Only shows if user has at least one item in their plan.

---

#### `CategorySection`
**Path:** `/components/planning/discover/CategorySection.tsx`

**Visual:**
```
┌────────────────────────────────────────┐
│ 🍽️ RESTAURANTS                         │
│                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ Chez     │ │ AM by    │ │ Le       │ │
│ │ Fonfon   │ │ Peron    │ │ Rhul     │ │
│ │ €€€      │ │ €€€€     │ │ €€       │ │
│ │ 8min     │ │ 12min    │ │ 15min    │ │
│ │ [+]      │ │ [+]      │ │ [+]      │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                        │
│ [Show 10 more restaurants]             │
│                                        │
└────────────────────────────────────────┘
```

**Props:**
```typescript
interface CategorySectionProps {
  type: 'restaurant' | 'activity' | 'photo_spot' | 'hotel' | 'bar';
  title: string;
  icon: React.ReactNode;
  cards: PlanCard[];
  isLoading: boolean;
  onShowMore: () => void;
  onAddCard: (card: PlanCard) => void;
  userClusters: Cluster[]; // For proximity calculation
}
```

---

#### `SuggestionCard`
**Path:** `/components/planning/discover/SuggestionCard.tsx`

**Visual:**
```
┌──────────────────────┐
│ ┌──────────────────┐ │
│ │    [image]       │ │  ← Optional image
│ └──────────────────┘ │
│                      │
│ Chez Fonfon          │
│ Legendary            │
│ bouillabaisse        │
│                      │
│ €€€ · ~1.5h          │
│ 8 min from Vieux Port│ ← Proximity badge
│                      │
│ [+ Add to Plan]      │
└──────────────────────┘
```

**Props:**
```typescript
interface SuggestionCardProps {
  card: PlanCard;
  nearestCluster?: { name: string; walkingMinutes: number };
  onAdd: () => void;
  isAdded: boolean; // Show checkmark if already in plan
}
```

**States:**
- Default: Add button visible
- Hover: Expanded info, button highlighted
- Added: Checkmark, muted styling

---

#### `FilterBar`
**Path:** `/components/planning/discover/FilterBar.tsx`

**Visual:**
```
┌────────────────────────────────────────────────────────┐
│ [All] [€] [€€] [€€€] [€€€€]  |  [Nearby first ▼]      │
└────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface FilterBarProps {
  priceFilter: number[] | null; // [1,2] for € and €€
  sortBy: 'proximity' | 'rating' | 'price';
  onPriceChange: (levels: number[] | null) => void;
  onSortChange: (sort: 'proximity' | 'rating' | 'price') => void;
}
```

---

### 5.4 Companion Components

#### `CompanionPanel`
**Path:** `/components/planning/companion/CompanionPanel.tsx`

**Responsibilities:**
- Fixed position at bottom
- Expandable to show history
- Houses message, actions, and input

**Visual (collapsed):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  🤖 Great picks! Your Le Panier morning is shaping up nicely. Want me      │
│     to suggest some afternoon activities?                                   │
│                                                                             │
│  [Yes, show me]  [I'll figure it out]  [What do you recommend?]            │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Ask me anything: [_______________________________________________] [→]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface CompanionPanelProps {
  messages: CompanionMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onActionClick: (action: CompanionAction) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}
```

---

#### `CompanionMessage`
**Path:** `/components/planning/companion/CompanionMessage.tsx`

**Props:**
```typescript
interface CompanionMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    cards?: PlanCard[];      // Optional inline card suggestions
    actions?: CompanionAction[]; // Optional action buttons
  };
  onAddCard?: (card: PlanCard) => void;
  onActionClick?: (action: CompanionAction) => void;
}
```

When message includes cards:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 Here are 3 sunset spots near Vieux Port:                               │
│                                                                             │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐                  │
│  │ Vallon des     │ │ Pharo Palace  │ │ Corniche       │                  │
│  │ Auffes         │ │ Gardens       │ │ Kennedy        │                  │
│  │ 3min · Free    │ │ 8min · Free   │ │ 12min · Free   │                  │
│  │ [+ Add]        │ │ [+ Add]       │ │ [+ Add]        │                  │
│  └────────────────┘ └────────────────┘ └────────────────┘                  │
│                                                                             │
│  [Show me more options]  [Tell me more about Vallon]                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

#### `CompanionInput`
**Path:** `/components/planning/companion/CompanionInput.tsx`

**Props:**
```typescript
interface CompanionInputProps {
  onSubmit: (message: string) => void;
  isDisabled: boolean;
  placeholder?: string;
}
```

---

### 5.5 Shared Components

#### `PlanCard`
**Path:** `/components/planning/shared/PlanCard.tsx`

Base card component used throughout:

**Props:**
```typescript
interface PlanCardProps {
  card: PlanCard;
  variant: 'suggestion' | 'planned' | 'inline' | 'compact';
  proximity?: { clusterName: string; minutes: number };
  onAdd?: () => void;
  onRemove?: () => void;
  isAdded?: boolean;
  showImage?: boolean;
}
```

**Variants:**
- `suggestion`: Full card in Discover panel
- `planned`: Compact card in cluster
- `inline`: Mini card in companion message
- `compact`: Smallest, just name + key info

---

#### `DistanceBadge`
**Path:** `/components/planning/shared/DistanceBadge.tsx`

```typescript
interface DistanceBadgeProps {
  minutes: number;
  fromName?: string; // "from Vieux Port"
}
```

**Renders:**
- `3 min ↗` (green) for < 10 min
- `15 min ↗` (yellow) for 10-20 min
- `30 min ↗` (red) for > 20 min

---

#### `PriceBadge`
**Path:** `/components/planning/shared/PriceBadge.tsx`

```typescript
interface PriceBadgeProps {
  level: 1 | 2 | 3 | 4;
  estimate?: string; // "€25-40"
}
```

**Renders:** € / €€ / €€€ / €€€€

---

#### `TypeIcon`
**Path:** `/components/planning/shared/TypeIcon.tsx`

```typescript
interface TypeIconProps {
  type: PlanCard['type'];
  size?: 'sm' | 'md' | 'lg';
}
```

**Icons:**
- restaurant: 🍽️ (Utensils)
- activity: ✨ (Sparkles)
- photo_spot: 📸 (Camera)
- hotel: 🏨 (Building)
- bar: 🍷 (Wine)
- cafe: ☕ (Coffee)

---

## 6. Backend Architecture

### 6.1 API Endpoints

#### Planning State

```
GET /api/planning/:routeId
```
Returns the current planning state for a route. Creates initial state if none exists.

**Response:**
```typescript
{
  tripPlan: {
    id: string;
    routeId: string;
    status: 'planning' | 'ready';
    cities: CityPlan[];
  }
}
```

---

```
POST /api/planning/:routeId/save
```
Saves the current plan state.

**Body:**
```typescript
{
  cities: CityPlan[];
}
```

---

#### Card Generation

```
POST /api/planning/:routeId/generate
```
Generates new suggestion cards.

**Body:**
```typescript
{
  cityId: string;
  type: 'restaurant' | 'activity' | 'photo_spot' | 'hotel' | 'bar' | 'all';
  count: number;           // How many to generate
  filters?: {
    priceMax?: number;     // 1-4
    nearClusterId?: string; // Prioritize near this cluster
    tags?: string[];       // ["romantic", "outdoor"]
  };
  excludeIds?: string[];   // Don't suggest these again
}
```

**Response:**
```typescript
{
  cards: PlanCard[];
}
```

---

#### Clusters

```
POST /api/planning/:routeId/clusters
```
Create a new cluster.

**Body:**
```typescript
{
  cityId: string;
  name: string;
  center?: { lat: number; lng: number };
  initialItems?: PlanCard[];
}
```

---

```
PUT /api/planning/:routeId/clusters/:clusterId
```
Update a cluster.

**Body:**
```typescript
{
  name?: string;
  addItems?: PlanCard[];
  removeItemIds?: string[];
  reorderItems?: string[]; // Item IDs in new order
}
```

---

```
DELETE /api/planning/:routeId/clusters/:clusterId
```
Delete a cluster. Items are moved to "unclustered" state.

---

#### Companion

```
POST /api/planning/:routeId/companion
```
Send message to companion agent. Returns SSE stream.

**Body:**
```typescript
{
  cityId: string;
  message: string;
  context: {
    currentPlan: CityPlan;
    recentAction?: {
      type: 'added_item' | 'removed_item' | 'created_cluster' | 'generated_more';
      item?: PlanCard;
      cluster?: Cluster;
    };
  };
}
```

**SSE Events:**
```typescript
type CompanionEvent =
  | { type: 'thinking'; content: string }
  | { type: 'message'; content: string }
  | { type: 'cards'; cards: PlanCard[] }
  | { type: 'actions'; actions: CompanionAction[] }
  | { type: 'done' }
  | { type: 'error'; error: string };
```

---

#### Utilities

```
GET /api/planning/distance
```
Calculate walking time between two points.

**Query:**
```
?from=43.2965,5.3698&to=43.2925,5.3745
```

**Response:**
```typescript
{
  walkingMinutes: number;
  transitMinutes?: number;
  drivingMinutes?: number;
}
```

---

### 6.2 Service Layer

#### `planningService.js`

```javascript
// Core planning operations
async function getPlan(routeId, userId)
async function savePlan(routeId, userId, plan)
async function createCluster(routeId, cityId, clusterData)
async function updateCluster(clusterId, updates)
async function deleteCluster(clusterId)
async function addItemToCluster(clusterId, card)
async function removeItemFromCluster(clusterId, itemId)
```

#### `cardGenerationService.js`

```javascript
// Generate cards using Claude
async function generateCards(request: GenerateRequest): Promise<PlanCard[]>
async function enrichCardsWithProximity(cards, userClusters)
async function calculateDistances(items: LatLng[]): Promise<DistanceMatrix>
```

#### `companionService.js`

```javascript
// Companion agent orchestration
async function* handleCompanionMessage(message, context): AsyncGenerator<CompanionEvent>
async function triggerReactiveMessage(action, plan): Promise<CompanionMessage>
```

---

## 7. Data Models

### 7.1 Database Schema (PostgreSQL)

```sql
-- Trip plans table
CREATE TABLE trip_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES routes(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'planning', -- planning, ready, active, completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(route_id, user_id)
);

-- City plans (one per city in the route)
CREATE TABLE city_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_plan_id UUID NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  city_id VARCHAR(100) NOT NULL,
  city_data JSONB NOT NULL, -- CityData from route
  display_order INT NOT NULL,

  UNIQUE(trip_plan_id, city_id)
);

-- Clusters (geographic areas)
CREATE TABLE plan_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_plan_id UUID NOT NULL REFERENCES city_plans(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  center_lat DECIMAL(10, 8),
  center_lng DECIMAL(11, 8),
  display_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plan items (things in clusters)
CREATE TABLE plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_plan_id UUID NOT NULL REFERENCES city_plans(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES plan_clusters(id) ON DELETE SET NULL, -- null = unclustered
  card_data JSONB NOT NULL, -- Full PlanCard
  display_order INT NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'ai_generated' -- ai_generated, companion, user_search
);

-- Companion message history
CREATE TABLE companion_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_plan_id UUID NOT NULL REFERENCES city_plans(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  cards JSONB, -- Optional array of PlanCards
  actions JSONB, -- Optional array of CompanionActions
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated cards cache (avoid regenerating same content)
CREATE TABLE generated_cards_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id VARCHAR(100) NOT NULL,
  card_type VARCHAR(50) NOT NULL,
  card_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

-- Indexes
CREATE INDEX idx_city_plans_trip ON city_plans(trip_plan_id);
CREATE INDEX idx_clusters_city ON plan_clusters(city_plan_id);
CREATE INDEX idx_items_cluster ON plan_items(cluster_id);
CREATE INDEX idx_items_city ON plan_items(city_plan_id);
CREATE INDEX idx_messages_city ON companion_messages(city_plan_id);
CREATE INDEX idx_cache_city_type ON generated_cards_cache(city_id, card_type);
```

### 7.2 TypeScript Types

```typescript
// ============================================
// Core Types
// ============================================

interface TripPlan {
  id: string;
  routeId: string;
  userId: string;
  status: 'planning' | 'ready' | 'active' | 'completed';
  cities: CityPlan[];
  createdAt: Date;
  updatedAt: Date;
}

interface CityPlan {
  id: string;
  cityId: string;
  city: CityData; // From route
  clusters: Cluster[];
  unclustered: PlanCard[]; // Saved but not in a cluster
}

interface Cluster {
  id: string;
  name: string;
  center: {
    lat: number;
    lng: number;
  };
  items: PlanCard[];

  // Computed
  totalDuration: number;     // Sum of item durations
  maxWalkingDistance: number; // Max walk between any two items
}

interface PlanCard {
  id: string;
  type: 'restaurant' | 'activity' | 'photo_spot' | 'hotel' | 'bar' | 'cafe' | 'experience';
  name: string;
  description: string;       // 1-2 sentences max
  whyGreat: string;          // Why this matches their trip

  location: {
    lat: number;
    lng: number;
    address: string;
    area: string;            // "Le Panier", "Vieux Port"
  };

  duration: number;          // Minutes
  priceLevel: 1 | 2 | 3 | 4;
  priceEstimate?: string;    // "€25-40 per person"
  bestTime?: string;         // "sunset", "morning", "lunch"
  tags: string[];            // ["romantic", "outdoor", "local-favorite"]

  // Optional enrichment
  imageUrl?: string;
  rating?: number;           // 1-5
  reviewCount?: number;
  bookingRequired?: boolean;
  bookingUrl?: string;
  openingHours?: string;

  // Source tracking
  source: 'ai_generated' | 'companion' | 'user_search' | 'city_intelligence';
  generatedAt: Date;
}

// ============================================
// Companion Types
// ============================================

interface CompanionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: PlanCard[];
  actions?: CompanionAction[];
  timestamp: Date;
}

interface CompanionAction {
  id: string;
  label: string;
  type: 'add_card' | 'show_more' | 'navigate' | 'dismiss' | 'custom';
  payload?: {
    card?: PlanCard;
    cardType?: string;
    clusterId?: string;
    query?: string;
  };
}

interface CompanionContext {
  cityId: string;
  currentPlan: CityPlan;
  preferences: UserPreferences;
  recentAction?: {
    type: 'added_item' | 'removed_item' | 'created_cluster' | 'generated_more';
    item?: PlanCard;
    cluster?: Cluster;
    timestamp: Date;
  };
}

// ============================================
// API Request/Response Types
// ============================================

interface GenerateCardsRequest {
  cityId: string;
  type: PlanCard['type'] | 'all';
  count: number;
  filters?: {
    priceMax?: number;
    nearClusterId?: string;
    tags?: string[];
    cuisine?: string;
    duration?: { min?: number; max?: number };
  };
  excludeIds?: string[];
  preferences?: UserPreferences;
}

interface GenerateCardsResponse {
  cards: PlanCard[];
  hasMore: boolean;
}

interface CompanionRequest {
  cityId: string;
  message: string;
  context: CompanionContext;
}

// SSE event types
type CompanionStreamEvent =
  | { type: 'thinking'; content: string }
  | { type: 'message'; content: string }
  | { type: 'cards'; cards: PlanCard[] }
  | { type: 'actions'; actions: CompanionAction[] }
  | { type: 'tool_call'; tool: string; args: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; result: unknown }
  | { type: 'done' }
  | { type: 'error'; error: string };
```

---

## 8. Planning Companion Agent

### 8.1 Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  User Input                                                                 │
│  (message or action trigger)                                                │
│                                                                             │
│         ↓                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CONTEXT ASSEMBLY                                                    │   │
│  │                                                                      │   │
│  │  • Current city plan (clusters, items)                              │   │
│  │  • User preferences (traveler type, interests)                      │   │
│  │  • Recent action (what triggered this)                              │   │
│  │  • City data (from route)                                           │   │
│  │  • Conversation history (last 10 messages)                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│         ↓                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PLANNING AGENT (Claude)                                             │   │
│  │                                                                      │   │
│  │  System prompt + context + user message                             │   │
│  │                                                                      │   │
│  │  Available tools:                                                    │   │
│  │  • generate_cards     - Create new suggestions                      │   │
│  │  • search_places      - Find specific places                        │   │
│  │  • calculate_distance - Walking time between points                 │   │
│  │  • analyze_plan       - Review plan for gaps/issues                 │   │
│  │  • get_place_details  - More info about a specific place            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│         ↓                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RESPONSE STREAMING (SSE)                                            │   │
│  │                                                                      │   │
│  │  Events in order:                                                    │   │
│  │  1. thinking (optional) - "Let me find some options..."             │   │
│  │  2. tool_call (if needed) - Which tool, what args                   │   │
│  │  3. tool_result (if needed) - What the tool returned                │   │
│  │  4. message - The actual response text                              │   │
│  │  5. cards (if any) - Suggested PlanCards                            │   │
│  │  6. actions - Contextual buttons                                    │   │
│  │  7. done - Stream complete                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 System Prompt

```markdown
You are the Planning Companion for rdtrip, a travel planning app. You help users build their trip itinerary by suggesting places, reacting to their choices, and helping them discover the perfect spots.

## Your Personality

- **Knowledgeable local friend**: You know these places deeply, not just Wikipedia facts
- **Opinionated but respectful**: Share your genuine recommendations, but respect their choices
- **Concise**: Users are actively planning, not reading essays. 2-3 sentences max unless they ask for detail
- **Proactive**: Notice gaps and opportunities, don't wait to be asked
- **Warm but not sycophantic**: Skip the "Great question!" - just help them

## Context You Have Access To

- **Their trip**: Cities, nights per city, traveler type (couple, solo, family, friends)
- **Their preferences**: What they said matters to them
- **Current plan**: What clusters they've created, what's in each
- **Recent action**: What they just did (added item, asked question, etc.)
- **City knowledge**: Use your knowledge + tools to provide accurate info

## Your Tools

1. **generate_cards**: Create new place suggestions
   - Use when: They want more options, you're suggesting something
   - Parameters: type (restaurant/activity/etc), count, filters

2. **search_places**: Find specific places
   - Use when: They ask for something specific ("rooftop bar near the port")
   - Parameters: query, city

3. **calculate_distance**: Get walking time between points
   - Use when: Checking if something fits in their cluster
   - Parameters: from (lat,lng), to (lat,lng)

4. **analyze_plan**: Review their plan
   - Use when: They ask for review, or you notice issues
   - Parameters: plan, focus (gaps/efficiency/balance)

## Response Patterns

### When user ADDS an item:

1. Brief acknowledgment (1 sentence about why it's a good/interesting pick)
2. Proximity context (how far from their other picks)
3. Flag if concerning (far away, expensive, timing issue)
4. Optional: suggest something complementary

**Example:**
"Chez Fonfon is legendary — their bouillabaisse is the real deal. It's about 8 min walk from your Vieux Port picks. Since you're planning dinner there, want me to find a sunset spot nearby for beforehand?"

### When user GENERATES more:

1. Acknowledge and explain your selection criteria
2. Generate the cards
3. Offer to filter differently if needed

**Example:**
"Here's 10 more restaurants. I focused on places within walking distance of Le Panier since that's your main area. Want me to filter by cuisine or price?"

### When user ASKS a question:

1. Answer directly and helpfully
2. Use tools if needed to get accurate info
3. Suggest relevant cards if applicable

**Example:**
User: "Is Chez Fonfon worth the price?"
You: "Absolutely worth it for a special dinner. It's been serving bouillabaisse since 1952, and they still buy fish directly from the boats at Vallon des Auffes. At €70-80pp, it's not cheap, but it's an experience you won't forget. The waterfront terrace at sunset is incredible for couples."

### When reviewing their PLAN (proactive or asked):

1. Note what's working well
2. Identify gaps (missing meals, empty time)
3. Flag inefficiencies (things far apart)
4. Suggest specific improvements

**Example:**
"Your plan is shaping up nicely! Le Panier morning looks great. I noticed you don't have anything between lunch and dinner though — that's about 5 hours. The Vieux Port area is perfect for that gap. Want me to suggest some afternoon activities there?"

## Important Guidelines

- **Never lie or make up facts**: If unsure, say so
- **Proximity matters**: Always consider walking distance
- **Respect their budget**: Note when something is expensive
- **Be specific**: "8 min walk" not "nearby", "€40pp" not "moderate"
- **Local insight**: Share tips a local would know
- **No generic responses**: Every response should be specific to their trip and this city

## Response Format

- Keep to 2-3 sentences unless they ask for detail
- When suggesting cards, provide 2-4 options
- Always include actionable next steps (buttons/actions)
- Use the city's actual place names and neighborhoods
```

### 8.3 Tool Definitions

#### generate_cards

```typescript
{
  name: "generate_cards",
  description: "Generate new place suggestions for the user's trip. Use this when they want more options or when you're proactively suggesting places.",
  parameters: {
    type: "object",
    properties: {
      city: {
        type: "string",
        description: "City name (e.g., 'Marseille')"
      },
      type: {
        type: "string",
        enum: ["restaurant", "activity", "photo_spot", "hotel", "bar", "cafe"],
        description: "Type of place to suggest"
      },
      count: {
        type: "number",
        description: "Number of suggestions (1-10)",
        default: 4
      },
      requirements: {
        type: "string",
        description: "Natural language requirements (e.g., 'romantic dinner with water view, €€-€€€')"
      },
      nearLocation: {
        type: "object",
        properties: {
          lat: { type: "number" },
          lng: { type: "number" }
        },
        description: "Prioritize places near this location"
      },
      priceRange: {
        type: "array",
        items: { type: "number" },
        description: "Price levels to include [1,2,3] for €-€€€"
      },
      excludeIds: {
        type: "array",
        items: { type: "string" },
        description: "IDs of places to exclude (already suggested or added)"
      }
    },
    required: ["city", "type"]
  }
}
```

#### search_places

```typescript
{
  name: "search_places",
  description: "Search for specific places by name or description. Use when user asks for something specific.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (e.g., 'rooftop bars in Le Panier', 'Chez Fonfon')"
      },
      city: {
        type: "string",
        description: "City to search in"
      },
      type: {
        type: "string",
        enum: ["restaurant", "activity", "photo_spot", "hotel", "bar", "cafe", "any"],
        description: "Filter by type, or 'any' for all"
      },
      limit: {
        type: "number",
        description: "Max results (1-10)",
        default: 5
      }
    },
    required: ["query", "city"]
  }
}
```

#### calculate_distance

```typescript
{
  name: "calculate_distance",
  description: "Calculate walking time between two locations. Use to check if places fit together in a cluster.",
  parameters: {
    type: "object",
    properties: {
      from: {
        type: "object",
        properties: {
          lat: { type: "number" },
          lng: { type: "number" }
        },
        description: "Starting point"
      },
      to: {
        type: "object",
        properties: {
          lat: { type: "number" },
          lng: { type: "number" }
        },
        description: "Ending point"
      },
      mode: {
        type: "string",
        enum: ["walking", "transit", "driving"],
        default: "walking"
      }
    },
    required: ["from", "to"]
  }
}
```

#### analyze_plan

```typescript
{
  name: "analyze_plan",
  description: "Analyze the user's current plan for gaps, inefficiencies, or opportunities. Use proactively or when asked.",
  parameters: {
    type: "object",
    properties: {
      focus: {
        type: "string",
        enum: ["gaps", "efficiency", "balance", "all"],
        description: "What aspect to analyze",
        default: "all"
      }
    }
  }
}
```

### 8.4 Reactive Triggers

The companion should automatically respond to certain user actions:

| Action | Trigger Condition | Response Pattern |
|--------|-------------------|------------------|
| Add item | Always | Comment on the pick + proximity |
| Add item far away | Distance > 20min from clusters | Warn about distance, suggest alternatives |
| Add expensive item | €€€€ | Note the price, confirm it's intentional |
| Create cluster | Always | Welcome the new area, suggest first items |
| Generate more | Always | Explain selection criteria |
| Empty cluster | Cluster has 0 items | Suggest what to add |
| Gap detected | Missing meal or large time gap | Proactively suggest |

### 8.5 Implementation

```javascript
// server/agents/planningAgent.js

import Anthropic from '@anthropic-ai/sdk';
import { generateCards } from '../services/cardGenerationService.js';
import { searchPlaces } from '../services/placesService.js';
import { calculateDistance } from '../services/distanceService.js';
import { analyzePlan } from '../services/planAnalysisService.js';

const anthropic = new Anthropic();

const TOOLS = [
  {
    name: 'generate_cards',
    description: '...',
    input_schema: { ... }
  },
  // ... other tools
];

export async function* handleCompanionMessage(message, context) {
  // Build system prompt with context
  const systemPrompt = buildSystemPrompt(context);

  // Create message with tools
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: buildMessages(context.history, message),
    tools: TOOLS,
  });

  // Process stream
  for await (const event of stream) {
    if (event.type === 'content_block_start') {
      if (event.content_block.type === 'tool_use') {
        yield { type: 'tool_call', tool: event.content_block.name, args: {} };
      }
    }

    if (event.type === 'content_block_delta') {
      if (event.delta.type === 'text_delta') {
        yield { type: 'message', content: event.delta.text };
      }
      if (event.delta.type === 'input_json_delta') {
        // Accumulate tool args
      }
    }

    if (event.type === 'message_stop') {
      // Handle tool calls
      const toolCalls = extractToolCalls(stream.finalMessage());
      for (const call of toolCalls) {
        const result = await executeToolCall(call, context);
        yield { type: 'tool_result', tool: call.name, result };

        if (call.name === 'generate_cards') {
          yield { type: 'cards', cards: result };
        }
      }
    }
  }

  // Add actions based on response
  yield {
    type: 'actions',
    actions: generateActions(context, message)
  };

  yield { type: 'done' };
}

async function executeToolCall(call, context) {
  switch (call.name) {
    case 'generate_cards':
      return await generateCards(call.args, context.preferences);
    case 'search_places':
      return await searchPlaces(call.args);
    case 'calculate_distance':
      return await calculateDistance(call.args.from, call.args.to, call.args.mode);
    case 'analyze_plan':
      return await analyzePlan(context.currentPlan, call.args.focus);
    default:
      throw new Error(`Unknown tool: ${call.name}`);
  }
}
```

---

## 9. Card Generation System

### 9.1 Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  REQUEST                                                                    │
│  {                                                                          │
│    cityId: "marseille",                                                     │
│    type: "restaurant",                                                      │
│    count: 10,                                                               │
│    filters: { priceMax: 3, nearClusterId: "cluster-123" },                 │
│    excludeIds: ["card-456", "card-789"]                                    │
│  }                                                                          │
│                                                                             │
│         ↓                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. LOAD CONTEXT                                                     │   │
│  │                                                                      │   │
│  │  • City data (from route)                                           │   │
│  │  • User preferences (traveler type, interests)                      │   │
│  │  • Existing plan (clusters, items)                                  │   │
│  │  • Previously generated cards (for exclusion)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│         ↓                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  2. BUILD PROMPT                                                     │   │
│  │                                                                      │   │
│  │  Type-specific prompt template filled with:                         │   │
│  │  • City name and context                                            │   │
│  │  • User preferences                                                 │   │
│  │  • Filter requirements                                              │   │
│  │  • Exclusion list                                                   │   │
│  │  • Quality guidelines                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│         ↓                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  3. CLAUDE GENERATION                                                │   │
│  │                                                                      │   │
│  │  Model: claude-sonnet-4-20250514                                            │   │
│  │  Output: Structured JSON array of PlanCards                         │   │
│  │  Validation: Ensure all required fields present                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│         ↓                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  4. ENRICHMENT (Optional)                                            │   │
│  │                                                                      │   │
│  │  • Verify/improve coordinates with geocoding                        │   │
│  │  • Add images from image search                                     │   │
│  │  • Cross-reference with Google Places for ratings                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│         ↓                                                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  5. PROXIMITY SCORING                                                │   │
│  │                                                                      │   │
│  │  For each card:                                                     │   │
│  │  • Calculate distance to each user cluster                          │   │
│  │  • Find nearest cluster                                             │   │
│  │  • Mark as "near" (<10min) or "elsewhere"                          │   │
│  │  • Sort: near first, then by distance                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│         ↓                                                                   │
│                                                                             │
│  RESPONSE                                                                   │
│  {                                                                          │
│    cards: PlanCard[],                                                       │
│    hasMore: true                                                            │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Generation Prompts

#### Restaurant Generation Prompt

```markdown
Generate ${count} restaurant recommendations for ${city} for a ${travelerType} trip.

## User Context
- Traveler type: ${travelerType}
- Preferences: ${preferences}
- Budget: ${priceRange}
- Nights in city: ${nights}

## Current Plan Context
- Areas they're visiting: ${clusterNames}
- Cluster centers: ${clusterCoordinates}
- Restaurants already in plan: ${existingRestaurants}

## Requirements
1. ${count} unique restaurants, not duplicating: ${excludeNames}
2. Mix of:
   - At least 2 within 10-min walk of their clusters
   - Different cuisines unless they specified one
   - Different price points within their range
3. Focus on:
   - Where locals actually eat (not tourist traps)
   - Places with character/story
   - Good value at each price point
4. For couples: romantic atmosphere matters
5. Each must have accurate location (lat/lng) for ${city}

## Output Format
Return a JSON array of objects with this exact structure:
```json
[
  {
    "id": "unique-id",
    "type": "restaurant",
    "name": "Restaurant Name",
    "description": "1-2 sentences about what makes it special",
    "whyGreat": "Why this matches their trip specifically",
    "location": {
      "lat": 43.2965,
      "lng": 5.3698,
      "address": "123 Rue Example",
      "area": "Le Panier"
    },
    "duration": 90,
    "priceLevel": 2,
    "priceEstimate": "€25-35 per person",
    "bestTime": "dinner",
    "tags": ["seafood", "romantic", "waterfront"]
  }
]
```

Generate ${count} restaurants now:
```

#### Activity Generation Prompt

```markdown
Generate ${count} activities for ${city} for a ${travelerType} trip of ${nights} nights.

## User Context
- Traveler type: ${travelerType}
- Preferences: ${preferences}
- Time in city: ${nights} nights (~${estimatedHours} waking hours)

## Current Plan Context
- Areas they're visiting: ${clusterNames}
- Activities already planned: ${existingActivities}
- Time already allocated: ~${plannedHours} hours

## Requirements
1. ${count} unique activities, not duplicating: ${excludeNames}
2. Mix of:
   - Durations (some 1-2h, some half-day)
   - Free and paid options
   - Indoor and outdoor
   - At least 2 things not in typical guidebooks
3. Consider:
   - Weather/season: ${season}
   - Their areas: prioritize things near their clusters
   - Pace: they're ${travelerType}, adjust energy level
4. For couples: shared experiences > solo activities

## Output Format
Return a JSON array with this structure:
```json
[
  {
    "id": "unique-id",
    "type": "activity",
    "name": "Activity Name",
    "description": "What you do and why it's special",
    "whyGreat": "Why this matches their trip",
    "location": {
      "lat": 43.2965,
      "lng": 5.3698,
      "address": "Location or starting point",
      "area": "Le Panier"
    },
    "duration": 120,
    "priceLevel": 2,
    "priceEstimate": "€15-20 per person",
    "bestTime": "morning",
    "tags": ["outdoor", "walking", "photography"]
  }
]
```

Generate ${count} activities now:
```

### 9.3 Proximity Calculation

```typescript
// services/proximityService.ts

interface ProximityResult {
  card: PlanCard;
  nearestCluster: {
    id: string;
    name: string;
    walkingMinutes: number;
  };
  isNearPlan: boolean; // < 10 min from any cluster
}

export function enrichWithProximity(
  cards: PlanCard[],
  clusters: Cluster[]
): ProximityResult[] {
  if (clusters.length === 0) {
    // No clusters yet - can't calculate proximity
    return cards.map(card => ({
      card,
      nearestCluster: null,
      isNearPlan: false
    }));
  }

  return cards.map(card => {
    const distances = clusters.map(cluster => ({
      id: cluster.id,
      name: cluster.name,
      walkingMinutes: calculateWalkingMinutes(
        card.location,
        cluster.center
      )
    }));

    const nearest = distances.reduce((min, d) =>
      d.walkingMinutes < min.walkingMinutes ? d : min
    );

    return {
      card,
      nearestCluster: nearest,
      isNearPlan: nearest.walkingMinutes <= 10
    };
  });
}

export function sortByProximity(results: ProximityResult[]): ProximityResult[] {
  return results.sort((a, b) => {
    // Near items first
    if (a.isNearPlan && !b.isNearPlan) return -1;
    if (!a.isNearPlan && b.isNearPlan) return 1;

    // Then by distance
    const aMin = a.nearestCluster?.walkingMinutes ?? Infinity;
    const bMin = b.nearestCluster?.walkingMinutes ?? Infinity;
    return aMin - bMin;
  });
}

function calculateWalkingMinutes(from: LatLng, to: LatLng): number {
  // Haversine distance, assuming 5 km/h walking speed
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceKm = R * c;

  // 5 km/h walking speed, add 20% for non-straight paths
  const walkingHours = (distanceKm / 5) * 1.2;
  return Math.round(walkingHours * 60);
}
```

---

## 10. Frontend State Management

### 10.1 Planning Store (Zustand)

```typescript
// stores/planningStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlanningState {
  // ============================================
  // Data
  // ============================================

  routeId: string | null;
  cities: CityData[];
  currentCityId: string | null;
  cityPlans: Record<string, CityPlan>;

  // Suggestions cache per city per type
  suggestions: Record<string, Record<string, PlanCard[]>>;

  // ============================================
  // Companion
  // ============================================

  companionMessages: Record<string, CompanionMessage[]>; // Per city
  companionLoading: boolean;
  companionExpanded: boolean;

  // ============================================
  // UI State
  // ============================================

  expandedClusterId: string | null;
  filters: {
    priceRange: number[] | null;
    sortBy: 'proximity' | 'rating' | 'price';
  };
  isDirty: boolean; // Unsaved changes
  isSaving: boolean;

  // ============================================
  // Actions - Navigation
  // ============================================

  setCurrentCity: (cityId: string) => void;

  // ============================================
  // Actions - Clusters
  // ============================================

  createCluster: (name: string, center?: LatLng) => string;
  renameCluster: (clusterId: string, name: string) => void;
  deleteCluster: (clusterId: string) => void;
  startSuggestedCluster: (suggestion: SuggestedCluster) => string;

  // ============================================
  // Actions - Items
  // ============================================

  addItemToCluster: (clusterId: string, card: PlanCard) => void;
  removeItemFromCluster: (itemId: string) => void;
  moveItemToCluster: (itemId: string, targetClusterId: string) => void;
  reorderItemsInCluster: (clusterId: string, itemIds: string[]) => void;

  // ============================================
  // Actions - Suggestions
  // ============================================

  generateSuggestions: (type: string, count?: number) => Promise<void>;
  clearSuggestions: (type: string) => void;
  setFilters: (filters: Partial<PlanningState['filters']>) => void;

  // ============================================
  // Actions - Companion
  // ============================================

  sendToCompanion: (message: string) => Promise<void>;
  triggerCompanionReaction: (action: RecentAction) => Promise<void>;
  toggleCompanion: () => void;

  // ============================================
  // Actions - Persistence
  // ============================================

  loadPlan: (routeId: string) => Promise<void>;
  savePlan: () => Promise<void>;
  resetPlan: () => void;
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      // Initial state
      routeId: null,
      cities: [],
      currentCityId: null,
      cityPlans: {},
      suggestions: {},
      companionMessages: {},
      companionLoading: false,
      companionExpanded: true,
      expandedClusterId: null,
      filters: {
        priceRange: null,
        sortBy: 'proximity',
      },
      isDirty: false,
      isSaving: false,

      // Implementation of actions...
      setCurrentCity: (cityId) => {
        set({ currentCityId: cityId });
      },

      createCluster: (name, center) => {
        const { currentCityId, cityPlans } = get();
        if (!currentCityId) return '';

        const clusterId = `cluster-${Date.now()}`;
        const newCluster: Cluster = {
          id: clusterId,
          name,
          center: center || { lat: 0, lng: 0 },
          items: [],
          totalDuration: 0,
          maxWalkingDistance: 0,
        };

        set({
          cityPlans: {
            ...cityPlans,
            [currentCityId]: {
              ...cityPlans[currentCityId],
              clusters: [...cityPlans[currentCityId].clusters, newCluster],
            },
          },
          isDirty: true,
        });

        return clusterId;
      },

      addItemToCluster: (clusterId, card) => {
        const { currentCityId, cityPlans } = get();
        if (!currentCityId) return;

        const cityPlan = cityPlans[currentCityId];
        const updatedClusters = cityPlan.clusters.map(cluster => {
          if (cluster.id !== clusterId) return cluster;

          const items = [...cluster.items, card];
          return {
            ...cluster,
            items,
            totalDuration: items.reduce((sum, i) => sum + i.duration, 0),
            // Recalculate maxWalkingDistance...
          };
        });

        set({
          cityPlans: {
            ...cityPlans,
            [currentCityId]: {
              ...cityPlan,
              clusters: updatedClusters,
            },
          },
          isDirty: true,
        });

        // Trigger companion reaction
        get().triggerCompanionReaction({
          type: 'added_item',
          item: card,
          cluster: updatedClusters.find(c => c.id === clusterId),
        });
      },

      generateSuggestions: async (type, count = 10) => {
        const { currentCityId, cityPlans, suggestions, filters } = get();
        if (!currentCityId) return;

        const cityPlan = cityPlans[currentCityId];
        const existingIds = [
          ...cityPlan.clusters.flatMap(c => c.items.map(i => i.id)),
          ...(suggestions[currentCityId]?.[type] || []).map(c => c.id),
        ];

        const response = await fetch(`/api/planning/${get().routeId}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityId: currentCityId,
            type,
            count,
            filters: {
              priceMax: filters.priceRange ? Math.max(...filters.priceRange) : undefined,
            },
            excludeIds: existingIds,
          }),
        });

        const { cards } = await response.json();

        set({
          suggestions: {
            ...suggestions,
            [currentCityId]: {
              ...suggestions[currentCityId],
              [type]: [
                ...(suggestions[currentCityId]?.[type] || []),
                ...cards,
              ],
            },
          },
        });
      },

      // ... more action implementations
    }),
    {
      name: 'rdtrip-planning',
      partialize: (state) => ({
        // Only persist essential data
        routeId: state.routeId,
        currentCityId: state.currentCityId,
        cityPlans: state.cityPlans,
      }),
    }
  )
);
```

### 10.2 Custom Hooks

#### `usePlanning`

```typescript
// hooks/usePlanning.ts

import { usePlanningStore } from '../stores/planningStore';
import { useEffect } from 'react';

export function usePlanning(routeId: string) {
  const {
    loadPlan,
    currentCityId,
    cityPlans,
    cities,
    setCurrentCity,
  } = usePlanningStore();

  // Load plan on mount
  useEffect(() => {
    loadPlan(routeId);
  }, [routeId, loadPlan]);

  const currentCityPlan = currentCityId ? cityPlans[currentCityId] : null;

  return {
    cities,
    currentCityId,
    currentCityPlan,
    setCurrentCity,
    isLoading: !currentCityPlan,
  };
}
```

#### `useCompanion`

```typescript
// hooks/useCompanion.ts

import { usePlanningStore } from '../stores/planningStore';
import { useCallback } from 'react';

export function useCompanion() {
  const {
    currentCityId,
    companionMessages,
    companionLoading,
    companionExpanded,
    sendToCompanion,
    toggleCompanion,
  } = usePlanningStore();

  const messages = currentCityId ? companionMessages[currentCityId] || [] : [];
  const latestMessage = messages[messages.length - 1];

  const send = useCallback((message: string) => {
    if (!message.trim()) return;
    sendToCompanion(message);
  }, [sendToCompanion]);

  return {
    messages,
    latestMessage,
    isLoading: companionLoading,
    isExpanded: companionExpanded,
    send,
    toggle: toggleCompanion,
  };
}
```

#### `useSuggestions`

```typescript
// hooks/useSuggestions.ts

import { usePlanningStore } from '../stores/planningStore';
import { useMemo } from 'react';

export function useSuggestions(type: string) {
  const {
    currentCityId,
    suggestions,
    cityPlans,
    generateSuggestions,
    filters,
  } = usePlanningStore();

  const cards = currentCityId
    ? suggestions[currentCityId]?.[type] || []
    : [];

  const currentPlan = currentCityId ? cityPlans[currentCityId] : null;

  // Add proximity info to each card
  const cardsWithProximity = useMemo(() => {
    if (!currentPlan || currentPlan.clusters.length === 0) {
      return cards.map(card => ({ card, nearestCluster: null, isNearPlan: false }));
    }

    return enrichWithProximity(cards, currentPlan.clusters);
  }, [cards, currentPlan]);

  // Sort based on filter
  const sortedCards = useMemo(() => {
    return sortByProximity(cardsWithProximity);
  }, [cardsWithProximity, filters.sortBy]);

  // Split into near and elsewhere
  const nearbyCards = sortedCards.filter(c => c.isNearPlan);
  const elsewhereCards = sortedCards.filter(c => !c.isNearPlan);

  const showMore = () => generateSuggestions(type, 10);

  return {
    nearbyCards,
    elsewhereCards,
    allCards: sortedCards,
    showMore,
    hasMore: true, // Always can generate more
  };
}
```

---

## 11. File Structure

```
spotlight-react/src/
├── pages/
│   └── PlanningPage.tsx                    # Main planning page
│
├── components/
│   └── planning/
│       ├── PlanningLayout.tsx              # Two-column layout
│       ├── CityTabs.tsx                    # City navigation tabs
│       │
│       ├── plan/                           # Left panel (Your Plan)
│       │   ├── YourPlan.tsx                # Container for clusters
│       │   ├── ClusterCard.tsx             # Single cluster with items
│       │   ├── PlanItem.tsx                # Item within cluster
│       │   ├── EmptyClusterSuggestion.tsx  # Suggested area to start
│       │   └── CreateClusterModal.tsx      # Create new area modal
│       │
│       ├── discover/                       # Right panel (Discover)
│       │   ├── DiscoverPanel.tsx           # Container for suggestions
│       │   ├── NearbySection.tsx           # Items near user's picks
│       │   ├── CategorySection.tsx         # Section per type
│       │   ├── SuggestionCard.tsx          # Single suggestion card
│       │   └── FilterBar.tsx               # Price/sort filters
│       │
│       ├── companion/                      # Bottom panel (Companion)
│       │   ├── CompanionPanel.tsx          # Main companion container
│       │   ├── CompanionMessage.tsx        # Single message with cards
│       │   ├── CompanionActions.tsx        # Action buttons
│       │   └── CompanionInput.tsx          # Text input
│       │
│       └── shared/                         # Shared components
│           ├── PlanCard.tsx                # Base card component
│           ├── DistanceBadge.tsx           # "3 min ↗"
│           ├── PriceBadge.tsx              # €€€
│           ├── TypeIcon.tsx                # Restaurant/Activity/etc icon
│           └── DurationBadge.tsx           # "~2h"
│
├── stores/
│   └── planningStore.ts                    # Zustand store
│
├── hooks/
│   ├── usePlanning.ts                      # Main planning hook
│   ├── useCompanion.ts                     # Companion interaction
│   ├── useSuggestions.ts                   # Card suggestions
│   └── useCluster.ts                       # Single cluster operations
│
├── services/
│   └── planningApi.ts                      # API calls
│
└── types/
    └── planning.ts                         # TypeScript types

server/
├── routes/
│   └── planning.js                         # /api/planning/* routes
│
├── services/
│   ├── planningService.js                  # Plan CRUD operations
│   ├── cardGenerationService.js            # Claude card generation
│   ├── proximityService.js                 # Distance calculations
│   └── placesService.js                    # Place search/enrichment
│
└── agents/
    └── planningAgent.js                    # Companion agent
```

---

## 12. Implementation Phases

### Phase 1: Foundation (Days 1-3)

**Goal:** Basic page structure and navigation

- [ ] Create `/plan/:routeId` route and `PlanningPage`
- [ ] Build `PlanningLayout` (two-column responsive)
- [ ] Build `CityTabs` for city navigation
- [ ] Create `planningStore` with basic state
- [ ] Set up `/api/planning/:routeId` endpoint (GET/POST)
- [ ] Build `YourPlan` container component
- [ ] Build `ClusterCard` (empty state)
- [ ] Build `EmptyClusterSuggestion` (from City Intelligence)

**Deliverable:** User can navigate to planning page, see cities, see suggested areas

---

### Phase 2: Suggestions Panel (Days 4-6)

**Goal:** Card display and generation

- [ ] Build `DiscoverPanel` container
- [ ] Build `CategorySection` for each type
- [ ] Build `SuggestionCard` component
- [ ] Implement `/api/planning/:routeId/generate` endpoint
- [ ] Create `cardGenerationService` with Claude prompts
- [ ] Build "Show 10 more" functionality
- [ ] Build `FilterBar` (price, sort)
- [ ] Implement proximity calculation
- [ ] Build `NearbySection` for close items

**Deliverable:** User can see suggestions, generate more, filter

---

### Phase 3: Planning Interactions (Days 7-9)

**Goal:** Building the actual plan

- [ ] Implement "Add to cluster" functionality
- [ ] Build `PlanItem` component
- [ ] Implement "Remove from cluster"
- [ ] Implement "Create new cluster"
- [ ] Build `CreateClusterModal`
- [ ] Add cluster stats (duration, walking distance)
- [ ] Implement `DistanceBadge` with color coding
- [ ] Add item reordering within clusters

**Deliverable:** User can build a complete plan with clusters and items

---

### Phase 4: Companion Agent (Days 10-13)

**Goal:** AI-powered assistance

- [ ] Build `CompanionPanel` UI
- [ ] Build `CompanionMessage` with card display
- [ ] Build `CompanionInput`
- [ ] Build `CompanionActions` buttons
- [ ] Create `planningAgent.js` with tools
- [ ] Implement SSE streaming for responses
- [ ] Add reactive triggers (on add, on gap, etc.)
- [ ] Implement tool execution (generate, search, distance)

**Deliverable:** Companion helps user build and refine plan

---

### Phase 5: Polish & Integration (Days 14-16)

**Goal:** Production ready

- [ ] Save/load plans to database
- [ ] Add "Plan Your Trip" button to Discovery
- [ ] Connect planning data to Today page
- [ ] Mobile responsive layout
- [ ] Loading states and skeletons
- [ ] Error handling and recovery
- [ ] Empty states and onboarding
- [ ] Performance optimization

**Deliverable:** Complete, polished feature ready for users

---

## 13. Design System

### 13.1 Colors (using existing rdtrip palette)

```css
/* Backgrounds */
--planning-bg: #FAF7F2;           /* Main background */
--planning-panel-bg: #FFFBF5;     /* Panel backgrounds */
--planning-card-bg: #FFFBF5;      /* Card backgrounds */

/* Text */
--planning-text-primary: #2C2417;  /* Main text */
--planning-text-secondary: #8B7355; /* Secondary text */
--planning-text-muted: #C4B8A5;    /* Muted text */

/* Accents */
--planning-accent: #C45830;        /* Primary accent (terracotta) */
--planning-accent-light: #FEF3EE;  /* Light accent bg */
--planning-secondary: #4A90A4;     /* Secondary accent (blue) */
--planning-success: #4A7C59;       /* Success/green */
--planning-warning: #D4A853;       /* Warning/gold */

/* Borders */
--planning-border: #E5DDD0;        /* Standard border */
--planning-border-light: #F5F0E8;  /* Light border */
```

### 13.2 Typography

```css
/* Headings - Fraunces */
.planning-heading {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  color: var(--planning-text-primary);
}

/* Body - Satoshi */
.planning-body {
  font-family: 'Satoshi', sans-serif;
  font-weight: 400;
  color: var(--planning-text-secondary);
}

/* Sizes */
--planning-text-xs: 0.75rem;   /* 12px - badges, meta */
--planning-text-sm: 0.875rem;  /* 14px - secondary text */
--planning-text-base: 1rem;    /* 16px - body text */
--planning-text-lg: 1.125rem;  /* 18px - card titles */
--planning-text-xl: 1.25rem;   /* 20px - section headers */
--planning-text-2xl: 1.5rem;   /* 24px - page headers */
```

### 13.3 Spacing

```css
--planning-space-1: 0.25rem;   /* 4px */
--planning-space-2: 0.5rem;    /* 8px */
--planning-space-3: 0.75rem;   /* 12px */
--planning-space-4: 1rem;      /* 16px */
--planning-space-5: 1.25rem;   /* 20px */
--planning-space-6: 1.5rem;    /* 24px */
--planning-space-8: 2rem;      /* 32px */
```

### 13.4 Component Styles

#### Cluster Card

```css
.cluster-card {
  background: var(--planning-card-bg);
  border: 1px solid var(--planning-border);
  border-radius: 1rem;
  padding: var(--planning-space-4);
}

.cluster-card-header {
  display: flex;
  align-items: center;
  gap: var(--planning-space-2);
  margin-bottom: var(--planning-space-3);
}

.cluster-card-icon {
  width: 2rem;
  height: 2rem;
  background: var(--planning-accent-light);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--planning-accent);
}

.cluster-card-title {
  font-family: 'Satoshi', sans-serif;
  font-weight: 600;
  font-size: var(--planning-text-lg);
  color: var(--planning-text-primary);
}

.cluster-card-stats {
  display: flex;
  gap: var(--planning-space-3);
  font-size: var(--planning-text-xs);
  color: var(--planning-text-muted);
  margin-top: var(--planning-space-3);
  padding-top: var(--planning-space-3);
  border-top: 1px solid var(--planning-border-light);
}
```

#### Suggestion Card

```css
.suggestion-card {
  background: var(--planning-card-bg);
  border: 1px solid var(--planning-border);
  border-radius: 0.75rem;
  padding: var(--planning-space-3);
  transition: all 0.2s ease;
}

.suggestion-card:hover {
  border-color: var(--planning-accent);
  box-shadow: 0 4px 12px rgba(44, 36, 23, 0.08);
}

.suggestion-card-name {
  font-family: 'Satoshi', sans-serif;
  font-weight: 600;
  font-size: var(--planning-text-base);
  color: var(--planning-text-primary);
  margin-bottom: var(--planning-space-1);
}

.suggestion-card-description {
  font-size: var(--planning-text-sm);
  color: var(--planning-text-secondary);
  line-height: 1.4;
  margin-bottom: var(--planning-space-2);
}

.suggestion-card-meta {
  display: flex;
  align-items: center;
  gap: var(--planning-space-2);
  font-size: var(--planning-text-xs);
  color: var(--planning-text-muted);
}

.suggestion-card-add {
  width: 100%;
  margin-top: var(--planning-space-3);
  padding: var(--planning-space-2) var(--planning-space-3);
  background: var(--planning-accent);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-family: 'Satoshi', sans-serif;
  font-weight: 600;
  font-size: var(--planning-text-sm);
  cursor: pointer;
  transition: background 0.2s ease;
}

.suggestion-card-add:hover {
  background: #A84828;
}
```

#### Distance Badge

```css
.distance-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--planning-text-xs);
  font-weight: 500;
}

.distance-badge--near {
  color: var(--planning-success);
}

.distance-badge--medium {
  color: var(--planning-warning);
}

.distance-badge--far {
  color: var(--planning-accent);
}
```

#### Companion Panel

```css
.companion-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--planning-card-bg);
  border-top: 1px solid var(--planning-border);
  box-shadow: 0 -4px 20px rgba(44, 36, 23, 0.08);
  z-index: 100;
}

.companion-message {
  padding: var(--planning-space-4) var(--planning-space-6);
}

.companion-avatar {
  width: 1.5rem;
  height: 1.5rem;
  background: var(--planning-accent-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.companion-text {
  font-size: var(--planning-text-base);
  color: var(--planning-text-primary);
  line-height: 1.5;
}

.companion-actions {
  display: flex;
  gap: var(--planning-space-2);
  margin-top: var(--planning-space-3);
}

.companion-action {
  padding: var(--planning-space-2) var(--planning-space-3);
  background: var(--planning-accent-light);
  color: var(--planning-accent);
  border: 1px solid var(--planning-accent);
  border-radius: 2rem;
  font-family: 'Satoshi', sans-serif;
  font-weight: 500;
  font-size: var(--planning-text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.companion-action:hover {
  background: var(--planning-accent);
  color: white;
}

.companion-input {
  display: flex;
  gap: var(--planning-space-2);
  padding: var(--planning-space-3) var(--planning-space-6);
  border-top: 1px solid var(--planning-border-light);
}

.companion-input input {
  flex: 1;
  padding: var(--planning-space-3);
  background: var(--planning-bg);
  border: 1px solid var(--planning-border);
  border-radius: 0.5rem;
  font-family: 'Satoshi', sans-serif;
  font-size: var(--planning-text-base);
  color: var(--planning-text-primary);
}

.companion-input input::placeholder {
  color: var(--planning-text-muted);
}
```

---

## Summary

This document provides a complete specification for the rdtrip Planning feature:

1. **User Journey**: Discovery → Planning → Trip Execution
2. **Core Concept**: Proximity-based clusters instead of time-based schedules
3. **UI/UX**: Two-panel layout with Your Plan + Discover + Companion
4. **Backend**: REST API for plans, SSE for companion
5. **AI**: Card generation + reactive companion agent
6. **Implementation**: 5 phases over ~16 days

The feature transforms rdtrip from "travel content" to "travel planning" — giving users the tools to build an actual itinerary they can follow, with AI assistance every step of the way.
