/**
 * Trip API Routes
 * Phase 2: Trip in Progress Mode
 *
 * Endpoints for real-time trip tracking, check-ins, and location updates
 */

const express = require('express');
const router = express.Router();
const TripService = require('../services/TripService');

const tripService = new TripService();

// Simple auth middleware - extracts user ID from token
// In production, use proper JWT verification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // For now, we'll extract user info from a simple token format
  // In production, verify JWT and extract user ID
  try {
    const token = authHeader.split(' ')[1];
    // Decode base64 token to get user info
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    req.userId = decoded.userId || decoded.id;
    next();
  } catch {
    // Fallback: try to get user from query or body
    req.userId = req.query.userId || req.body?.userId;
    if (!req.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next();
  }
};

/**
 * POST /api/trip/:routeId/start
 * Start a new trip or resume existing
 */
router.post('/:routeId/start', authMiddleware, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { itineraryId } = req.body;
    const userId = req.userId;

    const result = await tripService.startTrip(routeId, userId, itineraryId);

    res.json({
      success: true,
      tripId: result.trip.id,
      trip: result.trip,
      isNew: result.isNew,
      resumed: result.resumed
    });

  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

/**
 * GET /api/trip/active
 * Get user's currently active trip
 */
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const trip = await tripService.getActiveTrip(userId);

    if (!trip) {
      return res.json({ hasActiveTrip: false, trip: null });
    }

    res.json({
      hasActiveTrip: true,
      trip
    });

  } catch (error) {
    console.error('Get active trip error:', error);
    res.status(500).json({ error: 'Failed to fetch active trip' });
  }
});

/**
 * GET /api/trip/:tripId
 * Get trip by ID
 */
router.get('/:tripId', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.userId;

    const trip = await tripService.getTripById(tripId, userId);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ trip });

  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

/**
 * GET /api/trip/:tripId/today
 * Get today's activities for a trip
 */
router.get('/:tripId/today', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;

    const todayData = await tripService.getTodayActivities(tripId);

    res.json(todayData);

  } catch (error) {
    console.error('Get today activities error:', error);
    res.status(500).json({ error: 'Failed to fetch today activities' });
  }
});

/**
 * GET /api/trip/:tripId/progress
 * Get trip progress dashboard data
 */
router.get('/:tripId/progress', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;

    const progress = await tripService.getTripProgress(tripId);

    res.json(progress);

  } catch (error) {
    console.error('Get trip progress error:', error);
    res.status(500).json({ error: 'Failed to fetch trip progress' });
  }
});

/**
 * POST /api/trip/:tripId/location
 * Update trip location (GPS tracking)
 */
router.post('/:tripId/location', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.userId;
    const locationData = req.body;

    if (!locationData.latitude || !locationData.longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    await tripService.updateLocation(tripId, userId, locationData);

    res.json({ success: true });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * POST /api/trip/:tripId/checkin
 * Create a check-in
 */
router.post('/:tripId/checkin', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.userId;
    const checkinData = req.body;

    if (!checkinData.activityName) {
      return res.status(400).json({ error: 'Activity name required' });
    }

    const checkin = await tripService.createCheckin(tripId, userId, checkinData);

    res.json({
      success: true,
      checkin
    });

  } catch (error) {
    console.error('Create checkin error:', error);
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

/**
 * GET /api/trip/:tripId/checkins
 * Get check-ins for a trip
 */
router.get('/:tripId/checkins', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { dayNumber, limit } = req.query;

    const checkins = await tripService.getCheckins(tripId, {
      dayNumber: dayNumber ? parseInt(dayNumber, 10) : null,
      limit: limit ? parseInt(limit, 10) : 50
    });

    res.json({ checkins });

  } catch (error) {
    console.error('Get checkins error:', error);
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

/**
 * POST /api/trip/:tripId/advance-day
 * Advance to the next day
 */
router.post('/:tripId/advance-day', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.userId;

    const newDay = await tripService.advanceDay(tripId, userId);

    if (newDay !== null) {
      res.json({ success: true, currentDay: newDay });
    } else {
      res.status(400).json({ error: 'Could not advance day' });
    }

  } catch (error) {
    console.error('Advance day error:', error);
    res.status(500).json({ error: 'Failed to advance day' });
  }
});

/**
 * POST /api/trip/:tripId/pause
 * Pause the trip
 */
router.post('/:tripId/pause', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.userId;

    const trip = await tripService.pauseTrip(tripId, userId);

    if (trip) {
      res.json({ success: true, trip });
    } else {
      res.status(400).json({ error: 'Could not pause trip' });
    }

  } catch (error) {
    console.error('Pause trip error:', error);
    res.status(500).json({ error: 'Failed to pause trip' });
  }
});

/**
 * POST /api/trip/:tripId/complete
 * Complete the trip
 */
router.post('/:tripId/complete', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.userId;

    const trip = await tripService.completeTrip(tripId, userId);

    if (trip) {
      res.json({ success: true, trip });
    } else {
      res.status(400).json({ error: 'Could not complete trip' });
    }

  } catch (error) {
    console.error('Complete trip error:', error);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
});

/**
 * POST /api/trip/:tripId/stats
 * Update trip statistics
 */
router.post('/:tripId/stats', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const statsUpdate = req.body;

    const stats = await tripService.updateStats(tripId, statsUpdate);

    res.json({ success: true, stats });

  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

module.exports = router;
