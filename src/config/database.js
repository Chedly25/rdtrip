/**
 * Database Configuration
 * PostgreSQL connection pool setup
 */
const { Pool } = require('pg');
const env = require('./environment');
const logger = require('../core/logger').child('Database');

// Create connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL?.includes('amazonaws.com') || env.DATABASE_URL?.includes('heroku') 
    ? { rejectUnauthorized: false } 
    : false,
  // Connection pool settings
  max: 20,                    // Maximum number of clients
  min: 2,                     // Minimum number of clients
  idleTimeoutMillis: 30000,   // Close idle clients after 30s
  connectionTimeoutMillis: 5000 // Timeout if can't connect in 5s
});

// Log pool events
pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
});

pool.on('remove', () => {
  logger.debug('Database connection removed from pool');
});

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection successful', { 
      timestamp: result.rows[0].now 
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', error);
    throw error;
  }
}

/**
 * Execute query with error handling
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug('Query executed', {
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    logger.error('Query execution failed', {
      query: text,
      params,
      error: error.message
    });
    throw error;
  }
}

/**
 * Get a client from pool for transactions
 */
async function getClient() {
  try {
    return await pool.connect();
  } catch (error) {
    logger.error('Failed to get database client', error);
    throw error;
  }
}

/**
 * Close all connections (for graceful shutdown)
 */
async function close() {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  close
};

