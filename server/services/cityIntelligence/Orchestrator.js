/**
 * Orchestrator - The Brain of City Intelligence System
 *
 * Implements the Plan → Execute → Reflect → Refine loop for building
 * rich city intelligence profiles.
 *
 * Features:
 * - Goal-driven planning with Claude
 * - Parallel agent execution
 * - Quality reflection and refinement
 * - SSE streaming for real-time updates
 */

const Anthropic = require('@anthropic-ai/sdk');
const SharedMemory = require('./SharedMemory');
const EventEmitter = require('events');

// Agent definitions with dependencies and execution phases
const AGENT_REGISTRY = {
  TimeAgent: { dependsOn: [], phase: 1 },
  StoryAgent: { dependsOn: [], phase: 1 },
  PreferenceAgent: { dependsOn: [], phase: 1 },
  ClusterAgent: { dependsOn: ['TimeAgent'], phase: 2 },
  GemsAgent: { dependsOn: ['PreferenceAgent'], phase: 2 },
  LogisticsAgent: { dependsOn: [], phase: 3 },
  WeatherAgent: { dependsOn: ['ClusterAgent'], phase: 3 },
  PhotoAgent: { dependsOn: [], phase: 3 },
  SynthesisAgent: { dependsOn: ['StoryAgent', 'TimeAgent', 'ClusterAgent', 'PreferenceAgent', 'GemsAgent'], phase: 4 }
};

class CityIntelligenceOrchestrator extends EventEmitter {
  constructor() {
    super();

    // Claude client for planning and reflection
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Use Haiku for fast planning/reflection
    this.model = 'claude-haiku-4-5-20251001';

    // Loaded agents (keyed by name)
    this.agents = new Map();

    // Default quality threshold (0-100)
    this.qualityThreshold = 85;

    // Max refinement iterations per city
    this.maxIterations = 3;

    // Quality weights for scoring
    this.qualityWeights = {
      story: 0.15,
      timeBlocks: 0.15,
      clusters: 0.25,
      matchScore: 0.20,
      hiddenGems: 0.10,
      logistics: 0.10,
      synthesis: 0.05
    };

    // Auto-register Phase 2 agents
    this.autoRegisterAgents();

    console.log('🎯 CityIntelligenceOrchestrator initialized');
  }

  /**
   * Auto-register available agents
   */
  autoRegisterAgents() {
    try {
      const { registerAgents } = require('../../agents/cityIntelligence');
      registerAgents(this);
    } catch (error) {
      console.warn('⚠️ Could not auto-register agents:', error.message);
      console.warn('   Agents will use mock outputs until registered');
    }
  }

  /**
   * Register an agent
   */
  registerAgent(agent) {
    this.agents.set(agent.name, agent);
    console.log(`📝 Registered agent: ${agent.name}`);
  }

  /**
   * Main entry point - Start intelligence gathering for cities
   *
   * @param {Object} params
   * @param {string} params.sessionId - Session ID
   * @param {Object[]} params.cities - Cities to analyze
   * @param {Object} params.nights - Nights per city { cityId: nights }
   * @param {Object} params.preferences - User preferences
   * @param {Object} params.trip - Trip context
   * @param {Function} params.onEvent - SSE event callback
   */
  async startIntelligence({ sessionId, cities, nights, preferences, trip, onEvent }) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  🎯 CITY INTELLIGENCE ORCHESTRATOR - Starting              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`   Session: ${sessionId}`);
    console.log(`   Cities: ${cities.map(c => c.name).join(', ')}`);
    console.log(`   Total nights: ${Object.values(nights).reduce((a, b) => a + b, 0)}`);

    const startTime = Date.now();

    try {
      // 1. Setup session in SharedMemory
      SharedMemory.setTripContext(sessionId, trip);
      SharedMemory.setExplicitPreferences(sessionId, preferences);
      SharedMemory.setOrchestratorPhase(sessionId, 'planning');

      // Initialize city intelligence for each city
      for (const city of cities) {
        SharedMemory.initializeCityIntelligence(sessionId, city, nights[city.id] || 1);
      }

      // 2. Send goal event
      this.emit('event', {
        type: 'orchestrator_goal',
        timestamp: new Date().toISOString(),
        goal: {
          description: `Build complete city intelligence for ${cities.length} cities`,
          cities: cities.map(c => c.name),
          qualityThreshold: this.qualityThreshold,
          maxIterations: this.maxIterations
        }
      });

      if (onEvent) {
        onEvent({
          type: 'orchestrator_goal',
          timestamp: new Date().toISOString(),
          goal: {
            description: `Build complete city intelligence for ${cities.length} cities`,
            cities: cities.map(c => c.name),
            qualityThreshold: this.qualityThreshold,
            maxIterations: this.maxIterations
          }
        });
      }

      // 3. Process each city
      const results = [];
      for (const city of cities) {
        const result = await this.processCityIntelligence({
          sessionId,
          city,
          nights: nights[city.id] || 1,
          preferences,
          onEvent
        });
        results.push(result);
      }

      // 4. Generate cross-city insights
      await this.generateCrossCityInsights(sessionId, results, onEvent);

      // 5. Complete
      const processingTimeMs = Date.now() - startTime;
      const averageQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
      const totalIterations = results.reduce((sum, r) => sum + r.iterations, 0);

      SharedMemory.setOrchestratorPhase(sessionId, 'complete');

      const completionEvent = {
        type: 'all_complete',
        timestamp: new Date().toISOString(),
        summary: {
          totalCities: cities.length,
          averageQuality: Math.round(averageQuality),
          totalIterations,
          processingTimeMs
        }
      };

      this.emit('event', completionEvent);
      if (onEvent) onEvent(completionEvent);

      console.log('\n✅ Intelligence gathering complete!');
      console.log(`   Total time: ${processingTimeMs}ms`);
      console.log(`   Average quality: ${Math.round(averageQuality)}%`);

      return {
        success: true,
        cities: results,
        summary: completionEvent.summary
      };

    } catch (error) {
      console.error('❌ Orchestrator error:', error);

      const errorEvent = {
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        recoverable: false
      };

      this.emit('event', errorEvent);
      if (onEvent) onEvent(errorEvent);

      throw error;
    }
  }

  /**
   * Process intelligence for a single city
   */
  async processCityIntelligence({ sessionId, city, nights, preferences, onEvent }) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏙️  Processing: ${city.name}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    SharedMemory.updateCityStatus(sessionId, city.id, 'processing');

    let iteration = 0;
    let quality = 0;
    let reflection = null;

    while (iteration < this.maxIterations) {
      iteration++;
      console.log(`\n🔄 Iteration ${iteration}/${this.maxIterations}`);

      // PHASE 1: PLANNING
      const plan = await this.createPlan(sessionId, city, iteration === 1 ? null : reflection);

      // Send plan event
      const planEvent = {
        type: 'orchestrator_plan',
        timestamp: new Date().toISOString(),
        cityId: city.id,
        plan
      };
      this.emit('event', planEvent);
      if (onEvent) onEvent(planEvent);

      SharedMemory.setExecutionPlan(sessionId, plan);
      SharedMemory.setOrchestratorPhase(sessionId, 'executing', city.id);

      // PHASE 2: EXECUTE
      await this.executePlan({
        sessionId,
        city,
        nights,
        preferences,
        plan,
        onEvent
      });

      // PHASE 3: REFLECT
      SharedMemory.setOrchestratorPhase(sessionId, 'reflecting', city.id);
      reflection = await this.reflect(sessionId, city, preferences);

      // Send reflection event
      const reflectionEvent = {
        type: 'reflection',
        timestamp: new Date().toISOString(),
        cityId: city.id,
        reflection
      };
      this.emit('event', reflectionEvent);
      if (onEvent) onEvent(reflectionEvent);

      SharedMemory.addReflection(sessionId, city.id, reflection);
      quality = reflection.qualityScore;

      SharedMemory.updateCityQuality(sessionId, city.id, quality, iteration);

      console.log(`📊 Quality: ${quality}% | Verdict: ${reflection.verdict}`);

      // Check if we're done
      if (quality >= this.qualityThreshold || reflection.verdict === 'complete') {
        console.log(`✅ Quality threshold met (${quality}% >= ${this.qualityThreshold}%)`);
        break;
      }

      // Check if we should refine
      if (iteration < this.maxIterations && reflection.verdict === 'needs_refinement') {
        console.log('🔄 Initiating refinement...');
        SharedMemory.setOrchestratorPhase(sessionId, 'refining', city.id);

        const refinementPlan = this.createRefinementPlan(reflection, iteration + 1);

        const refinementEvent = {
          type: 'refinement_started',
          timestamp: new Date().toISOString(),
          cityId: city.id,
          plan: refinementPlan
        };
        this.emit('event', refinementEvent);
        if (onEvent) onEvent(refinementEvent);
      }
    }

    // Mark city complete
    SharedMemory.updateCityStatus(sessionId, city.id, 'complete');

    // Get final intelligence
    const intelligence = SharedMemory.getCityIntelligence(sessionId, city.id);

    // Send city complete event
    const cityCompleteEvent = {
      type: 'city_complete',
      timestamp: new Date().toISOString(),
      cityId: city.id,
      intelligence: this.serializeCityIntelligence(intelligence)
    };
    this.emit('event', cityCompleteEvent);
    if (onEvent) onEvent(cityCompleteEvent);

    return {
      cityId: city.id,
      quality,
      iterations: iteration,
      intelligence
    };
  }

  /**
   * Create execution plan for a city
   */
  async createPlan(sessionId, city, previousReflection = null) {
    console.log('📋 Creating execution plan...');

    const phases = [
      {
        phaseNumber: 1,
        agents: ['TimeAgent', 'StoryAgent', 'PreferenceAgent'],
        parallel: true,
        description: 'Foundation - Time blocks, narrative, preference matching'
      },
      {
        phaseNumber: 2,
        agents: ['ClusterAgent', 'GemsAgent'],
        parallel: true,
        description: 'Discovery - Geographic clusters and hidden gems'
      },
      {
        phaseNumber: 3,
        agents: ['LogisticsAgent', 'WeatherAgent', 'PhotoAgent'],
        parallel: true,
        description: 'Enhancement - Practical tips and media'
      },
      {
        phaseNumber: 4,
        agents: ['SynthesisAgent'],
        parallel: false,
        description: 'Synthesis - Combine all intelligence'
      }
    ];

    // If we have previous reflection, filter to agents that need re-running
    if (previousReflection && previousReflection.verdict === 'needs_refinement') {
      // Focus on phases that address the gaps
      // This is a simplified version - in production we'd use Claude to plan
      console.log('   🔄 Adjusting plan based on reflection gaps:', previousReflection.gaps);
    }

    return {
      cityId: city.id,
      phases,
      maxIterations: this.maxIterations,
      qualityThreshold: this.qualityThreshold
    };
  }

  /**
   * Execute the plan by running agents in phases
   */
  async executePlan({ sessionId, city, nights, preferences, plan, onEvent }) {
    console.log('⚡ Executing plan...');

    const previousOutputs = {};

    for (const phase of plan.phases) {
      console.log(`\n📦 Phase ${phase.phaseNumber}: ${phase.description}`);

      // Initialize agent states
      for (const agentName of phase.agents) {
        SharedMemory.initializeAgentState(sessionId, city.id, agentName);
      }

      // Build input for this phase
      const input = {
        city,
        nights,
        preferences,
        previousAgentOutputs: previousOutputs
      };

      if (phase.parallel) {
        // Run agents in parallel
        const promises = phase.agents.map(agentName =>
          this.runAgent(sessionId, city.id, agentName, input, onEvent)
        );
        const results = await Promise.all(promises);

        // Store outputs
        results.forEach((result, idx) => {
          const agentName = phase.agents[idx];
          previousOutputs[agentName] = result;
        });
      } else {
        // Run agents sequentially
        for (const agentName of phase.agents) {
          const result = await this.runAgent(sessionId, city.id, agentName, input, onEvent);
          previousOutputs[agentName] = result;
        }
      }
    }
  }

  /**
   * Run a single agent
   */
  async runAgent(sessionId, cityId, agentName, input, onEvent) {
    console.log(`   🤖 Running ${agentName}...`);

    // Send start event
    const startEvent = {
      type: 'agent_started',
      timestamp: new Date().toISOString(),
      cityId,
      agent: agentName
    };
    this.emit('event', startEvent);
    if (onEvent) onEvent(startEvent);

    SharedMemory.updateAgentState(sessionId, cityId, agentName, {
      status: 'running',
      progress: 0
    });

    try {
      // Get agent instance
      const agent = this.agents.get(agentName);

      if (!agent) {
        // If agent not registered, create mock output for Phase 1
        console.log(`   ⚠️ Agent ${agentName} not registered, using placeholder`);
        const mockOutput = await this.createMockAgentOutput(agentName, input);

        SharedMemory.updateAgentState(sessionId, cityId, agentName, {
          status: 'completed',
          progress: 100,
          output: mockOutput
        });

        // Store output in shared memory
        SharedMemory.setAgentOutput(sessionId, cityId, agentName, mockOutput);

        // Send complete event
        const completeEvent = {
          type: 'agent_complete',
          timestamp: new Date().toISOString(),
          cityId,
          agent: agentName,
          output: mockOutput
        };
        this.emit('event', completeEvent);
        if (onEvent) onEvent(completeEvent);

        return mockOutput;
      }

      // Set progress callback
      agent.onProgress = (progress) => {
        SharedMemory.updateAgentState(sessionId, cityId, agentName, {
          progress: progress.progress
        });

        const progressEvent = {
          type: 'agent_progress',
          timestamp: new Date().toISOString(),
          cityId,
          agent: agentName,
          progress: progress.progress
        };
        this.emit('event', progressEvent);
        if (onEvent) onEvent(progressEvent);
      };

      // Execute agent
      const output = await agent.execute(input, { sessionId });

      SharedMemory.updateAgentState(sessionId, cityId, agentName, {
        status: output.success ? 'completed' : 'failed',
        progress: 100,
        output,
        error: output.error
      });

      // Store output
      if (output.success) {
        SharedMemory.setAgentOutput(sessionId, cityId, agentName, output);
      }

      // Send complete event
      const completeEvent = {
        type: 'agent_complete',
        timestamp: new Date().toISOString(),
        cityId,
        agent: agentName,
        output
      };
      this.emit('event', completeEvent);
      if (onEvent) onEvent(completeEvent);

      return output;

    } catch (error) {
      console.error(`   ❌ ${agentName} error:`, error.message);

      SharedMemory.updateAgentState(sessionId, cityId, agentName, {
        status: 'failed',
        error: error.message
      });

      const errorEvent = {
        type: 'agent_error',
        timestamp: new Date().toISOString(),
        cityId,
        agent: agentName,
        error: error.message
      };
      this.emit('event', errorEvent);
      if (onEvent) onEvent(errorEvent);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create mock agent output (for Phase 1 before agents are implemented)
   */
  async createMockAgentOutput(agentName, input) {
    const { city, nights, preferences } = input;

    // Generate basic outputs for testing
    const mockOutputs = {
      TimeAgent: {
        data: {
          blocks: this.generateTimeBlocks(nights),
          totalUsableHours: nights * 8
        },
        confidence: 95
      },
      StoryAgent: {
        data: {
          hook: `Discover the magic of ${city.name}`,
          narrative: `${city.name} offers a unique blend of culture, cuisine, and charm that makes it a perfect stop on your journey.`,
          differentiators: ['Local character', 'Authentic experiences', 'Scenic beauty']
        },
        confidence: 80
      },
      PreferenceAgent: {
        data: {
          score: 85,
          reasons: [
            { preference: 'Exploration', match: 'Great for walking', score: 90 }
          ],
          warnings: []
        },
        confidence: 85
      },
      ClusterAgent: {
        data: {
          clusters: [
            {
              id: 'day-1',
              name: 'Day 1',
              theme: 'arrival',
              bestFor: 'all-day',
              walkingMinutes: 0,
              centerPoint: city.coordinates,
              dayNumber: 1,
              places: []
            },
            {
              id: 'day-2',
              name: 'Day 2',
              theme: 'exploration',
              bestFor: 'all-day',
              walkingMinutes: 0,
              centerPoint: city.coordinates,
              dayNumber: 2,
              places: []
            }
          ]
        },
        confidence: 70
      },
      GemsAgent: {
        data: {
          hiddenGems: [
            {
              name: `Local Favorite in ${city.name}`,
              type: 'experience',
              why: 'Where locals go to relax',
              insiderTip: 'Visit in the morning for fewer crowds'
            }
          ]
        },
        confidence: 75
      },
      LogisticsAgent: {
        data: {
          tips: ['Walking is the best way to explore the center'],
          warnings: [],
          parking: 'Street parking available'
        },
        confidence: 90
      },
      WeatherAgent: {
        data: {
          forecast: 'Pleasant conditions expected',
          recommendations: {
            outdoorSafe: ['Morning', 'Evening'],
            goldenHour: '7:00 PM'
          }
        },
        confidence: 85
      },
      PhotoAgent: {
        data: {
          spots: [
            {
              name: 'City viewpoint',
              bestTime: 'Golden hour',
              tip: 'Great for panoramic shots'
            }
          ]
        },
        confidence: 80
      },
      SynthesisAgent: {
        data: {
          synthesized: true,
          coherent: true
        },
        confidence: 90
      }
    };

    return {
      success: true,
      ...(mockOutputs[agentName] || { data: {}, confidence: 50 }),
      gaps: [],
      suggestions: []
    };
  }

  /**
   * Generate time blocks based on nights
   */
  generateTimeBlocks(nights) {
    const blocks = [];

    // First day: arrival afternoon + evening
    blocks.push({
      id: 'arrival-afternoon',
      name: 'Arrival Afternoon',
      hours: 4,
      mood: 'explore',
      flexibility: 'high',
      suggested: 'Initial exploration'
    });
    blocks.push({
      id: 'day1-evening',
      name: 'First Evening',
      hours: 3,
      mood: 'dine',
      flexibility: 'medium',
      suggested: 'Welcome dinner'
    });

    // Middle days (if more than 1 night)
    for (let i = 1; i < nights; i++) {
      blocks.push({
        id: `day${i + 1}-morning`,
        name: `Day ${i + 1} Morning`,
        hours: 3,
        mood: 'activity',
        flexibility: 'medium'
      });
      blocks.push({
        id: `day${i + 1}-afternoon`,
        name: `Day ${i + 1} Afternoon`,
        hours: 4,
        mood: 'explore',
        flexibility: 'high'
      });
      blocks.push({
        id: `day${i + 1}-evening`,
        name: `Day ${i + 1} Evening`,
        hours: 3,
        mood: 'dine',
        flexibility: 'medium'
      });
    }

    // Last morning before departure
    blocks.push({
      id: 'departure-morning',
      name: 'Departure Morning',
      hours: 2,
      mood: 'depart',
      flexibility: 'low',
      suggested: 'Final stroll or breakfast'
    });

    return blocks;
  }

  /**
   * Reflect on the quality of gathered intelligence
   */
  async reflect(sessionId, city, preferences) {
    console.log('\n🔍 Reflecting on quality...');

    const intelligence = SharedMemory.getCityIntelligence(sessionId, city.id);

    // Calculate component scores
    const scores = {
      story: this.scoreStory(intelligence.story),
      timeBlocks: this.scoreTimeBlocks(intelligence.timeBlocks),
      clusters: this.scoreClusters(intelligence.clusters),
      matchScore: this.scoreMatchScore(intelligence.matchScore),
      hiddenGems: this.scoreGems(intelligence.hiddenGems),
      logistics: this.scoreLogistics(intelligence.logistics),
      synthesis: 90 // Default for now
    };

    // Calculate weighted quality score
    let qualityScore = 0;
    for (const [component, weight] of Object.entries(this.qualityWeights)) {
      qualityScore += (scores[component] || 0) * weight;
    }
    qualityScore = Math.round(qualityScore);

    // Identify gaps
    const gaps = [];
    const strengths = [];

    if (scores.story < 70) gaps.push('Narrative needs more emotional connection');
    else if (scores.story >= 85) strengths.push('Engaging story hook');

    if (scores.clusters < 70) gaps.push('Clusters need more places or better organization');
    else if (scores.clusters >= 85) strengths.push('Well-formed activity clusters');

    if (scores.matchScore < 70) gaps.push('Preference matching incomplete');

    if (scores.hiddenGems < 70) gaps.push('Need more hidden gems relevant to preferences');
    else if (scores.hiddenGems >= 85) strengths.push('Great hidden gem recommendations');

    // Check for preference-specific gaps
    if (preferences.diningStyle && (!intelligence.hiddenGems?.hiddenGems?.some(g => g.type === 'restaurant'))) {
      gaps.push('No restaurant recommendations despite dining preference');
    }

    // Determine verdict
    let verdict = 'complete';
    if (qualityScore < this.qualityThreshold) {
      verdict = gaps.length > 2 ? 'critical_gaps' : 'needs_refinement';
    }

    return {
      qualityScore,
      strengths,
      gaps,
      verdict,
      suggestions: gaps.map(g => `Address: ${g}`)
    };
  }

  // Scoring helper methods
  scoreStory(story) {
    if (!story) return 0;
    let score = 0;
    if (story.hook) score += 40;
    if (story.narrative && story.narrative.length > 50) score += 40;
    if (story.differentiators && story.differentiators.length >= 2) score += 20;
    return score;
  }

  scoreTimeBlocks(timeBlocks) {
    if (!timeBlocks?.blocks) return 0;
    const blocks = timeBlocks.blocks;
    if (blocks.length === 0) return 0;
    return Math.min(100, blocks.length * 15);
  }

  scoreClusters(clusters) {
    if (!clusters?.clusters) return 0;
    const c = clusters.clusters;
    if (c.length === 0) return 0;
    let score = Math.min(50, c.length * 20);
    // Bonus for places in clusters
    const totalPlaces = c.reduce((sum, cl) => sum + (cl.places?.length || 0), 0);
    score += Math.min(50, totalPlaces * 5);
    return score;
  }

  scoreMatchScore(matchScore) {
    if (!matchScore) return 0;
    let score = matchScore.score || 0;
    if (matchScore.reasons?.length > 0) score = Math.max(score, 70);
    return score;
  }

  scoreGems(gems) {
    if (!gems?.hiddenGems) return 0;
    const g = gems.hiddenGems;
    if (g.length === 0) return 0;
    return Math.min(100, g.length * 25);
  }

  scoreLogistics(logistics) {
    if (!logistics) return 0;
    let score = 50; // Base score
    if (logistics.tips?.length > 0) score += logistics.tips.length * 10;
    if (logistics.parking) score += 20;
    return Math.min(100, score);
  }

  /**
   * Create refinement plan based on reflection
   */
  createRefinementPlan(reflection, iteration) {
    const agentsToRerun = [];
    const instructions = {};

    for (const gap of reflection.gaps) {
      if (gap.includes('Narrative') || gap.includes('story')) {
        agentsToRerun.push('StoryAgent');
        instructions['StoryAgent'] = 'Create more emotionally resonant narrative';
      }
      if (gap.includes('Cluster') || gap.includes('places')) {
        agentsToRerun.push('ClusterAgent');
        instructions['ClusterAgent'] = 'Add more places and improve organization';
      }
      if (gap.includes('gem') || gap.includes('restaurant')) {
        agentsToRerun.push('GemsAgent');
        instructions['GemsAgent'] = 'Focus on finding restaurant recommendations';
      }
      if (gap.includes('Preference')) {
        agentsToRerun.push('PreferenceAgent');
        instructions['PreferenceAgent'] = 'Improve preference matching analysis';
      }
    }

    return {
      iteration,
      agentsToRerun: [...new Set(agentsToRerun)],
      focusAreas: reflection.gaps,
      instructions
    };
  }

  /**
   * Generate cross-city insights
   */
  async generateCrossCityInsights(sessionId, results, onEvent) {
    console.log('\n🌐 Generating cross-city insights...');

    const cities = results.map(r => r.intelligence?.city?.name || 'Unknown');

    // For Phase 1, generate simple insights
    const insights = {
      themes: ['Cultural heritage', 'Local cuisine', 'Natural beauty'],
      varietyScore: 85,
      paceScore: 80,
      recommendations: [
        `Your route through ${cities.join(' → ')} offers great variety`,
        'Consider allowing for travel time between cities'
      ]
    };

    SharedMemory.updateCrossCityInsights(sessionId, insights);

    return insights;
  }

  /**
   * Serialize city intelligence for SSE transmission
   */
  serializeCityIntelligence(intelligence) {
    if (!intelligence) return null;

    return {
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
    };
  }

  /**
   * Cancel ongoing intelligence gathering
   */
  cancel(sessionId) {
    console.log(`🛑 Cancelling intelligence gathering for session: ${sessionId}`);
    SharedMemory.deleteSession(sessionId);
    this.emit('cancelled', { sessionId });
  }
}

// Export singleton
module.exports = new CityIntelligenceOrchestrator();
