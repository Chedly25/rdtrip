const AppError = require('./AppError');

/**
 * Authentication Error
 * Thrown when authentication fails
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

module.exports = AuthenticationError;

