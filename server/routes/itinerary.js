/**
 * Itinerary API Routes
 * Premium multi-agent itinerary generation system
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ItineraryAgentOrchestrator = require('../agents/ItineraryAgentOrchestrator');
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

    jobQueue.addJob(
      itineraryId,
      async () => {
        const orchestrator = new ItineraryAgentOrchestrator(
          enrichedRouteData,
          preferences,
          pool,
          () => {} // No SSE callback needed - using database updates
        );
        orchestrator.itineraryId = itineraryId; // Set the pre-created ID
        return await orchestrator.generateCompleteAsync();
      },
      { route_id, agent: agentType }
    );

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

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({ error: 'Failed to get itinerary' });
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
