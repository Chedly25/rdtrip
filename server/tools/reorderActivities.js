/**
 * Reorder Activities Tool
 * Changes the order of activities within a day
 * Uses fuzzy matching to find activities by name
 */

const db = require('../../db/connection');

async function reorderActivities({ itineraryId, dayNumber, activityOrder }) {
  console.log(`🔀 [reorderActivities] Reordering Day ${dayNumber} activities`);

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

    // Reorder based on activity names provided
    const reordered = [];
    for (const name of activityOrder) {
      const activity = activities.find(a =>
        a.name?.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(a.name?.toLowerCase())
      );
      if (activity) reordered.push(activity);
    }

    // Add any activities not in the order list at the end
    for (const activity of activities) {
      if (!reordered.find(a => a.name === activity.name)) {
        reordered.push(activity);
      }
    }

    days[dayNumber - 1].activities = reordered;
    itineraryData.days = days;

    await db.query('UPDATE itineraries SET itinerary_data = $1, updated_at = NOW() WHERE id = $2',
                   [JSON.stringify(itineraryData), itineraryId]);

    console.log(`✅ Reordered ${reordered.length} activities on Day ${dayNumber}`);

    return {
      success: true,
      message: `Reordered activities on Day ${dayNumber}`,
      newOrder: reordered.map(a => a.name)
    };
  } catch (error) {
    console.error('❌ [reorderActivities] Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = reorderActivities;
