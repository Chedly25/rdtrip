/**
 * Analyze Day Feasibility Tool
 * Checks if a day's activities fit in available time with travel
 * Provides timeline and warnings for unrealistic schedules
 */

const db = require('../../db/connection');
const { getTravelTime } = require('../utils/googleMaps');

async function analyzeDayFeasibility({ itineraryId, dayNumber }) {
  console.log(`⏰ [analyzeDayFeasibility] Analyzing Day ${dayNumber} timeline`);

  try {
    const result = await db.query('SELECT id, itinerary_data FROM itineraries WHERE id = $1', [itineraryId]);
    if (result.rows.length === 0) return { success: false, error: 'Itinerary not found' };

    const itineraryData = result.rows[0].itinerary_data;
    const days = itineraryData.days || [];

    if (dayNumber < 1 || dayNumber > days.length) {
      return { success: false, error: `Day ${dayNumber} not found` };
    }

    const day = days[dayNumber - 1];
    const activities = day.activities || [];

    if (activities.length === 0) {
      return { success: false, error: 'No activities planned for this day' };
    }

    console.log(`📊 Analyzing ${activities.length} activities on Day ${dayNumber}...`);

    // Estimate activity durations (in minutes)
    const activityDurations = activities.map(a => estimateDuration(a));

    // Get travel times between consecutive activities (in seconds)
    const travelTimes = [];
    for (let i = 0; i < activities.length - 1; i++) {
      const from = activities[i].address || activities[i].name;
      const to = activities[i + 1].address || activities[i + 1].name;
      const timeSeconds = await getTravelTime(from, to);
      travelTimes.push(Math.round(timeSeconds / 60)); // Convert to minutes
    }

    // Calculate total time needed
    const activityTime = activityDurations.reduce((sum, d) => sum + d, 0);
    const travelTime = travelTimes.reduce((sum, t) => sum + t, 0);
    const mealTime = 180; // 3 meals × 60 minutes
    const bufferTime = activities.length * 15; // 15min buffer per activity
    const totalNeeded = activityTime + travelTime + mealTime + bufferTime;

    // Available time (9am-10pm = 13 hours = 780 minutes)
    const availableTime = 780;

    // Build detailed timeline
    const timeline = [];
    let currentTime = 540; // Start at 9:00am (540 minutes from midnight)

    for (let i = 0; i < activities.length; i++) {
      // Add activity to timeline
      timeline.push({
        time: formatTime(currentTime),
        type: 'activity',
        name: activities[i].name,
        duration: activityDurations[i],
        endTime: formatTime(currentTime + activityDurations[i])
      });
      currentTime += activityDurations[i];

      // Add travel time if not last activity
      if (i < activities.length - 1) {
        timeline.push({
          time: formatTime(currentTime),
          type: 'travel',
          name: `Travel to ${activities[i + 1].name}`,
          duration: travelTimes[i],
          endTime: formatTime(currentTime + travelTimes[i])
        });
        currentTime += travelTimes[i];
      }

      // Add meal breaks at appropriate times
      if (i === Math.floor(activities.length / 3)) {
        timeline.push({
          time: formatTime(currentTime),
          type: 'meal',
          name: 'Lunch break',
          duration: 60,
          endTime: formatTime(currentTime + 60)
        });
        currentTime += 60;
      }
    }

    // Generate warnings based on analysis
    const warnings = [];

    if (totalNeeded > availableTime) {
      const overageHours = Math.floor((totalNeeded - availableTime) / 60);
      const overageMinutes = (totalNeeded - availableTime) % 60;
      warnings.push({
        severity: 'high',
        message: `Day is too packed: needs ${formatDuration(totalNeeded)} but only ${formatDuration(availableTime)} available (${overageHours}h ${overageMinutes}m over)`
      });
    }

    if (activities.length > 5) {
      warnings.push({
        severity: 'medium',
        message: `Too many activities (${activities.length}) - consider reducing to 3-4 for a more relaxed pace`
      });
    }

    if (travelTime > 180) { // More than 3 hours travel
      warnings.push({
        severity: 'medium',
        message: `High travel time (${formatDuration(travelTime)}) - consider using optimizeRoute tool to reduce it`
      });
    }

    if (activities.length < 2) {
      warnings.push({
        severity: 'low',
        message: 'Day feels light - consider adding 1-2 more activities'
      });
    }

    // Determine overall feasibility
    const feasibility = totalNeeded <= availableTime ? 'feasible' :
                       totalNeeded <= availableTime * 1.1 ? 'tight' : 'too_packed';

    const endTime = formatTime(currentTime);
    const finishesAt = currentTime > 1320 ? 'late evening (after 10pm)' :
                       currentTime > 1200 ? 'evening' : 'afternoon';

    return {
      success: true,
      feasibility,
      day: dayNumber,
      city: day.city,
      summary: {
        totalNeeded: formatDuration(totalNeeded),
        available: formatDuration(availableTime),
        activities: formatDuration(activityTime),
        travel: formatDuration(travelTime),
        meals: formatDuration(mealTime),
        buffer: formatDuration(bufferTime),
        endTime,
        finishesAt
      },
      breakdown: {
        activityMinutes: activityTime,
        travelMinutes: travelTime,
        mealMinutes: mealTime,
        bufferMinutes: bufferTime,
        totalMinutes: totalNeeded
      },
      timeline,
      warnings,
      recommendation: getFeasibilityRecommendation(feasibility, warnings)
    };
  } catch (error) {
    console.error('❌ [analyzeDayFeasibility] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Estimate activity duration based on category
 * @param {Object} activity - Activity object
 * @returns {number} - Estimated duration in minutes
 */
function estimateDuration(activity) {
  const name = activity.name?.toLowerCase() || '';

  // Museums and galleries: 2 hours
  if (name.includes('museum') || name.includes('gallery') || name.includes('musée')) return 120;

  // Markets: 1.5 hours
  if (name.includes('market') || name.includes('marché')) return 90;

  // Parks and gardens: 1 hour
  if (name.includes('park') || name.includes('garden') || name.includes('jardin')) return 60;

  // Churches and cathedrals: 45 minutes
  if (name.includes('church') || name.includes('cathedral') || name.includes('cathédrale') ||
      name.includes('basilica') || name.includes('basilique')) return 45;

  // Viewpoints and lookouts: 30 minutes
  if (name.includes('viewpoint') || name.includes('lookout') || name.includes('belvedere')) return 30;

  // Restaurants (shouldn't be in activities, but just in case): 90 minutes
  if (name.includes('restaurant') || name.includes('cafe') || name.includes('café')) return 90;

  // Default: 90 minutes
  return 90;
}

/**
 * Format time from minutes since midnight to HH:MM
 * @param {number} minutes - Minutes since midnight
 * @returns {string} - Formatted time (e.g., "14:30")
 */
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Format duration in minutes to human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} - Formatted duration (e.g., "2h 30m")
 */
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Get feasibility recommendation based on analysis
 * @param {string} feasibility - Feasibility level
 * @param {Array} warnings - Array of warning objects
 * @returns {string} - Recommendation message
 */
function getFeasibilityRecommendation(feasibility, warnings) {
  if (feasibility === 'feasible' && warnings.length === 0) {
    return '✅ Perfect! This day has a comfortable, realistic pace.';
  }

  if (feasibility === 'feasible' && warnings.length > 0) {
    return '✅ Feasible, but could be improved. Check the warnings above for suggestions.';
  }

  if (feasibility === 'tight') {
    return '⚠️ Tight schedule - doable but leaves little flexibility. Consider removing one activity.';
  }

  return '❌ Too packed - this schedule is unrealistic. Remove 1-2 activities or spread them across multiple days.';
}

module.exports = analyzeDayFeasibility;
