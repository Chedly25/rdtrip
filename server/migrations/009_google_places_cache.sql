-- Google Places API Cache Table
-- Stores validated place data to reduce API calls and improve performance

CREATE TABLE IF NOT EXISTS google_places_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  hit_count INTEGER DEFAULT 0
);

CREATE INDEX idx_google_places_cache_key ON google_places_cache(cache_key);
CREATE INDEX idx_google_places_cache_expires ON google_places_cache(expires_at);

-- Validated Places Table
-- Stores enriched place data after validation
CREATE TABLE IF NOT EXISTS validated_places (
  id SERIAL PRIMARY KEY,
  place_id VARCHAR(255) UNIQUE NOT NULL,

  -- Discovery data
  discovered_name VARCHAR(500),
  discovered_from VARCHAR(50), -- 'perplexity', 'manual', etc.

  -- Validated data from Google Places
  verified_name VARCHAR(500) NOT NULL,
  formatted_address TEXT,
  coordinates JSONB, -- {lat, lng}

  -- Ratings & Reviews
  rating DECIMAL(2,1),
  review_count INTEGER,
  price_level INTEGER, -- 0-4

  -- Opening hours
  opening_hours JSONB,
  is_open_now BOOLEAN,

  -- Media
  photos JSONB, -- Array of photo objects

  -- Links
  google_maps_url TEXT,
  website TEXT,
  phone VARCHAR(50),

  -- Metadata
  types JSONB, -- Array of place types
  business_status VARCHAR(50),

  -- Validation info
  validation_status VARCHAR(50) DEFAULT 'valid',
  validation_confidence DECIMAL(3,2),
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Usage tracking
  used_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_validated_places_place_id ON validated_places(place_id);
CREATE INDEX idx_validated_places_coords ON validated_places USING GIN(coordinates);
CREATE INDEX idx_validated_places_rating ON validated_places(rating DESC);

-- Place Validation History
-- Track validation attempts and results
CREATE TABLE IF NOT EXISTS place_validation_history (
  id SERIAL PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id),

  -- Discovery phase
  discovered_name VARCHAR(500),
  discovered_city VARCHAR(200),
  discovery_source VARCHAR(50),

  -- Validation result
  place_id VARCHAR(255),
  validation_status VARCHAR(50), -- 'found', 'not_found', 'ambiguous', 'error'
  confidence_score DECIMAL(3,2),

  -- Matching details
  name_match_score DECIMAL(3,2),
  location_match_score DECIMAL(3,2),

  -- What was found
  validated_data JSONB,

  -- Errors
  error_message TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_place_validation_itinerary ON place_validation_history(itinerary_id);
CREATE INDEX idx_place_validation_status ON place_validation_history(validation_status);

COMMENT ON TABLE google_places_cache IS 'Cache for Google Places API responses to reduce costs';
COMMENT ON TABLE validated_places IS 'Registry of validated real-world places with enriched data';
COMMENT ON TABLE place_validation_history IS 'Audit trail of place validation attempts';
