/**
 * VoyagerAgent
 *
 * The main conversational agent for route discovery.
 * Implements an agentic loop: Plan → Execute → Reflect → Respond
 *
 * Uses Claude Haiku for speed and cost efficiency.
 */

const Anthropic = require('@anthropic-ai/sdk');
const EventEmitter = require('events');
const { buildSystemPrompt, getProactivePrompt } = require('../../prompts/voyagerPersonality');
const VoyagerToolRegistry = require('./VoyagerToolRegistry');
const VoyagerContextBuilder = require('../../services/VoyagerContextBuilder');
const CitySearchCache = require('../../services/CitySearchCache');

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60000, // 1 minute window
  maxRequests: 20, // Max 20 requests per minute per session
  cleanupIntervalMs: 300000 // Clean up old entries every 5 minutes
};

// Fallback responses for graceful degradation
const FALLBACK_RESPONSES = {
  rateLimited: "I'm getting a lot of requests right now. Give me a moment and try again.",
  apiError: "I'm having trouble connecting to my knowledge sources. Let me try a simpler approach.",
  timeout: "That's taking longer than expected. Let me give you what I have so far.",
  toolError: "I ran into an issue while searching. Let me try a different approach.",
  generic: "I encountered an unexpected issue. Could you try rephrasing your question?"
};

class VoyagerAgent extends EventEmitter {
  constructor(db, googlePlacesService = null) {
    super();

    this.db = db;
    this.anthropic = new Anthropic();
    this.model = 'claude-3-5-haiku-20241022'; // Fast and cost-effective

    // Initialize context builder
    this.contextBuilder = new VoyagerContextBuilder(db);

    // Initialize city search cache
    this.citySearchCache = new CitySearchCache(db, {
      ttlHours: 24,
      maxCacheSize: 1000
    });

    // Initialize tool registry with cache
    this.toolRegistry = new VoyagerToolRegistry({
      db,
      googlePlacesService,
      contextBuilder: this.contextBuilder,
      cache: this.citySearchCache
    });

    // Agentic loop settings
    this.maxIterations = 5;
    this.maxTokens = 1024;

    // Rate limiting state
    this.rateLimitMap = new Map();
    this.setupRateLimitCleanup();

    // Setup cache cleanup
    this.setupCacheCleanup();

    console.log('🧭 VoyagerAgent initialized');
  }

  /**
   * Setup periodic cache cleanup
   */
  setupCacheCleanup() {
    // Clean up expired cache entries every hour
    setInterval(() => {
      this.citySearchCache.cleanup().catch(err => {
        console.error('Cache cleanup error:', err.message);
      });
    }, 3600000);
  }

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  /**
   * Setup periodic cleanup of rate limit entries
   */
  setupRateLimitCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.rateLimitMap.entries()) {
        if (now - data.windowStart > RATE_LIMIT.windowMs * 2) {
          this.rateLimitMap.delete(key);
        }
      }
    }, RATE_LIMIT.cleanupIntervalMs);
  }

  /**
   * Check if session is rate limited
   */
  isRateLimited(sessionId) {
    const key = `rate:${sessionId}`;
    const now = Date.now();
    let data = this.rateLimitMap.get(key);

    if (!data || now - data.windowStart > RATE_LIMIT.windowMs) {
      // New window
      data = { windowStart: now, count: 0 };
      this.rateLimitMap.set(key, data);
    }

    return data.count >= RATE_LIMIT.maxRequests;
  }

  /**
   * Record a request for rate limiting
   */
  recordRequest(sessionId) {
    const key = `rate:${sessionId}`;
    const now = Date.now();
    let data = this.rateLimitMap.get(key);

    if (!data || now - data.windowStart > RATE_LIMIT.windowMs) {
      data = { windowStart: now, count: 1 };
    } else {
      data.count++;
    }

    this.rateLimitMap.set(key, data);
  }

  /**
   * Handle a user message with full agentic loop
   */
  async handleMessage(message, sessionId, routeData, options = {}) {
    const { onEvent, conversationHistory = [], userId = null } = options;

    const startTime = Date.now();

    // Check rate limit
    if (this.isRateLimited(sessionId)) {
      console.warn(`⚠️ Rate limited session: ${sessionId}`);
      this.emitEvent(onEvent, 'error', {
        message: FALLBACK_RESPONSES.rateLimited,
        type: 'rate_limited'
      });
      return {
        response: FALLBACK_RESPONSES.rateLimited,
        toolCalls: [],
        actions: [],
        iterations: 0,
        rateLimited: true
      };
    }

    // Record this request
    this.recordRequest(sessionId);

    // Emit thinking event
    this.emitEvent(onEvent, 'thinking', {
      text: 'Processing your request...'
    });

    try {
      // Ensure session exists in database
      await this.contextBuilder.getOrCreateSession(sessionId, routeData, userId);

      // Build rich context
      const context = await this.contextBuilder.buildContext(sessionId, routeData);

      // Build system prompt with context
      const systemPrompt = buildSystemPrompt(context);

      // Build messages array with history
      const messages = this.buildMessages(conversationHistory, message);

      // Save user message
      await this.contextBuilder.saveMessage(sessionId, 'user', message);
      await this.contextBuilder.incrementMessageCount(sessionId);

      // Execute agentic loop with timeout
      const result = await this.executeWithTimeout(
        this.agenticLoop({
          systemPrompt,
          messages,
          sessionId,
          routeData,
          context,
          onEvent
        }),
        60000 // 60 second timeout
      );

      // Save assistant response
      await this.contextBuilder.saveMessage(
        sessionId,
        'assistant',
        result.response,
        result.toolCalls
      );

      // Update session preferences if we inferred new ones
      if (context.preferences?.confidence > 0.6) {
        await this.contextBuilder.updateSessionPreferences(sessionId, context.preferences);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ VoyagerAgent completed in ${duration}ms`);

      // Emit complete event
      this.emitEvent(onEvent, 'complete', {
        response: result.response,
        actions: result.actions,
        duration
      });

      return result;

    } catch (error) {
      console.error('❌ VoyagerAgent error:', error);

      // Determine error type and fallback response
      const fallbackResponse = this.getFallbackResponse(error);

      this.emitEvent(onEvent, 'error', {
        message: fallbackResponse,
        type: error.type || 'unknown'
      });

      // Save error response to maintain conversation continuity
      await this.contextBuilder.saveMessage(
        sessionId,
        'assistant',
        fallbackResponse,
        null
      );

      return {
        response: fallbackResponse,
        toolCalls: [],
        actions: [],
        iterations: 0,
        error: error.message
      };
    }
  }

  /**
   * Execute a promise with timeout
   */
  async executeWithTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error('Request timeout');
          error.type = 'timeout';
          reject(error);
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Get appropriate fallback response for error type
   */
  getFallbackResponse(error) {
    if (error.type === 'timeout') {
      return FALLBACK_RESPONSES.timeout;
    }

    if (error.message?.includes('rate')) {
      return FALLBACK_RESPONSES.rateLimited;
    }

    if (error.message?.includes('API') || error.message?.includes('anthropic')) {
      return FALLBACK_RESPONSES.apiError;
    }

    if (error.message?.includes('tool')) {
      return FALLBACK_RESPONSES.toolError;
    }

    return FALLBACK_RESPONSES.generic;
  }

  /**
   * Execute the agentic loop
   */
  async agenticLoop({ systemPrompt, messages, sessionId, routeData, context, onEvent }) {
    let currentMessages = [...messages];
    let iterations = 0;
    let allToolCalls = [];
    let allActions = [];

    while (iterations < this.maxIterations) {
      iterations++;

      // Call Claude
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        tools: this.toolRegistry.getToolDefinitions(),
        messages: currentMessages
      });

      // Check stop reason
      if (response.stop_reason === 'end_turn') {
        // Agent is done, extract final response
        const textContent = response.content.find(c => c.type === 'text');
        return {
          response: textContent?.text || '',
          toolCalls: allToolCalls,
          actions: allActions,
          iterations
        };
      }

      if (response.stop_reason === 'tool_use') {
        // Agent wants to use tools
        const toolUseBlocks = response.content.filter(c => c.type === 'tool_use');

        // Also capture any text before tool use
        const textBefore = response.content.find(c => c.type === 'text');
        if (textBefore?.text) {
          this.emitEvent(onEvent, 'text', { text: textBefore.text });
        }

        // Execute each tool
        const toolResults = [];

        for (const toolUse of toolUseBlocks) {
          const { id, name, input } = toolUse;

          // Emit tool start
          this.emitEvent(onEvent, 'tool_start', {
            tool: name,
            input
          });

          // Execute tool
          const result = await this.toolRegistry.executeTool(name, input, {
            sessionId,
            routeData,
            onRouteUpdate: (action) => {
              allActions.push(action);
              this.emitEvent(onEvent, 'route_action', action);
            }
          });

          // Emit tool complete
          this.emitEvent(onEvent, 'tool_complete', {
            tool: name,
            result
          });

          allToolCalls.push({ name, input, result });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: id,
            content: JSON.stringify(result)
          });
        }

        // Add assistant message with tool use
        currentMessages.push({
          role: 'assistant',
          content: response.content
        });

        // Add tool results
        currentMessages.push({
          role: 'user',
          content: toolResults
        });

      } else {
        // Unexpected stop reason
        console.warn('Unexpected stop reason:', response.stop_reason);
        const textContent = response.content.find(c => c.type === 'text');
        return {
          response: textContent?.text || 'I encountered an issue. Could you try again?',
          toolCalls: allToolCalls,
          actions: allActions,
          iterations
        };
      }
    }

    // Max iterations reached
    console.warn('Max iterations reached');
    return {
      response: "I've been thinking about this for a while. Let me give you what I have so far.",
      toolCalls: allToolCalls,
      actions: allActions,
      iterations
    };
  }

  /**
   * Build messages array from conversation history
   */
  buildMessages(history, newMessage) {
    const messages = [];

    // Add recent history (last 10 messages)
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add new user message
    messages.push({
      role: 'user',
      content: newMessage
    });

    return messages;
  }

  /**
   * Generate a proactive suggestion based on a trigger
   */
  async generateProactiveSuggestion(trigger, triggerData, sessionId, routeData) {
    try {
      // Build context
      const context = await this.contextBuilder.buildContext(sessionId, routeData);

      // Get proactive prompt for this trigger
      const proactivePrompt = getProactivePrompt(trigger, triggerData);

      // Build full system prompt
      const systemPrompt = buildSystemPrompt(context) +
        '\n\n---\n\nYou are generating a PROACTIVE suggestion. ' +
        'This is NOT in response to a user message. ' +
        'Keep it brief (1-3 sentences) and non-intrusive.';

      // Generate suggestion
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 256,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: proactivePrompt
        }]
      });

      const textContent = response.content.find(c => c.type === 'text');

      return {
        shouldShow: true,
        message: textContent?.text || null,
        trigger,
        triggerData
      };

    } catch (error) {
      console.error('Failed to generate proactive suggestion:', error);
      return {
        shouldShow: false,
        error: error.message
      };
    }
  }

  /**
   * Generate initial greeting for a new session
   */
  async generateGreeting(sessionId, routeData) {
    try {
      const context = await this.contextBuilder.buildContext(sessionId, routeData);

      const trip = context.trip;
      const hasStops = context.route?.selectedCities?.length > 0;

      let prompt;
      if (!hasStops) {
        prompt = `Greet the user warmly as Voyager. They're planning a road trip from ${trip?.origin || 'their starting point'} to ${trip?.destination || 'their destination'}.
Keep it brief (2-3 sentences max). Ask what kind of experience they're hoping for - relaxed, cultural, foodie adventures, etc.
Be warm but not over-the-top.`;
      } else {
        prompt = `Welcome back the user briefly. They have ${context.route.selectedCities.length} stops planned already.
Mention you can help refine their route. Keep it to 1-2 sentences.`;
      }

      const systemPrompt = buildSystemPrompt(context);

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 200,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const textContent = response.content.find(c => c.type === 'text');

      return {
        message: textContent?.text || "Hello! I'm Voyager. Ready to help plan your journey?",
        type: 'greeting'
      };

    } catch (error) {
      console.error('Failed to generate greeting:', error);
      return {
        message: "Hello! I'm Voyager, your travel companion. Tell me about the kind of trip you're dreaming of.",
        type: 'greeting',
        fallback: true
      };
    }
  }

  /**
   * Emit an event through callback or EventEmitter
   */
  emitEvent(callback, eventType, data) {
    if (callback) {
      callback(eventType, data);
    }
    this.emit(eventType, data);
  }

  /**
   * Get conversation history for a session
   */
  async getConversationHistory(sessionId, limit = 20) {
    const context = await this.contextBuilder.buildConversationContext(sessionId);
    return context.messages.slice(-limit);
  }
}

module.exports = VoyagerAgent;
