/**
 * City Intelligence Agents Index
 *
 * Exports all city intelligence agents for easy importing.
 *
 * Agent Categories:
 * - Core Agents (Phase 2): TimeAgent, StoryAgent, PreferenceAgent, ClusterAgent
 * - Enhancement Agents (Phase 3): GemsAgent, LogisticsAgent, WeatherAgent, PhotoAgent
 */

const BaseAgent = require('./BaseAgent');

// Core Agents (Phase 2)
const TimeAgent = require('./TimeAgent');
const StoryAgent = require('./StoryAgent');
const PreferenceAgent = require('./PreferenceAgent');
const ClusterAgent = require('./ClusterAgent');

// Enhancement Agents (Phase 3)
const GemsAgent = require('./GemsAgent');
const LogisticsAgent = require('./LogisticsAgent');
const WeatherAgent = require('./WeatherAgent');
const PhotoAgent = require('./PhotoAgent');

// Agent registry for dynamic instantiation
const AgentRegistry = {
  // Core
  TimeAgent,
  StoryAgent,
  PreferenceAgent,
  ClusterAgent,
  // Enhancement
  GemsAgent,
  LogisticsAgent,
  WeatherAgent,
  PhotoAgent
};

/**
 * Create and register all agents with the orchestrator
 */
function registerAgents(orchestrator) {
  console.log('📋 Registering City Intelligence Agents...');

  // Phase 1: Foundation agents (run in parallel)
  const coreAgents = [
    new TimeAgent(),
    new StoryAgent(),
    new PreferenceAgent()
  ];

  // Phase 2: Agents with dependencies
  const dependentAgents = [
    new ClusterAgent(),  // Depends on TimeAgent
    new GemsAgent()      // Depends on PreferenceAgent
  ];

  // Phase 3: Enhancement agents (can run in parallel)
  const enhancementAgents = [
    new LogisticsAgent(),
    new WeatherAgent(),  // Depends on ClusterAgent (for outdoor activities)
    new PhotoAgent()
  ];

  const allAgents = [...coreAgents, ...dependentAgents, ...enhancementAgents];

  allAgents.forEach(agent => {
    orchestrator.registerAgent(agent);
  });

  console.log(`✅ Registered ${allAgents.length} agents:`);
  console.log(`   - Core: ${coreAgents.map(a => a.name).join(', ')}`);
  console.log(`   - Dependent: ${dependentAgents.map(a => a.name).join(', ')}`);
  console.log(`   - Enhancement: ${enhancementAgents.map(a => a.name).join(', ')}`);

  return allAgents;
}

/**
 * Get agent by name
 */
function getAgent(name) {
  const AgentClass = AgentRegistry[name];
  if (!AgentClass) {
    throw new Error(`Unknown agent: ${name}`);
  }
  return new AgentClass();
}

/**
 * Get all agent definitions
 */
function getAgentDefinitions() {
  return Object.entries(AgentRegistry).map(([name, AgentClass]) => {
    const instance = new AgentClass();
    return instance.getDefinition();
  });
}

module.exports = {
  // Base
  BaseAgent,

  // Core Agents
  TimeAgent,
  StoryAgent,
  PreferenceAgent,
  ClusterAgent,

  // Enhancement Agents
  GemsAgent,
  LogisticsAgent,
  WeatherAgent,
  PhotoAgent,

  // Utilities
  AgentRegistry,
  registerAgents,
  getAgent,
  getAgentDefinitions
};
