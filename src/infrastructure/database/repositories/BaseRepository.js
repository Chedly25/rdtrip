/**
 * Base Repository
 * Abstract base class for all repositories
 * Provides common CRUD operations
 */
const { query, getClient } = require('../../../config/database');
const logger = require('../../../core/logger');
const { NotFoundError } = require('../../../shared/errors');

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.logger = logger.child(`Repository:${tableName}`);
  }

  /**
   * Find by ID
   */
  async findById(id, columns = '*') {
    try {
      const result = await query(
        `SELECT ${columns} FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Error finding ${this.tableName} by ID`, error);
      throw error;
    }
  }

  /**
   * Find by ID or throw error
   */
  async findByIdOrFail(id, columns = '*') {
    const result = await this.findById(id, columns);
    
    if (!result) {
      throw new NotFoundError(this.tableName, id);
    }
    
    return result;
  }

  /**
   * Find one by criteria
   */
  async findOne(criteria, columns = '*') {
    try {
      const { whereClause, values } = this.buildWhereClause(criteria);
      
      const result = await query(
        `SELECT ${columns} FROM ${this.tableName} ${whereClause} LIMIT 1`,
        values
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      this.logger.error(`Error finding one ${this.tableName}`, error);
      throw error;
    }
  }

  /**
   * Find all matching criteria
   */
  async findAll(criteria = {}, options = {}) {
    try {
      const { whereClause, values } = this.buildWhereClause(criteria);
      const orderClause = options.orderBy ? `ORDER BY ${options.orderBy}` : '';
      const limitClause = options.limit ? `LIMIT ${options.limit}` : '';
      const offsetClause = options.offset ? `OFFSET ${options.offset}` : '';
      
      const sql = `
        SELECT ${options.columns || '*'} 
        FROM ${this.tableName} 
        ${whereClause} 
        ${orderClause} 
        ${limitClause} 
        ${offsetClause}
      `;
      
      const result = await query(sql, values);
      return result.rows;
    } catch (error) {
      this.logger.error(`Error finding all ${this.tableName}`, error);
      throw error;
    }
  }

  /**
   * Count records matching criteria
   */
  async count(criteria = {}) {
    try {
      const { whereClause, values } = this.buildWhereClause(criteria);
      
      const result = await query(
        `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`,
        values
      );
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      this.logger.error(`Error counting ${this.tableName}`, error);
      throw error;
    }
  }

  /**
   * Create new record
   */
  async create(data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const result = await query(
        `INSERT INTO ${this.tableName} (${columns.join(', ')}) 
         VALUES (${placeholders}) 
         RETURNING *`,
        values
      );
      
      this.logger.info(`Created ${this.tableName}`, { id: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Error creating ${this.tableName}`, error);
      throw error;
    }
  }

  /**
   * Update by ID
   */
  async update(id, data) {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
      
      const result = await query(
        `UPDATE ${this.tableName} 
         SET ${setClause}, updated_at = NOW() 
         WHERE id = $${values.length + 1} 
         RETURNING *`,
        [...values, id]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError(this.tableName, id);
      }
      
      this.logger.info(`Updated ${this.tableName}`, { id });
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Error updating ${this.tableName}`, error);
      throw error;
    }
  }

  /**
   * Delete by ID
   */
  async delete(id) {
    try {
      const result = await query(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`,
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError(this.tableName, id);
      }
      
      this.logger.info(`Deleted ${this.tableName}`, { id });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting ${this.tableName}`, error);
      throw error;
    }
  }

  /**
   * Check if record exists
   */
  async exists(criteria) {
    const count = await this.count(criteria);
    return count > 0;
  }

  /**
   * Execute raw query
   */
  async raw(sql, params = []) {
    try {
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      this.logger.error('Error executing raw query', error);
      throw error;
    }
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    const client = await getClient();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }

  /**
   * Build WHERE clause from criteria object
   */
  buildWhereClause(criteria) {
    const keys = Object.keys(criteria);
    
    if (keys.length === 0) {
      return { whereClause: '', values: [] };
    }
    
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`);
    const values = Object.values(criteria);
    
    return {
      whereClause: `WHERE ${conditions.join(' AND ')}`,
      values
    };
  }
}

module.exports = BaseRepository;

