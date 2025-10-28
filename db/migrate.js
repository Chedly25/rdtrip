#!/usr/bin/env node
/**
 * Database migration runner
 * Usage: node db/migrate.js <migration-file.sql>
 * Example: node db/migrate.js create_scraped_images.sql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get migration file from command line
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node db/migrate.js <migration-file.sql>');
  process.exit(1);
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const migrationPath = path.join(__dirname, 'migrations', migrationFile);

  console.log(`Reading migration: ${migrationPath}`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Connecting to database...');
  const client = await pool.connect();

  try {
    console.log('Running migration...');
    await client.query(sql);
    console.log('✅ Migration successful!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
