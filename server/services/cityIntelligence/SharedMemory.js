/**
 * SharedMemory - Cross-Agent Context Store
 *
 * Maintains shared state for the City Intelligence Agent system.
 * All agents read from and write to this shared context.
 *
 * Features:
 * - In-memory store with session management
 * - City intelligence state per city
 * - Cross-agent messaging
 * - Orchestrator state tracking
 */

const crypto = require('crypto');
const EventEmitter = require('events');

// Use Node's built-in crypto for UUID generation (compatible with CommonJS)
const uuidv4 = () => crypto.randomUUID();

class SharedMemory extends EventEmitter {
  constructor() {
    super();

    // Store sessions by sessionId
    this.sessions = new Map();

    // Session timeout (30 minutes)
    this.sessionTimeoutMs = 30 * 60 * 1000;

    // Cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanupStaleSessions(), 60000);

    console.log('🧠 SharedMemory initialized');
  }

  // ===========================================================================
  // Session Management
  // ===========================================================================

  /**
   * Create a new session
   */
  createSession(userId) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      startedAt: new Date(),
      lastActivityAt: new Date(),

      // Trip context
      trip: null,

      // User preferences
      preferences: {
        explicit: {},
        inferred: {
          favouritePlaceTypes: {},
          averageNightsPerCity: 1,
          prefersHiddenGems: false,
          interestedCityIds: []
        },
        combined: {}
      },

      // City intelligence per city
      cityIntelligence: new Map(),

      // Cross-city insights
      crossCityInsights: {
        themes: [],
        varietyScore: 0,
        paceScore: 0,
        recommendations: []
      },

      // Orchestrator state
      orchestrator: {
        currentPhase: 'idle',
        currentCityId: null,
        currentPlan: null,
        executionLog: [],
        reflections: []
      },

      // Agent messages
      agentMessages: []
    };

    this.sessions.set(sessionId, session);
    console.log(`📝 Created session: ${sessionId} for user: ${userId || 'anonymous'}`);

    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date();
    }
    return session;
  }

  /**
   * Delete session
   */
  deleteSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      console.log(`🗑️ Deleted session: ${sessionId}`);
    }
    return deleted;
  }

  /**
   * Cleanup stale sessions
   */
  cleanupStaleSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivityAt.getTime() > this.sessionTimeoutMs) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} stale sessions`);
    }
  }

  // ===========================================================================
  // Trip Context
  // ===========================================================================

  /**
   * Set trip context for session
   */
  setTripContext(sessionId, tripContext) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.trip = {
      origin: tripContext.origin,
      destination: tripContext.destination,
      startDate: tripContext.startDate ? new Date(tripContext.startDate) : null,
      endDate: tripContext.endDate ? new Date(tripContext.endDate) : null,
      totalNights: tripContext.totalNights,
      travellerType: tripContext.travellerType,
      transportMode: tripContext.transportMode || 'car'
    };

    console.log(`🗺️ Set trip context: ${session.trip.origin.name} → ${session.trip.destination.name}`);
    this.emit('tripContextUpdated', { sessionId, trip: session.trip });
  }

  /**
   * Get trip context
   */
  getTripContext(sessionId) {
    const session = this.getSession(sessionId);
    return session?.trip || null;
  }

  // ===========================================================================
  // User Preferences
  // ===========================================================================

  /**
   * Set explicit user preferences
   */
  setExplicitPreferences(sessionId, preferences) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.preferences.explicit = { ...preferences };
    this.mergePreferences(sessionId);

    console.log(`⚙️ Set explicit preferences for session: ${sessionId}`);
    this.emit('preferencesUpdated', { sessionId, preferences: session.preferences });
  }

  /**
   * Update inferred preferences
   */
  updateInferredPreferences(sessionId, updates) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.preferences.inferred = {
      ...session.preferences.inferred,
      ...updates
    };
    this.mergePreferences(sessionId);

    this.emit('preferencesUpdated', { sessionId, preferences: session.preferences });
  }

  /**
   * Merge explicit and inferred preferences
   */
  mergePreferences(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return;

    // Explicit preferences take priority
    session.preferences.combined = {
      ...session.preferences.explicit,
      inferred: session.preferences.inferred
    };
  }

  /**
   * Get merged preferences
   */
  getPreferences(sessionId) {
    const session = this.getSession(sessionId);
    return session?.preferences.combined || {};
  }

  // ===========================================================================
  // City Intelligence
  // ===========================================================================

  /**
   * Initialize city intelligence for a city
   */
  initializeCityIntelligence(sessionId, city, nights) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const intelligence = {
      cityId: city.id,
      city: {
        id: city.id,
        name: city.name,
        country: city.country,
        coordinates: city.coordinates,
        imageUrl: city.imageUrl,
        description: city.description
      },
      nights,
      status: 'pending',
      quality: 0,
      iterations: 0,

      // Agent outputs (will be populated)
      story: null,
      timeBlocks: null,
      clusters: null,
      matchScore: null,
      hiddenGems: null,
      logistics: null,
      weather: null,
      photoSpots: null,

      // Agent execution states
      agentStates: new Map(),

      // Timestamps
      createdAt: new Date(),
      lastUpdatedAt: new Date()
    };

    session.cityIntelligence.set(city.id, intelligence);
    console.log(`🏙️ Initialized intelligence for: ${city.name}`);

    this.emit('cityIntelligenceInitialized', { sessionId, cityId: city.id, intelligence });
    return intelligence;
  }

  /**
   * Get city intelligence
   */
  getCityIntelligence(sessionId, cityId) {
    const session = this.getSession(sessionId);
    return session?.cityIntelligence.get(cityId) || null;
  }

  /**
   * Get all city intelligence for session
   */
  getAllCityIntelligence(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return [];

    return Array.from(session.cityIntelligence.values());
  }

  /**
   * Update city intelligence status
   */
  updateCityStatus(sessionId, cityId, status) {
    const session = this.getSession(sessionId);
    const intelligence = session?.cityIntelligence.get(cityId);

    if (intelligence) {
      intelligence.status = status;
      intelligence.lastUpdatedAt = new Date();

      this.emit('cityStatusUpdated', { sessionId, cityId, status });
    }
  }

  /**
   * Update city intelligence quality score
   */
  updateCityQuality(sessionId, cityId, quality, iterations) {
    const session = this.getSession(sessionId);
    const intelligence = session?.cityIntelligence.get(cityId);

    if (intelligence) {
      intelligence.quality = quality;
      intelligence.iterations = iterations;
      intelligence.lastUpdatedAt = new Date();

      this.emit('cityQualityUpdated', { sessionId, cityId, quality, iterations });
    }
  }

  /**
   * Set agent output for a city
   */
  setAgentOutput(sessionId, cityId, agentName, output) {
    const session = this.getSession(sessionId);
    const intelligence = session?.cityIntelligence.get(cityId);

    if (!intelligence) {
      console.warn(`City intelligence not found: ${cityId}`);
      return;
    }

    // Map agent name to output field
    const outputFieldMap = {
      'StoryAgent': 'story',
      'TimeAgent': 'timeBlocks',
      'ClusterAgent': 'clusters',
      'PreferenceAgent': 'matchScore',
      'GemsAgent': 'hiddenGems',
      'LogisticsAgent': 'logistics',
      'WeatherAgent': 'weather',
      'PhotoAgent': 'photoSpots'
    };

    const field = outputFieldMap[agentName];
    if (field && output.success) {
      intelligence[field] = output.data;
      intelligence.lastUpdatedAt = new Date();

      console.log(`✅ Set ${agentName} output for ${intelligence.city.name}`);
      this.emit('agentOutputSet', { sessionId, cityId, agentName, output });
    }
  }

  // ===========================================================================
  // Agent State Tracking
  // ===========================================================================

  /**
   * Initialize agent state
   */
  initializeAgentState(sessionId, cityId, agentName) {
    const session = this.getSession(sessionId);
    const intelligence = session?.cityIntelligence.get(cityId);

    if (!intelligence) {
      console.warn(`City intelligence not found: ${cityId}`);
      return null;
    }

    const state = {
      agentName,
      status: 'pending',
      startTime: null,
      endTime: null,
      progress: 0,
      output: null,
      error: null
    };

    intelligence.agentStates.set(agentName, state);
    return state;
  }

  /**
   * Update agent state
   */
  updateAgentState(sessionId, cityId, agentName, updates) {
    const session = this.getSession(sessionId);
    const intelligence = session?.cityIntelligence.get(cityId);
    const state = intelligence?.agentStates.get(agentName);

    if (state) {
      Object.assign(state, updates);

      if (updates.status === 'running' && !state.startTime) {
        state.startTime = new Date();
      }
      if (updates.status === 'completed' || updates.status === 'failed') {
        state.endTime = new Date();
      }

      this.emit('agentStateUpdated', { sessionId, cityId, agentName, state });
    }
  }

  /**
   * Get agent state
   */
  getAgentState(sessionId, cityId, agentName) {
    const session = this.getSession(sessionId);
    const intelligence = session?.cityIntelligence.get(cityId);
    return intelligence?.agentStates.get(agentName) || null;
  }

  /**
   * Get all agent states for a city
   */
  getAllAgentStates(sessionId, cityId) {
    const session = this.getSession(sessionId);
    const intelligence = session?.cityIntelligence.get(cityId);

    if (!intelligence) return {};

    const states = {};
    for (const [name, state] of intelligence.agentStates) {
      states[name] = state;
    }
    return states;
  }

  // ===========================================================================
  // Orchestrator State
  // ===========================================================================

  /**
   * Update orchestrator phase
   */
  setOrchestratorPhase(sessionId, phase, cityId = null) {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.orchestrator.currentPhase = phase;
    if (cityId !== null) {
      session.orchestrator.currentCityId = cityId;
    }

    this.emit('orchestratorPhaseChanged', { sessionId, phase, cityId });
  }

  /**
   * Set current execution plan
   */
  setExecutionPlan(sessionId, plan) {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.orchestrator.currentPlan = plan;
    this.emit('executionPlanSet', { sessionId, plan });
  }

  /**
   * Add execution log entry
   */
  addExecutionLog(sessionId, event, details = null) {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.orchestrator.executionLog.push({
      timestamp: new Date(),
      event,
      details
    });

    // Keep log size reasonable
    if (session.orchestrator.executionLog.length > 100) {
      session.orchestrator.executionLog.shift();
    }
  }

  /**
   * Add reflection
   */
  addReflection(sessionId, cityId, reflection) {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.orchestrator.reflections.push({
      cityId,
      timestamp: new Date(),
      ...reflection
    });

    this.emit('reflectionAdded', { sessionId, cityId, reflection });
  }

  /**
   * Get orchestrator state
   */
  getOrchestratorState(sessionId) {
    const session = this.getSession(sessionId);
    return session?.orchestrator || null;
  }

  // ===========================================================================
  // Cross-Agent Messaging
  // ===========================================================================

  /**
   * Send message between agents
   */
  sendAgentMessage(sessionId, from, to, messageType, content) {
    const session = this.getSession(sessionId);
    if (!session) return;

    const message = {
      from,
      to,
      messageType,
      content,
      timestamp: new Date()
    };

    session.agentMessages.push(message);

    // Keep messages reasonable
    if (session.agentMessages.length > 50) {
      session.agentMessages.shift();
    }

    this.emit('agentMessage', { sessionId, message });
    return message;
  }

  /**
   * Get messages for an agent
   */
  getMessagesForAgent(sessionId, agentName) {
    const session = this.getSession(sessionId);
    if (!session) return [];

    return session.agentMessages.filter(
      m => m.to === agentName || m.to === 'orchestrator'
    );
  }

  // ===========================================================================
  // Cross-City Insights
  // ===========================================================================

  /**
   * Update cross-city insights
   */
  updateCrossCityInsights(sessionId, insights) {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.crossCityInsights = {
      ...session.crossCityInsights,
      ...insights
    };

    this.emit('crossCityInsightsUpdated', { sessionId, insights: session.crossCityInsights });
  }

  /**
   * Get cross-city insights
   */
  getCrossCityInsights(sessionId) {
    const session = this.getSession(sessionId);
    return session?.crossCityInsights || null;
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Get full session snapshot for debugging
   */
  getSessionSnapshot(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return null;

    return {
      id: session.id,
      userId: session.userId,
      startedAt: session.startedAt,
      lastActivityAt: session.lastActivityAt,
      trip: session.trip,
      preferences: session.preferences,
      cityCount: session.cityIntelligence.size,
      orchestratorPhase: session.orchestrator.currentPhase,
      messageCount: session.agentMessages.length
    };
  }

  /**
   * Calculate overall progress
   */
  calculateOverallProgress(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return 0;

    const cities = Array.from(session.cityIntelligence.values());
    if (cities.length === 0) return 0;

    let totalProgress = 0;
    for (const city of cities) {
      if (city.status === 'complete') {
        totalProgress += 100;
      } else if (city.status === 'processing') {
        // Calculate based on agent states
        const agents = Array.from(city.agentStates.values());
        if (agents.length > 0) {
          const agentProgress = agents.reduce((sum, a) => {
            if (a.status === 'completed') return sum + 100;
            if (a.status === 'running') return sum + a.progress;
            return sum;
          }, 0);
          totalProgress += agentProgress / agents.length;
        }
      }
    }

    return Math.round(totalProgress / cities.length);
  }

  /**
   * Cleanup on shutdown
   */
  shutdown() {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
    console.log('🧠 SharedMemory shutdown complete');
  }
}

// Export singleton instance
module.exports = new SharedMemory();
