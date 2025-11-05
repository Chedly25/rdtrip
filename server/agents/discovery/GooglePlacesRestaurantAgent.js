/**
 * Google Places Restaurant Discovery Agent
 * Finds restaurants using Google Places API with filters for meal type, budget, and cuisine
 */

const GooglePlacesService = require('../../services/googlePlacesService');
const GooglePlacesPhotoService = require('../../services/GooglePlacesPhotoService');

class GooglePlacesRestaurantAgent {
  constructor(googlePlacesService, photoService) {
    this.placesService = googlePlacesService || null;
    this.photoService = photoService || null;

    if (!this.placesService) {
      console.warn('⚠️  GooglePlacesRestaurantAgent: No Google Places service provided');
    }
  }

  /**
   * Discover restaurants for a specific meal
   * @param {Object} request - Restaurant discovery request
   * @returns {Object} Discovery result with restaurant candidates
   */
  async discoverRestaurants(request) {
    const { city, mealType, preferences, date, excludePlaceIds = [] } = request;

    console.log(`\n🍽️  GooglePlacesRestaurantAgent: Finding ${mealType} in ${city.name}`);
    if (excludePlaceIds.length > 0) {
      console.log(`   Excluding ${excludePlaceIds.length} already-used restaurants`);
    }

    try {
      // 1. Get time window for meal
      const timeWindow = this.getMealTimeWindow(mealType);
      console.log(`   Meal time: ${timeWindow.start} - ${timeWindow.end}`);

      // 2. Map budget to price levels
      const [minPrice, maxPrice] = this.budgetToPriceLevel(preferences.budget);
      console.log(`   Price range: ${minPrice}-${maxPrice}`);

      // 3. Search for restaurants
      const restaurants = await this.searchRestaurants(city, {
        mealType,
        minPrice,
        maxPrice,
        preferences
      });

      // 4. Filter out excluded places EARLY
      const excludeSet = new Set(excludePlaceIds);
      const filtered = restaurants.filter(r => !excludeSet.has(r.place_id));
      console.log(`   After exclusion filter: ${filtered.length}/${restaurants.length} restaurants`);

      // 5. Enrich with details and photos
      const enriched = await this.enrichRestaurants(filtered, mealType);

      // 6. Rank and filter
      const ranked = this.rankRestaurants(enriched, preferences, mealType);

      console.log(`   ✅ Found ${ranked.length} restaurants`);

      return {
        success: true,
        restaurants: ranked,
        source: 'google_places',
        mealType,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`   ❌ Restaurant discovery failed:`, error.message);
      return {
        success: false,
        restaurants: [],
        error: error.message,
        source: 'google_places'
      };
    }
  }

  /**
   * Search for restaurants using Google Places
   */
  async searchRestaurants(city, options) {
    if (!this.placesService) {
      throw new Error('Google Places service not available');
    }

    const { mealType, minPrice, maxPrice, preferences } = options;

    // Get cuisine preferences based on agent type
    const cuisineTypes = this.getCuisineTypes(preferences.agentType || 'best-overall', mealType);

    const allRestaurants = [];

    // Search for each cuisine type
    for (const cuisine of cuisineTypes) {
      try {
        const results = await this.placesService.nearbySearch({
          location: city.coordinates,
          radius: 2000, // 2km radius for restaurants
          type: 'restaurant',
          keyword: cuisine, // e.g., "french", "italian", "traditional"
          // Note: opennow filter doesn't work with keyword, we'll filter manually
          // minprice: minPrice,  // Not supported in Text Search
          // maxprice: maxPrice   // Not supported in Text Search
        });

        allRestaurants.push(...results.slice(0, 5)); // Top 5 per cuisine

      } catch (error) {
        console.warn(`   ⚠️  Search failed for cuisine "${cuisine}":`, error.message);
      }
    }

    // Also do a generic search
    try {
      const generic = await this.placesService.nearbySearch({
        location: city.coordinates,
        radius: 2000,
        type: 'restaurant',
        rankby: 'prominence'
      });
      allRestaurants.push(...generic.slice(0, 10));
    } catch (error) {
      console.warn(`   ⚠️  Generic restaurant search failed:`, error.message);
    }

    // Remove duplicates
    const unique = [];
    const seenIds = new Set();

    for (const restaurant of allRestaurants) {
      if (!seenIds.has(restaurant.place_id)) {
        seenIds.add(restaurant.place_id);
        unique.push(restaurant);
      }
    }

    // Filter by price level
    const filtered = unique.filter(r => {
      if (!r.price_level) return true; // Include if no price data
      return r.price_level >= minPrice && r.price_level <= maxPrice;
    });

    console.log(`   Found ${filtered.length} restaurants in budget`);
    return filtered.slice(0, 15); // Return top 15 for enrichment
  }

  /**
   * Enrich restaurants with full details
   */
  async enrichRestaurants(restaurants, mealType) {
    const enriched = [];

    for (const restaurant of restaurants) {
      try {
        // Get full details
        const details = await this.placesService.getDetails(restaurant.place_id, {
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
            'reviews',
            'editorial_summary'
          ]
        });

        if (!details) continue;

        // Enrich with photos
        const withPhotos = this.photoService
          ? this.photoService.enrichPlaceWithPhotos(details)
          : details;

        // Convert to our format
        const enrichedRestaurant = this.convertToRestaurantFormat(withPhotos, mealType);

        enriched.push(enrichedRestaurant);

      } catch (error) {
        console.warn(`   ⚠️  Failed to enrich ${restaurant.name}:`, error.message);
      }
    }

    return enriched;
  }

  /**
   * Convert Google Place to restaurant format
   */
  convertToRestaurantFormat(place, mealType) {
    // Infer cuisine from place types and reviews
    const cuisine = this.inferCuisine(place.types, place.editorial_summary?.overview);

    return {
      name: place.name,
      cuisine: cuisine,
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
      priceRange: this.priceLevelToSymbol(place.price_level),
      openingHours: place.opening_hours,
      isOpenNow: place.opening_hours?.open_now,
      website: place.website,
      phone: place.formatted_phone_number,

      // Photos
      photos: place.photos || [],
      primaryPhoto: place.primaryPhoto || null,
      hasPhotos: (place.photos?.length || 0) > 0,

      // Reviews
      topReview: place.reviews?.[0]?.text || null,
      reviewHighlight: this.extractReviewHighlight(place.reviews),

      // Meal-specific
      meal: mealType,
      suggestedTime: this.getSuggestedTime(mealType),
      estimatedCostPerPerson: this.estimateCostPerPerson(place.price_level),

      // Additional info
      vibe: place.editorial_summary?.overview || this.inferVibe(place.types, place.rating),
      reservationNeeded: place.price_level >= 3, // Guess: expensive places need reservations
      dressCode: place.price_level >= 3 ? 'smart casual' : 'casual',

      // Metadata
      source: 'google_places',
      validated: true,
      discoveredAt: new Date().toISOString()
    };
  }

  /**
   * Rank restaurants by quality and fit
   */
  rankRestaurants(restaurants, preferences, mealType) {
    const ranked = restaurants.map(restaurant => ({
      ...restaurant,
      qualityScore: this.calculateRestaurantScore(restaurant, preferences, mealType)
    }));

    // Sort by quality score
    ranked.sort((a, b) => b.qualityScore - a.qualityScore);

    return ranked.slice(0, 5); // Return top 5
  }

  /**
   * Calculate restaurant quality score
   */
  calculateRestaurantScore(restaurant, preferences, mealType) {
    let score = 0;

    // Rating (40 points)
    if (restaurant.rating) {
      score += (restaurant.rating / 5.0) * 40;
    }

    // Number of ratings (20 points)
    if (restaurant.ratingCount) {
      score += Math.min(restaurant.ratingCount / 100, 1) * 20;
    }

    // Has photos (15 points)
    if (restaurant.hasPhotos) {
      score += 15;
    }

    // Open now (15 points bonus)
    if (restaurant.isOpenNow) {
      score += 15;
    }

    // Price match (10 points)
    if (this.matchesBudget(restaurant.priceLevel, preferences.budget)) {
      score += 10;
    }

    return score;
  }

  /**
   * Helper methods
   */
  getMealTimeWindow(mealType) {
    const windows = {
      breakfast: { start: '08:00', end: '10:00' },
      lunch: { start: '12:30', end: '14:30' },
      dinner: { start: '19:30', end: '22:00' }
    };
    return windows[mealType] || windows.lunch;
  }

  getSuggestedTime(mealType) {
    const times = {
      breakfast: '08:30',
      lunch: '13:00',
      dinner: '20:00'
    };
    return times[mealType] || '13:00';
  }

  budgetToPriceLevel(budget) {
    const map = {
      budget: [1, 2],
      mid: [2, 3],
      luxury: [3, 4]
    };
    return map[budget] || [2, 3];
  }

  priceLevelToSymbol(priceLevel) {
    if (!priceLevel) return '€€';
    return '€'.repeat(priceLevel);
  }

  estimateCostPerPerson(priceLevel) {
    const costs = {
      1: 15,
      2: 25,
      3: 40,
      4: 60
    };
    return costs[priceLevel] || 25;
  }

  getCuisineTypes(agentType, mealType) {
    const cuisineMap = {
      culture: ['traditional', 'local cuisine', 'regional'],
      food: ['fine dining', 'gourmet', 'michelin'],
      adventure: ['casual dining', 'bistro'],
      'best-overall': ['traditional', 'local cuisine']
    };

    return cuisineMap[agentType] || cuisineMap['best-overall'];
  }

  inferCuisine(types, summary) {
    // Try to extract from types
    if (types.includes('french')) return 'French';
    if (types.includes('italian')) return 'Italian';
    if (types.includes('japanese')) return 'Japanese';
    if (types.includes('chinese')) return 'Chinese';

    // Try to extract from summary
    if (summary) {
      if (summary.toLowerCase().includes('french')) return 'French';
      if (summary.toLowerCase().includes('italian')) return 'Italian';
      if (summary.toLowerCase().includes('provençal')) return 'Provençal';
    }

    return 'Regional cuisine';
  }

  inferVibe(types, rating) {
    if (types.includes('fine_dining')) return 'Upscale fine dining experience';
    if (types.includes('cafe')) return 'Casual café atmosphere';
    if (types.includes('bistro')) return 'Cozy bistro setting';
    if (rating >= 4.5) return 'Highly-rated local favorite';
    return 'Welcoming local restaurant';
  }

  extractReviewHighlight(reviews) {
    if (!reviews || reviews.length === 0) return null;

    // Get the highest-rated review
    const topReview = reviews
      .filter(r => r.rating >= 4)
      .sort((a, b) => b.rating - a.rating)[0];

    if (topReview) {
      // Extract first sentence or first 150 chars
      let text = topReview.text;
      const firstSentence = text.split('.')[0];
      return firstSentence.length < 150 ? firstSentence : text.substring(0, 147) + '...';
    }

    return null;
  }

  matchesBudget(priceLevel, budget) {
    if (!priceLevel) return true;
    const [min, max] = this.budgetToPriceLevel(budget);
    return priceLevel >= min && priceLevel <= max;
  }
}

module.exports = GooglePlacesRestaurantAgent;
