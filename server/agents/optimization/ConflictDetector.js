/**
 * Conflict Detector - Phase 3A
 *
 * Detects all types of conflicts in generated itineraries:
 * 1. Timeline Conflicts - Overlapping activity windows
 * 2. Availability Conflicts - Venues closed at scheduled times
 * 3. Geographic Conflicts - Unrealistic travel times between activities
 * 4. Budget Conflicts - Total cost exceeds user's budget
 *
 * Returns structured conflict objects for resolution
 */

class ConflictDetector {
  constructor(googlePlacesService, sharedContext) {
    this.googlePlacesService = googlePlacesService;
    this.context = sharedContext;

    // Conflict thresholds
    this.UNREALISTIC_WALK_TIME = 30; // minutes
    this.BUFFER_TIME = 10; // minutes buffer between activities
  }

  /**
   * Detect all conflicts in a complete day's itinerary
   *
   * @param {Object} dayItinerary - { day, date, city, activities: [...] }
   * @param {number} userBudget - User's total budget
   * @returns {Array} Array of conflict objects
   */
  async detectAllConflicts(dayItinerary, userBudget = null) {
    console.log(`\n🔍 ConflictDetector: Analyzing day ${dayItinerary.day} (${dayItinerary.city})`);

    const conflicts = [];
    const activities = dayItinerary.activities || [];

    if (activities.length === 0) {
      console.log('   ℹ️  No activities to analyze');
      return conflicts;
    }

    // 1. TIMELINE CONFLICTS
    const timelineConflicts = this.detectTimelineConflicts(activities);
    conflicts.push(...timelineConflicts);

    // 2. AVAILABILITY CONFLICTS
    const availabilityConflicts = await this.detectAvailabilityConflicts(
      activities,
      dayItinerary.date,
      dayItinerary.city
    );
    conflicts.push(...availabilityConflicts);

    // 3. GEOGRAPHIC CONFLICTS
    const geographicConflicts = await this.detectGeographicConflicts(
      activities,
      dayItinerary.city
    );
    conflicts.push(...geographicConflicts);

    // 4. BUDGET CONFLICTS
    if (userBudget !== null) {
      const budgetConflicts = this.detectBudgetConflicts(activities, userBudget);
      conflicts.push(...budgetConflicts);
    }

    // Summary
    console.log(`   Found ${conflicts.length} total conflicts:`);
    const byType = this.groupConflictsByType(conflicts);
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    return conflicts;
  }

  /**
   * Detect timeline conflicts (overlapping activity windows)
   */
  detectTimelineConflicts(activities) {
    console.log(`   Checking timeline conflicts...`);
    const conflicts = [];

    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i];
      const next = activities[i + 1];

      const currentEnd = this.parseTime(current.time.end);
      const nextStart = this.parseTime(next.time.start);

      // Check for overlap or insufficient buffer
      const gap = nextStart - currentEnd; // minutes

      if (gap < 0) {
        // OVERLAP
        conflicts.push({
          type: 'timeline_overlap',
          severity: 'high',
          activities: [i, i + 1],
          message: `Activity ${i + 1} overlaps with Activity ${i}`,
          details: {
            activity1: { name: current.name, end: current.time.end },
            activity2: { name: next.name, start: next.time.start },
            overlap: Math.abs(gap)
          }
        });
      } else if (gap < this.BUFFER_TIME) {
        // INSUFFICIENT BUFFER
        conflicts.push({
          type: 'insufficient_buffer',
          severity: 'medium',
          activities: [i, i + 1],
          message: `Only ${gap}min between activities (recommended: ${this.BUFFER_TIME}min)`,
          details: {
            activity1: { name: current.name, end: current.time.end },
            activity2: { name: next.name, start: next.time.start },
            gap
          }
        });
      }
    }

    console.log(`      → ${conflicts.length} timeline conflicts`);
    return conflicts;
  }

  /**
   * Detect availability conflicts (venues closed at scheduled times)
   */
  async detectAvailabilityConflicts(activities, date, city) {
    console.log(`   Checking availability conflicts...`);
    const conflicts = [];

    // Parse date to get day of week
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];

      // Skip fallback activities or activities without validation
      if (!activity.placeDetails || activity.validationStatus === 'fallback') {
        continue;
      }

      const placeDetails = activity.placeDetails;
      const scheduledStart = this.parseTime(activity.time.start);

      // Check if place has opening hours
      if (!placeDetails.opening_hours || !placeDetails.opening_hours.periods) {
        // No opening hours data - could be always open or data unavailable
        // Add low-severity warning
        conflicts.push({
          type: 'missing_hours_data',
          severity: 'low',
          activities: [i],
          message: `No opening hours data for "${activity.name}"`,
          details: {
            activity: { name: activity.name, time: activity.time.start },
            recommendation: 'Verify hours manually or assume open'
          }
        });
        continue;
      }

      // Get opening hours for the scheduled day
      const hours = placeDetails.opening_hours.periods;
      const dayHours = hours.find(period => period.open.day === dayOfWeek);

      if (!dayHours) {
        // CLOSED ALL DAY
        conflicts.push({
          type: 'closed_all_day',
          severity: 'critical',
          activities: [i],
          message: `"${activity.name}" is closed on this day`,
          details: {
            activity: { name: activity.name, scheduledTime: activity.time },
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
          }
        });
        continue;
      }

      // Check if scheduled time falls within opening hours
      const openTime = this.convertToMinutes(dayHours.open.time);
      const closeTime = dayHours.close
        ? this.convertToMinutes(dayHours.close.time)
        : 1440; // Assume closes at midnight if not specified

      if (scheduledStart < openTime) {
        // SCHEDULED BEFORE OPENING
        conflicts.push({
          type: 'before_opening',
          severity: 'high',
          activities: [i],
          message: `"${activity.name}" opens at ${this.formatTime(openTime)}, scheduled at ${activity.time.start}`,
          details: {
            activity: { name: activity.name, scheduledTime: activity.time.start },
            openingTime: this.formatTime(openTime),
            minutesBeforeOpening: openTime - scheduledStart
          }
        });
      } else if (scheduledStart > closeTime) {
        // SCHEDULED AFTER CLOSING
        conflicts.push({
          type: 'after_closing',
          severity: 'high',
          activities: [i],
          message: `"${activity.name}" closes at ${this.formatTime(closeTime)}, scheduled at ${activity.time.start}`,
          details: {
            activity: { name: activity.name, scheduledTime: activity.time.start },
            closingTime: this.formatTime(closeTime),
            minutesAfterClosing: scheduledStart - closeTime
          }
        });
      }
    }

    console.log(`      → ${conflicts.length} availability conflicts`);
    return conflicts;
  }

  /**
   * Detect geographic conflicts (unrealistic travel times)
   */
  async detectGeographicConflicts(activities, city) {
    console.log(`   Checking geographic conflicts...`);
    const conflicts = [];

    // Get coordinates for all activities
    const coords = activities.map(a => ({
      lat: a.placeDetails?.geometry?.location?.lat || null,
      lng: a.placeDetails?.geometry?.location?.lng || null
    }));

    // Check each consecutive pair
    for (let i = 0; i < activities.length - 1; i++) {
      const current = activities[i];
      const next = activities[i + 1];

      // Skip if either activity lacks coordinates
      if (!coords[i].lat || !coords[i + 1].lat) {
        continue;
      }

      // Calculate available time for travel
      const currentEnd = this.parseTime(current.time.end);
      const nextStart = this.parseTime(next.time.start);
      const availableTime = nextStart - currentEnd;

      try {
        // Get actual travel time from Google Distance Matrix
        const travelData = await this.googlePlacesService.getDistanceMatrix(
          `${coords[i].lat},${coords[i].lng}`,
          `${coords[i + 1].lat},${coords[i + 1].lng}`,
          'walking'
        );

        if (travelData && travelData.duration) {
          const requiredTime = Math.ceil(travelData.duration / 60); // Convert seconds to minutes

          if (requiredTime > this.UNREALISTIC_WALK_TIME) {
            // UNREALISTIC WALKING DISTANCE
            conflicts.push({
              type: 'unrealistic_walk',
              severity: 'high',
              activities: [i, i + 1],
              message: `${requiredTime}min walk between activities (threshold: ${this.UNREALISTIC_WALK_TIME}min)`,
              details: {
                from: { name: current.name, location: coords[i] },
                to: { name: next.name, location: coords[i + 1] },
                walkTime: requiredTime,
                distance: Math.round(travelData.distance / 1000 * 10) / 10, // km
                availableTime
              }
            });
          } else if (requiredTime > availableTime) {
            // INSUFFICIENT TIME FOR TRAVEL
            conflicts.push({
              type: 'insufficient_travel_time',
              severity: 'critical',
              activities: [i, i + 1],
              message: `Need ${requiredTime}min to travel, only ${availableTime}min available`,
              details: {
                from: { name: current.name, location: coords[i] },
                to: { name: next.name, location: coords[i + 1] },
                requiredTime,
                availableTime,
                shortfall: requiredTime - availableTime
              }
            });
          }
        }
      } catch (error) {
        console.warn(`      ⚠️  Failed to get travel time: ${error.message}`);
      }
    }

    console.log(`      → ${conflicts.length} geographic conflicts`);
    return conflicts;
  }

  /**
   * Detect budget conflicts (exceeding user's budget)
   */
  detectBudgetConflicts(activities, userBudget) {
    console.log(`   Checking budget conflicts...`);
    const conflicts = [];

    // Calculate total cost
    let totalCost = 0;
    const costBreakdown = [];

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const cost = this.extractCost(activity.admission);

      if (cost > 0) {
        totalCost += cost;
        costBreakdown.push({
          activity: activity.name,
          cost
        });
      }
    }

    // Get budget from context if available
    const budgetStatus = this.context ? this.context.getBudgetStatus() : null;
    const effectiveBudget = budgetStatus?.total || userBudget;

    if (totalCost > effectiveBudget) {
      // BUDGET EXCEEDED
      conflicts.push({
        type: 'budget_exceeded',
        severity: 'high',
        activities: activities.map((_, i) => i), // All activities involved
        message: `Total cost €${totalCost} exceeds budget €${effectiveBudget}`,
        details: {
          totalCost,
          budget: effectiveBudget,
          overage: totalCost - effectiveBudget,
          breakdown: costBreakdown
        }
      });
    } else if (totalCost > effectiveBudget * 0.8) {
      // APPROACHING BUDGET LIMIT
      conflicts.push({
        type: 'budget_warning',
        severity: 'low',
        activities: activities.map((_, i) => i),
        message: `Using ${Math.round(totalCost/effectiveBudget*100)}% of budget`,
        details: {
          totalCost,
          budget: effectiveBudget,
          percentage: Math.round(totalCost/effectiveBudget*100),
          remaining: effectiveBudget - totalCost
        }
      });
    }

    console.log(`      → ${conflicts.length} budget conflicts`);
    return conflicts;
  }

  /**
   * Helper: Parse time string to minutes since midnight
   */
  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Helper: Convert Google API time format (e.g., "0900") to minutes
   */
  convertToMinutes(timeStr) {
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));
    return hours * 60 + minutes;
  }

  /**
   * Helper: Format minutes to HH:MM
   */
  formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Helper: Extract numeric cost from admission string
   */
  extractCost(admission) {
    if (!admission || typeof admission !== 'string') return 0;

    const normalized = admission.toLowerCase();
    if (normalized.includes('free') || normalized.includes('gratuit')) return 0;

    // Extract number (e.g., "€15", "15€", "$15")
    const match = normalized.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Helper: Group conflicts by type for summary
   */
  groupConflictsByType(conflicts) {
    const grouped = {};
    conflicts.forEach(conflict => {
      const type = conflict.type;
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Get conflicts by severity
   */
  getConflictsBySeverity(conflicts, severity) {
    return conflicts.filter(c => c.severity === severity);
  }

  /**
   * Check if itinerary has critical conflicts
   */
  hasCriticalConflicts(conflicts) {
    return conflicts.some(c => c.severity === 'critical' || c.severity === 'high');
  }
}

module.exports = ConflictDetector;
