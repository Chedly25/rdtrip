/**
 * Agent Orchestrator V3 - Google-First Architecture
 *
 * Revolutionary changes from V2:
 * 1. Google Places FIRST (not Perplexity)
 * 2. Parallel execution graph (not sequential)
 * 3. Real-time SSE streaming (progressive results)
 * 4. Perplexity only for enrichment (80% cost reduction)
 *
 * Expected performance: 30-60 seconds (down from 5+ minutes)
 */

const EventEmitter = require('events');
const DayPlannerAgent = require('./DayPlannerAgent');
const GooglePlacesDiscoveryAgent = require('./discovery/GooglePlacesDiscoveryAgent');
const GooglePlacesRestaurantAgent = require('./discovery/GooglePlacesRestaurantAgent');
const GooglePlacesAccommodationAgent = require('./discovery/GooglePlacesAccommodationAgent');
const GooglePlacesPhotoService = require('../services/GooglePlacesPhotoService');
const GooglePlacesService = require('../services/googlePlacesService');
const ScenicRouteAgent = require('./ScenicRouteAgent');
const PracticalInfoAgent = require('./PracticalInfoAgent');
const WeatherAgent = require('./WeatherAgent');
const EventsAgent = require('./EventsAgent');
const BudgetOptimizer = require('./BudgetOptimizer');

class AgentOrchestratorV3 extends EventEmitter {
  constructor(routeData, preferences, db, existingItineraryId = null) {
    super();

    this.routeData = routeData;
    this.preferences = preferences;
    this.db = db;
    this.results = {};
    this.startTime = Date.now();
    this.itineraryId = existingItineraryId; // Use existing ID if provided

    // Initialize Google Places services
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.googlePlacesService = new GooglePlacesService(googleApiKey, db);
    this.photoService = new GooglePlacesPhotoService(googleApiKey);

    // Initialize discovery agents (Google-first!)
    this.agents = {
      dayPlanner: new DayPlannerAgent(routeData, preferences, this.progressCallback.bind(this)),

      googleActivities: new GooglePlacesDiscoveryAgent(
        this.googlePlacesService,
        this.photoService
      ),

      googleRestaurants: new GooglePlacesRestaurantAgent(
        this.googlePlacesService,
        this.photoService
      ),

      googleAccommodations: new GooglePlacesAccommodationAgent(
        this.googlePlacesService,
        this.photoService
      ),

      scenicStops: new ScenicRouteAgent(routeData, null, this.progressCallback.bind(this)),
      practicalInfo: new PracticalInfoAgent(routeData, null, this.progressCallback.bind(this)),
      weather: new WeatherAgent(routeData, null, this.progressCallback.bind(this)),
      events: new EventsAgent(routeData, null, this.progressCallback.bind(this)),
      budget: new BudgetOptimizer(routeData, null, this.progressCallback.bind(this))
    };

    // Execution graph defines agent dependencies and parallelization
    this.executionGraph = this.buildExecutionGraph();

    // Metrics tracking
    this.metrics = {
      agentTimings: {},
      totalTime: 0,
      errors: []
    };

    console.log('🚀 AgentOrchestratorV3 initialized (Google-first architecture)');
  }

  /**
   * Build execution graph with dependencies
   */
  buildExecutionGraph() {
    return {
      // Phase 1: Day structure (must be first)
      phase1_sequential: [
        { name: 'dayPlanner', agent: 'dayPlanner', deps: [] }
      ],

      // Phase 2: Core content (all parallel, depend on day structure)
      phase2_parallel: [
        { name: 'activities', agent: 'googleActivities', deps: ['dayPlanner'] },
        { name: 'restaurants', agent: 'googleRestaurants', deps: ['dayPlanner'] },
        { name: 'accommodations', agent: 'googleAccommodations', deps: ['dayPlanner'] },
        { name: 'scenicStops', agent: 'scenicStops', deps: ['dayPlanner'] }
      ],

      // Phase 3: Premium features (all parallel, lightweight)
      phase3_parallel: [
        { name: 'weather', agent: 'weather', deps: ['dayPlanner'] },
        { name: 'events', agent: 'events', deps: ['dayPlanner'] },
        { name: 'practicalInfo', agent: 'practicalInfo', deps: ['dayPlanner'] }
      ],

      // Phase 4: Budget calculation (needs everything)
      phase4_sequential: [
        { name: 'budget', agent: 'budget', deps: ['*'] }
      ]
    };
  }

  /**
   * Main execution method with parallel orchestration
   */
  async execute() {
    console.log('\n🎯 AgentOrchestratorV3: Starting execution...');
    console.log(`   Route: ${this.routeData.origin} → ${this.routeData.destination}`);
    console.log(`   Cities: ${this.routeData.waypoints?.length || 0}`);

    try {
      // Create or use existing itinerary record
      if (!this.itineraryId) {
        this.itineraryId = await this.createItineraryRecord();
      } else {
        console.log(`✓ Using existing itinerary ID: ${this.itineraryId}`);
      }
      this.emit('orchestrator:started', { itineraryId: this.itineraryId });

      // Execute each phase
      for (const [phaseName, phaseAgents] of Object.entries(this.executionGraph)) {
        const phaseNumber = phaseName.match(/phase(\d+)/)[1];
        const isParallel = phaseName.includes('parallel');

        console.log(`\n📍 === PHASE ${phaseNumber}: ${isParallel ? 'PARALLEL' : 'SEQUENTIAL'} ===`);
        this.emit('phase:start', { phase: phaseNumber, parallel: isParallel });

        if (isParallel) {
          await this.executeParallelPhase(phaseAgents);
        } else {
          await this.executeSequentialPhase(phaseAgents);
        }

        this.emit('phase:complete', { phase: phaseNumber });

        // Stream intermediate results
        await this.streamPhaseResults(phaseNumber);
      }

      // Finalize
      await this.finalizeItinerary();

      const totalTime = Date.now() - this.startTime;
      console.log(`\n✅ Orchestration complete in ${(totalTime / 1000).toFixed(1)}s`);

      this.emit('orchestrator:complete', {
        itineraryId: this.itineraryId,
        duration: totalTime,
        metrics: this.metrics
      });

      return {
        itineraryId: this.itineraryId,
        ...this.results,
        generationTime: totalTime,
        metrics: this.metrics
      };

    } catch (error) {
      console.error('❌ Orchestration failed:', error);
      this.emit('orchestrator:error', { error: error.message });
      throw error;
    }
  }

  /**
   * Execute agents in parallel
   */
  async executeParallelPhase(phaseAgents) {
    const promises = phaseAgents.map(async ({ name, agent }) => {
      const startTime = Date.now();

      try {
        console.log(`   🔄 Starting: ${name}`);
        this.emit('agent:start', { agent: name });

        const result = await this.runAgent(name, agent);

        const duration = Date.now() - startTime;
        this.metrics.agentTimings[name] = duration;

        console.log(`   ✅ Complete: ${name} (${(duration / 1000).toFixed(1)}s)`);
        this.emit('agent:complete', { agent: name, duration, hasData: !!result });

        return { name, result, success: true };

      } catch (error) {
        const duration = Date.now() - startTime;
        this.metrics.agentTimings[name] = duration;
        this.metrics.errors.push({ agent: name, error: error.message });

        console.error(`   ❌ Failed: ${name} - ${error.message}`);
        this.emit('agent:error', { agent: name, error: error.message });

        return { name, result: null, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(promises);

    // Process results
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value.success) {
        const { name, result: agentResult } = result.value;
        this.results[name] = agentResult;
      }
    });
  }

  /**
   * Execute agents sequentially
   */
  async executeSequentialPhase(phaseAgents) {
    for (const { name, agent } of phaseAgents) {
      const startTime = Date.now();

      try {
        console.log(`   🔄 Starting: ${name}`);
        this.emit('agent:start', { agent: name });

        const result = await this.runAgent(name, agent);
        this.results[name] = result;

        const duration = Date.now() - startTime;
        this.metrics.agentTimings[name] = duration;

        console.log(`   ✅ Complete: ${name} (${(duration / 1000).toFixed(1)}s)`);
        this.emit('agent:complete', { agent: name, duration, hasData: !!result });

      } catch (error) {
        const duration = Date.now() - startTime;
        this.metrics.agentTimings[name] = duration;
        this.metrics.errors.push({ agent: name, error: error.message });

        console.error(`   ❌ Failed: ${name} - ${error.message}`);
        this.emit('agent:error', { agent: name, error: error.message });

        throw error; // Sequential phases must succeed
      }
    }
  }

  /**
   * Run a specific agent based on name
   */
  async runAgent(name, agentKey) {
    const agent = this.agents[agentKey];

    switch (name) {
      case 'dayPlanner':
        return await agent.generate();

      case 'activities':
        return await this.runActivitiesDiscovery();

      case 'restaurants':
        return await this.runRestaurantDiscovery();

      case 'accommodations':
        return await this.runAccommodationDiscovery();

      case 'scenicStops':
        agent.dayStructure = this.results.dayPlanner;
        return await agent.generate();

      case 'weather':
        agent.dayStructure = this.results.dayPlanner;
        return await agent.generate();

      case 'events':
        agent.dayStructure = this.results.dayPlanner;
        return await agent.generate();

      case 'practicalInfo':
        agent.dayStructure = this.results.dayPlanner;
        return await agent.generate();

      case 'budget':
        agent.activities = this.results.activities;
        agent.restaurants = this.results.restaurants;
        agent.accommodations = this.results.accommodations;
        agent.scenicStops = this.results.scenicStops;
        return await agent.calculate();

      default:
        throw new Error(`Unknown agent: ${name}`);
    }
  }

  /**
   * Run Google Places activity discovery (PARALLEL per day)
   */
  async runActivitiesDiscovery() {
    const dayStructure = this.results.dayPlanner;
    if (!dayStructure || !dayStructure.days) {
      throw new Error('Day structure not available');
    }

    const allActivities = [];

    // Process each day's activities IN PARALLEL
    const dayPromises = dayStructure.days.map(async (day) => {
      const city = this.extractMainCity(day.location);
      const dayActivities = {
        day: day.day,
        date: day.date,
        city,
        activities: []
      };

      // Process activity windows IN PARALLEL
      if (day.activityWindows && day.activityWindows.length > 0) {
        const windowPromises = day.activityWindows.map(async (window) => {
          try {
            const request = {
              city: { name: city, coordinates: day.coordinates || { lat: 0, lng: 0 } },
              category: window.purpose || 'general',
              timeWindow: { start: window.start, end: window.end },
              preferences: this.preferences,
              date: day.date
            };

            const result = await this.agents.googleActivities.discoverActivities(request);

            if (result.success && result.candidates && result.candidates.length > 0) {
              // Return best candidate
              return result.candidates[0];
            }

            return null;

          } catch (error) {
            console.warn(`      ⚠️  Activity window failed:`, error.message);
            return null;
          }
        });

        const activities = await Promise.all(windowPromises);
        dayActivities.activities = activities.filter(a => a !== null);
      }

      return dayActivities;
    });

    const results = await Promise.all(dayPromises);
    allActivities.push(...results);

    console.log(`   📍 Discovered ${allActivities.reduce((sum, d) => sum + d.activities.length, 0)} activities`);

    return allActivities;
  }

  /**
   * Run Google Places restaurant discovery (PARALLEL per meal)
   */
  async runRestaurantDiscovery() {
    const dayStructure = this.results.dayPlanner;
    if (!dayStructure || !dayStructure.days) {
      throw new Error('Day structure not available');
    }

    const allRestaurants = [];

    // Process all meals IN PARALLEL
    const mealPromises = [];

    for (const day of dayStructure.days) {
      const city = this.extractMainCity(day.location);

      const meals = ['breakfast', 'lunch', 'dinner'];
      for (const meal of meals) {
        mealPromises.push(
          (async () => {
            try {
              const request = {
                city: { name: city, coordinates: day.coordinates || { lat: 0, lng: 0 } },
                mealType: meal,
                preferences: this.preferences,
                date: day.date
              };

              const result = await this.agents.googleRestaurants.discoverRestaurants(request);

              if (result.success && result.restaurants && result.restaurants.length > 0) {
                return {
                  day: day.day,
                  date: day.date,
                  city,
                  meal,
                  restaurant: result.restaurants[0] // Best restaurant
                };
              }

              return null;

            } catch (error) {
              console.warn(`      ⚠️  ${meal} discovery failed:`, error.message);
              return null;
            }
          })()
        );
      }
    }

    const results = await Promise.all(mealPromises);
    const validResults = results.filter(r => r !== null);

    // Group by day
    const groupedByDay = {};
    for (const result of validResults) {
      if (!groupedByDay[result.day]) {
        groupedByDay[result.day] = {
          day: result.day,
          date: result.date,
          city: result.city,
          meals: {}
        };
      }
      groupedByDay[result.day].meals[result.meal] = result.restaurant;
    }

    allRestaurants.push(...Object.values(groupedByDay));

    console.log(`   🍽️  Discovered ${validResults.length} restaurants`);

    return allRestaurants;
  }

  /**
   * Run Google Places accommodation discovery
   */
  async runAccommodationDiscovery() {
    const dayStructure = this.results.dayPlanner;
    if (!dayStructure || !dayStructure.days) {
      throw new Error('Day structure not available');
    }

    const allAccommodations = [];

    // Get overnight cities
    const overnightDays = dayStructure.days.filter(d => d.overnight);

    // Process all accommodations IN PARALLEL
    const accommodationPromises = overnightDays.map(async (day) => {
      try {
        const city = day.overnight;
        const request = {
          city: { name: city, coordinates: day.coordinates || { lat: 0, lng: 0 } },
          date: day.date,
          preferences: this.preferences
        };

        const result = await this.agents.googleAccommodations.discoverAccommodations(request);

        if (result.success && result.hotels && result.hotels.length > 0) {
          return {
            night: day.day,
            date: day.date,
            city: city,
            ...result.hotels[0] // Best hotel
          };
        }

        return null;

      } catch (error) {
        console.warn(`      ⚠️  Accommodation discovery failed:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(accommodationPromises);
    allAccommodations.push(...results.filter(r => r !== null));

    console.log(`   🏨 Discovered ${allAccommodations.length} accommodations`);

    return allAccommodations;
  }

  /**
   * Helper methods
   */
  extractMainCity(location) {
    if (location.includes('→')) {
      return location.split('→').pop().trim();
    }
    return location;
  }

  progressCallback(data) {
    this.emit('agent:progress', data);
  }

  async streamPhaseResults(phaseNumber) {
    // Stream results to database for SSE polling
    if (this.itineraryId) {
      try {
        await this.updateItineraryInDatabase();
      } catch (error) {
        console.warn('Failed to stream results:', error.message);
      }
    }
  }

  async createItineraryRecord() {
    try {
      const result = await this.db.query(
        `INSERT INTO itineraries
         (route_data, preferences, status, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id`,
        [
          JSON.stringify(this.routeData),
          JSON.stringify(this.preferences),
          'generating'
        ]
      );

      const itineraryId = result.rows[0].id;
      console.log(`✓ Created itinerary record: ${itineraryId}`);
      return itineraryId;

    } catch (error) {
      console.error('Failed to create itinerary record:', error);
      throw error;
    }
  }

  async updateItineraryInDatabase() {
    if (!this.itineraryId) return;

    try {
      await this.db.query(
        `UPDATE itineraries
         SET day_structure = $1,
             activities = $2,
             restaurants = $3,
             accommodations = $4,
             scenic_stops = $5,
             practical_info = $6,
             weather = $7,
             events = $8,
             budget = $9,
             updated_at = NOW()
         WHERE id = $10`,
        [
          JSON.stringify(this.results.dayPlanner || null),
          JSON.stringify(this.results.activities || null),
          JSON.stringify(this.results.restaurants || null),
          JSON.stringify(this.results.accommodations || null),
          JSON.stringify(this.results.scenicStops || null),
          JSON.stringify(this.results.practicalInfo || null),
          JSON.stringify(this.results.weather || null),
          JSON.stringify(this.results.events || null),
          JSON.stringify(this.results.budget || null),
          this.itineraryId
        ]
      );

      console.log(`✓ Updated itinerary ${this.itineraryId} in database`);

    } catch (error) {
      console.warn('Failed to update itinerary:', error.message);
      // Don't throw - this is just streaming, generation can continue
    }
  }

  async finalizeItinerary() {
    if (!this.itineraryId) return;

    try {
      const totalTime = Date.now() - this.startTime;

      await this.db.query(
        `UPDATE itineraries
         SET status = $1,
             generation_time_ms = $2,
             metrics = $3,
             completed_at = NOW(),
             updated_at = NOW()
         WHERE id = $4`,
        [
          'completed',
          totalTime,
          JSON.stringify(this.metrics),
          this.itineraryId
        ]
      );

      console.log(`✓ Finalized itinerary ${this.itineraryId}`);

    } catch (error) {
      console.error('Failed to finalize itinerary:', error);
      throw error;
    }
  }
}

module.exports = AgentOrchestratorV3;
