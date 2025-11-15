-- Migration: 012_add_activity_comments.sql
-- Phase 2: Activity-Level Collaboration - Comment System

CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,

  -- What's being commented on
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('activity', 'day', 'restaurant', 'route')),
  target_id VARCHAR(255) NOT NULL, -- activity name, day number, etc.
  day_number INTEGER, -- For activities/restaurants on specific days

  -- Comment data
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_comment_id UUID REFERENCES activity_comments(id) ON DELETE CASCADE, -- Threading

  -- Status
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_comments_route ON activity_comments(route_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_target ON activity_comments(route_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_parent ON activity_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_comments_resolved ON activity_comments(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_activity_comments_user ON activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_day ON activity_comments(route_id, day_number) WHERE day_number IS NOT NULL;

-- Comments
COMMENT ON TABLE activity_comments IS 'Comments on activities, days, restaurants, and routes';
COMMENT ON COLUMN activity_comments.target_type IS 'Type of element being commented on: activity, day, restaurant, or route';
COMMENT ON COLUMN activity_comments.target_id IS 'Identifier for the target (activity name, day number as string, etc.)';
COMMENT ON COLUMN activity_comments.parent_comment_id IS 'Parent comment ID for threaded conversations';
COMMENT ON COLUMN activity_comments.resolved IS 'Whether this comment thread has been resolved';
