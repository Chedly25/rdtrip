/**
 * Discovery API Routes
 *
 * Voyager-powered conversational route discovery.
 * Supports SSE streaming for real-time agent responses.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const VoyagerAgent = require('../agents/discovery/VoyagerAgent');
const GooglePlacesService = require('../services/googlePlacesService');
const { DiscoveryTriggerService } = require('../services/DiscoveryTriggerService');

// Database pool (injected from main server)
let pool;
let voyagerAgent;
let triggerService;

/**
 * Initialize routes with database pool
 */
function initializeRoutes(dbPool) {
  pool = dbPool;

  // Initialize Google Places if available
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  const googlePlacesService = googleApiKey
    ? new GooglePlacesService(googleApiKey, pool)
    : null;

  // Initialize Voyager agent
  voyagerAgent = new VoyagerAgent(pool, googlePlacesService);

  // Initialize trigger service for proactive suggestions
  triggerService = new DiscoveryTriggerService();

  // Cleanup stale cooldowns periodically
  setInterval(() => triggerService.cleanup(), 300000); // Every 5 minutes

  console.log('🧭 Discovery routes initialized with proactive triggers');

  return router;
}

// ============================================================================
// SSE CHAT ENDPOINT
// ============================================================================

/**
 * POST /api/discovery/chat
 *
 * Send a message to Voyager and receive SSE stream of events.
 * Events: thinking, text, tool_start, tool_complete, route_action, complete, error
 */
router.post('/chat', async (req, res) => {
  const { message, sessionId, routeData, conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Generate session ID if not provided
  const session = sessionId || crypto.randomUUID();

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  // Disable socket timeout
  if (req.socket) {
    req.socket.setTimeout(0);
  }

  res.flushHeaders();

  console.log(`📡 Discovery SSE connected for session ${session}`);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 15000);

  // Event handler
  const onEvent = (eventType, data) => {
    try {
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error('SSE write error:', err);
    }
  };

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    console.log(`📡 Discovery SSE disconnected for session ${session}`);
  });

  try {
    // Process message through Voyager
    const result = await voyagerAgent.handleMessage(message, session, routeData, {
      onEvent,
      conversationHistory
    });

    // Send final message event
    onEvent('message', {
      content: result.response,
      actions: result.actions,
      sessionId: session
    });

  } catch (error) {
    console.error('Discovery chat error:', error);
    onEvent('error', { message: error.message });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

// ============================================================================
// NON-STREAMING CHAT ENDPOINT
// ============================================================================

/**
 * POST /api/discovery/chat/sync
 *
 * Synchronous version for simpler integrations.
 * Returns complete response without streaming.
 */
router.post('/chat/sync', async (req, res) => {
  const { message, sessionId, routeData, conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const session = sessionId || crypto.randomUUID();

  try {
    const result = await voyagerAgent.handleMessage(message, session, routeData, {
      conversationHistory
    });

    res.json({
      success: true,
      sessionId: session,
      response: result.response,
      actions: result.actions,
      toolCalls: result.toolCalls,
      iterations: result.iterations
    });

  } catch (error) {
    console.error('Discovery sync chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// GREETING ENDPOINT
// ============================================================================

/**
 * POST /api/discovery/greeting
 *
 * Get an initial greeting from Voyager for a new or returning session.
 */
router.post('/greeting', async (req, res) => {
  const { sessionId, routeData } = req.body;

  const session = sessionId || crypto.randomUUID();

  try {
    const greeting = await voyagerAgent.generateGreeting(session, routeData);

    res.json({
      success: true,
      sessionId: session,
      ...greeting
    });

  } catch (error) {
    console.error('Discovery greeting error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      // Fallback greeting
      message: "Hello! I'm Voyager. Tell me about the journey you have in mind.",
      fallback: true
    });
  }
});

// ============================================================================
// PROACTIVE SUGGESTIONS ENDPOINT
// ============================================================================

/**
 * POST /api/discovery/proactive
 *
 * Generate a proactive suggestion based on user behavior.
 * Called by frontend when triggers fire.
 * Uses DiscoveryTriggerService for intelligent suggestion generation.
 */
router.post('/proactive', async (req, res) => {
  const { trigger, triggerData, sessionId, routeData, preferences, recentActions } = req.body;

  if (!trigger) {
    return res.status(400).json({ error: 'Trigger is required' });
  }

  const session = sessionId || crypto.randomUUID();

  try {
    // Build context for trigger evaluation
    const context = {
      sessionId: session,
      routeData,
      preferences,
      recentActions
    };

    // Use trigger service for intelligent suggestion generation
    const suggestion = await triggerService.generateSuggestion(
      trigger,
      triggerData || {},
      context
    );

    if (!suggestion.shouldShow) {
      return res.json({
        success: true,
        sessionId: session,
        shouldShow: false,
        trigger
      });
    }

    res.json({
      success: true,
      sessionId: session,
      shouldShow: true,
      message: suggestion.message,
      trigger,
      triggerData,
      quickActions: suggestion.quickActions || buildQuickActions(trigger, triggerData),
      priority: suggestion.priority || getTrigerPriority(trigger)
    });

  } catch (error) {
    console.error('Discovery proactive error:', error);
    res.status(500).json({
      success: false,
      shouldShow: false,
      error: error.message
    });
  }
});

/**
 * POST /api/discovery/trigger/dismiss
 *
 * Record that a suggestion was dismissed.
 */
router.post('/trigger/dismiss', async (req, res) => {
  const { suggestionId, sessionId } = req.body;

  if (!suggestionId || !sessionId) {
    return res.status(400).json({ error: 'suggestionId and sessionId required' });
  }

  triggerService.recordDismissal(suggestionId, sessionId);

  res.json({ success: true });
});

/**
 * POST /api/discovery/preferences/infer
 *
 * Infer user preferences from their behavior.
 */
router.post('/preferences/infer', async (req, res) => {
  const { actions, routeData } = req.body;

  try {
    const preferences = triggerService.inferPreferences(actions || [], routeData);
    const routeAnalysis = triggerService.analyzeRoute(routeData);

    res.json({
      success: true,
      preferences,
      routeAnalysis
    });

  } catch (error) {
    console.error('Preference inference error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Build quick action buttons for proactive suggestions
 */
function buildQuickActions(trigger, data) {
  switch (trigger) {
    case 'city_added':
      return [
        { label: 'Find similar', action: 'search_similar', data },
        { label: 'Show highlights', action: 'get_highlights', data }
      ];

    case 'cities_removed':
      return [
        { label: 'Suggest alternatives', action: 'search_alternatives' },
        { label: 'Analyze route', action: 'analyze_route' }
      ];

    case 'preference_detected':
      return [
        { label: 'Yes, show me more', action: 'search_by_preference', data },
        { label: 'No thanks', action: 'dismiss' }
      ];

    case 'route_imbalance':
      return [
        { label: 'Rebalance for me', action: 'auto_rebalance' },
        { label: 'Tell me more', action: 'explain_issue' }
      ];

    case 'trip_nearly_ready':
      return [
        { label: 'Generate itinerary', action: 'generate_itinerary' },
        { label: 'Keep editing', action: 'dismiss' }
      ];

    default:
      return [
        { label: 'Tell me more', action: 'elaborate' },
        { label: 'Dismiss', action: 'dismiss' }
      ];
  }
}

/**
 * Get priority level for a trigger
 */
function getTrigerPriority(trigger) {
  const priorities = {
    trip_nearly_ready: 'high',
    route_imbalance: 'medium',
    preference_detected: 'medium',
    city_added: 'low',
    cities_removed: 'low',
    idle_exploring: 'low',
    hidden_gem_match: 'medium'
  };
  return priorities[trigger] || 'low';
}

// ============================================================================
// CONVERSATION HISTORY ENDPOINT
// ============================================================================

/**
 * GET /api/discovery/history/:sessionId
 *
 * Get conversation history for a session.
 */
router.get('/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { limit = 20 } = req.query;

  try {
    const history = await voyagerAgent.getConversationHistory(sessionId, parseInt(limit));

    res.json({
      success: true,
      sessionId,
      messages: history,
      count: history.length
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// RECORD ACTION ENDPOINT
// ============================================================================

/**
 * POST /api/discovery/action
 *
 * Record a user action for preference learning.
 * Called by frontend when user interacts with the route.
 */
router.post('/action', async (req, res) => {
  const { sessionId, actionType, data } = req.body;

  if (!sessionId || !actionType) {
    return res.status(400).json({ error: 'sessionId and actionType are required' });
  }

  try {
    // Use context builder to record action
    await voyagerAgent.contextBuilder.recordAction(sessionId, actionType, data || {});

    res.json({
      success: true,
      recorded: { actionType, data }
    });

  } catch (error) {
    console.error('Record action error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/discovery/health
 *
 * Check if discovery service is healthy.
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'discovery',
    agent: voyagerAgent ? 'ready' : 'not initialized',
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  router,
  initializeRoutes
};
