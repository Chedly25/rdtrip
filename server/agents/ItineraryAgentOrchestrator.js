/**
 * Itinerary Agent Orchestrator
 * Coordinates multiple specialized agents to generate comprehensive itineraries
 */

const DayPlannerAgent = require('./DayPlannerAgent');
const CityActivityAgent = require('./CityActivityAgent');
const RestaurantAgent = require('./RestaurantAgent');
const AccommodationAgent = require('./AccommodationAgent');
const ScenicRouteAgent = require('./ScenicRouteAgent');
const PracticalInfoAgent = require('./PracticalInfoAgent');
const WeatherAgent = require('./WeatherAgent');
const EventsAgent = require('./EventsAgent');
const BudgetOptimizer = require('./BudgetOptimizer');

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

      // PHASE 2: Core Content Agents (all can run simultaneously)
      const coreAgents = [
        this.runCityActivityAgent(),
        this.runRestaurantAgent(),
        this.runAccommodationAgent(),
        this.runScenicRouteAgent(),
        this.runPracticalInfoAgent(),
      ];

      // Run core agents in parallel
      const coreResults = await Promise.allSettled(coreAgents);

      // Handle core results
      coreResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Core agent ${index} failed:`, result.reason);
        }
      });

      // PHASE 3: Premium Feature Agents (can run in parallel)
      const premiumAgents = [
        this.runWeatherAgent(),
        this.runEventsAgent()
      ];

      const premiumResults = await Promise.allSettled(premiumAgents);

      premiumResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`⚠️  Premium agent ${index} failed (non-critical):`, result.reason);
        }
      });

      // PHASE 4: Budget Calculation (needs all other data)
      await this.runBudgetOptimizer();

      // Final save
      await this.finalizeItinerary();

      const totalDuration = Date.now() - this.startTime;
      console.log(`✅ Itinerary generation complete in ${totalDuration}ms`);

      const finalResult = {
        itineraryId: this.itineraryId,
        ...this.results,
        generationTime: totalDuration
      };

      console.log('🔍 FINAL RESULT STRUCTURE:', {
        itineraryId: finalResult.itineraryId,
        hasDayStructure: !!finalResult.dayStructure,
        dayStructureLength: finalResult.dayStructure?.length || 0,
        hasActivities: !!finalResult.activities,
        activitiesLength: finalResult.activities?.length || 0,
        hasRestaurants: !!finalResult.restaurants,
        restaurantsLength: finalResult.restaurants?.length || 0,
        hasAccommodations: !!finalResult.accommodations,
        accommodationsLength: finalResult.accommodations?.length || 0,
        hasScenicStops: !!finalResult.scenicStops,
        scenicStopsLength: finalResult.scenicStops?.length || 0
      });

      if (finalResult.dayStructure) {
        console.log('🔍 Day Structure sample:', JSON.stringify(finalResult.dayStructure).substring(0, 500));
      }
      if (finalResult.activities) {
        console.log('🔍 Activities sample:', JSON.stringify(finalResult.activities).substring(0, 500));
      }
      if (finalResult.restaurants) {
        console.log('🔍 Restaurants sample:', JSON.stringify(finalResult.restaurants).substring(0, 500));
      }

      return finalResult;

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

    // Use agent from routeData, preferences, or default to 'best-overall'
    const agentType = this.routeData.agent || this.preferences?.travelStyle || 'best-overall';

    const result = await this.db.query(query, [
      this.routeData.id,
      this.routeData.user_id,
      agentType,
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
   * Run Accommodation Agent
   */
  async runAccommodationAgent() {
    if (!this.results.dayStructure) {
      throw new Error('Day structure must be generated first');
    }

    const startTime = Date.now();

    try {
      await this.emitProgress('accommodations', 'started');

      const agent = new AccommodationAgent(
        this.routeData,
        this.results.dayStructure,
        this.preferences.budget || 'mid',
        (progress) => this.emitProgress('accommodations', 'progress', null, progress)
      );

      const result = await agent.generate();

      await this.emitProgress('accommodations', 'completed', result);
      await this.logAgentExecution('accommodations', startTime, 'success', result);

      this.results.accommodations = result;
      await this.saveAccommodations();

      return result;

    } catch (error) {
      await this.logAgentExecution('accommodations', startTime, 'failed', null, error);
      throw error;
    }
  }

  /**
   * Run Scenic Route Agent
   */
  async runScenicRouteAgent() {
    if (!this.results.dayStructure) {
      throw new Error('Day structure must be generated first');
    }

    const startTime = Date.now();

    try {
      await this.emitProgress('scenic_stops', 'started');

      const agent = new ScenicRouteAgent(
        this.routeData,
        this.results.dayStructure,
        (progress) => this.emitProgress('scenic_stops', 'progress', null, progress)
      );

      const result = await agent.generate();

      await this.emitProgress('scenic_stops', 'completed', result);
      await this.logAgentExecution('scenic_stops', startTime, 'success', result);

      this.results.scenicStops = result;
      await this.saveScenicStops();

      return result;

    } catch (error) {
      await this.logAgentExecution('scenic_stops', startTime, 'failed', null, error);
      throw error;
    }
  }

  /**
   * Run Practical Info Agent
   */
  async runPracticalInfoAgent() {
    if (!this.results.dayStructure) {
      throw new Error('Day structure must be generated first');
    }

    const startTime = Date.now();

    try {
      await this.emitProgress('practical_info', 'started');

      const agent = new PracticalInfoAgent(
        this.routeData,
        this.results.dayStructure,
        (progress) => this.emitProgress('practical_info', 'progress', null, progress)
      );

      const result = await agent.generate();

      await this.emitProgress('practical_info', 'completed', result);
      await this.logAgentExecution('practical_info', startTime, 'success', result);

      this.results.practicalInfo = result;
      await this.savePracticalInfo();

      return result;

    } catch (error) {
      await this.logAgentExecution('practical_info', startTime, 'failed', null, error);
      throw error;
    }
  }

  /**
   * Run Weather Agent
   */
  async runWeatherAgent() {
    if (!this.results.dayStructure) {
      throw new Error('Day structure must be generated first');
    }

    const startTime = Date.now();

    try {
      await this.emitProgress('weather', 'started');

      const agent = new WeatherAgent(
        this.results.dayStructure,
        (progress) => this.emitProgress('weather', 'progress', null, progress)
      );

      const result = await agent.generate();

      await this.emitProgress('weather', 'completed', result);
      await this.logAgentExecution('weather', startTime, 'success', result);

      this.results.weather = result;
      await this.saveWeather();

      return result;

    } catch (error) {
      await this.logAgentExecution('weather', startTime, 'failed', null, error);
      // Don't throw - weather is optional
      return [];
    }
  }

  /**
   * Run Events Agent
   */
  async runEventsAgent() {
    if (!this.results.dayStructure) {
      throw new Error('Day structure must be generated first');
    }

    const startTime = Date.now();

    try {
      await this.emitProgress('events', 'started');

      const agent = new EventsAgent(
        this.routeData,
        this.results.dayStructure,
        (progress) => this.emitProgress('events', 'progress', null, progress)
      );

      const result = await agent.generate();

      await this.emitProgress('events', 'completed', result);
      await this.logAgentExecution('events', startTime, 'success', result);

      this.results.events = result;
      await this.saveEvents();

      return result;

    } catch (error) {
      await this.logAgentExecution('events', startTime, 'failed', null, error);
      // Don't throw - events are optional
      return [];
    }
  }

  /**
   * Run Budget Optimizer
   */
  async runBudgetOptimizer() {
    const startTime = Date.now();

    try {
      await this.emitProgress('budget', 'started');

      const optimizer = new BudgetOptimizer(this.results, this.preferences);
      const result = optimizer.calculate();

      await this.emitProgress('budget', 'completed', result);
      await this.logAgentExecution('budget', startTime, 'success', result);

      this.results.budget = result;
      await this.saveBudget();

      return result;

    } catch (error) {
      await this.logAgentExecution('budget', startTime, 'failed', null, error);
      // Don't throw - budget is helpful but not critical
      return null;
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
   * Save accommodations to database
   */
  async saveAccommodations() {
    await this.db.query(
      'UPDATE itineraries SET accommodations = $1 WHERE id = $2',
      [JSON.stringify(this.results.accommodations), this.itineraryId]
    );
  }

  /**
   * Save scenic stops to database
   */
  async saveScenicStops() {
    await this.db.query(
      'UPDATE itineraries SET scenic_stops = $1 WHERE id = $2',
      [JSON.stringify(this.results.scenicStops), this.itineraryId]
    );
  }

  /**
   * Save practical info to database
   */
  async savePracticalInfo() {
    await this.db.query(
      'UPDATE itineraries SET practical_info = $1 WHERE id = $2',
      [JSON.stringify(this.results.practicalInfo), this.itineraryId]
    );
  }

  /**
   * Save weather data to database
   */
  async saveWeather() {
    await this.db.query(
      'UPDATE itineraries SET weather = $1 WHERE id = $2',
      [JSON.stringify(this.results.weather), this.itineraryId]
    );
  }

  /**
   * Save events data to database
   */
  async saveEvents() {
    await this.db.query(
      'UPDATE itineraries SET events = $1 WHERE id = $2',
      [JSON.stringify(this.results.events), this.itineraryId]
    );
  }

  /**
   * Save budget calculation to database
   */
  async saveBudget() {
    await this.db.query(
      'UPDATE itineraries SET budget = $1 WHERE id = $2',
      [JSON.stringify(this.results.budget), this.itineraryId]
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
