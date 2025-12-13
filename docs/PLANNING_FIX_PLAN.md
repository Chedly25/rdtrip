# Planning Feature Fix Plan

## Executive Summary

Three critical issues with the current planning feature:
1. **No images** - Cards are empty and unappealing
2. **Wrong organization** - "Historic Center" clusters don't match how tourists think
3. **Wrong activities** - Generic workshops instead of actual landmarks

**Solution:** Day-based organization + landmark-first content + working images

---

## Phase 0: Diagnosis (Before Any Code Changes)

### 0.1 Check Image Service Status
```bash
# Check if API keys are configured
heroku config | grep -E "(GOOGLE|UNSPLASH)"

# Check recent logs for image errors
heroku logs --tail | grep -i "image"
```

**Expected findings:**
- Missing `GOOGLE_PLACES_API_KEY` or `UNSPLASH_ACCESS_KEY`
- Wikipedia fallback may be silently failing

### 0.2 Test Current Activity Prompt
Manually test what Claude generates for "Antwerp activities" with the current prompt to understand baseline behavior.

### 0.3 Verify Data Flow
Confirm that `imageUrl` is actually being passed from backend → frontend → component render.

---

## Phase 1: Fix Activity Quality (Highest Impact)

### 1.1 Rewrite Activity Prompt

**Current problem:** Prompt asks for "authentic experiences" and "things not in guidebooks" which generates filler content.

**New philosophy:**
```
TOURISTS VISITING [CITY] WANT TO SEE WHAT IT'S FAMOUS FOR.

Priority hierarchy:
1. ICONIC LANDMARKS (50%) - The postcard shots, the bucket list items
2. MAJOR MUSEUMS & CULTURAL SITES (25%) - World-class collections, UNESCO sites
3. GENUINE LOCAL GEMS (25%) - Only if truly special to this city

NEVER SUGGEST:
- Generic workshops (pottery, photography, cooking unless city-famous)
- "Hidden courtyard hunts" or scavenger-type activities
- Things you could do in any city
- Airbnb Experience-style filler content
```

**Files to modify:**
- `server/services/cardGenerationService.js` → `buildActivityPrompt()`
- `server/services/cardGenerationService.js` → `buildPhotoSpotPrompt()`

### 1.2 Rewrite Photo Spot Prompt

Focus on:
- Instagram-worthy locations
- Iconic viewpoints
- Actual places (not "photography walks")

---

## Phase 2: Day-Based Organization

### 2.1 Conceptual Model

**Current model:** Geographic clusters (items near each other)
**New model:** Day-based clusters (Day 1, Day 2, Day 3...)

For a trip with N nights:
- Create N day clusters
- Day 1 = First full day in city
- Day N = Last day (may be partial)

Example for 2-night Antwerp trip:
```
Day 1: Grote Markt, Cathedral, Rubens House, Dinner at local spot
Day 2: MAS Museum, Diamond District, Departure
```

### 2.2 Backend Changes

**File: `server/routes/planning.js`**

Change `generateSuggestedClusters()`:
```javascript
function generateSuggestedClusters(city) {
  const nights = city.nights || 2;
  const cityName = city.name || 'City';

  const suggestions = [];
  for (let i = 1; i <= nights; i++) {
    suggestions.push({
      id: generateId(`day-${i}`),
      name: `Day ${i}`,
      description: i === 1
        ? `Your first day exploring ${cityName}`
        : i === nights
          ? `Final day in ${cityName}`
          : `Day ${i} in ${cityName}`,
      dayNumber: i,
    });
  }
  return suggestions;
}
```

**File: `server/services/planningService.js`**
Same change to `generateSuggestedClusters()`.

### 2.3 Frontend Changes

**File: `spotlight-react/src/utils/autoClustering.ts`**

Change `findBestClusterForItem()` logic:
- Instead of geographic proximity, use **load balancing**
- Add items to the day with fewest items
- Consider item type: activities → earlier days, dinners → distributed

```typescript
function findBestClusterForItem(cityPlan, newItem) {
  const { clusters } = cityPlan;

  if (clusters.length === 0) {
    return { clusterId: null, shouldCreateNew: true, suggestedName: 'Day 1' };
  }

  // Find cluster with fewest items (load balance across days)
  const sortedByLoad = [...clusters].sort((a, b) =>
    a.items.length - b.items.length
  );

  return {
    clusterId: sortedByLoad[0].id,
    shouldCreateNew: false,
    suggestedName: ''
  };
}
```

### 2.4 UI Updates

**File: `spotlight-react/src/components/planning/plan/ClusterCard.tsx`**

- Change cluster icon from MapPin to Calendar
- Update styling to feel like "day cards"
- Consider showing estimated total time for the day

---

## Phase 3: Fix Images

### 3.1 Verify API Keys on Heroku

```bash
# Check current config
heroku config

# If missing, add keys (you'll need to get these)
heroku config:set GOOGLE_PLACES_API_KEY=xxx
heroku config:set UNSPLASH_ACCESS_KEY=xxx
```

### 3.2 Improve Wikipedia Fallback

The Wikipedia fallback should work without API keys. If it's failing:
- Check if place names are too specific
- Try searching with just landmark name (without city)
- Add logging to understand failures

**File: `server/services/imageService.js`**

```javascript
async fetchWikipediaImage(searchTerm, cityName = '') {
  // Try multiple search strategies
  const searches = [
    searchTerm,                           // "Grote Markt"
    `${searchTerm} ${cityName}`,          // "Grote Markt Antwerp"
    searchTerm.split(' ')[0],             // "Grote" (first word)
  ];

  for (const search of searches) {
    const result = await this.tryWikipediaSearch(search);
    if (result) return result;
  }
  return null;
}
```

### 3.3 Add Fallback Placeholder

If all image sources fail, show a styled placeholder with:
- Type-appropriate icon (landmark icon for activities, utensils for restaurants)
- Gradient background based on card type
- This is already partially implemented in `SuggestionCard.tsx`

---

## Phase 4: Data Migration (If Needed)

Existing plans have "Historic Center" clusters. Options:
1. **Leave them** - Old plans keep old structure
2. **Auto-migrate** - Rename to "Day 1" on next load
3. **Fresh start** - Clear planning data (nuclear option)

**Recommendation:** Option 1 (leave existing), new plans get day-based.

---

## Implementation Order

```
1. Phase 0: Diagnosis (30 min)
   - Check Heroku config for API keys
   - Check logs for image errors
   - Test activity prompt manually

2. Phase 1: Activity Quality (1 hour)
   - Rewrite buildActivityPrompt()
   - Rewrite buildPhotoSpotPrompt()
   - Test with real city

3. Phase 3: Images (30 min)
   - Add missing API keys OR
   - Improve Wikipedia fallback
   - Verify images appear

4. Phase 2: Day-Based Organization (1.5 hours)
   - Backend: generateSuggestedClusters()
   - Frontend: findBestClusterForItem()
   - UI: Update ClusterCard appearance

5. Testing & Deploy (30 min)
   - Test full flow
   - Push to Heroku
   - Verify in production
```

---

## Success Criteria

After implementation:
- [ ] Activities are real landmarks (Grote Markt, not "pottery workshop")
- [ ] Cards have images (Wikipedia fallback at minimum)
- [ ] Clusters are "Day 1", "Day 2", not "Historic Center"
- [ ] Adding items distributes them across days
- [ ] UI feels like planning a trip day-by-day

---

## Open Questions

1. **Should days have time sub-sections?** (Morning/Afternoon/Evening within each day)
   - Adds complexity but better organization
   - Could be Phase 2 enhancement

2. **What happens with 1-night trips?**
   - Just "Day 1" cluster
   - Or split into "Arrival Day" / "Departure Day"?

3. **Should we show total estimated time per day?**
   - Help users not over-pack days
   - Already have duration data on items
