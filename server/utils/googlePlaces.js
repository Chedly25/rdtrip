/**
 * Google Places API Utilities
 * Helper functions for Places Nearby Search API
 */

const axios = require('axios');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

/**
 * Search for places near a specific location
 * @param {Object} params - Search parameters
 * @param {Object|string} params.location - Coordinates {lat, lng} or address string
 * @param {number} params.radius - Search radius in meters (default: 500)
 * @param {string} params.type - Place type (restaurant, cafe, bar, etc.)
 * @returns {Promise<Array>} - Array of place objects
 */
async function searchNearby({ location, radius = 500, type = 'restaurant' }) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('⚠️ Google Places API key not found, returning mock data');
    return getMockNearbyPlaces(type);
  }

  try {
    // Handle both coordinate objects and address strings
    let coordinates;

    if (typeof location === 'string') {
      // If location is an address string, geocode it first
      coordinates = await geocodeAddress(location);
      if (!coordinates) {
        console.warn(`⚠️ Could not geocode address: ${location}`);
        return getMockNearbyPlaces(type);
      }
    } else if (location.lat && location.lng) {
      // Location is already coordinates
      coordinates = location;
    } else if (location.latitude && location.longitude) {
      // Handle alternate coordinate format
      coordinates = { lat: location.latitude, lng: location.longitude };
    } else if (Array.isArray(location) && location.length === 2) {
      // Handle [lat, lng] array format
      coordinates = { lat: location[0], lng: location[1] };
    } else {
      console.warn('⚠️ Invalid location format:', location);
      return getMockNearbyPlaces(type);
    }

    console.log(`📍 Searching for ${type} within ${radius}m of ${coordinates.lat},${coordinates.lng}`);

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${coordinates.lat},${coordinates.lng}`,
        radius: radius,
        type: type,
        key: GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.warn(`⚠️ Places API returned status: ${response.data.status}`);
      return getMockNearbyPlaces(type);
    }

    if (response.data.status === 'ZERO_RESULTS') {
      console.log('   ℹ️  No results found');
      return [];
    }

    // Parse results
    const places = response.data.results.map(place => ({
      name: place.name,
      address: place.vicinity || place.formatted_address,
      rating: place.rating || null,
      ratingsCount: place.user_ratings_total || 0,
      priceLevel: place.price_level || null,
      types: place.types || [],
      placeId: place.place_id,
      coordinates: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng
      },
      isOpen: place.opening_hours?.open_now || null,
      photos: place.photos ? place.photos.slice(0, 3).map(photo => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : []
    }));

    console.log(`   ✅ Found ${places.length} places`);
    return places;

  } catch (error) {
    console.error('❌ Places Nearby Search error:', error.message);
    return getMockNearbyPlaces(type);
  }
}

/**
 * Geocode an address to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<Object|null>} - Coordinates {lat, lng} or null
 */
async function geocodeAddress(address) {
  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }

    return null;
  } catch (error) {
    console.error('❌ Geocoding error:', error.message);
    return null;
  }
}

/**
 * Fallback: Return mock nearby places when API is unavailable
 * @param {string} type - Place type
 * @returns {Array} - Mock places
 */
function getMockNearbyPlaces(type) {
  const mockPlaces = {
    restaurant: [
      {
        name: 'Le Petit Bistro',
        address: 'Nearby street',
        rating: 4.3,
        ratingsCount: 127,
        priceLevel: 2,
        types: ['restaurant', 'food'],
        placeId: 'mock_1',
        coordinates: null,
        isOpen: true,
        photos: []
      },
      {
        name: 'Café du Coin',
        address: 'Near location',
        rating: 4.1,
        ratingsCount: 89,
        priceLevel: 1,
        types: ['restaurant', 'cafe'],
        placeId: 'mock_2',
        coordinates: null,
        isOpen: true,
        photos: []
      }
    ],
    cafe: [
      {
        name: 'Café Central',
        address: 'Walking distance',
        rating: 4.5,
        ratingsCount: 203,
        priceLevel: 1,
        types: ['cafe', 'food'],
        placeId: 'mock_3',
        coordinates: null,
        isOpen: true,
        photos: []
      }
    ],
    bar: [
      {
        name: 'The Local Pub',
        address: 'Around the corner',
        rating: 4.2,
        ratingsCount: 156,
        priceLevel: 2,
        types: ['bar', 'night_club'],
        placeId: 'mock_4',
        coordinates: null,
        isOpen: true,
        photos: []
      }
    ],
    atm: [
      {
        name: 'ATM - Main Bank',
        address: '100m away',
        rating: null,
        ratingsCount: 0,
        priceLevel: null,
        types: ['atm', 'finance'],
        placeId: 'mock_5',
        coordinates: null,
        isOpen: true,
        photos: []
      }
    ]
  };

  return mockPlaces[type] || mockPlaces.restaurant;
}

/**
 * Get photo URL from photo reference
 * @param {string} photoReference - Photo reference from Places API
 * @param {number} maxWidth - Maximum width in pixels (default: 400)
 * @returns {string} - Photo URL
 */
function getPhotoUrl(photoReference, maxWidth = 400) {
  if (!GOOGLE_PLACES_API_KEY || !photoReference) {
    return null;
  }

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

module.exports = {
  searchNearby,
  geocodeAddress,
  getPhotoUrl
};
