/**
 * Itinerary Agent Orchestrator
 * Coordinates multiple specialized agents to generate comprehensive itineraries
 */

const DayPlannerAgent = require('./DayPlannerAgent');
const CityActivityAgent = require('./CityActivityAgent');
const RestaurantAgent = require('./RestaurantAgent');

class ItineraryAgentOrchestrator {
  constructor(routeData, preferences, db, progressCallback) {
    this.routeData = routeData;
    this.preferences = preferences;
    this.db = db;
    this.onProgress = progressCallback || (() => {});
    this.results = {};
    this.startTime = Date.now();
    this.itineraryId = null;
  }

  /**
   * Main orchestration method - runs all agents in optimal sequence
   */
  async generateComplete() {
    try {
      console.log('🎯 Starting itinerary generation...', {
        agent: this.routeData.agent,
        cities: this.routeData.waypoints?.length || 0,
        preferences: this.preferences
      });

      // Create itinerary record
      this.itineraryId = await this.createItineraryRecord();

      // PHASE 1: Day Structure (Sequential - foundation for everything)
      await this.emitProgress('day_planner', 'started');
      this.results.dayStructure = await this.runDayPlannerAgent();
      await this.emitProgress('day_planner', 'completed', this.results.dayStructure);
      await this.saveDayStructure();

      // PHASE 2: Parallel Detail Agents (all can run simultaneously)
      const detailAgents = [
        this.runCityActivityAgent(),
        this.runRestaurantAgent(),
        // TODO: Add more agents
        // this.runAccommodationAgent(),
        // this.runScenicRouteAgent(),
        // this.runPracticalInfoAgent(),
      ];

      // Run agents in parallel and track results
      const results = await Promise.allSettled(detailAgents);

      // Handle results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Agent ${index} failed:`, result.reason);
        }
      });

      // PHASE 3: Post-processing
      // await this.runBudgetOptimizer();
      // await this.runWeatherAgent();
      // await this.runEventsAgent();

      // Final save
      await this.finalizeItinerary();

      const totalDuration = Date.now() - this.startTime;
      console.log(`✅ Itinerary generation complete in ${totalDuration}ms`);

      return {
        itineraryId: this.itineraryId,
        ...this.results,
        generationTime: totalDuration
      };

    } catch (error) {
      console.error('❌ Orchestration failed:', error);
      await this.handleError(error);
      throw error;
    }
  }

  /**
   * Create initial itinerary record in database
   */
  async createItineraryRecord() {
    const query = `
      INSERT INTO itineraries (
        route_id, user_id, agent_type, preferences, status
      ) VALUES ($1, $2, $3, $4, 'draft')
      RETURNING id
    `;

    const result = await this.db.query(query, [
      this.routeData.id,
      this.routeData.user_id,
      this.routeData.agent,
      JSON.stringify(this.preferences)
    ]);

    return result.rows[0].id;
  }

  /**
   * Run Day Planner Agent
   */
  async runDayPlannerAgent() {
    const startTime = Date.now();

    try {
      const agent = new DayPlannerAgent(this.routeData, this.preferences);
      const result = await agent.generate();

      await this.logAgentExecution('day_planner', startTime, 'success', result);
      return result;

    } catch (error) {
      await this.logAgentExecution('day_planner', startTime, 'failed', null, error);
      throw error;
    }
  }

  /**
   * Run City Activity Agent
   */
  async runCityActivityAgent() {
    if (!this.results.dayStructure) {
      throw new Error('Day structure must be generated first');
    }

    const startTime = Date.now();

    try {
      await this.emitProgress('activities', 'started');

      const agent = new CityActivityAgent(
        this.routeData,
        this.results.dayStructure,
        (progress) => this.emitProgress('activities', 'progress', null, progress)
      );

      const result = await agent.generate();

      await this.emitProgress('activities', 'completed', result);
      await this.logAgentExecution('activities', startTime, 'success', result);

      this.results.activities = result;
      await this.saveActivities();

      return result;

    } catch (error) {
      await this.logAgentExecution('activities', startTime, 'failed', null, error);
      throw error;
    }
  }

  /**
   * Run Restaurant Agent
   */
  async runRestaurantAgent() {
    if (!this.results.dayStructure) {
      throw new Error('Day structure must be generated first');
    }

    const startTime = Date.now();

    try {
      await this.emitProgress('restaurants', 'started');

      const agent = new RestaurantAgent(
        this.routeData,
        this.results.dayStructure,
        this.preferences.budget || 'mid',
        (progress) => this.emitProgress('restaurants', 'progress', null, progress)
      );

      const result = await agent.generate();

      await this.emitProgress('restaurants', 'completed', result);
      await this.logAgentExecution('restaurants', startTime, 'success', result);

      this.results.restaurants = result;
      await this.saveRestaurants();

      return result;

    } catch (error) {
      await this.logAgentExecution('restaurants', startTime, 'failed', null, error);
      throw error;
    }
  }

  /**
   * Save day structure to database
   */
  async saveDayStructure() {
    await this.db.query(
      'UPDATE itineraries SET day_structure = $1 WHERE id = $2',
      [JSON.stringify(this.results.dayStructure), this.itineraryId]
    );
  }

  /**
   * Save activities to database
   */
  async saveActivities() {
    await this.db.query(
      'UPDATE itineraries SET activities = $1 WHERE id = $2',
      [JSON.stringify(this.results.activities), this.itineraryId]
    );
  }

  /**
   * Save restaurants to database
   */
  async saveRestaurants() {
    await this.db.query(
      'UPDATE itineraries SET restaurants = $1 WHERE id = $2',
      [JSON.stringify(this.results.restaurants), this.itineraryId]
    );
  }

  /**
   * Finalize itinerary - mark as complete
   */
  async finalizeItinerary() {
    const totalTime = Date.now() - this.startTime;

    await this.db.query(`
      UPDATE itineraries
      SET status = 'published',
          generation_time_ms = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [totalTime, this.itineraryId]);
  }

  /**
   * Log agent execution for analytics
   */
  async logAgentExecution(agentName, startTime, status, response, error = null) {
    const duration = Date.now() - startTime;

    const query = `
      INSERT INTO itinerary_generation_logs (
        itinerary_id, agent_name, started_at, completed_at,
        duration_ms, status, error_message, perplexity_response
      ) VALUES ($1, $2, to_timestamp($3/1000.0), CURRENT_TIMESTAMP, $4, $5, $6, $7)
    `;

    await this.db.query(query, [
      this.itineraryId,
      agentName,
      startTime,
      duration,
      status,
      error?.message || null,
      response ? JSON.stringify(response) : null
    ]);
  }

  /**
   * Emit progress event to SSE stream
   */
  async emitProgress(agent, status, data = null, progress = null) {
    const event = {
      agent,
      status,
      timestamp: Date.now()
    };

    if (data) event.data = data;
    if (progress) event.progress = progress;

    this.onProgress(event);
  }

  /**
   * Handle orchestration error
   */
  async handleError(error) {
    if (this.itineraryId) {
      await this.db.query(
        'UPDATE itineraries SET status = $1 WHERE id = $2',
        ['error', this.itineraryId]
      );
    }
  }
}

module.exports = ItineraryAgentOrchestrator;
