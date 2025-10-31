/**
 * Restaurant Agent
 * Finds specific restaurants for breakfast, lunch, and dinner each day
 */

const axios = require('axios');

class RestaurantAgent {
  constructor(routeData, dayStructure, budget, progressCallback) {
    this.routeData = routeData;
    this.dayStructure = dayStructure;
    this.budget = budget;
    this.onProgress = progressCallback || (() => {});
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  async generate() {
    console.log('🍽️  Restaurant Agent: Finding dining spots...');

    const allMeals = [];
    const totalMeals = this.dayStructure.days.length * 3; // breakfast, lunch, dinner per day
    let completed = 0;

    for (const day of this.dayStructure.days) {
      const city = this.extractMainCity(day.location);

      this.onProgress({ current: completed + 1, total: totalMeals });

      // Generate all meals for this day in parallel
      const [breakfast, lunch, dinner] = await Promise.all([
        this.generateMeal(city, day, 'breakfast'),
        this.generateMeal(city, day, 'lunch'),
        this.generateMeal(city, day, 'dinner')
      ]);

      allMeals.push({
        day: day.day,
        date: day.date,
        city,
        meals: { breakfast, lunch, dinner }
      });

      completed += 3;
      this.onProgress({ current: completed, total: totalMeals });
    }

    console.log(`✓ Restaurants: Found ${allMeals.length * 3} dining recommendations`);
    return allMeals;
  }

  async generateMeal(city, dayInfo, mealType) {
    const prompt = this.buildPrompt(city, dayInfo, mealType);
    const response = await this.callPerplexity(prompt);
    return this.parseResponse(response, mealType);
  }

  buildPrompt(city, dayInfo, mealType) {
    const { agent } = this.routeData;

    const timeSlots = {
      breakfast: { time: '08:00-10:00', duration: '1 hour' },
      lunch: { time: '12:30-14:30', duration: '1.5 hours' },
      dinner: { time: '19:30-22:00', duration: '2 hours' }
    };

    const slot = timeSlots[mealType];

    return `You are a ${agent} travel expert finding the perfect ${mealType} spot in ${city}.

DAY CONTEXT:
- Date: ${dayInfo.date}
- Day ${dayInfo.day}: ${dayInfo.theme}
- Meal: ${mealType}
- Typical time: ${slot.time}
- Budget: ${this.budget}

AGENT PERSONALITY: ${this.getAgentDescription(agent)}

TASK: Find ONE specific, real restaurant perfect for this ${mealType}.

REQUIREMENTS:
1. REAL restaurant name and exact address
2. Must be open for ${mealType} (verify hours)
3. Match ${agent} style and ${this.budget} budget
4. Price range: ${this.getPriceRangeDescription()}
5. Suggest specific arrival time
6. Explain WHY this fits the ${agent} traveler

MEAL-SPECIFIC GUIDANCE:
${this.getMealGuidance(mealType, agent)}

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no code blocks):

{
  "meal": "${mealType}",
  "suggestedTime": "08:30",
  "name": "Le Petit Jardin",
  "cuisine": "Traditional Provençal breakfast café",
  "address": "12 Rue des Cordeliers, 13100 Aix-en-Provence",
  "priceRange": "€€",
  "estimatedCostPerPerson": 15,
  "vibe": "Charming courtyard garden setting, fresh pastries daily, popular with locals",
  "signature": "Pain aux raisins, café crème, fresh orange juice",
  "whyThisAgent": "For ${agent} travelers, this café offers [specific reason why perfect]",
  "reservationNeeded": false,
  "dressCode": "casual",
  "openingHours": "07:00-11:00",
  "practicalTips": "Arrive before 9am for best pastry selection. Outdoor seating fills up fast on weekends."
}

IMPORTANT: Return ONLY the JSON object, no other text.`;
  }

  getMealGuidance(mealType, agent) {
    const guidance = {
      breakfast: {
        adventure: 'Hearty, energizing breakfast near activity starting points. Quick service preferred.',
        culture: 'Historic cafés with character, traditional local breakfast customs.',
        food: 'Artisanal bakeries, fresh ingredients, local specialties. Quality over speed.',
        'hidden-gems': 'Local spots where residents eat, not tourist traps.',
        'best-overall': 'Good mix of quality, convenience, and local flavor.'
      },
      lunch: {
        adventure: 'Casual spots with outdoor seating, refueling focus, quick service.',
        culture: 'Traditional regional cuisine, historic establishments, leisurely dining.',
        food: 'Memorable culinary experience, seasonal menus, local ingredients.',
        'hidden-gems': 'Neighborhood bistros, family-run places, undiscovered gems.',
        'best-overall': 'Well-reviewed local favorites, good value, authentic.'
      },
      dinner: {
        adventure: 'Relaxed atmosphere, hearty portions, good value.',
        culture: 'Fine dining or culturally significant restaurants, full experience.',
        food: 'Highlight meal of the day, chef-driven, innovative or traditional excellence.',
        'hidden-gems': 'Secret spots locals recommend, unique atmosphere.',
        'best-overall': 'Special but not pretentious, memorable experience.'
      }
    };

    return guidance[mealType][agent] || guidance[mealType]['best-overall'];
  }

  getPriceRangeDescription() {
    const ranges = {
      budget: '€-€€ (Under €20 per person)',
      mid: '€€-€€€ (€20-40 per person)',
      luxury: '€€€-€€€€ (€40+ per person)'
    };
    return ranges[this.budget] || ranges.mid;
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
              content: 'You are a local food expert with deep knowledge of restaurants. Return ONLY valid JSON with no markdown, no code blocks.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.5
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
      console.error('Restaurant API error:', error.response?.data || error.message);
      throw new Error(`Restaurant search failed: ${error.message}`);
    }
  }

  parseResponse(responseText, mealType) {
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
      if (!parsed.name || !parsed.cuisine) {
        throw new Error('Missing required restaurant fields');
      }

      return parsed;

    } catch (error) {
      console.error(`Failed to parse ${mealType} restaurant:`, responseText.substring(0, 200));

      // Return fallback
      return {
        meal: mealType,
        suggestedTime: mealType === 'breakfast' ? '08:30' : mealType === 'lunch' ? '13:00' : '20:00',
        name: 'Local Restaurant',
        cuisine: 'Regional',
        address: 'City Center',
        priceRange: '€€',
        estimatedCostPerPerson: 25,
        vibe: 'Casual local dining',
        signature: 'Regional specialties',
        whyThisAgent: 'Good local option',
        reservationNeeded: false,
        dressCode: 'casual',
        openingHours: '08:00-22:00',
        practicalTips: 'Ask locals for current favorites'
      };
    }
  }

  extractMainCity(location) {
    if (location.includes('→')) {
      return location.split('→').pop().trim();
    }
    return location;
  }

  getAgentDescription(agent) {
    const descriptions = {
      adventure: 'Active travelers who value convenience and hearty meals',
      culture: 'Culturally curious travelers seeking authentic dining experiences',
      food: 'Culinary enthusiasts prioritizing exceptional food experiences',
      'hidden-gems': 'Explorers seeking undiscovered local favorites',
      'best-overall': 'Well-rounded travelers wanting quality and authenticity'
    };
    return descriptions[agent] || descriptions['best-overall'];
  }
}

module.exports = RestaurantAgent;
