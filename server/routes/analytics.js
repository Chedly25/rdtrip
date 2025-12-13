/**
 * Analytics Routes
 *
 * Endpoints for viewing cost and timing analytics.
 * Use these to understand API usage patterns and optimize costs.
 */

const express = require('express');
const router = express.Router();
const { getCostTracker } = require('../services/CostTracker');

/**
 * GET /api/analytics/session/:sessionId
 * Get detailed analytics for a specific session
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const tracker = getCostTracker();
    const summary = tracker.getSessionSummary(sessionId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/global
 * Get global statistics across all sessions
 */
router.get('/global', (req, res) => {
  try {
    const tracker = getCostTracker();
    const stats = tracker.getGlobalStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/budget/:sessionId
 * Quick check of remaining budget for a session
 */
router.get('/budget/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const tracker = getCostTracker();

    const remaining = tracker.getRemainingBudget(sessionId);
    const hasBudget = tracker.hasBudget(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        remaining,
        remainingFormatted: `$${remaining.toFixed(4)}`,
        hasBudget,
        budgetLimitUSD: 3.25,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analytics/phase/start
 * Start tracking a phase
 */
router.post('/phase/start', (req, res) => {
  try {
    const { sessionId, phaseName } = req.body;

    if (!sessionId || !phaseName) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and phaseName are required',
      });
    }

    const tracker = getCostTracker();
    tracker.startPhase(sessionId, phaseName);

    res.json({
      success: true,
      message: `Phase ${phaseName} started for session ${sessionId}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analytics/phase/end
 * End tracking a phase
 */
router.post('/phase/end', (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required',
      });
    }

    const tracker = getCostTracker();
    tracker.endPhase(sessionId);

    const summary = tracker.getSessionSummary(sessionId);

    res.json({
      success: true,
      message: 'Phase ended',
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/costs
 * Get the cost table for all API types
 */
router.get('/costs', (req, res) => {
  const { API_COSTS, DEFAULT_BUDGET_USD } = require('../services/CostTracker');

  const costTable = Object.entries(API_COSTS).map(([apiType, cost]) => ({
    apiType,
    costUSD: cost,
    costFormatted: cost > 0 ? `$${cost.toFixed(5)}` : 'FREE',
    maxCallsPerBudget: cost > 0 ? Math.floor(DEFAULT_BUDGET_USD / cost) : 'Unlimited',
  }));

  res.json({
    success: true,
    budgetLimitUSD: DEFAULT_BUDGET_USD,
    budgetLimitEUR: (DEFAULT_BUDGET_USD / 1.08).toFixed(2), // Approximate EUR
    costs: costTable,
    mostExpensive: costTable.filter(c => c.costUSD > 0).sort((a, b) => b.costUSD - a.costUSD).slice(0, 5),
    recommendations: [
      'Prefer Wikipedia/Wikimedia for images (FREE)',
      'Cache all Google Places responses aggressively',
      'Use Claude to generate suggestions instead of Place Search',
      'Lazy-load photos only when user scrolls to them',
      'Batch Place Details calls when possible',
    ],
  });
});

/**
 * GET /api/analytics/dashboard
 * Get a complete dashboard view
 */
router.get('/dashboard', (req, res) => {
  try {
    const tracker = getCostTracker();
    const globalStats = tracker.getGlobalStats();
    const { API_COSTS, DEFAULT_BUDGET_USD } = require('../services/CostTracker');

    // Get recent sessions (last 10)
    const allSessions = Array.from(tracker.sessions.entries());
    const recentSessions = allSessions
      .sort((a, b) => b[1].startTime - a[1].startTime)
      .slice(0, 10)
      .map(([id]) => tracker.getSessionSummary(id));

    // Calculate cost distribution
    const costDistribution = {};
    for (const [type, data] of Object.entries(globalStats.byApiType)) {
      const category = type.split('.')[0] + '.' + type.split('.')[1];
      if (!costDistribution[category]) {
        costDistribution[category] = 0;
      }
      costDistribution[category] += data.cost;
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalSessions: globalStats.totalSessions,
        totalCost: globalStats.totalCostFormatted,
        avgCostPerSession: globalStats.avgCostPerSessionFormatted,
        avgDurationPerSession: globalStats.avgDurationPerSessionFormatted,
        budgetLimitPerSession: `$${DEFAULT_BUDGET_USD}`,
        blockedSessions: globalStats.blockedSessions,
      },
      costDistribution,
      apiBreakdown: globalStats.byApiType,
      recentSessions: recentSessions.map(s => ({
        sessionId: s.sessionId,
        duration: s.totalDurationFormatted,
        cost: s.spentFormatted,
        budgetUsed: s.budgetUsedPercent,
        blocked: s.blocked,
        phases: Object.keys(s.phases),
      })),
      alerts: [
        ...(globalStats.blockedSessions > 0
          ? [`${globalStats.blockedSessions} sessions exceeded budget limit`]
          : []),
        ...(globalStats.avgCostPerSession > DEFAULT_BUDGET_USD * 0.8
          ? ['Average session cost is near budget limit']
          : []),
      ],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
