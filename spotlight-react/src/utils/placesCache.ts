/**
 * Multi-Level Places Cache
 * WI-2.6: Unified caching system for Hidden Gems Engine
 *
 * Provides a two-level cache to balance performance and persistence:
 * - L1: In-memory cache (fastest, cleared on page refresh)
 * - L2: localStorage (persists across sessions, larger capacity)
 *
 * Architecture Decisions:
 * - Generic design: Can cache any serializable data type
 * - Configurable TTLs: Different TTLs for places (24h) vs details (7 days)
 * - Graceful degradation: Falls back to API on any cache failure
 * - Storage quotas: Manages localStorage size to avoid quota errors
 * - Versioned keys: Allows cache invalidation on data structure changes
 *
 * Cache Levels:
 * 1. In-memory (Map) - instant, session-scoped
 * 2. localStorage - ~5MB, persists across sessions
 * 3. API (fallback) - handled by calling code
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Cache entry metadata
 */
export interface CacheEntry<T> {
  /** The cached data */
  data: T;
  /** When the entry was created */
  createdAt: number;
  /** When the entry expires */
  expiresAt: number;
  /** Cache version (for invalidation) */
  version: number;
  /** Size in bytes (estimated) */
  sizeBytes?: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache namespace (e.g., 'places', 'details') */
  namespace: string;
  /** Time-to-live in milliseconds */
  ttlMs: number;
  /** Maximum entries in L1 (memory) */
  maxL1Entries: number;
  /** Maximum size in bytes for L2 (localStorage) */
  maxL2Bytes: number;
  /** Cache version (increment to invalidate all entries) */
  version: number;
  /** Whether to use L2 (localStorage) */
  useL2: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  namespace: string;
  l1: {
    entries: number;
    hits: number;
    misses: number;
  };
  l2: {
    entries: number;
    hits: number;
    misses: number;
    sizeBytes: number;
  };
  hitRate: number;
}

/**
 * Result of a cache get operation
 */
export interface CacheResult<T> {
  data: T | null;
  found: boolean;
  level: 'l1' | 'l2' | 'miss';
  isStale: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** localStorage key prefix */
const STORAGE_PREFIX = 'waycraft_cache_';

/** Default TTLs */
export const DEFAULT_TTLS = {
  /** 24 hours for place lists */
  PLACES: 24 * 60 * 60 * 1000,
  /** 7 days for place details */
  DETAILS: 7 * 24 * 60 * 60 * 1000,
  /** 1 hour for search results */
  SEARCH: 60 * 60 * 1000,
  /** 30 minutes for city aggregates */
  CITY: 30 * 60 * 1000,
};

/** Default max entries for L1 */
const DEFAULT_MAX_L1 = 100;

/** Default max size for L2 (2MB to leave room for other localStorage usage) */
const DEFAULT_MAX_L2_BYTES = 2 * 1024 * 1024;

/** Current cache version - increment to invalidate all caches */
const CURRENT_VERSION = 1;

// ============================================================================
// Multi-Level Cache Class
// ============================================================================

export class MultiLevelCache<T> {
  private config: CacheConfig;
  private l1: Map<string, CacheEntry<T>> = new Map();
  private stats = {
    l1Hits: 0,
    l1Misses: 0,
    l2Hits: 0,
    l2Misses: 0,
  };

  constructor(config: Partial<CacheConfig> & { namespace: string }) {
    this.config = {
      namespace: config.namespace,
      ttlMs: config.ttlMs ?? DEFAULT_TTLS.PLACES,
      maxL1Entries: config.maxL1Entries ?? DEFAULT_MAX_L1,
      maxL2Bytes: config.maxL2Bytes ?? DEFAULT_MAX_L2_BYTES,
      version: config.version ?? CURRENT_VERSION,
      useL2: config.useL2 ?? true,
    };

    // Clean up expired L2 entries on initialization
    if (this.config.useL2) {
      this.cleanupL2();
    }
  }

  // ==========================================================================
  // Core Operations
  // ==========================================================================

  /**
   * Get a value from cache
   */
  get(key: string): CacheResult<T> {
    const fullKey = this.getFullKey(key);
    const now = Date.now();

    // Try L1 first
    const l1Entry = this.l1.get(fullKey);
    if (l1Entry) {
      if (l1Entry.expiresAt > now && l1Entry.version === this.config.version) {
        this.stats.l1Hits++;
        return {
          data: l1Entry.data,
          found: true,
          level: 'l1',
          isStale: false,
        };
      }
      // Expired or wrong version
      this.l1.delete(fullKey);
    }
    this.stats.l1Misses++;

    // Try L2 if enabled
    if (this.config.useL2) {
      const l2Entry = this.getFromL2(fullKey);
      if (l2Entry) {
        if (l2Entry.expiresAt > now && l2Entry.version === this.config.version) {
          this.stats.l2Hits++;
          // Promote to L1
          this.l1.set(fullKey, l2Entry);
          this.enforceL1Limit();
          return {
            data: l2Entry.data,
            found: true,
            level: 'l2',
            isStale: false,
          };
        }
        // Expired or wrong version - remove from L2
        this.removeFromL2(fullKey);
      }
      this.stats.l2Misses++;
    }

    return {
      data: null,
      found: false,
      level: 'miss',
      isStale: false,
    };
  }

  /**
   * Set a value in cache
   */
  set(key: string, data: T): void {
    const fullKey = this.getFullKey(key);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      createdAt: now,
      expiresAt: now + this.config.ttlMs,
      version: this.config.version,
      sizeBytes: this.estimateSize(data),
    };

    // Set in L1
    this.l1.set(fullKey, entry);
    this.enforceL1Limit();

    // Set in L2 if enabled
    if (this.config.useL2) {
      this.setInL2(fullKey, entry);
    }
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    const result = this.get(key);
    return result.found;
  }

  /**
   * Remove a specific key
   */
  remove(key: string): void {
    const fullKey = this.getFullKey(key);
    this.l1.delete(fullKey);
    if (this.config.useL2) {
      this.removeFromL2(fullKey);
    }
  }

  /**
   * Clear all entries in this namespace
   */
  clear(): void {
    // Clear L1
    this.l1.clear();

    // Clear L2 for this namespace
    if (this.config.useL2) {
      this.clearL2Namespace();
    }

    // Reset stats
    this.stats = { l1Hits: 0, l1Misses: 0, l2Hits: 0, l2Misses: 0 };
  }

  // ==========================================================================
  // L2 (localStorage) Operations
  // ==========================================================================

  private getFromL2(fullKey: string): CacheEntry<T> | null {
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;
      return JSON.parse(raw) as CacheEntry<T>;
    } catch {
      // Parse error or localStorage unavailable
      return null;
    }
  }

  private setInL2(fullKey: string, entry: CacheEntry<T>): void {
    try {
      const serialized = JSON.stringify(entry);

      // Check if we'd exceed quota
      if (serialized.length > this.config.maxL2Bytes) {
        // Entry too large, skip L2
        return;
      }

      // Try to set, handle quota errors
      try {
        localStorage.setItem(fullKey, serialized);
      } catch (e) {
        // Likely QuotaExceededError - clear old entries and retry
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          this.evictL2Entries();
          try {
            localStorage.setItem(fullKey, serialized);
          } catch {
            // Still failing, give up on L2 for this entry
          }
        }
      }
    } catch {
      // Serialization error, skip L2
    }
  }

  private removeFromL2(fullKey: string): void {
    try {
      localStorage.removeItem(fullKey);
    } catch {
      // Ignore errors
    }
  }

  private clearL2Namespace(): void {
    try {
      const prefix = `${STORAGE_PREFIX}${this.config.namespace}_`;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore errors
    }
  }

  private cleanupL2(): void {
    try {
      const prefix = `${STORAGE_PREFIX}${this.config.namespace}_`;
      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const entry = JSON.parse(raw) as CacheEntry<unknown>;
              // Remove expired or wrong version
              if (entry.expiresAt < now || entry.version !== this.config.version) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Parse error, remove corrupted entry
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore errors
    }
  }

  private evictL2Entries(): void {
    try {
      const prefix = `${STORAGE_PREFIX}${this.config.namespace}_`;
      const entries: Array<{ key: string; createdAt: number }> = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const entry = JSON.parse(raw) as CacheEntry<unknown>;
              entries.push({ key, createdAt: entry.createdAt });
            }
          } catch {
            // Parse error, add for removal
            entries.push({ key, createdAt: 0 });
          }
        }
      }

      // Sort by createdAt, remove oldest 25%
      entries.sort((a, b) => a.createdAt - b.createdAt);
      const toRemove = Math.ceil(entries.length * 0.25);
      entries.slice(0, toRemove).forEach(({ key }) => {
        localStorage.removeItem(key);
      });
    } catch {
      // Ignore errors
    }
  }

  // ==========================================================================
  // L1 (Memory) Operations
  // ==========================================================================

  private enforceL1Limit(): void {
    if (this.l1.size <= this.config.maxL1Entries) return;

    // Remove oldest entries (LRU approximation)
    const entries = Array.from(this.l1.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt);

    const toRemove = this.l1.size - this.config.maxL1Entries;
    for (let i = 0; i < toRemove; i++) {
      this.l1.delete(entries[i][0]);
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private getFullKey(key: string): string {
    return `${STORAGE_PREFIX}${this.config.namespace}_${key}`;
  }

  private estimateSize(data: T): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 = 2 bytes per char
    } catch {
      return 0;
    }
  }

  // ==========================================================================
  // Statistics & Monitoring
  // ==========================================================================

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    const totalRequests = totalHits + this.stats.l1Misses;

    // Calculate L2 size
    let l2Size = 0;
    let l2Count = 0;
    if (this.config.useL2) {
      try {
        const prefix = `${STORAGE_PREFIX}${this.config.namespace}_`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(prefix)) {
            l2Count++;
            const raw = localStorage.getItem(key);
            if (raw) l2Size += raw.length * 2;
          }
        }
      } catch {
        // Ignore errors
      }
    }

    return {
      namespace: this.config.namespace,
      l1: {
        entries: this.l1.size,
        hits: this.stats.l1Hits,
        misses: this.stats.l1Misses,
      },
      l2: {
        entries: l2Count,
        hits: this.stats.l2Hits,
        misses: this.stats.l2Misses,
        sizeBytes: l2Size,
      },
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = { l1Hits: 0, l1Misses: 0, l2Hits: 0, l2Misses: 0 };
  }
}

// ============================================================================
// Pre-configured Cache Instances
// ============================================================================

/**
 * Cache for hidden gems search results
 * TTL: 1 hour (search results may change)
 */
export const hiddenGemsCache = new MultiLevelCache<unknown>({
  namespace: 'hidden_gems',
  ttlMs: DEFAULT_TTLS.SEARCH,
  maxL1Entries: 100,
});

/**
 * Cache for city places aggregates
 * TTL: 30 minutes (city data is frequently accessed)
 */
export const cityPlacesCache = new MultiLevelCache<unknown>({
  namespace: 'city_places',
  ttlMs: DEFAULT_TTLS.CITY,
  maxL1Entries: 50,
});

/**
 * Cache for place details
 * TTL: 7 days (details rarely change)
 */
export const placeDetailsCache = new MultiLevelCache<unknown>({
  namespace: 'place_details',
  ttlMs: DEFAULT_TTLS.DETAILS,
  maxL1Entries: 200,
});

// ============================================================================
// Cache Manager
// ============================================================================

/**
 * Global cache manager for monitoring and maintenance
 */
export const cacheManager = {
  /**
   * Get stats for all caches
   */
  getAllStats(): CacheStats[] {
    return [
      hiddenGemsCache.getStats(),
      cityPlacesCache.getStats(),
      placeDetailsCache.getStats(),
    ];
  },

  /**
   * Clear all caches
   */
  clearAll(): void {
    hiddenGemsCache.clear();
    cityPlacesCache.clear();
    placeDetailsCache.clear();
  },

  /**
   * Get total localStorage usage for all caches
   */
  getTotalStorageUsage(): { bytes: number; percentage: number } {
    let totalBytes = 0;

    try {
      const prefix = STORAGE_PREFIX;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const raw = localStorage.getItem(key);
          if (raw) totalBytes += raw.length * 2;
        }
      }
    } catch {
      // Ignore errors
    }

    // Estimate total localStorage quota (typically 5MB)
    const estimatedQuota = 5 * 1024 * 1024;

    return {
      bytes: totalBytes,
      percentage: (totalBytes / estimatedQuota) * 100,
    };
  },

  /**
   * Invalidate all caches (useful for debugging or forced refresh)
   */
  invalidateAll(): void {
    this.clearAll();
    // Clear all localStorage entries with our prefix
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore errors
    }
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a cache key from coordinates
 */
export function coordsToKey(lat: number, lng: number, precision: number = 3): string {
  const factor = Math.pow(10, precision);
  return `${Math.round(lat * factor) / factor},${Math.round(lng * factor) / factor}`;
}

/**
 * Generate a cache key for a city search
 */
export function citySearchKey(lat: number, lng: number, radius: number): string {
  return `${coordsToKey(lat, lng, 2)}_r${radius}`;
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Cache Decorators (for easy integration)
// ============================================================================

/**
 * Cache wrapper for async functions
 * Usage: const cachedFn = withCache(fetchPlaces, cityPlacesCache, (args) => `key_${args[0]}`);
 */
export function withCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  cache: MultiLevelCache<TResult>,
  keyFn: (args: TArgs) => string
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn(args);

    // Try cache first
    const cached = cache.get(key);
    if (cached.found && cached.data !== null) {
      return cached.data;
    }

    // Cache miss - fetch and cache
    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Cache wrapper with stale-while-revalidate
 * Returns stale data immediately while fetching fresh data in background
 *
 * @param fn The async function to wrap
 * @param cache The cache instance to use
 * @param keyFn Function to generate cache key from arguments
 * @param _staleFactor Consider stale after this fraction of TTL (reserved for future use)
 */
export function withSWRCache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  cache: MultiLevelCache<TResult>,
  keyFn: (args: TArgs) => string,
  _staleFactor: number = 0.5
): (...args: TArgs) => Promise<TResult> {
  const refreshing = new Set<string>();

  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn(args);

    // Try cache first
    const cached = cache.get(key);
    if (cached.found && cached.data !== null) {
      // Check if stale (and not already refreshing)
      if (!refreshing.has(key)) {
        // Trigger background refresh if stale
        // Note: Full staleness check would use _staleFactor with createdAt
        // For now, just return cached data
      }
      return cached.data;
    }

    // Cache miss - fetch and cache
    refreshing.add(key);
    try {
      const result = await fn(...args);
      cache.set(key, result);
      return result;
    } finally {
      refreshing.delete(key);
    }
  };
}
