-- Migration 004: Add async job tracking for itinerary generation
-- Enables background processing with status tracking

-- Add new columns to itineraries table for job tracking
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS error_log JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_itineraries_processing_status ON itineraries(processing_status);

-- Add comments for clarity
COMMENT ON COLUMN itineraries.processing_status IS 'Job status: pending, processing, completed, failed';
COMMENT ON COLUMN itineraries.progress IS 'Track which agents have completed: {"dayPlanner": "completed", "activities": "running", ...}';
COMMENT ON COLUMN itineraries.error_log IS 'Array of error objects from failed agents';
COMMENT ON COLUMN itineraries.started_at IS 'When background processing started';
COMMENT ON COLUMN itineraries.completed_at IS 'When all agents finished (success or failure)';

-- Note: processing_status values:
-- - 'pending': Job created, waiting to start
-- - 'processing': Agents currently running
-- - 'completed': All agents finished successfully
-- - 'failed': One or more critical agents failed
-- - 'partial': Some agents failed but core data exists
