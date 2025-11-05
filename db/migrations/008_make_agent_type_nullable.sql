-- Migration 008: Make agent_type nullable for orchestrated multi-agent generations
-- AgentOrchestratorV3 uses multiple agents, so there's no single agent_type

ALTER TABLE itineraries
ALTER COLUMN agent_type DROP NOT NULL;

-- Set a default value for clarity
ALTER TABLE itineraries
ALTER COLUMN agent_type SET DEFAULT 'orchestrated';

-- Update existing records that might be null
UPDATE itineraries
SET agent_type = 'orchestrated'
WHERE agent_type IS NULL;
