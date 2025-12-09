/**
 * API Error Types
 *
 * WI-12.2: Unified error handling for the API layer
 *
 * Provides consistent error types across all API services with
 * proper error codes and user-friendly messages.
 */

// ============================================================================
// Error Codes
// ============================================================================

export const API_ERROR_CODES = {
  // Auth errors (1xxx)
  UNAUTHORIZED: 1001,
  SESSION_EXPIRED: 1002,
  INVALID_CREDENTIALS: 1003,
  ACCOUNT_DISABLED: 1004,

  // Validation errors (2xxx)
  VALIDATION_ERROR: 2001,
  MISSING_REQUIRED_FIELD: 2002,
  INVALID_FORMAT: 2003,
  OUT_OF_RANGE: 2004,

  // Resource errors (3xxx)
  NOT_FOUND: 3001,
  ALREADY_EXISTS: 3002,
  CONFLICT: 3003,
  GONE: 3004,

  // Rate limiting (4xxx)
  RATE_LIMITED: 4001,
  QUOTA_EXCEEDED: 4002,
  TOO_MANY_REQUESTS: 4003,

  // Server errors (5xxx)
  INTERNAL_ERROR: 5001,
  SERVICE_UNAVAILABLE: 5002,
  TIMEOUT: 5003,
  DATABASE_ERROR: 5004,

  // Network errors (6xxx)
  NETWORK_ERROR: 6001,
  CONNECTION_FAILED: 6002,
  OFFLINE: 6003,
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  [API_ERROR_CODES.UNAUTHORIZED]: 'Please sign in to continue',
  [API_ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please sign in again',
  [API_ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
  [API_ERROR_CODES.ACCOUNT_DISABLED]: 'This account has been disabled',

  [API_ERROR_CODES.VALIDATION_ERROR]: 'Invalid input data',
  [API_ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [API_ERROR_CODES.INVALID_FORMAT]: 'Invalid data format',
  [API_ERROR_CODES.OUT_OF_RANGE]: 'Value is out of allowed range',

  [API_ERROR_CODES.NOT_FOUND]: 'Resource not found',
  [API_ERROR_CODES.ALREADY_EXISTS]: 'Resource already exists',
  [API_ERROR_CODES.CONFLICT]: 'Resource conflict',
  [API_ERROR_CODES.GONE]: 'Resource no longer available',

  [API_ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment',
  [API_ERROR_CODES.QUOTA_EXCEEDED]: 'Usage quota exceeded',
  [API_ERROR_CODES.TOO_MANY_REQUESTS]: 'Request limit reached. Try again later',

  [API_ERROR_CODES.INTERNAL_ERROR]: 'Something went wrong. Please try again',
  [API_ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [API_ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again',
  [API_ERROR_CODES.DATABASE_ERROR]: 'Database error occurred',

  [API_ERROR_CODES.NETWORK_ERROR]: 'Network error. Check your connection',
  [API_ERROR_CODES.CONNECTION_FAILED]: 'Failed to connect to server',
  [API_ERROR_CODES.OFFLINE]: 'You appear to be offline',
};

// ============================================================================
// Base Error Class
// ============================================================================

export interface ApiErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: ApiErrorDetails;
  readonly isRetryable: boolean;
  readonly timestamp: string;

  constructor(
    code: ApiErrorCode,
    message?: string,
    options?: {
      status?: number;
      details?: ApiErrorDetails;
      cause?: Error;
    }
  ) {
    super(message || ERROR_MESSAGES[code] || 'Unknown error');
    this.name = 'ApiError';
    this.code = code;
    this.status = options?.status || codeToStatus(code);
    this.details = options?.details;
    this.isRetryable = isRetryableCode(code);
    this.timestamp = new Date().toISOString();

    if (options?.cause) {
      this.cause = options.cause;
    }

    // Capture stack trace
    Error.captureStackTrace?.(this, ApiError);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// Specialized Error Classes
// ============================================================================

export class AuthError extends ApiError {
  constructor(code: ApiErrorCode = API_ERROR_CODES.UNAUTHORIZED, message?: string) {
    super(code, message, { status: 401 });
    this.name = 'AuthError';
  }
}

export class ValidationError extends ApiError {
  readonly field?: string;

  constructor(message: string, field?: string, details?: ApiErrorDetails) {
    super(API_ERROR_CODES.VALIDATION_ERROR, message, {
      status: 400,
      details: { ...details, field },
    });
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends ApiError {
  readonly resource: string;

  constructor(resource: string, id?: string) {
    super(
      API_ERROR_CODES.NOT_FOUND,
      `${resource}${id ? ` with ID ${id}` : ''} not found`,
      { status: 404 }
    );
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

export class RateLimitError extends ApiError {
  readonly retryAfter?: number;

  constructor(retryAfter?: number, message?: string) {
    super(API_ERROR_CODES.RATE_LIMITED, message, {
      status: 429,
      details: { retryAfter },
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class NetworkError extends ApiError {
  constructor(message?: string, cause?: Error) {
    super(API_ERROR_CODES.NETWORK_ERROR, message || 'Network request failed', {
      status: 0,
      cause,
    });
    this.name = 'NetworkError';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function codeToStatus(code: ApiErrorCode): number {
  if (code >= 1000 && code < 2000) return 401; // Auth errors
  if (code >= 2000 && code < 3000) return 400; // Validation errors
  if (code >= 3000 && code < 4000) return 404; // Resource errors
  if (code >= 4000 && code < 5000) return 429; // Rate limiting
  if (code >= 5000 && code < 6000) return 500; // Server errors
  if (code >= 6000 && code < 7000) return 0; // Network errors
  return 500;
}

function isRetryableCode(code: ApiErrorCode): boolean {
  // Retryable: rate limits, server errors, network errors
  return (
    (code >= 4000 && code < 5000) ||
    (code >= 5000 && code < 6000 && code !== API_ERROR_CODES.INTERNAL_ERROR) ||
    (code >= 6000 && code < 7000)
  );
}

/**
 * Convert HTTP status to appropriate error
 */
export function httpStatusToError(status: number, message?: string): ApiError {
  switch (status) {
    case 400:
      return new ApiError(API_ERROR_CODES.VALIDATION_ERROR, message);
    case 401:
      return new AuthError(API_ERROR_CODES.UNAUTHORIZED, message);
    case 403:
      return new AuthError(API_ERROR_CODES.ACCOUNT_DISABLED, message);
    case 404:
      return new ApiError(API_ERROR_CODES.NOT_FOUND, message);
    case 409:
      return new ApiError(API_ERROR_CODES.CONFLICT, message);
    case 429:
      return new RateLimitError(undefined, message);
    case 500:
      return new ApiError(API_ERROR_CODES.INTERNAL_ERROR, message);
    case 503:
      return new ApiError(API_ERROR_CODES.SERVICE_UNAVAILABLE, message);
    default:
      return new ApiError(API_ERROR_CODES.INTERNAL_ERROR, message);
  }
}

/**
 * Convert Supabase error to ApiError
 */
export function supabaseErrorToApiError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}): ApiError {
  const message = error.message || 'Database operation failed';

  // Map Supabase error codes
  switch (error.code) {
    case 'PGRST116': // No rows found
      return new ApiError(API_ERROR_CODES.NOT_FOUND, message);
    case '23505': // Unique violation
      return new ApiError(API_ERROR_CODES.ALREADY_EXISTS, message);
    case '23503': // Foreign key violation
      return new ApiError(API_ERROR_CODES.VALIDATION_ERROR, message);
    case '42501': // RLS violation
      return new AuthError(API_ERROR_CODES.UNAUTHORIZED, message);
    default:
      return new ApiError(API_ERROR_CODES.DATABASE_ERROR, message, {
        details: { code: error.code, hint: error.hint },
      });
  }
}

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
