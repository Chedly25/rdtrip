/**
 * Search Itinerary Tool
 * Search for activities/restaurants in the current itinerary
 * Returns which day an item is on + full details
 */

const db = require('../../db/connection');

async function searchItinerary({ itineraryId, query, type }) {
  console.log(`🔍 [searchItinerary] Searching for "${query}" (type: ${type || 'any'})`);

  try {
    // Load itinerary
    const result = await db.query('SELECT id, itinerary_data FROM itineraries WHERE id = $1', [itineraryId]);
    if (result.rows.length === 0) return { success: false, error: 'Itinerary not found' };

    const itineraryData = result.rows[0].itinerary_data;
    const days = itineraryData.days || [];

    if (days.length === 0) {
      return { success: false, error: 'No days planned in this itinerary' };
    }

    const searchQuery = query.toLowerCase();
    const results = [];

    // Search through all days
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const dayNumber = i + 1;

      // Search activities (if type is 'activity' or 'any')
      if (!type || type === 'activity' || type === 'any') {
        const activities = day.activities || [];
        for (const activity of activities) {
          const activityName = activity.name?.toLowerCase() || '';
          if (activityName.includes(searchQuery) || searchQuery.includes(activityName)) {
            results.push({
              type: 'activity',
              dayNumber,
              city: day.city,
              date: day.date || null,
              item: {
                name: activity.name,
                address: activity.address || null,
                rating: activity.rating || null,
                description: activity.description || null,
                placeId: activity.place_id || null
              }
            });
          }
        }
      }

      // Search restaurants (if type is 'restaurant' or 'any')
      if (!type || type === 'restaurant' || type === 'any') {
        const restaurants = day.restaurants || {};
        ['breakfast', 'lunch', 'dinner'].forEach(meal => {
          const mealList = restaurants[meal] || [];
          for (const restaurant of mealList) {
            const restaurantName = restaurant.name?.toLowerCase() || '';
            if (restaurantName.includes(searchQuery) || searchQuery.includes(restaurantName)) {
              results.push({
                type: 'restaurant',
                meal,
                dayNumber,
                city: day.city,
                date: day.date || null,
                item: {
                  name: restaurant.name,
                  address: restaurant.address || null,
                  rating: restaurant.rating || null,
                  cuisine: restaurant.cuisine || null
                }
              });
            }
          }
        });
      }
    }

    if (results.length === 0) {
      return {
        success: true,
        found: false,
        query,
        message: `No matches found for "${query}" in your ${days.length}-day itinerary`
      };
    }

    console.log(`   ✅ Found ${results.length} match(es)`);

    return {
      success: true,
      found: true,
      query,
      count: results.length,
      results,
      summary: results.length === 1
        ? `Found "${results[0].item.name}" on Day ${results[0].dayNumber} in ${results[0].city}`
        : `Found ${results.length} matches across your itinerary`
    };

  } catch (error) {
    console.error('❌ [searchItinerary] Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = searchItinerary;
