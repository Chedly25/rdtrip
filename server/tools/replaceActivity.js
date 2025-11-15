/**
 * Replace Activity Tool
 * Replaces an activity in a specific day of the itinerary
 * Uses fuzzy matching to find activity by name
 * Auto-fetches photos from Google Places API if missing
 */

const db = require('../../db/connection');
const axios = require('axios');

/**
 * Fetch photo for an activity using Google Places API
 * @param {string} activityName - Name of the activity
 * @param {string} city - City name for context
 * @returns {Promise<string|null>} Photo URL or null
 */
async function fetchPhotoForActivity(activityName, city) {
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('⚠️ [fetchPhotoForActivity] Google Places API key not configured');
    return null;
  }

  try {
    console.log(`📸 [fetchPhotoForActivity] Searching for "${activityName}" in ${city}`);

    // Use Text Search to find the place
    const searchQuery = city ? `${activityName}, ${city}` : activityName;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await axios.get(searchUrl, { timeout: 10000 });

    if (searchResponse.data.status !== 'OK' || !searchResponse.data.results[0]) {
      console.warn(`⚠️ [fetchPhotoForActivity] No results found for "${activityName}"`);
      return null;
    }

    const place = searchResponse.data.results[0];

    // Extract photo URL
    const photoReference = place.photos?.[0]?.photo_reference;
    if (!photoReference) {
      console.warn(`⚠️ [fetchPhotoForActivity] No photos found for "${activityName}"`);
      return null;
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
    console.log(`✅ [fetchPhotoForActivity] Found photo for "${activityName}"`);

    return photoUrl;

  } catch (error) {
    console.error(`❌ [fetchPhotoForActivity] Error fetching photo:`, error.message);
    return null;
  }
}

async function replaceActivity({ itineraryId, dayNumber, oldActivityName, newActivity }) {
  console.log(`🔄 [replaceActivity] Replacing "${oldActivityName}" with "${newActivity.name}" on Day ${dayNumber}`);
  console.log(`📸 [replaceActivity] New activity fields:`, JSON.stringify(Object.keys(newActivity)));
  console.log(`📸 [replaceActivity] Photo field:`, newActivity.photo || 'MISSING!');

  try {
    // 1. Load current itinerary from correct schema
    const result = await db.query(
      'SELECT id, activities FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Itinerary not found' };
    }

    const activitiesData = result.rows[0].activities || [];

    // 2. Find the day
    const dayData = activitiesData.find(d => d.day === dayNumber);

    if (!dayData) {
      return {
        success: false,
        error: `Day ${dayNumber} not found in itinerary`
      };
    }

    const activities = dayData.activities || [];

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

    // 4. Auto-enrich with photo if missing (CODE-LEVEL ENFORCEMENT)
    // This ensures photos are fetched even if agent skips searchActivities
    if (!newActivity.photo && newActivity.name) {
      console.log(`🔧 [replaceActivity] Photo missing for "${newActivity.name}", auto-fetching from Google Places...`);
      const photo = await fetchPhotoForActivity(newActivity.name, dayData.city);
      if (photo) {
        newActivity.photo = photo;
        console.log(`✅ [replaceActivity] Auto-enriched photo for "${newActivity.name}"`);
      } else {
        console.warn(`⚠️ [replaceActivity] Could not auto-fetch photo for "${newActivity.name}"`);
      }
    }

    // 5. Replace activity (preserve block if present)
    activities[activityIndex] = {
      ...newActivity,
      block: oldActivity.block || newActivity.block || 'afternoon',
      addedAt: new Date().toISOString(),
      addedBy: 'agent',
      replaced: true
    };

    // 6. Update the day's activities
    dayData.activities = activities;

    // 7. Update database
    await db.query(
      'UPDATE itineraries SET activities = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(activitiesData), itineraryId]
    );

    console.log(`✅ Replaced "${oldActivity.name}" with "${newActivity.name}" on Day ${dayNumber}`);

    return {
      success: true,
      message: `Replaced "${oldActivity.name}" with "${newActivity.name}" on Day ${dayNumber} (${dayData.city || 'Unknown city'})`,
      oldActivity: oldActivity.name,
      newActivity: newActivity.name,
      day: dayNumber,
      city: dayData.city
    };

  } catch (error) {
    console.error('❌ [replaceActivity] Error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = replaceActivity;
