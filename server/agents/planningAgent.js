/**
 * Planning Agent
 *
 * Claude-powered companion for trip planning with tool-use capabilities.
 * Provides contextual suggestions, reacts to user actions, and helps
 * build optimal trip itineraries.
 */

const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');

// Initialize Anthropic client
const anthropic = new Anthropic();

// ============================================
// Tool Definitions
// ============================================

const TOOLS = [
  {
    name: 'generate_cards',
    description: "Generate new place suggestions for the user's trip. Use this when they want more options or when you're proactively suggesting places.",
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: "City name (e.g., 'Marseille')",
        },
        type: {
          type: 'string',
          enum: ['restaurant', 'activity', 'photo_spot', 'bar', 'cafe'],
          description: 'Type of place to suggest',
        },
        count: {
          type: 'number',
          description: 'Number of suggestions (1-10)',
          default: 4,
        },
        requirements: {
          type: 'string',
          description: "Natural language requirements (e.g., 'romantic dinner with water view, moderate price')",
        },
        nearLocation: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
          description: 'Prioritize places near this location',
        },
        priceRange: {
          type: 'array',
          items: { type: 'number' },
          description: 'Price levels to include [1,2,3] for budget to expensive',
        },
        excludeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of places to exclude (already suggested or added)',
        },
      },
      required: ['city', 'type'],
    },
  },
  {
    name: 'search_places',
    description: 'Search for specific places by name or description. Use when user asks for something specific.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: "Search query (e.g., 'rooftop bars in Le Panier', 'Chez Fonfon')",
        },
        city: {
          type: 'string',
          description: 'City to search in',
        },
        type: {
          type: 'string',
          enum: ['restaurant', 'activity', 'photo_spot', 'bar', 'cafe', 'any'],
          description: "Filter by type, or 'any' for all",
          default: 'any',
        },
        limit: {
          type: 'number',
          description: 'Max results (1-10)',
          default: 5,
        },
      },
      required: ['query', 'city'],
    },
  },
  {
    name: 'calculate_distance',
    description: 'Calculate walking time between two locations. Use to check if places fit together in a cluster.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
          description: 'Starting point',
          required: ['lat', 'lng'],
        },
        to: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
          },
          description: 'Ending point',
          required: ['lat', 'lng'],
        },
        mode: {
          type: 'string',
          enum: ['walking', 'transit', 'driving'],
          default: 'walking',
        },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'analyze_plan',
    description: "Analyze the user's current plan for gaps, inefficiencies, or opportunities. Use proactively or when asked.",
    input_schema: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          enum: ['gaps', 'efficiency', 'balance', 'all'],
          description: 'What aspect to analyze',
          default: 'all',
        },
      },
    },
  },
];

// ============================================
// System Prompt Builder
// ============================================

function buildSystemPrompt(context) {
  const {
    cityName,
    cityData,
    travelerType,
    preferences,
    currentPlan,
    recentAction,
  } = context;

  // Build cluster summary
  let clusterSummary = 'No clusters created yet.';
  if (currentPlan?.clusters?.length > 0) {
    clusterSummary = currentPlan.clusters
      .map((c) => {
        const itemList = c.items?.length
          ? c.items.map((i) => `${i.name} (${i.type})`).join(', ')
          : 'empty';
        return `- ${c.name}: ${c.items?.length || 0} items (${itemList})`;
      })
      .join('\n');
  }

  // Build recent action context
  let actionContext = '';
  if (recentAction) {
    switch (recentAction.type) {
      case 'added_item':
        actionContext = `The user just added "${recentAction.item?.name}" to their plan.`;
        break;
      case 'removed_item':
        actionContext = `The user just removed "${recentAction.item?.name}" from their plan.`;
        break;
      case 'created_cluster':
        actionContext = `The user just created a new area called "${recentAction.cluster?.name}".`;
        break;
      case 'generated_more':
        actionContext = `The user just requested more ${recentAction.item?.type || 'suggestions'}.`;
        break;
    }
  }

  return `You are the Planning Companion for rdtrip, a travel planning app. You help users build their trip itinerary by suggesting places, reacting to their choices, and helping them discover perfect spots.

## Your Personality

- **Knowledgeable local friend**: You know these places deeply, not just Wikipedia facts
- **Opinionated but respectful**: Share genuine recommendations, respect their choices
- **Concise**: Users are actively planning, not reading essays. 2-3 sentences max unless they ask for detail
- **Proactive**: Notice gaps and opportunities, don't wait to be asked
- **Warm but not sycophantic**: Skip the "Great question!" - just help them

## Current Context

**City**: ${cityName || 'Unknown'}
**Traveler Type**: ${travelerType || 'couple'}
**Preferences**: ${preferences?.interests?.join(', ') || 'quality experiences, authentic local spots'}
**Budget**: ${preferences?.budget || 'moderate'}

**Their Current Plan**:
${clusterSummary}

${actionContext ? `**Recent Action**: ${actionContext}` : ''}

## Your Tools

1. **generate_cards**: Create new place suggestions
   - Use when: They want more options, you're suggesting something
   - Returns: Array of place cards with location, price, duration

2. **search_places**: Find specific places
   - Use when: They ask for something specific ("rooftop bar near the port")
   - Returns: Matching places with details

3. **calculate_distance**: Get walking time between points
   - Use when: Checking if something fits in their cluster
   - Returns: Walking/transit/driving minutes

4. **analyze_plan**: Review their plan
   - Use when: They ask for review, or you notice issues
   - Returns: Analysis with gaps, suggestions

## Response Guidelines

- Keep to 2-3 sentences unless they ask for detail
- When suggesting cards, provide 2-4 options
- Be specific: "8 min walk" not "nearby", "€40pp" not "moderate"
- Share tips a local would know
- Never lie or make up facts
- Respect their budget - note when something is expensive

## Response Patterns

**When user ADDS an item**: Brief acknowledgment + proximity context + optional complementary suggestion
**When user GENERATES more**: Acknowledge + explain selection criteria + offer to filter differently
**When user ASKS a question**: Answer directly + use tools if needed + suggest relevant cards
**When reviewing PLAN**: Note what's working + identify gaps + flag inefficiencies + suggest improvements`;
}

// ============================================
// Tool Executors
// ============================================

function generateId(prefix = 'card') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Calculate walking minutes between two points using Haversine formula
 */
function calculateWalkingMinutes(from, to) {
  if (!from?.lat || !to?.lat) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // 5 km/h walking speed, add 20% for non-straight paths
  return Math.round(distanceKm * 12 * 1.2);
}

/**
 * Execute generate_cards tool
 */
async function executeGenerateCards(args, context) {
  const { city, type, count = 4, requirements, nearLocation, priceRange, excludeIds } = args;

  // Build generation prompt
  const prompt = `Generate ${count} ${type} recommendations for ${city}.

${requirements ? `User requirements: ${requirements}` : ''}
${priceRange ? `Price range: ${priceRange.map((p) => '€'.repeat(p)).join('-')}` : ''}
${context.travelerType ? `Traveler type: ${context.travelerType}` : 'Traveler type: couple'}
${excludeIds?.length ? `Exclude these places (already suggested): ${excludeIds.join(', ')}` : ''}

Generate ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "id": "${type}-${Date.now()}-unique",
    "type": "${type}",
    "name": "Place Name",
    "description": "1-2 sentences about what makes it special",
    "whyGreat": "Why this matches their trip specifically",
    "location": {
      "lat": 43.2965,
      "lng": 5.3698,
      "address": "123 Example Street",
      "area": "Le Panier"
    },
    "duration": 90,
    "priceLevel": 2,
    "priceEstimate": "€25-35 per person",
    "bestTime": "dinner",
    "tags": ["romantic", "local-favorite"]
  }
]`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent) throw new Error('No text content in response');

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in response');

    const cards = JSON.parse(jsonMatch[0]);

    // Validate and enrich cards
    return cards.map((card, index) => ({
      id: card.id || generateId(type),
      type: card.type || type,
      name: card.name || `${type} ${index + 1}`,
      description: card.description || '',
      whyGreat: card.whyGreat || '',
      location: {
        lat: card.location?.lat || 0,
        lng: card.location?.lng || 0,
        address: card.location?.address || '',
        area: card.location?.area || '',
      },
      duration: card.duration || 60,
      priceLevel: Math.min(4, Math.max(1, card.priceLevel || 2)),
      priceEstimate: card.priceEstimate || '',
      bestTime: card.bestTime || '',
      tags: card.tags || [],
      source: 'companion',
      generatedAt: new Date(),
    }));
  } catch (error) {
    console.error('[planningAgent] generateCards error:', error);
    return [];
  }
}

/**
 * Execute search_places tool
 */
async function executeSearchPlaces(args, context) {
  const { query, city, type = 'any', limit = 5 } = args;

  // Build search prompt
  const prompt = `Search for "${query}" in ${city}${type !== 'any' ? ` (type: ${type})` : ''}.

Return up to ${limit} matching places as a JSON array with this structure:
[
  {
    "id": "search-${Date.now()}-unique",
    "type": "${type !== 'any' ? type : 'activity'}",
    "name": "Place Name",
    "description": "Brief description",
    "whyGreat": "Why it matches the search",
    "location": { "lat": 43.2965, "lng": 5.3698, "address": "Address", "area": "Area" },
    "duration": 60,
    "priceLevel": 2,
    "priceEstimate": "€20-30",
    "bestTime": "afternoon",
    "tags": ["relevant", "tags"]
  }
]`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent) return [];

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const cards = JSON.parse(jsonMatch[0]);
    return cards.map((card) => ({
      ...card,
      id: card.id || generateId('search'),
      source: 'companion',
      generatedAt: new Date(),
    }));
  } catch (error) {
    console.error('[planningAgent] searchPlaces error:', error);
    return [];
  }
}

/**
 * Execute calculate_distance tool
 */
async function executeCalculateDistance(args) {
  const { from, to, mode = 'walking' } = args;

  const walkingMinutes = calculateWalkingMinutes(from, to);

  return {
    walkingMinutes,
    transitMinutes: Math.round(walkingMinutes * 0.5),
    drivingMinutes: Math.round(walkingMinutes * 0.3),
    mode,
  };
}

/**
 * Execute analyze_plan tool
 */
async function executeAnalyzePlan(args, context) {
  const { focus = 'all' } = args;
  const { currentPlan, cityName, travelerType } = context;

  if (!currentPlan?.clusters?.length) {
    return {
      status: 'empty',
      message: "The plan is empty. Let's start by adding some places!",
      suggestions: ['Start with a neighborhood you want to explore', 'Add a restaurant for your first meal'],
    };
  }

  const totalItems = currentPlan.clusters.reduce((sum, c) => sum + (c.items?.length || 0), 0);
  const totalDuration = currentPlan.clusters.reduce(
    (sum, c) => sum + (c.items?.reduce((s, i) => s + (i.duration || 0), 0) || 0),
    0
  );

  const analysis = {
    status: 'analyzed',
    totalClusters: currentPlan.clusters.length,
    totalItems,
    totalDurationMinutes: totalDuration,
    totalDurationHours: Math.round(totalDuration / 60 * 10) / 10,
  };

  // Check for gaps
  const gaps = [];
  const hasRestaurant = currentPlan.clusters.some((c) =>
    c.items?.some((i) => i.type === 'restaurant')
  );
  const hasActivity = currentPlan.clusters.some((c) =>
    c.items?.some((i) => i.type === 'activity')
  );

  if (!hasRestaurant) gaps.push('No restaurants planned - you might want to add dining options');
  if (!hasActivity) gaps.push('No activities planned - consider adding some experiences');

  // Check for empty clusters
  const emptyClusters = currentPlan.clusters.filter((c) => !c.items?.length);
  if (emptyClusters.length > 0) {
    gaps.push(`Empty area${emptyClusters.length > 1 ? 's' : ''}: ${emptyClusters.map((c) => c.name).join(', ')}`);
  }

  analysis.gaps = gaps;
  analysis.suggestions = [];

  if (gaps.length === 0) {
    analysis.suggestions.push('Your plan looks balanced!');
    if (totalDuration < 360) {
      analysis.suggestions.push('You have room for more activities if you want to fill the day');
    }
  } else {
    analysis.suggestions = gaps.map((g) => `Consider: ${g}`);
  }

  return analysis;
}

/**
 * Execute tool call and return result
 */
async function executeToolCall(toolName, toolInput, context) {
  console.log(`[planningAgent] Executing tool: ${toolName}`, toolInput);

  switch (toolName) {
    case 'generate_cards':
      return await executeGenerateCards(toolInput, context);
    case 'search_places':
      return await executeSearchPlaces(toolInput, context);
    case 'calculate_distance':
      return await executeCalculateDistance(toolInput);
    case 'analyze_plan':
      return await executeAnalyzePlan(toolInput, context);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// ============================================
// Generate Contextual Actions
// ============================================

function generateActions(context, responseText, generatedCards) {
  const actions = [];

  // If we generated cards, offer to show more
  if (generatedCards?.length > 0) {
    actions.push({
      id: generateId('action'),
      label: 'Show more options',
      type: 'show_more',
      payload: { cardType: generatedCards[0]?.type },
    });
  }

  // Offer plan analysis if they have items
  if (context.currentPlan?.clusters?.some((c) => c.items?.length > 0)) {
    actions.push({
      id: generateId('action'),
      label: 'Review my plan',
      type: 'custom',
      payload: { query: 'Can you review my plan and suggest improvements?' },
    });
  }

  // Default helpful actions
  if (actions.length === 0) {
    actions.push(
      {
        id: generateId('action'),
        label: 'Suggest restaurants',
        type: 'show_more',
        payload: { cardType: 'restaurant' },
      },
      {
        id: generateId('action'),
        label: 'Find activities',
        type: 'show_more',
        payload: { cardType: 'activity' },
      }
    );
  }

  return actions;
}

// ============================================
// Main Handler - Streaming Generator
// ============================================

/**
 * Handle companion message with streaming SSE events
 * @param {string} message - User message
 * @param {object} context - Planning context
 * @yields {object} SSE events
 */
async function* handleCompanionMessage(message, context) {
  const systemPrompt = buildSystemPrompt(context);

  // Build conversation history
  const messages = [];
  if (context.history?.length > 0) {
    for (const msg of context.history.slice(-10)) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }
  messages.push({ role: 'user', content: message });

  let generatedCards = [];
  let responseText = '';
  let toolCallInProgress = null;
  let toolInputJson = '';

  try {
    // Create streaming message with tools
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: TOOLS,
    });

    // Process stream events
    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          toolCallInProgress = {
            id: event.content_block.id,
            name: event.content_block.name,
          };
          toolInputJson = '';
          yield { type: 'thinking', content: `Looking up ${event.content_block.name.replace('_', ' ')}...` };
        }
      }

      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          responseText += event.delta.text;
          yield { type: 'message', content: event.delta.text };
        }
        if (event.delta.type === 'input_json_delta') {
          toolInputJson += event.delta.partial_json;
        }
      }

      if (event.type === 'content_block_stop' && toolCallInProgress) {
        // Execute the tool
        try {
          const toolInput = toolInputJson ? JSON.parse(toolInputJson) : {};
          yield { type: 'tool_call', tool: toolCallInProgress.name, args: toolInput };

          const result = await executeToolCall(toolCallInProgress.name, toolInput, context);
          yield { type: 'tool_result', tool: toolCallInProgress.name, result };

          // If generate_cards or search_places, emit cards
          if (
            (toolCallInProgress.name === 'generate_cards' || toolCallInProgress.name === 'search_places') &&
            Array.isArray(result) &&
            result.length > 0
          ) {
            generatedCards = result;
            yield { type: 'cards', cards: result };
          }
        } catch (toolError) {
          console.error('[planningAgent] Tool execution error:', toolError);
          yield { type: 'error', error: `Failed to execute ${toolCallInProgress.name}` };
        }

        toolCallInProgress = null;
        toolInputJson = '';
      }
    }

    // If there were tool calls, we might need to continue the conversation
    const finalMessage = await stream.finalMessage();

    // Check if there are pending tool calls that need responses
    const toolUseBlocks = finalMessage.content.filter((block) => block.type === 'tool_use');

    if (toolUseBlocks.length > 0 && finalMessage.stop_reason === 'tool_use') {
      // Execute remaining tools and get a follow-up response
      const toolResults = [];
      for (const toolUse of toolUseBlocks) {
        try {
          const result = await executeToolCall(toolUse.name, toolUse.input, context);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });

          if (
            (toolUse.name === 'generate_cards' || toolUse.name === 'search_places') &&
            Array.isArray(result) &&
            result.length > 0
          ) {
            generatedCards = result;
            yield { type: 'cards', cards: result };
          }
        } catch (err) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: err.message }),
            is_error: true,
          });
        }
      }

      // Continue conversation with tool results
      const continueStream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          ...messages,
          { role: 'assistant', content: finalMessage.content },
          { role: 'user', content: toolResults },
        ],
      });

      for await (const event of continueStream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          responseText += event.delta.text;
          yield { type: 'message', content: event.delta.text };
        }
      }
    }

    // Generate contextual actions
    const actions = generateActions(context, responseText, generatedCards);
    yield { type: 'actions', actions };

    yield { type: 'done' };
  } catch (error) {
    console.error('[planningAgent] Error:', error);
    yield { type: 'error', error: error.message || 'Something went wrong' };
    yield { type: 'done' };
  }
}

// ============================================
// Reactive Trigger Messages
// ============================================

/**
 * Generate a reactive message based on user action
 */
async function generateReactiveMessage(action, context) {
  const { type, item, cluster, previousPlan } = action;

  let triggerMessage = '';

  switch (type) {
    case 'added_item':
      if (item?.priceLevel === 4) {
        triggerMessage = `I added ${item.name} to my plan. It's quite expensive (${item.priceEstimate || '€€€€'}). Is it worth it?`;
      } else {
        triggerMessage = `I just added ${item.name} to my plan. What do you think?`;
      }
      break;

    case 'created_cluster':
      triggerMessage = `I just created a new area called "${cluster?.name}". What should I add there first?`;
      break;

    case 'generated_more':
      triggerMessage = `Show me more ${item?.type || 'suggestions'} please.`;
      break;

    case 'removed_item':
      triggerMessage = `I removed ${item?.name} from my plan. Can you suggest an alternative?`;
      break;

    default:
      return null;
  }

  // Generate reactive response
  const events = [];
  for await (const event of handleCompanionMessage(triggerMessage, {
    ...context,
    recentAction: action,
  })) {
    events.push(event);
  }

  return events;
}

module.exports = {
  handleCompanionMessage,
  generateReactiveMessage,
  TOOLS,
};
