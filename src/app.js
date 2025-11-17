/**
 * Express Application Setup
 * Configures Express app with all middleware and routes
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const { env } = require('./config');
const logger = require('./core/logger');
const { errorHandler, requestLogger } = require('./api/middleware');

/**
 * Create and configure Express application
 */
function createApp() {
  const app = express();

  // ======================
  // Global Middleware
  // ======================
  
  // CORS
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // Static files
  app.use(express.static(path.join(__dirname, '../public')));

  // ======================
  // Health Check
  // ======================
  
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    });
  });

  // ======================
  // Initialize Services
  // ======================
  
  const { initializeServices } = require('./config/services');
  initializeServices();
  logger.info('Services initialized and registered in DI container');

  // ======================
  // API Routes
  // ======================
  
  const apiV1Routes = require('./api/routes/v1');
  app.use('/api/v1', apiV1Routes);
  logger.info('API v1 routes mounted at /api/v1');

  // Temporary: Old routes still available in legacy server.js
  logger.warn('Legacy server.js routes still available - migration in progress');

  // ======================
  // Catch-all for React Router (SPA)
  // ======================
  
  app.get('*', (req, res) => {
    // Don't intercept API routes or static files
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
    
    // Serve React app
    res.sendFile(path.join(__dirname, '../public/landing-react/index.html'));
  });

  // ======================
  // Error Handling
  // ======================
  
  // 404 handler (only for unmatched API routes)
  app.use('/api/*', errorHandler.notFoundHandler);

  // Global error handler
  app.use(errorHandler.errorHandler);

  return app;
}

module.exports = createApp;

