/**
 * Nearby Places API Routes
 * Phase 2: Trip in Progress Mode
 *
 * Endpoints for finding nearby places during a trip using Google Places API
 */

const express = require('express');
const router = express.Router();

// Simple auth middleware - extracts user ID from token
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For nearby places, we can allow unauthenticated requests
    // but track if user is logged in
    req.userId = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    req.userId = decoded.userId || decoded.id;
    next();
  } catch {
    req.userId = null;
    next();
  }
};

// Category to Google Places type mapping
const categoryToPlaceTypes = {
  all: ['restaurant', 'cafe', 'tourist_attraction', 'gas_station', 'pharmacy'],
  food: ['restaurant', 'meal_takeaway', 'meal_delivery'],
  coffee: ['cafe', 'bakery'],
  sights: ['tourist_attraction', 'museum', 'art_gallery', 'park', 'point_of_interest'],
  shopping: ['shopping_mall', 'clothing_store', 'department_store', 'supermarket'],
  gas: ['gas_station'],
  pharmacy: ['pharmacy', 'drugstore', 'hospital'],
  rest_stop: ['rest_stop', 'gas_station', 'convenience_store'],
  atm: ['atm', 'bank'],
  breakfast: ['cafe', 'bakery', 'restaurant'],
  scenic: ['park', 'natural_feature', 'tourist_attraction'],
  viewpoint: ['tourist_attraction', 'park', 'natural_feature'],
};

// Price level mapping
const priceLevelMap = {
  0: 'Free',
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
};

/**
 * GET /api/nearby
 * Find nearby places based on location and category
 *
 * Query params:
 * - lat: latitude (required)
 * - lng: longitude (required)
 * - category: category filter (optional, default 'all')
 * - radius: search radius in meters (optional, default 1000)
 * - limit: max results (optional, default 10)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, category = 'all', radius = 1000, limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = Math.min(parseInt(radius, 10), 5000); // Max 5km
    const maxResults = Math.min(parseInt(limit, 10), 20); // Max 20 results

    // Get place types for category
    const placeTypes = categoryToPlaceTypes[category] || categoryToPlaceTypes.all;

    // Check if Google Places API key is available
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      // Return mock data if no API key
      console.warn('[Nearby API] No Google Places API key - returning mock data');
      return res.json({
        places: generateMockPlaces(category, latitude, longitude, maxResults),
        source: 'mock'
      });
    }

    // Use Google Places API
    const places = await fetchGooglePlaces(
      latitude,
      longitude,
      placeTypes,
      searchRadius,
      maxResults,
      apiKey
    );

    res.json({
      places,
      source: 'google',
      count: places.length
    });

  } catch (error) {
    console.error('[Nearby API] Error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby places' });
  }
});

/**
 * Fetch places from Google Places API
 */
async function fetchGooglePlaces(lat, lng, types, radius, limit, apiKey) {
  const results = [];

  // Fetch for each type (Google Places only accepts one type at a time)
  for (const type of types.slice(0, 3)) { // Limit to 3 types to reduce API calls
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', radius.toString());
      url.searchParams.set('type', type);
      url.searchParams.set('key', apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        for (const place of data.results) {
          // Avoid duplicates
          if (!results.find(r => r.id === place.place_id)) {
            results.push(transformGooglePlace(place, lat, lng));
          }
        }
      }
    } catch (err) {
      console.error(`[Nearby API] Error fetching ${type}:`, err.message);
    }

    // Stop if we have enough results
    if (results.length >= limit) break;
  }

  // Sort by distance and limit
  return results
    .sort((a, b) => parseFloat(a.distanceMeters) - parseFloat(b.distanceMeters))
    .slice(0, limit);
}

/**
 * Transform Google Place to our format
 */
function transformGooglePlace(place, userLat, userLng) {
  const distance = calculateDistance(
    userLat,
    userLng,
    place.geometry.location.lat,
    place.geometry.location.lng
  );

  // Estimate walking time (average 5km/h)
  const walkingTime = Math.round((distance / 1000) * 12); // 12 min per km
  const drivingTime = Math.round((distance / 1000) * 2); // 2 min per km

  // Get photo URL if available
  let photo = null;
  if (place.photos && place.photos.length > 0) {
    const photoRef = place.photos[0].photo_reference;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    photo = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}`;
  }

  // Map place types to our categories
  const category = mapTypesToCategory(place.types || []);

  return {
    id: place.place_id,
    name: place.name,
    category,
    distance: formatDistance(distance),
    distanceMeters: distance,
    walkingTime,
    drivingTime,
    rating: place.rating || null,
    reviewCount: place.user_ratings_total || null,
    priceLevel: place.price_level || null,
    isOpen: place.opening_hours?.open_now ?? null,
    closingTime: null, // Would need details API for this
    photo,
    tags: place.types?.slice(0, 3).map(t => t.replace(/_/g, ' ')) || [],
    coordinates: {
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    },
    address: place.vicinity || null,
    matchReason: null, // Could add personalization logic here
  };
}

/**
 * Map Google place types to our categories
 */
function mapTypesToCategory(types) {
  if (types.includes('restaurant') || types.includes('meal_takeaway')) return 'food';
  if (types.includes('cafe') || types.includes('bakery')) return 'coffee';
  if (types.includes('tourist_attraction') || types.includes('museum') || types.includes('park')) return 'sights';
  if (types.includes('gas_station')) return 'gas';
  if (types.includes('pharmacy') || types.includes('drugstore')) return 'pharmacy';
  if (types.includes('shopping_mall') || types.includes('store')) return 'shopping';
  return 'sights';
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Format distance for display
 */
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Generate mock places for development/demo
 */
function generateMockPlaces(category, lat, lng, limit) {
  const mockPlaces = {
    all: [
      { name: 'Local Café', category: 'coffee', tags: ['coffee', 'wifi', 'cozy'] },
      { name: 'Traditional Restaurant', category: 'food', tags: ['local cuisine', 'family-friendly'] },
      { name: 'City Museum', category: 'sights', tags: ['history', 'culture', 'indoor'] },
      { name: 'Shell Station', category: 'gas', tags: ['gas', 'convenience store'] },
      { name: 'Central Pharmacy', category: 'pharmacy', tags: ['24h', 'medicine'] },
    ],
    food: [
      { name: 'La Trattoria', category: 'food', tags: ['italian', 'pasta', 'wine'] },
      { name: 'Golden Dragon', category: 'food', tags: ['chinese', 'takeaway'] },
      { name: 'Burger House', category: 'food', tags: ['burgers', 'american', 'casual'] },
    ],
    coffee: [
      { name: 'Artisan Coffee', category: 'coffee', tags: ['specialty', 'beans', 'pastries'] },
      { name: 'Morning Brew', category: 'coffee', tags: ['breakfast', 'wifi'] },
    ],
    sights: [
      { name: 'Old Town Square', category: 'sights', tags: ['historic', 'photo spot'] },
      { name: 'Art Gallery', category: 'sights', tags: ['art', 'modern', 'free entry'] },
    ],
    gas: [
      { name: 'Shell Station', category: 'gas', tags: ['gas', 'diesel'] },
      { name: 'BP Express', category: 'gas', tags: ['gas', '24h'] },
    ],
    pharmacy: [
      { name: 'Central Pharmacy', category: 'pharmacy', tags: ['24h', 'prescription'] },
      { name: 'Green Cross', category: 'pharmacy', tags: ['medicine', 'wellness'] },
    ],
  };

  const categoryPlaces = mockPlaces[category] || mockPlaces.all;

  return categoryPlaces.slice(0, limit).map((place, index) => ({
    id: `mock-${category}-${index}`,
    name: place.name,
    category: place.category,
    distance: `${(Math.random() * 500 + 100).toFixed(0)} m`,
    distanceMeters: Math.random() * 500 + 100,
    walkingTime: Math.floor(Math.random() * 10) + 2,
    drivingTime: Math.floor(Math.random() * 5) + 1,
    rating: (Math.random() * 1.5 + 3.5).toFixed(1),
    reviewCount: Math.floor(Math.random() * 500) + 50,
    priceLevel: Math.floor(Math.random() * 3) + 1,
    isOpen: Math.random() > 0.2,
    closingTime: '10:00 PM',
    photo: null,
    tags: place.tags,
    coordinates: {
      lat: lat + (Math.random() - 0.5) * 0.01,
      lng: lng + (Math.random() - 0.5) * 0.01,
    },
    address: `${Math.floor(Math.random() * 100) + 1} Main Street`,
    matchReason: index === 0 ? 'Recommended based on your preferences' : null,
  }));
}

module.exports = router;
