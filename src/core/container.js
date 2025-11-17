/**
 * Dependency Injection Container
 * Simple service container for managing dependencies
 */
const logger = require('./logger').child('Container');

class Container {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  /**
   * Register a service
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that returns service instance
   * @param {boolean} singleton - Whether to create singleton (default: true)
   */
  register(name, factory, singleton = true) {
    if (this.services.has(name)) {
      logger.warn(`Service '${name}' is already registered. Overwriting.`);
    }

    this.services.set(name, {
      factory,
      singleton
    });

    logger.debug(`Registered service: ${name}`);
  }

  /**
   * Get service instance
   * @param {string} name - Service name
   */
  get(name) {
    // Check if singleton already created
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Get service config
    const service = this.services.get(name);
    
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }

    // Create instance
    const instance = service.factory(this);

    // Store singleton
    if (service.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if service exists
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
    logger.debug('Container cleared');
  }

  /**
   * Get all registered service names
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }
}

// Export singleton container
module.exports = new Container();

