/**
 * Migration script for Trip Progress tables
 * Run with: heroku run node scripts/migrate-trip-tables.js --app rdtrip
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Starting migration for Trip Progress tables...\n');

  try {
    // Create active_trips table
    console.log('Creating active_trips table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS active_trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
        itinerary_id UUID REFERENCES itineraries(id) ON DELETE SET NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'active',
        current_day INTEGER DEFAULT 1,
        current_city_index INTEGER DEFAULT 0,
        last_location JSONB,
        last_location_update TIMESTAMP,
        started_at TIMESTAMP DEFAULT NOW(),
        paused_at TIMESTAMP,
        completed_at TIMESTAMP,
        stats JSONB DEFAULT '{"distance_traveled": 0, "photos_captured": 0, "checkins_complete": 0, "total_checkins": 0}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ active_trips table created\n');

    // Create trip_checkins table
    console.log('Creating trip_checkins table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trip_checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES active_trips(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_id VARCHAR(100),
        activity_name TEXT NOT NULL,
        activity_type VARCHAR(50),
        day_number INTEGER,
        location_name TEXT,
        coordinates JSONB,
        photo_urls TEXT[],
        note TEXT,
        rating INTEGER,
        mood VARCHAR(20),
        weather VARCHAR(20),
        status VARCHAR(20) DEFAULT 'completed',
        checked_in_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ trip_checkins table created\n');

    // Create trip_location_updates table
    console.log('Creating trip_location_updates table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trip_location_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES active_trips(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(10, 2),
        altitude DECIMAL(10, 2),
        speed DECIMAL(10, 2),
        heading DECIMAL(5, 2),
        city TEXT,
        country TEXT,
        address TEXT,
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ trip_location_updates table created\n');

    // Create indexes
    console.log('Creating indexes...');
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_active_trips_user ON active_trips(user_id, status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_active_trips_route ON active_trips(route_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_trip_checkins_trip ON trip_checkins(trip_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_trip_locations_trip ON trip_location_updates(trip_id)`);
    console.log('✓ Indexes created\n');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
