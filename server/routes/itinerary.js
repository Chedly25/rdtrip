/**
 * Itinerary API Routes
 * Premium multi-agent itinerary generation system
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ItineraryAgentOrchestrator = require('../agents/ItineraryAgentOrchestrator');
const AgentOrchestratorV3 = require('../agents/AgentOrchestratorV3');
const jobQueue = require('../services/JobQueue');
const { generateItineraryPDF } = require('../export/generatePDF');
const { generateItineraryCalendar } = require('../export/generateICS');
const { generateGoogleMapsUrl, generateDayGoogleMapsUrl } = require('../export/generateGoogleMaps');

// Job storage (passed from main server) - kept for backwards compatibility
let itineraryJobs;
let pool;

function initializeRoutes(jobStorage, dbPool) {
  itineraryJobs = jobStorage;
  pool = dbPool;
  return router;
}

/**
 * GET /api/itinerary/by-route/:routeId
 * Get itinerary ID by route ID
 */
router.get('/by-route/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;

    const result = await pool.query(
      'SELECT id FROM itineraries WHERE route_id = $1 ORDER BY created_at DESC LIMIT 1',
      [routeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No itinerary found for this route' });
    }

    res.json({ itinerary_id: result.rows[0].id });
  } catch (error) {
    console.error('Get itinerary by route error:', error);
    res.status(500).json({ error: 'Failed to fetch itinerary' });
  }
});

/**
 * POST /api/itinerary/generate
 * Start itinerary generation and return itinerary ID immediately
 */
router.post('/generate', async (req, res) => {
  try {
    const { route_id, routeData, preferences } = req.body;

    console.log('📥 /api/itinerary/generate received:', {
      hasRouteData: !!routeData,
      hasWaypoints: !!routeData?.waypoints,
      waypointCount: routeData?.waypoints?.length || 0,
      waypoints: routeData?.waypoints,
      preferences: preferences
    });

    // Validate input
    if (!routeData || !routeData.waypoints) {
      return res.status(400).json({ error: 'Route data with waypoints required' });
    }

    // Create itinerary record immediately
    const agentType = routeData.agent || preferences?.travelStyle || 'best-overall';

    const insertQuery = `
      INSERT INTO itineraries (
        route_id, user_id, agent_type, preferences, processing_status
      ) VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      route_id,
      routeData.user_id || null,
      agentType,
      JSON.stringify(preferences)
    ]);

    const itineraryId = result.rows[0].id;

    console.log(`✅ Created itinerary record: ${itineraryId}`);

    // Add job to queue
    const enrichedRouteData = {
      ...routeData,
      id: route_id,
      user_id: routeData.user_id || null
    };

    // Choose orchestrator version (V3 = Google-first parallel, V2 = Legacy)
    const useV3 = process.env.USE_ORCHESTRATOR_V3 === 'true';

    jobQueue.addJob(
      itineraryId,
      async () => {
        if (useV3) {
          console.log('🚀 Using AgentOrchestratorV3 (Google-first parallel execution)');
          const orchestrator = new AgentOrchestratorV3(enrichedRouteData, preferences, pool, itineraryId);

          // Listen to orchestrator events and update database
          orchestrator.on('agent:complete', async (data) => {
            try {
              const agentName = typeof data.agent === 'string' ? data.agent : (data.agent?.name || String(data.agent));
              await pool.query(
                `UPDATE itineraries
                 SET progress = COALESCE(progress, '{}'::jsonb) || jsonb_build_object($1::text, 'completed'),
                     updated_at = NOW()
                 WHERE id = $2`,
                [agentName, itineraryId]
              );
            } catch (err) {
              console.warn('Failed to update progress:', err.message);
            }
          });

          const result = await orchestrator.execute();
          return result;

        } else {
          console.log('🔄 Using ItineraryAgentOrchestrator (V2 legacy)');
          const orchestrator = new ItineraryAgentOrchestrator(
            enrichedRouteData,
            preferences,
            pool,
            () => {} // No SSE callback needed - using database updates
          );
          orchestrator.itineraryId = itineraryId; // Set the pre-created ID
          return await orchestrator.generateCompleteAsync();
        }
      },
      { route_id, agent: agentType }
    );

    // Listen for job errors and update database
    const errorHandler = async (job, error) => {
      if (job.id === itineraryId) {
        try {
          await pool.query(
            `UPDATE itineraries
             SET processing_status = 'failed',
                 error_log = COALESCE(error_log, '[]'::jsonb) || $1::jsonb,
                 completed_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [JSON.stringify([{
              timestamp: new Date().toISOString(),
              message: error.message,
              stack: error.stack
            }]), itineraryId]
          );
          console.error(`💾 Updated database for failed job ${itineraryId}`);
        } catch (dbError) {
          console.error(`Failed to update database for failed job ${itineraryId}:`, dbError);
        }
        // Remove listener after handling
        jobQueue.off('job:error', errorHandler);
      }
    };

    jobQueue.on('job:error', errorHandler);

    // Return itinerary ID immediately
    res.json({
      itineraryId,
      status: 'pending',
      estimatedDuration: 90 // seconds (generous estimate for quality)
    });

  } catch (error) {
    console.error('Itinerary generation start error:', error);
    res.status(500).json({ error: 'Failed to start itinerary generation' });
  }
});

/**
 * GET /api/itinerary/:itineraryId/status
 * Get current generation status and progress
 */
router.get('/:itineraryId/status', async (req, res) => {
  try {
    const { itineraryId } = req.params;

    const result = await pool.query(
      `SELECT
        processing_status,
        progress,
        error_log,
        started_at,
        completed_at,
        created_at
      FROM itineraries
      WHERE id = $1`,
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const row = result.rows[0];

    // Also check job queue for additional metadata
    const jobStatus = jobQueue.getJobStatus(itineraryId);

    res.json({
      itineraryId,
      status: row.processing_status,
      progress: row.progress || {},
      errors: row.error_log || [],
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      duration: row.completed_at && row.started_at
        ? new Date(row.completed_at) - new Date(row.started_at)
        : row.started_at
          ? Date.now() - new Date(row.started_at)
          : null,
      jobQueue: jobStatus // Additional queue metadata if available
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * GET /api/itinerary/:itineraryId/stream
 * SSE endpoint for real-time V3 orchestrator progress updates
 * Streams agent:start, agent:complete, phase:start, phase:complete events
 */
router.get('/:itineraryId/stream', async (req, res) => {
  const { itineraryId } = req.params;

  try {
    // Verify itinerary exists
    const result = await pool.query(
      'SELECT id FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    console.log(`📡 V3 SSE client connected for itinerary ${itineraryId}`);

    // Send heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`:heartbeat\n\n`);
    }, 15000);

    // Poll database for progress updates
    let lastProgress = {};
    const progressInterval = setInterval(async () => {
      try {
        const statusResult = await pool.query(
          'SELECT processing_status, progress FROM itineraries WHERE id = $1',
          [itineraryId]
        );

        if (statusResult.rows.length === 0) {
          clearInterval(progressInterval);
          clearInterval(heartbeat);
          res.end();
          return;
        }

        const { processing_status, progress } = statusResult.rows[0];

        // Send progress updates for changed agents
        if (progress) {
          for (const [agent, status] of Object.entries(progress)) {
            if (lastProgress[agent] !== status) {
              const event = {
                agent,
                status,
                timestamp: Date.now()
              };
              res.write(`event: agent_progress\ndata: ${JSON.stringify(event)}\n\n`);
              lastProgress[agent] = status;
            }
          }
        }

        // Check if completed
        if (processing_status === 'completed' || processing_status === 'partial') {
          const finalResult = await pool.query(
            `SELECT * FROM itineraries WHERE id = $1`,
            [itineraryId]
          );

          res.write(`event: generation_complete\ndata: ${JSON.stringify({
            itineraryId,
            status: processing_status
          })}\n\n`);

          clearInterval(progressInterval);
          clearInterval(heartbeat);
          res.end();
        } else if (processing_status === 'failed') {
          res.write(`event: generation_error\ndata: ${JSON.stringify({
            error: 'Generation failed'
          })}\n\n`);

          clearInterval(progressInterval);
          clearInterval(heartbeat);
          res.end();
        }

      } catch (error) {
        console.error('SSE progress poll error:', error);
      }
    }, 2000);

    // Clean up on client disconnect
    req.on('close', () => {
      console.log(`📡 V3 SSE client disconnected for itinerary ${itineraryId}`);
      clearInterval(progressInterval);
      clearInterval(heartbeat);
    });

  } catch (error) {
    console.error('SSE setup error:', error);
    res.status(500).json({ error: 'Failed to set up event stream' });
  }
});

/**
 * GET /api/itinerary/generate/:jobId/stream
 * SSE endpoint for real-time progress updates (DEPRECATED - use polling instead)
 */
router.get('/generate/:jobId/stream', (req, res) => {
  const { jobId } = req.params;
  const job = itineraryJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  console.log(`📡 SSE client connected for job ${jobId}`);

  // Send initial status
  res.write(`event: status\ndata: ${JSON.stringify({ status: job.status })}\n\n`);

  // Track which events we've already sent
  let lastSentIndex = 0;

  // Poll for updates
  const interval = setInterval(() => {
    const currentJob = itineraryJobs.get(jobId);

    if (!currentJob) {
      clearInterval(interval);
      res.end();
      return;
    }

    // Send any new progress events
    if (currentJob.progress && currentJob.progress.length > lastSentIndex) {
      // Send all new events since last check
      for (let i = lastSentIndex; i < currentJob.progress.length; i++) {
        const event = currentJob.progress[i];
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
      }
      lastSentIndex = currentJob.progress.length;
    }

    // Check if complete
    if (currentJob.status === 'completed') {
      console.log('📡 SSE sending generation_complete event for job', jobId);
      console.log('📡 SSE result structure:', {
        hasResult: !!currentJob.result,
        resultKeys: currentJob.result ? Object.keys(currentJob.result) : [],
        hasDayStructure: !!currentJob.result?.dayStructure,
        hasActivities: !!currentJob.result?.activities,
        hasRestaurants: !!currentJob.result?.restaurants
      });

      const payload = { itinerary: currentJob.result };
      const payloadStr = JSON.stringify(payload);
      console.log('📡 SSE payload size:', payloadStr.length, 'characters');
      console.log('📡 SSE payload sample (first 500 chars):', payloadStr.substring(0, 500));

      res.write(`event: generation_complete\ndata: ${payloadStr}\n\n`);
      clearInterval(interval);
      res.end();
    }

    // Check if error
    if (currentJob.status === 'error') {
      res.write(`event: generation_error\ndata: ${JSON.stringify({ message: currentJob.error })}\n\n`);
      clearInterval(interval);
      res.end();
    }

  }, 500); // Poll every 500ms

  // Clean up on client disconnect
  req.on('close', () => {
    console.log(`📡 SSE client disconnected for job ${jobId}`);
    clearInterval(interval);
  });
});

/**
 * Helper function to format itinerary row for API response
 */
function formatItineraryResponse(row) {
  return {
    id: row.id,
    routeId: row.route_id,
    userId: row.user_id,
    agentType: row.agent_type,
    generatedAt: row.generated_at,
    generationTimeMs: row.generation_time_ms,
    preferences: row.preferences,
    dayStructure: row.day_structure,
    activities: row.activities,
    restaurants: row.restaurants,
    accommodations: row.accommodations,
    scenicStops: row.scenic_stops,
    practicalInfo: row.practical_info,
    weather: row.weather_data,
    events: row.local_events,
    budget: row.budget_breakdown,
    processingStatus: row.processing_status,
    progress: row.progress,
    errorLog: row.error_log,
    customizations: row.customizations,
    modificationCount: row.modification_count,
    lastModifiedAt: row.last_modified_at,
    lastModifiedBy: row.last_modified_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at
  };
}

/**
 * GET /api/itinerary/route/:routeId/latest
 * Get the latest completed itinerary for a specific route
 */
router.get('/route/:routeId/latest', async (req, res) => {
  try {
    const { routeId } = req.params;

    const result = await pool.query(
      `SELECT * FROM itineraries
       WHERE route_id = $1
       AND processing_status IN ('completed', 'partial')
       ORDER BY completed_at DESC
       LIMIT 1`,
      [routeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No completed itinerary found for this route' });
    }

    res.json(formatItineraryResponse(result.rows[0]));

  } catch (error) {
    console.error('Get route itinerary error:', error);
    res.status(500).json({ error: 'Failed to get route itinerary' });
  }
});

/**
 * GET /api/itinerary/:itineraryId
 * Get completed itinerary by ID
 */
router.get('/:itineraryId', async (req, res) => {
  try {
    const { itineraryId } = req.params;

    const result = await pool.query(
      'SELECT * FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    res.json(formatItineraryResponse(result.rows[0]));

  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({ error: 'Failed to get itinerary' });
  }
});

/**
 * POST /api/itinerary/:itineraryId/refresh-images
 * Re-fetch images for all entities in an existing itinerary
 */
router.post('/:itineraryId/refresh-images', async (req, res) => {
  try {
    const { itineraryId } = req.params;

    console.log(`🔄 Refreshing images for itinerary ${itineraryId}`);

    // Fetch current itinerary
    const result = await pool.query(
      'SELECT * FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const itinerary = result.rows[0];

    // Re-enrich with images using the WikipediaImageService
    const WikipediaImageService = require('../services/wikipediaImageService');
    const imageService = new WikipediaImageService(pool);

    const enrichedResults = {
      activities: itinerary.activities,
      restaurants: itinerary.restaurants,
      accommodations: itinerary.accommodations,
      scenicStops: itinerary.scenic_stops
    };

    // Clean up imageUrl from restaurants and accommodations (they shouldn't have Wikipedia images)
    if (enrichedResults.restaurants) {
      for (const dayRestaurants of enrichedResults.restaurants) {
        const meals = dayRestaurants.meals || {};
        for (const restaurant of Object.values(meals)) {
          if (restaurant && restaurant.imageUrl) {
            delete restaurant.imageUrl;
          }
        }
      }
    }

    if (enrichedResults.accommodations) {
      for (const accommodation of enrichedResults.accommodations) {
        if (accommodation && accommodation.imageUrl) {
          delete accommodation.imageUrl;
        }
      }
    }

    await imageService.enrichEntitiesWithImages(enrichedResults);

    // Update database with new images
    await pool.query(
      `UPDATE itineraries
       SET activities = $1,
           restaurants = $2,
           accommodations = $3,
           scenic_stops = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        JSON.stringify(enrichedResults.activities),
        JSON.stringify(enrichedResults.restaurants),
        JSON.stringify(enrichedResults.accommodations),
        JSON.stringify(enrichedResults.scenicStops),
        itineraryId
      ]
    );

    console.log(`✅ Images refreshed for itinerary ${itineraryId}`);

    res.json({
      success: true,
      message: 'Images refreshed successfully',
      counts: {
        activities: enrichedResults.activities?.length || 0,
        restaurants: enrichedResults.restaurants?.length || 0,
        accommodations: enrichedResults.accommodations?.length || 0,
        scenicStops: enrichedResults.scenicStops?.length || 0
      }
    });

  } catch (error) {
    console.error('Image refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh images' });
  }
});

/**
 * PATCH /api/itinerary/:itineraryId/customize
 * Apply user customizations to itinerary (optimistic updates)
 */
router.patch('/:itineraryId/customize', async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const { customizations, userId } = req.body;

    console.log(`📝 Applying customizations to ${itineraryId}:`, customizations);

    // Merge with existing customizations
    const result = await pool.query(`
      UPDATE itineraries
      SET customizations = COALESCE(customizations, '{}'::jsonb) || $1::jsonb,
          modification_count = COALESCE(modification_count, 0) + 1,
          last_modified_at = CURRENT_TIMESTAMP,
          last_modified_by = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING customizations, modification_count
    `, [JSON.stringify(customizations), userId || null, itineraryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    res.json({
      success: true,
      customizations: result.rows[0].customizations,
      modificationCount: result.rows[0].modification_count
    });

  } catch (error) {
    console.error('Customization error:', error);
    res.status(500).json({ error: 'Failed to apply customizations' });
  }
});

/**
 * POST /api/itinerary/:itineraryId/regenerate-item
 * Regenerate a single item (activity, restaurant, etc.)
 */
router.post('/:itineraryId/regenerate-item', async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const { itemType, itemId, context, constraints } = req.body;

    console.log(`🔄 Regenerating ${itemType} ${itemId} for itinerary ${itineraryId}`);

    // Fetch current itinerary for context
    const itinResult = await pool.query(
      'SELECT * FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (itinResult.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const itinerary = itinResult.rows[0];

    // TODO: Implement item-specific regeneration logic
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Item regeneration queued',
      itemId,
      itemType
    });

  } catch (error) {
    console.error('Item regeneration error:', error);
    res.status(500).json({ error: 'Failed to regenerate item' });
  }
});

/**
 * DELETE /api/itinerary/:itineraryId/items/:itemType/:itemId
 * Remove an item from the itinerary
 */
router.delete('/:itineraryId/items/:itemType/:itemId', async (req, res) => {
  try {
    const { itineraryId, itemType, itemId } = req.params;
    const { userId } = req.body;

    console.log(`🗑️ Removing ${itemType} ${itemId} from ${itineraryId}`);

    // Add to removed items in customizations
    const result = await pool.query(`
      UPDATE itineraries
      SET customizations = jsonb_set(
        COALESCE(customizations, '{}'::jsonb),
        '{removed,${itemType}}',
        COALESCE(customizations->'removed'->'${itemType}', '[]'::jsonb) || $1::jsonb
      ),
      modification_count = COALESCE(modification_count, 0) + 1,
      last_modified_at = CURRENT_TIMESTAMP,
      last_modified_by = $2,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING customizations
    `, [JSON.stringify([itemId]), userId || null, itineraryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    res.json({ success: true, removed: itemId });

  } catch (error) {
    console.error('Item removal error:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

/**
 * POST /api/itinerary/:itineraryId/items
 * Add a custom item to the itinerary
 */
router.post('/:itineraryId/items', async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const { itemType, dayId, item, userId } = req.body;

    console.log(`➕ Adding custom ${itemType} to day ${dayId} of ${itineraryId}`);

    // Add to custom items in customizations
    const result = await pool.query(`
      UPDATE itineraries
      SET customizations = jsonb_set(
        COALESCE(customizations, '{}'::jsonb),
        '{added,${itemType}}',
        COALESCE(customizations->'added'->'${itemType}', '[]'::jsonb) || $1::jsonb
      ),
      modification_count = COALESCE(modification_count, 0) + 1,
      last_modified_at = CURRENT_TIMESTAMP,
      last_modified_by = $2,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING customizations
    `, [JSON.stringify([{ ...item, dayId, customId: `custom-${Date.now()}` }]), userId || null, itineraryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    res.json({ success: true, item: result.rows[0].customizations.added[itemType].slice(-1)[0] });

  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

/**
 * POST /api/itinerary/:itineraryId/days/:dayNumber/activities
 * Add activity directly to a specific day
 */
router.post('/:itineraryId/days/:dayNumber/activities', async (req, res) => {
  try {
    const { itineraryId, dayNumber } = req.params;
    const { activity, block, userId } = req.body;

    console.log(`➕ Adding activity "${activity.name}" to day ${dayNumber} (${block || 'afternoon'}) of itinerary ${itineraryId}`);

    // Fetch current itinerary
    const result = await pool.query(
      'SELECT activities FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Parse activities (format: [{day: 1, activities: [...]}, {day: 2, activities: [...]}, ...])
    let activities = result.rows[0].activities || [];

    // Find or create the day object
    const dayNum = parseInt(dayNumber);
    let dayObj = activities.find(d => d.day === dayNum);

    if (!dayObj) {
      // Create new day object if it doesn't exist
      dayObj = { day: dayNum, activities: [] };
      activities.push(dayObj);
      activities.sort((a, b) => a.day - b.day); // Keep sorted by day
    }

    // Add activity with block tag (morning/afternoon/evening)
    const activityWithMeta = {
      ...activity,
      block: block || 'afternoon', // Default to afternoon if not specified
      addedAt: new Date().toISOString(),
      addedBy: userId || 'user'
    };

    dayObj.activities.push(activityWithMeta);

    // Update database
    await pool.query(
      `UPDATE itineraries
       SET activities = $1,
           modification_count = COALESCE(modification_count, 0) + 1,
           last_modified_at = CURRENT_TIMESTAMP,
           last_modified_by = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [JSON.stringify(activities), userId || null, itineraryId]
    );

    console.log(`✅ Activity added successfully to day ${dayNumber}`);

    res.json({
      success: true,
      activity: activityWithMeta,
      day: dayNum,
      block: activityWithMeta.block
    });

  } catch (error) {
    console.error('Add activity to day error:', error);
    res.status(500).json({ error: 'Failed to add activity to day' });
  }
});

/**
 * Background async itinerary generation
 */
async function generateItineraryAsync(jobId, route_id, routeData, preferences) {
  const job = itineraryJobs.get(jobId);

  try {
    job.status = 'running';
    console.log(`🚀 Starting itinerary generation for job ${jobId}`);

    // Progress callback
    const progressCallback = (event) => {
      job.progress = job.progress || [];
      job.progress.push({
        type: getEventType(event.status),
        data: event,
        timestamp: Date.now()
      });

      console.log(`📊 Progress: ${event.agent} - ${event.status}`);
    };

    // Add route_id and user_id to routeData
    const enrichedRouteData = {
      ...routeData,
      id: route_id,
      user_id: routeData.user_id || null // Will be null for anonymous users
    };

    // Create orchestrator and run
    const orchestrator = new ItineraryAgentOrchestrator(
      enrichedRouteData,
      preferences,
      pool,
      progressCallback
    );

    const result = await orchestrator.generateComplete();

    // Mark job as complete
    job.status = 'completed';
    job.result = result;

    console.log(`✅ Itinerary generation complete for job ${jobId}`);

  } catch (error) {
    console.error(`❌ Itinerary generation failed for job ${jobId}:`, error);
    job.status = 'error';
    job.error = error.message;
  }
}

/**
 * GET /api/itinerary/:itineraryId/export/pdf
 * Export itinerary as PDF
 */
router.get('/:itineraryId/export/pdf', async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const { agentType = 'best-overall' } = req.query;

    // Fetch itinerary
    const result = await pool.query(
      'SELECT * FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const itinerary = result.rows[0];

    // Generate PDF
    const doc = await generateItineraryPDF(itinerary, agentType);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="itinerary-${itineraryId}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

/**
 * GET /api/itinerary/:itineraryId/export/calendar
 * Export itinerary as .ics calendar file
 */
router.get('/:itineraryId/export/calendar', async (req, res) => {
  try {
    const { itineraryId } = req.params;

    // Fetch itinerary
    const result = await pool.query(
      'SELECT * FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const itinerary = result.rows[0];

    // Generate calendar
    const icsContent = generateItineraryCalendar(itinerary);

    if (!icsContent) {
      return res.status(500).json({ error: 'Failed to generate calendar' });
    }

    // Set response headers
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="itinerary-${itineraryId}.ics"`);

    res.send(icsContent);

  } catch (error) {
    console.error('Calendar export error:', error);
    res.status(500).json({ error: 'Failed to generate calendar' });
  }
});

/**
 * GET /api/itinerary/:itineraryId/export/google-maps
 * Get Google Maps URL for full itinerary
 */
router.get('/:itineraryId/export/google-maps', async (req, res) => {
  try {
    const { itineraryId } = req.params;
    const { day } = req.query;

    // Fetch itinerary
    const result = await pool.query(
      'SELECT * FROM itineraries WHERE id = $1',
      [itineraryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const itinerary = result.rows[0];

    // Generate URL (full route or specific day)
    const url = day
      ? generateDayGoogleMapsUrl(itinerary, parseInt(day))
      : generateGoogleMapsUrl(itinerary);

    if (!url) {
      return res.status(400).json({ error: 'Could not generate Google Maps URL' });
    }

    res.json({ url });

  } catch (error) {
    console.error('Google Maps URL error:', error);
    res.status(500).json({ error: 'Failed to generate Google Maps URL' });
  }
});

/**
 * Map agent status to SSE event types
 */
function getEventType(status) {
  const mapping = {
    started: 'agent_started',
    progress: 'agent_progress',
    completed: 'agent_completed',
    error: 'agent_error'
  };
  return mapping[status] || 'update';
}

module.exports = { initializeRoutes };
