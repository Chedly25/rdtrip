/**
 * Central export for all error classes
 */
module.exports = {
  AppError: require('./AppError'),
  ValidationError: require('./ValidationError'),
  AuthenticationError: require('./AuthenticationError'),
  AuthorizationError: require('./AuthorizationError'),
  NotFoundError: require('./NotFoundError'),
  ConflictError: require('./ConflictError')
};

