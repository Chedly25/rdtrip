/**
 * Google Places Service
 * Business logic layer for Google Places API
 */
const BaseService = require('./BaseService');

class GooglePlacesService extends BaseService {
  constructor(googlePlacesClient, dbPool) {
    super('GooglePlaces');
    this.client = googlePlacesClient;
    this.db = dbPool;
    this.memoryCache = new Map();
  }

  /**
   * Search for places by text query
   */
  async searchPlaces(query, location = null) {
    this.logAction('Search places', { query, location: location ? 'provided' : 'none' });

    const cacheKey = `search_${query}_${location?.lat}_${location?.lng}`;

    // Check cache
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for place search');
      return cached;
    }

    try {
      // Call client
      const results = await this.client.textSearch(query, location);

      // Cache results
      await this.saveToCache(cacheKey, results);

      this.logger.info(`Found ${results.length} places for "${query}"`);
      return results;

    } catch (error) {
      this.handleError(error, `searchPlaces: ${query}`);
    }
  }

  /**
   * Find nearby places
   */
  async findNearbyPlaces(location, radius = 1000, type = null, keyword = null) {
    this.validateRequired({ location }, ['location']);

    if (!location.lat || !location.lng) {
      throw new Error('Invalid location coordinates');
    }

    this.logAction('Find nearby places', { type, keyword, radius });

    const cacheKey = `nearby_${location.lat}_${location.lng}_${radius}_${type}_${keyword}`;

    // Check cache
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for nearby search');
      return cached;
    }

    try {
      const results = await this.client.nearbySearch(location, radius, type, keyword);

      // Process and enrich results
      const enriched = results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address,
        location: place.geometry?.location,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        priceLevel: place.price_level,
        types: place.types,
        openingHours: place.opening_hours,
        photos: place.photos?.slice(0, 5).map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height,
          url: this.client.getPhotoUrl(photo.photo_reference)
        }))
      }));

      // Cache results
      await this.saveToCache(cacheKey, enriched);

      this.logger.info(`Found ${enriched.length} nearby places`);
      return enriched;

    } catch (error) {
      this.handleError(error, `findNearbyPlaces: ${type || keyword}`);
    }
  }

  /**
   * Get detailed information about a place
   */
  async getPlaceDetails(placeId) {
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    this.logAction('Get place details', { placeId });

    const cacheKey = `details_${placeId}`;

    // Check cache
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug('Cache hit for place details');
      return cached;
    }

    try {
      const details = await this.client.getDetails(placeId);

      // Enrich with additional data
      const enriched = {
        ...details,
        photos: this.extractPhotos(details),
        openingHours: this.parseOpeningHours(details)
      };

      // Cache for longer (place details don't change often)
      await this.saveToCache(cacheKey, enriched, 30); // 30 days

      this.logger.info(`Retrieved details for ${details.name}`);
      return enriched;

    } catch (error) {
      this.handleError(error, `getPlaceDetails: ${placeId}`);
    }
  }

  /**
   * Extract and format photos from place data
   */
  extractPhotos(place, count = 5) {
    if (!place.photos || place.photos.length === 0) {
      return [];
    }

    return place.photos.slice(0, count).map(photo => ({
      reference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
      url: this.client.getPhotoUrl(photo.photo_reference, 800),
      attributions: photo.html_attributions || []
    }));
  }

  /**
   * Parse opening hours into structured format
   */
  parseOpeningHours(place) {
    if (!place.opening_hours && !place.current_opening_hours) {
      return {
        available: false,
        weekdayText: [],
        isOpenNow: null
      };
    }

    const hours = place.current_opening_hours || place.opening_hours;

    return {
      available: true,
      weekdayText: hours.weekday_text || [],
      isOpenNow: hours.open_now !== undefined ? hours.open_now : null,
      periods: hours.periods || []
    };
  }

  /**
   * Get distance matrix between points
   */
  async getDistanceMatrix(origins, destinations, mode = 'walking') {
    this.logAction('Get distance matrix', { 
      origins: origins.length, 
      destinations: destinations.length, 
      mode 
    });

    try {
      const data = await this.client.getDistanceMatrix(origins, destinations, mode);
      return this.parseDistanceMatrix(data);
    } catch (error) {
      this.handleError(error, 'getDistanceMatrix');
    }
  }

  /**
   * Parse distance matrix into usable format
   */
  parseDistanceMatrix(data) {
    const matrix = {};

    data.rows.forEach((row, originIndex) => {
      matrix[originIndex] = {};

      row.elements.forEach((element, destIndex) => {
        if (element.status === 'OK') {
          matrix[originIndex][destIndex] = {
            distanceMeters: element.distance.value,
            distanceText: element.distance.text,
            durationSeconds: element.duration.value,
            durationText: element.duration.text
          };
        } else {
          matrix[originIndex][destIndex] = null;
        }
      });
    });

    return matrix;
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
        `SELECT data FROM google_places_cache
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
  async saveToCache(key, data, ttlDays = 7) {
    // Save to memory
    this.memoryCache.set(key, data);

    // Save to database
    try {
      await this.db.query(
        `INSERT INTO google_places_cache (cache_key, data, expires_at)
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
        'DELETE FROM google_places_cache WHERE expires_at < NOW()'
      );
      this.logger.info(`Cleared ${result.rowCount} expired cache entries`);
      return result.rowCount;
    } catch (error) {
      this.handleError(error, 'clearExpiredCache');
    }
  }
}

module.exports = GooglePlacesService;

