/**
 * Environment Configuration
 * Loads and validates environment variables
 */
require('dotenv').config();

const config = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // API Keys
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  MAPBOX_API_KEY: process.env.MAPBOX_API_KEY,
  VITE_MAPBOX_TOKEN: process.env.VITE_MAPBOX_TOKEN,
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
  
  // AI Services
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  COHERE_API_KEY: process.env.COHERE_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  EXCHANGERATE_API_KEY: process.env.EXCHANGERATE_API_KEY,
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Firebase (if used)
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  
  // Redis (for future use)
  REDIS_URL: process.env.REDIS_URL,
  
  // App URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:5000',
  
  // Feature Flags
  ENABLE_CACHING: process.env.ENABLE_CACHING !== 'false',
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

/**
 * Validate required environment variables
 */
function validate() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Run validation
validate();

module.exports = config;

