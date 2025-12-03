/**
 * Day Planner Agent
 * Creates the foundational day-by-day structure for the entire trip
 */

const axios = require('axios');
const { parseJsonResponse } = require('../utils/jsonParser');

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

    // Retry logic for API timeouts AND JSON parsing failures
    const MAX_ATTEMPTS = 3;
    let lastError;
    let lastRawResponse = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`📅 Day Planner: Attempt ${attempt}/${MAX_ATTEMPTS}`);
        const response = await this.callPerplexity(prompt);
        lastRawResponse = response;
        const parsed = this.parseResponse(response);
        console.log(`✓ Day Planner: Created ${parsed.totalDays}-day structure`);
        return parsed;
      } catch (error) {
        lastError = error;
        const isRetryable = error.message.includes('timeout') ||
                           error.message.includes('JSON parsing failed') ||
                           error.message.includes('Unexpected end of JSON') ||
                           error.message.includes('No JSON object found');

        if (attempt < MAX_ATTEMPTS && isRetryable) {
          console.log(`⚠️  Day Planner: ${error.message} on attempt ${attempt}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
        } else {
          // Log the raw response for debugging before throwing
          if (lastRawResponse) {
            console.error('📅 Day Planner: Final raw response that failed parsing:', lastRawResponse.substring(0, 500));
          }
          throw error;
        }
      }
    }

    throw lastError;
  }

  buildPrompt() {
    const { waypoints, agent, origin, destination } = this.routeData;
    const { startDate, endDate, pace = 'moderate', personalization } = this.preferences;

    // Calculate total distance
    const totalDistance = this.calculateTotalDistance(waypoints);

    // Build personalization context for the AI
    const personalizationContext = this.buildPersonalizationContext(personalization);

    // Build city list - handle both formats (name/location for old, city for new)
    // CRITICAL FIX: Add logging to debug missing city names
    console.log('📅 Processing waypoints for cities:', JSON.stringify(waypoints, null, 2));
    const cities = waypoints?.map(w => {
      const cityName = w.city || w.name || w.location;
      if (!cityName) {
        console.warn('⚠️  Waypoint missing city name:', w);
      }
      return cityName;
    }).filter(Boolean) || [];
    console.log('📅 Extracted cities:', cities);

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
${personalizationContext}

TASK: Create a realistic day-by-day structure for this road trip.

CRITICAL RULES:
1. ONLY USE THE EXACT CITIES LISTED ABOVE - DO NOT ADD ANY OTHER CITIES
2. NEVER create days for intermediate cities not in the list
3. Each "location" field MUST be one of: ${cities.join(', ')}
4. Plan days to cover ONLY these ${cities.length} cities

REQUIREMENTS:
1. Calculate realistic daily driving times (max 3-4 hours per day)
2. Include rest breaks every 2 hours of driving
3. Account for arrival/departure days (shorter activity windows)
4. Match the ${pace} pace:
   - Relaxed: 2-3 activities per day, lots of free time
   - Moderate: 3-4 activities per day, balanced
   - Packed: 4-5 activities per day, full days
5. Theme each day based on ${agent} focus
6. Leave time windows for: breakfast, lunch, dinner, check-in/out

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
      "blocks": [
        {
          "period": "afternoon",
          "timeRange": "14:00-18:00",
          "zoneFocus": "Old Town",
          "theme": "Historic center exploration",
          "activitySlots": 3,
          "transportWithinZone": "walking",
          "maxRadius": "1km",
          "energyLevel": "moderate"
        },
        {
          "period": "evening",
          "timeRange": "19:00-22:00",
          "zoneFocus": "Dining district",
          "theme": "Local cuisine experience",
          "activitySlots": 1,
          "transportWithinZone": "walking",
          "maxRadius": "500m",
          "energyLevel": "relaxed"
        }
      ],
      "overnight": "Aix-en-Provence",
      "notes": "Late arrival day - keep activities clustered in walking distance"
    },
    {
      "day": 2,
      "date": "2025-11-16",
      "location": "Montpellier",
      "theme": "Coastal City Discovery",
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
      "blocks": [
        {
          "period": "morning",
          "timeRange": "11:00-13:00",
          "zoneFocus": "Arrival area",
          "theme": "First impressions & lunch",
          "activitySlots": 2,
          "transportWithinZone": "walking",
          "maxRadius": "1km",
          "energyLevel": "moderate"
        },
        {
          "period": "afternoon",
          "timeRange": "14:00-18:00",
          "zoneFocus": "Main attractions",
          "theme": "City highlights tour",
          "activitySlots": 4,
          "transportWithinZone": "walking + short metro",
          "maxRadius": "2km",
          "energyLevel": "active"
        }
      ],
      "overnight": "Montpellier",
      "notes": "Group activities geographically - minimize transport time"
    }
  ]
}

IMPORTANT ABOUT BLOCKS:
- Use "morning" (8:00-13:00), "afternoon" (13:00-18:00), "evening" (18:00-22:00)
- zoneFocus: Geographic area where activities should be clustered
- activitySlots: Number of activities to fit in this block
- maxRadius: Maximum distance between activities in the block
- Theme activities geographically so travelers explore ONE area at a time

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
          max_tokens: 4096,  // Increased to prevent truncation on longer itineraries
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
    // Use shared JSON parser with automatic repair
    const parsed = parseJsonResponse(responseText, { agentName: 'Day Planner' });

    // Validate structure
    if (!parsed.totalDays || !Array.isArray(parsed.days)) {
      throw new Error('Invalid day structure format');
    }

    // Ensure we have at least some valid days
    if (parsed.days.length === 0) {
      throw new Error('No valid days found in response');
    }

    console.log(`📅 Day Planner: Successfully parsed ${parsed.days.length} days`);
    return parsed;
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

  /**
   * Build personalization context for AI prompts
   * Transforms the personalization object into natural language guidance
   */
  buildPersonalizationContext(personalization) {
    if (!personalization) return '';

    const sections = [];

    // Trip story - the most important context
    if (personalization.tripStory && personalization.tripStory.trim()) {
      sections.push(`
TRAVELER'S STORY:
"${personalization.tripStory.trim()}"
(Use this context to deeply personalize the experience)`);
    }

    // Build structured preferences
    const preferences = [];

    // Occasion
    if (personalization.occasion) {
      const occasionLabels = {
        'honeymoon': 'This is a honeymoon trip - prioritize romantic experiences, intimate settings, and special moments',
        'anniversary': 'This is an anniversary celebration - include romantic restaurants, scenic spots for couples, and memorable experiences',
        'birthday': 'This is a birthday trip - include celebratory venues, special experiences, and fun activities',
        'graduation': 'This is a graduation celebration - include vibrant venues, social spots, and memorable experiences',
        'retirement': 'This is a retirement trip - focus on relaxation, comfort, scenic beauty, and leisurely pace',
        'babymoon': 'This is a babymoon - prioritize relaxation, comfort, spa experiences, and easy-going activities',
        'reunion': 'This is a group reunion - include venues good for groups, social dining, and shared experiences',
        'solo-adventure': 'This is a solo adventure - include social hostels, walking tours, and solo-friendly experiences',
        'girls-trip': 'This is a girls trip - include spa days, trendy restaurants, shopping, and social venues',
        'guys-trip': 'This is a guys trip - include adventure activities, sports bars, and group-friendly venues',
        'family-vacation': 'This is a family vacation - prioritize kid-friendly activities, family restaurants, and safe areas',
        'just-because': 'This is a spontaneous getaway - create a balanced, enjoyable experience'
      };
      preferences.push(occasionLabels[personalization.occasion] || `Trip occasion: ${personalization.occasion}`);
    }

    // Travel style
    if (personalization.travelStyle) {
      const styleLabels = {
        'explorer': 'Travel style: Explorer - they want to cover ground, see as much as possible, and check off must-sees',
        'relaxer': 'Travel style: Relaxer - they prefer slow mornings, leisurely meals, and deep experiences over quantity',
        'culture': 'Travel style: Culture Seeker - prioritize museums, historical sites, art, and cultural immersion',
        'adventurer': 'Travel style: Adventurer - focus on outdoor activities, physical experiences, and adrenaline',
        'foodie': 'Travel style: Foodie - culinary experiences should be the centerpiece of each day'
      };
      preferences.push(styleLabels[personalization.travelStyle] || `Travel style: ${personalization.travelStyle}`);
    }

    // Pace (1-5 scale)
    if (personalization.pace !== undefined) {
      const paceLabels = {
        1: 'Trip pace: Very Relaxed - slow mornings, 2-3 activities max per day, lots of downtime',
        2: 'Trip pace: Relaxed - comfortable pace, 3 activities per day, time to breathe',
        3: 'Trip pace: Balanced - moderate pace, 3-4 activities per day, good mix',
        4: 'Trip pace: Active - fuller days, 4-5 activities, efficient but not rushed',
        5: 'Trip pace: Packed - maximize every hour, see everything possible, early starts and late finishes'
      };
      preferences.push(paceLabels[personalization.pace] || `Trip pace: ${personalization.pace}/5`);
    }

    // Interests
    if (personalization.interests && personalization.interests.length > 0) {
      const interestLabels = {
        'history': 'history & heritage',
        'art': 'art & galleries',
        'architecture': 'architecture & design',
        'nature': 'nature & outdoors',
        'food': 'culinary experiences',
        'wine': 'wine & vineyards',
        'nightlife': 'nightlife & entertainment',
        'shopping': 'shopping & markets',
        'photography': 'photography spots',
        'adventure': 'adventure activities',
        'wellness': 'wellness & spa',
        'local-culture': 'local culture & traditions',
        'beaches': 'beaches & coastal areas',
        'mountains': 'mountains & hiking',
        'museums': 'museums & exhibits'
      };
      const interests = personalization.interests.map(i => interestLabels[i] || i).join(', ');
      preferences.push(`Key interests: ${interests} - prioritize activities in these areas`);
    }

    // Dining preferences
    if (personalization.diningStyle) {
      const diningLabels = {
        'street': 'Dining preference: Street food and casual local eateries - authentic, budget-friendly spots',
        'casual': 'Dining preference: Casual restaurants - good food without formality',
        'mix': 'Dining preference: Mix of everything - variety from casual to nice dinners',
        'fine': 'Dining preference: Fine dining - upscale restaurants, Michelin-starred when available'
      };
      preferences.push(diningLabels[personalization.diningStyle] || `Dining style: ${personalization.diningStyle}`);
    }

    // Dietary restrictions
    if (personalization.dietary && personalization.dietary.length > 0) {
      preferences.push(`Dietary requirements: ${personalization.dietary.join(', ')} - ensure restaurant recommendations accommodate this`);
    }

    // Budget
    if (personalization.budget) {
      const budgetLabels = {
        'budget': 'Budget level: Budget-conscious - prioritize free attractions, affordable eats, value accommodations',
        'mid': 'Budget level: Mid-range - comfortable spending on good experiences without excess',
        'luxury': 'Budget level: Luxury - premium experiences, 5-star accommodations, fine dining, VIP access'
      };
      preferences.push(budgetLabels[personalization.budget] || `Budget: ${personalization.budget}`);
    }

    // Accommodation preference
    if (personalization.accommodation) {
      const accomLabels = {
        'budget': 'Accommodation: Budget - hostels, budget hotels, basic but clean',
        'mid': 'Accommodation: Mid-range - comfortable hotels with good amenities',
        'luxury': 'Accommodation: Luxury - 5-star hotels, boutique luxury properties',
        'unique': 'Accommodation: Unique stays - interesting properties like historic hotels, unusual venues'
      };
      preferences.push(accomLabels[personalization.accommodation] || `Accommodation: ${personalization.accommodation}`);
    }

    // Accessibility needs
    if (personalization.accessibility && personalization.accessibility.length > 0) {
      preferences.push(`Accessibility needs: ${personalization.accessibility.join(', ')} - ensure venues and activities accommodate these requirements`);
    }

    // Additional preferences
    if (personalization.avoidCrowds) {
      preferences.push('IMPORTANT: Avoid crowded tourist spots - suggest early morning visits, off-peak times, or lesser-known alternatives');
    }

    if (personalization.preferOutdoor) {
      preferences.push('Preference: Outdoor activities - prioritize open-air venues, gardens, terraces, and nature');
    }

    // Combine all preferences
    if (preferences.length > 0) {
      sections.push(`
PERSONALIZATION PREFERENCES:
${preferences.map(p => `• ${p}`).join('\n')}

IMPORTANT: Use these preferences to tailor every recommendation. The traveler has specifically shared these details to get a personalized experience.`);
    }

    return sections.join('\n');
  }
}

module.exports = DayPlannerAgent;
