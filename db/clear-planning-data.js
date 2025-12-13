#!/usr/bin/env node
/**
 * Clear all planning data for fresh start
 *
 * Phase 4 Option 3: Nuclear option - clear all existing plans
 * so new plans use day-based organization instead of "Historic Center"
 *
 * Tables to clear (in order due to foreign keys):
 * 1. plan_items (references plan_clusters and city_plans)
 * 2. plan_clusters (references city_plans)
 * 3. city_plans (references trip_plans)
 * 4. trip_plans (references planning_routes)
 * 5. planning_routes (base table)
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

async function clearPlanningData() {
  console.log('🗑️  Clearing planning data for fresh start...\n');

  const client = await pool.connect();

  try {
    // Get counts before clearing
    console.log('📊 Current data:');

    const tables = [
      'plan_items',
      'plan_clusters',
      'city_plans',
      'trip_plans',
      'planning_routes'
    ];

    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ${table}: ${result.rows[0].count} rows`);
      } catch (err) {
        console.log(`   ${table}: table does not exist`);
      }
    }

    console.log('\n🧹 Clearing tables in order...\n');

    // Clear in order (child tables first due to foreign keys)
    for (const table of tables) {
      try {
        const result = await client.query(`DELETE FROM ${table}`);
        console.log(`   ✅ Cleared ${table}: ${result.rowCount} rows deleted`);
      } catch (err) {
        if (err.message.includes('does not exist')) {
          console.log(`   ⚠️  ${table}: table does not exist (skipped)`);
        } else {
          console.log(`   ❌ ${table}: ${err.message}`);
        }
      }
    }

    console.log('\n✨ Planning data cleared! New plans will use day-based organization.\n');

  } finally {
    client.release();
    await pool.end();
  }
}

clearPlanningData().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
