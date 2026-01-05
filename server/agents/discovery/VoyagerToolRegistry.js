/**
 * VoyagerToolRegistry
 *
 * Defines all tools available to the Voyager Discovery Agent.
 * Tools follow Anthropic's function calling schema.
 */

const { CitySearchAgent } = require('./CitySearchAgent');

class VoyagerToolRegistry {
  constructor(dependencies = {}) {
    this.db = dependencies.db;
    this.googlePlacesService = dependencies.googlePlacesService;
    this.contextBuilder = dependencies.contextBuilder;
    this.cache = dependencies.cache; // Optional CitySearchCache

    // Initialize CitySearchAgent for intelligent city search
    this.citySearchAgent = new CitySearchAgent({
      cache: this.cache
    });

    this.tools = this.buildToolDefinitions();
    this.handlers = this.buildToolHandlers();
  }

  /**
   * Get all tool definitions for Claude
   */
  getToolDefinitions() {
    return this.tools;
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName, input, context = {}) {
    const handler = this.handlers[toolName];
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    console.log(`🔧 Executing tool: ${toolName}`, JSON.stringify(input).slice(0, 200));

    try {
      const result = await handler(input, context);
      console.log(`✅ Tool ${toolName} completed`);
      return result;
    } catch (error) {
      console.error(`❌ Tool ${toolName} failed:`, error.message);
      return { error: error.message };
    }
  }

  /**
   * Build Anthropic-compatible tool definitions
   */
  buildToolDefinitions() {
    return [
      // ===== CITY SEARCH =====
      {
        name: 'search_cities',
        description: `Search for cities that match specific criteria along or near the route.
Use this to find cities based on: vibe (foodie, artistic, coastal, historic, hidden gems),
geography (near a specific city, along the coast), or specific features (has markets, medieval old town).
Returns up to 5 matching cities with reasons why they match.`,
        input_schema: {
          type: 'object',
          properties: {
            criteria: {
              type: 'string',
              description: 'What kind of city to search for. Examples: "foodie city with great markets", "hidden gem coastal town", "historic medieval city", "artistic hub with museums"'
            },
            near_city: {
              type: 'string',
              description: 'Optional: Find cities near this location (e.g., "Avignon", "between Lyon and Barcelona")'
            },
            exclude_cities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Cities to exclude from results (e.g., cities already on the route)'
            },
            max_results: {
              type: 'number',
              description: 'Maximum number of results (default: 3, max: 5)'
            }
          },
          required: ['criteria']
        }
      },

      // ===== ROUTE MANIPULATION =====
      {
        name: 'add_city_to_route',
        description: `Add a city to the user's route at a specific position.
Use this after searching for or discussing a city the user wants to add.
Returns the updated route with the new city inserted.`,
        input_schema: {
          type: 'object',
          properties: {
            city_name: {
              type: 'string',
              description: 'Name of the city to add (e.g., "Sète", "Collioure")'
            },
            nights: {
              type: 'number',
              description: 'Number of nights to stay (default: 1)'
            },
            insert_after: {
              type: 'string',
              description: 'Insert after this city. If not specified, finds optimal position geographically.'
            },
            coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' }
              },
              description: 'Optional coordinates if known'
            }
          },
          required: ['city_name']
        }
      },

      {
        name: 'remove_city_from_route',
        description: `Remove a city from the user's route.
Use this when the user wants to take out a stop.
Supports fuzzy matching (e.g., "montpellier" matches "Montpellier").`,
        input_schema: {
          type: 'object',
          properties: {
            city_name: {
              type: 'string',
              description: 'Name of the city to remove'
            }
          },
          required: ['city_name']
        }
      },

      {
        name: 'replace_city',
        description: `Replace one city with another, keeping the same position and nights.
Use this when the user wants to swap a city for a different option.`,
        input_schema: {
          type: 'object',
          properties: {
            old_city: {
              type: 'string',
              description: 'City to replace'
            },
            new_city: {
              type: 'string',
              description: 'City to replace it with'
            },
            new_city_coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' }
              },
              description: 'Optional coordinates for the new city'
            }
          },
          required: ['old_city', 'new_city']
        }
      },

      {
        name: 'reorder_cities',
        description: `Reorder the cities on the route for optimal flow.
Use this to optimize driving distances or when the user asks to reorganize their stops.`,
        input_schema: {
          type: 'object',
          properties: {
            strategy: {
              type: 'string',
              enum: ['geographic', 'thematic', 'custom'],
              description: 'How to reorder: geographic (minimize driving), thematic (group similar), or custom'
            },
            custom_order: {
              type: 'array',
              items: { type: 'string' },
              description: 'For custom strategy: list of city names in desired order'
            }
          },
          required: ['strategy']
        }
      },

      {
        name: 'adjust_nights',
        description: `Change the number of nights for a city on the route.
Use when the user wants to spend more or less time somewhere.`,
        input_schema: {
          type: 'object',
          properties: {
            city_name: {
              type: 'string',
              description: 'City to adjust'
            },
            nights: {
              type: 'number',
              description: 'New number of nights (1-5)'
            }
          },
          required: ['city_name', 'nights']
        }
      },

      // ===== ROUTE ANALYSIS =====
      {
        name: 'analyze_route',
        description: `Analyze the current route for balance, pacing, and variety.
Use this to check if the route is well-designed or to find issues.
Returns insights about: total driving time, variety of experiences, pacing, and suggestions.`,
        input_schema: {
          type: 'object',
          properties: {
            focus: {
              type: 'string',
              enum: ['overall', 'driving', 'variety', 'pacing'],
              description: 'What aspect to focus on (default: overall)'
            }
          }
        }
      },

      // ===== CITY DETAILS =====
      {
        name: 'get_city_highlights',
        description: `Get detailed highlights and information about a specific city.
Use this when the user asks about a city or you need more info to make a recommendation.
Returns: top attractions, food specialties, best times to visit, vibe description.`,
        input_schema: {
          type: 'object',
          properties: {
            city_name: {
              type: 'string',
              description: 'City to get highlights for'
            },
            focus: {
              type: 'string',
              enum: ['overview', 'food', 'culture', 'outdoors', 'nightlife'],
              description: 'Optional focus area'
            }
          },
          required: ['city_name']
        }
      },

      // ===== PLACES WITHIN CITY =====
      {
        name: 'search_places_in_city',
        description: `Search for specific places (restaurants, attractions, viewpoints) within a city.
Use this when the user asks about specific venues or you want to suggest places to visit.`,
        input_schema: {
          type: 'object',
          properties: {
            city_name: {
              type: 'string',
              description: 'City to search in'
            },
            place_type: {
              type: 'string',
              enum: ['restaurant', 'attraction', 'viewpoint', 'market', 'museum', 'park', 'cafe', 'bar'],
              description: 'Type of place to search for'
            },
            query: {
              type: 'string',
              description: 'Optional search query (e.g., "seafood", "modern art", "rooftop")'
            },
            max_results: {
              type: 'number',
              description: 'Maximum results (default: 5)'
            }
          },
          required: ['city_name', 'place_type']
        }
      }
    ];
  }

  /**
   * Build tool handler functions
   */
  buildToolHandlers() {
    return {
      search_cities: this.handleSearchCities.bind(this),
      add_city_to_route: this.handleAddCity.bind(this),
      remove_city_from_route: this.handleRemoveCity.bind(this),
      replace_city: this.handleReplaceCity.bind(this),
      reorder_cities: this.handleReorderCities.bind(this),
      adjust_nights: this.handleAdjustNights.bind(this),
      analyze_route: this.handleAnalyzeRoute.bind(this),
      get_city_highlights: this.handleGetCityHighlights.bind(this),
      search_places_in_city: this.handleSearchPlaces.bind(this)
    };
  }

  // ===== TOOL HANDLERS =====

  /**
   * Search for cities matching criteria using CitySearchAgent
   * Uses intelligent intent classification and multi-source search
   */
  async handleSearchCities(input, context) {
    const { criteria, near_city, exclude_cities = [], max_results = 3 } = input;

    try {
      // Use CitySearchAgent for intelligent search
      const searchResult = await this.citySearchAgent.search(criteria, {
        nearCity: near_city,
        excludeCities: exclude_cities,
        maxResults: Math.min(max_results, 5),
        routeData: context.routeData
      });

      return {
        cities: searchResult.cities.map(c => ({
          name: c.name,
          country: c.country,
          coordinates: c.coordinates,
          reason: c.reasons?.[0] || c.description?.slice(0, 150),
          highlights: c.highlights?.slice(0, 3),
          nights_recommended: c.nightsRecommended || 1,
          hidden_gem: c.hiddenGem || false,
          score: c.score
        })),
        total_found: searchResult.cities.length,
        search_criteria: criteria,
        intent: searchResult.intent?.intent,
        confidence: searchResult.confidence,
        narrative: searchResult.narrative
      };
    } catch (error) {
      console.error('CitySearchAgent error:', error);
      // Fallback to basic search
      return this.handleSearchCitiesFallback(input, context);
    }
  }

  /**
   * Fallback search using curated database directly
   */
  async handleSearchCitiesFallback(input, context) {
    const { criteria, exclude_cities = [], max_results = 3 } = input;
    const allCities = this.getCuratedCityDatabase();

    const criteriaLower = criteria.toLowerCase();
    let matches = allCities.filter(city => {
      if (exclude_cities.some(e => e.toLowerCase() === city.name.toLowerCase())) {
        return false;
      }
      const matchesTags = city.tags.some(tag => criteriaLower.includes(tag));
      const matchesDescription = city.description.toLowerCase().includes(criteriaLower);
      return matchesTags || matchesDescription;
    });

    matches = matches.map(city => ({
      ...city,
      score: this.scoreCityMatch(city, criteriaLower)
    })).sort((a, b) => b.score - a.score);

    const results = matches.slice(0, Math.min(max_results, 5));

    return {
      cities: results.map(c => ({
        name: c.name,
        country: c.country,
        coordinates: c.coordinates,
        reason: c.matchReason || c.description,
        highlights: c.highlights,
        nights_recommended: c.nightsRecommended || 1
      })),
      total_found: matches.length,
      search_criteria: criteria
    };
  }

  /**
   * Score how well a city matches the criteria
   */
  scoreCityMatch(city, criteria) {
    let score = 0;

    // Direct tag match
    city.tags.forEach(tag => {
      if (criteria.includes(tag)) score += 10;
    });

    // Description match
    const words = criteria.split(/\s+/);
    words.forEach(word => {
      if (city.description.toLowerCase().includes(word)) score += 3;
    });

    // Boost hidden gems if criteria mentions it
    if ((criteria.includes('hidden') || criteria.includes('unusual') || criteria.includes('off-beat'))
        && city.hiddenGem) {
      score += 15;
    }

    return score;
  }

  /**
   * Curated database of cities (temporary until CitySearchAgent is built)
   */
  getCuratedCityDatabase() {
    return [
      // France - Hidden Gems
      {
        name: 'Sète',
        country: 'France',
        coordinates: { lat: 43.4075, lng: 3.6970 },
        tags: ['hidden', 'coastal', 'foodie', 'artistic'],
        description: 'Venice of Languedoc - canals, oyster bars, and Brassens legacy',
        highlights: ['Canals and bridges', 'Oyster farms', 'Mont Saint-Clair viewpoint'],
        nightsRecommended: 1,
        hiddenGem: true,
        matchReason: 'Authentic port town with canals and incredible seafood'
      },
      {
        name: 'Collioure',
        country: 'France',
        coordinates: { lat: 42.5266, lng: 3.0823 },
        tags: ['hidden', 'coastal', 'artistic', 'colorful'],
        description: 'Where Matisse invented Fauvism - pink and ochre buildings by the sea',
        highlights: ['Fauvism art trail', 'Royal Castle', 'Anchovies'],
        nightsRecommended: 1,
        hiddenGem: true,
        matchReason: 'Artistic fishing village where Matisse and Derain painted'
      },
      {
        name: 'Uzès',
        country: 'France',
        coordinates: { lat: 44.0122, lng: 4.4195 },
        tags: ['hidden', 'medieval', 'market', 'foodie'],
        description: 'First duchy of France with stunning Saturday market',
        highlights: ['Saturday market', 'Ducal palace', 'Pont du Gard nearby'],
        nightsRecommended: 1,
        hiddenGem: true,
        matchReason: 'Medieval gem with one of France\'s best markets'
      },
      {
        name: 'Aigues-Mortes',
        country: 'France',
        coordinates: { lat: 43.5672, lng: 4.1908 },
        tags: ['hidden', 'medieval', 'historic', 'unique'],
        description: 'Perfectly preserved medieval walled city in the Camargue',
        highlights: ['Complete ramparts', 'Salt marshes', 'Flamingos'],
        nightsRecommended: 1,
        hiddenGem: true,
        matchReason: 'Surreal walled city surrounded by pink salt flats'
      },

      // France - Popular but Essential
      {
        name: 'Lyon',
        country: 'France',
        coordinates: { lat: 45.7640, lng: 4.8357 },
        tags: ['foodie', 'gastronomy', 'historic', 'culture'],
        description: 'Gastronomic capital of France - Paul Bocuse\'s city',
        highlights: ['Les Halles', 'Bouchons', 'Vieux Lyon', 'Traboules'],
        nightsRecommended: 2,
        hiddenGem: false,
        matchReason: 'Unrivaled for French gastronomy and Renaissance architecture'
      },
      {
        name: 'Avignon',
        country: 'France',
        coordinates: { lat: 43.9493, lng: 4.8055 },
        tags: ['historic', 'medieval', 'culture', 'wine'],
        description: 'City of Popes with stunning medieval architecture',
        highlights: ['Palais des Papes', 'Pont d\'Avignon', 'Wine region gateway'],
        nightsRecommended: 1,
        hiddenGem: false,
        matchReason: 'Medieval papal city and gateway to Provence wines'
      },
      {
        name: 'Arles',
        country: 'France',
        coordinates: { lat: 43.6767, lng: 4.6278 },
        tags: ['artistic', 'historic', 'roman', 'photography'],
        description: 'Van Gogh\'s city with Roman arena and Camargue gateway',
        highlights: ['Roman amphitheater', 'Van Gogh trail', 'Les Rencontres photo festival'],
        nightsRecommended: 1,
        hiddenGem: false,
        matchReason: 'Where Van Gogh painted and Romans built'
      },

      // Spain
      {
        name: 'Girona',
        country: 'Spain',
        coordinates: { lat: 41.9794, lng: 2.8214 },
        tags: ['foodie', 'medieval', 'hidden', 'culture'],
        description: 'Catalonia\'s hidden gem - El Celler de Can Roca territory',
        highlights: ['Jewish Quarter', 'Cathedral steps', 'World\'s best restaurant'],
        nightsRecommended: 1,
        hiddenGem: true,
        matchReason: 'Medieval beauty with world-class gastronomy'
      },
      {
        name: 'Figueres',
        country: 'Spain',
        coordinates: { lat: 42.2666, lng: 2.9614 },
        tags: ['artistic', 'surreal', 'museum', 'culture'],
        description: 'Dalí\'s birthplace and home of his surreal museum',
        highlights: ['Dalí Theatre-Museum', 'Rambla promenade', 'Catalan cuisine'],
        nightsRecommended: 1,
        hiddenGem: false,
        matchReason: 'Surrealist pilgrimage to Dalí\'s theatrical museum'
      },
      {
        name: 'Cadaqués',
        country: 'Spain',
        coordinates: { lat: 42.2886, lng: 3.2764 },
        tags: ['hidden', 'coastal', 'artistic', 'peaceful'],
        description: 'White-washed fishing village where Dalí lived',
        highlights: ['Dalí\'s house', 'Cap de Creus', 'Pristine beaches'],
        nightsRecommended: 1,
        hiddenGem: true,
        matchReason: 'Remote artists\' retreat at the edge of Spain'
      },

      // Coastal
      {
        name: 'Cassis',
        country: 'France',
        coordinates: { lat: 43.2145, lng: 5.5378 },
        tags: ['coastal', 'hidden', 'nature', 'wine'],
        description: 'Pastel port town with dramatic Calanques',
        highlights: ['Calanques boat trip', 'White wine', 'Cap Canaille cliffs'],
        nightsRecommended: 1,
        hiddenGem: true,
        matchReason: 'Gateway to the stunning Calanques with excellent white wine'
      },
      {
        name: 'Antibes',
        country: 'France',
        coordinates: { lat: 43.5808, lng: 7.1239 },
        tags: ['coastal', 'historic', 'artistic', 'yachts'],
        description: 'Old town charm meets superyacht glamour',
        highlights: ['Picasso Museum', 'Provençal market', 'Cap d\'Antibes'],
        nightsRecommended: 1,
        hiddenGem: false,
        matchReason: 'Best of the Riviera without Nice\'s crowds'
      }
    ];
  }

  /**
   * Add a city to the route
   */
  async handleAddCity(input, context) {
    const { city_name, nights = 1, insert_after, coordinates, reason } = input;
    const { sessionId, routeData, onRouteUpdate } = context;

    // Get or geocode coordinates
    let cityCoords = coordinates;
    let resolvedCountry = 'Unknown';
    
    if (!cityCoords) {
      const geocodeResult = await this.geocodeCityWithDetails(city_name);
      if (geocodeResult) {
        cityCoords = geocodeResult.coordinates;
        resolvedCountry = geocodeResult.country || 'Unknown';
      }
    }

    // Validate coordinates
    if (!cityCoords || (cityCoords.lat === 0 && cityCoords.lng === 0)) {
      console.warn(`⚠️ [VoyagerToolRegistry] Could not geocode city: ${city_name}`);
      return {
        success: false,
        error: `Could not find location for ${city_name}`
      };
    }

    // Determine insertion position
    const waypoints = routeData?.waypoints || [];
    let insertIndex = waypoints.length;

    if (insert_after) {
      const afterIndex = waypoints.findIndex(wp =>
        (wp.city || wp.name).toLowerCase() === insert_after.toLowerCase()
      );
      if (afterIndex !== -1) {
        insertIndex = afterIndex + 1;
      }
    } else if (cityCoords) {
      // Find optimal position geographically
      insertIndex = this.findOptimalInsertPosition(waypoints, cityCoords);
    }

    // Build full city data object matching DiscoveryCity interface for frontend
    const cityData = {
      name: city_name,
      country: resolvedCountry,
      coordinates: {
        lat: cityCoords.lat,
        lng: cityCoords.lng
      },
      suggestedNights: nights,
      nights: nights,
      isSelected: true,
      description: reason || `Added by your travel companion`
    };

    // Build new waypoint (for internal tracking)
    const newWaypoint = {
      city: city_name,
      name: city_name,
      nights: nights,
      coordinates: cityCoords,
      lat: cityCoords?.lat,
      lng: cityCoords?.lng
    };

    // Insert into waypoints
    const updatedWaypoints = [...waypoints];
    updatedWaypoints.splice(insertIndex, 0, newWaypoint);

    // Notify frontend via callback
    if (onRouteUpdate) {
      onRouteUpdate({
        type: 'add_city',
        city: newWaypoint,
        index: insertIndex,
        waypoints: updatedWaypoints
      });
    }

    // Record action
    if (this.contextBuilder && sessionId) {
      await this.contextBuilder.recordAction(sessionId, 'city_added', {
        cityName: city_name,
        nights,
        position: insertIndex
      });
    }

    console.log(`✅ [VoyagerToolRegistry] City added: ${city_name}, ${resolvedCountry} at index ${insertIndex}`);

    // Return in the format expected by AgentProvider frontend handler
    return {
      success: true,
      action: 'add_city_to_route',
      city: cityData,  // Full city object for frontend
      insertAfterIndex: insertIndex > 0 ? insertIndex - 1 : undefined,
      reason: reason,
      message: `Added ${city_name} (${nights} night${nights > 1 ? 's' : ''}) at position ${insertIndex + 1}`
    };
  }

  /**
   * Geocode a city and return full details including country
   */
  async geocodeCityWithDetails(cityName) {
    try {
      const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
      if (!GOOGLE_PLACES_API_KEY) {
        console.warn('[VoyagerToolRegistry] No Google Places API key');
        return null;
      }

      const axios = require('axios');
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cityName)}&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await axios.get(geocodeUrl, { timeout: 10000 });

      if (response.data.status !== 'OK' || !response.data.results[0]) {
        return null;
      }

      const result = response.data.results[0];
      const location = result.geometry.location;
      
      // Extract country from address components
      const addressComponents = result.address_components || [];
      const countryComponent = addressComponents.find(c => c.types.includes('country'));

      return {
        coordinates: { lat: location.lat, lng: location.lng },
        country: countryComponent?.long_name || 'Unknown'
      };
    } catch (error) {
      console.error('[VoyagerToolRegistry] Geocoding error:', error.message);
      return null;
    }
  }

  /**
   * Find optimal position to insert a city based on geography
   */
  findOptimalInsertPosition(waypoints, newCoords) {
    if (waypoints.length < 2) return waypoints.length;

    let bestIndex = waypoints.length;
    let minAddedDistance = Infinity;

    for (let i = 0; i <= waypoints.length; i++) {
      const prev = i > 0 ? waypoints[i - 1] : null;
      const next = i < waypoints.length ? waypoints[i] : null;

      let addedDistance = 0;

      if (prev && next) {
        const prevCoords = prev.coordinates || { lat: prev.lat, lng: prev.lng };
        const nextCoords = next.coordinates || { lat: next.lat, lng: next.lng };

        // Distance without new city
        const directDist = this.calculateDistance(prevCoords, nextCoords);
        // Distance with new city
        const withNewDist = this.calculateDistance(prevCoords, newCoords) +
                           this.calculateDistance(newCoords, nextCoords);

        addedDistance = withNewDist - directDist;
      } else if (prev) {
        const prevCoords = prev.coordinates || { lat: prev.lat, lng: prev.lng };
        addedDistance = this.calculateDistance(prevCoords, newCoords);
      } else if (next) {
        const nextCoords = next.coordinates || { lat: next.lat, lng: next.lng };
        addedDistance = this.calculateDistance(newCoords, nextCoords);
      }

      if (addedDistance < minAddedDistance) {
        minAddedDistance = addedDistance;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(coord1, coord2) {
    if (!coord1?.lat || !coord2?.lat) return Infinity;

    const R = 6371;
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Geocode a city name to coordinates
   */
  async geocodeCity(cityName) {
    // Try curated database first
    const curated = this.getCuratedCityDatabase().find(
      c => c.name.toLowerCase() === cityName.toLowerCase()
    );
    if (curated) return curated.coordinates;

    // Fall back to Google Places if available
    if (this.googlePlacesService) {
      try {
        const results = await this.googlePlacesService.searchPlaces(cityName, {
          type: 'locality'
        });
        if (results?.[0]?.geometry?.location) {
          return {
            lat: results[0].geometry.location.lat,
            lng: results[0].geometry.location.lng
          };
        }
      } catch (err) {
        console.warn('Geocoding failed:', err.message);
      }
    }

    return null;
  }

  /**
   * Remove a city from the route
   */
  async handleRemoveCity(input, context) {
    const { city_name } = input;
    const { sessionId, routeData, onRouteUpdate } = context;

    const waypoints = routeData?.waypoints || [];
    const cityLower = city_name.toLowerCase();

    const index = waypoints.findIndex(wp =>
      (wp.city || wp.name).toLowerCase() === cityLower
    );

    if (index === -1) {
      return {
        success: false,
        error: `City "${city_name}" not found on route`
      };
    }

    const removed = waypoints[index];
    const updatedWaypoints = waypoints.filter((_, i) => i !== index);

    if (onRouteUpdate) {
      onRouteUpdate({
        type: 'remove_city',
        city: removed,
        index,
        waypoints: updatedWaypoints
      });
    }

    if (this.contextBuilder && sessionId) {
      await this.contextBuilder.recordAction(sessionId, 'city_removed', {
        cityName: removed.city || removed.name
      });
    }

    return {
      success: true,
      action: 'removed',
      city: removed.city || removed.name,
      total_stops: updatedWaypoints.length,
      message: `Removed ${removed.city || removed.name} from route`
    };
  }

  /**
   * Replace one city with another
   */
  async handleReplaceCity(input, context) {
    const { old_city, new_city, new_city_coordinates } = input;
    const { sessionId, routeData, onRouteUpdate } = context;

    const waypoints = routeData?.waypoints || [];
    const oldLower = old_city.toLowerCase();

    const index = waypoints.findIndex(wp =>
      (wp.city || wp.name).toLowerCase() === oldLower
    );

    if (index === -1) {
      return {
        success: false,
        error: `City "${old_city}" not found on route`
      };
    }

    const oldWaypoint = waypoints[index];
    const newCoords = new_city_coordinates || await this.geocodeCity(new_city);

    const newWaypoint = {
      city: new_city,
      name: new_city,
      nights: oldWaypoint.nights || 1,
      coordinates: newCoords,
      lat: newCoords?.lat,
      lng: newCoords?.lng
    };

    const updatedWaypoints = [...waypoints];
    updatedWaypoints[index] = newWaypoint;

    if (onRouteUpdate) {
      onRouteUpdate({
        type: 'replace_city',
        oldCity: oldWaypoint,
        newCity: newWaypoint,
        index,
        waypoints: updatedWaypoints
      });
    }

    if (this.contextBuilder && sessionId) {
      await this.contextBuilder.recordAction(sessionId, 'city_replaced', {
        oldCity: old_city,
        newCity: new_city
      });
    }

    return {
      success: true,
      action: 'replaced',
      old_city: old_city,
      new_city: new_city,
      nights_preserved: newWaypoint.nights,
      message: `Replaced ${old_city} with ${new_city}`
    };
  }

  /**
   * Reorder cities on the route
   */
  async handleReorderCities(input, context) {
    const { strategy, custom_order } = input;
    const { routeData, onRouteUpdate } = context;

    const waypoints = routeData?.waypoints || [];

    if (waypoints.length < 2) {
      return {
        success: false,
        error: 'Not enough cities to reorder'
      };
    }

    let newOrder;

    if (strategy === 'custom' && custom_order) {
      // Custom order provided
      newOrder = custom_order.map(cityName => {
        const wp = waypoints.find(w =>
          (w.city || w.name).toLowerCase() === cityName.toLowerCase()
        );
        return wp;
      }).filter(Boolean);
    } else if (strategy === 'geographic') {
      // Optimize by geography (nearest neighbor heuristic)
      newOrder = this.optimizeGeographically(waypoints);
    } else {
      // Default: return current order
      newOrder = waypoints;
    }

    if (onRouteUpdate) {
      onRouteUpdate({
        type: 'reorder',
        waypoints: newOrder
      });
    }

    return {
      success: true,
      action: 'reordered',
      strategy,
      new_order: newOrder.map(wp => wp.city || wp.name),
      message: `Reordered route using ${strategy} strategy`
    };
  }

  /**
   * Optimize route geographically using nearest neighbor
   */
  optimizeGeographically(waypoints) {
    if (waypoints.length < 3) return waypoints;

    // Keep first and last fixed (origin and destination)
    const first = waypoints[0];
    const last = waypoints[waypoints.length - 1];
    const middle = waypoints.slice(1, -1);

    // Simple nearest-neighbor for middle points
    const ordered = [first];
    const remaining = [...middle];

    let current = first;
    while (remaining.length > 0) {
      const currentCoords = current.coordinates || { lat: current.lat, lng: current.lng };

      let nearestIdx = 0;
      let nearestDist = Infinity;

      remaining.forEach((wp, idx) => {
        const wpCoords = wp.coordinates || { lat: wp.lat, lng: wp.lng };
        const dist = this.calculateDistance(currentCoords, wpCoords);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      });

      current = remaining.splice(nearestIdx, 1)[0];
      ordered.push(current);
    }

    ordered.push(last);
    return ordered;
  }

  /**
   * Adjust nights for a city
   */
  async handleAdjustNights(input, context) {
    const { city_name, nights } = input;
    const { sessionId, routeData, onRouteUpdate } = context;

    const waypoints = routeData?.waypoints || [];
    const cityLower = city_name.toLowerCase();

    const index = waypoints.findIndex(wp =>
      (wp.city || wp.name).toLowerCase() === cityLower
    );

    if (index === -1) {
      return {
        success: false,
        error: `City "${city_name}" not found on route`
      };
    }

    const oldNights = waypoints[index].nights || 1;
    const updatedWaypoints = [...waypoints];
    updatedWaypoints[index] = { ...waypoints[index], nights };

    if (onRouteUpdate) {
      onRouteUpdate({
        type: 'adjust_nights',
        city: city_name,
        oldNights,
        newNights: nights,
        waypoints: updatedWaypoints
      });
    }

    if (this.contextBuilder && sessionId) {
      await this.contextBuilder.recordAction(sessionId, 'nights_adjusted', {
        city: city_name,
        from: oldNights,
        to: nights
      });
    }

    return {
      success: true,
      action: 'adjusted',
      city: city_name,
      old_nights: oldNights,
      new_nights: nights,
      message: `Changed ${city_name} from ${oldNights} to ${nights} night${nights > 1 ? 's' : ''}`
    };
  }

  /**
   * Analyze the current route
   */
  async handleAnalyzeRoute(input, context) {
    const { focus = 'overall' } = input;
    const { routeData } = context;

    const waypoints = routeData?.waypoints || [];

    if (waypoints.length < 2) {
      return {
        success: false,
        error: 'Not enough cities to analyze'
      };
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const prevCoords = prev.coordinates || { lat: prev.lat, lng: prev.lng };
      const currCoords = curr.coordinates || { lat: curr.lat, lng: curr.lng };
      totalDistance += this.calculateDistance(prevCoords, currCoords);
    }

    // Calculate total nights
    const totalNights = waypoints.reduce((sum, wp) => sum + (wp.nights || 1), 0);

    // Average per city
    const avgNights = totalNights / waypoints.length;

    // Identify issues
    const issues = [];
    const suggestions = [];

    // Check for imbalanced nights
    const maxNights = Math.max(...waypoints.map(wp => wp.nights || 1));
    const minNights = Math.min(...waypoints.map(wp => wp.nights || 1));
    if (maxNights > minNights * 3) {
      issues.push('Nights are unevenly distributed');
      suggestions.push('Consider rebalancing time between cities');
    }

    // Check for too many stops
    if (waypoints.length > totalNights * 0.8) {
      issues.push('Route might be too rushed');
      suggestions.push('Consider removing a stop or adding nights');
    }

    // Check for long drives
    const longDrives = [];
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const prevCoords = prev.coordinates || { lat: prev.lat, lng: prev.lng };
      const currCoords = curr.coordinates || { lat: curr.lat, lng: curr.lng };
      const dist = this.calculateDistance(prevCoords, currCoords);
      if (dist > 300) {
        longDrives.push({
          from: prev.city || prev.name,
          to: curr.city || curr.name,
          distance: Math.round(dist)
        });
      }
    }

    if (longDrives.length > 0) {
      issues.push(`${longDrives.length} drive(s) over 300km`);
      suggestions.push('Consider adding a stop to break up long drives');
    }

    return {
      success: true,
      analysis: {
        total_stops: waypoints.length,
        total_nights: totalNights,
        total_distance_km: Math.round(totalDistance),
        average_nights_per_city: Math.round(avgNights * 10) / 10,
        cities: waypoints.map(wp => ({
          name: wp.city || wp.name,
          nights: wp.nights || 1
        })),
        issues,
        suggestions,
        long_drives: longDrives,
        overall_assessment: issues.length === 0
          ? 'Route looks well-balanced!'
          : `Found ${issues.length} issue(s) to consider`
      }
    };
  }

  /**
   * Get highlights for a city
   */
  async handleGetCityHighlights(input, context) {
    const { city_name, focus } = input;

    // Check curated database first
    const curated = this.getCuratedCityDatabase().find(
      c => c.name.toLowerCase() === city_name.toLowerCase()
    );

    if (curated) {
      return {
        success: true,
        city: curated.name,
        country: curated.country,
        vibe: curated.description,
        highlights: curated.highlights,
        tags: curated.tags,
        nights_recommended: curated.nightsRecommended,
        hidden_gem: curated.hiddenGem
      };
    }

    // Fall back to basic info
    return {
      success: true,
      city: city_name,
      vibe: `A destination worth exploring`,
      highlights: ['Local attractions', 'Regional cuisine', 'Cultural sites'],
      nights_recommended: 1,
      note: 'Detailed info coming in Phase 2 with CitySearchAgent'
    };
  }

  /**
   * Search for places within a city
   */
  async handleSearchPlaces(input, context) {
    const { city_name, place_type, query, max_results = 5 } = input;

    // This will be enhanced in Phase 2 with Google Places
    // For now, return a placeholder response

    return {
      success: true,
      city: city_name,
      place_type,
      query,
      places: [],
      note: 'Full place search coming in Phase 2 with Google Places integration',
      suggestion: `For now, I can recommend general ${place_type} options in ${city_name} based on my knowledge.`
    };
  }
}

module.exports = VoyagerToolRegistry;
