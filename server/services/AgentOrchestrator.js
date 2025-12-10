/**
 * AgentOrchestrator - The Brain
 *
 * Uses Claude Haiku 4.5 for fast, cost-efficient agent responses
 * Handles function calling, streaming, and conversation management
 */

const Anthropic = require('@anthropic-ai/sdk');
const ToolRegistry = require('./ToolRegistry');
const MemoryService = require('./MemoryService');
const { Pool } = require('pg');

class AgentOrchestrator {
  constructor() {
    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Claude Haiku 4.5 model
    this.model = 'claude-haiku-4-5-20251001';

    // Tools available to agent
    this.toolRegistry = new ToolRegistry();

    // Database connection
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Memory service for conversation history and preferences
    this.memoryService = new MemoryService(this.db);

    // Max iterations to prevent infinite loops
    this.maxIterations = 10;

    console.log('🤖 AgentOrchestrator initialized with Claude Haiku 4.5 + Memory');
  }

  /**
   * Load complete itinerary data from database
   * Includes all days, activities, restaurants, cities
   */
  async loadItineraryData(itineraryId) {
    if (!itineraryId) {
      console.log('   ⚠️  No itinerary ID provided');
      return null;
    }

    try {
      console.log(`   🔍 Loading itinerary ${itineraryId}...`);

      const result = await this.db.query(`
        SELECT
          i.id,
          i.route_id,
          i.day_structure,
          i.activities,
          i.restaurants,
          r.route_data
        FROM itineraries i
        LEFT JOIN routes r ON i.route_id = r.id
        WHERE i.id = $1
      `, [itineraryId]);

      if (result.rows.length === 0) {
        console.log('   ⚠️  Itinerary not found');
        return null;
      }

      const row = result.rows[0];
      const dayStructure = row.day_structure || {};
      const activitiesData = row.activities || [];
      const restaurantsData = row.restaurants || [];
      const routeData = row.route_data || {};

      // Build days array by combining day_structure with activities
      const dayStructureDays = dayStructure.days || [];
      const days = activitiesData.map((dayActivities) => {
        const dayNum = dayActivities.day;
        const structure = dayStructureDays.find(d => d.day === dayNum) || {};
        const dayRestaurants = restaurantsData.find(r => r.day === dayNum) || {};

        return {
          dayNumber: dayNum,
          city: dayActivities.city || structure.location || 'Unknown',
          date: dayActivities.date || structure.date || null,
          activities: dayActivities.activities || [],
          restaurants: {
            breakfast: dayRestaurants.breakfast || [],
            lunch: dayRestaurants.lunch || [],
            dinner: dayRestaurants.dinner || []
          },
          accommodation: null // Can be added if needed
        };
      });

      // Extract unique cities
      const cities = days.map(day => day.city).filter(Boolean);

      // Build structured data
      const data = {
        itineraryId: row.id,
        routeId: row.route_id,
        origin: routeData.origin,
        destination: routeData.destination,
        cities: cities,
        days: days,
        totalDays: days.length,
        budget: routeData.budget || null
      };

      console.log(`   ✅ Loaded: ${data.totalDays} days, ${cities.length} cities (${cities.join(', ')})`);
      return data;

    } catch (error) {
      console.error('   ❌ Error loading itinerary:', error.message);
      console.error('   Stack:', error.stack);
      return null;
    }
  }

  /**
   * Main entry point for agent queries
   *
   * @param {Object} params
   * @param {string} params.userId - Current user ID
   * @param {string} params.routeId - Current route ID (optional)
   * @param {string} params.itineraryId - Current itinerary ID (optional)
   * @param {string} params.message - User's message
   * @param {string} params.sessionId - Conversation session ID
   * @param {Object} params.pageContext - Current page info
   * @param {Object} params.discoveryContext - Discovery phase context (selected cities, etc.)
   * @param {Function} params.onStream - Callback for streaming chunks
   */
  async handleQuery({
    userId,
    routeId,
    itineraryId,
    message,
    sessionId,
    pageContext,
    discoveryContext,
    onStream
  }) {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  🤖 AGENT ORCHESTRATOR - handleQuery      ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('   User ID:', userId);
    console.log('   Route ID:', routeId);
    console.log('   Itinerary ID:', itineraryId);
    console.log('   Session ID:', sessionId);
    console.log('   Message:', message);
    console.log('   Page Context:', pageContext);

    try {
      console.log('\n[Step 1/9] Getting or creating conversation...');
      // 1. Get or create conversation
      const conversationId = await this.getOrCreateConversation(userId, routeId, sessionId);
      console.log('   ✅ Conversation ID:', conversationId);
      console.log('   🔑 Session ID for this conversation:', sessionId);

      console.log('[Step 2/9] Building context...');

      // 2. Load itinerary data if available
      let itineraryData = null;
      if (itineraryId) {
        console.log('[Step 2.1/9] Loading itinerary data...');
        itineraryData = await this.loadItineraryData(itineraryId);
        if (itineraryData) {
          console.log(`   ✅ Loaded itinerary: ${itineraryData.totalDays} days, ${itineraryData.cities.length} cities`);
        }
      }

      // 3. Build context with itinerary data and discovery context
      const context = {
        userId,
        routeId,
        conversationId,
        pageContext: pageContext || {},
        sessionId,
        itineraryData,
        discoveryContext: discoveryContext || null  // ✅ Add discovery context
      };
      console.log('   ✅ Context built');
      if (discoveryContext) {
        console.log(`   📍 Discovery context: ${discoveryContext.cities?.selected?.length || 0} selected cities, phase: ${discoveryContext.phase}`);
      }

      console.log('[Step 3/9] Getting conversation history...');
      // 3. Get conversation history (last 10 messages)
      const conversationHistory = await this.getConversationHistory(sessionId);
      console.log('   ✅ History messages:', conversationHistory.length);
      if (conversationHistory.length > 0) {
        const lastMsg = conversationHistory[conversationHistory.length - 1];
        console.log(`   📜 Last message: ${lastMsg.role} - "${lastMsg.content.substring(0, 100)}..."`);
      }

      console.log('[Step 4/9] Getting memories and preferences...');
      // 4. Get relevant memories and preferences
      const memories = await this.memoryService.getRelevantMemories(userId, message, 5);
      const preferences = await this.memoryService.getPreferences(userId);
      console.log('   ✅ Memories:', memories.length, '| Preferences:', Object.keys(preferences).length);

      console.log('[Step 5/9] Building system prompt...');
      // 5. Build system prompt with memory context
      const systemPrompt = this.buildSystemPrompt(context, memories, preferences);
      console.log('   ✅ System prompt length:', systemPrompt.length, 'chars');

      console.log('[Step 6/9] Preparing messages for Claude...');
      // 5. Prepare messages for Claude
      const messages = [
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ];
      console.log('   ✅ Total messages:', messages.length);

      console.log('[Step 7/9] Saving user message to DB...');
      // 6. Save user message
      await this.saveMessage({
        conversationId,
        role: 'user',
        content: message,
        contextSnapshot: { page: pageContext }
      });
      console.log('   ✅ User message saved');

      console.log('[Step 8/9] Running agent loop with Claude...');
      // 7. Run agent loop with Claude
      const response = await this.runAgentLoop({
        systemPrompt,
        messages,
        context,
        onStream
      });
      console.log('   ✅ Agent loop completed');

      console.log('[Step 9/9] Saving assistant response to DB...');
      // 8. Save assistant response
      const messageId = await this.saveMessage({
        conversationId,
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
        toolResults: response.toolResults,
        contextSnapshot: { page: pageContext }
      });
      console.log('   ✅ Assistant response saved');

      console.log('📝 Storing conversation memory (async)...');
      // 9. Store conversation in memory (asynchronously to not block response)
      this.storeConversationMemory(userId, messageId, message, response.content, context).catch(err => {
        console.warn('Failed to store memory:', err);
      });

      console.log('✅ handleQuery completed successfully');
      console.log('╚════════════════════════════════════════════╝\n');
      return response;

    } catch (error) {
      console.error('❌ [ORCHESTRATOR] Agent error:', error);
      console.error('❌ [ORCHESTRATOR] Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Agent loop with tool calling
   * Implements: think → act → observe → repeat
   */
  async runAgentLoop({ systemPrompt, messages, context, onStream }) {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  🔄 AGENT LOOP - Starting                 ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('   Max iterations:', this.maxIterations);
    console.log('   Initial messages count:', messages.length);
    console.log('   Available tools:', this.toolRegistry.getToolDefinitions().length);

    let currentMessages = [...messages];
    let iteration = 0;
    let finalResponse = null;
    let allToolCalls = [];
    let allToolResults = [];

    while (iteration < this.maxIterations) {
      iteration++;
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🔄 [LOOP] Iteration ${iteration}/${this.maxIterations}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      console.log('🤖 [LOOP] Calling Claude API...');
      console.log('   Model:', this.model);
      console.log('   Messages:', currentMessages.length);

      // Call Claude with streaming
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: currentMessages,
        tools: this.toolRegistry.getToolDefinitions(),
        stream: true
      });

      console.log('📡 [LOOP] Claude API stream started, processing events...');

      let assistantMessage = '';
      let toolUses = [];
      let eventCount = 0;

      // Stream handler
      for await (const event of response) {
        eventCount++;
        if (eventCount % 10 === 0) {
          console.log(`   Processed ${eventCount} stream events...`);
        }

        if (event.type === 'content_block_start') {
          console.log('   [Stream] content_block_start:', event.content_block.type);
          if (event.content_block.type === 'tool_use') {
            // Tool call started
            console.log('   🔧 [Stream] Tool call detected:', event.content_block.name);
            toolUses.push({
              id: event.content_block.id,
              name: event.content_block.name,
              input: '' // Initialize as empty string for concatenation
            });
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            // Stream text to frontend
            assistantMessage += event.delta.text;
            if (onStream) {
              onStream({
                type: 'text',
                content: event.delta.text
              });
            }
          } else if (event.delta.type === 'input_json_delta') {
            // Tool input delta - concatenate chunks to build complete JSON
            if (toolUses.length > 0) {
              const currentTool = toolUses[toolUses.length - 1];
              // Concatenate partial JSON chunks (like we do with text)
              currentTool.input = (currentTool.input || '') + event.delta.partial_json;
            }
          }
        }
      }

      console.log(`✅ [LOOP] Claude stream completed. Total events: ${eventCount}`);
      console.log('   Assistant message length:', assistantMessage.length);
      console.log('   Tool calls detected:', toolUses.length);

      // If no tool calls, we're done
      if (toolUses.length === 0) {
        console.log('🏁 [LOOP] No tool calls - agent loop complete!');
        finalResponse = {
          content: assistantMessage,
          toolCalls: allToolCalls,
          toolResults: allToolResults
        };
        break;
      }

      console.log('🔧 [LOOP] Tool calls detected, parsing inputs...');
      // Parse tool inputs
      toolUses = toolUses.map((use, idx) => {
        try {
          console.log(`   Tool #${idx + 1} "${use.name}" raw input (${typeof use.input}):`, use.input.slice(0, 200));
          const parsedInput = typeof use.input === 'string' ? JSON.parse(use.input) : use.input;
          console.log(`   Tool #${idx + 1} parsed successfully`);
          return { ...use, input: parsedInput };
        } catch (error) {
          console.error(`   ❌ Failed to parse tool #${idx + 1} "${use.name}" input:`, error.message);
          console.error(`   Raw input was:`, use.input);
          throw error;
        }
      });

      console.log('🔧 [LOOP] Tools to execute:');
      toolUses.forEach((use, idx) => {
        console.log(`   ${idx + 1}. ${use.name}(${JSON.stringify(use.input).slice(0, 100)}...)`);
      });

      // Execute tool calls
      console.log(`\n🔨 [LOOP] Executing ${toolUses.length} tool(s)...`);
      const toolResults = await this.executeTools(toolUses, context, onStream);
      console.log(`✅ [LOOP] All tools executed`);

      allToolCalls.push(...toolUses);
      allToolResults.push(...toolResults);

      // Add assistant message + tool results to conversation
      currentMessages.push({
        role: 'assistant',
        content: [
          ...(assistantMessage ? [{ type: 'text', text: assistantMessage }] : []),
          ...toolUses.map(use => ({
            type: 'tool_use',
            id: use.id,
            name: use.name,
            input: use.input
          }))
        ]
      });

      currentMessages.push({
        role: 'user',
        content: toolResults.map(result => ({
          type: 'tool_result',
          tool_use_id: result.tool_use_id,
          content: result.content
        }))
      });

      // Stream tool results to frontend
      if (onStream) {
        onStream({
          type: 'tool_execution',
          tools: toolUses.map((use, idx) => ({
            name: use.name,
            input: use.input,
            content: toolResults[idx].content  // Changed from 'result' to 'content' to match frontend
          }))
        });
      }

      // Continue loop - Claude will process tool results and respond
    }

    if (!finalResponse) {
      // Max iterations reached
      finalResponse = {
        content: "I've tried multiple approaches but couldn't complete your request. Could you rephrase or break it into smaller steps?",
        toolCalls: allToolCalls,
        toolResults: allToolResults
      };
    }

    return finalResponse;
  }

  /**
   * Execute tool calls in parallel with real-time streaming
   */
  async executeTools(toolUses, context, onStream) {
    const results = await Promise.all(
      toolUses.map(async (use) => {
        try {
          console.log(`      → ${use.name}(...)`);

          // Stream tool_start event
          if (onStream) {
            onStream({
              type: 'tool_start',
              tool: {
                name: use.name,
                input: use.input
              }
            });
          }

          const tool = this.toolRegistry.getTool(use.name);
          const result = await tool.execute(use.input, context);

          console.log(`      ✅ ${use.name} completed`);

          // Stream tool_complete event
          if (onStream) {
            onStream({
              type: 'tool_complete',
              tool: {
                name: use.name,
                input: use.input,
                result: result
              }
            });
          }

          return {
            tool_use_id: use.id,
            content: JSON.stringify(result)
          };
        } catch (error) {
          console.error(`      ❌ ${use.name} failed:`, error.message);

          // Stream tool_error event
          if (onStream) {
            onStream({
              type: 'tool_error',
              tool: {
                name: use.name,
                error: error.message
              }
            });
          }

          return {
            tool_use_id: use.id,
            content: JSON.stringify({
              error: true,
              message: error.message
            })
          };
        }
      })
    );

    return results;
  }

  /**
   * Build system prompt with context injection + memory
   */
  buildSystemPrompt(context, memories = [], preferences = {}) {
    const { pageContext, itineraryData, discoveryContext } = context;

    // Extract personalization from page context
    const personalization = pageContext?.personalization || {};

    let prompt = `You are an expert travel assistant for Waycraft, a road trip planning platform that crafts personalized journeys.

**Your Capabilities**:
- Check weather forecasts for any location
- Search for activities, attractions, and restaurants
- Get directions and navigation info
- Search the web for travel tips and information
- Provide city and destination information
- Help plan and modify itineraries

**Your Personality**:
- Helpful and enthusiastic about travel
- Concise and to the point (2-3 paragraphs max)
- Actionable - always suggest next steps
- Honest - if you don't know something, use your tools to find out
${this.buildPersonalizationPrompt(personalization)}
⚠️ **CRITICAL: CONVERSATION MEMORY** ⚠️
BEFORE responding to ANY message, ALWAYS check the conversation history:

1. **Did YOU just present options to the user?**
   - If your previous message listed museums/restaurants/activities
   - And asked "Which would you prefer?" or "Which one do you like?"
   - Then the user's current message is THEIR CHOICE from your list!
   - ✅ IMMEDIATELY call the appropriate tool (replaceActivity, addActivity, etc.)
   - ❌ NEVER say "I don't have context" - YOU presented the options!

2. **Example of CORRECT behavior:**
   YOU (Message 1): "I found 5 museums: Musée Granet, Fondation Vasarely... Which would you prefer?"
   USER (Message 2): "musée granet"
   YOU (Message 3): ✅ Call replaceActivity with Musée Granet
   YOU (Message 3): ❌ DON'T ask "what were we doing?" - YOU KNOW!

3. **How to check history:**
   - Look at the LAST assistant message (yours!)
   - Did it end with a question about choosing?
   - If yes, user's response is the answer!
   - Extract the choice and complete the action!

**Current Context**:
- Page: ${pageContext.page || 'unknown'}`;

    // Add itinerary-specific context if available
    if (itineraryData) {
      prompt += `\n\n**Current Trip Itinerary**:
- Route: ${itineraryData.origin || 'Unknown'} → ${itineraryData.destination || 'Unknown'}
- Duration: ${itineraryData.totalDays} day${itineraryData.totalDays !== 1 ? 's' : ''}
- Cities: ${itineraryData.cities.join(' → ')}`;

      if (itineraryData.budget) {
        prompt += `\n- Budget: ${itineraryData.budget}`;
      }

      // Add day-by-day summary (COUNTS ONLY - use searchItinerary tool for details)
      if (itineraryData.days && itineraryData.days.length > 0) {
        prompt += `\n\n**Daily Plan Summary** (Activity counts - use searchItinerary tool to find specific activities):`;
        itineraryData.days.forEach(day => {
          const activityCount = day.activities?.length || 0;
          const restaurantCount = (day.restaurants?.breakfast?.length || 0) +
                                 (day.restaurants?.lunch?.length || 0) +
                                 (day.restaurants?.dinner?.length || 0);

          prompt += `\n- Day ${day.dayNumber} (${day.city}): ${activityCount} activit${activityCount !== 1 ? 'ies' : 'y'}, ${restaurantCount} meal${restaurantCount !== 1 ? 's' : ''}`;
        });

        prompt += `\n\n**EFFICIENT APPROACH**: Use searchItinerary tool to find activities by name instead of listing everything here. Saves tokens!`;
      }

      // Add current day details if viewing specific day
      const currentDay = pageContext?.currentDay;
      if (currentDay && itineraryData.days[currentDay - 1]) {
        const day = itineraryData.days[currentDay - 1];

        prompt += `\n\n**Currently Viewing**: Day ${day.dayNumber} in ${day.city}`;

        if (day.activities && day.activities.length > 0) {
          prompt += `\n\n**Planned Activities for Day ${day.dayNumber}**:`;
          day.activities.forEach((activity, i) => {
            prompt += `\n${i + 1}. ${activity.name || 'Unnamed activity'}`;
            if (activity.description) {
              prompt += ` - ${activity.description}`;
            }
          });
        }

        if (day.restaurants) {
          prompt += `\n\n**Planned Meals for Day ${day.dayNumber}**:`;
          if (day.restaurants.breakfast?.length > 0) {
            prompt += `\n- Breakfast: ${day.restaurants.breakfast[0].name}`;
          }
          if (day.restaurants.lunch?.length > 0) {
            prompt += `\n- Lunch: ${day.restaurants.lunch[0].name}`;
          }
          if (day.restaurants.dinner?.length > 0) {
            prompt += `\n- Dinner: ${day.restaurants.dinner[0].name}`;
          }
        }
      }

      prompt += `\n\n**CRITICAL CONTEXT AWARENESS RULES**:

1. **City Name Extraction**: When user mentions a city (like "aix en provence", "paris", "lyon"):
   - Check if it matches any city in the cities list above
   - Accept fuzzy matches (e.g., "aix" matches "Aix-en-Provence")
   - If found, use the EXACT city name from the list

2. **Activity Replacement**: When user says "change X" or "replace X":
   - They want to MODIFY an existing activity in the itinerary
   - Find which day has that activity
   - Use searchActivities to find alternatives in the SAME CITY
   - The city is already known from the context above

3. **Same-City Rule**:
   - When replacing activities, ALWAYS search in the same city
   - Example: If replacing "Chaîne d'Eguilles" on Day 3 (Aix-en-Provence), search in Aix-en-Provence

4. **No City Questions**:
   - If the city is mentioned in user's message OR already in context, DON'T ask "Which city?"
   - Extract it yourself and proceed

**Example Interaction**:
User: "Let's change chaine d'eguilles from the aix en provence activities"
✅ GOOD: Extract "Aix-en-Provence" → searchActivities(city: "Aix-en-Provence, France")
❌ BAD: Ask "Which city are you interested in?"`;
    } else if (discoveryContext) {
      // ✅ Discovery phase context - user is exploring/planning their route
      // This provides rich context about selected cities, suggested cities, favourites, etc.
      const { trip, cities, favourites, behaviour, phase } = discoveryContext;

      prompt += `\n\n**🧭 DISCOVERY PHASE CONTEXT** (User is planning their trip - no itinerary generated yet):

**The Route:**
- Origin: ${trip?.origin?.name || 'Unknown'}, ${trip?.origin?.country || ''}
- Destination: ${trip?.destination?.name || 'Unknown'}, ${trip?.destination?.country || ''}
- Total Trip: ${trip?.dates?.totalNights || 0} nights
- Traveller Type: ${trip?.travellerType || 'Not specified'}
${trip?.totalDistanceKm ? `- Distance: ~${Math.round(trip.totalDistanceKm)}km` : ''}`;

      // Selected cities
      if (cities?.selected && cities.selected.length > 0) {
        prompt += `\n\n**Cities They've Selected:**`;
        cities.selected.forEach((city, i) => {
          const nights = city.nights > 1 ? `${city.nights} nights` : '1 night';
          prompt += `\n${i + 1}. ${city.name}, ${city.country} (${nights})`;
        });
      }

      // Available cities they can add
      if (cities?.available && cities.available.length > 0) {
        prompt += `\n\n**Suggested Cities They Could Add:**`;
        cities.available.slice(0, 5).forEach((city) => {
          prompt += `\n- ${city.name}, ${city.country} (${city.placeCount} places to explore)`;
        });
        if (cities.available.length > 5) {
          prompt += `\n- ...and ${cities.available.length - 5} more options`;
        }
      }

      // Favourites
      if (favourites && favourites.length > 0) {
        prompt += `\n\n**Places They've Favourited:**`;
        favourites.forEach((fav) => {
          prompt += `\n- ${fav.name} (${fav.type}) in ${fav.cityName}`;
        });
      }

      // Behaviour signals
      if (behaviour) {
        prompt += `\n\n**What You Know About Their Preferences:**`;
        if (behaviour.favouritePlaceTypes?.length > 0) {
          prompt += `\n- Interested in: ${behaviour.favouritePlaceTypes.join(', ')}`;
        }
        if (behaviour.prefersHiddenGems) {
          prompt += `\n- Prefers hidden gems over tourist spots`;
        }
      }

      prompt += `\n\n**Phase:** ${phase || 'exploring'}

**HOW TO HELP IN DISCOVERY PHASE:**
- Answer questions about any of the cities mentioned above
- Help them decide which cities to add or skip
- Suggest hidden gems and local experiences in their selected cities
- Give weather info, activity recommendations, food tips
- Help them understand if their nights allocation makes sense
- Be a knowledgeable friend helping them plan an amazing trip
- **ADD CITIES TO THEIR ROUTE** when they ask - use addCityToRoute tool!

**IMPORTANT RULES:**
- You KNOW their route - don't ask "where are you going?"
- You KNOW their selected cities - don't ask "which cities?"
- Use searchActivities, checkWeather, getCityInfo tools to provide helpful info
- Be proactive: "Since you're spending 2 nights in Lyon, you should definitely visit..."

**🏙️ ADDING CITIES - CRITICAL RESPONSE RULES:**
When user asks to add cities to their trip (e.g., "add Lyon", "I want to stop in Berlin"):
1. Use the addCityToRoute tool for EACH city
2. After adding, respond with ONLY the new cities you added - example:
   "I've added **3 new stops** to your trip:
   • **Lyon, France** (1 night) - Great gastronomy scene
   • **Berlin, Germany** (1 night) - Vibrant nightlife
   • **Copenhagen, Denmark** (1 night) - Before heading to Norway"
3. **DO NOT** list the entire route or repeat cities that were already there
4. Mention the new total nights count at the end
5. Keep it brief and clear - the map will update automatically!`;

      // Add personalization context if available
      if (pageContext?.personalization) {
        prompt += this.buildPersonalizationPrompt(pageContext.personalization);
      }
    } else if (pageContext?.route) {
      // No itinerary but we have route context from pageContext (fallback)
      const route = pageContext.route;
      prompt += `\n\n**Current Route Context** (no generated itinerary yet):
- Origin: ${route.origin || 'Unknown'}
- Destination: ${route.destination || 'Unknown'}
- Cities on route: ${route.cities?.length > 0 ? route.cities.join(' → ') : 'Not specified'}
- Duration: ${route.duration ? `${route.duration} days` : 'Not specified'}

The user is exploring this route. They can ask about:
- Things to do in any of these cities
- Weather conditions along the route
- Restaurant recommendations
- Hidden gems and local experiences
- Help planning their journey

**IMPORTANT**: You have the route context above - use it! If user asks about "the trip" or "our journey", you know the cities involved.`;

      // Add personalization context if available
      if (pageContext.personalization) {
        prompt += this.buildPersonalizationPrompt(pageContext.personalization);
      }
    } else {
      // No itinerary or route context
      prompt += `\n\nThe user is ${pageContext?.name === 'itinerary' ? 'building an itinerary' : pageContext?.name === 'spotlight' ? 'exploring routes' : 'browsing the site'}.`;
    }

    // Inject relevant memories from past conversations
    if (memories.length > 0) {
      prompt += `\n\n**Past Conversations**:\n`;
      memories.forEach((memory, index) => {
        const date = new Date(memory.createdAt).toLocaleDateString();
        prompt += `- [${date}] ${memory.content}\n`;
      });
      prompt += `\nUse this context to personalize your responses and remember the user's preferences.`;
    }

    // Inject user preferences
    if (Object.keys(preferences).length > 0) {
      prompt += `\n\n**User Preferences**:\n`;
      for (const [category, pref] of Object.entries(preferences)) {
        prompt += `- ${category}: ${JSON.stringify(pref)}\n`;
      }
      prompt += `\nConsider these preferences when making recommendations.`;
    }

    prompt += `\n\n**CRITICAL TOOL USAGE RULES**:

You MUST use tools for these queries - DO NOT answer from general knowledge:

1. **Activities/Attractions** ("what to do", "activities", "attractions", "places to visit", "things to see"):
   → ALWAYS use searchActivities tool with the city name
   → Example: "What can I do in Paris?" → searchActivities(city: "Paris, France")

   **⚠️ HIDDEN GEMS DETECTION - CRITICAL:**
   → If user asks for "hidden gems", "off the beaten path", "local favorites", "non-touristy", "where locals go", "lesser-known", or "not the usual tourist stuff"
   → You MUST use searchActivities with **hiddenGems: true**
   → Example: "Show me hidden gems in Barcelona" → searchActivities(city: "Barcelona, Spain", hiddenGems: true)
   → Example: "What do locals do in Rome?" → searchActivities(city: "Rome, Italy", hiddenGems: true)
   → **NEVER suggest Sagrada Familia, Eiffel Tower, Colosseum, etc. as hidden gems - those are the OPPOSITE of hidden gems!**

2. **Weather** ("weather", "forecast", "temperature", "rain"):
   → ALWAYS use checkWeather tool
   → Example: "What's the weather in Berlin?" → checkWeather(location: "Berlin, Germany")

3. **Hotels/Accommodation** ("hotels", "where to stay", "accommodation"):
   → ALWAYS use searchHotels tool
   → Example: "Hotels in Rome?" → searchHotels(city: "Rome, Italy")

4. **Directions/Navigation** ("how to get", "directions", "route", "drive"):
   → ALWAYS use getDirections tool
   → Example: "How do I get from Paris to Lyon?" → getDirections(from: "Paris", to: "Lyon")

5. **City Information** ("tell me about", "what is", "city guide"):
   → ALWAYS use getCityInfo tool
   → Example: "Tell me about Amsterdam" → getCityInfo(city: "Amsterdam")

**⚠️ MANDATORY WORKFLOW FOR REPLACEMENTS** ⚠️
WHEN USER SAYS "REPLACE X":
STEP 1 (REQUIRED): Call searchItinerary(query: "X") - DO NOT SKIP THIS!
STEP 2: searchItinerary returns day number and city
STEP 3: Call searchActivities for alternatives
STEP 4: User picks → Call replaceActivity
❌ NEVER ask "which day?" - searchItinerary tells you!
❌ NEVER search for alternatives BEFORE finding which day!

**ITINERARY MODIFICATION TOOLS** (Use when user has an existing itinerary):

6. **Replace Activity** ("replace X", "change X", "swap X for Y"):
   → Use replaceActivity tool with itineraryId, dayNumber, oldActivityName, newActivity
   → IMPORTANT: Day numbers are 1-indexed (Day 1, Day 2, etc.) - if user says "day 0", they mean "Day 1"
   → Example: "Replace the hike with a museum" → First find which day has the hike, then searchActivities for museums, then replaceActivity
   → Example: User says "replace chaine d'eguilles on day 0" → Interpret as Day 1, search museums in same city, use replaceActivity

7. **Move Activity** ("move X to tomorrow", "reschedule X"):
   → Use moveActivity tool
   → Example: "Move the Louvre to Day 3" → moveActivity(activityName: "Louvre", fromDay: 2, toDay: 3)

8. **Reorder Activities** ("put X before Y", "change order"):
   → Use reorderActivities tool
   → Example: "Put museum before lunch" → reorderActivities with new order

9. **Optimize Route** ("optimize my day", "reduce travel time", "best order"):
   → Use optimizeRoute tool - automatically reorders activities by geographic proximity
   → Example: "Optimize Day 2" → optimizeRoute(dayNumber: 2)

10. **Check Day Feasibility** ("is this realistic?", "too packed?", "enough time?"):
    → Use analyzeDayFeasibility tool - shows timeline and warnings
    → Example: "Is Day 3 too packed?" → analyzeDayFeasibility(dayNumber: 3)

11. **Weather Impact** ("will weather affect", "outdoor activities"):
    → Use checkWeatherImpact tool - identifies weather-sensitive activities
    → Example: "Will rain affect Day 2?" → checkWeatherImpact(dayNumber: 2)

12. **Day Improvements** ("how can I improve", "suggestions for day X"):
    → Use suggestImprovements tool - AI coaching for variety, pacing, logistics
    → Example: "How's my Day 3?" → suggestImprovements(dayNumber: 3)

13. **Trip Overview** ("analyze my trip", "how's my overall trip", "trip score"):
    → Use analyzeTripOverview tool - holistic analysis with scoring
    → Example: "How's my trip overall?" → analyzeTripOverview()

14. **Find Nearby** ("what's near X", "cafe near museum"):
    → Use findNearby tool - activity-specific search (not city-wide)
    → Example: "Find cafe near Louvre on Day 2" → findNearby(activityName: "Louvre", dayNumber: 2, type: "cafe")

**DISCOVERY PHASE TOOLS** (Use during route planning, before itinerary generation):

15. **Add City to Route** ("add Lyon", "I want to stop in Berlin", "add a night in Paris"):
    → Use addCityToRoute tool - adds a city as a waypoint to the user's trip
    → Example: "Add Lyon to my trip" → addCityToRoute(cityName: "Lyon", country: "France", nights: 1)
    → Example: "Add Berlin for 2 nights" → addCityToRoute(cityName: "Berlin", country: "Germany", nights: 2)
    → **RESPONSE RULES after adding cities:**
      • List ONLY the NEW cities you added (not the entire route!)
      • Format: "I've added X new stops: • City 1 (nights) - why • City 2 (nights) - why"
      • Mention new total nights at the end
      • Keep it brief - the map updates automatically!

16. **Search Itinerary** (MOST IMPORTANT - use this to find activities in itinerary):
    → Use searchItinerary tool - find which day an activity is on
    → Example: "replace chaine d'eguilles" → FIRST call searchItinerary(query: "chaine d'eguilles") to find which day it's on
    → This is THE tool to use when user mentions an activity name
    → More efficient than showing all activities in context!

**CRITICAL: When user wants to REPLACE/CHANGE an activity:**

Use the searchItinerary tool to find activities! Here's the exact workflow:

Example: User says "replace chaine d'eguilles in aix by a museum"
1. ✅ Call searchItinerary(itineraryId: "${itineraryData?.itineraryId}", query: "chaine d'eguilles")
2. ✅ Tool returns: "Found on Day 1 in Aix-en-Provence"
3. ✅ **MANDATORY:** Call searchActivities(city: "Aix-en-Provence, France", category: "museum") to get COMPLETE activity data with photos!
4. ✅ Present top 3-5 museum options to user
5. ✅ User picks one → Call replaceActivity with THE COMPLETE ACTIVITY OBJECT from searchActivities

⚠️ **CRITICAL RULE:**
- You MUST call searchActivities BEFORE replaceActivity!
- NEVER call replaceActivity without first calling searchActivities!
- The searchActivities result contains the photo URL - you CANNOT get photos any other way!

   **CRITICAL: Pass the FULL activity object including ALL fields:**
   - name (required)
   - address (required)
   - photo (REQUIRED - the Google Places photo URL!)
   - coordinates (lat/lng - REQUIRED for maps)
   - rating (if available)
   - place_id (if available)
   - ALL other fields from searchActivities

   Example: replaceActivity(itineraryId: "${itineraryData?.itineraryId}", dayNumber: 1, oldActivityName: "chaine d'eguilles", newActivity: {
     name: "Musée Granet",
     address: "Place Saint-Jean de Malte, Aix-en-Provence",
     photo: "https://maps.googleapis.com/maps/api/place/photo?...",
     coordinates: {lat: 43.5267, lng: 5.4466},
     rating: 4.5,
     place_id: "ChIJ..."
     /* Include ALL fields returned by searchActivities */
   })

6. ❌ DO NOT pass a partial object - ALWAYS include photo, coordinates, rating
7. ❌ DO NOT ask "which city?" - searchItinerary tells you!
8. ❌ DO NOT ask "which day?" - searchItinerary tells you!
9. ❌ DO NOT ask "what's your itinerary ID?" - you HAVE it: ${itineraryData?.itineraryId}

**IMPORTANT**:
- The itinerary ID is ALWAYS available: ${itineraryData?.itineraryId}
- Use searchItinerary FIRST to find activities - don't scan the Daily Plan manually
- This is much more efficient and accurate!

**BE PROACTIVE - NEVER ASK REDUNDANT QUESTIONS:**
- ❌ BAD: "Which city are you interested in?" (when city is in context)
- ✅ GOOD: "I found 5 museums in Aix-en-Provence. Here are the top ones..."
- ❌ BAD: "Which day is that activity on?" (when you can search the itinerary)
- ✅ GOOD: "I found that activity on Day 2. Let me search for alternatives..."

**DAY NUMBER HANDLING (CRITICAL):**
- Users often say "day 0" but they mean the FIRST day
- Our system uses 1-indexed: Day 1, Day 2, Day 3...
- **If user says "day 0" → interpret as Day 1**
- **If user says "day 1" → use Day 1**
- Always convert user input to 1-indexed before calling tools

**YOU HAVE FULL CONTEXT - USE IT:**
- The itinerary data above shows EVERY activity, restaurant, city, date
- You know exactly what's planned for each day
- You know which cities the trip covers
- You can find any activity by searching through the days
- NEVER ask for information you already have in the context above!

**MULTI-TURN WORKFLOW CONTINUATION (CRITICAL):**

When handling multi-step tasks, you MUST remember conversation context:

1. **Check Conversation History**: Look at previous messages to understand what you were doing
2. **Identify Ongoing Workflows**: If you previously:
   - Presented options to user (museums, restaurants, etc.)
   - Asked user to choose
   - Started a replacement/modification process
   → Then user's response is likely choosing from those options!

3. **Complete Workflows Without Re-Asking**:
   ❌ BAD: User says "musée granet" → You ask "what would you like to do with it?"
   ✅ GOOD: User says "musée granet" → Check conversation history → See you presented museums for replacement → Complete the replaceActivity call!

4. **Example Multi-Turn Workflow**:
   Message 1: "replace chaine d'eguilles with a museum"
   → You: Find which day, search museums, present 5 options, say "which would you prefer?"

   Message 2: "musée granet sounds great"
   → You: Look at conversation history → See you were replacing chaine d'eguilles → See musée granet was option #1 → Call replaceActivity IMMEDIATELY → Confirm completion

   NOT: Ask "what day?" or "what do you want me to do?" - you KNOW from history!

5. **Tracking Workflow State**:
   - If you presented a numbered list of options
   - And user responds with a number or name from that list
   - That's them CHOOSING - complete the action!
   - Don't lose track of the original intent

**CONVERSATION CONTINUITY RULES:**
- Read the FULL conversation history before responding
- If previous message was you presenting options, next message is likely their choice
- If you asked "which would you prefer?", their next message is the answer
- Don't make user repeat themselves or re-specify details you already have

**If the user asks about activities, attractions, or things to do - you MUST call searchActivities. No exceptions.**`;

    return prompt;
  }

  /**
   * Build personalization-aware prompt section
   * Makes the agent reference user preferences naturally in responses
   */
  buildPersonalizationPrompt(personalization) {
    if (!personalization || Object.keys(personalization).length === 0) {
      return '';
    }

    let prompt = `\n
**🎯 PERSONALIZATION CONTEXT - Use These Naturally in Responses**:
You have insight into this user's preferences. Reference them naturally when making recommendations.`;

    // Trip Story - the user's own words about their trip
    if (personalization.tripStory) {
      prompt += `\n
**Their Trip Story**: "${personalization.tripStory.substring(0, 300)}${personalization.tripStory.length > 300 ? '...' : ''}"
→ Reference their story naturally: "Since you mentioned this is your anniversary..." or "Given your interest in authentic local experiences..."`;
    }

    // Occasion - special event context
    if (personalization.occasion) {
      const occasionPhrases = {
        'honeymoon': 'romantic recommendations, couples activities, intimate dining',
        'anniversary': 'special celebrations, romantic spots, memorable experiences',
        'birthday': 'celebration-worthy venues, special treatment, festive atmosphere',
        'family-vacation': 'family-friendly activities, kid-appropriate options',
        'girls-trip': 'fun group activities, social venues, spa/wellness',
        'guys-trip': 'adventure activities, sports, breweries/pubs',
        'solo-adventure': 'safe solo-friendly spots, social hostels, guided tours',
        'business-leisure': 'efficient options, professional venues, quick recommendations'
      };
      const occasion = personalization.occasion;
      prompt += `\n
**Occasion**: ${occasion}${occasionPhrases[occasion] ? ` → Prioritize: ${occasionPhrases[occasion]}` : ''}`;
    }

    // Dining Style
    if (personalization.diningStyle) {
      prompt += `\n
**Dining Preference**: ${personalization.diningStyle}
→ Match restaurant recommendations to this style`;
    }

    // Dietary restrictions
    if (personalization.dietary && personalization.dietary.length > 0) {
      prompt += `\n
**Dietary Needs**: ${personalization.dietary.join(', ')}
→ ALWAYS mention dietary compatibility when recommending restaurants`;
    }

    // Accessibility needs
    if (personalization.accessibility && personalization.accessibility.length > 0) {
      prompt += `\n
**Accessibility**: ${personalization.accessibility.join(', ')}
→ Prioritize accessible venues and mention accessibility features`;
    }

    // Crowd preference
    if (personalization.avoidCrowds) {
      prompt += `\n
**Crowd Preference**: Prefers avoiding crowds
→ Suggest off-peak times, hidden gems, less touristy alternatives`;
    }

    // Outdoor preference
    if (personalization.preferOutdoor) {
      prompt += `\n
**Activity Style**: Prefers outdoor activities
→ Prioritize outdoor options, nature experiences, al fresco dining`;
    }

    // Travel style
    if (personalization.travelStyle) {
      prompt += `\n
**Travel Style**: ${personalization.travelStyle}
→ Match pacing and activity intensity to this style`;
    }

    // Pace preference
    if (personalization.pace) {
      const paceGuidance = {
        'relaxed': 'fewer activities per day, more downtime, leisurely meals',
        'moderate': 'balanced mix of activities and rest',
        'packed': 'maximize experiences, efficient scheduling, early starts'
      };
      prompt += `\n
**Pace**: ${personalization.pace}${paceGuidance[personalization.pace] ? ` → ${paceGuidance[personalization.pace]}` : ''}`;
    }

    // Interests
    if (personalization.interests && personalization.interests.length > 0) {
      prompt += `\n
**Key Interests**: ${personalization.interests.join(', ')}
→ Prioritize activities matching these interests`;
    }

    // Budget
    if (personalization.budget) {
      prompt += `\n
**Budget Level**: ${personalization.budget}
→ Match price ranges to this budget`;
    }

    prompt += `\n
**HOW TO USE PERSONALIZATION**:
- Naturally weave preferences into recommendations: "For your honeymoon, I'd suggest..."
- Acknowledge their specific interests: "Since you love wine..."
- Respect their pace: "Given your preference for a relaxed pace..."
- Don't recite the preferences back - USE them to personalize suggestions
- Make them feel understood, not analyzed
`;

    return prompt;
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(userId, routeId, sessionId) {
    // Check if conversation exists
    // IMPORTANT: Handle NULL userId correctly (NULL = NULL is FALSE in SQL!)
    const existing = await this.db.query(`
      SELECT id FROM agent_conversations
      WHERE (user_id = $1 OR (user_id IS NULL AND $1 IS NULL))
        AND session_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, sessionId]);

    if (existing.rows.length > 0) {
      console.log(`   ♻️  Reusing existing conversation: ${existing.rows[0].id}`);
      return existing.rows[0].id;
    }

    console.log(`   🆕 Creating new conversation for session: ${sessionId}`);

    // Validate routeId format (must be a valid UUID)
    // If invalid or not provided, set to null
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validRouteId = (routeId && uuidRegex.test(routeId)) ? routeId : null;

    // Create new conversation
    const result = await this.db.query(`
      INSERT INTO agent_conversations (user_id, route_id, session_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [userId, validRouteId, sessionId]);

    return result.rows[0].id;
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId) {
    console.log(`   🔍 Fetching conversation history for session: ${sessionId}`);

    // First, check if conversation exists
    const convCheck = await this.db.query(`
      SELECT id, user_id FROM agent_conversations
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [sessionId]);

    if (convCheck.rows.length > 0) {
      console.log(`   📁 Found conversation: ${convCheck.rows[0].id} (user: ${convCheck.rows[0].user_id})`);
    } else {
      console.log(`   ⚠️  No conversation found for session ${sessionId}`);
    }

    const messages = await this.db.query(`
      SELECT role, content
      FROM agent_messages
      WHERE conversation_id = (
        SELECT id FROM agent_conversations
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      )
      ORDER BY created_at ASC
      LIMIT 10
    `, [sessionId]);

    console.log(`   📨 Retrieved ${messages.rows.length} messages from database`);

    return messages.rows.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Save message to database
   */
  async saveMessage({ conversationId, role, content, toolCalls, toolResults, contextSnapshot }) {
    const result = await this.db.query(`
      INSERT INTO agent_messages (conversation_id, role, content, tool_calls, tool_results, context_snapshot)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      conversationId,
      role,
      content,
      toolCalls ? JSON.stringify(toolCalls) : null,
      toolResults ? JSON.stringify(toolResults) : null,
      JSON.stringify(contextSnapshot)
    ]);

    return result.rows[0].id;
  }

  /**
   * Store conversation in memory for future retrieval
   * Creates a summary and stores it with semantic embeddings
   */
  async storeConversationMemory(userId, messageId, userMessage, assistantResponse, context) {
    try {
      // Create a concise summary of the exchange
      const summary = `User asked: "${userMessage.slice(0, 100)}${userMessage.length > 100 ? '...' : ''}". ` +
                     `Agent responded about: ${this.extractTopics(assistantResponse)}`;

      // Store with metadata
      const metadata = {
        routeId: context.routeId,
        page: context.pageContext?.page,
        timestamp: new Date().toISOString()
      };

      await this.memoryService.storeConversation(userId, messageId, summary, metadata);

      // Extract and store preferences if mentioned
      await this.extractAndStorePreferences(userId, userMessage, assistantResponse);

    } catch (error) {
      console.error('Error storing conversation memory:', error);
      // Don't throw - memory storage failures shouldn't break agent flow
    }
  }

  /**
   * Extract topics from assistant response
   */
  extractTopics(response) {
    // Simple topic extraction - just take first 100 chars
    const cleaned = response.replace(/\n/g, ' ').trim();
    return cleaned.slice(0, 100) + (cleaned.length > 100 ? '...' : '');
  }

  /**
   * Extract and store user preferences from conversation
   * (Simple version - could be enhanced with NLP)
   */
  async extractAndStorePreferences(userId, userMessage, assistantResponse) {
    try {
      const combined = userMessage + ' ' + assistantResponse;
      const lowerText = combined.toLowerCase();

      // Detect accommodation preferences
      if (lowerText.includes('hotel') || lowerText.includes('hostel') || lowerText.includes('airbnb')) {
        const preference = {
          mentioned: new Date().toISOString(),
          context: userMessage.slice(0, 200)
        };

        if (lowerText.includes('budget')) {
          preference.type = 'budget';
        } else if (lowerText.includes('luxury') || lowerText.includes('upscale')) {
          preference.type = 'luxury';
        }

        await this.memoryService.updatePreference(userId, 'accommodation', preference);
      }

      // Detect cuisine preferences
      const cuisines = ['italian', 'french', 'japanese', 'chinese', 'indian', 'mexican', 'thai', 'mediterranean'];
      for (const cuisine of cuisines) {
        if (lowerText.includes(cuisine)) {
          await this.memoryService.updatePreference(userId, 'cuisine', {
            preference: cuisine,
            mentioned: new Date().toISOString()
          });
          break;
        }
      }

      // Detect activity preferences
      if (lowerText.includes('museum') || lowerText.includes('art') || lowerText.includes('culture')) {
        await this.memoryService.updatePreference(userId, 'activities', {
          type: 'cultural',
          mentioned: new Date().toISOString()
        });
      } else if (lowerText.includes('hiking') || lowerText.includes('outdoor') || lowerText.includes('nature')) {
        await this.memoryService.updatePreference(userId, 'activities', {
          type: 'outdoor',
          mentioned: new Date().toISOString()
        });
      }

    } catch (error) {
      console.warn('Error extracting preferences:', error);
    }
  }
}

module.exports = AgentOrchestrator;
