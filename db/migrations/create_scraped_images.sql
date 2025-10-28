-- Migration: Create scraped_images table for caching web-scraped entity images
-- Created: 2025-10-28

CREATE TABLE IF NOT EXISTS scraped_images (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('restaurant', 'hotel', 'event')),
  entity_name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  image_url TEXT,
  source_url TEXT,
  source_type VARCHAR(50) CHECK (source_type IN ('opengraph', 'jsonld', 'dom', 'unsplash', 'failed')),
  scraped_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days',
  CONSTRAINT unique_entity UNIQUE(entity_type, entity_name, city)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_scraped_images_lookup
ON scraped_images(entity_type, entity_name, city);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_scraped_images_expiry
ON scraped_images(expires_at);

COMMENT ON TABLE scraped_images IS 'Cached images scraped from restaurant/hotel/event websites';
COMMENT ON COLUMN scraped_images.entity_type IS 'Type of entity: restaurant, hotel, or event';
COMMENT ON COLUMN scraped_images.entity_name IS 'Name of the restaurant, hotel, or event';
COMMENT ON COLUMN scraped_images.city IS 'City where entity is located';
COMMENT ON COLUMN scraped_images.image_url IS 'Scraped or fallback image URL';
COMMENT ON COLUMN scraped_images.source_url IS 'Original website URL that was scraped';
COMMENT ON COLUMN scraped_images.source_type IS 'How the image was obtained: opengraph, jsonld, dom, unsplash, or failed';
COMMENT ON COLUMN scraped_images.scraped_at IS 'When the scraping occurred';
COMMENT ON COLUMN scraped_images.expires_at IS 'When this cache entry should be refreshed (90 days)';
