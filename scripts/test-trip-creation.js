#!/usr/bin/env node
/**
 * Test script to verify user_trips table and create a test trip
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

async function testTripCreation() {
  console.log('🧪 Testing trip creation...\n');

  try {
    // Test 1: Check if table exists
    console.log('1️⃣ Checking if user_trips table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'user_trips'
      )
    `);
    console.log(`   user_trips table exists: ${tableCheck.rows[0].exists}`);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ user_trips table does not exist. Run migration first.');
      process.exit(1);
    }

    // Test 2: Check table structure
    console.log('\n2️⃣ Checking table structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_trips'
      ORDER BY ordinal_position
    `);
    console.log('   Columns:');
    columns.rows.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type}`);
    });

    // Test 3: Try to create a test trip
    console.log('\n3️⃣ Creating test trip...');
    const testOrigin = {
      name: 'Paris',
      country: 'France',
      coordinates: [48.8566, 2.3522]
    };
    const testDestination = {
      name: 'Berlin',
      country: 'Germany',
      coordinates: [52.5200, 13.4050]
    };

    const result = await pool.query(`
      INSERT INTO user_trips (
        user_id, origin, destination, nights, generation_job_id,
        title, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, created_at
    `, [
      '00000000-0000-0000-0000-000000000000', // Guest user
      testOrigin,
      testDestination,
      5,
      'test-job-' + Date.now(),
      `${testOrigin.name} to ${testDestination.name}`,
      'draft'
    ]);

    console.log(`   ✅ Test trip created successfully!`);
    console.log(`      Trip ID: ${result.rows[0].id}`);
    console.log(`      Title: ${result.rows[0].title}`);
    console.log(`      Created: ${result.rows[0].created_at}`);

    // Test 4: Verify trip was saved
    console.log('\n4️⃣ Verifying trip was saved...');
    const tripCount = await pool.query('SELECT COUNT(*) FROM user_trips');
    console.log(`   Total trips in database: ${tripCount.rows[0].count}`);

    // Clean up test trip
    console.log('\n5️⃣ Cleaning up test trip...');
    await pool.query('DELETE FROM user_trips WHERE id = $1', [result.rows[0].id]);
    console.log('   ✅ Test trip deleted');

    console.log('\n✅ All tests passed! Trip creation is working correctly.');
    console.log('\n💡 Next steps:');
    console.log('   - Check if route generation is using processRouteJobNightsBased');
    console.log('   - Check Heroku logs for "Failed to persist trip" errors');
    console.log('   - Verify the route generation actually completes successfully');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testTripCreation();
