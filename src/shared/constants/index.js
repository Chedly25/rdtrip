/**
 * Central export for all constants
 */
module.exports = {
  HTTP_STATUS: require('./httpStatus'),
  
  // Job statuses
  JOB_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 300,        // 5 minutes
    MEDIUM: 1800,      // 30 minutes
    LONG: 3600,        // 1 hour
    DAY: 86400,        // 24 hours
    WEEK: 604800       // 7 days
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000,  // 15 minutes
    MAX_REQUESTS: 100
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // User roles
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  },

  // Route visibility
  ROUTE_VISIBILITY: {
    PRIVATE: 'private',
    PUBLIC: 'public',
    SHARED: 'shared'
  },

  // Collaboration roles
  COLLABORATION_ROLES: {
    OWNER: 'owner',
    EDITOR: 'editor',
    VIEWER: 'viewer'
  }
};

