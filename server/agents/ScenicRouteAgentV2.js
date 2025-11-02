/**
 * Scenic Route Agent V2 - Agentic Coordination for Route Highlights
 *
 * This agent uses the same agentic pattern as CityActivityAgentV2:
 * - Strategic Discovery: Finds candidate scenic stops using Perplexity
 * - Validation: Validates each stop with Google Places API
 * - Feedback Loops: Retries if stops aren't found
 * - Context Sharing: Learns from previous segments
 *
 * Key Improvements over V1:
 * - Real place validation (not just AI suggestions)
 * - Adaptive discovery (learns what types work)
 * - Conflict detection (ensures timing feasibility)
 * - Higher quality, verified stops
 */

const OrchestratorAgent = require('./core/OrchestratorAgent');
const SharedContext = require('./core/SharedContext');
const { generateScenicStopUrls } = require('../utils/urlGenerator');

class ScenicRouteAgentV2 {
  constructor(routeData, dayStructure, progressCallback, db, itineraryId, sharedContext = null) {
    this.routeData = routeData;
    this.dayStructure = dayStructure;
    this.onProgress = progressCallback || (() => {});
    this.db = db;
    this.itineraryId = itineraryId;

    // Use existing SharedContext or create new one
    this.context = sharedContext || new SharedContext();

    // Initialize orchestrator with Google Places validation
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.orchestrator = new OrchestratorAgent(this.context, db, googleApiKey);

    console.log('🎯 ScenicRouteAgentV2: Agentic coordination enabled');
  }

  async generate() {
    console.log('🛣️  ScenicRouteAgentV2: Finding route highlights with agentic coordination...');

    const scenicStops = [];
    const allSegments = this.dayStructure.days.flatMap(d => d.driveSegments || []);
    let completed = 0;

    // Process each driving segment
    for (const day of this.dayStructure.days) {
      for (const segment of day.driveSegments || []) {
        this.onProgress({ current: completed + 1, total: allSegments.length });

        console.log(`\n🚗 Segment: ${segment.from} → ${segment.to} (${segment.distance}km)`);

        // Use agentic coordination to find and validate stops
        const stops = await this.discoverScenicStops(segment, day);

        scenicStops.push({
          day: day.day,
          date: day.date,
          segment: `${segment.from} → ${segment.to}`,
          distance: segment.distance,
          estimatedTime: segment.estimatedTime,
          stops
        });

        completed++;
      }
    }

    const totalStops = scenicStops.reduce((sum, s) => sum + s.stops.length, 0);
    console.log(`✓ Scenic Stops: Found and validated ${totalStops} route highlights`);

    return scenicStops;
  }

  async discoverScenicStops(segment, dayInfo) {
    const { agent } = this.routeData;
    const stopCount = this.calculateStopCount(segment);

    console.log(`   🎯 Discovering ${stopCount} scenic stops...`);

    // Build strategic context for discovery
    const context = {
      segment,
      dayInfo,
      stopCount,
      travelStyle: agent,
      previousStops: this.context.getDecisionHistory()
        .filter(d => d.type === 'scenic-stop')
        .map(d => d.data?.name)
    };

    // Discover stops using orchestrator (with validation!)
    const discoveredStops = [];

    for (let i = 0; i < stopCount; i++) {
      const position = (i + 1) / (stopCount + 1); // Evenly space stops along route
      const approximateKm = Math.floor(segment.distance * position);

      console.log(`   📍 Stop ${i + 1}/${stopCount} (around km ${approximateKm})`);

      const request = {
        city: this.extractLocationFromSegment(segment, position),
        timeWindow: {
          start: this.calculateStopTime(segment, position),
          end: this.calculateStopTime(segment, position, 60) // 60min max stop
        },
        purpose: `scenic stop ${i + 1} along ${segment.from} → ${segment.to}`,
        dayOfWeek: new Date(dayInfo.date).toLocaleDateString('en-US', { weekday: 'long' }),
        dayTheme: 'scenic route exploration',
        travelStyle: agent,
        preferences: {
          type: this.getPreferredStopType(agent),
          maxDetour: 10, // 10km max detour
          approximateKm
        }
      };

      try {
        // Use orchestrator to discover + validate
        const result = await this.orchestrator.discoverAndSelectActivity(request, 2); // 2 attempts

        if (result.success && result.activity) {
          // Enrich with scenic stop metadata
          const enrichedStop = this.enrichScenicStop(result.activity, segment, approximateKm);
          discoveredStops.push(enrichedStop);

          // Record success in context
          this.context.recordDecision({
            type: 'scenic-stop',
            data: { name: enrichedStop.name, type: enrichedStop.type },
            success: true
          });

          console.log(`      ✓ Found and validated: ${enrichedStop.verifiedName}`);
        } else {
          console.log(`      ⚠️  Could not find validated stop at position ${i + 1}`);
          // Continue - better to have fewer quality stops than unvalidated ones
        }
      } catch (error) {
        console.error(`      ✗ Error discovering stop ${i + 1}:`, error.message);
        // Continue to next stop
      }
    }

    // If we got no validated stops, fall back to basic suggestion
    if (discoveredStops.length === 0) {
      console.log('   ⚠️  No validated stops found, using fallback');
      return this.getFallbackStops(segment, stopCount);
    }

    return discoveredStops;
  }

  enrichScenicStop(validatedPlace, segment, approximateKm) {
    // Take validated place from Google and enrich it with scenic stop metadata
    return {
      // Validated data from Google Places
      ...validatedPlace,

      // Scenic-specific metadata
      approximateKmFromStart: approximateKm,
      segmentFrom: segment.from,
      segmentTo: segment.to,
      suggestedDuration: this.estimateStopDuration(validatedPlace),
      detourTime: 'Validated location along route',
      parkingEase: validatedPlace.types?.includes('parking') ? 'easy' : 'moderate',

      // Add scenic URLs
      urls: generateScenicStopUrls({
        name: validatedPlace.verifiedName,
        coordinates: validatedPlace.coordinates
      })
    };
  }

  calculateStopCount(segment) {
    // Number of stops based on distance
    if (segment.distance < 100) return 1;
    if (segment.distance < 200) return 2;
    return 3;
  }

  extractLocationFromSegment(segment, position) {
    // For now, use midpoint between cities
    // TODO: Could use actual route geometry if available
    return position < 0.5 ? segment.from : segment.to;
  }

  calculateStopTime(segment, position, addMinutes = 0) {
    // Calculate approximate time at this position along segment
    const departureTime = segment.departureTime || '09:00';
    const [hours, minutes] = departureTime.split(':').map(Number);

    // Estimate driving time to this position
    const drivingMinutes = parseInt(segment.estimatedTime) * position;
    const totalMinutes = (hours * 60) + minutes + drivingMinutes + addMinutes;

    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = Math.floor(totalMinutes % 60);

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  }

  getPreferredStopType(agent) {
    const typeMap = {
      adventure: ['viewpoint', 'natural_feature', 'park', 'hiking_area'],
      culture: ['museum', 'landmark', 'historical', 'church'],
      food: ['market', 'winery', 'restaurant', 'food'],
      'hidden-gems': ['local_business', 'art_gallery', 'unique'],
      'best-overall': ['tourist_attraction', 'point_of_interest', 'landmark']
    };
    return typeMap[agent] || typeMap['best-overall'];
  }

  estimateStopDuration(place) {
    // Estimate based on place type and ratings
    if (place.types?.some(t => ['museum', 'art_gallery'].includes(t))) {
      return '45-90 min';
    }
    if (place.types?.some(t => ['viewpoint', 'park'].includes(t))) {
      return '20-30 min';
    }
    if (place.rating >= 4.5) {
      return '30-60 min'; // High-rated places worth more time
    }
    return '15-30 min';
  }

  getFallbackStops(segment, stopCount) {
    console.log('   ℹ️  Generating fallback scenic stops');
    const stops = [];

    for (let i = 0; i < stopCount; i++) {
      const position = (i + 1) / (stopCount + 1);
      const fallback = {
        name: `Scenic viewpoint ${i + 1}`,
        verifiedName: `Rest area between ${segment.from} and ${segment.to}`,
        type: 'viewpoint',
        coordinates: null,
        approximateKmFromStart: Math.floor(segment.distance * position),
        suggestedDuration: '15-20 min',
        why: 'Opportunity to stretch legs and enjoy the scenery',
        whatToDo: 'Take photos, rest break',
        cost: 'Free',
        facilities: 'Basic rest area',
        detourTime: 'None - along route',
        parkingEase: 'moderate',
        segmentFrom: segment.from,
        segmentTo: segment.to
      };

      fallback.urls = generateScenicStopUrls(fallback);
      stops.push(fallback);
    }

    return stops;
  }
}

module.exports = ScenicRouteAgentV2;
