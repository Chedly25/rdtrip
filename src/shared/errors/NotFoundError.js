const AppError = require('./AppError');

/**
 * Not Found Error
 * Thrown when a resource is not found
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = '') {
    const message = id 
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, 404);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.id = id;
  }
}

module.exports = NotFoundError;

