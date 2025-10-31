/**
 * Events Agent (Premium Feature)
 * Finds local events, festivals, and markets happening during the trip
 */

const axios = require('axios');

class EventsAgent {
  constructor(routeData, dayStructure, progressCallback) {
    this.routeData = routeData;
    this.dayStructure = dayStructure;
    this.onProgress = progressCallback || (() => {});
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async generate() {
    console.log('🎭 Events Agent: Finding local happenings...');

    const events = [];
    const cities = [...new Set(this.dayStructure.days.map(d => d.overnight).filter(Boolean))];
    let completed = 0;

    for (const city of cities) {
      this.onProgress({ current: completed + 1, total: cities.length });

      // Find days in this city
      const daysInCity = this.dayStructure.days.filter(d => d.overnight === city);

      for (const day of daysInCity) {
        const cityEvents = await this.findLocalEvents(city, day.date);

        if (cityEvents.length > 0) {
          events.push({
            day: day.day,
            date: day.date,
            city,
            events: cityEvents
          });
        }
      }

      completed++;
    }

    console.log(`✓ Events: Found ${events.reduce((sum, e) => sum + e.events.length, 0)} local events`);
    return events;
  }

  async findLocalEvents(city, date) {
    const prompt = this.buildPrompt(city, date);
    const response = await this.callPerplexity(prompt);
    return this.parseResponse(response, city);
  }

  buildPrompt(city, date) {
    // Format date nicely
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    return `Find special events and happenings in ${city} on ${dayOfWeek}, ${monthDay}.

TYPES OF EVENTS TO LOOK FOR:
- Weekly markets (farmers, flea, antique, night markets)
- Festivals and celebrations
- Concerts and performances
- Exhibitions and gallery openings
- Sports events
- Seasonal events
- Regular happenings (specific to this day of week)

TASK: Return events that are ACTUALLY happening on this specific date/day.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):

{
  "events": [
    {
      "name": "Aix-en-Provence Farmers Market",
      "type": "market",
      "time": "08:00-13:00",
      "location": "Place Richelme",
      "description": "Daily farmers market, but Saturdays have extra vendors with regional products",
      "cost": "Free to browse",
      "worthVisiting": "Yes - excellent for fresh breakfast pastries, local cheese, and produce",
      "crowdLevel": "moderate",
      "tip": "Arrive before 10am for best selection"
    }
  ]
}

IMPORTANT:
- Only include events CONFIRMED for this date
- If it's a regular weekly market, mention the day
- Be specific about locations
- Mark if advance tickets needed
- Return ONLY the JSON object
- If no special events, return empty array: {"events": []}`;
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
              content: 'You are a local events expert. Return ONLY valid JSON with actual, confirmed events.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.4
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      );

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('Events API error:', error.response?.data || error.message);
      // Don't throw - events are optional
      return '{"events": []}';
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

      if (!Array.isArray(parsed.events)) {
        return [];
      }

      return parsed.events;

    } catch (error) {
      console.error(`Failed to parse events for ${city}:`, responseText.substring(0, 200));
      return []; // Return empty array if parsing fails - events are optional
    }
  }
}

module.exports = EventsAgent;
