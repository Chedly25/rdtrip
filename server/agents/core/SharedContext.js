/**
 * SharedContext - Central knowledge base for agentic coordination
 *
 * This is the "memory" of the agentic system. All agents read from and write to
 * this shared context to coordinate their actions, learn from failures, and
 * make informed decisions.
 *
 * Key Capabilities:
 * - Knowledge base (constraints, validated places, preferences)
 * - Decision history (every choice tracked with reasoning)
 * - Agent communication log
 * - State management (budget, time, progress)
 */

class SharedContext {
  constructor(itineraryId, routeData, preferences, db) {
    this.itineraryId = itineraryId;
    this.routeData = routeData;
    this.db = db;

    // Initialize knowledge base
    this.knowledgeBase = {
      // Hard constraints for this itinerary
      constraints: {
        budget: {
          total: preferences.budgetTotal || null,
          remaining: preferences.budgetTotal || null,
          spent: 0
        },
        time: {
          startDate: routeData.startDate,
          endDate: routeData.endDate,
          totalDays: routeData.totalDays || 0
        },
        cities: routeData.waypoints?.map(w => w.city) || [],
        travelStyle: routeData.agent || preferences.travelStyle || 'best-overall'
      },

      // Places we've successfully validated (cache across days)
      validatedPlaces: new Map(),

      // Places that failed validation (don't try again)
      invalidPlaces: new Map(), // { name -> { reason, timestamp } }

      // User preferences
      preferences: {
        preferredActivityTypes: preferences.preferredActivityTypes || [],
        avoidActivityTypes: preferences.avoidActivityTypes || [],
        pace: preferences.pace || 'moderate', // relaxed, moderate, packed
        budget: preferences.budget || 'mid',
        dietaryRestrictions: preferences.dietaryRestrictions || []
      },

      // Current state (updated as we build itinerary)
      state: {
        currentDay: 0,
        currentCity: null,
        activitiesScheduled: 0,
        restaurantsScheduled: 0,
        budgetSpent: 0,
        lastLocation: null,
        lastActivityTime: null
      },

      // Statistics for intelligent decision-making
      statistics: {
        activityTypeCount: new Map(), // { 'museum' -> 3, 'outdoor' -> 1 }
        energyLevelCount: new Map(), // { 'high' -> 2, 'relaxed' -> 3 }
        averageActivityDuration: 0,
        averageActivityCost: 0
      }
    };

    // Decision history - every choice tracked
    this.decisions = [];

    // Agent communication log
    this.communications = [];

    // Start time for performance tracking
    this.startTime = Date.now();
  }

  // ========== DECISION LOGGING ==========

  /**
   * Record a decision made by any agent
   */
  recordDecision(decision) {
    const record = {
      id: this.decisions.length + 1,
      timestamp: Date.now(),
      elapsedMs: Date.now() - this.startTime,
      itineraryId: this.itineraryId,
      ...decision
    };

    this.decisions.push(record);

    // Log to console for debugging
    console.log(`📝 Decision #${record.id}: ${decision.phase} - ${decision.reasoning || decision.selected || 'see details'}`);

    return record;
  }

  /**
   * Get all decisions for a specific phase
   */
  getDecisionsByPhase(phase) {
    return this.decisions.filter(d => d.phase === phase);
  }

  /**
   * Get decision history for reporting
   */
  getDecisionHistory() {
    return this.decisions;
  }

  /**
   * Save decisions to database
   */
  async persistDecisions() {
    if (!this.db) return;

    try {
      const query = `
        INSERT INTO decision_logs (
          itinerary_id, phase, agent_name, decision_data, timestamp
        ) VALUES ($1, $2, $3, $4, to_timestamp($5/1000.0))
      `;

      for (const decision of this.decisions) {
        await this.db.query(query, [
          this.itineraryId,
          decision.phase,
          decision.agent || 'unknown',
          JSON.stringify(decision),
          decision.timestamp
        ]);
      }
    } catch (error) {
      console.error('Failed to persist decisions:', error.message);
    }
  }

  // ========== AGENT COMMUNICATION ==========

  /**
   * Log communication between agents
   */
  logCommunication(from, to, message, data = null) {
    const comm = {
      id: this.communications.length + 1,
      timestamp: Date.now(),
      from,
      to,
      message,
      data
    };

    this.communications.push(comm);
    console.log(`💬 ${from} → ${to}: ${message}`);

    return comm;
  }

  /**
   * Get communication history
   */
  getCommunications() {
    return this.communications;
  }

  // ========== PLACE MANAGEMENT ==========

  /**
   * Check if we've already tried to validate this place
   */
  hasTriedPlace(placeName) {
    return this.knowledgeBase.validatedPlaces.has(placeName) ||
           this.knowledgeBase.invalidPlaces.has(placeName);
  }

  /**
   * Get a previously validated place (from cache)
   */
  getValidatedPlace(placeName) {
    return this.knowledgeBase.validatedPlaces.get(placeName);
  }

  /**
   * Add a successfully validated place to knowledge base
   */
  addValidatedPlace(place) {
    this.knowledgeBase.validatedPlaces.set(place.name, {
      place,
      timestamp: Date.now(),
      usedInItinerary: false
    });

    console.log(`✅ Added validated place to knowledge base: ${place.name}`);
  }

  /**
   * Mark a place as invalid (failed validation)
   */
  markPlaceInvalid(placeName, reason) {
    this.knowledgeBase.invalidPlaces.set(placeName, {
      reason,
      timestamp: Date.now()
    });

    console.log(`❌ Marked place as invalid: ${placeName} (${reason})`);
  }

  /**
   * Get all invalid places (to avoid retrying)
   */
  getInvalidPlaces() {
    return Array.from(this.knowledgeBase.invalidPlaces.keys());
  }

  // ========== STATE MANAGEMENT ==========

  /**
   * Update budget tracking
   */
  updateBudget(spent) {
    this.knowledgeBase.state.budgetSpent += spent;
    if (this.knowledgeBase.constraints.budget.remaining !== null) {
      this.knowledgeBase.constraints.budget.remaining -= spent;
    }

    console.log(`💰 Budget updated: +${spent}, remaining: ${this.knowledgeBase.constraints.budget.remaining}`);
  }

  /**
   * Get budget status
   */
  getBudgetStatus() {
    return {
      total: this.knowledgeBase.constraints.budget.total,
      spent: this.knowledgeBase.state.budgetSpent,
      remaining: this.knowledgeBase.constraints.budget.remaining,
      percentUsed: this.knowledgeBase.constraints.budget.total
        ? (this.knowledgeBase.state.budgetSpent / this.knowledgeBase.constraints.budget.total * 100)
        : null
    };
  }

  /**
   * Increment activity count
   */
  incrementActivityCount() {
    this.knowledgeBase.state.activitiesScheduled++;
  }

  /**
   * Increment restaurant count
   */
  incrementRestaurantCount() {
    this.knowledgeBase.state.restaurantsScheduled++;
  }

  /**
   * Update current location
   */
  updateLastLocation(coordinates) {
    this.knowledgeBase.state.lastLocation = coordinates;
  }

  /**
   * Get last scheduled location
   */
  getLastLocation() {
    return this.knowledgeBase.state.lastLocation;
  }

  /**
   * Update last activity time
   */
  updateLastActivityTime(time) {
    this.knowledgeBase.state.lastActivityTime = time;
  }

  /**
   * Set current day
   */
  setCurrentDay(day, city) {
    this.knowledgeBase.state.currentDay = day;
    this.knowledgeBase.state.currentCity = city;
  }

  // ========== STATISTICS & ANALYSIS ==========

  /**
   * Track activity type for diversification
   */
  trackActivityType(type) {
    const count = this.knowledgeBase.statistics.activityTypeCount.get(type) || 0;
    this.knowledgeBase.statistics.activityTypeCount.set(type, count + 1);
  }

  /**
   * Track energy level for balance
   */
  trackEnergyLevel(level) {
    const count = this.knowledgeBase.statistics.energyLevelCount.get(level) || 0;
    this.knowledgeBase.statistics.energyLevelCount.set(level, count + 1);
  }

  /**
   * Get schedule statistics for intelligent decisions
   */
  getScheduleStatistics() {
    return {
      totalActivities: this.knowledgeBase.state.activitiesScheduled,
      totalRestaurants: this.knowledgeBase.state.restaurantsScheduled,
      activityTypeBreakdown: Object.fromEntries(this.knowledgeBase.statistics.activityTypeCount),
      energyLevelBreakdown: Object.fromEntries(this.knowledgeBase.statistics.energyLevelCount),
      averageDuration: this.knowledgeBase.statistics.averageActivityDuration,
      averageCost: this.knowledgeBase.statistics.averageActivityCost,
      budgetStatus: this.getBudgetStatus()
    };
  }

  /**
   * Check if we need diversification
   */
  needsDiversification() {
    const stats = this.getScheduleStatistics();

    // Check if any activity type is over-represented
    for (const [type, count] of this.knowledgeBase.statistics.activityTypeCount.entries()) {
      if (count >= 3 && stats.totalActivities > 5) {
        return {
          needsDiversification: true,
          overrepresentedType: type,
          count,
          suggestion: `Avoid ${type} activities - already scheduled ${count}`
        };
      }
    }

    // Check energy level balance
    const highEnergy = this.knowledgeBase.statistics.energyLevelCount.get('high') || 0;
    const relaxed = this.knowledgeBase.statistics.energyLevelCount.get('relaxed') || 0;

    if (highEnergy > relaxed + 2) {
      return {
        needsDiversification: true,
        overrepresentedType: 'high_energy',
        suggestion: 'Add more relaxed activities for balance'
      };
    }

    return {
      needsDiversification: false
    };
  }

  // ========== EXPORT & REPORTING ==========

  /**
   * Export full context for debugging/analysis
   */
  export() {
    return {
      itineraryId: this.itineraryId,
      knowledgeBase: {
        ...this.knowledgeBase,
        validatedPlaces: Object.fromEntries(this.knowledgeBase.validatedPlaces),
        invalidPlaces: Object.fromEntries(this.knowledgeBase.invalidPlaces),
        statistics: {
          ...this.knowledgeBase.statistics,
          activityTypeCount: Object.fromEntries(this.knowledgeBase.statistics.activityTypeCount),
          energyLevelCount: Object.fromEntries(this.knowledgeBase.statistics.energyLevelCount)
        }
      },
      decisions: this.decisions,
      communications: this.communications,
      totalDecisions: this.decisions.length,
      totalCommunications: this.communications.length,
      elapsedTime: Date.now() - this.startTime
    };
  }

  /**
   * Generate summary report
   */
  generateSummary() {
    const stats = this.getScheduleStatistics();

    return {
      itineraryId: this.itineraryId,
      decisions: {
        total: this.decisions.length,
        byPhase: {
          discovery: this.getDecisionsByPhase('discovery').length,
          validation: this.getDecisionsByPhase('validation').length,
          selection: this.getDecisionsByPhase('selection').length,
          feedback: this.getDecisionsByPhase('feedback').length
        }
      },
      schedule: {
        activities: stats.totalActivities,
        restaurants: stats.totalRestaurants,
        activityTypes: stats.activityTypeBreakdown
      },
      budget: stats.budgetStatus,
      validatedPlaces: this.knowledgeBase.validatedPlaces.size,
      invalidPlaces: this.knowledgeBase.invalidPlaces.size,
      communications: this.communications.length,
      elapsedTime: Date.now() - this.startTime
    };
  }
}

module.exports = SharedContext;
