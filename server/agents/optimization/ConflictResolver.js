/**
 * Conflict Resolver - Phase 3C
 *
 * Automatically resolves conflicts detected in itineraries through:
 * 1. Activity Regeneration - Replace conflicting activities with valid alternatives
 * 2. Timeline Adjustment - Shift activity times to eliminate overlaps
 * 3. Budget Optimization - Swap expensive activities for affordable alternatives
 * 4. Integration with OrchestratorAgent - Use agentic discovery for replacements
 *
 * Resolution Strategy:
 * - CRITICAL/HIGH conflicts → Regenerate activity with updated constraints
 * - MEDIUM conflicts → Attempt timeline adjustments
 * - LOW conflicts → Log warnings, no action needed
 */

class ConflictResolver {
  constructor(orchestratorAgent, sharedContext) {
    this.orchestrator = orchestratorAgent;
    this.context = sharedContext;

    // Resolution parameters
    this.MAX_RESOLUTION_ATTEMPTS = 2;
    this.TIMELINE_ADJUSTMENT_BUFFER = 15; // minutes
  }

  /**
   * Resolve all conflicts in a day's itinerary
   *
   * @param {Object} dayItinerary - { day, date, city, activities: [...] }
   * @param {Array} conflicts - Array of conflict objects from ConflictDetector
   * @param {Object} originalRequest - Original request context for regeneration
   * @returns {Object} { resolved: true/false, activities: [...], resolutions: [...] }
   */
  async resolveConflicts(dayItinerary, conflicts, originalRequest = {}) {
    console.log(`\n🔧 ConflictResolver: Resolving ${conflicts.length} conflicts for day ${dayItinerary.day}`);

    if (conflicts.length === 0) {
      console.log('   ✅ No conflicts to resolve');
      return {
        resolved: true,
        activities: dayItinerary.activities,
        resolutions: []
      };
    }

    // Categorize conflicts by severity
    const critical = conflicts.filter(c => c.severity === 'critical');
    const high = conflicts.filter(c => c.severity === 'high');
    const medium = conflicts.filter(c => c.severity === 'medium');
    const low = conflicts.filter(c => c.severity === 'low');

    console.log(`   Critical: ${critical.length}, High: ${high.length}, Medium: ${medium.length}, Low: ${low.length}`);

    let activities = [...dayItinerary.activities];
    const resolutions = [];

    // PRIORITY 1: Resolve CRITICAL conflicts (must fix)
    if (critical.length > 0) {
      console.log(`\n   🚨 Resolving ${critical.length} CRITICAL conflicts...`);
      const result = await this.resolveCriticalConflicts(
        activities,
        critical,
        dayItinerary,
        originalRequest
      );
      activities = result.activities;
      resolutions.push(...result.resolutions);
    }

    // PRIORITY 2: Resolve HIGH severity conflicts
    if (high.length > 0) {
      console.log(`\n   ⚠️  Resolving ${high.length} HIGH severity conflicts...`);
      const result = await this.resolveHighSeverityConflicts(
        activities,
        high,
        dayItinerary,
        originalRequest
      );
      activities = result.activities;
      resolutions.push(...result.resolutions);
    }

    // PRIORITY 3: Attempt MEDIUM conflict adjustments
    if (medium.length > 0) {
      console.log(`\n   ℹ️  Attempting ${medium.length} MEDIUM conflict adjustments...`);
      const result = this.resolveMediumConflicts(activities, medium);
      activities = result.activities;
      resolutions.push(...result.resolutions);
    }

    // LOG LOW severity conflicts (no action)
    if (low.length > 0) {
      console.log(`\n   📝 Logging ${low.length} LOW severity warnings (no action)`);
      resolutions.push({
        type: 'logged_warnings',
        count: low.length,
        conflicts: low
      });
    }

    // Summary
    const successfulResolutions = resolutions.filter(r => r.success).length;
    const failedResolutions = resolutions.filter(r => !r.success).length;

    console.log(`\n   ✅ Resolution complete: ${successfulResolutions} resolved, ${failedResolutions} failed`);

    return {
      resolved: failedResolutions === 0,
      activities,
      resolutions
    };
  }

  /**
   * Resolve CRITICAL conflicts (closed venues, insufficient travel time)
   * Strategy: REGENERATE the problematic activity with updated constraints
   */
  async resolveCriticalConflicts(activities, conflicts, dayItinerary, originalRequest) {
    const resolutions = [];
    let modifiedActivities = [...activities];

    for (const conflict of conflicts) {
      console.log(`\n      Resolving: ${conflict.type} - ${conflict.message}`);

      if (conflict.type === 'closed_all_day' ||
          conflict.type === 'before_opening' ||
          conflict.type === 'after_closing') {

        // AVAILABILITY CONFLICT - Regenerate activity
        const activityIdx = conflict.activities[0];
        const problematicActivity = modifiedActivities[activityIdx];

        try {
          // Build regeneration request with updated constraints
          const request = this.buildRegenerationRequest(
            problematicActivity,
            dayItinerary,
            originalRequest,
            {
              excludePlaces: [problematicActivity.name],
              requireAvailability: true,
              reason: `Original venue closed: ${conflict.message}`
            }
          );

          // Use orchestrator to find replacement
          const result = await this.orchestrator.discoverAndSelectActivity(request, 2);

          if (result.success) {
            // Replace activity
            modifiedActivities[activityIdx] = result.activity;

            resolutions.push({
              type: 'activity_regenerated',
              success: true,
              conflict: conflict.type,
              originalActivity: problematicActivity.name,
              newActivity: result.activity.name,
              reason: conflict.message
            });

            console.log(`      ✅ Replaced "${problematicActivity.name}" with "${result.activity.name}"`);

            // Update shared context
            if (this.context) {
              this.context.markPlaceInvalid(
                problematicActivity.name,
                `Closed at scheduled time: ${problematicActivity.time.start}`
              );
            }
          } else {
            resolutions.push({
              type: 'regeneration_failed',
              success: false,
              conflict: conflict.type,
              activity: problematicActivity.name,
              reason: result.reason
            });

            console.log(`      ❌ Failed to find replacement: ${result.reason}`);
          }

        } catch (error) {
          resolutions.push({
            type: 'resolution_error',
            success: false,
            conflict: conflict.type,
            error: error.message
          });

          console.error(`      ❌ Resolution error: ${error.message}`);
        }

      } else if (conflict.type === 'insufficient_travel_time') {

        // TRAVEL TIME CONFLICT - Try timeline adjustment first, regenerate if fails
        const [idx1, idx2] = conflict.activities;
        const activity1 = modifiedActivities[idx1];
        const activity2 = modifiedActivities[idx2];

        const { requiredTime, availableTime, shortfall } = conflict.details;

        // Can we shift times to make it work?
        if (this.canAdjustTimeline(modifiedActivities, idx2, shortfall)) {
          // Shift activity2 later
          modifiedActivities[idx2] = this.adjustActivityTime(activity2, shortfall);

          resolutions.push({
            type: 'timeline_adjusted',
            success: true,
            conflict: conflict.type,
            activities: [activity1.name, activity2.name],
            adjustment: `Shifted ${activity2.name} by ${shortfall}min`
          });

          console.log(`      ✅ Adjusted timeline: Shifted "${activity2.name}" by ${shortfall}min`);

        } else {
          // Can't adjust - regenerate activity2 with location constraint
          try {
            const request = this.buildRegenerationRequest(
              activity2,
              dayItinerary,
              originalRequest,
              {
                nearLocation: {
                  lat: activity1.placeDetails?.geometry?.location?.lat,
                  lng: activity1.placeDetails?.geometry?.location?.lng
                },
                maxDistanceKm: 2,
                reason: `Too far from previous activity (${requiredTime}min walk)`
              }
            );

            const result = await this.orchestrator.discoverAndSelectActivity(request, 2);

            if (result.success) {
              modifiedActivities[idx2] = result.activity;

              resolutions.push({
                type: 'activity_regenerated',
                success: true,
                conflict: conflict.type,
                originalActivity: activity2.name,
                newActivity: result.activity.name,
                reason: 'Replaced with nearby alternative'
              });

              console.log(`      ✅ Replaced "${activity2.name}" with nearby "${result.activity.name}"`);
            } else {
              resolutions.push({
                type: 'regeneration_failed',
                success: false,
                conflict: conflict.type,
                reason: result.reason
              });
            }

          } catch (error) {
            resolutions.push({
              type: 'resolution_error',
              success: false,
              error: error.message
            });
          }
        }
      }
    }

    return {
      activities: modifiedActivities,
      resolutions
    };
  }

  /**
   * Resolve HIGH severity conflicts
   * Similar to critical but lower priority
   */
  async resolveHighSeverityConflicts(activities, conflicts, dayItinerary, originalRequest) {
    const resolutions = [];
    let modifiedActivities = [...activities];

    for (const conflict of conflicts) {
      console.log(`      Resolving: ${conflict.type} - ${conflict.message}`);

      if (conflict.type === 'unrealistic_walk' || conflict.type === 'budget_exceeded') {
        // Try regeneration with updated constraints
        const activityIdx = conflict.activities[conflict.activities.length - 1];
        const problematicActivity = modifiedActivities[activityIdx];

        try {
          const request = this.buildRegenerationRequest(
            problematicActivity,
            dayItinerary,
            originalRequest,
            {
              excludePlaces: [problematicActivity.name],
              budgetConstraint: conflict.type === 'budget_exceeded' ? 'free_or_low_cost' : null,
              reason: conflict.message
            }
          );

          const result = await this.orchestrator.discoverAndSelectActivity(request, 2);

          if (result.success) {
            modifiedActivities[activityIdx] = result.activity;

            resolutions.push({
              type: 'activity_regenerated',
              success: true,
              conflict: conflict.type,
              originalActivity: problematicActivity.name,
              newActivity: result.activity.name
            });

            console.log(`      ✅ Replaced "${problematicActivity.name}" with "${result.activity.name}"`);
          } else {
            resolutions.push({
              type: 'regeneration_failed',
              success: false,
              conflict: conflict.type,
              reason: result.reason
            });
          }

        } catch (error) {
          resolutions.push({
            type: 'resolution_error',
            success: false,
            error: error.message
          });
        }
      }
    }

    return {
      activities: modifiedActivities,
      resolutions
    };
  }

  /**
   * Resolve MEDIUM conflicts (insufficient buffer, timeline overlaps)
   * Strategy: Timeline adjustments (shift times slightly)
   */
  resolveMediumConflicts(activities, conflicts) {
    const resolutions = [];
    let modifiedActivities = [...activities];

    for (const conflict of conflicts) {
      if (conflict.type === 'timeline_overlap' || conflict.type === 'insufficient_buffer') {
        const [idx1, idx2] = conflict.activities;
        const gap = conflict.details.gap;
        const neededBuffer = this.TIMELINE_ADJUSTMENT_BUFFER;
        const adjustment = neededBuffer - gap;

        if (this.canAdjustTimeline(modifiedActivities, idx2, adjustment)) {
          // Shift activity forward
          modifiedActivities[idx2] = this.adjustActivityTime(
            modifiedActivities[idx2],
            adjustment
          );

          resolutions.push({
            type: 'timeline_adjusted',
            success: true,
            conflict: conflict.type,
            adjustment: `${adjustment}min`
          });

          console.log(`      ✅ Adjusted timeline by ${adjustment}min`);
        } else {
          resolutions.push({
            type: 'adjustment_failed',
            success: false,
            conflict: conflict.type,
            reason: 'Cannot adjust without affecting subsequent activities'
          });
        }
      }
    }

    return {
      activities: modifiedActivities,
      resolutions
    };
  }

  /**
   * Build regeneration request with updated constraints
   */
  buildRegenerationRequest(activity, dayItinerary, originalRequest, constraints = {}) {
    return {
      type: 'activity',
      city: dayItinerary.city,
      date: dayItinerary.date,
      dayOfWeek: originalRequest.dayOfWeek || this.getDayOfWeek(dayItinerary.date),
      dayTheme: originalRequest.dayTheme || 'exploration',
      timeWindow: activity.time,
      purpose: activity.type || 'general',
      energyLevel: activity.energyLevel || 'moderate',
      budget: this.context ? this.context.getBudgetStatus().remaining : null,
      travelStyle: originalRequest.travelStyle || 'best-overall',

      // Additional constraints for regeneration
      excludePlaces: constraints.excludePlaces || [],
      requireAvailability: constraints.requireAvailability || true,
      budgetConstraint: constraints.budgetConstraint || null,
      nearLocation: constraints.nearLocation || null,
      maxDistanceKm: constraints.maxDistanceKm || null,
      regenerationReason: constraints.reason || 'Conflict resolution'
    };
  }

  /**
   * Check if timeline can be adjusted without cascading conflicts
   */
  canAdjustTimeline(activities, startIdx, minutesToShift) {
    if (startIdx >= activities.length - 1) {
      return true; // Last activity, no conflicts possible
    }

    // Check if shifting would cause conflict with next activity
    const current = activities[startIdx];
    const next = activities[startIdx + 1];

    const newEnd = this.shiftTime(current.time.end, minutesToShift);
    const nextStart = next.time.start;

    const newEndMinutes = this.parseTime(newEnd);
    const nextStartMinutes = this.parseTime(nextStart);

    return newEndMinutes <= nextStartMinutes - this.TIMELINE_ADJUSTMENT_BUFFER;
  }

  /**
   * Adjust activity time by specified minutes
   */
  adjustActivityTime(activity, minutes) {
    return {
      ...activity,
      time: {
        start: this.shiftTime(activity.time.start, minutes),
        end: this.shiftTime(activity.time.end, minutes)
      }
    };
  }

  /**
   * Shift time string by minutes
   */
  shiftTime(timeStr, minutes) {
    const totalMinutes = this.parseTime(timeStr) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Parse time to minutes
   */
  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get day of week from date string
   */
  getDayOfWeek(dateStr) {
    const date = new Date(dateStr);
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  }

  /**
   * Generate resolution report
   */
  generateReport(resolutionResult) {
    const { resolved, resolutions } = resolutionResult;

    const successful = resolutions.filter(r => r.success);
    const failed = resolutions.filter(r => !r.success);

    return {
      status: resolved ? 'fully_resolved' : 'partially_resolved',
      summary: `${successful.length} conflicts resolved, ${failed.length} unresolved`,
      resolutions: {
        successful: successful.length,
        failed: failed.length,
        details: resolutions
      }
    };
  }
}

module.exports = ConflictResolver;
