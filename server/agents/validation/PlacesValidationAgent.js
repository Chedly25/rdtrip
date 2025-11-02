/**
 * Places Validation Agent
 *
 * This agent validates discovered places using Google Places API
 * Enriches them with real-world data: ratings, photos, hours, coordinates
 *
 * Agentic Capabilities:
 * - Autonomous validation decisions
 * - Quality scoring
 * - Confidence assessment
 * - Error recovery with alternatives
 */

const GooglePlacesService = require('../../services/googlePlacesService');

class PlacesValidationAgent {
  constructor(placesService, db) {
    // Accept GooglePlacesService instance directly (already initialized by ValidationOrchestrator)
    this.placesService = placesService;
    this.db = db;
    this.validationStats = {
      attempted: 0,
      validated: 0,
      notFound: 0,
      ambiguous: 0,
      errors: 0
    };
  }

  /**
   * Main validation method - validates a single discovered place
   */
  async validatePlace(discoveredPlace, city, context = {}) {
    this.validationStats.attempted++;

    try {
      console.log(`🔍 Validating: "${discoveredPlace.name}" in ${city}`);

      // STEP 1: Search for the place
      const searchQuery = this.buildSearchQuery(discoveredPlace, city);
      const searchResults = await this.placesService.textSearch(
        searchQuery,
        context.nearLocation
      );

      if (searchResults.length === 0) {
        console.log(`  ✗ Not found: "${discoveredPlace.name}"`);
        this.validationStats.notFound++;

        return {
          valid: false,
          status: 'not_found',
          reason: 'Place not found in Google Places',
          originalPlace: discoveredPlace,
          confidence: 0
        };
      }

      // STEP 2: Find best match
      const bestMatch = this.findBestMatch(discoveredPlace, searchResults, city);

      if (!bestMatch || bestMatch.confidence < 0.5) {
        console.log(`  ⚠️  Ambiguous match for "${discoveredPlace.name}"`);
        this.validationStats.ambiguous++;

        return {
          valid: false,
          status: 'ambiguous',
          reason: 'Multiple possible matches, confidence too low',
          originalPlace: discoveredPlace,
          candidates: searchResults.slice(0, 3),
          confidence: bestMatch?.confidence || 0
        };
      }

      // STEP 3: Get detailed information
      const details = await this.placesService.getPlaceDetails(bestMatch.place.place_id);

      if (!details) {
        this.validationStats.errors++;
        return {
          valid: false,
          status: 'error',
          reason: 'Failed to fetch place details',
          originalPlace: discoveredPlace,
          confidence: 0
        };
      }

      // STEP 4: Enrich with all data
      const enrichedPlace = this.enrichPlace(discoveredPlace, bestMatch.place, details);

      // STEP 5: Calculate quality score
      enrichedPlace.qualityScore = this.calculateQualityScore(enrichedPlace);

      // STEP 6: Save to validated places registry
      await this.saveValidatedPlace(enrichedPlace, context.itineraryId);

      console.log(`  ✓ Validated: "${enrichedPlace.verifiedName}" (confidence: ${(bestMatch.confidence * 100).toFixed(0)}%, quality: ${enrichedPlace.qualityScore.toFixed(2)})`);

      this.validationStats.validated++;

      return {
        valid: true,
        status: 'validated',
        place: enrichedPlace,
        confidence: bestMatch.confidence,
        matchScore: bestMatch.score
      };

    } catch (error) {
      console.error(`  ✗ Error validating "${discoveredPlace.name}":`, error.message);
      this.validationStats.errors++;

      return {
        valid: false,
        status: 'error',
        reason: error.message,
        originalPlace: discoveredPlace,
        confidence: 0
      };
    }
  }

  /**
   * Batch validate multiple places
   */
  async batchValidate(discoveredPlaces, city, context = {}) {
    console.log(`\n🔍 Batch validating ${discoveredPlaces.length} places in ${city}...`);

    const results = {
      validated: [],
      notFound: [],
      ambiguous: [],
      errors: [],
      stats: {}
    };

    // Validate with controlled concurrency (5 at a time to respect rate limits)
    const batchSize = 5;

    for (let i = 0; i < discoveredPlaces.length; i += batchSize) {
      const batch = discoveredPlaces.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(place =>
          this.validatePlace(place, city, context)
            .catch(error => ({
              valid: false,
              status: 'error',
              reason: error.message,
              originalPlace: place
            }))
        )
      );

      // Categorize results
      batchResults.forEach(result => {
        if (result.valid) {
          results.validated.push(result.place);
        } else if (result.status === 'not_found') {
          results.notFound.push(result.originalPlace);
        } else if (result.status === 'ambiguous') {
          results.ambiguous.push({
            original: result.originalPlace,
            candidates: result.candidates
          });
        } else {
          results.errors.push({
            original: result.originalPlace,
            error: result.reason
          });
        }
      });

      // Rate limiting: wait 200ms between batches
      if (i + batchSize < discoveredPlaces.length) {
        await this.sleep(200);
      }
    }

    // Calculate stats
    results.stats = {
      total: discoveredPlaces.length,
      validated: results.validated.length,
      notFound: results.notFound.length,
      ambiguous: results.ambiguous.length,
      errors: results.errors.length,
      validationRate: results.validated.length / discoveredPlaces.length,
      averageQuality: results.validated.reduce((sum, p) => sum + p.qualityScore, 0) / results.validated.length || 0
    };

    console.log(`\n✓ Batch validation complete:`);
    console.log(`  - Validated: ${results.validated.length}/${discoveredPlaces.length} (${(results.stats.validationRate * 100).toFixed(0)}%)`);
    console.log(`  - Not found: ${results.notFound.length}`);
    console.log(`  - Ambiguous: ${results.ambiguous.length}`);
    console.log(`  - Errors: ${results.errors.length}`);
    console.log(`  - Avg quality: ${results.stats.averageQuality.toFixed(2)}`);

    return results;
  }

  /**
   * Build search query from discovered place
   */
  buildSearchQuery(place, city) {
    // Try exact name + city first
    let query = `${place.name} ${city}`;

    // Add address if available
    if (place.address && !place.address.includes(city)) {
      query += ` ${place.address}`;
    }

    // Add type for disambiguation
    if (place.type) {
      query += ` ${place.type}`;
    }

    return query;
  }

  /**
   * Find best match from search results
   */
  findBestMatch(discoveredPlace, searchResults, city) {
    const scored = searchResults.map(result => {
      const score = this.calculateMatchScore(discoveredPlace, result, city);
      return { place: result, score, confidence: score.total };
    });

    // Sort by confidence
    scored.sort((a, b) => b.confidence - a.confidence);

    return scored[0];
  }

  /**
   * Calculate match score between discovered and found place
   */
  calculateMatchScore(discovered, found, city) {
    const scores = {};

    // Name similarity (most important)
    scores.name = this.nameSimilarity(discovered.name, found.name);

    // Address/location match
    if (discovered.address && found.formatted_address) {
      scores.address = this.addressSimilarity(discovered.address, found.formatted_address);
    } else {
      scores.address = 0.5; // Neutral if no address
    }

    // City match
    scores.city = found.formatted_address?.toLowerCase().includes(city.toLowerCase()) ? 1.0 : 0.5;

    // Type match
    if (discovered.type && found.types) {
      scores.type = this.typeSimilarity(discovered.type, found.types);
    } else {
      scores.type = 0.5;
    }

    // Business status (open/permanently closed)
    scores.status = found.business_status === 'OPERATIONAL' ? 1.0 : 0.0;

    // Weighted total
    scores.total = (
      scores.name * 0.5 +
      scores.address * 0.2 +
      scores.city * 0.1 +
      scores.type * 0.1 +
      scores.status * 0.1
    );

    return scores;
  }

  /**
   * Calculate name similarity using Levenshtein-like approach
   */
  nameSimilarity(name1, name2) {
    const n1 = this.normalizeName(name1);
    const n2 = this.normalizeName(name2);

    // Exact match
    if (n1 === n2) return 1.0;

    // Contains match
    if (n1.includes(n2) || n2.includes(n1)) return 0.9;

    // Word overlap
    const words1 = n1.split(/\s+/);
    const words2 = n2.split(/\s+/);
    const overlap = words1.filter(w => words2.includes(w)).length;
    const maxWords = Math.max(words1.length, words2.length);

    return overlap / maxWords;
  }

  normalizeName(name) {
    return name.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')    // Normalize spaces
      .trim();
  }

  addressSimilarity(addr1, addr2) {
    const n1 = addr1.toLowerCase();
    const n2 = addr2.toLowerCase();

    if (n1.includes(n2) || n2.includes(n1)) return 1.0;

    // Extract street numbers/names
    const num1 = addr1.match(/\d+/);
    const num2 = addr2.match(/\d+/);

    if (num1 && num2 && num1[0] === num2[0]) return 0.8;

    return 0.3;
  }

  typeSimilarity(discoveredType, foundTypes) {
    const normalizedDiscovered = discoveredType.toLowerCase().replace(/[_\s]+/g, '');

    for (const foundType of foundTypes) {
      const normalizedFound = foundType.toLowerCase().replace(/[_\s]+/g, '');

      if (normalizedDiscovered === normalizedFound) return 1.0;
      if (normalizedDiscovered.includes(normalizedFound) ||
          normalizedFound.includes(normalizedDiscovered)) return 0.8;
    }

    return 0.3;
  }

  /**
   * Enrich discovered place with validated data
   */
  enrichPlace(discovered, searchResult, details) {
    const openingHours = this.placesService.parseOpeningHours(details);
    const photos = this.placesService.extractPhotos(details, 5);

    return {
      // Original discovery data
      discoveredName: discovered.name,
      discoveredFrom: discovered.source || 'perplexity',
      discoveredDescription: discovered.description,
      discoveredType: discovered.type,
      estimatedCost: discovered.estimatedCost || discovered.admission,
      whySpecial: discovered.whySpecial || discovered.whyVisit,
      uniquenessScore: discovered.uniquenessScore,

      // Validated Google Places data
      placeId: searchResult.place_id,
      verifiedName: searchResult.name || details.name,
      formattedAddress: searchResult.formatted_address || details.formatted_address,

      coordinates: {
        lat: searchResult.geometry.location.lat,
        lng: searchResult.geometry.location.lng
      },

      // Ratings
      rating: searchResult.rating || details.rating,
      reviewCount: searchResult.user_ratings_total || details.user_ratings_total,
      priceLevel: searchResult.price_level !== undefined ? searchResult.price_level : details.price_level,

      // Opening hours
      openingHours: openingHours.weekdayText,
      openingHoursPeriods: openingHours.periods,
      isOpenNow: openingHours.isOpenNow,

      // Photos
      photos,
      primaryPhoto: photos[0]?.url || null,

      // Links
      googleMapsUrl: details.url,
      website: details.website,
      phone: details.formatted_phone_number || details.international_phone_number,

      // Reviews
      topReviews: (details.reviews || []).slice(0, 3).map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        relativeTime: r.relative_time_description
      })),

      // Metadata
      types: searchResult.types || details.types,
      businessStatus: searchResult.business_status || details.business_status,
      editorial: details.editorial_summary?.overview,

      // Validation metadata
      validatedAt: new Date().toISOString(),
      validationConfidence: 0.9 // Will be updated by caller
    };
  }

  /**
   * Calculate quality score for a validated place
   */
  calculateQualityScore(place) {
    let score = 0;
    let weight = 0;

    // Rating score (0-5 scale)
    if (place.rating) {
      score += (place.rating / 5) * 0.35;
      weight += 0.35;
    }

    // Review count score (log scale, more reviews = higher confidence)
    if (place.reviewCount) {
      const reviewScore = Math.min(Math.log10(place.reviewCount) / 4, 1); // Cap at 10,000 reviews
      score += reviewScore * 0.25;
      weight += 0.25;
    }

    // Uniqueness score from discovery
    if (place.uniquenessScore) {
      score += (place.uniquenessScore / 10) * 0.2;
      weight += 0.2;
    }

    // Data completeness score
    const dataScore = this.calculateDataCompleteness(place);
    score += dataScore * 0.2;
    weight += 0.2;

    // Normalize
    return weight > 0 ? score / weight : 0.5;
  }

  calculateDataCompleteness(place) {
    let complete = 0;
    let total = 0;

    const fields = [
      'formattedAddress', 'coordinates', 'rating', 'reviewCount',
      'openingHours', 'photos', 'website', 'phone', 'types'
    ];

    fields.forEach(field => {
      total++;
      if (place[field] && (Array.isArray(place[field]) ? place[field].length > 0 : true)) {
        complete++;
      }
    });

    return complete / total;
  }

  /**
   * Save validated place to database registry
   */
  async saveValidatedPlace(place, itineraryId) {
    try {
      await this.db.query(`
        INSERT INTO validated_places (
          place_id, discovered_name, discovered_from,
          verified_name, formatted_address, coordinates,
          rating, review_count, price_level,
          opening_hours, is_open_now, photos,
          google_maps_url, website, phone,
          types, business_status,
          validation_status, validation_confidence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (place_id) DO UPDATE SET
          verified_name = $4,
          formatted_address = $5,
          coordinates = $6,
          rating = $7,
          review_count = $8,
          price_level = $9,
          opening_hours = $10,
          is_open_now = $11,
          photos = $12,
          google_maps_url = $13,
          website = $14,
          phone = $15,
          types = $16,
          business_status = $17,
          last_checked_at = NOW(),
          used_count = validated_places.used_count + 1,
          last_used_at = NOW(),
          updated_at = NOW()
      `, [
        place.placeId,
        place.discoveredName,
        place.discoveredFrom,
        place.verifiedName,
        place.formattedAddress,
        JSON.stringify(place.coordinates),
        place.rating,
        place.reviewCount,
        place.priceLevel,
        JSON.stringify(place.openingHours),
        place.isOpenNow,
        JSON.stringify(place.photos),
        place.googleMapsUrl,
        place.website,
        place.phone,
        JSON.stringify(place.types),
        place.businessStatus,
        'valid',
        place.validationConfidence
      ]);

      // Log validation history
      if (itineraryId) {
        await this.db.query(`
          INSERT INTO place_validation_history (
            itinerary_id, discovered_name, place_id,
            validation_status, confidence_score, validated_data
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          itineraryId,
          place.discoveredName,
          place.placeId,
          'found',
          place.validationConfidence,
          JSON.stringify(place)
        ]);
      }

    } catch (error) {
      console.error('Failed to save validated place:', error.message);
    }
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return {
      ...this.validationStats,
      validationRate: this.validationStats.attempted > 0
        ? this.validationStats.validated / this.validationStats.attempted
        : 0
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = PlacesValidationAgent;
