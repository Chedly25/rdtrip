/**
 * Geographic Optimization Agent - Phase 3B
 *
 * Optimizes activity sequences to minimize travel time and maximize efficiency.
 *
 * Key Features:
 * 1. Distance Matrix - Calculate all pairwise distances between activities
 * 2. Route Optimization - Reorder activities to minimize total travel time
 * 3. Algorithm: Nearest-Neighbor TSP heuristic with time window constraints
 * 4. Maintains time window validity while optimizing geography
 *
 * Example Improvement:
 * BEFORE: Museum(North) → Restaurant(South) → Park(North) = 50min walking
 * AFTER:  Museum(North) → Park(North) → Restaurant(South) = 15min walking
 */

class GeographicOptimizationAgent {
  constructor(googlePlacesService, sharedContext) {
    this.googlePlacesService = googlePlacesService;
    this.context = sharedContext;

    // Optimization parameters
    this.MAX_WALK_TIME = 25; // minutes - prefer routes under this
    this.REORDER_THRESHOLD = 10; // minutes - minimum improvement to reorder
  }

  /**
   * Optimize activity sequence for geographic efficiency
   *
   * @param {Object} dayItinerary - { day, date, city, activities: [...] }
   * @returns {Object} { optimized: true/false, activities: [...], improvements: {...} }
   */
  async optimizeRoute(dayItinerary) {
    console.log(`\n🗺️  GeographicOptimization: Day ${dayItinerary.day} (${dayItinerary.city})`);

    const activities = dayItinerary.activities || [];

    if (activities.length < 2) {
      console.log('   ℹ️  Not enough activities to optimize (need 2+)');
      return {
        optimized: false,
        activities,
        reason: 'Insufficient activities'
      };
    }

    try {
      // STEP 1: Build distance matrix
      const distanceMatrix = await this.buildDistanceMatrix(activities);

      if (!distanceMatrix) {
        console.log('   ⚠️  Could not build distance matrix');
        return {
          optimized: false,
          activities,
          reason: 'Distance matrix unavailable'
        };
      }

      // STEP 2: Calculate current route efficiency
      const currentStats = this.calculateRouteStats(activities, distanceMatrix);
      console.log(`   Current route: ${currentStats.totalWalkTime}min walking, ${currentStats.totalDistance}km`);

      // STEP 3: Find optimal order using nearest-neighbor with time constraints
      const optimizedOrder = this.findOptimalOrder(activities, distanceMatrix);

      // STEP 4: Reorder activities
      const optimizedActivities = optimizedOrder.map(idx => activities[idx]);

      // STEP 5: Calculate optimized route efficiency
      const optimizedStats = this.calculateRouteStats(optimizedActivities, distanceMatrix);
      console.log(`   Optimized route: ${optimizedStats.totalWalkTime}min walking, ${optimizedStats.totalDistance}km`);

      // STEP 6: Decide if optimization is worth applying
      const improvement = currentStats.totalWalkTime - optimizedStats.totalWalkTime;

      if (improvement >= this.REORDER_THRESHOLD) {
        console.log(`   ✅ Optimization applied: ${improvement}min saved (${Math.round(improvement/currentStats.totalWalkTime*100)}% reduction)`);

        // Log decision
        if (this.context) {
          this.context.recordDecision({
            phase: 'geographic_optimization',
            agentName: 'GeographicOptimizationAgent',
            decision: 'reorder_activities',
            data: {
              day: dayItinerary.day,
              city: dayItinerary.city,
              currentStats,
              optimizedStats,
              improvement: {
                time: improvement,
                percentage: Math.round(improvement/currentStats.totalWalkTime*100)
              },
              newOrder: optimizedOrder
            }
          });
        }

        return {
          optimized: true,
          activities: optimizedActivities,
          improvements: {
            timeSaved: improvement,
            percentageReduction: Math.round(improvement/currentStats.totalWalkTime*100),
            before: currentStats,
            after: optimizedStats
          }
        };
      } else {
        console.log(`   ℹ️  No significant improvement (${improvement}min < ${this.REORDER_THRESHOLD}min threshold)`);
        return {
          optimized: false,
          activities,
          reason: 'Improvement below threshold',
          improvements: {
            timeSaved: improvement,
            threshold: this.REORDER_THRESHOLD
          }
        };
      }

    } catch (error) {
      console.error(`   ❌ Optimization failed: ${error.message}`);
      return {
        optimized: false,
        activities,
        reason: error.message
      };
    }
  }

  /**
   * Build distance matrix for all activity pairs
   *
   * @param {Array} activities - Array of activity objects
   * @returns {Array} 2D matrix of { distance, duration } objects
   */
  async buildDistanceMatrix(activities) {
    console.log(`   Building distance matrix for ${activities.length} activities...`);

    const n = activities.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(null));

    // Extract coordinates
    const locations = activities.map(a => ({
      name: a.name,
      lat: a.placeDetails?.geometry?.location?.lat || null,
      lng: a.placeDetails?.geometry?.location?.lng || null
    }));

    // Check if all activities have coordinates
    const missingCoords = locations.filter(loc => !loc.lat || !loc.lng);
    if (missingCoords.length > 0) {
      console.warn(`   ⚠️  ${missingCoords.length} activities missing coordinates`);
      return null;
    }

    // Build matrix (only upper triangle, since distance is symmetric)
    let apiCalls = 0;
    for (let i = 0; i < n; i++) {
      matrix[i][i] = { distance: 0, duration: 0 }; // Same location

      for (let j = i + 1; j < n; j++) {
        try {
          const origin = `${locations[i].lat},${locations[i].lng}`;
          const destination = `${locations[j].lat},${locations[j].lng}`;

          const data = await this.googlePlacesService.getDistanceMatrix(
            origin,
            destination,
            'walking'
          );

          if (data && data.distance !== undefined && data.duration !== undefined) {
            const entry = {
              distance: data.distance, // meters
              duration: data.duration  // seconds
            };
            matrix[i][j] = entry;
            matrix[j][i] = entry; // Symmetric
            apiCalls++;
          } else {
            // Fallback: Use straight-line distance estimate
            const estimate = this.estimateDistance(locations[i], locations[j]);
            matrix[i][j] = estimate;
            matrix[j][i] = estimate;
          }
        } catch (error) {
          console.warn(`   ⚠️  Failed to get distance ${i}→${j}: ${error.message}`);
          // Fallback to estimate
          const estimate = this.estimateDistance(locations[i], locations[j]);
          matrix[i][j] = estimate;
          matrix[j][i] = estimate;
        }

        // Small delay to avoid rate limiting
        if (apiCalls % 10 === 0) {
          await this.delay(100);
        }
      }
    }

    console.log(`   ✓ Distance matrix complete (${apiCalls} API calls)`);
    return matrix;
  }

  /**
   * Find optimal activity order using nearest-neighbor TSP heuristic
   * WITH TIME WINDOW CONSTRAINTS
   *
   * Algorithm:
   * 1. Sort activities by start time (maintain time ordering)
   * 2. Within each "flexible window", apply nearest-neighbor
   * 3. A flexible window = activities with overlapping possible times
   *
   * This ensures we don't break temporal logic while optimizing geography
   */
  findOptimalOrder(activities, distanceMatrix) {
    const n = activities.length;

    // STRATEGY: Group activities into "time buckets" that can be reordered
    // Example: 09:00-11:00 bucket can have 3 activities reordered
    //          12:00-14:00 bucket separate
    const buckets = this.createTimeBuckets(activities);

    console.log(`   Identified ${buckets.length} time buckets for optimization`);

    // Optimize each bucket independently
    const optimizedOrder = [];

    for (const bucket of buckets) {
      if (bucket.length === 1) {
        // Single activity - no optimization needed
        optimizedOrder.push(bucket[0]);
      } else {
        // Multiple activities - apply nearest-neighbor
        const bucketOptimized = this.nearestNeighborOrder(bucket, distanceMatrix);
        optimizedOrder.push(...bucketOptimized);
      }
    }

    return optimizedOrder;
  }

  /**
   * Create time buckets for activities
   * Activities in same bucket can be reordered without breaking temporal logic
   */
  createTimeBuckets(activities) {
    const buckets = [];
    let currentBucket = [];

    // Parse time windows
    const timeWindows = activities.map((a, idx) => ({
      idx,
      start: this.parseTime(a.time.start),
      end: this.parseTime(a.time.end)
    }));

    // Sort by start time
    timeWindows.sort((a, b) => a.start - b.start);

    // Group into buckets
    for (let i = 0; i < timeWindows.length; i++) {
      const current = timeWindows[i];

      if (currentBucket.length === 0) {
        currentBucket.push(current.idx);
      } else {
        const lastIdx = currentBucket[currentBucket.length - 1];
        const lastWindow = timeWindows.find(w => w.idx === lastIdx);

        // Can we reorder? Check if time windows overlap or are close
        const gap = current.start - lastWindow.end;

        if (gap <= 30) {
          // Close enough - add to bucket
          currentBucket.push(current.idx);
        } else {
          // Too far apart - start new bucket
          buckets.push(currentBucket);
          currentBucket = [current.idx];
        }
      }
    }

    if (currentBucket.length > 0) {
      buckets.push(currentBucket);
    }

    return buckets;
  }

  /**
   * Apply nearest-neighbor algorithm to a bucket of activity indices
   */
  nearestNeighborOrder(bucket, distanceMatrix) {
    if (bucket.length <= 1) return bucket;

    const visited = new Set();
    const order = [];

    // Start with first activity in bucket (respects time ordering)
    let current = bucket[0];
    order.push(current);
    visited.add(current);

    // Greedily pick nearest unvisited neighbor
    while (visited.size < bucket.length) {
      let nearest = null;
      let minDuration = Infinity;

      for (const candidate of bucket) {
        if (visited.has(candidate)) continue;

        const duration = distanceMatrix[current][candidate]?.duration || Infinity;
        if (duration < minDuration) {
          minDuration = duration;
          nearest = candidate;
        }
      }

      if (nearest !== null) {
        order.push(nearest);
        visited.add(nearest);
        current = nearest;
      } else {
        break;
      }
    }

    return order;
  }

  /**
   * Calculate route statistics
   */
  calculateRouteStats(activities, distanceMatrix) {
    let totalDistance = 0; // meters
    let totalWalkTime = 0; // minutes

    for (let i = 0; i < activities.length - 1; i++) {
      const entry = distanceMatrix[i][i + 1];
      if (entry) {
        totalDistance += entry.distance;
        totalWalkTime += Math.ceil(entry.duration / 60);
      }
    }

    return {
      totalDistance: Math.round(totalDistance / 1000 * 10) / 10, // km
      totalWalkTime,
      segments: activities.length - 1,
      averageSegment: activities.length > 1 ? Math.round(totalWalkTime / (activities.length - 1)) : 0
    };
  }

  /**
   * Estimate distance using Haversine formula (fallback)
   */
  estimateDistance(loc1, loc2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = loc1.lat * Math.PI / 180;
    const φ2 = loc2.lat * Math.PI / 180;
    const Δφ = (loc2.lat - loc1.lat) * Math.PI / 180;
    const Δλ = (loc2.lng - loc1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // meters

    // Estimate walking time: ~5 km/h = 83 m/min
    const duration = distance / 83 * 60; // seconds

    return { distance, duration };
  }

  /**
   * Helper: Parse time string to minutes since midnight
   */
  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Helper: Delay for rate limiting
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate optimization report
   */
  generateReport(optimizationResult) {
    if (!optimizationResult.optimized) {
      return {
        status: 'no_optimization',
        reason: optimizationResult.reason
      };
    }

    const { improvements, activities } = optimizationResult;

    return {
      status: 'optimized',
      summary: `Reduced walking time by ${improvements.timeSaved}min (${improvements.percentageReduction}%)`,
      before: {
        totalWalkTime: improvements.before.totalWalkTime,
        totalDistance: improvements.before.totalDistance
      },
      after: {
        totalWalkTime: improvements.after.totalWalkTime,
        totalDistance: improvements.after.totalDistance
      },
      activities: activities.map(a => ({
        name: a.name,
        time: a.time
      }))
    };
  }
}

module.exports = GeographicOptimizationAgent;
