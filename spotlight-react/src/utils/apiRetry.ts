/**
 * API Retry Utility
 * Handles transient failures with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: Error) => {
    // Retry on network errors or 5xx server errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    if ('status' in error && typeof error.status === 'number') {
      return error.status >= 500 && error.status < 600;
    }
    return false;
  },
  onRetry: (error: Error, attempt: number) => {
    console.warn(`Retry attempt ${attempt} after error:`, error.message);
  }
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's the last attempt or if we shouldn't retry this error
      if (attempt > opts.maxRetries || !opts.shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Call retry callback
      opts.onRetry(lastError, attempt);

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts.baseDelay, opts.maxDelay);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Fetch with retry
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    return response;
  }, retryOptions);
}

/**
 * Wrap an async function with retry logic
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: RetryOptions
): T {
  return ((...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args), options);
  }) as T;
}
