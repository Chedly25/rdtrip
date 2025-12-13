# Phase 2: Suggestions Panel - Implementation Prompt

## Instructions for Claude

You are implementing **Phase 2** of the Planning Feature for rdtrip. Phase 1 (Foundation) is complete. Your task is to build the **Suggestions Panel** - the right-side discovery interface where users browse and generate place suggestions.

**CRITICAL:**
- Read the spec sections listed below BEFORE writing any code
- Do NOT use TODO comments - implement fully or skip if Phase 3+
- Use the `frontend-design` skill for high-quality UI
- Build compiles with `npm run build` - no TypeScript errors

---

## Spec Sections to Read First

Read these sections from `/docs/PLANNING_FEATURE_SPEC.md`:

1. **Lines 655-805** - Right Panel Components (DiscoverPanel, NearbySection, CategorySection, SuggestionCard, FilterBar)
2. **Lines 896-970** - Shared Components (PlanCard variants, DistanceBadge, PriceBadge, TypeIcon)
3. **Lines 1014-1042** - API: `/api/planning/:routeId/generate` endpoint specification
4. **Lines 1162-1178** - Service layer: cardGenerationService
5. **Lines 1815-2095** - Card Generation System (pipeline, prompts, proximity calculation)
6. **Lines 2620-2815** - Design System (colors, typography, suggestion card styles)

---

## Phase 2 Checklist

### Frontend Components (7 files)

| File | Path | Description |
|------|------|-------------|
| `DiscoverPanel.tsx` | `components/planning/discover/` | Replace placeholder with full implementation |
| `CategorySection.tsx` | `components/planning/discover/` | Section for each card type with grid |
| `SuggestionCard.tsx` | `components/planning/discover/` | Individual suggestion card |
| `NearbySection.tsx` | `components/planning/discover/` | Items within 10min walk |
| `FilterBar.tsx` | `components/planning/discover/` | Price filter + sort dropdown |
| `DistanceBadge.tsx` | `components/planning/shared/` | Colored proximity indicator |
| `PriceBadge.tsx` | `components/planning/shared/` | Price level display (€-€€€€) |

### Backend (2 files)

| File | Path | Description |
|------|------|-------------|
| `cardGenerationService.js` | `server/services/` | Claude-powered card generation |
| Update `planning.js` | `server/routes/` | Implement `/generate` endpoint |

---

## Component Specifications

### 1. DiscoverPanel (Full Implementation)

Replace the Phase 1 placeholder. Structure:

```
┌────────────────────────────────────────┐
│ [FilterBar: price + sort]              │
├────────────────────────────────────────┤
│ 📍 NEAR YOUR PICKS (if has clusters)   │
│ [NearbySection - horizontal scroll]    │
├────────────────────────────────────────┤
│ 🍽️ RESTAURANTS                         │
│ [CategorySection - 2-col grid]         │
│ [Show 10 more restaurants]             │
├────────────────────────────────────────┤
│ ✨ ACTIVITIES                          │
│ [CategorySection - 2-col grid]         │
│ [Show 10 more activities]              │
├────────────────────────────────────────┤
│ 📸 PHOTO SPOTS                         │
│ [CategorySection]                      │
├────────────────────────────────────────┤
│ 🍷 BARS & CAFES                        │
│ [CategorySection]                      │
├────────────────────────────────────────┤
│ [🎲 Surprise me] button                │
└────────────────────────────────────────┘
```

**Props:**
```typescript
interface DiscoverPanelProps {
  cityId: string;
  cityName: string;
  clusters: Cluster[];  // For proximity calculation
}
```

**Behavior:**
- Auto-generates initial cards for each category on mount (4 per type)
- NearbySection only shows if user has items in clusters
- "Show 10 more" calls generate API for that type
- "Surprise me" generates 3 random cards across all types

### 2. CategorySection

```typescript
interface CategorySectionProps {
  type: 'restaurant' | 'activity' | 'photo_spot' | 'bar';
  title: string;
  icon: React.ReactNode;
  cards: PlanCard[];
  isLoading: boolean;
  hasMore: boolean;
  onShowMore: () => void;
  onAddCard: (card: PlanCard) => void;
  clusters: Cluster[];  // For proximity badges
}
```

**Visual:**
- 2-column grid on desktop, 1-column on mobile
- Each card shows proximity to nearest cluster
- Loading skeleton while generating
- "Show 10 more {type}" button at bottom

### 3. SuggestionCard

**Visual (from spec):**
```
┌──────────────────────┐
│ ┌──────────────────┐ │
│ │    [image]       │ │  ← Optional, 16:9 aspect
│ └──────────────────┘ │
│                      │
│ Chez Fonfon          │  ← Name (Satoshi 600)
│ Legendary            │  ← Description (2 lines max)
│ bouillabaisse        │
│                      │
│ €€€ · ~1.5h          │  ← PriceBadge + duration
│ 8 min from Vieux Port│  ← DistanceBadge (colored)
│                      │
│ [+ Add to Plan]      │  ← Full-width button
└──────────────────────┘
```

**Props:**
```typescript
interface SuggestionCardProps {
  card: PlanCard;
  nearestCluster?: { name: string; walkingMinutes: number };
  onAdd: () => void;
  isAdded: boolean;  // Show checkmark if in plan
}
```

**States:**
- Default: Normal display
- Hover: Border accent color, slight shadow
- Added: Muted styling, checkmark instead of add button

### 4. NearbySection

Only renders if user has clusters with items.

```typescript
interface NearbySectionProps {
  cards: PlanCard[];  // Pre-filtered to <10 min walk
  onAddCard: (card: PlanCard) => void;
  addedIds: Set<string>;
}
```

**Visual:**
- Horizontal scroll container
- Compact cards showing: name, type icon, walking time, add button
- "Within 10 min walk" subtitle

### 5. FilterBar

```typescript
interface FilterBarProps {
  priceFilter: number[] | null;  // [1,2] for € and €€
  sortBy: 'proximity' | 'rating' | 'price';
  onPriceChange: (levels: number[] | null) => void;
  onSortChange: (sort: 'proximity' | 'rating' | 'price') => void;
}
```

**Visual:**
```
[All] [€] [€€] [€€€] [€€€€]  |  Sort: [Nearby first ▼]
```

- Price buttons are toggleable (multi-select)
- "All" clears filter
- Sort dropdown: "Nearby first", "Highest rated", "Price: low to high"

### 6. DistanceBadge

```typescript
interface DistanceBadgeProps {
  minutes: number;
  fromName?: string;  // "from Vieux Port"
}
```

**Color coding:**
- `< 10 min`: Green (#4A7C59) - "3 min ↗"
- `10-20 min`: Yellow (#D4A853) - "15 min ↗"
- `> 20 min`: Red (#C45830) - "30 min ↗"

### 7. PriceBadge

```typescript
interface PriceBadgeProps {
  level: 1 | 2 | 3 | 4;
  estimate?: string;  // "€25-40"
}
```

Renders: € / €€ / €€€ / €€€€

---

## Backend Implementation

### cardGenerationService.js

Create `/server/services/cardGenerationService.js`:

```javascript
/**
 * Card Generation Service
 *
 * Uses Claude to generate place suggestions based on:
 * - City context
 * - User preferences
 * - Existing plan (for relevance)
 * - Filters (price, type, proximity)
 */

const Anthropic = require('@anthropic-ai/sdk');

// Core function
async function generateCards(request, preferences) {
  // 1. Build prompt from request
  // 2. Call Claude with structured output
  // 3. Parse and validate response
  // 4. Return PlanCard[]
}

// Proximity enrichment
function enrichWithProximity(cards, clusters) {
  // Calculate nearest cluster for each card
  // Return cards with proximity data
}

// Haversine distance calculation
function calculateWalkingMinutes(from, to) {
  // ~5 km/h walking, 20% overhead for paths
}

module.exports = { generateCards, enrichWithProximity, calculateWalkingMinutes };
```

**Generation Prompt Template (for restaurants):**

```
Generate ${count} restaurant recommendations for ${city} for a ${travelerType} trip.

## User Context
- Traveler type: ${travelerType}
- Preferences: ${preferences}
- Budget: ${priceRange}

## Current Plan Context
- Areas they're visiting: ${clusterNames}
- Restaurants already in plan: ${existingRestaurants}

## Requirements
1. ${count} unique restaurants, not duplicating: ${excludeNames}
2. Mix of cuisines, price points, vibes
3. At least 2 within 10-min walk of their clusters
4. Focus on where locals eat, not tourist traps
5. Accurate coordinates for ${city}

## Output Format
Return JSON array:
[
  {
    "id": "rest-${timestamp}-${random}",
    "type": "restaurant",
    "name": "...",
    "description": "1-2 sentences",
    "whyGreat": "Why this matches their trip",
    "location": { "lat": ..., "lng": ..., "address": "...", "area": "..." },
    "duration": 90,
    "priceLevel": 2,
    "priceEstimate": "€25-35 per person",
    "bestTime": "dinner",
    "tags": ["seafood", "romantic"]
  }
]
```

### Update planning.js routes

Implement the `/generate` endpoint:

```javascript
// POST /api/planning/:routeId/generate
router.post('/:routeId/generate', async (req, res) => {
  const { cityId, type, count = 10, filters, excludeIds } = req.body;

  // 1. Load route and preferences
  // 2. Load existing plan for context
  // 3. Call cardGenerationService.generateCards()
  // 4. Enrich with proximity if clusters exist
  // 5. Return { cards, hasMore: true }
});
```

---

## Store Updates

Update `planningStore.ts` to handle suggestions:

```typescript
// Add to state
suggestions: Record<string, Record<string, PlanCard[]>>;  // [cityId][type] = cards[]
isGenerating: Record<string, boolean>;  // [type] = loading

// Add action
generateSuggestions: async (type: string, count?: number) => {
  // Set isGenerating[type] = true
  // Call /api/planning/:routeId/generate
  // Append results to suggestions[cityId][type]
  // Set isGenerating[type] = false
};
```

---

## Design Guidelines

### Colors (from spec)
```css
--planning-bg: #FAF7F2;
--planning-card-bg: #FFFBF5;
--planning-text-primary: #2C2417;
--planning-text-secondary: #8B7355;
--planning-text-muted: #C4B8A5;
--planning-accent: #C45830;
--planning-accent-light: #FEF3EE;
--planning-success: #4A7C59;
--planning-warning: #D4A853;
--planning-border: #E5DDD0;
```

### Typography
- Headings: `font-family: 'Fraunces', serif`
- Body: `font-family: 'Satoshi', sans-serif`
- Card titles: Satoshi 600, 16px
- Descriptions: Satoshi 400, 14px
- Meta/badges: Satoshi 500, 12px

### Card Styling
```css
.suggestion-card {
  background: #FFFBF5;
  border: 1px solid #E5DDD0;
  border-radius: 0.75rem;
  padding: 0.75rem;
  transition: all 0.2s ease;
}

.suggestion-card:hover {
  border-color: #C45830;
  box-shadow: 0 4px 12px rgba(44, 36, 23, 0.08);
}
```

---

## Deliverable Checklist

When complete, user should be able to:

- [ ] See 4 initial suggestions per category on page load
- [ ] Click "Show 10 more" to generate additional cards
- [ ] See proximity badges showing distance from their clusters
- [ ] Filter by price level (€ to €€€€)
- [ ] Sort by proximity, rating, or price
- [ ] See "Near Your Picks" section when they have clusters
- [ ] Click "Surprise me" to get random suggestions
- [ ] Add cards to their plan (integrates with Phase 1 clusters)

---

## Files to Create/Modify

**Create (9 files):**
1. `spotlight-react/src/components/planning/discover/DiscoverPanel.tsx` (replace placeholder)
2. `spotlight-react/src/components/planning/discover/CategorySection.tsx`
3. `spotlight-react/src/components/planning/discover/SuggestionCard.tsx`
4. `spotlight-react/src/components/planning/discover/NearbySection.tsx`
5. `spotlight-react/src/components/planning/discover/FilterBar.tsx`
6. `spotlight-react/src/components/planning/shared/DistanceBadge.tsx`
7. `spotlight-react/src/components/planning/shared/PriceBadge.tsx`
8. `server/services/cardGenerationService.js`

**Modify (3 files):**
9. `server/routes/planning.js` - Implement /generate endpoint
10. `spotlight-react/src/stores/planningStore.ts` - Add suggestions state/actions
11. `spotlight-react/src/types/planning.ts` - Add any missing types

---

## Execution Order

1. Read spec sections listed above
2. Create shared components (DistanceBadge, PriceBadge)
3. Create backend cardGenerationService.js
4. Update planning.js routes with /generate endpoint
5. Update planningStore with suggestions state
6. Create SuggestionCard component
7. Create CategorySection component
8. Create FilterBar component
9. Create NearbySection component
10. Replace DiscoverPanel placeholder with full implementation
11. Run `npm run build` to verify no errors
12. Test the full flow

DO NOT STOP until all items are complete and build passes.
