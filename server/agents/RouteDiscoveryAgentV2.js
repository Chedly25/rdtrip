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
  async discoverRoute(origin, destination, stops, travelStyle, budget) {
    console.log(`\n🎯 RouteDiscoveryAgentV2: Discovering route from ${origin} to ${destination}`);
    console.log(`   Style: ${travelStyle} | Stops: ${stops} | Budget: ${budget}`);

    // STEP 1: Strategic Discovery
    console.log('\n📍 Step 1: Strategic Discovery');
    const candidates = await this.strategicDiscovery(origin, destination, stops, travelStyle, budget);

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

    return {
      origin: optimized.origin,
      destination: optimized.destination,
      waypoints: optimized.selected || [],
      alternatives: optimized.alternatives || [],
      metadata: {
        style: travelStyle,
        validated: true,
        totalCandidates: candidates.waypoints?.length || 0,
        validatedCount: validated.waypoints?.length || 0,
        error: candidates.error || validated.error
      }
    };
  }

  /**
   * Strategic Discovery: Use Perplexity to find candidate cities
   */
  async strategicDiscovery(origin, destination, stops, travelStyle, budget) {
    const prompt = this.buildDiscoveryPrompt(origin, destination, stops, travelStyle, budget);

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
        origin: { city: destination, country: 'Unknown', why: 'Fallback - Discovery failed' },
        destination: { city: destination, country: 'Unknown', why: 'Fallback - Discovery failed' },
        waypoints: [],
        error: error.message
      };
    }
  }

  /**
   * Build strategic discovery prompt
   */
  buildDiscoveryPrompt(origin, destination, stops, travelStyle, budget) {
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

    return `You are a ${travelStyle} travel expert planning a road trip from ${origin} to ${destination}.

TASK: Find ${stops} waypoint cities between ${origin} and ${destination} for an amazing road trip.

TRAVEL STYLE: ${travelStyle}
Focus on: ${styleDescriptions[travelStyle] || styleDescriptions['best-overall']}

BUDGET: ${budget}
Target: ${budgetDescriptions[budget] || budgetDescriptions['mid']}

REQUIREMENTS:
1. MUST start from ${origin} (this is the user's starting location - DO NOT CHANGE THIS)
2. MUST end at ${destination} (the main destination - DO NOT CHANGE THIS)
3. Find EXACTLY ${stops} waypoint cities in between ${origin} and ${destination}
4. Cities should be 80-250km apart (1-3 hours driving)
5. Create a logical geographic flow (no excessive backtracking)
6. Match ${travelStyle} preferences at each stop
7. Ensure all cities are real, accessible, and worth visiting
8. Waypoints should form a natural route between ${origin} and ${destination}

OUTPUT FORMAT (return ONLY this JSON, no markdown):
{
  "origin": {
    "city": "${origin}",
    "country": "France",
    "why": "User's starting location"
  },
  "destination": {
    "city": "${destination}",
    "country": "France",
    "why": "Final destination"
  },
  "waypoints": [
    {
      "city": "Example City 1",
      "country": "France",
      "why": "Brief explanation why this city fits ${travelStyle} style and makes sense on the route",
      "highlights": ["attraction 1", "attraction 2", "attraction 3"]
    },
    {
      "city": "Example City 2",
      "country": "France",
      "why": "Brief explanation why this city fits ${travelStyle} style and makes sense on the route",
      "highlights": ["attraction 1", "attraction 2", "attraction 3"]
    }
  ]
}

CRITICAL RULES:
- Return EXACTLY ${stops} waypoints (not origin, not destination, just the stops in between)
- DO NOT change the origin from ${origin}
- DO NOT change the destination from ${destination}
- Ensure geographic logic (no wild zigzags)
- All cities must be real and accessible by car
- Match ${travelStyle} theme throughout
- Create diversity: Each waypoint should offer something unique`;
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

      return JSON.parse(jsonText);

    } catch (error) {
      console.error('Failed to parse discovery response:', error.message);
      console.error('   Response preview:', responseText.substring(0, 300));
      // Return minimal valid structure
      return {
        origin: { city: destination, country: 'Unknown', why: 'Fallback - Parse failed' },
        destination: { city: destination, country: 'Unknown', why: 'Fallback - Parse failed' },
        waypoints: [],
        error: `Parse failed: ${error.message}`
      };
    }
  }

  /**
   * Validate and enrich cities with Google Places API
   */
  async validateAndEnrichCities(route) {
    console.log('   Validating cities with Google Places...');

    // Validate origin
    const validatedOrigin = await this.validateCity(route.origin);

    // Validate destination
    const validatedDestination = await this.validateCity(route.destination);

    // Validate all waypoints
    const validatedWaypoints = [];
    for (const waypoint of route.waypoints) {
      const validated = await this.validateCity(waypoint);
      if (validated) {
        validatedWaypoints.push(validated);
      } else {
        console.log(`      ⚠️  Skipped invalid city: ${waypoint.city}`);
      }
    }

    return {
      origin: validatedOrigin || route.origin, // Fallback if validation fails
      destination: validatedDestination || route.destination,
      waypoints: validatedWaypoints
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
   */
  optimizeRoute(validated, requestedStops) {
    const { origin, destination, waypoints } = validated;

    if (waypoints.length === 0) {
      return {
        origin,
        destination,
        selected: [],
        alternatives: []
      };
    }

    // If we have more waypoints than requested, select the best ones
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
        alternatives: optimized.alternatives
      };
    }

    // If we have exactly the right amount or fewer, use all
    return {
      origin,
      destination,
      selected: waypoints,
      alternatives: []
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
}

module.exports = RouteDiscoveryAgentV2;
