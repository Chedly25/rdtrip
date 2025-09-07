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
        
        const ordered = [];
        let current = start;
        const remaining = [...stops];
        
        // Greedy algorithm: always pick the nearest city that minimizes total distance
        while (remaining.length > 0) {
            let bestStop = null;
            let bestIndex = -1;
            let bestCost = Infinity;
            
            for (let i = 0; i < remaining.length; i++) {
                const stop = remaining[i];
                // Cost = distance to current + distance from stop to end
                const cost = this.haversineDistance(current, stop) + 
                           this.haversineDistance(stop, end);
                
                if (cost < bestCost) {
                    bestCost = cost;
                    bestStop = stop;
                    bestIndex = i;
                }
            }
            
            if (bestStop) {
                ordered.push(bestStop);
                current = bestStop;
                remaining.splice(bestIndex, 1);
            } else {
                break;
            }
        }
        
        return ordered;
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