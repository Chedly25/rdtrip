/**
 * Client-Side Rate Limiting
 *
 * WI-12.2: Rate limiting utility for API layer
 *
 * Provides client-side rate limiting to prevent abuse and
 * improve UX by avoiding unnecessary server errors.
 */

import { RateLimitError } from './errors';

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key to identify the rate limit bucket */
  key?: string;
}

export interface RateLimitState {
  count: number;
  resetAt: number;
}

// ============================================================================
// Rate Limit Store
// ============================================================================

const rateLimitStore = new Map<string, RateLimitState>();

// Cleanup old entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, state] of rateLimitStore.entries()) {
      if (state.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Cleanup every minute
}

// ============================================================================
// Default Configurations
// ============================================================================

export const RATE_LIMITS = {
  /** Standard API calls: 100 requests per minute */
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  /** AI/Companion calls: 20 requests per minute */
  ai: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  /** Search calls: 30 requests per minute */
  search: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  /** Auth calls: 10 requests per minute */
  auth: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  /** Heavy operations: 5 requests per minute */
  heavy: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
} as const;

export type RateLimitPreset = keyof typeof RATE_LIMITS;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Check if a request would be rate limited
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const state = rateLimitStore.get(key);

  // No existing state or window has reset
  if (!state || state.resetAt < now) {
    return true;
  }

  // Check if under limit
  return state.count < config.maxRequests;
}

/**
 * Record a request against the rate limit
 */
export function recordRequest(key: string, config: RateLimitConfig): void {
  const now = Date.now();
  const state = rateLimitStore.get(key);

  if (!state || state.resetAt < now) {
    // Create new window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
  } else {
    // Increment existing window
    state.count++;
  }
}

/**
 * Get remaining requests in current window
 */
export function getRemainingRequests(key: string, config: RateLimitConfig): number {
  const now = Date.now();
  const state = rateLimitStore.get(key);

  if (!state || state.resetAt < now) {
    return config.maxRequests;
  }

  return Math.max(0, config.maxRequests - state.count);
}

/**
 * Get time until rate limit resets (in ms)
 */
export function getResetTime(key: string): number {
  const now = Date.now();
  const state = rateLimitStore.get(key);

  if (!state || state.resetAt < now) {
    return 0;
  }

  return state.resetAt - now;
}

/**
 * Clear rate limit for a key
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================================================
// Higher-Order Function
// ============================================================================

/**
 * Wrap an async function with rate limiting
 *
 * @example
 * const rateLimitedFetch = withRateLimit(
 *   fetchData,
 *   'api:fetchData',
 *   RATE_LIMITS.standard
 * );
 */
export function withRateLimit<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  key: string,
  config: RateLimitConfig
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    if (!checkRateLimit(key, config)) {
      const resetTime = getResetTime(key);
      throw new RateLimitError(
        Math.ceil(resetTime / 1000),
        `Rate limit exceeded. Try again in ${Math.ceil(resetTime / 1000)} seconds`
      );
    }

    recordRequest(key, config);

    try {
      return await fn(...args);
    } catch (error) {
      // Don't count failed requests against rate limit
      // (This is optional - you might want to count them)
      throw error;
    }
  };
}

// ============================================================================
// React Hook Support
// ============================================================================

/**
 * Create a rate limit key with user context
 */
export function createRateLimitKey(
  endpoint: string,
  userId?: string | null
): string {
  return userId ? `${endpoint}:${userId}` : `${endpoint}:anonymous`;
}

/**
 * Rate limit info for UI display
 */
export interface RateLimitInfo {
  isLimited: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Get rate limit info for UI
 */
export function getRateLimitInfo(
  key: string,
  config: RateLimitConfig
): RateLimitInfo {
  const remaining = getRemainingRequests(key, config);
  const resetTime = getResetTime(key);

  return {
    isLimited: remaining <= 0,
    remaining,
    resetInSeconds: Math.ceil(resetTime / 1000),
  };
}

// ============================================================================
// Debounce Helper (for search inputs)
// ============================================================================

const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Debounce a function call
 *
 * @example
 * const debouncedSearch = debounce('search', searchFn, 300);
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  key: string,
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    const existingTimer = debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      debounceTimers.delete(key);
      fn(...args);
    }, delayMs);

    debounceTimers.set(key, timer);
  };
}

/**
 * Cancel a pending debounced call
 */
export function cancelDebounce(key: string): void {
  const timer = debounceTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(key);
  }
}

// ============================================================================
// Throttle Helper (for frequent events)
// ============================================================================

const throttleState = new Map<string, number>();

/**
 * Throttle a function call
 *
 * @example
 * const throttledScroll = throttle('scroll', handleScroll, 100);
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  key: string,
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const lastCall = throttleState.get(key) || 0;

    if (now - lastCall >= limitMs) {
      throttleState.set(key, now);
      fn(...args);
    }
  };
}
