/**
 * Trip API Routes
 * Phase 2: Trip in Progress Mode
 *
 * Endpoints for real-time trip tracking, check-ins, and location updates
 */

const express = require('express');
const router = express.Router();
const TripService = require('../services/TripService');
const { authenticate } = require('../../middleware/auth');

const tripService = new TripService();

// Use proper JWT authentication middleware
// Wrapper to also set req.userId for backward compatibility
const authMiddleware = (req, res, next) => {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    // Set userId from the authenticated user for backward compatibility
    if (req.user) {
      req.userId = req.user.id;
    }
    next();
  });
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

// ============================================================
// LIVING COMPANION ENDPOINTS - Phase 4
// Serendipity, Smart Hints, Moments, Narratives
// ============================================================

// Lazy-load SerendipityAgent to avoid circular dependencies
let serendipityAgent = null;
const getSerendipityAgent = () => {
  if (!serendipityAgent) {
    const SerendipityAgent = require('../services/SerendipityAgent');
    const GooglePlacesService = require('../services/googlePlacesService');
    const { Pool } = require('pg');

    const db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const googlePlaces = new GooglePlacesService(process.env.GOOGLE_PLACES_API_KEY, db);

    // Perplexity service (optional)
    let perplexityService = null;
    try {
      const PerplexityAIService = require('../../src/domain/services/perplexityAI.service');
      const PerplexityClient = require('../../src/infrastructure/perplexity/perplexityClient');
      const perplexityClient = new PerplexityClient(process.env.PERPLEXITY_API_KEY);
      perplexityService = new PerplexityAIService(perplexityClient);
    } catch (err) {
      console.warn('Perplexity service not available:', err.message);
    }

    serendipityAgent = new SerendipityAgent(googlePlaces, perplexityService, null);
  }
  return serendipityAgent;
};

/**
 * GET /api/trip/:tripId/serendipity
 * Discover nearby gems and hidden treasures
 */
router.get('/:tripId/serendipity', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { lat, lng, radius = 500 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location (lat, lng) required' });
    }

    const agent = getSerendipityAgent();
    const discoveries = await agent.discoverNearby({
      tripId,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseInt(radius, 10),
      userId: req.userId
    });

    res.json({ discoveries });

  } catch (error) {
    console.error('Serendipity error:', error);
    res.status(500).json({ error: 'Failed to discover nearby gems' });
  }
});

/**
 * GET /api/trip/:tripId/smart-hints
 * Get contextual time hints for current activity
 */
router.get('/:tripId/smart-hints', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { activityId, currentTime } = req.query;

    if (!activityId) {
      return res.status(400).json({ error: 'Activity ID required' });
    }

    const agent = getSerendipityAgent();
    const result = await agent.getSmartHints({
      tripId,
      activityId,
      currentTime,
      userId: req.userId
    });

    res.json(result);

  } catch (error) {
    console.error('Smart hints error:', error);
    res.status(500).json({ error: 'Failed to get smart hints' });
  }
});

/**
 * POST /api/trip/:tripId/moment
 * Record a trip moment (enhanced check-in with emotional context)
 */
router.post('/:tripId/moment', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      activityId,
      activityName,
      momentType,
      note,
      photo,
      rating,
      coordinates,
      dayNumber
    } = req.body;

    if (!activityName) {
      return res.status(400).json({ error: 'Activity name required' });
    }

    const agent = getSerendipityAgent();
    const moment = await agent.recordMoment(tripId, req.userId, {
      activityId,
      activityName,
      momentType: momentType || 'completed',
      note,
      photo,
      rating,
      coordinates,
      dayNumber: dayNumber || 1
    });

    res.json({ success: true, moment });

  } catch (error) {
    console.error('Record moment error:', error);
    res.status(500).json({ error: 'Failed to record moment' });
  }
});

/**
 * GET /api/trip/:tripId/moments
 * Get all moments for a trip
 */
router.get('/:tripId/moments', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { dayNumber } = req.query;

    const { Pool } = require('pg');
    const db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    let query = `SELECT * FROM trip_moments WHERE trip_id = $1`;
    const params = [tripId];

    if (dayNumber) {
      query += ` AND day_number = $2`;
      params.push(parseInt(dayNumber, 10));
    }

    query += ` ORDER BY recorded_at ASC`;

    const result = await db.query(query, params);

    res.json({ moments: result.rows });

  } catch (error) {
    console.error('Get moments error:', error);
    res.status(500).json({ error: 'Failed to fetch moments' });
  }
});

/**
 * GET /api/trip/:tripId/narrative
 * Get the evolving trip narrative for a day
 */
router.get('/:tripId/narrative', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { dayNumber } = req.query;

    const agent = getSerendipityAgent();
    const narrative = await agent.getTripNarrative(
      tripId,
      dayNumber ? parseInt(dayNumber, 10) : 1
    );

    res.json({ narrative });

  } catch (error) {
    console.error('Get narrative error:', error);
    res.status(500).json({ error: 'Failed to fetch narrative' });
  }
});

/**
 * GET /api/trip/:tripId/weather-alternatives
 * Get weather-aware activity alternatives
 */
router.get('/:tripId/weather-alternatives', authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { activityId, weatherCondition } = req.query;

    if (!activityId) {
      return res.status(400).json({ error: 'Activity ID required' });
    }

    const agent = getSerendipityAgent();
    const result = await agent.findWeatherAlternatives({
      tripId,
      activityId,
      weatherCondition: weatherCondition || 'rain',
      userId: req.userId
    });

    res.json(result);

  } catch (error) {
    console.error('Weather alternatives error:', error);
    res.status(500).json({ error: 'Failed to find alternatives' });
  }
});

module.exports = router;
