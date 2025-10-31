/**
 * Practical Info Agent
 * Provides logistical information and local tips for each city
 */

const axios = require('axios');

class PracticalInfoAgent {
  constructor(routeData, dayStructure, progressCallback) {
    this.routeData = routeData;
    this.dayStructure = dayStructure;
    this.onProgress = progressCallback || (() => {});
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async generate() {
    console.log('ℹ️  Practical Info Agent: Gathering local tips...');

    const practicalInfo = [];
    const cities = [...new Set(this.dayStructure.days.map(d => d.overnight).filter(Boolean))];
    let completed = 0;

    for (const city of cities) {
      this.onProgress({ current: completed + 1, total: cities.length });

      const info = await this.generatePracticalInfo(city);

      practicalInfo.push({
        city,
        ...info
      });

      completed++;
    }

    console.log(`✓ Practical Info: Generated for ${practicalInfo.length} cities`);
    return practicalInfo;
  }

  async generatePracticalInfo(city) {
    const prompt = this.buildPrompt(city);
    const response = await this.callPerplexity(prompt);
    return this.parseResponse(response, city);
  }

  buildPrompt(city) {
    return `You are a local expert providing practical travel information for ${city}.

TASK: Provide essential practical information for tourists visiting ${city}.

SECTIONS TO COVER:
1. **Parking**: Where to park (garages/lots/street), costs, restrictions, ZTL zones
2. **Getting Around**: Best transportation (walk/bike/tram/bus), how to buy tickets
3. **Local Tips**: What tourists commonly get wrong or don't know
4. **Timing**: Best times to visit attractions (avoid crowds)
5. **Safety**: Any areas to avoid? Common tourist scams?
6. **Language**: English widely spoken? Key phrases helpful?
7. **Money**: ATM locations, card acceptance, cash needed where?
8. **Emergency**: Hospital, police station, pharmacy locations

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):

{
  "parking": {
    "recommendation": "Park at Parking Mignet (€2/hour, €15/day) then walk to center",
    "zones": "Historic center has ZTL restrictions 10am-7pm",
    "tips": "Free parking at Parking des Allées after 7pm and weekends",
    "difficulty": "moderate"
  },
  "transportation": {
    "bestOption": "walking",
    "publicTransport": "Bus network covers city, €1.50/ride, €5 day pass at tabac shops",
    "bikeRental": "Velaix bike-share: €1/30min, stations throughout center",
    "tips": "Historic center is compact - most attractions within 20min walk"
  },
  "localTips": [
    "Shops close 12:30-2:30pm for lunch - plan accordingly",
    "Markets are best early (before 10am) for freshest products",
    "Restaurants fill up after 8pm - arrive at 7:30 or book ahead",
    "Free museum entry first Sunday of month"
  ],
  "timing": {
    "museums": "Visit after 3pm to avoid tour groups",
    "markets": "Early morning (8-10am) for best selection",
    "restaurants": "Lunch 12-2pm, dinner after 7:30pm",
    "avoid": "Saturday mornings very crowded in center"
  },
  "safety": {
    "overall": "Very safe city, standard precautions",
    "avoidAreas": "Train station area at night - not dangerous but less pleasant",
    "scams": "Watch for fake petition signers near Cours Mirabeau (pickpocket distraction)",
    "emergency": "112 for emergencies, police station at Place des Martyrs"
  },
  "language": {
    "english": "Moderate - tourist areas fine, neighborhood spots less so",
    "helpful": ["Bonjour", "Merci", "L'addition s'il vous plaît", "Parlez-vous anglais?"],
    "tip": "Start with Bonjour - it's considered rude not to greet"
  },
  "money": {
    "atms": "Many in center - avoid currency exchange offices (poor rates)",
    "cards": "Widely accepted, but carry cash for markets and small cafés",
    "tipping": "Service included - round up or 5-10% for great service",
    "costs": "€€ city - coffee €3, meal €15-25, museum €8-12"
  },
  "emergency": {
    "hospital": "Centre Hospitalier d'Aix - Avenue des Tamaris",
    "police": "Police Municipale - Place des Martyrs de la Résistance",
    "pharmacy": "Multiple pharmacies on Cours Mirabeau (green cross signs)",
    "numbers": "Emergency 112, Police 17, Medical 15"
  }
}

IMPORTANT:
- Be specific and practical
- Include actual locations/names
- Current 2025 information
- Return ONLY the JSON object`;
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
              content: 'You are a local resident who knows all the practical details tourists need. Return ONLY valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2200,
          temperature: 0.3
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
      console.error('Practical info API error:', error.response?.data || error.message);
      throw new Error(`Practical info generation failed: ${error.message}`);
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

      return parsed;

    } catch (error) {
      console.error(`Failed to parse practical info for ${city}:`, responseText.substring(0, 200));

      // Return basic fallback
      return {
        parking: {
          recommendation: `Check city parking garages`,
          zones: 'Historic center may have restrictions',
          tips: 'Arrive early for best availability',
          difficulty: 'moderate'
        },
        transportation: {
          bestOption: 'walking',
          publicTransport: 'Local buses and trams available',
          bikeRental: 'Check for city bike-share programs',
          tips: 'City centers usually walkable'
        },
        localTips: [
          'Shops may close for lunch',
          'Learn basic local phrases',
          'Carry some cash'
        ],
        timing: {
          museums: 'Check opening hours in advance',
          markets: 'Usually morning is best',
          restaurants: 'Book ahead for dinner',
          avoid: 'Peak tourist season crowds'
        },
        safety: {
          overall: 'Generally safe - use common sense',
          avoidAreas: 'Research before visiting',
          scams: 'Watch for common tourist scams',
          emergency: '112 for emergencies'
        },
        language: {
          english: 'Varies by location',
          helpful: ['Hello', 'Thank you', 'Please'],
          tip: 'Locals appreciate attempts to speak their language'
        },
        money: {
          atms: 'Available throughout city',
          cards: 'Widely accepted',
          tipping: 'Check local customs',
          costs: 'Research typical prices'
        },
        emergency: {
          hospital: 'Look for hospitals with emergency departments',
          police: 'Police stations in city center',
          pharmacy: 'Green cross signs indicate pharmacies',
          numbers: 'Emergency 112'
        }
      };
    }
  }
}

module.exports = PracticalInfoAgent;
