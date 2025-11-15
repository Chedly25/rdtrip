#!/usr/bin/env node

/**
 * Migration script for 012_add_activity_comments.sql
 * Run with: node scripts/migrate-012.js
 * Or on Heroku: heroku run "node scripts/migrate-012.js" --app rdtrip
 */

const db = require('../db/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔧 Running migration: 012_add_activity_comments.sql');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../db/migrations/012_add_activity_comments.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await db.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('   - Created activity_comments table');
    console.log('   - Added target_type check constraint (activity, day, restaurant, route)');
    console.log('   - Added parent_comment_id for threading');
    console.log('   - Added resolved status tracking');
    console.log('   - Created 6 indexes for performance');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
