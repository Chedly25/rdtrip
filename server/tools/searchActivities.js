/**
 * Tool: Search Activities
 *
 * Search for tourist activities, attractions, museums, parks in a city
 * Returns top-rated activities with photos, ratings, and details using Google Places API
 */

const axios = require('axios');

/**
 * Execute activity search
 * @param {Object} params - Tool parameters
 * @param {string} params.city - City name (e.g., "Paris, France")
 * @param {string} [params.category] - Activity category (museum, park, attraction, restaurant, outdoor, cultural)
 * @param {number} [params.limit=5] - Max results to return
 * @param {Object} context - Agent context (userId, routeId, etc.)
 * @returns {Promise<Object>} Activity search results
 */
async function searchActivities(params, context) {
  const { city, category, limit = 5 } = params;

  // Validate parameters
  if (!city) {
    throw new Error('City is required');
  }

  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!GOOGLE_PLACES_API_KEY) {
    return {
      success: false,
      error: 'Google Places API key not configured. Please add GOOGLE_PLACES_API_KEY to environment variables.'
    };
  }

  try {
    console.log(`🎯 Searching activities in ${city}${category ? ` (${category})` : ''}`);

    // Step 1: Geocode city to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${GOOGLE_PLACES_API_KEY}`;

    const geocodeResponse = await axios.get(geocodeUrl, { timeout: 10000 });

    if (geocodeResponse.data.status !== 'OK' || !geocodeResponse.data.results[0]) {
      return {
        success: false,
        error: `Could not find location: ${city}`
      };
    }

    const location = geocodeResponse.data.results[0].geometry.location;
    const { lat, lng } = location;

    // Step 2: Map category to Google Places types
    const categoryTypeMap = {
      museum: 'museum',
      park: 'park',
      attraction: 'tourist_attraction',
      restaurant: 'restaurant',
      outdoor: 'park',
      cultural: 'museum'
    };

    const placeType = category ? categoryTypeMap[category] || 'tourist_attraction' : 'tourist_attraction';

    // Step 3: Search for places nearby
    // For restaurants, add keyword to avoid getting hotels with restaurants
    let searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=${placeType}&key=${GOOGLE_PLACES_API_KEY}`;

    if (category === 'restaurant') {
      // Use keyword to ensure we get actual restaurants, not hotels
      searchUrl += '&keyword=restaurant';
    }

    const searchResponse = await axios.get(searchUrl, { timeout: 15000 });

    if (searchResponse.data.status !== 'OK') {
      console.warn(`Places API returned status: ${searchResponse.data.status}`);
      return {
        success: true,
        city: city,
        category: category,
        activities: [],
        message: 'No activities found for this search.'
      };
    }

    const places = searchResponse.data.results || [];

    // Step 4: Process and format results
    const activities = await Promise.all(
      places.slice(0, limit).map(async (place) => {
        // Get place details for more information
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,formatted_address,opening_hours,website,formatted_phone_number,price_level,reviews,editorial_summary&key=${GOOGLE_PLACES_API_KEY}`;

        let details = {};
        try {
          const detailsResponse = await axios.get(detailsUrl, { timeout: 10000 });
          if (detailsResponse.data.status === 'OK') {
            details = detailsResponse.data.result;
          }
        } catch (err) {
          console.warn(`Failed to get details for ${place.name}:`, err.message);
        }

        // Extract photo URL
        const photoReference = place.photos?.[0]?.photo_reference;
        const photoUrl = photoReference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`
          : null;

        return {
          name: place.name,
          place_id: place.place_id,
          rating: place.rating || null,
          userRatingsTotal: place.user_ratings_total || 0,  // Changed from ratingCount
          address: details.formatted_address || place.vicinity,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          photo: photoUrl,
          openingHours: details.opening_hours?.weekday_text || null,
          isOpen: details.opening_hours?.open_now || null,  // Changed from isOpenNow
          website: details.website || null,
          phoneNumber: details.formatted_phone_number || null,  // Changed from phone
          priceLevel: details.price_level || place.price_level || null,
          summary: details.editorial_summary?.overview || place.editorial_summary?.overview || null,
          types: place.types || [],
          vicinity: place.vicinity || null,  // Added vicinity field
          category: category || 'attraction'
        };
      })
    );

    console.log(`✅ Found ${activities.length} activities in ${city}`);

    return {
      success: true,
      city: city,
      category: category,
      coordinates: { lat, lng },
      activities: activities,
      count: activities.length,
      summary: generateActivitiesSummary(city, category, activities)
    };

  } catch (error) {
    console.error('Google Places API error:', error.message);

    if (error.response) {
      return {
        success: false,
        error: `Google Places API error: ${error.response.status} - ${error.response.statusText}`
      };
    }

    return {
      success: false,
      error: `Failed to search activities: ${error.message}`
    };
  }
}

/**
 * Generate natural language summary of activities
 */
function generateActivitiesSummary(city, category, activities) {
  if (activities.length === 0) {
    return `No ${category || 'activities'} found in ${city}.`;
  }

  let summary = `Found ${activities.length} ${category || 'activities'} in ${city}:\n\n`;

  activities.slice(0, 5).forEach((activity, index) => {
    summary += `${index + 1}. ${activity.name}`;
    if (activity.rating) {
      summary += ` (⭐ ${activity.rating.toFixed(1)})`;
    }
    summary += '\n';

    if (activity.summary) {
      summary += `   ${activity.summary}\n`;
    }

    if (activity.address) {
      summary += `   📍 ${activity.address}\n`;
    }

    if (activity.isOpenNow !== null) {
      summary += `   ${activity.isOpenNow ? '🟢 Open now' : '🔴 Closed'}\n`;
    }

    summary += '\n';
  });

  return summary.trim();
}

module.exports = searchActivities;
