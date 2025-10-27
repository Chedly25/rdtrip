/**
 * City Optimization Utility
 * Selects optimal cities for a route based on geographic positioning
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate perpendicular distance from a point to a line segment
 * @param {Object} point - {lat, lon}
 * @param {Object} lineStart - {lat, lon}
 * @param {Object} lineEnd - {lat, lon}
 * @returns {number} Distance in km
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  // Vector from start to end
  const A = point.lat - lineStart.lat;
  const B = point.lon - lineStart.lon;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lon - lineStart.lon;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) { // lineStart and lineEnd are different
    param = dot / lenSq;
  }

  let closestLat, closestLon;

  if (param < 0) {
    closestLat = lineStart.lat;
    closestLon = lineStart.lon;
  } else if (param > 1) {
    closestLat = lineEnd.lat;
    closestLon = lineEnd.lon;
  } else {
    closestLat = lineStart.lat + param * C;
    closestLon = lineStart.lon + param * D;
  }

  return calculateDistance(point.lat, point.lon, closestLat, closestLon);
}

/**
 * Calculate position of city along the route (0 = start, 1 = end)
 * @param {Object} city - {lat, lon}
 * @param {Object} origin - {lat, lon}
 * @param {Object} destination - {lat, lon}
 * @returns {number} Position from 0 to 1
 */
function calculateRoutePosition(city, origin, destination) {
  const totalDist = calculateDistance(origin.lat, origin.lon, destination.lat, destination.lon);
  if (totalDist === 0) return 0;

  const distFromOrigin = calculateDistance(origin.lat, origin.lon, city.lat, city.lon);
  const distToDestination = calculateDistance(city.lat, city.lon, destination.lat, destination.lon);

  // Use law of cosines to get position along route
  const position = distFromOrigin / totalDist;
  return Math.max(0, Math.min(1, position)); // Clamp between 0 and 1
}

/**
 * Filter out cities that match origin or destination
 * @param {Array} cities - Array of city objects with name, latitude, longitude
 * @param {string} originName - Origin city name
 * @param {string} destinationName - Destination city name
 * @returns {Array} Filtered cities
 */
function filterOriginDestination(cities, originName, destinationName) {
  const normalize = (name) => name.toLowerCase().trim().replace(/[,\s-]+/g, '');
  const normalizedOrigin = normalize(originName);
  const normalizedDest = normalize(destinationName);

  return cities.filter(city => {
    const normalizedCity = normalize(city.name);
    return normalizedCity !== normalizedOrigin && normalizedCity !== normalizedDest;
  });
}

/**
 * Detect if coordinates are swapped (lon, lat instead of lat, lon)
 * Latitude should be between -90 and 90, longitude between -180 and 180
 * For Europe, latitude is typically 35-70, longitude -10 to 50
 */
function detectAndFixSwappedCoordinates(obj) {
  const lat = obj.latitude;
  const lon = obj.longitude;

  // If "latitude" value is outside valid range or looks like longitude
  // and "longitude" value looks like latitude, they're probably swapped
  if (Math.abs(lat) > 90 || (Math.abs(lon) <= 90 && Math.abs(lat) > Math.abs(lon))) {
    console.warn(`⚠️  Detected swapped coordinates for ${obj.name}: (${lat}, ${lon}) -> swapping to (${lon}, ${lat})`);
    return {
      ...obj,
      latitude: lon,
      longitude: lat
    };
  }

  return obj;
}

/**
 * Select optimal cities for a route
 * @param {Array} cities - Array of city candidates with latitude, longitude
 * @param {Object} origin - {name, latitude, longitude}
 * @param {Object} destination - {name, latitude, longitude}
 * @param {number} count - Number of cities to select
 * @returns {Object} {selected: Array, alternatives: Array}
 */
function selectOptimalCities(cities, origin, destination, count) {
  console.log(`\n=== City Optimization ===`);

  // Fix swapped coordinates if detected
  origin = detectAndFixSwappedCoordinates(origin);
  destination = detectAndFixSwappedCoordinates(destination);

  console.log(`Origin: ${origin.name} (${origin.latitude}, ${origin.longitude})`);
  console.log(`Destination: ${destination.name} (${destination.latitude}, ${destination.longitude})`);
  console.log(`Candidates: ${cities.length}, Need: ${count}`);

  // Filter out origin and destination
  let filtered = filterOriginDestination(cities, origin.name, destination.name);
  console.log(`After filtering origin/dest: ${filtered.length} cities`);

  if (filtered.length === 0) {
    console.warn('No valid cities after filtering!');
    return { selected: [], alternatives: [] };
  }

  // Ensure all cities have valid coordinates and fix swapped coords
  filtered = filtered.filter(city => {
    const hasCoords = typeof city.latitude === 'number' && typeof city.longitude === 'number';
    if (!hasCoords) {
      console.warn(`Skipping ${city.name} - missing coordinates`);
    }
    return hasCoords;
  }).map(city => detectAndFixSwappedCoordinates(city));

  console.log(`After validating coordinates: ${filtered.length} cities`);

  // Calculate scores for each city
  const originCoords = { lat: origin.latitude, lon: origin.longitude };
  const destCoords = { lat: destination.latitude, lon: destination.longitude };

  const scored = filtered.map(city => {
    const cityCoords = { lat: city.latitude, lon: city.longitude };

    // 1. Distance from straight line (lower is better)
    const distFromLine = perpendicularDistance(cityCoords, originCoords, destCoords);

    // 2. Position along route (0-1, we want even distribution)
    const position = calculateRoutePosition(cityCoords, originCoords, destCoords);

    // 3. Check if city is between origin and destination (not before or after)
    const distOriginToDest = calculateDistance(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
    const distOriginToCity = calculateDistance(originCoords.lat, originCoords.lon, cityCoords.lat, cityCoords.lon);
    const distCityToDest = calculateDistance(cityCoords.lat, cityCoords.lon, destCoords.lat, destCoords.lon);
    const isBetween = (distOriginToCity + distCityToDest) < (distOriginToDest * 1.5); // Allow 50% detour

    // Calculate final score (lower is better)
    let score = distFromLine * 2; // Heavily penalize cities far from the line

    if (!isBetween) {
      score += 1000; // Heavy penalty for cities not between origin and destination
    }

    return {
      ...city,
      score,
      distFromLine,
      position,
      isBetween
    };
  });

  // Sort by score (best first)
  scored.sort((a, b) => a.score - b.score);

  // Select top N cities
  const selected = scored.slice(0, count);
  const alternatives = scored.slice(count);

  // Sort selected cities by position along route (for proper ordering)
  selected.sort((a, b) => a.position - b.position);

  console.log(`\nSelected ${selected.length} cities:`);
  selected.forEach((city, i) => {
    console.log(`  ${i + 1}. ${city.name} (score: ${city.score.toFixed(2)}, position: ${city.position.toFixed(2)}, distFromLine: ${city.distFromLine.toFixed(1)}km)`);
  });

  console.log(`\nAlternatives: ${alternatives.length} cities`);

  return {
    selected,
    alternatives
  };
}

module.exports = {
  calculateDistance,
  selectOptimalCities,
  filterOriginDestination
};
