-- ================================================
-- MIGRATION 015: Navigation Redesign - My Trips System
-- ================================================
-- Phase 1: Foundation (Backend Only - No Breaking Changes)
-- Creates persistent trip storage, proposals comparison,
-- auto-save history, and user preferences
-- ================================================

BEGIN;

-- ============================================
-- TABLE 1: user_trips (Central trips storage)
-- ============================================
CREATE TABLE IF NOT EXISTS user_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Trip metadata
  title VARCHAR(255), -- "Paris to Rome Adventure"
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'completed', 'archived'

  -- Origin & Destination (from form)
  origin JSONB NOT NULL, -- { name, country, coordinates }
  destination JSONB NOT NULL, -- { name, country, coordinates }

  -- Trip parameters
  nights INTEGER NOT NULL,
  budget VARCHAR(50), -- 'budget', 'mid-range', 'luxury'

  -- Selected route data (from chosen agent)
  selected_agent_type VARCHAR(50), -- 'adventure', 'culinary', 'cultural', 'budget'
  route_data JSONB, -- Full route with cities, landmarks, itinerary

  -- Tracking
  generation_job_id VARCHAR(100), -- Link to original generation job
  last_modified_section VARCHAR(50), -- 'map', 'itinerary', 'budget', etc.

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'completed', 'archived'))
);

-- Indexes for user_trips
CREATE INDEX IF NOT EXISTS idx_user_trips_user_id ON user_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trips_status ON user_trips(status);
CREATE INDEX IF NOT EXISTS idx_user_trips_updated_at ON user_trips(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_trips_generation_job_id ON user_trips(generation_job_id);

-- ============================================
-- TABLE 2: route_proposals (All 4 agent proposals)
-- ============================================
CREATE TABLE IF NOT EXISTS route_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES user_trips(id) ON DELETE CASCADE,

  -- Proposal details
  agent_type VARCHAR(50) NOT NULL, -- 'adventure', 'culinary', 'cultural', 'budget'
  route_data JSONB NOT NULL, -- Full route from this agent

  -- Selection tracking
  is_selected BOOLEAN DEFAULT false, -- TRUE if user chose this one

  -- Metadata
  generation_duration_ms INTEGER, -- How long it took to generate
  cost_estimate DECIMAL(10,2), -- Estimated trip cost

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_agent_per_trip UNIQUE(trip_id, agent_type)
);

-- Indexes for route_proposals
CREATE INDEX IF NOT EXISTS idx_route_proposals_trip_id ON route_proposals(trip_id);
CREATE INDEX IF NOT EXISTS idx_route_proposals_selected ON route_proposals(is_selected);

-- ============================================
-- TABLE 3: trip_versions (Auto-save history)
-- ============================================
CREATE TABLE IF NOT EXISTS trip_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES user_trips(id) ON DELETE CASCADE,

  -- Version info
  version_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  change_description TEXT, -- "Added Eiffel Tower landmark"
  changed_section VARCHAR(50), -- 'cities', 'landmarks', 'itinerary', etc.

  -- Snapshot data
  route_snapshot JSONB NOT NULL, -- Full route at this version

  -- Metadata
  created_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_version_per_trip UNIQUE(trip_id, version_number)
);

-- Indexes for trip_versions
CREATE INDEX IF NOT EXISTS idx_trip_versions_trip_id ON trip_versions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_versions_created_at ON trip_versions(created_at DESC);

-- ============================================
-- TABLE 4: user_preferences (UI state)
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- UI preferences
  default_view VARCHAR(50) DEFAULT 'my_trips', -- 'my_trips', 'explore'
  last_visited_trip_id UUID REFERENCES user_trips(id),
  favorite_agent_types TEXT[], -- ['adventure', 'culinary']

  -- Settings
  auto_save_enabled BOOLEAN DEFAULT true,
  show_tutorial BOOLEAN DEFAULT true,

  -- Timestamps
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- DATA MIGRATION: route_jobs -> user_trips
-- ============================================
-- Migrate existing completed route_jobs to user_trips table
-- This ensures backward compatibility with existing data

INSERT INTO user_trips (
  user_id,
  title,
  status,
  origin,
  destination,
  nights,
  selected_agent_type,
  route_data,
  generation_job_id,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid as user_id, -- Default guest user for now
  CONCAT(
    COALESCE((origin->>'name')::text, 'Unknown'),
    ' to ',
    COALESCE((destination->>'name')::text, 'Unknown')
  ) as title,
  CASE
    WHEN status = 'completed' THEN 'active'
    WHEN status = 'failed' THEN 'archived'
    ELSE 'draft'
  END as status,
  origin,
  destination,
  nights,
  agent_type as selected_agent_type,
  result as route_data,
  job_id as generation_job_id,
  created_at,
  updated_at
FROM route_jobs
WHERE status = 'completed'
  AND result IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_trips ut WHERE ut.generation_job_id = route_jobs.job_id
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- Created 4 new tables:
--   1. user_trips - Central trip storage
--   2. route_proposals - All agent proposals for comparison
--   3. trip_versions - Auto-save history/version control
--   4. user_preferences - User UI settings
--
-- Migrated existing route_jobs data to user_trips
-- No breaking changes - old flow continues to work
-- ================================================
