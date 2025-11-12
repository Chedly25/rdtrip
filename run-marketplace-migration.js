const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('📦 Running Phase 4 marketplace migration...\n');

    const sql = fs.readFileSync(
      path.join(__dirname, 'db/migrations/012_add_route_marketplace.sql'),
      'utf8'
    );

    await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('Created tables:');
    console.log('  - published_routes');
    console.log('  - route_reviews');
    console.log('  - route_clones');
    console.log('  - route_collections');
    console.log('  - collection_routes');
    console.log('  - review_helpful_votes\n');

    console.log('Created views:');
    console.log('  - top_rated_routes');
    console.log('  - trending_routes');
    console.log('  - featured_routes\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

runMigration();
