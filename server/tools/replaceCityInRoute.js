/**
 * Tool: Replace City in Route
 *
 * Allows the AI agent to replace one city with another in the user's trip.
 * This is used when the user asks to swap a city (e.g., "replace Lyon with Annecy").
 *
 * Combines the functionality of removing the old city and adding the new one,
 * preserving the position in the route.
 */

const axios = require('axios');

/**
 * Execute city replacement
 * @param {Object} params - Tool parameters
 * @param {string} params.oldCityName - Name of city to remove
 * @param {string} params.newCityName - Name of city to add
 * @param {string} [params.newCountry] - Country of new city (optional)
 * @param {number} [params.nights] - Number of nights (inherits from old city if not specified)
 * @param {string} [params.reason] - Why this replacement is being made
 * @param {Object} context - Agent context
 * @returns {Promise<Object>} Replacement data for frontend
 */
async function replaceCityInRoute(params, context) {
  const { oldCityName, newCityName, newCountry, nights, reason } = params;

  if (!oldCityName || !newCityName) {
    return {
      success: false,
      error: 'Both oldCityName and newCityName are required'
    };
  }

  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!GOOGLE_PLACES_API_KEY) {
    return {
      success: false,
      error: 'Google Places API key not configured'
    };
  }

  try {
    console.log(`🔄 [replaceCityInRoute] Replacing ${oldCityName} with ${newCityName}${newCountry ? `, ${newCountry}` : ''}`);

    // Build search query for new city
    const searchQuery = newCountry ? `${newCityName}, ${newCountry}` : newCityName;

    // Geocode the new city
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;

    const geocodeResponse = await axios.get(geocodeUrl, { timeout: 10000 });

    if (geocodeResponse.data.status !== 'OK' || !geocodeResponse.data.results[0]) {
      return {
        success: false,
        error: `Could not find city: ${searchQuery}`
      };
    }

    const result = geocodeResponse.data.results[0];
    const location = result.geometry.location;

    // Extract country from address components
    const addressComponents = result.address_components || [];
    const countryComponent = addressComponents.find(
      (c) => c.types.includes('country')
    );
    const cityComponent = addressComponents.find(
      (c) => c.types.includes('locality') || c.types.includes('administrative_area_level_1')
    );

    const resolvedCity = cityComponent?.long_name || newCityName;
    const resolvedCountry = countryComponent?.long_name || newCountry || '';

    // Get a photo for the new city
    let imageUrl = null;
    try {
      const placesSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(resolvedCity + ' city')}&key=${GOOGLE_PLACES_API_KEY}`;
      const placesResponse = await axios.get(placesSearchUrl, { timeout: 10000 });

      if (placesResponse.data.status === 'OK' && placesResponse.data.results[0]?.photos) {
        const photoRef = placesResponse.data.results[0].photos[0].photo_reference;
        imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;
      }
    } catch (photoError) {
      console.warn(`⚠️ [replaceCityInRoute] Could not fetch photo for ${resolvedCity}:`, photoError.message);
    }

    // Build new city data structure matching DiscoveryCity interface
    const newCityData = {
      name: resolvedCity,
      country: resolvedCountry,
      coordinates: {
        lat: location.lat,
        lng: location.lng
      },
      suggestedNights: nights || 1, // Will be overridden by frontend if old city had different nights
      nights: nights || 1,
      imageUrl: imageUrl,
      isSelected: true,
      description: reason || `Replaced ${oldCityName} with ${resolvedCity}`,
      distanceFromRoute: null,
      drivingMinutes: null,
      placeCount: null
    };

    console.log(`✅ [replaceCityInRoute] New city geocoded: ${resolvedCity}, ${resolvedCountry}`);

    return {
      success: true,
      action: 'replace_city_in_route',
      oldCityName: oldCityName,
      newCity: newCityData,
      message: `Replaced ${oldCityName} with ${resolvedCity}, ${resolvedCountry}`,
      reason: reason
    };

  } catch (error) {
    console.error('❌ [replaceCityInRoute] Error:', error.message);

    if (error.response) {
      return {
        success: false,
        error: `Geocoding error: ${error.response.status} - ${error.response.statusText}`
      };
    }

    return {
      success: false,
      error: `Failed to replace city: ${error.message}`
    };
  }
}

module.exports = replaceCityInRoute;
