/**
 * Accommodation Agent
 * Finds specific hotels/stays for each night of the trip
 */

const axios = require('axios');
const { generateAccommodationUrls } = require('../utils/urlGenerator');

class AccommodationAgent {
  constructor(routeData, dayStructure, budget, progressCallback) {
    this.routeData = routeData;
    this.dayStructure = dayStructure;
    this.budget = budget;
    this.onProgress = progressCallback || (() => {});
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async generate() {
    console.log('🏨 Accommodation Agent: Finding places to stay...');

    const accommodations = [];
    const totalNights = this.dayStructure.days.filter(d => d.overnight).length;
    let completed = 0;

    for (const day of this.dayStructure.days) {
      if (day.overnight) {
        this.onProgress({ current: completed + 1, total: totalNights });

        const hotel = await this.findAccommodation(day.overnight, day);

        accommodations.push({
          night: day.day,
          date: day.date,
          city: day.overnight,
          ...hotel
        });

        completed++;
      }
    }

    console.log(`✓ Accommodation: Found ${accommodations.length} hotels`);
    return accommodations;
  }

  async findAccommodation(city, dayInfo) {
    const prompt = this.buildPrompt(city, dayInfo);
    const response = await this.callPerplexity(prompt);
    return this.parseResponse(response, city);
  }

  buildPrompt(city, dayInfo) {
    const { agent } = this.routeData;

    return `You are a ${agent} travel expert finding accommodation in ${city}.

DAY CONTEXT:
- Night of: ${dayInfo.date}
- Day ${dayInfo.day}: ${dayInfo.theme}
- Budget: ${this.budget}

AGENT PERSONALITY: ${this.getAgentDescription(agent)}

TASK: Find ONE specific, real hotel/accommodation perfect for this traveler.

REQUIREMENTS:
1. REAL hotel name and exact address
2. Match ${agent} style and ${this.budget} budget
3. Strategic location for planned activities
4. Has character - not just a generic chain
5. Price per night estimate
6. Explain WHY this fits the ${agent} traveler

LOCATION STRATEGY:
${this.getLocationStrategy(agent, city)}

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):

{
  "name": "Hôtel Cézanne Boutique",
  "type": "boutique_hotel",
  "address": "40 Avenue Victor Hugo, 13100 Aix-en-Provence",
  "stars": 4,
  "pricePerNight": 145,
  "neighborhood": "Centre Ville",
  "walkabilityScore": 9,
  "vibe": "Intimate boutique hotel in renovated 18th-century building with art-focused decor and Cézanne prints throughout.",
  "amenities": ["free_wifi", "breakfast_included", "air_conditioning", "parking", "24h_reception"],
  "whyThisAgent": "For ${agent} travelers, this location is perfect because [specific reason related to agent type]",
  "bookingTip": "Book directly for 10% off, or check Booking.com for last-minute deals",
  "checkIn": "15:00",
  "checkOut": "11:00",
  "parking": "On-site parking €15/night, or free street parking 5min walk",
  "nearbyHighlights": ["Musée Granet 200m", "Cours Mirabeau 300m"]
}

IMPORTANT: Return ONLY the JSON object, no other text.`;
  }

  getLocationStrategy(agent, city) {
    const strategies = {
      adventure: 'Prioritize: proximity to trailheads/outdoor activity starting points, bike storage, hearty breakfast, easy parking',
      culture: 'Prioritize: historic center, walkable to museums/monuments, charming architecture, local character',
      food: 'Prioritize: near food markets/restaurant districts, boutique feel, foodie breakfast options',
      'hidden-gems': 'Prioritize: neighborhood locals love, authentic area, away from tourist zones, unique property',
      'best-overall': 'Prioritize: central location, good value, walkable to main sights, well-reviewed'
    };
    return strategies[agent] || strategies['best-overall'];
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
              content: 'You are an accommodation expert with deep local knowledge. Return ONLY valid JSON with no markdown, no code blocks.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1800,
          temperature: 0.4
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
      console.error('Accommodation API error:', error.response?.data || error.message);
      throw new Error(`Accommodation search failed: ${error.message}`);
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

      // Validate
      if (!parsed.name || !parsed.address) {
        throw new Error('Missing required hotel fields');
      }

      // Add URLs for booking sites, maps, reviews
      parsed.urls = generateAccommodationUrls(parsed, city);

      return parsed;

    } catch (error) {
      console.error(`Failed to parse accommodation for ${city}:`, responseText.substring(0, 200));

      // Return fallback with URLs
      const fallback = {
        name: `Hotel in ${city}`,
        type: 'hotel',
        address: `${city} city center`,
        stars: 3,
        pricePerNight: this.getFallbackPrice(),
        neighborhood: 'City Center',
        walkabilityScore: 7,
        vibe: 'Comfortable accommodation in central location',
        amenities: ['wifi', 'breakfast'],
        whyThisAgent: 'Convenient central location',
        bookingTip: 'Check multiple booking sites for best rates',
        checkIn: '15:00',
        checkOut: '11:00',
        parking: 'Available nearby',
        nearbyHighlights: ['City center attractions']
      };

      fallback.urls = generateAccommodationUrls(fallback, city);
      return fallback;
    }
  }

  getFallbackPrice() {
    const prices = {
      budget: 80,
      mid: 130,
      luxury: 220
    };
    return prices[this.budget] || 130;
  }

  getAgentDescription(agent) {
    const descriptions = {
      adventure: 'Active travelers who value proximity to outdoor activities and practical amenities',
      culture: 'Culturally curious travelers seeking historic properties with local character',
      food: 'Culinary enthusiasts wanting to be near food markets and dining districts',
      'hidden-gems': 'Explorers seeking authentic neighborhoods and unique properties',
      'best-overall': 'Well-rounded travelers wanting central location and good value'
    };
    return descriptions[agent] || descriptions['best-overall'];
  }
}

module.exports = AccommodationAgent;
