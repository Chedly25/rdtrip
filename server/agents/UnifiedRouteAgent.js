/**
 * Unified Route Agent - Single Intelligent Workflow for Route Generation
 *
 * Replaces the multi-agent approach (adventure, culture, food, hidden-gems)
 * with ONE sophisticated workflow that creates ONE optimal route based on
 * user preferences.
 *
 * 6-Phase Workflow:
 * 1. Research: Analyze the corridor between origin and destination
 * 2. Discovery: Find perfect stops based on user interests & companions
 * 3. Planning: Optimize route order and night allocations
 * 4. Enrichment: Add activities, restaurants, and hotels
 * 5. Validation: Verify feasibility and quality
 * 6. Optimization: Final refinements for the perfect trip
 */

const axios = require('axios');
const GooglePlacesService = require('../services/googlePlacesService');
const PersonalizationContentAgent = require('./PersonalizationContentAgent');

class UnifiedRouteAgent {
  constructor(db, googleApiKey) {
    this.db = db;
    this.googlePlacesService = new GooglePlacesService(googleApiKey, db);
    this.personalizationContentAgent = new PersonalizationContentAgent();
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  }

  /**
   * Main entry point: Generate a complete route based on user preferences
   */
  async generateRoute({
    origin,
    destination,
    totalNights,
    tripPace,
    budget,
    preferences,
    onProgress
  }) {
    console.log(`\n🎯 ========================================`);
    console.log(`   UNIFIED ROUTE AGENT - Starting Generation`);
    console.log(`   ========================================`);
    console.log(`   Origin: ${origin.name}, ${origin.country}`);
    console.log(`   Destination: ${destination.name}, ${destination.country}`);
    console.log(`   Duration: ${totalNights} nights (${tripPace})`);
    console.log(`   Budget: ${budget}`);
    console.log(`   Companions: ${preferences.companions}`);
    console.log(`   Interests: ${preferences.interests.map(i => `${i.id}(${i.weight})`).join(', ')}`);
    console.log(`   Trip Style: ${preferences.tripStyle}/100`);

    const startTime = Date.now();

    try {
      // PHASE 1: Research
      this.updateProgress(onProgress, 'research', 5, 'Analyzing route corridor...');
      const research = await this.phaseResearch(origin, destination, totalNights, tripPace);

      // PHASE 2: Discovery
      this.updateProgress(onProgress, 'discovery', 25, 'Finding perfect stops based on your interests...');
      const discovery = await this.phaseDiscovery(
        origin,
        destination,
        research,
        preferences,
        budget,
        totalNights,
        tripPace
      );

      // PHASE 3: Planning
      this.updateProgress(onProgress, 'planning', 50, 'Optimizing route order and timing...');
      const planned = await this.phasePlanning(
        origin,
        destination,
        discovery,
        totalNights,
        tripPace,
        preferences
      );

      // PHASE 4: Enrichment
      this.updateProgress(onProgress, 'enrichment', 70, 'Adding activities, restaurants, and hotels...');
      const enriched = await this.phaseEnrichment(
        planned,
        preferences,
        budget
      );

      // PHASE 5: Validation
      this.updateProgress(onProgress, 'validation', 85, 'Verifying feasibility...');
      const validated = await this.phaseValidation(enriched, preferences);

      // PHASE 6: Optimization
      this.updateProgress(onProgress, 'optimization', 90, 'Final refinements...');
      const optimized = await this.phaseOptimization(validated, preferences);

      // PHASE 7: Personalization Content (if user has personalization)
      let personalizedContent = null;
      if (preferences.personalization) {
        this.updateProgress(onProgress, 'personalizing', 95, 'Creating your personalized story...');
        try {
          personalizedContent = await this.personalizationContentAgent.generate({
            routeData: { origin, destination, waypoints: optimized.cities },
            personalization: preferences.personalization,
            dayStructure: { totalDays: totalNights + 1, days: this.buildDayStructureFromRoute(optimized, totalNights) },
            activities: this.extractActivitiesFromRoute(optimized),
            restaurants: this.extractRestaurantsFromRoute(optimized)
          });
          console.log(`   ✓ Personalization content generated`);
        } catch (error) {
          console.warn(`   ⚠️ Personalization content failed:`, error.message);
          // Continue without personalized content
        }
      }

      // Complete
      this.updateProgress(onProgress, 'completed', 100, 'Route generation complete!');

      const duration = (Date.now() - startTime) / 1000;
      console.log(`\n✅ Route generated in ${duration.toFixed(1)}s`);

      return {
        id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        origin,
        destination,
        totalNights,
        tripPace,
        budget,
        preferences,
        route: optimized,
        // Include original personalization input for frontend display
        personalization: preferences.personalization || null,
        // Include AI-generated personalization content in response
        personalizedIntro: personalizedContent?.personalizedIntro || null,
        dayThemes: personalizedContent?.dayThemes || null,
        tripStyleProfile: personalizedContent?.tripStyleProfile || null,
        tripNarrative: personalizedContent?.tripNarrative || null,
        metadata: {
          generatedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          phases: ['research', 'discovery', 'planning', 'enrichment', 'validation', 'optimization', 'personalizing'],
          hasPersonalization: !!personalizedContent
        }
      };

    } catch (error) {
      console.error(`\n❌ Route generation failed:`, error);
      throw error;
    }
  }

  /**
   * Update progress callback
   */
  updateProgress(onProgress, phase, percentComplete, message) {
    console.log(`\n📍 Phase: ${phase} (${percentComplete}%) - ${message}`);
    if (onProgress) {
      onProgress({
        phase,
        percentComplete,
        message,
        estimatedTimeRemaining: Math.round((100 - percentComplete) * 200) // Rough estimate
      });
    }
  }

  /**
   * PHASE 1: Research
   * Analyze the corridor between origin and destination
   */
  async phaseResearch(origin, destination, totalNights, tripPace) {
    console.log(`   → Researching route corridor...`);

    // Calculate distance and corridor
    const distance = this.calculateDistance(
      origin.coordinates,
      destination.coordinates
    );

    // Determine corridor width based on distance
    const corridorWidth = Math.min(200, distance * 0.15); // 15% of distance, max 200km

    // Determine number of stops based on pace and nights
    const stopsMap = {
      'leisurely': { min: 2, nightsPerStop: 4 },
      'balanced': { min: 3, nightsPerStop: 3 },
      'fast-paced': { min: 4, nightsPerStop: 2 }
    };

    const paceConfig = stopsMap[tripPace] || stopsMap['balanced'];
    const numStops = Math.max(
      paceConfig.min,
      Math.ceil(totalNights / paceConfig.nightsPerStop)
    );

    // Identify key regions along the route
    const regions = await this.identifyRegions(origin, destination, distance);

    console.log(`   ✓ Research complete:`);
    console.log(`     - Distance: ${Math.round(distance)}km`);
    console.log(`     - Corridor width: ${Math.round(corridorWidth)}km`);
    console.log(`     - Recommended stops: ${numStops}`);
    console.log(`     - Regions: ${regions.length}`);

    return {
      distance,
      corridorWidth,
      numStops,
      regions,
      nightsPerStop: paceConfig.nightsPerStop
    };
  }

  /**
   * PHASE 2: Discovery
   * Find perfect stops based on user interests
   */
  async phaseDiscovery(origin, destination, research, preferences, budget, totalNights, tripPace) {
    console.log(`   → Discovering stops based on interests...`);

    // Build interest-weighted prompt
    const interestPrompt = this.buildInterestPrompt(preferences);
    const companionContext = this.getCompanionContext(preferences.companions);
    const styleContext = this.getStyleContext(preferences.tripStyle);

    const prompt = `You are an expert road trip planner. Plan a ${totalNights}-night ${tripPace} road trip from ${origin.name}, ${origin.country} to ${destination.name}, ${destination.country}.

USER PROFILE:
- Traveling: ${companionContext}
- Interests (weighted by importance): ${interestPrompt}
- Travel style: ${styleContext}
- Budget level: ${budget}

REQUIREMENTS:
1. Suggest EXACTLY ${research.numStops} cities/towns between origin and destination
2. Each stop MUST align with the user's weighted interests
3. Stops must form a logical driving route
4. Consider the corridor of approximately ${Math.round(research.corridorWidth)}km from the direct route
5. Avoid suggesting cities that are too close together

For each stop, explain WHY it matches the user's interests.

Return ONLY valid JSON:
{
  "stops": [
    {
      "name": "City Name",
      "country": "Country",
      "coordinates": [lat, lng],
      "relevance_score": 0.95,
      "interest_matches": ["interest_id_1", "interest_id_2"],
      "why_this_stop": "Brief explanation of why this perfectly matches user interests",
      "highlights": ["Thing 1", "Thing 2", "Thing 3"],
      "recommended_nights": 2
    }
  ],
  "route_narrative": "Brief story of this route and why it's perfect for this traveler"
}`;

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are an expert travel planner. Return ONLY valid JSON with no markdown.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.4
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      const content = response.data.choices[0].message.content;
      const parsed = this.parseJSON(content);

      console.log(`   ✓ Discovery complete: ${parsed.stops?.length || 0} stops found`);

      return {
        stops: parsed.stops || [],
        narrative: parsed.route_narrative || ''
      };

    } catch (error) {
      console.error(`   ⚠️ Discovery error:`, error.message);
      // Return fallback
      return { stops: [], narrative: '' };
    }
  }

  /**
   * PHASE 3: Planning
   * Optimize route order and allocate nights
   */
  async phasePlanning(origin, destination, discovery, totalNights, tripPace, preferences) {
    console.log(`   → Planning optimal route order...`);

    // Validate and enrich each stop with Google Places
    const validatedStops = [];

    for (const stop of discovery.stops) {
      try {
        const validated = await this.validateCity(stop);
        if (validated) {
          validatedStops.push({
            ...stop,
            ...validated,
            validated: true
          });
        }
      } catch (error) {
        console.log(`   ⚠️ Could not validate: ${stop.name}`);
      }
    }

    console.log(`   ✓ Validated ${validatedStops.length}/${discovery.stops.length} stops`);

    // Optimize route order using nearest neighbor
    const optimizedStops = this.optimizeStopOrder(
      origin.coordinates,
      destination.coordinates,
      validatedStops
    );

    // Allocate nights based on relevance and city importance
    const allocatedStops = this.allocateNights(
      optimizedStops,
      totalNights,
      tripPace,
      preferences
    );

    return {
      origin: {
        name: origin.name,
        country: origin.country,
        coordinates: origin.coordinates,
        nights: 0 // Origin is starting point
      },
      destination: {
        name: destination.name,
        country: destination.country,
        coordinates: destination.coordinates,
        nights: Math.max(1, Math.floor(totalNights * 0.2)) // 20% of trip at destination
      },
      waypoints: allocatedStops,
      narrative: discovery.narrative,
      totalDrivingKm: this.calculateTotalDistance(origin.coordinates, allocatedStops, destination.coordinates)
    };
  }

  /**
   * PHASE 4: Enrichment
   * Add activities, restaurants, and hotels
   */
  async phaseEnrichment(planned, preferences, budget) {
    console.log(`   → Enriching with activities and restaurants...`);

    const enrichedWaypoints = [];

    for (const waypoint of planned.waypoints) {
      try {
        // Get activities based on interests
        const activities = await this.getActivitiesForStop(
          waypoint,
          preferences,
          budget
        );

        // Get restaurants
        const restaurants = await this.getRestaurantsForStop(
          waypoint,
          preferences,
          budget
        );

        // Get hotels
        const hotels = await this.getHotelsForStop(
          waypoint,
          budget
        );

        enrichedWaypoints.push({
          ...waypoint,
          activities: activities.slice(0, 5),
          restaurants: restaurants.slice(0, 3),
          hotels: hotels.slice(0, 3)
        });

      } catch (error) {
        console.log(`   ⚠️ Enrichment partial for: ${waypoint.name}`);
        enrichedWaypoints.push(waypoint);
      }
    }

    console.log(`   ✓ Enrichment complete`);

    return {
      ...planned,
      waypoints: enrichedWaypoints
    };
  }

  /**
   * PHASE 5: Validation
   * Verify feasibility and quality
   */
  async phaseValidation(enriched, preferences) {
    console.log(`   → Validating route feasibility...`);

    // Check driving distances are reasonable
    const maxDailyDrive = 400; // km
    let issues = [];

    // Calculate segment distances
    const segments = [];
    let prevCoords = enriched.origin.coordinates;

    for (const waypoint of enriched.waypoints) {
      const distance = this.calculateDistance(prevCoords, waypoint.coordinates);
      segments.push({
        from: prevCoords,
        to: waypoint.coordinates,
        distance,
        toCity: waypoint.name
      });

      if (distance > maxDailyDrive) {
        issues.push(`Long drive to ${waypoint.name}: ${Math.round(distance)}km`);
      }

      prevCoords = waypoint.coordinates;
    }

    // Final segment to destination
    const finalDistance = this.calculateDistance(prevCoords, enriched.destination.coordinates);
    if (finalDistance > maxDailyDrive) {
      issues.push(`Long drive to ${enriched.destination.name}: ${Math.round(finalDistance)}km`);
    }

    // Validate total nights
    const totalAllocatedNights = enriched.waypoints.reduce((sum, w) => sum + (w.nights || 0), 0)
      + (enriched.destination.nights || 0);

    console.log(`   ✓ Validation complete:`);
    console.log(`     - Segments: ${segments.length}`);
    console.log(`     - Issues: ${issues.length}`);
    console.log(`     - Total nights allocated: ${totalAllocatedNights}`);

    return {
      ...enriched,
      validation: {
        segments,
        issues,
        totalAllocatedNights,
        isValid: issues.length === 0
      }
    };
  }

  /**
   * PHASE 6: Optimization
   * Final refinements
   */
  async phaseOptimization(validated, preferences) {
    console.log(`   → Final optimizations...`);

    // Add alternatives for long segments
    const optimizedWaypoints = validated.waypoints.map(waypoint => ({
      ...waypoint,
      // Generate unique ID for each waypoint
      id: `wp_${waypoint.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
    }));

    // Calculate total metrics
    const metrics = {
      totalCities: optimizedWaypoints.length + 2, // Including origin and destination
      totalNights: validated.validation.totalAllocatedNights,
      totalDrivingKm: validated.totalDrivingKm,
      interestCoverage: this.calculateInterestCoverage(optimizedWaypoints, preferences),
      qualityScore: this.calculateQualityScore(validated, preferences)
    };

    console.log(`   ✓ Optimization complete:`);
    console.log(`     - Quality score: ${metrics.qualityScore}/100`);
    console.log(`     - Interest coverage: ${Math.round(metrics.interestCoverage * 100)}%`);

    return {
      origin: validated.origin,
      destination: validated.destination,
      waypoints: optimizedWaypoints,
      narrative: validated.narrative,
      metrics,
      validation: validated.validation
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Build interest prompt from user preferences
   */
  buildInterestPrompt(preferences) {
    const sorted = [...preferences.interests].sort((a, b) => b.weight - a.weight);
    return sorted.map(i => {
      const stars = '★'.repeat(i.weight);
      return `${i.id} (${stars})`;
    }).join(', ');
  }

  /**
   * Get companion context
   */
  getCompanionContext(companions) {
    const contexts = {
      'solo': 'Solo traveler - flexible, seeking authentic experiences',
      'couple': 'Couple - romantic spots, quality dining, scenic views',
      'family-young-kids': 'Family with young kids - family-friendly, not too much walking, playgrounds',
      'family-teens': 'Family with teenagers - active, adventure, social spots',
      'friends': 'Group of friends - nightlife, group activities, fun experiences',
      'group': 'Large group - group-friendly venues, varied interests'
    };
    return contexts[companions] || 'General traveler';
  }

  /**
   * Get style context
   */
  getStyleContext(tripStyle) {
    if (tripStyle <= 25) return 'Prefers relaxation - spas, beaches, leisurely pace';
    if (tripStyle <= 50) return 'Balanced - mix of activities and downtime';
    if (tripStyle <= 75) return 'Active explorer - packed itinerary, see everything';
    return 'Extreme explorer - adventure activities, off-the-beaten-path';
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coords1, coords2) {
    const [lat1, lon1] = coords1;
    const [lat2, lon2] = coords2;

    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Identify key regions along the route
   */
  async identifyRegions(origin, destination, distance) {
    // Simple region identification based on waypoints
    const numRegions = Math.ceil(distance / 300); // One region per 300km
    const regions = [];

    for (let i = 1; i <= numRegions; i++) {
      const ratio = i / (numRegions + 1);
      const lat = origin.coordinates[0] + (destination.coordinates[0] - origin.coordinates[0]) * ratio;
      const lng = origin.coordinates[1] + (destination.coordinates[1] - origin.coordinates[1]) * ratio;
      regions.push({ coordinates: [lat, lng], index: i });
    }

    return regions;
  }

  /**
   * Parse JSON from AI response
   */
  parseJSON(content) {
    try {
      // Remove markdown code blocks if present
      let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleaned = cleaned.trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('JSON parse error:', error.message);
      return { stops: [] };
    }
  }

  /**
   * Validate city with Google Places
   */
  async validateCity(stop) {
    try {
      const result = await this.googlePlacesService.textSearch(
        `${stop.name}, ${stop.country}`
      );

      if (result && result.length > 0) {
        const place = result[0];
        return {
          placeId: place.place_id,
          coordinates: [place.geometry.location.lat, place.geometry.location.lng],
          formattedAddress: place.formatted_address,
          photo: place.photos?.[0]?.photo_reference
        };
      }
      return null;
    } catch (error) {
      console.error(`Validation error for ${stop.name}:`, error.message);
      return null;
    }
  }

  /**
   * Optimize stop order using nearest neighbor
   */
  optimizeStopOrder(originCoords, destCoords, stops) {
    if (stops.length <= 1) return stops;

    // Simple nearest neighbor starting from origin
    const remaining = [...stops];
    const ordered = [];
    let currentPos = originCoords;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const dist = this.calculateDistance(currentPos, remaining[i].coordinates);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      const nearest = remaining.splice(nearestIdx, 1)[0];
      ordered.push(nearest);
      currentPos = nearest.coordinates;
    }

    return ordered;
  }

  /**
   * Allocate nights to stops
   */
  allocateNights(stops, totalNights, tripPace, preferences) {
    if (stops.length === 0) return stops;

    // Reserve nights for destination (20%)
    const destinationNights = Math.max(1, Math.floor(totalNights * 0.2));
    const remainingNights = totalNights - destinationNights;

    // Distribute based on relevance scores
    const totalRelevance = stops.reduce((sum, s) => sum + (s.relevance_score || 0.5), 0);

    return stops.map(stop => {
      const ratio = (stop.relevance_score || 0.5) / totalRelevance;
      let nights = Math.round(remainingNights * ratio);

      // Enforce minimum/maximum
      const minNights = tripPace === 'fast-paced' ? 1 : 2;
      const maxNights = tripPace === 'leisurely' ? 5 : 3;
      nights = Math.max(minNights, Math.min(maxNights, nights));

      return { ...stop, nights };
    });
  }

  /**
   * Calculate total driving distance
   */
  calculateTotalDistance(originCoords, waypoints, destCoords) {
    let total = 0;
    let prev = originCoords;

    for (const wp of waypoints) {
      total += this.calculateDistance(prev, wp.coordinates);
      prev = wp.coordinates;
    }

    total += this.calculateDistance(prev, destCoords);
    return Math.round(total);
  }

  /**
   * Get activities for a stop
   */
  async getActivitiesForStop(waypoint, preferences, budget) {
    try {
      // Build search based on top interests
      const topInterests = preferences.interests
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map(i => i.id);

      const activities = [];

      for (const interest of topInterests) {
        const type = this.interestToPlaceType(interest);
        if (type) {
          const results = await this.googlePlacesService.nearbySearch(
            waypoint.coordinates[0],
            waypoint.coordinates[1],
            5000, // 5km radius
            type
          );

          if (results && results.length > 0) {
            activities.push(...results.slice(0, 2).map(r => ({
              name: r.name,
              type: interest,
              rating: r.rating,
              placeId: r.place_id
            })));
          }
        }
      }

      return activities;
    } catch (error) {
      console.error(`Error getting activities for ${waypoint.name}:`, error.message);
      return [];
    }
  }

  /**
   * Get restaurants for a stop
   */
  async getRestaurantsForStop(waypoint, preferences, budget) {
    try {
      const priceLevel = budget === 'budget' ? 1 : budget === 'mid' ? 2 : 3;

      const results = await this.googlePlacesService.nearbySearch(
        waypoint.coordinates[0],
        waypoint.coordinates[1],
        3000,
        'restaurant'
      );

      if (results) {
        return results
          .filter(r => !r.price_level || r.price_level <= priceLevel + 1)
          .slice(0, 3)
          .map(r => ({
            name: r.name,
            rating: r.rating,
            priceLevel: r.price_level,
            placeId: r.place_id
          }));
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get hotels for a stop
   */
  async getHotelsForStop(waypoint, budget) {
    try {
      const results = await this.googlePlacesService.nearbySearch(
        waypoint.coordinates[0],
        waypoint.coordinates[1],
        5000,
        'lodging'
      );

      if (results) {
        return results.slice(0, 3).map(r => ({
          name: r.name,
          rating: r.rating,
          placeId: r.place_id
        }));
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Map interest to Google Places type
   */
  interestToPlaceType(interest) {
    const mapping = {
      'hiking': 'park',
      'beaches': 'natural_feature',
      'mountains': 'natural_feature',
      'wildlife': 'zoo',
      'gardens': 'park',
      'museums': 'museum',
      'architecture': 'tourist_attraction',
      'history': 'museum',
      'art': 'art_gallery',
      'local-culture': 'tourist_attraction',
      'local-cuisine': 'restaurant',
      'fine-dining': 'restaurant',
      'wine-beer': 'bar',
      'street-food': 'restaurant',
      'markets': 'shopping_mall',
      'nightlife': 'night_club',
      'adventure': 'amusement_park',
      'photography': 'tourist_attraction',
      'wellness': 'spa',
      'off-beaten-path': 'tourist_attraction'
    };

    return mapping[interest] || 'tourist_attraction';
  }

  /**
   * Calculate interest coverage
   */
  calculateInterestCoverage(waypoints, preferences) {
    const userInterests = new Set(preferences.interests.map(i => i.id));
    const coveredInterests = new Set();

    for (const wp of waypoints) {
      if (wp.interest_matches) {
        wp.interest_matches.forEach(i => coveredInterests.add(i));
      }
    }

    const intersection = [...userInterests].filter(i => coveredInterests.has(i));
    return intersection.length / userInterests.size;
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(validated, preferences) {
    let score = 50; // Base score

    // Bonus for no validation issues
    if (validated.validation.issues.length === 0) score += 20;

    // Bonus for validated waypoints
    const validatedCount = validated.waypoints.filter(w => w.validated).length;
    score += (validatedCount / validated.waypoints.length) * 20;

    // Bonus for interest coverage
    const coverage = this.calculateInterestCoverage(validated.waypoints, preferences);
    score += coverage * 10;

    return Math.min(100, Math.round(score));
  }

  /**
   * Build day structure from optimized route for PersonalizationContentAgent
   */
  buildDayStructureFromRoute(optimized, totalNights) {
    if (!optimized || !optimized.cities) return [];

    const days = [];
    let dayNum = 1;

    for (const city of optimized.cities) {
      const nights = city.nights || 1;

      // Create a day entry for each night + 1 for first day activities
      for (let n = 0; n < nights; n++) {
        days.push({
          day: dayNum++,
          date: new Date(Date.now() + (dayNum - 1) * 86400000).toISOString().split('T')[0],
          location: city.name || city.city,
          theme: city.theme || `Exploring ${city.name || city.city}`,
          overnight: city.name || city.city
        });
      }
    }

    return days;
  }

  /**
   * Extract activities from optimized route for PersonalizationContentAgent
   */
  extractActivitiesFromRoute(optimized) {
    if (!optimized || !optimized.cities) return [];

    return optimized.cities.map((city, idx) => ({
      day: idx + 1,
      city: city.name || city.city,
      activities: city.activities || []
    }));
  }

  /**
   * Extract restaurants from optimized route for PersonalizationContentAgent
   */
  extractRestaurantsFromRoute(optimized) {
    if (!optimized || !optimized.cities) return [];

    return optimized.cities.map((city, idx) => ({
      day: idx + 1,
      city: city.name || city.city,
      meals: city.restaurants || {}
    }));
  }
}

module.exports = UnifiedRouteAgent;
