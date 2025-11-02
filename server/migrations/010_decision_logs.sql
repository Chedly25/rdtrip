-- Decision Logs Table
-- Stores all agent decisions for transparency, debugging, and learning

CREATE TABLE IF NOT EXISTS decision_logs (
  id SERIAL PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  phase VARCHAR(50) NOT NULL,           -- discovery, validation, selection, feedback, error
  agent_name VARCHAR(100),              -- StrategicDiscoveryAgent, OrchestratorAgent, etc.
  decision_data JSONB NOT NULL,         -- Full decision details
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_decision_logs_itinerary ON decision_logs(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_phase ON decision_logs(phase);
CREATE INDEX IF NOT EXISTS idx_decision_logs_timestamp ON decision_logs(timestamp);

-- Index for JSON queries (to query specific decision data)
CREATE INDEX IF NOT EXISTS idx_decision_logs_data ON decision_logs USING GIN (decision_data);

-- Comments for documentation
COMMENT ON TABLE decision_logs IS 'Stores all agent decisions with full reasoning for transparency and learning';
COMMENT ON COLUMN decision_logs.phase IS 'Phase of decision: discovery, validation, selection, feedback, error';
COMMENT ON COLUMN decision_logs.agent_name IS 'Name of agent that made the decision';
COMMENT ON COLUMN decision_logs.decision_data IS 'Full decision details including reasoning, alternatives, confidence';
