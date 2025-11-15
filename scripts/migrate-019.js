#!/usr/bin/env node

/**
 * Migration script for 019_add_notifications.sql
 * Run with: node scripts/migrate-019.js
 * Or on Heroku: heroku run "node scripts/migrate-019.js" --app rdtrip
 */

const db = require('../db/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Running Migration: 019_add_notifications.sql');
  console.log('=========================================');
  console.log('Phase 5: Notifications & Push System\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../db/migrations/019_add_notifications.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    await db.query(sql);

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Created Resources:');
    console.log('   ✓ user_devices table (FCM token storage)');
    console.log('   ✓ notifications table (in-app notifications)');
    console.log('   ✓ notification_preferences table (user settings)');
    console.log('   ✓ 5 indexes for performance');
    console.log('   ✓ update_notification_preferences_timestamp trigger\n');

    console.log('🎯 Features Enabled:');
    console.log('   • Push notifications via Firebase Cloud Messaging');
    console.log('   • In-app notification center with unread counts');
    console.log('   • Per-user notification preferences');
    console.log('   • Multi-device support');
    console.log('   • 10 notification event types');
    console.log('   • Quiet hours configuration (DND)\n');

    console.log('📊 Notification Types Supported:');
    console.log('   • mention - @mentions in chat/comments');
    console.log('   • task_assigned - Task assignment');
    console.log('   • task_due_soon - Task due within 24h');
    console.log('   • poll_created - New poll');
    console.log('   • poll_closed - Poll results');
    console.log('   • comment_on_activity - Activity comment');
    console.log('   • activity_changed - Activity update');
    console.log('   • chat_message - New message');
    console.log('   • collaborator_added - Added to route');
    console.log('   • route_shared - Route shared\n');

    console.log('⚠️  Next Steps:');
    console.log('   1. Set up Firebase project at https://console.firebase.google.com');
    console.log('   2. Enable Cloud Messaging in Firebase Console');
    console.log('   3. Generate Web Push Certificate (VAPID key)');
    console.log('   4. Download Service Account Key for Admin SDK');
    console.log('   5. Add Firebase credentials to environment variables');
    console.log('   6. Deploy NotificationService and API endpoints\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
