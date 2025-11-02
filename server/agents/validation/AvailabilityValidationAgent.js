/**
 * Availability Validation Agent
 *
 * Validates if places are actually open/available at scheduled times
 * Provides intelligent rescheduling suggestions
 *
 * Agentic Capabilities:
 * - Time reasoning
 * - Schedule optimization
 * - Conflict detection
 * - Alternative suggestions
 */

class AvailabilityValidationAgent {
  constructor() {
    this.dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  /**
   * Check if a place is available at the scheduled time
   */
  async checkAvailability(place, scheduledDateTime) {
    const dayOfWeek = scheduledDateTime.getDay(); // 0 = Sunday
    const timeString = this.formatTime(scheduledDateTime);
    const dayName = this.dayNames[dayOfWeek];

    console.log(`  🕒 Checking "${place.verifiedName}" on ${dayName} at ${timeString}`);

    // No opening hours data
    if (!place.openingHours || place.openingHours.length === 0) {
      return {
        available: 'unknown',
        confidence: 0.3,
        reason: 'No opening hours data available',
        recommendation: 'Verify hours before visiting'
      };
    }

    // Check if place is permanently closed
    if (place.businessStatus === 'CLOSED_PERMANENTLY') {
      return {
        available: false,
        confidence: 1.0,
        reason: 'Place is permanently closed',
        recommendation: 'Remove from itinerary',
        critical: true
      };
    }

    // Check if place is temporarily closed
    if (place.businessStatus === 'CLOSED_TEMPORARILY') {
      return {
        available: false,
        confidence: 0.9,
        reason: 'Place is temporarily closed',
        recommendation: 'Find alternative or check back later',
        critical: true
      };
    }

    // Parse opening hours for the specific day
    const daySchedule = place.openingHours[dayOfWeek];

    if (!daySchedule) {
      return {
        available: 'unknown',
        confidence: 0.2,
        reason: 'No schedule for this day',
        recommendation: 'Verify hours before visiting'
      };
    }

    // Handle closed day
    if (daySchedule.toLowerCase().includes('closed')) {
      const alternatives = this.findAlternativeDays(place.openingHours, dayOfWeek);

      return {
        available: false,
        confidence: 0.95,
        reason: `Closed on ${dayName}`,
        recommendation: `Visit on ${alternatives.bestDay} instead`,
        alternatives,
        critical: true
      };
    }

    // Handle 24/7 operation
    if (daySchedule.toLowerCase().includes('open 24 hours') ||
        daySchedule.toLowerCase().includes('24 hours')) {
      return {
        available: true,
        confidence: 1.0,
        reason: 'Open 24 hours',
        recommendation: 'Visit anytime'
      };
    }

    // Parse time ranges
    const timeRanges = this.parseTimeRanges(daySchedule);

    if (timeRanges.length === 0) {
      return {
        available: 'unknown',
        confidence: 0.3,
        reason: 'Could not parse opening hours',
        recommendation: 'Verify hours before visiting',
        rawSchedule: daySchedule
      };
    }

    // Check if scheduled time falls within any opening period
    const isWithinHours = timeRanges.some(range =>
      timeString >= range.open && timeString <= range.close
    );

    if (isWithinHours) {
      const currentRange = timeRanges.find(range =>
        timeString >= range.open && timeString <= range.close
      );

      // Check if we're close to closing time
      const minutesUntilClose = this.minutesBetween(timeString, currentRange.close);

      if (minutesUntilClose < 30) {
        return {
          available: true,
          confidence: 0.7,
          reason: `Open but closes soon (${minutesUntilClose} min)`,
          recommendation: `Visit earlier or you may be rushed. Opens at ${currentRange.open}`,
          warning: 'Close to closing time'
        };
      }

      return {
        available: true,
        confidence: 0.95,
        reason: `Open ${currentRange.open} - ${currentRange.close}`,
        recommendation: 'Good timing!',
        openingHours: timeRanges
      };
    }

    // Not open at scheduled time - suggest alternatives
    const alternatives = this.suggestAlternativeTimes(
      timeRanges,
      timeString,
      scheduledDateTime
    );

    return {
      available: false,
      confidence: 0.9,
      reason: `Closed at ${timeString}. Opens at ${timeRanges[0].open}`,
      recommendation: `Reschedule to ${alternatives.suggested}`,
      alternatives,
      openingHours: timeRanges,
      critical: true
    };
  }

  /**
   * Batch check availability for multiple places
   */
  async batchCheckAvailability(placesWithSchedule) {
    console.log(`\n🕒 Batch checking availability for ${placesWithSchedule.length} places...`);

    const results = {
      available: [],
      unavailable: [],
      unknown: [],
      warnings: []
    };

    for (const item of placesWithSchedule) {
      const check = await this.checkAvailability(item.place, item.scheduledTime);

      const result = {
        place: item.place,
        scheduledTime: item.scheduledTime,
        check
      };

      if (check.available === true) {
        if (check.warning) {
          results.warnings.push(result);
        } else {
          results.available.push(result);
        }
      } else if (check.available === false) {
        results.unavailable.push(result);
      } else {
        results.unknown.push(result);
      }
    }

    console.log(`  ✓ Available: ${results.available.length}`);
    console.log(`  ⚠️  Warnings: ${results.warnings.length}`);
    console.log(`  ✗ Unavailable: ${results.unavailable.length}`);
    console.log(`  ? Unknown: ${results.unknown.length}`);

    return results;
  }

  /**
   * Parse time ranges from opening hours string
   * Handles formats like "Monday: 9:00 AM – 6:00 PM" or "9:00 AM – 1:00 PM, 2:00 PM – 6:00 PM"
   */
  parseTimeRanges(daySchedule) {
    const ranges = [];

    // Remove day name prefix
    const timesPart = daySchedule.replace(/^[A-Za-z]+:\s*/, '');

    // Match all time ranges
    const regex = /(\d+:\d+\s*[AP]M)\s*[–\-]\s*(\d+:\d+\s*[AP]M)/gi;
    let match;

    while ((match = regex.exec(timesPart)) !== null) {
      const [_, openTime, closeTime] = match;

      ranges.push({
        open: this.to24Hour(openTime),
        close: this.to24Hour(closeTime),
        openDisplay: openTime,
        closeDisplay: closeTime
      });
    }

    return ranges;
  }

  /**
   * Convert 12-hour time to 24-hour format
   */
  to24Hour(time12h) {
    const cleaned = time12h.trim().replace(/\s+/g, ' ');
    const [time, period] = cleaned.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period.toUpperCase() === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Format datetime to HH:MM
   */
  formatTime(datetime) {
    const hours = datetime.getHours().toString().padStart(2, '0');
    const minutes = datetime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Calculate minutes between two time strings
   */
  minutesBetween(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);

    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;

    return Math.abs(minutes2 - minutes1);
  }

  /**
   * Find alternative days when place is open
   */
  findAlternativeDays(openingHours, closedDay) {
    const openDays = [];

    openingHours.forEach((schedule, dayIndex) => {
      if (dayIndex !== closedDay &&
          !schedule.toLowerCase().includes('closed')) {
        openDays.push({
          day: this.dayNames[dayIndex],
          dayIndex,
          schedule
        });
      }
    });

    // Prefer next day or previous day
    const nextDay = openDays.find(d => d.dayIndex === (closedDay + 1) % 7);
    const prevDay = openDays.find(d => d.dayIndex === (closedDay - 1 + 7) % 7);

    return {
      openDays,
      bestDay: nextDay?.day || prevDay?.day || openDays[0]?.day || 'Unknown',
      allOpenDays: openDays.map(d => d.day)
    };
  }

  /**
   * Suggest alternative times on the same day
   */
  suggestAlternativeTimes(timeRanges, requestedTime, scheduledDate) {
    const alternatives = [];

    // Find next opening time
    for (const range of timeRanges) {
      if (requestedTime < range.open) {
        // Suggest opening time
        const suggestedDateTime = new Date(scheduledDate);
        const [hours, minutes] = range.open.split(':').map(Number);
        suggestedDateTime.setHours(hours, minutes, 0);

        alternatives.push({
          time: range.open,
          reason: 'Opening time',
          datetime: suggestedDateTime
        });
        break;
      }

      if (requestedTime > range.close) {
        // Try next range if available
        continue;
      }
    }

    // If no alternatives on same day, suggest next day
    if (alternatives.length === 0 && timeRanges.length > 0) {
      const firstRange = timeRanges[0];
      const nextDay = new Date(scheduledDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const [hours, minutes] = firstRange.open.split(':').map(Number);
      nextDay.setHours(hours, minutes, 0);

      alternatives.push({
        time: firstRange.open,
        reason: 'Next day opening time',
        datetime: nextDay
      });
    }

    return {
      suggested: alternatives[0]?.time || timeRanges[0]?.open || 'Unknown',
      options: alternatives
    };
  }

  /**
   * Generate a report of availability issues
   */
  generateAvailabilityReport(batchResults) {
    const report = {
      totalPlaces: 0,
      availableCount: 0,
      unavailableCount: 0,
      unknownCount: 0,
      warningCount: 0,
      criticalIssues: [],
      recommendations: []
    };

    report.totalPlaces = batchResults.available.length +
                        batchResults.unavailable.length +
                        batchResults.unknown.length +
                        batchResults.warnings.length;

    report.availableCount = batchResults.available.length;
    report.unavailableCount = batchResults.unavailable.length;
    report.unknownCount = batchResults.unknown.length;
    report.warningCount = batchResults.warnings.length;

    // Collect critical issues
    batchResults.unavailable.forEach(item => {
      if (item.check.critical) {
        report.criticalIssues.push({
          place: item.place.verifiedName,
          scheduledTime: item.scheduledTime,
          reason: item.check.reason,
          recommendation: item.check.recommendation
        });
      }
    });

    // Generate recommendations
    if (report.unavailableCount > 0) {
      report.recommendations.push({
        priority: 'high',
        message: `${report.unavailableCount} places are closed at scheduled times`,
        action: 'Reschedule or find alternatives'
      });
    }

    if (report.warningCount > 0) {
      report.recommendations.push({
        priority: 'medium',
        message: `${report.warningCount} places have timing warnings`,
        action: 'Review schedule for optimal timing'
      });
    }

    if (report.unknownCount > 0) {
      report.recommendations.push({
        priority: 'low',
        message: `${report.unknownCount} places have unverified hours`,
        action: 'Verify hours before visiting'
      });
    }

    return report;
  }
}

module.exports = AvailabilityValidationAgent;
