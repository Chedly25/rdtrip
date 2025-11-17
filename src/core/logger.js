/**
 * Logger Utility
 * Centralized logging with different levels and formatting
 */
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const COLORS = {
  ERROR: '\x1b[31m',   // Red
  WARN: '\x1b[33m',    // Yellow
  INFO: '\x1b[36m',    // Cyan
  DEBUG: '\x1b[35m',   // Magenta
  RESET: '\x1b[0m'
};

class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Format log message with timestamp and context
   */
  format(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = COLORS[level] || COLORS.RESET;
    
    if (this.isProduction) {
      // Production: JSON format for log aggregation
      return JSON.stringify({
        timestamp,
        level,
        context: this.context,
        message,
        ...meta
      });
    } else {
      // Development: Colored, readable format
      const metaStr = Object.keys(meta).length > 0 
        ? `\n${JSON.stringify(meta, null, 2)}` 
        : '';
      return `${color}[${timestamp}] [${level}] [${this.context}]${COLORS.RESET} ${message}${metaStr}`;
    }
  }

  /**
   * Log error level message
   */
  error(message, error = null) {
    const meta = {};
    if (error) {
      meta.error = {
        message: error.message,
        stack: error.stack,
        ...(error.isOperational !== undefined && { isOperational: error.isOperational })
      };
    }
    console.error(this.format(LOG_LEVELS.ERROR, message, meta));
  }

  /**
   * Log warning level message
   */
  warn(message, meta = {}) {
    console.warn(this.format(LOG_LEVELS.WARN, message, meta));
  }

  /**
   * Log info level message
   */
  info(message, meta = {}) {
    console.log(this.format(LOG_LEVELS.INFO, message, meta));
  }

  /**
   * Log debug level message (only in development)
   */
  debug(message, meta = {}) {
    if (!this.isProduction) {
      console.log(this.format(LOG_LEVELS.DEBUG, message, meta));
    }
  }

  /**
   * Create a child logger with new context
   */
  child(childContext) {
    return new Logger(`${this.context}:${childContext}`);
  }
}

// Export singleton instance
module.exports = new Logger('RdTrip');

