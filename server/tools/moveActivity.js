/**
 * Move Activity Tool
 * Moves an activity from one day to another
 * Uses fuzzy matching to find activity by name
 */

const db = require('../../db/connection');

async function moveActivity({ itineraryId, activityName, fromDay, toDay, timeBlock }) {
  console.log(`📦 [moveActivity] Moving "${activityName}" from Day ${fromDay} to Day ${toDay}`);

  try {
    const result = await db.query('SELECT id, itinerary_data FROM itineraries WHERE id = $1', [itineraryId]);
    if (result.rows.length === 0) return { success: false, error: 'Itinerary not found' };

    const itineraryData = result.rows[0].itinerary_data;
    const days = itineraryData.days || [];

    // Validate days
    if (fromDay < 1 || fromDay > days.length || toDay < 1 || toDay > days.length) {
      return { success: false, error: `Invalid day numbers (trip has ${days.length} days)` };
    }

    // Find activity in fromDay
    const fromDayData = days[fromDay - 1];
    const activityIndex = (fromDayData.activities || []).findIndex(a => {
      const aName = a.name?.toLowerCase() || '';
      return aName.includes(activityName.toLowerCase()) || activityName.toLowerCase().includes(aName);
    });

    if (activityIndex === -1) {
      return { success: false, error: `Activity "${activityName}" not found in Day ${fromDay}` };
    }

    // Remove from fromDay
    const activity = fromDayData.activities.splice(activityIndex, 1)[0];

    // Add to toDay with new time block
    const toDayData = days[toDay - 1];
    if (!toDayData.activities) toDayData.activities = [];
    activity.block = timeBlock || activity.block || 'afternoon';
    activity.movedAt = new Date().toISOString();
    toDayData.activities.push(activity);

    // Save
    itineraryData.days = days;
    await db.query('UPDATE itineraries SET itinerary_data = $1, updated_at = NOW() WHERE id = $2',
                   [JSON.stringify(itineraryData), itineraryId]);

    console.log(`✅ Moved "${activity.name}" from Day ${fromDay} to Day ${toDay}`);

    return {
      success: true,
      message: `Moved "${activity.name}" from Day ${fromDay} (${fromDayData.city}) to Day ${toDay} (${toDayData.city}) - ${timeBlock || 'afternoon'}`,
      activity: activity.name,
      fromDay,
      toDay,
      timeBlock: activity.block
    };
  } catch (error) {
    console.error('❌ [moveActivity] Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = moveActivity;
