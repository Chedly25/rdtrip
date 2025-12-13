/**
 * Planning Service
 *
 * Service layer for planning operations.
 * Handles business logic for plans, clusters, and items.
 */

const crypto = require('crypto');

// ============================================
// Helper Functions
// ============================================

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// ============================================
// Plan Operations
// ============================================

/**
 * Get or create a plan for a route
 */
async function getOrCreatePlan(pool, routeId, userId = null) {
  // Check for existing plan
  const existing = await pool.query(
    'SELECT * FROM trip_plans WHERE route_id = $1',
    [routeId]
  );

  if (existing.rows.length > 0) {
    return await loadPlanWithDetails(pool, existing.rows[0].id);
  }

  // Get route data
  const route = await pool.query(
    'SELECT * FROM routes WHERE id = $1',
    [routeId]
  );

  if (route.rows.length === 0) {
    throw new Error('Route not found');
  }

  // Create new plan
  return await createPlanFromRoute(pool, routeId, route.rows[0], userId);
}

/**
 * Load a plan with all its details (cities, clusters, items)
 */
async function loadPlanWithDetails(pool, planId) {
  const plan = await pool.query('SELECT * FROM trip_plans WHERE id = $1', [planId]);

  if (plan.rows.length === 0) {
    throw new Error('Plan not found');
  }

  const cityPlans = await pool.query(
    'SELECT * FROM city_plans WHERE trip_plan_id = $1 ORDER BY display_order',
    [planId]
  );

  const cities = await Promise.all(
    cityPlans.rows.map(async (cityPlan) => {
      return await loadCityPlanWithDetails(pool, cityPlan);
    })
  );

  return {
    id: plan.rows[0].id,
    routeId: plan.rows[0].route_id,
    userId: plan.rows[0].user_id,
    status: plan.rows[0].status,
    cities,
    createdAt: plan.rows[0].created_at,
    updatedAt: plan.rows[0].updated_at,
  };
}

/**
 * Load a city plan with clusters and items
 */
async function loadCityPlanWithDetails(pool, cityPlan) {
  const clusters = await pool.query(
    'SELECT * FROM plan_clusters WHERE city_plan_id = $1 ORDER BY display_order',
    [cityPlan.id]
  );

  const clustersWithItems = await Promise.all(
    clusters.rows.map(async (cluster) => {
      const items = await pool.query(
        'SELECT * FROM plan_items WHERE cluster_id = $1 ORDER BY display_order',
        [cluster.id]
      );

      const cardItems = items.rows.map((item) => item.card_data);

      return {
        id: cluster.id,
        name: cluster.name,
        center: {
          lat: parseFloat(cluster.center_lat) || 0,
          lng: parseFloat(cluster.center_lng) || 0,
        },
        items: cardItems,
        totalDuration: cardItems.reduce((sum, item) => sum + (item?.duration || 0), 0),
        maxWalkingDistance: calculateMaxWalkingDistance(cardItems),
      };
    })
  );

  const unclustered = await pool.query(
    'SELECT * FROM plan_items WHERE city_plan_id = $1 AND cluster_id IS NULL ORDER BY display_order',
    [cityPlan.id]
  );

  return {
    id: cityPlan.id,
    cityId: cityPlan.city_id,
    city: cityPlan.city_data,
    clusters: clustersWithItems,
    unclustered: unclustered.rows.map((item) => item.card_data),
    suggestedClusters: generateSuggestedClusters(cityPlan.city_data),
  };
}

/**
 * Create a new plan from route data
 */
async function createPlanFromRoute(pool, routeId, route, userId) {
  const routeData = route.route_data || {};
  const waypoints = routeData.waypoints || [];

  const planId = generateId('plan');

  // Insert plan
  await pool.query(
    `INSERT INTO trip_plans (id, route_id, user_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'planning', NOW(), NOW())`,
    [planId, routeId, userId]
  );

  // Create city plans
  const cities = [];
  for (let i = 0; i < waypoints.length; i++) {
    const waypoint = waypoints[i];
    const cityPlanId = generateId('city');

    const cityData = {
      id: waypoint.id || `city-${i}`,
      name: waypoint.name || waypoint.city || 'Unknown',
      country: waypoint.country || '',
      coordinates: {
        lat: waypoint.lat || waypoint.latitude || 0,
        lng: waypoint.lng || waypoint.longitude || 0,
      },
      nights: waypoint.nights || 1,
      isOrigin: i === 0,
      isDestination: i === waypoints.length - 1,
      imageUrl: waypoint.imageUrl || null,
    };

    await pool.query(
      `INSERT INTO city_plans (id, trip_plan_id, city_id, city_data, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [cityPlanId, planId, cityData.id, cityData, i]
    );

    cities.push({
      id: cityPlanId,
      cityId: cityData.id,
      city: cityData,
      clusters: [],
      unclustered: [],
      suggestedClusters: generateSuggestedClusters(cityData),
    });
  }

  return {
    id: planId,
    routeId,
    userId,
    status: 'planning',
    cities,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Save plan changes
 */
async function savePlan(pool, planId, cities) {
  for (const cityPlan of cities) {
    // Find city plan
    const existing = await pool.query(
      'SELECT id FROM city_plans WHERE trip_plan_id = $1 AND city_id = $2',
      [planId, cityPlan.cityId]
    );

    if (existing.rows.length === 0) continue;

    const cityPlanId = existing.rows[0].id;

    // Clear existing items
    await pool.query('DELETE FROM plan_items WHERE city_plan_id = $1', [cityPlanId]);
    await pool.query('DELETE FROM plan_clusters WHERE city_plan_id = $1', [cityPlanId]);

    // Insert clusters with items
    for (let i = 0; i < (cityPlan.clusters || []).length; i++) {
      const cluster = cityPlan.clusters[i];

      await pool.query(
        `INSERT INTO plan_clusters (id, city_plan_id, name, center_lat, center_lng, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [cluster.id, cityPlanId, cluster.name, cluster.center?.lat, cluster.center?.lng, i]
      );

      for (let j = 0; j < (cluster.items || []).length; j++) {
        const item = cluster.items[j];
        await pool.query(
          `INSERT INTO plan_items (id, city_plan_id, cluster_id, card_data, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.id || generateId('item'), cityPlanId, cluster.id, item, j]
        );
      }
    }

    // Insert unclustered items
    for (let i = 0; i < (cityPlan.unclustered || []).length; i++) {
      const item = cityPlan.unclustered[i];
      await pool.query(
        `INSERT INTO plan_items (id, city_plan_id, cluster_id, card_data, display_order)
         VALUES ($1, $2, NULL, $3, $4)`,
        [item.id || generateId('item'), cityPlanId, item, i]
      );
    }
  }

  // Update timestamp
  await pool.query('UPDATE trip_plans SET updated_at = NOW() WHERE id = $1', [planId]);

  return { success: true, updatedAt: new Date() };
}

// ============================================
// Cluster Operations
// ============================================

/**
 * Create a new cluster
 */
async function createCluster(pool, cityPlanId, name, center, initialItems = []) {
  const clusterId = generateId('cluster');

  // Get next display order
  const orderResult = await pool.query(
    'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM plan_clusters WHERE city_plan_id = $1',
    [cityPlanId]
  );

  await pool.query(
    `INSERT INTO plan_clusters (id, city_plan_id, name, center_lat, center_lng, display_order)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [clusterId, cityPlanId, name, center?.lat, center?.lng, orderResult.rows[0].next_order]
  );

  // Add initial items
  for (let i = 0; i < initialItems.length; i++) {
    const item = initialItems[i];
    await pool.query(
      `INSERT INTO plan_items (id, city_plan_id, cluster_id, card_data, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [item.id || generateId('item'), cityPlanId, clusterId, item, i]
    );
  }

  return {
    id: clusterId,
    name,
    center: center || { lat: 0, lng: 0 },
    items: initialItems,
    totalDuration: initialItems.reduce((sum, item) => sum + (item.duration || 0), 0),
    maxWalkingDistance: 0,
  };
}

/**
 * Update a cluster
 */
async function updateCluster(pool, clusterId, updates) {
  if (updates.name) {
    await pool.query('UPDATE plan_clusters SET name = $1 WHERE id = $2', [updates.name, clusterId]);
  }

  // Handle item additions
  if (updates.addItems && updates.addItems.length > 0) {
    const cluster = await pool.query(
      'SELECT city_plan_id FROM plan_clusters WHERE id = $1',
      [clusterId]
    );

    if (cluster.rows.length > 0) {
      const cityPlanId = cluster.rows[0].city_plan_id;
      const orderResult = await pool.query(
        'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM plan_items WHERE cluster_id = $1',
        [clusterId]
      );

      let displayOrder = orderResult.rows[0].next_order;
      for (const item of updates.addItems) {
        await pool.query(
          `INSERT INTO plan_items (id, city_plan_id, cluster_id, card_data, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.id || generateId('item'), cityPlanId, clusterId, item, displayOrder++]
        );
      }
    }
  }

  // Handle item removals
  if (updates.removeItemIds && updates.removeItemIds.length > 0) {
    await pool.query(
      'DELETE FROM plan_items WHERE id = ANY($1) AND cluster_id = $2',
      [updates.removeItemIds, clusterId]
    );
  }

  return await getClusterWithItems(pool, clusterId);
}

/**
 * Delete a cluster (move items to unclustered)
 */
async function deleteCluster(pool, clusterId) {
  // Move items to unclustered
  await pool.query('UPDATE plan_items SET cluster_id = NULL WHERE cluster_id = $1', [clusterId]);

  // Delete cluster
  await pool.query('DELETE FROM plan_clusters WHERE id = $1', [clusterId]);

  return { success: true };
}

/**
 * Get cluster with all items
 */
async function getClusterWithItems(pool, clusterId) {
  const cluster = await pool.query('SELECT * FROM plan_clusters WHERE id = $1', [clusterId]);

  if (cluster.rows.length === 0) {
    return null;
  }

  const items = await pool.query(
    'SELECT * FROM plan_items WHERE cluster_id = $1 ORDER BY display_order',
    [clusterId]
  );

  const cardItems = items.rows.map((item) => item.card_data);

  return {
    id: clusterId,
    name: cluster.rows[0].name,
    center: {
      lat: parseFloat(cluster.rows[0].center_lat) || 0,
      lng: parseFloat(cluster.rows[0].center_lng) || 0,
    },
    items: cardItems,
    totalDuration: cardItems.reduce((sum, item) => sum + (item?.duration || 0), 0),
    maxWalkingDistance: calculateMaxWalkingDistance(cardItems),
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate suggested clusters for a city
 * Phase 1: Default suggestions based on typical city areas
 * Phase 2+: Will integrate with City Intelligence for actual discovered areas
 */
function generateSuggestedClusters(cityData) {
  const cityName = cityData?.name || 'City';
  const center = cityData?.coordinates || { lat: 0, lng: 0 };

  // Generate varied default suggestions that work for most cities
  const suggestions = [
    {
      id: generateId('suggested'),
      name: 'Historic Center',
      description: `The heart of ${cityName} with historic architecture, main squares, and local atmosphere`,
      center: center,
    },
    {
      id: generateId('suggested'),
      name: 'Local Neighborhood',
      description: `A charming residential area where locals live, with authentic cafés and hidden gems`,
      center: {
        lat: center.lat + 0.01, // Slight offset to indicate different area
        lng: center.lng + 0.008,
      },
    },
    {
      id: generateId('suggested'),
      name: 'Waterfront & Views',
      description: `Scenic area with beautiful views, perfect for sunset walks and photo opportunities`,
      center: {
        lat: center.lat - 0.008,
        lng: center.lng + 0.01,
      },
    },
  ];

  return suggestions;
}

/**
 * Calculate maximum walking distance between items in a cluster
 */
function calculateMaxWalkingDistance(items) {
  if (!items || items.length < 2) return 0;

  let maxDistance = 0;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const itemA = items[i];
      const itemB = items[j];

      if (itemA?.location && itemB?.location) {
        const distance = estimateWalkingTime(itemA.location, itemB.location);
        maxDistance = Math.max(maxDistance, distance);
      }
    }
  }

  return maxDistance;
}

/**
 * Estimate walking time between two points
 */
function estimateWalkingTime(from, to) {
  if (!from || !to) return 0;

  const R = 6371; // Earth's radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  // Average walking speed: 5 km/h = ~12 min per km
  return Math.round(distance * 12);
}

module.exports = {
  generateId,
  getOrCreatePlan,
  loadPlanWithDetails,
  loadCityPlanWithDetails,
  createPlanFromRoute,
  savePlan,
  createCluster,
  updateCluster,
  deleteCluster,
  getClusterWithItems,
  generateSuggestedClusters,
  calculateMaxWalkingDistance,
  estimateWalkingTime,
};
