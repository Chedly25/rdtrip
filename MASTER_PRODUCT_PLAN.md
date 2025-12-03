# Master Product Plan: Transforming rdtrip into a Complete Travel Companion

> A comprehensive roadmap to extend rdtrip from route planning into the full travel journey.

---

## Executive Summary

**Current State:** Users generate beautiful routes, but feel "locked in" after generation. The app serves only the planning phase.

**Target State:** A living travel companion that helps users Plan → Customize → Travel → Remember.

**Core Philosophy:** Every interaction should feel as easy as asking a friend to help.

---

## Legend

Throughout this document, features are marked as:
- ✅ **EXISTING** - Already implemented, DO NOT recreate
- 🔨 **ENHANCE** - Exists but needs improvements
- 🆕 **NEW** - Must be built from scratch

---

## Existing Feature Summary

**Before building anything, verify it doesn't exist!**

| Category | Existing Features |
|----------|------------------|
| **Route Editing** | Add City Modal, Add Landmark Modal, Drag & Drop Reorder, Store actions (updateCities, addLandmark, removeLandmark, reorderCities, updateCityNights) |
| **Personalization** | PersonalizationBadge, PersonalizationSummary, PersonalizedIntroBanner, WhyThisCard, MatchScoreIndicator, TripStyleVisualization |
| **Geocoding** | searchPlaces(), findOptimalInsertPosition() for detour calculation |
| **API** | deleteWaypoint() |

**Key Files to Check Before Building:**
- `spotlight-react/src/components/spotlight/v2/AddCityLandmarkModal.tsx`
- `spotlight-react/src/components/spotlight/v2/FloatingCityCards.tsx`
- `spotlight-react/src/stores/spotlightStoreV2.ts`
- `spotlight-react/src/components/spotlight/v2/PersonalizationBadge.tsx`

---

## Feature Roadmap Overview

| Phase | Feature | Core Value | Priority |
|-------|---------|------------|----------|
| **1** | Seamless Route Modification | "Change anything, anytime" | 🔴 Critical |
| **2** | Trip in Progress Mode | "Your companion during the trip" | 🔴 Critical |
| **3** | Personalization Visibility | "See why we chose this for you" | 🟡 High |
| **4** | Trip Memories & Sharing | "Relive and share your journey" | 🟡 High |
| **5** | Smart Packing List | "Never forget anything" | 🟢 Medium |
| **6** | Collaborative Planning | "Plan together, seamlessly" | 🟢 Medium |
| **7** | Budget Intelligence | "Know what you'll spend" | 🟢 Medium |

---

# Phase 1: Seamless Route Modification

## The Problem

After route generation, users feel stuck:
- "I don't like this city, but I can't change it without regenerating everything"
- "We have 2 fewer days now, what do I do?"
- "I want to add a beach day, where does it fit?"
- "This restaurant doesn't fit us, find something else"

## The Vision

Route modification should feel like editing a Google Doc with an AI assistant:
- Click anything → modify it instantly
- Ask in natural language → get smart suggestions
- Drag and drop → AI recalculates everything
- Change constraints → route adapts intelligently

## EXISTING FEATURES (DO NOT RECREATE)

### ✅ Add City & Landmark Modal
**File:** `spotlight-react/src/components/spotlight/v2/AddCityLandmarkModal.tsx`

**Already implemented:**
- Tabbed interface (City / Landmark)
- Debounced search with `searchPlaces()` geocoding
- Auto-calculates optimal insertion position via `findOptimalInsertPosition()`
- Shows detour distance and time before adding
- Adds landmarks with `addLandmark()` store action
- Adds cities with `updateCities()` store action

### ✅ Drag & Drop Reordering
**File:** `spotlight-react/src/components/spotlight/v2/FloatingCityCards.tsx`

**Already implemented:**
- Full @dnd-kit integration with `SortableCityCard` component
- Visual drag handles on city cards
- `useSortable` hook for drag mechanics
- Calls `reorderCities(oldIndex, newIndex)` store action
- Visual feedback during drag

### ✅ Store Actions for Modification
**File:** `spotlight-react/src/stores/spotlightStoreV2.ts`

**Already implemented:**
- `updateCities(cities)` - Update entire city array
- `addLandmark(landmark)` - Add landmark with detour info
- `removeLandmark(landmarkId)` - Remove landmark by ID
- `reorderCities(oldIndex, newIndex)` - Reorder cities
- `updateCityNights(cityName, nights)` - Change nights per city

### ✅ Delete Waypoint API
**File:** `spotlight-react/src/services/api.ts:96`

**Already implemented:**
- `deleteWaypoint(waypointId, tripId)` - DELETE endpoint for waypoints

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTE MODIFICATION SYSTEM                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   INLINE     │    │   NATURAL    │    │    DRAG &    │       │
│  │   EDITING    │    │   LANGUAGE   │    │     DROP     │       │
│  │   🔨 ENHANCE │    │   🆕 NEW     │    │   ✅ EXISTS  │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             ▼                                    │
│                 ┌───────────────────────┐                        │
│                 │   MODIFICATION API    │                        │
│                 │  /api/route/modify    │                        │
│                 │       🆕 NEW          │                        │
│                 └───────────┬───────────┘                        │
│                             ▼                                    │
│         ┌───────────────────────────────────────┐                │
│         │        AI RECOMMENDATION ENGINE       │                │
│         │  (Same system as route generation)    │                │
│         │            🆕 NEW                     │                │
│         └───────────────────┬───────────────────┘                │
│                             ▼                                    │
│                 ┌───────────────────────┐                        │
│                 │   ROUTE OPTIMIZER     │                        │
│                 │ (Recalculates order,  │                        │
│                 │  distances, times)    │                        │
│                 │       🆕 NEW          │                        │
│                 └───────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Sprint 1.1: Enhance Inline City Editing

**Goal:** Add missing UI for remove city + AI replacement suggestions.

#### 🔨 ENHANCE - City Action Menu (Add "Remove City" Button)

The FloatingCityCards already exist with drag & drop. We need to add:

```
File: spotlight-react/src/components/spotlight/v2/FloatingCityCards.tsx

ENHANCE with:
- "Remove City" button (X icon) on each city card
- Confirmation dialog before removal
- Call existing store action or new removeCity() method
- Update route totals after removal
```

#### 🆕 NEW - Backend Tasks

**1.1.1 Create Route Modification API**
```
File: server/routes/routeModification.js

Endpoints:
- POST /api/route/:routeId/modify/city
  Body: { action: 'replace' | 'remove' | 'add', cityIndex, newCityRequest?, position? }

- POST /api/route/:routeId/modify/duration
  Body: { cityIndex, newNights: number }

NOTE: Reorder already handled by existing frontend logic
```

**1.1.2 Create City Replacement Agent**
```
File: server/agents/CityReplacementAgent.js

Purpose: Given current route context + user request, suggest replacement cities

Input:
- Current route (all cities, preferences, personalization)
- City to replace
- User's reason/request (optional)

Output:
- 3-5 alternative cities with:
  - Why it fits the trip
  - How it affects the route (distance, time)
  - What makes it different from current
```

**1.1.3 Create Route Reoptimizer**
```
File: server/services/RouteReoptimizer.js

Purpose: After any modification, recalculate:
- Optimal city order (if changed)
- Driving distances and times
- Night distribution
- Total trip duration
```

#### 🆕 NEW - Frontend Tasks

**1.1.4 City Replacement Flow** (NEW - builds on existing modal pattern)
```
File: spotlight-react/src/components/route/CityReplacementSheet.tsx

Flow:
1. User clicks "Replace" on a city card (new action button)
2. Bottom sheet slides up (similar to AddCityLandmarkModal pattern)
3. Shows: "Tell us what you're looking for instead"
4. Options:
   - Quick suggestions (AI-generated alternatives)
   - Custom request input ("I want somewhere with beaches")
5. AI generates 3-5 options
6. User selects one
7. Route updates with animation
8. Toast: "Route updated! Florence → Bologna"

NOTE: Reuse existing modal styling from AddCityLandmarkModal
```

**1.1.5 Smart Suggestions Panel** (NEW)
```
File: spotlight-react/src/components/route/SmartSuggestions.tsx

Features:
- AI proactively suggests improvements
- "You're driving past X, want to add a quick stop?"
- "Based on your love of wine, consider replacing X with Y"
- Dismissible, learns from user behavior
```

#### 🆕 NEW - Database Tasks

**1.1.6 Route Modification History**
```sql
CREATE TABLE route_modifications (
  id UUID PRIMARY KEY,
  route_id UUID REFERENCES saved_routes(id),
  user_id UUID REFERENCES users(id),
  modification_type VARCHAR(50), -- 'city_replaced', 'city_added', 'city_removed', 'reordered', 'duration_changed'
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Sprint 1.2: Natural Language Route Commands (🆕 ALL NEW)

**Goal:** Users can modify routes by typing or speaking naturally.

#### Backend Tasks

**1.2.1 Natural Language Modification Parser**
```
File: server/agents/RouteCommandParser.js

Purpose: Parse natural language into structured modification commands

Examples:
- "Add a beach day after Rome" → { action: 'add', after: 'Rome', criteria: { type: 'beach' } }
- "Remove the last stop" → { action: 'remove', position: 'last' }
- "Swap Florence for somewhere less touristy" → { action: 'replace', city: 'Florence', criteria: { vibe: 'less touristy' } }
- "We have 2 fewer days" → { action: 'shorten', days: 2 }
- "Extend Rome by one night" → { action: 'duration', city: 'Rome', change: +1 }
```

**1.2.2 Constraint Change Handler**
```
File: server/agents/ConstraintChangeAgent.js

Purpose: Handle trip-wide constraint changes intelligently

Scenarios:
- Duration change: "We have 2 fewer days" → Suggest what to cut or compress
- Budget change: "Budget is tighter now" → Suggest swaps to cheaper alternatives
- Preference change: "We're now traveling with kids" → Flag incompatible recommendations
- Date change: "Moving trip to December" → Check seasonal considerations
```

#### Frontend Tasks

**1.2.3 Command Bar Component**
```
File: spotlight-react/src/components/route/CommandBar.tsx

Features:
- Floating command input (Cmd+K to open)
- AI-powered autocomplete
- Recent commands history
- Example prompts for guidance
- Voice input option (Phase 2)
```

**1.2.4 Modification Preview**
```
File: spotlight-react/src/components/route/ModificationPreview.tsx

Features:
- Before/after comparison
- Impact summary ("This adds 45 min driving, 1 night")
- "Apply" / "Try something else" / "Cancel"
- Animation showing what changes
```

### Sprint 1.3: Reorder Intelligence (🔨 ENHANCE EXISTING)

**Goal:** Add warnings and optimization to existing drag & drop.

The drag & drop already works. We need to ADD:

#### 🆕 NEW - Frontend Tasks

**1.3.1 Reorder Feedback Component**
```
File: spotlight-react/src/components/route/ReorderFeedback.tsx

Features:
- Warning if order doesn't make geographic sense
- "This adds 3 hours of backtracking"
- "Suggested better order: ..."
- One-click "Optimize order" button

INTEGRATES WITH: Existing FloatingCityCards.tsx drag & drop
```

**1.3.2 Night Redistribution UI**
```
File: spotlight-react/src/components/route/NightEditor.tsx

Features:
- Slider or +/- buttons for nights per city
- Shows remaining nights budget
- Warning if total exceeds original plan
- "Redistribute evenly" option

NOTE: updateCityNights() already exists in store
```

### Sprint 1.4: Itinerary-Level Modifications (🆕 ALL NEW)

**Goal:** Extend modification system to day-by-day itinerary.

#### Backend Tasks

**1.4.1 Itinerary Modification API**
```
File: server/routes/itineraryModification.js

Endpoints:
- POST /api/itinerary/:id/modify/activity
  Body: { dayIndex, activityIndex, action, request }

- POST /api/itinerary/:id/modify/day
  Body: { dayIndex, action: 'swap' | 'regenerate' | 'clear' }

- POST /api/itinerary/:id/modify/meal
  Body: { dayIndex, mealType, request }
```

**1.4.2 Activity Replacement Agent**
```
File: server/agents/ActivityReplacementAgent.js

Purpose: Suggest alternative activities/restaurants/hotels

Respects:
- Time of day
- Location proximity
- User preferences
- Already-visited places
- Dietary restrictions
```

#### Frontend Tasks

**1.4.3 Itinerary Item Actions**
```
File: spotlight-react/src/components/itinerary/ItemActions.tsx

Features:
- Click any activity/restaurant/hotel
- Options: Replace, Remove, Move to different day
- Quick swap suggestions
- "Find something similar but..."
```

**1.4.4 Day-Level Actions**
```
File: spotlight-react/src/components/itinerary/DayActions.tsx

Features:
- "Regenerate this day" (different approach, same city)
- "Make it more relaxed" / "Pack in more"
- "Swap morning and afternoon"
- "Add free time"
```

### Deliverables Checklist - Phase 1

**Existing (DO NOT BUILD):**
- [x] ✅ Add City modal with search
- [x] ✅ Add Landmark modal with detour calculation
- [x] ✅ Drag & drop reordering with @dnd-kit
- [x] ✅ Store actions: updateCities, addLandmark, removeLandmark, reorderCities
- [x] ✅ Delete waypoint API

**Enhance:**
- [x] 🔨 Add "Remove City" button to FloatingCityCards ✅ DONE
- [ ] 🔨 Add reorder warnings and geographic feedback

**New to Build:**
- [ ] 🆕 Route Modification API (replace, duration)
- [ ] 🆕 City Replacement Agent with AI suggestions
- [ ] 🆕 Route Reoptimizer service
- [ ] 🆕 City Replacement bottom sheet
- [ ] 🆕 Route modification history tracking
- [ ] 🆕 Natural Language Command Parser
- [x] ✅ Constraint Change Handler (ConstraintChangeSheet.tsx + API endpoint)
- [x] ✅ Command Bar (Cmd+K) (CommandBar.tsx with AI parsing)
- [ ] 🆕 Modification Preview with before/after
- [ ] 🆕 Smart Suggestions panel
- [x] ✅ Night redistribution UI (NightEditor.tsx)
- [ ] 🆕 Itinerary Modification API
- [ ] 🆕 Activity Replacement Agent
- [ ] 🆕 Itinerary Item Actions
- [ ] 🆕 Day-Level Actions

---

# Phase 2: Trip in Progress Mode

## The Problem

Currently, rdtrip is useful only during planning. Once the trip starts:
- Users screenshot their itinerary
- No real-time assistance
- No way to adapt to reality (closed restaurants, bad weather)
- App becomes useless for 7-14 days of the actual trip

## The Vision

Transform Spotlight into a live travel companion that users open every day of their trip:
- "What's next?" always visible
- Real-time context awareness
- Instant adaptations to changes
- Journey documentation built-in

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRIP IN PROGRESS MODE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                    TRIP CONTEXT                       │       │
│  │  Current location • Time • Weather • What's nearby    │       │
│  └──────────────────────────────────────────────────────┘       │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  TODAY'S    │    │   QUICK     │    │  PROGRESS   │          │
│  │   VIEW      │    │   ACTIONS   │    │   TRACKER   │          │
│  │             │    │             │    │             │          │
│  │ Now → Next  │    │ Navigate    │    │ Check-ins   │          │
│  │ Timeline    │    │ Call        │    │ Photos      │          │
│  │ Alerts      │    │ Modify      │    │ Notes       │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Sprint 2.1: Today View & Trip Activation

**Goal:** A focused view of the current day with real-time context.

#### Backend Tasks

**2.1.1 Trip Status Management**
```
File: server/routes/tripStatus.js

Endpoints:
- POST /api/trip/:routeId/start
  Response: { tripId, startedAt, currentDay: 1 }

- GET /api/trip/:tripId/today
  Response: { day, activities, currentActivity, nextUp, weather }

- POST /api/trip/:tripId/checkin
  Body: { activityId, location?, photo?, note? }
```

**2.1.2 Weather Integration Service**
```
File: server/services/WeatherService.js

Features:
- Fetch weather for current location
- Fetch forecast for upcoming stops
- Weather alerts for outdoor activities
- Suggest indoor alternatives when bad weather
```

#### Frontend Tasks

**2.1.3 Trip Activation Flow**
```
File: spotlight-react/src/components/trip/TripActivation.tsx

Flow:
1. "Start Your Trip" button appears on trip start date
2. Confirmation: "Ready to begin your adventure?"
3. Enables Trip Mode features
4. Shows "Day 1 of X" indicator
```

**2.1.4 Today View Component**
```
File: spotlight-react/src/components/trip/TodayView.tsx

Features:
- Current time indicator on timeline
- "Now" highlight on current activity
- "Up Next" preview card
- Weather widget for today
- Quick stats (km driven today, activities done)
```

**2.1.5 Activity Card - Live Mode**
```
File: spotlight-react/src/components/trip/LiveActivityCard.tsx

Features:
- Status: Upcoming / Now / Completed
- One-tap navigation (opens Maps app)
- One-tap call (for restaurants with reservations)
- "Done" check-off button
- "Skip" option with quick replacement
- "I'm here" check-in button
```

**2.1.6 Trip Header**
```
File: spotlight-react/src/components/trip/TripHeader.tsx

Features:
- Day X of Y indicator
- Current city name
- Weather icon + temp
- Trip progress bar
```

### Sprint 2.2: Navigation & Quick Actions

**Goal:** Instant access to maps, calls, and modifications.

#### Frontend Tasks

**2.2.1 Navigation Handoff**
```
File: spotlight-react/src/components/trip/NavigationButton.tsx

Features:
- Detects platform (iOS/Android/Desktop)
- Opens correct maps app with destination
- Supports: Google Maps, Apple Maps, Waze
- Includes intermediate stops option
```

**2.2.2 Quick Call Integration**
```
File: spotlight-react/src/components/trip/QuickCallButton.tsx

Features:
- One-tap call for restaurants/hotels
- Shows phone number
- "Confirm your reservation" reminder
- Call history for trip
```

**2.2.3 Context-Aware Quick Actions**
```
File: spotlight-react/src/components/trip/QuickActions.tsx

Actions based on context:
- At restaurant → "Leave a tip" calculator
- At hotel → "Check-out time: 11am"
- Driving → "Find gas station" / "Rest stop nearby"
- Any time → "What's nearby" / "I need help"
```

**2.2.4 "What's Nearby" Sheet**
```
File: spotlight-react/src/components/trip/NearbySheet.tsx

Features:
- Uses current location
- Categories: Food, Coffee, Sights, Gas, Pharmacy
- Integrates with AI recommendations
- Respects user preferences
- Distance and walking/driving time
```

### Sprint 2.3: Real-Time Adaptations

**Goal:** Help users when plans change.

#### Backend Tasks

**2.3.1 Alternative Finder Service**
```
File: server/services/AlternativeFinder.js

Scenarios:
- Restaurant closed → Find similar open now
- Bad weather → Suggest indoor alternatives
- Running late → Adjust timeline
- Want to extend → What's nearby worth staying for
```

**2.3.2 Alert System**
```
File: server/services/TripAlerts.js

Alert types:
- Weather warnings
- Reservation reminders (2 hours before)
- Driving time warnings ("Leave in 30 min to make it")
- Check-out reminders
- Activity timing suggestions
```

#### Frontend Tasks

**2.3.3 Alert Banner Component**
```
File: spotlight-react/src/components/trip/AlertBanner.tsx

Features:
- Contextual alerts at top of screen
- Swipe to dismiss
- Action buttons where applicable
- Priority levels (info, warning, urgent)
```

**2.3.4 Plan Change Assistant**
```
File: spotlight-react/src/components/trip/PlanChangeSheet.tsx

Features:
- "Something's not right?" entry point
- Quick options: "Running late", "Place is closed", "Want to skip"
- AI suggests adaptations
- One-tap to apply changes
```

**2.3.5 Timeline Adjustment UI**
```
File: spotlight-react/src/components/trip/TimelineAdjuster.tsx

Features:
- Drag to adjust activity times
- "Push everything back 1 hour"
- Visual conflict warnings
- Affects current day only
```

### Sprint 2.4: Check-ins & Progress Tracking

**Goal:** Document the journey as it happens.

#### Database Tasks

**2.4.1 Check-in Schema**
```sql
CREATE TABLE trip_checkins (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES active_trips(id),
  activity_id VARCHAR(100),
  location GEOGRAPHY(POINT),
  photo_urls TEXT[],
  note TEXT,
  rating INTEGER, -- 1-5 optional
  checked_in_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE active_trips (
  id UUID PRIMARY KEY,
  route_id UUID REFERENCES saved_routes(id),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP,
  current_day INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active', -- active, paused, completed
  completed_at TIMESTAMP
);
```

#### Frontend Tasks

**2.4.2 Check-in Flow**
```
File: spotlight-react/src/components/trip/CheckinFlow.tsx

Flow:
1. User taps "I'm here" on activity
2. Optional: Take/add photo
3. Optional: Add note ("Amazing view!")
4. Optional: Rate 1-5
5. Activity marked as complete
6. Progress updates
```

**2.4.3 Trip Progress Dashboard**
```
File: spotlight-react/src/components/trip/TripProgress.tsx

Features:
- Visual progress through cities
- Completion percentage
- Distance traveled
- Photos collected
- Days remaining
```

**2.4.4 Photo Capture Integration**
```
File: spotlight-react/src/components/trip/PhotoCapture.tsx

Features:
- Camera access
- Photo library access
- Auto-associates with current activity
- Uploads to storage (S3/Cloudinary)
```

### Sprint 2.5: Offline Support

**Goal:** App works without internet.

#### Frontend Tasks

**2.5.1 Offline Data Manager**
```
File: spotlight-react/src/services/OfflineManager.ts

Features:
- Download current day + next day data
- Cache maps for route
- Store pending check-ins
- Sync when back online
```

**2.5.2 Offline Indicator**
```
File: spotlight-react/src/components/trip/OfflineIndicator.tsx

Features:
- Clear "Offline Mode" indicator
- Shows last sync time
- "Sync now" button when back online
- Pending uploads indicator
```

**2.5.3 Pre-Trip Download**
```
File: spotlight-react/src/components/trip/PreTripDownload.tsx

Features:
- "Download for offline use" button
- Progress indicator
- Storage space estimate
- Selective download (today only vs full trip)
```

### Deliverables Checklist - Phase 2

- [ ] Trip Status Management API
- [ ] Weather Integration Service
- [ ] Trip Activation flow
- [ ] Today View component
- [ ] Live Activity Cards
- [ ] Trip Header with progress
- [ ] Navigation handoff (Google/Apple/Waze)
- [ ] Quick Call integration
- [ ] Context-aware Quick Actions
- [ ] "What's Nearby" discovery
- [ ] Alternative Finder service
- [ ] Alert System (weather, reminders)
- [ ] Alert Banner UI
- [ ] Plan Change Assistant
- [ ] Timeline Adjustment
- [ ] Check-in database schema
- [ ] Check-in flow UI
- [ ] Trip Progress dashboard
- [ ] Photo Capture integration
- [ ] Offline Data Manager
- [ ] Offline Indicator
- [ ] Pre-Trip Download

---

# Phase 3: Personalization Visibility

## The Problem

Users provide rich personalization data (honeymoon, dietary restrictions, accessibility needs, travel style) but never see how it influences their recommendations. This makes the AI feel like a black box.

## The Vision

Every recommendation shows *why* it was chosen, creating trust and enabling better feedback.

## EXISTING FEATURES (DO NOT RECREATE)

### ✅ Personalization Badge Component
**File:** `spotlight-react/src/components/spotlight/v2/PersonalizationBadge.tsx`

**Already implemented (481 lines):**
- Full expandable badge with "Personalized" label
- Expands to show complete preference panel
- Shows occasion (honeymoon, anniversary, birthday, etc.)
- Shows travel style (explorer, relaxer, culture, adventurer, foodie)
- Shows pace (1-5 scale with labels)
- Shows interests with icons
- Shows dining style
- Shows dietary restrictions
- Shows budget tier with price indicators
- Shows accommodation preference
- Shows accessibility needs
- Shows "avoid crowds" and "prefer outdoor" toggles
- Shows trip story
- Beautiful Wanderlust Editorial styling

### ✅ Personalization Summary Component
**File:** `spotlight-react/src/components/spotlight/v2/PersonalizationSummary.tsx`

**Already implemented:**
- Shows personalization at top of itinerary generation
- Dynamic headlines based on occasion
- Visual preference display

### ✅ Personalized Intro Banner
**File:** `spotlight-react/src/components/spotlight/v2/PersonalizedIntroBanner.tsx`

**Already implemented:**
- Shows personalized intro message based on trip context

### ✅ "Why This" Card
**File:** `spotlight-react/src/components/spotlight/v2/WhyThisCard.tsx`

**Already implemented:**
- Shows reasoning for recommendations

### ✅ Match Score Indicator
**File:** `spotlight-react/src/components/spotlight/v2/MatchScoreIndicator.tsx`

**Already implemented:**
- Shows match score for recommendations

### ✅ Trip Style Visualization
**File:** `spotlight-react/src/components/spotlight/v2/TripStyleVisualization.tsx`

**Already implemented:**
- Visual representation of travel style

### ✅ Personalization Type Definitions
**File:** `spotlight-react/src/stores/spotlightStoreV2.ts`

**Already implemented:**
- Full `TripPersonalization` interface
- All preference categories typed

## Implementation Plan

### Sprint 3.1: Enhance Backend Reasoning (🆕 NEW)

**Goal:** Generate richer personalization reasoning for every recommendation.

#### Backend Tasks

**3.1.1 Personalization Reasoning Service** (🆕 NEW)
```
File: server/services/PersonalizationReasoner.js

Purpose: For each recommendation, generate WHY it fits the user

Input: Recommendation + User Personalization
Output: Array of reasons with categories

Categories:
- occasion: "Perfect for your honeymoon"
- dietary: "Offers vegetarian tasting menu"
- accessibility: "Step-free access throughout"
- style: "Matches your preference for authentic local spots"
- interests: "Great for history enthusiasts"
- pace: "Allows for leisurely exploration"
- budget: "Within your luxury budget"

NOTE: This enhances existing frontend components with richer data
```

**3.1.2 Enhance Recommendation Schema** (🆕 NEW)
```
// Add to city/activity/restaurant recommendations:
{
  ...existingFields,
  personalizationMatch: {
    score: 0.92, // How well it matches overall
    reasons: [
      {
        category: 'occasion',
        text: 'Romantic atmosphere perfect for your anniversary',
        icon: 'heart'
      },
      {
        category: 'dietary',
        text: 'Excellent vegetarian options',
        icon: 'leaf'
      }
    ]
  }
}
```

### Sprint 3.2: Enhance Personalization UI (🔨 ENHANCE)

**Goal:** Improve existing components with new backend data.

#### 🔨 ENHANCE - WhyThisCard
```
File: spotlight-react/src/components/spotlight/v2/WhyThisCard.tsx

ENHANCE with:
- Consume new personalizationMatch.reasons from backend
- Show multiple reasons instead of single line
- Add "Not quite right? Find alternatives" link
```

#### 🔨 ENHANCE - MatchScoreIndicator
```
File: spotlight-react/src/components/spotlight/v2/MatchScoreIndicator.tsx

ENHANCE with:
- Use actual calculated score from backend
- Tooltip showing breakdown
```

### Sprint 3.3: Preference Editing (🆕 NEW)

**Goal:** Let users edit preferences without regenerating.

#### Frontend Tasks

**3.3.1 Quick Preference Editor** (🆕 NEW)
```
File: spotlight-react/src/components/personalization/QuickPreferenceEditor.tsx

Features:
- Inline editing of preferences
- Toggle: "Traveling with kids now"
- "Apply to all recommendations" / "Just new ones"

NOTE: This is NEW - currently preferences are read-only after generation
```

**3.3.2 AI Insights Panel** (🆕 NEW)
```
File: spotlight-react/src/components/personalization/AIInsights.tsx

Features:
- "Our AI noticed..."
- Patterns from their preferences
- Suggestions based on profile
- "You might also like..." proactive recommendations
```

### Deliverables Checklist - Phase 3

**Existing (DO NOT BUILD):**
- [x] ✅ PersonalizationBadge.tsx - Full expandable preference display
- [x] ✅ PersonalizationSummary.tsx - Shows at top of itinerary
- [x] ✅ PersonalizedIntroBanner.tsx - Personalized intro message
- [x] ✅ WhyThisCard.tsx - Shows reasoning
- [x] ✅ MatchScoreIndicator.tsx - Match score display
- [x] ✅ TripStyleVisualization.tsx - Style visualization
- [x] ✅ TripPersonalization type definitions

**Enhance:**
- [ ] 🔨 WhyThisCard with richer backend reasons
- [ ] 🔨 MatchScoreIndicator with actual calculated scores

**New to Build:**
- [ ] 🆕 Personalization Reasoning Service (backend)
- [ ] 🆕 Enhanced recommendation schema with reasons
- [ ] 🆕 Quick Preference Editor (inline editing)
- [ ] 🆕 AI Insights Panel

---

# Phase 4: Trip Memories & Sharing

## The Problem

After the trip ends, users have:
- Photos scattered in camera roll
- No connection between photos and places
- No reason to return to the app
- No easy way to share their experience

## The Vision

Transform trips into shareable stories that users treasure and share.

## Implementation Plan

### Sprint 4.1: Trip Journal

**Goal:** Collect memories throughout and after the trip.

#### Database Tasks

**4.1.1 Memories Schema**
```sql
CREATE TABLE trip_memories (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES active_trips(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20), -- 'photo', 'note', 'highlight', 'rating'
  activity_id VARCHAR(100),
  city_name VARCHAR(100),
  content JSONB, -- { urls: [], caption: "", rating: 5 }
  location GEOGRAPHY(POINT),
  captured_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trip_summaries (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES active_trips(id),
  total_distance_km INTEGER,
  total_days INTEGER,
  cities_visited TEXT[],
  photos_count INTEGER,
  favorite_moment TEXT,
  generated_story TEXT,
  shareable_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Frontend Tasks

**4.1.2 Memory Collection UI**
```
File: spotlight-react/src/components/memories/MemoryCapture.tsx

Features:
- "Add Memory" floating button during trip
- Quick photo + caption
- Optional location tagging
- Star as "highlight"
```

**4.1.3 Trip Journal View**
```
File: spotlight-react/src/components/memories/TripJournal.tsx

Features:
- Chronological memory feed
- Grouped by day/city
- Mix of photos, notes, check-ins
- Beautiful masonry layout
```

### Sprint 4.2: Post-Trip Recap

**Goal:** Automatic trip summary generation.

#### Backend Tasks

**4.2.1 Trip Recap Generator**
```
File: server/services/TripRecapGenerator.js

Generates:
- Trip statistics (km, cities, days)
- Photo highlights (most liked, most places)
- AI-written trip story
- Map with visited route
- Memorable moments selection
```

#### Frontend Tasks

**4.2.2 Trip Recap Page**
```
File: spotlight-react/src/components/memories/TripRecap.tsx

Sections:
- Hero photo with trip title
- Stats bar (distance, cities, days, photos)
- Route map with pins
- Day-by-day highlights
- "My favorite moment" feature
- AI-generated trip story
```

**4.2.3 Trip Complete Flow**
```
File: spotlight-react/src/components/memories/TripCompleteFlow.tsx

Flow:
1. "End Trip" button on last day
2. Recap generation loading
3. Beautiful recap reveal
4. "Edit & personalize" option
5. "Share your journey" CTA
```

### Sprint 4.3: Sharing

**Goal:** Easy sharing to social and with friends.

#### Backend Tasks

**4.3.1 Shareable Story Generator**
```
File: server/services/ShareableStoryGenerator.js

Outputs:
- Public URL with trip story
- Instagram-ready image cards
- Shareable statistics card
- Full trip share (with itinerary)
```

#### Frontend Tasks

**4.3.2 Share Sheet**
```
File: spotlight-react/src/components/memories/ShareSheet.tsx

Features:
- Share to: Instagram, Twitter, Facebook, WhatsApp
- Copy link
- Download images
- QR code for trip
- Privacy controls
```

**4.3.3 Story Cards Generator**
```
File: spotlight-react/src/components/memories/StoryCards.tsx

Features:
- Generates social-ready image cards
- Multiple templates
- Auto-includes trip photos
- Stats overlay
- Branded but subtle
```

### Sprint 4.4: Memories & Nostalgia

**Goal:** Bring users back with memories.

#### Backend Tasks

**4.4.1 Memory Notification Service**
```
File: server/services/MemoryNotifications.js

Triggers:
- "1 year ago today" with photo
- Trip anniversary
- "On this day" memories
- Weekly throwback
```

#### Frontend Tasks

**4.4.2 Memories Tab**
```
File: spotlight-react/src/components/memories/MemoriesTab.tsx

Features:
- Past trips gallery
- "On this day" section
- Trip anniversaries
- Photos from all trips
```

### Deliverables Checklist - Phase 4

- [ ] Memories database schema
- [ ] Memory Capture UI
- [ ] Trip Journal view
- [ ] Trip Recap Generator
- [ ] Trip Recap page
- [ ] Trip Complete flow
- [ ] Shareable Story Generator
- [ ] Share Sheet component
- [ ] Story Cards Generator
- [ ] Memory Notification Service
- [ ] Memories Tab

---

# Phase 5: Smart Packing List

## The Problem

Packing is stressful. Users forget items. Nothing connects their itinerary to what they should bring.

## The Vision

AI-generated packing list that knows your trip.

## Implementation Plan

### Sprint 5.1: Packing List Generator

**Goal:** Generate smart packing lists based on trip details.

#### Backend Tasks

**5.1.1 Packing List AI**
```
File: server/services/PackingListGenerator.js

Inputs:
- Trip duration
- Destinations + weather forecasts
- Activities in itinerary
- User preferences (saved items, past trips)
- Trip type (business, leisure, adventure)

Outputs:
- Categorized list (Clothing, Toiletries, Electronics, Documents, etc.)
- Weather-specific items
- Activity-specific items
- "Don't forget" essentials
```

**5.1.2 Weather-Based Suggestions**
```
File: server/services/WeatherPackingAdvisor.js

Logic:
- Fetch weather for all destinations
- Suggest layers for temp range
- Rain gear if precipitation likely
- Sun protection if sunny
- Formal wear if fancy restaurants
```

#### Frontend Tasks

**5.1.3 Packing List View**
```
File: spotlight-react/src/components/packing/PackingList.tsx

Features:
- Categorized expandable sections
- Checkboxes for completion
- Progress indicator
- "Add custom item" button
- "Why this?" explanation on items
```

**5.1.4 Packing Reminders**
```
File: spotlight-react/src/components/packing/PackingReminders.tsx

Features:
- "3 days before trip" reminder
- Push notification support
- Unchecked items alert
```

### Deliverables Checklist - Phase 5

- [ ] Packing List Generator AI
- [ ] Weather-Based Suggestions
- [ ] Packing List UI with categories
- [ ] Checkbox completion tracking
- [ ] Custom item addition
- [ ] Pre-trip reminders

---

# Phase 6: Collaborative Planning

## The Problem

Trips often involve multiple people, but:
- Hard to share and edit together
- No voting on decisions
- No visibility into others' preferences
- Async coordination is painful

## The Vision

Real-time collaborative trip planning like Google Docs.

## Implementation Plan

### Sprint 6.1: Enhanced Sharing & Roles

**Goal:** Better collaborator management.

#### Database Tasks

**6.1.1 Collaborator Roles**
```sql
ALTER TABLE route_collaborators ADD COLUMN role VARCHAR(20) DEFAULT 'viewer';
-- Roles: owner, editor, viewer

ALTER TABLE route_collaborators ADD COLUMN preferences JSONB;
-- Store each person's dietary/accessibility needs
```

#### Frontend Tasks

**6.1.2 Collaborator Management**
```
File: spotlight-react/src/components/collab/CollaboratorManager.tsx

Features:
- Invite via email/link
- Set role (can edit vs view only)
- See who's currently viewing
- Remove collaborators
```

**6.1.3 Collaborator Preferences Merge**
```
File: spotlight-react/src/components/collab/PreferencesMerge.tsx

Features:
- Each collaborator adds their needs
- AI shows combined requirements
- Highlights conflicts
- Filters recommendations to match all
```

### Sprint 6.2: Voting & Decisions

**Goal:** Democratic decision making.

#### Database Tasks

**6.2.1 Voting Schema**
```sql
CREATE TABLE route_votes (
  id UUID PRIMARY KEY,
  route_id UUID REFERENCES saved_routes(id),
  item_type VARCHAR(20), -- 'city', 'activity', 'restaurant'
  item_id VARCHAR(100),
  user_id UUID REFERENCES users(id),
  vote INTEGER, -- 1 (up), -1 (down), 0 (neutral)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(route_id, item_type, item_id, user_id)
);
```

#### Frontend Tasks

**6.2.2 Voting UI**
```
File: spotlight-react/src/components/collab/VotingButtons.tsx

Features:
- 👍 / 👎 buttons on items
- Vote count display
- "Undecided" indicator
- Sort by votes
```

**6.2.3 Decision Summary**
```
File: spotlight-react/src/components/collab/DecisionSummary.tsx

Features:
- Shows items with full consensus
- Highlights contested items
- "Discuss" button for conflicts
```

### Sprint 6.3: Comments & Discussion

**Goal:** Async communication on specific items.

#### Database Tasks

**6.3.1 Comments Schema**
```sql
CREATE TABLE route_comments (
  id UUID PRIMARY KEY,
  route_id UUID REFERENCES saved_routes(id),
  item_type VARCHAR(20),
  item_id VARCHAR(100),
  user_id UUID REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Frontend Tasks

**6.3.2 Comment Thread**
```
File: spotlight-react/src/components/collab/CommentThread.tsx

Features:
- Comments on any item
- @mentions
- Reply threading
- Edit/delete own comments
```

**6.3.3 Activity Feed**
```
File: spotlight-react/src/components/collab/ActivityFeed.tsx

Features:
- "Sarah added Florence"
- "Mike voted 👎 on Pisa"
- "New comment on Trattoria X"
- Real-time updates
```

### Sprint 6.4: Real-Time Collaboration

**Goal:** See others' changes live.

#### Backend Tasks

**6.4.1 WebSocket Collaboration Server**
```
File: server/services/CollaborationSocket.js

Events:
- user_joined
- user_left
- item_modified
- vote_cast
- comment_added
- cursor_moved (optional)
```

#### Frontend Tasks

**6.4.2 Presence Indicators**
```
File: spotlight-react/src/components/collab/PresenceIndicators.tsx

Features:
- Avatar bubbles showing who's online
- "Sarah is viewing Rome"
- Colored cursors (optional, like Figma)
```

**6.4.3 Live Updates**
```
File: spotlight-react/src/components/collab/LiveUpdates.tsx

Features:
- Real-time sync via WebSocket
- Optimistic updates
- Conflict resolution
- Change animations
```

### Deliverables Checklist - Phase 6

- [ ] Collaborator roles (owner/editor/viewer)
- [ ] Collaborator management UI
- [ ] Preferences merge across collaborators
- [ ] Voting database schema
- [ ] Voting UI (thumbs up/down)
- [ ] Decision Summary view
- [ ] Comments database schema
- [ ] Comment threads on items
- [ ] Activity feed
- [ ] WebSocket collaboration server
- [ ] Presence indicators
- [ ] Live real-time updates

---

# Phase 7: Budget Intelligence

## The Problem

Users don't know what their trip will cost until they're spending. No visibility into budget during planning.

## The Vision

Know the expected cost before you go, track it during the trip.

## Implementation Plan

### Sprint 7.1: Budget Estimation

**Goal:** Predict trip costs during planning.

#### Backend Tasks

**7.1.1 Budget Estimation Service**
```
File: server/services/BudgetEstimator.js

Calculates:
- Accommodation (based on budget preference + destinations)
- Dining (per person per day estimate)
- Fuel (distance × fuel cost per km)
- Activities (entrance fees, tours)
- Miscellaneous (shopping, tips, etc.)

Uses:
- Historical data
- Destination cost of living indices
- User's budget preference
- Number of travelers
```

**7.1.2 Price Data Integration**
```
File: server/services/PriceDataService.js

Sources:
- Average hotel prices by city + tier
- Restaurant price ranges
- Fuel prices by country
- Activity typical costs
```

#### Frontend Tasks

**7.1.3 Budget Forecast Card**
```
File: spotlight-react/src/components/budget/BudgetForecast.tsx

Features:
- Total estimated range (€3,200 - €4,100)
- Breakdown by category
- "Set my budget" input
- Warnings if estimate exceeds budget
- Tips to save money
```

**7.1.4 Budget-Aware Recommendations**
```
File: spotlight-react/src/components/budget/BudgetFilter.tsx

Features:
- Filter recommendations by price tier
- "Show me cheaper alternatives"
- Price indicator on each item ($, $$, $$$)
- Running total indicator
```

### Sprint 7.2: Budget Tracking

**Goal:** Track spending during the trip.

#### Database Tasks

**7.2.1 Enhanced Expenses Schema**
```sql
ALTER TABLE expenses ADD COLUMN estimated_amount DECIMAL(10,2);
ALTER TABLE expenses ADD COLUMN budget_category VARCHAR(50);
-- Categories: accommodation, dining, transport, activities, shopping, other
```

#### Frontend Tasks

**7.2.2 Budget vs Actual View**
```
File: spotlight-react/src/components/budget/BudgetVsActual.tsx

Features:
- Side-by-side comparison
- Category breakdown
- Percentage spent
- Projected final spend
- "On track" / "Over budget" indicator
```

**7.2.3 Spending Alerts**
```
File: spotlight-react/src/components/budget/SpendingAlerts.tsx

Features:
- Alert when 80% of budget spent
- Daily spending limit suggestions
- Category overspend warnings
```

**7.2.4 Quick Expense Entry**
```
File: spotlight-react/src/components/budget/QuickExpenseEntry.tsx

Features:
- Floating "+" button during trip
- Amount + category quick entry
- Receipt photo capture
- Currency auto-conversion
```

### Deliverables Checklist - Phase 7

- [ ] Budget Estimation Service
- [ ] Price Data Integration
- [ ] Budget Forecast card
- [ ] Budget filtering on recommendations
- [ ] Enhanced expenses schema
- [ ] Budget vs Actual comparison
- [ ] Spending alerts
- [ ] Quick Expense Entry UI

---

# Implementation Priority Matrix

## Immediate Impact (Start Here)

| Feature | Status | Effort | Impact | Why First |
|---------|--------|--------|--------|-----------|
| Add/Remove Cities | ✅ ADD exists, 🔨 REMOVE needs UI | Low | Critical | Add Remove button only |
| Drag & Drop Reorder | ✅ EXISTS | - | - | Already done! |
| Natural Language Commands | 🆕 NEW | Medium | Critical | Makes modification magical |
| Today View | 🆕 NEW | Low | High | Core of Trip in Progress |
| Navigation Handoff | 🆕 NEW | Low | High | Instant utility |

## High Value (Next Quarter)

| Feature | Status | Effort | Impact | Why Important |
|---------|--------|--------|--------|---------------|
| Personalization Display | ✅ EXISTS | - | - | PersonalizationBadge done! |
| "Why This Fits" | ✅ EXISTS, 🔨 ENHANCE | Low | High | Needs richer backend data |
| Check-ins + Photos | 🆕 NEW | Medium | High | Enables memories |
| Budget Forecast | 🆕 NEW | Medium | High | Planning confidence |
| Packing List | 🆕 NEW | Medium | Medium | Unique differentiator |

## Growth & Stickiness (Future)

| Feature | Status | Effort | Impact | Why Later |
|---------|--------|--------|--------|-----------|
| Trip Recap & Sharing | 🆕 NEW | High | Very High | Needs memories first |
| Real-time Collaboration | 🆕 NEW | High | High | Complex infrastructure |
| Voting & Comments | 🆕 NEW | Medium | Medium | Needs user base |

---

## Quick Win: What to Build First

Based on existing features, here's the recommended order:

### Week 1: Complete Route Editing
1. ✅ **Add "Remove City" button** to FloatingCityCards - **DONE!**
   - Added Trash2 button on hover/select
   - Beautiful RemoveCityDialog with Wanderlust Editorial design
   - removeCity store action with landmark adjustment
   - Prevents removal if < 2 cities

2. ✅ **Add reorder feedback** - **DONE!**
   - ReorderFeedback.tsx component with Wanderlust Editorial design
   - Calculates route distance using Haversine formula
   - Shows distance change after drag & drop (+/- km)
   - Green styling for saved distance, red for added distance
   - Undo button to reverse the reorder
   - Auto-dismiss after 5 seconds with progress bar

### Week 2-3: AI-Powered Modifications
3. ✅ **City Replacement Agent** - **DONE!**
   - POST /api/route/suggest-replacement endpoint
   - Uses Perplexity AI for context-aware suggestions
   - Returns 3 alternatives with match scores and highlights
   - Considers personalization (interests, occasion, style)

4. ✅ **City Replacement Sheet** - **DONE!**
   - CityReplacementSheet.tsx with bottom sheet UI
   - Wanderlust Editorial design (warm colors, organic feel)
   - Quick reason presets for better suggestions
   - Category badges (culture, nature, food, adventure, relaxation)
   - Golden Replace button on city cards

### Week 4+: Natural Language
5. ✅ **Command Bar with AI parsing** - **DONE!**
   - CommandBar.tsx with Cmd+K keyboard shortcut
   - Dark editorial design with amber/golden accents
   - Quick command suggestions based on route
   - Natural language parsing via /api/route/parse-command
   - Floating ⌘K button for discoverability
   - High-confidence auto-execution for clear intents
   - Integrated into SpotlightV2 with full action handlers

6. ✅ **Night Redistribution UI** - **DONE!**
   - NightEditor.tsx component with "Moonlit Allocation" design
   - Moon phase visualization for each night
   - Warm Wanderlust Editorial aesthetic
   - Per-city +/- stepper controls
   - Total nights budget with progress bar
   - "Redistribute Evenly" magic wand button
   - Visual warnings for over/under budget
   - Clickable nights display on city cards
   - Apply changes with smooth animations

7. **Constraint Change Handler** ✅ COMPLETE
   - "Adapt Trip" button in SpotlightV2 header
   - Beautiful bottom sheet with tabbed interface (Duration/Budget/Travelers/Dates)
   - Duration: Visual +/- days selector with trip shortening/extension indicators
   - Budget: Tighter/Generous toggle with spending direction
   - Travelers: Text input for traveler changes
   - Dates: Text input for date adjustments
   - Backend API `/api/route/handle-constraint-change` with Perplexity AI
   - AI-generated suggestions with priority badges
   - Apply individual suggestions with visual feedback
   - Wanderlust Editorial design aesthetic

---

# Success Metrics

## Phase 1: Route Modification
- **Modification rate**: % of routes modified after generation (target: 40%+)
- **Regeneration reduction**: Fewer full regenerations (target: -50%)
- **Satisfaction**: Post-modification satisfaction score

## Phase 2: Trip in Progress
- **Trip activation rate**: % of routes that start "Trip Mode" (target: 30%+)
- **Daily active during trip**: Sessions per day during active trip (target: 2+)
- **Check-in rate**: % of activities checked in (target: 50%+)

## Phase 3: Personalization
- **Trust score**: "I understand why this was recommended" survey
- **Alternative selection rate**: How often users pick AI alternatives

## Phase 4: Memories
- **Completion rate**: % of trips that complete and view recap
- **Share rate**: % of recaps shared socially
- **Return visits**: Users returning to view past trip memories

## Phase 5-7: Engagement
- **Collaborator invites**: Routes with multiple collaborators
- **Budget feature usage**: % of trips using budget features
- **Packing list completion**: % checking off packing items

---

# Technical Considerations

## API Rate Limiting
- OpenAI calls during modification: Implement caching + queuing
- Weather API: Cache forecasts, refresh every 6 hours
- Maps API: Cache route calculations

## Real-Time Infrastructure
- WebSocket server for collaboration
- Consider: Pusher, Ably, or custom Socket.io
- Offline queue for check-ins

## Storage
- Photo uploads: S3 or Cloudinary
- Offline caching: IndexedDB
- Route history: PostgreSQL JSONB

## Performance
- Lazy load modifications panel
- Pre-compute personalization reasons during generation
- Progressive image loading for memories

---

# Getting Started

## Phase 1, Sprint 1.1 First Tasks

1. **Backend**: Create `/api/route/:routeId/modify/city` endpoint
2. **Backend**: Build `CityReplacementAgent.js` using existing recommendation logic
3. **Frontend**: Build `CityActionMenu.tsx` component
4. **Frontend**: Build `CityReplacementSheet.tsx` flow
5. **Test**: End-to-end city replacement flow

Start here. Ship it. Then continue.

---

*This plan is a living document. Update as we learn from users.*
