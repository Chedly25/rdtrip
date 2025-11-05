/**
 * Google Places Accommodation Discovery Agent
 * Finds hotels and accommodations using Google Places API
 */

const GooglePlacesService = require('../../services/googlePlacesService');
const GooglePlacesPhotoService = require('../../services/GooglePlacesPhotoService');

class GooglePlacesAccommodationAgent {
  constructor(googlePlacesService, photoService) {
    this.placesService = googlePlacesService || null;
    this.photoService = photoService || null;

    if (!this.placesService) {
      console.warn('⚠️  GooglePlacesAccommodationAgent: No Google Places service provided');
    }
  }

  /**
   * Discover accommodations for a city
   * @param {Object} request - Accommodation discovery request
   * @returns {Object} Discovery result with hotel candidates
   */
  async discoverAccommodations(request) {
    const { city, date, preferences } = request;

    console.log(`\n🏨 GooglePlacesAccommodationAgent: Finding hotels in ${city.name}`);

    try {
      // 1. Map budget to price levels
      const [minPrice, maxPrice] = this.budgetToPriceLevel(preferences.budget);
      console.log(`   Price range: ${minPrice}-${maxPrice}`);

      // 2. Search for hotels
      const hotels = await this.searchHotels(city, {
        minPrice,
        maxPrice,
        preferences
      });

      // 3. Enrich with details and photos
      const enriched = await this.enrichHotels(hotels);

      // 4. Rank and filter
      const ranked = this.rankHotels(enriched, preferences);

      console.log(`   ✅ Found ${ranked.length} hotels`);

      return {
        success: true,
        hotels: ranked,
        source: 'google_places',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`   ❌ Accommodation discovery failed:`, error.message);
      return {
        success: false,
        hotels: [],
        error: error.message,
        source: 'google_places'
      };
    }
  }

  /**
   * Search for hotels using Google Places
   */
  async searchHotels(city, options) {
    if (!this.placesService) {
      throw new Error('Google Places service not available');
    }

    const { minPrice, maxPrice, preferences } = options;

    // Get lodging types based on agent preferences
    const lodgingTypes = this.getLodgingTypes(preferences.agentType || 'best-overall');

    const allHotels = [];

    // Search for each lodging type
    for (const type of lodgingTypes) {
      try {
        const results = await this.placesService.nearbySearch({
          location: city.coordinates,
          radius: 5000, // 5km radius for hotels
          type: 'lodging',
          keyword: type
        });

        allHotels.push(...results.slice(0, 5)); // Top 5 per type

      } catch (error) {
        console.warn(`   ⚠️  Search failed for type "${type}":`, error.message);
      }
    }

    // Also do a generic lodging search
    try {
      const generic = await this.placesService.nearbySearch({
        location: city.coordinates,
        radius: 5000,
        type: 'lodging',
        rankby: 'prominence'
      });
      allHotels.push(...generic.slice(0, 10));
    } catch (error) {
      console.warn(`   ⚠️  Generic hotel search failed:`, error.message);
    }

    // Remove duplicates
    const unique = [];
    const seenIds = new Set();

    for (const hotel of allHotels) {
      if (!seenIds.has(hotel.place_id)) {
        seenIds.add(hotel.place_id);
        unique.push(hotel);
      }
    }

    // Filter by price level
    const filtered = unique.filter(h => {
      if (!h.price_level) return true; // Include if no price data
      return h.price_level >= minPrice && h.price_level <= maxPrice;
    });

    console.log(`   Found ${filtered.length} hotels in budget`);
    return filtered.slice(0, 15); // Return top 15 for enrichment
  }

  /**
   * Enrich hotels with full details
   */
  async enrichHotels(hotels) {
    const enriched = [];

    for (const hotel of hotels) {
      try {
        // Get full details
        const details = await this.placesService.getDetails(hotel.place_id, {
          fields: [
            'name',
            'formatted_address',
            'geometry',
            'rating',
            'user_ratings_total',
            'price_level',
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
        const enrichedHotel = this.convertToAccommodationFormat(withPhotos);

        enriched.push(enrichedHotel);

      } catch (error) {
        console.warn(`   ⚠️  Failed to enrich ${hotel.name}:`, error.message);
      }
    }

    return enriched;
  }

  /**
   * Convert Google Place to accommodation format
   */
  convertToAccommodationFormat(place) {
    // Infer hotel type from types and name
    const hotelType = this.inferHotelType(place.types, place.name);
    const stars = this.estimateStars(place.rating, place.price_level);

    return {
      name: place.name,
      type: hotelType,
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
      stars: stars,
      website: place.website,
      phone: place.formatted_phone_number,

      // Photos
      photos: place.photos || [],
      primaryPhoto: place.primaryPhoto || null,
      hasPhotos: (place.photos?.length || 0) > 0,

      // Reviews
      topReview: place.reviews?.[0]?.text || null,
      reviewHighlight: this.extractReviewHighlight(place.reviews),

      // Accommodation specifics
      pricePerNight: this.estimatePricePerNight(place.price_level),
      neighborhood: this.extractNeighborhood(place.formatted_address),
      walkabilityScore: this.estimateWalkability(place.types),

      // Additional info
      vibe: place.editorial_summary?.overview || this.inferVibe(hotelType, stars),
      amenities: this.inferAmenities(place.types, place.price_level),
      bookingTip: this.generateBookingTip(place.rating, place.price_level),
      checkIn: '15:00',
      checkOut: '11:00',

      // Metadata
      source: 'google_places',
      validated: true,
      discoveredAt: new Date().toISOString()
    };
  }

  /**
   * Rank hotels by quality and fit
   */
  rankHotels(hotels, preferences) {
    const ranked = hotels.map(hotel => ({
      ...hotel,
      qualityScore: this.calculateHotelScore(hotel, preferences)
    }));

    // Sort by quality score
    ranked.sort((a, b) => b.qualityScore - a.qualityScore);

    return ranked.slice(0, 5); // Return top 5
  }

  /**
   * Calculate hotel quality score
   */
  calculateHotelScore(hotel, preferences) {
    let score = 0;

    // Rating (40 points)
    if (hotel.rating) {
      score += (hotel.rating / 5.0) * 40;
    }

    // Number of ratings (25 points)
    if (hotel.ratingCount) {
      score += Math.min(hotel.ratingCount / 100, 1) * 25;
    }

    // Has photos (15 points)
    if (hotel.hasPhotos) {
      score += 15;
    }

    // Price match (10 points)
    if (this.matchesBudget(hotel.priceLevel, preferences.budget)) {
      score += 10;
    }

    // Stars (10 points)
    if (hotel.stars >= 4) {
      score += 10;
    } else if (hotel.stars >= 3) {
      score += 5;
    }

    return score;
  }

  /**
   * Helper methods
   */
  budgetToPriceLevel(budget) {
    const map = {
      budget: [1, 2],
      mid: [2, 3],
      luxury: [3, 4]
    };
    return map[budget] || [2, 3];
  }

  estimatePricePerNight(priceLevel) {
    const prices = {
      1: 60,
      2: 120,
      3: 180,
      4: 300
    };
    return prices[priceLevel] || 120;
  }

  estimateStars(rating, priceLevel) {
    if (!rating) return 3;

    if (rating >= 4.5 && priceLevel >= 3) return 5;
    if (rating >= 4.0 && priceLevel >= 3) return 4;
    if (rating >= 4.0) return 4;
    if (rating >= 3.5) return 3;
    return 3;
  }

  getLodgingTypes(agentType) {
    const typeMap = {
      luxury: ['hotel', 'resort', 'spa'],
      culture: ['boutique hotel', 'historic hotel', 'charming hotel'],
      adventure: ['hotel', 'hostel', 'budget hotel'],
      'best-overall': ['hotel', 'boutique hotel']
    };

    return typeMap[agentType] || typeMap['best-overall'];
  }

  inferHotelType(types, name) {
    const nameLower = name.toLowerCase();

    if (types.includes('spa') || nameLower.includes('spa')) return 'spa_hotel';
    if (nameLower.includes('boutique')) return 'boutique_hotel';
    if (nameLower.includes('resort')) return 'resort';
    if (nameLower.includes('hostel')) return 'hostel';
    if (nameLower.includes('apartment') || nameLower.includes('residence')) return 'apartment';

    return 'hotel';
  }

  inferVibe(hotelType, stars) {
    if (hotelType === 'boutique_hotel') return 'Intimate boutique hotel with character and personalized service';
    if (hotelType === 'spa_hotel') return 'Relaxing spa hotel with wellness facilities';
    if (hotelType === 'resort') return 'Full-service resort with comprehensive amenities';
    if (stars >= 4) return 'Upscale hotel with premium amenities and service';
    return 'Comfortable hotel with good amenities';
  }

  inferAmenities(types, priceLevel) {
    const baseAmenities = ['free_wifi', 'air_conditioning', '24h_reception'];

    if (priceLevel >= 3) {
      baseAmenities.push('breakfast_included', 'parking', 'room_service', 'concierge');
    }

    if (types.includes('spa')) {
      baseAmenities.push('spa', 'fitness_center', 'pool');
    }

    return baseAmenities;
  }

  extractNeighborhood(address) {
    // Try to extract neighborhood from address
    // For now, just return the city part
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    return 'City Center';
  }

  estimateWalkability(types) {
    // Simple walkability score (1-10)
    // Hotels in city center typically have good walkability
    return 8; // Default good walkability for now
  }

  generateBookingTip(rating, priceLevel) {
    if (rating >= 4.5 && priceLevel >= 3) {
      return 'Highly rated - book in advance. Check for direct booking discounts.';
    }
    if (rating >= 4.0) {
      return 'Popular choice - consider booking directly for best rates.';
    }
    return 'Compare prices across booking platforms for best deals.';
  }

  extractReviewHighlight(reviews) {
    if (!reviews || reviews.length === 0) return null;

    // Get highest-rated review
    const topReview = reviews
      .filter(r => r.rating >= 4)
      .sort((a, b) => b.rating - a.rating)[0];

    if (topReview) {
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

module.exports = GooglePlacesAccommodationAgent;
