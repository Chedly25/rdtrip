/**
 * Route Planning Agent
 *
 * Intelligently plans road trip routes based on total trip duration and desired pace.
 * Uses AI to suggest optimal cities and allocates nights based on city importance.
 *
 * Input: origin, destination, totalNights, tripPace ('leisurely', 'balanced', 'fast-paced')
 * Output: waypoints with allocated nights for each city
 */

const OpenAI = require('openai');

class RoutePlanningAgent {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai'
    });
  }

  /**
   * Plan a complete route with cities and night allocations
   */
  async planRoute({ origin, destination, totalNights, tripPace, budget = 'mid' }) {
    console.log(`\n🗺️  === Route Planning Agent ===`);
    console.log(`   ${origin} → ${destination}`);
    console.log(`   ${totalNights} nights total`);
    console.log(`   ${tripPace} pace`);
    console.log(`   ${budget} budget`);

    // Step 1: Determine optimal number of cities
    const numCities = this.calculateOptimalCities(totalNights, tripPace);
    console.log(`   → Recommending ${numCities} cities`);

    // Step 2: Get AI suggestions for cities
    const cities = await this.getCitySuggestionsFromAI(
      origin,
      destination,
      numCities,
      totalNights,
      tripPace,
      budget
    );

    // Step 3: Allocate nights to each city
    const citiesWithNights = this.allocateNights(cities, totalNights, tripPace);

    console.log(`✅ Route planned:`);
    citiesWithNights.forEach(city => {
      console.log(`   - ${city.name}: ${city.nights} nights`);
    });

    return {
      cities: citiesWithNights,
      totalNights,
      pace: tripPace,
      numCities,
      origin,
      destination
    };
  }

  /**
   * Calculate optimal number of cities based on total nights and pace
   */
  calculateOptimalCities(totalNights, pace) {
    // Define average nights per city based on pace
    const avgNightsPerCity = {
      'leisurely': 4.5,   // 3-7 nights per city → longer stays
      'balanced': 3,      // 2-4 nights per city → moderate stays
      'fast-paced': 2     // 1-3 nights per city → quick visits
    };

    const avg = avgNightsPerCity[pace] || 3;

    // Calculate number of cities (minimum 2, maximum 7)
    let numCities = Math.ceil(totalNights / avg);
    numCities = Math.max(2, Math.min(7, numCities));

    // Adjust for very short trips
    if (totalNights <= 3) numCities = 2;
    if (totalNights <= 2) numCities = 2;

    return numCities;
  }

  /**
   * Get city suggestions from AI based on route parameters
   */
  async getCitySuggestionsFromAI(origin, destination, numCities, totalNights, tripPace, budget) {
    const numWaypoints = Math.max(1, numCities - 2); // Exclude origin and destination, but minimum 1 waypoint

    const prompt = `You are a road trip route planner. Plan a ${totalNights}-night ${tripPace}-paced road trip from ${origin} to ${destination}.

REQUIREMENTS:
- Suggest EXACTLY ${numWaypoints} waypoint cities between ${origin} and ${destination}
- Each waypoint must be a CITY NAME (not attractions or landmarks)
- Cities should be geographically logical along the route
- Consider ${tripPace} pace: ${this.getPaceDescription(tripPace)}
- Budget level: ${budget}

IMPORTANT:
- Cities must form a logical driving route from ${origin} to ${destination}
- Choose cities that justify stopping for multiple nights
- Avoid suggesting cities that are too close together
- Consider major highways and realistic driving distances

Return ONLY a valid JSON object in this exact format:
{
  "origin": "${origin}",
  "destination": "${destination}",
  "waypoints": [
    {
      "name": "City Name",
      "country": "Country",
      "description": "Brief reason why this city is perfect for this route (1 sentence)",
      "highlights": ["Thing 1", "Thing 2", "Thing 3"]
    }
  ],
  "routeNotes": "Brief overview of the route character and flow"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'llama-3.1-sonar-huge-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a road trip planning expert. You provide routes as valid JSON only, with no markdown formatting or code blocks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      let content = response.choices[0].message.content;

      // Remove markdown code blocks if present
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      const result = JSON.parse(content);

      // Validate response structure
      if (!result.waypoints || !Array.isArray(result.waypoints)) {
        throw new Error('Invalid response structure: missing waypoints array');
      }

      // Include origin and destination in the cities list
      const allCities = [
        {
          name: origin,
          country: result.origin?.country || '',
          description: 'Starting point',
          highlights: []
        },
        ...result.waypoints,
        {
          name: destination,
          country: result.destination?.country || '',
          description: 'Final destination',
          highlights: []
        }
      ];

      console.log(`   ✓ AI suggested ${allCities.length} cities total`);
      return allCities;

    } catch (error) {
      console.error('❌ Route planning AI error:', error.message);

      // Fallback: return simple waypoints if AI fails
      console.log('   ⚠️  Using fallback waypoints');
      return this.getFallbackWaypoints(origin, destination, numWaypoints);
    }
  }

  /**
   * Get pace description for AI prompt
   */
  getPaceDescription(pace) {
    const descriptions = {
      'leisurely': 'Leisurely means 3-7 nights per city, deeper exploration, relaxed pace',
      'balanced': 'Balanced means 2-4 nights per city, mix of depth and variety',
      'fast-paced': 'Fast-paced means 1-3 nights per city, cover more ground, see highlights'
    };
    return descriptions[pace] || descriptions['balanced'];
  }

  /**
   * Allocate nights intelligently across cities
   */
  allocateNights(cities, totalNights, pace) {
    if (cities.length === 0) return [];

    // Define minimum nights per city based on pace
    const minNights = {
      'leisurely': 3,
      'balanced': 2,
      'fast-paced': 1
    };
    const min = minNights[pace] || 2;

    // Start with minimum allocation for each city
    const citiesWithNights = cities.map(city => ({
      ...city,
      nights: min
    }));

    let allocated = cities.length * min;
    let remaining = totalNights - allocated;

    // If we don't have enough nights for minimum, reduce evenly
    if (remaining < 0) {
      console.log(`   ⚠️  Not enough nights for ${cities.length} cities at ${min} nights minimum`);
      // Give 1 night to each city and distribute rest
      citiesWithNights.forEach(city => city.nights = 1);
      allocated = cities.length;
      remaining = totalNights - allocated;
    }

    // Distribute remaining nights strategically
    // Priority: Middle cities (highlights) > Destination > Origin
    let index = 0;
    while (remaining > 0) {
      // Cycle through cities, favoring middle ones
      const priorityOrder = this.getCityPriority(cities.length);
      const cityIndex = priorityOrder[index % priorityOrder.length];

      if (citiesWithNights[cityIndex]) {
        citiesWithNights[cityIndex].nights++;
        remaining--;
      }

      index++;

      // Safety check to prevent infinite loop
      if (index > totalNights * 2) break;
    }

    return citiesWithNights;
  }

  /**
   * Get priority order for distributing extra nights
   * Returns array of indices in priority order
   */
  getCityPriority(numCities) {
    if (numCities <= 2) return [0, 1];
    if (numCities === 3) return [1, 0, 2]; // Middle, origin, destination
    if (numCities === 4) return [1, 2, 0, 3]; // Middle two, then endpoints

    // For 5+ cities, favor middle cities
    const priority = [];
    const middle = Math.floor(numCities / 2);

    // Add middle cities first
    priority.push(middle);
    if (middle - 1 >= 0) priority.push(middle - 1);
    if (middle + 1 < numCities) priority.push(middle + 1);

    // Add remaining cities
    for (let i = 0; i < numCities; i++) {
      if (!priority.includes(i)) {
        priority.push(i);
      }
    }

    return priority;
  }

  /**
   * Fallback waypoints if AI fails
   */
  getFallbackWaypoints(origin, destination, numWaypoints) {
    console.log(`   Using ${numWaypoints} placeholder waypoints`);

    const waypoints = [];
    for (let i = 1; i <= numWaypoints; i++) {
      waypoints.push({
        name: `Waypoint ${i}`,
        country: '',
        description: 'City along the route',
        highlights: []
      });
    }

    return [
      { name: origin, country: '', description: 'Starting point', highlights: [] },
      ...waypoints,
      { name: destination, country: '', description: 'Final destination', highlights: [] }
    ];
  }

  /**
   * Convert cities with nights to night allocations object
   */
  toNightAllocations(citiesWithNights) {
    const allocations = {};
    citiesWithNights.forEach(city => {
      allocations[city.name] = city.nights;
    });
    return allocations;
  }
}

module.exports = RoutePlanningAgent;
