/**
 * Paginator
 * Helper for pagination calculations
 */
const { PAGINATION } = require('../constants');

class Paginator {
  /**
   * Parse pagination parameters from request
   */
  static parse(query) {
    const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Get SQL LIMIT and OFFSET
   */
  static toSQL(query) {
    const { limit, offset } = this.parse(query);
    return { limit, offset };
  }

  /**
   * Build pagination metadata
   */
  static buildMeta(page, limit, total) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  }
}

module.exports = Paginator;

