/**
 * GoalTracker - Multi-Step Goal Tracking System
 *
 * Phase 4: Goal Tracking & Progress
 *
 * Tracks complex multi-step goals across sessions with:
 * - Automatic goal decomposition into subtasks
 * - Progress tracking and percentage completion
 * - Dependency management between subtasks
 * - Persistence across sessions
 * - Proactive next action suggestions
 *
 * Goal States: in_progress, completed, abandoned, paused
 * Subtask States: todo, in_progress, done, skipped
 */

const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');

// Use built-in crypto.randomUUID() instead of uuid package (ESM-only)
const uuidv4 = () => crypto.randomUUID();

// Goal status constants
const GOAL_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  PAUSED: 'paused'
};

// Subtask status constants
const SUBTASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  SKIPPED: 'skipped'
};

// Goal complexity levels
const COMPLEXITY = {
  SIMPLE: 'simple',      // 1-2 subtasks
  MEDIUM: 'medium',      // 3-5 subtasks
  COMPLEX: 'complex'     // 6+ subtasks
};

class GoalTracker {
  constructor(db) {
    this.db = db;
    this.model = 'claude-haiku-4-5-20251001';

    // Initialize Claude client
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.claudeClient = new Anthropic({ apiKey: anthropicKey });
    } else {
      console.warn('⚠️  ANTHROPIC_API_KEY not configured - goal decomposition disabled');
      this.claudeClient = null;
    }
  }

  // Expose constants
  static get GOAL_STATUS() { return GOAL_STATUS; }
  static get SUBTASK_STATUS() { return SUBTASK_STATUS; }
  static get COMPLEXITY() { return COMPLEXITY; }

  /**
   * Detect if a user message represents a complex goal that should be tracked
   * @param {string} message - User message
   * @param {object} context - Current context
   * @returns {Promise<{isGoal: boolean, goalDescription: string, reasoning: string}>}
   */
  async detectGoal(message, context = {}) {
    if (!this.claudeClient) {
      return { isGoal: false, goalDescription: null, reasoning: 'Claude not configured' };
    }

    console.log('🎯 [GOAL] Detecting if message represents a trackable goal...');

    const prompt = `Analyze this user message to determine if it represents a complex, multi-step travel goal that should be tracked.

USER MESSAGE: "${message}"

CONTEXT:
- Page: ${context.pageContext?.name || 'unknown'}
- Has Route: ${!!context.routeId}
- Has Itinerary: ${!!context.itineraryData}

CRITERIA for a trackable goal:
1. Requires multiple distinct actions/steps to complete
2. Would benefit from progress tracking
3. Is specific enough to define success criteria
4. Is travel-related (planning, booking, organizing)

EXAMPLES of trackable goals:
- "Help me plan a romantic anniversary trip to Italy"
- "Find and book accommodations for my 5-city Europe trip"
- "Build a family-friendly itinerary with activities for kids"
- "Plan a food tour through Thailand's best restaurants"

NOT trackable goals (simple requests):
- "What's the weather in Paris?"
- "Find museums in Amsterdam"
- "How do I get from Barcelona to Madrid?"
- Simple questions or single-step requests

Return JSON only:
{
  "isGoal": boolean,
  "goalDescription": "Clear, concise goal statement" or null,
  "reasoning": "Why this is/isn't a trackable goal"
}`;

    try {
      const response = await this.claudeClient.messages.create({
        model: this.model,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = response.content[0].text.trim();
      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : { isGoal: false, goalDescription: null, reasoning: 'Parse error' };
      }

      console.log(`   ${result.isGoal ? '✅ Goal detected' : '❌ Not a goal'}: ${result.reasoning}`);
      return result;

    } catch (error) {
      console.error('   ❌ Goal detection error:', error.message);
      return { isGoal: false, goalDescription: null, reasoning: 'Detection failed' };
    }
  }

  /**
   * Decompose a goal into actionable subtasks
   * @param {string} goalDescription - The goal to decompose
   * @param {object} context - Current context
   * @returns {Promise<{subtasks: Array, successCriteria: string, complexity: string}>}
   */
  async decomposeGoal(goalDescription, context = {}) {
    if (!this.claudeClient) {
      return { subtasks: [], successCriteria: '', complexity: 'simple' };
    }

    console.log('📋 [GOAL] Decomposing goal into subtasks...');

    const prompt = `Decompose this travel goal into actionable subtasks.

GOAL: "${goalDescription}"

CONTEXT:
- Page: ${context.pageContext?.name || 'unknown'}
- Has Route: ${!!context.routeId}
- Route Cities: ${context.itineraryData?.cities?.join(', ') || 'none'}
- Has Itinerary: ${!!context.itineraryData}

Create 2-7 subtasks that:
1. Are specific and actionable
2. Have clear completion criteria
3. Build logically on each other
4. Cover all aspects of the goal

Return JSON only:
{
  "subtasks": [
    {
      "id": 1,
      "description": "Clear description of what to do",
      "status": "todo",
      "dependencies": [],
      "tools_needed": ["tool1", "tool2"],
      "success_indicator": "How to know this is done"
    }
  ],
  "successCriteria": "How to know the entire goal is achieved",
  "complexity": "simple|medium|complex"
}`;

    try {
      const response = await this.claudeClient.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = response.content[0].text.trim();
      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : { subtasks: [], successCriteria: '', complexity: 'simple' };
      }

      console.log(`   ✅ Decomposed into ${result.subtasks?.length || 0} subtasks (${result.complexity})`);
      return result;

    } catch (error) {
      console.error('   ❌ Goal decomposition error:', error.message);
      return { subtasks: [], successCriteria: '', complexity: 'simple' };
    }
  }

  /**
   * Create a new goal for tracking
   * @param {string} userId - User ID
   * @param {string} goalDescription - Goal description
   * @param {object} context - Current context
   * @returns {Promise<object>} Created goal
   */
  async createGoal(userId, goalDescription, context = {}) {
    console.log(`🎯 [GOAL] Creating goal for user ${userId.slice(0, 8)}...`);

    // Decompose the goal into subtasks
    const decomposition = await this.decomposeGoal(goalDescription, context);

    const goalId = uuidv4();
    const goal = {
      id: goalId,
      user_id: userId,
      description: goalDescription,
      status: GOAL_STATUS.IN_PROGRESS,
      progress: 0,
      subtasks: decomposition.subtasks || [],
      success_criteria: decomposition.successCriteria || '',
      complexity: decomposition.complexity || 'simple',
      context: {
        routeId: context.routeId || null,
        pageContext: context.pageContext?.name || null,
        createdFrom: context.pageContext?.path || null
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      await this.db.query(`
        INSERT INTO user_goals (id, user_id, description, status, progress, subtasks, success_criteria, complexity, context, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        goal.id,
        goal.user_id,
        goal.description,
        goal.status,
        goal.progress,
        JSON.stringify(goal.subtasks),
        goal.success_criteria,
        goal.complexity,
        JSON.stringify(goal.context),
        goal.created_at,
        goal.updated_at
      ]);

      console.log(`   ✅ Goal created: ${goalId.slice(0, 8)}... with ${goal.subtasks.length} subtasks`);
      return goal;

    } catch (error) {
      console.error('   ❌ Error creating goal:', error.message);
      throw error;
    }
  }

  /**
   * Get active goals for a user
   * @param {string} userId - User ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} Active goals
   */
  async getGoals(userId, status = GOAL_STATUS.IN_PROGRESS) {
    try {
      const result = await this.db.query(`
        SELECT * FROM user_goals
        WHERE user_id = $1 AND status = $2
        ORDER BY created_at DESC
        LIMIT 10
      `, [userId, status]);

      return result.rows.map(row => ({
        ...row,
        subtasks: typeof row.subtasks === 'string' ? JSON.parse(row.subtasks) : row.subtasks,
        context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context
      }));

    } catch (error) {
      console.error('❌ Error getting goals:', error.message);
      return [];
    }
  }

  /**
   * Get a specific goal by ID
   * @param {string} goalId - Goal ID
   * @returns {Promise<object|null>} Goal or null
   */
  async getGoal(goalId) {
    try {
      const result = await this.db.query(`
        SELECT * FROM user_goals WHERE id = $1
      `, [goalId]);

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        ...row,
        subtasks: typeof row.subtasks === 'string' ? JSON.parse(row.subtasks) : row.subtasks,
        context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context
      };

    } catch (error) {
      console.error('❌ Error getting goal:', error.message);
      return null;
    }
  }

  /**
   * Update progress on a goal
   * @param {string} goalId - Goal ID
   * @param {number} subtaskId - Subtask ID to update
   * @param {string} status - New status (done, in_progress, skipped)
   * @param {string} result - Optional result/notes
   * @returns {Promise<object>} Updated goal
   */
  async updateProgress(goalId, subtaskId, status, result = null) {
    console.log(`📊 [GOAL] Updating progress: goal=${goalId.slice(0, 8)}, subtask=${subtaskId}, status=${status}`);

    const goal = await this.getGoal(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Update subtask status
    const subtasks = goal.subtasks.map(st =>
      st.id === subtaskId
        ? { ...st, status, result: result || st.result, completedAt: status === 'done' ? new Date() : null }
        : st
    );

    // Calculate progress percentage
    const completed = subtasks.filter(st => st.status === SUBTASK_STATUS.DONE).length;
    const skipped = subtasks.filter(st => st.status === SUBTASK_STATUS.SKIPPED).length;
    const total = subtasks.length;
    const progress = Math.round(((completed + skipped) / total) * 100);

    // Determine goal status
    const allDone = subtasks.every(st => st.status === SUBTASK_STATUS.DONE || st.status === SUBTASK_STATUS.SKIPPED);
    const goalStatus = allDone ? GOAL_STATUS.COMPLETED : GOAL_STATUS.IN_PROGRESS;

    try {
      await this.db.query(`
        UPDATE user_goals
        SET subtasks = $1, progress = $2, status = $3, updated_at = $4, completed_at = $5
        WHERE id = $6
      `, [
        JSON.stringify(subtasks),
        progress,
        goalStatus,
        new Date(),
        goalStatus === GOAL_STATUS.COMPLETED ? new Date() : null,
        goalId
      ]);

      console.log(`   ✅ Progress updated: ${progress}% (${completed}/${total} done)`);

      return {
        ...goal,
        subtasks,
        progress,
        status: goalStatus
      };

    } catch (error) {
      console.error('   ❌ Error updating progress:', error.message);
      throw error;
    }
  }

  /**
   * Get the next actionable subtask for a goal
   * @param {string} goalId - Goal ID
   * @returns {Promise<object|null>} Next subtask or null if complete
   */
  async getNextAction(goalId) {
    const goal = await this.getGoal(goalId);
    if (!goal) return null;

    // Find completed subtask IDs
    const completedIds = goal.subtasks
      .filter(st => st.status === SUBTASK_STATUS.DONE || st.status === SUBTASK_STATUS.SKIPPED)
      .map(st => st.id);

    // Find first todo subtask with all dependencies met
    const nextSubtask = goal.subtasks.find(st =>
      st.status === SUBTASK_STATUS.TODO &&
      (st.dependencies || []).every(dep => completedIds.includes(dep))
    );

    return nextSubtask || null;
  }

  /**
   * Mark current in-progress subtask as done and start next
   * @param {string} goalId - Goal ID
   * @param {string} result - Result/notes for completed subtask
   * @returns {Promise<{completed: object, next: object|null, goal: object}>}
   */
  async completeCurrentAndAdvance(goalId, result = null) {
    const goal = await this.getGoal(goalId);
    if (!goal) throw new Error('Goal not found');

    // Find in-progress subtask
    const inProgress = goal.subtasks.find(st => st.status === SUBTASK_STATUS.IN_PROGRESS);

    if (inProgress) {
      // Mark as done
      await this.updateProgress(goalId, inProgress.id, SUBTASK_STATUS.DONE, result);
    }

    // Get next action
    const next = await this.getNextAction(goalId);

    if (next) {
      // Mark next as in_progress
      await this.updateProgress(goalId, next.id, SUBTASK_STATUS.IN_PROGRESS);
    }

    // Get updated goal
    const updatedGoal = await this.getGoal(goalId);

    return {
      completed: inProgress || null,
      next: next,
      goal: updatedGoal
    };
  }

  /**
   * Abandon a goal (user decided not to continue)
   * @param {string} goalId - Goal ID
   * @param {string} reason - Optional reason for abandonment
   * @returns {Promise<object>} Updated goal
   */
  async abandonGoal(goalId, reason = null) {
    console.log(`🚫 [GOAL] Abandoning goal: ${goalId.slice(0, 8)}...`);

    try {
      await this.db.query(`
        UPDATE user_goals
        SET status = $1, updated_at = $2, abandoned_reason = $3
        WHERE id = $4
      `, [GOAL_STATUS.ABANDONED, new Date(), reason, goalId]);

      return await this.getGoal(goalId);

    } catch (error) {
      console.error('   ❌ Error abandoning goal:', error.message);
      throw error;
    }
  }

  /**
   * Generate a proactive suggestion based on goal progress
   * @param {string} userId - User ID
   * @returns {Promise<{hasActiveGoal: boolean, suggestion: string, goal: object|null, nextAction: object|null}>}
   */
  async getProactiveSuggestion(userId) {
    const goals = await this.getGoals(userId, GOAL_STATUS.IN_PROGRESS);

    if (goals.length === 0) {
      return { hasActiveGoal: false, suggestion: null, goal: null, nextAction: null };
    }

    // Get most recent active goal
    const goal = goals[0];
    const nextAction = await this.getNextAction(goal.id);

    if (!nextAction) {
      return {
        hasActiveGoal: true,
        suggestion: `Your goal "${goal.description}" is ${goal.progress}% complete!`,
        goal,
        nextAction: null
      };
    }

    return {
      hasActiveGoal: true,
      suggestion: `Continue your goal "${goal.description}" (${goal.progress}% done). Next: ${nextAction.description}`,
      goal,
      nextAction
    };
  }

  /**
   * Build goal context for system prompt injection
   * @param {string} userId - User ID
   * @returns {Promise<string>} Goal context string
   */
  async buildGoalContext(userId) {
    const goals = await this.getGoals(userId, GOAL_STATUS.IN_PROGRESS);

    if (goals.length === 0) {
      return '';
    }

    const goal = goals[0]; // Focus on most recent
    const nextAction = await this.getNextAction(goal.id);

    let context = `
**🎯 ACTIVE GOAL TRACKING**

Goal: "${goal.description}"
Progress: ${goal.progress}% complete (${goal.subtasks.filter(s => s.status === 'done').length}/${goal.subtasks.length} tasks)
Complexity: ${goal.complexity}

Subtasks:
${goal.subtasks.map(st => {
  const icon = st.status === 'done' ? '✅' : st.status === 'in_progress' ? '🔄' : '⬚';
  return `${icon} [${st.status.toUpperCase()}] ${st.description}`;
}).join('\n')}
`;

    if (nextAction) {
      context += `
**Next Recommended Action:** ${nextAction.description}
Tools to use: ${nextAction.tools_needed?.join(', ') || 'general assistance'}

IMPORTANT: When this subtask is completed, acknowledge progress and suggest the next step.
`;
    }

    return context;
  }
}

module.exports = GoalTracker;
module.exports.GOAL_STATUS = GOAL_STATUS;
module.exports.SUBTASK_STATUS = SUBTASK_STATUS;
module.exports.COMPLEXITY = COMPLEXITY;
