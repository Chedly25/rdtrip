const { Pool } = require('pg');

async function createTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📚 Creating Google Places tables...');

    // Google Places Cache
    await pool.query(`
      CREATE TABLE IF NOT EXISTS google_places_cache (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(255) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        hit_count INTEGER DEFAULT 0
      )
    `);
    console.log('✓ Created google_places_cache');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_google_places_cache_key ON google_places_cache(cache_key)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_google_places_cache_expires ON google_places_cache(expires_at)`);

    // Validated Places
    await pool.query(`
      CREATE TABLE IF NOT EXISTS validated_places (
        id SERIAL PRIMARY KEY,
        place_id VARCHAR(255) UNIQUE NOT NULL,
        discovered_name VARCHAR(500),
        discovered_from VARCHAR(50),
        verified_name VARCHAR(500) NOT NULL,
        formatted_address TEXT,
        coordinates JSONB,
        rating DECIMAL(2,1),
        review_count INTEGER,
        price_level INTEGER,
        opening_hours JSONB,
        is_open_now BOOLEAN,
        photos JSONB,
        google_maps_url TEXT,
        website TEXT,
        phone VARCHAR(50),
        types JSONB,
        business_status VARCHAR(50),
        validation_status VARCHAR(50) DEFAULT 'valid',
        validation_confidence DECIMAL(3,2),
        validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_count INTEGER DEFAULT 0,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created validated_places');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_validated_places_place_id ON validated_places(place_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_validated_places_rating ON validated_places(rating DESC)`);

    // Place Validation History
    await pool.query(`
      CREATE TABLE IF NOT EXISTS place_validation_history (
        id SERIAL PRIMARY KEY,
        itinerary_id UUID,
        discovered_name VARCHAR(500),
        discovered_city VARCHAR(200),
        discovery_source VARCHAR(50),
        place_id VARCHAR(255),
        validation_status VARCHAR(50),
        confidence_score DECIMAL(3,2),
        name_match_score DECIMAL(3,2),
        location_match_score DECIMAL(3,2),
        validated_data JSONB,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created place_validation_history');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_place_validation_itinerary ON place_validation_history(itinerary_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_place_validation_status ON place_validation_history(validation_status)`);

    console.log('\n✅ All tables created successfully!');

  } catch (error) {
    console.error('✗ Table creation failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();
