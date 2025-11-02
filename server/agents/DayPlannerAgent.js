/**
 * Day Planner Agent
 * Creates the foundational day-by-day structure for the entire trip
 */

const axios = require('axios');

class DayPlannerAgent {
  constructor(routeData, preferences) {
    this.routeData = routeData;
    this.preferences = preferences;
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async generate() {
    console.log('📅 Day Planner Agent: Generating trip structure...');
    console.log('📅 Day Planner received routeData:', JSON.stringify(this.routeData));
    console.log('📅 Day Planner received preferences:', JSON.stringify(this.preferences));

    const prompt = this.buildPrompt();

    // Retry logic for API timeouts
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`📅 Day Planner: Attempt ${attempt}/2`);
        const response = await this.callPerplexity(prompt);
        const parsed = this.parseResponse(response);
        console.log(`✓ Day Planner: Created ${parsed.totalDays}-day structure`);
        return parsed;
      } catch (error) {
        lastError = error;
        if (attempt < 2 && error.message.includes('timeout')) {
          console.log(`⚠️  Day Planner: Timeout on attempt ${attempt}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  }

  buildPrompt() {
    const { waypoints, agent, origin, destination } = this.routeData;
    const { startDate, endDate, pace = 'moderate' } = this.preferences;

    // Calculate total distance
    const totalDistance = this.calculateTotalDistance(waypoints);

    // Build city list - handle both formats (name/location for old, city for new)
    const cities = waypoints?.map(w => w.city || w.name || w.location).filter(Boolean) || [];

    return `You are an expert ${agent} travel planner creating a road trip itinerary.

ROUTE DETAILS:
- Origin: ${origin || cities[0]}
- Destination: ${destination || cities[cities.length - 1]}
- Cities to visit: ${cities.join(' → ')}
- Total distance: ~${totalDistance}km
- Start date: ${startDate || 'flexible'}
- End date: ${endDate || 'flexible'}
- Travel pace: ${pace} (relaxed/moderate/packed)

AGENT PERSONALITY:
${this.getAgentDescription(agent)}

TASK: Create a realistic day-by-day structure for this road trip.

REQUIREMENTS:
1. Calculate realistic daily driving times (max 3-4 hours per day)
2. Include rest breaks every 2 hours of driving
3. Account for arrival/departure days (shorter activity windows)
4. Group cities logically - don't backtrack
5. Match the ${pace} pace:
   - Relaxed: 2-3 activities per day, lots of free time
   - Moderate: 3-4 activities per day, balanced
   - Packed: 4-5 activities per day, full days
6. Theme each day based on ${agent} focus
7. Leave time windows for: breakfast, lunch, dinner, check-in/out

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):

{
  "totalDays": number,
  "days": [
    {
      "day": 1,
      "date": "2025-11-15",
      "location": "Aix-en-Provence",
      "theme": "Arrival & Historic Center Discovery",
      "driveSegments": [],
      "activityWindows": [
        {
          "start": "14:00",
          "end": "18:00",
          "purpose": "afternoon exploration",
          "energyLevel": "moderate"
        },
        {
          "start": "19:30",
          "end": "22:00",
          "purpose": "evening dining",
          "energyLevel": "relaxed"
        }
      ],
      "overnight": "Aix-en-Provence",
      "notes": "Late arrival day - keep it light"
    },
    {
      "day": 2,
      "date": "2025-11-16",
      "location": "Aix-en-Provence → Montpellier",
      "theme": "Scenic Coastal Drive",
      "driveSegments": [
        {
          "from": "Aix-en-Provence",
          "to": "Montpellier",
          "distance": 160,
          "estimatedTime": "1h 45m",
          "departureTime": "09:00",
          "arrivalTime": "10:45",
          "restStops": 0
        }
      ],
      "activityWindows": [
        {
          "start": "11:00",
          "end": "13:00",
          "purpose": "late morning activities",
          "energyLevel": "moderate"
        },
        {
          "start": "15:00",
          "end": "19:00",
          "purpose": "afternoon/evening exploration",
          "energyLevel": "active"
        }
      ],
      "overnight": "Montpellier",
      "notes": "Allow time to settle into new city"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no other text.`;
  }

  async callPerplexity(prompt) {
    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a precise travel planning expert. Return ONLY valid JSON with no markdown formatting, no code blocks, no explanatory text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout (increased for multi-city itineraries)
        }
      );

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('Perplexity API error:', error.response?.data || error.message);
      throw new Error(`Day Planner API call failed: ${error.message}`);
    }
  }

  parseResponse(responseText) {
    try {
      // Try to extract JSON from response
      let jsonText = responseText.trim();

      // Remove markdown code blocks if present
      if (jsonText.includes('```json')) {
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      } else if (jsonText.includes('```')) {
        const match = jsonText.match(/```\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      }

      // Find JSON object boundaries
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No JSON object found in response');
      }

      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);

      // Parse JSON
      const parsed = JSON.parse(jsonText);

      // Validate structure
      if (!parsed.totalDays || !Array.isArray(parsed.days)) {
        throw new Error('Invalid day structure format');
      }

      return parsed;

    } catch (error) {
      console.error('Failed to parse Day Planner response:', responseText);
      throw new Error(`JSON parsing failed: ${error.message}`);
    }
  }

  calculateTotalDistance(waypoints) {
    if (!waypoints || waypoints.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i].coordinates;
      const to = waypoints[i + 1].coordinates;

      if (from && to) {
        total += this.haversineDistance(from.lat, from.lng, to.lat, to.lng);
      }
    }

    return Math.round(total);
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  getAgentDescription(agent) {
    const descriptions = {
      adventure: 'Focus on outdoor activities, hiking, scenic viewpoints, and active experiences. Prioritize nature and physical engagement.',
      culture: 'Focus on museums, historical sites, architecture, art galleries, and cultural immersion. Prioritize intellectual enrichment.',
      food: 'Focus on culinary experiences, local markets, wine tastings, cooking classes, and gourmet dining. Prioritize gastronomic discovery.',
      'hidden-gems': 'Focus on off-the-beaten-path locations, local secrets, and unique experiences tourists rarely find. Avoid mainstream attractions.',
      'best-overall': 'Balanced mix of top attractions, local favorites, and diverse experiences. Create a well-rounded memorable trip.'
    };

    return descriptions[agent] || descriptions['best-overall'];
  }
}

module.exports = DayPlannerAgent;
