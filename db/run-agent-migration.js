/**
 * Run Agent Tables Migration
 * Usage: node db/run-agent-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Running agent tables migration...');

    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '011_add_agent_tables.sql'),
      'utf8'
    );

    // Execute migration
    await pool.query(migrationSQL);

    console.log('✅ Agent tables migration completed successfully!');
    console.log('Created tables:');
    console.log('  - agent_conversations');
    console.log('  - agent_messages');
    console.log('  - agent_memory');
    console.log('  - agent_user_preferences');
    console.log('  - agent_suggestions');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
