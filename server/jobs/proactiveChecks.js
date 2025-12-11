/**
 * Proactive Checks Job
 *
 * Phase 5: Proactive Agent Behavior
 *
 * Scheduled job that runs periodically to check for proactive triggers.
 * Can be run via cron, Heroku Scheduler, or other job runners.
 *
 * Usage:
 *   - Direct: node server/jobs/proactiveChecks.js
 *   - Via npm: npm run proactive-checks
 *   - Via Heroku Scheduler: node server/jobs/proactiveChecks.js
 */

const ProactiveAgent = require('../services/ProactiveAgent');

// Database connection
const db = require('../../db');

async function runProactiveChecks() {
  console.log('===========================================');
  console.log('[ProactiveChecks] Starting proactive checks');
  console.log('===========================================');
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    // Initialize proactive agent
    const proactiveAgent = new ProactiveAgent(db);

    // Run all trigger checks
    const result = await proactiveAgent.checkAllTriggers();

    if (result.success) {
      console.log(`[ProactiveChecks] Successfully processed ${result.triggersProcessed} triggers`);
    } else {
      console.error('[ProactiveChecks] Error:', result.error);
    }

    console.log('===========================================');
    console.log('[ProactiveChecks] Completed');
    console.log('===========================================');

    return result;
  } catch (error) {
    console.error('[ProactiveChecks] Fatal error:', error);
    throw error;
  }
}

// If running directly (not imported)
if (require.main === module) {
  runProactiveChecks()
    .then(result => {
      console.log('Job result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Job failed:', error);
      process.exit(1);
    });
}

module.exports = runProactiveChecks;
