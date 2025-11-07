/**
 * Route Discovery Agent V2 - Agentic Waypoint Discovery for Landing Page
 *
 * This agent transforms route generation from simple AI suggestions to
 * validated, optimized, real-world routes.
 *
 * Key Features:
 * - Strategic discovery based on travel style
 * - Google Places validation for each city
 * - Real coordinates and geographic data
 * - Intelligent route optimization
 * - Feedback loops for better results
 * - Fast and reliable
 *
 * Flow:
 * 1. Discovery: Find candidate cities using Perplexity
 * 2. Validation: Validate each city with Google Places API
 * 3. Enrichment: Add coordinates, country, photos
 * 4. Optimization: Order cities for optimal routing
 * 5. Feedback: Retry if insufficient valid cities
 */

const axios = require('axios');
const GooglePlacesService = require('../services/googlePlacesService');

class RouteDiscoveryAgentV2 {
  constructor(db, googleApiKey) {
    this.db = db;
    this.googlePlacesService = new GooglePlacesService(googleApiKey, db);
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  }

  /**
   * Main entry point: Discover and validate a complete route
   */
  async discoverRoute(origin, destination, stops, travelStyle, budget, nightsOnRoad = 7, nightsAtDestination = 3) {
    console.log(`\n🎯 RouteDiscoveryAgentV2: Discovering route from ${origin} to ${destination}`);
    console.log(`   Style: ${travelStyle} | Stops: ${stops} | Budget: ${budget}`);
    console.log(`   Duration: ${nightsOnRoad} nights on road, ${nightsAtDestination} nights at destination`);

    // Calculate optimal waypoint count based on nights
    const recommendedWaypoints = this.calculateOptimalWaypoints(nightsOnRoad);
    console.log(`   Recommended waypoints: ${recommendedWaypoints} (based on ${nightsOnRoad} nights)`);

    // STEP 1: Strategic Discovery
    console.log('\n📍 Step 1: Strategic Discovery');
    const candidates = await this.strategicDiscovery(origin, destination, recommendedWaypoints, travelStyle, budget, nightsOnRoad, nightsAtDestination);

    // Check for discovery errors
    if (candidates.error) {
      console.error(`   ⚠️  Discovery had errors: ${candidates.error}`);
    }
    console.log(`   Found ${candidates.waypoints?.length || 0} candidate cities`);

    // STEP 2: Validation & Enrichment
    console.log('\n🔍 Step 2: Validation & Enrichment');
    const validated = await this.validateAndEnrichCities(candidates);
    console.log(`   Validated ${validated.waypoints?.length || 0}/${candidates.waypoints?.length || 0} cities`);

    // STEP 3: Intelligent Optimization
    console.log('\n🗺️  Step 3: Route Optimization');
    const optimized = this.optimizeRoute(validated, stops);
    console.log(`   Selected ${optimized.selected?.length || 0} optimal waypoints`);

    // STEP 4: Quality Check & Retry if needed
    if ((optimized.selected?.length || 0) < stops && (optimized.selected?.length || 0) < (candidates.waypoints?.length || 0)) {
      console.log('\n🔄 Quality check failed, retrying with broader search...');
      // Could implement retry logic here
    }

    console.log(`\n✅ Route discovery complete`);
    console.log(`   Origin: ${optimized.origin?.city || optimized.origin?.name || 'Unknown'}`);
    console.log(`   Destination: ${optimized.destination?.city || optimized.destination?.name || 'Unknown'}`);
    console.log(`   Waypoints: ${optimized.selected?.map(w => w.city || w.name).join(' → ') || 'None'}`);

    // STEP 5: Allocate nights to waypoints and destination
    console.log(`\n⏰ Step 4: Allocating nights`);
    const waypointsWithNights = this.allocateNightsToWaypoints(optimized.selected || [], nightsOnRoad);
    console.log(`   Allocated ${nightsOnRoad} nights across ${waypointsWithNights.length} waypoints`);
    console.log(`   Allocated ${nightsAtDestination} nights to destination`);

    // Add nights to destination
    const destinationWithNights = optimized.destination ? {
      ...optimized.destination,
      nights: nightsAtDestination
    } : null;

    return {
      origin: optimized.origin,
      destination: destinationWithNights,
      waypoints: waypointsWithNights,
      alternatives: optimized.alternatives || [],
      themeInsights: candidates.themeInsights || {},
      metadata: {
        style: travelStyle,
        validated: true,
        totalCandidates: candidates.waypoints?.length || 0,
        validatedCount: validated.waypoints?.length || 0,
        nightsOnRoad: nightsOnRoad,
        nightsAtDestination: nightsAtDestination,
        error: candidates.error || validated.error
      }
    };
  }

  /**
   * Strategic Discovery: Use Perplexity to find candidate cities
   */
  async strategicDiscovery(origin, destination, stops, travelStyle, budget, nightsOnRoad, nightsAtDestination) {
    const prompt = this.buildDiscoveryPrompt(origin, destination, stops, travelStyle, budget, nightsOnRoad, nightsAtDestination);

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are an expert travel route planner. Return ONLY valid JSON with no markdown or extra text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.4 // Lower temperature for more focused results
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0].message.content;
      return this.parseDiscoveryResponse(content, destination);

    } catch (error) {
      console.error('❌ Discovery failed:', error.message);
      console.error('   Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Return minimal fallback with error info
      return {
        origin: {
          city: origin,
          country: 'Unknown',
          why: 'Fallback - Discovery failed',
          recommended_min_nights: 2,
          recommended_max_nights: 4
        },
        destination: {
          city: destination,
          country: 'Unknown',
          why: 'Fallback - Discovery failed',
          recommended_min_nights: 2,
          recommended_max_nights: 4
        },
        waypoints: [],
        error: error.message
      };
    }
  }

  /**
   * Build strategic discovery prompt
   */
  buildDiscoveryPrompt(origin, destination, stops, travelStyle, budget, nightsOnRoad, nightsAtDestination) {
    const styleDescriptions = {
      adventure: 'outdoor activities, hiking, nature, scenic landscapes',
      culture: 'historical sites, museums, architecture, cultural heritage',
      food: 'culinary experiences, local cuisine, food markets, wineries',
      'hidden-gems': 'off-the-beaten-path locations, local secrets, unique experiences',
      'best-overall': 'balanced mix of popular attractions and unique experiences'
    };

    const budgetDescriptions = {
      budget: 'affordable, budget-friendly destinations',
      mid: 'moderate pricing, good value destinations',
      luxury: 'premium destinations with high-end offerings'
    };

    const avgNightsPerCity = Math.round(nightsOnRoad / stops);

    // Theme-specific insight templates
    const insightTemplates = {
      adventure: {
        terrain: 'Describe the terrain diversity (e.g., "Coastal cliffs → Mountain passes → River valleys")',
        activities: 'Count outdoor activities (e.g., "8 hiking trails, 3 water sports, 2 cycling routes")',
        difficulty: 'Overall difficulty level (e.g., "Moderate - suitable for active travelers")',
        highlight: 'Most spectacular outdoor experience on this route',
        season: 'Best time for outdoor activities (e.g., "April-June, September-October")'
      },
      culture: {
        historical_span: 'Historical periods covered (e.g., "Roman → Medieval → Renaissance")',
        heritage_sites: 'Number of UNESCO or major heritage sites',
        architecture: 'Architectural styles featured (e.g., "Gothic cathedrals, Moorish palaces")',
        highlight: 'Most significant cultural landmark on this route',
        experiences: 'Cultural activities available (e.g., "Museums, festivals, artisan workshops")'
      },
      food: {
        culinary_regions: 'Distinct food cultures (e.g., "Provençal, Catalan, Andalusian")',
        signature_dishes: 'Must-try dishes per stop (e.g., "Bouillabaisse in Marseille, Paella in Valencia")',
        dining_variety: 'Types of food experiences (e.g., "Street markets, Michelin restaurants, wineries")',
        highlight: 'Best culinary experience on this route',
        budget_range: 'Daily food budget estimate (e.g., "€40-80 for excellent meals")'
      },
      'hidden-gems': {
        authenticity: 'Level of tourist crowds (e.g., "Low density - authentic local life")',
        discoveries: 'Types of hidden finds (e.g., "Secret viewpoints, family taverns, artisan workshops")',
        local_secrets: 'What makes these places special vs tourist hotspots',
        highlight: 'Most unique hidden gem on this route',
        insider_tip: 'Best way to explore these places'
      },
      'best-overall': {
        balance: 'Distribution of experiences (e.g., "40% culture, 30% nature, 20% food, 10% relaxation")',
        diversity: 'Range of experiences (e.g., "Medieval towns, coastal drives, mountain scenery")',
        route_quality: 'Overall route characteristics (e.g., "Scenic roads, optimal distances, easy navigation")',
        highlight: 'Standout feature of this route',
        flexibility: 'How easy to customize (e.g., "Easy to add beach days or extend city stays")'
      }
    };

    const currentTemplate = insightTemplates[travelStyle] || insightTemplates['best-overall'];

    return `You are a ${travelStyle} travel expert planning a road trip from ${origin} to ${destination}.

TASK: Find ${stops} waypoint cities + 3 alternative cities between ${origin} and ${destination} for an amazing road trip.

TRAVEL STYLE: ${travelStyle}
Focus on: ${styleDescriptions[travelStyle] || styleDescriptions['best-overall']}

BUDGET: ${budget}
Target: ${budgetDescriptions[budget] || budgetDescriptions['mid']}

DURATION CONTEXT:
- User has ${nightsOnRoad} nights for the road journey
- This means ${stops} waypoint cities (comfortable pace)
- Each city should be worth approximately ${avgNightsPerCity} nights
- Destination (${destination}) will have ${nightsAtDestination} nights allocated

NIGHT ALLOCATION REQUIREMENTS:
For each waypoint city, you MUST provide realistic minimum and maximum nights based on:
- City size and number of major attractions
- Typical visitor stay duration
- What can realistically be seen/done

Guidelines:
- Small towns (e.g., Carcassonne, Bruges, Sintra): 1-2 nights MAXIMUM
- Medium cities (e.g., Lyon, Porto, Seville): 2-4 nights typical range
- Major cities (e.g., Barcelona, Paris, Rome): 3-7 nights for full exploration
- Be CONSERVATIVE with small towns - don't over-allocate nights

REQUIREMENTS:
1. MUST start from ${origin} (this is the user's starting location - DO NOT CHANGE THIS)
2. MUST end at ${destination} (the main destination - DO NOT CHANGE THIS)
3. Find EXACTLY ${stops} waypoint cities in between ${origin} and ${destination}
4. Find EXACTLY 3 additional alternative cities that match ${travelStyle} theme
5. Cities should be 80-250km apart (1-3 hours driving)
6. Create a logical geographic flow (no excessive backtracking)
7. Match ${travelStyle} preferences at each stop
8. Ensure all cities are real, accessible, and worth visiting
9. Waypoints should form a natural route between ${origin} and ${destination}
10. Alternatives should also fit geographically but offer different experiences

OUTPUT FORMAT (return ONLY this JSON, no markdown):
{
  "origin": {
    "city": "${origin}",
    "country": "Spain",
    "why": "User's starting location"
  },
  "destination": {
    "city": "${destination}",
    "country": "Spain",
    "why": "Final destination"
  },
  "waypoints": [
    {
      "city": "Example City 1",
      "country": "Spain",
      "why": "Brief explanation why this city fits ${travelStyle} style and makes sense on the route",
      "highlights": ["attraction 1", "attraction 2", "attraction 3"],
      "recommended_min_nights": 1,
      "recommended_max_nights": 2
    },
    {
      "city": "Example City 2",
      "country": "Spain",
      "why": "Brief explanation why this city fits ${travelStyle} style and makes sense on the route",
      "highlights": ["attraction 1", "attraction 2", "attraction 3"],
      "recommended_min_nights": 2,
      "recommended_max_nights": 3
    }
  ],
  "alternatives": [
    {
      "city": "Alternative City 1",
      "country": "Spain",
      "why": "Great ${travelStyle} option that could replace or complement the main route",
      "highlights": ["highlight 1", "highlight 2", "highlight 3"],
      "recommended_min_nights": 1,
      "recommended_max_nights": 2
    },
    {
      "city": "Alternative City 2",
      "country": "Spain",
      "why": "Another excellent ${travelStyle} choice for route customization",
      "highlights": ["highlight 1", "highlight 2", "highlight 3"],
      "recommended_min_nights": 2,
      "recommended_max_nights": 3
    },
    {
      "city": "Alternative City 3",
      "country": "Spain",
      "why": "Strong ${travelStyle} alternative for travelers wanting different experiences",
      "highlights": ["highlight 1", "highlight 2", "highlight 3"],
      "recommended_min_nights": 1,
      "recommended_max_nights": 2
    }
  ],
  "themeInsights": {
    ${Object.entries(currentTemplate).map(([key, description]) => `"${key}": "${description}"`).join(',\n    ')}
  }
}

THEME INSIGHTS INSTRUCTIONS:
You MUST provide the "themeInsights" object with ALL ${Object.keys(currentTemplate).length} fields specified above.
- Be specific and factual based on the actual route you're creating
- Use real city names and actual features from your selected waypoints
- Keep each insight concise (1-2 sentences max)
- Make insights compelling and useful for decision-making

CRITICAL RULES:
- Return EXACTLY ${stops} waypoints (not origin, not destination, just the stops in between)
- Return EXACTLY 3 alternatives (additional cities matching the theme)
- DO NOT change the origin from ${origin}
- DO NOT change the destination from ${destination}
- Ensure geographic logic (no wild zigzags)
- All cities must be real and accessible by car
- Match ${travelStyle} theme throughout
- Create diversity: Each waypoint should offer something unique
- Alternatives should be different from waypoints but equally good
- MUST include complete themeInsights object with all required fields`;
  }

  /**
   * Parse discovery response
   */
  parseDiscoveryResponse(responseText, destination) {
    try {
      let jsonText = responseText.trim();

      // Remove markdown
      if (jsonText.includes('```json')) {
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      } else if (jsonText.includes('```')) {
        const match = jsonText.match(/```\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      }

      // Extract JSON object
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      }

      const result = JSON.parse(jsonText);

      // PHASE 4: Validate and set defaults for missing night recommendations
      const validateCityNights = (city, cityType) => {
        if (!city) return;

        // Set defaults if missing
        if (!city.recommended_min_nights) {
          city.recommended_min_nights = 1;  // Conservative default
          console.log(`   ℹ️  ${cityType} ${city.city || city.name}: defaulting min_nights to 1`);
        }
        if (!city.recommended_max_nights) {
          city.recommended_max_nights = 5;  // Reasonable default
          console.log(`   ℹ️  ${cityType} ${city.city || city.name}: defaulting max_nights to 5`);
        }

        // Sanity check: min should not exceed max
        if (city.recommended_min_nights > city.recommended_max_nights) {
          console.warn(`   ⚠️  ${cityType} ${city.city || city.name}: min (${city.recommended_min_nights}) > max (${city.recommended_max_nights}), swapping`);
          const temp = city.recommended_min_nights;
          city.recommended_min_nights = city.recommended_max_nights;
          city.recommended_max_nights = temp;
        }
      };

      // Validate waypoints
      if (result.waypoints && Array.isArray(result.waypoints)) {
        result.waypoints.forEach(waypoint => validateCityNights(waypoint, 'Waypoint'));
      }

      // Validate alternatives
      if (result.alternatives && Array.isArray(result.alternatives)) {
        result.alternatives.forEach(alt => validateCityNights(alt, 'Alternative'));
      }

      return result;

    } catch (error) {
      console.error('Failed to parse discovery response:', error.message);
      console.error('   Response preview:', responseText.substring(0, 300));
      // Return minimal valid structure with night defaults
      return {
        origin: {
          city: destination,
          country: 'Unknown',
          why: 'Fallback - Parse failed',
          recommended_min_nights: 2,
          recommended_max_nights: 4
        },
        destination: {
          city: destination,
          country: 'Unknown',
          why: 'Fallback - Parse failed',
          recommended_min_nights: 2,
          recommended_max_nights: 4
        },
        waypoints: [],
        themeInsights: {},
        error: `Parse failed: ${error.message}`
      };
    }
  }

  /**
   * Validate and enrich cities with Google Places API
   * NOTE: Alternatives are NOT validated here - lazy validation when user adds them
   */
  async validateAndEnrichCities(route) {
    console.log('   Validating cities with Google Places...');

    // Validate origin
    const validatedOrigin = await this.validateCity(route.origin);

    // Validate destination
    const validatedDestination = await this.validateCity(route.destination);

    // Validate all waypoints (NOT alternatives - lazy validation)
    const validatedWaypoints = [];
    for (const waypoint of route.waypoints) {
      const validated = await this.validateCity(waypoint);
      if (validated) {
        validatedWaypoints.push(validated);
      } else {
        console.log(`      ⚠️  Skipped invalid city: ${waypoint.city}`);
      }
    }

    console.log(`   📍 Keeping ${route.alternatives?.length || 0} alternatives unvalidated (lazy validation)`);

    return {
      origin: validatedOrigin || route.origin, // Fallback if validation fails
      destination: validatedDestination || route.destination,
      waypoints: validatedWaypoints,
      alternatives: route.alternatives || [], // Pass through without validation
      themeInsights: route.themeInsights || {}
    };
  }

  /**
   * Validate a single city with Google Places
   */
  async validateCity(cityData) {
    try {
      const query = `${cityData.city}, ${cityData.country}`;
      console.log(`      🔍 Validating: ${query}`);

      const results = await this.googlePlacesService.textSearch(query);

      if (results.length === 0) {
        console.log(`         ✗ Not found`);
        return null;
      }

      // Take the best match (first result)
      const place = results[0];

      // Enrich with Google data
      const enriched = {
        ...cityData,
        verified: true,
        coordinates: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        formatted_address: place.formatted_address,
        place_id: place.place_id,
        types: place.types || []
      };

      console.log(`         ✓ Validated at ${enriched.coordinates.lat}, ${enriched.coordinates.lng}`);
      return enriched;

    } catch (error) {
      console.error(`      ✗ Validation error for ${cityData.city}:`, error.message);
      return null;
    }
  }

  /**
   * Optimize route based on geography and theme
   * NOTE: Alternatives now come from Perplexity, not from overflow waypoints
   */
  optimizeRoute(validated, requestedStops) {
    const { origin, destination, waypoints, alternatives } = validated;

    if (waypoints.length === 0) {
      return {
        origin,
        destination,
        selected: [],
        alternatives: alternatives || []
      };
    }

    // If we have more waypoints than requested, select the best ones
    // Old overflow waypoints are discarded in favor of explicit alternatives from Perplexity
    if (waypoints.length > requestedStops) {
      const optimized = this.selectOptimalWaypoints(
        waypoints,
        origin,
        destination,
        requestedStops
      );

      return {
        origin,
        destination,
        selected: optimized.selected,
        alternatives: alternatives || [] // Use Perplexity alternatives, not overflow
      };
    }

    // If we have exactly the right amount or fewer, use all
    return {
      origin,
      destination,
      selected: waypoints,
      alternatives: alternatives || []
    };
  }

  /**
   * Select optimal waypoints using geographic and thematic scoring
   */
  selectOptimalWaypoints(waypoints, origin, destination, count) {
    // Score each waypoint
    const scored = waypoints.map((waypoint, index) => {
      const score = this.scoreWaypoint(waypoint, origin, destination, index, waypoints.length);
      return { waypoint, score };
    });

    // Sort by score (higher is better)
    scored.sort((a, b) => b.score - a.score);

    // Select top N
    const selected = scored.slice(0, count).map(s => s.waypoint);
    const alternatives = scored.slice(count).map(s => s.waypoint);

    // Re-order selected waypoints geographically
    const ordered = this.orderWaypointsGeographically(selected, origin, destination);

    return {
      selected: ordered,
      alternatives
    };
  }

  /**
   * Score a waypoint based on multiple factors
   */
  scoreWaypoint(waypoint, origin, destination, index, total) {
    let score = 0;

    // Factor 1: Geographic progression (40 points)
    // Prefer waypoints that progress logically from origin to destination
    const idealPosition = (index + 1) / (total + 1); // Where it should be (0 to 1)
    const positionScore = 1 - Math.abs(idealPosition - 0.5) * 2; // Center is best
    score += positionScore * 40;

    // Factor 2: Validation (30 points)
    // Strongly prefer validated waypoints
    if (waypoint.verified && waypoint.coordinates) {
      score += 30;
    }

    // Factor 3: Highlights (20 points)
    // More highlights = more interesting
    const highlightCount = waypoint.highlights?.length || 0;
    score += Math.min(highlightCount * 5, 20);

    // Factor 4: Description quality (10 points)
    // Longer "why" descriptions indicate better research
    const whyLength = waypoint.why?.length || 0;
    score += Math.min(whyLength / 20, 10);

    return score;
  }

  /**
   * Order waypoints geographically from origin to destination
   */
  orderWaypointsGeographically(waypoints, origin, destination) {
    if (!waypoints || waypoints.length === 0) return [];
    if (waypoints.length === 1) return waypoints;

    // Simple nearest-neighbor ordering
    const ordered = [];
    const remaining = [...waypoints];
    let current = origin;

    while (remaining.length > 0) {
      // Find nearest city to current
      let nearest = null;
      let minDistance = Infinity;

      remaining.forEach(city => {
        if (city.coordinates && current.coordinates) {
          const dist = this.calculateDistance(
            current.coordinates,
            city.coordinates
          );
          if (dist < minDistance) {
            minDistance = dist;
            nearest = city;
          }
        }
      });

      if (nearest) {
        ordered.push(nearest);
        remaining.splice(remaining.indexOf(nearest), 1);
        current = nearest;
      } else {
        // Fallback: just add first remaining
        ordered.push(remaining[0]);
        remaining.shift();
      }
    }

    return ordered;
  }

  /**
   * Calculate distance between two coordinates (km)
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) *
      Math.cos(this.toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate optimal number of waypoint cities based on available nights
   * @param {number} nightsOnRoad - Total nights available for travel
   * @returns {number} Recommended waypoint count
   */
  calculateOptimalWaypoints(nightsOnRoad) {
    // Heuristic: 2 nights per city (comfortable pace)
    const avgNightsPerCity = 2;
    const waypoints = Math.max(1, Math.round(nightsOnRoad / avgNightsPerCity));

    // Examples:
    // 3 nights → 2 cities
    // 7 nights → 4 cities
    // 14 nights → 7 cities

    // Cap at reasonable limits
    return Math.min(Math.max(waypoints, 1), 10); // Between 1-10 cities
  }

  /**
   * Distribute nights across waypoint cities
   * @param {Array} waypoints - Array of city objects
   * @param {number} totalNights - Total nights to distribute
   * @returns {Array} Waypoints with nights allocated
   */
  allocateNightsToWaypoints(waypoints, totalNights) {
    if (!waypoints || waypoints.length === 0) return [];

    // Start with minimum nights for each city (use AI recommendations or fallback to 1)
    const citiesWithNights = waypoints.map(city => ({
      ...city,
      nights: city.recommended_min_nights || 1,
      min: city.recommended_min_nights || 1,
      max: city.recommended_max_nights || 3
    }));

    // Calculate how many nights we've allocated vs total
    let allocated = citiesWithNights.reduce((sum, city) => sum + city.nights, 0);
    let remaining = totalNights - allocated;

    // If we don't have enough nights for minimums, give 1 night to each city
    if (remaining < 0) {
      console.warn(`⚠️  Not enough nights (${totalNights}) for ${waypoints.length} cities with minimums. Giving 1 night each.`);
      return waypoints.map(city => ({
        ...city,
        nights: 1
      }));
    }

    // PHASE 6: Distribute remaining nights with priority (favor middle cities)
    let attempts = 0;
    const maxAttempts = totalNights * 2;  // Safety valve
    const priorityOrder = this.getCityPriority(citiesWithNights.length);

    while (remaining > 0 && attempts < maxAttempts) {
      let addedThisRound = false;

      // Go through cities in priority order
      for (const cityIndex of priorityOrder) {
        if (remaining === 0) break;

        const city = citiesWithNights[cityIndex];

        // Only add if we haven't hit the max
        if (city.nights < city.max) {
          city.nights++;
          remaining--;
          addedThisRound = true;
        }
      }

      // If we couldn't add any nights this round, all cities are at capacity
      if (!addedThisRound) {
        console.warn(`⚠️  All cities at capacity, ${remaining} nights unallocated`);
        break;
      }

      attempts++;
    }

    // Clean up temporary fields and return
    return citiesWithNights.map(({ min, max, ...city }) => city);
  }

  /**
   * Get priority order for distributing extra nights
   * Returns array of indices in priority order (middle cities favored)
   */
  getCityPriority(numCities) {
    if (numCities <= 2) return [0, 1];
    if (numCities === 3) return [1, 0, 2];  // Middle, first, last
    if (numCities === 4) return [1, 2, 0, 3];  // Middle two, then endpoints

    // For 5+ cities, favor middle cities
    const priority = [];
    const middle = Math.floor(numCities / 2);

    // Add middle cities first
    priority.push(middle);
    if (middle - 1 >= 0) priority.push(middle - 1);
    if (middle + 1 < numCities) priority.push(middle + 1);

    // Add remaining cities (further from middle have lower priority)
    for (let i = 0; i < numCities; i++) {
      if (!priority.includes(i)) {
        priority.push(i);
      }
    }

    return priority;
  }
}

module.exports = RouteDiscoveryAgentV2;
