-- Migration 013: Add Proactive AI Notification System
-- STEP 4 Phase 1: Core with Weather Monitoring
-- Date: 2025-01-14

-- ============================================================================
-- PROACTIVE NOTIFICATIONS TABLE
-- Stores all types of notifications (weather, events, budget, traffic)
-- ============================================================================
CREATE TABLE IF NOT EXISTS proactive_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'weather', 'event', 'budget', 'traffic'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Optional link to take action (e.g., maps URL, booking link)
  action_label TEXT, -- Label for action button (e.g., "View Forecast", "Get Directions")
  metadata JSONB, -- Additional data specific to notification type
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP -- Optional expiration for time-sensitive alerts
);

-- Index for fast lookups by itinerary and unread status
CREATE INDEX IF NOT EXISTS idx_notifications_itinerary_unread
ON proactive_notifications(itinerary_id, is_read, created_at DESC)
WHERE is_dismissed = FALSE;

-- Index for filtering by type and priority
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority
ON proactive_notifications(type, priority, created_at DESC);

-- ============================================================================
-- WEATHER HISTORY TABLE
-- Tracks weather forecasts for each day to detect changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS weather_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  weather_data JSONB NOT NULL, -- Full OpenWeatherMap forecast data
  temperature_max NUMERIC(5,2), -- Extracted for easy querying (Celsius)
  temperature_min NUMERIC(5,2),
  precipitation_probability NUMERIC(5,2), -- 0-100%
  weather_condition VARCHAR(100), -- 'Clear', 'Rain', 'Snow', etc.
  wind_speed NUMERIC(5,2), -- m/s
  forecast_fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups by itinerary and date
CREATE INDEX IF NOT EXISTS idx_weather_itinerary_date
ON weather_history(itinerary_id, date DESC);

-- Unique constraint to prevent duplicate forecasts for same day/location
CREATE UNIQUE INDEX IF NOT EXISTS idx_weather_unique_day_location
ON weather_history(itinerary_id, day_number, date);

-- ============================================================================
-- DISCOVERED EVENTS TABLE (for Phase 2)
-- Stores local events discovered near trip locations
-- ============================================================================
CREATE TABLE IF NOT EXISTS discovered_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  event_name TEXT NOT NULL,
  event_type VARCHAR(100), -- 'concert', 'festival', 'sports', 'exhibition', etc.
  venue TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  description TEXT,
  ticket_url TEXT,
  price_range TEXT,
  source VARCHAR(50), -- 'ticketmaster', 'predicthq', 'eventbrite', etc.
  external_id TEXT, -- ID from source API
  event_data JSONB, -- Full API response
  notified BOOLEAN DEFAULT FALSE, -- Has user been notified?
  user_interested BOOLEAN, -- User marked as interested
  discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups by itinerary and date
CREATE INDEX IF NOT EXISTS idx_events_itinerary_date
ON discovered_events(itinerary_id, date);

-- Index for unnotified events
CREATE INDEX IF NOT EXISTS idx_events_unnotified
ON discovered_events(itinerary_id, notified)
WHERE notified = FALSE;

-- ============================================================================
-- BUDGET TRANSACTIONS TABLE (for Phase 2)
-- Tracks spending during trip for budget monitoring
-- ============================================================================
CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number INTEGER,
  category VARCHAR(50) NOT NULL, -- 'accommodation', 'food', 'activities', 'transport', 'other'
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT,
  location TEXT,
  receipt_url TEXT, -- S3 URL for uploaded receipts
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB -- Additional data (e.g., OCR results, split info)
);

-- Index for fast sum queries by itinerary
CREATE INDEX IF NOT EXISTS idx_transactions_itinerary
ON budget_transactions(itinerary_id, transaction_date DESC);

-- Index for category-based reporting
CREATE INDEX IF NOT EXISTS idx_transactions_category
ON budget_transactions(itinerary_id, category);

-- ============================================================================
-- PROACTIVE MONITORING LOG TABLE
-- Tracks when monitoring jobs run (for debugging/audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS proactive_monitoring_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_type VARCHAR(50) NOT NULL, -- 'weather', 'events', 'budget', 'traffic'
  itineraries_checked INTEGER,
  notifications_created INTEGER,
  errors_encountered INTEGER,
  execution_time_ms INTEGER,
  error_details JSONB,
  run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for monitoring health checks
CREATE INDEX IF NOT EXISTS idx_monitoring_log_type_date
ON proactive_monitoring_log(monitor_type, run_at DESC);

-- ============================================================================
-- GRANT PERMISSIONS (if using separate app user)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON proactive_notifications TO rdtrip_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON weather_history TO rdtrip_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON discovered_events TO rdtrip_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON budget_transactions TO rdtrip_app;
-- GRANT SELECT, INSERT ON proactive_monitoring_log TO rdtrip_app;
