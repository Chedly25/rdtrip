# Unified Agentic Workflow Plan

## Current State Analysis

### What Exists Now
1. **4 Agent Types**: Adventure, Culture, Food, Hidden Gems
2. **Parallel Route Generation**: Each agent generates a separate route based on its "personality"
3. **User Comparison**: User gets 4 different routes to compare and choose from
4. **Simple Form**: Origin, destination, nights, pace, budget, agent selection (checkboxes)

### How It Works (server.js:1935-1963)
```javascript
// Current flow: Loop through each selected agent
for (let i = 0; i < selectedAgents.length; i++) {
  const agentType = selectedAgents[i]; // 'adventure', 'culture', etc.
  const result = await routeAgent.discoverRoute(
    origin.name,
    destination.name,
    routePlan.numCities,
    agentType,  // <-- Agent type determines prompt/personality
    budget,
    totalNights
  );
  agentResults.push({ style: agentType, ...result });
}
```

---

## New Vision: Unified Intelligent Workflow

### Core Philosophy
Instead of 4 "specialist" agents generating 4 routes, ONE sophisticated agentic workflow that:
- Deeply understands user preferences (gathered via enhanced form)
- Researches the corridor between origin and destination
- Discovers optimal stops based on ALL preferences (not just one theme)
- Creates ONE highly personalized route
- Validates and optimizes the final result

---

## Phase 1: Enhanced Form Design

### Current Form Fields
- Origin (city selector)
- Destination (city selector)
- Trip duration (nights slider)
- Trip pace (leisurely/balanced/fast-paced)
- Budget (budget/moderate/comfort/luxury)
- Agent selection (adventure/culture/food/hidden-gems checkboxes)

### New Form Fields (Replace Agent Selector)

#### 1. Travel Companions
```typescript
type TravelCompanion =
  | 'solo'
  | 'couple'
  | 'family-young-kids'  // Under 10
  | 'family-teens'
  | 'friends'
  | 'group'
```
**Why**: Family with young kids needs different stops than a couple looking for romantic getaways.

#### 2. Interest Tags (Multi-select, Weighted)
Instead of 4 broad categories, granular interests:
```typescript
interface Interest {
  id: string
  label: string
  weight: number // 1-5, user can drag to prioritize
}

const availableInterests = [
  // Nature & Adventure
  { id: 'hiking', label: 'Hiking & Trails' },
  { id: 'beaches', label: 'Beaches & Coast' },
  { id: 'mountains', label: 'Mountains & Views' },
  { id: 'national-parks', label: 'National Parks' },
  { id: 'water-sports', label: 'Water Sports' },

  // Culture & History
  { id: 'museums', label: 'Museums' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'ancient-history', label: 'Ancient History' },
  { id: 'medieval', label: 'Medieval Towns' },
  { id: 'art-galleries', label: 'Art Galleries' },

  // Food & Drink
  { id: 'fine-dining', label: 'Fine Dining' },
  { id: 'local-cuisine', label: 'Local/Traditional Food' },
  { id: 'street-food', label: 'Street Food & Markets' },
  { id: 'wine', label: 'Wine & Vineyards' },
  { id: 'coffee-culture', label: 'Coffee Culture' },

  // Experience
  { id: 'nightlife', label: 'Nightlife & Bars' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'photography', label: 'Photography Spots' },
  { id: 'off-beaten-path', label: 'Off the Beaten Path' },
  { id: 'local-experiences', label: 'Local Experiences' }
]
```

#### 3. Trip Style Slider
```typescript
// Instead of 3 pace options, a spectrum slider
tripStyle: {
  relaxation: number,  // 0-100
  exploration: number  // 0-100 (inverse relationship)
}
// Relaxed trip = fewer stops, more time per place
// Exploration-focused = more stops, hit the highlights
```

#### 4. Constraints (Optional Section)
```typescript
interface TripConstraints {
  mustSeeLocations?: string[]       // "I must visit Cinque Terre"
  avoidLocations?: string[]         // "Skip Barcelona (been there)"
  dietaryRestrictions?: string[]    // vegetarian, vegan, halal, etc.
  accessibilityNeeds?: string[]     // wheelchair, limited mobility, etc.
  budgetDetails?: {
    accommodationPerNight: number   // Actual number, not just "comfort"
    dailySpend: number              // Expected daily spend
  }
}
```

#### 5. Trip Priorities (Drag to Rank)
Let user rank what matters most:
1. Scenic drives vs. efficient routes
2. Popular landmarks vs. hidden gems
3. Variety of experiences vs. depth in one area
4. Flexibility vs. detailed planning

---

## Phase 2: Unified Backend Workflow

### New Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UnifiedRouteAgent                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  RESEARCH   │───▶│  DISCOVERY  │───▶│  PLANNING   │     │
│  │   Phase     │    │    Phase    │    │    Phase    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Understand │    │   Find      │    │  Optimize   │     │
│  │  corridor   │    │   stops     │    │  route      │     │
│  │  geography  │    │   based on  │    │  order &    │     │
│  │  & options  │    │  preferences│    │  nights     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ ENRICHMENT  │───▶│ VALIDATION  │───▶│OPTIMIZATION │     │
│  │   Phase     │    │    Phase    │    │    Phase    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Add        │    │  Check      │    │  Final      │     │
│  │  activities │    │  feasibility│    │  refinement │     │
│  │  restaurants│    │  & quality  │    │  & scoring  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Phase Details

#### 1. Research Phase
**Purpose**: Understand what's possible between origin and destination
**Tools Used**: webSearch, getCityInfo
**Output**: Corridor analysis
```javascript
{
  corridorInsights: {
    majorRoutes: ["Coastal route via Nice", "Inland via Alps"],
    keyRegions: ["Provence", "French Riviera", "Liguria"],
    seasonalConsiderations: "Summer crowds in coastal areas",
    typicalDriveTimes: { total: "8h", perDay: "2-3h recommended" }
  }
}
```

#### 2. Discovery Phase
**Purpose**: Find candidate stops based on ALL user preferences
**Tools Used**: webSearch with tailored queries, searchActivities, Google Places
**Key Difference**: Instead of "find adventure cities" or "find food cities", uses weighted combination:
```javascript
// Old approach (one agent)
prompt = "Find cities for ADVENTURE between Lyon and Barcelona"

// New approach (unified)
prompt = `Find cities between Lyon and Barcelona that offer:
- Primary interests (weight 5): hiking, wine, medieval towns
- Secondary interests (weight 3): local cuisine, photography
- For: couple traveling
- Constraints: skip Marseille
- Style: 60% relaxation, 40% exploration`
```

#### 3. Planning Phase
**Purpose**: Create optimal route structure
**Tools Used**: Mapbox Directions, route optimization algorithms
**Output**:
```javascript
{
  route: [
    { city: "Lyon", nights: 1, type: "origin" },
    { city: "Avignon", nights: 2, matchScore: 0.85 },
    { city: "Aix-en-Provence", nights: 2, matchScore: 0.92 },
    { city: "Barcelona", nights: 3, type: "destination" }
  ],
  reasoning: "Avignon selected for medieval architecture + wine region proximity..."
}
```

#### 4. Enrichment Phase
**Purpose**: Add detailed activities, restaurants, hotels for each stop
**Tools Used**: searchActivities, Google Places with specific queries
**Output**: Full day-by-day itinerary

#### 5. Validation Phase
**Purpose**: Ensure route is feasible and high-quality
**Checks**:
- Driving times are reasonable
- Activities match opening hours
- Budget alignment
- Weather considerations
- Accessibility compliance

#### 6. Optimization Phase
**Purpose**: Final refinements
**Actions**:
- Reorder activities within days for efficiency
- Add alternatives for flexibility
- Score and explain route choices

---

## Phase 3: Landing Page Updates

### Remove
- `AgentShowcase.tsx` (4 agents marketing section)
- `AgentSelector.tsx` (form component)
- Agent type references throughout

### Update
- `Hero.tsx` - Update messaging from "4 AI agents" to "Intelligent route planning"
- `Features.tsx` - Update feature descriptions
- `RouteForm.tsx` - Replace AgentSelector with new preference system

### Add
- `PreferenceSelector.tsx` - New component for interest tags
- `TripStyleSlider.tsx` - Relaxation vs exploration slider
- `ConstraintsSection.tsx` - Optional constraints input
- `WorkflowShowcase.tsx` - New marketing section showing the intelligent process

### New Landing Page Flow
```
Hero
  ↓
"How It Works" - Show the 6-phase workflow visually
  ↓
Features (updated)
  ↓
Destination Showcase (keep)
  ↓
Enhanced Form
  ↓
Testimonials/Stats
  ↓
Footer
```

---

## Phase 4: Implementation Steps

### Step 1: Types & Interfaces (Day 1)
- [ ] Update `types/index.ts` with new preference types
- [ ] Remove `AgentType` references
- [ ] Add new form data types

### Step 2: Form Store (Day 1)
- [ ] Update `stores/formStore.ts`
- [ ] Replace `agents: AgentType[]` with new preference structure
- [ ] Add interest tags, companions, constraints

### Step 3: Form Components (Day 2-3)
- [ ] Create `InterestSelector.tsx` - Tag selection with weights
- [ ] Create `CompanionSelector.tsx` - Travel party picker
- [ ] Create `TripStyleSlider.tsx` - Relaxation/exploration spectrum
- [ ] Create `ConstraintsInput.tsx` - Optional constraints
- [ ] Update `RouteForm.tsx` to use new components
- [ ] Remove `AgentSelector.tsx`

### Step 4: Backend Agent (Day 4-5)
- [ ] Create `UnifiedRouteAgent.js` in `/server/agents/`
- [ ] Implement 6-phase workflow
- [ ] Update prompts to use weighted preferences
- [ ] Add reasoning/explanation output

### Step 5: API Endpoints (Day 5)
- [ ] Create `/api/generate-unified-route` endpoint
- [ ] Update job processing to use unified agent
- [ ] Update progress tracking for 6 phases

### Step 6: Landing Page (Day 6)
- [ ] Remove `AgentShowcase.tsx`
- [ ] Create `WorkflowShowcase.tsx`
- [ ] Update Hero messaging
- [ ] Update Features section

### Step 7: Testing & Polish (Day 7)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Error handling
- [ ] Deploy

---

## Database Schema Changes

### Routes Table Update
```sql
-- Remove selected_agents column eventually, but keep for backward compatibility
-- Add new columns:
ALTER TABLE routes ADD COLUMN preferences JSONB;
ALTER TABLE routes ADD COLUMN workflow_version VARCHAR(10) DEFAULT 'v2';

-- preferences JSONB structure:
{
  "companions": "couple",
  "interests": [
    { "id": "wine", "weight": 5 },
    { "id": "hiking", "weight": 4 },
    { "id": "medieval", "weight": 3 }
  ],
  "tripStyle": { "relaxation": 60, "exploration": 40 },
  "constraints": {
    "mustSee": ["Cinque Terre"],
    "avoid": [],
    "dietary": [],
    "accessibility": []
  }
}
```

---

## Risk Mitigation

### Backward Compatibility
- Keep old endpoint `/api/generate-route-nights-based` working
- Gradually migrate users to new system
- Store `workflow_version` to differentiate old vs new routes

### Quality Assurance
- The unified agent must produce routes at least as good as the best of 4 agents
- Add A/B testing capability to compare outputs
- Include reasoning/explanation in output for debugging

### Performance
- Single unified workflow should be faster than 4 parallel agents
- Target: < 30 seconds for complete route generation
- Progressive loading: show each phase completion

---

## Success Metrics

1. **Route Quality**: User ratings of generated routes
2. **Time to Generate**: < 30 seconds target
3. **Preference Match Score**: How well route matches stated interests
4. **Completion Rate**: Users who complete form and generate route
5. **Engagement**: Time spent customizing preferences

---

## Open Questions for User

1. **Interest Categories**: Should there be more/fewer interest tags? Any specific ones to add?
2. **Constraint Depth**: How detailed should constraints be? (e.g., specific restaurant types, hotel star ratings)
3. **Explanation Level**: How much "reasoning" should be shown to user about why stops were chosen?
4. **Migration**: Should existing users with saved routes see them differently?
