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
    const { city, category, timeWindow, preferences, date, excludePlaceIds = [] } = request;

    console.log(`\n🔍 GooglePlacesDiscoveryAgent: Discovering ${category} in ${city.name}`);
    console.log(`   Time window: ${timeWindow.start} - ${timeWindow.end}`);
    if (excludePlaceIds.length > 0) {
      console.log(`   Excluding ${excludePlaceIds.length} already-used places`);
    }

    try {
      // 1. Map category to Google Places types
      const googleTypes = this.mapCategoryToGoogleTypes(category, preferences);
      console.log(`   Google types: ${googleTypes.join(', ')}`);

      // 2. Search for places
      const candidates = await this.searchPlaces(city, googleTypes, preferences);

      // 3. Filter out excluded places EARLY
      const excludeSet = new Set(excludePlaceIds);
      const filtered = candidates.filter(c => !excludeSet.has(c.place_id));
      console.log(`   After exclusion filter: ${filtered.length}/${candidates.length} places`);

      // 4. Enrich with details and photos
      const enriched = await this.enrichCandidates(filtered, city, timeWindow, date);

      // 5. Filter by time window and preferences
      const ranked = this.filterAndRank(enriched, timeWindow, preferences);

      console.log(`   ✅ Found ${ranked.length} candidates`);

      return {
        success: true,
        candidates: ranked,
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

        allCandidates.push(...results.slice(0, 10)); // Top 10 per type (more options for filtering)

      } catch (error) {
        console.warn(`   ⚠️  Search failed for type "${type}":`, error.message);
      }
    }

    // Define lodging types to EXCLUDE from activities
    const LODGING_TYPES = new Set([
      'lodging',
      'hotel',
      'campground',
      'rv_park',
      'motel',
      'hostel',
      'resort',
      'guest_house',
      'bed_and_breakfast'
    ]);

    // Remove duplicates and EXCLUDE lodging
    const unique = [];
    const seenIds = new Set();

    for (const place of allCandidates) {
      // Skip if duplicate
      if (seenIds.has(place.place_id)) continue;

      // Skip if it's lodging (check if ANY type matches lodging types)
      const isLodging = place.types?.some(type => LODGING_TYPES.has(type));
      if (isLodging) {
        console.log(`   🚫 Excluded lodging: ${place.name}`);
        continue;
      }

      seenIds.add(place.place_id);
      unique.push(place);
    }

    console.log(`   Found ${unique.length} unique non-lodging places`);
    return unique.slice(0, 20); // Return top 20 for better filtering options
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
      place_types: place.types || [], // Store raw types for agent scoring
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
    const agentType = preferences?.agentType || preferences?.travelStyle || 'best-overall';

    // 1. Filter by opening hours (if scheduled time provided)
    let filtered = candidates.filter(candidate => {
      if (candidate.openingHours && candidate.openingHours.periods) {
        // TODO: Check if open during timeWindow
        // For now, just check if open_now
        return candidate.isOpenNow !== false;
      }
      return true; // Accept if no hours data
    });

    // 2. QUALITY FILTERING: Exclude vague/generic/poor quality places
    filtered = filtered.filter(candidate => {
      // Exclude places with very few reviews AND low rating (likely not interesting)
      if (candidate.ratingCount && candidate.rating) {
        if (candidate.ratingCount < 10 && candidate.rating < 3.5) {
          console.log(`      🚫 Filtered out low-quality: ${candidate.name} (${candidate.ratingCount} reviews, ${candidate.rating} rating)`);
          return false;
        }
      }

      // For adventure agent: Require minimum rating for tourist_attraction to avoid generic spots
      if (agentType === 'adventure') {
        if (candidate.place_types?.includes('tourist_attraction')) {
          if (!candidate.rating || candidate.rating < 4.0) {
            console.log(`      🚫 Filtered out generic attraction: ${candidate.name} (rating too low for adventure)`);
            return false;
          }
        }
      }

      // Exclude generic "point_of_interest" unless it has exceptional ratings
      if (candidate.place_types?.includes('point_of_interest') && !candidate.place_types?.includes('park') && !candidate.place_types?.includes('museum')) {
        if (!candidate.rating || candidate.rating < 4.3 || (candidate.ratingCount && candidate.ratingCount < 50)) {
          console.log(`      🚫 Filtered out generic POI: ${candidate.name}`);
          return false;
        }
      }

      return true;
    });

    // 3. Rank by quality score
    filtered = filtered.map(candidate => ({
      ...candidate,
      qualityScore: this.calculateQualityScore(candidate, preferences)
    }));

    // 4. Sort by quality score
    filtered.sort((a, b) => b.qualityScore - a.qualityScore);

    return filtered.slice(0, 6); // Return top 6 per time window for choice grid
  }

  /**
   * Calculate quality score for ranking
   * NOW WITH AGENT PERSONALITY SCORING
   */
  calculateQualityScore(candidate, preferences) {
    const agentType = preferences?.agentType || preferences?.travelStyle || 'best-overall';
    let score = 0;

    // Rating (40 points max)
    if (candidate.rating) {
      score += (candidate.rating / 5.0) * 40;
    }

    // Number of ratings - AGENT-SPECIFIC LOGIC
    if (candidate.ratingCount) {
      if (agentType === 'hidden-gems') {
        // HIDDEN GEMS: Prefer LOWER rating counts (undiscovered places)
        // Inverse scoring: fewer ratings = higher score
        const hiddenGemScore = Math.max(0, 20 - Math.min(candidate.ratingCount / 50, 1) * 20);
        score += hiddenGemScore;
        if (candidate.ratingCount < 100) {
          score += 10; // Bonus for truly hidden spots
        }
      } else {
        // OTHER AGENTS: Prefer popular, well-reviewed places
        const ratingPoints = Math.min(candidate.ratingCount / 100, 1) * 20;
        score += ratingPoints;
      }
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

    // AGENT-SPECIFIC BONUSES
    const place_types = candidate.place_types || [];

    if (agentType === 'adventure') {
      // Bonus for nature/outdoor types
      if (place_types.includes('park') || place_types.includes('natural_feature') || place_types.includes('hiking_area')) {
        score += 20;
      }
    } else if (agentType === 'culture') {
      // Bonus for museums and historical sites
      if (place_types.includes('museum') || place_types.includes('art_gallery') || place_types.includes('library')) {
        score += 20;
      }
    } else if (agentType === 'food') {
      // Bonus for high-rated restaurants
      if (place_types.includes('restaurant') && candidate.rating >= 4.0) {
        score += 20;
      }
    } else if (agentType === 'hidden-gems') {
      // Bonus for unique types (not generic tourist_attraction)
      if (!place_types.includes('tourist_attraction') && place_types.length > 0) {
        score += 15;
      }
    }

    return score;
  }

  /**
   * Map activity category to Google Places types
   * NOW WITH AGENT PERSONALITY AWARENESS
   */
  mapCategoryToGoogleTypes(category, preferences) {
    const agentType = preferences?.agentType || preferences?.travelStyle || 'best-overall';
    console.log(`   🎯 Agent type: ${agentType}`);

    // AGENT-SPECIFIC TYPE MAPPINGS
    const agentTypeMap = {
      // ADVENTURE: Outdoor activities, nature, physical experiences
      'adventure': [
        'park',
        'natural_feature',
        'hiking_area',
        'tourist_attraction', // Viewpoints, scenic spots
        'amusement_park',
        'zoo',
        'aquarium',
        'national_park',
        'ski_resort',
        'campground',
        'rv_park',
        'stadium',
        'tourist_destination'
      ],

      // HIDDEN GEMS: Local spots, lesser-known places, unique experiences
      'hidden-gems': [
        'tourist_attraction', // Will filter by lower rating counts
        'museum', // Smaller, local museums
        'art_gallery',
        'park',
        'church', // Historic but less touristy
        'store', // Local artisan shops
        'cafe', // Local coffee spots
        'point_of_interest'
      ],

      // FOOD: All food-related experiences
      'food': [
        'restaurant',
        'cafe',
        'bakery',
        'meal_takeaway',
        'meal_delivery',
        'food'
      ],

      // CULTURE: Museums, historical sites, art, education
      'culture': [
        'museum',
        'art_gallery',
        'library',
        'church',
        'synagogue',
        'hindu_temple',
        'mosque',
        'tourist_attraction', // Historical landmarks
        'landmark',
        'university'
      ],

      // BEST OVERALL: Balanced mix of top attractions
      'best-overall': [
        'tourist_attraction',
        'museum',
        'park',
        'landmark',
        'art_gallery',
        'amusement_park',
        'zoo',
        'aquarium'
      ]
    };

    // Get agent-specific types
    let types = agentTypeMap[agentType] || agentTypeMap['best-overall'];

    console.log(`   📋 Selected types for ${agentType}: ${types.slice(0, 3).join(', ')}... (${types.length} total)`);

    return [...new Set(types)]; // Remove duplicates
  }

  /**
   * Helper methods
   */
  getSearchRadius(preferences) {
    // Search radius in meters
    const agentType = preferences?.agentType || preferences?.travelStyle || 'best-overall';
    const budget = preferences?.budget || 'mid';

    // Adventure agent needs larger radius for nature/outdoor spots
    if (agentType === 'adventure') {
      return 8000; // 8km for adventure (nature spots are further from city center)
    }

    // Standard radius based on budget
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
