/**
 * NotificationService - Manage proactive notifications
 *
 * STEP 4 Phase 1: Core notification management
 *
 * Responsibilities:
 * - Create notifications in database
 * - Retrieve notifications for itineraries
 * - Mark notifications as read/dismissed
 * - Handle notification expiration
 * - Query notification statistics
 */

const pool = require('../db');

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(itineraryId, notification) {
    const {
      type,
      priority = 'medium',
      title,
      message,
      action_url = null,
      action_label = null,
      metadata = {},
      expires_at = null
    } = notification;

    const query = `
      INSERT INTO proactive_notifications (
        itinerary_id,
        type,
        priority,
        title,
        message,
        action_url,
        action_label,
        metadata,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at
    `;

    try {
      const result = await pool.query(query, [
        itineraryId,
        type,
        priority,
        title,
        message,
        action_url,
        action_label,
        JSON.stringify(metadata),
        expires_at
      ]);

      console.log(`[NotificationService] ✅ Created ${type} notification for itinerary ${itineraryId}`);

      return result.rows[0];

    } catch (error) {
      console.error('[NotificationService] ❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for an itinerary
   */
  async getNotifications(itineraryId, options = {}) {
    const {
      includeRead = true,
      includeDismissed = false,
      type = null,
      priority = null,
      limit = 50
    } = options;

    let query = `
      SELECT
        id,
        type,
        priority,
        title,
        message,
        action_url,
        action_label,
        metadata,
        is_read,
        is_dismissed,
        created_at,
        expires_at
      FROM proactive_notifications
      WHERE itinerary_id = $1
    `;

    const params = [itineraryId];
    let paramCounter = 2;

    // Filter by read status
    if (!includeRead) {
      query += ` AND is_read = FALSE`;
    }

    // Filter by dismissed status
    if (!includeDismissed) {
      query += ` AND is_dismissed = FALSE`;
    }

    // Filter by type
    if (type) {
      query += ` AND type = $${paramCounter}`;
      params.push(type);
      paramCounter++;
    }

    // Filter by priority
    if (priority) {
      query += ` AND priority = $${paramCounter}`;
      params.push(priority);
      paramCounter++;
    }

    // Exclude expired notifications
    query += ` AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`;

    // Order by priority and date
    query += `
      ORDER BY
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        created_at DESC
      LIMIT $${paramCounter}
    `;
    params.push(limit);

    try {
      const result = await pool.query(query, params);

      // Parse metadata JSON
      const notifications = result.rows.map(row => ({
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
      }));

      return notifications;

    } catch (error) {
      console.error('[NotificationService] ❌ Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(itineraryId) {
    const query = `
      SELECT COUNT(*) as count
      FROM proactive_notifications
      WHERE itinerary_id = $1
        AND is_read = FALSE
        AND is_dismissed = FALSE
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;

    try {
      const result = await pool.query(query, [itineraryId]);
      return parseInt(result.rows[0].count, 10);

    } catch (error) {
      console.error('[NotificationService] ❌ Error counting notifications:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    const query = `
      UPDATE proactive_notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING id
    `;

    try {
      const result = await pool.query(query, [notificationId]);
      return result.rows.length > 0;

    } catch (error) {
      console.error('[NotificationService] ❌ Error marking as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for an itinerary
   */
  async markAllAsRead(itineraryId) {
    const query = `
      UPDATE proactive_notifications
      SET is_read = TRUE
      WHERE itinerary_id = $1
        AND is_read = FALSE
      RETURNING id
    `;

    try {
      const result = await pool.query(query, [itineraryId]);
      console.log(`[NotificationService] ✅ Marked ${result.rows.length} notifications as read`);
      return result.rows.length;

    } catch (error) {
      console.error('[NotificationService] ❌ Error marking all as read:', error);
      return 0;
    }
  }

  /**
   * Dismiss notification (user has taken action or wants to hide it)
   */
  async dismissNotification(notificationId) {
    const query = `
      UPDATE proactive_notifications
      SET is_dismissed = TRUE, is_read = TRUE
      WHERE id = $1
      RETURNING id
    `;

    try {
      const result = await pool.query(query, [notificationId]);
      return result.rows.length > 0;

    } catch (error) {
      console.error('[NotificationService] ❌ Error dismissing notification:', error);
      return false;
    }
  }

  /**
   * Delete old/expired notifications (cleanup job)
   */
  async cleanupExpiredNotifications(daysOld = 30) {
    const query = `
      DELETE FROM proactive_notifications
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
        OR (expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days')
      RETURNING id
    `;

    try {
      const result = await pool.query(query);
      console.log(`[NotificationService] 🗑️  Cleaned up ${result.rows.length} expired notifications`);
      return result.rows.length;

    } catch (error) {
      console.error('[NotificationService] ❌ Error cleaning up notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics for an itinerary
   */
  async getStats(itineraryId) {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE is_read = FALSE AND is_dismissed = FALSE) as unread_count,
        COUNT(*) FILTER (WHERE type = 'weather') as weather_count,
        COUNT(*) FILTER (WHERE type = 'event') as event_count,
        COUNT(*) FILTER (WHERE type = 'budget') as budget_count,
        COUNT(*) FILTER (WHERE type = 'traffic') as traffic_count,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
        COUNT(*) FILTER (WHERE priority = 'high') as high_count
      FROM proactive_notifications
      WHERE itinerary_id = $1
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;

    try {
      const result = await pool.query(query, [itineraryId]);
      return result.rows[0];

    } catch (error) {
      console.error('[NotificationService] ❌ Error fetching stats:', error);
      return {
        unread_count: 0,
        weather_count: 0,
        event_count: 0,
        budget_count: 0,
        traffic_count: 0,
        urgent_count: 0,
        high_count: 0
      };
    }
  }

  /**
   * Check if similar notification already exists (prevent duplicates)
   */
  async notificationExists(itineraryId, type, metadata) {
    // Look for notifications with same type and key metadata fields within last 24 hours
    const query = `
      SELECT id
      FROM proactive_notifications
      WHERE itinerary_id = $1
        AND type = $2
        AND metadata @> $3
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      LIMIT 1
    `;

    try {
      const result = await pool.query(query, [
        itineraryId,
        type,
        JSON.stringify(metadata)
      ]);

      return result.rows.length > 0;

    } catch (error) {
      console.error('[NotificationService] ❌ Error checking duplicate:', error);
      return false;
    }
  }
}

module.exports = NotificationService;
