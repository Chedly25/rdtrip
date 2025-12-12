/**
 * City Intelligence API Routes
 *
 * Provides SSE streaming endpoints for real-time city intelligence gathering.
 * Integrates with the Orchestrator for the full agent workflow.
 */

const express = require('express');
const router = express.Router();
const Orchestrator = require('../services/cityIntelligence/Orchestrator');
const SharedMemory = require('../services/cityIntelligence/SharedMemory');

// Track active SSE connections
const activeConnections = new Map();

/**
 * POST /api/city-intelligence/start
 *
 * Start intelligence gathering for a set of cities.
 * Returns an SSE stream of events as agents work.
 *
 * Request body:
 * {
 *   cities: CityData[],
 *   nights: { [cityId]: number },
 *   preferences: UserPreferences,
 *   trip: TripContext,
 *   sessionId?: string
 * }
 */
router.post('/start', async (req, res) => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 City Intelligence API - /start                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const { cities, nights, preferences, trip, sessionId: providedSessionId } = req.body;

  // Validate request
  if (!cities || !Array.isArray(cities) || cities.length === 0) {
    return res.status(400).json({ error: 'cities array is required' });
  }

  if (!nights || typeof nights !== 'object') {
    return res.status(400).json({ error: 'nights object is required' });
  }

  if (!trip) {
    return res.status(400).json({ error: 'trip context is required' });
  }

  try {
    // Create or use existing session
    const userId = req.user?.id || null;
    const sessionId = providedSessionId || SharedMemory.createSession(userId);

    console.log(`📝 Session: ${sessionId}`);
    console.log(`🏙️  Cities: ${cities.map(c => c.name).join(', ')}`);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

    // Disable socket timeout for long-running connections
    if (req.socket) {
      req.socket.setTimeout(0);
    }

    res.flushHeaders();

    // Track this connection
    activeConnections.set(sessionId, res);

    // Send initial connected event
    sendSSE(res, {
      type: 'connected',
      timestamp: new Date().toISOString(),
      sessionId
    });

    // Set up heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
        if (typeof res.flush === 'function') res.flush();
      } catch (error) {
        clearInterval(heartbeatInterval);
      }
    }, 15000);

    // Handle client disconnect
    req.on('close', () => {
      console.log(`🔌 Client disconnected: ${sessionId}`);
      clearInterval(heartbeatInterval);
      activeConnections.delete(sessionId);
    });

    // Event handler for SSE streaming
    const onEvent = (event) => {
      sendSSE(res, event);
    };

    // Start intelligence gathering
    await Orchestrator.startIntelligence({
      sessionId,
      cities,
      nights,
      preferences: preferences || {},
      trip,
      onEvent
    });

    // Send done event and close
    sendSSE(res, { type: 'done', timestamp: new Date().toISOString() });

    // Clean up
    clearInterval(heartbeatInterval);
    activeConnections.delete(sessionId);
    res.end();

  } catch (error) {
    console.error('❌ City Intelligence API error:', error);

    // Try to send error event if connection still open
    try {
      sendSSE(res, {
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        recoverable: false
      });
    } catch (e) {
      // Connection may be closed
    }

    res.end();
  }
});

/**
 * GET /api/city-intelligence/status/:sessionId
 *
 * Get current status of intelligence gathering session.
 */
router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  const session = SharedMemory.getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const orchestratorState = SharedMemory.getOrchestratorState(sessionId);
  const allIntelligence = SharedMemory.getAllCityIntelligence(sessionId);
  const overallProgress = SharedMemory.calculateOverallProgress(sessionId);

  const cities = allIntelligence.map(intel => ({
    cityId: intel.cityId,
    cityName: intel.city.name,
    status: intel.status,
    quality: intel.quality,
    iterations: intel.iterations,
    agentStates: Object.fromEntries(
      Array.from(intel.agentStates.entries()).map(([name, state]) => [
        name,
        {
          status: state.status,
          progress: state.progress,
          error: state.error
        }
      ])
    )
  }));

  res.json({
    sessionId,
    status: orchestratorState?.currentPhase === 'complete' ? 'complete' :
            orchestratorState?.currentPhase === 'idle' ? 'idle' : 'processing',
    phase: orchestratorState?.currentPhase,
    currentCityId: orchestratorState?.currentCityId,
    cities,
    overallProgress
  });
});

/**
 * GET /api/city-intelligence/city/:sessionId/:cityId
 *
 * Get intelligence for a specific city.
 */
router.get('/city/:sessionId/:cityId', (req, res) => {
  const { sessionId, cityId } = req.params;

  const intelligence = SharedMemory.getCityIntelligence(sessionId, cityId);
  if (!intelligence) {
    return res.status(404).json({ error: 'City intelligence not found' });
  }

  // Serialize for response
  res.json({
    cityId: intelligence.cityId,
    city: intelligence.city,
    quality: intelligence.quality,
    iterations: intelligence.iterations,
    status: intelligence.status,
    story: intelligence.story,
    timeBlocks: intelligence.timeBlocks,
    clusters: intelligence.clusters,
    matchScore: intelligence.matchScore,
    hiddenGems: intelligence.hiddenGems,
    logistics: intelligence.logistics,
    weather: intelligence.weather,
    photoSpots: intelligence.photoSpots,
    generatedAt: intelligence.createdAt,
    lastUpdatedAt: intelligence.lastUpdatedAt
  });
});

/**
 * POST /api/city-intelligence/cancel/:sessionId
 *
 * Cancel ongoing intelligence gathering.
 */
router.post('/cancel/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  const connection = activeConnections.get(sessionId);
  if (connection) {
    sendSSE(connection, {
      type: 'cancelled',
      timestamp: new Date().toISOString()
    });
    connection.end();
    activeConnections.delete(sessionId);
  }

  Orchestrator.cancel(sessionId);
  SharedMemory.deleteSession(sessionId);

  res.json({ success: true, message: 'Intelligence gathering cancelled' });
});

/**
 * GET /api/city-intelligence/insights/:sessionId
 *
 * Get cross-city insights for a session.
 */
router.get('/insights/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  const insights = SharedMemory.getCrossCityInsights(sessionId);
  if (!insights) {
    return res.status(404).json({ error: 'Insights not found' });
  }

  res.json(insights);
});

/**
 * Helper: Send SSE event
 */
function sendSSE(res, data) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === 'function') {
      res.flush();
    }
  } catch (error) {
    console.error('Error sending SSE:', error.message);
  }
}

module.exports = router;
