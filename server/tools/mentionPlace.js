/**
 * Tool: Mention Place
 *
 * Allows the AI agent to "mention" a place in its response with an interactive card.
 * Returns place data AND a marker string that the agent should include in its text.
 *
 * When the agent uses this tool and includes the returned marker in its message,
 * the frontend will render an interactive place card that users can:
 * - Add to their trip itinerary
 * - Get directions to
 * - Save to favorites
 *
 * Usage:
 * 1. Agent calls mentionPlace({ name: "Le Comptoir", city: "Paris" })
 * 2. Tool returns { success: true, marker: "[[place:BASE64...]]", place: {...} }
 * 3. Agent includes the marker in its response text
 * 4. Frontend parses marker and renders InlinePlaceCard
 */

const axios = require('axios');

/**
 * Execute place mention
 * @param {Object} params - Tool parameters
 * @param {string} params.name - Place name (e.g., "Le Comptoir du Panthéon")
 * @param {string} [params.city] - City name for context (e.g., "Paris")
 * @param {string} [params.type] - Place type hint (restaurant, museum, park, etc.)
 * @param {Object} context - Agent context
 * @returns {Promise<Object>} Place data and marker for embedding
 */
async function mentionPlace(params, context) {
  const { name, city, type } = params;

  if (!name) {
    return {
      success: false,
      error: 'Place name is required'
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
    console.log(`📍 [mentionPlace] Searching for: "${name}"${city ? ` in ${city}` : ''}`);

    // Build search query
    const searchQuery = city ? `${name} ${city}` : name;

    // Step 1: Text search to find the place
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await axios.get(searchUrl, { timeout: 10000 });

    if (searchResponse.data.status !== 'OK' || !searchResponse.data.results[0]) {
      // Try a more specific find place search
      const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=name,formatted_address,geometry,rating,user_ratings_total,photos,types,price_level,opening_hours,place_id&key=${GOOGLE_PLACES_API_KEY}`;

      const findResponse = await axios.get(findPlaceUrl, { timeout: 10000 });

      if (findResponse.data.status !== 'OK' || !findResponse.data.candidates[0]) {
        return {
          success: false,
          error: `Could not find place: ${searchQuery}`
        };
      }

      // Use find place result
      const candidate = findResponse.data.candidates[0];
      return buildPlaceResponse(candidate, GOOGLE_PLACES_API_KEY, name);
    }

    // Use text search result
    const result = searchResponse.data.results[0];
    return buildPlaceResponse(result, GOOGLE_PLACES_API_KEY, name);

  } catch (error) {
    console.error('❌ [mentionPlace] Error:', error.message);

    if (error.response) {
      return {
        success: false,
        error: `Places API error: ${error.response.status}`
      };
    }

    return {
      success: false,
      error: `Failed to search for place: ${error.message}`
    };
  }
}

/**
 * Build the place response with data and marker
 */
function buildPlaceResponse(result, apiKey, originalName) {
  const location = result.geometry?.location || {};

  // Get photo URL if available
  let photoUrl = null;
  if (result.photos && result.photos[0]) {
    const photoRef = result.photos[0].photo_reference;
    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;
  }

  // Build place data object
  const placeData = {
    name: result.name || originalName,
    rating: result.rating || null,
    userRatingsTotal: result.user_ratings_total || null,
    photo: photoUrl,
    types: result.types || [],
    address: result.formatted_address || result.vicinity || null,
    vicinity: result.vicinity || null,
    priceLevel: result.price_level || null,
    isOpen: result.opening_hours?.open_now ?? null,
    lat: location.lat || null,
    lng: location.lng || null,
    placeId: result.place_id || null
  };

  // Encode to base64 for marker
  const jsonString = JSON.stringify(placeData);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const marker = `[[place:${base64Data}]]`;

  console.log(`✅ [mentionPlace] Found: ${placeData.name} (${placeData.rating}★)`);

  return {
    success: true,
    marker: marker,
    place: placeData,
    message: `Include this marker in your response to show an interactive card: ${marker}`,
    instructions: 'Include the marker string exactly as provided in your response text. It will render as an interactive place card with Add to Trip and Directions buttons.'
  };
}

module.exports = mentionPlace;
