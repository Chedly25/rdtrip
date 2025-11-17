/**
 * Places Controller
 * Handle place search and discovery endpoints
 */
const BaseController = require('./BaseController');
const { ValidationError } = require('../../shared/errors');

class PlacesController extends BaseController {
  constructor(googlePlacesService, wikipediaImageService) {
    super('Places');
    this.googlePlacesService = googlePlacesService;
    this.wikipediaImageService = wikipediaImageService;
  }

  /**
   * Search for places by text query
   * POST /api/v1/places/search
   */
  search = this.asyncHandler(async (req, res) => {
    const { query, location } = req.body;

    if (!query) {
      throw new ValidationError('Query is required');
    }

    this.logger.info('Place search request', { query, hasLocation: !!location });

    const places = await this.googlePlacesService.searchPlaces(query, location);

    return this.success(res, places, `Found ${places.length} places`);
  });

  /**
   * Find nearby places
   * POST /api/v1/places/nearby
   */
  findNearby = this.asyncHandler(async (req, res) => {
    const { location, radius, type, keyword } = req.body;

    if (!location || !location.lat || !location.lng) {
      throw new ValidationError('Valid location with lat/lng is required');
    }

    this.logger.info('Nearby places request', { location, radius, type, keyword });

    const places = await this.googlePlacesService.findNearbyPlaces(
      location,
      radius || 1000,
      type,
      keyword
    );

    return this.success(res, places, `Found ${places.length} nearby places`);
  });

  /**
   * Get place details
   * GET /api/v1/places/:placeId
   */
  getDetails = this.asyncHandler(async (req, res) => {
    const { placeId } = req.params;

    if (!placeId) {
      throw new ValidationError('Place ID is required');
    }

    this.logger.info('Place details request', { placeId });

    const details = await this.googlePlacesService.getPlaceDetails(placeId);

    if (!details) {
      throw new NotFoundError('Place', placeId);
    }

    return this.success(res, details);
  });

  /**
   * Get place image
   * POST /api/v1/places/image
   */
  getImage = this.asyncHandler(async (req, res) => {
    const { entity, city, entityType } = req.body;

    if (!entity || !entity.name) {
      throw new ValidationError('Entity with name is required');
    }

    this.logger.info('Place image request', { entityName: entity.name, city });

    const imageUrl = await this.wikipediaImageService.getEntityImage(
      entity,
      city || '',
      entityType || 'activity'
    );

    return this.success(res, { imageUrl }, imageUrl ? 'Image found' : 'No image available');
  });

  /**
   * Get distance matrix
   * POST /api/v1/places/distance-matrix
   */
  getDistanceMatrix = this.asyncHandler(async (req, res) => {
    const { origins, destinations, mode } = req.body;

    if (!origins || !destinations || origins.length === 0 || destinations.length === 0) {
      throw new ValidationError('Origins and destinations are required');
    }

    this.logger.info('Distance matrix request', {
      origins: origins.length,
      destinations: destinations.length,
      mode: mode || 'walking'
    });

    const matrix = await this.googlePlacesService.getDistanceMatrix(
      origins,
      destinations,
      mode || 'walking'
    );

    return this.success(res, matrix);
  });

  /**
   * Clear expired cache
   * POST /api/v1/places/cache/clear
   */
  clearCache = this.asyncHandler(async (req, res) => {
    this.logger.info('Cache clear request');

    const placesCleared = await this.googlePlacesService.clearExpiredCache();
    const imagesCleared = await this.wikipediaImageService.clearExpiredCache();

    return this.success(res, {
      placesCleared,
      imagesCleared,
      totalCleared: placesCleared + imagesCleared
    }, 'Cache cleared successfully');
  });
}

module.exports = PlacesController;

