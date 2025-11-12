-- =====================================================
-- PHASE 2: COLLABORATIVE TRIP PLANNING
-- Migration: Add collaboration tables
-- Created: November 12, 2024
-- =====================================================

-- =====================================================
-- COLLABORATORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS route_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Permissions
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  -- owner: full control, can delete route, manage collaborators
  -- editor: can modify route, add/remove stops, chat
  -- viewer: read-only, can chat

  -- Invitation metadata
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

  -- Activity tracking
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  last_edited_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(route_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_route_id ON route_collaborators(route_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON route_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_status ON route_collaborators(status);

COMMENT ON TABLE route_collaborators IS 'Stores collaborators for each route with role-based permissions';
COMMENT ON COLUMN route_collaborators.role IS 'Permission level: owner (full control), editor (can modify), viewer (read-only)';
COMMENT ON COLUMN route_collaborators.status IS 'Invitation status: pending, accepted, declined';

-- =====================================================
-- TRIP CHAT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trip_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Message content
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'suggestion', 'vote')),

  -- For suggestions and votes
  metadata JSONB,

  -- Threading (optional for v1)
  reply_to UUID REFERENCES trip_messages(id),

  -- Reactions (emoji reactions)
  reactions JSONB DEFAULT '[]'::jsonb,

  -- Status
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trip_messages_route_id ON trip_messages(route_id);
CREATE INDEX IF NOT EXISTS idx_trip_messages_user_id ON trip_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_messages_created_at ON trip_messages(created_at DESC);

COMMENT ON TABLE trip_messages IS 'Chat messages within a trip context';
COMMENT ON COLUMN trip_messages.message_type IS 'text (normal message), system (automated), suggestion (route change), vote (decision)';
COMMENT ON COLUMN trip_messages.reactions IS 'Array of emoji reactions: [{emoji: "👍", userId: "uuid"}]';

-- =====================================================
-- ACTIVITY LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS route_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Activity details
  action VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_route_activity_route_id ON route_activity(route_id);
CREATE INDEX IF NOT EXISTS idx_route_activity_created_at ON route_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_activity_action ON route_activity(action);

COMMENT ON TABLE route_activity IS 'Audit log of all changes to a route';
COMMENT ON COLUMN route_activity.action IS 'Examples: route_created, stop_added, stop_removed, collaborator_added, itinerary_generated';
COMMENT ON COLUMN route_activity.metadata IS 'Additional data about the action (e.g., stop details, old/new values)';

-- =====================================================
-- PRESENCE TRACKING (In-memory + Redis in production)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,

  -- Presence data
  status VARCHAR(20) DEFAULT 'viewing' CHECK (status IN ('viewing', 'editing', 'idle')),
  current_section VARCHAR(50),

  -- Timestamps
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, route_id)
);

CREATE INDEX IF NOT EXISTS idx_user_presence_route_id ON user_presence(route_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence(last_seen_at);

COMMENT ON TABLE user_presence IS 'Tracks who is currently viewing/editing each route';
COMMENT ON COLUMN user_presence.status IS 'viewing (online), editing (actively changing), idle (inactive 5+ min)';
COMMENT ON COLUMN user_presence.current_section IS 'Which part of the route: route, itinerary, chat, budget';

-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================
CREATE TRIGGER update_collaborators_updated_at
  BEFORE UPDATE ON route_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_messages_updated_at
  BEFORE UPDATE ON trip_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: Create owner records for existing routes
-- =====================================================
-- For all existing routes, create an owner collaborator record
INSERT INTO route_collaborators (route_id, user_id, role, status, accepted_at)
SELECT
  id as route_id,
  user_id,
  'owner' as role,
  'accepted' as status,
  created_at as accepted_at
FROM routes
ON CONFLICT (route_id, user_id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Count tables created
-- SELECT COUNT(*) FROM information_schema.tables
-- WHERE table_name IN ('route_collaborators', 'trip_messages', 'route_activity', 'user_presence');

-- View collaborator roles
-- SELECT * FROM route_collaborators LIMIT 10;

-- =====================================================
-- ROLLBACK SCRIPT (for reference)
-- =====================================================
-- DROP TABLE IF EXISTS user_presence CASCADE;
-- DROP TABLE IF EXISTS route_activity CASCADE;
-- DROP TABLE IF EXISTS trip_messages CASCADE;
-- DROP TABLE IF EXISTS route_collaborators CASCADE;
