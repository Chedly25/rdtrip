/**
 * Google Places API Service
 * Provides validated, real-world data for discovered places
 *
 * Key capabilities:
 * - Text search for places
 * - Detailed place information
 * - Photos with proper URLs
 * - Opening hours validation
 * - Distance matrix calculations
 * - Rate limiting and caching
 */

const axios = require('axios');

class GooglePlacesService {
  constructor(apiKey, db) {
    this.apiKey = apiKey;
    this.db = db;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    this.cache = new Map(); // In-memory cache

    if (!this.apiKey) {
      console.error('❌ GooglePlacesService: NO API KEY PROVIDED!');
      console.error('   apiKey parameter:', apiKey);
      console.error('   process.env.GOOGLE_PLACES_API_KEY:', process.env.GOOGLE_PLACES_API_KEY ? 'SET' : 'NOT SET');
    } else {
      console.log(`✓ GooglePlacesService initialized with API key: ${this.apiKey.substring(0, 10)}...`);
    }
  }

  /**
   * Search for a place by text query
   * Returns the most relevant match
   */
  async textSearch(query, location = null) {
    const cacheKey = `search_${query}_${location?.lat}_${location?.lng}`;

    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      console.log(`✓ Cache hit: ${query}`);
      return cached;
    }

    try {
      const params = {
        query,
        key: this.apiKey
        // NOTE: textsearch endpoint does NOT support 'fields' parameter
        // It returns all basic fields by default
      };

      if (location) {
        params.location = `${location.lat},${location.lng}`;
        params.radius = 5000; // 5km radius
      }

      const maskedKey = this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'UNDEFINED';
      console.log(`🌍 Calling Google Places API: ${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${maskedKey}`);

      const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params,
        timeout: 10000
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${response.data.status}`);
      }

      const results = response.data.results || [];

      // Cache the results
      await this.saveToCache(cacheKey, results);

      return results;

    } catch (error) {
      console.error(`Google Places text search failed for "${query}":`, error.message);
      console.error(`Full error:`, error.response?.data || error.stack);
      return [];
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId) {
    const cacheKey = `details_${placeId}`;

    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      console.log(`✓ Cache hit: place details ${placeId}`);
      return cached;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: 'place_id,name,formatted_address,formatted_phone_number,international_phone_number,geometry,rating,user_ratings_total,price_level,opening_hours,current_opening_hours,photos,types,website,url,reviews,editorial_summary,business_status'
        },
        timeout: 10000
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Place details error: ${response.data.status}`);
      }

      const result = response.data.result;

      // Cache the result
      await this.saveToCache(cacheKey, result);

      return result;

    } catch (error) {
      console.error(`Failed to get place details for ${placeId}:`, error.message);
      return null;
    }
  }

  /**
   * Get photo URL from photo reference
   */
  getPhotoUrl(photoReference, maxWidth = 800, maxHeight = 600) {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&maxheight=${maxHeight}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  /**
   * Extract photo URLs from place data
   */
  extractPhotos(place, count = 5) {
    if (!place.photos || place.photos.length === 0) {
      return [];
    }

    return place.photos.slice(0, count).map(photo => ({
      reference: photo.photo_reference,
      width: photo.width,
      height: photo.height,
      url: this.getPhotoUrl(photo.photo_reference, 800),
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
   * Validate if a place is open at a specific time
   */
  isOpenAt(openingHours, dayOfWeek, timeString) {
    if (!openingHours.available || !openingHours.weekdayText || openingHours.weekdayText.length === 0) {
      return { available: 'unknown', confidence: 0.3 };
    }

    try {
      const daySchedule = openingHours.weekdayText[dayOfWeek];

      // Handle "Closed" day
      if (daySchedule.toLowerCase().includes('closed')) {
        return { available: false, reason: 'Closed on this day', confidence: 0.95 };
      }

      // Handle "Open 24 hours"
      if (daySchedule.toLowerCase().includes('open 24 hours') ||
          daySchedule.toLowerCase().includes('24 hours')) {
        return { available: true, reason: 'Open 24 hours', confidence: 1.0 };
      }

      // Parse time range (e.g., "Monday: 9:00 AM – 6:00 PM")
      const timeMatch = daySchedule.match(/(\d+:\d+\s*[AP]M)\s*[–-]\s*(\d+:\d+\s*[AP]M)/i);

      if (!timeMatch) {
        return { available: 'unknown', reason: 'Could not parse hours', confidence: 0.2 };
      }

      const [_, openTime, closeTime] = timeMatch;
      const open24h = this.to24Hour(openTime);
      const close24h = this.to24Hour(closeTime);

      const isOpen = timeString >= open24h && timeString <= close24h;

      return {
        available: isOpen,
        reason: isOpen ? `Open ${open24h} - ${close24h}` : `Closed at ${timeString} (Opens ${open24h})`,
        confidence: 0.9,
        openTime: open24h,
        closeTime: close24h
      };

    } catch (error) {
      return { available: 'unknown', reason: error.message, confidence: 0.1 };
    }
  }

  /**
   * Convert 12-hour time to 24-hour format
   */
  to24Hour(time12h) {
    const cleaned = time12h.trim().replace(/\s+/g, ' ');
    const [time, period] = cleaned.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Get distance matrix between multiple points
   */
  async getDistanceMatrix(origins, destinations, mode = 'walking') {
    try {
      const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: originsStr,
          destinations: destinationsStr,
          mode,
          units: 'metric',
          key: this.apiKey
        },
        timeout: 15000
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Distance Matrix error: ${response.data.status}`);
      }

      return this.parseDistanceMatrix(response.data);

    } catch (error) {
      console.error('Distance matrix failed:', error.message);
      return null;
    }
  }

  /**
   * Parse distance matrix response into usable format
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
   * Cache management - Check database cache
   */
  async getFromCache(key) {
    // Check memory cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
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
        // Store in memory cache
        this.cache.set(key, data);
        return data;
      }
    } catch (error) {
      console.warn('Cache lookup failed:', error.message);
    }

    return null;
  }

  /**
   * Save to cache (database + memory)
   */
  async saveToCache(key, data, ttlDays = 7) {
    // Save to memory
    this.cache.set(key, data);

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
      console.warn('Cache save failed:', error.message);
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
      console.log(`Cleared ${result.rowCount} expired cache entries`);
    } catch (error) {
      console.error('Failed to clear cache:', error.message);
    }
  }
}

module.exports = GooglePlacesService;
