/**
 * Places Routes
 * API endpoints for place search and discovery
 */
const express = require('express');
const router = express.Router();
const PlacesController = require('../../controllers/places.controller');
const { container } = require('../../../config/services');
const { authenticate } = require('../../../../middleware/auth');

// Initialize controller with services from container
const placesController = new PlacesController(
  container.get('googlePlacesService'),
  container.get('wikipediaImageService')
);

/**
 * @route   POST /api/v1/places/search
 * @desc    Search for places by text query
 * @access  Public
 */
router.post('/search', placesController.search);

/**
 * @route   POST /api/v1/places/nearby
 * @desc    Find nearby places
 * @access  Public
 */
router.post('/nearby', placesController.findNearby);

/**
 * @route   GET /api/v1/places/:placeId
 * @desc    Get place details
 * @access  Public
 */
router.get('/:placeId', placesController.getDetails);

/**
 * @route   POST /api/v1/places/image
 * @desc    Get place image from Wikipedia
 * @access  Public
 */
router.post('/image', placesController.getImage);

/**
 * @route   POST /api/v1/places/distance-matrix
 * @desc    Get distance matrix between points
 * @access  Public
 */
router.post('/distance-matrix', placesController.getDistanceMatrix);

/**
 * @route   POST /api/v1/places/cache/clear
 * @desc    Clear expired cache entries
 * @access  Private
 */
router.post('/cache/clear', authenticate, placesController.clearCache);

module.exports = router;

