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

    // Build city-to-coordinates map from waypoints
    this.cityCoordinates = this.buildCityCoordinatesMap(routeData.waypoints || []);
    console.log('📍 Built coordinates map for', Object.keys(this.cityCoordinates).length, 'cities');

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

      // Track used place IDs to avoid duplicates within the same day
      const usedPlaceIds = new Set();

      // Process activity windows SEQUENTIALLY to avoid duplicates
      if (day.activityWindows && day.activityWindows.length > 0) {
        for (const window of day.activityWindows) {
          try {
            const coordinates = await this.getCityCoordinates(city);
            const request = {
              city: { name: city, coordinates },
              category: window.purpose || 'general',
              timeWindow: { start: window.start, end: window.end },
              preferences: this.preferences,
              date: day.date,
              excludePlaceIds: Array.from(usedPlaceIds) // Exclude already-selected places
            };

            const result = await this.agents.googleActivities.discoverActivities(request);

            if (result.success && result.candidates && result.candidates.length > 0) {
              // Find first candidate that hasn't been used
              const candidate = result.candidates.find(c => !usedPlaceIds.has(c.place_id));

              if (candidate) {
                usedPlaceIds.add(candidate.place_id);
                dayActivities.activities.push(candidate);
                console.log(`      ✓ Selected: ${candidate.name} (avoiding ${usedPlaceIds.size - 1} duplicates)`);
              }
            }

          } catch (error) {
            console.warn(`      ⚠️  Activity window failed:`, error.message);
          }
        }
      }

      return dayActivities;
    });

    const results = await Promise.all(dayPromises);
    allActivities.push(...results);

    console.log(`   📍 Discovered ${allActivities.reduce((sum, d) => sum + d.activities.length, 0)} activities`);

    return allActivities;
  }

  /**
   * Run Google Places restaurant discovery (PARALLEL per day, SEQUENTIAL per meal)
   */
  async runRestaurantDiscovery() {
    const dayStructure = this.results.dayPlanner;
    if (!dayStructure || !dayStructure.days) {
      throw new Error('Day structure not available');
    }

    const allRestaurants = [];

    // Process each day IN PARALLEL
    const dayPromises = dayStructure.days.map(async (day) => {
      const city = this.extractMainCity(day.location);
      const dayRestaurants = {
        day: day.day,
        date: day.date,
        city,
        meals: {}
      };

      // Track used restaurant place IDs to avoid duplicates within the same day
      const usedPlaceIds = new Set();

      // Process meals SEQUENTIALLY to avoid getting same restaurant 3 times
      const meals = ['breakfast', 'lunch', 'dinner'];
      for (const meal of meals) {
        try {
          const coordinates = await this.getCityCoordinates(city);
          const request = {
            city: { name: city, coordinates },
            mealType: meal,
            preferences: this.preferences,
            date: day.date,
            excludePlaceIds: Array.from(usedPlaceIds) // Exclude already-selected restaurants
          };

          const result = await this.agents.googleRestaurants.discoverRestaurants(request);

          if (result.success && result.restaurants && result.restaurants.length > 0) {
            // Find first restaurant that hasn't been used
            const restaurant = result.restaurants.find(r => !usedPlaceIds.has(r.place_id));

            if (restaurant) {
              usedPlaceIds.add(restaurant.place_id);
              dayRestaurants.meals[meal] = restaurant;
              console.log(`      ✓ Selected: ${restaurant.name} for ${meal} (avoiding ${usedPlaceIds.size - 1} duplicates)`);
            }
          }

        } catch (error) {
          console.warn(`      ⚠️  ${meal} discovery failed:`, error.message);
        }
      }

      return dayRestaurants;
    });

    const results = await Promise.all(dayPromises);
    allRestaurants.push(...results);

    const totalMeals = results.reduce((sum, d) => sum + Object.keys(d.meals).length, 0);
    console.log(`   🍽️  Discovered ${totalMeals} restaurants`);

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
        const coordinates = await this.getCityCoordinates(city);
        const request = {
          city: { name: city, coordinates },
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

  /**
   * Build a map of city names to coordinates from route waypoints
   */
  buildCityCoordinatesMap(waypoints) {
    const coordMap = {};

    console.log(`   🔍 buildCityCoordinatesMap received ${waypoints?.length || 0} waypoints`);
    console.log(`   🔍 Sample waypoint:`, JSON.stringify(waypoints?.[0], null, 2));

    for (const waypoint of waypoints) {
      const cityName = waypoint.city || waypoint.name || waypoint.location;

      // Handle multiple coordinate formats
      let lat, lng;

      // Format 1: Array [lat, lng]
      if (waypoint.coordinates && Array.isArray(waypoint.coordinates) && waypoint.coordinates.length === 2) {
        lat = waypoint.coordinates[0];
        lng = waypoint.coordinates[1];
      }
      // Format 2: Object {lat, lng}
      else if (waypoint.coordinates && waypoint.coordinates.lat && waypoint.coordinates.lng) {
        lat = waypoint.coordinates.lat;
        lng = waypoint.coordinates.lng;
      }
      // Format 3: Direct properties
      else if (waypoint.lat && waypoint.lng) {
        lat = waypoint.lat;
        lng = waypoint.lng;
      }

      if (cityName && lat && lng) {
        // Normalize city name (lowercase, trim)
        const normalizedName = cityName.toLowerCase().trim();
        coordMap[normalizedName] = { lat, lng };

        console.log(`   📍 Mapped: ${cityName} → (${lat}, ${lng})`);
      } else {
        console.warn(`   ⚠️  Skipped waypoint - cityName: ${cityName}, lat: ${lat}, lng: ${lng}, raw:`, JSON.stringify(waypoint));
      }
    }

    return coordMap;
  }

  /**
   * Geocode a city name using Google Geocoding API
   */
  async geocodeCity(cityName) {
    const axios = require('axios');
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = {
      address: `${cityName}, Europe`,  // Add "Europe" to bias results
      key: apiKey
    };

    const response = await axios.get(url, { params, timeout: 5000 });

    if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }

    const location = response.data.results[0].geometry.location;
    console.log(`   ✅ Geocoded "${cityName}" → (${location.lat}, ${location.lng})`);

    return {
      lat: location.lat,
      lng: location.lng
    };
  }

  /**
   * Get coordinates for a city by name (dynamic geocoding)
   */
  async getCityCoordinates(cityName) {
    if (!cityName) {
      console.warn('⚠️  getCityCoordinates called with empty city name');
      return { lat: 0, lng: 0 };
    }

    const normalizedQuery = cityName.toLowerCase().trim();

    // Check cache first
    if (this.geocodeCache && this.geocodeCache[normalizedQuery]) {
      return this.geocodeCache[normalizedQuery];
    }

    // Exact match in waypoint map
    if (this.cityCoordinates[normalizedQuery]) {
      return this.cityCoordinates[normalizedQuery];
    }

    // Partial match in waypoint map (city contains query or query contains city)
    for (const [mapCity, coords] of Object.entries(this.cityCoordinates)) {
      if (mapCity.includes(normalizedQuery) || normalizedQuery.includes(mapCity)) {
        console.log(`   🎯 Fuzzy matched "${cityName}" to "${mapCity}"`);
        return coords;
      }
    }

    // Use Google Geocoding API for ANY city not in waypoints
    try {
      console.log(`   🌍 Geocoding "${cityName}" with Google API...`);
      const coords = await this.geocodeCity(cityName);

      // Cache the result
      if (!this.geocodeCache) this.geocodeCache = {};
      this.geocodeCache[normalizedQuery] = coords;

      return coords;
    } catch (error) {
      console.warn(`   ❌ Geocoding failed for "${cityName}":`, error.message);
      // Still try static fallback as last resort
    }

    // Fallback: Major European cities database (last resort)
    const europeanCities = {
      'paris': { lat: 48.8566, lng: 2.3522 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'berlin': { lat: 52.5200, lng: 13.4050 },
      'madrid': { lat: 40.4168, lng: -3.7038 },
      'rome': { lat: 41.9028, lng: 12.4964 },
      'barcelona': { lat: 41.3851, lng: 2.1734 },
      'munich': { lat: 48.1351, lng: 11.5820 },
      'milan': { lat: 45.4642, lng: 9.1900 },
      'prague': { lat: 50.0755, lng: 14.4378 },
      'vienna': { lat: 48.2082, lng: 16.3738 },
      'amsterdam': { lat: 52.3676, lng: 4.9041 },
      'brussels': { lat: 50.8503, lng: 4.3517 },
      'copenhagen': { lat: 55.6761, lng: 12.5683 },
      'stockholm': { lat: 59.3293, lng: 18.0686 },
      'dublin': { lat: 53.3498, lng: -6.2603 },
      'lisbon': { lat: 38.7223, lng: -9.1393 },
      'athens': { lat: 37.9838, lng: 23.7275 },
      'warsaw': { lat: 52.2297, lng: 21.0122 },
      'budapest': { lat: 47.4979, lng: 19.0402 },
      'zurich': { lat: 47.3769, lng: 8.5417 },
      'geneva': { lat: 46.2044, lng: 6.1432 },
      'lyon': { lat: 45.7640, lng: 4.8357 },
      'marseille': { lat: 43.2965, lng: 5.3698 },
      'toulouse': { lat: 43.6047, lng: 1.4442 },
      'nice': { lat: 43.7102, lng: 7.2620 },
      'florence': { lat: 43.7696, lng: 11.2558 },
      'venice': { lat: 45.4408, lng: 12.3155 },
      'naples': { lat: 40.8518, lng: 14.2681 },
      'seville': { lat: 37.3891, lng: -5.9845 },
      'valencia': { lat: 39.4699, lng: -0.3763 },
      'porto': { lat: 41.1579, lng: -8.6291 },
      'cologne': { lat: 50.9375, lng: 6.9603 },
      'frankfurt': { lat: 50.1109, lng: 8.6821 },
      // Additional adventure/nature cities
      'castellane': { lat: 43.8470, lng: 6.5142 },
      'benasque': { lat: 42.6042, lng: 0.5236 },
      'riglos': { lat: 42.3689, lng: -0.7892 },
      'cazorla': { lat: 37.9122, lng: -3.0047 },
      'sierra de cazorla': { lat: 37.9122, lng: -3.0047 },
      'hamburg': { lat: 53.5511, lng: 9.9937 },
      'edinburgh': { lat: 55.9533, lng: -3.1883 },
      'glasgow': { lat: 55.8642, lng: -4.2518 },
      'manchester': { lat: 53.4808, lng: -2.2426 },
      'liverpool': { lat: 53.4084, lng: -2.9916 },
      'krakow': { lat: 50.0647, lng: 19.9450 },
      'riga': { lat: 56.9496, lng: 24.1052 },
      'tallinn': { lat: 59.4370, lng: 24.7536 },
      'vilnius': { lat: 54.6872, lng: 25.2797 },
      'helsinki': { lat: 60.1695, lng: 24.9354 },
      'oslo': { lat: 59.9139, lng: 10.7522 },
      'reykjavik': { lat: 64.1466, lng: -21.9426 },
      'bratislava': { lat: 48.1486, lng: 17.1077 },
      'ljubljana': { lat: 46.0569, lng: 14.5058 },
      'zagreb': { lat: 45.8150, lng: 15.9819 },
      'belgrade': { lat: 44.7866, lng: 20.4489 },
      'bucharest': { lat: 44.4268, lng: 26.1025 },
      'sofia': { lat: 42.6977, lng: 23.3219 },
      'strasbourg': { lat: 48.5734, lng: 7.7521 },
      'nuremberg': { lat: 49.4521, lng: 11.0767 },
      'dresden': { lat: 51.0504, lng: 13.7373 },
      'leipzig': { lat: 51.3397, lng: 12.3731 },
      'stuttgart': { lat: 48.7758, lng: 9.1829 },
      'dusseldorf': { lat: 51.2277, lng: 6.7735 },
      'antwerp': { lat: 51.2194, lng: 4.4025 },
      'ghent': { lat: 51.0543, lng: 3.7174 },
      'bruges': { lat: 51.2093, lng: 3.2247 },
      'luxembourg': { lat: 49.6116, lng: 6.1319 },
      'salzburg': { lat: 47.8095, lng: 13.0550 },
      'innsbruck': { lat: 47.2692, lng: 11.4041 },
      'bergen': { lat: 60.3913, lng: 5.3221 },
      'gothenburg': { lat: 57.7089, lng: 11.9746 },
      'malmo': { lat: 55.6050, lng: 13.0038 },
      'aarhus': { lat: 56.1629, lng: 10.2039 },
      'odense': { lat: 55.4038, lng: 10.4024 },
      'bilbao': { lat: 43.2630, lng: -2.9350 },
      'granada': { lat: 37.1773, lng: -3.5986 },
      'cordoba': { lat: 37.8882, lng: -4.7794 },
      'palma': { lat: 39.5696, lng: 2.6502 },
      'bordeaux': { lat: 44.8378, lng: -0.5792 },
      'nantes': { lat: 47.2184, lng: -1.5536 },
      'montpellier': { lat: 43.6108, lng: 3.8767 },
      'aix-en-provence': { lat: 43.5297, lng: 5.4474 },
      'avignon': { lat: 43.9493, lng: 4.8055 },
      'moustiers-sainte-marie': { lat: 43.8447, lng: 6.2206 },
      'cannes': { lat: 43.5528, lng: 7.0174 },
      'monaco': { lat: 43.7384, lng: 7.4246 }
    };

    // Try exact match in fallback
    if (europeanCities[normalizedQuery]) {
      console.log(`   🗺️  Using fallback coordinates for "${cityName}"`);
      return europeanCities[normalizedQuery];
    }

    // Try partial match in fallback
    for (const [city, coords] of Object.entries(europeanCities)) {
      if (city.includes(normalizedQuery) || normalizedQuery.includes(city)) {
        console.log(`   🗺️  Fallback fuzzy matched "${cityName}" to "${city}"`);
        return coords;
      }
    }

    console.warn(`   ⚠️  No coordinates found for city: "${cityName}" - searches will fail!`);
    return { lat: 0, lng: 0 };
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
         SET processing_status = $1,
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
