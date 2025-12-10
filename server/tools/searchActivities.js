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
 * @param {boolean} [params.hiddenGems=false] - If true, filter out extremely popular tourist attractions
 * @param {Object} context - Agent context (userId, routeId, etc.)
 * @returns {Promise<Object>} Activity search results
 */
async function searchActivities(params, context) {
  const { city, category, limit = 5, hiddenGems = false } = params;

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
    console.log(`🎯 Searching activities in ${city}${category ? ` (${category})` : ''}${hiddenGems ? ' [HIDDEN GEMS MODE]' : ''}`);

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

    // Step 2: Map common search terms to Google Places API types
    // Google Places supports 100+ types: https://developers.google.com/maps/documentation/places/web-service/supported_types
    const categoryTypeMap = {
      // Nightlife & Entertainment
      'bar': 'bar',
      'bars': 'bar',
      'pub': 'bar',
      'pubs': 'bar',
      'nightclub': 'night_club',
      'nightclubs': 'night_club',
      'club': 'night_club',
      'clubs': 'night_club',

      // Food & Drink
      'restaurant': 'restaurant',
      'restaurants': 'restaurant',
      'cafe': 'cafe',
      'coffee': 'cafe',
      'bakery': 'bakery',

      // Culture & Attractions
      'museum': 'museum',
      'museums': 'museum',
      'art gallery': 'art_gallery',
      'attraction': 'tourist_attraction',
      'attractions': 'tourist_attraction',
      'tourist attraction': 'tourist_attraction',
      'zoo': 'zoo',
      'aquarium': 'aquarium',
      'amusement park': 'amusement_park',
      'library': 'library',

      // Nature & Outdoors
      'park': 'park',
      'parks': 'park',
      'outdoor': 'park',

      // Shopping
      'shopping': 'shopping_mall',
      'mall': 'shopping_mall',
      'store': 'store',
      'bookstore': 'book_store',
      'clothing store': 'clothing_store',

      // Health & Wellness
      'spa': 'spa',
      'gym': 'gym',
      'pharmacy': 'pharmacy',
      'hospital': 'hospital',
      'doctor': 'doctor',

      // Services
      'bank': 'bank',
      'atm': 'atm',
      'gas station': 'gas_station',
      'parking': 'parking',
      'hotel': 'lodging',
      'lodging': 'lodging'
    };

    // Get the Google Places type, or use category as-is if not in map
    const placeType = category ? (categoryTypeMap[category.toLowerCase()] || null) : 'tourist_attraction';

    // Step 3: Search for places nearby
    let searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&key=${GOOGLE_PLACES_API_KEY}`;

    if (placeType) {
      // Use the type parameter if we have a match
      searchUrl += `&type=${placeType}`;

      // For restaurants, add keyword to filter out hotels
      if (placeType === 'restaurant') {
        searchUrl += '&keyword=restaurant';
      }
    } else if (category) {
      // If no type match, use keyword search (more flexible, works for any search term)
      searchUrl += `&keyword=${encodeURIComponent(category)}`;
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

    let places = searchResponse.data.results || [];

    // Step 4: Hidden Gems filtering
    // If hiddenGems is true, filter out extremely popular tourist attractions
    // Famous spots typically have 10,000+ reviews - filter those out
    // Also exclude places with "museum" or "basilica" in name if looking for hidden gems (unless specifically searching museums)
    if (hiddenGems && places.length > 0) {
      const famousTouristKeywords = [
        'sagrada familia', 'sagrada família',
        'casa batlló', 'casa batllo',
        'park güell', 'park guell',
        'la rambla', 'las ramblas',
        'camp nou',
        'arc de triomf',
        'palau de la música',
        'picasso museum',
        'gothic quarter', 'barri gotic',
        // Add other famous landmarks that should be excluded
        'eiffel tower', 'tour eiffel',
        'louvre', 'notre dame',
        'colosseum', 'coliseum',
        'trevi fountain',
        'vatican', 'sistine chapel',
        'big ben', 'tower of london',
        'buckingham palace',
        'times square', 'statue of liberty',
        'empire state', 'central park'
      ];

      const originalCount = places.length;
      places = places.filter(place => {
        const nameLower = place.name.toLowerCase();
        const reviewCount = place.user_ratings_total || 0;

        // Filter out places with more than 5000 reviews (very popular tourist spots)
        if (reviewCount > 5000) {
          console.log(`   🚫 Filtering out "${place.name}" (${reviewCount} reviews - too popular)`);
          return false;
        }

        // Filter out famous landmark names
        for (const keyword of famousTouristKeywords) {
          if (nameLower.includes(keyword)) {
            console.log(`   🚫 Filtering out "${place.name}" (famous landmark)`);
            return false;
          }
        }

        return true;
      });

      console.log(`   💎 Hidden gems filter: ${originalCount} → ${places.length} places`);

      // If we filtered too aggressively and have fewer than limit results, that's ok - shows authenticity
      if (places.length === 0) {
        console.log(`   ⚠️ No hidden gems found - all results were popular tourist spots`);
      }
    }

    // Step 5: Process and format results
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

    console.log(`✅ Found ${activities.length} ${hiddenGems ? 'hidden gems' : 'activities'} in ${city}`);

    return {
      success: true,
      city: city,
      category: category,
      hiddenGems: hiddenGems,
      coordinates: { lat, lng },
      activities: activities,
      count: activities.length,
      summary: generateActivitiesSummary(city, category, activities, hiddenGems)
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
function generateActivitiesSummary(city, category, activities, hiddenGems = false) {
  if (activities.length === 0) {
    if (hiddenGems) {
      return `No hidden gems found in ${city} for this category - all results were popular tourist spots. Try searching without the hidden gems filter.`;
    }
    return `No ${category || 'activities'} found in ${city}.`;
  }

  const typeLabel = hiddenGems ? 'hidden gems' : (category || 'activities');
  let summary = `Found ${activities.length} ${typeLabel} in ${city}:\n\n`;

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
