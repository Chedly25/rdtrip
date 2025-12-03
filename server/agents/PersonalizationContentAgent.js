/**
 * Personalization Content Agent
 *
 * Generates AI-powered personalized content based on user preferences:
 * - Personalized trip intro (headline, subheadline, narrative)
 * - Themed day titles
 * - Trip style profile (cultural, adventure, relaxation, culinary, nature percentages)
 * - Full trip narrative
 */

const axios = require('axios');

class PersonalizationContentAgent {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  /**
   * Generate all personalized content for a route
   * @param {Object} params - Generation parameters
   * @param {Object} params.routeData - Route information (origin, destination, waypoints)
   * @param {Object} params.personalization - User personalization preferences
   * @param {Object} params.dayStructure - Day planner output with day details
   * @param {Array} params.activities - Activities per day
   * @param {Array} params.restaurants - Restaurants per day
   * @returns {Object} Personalized content
   */
  async generate({ routeData, personalization, dayStructure, activities, restaurants }) {
    console.log('✨ PersonalizationContentAgent: Generating personalized content...');

    // If no personalization provided, return minimal defaults
    if (!personalization || !this.hasPersonalization(personalization)) {
      console.log('   ⚠️ No personalization data - using default content');
      return this.generateDefaultContent(routeData, dayStructure);
    }

    try {
      // Generate all content in parallel for speed
      const [intro, dayThemes, tripStyle, narrative] = await Promise.all([
        this.generatePersonalizedIntro(routeData, personalization, dayStructure),
        this.generateDayThemes(dayStructure, personalization, activities),
        this.calculateTripStyleProfile(personalization, activities),
        this.generateTripNarrative(routeData, personalization, dayStructure, activities, restaurants)
      ]);

      console.log('✓ PersonalizationContentAgent: Content generation complete');

      return {
        personalizedIntro: intro,
        dayThemes,
        tripStyleProfile: tripStyle,
        tripNarrative: narrative
      };

    } catch (error) {
      console.error('❌ PersonalizationContentAgent failed:', error.message);
      // Return defaults on failure
      return this.generateDefaultContent(routeData, dayStructure);
    }
  }

  /**
   * Generate personalized intro banner content
   */
  async generatePersonalizedIntro(routeData, personalization, dayStructure) {
    const totalDays = dayStructure?.totalDays || 5;
    const cities = dayStructure?.days?.map(d => d.location).filter(Boolean) || [];
    const uniqueCities = [...new Set(cities)];

    const prompt = this.buildIntroPrompt(routeData, personalization, totalDays, uniqueCities);

    try {
      const response = await this.callPerplexity(prompt, 800);
      const parsed = this.parseJsonResponse(response);

      return {
        headline: parsed.headline || this.generateFallbackHeadline(personalization, routeData),
        subheadline: parsed.subheadline || `${totalDays} days exploring ${uniqueCities.slice(0, 3).join(', ')}`,
        narrative: parsed.narrative || '',
        highlights: parsed.highlights || [],
        personalizedFor: this.extractPersonalizedForTags(personalization)
      };

    } catch (error) {
      console.warn('   ⚠️ Intro generation failed:', error.message);
      return {
        headline: this.generateFallbackHeadline(personalization, routeData),
        subheadline: `${totalDays} days exploring ${uniqueCities.slice(0, 3).join(', ')}`,
        narrative: '',
        highlights: [],
        personalizedFor: this.extractPersonalizedForTags(personalization)
      };
    }
  }

  /**
   * Generate themed titles for each day
   */
  async generateDayThemes(dayStructure, personalization, activities) {
    if (!dayStructure?.days || dayStructure.days.length === 0) {
      return [];
    }

    const dayThemes = [];

    for (const day of dayStructure.days) {
      // Get activities for this day
      const dayActivities = activities?.find(a => a.day === day.day)?.activities || [];
      const activityNames = dayActivities.slice(0, 5).map(a => a.name).join(', ');

      // Generate theme based on activities and personalization
      const theme = this.generateDayTheme(day, activityNames, personalization);

      dayThemes.push({
        day: day.day,
        date: day.date,
        city: day.location,
        theme: theme.title,
        subtitle: theme.subtitle,
        icon: theme.icon
      });
    }

    return dayThemes;
  }

  /**
   * Generate theme for a single day
   */
  generateDayTheme(day, activityNames, personalization) {
    const city = day.location || 'Unknown';
    const isArrival = day.day === 1;
    const isDeparture = day.notes?.toLowerCase().includes('departure');

    // Occasion-specific themes
    if (personalization?.occasion) {
      const occasionThemes = this.getOccasionDayTheme(personalization.occasion, day.day, city);
      if (occasionThemes) return occasionThemes;
    }

    // Activity-based themes
    const activityLower = activityNames.toLowerCase();

    if (activityLower.includes('museum') || activityLower.includes('gallery')) {
      return { title: `Art & Culture in ${city}`, subtitle: 'Museums, galleries & creative spaces', icon: 'palette' };
    }
    if (activityLower.includes('hike') || activityLower.includes('trail') || activityLower.includes('nature')) {
      return { title: `Nature's Canvas`, subtitle: `Outdoor adventures around ${city}`, icon: 'mountain' };
    }
    if (activityLower.includes('wine') || activityLower.includes('vineyard')) {
      return { title: `Vineyard Dreams`, subtitle: `Wine country exploration`, icon: 'wine' };
    }
    if (activityLower.includes('beach') || activityLower.includes('coastal')) {
      return { title: `Coastal Bliss`, subtitle: `Sun, sand & sea in ${city}`, icon: 'sun' };
    }
    if (activityLower.includes('market') || activityLower.includes('food')) {
      return { title: `Culinary Discovery`, subtitle: `Tasting ${city}'s flavors`, icon: 'utensils' };
    }
    if (activityLower.includes('historic') || activityLower.includes('cathedral') || activityLower.includes('castle')) {
      return { title: `Through the Ages`, subtitle: `${city}'s historic treasures`, icon: 'landmark' };
    }

    // Default themes based on day position
    if (isArrival) {
      return { title: `Arrival in ${city}`, subtitle: 'First impressions & settling in', icon: 'plane-arrival' };
    }
    if (isDeparture) {
      return { title: `Farewell to ${city}`, subtitle: 'Last moments & memories', icon: 'heart' };
    }

    // Generic exploration theme
    return { title: `Discovering ${city}`, subtitle: 'Local gems & hidden corners', icon: 'compass' };
  }

  /**
   * Get occasion-specific day themes
   */
  getOccasionDayTheme(occasion, dayNumber, city) {
    const themes = {
      honeymoon: [
        { title: `Romance Begins`, subtitle: `Your love story in ${city}`, icon: 'heart' },
        { title: `Lovers' Paradise`, subtitle: `Intimate moments together`, icon: 'sparkles' },
        { title: `Sweet Escape`, subtitle: `Creating memories for two`, icon: 'heart' }
      ],
      anniversary: [
        { title: `Celebrating Us`, subtitle: `Another year of adventure`, icon: 'champagne' },
        { title: `Love Renewed`, subtitle: `Romantic moments in ${city}`, icon: 'heart' }
      ],
      birthday: [
        { title: `Birthday Adventures`, subtitle: `Your special day in ${city}`, icon: 'cake' },
        { title: `Celebration Mode`, subtitle: `Making birthday memories`, icon: 'party' }
      ],
      'girls-trip': [
        { title: `Squad Goals`, subtitle: `Girls take on ${city}`, icon: 'users' },
        { title: `Besties Abroad`, subtitle: `Unforgettable moments`, icon: 'sparkles' }
      ],
      'guys-trip': [
        { title: `The Crew`, subtitle: `Boys' adventure in ${city}`, icon: 'users' },
        { title: `Epic Times`, subtitle: `Making legendary memories`, icon: 'star' }
      ],
      'solo-adventure': [
        { title: `Self Discovery`, subtitle: `Your journey through ${city}`, icon: 'user' },
        { title: `Flying Solo`, subtitle: `Freedom & exploration`, icon: 'compass' }
      ],
      'family-vacation': [
        { title: `Family Fun`, subtitle: `Adventures for all ages in ${city}`, icon: 'users' },
        { title: `Memory Making`, subtitle: `Quality time together`, icon: 'camera' }
      ]
    };

    const occasionThemes = themes[occasion];
    if (occasionThemes) {
      return occasionThemes[Math.min(dayNumber - 1, occasionThemes.length - 1)];
    }
    return null;
  }

  /**
   * Calculate trip style profile percentages
   */
  calculateTripStyleProfile(personalization, activities) {
    const profile = {
      cultural: 20,
      adventure: 20,
      relaxation: 20,
      culinary: 20,
      nature: 20
    };

    // Adjust based on personalization
    if (personalization?.travelStyle) {
      switch (personalization.travelStyle) {
        case 'culture':
          profile.cultural += 30;
          profile.adventure -= 10;
          profile.relaxation -= 10;
          break;
        case 'adventurer':
          profile.adventure += 30;
          profile.relaxation -= 15;
          profile.cultural -= 10;
          break;
        case 'relaxer':
          profile.relaxation += 30;
          profile.adventure -= 15;
          profile.cultural -= 10;
          break;
        case 'foodie':
          profile.culinary += 30;
          profile.adventure -= 10;
          profile.nature -= 10;
          break;
        case 'explorer':
          profile.cultural += 15;
          profile.adventure += 15;
          profile.relaxation -= 15;
          break;
      }
    }

    // Adjust based on interests
    if (personalization?.interests) {
      for (const interest of personalization.interests) {
        switch (interest) {
          case 'history':
          case 'art':
          case 'architecture':
          case 'museums':
            profile.cultural += 5;
            break;
          case 'adventure':
          case 'mountains':
            profile.adventure += 5;
            break;
          case 'beaches':
          case 'wellness':
            profile.relaxation += 5;
            break;
          case 'food':
          case 'wine':
            profile.culinary += 5;
            break;
          case 'nature':
          case 'photography':
            profile.nature += 5;
            break;
        }
      }
    }

    // Adjust based on pace
    if (personalization?.pace !== undefined) {
      if (personalization.pace <= 2) {
        profile.relaxation += 15;
        profile.adventure -= 10;
      } else if (personalization.pace >= 4) {
        profile.adventure += 10;
        profile.relaxation -= 10;
      }
    }

    // Normalize to 100%
    const total = Object.values(profile).reduce((sum, val) => sum + val, 0);
    for (const key of Object.keys(profile)) {
      profile[key] = Math.round((profile[key] / total) * 100);
    }

    // Ensure total is exactly 100
    const newTotal = Object.values(profile).reduce((sum, val) => sum + val, 0);
    if (newTotal !== 100) {
      profile.cultural += (100 - newTotal);
    }

    return profile;
  }

  /**
   * Generate full trip narrative
   */
  async generateTripNarrative(routeData, personalization, dayStructure, activities, restaurants) {
    const totalDays = dayStructure?.totalDays || 5;
    const cities = dayStructure?.days?.map(d => d.location).filter(Boolean) || [];
    const uniqueCities = [...new Set(cities)];

    // Build context for narrative
    const context = {
      origin: routeData.origin?.name || routeData.origin,
      destination: routeData.destination?.name || routeData.destination,
      cities: uniqueCities,
      totalDays,
      occasion: personalization?.occasion,
      travelStyle: personalization?.travelStyle,
      interests: personalization?.interests || [],
      tripStory: personalization?.tripStory,
      diningStyle: personalization?.diningStyle
    };

    const prompt = this.buildNarrativePrompt(context);

    try {
      const response = await this.callPerplexity(prompt, 500);
      // Clean up the response - remove markdown formatting
      let narrative = response.trim();
      if (narrative.startsWith('"') && narrative.endsWith('"')) {
        narrative = narrative.slice(1, -1);
      }
      return narrative;

    } catch (error) {
      console.warn('   ⚠️ Narrative generation failed:', error.message);
      return this.generateFallbackNarrative(context);
    }
  }

  /**
   * Build prompt for personalized intro
   */
  buildIntroPrompt(routeData, personalization, totalDays, cities) {
    const origin = routeData.origin?.name || routeData.origin;
    const destination = routeData.destination?.name || routeData.destination;
    const occasionText = personalization?.occasion ? `This is a ${this.formatOccasion(personalization.occasion)} trip.` : '';
    const tripStoryText = personalization?.tripStory ? `Traveler's context: "${personalization.tripStory}"` : '';

    return `Generate a personalized trip intro for this road trip. Make it feel personal and exciting.

TRIP DETAILS:
- Route: ${origin} to ${destination}
- Duration: ${totalDays} days
- Cities: ${cities.join(', ')}
${occasionText}
${tripStoryText}

PREFERENCES:
- Travel style: ${personalization?.travelStyle || 'balanced'}
- Interests: ${personalization?.interests?.join(', ') || 'general'}
- Dining: ${personalization?.diningStyle || 'mix'}
- Pace: ${personalization?.pace || 3}/5

Generate JSON with:
{
  "headline": "Catchy, personal headline (max 8 words, reference occasion if applicable)",
  "subheadline": "Brief descriptor with duration and key cities (max 12 words)",
  "narrative": "2-3 sentences describing what makes this trip special for them",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"] (3 things they'll love based on preferences)
}

IMPORTANT:
- Make headline emotional and personal (not generic "Your Trip to X")
- Reference their occasion/interests subtly
- Keep language warm and exciting
- Return ONLY valid JSON`;
  }

  /**
   * Build prompt for trip narrative
   */
  buildNarrativePrompt(context) {
    return `Write a brief, evocative trip narrative (2-3 sentences) for this road trip.

TRIP:
- From ${context.origin} to ${context.destination}
- ${context.totalDays} days through: ${context.cities.join(', ')}
- Occasion: ${context.occasion || 'leisure trip'}
- Style: ${context.travelStyle || 'explorer'}
- Interests: ${context.interests.join(', ') || 'general'}
${context.tripStory ? `- Traveler's story: "${context.tripStory}"` : ''}

Write a warm, personal narrative that:
1. Sets the scene for their journey
2. References their specific interests or occasion
3. Builds anticipation

Return ONLY the narrative text, no formatting.`;
  }

  /**
   * Call Perplexity API
   */
  async callPerplexity(prompt, maxTokens = 500) {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a creative travel writer. Generate warm, personal, evocative content. Return ONLY what is asked - no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Parse JSON from response
   */
  parseJsonResponse(response) {
    let text = response.trim();

    // Remove markdown code blocks
    if (text.includes('```json')) {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) text = match[1];
    } else if (text.includes('```')) {
      const match = text.match(/```\s*([\s\S]*?)\s*```/);
      if (match) text = match[1];
    }

    // Find JSON boundaries
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON found in response');
    }

    text = text.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(text);
  }

  /**
   * Check if personalization has any values
   */
  hasPersonalization(p) {
    return !!(
      p.tripStory ||
      p.occasion ||
      p.travelStyle ||
      p.pace !== undefined ||
      (p.interests && p.interests.length > 0) ||
      p.diningStyle ||
      (p.dietary && p.dietary.length > 0) ||
      p.budget ||
      p.accommodation ||
      (p.accessibility && p.accessibility.length > 0) ||
      p.avoidCrowds ||
      p.preferOutdoor
    );
  }

  /**
   * Generate fallback headline based on occasion
   */
  generateFallbackHeadline(personalization, routeData) {
    const destination = routeData.destination?.name || routeData.destination || 'Europe';

    if (personalization?.occasion) {
      const headlines = {
        honeymoon: `Your Honeymoon Adventure Awaits`,
        anniversary: `Celebrating Love in ${destination}`,
        birthday: `Birthday Adventures in ${destination}`,
        graduation: `Graduate's Grand Tour`,
        retirement: `The Journey You Deserve`,
        babymoon: `Peaceful Moments Await`,
        reunion: `Together Again in ${destination}`,
        'solo-adventure': `Your Solo Discovery`,
        'girls-trip': `Squad Adventures Await`,
        'guys-trip': `Epic Journey Ahead`,
        'family-vacation': `Family Memories in the Making`,
        'just-because': `Your Perfect Escape`
      };
      return headlines[personalization.occasion] || `Your ${destination} Adventure`;
    }

    return `Your ${destination} Adventure`;
  }

  /**
   * Generate fallback narrative
   */
  generateFallbackNarrative(context) {
    const { origin, destination, totalDays, cities, occasion } = context;

    if (occasion === 'honeymoon') {
      return `Begin your married life with an unforgettable journey from ${origin} to ${destination}. ${totalDays} days of romance, discovery, and cherished moments through ${cities.slice(0, 3).join(', ')}.`;
    }
    if (occasion === 'anniversary') {
      return `Celebrate your love with a journey through ${cities.slice(0, 3).join(', ')}. ${totalDays} days of romantic discoveries and new memories to add to your story.`;
    }

    return `Embark on a ${totalDays}-day adventure from ${origin} to ${destination}. Through ${cities.slice(0, 3).join(', ')}, you'll discover hidden gems, local flavors, and unforgettable moments.`;
  }

  /**
   * Extract "personalized for" tags from preferences
   */
  extractPersonalizedForTags(personalization) {
    const tags = [];

    if (personalization?.occasion) {
      tags.push(this.formatOccasion(personalization.occasion));
    }
    if (personalization?.travelStyle) {
      const styles = {
        explorer: 'explorers',
        relaxer: 'relaxation seekers',
        culture: 'culture enthusiasts',
        adventurer: 'adventure seekers',
        foodie: 'food lovers'
      };
      tags.push(styles[personalization.travelStyle] || personalization.travelStyle);
    }
    if (personalization?.interests && personalization.interests.length > 0) {
      // Add top 2 interests
      const interestLabels = {
        history: 'history buffs',
        art: 'art lovers',
        nature: 'nature enthusiasts',
        food: 'foodies',
        wine: 'wine connoisseurs',
        adventure: 'thrill seekers'
      };
      for (const interest of personalization.interests.slice(0, 2)) {
        if (interestLabels[interest]) {
          tags.push(interestLabels[interest]);
        }
      }
    }

    return [...new Set(tags)].slice(0, 4); // Max 4 unique tags
  }

  /**
   * Format occasion for display
   */
  formatOccasion(occasion) {
    const labels = {
      honeymoon: 'honeymoon',
      anniversary: 'anniversary trip',
      birthday: 'birthday celebration',
      graduation: 'graduation trip',
      retirement: 'retirement adventure',
      babymoon: 'babymoon',
      reunion: 'reunion',
      'solo-adventure': 'solo adventure',
      'girls-trip': 'girls trip',
      'guys-trip': 'guys trip',
      'family-vacation': 'family vacation',
      'just-because': 'getaway'
    };
    return labels[occasion] || occasion;
  }

  /**
   * Generate default content when no personalization
   */
  generateDefaultContent(routeData, dayStructure) {
    const destination = routeData.destination?.name || routeData.destination || 'Europe';
    const totalDays = dayStructure?.totalDays || 5;
    const cities = dayStructure?.days?.map(d => d.location).filter(Boolean) || [];
    const uniqueCities = [...new Set(cities)];

    return {
      personalizedIntro: {
        headline: `Your ${destination} Adventure`,
        subheadline: `${totalDays} days exploring ${uniqueCities.slice(0, 3).join(', ')}`,
        narrative: `Discover the best of ${destination} on this carefully crafted ${totalDays}-day journey.`,
        highlights: [],
        personalizedFor: []
      },
      dayThemes: dayStructure?.days?.map(day => ({
        day: day.day,
        date: day.date,
        city: day.location,
        theme: day.theme || `Day ${day.day} in ${day.location}`,
        subtitle: '',
        icon: 'compass'
      })) || [],
      tripStyleProfile: {
        cultural: 20,
        adventure: 20,
        relaxation: 20,
        culinary: 20,
        nature: 20
      },
      tripNarrative: ''
    };
  }
}

module.exports = PersonalizationContentAgent;
