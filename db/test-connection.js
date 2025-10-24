const db = require('./connection');

/**
 * Test database connection
 * Verifies PostgreSQL is accessible and tables exist
 */
async function testConnection() {
  console.log('\n🧪 Testing database connection...\n');

  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic connectivity');
    const timeResult = await db.query('SELECT NOW() as current_time');
    console.log('✅ Connected to PostgreSQL');
    console.log(`   Server time: ${timeResult.rows[0].current_time}\n`);

    // Test 2: Check if tables exist
    console.log('Test 2: Verify tables exist');
    const tablesResult = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found. Run "npm run db:migrate" to create tables.\n');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');
    }

    // Test 3: Count rows in each table
    if (tablesResult.rows.length > 0) {
      console.log('Test 3: Count rows');

      for (const row of tablesResult.rows) {
        const countResult = await db.query(`SELECT COUNT(*) FROM ${row.table_name}`);
        console.log(`   ${row.table_name}: ${countResult.rows[0].count} rows`);
      }
      console.log('');
    }

    // Test 4: Check database size
    console.log('Test 4: Database size');
    const sizeResult = await db.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    `);
    console.log(`   Database size: ${sizeResult.rows[0].size}\n`);

    console.log('✅ All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testConnection()
    .then(() => {
      console.log('Test complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testConnection };
