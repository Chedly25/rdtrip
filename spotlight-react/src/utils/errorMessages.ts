/**
 * Error Messages Utility - Wanderlust Editorial
 *
 * Maps technical errors to warm, friendly copy that maintains
 * the editorial tone of voice. Every error should feel like
 * a gentle guide rather than a roadblock.
 */

interface FriendlyError {
  title: string
  message: string
  suggestion?: string
  recoverable: boolean
}

// Technical error patterns mapped to friendly messages
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string
  error: FriendlyError
}> = [
  // Network errors
  {
    pattern: /network|NetworkError|ERR_NETWORK|Failed to fetch/i,
    error: {
      title: 'Connection Lost',
      message: "We couldn't reach our servers. This usually means your internet connection dropped briefly.",
      suggestion: 'Check your connection and try again.',
      recoverable: true,
    },
  },
  {
    pattern: /timeout|ETIMEDOUT|AbortError/i,
    error: {
      title: 'Taking a Bit Longer',
      message: "This request is taking longer than expected. Our AI might be working extra hard on your route.",
      suggestion: 'Please wait a moment or try again.',
      recoverable: true,
    },
  },

  // Authentication errors
  {
    pattern: /401|unauthorized|auth.*expired|token.*invalid/i,
    error: {
      title: 'Session Expired',
      message: "Your session has ended. This happens after some time for your security.",
      suggestion: 'Please sign in again to continue.',
      recoverable: true,
    },
  },
  {
    pattern: /403|forbidden|not.*permitted/i,
    error: {
      title: 'Access Restricted',
      message: "You don't have permission to access this. This might be a private route belonging to someone else.",
      suggestion: 'Check the link or ask the owner to share it with you.',
      recoverable: false,
    },
  },

  // Not found errors
  {
    pattern: /404|not.*found|does.*not.*exist/i,
    error: {
      title: 'Journey Not Found',
      message: "This route seems to have wandered off. It may have been deleted or the link might be incorrect.",
      suggestion: 'Check the URL or return to your saved routes.',
      recoverable: false,
    },
  },

  // Server errors
  {
    pattern: /500|internal.*server/i,
    error: {
      title: 'Something Went Wrong',
      message: "Our servers encountered an unexpected issue. Your data is safe, we just hit a bump in the road.",
      suggestion: 'Please try again in a moment.',
      recoverable: true,
    },
  },
  {
    pattern: /502|503|504|bad.*gateway|service.*unavailable/i,
    error: {
      title: 'Briefly Unavailable',
      message: "Our service is momentarily unavailable. We're likely doing maintenance or experiencing high traffic.",
      suggestion: 'Please try again in a few minutes.',
      recoverable: true,
    },
  },

  // Route generation errors
  {
    pattern: /generation.*failed|failed.*generate|route.*error/i,
    error: {
      title: 'Route Creation Paused',
      message: "We couldn't complete your route this time. The AI might have encountered unusual conditions.",
      suggestion: 'Try adjusting your preferences or destinations slightly.',
      recoverable: true,
    },
  },
  {
    pattern: /too.*many.*requests|rate.*limit|429/i,
    error: {
      title: 'Slow Down, Explorer',
      message: "You're moving faster than our servers can keep up! We've hit a temporary limit.",
      suggestion: 'Wait a moment before trying again.',
      recoverable: true,
    },
  },

  // JSON/Data errors
  {
    pattern: /JSON|parsing|syntax.*error|unexpected.*token/i,
    error: {
      title: 'Data Mix-Up',
      message: "Something got scrambled in translation. This is usually a temporary glitch.",
      suggestion: 'Refresh the page and try again.',
      recoverable: true,
    },
  },

  // Validation errors
  {
    pattern: /validation|invalid|required.*field|missing/i,
    error: {
      title: 'Missing Details',
      message: "We need a bit more information to continue. Some required fields might be incomplete.",
      suggestion: 'Check your inputs and fill in any missing details.',
      recoverable: true,
    },
  },

  // Storage errors
  {
    pattern: /quota|storage|localStorage/i,
    error: {
      title: 'Storage Full',
      message: "Your browser's storage is getting full. This can happen with lots of saved routes.",
      suggestion: 'Try clearing some browser data or using a different device.',
      recoverable: false,
    },
  },
]

// Default error for unmatched patterns
const DEFAULT_ERROR: FriendlyError = {
  title: 'Unexpected Detour',
  message: "Something didn't go as planned. Don't worry, these things happen on the best journeys.",
  suggestion: 'Please try again or contact support if this persists.',
  recoverable: true,
}

/**
 * Convert a technical error to a user-friendly message
 */
export function getFriendlyError(error: Error | string | unknown): FriendlyError {
  const errorMessage = getErrorMessage(error)

  for (const { pattern, error: friendlyError } of ERROR_PATTERNS) {
    if (typeof pattern === 'string') {
      if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        return friendlyError
      }
    } else if (pattern.test(errorMessage)) {
      return friendlyError
    }
  }

  return DEFAULT_ERROR
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Unknown error'
}

/**
 * Get a simple friendly message string (for inline error displays)
 */
export function getSimpleFriendlyMessage(error: Error | string | unknown): string {
  const friendly = getFriendlyError(error)
  return friendly.message
}

/**
 * Check if an error is recoverable (can retry)
 */
export function isRecoverableError(error: Error | string | unknown): boolean {
  return getFriendlyError(error).recoverable
}

/**
 * Get an encouraging retry message based on attempt number
 */
export function getRetryMessage(attemptNumber: number): string {
  const messages = [
    "Let's try that again...",
    "Second time's the charm...",
    "Almost there, one more try...",
    "Persistence is a traveler's best trait...",
    "The road less traveled takes patience...",
  ]
  return messages[Math.min(attemptNumber - 1, messages.length - 1)]
}

/**
 * Travel-themed loading messages for long operations
 */
export const TRAVEL_LOADING_MESSAGES = [
  "Charting the perfect course...",
  "Discovering hidden gems...",
  "Consulting local experts...",
  "Finding the scenic routes...",
  "Mapping your adventure...",
  "Gathering insider tips...",
  "Planning memorable stops...",
  "Curating unique experiences...",
]

/**
 * Get a random travel loading message
 */
export function getRandomLoadingMessage(): string {
  return TRAVEL_LOADING_MESSAGES[Math.floor(Math.random() * TRAVEL_LOADING_MESSAGES.length)]
}
