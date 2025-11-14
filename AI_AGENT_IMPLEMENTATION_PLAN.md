# AI Travel Agent Companion - Complete Implementation Plan
## The Cursor of Travel: Always-Available, Context-Aware, Autonomous Agent

**Vision**: Build an AI agent that's as capable for travel planning as Cursor is for coding. Always available, deeply contextual, proactive, and can actually DO things—not just answer questions.

**Tech Stack Decision** (based on 2025 best practices):
- **Primary LLM**: Anthropic Claude 3.5 Sonnet (native function calling, streaming, agent-optimized)
- **Web Search Tool**: Perplexity API (used AS a tool, called by Claude)
- **Vector Memory**: PostgreSQL with pgvector (persistent context across sessions)
- **Context Management**: Hybrid compaction + multi-agent architecture

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Agent Logic & Tools](#agent-logic--tools)
6. [Context Management System](#context-management-system)
7. [Deployment & Testing](#deployment--testing)
8. [Week-by-Week Implementation Plan](#week-by-week-implementation-plan)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Floating Chat Bubble (Always Visible)                │  │
│  │  - Minimized: Bottom-right corner                     │  │
│  │  - Expanded: Full chat interface                      │  │
│  │  - Context-aware badge (page, location, activity)     │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  AgentProvider (React Context)                        │  │
│  │  - Persistent WebSocket connection                    │  │
│  │  - Message queue (offline support)                    │  │
│  │  - Context injection (current page, trip, user)       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ WebSocket + REST
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  AgentOrchestrator (Main Brain)                       │  │
│  │  - Receives user query + context                      │  │
│  │  - Calls Claude API with tools                        │  │
│  │  - Executes tool calls                                │  │
│  │  - Manages conversation history                       │  │
│  │  - Streams responses to frontend                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Tool Registry (15+ Tools)                            │  │
│  │  ├─ searchActivities (Google Places)                  │  │
│  │  ├─ checkWeather (OpenWeather)                        │  │
│  │  ├─ webSearch (Perplexity)                            │  │
│  │  ├─ modifyItinerary (Internal)                        │  │
│  │  ├─ findAlternative (Google Places + Internal)        │  │
│  │  ├─ getDirections (Mapbox)                            │  │
│  │  ├─ checkOpeningHours (Google Places)                 │  │
│  │  ├─ addExpense (Internal)                             │  │
│  │  ├─ sendNotification (Push API)                       │  │
│  │  ├─ searchFlights (Skyscanner/Amadeus)                │  │
│  │  ├─ searchHotels (Booking.com API)                    │  │
│  │  ├─ getCityInfo (Wikipedia API + Perplexity)          │  │
│  │  ├─ translateText (Google Translate)                  │  │
│  │  ├─ currencyConversion (Exchange Rate API)            │  │
│  │  └─ getLocalTips (Community DB + Perplexity)          │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Context Manager                                       │  │
│  │  - Loads trip data                                    │  │
│  │  - Tracks user location                               │  │
│  │  - Monitors page context                              │  │
│  │  - Retrieves conversation history                     │  │
│  │  - Compacts context when approaching limits           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Memory System (Vector DB)                            │  │
│  │  - Stores embeddings of conversations                 │  │
│  │  - Semantic search for relevant past interactions     │  │
│  │  - Learns user preferences over time                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                EXTERNAL APIs                                 │
│  - Anthropic Claude API (Agent Brain)                       │
│  - Perplexity API (Web Search Tool)                         │
│  - Google Places API (Activity/Restaurant Search)           │
│  - OpenWeather API (Weather Forecasts)                      │
│  - Mapbox API (Directions, Maps)                            │
│  - PostgreSQL + pgvector (Vector Memory)                    │
└─────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

1. **Claude as Primary Agent**: Native function calling, excellent at multi-step reasoning, streaming responses
2. **Perplexity as Tool**: Superior web search, but no function calling → perfect as a tool called by Claude
3. **WebSocket for Real-Time**: Streaming responses, instant updates, proactive notifications
4. **Vector Memory**: Learn user preferences, recall past trips, personalized recommendations
5. **Context Compaction**: Handle long conversations without hitting token limits
6. **Tool Registry Pattern**: Easy to add new capabilities (flights, hotels, translations)

---

## Database Schema

### New Tables for Agent System

```sql
-- Agent conversation history
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  route_id UUID REFERENCES routes(id) NULL, -- NULL if general query
  session_id UUID NOT NULL, -- Groups related messages
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual messages in conversation
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES agent_conversations(id),
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'tool'
  content TEXT NOT NULL,
  tool_calls JSONB NULL, -- Claude tool calls
  tool_results JSONB NULL, -- Tool execution results
  context_snapshot JSONB NOT NULL, -- Page, location, trip state at message time
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_conversation ON agent_messages(conversation_id);
CREATE INDEX idx_agent_messages_created ON agent_messages(created_at DESC);

-- Vector embeddings for semantic memory
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  message_id UUID REFERENCES agent_messages(id) NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embedding size
  metadata JSONB NOT NULL, -- Trip context, preferences learned, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_memory_embedding ON agent_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_agent_memory_user ON agent_memory(user_id);

-- User preferences learned by agent
CREATE TABLE agent_user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) UNIQUE,
  preferences JSONB NOT NULL, -- Structured: { pace: 'leisurely', budget: 'mid', likes: [], dislikes: [] }
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proactive suggestions cache
CREATE TABLE agent_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id),
  suggestion_type VARCHAR(50) NOT NULL, -- 'optimization', 'weather_alert', 'price_drop', etc.
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NULL
);

CREATE INDEX idx_agent_suggestions_route ON agent_suggestions(route_id)
  WHERE NOT dismissed AND (expires_at IS NULL OR expires_at > NOW());
```

---

## Backend Implementation

### File Structure

```
server/
├── services/
│   ├── AgentOrchestrator.js           (Main agent logic)
│   ├── ContextManager.js               (Context building & compaction)
│   ├── MemoryService.js                (Vector DB operations)
│   ├── ToolRegistry.js                 (All tool definitions)
│   └── ProactiveAgent.js               (Background monitoring)
├── tools/
│   ├── searchActivities.js
│   ├── checkWeather.js
│   ├── webSearch.js                    (Perplexity)
│   ├── modifyItinerary.js
│   ├── findAlternative.js
│   ├── getDirections.js
│   ├── checkOpeningHours.js
│   ├── addExpense.js
│   ├── sendNotification.js
│   ├── searchFlights.js
│   ├── searchHotels.js
│   ├── getCityInfo.js
│   ├── translateText.js
│   ├── currencyConversion.js
│   └── getLocalTips.js
└── routes/
    └── agent.js                        (API endpoints)
```

### 1. AgentOrchestrator.js

```javascript
/**
 * AgentOrchestrator - The Brain
 *
 * Responsibilities:
 * - Receives user query + context
 * - Calls Claude API with function calling
 * - Executes tool calls
 * - Manages conversation history
 * - Streams responses to frontend
 */

const Anthropic = require('@anthropic-ai/sdk');
const ToolRegistry = require('./ToolRegistry');
const ContextManager = require('./ContextManager');
const MemoryService = require('./MemoryService');

class AgentOrchestrator {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.toolRegistry = new ToolRegistry();
    this.contextManager = new ContextManager();
    this.memoryService = new MemoryService();

    // Claude model
    this.model = 'claude-3-5-sonnet-20250115';

    // Max iterations to prevent infinite loops
    this.maxIterations = 10;
  }

  /**
   * Main entry point for agent queries
   *
   * @param {Object} params
   * @param {string} params.userId - Current user ID
   * @param {string} params.routeId - Current route ID (nullable)
   * @param {string} params.message - User's message
   * @param {string} params.sessionId - Conversation session ID
   * @param {Object} params.pageContext - Current page info
   * @param {Object} params.locationContext - User's location (if available)
   * @param {Function} params.onStream - Callback for streaming chunks
   */
  async handleQuery({
    userId,
    routeId,
    message,
    sessionId,
    pageContext,
    locationContext,
    onStream
  }) {
    console.log(`\n🤖 Agent Query from user ${userId}`);
    console.log(`   Message: "${message}"`);
    console.log(`   Page: ${pageContext.page}`);
    console.log(`   Route: ${routeId || 'none'}`);

    try {
      // 1. Build context (trip data, user preferences, relevant memories)
      const context = await this.contextManager.buildContext({
        userId,
        routeId,
        pageContext,
        locationContext,
        sessionId
      });

      // 2. Get conversation history (last 20 messages or compacted)
      const conversationHistory = await this.contextManager.getConversationHistory(sessionId);

      // 3. Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      // 4. Prepare messages for Claude
      const messages = [
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ];

      // 5. Save user message to DB
      await this.saveMessage({
        conversationId: context.conversationId,
        role: 'user',
        content: message,
        contextSnapshot: {
          page: pageContext,
          location: locationContext,
          trip: context.trip
        }
      });

      // 6. Start agent loop with Claude
      const response = await this.runAgentLoop({
        systemPrompt,
        messages,
        context,
        onStream
      });

      // 7. Save assistant response to DB
      await this.saveMessage({
        conversationId: context.conversationId,
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
        toolResults: response.toolResults,
        contextSnapshot: {
          page: pageContext,
          location: locationContext,
          trip: context.trip
        }
      });

      // 8. Store in vector memory for future recall
      await this.memoryService.storeInteraction({
        userId,
        message,
        response: response.content,
        context
      });

      return response;

    } catch (error) {
      console.error('❌ Agent error:', error);
      throw error;
    }
  }

  /**
   * Agent loop with tool calling
   * Implements the agentic workflow: think → act → observe → repeat
   */
  async runAgentLoop({ systemPrompt, messages, context, onStream }) {
    let currentMessages = [...messages];
    let iteration = 0;
    let finalResponse = null;
    let allToolCalls = [];
    let allToolResults = [];

    while (iteration < this.maxIterations) {
      iteration++;
      console.log(`\n🔄 Agent Loop Iteration ${iteration}`);

      // Call Claude with streaming
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: currentMessages,
        tools: this.toolRegistry.getToolDefinitions(),

        // Enable automatic tool clearing (2025 feature)
        extra_headers: {
          'context-management-2025-06-27': 'true'
        }
      });

      let assistantMessage = '';
      let toolUses = [];

      // Stream handler
      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'text') {
            // Text response started
          } else if (event.content_block.type === 'tool_use') {
            // Tool call started
            toolUses.push({
              id: event.content_block.id,
              name: event.content_block.name,
              input: event.content_block.input
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
          }
        }
      }

      // If no tool calls, we're done
      if (toolUses.length === 0) {
        finalResponse = {
          content: assistantMessage,
          toolCalls: allToolCalls,
          toolResults: allToolResults
        };
        break;
      }

      // Execute tool calls
      console.log(`   🔧 Executing ${toolUses.length} tool call(s)...`);
      const toolResults = await this.executeTools(toolUses, context);

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
            result: toolResults[idx].content
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
   * Execute tool calls in parallel
   */
  async executeTools(toolUses, context) {
    const results = await Promise.all(
      toolUses.map(async (use) => {
        try {
          console.log(`      → ${use.name}(${JSON.stringify(use.input).substring(0, 100)}...)`);

          const tool = this.toolRegistry.getTool(use.name);
          const result = await tool.execute(use.input, context);

          console.log(`      ✅ ${use.name} completed`);

          return {
            tool_use_id: use.id,
            content: JSON.stringify(result)
          };
        } catch (error) {
          console.error(`      ❌ ${use.name} failed:`, error.message);

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
   * Build system prompt with context injection
   */
  buildSystemPrompt(context) {
    const { trip, user, pageContext, locationContext, preferences } = context;

    let prompt = `You are an expert travel assistant helping ${user.name || 'the user'} plan and execute their trip.

**Your Capabilities**:
- Search for activities, restaurants, hotels using Google Places
- Check weather forecasts
- Search the web for travel info using Perplexity
- Modify itineraries (add/remove/reorder activities)
- Find alternatives when plans change
- Get directions and navigation
- Check opening hours
- Add expenses
- Send notifications
- Search flights and hotels
- Translate text
- Convert currency
- Get local tips

**Your Personality**:
- Proactive: Anticipate needs, suggest improvements
- Concise: Get to the point, no fluff
- Actionable: Always provide clear next steps
- Honest: If you don't know, say so
- Empathetic: Travel is stressful, be supportive

`;

    // Add trip context if available
    if (trip) {
      prompt += `\n**Current Trip**:
- Route: ${trip.origin} → ${trip.destination}
- Dates: ${trip.startDate} to ${trip.endDate} (${trip.daysRemaining} days remaining)
- Budget: ${trip.budget}
- Cities: ${trip.cities.map(c => c.name).join(' → ')}
- Current Day: Day ${trip.currentDay || 'Not started'}

`;

      if (trip.currentDayPlan) {
        prompt += `**Today's Plan**:
${trip.currentDayPlan.activities.map((a, i) => `${i + 1}. ${a.name} (${a.time})`).join('\n')}

`;
      }
    }

    // Add user preferences
    if (preferences) {
      prompt += `\n**User Preferences** (learned from past interactions):
- Pace: ${preferences.pace || 'unknown'}
- Budget preference: ${preferences.budgetPreference || 'unknown'}
- Likes: ${preferences.likes?.join(', ') || 'unknown'}
- Dislikes: ${preferences.dislikes?.join(', ') || 'unknown'}
- Dietary restrictions: ${preferences.dietary?.join(', ') || 'none'}

`;
    }

    // Add current context
    prompt += `\n**Current Context**:
- Page: ${pageContext.page}
- Viewing: ${pageContext.viewingActivity || pageContext.viewingCity || 'overview'}
`;

    if (locationContext) {
      prompt += `- User location: ${locationContext.city} (${locationContext.lat}, ${locationContext.lng})
`;
    }

    prompt += `
**Instructions**:
1. Always use tools when you need data (don't guess or hallucinate)
2. Chain tool calls when needed (e.g., checkWeather → findAlternative → modifyItinerary)
3. Provide specific, actionable advice
4. If modifying the itinerary, explain WHY
5. Always include next steps or questions to keep conversation flowing

Now help the user with their request.`;

    return prompt;
  }

  /**
   * Save message to database
   */
  async saveMessage({ conversationId, role, content, toolCalls, toolResults, contextSnapshot }) {
    const db = require('../db');

    await db.query(`
      INSERT INTO agent_messages (conversation_id, role, content, tool_calls, tool_results, context_snapshot)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      conversationId,
      role,
      content,
      toolCalls ? JSON.stringify(toolCalls) : null,
      toolResults ? JSON.stringify(toolResults) : null,
      JSON.stringify(contextSnapshot)
    ]);
  }
}

module.exports = AgentOrchestrator;
```

### 2. ContextManager.js

```javascript
/**
 * ContextManager - Context Building & Compaction
 *
 * Responsibilities:
 * - Load trip data from DB
 * - Load user preferences
 * - Retrieve relevant memories from vector DB
 * - Get conversation history
 * - Compact context when approaching token limits
 */

const db = require('../db');
const MemoryService = require('./MemoryService');

class ContextManager {
  constructor() {
    this.memoryService = new MemoryService();

    // Token limits (Claude 3.5 Sonnet has 200k context window)
    this.contextLimit = 180000; // Leave 20k buffer
    this.compactionThreshold = 150000; // Compact when exceeding this
  }

  /**
   * Build complete context for agent
   */
  async buildContext({ userId, routeId, pageContext, locationContext, sessionId }) {
    console.log(`   📦 Building context for user ${userId}...`);

    // 1. Get or create conversation
    const conversationId = await this.getOrCreateConversation(userId, routeId, sessionId);

    // 2. Load trip data (if routeId provided)
    let trip = null;
    if (routeId) {
      trip = await this.loadTripData(routeId);
    }

    // 3. Load user preferences
    const preferences = await this.loadUserPreferences(userId);

    // 4. Load user profile
    const user = await this.loadUser(userId);

    // 5. Retrieve relevant memories
    const relevantMemories = await this.memoryService.retrieveRelevantMemories({
      userId,
      query: pageContext.page, // Use page as query for now
      limit: 5
    });

    console.log(`   ✅ Context built: ${trip ? 'trip loaded' : 'no trip'}, ${preferences ? 'preferences loaded' : 'no preferences'}, ${relevantMemories.length} memories`);

    return {
      conversationId,
      trip,
      user,
      preferences,
      relevantMemories,
      pageContext,
      locationContext,
      sessionId
    };
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(userId, routeId, sessionId) {
    // Check if conversation exists for this session
    const existing = await db.query(`
      SELECT id FROM agent_conversations
      WHERE user_id = $1 AND session_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, sessionId]);

    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    // Create new conversation
    const result = await db.query(`
      INSERT INTO agent_conversations (user_id, route_id, session_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [userId, routeId, sessionId]);

    return result.rows[0].id;
  }

  /**
   * Load trip data with current state
   */
  async loadTripData(routeId) {
    const result = await db.query(`
      SELECT
        r.id,
        r.route_data->>'origin' as origin,
        r.route_data->>'destination' as destination,
        r.route_data->>'budget' as budget,
        r.route_data->'cities' as cities,
        r.route_data->'landmarks' as landmarks,
        r.created_at
      FROM routes r
      WHERE r.id = $1
    `, [routeId]);

    if (result.rows.length === 0) return null;

    const trip = result.rows[0];

    // TODO: Calculate current day based on trip dates
    // TODO: Load current day's plan from itinerary
    // TODO: Calculate days remaining

    return {
      id: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      budget: trip.budget,
      cities: JSON.parse(trip.cities || '[]'),
      landmarks: JSON.parse(trip.landmarks || '[]'),
      currentDay: null, // TODO
      currentDayPlan: null, // TODO
      daysRemaining: null, // TODO
      startDate: null, // TODO
      endDate: null // TODO
    };
  }

  /**
   * Load user preferences
   */
  async loadUserPreferences(userId) {
    const result = await db.query(`
      SELECT preferences FROM agent_user_preferences
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) return null;

    return result.rows[0].preferences;
  }

  /**
   * Load user profile
   */
  async loadUser(userId) {
    const result = await db.query(`
      SELECT id, name, email FROM users
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  /**
   * Get conversation history with compaction
   */
  async getConversationHistory(sessionId) {
    const messages = await db.query(`
      SELECT
        role,
        content,
        tool_calls,
        tool_results,
        created_at
      FROM agent_messages
      WHERE conversation_id = (
        SELECT id FROM agent_conversations
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      )
      ORDER BY created_at ASC
    `, [sessionId]);

    const history = messages.rows.map(msg => {
      const message = {
        role: msg.role,
        content: msg.content
      };

      // Add tool calls if present
      if (msg.tool_calls) {
        message.tool_calls = msg.tool_calls;
      }

      if (msg.tool_results) {
        message.tool_results = msg.tool_results;
      }

      return message;
    });

    // Check if we need compaction
    const estimatedTokens = this.estimateTokenCount(history);

    if (estimatedTokens > this.compactionThreshold) {
      console.log(`   ⚠️  Context approaching limit (${estimatedTokens} tokens), compacting...`);
      return await this.compactHistory(history);
    }

    return history;
  }

  /**
   * Compact conversation history using Claude
   * Implements the "compaction strategy" from 2025 best practices
   */
  async compactHistory(history) {
    // Keep first 2 messages (usually important context)
    const firstMessages = history.slice(0, 2);

    // Keep last 5 messages (recent context)
    const lastMessages = history.slice(-5);

    // Compact the middle section
    const middleMessages = history.slice(2, -5);

    if (middleMessages.length === 0) {
      return history; // Nothing to compact
    }

    // Use Claude to summarize middle section
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const summaryResponse = await client.messages.create({
      model: 'claude-3-5-sonnet-20250115',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Summarize this conversation history, preserving all important facts, decisions, and context. Focus on:\n- What the user wants to accomplish\n- Decisions made\n- Preferences expressed\n- Trip details discussed\n- Any unresolved issues\n\nConversation:\n${JSON.stringify(middleMessages, null, 2)}\n\nProvide a concise summary.`
      }]
    });

    const summary = summaryResponse.content[0].text;

    // Reconstruct compacted history
    return [
      ...firstMessages,
      {
        role: 'assistant',
        content: `[Previous conversation summary: ${summary}]`
      },
      ...lastMessages
    ];
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 chars)
   */
  estimateTokenCount(messages) {
    const text = JSON.stringify(messages);
    return Math.ceil(text.length / 4);
  }
}

module.exports = ContextManager;
```

### 3. ToolRegistry.js

```javascript
/**
 * ToolRegistry - All Tool Definitions
 *
 * Registers all tools available to the agent with their schemas
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
    // 1. Search Activities
    this.register({
      name: 'searchActivities',
      description: 'Search for tourist activities, attractions, museums, parks in a city using Google Places. Returns top-rated activities with photos, ratings, opening hours, and location.',
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
            enum: ['museum', 'park', 'attraction', 'restaurant', 'entertainment', 'outdoor', 'cultural', 'historical']
          },
          radius: {
            type: 'number',
            description: 'Search radius in meters (default: 5000)'
          },
          limit: {
            type: 'number',
            description: 'Max results to return (default: 10)'
          }
        },
        required: ['city', 'category']
      },
      execute: require('../tools/searchActivities')
    });

    // 2. Check Weather
    this.register({
      name: 'checkWeather',
      description: 'Get weather forecast for a location. Returns current weather and 7-day forecast with temperature, conditions, rain probability.',
      inputSchema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name or coordinates (e.g., "Paris, France" or "48.8566,2.3522")'
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

    // 3. Web Search (Perplexity)
    this.register({
      name: 'webSearch',
      description: 'Search the web for travel information, tips, guides using Perplexity. Use this for questions about destinations, local customs, visa requirements, best time to visit, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          },
          focus: {
            type: 'string',
            description: 'Focus area for search',
            enum: ['travel', 'restaurants', 'culture', 'safety', 'transportation', 'general']
          }
        },
        required: ['query']
      },
      execute: require('../tools/webSearch')
    });

    // 4. Modify Itinerary
    this.register({
      name: 'modifyItinerary',
      description: 'Add, remove, or reorder activities in the trip itinerary. Use this when user wants to change their plans.',
      inputSchema: {
        type: 'object',
        properties: {
          routeId: {
            type: 'string',
            description: 'Route ID'
          },
          action: {
            type: 'string',
            description: 'Type of modification',
            enum: ['add', 'remove', 'reorder', 'replace']
          },
          dayNumber: {
            type: 'number',
            description: 'Day number to modify (1-indexed)'
          },
          activityId: {
            type: 'string',
            description: 'Activity ID for remove/replace actions'
          },
          newActivity: {
            type: 'object',
            description: 'New activity data for add/replace actions',
            properties: {
              name: { type: 'string' },
              placeId: { type: 'string' },
              time: { type: 'string' },
              duration: { type: 'string' }
            }
          },
          newOrder: {
            type: 'array',
            description: 'New activity order for reorder action',
            items: { type: 'string' }
          }
        },
        required: ['routeId', 'action', 'dayNumber']
      },
      execute: require('../tools/modifyItinerary')
    });

    // 5. Find Alternative
    this.register({
      name: 'findAlternative',
      description: 'Find alternative activities when original plan fails (closed, weather, etc.). Searches for similar activities nearby.',
      inputSchema: {
        type: 'object',
        properties: {
          originalActivity: {
            type: 'object',
            description: 'Original activity that failed',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              location: { type: 'string' }
            }
          },
          reason: {
            type: 'string',
            description: 'Why alternative is needed (closed, weather, etc.)'
          },
          preferences: {
            type: 'object',
            description: 'User preferences for alternative',
            properties: {
              indoor: { type: 'boolean' },
              maxDistance: { type: 'number' },
              similarType: { type: 'boolean' }
            }
          }
        },
        required: ['originalActivity', 'reason']
      },
      execute: require('../tools/findAlternative')
    });

    // 6. Get Directions
    this.register({
      name: 'getDirections',
      description: 'Get navigation directions between two locations using Mapbox. Returns route, distance, duration, and turn-by-turn instructions.',
      inputSchema: {
        type: 'object',
        properties: {
          from: {
            type: 'string',
            description: 'Start location (address or coordinates)'
          },
          to: {
            type: 'string',
            description: 'Destination location (address or coordinates)'
          },
          mode: {
            type: 'string',
            description: 'Transportation mode',
            enum: ['driving', 'walking', 'cycling', 'transit'],
            default: 'driving'
          }
        },
        required: ['from', 'to']
      },
      execute: require('../tools/getDirections')
    });

    // 7. Check Opening Hours
    this.register({
      name: 'checkOpeningHours',
      description: 'Check if a place is open at a specific time using Google Places. Returns opening hours, current status, and busy times.',
      inputSchema: {
        type: 'object',
        properties: {
          placeId: {
            type: 'string',
            description: 'Google Place ID'
          },
          date: {
            type: 'string',
            description: 'Date to check (YYYY-MM-DD)'
          },
          time: {
            type: 'string',
            description: 'Time to check (HH:MM)'
          }
        },
        required: ['placeId']
      },
      execute: require('../tools/checkOpeningHours')
    });

    // 8. Add Expense
    this.register({
      name: 'addExpense',
      description: 'Add an expense to the trip for expense tracking. Use this when user mentions spending money.',
      inputSchema: {
        type: 'object',
        properties: {
          routeId: {
            type: 'string',
            description: 'Route ID'
          },
          amount: {
            type: 'number',
            description: 'Expense amount'
          },
          currency: {
            type: 'string',
            description: 'Currency code (EUR, USD, etc.)',
            default: 'EUR'
          },
          category: {
            type: 'string',
            description: 'Expense category',
            enum: ['accommodation', 'food', 'transport', 'activities', 'shopping', 'other']
          },
          description: {
            type: 'string',
            description: 'What was purchased'
          },
          paidBy: {
            type: 'string',
            description: 'User ID who paid'
          }
        },
        required: ['routeId', 'amount', 'category', 'description']
      },
      execute: require('../tools/addExpense')
    });

    // 9. Send Notification
    this.register({
      name: 'sendNotification',
      description: 'Send a push notification to user\'s device. Use for important alerts (weather warnings, time reminders, etc.).',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'User ID to notify'
          },
          title: {
            type: 'string',
            description: 'Notification title'
          },
          message: {
            type: 'string',
            description: 'Notification message'
          },
          priority: {
            type: 'string',
            description: 'Notification priority',
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal'
          },
          actionUrl: {
            type: 'string',
            description: 'URL to open when notification clicked'
          }
        },
        required: ['userId', 'title', 'message']
      },
      execute: require('../tools/sendNotification')
    });

    // 10. Search Flights
    this.register({
      name: 'searchFlights',
      description: 'Search for flights between two cities. Returns flight options with prices, duration, airlines.',
      inputSchema: {
        type: 'object',
        properties: {
          origin: {
            type: 'string',
            description: 'Origin airport code or city'
          },
          destination: {
            type: 'string',
            description: 'Destination airport code or city'
          },
          departureDate: {
            type: 'string',
            description: 'Departure date (YYYY-MM-DD)'
          },
          returnDate: {
            type: 'string',
            description: 'Return date (YYYY-MM-DD), optional for one-way'
          },
          passengers: {
            type: 'number',
            description: 'Number of passengers',
            default: 1
          }
        },
        required: ['origin', 'destination', 'departureDate']
      },
      execute: require('../tools/searchFlights')
    });

    // 11. Search Hotels
    this.register({
      name: 'searchHotels',
      description: 'Search for hotels in a city. Returns hotel options with prices, ratings, amenities.',
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
          guests: {
            type: 'number',
            description: 'Number of guests',
            default: 2
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum price per night in EUR'
          },
          minRating: {
            type: 'number',
            description: 'Minimum rating (1-5)'
          }
        },
        required: ['city', 'checkIn', 'checkOut']
      },
      execute: require('../tools/searchHotels')
    });

    // 12. Get City Info
    this.register({
      name: 'getCityInfo',
      description: 'Get comprehensive information about a city (history, culture, tips, safety). Uses Wikipedia + Perplexity.',
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
            enum: ['overview', 'history', 'culture', 'food', 'safety', 'transportation', 'tips']
          }
        },
        required: ['city']
      },
      execute: require('../tools/getCityInfo')
    });

    // 13. Translate Text
    this.register({
      name: 'translateText',
      description: 'Translate text to another language using Google Translate. Useful for restaurant menus, signs, conversations.',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to translate'
          },
          targetLanguage: {
            type: 'string',
            description: 'Target language code (en, fr, es, etc.)'
          },
          sourceLanguage: {
            type: 'string',
            description: 'Source language code (auto-detect if not provided)'
          }
        },
        required: ['text', 'targetLanguage']
      },
      execute: require('../tools/translateText')
    });

    // 14. Currency Conversion
    this.register({
      name: 'currencyConversion',
      description: 'Convert amount between currencies using live exchange rates.',
      inputSchema: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Amount to convert'
          },
          from: {
            type: 'string',
            description: 'Source currency code (EUR, USD, etc.)'
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

    // 15. Get Local Tips
    this.register({
      name: 'getLocalTips',
      description: 'Get crowd-sourced local tips for a place from community database + Perplexity. Returns insider advice from real travelers.',
      inputSchema: {
        type: 'object',
        properties: {
          placeId: {
            type: 'string',
            description: 'Google Place ID'
          },
          category: {
            type: 'string',
            description: 'Type of tips wanted',
            enum: ['visiting', 'eating', 'parking', 'tickets', 'timing', 'general']
          }
        },
        required: ['placeId']
      },
      execute: require('../tools/getLocalTips')
    });
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

    console.log(`   ✅ Registered tool: ${name}`);
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
```

### 4. Example Tool Implementation: webSearch.js

```javascript
/**
 * Web Search Tool - Uses Perplexity API
 */

const axios = require('axios');

async function webSearch({ query, focus = 'general' }, context) {
  console.log(`         🔍 Searching web: "${query}" (focus: ${focus})`);

  try {
    // Enhance query based on focus
    const enhancedQuery = enhanceQuery(query, focus);

    // Call Perplexity API
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{
        role: 'user',
        content: enhancedQuery
      }],
      max_tokens: 1000,
      temperature: 0.2,
      search_domain_filter: ['tripadvisor.com', 'lonelyplanet.com', 'timeout.com'], // Travel-focused
      return_citations: true
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const answer = response.data.choices[0].message.content;
    const citations = response.data.citations || [];

    console.log(`         ✅ Found ${citations.length} sources`);

    return {
      success: true,
      answer,
      citations,
      query: enhancedQuery
    };

  } catch (error) {
    console.error(`         ❌ Perplexity search failed:`, error.message);

    return {
      success: false,
      error: error.message
    };
  }
}

function enhanceQuery(query, focus) {
  const prefixes = {
    travel: 'Travel guide: ',
    restaurants: 'Best restaurants and food in ',
    culture: 'Culture and customs in ',
    safety: 'Safety tips and advice for travelers in ',
    transportation: 'Transportation and getting around ',
    general: ''
  };

  return prefixes[focus] + query;
}

module.exports = webSearch;
```

---

## Frontend Implementation

### File Structure

```
spotlight-react/src/
├── components/
│   └── agent/
│       ├── AgentChatBubble.tsx          (Floating chat button)
│       ├── AgentChatWindow.tsx          (Expanded chat interface)
│       ├── AgentMessage.tsx             (Message component)
│       ├── AgentThinking.tsx            (Thinking indicator)
│       ├── AgentToolExecution.tsx       (Tool execution display)
│       └── AgentSuggestionCard.tsx      (Proactive suggestions)
├── hooks/
│   ├── useAgent.ts                      (Main agent hook)
│   └── useAgentContext.ts               (Context tracking)
├── providers/
│   └── AgentProvider.tsx                (Global agent state)
└── services/
    └── agentService.ts                  (API calls)
```

### 1. AgentProvider.tsx

```tsx
/**
 * AgentProvider - Global Agent State
 *
 * Provides agent chat interface to entire app
 * Manages WebSocket connection, message queue, context tracking
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { agentService } from '../services/agentService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolExecutions?: ToolExecution[];
  timestamp: Date;
}

interface ToolExecution {
  name: string;
  input: any;
  result: any;
}

interface AgentContextType {
  isOpen: boolean;
  toggleChat: () => void;
  messages: Message[];
  sendMessage: (message: string) => Promise<void>;
  isThinking: boolean;
  sessionId: string;
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId] = useState(() => uuidv4());

  const location = useLocation();

  // Toggle chat window
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Send message to agent
  const sendMessage = useCallback(async (messageText: string) => {
    // Add user message immediately
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);

    try {
      // Get current context
      const context = getPageContext(location.pathname);

      // Get user location (if available)
      const locationContext = await getUserLocation();

      // Get route ID from URL if present
      const routeId = getRouteIdFromUrl(location.pathname);

      // Stream response from agent
      let assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        toolExecutions: [],
        timestamp: new Date()
      };

      await agentService.sendMessage({
        message: messageText,
        sessionId,
        routeId,
        pageContext: context,
        locationContext,
        onStream: (chunk) => {
          if (chunk.type === 'text') {
            // Append text chunk
            assistantMessage.content += chunk.content;
            setMessages(prev => {
              const filtered = prev.filter(m => m.id !== assistantMessage.id);
              return [...filtered, { ...assistantMessage }];
            });
          } else if (chunk.type === 'tool_execution') {
            // Add tool executions
            assistantMessage.toolExecutions = chunk.tools;
            setMessages(prev => {
              const filtered = prev.filter(m => m.id !== assistantMessage.id);
              return [...filtered, { ...assistantMessage }];
            });
          }
        }
      });

      setIsThinking(false);

    } catch (error) {
      console.error('Agent error:', error);
      setIsThinking(false);

      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [sessionId, location]);

  return (
    <AgentContext.Provider value={{
      isOpen,
      toggleChat,
      messages,
      sendMessage,
      isThinking,
      sessionId
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within AgentProvider');
  }
  return context;
}

// Helper: Get page context
function getPageContext(pathname: string) {
  if (pathname.includes('/spotlight')) {
    return {
      page: 'spotlight',
      section: 'route_overview'
    };
  } else if (pathname.includes('/itinerary')) {
    return {
      page: 'itinerary',
      section: 'day_view'
    };
  } else {
    return {
      page: 'landing',
      section: 'home'
    };
  }
}

// Helper: Get route ID from URL
function getRouteIdFromUrl(pathname: string): string | null {
  const match = pathname.match(/routeId=([a-f0-9-]+)/);
  return match ? match[1] : null;
}

// Helper: Get user's location
async function getUserLocation(): Promise<any> {
  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        () => {
          resolve(null); // Permission denied or error
        }
      );
    } else {
      resolve(null);
    }
  });
}
```

### 2. AgentChatBubble.tsx

```tsx
/**
 * AgentChatBubble - Floating Chat Button
 *
 * Always visible in bottom-right corner
 * Shows notification badge when agent has suggestions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { useAgent } from '../providers/AgentProvider';
import { AgentChatWindow } from './AgentChatWindow';

export function AgentChatBubble() {
  const { isOpen, toggleChat, messages } = useAgent();
  const [hasUnread, setHasUnread] = useState(false);

  // Check for unread messages
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setHasUnread(true);
      }
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {hasUnread && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-3 h-3" />
          </motion.div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && <AgentChatWindow />}
      </AnimatePresence>
    </>
  );
}
```

### 3. AgentChatWindow.tsx

```tsx
/**
 * AgentChatWindow - Main Chat Interface
 *
 * Expanded chat window with message history, input, thinking indicators
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useAgent } from '../providers/AgentProvider';
import { AgentMessage } from './AgentMessage';
import { AgentThinking } from './AgentThinking';

export function AgentChatWindow() {
  const { messages, sendMessage, isThinking } = useAgent();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const messageText = input;
    setInput('');
    await sendMessage(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 right-6 z-40 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
        <h3 className="font-bold text-lg">Travel Assistant</h3>
        <p className="text-sm opacity-90">Your AI trip companion</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-semibold mb-2">👋 Hi! How can I help?</p>
            <p className="text-sm">Ask me anything about your trip!</p>

            {/* Quick suggestions */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => sendMessage("What's the weather like tomorrow?")}
                className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-left transition-colors"
              >
                What's the weather like tomorrow?
              </button>
              <button
                onClick={() => sendMessage("Find me restaurants nearby")}
                className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-left transition-colors"
              >
                Find me restaurants nearby
              </button>
              <button
                onClick={() => sendMessage("Optimize my itinerary")}
                className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-left transition-colors"
              >
                Optimize my itinerary
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <AgentMessage key={message.id} message={message} />
        ))}

        {isThinking && <AgentThinking />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500"
            rows={1}
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isThinking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

### 4. AgentMessage.tsx

```tsx
/**
 * AgentMessage - Individual Message Component
 *
 * Renders user/assistant messages with tool execution display
 */

import { motion } from 'framer-motion';
import { Bot, User, Wrench } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolExecutions?: ToolExecution[];
  timestamp: Date;
}

interface ToolExecution {
  name: string;
  input: any;
  result: any;
}

export function AgentMessage({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        message.role === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      }`}>
        {message.role === 'user' ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block px-4 py-2 rounded-2xl max-w-[80%] ${
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}>
          <ReactMarkdown
            className="prose prose-sm max-w-none"
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
                  {children}
                </a>
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Tool Executions */}
        {message.toolExecutions && message.toolExecutions.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.toolExecutions.map((tool, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-700">{formatToolName(tool.name)}</span>
                </div>
                <div className="text-gray-600">
                  {formatToolResult(tool)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
}

function formatToolName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function formatToolResult(tool: ToolExecution): string {
  // Simple formatting - can be enhanced
  if (tool.name === 'searchActivities') {
    const count = tool.result?.activities?.length || 0;
    return `Found ${count} activities`;
  } else if (tool.name === 'checkWeather') {
    return `${tool.result?.condition}, ${tool.result?.temp}°C`;
  } else if (tool.name === 'webSearch') {
    return `Searched: ${tool.input.query}`;
  } else {
    return 'Executed successfully';
  }
}
```

---

## Week-by-Week Implementation Plan

### Week 1-2: Foundation

**Goal**: Get basic agent working with 3-5 core tools

**Tasks**:
1. **Database Setup** (Day 1)
   - Run migrations for agent tables
   - Set up pgvector extension
   - Test vector storage

2. **Backend Core** (Day 2-4)
   - Implement AgentOrchestrator.js
   - Implement ContextManager.js (basic version, no compaction yet)
   - Implement ToolRegistry.js
   - Implement 5 core tools:
     - searchActivities
     - checkWeather
     - webSearch (Perplexity)
     - modifyItinerary
     - checkOpeningHours

3. **API Endpoints** (Day 5-6)
   - POST /api/agent/query (handle agent queries)
   - GET /api/agent/history/:sessionId
   - WebSocket setup for streaming

4. **Frontend Core** (Day 7-10)
   - AgentProvider.tsx
   - AgentChatBubble.tsx
   - AgentChatWindow.tsx
   - AgentMessage.tsx
   - agentService.ts

5. **Testing** (Day 11-14)
   - Test basic queries
   - Test tool calling
   - Test streaming responses
   - Fix bugs

**Milestone**: User can ask "What's the weather in Paris?" and agent searches web + weather API and responds.

---

### Week 3-4: Advanced Tools & Intelligence

**Goal**: Add 10 more tools, implement context compaction, add memory

**Tasks**:
1. **Implement Remaining Tools** (Day 15-18)
   - findAlternative
   - getDirections
   - addExpense
   - sendNotification
   - searchFlights
   - searchHotels
   - getCityInfo
   - translateText
   - currencyConversion
   - getLocalTips

2. **Memory System** (Day 19-21)
   - Implement MemoryService.js
   - Vector embedding generation (OpenAI ada-002)
   - Semantic search
   - Store user preferences

3. **Context Compaction** (Day 22-24)
   - Implement compaction in ContextManager
   - Test with long conversations
   - Token counting logic

4. **Proactive Agent** (Day 25-28)
   - ProactiveAgent.js background service
   - Weather monitoring
   - Price drop alerts
   - Optimization suggestions
   - Cron job setup

**Milestone**: Agent remembers past conversations, compacts context automatically, and proactively suggests improvements.

---

### Week 5-6: Polish & Mobile

**Goal**: Mobile optimization, error handling, performance tuning

**Tasks**:
1. **Mobile UI** (Day 29-32)
   - Responsive chat window
   - Mobile floating button
   - Touch gestures
   - Keyboard handling

2. **Error Handling** (Day 33-35)
   - Retry logic for failed tools
   - Graceful degradation
   - User-friendly error messages
   - Logging & monitoring

3. **Performance** (Day 36-38)
   - Response caching
   - Tool result caching
   - Database query optimization
   - Frontend rendering optimization

4. **Testing & QA** (Day 39-42)
   - End-to-end testing
   - Load testing
   - User acceptance testing
   - Bug fixes

**Milestone**: Production-ready agent, works flawlessly on mobile, handles errors gracefully.

---

### Week 7-8: Advanced Features

**Goal**: Multi-language support, voice input, advanced context awareness

**Tasks**:
1. **Multi-language** (Day 43-45)
   - Detect user language
   - Translate queries/responses
   - Localized tool results

2. **Voice Input** (Day 46-48)
   - Speech-to-text integration
   - Voice button in chat
   - Audio feedback

3. **Advanced Context** (Day 49-52)
   - Page-specific suggestions
   - Location-aware responses
   - Trip progress tracking

4. **Analytics & Monitoring** (Day 53-56)
   - Tool usage tracking
   - Response quality metrics
   - User satisfaction surveys
   - Performance dashboards

**Milestone**: Fully-featured AI agent that rivals Cursor's capabilities for travel.

---

## Deployment & Testing

### Environment Variables

```bash
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity
PERPLEXITY_API_KEY=pplx-...

# Google APIs
GOOGLE_PLACES_API_KEY=...
GOOGLE_TRANSLATE_API_KEY=...

# OpenWeather
OPENWEATHER_API_KEY=...

# Mapbox
MAPBOX_API_KEY=...

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://...
```

### Deployment Steps

1. **Database Migration**
   ```bash
   npm run migrate:agent
   ```

2. **Install Dependencies**
   ```bash
   cd server && npm install @anthropic-ai/sdk axios
   cd spotlight-react && npm install react-markdown
   ```

3. **Build Frontend**
   ```bash
   cd spotlight-react && npm run build
   ```

4. **Deploy to Heroku**
   ```bash
   git add .
   git commit -m "Add AI Agent Companion"
   git push heroku main
   ```

5. **Test Production**
   - Visit app
   - Click agent bubble
   - Test queries
   - Monitor logs

---

## Success Metrics

Track these metrics to measure agent quality:

1. **Response Accuracy**: % of queries answered correctly
2. **Tool Success Rate**: % of tool calls that succeed
3. **Response Time**: Average time to first response
4. **User Satisfaction**: Post-chat rating (1-5 stars)
5. **Conversation Length**: Average messages per session
6. **Tool Usage**: Most/least used tools
7. **Error Rate**: % of queries that error
8. **Retention**: % of users who use agent again

---

## Next Steps After Launch

1. **Fine-tune Prompts**: Iterate on system prompts based on real usage
2. **Add More Tools**: Visa requirements, packing lists, local events
3. **Agent Personality**: Multiple agent personas (adventure, luxury, budget)
4. **Group Chat**: Multiple users talking to same agent
5. **Booking Integration**: Direct booking via agent (when company set up)
6. **Voice Agent**: Full voice conversation mode
7. **Proactive Intelligence**: Agent messages user without asking

---

## Summary

This plan delivers a **production-ready AI travel agent** that:

✅ Works on every page, always available
✅ Has access to 15+ tools (search, weather, booking, translation, etc.)
✅ Remembers context across sessions (vector memory)
✅ Streams responses in real-time
✅ Handles long conversations (context compaction)
✅ Proactively suggests improvements
✅ Works offline (message queue)
✅ Mobile-optimized
✅ Production-grade error handling

**Total Timeline**: 8 weeks (56 days)
**Complexity**: High (similar to building Cursor's agent)
**Value**: Revolutionary (no competitor has this)

Let's build the Cursor of travel. 🚀
