# rdtrip Travel Planner Vision

## The Problem

The current City Intelligence shows users **information about places** but doesn't help them **actually plan their trip**. It's passive content consumption, not active trip building.

Users need to:
- Schedule activities across their days
- Pick restaurants for specific meals
- Prioritize what's worth their limited time
- Build a real itinerary they can follow

## The Solution: Card-Based Trip Planner

A dedicated planning experience where users build their trip using **draggable cards** with an **AI companion** that generates suggestions on demand.

### Core Concepts

1. **Activity Cards**: Each restaurant, activity, viewpoint, etc. is a card
2. **Day Timeline**: Each day of the trip has time slots to fill
3. **Drag & Drop**: Users drag cards onto their timeline
4. **Generative AI**: Users can ask for more options anytime
5. **Smart Companion**: AI proactively helps fill gaps and optimize

### The Planning Flow

```
Discovery → Route Generated → Enter Planner → Build Itinerary → Start Trip
              (existing)        (NEW)           (NEW)          (existing)
```

### UI Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Your Trip: Paris → Marseille → Barcelona          [Save] [Share] [Export]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐                                                           │
│   │ MARSEILLE   │  ← City selector (tabs for each city in route)            │
│   │ 2 nights    │                                                           │
│   └─────────────┘                                                           │
│                                                                             │
│   ┌───────────────────────────────┬─────────────────────────────────────┐   │
│   │                               │                                     │   │
│   │     YOUR ITINERARY            │      SUGGESTIONS                    │   │
│   │                               │                                     │   │
│   │   ┌─────────────────────┐     │    ┌─────────────────────────────┐  │   │
│   │   │ DAY 1 · Sat Dec 14  │     │    │ 🍽️ RESTAURANTS              │  │   │
│   │   │                     │     │    │                             │  │   │
│   │   │  2:00 PM            │     │    │  ┌─────────┐  ┌─────────┐   │  │   │
│   │   │  ┌───────────────┐  │     │    │  │ Chez    │  │ AM by   │   │  │   │
│   │   │  │ 🏨 Arrive     │  │     │    │  │ Fonfon  │  │ Peron   │   │  │   │
│   │   │  │ Check into    │  │     │    │  │ €€€     │  │ €€€€    │   │  │   │
│   │   │  │ hotel         │  │     │    │  │ Seafood │  │ Fine    │   │  │   │
│   │   │  └───────────────┘  │     │    │  │ [+]     │  │ [+]     │   │  │   │
│   │   │                     │     │    │  └─────────┘  └─────────┘   │  │   │
│   │   │  4:00 PM            │     │    │                             │  │   │
│   │   │  ┌───────────────┐  │     │    │  [🔄 Show more restaurants] │  │   │
│   │   │  │ 🚶 Le Panier  │  │     │    │                             │  │   │
│   │   │  │ Historic walk │  │     │    └─────────────────────────────┘  │   │
│   │   │  │ ~2 hours      │  │     │                                     │   │
│   │   │  └───────────────┘  │     │    ┌─────────────────────────────┐  │   │
│   │   │                     │     │    │ 📸 PHOTO SPOTS              │  │   │
│   │   │  7:00 PM            │     │    │                             │  │   │
│   │   │  ┌───────────────┐  │     │    │  ┌─────────┐  ┌─────────┐   │  │   │
│   │   │  │ ➕ Add dinner │  │     │    │  │ Vallon  │  │ Corniche│   │  │   │
│   │   │  │               │◄─┼─drag─┼───│  │ Sunset  │  │ Walk    │   │  │   │
│   │   │  │               │  │     │    │  │ 6:30pm  │  │ Anytime │   │  │   │
│   │   │  └───────────────┘  │     │    │  │ [+]     │  │ [+]     │   │  │   │
│   │   │                     │     │    │  └─────────┘  └─────────┘   │  │   │
│   │   └─────────────────────┘     │    │                             │  │   │
│   │                               │    │  [🔄 Show more spots]       │  │   │
│   │   ┌─────────────────────┐     │    └─────────────────────────────┘  │   │
│   │   │ DAY 2 · Sun Dec 15  │     │                                     │   │
│   │   │                     │     │    ┌─────────────────────────────┐  │   │
│   │   │  9:00 AM            │     │    │ ✨ EXPERIENCES              │  │   │
│   │   │  ┌───────────────┐  │     │    │                             │  │   │
│   │   │  │ ➕ Morning    │  │     │    │  ┌─────────┐  ┌─────────┐   │  │   │
│   │   │  │    activity   │  │     │    │  │ Château │  │ Calanque│   │  │   │
│   │   │  └───────────────┘  │     │    │  │ d'If    │  │ Boat    │   │  │   │
│   │   │                     │     │    │  │ ~2hrs   │  │ ~4hrs   │   │  │   │
│   │   │  12:00 PM           │     │    │  │ [+]     │  │ [+]     │   │  │   │
│   │   │  ┌───────────────┐  │     │    │  └─────────┘  └─────────┘   │  │   │
│   │   │  │ 🚗 Depart for │  │     │    │                             │  │   │
│   │   │  │    Barcelona  │  │     │    │  [🔄 Show more experiences] │  │   │
│   │   │  └───────────────┘  │     │    └─────────────────────────────┘  │   │
│   │   │                     │     │                                     │   │
│   │   └─────────────────────┘     │                                     │   │
│   │                               │                                     │   │
│   └───────────────────────────────┴─────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   🤖 COMPANION                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ "I noticed you haven't planned dinner for Day 1. Based on your     │   │
│   │  preference for romantic spots, I'd suggest Chez Fonfon at the     │   │
│   │  Vallon des Auffes - it's a 10min walk from Le Panier and has      │   │
│   │  waterfront seating perfect for sunset. Want me to add it?"        │   │
│   │                                                                     │   │
│   │  [Add to Day 1 at 7pm]  [Show me alternatives]  [I'll decide later]│   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Ask the companion: [Find me a wine bar near Le Panier_____________] [→]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Card Types

**Restaurant Card**
- Name, cuisine, price range (€-€€€€)
- Why it's special (1-2 lines)
- Best for: "Romantic dinner" / "Quick lunch" / "Special occasion"
- Practical: Hours, reservation needed?, address
- Actions: [Add to plan] [More like this] [Not interested]

**Activity Card**
- Name, duration, cost
- What makes it special
- Best time to go
- Practical: Address, tickets needed?
- Actions: [Add to plan] [More like this] [Not interested]

**Photo Spot Card**
- Location name
- Best time (golden hour, blue hour, etc.)
- What you'll capture
- Practical: How to get there
- Actions: [Add to plan] [More like this] [Not interested]

### Companion Capabilities

The AI companion should be able to:

1. **Generate on demand**: "Show me 5 more restaurants in Le Panier"
2. **Answer questions**: "What's the best way to get to Calanques?"
3. **Optimize schedules**: "Can you reorganize Day 1 to avoid backtracking?"
4. **Handle contingencies**: "What should we do if it rains?"
5. **Provide context**: "Is Chez Fonfon actually worth €80pp?"
6. **Learn preferences**: Remember what users liked/disliked

### Regeneration System

Users should never feel stuck with bad suggestions. Every section has:

1. **[🔄 Show more]**: Generate 5 more options in this category
2. **[More like this]**: On any card, generate similar options
3. **[Not interested]**: Dismiss + AI learns to avoid similar
4. **Ask companion**: Freeform request for anything specific

### Smart Features

**Auto-scheduling**
- AI considers opening hours, travel time, meal times
- Suggests optimal order for activities
- Warns about conflicts ("Chez Fonfon closes at 2pm on Sundays")

**Weather-aware**
- If rain forecasted, suggest indoor alternatives
- Recommend outdoor activities for sunny slots

**Budget tracking**
- Running total of estimated costs
- Filter by price range

**Time estimation**
- Each card shows duration
- Timeline shows if you're over-scheduled

### Data Model

```typescript
interface TripPlan {
  id: string;
  userId: string;
  route: Route; // The discovered route
  cities: CityPlan[];
  createdAt: Date;
  updatedAt: Date;
}

interface CityPlan {
  cityId: string;
  city: CityData;
  days: DayPlan[];
  savedCards: PlanCard[]; // Cards saved but not scheduled
}

interface DayPlan {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

interface TimeSlot {
  id: string;
  startTime: string; // HH:MM
  endTime?: string;
  card?: PlanCard;
  isEmpty: boolean;
}

interface PlanCard {
  id: string;
  type: 'restaurant' | 'activity' | 'photo_spot' | 'transport' | 'accommodation';
  name: string;
  description: string;
  duration: number; // minutes
  cost?: { min: number; max: number; currency: string };
  bestTime?: string;
  address?: string;
  metadata: Record<string, any>;
  source: 'ai_generated' | 'user_added' | 'imported';
}
```

### Technical Implementation

**New API Endpoints**

```
POST /api/planner/generate-cards
  Body: { cityId, type, count, preferences, exclude: [] }
  Returns: PlanCard[]

POST /api/planner/ask-companion
  Body: { cityId, question, context: { currentPlan, preferences } }
  Returns: { response, suggestedCards?: PlanCard[] }

POST /api/planner/optimize-schedule
  Body: { cityPlan }
  Returns: { optimizedDays, changes, reasoning }

POST /api/planner/save-plan
  Body: { tripPlan }
  Returns: { id, savedAt }
```

**Frontend Components**

- `TripPlannerPage` - Main planner view
- `CityTabs` - Switch between cities
- `DayTimeline` - The schedule for a day
- `TimeSlot` - Individual time block (empty or filled)
- `SuggestionPanel` - Right side with card categories
- `PlanCard` - The draggable card component
- `CompanionChat` - The AI companion interface
- `CardGenerator` - "Show more" functionality

### Migration Path

1. **Phase 1**: Add "Plan This City" button to current preview
   - Opens planner view for single city
   - Basic card suggestions
   - Simple timeline

2. **Phase 2**: Full trip planner
   - Multi-city planning
   - Drag and drop
   - Smart scheduling

3. **Phase 3**: Advanced companion
   - Conversational planning
   - Learning from preferences
   - Real-time updates

### Design Principles

1. **Cards are the atomic unit** - Everything is a card
2. **AI generates, user decides** - Never auto-add to plan
3. **Always regeneratable** - Users are never stuck
4. **Context-aware** - Time, weather, preferences, budget
5. **Progressive disclosure** - Simple by default, depth available

### Example User Flow

1. User completes Discovery, has route: Paris → Marseille → Barcelona
2. Clicks "Plan Your Trip" → enters Planner
3. Sees Marseille tab (first stop after origin)
4. AI has pre-generated suggestions based on:
   - Their traveler type (couple)
   - Their nights (2)
   - Their preferences from discovery
5. User drags "Le Panier walking tour" to Day 1, 4pm
6. User asks companion: "What's a romantic dinner spot near Le Panier?"
7. Companion suggests 3 restaurants with context
8. User picks one, drags to 7pm slot
9. Companion notices gap, suggests sunset spot at 6pm
10. User completes Day 1, moves to Day 2
11. Repeat for each city
12. Export to calendar/Google Maps/PDF

### Success Metrics

- % of users who enter planner after discovery
- Cards added per trip
- Regeneration rate (are initial suggestions good?)
- Companion questions asked
- Plans completed vs abandoned
- Time to complete a plan

---

## Next Steps

1. **Fix the "hidden gems" prompt** - Stop showing tourist attractions
2. **Design the card component** - The visual foundation
3. **Build the timeline component** - The scheduling backbone
4. **Create the suggestion panel** - Card generation UI
5. **Implement companion chat** - Conversational interface
6. **Add drag and drop** - The interaction pattern
7. **Connect to existing intelligence** - Use what we have
8. **Build new generation endpoints** - On-demand content
