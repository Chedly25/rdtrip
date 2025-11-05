-- Migration 007: Add route_data column to itineraries table
-- Required by AgentOrchestratorV3 for storing route information

ALTER TABLE itineraries
ADD COLUMN IF NOT EXISTS route_data JSONB;

-- Add comment for documentation
COMMENT ON COLUMN itineraries.route_data IS 'Route information from routes table, stored for denormalization and faster access';

-- Create index for JSONB queries on route_data
CREATE INDEX IF NOT EXISTS idx_itineraries_route_data ON itineraries USING GIN (route_data);
