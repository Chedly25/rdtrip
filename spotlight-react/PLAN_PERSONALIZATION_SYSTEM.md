# Implementation Plan: Personalized Route Generation

## Vision

Transform route generation from a generic form into a **deeply personalized experience** that feels like telling a friend about your dream trip. Users should be able to express themselves naturally while having optional access to deeper customization.

---

## Design Philosophy

### Core Principles

1. **Progressive Disclosure**: Start simple, reveal depth on demand
2. **Conversational Over Forms**: Free-form expression > checkbox hell
3. **Optional Depth**: Power users can dig deep; casual users get great results with basics
4. **Warm Editorial Aesthetic**: Matches the map's luxury travel magazine feel

### User Journey

```
Basic (Required)          →  Express Yourself (Encouraged)  →  Fine-Tune (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Origin, Destination       →  "Tell us about your trip"      →  Travel Style, Pace,
Dates, Travelers              Free-form text box                Budget, Interests...
```

---

## Component Architecture

### New Components to Create

```
src/components/personalization/
├── TripStoryInput.tsx           # Free-form text box (main feature)
├── PersonalizationAccordion.tsx # Expandable sections container
├── sections/
│   ├── TravelStyleSection.tsx   # How do you like to travel?
│   ├── PaceSection.tsx          # Relaxed ↔ Packed schedule
│   ├── InterestsSection.tsx     # What draws you to places?
│   ├── DiningSection.tsx        # Food preferences
│   ├── AccommodationSection.tsx # Where do you like to stay?
│   ├── BudgetSection.tsx        # Budget comfort level
│   └── AccessibilitySection.tsx # Physical considerations
├── shared/
│   ├── OptionPill.tsx           # Selectable tag/pill component
│   ├── SliderInput.tsx          # Range slider with labels
│   ├── ToggleCard.tsx           # Card-style toggle option
│   └── SectionHeader.tsx        # Consistent section headers
└── index.ts                     # Barrel export
```

### Integration Points

1. **SpotlightLanding.tsx** - Add personalization before "Generate Route"
2. **spotlightStoreV2.ts** - Extend state with personalization data
3. **API Integration** - Pass personalization to generation endpoint

---

## Phase 1: Trip Story Input (The Free-Form Box)

### Component: `TripStoryInput.tsx`

**Purpose**: Let users express their trip context naturally

**Design**:
- Large, inviting textarea with warm styling
- Placeholder with rotating examples
- Character hint (not limit) for guidance
- Optional - works with or without input

**UI Mockup**:
```
┌─────────────────────────────────────────────────────────────────┐
│  ✨ Tell us about your trip                                     │
│  ───────────────────────────────────────────────────────────── │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ We're celebrating our 10th anniversary and want         │   │
│  │ romantic spots with amazing food. My wife loves         │   │
│  │ art museums and I'm into local wine bars...             │   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  This helps us personalize your route • 0/500                   │
└─────────────────────────────────────────────────────────────────┘
```

**Placeholder Examples** (rotate on focus):
- "We're foodies looking for authentic local cuisine..."
- "Traveling with kids who need regular breaks..."
- "First time in Europe, want iconic sights but hate crowds..."
- "Budget trip but willing to splurge on one special dinner..."
- "Celebrating retirement, taking it slow and luxurious..."

**Props Interface**:
```typescript
interface TripStoryInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;        // Default 500
  className?: string;
}
```

---

## Phase 2: Personalization Accordion

### Component: `PersonalizationAccordion.tsx`

**Purpose**: Optional deep customization via expandable sections

**Design**:
- Collapsed by default with enticing preview
- Smooth expand/collapse animation
- Visual indicator of completed sections
- Can skip entirely

**UI Mockup (Collapsed)**:
```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Want more control? Customize your experience               │
│                                                    [Expand ▼]   │
└─────────────────────────────────────────────────────────────────┘
```

**UI Mockup (Expanded)**:
```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Customize your experience                      [Collapse ▲] │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─ Travel Style ─────────────────────────────── ✓ completed ─┐ │
│  │  [Explorer]  [Relaxer]  [Culture Seeker]  [Adventurer]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Trip Pace ───────────────────────────────────────────────┐ │
│  │  Relaxed ●━━━━━━━━━○━━━━━━━━━━○ Packed                     │ │
│  │          └ Slow mornings,      └ See everything!           │ │
│  │            leisurely days                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Interests ─────────────────────────────────── + Add more ─┐ │
│  │  [History ✓] [Food ✓] [Art] [Nature] [Nightlife] [Shopping]│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Dining ──────────────────────────────────────────────────┐ │
│  │  ○ Local street food    ○ Casual restaurants              │ │
│  │  ○ Mix of everything    ○ Fine dining experiences         │ │
│  │                                                            │ │
│  │  Dietary: [Vegetarian] [Gluten-free] [Halal] [None]       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Budget Comfort ──────────────────────────────────────────┐ │
│  │  [$] Budget     [$$] Mid-range    [$$$] Luxury            │ │
│  │      Hostels,       Good hotels,      5-star,             │ │
│  │      street food    nice restaurants  Michelin            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Accessibility & Comfort ─────────────────────────────────┐ │
│  │  □ Limited mobility (minimize walking)                     │ │
│  │  □ Traveling with young children                          │ │
│  │  □ Prefer air-conditioned venues                          │ │
│  │  □ Need frequent rest stops                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Data Model & Store

### Extend `spotlightStoreV2.ts`

```typescript
// New interface for personalization
export interface TripPersonalization {
  // Free-form context
  tripStory: string;

  // Travel style (single select)
  travelStyle?: 'explorer' | 'relaxer' | 'culture' | 'adventurer' | 'foodie';

  // Pace (1-5 scale)
  pace?: number; // 1 = very relaxed, 5 = packed

  // Interests (multi-select)
  interests?: string[];

  // Dining preferences
  dining?: {
    style?: 'street' | 'casual' | 'mix' | 'fine';
    dietary?: string[];
  };

  // Accommodation preference
  accommodation?: 'budget' | 'mid' | 'luxury' | 'unique';

  // Budget level
  budget?: 'budget' | 'mid' | 'luxury';

  // Accessibility needs
  accessibility?: {
    limitedMobility?: boolean;
    withChildren?: boolean;
    needsAC?: boolean;
    frequentRests?: boolean;
  };

  // Trip occasion (helps with tone)
  occasion?: string; // "honeymoon", "family vacation", "solo adventure", etc.
}

// Extend SpotlightRoute
export interface SpotlightRoute {
  // ... existing fields ...
  personalization?: TripPersonalization;
}

// New store actions
interface SpotlightStoreV2 {
  // ... existing actions ...
  setTripStory: (story: string) => void;
  setPersonalization: (data: Partial<TripPersonalization>) => void;
  clearPersonalization: () => void;
}
```

---

## Phase 4: Integration with Generation

### Update Generation Request

The personalization data flows to the backend:

```typescript
// In itinerary generation
const generateRoute = async () => {
  const { route } = useSpotlightStoreV2.getState();

  const requestBody = {
    routeData: {
      origin: route.origin,
      destination: route.destination,
      cities: route.cities,
      // ... existing fields
    },
    preferences: {
      agent: route.agent,
      // NEW: Personalization context
      personalization: route.personalization,
    }
  };

  await fetch('/api/itinerary/generate', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
};
```

### Backend Processing

The backend AI uses personalization to:
1. **tripStory**: Parsed for context, occasions, preferences mentioned
2. **travelStyle + pace**: Adjusts activity density and types
3. **interests**: Prioritizes relevant attractions/activities
4. **dining**: Filters and ranks restaurant recommendations
5. **budget**: Adjusts accommodation and activity suggestions
6. **accessibility**: Filters out inappropriate venues, adds rest time

---

## Phase 5: UI Integration

### Architecture Overview

Based on codebase analysis, the route flow is:

```
Landing Page (external)     →  SpotlightV2.tsx           →  Generation
    ↓                              ↓                           ↓
Sets localStorage          Loads from localStorage      Uses preferences
(spotlightData)            Shows map + BottomSheet      for AI generation
```

### Integration Point 1: Landing Page (PRIMARY)

The external landing page sets `localStorage.spotlightData`. We need to:
1. Add TripStoryInput to the landing form
2. Add PersonalizationAccordion (collapsed) below it
3. Include personalization in the localStorage data

```tsx
// Current flow (simplified):
<OriginDestinationInput />
<DatesPicker />
<TravelersCount />
<AgentSelector />
<GenerateButton />

// New flow:
<OriginDestinationInput />
<DatesPicker />
<TravelersCount />

{/* NEW: Trip Story - always visible, optional */}
<TripStoryInput
  value={tripStory}
  onChange={setTripStory}
/>

{/* NEW: Personalization - collapsed by default */}
<PersonalizationAccordion
  personalization={personalization}
  onChange={setPersonalization}
/>

<AgentSelector />
<GenerateButton />
```

### Integration Point 2: BottomSheet (SECONDARY)

For users who want to refine AFTER seeing their route:

**File**: `src/components/spotlight/v3/BottomSheet.tsx`

Add a "Personalize" button that opens a modal/drawer:

```tsx
// In BottomSheet header section (around line 208-230)
<div className="flex items-center gap-3">
  {/* Existing route info */}

  {/* NEW: Personalize button */}
  {!route.personalization?.tripStory && (
    <button
      onClick={() => setShowPersonalization(true)}
      className="px-3 py-1.5 bg-gradient-to-r from-[#C45830] to-[#D4A853]
                 text-white text-xs font-medium rounded-full"
    >
      ✨ Personalize
    </button>
  )}
</div>
```

### Integration Point 3: CompanionPanel

Add personalization context to conversation:

```tsx
// When user sends message, include personalization context
const contextPrompt = route.personalization?.tripStory
  ? `Context about this trip: ${route.personalization.tripStory}`
  : '';
```

---

## Design Specifications

### Typography
- Section headers: Playfair Display, 18px, #5C4D3D
- Labels: Source Sans 3, 14px, #7A6B5A
- Input text: Source Sans 3, 16px, #5C4D3D
- Hints: Source Sans 3, 12px, #9A8B7A

### Colors (Editorial Palette)
```css
--color-cream: #FFFBF5;
--color-parchment: #F4EDE4;
--color-terracotta: #C45830;
--color-gold: #D4A853;
--color-brown-dark: #5C4D3D;
--color-brown-medium: #7A6B5A;
--color-brown-light: #9A8B7A;
--color-taupe: #C9B89C;
```

### Component Styling

**TripStoryInput**:
- Background: cream with subtle inner shadow
- Border: 1px taupe, 2px terracotta on focus
- Border radius: 16px
- Padding: 20px
- Min-height: 120px

**OptionPill (unselected)**:
- Background: parchment
- Border: 1px taupe
- Text: brown-medium
- Border radius: 20px

**OptionPill (selected)**:
- Background: terracotta gradient
- Border: none
- Text: white
- Subtle glow shadow

**SliderInput**:
- Track: taupe
- Active track: terracotta → gold gradient
- Thumb: white with terracotta border

### Animations

**Accordion expand/collapse**:
- Duration: 300ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Height + opacity transition

**OptionPill selection**:
- Scale: 0.95 → 1.05 → 1
- Duration: 200ms
- Spring physics

**TripStoryInput focus**:
- Border color transition: 200ms
- Subtle lift shadow

---

## Implementation Order

### Sprint 1: Foundation (Days 1-2)
1. ✅ Create `TripStoryInput.tsx` component
2. ✅ Add `tripStory` field to store
3. ✅ Integrate into RouteForm (landing-react)
4. ✅ Pass to generation API

### Sprint 2: Personalization UI (Days 3-5)
1. ✅ Create shared components (OptionPill, SliderInput, ToggleCard, SectionHeader)
2. ✅ Build PersonalizationAccordion container
3. ✅ Implement TravelStyleSection
4. ✅ Implement PaceSection
5. ✅ Implement InterestsSection

### Sprint 3: Extended Sections (Days 6-7)
1. ✅ Implement DiningSection
2. ✅ Implement BudgetSection
3. ✅ Implement AccessibilitySection
4. ✅ Add completion indicators
5. ✅ Implement OccasionSection (bonus)

### Sprint 4: Polish & Integration (Days 8-9)
1. ✅ Animation refinements (spring physics, editorial easing)
2. ✅ Mobile responsiveness (all components responsive)
3. ✅ Accessibility (a11y) - ARIA attributes, keyboard navigation
4. ✅ PersonalizationBadge for spotlight view
5. ✅ AgentProvider integration for companion chat

### Sprint 5: Backend Integration (Day 10)
1. ✅ Update generation API to consume personalization
2. ✅ AI prompt engineering for personalization context (DayPlannerAgent)
3. ✅ Discovery agents updated (GooglePlacesDiscoveryAgent, GooglePlacesRestaurantAgent)
4. ☐ End-to-end testing (manual verification needed)

---

## File Changes Summary

### New Files
- `src/components/personalization/TripStoryInput.tsx`
- `src/components/personalization/PersonalizationAccordion.tsx`
- `src/components/personalization/sections/TravelStyleSection.tsx`
- `src/components/personalization/sections/PaceSection.tsx`
- `src/components/personalization/sections/InterestsSection.tsx`
- `src/components/personalization/sections/DiningSection.tsx`
- `src/components/personalization/sections/BudgetSection.tsx`
- `src/components/personalization/sections/AccessibilitySection.tsx`
- `src/components/personalization/shared/OptionPill.tsx`
- `src/components/personalization/shared/SliderInput.tsx`
- `src/components/personalization/shared/ToggleCard.tsx`
- `src/components/personalization/shared/SectionHeader.tsx`
- `src/components/personalization/index.ts`

### Modified Files
- `src/stores/spotlightStoreV2.ts` - Add personalization state
- `src/components/spotlight/SpotlightLanding.tsx` - Integrate components
- `src/hooks/useItineraryGeneration.ts` - Pass personalization data
- `src/types/index.ts` - Add TripPersonalization interface

---

## Success Metrics

1. **Adoption**: % of users who fill trip story (target: 60%+)
2. **Depth**: % who expand personalization (target: 25%+)
3. **Quality**: User satisfaction with generated routes (survey)
4. **Completion**: Form abandonment rate (should not increase)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Form feels overwhelming | Keep accordion collapsed, clear "optional" messaging |
| Slows down generation | Show "enhancing with your preferences..." message |
| Users skip story | Rotating examples inspire, defaults still work great |
| Mobile UX suffers | Design mobile-first, test on real devices |

---

## Future Enhancements (Post-MVP)

1. **Taste Learning**: Save preferences to user profile
2. **Trip Templates**: "Honeymoon", "Family", "Solo Adventure" presets
3. **Photo Inspiration**: "Show me trips like this" from images
4. **Voice Input**: Speak your trip story
5. **AI Interview**: Chat-based preference gathering
