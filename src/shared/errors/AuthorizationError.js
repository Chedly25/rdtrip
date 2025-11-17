const AppError = require('./AppError');

/**
 * Authorization Error
 * Thrown when user doesn't have permission
 */
class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

module.exports = AuthorizationError;

