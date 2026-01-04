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

    // 1. Filter by opening hours (check if open during timeWindow)
    let filtered = candidates.filter(candidate => {
      if (candidate.openingHours && candidate.openingHours.periods) {
        // Parse time window to check if place is open during requested time
        const startHour = parseInt(timeWindow.start?.split(':')[0] || '9', 10);
        const endHour = parseInt(timeWindow.end?.split(':')[0] || '18', 10);

        // Check each period to see if the place is open during our window
        const isOpenDuringWindow = candidate.openingHours.periods.some(period => {
          if (!period.open) return false;
          const openHour = Math.floor(period.open.time / 100);
          const closeHour = period.close ? Math.floor(period.close.time / 100) : 24;
          // Check if our time window overlaps with this opening period
          return openHour <= endHour && closeHour >= startHour;
        });

        return isOpenDuringWindow;
      }
      // Accept if no hours data (assume open)
      return true;
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

    // 3. Rank by quality score AND attach match reasons
    filtered = filtered.map(candidate => {
      const { score, matchReasons } = this.calculateQualityScore(candidate, preferences);
      return {
        ...candidate,
        qualityScore: score,
        matchReasons: matchReasons,
        matchScore: this.calculateMatchPercentage(score, matchReasons)
      };
    });

    // 4. Sort by quality score
    filtered.sort((a, b) => b.qualityScore - a.qualityScore);

    return filtered.slice(0, 6); // Return top 6 per time window for choice grid
  }

  /**
   * Calculate a normalized match percentage (0-100) for display
   */
  calculateMatchPercentage(score, matchReasons) {
    // If there are personalization match reasons, calculate based on those
    if (matchReasons && matchReasons.length > 0) {
      const personalizationScore = matchReasons.reduce((sum, r) => sum + r.contribution, 0);
      // Max possible personalization score is ~50 points
      // Normalize to 0-100, with a base of 50% for having any matches
      const percentage = Math.min(100, 50 + (personalizationScore / 50) * 50);
      return Math.round(percentage);
    }
    // No personalization data - return null (don't show match score)
    return null;
  }

  /**
   * Calculate quality score for ranking
   * NOW WITH AGENT PERSONALITY SCORING, PERSONALIZATION, AND MATCH REASONS
   * Returns: { score: number, matchReasons: MatchReason[] }
   */
  calculateQualityScore(candidate, preferences) {
    const agentType = preferences?.agentType || preferences?.travelStyle || 'best-overall';
    const personalization = preferences?.personalization || {};
    let score = 0;
    const matchReasons = [];

    // Rating (40 points max) - base quality, not a "match reason"
    if (candidate.rating) {
      score += (candidate.rating / 5.0) * 40;
    }

    // Number of ratings - AGENT-SPECIFIC LOGIC
    if (candidate.ratingCount) {
      if (agentType === 'hidden-gems' || personalization.avoidCrowds) {
        // HIDDEN GEMS or AVOID CROWDS: Prefer LOWER rating counts (undiscovered places)
        const hiddenGemScore = Math.max(0, 20 - Math.min(candidate.ratingCount / 50, 1) * 20);
        score += hiddenGemScore;
        if (candidate.ratingCount < 100) {
          score += 10;
          if (personalization.avoidCrowds) {
            matchReasons.push({
              factor: 'avoid_crowds',
              contribution: 10,
              explanation: 'Hidden spot away from tourist crowds'
            });
          }
        }
      } else {
        const ratingPoints = Math.min(candidate.ratingCount / 100, 1) * 20;
        score += ratingPoints;
      }
    }

    // Has photos (15 points) - base quality
    if (candidate.hasPhotos) {
      score += 15;
    }

    // Has opening hours data (10 points) - base quality
    if (candidate.openingHours) {
      score += 10;
    }

    // Open now (10 points bonus) - base quality
    if (candidate.isOpenNow) {
      score += 10;
    }

    // Price level match (5 points)
    const effectiveBudget = preferences.budget || personalization.budget;
    if (this.matchesBudget(candidate.priceLevel, effectiveBudget)) {
      score += 5;
      if (personalization.budget) {
        matchReasons.push({
          factor: `budget_${personalization.budget}`,
          contribution: 5,
          explanation: `Fits your ${personalization.budget} budget`
        });
      }
    }

    // AGENT-SPECIFIC BONUSES
    const place_types = candidate.place_types || [];

    if (agentType === 'adventure') {
      if (place_types.includes('park') || place_types.includes('natural_feature') || place_types.includes('hiking_area')) {
        score += 20;
      }
    } else if (agentType === 'culture') {
      if (place_types.includes('museum') || place_types.includes('art_gallery') || place_types.includes('library')) {
        score += 20;
      }
    } else if (agentType === 'food') {
      if (place_types.includes('restaurant') && candidate.rating >= 4.0) {
        score += 20;
      }
    } else if (agentType === 'hidden-gems') {
      if (!place_types.includes('tourist_attraction') && place_types.length > 0) {
        score += 15;
      }
    }

    // PERSONALIZATION BONUSES (up to 30 points) - with reasons!
    const personalizationResult = this.calculatePersonalizationBonus(candidate, personalization);
    score += personalizationResult.score;
    matchReasons.push(...personalizationResult.reasons);

    return { score, matchReasons };
  }

  /**
   * Calculate bonus score based on user personalization preferences
   * NOW RETURNS MATCH REASONS for visibility
   * Returns: { score: number, reasons: MatchReason[] }
   */
  calculatePersonalizationBonus(candidate, personalization) {
    if (!personalization || Object.keys(personalization).length === 0) {
      return { score: 0, reasons: [] };
    }

    let bonus = 0;
    const reasons = [];
    const place_types = candidate.place_types || [];

    // Interest matching (up to 15 points)
    if (personalization.interests && personalization.interests.length > 0) {
      const interestTypeMap = {
        'history': { types: ['museum', 'historic_site', 'monument', 'landmark'], label: 'history' },
        'art': { types: ['art_gallery', 'museum'], label: 'art' },
        'architecture': { types: ['church', 'cathedral', 'historic_site', 'landmark'], label: 'architecture' },
        'nature': { types: ['park', 'natural_feature', 'hiking_area', 'garden'], label: 'nature' },
        'food': { types: ['restaurant', 'cafe', 'bakery', 'food'], label: 'culinary experiences' },
        'wine': { types: ['bar', 'winery', 'liquor_store'], label: 'wine' },
        'nightlife': { types: ['bar', 'night_club', 'casino'], label: 'nightlife' },
        'shopping': { types: ['shopping_mall', 'store', 'market'], label: 'shopping' },
        'photography': { types: ['scenic_lookout', 'park', 'landmark', 'tourist_attraction'], label: 'photography' },
        'adventure': { types: ['park', 'hiking_area', 'amusement_park', 'stadium'], label: 'adventure' },
        'wellness': { types: ['spa', 'gym', 'health'], label: 'wellness' },
        'local-culture': { types: ['local_government_office', 'market', 'cafe'], label: 'local culture' },
        'beaches': { types: ['beach'], label: 'beaches' },
        'mountains': { types: ['natural_feature', 'hiking_area', 'park'], label: 'mountains' },
        'museums': { types: ['museum', 'art_gallery'], label: 'museums' }
      };

      let interestBonus = 0;
      for (const interest of personalization.interests) {
        const mapping = interestTypeMap[interest];
        if (mapping && mapping.types.some(t => place_types.includes(t))) {
          interestBonus += 5;
          reasons.push({
            factor: `interest_${interest}`,
            contribution: 5,
            explanation: `Matches your interest in ${mapping.label}`
          });
        }
      }
      bonus += Math.min(interestBonus, 15); // Cap at 15 points
    }

    // Travel style bonus (up to 10 points)
    if (personalization.travelStyle) {
      const styleMatch = {
        'explorer': { types: ['tourist_attraction', 'landmark', 'museum', 'park'], label: 'explorer' },
        'relaxer': { types: ['spa', 'cafe', 'park', 'garden'], label: 'relaxed traveler' },
        'culture': { types: ['museum', 'art_gallery', 'historic_site', 'church'], label: 'culture seeker' },
        'adventurer': { types: ['park', 'hiking_area', 'amusement_park', 'stadium'], label: 'adventurer' },
        'foodie': { types: ['restaurant', 'cafe', 'bakery', 'bar'], label: 'foodie' }
      };

      const mapping = styleMatch[personalization.travelStyle];
      if (mapping && mapping.types.some(t => place_types.includes(t))) {
        bonus += 10;
        reasons.push({
          factor: `style_${personalization.travelStyle}`,
          contribution: 10,
          explanation: `Perfect for a ${mapping.label} like you`
        });
      }
    }

    // Occasion bonus
    if (personalization.occasion) {
      const occasionMatch = this.matchesOccasion(candidate, personalization.occasion);
      if (occasionMatch.matches) {
        bonus += occasionMatch.points;
        reasons.push({
          factor: `occasion_${personalization.occasion}`,
          contribution: occasionMatch.points,
          explanation: occasionMatch.explanation
        });
      }
    }

    // Outdoor preference bonus (5 points)
    if (personalization.preferOutdoor) {
      if (place_types.includes('park') || place_types.includes('garden') ||
          place_types.includes('hiking_area') || place_types.includes('beach') ||
          place_types.includes('natural_feature')) {
        bonus += 5;
        reasons.push({
          factor: 'prefer_outdoor',
          contribution: 5,
          explanation: 'Great outdoor venue as you prefer'
        });
      }
    }

    // Accessibility consideration
    if (personalization.accessibility && personalization.accessibility.length > 0) {
      if (candidate.ratingCount > 500 && candidate.rating >= 4.0) {
        bonus += 3;
        reasons.push({
          factor: 'accessibility',
          contribution: 3,
          explanation: 'Well-established venue, typically more accessible'
        });
      }
    }

    return { score: bonus, reasons };
  }

  /**
   * Check if a place matches the trip occasion
   */
  matchesOccasion(candidate, occasion) {
    const place_types = candidate.place_types || [];
    const rating = candidate.rating || 0;

    const occasionMatchers = {
      'honeymoon': {
        check: () => rating >= 4.3 && (place_types.includes('spa') || place_types.includes('park') || place_types.includes('restaurant')),
        points: 8,
        explanation: 'Romantic setting perfect for your honeymoon'
      },
      'anniversary': {
        check: () => rating >= 4.2 && (place_types.includes('restaurant') || place_types.includes('spa') || place_types.includes('park')),
        points: 8,
        explanation: 'Special venue for celebrating your anniversary'
      },
      'birthday': {
        check: () => rating >= 4.0,
        points: 5,
        explanation: 'Highly-rated venue for your birthday celebration'
      },
      'family-vacation': {
        check: () => place_types.includes('park') || place_types.includes('zoo') || place_types.includes('aquarium') || place_types.includes('museum'),
        points: 8,
        explanation: 'Family-friendly activity'
      },
      'solo-adventure': {
        check: () => place_types.includes('cafe') || place_types.includes('museum') || place_types.includes('park'),
        points: 5,
        explanation: 'Great for solo exploration'
      }
    };

    const matcher = occasionMatchers[occasion];
    if (matcher && matcher.check()) {
      return { matches: true, points: matcher.points, explanation: matcher.explanation };
    }

    return { matches: false, points: 0, explanation: '' };
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
