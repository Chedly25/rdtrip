# Living Travel Companion - Master Implementation Plan

## The Vision

**The detailed itinerary is the brain. The companion is the voice.**

The detailed itinerary contains all the raw data - every restaurant, every museum, every hidden gem. But during a trip, users shouldn't have to wade through it. The Travel Companion becomes THE interface - an intelligent layer that surfaces the right thing at the right moment.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   DETAILED ITINERARY              TRAVEL COMPANION              │
│   ══════════════════              ════════════════              │
│                                                                 │
│   The Database                    The Intelligence              │
│   (all options)                   (curated, contextual)         │
│                                                                 │
│   User access: Reference          User access: PRIMARY          │
│   When: Planning, review          When: ALWAYS during trip      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRIP BRAIN SERVICE                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    RAW ITINERARY DATA                        ││
│  │  (activities, restaurants, hotels, scenic spots, etc.)       ││
│  └─────────────────────────────────────────────────────────────┘│
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 INTELLIGENCE PIPELINE                        ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            ││
│  │  │ Time    │ │Location │ │Preference│ │ Weather │            ││
│  │  │ Filter  │ │ Filter  │ │ Score   │ │ Check   │            ││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            ││
│  └─────────────────────────────────────────────────────────────┘│
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  ENRICHMENT LAYER                            ││
│  │  • "Why Now" reasoning                                       ││
│  │  • Contextual tips                                           ││
│  │  • Distance calculations                                     ││
│  │  • Insider knowledge                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                              ↓                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │               COMPANION UI (Pocket Local)                    ││
│  │  Choice Mode | Experience Mode | Craving Mode | etc.         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Companion Modes

| Mode | Trigger | What It Does |
|------|---------|--------------|
| **Choice** | Default | "What calls to you?" - 3 curated options |
| **Experience** | User selects | Deep dive into one activity + tips |
| **Craving** | "I want..." | Instant contextual search ("I want sushi") |
| **Serendipity** | "Surprise me" | Hidden gem discovery |
| **Rest** | "I'm tired" | Nearby cafés, parks, hotels |
| **Full Picture** | "Show all" | Access to detailed itinerary |

---

## Work Items

### Epic 1: Trip Brain Service (Foundation)

The intelligence layer that powers everything.

---

#### WI-1.1: Create TripBrain TypeScript Types
**File**: `spotlight-react/src/services/tripBrain/types.ts`
**Effort**: Small
**Description**: Define all TypeScript interfaces for the Trip Brain system.

```typescript
// Types to define:
- TripBrainState
- EnrichedActivity (extends TimeSlot with scoring, distance, whyNow)
- UserPreferences
- LocationContext
- WeatherContext
- RecommendationScore
- WhyNowReason
```

**Acceptance Criteria**:
- [ ] All types defined and exported
- [ ] JSDoc comments on each interface
- [ ] Types are reusable across components

---

#### WI-1.2: Create TripBrain Core Service
**File**: `spotlight-react/src/services/tripBrain/tripBrain.ts`
**Effort**: Medium
**Description**: The main service that orchestrates all intelligence.

```typescript
class TripBrain {
  // State
  private activities: TimeSlot[];
  private userLocation: Coordinates | null;
  private preferences: UserPreferences;
  private completedIds: Set<string>;
  private skippedIds: Set<string>;

  // Core methods
  loadTripData(itineraryId: string): Promise<void>
  getRecommendations(count: number): EnrichedActivity[]
  recordChoice(activityId: string): void
  recordSkip(activityId: string, reason?: string): void
  searchCraving(query: string): EnrichedActivity[]
  getSerendipity(): EnrichedActivity
}
```

**Acceptance Criteria**:
- [ ] Service can load activities from itinerary
- [ ] Maintains user preferences in memory
- [ ] Tracks completed/skipped activities
- [ ] Exposes clean API for UI consumption

---

#### WI-1.3: Implement Time Filter
**File**: `spotlight-react/src/services/tripBrain/filters/timeFilter.ts`
**Effort**: Small (Already exists in PocketLocal, extract)
**Description**: Filter activities based on current time appropriateness.

```typescript
// Time periods and appropriate activity types
// Already implemented in PocketLocal.tsx - extract and enhance

const timeAppropriateTypes: Record<TimePeriod, string[]>
const nightlifeKeywords: string[]
const daylightOnlyKeywords: string[]

function isActivityAppropriate(activity: TimeSlot, hour: number): boolean
```

**Acceptance Criteria**:
- [ ] Extracted from PocketLocal.tsx
- [ ] No museums at night
- [ ] Nightlife keywords recognized
- [ ] Configurable time periods

---

#### WI-1.4: Implement Location Filter
**File**: `spotlight-react/src/services/tripBrain/filters/locationFilter.ts`
**Effort**: Medium
**Description**: Filter and score activities by distance from user.

```typescript
interface LocationFilterOptions {
  maxDistance: number; // meters
  userLocation: Coordinates;
}

function filterByDistance(activities: TimeSlot[], options: LocationFilterOptions): TimeSlot[]
function scoreByDistance(activity: TimeSlot, userLocation: Coordinates): number
function calculateDistance(a: Coordinates, b: Coordinates): number
function formatDistance(meters: number): string // "200m" or "1.2km"
```

**Acceptance Criteria**:
- [ ] Haversine formula for accurate distance
- [ ] Distance score (closer = higher)
- [ ] Human-readable distance formatting
- [ ] Configurable max distance

---

#### WI-1.5: Implement Preference Scorer
**File**: `spotlight-react/src/services/tripBrain/scoring/preferenceScorer.ts`
**Effort**: Medium
**Description**: Score activities based on learned user preferences.

```typescript
interface UserPreferences {
  preferredTypes: Record<string, number>; // { restaurant: 0.8, museum: 0.3 }
  avoidedTypes: string[];
  priceLevel: 1 | 2 | 3 | 4;
  keywords: string[]; // ["wine", "outdoor", "local"]
}

function buildPreferencesFromHistory(
  choices: string[],  // Activity IDs user chose
  skips: string[]     // Activity IDs user skipped
): UserPreferences

function scoreByPreferences(activity: TimeSlot, prefs: UserPreferences): number
```

**Acceptance Criteria**:
- [ ] Learns from user choices
- [ ] Learns from user skips
- [ ] Keyword matching
- [ ] Type preference weighting

---

#### WI-1.6: Implement Combined Scoring Algorithm
**File**: `spotlight-react/src/services/tripBrain/scoring/combinedScorer.ts`
**Effort**: Medium
**Description**: Combine all scores into final recommendation ranking.

```typescript
interface ScoringWeights {
  time: number;      // 0.25 - must be appropriate
  distance: number;  // 0.30 - closer is better
  preference: number; // 0.25 - matches user taste
  serendipity: number; // 0.10 - hidden gem bonus
  rating: number;    // 0.10 - quality indicator
}

function calculateFinalScore(
  activity: TimeSlot,
  context: {
    hour: number;
    userLocation: Coordinates;
    preferences: UserPreferences;
    weather?: string;
  }
): { score: number; breakdown: ScoreBreakdown }
```

**Acceptance Criteria**:
- [ ] Configurable weights
- [ ] Returns score breakdown for "why" layer
- [ ] Handles missing data gracefully
- [ ] Normalized 0-1 output

---

#### WI-1.7: Implement "Why Now" Generator
**File**: `spotlight-react/src/services/tripBrain/enrichment/whyNowGenerator.ts`
**Effort**: Medium
**Description**: Generate human-readable reasons for each recommendation.

```typescript
interface WhyNowReason {
  primary: string;    // "3 min walk from you"
  secondary?: string; // "Perfect for this time of day"
  tip?: string;       // "Locals love the terrace seats"
}

function generateWhyNow(
  activity: TimeSlot,
  scoreBreakdown: ScoreBreakdown,
  context: Context
): WhyNowReason

// Examples:
// - "3 min walk from you"
// - "Opens in 10 minutes - beat the crowd"
// - "You loved the last café we suggested"
// - "Hidden gem - 4.8 stars but only 47 reviews"
// - "Golden hour in 30 min - perfect for photos"
```

**Acceptance Criteria**:
- [ ] Distance-based reasons
- [ ] Time-based reasons
- [ ] Preference-based reasons
- [ ] Weather-based reasons
- [ ] Serendipity-based reasons

---

#### WI-1.8: Create Geolocation Hook
**File**: `spotlight-react/src/hooks/useGeolocation.ts`
**Effort**: Small
**Description**: React hook for user location tracking.

```typescript
interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
  watch?: boolean;
}

function useGeolocation(options?: UseGeolocationOptions): {
  location: Coordinates | null;
  error: GeolocationError | null;
  loading: boolean;
  refresh: () => void;
  permissionState: 'granted' | 'denied' | 'prompt';
}
```

**Acceptance Criteria**:
- [ ] Works on mobile browsers
- [ ] Handles permission denial gracefully
- [ ] Battery-efficient watching
- [ ] Manual refresh option

---

#### WI-1.9: Create TripBrain Context Provider
**File**: `spotlight-react/src/contexts/TripBrainContext.tsx`
**Effort**: Medium
**Description**: React context to provide TripBrain throughout the app.

```typescript
interface TripBrainContextValue {
  // State
  recommendations: EnrichedActivity[];
  loading: boolean;
  error: Error | null;
  userLocation: Coordinates | null;

  // Actions
  selectActivity: (id: string) => void;
  skipActivity: (id: string, reason?: string) => void;
  searchCraving: (query: string) => Promise<EnrichedActivity[]>;
  getSurprise: () => EnrichedActivity;
  refresh: () => void;
}

const TripBrainProvider: React.FC<{ tripId: string; children: React.ReactNode }>
const useTripBrain: () => TripBrainContextValue
```

**Acceptance Criteria**:
- [ ] Initializes TripBrain on mount
- [ ] Provides all actions to children
- [ ] Auto-refreshes on location change
- [ ] Persists preferences

---

### Epic 2: Companion UI Redesign

Transform PocketLocal into the intelligent companion.

---

#### WI-2.1: Refactor PocketLocal to Use TripBrain
**File**: `spotlight-react/src/components/trip/PocketLocal.tsx`
**Effort**: Medium
**Description**: Replace hardcoded logic with TripBrain service.

```typescript
// Current: PocketLocal has all logic internally
// Target: PocketLocal consumes TripBrain context

const PocketLocal: React.FC<Props> = () => {
  const {
    recommendations,
    selectActivity,
    skipActivity,
    userLocation,
  } = useTripBrain();

  // UI only - no business logic
}
```

**Acceptance Criteria**:
- [ ] All filtering/scoring moved to TripBrain
- [ ] Component is purely presentational
- [ ] Maintains current visual design
- [ ] Smoother, no duplicated state

---

#### WI-2.2: Add "Why Now" Display to Choice Cards
**File**: `spotlight-react/src/components/trip/PocketLocal.tsx`
**Effort**: Small
**Description**: Show the "why" for each recommendation.

```tsx
<ChoiceCard>
  <h3>Café de Flore</h3>
  <WhyNowBadge>
    <span className="primary">3 min walk</span>
    <span className="secondary">Opens in 10 min</span>
  </WhyNowBadge>
</ChoiceCard>
```

**Acceptance Criteria**:
- [ ] Primary reason always visible
- [ ] Secondary reason on expand/hover
- [ ] Visual hierarchy (distance prominent)
- [ ] Animated reveal

---

#### WI-2.3: Add Distance Badge to Cards
**File**: `spotlight-react/src/components/trip/PocketLocal.tsx`
**Effort**: Small
**Description**: Show walking distance/time on each card.

```tsx
<DistanceBadge>
  <WalkingIcon />
  <span>3 min</span>
</DistanceBadge>
```

**Acceptance Criteria**:
- [ ] Shows walking time (not just meters)
- [ ] Updates when location changes
- [ ] Graceful fallback if no location

---

#### WI-2.4: Add Craving Mode UI
**File**: `spotlight-react/src/components/trip/CravingMode.tsx`
**Effort**: Medium
**Description**: "I want sushi" instant search interface.

```tsx
interface CravingModeProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  results: EnrichedActivity[];
  loading: boolean;
}

// UI:
// - Text input with suggestions ("sushi", "coffee", "view", "quiet")
// - Quick chips for common cravings
// - Results appear below with distance
```

**Acceptance Criteria**:
- [ ] Text input with debounce
- [ ] Pre-defined quick chips
- [ ] Shows results with distance
- [ ] Smooth open/close animation

---

#### WI-2.5: Add Craving Quick Chips
**File**: `spotlight-react/src/components/trip/CravingChips.tsx`
**Effort**: Small
**Description**: Quick tap chips for common cravings.

```tsx
const cravings = [
  { label: "Coffee", icon: Coffee, keywords: ["café", "coffee", "espresso"] },
  { label: "Sushi", icon: Fish, keywords: ["sushi", "japanese"] },
  { label: "Wine", icon: Wine, keywords: ["wine", "bar"] },
  { label: "View", icon: Mountain, keywords: ["scenic", "viewpoint"] },
  { label: "Quiet", icon: Leaf, keywords: ["park", "garden"] },
];
```

**Acceptance Criteria**:
- [ ] 5-6 common cravings
- [ ] Icons for each
- [ ] Tapping triggers search
- [ ] Scrollable horizontally

---

#### WI-2.6: Add Serendipity Mode
**File**: `spotlight-react/src/components/trip/SerendipityMode.tsx`
**Effort**: Medium
**Description**: "Surprise me" discovery interface.

```tsx
// Triggered by: Shake phone, tap button, or swipe gesture
// Shows: One hidden gem with dramatic reveal

interface SerendipityModeProps {
  activity: EnrichedActivity;
  onAccept: () => void;
  onReject: () => void; // Get another surprise
}

// UI:
// - Full screen takeover
// - Photo with overlay
// - "Why this is special" text
// - Accept / Another buttons
```

**Acceptance Criteria**:
- [ ] Dramatic entrance animation
- [ ] Shows "why special" not just "why now"
- [ ] Can request another surprise
- [ ] Prioritizes hidden gems

---

#### WI-2.7: Add Rest Mode
**File**: `spotlight-react/src/components/trip/RestMode.tsx`
**Effort**: Small
**Description**: "I'm tired" quick access to rest spots.

```tsx
// Shows: Nearby cafés, parks, benches, hotels (if staying there)
// Filtered for: Quiet, seated, low energy

interface RestModeProps {
  restSpots: EnrichedActivity[];
  onSelect: (activity: EnrichedActivity) => void;
}
```

**Acceptance Criteria**:
- [ ] Filters for rest-appropriate places
- [ ] Shows distance prominently
- [ ] Quick access from main UI
- [ ] Calming visual design

---

#### WI-2.8: Add Mode Switcher UI
**File**: `spotlight-react/src/components/trip/ModeSwitcher.tsx`
**Effort**: Medium
**Description**: Bottom bar or gesture system for switching modes.

```tsx
// Options:
// 1. Bottom tab bar (always visible)
// 2. Swipe gestures (left/right/up)
// 3. Floating action button with menu

// Modes accessible:
// - Choice (default)
// - Craving ("I want...")
// - Surprise ("Serendipity")
// - Rest ("I'm tired")
// - All ("Full picture")
```

**Acceptance Criteria**:
- [ ] All modes accessible
- [ ] Current mode indicator
- [ ] Smooth transitions
- [ ] Thumb-friendly on mobile

---

#### WI-2.9: Add Full Picture Mode (Detailed Itinerary Access)
**File**: `spotlight-react/src/components/trip/FullPictureMode.tsx`
**Effort**: Small
**Description**: Access to the full detailed itinerary from companion.

```tsx
// This is basically a link to the existing TripDayView
// But integrated into the companion flow

// Shows:
// - All activities for the day (not just top 3)
// - Timeline view
// - Can mark complete from here too
```

**Acceptance Criteria**:
- [ ] Shows all day activities
- [ ] Clearly labeled as "full view"
- [ ] Easy return to companion
- [ ] Maintains completed state

---

### Epic 3: Experience Mode Enhancement

Make the focused experience richer.

---

#### WI-3.1: Add Map Preview to Experience Mode
**File**: `spotlight-react/src/components/trip/ExperienceMode.tsx`
**Effort**: Medium
**Description**: Show small map with user location and destination.

```tsx
<MapPreview
  userLocation={userLocation}
  destination={activity.coordinates}
  walkingTime="3 min"
/>
```

**Acceptance Criteria**:
- [ ] Shows user + destination markers
- [ ] Walking route if possible
- [ ] Tappable to open full navigation
- [ ] Compact design

---

#### WI-3.2: Add "You're Here" Detection
**File**: `spotlight-react/src/hooks/useProximityDetection.ts`
**Effort**: Medium
**Description**: Detect when user arrives at activity location.

```typescript
function useProximityDetection(
  targetLocation: Coordinates,
  thresholdMeters: number = 50
): {
  isNearby: boolean;
  distance: number;
}

// When isNearby becomes true:
// - Prompt "You've arrived! How was it?"
// - Enable check-in features
```

**Acceptance Criteria**:
- [ ] Detects arrival within threshold
- [ ] Triggers arrival prompt
- [ ] Battery efficient
- [ ] Configurable threshold

---

#### WI-3.3: Add Arrival Prompt
**File**: `spotlight-react/src/components/trip/ArrivalPrompt.tsx`
**Effort**: Small
**Description**: Prompt shown when user arrives at location.

```tsx
<ArrivalPrompt>
  <h3>You're at Café de Flore!</h3>
  <p>How's it going?</p>
  <QuickReactions>
    <ReactionButton emoji="❤️" label="Love it" />
    <ReactionButton emoji="👍" label="Nice" />
    <ReactionButton emoji="😐" label="Meh" />
  </QuickReactions>
  <Button>I'm done here →</Button>
</ArrivalPrompt>
```

**Acceptance Criteria**:
- [ ] Shows on arrival detection
- [ ] Quick emoji reactions
- [ ] Updates preferences based on reaction
- [ ] Can dismiss

---

#### WI-3.4: Enhance Insider Tips with Context
**File**: `spotlight-react/src/services/tripBrain/enrichment/insiderTips.ts`
**Effort**: Medium
**Description**: Make insider tips contextual to time/weather/preferences.

```typescript
function getContextualTips(
  activity: TimeSlot,
  context: {
    timeOfDay: TimePeriod;
    weather?: string;
    userPreferences?: UserPreferences;
  }
): string[]

// Examples:
// Morning + café: "The croissants sell out by 9am. You're early enough."
// Evening + restaurant: "Ask for the terrace - sunset view is incredible."
// Rainy + museum: "Perfect timing. It's pouring outside."
```

**Acceptance Criteria**:
- [ ] Time-aware tips
- [ ] Weather-aware tips
- [ ] Preference-aware tips
- [ ] Rotate tips to avoid repetition

---

### Epic 4: Preference Learning

Make the companion smarter over time.

---

#### WI-4.1: Create Preference Storage
**File**: `spotlight-react/src/services/tripBrain/storage/preferenceStorage.ts`
**Effort**: Small
**Description**: Persist user preferences in localStorage.

```typescript
interface StoredPreferences {
  tripId: string;
  choices: Array<{ activityId: string; type: string; timestamp: number }>;
  skips: Array<{ activityId: string; type: string; reason?: string; timestamp: number }>;
  ratings: Array<{ activityId: string; rating: number; timestamp: number }>;
  computedPrefs: UserPreferences;
}

const preferenceStorage = {
  save(tripId: string, prefs: StoredPreferences): void,
  load(tripId: string): StoredPreferences | null,
  clear(tripId: string): void,
}
```

**Acceptance Criteria**:
- [ ] Persists across sessions
- [ ] Per-trip storage
- [ ] Efficient read/write
- [ ] Clear on trip end

---

#### WI-4.2: Track User Choices
**File**: `spotlight-react/src/services/tripBrain/learning/choiceTracker.ts`
**Effort**: Small
**Description**: Track which activities user selects.

```typescript
function trackChoice(activityId: string, activityType: string): void
function getChoiceHistory(): Choice[]
function getTypePreferences(): Record<string, number> // { restaurant: 0.8, museum: 0.3 }
```

**Acceptance Criteria**:
- [ ] Records every selection
- [ ] Computes type preferences
- [ ] Updates in real-time

---

#### WI-4.3: Track User Skips
**File**: `spotlight-react/src/services/tripBrain/learning/skipTracker.ts`
**Effort**: Small
**Description**: Track which activities user skips and why.

```typescript
interface Skip {
  activityId: string;
  activityType: string;
  reason?: 'not_interested' | 'too_far' | 'wrong_time' | 'weather' | 'other';
  timestamp: number;
}

function trackSkip(skip: Skip): void
function getSkipPatterns(): { types: string[]; reasons: Record<string, number> }
```

**Acceptance Criteria**:
- [ ] Optional skip reason
- [ ] Computes patterns
- [ ] Influences future recommendations

---

#### WI-4.4: Integrate Learning into Scoring
**File**: `spotlight-react/src/services/tripBrain/scoring/learningIntegration.ts`
**Effort**: Medium
**Description**: Use learned preferences in recommendation scoring.

```typescript
function adjustScoresWithLearning(
  activities: EnrichedActivity[],
  choiceHistory: Choice[],
  skipHistory: Skip[]
): EnrichedActivity[]

// Examples of adjustments:
// - User chose 3 wine bars → boost wine bars
// - User skipped 2 museums → reduce museums
// - User always chooses closest → boost distance weight
```

**Acceptance Criteria**:
- [ ] Boosts preferred types
- [ ] Reduces skipped types
- [ ] Adapts weights dynamically
- [ ] Doesn't over-fit (keeps variety)

---

### Epic 5: Real-Time Intelligence

Make the companion responsive to context.

---

#### WI-5.1: Add Weather Awareness
**File**: `spotlight-react/src/services/tripBrain/context/weatherContext.ts`
**Effort**: Medium
**Description**: Factor weather into recommendations.

```typescript
interface WeatherContext {
  condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'hot' | 'cold';
  temperature: number;
  forecast: { hour: number; condition: string }[];
}

async function getWeatherContext(location: Coordinates): Promise<WeatherContext>
function filterForWeather(activities: TimeSlot[], weather: WeatherContext): TimeSlot[]
function getWeatherTip(activity: TimeSlot, weather: WeatherContext): string | null
```

**Acceptance Criteria**:
- [ ] Fetches current weather
- [ ] Filters outdoor activities in rain
- [ ] Generates weather tips
- [ ] Caches to reduce API calls

---

#### WI-5.2: Add Time-Sensitive Alerts
**File**: `spotlight-react/src/components/trip/TimeAlert.tsx`
**Effort**: Small
**Description**: Alert user to time-sensitive opportunities.

```tsx
<TimeAlert
  message="Golden hour in 30 min - perfect for photos at the viewpoint"
  urgency="medium"
  action={{ label: "Go now", onPress: () => {} }}
  expiresIn={30} // minutes
/>
```

**Acceptance Criteria**:
- [ ] Countdown display
- [ ] Urgency-based styling
- [ ] Dismissible
- [ ] Action button

---

#### WI-5.3: Add "Leave Now" Suggestions
**File**: `spotlight-react/src/services/tripBrain/timing/departureCalculator.ts`
**Effort**: Medium
**Description**: Suggest optimal departure times.

```typescript
function calculateDepartureTime(
  currentLocation: Coordinates,
  destination: Coordinates,
  targetArrivalTime: string, // "14:00"
  walkingSpeed: number = 5 // km/h
): {
  departAt: string;
  walkingTime: number; // minutes
  arriveBy: string;
}

function shouldSuggestDeparture(
  activity: TimeSlot,
  userLocation: Coordinates
): { suggest: boolean; message: string; urgency: 'low' | 'medium' | 'high' }
```

**Acceptance Criteria**:
- [ ] Calculates walking time
- [ ] Suggests when to leave
- [ ] Accounts for "best time to arrive"
- [ ] Urgency-based prompts

---

### Epic 6: Serendipity Engine

Surprise discoveries that make travel magical.

---

#### WI-6.1: Create Hidden Gem Scorer
**File**: `spotlight-react/src/services/tripBrain/serendipity/hiddenGemScorer.ts`
**Effort**: Medium
**Description**: Identify activities that are hidden gems.

```typescript
function scoreHiddenGem(activity: TimeSlot): number
// Higher score = more hidden gem-like

// Factors:
// - High rating (4.5+) but low review count (<100)
// - Not a common tourist attraction
// - Unusual activity type
// - Has "insider" keywords in description
```

**Acceptance Criteria**:
- [ ] Identifies quality + obscurity
- [ ] Avoids tourist traps
- [ ] Favors unusual types
- [ ] Normalized scoring

---

#### WI-6.2: Create Serendipity Algorithm
**File**: `spotlight-react/src/services/tripBrain/serendipity/serendipityAlgorithm.ts`
**Effort**: Medium
**Description**: Select the perfect surprise activity.

```typescript
function selectSerendipity(
  activities: EnrichedActivity[],
  context: Context,
  history: { seen: string[]; rejected: string[] }
): EnrichedActivity

// Algorithm:
// 1. Filter for time-appropriate
// 2. Filter for reasonable distance
// 3. Exclude already seen/rejected
// 4. Score by hidden gem score
// 5. Add randomness (don't always pick top)
// 6. Return winner
```

**Acceptance Criteria**:
- [ ] Never repeats shown gems
- [ ] Respects time/distance
- [ ] Balances quality + randomness
- [ ] Has "reject and get another" support

---

#### WI-6.3: Add "Why Special" Text Generation
**File**: `spotlight-react/src/services/tripBrain/serendipity/whySpecialGenerator.ts`
**Effort**: Small
**Description**: Generate compelling text for surprises.

```typescript
function generateWhySpecial(activity: TimeSlot): string

// Examples:
// "A local secret with a cult following"
// "Missed by most tourists, loved by locals"
// "The kind of place you'll tell friends about"
// "4.9 stars from only 42 reviews - they're onto something"
```

**Acceptance Criteria**:
- [ ] Compelling, short text
- [ ] Based on activity data
- [ ] Varied language
- [ ] Feels authentic

---

### Epic 7: UI Polish & Animations

Make it feel magical.

---

#### WI-7.1: Add Staggered Card Entrance Animation
**Effort**: Small
**Description**: Cards fade/slide in sequence.

**Acceptance Criteria**:
- [ ] 0.1s delay between cards
- [ ] Smooth spring physics
- [ ] Works on initial load and mode switch

---

#### WI-7.2: Add Pull-to-Refresh Animation
**Effort**: Small
**Description**: Custom pull-to-refresh with brand flair.

**Acceptance Criteria**:
- [ ] Custom refresh indicator
- [ ] Haptic feedback (if available)
- [ ] Smooth release animation

---

#### WI-7.3: Add Mode Transition Animations
**Effort**: Medium
**Description**: Smooth transitions between companion modes.

**Acceptance Criteria**:
- [ ] Crossfade between modes
- [ ] Shared element transitions where possible
- [ ] No jarring jumps

---

#### WI-7.4: Add Haptic Feedback
**Effort**: Small
**Description**: Subtle haptics on key interactions.

```typescript
const haptics = {
  selection: () => vibrate(10),
  success: () => vibrate([10, 50, 10]),
  arrival: () => vibrate([50, 100, 50]),
}
```

**Acceptance Criteria**:
- [ ] Works on supported devices
- [ ] Silent fallback
- [ ] Not overused

---

#### WI-7.5: Add Skeleton Loading States
**Effort**: Small
**Description**: Skeleton UI while loading.

**Acceptance Criteria**:
- [ ] Card skeletons
- [ ] Animated shimmer
- [ ] Matches card dimensions

---

### Epic 8: Integration & Testing

Wire everything together.

---

#### WI-8.1: Integrate TripBrain with LiveTripPanel
**Effort**: Medium
**Description**: Replace current data flow with TripBrain.

**Acceptance Criteria**:
- [ ] LiveTripPanel uses TripBrainProvider
- [ ] All child components receive context
- [ ] No breaking changes to navigation

---

#### WI-8.2: Add Error Boundaries
**Effort**: Small
**Description**: Graceful error handling.

**Acceptance Criteria**:
- [ ] Catches component errors
- [ ] Shows friendly fallback
- [ ] Allows retry

---

#### WI-8.3: Add Analytics Events
**Effort**: Small
**Description**: Track key user interactions.

```typescript
// Events to track:
// - companion_mode_switch
// - activity_selected
// - activity_skipped
// - craving_search
// - serendipity_accepted
// - serendipity_rejected
// - arrival_detected
```

**Acceptance Criteria**:
- [ ] All key events tracked
- [ ] Includes relevant metadata
- [ ] Privacy-conscious

---

#### WI-8.4: Performance Optimization
**Effort**: Medium
**Description**: Ensure smooth 60fps experience.

**Acceptance Criteria**:
- [ ] No jank on scroll
- [ ] Fast mode switches
- [ ] Efficient re-renders
- [ ] Memoized expensive calculations

---

## Implementation Order

### Phase 1: Foundation (WI 1.1 - 1.9)
Build the Trip Brain service and core infrastructure.

### Phase 2: Core UI (WI 2.1 - 2.4)
Integrate Trip Brain with existing UI, add Why Now.

### Phase 3: Modes (WI 2.5 - 2.9)
Add Craving, Serendipity, Rest, Full Picture modes.

### Phase 4: Experience Enhancement (WI 3.1 - 3.4)
Enhance the focused activity experience.

### Phase 5: Learning (WI 4.1 - 4.4)
Add preference learning system.

### Phase 6: Real-Time (WI 5.1 - 5.3)
Add weather and time intelligence.

### Phase 7: Serendipity (WI 6.1 - 6.3)
Build the surprise discovery engine.

### Phase 8: Polish (WI 7.1 - 7.5, 8.1 - 8.4)
Animations, haptics, and integration.

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time in companion | Unknown | 5+ min per session |
| Activities selected via companion | 0% | 80%+ |
| Craving searches used | 0 | 3+ per trip |
| Serendipity acceptances | N/A | 40%+ |
| Return to detailed itinerary | 100% | <30% |
| User satisfaction | Unknown | 4.5+ stars |

---

## Tech Stack

- **State Management**: React Context + hooks (no Redux needed)
- **Storage**: localStorage for preferences
- **Geolocation**: Browser Geolocation API
- **Animations**: Framer Motion (already installed)
- **Weather**: OpenWeather API (free tier)
- **Distance Calc**: Haversine formula (client-side)

---

## Notes

1. **Detailed itinerary stays accessible** - It's the "Full Picture" mode, not hidden
2. **Mobile-first design** - This is a phone experience
3. **Offline-capable** - Cache itinerary data, work without network
4. **Battery conscious** - Smart location watching, not continuous
5. **Progressive enhancement** - Works without location, better with it

---

*This plan transforms the trip companion from a task list into an intelligent friend who knows what you need before you do.*
