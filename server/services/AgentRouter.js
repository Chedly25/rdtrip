/**
 * AgentRouter - Specialized Agent Routing System
 *
 * Phase 3: Specialized Agent Routing
 *
 * Routes user requests to specialized sub-agents based on intent classification.
 * Supports multi-agent collaboration for complex requests.
 *
 * Architecture:
 * - Router Agent: Classifies intent and decides routing
 * - Discovery Agent: Adding cities, exploring options, comparing destinations
 * - Itinerary Agent: Modifying schedule, adding/removing activities
 * - Booking Agent: Hotels, transport, reservations
 * - General Agent: Weather, info, general questions
 */

const Anthropic = require('@anthropic-ai/sdk');

// Agent type definitions
const AGENT_TYPES = {
  DISCOVERY: 'discovery',
  ITINERARY: 'itinerary',
  BOOKING: 'booking',
  GENERAL: 'general'
};

// Tool subsets for each specialized agent
const AGENT_TOOL_SETS = {
  [AGENT_TYPES.DISCOVERY]: [
    'searchActivities',
    'getCityInfo',
    'webSearch',
    'mentionPlace',
    'suggestActions'
  ],
  [AGENT_TYPES.ITINERARY]: [
    'searchItinerary',
    'addActivity',
    'replaceActivity',
    'removeActivity',
    'searchActivities',
    'mentionPlace',
    'suggestActions'
  ],
  [AGENT_TYPES.BOOKING]: [
    'searchHotels',
    'searchActivities',
    'getDirections',
    'mentionPlace',
    'webSearch',
    'suggestActions'
  ],
  [AGENT_TYPES.GENERAL]: [
    'checkWeather',
    'getCityInfo',
    'getDirections',
    'webSearch',
    'suggestActions'
  ]
};

// Specialized system prompt suffixes for each agent
const AGENT_PROMPTS = {
  [AGENT_TYPES.DISCOVERY]: `
**🔍 DISCOVERY MODE ACTIVE**

You are now operating as the Discovery Agent, specialized in:
- Exploring new destinations and cities
- Comparing different travel options
- Finding unique experiences and hidden gems
- Helping users discover what interests them

Your approach:
- Be enthusiastic and inspirational about destinations
- Present multiple options with pros/cons
- Use getCityInfo and searchActivities to find interesting places
- Encourage exploration with "What if..." suggestions
- Ask clarifying questions about preferences

Focus on EXPLORATION and INSPIRATION.
`,
  [AGENT_TYPES.ITINERARY]: `
**📅 ITINERARY MODE ACTIVE**

You are now operating as the Itinerary Agent, specialized in:
- Modifying existing trip schedules
- Adding, removing, or replacing activities
- Optimizing daily plans for efficiency
- Balancing the trip pacing

Your approach:
- Be precise and action-oriented
- Always use searchItinerary FIRST to understand current plans
- Make surgical changes without disrupting the flow
- Consider timing, proximity, and user preferences
- Confirm changes clearly with the user

Focus on PRECISION and ORGANIZATION.
`,
  [AGENT_TYPES.BOOKING]: `
**🏨 BOOKING MODE ACTIVE**

You are now operating as the Booking Agent, specialized in:
- Finding and recommending hotels
- Transport options and directions
- Practical travel arrangements
- Reservation assistance

Your approach:
- Be practical and informative
- Use searchHotels to find accommodation options
- Consider budget, location, and amenities
- Provide clear pricing and booking information
- Include practical details (check-in times, cancellation policies)

Focus on PRACTICALITY and DETAILS.
`,
  [AGENT_TYPES.GENERAL]: `
**ℹ️ GENERAL ASSISTANCE MODE**

You are providing general travel assistance:
- Weather forecasts and conditions
- Destination information
- Travel tips and advice
- General questions

Your approach:
- Be helpful and informative
- Use checkWeather for weather queries
- Use getCityInfo for destination details
- Use webSearch for current information
- Give concise, actionable answers

Focus on being HELPFUL and INFORMATIVE.
`
};

class AgentRouter {
  constructor(claudeClient) {
    this.claudeClient = claudeClient || new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.model = 'claude-haiku-4-5-20251001';
  }

  /**
   * Classify the intent of a user message
   * @param {string} userMessage - The user's message
   * @param {object} context - Current context (page, itinerary, etc.)
   * @returns {Promise<object>} Classification result
   */
  async classifyIntent(userMessage, context) {
    console.log('\n🔀 [ROUTER] Classifying intent...');

    const classificationPrompt = `Classify this travel-related user request into agent categories.

USER REQUEST: "${userMessage}"

CONTEXT:
- Current Page: ${context.pageContext?.name || context.pageContext?.page || 'unknown'}
- Has Itinerary: ${!!context.itineraryData}
- Has Route: ${!!context.routeId}
- Itinerary Days: ${context.itineraryData?.totalDays || 0}

AGENT CATEGORIES:
1. **discovery**: Exploring new destinations, adding cities, comparing options, "what should I see", finding experiences
   Examples: "What's there to do in Paris?", "Add Barcelona to my trip", "Compare Rome vs Florence"

2. **itinerary**: Modifying existing schedule, adding/removing/replacing activities, reordering, timing changes
   Examples: "Replace the museum with something else", "Add this restaurant to day 2", "Move lunch to 2pm"

3. **booking**: Hotels, accommodations, transport, directions, reservations, practical arrangements
   Examples: "Find hotels in Nice", "How do I get from Paris to Lyon?", "Book a restaurant"

4. **general**: Weather, general info, travel tips, questions not fitting other categories
   Examples: "What's the weather like?", "What currency do they use?", "Any tips for visiting?"

CLASSIFICATION RULES:
- If request mentions modifying an EXISTING activity/plan → itinerary
- If request is about FINDING/EXPLORING new things → discovery
- If request is about PRACTICAL ARRANGEMENTS (hotels, transport) → booking
- If unsure or general question → general
- Complex requests may need MULTIPLE agents

Return JSON (no markdown, just JSON):
{
  "primaryAgent": "discovery|itinerary|booking|general",
  "confidence": 0.0-1.0,
  "requiresMultiple": false,
  "agents": ["..."],
  "reasoning": "brief explanation"
}`;

    try {
      const response = await this.claudeClient.messages.create({
        model: this.model,
        max_tokens: 256,
        messages: [{ role: 'user', content: classificationPrompt }]
      });

      const responseText = response.content[0].text.trim();

      // Parse JSON response
      let classification;
      try {
        classification = JSON.parse(responseText);
      } catch {
        // Try to extract JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          classification = JSON.parse(jsonMatch[0]);
        } else {
          // Default fallback
          classification = {
            primaryAgent: AGENT_TYPES.GENERAL,
            confidence: 0.5,
            requiresMultiple: false,
            agents: [AGENT_TYPES.GENERAL],
            reasoning: 'Fallback to general agent'
          };
        }
      }

      console.log(`   ✅ Intent: ${classification.primaryAgent} (${(classification.confidence * 100).toFixed(0)}% confidence)`);
      console.log(`   📝 Reasoning: ${classification.reasoning}`);

      return classification;

    } catch (error) {
      console.error('   ❌ Classification error:', error.message);
      // Fallback to general agent
      return {
        primaryAgent: AGENT_TYPES.GENERAL,
        confidence: 0.3,
        requiresMultiple: false,
        agents: [AGENT_TYPES.GENERAL],
        reasoning: 'Classification failed, defaulting to general'
      };
    }
  }

  /**
   * Get the specialized system prompt suffix for an agent type
   * @param {string} agentType - The agent type
   * @returns {string} System prompt suffix
   */
  getAgentPromptSuffix(agentType) {
    return AGENT_PROMPTS[agentType] || AGENT_PROMPTS[AGENT_TYPES.GENERAL];
  }

  /**
   * Get the tool subset for an agent type
   * @param {string} agentType - The agent type
   * @returns {Array<string>} Tool names allowed for this agent
   */
  getAgentTools(agentType) {
    return AGENT_TOOL_SETS[agentType] || AGENT_TOOL_SETS[AGENT_TYPES.GENERAL];
  }

  /**
   * Route a request to the appropriate agent(s)
   * @param {string} userMessage - The user's message
   * @param {object} context - Current context
   * @param {function} onStream - Streaming callback
   * @returns {Promise<object>} Routing decision
   */
  async route(userMessage, context, onStream) {
    const classification = await this.classifyIntent(userMessage, context);

    // Stream routing decision to frontend
    if (onStream) {
      onStream({
        type: 'routing',
        primaryAgent: classification.primaryAgent,
        confidence: classification.confidence,
        requiresMultiple: classification.requiresMultiple,
        agents: classification.requiresMultiple ? classification.agents : [classification.primaryAgent],
        reasoning: classification.reasoning
      });
    }

    return {
      ...classification,
      promptSuffix: this.getAgentPromptSuffix(classification.primaryAgent),
      allowedTools: this.getAgentTools(classification.primaryAgent),
      // For multi-agent flows, collect all tool sets
      allTools: classification.requiresMultiple
        ? [...new Set(classification.agents.flatMap(a => this.getAgentTools(a)))]
        : this.getAgentTools(classification.primaryAgent)
    };
  }

  /**
   * Synthesize results from multiple agents
   * @param {Array} results - Results from each agent
   * @param {string} userMessage - Original user message
   * @returns {Promise<string>} Synthesized response
   */
  async synthesizeResults(results, userMessage) {
    if (results.length === 1) {
      return results[0].content;
    }

    console.log('\n🔄 [ROUTER] Synthesizing multi-agent results...');

    const synthesisPrompt = `Combine these specialized agent responses into a cohesive answer.

USER QUESTION: "${userMessage}"

AGENT RESPONSES:
${results.map(r => `--- ${r.agent.toUpperCase()} AGENT ---\n${r.content}`).join('\n\n')}

Create a unified, natural response that incorporates the key information from all agents.
Be concise but complete. Don't mention that multiple agents were used.`;

    try {
      const response = await this.claudeClient.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: synthesisPrompt }]
      });

      return response.content[0].text;

    } catch (error) {
      console.error('   ❌ Synthesis error:', error.message);
      // Fallback: concatenate responses
      return results.map(r => r.content).join('\n\n');
    }
  }
}

// Export class and constants
module.exports = AgentRouter;
module.exports.AGENT_TYPES = AGENT_TYPES;
module.exports.AGENT_TOOL_SETS = AGENT_TOOL_SETS;
module.exports.AGENT_PROMPTS = AGENT_PROMPTS;
