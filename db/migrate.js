const fs = require('fs');
const path = require('path');
const db = require('./connection');

/**
 * Run database migrations
 * Reads and executes schema.sql to create tables
 */
async function runMigrations() {
  console.log('\n🔧 Starting database migrations...\n');

  try {
    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Reading schema from:', schemaPath);
    console.log('📊 Executing SQL...\n');

    // Execute the schema
    await db.query(schemaSql);

    console.log('✅ Migrations completed successfully!\n');
    console.log('📋 Tables created:');
    console.log('   - users');
    console.log('   - routes');
    console.log('   - searches');
    console.log('\n🎉 Database is ready to use!\n');

    // Verify tables exist
    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('✓ Verified tables in database:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await db.close();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
