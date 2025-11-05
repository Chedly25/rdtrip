-- Migration: Add performance indexes for common queries
-- Created: SESSION 6 - Performance optimization

-- Index on itineraries for status queries (used in polling)
CREATE INDEX IF NOT EXISTS idx_itineraries_status
ON itineraries(processing_status)
WHERE processing_status IN ('pending', 'processing', 'generating');

-- Index on itineraries for ID + status lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_itineraries_id_status
ON itineraries(id, processing_status);

-- Index on progress JSONB field for quick progress checks
CREATE INDEX IF NOT EXISTS idx_itineraries_progress
ON itineraries USING GIN (progress);

-- Index on created_at for time-based queries and cleanup
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at
ON itineraries(created_at DESC);

-- Index on completed_at for analytics and cleanup
CREATE INDEX IF NOT EXISTS idx_itineraries_completed_at
ON itineraries(completed_at DESC)
WHERE completed_at IS NOT NULL;

-- Composite index for user's itineraries (if user_id is used)
CREATE INDEX IF NOT EXISTS idx_itineraries_user_created
ON itineraries(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Index on route_id for route-based lookups
CREATE INDEX IF NOT EXISTS idx_itineraries_route_id
ON itineraries(route_id)
WHERE route_id IS NOT NULL;

-- Partial index for active generations (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_itineraries_active
ON itineraries(id, updated_at)
WHERE processing_status IN ('pending', 'processing', 'generating');

-- ANALYZE tables for query planner
ANALYZE itineraries;

-- Add comments for documentation
COMMENT ON INDEX idx_itineraries_status IS 'Quick lookup of itineraries by status';
COMMENT ON INDEX idx_itineraries_id_status IS 'Optimized for status polling queries';
COMMENT ON INDEX idx_itineraries_progress IS 'GIN index for JSONB progress queries';
COMMENT ON INDEX idx_itineraries_created_at IS 'Time-based queries and cleanup';
COMMENT ON INDEX idx_itineraries_active IS 'Partial index for active generations only';
