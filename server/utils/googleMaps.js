/**
 * Google Maps API Utilities
 * Helper functions for Distance Matrix API and route optimization
 */

const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

/**
 * Get distance matrix between multiple locations
 * @param {Array<string>} locations - Array of location strings (addresses or place names)
 * @returns {Promise<Array<Array<number>>>} - 2D array of travel times in seconds
 */
async function getDistanceMatrix(locations) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ Google Maps API key not found, using estimated distances');
    return getEstimatedDistanceMatrix(locations);
  }

  try {
    const origins = locations.join('|');
    const destinations = locations.join('|');

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins,
        destinations,
        mode: 'driving',
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      console.warn(`⚠️ Distance Matrix API returned status: ${response.data.status}`);
      return getEstimatedDistanceMatrix(locations);
    }

    // Parse response into 2D matrix of durations (in seconds)
    const matrix = [];
    for (let i = 0; i < locations.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < locations.length; j++) {
        const element = response.data.rows[i]?.elements[j];
        if (element?.status === 'OK') {
          matrix[i][j] = element.duration.value; // duration in seconds
        } else {
          // Fallback to estimated distance if API fails for this pair
          matrix[i][j] = i === j ? 0 : 600; // 10 minutes default
        }
      }
    }

    return matrix;
  } catch (error) {
    console.error('❌ Distance Matrix API error:', error.message);
    return getEstimatedDistanceMatrix(locations);
  }
}

/**
 * Get travel time between two locations
 * @param {string} origin - Origin address or place name
 * @param {string} destination - Destination address or place name
 * @returns {Promise<number>} - Travel time in seconds
 */
async function getTravelTime(origin, destination) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ Google Maps API key not found, using estimated time');
    return 600; // 10 minutes default
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: origin,
        destinations: destination,
        mode: 'driving',
        key: GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      console.warn(`⚠️ Distance Matrix API returned status: ${response.data.status}`);
      return 600; // 10 minutes default
    }

    const element = response.data.rows[0]?.elements[0];
    if (element?.status === 'OK') {
      return element.duration.value; // duration in seconds
    }

    return 600; // 10 minutes default
  } catch (error) {
    console.error('❌ Travel time API error:', error.message);
    return 600; // 10 minutes default
  }
}

/**
 * Fallback: Estimate distance matrix when API is unavailable
 * Uses simple heuristic based on location count
 * @param {Array<string>} locations - Array of locations
 * @returns {Array<Array<number>>} - Estimated distance matrix
 */
function getEstimatedDistanceMatrix(locations) {
  const n = locations.length;
  const matrix = [];

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        // Estimate 10-20 minutes between activities
        matrix[i][j] = 600 + Math.abs(i - j) * 300; // 10-15 min average
      }
    }
  }

  return matrix;
}

/**
 * Calculate total travel time for a route
 * @param {Array<Object>} activities - Ordered array of activities
 * @param {Array<Array<number>>} distanceMatrix - Distance matrix from getDistanceMatrix
 * @returns {number} - Total travel time in seconds
 */
function calculateTotalTravelTime(activities, distanceMatrix) {
  let total = 0;
  for (let i = 0; i < activities.length - 1; i++) {
    total += distanceMatrix[i][i + 1];
  }
  return total;
}

module.exports = {
  getDistanceMatrix,
  getTravelTime,
  calculateTotalTravelTime
};
