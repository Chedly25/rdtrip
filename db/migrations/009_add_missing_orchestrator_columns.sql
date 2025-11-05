-- Migration 009: Add missing columns for AgentOrchestratorV3
-- Adds columns that AgentOrchestratorV3 expects but are missing from schema

-- Add metrics column for tracking agent performance
ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS metrics JSONB;

-- Add completed_at timestamp
ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add processing_status for better status tracking
ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20);

-- Add columns with correct names that match code
ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS weather JSONB;

ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS events JSONB;

ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS budget JSONB;

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_itineraries_processing_status ON itineraries(processing_status);
CREATE INDEX IF NOT EXISTS idx_itineraries_completed_at ON itineraries(completed_at);

-- Add comments for documentation
COMMENT ON COLUMN itineraries.metrics IS 'Agent performance metrics (execution times, API calls, etc.)';
COMMENT ON COLUMN itineraries.completed_at IS 'Timestamp when itinerary generation completed';
COMMENT ON COLUMN itineraries.processing_status IS 'Current processing status (pending, processing, generating, completed, failed)';
COMMENT ON COLUMN itineraries.weather IS 'Weather information from Weather Agent';
COMMENT ON COLUMN itineraries.events IS 'Local events from Events Agent';
COMMENT ON COLUMN itineraries.budget IS 'Budget breakdown from Budget Optimizer';
