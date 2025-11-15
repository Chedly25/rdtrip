/**
 * Replace Activity Tool
 * Replaces an activity in a specific day of the itinerary
 * Uses fuzzy matching to find activity by name
 */

const db = require('../../db/connection');

async function replaceActivity({ itineraryId, dayNumber, oldActivityName, newActivity }) {
  console.log(`🔄 [replaceActivity] Replacing "${oldActivityName}" with "${newActivity.name}" on Day ${dayNumber}`);

  try {
    // 1. Load current itinerary
    const result = await db.query(
      'SELECT id, itinerary_data FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Itinerary not found' };
    }

    const itineraryData = result.rows[0].itinerary_data;
    const days = itineraryData.days || [];

    // 2. Validate day number
    if (dayNumber < 1 || dayNumber > days.length) {
      return {
        success: false,
        error: `Day ${dayNumber} not found (itinerary has ${days.length} days)`
      };
    }

    const day = days[dayNumber - 1];
    const activities = day.activities || [];

    // 3. Find activity with fuzzy matching
    const activityIndex = activities.findIndex(a => {
      const aName = a.name?.toLowerCase() || '';
      const searchName = oldActivityName.toLowerCase();
      return aName.includes(searchName) || searchName.includes(aName);
    });

    if (activityIndex === -1) {
      return {
        success: false,
        error: `Activity "${oldActivityName}" not found in Day ${dayNumber}. Available activities: ${activities.map(a => a.name).join(', ')}`
      };
    }

    const oldActivity = activities[activityIndex];

    // 4. Replace activity (preserve block if present)
    activities[activityIndex] = {
      ...newActivity,
      block: oldActivity.block || newActivity.block || 'afternoon',
      addedAt: new Date().toISOString(),
      addedBy: 'agent',
      replaced: true
    };

    // 5. Update itinerary
    days[dayNumber - 1].activities = activities;
    itineraryData.days = days;

    await db.query(
      'UPDATE itineraries SET itinerary_data = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(itineraryData), itineraryId]
    );

    console.log(`✅ Replaced "${oldActivity.name}" with "${newActivity.name}" on Day ${dayNumber}`);

    return {
      success: true,
      message: `Replaced "${oldActivity.name}" with "${newActivity.name}" on Day ${dayNumber} (${day.city || 'Unknown city'})`,
      oldActivity: oldActivity.name,
      newActivity: newActivity.name,
      day: dayNumber,
      city: day.city
    };

  } catch (error) {
    console.error('❌ [replaceActivity] Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = replaceActivity;
