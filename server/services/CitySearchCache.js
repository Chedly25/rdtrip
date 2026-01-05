/**
 * CitySearchCache
 *
 * Caches city search results to reduce API calls and improve response times.
 * Uses database persistence with configurable TTL.
 */

const crypto = require('crypto');

class CitySearchCache {
  constructor(db, options = {}) {
    this.db = db;
    this.ttlHours = options.ttlHours || 24;
    this.maxCacheSize = options.maxCacheSize || 1000;

    // In-memory fallback for when DB is unavailable
    this.memoryCache = new Map();
    this.memoryCacheMaxAge = 30 * 60 * 1000; // 30 minutes

    console.log('🗄️ CitySearchCache initialized');
  }

  /**
   * Generate cache key from search parameters
   */
  generateKey(query, options = {}) {
    const normalizedQuery = query.toLowerCase().trim();
    const keyData = {
      query: normalizedQuery,
      intent: options.intent || 'general',
      region: options.region || 'europe',
      nearCity: options.nearCity?.toLowerCase()
    };

    return crypto
      .createHash('md5')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  /**
   * Get cached search results
   */
  async get(query, options = {}) {
    const queryHash = this.generateKey(query, options);
    const intent = options.intent || 'general';
    const region = options.region || 'europe';

    // Try database first
    if (this.db) {
      try {
        const result = await this.db.query(`
          SELECT cities, narrative, confidence, created_at
          FROM discovery_city_cache
          WHERE query_hash = $1
            AND intent = $2
            AND (region = $3 OR region IS NULL)
            AND expires_at > NOW()
          ORDER BY hit_count DESC
          LIMIT 1
        `, [queryHash, intent, region]);

        if (result.rows.length > 0) {
          // Update hit count async
          this.recordHit(queryHash, intent, region).catch(() => {});

          console.log(`📦 Cache HIT for "${query}" (${intent})`);
          return {
            cities: result.rows[0].cities,
            narrative: result.rows[0].narrative,
            confidence: parseFloat(result.rows[0].confidence) || 0.8,
            cached: true,
            cachedAt: result.rows[0].created_at
          };
        }
      } catch (err) {
        console.error('Cache DB read error:', err.message);
      }
    }

    // Try memory cache as fallback
    const memKey = `${queryHash}:${intent}:${region}`;
    const memEntry = this.memoryCache.get(memKey);
    if (memEntry && Date.now() - memEntry.timestamp < this.memoryCacheMaxAge) {
      console.log(`📦 Memory cache HIT for "${query}"`);
      return { ...memEntry.data, cached: true, source: 'memory' };
    }

    console.log(`📦 Cache MISS for "${query}" (${intent})`);
    return null;
  }

  /**
   * Store search results in cache
   */
  async set(query, options = {}, data) {
    const queryHash = this.generateKey(query, options);
    const intent = options.intent || 'general';
    const region = options.region || 'europe';

    // Store in memory cache
    const memKey = `${queryHash}:${intent}:${region}`;
    this.memoryCache.set(memKey, {
      data: {
        cities: data.cities,
        narrative: data.narrative,
        confidence: data.confidence
      },
      timestamp: Date.now()
    });

    // Prune memory cache if too large
    if (this.memoryCache.size > 100) {
      const oldest = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 20);
      oldest.forEach(([key]) => this.memoryCache.delete(key));
    }

    // Store in database
    if (this.db) {
      try {
        await this.db.query(`
          INSERT INTO discovery_city_cache
            (query_hash, intent, region, cities, narrative, confidence, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${this.ttlHours} hours')
          ON CONFLICT (query_hash, intent, region) DO UPDATE SET
            cities = $4,
            narrative = $5,
            confidence = $6,
            hit_count = discovery_city_cache.hit_count + 1,
            last_hit_at = NOW(),
            expires_at = NOW() + INTERVAL '${this.ttlHours} hours'
        `, [
          queryHash,
          intent,
          region,
          JSON.stringify(data.cities),
          data.narrative,
          data.confidence || 0.8
        ]);

        console.log(`📦 Cached results for "${query}" (${intent})`);
      } catch (err) {
        console.error('Cache DB write error:', err.message);
      }
    }
  }

  /**
   * Record a cache hit
   */
  async recordHit(queryHash, intent, region) {
    if (!this.db) return;

    try {
      await this.db.query(`
        UPDATE discovery_city_cache
        SET hit_count = hit_count + 1, last_hit_at = NOW()
        WHERE query_hash = $1 AND intent = $2 AND (region = $3 OR region IS NULL)
      `, [queryHash, intent, region]);
    } catch (err) {
      // Non-fatal
    }
  }

  /**
   * Invalidate cache for a specific query
   */
  async invalidate(query, options = {}) {
    const queryHash = this.generateKey(query, options);
    const intent = options.intent || 'general';
    const region = options.region || 'europe';

    // Clear memory cache
    const memKey = `${queryHash}:${intent}:${region}`;
    this.memoryCache.delete(memKey);

    // Clear database cache
    if (this.db) {
      try {
        await this.db.query(`
          DELETE FROM discovery_city_cache
          WHERE query_hash = $1 AND intent = $2
        `, [queryHash, intent]);
      } catch (err) {
        console.error('Cache invalidation error:', err.message);
      }
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanup() {
    // Clean memory cache
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > this.memoryCacheMaxAge) {
        this.memoryCache.delete(key);
      }
    }

    // Clean database cache
    if (this.db) {
      try {
        const result = await this.db.query(`
          DELETE FROM discovery_city_cache
          WHERE expires_at < NOW()
          RETURNING id
        `);

        if (result.rowCount > 0) {
          console.log(`🧹 Cleaned up ${result.rowCount} expired cache entries`);
        }
      } catch (err) {
        console.error('Cache cleanup error:', err.message);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const stats = {
      memoryEntries: this.memoryCache.size,
      dbEntries: 0,
      totalHits: 0,
      topQueries: []
    };

    if (this.db) {
      try {
        const countResult = await this.db.query(`
          SELECT COUNT(*) as count, SUM(hit_count) as total_hits
          FROM discovery_city_cache
          WHERE expires_at > NOW()
        `);

        stats.dbEntries = parseInt(countResult.rows[0]?.count || 0);
        stats.totalHits = parseInt(countResult.rows[0]?.total_hits || 0);

        const topResult = await this.db.query(`
          SELECT intent, hit_count
          FROM discovery_city_cache
          WHERE expires_at > NOW()
          ORDER BY hit_count DESC
          LIMIT 5
        `);

        stats.topQueries = topResult.rows;
      } catch (err) {
        // Non-fatal
      }
    }

    return stats;
  }

  /**
   * Warm the cache with common queries
   */
  async warmCache(searchFunction) {
    const commonQueries = [
      { query: 'coastal towns', intent: 'coastal' },
      { query: 'foodie cities', intent: 'foodie' },
      { query: 'hidden gems', intent: 'hidden_gem' },
      { query: 'historic cities', intent: 'historic' },
      { query: 'artistic towns', intent: 'artistic' }
    ];

    console.log('🔥 Warming cache with common queries...');

    for (const { query, intent } of commonQueries) {
      const cached = await this.get(query, { intent });
      if (!cached && searchFunction) {
        try {
          const result = await searchFunction(query, { intent });
          if (result?.cities?.length > 0) {
            await this.set(query, { intent }, result);
          }
        } catch (err) {
          console.error(`Cache warm failed for "${query}":`, err.message);
        }
      }
    }

    console.log('🔥 Cache warming complete');
  }
}

module.exports = CitySearchCache;
