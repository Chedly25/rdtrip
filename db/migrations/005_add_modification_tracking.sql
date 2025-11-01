-- Migration 005: Add modification tracking for user customizations
-- Enables tracking what users changed and when

-- Add modification tracking fields to itineraries
ALTER TABLE itineraries
  ADD COLUMN IF NOT EXISTS modification_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES users(id);

-- Add index for finding recently modified itineraries
CREATE INDEX IF NOT EXISTS idx_itineraries_last_modified ON itineraries(last_modified_at DESC);

-- Add comments
COMMENT ON COLUMN itineraries.modification_count IS 'Number of times user has modified this itinerary';
COMMENT ON COLUMN itineraries.last_modified_at IS 'When the last user modification was made';
COMMENT ON COLUMN itineraries.last_modified_by IS 'User who made the last modification';
COMMENT ON COLUMN itineraries.customizations IS 'User modifications: removed items, added items, edited fields, reordered items';

-- Customizations JSONB structure:
-- {
--   "removed": { "activities": ["id1", "id2"], "restaurants": ["id3"] },
--   "added": { "activities": [{custom activity}], "restaurants": [{custom restaurant}] },
--   "edited": { "activity-id1": { "time": "10:00" }, "restaurant-id2": { "price": 35 } },
--   "reordered": { "day-1-activities": ["id3", "id1", "id2"] },
--   "notes": { "activity-id1": "Must see this!" },
--   "flags": { "activity-id1": "must-see", "activity-id2": "optional" }
-- }
