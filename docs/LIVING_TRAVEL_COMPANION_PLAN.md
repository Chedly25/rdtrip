# Living Travel Companion - Implementation Plan

## Vision: Transform the Trip Panel from Checklist to Magic

**The Problem**: Current panel is a glorified checklist. Click "done". Repeat. Boring.

**The Solution**: An AI-powered serendipity engine that makes every moment of your trip feel alive, contextual, and full of discovery.

---

## Design Direction: "Wanderlust Field Notes"

### Aesthetic Choices (Frontend Design Skill)

**Typography**:
- Display: **Playfair Display** (editorial, refined, travel magazine feel)
- Body: **Source Serif 4** (readable, warm, humanist)
- UI Accents: **DM Sans** (clean, modern)

**Color System - Time-Aware Palette**:
```css
:root {
  /* Dawn (5-7am) - Awakening */
  --dawn-primary: #FFB4A2;
  --dawn-secondary: #FFCDB2;
  --dawn-bg: linear-gradient(180deg, #FFCDB2 0%, #FFE5D9 100%);

  /* Morning (7am-12pm) - Fresh */
  --morning-primary: #87CEEB;
  --morning-secondary: #B4E4FF;
  --morning-bg: linear-gradient(180deg, #E8F4F8 0%, #FFFBF5 100%);

  /* Afternoon (12-5pm) - Golden Hour */
  --afternoon-primary: #D4A853;
  --afternoon-secondary: #E4BE73;
  --afternoon-bg: linear-gradient(180deg, #FFF8E7 0%, #FFFBF5 100%);

  /* Evening (5-9pm) - Warm Amber */
  --evening-primary: #E07B39;
  --evening-secondary: #F4A261;
  --evening-bg: linear-gradient(180deg, #FFE8D6 0%, #FFF0E5 100%);

  /* Night (9pm-5am) - Indigo Dreams */
  --night-primary: #6D6875;
  --night-secondary: #9D8189;
  --night-bg: linear-gradient(180deg, #2C2417 0%, #3D3835 100%);

  /* Brand Constants */
  --terracotta: #C45830;
  --sage: #6B8E7B;
  --cream: #FFFBF5;
  --dark-brown: #2C2417;
}
```

**Key Design Elements**:
- Grain overlay texture (subtle, 3-5% opacity)
- Organic border-radius (8px default, 16px cards, 24px panels)
- Layered shadows with warm undertones
- Motion: spring physics, staggered reveals, scroll-triggered animations

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐            │
│  │ NOW Hero     │  │ Serendipity   │  │ Smart Time Hints   │            │
│  │ Card         │  │ Carousel      │  │ Component          │            │
│  └──────────────┘  └───────────────┘  └────────────────────┘            │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐            │
│  │ Trip Story   │  │ Moment        │  │ Weather-Aware      │            │
│  │ Snippet      │  │ Capture       │  │ Suggestions        │            │
│  └──────────────┘  └───────────────┘  └────────────────────┘            │
├─────────────────────────────────────────────────────────────────────────┤
│                          API Layer (/api/trip)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                   SERENDIPITY AGENT                             │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │     │
│  │  │ Tool:       │  │ Tool:       │  │ Tool:               │     │     │
│  │  │ Perplexity  │  │ Google      │  │ Weather Check       │     │     │
│  │  │ Discovery   │  │ Places      │  │                     │     │     │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘     │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │     │
│  │  │ Tool:       │  │ Tool:       │  │ Tool:               │     │     │
│  │  │ Time        │  │ Story       │  │ Nearby              │     │     │
│  │  │ Optimizer   │  │ Generator   │  │ Discovery           │     │     │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘     │     │
│  └────────────────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────────┤
│                         SERVICES                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │ PerplexityAI   │  │ GooglePlaces   │  │ WeatherMonitor │             │
│  │ Service        │  │ Service        │  │ Service        │             │
│  │ (existing)     │  │ (existing)     │  │ (existing)     │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
├─────────────────────────────────────────────────────────────────────────┤
│                         DATABASE                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │ trip_moments   │  │ serendipity_   │  │ trip_narrative │             │
│  │ (new)          │  │ cache (new)    │  │ (new)          │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Serendipity Agent with Tools

### 1.1 Create SerendipityAgent Service

**File**: `server/services/SerendipityAgent.js`

The Serendipity Agent is the brain that discovers unexpected delights near the traveler.

**Tools it has access to**:

```javascript
const tools = [
  {
    name: "discover_nearby_gems",
    description: "Find hidden gems, local favorites, and unexpected discoveries near current location",
    parameters: {
      location: { lat: number, lng: number },
      radius: number, // meters
      categories: string[], // ["cafe", "viewpoint", "street_art", "local_shop", etc.]
      exclude: string[], // place_ids to exclude (already visited)
      time_of_day: string, // "morning", "afternoon", "evening", "night"
      weather: string // "sunny", "cloudy", "rainy"
    }
  },
  {
    name: "get_local_intel",
    description: "Use Perplexity to discover local secrets, events happening today, temporary exhibitions",
    parameters: {
      city: string,
      date: string, // "2024-01-15"
      interests: string[], // user's interests
      query_type: string // "events_today", "local_secrets", "photo_spots", "food_gems"
    }
  },
  {
    name: "check_optimal_timing",
    description: "Determine best time to visit a place based on crowds, lighting, opening hours",
    parameters: {
      place_id: string,
      current_time: string,
      purpose: string // "photos", "dining", "exploration"
    }
  },
  {
    name: "find_weather_alternatives",
    description: "If weather changes, find indoor/covered alternatives nearby",
    parameters: {
      location: { lat: number, lng: number },
      weather_condition: string,
      original_activity_type: string,
      preferences: object
    }
  },
  {
    name: "generate_serendipity_card",
    description: "Create a compelling discovery card with storytelling",
    parameters: {
      place: object, // Google Places data
      local_intel: string, // Perplexity insights
      user_context: object // current trip context
    }
  }
];
```

### 1.2 Perplexity Integration for Real-Time Discovery

**Enhance existing PerplexityAIService** with new methods:

```javascript
// New methods to add to PerplexityAIService

async discoverLocalSecrets(city, date, interests) {
  const prompt = `You are a local expert in ${city}. Today is ${date}.

What are the HIDDEN GEMS and LOCAL SECRETS that a curious traveler should know about?

Focus on:
1. Events happening TODAY or this week (markets, festivals, performances)
2. Little-known spots locals love but tourists miss
3. Best times to visit popular places (avoid crowds)
4. Street food gems and hole-in-the-wall restaurants
5. Photo spots with the best light at different times
6. Free or cheap authentic experiences

User interests: ${interests.join(', ')}

Return as JSON array with format:
[{
  "type": "event|hidden_gem|timing_tip|food|photo_spot|experience",
  "title": "Short catchy title",
  "description": "2-3 engaging sentences",
  "why_special": "What makes this unique",
  "best_time": "When to go",
  "location_hint": "General area or address",
  "insider_tip": "The thing only locals know",
  "confidence": 0-1 // how confident you are this is accurate
}]`;

  return await this.client.query(prompt, 'llama-3.1-sonar-large-128k-online', {
    temperature: 0.8,
    maxTokens: 3000
  });
}

async generateMomentNarrative(activityName, city, userExperience, timeOfDay) {
  const prompt = `Write a brief, evocative travel journal entry (2-3 sentences) about experiencing "${activityName}" in ${city} during the ${timeOfDay}.

Capture:
- The sensory details (what they might see, smell, hear)
- The emotional resonance
- A small unexpected detail that makes it memorable

User's reflection: "${userExperience || 'No reflection provided'}"

Write in second person ("You...") to make it personal and immersive.
Keep it poetic but grounded in reality.`;

  return await this.client.query(prompt, 'llama-3.1-sonar-large-128k-online', {
    temperature: 0.9,
    maxTokens: 200
  });
}

async getTimingIntelligence(placeName, city, purpose) {
  const prompt = `For "${placeName}" in ${city}, when is the BEST time to visit for ${purpose}?

Consider:
- Crowd levels throughout the day
- Lighting conditions (for photos)
- Opening hours and busy periods
- Local patterns (lunch rush, tourist waves, etc.)
- Day of week variations

Return JSON:
{
  "best_time": "HH:MM",
  "best_time_range": "HH:MM - HH:MM",
  "avoid_times": ["HH:MM - HH:MM"],
  "reasoning": "Why this time is optimal",
  "insider_tip": "What locals know",
  "golden_hour_tip": "For photography if applicable"
}`;

  return await this.client.query(prompt, 'llama-3.1-sonar-large-128k-online', {
    temperature: 0.6,
    maxTokens: 500
  });
}
```

### 1.3 Google Places Enhanced Discovery

**Enhance GooglePlacesService** for serendipity:

```javascript
// New methods to add to GooglePlacesService

async discoverSerendipity(options) {
  const { location, radius = 500, exclude = [], categories } = options;

  // Search for multiple categories that spark discovery
  const discoveryTypes = categories || [
    'cafe',
    'bakery',
    'art_gallery',
    'book_store',
    'park',
    'point_of_interest',
    'museum'
  ];

  const allResults = [];

  for (const type of discoveryTypes) {
    const results = await this.nearbySearch({
      location,
      radius,
      type,
      exclude
    });

    // Filter for high-quality, interesting places
    const filtered = results
      .filter(p => p.rating >= 4.0 && p.user_ratings_total >= 50)
      .filter(p => !exclude.includes(p.place_id))
      .slice(0, 3);

    allResults.push(...filtered);
  }

  // Sort by a "serendipity score" - combination of rating, uniqueness, and proximity
  return this.scoreSerendipity(allResults, location);
}

scoreSerendipity(places, userLocation) {
  return places
    .map(place => {
      const distance = this.calculateDistance(userLocation, place.location);
      const ratingScore = (place.rating || 4) / 5;
      const popularityScore = Math.min(place.user_ratings_total / 1000, 1);

      // Serendipity favors quality over popularity (hidden gems)
      // But not too obscure (needs some validation)
      const serendipityScore =
        ratingScore * 0.4 +
        (1 - popularityScore) * 0.3 + // Less popular = more serendipitous
        (1 - distance / 1000) * 0.3; // Closer = more convenient

      return { ...place, serendipityScore, distance };
    })
    .sort((a, b) => b.serendipityScore - a.serendipityScore);
}
```

---

## Phase 2: Backend API Endpoints

### 2.1 New Trip API Routes

**File**: `server/routes/trip.js` (additions)

```javascript
/**
 * GET /api/trip/:tripId/serendipity
 * Get serendipity discoveries for current location
 */
router.get('/:tripId/serendipity', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { lat, lng, radius = 500 } = req.query;

    const discoveries = await serendipityAgent.discoverNearby({
      tripId,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseInt(radius),
      userId: req.userId
    });

    res.json({ discoveries });
  } catch (error) {
    console.error('Serendipity error:', error);
    res.status(500).json({ error: 'Failed to discover nearby gems' });
  }
});

/**
 * GET /api/trip/:tripId/smart-hints
 * Get contextual time hints for current activity
 */
router.get('/:tripId/smart-hints', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { activityId, currentTime } = req.query;

    const hints = await serendipityAgent.getSmartHints({
      tripId,
      activityId,
      currentTime,
      userId: req.userId
    });

    res.json({ hints });
  } catch (error) {
    console.error('Smart hints error:', error);
    res.status(500).json({ error: 'Failed to generate hints' });
  }
});

/**
 * POST /api/trip/:tripId/moment
 * Record a trip moment (enhanced check-in)
 */
router.post('/:tripId/moment', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      activityId,
      momentType, // 'highlight', 'memory', 'skip', 'discovery'
      note,
      photo,
      rating,
      coordinates
    } = req.body;

    const moment = await tripService.recordMoment(tripId, req.userId, {
      activityId,
      momentType,
      note,
      photo,
      rating,
      coordinates
    });

    // Generate narrative snippet asynchronously
    serendipityAgent.generateMomentNarrative(moment).catch(console.error);

    res.json({ success: true, moment });
  } catch (error) {
    console.error('Record moment error:', error);
    res.status(500).json({ error: 'Failed to record moment' });
  }
});

/**
 * GET /api/trip/:tripId/narrative
 * Get the evolving trip narrative
 */
router.get('/:tripId/narrative', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { dayNumber } = req.query;

    const narrative = await tripService.getTripNarrative(tripId, dayNumber);

    res.json({ narrative });
  } catch (error) {
    console.error('Get narrative error:', error);
    res.status(500).json({ error: 'Failed to fetch narrative' });
  }
});

/**
 * GET /api/trip/:tripId/weather-alternatives
 * Get weather-aware activity alternatives
 */
router.get('/:tripId/weather-alternatives', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { activityId, weatherCondition } = req.query;

    const alternatives = await serendipityAgent.findWeatherAlternatives({
      tripId,
      activityId,
      weatherCondition,
      userId: req.userId
    });

    res.json({ alternatives });
  } catch (error) {
    console.error('Weather alternatives error:', error);
    res.status(500).json({ error: 'Failed to find alternatives' });
  }
});
```

---

## Phase 3: Database Schema

### 3.1 New Tables

**File**: `db/migrations/022_living_companion.sql`

```sql
-- Trip Moments - Enhanced check-ins with emotional context
CREATE TABLE IF NOT EXISTS trip_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES active_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id TEXT,
  activity_name TEXT NOT NULL,

  -- Moment type and content
  moment_type VARCHAR(20) NOT NULL DEFAULT 'completed',
  -- 'highlight', 'memory', 'completed', 'skipped', 'discovery'

  note TEXT,
  photo_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- Location context
  coordinates JSONB, -- {lat, lng}
  city TEXT,

  -- AI-generated narrative
  narrative_snippet TEXT,

  -- Metadata
  day_number INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_of_day VARCHAR(20), -- 'dawn', 'morning', 'afternoon', 'evening', 'night'
  weather_conditions JSONB, -- snapshot of weather at moment

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trip Narrative - The evolving story of the trip
CREATE TABLE IF NOT EXISTS trip_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES active_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Day-by-day narrative
  day_number INTEGER NOT NULL,
  narrative_text TEXT NOT NULL,

  -- Story arc elements
  opening_hook TEXT, -- "Day 3 began with unexpected rain..."
  key_moments JSONB, -- array of moment highlights
  closing_reflection TEXT,

  -- Generation metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_moments INTEGER[], -- moment IDs used to generate

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(trip_id, day_number)
);

-- Serendipity Cache - Cache discovered gems to avoid re-discovery
CREATE TABLE IF NOT EXISTS serendipity_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Location key
  city TEXT NOT NULL,
  location_hash TEXT NOT NULL, -- geohash of coordinates

  -- Discovery data
  discovery_type VARCHAR(30) NOT NULL,
  -- 'hidden_gem', 'local_event', 'photo_spot', 'food_gem', 'timing_tip'

  place_id TEXT, -- Google Places ID if applicable
  title TEXT NOT NULL,
  description TEXT,
  why_special TEXT,
  insider_tip TEXT,

  -- Rich data
  photo_url TEXT,
  coordinates JSONB,
  opening_hours JSONB,

  -- Metadata
  source VARCHAR(20) NOT NULL, -- 'perplexity', 'google_places', 'user_submitted'
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  valid_from DATE,
  valid_until DATE, -- for time-limited events

  -- Performance
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',

  UNIQUE(city, location_hash, title)
);

-- Indexes for performance
CREATE INDEX idx_trip_moments_trip_id ON trip_moments(trip_id);
CREATE INDEX idx_trip_moments_day ON trip_moments(trip_id, day_number);
CREATE INDEX idx_trip_narratives_trip ON trip_narratives(trip_id);
CREATE INDEX idx_serendipity_cache_location ON serendipity_cache(city, location_hash);
CREATE INDEX idx_serendipity_cache_expiry ON serendipity_cache(expires_at);

-- Smart Hints Cache - Cache computed timing recommendations
CREATE TABLE IF NOT EXISTS smart_hints_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  place_id TEXT NOT NULL,
  place_name TEXT NOT NULL,
  city TEXT NOT NULL,

  -- Timing intelligence
  best_times JSONB, -- array of optimal time slots
  avoid_times JSONB, -- times to avoid
  golden_hour_info JSONB, -- photography timing
  crowd_patterns JSONB, -- hourly crowd estimates

  -- Tips
  insider_tips TEXT[],

  -- Freshness
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',

  UNIQUE(place_id)
);

CREATE INDEX idx_smart_hints_place ON smart_hints_cache(place_id);
```

---

## Phase 4: Frontend Components

### 4.1 Component Architecture

```
spotlight-react/src/components/trip/
├── LiveTripPanel.tsx (enhanced container)
├── enhanced/
│   ├── NowHeroCard.tsx           # Immersive current activity
│   ├── SerendipityCarousel.tsx   # Swipeable discovery cards
│   ├── SmartTimeHint.tsx         # Contextual time suggestions
│   ├── TripStorySnippet.tsx      # Narrative being built
│   ├── MomentCapture.tsx         # Enhanced check-in modal
│   ├── WeatherAwareCard.tsx      # Weather-responsive suggestions
│   └── TimeOfDayTheme.tsx        # Theme provider
├── hooks/
│   ├── useSerendipity.ts         # Discovery data fetching
│   ├── useSmartHints.ts          # Time intelligence
│   ├── useTripNarrative.ts       # Story fetching
│   └── useTimeOfDay.ts           # Theme management
└── services/
    └── tripCompanion.ts          # API client
```

### 4.2 NowHeroCard Component

**File**: `spotlight-react/src/components/trip/enhanced/NowHeroCard.tsx`

```tsx
/**
 * NowHeroCard - Immersive "Right Now" Experience
 *
 * Design: Full-bleed photo with gradient overlay
 * Shows current activity with rich context and one-tap actions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface NowHeroCardProps {
  activity: {
    name: string;
    photo: string;
    type: string;
    address: string;
    rating?: number;
    whyYoureHere?: string; // AI-generated context
    insiderTip?: string;
    coordinates: { lat: number; lng: number };
  };
  timeContext: {
    timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
    timeRemaining?: string; // "2h 30min left"
    optimalUntil?: string; // "Best until 4pm"
  };
  onNavigate: () => void;
  onCaptureMoment: () => void;
  onShowAlternatives: () => void;
}

// Component implementation with:
// - Parallax scroll effect on photo
// - Gradient overlays that shift with time of day
// - Animated "Now" badge with pulse effect
// - Swipe-up for quick actions
// - One-tap navigation integration
// - Insider tip reveal animation
```

### 4.3 SerendipityCarousel Component

**File**: `spotlight-react/src/components/trip/enhanced/SerendipityCarousel.tsx`

```tsx
/**
 * SerendipityCarousel - "While You're Here" Discoveries
 *
 * Design: Horizontal scroll with snap points
 * Cards have playful tilt on hover, photo backgrounds
 */

interface SerendipityCardData {
  id: string;
  type: 'hidden_gem' | 'local_event' | 'photo_spot' | 'food_gem' | 'timing_tip';
  title: string;
  description: string;
  whySpecial: string;
  insiderTip?: string;
  photo?: string;
  distance?: string; // "2 min walk"
  validUntil?: string; // for events
  confidence: number;
}

// Features:
// - Swipeable cards with momentum
// - "Surprise Me" shuffle button
// - Save to trip functionality
// - Time-sensitive badges for events
// - Distance indicators with walking time
// - Photo backgrounds with blur fallback
```

### 4.4 SmartTimeHint Component

**File**: `spotlight-react/src/components/trip/enhanced/SmartTimeHint.tsx`

```tsx
/**
 * SmartTimeHint - Contextual Time Intelligence
 *
 * Shows smart suggestions like:
 * - "Leave in 15 min to arrive perfectly"
 * - "Crowds thin out after 3pm"
 * - "Golden hour starts in 45 min - perfect for photos"
 */

interface SmartHint {
  type: 'departure' | 'crowd' | 'golden_hour' | 'weather' | 'closing';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  actionLabel?: string;
  action?: () => void;
  expiresIn?: number; // minutes until hint no longer relevant
}

// Features:
// - Animated entrance with attention-grabbing motion
// - Countdown timer for time-sensitive hints
// - Color-coded urgency levels
// - Dismissible but can reappear if relevant
// - Integrates with navigation
```

### 4.5 TripStorySnippet Component

**File**: `spotlight-react/src/components/trip/enhanced/TripStorySnippet.tsx`

```tsx
/**
 * TripStorySnippet - Your Trip Narrative Being Written
 *
 * Design: Typewriter effect, journal paper texture
 * Shows the evolving story of today's journey
 */

interface TripNarrative {
  dayNumber: number;
  openingHook: string;
  currentText: string;
  keyMoments: Array<{
    time: string;
    snippet: string;
    momentType: string;
  }>;
  wordCount: number;
}

// Features:
// - Typewriter animation for new text
// - Paper texture background
// - Hand-drawn underlines for emphasis
// - Expandable to show full day narrative
// - "Continue the story" prompt after check-ins
```

### 4.6 MomentCapture Modal

**File**: `spotlight-react/src/components/trip/enhanced/MomentCapture.tsx`

```tsx
/**
 * MomentCapture - Beyond the Checkbox
 *
 * Replace boring "Done" button with meaningful moment capture
 */

type MomentType = 'highlight' | 'memory' | 'discovery' | 'skipped';

interface MomentCaptureProps {
  activity: Activity;
  onCapture: (moment: CapturedMoment) => void;
  onSkip: (reason?: string) => void;
}

// Options presented:
// 1. "Highlight of the day" - Star rating, optional note
// 2. "Captured a memory" - Photo upload, brief reflection
// 3. "Quick note for later" - Voice or text note
// 4. "Skipped" - Why? (weather, closed, timing) -> triggers alternatives

// Features:
// - Emotion-based quick reactions (loved, liked, meh)
// - Photo upload with camera integration
// - Voice note option
// - Skip reasons that trigger smart alternatives
// - Celebration animation for highlights
```

---

## Phase 5: Frontend Hooks & Services

### 5.1 useSerendipity Hook

**File**: `spotlight-react/src/components/trip/hooks/useSerendipity.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { tripCompanionApi } from '../services/tripCompanion';

interface UseSerendipityOptions {
  tripId: string;
  enabled?: boolean;
  radius?: number;
  refreshInterval?: number; // ms
}

export function useSerendipity(options: UseSerendipityOptions) {
  const [discoveries, setDiscoveries] = useState<SerendipityCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

  // Watch user location
  useEffect(() => {
    if (!options.enabled) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => setLocation(position.coords),
      (error) => console.warn('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [options.enabled]);

  // Fetch discoveries when location changes significantly
  const fetchDiscoveries = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    try {
      const data = await tripCompanionApi.getSerendipity({
        tripId: options.tripId,
        lat: location.latitude,
        lng: location.longitude,
        radius: options.radius || 500
      });
      setDiscoveries(data.discoveries);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [location, options.tripId, options.radius]);

  // Refresh function for pull-to-refresh
  const refresh = useCallback(() => {
    return fetchDiscoveries();
  }, [fetchDiscoveries]);

  // Shuffle discoveries
  const shuffle = useCallback(() => {
    setDiscoveries(prev => [...prev].sort(() => Math.random() - 0.5));
  }, []);

  return {
    discoveries,
    loading,
    error,
    refresh,
    shuffle,
    location
  };
}
```

### 5.2 Trip Companion API Service

**File**: `spotlight-react/src/components/trip/services/tripCompanion.ts`

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const tripCompanionApi = {
  async getSerendipity(params: {
    tripId: string;
    lat: number;
    lng: number;
    radius?: number;
  }) {
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      radius: (params.radius || 500).toString()
    });

    const response = await fetch(
      `${API_BASE}/trip/${params.tripId}/serendipity?${searchParams}`,
      { credentials: 'include' }
    );

    if (!response.ok) throw new Error('Failed to fetch discoveries');
    return response.json();
  },

  async getSmartHints(params: {
    tripId: string;
    activityId: string;
    currentTime?: string;
  }) {
    const searchParams = new URLSearchParams({
      activityId: params.activityId,
      currentTime: params.currentTime || new Date().toISOString()
    });

    const response = await fetch(
      `${API_BASE}/trip/${params.tripId}/smart-hints?${searchParams}`,
      { credentials: 'include' }
    );

    if (!response.ok) throw new Error('Failed to fetch hints');
    return response.json();
  },

  async recordMoment(tripId: string, moment: {
    activityId: string;
    momentType: string;
    note?: string;
    photo?: string;
    rating?: number;
    coordinates?: { lat: number; lng: number };
  }) {
    const response = await fetch(`${API_BASE}/trip/${tripId}/moment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(moment)
    });

    if (!response.ok) throw new Error('Failed to record moment');
    return response.json();
  },

  async getNarrative(tripId: string, dayNumber?: number) {
    const params = dayNumber ? `?dayNumber=${dayNumber}` : '';
    const response = await fetch(
      `${API_BASE}/trip/${tripId}/narrative${params}`,
      { credentials: 'include' }
    );

    if (!response.ok) throw new Error('Failed to fetch narrative');
    return response.json();
  },

  async getWeatherAlternatives(tripId: string, activityId: string, weather: string) {
    const searchParams = new URLSearchParams({
      activityId,
      weatherCondition: weather
    });

    const response = await fetch(
      `${API_BASE}/trip/${tripId}/weather-alternatives?${searchParams}`,
      { credentials: 'include' }
    );

    if (!response.ok) throw new Error('Failed to fetch alternatives');
    return response.json();
  }
};
```

---

## Phase 6: Implementation Order

### Sprint 1: Foundation (Days 1-3)
1. Database migrations for new tables
2. SerendipityAgent service skeleton
3. Basic API endpoints (serendipity, smart-hints)
4. useSerendipity hook
5. TimeOfDay theme provider

### Sprint 2: Discovery Engine (Days 4-6)
6. Enhanced PerplexityAIService methods
7. Google Places serendipity scoring
8. Serendipity caching layer
9. SerendipityCarousel component
10. NowHeroCard component

### Sprint 3: Intelligence (Days 7-9)
11. Smart timing calculations
12. SmartTimeHint component
13. Weather integration for alternatives
14. WeatherAwareCard component

### Sprint 4: Story & Polish (Days 10-12)
15. MomentCapture modal
16. Trip narrative generation
17. TripStorySnippet component
18. Animation polish
19. Performance optimization
20. Testing & bug fixes

---

## Environment Variables Needed

```bash
# Existing (should already have)
ANTHROPIC_API_KEY=your_key
GOOGLE_PLACES_API_KEY=your_key
PERPLEXITY_API_KEY=your_key

# No new env vars needed - uses existing services
```

---

## Success Metrics

1. **Engagement**: Time spent on Live Trip Panel increases 3x
2. **Discovery**: 40%+ of users interact with serendipity cards
3. **Moments**: Average of 5+ moment captures per trip day
4. **Narrative**: 60%+ of users read their trip narrative
5. **Weather Adaptation**: 80%+ alternative suggestions accepted

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API costs from Perplexity | Aggressive caching (7 days), batch queries, confidence filtering |
| Location permission denied | Graceful degradation to city-level suggestions |
| Slow discovery loading | Skeleton loading states, prefetch on activity view |
| Narrative generation quality | Human-in-the-loop review option, tone presets |
| Battery drain from location | Coarse location updates, manual refresh option |

---

## Notes for Implementation

1. **Start with Phase 1** - The Serendipity Agent is the brain; everything depends on it
2. **Leverage existing services** - PerplexityAI and GooglePlaces services already work well
3. **Cache aggressively** - Discovery data doesn't change minute-to-minute
4. **Design mobile-first** - This is primarily a phone experience
5. **Test with real trips** - Synthetic data won't capture the magic

---

*This plan transforms the trip panel from a task manager into a living companion that makes travel feel magical again.*
