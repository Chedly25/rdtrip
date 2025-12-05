/**
 * SerendipityAgent - The Discovery Engine
 *
 * An AI-powered agent that finds unexpected delights, local secrets,
 * and serendipitous discoveries near the traveler's current location.
 *
 * Tools:
 * - Perplexity API: Real-time local intelligence, events, secrets
 * - Google Places: Validated nearby gems with photos & ratings
 * - Weather Service: Context-aware suggestions
 *
 * Output: Curated discovery cards that spark wonder
 */

const Anthropic = require('@anthropic-ai/sdk');
const { Pool } = require('pg');

class SerendipityAgent {
  constructor(googlePlacesService, perplexityService, weatherService) {
    this.googlePlaces = googlePlacesService;
    this.perplexity = perplexityService;
    this.weather = weatherService;

    // Anthropic client for narrative generation
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Database for caching
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Discovery categories that spark serendipity
    this.discoveryCategories = [
      'cafe', 'bakery', 'art_gallery', 'book_store', 'park',
      'viewpoint', 'street_art', 'local_market', 'antique_shop',
      'wine_bar', 'museum', 'garden', 'historic_site'
    ];

    console.log('SerendipityAgent initialized');
  }

  /**
   * Main discovery endpoint - finds nearby gems
   */
  async discoverNearby({ tripId, location, radius = 500, userId, exclude = [] }) {
    console.log(`\nSerendipityAgent: Discovering near ${location.lat}, ${location.lng}`);

    try {
      // 1. Get trip context (city, day, preferences)
      const tripContext = await this.getTripContext(tripId);
      const city = tripContext?.currentCity || 'Unknown';

      // 2. Check cache first
      const cached = await this.getCachedDiscoveries(city, location, radius);
      if (cached.length >= 3) {
        console.log(`  Cache hit: ${cached.length} discoveries`);
        return this.formatDiscoveries(cached, exclude);
      }

      // 3. Parallel discovery from multiple sources
      const [placesDiscoveries, perplexityInsights] = await Promise.all([
        this.discoverFromGooglePlaces(location, radius, exclude),
        this.discoverFromPerplexity(city, tripContext?.interests || [])
      ]);

      // 4. Merge and score discoveries
      const merged = this.mergeDiscoveries(placesDiscoveries, perplexityInsights);

      // 5. Generate compelling cards with AI
      const enriched = await this.enrichWithNarratives(merged, city, tripContext);

      // 6. Cache for future use
      await this.cacheDiscoveries(city, location, enriched);

      // 7. Return filtered results
      return this.formatDiscoveries(enriched, exclude).slice(0, 8);

    } catch (error) {
      console.error('SerendipityAgent error:', error);
      // Fallback to basic Google Places
      return this.fallbackDiscovery(location, radius, exclude);
    }
  }

  /**
   * Discover gems from Google Places with serendipity scoring
   */
  async discoverFromGooglePlaces(location, radius, exclude = []) {
    console.log('  Querying Google Places...');

    const discoveries = [];

    // Search multiple categories in parallel
    const categoryPromises = this.discoveryCategories.slice(0, 6).map(async (category) => {
      try {
        const results = await this.googlePlaces.nearbySearch({
          location,
          radius,
          type: category
        });

        return results
          .filter(p => p.rating >= 4.0)
          .filter(p => !exclude.includes(p.place_id))
          .slice(0, 2)
          .map(place => ({
            ...place,
            category,
            source: 'google_places'
          }));
      } catch (err) {
        console.warn(`  Category ${category} failed:`, err.message);
        return [];
      }
    });

    const categoryResults = await Promise.all(categoryPromises);
    categoryResults.forEach(results => discoveries.push(...results));

    // Score for serendipity
    return this.scoreSerendipity(discoveries, location);
  }

  /**
   * Discover local secrets from Perplexity
   */
  async discoverFromPerplexity(city, interests = []) {
    console.log(`  Querying Perplexity for ${city} secrets...`);

    if (!this.perplexity) {
      console.log('  Perplexity not available, skipping');
      return [];
    }

    try {
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });

      const prompt = `You are a local expert in ${city}. Today is ${today}.

What are 5 HIDDEN GEMS and LOCAL SECRETS that a curious traveler should discover?

Focus on:
1. Places locals love but tourists miss
2. Any events, markets, or happenings TODAY
3. Best photo spots with optimal timing
4. Street food gems and authentic eateries
5. Free or cheap authentic local experiences

${interests.length > 0 ? `Traveler interests: ${interests.join(', ')}` : ''}

Return ONLY a JSON array (no markdown, no explanation):
[{
  "type": "hidden_gem|local_event|photo_spot|food_gem|timing_tip",
  "title": "Short catchy title",
  "description": "2-3 engaging sentences",
  "why_special": "What makes this unique",
  "best_time": "Optimal time to visit",
  "location_hint": "General area/neighborhood",
  "insider_tip": "The thing only locals know",
  "confidence": 0.0-1.0
}]`;

      const response = await this.perplexity.client.query(
        prompt,
        'llama-3.1-sonar-large-128k-online',
        { temperature: 0.8, maxTokens: 2000 }
      );

      // Parse response
      const content = response.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0]);
        return insights.map(item => ({
          ...item,
          source: 'perplexity',
          serendipityScore: item.confidence || 0.7
        }));
      }

      return [];
    } catch (error) {
      console.error('  Perplexity discovery error:', error.message);
      return [];
    }
  }

  /**
   * Score places for serendipity potential
   */
  scoreSerendipity(places, userLocation) {
    return places
      .map(place => {
        const distance = place.location
          ? this.calculateDistance(userLocation, place.location)
          : 500;

        const ratingScore = (place.rating || 4) / 5;
        const popularityScore = Math.min((place.user_ratings_total || 100) / 1000, 1);

        // Serendipity formula:
        // - High quality (rating)
        // - Not too popular (hidden gem factor)
        // - Reasonably close (convenience)
        const serendipityScore =
          ratingScore * 0.4 +
          (1 - popularityScore) * 0.35 + // Less popular = more serendipitous
          (1 - Math.min(distance / radius, 1)) * 0.25;

        return {
          ...place,
          serendipityScore,
          distance: Math.round(distance),
          walkingTime: Math.ceil(distance / 80) // ~80m per minute walking
        };
      })
      .sort((a, b) => b.serendipityScore - a.serendipityScore);
  }

  /**
   * Merge discoveries from multiple sources
   */
  mergeDiscoveries(placesDiscoveries, perplexityInsights) {
    const merged = [];

    // Add Google Places discoveries
    placesDiscoveries.slice(0, 6).forEach(place => {
      merged.push({
        id: place.place_id || `place-${Date.now()}-${Math.random()}`,
        type: this.mapCategoryToType(place.category),
        title: place.name,
        description: place.address || place.vicinity,
        photo: place.photos?.[0]?.photo_reference
          ? this.googlePlaces.getPhotoUrl(place.photos[0].photo_reference, 400)
          : null,
        rating: place.rating,
        distance: place.distance,
        walkingTime: place.walkingTime,
        coordinates: place.location,
        placeId: place.place_id,
        serendipityScore: place.serendipityScore,
        source: 'google_places'
      });
    });

    // Add Perplexity insights
    perplexityInsights.slice(0, 4).forEach((insight, idx) => {
      merged.push({
        id: `insight-${Date.now()}-${idx}`,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        whySpecial: insight.why_special,
        bestTime: insight.best_time,
        locationHint: insight.location_hint,
        insiderTip: insight.insider_tip,
        serendipityScore: insight.confidence || 0.7,
        source: 'perplexity'
      });
    });

    return merged.sort((a, b) => b.serendipityScore - a.serendipityScore);
  }

  /**
   * Enrich discoveries with compelling narratives
   */
  async enrichWithNarratives(discoveries, city, tripContext) {
    // For top 5 discoveries without descriptions, generate narratives
    const needsNarrative = discoveries
      .filter(d => !d.whySpecial && d.source === 'google_places')
      .slice(0, 3);

    if (needsNarrative.length === 0) return discoveries;

    try {
      const prompt = `Generate short, compelling "why you should visit" hooks for these places in ${city}.
Each hook should be 1-2 sentences that spark curiosity and make someone want to go NOW.

Places:
${needsNarrative.map((d, i) => `${i + 1}. ${d.title} (${d.type})`).join('\n')}

Return JSON array with same order:
[{"hook": "Your compelling 1-2 sentence hook"}]`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0]?.text || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const hooks = JSON.parse(jsonMatch[0]);
        needsNarrative.forEach((discovery, idx) => {
          if (hooks[idx]?.hook) {
            discovery.whySpecial = hooks[idx].hook;
          }
        });
      }
    } catch (error) {
      console.warn('Narrative enrichment failed:', error.message);
    }

    return discoveries;
  }

  /**
   * Get smart timing hints for an activity
   */
  async getSmartHints({ tripId, activityId, currentTime, userId }) {
    console.log(`\nSerendipityAgent: Getting smart hints for activity ${activityId}`);

    const hints = [];
    const now = new Date(currentTime || Date.now());
    const currentHour = now.getHours();

    try {
      // Get activity details from trip
      const activity = await this.getActivityFromTrip(tripId, activityId);
      if (!activity) {
        return { hints: [] };
      }

      // 1. Departure timing hint
      if (activity.time) {
        const [hours, mins] = activity.time.split(':').map(Number);
        const activityTime = new Date(now);
        activityTime.setHours(hours, mins || 0, 0, 0);

        const minutesUntil = Math.round((activityTime - now) / 60000);

        if (minutesUntil > 0 && minutesUntil <= 60) {
          // Calculate travel time (assume 15-20 min average)
          const travelTime = 15;
          const leaveIn = minutesUntil - travelTime;

          if (leaveIn > 0 && leaveIn <= 30) {
            hints.push({
              type: 'departure',
              message: `Leave in ${leaveIn} min to arrive perfectly on time`,
              urgency: leaveIn <= 10 ? 'high' : 'medium',
              actionLabel: 'Navigate',
              expiresIn: leaveIn
            });
          }
        }
      }

      // 2. Golden hour hint for photo-worthy activities
      const photoTypes = ['scenic', 'viewpoint', 'landmark', 'attraction', 'park'];
      if (photoTypes.some(t => activity.type?.includes(t))) {
        const goldenHourEvening = this.getGoldenHour(now);
        const minsToGolden = Math.round((goldenHourEvening - now) / 60000);

        if (minsToGolden > 0 && minsToGolden <= 90) {
          hints.push({
            type: 'golden_hour',
            message: `Golden hour starts in ${minsToGolden} min - perfect lighting for photos`,
            urgency: 'low',
            expiresIn: minsToGolden
          });
        }
      }

      // 3. Crowd hint based on time
      if (currentHour >= 10 && currentHour <= 14) {
        hints.push({
          type: 'crowd',
          message: 'Peak tourist hours - consider visiting after 3pm for fewer crowds',
          urgency: 'low'
        });
      }

      // 4. Weather-based hint
      const weather = await this.getCurrentWeather(activity.coordinates);
      if (weather?.condition?.includes('rain')) {
        hints.push({
          type: 'weather',
          message: `Rain expected - ${activity.type === 'outdoor' ? 'consider indoor alternatives' : 'bring an umbrella'}`,
          urgency: 'medium',
          actionLabel: 'See Alternatives'
        });
      }

      return { hints };

    } catch (error) {
      console.error('Smart hints error:', error);
      return { hints: [] };
    }
  }

  /**
   * Find weather-appropriate alternatives
   */
  async findWeatherAlternatives({ tripId, activityId, weatherCondition, userId }) {
    console.log(`\nSerendipityAgent: Finding alternatives for ${weatherCondition} weather`);

    try {
      const activity = await this.getActivityFromTrip(tripId, activityId);
      if (!activity || !activity.coordinates) {
        return { alternatives: [] };
      }

      // Search for indoor alternatives
      const indoorTypes = ['museum', 'art_gallery', 'cafe', 'shopping_mall', 'spa'];

      const alternatives = [];
      for (const type of indoorTypes.slice(0, 3)) {
        const results = await this.googlePlaces.nearbySearch({
          location: activity.coordinates,
          radius: 1000,
          type
        });

        if (results.length > 0) {
          const best = results[0];
          alternatives.push({
            id: best.place_id,
            name: best.name,
            type,
            rating: best.rating,
            address: best.vicinity,
            photo: best.photos?.[0]?.photo_reference
              ? this.googlePlaces.getPhotoUrl(best.photos[0].photo_reference, 400)
              : null,
            reason: `Perfect ${type.replace('_', ' ')} to escape the ${weatherCondition}`
          });
        }
      }

      return { alternatives };

    } catch (error) {
      console.error('Weather alternatives error:', error);
      return { alternatives: [] };
    }
  }

  /**
   * Record a moment and optionally generate narrative
   */
  async recordMoment(tripId, userId, momentData) {
    const {
      activityId,
      activityName,
      momentType,
      note,
      photo,
      rating,
      coordinates,
      dayNumber
    } = momentData;

    const timeOfDay = this.getTimeOfDay(new Date().getHours());

    try {
      // Insert moment
      const result = await this.db.query(`
        INSERT INTO trip_moments (
          trip_id, user_id, activity_id, activity_name,
          moment_type, note, photo_url, rating,
          coordinates, day_number, time_of_day
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        tripId, userId, activityId, activityName,
        momentType, note, photo, rating,
        coordinates ? JSON.stringify(coordinates) : null,
        dayNumber, timeOfDay
      ]);

      const moment = result.rows[0];

      // Generate narrative async (don't block response)
      this.generateMomentNarrative(moment).catch(console.error);

      return moment;

    } catch (error) {
      console.error('Record moment error:', error);
      throw error;
    }
  }

  /**
   * Generate narrative snippet for a moment
   */
  async generateMomentNarrative(moment) {
    try {
      const prompt = `Write a brief, evocative travel journal entry (2-3 sentences) about experiencing "${moment.activity_name}" during the ${moment.time_of_day}.

${moment.note ? `Traveler's note: "${moment.note}"` : ''}
${moment.moment_type === 'highlight' ? 'This was a highlight of their day.' : ''}

Write in second person ("You..."). Be poetic but grounded. Capture sensory details.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      });

      const narrative = response.content[0]?.text;

      if (narrative) {
        await this.db.query(`
          UPDATE trip_moments SET narrative_snippet = $1 WHERE id = $2
        `, [narrative, moment.id]);
      }

      return narrative;
    } catch (error) {
      console.error('Narrative generation error:', error);
      return null;
    }
  }

  /**
   * Get the trip narrative for a day
   */
  async getTripNarrative(tripId, dayNumber) {
    try {
      // First check for existing narrative
      const existing = await this.db.query(`
        SELECT * FROM trip_narratives
        WHERE trip_id = $1 AND day_number = $2
      `, [tripId, dayNumber]);

      if (existing.rows.length > 0) {
        return existing.rows[0];
      }

      // Get moments for this day
      const moments = await this.db.query(`
        SELECT * FROM trip_moments
        WHERE trip_id = $1 AND day_number = $2
        ORDER BY recorded_at ASC
      `, [tripId, dayNumber]);

      if (moments.rows.length === 0) {
        return null;
      }

      // Generate narrative from moments
      const narrative = await this.generateDayNarrative(tripId, dayNumber, moments.rows);

      return narrative;

    } catch (error) {
      console.error('Get narrative error:', error);
      return null;
    }
  }

  /**
   * Generate a day's narrative from moments
   */
  async generateDayNarrative(tripId, dayNumber, moments) {
    const momentSummaries = moments.map(m =>
      `- ${m.time_of_day}: ${m.activity_name}${m.moment_type === 'highlight' ? ' (highlight)' : ''}${m.note ? ` - "${m.note}"` : ''}`
    ).join('\n');

    const prompt = `Write a brief, engaging travel narrative for Day ${dayNumber} based on these moments:

${momentSummaries}

Structure:
1. Opening hook (one intriguing sentence)
2. Main narrative (2-3 sentences weaving the moments together)
3. Closing reflection (one sentence looking ahead or reflecting)

Write in second person. Be evocative but concise. Total: ~100 words.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      const narrativeText = response.content[0]?.text || '';

      // Save to database
      const result = await this.db.query(`
        INSERT INTO trip_narratives (trip_id, user_id, day_number, narrative_text, source_moments)
        SELECT $1, user_id, $2, $3, $4
        FROM active_trips WHERE id = $1
        RETURNING *
      `, [tripId, dayNumber, narrativeText, moments.map(m => m.id)]);

      return result.rows[0];

    } catch (error) {
      console.error('Generate day narrative error:', error);
      return null;
    }
  }

  // ============ HELPER METHODS ============

  async getTripContext(tripId) {
    try {
      const result = await this.db.query(`
        SELECT at.*, i.activities, r.route_data
        FROM active_trips at
        LEFT JOIN itineraries i ON at.itinerary_id = i.id
        LEFT JOIN routes r ON at.route_id = r.id
        WHERE at.id = $1
      `, [tripId]);

      if (result.rows.length === 0) return null;

      const trip = result.rows[0];
      const activities = trip.activities || [];
      const currentDay = trip.current_day || 1;

      // Find current day's city
      const dayData = activities.find(d => d.day === currentDay);

      return {
        currentCity: dayData?.city,
        currentDay,
        interests: trip.route_data?.personalization?.interests || []
      };
    } catch (error) {
      console.error('Get trip context error:', error);
      return null;
    }
  }

  async getActivityFromTrip(tripId, activityId) {
    // Stub - would lookup from itinerary
    return null;
  }

  async getCurrentWeather(coordinates) {
    if (!this.weather || !coordinates) return null;
    try {
      return await this.weather.getCurrentWeather(coordinates);
    } catch {
      return null;
    }
  }

  async getCachedDiscoveries(city, location, radius) {
    try {
      const locationHash = this.getLocationHash(location);
      const result = await this.db.query(`
        SELECT * FROM serendipity_cache
        WHERE city = $1
        AND location_hash = $2
        AND expires_at > NOW()
        ORDER BY confidence DESC
        LIMIT 10
      `, [city, locationHash]);
      return result.rows;
    } catch {
      return [];
    }
  }

  async cacheDiscoveries(city, location, discoveries) {
    const locationHash = this.getLocationHash(location);

    for (const discovery of discoveries.slice(0, 10)) {
      try {
        await this.db.query(`
          INSERT INTO serendipity_cache (
            city, location_hash, discovery_type, place_id,
            title, description, why_special, insider_tip,
            photo_url, coordinates, source, confidence
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (city, location_hash, title) DO UPDATE SET
            confidence = EXCLUDED.confidence,
            expires_at = NOW() + INTERVAL '7 days'
        `, [
          city, locationHash, discovery.type, discovery.placeId,
          discovery.title, discovery.description, discovery.whySpecial,
          discovery.insiderTip, discovery.photo,
          discovery.coordinates ? JSON.stringify(discovery.coordinates) : null,
          discovery.source, discovery.serendipityScore || 0.7
        ]);
      } catch (err) {
        console.warn('Cache write failed:', err.message);
      }
    }
  }

  getLocationHash(location) {
    // Simple geohash-like bucketing (500m precision)
    const latBucket = Math.round(location.lat * 200) / 200;
    const lngBucket = Math.round(location.lng * 200) / 200;
    return `${latBucket},${lngBucket}`;
  }

  calculateDistance(from, to) {
    const R = 6371000; // Earth's radius in meters
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const deltaLat = (to.lat - from.lat) * Math.PI / 180;
    const deltaLng = (to.lng - from.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getTimeOfDay(hour) {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  getGoldenHour(date) {
    // Approximate golden hour (1 hour before sunset)
    // Summer: ~7:30pm, Winter: ~4:30pm
    const month = date.getMonth();
    const sunsetHour = month >= 4 && month <= 9 ? 20 : 17;
    const golden = new Date(date);
    golden.setHours(sunsetHour - 1, 0, 0, 0);
    return golden;
  }

  mapCategoryToType(category) {
    const mapping = {
      'cafe': 'food_gem',
      'bakery': 'food_gem',
      'restaurant': 'food_gem',
      'art_gallery': 'hidden_gem',
      'museum': 'hidden_gem',
      'book_store': 'hidden_gem',
      'park': 'photo_spot',
      'viewpoint': 'photo_spot',
      'point_of_interest': 'hidden_gem'
    };
    return mapping[category] || 'hidden_gem';
  }

  formatDiscoveries(discoveries, exclude = []) {
    return discoveries
      .filter(d => !exclude.includes(d.id) && !exclude.includes(d.placeId))
      .map(d => ({
        id: d.id || d.place_id,
        type: d.type || d.discovery_type,
        title: d.title || d.name,
        description: d.description,
        whySpecial: d.whySpecial || d.why_special,
        insiderTip: d.insiderTip || d.insider_tip,
        bestTime: d.bestTime || d.best_time,
        photo: d.photo || d.photo_url,
        rating: d.rating,
        distance: d.distance,
        walkingTime: d.walkingTime,
        coordinates: d.coordinates,
        serendipityScore: d.serendipityScore || d.confidence,
        source: d.source
      }));
  }

  async fallbackDiscovery(location, radius, exclude) {
    try {
      const results = await this.googlePlaces.nearbySearch({
        location,
        radius,
        type: 'point_of_interest'
      });

      return results
        .filter(p => !exclude.includes(p.place_id))
        .slice(0, 5)
        .map(p => ({
          id: p.place_id,
          type: 'hidden_gem',
          title: p.name,
          description: p.vicinity,
          photo: p.photos?.[0]?.photo_reference
            ? this.googlePlaces.getPhotoUrl(p.photos[0].photo_reference, 400)
            : null,
          rating: p.rating,
          source: 'google_places'
        }));
    } catch {
      return [];
    }
  }
}

module.exports = SerendipityAgent;
