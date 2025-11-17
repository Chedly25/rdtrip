/**
 * Geocoding Service
 * Location search and coordinate conversion using Mapbox
 */
const BaseService = require('./BaseService');

class GeocodingService extends BaseService {
  constructor(mapboxClient, dbPool) {
    super('Geocoding');
    this.client = mapboxClient;
    this.db = dbPool;
    this.memoryCache = new Map();
  }

  /**
   * Search for locations (forward geocoding)
   */
  async searchLocation(query, options = {}) {
    this.logAction('Search location', { query });

    const cacheKey = `geocode_${query}_${JSON.stringify(options)}`;

    // Check cache
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for location search');
      return cached;
    }

    try {
      const features = await this.client.geocode(query, options);

      const results = features.map(feature => ({
        name: feature.place_name,
        coordinates: {
          lng: feature.center[0],
          lat: feature.center[1]
        },
        type: feature.place_type?.[0] || 'place',
        relevance: feature.relevance,
        context: this.extractContext(feature),
        bbox: feature.bbox,
        properties: feature.properties
      }));

      // Cache results
      await this.saveToCache(cacheKey, results);

      this.logger.info(`Found ${results.length} locations for "${query}"`);
      return results;

    } catch (error) {
      this.handleError(error, `searchLocation: ${query}`);
    }
  }

  /**
   * Get coordinates for a place name
   */
  async getCoordinates(placeName) {
    this.logAction('Get coordinates', { placeName });

    const results = await this.searchLocation(placeName, { limit: 1 });

    if (results.length === 0) {
      throw new Error(`No coordinates found for "${placeName}"`);
    }

    return results[0].coordinates;
  }

  /**
   * Reverse geocode (coordinates to address)
   */
  async reverseGeocode(longitude, latitude, options = {}) {
    this.logAction('Reverse geocode', { longitude, latitude });

    const cacheKey = `reverse_${longitude}_${latitude}_${JSON.stringify(options)}`;

    // Check cache
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for reverse geocode');
      return cached;
    }

    try {
      const features = await this.client.reverseGeocode(longitude, latitude, options);

      if (features.length === 0) {
        return null;
      }

      const result = {
        address: features[0].place_name,
        coordinates: {
          lng: features[0].center[0],
          lat: features[0].center[1]
        },
        type: features[0].place_type?.[0] || 'place',
        context: this.extractContext(features[0]),
        properties: features[0].properties
      };

      // Cache result
      await this.saveToCache(cacheKey, result);

      this.logger.info(`Reverse geocoded to: ${result.address}`);
      return result;

    } catch (error) {
      this.handleError(error, `reverseGeocode: ${longitude}, ${latitude}`);
    }
  }

  /**
   * Get route directions between points
   */
  async getDirections(waypoints, profile = 'driving', options = {}) {
    this.logAction('Get directions', { waypoints: waypoints.length, profile });

    // Convert waypoints to [lng, lat] format
    const coordinates = waypoints.map(wp => {
      if (Array.isArray(wp)) return wp;
      if (wp.lng !== undefined && wp.lat !== undefined) return [wp.lng, wp.lat];
      throw new Error('Invalid waypoint format');
    });

    try {
      const response = await this.client.getDirections(coordinates, profile, options);

      if (!response.routes || response.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = response.routes[0];

      const result = {
        distance: route.distance, // meters
        duration: route.duration, // seconds
        geometry: route.geometry,
        legs: route.legs?.map(leg => ({
          distance: leg.distance,
          duration: leg.duration,
          steps: leg.steps?.map(step => ({
            distance: step.distance,
            duration: step.duration,
            instruction: step.maneuver?.instruction,
            type: step.maneuver?.type,
            coordinates: step.maneuver?.location
          }))
        })),
        waypoints: response.waypoints?.map(wp => ({
          name: wp.name,
          coordinates: wp.location
        }))
      };

      this.logger.info(`Route calculated: ${(result.distance / 1000).toFixed(1)} km, ${(result.duration / 60).toFixed(0)} min`);
      return result;

    } catch (error) {
      this.handleError(error, 'getDirections');
    }
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(point1, point2, profile = 'driving') {
    this.logAction('Calculate distance', { profile });

    const route = await this.getDirections([point1, point2], profile, {
      overview: 'simplified',
      steps: false
    });

    return {
      distance: route.distance,
      duration: route.duration,
      distanceKm: (route.distance / 1000).toFixed(1),
      durationMin: (route.duration / 60).toFixed(0),
      durationHours: (route.duration / 3600).toFixed(1)
    };
  }

  /**
   * Batch geocode multiple locations
   */
  async batchGeocode(placeNames) {
    this.logAction('Batch geocode', { count: placeNames.length });

    const results = await Promise.allSettled(
      placeNames.map(name => this.getCoordinates(name))
    );

    return results.map((result, index) => ({
      placeName: placeNames[index],
      success: result.status === 'fulfilled',
      coordinates: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }

  /**
   * Extract context information from Mapbox feature
   */
  extractContext(feature) {
    const context = {};

    if (feature.context) {
      for (const item of feature.context) {
        const type = item.id.split('.')[0];
        context[type] = item.text;
      }
    }

    return {
      place: context.place,
      region: context.region,
      postcode: context.postcode,
      country: context.country,
      ...context
    };
  }

  /**
   * Get from cache (memory + database)
   */
  async getFromCache(key) {
    // Check memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // Check database cache
    try {
      const result = await this.db.query(
        `SELECT data FROM geocoding_cache
         WHERE cache_key = $1
         AND expires_at > NOW()
         LIMIT 1`,
        [key]
      );

      if (result.rows.length > 0) {
        const data = result.rows[0].data;
        this.memoryCache.set(key, data);
        return data;
      }
    } catch (error) {
      this.logger.warn('Cache lookup failed', { error: error.message });
    }

    return null;
  }

  /**
   * Save to cache (memory + database)
   */
  async saveToCache(key, data, ttlDays = 30) {
    // Save to memory
    this.memoryCache.set(key, data);

    // Save to database
    try {
      await this.db.query(
        `INSERT INTO geocoding_cache (cache_key, data, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '${ttlDays} days')
         ON CONFLICT (cache_key)
         DO UPDATE SET
           data = $2,
           expires_at = NOW() + INTERVAL '${ttlDays} days',
           updated_at = NOW()`,
        [key, JSON.stringify(data)]
      );
    } catch (error) {
      this.logger.warn('Cache save failed', { error: error.message });
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    try {
      const result = await this.db.query(
        'DELETE FROM geocoding_cache WHERE expires_at < NOW()'
      );
      this.logger.info(`Cleared ${result.rowCount} expired geocoding cache entries`);
      return result.rowCount;
    } catch (error) {
      this.handleError(error, 'clearExpiredCache');
    }
  }
}

module.exports = GeocodingService;

