/**
 * Base Service
 * Abstract base class for all services
 * Provides common service functionality
 */
const logger = require('../../core/logger');

class BaseService {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logger = logger.child(`Service:${serviceName}`);
  }

  /**
   * Validate required fields
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      const error = new Error(`Missing required fields: ${missing.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Sanitize data by removing undefined values
   */
  sanitize(data) {
    return Object.keys(data).reduce((acc, key) => {
      if (data[key] !== undefined) {
        acc[key] = data[key];
      }
      return acc;
    }, {});
  }

  /**
   * Log service action
   */
  logAction(action, metadata = {}) {
    this.logger.info(`${this.serviceName}: ${action}`, metadata);
  }

  /**
   * Handle service error
   */
  handleError(error, context = '') {
    this.logger.error(`${this.serviceName} error: ${context}`, error);
    throw error;
  }
}

module.exports = BaseService;

