# Planning Page UX Redesign

## Executive Summary

Transform the planning page from a manual cluster-management interface into an intuitive "browse and add" experience where users simply pick what they like, and the system handles all organization automatically.

**Core Principle**: User = Curator, System = Organizer

---

## What Already Exists (DO NOT DUPLICATE)

### Frontend Components
| Component | Location | Status | Reuse? |
|-----------|----------|--------|--------|
| `PlanningPage.tsx` | `pages/` | Working | **MODIFY** - Remove cluster-first UX |
| `PlanningLayout.tsx` | `components/planning/` | Working | **KEEP** - Two-panel layout is good |
| `CityTabs.tsx` | `components/planning/` | Working | **KEEP** - City navigation works |
| `YourPlan.tsx` | `components/planning/plan/` | Working | **MODIFY** - Show auto-organized plan |
| `ClusterCard.tsx` | `components/planning/plan/` | Working | **MODIFY** - Rename to "AreaCard" |
| `PlanItem.tsx` | `components/planning/plan/` | Working | **KEEP** - Item display is good |
| `CreateClusterModal.tsx` | `components/planning/plan/` | Working | **REMOVE** - No manual creation |
| `EmptyClusterSuggestion.tsx` | `components/planning/plan/` | Working | **REMOVE** - No empty states |
| `DiscoverPanel.tsx` | `components/planning/discover/` | Working | **MODIFY** - New tab structure |
| `SuggestionCard.tsx` | `components/planning/discover/` | Working | **MODIFY** - Add images, simplify add |
| `CategorySection.tsx` | `components/planning/discover/` | Working | **MODIFY** - Rename categories |
| `FilterBar.tsx` | `components/planning/discover/` | Working | **KEEP** - Filters are useful |
| `NearbySection.tsx` | `components/planning/discover/` | Working | **REMOVE** - Merged into main flow |
| `CompanionPanel.tsx` | `components/planning/companion/` | Working | **MODIFY** - Make inline tips |
| `CompanionMessage.tsx` | `components/planning/companion/` | Working | **KEEP** - Reuse for tips |
| Shared components | `components/planning/shared/` | Working | **KEEP** - All utilities |

### Backend Services
| Service | Location | Status | Reuse? |
|---------|----------|--------|--------|
| `planning.js` routes | `server/routes/` | Working | **MODIFY** - Add auto-cluster endpoint |
| `cardGenerationService.js` | `server/services/` | Working | **MODIFY** - Add image fetching |
| `planningAgent.js` | `server/agents/` | Working | **KEEP** - Companion logic |

### Store & Types
| File | Status | Reuse? |
|------|--------|--------|
| `planningStore.ts` | Working | **MODIFY** - Add auto-cluster action |
| `planning.ts` (types) | Working | **MODIFY** - Add Hotel type support |

### Database Tables
| Table | Status | Reuse? |
|-------|--------|--------|
| `planning_routes` | Working | **KEEP** |
| `trip_plans` | Working | **KEEP** |
| `city_plans` | Working | **KEEP** |
| `plan_clusters` | Working | **KEEP** |
| `plan_items` | Working | **KEEP** |

---

## Changes Required

### Phase 1: Critical Fixes (Immediate)

#### 1.1 Add Images to Cards
**Problem**: Cards show placeholder icons instead of real photos.

**Files to modify**:
- `server/services/cardGenerationService.js`
- `spotlight-react/src/components/planning/discover/SuggestionCard.tsx`

**Implementation**:
```javascript
// cardGenerationService.js - Add after card generation
async function enrichWithImages(cards, cityName) {
  const enriched = await Promise.all(cards.map(async (card) => {
    // Try Google Places photo
    const photoUrl = await fetchGooglePlacePhoto(card.name, cityName);
    if (photoUrl) {
      return { ...card, imageUrl: photoUrl };
    }
    // Fallback to Unsplash
    const unsplashUrl = await fetchUnsplashImage(`${cityName} ${card.type}`);
    return { ...card, imageUrl: unsplashUrl || null };
  }));
  return enriched;
}
```

**New file needed**: `server/services/imageService.js`
- Google Places Photo API integration
- Unsplash API fallback
- Image caching (store URLs in database)

#### 1.2 Fix Distance Calculation Bug
**Problem**: Showing "1369h 58m" instead of reasonable walking times.

**Root cause**: The `DistanceBadge` component is receiving distance in **meters** but treating it as **minutes**.

**Files to modify**:
- `server/services/cardGenerationService.js` - Verify `calculateWalkingMinutes()` returns minutes
- `spotlight-react/src/components/planning/shared/DistanceBadge.tsx` - Add input validation

**Fix**:
```typescript
// DistanceBadge.tsx - Add validation
export function DistanceBadge({ minutes, fromName, compact = false }: DistanceBadgeProps) {
  // Sanity check - walking time should never exceed 24 hours
  const validMinutes = Math.min(minutes, 1440);
  if (minutes > 1440) {
    console.warn('[DistanceBadge] Received unrealistic minutes:', minutes);
  }
  // ... rest of component
}
```

#### 1.3 Remove Manual Cluster Creation UI
**Problem**: Users shouldn't have to create and name areas manually.

**Files to modify**:
- `spotlight-react/src/components/planning/plan/YourPlan.tsx`
  - Remove "Create your first area" welcome state
  - Remove "Create new area" button
  - Remove `CreateClusterModal` usage
- `spotlight-react/src/components/planning/discover/SuggestionCard.tsx`
  - Remove `ClusterSelectorDropdown`
  - Replace with simple "Add to Plan" button
- `spotlight-react/src/components/planning/discover/DiscoverPanel.tsx`
  - Remove `handleOpenCreateModal` callback
  - Simplify `handleAddCard` to not require clusterId

**DO NOT DELETE**:
- `CreateClusterModal.tsx` - Keep for potential power-user feature later
- `ClusterSelectorDropdown.tsx` - Keep for drag-and-drop between areas later

---

### Phase 2: New Browse Experience

#### 2.1 Restructure Browse Panel with Three Tabs
**Current**: Categories for restaurant, activity, photo_spot, bar
**New**: Three clear tabs: Activities, Restaurants, Hotels

**Files to modify**:
- `spotlight-react/src/components/planning/discover/DiscoverPanel.tsx`

**New structure**:
```tsx
// DiscoverPanel.tsx - New tab structure
const tabs = [
  { id: 'activities', label: 'Activities', icon: Compass },
  { id: 'restaurants', label: 'Restaurants', icon: Utensils },
  { id: 'hotels', label: 'Hotel', icon: Bed },
];

// Activities = activity + photo_spot + experience (merged)
// Restaurants = restaurant + bar + cafe (merged)
// Hotels = hotel (single selection per city)
```

**Type consolidation** (in `planning.ts`):
```typescript
// Group types for UI purposes
export const ACTIVITY_TYPES: PlanCardType[] = ['activity', 'photo_spot', 'experience'];
export const RESTAURANT_TYPES: PlanCardType[] = ['restaurant', 'bar', 'cafe'];
export const HOTEL_TYPES: PlanCardType[] = ['hotel'];
```

#### 2.2 Redesign SuggestionCard for Images
**Current**: Small cards with icon placeholders
**New**: Large cards with full-bleed images

**Files to modify**:
- `spotlight-react/src/components/planning/discover/SuggestionCard.tsx`

**Key changes**:
- Larger image area (aspect-ratio 3:2 instead of 16:10)
- Image always required (show loading skeleton until fetched)
- Simplified bottom section (name, price, duration, one-tap add)
- Remove cluster selector dropdown

**New card structure**:
```
┌─────────────────────────────────┐
│                                 │
│     [FULL IMAGE - 3:2 ratio]   │
│                                 │
│  [Type Badge]                   │
├─────────────────────────────────┤
│  Restaurant Name                │
│  Description text here...       │
│  €€ · ~1.5h · Dinner           │
│                                 │
│  [ + Add to Plan ]              │
└─────────────────────────────────┘
```

#### 2.3 One-Tap Add Flow
**Current**: Click add → Choose cluster from dropdown → Confirm
**New**: Click add → Done (system auto-places)

**Files to modify**:
- `spotlight-react/src/stores/planningStore.ts` - Add `addItemAutoClustered` action
- `spotlight-react/src/components/planning/discover/SuggestionCard.tsx` - Simplify onAdd

**New store action**:
```typescript
// planningStore.ts
addItemAutoClustered: (cityId: string, card: PlanCard) => {
  const { cityPlans } = get();
  const cityPlan = cityPlans[cityId];
  if (!cityPlan) return;

  // Find or create appropriate cluster
  const clusterId = findOrCreateClusterForItem(cityPlan, card);

  // Add item to cluster
  get().addItemToCluster(cityId, clusterId, card);
}
```

---

### Phase 3: Auto-Organization Algorithm

#### 3.1 Auto-Clustering Logic
**When user adds an item**, system determines which cluster it belongs to:

**Files to create**:
- `spotlight-react/src/utils/autoClustering.ts`

**Algorithm**:
```typescript
// autoClustering.ts
const MAX_WALKING_MINUTES = 15; // Items within 15 min = same cluster

export function findOrCreateCluster(
  cityPlan: CityPlan,
  newItem: PlanCard,
  cityCenter: LatLng
): { clusterId: string; isNew: boolean } {

  // 1. Check existing clusters
  for (const cluster of cityPlan.clusters) {
    const walkingTime = calculateWalkingMinutes(newItem.location, cluster.center);
    if (walkingTime <= MAX_WALKING_MINUTES) {
      return { clusterId: cluster.id, isNew: false };
    }
  }

  // 2. No nearby cluster - create new one
  const areaName = getNeighborhoodName(newItem.location) || newItem.location.area || 'New Area';
  const newClusterId = createCluster(cityPlan.cityId, areaName, newItem.location);

  return { clusterId: newClusterId, isNew: true };
}

// Get neighborhood name from coordinates (reverse geocoding)
async function getNeighborhoodName(location: LatLng): Promise<string> {
  // Use Mapbox reverse geocoding or Google Geocoding API
  // Return neighborhood/district name
}
```

#### 3.2 Backend Auto-Cluster Endpoint
**Files to modify**:
- `server/routes/planning.js` - Add new endpoint

```javascript
// planning.js
/**
 * POST /api/planning/:routeId/add-item
 * Add item and auto-assign to cluster
 */
router.post('/:routeId/add-item', async (req, res) => {
  const { routeId } = req.params;
  const { cityId, card } = req.body;

  // Load existing clusters
  const clusters = await loadClustersForCity(routeId, cityId);

  // Find or create cluster
  const targetCluster = findOrCreateCluster(clusters, card);

  // Add item to cluster
  await addItemToCluster(targetCluster.id, card);

  // Return updated plan
  res.json({
    clusterId: targetCluster.id,
    clusterName: targetCluster.name,
    isNewCluster: targetCluster.isNew,
  });
});
```

#### 3.3 Restaurant Placement Near Activities
**Logic**: When user adds a restaurant, place it near their activity clusters.

```typescript
// For restaurants, find the cluster with most activities
function findBestClusterForRestaurant(
  cityPlan: CityPlan,
  restaurant: PlanCard
): string {
  // Sort clusters by activity count (restaurants should be near activities)
  const sortedClusters = [...cityPlan.clusters].sort((a, b) => {
    const aActivities = a.items.filter(i => ACTIVITY_TYPES.includes(i.type)).length;
    const bActivities = b.items.filter(i => ACTIVITY_TYPES.includes(i.type)).length;
    return bActivities - aActivities;
  });

  // Find closest cluster with activities
  for (const cluster of sortedClusters) {
    const walkingTime = calculateWalkingMinutes(restaurant.location, cluster.center);
    if (walkingTime <= MAX_WALKING_MINUTES) {
      return cluster.id;
    }
  }

  // No nearby cluster with activities - create new
  return createNewCluster(restaurant.location);
}
```

---

### Phase 4: Hotel Logic

#### 4.1 Hotel Tab Behavior
**Different from Activities/Restaurants**:
- Only ONE hotel per city (typically)
- Should recommend based on activity locations
- Show "Best location for your activities" section

**Files to create**:
- `spotlight-react/src/components/planning/discover/HotelSection.tsx`

**Implementation**:
```tsx
// HotelSection.tsx
function HotelSection({ cityId, clusters, currentHotel }) {
  // Calculate optimal area based on activity clusters
  const optimalArea = calculateOptimalHotelArea(clusters);

  return (
    <div>
      {/* Current hotel if selected */}
      {currentHotel && (
        <SelectedHotelCard hotel={currentHotel} onRemove={...} />
      )}

      {/* Recommendation */}
      <div className="recommendation-banner">
        <p>Based on your activities, we recommend staying in <strong>{optimalArea}</strong></p>
      </div>

      {/* Hotel suggestions */}
      <div className="hotel-grid">
        {hotelSuggestions.map(hotel => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            onSelect={() => selectHotel(hotel)}
            isOptimalLocation={isInOptimalArea(hotel, optimalArea)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 4.2 Optimal Hotel Location Algorithm
```typescript
// Calculate where user should stay based on their activities
function calculateOptimalHotelArea(clusters: Cluster[]): LatLng {
  if (clusters.length === 0) return cityCenter;

  // Weight by number of items and total duration
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;

  for (const cluster of clusters) {
    const weight = cluster.items.length + (cluster.totalDuration / 60);
    totalWeight += weight;
    weightedLat += cluster.center.lat * weight;
    weightedLng += cluster.center.lng * weight;
  }

  return {
    lat: weightedLat / totalWeight,
    lng: weightedLng / totalWeight,
  };
}
```

---

### Phase 5: Inline Companion Tips

#### 5.1 Replace Companion Panel with Inline Tips
**Current**: Separate expandable panel on the right
**New**: Contextual tips that appear inline in the plan

**Files to modify**:
- `spotlight-react/src/components/planning/plan/YourPlan.tsx` - Add tip slots
- `spotlight-react/src/components/planning/PlanningLayout.tsx` - Remove companion panel

**Tip types**:
```typescript
type CompanionTip = {
  id: string;
  type: 'cluster_complete' | 'far_item' | 'missing_meal' | 'too_packed' | 'hotel_suggestion';
  message: string;
  action?: { label: string; handler: () => void };
  dismissible: boolean;
};
```

**Example tips**:
- `cluster_complete`: "These 3 spots make a perfect morning!"
- `far_item`: "This is 25 min from your other spots. Want alternatives?"
- `missing_meal`: "No lunch near Vieux Lyon yet. See suggestions?"
- `too_packed`: "8h of activities for 1 night - want to prioritize?"
- `hotel_suggestion`: "Your hotel is far from most activities. Consider Old Town?"

#### 5.2 Tip Trigger Logic
**Files to create**:
- `spotlight-react/src/hooks/useCompanionTips.ts`

```typescript
// useCompanionTips.ts
export function useCompanionTips(cityPlan: CityPlan): CompanionTip[] {
  return useMemo(() => {
    const tips: CompanionTip[] = [];

    // Check each cluster
    for (const cluster of cityPlan.clusters) {
      // Tip: Cluster looks complete
      if (cluster.items.length >= 3 && cluster.totalDuration >= 180) {
        tips.push({
          type: 'cluster_complete',
          message: `${cluster.name} looks ready! ${cluster.items.length} spots, ~${Math.round(cluster.totalDuration/60)}h`,
        });
      }

      // Tip: Missing meal
      const hasRestaurant = cluster.items.some(i => RESTAURANT_TYPES.includes(i.type));
      const hasActivities = cluster.items.some(i => ACTIVITY_TYPES.includes(i.type));
      if (hasActivities && !hasRestaurant && cluster.totalDuration >= 180) {
        tips.push({
          type: 'missing_meal',
          message: `You'll need a meal near ${cluster.name}`,
          action: { label: 'See restaurants', handler: () => scrollToRestaurants() },
        });
      }
    }

    // Check hotel location
    if (cityPlan.hotel) {
      const optimalArea = calculateOptimalHotelArea(cityPlan.clusters);
      const hotelDistance = calculateWalkingMinutes(cityPlan.hotel.location, optimalArea);
      if (hotelDistance > 20) {
        tips.push({
          type: 'hotel_suggestion',
          message: `Your hotel is ${hotelDistance} min from most activities`,
        });
      }
    }

    return tips;
  }, [cityPlan]);
}
```

---

### Phase 6: Polish & UX

#### 6.1 Empty State Redesign
**Current**: "Start building your trip" with button
**New**: Immediately show suggestions, encourage browsing

**Files to modify**:
- `spotlight-react/src/components/planning/plan/YourPlan.tsx`

**New empty state**:
```
┌────────────────────────────────────┐
│                                    │
│  Your Plan for Lyon                │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ 🎯 Browse activities on the  │ │
│  │    right and tap + to add    │ │
│  │                              │ │
│  │ We'll organize everything    │ │
│  │ by area automatically.       │ │
│  └──────────────────────────────┘ │
│                                    │
└────────────────────────────────────┘
```

#### 6.2 Add Animation When Item Added
**Files to modify**:
- `spotlight-react/src/components/planning/plan/ClusterCard.tsx`

**Animation**: When new item added, cluster briefly highlights and item slides in.

#### 6.3 Smart Ordering Within Clusters
**Files to modify**:
- `spotlight-react/src/utils/autoClustering.ts`

**Logic**: Order items within cluster by optimal visiting sequence:
1. Outdoor activities → Morning
2. Indoor activities → Midday (or rain backup)
3. Restaurants → Meal times
4. Bars → Evening

---

## Implementation Order

### Sprint 1: Foundation (Days 1-3)
1. **Fix distance bug** (30 min)
2. **Add image service** (2-3 hours)
   - Create `imageService.js`
   - Integrate Google Places Photo API
   - Add Unsplash fallback
3. **Modify card generation** to include images (1 hour)
4. **Update SuggestionCard** to display images (1 hour)

### Sprint 2: Simplify Add Flow (Days 4-5)
1. **Remove ClusterSelectorDropdown** from SuggestionCard (30 min)
2. **Create auto-clustering utility** (2 hours)
3. **Add `addItemAutoClustered` action** to store (1 hour)
4. **Update DiscoverPanel** to use simplified add (1 hour)
5. **Remove CreateClusterModal** usage from YourPlan (30 min)

### Sprint 3: Browse Restructure (Days 6-7)
1. **Add three-tab structure** to DiscoverPanel (2 hours)
2. **Create HotelSection** component (2 hours)
3. **Add optimal hotel location logic** (1 hour)
4. **Update empty states** (1 hour)

### Sprint 4: Inline Companion (Days 8-9)
1. **Create useCompanionTips hook** (2 hours)
2. **Add inline tip component** (1 hour)
3. **Integrate tips into YourPlan** (1 hour)
4. **Remove/hide CompanionPanel** from layout (30 min)

### Sprint 5: Polish (Days 10-11)
1. **Add item animations** (1 hour)
2. **Smart ordering within clusters** (2 hours)
3. **Testing and bug fixes** (3-4 hours)

---

## API Keys Required

1. **Google Places API** - For place photos
   - Enable "Places API" in Google Cloud Console
   - Add key to `.env`: `GOOGLE_PLACES_API_KEY=xxx`

2. **Unsplash API** (fallback) - For generic images
   - Register at unsplash.com/developers
   - Add key to `.env`: `UNSPLASH_ACCESS_KEY=xxx`

---

## Files Summary

### Files to CREATE
| File | Purpose |
|------|---------|
| `server/services/imageService.js` | Google Places + Unsplash image fetching |
| `spotlight-react/src/utils/autoClustering.ts` | Auto-cluster algorithm |
| `spotlight-react/src/hooks/useCompanionTips.ts` | Inline tip generation |
| `spotlight-react/src/components/planning/discover/HotelSection.tsx` | Hotel tab content |
| `spotlight-react/src/components/planning/shared/InlineTip.tsx` | Tip display component |

### Files to MODIFY
| File | Changes |
|------|---------|
| `server/services/cardGenerationService.js` | Add image enrichment |
| `server/routes/planning.js` | Add `/add-item` endpoint |
| `spotlight-react/src/stores/planningStore.ts` | Add `addItemAutoClustered` |
| `spotlight-react/src/types/planning.ts` | Add type groupings |
| `spotlight-react/src/components/planning/discover/DiscoverPanel.tsx` | Three tabs structure |
| `spotlight-react/src/components/planning/discover/SuggestionCard.tsx` | Images + simplified add |
| `spotlight-react/src/components/planning/plan/YourPlan.tsx` | Remove manual creation, add tips |
| `spotlight-react/src/components/planning/PlanningLayout.tsx` | Remove companion panel |
| `spotlight-react/src/components/planning/shared/DistanceBadge.tsx` | Input validation |

### Files to KEEP (no changes)
- `CityTabs.tsx`
- `PlanItem.tsx`
- `FilterBar.tsx`
- `PriceBadge.tsx`
- `CompanionMessage.tsx`
- `planningAgent.js`
- All database tables

### Files to DEPRECATE (keep but don't use)
- `CreateClusterModal.tsx` - May reintroduce as power feature
- `ClusterSelectorDropdown.tsx` - May use for drag-drop later
- `EmptyClusterSuggestion.tsx` - No longer needed
- `NearbySection.tsx` - Merged into main flow
- `CompanionPanel.tsx` - Replaced by inline tips

---

## Success Metrics

After implementation:
1. **Zero manual cluster creation** - User never creates an area
2. **100% cards have images** - No placeholder icons
3. **One-tap add** - No dropdown, no modal, just add
4. **Accurate distances** - All times under 24h and make sense
5. **Contextual tips** - Companion helps inline, not in panel

---

## Questions to Resolve Before Starting

1. **Google Places API quota** - Do we have budget for photo requests?
2. **Reverse geocoding** - Mapbox or Google for neighborhood names?
3. **Hotel selection** - One per city or allow multiple options?
4. **Companion tips** - How many to show at once? (Suggest: max 2)
