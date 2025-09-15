// Spotlight Page Controller
class SpotlightController {
    constructor() {
        this.map = null;
        this.spotlightData = null;
        this.imageCache = new Map(); // Cache for Wikipedia images
        this.agentColors = {
            adventure: '#34C759',
            culture: '#FFD60A',
            food: '#FF3B30'
        };

        this.init();
    }

    init() {
        // Load data from sessionStorage
        this.loadSpotlightData();
        
        if (!this.spotlightData) {
            // If no data, redirect back to main page
            window.location.href = 'index.html';
            return;
        }

        // Initialize the page
        this.setupHeader();
        this.initMap();
        this.displayCities();
        this.setupEventListeners();
    }

    loadSpotlightData() {
        // Try localStorage first (as set by the main app), then sessionStorage as fallback
        let data = localStorage.getItem('spotlightData') || sessionStorage.getItem('spotlightData');
        if (data) {
            this.spotlightData = JSON.parse(data);
        }
    }

    setupHeader() {
        const { agent, destination, origin } = this.spotlightData;

        // Set agent icon and title
        const agentEmojis = {
            adventure: '🏔️',
            culture: '🏛️',
            food: '🍽️'
        };

        const agentNames = {
            adventure: 'Adventure Route',
            culture: 'Culture Route',
            food: 'Food Route'
        };

        // Handle icon display - use innerHTML for images, textContent for emojis
        const iconElement = document.getElementById('routeAgentIcon');
        const iconValue = agentEmojis[agent];

        // Check if it's an image path or emoji
        if (agent === 'adventure') {
            iconElement.innerHTML = '<img src="/adventure.png" alt="Adventure" style="width: 24px; height: 24px; vertical-align: middle;">';
        } else if (agent === 'culture') {
            iconElement.innerHTML = '<img src="/culture.png" alt="Culture" style="width: 24px; height: 24px; vertical-align: middle;">';
        } else if (agent === 'food') {
            iconElement.innerHTML = '<img src="/food.png" alt="Food" style="width: 24px; height: 24px; vertical-align: middle;">';
        } else {
            iconElement.textContent = iconValue;
        }
        document.getElementById('routeTitle').textContent = agentNames[agent];
        document.getElementById('routeSubtitle').textContent = `${origin} → ${destination}`;

        // Apply color theme to the page
        this.applyColorTheme(agent);

        // Set stats
        document.getElementById('totalStops').textContent = this.spotlightData.totalStops;

        // Calculate estimated days (assuming 1-2 days per stop + travel days)
        const estimatedDays = Math.max(3, this.spotlightData.totalStops * 1.5);
        document.getElementById('estimatedDays').textContent = Math.ceil(estimatedDays);
    }

    applyColorTheme(agent) {
        const color = this.agentColors[agent];
        const root = document.documentElement;

        // Set CSS variables for the theme
        root.style.setProperty('--agent-primary-color', color);
        root.style.setProperty('--agent-primary-rgb', this.hexToRgb(color));

        // Add theme class to body
        document.body.className = `theme-${agent}`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '0, 0, 0';
    }

    initMap() {
        // Initialize Mapbox map
        mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';

        // Disable Mapbox telemetry to prevent ad-blocker conflicts
        if (window.mapboxgl) {
            window.mapboxgl.supported({ failIfMajorPerformanceCaveat: true });
        }

        this.map = new mapboxgl.Map({
            container: 'spotlightMap',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [5.4474, 43.5297], // Aix-en-Provence coordinates
            zoom: 6,
            // Disable telemetry collection to prevent ad-blocker issues
            collectResourceTiming: false
        });

        // Add navigation controls
        this.map.addControl(new mapboxgl.NavigationControl());

        // When map loads, add route and markers
        this.map.on('load', () => {
            this.addRouteToMap();
        });
    }

    async addRouteToMap() {
        const { agent, agentData } = this.spotlightData;
        
        // Extract waypoints from agent data
        const waypoints = this.extractWaypoints(agentData);
        
        if (waypoints.length === 0) {
            console.log('No waypoints found for', agent);
            return;
        }

        // Add origin marker
        new mapboxgl.Marker({ color: '#007AFF' })
            .setLngLat([5.4474, 43.5297])
            .setPopup(new mapboxgl.Popup().setHTML('<h3>🏠 Aix-en-Provence</h3><p>Your journey starts here</p>'))
            .addTo(this.map);

        // Add waypoint markers
        const color = this.agentColors[agent];
        waypoints.forEach((waypoint, index) => {
            const agentEmoji = this.getAgentEmoji(agent);
            
            new mapboxgl.Marker({ color: color })
                .setLngLat([waypoint.lng, waypoint.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <h3>${agentEmoji} ${waypoint.name}</h3>
                    <p>${waypoint.description || ''}</p>
                `))
                .addTo(this.map);
        });

        // Get destination coordinates (you might need to geocode this)
        const destinationCoords = await this.geocodeDestination(this.spotlightData.destination);
        
        if (destinationCoords) {
            // Add destination marker
            new mapboxgl.Marker({ color: '#8E44AD' })
                .setLngLat([destinationCoords.lng, destinationCoords.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`<h3>🎯 ${destinationCoords.name}</h3><p>Your destination</p>`))
                .addTo(this.map);

            // Create and add route
            await this.createRoute(waypoints, destinationCoords, color);
            
            // Fit map to show all points
            this.fitMapToRoute(waypoints, destinationCoords);
            
            // Update distance in stats
            this.updateDistanceStats(waypoints, destinationCoords);
        }
    }

    extractWaypoints(agentData) {
        const waypoints = [];
        
        try {
            // Try to extract JSON from the result
            const jsonMatch = agentData.recommendations.match(/```json\s*([\s\S]*?)\s*```/);
            let jsonData = null;
            
            if (jsonMatch) {
                jsonData = JSON.parse(jsonMatch[1]);
            } else {
                // Fallback: look for JSON without code blocks
                const jsonStart = agentData.recommendations.indexOf('{');
                const jsonEnd = agentData.recommendations.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    const jsonString = agentData.recommendations.substring(jsonStart, jsonEnd + 1);
                    jsonData = JSON.parse(jsonString);
                }
            }
            
            if (jsonData && jsonData.waypoints) {
                jsonData.waypoints.forEach(waypoint => {
                    if (waypoint.coordinates && waypoint.coordinates.length === 2) {
                        let lng, lat;

                        // Check if coordinates are in [lat, lng] or [lng, lat] format
                        const first = waypoint.coordinates[0];
                        const second = waypoint.coordinates[1];

                        // If first value is in latitude range (-90 to 90) and second is in longitude range (-180 to 180)
                        // then it's probably [lat, lng] format
                        if (first >= -90 && first <= 90 && second >= -180 && second <= 180 &&
                            Math.abs(first) > Math.abs(second)) {
                            // This appears to be [lat, lng] format - swap to [lng, lat]
                            lng = second;
                            lat = first;
                            console.log(`Detected [lat, lng] format for ${waypoint.name}: [${first}, ${second}] -> lng=${lng}, lat=${lat}`);
                        } else {
                            // Assume [lng, lat] format (GeoJSON standard)
                            lng = first;
                            lat = second;
                            console.log(`Using [lng, lat] format for ${waypoint.name}: lng=${lng}, lat=${lat}`);
                        }

                        // Final validation
                        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
                            console.log(`✅ Valid coordinates for ${waypoint.name}: lng=${lng}, lat=${lat}`);

                            waypoints.push({
                                name: waypoint.name,
                                description: waypoint.description,
                                activities: waypoint.activities || [],
                                duration: waypoint.duration,
                                lng: lng,
                                lat: lat
                            });
                        } else {
                            console.warn('Invalid coordinates after processing:', waypoint.coordinates, 'lng:', lng, 'lat:', lat);
                        }
                    }
                });
            }
        } catch (e) {
            console.log('Could not parse waypoints from agent data:', e);
            console.log('Raw agent data sample:', agentData.recommendations.substring(0, 300));

            // Add fallback waypoints with European coordinates
            for (let i = 0; i < 3; i++) {
                waypoints.push({
                    name: `European Stop ${i + 1}`,
                    description: `Waypoint ${i + 1}`,
                    lat: 44.0 + Math.random() * 6.0, // 44-50°N (Central Europe)
                    lng: 2.0 + Math.random() * 8.0,  // 2-10°E (Western/Central Europe)
                    activities: []
                });
            }
        }
        
        return waypoints;
    }

    async geocodeDestination(destination) {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${mapboxgl.accessToken}&limit=1&types=place`
            );
            
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                return {
                    lng: data.features[0].center[0],
                    lat: data.features[0].center[1],
                    name: data.features[0].place_name
                };
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
        
        return null;
    }

    async createRoute(waypoints, destinationCoords, color) {
        console.log('Creating route with waypoints:', waypoints);
        console.log('Destination coords:', destinationCoords);

        const coordinates = [
            [5.4474, 43.5297], // Aix-en-Provence (start)
            ...waypoints.map(w => {
                // Ensure coordinates are in [lng, lat] format for Mapbox
                const coord = [w.lng, w.lat];
                console.log(`Waypoint ${w.name}: lng=${w.lng}, lat=${w.lat} -> [${coord[0]}, ${coord[1]}] (lng, lat)`);
                return coord;
            }),
            [destinationCoords.lng, destinationCoords.lat] // Destination
        ];

        console.log('Final coordinates array:', coordinates);

        try {
            const routeGeometry = await this.getDirections(coordinates);

            if (routeGeometry) {
                // Remove existing route if it exists
                if (this.map.getSource('spotlight-route')) {
                    if (this.map.getLayer('spotlight-route-arrows')) {
                        this.map.removeLayer('spotlight-route-arrows');
                    }
                    if (this.map.getLayer('spotlight-route')) {
                        this.map.removeLayer('spotlight-route');
                    }
                    if (this.map.getLayer('spotlight-route-outline')) {
                        this.map.removeLayer('spotlight-route-outline');
                    }
                    this.map.removeSource('spotlight-route');
                }

                this.map.addSource('spotlight-route', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': routeGeometry
                    }
                });

                // Add route outline for visibility
                this.map.addLayer({
                    'id': 'spotlight-route-outline',
                    'type': 'line',
                    'source': 'spotlight-route',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': '#FFFFFF',
                        'line-width': 6,
                        'line-opacity': 0.6
                    }
                });

                // Add main route line
                this.map.addLayer({
                    'id': 'spotlight-route',
                    'type': 'line',
                    'source': 'spotlight-route',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': color,
                        'line-width': 4,
                        'line-opacity': 0.9
                    }
                });

                // Add direction arrows for detailed routes
                if (routeGeometry.coordinates && routeGeometry.coordinates.length > 10) {
                    this.map.addLayer({
                        'id': 'spotlight-route-arrows',
                        'type': 'symbol',
                        'source': 'spotlight-route',
                        'layout': {
                            'symbol-placement': 'line',
                            'symbol-spacing': 100,
                            'text-field': '→',
                            'text-size': 14,
                            'text-rotation-alignment': 'map'
                        },
                        'paint': {
                            'text-color': color,
                            'text-halo-color': 'white',
                            'text-halo-width': 2
                        }
                    });
                }

                console.log(`Spotlight route added with detailed geometry`);
            } else {
                // Fallback to straight line route
                console.log('Falling back to straight line route');
                this.createStraightLineRoute(coordinates, color);
            }
        } catch (error) {
            console.error('Could not get driving directions:', error);
            // Fallback to straight line route
            this.createStraightLineRoute(coordinates, color);
        }
    }

    createStraightLineRoute(coordinates, color) {
        try {
            // Remove existing route if it exists
            if (this.map.getSource('spotlight-route')) {
                if (this.map.getLayer('spotlight-route')) {
                    this.map.removeLayer('spotlight-route');
                }
                if (this.map.getLayer('spotlight-route-outline')) {
                    this.map.removeLayer('spotlight-route-outline');
                }
                this.map.removeSource('spotlight-route');
            }

            this.map.addSource('spotlight-route', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': coordinates
                    }
                }
            });

            // Add route outline
            this.map.addLayer({
                'id': 'spotlight-route-outline',
                'type': 'line',
                'source': 'spotlight-route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#FFFFFF',
                    'line-width': 6,
                    'line-opacity': 0.6
                }
            });

            // Add main route line
            this.map.addLayer({
                'id': 'spotlight-route',
                'type': 'line',
                'source': 'spotlight-route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': color,
                    'line-width': 4,
                    'line-opacity': 0.9
                }
            });

            console.log(`Spotlight straight line route created`);
        } catch (error) {
            console.error('Could not create fallback route:', error);
        }
    }

    async getDirections(coordinates) {
        // Log coordinates for debugging
        console.log('Input coordinates for directions:', coordinates);

        // Validate and fix coordinates
        const validatedCoords = coordinates.filter(coord => {
            if (!Array.isArray(coord) || coord.length !== 2) {
                console.warn('Invalid coordinate format:', coord);
                return false;
            }

            let [first, second] = coord;

            // Check if coordinates might be swapped (lat, lng instead of lng, lat)
            // Expect [lng, lat] format at this point
            const lng = first;
            const lat = second;

            // Basic validation
            if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
                console.warn('Coordinates out of valid range:', coord, { lng, lat });
                return false;
            }

            // Very generous European bounds check (includes all of Europe plus buffer)
            const isInEurope = lng >= -25 && lng <= 45 && lat >= 25 && lat <= 80;

            if (!isInEurope) {
                console.warn('Coordinate outside expanded Europe bounds:', { lng, lat, original: coord });
                return false;
            }

            console.log(`✅ Coordinate validated:`, { lng, lat });

            return true;
        });

        if (validatedCoords.length < 2) {
            console.warn('Not enough valid coordinates for directions API:', validatedCoords.length);
            return null;
        }

        // Limit to 8 waypoints to avoid API errors
        const limitedCoords = validatedCoords.length > 8 ?
            [validatedCoords[0], ...validatedCoords.slice(1, -1).slice(0, 6), validatedCoords[validatedCoords.length - 1]] :
            validatedCoords;

        const coordinatesStr = limitedCoords.map(coord => `${coord[0]},${coord[1]}`).join(';');
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesStr}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

        console.log('Directions API request:', {
            originalCoords: coordinates.length,
            validatedCoords: validatedCoords.length,
            limitedCoords: limitedCoords.length
        });

        try {
            const response = await fetch(url);

            if (!response.ok) {
                console.error('Directions API error:', response.status, response.statusText);
                const errorData = await response.json();
                console.error('API error details:', errorData);
                return null;
            }

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                return data.routes[0].geometry;
            } else {
                console.warn('No routes returned from API');
                return null;
            }
        } catch (error) {
            console.error('Directions API error:', error);
            console.error('Failed URL:', url);
        }

        return null;
    }

    fitMapToRoute(waypoints, destinationCoords) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([5.4474, 43.5297]); // Aix-en-Provence
        waypoints.forEach(waypoint => {
            bounds.extend([waypoint.lng, waypoint.lat]);
        });
        bounds.extend([destinationCoords.lng, destinationCoords.lat]);
        
        this.map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 8
        });
    }

    updateDistanceStats(waypoints, destinationCoords) {
        // Calculate distance using the Haversine formula for great circle distance
        let totalDistance = 0;
        const origin = { lat: 43.5297, lng: 5.4474 }; // Aix-en-Provence

        let previousPoint = origin;

        // Add distances between consecutive waypoints
        waypoints.forEach(waypoint => {
            const distance = this.calculateDistance(previousPoint.lat, previousPoint.lng, waypoint.lat, waypoint.lng);
            totalDistance += distance;
            previousPoint = waypoint;
        });

        // Add distance from last waypoint to destination
        if (destinationCoords) {
            const finalDistance = this.calculateDistance(previousPoint.lat, previousPoint.lng, destinationCoords.lat, destinationCoords.lng);
            totalDistance += finalDistance;
        }

        // Round to nearest 10km for a cleaner display
        const roundedDistance = Math.round(totalDistance / 10) * 10;
        document.getElementById('totalDistance').textContent = `${roundedDistance}km`;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula to calculate great circle distance
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLng = this.degreesToRadians(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    async getWikipediaImage(locationName, width = 800, height = 600) {
        // Check cache first
        const cacheKey = `${locationName}_${width}x${height}`;
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }

        try {
            // Strategy 1: Try Wikipedia page summary (fastest)
            const summaryResult = await this.getWikipediaPageImage(locationName, width);
            if (summaryResult) {
                this.imageCache.set(cacheKey, summaryResult);
                return summaryResult;
            }

            // Strategy 2: Search Wikimedia Commons
            const commonsResult = await this.searchWikimediaCommons(locationName, width, height);
            if (commonsResult) {
                this.imageCache.set(cacheKey, commonsResult);
                return commonsResult;
            }

            // Strategy 3: Try simplified search terms
            const simplifiedResult = await this.getSimplifiedLocationImage(locationName, width, height);
            if (simplifiedResult) {
                this.imageCache.set(cacheKey, simplifiedResult);
                return simplifiedResult;
            }

        } catch (error) {
            console.warn(`Could not fetch Wikipedia image for ${locationName}:`, error);
        }

        return null; // No placeholder - we want real images only
    }

    async getWikipediaPageImage(locationName, width = 800) {
        try {
            // Clean location name for Wikipedia search
            const cleanName = locationName.replace(/[,\(\)]/g, '').trim();

            const response = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`,
                { headers: { 'Accept': 'application/json' } }
            );

            if (response.ok) {
                const data = await response.json();

                if (data.thumbnail && data.thumbnail.source) {
                    // Get higher resolution image
                    const imageUrl = data.thumbnail.source.replace(/\/\d+px-/, `/${width}px-`);
                    return imageUrl;
                }
            }
        } catch (error) {
            console.warn(`Wikipedia page image search failed for ${locationName}:`, error);
        }

        return null;
    }

    async searchWikimediaCommons(locationName, width = 800, height = 600) {
        try {
            const searchQuery = locationName.replace(/[,\(\)]/g, ' ').trim();

            const response = await fetch(
                `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*&srlimit=5`
            );

            if (response.ok) {
                const data = await response.json();

                if (data.query && data.query.search && data.query.search.length > 0) {
                    // Try to get image from the first few results
                    for (const result of data.query.search.slice(0, 3)) {
                        const imageUrl = await this.getCommonsImageFromTitle(result.title, width);
                        if (imageUrl) return imageUrl;
                    }
                }
            }
        } catch (error) {
            console.warn(`Wikimedia Commons search failed for ${locationName}:`, error);
        }

        return null;
    }

    async getCommonsImageFromTitle(title, width = 800) {
        try {
            const response = await fetch(
                `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json&origin=*`
            );

            if (response.ok) {
                const data = await response.json();
                const pages = data.query?.pages;

                if (pages) {
                    const pageId = Object.keys(pages)[0];
                    const imageInfo = pages[pageId]?.imageinfo?.[0];

                    if (imageInfo && (imageInfo.thumburl || imageInfo.url)) {
                        return imageInfo.thumburl || imageInfo.url;
                    }
                }
            }
        } catch (error) {
            console.warn(`Commons image fetch failed for ${title}:`, error);
        }

        return null;
    }

    async getSimplifiedLocationImage(locationName, width = 800, height = 600) {
        // Extract city names, remove descriptors
        const cityKeywords = locationName
            .split(/[,\-\(\)]/)[0]
            .replace(/(?:museum|musée|château|castle|cathedral|church|abbey|park|lake|mountain|gorges?)/gi, '')
            .trim();

        if (cityKeywords && cityKeywords !== locationName) {
            return await this.getWikipediaPageImage(cityKeywords, width);
        }

        return null;
    }

    async displayCities() {
        const waypoints = this.extractWaypoints(this.spotlightData.agentData);
        const container = document.getElementById('citiesContainer');

        // Show loading state first
        container.innerHTML = `
            <div class="cities-loading">
                <div class="loading-message">
                    <span class="loading-spinner">🔍</span>
                    <p>Finding real images of your destinations...</p>
                </div>
            </div>
        `;

        let html = '';

        // Process waypoints sequentially to avoid API rate limits
        for (let index = 0; index < waypoints.length; index++) {
            const waypoint = waypoints[index];

            // Get real Wikipedia image for this location
            const imageUrl = await this.getWikipediaImage(waypoint.name, 800, 600);

            html += `
                <div class="city-card">
                    <div class="city-image-container">
                        ${imageUrl ? `
                            <img src="${imageUrl}" alt="${waypoint.name}" class="city-image"
                                 onload="this.classList.add('loaded')"
                                 onerror="this.style.display='none'">
                        ` : `
                            <div class="no-image-placeholder">
                                <div class="no-image-icon">${this.getLocationIcon(waypoint.name)}</div>
                                <div class="no-image-text">${waypoint.name}</div>
                            </div>
                        `}
                    </div>
                    <div class="city-content">
                        <h3>${index + 1}. ${waypoint.name}</h3>
                        <p class="city-description">${waypoint.description || ''}</p>
                        ${waypoint.activities && waypoint.activities.length > 0 ? `
                            <ul class="city-activities">
                                ${waypoint.activities.map(activity => `<li>${activity}</li>`).join('')}
                            </ul>
                        ` : ''}
                        ${waypoint.duration ? `<p><strong>Suggested duration:</strong> ${waypoint.duration}</p>` : ''}
                    </div>
                </div>
            `;

            // Update container with current progress
            container.innerHTML = html + (index < waypoints.length - 1 ? `
                <div class="cities-loading">
                    <div class="loading-message">
                        <span class="loading-spinner">🔍</span>
                        <p>Loading more destinations... (${index + 1}/${waypoints.length})</p>
                    </div>
                </div>
            ` : '');
        }

        // Final update - remove any loading indicators
        container.innerHTML = html;

        console.log(`Loaded ${waypoints.length} locations with Wikipedia images`);
    }

    getLocationIcon(locationName) {
        const name = locationName.toLowerCase();

        if (name.includes('museum') || name.includes('musée')) return '🏛️';
        if (name.includes('castle') || name.includes('château')) return '🏰';
        if (name.includes('church') || name.includes('cathedral') || name.includes('abbey')) return '⛪';
        if (name.includes('park') || name.includes('garden')) return '🌳';
        if (name.includes('mountain') || name.includes('mont') || name.includes('peak')) return '⛰️';
        if (name.includes('lake') || name.includes('lac')) return '🏞️';
        if (name.includes('gorge') || name.includes('canyon') || name.includes('valley')) return '🏔️';
        if (name.includes('beach') || name.includes('coast') || name.includes('bay')) return '🏖️';
        if (name.includes('market') || name.includes('marché')) return '🏪';
        if (name.includes('restaurant') || name.includes('bistro') || name.includes('café')) return '🍽️';

        return '📍'; // Default location icon
    }

    async loadItineraryImages() {
        // Load day location images
        const dayPlaceholders = document.querySelectorAll('.day-image-placeholder');
        for (const placeholder of dayPlaceholders) {
            const location = placeholder.getAttribute('data-location');
            if (location) {
                const imageUrl = await this.getWikipediaImage(location, 400, 200);
                if (imageUrl) {
                    placeholder.innerHTML = `
                        <img src="${imageUrl}" alt="${location}" class="day-image"
                             onload="this.classList.add('loaded')">
                    `;
                } else {
                    placeholder.innerHTML = `
                        <div class="no-image-icon-small">${this.getLocationIcon(location)}</div>
                    `;
                }
            }
        }

        // Load activity images
        const activityPlaceholders = document.querySelectorAll('.activity-image-placeholder');
        for (const placeholder of activityPlaceholders) {
            const activity = placeholder.getAttribute('data-activity');
            if (activity) {
                const imageUrl = await this.getWikipediaImage(activity, 300, 200);
                if (imageUrl) {
                    placeholder.innerHTML = `
                        <img src="${imageUrl}" alt="${activity}" class="activity-image"
                             onload="this.classList.add('loaded')">
                    `;
                } else {
                    placeholder.innerHTML = `
                        <div class="no-image-icon-small">🎯</div>
                    `;
                }
            }
        }
    }

    setupEventListeners() {
        // Back button
        document.getElementById('backButton').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Navigation export buttons
        document.getElementById('exportGoogleMapsSpotlight').addEventListener('click', () => {
            this.exportToGoogleMaps();
        });

        document.getElementById('exportWazeSpotlight').addEventListener('click', () => {
            this.exportToWaze();
        });

        // Generate itinerary button
        document.getElementById('generateItinerary').addEventListener('click', () => {
            this.generateDetailedItinerary();
        });

        // Hotels & Restaurants button
        document.getElementById('loadHotelsRestaurants').addEventListener('click', () => {
            this.loadHotelsRestaurants();
        });

        // Budget filter change
        document.getElementById('budgetFilter').addEventListener('change', () => {
            // Clear current recommendations when budget changes
            const container = document.getElementById('hotelsRestaurantsContainer');
            container.innerHTML = '<div class="recommendations-placeholder"><p>Click "Load Recommendations" to discover the best hotels and restaurants for each city on your route.</p></div>';
        });
    }

    async generateDetailedItinerary() {
        const btn = document.getElementById('generateItinerary');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.btn-spinner');
        const container = document.getElementById('itineraryContainer');
        
        // Set loading state
        btn.disabled = true;
        btnText.textContent = 'Generating...';
        spinner.classList.remove('hidden');
        
        // Show loading message
        container.innerHTML = `
            <div class="itinerary-loading">
                <div class="loading-icon">⏳</div>
                <p>Creating your personalized day-by-day itinerary...</p>
                <small>This may take a moment as we craft the perfect ${this.spotlightData.agent} experience for you.</small>
            </div>
        `;

        try {
            const itinerary = await this.requestDetailedItinerary();
            this.displayItinerary(itinerary);
        } catch (error) {
            console.error('Error generating itinerary:', error);
            
            // Show error message in container instead of alert
            container.innerHTML = `
                <div class="itinerary-error">
                    <div class="error-icon">⚠️</div>
                    <h3>Unable to Generate Itinerary</h3>
                    <p>We're experiencing high demand right now. The AI service is temporarily unavailable.</p>
                    <div class="error-actions">
                        <button class="retry-btn" onclick="document.getElementById('generateItinerary').click()">
                            Try Again
                        </button>
                        <p><small>Or try again in a few minutes when the service is less busy.</small></p>
                    </div>
                </div>
            `;
        } finally {
            // Reset button state
            btn.disabled = false;
            btnText.textContent = 'Generate Day-by-Day Plan';
            spinner.classList.add('hidden');
        }
    }

    async requestDetailedItinerary() {
        const waypoints = this.extractWaypoints(this.spotlightData.agentData);
        const { agent, destination, origin } = this.spotlightData;
        
        const response = await fetch('/api/generate-itinerary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent: agent,
                origin: origin,
                destination: destination,
                waypoints: waypoints
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate itinerary');
        }

        return await response.json();
    }

    displayItinerary(itineraryResponse) {
        const container = document.getElementById('itineraryContainer');
        
        try {
            // Try to parse the itinerary JSON response
            let itinerary = itineraryResponse.itinerary;
            let parsedItinerary = null;
            
            console.log('Raw itinerary response:', itinerary);
            
            if (typeof itinerary === 'string') {
                // Multiple parsing strategies
                
                // Strategy 1: Look for ```json code blocks
                const jsonMatch = itinerary.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    console.log('Found JSON in code block');
                    try {
                        parsedItinerary = JSON.parse(jsonMatch[1]);
                    } catch (e) {
                        console.log('JSON in code block is malformed, trying to fix...');
                        // Try to fix incomplete JSON
                        parsedItinerary = this.tryFixIncompleteJson(jsonMatch[1]);
                    }
                } else {
                    // Strategy 2: Look for any JSON object starting with {
                    const jsonStart = itinerary.indexOf('{');
                    if (jsonStart !== -1) {
                        // Find the matching closing brace by counting braces
                        let braceCount = 0;
                        let jsonEnd = -1;
                        
                        for (let i = jsonStart; i < itinerary.length; i++) {
                            if (itinerary[i] === '{') braceCount++;
                            if (itinerary[i] === '}') braceCount--;
                            if (braceCount === 0) {
                                jsonEnd = i;
                                break;
                            }
                        }
                        
                        if (jsonEnd !== -1) {
                            const jsonString = itinerary.substring(jsonStart, jsonEnd + 1);
                            console.log('Extracted JSON string length:', jsonString.length);
                            try {
                                parsedItinerary = JSON.parse(jsonString);
                            } catch (e) {
                                console.log('Extracted JSON is malformed, trying to fix...');
                                parsedItinerary = this.tryFixIncompleteJson(jsonString);
                            }
                        } else {
                            // JSON might be incomplete, try to extract what we can
                            const partialJson = itinerary.substring(jsonStart);
                            console.log('Trying to fix incomplete JSON...');
                            parsedItinerary = this.tryFixIncompleteJson(partialJson);
                        }
                    }
                }
            } else if (typeof itinerary === 'object') {
                // Already parsed object
                parsedItinerary = itinerary;
            }
            
            if (parsedItinerary && parsedItinerary.days) {
                console.log('Successfully parsed itinerary with', parsedItinerary.days.length, 'days');
                let html = '';
                parsedItinerary.days.forEach(day => {
                    html += `
                        <div class="day-card">
                            <div class="day-header">
                                <div class="day-title-section">
                                    <h3 class="day-title">Day ${day.day}</h3>
                                    <span class="day-location">${day.location || ''}</span>
                                </div>
                                ${day.location ? `
                                    <div class="day-image-container">
                                        <div class="day-image-placeholder" data-location="${day.location}">
                                            <div class="image-loading">🔍</div>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="day-activities">
                                ${day.activities ? day.activities.map(activity => `
                                    <div class="activity-item">
                                        <span class="activity-time">${activity.time || ''}</span>
                                        <div class="activity-content">
                                            <h4 class="activity-title">${activity.title || activity.name || ''}</h4>
                                            <p class="activity-description">${activity.description || ''}</p>
                                            ${activity.title ? `
                                                <div class="activity-image-container">
                                                    <div class="activity-image-placeholder" data-activity="${activity.title || activity.name}">
                                                        <div class="image-loading">🎯</div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('') : ''}
                                ${day.accommodation ? `
                                    <div class="accommodation-section">
                                        <h5>🏨 Accommodation</h5>
                                        <p>${day.accommodation}</p>
                                    </div>
                                ` : ''}
                                ${day.meals ? `
                                    <div class="meals-section">
                                        <h5>🍽️ Meals</h5>
                                        ${day.meals.breakfast ? `<p><strong>Breakfast:</strong> ${day.meals.breakfast}</p>` : ''}
                                        ${day.meals.lunch ? `<p><strong>Lunch:</strong> ${day.meals.lunch}</p>` : ''}
                                        ${day.meals.dinner ? `<p><strong>Dinner:</strong> ${day.meals.dinner}</p>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;

                // Load images asynchronously for day locations and activities
                this.loadItineraryImages();
            } else {
                console.log('Could not parse JSON, falling back to raw display');
                // Fallback to show raw content if JSON parsing fails
                this.displayRawItinerary(itinerary);
            }
        } catch (e) {
            console.error('Error parsing itinerary JSON:', e);
            console.log('Falling back to raw content display');
            this.displayRawItinerary(itineraryResponse.itinerary);
        }
    }

    displayRawItinerary(itinerary) {
        const container = document.getElementById('itineraryContainer');
        
        // Format the raw text nicely
        const formattedText = itinerary
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
            
        container.innerHTML = `
            <div class="itinerary-content">
                <p>${formattedText}</p>
            </div>
        `;
    }

    tryFixIncompleteJson(jsonString) {
        try {
            // First, try parsing as-is
            return JSON.parse(jsonString);
        } catch (e) {
            console.log('Attempting to fix incomplete JSON...');
            
            // Common fixes for incomplete JSON
            let fixedJson = jsonString.trim();
            
            // Remove any trailing commas before closing braces/brackets
            fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
            
            // If it ends with a comma and incomplete structure, try to close it properly
            if (fixedJson.endsWith(',')) {
                fixedJson = fixedJson.slice(0, -1);
            }
            
            // Count braces and brackets to see what's missing
            const openBraces = (fixedJson.match(/{/g) || []).length;
            const closeBraces = (fixedJson.match(/}/g) || []).length;
            const openBrackets = (fixedJson.match(/\[/g) || []).length;
            const closeBrackets = (fixedJson.match(/]/g) || []).length;
            
            // Add missing closing braces
            for (let i = 0; i < openBraces - closeBraces; i++) {
                fixedJson += '}';
            }
            
            // Add missing closing brackets
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                fixedJson += ']';
            }
            
            // Try to parse the fixed version
            try {
                const parsed = JSON.parse(fixedJson);
                console.log('Successfully fixed incomplete JSON');
                return parsed;
            } catch (e2) {
                console.log('Could not fix JSON, extracting partial data...');
                
                // Last resort: try to extract at least the days array
                const daysMatch = fixedJson.match(/"days"\s*:\s*\[([\s\S]*)/);
                if (daysMatch) {
                    try {
                        // Try to create a minimal valid structure
                        const daysContent = daysMatch[1];
                        const simplifiedJson = `{"days":[${daysContent.split('},')[0]}}]}`;
                        return JSON.parse(simplifiedJson);
                    } catch (e3) {
                        console.log('All JSON fixes failed');
                        return null;
                    }
                }
                
                return null;
            }
        }
    }

    getAgentEmoji(agent) {
        const emojis = {
            adventure: '🏔️',
            culture: '🏛️',
            food: '🍽️'
        };
        return emojis[agent] || '🤖';
    }

    exportToGoogleMaps() {
        try {
            const waypoints = this.extractWaypoints(this.spotlightData.agentData);
            const destination = this.spotlightData.destination;

            if (waypoints.length === 0) {
                alert('No waypoints found for this route. Please generate a route first.');
                return;
            }

            // Create Google Maps URL with waypoints
            const origin = 'Aix-en-Provence, France';
            let googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}`;

            // Add waypoints
            waypoints.forEach(wp => {
                googleMapsUrl += `/${encodeURIComponent(wp.name)}`;
            });

            googleMapsUrl += `/${encodeURIComponent(destination)}`;

            // Open in new tab
            window.open(googleMapsUrl, '_blank');

        } catch (error) {
            console.error('Error exporting to Google Maps:', error);
            alert('Could not export to Google Maps. Please try again.');
        }
    }

    exportToWaze() {
        try {
            const waypoints = this.extractWaypoints(this.spotlightData.agentData);
            const destination = this.spotlightData.destination;

            if (waypoints.length === 0) {
                alert('No waypoints found for this route. Please generate a route first.');
                return;
            }

            // Waze doesn't support multiple waypoints well, so we'll create a route to the final destination
            // and show a message about waypoints
            const waypointNames = waypoints.map(wp => wp.name).join(', ');
            const confirmMessage = `Waze will navigate directly to ${destination}.\n\nPlanned stops along the way: ${waypointNames}\n\nContinue?`;

            if (!confirm(confirmMessage)) {
                return;
            }

            // Create Waze URL to final destination
            const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;

            // Open in new tab
            window.open(wazeUrl, '_blank');

        } catch (error) {
            console.error('Error exporting to Waze:', error);
            alert('Could not export to Waze. Please try again.');
        }
    }

    async loadHotelsRestaurants() {
        const btn = document.getElementById('loadHotelsRestaurants');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.btn-spinner');
        const container = document.getElementById('hotelsRestaurantsContainer');
        const budgetSelect = document.getElementById('budgetFilter');

        // Set loading state
        btn.disabled = true;
        btnText.style.display = 'none';
        spinner.classList.remove('hidden');

        // Show loading state
        container.innerHTML = `
            <div class="loading-recommendations">
                <div class="spinner-large"></div>
                <p>Loading hotels and restaurants for your route...</p>
                <small>This may take a moment as we fetch the best recommendations</small>
            </div>
        `;

        try {
            const budget = budgetSelect.value;
            const cities = this.spotlightData.waypoints || [];

            // Add origin and destination to cities list
            const allCities = [
                { name: this.spotlightData.origin, coordinates: [5.4474, 43.5297] }, // Aix-en-Provence
                ...cities,
                { name: this.spotlightData.destination }
            ];

            const recommendationsData = [];

            // Fetch hotels and restaurants for each city
            for (const city of allCities) {
                try {
                    console.log(`Fetching recommendations for ${city.name}`);

                    const response = await fetch('/api/get-hotels-restaurants', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            city: city.name,
                            budget: budget,
                            preferences: {}
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    recommendationsData.push({
                        cityName: city.name,
                        ...data
                    });
                } catch (cityError) {
                    console.warn(`Failed to fetch data for ${city.name}:`, cityError);
                    // Add fallback data for this city
                    recommendationsData.push({
                        cityName: city.name,
                        city: city.name,
                        hotels: [{
                            name: `${city.name} Hotel`,
                            stars: 3,
                            priceRange: budget === 'budget' ? '€-€€' : budget === 'luxury' ? '€€€-€€€€' : '€€-€€€',
                            pricePerNight: "€80-120",
                            distance: "City center",
                            amenities: ["WiFi", "Reception"],
                            highlights: "Comfortable stay in the heart of the city",
                            bookingUrl: "#",
                            address: `${city.name} city center`,
                            image: {
                                url: `https://via.placeholder.com/400x300/4A90E2/white?text=🏨+Hotel`,
                                thumb: `https://via.placeholder.com/200x150/4A90E2/white?text=🏨`,
                                alt: `${city.name} - Hotel`,
                                photographer: 'Placeholder',
                                source: 'Placeholder'
                            }
                        }],
                        restaurants: [{
                            name: `${city.name} Restaurant`,
                            cuisine: "Local",
                            priceRange: budget === 'budget' ? '€-€€' : budget === 'luxury' ? '€€€-€€€€' : '€€-€€€',
                            avgPrice: "€20-35 per person",
                            mustTry: ["Local specialty"],
                            atmosphere: "Casual",
                            openingHours: "12:00-22:00",
                            specialFeatures: "Traditional cuisine",
                            reservationUrl: "#",
                            address: `${city.name} city center`,
                            image: {
                                url: `https://via.placeholder.com/400x300/FF6B35/white?text=🍽️+Restaurant`,
                                thumb: `https://via.placeholder.com/200x150/FF6B35/white?text=🍽️`,
                                alt: `${city.name} - Restaurant`,
                                photographer: 'Placeholder',
                                source: 'Placeholder'
                            }
                        }],
                        images: [{
                            url: 'https://via.placeholder.com/800x400?text=' + encodeURIComponent(city.name),
                            caption: `${city.name} - Image not available`,
                            source: 'Placeholder'
                        }]
                    });
                }
            }

            // Render the recommendations
            this.renderHotelsRestaurants(recommendationsData);

        } catch (error) {
            console.error('Error loading hotels and restaurants:', error);
            container.innerHTML = `
                <div class="error-recommendations">
                    <h3>🚫 Unable to load recommendations</h3>
                    <p>We encountered an issue while fetching hotel and restaurant data.</p>
                    <button class="retry-btn" onclick="document.getElementById('loadHotelsRestaurants').click()">
                        Try Again
                    </button>
                    <p><small>Or try again in a few minutes when the service is less busy.</small></p>
                </div>
            `;
        } finally {
            // Reset button state
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.classList.add('hidden');
        }
    }

    renderHotelsRestaurants(recommendationsData) {
        const container = document.getElementById('hotelsRestaurantsContainer');

        if (!recommendationsData || recommendationsData.length === 0) {
            container.innerHTML = '<div class="error-recommendations"><p>No recommendations available.</p></div>';
            return;
        }

        let html = '';

        recommendationsData.forEach(cityData => {
            const { cityName, hotels = [], restaurants = [], images = [] } = cityData;

            // Get primary city image
            const primaryImage = images[0];

            html += `
                <div class="city-recommendations">
                    <div class="city-header">
                        ${primaryImage ? `<img src="${primaryImage.url}" alt="${cityName}" class="city-image" onerror="this.src='https://via.placeholder.com/60x60?text=${encodeURIComponent(cityName.charAt(0))}';">` : ''}
                        <h3>${cityName}</h3>
                    </div>

                    <div class="recommendations-grid">
                        <div class="hotels-section">
                            <h4 class="section-title">🏨 Where to Stay</h4>
                            ${this.renderHotelCards(hotels.slice(0, 3))}
                        </div>

                        <div class="restaurants-section">
                            <h4 class="section-title">🍽️ Where to Eat</h4>
                            ${this.renderRestaurantCards(restaurants.slice(0, 3))}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderHotelCards(hotels) {
        if (!hotels || hotels.length === 0) {
            return '<p class="no-recommendations">No hotel recommendations available.</p>';
        }

        return hotels.map(hotel => {
            const stars = '★'.repeat(hotel.stars || 3) + '☆'.repeat(5 - (hotel.stars || 3));
            const amenitiesText = Array.isArray(hotel.amenities) ? hotel.amenities.slice(0, 3).join(', ') : 'Standard amenities';

            return `
                <div class="recommendation-card hotel-card">
                    ${hotel.image ? `
                    <div class="card-image-container">
                        <img src="${hotel.image.thumb}" alt="${hotel.image.alt}" class="card-image"
                             onerror="this.src='${hotel.image.url}'; this.onerror=null;">
                        ${hotel.image.source === 'Unsplash' ? `<div class="image-credit">Photo by ${hotel.image.photographer}</div>` : ''}
                    </div>
                    ` : ''}

                    <div class="card-content">
                        <div class="card-header">
                            <h5 class="card-title">${hotel.name}</h5>
                            <div class="card-rating">
                                <span class="stars">${stars}</span>
                            </div>
                        </div>

                        <div class="card-meta">
                            <span class="meta-item">${hotel.priceRange}</span>
                            <span class="meta-item">${hotel.pricePerNight}</span>
                            <span class="meta-item">${hotel.distance}</span>
                        </div>

                        <p class="card-description">${hotel.highlights || 'Great hotel in the city center'}</p>

                        <div class="card-features">
                            ${amenitiesText.split(',').map(amenity => `<span class="feature-tag">${amenity.trim()}</span>`).join('')}
                        </div>

                        <div class="card-actions">
                            ${hotel.bookingUrl && hotel.bookingUrl !== '#' ?
                                `<a href="${hotel.bookingUrl}" target="_blank" class="action-btn primary-action">Book Now</a>` :
                                `<button class="action-btn primary-action" onclick="alert('Booking link not available')">Book Now</button>`
                            }
                            <button class="action-btn secondary-action" onclick="alert('Address: ${hotel.address || hotel.name}')">View Details</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRestaurantCards(restaurants) {
        if (!restaurants || restaurants.length === 0) {
            return '<p class="no-recommendations">No restaurant recommendations available.</p>';
        }

        return restaurants.map(restaurant => {
            const mustTryText = Array.isArray(restaurant.mustTry) ? restaurant.mustTry.slice(0, 2).join(', ') : 'Local specialties';

            return `
                <div class="recommendation-card restaurant-card">
                    ${restaurant.image ? `
                    <div class="card-image-container">
                        <img src="${restaurant.image.thumb}" alt="${restaurant.image.alt}" class="card-image"
                             onerror="this.src='${restaurant.image.url}'; this.onerror=null;">
                        ${restaurant.image.source === 'Unsplash' ? `<div class="image-credit">Photo by ${restaurant.image.photographer}</div>` : ''}
                    </div>
                    ` : ''}

                    <div class="card-content">
                        <div class="card-header">
                            <h5 class="card-title">${restaurant.name}</h5>
                            <div class="card-rating">
                                <span class="cuisine-type">${restaurant.cuisine || 'Local'}</span>
                            </div>
                        </div>

                        <div class="card-meta">
                            <span class="meta-item">${restaurant.priceRange}</span>
                            <span class="meta-item">${restaurant.avgPrice}</span>
                            <span class="meta-item">${restaurant.atmosphere}</span>
                        </div>

                        <p class="card-description">Must try: ${mustTryText}</p>

                        <div class="card-features">
                            <span class="feature-tag">${restaurant.openingHours}</span>
                            ${restaurant.specialFeatures ? `<span class="feature-tag">${restaurant.specialFeatures}</span>` : ''}
                        </div>

                        <div class="card-actions">
                            ${restaurant.reservationUrl && restaurant.reservationUrl !== '#' ?
                                `<a href="${restaurant.reservationUrl}" target="_blank" class="action-btn primary-action">Reserve</a>` :
                                `<button class="action-btn primary-action" onclick="alert('Reservation link not available')">Reserve</button>`
                            }
                            <button class="action-btn secondary-action" onclick="alert('Address: ${restaurant.address || restaurant.name}')">View Details</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Initialize the spotlight page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpotlightController();
});