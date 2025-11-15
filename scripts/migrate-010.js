#!/usr/bin/env node

/**
 * Migration script for 010_add_collaboration.sql
 * Run with: node scripts/migrate-010.js
 * Or on Heroku: heroku run "node scripts/migrate-010.js" --app rdtrip
 */

const db = require('../db/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔧 Running migration: 010_add_collaboration.sql');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../db/migrations/010_add_collaboration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await db.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('   - Created route_collaborators table');
    console.log('   - Created trip_messages table');
    console.log('   - Created route_activity table');
    console.log('   - Created user_presence table');
    console.log('   - Created indexes for performance');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
