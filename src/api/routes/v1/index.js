/**
 * API v1 Routes Index
 * Aggregate all v1 API routes
 */
const express = require('express');
const router = express.Router();

// Import route modules
const placesRoutes = require('./places.routes');

// Mount routes
router.use('/places', placesRoutes);

// Health check for API v1
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    version: 'v1',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

