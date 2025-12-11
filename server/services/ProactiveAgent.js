/**
 * ProactiveAgent - Intelligent Trigger-Based Agent Assistance
 *
 * Phase 5: Proactive Agent Behavior
 *
 * Monitors various triggers and initiates helpful actions:
 * - Time-based: Upcoming trips, morning of trip, check-out reminders
 * - Event-based: Weather changes, price alerts, local events
 * - Context-based: Incomplete goals, idle users, missing info
 *
 * Generates contextual, helpful messages and suggestions
 * without being intrusive or annoying.
 */

const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

// =============================================================================
// Constants
// =============================================================================

const TRIGGER_TYPES = {
  UPCOMING_TRIP: 'upcoming_trip',           // Trip starting soon (1-3 days)
  TRIP_TODAY: 'trip_today',                 // Trip starts today
  WEATHER_ALERT: 'weather_alert',           // Significant weather change
  INCOMPLETE_GOAL: 'incomplete_goal',       // Goal has been stale
  MORNING_BRIEFING: 'morning_briefing',     // Daily trip briefing
  ACTIVITY_REMINDER: 'activity_reminder',   // Upcoming activity
  CHECKOUT_REMINDER: 'checkout_reminder',   // Hotel checkout time
  LOCAL_EVENT: 'local_event',               // Special event nearby
  PACKING_REMINDER: 'packing_reminder',     // Pre-trip packing reminder
};

const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Weather conditions that trigger alerts
const SIGNIFICANT_WEATHER_CONDITIONS = [
  'Thunderstorm',
  'Snow',
  'Heavy Rain',
  'Extreme',
  'Storm',
];

// =============================================================================
// ProactiveAgent Class
// =============================================================================

class ProactiveAgent {
  constructor(db) {
    this.db = db;
    this.claudeClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.model = 'claude-haiku-4-5-20251001';
  }

  // ===========================================================================
  // Main Trigger Check (Run Periodically)
  // ===========================================================================

  /**
   * Check all triggers and generate notifications
   * Called by cron job or scheduler
   */
  async checkAllTriggers() {
    console.log('[ProactiveAgent] Running trigger checks...');

    const allTriggers = [];

    try {
      // Run all trigger checks in parallel
      const [
        upcomingTrips,
        weatherAlerts,
        incompleteGoals,
        morningBriefings,
      ] = await Promise.all([
        this.checkUpcomingTrips(),
        this.checkWeatherAlerts(),
        this.checkIncompleteGoals(),
        this.checkMorningBriefings(),
      ]);

      allTriggers.push(...upcomingTrips, ...weatherAlerts, ...incompleteGoals, ...morningBriefings);

      console.log(`[ProactiveAgent] Found ${allTriggers.length} triggers`);

      // Process each trigger
      for (const trigger of allTriggers) {
        await this.handleTrigger(trigger);
      }

      return { success: true, triggersProcessed: allTriggers.length };
    } catch (error) {
      console.error('[ProactiveAgent] Error checking triggers:', error);
      return { success: false, error: error.message };
    }
  }

  // ===========================================================================
  // Trigger Checks
  // ===========================================================================

  /**
   * Check for trips starting within 1-3 days
   */
  async checkUpcomingTrips() {
    const triggers = [];

    try {
      // Get itineraries with trips starting within 3 days
      const result = await this.db.query(`
        SELECT
          i.id as itinerary_id,
          i.user_id,
          i.preferences,
          i.day_structure,
          r.destination,
          r.origin,
          u.email,
          u.name as user_name
        FROM itineraries i
        JOIN routes r ON i.route_id = r.id
        JOIN users u ON i.user_id = u.id
        WHERE i.status = 'published'
          AND i.preferences->>'startDate' IS NOT NULL
          AND (i.preferences->>'startDate')::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
          AND NOT EXISTS (
            SELECT 1 FROM proactive_notifications pn
            WHERE pn.itinerary_id = i.id
              AND pn.trigger_type = 'upcoming_trip'
              AND pn.created_at > NOW() - INTERVAL '24 hours'
          )
      `);

      for (const row of result.rows) {
        const startDate = new Date(row.preferences?.startDate);
        const daysUntil = Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24));

        triggers.push({
          type: daysUntil === 0 ? TRIGGER_TYPES.TRIP_TODAY : TRIGGER_TYPES.UPCOMING_TRIP,
          userId: row.user_id,
          itineraryId: row.itinerary_id,
          priority: daysUntil === 0 ? NOTIFICATION_PRIORITY.HIGH : NOTIFICATION_PRIORITY.MEDIUM,
          data: {
            destination: row.destination,
            origin: row.origin,
            startDate: row.preferences?.startDate,
            daysUntil,
            userName: row.user_name,
            dayStructure: row.day_structure,
          },
        });
      }
    } catch (error) {
      console.error('[ProactiveAgent] Error checking upcoming trips:', error);
    }

    return triggers;
  }

  /**
   * Check for significant weather changes for active trips
   */
  async checkWeatherAlerts() {
    const triggers = [];

    try {
      // Get active trips (currently happening or starting within 2 days)
      const result = await this.db.query(`
        SELECT
          i.id as itinerary_id,
          i.user_id,
          i.preferences,
          i.day_structure,
          i.weather_data,
          r.destination,
          u.name as user_name
        FROM itineraries i
        JOIN routes r ON i.route_id = r.id
        JOIN users u ON i.user_id = u.id
        WHERE i.status = 'published'
          AND i.preferences->>'startDate' IS NOT NULL
          AND (i.preferences->>'startDate')::date BETWEEN CURRENT_DATE - INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '2 days'
          AND NOT EXISTS (
            SELECT 1 FROM proactive_notifications pn
            WHERE pn.itinerary_id = i.id
              AND pn.trigger_type = 'weather_alert'
              AND pn.created_at > NOW() - INTERVAL '6 hours'
          )
      `);

      for (const row of result.rows) {
        // Get current weather for destination
        const weather = await this.getWeather(row.destination);

        if (weather && this.isSignificantWeather(weather)) {
          triggers.push({
            type: TRIGGER_TYPES.WEATHER_ALERT,
            userId: row.user_id,
            itineraryId: row.itinerary_id,
            priority: NOTIFICATION_PRIORITY.HIGH,
            data: {
              destination: row.destination,
              weather,
              userName: row.user_name,
              dayStructure: row.day_structure,
            },
          });
        }
      }
    } catch (error) {
      console.error('[ProactiveAgent] Error checking weather alerts:', error);
    }

    return triggers;
  }

  /**
   * Check for stale incomplete goals
   */
  async checkIncompleteGoals() {
    const triggers = [];

    try {
      // Find goals that have been inactive for > 24 hours
      const result = await this.db.query(`
        SELECT
          g.id as goal_id,
          g.user_id,
          g.description,
          g.progress,
          g.subtasks,
          g.updated_at,
          u.name as user_name
        FROM user_goals g
        JOIN users u ON g.user_id = u.id
        WHERE g.status = 'in_progress'
          AND g.progress < 100
          AND g.updated_at < NOW() - INTERVAL '24 hours'
          AND NOT EXISTS (
            SELECT 1 FROM proactive_notifications pn
            WHERE pn.user_id = g.user_id
              AND pn.trigger_type = 'incomplete_goal'
              AND pn.metadata->>'goalId' = g.id::text
              AND pn.created_at > NOW() - INTERVAL '48 hours'
          )
        LIMIT 10
      `);

      for (const row of result.rows) {
        // Find next actionable subtask
        const nextSubtask = this.getNextSubtask(row.subtasks);

        triggers.push({
          type: TRIGGER_TYPES.INCOMPLETE_GOAL,
          userId: row.user_id,
          goalId: row.goal_id,
          priority: NOTIFICATION_PRIORITY.LOW,
          data: {
            goalDescription: row.description,
            progress: row.progress,
            nextSubtask,
            userName: row.user_name,
            daysSinceUpdate: Math.floor(
              (new Date() - new Date(row.updated_at)) / (1000 * 60 * 60 * 24)
            ),
          },
        });
      }
    } catch (error) {
      console.error('[ProactiveAgent] Error checking incomplete goals:', error);
    }

    return triggers;
  }

  /**
   * Check for morning briefing triggers (trip in progress)
   */
  async checkMorningBriefings() {
    const triggers = [];
    const currentHour = new Date().getHours();

    // Only trigger between 6 AM and 9 AM
    if (currentHour < 6 || currentHour > 9) {
      return triggers;
    }

    try {
      // Get trips currently in progress
      const result = await this.db.query(`
        SELECT
          i.id as itinerary_id,
          i.user_id,
          i.preferences,
          i.day_structure,
          r.destination,
          u.name as user_name
        FROM itineraries i
        JOIN routes r ON i.route_id = r.id
        JOIN users u ON i.user_id = u.id
        WHERE i.status = 'published'
          AND i.preferences->>'startDate' IS NOT NULL
          AND i.preferences->>'endDate' IS NOT NULL
          AND CURRENT_DATE BETWEEN (i.preferences->>'startDate')::date AND (i.preferences->>'endDate')::date
          AND NOT EXISTS (
            SELECT 1 FROM proactive_notifications pn
            WHERE pn.itinerary_id = i.id
              AND pn.trigger_type = 'morning_briefing'
              AND pn.created_at > NOW() - INTERVAL '20 hours'
          )
      `);

      for (const row of result.rows) {
        const startDate = new Date(row.preferences?.startDate);
        const dayNumber = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24)) + 1;

        // Get today's activities
        const todaysActivities = this.getTodaysActivities(row.day_structure, dayNumber);

        triggers.push({
          type: TRIGGER_TYPES.MORNING_BRIEFING,
          userId: row.user_id,
          itineraryId: row.itinerary_id,
          priority: NOTIFICATION_PRIORITY.MEDIUM,
          data: {
            destination: row.destination,
            dayNumber,
            todaysActivities,
            userName: row.user_name,
          },
        });
      }
    } catch (error) {
      console.error('[ProactiveAgent] Error checking morning briefings:', error);
    }

    return triggers;
  }

  // ===========================================================================
  // Trigger Handler
  // ===========================================================================

  /**
   * Handle a trigger by generating a message and storing notification
   */
  async handleTrigger(trigger) {
    try {
      // Generate contextual message using Claude
      const message = await this.generateProactiveMessage(trigger);

      // Generate suggested actions
      const actions = this.generateSuggestedActions(trigger);

      // Store notification
      await this.storeNotification({
        userId: trigger.userId,
        itineraryId: trigger.itineraryId,
        goalId: trigger.goalId,
        triggerType: trigger.type,
        priority: trigger.priority,
        title: message.title,
        body: message.body,
        actions,
        metadata: trigger.data,
      });

      console.log(`[ProactiveAgent] Created notification for ${trigger.type}:`, message.title);

      return { success: true, notification: message };
    } catch (error) {
      console.error('[ProactiveAgent] Error handling trigger:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate a contextual proactive message using Claude
   */
  async generateProactiveMessage(trigger) {
    const promptsByType = {
      [TRIGGER_TYPES.UPCOMING_TRIP]: `
        Generate a friendly, helpful notification for an upcoming trip.
        User: ${trigger.data.userName || 'Traveler'}
        Destination: ${trigger.data.destination}
        Days until trip: ${trigger.data.daysUntil}

        Create a title (max 50 chars) and body (max 200 chars).
        Be warm, helpful, and suggest useful pre-trip actions.
      `,
      [TRIGGER_TYPES.TRIP_TODAY]: `
        Generate an exciting, helpful notification for a trip starting TODAY!
        User: ${trigger.data.userName || 'Traveler'}
        Destination: ${trigger.data.destination}

        Create a title (max 50 chars) and body (max 200 chars).
        Be excited but practical, wish them a great trip!
      `,
      [TRIGGER_TYPES.WEATHER_ALERT]: `
        Generate a helpful weather alert notification.
        User: ${trigger.data.userName || 'Traveler'}
        Destination: ${trigger.data.destination}
        Weather: ${JSON.stringify(trigger.data.weather)}

        Create a title (max 50 chars) and body (max 200 chars).
        Be helpful, suggest alternatives if needed.
      `,
      [TRIGGER_TYPES.INCOMPLETE_GOAL]: `
        Generate a gentle reminder about an incomplete travel goal.
        User: ${trigger.data.userName || 'Traveler'}
        Goal: ${trigger.data.goalDescription}
        Progress: ${trigger.data.progress}%
        Next step: ${trigger.data.nextSubtask?.description || 'Continue planning'}
        Days since update: ${trigger.data.daysSinceUpdate}

        Create a title (max 50 chars) and body (max 200 chars).
        Be encouraging, not pushy. Offer to help.
      `,
      [TRIGGER_TYPES.MORNING_BRIEFING]: `
        Generate a cheerful morning briefing notification.
        User: ${trigger.data.userName || 'Traveler'}
        Destination: ${trigger.data.destination}
        Day number: ${trigger.data.dayNumber}
        Today's activities: ${JSON.stringify(trigger.data.todaysActivities || [])}

        Create a title (max 50 chars) and body (max 200 chars).
        Be upbeat, summarize the day ahead.
      `,
    };

    const prompt = promptsByType[trigger.type] || `
      Generate a helpful notification for a traveler.
      Type: ${trigger.type}
      Data: ${JSON.stringify(trigger.data)}

      Create a title (max 50 chars) and body (max 200 chars).
    `;

    try {
      const response = await this.claudeClient.messages.create({
        model: this.model,
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `${prompt}

Return JSON only:
{
  "title": "...",
  "body": "..."
}`
        }],
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback messages
      return this.getFallbackMessage(trigger);
    } catch (error) {
      console.error('[ProactiveAgent] Error generating message:', error);
      return this.getFallbackMessage(trigger);
    }
  }

  /**
   * Fallback messages if AI generation fails
   */
  getFallbackMessage(trigger) {
    const fallbacks = {
      [TRIGGER_TYPES.UPCOMING_TRIP]: {
        title: `Trip to ${trigger.data.destination} in ${trigger.data.daysUntil} days!`,
        body: "Your adventure is approaching! Check the weather and make sure you're ready.",
      },
      [TRIGGER_TYPES.TRIP_TODAY]: {
        title: `Your trip to ${trigger.data.destination} starts today!`,
        body: 'Have an amazing journey! Check your itinerary for today\'s activities.',
      },
      [TRIGGER_TYPES.WEATHER_ALERT]: {
        title: `Weather alert for ${trigger.data.destination}`,
        body: 'Weather conditions have changed. You might want to adjust your plans.',
      },
      [TRIGGER_TYPES.INCOMPLETE_GOAL]: {
        title: 'Ready to continue planning?',
        body: `Your "${trigger.data.goalDescription}" goal is ${trigger.data.progress}% complete. Let's finish it!`,
      },
      [TRIGGER_TYPES.MORNING_BRIEFING]: {
        title: `Good morning! Day ${trigger.data.dayNumber} in ${trigger.data.destination}`,
        body: 'Here\'s what\'s planned for today. Enjoy your adventures!',
      },
    };

    return fallbacks[trigger.type] || {
      title: 'Trip Update',
      body: 'You have a new travel notification.',
    };
  }

  /**
   * Generate suggested actions for a trigger
   */
  generateSuggestedActions(trigger) {
    const actionsByType = {
      [TRIGGER_TYPES.UPCOMING_TRIP]: [
        { label: 'Check weather', action: 'check_weather', data: { destination: trigger.data.destination } },
        { label: 'View itinerary', action: 'view_itinerary', data: { itineraryId: trigger.itineraryId } },
        { label: 'Packing list', action: 'generate_packing_list', data: { destination: trigger.data.destination } },
      ],
      [TRIGGER_TYPES.TRIP_TODAY]: [
        { label: 'View today\'s plan', action: 'view_day', data: { itineraryId: trigger.itineraryId, day: 1 } },
        { label: 'Get directions', action: 'get_directions', data: {} },
      ],
      [TRIGGER_TYPES.WEATHER_ALERT]: [
        { label: 'Indoor alternatives', action: 'find_indoor_activities', data: { destination: trigger.data.destination } },
        { label: 'Update plans', action: 'modify_itinerary', data: { itineraryId: trigger.itineraryId } },
      ],
      [TRIGGER_TYPES.INCOMPLETE_GOAL]: [
        { label: 'Continue', action: 'resume_goal', data: { goalId: trigger.goalId } },
        { label: 'Remind later', action: 'snooze_goal', data: { goalId: trigger.goalId } },
      ],
      [TRIGGER_TYPES.MORNING_BRIEFING]: [
        { label: 'View full day', action: 'view_day', data: { itineraryId: trigger.itineraryId, day: trigger.data.dayNumber } },
        { label: 'Check weather', action: 'check_weather', data: { destination: trigger.data.destination } },
      ],
    };

    return actionsByType[trigger.type] || [];
  }

  // ===========================================================================
  // Storage
  // ===========================================================================

  /**
   * Store a notification in the database
   */
  async storeNotification(notification) {
    const result = await this.db.query(`
      INSERT INTO proactive_notifications (
        user_id, itinerary_id, goal_id, trigger_type, priority,
        title, body, actions, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING id
    `, [
      notification.userId,
      notification.itineraryId || null,
      notification.goalId || null,
      notification.triggerType,
      notification.priority,
      notification.title,
      notification.body,
      JSON.stringify(notification.actions),
      JSON.stringify(notification.metadata),
    ]);

    return result.rows[0];
  }

  /**
   * Get pending notifications for a user
   */
  async getNotificationsForUser(userId, limit = 10) {
    const result = await this.db.query(`
      SELECT *
      FROM proactive_notifications
      WHERE user_id = $1
        AND status IN ('pending', 'sent')
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  /**
   * Mark notification as read/dismissed
   */
  async updateNotificationStatus(notificationId, status) {
    await this.db.query(`
      UPDATE proactive_notifications
      SET status = $2, updated_at = NOW()
      WHERE id = $1
    `, [notificationId, status]);
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Get weather for a location
   */
  async getWeather(location) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return null;

    try {
      // Geocode
      const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
      const geoRes = await axios.get(geoUrl, { timeout: 5000 });

      if (!geoRes.data?.[0]) return null;

      const { lat, lon } = geoRes.data[0];

      // Get weather
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      const weatherRes = await axios.get(weatherUrl, { timeout: 5000 });

      return {
        condition: weatherRes.data.weather[0].main,
        description: weatherRes.data.weather[0].description,
        temperature: Math.round(weatherRes.data.main.temp),
        feelsLike: Math.round(weatherRes.data.main.feels_like),
      };
    } catch (error) {
      console.error('[ProactiveAgent] Weather fetch error:', error.message);
      return null;
    }
  }

  /**
   * Check if weather is significant enough to alert
   */
  isSignificantWeather(weather) {
    if (!weather) return false;

    return (
      SIGNIFICANT_WEATHER_CONDITIONS.some(c =>
        weather.condition.toLowerCase().includes(c.toLowerCase()) ||
        weather.description.toLowerCase().includes(c.toLowerCase())
      ) ||
      weather.temperature < 0 ||
      weather.temperature > 35
    );
  }

  /**
   * Get next actionable subtask from a goal
   */
  getNextSubtask(subtasks) {
    if (!Array.isArray(subtasks)) return null;

    const completedIds = subtasks
      .filter(s => s.status === 'done' || s.status === 'skipped')
      .map(s => s.id);

    return subtasks.find(s =>
      s.status === 'todo' &&
      (!s.dependencies || s.dependencies.every(d => completedIds.includes(d)))
    );
  }

  /**
   * Get activities for today from day structure
   */
  getTodaysActivities(dayStructure, dayNumber) {
    if (!dayStructure || !Array.isArray(dayStructure)) return [];

    const today = dayStructure.find(d => d.day === dayNumber || d.dayNumber === dayNumber);
    if (!today) return [];

    const activities = [];
    if (today.morning) activities.push(...(Array.isArray(today.morning) ? today.morning : [today.morning]));
    if (today.afternoon) activities.push(...(Array.isArray(today.afternoon) ? today.afternoon : [today.afternoon]));
    if (today.evening) activities.push(...(Array.isArray(today.evening) ? today.evening : [today.evening]));

    return activities.slice(0, 5).map(a => typeof a === 'string' ? a : a.name || a.title);
  }

  // ===========================================================================
  // Context-Based Triggers (Real-time)
  // ===========================================================================

  /**
   * Check for context triggers based on user activity
   * Called when user is active on a page
   */
  async checkContextTriggers(userId, pageContext) {
    const triggers = [];

    // Check if user has been idle on itinerary page without completing booking
    if (pageContext.name === 'itinerary' && pageContext.idleTime > 60) {
      const hasBooking = await this.checkUserHasBooking(userId, pageContext.itineraryId);

      if (!hasBooking) {
        triggers.push({
          type: 'incomplete_booking',
          userId,
          priority: NOTIFICATION_PRIORITY.LOW,
          data: {
            itineraryId: pageContext.itineraryId,
            suggestion: 'Would you like help finding accommodation?',
          },
        });
      }
    }

    return triggers;
  }

  /**
   * Check if user has any bookings for an itinerary
   */
  async checkUserHasBooking(userId, itineraryId) {
    // This would check a bookings table if it exists
    // For now, return false to demonstrate the feature
    return false;
  }
}

// =============================================================================
// Exports
// =============================================================================

module.exports = ProactiveAgent;
module.exports.TRIGGER_TYPES = TRIGGER_TYPES;
module.exports.NOTIFICATION_PRIORITY = NOTIFICATION_PRIORITY;
