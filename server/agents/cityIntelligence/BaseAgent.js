/**
 * BaseAgent - Abstract Base Class for City Intelligence Worker Agents
 *
 * All specialized agents (StoryAgent, TimeAgent, ClusterAgent, etc.) extend this class.
 * Provides common functionality for:
 * - Execution wrapper with timing and error handling
 * - Claude API integration
 * - Progress reporting
 * - Refinement support
 */

const Anthropic = require('@anthropic-ai/sdk');

/**
 * @typedef {Object} AgentInput
 * @property {Object} city - City data
 * @property {number} nights - Number of nights in this city
 * @property {Object} preferences - User preferences
 * @property {Object} previousAgentOutputs - Outputs from other agents
 * @property {string} [refinementInstructions] - Instructions for refinement
 */

/**
 * @typedef {Object} AgentOutput
 * @property {boolean} success - Whether execution succeeded
 * @property {Object} data - The agent's output data
 * @property {number} confidence - Confidence score 0-100
 * @property {string[]} [gaps] - Identified gaps in the output
 * @property {string[]} [suggestions] - Suggestions for other agents
 * @property {number} [executionTimeMs] - Execution time in milliseconds
 */

class BaseAgent {
  /**
   * @param {Object} config - Agent configuration
   * @param {string} config.name - Agent name
   * @param {string} config.description - Agent description
   * @param {string[]} config.requiredInputs - Required input fields
   * @param {string[]} config.optionalInputs - Optional input fields
   * @param {string[]} config.outputs - Output fields
   * @param {string[]} config.dependsOn - Agent dependencies
   * @param {boolean} config.canRefine - Whether agent supports refinement
   */
  constructor(config) {
    this.name = config.name;
    this.description = config.description;
    this.requiredInputs = config.requiredInputs || [];
    this.optionalInputs = config.optionalInputs || [];
    this.outputs = config.outputs || [];
    this.dependsOn = config.dependsOn || [];
    this.canRefine = config.canRefine ?? false;

    // Claude client - lazy initialized
    this._client = null;

    // Default model for agents (can be overridden)
    this.model = 'claude-haiku-4-5-20251001';

    // Progress callback (set by orchestrator)
    this.onProgress = null;
  }

  /**
   * Get Anthropic client (lazy initialization)
   */
  get client() {
    if (!this._client) {
      this._client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
    return this._client;
  }

  /**
   * Validate that all required inputs are present
   * @param {AgentInput} input
   * @returns {{ valid: boolean, missing: string[] }}
   */
  validateInputs(input) {
    const missing = [];

    for (const required of this.requiredInputs) {
      if (required === 'city' && !input.city) {
        missing.push('city');
      } else if (required === 'nights' && input.nights === undefined) {
        missing.push('nights');
      } else if (required === 'preferences' && !input.preferences) {
        missing.push('preferences');
      } else if (required.startsWith('prev:')) {
        // Check for previous agent output
        const agentName = required.replace('prev:', '');
        if (!input.previousAgentOutputs?.[agentName]) {
          missing.push(required);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Execute the agent with timing and error handling
   * This is the main entry point called by the orchestrator
   *
   * @param {AgentInput} input
   * @param {Object} context - Execution context (sessionId, etc.)
   * @returns {Promise<AgentOutput>}
   */
  async execute(input, context) {
    const startTime = Date.now();

    console.log(`\n🤖 [${this.name}] Starting execution for ${input.city.name}...`);

    try {
      // Validate inputs
      const validation = this.validateInputs(input);
      if (!validation.valid) {
        throw new Error(`Missing required inputs: ${validation.missing.join(', ')}`);
      }

      // Report start
      this.reportProgress(0, 'Starting...');

      // Run the agent-specific logic (implemented by subclasses)
      const result = await this.run(input, context);

      // Report completion
      this.reportProgress(100, 'Complete');

      const executionTimeMs = Date.now() - startTime;
      console.log(`✅ [${this.name}] Completed in ${executionTimeMs}ms (confidence: ${result.confidence}%)`);

      return {
        success: true,
        data: result.data,
        confidence: result.confidence,
        gaps: result.gaps || [],
        suggestions: result.suggestions || [],
        executionTimeMs
      };

    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      console.error(`❌ [${this.name}] Failed after ${executionTimeMs}ms:`, error.message);

      return {
        success: false,
        data: null,
        confidence: 0,
        gaps: [error.message],
        suggestions: [],
        executionTimeMs,
        error: error.message
      };
    }
  }

  /**
   * Main agent logic - MUST be implemented by subclasses
   *
   * @param {AgentInput} input
   * @param {Object} context
   * @returns {Promise<{ data: Object, confidence: number, gaps?: string[], suggestions?: string[] }>}
   */
  async run(input, context) {
    throw new Error(`${this.name}.run() must be implemented`);
  }

  /**
   * Refine the output based on feedback
   * Optional - only implement if canRefine is true
   *
   * @param {string} feedback - Feedback from orchestrator
   * @param {AgentOutput} previousOutput - Previous output to improve
   * @param {AgentInput} input - Original input
   * @param {Object} context - Execution context
   * @returns {Promise<AgentOutput>}
   */
  async refine(feedback, previousOutput, input, context) {
    if (!this.canRefine) {
      throw new Error(`${this.name} does not support refinement`);
    }

    console.log(`\n🔄 [${this.name}] Refining based on feedback: "${feedback.slice(0, 50)}..."`);

    // Default implementation - re-run with refinement instructions
    const refinedInput = {
      ...input,
      refinementInstructions: feedback
    };

    return this.execute(refinedInput, context);
  }

  /**
   * Report progress to orchestrator
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} [message] - Optional status message
   */
  reportProgress(progress, message = null) {
    if (this.onProgress) {
      this.onProgress({
        agentName: this.name,
        progress: Math.min(100, Math.max(0, progress)),
        message
      });
    }
  }

  /**
   * Call Claude API with a prompt
   * Common utility for agents that need LLM capabilities
   *
   * @param {string} systemPrompt - System prompt
   * @param {string} userPrompt - User prompt
   * @param {Object} [options] - Additional options
   * @param {number} [options.maxTokens] - Max tokens (default 1024)
   * @param {number} [options.temperature] - Temperature (default 0.7)
   * @returns {Promise<string>} - Response text
   */
  async callClaude(systemPrompt, userPrompt, options = {}) {
    const maxTokens = options.maxTokens || 1024;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    return response.content[0].text;
  }

  /**
   * Call Claude API and parse JSON response
   *
   * @param {string} systemPrompt - System prompt
   * @param {string} userPrompt - User prompt
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} - Parsed JSON response
   */
  async callClaudeJSON(systemPrompt, userPrompt, options = {}) {
    const text = await this.callClaude(systemPrompt, userPrompt, options);

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Get agent definition (for registration/introspection)
   */
  getDefinition() {
    return {
      name: this.name,
      description: this.description,
      requiredInputs: this.requiredInputs,
      optionalInputs: this.optionalInputs,
      outputs: this.outputs,
      dependsOn: this.dependsOn,
      canRefine: this.canRefine
    };
  }
}

module.exports = BaseAgent;
