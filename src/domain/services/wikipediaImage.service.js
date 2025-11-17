/**
 * Wikipedia Image Service
 * Fetches and caches images from Wikipedia for travel entities
 */
const BaseService = require('./BaseService');

class WikipediaImageService extends BaseService {
  constructor(wikipediaClient, dbPool) {
    super('WikipediaImage');
    this.client = wikipediaClient;
    this.db = dbPool;
    this.memoryCache = new Map();
  }

  /**
   * Get image for any entity (activity, restaurant, accommodation, etc.)
   */
  async getEntityImage(entity, city, entityType = 'activity') {
    this.logAction('Get entity image', { entity: entity.name, city, entityType });

    const cacheKey = `${entityType}_${entity.name}_${city}`;

    // Check memory cache
    if (this.memoryCache.has(cacheKey)) {
      this.logger.debug('Memory cache hit for image');
      return this.memoryCache.get(cacheKey);
    }

    // Check database cache
    const dbResult = await this.getFromDatabase(entityType, entity.name, city);
    if (dbResult) {
      this.memoryCache.set(cacheKey, dbResult);
      this.logger.debug('Database cache hit for image');
      return dbResult;
    }

    // Fetch new image using fallback strategy
    const imageUrl = await this.fetchImageWithFallbacks(entity, city);

    // Cache in database
    await this.saveToDatabase(entityType, entity.name, city, imageUrl, 'wikipedia');

    this.memoryCache.set(cacheKey, imageUrl);
    return imageUrl;
  }

  /**
   * Fetch image with intelligent fallback chain
   */
  async fetchImageWithFallbacks(entity, city) {
    this.logAction('Fetch image with fallbacks', { entity: entity.name, city });

    try {
      // Strategy 1: Try exact entity name
      let imageUrl = await this.fetchWikipediaImage(entity.name);
      if (imageUrl) return imageUrl;

      // Strategy 2: Try entity name + city
      imageUrl = await this.fetchWikipediaImage(`${entity.name} ${city}`);
      if (imageUrl) return imageUrl;

      // Strategy 3: If entity has address, extract landmark
      if (entity.address) {
        const landmark = this.extractLandmark(entity.address);
        if (landmark) {
          imageUrl = await this.fetchWikipediaImage(landmark);
          if (imageUrl) return imageUrl;

          imageUrl = await this.fetchWikipediaImage(`${landmark} ${city}`);
          if (imageUrl) return imageUrl;
        }
      }

      // Strategy 4: For restaurants, try cuisine type
      if (entity.cuisine) {
        imageUrl = await this.fetchWikipediaImage(`${entity.cuisine} cuisine`);
        if (imageUrl) return imageUrl;
      }

      // Strategy 5: For activities/museums, try category
      if (entity.category) {
        imageUrl = await this.fetchWikipediaImage(`${entity.category} ${city}`);
        if (imageUrl) return imageUrl;
      }

      // Strategy 6: Try description keywords
      if (entity.description) {
        const keywords = this.extractKeywords(entity.description);
        if (keywords) {
          imageUrl = await this.fetchWikipediaImage(`${keywords} ${city}`);
          if (imageUrl) return imageUrl;
        }
      }

      // Strategy 7: Try city panorama
      imageUrl = await this.fetchWikipediaImage(`${city} panorama`);
      if (imageUrl) return imageUrl;

      // Strategy 8: Try city tourism
      imageUrl = await this.fetchWikipediaImage(`${city} tourism`);
      if (imageUrl) return imageUrl;

      // Strategy 9: Try just city
      imageUrl = await this.fetchWikipediaImage(city);
      if (imageUrl) return imageUrl;

      this.logger.warn('No image found after all fallback attempts');
      return null; // Will use gradient on frontend

    } catch (error) {
      this.logger.error('Image fetch failed', { error: error.message });
      return null;
    }
  }

  /**
   * Fetch image from Wikipedia API
   */
  async fetchWikipediaImage(searchTerm, width = 800) {
    try {
      // Try Wikipedia page summary first (fastest)
      const summary = await this.client.getPageSummary(searchTerm);
      
      if (summary?.originalimage?.source) {
        this.logger.debug(`Found Wikipedia original image for "${searchTerm}"`);
        return summary.originalimage.source;
      }

      if (summary?.thumbnail?.source) {
        const imageUrl = summary.thumbnail.source.replace(/\/\d+px-/, `/${width}px-`);
        this.logger.debug(`Found Wikipedia thumbnail for "${searchTerm}"`);
        return imageUrl;
      }

      // Fallback: Try Wikimedia Commons search
      const commonsPages = await this.client.searchCommonsImages(searchTerm, 3, width);
      
      if (commonsPages) {
        const firstPage = Object.values(commonsPages)[0];
        if (firstPage?.imageinfo?.[0]?.thumburl) {
          this.logger.debug(`Found Wikimedia Commons image for "${searchTerm}"`);
          return firstPage.imageinfo[0].thumburl;
        }
      }

      return null;

    } catch (error) {
      this.logger.debug(`Wikipedia image fetch failed for "${searchTerm}": ${error.message}`);
      return null;
    }
  }

  /**
   * Extract key visual keywords from description
   */
  extractKeywords(description) {
    if (!description) return null;

    const visualKeywords = [
      'cathedral', 'church', 'basilica', 'museum', 'palace', 'castle',
      'monument', 'fountain', 'square', 'plaza', 'park', 'garden',
      'theater', 'opera', 'market', 'tower', 'bridge', 'gate',
      'abbey', 'temple', 'sanctuary', 'fort', 'fortress', 'arena'
    ];

    const lowerDesc = description.toLowerCase();
    for (const keyword of visualKeywords) {
      if (lowerDesc.includes(keyword)) {
        return keyword;
      }
    }
    return null;
  }

  /**
   * Extract landmark name from address
   */
  extractLandmark(address) {
    if (!address) return null;

    // Take first part before comma or number
    const match = address.match(/^([^,\d]+)/);
    if (match && match[1].length > 5) {
      return match[1].trim();
    }
    return null;
  }

  /**
   * Get image from database cache
   */
  async getFromDatabase(entityType, entityName, city) {
    try {
      const result = await this.db.query(
        `SELECT image_url FROM scraped_images
         WHERE entity_type = $1 AND entity_name = $2 AND city = $3
         AND expires_at > NOW()
         LIMIT 1`,
        [entityType, entityName, city]
      );

      if (result.rows.length > 0) {
        return result.rows[0].image_url;
      }
    } catch (error) {
      this.logger.warn('Database cache lookup failed', { error: error.message });
    }
    return null;
  }

  /**
   * Save image to database cache
   */
  async saveToDatabase(entityType, entityName, city, imageUrl, sourceType = 'wikipedia') {
    try {
      await this.db.query(
        `INSERT INTO scraped_images (entity_type, entity_name, city, image_url, source_type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (entity_type, entity_name, city)
         DO UPDATE SET
           image_url = $4,
           source_type = $5,
           scraped_at = NOW(),
           expires_at = NOW() + INTERVAL '90 days'`,
        [entityType, entityName, city, imageUrl, sourceType]
      );
    } catch (error) {
      this.logger.warn('Failed to cache image in database', { error: error.message });
    }
  }

  /**
   * Batch enrich entities with images
   */
  async enrichEntitiesWithImages(itinerary) {
    this.logAction('Batch enrich itinerary with images');

    const tasks = [];

    // Enrich activities (landmarks, museums - have Wikipedia pages)
    if (itinerary.activities) {
      for (const activitySet of itinerary.activities) {
        const city = activitySet.city;
        for (const activity of activitySet.activities || []) {
          tasks.push(
            this.getEntityImage(activity, city, 'activity')
              .then(url => { activity.imageUrl = url; })
              .catch(err => this.logger.warn('Failed to enrich activity image', { error: err.message }))
          );
        }
      }
    }

    // Enrich scenic stops
    if (itinerary.scenicStops) {
      for (const segment of itinerary.scenicStops) {
        for (const stop of segment.stops || []) {
          const cityMatch = segment.segment.match(/→\s*([^→]+)$/);
          const city = cityMatch ? cityMatch[1].trim() : '';
          tasks.push(
            this.getEntityImage(stop, city, 'landmark')
              .then(url => { stop.imageUrl = url; })
              .catch(err => this.logger.warn('Failed to enrich stop image', { error: err.message }))
          );
        }
      }
    }

    // Run all enrichment tasks in parallel (limit concurrency)
    await this.runInBatches(tasks, 10);

    this.logger.info(`Enriched ${tasks.length} entities with images`);
    return itinerary;
  }

  /**
   * Run promises in batches to limit concurrency
   */
  async runInBatches(promises, batchSize) {
    for (let i = 0; i < promises.length; i += batchSize) {
      const batch = promises.slice(i, i + batchSize);
      await Promise.allSettled(batch);
    }
  }

  /**
   * Clear old cache entries
   */
  async clearExpiredCache() {
    try {
      const result = await this.db.query(
        'DELETE FROM scraped_images WHERE expires_at < NOW()'
      );
      this.logger.info(`Cleared ${result.rowCount} expired image cache entries`);
      return result.rowCount;
    } catch (error) {
      this.handleError(error, 'clearExpiredCache');
    }
  }
}

module.exports = WikipediaImageService;

