/**
 * Notifications API Routes
 * STEP 4 Phase 1: Proactive AI - Weather Monitoring
 */

const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const { getInstance: getProactiveAgent } = require('../services/ProactiveAgentService');

const notificationService = new NotificationService();

/**
 * GET /api/notifications/:itineraryId
 * Get all notifications for an itinerary
 */
router.get('/:itineraryId', async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const {
      includeRead = 'true',
      includeDismissed = 'false',
      type,
      priority,
      limit = '50'
    } = req.query;

    const notifications = await notificationService.getNotifications(itineraryId, {
      includeRead: includeRead === 'true',
      includeDismissed: includeDismissed === 'true',
      type: type || null,
      priority: priority || null,
      limit: parseInt(limit, 10)
    });

    res.json({
      notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/:itineraryId/unread-count
 * Get unread notification count
 */
router.get('/:itineraryId/unread-count', async (req, res) => {
  try {
    const { itineraryId } = req.params;

    const count = await notificationService.getUnreadCount(itineraryId);

    res.json({ count });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

/**
 * GET /api/notifications/:itineraryId/stats
 * Get notification statistics
 */
router.get('/:itineraryId/stats', async (req, res) => {
  try {
    const { itineraryId } = req.params;

    const stats = await notificationService.getStats(itineraryId);

    res.json(stats);

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/notifications/:notificationId/read
 * Mark notification as read
 */
router.post('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const success = await notificationService.markAsRead(notificationId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

/**
 * POST /api/notifications/:itineraryId/read-all
 * Mark all notifications as read for an itinerary
 */
router.post('/:itineraryId/read-all', async (req, res) => {
  try {
    const { itineraryId } = req.params;

    const count = await notificationService.markAllAsRead(itineraryId);

    res.json({ success: true, count });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * POST /api/notifications/:notificationId/dismiss
 * Dismiss notification
 */
router.post('/:notificationId/dismiss', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const success = await notificationService.dismissNotification(notificationId);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }

  } catch (error) {
    console.error('Dismiss notification error:', error);
    res.status(500).json({ error: 'Failed to dismiss notification' });
  }
});

/**
 * POST /api/notifications/trigger-check
 * Manual trigger for weather monitoring (testing/debugging)
 */
router.post('/trigger-check', async (req, res) => {
  try {
    const { itineraryId } = req.body;

    const proactiveAgent = getProactiveAgent();
    const result = await proactiveAgent.triggerManualCheck(itineraryId);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger check: ' + error.message });
  }
});

/**
 * GET /api/notifications/status
 * Get proactive monitoring status
 */
router.get('/status', async (req, res) => {
  try {
    const proactiveAgent = getProactiveAgent();
    const status = proactiveAgent.getStatus();

    res.json(status);

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

module.exports = router;
