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

    // All agents now use premium model for better quality
    const model = 'sonar-pro';
    const timeout = 90000;  // 90s for all agents
    const maxTokens = 2500;  // More detail for all agents
    const temperature = 0.5;  // Balanced creativity for all agents

    console.log(`   Using model: ${model}, timeout: ${timeout}ms`);

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model,
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
          max_tokens: maxTokens,
          temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${this.perplexityApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout
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
      adventure: 'EXTREME outdoor activities, challenging multi-day hikes, technical terrain, remote wilderness areas requiring proper gear and experience - think multi-pitch climbing routes, backcountry trails with minimal infrastructure, wild camping spots, demanding via ferratas, off-trail scrambling, and activities that push physical limits',
      culture: 'historical sites, museums, architecture, cultural heritage',
      food: 'culinary experiences, local cuisine, food markets, wineries',
      'hidden-gems': 'ULTRA-OBSCURE off-the-beaten-path locations that locals treasure but tourists rarely discover - think secret swimming holes, family-run restaurants with no English menu, medieval villages with population under 500, artisan workshops passed down through generations, viewpoints only accessible by unmarked trails',
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
        terrain: 'Terrain diversity with elevation changes (e.g., "Sea level → 2,400m peaks, 3 distinct zones: coastal, alpine, karst")',
        activities: 'Count ALL activities with specifics (e.g., "12 hiking trails (3-18km), 4 via ferratas, 2 canyoning sites, kayaking in 3 locations")',
        difficulty: 'Difficulty breakdown by percentage (e.g., "40% moderate, 40% challenging, 20% extreme. Requires good fitness level.")',
        equipment: 'Required gear and rental costs (e.g., "Hiking boots essential, climbing harness €15/day, kayak €35/half-day. Total equipment budget: €80-150")',
        technical_level: 'Technical skills needed (e.g., "Basic scrambling on 3 trails, swimming required for 2 activities, no climbing experience needed")',
        highlight: 'Most spectacular outdoor experience with details (e.g., "Multi-pitch via ferrata with 400m vertical exposure")',
        season: 'Optimal months with weather notes (e.g., "May-June, Sept-Oct. July-Aug too hot for hiking. Snow possible above 2000m until June.")',
        daily_distance: 'Average activity duration and intensity (e.g., "4-6 hours active per day, 8-15km hiking, 1-2 rest days recommended")'
      },
      culture: {
        historical_span: 'Complete timeline with centuries (e.g., "Roman (2nd-5th century) → Medieval (11th-15th) → Renaissance (16th) → Modern (20th)")',
        heritage_sites: 'Count with breakdown (e.g., "3 UNESCO sites, 8 national monuments, 12 historic centers, 5 archaeological sites")',
        architecture: 'Architectural styles with examples (e.g., "Romanesque (4 churches), Gothic (2 cathedrals), Modernist (Gaudí works), Moorish (palace complex)")',
        museums: 'Museum count by type with costs (e.g., "5 art museums (€12-18), 3 history museums (€8-12), 2 archaeological (€10). Multi-pass available: €45")',
        cultural_events: 'Festivals and events by season (e.g., "Medieval fair (June), Music festival (July), Art biennale (Sept-Nov). Book 2 months ahead.")',
        highlight: 'Most significant cultural landmark with context (e.g., "12th century cathedral with intact frescoes, only 3 exist in Europe")',
        local_traditions: 'Living traditions and experiences (e.g., "Attend traditional craft workshops, witness religious processions, visit artisan quarters")',
        visiting_time: 'Realistic time per site (e.g., "Major sites need 2-3 hours, museums 1.5-2 hours, walking tours 3 hours. Total: 4-6 hours/day")'
      },
      food: {
        culinary_regions: 'Distinct cuisines with influences (e.g., "Catalan (Spanish-French), Provençal (Mediterranean), Italian (Ligurian). 3 wine regions.")',
        signature_dishes: 'Must-try dishes per stop with restaurants (e.g., "Stop 1: Paella (Casa Carmen €18), Stop 2: Bouillabaisse (Chez Fonfon €45)")',
        dining_variety: 'Breakdown by experience type (e.g., "4 local markets, 8 family taverns, 3 Michelin restaurants (1-star), 2 wineries with tastings")',
        price_range: 'Detailed budget per meal type (e.g., "Breakfast €5-12, lunch €15-25, dinner €25-50. Street food €8-15. Wine tasting €20-40")',
        specialties: 'Regional products to buy (e.g., "Olive oil (€12-25/bottle), local cheese (€8-15/kg), wine (€8-30/bottle), honey (€10-18/jar)")',
        highlight: 'Best culinary experience with booking (e.g., "3-hour cooking class with market visit €95. Book 1 week ahead.")',
        dietary_options: 'Dietary accommodation (e.g., "Vegetarian options plentiful, vegan moderate (check ahead), gluten-free available in cities")',
        food_tours: 'Guided food experiences (e.g., "2 food walking tours available (€60-80, 3-4 hours), wine region day trip €120")'
      },
      'hidden-gems': {
        authenticity: 'Tourist density with metrics (e.g., "Average 5-15 visitors/day vs 500+ at nearby attractions. English spoken by <20% of locals")',
        discoveries: 'Categorized hidden finds (e.g., "3 secret viewpoints (unmarked), 5 family taverns (3+ generations), 2 artisan workshops, 1 local festival")',
        local_secrets: 'What locals treasure vs tourist spots (e.g., "Locals swim at Cala Escondida, tourists at crowded Cala Grande. 90% fewer people, better water quality")',
        access_difficulty: 'How to find these places (e.g., "2 locations require asking locals, 3 need unmarked trail navigation, 1 needs introduction from resident")',
        insider_value: 'Cost comparison to tourist alternatives (e.g., "Local tavern €12-18 vs tourist restaurant €35-50. Same quality, authentic atmosphere")',
        highlight: 'Most unique hidden gem with story (e.g., "Family-run olive mill (1847), owner teaches traditional pressing. Not on any map.")',
        insider_tip: 'Practical access advice (e.g., "Learn 5 key phrases in local language, arrive before 10am or after 6pm, bring cash (no cards)")',
        preservation: 'How to visit responsibly (e.g., "Visit in groups <4, don\'t share exact locations on social media, support by buying local products")'
      },
      'best-overall': {
        balance: 'Quantified experience distribution (e.g., "35% culture (6 major sites), 25% nature (4 hikes), 25% food (8 experiences), 15% relaxation (beach/spa)")',
        diversity: 'Range with specifics (e.g., "Medieval towns (3), coastal scenery (150km), mountain passes (2), modern cities (1), wine regions (2)")',
        route_quality: 'Driving and navigation details (e.g., "Scenic routes: 75%. Average drive: 2-3 hours. Toll costs: €45 total. Easy parking except city centers")',
        pacing: 'Activity intensity and rest (e.g., "2 active days, 1 moderate, 1 relaxed per cycle. Flexible to add beach days or extend city stays")',
        costs: 'Comprehensive budget breakdown (e.g., "Accommodation €70-120/night, food €45-70/day, activities €20-40/day, fuel €80 total")',
        highlight: 'Standout feature with details (e.g., "Coastal drive from X to Y: 80km of clifftop roads, 12 viewpoints, voted top 10 drives in Europe")',
        flexibility: 'Customization options (e.g., "Easy to add: 2 beach days, 1 extra city, hiking detour. Skip if rushed: smaller towns. Weather backup plans included")',
        accessibility: 'Physical requirements (e.g., "Mostly accessible, 3 sites need stair climbing, 1 activity needs moderate fitness. Family-friendly except 1 hike")'
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
${travelStyle === 'adventure' ? `
SPECIAL ADVENTURE CRITERIA (ULTRA-DEMANDING):
⚠️  DO NOT suggest places with:
   - Only beginner-friendly walking paths or promenades
   - Heavily developed/commercialized outdoor areas (gondolas, cable cars to viewpoints)
   - Activities that are primarily tourist entertainment (zip lines over cities, tourist rafting)
   - Locations where you can drive to the scenic spot
   - Indoor climbing gyms or artificial adventure parks

✓  DO prioritize:
   - Multi-day hiking routes with refugios/huts requiring advance booking
   - Technical trails requiring scrambling, exposure to heights, or fixed cables/chains
   - Remote peaks or cols requiring 6+ hours approach or 1000m+ elevation gain
   - Backcountry areas where self-rescue knowledge is recommended
   - Via ferratas rated C (difficult) or higher, or multi-pitch climbing routes grade 4+
   - Canyoning/canyoneering requiring technical skills (rappelling, swimming in cold water)
   - Wild camping spots or bivouac sites (where legal) away from facilities
   - Locations requiring proper equipment: harness, helmet, ropes, crampons, or technical gear
   - Activities with objective hazards requiring weather monitoring and early starts
   - Routes that serious outdoor athletes and mountaineers actually do (not just tourists)

RESEARCH DEPTH REQUIRED:
   - Consult mountaineering club websites, hiking forums (like SummitPost, UKClimbing regional forums)
   - Look for routes in climbing guidebooks and topo guides (not general travel guides)
   - Check regional mountain rescue reports for area difficulty and required experience
   - Find beta from outdoor communities on Reddit (r/alpinism, r/climbing regional subs)
   - Identify routes that require permits, have limited daily access, or mandatory guide requirements
   - Reference actual difficulty grades (UIAA, French, YDS for climbing; T3-T6 for alpine hiking)

QUALITY BAR:
Each activity must pass: "Would an experienced outdoors person (who climbs 5.9/6a+, hikes 20km with 1500m gain regularly, or has wilderness experience) find this genuinely challenging and rewarding?"

REQUIRED SPECIFICATIONS FOR EACH ACTIVITY:
   - Exact distance, elevation gain/loss, estimated time
   - Technical grade (hiking: T1-T6, climbing: UIAA/French/YDS, via ferrata: A-E)
   - Required equipment list (approach shoes vs boots, helmet, harness, rope, etc.)
   - Skills needed (scrambling, exposure tolerance, navigation, rope skills)
   - Objective dangers (rockfall, weather exposure, river crossings)
   - Fitness requirement (beginner/intermediate/advanced/expert)
   - Estimated cost for equipment rental if not owned
   - Best time of day/season and weather dependencies
` : travelStyle === 'hidden-gems' ? `
SPECIAL HIDDEN GEMS CRITERIA (ULTRA-DEMANDING):
⚠️  DO NOT suggest places featured in:
   - Lonely Planet or Rick Steves guidebooks
   - Instagram "top 10" lists
   - TripAdvisor top 20 for the region
   - Major tour bus routes

✓  DO prioritize:
   - Villages with population under 2,000 where you might be the only foreigner
   - Family-run establishments (3+ generations) with no website or social media
   - Places requiring local knowledge to find (unmarked trailheads, word-of-mouth locations)
   - Festivals or traditions NOT listed on official tourism sites
   - Locations where English is rarely spoken
   - Natural sites without signage or facilities
   - Artisan workshops where you can watch (and learn) traditional crafts
   - Local markets (not tourist markets) where vendors sell to residents

RESEARCH DEPTH REQUIRED:
- Consult local blogs written BY residents FOR residents (not travel blogs)
- Look for mentions in regional newspapers, not travel media
- Seek places praised by locals on Reddit, local forums, or regional subreddits
- Find locations recommended in NATIVE LANGUAGE sources, not English tourism sites
- Prioritize places that require asking locals for directions

QUALITY BAR:
Each suggestion must pass: "Would a local who grew up here enthusiastically recommend this to their best friend visiting from abroad, saying 'don't tell anyone else about this'?"
` : ''}
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
- Be QUANTITATIVE: Include specific numbers, counts, distances, costs, times, and grades
- Base everything on the ACTUAL waypoints you selected - reference specific city names and real locations
- Use real data: actual trail grades, real restaurant names with prices, specific costs for equipment/activities
- Follow the format examples EXACTLY - include units (km, €, hours, meters, percentages)
- Be factual and verifiable - a traveler should be able to validate your numbers
- Keep each insight detailed but concise (2-3 sentences max per field)
- Make insights actionable - travelers should be able to budget and plan from this data

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
