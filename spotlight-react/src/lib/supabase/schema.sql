-- =============================================================================
-- WAYCRAFT SUPABASE DATABASE SCHEMA
-- =============================================================================
-- Epic 12: Integration & Infrastructure
-- WI-12.1: Set Up Supabase Database
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jnkeqsavgpgsugepvuiw/sql
--
-- Tables:
-- 1. profiles - User profiles (linked to auth.users)
-- 2. trips - Trip data
-- 3. itineraries - Day-by-day plans
-- 4. preferences - User preferences (global and per-trip)
-- 5. memories - Post-trip memories
-- 6. bookings - Affiliate booking tracking
-- 7. feedback - User ratings and reviews
-- 8. places_cache - Cached place data for performance
-- =============================================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES TABLE
-- =============================================================================
-- Links to Supabase auth.users, stores additional user data

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,

  -- Subscription info (synced from subscription store)
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'expired', 'none')),
  trial_ends_at TIMESTAMPTZ,

  -- Usage tracking
  ai_interactions_count INTEGER DEFAULT 0,
  ai_interactions_reset_at TIMESTAMPTZ DEFAULT NOW(),
  trips_count INTEGER DEFAULT 0,

  -- OAuth data
  google_id TEXT UNIQUE,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier, subscription_status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. TRIPS TABLE
-- =============================================================================
-- Core trip data - each trip belongs to a user

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT,
  origin TEXT NOT NULL,
  origin_coordinates JSONB, -- { lat, lng }
  destination TEXT NOT NULL,
  destination_coordinates JSONB, -- { lat, lng }

  -- Dates
  start_date DATE,
  end_date DATE,

  -- Trip configuration
  traveller_type TEXT DEFAULT 'solo' CHECK (traveller_type IN ('solo', 'couple', 'family', 'friends', 'group')),
  traveller_count INTEGER DEFAULT 1,

  -- Selected cities (from discovery phase)
  selected_cities JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ id, name, country, coordinates, nights, order }]

  -- Favourited places
  favourited_places JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ placeId, name, type, cityId }]

  -- Route data (from backend generation)
  route_geometry JSONB,
  total_distance_km NUMERIC(10, 2),
  total_duration_minutes INTEGER,

  -- Trip status
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'active', 'completed', 'archived')),

  -- Active trip tracking
  current_day INTEGER DEFAULT 0,
  current_city_index INTEGER DEFAULT 0,
  trip_started_at TIMESTAMPTZ,
  trip_completed_at TIMESTAMPTZ,

  -- Heroku route ID (for backward compatibility)
  heroku_route_id TEXT,

  -- Sharing
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trips_share_token ON trips(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_heroku_id ON trips(heroku_route_id) WHERE heroku_route_id IS NOT NULL;

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. ITINERARIES TABLE
-- =============================================================================
-- Day-by-day plans for trips

CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

  -- Day info
  day_number INTEGER NOT NULL,
  date DATE,
  city_id TEXT NOT NULL,
  city_name TEXT NOT NULL,

  -- Activities by time slot
  morning_activities JSONB DEFAULT '[]'::JSONB,
  afternoon_activities JSONB DEFAULT '[]'::JSONB,
  evening_activities JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ id, type, place?, startTime, endTime, notes, status }]

  -- Day metadata
  theme TEXT,
  theme_icon TEXT,
  summary TEXT,
  is_travel_day BOOLEAN DEFAULT FALSE,

  -- User modifications
  user_notes TEXT,

  -- Completion tracking
  completed_activities JSONB DEFAULT '[]'::JSONB, -- Array of activity IDs

  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(trip_id, day_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_day ON itineraries(trip_id, day_number);
CREATE INDEX IF NOT EXISTS idx_itineraries_date ON itineraries(date);

CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON itineraries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. PREFERENCES TABLE
-- =============================================================================
-- User preferences - can be global (trip_id NULL) or per-trip

CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE, -- NULL for global preferences

  -- Interest categories (0-1 scores)
  interests JSONB DEFAULT '{
    "food": 0.5,
    "culture": 0.5,
    "nature": 0.5,
    "nightlife": 0.3,
    "shopping": 0.3,
    "adventure": 0.5,
    "relaxation": 0.5,
    "photography": 0.3,
    "beach": 0.3,
    "localExperiences": 0.5
  }'::JSONB,

  -- Specific interests with confidence
  specific_interests JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ tag, confidence, source, category }]

  -- Avoidances
  avoidances JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ tag, strength, source, reason }]

  -- Travel style
  pace TEXT DEFAULT 'balanced' CHECK (pace IN ('relaxed', 'balanced', 'packed')),
  budget TEXT DEFAULT 'moderate' CHECK (budget IN ('budget', 'moderate', 'comfort', 'luxury')),

  -- Dining
  dining_style TEXT DEFAULT 'mixed' CHECK (dining_style IN ('street_food', 'casual', 'mixed', 'fine_dining')),
  dietary_requirements JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ tag, isStrict }]

  -- Accommodation
  accommodation_style TEXT DEFAULT 'comfortable' CHECK (accommodation_style IN ('budget', 'comfortable', 'luxury', 'unique')),

  -- Time preferences
  time_preference TEXT DEFAULT 'flexible' CHECK (time_preference IN ('early_bird', 'flexible', 'late_riser')),
  crowd_preference TEXT DEFAULT 'dont_mind' CHECK (crowd_preference IN ('avoid_crowds', 'dont_mind', 'like_busy')),

  -- Hidden gems preference
  prefers_hidden_gems BOOLEAN DEFAULT TRUE,
  hidden_gems_confidence NUMERIC(3, 2) DEFAULT 0.5,

  -- Accessibility
  accessibility_needs JSONB DEFAULT '[]'::JSONB,

  -- Learning metadata
  overall_confidence NUMERIC(3, 2) DEFAULT 0.3,
  sources JSONB DEFAULT '{"hasStated": false, "hasObserved": false, "hasHistorical": false}'::JSONB,

  -- Versioning
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one global preference per user
  UNIQUE(user_id, trip_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_trip_id ON preferences(trip_id);
CREATE INDEX IF NOT EXISTS idx_preferences_user_global ON preferences(user_id) WHERE trip_id IS NULL;

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. MEMORIES TABLE
-- =============================================================================
-- Post-trip memories and content

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Summary content
  trip_summary TEXT,
  ai_generated_summary TEXT,

  -- Highlights
  highlights JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ type, title, description, photoUrl?, placeId?, dayNumber? }]

  -- Photos
  photos JSONB DEFAULT '[]'::JSONB,
  -- Structure: [{ url, caption, placeId?, dayNumber?, takenAt }]
  cover_photo_url TEXT,

  -- Stats
  stats JSONB DEFAULT '{}'::JSONB,
  -- Structure: { totalDistanceKm, daysCount, citiesCount, placesVisited, photosCount }

  -- Sharing
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memories_trip_id ON memories(trip_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_public ON memories(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_memories_share_token ON memories(share_token) WHERE share_token IS NOT NULL;

CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. BOOKINGS TABLE
-- =============================================================================
-- Affiliate booking tracking

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,

  -- Place info
  place_id TEXT NOT NULL, -- Google Places ID or internal ID
  place_name TEXT NOT NULL,
  place_type TEXT, -- hotel, restaurant, activity, etc.
  city_name TEXT,

  -- Booking platform
  platform TEXT NOT NULL CHECK (platform IN ('booking_com', 'getyourguide', 'thefork', 'viator', 'airbnb', 'other')),
  affiliate_url TEXT NOT NULL,

  -- Tracking
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  conversion_value NUMERIC(10, 2),
  conversion_currency TEXT DEFAULT 'EUR',

  -- Metadata
  booking_date DATE,
  booking_reference TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_platform ON bookings(platform);
CREATE INDEX IF NOT EXISTS idx_bookings_clicked_at ON bookings(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_converted ON bookings(converted_at) WHERE converted_at IS NOT NULL;

-- =============================================================================
-- 7. FEEDBACK TABLE
-- =============================================================================
-- User ratings and reviews

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,

  -- Feedback type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('trip_rating', 'app_rating', 'feature_request', 'bug_report', 'general')),

  -- Rating (1-5 for ratings, NULL for other types)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- Content
  title TEXT,
  message TEXT NOT NULL,

  -- Categorization
  category TEXT, -- e.g., 'companion', 'itinerary', 'map', 'booking'
  tags JSONB DEFAULT '[]'::JSONB,

  -- Status (for bug reports/feature requests)
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'closed')),

  -- Admin response
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID,

  -- Metadata
  app_version TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_trip_id ON feedback(trip_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. PLACES_CACHE TABLE
-- =============================================================================
-- Cached place data for performance (TTL: 24 hours)

CREATE TABLE IF NOT EXISTS places_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Cache key
  location_hash TEXT NOT NULL, -- Hash of coordinates + radius + category
  city_name TEXT,

  -- Cached data
  places_data JSONB NOT NULL,
  -- Structure: [{ placeId, name, type, rating, coordinates, ... }]

  -- Category filter used
  category TEXT, -- 'all', 'restaurant', 'activity', 'hidden_gem', etc.
  radius_km NUMERIC(5, 2),

  -- TTL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Hit tracking
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,

  UNIQUE(location_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_places_cache_hash ON places_cache(location_hash);
CREATE INDEX IF NOT EXISTS idx_places_cache_city ON places_cache(city_name);
CREATE INDEX IF NOT EXISTS idx_places_cache_expires ON places_cache(expires_at);

-- =============================================================================
-- 9. CHECK-INS TABLE (for active trips)
-- =============================================================================

CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Location
  place_id TEXT,
  place_name TEXT,
  city_name TEXT,
  coordinates JSONB, -- { lat, lng }

  -- Content
  photo_url TEXT,
  note TEXT,

  -- Context
  day_number INTEGER,
  activity_id TEXT,

  -- Metadata
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkins_trip_id ON checkins(trip_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_trip_day ON checkins(trip_id, day_number);
CREATE INDEX IF NOT EXISTS idx_checkins_timestamp ON checkins(checked_in_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE places_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES POLICIES
-- =============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- New users can insert their profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- TRIPS POLICIES
-- =============================================================================

-- Users can view their own trips
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public trips
CREATE POLICY "Anyone can view public trips"
  ON trips FOR SELECT
  USING (is_public = TRUE AND deleted_at IS NULL);

-- Users can insert their own trips
CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own trips
CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete (soft) their own trips
CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- ITINERARIES POLICIES
-- =============================================================================

-- Users can view itineraries for their trips
CREATE POLICY "Users can view own itineraries"
  ON itineraries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itineraries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can view itineraries for public trips
CREATE POLICY "Anyone can view public trip itineraries"
  ON itineraries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itineraries.trip_id
      AND trips.is_public = TRUE
      AND trips.deleted_at IS NULL
    )
  );

-- Users can insert itineraries for their trips
CREATE POLICY "Users can insert own itineraries"
  ON itineraries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itineraries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can update itineraries for their trips
CREATE POLICY "Users can update own itineraries"
  ON itineraries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itineraries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can delete itineraries for their trips
CREATE POLICY "Users can delete own itineraries"
  ON itineraries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itineraries.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- =============================================================================
-- PREFERENCES POLICIES
-- =============================================================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON preferences FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- MEMORIES POLICIES
-- =============================================================================

-- Users can view their own memories
CREATE POLICY "Users can view own memories"
  ON memories FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can view public memories
CREATE POLICY "Anyone can view public memories"
  ON memories FOR SELECT
  USING (is_public = TRUE);

-- Users can insert their own memories
CREATE POLICY "Users can insert own memories"
  ON memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own memories
CREATE POLICY "Users can update own memories"
  ON memories FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own memories
CREATE POLICY "Users can delete own memories"
  ON memories FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- BOOKINGS POLICIES
-- =============================================================================

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own bookings
CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- FEEDBACK POLICIES
-- =============================================================================

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- PLACES_CACHE POLICIES
-- =============================================================================

-- Anyone can read cache (public data)
CREATE POLICY "Anyone can read places cache"
  ON places_cache FOR SELECT
  USING (TRUE);

-- Only authenticated users can insert cache
CREATE POLICY "Authenticated users can insert cache"
  ON places_cache FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update cache
CREATE POLICY "Authenticated users can update cache"
  ON places_cache FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- CHECKINS POLICIES
-- =============================================================================

-- Users can view their own check-ins
CREATE POLICY "Users can view own checkins"
  ON checkins FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own check-ins
CREATE POLICY "Users can insert own checkins"
  ON checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own check-ins
CREATE POLICY "Users can update own checkins"
  ON checkins FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own check-ins
CREATE POLICY "Users can delete own checkins"
  ON checkins FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM places_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to increment trips count on profile
CREATE OR REPLACE FUNCTION increment_trip_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET trips_count = trips_count + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_trip_created
  AFTER INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION increment_trip_count();

-- =============================================================================
-- USEFUL VIEWS
-- =============================================================================

-- View: User's trips with itinerary count
CREATE OR REPLACE VIEW trips_with_stats AS
SELECT
  t.*,
  COUNT(i.id) AS itinerary_days_count,
  p.display_name AS user_display_name,
  p.avatar_url AS user_avatar_url
FROM trips t
LEFT JOIN itineraries i ON i.trip_id = t.id
LEFT JOIN profiles p ON p.id = t.user_id
WHERE t.deleted_at IS NULL
GROUP BY t.id, p.display_name, p.avatar_url;

-- =============================================================================
-- SEED DATA (Optional - for development)
-- =============================================================================

-- No seed data - tables are empty and ready for use

-- =============================================================================
-- NOTES
-- =============================================================================
--
-- To run this schema:
-- 1. Go to https://supabase.com/dashboard/project/jnkeqsavgpgsugepvuiw/sql
-- 2. Create a new query
-- 3. Paste this entire file
-- 4. Click "Run"
--
-- To verify:
-- - Check Tables section for all 9 tables
-- - Check Policies section for RLS policies
-- - Try inserting a test user via Auth to verify the profile trigger
--
-- Backup schedule is configured in Supabase dashboard automatically.
-- =============================================================================
