/**
 * searchHotels - Search for Hotels
 *
 * Uses Google Places API to find hotels/accommodations.
 * Returns hotels with ratings, prices, and booking links.
 */

const axios = require('axios');

/**
 * @param {Object} args
 * @param {string} args.city - City name
 * @param {string} [args.checkIn] - Check-in date (YYYY-MM-DD)
 * @param {string} [args.checkOut] - Check-out date (YYYY-MM-DD)
 * @param {string} [args.priceLevel] - Price range: 'budget', 'moderate', 'luxury'
 * @param {number} [args.minRating] - Minimum rating (1-5)
 * @param {number} [args.limit] - Max results (default: 5)
 */
async function searchHotels({ city, checkIn, checkOut, priceLevel, minRating = 3.5, limit = 5 }) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Google Places API key not configured'
      };
    }

    console.log(`🏨 Searching hotels in ${city} (${priceLevel || 'all price levels'})`);

    // Build search query
    let query = `hotels in ${city}`;
    if (priceLevel === 'budget') query = `budget hotels in ${city}`;
    if (priceLevel === 'luxury') query = `luxury hotels in ${city}`;

    // Search for hotels using Text Search API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query,
        type: 'lodging',
        key: apiKey
      }
    });

    if (!response.data.results || response.data.results.length === 0) {
      return {
        success: false,
        error: `No hotels found in ${city}`
      };
    }

    // Filter and map results
    const hotels = response.data.results
      .filter(place => place.rating >= minRating)
      .slice(0, limit)
      .map(place => ({
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        priceLevel: place.price_level,
        location: place.geometry?.location,
        types: place.types,
        openNow: place.opening_hours?.open_now,
        placeId: place.place_id,
        photoReference: place.photos?.[0]?.photo_reference,
        // Generate booking link (Google Maps with place ID)
        bookingLink: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      }));

    if (hotels.length === 0) {
      return {
        success: false,
        error: `No hotels with rating ${minRating}+ found in ${city}`
      };
    }

    console.log(`✅ Found ${hotels.length} hotels in ${city}`);

    return {
      success: true,
      city,
      checkIn,
      checkOut,
      priceLevel: priceLevel || 'all',
      minRating,
      hotels,
      count: hotels.length,
      message: `Found ${hotels.length} hotels in ${city}${priceLevel ? ` (${priceLevel})` : ''}`
    };

  } catch (error) {
    console.error('Error searching hotels:', error.message);
    return {
      success: false,
      error: error.response?.data?.error_message || error.message || 'Failed to search hotels'
    };
  }
}

module.exports = searchHotels;
