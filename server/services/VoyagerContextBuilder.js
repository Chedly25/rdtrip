/**
 * VoyagerContextBuilder
 *
 * Assembles rich context for every Voyager AI call.
 * Combines trip state, inferred preferences, recent actions, and conversation history.
 */

class VoyagerContextBuilder {
  constructor(db) {
    this.db = db;
  }

  /**
   * Build complete context for an agent call
   */
  async buildContext(sessionId, routeData, options = {}) {
    const context = {
      trip: this.buildTripContext(routeData),
      route: await this.buildRouteContext(sessionId, routeData),
      preferences: await this.buildPreferencesContext(sessionId, routeData),
      recentActions: await this.getRecentActions(sessionId),
      conversation: await this.buildConversationContext(sessionId),
      geography: this.buildGeographyContext(routeData)
    };

    return context;
  }

  /**
   * Build trip fundamentals from route data
   */
  buildTripContext(routeData) {
    if (!routeData) return null;

    const waypoints = routeData.waypoints || [];
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];

    return {
      origin: origin?.city || origin?.name || routeData.origin || 'Unknown',
      destination: destination?.city || destination?.name || routeData.destination || 'Unknown',
      totalNights: this.calculateTotalNights(routeData),
      travellerType: routeData.travelerType || routeData.travellerType || null,
      travelStyle: routeData.travelStyle || null,
      startDate: routeData.startDate || null,
      endDate: routeData.endDate || null
    };
  }

  /**
   * Calculate total nights from route data
   */
  calculateTotalNights(routeData) {
    if (routeData.totalNights) return routeData.totalNights;

    const waypoints = routeData.waypoints || [];
    return waypoints.reduce((sum, wp) => sum + (wp.nights || 0), 0);
  }

  /**
   * Build current route state
   */
  async buildRouteContext(sessionId, routeData) {
    const waypoints = routeData?.waypoints || [];

    // Extract selected cities with nights
    const selectedCities = waypoints.map(wp => ({
      name: wp.city || wp.name,
      nights: wp.nights || 1,
      coordinates: wp.coordinates || { lat: wp.lat, lng: wp.lng || wp.lon }
    })).filter(c => c.name);

    // Get removed cities from session actions
    const removedCities = await this.getRemovedCities(sessionId);

    // Get suggested but not selected cities
    const suggestedButNotSelected = await this.getSuggestedNotSelected(sessionId);

    return {
      selectedCities,
      removedCities,
      suggestedButNotSelected,
      totalStops: selectedCities.length
    };
  }

  /**
   * Get cities that were removed during this session
   */
  async getRemovedCities(sessionId) {
    if (!this.db || !sessionId) return [];

    try {
      const result = await this.db.query(`
        SELECT DISTINCT data->>'cityName' as city_name
        FROM discovery_actions
        WHERE session_id = $1
        AND action_type = 'city_removed'
        AND created_at > NOW() - INTERVAL '24 hours'
      `, [sessionId]);

      return result.rows.map(r => r.city_name).filter(Boolean);
    } catch (err) {
      // Table might not exist yet
      return [];
    }
  }

  /**
   * Get cities that were suggested but not added
   */
  async getSuggestedNotSelected(sessionId) {
    if (!this.db || !sessionId) return [];

    try {
      const result = await this.db.query(`
        SELECT DISTINCT data->>'cityName' as city_name
        FROM discovery_actions
        WHERE session_id = $1
        AND action_type = 'city_suggested'
        AND data->>'cityName' NOT IN (
          SELECT data->>'cityName'
          FROM discovery_actions
          WHERE session_id = $1
          AND action_type = 'city_added'
        )
        AND created_at > NOW() - INTERVAL '24 hours'
      `, [sessionId]);

      return result.rows.map(r => r.city_name).filter(Boolean);
    } catch (err) {
      return [];
    }
  }

  /**
   * Build inferred preferences from user behavior
   */
  async buildPreferencesContext(sessionId, routeData) {
    const actions = await this.getRecentActions(sessionId, 50); // Get more for analysis
    const evidence = [];
    let confidence = 0.5;

    // Analyze favorites by type
    const favorites = actions.filter(a => a.action_type === 'place_favorited');
    const placeTypes = {};
    favorites.forEach(f => {
      const type = f.data?.placeType || 'unknown';
      placeTypes[type] = (placeTypes[type] || 0) + 1;
    });

    // Top place types (if enough data)
    const topPlaceTypes = Object.entries(placeTypes)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    if (topPlaceTypes.length) {
      evidence.push(`Favorited ${favorites.length} places, mostly ${topPlaceTypes[0]}`);
      confidence += 0.1;
    }

    // Hidden gems preference (if they remove popular cities)
    const removedCities = actions.filter(a => a.action_type === 'city_removed');
    const popularCitiesRemoved = removedCities.filter(r =>
      ['Paris', 'Barcelona', 'Nice', 'Rome', 'Florence', 'Venice', 'Milan', 'Lyon', 'Marseille']
        .includes(r.data?.cityName)
    );
    const prefersHiddenGems = popularCitiesRemoved.length >= 2;

    if (prefersHiddenGems) {
      evidence.push(`Removed ${popularCitiesRemoved.length} popular cities`);
      confidence += 0.15;
    }

    // Avoids crowds (similar analysis)
    const avoidsCrowds = prefersHiddenGems || removedCities.length > 3;

    // Calculate average nights per city from route
    const waypoints = routeData?.waypoints || [];
    const avgNights = waypoints.length > 0
      ? waypoints.reduce((sum, wp) => sum + (wp.nights || 1), 0) / waypoints.length
      : null;

    return {
      inferred: {
        prefersHiddenGems,
        avoidsCrowds,
        topPlaceTypes,
        averageNightsPerCity: avgNights ? Math.round(avgNights * 10) / 10 : null
      },
      confidence: Math.min(confidence, 0.9),
      evidence
    };
  }

  /**
   * Get recent user actions from the database
   */
  async getRecentActions(sessionId, limit = 10) {
    if (!this.db || !sessionId) return [];

    try {
      const result = await this.db.query(`
        SELECT action_type, data, created_at
        FROM discovery_actions
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [sessionId, limit]);

      return result.rows.map(row => ({
        type: row.action_type,
        action_type: row.action_type, // Keep both for compatibility
        data: row.data,
        when: this.formatTimeAgo(row.created_at),
        ...row.data
      }));
    } catch (err) {
      // Table might not exist yet
      return [];
    }
  }

  /**
   * Format timestamp as relative time
   */
  formatTimeAgo(timestamp) {
    if (!timestamp) return 'recently';

    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  /**
   * Build conversation context from message history
   */
  async buildConversationContext(sessionId) {
    if (!this.db || !sessionId) {
      return { messages: [], keyInsights: [] };
    }

    try {
      // Get recent messages
      const result = await this.db.query(`
        SELECT role, content, created_at
        FROM discovery_conversations
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `, [sessionId]);

      const messages = result.rows.reverse(); // Oldest first

      // Extract key insights from messages
      const keyInsights = this.extractKeyInsights(messages);

      return {
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        keyInsights
      };
    } catch (err) {
      return { messages: [], keyInsights: [] };
    }
  }

  /**
   * Extract key insights from conversation history
   */
  extractKeyInsights(messages) {
    const insights = [];
    const userMessages = messages.filter(m => m.role === 'user');

    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();

      // Food-related
      if (content.match(/food|restaurant|culinary|gastronom|eat|cuisine|michelin/)) {
        if (!insights.includes('Interested in food/culinary experiences')) {
          insights.push('Interested in food/culinary experiences');
        }
      }

      // Hidden gems
      if (content.match(/hidden|secret|off.?beat|unusual|undiscovered|local/)) {
        if (!insights.includes('Prefers off-the-beaten-path destinations')) {
          insights.push('Prefers off-the-beaten-path destinations');
        }
      }

      // Coastal
      if (content.match(/coast|beach|sea|ocean|seaside|harbour|harbor|port/)) {
        if (!insights.includes('Drawn to coastal destinations')) {
          insights.push('Drawn to coastal destinations');
        }
      }

      // Historic
      if (content.match(/histor|ancient|medieval|roman|castle|cathedral|monument/)) {
        if (!insights.includes('Interested in history and heritage')) {
          insights.push('Interested in history and heritage');
        }
      }

      // Nature
      if (content.match(/nature|hiking|mountain|forest|park|outdoor|scenic/)) {
        if (!insights.includes('Values nature and outdoor experiences')) {
          insights.push('Values nature and outdoor experiences');
        }
      }

      // Art
      if (content.match(/art|museum|gallery|paint|sculpt|architect/)) {
        if (!insights.includes('Appreciates art and culture')) {
          insights.push('Appreciates art and culture');
        }
      }
    });

    return insights.slice(0, 5); // Max 5 insights
  }

  /**
   * Build geography context from route
   */
  buildGeographyContext(routeData) {
    if (!routeData) return null;

    const waypoints = routeData.waypoints || [];

    // Calculate total distance (rough estimate)
    let totalDistanceKm = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      if (prev.coordinates && curr.coordinates) {
        totalDistanceKm += this.haversineDistance(
          prev.coordinates.lat || prev.lat,
          prev.coordinates.lng || prev.lon,
          curr.coordinates.lat || curr.lat,
          curr.coordinates.lng || curr.lon
        );
      }
    }

    // Detect countries (basic - could be enhanced with reverse geocoding)
    const countriesCrossed = this.detectCountries(waypoints);

    // Build route line for map
    const routeLine = waypoints
      .filter(wp => wp.coordinates || wp.lat)
      .map(wp => ({
        lat: wp.coordinates?.lat || wp.lat,
        lng: wp.coordinates?.lng || wp.lon || wp.lng
      }));

    return {
      routeLine,
      totalDistanceKm: Math.round(totalDistanceKm),
      countriesCrossed
    };
  }

  /**
   * Haversine distance between two points
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Detect countries from waypoints (basic heuristic)
   */
  detectCountries(waypoints) {
    const countries = new Set();

    // Known city-to-country mappings for Southern Europe
    const cityCountryMap = {
      // France
      'Paris': 'France', 'Lyon': 'France', 'Marseille': 'France', 'Nice': 'France',
      'Avignon': 'France', 'Montpellier': 'France', 'Toulouse': 'France',
      'Bordeaux': 'France', 'Nantes': 'France', 'Strasbourg': 'France',
      'Perpignan': 'France', 'Carcassonne': 'France', 'Nîmes': 'France',
      'Aix-en-Provence': 'France', 'Sète': 'France', 'Arles': 'France',
      'Collioure': 'France', 'Uzès': 'France',

      // Spain
      'Barcelona': 'Spain', 'Madrid': 'Spain', 'Valencia': 'Spain',
      'Seville': 'Spain', 'Granada': 'Spain', 'Bilbao': 'Spain',
      'San Sebastian': 'Spain', 'Girona': 'Spain', 'Figueres': 'Spain',

      // Italy
      'Rome': 'Italy', 'Florence': 'Italy', 'Venice': 'Italy',
      'Milan': 'Italy', 'Naples': 'Italy', 'Turin': 'Italy',
      'Bologna': 'Italy', 'Genoa': 'Italy', 'Pisa': 'Italy',
      'Cinque Terre': 'Italy', 'Siena': 'Italy', 'Verona': 'Italy',

      // Portugal
      'Lisbon': 'Portugal', 'Porto': 'Portugal', 'Sintra': 'Portugal',

      // Other
      'Monaco': 'Monaco', 'Andorra la Vella': 'Andorra'
    };

    waypoints.forEach(wp => {
      const cityName = wp.city || wp.name;
      if (cityName && cityCountryMap[cityName]) {
        countries.add(cityCountryMap[cityName]);
      }
    });

    return Array.from(countries);
  }

  /**
   * Record a user action for preference learning
   */
  async recordAction(sessionId, actionType, data) {
    if (!this.db || !sessionId) return;

    try {
      // Infer preference from action
      const implicitPreference = this.inferPreferenceFromAction(actionType, data);

      await this.db.query(`
        INSERT INTO discovery_actions (session_id, action_type, data, implicit_preference)
        VALUES ($1, $2, $3, $4)
      `, [sessionId, actionType, JSON.stringify(data), implicitPreference]);

      // Update session last activity
      await this.updateSessionActivity(sessionId);
    } catch (err) {
      console.error('Failed to record action:', err.message);
      // Non-fatal - continue without recording
    }
  }

  /**
   * Infer preference from action
   */
  inferPreferenceFromAction(actionType, data) {
    if (actionType === 'place_favorited') {
      const type = data?.placeType?.toLowerCase();
      if (['restaurant', 'cafe', 'bakery', 'market'].includes(type)) return 'foodie';
      if (['museum', 'gallery', 'art_gallery'].includes(type)) return 'cultural';
      if (['park', 'hiking', 'nature_reserve'].includes(type)) return 'nature';
      if (['beach', 'harbor', 'marina'].includes(type)) return 'coastal';
      if (['monument', 'castle', 'historic_site'].includes(type)) return 'historic';
    }

    if (actionType === 'city_added') {
      const tags = data?.tags || [];
      if (tags.some(t => t.includes('hidden') || t.includes('off-beat'))) return 'hidden_gems';
      if (tags.some(t => t.includes('food') || t.includes('culinary'))) return 'foodie';
      if (tags.some(t => t.includes('coast') || t.includes('beach'))) return 'coastal';
    }

    return null;
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Get or create a discovery session
   */
  async getOrCreateSession(sessionId, routeData = null, userId = null) {
    if (!this.db || !sessionId) return null;

    try {
      // Try to get existing session
      const existing = await this.db.query(`
        SELECT * FROM discovery_sessions WHERE session_id = $1
      `, [sessionId]);

      if (existing.rows.length > 0) {
        // Update last activity
        await this.updateSessionActivity(sessionId);
        return existing.rows[0];
      }

      // Create new session
      const origin = routeData?.waypoints?.[0]?.city || routeData?.origin;
      const destination = routeData?.waypoints?.[routeData.waypoints.length - 1]?.city || routeData?.destination;

      const result = await this.db.query(`
        INSERT INTO discovery_sessions (session_id, user_id, origin, destination)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [sessionId, userId, origin, destination]);

      console.log(`📝 Created discovery session: ${sessionId}`);
      return result.rows[0];

    } catch (err) {
      console.error('Session management error:', err.message);
      return null;
    }
  }

  /**
   * Update session last activity timestamp
   */
  async updateSessionActivity(sessionId) {
    if (!this.db || !sessionId) return;

    try {
      await this.db.query(`
        UPDATE discovery_sessions
        SET last_activity_at = NOW()
        WHERE session_id = $1
      `, [sessionId]);
    } catch (err) {
      // Non-fatal
    }
  }

  /**
   * Update session preferences
   */
  async updateSessionPreferences(sessionId, preferences) {
    if (!this.db || !sessionId) return;

    try {
      await this.db.query(`
        UPDATE discovery_sessions
        SET preferences = $2, updated_at = NOW()
        WHERE session_id = $1
      `, [sessionId, JSON.stringify(preferences)]);
    } catch (err) {
      console.error('Failed to update preferences:', err.message);
    }
  }

  /**
   * Increment message count for session
   */
  async incrementMessageCount(sessionId) {
    if (!this.db || !sessionId) return;

    try {
      await this.db.query(`
        UPDATE discovery_sessions
        SET message_count = message_count + 1, last_activity_at = NOW()
        WHERE session_id = $1
      `, [sessionId]);
    } catch (err) {
      // Non-fatal
    }
  }

  /**
   * Mark session as completed
   */
  async completeSession(sessionId) {
    if (!this.db || !sessionId) return;

    try {
      await this.db.query(`
        UPDATE discovery_sessions
        SET status = 'completed', updated_at = NOW()
        WHERE session_id = $1
      `, [sessionId]);
    } catch (err) {
      console.error('Failed to complete session:', err.message);
    }
  }

  /**
   * Get session stats for analytics
   */
  async getSessionStats(sessionId) {
    if (!this.db || !sessionId) return null;

    try {
      const result = await this.db.query(`
        SELECT
          ds.message_count,
          ds.preferences,
          ds.created_at,
          ds.last_activity_at,
          COUNT(da.id) as action_count,
          COUNT(DISTINCT da.action_type) as action_types
        FROM discovery_sessions ds
        LEFT JOIN discovery_actions da ON ds.session_id = da.session_id
        WHERE ds.session_id = $1
        GROUP BY ds.id
      `, [sessionId]);

      return result.rows[0] || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Save a conversation message
   */
  async saveMessage(sessionId, role, content, toolCalls = null) {
    if (!this.db || !sessionId) return;

    try {
      await this.db.query(`
        INSERT INTO discovery_conversations (session_id, role, content, tool_calls)
        VALUES ($1, $2, $3, $4)
      `, [sessionId, role, content, toolCalls ? JSON.stringify(toolCalls) : null]);
    } catch (err) {
      console.error('Failed to save message:', err.message);
    }
  }
}

module.exports = VoyagerContextBuilder;
