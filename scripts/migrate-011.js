#!/usr/bin/env node

/**
 * Migration script for 011_add_message_reactions.sql
 * Run with: node scripts/migrate-011.js
 * Or on Heroku: heroku run "node scripts/migrate-011.js" --app rdtrip
 */

const db = require('../db/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔧 Running migration: 011_add_message_reactions.sql');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../db/migrations/011_add_message_reactions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await db.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('   - Added reactions column (JSONB)');
    console.log('   - Added parent_message_id for threading');
    console.log('   - Added mentioned_users array for @mentions');
    console.log('   - Added message_metadata for rich content');
    console.log('   - Created indexes for performance');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
