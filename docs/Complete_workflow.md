# WAYCRAFT: COMPLETE TECHNICAL IMPLEMENTATION PLAN

---

## CURRENT APPLICATION STATE

> **This section describes what already exists in the codebase.** The implementation plan that follows builds upon this foundation.

### What is Waycraft?

Waycraft is an **AI-powered road trip planning companion** that transforms multi-city road trip planning from a research-heavy chore into a conversational, intelligent experience. Unlike traditional trip planners that present lists of popular attractions, Waycraft acts as a knowledgeable travel companion that understands your preferences, surfaces hidden gems, and adapts to your journey in real-time.

### Core Philosophy

The app follows a **companion-first approach**: rather than forms and filters, users interact with an AI companion that learns their preferences through natural conversation and behaviour observation. The companion persists across all trip phases—from initial planning through active travel to post-trip reflection.

---

### What's Already Built

#### 1. Route Discovery & Planning

| Feature | Status | Key Files |
|---------|--------|-----------|
| Route creation (origin/destination/waypoints) | Complete | `server.js`, `spotlight-react/src/services/api.ts` |
| AI-orchestrated route discovery | Complete | `server/agents/RouteDiscoveryAgentV2.js`, `UnifiedRouteAgent.js` |
| City suggestions along route | Complete | `server/agents/AgentOrchestratorV3.js` |
| Itinerary generation (day-by-day) | Complete | `server/agents/DayPlannerAgent.js` |
| Itinerary display with agent visualization | Complete | `spotlight-react/src/components/itinerary/ItineraryGenerationPage.tsx` |

#### 2. Map Experience

| Feature | Status | Key Files |
|---------|--------|-----------|
| Interactive Mapbox GL map | Complete | `spotlight-react/src/components/spotlight/v2/MapViewV2.tsx` |
| City markers with interactions | Complete | `CityMarker.tsx`, `FloatingCityCards.tsx` |
| Landmark markers & details | Complete | `LandmarkMarker.tsx`, `LandmarkDetailsModal.tsx` |
| Animated route lines | Complete | `map/layers/AnimatedRouteLine.tsx` |
| Add/remove landmarks with detour calculation | Complete | `AddCityLandmarkModal.tsx` |
| Night allocation per city | Complete | `NightEditor.tsx`, `NightStepper.tsx` |

#### 3. AI Companion System

| Feature | Status | Key Files |
|---------|--------|-----------|
| Conversation state management | Complete | `spotlight-react/src/contexts/AgentProvider.tsx` |
| Streaming message support | Complete | `AgentProvider.tsx` |
| Tool execution visualization | Complete | `ToolExecutionStatus.tsx` |
| Artifact rendering (activities, hotels, weather) | Complete | `components/agent/artifacts/*.tsx` |
| Proactive suggestion triggers | Complete | `contexts/CompanionProvider.tsx` |
| Chat interface | Complete | `AgentModal.tsx`, `AgentChatBubble.tsx` |

**Backend Agents:**
- `CityActivityAgent.js` - Discovers activities in cities
- `RestaurantAgent.js` - Restaurant recommendations
- `DayPlannerAgent.js` - Daily schedule planning
- `SerendipityAgent.js` - Hidden gems discovery
- `PersonalizationReasoner.js` - Preference scoring
- `ProactiveAgentService.js` - Proactive recommendations

#### 4. Active Trip Features

| Feature | Status | Key Files |
|---------|--------|-----------|
| Today view (real-time navigation) | Complete | `components/today/TodayView.tsx` |
| GPS location tracking | Complete | `hooks/useGPS.ts` |
| Check-in system with photos | Complete | `components/trip/CheckinModal.tsx` |
| Trip progress tracking | Complete | `server/services/TripService.js` |
| Day progress visualization | Complete | `components/today/DayProgress.tsx` |
| Quick actions | Complete | `components/today/QuickActions.tsx` |
| PocketLocal ambient companion | In Progress | `components/trip/PocketLocal.tsx` (40KB) |

#### 5. Personalization

| Feature | Status | Key Files |
|---------|--------|-----------|
| Travel style preferences | Complete | `components/personalization/` |
| Pace settings (relaxed/balanced/packed) | Complete | `QuickPreferenceEditor.tsx` |
| Interest categories | Complete | Part of route generation |
| AI-powered insights | Complete | `AIInsights.tsx` |
| Personalization scoring | Complete | `server/agents/PersonalizationReasoner.js` |

#### 6. Collaboration

| Feature | Status | Key Files |
|---------|--------|-----------|
| Multi-user trip collaboration | Complete | `components/collaboration/` |
| Activity comments | Complete | `ActivityCommentThread.tsx` |
| Task management | Complete | `TaskBoard.tsx`, `TaskCard.tsx` |
| Polls | Complete | `PollCard.tsx`, `CreatePollModal.tsx` |
| Invitations | Complete | `InviteCollaboratorModal.tsx` |

#### 7. Expenses & Budget

| Feature | Status | Key Files |
|---------|--------|-----------|
| Expense tracking | Complete | `components/expenses/ExpenseTracker.tsx` |
| Budget overview | Complete | `BudgetOverview.tsx` |
| Balance splitting | Complete | `BalanceSummary.tsx` |

#### 8. Export & Utilities

| Feature | Status | Key Files |
|---------|--------|-----------|
| GPX export | Complete | `server.js` → `/api/export/gpx` |
| ICS calendar export | Complete | `/api/export/ics` |
| KML export | Complete | `/api/export/kml` |
| Export menu UI | Complete | `ExportMenu.tsx` |

---

### Technical Architecture

#### Frontend Stack
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **State:** Zustand (`spotlightStoreV2.ts` - 27KB)
- **Maps:** Mapbox GL via `react-map-gl`
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS
- **Components:** Radix UI primitives
- **Icons:** Lucide

#### Backend Stack
- **Runtime:** Node.js + Express
- **Database:** PostgreSQL (Supabase)
- **Storage:** Firebase
- **AI:** Anthropic Claude API
- **Places:** Google Places API
- **Weather:** OpenWeather API
- **Maps:** Mapbox API
- **Deployment:** Heroku

#### Design System
- **Typography:** Fraunces (display), DM Sans (body)
- **Colors:**
  - Warm cream `#FBF9F6` (background)
  - Terracotta `#C45830` (primary accent)
  - Golden `#D4A853` (highlights)
  - Sage `#6B8E7B` (nature/success)
  - Espresso `#2C2417` (text)

---

### Codebase Structure

```
rdtrip/
├── spotlight-react/              # Main React application
│   └── src/
│       ├── components/
│       │   ├── agent/            # AI chat interface & artifacts
│       │   ├── auth/             # Login, register modals
│       │   ├── collaboration/    # Multi-user features
│       │   ├── expenses/         # Budget tracking
│       │   ├── itinerary/        # Itinerary generation UI
│       │   ├── personalization/  # Preference editors
│       │   ├── spotlight/v2/     # Main map & route experience
│       │   ├── spotlight/v3/     # Newer component iterations
│       │   ├── today/            # Active trip views
│       │   ├── trip/             # Trip management (checkins, memories)
│       │   └── ui/               # Design system components
│       ├── contexts/             # AgentProvider, CompanionProvider, AuthContext
│       ├── hooks/                # useGPS, useWeather, useTrip, etc.
│       ├── services/             # API clients, geocoding, weather
│       └── stores/               # Zustand stores
│
├── server.js                     # Main backend (11,000+ lines, monolith)
├── server/
│   ├── agents/                   # AI agents (RouteDiscovery, DayPlanner, etc.)
│   └── services/                 # TripService, business logic
│
├── src/                          # New clean architecture (migration in progress)
│   ├── api/                      # HTTP routes
│   ├── domain/                   # Business logic
│   └── infrastructure/           # Repositories
│
├── db/
│   ├── schema.sql                # Database schema
│   └── migrations/               # Schema migrations
│
└── docs/                         # Documentation
```

---

### Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts & authentication |
| `routes` | Trip routes (origin, destination, cities, waypoints) |
| `itineraries` | Day-by-day itineraries with activities |
| `active_trips` | In-progress trips with location tracking |
| `checkins` | User check-ins during trips |
| `landmarks` | Scenic stops & waypoints |
| `activities` | Individual POIs/activities |
| `restaurants` | Restaurant recommendations |
| `hotels` | Accommodation options |
| `expenses` | Trip expenses for splitting |
| `collaborators` | Multi-user trip collaboration |
| `memories` | Post-trip photo/story collection |
| `notifications` | User notifications |
| `bookmarks` | Saved trips/activities |

---

### API Endpoints (Key Routes)

**Authentication:**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Current user

**Routes & Trips:**
- `POST /api/routes` - Create route
- `GET /api/routes/:id` - Get route details
- `POST /api/generate-unified-route` - AI-orchestrated route generation
- `POST /api/generate-itinerary` - Full itinerary with activities

**AI Agent:**
- `POST /api/agent/query` - Send message to companion
- `GET /api/agent/history/:sessionId` - Conversation history

**Trip Tracking:**
- `POST /api/trips/:id/checkin` - Record activity check-in
- `GET /api/trips/:id/status` - Trip status

**Discovery:**
- `POST /api/geocode/autocomplete` - Location autocomplete
- `POST /api/places/search` - Search places
- `GET /api/landmarks/region` - Regional landmarks

---

### What This Plan Adds

The implementation plan below enhances the existing application with:

1. **Simplified Entry Flow** - Reduce friction to 4 inputs (currently has preferences upfront)
2. **Discovery Phase** - Map-centric exploration before itinerary commitment
3. **Hidden Gems Engine** - Algorithmic surfacing of high-quality, low-popularity places
4. **Enhanced Planning Companion** - Conversational preference gathering (not forms)
5. **Richer Itinerary Editing** - Swap, reorder, alternatives
6. **Trip Brain Service** - Intelligent real-time recommendation filtering
7. **Post-Trip Engine** - Stats, journal, shareable cards
8. **Cross-Trip Memory** - Companion remembers across trips
9. **Booking Integration** - Affiliate revenue
10. **Premium Subscription** - Monetization

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Epic 0: Entry Flow Redesign](#2-epic-0-entry-flow-redesign)
3. [Epic 1: Discovery Phase](#3-epic-1-discovery-phase)
4. [Epic 2: Hidden Gems Engine](#4-epic-2-hidden-gems-engine)
5. [Epic 3: Planning-Phase Companion](#5-epic-3-planning-phase-companion)
6. [Epic 4: Preference & Refinement System](#6-epic-4-preference--refinement-system)
7. [Epic 5: Itinerary Generation](#7-epic-5-itinerary-generation)
8. [Epic 6: Trip Brain Service](#8-epic-6-trip-brain-service)
9. [Epic 7: Active Trip Companion](#9-epic-7-active-trip-companion)
10. [Epic 8: Post-Trip Engine](#10-epic-8-post-trip-engine)
11. [Epic 9: Cross-Trip Memory](#11-epic-9-cross-trip-memory)
12. [Epic 10: Booking & Monetisation](#12-epic-10-booking--monetisation)
13. [Epic 11: UI Polish & Animations](#13-epic-11-ui-polish--animations)
14. [Epic 12: Integration & Infrastructure](#14-epic-12-integration--infrastructure)
15. [Implementation Phases](#15-implementation-phases)
16. [Success Metrics](#16-success-metrics)

---

## 1. ARCHITECTURE OVERVIEW

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WAYCRAFT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CLIENT (React)                               │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │  Entry  │ │Discovery│ │Itinerary│ │ Active  │ │Post-Trip│       │   │
│  │  │  Flow   │ │  Phase  │ │  View   │ │  Trip   │ │ Engine  │       │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │   │
│  │       └───────────┴───────────┴───────────┴───────────┘             │   │
│  │                              │                                       │   │
│  │                    ┌─────────┴─────────┐                            │   │
│  │                    │  COMPANION LAYER  │                            │   │
│  │                    │  (Unified across  │                            │   │
│  │                    │   all phases)     │                            │   │
│  │                    └─────────┬─────────┘                            │   │
│  │                              │                                       │   │
│  │              ┌───────────────┼───────────────┐                      │   │
│  │              │               │               │                      │   │
│  │        ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐                 │   │
│  │        │   Trip    │  │  Hidden   │  │  Memory   │                 │   │
│  │        │   Brain   │  │   Gems    │  │  Service  │                 │   │
│  │        │  Service  │  │  Engine   │  │           │                 │   │
│  │        └───────────┘  └───────────┘  └───────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
├────────────────────────────────────┼────────────────────────────────────────┤
│                           EXTERNAL SERVICES                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Google    │ │  Anthropic  │ │ OpenWeather │ │  Affiliate  │          │
│  │   Places    │ │   Claude    │ │     API     │ │    APIs     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        DATABASE (Supabase)                           │   │
│  │   users | trips | itineraries | memories | preferences | bookings    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

```
User Entry (4 fields) 
    → Route Generation 
    → City Suggestions + Hidden Gems Discovery 
    → Planning Companion (conversational refinement) 
    → Itinerary Generation 
    → Trip Brain (scoring, filtering, enrichment) 
    → Active Trip Companion 
    → Post-Trip Processing 
    → Memory Persistence
```

### Key Technical Decisions

| Concern | Decision | Rationale |
|---------|----------|-----------|
| State Management | React Context + Zustand | Context for companion state, Zustand for global app state |
| Database | Supabase (PostgreSQL) | Need persistence for memory, trips, cross-device sync |
| AI Companion | Anthropic Claude API | Quality of conversation, context handling |
| Places Data | Google Places API | Hidden gems algorithm, place details |
| Weather | OpenWeather API | Free tier sufficient for MVP |
| Booking | Affiliate APIs | Booking.com, GetYourGuide, TheFork |

### Companion Philosophy (Technical Implications)

The companion is a unified entity across all phases. It's not different components - it's one stateful service that adapts its behaviour based on trip phase:

| Phase | Companion Behaviour | Technical Mode |
|-------|--------------------| ---------------|
| Discovery | Reactive - answers questions, suggests based on map interactions | `planning` |
| Refinement | Conversational - gathers preferences through natural dialogue | `planning` |
| Itinerary | Helpful - explains choices, offers alternatives | `planning` |
| Active Trip | Proactive - surfaces recommendations, alerts, real-time guidance | `active` |
| Post-Trip | Reflective - summarises, asks for feedback, creates memories | `post` |

---

## 2. EPIC 0: ENTRY FLOW REDESIGN

**Goal:** Reduce entry friction from 15+ inputs to 4. Get users to the map in under 20 seconds.

**Current State:** Multi-section form with occasion, travel style, pace, interests, dining preferences, budget, accommodation, accessibility options, trip pace, duration, traveller count, and various other fields.

**Target State:** Four inputs only - origin, destination, dates, traveller type. Everything else is gathered later through the companion or passive observation.

---

### WI-0.1: Create Simplified Entry Form ✓

**Effort:** Medium

**Description:** Build a new entry form component that replaces the existing multi-section form. The form should have exactly four input groups: route (origin/destination with optional waypoints), dates (start/end), and traveller type (single-select chips).

**Technical Requirements:**
- Route input should support Google Places autocomplete for both origin and destination
- Optional "add waypoint" functionality that reveals additional location inputs
- Date picker should prevent past dates and calculate/display trip duration in nights
- Traveller selector should be single-tap chip selection: Solo, Couple, Family, Friends, Group
- Form validation should enable submit only when origin, destination, and dates are complete
- Submit triggers route generation and navigates to Discovery phase

**Integration Points:**
- Connects to existing route generation service
- Passes minimal data forward; preferences are NOT collected here
- Should work with existing authentication flow

**UX Requirements:**
- Time to complete < 20 seconds for typical user
- Mobile-first layout (stacks vertically on small screens)
- Clear visual hierarchy: route is primary, dates secondary, travellers tertiary
- Submit button prominent and clear: "Show me the route"

**Agent Instructions:** Use ultrathink. Reference the frontend-design skill for visual implementation. The form should feel fast and lightweight, not like a bureaucratic questionnaire.

**Acceptance Criteria:**
- [x] Only 4 input groups visible (route, dates, travellers)
- [x] Waypoints are optional and hidden until user clicks to add
- [x] Form completes in under 20 seconds for typical use
- [x] Mobile responsive
- [x] Validates before enabling submit
- [x] Integrates with existing route generation

**Implementation Notes:**
- Created `spotlight-react/src/components/entry/` directory with:
  - `types.ts` - TypeScript types for CityData, TravellerType, EntryFormData
  - `LocationInput.tsx` - Location autocomplete using `/api/geocode/autocomplete`
  - `DateRangePicker.tsx` - Calendar-based date range picker with quick selection
  - `TravellerTypeChips.tsx` - Chip selector for Solo/Couple/Family/Friends/Group
  - `SimplifiedEntryForm.tsx` - Main form with visual journey line connecting locations
  - `NewTripPage.tsx` - Page wrapper handling form submission
  - `index.ts` - Exports
- Route added: `/new` → NewTripPage
- Validates distance (50-3000km) and nights (2-30)
- Uses existing `/api/generate-unified-route` endpoint

---

### WI-0.2: Create Location Autocomplete Component ✓

**Effort:** Medium

**Description:** Build a reusable location autocomplete input powered by Google Places API. This will be used for origin, destination, and waypoints in the entry form, and potentially elsewhere in the app.

**Technical Requirements:**
- Integrates with Google Places Autocomplete API
- Debounced search (300ms delay)
- Returns structured location data: placeId, name, coordinates (lat/lng)
- Supports type restrictions (e.g., cities only)
- Supports country restrictions for regional limiting
- Keyboard navigation: arrow keys, enter to select, escape to close
- Shows recent searches from localStorage when focused and empty
- Optional "Use current location" option using browser geolocation
- Clear button to reset selection
- Loading state during API calls
- Error handling for API failures

**UX Requirements:**
- Dropdown appears below input with suggestions
- Selected location displays cleanly in input (city name, country)
- Feels instant - minimal perceived latency

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Focus on making this feel snappy and responsive.

**Acceptance Criteria:**
- [x] Google Places API integration working
- [x] Debounced search
- [x] Keyboard accessible
- [x] Recent searches stored and displayed
- [x] Current location option (with permission handling)
- [x] Clean error states
- [x] Reusable across app

**Implementation Notes:**
- Enhanced `LocationInput.tsx` with full keyboard navigation (ArrowUp/Down, Enter, Escape)
- Recent searches stored in localStorage (`waycraft_recent_locations`), limited to 5 entries
- "Use current location" option uses browser geolocation + `/api/geocode/reverse` endpoint
- Clear button (X) appears when city is selected
- ARIA attributes for accessibility (combobox role, aria-activedescendant)
- Graceful error handling for permission denied, timeout, unavailable location

---

### WI-0.3: Create Date Range Picker Component ✓

**Effort:** Small

**Description:** Build a date range picker for selecting trip start and end dates. Should feel native and fast.

**Technical Requirements:**
- Click/tap opens calendar view
- Two-step selection: pick start date, then pick end date
- Displays selected range with calculated nights count
- Prevents selection of past dates
- Optional: maximum range limit (e.g., 30 days)
- Stores dates as ISO strings for consistency
- Handles timezone considerations appropriately

**UX Requirements:**
- Calendar should be visually clear with selected range highlighted
- Mobile: full-screen or bottom sheet calendar
- Desktop: dropdown calendar
- Shows "X nights" calculation prominently

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Can use a library like react-day-picker or build custom - agent's choice based on what integrates best.

**Acceptance Criteria:**
- [x] Calendar UI for date selection
- [x] Range selection (start → end)
- [x] Nights calculation displayed
- [x] Past dates disabled
- [x] Mobile and desktop appropriate layouts
- [x] Clean integration with form state

**Implementation Notes:**
- Mobile: Bottom sheet with backdrop, drag handle, and confirm button
- Desktop: Dropdown calendar with click-outside to close
- `useIsMobile()` hook detects viewport < 640px
- Full keyboard navigation (Arrow keys, Enter, Space, Home, End, Escape)
- Max range enforcement: dates > 30 nights from start are visually disabled
- Optional `onClear` prop for clear button functionality
- Optional `maxNights` prop (defaults to 30)
- Body scroll lock when mobile modal is open
- Quick selection buttons: 3 nights, Week, 2 weeks
- ARIA attributes for accessibility (role="grid", aria-selected, aria-disabled)

---

### WI-0.4: Create Traveller Type Selector Component ✓

**Effort:** Small

**Description:** Build a single-select chip/button group for selecting traveller type.

**Technical Requirements:**
- Five options: Solo, Couple, Family, Friends, Group
- Single selection only (radio behaviour)
- Each option has an icon and label
- Selected state is visually distinct
- Stores selection as enum/string value

**UX Requirements:**
- One-tap selection
- Horizontally scrollable on mobile if needed
- Clear which option is selected
- Icons should be recognisable and appropriate

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Keep it simple - this is not a complex component.

**Acceptance Criteria:**
- [x] Five traveller type options
- [x] Single selection behaviour
- [x] Icons for each type
- [x] Clear selected state
- [x] Mobile friendly

**Implementation Notes (completed):**
- Enhanced existing `TravellerTypeChips.tsx` component
- Added horizontal scroll with snap on mobile (uses existing `scrollbar-hide` utility)
- Added keyboard navigation (ArrowLeft/Right/Up/Down, Home, End keys)
- Implemented ARIA radiogroup pattern (`role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-labelledby`)
- Added roving tabindex for proper focus management
- Added focus-visible ring states for keyboard users
- Desktop: wraps chips as before (`md:flex-wrap`)

---

### WI-0.5: Remove/Archive Old Entry Form ✓

**Effort:** Small

**Description:** Deprecate the existing multi-section entry form. Don't delete - archive it in case we need to reference the preference options later for the companion's conversational gathering.

**Technical Requirements:**
- Move old form components to an `/archived` or `/deprecated` folder
- Update routing to use new SimpleEntryForm
- Ensure no broken imports
- Document what preference options existed (for companion reference)

**Agent Instructions:** Be careful not to break anything. Keep the old code accessible but not active.

**Acceptance Criteria:**
- [x] Old form archived, not deleted
- [x] New form is the default entry point
- [x] No broken imports or routes
- [x] Documented list of old preference options

**Implementation Notes (completed):**
- Moved `personalization` folder to `src/components/archived/personalization/`
- Contains: `QuickPreferenceEditor.tsx`, `AIInsights.tsx`, `index.ts`
- Created `PREFERENCE_OPTIONS_REFERENCE.ts` documenting all preference options for companion reference:
  - Occasion options (12 types: honeymoon, anniversary, birthday, etc.)
  - Travel style options (5 types: explorer, relaxer, culture, adventurer, foodie)
  - Interest options (15 types: history, art, architecture, nature, food, etc.)
  - Dining style options (4 types: street, casual, mix, fine)
  - Budget options (3 levels: budget, mid, luxury)
  - Accommodation options (4 types: budget, mid, luxury, unique)
  - Pace options (1-5 scale)
  - Accessibility options (4 types)
  - Toggle preferences (6 boolean options)
  - Companion conversation prompts for gathering preferences
- Updated `App.tsx` routing with `SmartRouteHandler`:
  - `/` now redirects to `/new` (new entry form) unless ?routeId param exists
  - `/spotlight` route added for direct SpotlightV2 access
  - Existing routes preserved (?routeId=xxx still works)
- Added `src/components/archived` to tsconfig exclude to prevent compilation errors

---

### WI-0.6: Entry Flow Analytics ✓

**Effort:** Small

**Description:** Add analytics tracking to measure entry flow performance.

**Technical Requirements:**
- Track: form_started, form_completed, form_abandoned
- Track time_to_complete
- Track which field users are on when they abandon
- Track waypoints_added count

**Agent Instructions:** Use existing analytics setup if present. If not, use a simple event tracking pattern that can be connected to analytics provider later.

**Acceptance Criteria:**
- [x] Key events tracked
- [x] Time to complete measured
- [x] Abandonment point tracked

**Implementation Notes (completed):**
- Created extensible analytics service in `src/services/analytics.ts`:
  - Handler-based pattern for flexibility (default console logging in dev)
  - Easy to swap in real providers via `setHandler()` (Google Analytics, Mixpanel, PostHog, etc.)
  - Full TypeScript types for all events and properties
  - Silent failure to prevent analytics from breaking the app
- Created `useEntryFormAnalytics` hook in `src/hooks/useEntryFormAnalytics.ts`:
  - Tracks `entry_form_started` on mount
  - Tracks `entry_form_field_focused` when fields receive focus
  - Tracks `entry_form_field_completed` when fields are filled
  - Tracks `entry_form_completed` with full metrics (timeToComplete, travellerType, tripDuration, distance, waypointsAdded)
  - Tracks `entry_form_abandoned` on unmount, beforeunload, and visibilitychange
  - Records last active field and completed fields for abandonment analysis
- Updated sub-components with optional analytics callbacks:
  - `LocationInput`: added `onInputFocus` prop
  - `DateRangePicker`: added `onPickerOpen` prop
  - `TravellerTypeChips`: added `onChipFocus` prop
- Integrated analytics into `SimplifiedEntryForm.tsx`:
  - Tracks field focus, completion, and form submission
  - Uses useEffect to detect field completions from state changes

---

## 3. EPIC 1: DISCOVERY PHASE

**Goal:** Show users their route with AI-suggested cities immediately after entry. Let them explore, add/remove cities, and see what's available before committing to a detailed itinerary.

**Current State:** After form submission, users likely go straight to itinerary generation or a basic route view.

**Target State:** A map-centric discovery experience where users see suggested stops, hidden gem counts per city, and can interact with the companion to learn more.

---

### WI-1.1: Create Discovery Phase Container ✓

**Effort:** Medium

**Description:** Build the main container component for the Discovery phase. This orchestrates the map view, city pins, and companion panel.

**Technical Requirements:**
- Full-screen layout with map as primary element
- Companion panel: sidebar on desktop, bottom sheet on mobile
- City pins displayed on route
- Header with trip summary (origin → destination, dates, travellers)
- Navigation to proceed to itinerary generation
- State management for selected cities, user interactions

**Layout Structure:**
- Desktop: Map (70%) | Companion Panel (30%)
- Mobile: Map (full screen) with bottom sheet companion (expandable)

**Integration Points:**
- Receives route data from entry flow
- Consumes Hidden Gems Engine for city data
- Hosts Planning Companion instance
- Passes selected cities to Itinerary Generation

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. The map should feel like the hero - companion is supportive, not dominant.

**Acceptance Criteria:**
- [x] Map displays route between origin and destination
- [x] Suggested cities shown as pins on route
- [x] Companion panel present and functional
- [x] Desktop and mobile layouts working
- [x] State properly managed for city selections

**Implementation Notes (completed):**
- Created Zustand store `src/stores/discoveryStore.ts`:
  - Manages route, tripSummary, phase, selectedCityId
  - Actions for city selection, toggling, night updates
  - Companion message state
  - Map center/zoom with flyToCity action
  - Computed getSelectedCities() and getTotalSelectedNights()
- Created `src/components/discovery/` folder with components:
  - `DiscoveryPhaseContainer.tsx` - Main orchestrator, handles data loading and layout
  - `DiscoveryHeader.tsx` - Floating header with trip summary and navigation
  - `DiscoveryMap.tsx` - Mapbox GL map with city markers and route line
  - `DiscoveryCompanionPanel.tsx` - Desktop sidebar (380px) + mobile bottom sheet
  - `DiscoveryCityPreview.tsx` - Modal for city details and add/remove
  - `DiscoveryLoadingState.tsx` - Beautiful loading screen with animations
- Added `/discover` route to App.tsx
- Updated NewTripPage to navigate to /discover after form submission
- Data flow: Entry form → sessionStorage → Discovery phase → sessionStorage → Itinerary generation
- Layout: Desktop 70/30 split, Mobile full-screen map with draggable bottom sheet
- Design: Matches Waycraft editorial aesthetic (terracotta, sage, golden colors)
- Mock city data generated for development; will integrate with real API

---

### WI-1.2: Create City Pin Component ✓

**Effort:** Small

**Description:** Build the map pin component that represents a suggested city/stop on the route.

**Technical Requirements:**
- Displays city name
- Shows indicator of what's available (e.g., "14 places" or "8 hidden gems")
- Visual states: default, hovered, selected, added-to-trip, removed
- Click/tap opens city preview
- Draggable for reordering (stretch goal)

**Data Required:**
- City name
- Coordinates
- Place count or hidden gem count
- Selection state

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Pins should be visually distinct but not cluttered.

**Acceptance Criteria:**
- [x] City name visible
- [x] Place count/hidden gem indicator
- [x] Click opens preview
- [x] Visual states for selection
- [x] Works on touch and mouse

**Implementation Notes (completed):**
- Created `src/components/discovery/DiscoveryCityPin.tsx` as standalone component
- Five visual states with distinct styling:
  - `default`: White bg, grey border, pulse animation to attract attention
  - `hovered`: White bg, accent text, ring highlight, elevated shadow
  - `selected`: White bg, accent ring, larger shadow
  - `added`: Sage green bg, white text (city in trip)
  - `fixed`: Terracotta bg, white text (origin/destination)
- Hidden gems badge: Golden pill with gem icon + count (shows "99+" for large counts)
- Staggered entrance animation with configurable delay prop
- Hover tooltip on desktop showing city description
- Different icons per state: MapPin (origin), Star (destination), Check (added), Plus (default)
- 48px tap target for mobile accessibility
- Exported from discovery index.ts
- Updated DiscoveryMap to use new component with staggered delays

---

### WI-1.3: Create City Preview Panel

**Effort:** Medium

**Description:** Build the panel/modal that shows when a user taps a city pin. Displays a preview of what's in that city.

**Technical Requirements:**
- Shows city name and brief description
- Displays top 4-5 places with:
  - Photo (from Google Places)
  - Name
  - Type (restaurant, museum, etc.)
  - Rating and review count
  - Hidden gem badge if applicable
- "See all" button to expand full list
- "Add to trip" / "Remove from trip" toggle
- Favourite/save individual places

**Data Flow:**
- Fetches place data from Hidden Gems Engine
- Updates trip state when city added/removed
- Saves favourited places to trip preferences

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. This is where users decide if a city is worth stopping in - make it compelling.

**Acceptance Criteria:**
- [ ] City info displayed
- [ ] Top places shown with photos
- [ ] Hidden gem badges where applicable
- [ ] Add/remove city functionality
- [ ] Favourite places functionality
- [ ] Full list accessible

---

### WI-1.4: Create Add City Functionality

**Effort:** Medium

**Description:** Allow users to add cities that weren't in the AI suggestions.

**Technical Requirements:**
- Search input to find cities
- Uses Google Places API with city type restriction
- Shows search results with basic info
- Adding a city triggers hidden gems fetch for that location
- City appears on map and in trip state
- Validation: city should be reasonably on-route (warn if far off)

**UX Flow:**
1. User clicks "Add a stop" button
2. Search modal/panel appears
3. User searches for city
4. Results appear with "Add" button
5. City added to trip, pin appears on map

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Make adding cities feel easy and encouraged.

**Acceptance Criteria:**
- [ ] City search working
- [ ] Results display with add option
- [ ] Added cities appear on map
- [ ] Hidden gems fetched for new cities
- [ ] Warning if city is far off route

---

### WI-1.5: Create Remove/Reorder City Functionality

**Effort:** Small

**Description:** Allow users to remove suggested cities or reorder their stops.

**Technical Requirements:**
- Remove: click X on pin or in city list, city removed from trip
- Reorder: drag pins on map OR drag items in city list
- Route recalculates when order changes
- Removed cities can be re-added

**Agent Instructions:** Use ultrathink. Make removal feel safe (not permanent/scary). Reordering should feel natural.

**Acceptance Criteria:**
- [ ] Cities can be removed
- [ ] Cities can be reordered
- [ ] Route updates on changes
- [ ] Removed cities can be re-added

---

### WI-1.6: Create Discovery Phase State Management

**Effort:** Medium

**Description:** Set up state management for the Discovery phase.

**State Shape:**
```
{
  route: {
    origin: Location,
    destination: Location,
    waypoints: Location[],
  },
  dates: { start: Date, end: Date },
  travellers: TravellerType,
  suggestedCities: City[],
  selectedCities: City[],  // Cities user has confirmed for trip
  removedCities: City[],   // Cities user explicitly removed
  cityPlaces: Map<cityId, Place[]>,  // Cached places per city
  favouritePlaces: Place[],
  companionMessages: Message[],
  inferredPreferences: Preferences,  // From passive observation
}
```

**Technical Requirements:**
- Zustand store for Discovery state
- Actions for: addCity, removeCity, reorderCities, favouritePlace, etc.
- Selectors for derived data
- Persistence to localStorage for session recovery
- Sync with companion context

**Agent Instructions:** Use ultrathink. Design state shape to be easily extensible.

**Acceptance Criteria:**
- [ ] State store created with all required fields
- [ ] Actions implemented
- [ ] Selectors for derived data
- [ ] Session persistence
- [ ] Companion integration

---

### WI-1.7: Create "Proceed to Itinerary" Flow

**Effort:** Small

**Description:** Build the transition from Discovery to Itinerary Generation.

**Technical Requirements:**
- Button: "Generate my itinerary" (or similar)
- Validates minimum requirements (at least origin + destination)
- Passes selected cities, favourited places, inferred preferences to itinerary generator
- Loading state during generation
- Error handling if generation fails

**UX Requirements:**
- Clear call-to-action
- Confidence messaging: "Based on your selections, I'll create a day-by-day plan"
- Option to go back and adjust before generating

**Agent Instructions:** Use ultrathink. This is a commitment moment - make it feel exciting, not scary.

**Acceptance Criteria:**
- [ ] Clear CTA button
- [ ] Validation before proceeding
- [ ] Data passed to itinerary generation
- [ ] Loading state
- [ ] Error handling

---

## 4. EPIC 2: HIDDEN GEMS ENGINE

**Goal:** Build the data engine that surfaces high-quality, low-popularity places - the "hidden gems" that differentiate Waycraft from TripAdvisor-style popular-first sorting.

**Core Algorithm:** High rating (4.3+) + Low review count (<150) + Minimum reviews (>10) = Hidden Gem

---

### WI-2.1: Create Hidden Gems Service

**Effort:** Large

**Description:** Build the core service that queries Google Places API and applies the hidden gems algorithm.

**Technical Requirements:**
- Accepts: location (coordinates or place ID), radius, place types
- Queries Google Places API (Nearby Search or Text Search)
- Applies hidden gem filtering:
  - rating >= 4.3
  - user_ratings_total < 150
  - user_ratings_total > 10 (filters out brand new or suspicious places)
- Returns enriched place data with hidden gem score
- Caching layer to avoid redundant API calls (places don't change hourly)
- Rate limiting to stay within API quotas

**Hidden Gem Scoring:**
```
hiddenGemScore = (rating - 4.0) * reviewScarcityFactor

where reviewScarcityFactor = 1 - (reviewCount / 150)
```
Higher score = better hidden gem

**Place Data Structure:**
```
{
  placeId: string,
  name: string,
  coordinates: { lat, lng },
  rating: number,
  reviewCount: number,
  types: string[],
  priceLevel: number | null,
  photos: PhotoReference[],
  openingHours: OpeningHours | null,
  hiddenGemScore: number,
  isHiddenGem: boolean,
}
```

**Agent Instructions:** Use ultrathink. This is a core differentiator - get the algorithm right.

**Acceptance Criteria:**
- [ ] Google Places API integration working
- [ ] Hidden gem filtering applied correctly
- [ ] Scoring algorithm implemented
- [ ] Caching layer functional
- [ ] Rate limiting in place
- [ ] Returns well-structured place data

---

### WI-2.2: Create Place Type Categorisation

**Effort:** Small

**Description:** Build a mapping system that categorises Google Places types into user-friendly categories.

**Technical Requirements:**
- Map Google Places types to Waycraft categories:
  - Food & Drink: restaurant, cafe, bar, bakery, etc.
  - Culture: museum, art_gallery, church, etc.
  - Nature: park, natural_feature, etc.
  - Nightlife: night_club, bar, etc.
  - Shopping: store, shopping_mall, etc.
  - Activities: tourist_attraction, amusement_park, etc.
- Handle places with multiple types (primary category selection)
- Support filtering by category

**Agent Instructions:** Use ultrathink. Create a sensible mapping that covers common place types.

**Acceptance Criteria:**
- [ ] Type mapping covers common Google Places types
- [ ] Primary category selection logic
- [ ] Filtering by category works

---

### WI-2.3: Create Places Fetch for City

**Effort:** Medium

**Description:** Build the function that fetches all relevant places for a given city.

**Technical Requirements:**
- Input: city coordinates, radius (default ~15km for city coverage)
- Fetches places across multiple categories (food, culture, nature, etc.)
- Applies hidden gem filtering to each category
- Aggregates results
- Returns:
  - All places (for full list view)
  - Hidden gems only (filtered)
  - Top places by category
  - Stats: total count, hidden gem count

**Optimisation:**
- Parallel requests for different place types
- Cached results per city
- Background refresh for stale caches

**Agent Instructions:** Use ultrathink. Optimise for speed - users are waiting for this data.

**Acceptance Criteria:**
- [ ] Fetches places for a city across categories
- [ ] Hidden gem filtering applied
- [ ] Aggregated stats returned
- [ ] Caching working
- [ ] Parallel requests for performance

---

### WI-2.4: Create Place Details Enrichment

**Effort:** Medium

**Description:** Fetch additional details for places when needed (e.g., when user views a specific place).

**Technical Requirements:**
- Uses Google Places Details API
- Fetches: full reviews, photos, website, phone, detailed hours
- On-demand fetching (not for all places upfront)
- Cache results
- Extract useful review snippets for "why visit" text

**Review Analysis:**
- Extract key phrases from top reviews
- Identify commonly mentioned positives
- This powers the "why this place is special" text

**Agent Instructions:** Use ultrathink. Be mindful of API costs - only fetch details when needed.

**Acceptance Criteria:**
- [ ] Place Details API integration
- [ ] Additional data fetched on demand
- [ ] Caching working
- [ ] Review snippet extraction

---

### WI-2.5: Create Chain/Franchise Detection

**Effort:** Small

**Description:** Filter out chain restaurants and franchises from hidden gems results.

**Technical Requirements:**
- Maintain list of known chain names/patterns
- Check place name against chain list
- Use Google Places types to identify chains (some are typed as chain)
- Flag rather than remove (user might want chains for convenience)

**Known Chains to Detect:**
- Fast food: McDonald's, KFC, Burger King, Subway, etc.
- Coffee: Starbucks, Costa, etc.
- Hotels: Hilton, Marriott, etc. (for accommodation)
- Add regional chains as discovered

**Agent Instructions:** Use ultrathink. Start with obvious global chains, make it extensible.

**Acceptance Criteria:**
- [ ] Chain detection working
- [ ] Known chains list maintained
- [ ] Flagging not hard removal
- [ ] Extensible pattern

---

### WI-2.6: Create Hidden Gems Cache Layer

**Effort:** Medium

**Description:** Build a caching system to avoid redundant API calls and improve performance.

**Technical Requirements:**
- Cache key: city/location + radius + timestamp
- Cache storage: localStorage for client, Redis/DB for server
- TTL: 24 hours for place lists, 7 days for place details
- Cache invalidation strategy
- Fallback to API if cache miss

**Cache Levels:**
1. In-memory (fastest, current session)
2. localStorage (persists across sessions, client-side)
3. Server cache (shared across users, if applicable)

**Agent Instructions:** Use ultrathink. Balance freshness vs. API cost savings.

**Acceptance Criteria:**
- [ ] Multi-level caching working
- [ ] Appropriate TTLs set
- [ ] Fallback to API on miss
- [ ] Cache invalidation strategy

---

### WI-2.7: Create API Rate Limiting & Quota Management

**Effort:** Small

**Description:** Implement rate limiting to stay within Google Places API quotas.

**Technical Requirements:**
- Track API calls per time period
- Implement request queuing if approaching limits
- Graceful degradation if quota exceeded
- Alerting/logging when quota is running low
- Consider API key rotation if needed

**Agent Instructions:** Use ultrathink. Don't let the app break because we hit API limits.

**Acceptance Criteria:**
- [ ] Rate limiting implemented
- [ ] Queue for high-traffic periods
- [ ] Graceful degradation
- [ ] Quota monitoring

---

## 5. EPIC 3: PLANNING-PHASE COMPANION

**Goal:** The companion should be available and helpful during the Discovery and Planning phases - not just during active trips. It answers questions, suggests based on context, and gathers preferences conversationally.

**Philosophy:** The companion is reactive during planning - it responds to user actions and questions rather than bombarding them with prompts. It's available, not demanding.

---

### WI-3.1: Create Planning Companion Service

**Effort:** Large

**Description:** Build the AI companion service that handles conversation during the planning phases.

**Technical Requirements:**
- Integrates with Anthropic Claude API
- Maintains conversation history within session
- Context includes: trip details, selected cities, user interactions, favourited places
- Responds to:
  - Direct questions: "What's good in Lyon?"
  - Preference statements: "We love wine and food"
  - Requests: "Add a beach stop somewhere"
  - Comparisons: "Which city has better nightlife?"
- Generates suggestions based on context
- Learns preferences from conversation (extracts and stores)

**Conversation Context Structure:**
```
{
  tripDetails: { origin, destination, dates, travellers },
  selectedCities: City[],
  favouritePlaces: Place[],
  userMessages: Message[],
  assistantMessages: Message[],
  extractedPreferences: {
    interests: string[],
    avoidances: string[],
    pace: 'relaxed' | 'balanced' | 'packed',
    budget: 'budget' | 'mid' | 'luxury',
    // etc.
  }
}
```

**Agent Instructions:** Use ultrathink. The companion should feel knowledgeable and helpful, not robotic.

**Acceptance Criteria:**
- [ ] Claude API integration working
- [ ] Conversation history maintained
- [ ] Trip context included in prompts
- [ ] Responds appropriately to different query types
- [ ] Preferences extracted from conversation

---

### WI-3.2: Create Companion System Prompt for Planning

**Effort:** Medium

**Description:** Craft the system prompt that defines the companion's personality and behaviour during planning.

**Prompt Requirements:**
- Personality: knowledgeable local friend, not a tour guide or salesperson
- Tone: warm, opinionated but not pushy, occasionally witty
- Behaviour:
  - Answers questions about cities and places
  - Suggests based on stated or inferred preferences
  - Mixes iconic sights with hidden gems: "The Duomo is packed but unmissable - go early. Skip the restaurants nearby though, tourist traps. Here's where locals eat instead."
  - Asks clarifying questions only when genuinely needed
  - Acknowledges when it doesn't know something
- Context awareness: knows the full trip, what user has selected, what they've asked about
- Output format: conversational, not bullet points (unless user asks for list)

**Agent Instructions:** Use ultrathink. This prompt is crucial - it defines the entire companion experience.

**Acceptance Criteria:**
- [ ] System prompt crafted
- [ ] Personality consistent
- [ ] Handles various query types well
- [ ] Doesn't over-explain or under-explain
- [ ] Balances iconic and hidden gems

---

### WI-3.3: Create Companion Message UI Components

**Effort:** Medium

**Description:** Build the UI components for the companion chat interface during planning.

**Technical Requirements:**
- Chat message list (scrollable)
- User message input (text input + send button)
- Message bubbles (user vs. assistant styling)
- Typing indicator while assistant is responding
- Place cards embedded in messages (when companion mentions specific places)
- Quick action chips (when companion suggests options)
- Expandable/collapsible on mobile

**UX Requirements:**
- Messages appear smoothly (animation)
- Auto-scroll to latest message
- Input stays fixed at bottom
- Easy to dismiss/minimise on mobile
- Place cards are tappable to view details

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Chat UI should feel modern and responsive.

**Acceptance Criteria:**
- [ ] Message list working
- [ ] User input working
- [ ] Typing indicator
- [ ] Place cards embedded
- [ ] Quick action chips
- [ ] Mobile collapsible
- [ ] Smooth animations

---

### WI-3.4: Create Companion Context Observer

**Effort:** Medium

**Description:** Build a system that observes user behaviour during Discovery phase and updates companion context accordingly.

**Technical Requirements:**
- Observes:
  - Cities user clicks on (interested)
  - Cities user removes (not interested)
  - Places user favourites (strong interest)
  - Time spent viewing certain place types
  - Search queries in city search
- Updates inferred preferences based on observations
- Makes observations available to companion context
- Does NOT interrupt user - purely passive observation

**Inference Rules:**
- User favourites 3 restaurants → infer "foodie"
- User removes mountain/hiking city → infer "not into hiking"
- User adds coastal city → infer "likes beaches"
- User spends time on nightlife listings → infer "interested in nightlife"

**Agent Instructions:** Use ultrathink. Be smart about inference but don't over-assume.

**Acceptance Criteria:**
- [ ] Observes key user actions
- [ ] Updates inferred preferences
- [ ] Available to companion context
- [ ] Non-intrusive (no UI impact)

---

### WI-3.5: Create Companion Proactive Suggestions (Gentle)

**Effort:** Medium

**Description:** Allow the companion to occasionally offer helpful suggestions without being asked - but very sparingly.

**Technical Requirements:**
- Triggers for proactive messages:
  - User adds a city → "Nice choice! Lyon has some incredible hidden restaurants. Want me to highlight a few?"
  - User has been browsing silently for 2+ minutes → "Finding what you're looking for? I can suggest some stops based on your route."
  - User removes multiple cities → "Narrowing it down! What kind of stops are you hoping for?"
- Maximum 1 proactive message per 5 minutes (not spammy)
- User can dismiss/ignore without consequence
- Proactive suggestions disabled if user hasn't engaged with companion at all

**Agent Instructions:** Use ultrathink. Less is more here - companion should be helpful, not annoying.

**Acceptance Criteria:**
- [ ] Trigger conditions implemented
- [ ] Rate limiting on proactive messages
- [ ] Can be dismissed
- [ ] Respects user who doesn't want to chat

---

### WI-3.6: Create Place Card Component for Chat

**Effort:** Small

**Description:** Build a compact place card that can be embedded in companion chat messages.

**Technical Requirements:**
- Displays: photo, name, type, rating, hidden gem badge
- Compact format (fits in chat bubble context)
- Tappable to open full place details
- "Add to favourites" quick action
- Works inline in message flow

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Should feel native to chat UI.

**Acceptance Criteria:**
- [ ] Compact place display
- [ ] Key info visible
- [ ] Tappable for details
- [ ] Quick favourite action
- [ ] Fits chat flow

---

### WI-3.7: Create Quick Action Chips Component

**Effort:** Small

**Description:** Build chips that appear below companion messages when offering choices.

**Technical Requirements:**
- Displays options as tappable chips
- Tapping sends that option as user message
- Supports: text options, place options, yes/no, etc.
- Disappears after selection or after next message
- Horizontally scrollable if many options

**Example Usage:**
- Companion: "What kind of vibe are you after?"
- Chips: [Food & Wine] [Culture & History] [Nature & Adventure] [Nightlife] [Mix of everything]

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Chips should speed up interaction, not complicate it.

**Acceptance Criteria:**
- [ ] Chips display below messages
- [ ] Tapping sends as message
- [ ] Disappears appropriately
- [ ] Scrollable if needed

---

## 6. EPIC 4: PREFERENCE & REFINEMENT SYSTEM

**Goal:** Build the system that captures, stores, and applies user preferences - both explicit (stated) and implicit (observed).

---

### WI-4.1: Create Preferences Data Model

**Effort:** Medium

**Description:** Define the data structure for user preferences that will be used across the app.

**Preference Categories:**
```
{
  // Interests (what they want to see/do)
  interests: {
    food: number,      // 0-1 strength
    culture: number,
    nature: number,
    nightlife: number,
    shopping: number,
    adventure: number,
    relaxation: number,
  },
  
  // Specific interests (extracted from conversation)
  specificInterests: string[],  // e.g., ["wine", "street art", "local markets"]
  
  // Avoidances
  avoid: string[],  // e.g., ["crowded tourist spots", "hiking", "museums"]
  
  // Trip style
  pace: 'relaxed' | 'balanced' | 'packed',
  
  // Budget
  budget: 'budget' | 'moderate' | 'comfort' | 'luxury',
  
  // Dining
  diningStyle: 'street_food' | 'casual' | 'mixed' | 'fine_dining',
  dietaryRequirements: string[],  // e.g., ["vegetarian", "gluten-free"]
  
  // Accommodation (if relevant)
  accommodationStyle: 'budget' | 'comfortable' | 'luxury' | 'unique',
  
  // Accessibility
  accessibilityNeeds: string[],
  
  // Meta
  confidence: number,  // 0-1, how confident we are in these preferences
  sources: {
    stated: boolean,    // User explicitly said
    observed: boolean,  // Inferred from behaviour
    historical: boolean, // From past trips
  }
}
```

**Agent Instructions:** Use ultrathink. Design for extensibility - we'll add more preference types over time.

**Acceptance Criteria:**
- [ ] Comprehensive preference structure defined
- [ ] TypeScript types created
- [ ] Confidence tracking included
- [ ] Source tracking included

---

### WI-4.2: Create Preference Storage Service

**Effort:** Medium

**Description:** Build the service that stores and retrieves preferences.

**Technical Requirements:**
- Local storage for current session (fast access)
- Supabase storage for persistence across sessions
- Merge logic for combining stated + observed preferences
- Preference versioning (preferences may evolve)
- Per-trip preferences vs. global user preferences
- Sync strategy between local and remote

**Operations:**
- getPreferences(userId, tripId?) → Preferences
- updatePreference(key, value, source) → void
- mergePreferences(stated, observed, historical) → Preferences
- clearTripPreferences(tripId) → void

**Agent Instructions:** Use ultrathink. Handle merge conflicts gracefully (stated should override observed).

**Acceptance Criteria:**
- [ ] Local storage working
- [ ] Remote storage working
- [ ] Merge logic implemented
- [ ] Per-trip and global separation
- [ ] Sync working

---

### WI-4.3: Create Preference Extraction from Conversation

**Effort:** Medium

**Description:** Build the system that extracts preferences from companion conversation.

**Technical Requirements:**
- Analyses user messages for preference signals
- Uses Claude to extract structured preferences from natural language
- Examples:
  - "We love wine" → interests.food +0.3, specificInterests.push("wine")
  - "Not really into museums" → avoid.push("museums"), interests.culture -0.2
  - "We want to take it easy" → pace = "relaxed"
- Updates preference store with extracted data
- Confidence based on explicitness of statement

**Agent Instructions:** Use ultrathink. Extraction should be smart but conservative - don't over-infer.

**Acceptance Criteria:**
- [ ] Preference extraction working
- [ ] Common patterns recognised
- [ ] Confidence appropriately set
- [ ] Preference store updated

---

### WI-4.4: Create Preference Inference from Behaviour

**Effort:** Medium

**Description:** Build the system that infers preferences from user behaviour (passive observation).

**Technical Requirements:**
- Tracks behaviours from WI-3.4 (Context Observer)
- Applies inference rules to update preferences
- Lower confidence than stated preferences
- Decay: if user behaviour contradicts inference, reduce confidence
- Rules engine for mapping behaviours to preference updates

**Inference Rules Examples:**
- Favourite 3+ restaurants → interests.food += 0.2
- Remove all hiking spots → avoid.push("hiking")
- Click on 5 nightlife venues → interests.nightlife += 0.15
- Ignore all shopping listings → interests.shopping -= 0.1

**Agent Instructions:** Use ultrathink. Be subtle - observed preferences should inform, not dictate.

**Acceptance Criteria:**
- [ ] Behaviour tracking connected
- [ ] Inference rules engine built
- [ ] Confidence appropriately lower than stated
- [ ] Contradiction handling (decay)

---

### WI-4.5: Create Manual Preferences Panel (Optional)

**Effort:** Small

**Description:** Build an optional panel where users can explicitly set preferences if they want more control.

**Technical Requirements:**
- Accessible via "Preferences" or "Refine my trip" button
- Simple controls:
  - Interest toggles/sliders
  - Pace selector
  - Budget selector
  - Dietary requirements checkboxes
- Changes apply immediately to suggestions
- Non-mandatory - many users won't touch it

**UX Requirements:**
- Clearly optional ("Want more control? Adjust your preferences")
- Quick to scan and modify
- Changes feel instant

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Keep it simple - this is for power users.

**Acceptance Criteria:**
- [ ] Preferences panel built
- [ ] Key preferences adjustable
- [ ] Changes apply immediately
- [ ] Feels optional, not required

---

### WI-4.6: Create Preference-Based Scoring Integration

**Effort:** Medium

**Description:** Integrate preferences into the place scoring algorithm.

**Technical Requirements:**
- Places scored higher if matching user interests
- Places scored lower if in avoid list
- Price level matching to budget preference
- Pace affects how many places recommended per day
- Scoring weights:
  ```
  preferenceMatchScore = 
    (interestAlignment * 0.4) +
    (budgetMatch * 0.2) +
    (notInAvoid * 0.3) +
    (specificInterestMatch * 0.1)
  ```

**Agent Instructions:** Use ultrathink. This connects preferences to actual recommendations - get it right.

**Acceptance Criteria:**
- [ ] Preference scoring integrated
- [ ] Interest alignment calculated
- [ ] Budget matching working
- [ ] Avoid list respected
- [ ] Scoring weights tuneable

---

## 7. EPIC 5: ITINERARY GENERATION

**Goal:** Generate a day-by-day itinerary based on selected cities, preferences, and constraints. Should feel smart, not random.

---

### WI-5.1: Create Itinerary Generation Service

**Effort:** Large

**Description:** Build the core service that generates a complete trip itinerary.

**Technical Requirements:**
- Input:
  - Selected cities (in order)
  - Trip dates
  - Traveller type
  - Preferences (stated + inferred)
  - Favourited places
- Output:
  - Day-by-day itinerary
  - Each day: city, time slots (morning/afternoon/evening), activities
  - Travel segments between cities
  - Estimated timing

**Generation Logic:**
1. Calculate time per city based on total days and city count
2. For each city, fetch top places matching preferences
3. Distribute places across time slots considering:
   - Opening hours
   - Time-appropriateness (no museums at night)
   - Travel time between places
   - User's pace preference
4. Prioritise favourited places
5. Include mix of iconic + hidden gems
6. Add travel segments between cities
7. Build final itinerary structure

**Itinerary Structure:**
```
{
  tripId: string,
  days: [
    {
      date: string,
      city: City,
      slots: [
        {
          time: 'morning' | 'afternoon' | 'evening',
          activity: Place | TravelSegment,
          duration: number,  // minutes
          notes: string,
        }
      ]
    }
  ],
  totalDistance: number,
  totalDuration: number,
}
```

**Agent Instructions:** Use ultrathink. This is complex - think through edge cases (1 day trip, 30 day trip, etc.).

**Acceptance Criteria:**
- [ ] Generates valid itineraries
- [ ] Respects time constraints
- [ ] Considers opening hours
- [ ] Matches user preferences
- [ ] Includes favourited places
- [ ] Handles various trip lengths

---

### WI-5.2: Create Time Allocation Algorithm

**Effort:** Medium

**Description:** Build the algorithm that decides how much time to spend in each city.

**Technical Requirements:**
- Input: cities, total days, user pace preference
- Base allocation: total days / city count
- Adjustments:
  - Larger cities get more time (Paris > small village)
  - Cities with more favourited places get more time
  - Entry/exit cities get minimum time (arrival/departure day)
- Output: days per city (can be fractional, e.g., 1.5 days)

**Factors:**
- City size/importance (can use place count as proxy)
- User interest match (city strong in user's interests = more time)
- Favourited place count
- Pace preference (relaxed = fewer cities with more time each)

**Agent Instructions:** Use ultrathink. Balance fairness with intelligence - not just even distribution.

**Acceptance Criteria:**
- [ ] Time allocation algorithm working
- [ ] Accounts for city importance
- [ ] Accounts for user interests
- [ ] Respects pace preference
- [ ] Handles edge cases

---

### WI-5.3: Create Daily Schedule Generator

**Effort:** Medium

**Description:** Build the generator that creates a day's schedule within a city.

**Technical Requirements:**
- Input: city, places available, time available, preferences
- Output: scheduled day with morning/afternoon/evening slots
- Considerations:
  - Opening hours of places
  - Typical visit duration per place type
  - Travel time between places within city
  - Meal times (lunch ~12-2pm, dinner ~7-9pm)
  - User pace (packed = 4-5 activities, relaxed = 2-3)
- Should include buffer time (not back-to-back)

**Slot Definitions:**
- Morning: 9am - 12pm
- Afternoon: 12pm - 6pm (includes lunch)
- Evening: 6pm - 10pm (includes dinner)

**Agent Instructions:** Use ultrathink. Make schedules feel realistic, not like a forced march.

**Acceptance Criteria:**
- [ ] Daily schedules generated
- [ ] Opening hours respected
- [ ] Meal times included naturally
- [ ] Buffer time included
- [ ] Pace preference respected

---

### WI-5.4: Create Travel Segment Calculator

**Effort:** Small

**Description:** Calculate travel segments between cities.

**Technical Requirements:**
- Input: origin city, destination city, travel mode (driving default)
- Uses Google Directions API or distance matrix
- Output:
  - Distance
  - Duration
  - Suggested departure time to arrive by X
- Caching for common routes

**Agent Instructions:** Use ultrathink. Consider time of day for traffic (optional enhancement).

**Acceptance Criteria:**
- [ ] Travel time calculation working
- [ ] Distance included
- [ ] Departure time suggestions
- [ ] Caching implemented

---

### WI-5.5: Create Itinerary Display Component

**Effort:** Medium

**Description:** Build the UI to display the generated itinerary.

**Technical Requirements:**
- Day-by-day view with expandable days
- Each day shows:
  - Date and city
  - Timeline of activities
  - Travel segments
- Each activity shows:
  - Time
  - Place name and type
  - Photo thumbnail
  - Hidden gem badge if applicable
  - Duration
- Actions: view details, swap, remove, add

**UX Requirements:**
- Easy to scan full trip
- Easy to drill into specific day
- Clear visual hierarchy
- Feels editable, not locked

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Should feel like your trip, not a generated document.

**Acceptance Criteria:**
- [ ] Day-by-day view working
- [ ] Activities displayed with details
- [ ] Travel segments shown
- [ ] Actions available
- [ ] Mobile responsive

---

### WI-5.6: Create Itinerary Edit Capabilities

**Effort:** Medium

**Description:** Allow users to edit the generated itinerary.

**Technical Requirements:**
- Drag to reorder activities within a day
- Drag to move activities between days
- Remove activity (with "fill gap" or "leave free time" option)
- Add activity:
  - From favourites
  - Search for new
  - "Suggest something" (AI fills slot)
- Swap activity:
  - Show alternatives for this slot
  - Replace with selection
- Adjust time allocations

**Agent Instructions:** Use ultrathink. Make editing feel empowering, not tedious.

**Acceptance Criteria:**
- [ ] Reorder working
- [ ] Move between days working
- [ ] Remove with options
- [ ] Add from multiple sources
- [ ] Swap with alternatives
- [ ] Time adjustment

---

### WI-5.7: Create "Show Alternatives" Feature

**Effort:** Medium

**Description:** For any slot in the itinerary, show alternative activities the user could do instead.

**Technical Requirements:**
- Input: current slot (time, city, current activity)
- Fetch alternatives:
  - Same category as current
  - Different categories (for variety)
  - Time-appropriate
  - Preference-matching
- Display as swipeable cards or list
- One-tap to swap

**Agent Instructions:** Use ultrathink. Alternatives should feel genuinely different, not just similar options.

**Acceptance Criteria:**
- [ ] Alternatives fetched for any slot
- [ ] Mix of similar and different options
- [ ] Time-appropriate filtering
- [ ] Easy swap UI

---

### WI-5.8: Create Companion Integration for Itinerary

**Effort:** Medium

**Description:** The companion should be able to explain and modify the itinerary.

**Technical Requirements:**
- Companion can answer:
  - "Why did you put this here?"
  - "Make day 2 lighter"
  - "Add more food spots in Nice"
  - "What if it rains in Lyon?"
  - "Swap days 3 and 4"
- Companion can suggest changes proactively:
  - "Day 3 looks heavy. Want me to move something?"
  - "That museum is closed Mondays. I've moved it to Tuesday."
- Changes reflected in itinerary immediately

**Agent Instructions:** Use ultrathink. Companion should be helpful about the itinerary, not just describe it.

**Acceptance Criteria:**
- [ ] Companion can explain itinerary choices
- [ ] Companion can modify itinerary via conversation
- [ ] Changes apply immediately
- [ ] Proactive suggestions where appropriate

---

## 8. EPIC 6: TRIP BRAIN SERVICE

**Goal:** Build the intelligence layer that powers recommendations during active trips. This is the existing plan from the Claude Code document - keeping and enhancing it.

**Note:** This epic is largely defined in the existing document. Below are the work items with reference to that plan plus any enhancements needed.

---

### WI-6.1: Create TripBrain TypeScript Types

**Effort:** Small

**Description:** Define all TypeScript interfaces for the Trip Brain system as specified in the existing document.

**Reference:** Existing document WI-1.1

**Enhancements:**
- Include preference types from Epic 4
- Include cross-trip memory types from Epic 9

**Agent Instructions:** Use ultrathink. Follow the existing spec, add the new types.

**Acceptance Criteria:**
- [ ] All types from existing spec defined
- [ ] Preference integration types added
- [ ] Memory types added
- [ ] JSDoc comments

---

### WI-6.2: Create TripBrain Core Service

**Effort:** Medium

**Description:** The main service that orchestrates all intelligence during active trips as specified in the existing document.

**Reference:** Existing document WI-1.2

**Enhancements:**
- Integration with stored preferences
- Integration with cross-trip memory

**Agent Instructions:** Use ultrathink. Follow existing spec, integrate new systems.

**Acceptance Criteria:**
- [ ] Core service as specified
- [ ] Preferences integrated
- [ ] Memory integrated

---

### WI-6.3: Implement Time Filter

**Effort:** Small

**Description:** Filter activities based on current time appropriateness.

**Reference:** Existing document WI-1.3

**Agent Instructions:** Use ultrathink. Follow existing spec.

**Acceptance Criteria:**
- [ ] Time filtering working as specified

---

### WI-6.4: Implement Location Filter

**Effort:** Medium

**Description:** Filter and score activities by distance from user.

**Reference:** Existing document WI-1.4

**Agent Instructions:** Use ultrathink. Follow existing spec.

**Acceptance Criteria:**
- [ ] Location filtering and scoring working

---

### WI-6.5: Implement Preference Scorer

**Effort:** Medium

**Description:** Score activities based on learned user preferences.

**Reference:** Existing document WI-1.5

**Enhancements:**
- Use the full preference model from Epic 4
- Include historical preference data from memory

**Agent Instructions:** Use ultrathink. Enhance existing spec with richer preference model.

**Acceptance Criteria:**
- [ ] Preference scoring working
- [ ] Full preference model used
- [ ] Historical data included where available

---

### WI-6.6: Implement Combined Scoring Algorithm

**Effort:** Medium

**Description:** Combine all scores into final recommendation ranking.

**Reference:** Existing document WI-1.6

**Agent Instructions:** Use ultrathink. Follow existing spec.

**Acceptance Criteria:**
- [ ] Combined scoring working with breakdown

---

### WI-6.7: Implement "Why Now" Generator

**Effort:** Medium

**Description:** Generate human-readable reasons for each recommendation.

**Reference:** Existing document WI-1.7

**Agent Instructions:** Use ultrathink. Follow existing spec.

**Acceptance Criteria:**
- [ ] Why Now reasons generated
- [ ] Multiple reason types covered

---

### WI-6.8: Create Geolocation Hook

**Effort:** Small

**Description:** React hook for user location tracking.

**Reference:** Existing document WI-1.8

**Agent Instructions:** Use ultrathink. Follow existing spec.

**Acceptance Criteria:**
- [ ] Geolocation hook working

---

### WI-6.9: Create TripBrain Context Provider

**Effort:** Medium

**Description:** React context to provide TripBrain throughout the app.

**Reference:** Existing document WI-1.9

**Agent Instructions:** Use ultrathink. Follow existing spec.

**Acceptance Criteria:**
- [ ] Context provider working
- [ ] All actions exposed

---

## 9. EPIC 7: ACTIVE TRIP COMPANION

**Goal:** The companion becomes proactive and real-time during active trips. This is the existing plan enhanced with our new features.

---

### WI-7.1: Refactor Companion for Active Mode

**Effort:** Medium

**Description:** Update the companion to switch into active mode when trip is started.

**Reference:** Existing document WI-2.1 (partial)

**Technical Requirements:**
- Companion detects trip phase (planning vs. active)
- In active mode:
  - Uses TripBrain for recommendations
  - Becomes proactive (not just reactive)
  - Uses geolocation
  - Real-time context (weather, time)
- Different system prompt for active mode

**Agent Instructions:** Use ultrathink. Follow existing spec, ensure mode switching is clean.

**Acceptance Criteria:**
- [ ] Mode switching implemented
- [ ] Active mode behaviour correct
- [ ] System prompt switches appropriately

---

### WI-7.2: Create Active Companion System Prompt

**Effort:** Medium

**Description:** Craft the system prompt for active trip mode.

**Prompt Requirements:**
- Personality: same as planning (consistent)
- Behaviour changes:
  - Proactive: can initiate messages
  - Location-aware: "You're near X"
  - Time-aware: "Golden hour in 30 minutes"
  - Weather-aware: "Rain coming, let's adjust"
  - Knows full context: today's plan, preferences, history
- Output: conversational, helpful, not spammy

**Agent Instructions:** Use ultrathink. Balance proactivity with not being annoying.

**Acceptance Criteria:**
- [ ] Active mode prompt crafted
- [ ] Proactive behaviour defined
- [ ] Context awareness defined

---

### WI-7.3: Implement Choice Mode

**Effort:** Medium

**Description:** Default mode showing curated recommendations.

**Reference:** Existing document - Choice Mode

**Technical Requirements:**
- Shows top 3 recommendations based on TripBrain scoring
- Each with "Why Now" reason
- User can select, skip, or ask for more
- Refreshes based on location/time changes

**Agent Instructions:** Use ultrathink. Reference frontend-design skill.

**Acceptance Criteria:**
- [ ] Choice mode working
- [ ] Top 3 recommendations shown
- [ ] Why Now displayed
- [ ] Actions working

---

### WI-7.4: Implement Craving Mode

**Effort:** Medium

**Description:** "I want..." instant search interface.

**Reference:** Existing document WI-2.4, WI-2.5

**Technical Requirements:**
- Text input for craving search
- Quick chips for common cravings (coffee, food, wine, view, quiet)
- Searches within current city's places
- Filters by time-appropriateness
- Shows results with distance

**Agent Instructions:** Use ultrathink. Reference frontend-design skill.

**Acceptance Criteria:**
- [ ] Craving search working
- [ ] Quick chips functional
- [ ] Results filtered appropriately
- [ ] Distance shown

---

### WI-7.5: Implement Serendipity Mode

**Effort:** Medium

**Description:** "Surprise me" discovery interface.

**Reference:** Existing document WI-2.6, Epic 6 (WI-6.1 to 6.3)

**Technical Requirements:**
- One-tap to get a hidden gem surprise
- Full-screen reveal with dramatic presentation
- Shows "Why this is special" text
- Accept to add to route, or reject to get another
- Never repeats rejected surprises in session

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Make it feel magical.

**Acceptance Criteria:**
- [ ] Serendipity mode working
- [ ] Hidden gem selection algorithm
- [ ] Dramatic reveal UI
- [ ] Accept/reject flow

---

### WI-7.6: Implement Rest Mode

**Effort:** Small

**Description:** "I'm tired" quick access to rest spots.

**Reference:** Existing document WI-2.7

**Technical Requirements:**
- Filters for rest-appropriate places (cafes, parks, benches)
- Shows distance prominently
- Calming visual design
- Quick access from main UI

**Agent Instructions:** Use ultrathink. Reference frontend-design skill.

**Acceptance Criteria:**
- [ ] Rest mode working
- [ ] Appropriate places filtered
- [ ] Distance shown
- [ ] Calming UI

---

### WI-7.7: Implement Mode Switcher

**Effort:** Medium

**Description:** UI for switching between companion modes.

**Reference:** Existing document WI-2.8

**Technical Requirements:**
- Bottom navigation or gesture-based switching
- Modes: Choice (default), Craving, Serendipity, Rest, Full Itinerary
- Current mode indicator
- Smooth transitions between modes

**Agent Instructions:** Use ultrathink. Reference frontend-design skill.

**Acceptance Criteria:**
- [ ] Mode switcher working
- [ ] All modes accessible
- [ ] Smooth transitions
- [ ] Mobile-friendly

---

### WI-7.8: Implement Proactive Notifications

**Effort:** Medium

**Description:** Companion can push contextual suggestions.

**Technical Requirements:**
- Triggers:
  - Nearby hidden gem: "You're 3 min from that bakery I mentioned"
  - Weather change: "Rain in 30 min, want to head indoors?"
  - Time-sensitive: "Golden hour in 20 min, great for photos"
  - Schedule drift: "You're running early, there's a nice spot nearby"
- Rate limited: max 1 notification per 15 minutes
- Dismissible
- Learn from dismissals (reduce similar notifications)

**Agent Instructions:** Use ultrathink. Proactive but not spammy - this is crucial.

**Acceptance Criteria:**
- [ ] Proactive notifications working
- [ ] Multiple trigger types
- [ ] Rate limiting
- [ ] Dismissal tracking

---

### WI-7.9: Implement Arrival Detection

**Effort:** Medium

**Description:** Detect when user arrives at a planned location.

**Reference:** Existing document WI-3.2, WI-3.3

**Technical Requirements:**
- Use geolocation to detect proximity (within 50m)
- When arrival detected:
  - Mark activity as "arrived"
  - Optionally prompt for quick feedback
  - Update companion context
- Battery-efficient location monitoring

**Agent Instructions:** Use ultrathink. Follow existing spec.

**Acceptance Criteria:**
- [ ] Arrival detection working
- [ ] Feedback prompt shown
- [ ] Activity marked
- [ ] Battery efficient

---

### WI-7.10: Implement Weather Integration

**Effort:** Medium

**Description:** Factor weather into active trip recommendations.

**Reference:** Existing document WI-5.1

**Technical Requirements:**
- Fetch current weather and forecast for user location
- Weather affects recommendations:
  - Rain: boost indoor activities
  - Hot: suggest shaded spots, cool drinks
  - Perfect weather: boost outdoor activities
- Weather tips: "Perfect weather for the viewpoint"
- Weather alerts: "Rain coming at 2pm"

**Agent Instructions:** Use ultrathink. Follow existing spec.

**Acceptance Criteria:**
- [ ] Weather API integration
- [ ] Recommendations adjusted
- [ ] Weather tips generated
- [ ] Alerts working

---

## 10. EPIC 8: POST-TRIP ENGINE

**Goal:** After the trip ends, generate memories, stats, shareable content, and collect feedback. Keep users engaged and give them reasons to return.

---

### WI-8.1: Create Trip Completion Detection

**Effort:** Small

**Description:** Detect when a trip has ended and transition to post-trip phase.

**Technical Requirements:**
- Trigger conditions:
  - Trip end date passed
  - User manually ends trip
  - User hasn't opened app in 24h after end date (auto-transition)
- Transition to post-trip mode
- Notify user that trip is complete

**Agent Instructions:** Use ultrathink. Handle edge cases (user extends trip, etc.).

**Acceptance Criteria:**
- [ ] Auto-detection working
- [ ] Manual end working
- [ ] Transition smooth
- [ ] User notified

---

### WI-8.2: Create Trip Statistics Generator

**Effort:** Medium

**Description:** Calculate and display trip statistics.

**Technical Requirements:**
- Stats to calculate:
  - Total distance travelled
  - Cities visited
  - Days on the road
  - Places visited (from check-ins/arrivals)
  - Hidden gems discovered
  - Places added to Forever List
  - Top category (most visited type)
  - Walking distance (if tracked)
- Store stats with trip record
- Display in attractive format

**Agent Instructions:** Use ultrathink. Make stats feel like achievements, not just numbers.

**Acceptance Criteria:**
- [ ] All stats calculated
- [ ] Stats stored
- [ ] Attractive display

---

### WI-8.3: Create Trip Journal Generator

**Effort:** Large

**Description:** Generate a narrative summary of the trip.

**Technical Requirements:**
- Uses Claude to generate narrative from:
  - Itinerary (planned vs. actual)
  - Check-ins and arrivals
  - Places visited
  - User feedback/ratings given
  - Weather data
  - Photos (if integrated)
- Tone: warm, personal, memoir-like
- Highlights deviations: "Day 3: You scrapped the plan and spent all afternoon at that vineyard"
- Sections by day or by city
- Editable by user after generation

**Agent Instructions:** Use ultrathink. The journal should feel personal, not generic.

**Acceptance Criteria:**
- [ ] Journal generation working
- [ ] Incorporates actual trip data
- [ ] Highlights interesting moments
- [ ] Editable
- [ ] Stored with trip

---

### WI-8.4: Create Shareable Trip Card

**Effort:** Medium

**Description:** Generate a beautiful shareable image/card summarising the trip.

**Technical Requirements:**
- Single image output (for social media sharing)
- Contains:
  - Route map (stylised)
  - Key stats
  - 2-3 highlight photos (if available)
  - Trip dates
  - Waycraft branding (subtle)
- Multiple format options (square for Instagram, story format, etc.)
- Shareable via native share API
- Downloadable as image

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. This is organic marketing - make it beautiful and shareable.

**Acceptance Criteria:**
- [ ] Card generation working
- [ ] Multiple formats
- [ ] Share API integration
- [ ] Download option
- [ ] Looks great

---

### WI-8.5: Create Forever List Feature

**Effort:** Medium

**Description:** Allow users to mark places as "Forever" - places they'd return to.

**Technical Requirements:**
- "Forever" action available during trip (at arrival) and post-trip
- Forever List stored per user (not per trip)
- Displays: place, city, which trip, date added
- Forever List browsable in profile
- Places on Forever List inform future recommendations
- Forever List count shown in trip stats

**Agent Instructions:** Use ultrathink. This is a personal travel hall of fame - make it feel special.

**Acceptance Criteria:**
- [ ] Forever action working
- [ ] List stored per user
- [ ] Browsable in profile
- [ ] Informs future recommendations
- [ ] Shown in stats

---

### WI-8.6: Create Post-Trip Feedback Collection

**Effort:** Medium

**Description:** Collect feedback on places visited to improve recommendations.

**Technical Requirements:**
- For each place visited (arrival detected):
  - Quick reaction: thumbs up / thumbs down
  - Optional: one-line comment
  - Optional: photo
- Feedback collection can happen:
  - At arrival (quick reaction)
  - Post-trip (review what you visited)
- Feedback stored and used for:
  - Improving hidden gem scores
  - Training recommendation model
  - User preference refinement

**Agent Instructions:** Use ultrathink. Keep it quick - we don't want TripAdvisor-style reviews.

**Acceptance Criteria:**
- [ ] Quick feedback working
- [ ] At-arrival and post-trip collection
- [ ] Data stored
- [ ] Used for improvement

---

### WI-8.7: Create Photo Integration (Optional)

**Effort:** Large

**Description:** Integrate user photos with trip journal.

**Technical Requirements:**
- Request photo library access
- Match photos to trip dates
- Match photos to locations (using EXIF data)
- Display photos in journal at appropriate points
- Photos included in shareable card (user-selected)
- Privacy: photos never leave device unless explicitly shared

**Agent Instructions:** Use ultrathink. This is a nice-to-have but powerful feature. Handle privacy carefully.

**Acceptance Criteria:**
- [ ] Photo access working
- [ ] Date matching
- [ ] Location matching
- [ ] Journal integration
- [ ] Privacy respected

---

### WI-8.8: Create Post-Trip UI

**Effort:** Medium

**Description:** Build the UI for the post-trip experience.

**Technical Requirements:**
- Trip summary view:
  - Stats prominently displayed
  - Journal preview
  - Forever List additions
  - Feedback prompts
- Share card generator
- "Relive this trip" - browse day by day
- Navigation to profile/home

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Should feel like a celebration of the trip.

**Acceptance Criteria:**
- [ ] Summary view working
- [ ] Journal accessible
- [ ] Share card generator
- [ ] Day-by-day browsing
- [ ] Celebratory feel

---

## 11. EPIC 9: CROSS-TRIP MEMORY

**Goal:** The companion remembers everything across trips. Second trip with Waycraft feels like meeting an old friend, not starting over.

---

### WI-9.1: Create User Memory Data Model

**Effort:** Medium

**Description:** Define the data structure for long-term user memory.

**Memory Structure:**
```
{
  userId: string,
  
  // Travel style learned over time
  travelStyle: {
    preferredPace: 'relaxed' | 'balanced' | 'packed',
    preferredBudget: string,
    typicalTripLength: number,
    // ... computed from past trips
  },
  
  // Interests (aggregated)
  interests: {
    food: number,
    culture: number,
    // ... from all trips combined
  },
  
  // Specific memories
  specificMemories: [
    {
      type: 'place_loved',
      placeId: string,
      placeName: string,
      city: string,
      tripId: string,
      date: string,
    },
    {
      type: 'preference_stated',
      statement: string,  // "I love natural wine"
      tripId: string,
      date: string,
    },
    // etc.
  ],
  
  // Forever List (references)
  foreverList: string[],  // place IDs
  
  // Past trips summary
  pastTrips: [
    {
      tripId: string,
      destination: string,
      dates: { start, end },
      citiesVisited: string[],
      highlights: string[],
    }
  ],
  
  // Patterns
  patterns: {
    typicallyOverplans: boolean,
    prefersEarlyMornings: boolean,
    skipsMuseums: boolean,
    // ... learned behaviours
  }
}
```

**Agent Instructions:** Use ultrathink. Design for extensibility - we'll learn more patterns over time.

**Acceptance Criteria:**
- [ ] Memory data model defined
- [ ] Covers travel style, interests, specific memories
- [ ] Patterns included
- [ ] Extensible

---

### WI-9.2: Create Memory Storage Service

**Effort:** Medium

**Description:** Build the service that persists and retrieves user memory.

**Technical Requirements:**
- Storage: Supabase (must persist across devices)
- Operations:
  - getMemory(userId) → UserMemory
  - updateMemory(userId, updates) → void
  - addSpecificMemory(userId, memory) → void
  - aggregateFromTrip(userId, tripId) → void (process completed trip into memory)
- Encryption for sensitive data
- GDPR compliance: export, delete

**Agent Instructions:** Use ultrathink. Data privacy is important here.

**Acceptance Criteria:**
- [ ] Storage working
- [ ] All operations implemented
- [ ] Encryption in place
- [ ] GDPR operations available

---

### WI-9.3: Create Trip-to-Memory Processor

**Effort:** Medium

**Description:** After each trip, process the trip data into long-term memory.

**Technical Requirements:**
- Triggered after trip completion
- Extracts:
  - Places loved (Forever List, positive feedback)
  - Places disliked (negative feedback)
  - Preferences expressed in conversation
  - Behaviour patterns (overplanned? spontaneous changes?)
  - Travel stats (add to aggregate)
- Merges with existing memory (doesn't overwrite)
- Confidence weighting (more trips = more confident in patterns)

**Agent Instructions:** Use ultrathink. Be smart about what's worth remembering long-term.

**Acceptance Criteria:**
- [ ] Processing triggered post-trip
- [ ] Extracts relevant data
- [ ] Merges with existing
- [ ] Confidence tracking

---

### WI-9.4: Create Memory-Aware Companion Prompts

**Effort:** Medium

**Description:** Update companion system prompts to use memory.

**Technical Requirements:**
- Memory included in system prompt context
- Companion can reference:
  - Past trips: "Last September you loved Lyon..."
  - Preferences: "You mentioned you're into natural wine..."
  - Patterns: "You tend to overplan - want me to leave some gaps?"
  - Forever List: "One of your forever places is nearby..."
- Natural integration (not forced references)
- Conditional: only reference if relevant

**Agent Instructions:** Use ultrathink. References should feel natural, not creepy.

**Acceptance Criteria:**
- [ ] Memory in prompt context
- [ ] Natural references
- [ ] Conditional (not forced)
- [ ] Past trips referenceable
- [ ] Preferences referenceable

---

### WI-9.5: Create Returning User Detection

**Effort:** Small

**Description:** Detect when a user is starting their 2nd+ trip.

**Technical Requirements:**
- Check for existing memory on new trip creation
- If returning user:
  - Companion greets differently: "Welcome back!"
  - Pre-populate preferences from memory
  - Surface relevant memories during planning
- Track trip count for user

**Agent Instructions:** Use ultrathink. Make returning feel recognised.

**Acceptance Criteria:**
- [ ] Detection working
- [ ] Different greeting
- [ ] Preferences pre-populated
- [ ] Trip count tracked

---

### WI-9.6: Create "Unfinished Business" Feature

**Effort:** Medium

**Description:** Remember places user wanted to visit but didn't.

**Technical Requirements:**
- Track:
  - Places on itinerary not visited
  - Places favourited but not on itinerary
  - Cities user expressed interest in but didn't go
- Store as "unfinished business" in memory
- Surface in future planning: "You mentioned wanting to see the Dolomites..."
- Allow user to dismiss (not interested anymore)

**Agent Instructions:** Use ultrathink. Gentle reminders, not pressure.

**Acceptance Criteria:**
- [ ] Unfinished items tracked
- [ ] Surfaced in future planning
- [ ] Dismissible
- [ ] Not pushy

---

### WI-9.7: Create Memory Management UI

**Effort:** Medium

**Description:** Let users view and manage what the companion remembers.

**Technical Requirements:**
- View: what's in memory (summarised, not raw data)
  - Forever List
  - Learned preferences
  - Past trips summary
- Edit:
  - Remove specific memories
  - Correct preferences
  - Clear all memory
- Export: download all data (GDPR)
- Transparency: "Here's what I remember about you"

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Transparency builds trust.

**Acceptance Criteria:**
- [ ] Memory viewable
- [ ] Editable/removable
- [ ] Exportable
- [ ] Clear all option
- [ ] Trust-building design

---

## 12. EPIC 10: BOOKING & MONETISATION

**Goal:** Integrate booking capabilities for affiliate revenue and user convenience.

---

### WI-10.1: Create Booking Integration Architecture

**Effort:** Medium

**Description:** Design the integration architecture for booking partners.

**Technical Requirements:**
- Partner types:
  - Hotels: Booking.com affiliate
  - Activities: GetYourGuide, Viator
  - Restaurants: TheFork
- Integration approach:
  - Affiliate links (simpler, lower revenue)
  - API integration (complex, better UX, higher revenue)
- For MVP: affiliate links
- Track clicks for attribution

**Architecture Decision:**
- Abstract booking behind interface
- Implement affiliate links first
- Prepare for API integration later

**Agent Instructions:** Use ultrathink. Design for easy partner switching/addition.

**Acceptance Criteria:**
- [ ] Architecture designed
- [ ] Partner abstraction in place
- [ ] Affiliate link approach ready

---

### WI-10.2: Create Hotel Booking Integration

**Effort:** Medium

**Description:** Integrate hotel booking capability.

**Technical Requirements:**
- Affiliate partner: Booking.com (or alternative)
- Where shown:
  - City preview (accommodation options)
  - Itinerary view (book hotel for this city)
  - Companion suggestions
- Link format: affiliate link with tracking parameters
- Deep linking to specific city/dates if API allows
- Track clicks for revenue attribution

**Agent Instructions:** Use ultrathink. Make booking feel natural, not pushy.

**Acceptance Criteria:**
- [ ] Affiliate links working
- [ ] Shown in appropriate contexts
- [ ] Tracking working
- [ ] Deep linking if possible

---

### WI-10.3: Create Activity Booking Integration

**Effort:** Medium

**Description:** Integrate activity/tour booking.

**Technical Requirements:**
- Affiliate partner: GetYourGuide or Viator
- Where shown:
  - Place details (book this activity)
  - Itinerary slots (book activity for this slot)
  - Companion suggestions
- Match activities to places in itinerary
- Track clicks

**Agent Instructions:** Use ultrathink. Only show relevant activities, not random upsells.

**Acceptance Criteria:**
- [ ] Affiliate links working
- [ ] Activity matching to places
- [ ] Tracking working

---

### WI-10.4: Create Restaurant Booking Integration

**Effort:** Medium

**Description:** Integrate restaurant reservation capability.

**Technical Requirements:**
- Partner: TheFork, OpenTable, or Resy
- Where shown:
  - Restaurant place cards
  - Itinerary meal slots
  - Companion: "Want me to book a table?"
- Check availability if API allows
- Affiliate tracking

**Agent Instructions:** Use ultrathink. Restaurant booking is high value - make it smooth.

**Acceptance Criteria:**
- [ ] Booking links working
- [ ] Shown appropriately
- [ ] Tracking working

---

### WI-10.5: Create Companion Booking Prompts

**Effort:** Small

**Description:** Companion can suggest bookings naturally.

**Technical Requirements:**
- Contextual prompts:
  - "That restaurant is popular - want me to help you book?"
  - "Need a hotel in Lyon? I can find some options"
  - "There's a wine tour that visits those vineyards - interested?"
- Not pushy: only suggest when relevant
- Learn from dismissals (reduce if user always ignores)

**Agent Instructions:** Use ultrathink. Helpful, not salesy.

**Acceptance Criteria:**
- [ ] Booking prompts working
- [ ] Contextually relevant
- [ ] Not spammy
- [ ] Learn from dismissals

---

### WI-10.6: Create Premium Subscription Model

**Effort:** Medium

**Description:** Implement freemium subscription.

**Technical Requirements:**
- Free tier:
  - Basic trip planning
  - Limited AI interactions (e.g., 50/trip)
  - Standard recommendations
- Premium tier (price TBD):
  - Unlimited AI interactions
  - Offline mode
  - Full cross-trip memory
  - Advanced features (weather rerouting, etc.)
  - Priority support
- Payment: Stripe integration
- Manage subscription in app

**Agent Instructions:** Use ultrathink. Free tier must still be useful - don't cripple it.

**Acceptance Criteria:**
- [ ] Tier definitions clear
- [ ] Limits enforced
- [ ] Payment working
- [ ] Subscription management

---

### WI-10.7: Create Monetisation Analytics

**Effort:** Small

**Description:** Track monetisation metrics.

**Technical Requirements:**
- Track:
  - Affiliate link clicks by partner
  - Conversion (if trackable)
  - Revenue attribution
  - Premium subscription conversions
  - Churn
- Dashboard or export for analysis

**Agent Instructions:** Use ultrathink. Need to know what's working.

**Acceptance Criteria:**
- [ ] Click tracking working
- [ ] Subscription metrics tracked
- [ ] Analysable data

---

## 13. EPIC 11: UI POLISH & ANIMATIONS

**Goal:** Make the app feel premium and delightful.

---

### WI-11.1: Implement Consistent Design System

**Effort:** Medium

**Description:** Ensure consistent design language across all new components.

**Technical Requirements:**
- Colour palette adhered to
- Typography consistent
- Spacing system (8px grid or similar)
- Component library documentation
- Dark mode support (if applicable)

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Consistency is key.

**Acceptance Criteria:**
- [ ] Design system documented
- [ ] All components consistent
- [ ] Spacing systematic

---

### WI-11.2: Implement Page Transitions

**Effort:** Small

**Description:** Smooth transitions between major phases.

**Technical Requirements:**
- Entry → Discovery: smooth transition
- Discovery → Itinerary: smooth transition
- Itinerary → Active Trip: smooth transition
- Use Framer Motion (already installed)
- Shared element transitions where possible

**Agent Instructions:** Use ultrathink. Reference frontend-design skill.

**Acceptance Criteria:**
- [ ] All major transitions smooth
- [ ] No jarring jumps
- [ ] Performance maintained

---

### WI-11.3: Implement Card Animations

**Effort:** Small

**Description:** Animate card entrances, exits, and interactions.

**Reference:** Existing document WI-7.1

**Technical Requirements:**
- Staggered entrance animations
- Exit animations on removal
- Tap/click feedback
- Hover states (desktop)

**Agent Instructions:** Use ultrathink. Reference frontend-design skill.

**Acceptance Criteria:**
- [ ] Card animations working
- [ ] Staggered entrances
- [ ] Tap feedback

---

### WI-11.4: Implement Loading States

**Effort:** Small

**Description:** Polished loading states throughout.

**Reference:** Existing document WI-7.5

**Technical Requirements:**
- Skeleton loaders for content
- Animated placeholders
- Progress indicators for long operations
- Never show blank screens

**Agent Instructions:** Use ultrathink. Reference frontend-design skill.

**Acceptance Criteria:**
- [ ] Skeleton loaders everywhere needed
- [ ] Animated
- [ ] No blank screens

---

### WI-11.5: Implement Haptic Feedback

**Effort:** Small

**Description:** Subtle haptics on key interactions (mobile).

**Reference:** Existing document WI-7.4

**Technical Requirements:**
- Selection feedback
- Success feedback
- Error feedback
- Arrival celebration
- Silent fallback on unsupported devices

**Agent Instructions:** Use ultrathink. Subtle, not annoying.

**Acceptance Criteria:**
- [ ] Haptics working on supported devices
- [ ] Appropriate patterns
- [ ] Graceful fallback

---

### WI-11.6: Implement Error States

**Effort:** Small

**Description:** Friendly error handling throughout.

**Reference:** Existing document WI-8.2

**Technical Requirements:**
- Error boundaries for component failures
- Friendly error messages (not technical)
- Retry options where possible
- Offline state handling
- Never crash without graceful message

**Agent Instructions:** Use ultrathink. Errors should be helpful, not scary.

**Acceptance Criteria:**
- [ ] Error boundaries in place
- [ ] Friendly messages
- [ ] Retry options
- [ ] Offline handling

---

### WI-11.7: Implement Mobile Responsive Polish

**Effort:** Medium

**Description:** Ensure excellent mobile experience throughout.

**Technical Requirements:**
- All screens work on mobile (375px minimum)
- Touch targets adequate (44px minimum)
- No horizontal scroll
- Keyboard handling (input focus)
- Bottom sheet patterns for modals
- iOS and Android testing

**Agent Instructions:** Use ultrathink. Reference frontend-design skill. Mobile is primary use case.

**Acceptance Criteria:**
- [ ] All screens responsive
- [ ] Touch targets adequate
- [ ] No horizontal scroll
- [ ] Keyboard handled
- [ ] Tested on real devices

---

## 14. EPIC 12: INTEGRATION & INFRASTRUCTURE

**Goal:** Connect everything together, ensure reliability and performance.

---

### WI-12.1: Set Up Supabase Database

**Effort:** Medium

**Description:** Configure Supabase for data persistence.

**Technical Requirements:**
- Tables:
  - users
  - trips
  - itineraries
  - places_cache
  - user_memories
  - preferences
  - bookings
  - feedback
- Row-level security policies
- Indexes for performance
- Backups configured

**Agent Instructions:** Use ultrathink. Design schema for scalability.

**Acceptance Criteria:**
- [ ] All tables created
- [ ] RLS configured
- [ ] Indexes added
- [ ] Backups working

---

### WI-12.2: Create API Layer

**Effort:** Medium

**Description:** Build API endpoints for client-server communication.

**Technical Requirements:**
- Endpoints:
  - /trips - CRUD for trips
  - /itineraries - CRUD for itineraries
  - /places - Hidden gems queries
  - /companion - Chat endpoints
  - /memory - User memory operations
  - /bookings - Booking tracking
- Authentication: JWT or Supabase auth
- Rate limiting
- Error handling

**Agent Instructions:** Use ultrathink. RESTful design, proper error codes.

**Acceptance Criteria:**
- [ ] All endpoints working
- [ ] Authentication in place
- [ ] Rate limiting
- [ ] Error handling consistent

---

### WI-12.3: Implement Authentication Flow

**Effort:** Medium

**Description:** User authentication and account management.

**Technical Requirements:**
- Sign up (email + password, or social)
- Sign in
- Password reset
- Session management
- Account deletion (GDPR)
- Guest mode (limited features, prompt to sign up)

**Agent Instructions:** Use ultrathink. Security is critical. Use Supabase Auth or similar.

**Acceptance Criteria:**
- [ ] Sign up working
- [ ] Sign in working
- [ ] Password reset
- [ ] Sessions managed
- [ ] Deletion available
- [ ] Guest mode

---

### WI-12.4: Implement Offline Support

**Effort:** Large

**Description:** App works without network during active trips.

**Technical Requirements:**
- Cache itinerary locally before trip starts
- Cache place data for trip cities
- Companion works offline (limited, no AI generation)
- Geolocation works offline
- Sync when back online
- Clear indication of offline state

**Agent Instructions:** Use ultrathink. Offline is critical for road trips with poor signal.

**Acceptance Criteria:**
- [ ] Itinerary cached
- [ ] Place data cached
- [ ] Basic companion offline
- [ ] Geolocation works
- [ ] Sync working
- [ ] Clear offline indicator

---

### WI-12.5: Implement Analytics

**Effort:** Medium

**Description:** Track user behaviour and app performance.

**Reference:** Existing document WI-8.3

**Technical Requirements:**
- Events to track:
  - All phase transitions
  - Key actions (add city, generate itinerary, start trip, etc.)
  - Companion interactions
  - Booking clicks
  - Errors
- User properties: trip count, premium status, etc.
- Performance metrics: load times, API latencies
- Tool: Amplitude, Mixpanel, or similar

**Agent Instructions:** Use ultrathink. Data-driven decisions need data.

**Acceptance Criteria:**
- [ ] All key events tracked
- [ ] User properties set
- [ ] Performance tracked
- [ ] Dashboard accessible

---

### WI-12.6: Implement Performance Optimisation

**Effort:** Medium

**Description:** Ensure the app is fast and responsive.

**Reference:** Existing document WI-8.4

**Technical Requirements:**
- Code splitting for routes
- Image optimisation (lazy loading, proper sizing)
- API response caching
- React component memoisation where beneficial
- Bundle size monitoring
- Lighthouse score targets: 90+ performance

**Agent Instructions:** Use ultrathink. Performance affects user experience and SEO.

**Acceptance Criteria:**
- [ ] Code splitting implemented
- [ ] Images optimised
- [ ] Caching working
- [ ] Bundle size reasonable
- [ ] Lighthouse 90+

---

### WI-12.7: Implement Error Tracking

**Effort:** Small

**Description:** Track and alert on errors in production.

**Technical Requirements:**
- Client-side error tracking (Sentry or similar)
- Server-side error tracking
- Error grouping and alerting
- Source maps for stack traces
- User context attached to errors

**Agent Instructions:** Use ultrathink. Need to know when things break.

**Acceptance Criteria:**
- [ ] Client errors tracked
- [ ] Server errors tracked
- [ ] Alerts configured
- [ ] Source maps working

---

### WI-12.8: Create End-to-End Tests

**Effort:** Medium

**Description:** Critical path testing.

**Technical Requirements:**
- Test scenarios:
  - Complete flow: entry → discovery → itinerary → active trip
  - Companion conversation
  - Booking links
  - Authentication
- Tool: Playwright or Cypress
- CI integration

**Agent Instructions:** Use ultrathink. Focus on critical paths, not 100% coverage.

**Acceptance Criteria:**
- [ ] Critical paths tested
- [ ] Tests passing
- [ ] CI integrated

---

## 15. IMPLEMENTATION PHASES

### Phase 1: Foundation (Weeks 1-3)

**Goal:** New entry flow, discovery phase basics, hidden gems engine.

**Work Items:**
- Epic 0: All (Entry Flow Redesign)
- Epic 2: WI-2.1 to WI-2.4 (Hidden Gems Engine core)
- Epic 1: WI-1.1 to WI-1.3 (Discovery Phase basics)

**Deliverable:** Users can enter a trip quickly and see a map with suggested cities and hidden gems counts.

---

### Phase 2: Planning Intelligence (Weeks 4-6)

**Goal:** Full discovery phase, planning companion, preferences.

**Work Items:**
- Epic 1: WI-1.4 to WI-1.7 (Discovery Phase complete)
- Epic 3: All (Planning Companion)
- Epic 4: WI-4.1 to WI-4.4 (Preferences core)

**Deliverable:** Users can explore, chat with companion during planning, and their preferences are captured.

---

### Phase 3: Itinerary Generation (Weeks 7-8)

**Goal:** Generate and display editable itineraries.

**Work Items:**
- Epic 5: All (Itinerary Generation)
- Epic 4: WI-4.5 to WI-4.6 (Preferences integration)

**Deliverable:** Users can generate a full day-by-day itinerary and edit it.

---

### Phase 4: Active Trip (Weeks 9-11)

**Goal:** Full active trip experience with proactive companion.

**Work Items:**
- Epic 6: All (Trip Brain Service)
- Epic 7: All (Active Trip Companion)

**Deliverable:** Users can start trips and get real-time, location-aware guidance.

---

### Phase 5: Memory & Post-Trip (Weeks 12-14)

**Goal:** Post-trip experience and cross-trip memory.

**Work Items:**
- Epic 8: All (Post-Trip Engine)
- Epic 9: All (Cross-Trip Memory)

**Deliverable:** Trips generate memories, shareable content, and the companion remembers across trips.

---

### Phase 6: Monetisation & Polish (Weeks 15-17)

**Goal:** Booking integration, subscription, polish.

**Work Items:**
- Epic 10: All (Booking & Monetisation)
- Epic 11: All (UI Polish)
- Epic 12: All (Integration & Infrastructure)

**Deliverable:** Revenue streams active, app polished and performant.

---

## 16. SUCCESS METRICS

### Activation Metrics

| Metric | Target |
|--------|--------|
| Entry form completion rate | > 80% |
| Time to map view | < 25 seconds |
| Discovery → Itinerary conversion | > 60% |

### Engagement Metrics

| Metric | Target |
|--------|--------|
| Companion messages per planning session | > 5 |
| Cities explored in discovery | > 3 |
| Itinerary edits before starting trip | 2-5 (engaged but not frustrated) |
| Time in active trip companion | > 5 min/day |

### Retention Metrics

| Metric | Target |
|--------|--------|
| Trip completion rate | > 70% |
| Post-trip share rate | > 20% |
| Return for second trip | > 30% within 6 months |

### Monetisation Metrics

| Metric | Target |
|--------|--------|
| Booking link CTR | > 5% |
| Premium conversion | > 3% |
| Revenue per trip | > £2 average |

---

## APPENDIX: AGENT INSTRUCTIONS

For all work items:

1. **Use ultrathink** - Take time to think through the implementation thoroughly before coding.

2. **Reference frontend-design skill** - For any UI components, use the frontend-design skill to ensure high-quality, consistent design.

3. **Build on existing code** - Check what already exists before creating new. Reuse and refactor where possible.

4. **TypeScript throughout** - All new code should be TypeScript with proper types.

5. **Mobile-first** - Design for mobile screens first, then enhance for desktop.

6. **Test as you go** - Write tests for critical logic. Don't leave testing for the end.

7. **Document decisions** - If you make architectural decisions, document why.

8. **Ask for clarification** - If a work item is ambiguous, ask before assuming.

---

*This plan transforms Waycraft from a form-heavy planning tool into an intelligent travel companion that users will love and return to.*