/**
 * checkOpeningHours - Check Opening Hours
 *
 * Uses Google Places API to check if a place is open now or at a specific time.
 * Critical for trip planning to avoid closed venues.
 */

const axios = require('axios');

/**
 * @param {Object} args
 * @param {string} args.placeName - Name of the place
 * @param {string} args.placeAddress - Address or city
 * @param {string} [args.date] - Date to check (YYYY-MM-DD), defaults to today
 */
async function checkOpeningHours({ placeName, placeAddress, date }) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Google Places API key not configured'
      };
    }

    console.log(`🕐 Checking opening hours for: ${placeName} in ${placeAddress}`);

    // 1. Find the place
    const searchQuery = `${placeName}, ${placeAddress}`;
    const findResponse = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params: {
        input: searchQuery,
        inputtype: 'textquery',
        fields: 'place_id,name,formatted_address',
        key: apiKey
      }
    });

    if (!findResponse.data.candidates || findResponse.data.candidates.length === 0) {
      return {
        success: false,
        error: `Could not find "${placeName}" in ${placeAddress}`
      };
    }

    const placeId = findResponse.data.candidates[0].place_id;

    // 2. Get place details with opening hours
    const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,opening_hours,current_opening_hours,utc_offset_minutes,business_status',
        key: apiKey
      }
    });

    const place = detailsResponse.data.result;

    if (!place.opening_hours) {
      return {
        success: true,
        name: place.name,
        address: place.formatted_address,
        hoursAvailable: false,
        message: 'Opening hours information not available for this place',
        businessStatus: place.business_status
      };
    }

    const openingHours = place.opening_hours;

    // Determine if open now (or on specified date)
    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 6 = Saturday

    const result = {
      success: true,
      name: place.name,
      address: place.formatted_address,
      hoursAvailable: true,
      openNow: openingHours.open_now,
      weekdayText: openingHours.weekday_text || [],
      businessStatus: place.business_status,
      checkDate: targetDate.toISOString().split('T')[0]
    };

    // Add specific day hours if available
    if (openingHours.weekday_text && openingHours.weekday_text.length > 0) {
      // weekday_text is ordered starting from Monday
      // We need to adjust for 0=Sunday indexing
      const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      result.todayHours = openingHours.weekday_text[adjustedIndex];
    }

    console.log(`✅ Opening hours retrieved: ${place.name} - ${openNow ? 'OPEN' : 'CLOSED'} now`);

    return result;

  } catch (error) {
    console.error('Error checking opening hours:', error.message);
    return {
      success: false,
      error: error.response?.data?.error_message || error.message || 'Failed to check opening hours'
    };
  }
}

module.exports = checkOpeningHours;
