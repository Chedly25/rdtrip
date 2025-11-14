/**
 * MemoryService - AI Agent Memory System
 *
 * Provides semantic memory using pgvector for:
 * - Conversation history storage with embeddings
 * - User preference learning and tracking
 * - Contextual memory retrieval
 *
 * Uses Cohere's free embedding API (100 req/min, 1024 dimensions)
 */

const { CohereClient } = require('cohere-ai');

class MemoryService {
  constructor(db) {
    this.db = db;

    // Initialize Cohere for embeddings (FREE tier!)
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  COHERE_API_KEY not configured - memory features will be limited');
      this.cohere = null;
    } else {
      this.cohere = new CohereClient({ token: apiKey });
    }
  }

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
}

module.exports = MemoryService;
