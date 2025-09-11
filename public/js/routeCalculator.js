import { cities } from './cities.js';

export class RouteCalculator {
    constructor() {
        this.cities = cities;
        this.routeCache = new Map();
        this.CACHE_SIZE = 50;
    }
    
    /**
     * Calculate distance between two cities using Haversine formula
     * @param {Object} city1 - First city with lat/lon properties
     * @param {Object} city2 - Second city with lat/lon properties
     * @returns {number} Distance in kilometers
     */
    haversineDistance(city1, city2) {
        const R = 6371; // Earth radius in km
        const lat1 = city1.lat * Math.PI / 180;
        const lat2 = city2.lat * Math.PI / 180;
        const deltaLat = (city2.lat - city1.lat) * Math.PI / 180;
        const deltaLon = (city2.lon - city1.lon) * Math.PI / 180;
        
        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    /**
     * Calculate bounding box for filtering cities
     * @param {Object} start - Start city
     * @param {Object} end - End city
     * @param {number} bufferKm - Buffer distance in kilometers
     * @returns {Object} Bounding box with min/max lat/lon
     */
    getBoundingBox(start, end, bufferKm) {
        const latBuffer = bufferKm / 111; // Rough conversion km to degrees
        const lonBuffer = bufferKm / (111 * Math.cos(start.lat * Math.PI / 180));
        
        const latMin = Math.min(start.lat, end.lat) - latBuffer;
        const latMax = Math.max(start.lat, end.lat) + latBuffer;
        const lonMin = Math.min(start.lon, end.lon) - lonBuffer;
        const lonMax = Math.max(start.lon, end.lon) + lonBuffer;
        
        return { latMin, latMax, lonMin, lonMax };
    }
    
    /**
     * Calculate detour factor for a city relative to direct route
     * @param {Object} city - Candidate city
     * @param {Object} start - Start city
     * @param {Object} end - End city
     * @returns {number} Detour factor (0 = no detour, 1 = 100% longer)
     */
    calculateDetourFactor(city, start, end) {
        const directDistance = this.haversineDistance(start, end);
        const detourDistance = this.haversineDistance(start, city) + this.haversineDistance(city, end);
        return (detourDistance - directDistance) / directDistance;
    }
    
    /**
     * Score and select optimal stops based on theme and detour
     * @param {Array} candidates - Array of candidate cities
     * @param {Object} start - Start city
     * @param {Object} end - End city
     * @param {number} numStops - Number of stops to select
     * @param {string} theme - Selected theme
     * @returns {Array} Selected optimal stops
     */
    selectOptimalStops(candidates, start, end, numStops, theme) {
        // Define theme-specific weights for different city characteristics
        const themeWeights = {
            adventure: {
                themes: { adventure: 0.7, hidden: 0.2, cultural: 0.1 },
                populationWeight: 0.05,
                detourWeight: 0.25,
                minDistance: 40
            },
            romantic: {
                themes: { romantic: 0.6, cultural: 0.2, hidden: 0.2 },
                populationWeight: 0.1,
                detourWeight: 0.3,
                minDistance: 60
            },
            cultural: {
                themes: { cultural: 0.6, adventure: 0.2, hidden: 0.2 },
                populationWeight: 0.15,
                detourWeight: 0.25,
                minDistance: 50
            },
            foodie: {
                themes: { romantic: 0.3, cultural: 0.4, hidden: 0.3 },
                populationWeight: 0.2,
                detourWeight: 0.2,
                minDistance: 45
            },
            family: {
                themes: { family: 0.7, cultural: 0.2, adventure: 0.1 },
                populationWeight: 0.15,
                detourWeight: 0.35,
                minDistance: 55
            },
            luxury: {
                themes: { romantic: 0.4, cultural: 0.3, hidden: 0.3 },
                populationWeight: 0.25,
                detourWeight: 0.2,
                minDistance: 70
            },
            balanced: {
                themes: { adventure: 0.2, romantic: 0.2, cultural: 0.2, hidden: 0.2, family: 0.2 },
                populationWeight: 0.1,
                detourWeight: 0.3,
                minDistance: 50
            },
            hidden: {
                themes: { hidden: 0.8, adventure: 0.1, cultural: 0.1 },
                populationWeight: 0.02,
                detourWeight: 0.18,
                minDistance: 35
            }
        };
        
        const weights = themeWeights[theme] || themeWeights.balanced;
        
        // Score candidates based on theme-specific criteria
        const scored = candidates.map(city => {
            // Calculate theme score using weighted combination
            let themeScore = 0;
            for (const [themeType, weight] of Object.entries(weights.themes)) {
                themeScore += (city.themes[themeType] || 0) * weight;
            }
            
            const detourFactor = this.calculateDetourFactor(city, start, end);
            const detourPenalty = Math.max(0, 1 - detourFactor * 2);
            
            // Population score varies by theme
            const populationScore = Math.log(city.population + 1) / 20;
            
            // Calculate final score with theme-specific weights
            const finalScore = 
                themeScore * (1 - weights.detourWeight - weights.populationWeight) +
                detourPenalty * weights.detourWeight +
                populationScore * weights.populationWeight;
            
            return {
                city,
                score: finalScore,
                themeScore,
                detourFactor
            };
        });
        
        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        
        // Select diverse stops with theme-specific minimum distance
        const selected = [];
        const minDistance = weights.minDistance;
        
        for (const candidate of scored) {
            if (selected.length >= numStops) break;
            
            // Check if this city is too close to already selected cities
            const tooClose = selected.some(selectedCity => 
                this.haversineDistance(candidate.city, selectedCity) < minDistance
            );
            
            if (!tooClose) {
                selected.push(candidate.city);
            }
        }
        
        // If we don't have enough stops, gradually reduce minimum distance
        if (selected.length < numStops) {
            const reducedMinDistance = minDistance * 0.5;
            const remaining = scored.filter(s => !selected.includes(s.city));
            
            for (const candidate of remaining) {
                if (selected.length >= numStops) break;
                
                const tooClose = selected.some(selectedCity => 
                    this.haversineDistance(candidate.city, selectedCity) < reducedMinDistance
                );
                
                if (!tooClose) {
                    selected.push(candidate.city);
                }
            }
        }
        
        return selected;
    }
    
    /**
     * Order stops geographically along the route
     * @param {Array} stops - Array of stops to order
     * @param {Object} start - Start city
     * @param {Object} end - End city
     * @returns {Array} Geographically ordered stops
     */
    orderStopsGeographically(stops, start, end) {
        if (stops.length <= 1) return stops;
        
        // Calculate the main direction vector from start to end
        const mainVector = {
            lat: end.lat - start.lat,
            lon: end.lon - start.lon
        };
        
        // Project each stop onto the main route line and sort by progression
        const stopsWithProgression = stops.map(stop => {
            // Vector from start to current stop
            const stopVector = {
                lat: stop.lat - start.lat,
                lon: stop.lon - start.lon
            };
            
            // Calculate dot product to get projection (progression along main route)
            const dotProduct = (stopVector.lat * mainVector.lat + stopVector.lon * mainVector.lon);
            const mainVectorLength = Math.sqrt(mainVector.lat * mainVector.lat + mainVector.lon * mainVector.lon);
            
            // Progression as a ratio (0 = at start, 1 = at destination)
            const progression = dotProduct / (mainVectorLength * mainVectorLength);
            
            return {
                stop,
                progression: Math.max(0, Math.min(1, progression)) // Clamp between 0 and 1
            };
        });
        
        // Sort by progression along the route
        stopsWithProgression.sort((a, b) => a.progression - b.progression);
        
        return stopsWithProgression.map(item => item.stop);
    }
    
    /**
     * Calculate total distance for a route
     * @param {Array} route - Array of cities in order
     * @returns {number} Total distance in kilometers
     */
    calculateTotalDistance(route) {
        let totalDistance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            totalDistance += this.haversineDistance(route[i], route[i + 1]);
        }
        return totalDistance;
    }
    
    /**
     * Estimate driving time for a route
     * @param {Array} route - Array of cities in order
     * @returns {number} Estimated time in hours
     */
    estimateTime(route) {
        const totalDistance = this.calculateTotalDistance(route);
        // Assume average speed of 80 km/h on highways and 60 km/h in cities
        // Add time for stops and city navigation
        const baseTime = totalDistance / 75; // Average effective speed
        const stopTime = (route.length - 2) * 0.5; // 30 minutes per intermediate stop
        return baseTime + stopTime;
    }
    
    /**
     * Main route calculation method with caching
     * @param {string} startId - Starting city ID
     * @param {string} destId - Destination city ID
     * @param {Object} options - Route options
     * @returns {Object} Route calculation result
     */
    calculateRoute(startId, destId, options) {
        // Create cache key from parameters
        const cacheKey = `${startId}-${destId}-${options.numStops}-${options.detourTolerance}-${options.theme}`;
        
        // Check cache first
        if (this.routeCache.has(cacheKey)) {
            console.log('Returning cached route for:', cacheKey);
            return this.routeCache.get(cacheKey);
        }
        
        const start = this.cities.find(c => c.id === startId);
        const dest = this.cities.find(c => c.id === destId);
        
        if (!start || !dest) {
            throw new Error('Invalid start or destination city');
        }
        
        const numStops = parseInt(options.numStops);
        const detourTolerance = parseInt(options.detourTolerance) / 100;
        const theme = options.theme;
        const suggestedCities = options.suggestedCities || [];
        
        let selectedStops = [];
        
        // If we have AI-suggested cities, try to use them first
        if (suggestedCities.length > 0) {
            console.log('🎯 Using AI-suggested cities:', suggestedCities);
            
            // Try to match suggested city names to our city database
            for (const suggestedName of suggestedCities) {
                // Try exact match first
                let matchedCity = this.cities.find(city => 
                    city.name.toLowerCase() === suggestedName.toLowerCase() &&
                    city.id !== startId && 
                    city.id !== destId
                );
                
                // If no exact match, try partial match
                if (!matchedCity) {
                    matchedCity = this.cities.find(city => 
                        city.name.toLowerCase().includes(suggestedName.toLowerCase()) &&
                        city.id !== startId && 
                        city.id !== destId
                    );
                }
                
                if (matchedCity && selectedStops.length < numStops) {
                    selectedStops.push(matchedCity);
                    console.log(`✅ Matched AI suggestion "${suggestedName}" to ${matchedCity.name}`);
                } else if (!matchedCity) {
                    console.log(`❌ Could not match AI suggestion "${suggestedName}" to database`);
                }
            }
        }
        
        // Calculate direct distance (needed for later calculations)
        const directDistance = this.haversineDistance(start, dest);
        
        // If we don't have enough stops from AI suggestions, use the original algorithm
        if (selectedStops.length < numStops) {
            console.log(`📍 Need ${numStops - selectedStops.length} more stops, using theme-based selection`);
            
            // Stage 1: Bounding box filter
            const bufferKm = Math.max(100, directDistance * 0.4); // Dynamic buffer based on distance
            const bbox = this.getBoundingBox(start, dest, bufferKm);
            
            let candidates = this.cities.filter(city => 
                city.id !== startId && 
                city.id !== destId &&
                !selectedStops.some(s => s.id === city.id) && // Exclude already selected stops
                city.lat >= bbox.latMin && 
                city.lat <= bbox.latMax &&
                city.lon >= bbox.lonMin && 
                city.lon <= bbox.lonMax
            );
            
            // Stage 2: Ellipse filter based on detour tolerance
            candidates = candidates.filter(city => {
                const detour = this.calculateDetourFactor(city, start, dest);
                return detour <= detourTolerance;
            });
            
            if (candidates.length === 0 && numStops > 0) {
                // Fallback: if no candidates in tolerance, expand search
                candidates = this.cities.filter(city => 
                    city.id !== startId && 
                    city.id !== destId &&
                    !selectedStops.some(s => s.id === city.id) &&
                    this.calculateDetourFactor(city, start, dest) <= detourTolerance * 2
                );
            }
            
            // Stage 3: Theme-based scoring and selection for remaining stops
            const additionalStops = this.selectOptimalStops(
                candidates, 
                start, 
                dest, 
                numStops - selectedStops.length, 
                theme
            );
            
            selectedStops = [...selectedStops, ...additionalStops];
        }
        
        // Order stops geographically
        const orderedStops = this.orderStopsGeographically(selectedStops, start, dest);
        
        // Build final route
        const route = [start, ...orderedStops, dest];
        
        // Calculate metrics
        const totalDistance = Math.round(this.calculateTotalDistance(route));
        const totalTime = this.estimateTime(route);
        
        const result = {
            route,
            totalDistance,
            totalTime: totalTime.toFixed(1),
            directDistance: Math.round(directDistance),
            detourFactor: ((totalDistance - directDistance) / directDistance * 100).toFixed(1)
        };
        
        // Add driving route geometry asynchronously
        this.calculateDrivingRoute(route)
            .then(drivingRoute => {
                result.drivingRoute = drivingRoute;
                console.log('✅ Driving route calculated for', route.map(c => c.name).join(' → '));
            })
            .catch(error => {
                console.warn('⚠️ Failed to get driving route, using fallback:', error.message);
                // Route will display as straight lines
            });
        
        // Cache the result
        this.cacheRoute(cacheKey, result);
        
        return result;
    }
    
    /**
     * Cache a route calculation result
     * @param {string} key - Cache key
     * @param {Object} result - Route result to cache
     */
    cacheRoute(key, result) {
        // Limit cache size
        if (this.routeCache.size >= this.CACHE_SIZE) {
            // Remove oldest entry (first one)
            const firstKey = this.routeCache.keys().next().value;
            this.routeCache.delete(firstKey);
        }
        this.routeCache.set(key, result);
    }
    
    /**
     * Find city by name (fuzzy matching)
     * @param {string} name - City name to search for
     * @returns {Object|null} Found city or null
     */
    findCityByName(name) {
        const normalizedName = name.toLowerCase().trim();
        
        // Exact match first
        let city = this.cities.find(c => 
            c.name.toLowerCase() === normalizedName
        );
        
        if (city) return city;
        
        // Partial match
        city = this.cities.find(c => 
            c.name.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(c.name.toLowerCase())
        );
        
        return city || null;
    }
    
    /**
     * Fetch driving route between two points - CSP-friendly approach with caching
     * @param {Object} start - Start city with lat/lon
     * @param {Object} end - End city with lat/lon
     * @returns {Promise<Object>} Route data with geometry and distance
     */
    async fetchDrivingRoute(start, end) {
        // Create cache key for driving routes
        const routeCacheKey = `driving-${start.id}-${end.id}`;
        
        // Check if we have a cached driving route
        if (this.routeCache.has(routeCacheKey)) {
            console.log('Using cached driving route:', start.name, 'to', end.name);
            return this.routeCache.get(routeCacheKey);
        }
        
        try {
            // Try multiple routing services due to CSP restrictions
            const routingServices = [
                {
                    name: 'OpenRouteService',
                    url: `https://api.openrouteservice.org/v2/directions/driving-car?start=${start.lon},${start.lat}&end=${end.lon},${end.lat}`,
                    headers: {} // Free tier, no API key needed for basic requests
                },
                {
                    name: 'Mapbox',
                    url: `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lon},${start.lat};${end.lon},${end.lat}?geometries=geojson&overview=full&access_token=pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ`,
                    headers: {}
                }
            ];

            for (const service of routingServices) {
                try {
                    console.log(`Trying ${service.name} routing service...`);
                    const response = await fetch(service.url, {
                        headers: service.headers,
                        mode: 'cors'
                    });
                    
                    if (!response.ok) {
                        throw new Error(`${service.name} API error: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    // Handle different response formats
                    let route, geometry, distance, duration;
                    
                    if (service.name === 'Mapbox') {
                        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                            throw new Error('No route found');
                        }
                        route = data.routes[0];
                        geometry = route.geometry;
                        distance = Math.round(route.distance / 1000);
                        duration = Math.round(route.duration / 3600 * 10) / 10;
                    } else if (service.name === 'OpenRouteService') {
                        if (!data.features || data.features.length === 0) {
                            throw new Error('No route found');
                        }
                        route = data.features[0];
                        geometry = route.geometry;
                        distance = Math.round(route.properties.segments[0].distance / 1000);
                        duration = Math.round(route.properties.segments[0].duration / 3600 * 10) / 10;
                    }
                    
                    const result = {
                        geometry: geometry,
                        distance: distance,
                        duration: duration,
                        service: service.name
                    };
                    
                    console.log(`${service.name} route fetched:`, {
                        from: `${start.name}`,
                        to: `${end.name}`,
                        distance: result.distance,
                        duration: result.duration,
                        coordinates: result.geometry.coordinates?.length
                    });
                    
                    // Cache the successful driving route
                    this.cacheRoute(routeCacheKey, result);
                    
                    return result;
                    
                } catch (serviceError) {
                    console.warn(`${service.name} failed:`, serviceError);
                    continue;
                }
            }
            
            throw new Error('All routing services failed');
            
        } catch (error) {
            console.warn('Failed to fetch driving route from all services:', error);
            // Generate curved fallback route instead of straight line
            return this.generateCurvedFallbackRoute(start, end);
        }
    }

    /**
     * Generate a curved fallback route that looks more realistic than a straight line
     * @param {Object} start - Start city with lat/lon
     * @param {Object} end - End city with lat/lon
     * @returns {Object} Curved route data
     */
    generateCurvedFallbackRoute(start, end) {
        const coordinates = [];
        const steps = 10; // Number of intermediate points
        
        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            
            // Linear interpolation with some curvature
            const lat = start.lat + (end.lat - start.lat) * ratio;
            const lon = start.lon + (end.lon - start.lon) * ratio;
            
            // Add slight curvature to make it look more like a road
            const curvature = Math.sin(ratio * Math.PI) * 0.02; // Small deviation
            const curvedLat = lat + curvature * (Math.random() - 0.5);
            const curvedLon = lon + curvature * (Math.random() - 0.5);
            
            coordinates.push([curvedLon, curvedLat]);
        }
        
        const result = {
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            },
            distance: Math.round(this.haversineDistance(start, end) * 1.2), // Add 20% for realistic road distance
            duration: Math.round(this.haversineDistance(start, end) / 75 * 10) / 10, // Rough estimate
            service: 'Fallback'
        };
        
        console.log('=== FALLBACK ROUTE GENERATED ===');
        console.log('From:', start.name, 'to:', end.name);
        console.log('Coordinates generated:', coordinates.length);
        console.log('Sample coordinates:', coordinates.slice(0, 3));
        console.log('Distance estimate:', result.distance, 'km');
        
        return result;
    }

    /**
     * Fetch complete driving route for entire trip
     * @param {Array} route - Array of cities in order
     * @returns {Promise<Object>} Complete route data with segments
     */
    async fetchCompleteRoute(route) {
        try {
            const segments = [];
            let totalDistance = 0;
            let totalDuration = 0;

            // Fetch driving directions for each segment
            for (let i = 0; i < route.length - 1; i++) {
                const start = route[i];
                const end = route[i + 1];
                
                const segmentRoute = await this.fetchDrivingRoute(start, end);
                segments.push({
                    from: start.name,
                    to: end.name,
                    geometry: segmentRoute.geometry,
                    distance: segmentRoute.distance,
                    duration: segmentRoute.duration
                });
                
                totalDistance += segmentRoute.distance;
                totalDuration += segmentRoute.duration;
                
                // Small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            return {
                segments,
                totalDistance,
                totalDuration: Math.round(totalDuration * 10) / 10 // Round to 1 decimal
            };
            
        } catch (error) {
            console.error('Failed to fetch complete route:', error);
            throw error;
        }
    }

    /**
     * Get suggestions for autocomplete
     * @param {string} query - Search query
     * @param {number} limit - Maximum suggestions to return
     * @returns {Array} Array of matching cities
     */
    getSuggestions(query, limit = 10) {
        const normalizedQuery = query.toLowerCase().trim();
        
        if (normalizedQuery.length < 2) return [];
        
        const matches = this.cities.filter(city => 
            city.name.toLowerCase().includes(normalizedQuery) &&
            city.id !== 'aix-en-provence' // Exclude starting point
        );
        
        // Sort by relevance (exact match first, then by city size)
        matches.sort((a, b) => {
            const aExact = a.name.toLowerCase().startsWith(normalizedQuery);
            const bExact = b.name.toLowerCase().startsWith(normalizedQuery);
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Secondary sort by population (larger cities first)
            return b.population - a.population;
        });
        
        return matches.slice(0, limit);
    }

    /**
     * Calculate driving route with actual road geometry
     * @param {Array} route - Array of cities in order
     * @returns {Promise<Object>} Driving route with segments
     */
    async calculateDrivingRoute(route) {
        const segments = [];
        
        for (let i = 0; i < route.length - 1; i++) {
            const from = route[i];
            const to = route[i + 1];
            
            try {
                // Use Mapbox routing for reliable routing
                const segment = await this.getMapboxRoute(from, to);
                segment.from = from.name;
                segment.to = to.name;
                segment.service = 'Mapbox';
                segments.push(segment);
            } catch (error) {
                console.warn(`Failed to get Mapbox route from ${from.name} to ${to.name}, using fallback`);
                // Fallback to curved line
                const fallbackSegment = this.generateCurvedFallbackRoute(from, to);
                fallbackSegment.from = from.name;
                fallbackSegment.to = to.name;
                fallbackSegment.service = 'Fallback';
                segments.push(fallbackSegment);
            }
        }
        
        return {
            segments,
            totalDistance: segments.reduce((sum, seg) => sum + seg.distance, 0),
            totalDuration: segments.reduce((sum, seg) => sum + seg.duration, 0)
        };
    }
    
    /**
     * Get route from Mapbox service with fallback
     * @param {Object} from - Starting city with lat/lon
     * @param {Object} to - Ending city with lat/lon
     * @returns {Promise<Object>} Route segment with geometry
     */
    async getMapboxRoute(from, to) {
        try {
            const coordinates = `${from.lon},${from.lat};${to.lon},${to.lat}`;
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ`;
            
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Mapbox API error: ${response.status}, using fallback`);
                throw new Error(`Mapbox API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                console.warn('No route found, using fallback');
                throw new Error('No route found');
            }
            
            const route = data.routes[0];
            
            return {
                geometry: route.geometry,
                distance: Math.round(route.distance / 1000), // Convert to km
                duration: Math.round(route.duration / 3600 * 10) / 10 // Convert to hours
            };
        } catch (error) {
            console.warn('Mapbox route failed, generating fallback route:', error.message);
            // Generate curved fallback route instead of throwing error
            return this.generateCurvedFallbackRoute(from, to);
        }
    }
}