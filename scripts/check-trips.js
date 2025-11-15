#!/usr/bin/env node
/**
 * Check trips in database
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

async function checkTrips() {
  console.log('🔍 Checking user_trips table...\n');

  try {
    // Check total trips
    const totalResult = await pool.query('SELECT COUNT(*) FROM user_trips');
    console.log(`Total trips in database: ${totalResult.rows[0].count}`);

    // Check recent trips
    console.log('\n📋 Recent trips (last 10):');
    const recentResult = await pool.query(`
      SELECT
        id,
        user_id,
        title,
        status,
        selected_agent_type,
        created_at
      FROM user_trips
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (recentResult.rows.length === 0) {
      console.log('   ❌ NO TRIPS FOUND');
    } else {
      recentResult.rows.forEach((trip, i) => {
        console.log(`\n   ${i + 1}. ${trip.title}`);
        console.log(`      Trip ID: ${trip.id}`);
        console.log(`      User ID: ${trip.user_id}`);
        console.log(`      Status: ${trip.status}`);
        console.log(`      Agent: ${trip.selected_agent_type || 'none'}`);
        console.log(`      Created: ${trip.created_at}`);
      });
    }

    // Check trips from last hour
    console.log('\n⏰ Trips from last hour:');
    const hourResult = await pool.query(`
      SELECT COUNT(*) FROM user_trips
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);
    console.log(`   Count: ${hourResult.rows[0].count}`);

    // Check proposals
    console.log('\n📊 Route proposals:');
    const proposalsResult = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(DISTINCT trip_id) as unique_trips
      FROM route_proposals
    `);
    console.log(`   Total proposals: ${proposalsResult.rows[0].total}`);
    console.log(`   Trips with proposals: ${proposalsResult.rows[0].unique_trips}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkTrips();
