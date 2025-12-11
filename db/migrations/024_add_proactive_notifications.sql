-- Migration: Add Proactive Notifications Table
-- Description: Creates table for tracking proactive agent notifications
-- Phase 5: Proactive Agent Behavior

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Proactive notifications table
CREATE TABLE IF NOT EXISTS proactive_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES user_goals(id) ON DELETE SET NULL,

  -- Notification type and priority
  trigger_type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Content
  title VARCHAR(100) NOT NULL,
  body TEXT NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]',

  -- Additional context
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'read', 'dismissed', 'actioned')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ
);

-- Indexes for efficient queries
CREATE INDEX idx_proactive_notifications_user ON proactive_notifications(user_id);
CREATE INDEX idx_proactive_notifications_status ON proactive_notifications(status);
CREATE INDEX idx_proactive_notifications_user_status ON proactive_notifications(user_id, status);
CREATE INDEX idx_proactive_notifications_trigger_type ON proactive_notifications(trigger_type);
CREATE INDEX idx_proactive_notifications_created ON proactive_notifications(created_at DESC);
CREATE INDEX idx_proactive_notifications_itinerary ON proactive_notifications(itinerary_id) WHERE itinerary_id IS NOT NULL;
CREATE INDEX idx_proactive_notifications_priority ON proactive_notifications(priority);

-- Update trigger for updated_at column
CREATE TRIGGER update_proactive_notifications_updated_at BEFORE UPDATE ON proactive_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get unread notifications for a user
CREATE OR REPLACE FUNCTION get_unread_notifications(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  trigger_type VARCHAR(50),
  priority VARCHAR(20),
  title VARCHAR(100),
  body TEXT,
  actions JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pn.id,
    pn.trigger_type,
    pn.priority,
    pn.title,
    pn.body,
    pn.actions,
    pn.metadata,
    pn.created_at
  FROM proactive_notifications pn
  WHERE pn.user_id = p_user_id
    AND pn.status IN ('pending', 'sent')
    AND pn.created_at > NOW() - INTERVAL '7 days'
  ORDER BY
    CASE pn.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    pn.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE proactive_notifications
  SET status = 'read', read_at = NOW()
  WHERE id = p_notification_id AND status IN ('pending', 'sent');
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as actioned
CREATE OR REPLACE FUNCTION mark_notification_actioned(p_notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE proactive_notifications
  SET status = 'actioned', actioned_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old notifications (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM proactive_notifications
    WHERE created_at < NOW() - INTERVAL '30 days'
      OR (status = 'dismissed' AND created_at < NOW() - INTERVAL '7 days')
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- User notification preferences table (for opting in/out)
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Per-trigger-type preferences (true = enabled)
  upcoming_trip_enabled BOOLEAN NOT NULL DEFAULT true,
  weather_alert_enabled BOOLEAN NOT NULL DEFAULT true,
  incomplete_goal_enabled BOOLEAN NOT NULL DEFAULT true,
  morning_briefing_enabled BOOLEAN NOT NULL DEFAULT true,
  activity_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  local_event_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Delivery preferences
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Quiet hours (UTC)
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update trigger for preferences
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE proactive_notifications IS 'Stores proactive agent notifications for users (Phase 5)';
COMMENT ON COLUMN proactive_notifications.trigger_type IS 'Type of trigger: upcoming_trip, weather_alert, incomplete_goal, morning_briefing, etc.';
COMMENT ON COLUMN proactive_notifications.actions IS 'JSONB array of suggested actions: [{label, action, data}]';
COMMENT ON COLUMN proactive_notifications.metadata IS 'Additional context data for the notification';

COMMENT ON TABLE user_notification_preferences IS 'User preferences for proactive notifications';
