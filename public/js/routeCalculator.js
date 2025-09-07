import { cities } from './cities.js';

export class RouteCalculator {
    constructor() {
        this.cities = cities;
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
        // Score candidates based on theme and detour
        const scored = candidates.map(city => {
            let themeScore;
            
            if (theme === 'balanced') {
                // For balanced, take average of all themes
                themeScore = (city.themes.adventure + city.themes.romantic + 
                             city.themes.cultural + city.themes.hidden + city.themes.family) / 5;
            } else {
                themeScore = city.themes[theme] || 0;
            }
            
            const detourFactor = this.calculateDetourFactor(city, start, end);
            const detourPenalty = Math.max(0, 1 - detourFactor * 2); // Penalty for long detours
            
            // Population bonus for larger cities (scaled down)
            const populationScore = Math.log(city.population + 1) / 20;
            
            return {
                city,
                score: themeScore * 0.6 + detourPenalty * 0.3 + populationScore * 0.1,
                themeScore,
                detourFactor
            };
        });
        
        // Sort by score descending and select top candidates
        scored.sort((a, b) => b.score - a.score);
        
        // Select diverse stops by avoiding too many similar cities
        const selected = [];
        const minDistance = 50; // Minimum distance between stops in km
        
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
        
        // If we don't have enough stops, add the highest scoring remaining ones
        if (selected.length < numStops) {
            const remaining = scored.filter(s => !selected.includes(s.city));
            for (let i = 0; i < remaining.length && selected.length < numStops; i++) {
                selected.push(remaining[i].city);
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
     * Main route calculation method
     * @param {string} startId - Starting city ID
     * @param {string} destId - Destination city ID
     * @param {Object} options - Route options
     * @returns {Object} Route calculation result
     */
    calculateRoute(startId, destId, options) {
        const start = this.cities.find(c => c.id === startId);
        const dest = this.cities.find(c => c.id === destId);
        
        if (!start || !dest) {
            throw new Error('Invalid start or destination city');
        }
        
        const numStops = parseInt(options.numStops);
        const detourTolerance = parseInt(options.detourTolerance) / 100;
        const theme = options.theme;
        
        // Stage 1: Bounding box filter
        const directDistance = this.haversineDistance(start, dest);
        const bufferKm = Math.max(100, directDistance * 0.4); // Dynamic buffer based on distance
        const bbox = this.getBoundingBox(start, dest, bufferKm);
        
        let candidates = this.cities.filter(city => 
            city.id !== startId && 
            city.id !== destId &&
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
                this.calculateDetourFactor(city, start, dest) <= detourTolerance * 2
            );
        }
        
        // Stage 3: Theme-based scoring and selection
        const selectedStops = this.selectOptimalStops(candidates, start, dest, numStops, theme);
        
        // Order stops geographically
        const orderedStops = this.orderStopsGeographically(selectedStops, start, dest);
        
        // Build final route
        const route = [start, ...orderedStops, dest];
        
        // Calculate metrics
        const totalDistance = Math.round(this.calculateTotalDistance(route));
        const totalTime = this.estimateTime(route);
        
        return {
            route,
            totalDistance,
            totalTime: totalTime.toFixed(1),
            directDistance: Math.round(directDistance),
            detourFactor: ((totalDistance - directDistance) / directDistance * 100).toFixed(1)
        };
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
     * Fetch driving route between two points - CSP-friendly approach
     * @param {Object} start - Start city with lat/lon
     * @param {Object} end - End city with lat/lon
     * @returns {Promise<Object>} Route data with geometry and distance
     */
    async fetchDrivingRoute(start, end) {
        try {
            // Try multiple routing services due to CSP restrictions
            const routingServices = [
                {
                    name: 'OpenRouteService',
                    url: `https://api.openrouteservice.org/v2/directions/driving-car?start=${start.lon},${start.lat}&end=${end.lon},${end.lat}`,
                    headers: {} // Free tier, no API key needed for basic requests
                },
                {
                    name: 'OSRM',
                    url: `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`,
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
                    
                    if (service.name === 'OSRM') {
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
}