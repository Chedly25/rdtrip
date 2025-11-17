const AppError = require('./AppError');

/**
 * Conflict Error
 * Thrown when there's a conflict (e.g., duplicate resource)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

module.exports = ConflictError;

