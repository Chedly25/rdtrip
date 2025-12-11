/**
 * MemoryService - AI Agent Long-Term Memory System
 *
 * Phase 2: Long-Term Memory Architecture
 *
 * Provides semantic memory using pgvector for:
 * - Conversation history storage with embeddings
 * - AI-powered preference extraction from conversations
 * - Memory type classification (preference, experience, fact, feedback)
 * - Personality profile building
 * - Contextual memory retrieval with importance scoring
 *
 * Uses Cohere's free embedding API (100 req/min, 1024 dimensions)
 */

const { CohereClient } = require('cohere-ai');
const Anthropic = require('@anthropic-ai/sdk');

// Memory types for classification
const MEMORY_TYPES = {
  PREFERENCE: 'preference',     // User preferences (dietary, pace, budget, etc.)
  EXPERIENCE: 'experience',     // Past trip experiences
  FACT: 'fact',                 // Facts about user (hometown, travel history)
  FEEDBACK: 'feedback',         // User feedback on recommendations
  CONVERSATION: 'conversation'  // General conversation summaries
};

// Preference categories for structured storage
const PREFERENCE_CATEGORIES = {
  DIETARY: 'dietary',           // Vegetarian, allergies, etc.
  ACCOMMODATION: 'accommodation', // Hotel preferences
  PACE: 'pace',                 // Fast/slow traveler
  BUDGET: 'budget',             // Budget level
  ACTIVITIES: 'activities',     // Activity preferences
  TRANSPORT: 'transport',       // Travel mode preferences
  CUISINE: 'cuisine',           // Food preferences
  DESTINATIONS: 'destinations'  // Place type preferences
};

class MemoryService {
  constructor(db) {
    this.db = db;

    // Initialize Cohere for embeddings (FREE tier!)
    const cohereKey = process.env.COHERE_API_KEY;
    if (!cohereKey) {
      console.warn('⚠️  COHERE_API_KEY not configured - memory features will be limited');
      this.cohere = null;
    } else {
      this.cohere = new CohereClient({ token: cohereKey });
    }

    // Initialize Claude for preference extraction
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      this.claudeClient = new Anthropic({ apiKey: anthropicKey });
    } else {
      console.warn('⚠️  ANTHROPIC_API_KEY not configured - preference extraction disabled');
      this.claudeClient = null;
    }
  }

  // Expose constants for external use
  static get MEMORY_TYPES() { return MEMORY_TYPES; }
  static get PREFERENCE_CATEGORIES() { return PREFERENCE_CATEGORIES; }

  /**
   * Store conversation summary with semantic embedding
   * @param {string} userId - User ID
   * @param {string|null} messageId - Optional message ID reference
   * @param {string} summary - Conversation summary
   * @param {object} metadata - Additional metadata (routeId, timestamp, etc.)
   * @returns {Promise<string>} Memory ID
   */
  async storeConversation(userId, messageId, summary, metadata = {}) {
    if (!this.cohere) {
      console.warn('Cannot store conversation: Cohere API not configured');
      return null;
    }

    try {
      console.log(`💾 Storing conversation memory for user ${userId.slice(0, 8)}...`);

      // Generate embedding for semantic search using Cohere
      const embeddingResponse = await this.cohere.embed({
        model: 'embed-english-v3.0', // 1024 dimensions, FREE tier
        texts: [summary],
        inputType: 'search_document', // Optimized for storage
        embeddingTypes: ['float']
      });

      const embedding = embeddingResponse.embeddings.float[0];

      // Store in database with pgvector
      const result = await this.db.query(`
        INSERT INTO agent_memory (user_id, message_id, content, embedding, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [
        userId,
        messageId,
        summary,
        JSON.stringify(embedding), // pgvector accepts array format
        JSON.stringify(metadata)
      ]);

      console.log(`✅ Memory stored: ${result.rows[0].id}`);
      return result.rows[0].id;

    } catch (error) {
      console.error('Error storing conversation:', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant memories using semantic similarity search
   * @param {string} userId - User ID
   * @param {string} currentQuery - Current user query/context
   * @param {number} limit - Max memories to return (default: 5)
   * @param {number} similarityThreshold - Minimum similarity score 0-1 (default: 0.7)
   * @returns {Promise<Array>} Array of relevant memories
   */
  async getRelevantMemories(userId, currentQuery, limit = 5, similarityThreshold = 0.7) {
    if (!this.cohere) {
      console.warn('Cannot retrieve memories: Cohere API not configured');
      return [];
    }

    try {
      console.log(`🔍 Searching memories for: "${currentQuery.slice(0, 50)}..."`);

      // Generate embedding for query using Cohere
      const queryEmbedding = await this.cohere.embed({
        model: 'embed-english-v3.0', // 1024 dimensions
        texts: [currentQuery],
        inputType: 'search_query', // Optimized for retrieval
        embeddingTypes: ['float']
      });

      const embedding = queryEmbedding.embeddings.float[0];

      // Perform vector similarity search
      // Using cosine similarity (1 - cosine_distance)
      const result = await this.db.query(`
        SELECT
          id,
          content,
          metadata,
          created_at,
          1 - (embedding <=> $1::vector) as similarity
        FROM agent_memory
        WHERE user_id = $2
          AND 1 - (embedding <=> $1::vector) >= $3
        ORDER BY embedding <=> $1::vector
        LIMIT $4
      `, [
        JSON.stringify(embedding),
        userId,
        similarityThreshold,
        limit
      ]);

      console.log(`✅ Found ${result.rows.length} relevant memories`);

      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        createdAt: row.created_at,
        similarity: parseFloat(row.similarity).toFixed(3)
      }));

    } catch (error) {
      console.error('Error retrieving memories:', error);
      // Return empty array on error to not break agent flow
      return [];
    }
  }

  /**
   * Update or create user preferences
   * @param {string} userId - User ID
   * @param {string} category - Preference category (e.g., 'accommodation', 'cuisine', 'activities')
   * @param {object} preferenceData - Preference data
   * @returns {Promise<void>}
   */
  async updatePreference(userId, category, preferenceData) {
    try {
      console.log(`🎯 Updating preference: ${category} for user ${userId.slice(0, 8)}...`);

      // Get existing preferences
      const existing = await this.db.query(`
        SELECT preferences FROM agent_user_preferences WHERE user_id = $1
      `, [userId]);

      let preferences = {};
      if (existing.rows.length > 0) {
        preferences = existing.rows[0].preferences;
      }

      // Update specific category
      preferences[category] = {
        ...preferences[category],
        ...preferenceData,
        lastUpdated: new Date().toISOString()
      };

      // Upsert preferences
      await this.db.query(`
        INSERT INTO agent_user_preferences (user_id, preferences)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET
          preferences = $2,
          updated_at = NOW()
      `, [userId, JSON.stringify(preferences)]);

      console.log(`✅ Preference updated: ${category}`);

    } catch (error) {
      console.error('Error updating preference:', error);
      throw error;
    }
  }

  /**
   * Get all user preferences
   * @param {string} userId - User ID
   * @returns {Promise<object>} User preferences object
   */
  async getPreferences(userId) {
    try {
      const result = await this.db.query(`
        SELECT preferences FROM agent_user_preferences WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return {};
      }

      return result.rows[0].preferences;

    } catch (error) {
      console.error('Error getting preferences:', error);
      return {};
    }
  }

  /**
   * Get user's recent conversation history
   * @param {string} userId - User ID
   * @param {number} limit - Number of recent memories (default: 10)
   * @returns {Promise<Array>} Recent memories
   */
  async getRecentHistory(userId, limit = 10) {
    try {
      const result = await this.db.query(`
        SELECT id, content, metadata, created_at
        FROM agent_memory
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        createdAt: row.created_at
      }));

    } catch (error) {
      console.error('Error getting recent history:', error);
      return [];
    }
  }

  /**
   * Clear old memories (housekeeping)
   * @param {number} daysOld - Delete memories older than this many days
   * @returns {Promise<number>} Number of deleted memories
   */
  async cleanOldMemories(daysOld = 90) {
    try {
      const result = await this.db.query(`
        DELETE FROM agent_memory
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        RETURNING id
      `);

      console.log(`🧹 Cleaned ${result.rows.length} old memories (>${daysOld} days)`);
      return result.rows.length;

    } catch (error) {
      console.error('Error cleaning old memories:', error);
      return 0;
    }
  }

  /**
   * Store proactive suggestion for user
   * @param {string} userId - User ID
   * @param {string|null} routeId - Route ID (optional)
   * @param {string} suggestionType - Type of suggestion
   * @param {string} content - Suggestion content
   * @param {object} metadata - Additional metadata
   * @param {Date|null} expiresAt - Expiration time
   * @returns {Promise<string>} Suggestion ID
   */
  async storeSuggestion(userId, routeId, suggestionType, content, metadata = {}, expiresAt = null) {
    try {
      const result = await this.db.query(`
        INSERT INTO agent_suggestions (user_id, route_id, suggestion_type, content, metadata, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [userId, routeId, suggestionType, content, JSON.stringify(metadata), expiresAt]);

      console.log(`💡 Stored suggestion: ${suggestionType}`);
      return result.rows[0].id;

    } catch (error) {
      console.error('Error storing suggestion:', error);
      throw error;
    }
  }

  /**
   * Get pending suggestions for user
   * @param {string} userId - User ID
   * @param {string|null} routeId - Optional route filter
   * @returns {Promise<Array>} Pending suggestions
   */
  async getPendingSuggestions(userId, routeId = null) {
    try {
      let query = `
        SELECT id, suggestion_type, content, metadata, created_at, expires_at
        FROM agent_suggestions
        WHERE user_id = $1
          AND dismissed = FALSE
          AND (expires_at IS NULL OR expires_at > NOW())
      `;

      const params = [userId];

      if (routeId) {
        query += ` AND route_id = $2`;
        params.push(routeId);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await this.db.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        type: row.suggestion_type,
        content: row.content,
        metadata: row.metadata,
        createdAt: row.created_at,
        expiresAt: row.expires_at
      }));

    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Dismiss a suggestion
   * @param {string} suggestionId - Suggestion ID
   * @returns {Promise<boolean>} Success
   */
  async dismissSuggestion(suggestionId) {
    try {
      await this.db.query(`
        UPDATE agent_suggestions
        SET dismissed = TRUE
        WHERE id = $1
      `, [suggestionId]);

      return true;

    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      return false;
    }
  }

  // ============================================================================
  // PHASE 2: Long-Term Memory Methods
  // ============================================================================

  /**
   * Store a typed memory with importance scoring
   * @param {string} userId - User ID
   * @param {string} memoryType - Type from MEMORY_TYPES
   * @param {string} content - Memory content
   * @param {object} metadata - Additional metadata
   * @returns {Promise<string>} Memory ID
   */
  async remember(userId, memoryType, content, metadata = {}) {
    if (!this.cohere) {
      console.warn('Cannot store memory: Cohere API not configured');
      return null;
    }

    try {
      console.log(`🧠 Remembering [${memoryType}] for user ${userId.slice(0, 8)}...`);

      // Calculate importance based on memory type and content
      const importance = this.calculateImportance(content, memoryType);

      // Generate embedding for semantic search
      const embeddingResponse = await this.cohere.embed({
        model: 'embed-english-v3.0',
        texts: [content],
        inputType: 'search_document',
        embeddingTypes: ['float']
      });

      const embedding = embeddingResponse.embeddings.float[0];

      // Store with memory type and importance in metadata
      const enrichedMetadata = {
        ...metadata,
        memoryType,
        importance,
        storedAt: new Date().toISOString()
      };

      const result = await this.db.query(`
        INSERT INTO agent_memory (user_id, content, embedding, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        userId,
        content,
        JSON.stringify(embedding),
        JSON.stringify(enrichedMetadata)
      ]);

      console.log(`✅ Memory stored [${memoryType}]: ${result.rows[0].id} (importance: ${importance.toFixed(2)})`);
      return result.rows[0].id;

    } catch (error) {
      console.error('Error storing memory:', error);
      return null;
    }
  }

  /**
   * Calculate importance score for a memory (0.0 - 1.0)
   * @param {string} content - Memory content
   * @param {string} memoryType - Memory type
   * @returns {number} Importance score
   */
  calculateImportance(content, memoryType) {
    let importance = 0.5; // Base importance

    // Type-based importance
    const typeWeights = {
      [MEMORY_TYPES.PREFERENCE]: 0.8,    // Preferences are highly important
      [MEMORY_TYPES.FEEDBACK]: 0.75,     // Feedback helps improve
      [MEMORY_TYPES.EXPERIENCE]: 0.7,    // Past experiences matter
      [MEMORY_TYPES.FACT]: 0.6,          // Facts are useful
      [MEMORY_TYPES.CONVERSATION]: 0.4   // General convos less important
    };

    importance = typeWeights[memoryType] || 0.5;

    // Content-based adjustments
    const contentLower = content.toLowerCase();

    // Boost for strong signals
    const strongSignals = [
      'always', 'never', 'hate', 'love', 'allergic', 'must have',
      'important', 'prefer', 'favorite', 'can\'t stand', 'need'
    ];
    if (strongSignals.some(s => contentLower.includes(s))) {
      importance = Math.min(1.0, importance + 0.15);
    }

    // Boost for specific categories
    const specificCategories = [
      'vegetarian', 'vegan', 'halal', 'kosher', 'gluten',
      'wheelchair', 'accessibility', 'budget', 'luxury'
    ];
    if (specificCategories.some(c => contentLower.includes(c))) {
      importance = Math.min(1.0, importance + 0.1);
    }

    return importance;
  }

  /**
   * Recall relevant memories using semantic search with type filtering
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<Array>} Relevant memories
   */
  async recall(userId, query, options = {}) {
    const {
      limit = 5,
      similarityThreshold = 0.6,
      memoryTypes = null,  // Array of types to filter, or null for all
      minImportance = 0.3  // Minimum importance threshold
    } = options;

    if (!this.cohere) {
      console.warn('Cannot recall memories: Cohere API not configured');
      return [];
    }

    try {
      console.log(`🔍 Recalling memories for: "${query.slice(0, 50)}..."`);

      // Generate query embedding
      const queryEmbedding = await this.cohere.embed({
        model: 'embed-english-v3.0',
        texts: [query],
        inputType: 'search_query',
        embeddingTypes: ['float']
      });

      const embedding = queryEmbedding.embeddings.float[0];

      // Build query with optional type filter
      let sqlQuery = `
        SELECT
          id,
          content,
          metadata,
          created_at,
          1 - (embedding <=> $1::vector) as similarity
        FROM agent_memory
        WHERE user_id = $2
          AND 1 - (embedding <=> $1::vector) >= $3
      `;

      const params = [JSON.stringify(embedding), userId, similarityThreshold];

      // Add memory type filter if specified
      if (memoryTypes && memoryTypes.length > 0) {
        sqlQuery += ` AND metadata->>'memoryType' = ANY($${params.length + 1})`;
        params.push(memoryTypes);
      }

      sqlQuery += `
        ORDER BY
          (1 - (embedding <=> $1::vector)) * COALESCE((metadata->>'importance')::float, 0.5) DESC
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const result = await this.db.query(sqlQuery, params);

      // Filter by importance
      const memories = result.rows
        .filter(row => {
          const importance = row.metadata?.importance || 0.5;
          return importance >= minImportance;
        })
        .map(row => ({
          id: row.id,
          content: row.content,
          memoryType: row.metadata?.memoryType || MEMORY_TYPES.CONVERSATION,
          importance: row.metadata?.importance || 0.5,
          metadata: row.metadata,
          createdAt: row.created_at,
          similarity: parseFloat(row.similarity).toFixed(3)
        }));

      console.log(`✅ Recalled ${memories.length} relevant memories`);
      return memories;

    } catch (error) {
      console.error('Error recalling memories:', error);
      return [];
    }
  }

  /**
   * Extract preferences from a conversation using Claude AI
   * @param {string} userId - User ID
   * @param {Array} conversation - Conversation messages [{role, content}]
   * @returns {Promise<Array>} Extracted preferences
   */
  async extractPreferences(userId, conversation) {
    if (!this.claudeClient) {
      console.warn('Cannot extract preferences: Claude API not configured');
      return [];
    }

    try {
      console.log(`🎯 Extracting preferences from conversation for user ${userId.slice(0, 8)}...`);

      // Format conversation for analysis
      const conversationText = conversation
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const extractionPrompt = `Analyze this travel planning conversation and extract any user preferences expressed.

CONVERSATION:
${conversationText}

Extract preferences in these categories:
- dietary: Food restrictions, allergies, dietary preferences
- accommodation: Hotel preferences (budget, style, amenities)
- pace: Travel pace (relaxed, moderate, packed itinerary)
- budget: Budget level (budget, mid-range, luxury)
- activities: Activity preferences (outdoor, cultural, adventure, relaxation)
- transport: Travel mode preferences (car, train, walking)
- cuisine: Food type preferences (local food, specific cuisines)
- destinations: Place preferences (nature, cities, beaches, mountains)

Only extract preferences that are EXPLICITLY stated or STRONGLY implied.
Assign a confidence score (0.0-1.0) based on how clearly the preference was expressed.

Return a JSON array:
[
  {
    "category": "dietary",
    "preference": "vegetarian",
    "detail": "Prefers vegetarian options",
    "confidence": 0.9
  }
]

Return [] if no clear preferences found.
Return ONLY valid JSON, no other text.`;

      const response = await this.claudeClient.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: extractionPrompt }]
      });

      const responseText = response.content[0].text.trim();

      // Parse JSON response
      let preferences = [];
      try {
        preferences = JSON.parse(responseText);
      } catch (parseError) {
        // Try to extract JSON from response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          preferences = JSON.parse(jsonMatch[0]);
        }
      }

      if (!Array.isArray(preferences)) {
        console.warn('Invalid preferences format, expected array');
        return [];
      }

      console.log(`✅ Extracted ${preferences.length} preferences`);

      // Store high-confidence preferences
      const storedPrefs = [];
      for (const pref of preferences) {
        if (pref.confidence >= 0.7) {
          // Store as memory
          await this.remember(
            userId,
            MEMORY_TYPES.PREFERENCE,
            `User preference (${pref.category}): ${pref.preference}. ${pref.detail}`,
            {
              category: pref.category,
              preference: pref.preference,
              confidence: pref.confidence
            }
          );

          // Also update structured preferences
          await this.updatePreference(userId, pref.category, {
            value: pref.preference,
            detail: pref.detail,
            confidence: pref.confidence
          });

          storedPrefs.push(pref);
        }
      }

      return storedPrefs;

    } catch (error) {
      console.error('Error extracting preferences:', error);
      return [];
    }
  }

  /**
   * Build a personality profile from stored memories and preferences
   * @param {string} userId - User ID
   * @returns {Promise<object>} Personality profile
   */
  async getPersonalityProfile(userId) {
    try {
      console.log(`👤 Building personality profile for user ${userId.slice(0, 8)}...`);

      // Get structured preferences
      const preferences = await this.getPreferences(userId);

      // Get preference memories
      const prefMemories = await this.recall(userId, 'user preferences travel style', {
        limit: 20,
        memoryTypes: [MEMORY_TYPES.PREFERENCE],
        similarityThreshold: 0.4,
        minImportance: 0.5
      });

      // Get experience memories
      const expMemories = await this.recall(userId, 'past trips travel experiences', {
        limit: 10,
        memoryTypes: [MEMORY_TYPES.EXPERIENCE],
        similarityThreshold: 0.4,
        minImportance: 0.4
      });

      // Build profile summary
      const profile = {
        userId,
        preferences: preferences,
        prefMemoryCount: prefMemories.length,
        expMemoryCount: expMemories.length,
        lastUpdated: new Date().toISOString(),

        // Extract key traits
        traits: this.extractTraitsFromPreferences(preferences),

        // Recent preference highlights
        recentPreferences: prefMemories.slice(0, 5).map(m => ({
          content: m.content,
          category: m.metadata?.category,
          confidence: m.metadata?.confidence
        })),

        // Recent experiences
        recentExperiences: expMemories.slice(0, 3).map(m => ({
          content: m.content,
          createdAt: m.createdAt
        }))
      };

      console.log(`✅ Profile built with ${Object.keys(preferences).length} preference categories`);
      return profile;

    } catch (error) {
      console.error('Error building personality profile:', error);
      return { userId, preferences: {}, traits: [], error: 'Failed to build profile' };
    }
  }

  /**
   * Extract key traits from structured preferences
   * @param {object} preferences - User preferences object
   * @returns {Array<string>} Key traits
   */
  extractTraitsFromPreferences(preferences) {
    const traits = [];

    if (preferences.dietary?.value) {
      traits.push(`${preferences.dietary.value} diet`);
    }

    if (preferences.pace?.value) {
      const paceMap = {
        'slow': 'Prefers relaxed travel',
        'relaxed': 'Prefers relaxed travel',
        'moderate': 'Balanced pace traveler',
        'fast': 'Likes packed itineraries',
        'packed': 'Likes packed itineraries'
      };
      const paceValue = preferences.pace.value.toLowerCase();
      traits.push(paceMap[paceValue] || `${preferences.pace.value} pace`);
    }

    if (preferences.budget?.value) {
      traits.push(`${preferences.budget.value} budget`);
    }

    if (preferences.activities?.value) {
      traits.push(`Enjoys ${preferences.activities.value}`);
    }

    if (preferences.accommodation?.value) {
      traits.push(`Prefers ${preferences.accommodation.value} stays`);
    }

    return traits;
  }

  /**
   * Build memory context for agent prompts
   * Retrieves relevant memories and formats them for injection into agent context
   * @param {string} userId - User ID
   * @param {string} currentQuery - Current user query
   * @returns {Promise<string>} Formatted memory context
   */
  async buildMemoryContext(userId, currentQuery) {
    try {
      // Get user profile
      const profile = await this.getPersonalityProfile(userId);

      // Get query-relevant memories
      const relevantMemories = await this.recall(userId, currentQuery, {
        limit: 5,
        similarityThreshold: 0.5,
        minImportance: 0.4
      });

      // Format context
      let context = '';

      // Add traits summary
      if (profile.traits && profile.traits.length > 0) {
        context += `USER PROFILE:\n`;
        context += profile.traits.map(t => `• ${t}`).join('\n');
        context += '\n\n';
      }

      // Add relevant memories
      if (relevantMemories.length > 0) {
        context += `RELEVANT MEMORIES:\n`;
        for (const mem of relevantMemories) {
          context += `• [${mem.memoryType}] ${mem.content}\n`;
        }
        context += '\n';
      }

      // Add specific preference highlights
      const prefs = profile.preferences;
      if (Object.keys(prefs).length > 0) {
        const importantPrefs = [];

        if (prefs.dietary?.value) {
          importantPrefs.push(`Dietary: ${prefs.dietary.value}`);
        }
        if (prefs.budget?.value) {
          importantPrefs.push(`Budget: ${prefs.budget.value}`);
        }
        if (prefs.activities?.value) {
          importantPrefs.push(`Activities: ${prefs.activities.value}`);
        }

        if (importantPrefs.length > 0) {
          context += `KEY PREFERENCES:\n`;
          context += importantPrefs.map(p => `• ${p}`).join('\n');
          context += '\n';
        }
      }

      return context.trim();

    } catch (error) {
      console.error('Error building memory context:', error);
      return '';
    }
  }

  /**
   * Record user feedback on a recommendation
   * @param {string} userId - User ID
   * @param {string} recommendation - What was recommended
   * @param {string} feedback - User's feedback (positive/negative/neutral)
   * @param {string} detail - Additional detail
   * @returns {Promise<string>} Memory ID
   */
  async recordFeedback(userId, recommendation, feedback, detail = '') {
    const content = `User ${feedback} feedback on "${recommendation}". ${detail}`.trim();

    return this.remember(userId, MEMORY_TYPES.FEEDBACK, content, {
      recommendation,
      feedbackType: feedback,
      detail
    });
  }

  /**
   * Record a past travel experience
   * @param {string} userId - User ID
   * @param {string} experience - Experience description
   * @param {object} metadata - Additional data (destination, date, etc.)
   * @returns {Promise<string>} Memory ID
   */
  async recordExperience(userId, experience, metadata = {}) {
    return this.remember(userId, MEMORY_TYPES.EXPERIENCE, experience, metadata);
  }

  /**
   * Delete a specific preference category
   * @param {string} userId - User ID
   * @param {string} category - Category to delete
   * @returns {Promise<boolean>} Success
   */
  async deletePreference(userId, category) {
    try {
      const existing = await this.db.query(`
        SELECT preferences FROM agent_user_preferences WHERE user_id = $1
      `, [userId]);

      if (existing.rows.length === 0) {
        return false;
      }

      const preferences = existing.rows[0].preferences;
      delete preferences[category];

      await this.db.query(`
        UPDATE agent_user_preferences
        SET preferences = $2, updated_at = NOW()
        WHERE user_id = $1
      `, [userId, JSON.stringify(preferences)]);

      console.log(`🗑️  Deleted preference category: ${category}`);
      return true;

    } catch (error) {
      console.error('Error deleting preference:', error);
      return false;
    }
  }

  /**
   * Clear all user memories (for privacy/reset)
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted memories
   */
  async clearAllMemories(userId) {
    try {
      const result = await this.db.query(`
        DELETE FROM agent_memory WHERE user_id = $1 RETURNING id
      `, [userId]);

      await this.db.query(`
        DELETE FROM agent_user_preferences WHERE user_id = $1
      `, [userId]);

      console.log(`🗑️  Cleared all memories for user ${userId.slice(0, 8)}`);
      return result.rows.length;

    } catch (error) {
      console.error('Error clearing memories:', error);
      return 0;
    }
  }
}

module.exports = MemoryService;
