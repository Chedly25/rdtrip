/**
 * ContextManager - Builds Rich Context for Agent
 *
 * Gathers all relevant context about the current page, user, route, and conversation
 * Provides this context to the agent so it can give intelligent, personalized responses
 */

const { Pool } = require('pg');

class ContextManager {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  /**
   * Build complete context snapshot for agent
   * @param {Object} params
   * @param {string} params.userId - Current user ID
   * @param {string} [params.routeId] - Current route ID (if on route page)
   * @param {string} [params.pageContext] - Current page context (landing, itinerary, map, etc.)
   * @param {string} [params.sessionId] - Conversation session ID
   * @returns {Promise<Object>} Rich context object
   */
  async buildContext({ userId, routeId, pageContext, sessionId }) {
    const context = {
      timestamp: new Date().toISOString(),
      user: null,
      route: null,
      currentPage: pageContext || 'unknown',
      preferences: null,
      recentActivity: null
    };

    try {
      // 1. Get user info
      if (userId) {
        context.user = await this.getUserInfo(userId);
      }

      // 2. Get route info (if on route page)
      if (routeId) {
        context.route = await this.getRouteInfo(routeId, userId);
      }

      // 3. Get user preferences (learned behavior)
      if (userId) {
        context.preferences = await this.getUserPreferences(userId);
      }

      // 4. Get recent activity (last 5 actions)
      if (userId) {
        context.recentActivity = await this.getRecentActivity(userId, routeId);
      }

      return context;

    } catch (error) {
      console.error('Error building context:', error.message);
      // Return partial context even if some parts fail
      return context;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(userId) {
    try {
      const result = await this.pool.query(
        `SELECT id, email, name, created_at
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];

      // Get user's route count
      const routeCountResult = await this.pool.query(
        `SELECT COUNT(*) as route_count FROM routes WHERE user_id = $1`,
        [userId]
      );

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        memberSince: user.created_at,
        routeCount: parseInt(routeCountResult.rows[0].route_count) || 0
      };

    } catch (error) {
      console.error('Error getting user info:', error.message);
      return null;
    }
  }

  /**
   * Get complete route information
   */
  async getRouteInfo(routeId, userId) {
    try {
      // Get route basics
      const routeResult = await this.pool.query(
        `SELECT r.*,
                u.name as owner_name,
                u.email as owner_email
         FROM routes r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.id = $1`,
        [routeId]
      );

      if (routeResult.rows.length === 0) {
        return null;
      }

      const route = routeResult.rows[0];

      // Get day-by-day itinerary
      const daysResult = await this.pool.query(
        `SELECT * FROM days WHERE route_id = $1 ORDER BY day_number`,
        [routeId]
      );

      // Get activities
      const activitiesResult = await this.pool.query(
        `SELECT * FROM activities WHERE route_id = $1 ORDER BY day_number`,
        [routeId]
      );

      // Get restaurants
      const restaurantsResult = await this.pool.query(
        `SELECT * FROM restaurants WHERE route_id = $1 ORDER BY day_number`,
        [routeId]
      );

      // Get accommodations
      const accommodationsResult = await this.pool.query(
        `SELECT * FROM accommodations WHERE route_id = $1 ORDER BY day_number`,
        [routeId]
      );

      // Check if user is owner or collaborator
      let userRole = 'viewer';
      if (route.user_id === userId) {
        userRole = 'owner';
      } else {
        const collabResult = await this.pool.query(
          `SELECT role FROM route_collaborators
           WHERE route_id = $1 AND user_id = $2 AND status = 'accepted'`,
          [routeId, userId]
        );
        if (collabResult.rows.length > 0) {
          userRole = collabResult.rows[0].role;
        }
      }

      return {
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        duration: route.duration,
        startDate: route.start_date,
        endDate: route.end_date,
        status: route.status,
        agentType: route.agent_type,
        createdAt: route.created_at,
        owner: {
          name: route.owner_name,
          email: route.owner_email
        },
        userRole: userRole,
        days: daysResult.rows,
        activities: activitiesResult.rows,
        restaurants: restaurantsResult.rows,
        accommodations: accommodationsResult.rows,
        summary: this.generateRouteSummary(route, daysResult.rows)
      };

    } catch (error) {
      console.error('Error getting route info:', error.message);
      return null;
    }
  }

  /**
   * Get user preferences (learned behavior)
   */
  async getUserPreferences(userId) {
    try {
      const result = await this.pool.query(
        `SELECT preference_key, preference_value
         FROM agent_user_preferences
         WHERE user_id = $1`,
        [userId]
      );

      const preferences = {};
      result.rows.forEach(row => {
        try {
          preferences[row.preference_key] = JSON.parse(row.preference_value);
        } catch {
          preferences[row.preference_key] = row.preference_value;
        }
      });

      return Object.keys(preferences).length > 0 ? preferences : null;

    } catch (error) {
      console.error('Error getting user preferences:', error.message);
      return null;
    }
  }

  /**
   * Get recent user activity
   */
  async getRecentActivity(userId, routeId) {
    try {
      const result = await this.pool.query(
        `SELECT action, description, metadata, created_at
         FROM route_activity
         WHERE user_id = $1 AND ($2::uuid IS NULL OR route_id = $2)
         ORDER BY created_at DESC
         LIMIT 5`,
        [userId, routeId]
      );

      return result.rows.map(row => ({
        action: row.action,
        description: row.description,
        timestamp: row.created_at
      }));

    } catch (error) {
      console.error('Error getting recent activity:', error.message);
      return [];
    }
  }

  /**
   * Generate natural language summary of route
   */
  generateRouteSummary(route, days) {
    let summary = `${route.duration}-day road trip from ${route.origin} to ${route.destination}`;

    if (route.start_date) {
      const startDate = new Date(route.start_date);
      summary += `, starting ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }

    if (days && days.length > 0) {
      const cities = days.map(d => d.location).filter(Boolean);
      if (cities.length > 0) {
        summary += `. Visiting: ${cities.join(' → ')}`;
      }
    }

    return summary;
  }

  /**
   * Save user preference (learned from conversation)
   */
  async saveUserPreference(userId, key, value) {
    try {
      await this.pool.query(
        `INSERT INTO agent_user_preferences (user_id, preference_key, preference_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, preference_key)
         DO UPDATE SET preference_value = $3, updated_at = NOW()`,
        [userId, key, JSON.stringify(value)]
      );

      console.log(`💾 Saved preference for user ${userId}: ${key}`);

    } catch (error) {
      console.error('Error saving user preference:', error.message);
    }
  }

  /**
   * Compress context for token efficiency
   * Removes verbose fields, keeps only essential data
   */
  compressContext(context) {
    const compressed = { ...context };

    // Remove verbose arrays if too large
    if (compressed.route) {
      if (compressed.route.activities && compressed.route.activities.length > 10) {
        compressed.route.activitiesCount = compressed.route.activities.length;
        compressed.route.activities = compressed.route.activities.slice(0, 5);
        compressed.route.activitiesTruncated = true;
      }

      if (compressed.route.restaurants && compressed.route.restaurants.length > 10) {
        compressed.route.restaurantsCount = compressed.route.restaurants.length;
        compressed.route.restaurants = compressed.route.restaurants.slice(0, 5);
        compressed.route.restaurantsTruncated = true;
      }

      // Remove redundant fields
      delete compressed.route.created_at;
    }

    return compressed;
  }
}

module.exports = ContextManager;
