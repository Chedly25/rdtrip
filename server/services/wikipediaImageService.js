/**
 * Wikipedia Image Service
 * Fetches and caches images from Wikipedia for travel entities
 */

const axios = require('axios');

class WikipediaImageService {
  constructor(db) {
    this.db = db;
    this.cache = new Map();
  }

  /**
   * Get image for any entity (activity, restaurant, accommodation, etc.)
   * Uses multi-level fallback strategy
   */
  async getEntityImage(entity, city, entityType = 'activity') {
    const cacheKey = `${entityType}_${entity.name}_${city}`;

    // Check memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check database cache
    const dbResult = await this.getFromDatabase(entityType, entity.name, city);
    if (dbResult) {
      this.cache.set(cacheKey, dbResult);
      return dbResult;
    }

    // Fetch new image using fallback strategy
    const imageUrl = await this.fetchImageWithFallbacks(entity, city);

    // Cache in database
    await this.saveToDatabase(entityType, entity.name, city, imageUrl, 'wikipedia');

    this.cache.set(cacheKey, imageUrl);
    return imageUrl;
  }

  /**
   * Fetch image with intelligent fallback chain
   */
  async fetchImageWithFallbacks(entity, city) {
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
      }
    }

    // Strategy 4: Try city panorama
    imageUrl = await this.fetchWikipediaImage(`${city} panorama`);
    if (imageUrl) return imageUrl;

    // Strategy 5: Try city view
    imageUrl = await this.fetchWikipediaImage(`${city} view`);
    if (imageUrl) return imageUrl;

    // Strategy 6: Try just city
    imageUrl = await this.fetchWikipediaImage(city);
    if (imageUrl) return imageUrl;

    return null; // Will use gradient on frontend
  }

  /**
   * Fetch image from Wikipedia API
   */
  async fetchWikipediaImage(searchTerm, width = 800) {
    try {
      const cleanTerm = searchTerm.trim().replace(/[()]/g, '');

      // Try Wikipedia page summary first (fastest)
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm)}`;
      const response = await axios.get(summaryUrl, {
        headers: { Accept: 'application/json' },
        timeout: 5000
      });

      if (response.data.originalimage?.source) {
        console.log(`✓ Found Wikipedia image for "${searchTerm}"`);
        return response.data.originalimage.source;
      }

      if (response.data.thumbnail?.source) {
        const imageUrl = response.data.thumbnail.source.replace(/\/\d+px-/, `/${width}px-`);
        console.log(`✓ Found Wikipedia thumbnail for "${searchTerm}"`);
        return imageUrl;
      }

      // Fallback: Try Wikimedia Commons search
      return await this.searchWikimediaCommons(searchTerm, width);

    } catch (error) {
      // Silently fail - we'll try next fallback
      return null;
    }
  }

  /**
   * Search Wikimedia Commons for images
   */
  async searchWikimediaCommons(searchTerm, width = 800) {
    try {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: searchTerm,
        gsrlimit: '3',
        prop: 'imageinfo',
        iiprop: 'url',
        iiurlwidth: width.toString(),
        origin: '*'
      });

      const response = await axios.get(
        `https://commons.wikimedia.org/w/api.php?${params}`,
        { timeout: 5000 }
      );

      const pages = response.data.query?.pages;
      if (pages) {
        const firstPage = Object.values(pages)[0];
        if (firstPage?.imageinfo?.[0]?.thumburl) {
          console.log(`✓ Found Wikimedia Commons image for "${searchTerm}"`);
          return firstPage.imageinfo[0].thumburl;
        }
      }
    } catch (error) {
      // Silently fail
    }
    return null;
  }

  /**
   * Extract landmark name from address
   * e.g., "Place Saint-Jean de Malte, 13100 Aix-en-Provence" → "Place Saint-Jean de Malte"
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
      console.warn('Database cache lookup failed:', error.message);
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
      console.warn('Failed to cache image in database:', error.message);
    }
  }

  /**
   * Batch enrich entities with images (run after agents complete)
   */
  async enrichEntitiesWithImages(itinerary) {
    console.log('🖼️  Enriching itinerary with Wikipedia images...');

    const tasks = [];

    // Enrich activities
    if (itinerary.activities) {
      for (const activitySet of itinerary.activities) {
        const city = activitySet.city;
        for (const activity of activitySet.activities || []) {
          tasks.push(
            this.getEntityImage(activity, city, 'activity')
              .then(url => { activity.imageUrl = url; })
          );
        }
      }
    }

    // Enrich restaurants
    if (itinerary.restaurants) {
      for (const dayRestaurants of itinerary.restaurants) {
        const city = dayRestaurants.city;
        const meals = dayRestaurants.meals || {};
        for (const restaurant of Object.values(meals)) {
          if (restaurant && restaurant.name) {
            tasks.push(
              this.getEntityImage(restaurant, city, 'restaurant')
                .then(url => { restaurant.imageUrl = url; })
            );
          }
        }
      }
    }

    // Enrich accommodations
    if (itinerary.accommodations) {
      for (const accommodation of itinerary.accommodations) {
        const city = accommodation.city;
        tasks.push(
          this.getEntityImage(accommodation, city, 'hotel')
            .then(url => { accommodation.imageUrl = url; })
        );
      }
    }

    // Enrich scenic stops
    if (itinerary.scenicStops) {
      for (const segment of itinerary.scenicStops) {
        for (const stop of segment.stops || []) {
          // Extract city from segment name
          const cityMatch = segment.segment.match(/→\s*([^→]+)$/);
          const city = cityMatch ? cityMatch[1].trim() : '';
          tasks.push(
            this.getEntityImage(stop, city, 'landmark')
              .then(url => { stop.imageUrl = url; })
          );
        }
      }
    }

    // Run all enrichment tasks in parallel (limit concurrency)
    await this.runInBatches(tasks, 10);

    console.log(`✓ Enriched ${tasks.length} entities with images`);
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
}

module.exports = WikipediaImageService;
