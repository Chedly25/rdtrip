-- Migration: 013_add_polls.sql
-- Phase 3: Decision Making System - Polling & Voting

CREATE TABLE IF NOT EXISTS trip_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,

  -- Poll metadata
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  description TEXT,

  -- Poll configuration
  poll_type VARCHAR(50) NOT NULL CHECK (poll_type IN ('activity', 'restaurant', 'accommodation', 'time', 'general')),
  target_type VARCHAR(50), -- e.g., 'activity', 'restaurant', 'day'
  target_id VARCHAR(255), -- Reference to the specific item being voted on
  day_number INTEGER,

  -- Voting options (stored as JSONB array)
  -- Example: [{"id": "opt1", "label": "Visit Louvre", "metadata": {...}}, ...]
  options JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Voting rules
  multiple_choice BOOLEAN DEFAULT false, -- Allow voting for multiple options
  max_choices INTEGER DEFAULT 1,
  min_votes_required INTEGER DEFAULT 1, -- Minimum votes needed to close poll

  -- Auto-execution settings
  auto_execute BOOLEAN DEFAULT false, -- Automatically apply winning option
  consensus_threshold INTEGER DEFAULT 50, -- Percentage needed for consensus (0-100)

  -- Timing
  deadline TIMESTAMP,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'executed')),
  closed_at TIMESTAMP,
  closed_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Results
  winning_option VARCHAR(255), -- ID of winning option
  results JSONB, -- Detailed results with vote counts

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES trip_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Vote data (array of option IDs)
  -- Example for single choice: ["opt1"]
  -- Example for multiple choice: ["opt1", "opt3"]
  selected_options JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Optional comment on vote
  comment TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ensure one vote per user per poll
  UNIQUE(poll_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_polls_route ON trip_polls(route_id);
CREATE INDEX IF NOT EXISTS idx_trip_polls_status ON trip_polls(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_trip_polls_deadline ON trip_polls(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trip_polls_type ON trip_polls(poll_type);
CREATE INDEX IF NOT EXISTS idx_trip_polls_target ON trip_polls(route_id, target_type, target_id) WHERE target_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trip_polls_day ON trip_polls(route_id, day_number) WHERE day_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_user ON poll_votes(poll_id, user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_poll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER trip_polls_updated_at
  BEFORE UPDATE ON trip_polls
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_updated_at();

CREATE TRIGGER poll_votes_updated_at
  BEFORE UPDATE ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_updated_at();
