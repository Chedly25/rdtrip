/**
 * findAlternative - Find Alternative Places
 *
 * Finds alternative restaurants, hotels, or activities similar to a given place.
 * Useful when user doesn't like a suggestion or place is closed/full.
 */

const axios = require('axios');

/**
 * @param {Object} args
 * @param {string} args.type - Type of place: 'restaurant', 'hotel', 'attraction'
 * @param {string} args.currentPlace - Name of the current place
 * @param {string} args.location - City or area
 * @param {string} [args.priceLevel] - Price level: 'budget', 'moderate', 'upscale'
 * @param {string} [args.cuisine] - For restaurants: cuisine type
 */
async function findAlternative({ type, currentPlace, location, priceLevel, cuisine }) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Google Places API key not configured'
      };
    }

    console.log(`🔄 Finding alternative ${type} to "${currentPlace}" in ${location}`);

    // Map type to Google Places type
    const typeMap = {
      'restaurant': 'restaurant',
      'hotel': 'lodging',
      'attraction': 'tourist_attraction'
    };

    const placeType = typeMap[type] || 'tourist_attraction';

    // Build search query
    let query = `${type} in ${location}`;
    if (cuisine) query = `${cuisine} restaurant in ${location}`;
    if (priceLevel === 'budget') query += ' cheap';
    if (priceLevel === 'upscale') query += ' luxury';

    // Search for alternatives
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query,
        type: placeType,
        key: apiKey
      }
    });

    if (!response.data.results || response.data.results.length === 0) {
      return {
        success: false,
        error: `No alternatives found for ${type} in ${location}`
      };
    }

    // Filter out the current place and get top 3 alternatives
    const alternatives = response.data.results
      .filter(place => !place.name.toLowerCase().includes(currentPlace.toLowerCase()))
      .slice(0, 3)
      .map(place => ({
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        priceLevel: place.price_level,
        openNow: place.opening_hours?.open_now,
        types: place.types,
        placeId: place.place_id,
        photoReference: place.photos?.[0]?.photo_reference
      }));

    if (alternatives.length === 0) {
      return {
        success: false,
        error: 'No suitable alternatives found'
      };
    }

    console.log(`✅ Found ${alternatives.length} alternatives to ${currentPlace}`);

    return {
      success: true,
      type,
      originalPlace: currentPlace,
      location,
      alternatives,
      count: alternatives.length
    };

  } catch (error) {
    console.error('Error finding alternative:', error.message);
    return {
      success: false,
      error: error.response?.data?.error_message || error.message || 'Failed to find alternatives'
    };
  }
}

module.exports = findAlternative;
