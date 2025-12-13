/**
 * Image Service for Planning Cards
 *
 * Unified service to fetch images for planning suggestions.
 *
 * COST OPTIMIZATION (€3 budget per user):
 * - Prioritize FREE sources: Wikipedia, Wikimedia Commons
 * - Google Places Photo costs $0.007 per request - USE SPARINGLY
 * - Aggressive caching to avoid repeat calls
 *
 * Priority chain (optimized for cost):
 * 1. Cache (database + memory)
 * 2. Wikipedia Search + Image (FREE)
 * 3. Wikimedia Commons (FREE, great for landmarks)
 * 4. Unsplash (FREE with limits)
 * 5. Google Places Photo (ONLY if skipGooglePlaces=false, costs $0.007)
 *
 * All images are cached in the database to avoid repeated API calls.
 */

const axios = require('axios');

// Track Google API calls for cost monitoring
let googleApiCallCount = 0;
let googleApiCallsBlocked = 0;

class ImageService {
  constructor(db, options = {}) {
    this.db = db;
    this.cache = new Map();
    this.googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_API_KEY;
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;

    // Cost control options
    this.skipGooglePlaces = options.skipGooglePlaces ?? true; // Default: skip Google to save costs
    this.maxGoogleCallsPerSession = options.maxGoogleCalls ?? 10; // Max 10 Google calls = $0.07

    // Common search term cleanups for better Wikipedia matching
    this.searchCleanups = [
      { pattern: /\s+\([^)]+\)$/g, replacement: '' }, // Remove parenthetical info
      { pattern: /^the\s+/i, replacement: '' }, // Remove leading "The"
      { pattern: /\s+museum$/i, replacement: '' }, // Try without "museum"
      { pattern: /\s+cathedral$/i, replacement: '' }, // Try without "cathedral"
    ];
  }

  /**
   * Get image URL for a planning card
   * Main entry point for the service
   */
  async getImageForCard(card, cityName) {
    const cacheKey = `card_${card.name}_${cityName}`;

    // Check memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check database cache
    const dbResult = await this.getFromDatabase(card.type, card.name, cityName);
    if (dbResult) {
      this.cache.set(cacheKey, dbResult);
      return dbResult;
    }

    // Fetch new image using fallback chain
    const imageUrl = await this.fetchImageWithFallbacks(card, cityName);

    // Cache in database
    if (imageUrl) {
      await this.saveToDatabase(card.type, card.name, cityName, imageUrl);
    }

    this.cache.set(cacheKey, imageUrl);
    return imageUrl;
  }

  /**
   * Batch enrich cards with images
   * More efficient than calling getImageForCard one by one
   */
  async enrichCardsWithImages(cards, cityName) {
    console.log(`[imageService] Enriching ${cards.length} cards with images for ${cityName}...`);

    const enrichedCards = await Promise.all(
      cards.map(async (card) => {
        try {
          const imageUrl = await this.getImageForCard(card, cityName);
          return { ...card, imageUrl: imageUrl || null };
        } catch (error) {
          console.warn(`[imageService] Failed to get image for ${card.name}:`, error.message);
          return { ...card, imageUrl: null };
        }
      })
    );

    const successCount = enrichedCards.filter(c => c.imageUrl).length;
    console.log(`[imageService] Successfully fetched ${successCount}/${cards.length} images`);

    return enrichedCards;
  }

  /**
   * Fetch image using priority fallback chain
   * COST OPTIMIZED: Free sources first, Google Places last
   */
  async fetchImageWithFallbacks(card, cityName) {
    console.log(`[imageService] Fetching image for "${card.name}" (${card.type}) in ${cityName}`);

    // ============================================
    // FREE SOURCES FIRST (cost = $0)
    // ============================================

    // Strategy 1: Smart Wikipedia search (FREE, handles disambiguated titles)
    const wikiImage = await this.smartWikipediaSearch(card.name, cityName);
    if (wikiImage) {
      console.log(`[imageService] Found FREE Wikipedia image for "${card.name}"`);
      return wikiImage;
    }

    // Strategy 2: Wikimedia Commons search (FREE, great for landmarks)
    const commonsImage = await this.fetchWikimediaCommonsImage(card.name, cityName);
    if (commonsImage) {
      console.log(`[imageService] Found FREE Wikimedia Commons image for "${card.name}"`);
      return commonsImage;
    }

    // Strategy 3: Unsplash category fallback (FREE with limits)
    const unsplashImage = await this.fetchUnsplashImage(card, cityName);
    if (unsplashImage) {
      console.log(`[imageService] Found FREE Unsplash image for "${card.name}"`);
      return unsplashImage;
    }

    // Strategy 4: City generic image from Wikipedia (FREE)
    const cityImage = await this.fetchWikipediaImage(cityName);
    if (cityImage) {
      console.log(`[imageService] Found FREE Wikipedia city image for ${cityName}`);
      return cityImage;
    }

    // ============================================
    // PAID SOURCE - GOOGLE PLACES (cost = $0.007 per call)
    // Only use if explicitly enabled
    // ============================================
    if (!this.skipGooglePlaces && this.googleApiKey) {
      googleApiCallCount++;
      console.log(`[imageService] Using PAID Google Places API (call #${googleApiCallCount})`);

      const googleImage = await this.fetchGooglePlacePhoto(card.name, cityName);
      if (googleImage) return googleImage;
    } else if (this.googleApiKey) {
      googleApiCallsBlocked++;
      console.log(`[imageService] Skipped Google Places to save costs (blocked: ${googleApiCallsBlocked})`);
    }

    console.log(`[imageService] No image found for "${card.name}" (tried all FREE sources)`);
    return null;
  }

  /**
   * Get Google API call statistics
   */
  static getGoogleApiStats() {
    return {
      callsMade: googleApiCallCount,
      callsBlocked: googleApiCallsBlocked,
      estimatedCost: `$${(googleApiCallCount * 0.007).toFixed(4)}`,
      estimatedSavings: `$${(googleApiCallsBlocked * 0.007).toFixed(4)}`,
    };
  }

  /**
   * Smart Wikipedia search - tries multiple strategies to find the right article
   */
  async smartWikipediaSearch(placeName, cityName) {
    // Build search variations from most specific to least
    const searchVariations = [
      `${placeName} ${cityName}`,           // "Cathedral of Our Lady Antwerp"
      placeName,                             // "Cathedral of Our Lady"
      `${placeName} (${cityName})`,          // "Cathedral of Our Lady (Antwerp)"
      this.simplifyName(placeName),          // Simplified version
      `${this.simplifyName(placeName)} ${cityName}`, // Simplified + city
    ];

    // Remove duplicates
    const uniqueSearches = [...new Set(searchVariations.filter(Boolean))];

    for (const searchTerm of uniqueSearches) {
      // First use Wikipedia's search API to find the actual article title
      const articleTitle = await this.findWikipediaArticle(searchTerm);
      if (articleTitle) {
        const imageUrl = await this.fetchWikipediaImageByTitle(articleTitle);
        if (imageUrl) {
          console.log(`[imageService] Found Wikipedia image for "${placeName}" via search "${searchTerm}"`);
          return imageUrl;
        }
      }
    }

    return null;
  }

  /**
   * Find Wikipedia article title using search API
   */
  async findWikipediaArticle(searchTerm) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?` +
        `action=opensearch` +
        `&search=${encodeURIComponent(searchTerm)}` +
        `&limit=5` +
        `&namespace=0` +
        `&format=json`;

      const response = await axios.get(searchUrl, { timeout: 5000 });

      // opensearch returns [searchTerm, [titles], [descriptions], [urls]]
      if (response.data && response.data[1] && response.data[1].length > 0) {
        // Return the first matching title
        return response.data[1][0];
      }
    } catch (error) {
      // Silently fail
    }
    return null;
  }

  /**
   * Fetch Wikipedia image by exact article title
   */
  async fetchWikipediaImageByTitle(title) {
    try {
      // Use the page images API to get the main image
      const imageUrl = `https://en.wikipedia.org/w/api.php?` +
        `action=query` +
        `&titles=${encodeURIComponent(title)}` +
        `&prop=pageimages` +
        `&pithumbsize=800` +
        `&format=json`;

      const response = await axios.get(imageUrl, { timeout: 5000 });

      const pages = response.data?.query?.pages;
      if (pages) {
        const pageData = Object.values(pages)[0];
        if (pageData?.thumbnail?.source) {
          return pageData.thumbnail.source;
        }
      }

      // Fallback: try the REST API for originalimage
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summaryResponse = await axios.get(summaryUrl, {
        headers: { Accept: 'application/json' },
        timeout: 5000
      });

      if (summaryResponse.data.originalimage?.source) {
        return summaryResponse.data.originalimage.source;
      }
      if (summaryResponse.data.thumbnail?.source) {
        // Upscale thumbnail
        return summaryResponse.data.thumbnail.source.replace(/\/\d+px-/, '/800px-');
      }
    } catch (error) {
      // Silently fail
    }
    return null;
  }

  /**
   * Simplify a place name for better search matching
   */
  simplifyName(name) {
    let simplified = name;
    for (const cleanup of this.searchCleanups) {
      simplified = simplified.replace(cleanup.pattern, cleanup.replacement);
    }
    return simplified.trim();
  }

  /**
   * Search Wikimedia Commons for images
   */
  async fetchWikimediaCommonsImage(placeName, cityName) {
    try {
      const searchTerm = `${placeName} ${cityName}`;
      const searchUrl = `https://commons.wikimedia.org/w/api.php?` +
        `action=query` +
        `&generator=search` +
        `&gsrsearch=${encodeURIComponent(searchTerm)}` +
        `&gsrlimit=5` +
        `&gsrnamespace=6` + // File namespace
        `&prop=imageinfo` +
        `&iiprop=url|extmetadata` +
        `&iiurlwidth=800` +
        `&format=json`;

      const response = await axios.get(searchUrl, { timeout: 5000 });

      const pages = response.data?.query?.pages;
      if (pages) {
        // Find the first image that's not an icon/logo
        for (const page of Object.values(pages)) {
          const imageInfo = page?.imageinfo?.[0];
          if (imageInfo?.thumburl) {
            // Skip very small images (likely icons)
            const width = imageInfo.width || 0;
            if (width >= 400) {
              console.log(`[imageService] Found Wikimedia Commons image for "${placeName}"`);
              return imageInfo.thumburl;
            }
          }
        }
      }
    } catch (error) {
      // Silently fail
    }
    return null;
  }

  /**
   * Search Google Places and get photo
   */
  async fetchGooglePlacePhoto(placeName, cityName) {
    if (!this.googleApiKey) {
      console.warn('[imageService] No Google API key configured');
      return null;
    }

    try {
      // First, find the place
      const searchQuery = `${placeName} ${cityName}`;
      const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?` +
        `input=${encodeURIComponent(searchQuery)}` +
        `&inputtype=textquery` +
        `&fields=place_id,photos` +
        `&key=${this.googleApiKey}`;

      const response = await axios.get(findPlaceUrl, { timeout: 5000 });

      if (response.data.candidates?.[0]?.photos?.[0]?.photo_reference) {
        const photoRef = response.data.candidates[0].photos[0].photo_reference;

        // Generate photo URL
        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?` +
          `maxwidth=800` +
          `&photoreference=${photoRef}` +
          `&key=${this.googleApiKey}`;

        console.log(`[imageService] Found Google Places photo for "${placeName}"`);
        return photoUrl;
      }
    } catch (error) {
      console.warn(`[imageService] Google Places API error for "${placeName}":`, error.message);
    }

    return null;
  }

  /**
   * Fetch image from Wikipedia
   */
  async fetchWikipediaImage(searchTerm, cityName = '') {
    try {
      const cleanTerm = searchTerm.trim().replace(/[()]/g, '');
      const fullSearch = cityName ? `${cleanTerm} ${cityName}` : cleanTerm;

      // Try Wikipedia REST API first
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(fullSearch)}`;
      const response = await axios.get(summaryUrl, {
        headers: { Accept: 'application/json' },
        timeout: 5000
      });

      if (response.data.originalimage?.source) {
        console.log(`[imageService] Found Wikipedia image for "${searchTerm}"`);
        return response.data.originalimage.source;
      }

      if (response.data.thumbnail?.source) {
        // Upscale thumbnail
        const imageUrl = response.data.thumbnail.source.replace(/\/\d+px-/, '/800px-');
        console.log(`[imageService] Found Wikipedia thumbnail for "${searchTerm}"`);
        return imageUrl;
      }

      // Try without city name if we added it
      if (cityName) {
        return await this.fetchWikipediaImage(searchTerm);
      }
    } catch (error) {
      // Silently fail and try next strategy
    }

    return null;
  }

  /**
   * Fetch image from Unsplash API
   */
  async fetchUnsplashImage(card, cityName) {
    if (!this.unsplashAccessKey) {
      // No Unsplash key - skip
      return null;
    }

    try {
      // Build search query based on card type
      const searchTerms = this.buildUnsplashSearchTerms(card, cityName);

      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: searchTerms,
          per_page: 1,
          orientation: 'landscape',
        },
        headers: {
          Authorization: `Client-ID ${this.unsplashAccessKey}`,
        },
        timeout: 5000,
      });

      if (response.data.results?.[0]?.urls?.regular) {
        console.log(`[imageService] Found Unsplash image for "${card.name}" (${searchTerms})`);
        return response.data.results[0].urls.regular;
      }
    } catch (error) {
      console.warn(`[imageService] Unsplash API error:`, error.message);
    }

    return null;
  }

  /**
   * Build Unsplash search terms based on card type
   */
  buildUnsplashSearchTerms(card, cityName) {
    const typeQueries = {
      restaurant: `${cityName} restaurant food dining`,
      bar: `${cityName} bar cocktails nightlife`,
      cafe: `${cityName} cafe coffee`,
      hotel: `${cityName} hotel luxury`,
      activity: `${cityName} ${card.tags?.[0] || 'tourism'}`,
      photo_spot: `${cityName} ${card.tags?.[0] || 'scenic view'}`,
      experience: `${cityName} ${card.tags?.[0] || 'local experience'}`,
    };

    return typeQueries[card.type] || `${cityName} travel`;
  }

  /**
   * Get image from database cache
   */
  async getFromDatabase(entityType, entityName, city) {
    if (!this.db) return null;

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
      // Table might not exist, silently fail
    }
    return null;
  }

  /**
   * Save image to database cache
   */
  async saveToDatabase(entityType, entityName, city, imageUrl) {
    if (!this.db || !imageUrl) return;

    try {
      await this.db.query(
        `INSERT INTO scraped_images (entity_type, entity_name, city, image_url, source_type)
         VALUES ($1, $2, $3, $4, 'planning_card')
         ON CONFLICT (entity_type, entity_name, city)
         DO UPDATE SET
           image_url = $4,
           source_type = 'planning_card',
           scraped_at = NOW(),
           expires_at = NOW() + INTERVAL '30 days'`,
        [entityType, entityName, city, imageUrl]
      );
    } catch (error) {
      // Table might not exist, silently fail
      console.warn('[imageService] Failed to cache image:', error.message);
    }
  }

  /**
   * Clear cache for a specific city (useful for refresh)
   */
  clearCacheForCity(cityName) {
    for (const key of this.cache.keys()) {
      if (key.includes(cityName)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance (will be initialized with db in routes)
let imageServiceInstance = null;

function getImageService(db) {
  if (!imageServiceInstance) {
    imageServiceInstance = new ImageService(db);
  }
  return imageServiceInstance;
}

module.exports = { ImageService, getImageService };
