/**
 * City Activity Agent V2 - Agentic Coordination Version
 *
 * This is the AGENTIC version that uses:
 * - SharedContext for memory and learning
 * - StrategicDiscoveryAgent for intelligent discovery
 * - OrchestratorAgent for Discovery → Validation → Selection loop
 * - Feedback loops when validation fails
 *
 * Flow per activity window:
 * 1. Build request from window context
 * 2. OrchestratorAgent.discoverAndSelectActivity()
 *    → Discovery: 3-5 candidates
 *    → Validation: All candidates
 *    → Selection: Best valid candidate
 *    → Feedback: If none valid, regenerate
 * 3. Update SharedContext with result
 * 4. Continue to next window
 */

const OrchestratorAgent = require('./core/OrchestratorAgent');
const { generateActivityUrls } = require('../utils/urlGenerator');

class CityActivityAgentV2 {
  constructor(routeData, dayStructure, progressCallback, db, itineraryId, sharedContext) {
    this.routeData = routeData;
    this.dayStructure = dayStructure;
    this.onProgress = progressCallback || (() => {});
    this.db = db;
    this.itineraryId = itineraryId;
    this.context = sharedContext;

    // Initialize orchestrator (the brain)
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    console.log(`🔑 CityActivityAgentV2: Google API Key = ${googleApiKey ? googleApiKey.substring(0, 10) + '...' : 'UNDEFINED'}`);
    this.orchestrator = new OrchestratorAgent(sharedContext, db, googleApiKey);

    console.log('🎯 CityActivityAgentV2: Agentic coordination enabled');
  }

  /**
   * Generate activities using agentic coordination
   */
  async generate() {
    console.log('\n🗺️  CityActivityAgentV2: Starting agentic activity generation...');
    console.log(`   Total days: ${this.dayStructure.days.length}`);

    const allActivities = [];
    let totalWindows = 0;
    let successfulWindows = 0;
    let failedWindows = 0;

    // Calculate total windows for progress tracking
    for (const day of this.dayStructure.days) {
      totalWindows += (day.activityWindows || []).length;
    }

    console.log(`   Total activity windows: ${totalWindows}`);

    let completedWindows = 0;

    // Process each day
    for (const day of this.dayStructure.days) {
      const city = this.extractMainCity(day.location);

      console.log(`\n📅 Day ${day.day}: ${day.location}`);
      console.log(`   Theme: ${day.theme}`);
      console.log(`   Windows: ${day.activityWindows?.length || 0}`);

      // Update shared context with current day
      this.context.setCurrentDay(day.day, city);

      const dayActivities = {
        day: day.day,
        date: day.date,
        city,
        activities: []
      };

      // Process each activity window
      for (const window of day.activityWindows || []) {
        completedWindows++;

        // Update progress
        this.onProgress({
          current: completedWindows,
          total: totalWindows,
          phase: 'discovering'
        });

        console.log(`\n   🕒 Window: ${window.start} - ${window.end} (${window.purpose})`);

        try {
          // Build request for orchestrator
          const request = this.buildActivityRequest(day, window, city);

          // AGENTIC MAGIC: Discovery → Validation → Selection with feedback loops
          const result = await this.orchestrator.discoverAndSelectActivity(request, 3);

          if (result.success) {
            // Successfully got an activity!
            const activity = result.activity;

            // Add URLs
            activity.urls = generateActivityUrls(activity, city);

            // Add metadata from result
            activity.confidence = result.confidence;
            activity.score = result.score;
            activity.reasoning = result.reasoning;
            activity.attempts = result.attempts;
            activity.alternatives = result.alternatives;

            dayActivities.activities.push(activity);
            successfulWindows++;

            console.log(`   ✅ Success: ${activity.name}`);
            console.log(`      Confidence: ${(result.confidence * 100).toFixed(0)}%`);
            console.log(`      Attempts: ${result.attempts}`);

          } else {
            // Failed to find valid activity after all attempts
            console.warn(`   ❌ Failed after ${result.attempts} attempts: ${result.reason}`);

            // Add fallback activity
            const fallback = this.createFallbackActivity(day, window, city);
            dayActivities.activities.push(fallback);
            failedWindows++;
          }

        } catch (error) {
          console.error(`   ❌ Error processing window:`, error.message);

          // Add fallback on error
          const fallback = this.createFallbackActivity(day, window, city);
          dayActivities.activities.push(fallback);
          failedWindows++;
        }
      }

      allActivities.push(dayActivities);
    }

    // Final summary
    console.log(`\n✅ Activity Generation Complete:`);
    console.log(`   Total windows: ${totalWindows}`);
    console.log(`   Successful: ${successfulWindows} (${(successfulWindows/totalWindows*100).toFixed(0)}%)`);
    console.log(`   Failed: ${failedWindows}`);

    // Log final statistics from shared context
    const stats = this.context.generateSummary();
    console.log(`\n📊 SharedContext Summary:`);
    console.log(`   Decisions made: ${stats.decisions.total}`);
    console.log(`   Valid places: ${stats.validatedPlaces}`);
    console.log(`   Invalid places: ${stats.invalidPlaces}`);
    console.log(`   Budget used: ${stats.budget.spent}€ / ${stats.budget.total || '∞'}€`);

    return allActivities;
  }

  /**
   * Build activity request for orchestrator
   */
  buildActivityRequest(day, window, city) {
    // Get day of week from date
    const date = new Date(day.date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

    return {
      type: 'activity',
      city: city,
      date: day.date,
      dayOfWeek: dayOfWeek,
      dayTheme: day.theme,
      timeWindow: {
        start: window.start,
        end: window.end
      },
      purpose: window.purpose,
      energyLevel: window.energyLevel || 'moderate',
      budget: this.context.getBudgetStatus().remaining,
      travelStyle: this.routeData.agent || 'best-overall'
    };
  }

  /**
   * Create fallback activity when all else fails
   */
  createFallbackActivity(day, window, city) {
    const fallback = {
      time: {
        start: window.start,
        end: window.end
      },
      name: `Explore ${city}`,
      type: 'general',
      description: `Discover ${city} at your own pace during this time window`,
      address: city,
      admission: 'Free',
      bookingNeeded: false,
      energyLevel: window.energyLevel || 'moderate',
      whyThisAgent: 'Fallback activity - flexible exploration time',
      practicalTips: 'Ask locals for recommendations',
      travelTimeFromPrevious: null,
      validationStatus: 'fallback',
      confidence: 0.3,
      reasoning: 'Fallback activity due to discovery/validation failures'
    };

    fallback.urls = generateActivityUrls(fallback, city);
    return fallback;
  }

  /**
   * Extract main city from location string
   */
  extractMainCity(location) {
    if (location.includes('→')) {
      return location.split('→').pop().trim();
    }
    return location;
  }
}

module.exports = CityActivityAgentV2;
