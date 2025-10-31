-- Migration 003: Add itineraries system
-- Premium detailed itinerary generation with multi-agent architecture

-- =====================================================
-- ITINERARIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Generation metadata
  agent_type VARCHAR(50) NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  generation_time_ms INTEGER,
  preferences JSONB, -- startDate, endDate, budget, pace, travelers

  -- Content from each agent (JSONB for flexibility)
  day_structure JSONB,      -- From Day Planner Agent
  activities JSONB,          -- From City Activity Agent
  restaurants JSONB,         -- From Restaurant Agent
  accommodations JSONB,      -- From Accommodation Agent
  scenic_stops JSONB,        -- From Scenic Route Agent
  practical_info JSONB,      -- From Practical Info Agent
  weather_data JSONB,        -- From Weather Agent
  local_events JSONB,        -- From Events Agent
  budget_breakdown JSONB,    -- From Budget Optimizer

  -- User customizations
  customizations JSONB,

  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  total_cost_estimate DECIMAL(10,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_itineraries_route_id ON itineraries(route_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON itineraries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itineraries_status ON itineraries(status);

-- Trigger for updated_at
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON itineraries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ITINERARY GENERATION LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS itinerary_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  agent_name VARCHAR(50) NOT NULL,

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,

  -- API usage
  tokens_used INTEGER,
  api_cost DECIMAL(10,4),

  -- Status and errors
  status VARCHAR(20) NOT NULL, -- pending, running, success, failed, timeout
  error_message TEXT,

  -- Full response for debugging
  perplexity_request JSONB,
  perplexity_response JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generation_logs_itinerary_id ON itinerary_generation_logs(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_agent_name ON itinerary_generation_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_generation_logs_status ON itinerary_generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON itinerary_generation_logs(created_at DESC);

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get latest itinerary for a route
-- SELECT * FROM itineraries WHERE route_id = 'uuid' ORDER BY created_at DESC LIMIT 1;

-- Get all itineraries for a user
-- SELECT * FROM itineraries WHERE user_id = 'uuid' ORDER BY created_at DESC;

-- Get generation logs for an itinerary
-- SELECT * FROM itinerary_generation_logs WHERE itinerary_id = 'uuid' ORDER BY started_at ASC;

-- Get average generation time per agent
-- SELECT agent_name, AVG(duration_ms) as avg_duration_ms, COUNT(*) as total_runs
-- FROM itinerary_generation_logs
-- WHERE status = 'success'
-- GROUP BY agent_name
-- ORDER BY avg_duration_ms DESC;

-- Get failed generations for debugging
-- SELECT * FROM itinerary_generation_logs
-- WHERE status = 'failed'
-- ORDER BY created_at DESC
-- LIMIT 20;
