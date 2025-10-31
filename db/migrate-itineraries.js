#!/usr/bin/env node
/**
 * Run the itineraries migration
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, 'migrations', '003_add_itineraries.sql'), 'utf8');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

async function run() {
  console.log('📦 Connecting to database...');
  const client = await pool.connect();

  try {
    console.log('🚀 Running migration: 003_add_itineraries.sql');
    await client.query(sql);
    console.log('✅ Migration successful! Itineraries tables created.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Tables may already exist - this is OK');
    } else {
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
