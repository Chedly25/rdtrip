/**
 * ToolRegistry - All Tool Definitions
 *
 * Registers tools available to the agent with their schemas
 * Tools are defined using Anthropic's tool format
 */

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerAllTools();
  }

  /**
   * Register all tools
   */
  registerAllTools() {
    console.log('📋 Registering agent tools...');

    // 1. Check Weather
    this.register({
      name: 'checkWeather',
      description: 'Get weather forecast for a location. Returns current weather and forecast with temperature, conditions, rain probability.',
      inputSchema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name (e.g., "Paris, France")'
          },
          date: {
            type: 'string',
            description: 'Date to check (YYYY-MM-DD), defaults to today'
          }
        },
        required: ['location']
      },
      execute: require('../tools/checkWeather')
    });

    // 2. Web Search
    this.register({
      name: 'webSearch',
      description: 'Search the web for travel information, tips, guides. Use this for questions about destinations, local customs, best time to visit, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          }
        },
        required: ['query']
      },
      execute: require('../tools/webSearch')
    });

    // 3. Search Activities
    this.register({
      name: 'searchActivities',
      description: 'Search for tourist activities, attractions, museums, parks in a city. Returns top-rated activities with photos, ratings, and details.',
      inputSchema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name (e.g., "Paris, France")'
          },
          category: {
            type: 'string',
            description: 'Activity category',
            enum: ['museum', 'park', 'attraction', 'restaurant', 'outdoor', 'cultural']
          },
          limit: {
            type: 'number',
            description: 'Max results to return (default: 5)'
          }
        },
        required: ['city']
      },
      execute: require('../tools/searchActivities')
    });

    // 4. Get Directions
    this.register({
      name: 'getDirections',
      description: 'Get navigation directions between two locations. Returns route, distance, duration.',
      inputSchema: {
        type: 'object',
        properties: {
          from: {
            type: 'string',
            description: 'Start location'
          },
          to: {
            type: 'string',
            description: 'Destination location'
          },
          mode: {
            type: 'string',
            description: 'Transportation mode',
            enum: ['driving', 'walking', 'cycling'],
            default: 'driving'
          }
        },
        required: ['from', 'to']
      },
      execute: require('../tools/getDirections')
    });

    // 5. Get City Info
    this.register({
      name: 'getCityInfo',
      description: 'Get comprehensive information about a city (overview, culture, tips, safety). Great for answering "tell me about" questions.',
      inputSchema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name'
          },
          focus: {
            type: 'string',
            description: 'What aspect to focus on',
            enum: ['overview', 'culture', 'food', 'safety', 'tips'],
            default: 'overview'
          }
        },
        required: ['city']
      },
      execute: require('../tools/getCityInfo')
    });

    console.log(`✅ Registered ${this.tools.size} tools`);
  }

  /**
   * Register a tool
   */
  register({ name, description, inputSchema, execute }) {
    this.tools.set(name, {
      definition: {
        name,
        description,
        input_schema: inputSchema
      },
      execute
    });
  }

  /**
   * Get all tool definitions for Claude API
   */
  getToolDefinitions() {
    return Array.from(this.tools.values()).map(tool => tool.definition);
  }

  /**
   * Get tool executor by name
   */
  getTool(name) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool;
  }
}

module.exports = ToolRegistry;
