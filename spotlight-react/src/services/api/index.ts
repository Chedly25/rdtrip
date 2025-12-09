/**
 * API Services
 *
 * WI-12.2: Centralized API layer exports
 *
 * Provides error handling, rate limiting, and utilities for API operations.
 */

// ============================================================================
// Error Types
// ============================================================================
export {
  // Error classes
  ApiError,
  AuthError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  NetworkError,
  // Error codes
  API_ERROR_CODES,
  // Utilities
  httpStatusToError,
  supabaseErrorToApiError,
  isApiError,
  getErrorMessage,
  // Types
  type ApiErrorCode,
  type ApiErrorDetails,
} from './errors';

// ============================================================================
// Rate Limiting
// ============================================================================
export {
  // Core functions
  checkRateLimit,
  recordRequest,
  getRemainingRequests,
  getResetTime,
  clearRateLimit,
  // Higher-order functions
  withRateLimit,
  // Rate limit presets
  RATE_LIMITS,
  // React support
  createRateLimitKey,
  getRateLimitInfo,
  // Throttle/debounce
  debounce,
  cancelDebounce,
  throttle,
  // Types
  type RateLimitConfig,
  type RateLimitState,
  type RateLimitPreset,
  type RateLimitInfo,
} from './rateLimit';

// ============================================================================
// Re-export Supabase Client
// ============================================================================
export {
  supabase,
  getCurrentUser,
  getSession,
  isAuthenticated,
  signOut,
} from '../../lib/supabase';
