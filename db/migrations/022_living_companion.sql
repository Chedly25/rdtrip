-- Living Travel Companion - Database Schema
-- Phase 4: Trip Moments, Narratives & Serendipity Discovery

-- Trip Moments - Enhanced check-ins with emotional context
CREATE TABLE IF NOT EXISTS trip_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES active_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id TEXT,
  activity_name TEXT NOT NULL,

  -- Moment type and content
  moment_type VARCHAR(20) NOT NULL DEFAULT 'completed',
  -- Types: 'highlight', 'memory', 'completed', 'skipped', 'discovery'

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
  source_moments UUID[], -- moment IDs used to generate

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
  -- Types: 'hidden_gem', 'local_event', 'photo_spot', 'food_gem', 'timing_tip'

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_moments_trip_id ON trip_moments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_moments_day ON trip_moments(trip_id, day_number);
CREATE INDEX IF NOT EXISTS idx_trip_moments_user ON trip_moments(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_narratives_trip ON trip_narratives(trip_id);
CREATE INDEX IF NOT EXISTS idx_serendipity_cache_location ON serendipity_cache(city, location_hash);
CREATE INDEX IF NOT EXISTS idx_serendipity_cache_expiry ON serendipity_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_smart_hints_place ON smart_hints_cache(place_id);

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_trip_moments_updated_at ON trip_moments;
CREATE TRIGGER update_trip_moments_updated_at
    BEFORE UPDATE ON trip_moments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_narratives_updated_at ON trip_narratives;
CREATE TRIGGER update_trip_narratives_updated_at
    BEFORE UPDATE ON trip_narratives
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Done!
SELECT 'Living Companion tables created successfully!' as status;
