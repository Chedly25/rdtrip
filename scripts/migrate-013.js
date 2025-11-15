#!/usr/bin/env node

/**
 * Migration Script: 013_add_polls.sql
 * Phase 3: Decision Making System - Polling & Voting
 */

const fs = require('fs');
const path = require('path');
const db = require('../db/connection');

async function runMigration() {
  console.log('🚀 Running Migration: 013_add_polls.sql');
  console.log('=========================================');
  console.log('Phase 3: Decision Making System - Polling & Voting\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../db/migrations/013_add_polls.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration SQL...\n');

    // Execute the migration
    await db.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const tablesCheck = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('trip_polls', 'poll_votes')
      ORDER BY table_name;
    `);

    console.log('Tables created:');
    tablesCheck.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Check indexes
    const indexesCheck = await db.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('trip_polls', 'poll_votes')
        AND schemaname = 'public'
      ORDER BY indexname;
    `);

    console.log('\nIndexes created:');
    indexesCheck.rows.forEach(row => {
      console.log(`  ✅ ${row.indexname}`);
    });

    // Check triggers
    const triggersCheck = await db.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND event_object_table IN ('trip_polls', 'poll_votes')
      ORDER BY trigger_name;
    `);

    console.log('\nTriggers created:');
    triggersCheck.rows.forEach(row => {
      console.log(`  ✅ ${row.trigger_name} on ${row.event_object_table}`);
    });

    console.log('\n=========================================');
    console.log('✅ Phase 3 Database Schema Ready!');
    console.log('=========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
