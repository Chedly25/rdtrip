/**
 * Scenic Route Agent ⭐ PREMIUM DIFFERENTIATOR
 * Finds amazing stops along driving segments between cities
 */

const axios = require('axios');

class ScenicRouteAgent {
  constructor(routeData, dayStructure, progressCallback) {
    this.routeData = routeData;
    this.dayStructure = dayStructure;
    this.onProgress = progressCallback || (() => {});
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async generate() {
    console.log('🛣️  Scenic Route Agent: Finding route highlights...');

    const scenicStops = [];
    const allSegments = this.dayStructure.days.flatMap(d => d.driveSegments || []);
    let completed = 0;

    for (const day of this.dayStructure.days) {
      for (const segment of day.driveSegments || []) {
        this.onProgress({ current: completed + 1, total: allSegments.length });

        const stops = await this.findScenicStops(segment, day);

        scenicStops.push({
          day: day.day,
          date: day.date,
          segment: `${segment.from} → ${segment.to}`,
          distance: segment.distance,
          estimatedTime: segment.estimatedTime,
          stops
        });

        completed++;
      }
    }

    console.log(`✓ Scenic Stops: Found ${scenicStops.reduce((sum, s) => sum + s.stops.length, 0)} route highlights`);
    return scenicStops;
  }

  async findScenicStops(segment, dayInfo) {
    const prompt = this.buildPrompt(segment, dayInfo);
    const response = await this.callPerplexity(prompt);
    return this.parseResponse(response, segment);
  }

  buildPrompt(segment, dayInfo) {
    const { agent } = this.routeData;

    // Determine number of stops based on distance
    const stopCount = segment.distance < 100 ? 1 : segment.distance < 200 ? 2 : 3;

    return `You are a ${agent} travel expert finding amazing stops along a drive.

ROUTE SEGMENT:
- From: ${segment.from}
- To: ${segment.to}
- Distance: ${segment.distance}km
- Estimated time: ${segment.estimatedTime}
- Departure: ${segment.departureTime}
- Date: ${dayInfo.date}

TRAVELER TYPE: ${this.getAgentDescription(agent)}

TASK: Find ${stopCount} worthwhile stop(s) DIRECTLY along this route.

STOP CRITERIA:
1. Actually ON the route (max 5-10km detour)
2. Worth 15-60 minutes
3. Match ${agent} interests
4. Add genuine value (not just rest stops)
5. Feasible timing (consider total drive time)

STOP TYPES TO CONSIDER:
- Scenic viewpoints (photo opportunities)
- Charming villages/towns
- Historical landmarks
- Natural wonders
- Regional food specialties
- Roadside attractions with character

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):

{
  "stops": [
    {
      "name": "Pont du Gard",
      "type": "landmark",
      "coordinates": { "lat": 43.9475, "lng": 4.5356 },
      "approximateKmFromStart": 75,
      "suggestedDuration": "30-45 min",
      "why": "UNESCO Roman aqueduct bridge, incredibly well-preserved. One of France's most photographed monuments. Morning light is spectacular.",
      "whatToDo": "Walk across the top level, visit riverside museum, photograph from multiple angles",
      "cost": "Free to walk (museum €8)",
      "facilities": "Large parking lot (€5), restrooms, café, picnic areas",
      "bestTimeOfDay": "morning",
      "skipIf": "Running late or not interested in Roman history",
      "detourTime": "5 min off main route",
      "parkingEase": "easy"
    }
  ]
}

IMPORTANT:
- Return ${stopCount} stop(s) based on distance
- Be realistic about timing
- Prioritize stops that match ${agent} style
- Return ONLY the JSON object, no other text`;
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
              content: 'You are a local road trip expert who knows the best stops along European routes. Return ONLY valid JSON with no markdown.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.5
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 25000
        }
      );

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('Scenic stops API error:', error.response?.data || error.message);
      throw new Error(`Scenic stops search failed: ${error.message}`);
    }
  }

  parseResponse(responseText, segment) {
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

      // Extract JSON
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(jsonText);

      // Validate
      if (!Array.isArray(parsed.stops)) {
        throw new Error('Invalid stops format');
      }

      return parsed.stops;

    } catch (error) {
      console.error(`Failed to parse scenic stops for ${segment.from} → ${segment.to}:`, responseText.substring(0, 200));

      // Return minimal fallback
      return [{
        name: `Scenic viewpoint between ${segment.from} and ${segment.to}`,
        type: 'viewpoint',
        coordinates: null,
        approximateKmFromStart: Math.floor(segment.distance / 2),
        suggestedDuration: '15-20 min',
        why: 'Opportunity to stretch legs and enjoy the scenery',
        whatToDo: 'Take photos, rest break',
        cost: 'Free',
        facilities: 'Basic rest area',
        bestTimeOfDay: 'anytime',
        skipIf: 'In a hurry',
        detourTime: 'None - along route',
        parkingEase: 'moderate'
      }];
    }
  }

  getAgentDescription(agent) {
    const descriptions = {
      adventure: 'Outdoor enthusiasts seeking active stops, viewpoints, and natural wonders',
      culture: 'History buffs interested in monuments, villages with character, and cultural sites',
      food: 'Foodies looking for local markets, regional specialties, and authentic dining spots',
      'hidden-gems': 'Explorers wanting off-the-beaten-path locations and local secrets',
      'best-overall': 'Balanced travelers appreciating variety: scenic, historic, and unique stops'
    };
    return descriptions[agent] || descriptions['best-overall'];
  }
}

module.exports = ScenicRouteAgent;
