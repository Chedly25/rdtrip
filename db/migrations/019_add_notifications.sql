-- Migration: 019_add_notifications.sql
-- Phase 5: Notifications & Push System

-- =====================================================
-- USER DEVICES TABLE (for push notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Device identification
  device_id VARCHAR(255) NOT NULL,
  fcm_token TEXT,
  platform VARCHAR(20) CHECK (platform IN ('ios', 'android', 'web')),

  -- Activity tracking
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  -- One token per device per user
  UNIQUE(user_id, device_id)
);

-- =====================================================
-- NOTIFICATIONS TABLE (in-app notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification content
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'mention', 'task_assigned', 'task_due_soon', 'poll_created',
    'poll_closed', 'comment_on_activity', 'activity_changed',
    'chat_message', 'collaborator_added', 'route_shared'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Related entities (for deep linking)
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,

  -- Read status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Additional context
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Channel toggles
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,

  -- Event-specific toggles
  notify_mention BOOLEAN DEFAULT true,
  notify_task_assigned BOOLEAN DEFAULT true,
  notify_task_due_soon BOOLEAN DEFAULT true,
  notify_poll_created BOOLEAN DEFAULT true,
  notify_comment_on_activity BOOLEAN DEFAULT true,
  notify_activity_changed BOOLEAN DEFAULT false,
  notify_message BOOLEAN DEFAULT false,  -- Only when mentioned

  -- Quiet hours (do not disturb)
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50),

  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- user_devices indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(fcm_token) WHERE fcm_token IS NOT NULL;

-- notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_route ON notifications(route_id) WHERE route_id IS NOT NULL;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger for notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_timestamp();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Create default preferences for all existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE user_devices IS 'Stores device tokens for push notifications (multi-device support)';
COMMENT ON TABLE notifications IS 'In-app notification center for users';
COMMENT ON TABLE notification_preferences IS 'User notification settings and preferences';

COMMENT ON COLUMN user_devices.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
COMMENT ON COLUMN notifications.type IS 'Notification event type: mention, task_assigned, poll_created, etc.';
COMMENT ON COLUMN notifications.metadata IS 'JSONB field for storing additional context (task ID, poll ID, etc.)';
COMMENT ON COLUMN notification_preferences.quiet_hours_start IS 'Do not disturb start time';
