# Itinerary Generation Personalization Enhancement Plan

## Problem Statement

The current ItineraryPanel modal that appears when clicking "Generate My Itinerary" on the spotlight page:
1. **Does NOT show** the user's personalization preferences (trip story, interests, occasion, etc.)
2. **Does NOT pass** personalization data to the itinerary generation API
3. Displays a generic "Ready to Generate Your Itinerary?" message without context

The user entered personalization data (e.g., "Celebrating our 10th wedding anniversary! We love wine, romantic dinners...") but this data is not:
- Visible in the generation overlay
- Sent to the backend for itinerary generation

## Current Data Flow Analysis

### Where Personalization Data Exists

```
spotlightStoreV2.route.personalization = {
  tripStory: string,           // User's free-form story
  travelStyle?: TravelStyle,   // explorer, relaxer, culture, etc.
  pace?: number,               // 1-5 scale
  interests?: string[],        // history, art, food, wine, etc.
  diningStyle?: DiningStyle,   // street, casual, mix, fine
  accommodation?: string,      // budget, mid, luxury, unique
  budget?: string,             // budget, mid, luxury
  occasion?: TripOccasion,     // honeymoon, anniversary, etc.
  avoidCrowds?: boolean,
  preferOutdoor?: boolean
}
```

### Where It Should Flow To

```
ItineraryPanel.handleGenerate()
  → useItineraryGeneration.generate(routeData, preferences)
    → POST /api/itinerary/generate { routeData, preferences: { personalization: {...} } }
      → AgentOrchestratorV3 uses personalization for AI prompts
```

### Current Bug in ItineraryPanel.tsx (Line 88-92)

```typescript
const preferences = {
  travelStyle: route.agent,
  budget: route.budget,
  agentType: route.agent
  // ❌ MISSING: personalization: route.personalization
};
```

## Implementation Plan

### Phase 1: Display Personalization in the Overlay

**File: `spotlight-react/src/components/spotlight/v2/ItineraryPanel.tsx`**

#### 1.1 Create PersonalizationSummary Component

Design a compact, elegant summary card that shows:
- Trip story excerpt (with "Read more" expansion)
- Occasion badge (e.g., "Anniversary", "Honeymoon")
- Top interests as tags
- Travel style indicator
- Dining preference
- Budget level

Visual design requirements:
- Warm editorial palette matching PersonalizedIntroBanner
- Fraunces typography for headlines
- Compact by default, expandable for details
- Subtle gold/terracotta accents

#### 1.2 Update Initial State UI

Replace the generic "Ready to Generate?" with:
- Personalized headline: "Ready to plan your Anniversary Adventure?"
- Trip story excerpt in italics
- Visual interest tags
- "Your Preferences" summary section

If NO personalization data exists, show the current generic UI.

#### 1.3 Update Generating State

During generation, show:
- "Crafting your personalized itinerary..."
- Brief reminder of key preferences being considered
- Agent progress with personalization context

### Phase 2: Pass Personalization Data to Backend

**File: `spotlight-react/src/components/spotlight/v2/ItineraryPanel.tsx`**

#### 2.1 Fix handleGenerate Function

```typescript
const preferences = {
  travelStyle: route.agent,
  budget: route.budget,
  agentType: route.agent,
  // ✅ ADD THIS:
  personalization: route.personalization
};
```

### Phase 3: Display Personalization in Success State

After generation completes, the itinerary object contains:
- `personalizedIntro`: headline, summary, highlights
- `tripStyleProfile`: cultural, adventure, relaxation scores
- `dayThemes`: themed day titles
- `tripNarrative`: AI-generated story

#### 3.1 Show Personalized Intro Card

In the success state, display:
- Personalized headline from AI
- Trip narrative excerpt
- Style profile visualization (bar chart)
- Day themes preview

### Phase 4: Enhance Visual Design

#### 4.1 Design System Elements

Use consistent styling from PersonalizedIntroBanner:
- `#FFFDF9` to `#FFF9F0` background gradient
- `#C45830` terracotta accent
- `#D4A853` golden accent
- `#2C2417` dark text
- `#8B7355` secondary text
- Fraunces font for headlines

#### 4.2 Animation

- Smooth expand/collapse for trip story
- Staggered entrance for preference tags
- Progress indicators with personality

## Component Structure

```
ItineraryPanel
├── PersonalizationSummary (new)
│   ├── TripStoryExcerpt
│   ├── OccasionBadge
│   ├── InterestTags
│   ├── TravelStyleIndicator
│   └── BudgetIndicator
├── InitialState
│   ├── PersonalizedHeadline (conditional)
│   ├── PersonalizationSummary (if has personalization)
│   └── GenericContent (fallback)
├── GeneratingState (existing, enhanced)
│   └── PersonalizationReminder
└── SuccessState (existing, enhanced)
    ├── PersonalizedIntroCard (new)
    ├── TripStyleProfile (new)
    └── DayThemePreview (new)
```

## Files to Modify

1. **`spotlight-react/src/components/spotlight/v2/ItineraryPanel.tsx`**
   - Add personalization to preferences object (bug fix)
   - Import and integrate PersonalizationSummary
   - Update initial state UI
   - Update success state UI

2. **Create: `spotlight-react/src/components/spotlight/v2/PersonalizationSummary.tsx`**
   - New component for displaying user preferences
   - Compact design with expand option
   - Reusable across ItineraryPanel states

3. **Create: `spotlight-react/src/components/spotlight/v2/PersonalizedSuccessCard.tsx`**
   - Display AI-generated personalization content
   - Trip narrative, style profile, day themes

## Implementation Order

1. **Bug Fix First**: Pass personalization data to generate function (5 min)
2. **PersonalizationSummary Component**: Design and build (30 min)
3. **Update Initial State**: Integrate summary, personalized headline (20 min)
4. **Update Success State**: Show AI-generated content (20 min)
5. **Polish & Animation**: Micro-interactions, transitions (15 min)

## Success Criteria

1. User's trip story and preferences are visible in the generation overlay
2. Personalization data is sent to the backend API
3. AI-generated personalized content is displayed after generation
4. Design matches the editorial warmth of PersonalizedIntroBanner
5. Graceful fallback when no personalization exists

## Design Mockup (ASCII)

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│ │  📅 Detailed Itinerary Generator                    ✕│ │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
│                                                           │
│   ┌─────────────────────────────────────────────────────┐ │
│   │ ✨ Ready to Plan Your Anniversary Escape?          │ │
│   │                                                     │ │
│   │ "Celebrating our 10th wedding anniversary!         │ │
│   │  We love wine, romantic dinners, and..."  [more]   │ │
│   │                                                     │ │
│   │ ┌─────────────────────────────────────────────────┐│ │
│   │ │ Your Preferences                                ││ │
│   │ │                                                 ││ │
│   │ │ 💍 Anniversary   🍷 Wine   🍽️ Fine Dining      ││ │
│   │ │ 🏛️ Architecture  🌿 Hidden Gems                 ││ │
│   │ │                                                 ││ │
│   │ │ Pace: Relaxed  •  Budget: Comfort ($$$)        ││ │
│   │ └─────────────────────────────────────────────────┘│ │
│   └─────────────────────────────────────────────────────┘ │
│                                                           │
│   ┌─────────────────────────────────────────────────────┐ │
│   │ 🎯 Smart Planning │ 🤖 9 AI Agents │ ⚡ 30-90 sec  │ │
│   └─────────────────────────────────────────────────────┘ │
│                                                           │
│            [ ✨ Start Personalized Generation ]           │
│                                                           │
└─────────────────────────────────────────────────────────────┘
```
