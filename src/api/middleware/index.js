/**
 * Middleware Index
 * Central export for all middleware
 */
module.exports = {
  errorHandler: require('./errorHandler'),
  requestLogger: require('./requestLogger')
};

