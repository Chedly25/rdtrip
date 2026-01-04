# Waycraft Planning Mode Specification

## Overview

Planning Mode is the core feature that transforms a list of discovered activities, restaurants, and hotels into a coherent day-by-day trip plan. The philosophy is **chill over precise** - users shouldn't feel like they're building a train schedule.

### Core Principles

1. **Slot-based, not time-based.** Days are divided into Morning, Afternoon, Evening, and Night. No clock times.
2. **Intelligence is invisible.** Proximity, opening hours, and vibes are handled automatically. Users feel smart, not micromanaged.
3. **Nothing is blocked.** Users can override anything. The system warns, never prevents.
4. **The companion narrates, not generates.** Algorithms build the plan; the AI explains and adjusts.

---

## Slots

### Definitions

| Slot | Rough Hours | Typical Activities | Icon |
|------|-------------|-------------------|------|
| Morning | 08:00 - 12:00 | Café, museum, market, church, park, walking tour | ☀️ |
| Afternoon | 12:00 - 18:00 | Restaurant (lunch), activity, beach, shopping, gallery | 🌤️ |
| Evening | 18:00 - 22:00 | Restaurant (dinner), bar, viewpoint, sunset spot, show | 🌅 |
| Night | 22:00 - 02:00 | Bar, club, late-night restaurant, concert | 🌙 |

### Slot Behaviour

- Each slot is a **container** that holds 0-N activities.
- Activities within a slot can be **reordered** via drag-and-drop.
- Empty slots are valid - not every night needs plans.
- Slots are visually distinct containers, stacked vertically per day.

---

## Data Model

### Enriched Place Object

When places are fetched from Google Places API, they are immediately enriched:

```typescript
interface EnrichedPlace {
  // From Google Places
  place_id: string;
  name: string;
  types: string[];
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number; // 0-4
  opening_hours?: {
    periods: OpeningPeriod[];
    weekday_text: string[];
  };
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  photos?: PlacePhoto[];
  
  // Enriched fields (computed at fetch time)
  cluster_id: string | null;
  valid_slots: Slot[];           // ['morning', 'afternoon']
  best_slot: Slot | null;        // 'morning' if it's optimal
  estimated_duration_mins: number;
  category: PlaceCategory;
  vibe_tags: string[];           // ['romantic', 'chill', 'lively']
  is_hidden_gem: boolean;        // high rating + low review count
}

type Slot = 'morning' | 'afternoon' | 'evening' | 'night';

type PlaceCategory = 
  | 'cafe'
  | 'restaurant'
  | 'bar'
  | 'museum'
  | 'gallery'
  | 'landmark'
  | 'park'
  | 'beach'
  | 'viewpoint'
  | 'shopping'
  | 'activity'
  | 'nightlife'
  | 'accommodation';
```

### Planned Item

When a place is added to the plan:

```typescript
interface PlannedItem {
  id: string;                    // UUID
  place: EnrichedPlace;
  day_index: number;             // 0, 1, 2...
  slot: Slot;
  order_in_slot: number;         // For ordering within slot
  user_notes?: string;
  is_locked: boolean;            // User explicitly placed, don't auto-move
  added_at: Date;
  added_by: 'user' | 'ai';
}
```

### Day Plan

```typescript
interface DayPlan {
  day_index: number;
  date: Date;
  city: City;
  slots: {
    morning: PlannedItem[];
    afternoon: PlannedItem[];
    evening: PlannedItem[];
    night: PlannedItem[];
  };
  flow_score?: FlowScore;
}

interface FlowScore {
  total_travel_mins: number;
  total_walking_km: number;
  pacing: 'relaxed' | 'balanced' | 'packed';
  warnings: string[];
}
```

### Trip Plan (Full State)

```typescript
interface TripPlan {
  id: string;
  route_id: string;
  days: DayPlan[];
  unassigned: EnrichedPlace[];   // Saved but not yet placed
  filters: UserFilters;          // Persisted filter preferences
  created_at: Date;
  updated_at: Date;
}
```

---

## Enrichment Logic

### Slot Validity Inference

```typescript
function inferValidSlots(place: GooglePlace): Slot[] {
  const dominated by = place.types[0];
  
  const typeToSlots: Record<string, Slot[]> = {
    // Food & Drink
    'cafe': ['morning', 'afternoon'],
    'bakery': ['morning'],
    'restaurant': ['afternoon', 'evening'],
    'bar': ['evening', 'night'],
    'night_club': ['night'],
    
    // Culture
    'museum': ['morning', 'afternoon'],
    'art_gallery': ['morning', 'afternoon'],
    'church': ['morning', 'afternoon'],
    'library': ['morning', 'afternoon'],
    
    // Outdoors
    'park': ['morning', 'afternoon', 'evening'],
    'beach': ['morning', 'afternoon'],
    'viewpoint': ['morning', 'afternoon', 'evening'],
    'natural_feature': ['morning', 'afternoon'],
    
    // Activities
    'shopping_mall': ['afternoon'],
    'market': ['morning'],
    'spa': ['morning', 'afternoon'],
    'gym': ['morning'],
    
    // Entertainment
    'movie_theater': ['afternoon', 'evening'],
    'casino': ['evening', 'night'],
    'bowling_alley': ['afternoon', 'evening'],
  };
  
  let slots = typeToSlots[type] || ['morning', 'afternoon', 'evening'];
  
  // Override with actual opening hours if available
  if (place.opening_hours?.periods) {
    slots = filterByActualHours(slots, place.opening_hours);
  }
  
  return slots;
}
```

### Best Slot Inference

```typescript
function inferBestSlot(place: GooglePlace): Slot | null {
  const name = place.name.toLowerCase();
  const types = place.types;
  
  // Sunset spots → evening
  if (name.match(/sunset|viewpoint|panorama|mirador/) || 
      types.includes('viewpoint')) {
    return 'evening';
  }
  
  // Museums → morning (beat the crowds)
  if (types.includes('museum') || types.includes('art_gallery')) {
    return 'morning';
  }
  
  // Markets → morning (freshest)
  if (types.includes('market') || name.includes('market')) {
    return 'morning';
  }
  
  // Cafés → morning
  if (types.includes('cafe')) {
    return 'morning';
  }
  
  // Rooftop bars → evening
  if (name.includes('rooftop') && types.includes('bar')) {
    return 'evening';
  }
  
  return null; // No strong preference
}
```

### Duration Estimation

```typescript
function estimateDuration(place: GooglePlace): number {
  const type = place.types[0];
  
  const typeToDuration: Record<string, number> = {
    'cafe': 45,
    'restaurant': 75,
    'bar': 60,
    'museum': 120,
    'art_gallery': 90,
    'church': 30,
    'park': 60,
    'beach': 180,
    'viewpoint': 30,
    'market': 60,
    'shopping_mall': 90,
    'spa': 120,
  };
  
  return typeToDuration[type] || 60;
}
```

### Hidden Gem Detection

```typescript
function isHiddenGem(place: GooglePlace): boolean {
  const rating = place.rating || 0;
  const reviews = place.user_ratings_total || 0;
  
  // High quality (4.3+) but not tourist-flooded (<500 reviews)
  return rating >= 4.3 && reviews >= 20 && reviews < 500;
}
```

### Geographic Clustering

After all places for a city are fetched, cluster them:

```typescript
function clusterPlaces(places: EnrichedPlace[], k: number = 4): EnrichedPlace[] {
  const points = places.map(p => [
    p.geometry.location.lat,
    p.geometry.location.lng
  ]);
  
  // Simple k-means (use a library like ml-kmeans)
  const result = kmeans(points, k);
  
  return places.map((place, i) => ({
    ...place,
    cluster_id: `cluster_${result.clusters[i]}`,
  }));
}
```

---

## User Interface

### Day View Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ◀ DAY 2 · Tuesday, Dec 24 · BARCELONA                      ▶   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ☀️ MORNING                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ☕ Café Federal                                           │  │
│  │     €€ · 8 min from hotel · "Great flat whites"           │  │
│  │                                     [✕]                    │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │     ↓ 12 min walk                                         │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  🏛️ Picasso Museum                                        │  │
│  │     ~2 hrs · El Born · ⭐ 4.5                               │  │
│  │                                     [✕]                    │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  [+ Add to morning]                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🌤️ AFTERNOON                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🍽️ El Xampanyet                                          │  │
│  │     €€ · Tapas · 3 min walk · "Cash only, get anchovies"  │  │
│  │                                     [✕]                    │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │     ↓ 5 min walk                                          │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  🚶 Gothic Quarter                                        │  │
│  │     ~1.5 hrs · "Wander the medieval streets"              │  │
│  │                                     [✕]                    │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  [+ Add to afternoon]                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🌅 EVENING                                                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🌇 Bunkers del Carmel                           💎        │  │
│  │     Free · 25 min drive · Best sunset in Barcelona        │  │
│  │                                     [✕]                    │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  [+ Add to evening]                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🌙 NIGHT                                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [+ Add to night]                                         │  │
│  │                                                           │  │
│  │  💬 "Nothing planned - want me to suggest a bar?"         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  📊 Day Summary: ~4.5 hrs activities · 2.1 km walking · Chill   │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Elements

**Activity Card:**
- Icon based on category (☕🍽️🏛️🌇🍷 etc.)
- Name (primary text, bold)
- Meta line: price level · duration or distance · short descriptor
- Hidden gem badge: 💎 (if applicable)
- Remove button: [✕] (top right, subtle until hover)
- Draggable for reordering

**Slot Container:**
- Distinct background colour per slot (subtle, not garish)
- Header with icon and slot name
- Cards stacked vertically
- Travel time indicators between cards
- "[+ Add to {slot}]" button at bottom

**Travel Time Indicator:**
```
├───────────────────────────────────────────────────────────┤
│     ↓ 12 min walk  ·  0.9 km                              │
├───────────────────────────────────────────────────────────┤
```
Or for driving:
```
│     ↓ 25 min drive  ·  18 km  ·  🅿️ Parking available     │
```

---

## Add Panel

Triggered when user clicks "[+ Add to {slot}]".

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ADD TO AFTERNOON · Tuesday                             [✕]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📍 Near: El Xampanyet (last in slot)     [Change anchor ▾]    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search places...                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Filters:                                                       │
│  [Type ▾] [Price ▾] [Duration ▾] [Rating ▾] [Vibe ▾] [🔄 Reset] │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  ✨ AI PICK                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎨 MACBA (Contemporary Art Museum)                     │   │
│  │  ⭐ 4.4 · €11 · ~1.5 hrs · 8 min walk                    │   │
│  │  "Striking building, great rooftop. Skip if you did     │   │
│  │   Picasso this morning - art overload."                  │   │
│  │                                            [+ Add]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  MORE OPTIONS (12)                                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🛍️ Mercat de la Boqueria                               │   │
│  │  ⭐ 4.3 · Free · ~45 min · 10 min walk                   │   │
│  │                                            [+ Add]       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  🏖️ Barceloneta Beach                                    │   │
│  │  Free · ~2 hrs · 15 min walk                             │   │
│  │                                            [+ Add]       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  ⛪ Santa Maria del Mar                                  │   │
│  │  ⭐ 4.7 · €5 · ~30 min · 4 min walk                💎    │   │
│  │                                            [+ Add]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Load more...]                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Filter Definitions

**Type Filter:**
```
[ ] All
[x] Food & Drink
    [x] Restaurant
    [x] Café
    [x] Bar
[ ] Culture
    [ ] Museum
    [ ] Gallery
    [ ] Landmark
[ ] Outdoors
    [ ] Park
    [ ] Beach
    [ ] Viewpoint
[ ] Activities
    [ ] Shopping
    [ ] Tours
    [ ] Entertainment
```

**Price Filter:**
```
[€] [€€] [€€€] [€€€€] [Free]
```
Multi-select toggles.

**Duration Filter:**
```
( ) Any
( ) Quick (<30 min)
( ) Medium (30-90 min)
( ) Long (90+ min)
```

**Rating Filter:**
```
Minimum: [4.0 ▾]
Options: Any, 3.5+, 4.0+, 4.3+, 4.5+
```

**Vibe Filter:**
```
[ ] Romantic
[ ] Chill
[ ] Lively
[ ] Family-friendly
[ ] Local favourite
[ ] Instagrammable
```
Multi-select.

### Anchor Logic

The "anchor" determines proximity sorting:

1. **Default:** Last item in the current slot.
2. **If slot is empty:** Last item in previous slot.
3. **If day is empty:** Hotel/accommodation location.
4. **User override:** Click "Change anchor" → select any placed activity or point on map.

```typescript
function getDefaultAnchor(day: DayPlan, slot: Slot): LatLng {
  const slotOrder: Slot[] = ['morning', 'afternoon', 'evening', 'night'];
  const slotIndex = slotOrder.indexOf(slot);
  
  // Check current slot
  const currentItems = day.slots[slot];
  if (currentItems.length > 0) {
    return currentItems[currentItems.length - 1].place.geometry.location;
  }
  
  // Check previous slots
  for (let i = slotIndex - 1; i >= 0; i--) {
    const items = day.slots[slotOrder[i]];
    if (items.length > 0) {
      return items[items.length - 1].place.geometry.location;
    }
  }
  
  // Fall back to accommodation
  return day.city.accommodation?.geometry.location || day.city.center;
}
```

### Filtering and Sorting

```typescript
interface FilterState {
  types: PlaceCategory[];
  price_levels: number[];        // [0, 1, 2, 3, 4]
  min_rating: number;
  max_duration: number | null;
  vibes: string[];
  show_hidden_gems_only: boolean;
}

function filterPlaces(
  places: EnrichedPlace[],
  slot: Slot,
  filters: FilterState,
  anchor: LatLng
): EnrichedPlace[] {
  return places
    // Must be valid for this slot
    .filter(p => p.valid_slots.includes(slot))
    // Not already in the plan
    .filter(p => !isPlanned(p))
    // Apply user filters
    .filter(p => filters.types.length === 0 || filters.types.includes(p.category))
    .filter(p => filters.price_levels.length === 0 || 
                 filters.price_levels.includes(p.price_level ?? 0))
    .filter(p => (p.rating ?? 0) >= filters.min_rating)
    .filter(p => !filters.max_duration || p.estimated_duration_mins <= filters.max_duration)
    .filter(p => filters.vibes.length === 0 || 
                 filters.vibes.some(v => p.vibe_tags.includes(v)))
    .filter(p => !filters.show_hidden_gems_only || p.is_hidden_gem)
    // Sort by: best_slot match → proximity → rating
    .sort((a, b) => {
      // Prioritise best_slot match
      const aOptimal = a.best_slot === slot ? 1 : 0;
      const bOptimal = b.best_slot === slot ? 1 : 0;
      if (aOptimal !== bOptimal) return bOptimal - aOptimal;
      
      // Then proximity
      const aDist = haversine(anchor, a.geometry.location);
      const bDist = haversine(anchor, b.geometry.location);
      if (Math.abs(aDist - bDist) > 0.5) return aDist - bDist; // >500m difference
      
      // Then rating
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
}
```

### AI Pick Logic

The "AI Pick" is the top recommendation with a companion-style explanation:

```typescript
interface AIPick {
  place: EnrichedPlace;
  reason: string;
  caveat?: string;
}

function generateAIPick(
  filtered: EnrichedPlace[],
  context: PlanningContext
): AIPick | null {
  if (filtered.length === 0) return null;
  
  const pick = filtered[0];
  
  // Generate reason based on why it ranked highly
  let reason = '';
  if (pick.best_slot === context.slot) {
    reason = `Perfect for ${context.slot} - `;
  }
  if (pick.is_hidden_gem) {
    reason += "A local favourite most tourists miss. ";
  }
  
  const distanceKm = haversine(context.anchor, pick.geometry.location);
  if (distanceKm < 0.3) {
    reason += "Just a 3-minute walk from where you'll be.";
  } else {
    reason += `${Math.round(distanceKm * 12)} min walk from ${context.anchorName}.`;
  }
  
  // Add caveats if relevant
  let caveat: string | undefined;
  const sameCategoryToday = countCategoryInDay(context.day, pick.category);
  if (sameCategoryToday >= 2 && pick.category === 'museum') {
    caveat = "You've already got 2 museums today - might be art overload.";
  }
  
  return { place: pick, reason, caveat };
}
```

---

## Companion Behaviour

The companion is a chat interface that runs alongside the planner. It's **reactive** (responds to changes) and **proactively helpful** (notices patterns).

### Trigger Points

| Event | Companion Response |
|-------|-------------------|
| Day has empty evening slot | "Nothing planned for tonight yet. Want me to find a good dinner spot?" |
| User adds 3+ items to one slot | "Morning's getting packed - about 5 hours of stuff. Shift something to afternoon?" |
| User adds activity far from others | "That's a 35-minute drive from your last stop. Want me to find something closer, or are you happy with the detour?" |
| User drags museum to evening slot | "Heads up: Picasso Museum closes at 7pm. Might be tight for an evening visit." |
| User removes AI suggestion | [Stays silent - doesn't guilt trip] |
| User hasn't interacted in 2 mins | "Looking good so far. Anything you want me to help find?" |
| Day has no food planned | "No lunch in the plan yet - want me to suggest somewhere near the Gothic Quarter?" |

### Proactive Suggestions

The companion watches the plan state and offers relevant suggestions:

```typescript
interface CompanionSuggestion {
  trigger: string;
  message: string;
  quick_actions?: QuickAction[];
}

function generateProactiveSuggestion(plan: TripPlan): CompanionSuggestion | null {
  for (const day of plan.days) {
    // Empty evening
    if (day.slots.evening.length === 0) {
      return {
        trigger: 'empty_evening',
        message: `Day ${day.day_index + 1} evening is free. Want me to suggest a sunset spot or dinner?`,
        quick_actions: [
          { label: 'Find sunset spot', action: 'search_sunset' },
          { label: 'Find dinner', action: 'search_dinner' },
          { label: 'Leave it free', action: 'dismiss' },
        ]
      };
    }
    
    // No lunch
    const hasLunch = day.slots.afternoon.some(i => 
      i.place.category === 'restaurant' || i.place.types.includes('restaurant')
    );
    if (!hasLunch && day.slots.afternoon.length > 0) {
      const anchor = day.slots.afternoon[0].place.name;
      return {
        trigger: 'no_lunch',
        message: `No lunch planned on Day ${day.day_index + 1}. Want me to find somewhere near ${anchor}?`,
        quick_actions: [
          { label: 'Yes, find lunch', action: 'search_lunch' },
          { label: 'Skip lunch', action: 'dismiss' },
        ]
      };
    }
    
    // Overpacked slot
    for (const [slot, items] of Object.entries(day.slots)) {
      const totalDuration = items.reduce((sum, i) => sum + i.place.estimated_duration_mins, 0);
      if (totalDuration > 300) { // 5+ hours
        return {
          trigger: 'overpacked_slot',
          message: `${capitalize(slot)} on Day ${day.day_index + 1} has about ${Math.round(totalDuration / 60)} hours of activities. Want me to help spread things out?`,
          quick_actions: [
            { label: 'Suggest rebalance', action: 'rebalance' },
            { label: 'It\'s fine', action: 'dismiss' },
          ]
        };
      }
    }
  }
  
  return null;
}
```

### Companion Chat Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Trip Companion                                      [−]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🤖 Looking good! Day 2 is shaping up nicely.            │   │
│  │                                                         │   │
│  │ One thought - you've got the Bunkers del Carmel for     │   │
│  │ sunset, but nothing after. There's a great tapas street │   │
│  │ in Gràcia on the way back. Want me to find options?     │   │
│  │                                                         │   │
│  │ [Yes, show me]  [Leave evening free]                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Yes, show me                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🤖 Here are a few spots in Gràcia:                      │   │
│  │                                                         │   │
│  │ 🍷 La Pepita · ⭐ 4.5 · €€ · Creative tapas             │   │
│  │    "The patatas bravas are legendary"                   │   │
│  │                                                         │   │
│  │ 🍺 Bodega Cal Pep · ⭐ 4.3 · € · Old-school vermouth    │   │
│  │    "Tiny, authentic, cash only"                         │   │
│  │                                                         │   │
│  │ [Add La Pepita to evening]                              │   │
│  │ [Add Bodega Cal Pep to evening]                         │   │
│  │ [Show more options]                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Ask me anything about your trip...                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### User Queries the Companion Can Handle

| Query Type | Example | Response Type |
|------------|---------|---------------|
| Find places | "Find a rooftop bar" | Search results with add buttons |
| Day advice | "Is Day 2 too packed?" | Analysis + suggestion |
| Logistics | "How do I get from the museum to dinner?" | Directions summary |
| Local tips | "What should I know about Barcelona?" | Curated tips |
| Replanning | "Move lunch to afternoon" | Executes change + confirms |
| Questions | "Is the Picasso Museum worth it?" | Opinion based on reviews |

---

## Conflict Handling

When a user does something that conflicts with constraints, **warn but don't block**.

### Opening Hours Conflict

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Timing issue                                                │
│                                                                 │
│  Picasso Museum closes at 7pm, but you've placed it in         │
│  evening (after 6pm). You might not have enough time.          │
│                                                                 │
│  [Move to afternoon]  [Find similar open late]  [Keep anyway]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Distance Warning

```
┌─────────────────────────────────────────────────────────────────┐
│  📍 This is a bit of a trek                                    │
│                                                                 │
│  Montjuïc Castle is 45 minutes from your previous stop         │
│  (Barceloneta Beach). That's fine if you're up for it.         │
│                                                                 │
│  [Find something closer]  [Keep it - worth the trip]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Overpacked Warning

```
┌─────────────────────────────────────────────────────────────────┐
│  ⏰ Morning is getting full                                     │
│                                                                 │
│  You've got about 5 hours planned for morning. That's          │
│  doable but tight.                                              │
│                                                                 │
│  [Move something to afternoon]  [I like it packed]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Map Integration

The map is always visible alongside the day planner.

### Map States

**Default View:**
- Shows all activities for current day as numbered pins.
- Route line connects pins in order (within slots, slots in sequence).
- Hotel/accommodation marked with 🏨.
- Cluster boundaries shown subtly.

**Add Mode (Add Panel open):**
- Zooms to relevant area (near anchor).
- Shows candidate places as smaller pins.
- Clicking a pin shows mini-card; click again to add.
- Already-added items shown as faded pins.

**Drag-to-add:**
- User can drag from map pin directly onto a slot container.

### Pin Styling

```typescript
const pinStyles = {
  planned: {
    size: 'large',
    color: 'orange',
    label: 'number', // 1, 2, 3...
  },
  candidate: {
    size: 'small',
    color: 'gray',
    label: 'icon', // category icon
  },
  accommodation: {
    size: 'medium',
    color: 'blue',
    label: '🏨',
  },
  highlight: {
    size: 'large',
    color: 'gold',
    label: 'number',
    pulse: true,
  },
};
```

---

## State Management

Use Zustand (already in stack) for planning state.

```typescript
interface PlanningStore {
  // State
  tripPlan: TripPlan;
  currentDayIndex: number;
  selectedSlot: Slot | null;
  addPanelOpen: boolean;
  filters: FilterState;
  companionMessages: CompanionMessage[];
  
  // Actions
  setCurrentDay: (index: number) => void;
  openAddPanel: (slot: Slot) => void;
  closeAddPanel: () => void;
  addItem: (place: EnrichedPlace, dayIndex: number, slot: Slot) => void;
  removeItem: (itemId: string) => void;
  moveItem: (itemId: string, targetDay: number, targetSlot: Slot) => void;
  reorderInSlot: (slot: Slot, fromIndex: number, toIndex: number) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  addCompanionMessage: (message: CompanionMessage) => void;
}
```

---

## API Endpoints

### Required Endpoints

```
GET  /api/v1/trip/:tripId/plan
     Returns full TripPlan object

POST /api/v1/trip/:tripId/plan/items
     Body: { place_id, day_index, slot }
     Adds item to plan

DELETE /api/v1/trip/:tripId/plan/items/:itemId
       Removes item from plan

PATCH /api/v1/trip/:tripId/plan/items/:itemId
      Body: { day_index?, slot?, order_in_slot? }
      Moves/reorders item

POST /api/v1/trip/:tripId/plan/suggest
     Body: { day_index, slot, filters }
     Returns AI pick + filtered candidates

POST /api/v1/trip/:tripId/companion/chat
     Body: { message }
     Returns companion response

GET  /api/v1/places/enrich/:placeId
     Returns EnrichedPlace for a Google Place ID
```

---

## Component Structure

```
/components/planning/
├── PlanningMode.tsx           # Main container
├── DayNavigator.tsx           # Day switcher (◀ Day 2 ▶)
├── DayView.tsx                # Full day layout
├── SlotContainer.tsx          # Single slot with items
├── PlannedItemCard.tsx        # Activity card in slot
├── TravelIndicator.tsx        # "↓ 12 min walk"
├── AddButton.tsx              # "+ Add to morning"
├── AddPanel/
│   ├── AddPanel.tsx           # Slide-out panel
│   ├── AnchorSelector.tsx     # "Near: X [Change]"
│   ├── FilterBar.tsx          # Filter toggles
│   ├── AIPickCard.tsx         # Top recommendation
│   ├── PlaceList.tsx          # Other options
│   └── PlaceCard.tsx          # Single option card
├── Companion/
│   ├── CompanionPanel.tsx     # Chat interface
│   ├── CompanionMessage.tsx   # Single message
│   ├── QuickActions.tsx       # Button row
│   └── ChatInput.tsx          # Text input
├── Map/
│   ├── PlanningMap.tsx        # Mapbox wrapper
│   ├── PlannedPin.tsx         # Numbered pin
│   ├── CandidatePin.tsx       # Small gray pin
│   └── RouteLayer.tsx         # Connecting lines
├── Warnings/
│   ├── ConflictModal.tsx      # Warning popup
│   └── SlotWarning.tsx        # Inline warning
├── Export/
│   ├── ExportModal.tsx        # Export options
│   ├── GPXExporter.ts         # GPX generation
│   ├── KMLExporter.ts         # KML generation
│   ├── ICSExporter.ts         # Calendar export
│   └── PDFExporter.ts         # Printable PDF
├── Offline/
│   ├── OfflineIndicator.tsx   # "Offline" banner
│   ├── SyncStatus.tsx         # Sync progress
│   └── PendingBadge.tsx       # Unsynced item indicator
└── DaySummary.tsx             # "~4 hrs · 2 km · Chill"
```

---

## Security & Validation

### Input Validation

**Client-side:**
- Sanitize all user-generated content (notes, custom names)
- Validate place_id format before API calls
- Validate day_index and slot values against trip bounds
- Rate-limit companion chat input (max 10 messages/minute)

**Server-side:**
- Verify user owns the trip before any mutation
- Validate place_id exists via Google Places API before adding
- Sanitize and truncate user notes (max 500 chars)
- Validate slot values are in allowed enum
- Verify day_index is within trip date range

### Authorization

```typescript
// Every plan mutation must verify ownership
async function verifyTripOwnership(tripId: string, userId: string): Promise<boolean> {
  const trip = await db.trips.findById(tripId);
  if (!trip) throw new NotFoundError('Trip not found');
  if (trip.owner_id !== userId && !trip.collaborators.includes(userId)) {
    throw new ForbiddenError('Not authorized to modify this trip');
  }
  return true;
}
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Plan mutations | 60 | per minute |
| Companion chat | 20 | per minute |
| Place search | 30 | per minute |
| Export | 5 | per minute |

### Data Integrity

- All mutations are idempotent (same action twice = same result)
- Version numbers on plan state for conflict detection
- Audit log of all plan changes (for debugging, not user-facing)
- Soft delete for removed items (recoverable for 30 days)

---

## Analytics Events

Track these events for product analytics:

| Event | Properties | Purpose |
|-------|------------|---------|
| `planning_mode_entered` | trip_id, city_count, total_places | Funnel tracking |
| `item_added` | place_id, slot, day_index, source (ai_pick/search/map) | Understand how users add |
| `item_removed` | place_id, slot, time_in_plan | Understand what doesn't stick |
| `item_moved` | place_id, from_slot, to_slot, from_day, to_day | Understand reorganization |
| `filter_applied` | filter_type, filter_value | Understand what users want |
| `ai_pick_shown` | place_id, slot | Track suggestion quality |
| `ai_pick_accepted` | place_id, slot | Track suggestion success |
| `ai_pick_rejected` | place_id, slot, alternative_chosen | Learn preferences |
| `conflict_warning_shown` | warning_type, place_id | Track friction points |
| `conflict_resolved` | resolution_type (quick_fix/keep_anyway/cancel) | Track resolution |
| `companion_message_sent` | message_length, query_type | Understand companion usage |
| `companion_action_taken` | action_type | Track companion effectiveness |
| `undo_used` | action_type_undone | Track mistake recovery |
| `export_initiated` | format, item_count | Track export usage |
| `plan_completed` | day_count, total_items, session_duration | Track completion |
| `offline_mode_entered` | pending_action_count | Track offline usage |
| `offline_sync_completed` | action_count, conflict_count | Track sync reliability |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**State & Data Layer:**
- Zustand store with full TripPlan state
- Undo/redo stack implementation
- IndexedDB caching layer
- Mutation layer with optimistic updates

**Core UI:**
- Day navigator (day switching)
- Slot containers (morning/afternoon/evening/night)
- Planned item cards with full details
- Empty slot states with add buttons
- Drag-and-drop reordering within slots (react-beautiful-dnd or dnd-kit)

**API Integration:**
- GET /plan endpoint
- POST/DELETE/PATCH item endpoints
- Offline queue for mutations

**Deliverable:** Can view and manually reorder a pre-populated plan.

---

### Phase 2: Add Panel & Filtering (Week 2-3)

**Add Panel:**
- Slide-out panel triggered by "+ Add" buttons
- Anchor selector with proximity display
- Search input with debounced filtering
- Full filter bar (type, price, duration, rating, vibe)
- Virtualized place list for performance

**Place Enrichment:**
- inferValidSlots() logic
- inferBestSlot() logic  
- estimateDuration() logic
- isHiddenGem() detection
- Geographic clustering (k-means)

**Filtering & Sorting:**
- Slot validity filtering (hide invalid places)
- Multi-filter combination
- Proximity sorting from anchor
- Filter state persistence

**Deliverable:** Can browse, filter, and add places to any slot.

---

### Phase 3: Intelligence Layer (Week 3-4)

**AI Pick:**
- Top recommendation with contextual explanation
- Caveat detection (art overload, cash only, etc.)
- Styled card differentiated from regular results

**Conflict Detection:**
- Opening hours validation
- Distance warning thresholds
- Overpacked slot detection
- Warning modals with quick-fix actions

**Travel Indicators:**
- Walking/driving time between consecutive items
- Distance display
- Parking availability notes where relevant

**Map Integration:**
- Mapbox with planned items as numbered pins
- Route lines connecting items
- Zoom to relevant area when Add Panel opens
- Click pin to see details
- Drag from map to slot (stretch)

**Deliverable:** Intelligent suggestions, warnings, and map visualization.

---

### Phase 4: Companion (Week 4-5)

**Companion Panel:**
- Collapsible chat interface
- Message components (AI message, user message, quick actions)
- Chat input with send handling

**Reactive Behaviour:**
- Trigger detection (empty slots, no lunch, overpacking)
- Proactive suggestion generation
- Quick action buttons that execute plan changes

**Chat Capabilities:**
- Natural language parsing for common queries
- "Find a rooftop bar" → search with filters
- "Move lunch to afternoon" → execute action
- "Is Day 2 too packed?" → analysis response

**LLM Integration:**
- Prompt templates for different query types
- Context injection (current day, placed items, preferences)
- Streaming responses for longer answers

**Deliverable:** Working companion that watches the plan and responds to queries.

---

### Phase 5: Cross-Day & Polish (Week 5-6)

**Cross-Day Operations:**
- Drag item to different day tab
- "Move to..." menu with day selection
- Ghost preview in target day during drag

**Day Summary:**
- Total duration calculation
- Total walking distance
- Pacing indicator (relaxed/balanced/packed)
- Warnings summary

**Flow Score:**
- Algorithm combining travel time, pacing, variety
- Subtle display in day header
- Companion references it in suggestions

**Visual Polish:**
- Loading states for all async operations
- Skeleton screens
- Micro-animations (add, remove, reorder)
- Error states with recovery options

**Deliverable:** Complete, polished planning experience.

---

### Phase 6: Export & Sync (Week 6-7)

**Export Formats:**
- GPX (route for GPS devices)
- KML (Google Earth)
- ICS (calendar events per activity)
- PDF (printable itinerary)

**Offline Mode:**
- Full IndexedDB implementation
- Pending action queue
- Sync on reconnect
- Conflict resolution UI

**Collaboration Prep:**
- User attribution on items
- Version numbers on plan state
- Mutation layer ready for websocket broadcast

**Deliverable:** Export working, offline mode complete, ready for future collab features.

---

### Phase 7: Testing & Hardening (Week 7-8)

**Testing:**
- Unit tests for enrichment logic
- Unit tests for filtering/sorting
- Integration tests for mutation layer
- E2E tests for critical flows (add item, reorder, undo)

**Performance:**
- Lighthouse audit (target 90+)
- Bundle size optimization
- Lazy loading for companion and map
- Virtual scrolling verification

**Accessibility:**
- Keyboard navigation audit
- Screen reader testing
- Colour contrast verification
- Focus management review

**Error Handling:**
- Network failure scenarios
- Invalid state recovery
- Stale data handling
- Graceful degradation

**Deliverable:** Production-ready, tested, accessible planning mode.

---

## Success Metrics

### User Engagement

| Metric | Target | Measurement |
|--------|--------|-------------|
| Items added per session | 10+ | Average across all planning sessions |
| Plan completion rate | 75%+ | Sessions where user adds items to 3+ days |
| Return to edit rate | 40%+ | Users who come back to modify their plan |
| Time to first add | <60s | From entering planning mode to first item added |
| Session duration | 8-15 min | Sweet spot - engaged but not frustrated |

### Companion Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Companion interaction rate | 50%+ | Sessions with at least one companion interaction |
| Suggestion acceptance rate | 35%+ | AI picks or suggestions that get added |
| Conflict resolution via suggestion | 80%+ | Warnings resolved using offered quick-fix |
| Chat queries per session | 2+ | Natural language questions asked |

### Technical Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial plan load | <500ms | P95 time to interactive |
| Add panel open | <200ms | Time from click to panel rendered |
| Filter response | <100ms | Time for list to update after filter change |
| Drag frame rate | 60fps | No dropped frames during drag operations |
| Offline sync success | 99%+ | Queued actions that sync successfully |
| Error rate | <0.1% | Unhandled errors per session |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Planning mode conversion | 60%+ | Users who enter planning after itinerary generation |
| Export rate | 30%+ | Completed plans that get exported |
| Share rate | 15%+ | Plans shared with others |
| Return user rate | 40%+ | Users who create a second trip |

---

## Design Decisions

### Empty Slots
Empty slots remain **expanded**, never auto-collapse. They serve as visual prompts to fill. Style them with:
- Subtle dashed border
- Muted text colour
- Lighter background
- Clear "+ Add" call-to-action

This keeps the day structure visible while making it obvious what's planned vs open.

### Cross-Day Item Moving
Support **both** methods:

**Drag-and-drop:**
- Drag an item to a different day tab in the day navigator
- Ghost preview appears in target day
- Drop into specific slot or let system auto-place based on item's valid_slots

**Explicit menu:**
- Three-dot menu on each item → "Move to..."
- Shows all days with mini-preview of existing items
- One-click move with slot selection

### Undo/Redo System

Full undo/redo is **required**. Implementation:

```typescript
interface PlanAction {
  type: 'add' | 'remove' | 'move' | 'reorder';
  timestamp: Date;
  payload: any;
  inverse: PlanAction; // Pre-computed reverse action
}

interface UndoStore {
  past: PlanAction[];
  future: PlanAction[];
  
  execute: (action: PlanAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

**Keyboard shortcuts:**
- `Cmd/Ctrl + Z` → Undo
- `Cmd/Ctrl + Shift + Z` → Redo

**Visual feedback:**
- Toast appears for 5 seconds after any change: "Added El Xampanyet to afternoon · [Undo]"
- Toast disappears on interaction or timeout
- Clicking "Undo" in toast reverses action immediately

**Stack limits:**
- Keep last 50 actions in memory
- Clear redo stack on new action (standard behaviour)

### Collaborative Planning

Design for collaboration **now**, implement later. This means:

**State architecture:**
```typescript
interface PlannedItem {
  // ... existing fields
  created_by: string;        // User ID
  created_at: Date;
  updated_by: string;        // Last modifier
  updated_at: Date;
  version: number;           // For conflict detection
}
```

**Mutation layer:**
All state changes go through a central mutation function that:
1. Applies change locally (optimistic UI)
2. Sends to server
3. Handles conflicts on response

```typescript
async function mutate(action: PlanAction): Promise<void> {
  // Apply optimistically
  applyAction(action);
  
  try {
    const result = await api.applyAction(action);
    if (result.conflict) {
      // Server has newer version - reconcile
      reconcile(result.serverState);
    }
  } catch (e) {
    // Rollback on failure
    applyAction(action.inverse);
    showError('Failed to save change');
  }
}
```

**Future websocket integration:**
The mutation layer can later broadcast to connected clients:
```typescript
// Future addition - structure supports this
websocket.on('plan_updated', (remoteAction) => {
  if (remoteAction.user_id !== currentUser.id) {
    applyAction(remoteAction);
    showToast(`${remoteAction.user_name} added ${remoteAction.item_name}`);
  }
});
```

**Conflict resolution:**
- Last-write-wins for same item
- No conflicts for different items
- Show "X is also editing" presence indicators (future)

### Offline Mode

Full offline support with sync:

**Caching strategy:**
```typescript
// IndexedDB stores
const stores = {
  tripPlan: 'trip_plans',      // Full plan state
  places: 'cached_places',      // Viewed places
  pendingActions: 'pending',    // Queued mutations
};
```

**On load:**
1. Load from IndexedDB immediately (instant render)
2. Fetch from server in background
3. Merge server state with any pending local changes
4. Apply pending actions to server

**When offline:**
1. Detect via `navigator.onLine` + fetch failures
2. Show persistent "Offline" indicator in header
3. All mutations queue to `pendingActions` store
4. UI continues working normally

**When back online:**
1. Detect via `online` event
2. Replay pending actions in order
3. Handle conflicts (server wins, notify user)
4. Clear pending queue on success
5. Remove "Offline" indicator

**Place data caching:**
- Cache any place the user has viewed
- Cache all places returned in Add Panel searches
- Don't prefetch aggressively (Google ToS, data usage)
- Show "Some details may be outdated" for cached places when offline

**Visual indicators:**
```
┌─────────────────────────────────────────┐
│  ⚡ Offline · Changes will sync when    │
│     you're back online                  │
└─────────────────────────────────────────┘
```

Items added while offline get a subtle sync icon until confirmed:
```
│  🏛️ Picasso Museum  🔄                  │
│     ~2 hrs · El Born · ⭐ 4.5            │
```

Icon disappears once synced.

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Initial plan load | <500ms |
| Add panel open | <200ms |
| Filter update | <100ms |
| Drag feedback | <16ms (60fps) |
| Undo/redo | <50ms |
| Offline detection | <2s |

### Optimisation Notes

**Virtualisation:**
- Add panel place list uses virtual scrolling (only render visible items)
- Day view doesn't need it (typically <20 items visible)

**Memoisation:**
- Filter results memoised by filter state hash
- Distance calculations cached per anchor point
- Cluster assignments computed once per city, stored on place objects

**Code splitting:**
- Companion chat loads lazily (not needed on first render)
- Map loads asynchronously (show placeholder during load)

---

## Error Handling

### Network Failures

**API call fails:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Couldn't save that change                                  │
│                                                                 │
│  [Try again]  [Continue offline]                                │
└─────────────────────────────────────────────────────────────────┘
```

"Continue offline" queues the action for later sync.

**Place data unavailable:**
- Show cached version if available
- Show skeleton card with "Details unavailable" if not
- Never block the planning flow

### Invalid States

**All items removed from a slot:**
- Slot returns to empty state gracefully
- No error, no confirmation needed

**Day has no items:**
- Valid state - some days are travel days
- Companion might gently note: "Day 3 is empty - travel day, or want me to suggest something?"

**Place no longer exists (Google API returns 404):**
- Mark item with warning: "This place may have closed"
- Don't auto-remove - let user decide
- Offer "Find replacement" action

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between slots and items |
| `Enter` | Open item details / Activate add button |
| `Delete` / `Backspace` | Remove focused item (with confirmation) |
| `Arrow Up/Down` | Reorder item within slot |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Escape` | Close add panel / Dismiss modal |

### Screen Reader Support

- All slots have ARIA labels: "Morning slot, 2 items"
- Items announced with full context: "Picasso Museum, museum, approximately 2 hours, El Born district"
- Drag-and-drop has keyboard alternative (arrow keys to reorder)
- Companion messages announced as they arrive

### Visual

- Minimum contrast ratio 4.5:1 for all text
- Focus indicators visible on all interactive elements
- Colour never the only indicator (icons accompany all status colours)
- Respects `prefers-reduced-motion` for animations