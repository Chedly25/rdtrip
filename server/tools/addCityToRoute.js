/**
 * Tool: Add City to Route
 *
 * Allows the AI agent to add a city as a waypoint to the user's trip.
 * Geocodes the city name to get coordinates and returns structured data
 * that the frontend can use to update the discovery store.
 *
 * This tool is used during the discovery/planning phase when users want
 * to add new stops to their road trip route.
 */

const axios = require('axios');

/**
 * Execute city addition
 * @param {Object} params - Tool parameters
 * @param {string} params.cityName - City name (e.g., "Lyon" or "Lyon, France")
 * @param {string} [params.country] - Country name (optional, for disambiguation)
 * @param {number} [params.nights=1] - Number of nights to stay
 * @param {number} [params.insertAfterIndex] - Insert after this city index (optional)
 * @param {string} [params.reason] - Why this city is being added (for context)
 * @param {Object} context - Agent context
 * @returns {Promise<Object>} City data ready for frontend store
 */
async function addCityToRoute(params, context) {
  const { cityName, country, nights = 1, insertAfterIndex, reason } = params;

  if (!cityName) {
    return {
      success: false,
      error: 'City name is required'
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
    console.log(`🌍 [addCityToRoute] Adding city: ${cityName}${country ? `, ${country}` : ''}`);

    // Build search query
    const searchQuery = country ? `${cityName}, ${country}` : cityName;

    // Step 1: Geocode the city
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

    const resolvedCity = cityComponent?.long_name || cityName;
    const resolvedCountry = countryComponent?.long_name || country || '';

    // Step 2: Get a photo for the city (optional enhancement)
    let imageUrl = null;
    try {
      const placesSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(resolvedCity + ' city')}&key=${GOOGLE_PLACES_API_KEY}`;
      const placesResponse = await axios.get(placesSearchUrl, { timeout: 10000 });

      if (placesResponse.data.status === 'OK' && placesResponse.data.results[0]?.photos) {
        const photoRef = placesResponse.data.results[0].photos[0].photo_reference;
        imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;
      }
    } catch (photoError) {
      console.warn(`⚠️ [addCityToRoute] Could not fetch photo for ${resolvedCity}:`, photoError.message);
    }

    // Step 3: Build city data structure matching DiscoveryCity interface
    const cityData = {
      name: resolvedCity,
      country: resolvedCountry,
      coordinates: {
        lat: location.lat,
        lng: location.lng
      },
      suggestedNights: nights,
      nights: nights,
      imageUrl: imageUrl,
      isSelected: true, // Auto-select when agent adds
      description: reason || `Added by your travel companion`,
      // These will be populated by frontend if needed
      distanceFromRoute: null,
      drivingMinutes: null,
      placeCount: null
    };

    console.log(`✅ [addCityToRoute] City geocoded: ${resolvedCity}, ${resolvedCountry} (${location.lat}, ${location.lng})`);

    return {
      success: true,
      action: 'add_city_to_route',
      city: cityData,
      insertAfterIndex: insertAfterIndex,
      message: `Adding ${resolvedCity}, ${resolvedCountry} to your trip (${nights} night${nights !== 1 ? 's' : ''})`,
      reason: reason
    };

  } catch (error) {
    console.error('❌ [addCityToRoute] Error:', error.message);

    if (error.response) {
      return {
        success: false,
        error: `Geocoding error: ${error.response.status} - ${error.response.statusText}`
      };
    }

    return {
      success: false,
      error: `Failed to add city: ${error.message}`
    };
  }
}

module.exports = addCityToRoute;
