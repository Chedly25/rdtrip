/**
 * AgentOrchestrator - The Brain
 *
 * Uses Claude Haiku 4.5 for fast, cost-efficient agent responses
 * Handles function calling, streaming, and conversation management
 */

const Anthropic = require('@anthropic-ai/sdk');
const ToolRegistry = require('./ToolRegistry');
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

    // Max iterations to prevent infinite loops
    this.maxIterations = 10;

    console.log('🤖 AgentOrchestrator initialized with Claude Haiku 4.5');
  }

  /**
   * Main entry point for agent queries
   *
   * @param {Object} params
   * @param {string} params.userId - Current user ID
   * @param {string} params.routeId - Current route ID (optional)
   * @param {string} params.message - User's message
   * @param {string} params.sessionId - Conversation session ID
   * @param {Object} params.pageContext - Current page info
   * @param {Function} params.onStream - Callback for streaming chunks
   */
  async handleQuery({
    userId,
    routeId,
    message,
    sessionId,
    pageContext,
    onStream
  }) {
    console.log(`\n🤖 Agent Query from user ${userId}`);
    console.log(`   Message: "${message}"`);
    console.log(`   Page: ${pageContext?.page || 'unknown'}`);

    try {
      // 1. Get or create conversation
      const conversationId = await this.getOrCreateConversation(userId, routeId, sessionId);

      // 2. Build context
      const context = {
        userId,
        routeId,
        conversationId,
        pageContext: pageContext || {},
        sessionId
      };

      // 3. Get conversation history (last 10 messages)
      const conversationHistory = await this.getConversationHistory(sessionId);

      // 4. Build system prompt
      const systemPrompt = this.buildSystemPrompt(context);

      // 5. Prepare messages for Claude
      const messages = [
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ];

      // 6. Save user message
      await this.saveMessage({
        conversationId,
        role: 'user',
        content: message,
        contextSnapshot: { page: pageContext }
      });

      // 7. Run agent loop with Claude
      const response = await this.runAgentLoop({
        systemPrompt,
        messages,
        context,
        onStream
      });

      // 8. Save assistant response
      await this.saveMessage({
        conversationId,
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
        toolResults: response.toolResults,
        contextSnapshot: { page: pageContext }
      });

      return response;

    } catch (error) {
      console.error('❌ Agent error:', error);
      throw error;
    }
  }

  /**
   * Agent loop with tool calling
   * Implements: think → act → observe → repeat
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
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: currentMessages,
        tools: this.toolRegistry.getToolDefinitions(),
        stream: true
      });

      let assistantMessage = '';
      let toolUses = [];

      // Stream handler
      for await (const event of response) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            // Tool call started
            toolUses.push({
              id: event.content_block.id,
              name: event.content_block.name,
              input: {}
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
            // Tool input delta
            if (toolUses.length > 0) {
              const currentTool = toolUses[toolUses.length - 1];
              currentTool.input = event.delta.partial_json;
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

      // Parse tool inputs
      toolUses = toolUses.map(use => ({
        ...use,
        input: typeof use.input === 'string' ? JSON.parse(use.input) : use.input
      }));

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
          console.log(`      → ${use.name}(...)`);

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
    const { pageContext } = context;

    let prompt = `You are an expert travel assistant for RDTrip, a road trip planning platform.

**Your Capabilities**:
- Answer questions about travel destinations
- Provide weather information
- Search the web for travel tips
- Help plan and modify itineraries
- Give directions and navigation help

**Your Personality**:
- Helpful and enthusiastic about travel
- Concise and to the point
- Actionable - always suggest next steps
- Honest - if you don't know, say so

**Current Context**:
- Page: ${pageContext.page || 'unknown'}
- User is ${pageContext.page === 'itinerary' ? 'viewing their itinerary' : pageContext.page === 'spotlight' ? 'exploring their route' : 'on the landing page'}

Help the user with their travel planning needs!`;

    return prompt;
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(userId, routeId, sessionId) {
    // Check if conversation exists
    const existing = await this.db.query(`
      SELECT id FROM agent_conversations
      WHERE user_id = $1 AND session_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, sessionId]);

    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }

    // Create new conversation
    const result = await this.db.query(`
      INSERT INTO agent_conversations (user_id, route_id, session_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [userId, routeId, sessionId]);

    return result.rows[0].id;
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId) {
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

    return messages.rows.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Save message to database
   */
  async saveMessage({ conversationId, role, content, toolCalls, toolResults, contextSnapshot }) {
    await this.db.query(`
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
