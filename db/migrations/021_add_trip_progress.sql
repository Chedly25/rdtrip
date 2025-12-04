-- Migration: 021_add_trip_progress.sql
-- Phase 2: Trip in Progress Mode
-- Enables real-time trip tracking, check-ins, and location updates

-- =====================================================
-- ACTIVE TRIPS TABLE
-- Tracks trips that are currently in progress
-- =====================================================
CREATE TABLE IF NOT EXISTS active_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Trip state
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active', 'paused', 'completed', 'cancelled'
  )),
  current_day INTEGER DEFAULT 1,
  current_city_index INTEGER DEFAULT 0,

  -- Location tracking
  last_location JSONB, -- { lat, lng, accuracy, timestamp, city, address }
  last_location_update TIMESTAMP,

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  paused_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Stats (calculated/cached)
  stats JSONB DEFAULT '{
    "distance_traveled": 0,
    "photos_captured": 0,
    "checkins_complete": 0,
    "total_checkins": 0
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure one active trip per route per user
  CONSTRAINT unique_active_trip UNIQUE (route_id, user_id)
);

-- =====================================================
-- TRIP CHECKINS TABLE
-- Stores check-in memories during the trip
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES active_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Activity reference
  activity_id VARCHAR(100), -- Reference to itinerary activity
  activity_name TEXT NOT NULL,
  activity_type VARCHAR(50),
  day_number INTEGER,

  -- Location
  location_name TEXT,
  coordinates JSONB, -- { lat, lng }

  -- Check-in content
  photo_urls TEXT[], -- Array of photo URLs
  note TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  mood VARCHAR(20),
  weather VARCHAR(20),

  -- Status
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN (
    'completed', 'skipped'
  )),

  -- Timestamps
  checked_in_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TRIP LOCATION UPDATES TABLE
-- Stores GPS location history for the trip
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES active_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Location data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2), -- Meters
  altitude DECIMAL(10, 2),
  speed DECIMAL(10, 2), -- m/s
  heading DECIMAL(5, 2), -- Degrees

  -- Reverse geocoded info
  city TEXT,
  country TEXT,
  address TEXT,

  -- Timestamp
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Active trips
CREATE INDEX IF NOT EXISTS idx_active_trips_user ON active_trips(user_id, status);
CREATE INDEX IF NOT EXISTS idx_active_trips_route ON active_trips(route_id);
CREATE INDEX IF NOT EXISTS idx_active_trips_status ON active_trips(status);
CREATE INDEX IF NOT EXISTS idx_active_trips_active ON active_trips(user_id)
  WHERE status = 'active';

-- Trip checkins
CREATE INDEX IF NOT EXISTS idx_trip_checkins_trip ON trip_checkins(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_checkins_user ON trip_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_checkins_day ON trip_checkins(trip_id, day_number);
CREATE INDEX IF NOT EXISTS idx_trip_checkins_activity ON trip_checkins(trip_id, activity_id);
CREATE INDEX IF NOT EXISTS idx_trip_checkins_time ON trip_checkins(checked_in_at DESC);

-- Location updates
CREATE INDEX IF NOT EXISTS idx_trip_locations_trip ON trip_location_updates(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_locations_time ON trip_location_updates(trip_id, recorded_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger for active_trips
CREATE OR REPLACE FUNCTION update_active_trips_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER active_trips_updated_at
  BEFORE UPDATE ON active_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_active_trips_timestamp();

-- Auto-update stats when checkin is added
CREATE OR REPLACE FUNCTION update_trip_checkin_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE active_trips
  SET stats = jsonb_set(
    stats,
    '{checkins_complete}',
    to_jsonb(COALESCE((stats->>'checkins_complete')::int, 0) + 1)
  )
  WHERE id = NEW.trip_id;

  -- Also update photo count if photos were added
  IF NEW.photo_urls IS NOT NULL AND array_length(NEW.photo_urls, 1) > 0 THEN
    UPDATE active_trips
    SET stats = jsonb_set(
      stats,
      '{photos_captured}',
      to_jsonb(COALESCE((stats->>'photos_captured')::int, 0) + array_length(NEW.photo_urls, 1))
    )
    WHERE id = NEW.trip_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_checkins_stats_update
  AFTER INSERT ON trip_checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_checkin_stats();

-- Auto-set completed_at when trip status changes to completed
CREATE OR REPLACE FUNCTION handle_trip_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;

  IF NEW.status = 'paused' AND OLD.status = 'active' THEN
    NEW.paused_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER active_trips_status_change
  BEFORE UPDATE ON active_trips
  FOR EACH ROW
  EXECUTE FUNCTION handle_trip_completion();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE active_trips IS 'Tracks trips that are currently in progress with real-time state';
COMMENT ON COLUMN active_trips.status IS 'Trip status: active (in progress), paused, completed, cancelled';
COMMENT ON COLUMN active_trips.current_day IS 'Current day number of the trip (1-indexed)';
COMMENT ON COLUMN active_trips.current_city_index IS 'Index of current city in the route cities array';
COMMENT ON COLUMN active_trips.last_location IS 'Most recent GPS location with metadata';
COMMENT ON COLUMN active_trips.stats IS 'Cached statistics: distance_traveled, photos_captured, checkins_complete, total_checkins';

COMMENT ON TABLE trip_checkins IS 'Check-in memories captured during an active trip';
COMMENT ON COLUMN trip_checkins.activity_id IS 'Reference to the itinerary activity being checked into';
COMMENT ON COLUMN trip_checkins.photo_urls IS 'Array of cloud storage URLs for check-in photos';
COMMENT ON COLUMN trip_checkins.mood IS 'User mood at check-in: amazing, happy, peaceful, adventurous, tired, hungry';
COMMENT ON COLUMN trip_checkins.weather IS 'Weather condition: sunny, cloudy, partly-cloudy, rainy';

COMMENT ON TABLE trip_location_updates IS 'GPS location history for trip tracking and distance calculation';
COMMENT ON COLUMN trip_location_updates.accuracy IS 'GPS accuracy in meters';
