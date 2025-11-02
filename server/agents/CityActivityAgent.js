/**
 * City Activity Agent
 * Generates specific activities for each city based on day structure
 */

const axios = require('axios');
const { generateActivityUrls } = require('../utils/urlGenerator');
class CityActivityAgent {
  constructor(routeData, dayStructure, progressCallback) {
    this.routeData = routeData;
    this.dayStructure = dayStructure;
    this.onProgress = progressCallback || (() => {});
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async generate() {
    console.log('🗺️  City Activity Agent: Generating activities...');

    const allActivities = [];
    const totalWindows = this.dayStructure.days.reduce(
      (sum, day) => sum + (day.activityWindows?.length || 0),
      0
    );

    let completed = 0;

    for (const day of this.dayStructure.days) {
      const city = this.extractMainCity(day.location);

      for (const window of day.activityWindows || []) {
        this.onProgress({ current: completed + 1, total: totalWindows });

        const activities = await this.generateActivitiesForWindow(city, day, window);

        allActivities.push({
          day: day.day,
          date: day.date,
          city,
          window: {
            start: window.start,
            end: window.end,
            purpose: window.purpose
          },
          activities
        });

        completed++;
      }
    }

    console.log(`✓ City Activities: Generated ${allActivities.length} activity sets`);
    return allActivities;
  }

  async generateActivitiesForWindow(city, dayInfo, window) {
    const prompt = this.buildPrompt(city, dayInfo, window);
    const response = await this.callPerplexity(prompt);
    return this.parseResponse(response, city);
  }

  buildPrompt(city, dayInfo, window) {
    const { agent } = this.routeData;

    return `You are a ${agent} travel expert creating specific activities for ${city}.

DAY CONTEXT:
- Date: ${dayInfo.date}
- Day ${dayInfo.day} of trip
- Theme: ${dayInfo.theme}
- Available time: ${window.start} to ${window.end}
- Window purpose: ${window.purpose}
- Energy level needed: ${window.energyLevel || 'moderate'}

AGENT FOCUS: ${this.getAgentDescription(agent)}

TASK: Create 3-4 specific, realistic activities for this time window.

REQUIREMENTS:
1. Use REAL place names (e.g., "Musée Granet" not "art museum")
2. Include exact timing (start & end times)
3. Leave 15-30min travel time between activities
4. Match ${agent} personality
5. Be specific about WHAT to do at each place
6. Include practical info (address, admission, booking needed?)
7. Vary energy levels - don't do 4 intense activities in a row
8. Account for actual opening hours

ACTIVITY TYPES:
- sightseeing (museums, monuments, viewpoints)
- outdoor (hiking, parks, beaches)
- cultural (galleries, performances, workshops)
- shopping (markets, boutiques, local crafts)
- relaxation (cafes, gardens, spas)
- unique (${agent}-specific experiences)

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):

{
  "activities": [
    {
      "time": {
        "start": "14:00",
        "end": "16:00"
      },
      "name": "Musée Granet - Modern Art Collection",
      "type": "cultural",
      "description": "Explore the modern art wing featuring Cézanne's works and his study of Sainte-Victoire mountain. Focus on the Provençal landscape paintings.",
      "address": "Place Saint-Jean de Malte, 13100 Aix-en-Provence",
      "admission": "€8 (€5 students, free first Sunday)",
      "bookingNeeded": false,
      "energyLevel": "relaxed",
      "whyThisAgent": "For ${agent} travelers, this museum perfectly captures [specific reason why this fits the agent type]",
      "practicalTips": "Avoid crowds by arriving at 2pm. Audio guide recommended. Allow 2 hours minimum.",
      "travelTimeFromPrevious": null
    },
    {
      "time": {
        "start": "16:30",
        "end": "18:00"
      },
      "name": "Cours Mirabeau Stroll & Café Stop",
      "type": "relaxation",
      "description": "Walk the famous plane tree-lined avenue, admire fountains, and stop at Les Deux Garçons café (where Cézanne and Zola met).",
      "address": "Cours Mirabeau, 13100 Aix-en-Provence",
      "admission": "Free (café: €5-15)",
      "bookingNeeded": false,
      "energyLevel": "relaxed",
      "whyThisAgent": "Essential ${agent} experience because [specific reason]",
      "practicalTips": "Best light for photos at this time. Café terraces fill up - arrive early for best seats.",
      "travelTimeFromPrevious": "15 min walk"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no other text.`;
  }

  async callPerplexity(prompt, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🎯 CityActivityAgent Perplexity call (attempt ${attempt}/${retries})`);

        const response = await axios.post(
          'https://api.perplexity.ai/chat/completions',
          {
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a local travel expert with deep knowledge of specific places. Return ONLY valid JSON with no markdown, no code blocks, no explanations.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2500,
            temperature: 0.4
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 45000 // Increased from 25s to 45s
          }
        );

        console.log(`✅ CityActivityAgent Perplexity call succeeded on attempt ${attempt}`);
        return response.data.choices[0].message.content;

      } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const isLastAttempt = attempt === retries;

        console.error(`❌ CityActivityAgent attempt ${attempt}/${retries} failed:`, error.message);

        if (isLastAttempt || !isTimeout) {
          throw new Error(`Activity generation failed after ${attempt} attempts: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        const waitTime = attempt * 2000;
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  parseResponse(responseText, city) {
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

      if (!Array.isArray(parsed.activities)) {
        throw new Error('Invalid activities format');
      }

      // Add URLs to each activity
      parsed.activities.forEach(activity => {
        activity.urls = generateActivityUrls(activity, city);
      });

      return parsed.activities;

    } catch (error) {
      console.error(`Failed to parse activities for ${city}:`, responseText.substring(0, 200));

      // Return fallback activity with URLs
      const fallback = {
        time: { start: "10:00", end: "12:00" },
        name: `Explore ${city} City Center`,
        type: "sightseeing",
        description: `Discover the main attractions of ${city}`,
        address: city,
        admission: "Varies",
        bookingNeeded: false,
        energyLevel: "moderate",
        whyThisAgent: "General exploration",
        practicalTips: "Start early to avoid crowds",
        travelTimeFromPrevious: null
      };

      fallback.urls = generateActivityUrls(fallback, city);
      return [fallback];
    }
  }

  extractMainCity(location) {
    // Handle "City A → City B" format
    if (location.includes('→')) {
      return location.split('→').pop().trim();
    }
    return location;
  }

  getAgentDescription(agent) {
    const descriptions = {
      adventure: 'Outdoor activities, hiking, scenic viewpoints, active experiences',
      culture: 'Museums, historical sites, architecture, art galleries, cultural immersion',
      food: 'Culinary experiences, markets, tastings, local specialties',
      'hidden-gems': 'Off-the-beaten-path, local secrets, unique experiences',
      'best-overall': 'Balanced mix of top attractions and local favorites'
    };
    return descriptions[agent] || descriptions['best-overall'];
  }
}

module.exports = CityActivityAgent;
