/**
 * Optimize Route Tool
 * Reorders activities by geographic proximity to minimize travel time
 * Uses Nearest Neighbor TSP approximation algorithm
 */

const db = require('../../db/connection');
const { getDistanceMatrix } = require('../utils/googleMaps');

async function optimizeRoute({ itineraryId, dayNumber }) {
  console.log(`🗺️ [optimizeRoute] Optimizing Day ${dayNumber} route`);

  try {
    const result = await db.query('SELECT id, itinerary_data FROM itineraries WHERE id = $1', [itineraryId]);
    if (result.rows.length === 0) return { success: false, error: 'Itinerary not found' };

    const itineraryData = result.rows[0].itinerary_data;
    const days = itineraryData.days || [];

    if (dayNumber < 1 || dayNumber > days.length) {
      return { success: false, error: `Day ${dayNumber} not found` };
    }

    const day = days[dayNumber - 1];
    const activities = day.activities || [];

    if (activities.length < 2) {
      return { success: false, error: 'Need at least 2 activities to optimize' };
    }

    // Extract addresses/coordinates for distance calculation
    const locations = activities.map(a => a.address || a.name);

    console.log(`📍 Calculating distances between ${locations.length} activities...`);

    // Get distance matrix from Google Maps (or estimates if API unavailable)
    const distances = await getDistanceMatrix(locations);

    // Store original order for comparison
    const originalOrder = activities.map(a => a.name);

    // Apply Nearest Neighbor TSP algorithm
    const optimized = nearestNeighborTSP(activities, distances);

    // Calculate time savings
    const originalDistance = calculateTotalDistance(activities, distances);
    const optimizedDistance = calculateTotalDistance(optimized, distances);
    const savedSeconds = originalDistance - optimizedDistance;
    const savedMinutes = Math.round(savedSeconds / 60);

    // Only update if there's actual improvement
    if (savedMinutes <= 0) {
      return {
        success: true,
        message: `Day ${dayNumber} is already optimally ordered! No changes needed.`,
        originalOrder,
        optimizedOrder: optimized.map(a => a.name),
        savedMinutes: 0,
        alreadyOptimal: true
      };
    }

    // Update itinerary with optimized order
    days[dayNumber - 1].activities = optimized;
    itineraryData.days = days;

    await db.query('UPDATE itineraries SET itinerary_data = $1, updated_at = NOW() WHERE id = $2',
                   [JSON.stringify(itineraryData), itineraryId]);

    console.log(`✅ Optimized Day ${dayNumber}: saved ${savedMinutes} minutes`);

    return {
      success: true,
      message: `Optimized Day ${dayNumber} route - saved approximately ${savedMinutes} minutes of travel time!`,
      originalOrder,
      optimizedOrder: optimized.map(a => a.name),
      savedMinutes,
      city: day.city
    };
  } catch (error) {
    console.error('❌ [optimizeRoute] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Nearest Neighbor TSP Algorithm
 * Greedy algorithm that starts at first location and always visits nearest unvisited location next
 * @param {Array<Object>} activities - Array of activity objects
 * @param {Array<Array<number>>} distances - Distance matrix (seconds between locations)
 * @returns {Array<Object>} - Optimized order of activities
 */
function nearestNeighborTSP(activities, distances) {
  const n = activities.length;
  const visited = new Set();
  const result = [];
  let current = 0; // Start at first activity

  // Add first activity
  result.push(activities[current]);
  visited.add(current);

  // Greedily select nearest unvisited activity
  while (visited.size < n) {
    let nearest = -1;
    let minDist = Infinity;

    // Find nearest unvisited activity
    for (let i = 0; i < n; i++) {
      if (!visited.has(i) && distances[current][i] < minDist) {
        minDist = distances[current][i];
        nearest = i;
      }
    }

    if (nearest !== -1) {
      result.push(activities[nearest]);
      visited.add(nearest);
      current = nearest;
    } else {
      break; // Should never happen, but safety check
    }
  }

  return result;
}

/**
 * Calculate total distance for a route
 * @param {Array<Object>} activities - Ordered activities
 * @param {Array<Array<number>>} distances - Distance matrix
 * @returns {number} - Total travel time in seconds
 */
function calculateTotalDistance(activities, distances) {
  let total = 0;
  const n = activities.length;

  // Sum distances between consecutive activities
  for (let i = 0; i < n - 1; i++) {
    total += distances[i][i + 1];
  }

  return total;
}

module.exports = optimizeRoute;
