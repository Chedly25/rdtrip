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

    // 6. Modify Itinerary
    this.register({
      name: 'modifyItinerary',
      description: 'Modify the trip itinerary by adding, removing, or updating activities, restaurants, or accommodations. Use when user wants to change their trip.',
      inputSchema: {
        type: 'object',
        properties: {
          routeId: {
            type: 'string',
            description: 'Route/itinerary ID'
          },
          action: {
            type: 'string',
            description: 'Action to perform',
            enum: ['add_activity', 'remove_activity', 'update_activity', 'add_restaurant', 'remove_restaurant', 'update_accommodation']
          },
          dayNumber: {
            type: 'number',
            description: 'Which day to modify (1-based)'
          },
          item: {
            type: 'object',
            description: 'The item to add/update (activity, restaurant, hotel data)'
          },
          itemId: {
            type: 'string',
            description: 'ID of item to remove/update (optional)'
          }
        },
        required: ['routeId', 'action', 'dayNumber', 'item']
      },
      execute: require('../tools/modifyItinerary')
    });

    // 7. Check Opening Hours
    this.register({
      name: 'checkOpeningHours',
      description: 'Check if a place (restaurant, museum, attraction) is open now or at a specific date/time. Critical for planning.',
      inputSchema: {
        type: 'object',
        properties: {
          placeName: {
            type: 'string',
            description: 'Name of the place'
          },
          placeAddress: {
            type: 'string',
            description: 'Address or city'
          },
          date: {
            type: 'string',
            description: 'Date to check (YYYY-MM-DD), defaults to today'
          }
        },
        required: ['placeName', 'placeAddress']
      },
      execute: require('../tools/checkOpeningHours')
    });

    // 8. Find Alternative
    this.register({
      name: 'findAlternative',
      description: 'Find alternative places similar to a given restaurant, hotel, or attraction. Use when user doesn\'t like a suggestion or place is closed.',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Type of place',
            enum: ['restaurant', 'hotel', 'attraction']
          },
          currentPlace: {
            type: 'string',
            description: 'Name of the current place'
          },
          location: {
            type: 'string',
            description: 'City or area'
          },
          priceLevel: {
            type: 'string',
            description: 'Price level preference',
            enum: ['budget', 'moderate', 'upscale']
          },
          cuisine: {
            type: 'string',
            description: 'For restaurants: cuisine type'
          }
        },
        required: ['type', 'currentPlace', 'location']
      },
      execute: require('../tools/findAlternative')
    });

    // 9. Currency Conversion
    this.register({
      name: 'currencyConversion',
      description: 'Convert amounts between currencies. Use when discussing costs, budgets, or prices in different currencies.',
      inputSchema: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Amount to convert'
          },
          from: {
            type: 'string',
            description: 'Source currency code (e.g., USD, EUR, GBP)'
          },
          to: {
            type: 'string',
            description: 'Target currency code'
          }
        },
        required: ['amount', 'from', 'to']
      },
      execute: require('../tools/currencyConversion')
    });

    // 10. Translate Text
    this.register({
      name: 'translateText',
      description: 'Translate text between languages. Useful for helping with phrases, menus, signs, or communication.',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to translate'
          },
          targetLanguage: {
            type: 'string',
            description: 'Target language (e.g., French, Spanish, Italian, German)'
          },
          context: {
            type: 'string',
            description: 'Optional context (e.g., "restaurant menu", "asking for directions")'
          }
        },
        required: ['text', 'targetLanguage']
      },
      execute: require('../tools/translateText')
    });

    // 11. Add Expense
    this.register({
      name: 'addExpense',
      description: 'Track an expense for the trip. Use when user mentions spending money or wants to log a cost.',
      inputSchema: {
        type: 'object',
        properties: {
          routeId: {
            type: 'string',
            description: 'Route ID'
          },
          description: {
            type: 'string',
            description: 'What the expense was for'
          },
          amount: {
            type: 'number',
            description: 'Amount spent'
          },
          currency: {
            type: 'string',
            description: 'Currency code (EUR, USD, GBP, etc.)'
          },
          category: {
            type: 'string',
            description: 'Expense category',
            enum: ['accommodation', 'food', 'transport', 'activities', 'shopping', 'other']
          },
          date: {
            type: 'string',
            description: 'Date of expense (YYYY-MM-DD), defaults to today'
          }
        },
        required: ['routeId', 'description', 'amount', 'currency', 'category']
      },
      execute: require('../tools/addExpense')
    });

    // 12. Search Hotels
    this.register({
      name: 'searchHotels',
      description: 'Search for hotels and accommodations in a city. Returns options with ratings, prices, and booking links.',
      inputSchema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'City name'
          },
          checkIn: {
            type: 'string',
            description: 'Check-in date (YYYY-MM-DD)'
          },
          checkOut: {
            type: 'string',
            description: 'Check-out date (YYYY-MM-DD)'
          },
          priceLevel: {
            type: 'string',
            description: 'Price range',
            enum: ['budget', 'moderate', 'luxury']
          },
          minRating: {
            type: 'number',
            description: 'Minimum rating (1-5), default 3.5'
          },
          limit: {
            type: 'number',
            description: 'Max results, default 5'
          }
        },
        required: ['city']
      },
      execute: require('../tools/searchHotels')
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
