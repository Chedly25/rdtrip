/**
 * ProactiveAgentService - Background orchestrator for proactive AI features
 *
 * STEP 4 Phase 2: Complete with Weather, Events, and Budget Monitoring
 *
 * Responsibilities:
 * - Schedules and runs background monitoring jobs
 * - Coordinates WeatherMonitor, EventMonitor, BudgetMonitor, TrafficMonitor
 * - Manages job execution timing and error handling
 * - Logs monitoring activity for debugging
 *
 * Architecture:
 * - Runs every 6 hours (configurable via PROACTIVE_CHECK_INTERVAL_HOURS env var)
 * - Checks all active itineraries (trips within 30 days of start date)
 * - Delegates to specialized monitor services
 * - Handles graceful shutdown
 */

const pool = require('../db');
const WeatherMonitor = require('./WeatherMonitor');
const EventMonitor = require('./EventMonitor');
const BudgetMonitor = require('./BudgetMonitor');
const NotificationService = require('./NotificationService');

class ProactiveAgentService {
  constructor() {
    this.isRunning = false;
    this.intervalHandle = null;
    this.checkIntervalHours = parseInt(process.env.PROACTIVE_CHECK_INTERVAL_HOURS || '6', 10);

    // Initialize monitor services
    this.weatherMonitor = new WeatherMonitor();
    this.eventMonitor = new EventMonitor();
    this.budgetMonitor = new BudgetMonitor();
    this.notificationService = new NotificationService();

    console.log(`[ProactiveAgent] 🤖 Initialized with ${this.checkIntervalHours}h check interval`);
  }

  /**
   * Start the proactive monitoring service
   */
  async start() {
    if (this.isRunning) {
      console.log('[ProactiveAgent] ⚠️  Service already running');
      return;
    }

    this.isRunning = true;
    console.log('[ProactiveAgent] 🚀 Starting proactive monitoring service...');

    // Run immediately on startup
    await this.runMonitoringCycle();

    // Schedule periodic checks
    const intervalMs = this.checkIntervalHours * 60 * 60 * 1000;
    this.intervalHandle = setInterval(() => {
      this.runMonitoringCycle();
    }, intervalMs);

    console.log(`[ProactiveAgent] ✅ Service started - next check in ${this.checkIntervalHours} hours`);
  }

  /**
   * Stop the proactive monitoring service
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('[ProactiveAgent] 🛑 Stopping proactive monitoring service...');

    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }

    this.isRunning = false;
    console.log('[ProactiveAgent] ✅ Service stopped');
  }

  /**
   * Run a complete monitoring cycle for all active itineraries
   */
  async runMonitoringCycle() {
    const startTime = Date.now();
    console.log('[ProactiveAgent] 🔄 Starting monitoring cycle...');

    const stats = {
      itinerariesChecked: 0,
      weatherNotifications: 0,
      eventNotifications: 0,
      budgetNotifications: 0,
      errors: 0
    };

    try {
      // Get all active itineraries (trips starting within 30 days before/after today)
      const activeItineraries = await this.getActiveItineraries();
      console.log(`[ProactiveAgent] 📋 Found ${activeItineraries.length} active itineraries`);

      // Run all monitors for each itinerary
      for (const itinerary of activeItineraries) {
        try {
          stats.itinerariesChecked++;

          // Weather monitoring (Phase 1)
          const weatherNotifications = await this.weatherMonitor.checkItinerary(itinerary);
          stats.weatherNotifications += weatherNotifications;

          // Event discovery (Phase 2)
          const eventNotifications = await this.eventMonitor.checkItinerary(itinerary);
          stats.eventNotifications += eventNotifications;

          // Budget monitoring (Phase 2)
          const budgetNotifications = await this.budgetMonitor.checkItinerary(itinerary);
          stats.budgetNotifications += budgetNotifications;

          // TODO Phase 3: Traffic monitoring
          // const trafficNotifications = await this.trafficMonitor.checkItinerary(itinerary);

        } catch (error) {
          console.error(`[ProactiveAgent] ❌ Error checking itinerary ${itinerary.id}:`, error);
          stats.errors++;
        }
      }

      // Log monitoring cycle results
      const executionTimeMs = Date.now() - startTime;
      await this.logMonitoringCycle('complete', stats, executionTimeMs);

      console.log('[ProactiveAgent] ✅ Monitoring cycle complete:', {
        duration: `${executionTimeMs}ms`,
        ...stats
      });

    } catch (error) {
      console.error('[ProactiveAgent] ❌ Monitoring cycle failed:', error);

      const executionTimeMs = Date.now() - startTime;
      await this.logMonitoringCycle('error', { ...stats, errors: stats.errors + 1 }, executionTimeMs, error);
    }
  }

  /**
   * Get active itineraries that need monitoring
   * Returns itineraries for trips starting within 30 days (before/after today)
   */
  async getActiveItineraries() {
    const query = `
      SELECT
        i.id,
        i.route_id,
        i.trip_start_date,
        i.trip_end_date,
        i.days,
        i.route_data
      FROM itineraries i
      WHERE i.trip_start_date IS NOT NULL
        AND i.trip_start_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '30 days'
      ORDER BY i.trip_start_date ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Log monitoring cycle execution for debugging/analytics
   */
  async logMonitoringCycle(status, stats, executionTimeMs, error = null) {
    try {
      const query = `
        INSERT INTO proactive_monitoring_log (
          monitor_type,
          itineraries_checked,
          notifications_created,
          errors_encountered,
          execution_time_ms,
          error_details
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const totalNotifications =
        (stats.weatherNotifications || 0) +
        (stats.eventNotifications || 0) +
        (stats.budgetNotifications || 0);

      const errorDetails = error ? {
        message: error.message,
        stack: error.stack,
        status,
        breakdown: {
          weather: stats.weatherNotifications || 0,
          events: stats.eventNotifications || 0,
          budget: stats.budgetNotifications || 0
        }
      } : null;

      await pool.query(query, [
        'all_monitors', // Phase 2: Weather + Events + Budget
        stats.itinerariesChecked || 0,
        totalNotifications,
        stats.errors || 0,
        executionTimeMs,
        errorDetails ? JSON.stringify(errorDetails) : null
      ]);

    } catch (logError) {
      console.error('[ProactiveAgent] ⚠️  Failed to log monitoring cycle:', logError);
    }
  }

  /**
   * Manual trigger for testing (callable via API endpoint)
   */
  async triggerManualCheck(itineraryId = null) {
    console.log(`[ProactiveAgent] 🔧 Manual check triggered ${itineraryId ? `for itinerary ${itineraryId}` : 'for all itineraries'}`);

    if (itineraryId) {
      // Check specific itinerary
      const result = await pool.query(
        'SELECT * FROM itineraries WHERE id = $1',
        [itineraryId]
      );

      if (result.rows.length === 0) {
        throw new Error('Itinerary not found');
      }

      const itinerary = result.rows[0];

      const weatherNotifications = await this.weatherMonitor.checkItinerary(itinerary);
      const eventNotifications = await this.eventMonitor.checkItinerary(itinerary);
      const budgetNotifications = await this.budgetMonitor.checkItinerary(itinerary);

      return {
        itineraryId,
        notificationsCreated: {
          weather: weatherNotifications,
          events: eventNotifications,
          budget: budgetNotifications,
          total: weatherNotifications + eventNotifications + budgetNotifications
        },
        status: 'success'
      };

    } else {
      // Run full monitoring cycle
      await this.runMonitoringCycle();
      return { status: 'success' };
    }
  }

  /**
   * Get monitoring status (for health checks/dashboard)
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalHours: this.checkIntervalHours,
      nextCheckIn: this.intervalHandle ? `${this.checkIntervalHours} hours` : 'N/A',
      monitors: {
        weather: 'active',
        events: 'active',
        budget: 'active',
        traffic: 'planned'
      }
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new ProactiveAgentService();
    }
    return instance;
  },
  ProactiveAgentService
};
