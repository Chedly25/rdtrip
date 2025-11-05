/**
 * Google Places Discovery Agent
 * PRIMARY discovery mechanism using Google Places API
 *
 * This replaces Perplexity as the main discovery source.
 * Google Places provides:
 * - Real, validated places
 * - Photos (high quality)
 * - Ratings & reviews
 * - Opening hours
 * - Real-time availability
 * - Accurate coordinates
 *
 * Perplexity is now used ONLY for strategic enrichment (tips, context, hidden gems)
 */

const GooglePlacesService = require('../../services/googlePlacesService');
const GooglePlacesPhotoService = require('../../services/GooglePlacesPhotoService');

class GooglePlacesDiscoveryAgent {
  constructor(googlePlacesService, photoService) {
    this.placesService = googlePlacesService || null;
    this.photoService = photoService || null;

    if (!this.placesService) {
      console.warn('⚠️  GooglePlacesDiscoveryAgent: No Google Places service provided');
    }
  }

  /**
   * Discover activities for a city using Google Places
   * @param {Object} request - Discovery request
   * @returns {Object} Discovery result with candidates
   */
  async discoverActivities(request) {
    const { city, category, timeWindow, preferences, date } = request;

    console.log(`\n🔍 GooglePlacesDiscoveryAgent: Discovering ${category} in ${city.name}`);
    console.log(`   Time window: ${timeWindow.start} - ${timeWindow.end}`);

    try {
      // 1. Map category to Google Places types
      const googleTypes = this.mapCategoryToGoogleTypes(category, preferences);
      console.log(`   Google types: ${googleTypes.join(', ')}`);

      // 2. Search for places
      const candidates = await this.searchPlaces(city, googleTypes, preferences);

      // 3. Enrich with details and photos
      const enriched = await this.enrichCandidates(candidates, city, timeWindow, date);

      // 4. Filter by time window and preferences
      const filtered = this.filterAndRank(enriched, timeWindow, preferences);

      console.log(`   ✅ Found ${filtered.length} candidates`);

      return {
        success: true,
        candidates: filtered,
        source: 'google_places',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`   ❌ Discovery failed:`, error.message);
      return {
        success: false,
        candidates: [],
        error: error.message,
        source: 'google_places'
      };
    }
  }

  /**
   * Search for places using Google Places Nearby Search
   */
  async searchPlaces(city, types, preferences) {
    if (!this.placesService) {
      throw new Error('Google Places service not available');
    }

    const allCandidates = [];

    // Search for each type
    for (const type of types) {
      try {
        const results = await this.placesService.nearbySearch({
          location: city.coordinates,
          radius: this.getSearchRadius(preferences),
          type: type,
          rankby: 'prominence'
        });

        allCandidates.push(...results.slice(0, 5)); // Top 5 per type

      } catch (error) {
        console.warn(`   ⚠️  Search failed for type "${type}":`, error.message);
      }
    }

    // Remove duplicates by place_id
    const unique = [];
    const seenIds = new Set();

    for (const place of allCandidates) {
      if (!seenIds.has(place.place_id)) {
        seenIds.add(place.place_id);
        unique.push(place);
      }
    }

    console.log(`   Found ${unique.length} unique places`);
    return unique.slice(0, 10); // Return top 10
  }

  /**
   * Enrich candidates with full details and photos
   */
  async enrichCandidates(candidates, city, timeWindow, date) {
    const enriched = [];

    for (const place of candidates) {
      try {
        // Get full place details
        const details = await this.placesService.getDetails(place.place_id, {
          fields: [
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'user_ratings_total',
            'price_level',
            'opening_hours',
            'photos',
            'types',
            'website',
            'formatted_phone_number',
            'reviews'
          ]
        });

        if (!details) {
          console.warn(`   ⚠️  No details for ${place.name}`);
          continue;
        }

        // Enrich with photos
        const withPhotos = this.photoService
          ? this.photoService.enrichPlaceWithPhotos(details)
          : details;

        // Convert to our activity format
        const activity = this.convertToActivityFormat(withPhotos, city, timeWindow);

        enriched.push(activity);

      } catch (error) {
        console.warn(`   ⚠️  Failed to enrich ${place.name}:`, error.message);
      }
    }

    return enriched;
  }

  /**
   * Convert Google Place to our activity format
   */
  convertToActivityFormat(place, city, timeWindow) {
    return {
      name: place.name,
      type: this.inferActivityType(place.types),
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng
      },

      // Google Places data
      place_id: place.place_id,
      rating: place.rating,
      ratingCount: place.user_ratings_total,
      priceLevel: place.price_level,
      openingHours: place.opening_hours,
      isOpenNow: place.opening_hours?.open_now,
      website: place.website,
      phone: place.formatted_phone_number,

      // Photos
      photos: place.photos || [],
      primaryPhoto: place.primaryPhoto || null,
      hasPhotos: (place.photos?.length || 0) > 0,

      // Reviews summary
      topReview: place.reviews?.[0]?.text || null,

      // Estimated details (can be refined with Perplexity later)
      estimatedDuration: this.estimateDuration(place.types),
      estimatedCost: this.estimateCost(place.price_level),
      energyLevel: this.estimateEnergyLevel(place.types),

      // Metadata
      source: 'google_places',
      validated: true,
      discoveredAt: new Date().toISOString()
    };
  }

  /**
   * Filter and rank candidates
   */
  filterAndRank(candidates, timeWindow, preferences) {
    // 1. Filter by opening hours (if scheduled time provided)
    let filtered = candidates.filter(candidate => {
      if (candidate.openingHours && candidate.openingHours.periods) {
        // TODO: Check if open during timeWindow
        // For now, just check if open_now
        return candidate.isOpenNow !== false;
      }
      return true; // Accept if no hours data
    });

    // 2. Rank by quality score
    filtered = filtered.map(candidate => ({
      ...candidate,
      qualityScore: this.calculateQualityScore(candidate, preferences)
    }));

    // 3. Sort by quality score
    filtered.sort((a, b) => b.qualityScore - a.qualityScore);

    return filtered.slice(0, 5); // Return top 5
  }

  /**
   * Calculate quality score for ranking
   */
  calculateQualityScore(candidate, preferences) {
    let score = 0;

    // Rating (40 points max)
    if (candidate.rating) {
      score += (candidate.rating / 5.0) * 40;
    }

    // Number of ratings (20 points max)
    if (candidate.ratingCount) {
      const ratingPoints = Math.min(candidate.ratingCount / 100, 1) * 20;
      score += ratingPoints;
    }

    // Has photos (15 points)
    if (candidate.hasPhotos) {
      score += 15;
    }

    // Has opening hours data (10 points)
    if (candidate.openingHours) {
      score += 10;
    }

    // Open now (10 points bonus)
    if (candidate.isOpenNow) {
      score += 10;
    }

    // Price level match (5 points)
    if (this.matchesBudget(candidate.priceLevel, preferences.budget)) {
      score += 5;
    }

    return score;
  }

  /**
   * Map activity category to Google Places types
   */
  mapCategoryToGoogleTypes(category, preferences) {
    const agentType = preferences?.agentType || preferences?.travelStyle || 'best-overall';

    const typeMap = {
      cultural: ['museum', 'art_gallery', 'church', 'synagogue', 'hindu_temple', 'mosque'],
      historical: ['museum', 'tourist_attraction', 'church', 'landmark'],
      outdoor: ['park', 'natural_feature', 'campground', 'hiking_area'],
      adventure: ['amusement_park', 'zoo', 'aquarium', 'bowling_alley', 'gym'],
      entertainment: ['movie_theater', 'night_club', 'bar', 'casino', 'stadium'],
      shopping: ['shopping_mall', 'store', 'clothing_store', 'book_store'],
      food: ['restaurant', 'cafe', 'bakery', 'meal_takeaway'],
      relaxation: ['spa', 'beauty_salon', 'park', 'library']
    };

    // Agent-specific preferences
    const agentPreferences = {
      culture: ['cultural', 'historical'],
      adventure: ['outdoor', 'adventure'],
      food: ['food', 'shopping'],
      'best-overall': ['cultural', 'outdoor', 'entertainment']
    };

    const preferredCategories = agentPreferences[agentType] || agentPreferences['best-overall'];

    let types = [];
    for (const cat of preferredCategories) {
      if (typeMap[cat]) {
        types.push(...typeMap[cat]);
      }
    }

    // Fallback: tourist attractions
    if (types.length === 0) {
      types = ['tourist_attraction', 'point_of_interest'];
    }

    // Remove duplicates
    return [...new Set(types)];
  }

  /**
   * Helper methods
   */
  getSearchRadius(preferences) {
    // Search radius in meters
    const budget = preferences?.budget || 'mid';
    return budget === 'budget' ? 2000 : budget === 'luxury' ? 5000 : 3000;
  }

  inferActivityType(googleTypes) {
    if (!googleTypes || googleTypes.length === 0) return 'general';

    const typeMap = {
      museum: 'cultural',
      art_gallery: 'cultural',
      church: 'historical',
      park: 'outdoor',
      amusement_park: 'entertainment',
      restaurant: 'food',
      shopping_mall: 'shopping'
    };

    for (const type of googleTypes) {
      if (typeMap[type]) return typeMap[type];
    }

    return 'general';
  }

  estimateDuration(types) {
    // Return duration in format "1-2 hours"
    if (types.includes('museum')) return '2-3 hours';
    if (types.includes('park')) return '1-2 hours';
    if (types.includes('restaurant')) return '1-2 hours';
    return '1-2 hours'; // Default
  }

  estimateCost(priceLevel) {
    if (!priceLevel) return '€10-20';
    const costs = {
      1: '€5-15',
      2: '€15-30',
      3: '€30-50',
      4: '€50+'
    };
    return costs[priceLevel] || '€10-20';
  }

  estimateEnergyLevel(types) {
    if (types.includes('gym') || types.includes('amusement_park')) return 'high';
    if (types.includes('museum') || types.includes('art_gallery')) return 'medium';
    if (types.includes('spa') || types.includes('library')) return 'low';
    return 'medium';
  }

  matchesBudget(priceLevel, budget) {
    if (!priceLevel || !budget) return true;

    const budgetMap = {
      budget: [1, 2],
      mid: [2, 3],
      luxury: [3, 4]
    };

    const acceptableLevels = budgetMap[budget] || [1, 2, 3, 4];
    return acceptableLevels.includes(priceLevel);
  }
}

module.exports = GooglePlacesDiscoveryAgent;
