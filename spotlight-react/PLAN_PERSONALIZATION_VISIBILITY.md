# Personalization Visibility System

## Vision

Transform the route display from a generic itinerary into a **deeply personal experience** that shows users exactly how their preferences shaped every recommendation. Users should feel heard, understood, and delighted by how precisely we tailored their trip.

---

## Features Overview

| # | Feature | Impact | Complexity |
|---|---------|--------|------------|
| 1 | Personalized Trip Intro Banner | High | Medium |
| 2 | "Why This?" Match Reasons | Very High | High |
| 3 | Themed Day Titles | Medium | Low |
| 4 | Match Score Indicators | High | Medium |
| 5 | Trip Style Visualization | Medium | Low |
| 6 | AI Companion Awareness | High | Medium |
| 7 | Store Recommendation Reasons | Critical | High |
| 8 | Full Trip Narrative | High | Medium |

---

## Data Architecture

### Current State
```typescript
interface SpotlightRoute {
  days: Day[]
  personalization?: TripPersonalization  // We have this!
}

interface Day {
  dayNumber: number
  city: string
  activities: Activity[]
}

interface Activity {
  name: string
  description: string
  // ... no info about WHY it was chosen
}
```

### Target State
```typescript
interface SpotlightRoute {
  days: Day[]
  personalization?: TripPersonalization

  // NEW: Personalization visibility data
  personalizedIntro?: PersonalizedIntro
  tripNarrative?: string
  tripStyleProfile?: TripStyleProfile
}

interface PersonalizedIntro {
  headline: string          // "Crafted for Your Anniversary"
  summary: string           // 2-3 sentence personalized summary
  highlightedFactors: PersonalizationFactor[]  // Visual pills
}

interface TripStyleProfile {
  explorerVsRelaxer: number      // 0-100 (0=explorer, 100=relaxer)
  budgetVsLuxury: number         // 0-100
  mainstreamVsHidden: number     // 0-100
  packedVsLeisurely: number      // 0-100
}

interface Day {
  dayNumber: number
  city: string
  activities: Activity[]

  // NEW
  theme?: string            // "Romantic Arrival" | "Art & Wine Discovery"
  themeEmoji?: string       // "💑" | "🎨🍷"
}

interface Activity {
  name: string
  description: string

  // NEW: Why was this chosen?
  matchReasons?: MatchReason[]
  matchScore?: number       // 0-100 overall match percentage
  personalizedNote?: string // "Perfect for your anniversary dinner"
}

interface MatchReason {
  factor: PersonalizationFactor
  contribution: number      // How much this factor contributed (points)
  explanation: string       // "Matches your interest in art"
}

type PersonalizationFactor =
  | 'trip_story'
  | 'occasion_honeymoon' | 'occasion_anniversary' | 'occasion_birthday' | ...
  | 'style_explorer' | 'style_relaxer' | 'style_culture' | 'style_adventurer' | 'style_foodie'
  | 'interest_history' | 'interest_art' | 'interest_nature' | 'interest_food' | ...
  | 'dining_street' | 'dining_casual' | 'dining_fine'
  | 'budget_budget' | 'budget_mid' | 'budget_luxury'
  | 'avoid_crowds'
  | 'prefer_outdoor'
  | 'accessibility'
```

---

## Implementation Phases

### Phase 1: Backend Foundation (Store Match Reasons)
**Goal:** Make the backend track and return WHY each place was selected.

#### 1.1 Update Discovery Agent Scoring
**File:** `server/agents/discovery/GooglePlacesDiscoveryAgent.js`

```javascript
// BEFORE
calculateQualityScore(candidate, preferences) {
  let score = 0;
  score += this.calculatePersonalizationBonus(candidate, personalization);
  return score;
}

// AFTER
calculateQualityScore(candidate, preferences) {
  let score = 0;
  const matchReasons = [];

  // Track each contribution
  const personalizationResult = this.calculatePersonalizationBonus(candidate, personalization);
  score += personalizationResult.score;
  matchReasons.push(...personalizationResult.reasons);

  return { score, matchReasons };
}

calculatePersonalizationBonus(candidate, personalization) {
  const reasons = [];
  let bonus = 0;

  // Interest matching
  if (personalization.interests?.includes('art')) {
    if (place_types.includes('art_gallery') || place_types.includes('museum')) {
      bonus += 15;
      reasons.push({
        factor: 'interest_art',
        contribution: 15,
        explanation: 'Matches your interest in art'
      });
    }
  }

  // Occasion matching
  if (personalization.occasion === 'honeymoon') {
    if (isRomanticVenue(candidate)) {
      bonus += 10;
      reasons.push({
        factor: 'occasion_honeymoon',
        contribution: 10,
        explanation: 'Perfect romantic spot for your honeymoon'
      });
    }
  }

  // ... etc for all factors

  return { score: bonus, reasons };
}
```

#### 1.2 Update Restaurant Agent Similarly
**File:** `server/agents/discovery/GooglePlacesRestaurantAgent.js`

Same pattern - track why each restaurant was chosen.

#### 1.3 Update Activity/Restaurant Data Structure
Ensure match reasons flow through to the final response.

**Files to modify:**
- `server/agents/AgentOrchestratorV3.js` - Pass match reasons through
- `server/routes/itinerary.js` - Include in response

---

### Phase 2: AI-Generated Contextual Content
**Goal:** Have the AI generate personalized intro, day themes, and narrative.

#### 2.1 Update DayPlannerAgent Prompt
**File:** `server/agents/DayPlannerAgent.js`

Add to the prompt output requirements:

```javascript
buildPrompt() {
  // ... existing prompt ...

  return `
    ${existingPrompt}

    ADDITIONAL OUTPUT REQUIREMENTS:

    1. PERSONALIZED_INTRO: Generate a warm, personalized introduction object:
       {
         "headline": "Crafted for Your [Occasion]",  // e.g., "Crafted for Your Anniversary"
         "summary": "2-3 sentences echoing their trip story and preferences",
         "highlightedFactors": ["occasion_anniversary", "interest_wine", "dining_fine"]
       }

    2. DAY_THEMES: For each day, generate a theme:
       {
         "day1": { "theme": "Romantic Arrival", "emoji": "💑" },
         "day2": { "theme": "Art & Wine Discovery", "emoji": "🎨🍷" }
       }

    3. TRIP_NARRATIVE: Generate a 3-4 paragraph flowing narrative that:
       - References their trip story directly if provided
       - Explains why key activities were chosen
       - Feels like a personal travel guide wrote it just for them

    4. TRIP_STYLE_PROFILE: Based on their preferences, output:
       {
         "explorerVsRelaxer": 75,      // They lean relaxer
         "budgetVsLuxury": 80,         // They want luxury
         "mainstreamVsHidden": 60,     // Slight preference for hidden gems
         "packedVsLeisurely": 70       // Leisurely pace
       }
  `;
}
```

#### 2.2 Parse and Include in Response
Update response parsing to extract these new fields and include them in the route data.

---

### Phase 3: Frontend Components
**Goal:** Build the UI components to display personalization visibility.

#### 3.1 PersonalizedTripIntro Component
**File:** `spotlight-react/src/components/spotlight/v2/PersonalizedTripIntro.tsx`

```tsx
/**
 * Personalized Trip Intro Banner
 *
 * Displays at the top of the route view, showing users that their
 * personalization was heard and applied.
 *
 * Features:
 * - Warm headline echoing their occasion/purpose
 * - 2-3 sentence summary referencing their preferences
 * - Visual pills showing which factors were applied
 * - Warm editorial styling (terracotta/gold)
 */

interface PersonalizedTripIntroProps {
  intro: PersonalizedIntro
  personalization: TripPersonalization
}

export function PersonalizedTripIntro({ intro, personalization }: PersonalizedTripIntroProps) {
  return (
    <motion.div className="personalized-intro">
      {/* Sparkle icon + Headline */}
      <div className="intro-header">
        <Sparkles />
        <h2>{intro.headline}</h2>
      </div>

      {/* Echo their trip story if provided */}
      {personalization.tripStory && (
        <blockquote className="trip-story-echo">
          "{truncate(personalization.tripStory, 100)}"
        </blockquote>
      )}

      {/* Personalized summary */}
      <p className="intro-summary">{intro.summary}</p>

      {/* Factor pills */}
      <div className="factor-pills">
        {intro.highlightedFactors.map(factor => (
          <FactorPill key={factor} factor={factor} />
        ))}
      </div>
    </motion.div>
  )
}
```

**Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ✨ Crafted for Your 10th Anniversary                          │
│                                                                 │
│  "We're celebrating 10 years and want romantic spots           │
│   with amazing wine..."                                         │
│                                                                 │
│  A week of romance awaits in Tuscany — leisurely mornings,     │
│  candlelit dinners at Michelin-starred trattorias, and         │
│  private wine tastings in centuries-old cellars. We've kept    │
│  the crowds away and the pace unhurried, just like you asked.  │
│                                                                 │
│  [💑 Anniversary] [🍷 Wine] [🎨 Art] [🚶 Relaxed] [$$$ Fine]   │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.2 WhyThisBadge / MatchReasonPills Component
**File:** `spotlight-react/src/components/spotlight/v2/WhyThisBadge.tsx`

```tsx
/**
 * Why This Badge
 *
 * Shows why a specific activity/restaurant was chosen.
 * Can be displayed inline (pills) or expanded (full explanation).
 */

interface WhyThisBadgeProps {
  matchReasons: MatchReason[]
  matchScore?: number
  variant: 'inline' | 'expanded'
}

// Inline variant: Small pills under activity name
// [🎨 Art] [💑 Romantic] [📸 Photo spot]

// Expanded variant: Full explanations
// ✓ Matches your interest in art (15 pts)
// ✓ Perfect romantic spot for your honeymoon (10 pts)
// ✓ Great for photography enthusiasts (5 pts)
```

**Design - Inline:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Uffizi Gallery                                    ⭐ 4.8       │
│  Florence's premier Renaissance art museum                      │
│                                                                 │
│  [🎨 Your art interest] [💑 Romantic] [🌅 Off-peak visit]      │
│                                                                 │
│  📍 2.5 km away  ⏱ 2-3 hours  💰 €20                           │
└─────────────────────────────────────────────────────────────────┘
```

**Design - Expanded (on tap):**
```
┌─────────────────────────────────────────────────────────────────┐
│  Why we chose this for you                                      │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ✓ Matches your interest in art                                │
│    "You mentioned loving Renaissance art"                       │
│                                                                 │
│  ✓ Perfect for your anniversary                                │
│    "Romantic setting with quieter afternoon hours"              │
│                                                                 │
│  ✓ Avoids crowds (as you requested)                            │
│    "We scheduled this at 2pm when tour groups leave"            │
│                                                                 │
│  ████████████████░░░░ 87% match                                │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3 DayThemeHeader Component
**File:** `spotlight-react/src/components/spotlight/v2/DayThemeHeader.tsx`

```tsx
/**
 * Day Theme Header
 *
 * Replaces generic "Day 1" with contextual themed headers.
 */

interface DayThemeHeaderProps {
  dayNumber: number
  city: string
  theme?: string
  themeEmoji?: string
}

// Output:
// Day 1 · Florence
// 💑 Romantic Arrival
```

#### 3.4 MatchScoreIndicator Component
**File:** `spotlight-react/src/components/spotlight/v2/MatchScoreIndicator.tsx`

```tsx
/**
 * Match Score Indicator
 *
 * Visual bar/percentage showing how well an activity matches preferences.
 */

interface MatchScoreIndicatorProps {
  score: number  // 0-100
  size: 'sm' | 'md' | 'lg'
}

// Output:
// ████████████░░░░ 87%
```

#### 3.5 TripStyleVisualization Component
**File:** `spotlight-react/src/components/spotlight/v2/TripStyleVisualization.tsx`

```tsx
/**
 * Trip Style Visualization
 *
 * Shows a visual representation of the trip's character based on
 * user preferences. Can be radar chart or simple sliders.
 */

interface TripStyleVisualizationProps {
  profile: TripStyleProfile
}
```

**Design Option A - Sliders:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Your Trip Style                                                │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Explorer ○───────────●─── Relaxer                             │
│    Budget ○─────────────●─ Luxury                              │
│ Mainstream ○────────●───── Hidden                              │
│    Packed ○──────────●──── Leisurely                           │
└─────────────────────────────────────────────────────────────────┘
```

**Design Option B - Radar Chart:**
```
           Relaxed
              ╱╲
             ╱  ╲
        Luxury    Hidden Gems
             ╲  ╱
              ╲╱
           Culture
```

#### 3.6 TripNarrative Component
**File:** `spotlight-react/src/components/spotlight/v2/TripNarrative.tsx`

```tsx
/**
 * Trip Narrative
 *
 * A flowing, story-style description of the entire trip.
 * Expandable/collapsible to not overwhelm the UI.
 */

interface TripNarrativeProps {
  narrative: string
  isExpanded?: boolean
}
```

**Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📖 Your Trip Story                                    [Expand] │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Your week in Tuscany begins where all great love stories      │
│  should — with sunrise over Florence's terracotta rooftops.    │
│  We've kept your mornings unhurried (you mentioned hating      │
│  early starts), saving the Uffizi for a quiet afternoon...     │
│                                                                 │
│  [Read more...]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Phase 4: AI Companion Awareness
**Goal:** Make the chat companion reference user preferences naturally.

#### 4.1 Update AgentProvider System Prompt
**File:** `spotlight-react/src/contexts/AgentProvider.tsx`

```typescript
const buildSystemPrompt = (route, personalization) => {
  let prompt = `You are a knowledgeable travel companion...`;

  if (personalization) {
    prompt += `

    IMPORTANT - USER PERSONALIZATION CONTEXT:
    The user has shared specific preferences. Reference these naturally in your responses:

    ${personalization.tripStory ? `Their trip story: "${personalization.tripStory}"` : ''}
    ${personalization.occasion ? `Occasion: ${personalization.occasion} - acknowledge this is special` : ''}
    ${personalization.travelStyle ? `Travel style: ${personalization.travelStyle}` : ''}
    ${personalization.interests?.length ? `Key interests: ${personalization.interests.join(', ')}` : ''}
    ${personalization.diningStyle ? `Dining preference: ${personalization.diningStyle}` : ''}
    ${personalization.avoidCrowds ? `IMPORTANT: They want to avoid crowds - suggest off-peak times` : ''}

    When answering questions:
    - Reference their specific preferences naturally ("Since you love wine...")
    - Acknowledge their occasion ("For your anniversary, I'd suggest...")
    - Respect their pace preference
    - Suggest alternatives that match their interests
    `;
  }

  return prompt;
};
```

**Example Conversation:**
```
User: "What should I do in Florence?"

Before: "Florence has many attractions. The Uffizi Gallery is popular..."

After: "Since you mentioned loving art and wanting to avoid crowds,
I'd suggest the Uffizi at 2pm when tour groups thin out. For your
anniversary dinner tonight, Enoteca Pinchiorri has an incredible
wine pairing menu — perfect given your interest in wine. Their
terrace table at sunset is especially romantic."
```

---

### Phase 5: Integration
**Goal:** Wire everything together in the SpotlightV2 view.

#### 5.1 Update SpotlightV2.tsx
**File:** `spotlight-react/src/components/spotlight/v2/SpotlightV2.tsx`

```tsx
export function SpotlightV2() {
  const { route } = useSpotlightStore();

  return (
    <div className="spotlight-container">
      {/* NEW: Personalized intro at top */}
      {route.personalizedIntro && route.personalization && (
        <PersonalizedTripIntro
          intro={route.personalizedIntro}
          personalization={route.personalization}
        />
      )}

      {/* NEW: Trip style visualization */}
      {route.tripStyleProfile && (
        <TripStyleVisualization profile={route.tripStyleProfile} />
      )}

      {/* NEW: Trip narrative (collapsible) */}
      {route.tripNarrative && (
        <TripNarrative narrative={route.tripNarrative} />
      )}

      {/* EXISTING: Day-by-day itinerary (enhanced) */}
      {route.days.map(day => (
        <DaySection key={day.dayNumber}>
          {/* NEW: Themed day header */}
          <DayThemeHeader
            dayNumber={day.dayNumber}
            city={day.city}
            theme={day.theme}
            themeEmoji={day.themeEmoji}
          />

          {/* EXISTING: Activities (enhanced with match reasons) */}
          {day.activities.map(activity => (
            <ActivityCard key={activity.id} activity={activity}>
              {/* NEW: Why this? badge */}
              {activity.matchReasons?.length > 0 && (
                <WhyThisBadge
                  matchReasons={activity.matchReasons}
                  matchScore={activity.matchScore}
                  variant="inline"
                />
              )}
            </ActivityCard>
          ))}
        </DaySection>
      ))}
    </div>
  );
}
```

---

## Implementation Order

### Sprint 1: Backend Foundation (2-3 days)
1. [ ] Update `calculatePersonalizationBonus` to return reasons with scores
2. [ ] Update `GooglePlacesDiscoveryAgent` to track match reasons
3. [ ] Update `GooglePlacesRestaurantAgent` to track match reasons
4. [ ] Flow match reasons through orchestrator to response
5. [ ] Update types in `spotlightStoreV2.ts`

### Sprint 2: AI Content Generation (2-3 days)
1. [ ] Update `DayPlannerAgent` prompt to generate:
   - Personalized intro (headline + summary)
   - Day themes
   - Trip narrative
   - Trip style profile
2. [ ] Parse AI response for new fields
3. [ ] Include in route response

### Sprint 3: Core UI Components (3-4 days)
1. [ ] `PersonalizedTripIntro` component
2. [ ] `WhyThisBadge` component (inline + expanded)
3. [ ] `DayThemeHeader` component
4. [ ] `MatchScoreIndicator` component
5. [ ] Factor pill mapping (factor -> emoji + label)

### Sprint 4: Advanced UI Components (2-3 days)
1. [ ] `TripStyleVisualization` component
2. [ ] `TripNarrative` component (collapsible)
3. [ ] Expand/collapse animations
4. [ ] Mobile responsiveness

### Sprint 5: AI Companion + Polish (2 days)
1. [ ] Update `AgentProvider` system prompt
2. [ ] Test companion responses reference preferences
3. [ ] Polish animations and transitions
4. [ ] End-to-end testing

---

## Design System

### Colors (Warm Editorial Palette)
```css
--personalization-primary: #C45830;     /* Terracotta */
--personalization-secondary: #D4A853;   /* Gold */
--personalization-bg: #FEF3EE;          /* Warm cream */
--personalization-text: #2C2417;        /* Warm black */
--personalization-muted: #8B7355;       /* Warm grey */

/* Factor pill colors by category */
--factor-occasion: #E8B4B8;    /* Soft rose */
--factor-interest: #B8D4E8;    /* Soft blue */
--factor-dining: #E8D4B8;      /* Soft amber */
--factor-style: #D4E8B8;       /* Soft green */
--factor-special: #D4B8E8;     /* Soft purple */
```

### Factor Emoji Mapping
```typescript
const FACTOR_DISPLAY: Record<PersonalizationFactor, { emoji: string; label: string }> = {
  // Occasions
  'occasion_honeymoon': { emoji: '💑', label: 'Honeymoon' },
  'occasion_anniversary': { emoji: '💕', label: 'Anniversary' },
  'occasion_birthday': { emoji: '🎂', label: 'Birthday' },
  'occasion_family': { emoji: '👨‍👩‍👧‍👦', label: 'Family Trip' },

  // Interests
  'interest_art': { emoji: '🎨', label: 'Art' },
  'interest_history': { emoji: '🏛️', label: 'History' },
  'interest_nature': { emoji: '🌿', label: 'Nature' },
  'interest_food': { emoji: '🍽️', label: 'Culinary' },
  'interest_wine': { emoji: '🍷', label: 'Wine' },
  'interest_photography': { emoji: '📸', label: 'Photography' },
  'interest_architecture': { emoji: '🏰', label: 'Architecture' },
  'interest_adventure': { emoji: '🧗', label: 'Adventure' },
  'interest_wellness': { emoji: '🧘', label: 'Wellness' },
  'interest_nightlife': { emoji: '🌙', label: 'Nightlife' },
  'interest_shopping': { emoji: '🛍️', label: 'Shopping' },

  // Dining
  'dining_street': { emoji: '🥡', label: 'Street Food' },
  'dining_casual': { emoji: '🍕', label: 'Casual' },
  'dining_fine': { emoji: '🍾', label: 'Fine Dining' },

  // Style
  'style_relaxer': { emoji: '🚶', label: 'Relaxed' },
  'style_explorer': { emoji: '🧭', label: 'Explorer' },
  'style_culture': { emoji: '📚', label: 'Culture' },
  'style_adventurer': { emoji: '⛰️', label: 'Adventurer' },
  'style_foodie': { emoji: '👨‍🍳', label: 'Foodie' },

  // Budget
  'budget_budget': { emoji: '💰', label: 'Budget' },
  'budget_mid': { emoji: '💰💰', label: 'Mid-Range' },
  'budget_luxury': { emoji: '💎', label: 'Luxury' },

  // Special
  'avoid_crowds': { emoji: '🤫', label: 'Crowd-Free' },
  'prefer_outdoor': { emoji: '☀️', label: 'Outdoor' },
  'accessibility': { emoji: '♿', label: 'Accessible' },

  // From trip story
  'trip_story': { emoji: '✨', label: 'From Your Story' },
};
```

---

## Success Metrics

1. **User Recognition**: Users should be able to point to specific elements that reflect their input
2. **Delight Factor**: "Wow, they really understood what I wanted"
3. **Trust Building**: Users trust recommendations more when they see the reasoning
4. **Engagement**: Users explore more activities when they understand the match

---

## Non-Breaking Guarantees

- All new features are **additive** - existing views work without personalization data
- Components check for presence of new data before rendering
- Backend changes are backwards-compatible
- No changes to existing API contracts (only additions)

---

## File Changes Summary

### New Files (Frontend)
```
spotlight-react/src/components/spotlight/v2/
├── PersonalizedTripIntro.tsx
├── WhyThisBadge.tsx
├── DayThemeHeader.tsx
├── MatchScoreIndicator.tsx
├── TripStyleVisualization.tsx
├── TripNarrative.tsx
├── FactorPill.tsx
└── personalization-visibility/
    └── index.ts
```

### Modified Files (Frontend)
```
spotlight-react/src/
├── components/spotlight/v2/SpotlightV2.tsx    # Integration
├── contexts/AgentProvider.tsx                  # Companion awareness
├── stores/spotlightStoreV2.ts                  # New types
└── types/index.ts                              # New interfaces
```

### Modified Files (Backend)
```
server/
├── agents/DayPlannerAgent.js                   # Generate intro/themes/narrative
├── agents/discovery/GooglePlacesDiscoveryAgent.js  # Track match reasons
├── agents/discovery/GooglePlacesRestaurantAgent.js # Track match reasons
├── agents/AgentOrchestratorV3.js               # Flow data through
└── routes/itinerary.js                         # Include in response
```

---

## Open Questions

1. **Match score calculation**: Should we show raw points or normalize to 0-100%?
2. **Narrative length**: How long should the trip narrative be? Collapsible?
3. **Factor pill limit**: Show top 3? Top 5? All?
4. **Mobile layout**: Stack vertically or use carousel for factor pills?
5. **Animation budget**: How much motion is too much?

---

## Appendix: Example Output

### User Input
```json
{
  "tripStory": "Celebrating our 10th anniversary. We fell in love in Italy and want to recreate that magic, but with better restaurants this time!",
  "occasion": "anniversary",
  "travelStyle": "relaxer",
  "pace": 2,
  "interests": ["food", "wine", "art", "architecture"],
  "diningStyle": "fine",
  "budget": "luxury",
  "avoidCrowds": true
}
```

### Generated Output
```json
{
  "personalizedIntro": {
    "headline": "Recreating the Magic of Your Italian Love Story",
    "summary": "Ten years later, you're returning to where it all began — but this time with Michelin stars and private wine cellars. We've crafted a leisurely week through Tuscany with romantic sunsets, crowd-free galleries, and the finest tables in Florence. Just like you asked, no early mornings and no tour groups.",
    "highlightedFactors": [
      "occasion_anniversary",
      "interest_wine",
      "interest_art",
      "dining_fine",
      "avoid_crowds"
    ]
  },
  "tripStyleProfile": {
    "explorerVsRelaxer": 75,
    "budgetVsLuxury": 90,
    "mainstreamVsHidden": 55,
    "packedVsLeisurely": 80
  },
  "days": [
    {
      "dayNumber": 1,
      "city": "Florence",
      "theme": "Romantic Arrival",
      "themeEmoji": "💑",
      "activities": [
        {
          "name": "Enoteca Pinchiorri",
          "description": "Three Michelin stars of pure Italian excellence",
          "matchScore": 95,
          "matchReasons": [
            {
              "factor": "dining_fine",
              "contribution": 20,
              "explanation": "Michelin-starred fine dining, exactly what you wanted"
            },
            {
              "factor": "occasion_anniversary",
              "contribution": 15,
              "explanation": "Intimate setting perfect for celebrating 10 years"
            },
            {
              "factor": "interest_wine",
              "contribution": 15,
              "explanation": "Legendary wine cellar with 4,000+ labels"
            }
          ],
          "personalizedNote": "We reserved the terrace table for your anniversary dinner"
        }
      ]
    }
  ],
  "tripNarrative": "Your return to Italy begins exactly as a love story should — with afternoon light streaming through the shutters of your suite at Palazzo Niccolini. Ten years ago, you fell in love here. This time, we're making sure every moment matches that memory.\n\nWe've kept your mornings free (you mentioned hating early starts), so there's no alarm clock, just espresso whenever you wake. The Uffizi awaits at 2pm, when the crowds thin and you can stand before Botticelli's Venus in relative peace — just the two of you and the masterpiece.\n\nDinner tonight is at Enoteca Pinchiorri, where the sommelier knows you're celebrating a decade together. The tasting menu changes seasonally, but the romance is timeless..."
}
```
