/**
 * CollabNotificationService.js
 * Phase 5: Collaboration Notifications
 *
 * Handles notifications for user collaboration events:
 * - @mentions, task assignments, polls, comments, etc.
 * - Push notifications via Firebase Cloud Messaging
 * - Email notifications (placeholder)
 * - In-app notification center
 */

const admin = require('firebase-admin');
const db = require('../../db/connection');

// Initialize Firebase Admin (only if credentials are provided)
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.warn('⚠️  Firebase credentials not found. Push notifications will be disabled.');
      console.warn('   Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL to enable.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail
      })
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  }
}

// Initialize on module load
initializeFirebase();

class CollabNotificationService {
  /**
   * Send push notification to user via Firebase Cloud Messaging
   * @param {string} userId - Target user ID
   * @param {Object} notification - Notification payload
   */
  async sendPushNotification(userId, notification) {
    if (!firebaseInitialized) {
      console.log('Skip push notification: Firebase not initialized');
      return null;
    }

    try {
      // Get user's device tokens
      const result = await db.query(
        'SELECT fcm_token FROM user_devices WHERE user_id = $1 AND fcm_token IS NOT NULL',
        [userId]
      );

      if (result.rows.length === 0) {
        console.log(`No devices found for user ${userId}`);
        return null;
      }

      const tokens = result.rows.map(row => row.fcm_token);

      // Send to all user's devices
      const message = {
        notification: {
          title: notification.title,
          body: notification.message,
          icon: notification.icon || '/icon-192x192.png'
        },
        data: {
          type: notification.type,
          routeId: notification.routeId || '',
          itineraryId: notification.itineraryId || '',
          deepLink: notification.deepLink || ''
        },
        tokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(`✅ Sent ${response.successCount} push notifications, ${response.failureCount} failed`);

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            invalidTokens.push(tokens[idx]);
          }
        });

        if (invalidTokens.length > 0) {
          await db.query(
            'DELETE FROM user_devices WHERE fcm_token = ANY($1)',
            [invalidTokens]
          );
          console.log(`🗑️  Removed ${invalidTokens.length} invalid FCM tokens`);
        }
      }

      return response;

    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  }

  /**
   * Send notification to all route collaborators
   */
  async notifyRouteCollaborators(routeId, notification, excludeUserId = null) {
    try {
      // Get all collaborators for this route
      let query = 'SELECT user_id FROM route_collaborators WHERE route_id = $1 AND status = $2';
      const params = [routeId, 'accepted'];

      if (excludeUserId) {
        query += ' AND user_id != $3';
        params.push(excludeUserId);
      }

      const result = await db.query(query, params);

      if (result.rows.length === 0) {
        console.log(`No collaborators to notify for route ${routeId}`);
        return;
      }

      // Send notification to each collaborator
      const notificationPromises = result.rows.map(row =>
        this.sendNotification(row.user_id, {
          ...notification,
          routeId
        })
      );

      await Promise.allSettled(notificationPromises);

      console.log(`📬 Notified ${result.rows.length} collaborators on route ${routeId}`);

    } catch (error) {
      console.error('Error notifying route collaborators:', error);
    }
  }

  /**
   * Send email notification (placeholder for future implementation)
   */
  async sendEmailNotification(userId, notification) {
    // TODO: Integrate SendGrid or AWS SES
    console.log(`📧 Email notification (not implemented): ${userId} - ${notification.title}`);
    return null;
  }

  /**
   * Create in-app notification
   */
  async createInAppNotification(userId, notification) {
    try {
      const result = await db.query(
        `INSERT INTO notifications (
          user_id, type, title, message, route_id, itinerary_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          userId,
          notification.type,
          notification.title,
          notification.message,
          notification.routeId || null,
          notification.itineraryId || null,
          notification.metadata ? JSON.stringify(notification.metadata) : null
        ]
      );

      return result.rows[0];

    } catch (error) {
      console.error('Error creating in-app notification:', error);
      return null;
    }
  }

  /**
   * Check user's notification preferences
   */
  async getUserPreferences(userId, notificationType) {
    try {
      const result = await db.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Return default preferences
        return {
          push: true,
          email: true,
          inApp: true
        };
      }

      const prefs = result.rows[0];

      // Map notification type to preference field
      const typeFieldMap = {
        'mention': 'notify_mention',
        'task_assigned': 'notify_task_assigned',
        'task_due_soon': 'notify_task_due_soon',
        'poll_created': 'notify_poll_created',
        'poll_closed': 'notify_poll_created', // Same as created
        'comment_on_activity': 'notify_comment_on_activity',
        'activity_changed': 'notify_activity_changed',
        'chat_message': 'notify_message'
      };

      const typeEnabled = typeFieldMap[notificationType]
        ? prefs[typeFieldMap[notificationType]]
        : true;

      return {
        push: prefs.push_enabled && typeEnabled,
        email: prefs.email_enabled && typeEnabled,
        inApp: prefs.in_app_enabled && typeEnabled
      };

    } catch (error) {
      console.error('Error getting user preferences:', error);
      // Return defaults on error
      return {
        push: true,
        email: true,
        inApp: true
      };
    }
  }

  /**
   * Master method: Send notification via multiple channels
   * Respects user preferences
   */
  async sendNotification(userId, notification, channels = ['push', 'in_app']) {
    try {
      // Get user preferences
      const prefs = await this.getUserPreferences(userId, notification.type);

      // Send via each requested channel (if enabled in preferences)
      const promises = [];

      if (channels.includes('push') && prefs.push) {
        promises.push(this.sendPushNotification(userId, notification));
      }

      if (channels.includes('email') && prefs.email) {
        promises.push(this.sendEmailNotification(userId, notification));
      }

      if (channels.includes('in_app') && prefs.inApp) {
        promises.push(this.createInAppNotification(userId, notification));
      }

      await Promise.allSettled(promises);

      console.log(`✅ Sent notification to user ${userId} via channels:`, channels.filter((c, i) =>
        (c === 'push' && prefs.push) ||
        (c === 'email' && prefs.email) ||
        (c === 'in_app' && prefs.inApp)
      ));

    } catch (error) {
      console.error('Error in sendNotification:', error);
    }
  }
}

// Export singleton instance
module.exports = new CollabNotificationService();
