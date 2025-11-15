/**
 * modifyItinerary - Modify Trip Itinerary
 *
 * Allows the agent to update activities, restaurants, or accommodations
 * in the user's itinerary based on their requests.
 *
 * UPDATED: Now uses JSONB schema (itinerary_data.days array)
 */

const db = require('../../db/connection');

/**
 * @param {Object} args
 * @param {string} args.itineraryId - Itinerary ID (not routeId)
 * @param {string} args.action - Action to perform: 'add_activity', 'remove_activity', 'update_activity', 'add_restaurant', 'remove_restaurant', 'update_accommodation'
 * @param {number} args.dayNumber - Which day to modify (1-based)
 * @param {Object} args.item - The item to add/update (activity, restaurant, etc.)
 * @param {string} [args.itemId] - ID of item to remove/update
 */
async function modifyItinerary({ itineraryId, action, dayNumber, item, itemId }) {
  try {
    console.log(`🔧 [modifyItinerary] ${action} on day ${dayNumber} for itinerary ${itineraryId.slice(0, 8)}...`);

    // Get current itinerary (NEW JSONB SCHEMA)
    const result = await db.query(
      'SELECT id, itinerary_data FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'No itinerary found. Please generate an itinerary first.'
      };
    }

    const itinerary = result.rows[0];
    const itineraryData = itinerary.itinerary_data || {};
    const days = itineraryData.days || [];

    // Validate day number
    if (dayNumber < 1 || dayNumber > days.length) {
      return {
        success: false,
        error: `Day ${dayNumber} not found (itinerary has ${days.length} days)`
      };
    }

    const day = days[dayNumber - 1];
    let modified = false;
    let message = '';

    // Perform the requested action
    switch (action) {
      case 'add_activity':
        if (!day.activities) {
          day.activities = [];
        }
        day.activities.push({
          id: `activity_${Date.now()}`,
          ...item,
          addedByAgent: true,
          addedAt: new Date().toISOString()
        });
        modified = true;
        message = `Added ${item.name || 'activity'} to day ${dayNumber} (${day.city || 'Unknown city'})`;
        break;

      case 'remove_activity':
        if (day.activities) {
          const originalLength = day.activities.length;
          day.activities = day.activities.filter(a => a.id !== itemId || a.name !== itemId);
          if (day.activities.length < originalLength) {
            modified = true;
            message = `Removed activity from day ${dayNumber}`;
          }
        }
        break;

      case 'update_activity':
        if (day.activities) {
          const activityIndex = day.activities.findIndex(a => a.id === itemId || a.name === itemId);
          if (activityIndex !== -1) {
            day.activities[activityIndex] = {
              ...day.activities[activityIndex],
              ...item,
              updatedByAgent: true,
              updatedAt: new Date().toISOString()
            };
            modified = true;
            message = `Updated activity on day ${dayNumber}`;
          }
        }
        break;

      case 'add_restaurant':
        if (!day.restaurants) {
          day.restaurants = { breakfast: [], lunch: [], dinner: [] };
        }
        const mealType = item.meal || item.mealType || 'lunch';
        if (!day.restaurants[mealType]) {
          day.restaurants[mealType] = [];
        }
        day.restaurants[mealType].push({
          id: `restaurant_${Date.now()}`,
          ...item,
          meal: mealType,
          addedByAgent: true,
          addedAt: new Date().toISOString()
        });
        modified = true;
        message = `Added ${item.name || 'restaurant'} for ${mealType} on day ${dayNumber}`;
        break;

      case 'remove_restaurant':
        if (day.restaurants) {
          const mealType = item.meal || item.mealType || 'lunch';
          if (day.restaurants[mealType]) {
            const originalLength = day.restaurants[mealType].length;
            day.restaurants[mealType] = day.restaurants[mealType].filter(r => r.id !== itemId || r.name !== itemId);
            if (day.restaurants[mealType].length < originalLength) {
              modified = true;
              message = `Removed restaurant from ${mealType} on day ${dayNumber}`;
            }
          }
        }
        break;

      case 'update_accommodation':
        day.accommodation = {
          id: `hotel_${Date.now()}`,
          ...item,
          addedByAgent: true,
          addedAt: new Date().toISOString()
        };
        modified = true;
        message = `Updated accommodation for day ${dayNumber} to ${item.name || 'new hotel'}`;
        break;

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }

    if (!modified) {
      return {
        success: false,
        error: 'No changes were made. Item may not exist.'
      };
    }

    // Update the day in the days array
    days[dayNumber - 1] = day;
    itineraryData.days = days;

    // Update database with new JSONB structure
    await db.query(
      'UPDATE itineraries SET itinerary_data = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(itineraryData), itinerary.id]
    );

    console.log(`✅ [modifyItinerary] ${message}`);

    return {
      success: true,
      message,
      action,
      dayNumber,
      city: day.city,
      modifiedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ [modifyItinerary] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to modify itinerary'
    };
  }
}

module.exports = modifyItinerary;
