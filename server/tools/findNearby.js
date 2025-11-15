/**
 * Find Nearby Tool
 * Find places near a specific activity (not city-wide search)
 * Enables contextual discovery: "Find a cafe near the Louvre"
 */

const db = require('../../db/connection');
const { searchNearby } = require('../utils/googlePlaces');

async function findNearby({ itineraryId, dayNumber, activityName, type, radius }) {
  console.log(`📍 [findNearby] Finding ${type || 'places'} near "${activityName}" on Day ${dayNumber}`);

  try {
    // 1. Load itinerary
    const result = await db.query('SELECT id, itinerary_data FROM itineraries WHERE id = $1', [itineraryId]);
    if (result.rows.length === 0) return { success: false, error: 'Itinerary not found' };

    const itineraryData = result.rows[0].itinerary_data;
    const days = itineraryData.days || [];

    // 2. Validate day number
    if (dayNumber < 1 || dayNumber > days.length) {
      return {
        success: false,
        error: `Day ${dayNumber} not found (trip has ${days.length} days)`
      };
    }

    const day = days[dayNumber - 1];
    const activities = day.activities || [];

    // 3. Find the reference activity with fuzzy matching
    const activity = activities.find(a => {
      const aName = a.name?.toLowerCase() || '';
      const searchName = activityName.toLowerCase();
      return aName.includes(searchName) || searchName.includes(aName);
    });

    if (!activity) {
      return {
        success: false,
        error: `Activity "${activityName}" not found in Day ${dayNumber}. Available activities: ${activities.map(a => a.name).join(', ')}`
      };
    }

    console.log(`   🎯 Reference activity: "${activity.name}"`);

    // 4. Get coordinates from activity
    // Try multiple coordinate formats that might be stored
    let coordinates = null;

    if (activity.coordinates) {
      // Standard {lat, lng} format
      coordinates = activity.coordinates;
    } else if (activity.location) {
      // Alternative location field
      coordinates = activity.location;
    } else if (activity.geometry && activity.geometry.location) {
      // Google Places format
      coordinates = activity.geometry.location;
    } else if (activity.lat && activity.lng) {
      // Flat coordinate format
      coordinates = { lat: activity.lat, lng: activity.lng };
    } else if (activity.address) {
      // Fallback to geocoding the address
      console.log(`   ℹ️  No coordinates found, will geocode address: ${activity.address}`);
      coordinates = activity.address;
    } else {
      return {
        success: false,
        error: `Activity "${activity.name}" has no location data (coordinates or address). Cannot search nearby.`
      };
    }

    // 5. Search nearby using Google Places
    console.log(`   🔍 Searching for ${type || 'places'} within ${radius || 500}m...`);

    const nearbyPlaces = await searchNearby({
      location: coordinates,
      radius: radius || 500,
      type: type || 'restaurant'
    });

    if (nearbyPlaces.length === 0) {
      return {
        success: true,
        referenceActivity: activity.name,
        location: `${day.city}, near ${activity.name}`,
        results: [],
        count: 0,
        message: `No ${type || 'places'} found within ${radius || 500}m of ${activity.name}. Try increasing the radius.`
      };
    }

    // 6. Return top 5 results
    const topResults = nearbyPlaces.slice(0, 5);

    console.log(`   ✅ Found ${nearbyPlaces.length} places, returning top ${topResults.length}`);

    return {
      success: true,
      referenceActivity: activity.name,
      activityAddress: activity.address || 'Address not available',
      location: `${day.city}, near ${activity.name}`,
      searchType: type || 'restaurant',
      searchRadius: `${radius || 500}m`,
      results: topResults,
      count: nearbyPlaces.length,
      message: `Found ${nearbyPlaces.length} ${type || 'places'} near ${activity.name}. Showing top ${topResults.length}.`
    };

  } catch (error) {
    console.error('❌ [findNearby] Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = findNearby;
