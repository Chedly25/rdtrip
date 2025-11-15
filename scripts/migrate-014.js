#!/usr/bin/env node

/**
 * Migration Script: 014_add_tasks.sql
 * Phase 4: Task Management System
 */

const fs = require('fs');
const path = require('path');
const db = require('../db/connection');

async function runMigration() {
  console.log('🚀 Running Migration: 014_add_tasks.sql');
  console.log('=========================================');
  console.log('Phase 4: Task Management System\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../db/migrations/014_add_tasks.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await db.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Created Resources:');
    console.log('   ✓ trip_tasks table');
    console.log('   ✓ 7 indexes for performance');
    console.log('   ✓ update_trip_tasks_timestamp trigger');
    console.log('   ✓ notify_task_completion trigger');
    console.log('\n🎯 Features Enabled:');
    console.log('   • Task creation and assignment');
    console.log('   • Priority levels (low/medium/high/urgent)');
    console.log('   • Status tracking (pending/in_progress/completed/cancelled)');
    console.log('   • Due date management');
    console.log('   • Completion proof attachments (JSONB)');
    console.log('   • Activity logging on task completion');
    console.log('\n📊 Task Types Supported:');
    console.log('   • book_hotel');
    console.log('   • book_restaurant');
    console.log('   • research');
    console.log('   • purchase_tickets');
    console.log('   • pack');
    console.log('   • transport');
    console.log('   • custom');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

runMigration();
