/**
 * modifyItinerary - Modify Trip Itinerary
 *
 * Allows the agent to update activities, restaurants, or accommodations
 * in the user's itinerary based on their requests.
 */

const db = require('../../db/connection');

/**
 * @param {Object} args
 * @param {string} args.routeId - Route/itinerary ID
 * @param {string} args.action - Action to perform: 'add_activity', 'remove_activity', 'update_activity', 'add_restaurant', 'remove_restaurant', 'update_accommodation'
 * @param {number} args.dayNumber - Which day to modify (1-based)
 * @param {Object} args.item - The item to add/update (activity, restaurant, etc.)
 * @param {string} [args.itemId] - ID of item to remove/update
 */
async function modifyItinerary({ routeId, action, dayNumber, item, itemId }) {
  try {
    console.log(`🔧 Modifying itinerary: ${action} on day ${dayNumber} for route ${routeId.slice(0, 8)}...`);

    // Get current itinerary
    const result = await db.query(
      'SELECT id, day_structure, activities, restaurants, accommodations FROM itineraries WHERE route_id = $1 ORDER BY created_at DESC LIMIT 1',
      [routeId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'No itinerary found for this route. Please generate an itinerary first.'
      };
    }

    const itinerary = result.rows[0];
    let dayStructure = itinerary.day_structure || [];
    let activities = itinerary.activities || {};
    let restaurants = itinerary.restaurants || {};
    let accommodations = itinerary.accommodations || {};

    let modified = false;
    let message = '';

    // Perform the requested action
    switch (action) {
      case 'add_activity':
        if (!activities[`day${dayNumber}`]) {
          activities[`day${dayNumber}`] = [];
        }
        activities[`day${dayNumber}`].push({
          id: `activity_${Date.now()}`,
          ...item,
          addedByAgent: true
        });
        modified = true;
        message = `Added ${item.name || 'activity'} to day ${dayNumber}`;
        break;

      case 'remove_activity':
        if (activities[`day${dayNumber}`]) {
          const originalLength = activities[`day${dayNumber}`].length;
          activities[`day${dayNumber}`] = activities[`day${dayNumber}`].filter(a => a.id !== itemId);
          if (activities[`day${dayNumber}`].length < originalLength) {
            modified = true;
            message = `Removed activity from day ${dayNumber}`;
          }
        }
        break;

      case 'update_activity':
        if (activities[`day${dayNumber}`]) {
          const activityIndex = activities[`day${dayNumber}`].findIndex(a => a.id === itemId);
          if (activityIndex !== -1) {
            activities[`day${dayNumber}`][activityIndex] = {
              ...activities[`day${dayNumber}`][activityIndex],
              ...item
            };
            modified = true;
            message = `Updated activity on day ${dayNumber}`;
          }
        }
        break;

      case 'add_restaurant':
        if (!restaurants[`day${dayNumber}`]) {
          restaurants[`day${dayNumber}`] = { breakfast: [], lunch: [], dinner: [] };
        }
        const mealType = item.mealType || 'lunch';
        restaurants[`day${dayNumber}`][mealType].push({
          id: `restaurant_${Date.now()}`,
          ...item,
          addedByAgent: true
        });
        modified = true;
        message = `Added ${item.name || 'restaurant'} for ${mealType} on day ${dayNumber}`;
        break;

      case 'remove_restaurant':
        if (restaurants[`day${dayNumber}`]) {
          const mealType = item.mealType || 'lunch';
          if (restaurants[`day${dayNumber}`][mealType]) {
            const originalLength = restaurants[`day${dayNumber}`][mealType].length;
            restaurants[`day${dayNumber}`][mealType] = restaurants[`day${dayNumber}`][mealType].filter(r => r.id !== itemId);
            if (restaurants[`day${dayNumber}`][mealType].length < originalLength) {
              modified = true;
              message = `Removed restaurant from ${mealType} on day ${dayNumber}`;
            }
          }
        }
        break;

      case 'update_accommodation':
        if (!accommodations[`day${dayNumber}`]) {
          accommodations[`day${dayNumber}`] = [];
        }
        accommodations[`day${dayNumber}`] = [{
          id: `hotel_${Date.now()}`,
          ...item,
          addedByAgent: true
        }];
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

    // Update database
    await db.query(
      `UPDATE itineraries
       SET activities = $1, restaurants = $2, accommodations = $3, updated_at = NOW()
       WHERE id = $4`,
      [JSON.stringify(activities), JSON.stringify(restaurants), JSON.stringify(accommodations), itinerary.id]
    );

    console.log(`✅ Itinerary modified: ${message}`);

    return {
      success: true,
      message,
      action,
      dayNumber,
      modifiedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error modifying itinerary:', error);
    return {
      success: false,
      error: error.message || 'Failed to modify itinerary'
    };
  }
}

module.exports = modifyItinerary;
