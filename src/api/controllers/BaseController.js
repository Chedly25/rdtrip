/**
 * Base Controller
 * Abstract base class for all controllers
 * Provides common request handling
 */
const { ResponseBuilder } = require('../../shared/helpers');
const logger = require('../../core/logger');
const { AppError } = require('../../shared/errors');

class BaseController {
  constructor(controllerName) {
    this.controllerName = controllerName;
    this.logger = logger.child(`Controller:${controllerName}`);
  }

  /**
   * Wrap async route handlers to catch errors
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Send success response
   */
  success(res, data, message = 'Success', statusCode = 200) {
    return ResponseBuilder.success(res, data, message, statusCode);
  }

  /**
   * Send created response
   */
  created(res, data, message = 'Resource created successfully') {
    return ResponseBuilder.created(res, data, message);
  }

  /**
   * Send no content response
   */
  noContent(res) {
    return ResponseBuilder.noContent(res);
  }

  /**
   * Send paginated response
   */
  paginated(res, data, pagination, message = 'Success') {
    return ResponseBuilder.paginated(res, data, pagination, message);
  }

  /**
   * Send job response
   */
  job(res, jobId, message = 'Job started') {
    return ResponseBuilder.job(res, jobId, message);
  }

  /**
   * Extract user from request (set by auth middleware)
   */
  getUser(req) {
    return req.user;
  }

  /**
   * Get user ID from request
   */
  getUserId(req) {
    return req.user?.id;
  }

  /**
   * Validate request body has required fields
   */
  validateBody(req, requiredFields) {
    const missing = requiredFields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
    }
  }

  /**
   * Log controller action
   */
  logAction(req, action, metadata = {}) {
    this.logger.info(`${this.controllerName}: ${action}`, {
      userId: req.user?.id,
      ip: req.ip,
      ...metadata
    });
  }
}

module.exports = BaseController;

