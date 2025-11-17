/**
 * Perplexity AI Service
 * AI-powered route discovery and content generation
 */
const BaseService = require('./BaseService');

class PerplexityAIService extends BaseService {
  constructor(perplexityClient) {
    super('PerplexityAI');
    this.client = perplexityClient;
  }

  /**
   * Generate route suggestions using AI
   */
  async generateRouteSuggestions(origin, destination, preferences = {}) {
    this.logAction('Generate route suggestions', { origin, destination });

    const prompt = this.buildRoutePrompt(origin, destination, preferences);

    try {
      const response = await this.client.query(prompt, 'llama-3.1-sonar-large-128k-online', {
        temperature: 0.7,
        maxTokens: 4000
      });

      const suggestions = this.parseRouteResponse(response);
      this.logger.info(`Generated ${suggestions.length} route suggestions`);

      return suggestions;
    } catch (error) {
      this.handleError(error, 'generateRouteSuggestions');
    }
  }

  /**
   * Discover points of interest along a route
   */
  async discoverPointsOfInterest(route, preferences = {}) {
    this.logAction('Discover POIs', { routeLength: route.length });

    const prompt = this.buildPOIPrompt(route, preferences);

    try {
      const response = await this.client.query(prompt, 'llama-3.1-sonar-large-128k-online', {
        temperature: 0.6,
        maxTokens: 3000
      });

      const pois = this.parsePOIResponse(response);
      this.logger.info(`Discovered ${pois.length} points of interest`);

      return pois;
    } catch (error) {
      this.handleError(error, 'discoverPointsOfInterest');
    }
  }

  /**
   * Get destination recommendations
   */
  async getDestinationRecommendations(startingPoint, travelDuration, interests = []) {
    this.logAction('Get destination recommendations', { startingPoint, travelDuration });

    const prompt = `Given a starting point of ${startingPoint} and a travel duration of ${travelDuration}, 
recommend 5 destination cities or regions that would make excellent road trip destinations.

Consider these interests: ${interests.join(', ') || 'general tourism'}

For each destination, provide:
1. City/region name
2. Distance from ${startingPoint} (approximate)
3. Driving time (approximate)
4. Why it's a good destination
5. Main attractions (3-5)
6. Best season to visit

Respond in JSON format as an array of destinations.`;

    try {
      const response = await this.client.query(prompt, 'llama-3.1-sonar-large-128k-online', {
        temperature: 0.8,
        maxTokens: 3000
      });

      const recommendations = this.parseDestinationResponse(response);
      this.logger.info(`Generated ${recommendations.length} destination recommendations`);

      return recommendations;
    } catch (error) {
      this.handleError(error, 'getDestinationRecommendations');
    }
  }

  /**
   * Generate scenic stops along a route segment
   */
  async findScenicStops(startPoint, endPoint, roadType = 'highway') {
    this.logAction('Find scenic stops', { startPoint, endPoint, roadType });

    const prompt = `Find 3-5 scenic stops, viewpoints, or interesting places to visit along the route from ${startPoint} to ${endPoint}.

Focus on:
- Natural viewpoints
- Historical landmarks
- Photo-worthy locations
- Rest areas with views
- Small charming towns

For each stop, provide:
1. Name
2. Location (city/town)
3. Coordinates (if available)
4. Description (2-3 sentences)
5. Recommended duration (in minutes)
6. Why it's worth stopping

Respond in JSON format as an array of stops.`;

    try {
      const response = await this.client.query(prompt, 'llama-3.1-sonar-large-128k-online', {
        temperature: 0.7,
        maxTokens: 2500
      });

      const stops = this.parseScenicStopsResponse(response);
      this.logger.info(`Found ${stops.length} scenic stops`);

      return stops;
    } catch (error) {
      this.handleError(error, 'findScenicStops');
    }
  }

  /**
   * Get activity recommendations for a city
   */
  async getActivityRecommendations(city, duration, interests = []) {
    this.logAction('Get activity recommendations', { city, duration });

    const prompt = `Recommend activities and attractions for ${city} with a duration of ${duration}.

Interests: ${interests.join(', ') || 'general sightseeing'}

Provide 8-12 activities including:
- Must-see landmarks
- Museums and cultural sites
- Outdoor activities
- Local experiences
- Hidden gems

For each activity:
1. Name
2. Category (landmark, museum, outdoor, food, etc.)
3. Description (2-3 sentences)
4. Recommended duration (in minutes)
5. Approximate cost level (free, low, medium, high)
6. Best time to visit

Respond in JSON format as an array of activities.`;

    try {
      const response = await this.client.query(prompt, 'llama-3.1-sonar-large-128k-online', {
        temperature: 0.7,
        maxTokens: 3500
      });

      const activities = this.parseActivitiesResponse(response);
      this.logger.info(`Generated ${activities.length} activity recommendations`);

      return activities;
    } catch (error) {
      this.handleError(error, 'getActivityRecommendations');
    }
  }

  /**
   * Generate restaurant recommendations
   */
  async getRestaurantRecommendations(city, cuisine = 'local', priceRange = 'medium') {
    this.logAction('Get restaurant recommendations', { city, cuisine, priceRange });

    const prompt = `Recommend 5-8 restaurants in ${city} specializing in ${cuisine} cuisine with a ${priceRange} price range.

For each restaurant:
1. Name
2. Cuisine type
3. Price range (€, €€, €€€)
4. Description (what makes it special)
5. Signature dishes (2-3)
6. Location/neighborhood

Focus on a mix of:
- Local favorites
- Traditional cuisine
- Unique dining experiences
- Good value for money

Respond in JSON format as an array of restaurants.`;

    try {
      const response = await this.client.query(prompt, 'llama-3.1-sonar-large-128k-online', {
        temperature: 0.7,
        maxTokens: 2500
      });

      const restaurants = this.parseRestaurantsResponse(response);
      this.logger.info(`Generated ${restaurants.length} restaurant recommendations`);

      return restaurants;
    } catch (error) {
      this.handleError(error, 'getRestaurantRecommendations');
    }
  }

  // ===== Private Helper Methods =====

  /**
   * Build route discovery prompt
   */
  buildRoutePrompt(origin, destination, preferences) {
    const { scenicRoute, avoidHighways, interests } = preferences;

    return `Plan an optimal road trip route from ${origin} to ${destination}.

Preferences:
- Scenic route: ${scenicRoute ? 'Yes' : 'No'}
- Avoid highways: ${avoidHighways ? 'Yes' : 'No'}
- Interests: ${interests?.join(', ') || 'general tourism'}

Provide:
1. Recommended route with waypoints
2. Alternative routes (if applicable)
3. Estimated duration
4. Highlights along the way
5. Best stops for breaks

Respond in JSON format.`;
  }

  /**
   * Build POI discovery prompt
   */
  buildPOIPrompt(route, preferences) {
    return `Discover interesting points of interest along this route: ${JSON.stringify(route)}

Preferences: ${JSON.stringify(preferences)}

For each POI, provide:
- Name
- Type (landmark, restaurant, viewpoint, etc.)
- Location
- Description
- Why it's worth visiting

Respond in JSON format as an array.`;
  }

  /**
   * Parse AI response for routes
   */
  parseRouteResponse(response) {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: parse as text
      return { rawResponse: content };
    } catch (error) {
      this.logger.warn('Failed to parse route response', { error: error.message });
      return [];
    }
  }

  /**
   * Parse AI response for POIs
   */
  parsePOIResponse(response) {
    return this.parseRouteResponse(response);
  }

  /**
   * Parse AI response for destinations
   */
  parseDestinationResponse(response) {
    return this.parseRouteResponse(response);
  }

  /**
   * Parse AI response for scenic stops
   */
  parseScenicStopsResponse(response) {
    return this.parseRouteResponse(response);
  }

  /**
   * Parse AI response for activities
   */
  parseActivitiesResponse(response) {
    return this.parseRouteResponse(response);
  }

  /**
   * Parse AI response for restaurants
   */
  parseRestaurantsResponse(response) {
    return this.parseRouteResponse(response);
  }
}

module.exports = PerplexityAIService;

