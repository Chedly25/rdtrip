-- Migration: Add User Goals Table
-- Description: Creates table for tracking multi-step user goals across sessions
-- Phase 4: Goal Tracking & Progress

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User goals table for tracking multi-step objectives
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'paused')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  subtasks JSONB NOT NULL DEFAULT '[]',
  success_criteria TEXT,
  complexity VARCHAR(10) NOT NULL DEFAULT 'simple' CHECK (complexity IN ('simple', 'medium', 'complex')),
  context JSONB NOT NULL DEFAULT '{}',
  abandoned_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for efficient queries
CREATE INDEX idx_user_goals_user ON user_goals(user_id);
CREATE INDEX idx_user_goals_status ON user_goals(status);
CREATE INDEX idx_user_goals_user_status ON user_goals(user_id, status);
CREATE INDEX idx_user_goals_created ON user_goals(created_at DESC);

-- Update trigger for updated_at column
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get active goals for a user (useful for quick lookups)
CREATE OR REPLACE FUNCTION get_active_goals(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  description TEXT,
  progress INTEGER,
  subtasks JSONB,
  complexity VARCHAR(10),
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.description, g.progress, g.subtasks, g.complexity, g.created_at
  FROM user_goals g
  WHERE g.user_id = p_user_id AND g.status = 'in_progress'
  ORDER BY g.created_at DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to update goal progress and status
CREATE OR REPLACE FUNCTION update_goal_progress(p_goal_id UUID)
RETURNS void AS $$
DECLARE
  v_subtasks JSONB;
  v_total INTEGER;
  v_done INTEGER;
  v_progress INTEGER;
  v_status VARCHAR(20);
BEGIN
  -- Get subtasks
  SELECT subtasks INTO v_subtasks FROM user_goals WHERE id = p_goal_id;

  -- Count total and done
  SELECT
    jsonb_array_length(v_subtasks),
    (SELECT COUNT(*) FROM jsonb_array_elements(v_subtasks) elem WHERE elem->>'status' IN ('done', 'skipped'))
  INTO v_total, v_done;

  -- Calculate progress
  IF v_total > 0 THEN
    v_progress := ROUND((v_done::DECIMAL / v_total) * 100);
  ELSE
    v_progress := 0;
  END IF;

  -- Determine status
  IF v_done = v_total AND v_total > 0 THEN
    v_status := 'completed';
  ELSE
    v_status := 'in_progress';
  END IF;

  -- Update goal
  UPDATE user_goals
  SET progress = v_progress,
      status = v_status,
      completed_at = CASE WHEN v_status = 'completed' THEN NOW() ELSE NULL END
  WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE user_goals IS 'Tracks multi-step user goals with subtask progress (Phase 4)';
COMMENT ON COLUMN user_goals.subtasks IS 'JSONB array of subtasks: [{id, description, status, dependencies, tools_needed, success_indicator, result, completedAt}]';
COMMENT ON COLUMN user_goals.context IS 'Context when goal was created: {routeId, pageContext, createdFrom}';
