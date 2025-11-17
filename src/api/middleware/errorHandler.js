/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */
const logger = require('../../core/logger').child('ErrorHandler');
const { AppError } = require('../../shared/errors');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Handle different error types
 */
function handleError(error) {
  // AppError (our custom errors)
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors,
      isOperational: error.isOperational
    };
  }

  // PostgreSQL errors
  if (error.code) {
    return handleDatabaseError(error);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Invalid token',
      isOperational: true
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Token expired',
      isOperational: true
    };
  }

  // Default: Internal Server Error
  return {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    isOperational: false
  };
}

/**
 * Handle PostgreSQL specific errors
 */
function handleDatabaseError(error) {
  const errorMap = {
    '23505': { // Unique violation
      statusCode: HTTP_STATUS.CONFLICT,
      message: 'Resource already exists',
      isOperational: true
    },
    '23503': { // Foreign key violation
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Referenced resource does not exist',
      isOperational: true
    },
    '23502': { // Not null violation
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Required field is missing',
      isOperational: true
    },
    '22P02': { // Invalid text representation
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Invalid data format',
      isOperational: true
    }
  };

  return errorMap[error.code] || {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Database error occurred',
    isOperational: false
  };
}

/**
 * Main error handler middleware
 */
function errorHandler(error, req, res, next) {
  const { statusCode, message, errors, isOperational } = handleError(error);

  // Log error
  if (!isOperational || statusCode >= 500) {
    logger.error('Error occurred', {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      statusCode
    });
  } else {
    logger.warn('Operational error', {
      message: error.message,
      path: req.path,
      method: req.method,
      statusCode
    });
  }

  // Send response
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  // Add errors array if validation error
  if (errors) {
    response.errors = errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.originalError = error.message;
  }

  res.status(statusCode).json(response);
}

/**
 * Handle 404 - Route not found
 */
function notFoundHandler(req, res) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};

