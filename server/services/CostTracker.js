/**
 * CostTracker Service
 *
 * Tracks API costs and timing for the entire user journey.
 * Enforces budget limits per session to keep costs under control.
 *
 * Google Places API Pricing (as of 2024):
 * - Text Search: $0.032 per request
 * - Nearby Search: $0.032 per request
 * - Place Details: $0.017 per request (Basic), $0.025 (Contact), $0.035 (Atmosphere)
 * - Place Photos: $0.007 per request
 * - Geocoding: $0.005 per request
 * - Distance Matrix: $0.005 per element (up to $0.01 for advanced)
 *
 * Budget target: €3 per user journey (~$3.25 USD)
 */

// API costs in USD
const API_COSTS = {
  // Google Places
  'google.places.textSearch': 0.032,
  'google.places.nearbySearch': 0.032,
  'google.places.details.basic': 0.017,
  'google.places.details.contact': 0.025,
  'google.places.details.atmosphere': 0.035,
  'google.places.photo': 0.007,
  'google.places.autocomplete': 0.00283, // per session

  // Google Maps
  'google.maps.geocoding': 0.005,
  'google.maps.distanceMatrix': 0.005,
  'google.maps.directions': 0.005,

  // Anthropic Claude
  'claude.sonnet.input': 0.003 / 1000,   // $3 per 1M tokens = $0.003 per 1K
  'claude.sonnet.output': 0.015 / 1000,  // $15 per 1M tokens = $0.015 per 1K
  'claude.haiku.input': 0.00025 / 1000,
  'claude.haiku.output': 0.00125 / 1000,

  // Free APIs (for tracking purposes)
  'wikipedia.search': 0,
  'wikipedia.image': 0,
  'wikimedia.commons': 0,
  'unsplash.search': 0,
};

// Budget limit in USD (€3 ≈ $3.25)
const DEFAULT_BUDGET_USD = 3.25;

class CostTracker {
  constructor(db = null) {
    this.db = db;
    this.sessions = new Map(); // sessionId -> session data
    this.globalStats = {
      totalCost: 0,
      totalRequests: 0,
      byApiType: {},
      startTime: Date.now(),
    };
  }

  /**
   * Initialize or get a session
   */
  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        startTime: Date.now(),
        budget: DEFAULT_BUDGET_USD,
        spent: 0,
        requests: [],
        phases: {},
        currentPhase: null,
        phaseStartTime: null,
        blocked: false,
        blockedReason: null,
      });
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Start a phase (route_discovery, planning, discover, etc.)
   */
  startPhase(sessionId, phaseName) {
    const session = this.getSession(sessionId);

    // End previous phase if exists
    if (session.currentPhase && session.phaseStartTime) {
      this.endPhase(sessionId);
    }

    session.currentPhase = phaseName;
    session.phaseStartTime = Date.now();

    if (!session.phases[phaseName]) {
      session.phases[phaseName] = {
        name: phaseName,
        startTime: Date.now(),
        endTime: null,
        duration: 0,
        cost: 0,
        requests: [],
        cacheHits: 0,
        cacheMisses: 0,
      };
    } else {
      // Phase being re-entered
      session.phases[phaseName].startTime = Date.now();
    }

    console.log(`[CostTracker] Session ${sessionId} started phase: ${phaseName}`);
    return session.phases[phaseName];
  }

  /**
   * End the current phase
   */
  endPhase(sessionId) {
    const session = this.getSession(sessionId);

    if (session.currentPhase && session.phaseStartTime) {
      const phase = session.phases[session.currentPhase];
      phase.endTime = Date.now();
      phase.duration += (phase.endTime - session.phaseStartTime);

      console.log(`[CostTracker] Session ${sessionId} ended phase: ${session.currentPhase} (${phase.duration}ms, $${phase.cost.toFixed(4)})`);
    }

    session.currentPhase = null;
    session.phaseStartTime = null;
  }

  /**
   * Check if session has budget remaining
   */
  hasBudget(sessionId, estimatedCost = 0) {
    const session = this.getSession(sessionId);
    return !session.blocked && (session.spent + estimatedCost) <= session.budget;
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(sessionId) {
    const session = this.getSession(sessionId);
    return Math.max(0, session.budget - session.spent);
  }

  /**
   * Track an API call
   */
  trackRequest(sessionId, apiType, options = {}) {
    const session = this.getSession(sessionId);
    const cost = API_COSTS[apiType] || 0;
    const isCacheHit = options.cacheHit || false;

    // Don't charge for cache hits
    const actualCost = isCacheHit ? 0 : cost;

    // Check budget before allowing
    if (!isCacheHit && session.spent + actualCost > session.budget) {
      session.blocked = true;
      session.blockedReason = `Budget exceeded: $${session.spent.toFixed(4)} / $${session.budget.toFixed(2)}`;
      console.warn(`[CostTracker] Session ${sessionId} BLOCKED: ${session.blockedReason}`);
      return {
        allowed: false,
        reason: session.blockedReason,
        spent: session.spent,
        budget: session.budget,
      };
    }

    const request = {
      timestamp: Date.now(),
      apiType,
      cost: actualCost,
      cacheHit: isCacheHit,
      phase: session.currentPhase,
      details: options.details || null,
    };

    session.requests.push(request);
    session.spent += actualCost;

    // Track in current phase
    if (session.currentPhase && session.phases[session.currentPhase]) {
      const phase = session.phases[session.currentPhase];
      phase.requests.push(request);
      phase.cost += actualCost;
      if (isCacheHit) {
        phase.cacheHits++;
      } else {
        phase.cacheMisses++;
      }
    }

    // Update global stats
    this.globalStats.totalCost += actualCost;
    this.globalStats.totalRequests++;
    if (!this.globalStats.byApiType[apiType]) {
      this.globalStats.byApiType[apiType] = { count: 0, cost: 0, cacheHits: 0 };
    }
    this.globalStats.byApiType[apiType].count++;
    this.globalStats.byApiType[apiType].cost += actualCost;
    if (isCacheHit) {
      this.globalStats.byApiType[apiType].cacheHits++;
    }

    return {
      allowed: true,
      cost: actualCost,
      spent: session.spent,
      remaining: session.budget - session.spent,
      cacheHit: isCacheHit,
    };
  }

  /**
   * Get session summary
   */
  getSessionSummary(sessionId) {
    const session = this.getSession(sessionId);

    // Calculate phase summaries
    const phaseSummaries = {};
    for (const [name, phase] of Object.entries(session.phases)) {
      phaseSummaries[name] = {
        duration: phase.duration,
        durationFormatted: this.formatDuration(phase.duration),
        cost: phase.cost,
        costFormatted: `$${phase.cost.toFixed(4)}`,
        requests: phase.requests.length,
        cacheHits: phase.cacheHits,
        cacheMisses: phase.cacheMisses,
        cacheHitRate: phase.requests.length > 0
          ? ((phase.cacheHits / phase.requests.length) * 100).toFixed(1) + '%'
          : 'N/A',
      };
    }

    // API breakdown
    const apiBreakdown = {};
    for (const req of session.requests) {
      if (!apiBreakdown[req.apiType]) {
        apiBreakdown[req.apiType] = { count: 0, cost: 0, cacheHits: 0 };
      }
      apiBreakdown[req.apiType].count++;
      apiBreakdown[req.apiType].cost += req.cost;
      if (req.cacheHit) {
        apiBreakdown[req.apiType].cacheHits++;
      }
    }

    const totalDuration = Date.now() - session.startTime;

    return {
      sessionId,
      startTime: new Date(session.startTime).toISOString(),
      totalDuration,
      totalDurationFormatted: this.formatDuration(totalDuration),
      budget: session.budget,
      spent: session.spent,
      spentFormatted: `$${session.spent.toFixed(4)}`,
      remaining: session.budget - session.spent,
      remainingFormatted: `$${(session.budget - session.spent).toFixed(4)}`,
      budgetUsedPercent: ((session.spent / session.budget) * 100).toFixed(1) + '%',
      blocked: session.blocked,
      blockedReason: session.blockedReason,
      totalRequests: session.requests.length,
      phases: phaseSummaries,
      apiBreakdown,
      costByPhase: Object.entries(phaseSummaries).map(([name, data]) => ({
        phase: name,
        cost: data.cost,
        percent: session.spent > 0 ? ((data.cost / session.spent) * 100).toFixed(1) + '%' : '0%',
      })),
    };
  }

  /**
   * Get global statistics
   */
  getGlobalStats() {
    const uptime = Date.now() - this.globalStats.startTime;
    const sessionCount = this.sessions.size;

    // Calculate averages
    let totalSessionCost = 0;
    let totalSessionDuration = 0;
    let blockedSessions = 0;

    for (const session of this.sessions.values()) {
      totalSessionCost += session.spent;
      totalSessionDuration += (Date.now() - session.startTime);
      if (session.blocked) blockedSessions++;
    }

    return {
      uptime,
      uptimeFormatted: this.formatDuration(uptime),
      totalSessions: sessionCount,
      activeSessions: Array.from(this.sessions.values()).filter(s => !s.blocked).length,
      blockedSessions,
      totalCost: this.globalStats.totalCost,
      totalCostFormatted: `$${this.globalStats.totalCost.toFixed(4)}`,
      totalRequests: this.globalStats.totalRequests,
      avgCostPerSession: sessionCount > 0 ? totalSessionCost / sessionCount : 0,
      avgCostPerSessionFormatted: sessionCount > 0 ? `$${(totalSessionCost / sessionCount).toFixed(4)}` : '$0',
      avgDurationPerSession: sessionCount > 0 ? totalSessionDuration / sessionCount : 0,
      avgDurationPerSessionFormatted: sessionCount > 0 ? this.formatDuration(totalSessionDuration / sessionCount) : '0s',
      byApiType: Object.entries(this.globalStats.byApiType).map(([type, data]) => ({
        apiType: type,
        count: data.count,
        cost: data.cost,
        costFormatted: `$${data.cost.toFixed(4)}`,
        cacheHits: data.cacheHits,
        cacheHitRate: data.count > 0 ? ((data.cacheHits / data.count) * 100).toFixed(1) + '%' : 'N/A',
      })),
    };
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  /**
   * Save session to database for persistence
   */
  async saveSessionToDb(sessionId) {
    if (!this.db) return;

    const session = this.getSession(sessionId);
    const summary = this.getSessionSummary(sessionId);

    try {
      await this.db.query(
        `INSERT INTO cost_tracking_sessions
         (session_id, start_time, total_cost, total_requests, phases, api_breakdown, blocked, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (session_id)
         DO UPDATE SET
           total_cost = $3,
           total_requests = $4,
           phases = $5,
           api_breakdown = $6,
           blocked = $7,
           updated_at = NOW()`,
        [
          sessionId,
          new Date(session.startTime),
          session.spent,
          session.requests.length,
          JSON.stringify(summary.phases),
          JSON.stringify(summary.apiBreakdown),
          session.blocked,
        ]
      );
    } catch (error) {
      console.warn('[CostTracker] Failed to save session to DB:', error.message);
    }
  }

  /**
   * Clear old sessions from memory (keep last 1000)
   */
  cleanup() {
    if (this.sessions.size <= 1000) return;

    const sessions = Array.from(this.sessions.entries());
    sessions.sort((a, b) => a[1].startTime - b[1].startTime);

    const toRemove = sessions.slice(0, sessions.length - 1000);
    for (const [id] of toRemove) {
      this.sessions.delete(id);
    }

    console.log(`[CostTracker] Cleaned up ${toRemove.length} old sessions`);
  }
}

// Singleton instance
let instance = null;

function getCostTracker(db = null) {
  if (!instance) {
    instance = new CostTracker(db);
  } else if (db && !instance.db) {
    instance.db = db;
  }
  return instance;
}

module.exports = { CostTracker, getCostTracker, API_COSTS, DEFAULT_BUDGET_USD };
