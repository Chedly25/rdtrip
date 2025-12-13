/**
 * ClusterAgent - Geographic Activity Clustering
 *
 * Discovers places in a city and groups them into walkable clusters.
 * Each cluster represents a "zone" that can be explored in one time block.
 *
 * Uses Google Places API to:
 * - Find attractions, restaurants, cafes in the city
 * - Calculate distances between places
 * - Group into geographic clusters
 *
 * Clustering Philosophy:
 * - Each cluster should be walkable (< 20 min between furthest points)
 * - Clusters have themes (cultural, food, nature, shopping)
 * - Clusters map to time blocks for easy planning
 * - Include a mix of must-sees and hidden spots
 *
 * Depends on: TimeAgent (to know how many clusters we need)
 */

const BaseAgent = require('./BaseAgent');
const GooglePlacesService = require('../../services/googlePlacesService');
const { Pool } = require('pg');

class ClusterAgent extends BaseAgent {
  constructor() {
    super({
      name: 'ClusterAgent',
      description: 'Group activities by geographic proximity',
      requiredInputs: ['city', 'preferences'],
      optionalInputs: ['prev:TimeAgent', 'maxClusters'],
      outputs: ['clusters'],
      dependsOn: ['TimeAgent'],
      canRefine: true
    });

    // Initialize Google Places
    this.placesService = new GooglePlacesService(
      process.env.GOOGLE_PLACES_API_KEY,
      new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      })
    );

    // Place type queries for different themes
    this.themeQueries = {
      cultural: ['museum', 'art gallery', 'historic site', 'monument', 'church', 'castle'],
      food: ['restaurant', 'cafe', 'bakery', 'food market', 'wine bar'],
      nature: ['park', 'garden', 'viewpoint', 'beach', 'lake'],
      shopping: ['market', 'boutique', 'antique shop', 'local shop'],
      nightlife: ['bar', 'cocktail bar', 'wine bar', 'club']
    };

    // Clustering parameters
    this.clusterRadius = 500; // meters - max distance within a cluster
    this.maxPlacesPerCluster = 6;
    this.minPlacesPerCluster = 2;
  }

  /**
   * Main execution logic
   */
  async run(input, context) {
    const { city, preferences, previousAgentOutputs, refinementInstructions } = input;

    // Get time blocks from TimeAgent if available
    const timeAgentOutput = previousAgentOutputs?.TimeAgent;
    const timeBlocks = timeAgentOutput?.data?.blocks || [];

    // Calculate how many clusters we need
    const targetClusters = Math.max(2, Math.min(5, Math.ceil(timeBlocks.length / 2)));

    this.reportProgress(5, 'Identifying relevant place types...');

    // Determine which themes to prioritize based on preferences
    const prioritizedThemes = this.prioritizeThemes(preferences);

    this.reportProgress(15, 'Searching for places...');

    // Discover places in the city
    const allPlaces = await this.discoverPlaces(city, prioritizedThemes);

    if (allPlaces.length < 3) {
      console.warn(`[ClusterAgent] Only found ${allPlaces.length} places for ${city.name}`);
      return {
        data: { clusters: this.generateFallbackClusters(city) },
        confidence: 40,
        gaps: ['Insufficient place data found'],
        suggestions: ['Try broader search terms']
      };
    }

    this.reportProgress(50, `Found ${allPlaces.length} places, clustering...`);

    // Cluster the places geographically
    const clusters = this.clusterPlaces(allPlaces, targetClusters);

    this.reportProgress(75, 'Enriching clusters with metadata...');

    // Enrich clusters with metadata
    const enrichedClusters = this.enrichClusters(clusters, timeBlocks);

    this.reportProgress(90, 'Calculating walking times...');

    // Add walking time estimates
    const finalClusters = this.addWalkingEstimates(enrichedClusters);

    this.reportProgress(100, 'Complete');

    return {
      data: {
        clusters: finalClusters
      },
      confidence: this.calculateConfidence(finalClusters),
      gaps: this.identifyGaps(finalClusters, preferences),
      suggestions: []
    };
  }

  /**
   * Prioritize themes based on user preferences
   */
  prioritizeThemes(preferences) {
    const themes = [];
    const interests = preferences?.interests || [];

    // Map interests to themes
    if (interests.includes('food') || interests.includes('culinary')) {
      themes.push('food');
    }
    if (interests.includes('culture') || interests.includes('art') || interests.includes('history')) {
      themes.push('cultural');
    }
    if (interests.includes('nature') || interests.includes('outdoor')) {
      themes.push('nature');
    }
    if (interests.includes('shopping')) {
      themes.push('shopping');
    }
    if (interests.includes('nightlife')) {
      themes.push('nightlife');
    }

    // Always include cultural and food as baseline
    if (!themes.includes('cultural')) themes.push('cultural');
    if (!themes.includes('food')) themes.push('food');

    return themes;
  }

  /**
   * Discover places in the city using Google Places
   */
  async discoverPlaces(city, themes) {
    const allPlaces = [];
    const seenPlaceIds = new Set();

    for (const theme of themes) {
      const queries = this.themeQueries[theme] || [];

      for (const query of queries.slice(0, 2)) { // Limit queries per theme
        try {
          const searchQuery = `${query} in ${city.name}`;
          const results = await this.placesService.textSearch(searchQuery, city.coordinates);

          for (const place of results.slice(0, 5)) {
            // Avoid duplicates
            if (seenPlaceIds.has(place.place_id)) continue;
            seenPlaceIds.add(place.place_id);

            // Transform to our format
            const transformedPlace = this.transformPlace(place, theme);
            if (transformedPlace) {
              allPlaces.push(transformedPlace);
            }
          }

          // Small delay to respect rate limits
          await this.delay(100);

        } catch (error) {
          console.warn(`[ClusterAgent] Search failed for "${query}": ${error.message}`);
        }
      }
    }

    console.log(`[ClusterAgent] Discovered ${allPlaces.length} unique places in ${city.name}`);
    return allPlaces;
  }

  /**
   * Transform Google Places result to our format
   */
  transformPlace(place, theme) {
    if (!place.geometry?.location) return null;

    return {
      id: place.place_id,
      name: place.name,
      type: this.inferPlaceType(place.types),
      theme,
      description: null, // Would need place details for this
      rating: place.rating || null,
      reviewCount: place.user_ratings_total || null,
      priceLevel: place.price_level || null,
      photoUrl: place.photos?.[0]?.photo_reference
        ? this.placesService.getPhotoUrl(place.photos[0].photo_reference, 400)
        : null,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      place_id: place.place_id,
      address: place.formatted_address || place.vicinity
    };
  }

  /**
   * Infer a simplified place type from Google types array
   */
  inferPlaceType(types) {
    if (!types || types.length === 0) return 'other';

    const typeMap = {
      museum: 'museum',
      art_gallery: 'gallery',
      church: 'landmark',
      cathedral: 'landmark',
      castle: 'landmark',
      monument: 'landmark',
      park: 'park',
      natural_feature: 'viewpoint',
      restaurant: 'restaurant',
      cafe: 'cafe',
      bar: 'bar',
      bakery: 'cafe',
      food: 'restaurant',
      shopping_mall: 'shop',
      store: 'shop',
      market: 'market'
    };

    for (const type of types) {
      if (typeMap[type]) return typeMap[type];
    }

    return 'other';
  }

  /**
   * Cluster places geographically using simple distance-based clustering
   */
  clusterPlaces(places, targetCount) {
    if (places.length <= targetCount) {
      // Each place is its own cluster
      return places.map((place, i) => ({
        id: `cluster-${i + 1}`,
        places: [place],
        centerPoint: place.coordinates
      }));
    }

    // Simple k-means-ish clustering
    const clusters = [];

    // Initialize cluster centers using k-means++ style selection
    const centers = this.initializeClusterCenters(places, targetCount);

    // Create empty clusters
    for (let i = 0; i < targetCount; i++) {
      clusters.push({
        id: `cluster-${i + 1}`,
        places: [],
        centerPoint: centers[i]
      });
    }

    // Assign each place to nearest cluster
    for (const place of places) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < clusters.length; i++) {
        const dist = this.haversineDistance(
          place.coordinates.lat,
          place.coordinates.lng,
          clusters[i].centerPoint.lat,
          clusters[i].centerPoint.lng
        );

        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      clusters[nearestIdx].places.push(place);
    }

    // Recalculate centers and filter empty clusters
    return clusters
      .filter(c => c.places.length >= this.minPlacesPerCluster)
      .map(cluster => {
        // Recalculate center as centroid of places
        const avgLat = cluster.places.reduce((s, p) => s + p.coordinates.lat, 0) / cluster.places.length;
        const avgLng = cluster.places.reduce((s, p) => s + p.coordinates.lng, 0) / cluster.places.length;

        return {
          ...cluster,
          centerPoint: { lat: avgLat, lng: avgLng },
          places: cluster.places.slice(0, this.maxPlacesPerCluster)
        };
      });
  }

  /**
   * Initialize cluster centers using k-means++ style selection
   */
  initializeClusterCenters(places, k) {
    const centers = [];

    // First center is random (or first place)
    centers.push(places[0].coordinates);

    // Remaining centers chosen proportional to distance squared from existing centers
    while (centers.length < k && centers.length < places.length) {
      let maxDist = 0;
      let farthestPlace = places[1];

      for (const place of places) {
        const minDistToCenter = Math.min(...centers.map(c =>
          this.haversineDistance(place.coordinates.lat, place.coordinates.lng, c.lat, c.lng)
        ));

        if (minDistToCenter > maxDist) {
          maxDist = minDistToCenter;
          farthestPlace = place;
        }
      }

      centers.push(farthestPlace.coordinates);
    }

    return centers;
  }

  /**
   * Enrich clusters with metadata (name, theme, best time)
   */
  enrichClusters(clusters, timeBlocks) {
    return clusters.map((cluster, idx) => {
      // Determine dominant theme
      const themeCounts = {};
      cluster.places.forEach(p => {
        themeCounts[p.theme] = (themeCounts[p.theme] || 0) + 1;
      });
      const dominantTheme = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed';

      // Generate name based on theme and content
      const clusterName = this.generateClusterName(cluster, dominantTheme);

      // Suggest best time block
      const bestFor = this.suggestBestTime(dominantTheme, timeBlocks, idx);

      return {
        ...cluster,
        name: clusterName,
        theme: dominantTheme,
        bestFor,
        walkingMinutes: 0 // Will be calculated
      };
    });
  }

  /**
   * Generate a meaningful cluster name
   */
  generateClusterName(cluster, theme) {
    const themeNames = {
      cultural: 'Cultural Quarter',
      food: 'Food District',
      nature: 'Green Zone',
      shopping: 'Shopping Area',
      nightlife: 'Evening District',
      mixed: 'Central Zone'
    };

    // Try to use a prominent place name
    const prominentPlace = cluster.places.find(p => p.rating >= 4.5);
    if (prominentPlace && prominentPlace.type === 'landmark') {
      return `${prominentPlace.name} Area`;
    }

    return themeNames[theme] || `Zone ${cluster.id.split('-')[1]}`;
  }

  /**
   * Suggest the best time of day for a cluster
   */
  suggestBestTime(theme, timeBlocks, clusterIdx) {
    const timePreferences = {
      cultural: 'morning',      // Museums often less crowded
      food: 'evening',          // Dinner time
      nature: 'morning',        // Best light, cooler temps
      shopping: 'afternoon',    // Markets and shops peak
      nightlife: 'evening',     // Obviously
      mixed: 'afternoon'        // Flexible
    };

    // Try to match to actual time block names
    const preferredTime = timePreferences[theme] || 'afternoon';
    const matchingBlock = timeBlocks.find(b =>
      b.name.toLowerCase().includes(preferredTime)
    );

    if (matchingBlock) {
      return matchingBlock.name;
    }

    // Fall back to generic time
    return preferredTime;
  }

  /**
   * Add walking time estimates between places in each cluster
   */
  addWalkingEstimates(clusters) {
    return clusters.map(cluster => {
      if (cluster.places.length <= 1) {
        return { ...cluster, walkingMinutes: 5 };
      }

      // Calculate max distance within cluster
      let maxDist = 0;
      for (let i = 0; i < cluster.places.length; i++) {
        for (let j = i + 1; j < cluster.places.length; j++) {
          const dist = this.haversineDistance(
            cluster.places[i].coordinates.lat,
            cluster.places[i].coordinates.lng,
            cluster.places[j].coordinates.lat,
            cluster.places[j].coordinates.lng
          );
          maxDist = Math.max(maxDist, dist);
        }
      }

      // Convert to walking time (average walking speed ~5 km/h = 83 m/min)
      const walkingMinutes = Math.round((maxDist / 83) * 1.3); // 1.3x factor for non-straight paths

      return {
        ...cluster,
        walkingMinutes: Math.max(5, Math.min(45, walkingMinutes))
      };
    });
  }

  /**
   * Calculate confidence based on cluster quality
   */
  calculateConfidence(clusters) {
    if (clusters.length === 0) return 30;

    let confidence = 60;

    // More clusters = higher confidence
    confidence += Math.min(15, clusters.length * 3);

    // More places per cluster = higher confidence
    const avgPlaces = clusters.reduce((s, c) => s + c.places.length, 0) / clusters.length;
    confidence += Math.min(15, avgPlaces * 3);

    // Places with photos = higher confidence
    const photosCount = clusters.reduce((s, c) =>
      s + c.places.filter(p => p.photoUrl).length, 0
    );
    if (photosCount > 5) confidence += 5;

    return Math.min(95, confidence);
  }

  /**
   * Identify gaps in clustering
   */
  identifyGaps(clusters, preferences) {
    const gaps = [];

    if (clusters.length < 2) {
      gaps.push('Insufficient clusters for meaningful exploration');
    }

    // Check if prioritized themes are represented
    const themes = clusters.map(c => c.theme);
    if (preferences?.interests?.includes('food') && !themes.includes('food')) {
      gaps.push('No food-focused cluster despite food interest');
    }
    if (preferences?.interests?.includes('culture') && !themes.includes('cultural')) {
      gaps.push('No cultural cluster despite culture interest');
    }

    return gaps;
  }

  /**
   * Generate fallback clusters when discovery fails
   * Uses day-based naming to match the planning UX
   */
  generateFallbackClusters(city) {
    const nights = city.nights || city.suggestedNights || 2;
    const clusters = [];

    for (let i = 1; i <= nights; i++) {
      clusters.push({
        id: `day-${i}`,
        name: `Day ${i}`,
        theme: i === 1 ? 'arrival' : i === nights ? 'departure' : 'exploration',
        bestFor: 'all-day',
        walkingMinutes: 0,
        centerPoint: city.coordinates,
        dayNumber: i,
        places: []
      });
    }

    return clusters;
  }

  /**
   * Haversine distance between two coordinates (returns meters)
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ClusterAgent;
