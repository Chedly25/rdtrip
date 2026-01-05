-- Discovery Conversations - Database Schema
-- Voyager Agent: Persistent conversation history and preference tracking

-- Discovery Sessions - Track session state
CREATE TABLE IF NOT EXISTS discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Route context
  route_id UUID,
  origin TEXT,
  destination TEXT,

  -- Session state
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  -- Status: 'active', 'completed', 'abandoned'

  -- Inferred preferences (updated as we learn)
  preferences JSONB DEFAULT '{}',
  -- Structure: { topPreference, types: {}, behaviors: {}, confidence }

  -- Metadata
  message_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discovery Conversations - Store messages
CREATE TABLE IF NOT EXISTS discovery_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,

  -- Message content
  role VARCHAR(20) NOT NULL,
  -- Role: 'user', 'assistant', 'system'
  content TEXT NOT NULL,

  -- Tool usage (for assistant messages)
  tool_calls JSONB,
  -- Structure: [{ tool, input, output, duration_ms }]

  -- Route actions taken
  route_actions JSONB,
  -- Structure: [{ type, data, success }]

  -- Metadata
  tokens_used INTEGER,
  model TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discovery Actions - Log user behavior for preference learning
CREATE TABLE IF NOT EXISTS discovery_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Action details
  action_type VARCHAR(50) NOT NULL,
  -- Types: 'city_added', 'city_removed', 'city_favorited', 'nights_adjusted',
  --        'place_favorited', 'place_dismissed', 'map_explored', 'route_reordered'

  data JSONB NOT NULL DEFAULT '{}',
  -- Context-specific data (cityName, placeType, etc.)
  -- Alias: action_data for backwards compatibility

  -- Learning signals
  implicit_preference TEXT,
  -- Inferred preference from action (e.g., 'hidden_gems', 'foodie')

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Discovery Triggers - Track fired triggers to prevent spam
CREATE TABLE IF NOT EXISTS discovery_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,

  trigger_type VARCHAR(50) NOT NULL,
  trigger_data JSONB DEFAULT '{}',

  -- Response
  suggestion_shown BOOLEAN DEFAULT false,
  suggestion_message TEXT,
  suggestion_dismissed BOOLEAN DEFAULT false,

  -- Quick action taken
  action_taken VARCHAR(50),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- City Search Cache - Cache search results to reduce API calls
CREATE TABLE IF NOT EXISTS discovery_city_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Search key
  query_hash TEXT NOT NULL,
  intent TEXT NOT NULL,
  region TEXT,

  -- Cached results
  cities JSONB NOT NULL,
  narrative TEXT,
  confidence DECIMAL(3,2),

  -- Cache management
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',

  UNIQUE(query_hash, intent, region)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_session_id ON discovery_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_user ON discovery_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_status ON discovery_sessions(status);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_activity ON discovery_sessions(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_discovery_conversations_session ON discovery_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_discovery_conversations_created ON discovery_conversations(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_discovery_actions_session ON discovery_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_discovery_actions_user ON discovery_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_actions_type ON discovery_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_discovery_triggers_session ON discovery_triggers(session_id);
CREATE INDEX IF NOT EXISTS idx_discovery_triggers_type ON discovery_triggers(trigger_type, created_at);

CREATE INDEX IF NOT EXISTS idx_discovery_city_cache_query ON discovery_city_cache(query_hash, intent);
CREATE INDEX IF NOT EXISTS idx_discovery_city_cache_expiry ON discovery_city_cache(expires_at);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_discovery_sessions_updated_at ON discovery_sessions;
CREATE TRIGGER update_discovery_sessions_updated_at
    BEFORE UPDATE ON discovery_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION cleanup_discovery_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM discovery_city_cache WHERE expires_at < NOW();
  DELETE FROM discovery_sessions
    WHERE status = 'abandoned'
    AND last_activity_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Done!
SELECT 'Discovery conversations tables created successfully!' as status;
