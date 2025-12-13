/**
 * Planning API Routes
 *
 * Routes for the proximity-based trip planner feature.
 * Handles plan CRUD, cluster operations, and companion interactions.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Database pool (passed from main server)
let pool;

function initializeRoutes(dbPool) {
  pool = dbPool;
  return router;
}

// ============================================
// Helper Functions
// ============================================

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Build initial plan from route data
 */
async function buildInitialPlan(routeId, routeData) {
  const cities = routeData.waypoints || [];

  return {
    id: generateId('plan'),
    routeId,
    userId: routeData.user_id || null,
    status: 'planning',
    cities: cities.map((city, index) => ({
      id: generateId('city'),
      cityId: city.id || `city-${index}`,
      city: {
        id: city.id || `city-${index}`,
        name: city.name || city.city || 'Unknown',
        country: city.country || '',
        coordinates: {
          lat: city.lat || city.latitude || 0,
          lng: city.lng || city.longitude || 0,
        },
        nights: city.nights || 1,
        isOrigin: index === 0,
        isDestination: index === cities.length - 1,
        imageUrl: city.imageUrl || null,
      },
      clusters: [],
      unclustered: [],
      suggestedClusters: generateSuggestedClusters(city),
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Generate day-based clusters for a city
 * Creates Day 1, Day 2, etc. based on the number of nights staying
 */
function generateSuggestedClusters(city) {
  const cityName = city.name || city.city || 'City';
  const nights = city.nights || city.suggestedNights || 2;
  const center = {
    lat: city.lat || city.latitude || city.coordinates?.lat || 0,
    lng: city.lng || city.longitude || city.coordinates?.lng || 0,
  };

  const suggestions = [];

  for (let i = 1; i <= nights; i++) {
    suggestions.push({
      id: generateId(`day-${i}`),
      name: `Day ${i}`,
      description: i === 1
        ? `Your first day exploring ${cityName}`
        : i === nights
          ? `Final day in ${cityName}`
          : `Day ${i} in ${cityName}`,
      dayNumber: i,
      center: center,
    });
  }

  return suggestions;
}

// ============================================
// Plan Routes
// ============================================

/**
 * POST /api/planning/start
 * Create a new route and planning state from discovery data
 * This allows users to start planning without a pre-existing route
 */
router.post('/start', async (req, res) => {
  try {
    const {
      origin,
      destination,
      waypoints,
      startDate,
      endDate,
      totalNights,
      travellerType,
      userId,
    } = req.body;

    // Validate required fields
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    // Generate a new route ID
    const routeId = generateId('route');

    // Build route data structure
    const routeData = {
      origin: origin.name || origin,
      destination: destination.name || destination,
      waypoints: waypoints || [],
      startDate,
      endDate,
      totalNights: totalNights || waypoints?.reduce((sum, w) => sum + (w.nights || 1), 0) || 1,
      travellerType: travellerType || 'couple',
    };

    // Insert route into planning_routes table (uses string IDs, not UUID)
    try {
      await pool.query(
        `INSERT INTO planning_routes (id, user_id, name, origin, destination, route_data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          routeId,
          userId || null,
          `${origin.name || origin} to ${destination.name || destination}`,
          origin.name || origin,
          destination.name || destination,
          routeData,
        ]
      );
      console.log('[planning] Route saved to database:', routeId);
    } catch (dbError) {
      console.error('[planning] Error creating route:', dbError);
      throw new Error('Failed to create planning route');
    }

    // Build initial plan with city data from waypoints
    const cities = [
      // Origin city
      {
        id: origin.id || 'origin',
        name: origin.name || origin,
        country: origin.country || '',
        coordinates: origin.coordinates || { lat: 0, lng: 0 },
        nights: 1,
        isOrigin: true,
        isDestination: false,
      },
      // Waypoint cities
      ...(waypoints || []).map((city, index) => ({
        id: city.id || `city-${index}`,
        name: city.name || city.city || 'Unknown',
        country: city.country || '',
        coordinates: city.coordinates || { lat: city.lat || 0, lng: city.lng || 0 },
        nights: city.nights || city.suggestedNights || 1,
        isOrigin: false,
        isDestination: false,
      })),
      // Destination city
      {
        id: destination.id || 'destination',
        name: destination.name || destination,
        country: destination.country || '',
        coordinates: destination.coordinates || { lat: 0, lng: 0 },
        nights: 2,
        isOrigin: false,
        isDestination: true,
      },
    ];

    // Create trip plan
    const tripPlan = {
      id: generateId('plan'),
      routeId,
      userId: userId || null,
      status: 'planning',
      cities: cities.map((city, index) => ({
        id: generateId('cityplan'),
        cityId: city.id,
        city: city,
        clusters: [],
        unclustered: [],
        suggestedClusters: generateSuggestedClusters(city),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save trip plan to database
    try {
      await pool.query(
        `INSERT INTO trip_plans (id, route_id, user_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tripPlan.id, routeId, userId || null, 'planning', tripPlan.createdAt, tripPlan.updatedAt]
      );

      // Save city plans
      for (let i = 0; i < tripPlan.cities.length; i++) {
        const cityPlan = tripPlan.cities[i];
        await pool.query(
          `INSERT INTO city_plans (id, trip_plan_id, city_id, city_data, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [cityPlan.id, tripPlan.id, cityPlan.cityId, cityPlan.city, i]
        );
      }
    } catch (dbError) {
      console.error('[planning] Error saving plan:', dbError);
      // Continue - return plan in memory
    }

    console.log('[planning] Created new planning route:', routeId);

    res.json({
      routeId,
      tripPlan,
    });
  } catch (error) {
    console.error('[planning] POST /start error:', error);
    res.status(500).json({ error: 'Failed to start planning' });
  }
});

/**
 * GET /api/planning/:routeId
 * Get or create planning state for a route
 */
router.get('/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;

    // First, check if we have an existing plan
    const existingPlan = await pool.query(
      'SELECT * FROM trip_plans WHERE route_id = $1',
      [routeId]
    ).catch(() => ({ rows: [] }));

    if (existingPlan.rows.length > 0) {
      // Load existing plan with all its data
      const plan = existingPlan.rows[0];

      // Load city plans
      const cityPlans = await pool.query(
        'SELECT * FROM city_plans WHERE trip_plan_id = $1 ORDER BY display_order',
        [plan.id]
      ).catch(() => ({ rows: [] }));

      // Load clusters for each city
      const cities = await Promise.all(
        cityPlans.rows.map(async (cityPlan) => {
          const clusters = await pool.query(
            'SELECT * FROM plan_clusters WHERE city_plan_id = $1 ORDER BY display_order',
            [cityPlan.id]
          ).catch(() => ({ rows: [] }));

          // Load items for each cluster
          const clustersWithItems = await Promise.all(
            clusters.rows.map(async (cluster) => {
              const items = await pool.query(
                'SELECT * FROM plan_items WHERE cluster_id = $1 ORDER BY display_order',
                [cluster.id]
              ).catch(() => ({ rows: [] }));

              return {
                id: cluster.id,
                name: cluster.name,
                center: {
                  lat: parseFloat(cluster.center_lat) || 0,
                  lng: parseFloat(cluster.center_lng) || 0,
                },
                items: items.rows.map((item) => item.card_data),
                totalDuration: items.rows.reduce((sum, item) =>
                  sum + (item.card_data?.duration || 0), 0),
                maxWalkingDistance: 5, // Placeholder
              };
            })
          );

          // Load unclustered items
          const unclustered = await pool.query(
            'SELECT * FROM plan_items WHERE city_plan_id = $1 AND cluster_id IS NULL ORDER BY display_order',
            [cityPlan.id]
          ).catch(() => ({ rows: [] }));

          return {
            id: cityPlan.id,
            cityId: cityPlan.city_id,
            city: cityPlan.city_data,
            clusters: clustersWithItems,
            unclustered: unclustered.rows.map((item) => item.card_data),
            suggestedClusters: generateSuggestedClusters(cityPlan.city_data),
          };
        })
      );

      return res.json({
        tripPlan: {
          id: plan.id,
          routeId: plan.route_id,
          userId: plan.user_id,
          status: plan.status,
          cities,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at,
        },
      });
    }

    // No existing plan - fetch route data and create initial plan
    const routeResult = await pool.query(
      'SELECT * FROM planning_routes WHERE id = $1',
      [routeId]
    ).catch(() => ({ rows: [] }));

    if (routeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const route = routeResult.rows[0];
    const routeData = route.route_data || {};

    // Build initial plan from route
    const tripPlan = await buildInitialPlan(routeId, routeData);

    // Save the new plan to database
    try {
      await pool.query(
        `INSERT INTO trip_plans (id, route_id, user_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tripPlan.id, routeId, tripPlan.userId, tripPlan.status, tripPlan.createdAt, tripPlan.updatedAt]
      );

      // Save city plans
      for (let i = 0; i < tripPlan.cities.length; i++) {
        const cityPlan = tripPlan.cities[i];
        await pool.query(
          `INSERT INTO city_plans (id, trip_plan_id, city_id, city_data, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [cityPlan.id, tripPlan.id, cityPlan.cityId, cityPlan.city, i]
        );
      }
    } catch (dbError) {
      console.error('[planning] Error saving new plan:', dbError);
      // Continue even if save fails - return the plan in memory
    }

    res.json({ tripPlan });
  } catch (error) {
    console.error('[planning] GET /:routeId error:', error);
    res.status(500).json({ error: 'Failed to get planning data' });
  }
});

/**
 * POST /api/planning/:routeId/save
 * Save the current plan state
 */
router.post('/:routeId/save', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { cities } = req.body;

    // Find the plan
    const planResult = await pool.query(
      'SELECT id FROM trip_plans WHERE route_id = $1',
      [routeId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const planId = planResult.rows[0].id;

    // Update each city's clusters and items
    for (const cityPlan of cities) {
      // Find or create city plan
      let cityPlanId;
      const existingCity = await pool.query(
        'SELECT id FROM city_plans WHERE trip_plan_id = $1 AND city_id = $2',
        [planId, cityPlan.cityId]
      );

      if (existingCity.rows.length > 0) {
        cityPlanId = existingCity.rows[0].id;
      } else {
        cityPlanId = generateId('city');
        await pool.query(
          `INSERT INTO city_plans (id, trip_plan_id, city_id, city_data, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [cityPlanId, planId, cityPlan.cityId, cityPlan.city, 0]
        );
      }

      // Delete existing clusters and items for this city
      await pool.query(
        'DELETE FROM plan_items WHERE city_plan_id = $1',
        [cityPlanId]
      );
      await pool.query(
        'DELETE FROM plan_clusters WHERE city_plan_id = $1',
        [cityPlanId]
      );

      // Insert clusters
      for (let i = 0; i < (cityPlan.clusters || []).length; i++) {
        const cluster = cityPlan.clusters[i];
        await pool.query(
          `INSERT INTO plan_clusters (id, city_plan_id, name, center_lat, center_lng, display_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [cluster.id, cityPlanId, cluster.name, cluster.center?.lat, cluster.center?.lng, i]
        );

        // Insert items in cluster
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

    // Update plan timestamp
    await pool.query(
      'UPDATE trip_plans SET updated_at = NOW() WHERE id = $1',
      [planId]
    );

    res.json({ success: true, updatedAt: new Date() });
  } catch (error) {
    console.error('[planning] POST /:routeId/save error:', error);
    res.status(500).json({ error: 'Failed to save plan' });
  }
});

// ============================================
// Cluster Routes
// ============================================

/**
 * POST /api/planning/:routeId/clusters
 * Create a new cluster
 */
router.post('/:routeId/clusters', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { cityId, name, center, initialItems } = req.body;

    // Find the city plan
    const cityPlan = await pool.query(
      `SELECT cp.id FROM city_plans cp
       JOIN trip_plans tp ON cp.trip_plan_id = tp.id
       WHERE tp.route_id = $1 AND cp.city_id = $2`,
      [routeId, cityId]
    );

    if (cityPlan.rows.length === 0) {
      return res.status(404).json({ error: 'City plan not found' });
    }

    const cityPlanId = cityPlan.rows[0].id;

    // Get display order
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM plan_clusters WHERE city_plan_id = $1',
      [cityPlanId]
    );
    const displayOrder = orderResult.rows[0].next_order;

    // Create cluster
    const clusterId = generateId('cluster');
    await pool.query(
      `INSERT INTO plan_clusters (id, city_plan_id, name, center_lat, center_lng, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clusterId, cityPlanId, name, center?.lat, center?.lng, displayOrder]
    );

    // Add initial items if provided
    if (initialItems && initialItems.length > 0) {
      for (let i = 0; i < initialItems.length; i++) {
        const item = initialItems[i];
        await pool.query(
          `INSERT INTO plan_items (id, city_plan_id, cluster_id, card_data, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.id || generateId('item'), cityPlanId, clusterId, item, i]
        );
      }
    }

    const cluster = {
      id: clusterId,
      name,
      center: center || { lat: 0, lng: 0 },
      items: initialItems || [],
      totalDuration: (initialItems || []).reduce((sum, item) => sum + (item.duration || 0), 0),
      maxWalkingDistance: 0,
    };

    res.json({ cluster });
  } catch (error) {
    console.error('[planning] POST /:routeId/clusters error:', error);
    res.status(500).json({ error: 'Failed to create cluster' });
  }
});

/**
 * PUT /api/planning/:routeId/clusters/:clusterId
 * Update a cluster
 */
router.put('/:routeId/clusters/:clusterId', async (req, res) => {
  try {
    const { clusterId } = req.params;
    const { name, addItems, removeItemIds, reorderItems } = req.body;

    // Update name if provided
    if (name) {
      await pool.query(
        'UPDATE plan_clusters SET name = $1 WHERE id = $2',
        [name, clusterId]
      );
    }

    // Add items if provided
    if (addItems && addItems.length > 0) {
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

        for (const item of addItems) {
          await pool.query(
            `INSERT INTO plan_items (id, city_plan_id, cluster_id, card_data, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [item.id || generateId('item'), cityPlanId, clusterId, item, displayOrder++]
          );
        }
      }
    }

    // Remove items if provided
    if (removeItemIds && removeItemIds.length > 0) {
      await pool.query(
        'DELETE FROM plan_items WHERE id = ANY($1) AND cluster_id = $2',
        [removeItemIds, clusterId]
      );
    }

    // Get updated cluster
    const updatedCluster = await pool.query(
      'SELECT * FROM plan_clusters WHERE id = $1',
      [clusterId]
    );

    const items = await pool.query(
      'SELECT * FROM plan_items WHERE cluster_id = $1 ORDER BY display_order',
      [clusterId]
    );

    const cluster = {
      id: clusterId,
      name: updatedCluster.rows[0]?.name || name,
      center: {
        lat: parseFloat(updatedCluster.rows[0]?.center_lat) || 0,
        lng: parseFloat(updatedCluster.rows[0]?.center_lng) || 0,
      },
      items: items.rows.map((item) => item.card_data),
      totalDuration: items.rows.reduce((sum, item) => sum + (item.card_data?.duration || 0), 0),
      maxWalkingDistance: 5,
    };

    res.json({ cluster });
  } catch (error) {
    console.error('[planning] PUT /:routeId/clusters/:clusterId error:', error);
    res.status(500).json({ error: 'Failed to update cluster' });
  }
});

/**
 * DELETE /api/planning/:routeId/clusters/:clusterId
 * Delete a cluster (items move to unclustered)
 */
router.delete('/:routeId/clusters/:clusterId', async (req, res) => {
  try {
    const { clusterId } = req.params;

    // Move items to unclustered (set cluster_id to NULL)
    await pool.query(
      'UPDATE plan_items SET cluster_id = NULL WHERE cluster_id = $1',
      [clusterId]
    );

    // Delete the cluster
    await pool.query(
      'DELETE FROM plan_clusters WHERE id = $1',
      [clusterId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[planning] DELETE /:routeId/clusters/:clusterId error:', error);
    res.status(500).json({ error: 'Failed to delete cluster' });
  }
});

// ============================================
// Card Generation
// ============================================

const cardGenerationService = require('../services/cardGenerationService');
const { getImageService } = require('../services/imageService');

/**
 * POST /api/planning/:routeId/generate
 * Generate new suggestion cards using Claude
 */
router.post('/:routeId/generate', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { cityId, type, count = 4, filters, excludeIds } = req.body;

    console.log('[planning] Generate cards request:', { routeId, cityId, type, count });

    // Load route and city data for context
    const routeResult = await pool.query(
      'SELECT * FROM planning_routes WHERE id = $1',
      [routeId]
    ).catch(() => ({ rows: [] }));

    let cityName = cityId;
    let cityCoordinates = { lat: 0, lng: 0 };
    let clusters = [];

    if (routeResult.rows.length > 0) {
      const routeData = routeResult.rows[0].route_data || {};
      const waypoints = routeData.waypoints || [];
      const city = waypoints.find(w => w.id === cityId || w.name === cityId);
      if (city) {
        cityName = city.name || city.city || cityId;
        cityCoordinates = {
          lat: city.lat || city.latitude || 0,
          lng: city.lng || city.longitude || 0,
        };
      }
    }

    // Load existing clusters for proximity calculation
    const planResult = await pool.query(
      'SELECT id FROM trip_plans WHERE route_id = $1',
      [routeId]
    ).catch(() => ({ rows: [] }));

    if (planResult.rows.length > 0) {
      const planId = planResult.rows[0].id;
      const cityPlanResult = await pool.query(
        'SELECT id FROM city_plans WHERE trip_plan_id = $1 AND city_id = $2',
        [planId, cityId]
      ).catch(() => ({ rows: [] }));

      if (cityPlanResult.rows.length > 0) {
        const cityPlanId = cityPlanResult.rows[0].id;
        const clusterResult = await pool.query(
          'SELECT * FROM plan_clusters WHERE city_plan_id = $1',
          [cityPlanId]
        ).catch(() => ({ rows: [] }));

        clusters = clusterResult.rows.map(c => ({
          id: c.id,
          name: c.name,
          center: {
            lat: parseFloat(c.center_lat) || cityCoordinates.lat,
            lng: parseFloat(c.center_lng) || cityCoordinates.lng,
          },
        }));
      }
    }

    // If no clusters, create a virtual one at city center for proximity
    if (clusters.length === 0 && cityCoordinates.lat !== 0) {
      clusters = [{
        id: 'city-center',
        name: 'City Center',
        center: cityCoordinates,
      }];
    }

    // Get existing item names to exclude
    let existingNames = [];
    if (planResult.rows.length > 0) {
      const itemsResult = await pool.query(
        `SELECT pi.card_data FROM plan_items pi
         JOIN city_plans cp ON pi.city_plan_id = cp.id
         JOIN trip_plans tp ON cp.trip_plan_id = tp.id
         WHERE tp.route_id = $1`,
        [routeId]
      ).catch(() => ({ rows: [] }));

      existingNames = itemsResult.rows
        .map(r => r.card_data?.name)
        .filter(Boolean);
    }

    // Generate cards using Claude
    const generatedCards = await cardGenerationService.generateCards({
      cityId,
      cityName,
      type,
      count,
      filters,
      excludeIds,
      context: {
        travelerType: 'couple',
        clusterNames: clusters.map(c => c.name),
        excludeNames: existingNames,
        nights: 2,
      },
    });

    // Enrich with proximity data
    const enrichedCards = cardGenerationService.enrichWithProximity(generatedCards, clusters);

    // Sort by proximity
    const sortedCards = cardGenerationService.sortByProximity(enrichedCards);

    // Return cards with proximity info
    let cards = sortedCards.map(item => ({
      ...item.card,
      proximity: item.nearestCluster ? {
        clusterName: item.nearestCluster.name,
        walkingMinutes: item.nearestCluster.walkingMinutes,
        isNear: item.isNearPlan,
      } : null,
    }));

    // Enrich cards with images (async, non-blocking)
    try {
      const imageService = getImageService(pool);
      cards = await imageService.enrichCardsWithImages(cards, cityName);
    } catch (imageError) {
      console.warn('[planning] Image enrichment failed:', imageError.message);
      // Continue without images
    }

    res.json({
      cards,
      hasMore: true,
    });
  } catch (error) {
    console.error('[planning] POST /:routeId/generate error:', error);
    res.status(500).json({ error: 'Failed to generate cards' });
  }
});

// ============================================
// Companion - AI Planning Assistant
// ============================================

const { handleCompanionMessage, generateReactiveMessage } = require('../agents/planningAgent');

/**
 * GET /api/planning/:routeId/companion/stream
 * SSE streaming endpoint for companion messages
 */
router.get('/:routeId/companion/stream', async (req, res) => {
  const { routeId } = req.params;
  const { message, cityId, context: contextJson } = req.query;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Parse context
  let context = {};
  try {
    if (contextJson) {
      context = JSON.parse(decodeURIComponent(contextJson));
    }
  } catch (e) {
    console.error('[planning] Failed to parse context:', e);
  }

  // Load additional context from database
  try {
    // Get route data for city info
    const routeResult = await pool.query(
      'SELECT * FROM planning_routes WHERE id = $1',
      [routeId]
    ).catch(() => ({ rows: [] }));

    let cityName = cityId;
    let cityData = null;

    if (routeResult.rows.length > 0) {
      const routeData = routeResult.rows[0].route_data || {};
      const waypoints = routeData.waypoints || [];
      const city = waypoints.find(w => w.id === cityId || w.name === cityId);
      if (city) {
        cityName = city.name || city.city || cityId;
        cityData = city;
      }
    }

    // Enrich context
    const enrichedContext = {
      ...context,
      cityName,
      cityData,
      travelerType: context.preferences?.travelerType || 'couple',
      preferences: context.preferences || {},
    };

    console.log('[planning] Companion stream started:', { routeId, cityId, message: message?.substring(0, 50) });

    // Stream events from planning agent
    for await (const event of handleCompanionMessage(message, enrichedContext)) {
      const eventData = JSON.stringify(event);
      res.write(`data: ${eventData}\n\n`);

      // Flush to ensure immediate delivery
      if (res.flush) res.flush();
    }
  } catch (error) {
    console.error('[planning] Companion stream error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  }

  res.end();
});

/**
 * POST /api/planning/:routeId/companion
 * Non-streaming fallback for companion messages
 */
router.post('/:routeId/companion', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { cityId, message, context } = req.body;

    console.log('[planning] Companion message (non-streaming):', { routeId, cityId, message: message?.substring(0, 50) });

    // Get route data for city info
    const routeResult = await pool.query(
      'SELECT * FROM planning_routes WHERE id = $1',
      [routeId]
    ).catch(() => ({ rows: [] }));

    let cityName = cityId;
    let cityData = null;

    if (routeResult.rows.length > 0) {
      const routeData = routeResult.rows[0].route_data || {};
      const waypoints = routeData.waypoints || [];
      const city = waypoints.find(w => w.id === cityId || w.name === cityId);
      if (city) {
        cityName = city.name || city.city || cityId;
        cityData = city;
      }
    }

    // Enrich context
    const enrichedContext = {
      ...context,
      cityName,
      cityData,
      travelerType: context?.preferences?.travelerType || 'couple',
      preferences: context?.preferences || {},
    };

    // Collect all events
    let responseText = '';
    let cards = [];
    let actions = [];

    for await (const event of handleCompanionMessage(message, enrichedContext)) {
      switch (event.type) {
        case 'message':
          responseText += event.content;
          break;
        case 'cards':
          cards = event.cards;
          break;
        case 'actions':
          actions = event.actions;
          break;
        case 'error':
          throw new Error(event.error);
      }
    }

    res.json({
      message: responseText,
      cards,
      actions,
    });
  } catch (error) {
    console.error('[planning] POST /:routeId/companion error:', error);
    res.status(500).json({ error: 'Failed to process companion message' });
  }
});

/**
 * POST /api/planning/:routeId/companion/reactive
 * Trigger reactive message based on user action
 */
router.post('/:routeId/companion/reactive', async (req, res) => {
  try {
    const { action, context } = req.body;

    console.log('[planning] Reactive trigger:', action?.type);

    const events = await generateReactiveMessage(action, context);

    if (!events || events.length === 0) {
      return res.json({ triggered: false });
    }

    // Extract final message and cards
    let responseText = '';
    let cards = [];
    let actions = [];

    for (const event of events) {
      switch (event.type) {
        case 'message':
          responseText += event.content;
          break;
        case 'cards':
          cards = event.cards;
          break;
        case 'actions':
          actions = event.actions;
          break;
      }
    }

    res.json({
      triggered: true,
      message: responseText,
      cards,
      actions,
    });
  } catch (error) {
    console.error('[planning] POST /:routeId/companion/reactive error:', error);
    res.status(500).json({ error: 'Failed to generate reactive message' });
  }
});

// ============================================
// Auto-Clustering Item Addition
// ============================================

// Maximum walking time (minutes) to consider items as part of the same cluster
const MAX_WALKING_MINUTES = 15;

// Types that count as "activities" for restaurant placement logic
const ACTIVITY_TYPES = ['activity', 'photo_spot', 'experience'];
const RESTAURANT_TYPES = ['restaurant', 'bar', 'cafe'];

/**
 * Calculate walking time between two points (in minutes)
 */
function calculateWalkingMinutes(from, to) {
  if (!from || !to || !from.lat || !to.lat) return Infinity;

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
  const distanceKm = R * c;

  // Average walking speed: 5 km/h, add 20% for non-straight paths
  const walkingHours = (distanceKm / 5) * 1.2;
  return Math.round(walkingHours * 60);
}

/**
 * Calculate the center point from items
 */
function calculateClusterCenter(items) {
  if (items.length === 0) return { lat: 0, lng: 0 };

  const validItems = items.filter(item => item.location?.lat && item.location?.lng);
  if (validItems.length === 0) return { lat: 0, lng: 0 };

  const sumLat = validItems.reduce((sum, item) => sum + item.location.lat, 0);
  const sumLng = validItems.reduce((sum, item) => sum + item.location.lng, 0);

  return {
    lat: sumLat / validItems.length,
    lng: sumLng / validItems.length,
  };
}

/**
 * Find the best cluster for a restaurant based on activity presence
 */
function findBestClusterForRestaurant(clusters, restaurant) {
  const clustersWithActivities = clusters
    .map(cluster => ({
      cluster,
      activityCount: cluster.items.filter(i => ACTIVITY_TYPES.includes(i.type)).length,
    }))
    .filter(c => c.activityCount > 0)
    .sort((a, b) => b.activityCount - a.activityCount);

  for (const { cluster } of clustersWithActivities) {
    const walkingTime = calculateWalkingMinutes(restaurant.location, cluster.center);
    if (walkingTime <= MAX_WALKING_MINUTES) {
      return cluster;
    }
  }

  return null;
}

/**
 * Find the best existing cluster for an item, or determine a new cluster is needed
 */
function findBestClusterForItem(clusters, newItem) {
  // If no item location, can't determine proximity
  if (!newItem.location?.lat || !newItem.location?.lng) {
    if (clusters.length > 0) {
      return { clusterId: clusters[0].id, shouldCreateNew: false, suggestedName: '' };
    }
    return {
      clusterId: null,
      shouldCreateNew: true,
      suggestedName: newItem.location?.area || 'New Area',
    };
  }

  // For restaurants/bars, prefer clusters with activities
  if (RESTAURANT_TYPES.includes(newItem.type)) {
    const clusterWithActivities = findBestClusterForRestaurant(clusters, newItem);
    if (clusterWithActivities) {
      return { clusterId: clusterWithActivities.id, shouldCreateNew: false, suggestedName: '' };
    }
  }

  // Find nearest cluster within walking distance
  let nearestCluster = null;
  let nearestDistance = Infinity;

  for (const cluster of clusters) {
    const walkingTime = calculateWalkingMinutes(newItem.location, cluster.center);

    if (walkingTime <= MAX_WALKING_MINUTES && walkingTime < nearestDistance) {
      nearestDistance = walkingTime;
      nearestCluster = cluster;
    }
  }

  if (nearestCluster) {
    return { clusterId: nearestCluster.id, shouldCreateNew: false, suggestedName: '' };
  }

  // No nearby cluster - need to create a new one
  return {
    clusterId: null,
    shouldCreateNew: true,
    suggestedName: newItem.location?.area || 'New Area',
  };
}

/**
 * Get neighborhood name from coordinates using reverse geocoding
 * Falls back to area from card or generic name
 */
async function getNeighborhoodName(location, cityName) {
  // Try to get neighborhood from Mapbox (if API key available)
  const mapboxKey = process.env.MAPBOX_ACCESS_TOKEN;
  if (mapboxKey && location?.lat && location?.lng) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.lng},${location.lat}.json?types=neighborhood,locality&access_token=${mapboxKey}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        // Get the most specific neighborhood name
        const neighborhood = data.features.find(f => f.place_type.includes('neighborhood'));
        if (neighborhood) {
          return neighborhood.text;
        }
        const locality = data.features.find(f => f.place_type.includes('locality'));
        if (locality) {
          return locality.text;
        }
      }
    } catch (error) {
      console.warn('[planning] Reverse geocoding failed:', error.message);
    }
  }

  // Fallback: use area from location or generate generic name
  if (location?.area) {
    return location.area;
  }

  return `${cityName} Area`;
}

/**
 * POST /api/planning/:routeId/add-item
 * Add an item and auto-assign to the best cluster
 */
router.post('/:routeId/add-item', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { cityId, card } = req.body;

    if (!cityId || !card) {
      return res.status(400).json({ error: 'cityId and card are required' });
    }

    console.log('[planning] Add item request:', { routeId, cityId, cardName: card.name, cardType: card.type });

    // 1. Get the trip plan and city plan
    const planResult = await pool.query(
      'SELECT id FROM trip_plans WHERE route_id = $1',
      [routeId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found for this route' });
    }

    const planId = planResult.rows[0].id;

    // 2. Get or create city plan
    let cityPlanId;
    const cityPlanResult = await pool.query(
      'SELECT id FROM city_plans WHERE trip_plan_id = $1 AND city_id = $2',
      [planId, cityId]
    );

    if (cityPlanResult.rows.length > 0) {
      cityPlanId = cityPlanResult.rows[0].id;
    } else {
      // Create city plan if it doesn't exist
      cityPlanId = generateId('cityplan');

      // Get city data from route
      const routeResult = await pool.query(
        'SELECT route_data FROM planning_routes WHERE id = $1',
        [routeId]
      );

      let cityData = { id: cityId, name: cityId };
      if (routeResult.rows.length > 0) {
        const routeData = routeResult.rows[0].route_data || {};
        const waypoints = routeData.waypoints || [];
        const city = waypoints.find(w => w.id === cityId || w.name === cityId);
        if (city) {
          cityData = city;
        }
      }

      await pool.query(
        `INSERT INTO city_plans (id, trip_plan_id, city_id, city_data, display_order)
         VALUES ($1, $2, $3, $4, 0)`,
        [cityPlanId, planId, cityId, cityData]
      );
    }

    // 3. Load existing clusters with their items
    const clusterResult = await pool.query(
      'SELECT * FROM plan_clusters WHERE city_plan_id = $1 ORDER BY display_order',
      [cityPlanId]
    );

    const clusters = await Promise.all(
      clusterResult.rows.map(async (c) => {
        const itemsResult = await pool.query(
          'SELECT * FROM plan_items WHERE cluster_id = $1 ORDER BY display_order',
          [c.id]
        );
        return {
          id: c.id,
          name: c.name,
          center: {
            lat: parseFloat(c.center_lat) || 0,
            lng: parseFloat(c.center_lng) || 0,
          },
          items: itemsResult.rows.map(i => i.card_data),
        };
      })
    );

    // 4. Find or determine cluster for this item
    const { clusterId: existingClusterId, shouldCreateNew, suggestedName } = findBestClusterForItem(clusters, card);

    let targetClusterId;
    let targetClusterName;
    let isNewCluster = false;

    if (shouldCreateNew) {
      // Get city name for neighborhood lookup
      const routeResult = await pool.query(
        'SELECT route_data FROM planning_routes WHERE id = $1',
        [routeId]
      );

      let cityName = cityId;
      if (routeResult.rows.length > 0) {
        const routeData = routeResult.rows[0].route_data || {};
        const waypoints = routeData.waypoints || [];
        const city = waypoints.find(w => w.id === cityId || w.name === cityId);
        if (city) {
          cityName = city.name || city.city || cityId;
        }
      }

      // Get neighborhood name via reverse geocoding
      const neighborhoodName = await getNeighborhoodName(card.location, cityName);
      targetClusterName = neighborhoodName || suggestedName;

      // Create new cluster
      targetClusterId = generateId('cluster');
      const clusterCenter = card.location || { lat: 0, lng: 0 };

      const displayOrder = clusters.length;
      await pool.query(
        `INSERT INTO plan_clusters (id, city_plan_id, name, center_lat, center_lng, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [targetClusterId, cityPlanId, targetClusterName, clusterCenter.lat, clusterCenter.lng, displayOrder]
      );

      isNewCluster = true;
      console.log('[planning] Created new cluster:', { targetClusterId, targetClusterName });
    } else {
      targetClusterId = existingClusterId;
      const existingCluster = clusters.find(c => c.id === existingClusterId);
      targetClusterName = existingCluster?.name || 'Unknown Area';
      console.log('[planning] Adding to existing cluster:', { targetClusterId, targetClusterName });
    }

    // 5. Add item to cluster
    const itemId = card.id || generateId('item');
    const itemOrder = await pool.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM plan_items WHERE cluster_id = $1',
      [targetClusterId]
    );

    await pool.query(
      `INSERT INTO plan_items (id, city_plan_id, cluster_id, card_data, display_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [itemId, cityPlanId, targetClusterId, { ...card, id: itemId }, itemOrder.rows[0].next_order]
    );

    // 6. Update cluster center if needed (average of all items)
    if (!isNewCluster) {
      const allItemsResult = await pool.query(
        'SELECT card_data FROM plan_items WHERE cluster_id = $1',
        [targetClusterId]
      );
      const allItems = allItemsResult.rows.map(r => r.card_data);
      const newCenter = calculateClusterCenter(allItems);

      await pool.query(
        'UPDATE plan_clusters SET center_lat = $1, center_lng = $2 WHERE id = $3',
        [newCenter.lat, newCenter.lng, targetClusterId]
      );
    }

    // 7. Update plan timestamp
    await pool.query(
      'UPDATE trip_plans SET updated_at = NOW() WHERE id = $1',
      [planId]
    );

    // 8. Return result
    res.json({
      success: true,
      itemId,
      clusterId: targetClusterId,
      clusterName: targetClusterName,
      isNewCluster,
    });
  } catch (error) {
    console.error('[planning] POST /:routeId/add-item error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

/**
 * DELETE /api/planning/:routeId/remove-item
 * Remove an item from a cluster
 */
router.delete('/:routeId/remove-item', async (req, res) => {
  try {
    const { routeId } = req.params;
    const { itemId, clusterId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    console.log('[planning] Remove item request:', { routeId, itemId, clusterId });

    // Delete the item
    await pool.query('DELETE FROM plan_items WHERE id = $1', [itemId]);

    // Check if cluster is now empty
    if (clusterId) {
      const remainingItems = await pool.query(
        'SELECT COUNT(*) as count FROM plan_items WHERE cluster_id = $1',
        [clusterId]
      );

      if (parseInt(remainingItems.rows[0].count) === 0) {
        // Delete empty cluster
        await pool.query('DELETE FROM plan_clusters WHERE id = $1', [clusterId]);
        console.log('[planning] Deleted empty cluster:', clusterId);
      } else {
        // Recalculate cluster center
        const allItemsResult = await pool.query(
          'SELECT card_data FROM plan_items WHERE cluster_id = $1',
          [clusterId]
        );
        const allItems = allItemsResult.rows.map(r => r.card_data);
        const newCenter = calculateClusterCenter(allItems);

        await pool.query(
          'UPDATE plan_clusters SET center_lat = $1, center_lng = $2 WHERE id = $3',
          [newCenter.lat, newCenter.lng, clusterId]
        );
      }
    }

    // Update plan timestamp
    const planResult = await pool.query(
      'SELECT id FROM trip_plans WHERE route_id = $1',
      [routeId]
    );
    if (planResult.rows.length > 0) {
      await pool.query(
        'UPDATE trip_plans SET updated_at = NOW() WHERE id = $1',
        [planResult.rows[0].id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[planning] DELETE /:routeId/remove-item error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// ============================================
// Utility Routes
// ============================================

/**
 * GET /api/planning/distance
 * Calculate walking distance between two points
 */
router.get('/distance', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to parameters required' });
    }

    const [fromLat, fromLng] = from.split(',').map(Number);
    const [toLat, toLng] = to.split(',').map(Number);

    // Simple distance calculation (Haversine)
    const R = 6371; // Earth's radius in km
    const dLat = ((toLat - fromLat) * Math.PI) / 180;
    const dLng = ((toLng - fromLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((fromLat * Math.PI) / 180) *
        Math.cos((toLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Assume average walking speed of 5 km/h = ~12 min per km
    const walkingMinutes = Math.round(distance * 12);

    res.json({
      walkingMinutes,
      transitMinutes: Math.round(walkingMinutes * 0.5), // Rough estimate
      drivingMinutes: Math.round(walkingMinutes * 0.3), // Rough estimate
    });
  } catch (error) {
    console.error('[planning] GET /distance error:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

module.exports = { initializeRoutes, router };
