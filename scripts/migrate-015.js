#!/usr/bin/env node

/**
 * Migration Script: 015_add_navigation_system.sql
 * Phase 1: Navigation Redesign - My Trips System (Backend Only)
 */

const fs = require('fs');
const path = require('path');
const db = require('../db/connection');

async function runMigration() {
  console.log('🚀 Running Migration: 015_add_navigation_system.sql');
  console.log('=========================================');
  console.log('Phase 1: Navigation Redesign - My Trips System\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../db/migrations/015_add_navigation_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await db.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Created Tables:');
    console.log('   ✓ user_trips - Central trip storage');
    console.log('   ✓ route_proposals - All 4 agent proposals');
    console.log('   ✓ trip_versions - Auto-save history');
    console.log('   ✓ user_preferences - User UI settings');
    console.log('\n📊 Created Indexes:');
    console.log('   ✓ idx_user_trips_user_id');
    console.log('   ✓ idx_user_trips_status');
    console.log('   ✓ idx_user_trips_updated_at');
    console.log('   ✓ idx_user_trips_generation_job_id');
    console.log('   ✓ idx_route_proposals_trip_id');
    console.log('   ✓ idx_route_proposals_selected');
    console.log('   ✓ idx_trip_versions_trip_id');
    console.log('   ✓ idx_trip_versions_created_at');
    console.log('\n🔄 Data Migration:');
    console.log('   ✓ Migrated existing route_jobs to user_trips');
    console.log('\n🎯 Features Enabled:');
    console.log('   • Persistent trip storage');
    console.log('   • Route proposals comparison (all 4 agents)');
    console.log('   • Auto-save with version history');
    console.log('   • User preferences tracking');
    console.log('   • No breaking changes - old flow continues working!');
    console.log('\n📡 Next Steps:');
    console.log('   → Deploy backend API endpoints to server.js');
    console.log('   → Test APIs with curl/Postman');
    console.log('   → Phase 2: Build My Trips dashboard (frontend)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    console.error('\n💡 Rollback Instructions:');
    console.error('   If needed, run these SQL commands to rollback:');
    console.error('   DROP TABLE IF EXISTS trip_versions CASCADE;');
    console.error('   DROP TABLE IF EXISTS route_proposals CASCADE;');
    console.error('   DROP TABLE IF EXISTS user_preferences CASCADE;');
    console.error('   DROP TABLE IF EXISTS user_trips CASCADE;');
    process.exit(1);
  }
}

runMigration();
