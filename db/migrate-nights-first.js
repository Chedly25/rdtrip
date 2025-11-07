/**
 * Database Migration: Nights-First Architecture
 *
 * Adds total_nights and trip_pace columns to routes table
 * Migrates existing routes from stops-based to nights-based
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

async function migrateNightsFirst() {
  const client = await pool.connect();

  try {
    console.log('\n🔄 === NIGHTS-FIRST DATABASE MIGRATION ===\n');

    // Start transaction
    await client.query('BEGIN');

    // Step 1: Add new columns if they don't exist
    console.log('📋 Step 1: Adding new columns...');

    await client.query(`
      ALTER TABLE routes
      ADD COLUMN IF NOT EXISTS total_nights INTEGER,
      ADD COLUMN IF NOT EXISTS trip_pace VARCHAR(20)
    `);

    console.log('✅ Columns added: total_nights, trip_pace\n');

    // Step 2: Migrate existing data
    console.log('📋 Step 2: Migrating existing routes...');

    const result = await client.query(`
      SELECT id, stops, route_data
      FROM routes
      WHERE total_nights IS NULL
    `);

    console.log(`   Found ${result.rows.length} routes to migrate\n`);

    let migrated = 0;
    let failed = 0;

    for (const route of result.rows) {
      try {
        // Calculate total_nights from stops
        // Estimate: 2 nights per stop (reasonable average)
        const totalNights = (route.stops || 3) * 2;

        // Try to extract actual nights from route_data if available
        let actualNights = totalNights;
        if (route.route_data) {
          try {
            const routeData = typeof route.route_data === 'string'
              ? JSON.parse(route.route_data)
              : route.route_data;

            // Check if nightAllocations exists
            if (routeData.nightAllocations) {
              const nightsArray = Object.values(routeData.nightAllocations);
              if (nightsArray.length > 0) {
                actualNights = nightsArray.reduce((sum, n) => sum + n, 0);
              }
            }
          } catch (e) {
            // If parsing fails, use estimated nights
          }
        }

        // Default to balanced pace
        const tripPace = 'balanced';

        // Update the route
        await client.query(`
          UPDATE routes
          SET total_nights = $1, trip_pace = $2
          WHERE id = $3
        `,
          [actualNights, tripPace, route.id]
        );

        migrated++;
        console.log(`   ✓ Route ${route.id}: ${route.stops} stops → ${actualNights} nights (${tripPace})`);

      } catch (error) {
        failed++;
        console.error(`   ❌ Route ${route.id} failed:`, error.message);
      }
    }

    // Step 3: Add index on new columns for performance
    console.log('\n📋 Step 3: Adding indexes...');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_routes_total_nights ON routes(total_nights);
      CREATE INDEX IF NOT EXISTS idx_routes_trip_pace ON routes(trip_pace);
    `);

    console.log('✅ Indexes created\n');

    // Commit transaction
    await client.query('COMMIT');

    console.log('=== MIGRATION COMPLETE ===');
    console.log(`✅ Migrated: ${migrated} routes`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} routes`);
    }
    console.log(`\n💡 Note: 'stops' column is preserved for backward compatibility`);
    console.log(`   It can be removed in a future migration once all clients are updated.\n`);

  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
if (require.main === module) {
  migrateNightsFirst()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateNightsFirst };
