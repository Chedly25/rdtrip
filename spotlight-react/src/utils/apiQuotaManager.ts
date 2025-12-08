/**
 * API Rate Limiting & Quota Management
 * WI-2.7: Ensures we stay within Google Places API quotas
 *
 * This utility provides comprehensive rate limiting and quota management:
 * - Request queuing when approaching limits
 * - Graceful degradation when quota exceeded
 * - Monitoring and alerting for quota warnings
 * - Support for multiple API endpoints with different limits
 *
 * Architecture Decisions:
 * - Singleton pattern: One manager handles all API calls
 * - Queue-based: Requests wait rather than fail immediately
 * - Observable: Components can subscribe to quota warnings
 * - Persistent: Tracks usage across page refreshes (within day)
 *
 * Google Places API Limits (typical):
 * - 1,000 requests per day (free tier)
 * - 100,000 requests per day (paid)
 * - No hard per-second limit, but recommended <10/sec
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Quota configuration for an API endpoint
 */
export interface QuotaConfig {
  /** Unique identifier for this quota */
  id: string;
  /** Human-readable name */
  name: string;
  /** Maximum requests per window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Daily limit (optional, 0 = unlimited) */
  dailyLimit: number;
  /** Warning threshold (0-1, triggers warning at this % of limit) */
  warningThreshold: number;
  /** Critical threshold (0-1, triggers critical at this %) */
  criticalThreshold: number;
}

/**
 * Current quota status
 */
export interface QuotaStatus {
  /** Quota configuration */
  config: QuotaConfig;
  /** Requests in current window */
  windowUsage: number;
  /** Requests today */
  dailyUsage: number;
  /** Whether we can make a request now */
  canRequest: boolean;
  /** Time until next request slot (ms), 0 if available */
  waitTimeMs: number;
  /** Current status level */
  level: 'ok' | 'warning' | 'critical' | 'exceeded';
  /** Percentage of limit used (0-100) */
  usagePercent: number;
  /** Estimated requests remaining today */
  remainingToday: number;
}

/**
 * Queued request
 */
interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  quotaId: string;
  priority: number;
  queuedAt: number;
  timeoutMs: number;
}

/**
 * Quota warning event
 */
export interface QuotaWarningEvent {
  quotaId: string;
  level: 'warning' | 'critical' | 'exceeded';
  message: string;
  usagePercent: number;
  remainingToday: number;
  timestamp: Date;
}

/**
 * Quota event listener
 */
export type QuotaEventListener = (event: QuotaWarningEvent) => void;

// ============================================================================
// Constants
// ============================================================================

/** Default quotas for Google Places API */
export const DEFAULT_QUOTAS: QuotaConfig[] = [
  {
    id: 'places_search',
    name: 'Places Search',
    maxRequests: 10,
    windowMs: 1000, // 10 requests per second
    dailyLimit: 1000, // Free tier
    warningThreshold: 0.7,
    criticalThreshold: 0.9,
  },
  {
    id: 'places_details',
    name: 'Places Details',
    maxRequests: 10,
    windowMs: 1000,
    dailyLimit: 1000,
    warningThreshold: 0.7,
    criticalThreshold: 0.9,
  },
  {
    id: 'places_photos',
    name: 'Places Photos',
    maxRequests: 20,
    windowMs: 1000,
    dailyLimit: 5000,
    warningThreshold: 0.7,
    criticalThreshold: 0.9,
  },
];

/** localStorage key for daily usage tracking */
const STORAGE_KEY = 'waycraft_api_quota';

/** Maximum queue size before rejecting new requests */
const MAX_QUEUE_SIZE = 100;

/** Default request timeout in queue (30 seconds) */
const DEFAULT_QUEUE_TIMEOUT = 30000;

// ============================================================================
// Quota Manager Class
// ============================================================================

class APIQuotaManager {
  private quotas: Map<string, QuotaConfig> = new Map();
  private windowUsage: Map<string, number[]> = new Map(); // timestamps
  private dailyUsage: Map<string, number> = new Map();
  private dailyDate: string = '';
  private queue: QueuedRequest<unknown>[] = [];
  private isProcessingQueue = false;
  private listeners: Set<QuotaEventListener> = new Set();
  private lastWarningLevel: Map<string, string> = new Map();

  constructor() {
    // Initialize default quotas
    DEFAULT_QUOTAS.forEach((quota) => this.registerQuota(quota));

    // Load persisted daily usage
    this.loadDailyUsage();

    // Start queue processor
    this.startQueueProcessor();
  }

  // ==========================================================================
  // Quota Registration
  // ==========================================================================

  /**
   * Register a new quota configuration
   */
  registerQuota(config: QuotaConfig): void {
    this.quotas.set(config.id, config);
    if (!this.windowUsage.has(config.id)) {
      this.windowUsage.set(config.id, []);
    }
    if (!this.dailyUsage.has(config.id)) {
      this.dailyUsage.set(config.id, 0);
    }
  }

  /**
   * Update an existing quota configuration
   */
  updateQuota(id: string, updates: Partial<QuotaConfig>): void {
    const existing = this.quotas.get(id);
    if (existing) {
      this.quotas.set(id, { ...existing, ...updates });
    }
  }

  // ==========================================================================
  // Request Management
  // ==========================================================================

  /**
   * Check if a request can be made immediately
   */
  canMakeRequest(quotaId: string): boolean {
    const status = this.getStatus(quotaId);
    return status.canRequest;
  }

  /**
   * Record that a request was made
   */
  recordRequest(quotaId: string): void {
    const now = Date.now();

    // Update window usage
    const timestamps = this.windowUsage.get(quotaId) || [];
    timestamps.push(now);
    this.windowUsage.set(quotaId, timestamps);

    // Update daily usage
    this.checkDailyReset();
    const daily = this.dailyUsage.get(quotaId) || 0;
    this.dailyUsage.set(quotaId, daily + 1);
    this.saveDailyUsage();

    // Check for warnings
    this.checkAndEmitWarnings(quotaId);
  }

  /**
   * Get time to wait before next request (ms)
   */
  getWaitTime(quotaId: string): number {
    const config = this.quotas.get(quotaId);
    if (!config) return 0;

    this.cleanupWindowUsage(quotaId);
    const timestamps = this.windowUsage.get(quotaId) || [];

    if (timestamps.length < config.maxRequests) {
      return 0;
    }

    // Calculate when the oldest request will expire from window
    const oldestTimestamp = timestamps[0];
    const expiresAt = oldestTimestamp + config.windowMs;
    return Math.max(0, expiresAt - Date.now());
  }

  /**
   * Execute a request with rate limiting
   * Queues the request if limits are reached
   */
  async executeWithLimit<T>(
    quotaId: string,
    requestFn: () => Promise<T>,
    options: {
      priority?: number;
      timeoutMs?: number;
      skipQueue?: boolean;
    } = {}
  ): Promise<T> {
    const { priority = 0, timeoutMs = DEFAULT_QUEUE_TIMEOUT, skipQueue = false } = options;

    // Check current status
    const status = this.getStatus(quotaId);

    // If quota exceeded and skip queue, throw immediately
    if (status.level === 'exceeded' && skipQueue) {
      throw new QuotaExceededError(quotaId, status);
    }

    // If can request immediately, do it
    if (status.canRequest) {
      this.recordRequest(quotaId);
      return requestFn();
    }

    // If skip queue, throw rate limit error
    if (skipQueue) {
      throw new RateLimitError(quotaId, status.waitTimeMs);
    }

    // Queue the request
    return this.queueRequest(quotaId, requestFn, priority, timeoutMs);
  }

  // ==========================================================================
  // Request Queue
  // ==========================================================================

  /**
   * Add a request to the queue
   */
  private queueRequest<T>(
    quotaId: string,
    execute: () => Promise<T>,
    priority: number,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check queue size
      if (this.queue.length >= MAX_QUEUE_SIZE) {
        reject(new Error('Request queue full. Please try again later.'));
        return;
      }

      const request: QueuedRequest<T> = {
        id: `${quotaId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
        quotaId,
        priority,
        queuedAt: Date.now(),
        timeoutMs,
      };

      // Insert by priority (higher priority first)
      const insertIndex = this.queue.findIndex((r) => r.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(request as QueuedRequest<unknown>);
      } else {
        this.queue.splice(insertIndex, 0, request as QueuedRequest<unknown>);
      }
    });
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => this.processQueue(), 100); // Check every 100ms
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      const now = Date.now();

      // Process expired requests first
      const expired = this.queue.filter((r) => now - r.queuedAt > r.timeoutMs);
      expired.forEach((r) => {
        r.reject(new Error('Request timed out in queue'));
      });
      this.queue = this.queue.filter((r) => now - r.queuedAt <= r.timeoutMs);

      // Try to process next request
      if (this.queue.length > 0) {
        const request = this.queue[0];

        if (this.canMakeRequest(request.quotaId)) {
          // Remove from queue
          this.queue.shift();

          // Execute
          this.recordRequest(request.quotaId);
          try {
            const result = await request.execute();
            request.resolve(result);
          } catch (error) {
            request.reject(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // ==========================================================================
  // Status & Monitoring
  // ==========================================================================

  /**
   * Get current status for a quota
   */
  getStatus(quotaId: string): QuotaStatus {
    const config = this.quotas.get(quotaId);
    if (!config) {
      return {
        config: { id: quotaId, name: 'Unknown', maxRequests: 0, windowMs: 0, dailyLimit: 0, warningThreshold: 0, criticalThreshold: 0 },
        windowUsage: 0,
        dailyUsage: 0,
        canRequest: false,
        waitTimeMs: 0,
        level: 'exceeded',
        usagePercent: 100,
        remainingToday: 0,
      };
    }

    this.cleanupWindowUsage(quotaId);
    this.checkDailyReset();

    const windowUsage = (this.windowUsage.get(quotaId) || []).length;
    const dailyUsage = this.dailyUsage.get(quotaId) || 0;
    const waitTimeMs = this.getWaitTime(quotaId);

    // Check if daily limit exceeded
    const dailyExceeded = config.dailyLimit > 0 && dailyUsage >= config.dailyLimit;

    // Calculate usage percentage (use daily if daily limit exists, otherwise window)
    const usagePercent = config.dailyLimit > 0
      ? (dailyUsage / config.dailyLimit) * 100
      : (windowUsage / config.maxRequests) * 100;

    // Determine level
    let level: QuotaStatus['level'] = 'ok';
    if (dailyExceeded) {
      level = 'exceeded';
    } else if (usagePercent >= config.criticalThreshold * 100) {
      level = 'critical';
    } else if (usagePercent >= config.warningThreshold * 100) {
      level = 'warning';
    }

    const canRequest = !dailyExceeded && windowUsage < config.maxRequests;
    const remainingToday = config.dailyLimit > 0 ? Math.max(0, config.dailyLimit - dailyUsage) : Infinity;

    return {
      config,
      windowUsage,
      dailyUsage,
      canRequest,
      waitTimeMs,
      level,
      usagePercent: Math.min(100, usagePercent),
      remainingToday: remainingToday === Infinity ? -1 : remainingToday,
    };
  }

  /**
   * Get status for all quotas
   */
  getAllStatus(): QuotaStatus[] {
    return Array.from(this.quotas.keys()).map((id) => this.getStatus(id));
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): { size: number; oldestMs: number; byQuota: Record<string, number> } {
    const now = Date.now();
    const byQuota: Record<string, number> = {};

    this.queue.forEach((r) => {
      byQuota[r.quotaId] = (byQuota[r.quotaId] || 0) + 1;
    });

    return {
      size: this.queue.length,
      oldestMs: this.queue.length > 0 ? now - this.queue[0].queuedAt : 0,
      byQuota,
    };
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================

  /**
   * Subscribe to quota warning events
   */
  onWarning(listener: QuotaEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check and emit warnings if thresholds crossed
   */
  private checkAndEmitWarnings(quotaId: string): void {
    const status = this.getStatus(quotaId);
    const lastLevel = this.lastWarningLevel.get(quotaId);

    // Only emit if level changed or is warning/critical/exceeded
    if (status.level !== 'ok' && status.level !== lastLevel) {
      this.lastWarningLevel.set(quotaId, status.level);

      const event: QuotaWarningEvent = {
        quotaId,
        level: status.level as 'warning' | 'critical' | 'exceeded',
        message: this.getWarningMessage(status),
        usagePercent: status.usagePercent,
        remainingToday: status.remainingToday,
        timestamp: new Date(),
      };

      // Emit to listeners
      this.listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (e) {
          console.error('Error in quota warning listener:', e);
        }
      });

      // Also log
      const logFn = status.level === 'exceeded' ? console.error : console.warn;
      logFn(`[API Quota] ${event.message}`);
    }
  }

  private getWarningMessage(status: QuotaStatus): string {
    const { config, level, usagePercent, remainingToday } = status;

    switch (level) {
      case 'warning':
        return `${config.name}: ${usagePercent.toFixed(0)}% of quota used. ${remainingToday} requests remaining today.`;
      case 'critical':
        return `${config.name}: CRITICAL - ${usagePercent.toFixed(0)}% of quota used! Only ${remainingToday} requests remaining.`;
      case 'exceeded':
        return `${config.name}: EXCEEDED - Daily quota exhausted. API calls will fail until tomorrow.`;
      default:
        return '';
    }
  }

  // ==========================================================================
  // Persistence
  // ==========================================================================

  /**
   * Load daily usage from localStorage
   */
  private loadDailyUsage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date === this.getTodayString()) {
          this.dailyDate = data.date;
          Object.entries(data.usage).forEach(([id, count]) => {
            this.dailyUsage.set(id, count as number);
          });
        }
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Save daily usage to localStorage
   */
  private saveDailyUsage(): void {
    try {
      const data = {
        date: this.getTodayString(),
        usage: Object.fromEntries(this.dailyUsage),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore errors
    }
  }

  /**
   * Check if we need to reset daily usage (new day)
   */
  private checkDailyReset(): void {
    const today = this.getTodayString();
    if (this.dailyDate !== today) {
      this.dailyDate = today;
      this.dailyUsage.clear();
      this.lastWarningLevel.clear();
      this.quotas.forEach((_, id) => this.dailyUsage.set(id, 0));
      this.saveDailyUsage();
    }
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  /**
   * Remove expired timestamps from window usage
   */
  private cleanupWindowUsage(quotaId: string): void {
    const config = this.quotas.get(quotaId);
    if (!config) return;

    const now = Date.now();
    const cutoff = now - config.windowMs;
    const timestamps = this.windowUsage.get(quotaId) || [];
    this.windowUsage.set(quotaId, timestamps.filter((ts) => ts > cutoff));
  }

  /**
   * Clear all usage data (for testing)
   */
  reset(): void {
    this.windowUsage.clear();
    this.dailyUsage.clear();
    this.queue = [];
    this.lastWarningLevel.clear();
    this.quotas.forEach((_, id) => {
      this.windowUsage.set(id, []);
      this.dailyUsage.set(id, 0);
    });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

// ============================================================================
// Custom Errors
// ============================================================================

/**
 * Error thrown when rate limit is hit
 */
export class RateLimitError extends Error {
  readonly quotaId: string;
  readonly waitTimeMs: number;

  constructor(quotaId: string, waitTimeMs: number) {
    super(`Rate limit exceeded for ${quotaId}. Retry in ${Math.ceil(waitTimeMs / 1000)}s.`);
    this.name = 'RateLimitError';
    this.quotaId = quotaId;
    this.waitTimeMs = waitTimeMs;
  }
}

/**
 * Error thrown when daily quota is exceeded
 */
export class QuotaExceededError extends Error {
  readonly quotaId: string;
  readonly status: QuotaStatus;

  constructor(quotaId: string, status: QuotaStatus) {
    super(`Daily quota exceeded for ${quotaId}. ${status.dailyUsage}/${status.config.dailyLimit} requests used.`);
    this.name = 'QuotaExceededError';
    this.quotaId = quotaId;
    this.status = status;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Global API quota manager instance */
export const apiQuotaManager = new APIQuotaManager();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Execute a Places Search API call with rate limiting
 */
export async function executeSearchRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return apiQuotaManager.executeWithLimit('places_search', requestFn);
}

/**
 * Execute a Places Details API call with rate limiting
 */
export async function executeDetailsRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return apiQuotaManager.executeWithLimit('places_details', requestFn);
}

/**
 * Execute a Places Photos API call with rate limiting
 */
export async function executePhotosRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  return apiQuotaManager.executeWithLimit('places_photos', requestFn);
}

/**
 * Check if Places API is available (not quota exceeded)
 */
export function isPlacesAPIAvailable(): boolean {
  const searchStatus = apiQuotaManager.getStatus('places_search');
  const detailsStatus = apiQuotaManager.getStatus('places_details');
  return searchStatus.level !== 'exceeded' && detailsStatus.level !== 'exceeded';
}

/**
 * Get a summary of API quota usage
 */
export function getQuotaSummary(): {
  available: boolean;
  searchRemaining: number;
  detailsRemaining: number;
  overallLevel: 'ok' | 'warning' | 'critical' | 'exceeded';
} {
  const search = apiQuotaManager.getStatus('places_search');
  const details = apiQuotaManager.getStatus('places_details');

  // Overall level is the worst of all quotas
  const levels = [search.level, details.level];
  let overallLevel: 'ok' | 'warning' | 'critical' | 'exceeded';

  if (levels.includes('exceeded')) {
    overallLevel = 'exceeded';
  } else if (levels.includes('critical')) {
    overallLevel = 'critical';
  } else if (levels.includes('warning')) {
    overallLevel = 'warning';
  } else {
    overallLevel = 'ok';
  }

  return {
    available: overallLevel !== 'exceeded',
    searchRemaining: search.remainingToday,
    detailsRemaining: details.remainingToday,
    overallLevel,
  };
}

/**
 * Subscribe to quota warnings (convenience wrapper)
 */
export function onQuotaWarning(listener: QuotaEventListener): () => void {
  return apiQuotaManager.onWarning(listener);
}
