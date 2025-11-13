-- Migration 011: Add City Images Cache Table
-- Purpose: Cache city images from Wikipedia and Google Places to reduce API calls
-- Created: 2025-01-13

-- =====================================================
-- Create city_images table for caching
-- =====================================================

CREATE TABLE IF NOT EXISTS city_images (
  id SERIAL PRIMARY KEY,
  city_name VARCHAR(255) NOT NULL,
  country VARCHAR(255),
  image_url TEXT NOT NULL,
  photo_reference TEXT, -- Google Places photo reference for future updates
  source VARCHAR(50) NOT NULL, -- 'wikipedia' or 'google-places'
  width INTEGER, -- Image width from Google Places
  height INTEGER, -- Image height from Google Places
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one cache entry per city/country combination
  UNIQUE(city_name, country)
);

-- Index for fast lookups by city and country
CREATE INDEX IF NOT EXISTS idx_city_images_lookup
ON city_images(city_name, country);

-- Index for source-based queries
CREATE INDEX IF NOT EXISTS idx_city_images_source
ON city_images(source);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_city_images_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER trigger_update_city_images_timestamp
BEFORE UPDATE ON city_images
FOR EACH ROW
EXECUTE FUNCTION update_city_images_timestamp();

-- Add comment for documentation
COMMENT ON TABLE city_images IS 'Caches city images from Wikipedia and Google Places API to reduce external API calls. Images expire after 30 days.';
COMMENT ON COLUMN city_images.photo_reference IS 'Google Places photo reference token for fetching updated images';
COMMENT ON COLUMN city_images.source IS 'Source of the image: wikipedia or google-places';
