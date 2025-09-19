// Spotlight Page Controller
class SpotlightController {
    constructor() {
        this.map = null;
        this.spotlightData = null;
        this.imageCache = new Map(); // Cache for Wikipedia images
        this.landmarkMarkers = []; // Store landmark markers for cleanup
        this.addedLandmarkMarkers = []; // Store user-added landmark markers separately
        this.agentColors = {
            adventure: '#34C759',
            culture: '#FFD60A',
            food: '#FF3B30',
            'hidden-gems': '#9333ea'
        };

        // Make this instance globally available for popup buttons
        window.spotlightController = this;

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
        this.setupNavigation();
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
            food: '🍽️',
            'hidden-gems': '💎'
        };

        const agentNames = {
            adventure: 'Adventure Route',
            culture: 'Culture Route',
            food: 'Food Route',
            'hidden-gems': 'Hidden Gems Route'
        };

        // Handle icon display - use innerHTML for images, textContent for emojis
        const iconElement = document.getElementById('routeAgentIcon');

        // Use custom PNG icons with much bigger styling from images/icons/
        if (agent === 'adventure') {
            iconElement.innerHTML = '<img src="images/icons/adventure_icon.png" alt="Adventure" style="width: 80px; height: 80px; object-fit: contain;">';
        } else if (agent === 'culture') {
            iconElement.innerHTML = '<img src="images/icons/culture_icon.png" alt="Culture" style="width: 80px; height: 80px; object-fit: contain;">';
        } else if (agent === 'food') {
            iconElement.innerHTML = '<img src="images/icons/food_icon.png" alt="Food" style="width: 80px; height: 80px; object-fit: contain;">';
        } else if (agent === 'hidden-gems') {
            iconElement.innerHTML = '<img src="images/icons/hidden_gem_icon.png" alt="Hidden Gems" style="width: 80px; height: 80px; object-fit: contain;">';
        } else {
            // Fallback to emoji
            iconElement.textContent = agentEmojis[agent] || '🗺️';
        }
        document.getElementById('routeTitle').textContent = agentNames[agent];

        // Update route subtitle with country flags
        this.updateRouteSubtitle(origin, destination);

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
            center: [10.4515, 51.1657], // Center of Europe
            zoom: 4, // Zoom level to show most of Europe
            minZoom: 3,
            maxZoom: 15,
            // Disable telemetry collection to prevent ad-blocker issues
            collectResourceTiming: false
        });

        // Add navigation controls
        this.map.addControl(new mapboxgl.NavigationControl());

        // When map loads, add route and markers
        this.map.on('load', () => {
            this.addRouteToMap();

            // Restore any previously added landmark markers
            this.restoreAddedLandmarksFromStorage();
        });

        // Reload landmarks when map is moved/zoomed
        let landmarkTimeout;
        this.map.on('moveend', () => {
            clearTimeout(landmarkTimeout);
            landmarkTimeout = setTimeout(() => {
                this.loadLandmarksOnMap();
            }, 500); // Debounce to avoid too many API calls
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

            // Load and display European landmarks on the map
            await this.loadLandmarksOnMap();
        }
    }

    async loadLandmarksOnMap() {
        try {
            // Clear existing landmark markers
            this.landmarkMarkers.forEach(marker => marker.remove());
            this.landmarkMarkers = [];

            // Get map bounds
            const bounds = this.map.getBounds();

            // Fetch landmarks within visible area
            const response = await fetch(`/api/landmarks/region?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}`);

            if (!response.ok) {
                console.error('Failed to fetch landmarks');
                return;
            }

            const data = await response.json();
            const landmarks = data.landmarks || [];
            console.log(`📍 Loaded ${landmarks.length} landmarks:`, landmarks.map(l => l.name));

            // Define landmark colors by type
            const typeColors = {
                monument: '#FF6B6B',
                historic: '#4ECDC4',
                cultural: '#FFD93D',
                natural: '#95E77E'
            };

            // Add landmark markers to map
            landmarks.forEach(landmark => {
                const color = typeColors[landmark.type] || '#9333EA';

                // Create custom marker element with icon and strict isolation
                const el = document.createElement('div');
                el.className = 'landmark-marker-custom';
                el.style.width = '35px';
                el.style.height = '35px';
                el.style.borderRadius = '50%';
                el.style.backgroundColor = color;
                el.style.border = '3px solid white';
                el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                el.style.cursor = 'pointer';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.fontSize = '18px';
                el.style.transition = 'all 0.3s ease';

                // Force isolation from map events
                el.style.pointerEvents = 'auto';
                el.style.position = 'relative';
                el.style.zIndex = '9999';

                // Prevent any focus-related issues
                el.setAttribute('tabindex', '-1');
                el.setAttribute('role', 'presentation');

                // Add icon based on specific landmark or type
                const icon = this.getSpecificLandmarkIcon(landmark.name, landmark.type);
                el.innerHTML = icon;


                // Add hover effect with event prevention and debugging
                el.addEventListener('mouseenter', (e) => {
                    console.log(`🖱️ MOUSEENTER on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();
                    el.style.transform = 'scale(1.1)';
                    el.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                    console.log(`✅ MOUSEENTER handled for: ${landmark.name}`);
                });

                el.addEventListener('mouseleave', (e) => {
                    console.log(`🖱️ MOUSELEAVE on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();
                    el.style.transform = 'scale(1)';
                    el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                    console.log(`✅ MOUSELEAVE handled for: ${landmark.name}`);
                });

                // Prevent map jumping on all mouse events with debugging
                el.addEventListener('click', (e) => {
                    console.log(`🖱️ CLICK on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(`✅ CLICK handled for: ${landmark.name}`);
                });

                el.addEventListener('mouseover', (e) => {
                    console.log(`🖱️ MOUSEOVER on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(`✅ MOUSEOVER handled for: ${landmark.name}`);
                });

                el.addEventListener('mouseout', (e) => {
                    console.log(`🖱️ MOUSEOUT on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(`✅ MOUSEOUT handled for: ${landmark.name}`);
                });

                el.addEventListener('mousedown', (e) => {
                    console.log(`🖱️ MOUSEDOWN on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(`✅ MOUSEDOWN handled for: ${landmark.name}`);
                });

                el.addEventListener('mouseup', (e) => {
                    console.log(`🖱️ MOUSEUP on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(`✅ MOUSEUP handled for: ${landmark.name}`);
                });

                // Create popup with landmark details
                const popupContent = `
                    <div style="padding: 10px; max-width: 250px;">
                        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                            ${icon} ${landmark.name}
                        </h3>
                        <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                            ${landmark.city}, ${landmark.country}
                        </p>
                        ${landmark.description ? `
                            <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.4;">
                                ${landmark.description}
                            </p>
                        ` : ''}
                        ${landmark.rating ? `
                            <div style="display: flex; align-items: center; gap: 5px; font-size: 13px; margin-bottom: 10px;">
                                <span>⭐ ${landmark.rating}</span>
                                ${landmark.visit_duration ? `<span>• ${landmark.visit_duration} min</span>` : ''}
                            </div>
                        ` : ''}
                        <button onclick="window.spotlightController.addLandmarkToRoute('${landmark.name}', ${landmark.lat}, ${landmark.lng}, '${landmark.type}', '${landmark.description || ''}', '${landmark.city}')"
                                style="background: var(--agent-primary-color, #007AFF); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; width: 100%; margin-top: 5px;">
                            ✚ Add to Route
                        </button>
                    </div>
                `;

                // Try custom overlay approach instead of Mapbox marker
                console.log(`📍 Creating custom overlay for ${landmark.name} at [${landmark.lng}, ${landmark.lat}]`);

                // Check if we have a custom image for this landmark
                const customImage = this.getCustomLandmarkImage(landmark.name);

                // Create a completely isolated div that won't interfere with map
                const overlayEl = document.createElement('div');
                overlayEl.className = 'landmark-overlay-custom';

                // Create a label container for the landmark name
                const labelContainer = document.createElement('div');
                labelContainer.className = 'landmark-label';
                labelContainer.style.cssText = `
                    position: absolute;
                    top: -35px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255, 255, 255, 0.95);
                    color: #333;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    pointer-events: none;
                    z-index: 1001;
                `;
                labelContainer.textContent = landmark.name;

                if (customImage) {
                    // Use custom image as background
                    overlayEl.style.cssText = `
                        position: absolute;
                        width: 50px;
                        height: 50px;
                        border-radius: 10px;
                        background-image: url('${customImage}');
                        background-size: cover;
                        background-position: center;
                        border: 3px solid white;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        cursor: pointer;
                        transition: all 0.3s ease;
                        pointer-events: auto;
                        z-index: 1000;
                        transform: translate(-50%, -50%);
                    `;
                } else {
                    // Fallback to emoji icon
                    overlayEl.style.cssText = `
                        position: absolute;
                        width: 35px;
                        height: 35px;
                        border-radius: 50%;
                        background-color: ${color};
                        border: 3px solid white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        transition: all 0.3s ease;
                        pointer-events: auto;
                        z-index: 1000;
                        transform: translate(-50%, -50%);
                    `;
                    overlayEl.innerHTML = icon;
                }

                // Add the label to the overlay
                overlayEl.appendChild(labelContainer);

                // Add all our event handlers to the overlay element
                console.log(`🎯 Setting up overlay element for ${landmark.name}`);

                // Add hover effect with event prevention and debugging
                overlayEl.addEventListener('mouseenter', (e) => {
                    console.log(`🖱️ OVERLAY MOUSEENTER on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();
                    overlayEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
                    overlayEl.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                    labelContainer.style.opacity = '1';
                    console.log(`✅ OVERLAY MOUSEENTER handled for: ${landmark.name}`);
                });

                overlayEl.addEventListener('mouseleave', (e) => {
                    console.log(`🖱️ OVERLAY MOUSELEAVE on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();
                    overlayEl.style.transform = 'translate(-50%, -50%) scale(1)';
                    overlayEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                    labelContainer.style.opacity = '0';
                    console.log(`✅ OVERLAY MOUSELEAVE handled for: ${landmark.name}`);
                });

                // Create popup manually when clicked
                overlayEl.addEventListener('click', (e) => {
                    console.log(`🖱️ OVERLAY CLICK on landmark: ${landmark.name}`, e);
                    e.stopPropagation();
                    e.preventDefault();

                    // Show custom popup
                    this.showCustomLandmarkPopup(landmark, overlayEl);
                    console.log(`✅ OVERLAY CLICK handled for: ${landmark.name}`);
                });

                // Convert lat/lng to screen coordinates and position the overlay
                const updateOverlayPosition = () => {
                    const point = this.map.project([landmark.lng, landmark.lat]);
                    overlayEl.style.left = `${point.x}px`;
                    overlayEl.style.top = `${point.y}px`;
                };

                // Position initially
                updateOverlayPosition();

                // Update position when map moves
                this.map.on('move', updateOverlayPosition);
                this.map.on('zoom', updateOverlayPosition);

                // Add to map container
                const mapContainer = this.map.getContainer();
                mapContainer.appendChild(overlayEl);

                // Store reference for cleanup
                this.landmarkMarkers.push({
                    element: overlayEl,
                    remove: () => {
                        this.map.off('move', updateOverlayPosition);
                        this.map.off('zoom', updateOverlayPosition);
                        if (overlayEl.parentNode) {
                            overlayEl.parentNode.removeChild(overlayEl);
                        }
                    }
                });

                console.log(`✅ Custom overlay added for ${landmark.name}`);
            });

        } catch (error) {
            console.error('Error loading landmarks:', error);
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
        // Get all waypoints in optimized order (cities + landmarks + original waypoints)
        const waypoints = this.getAllCombinedWaypoints();
        const container = document.getElementById('citiesContainer');

        // Save existing landmark cards before clearing
        const existingLandmarkCards = Array.from(container.querySelectorAll('.landmark-card'));

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

            // Check if this is a landmark for special styling
            const isLandmark = waypoint.type === 'landmark' || waypoint.isLandmark;
            const cardClass = isLandmark ? 'city-card landmark-card' : 'city-card';
            const cardStyle = isLandmark ?
                'cursor: pointer; border: 2px solid #9333EA; background: linear-gradient(135deg, #f8f4ff 0%, #e6d9ff 100%);' :
                'cursor: pointer;';

            html += `
                <div class="${cardClass}"
                     data-city-name="${waypoint.name.replace(/"/g, '&quot;')}"
                     data-city-image="${imageUrl || ''}"
                     data-city-description="${(waypoint.description || '').replace(/"/g, '&quot;')}"
                     data-city-activities="${encodeURIComponent(JSON.stringify(waypoint.activities || []))}"
                     style="cursor: pointer;">
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
                        <h3>${waypoint.name}</h3>
                        ${(() => {
                            // Extract activities from description if activities array is empty
                            let activities = waypoint.activities || [];

                            if ((!activities || activities.length === 0) && waypoint.description) {
                                // Try to extract bullet points from description
                                const bulletMatch = waypoint.description.match(/[-•*]\s*([^\\n\\r]+)/g);
                                if (bulletMatch && bulletMatch.length > 0) {
                                    activities = bulletMatch.slice(0, 3).map(item =>
                                        item.replace(/^[-•*]\\s*/, '').trim()
                                    );
                                } else {
                                    // Fallback: split by sentences
                                    const descLines = waypoint.description.split(/[.!?]/)
                                        .filter(line => line.trim() && line.length > 10)
                                        .slice(0, 3)
                                        .map(line => line.trim());

                                    if (descLines.length > 0) {
                                        activities = descLines;
                                    }
                                }
                            }

                            if (activities && activities.length > 0) {
                                return `<ul class="city-activities">
                                    ${activities.slice(0, 3).map(activity => `<li>${activity}</li>`).join('')}
                                </ul>`;
                            } else {
                                return '<p class="no-activities">Click to see details</p>';
                            }
                        })()}
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

        // Restore landmark cards by re-appending them
        existingLandmarkCards.forEach(landmarkCard => {
            container.appendChild(landmarkCard);
        });

        // Add click event listeners to all city cards
        container.querySelectorAll('.city-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const cityName = card.getAttribute('data-city-name');
                const cityImage = card.getAttribute('data-city-image');
                const cityDescription = card.getAttribute('data-city-description');
                const cityActivities = card.getAttribute('data-city-activities');

                let activities = [];
                try {
                    if (cityActivities) {
                        activities = JSON.parse(decodeURIComponent(cityActivities));
                    }
                } catch (err) {
                    console.warn('Could not parse activities:', err);
                }

                this.showCityModal(cityName, cityImage, cityDescription, activities);
            });
        });

        console.log(`Loaded ${waypoints.length} locations with Wikipedia images and restored ${existingLandmarkCards.length} landmark cards`);
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

    setupNavigation() {
        // Set up table of contents navigation
        const tocLinks = document.querySelectorAll('.toc-link');
        const panelSections = document.querySelectorAll('.panel-section');

        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                // Remove active class from all links and sections
                tocLinks.forEach(l => l.classList.remove('active'));
                panelSections.forEach(s => s.classList.remove('active'));

                // Add active class to clicked link
                link.classList.add('active');

                // Show corresponding section
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            });
        });
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

        // Custom dropdown functionality
        this.setupCustomDropdown();
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
                                        <h5><img src="/images/budget/comfortable.png" alt="Accommodation" style="width: 18px; height: 18px; margin-right: 6px; vertical-align: middle;"> Accommodation</h5>
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
            food: '🍽️',
            'hidden-gems': '💎'
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

            // Combine regular waypoints with added landmarks
            let allWaypoints = [...waypoints];
            if (this.spotlightData.addedLandmarks && this.spotlightData.addedLandmarks.length > 0) {
                // Add landmarks to waypoints, sorting by optimal route order if possible
                const landmarks = this.spotlightData.addedLandmarks.map(landmark => ({
                    name: `${landmark.name}, ${landmark.city}`,
                    lat: landmark.lat,
                    lng: landmark.lng
                }));
                allWaypoints = [...allWaypoints, ...landmarks];
            }

            // Create Google Maps URL with all waypoints
            const origin = 'Aix-en-Provence, France';
            let googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}`;

            // Add all waypoints (cities + landmarks)
            allWaypoints.forEach(wp => {
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
                                url: `https://via.placeholder.com/400x300/4A90E2/white?text=Hotel`,
                                thumb: `https://via.placeholder.com/200x150/4A90E2/white?text=Hotel`,
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
                            <h4 class="section-title"><img src="/images/budget/comfortable.png" alt="Hotels" style="width: 20px; height: 20px; margin-right: 8px; vertical-align: middle;"> Where to Stay</h4>
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

    async addLandmarkToRoute(name, lat, lng, type, description, city) {
        try {
            console.log(`Adding landmark to route: ${name} at ${lat}, ${lng}`);

            // Show loading feedback
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '⏳ Adding...';
            button.disabled = true;

            // Get ALL current waypoints (including cities and existing landmarks)
            const currentWaypoints = this.getAllCombinedWaypoints();
            console.log(`🔍 BEFORE OPTIMIZATION: Current waypoints for landmark placement:`, currentWaypoints.map(w => w.name));

            // Create new landmark waypoint
            const landmarkWaypoint = {
                name: name,
                description: description || `Visit ${name} in ${city}`,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                type: type,
                city: city,
                activities: [`Explore ${name}`, `Learn about the history`, `Take photos`],
                duration: type === 'monument' ? '1-2 hours' : '30-60 minutes',
                isLandmark: true
            };

            // COMPLETELY reorder the entire route including the new landmark
            const updatedWaypoints = this.optimizeEntireRouteWithLandmark(currentWaypoints, landmarkWaypoint);

            // Update the route data
            this.updateRouteWithLandmark(updatedWaypoints, landmarkWaypoint);

            // Success feedback
            button.textContent = '✅ Added!';
            button.style.background = '#28a745';

            // Reset button after 2 seconds
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
                button.disabled = false;
            }, 2000);

            // Close popup
            this.map.getCanvas().querySelector('.mapboxgl-popup-close-button')?.click();

        } catch (error) {
            console.error('Error adding landmark to route:', error);

            // Error feedback
            const button = event.target;
            button.textContent = '❌ Error';
            button.style.background = '#dc3545';

            setTimeout(() => {
                button.textContent = '✚ Add to Route';
                button.style.background = '';
                button.disabled = false;
            }, 2000);
        }
    }

    insertLandmarkOptimally(waypoints, landmark) {
        if (waypoints.length === 0) {
            return [landmark];
        }

        // Calculate distances from landmark to each waypoint
        let bestPosition = 0;
        let minAdditionalDistance = Infinity;

        for (let i = 0; i <= waypoints.length; i++) {
            let additionalDistance = 0;

            if (i === 0) {
                // Insert at beginning
                const distanceFromOrigin = this.calculateDistance(43.5297, 5.4474, landmark.lat, landmark.lng);
                const distanceToFirst = waypoints.length > 0 ?
                    this.calculateDistance(landmark.lat, landmark.lng, waypoints[0].lat, waypoints[0].lng) : 0;
                const originalDistanceToFirst = waypoints.length > 0 ?
                    this.calculateDistance(43.5297, 5.4474, waypoints[0].lat, waypoints[0].lng) : 0;
                additionalDistance = distanceFromOrigin + distanceToFirst - originalDistanceToFirst;
            } else if (i === waypoints.length) {
                // Insert at end
                const distanceFromLast = this.calculateDistance(waypoints[i-1].lat, waypoints[i-1].lng, landmark.lat, landmark.lng);
                additionalDistance = distanceFromLast;
            } else {
                // Insert between waypoints
                const distanceFromPrev = this.calculateDistance(waypoints[i-1].lat, waypoints[i-1].lng, landmark.lat, landmark.lng);
                const distanceToNext = this.calculateDistance(landmark.lat, landmark.lng, waypoints[i].lat, waypoints[i].lng);
                const originalDistance = this.calculateDistance(waypoints[i-1].lat, waypoints[i-1].lng, waypoints[i].lat, waypoints[i].lng);
                additionalDistance = distanceFromPrev + distanceToNext - originalDistance;
            }

            if (additionalDistance < minAdditionalDistance) {
                minAdditionalDistance = additionalDistance;
                bestPosition = i;
            }
        }

        // Insert at optimal position
        const updatedWaypoints = [...waypoints];
        updatedWaypoints.splice(bestPosition, 0, landmark);

        console.log(`🎯 Landmark optimization: "${landmark.name}" inserted at position ${bestPosition} out of ${waypoints.length + 1} possible positions`);
        console.log(`📍 Current waypoints:`, waypoints.map(w => w.name));
        console.log(`🗺️ Updated waypoints:`, updatedWaypoints.map(w => w.name));

        return updatedWaypoints;
    }

    updateRouteWithLandmark(updatedWaypoints, landmark) {
        // Initialize addedLandmarks array if it doesn't exist
        if (!this.spotlightData.addedLandmarks) {
            this.spotlightData.addedLandmarks = [];
        }

        // Add landmark to addedLandmarks array (avoid duplicates)
        const existingIndex = this.spotlightData.addedLandmarks.findIndex(l => l.name === landmark.name);
        if (existingIndex === -1) {
            this.spotlightData.addedLandmarks.push(landmark);
        }

        // Update the spotlight data
        this.spotlightData.waypoints = updatedWaypoints;

        // Update localStorage
        localStorage.setItem('spotlightData', JSON.stringify(this.spotlightData));

        // Add landmark marker to map with special styling
        this.addLandmarkMarkerToRoute(landmark);

        // Recalculate and redraw route
        this.recalculateRoute(updatedWaypoints);

        // Update cities display
        this.addLandmarkToCitiesDisplay(landmark);

        // Update stats
        this.updateStatsWithLandmark(landmark);
    }

    addLandmarkMarkerToRoute(landmark) {
        // Check if this landmark marker already exists
        const existingMarker = this.addedLandmarkMarkers.find(({ landmark: l }) => l.name === landmark.name);
        if (existingMarker) {
            console.log(`Landmark marker for "${landmark.name}" already exists`);
            return;
        }

        // Create distinctive marker for added landmarks
        const el = document.createElement('div');
        el.className = 'added-landmark-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#9333EA';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 10px rgba(147, 51, 234, 0.4)';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '16px';
        el.style.animation = 'pulse 2s ease-in-out';

        // Add icon
        const iconMap = {
            monument: '🗼',
            historic: '🏰',
            cultural: '🎭',
            natural: '🏔️'
        };
        el.innerHTML = iconMap[landmark.type] || '⭐';

        // Add to map and store reference
        const marker = new mapboxgl.Marker(el)
            .setLngLat([landmark.lng, landmark.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`
                <div style="padding: 10px;">
                    <h3 style="margin: 0 0 5px 0;">✅ ${landmark.name}</h3>
                    <p style="margin: 0; color: #666; font-size: 13px;">Added to your route!</p>
                </div>
            `))
            .addTo(this.map);

        // Store in separate array for added landmarks
        this.addedLandmarkMarkers.push({
            marker: marker,
            landmark: landmark
        });
    }

    async recalculateRoute(waypoints = null) {
        const destinationCoords = await this.geocodeDestination(this.spotlightData.destination);
        if (destinationCoords) {
            // Gather all waypoints from all systems
            const allWaypoints = this.getAllCombinedWaypoints(waypoints);

            const color = this.agentColors[this.spotlightData.agent];
            await this.createRoute(allWaypoints, destinationCoords, color);
            this.fitMapToRoute(allWaypoints, destinationCoords);
            this.updateDistanceStats(allWaypoints, destinationCoords);

            // Restore added landmark markers after route recalculation
            this.restoreAddedLandmarkMarkers();
        }
    }

    getAllCombinedWaypoints(passedWaypoints = null) {
        try {
            // PRIORITY 1: If landmarks overlay has an optimized route, use it directly
            if (window.landmarksOverlay?.currentRoute?.waypoints && Array.isArray(window.landmarksOverlay.currentRoute.waypoints)) {
                const optimizedWaypoints = window.landmarksOverlay.currentRoute.waypoints
                    .filter(wp => wp && wp.name && wp.lng != null && wp.lat != null)
                    .map(wp => ({
                        name: wp.name,
                        lng: wp.lng,
                        lat: wp.lat,
                        type: wp.type || 'waypoint'
                    }));

                if (optimizedWaypoints.length > 0) {
                    console.log('🎯 SPOTLIGHT: Using optimized waypoints from landmarks overlay:', optimizedWaypoints.length);
                    console.log('🎯 SPOTLIGHT: Optimized order:', optimizedWaypoints.map(wp => wp.name));
                    return optimizedWaypoints;
                }
            }

            // FALLBACK: If no optimized route available, gather from individual sources
            console.log('🎯 SPOTLIGHT: No optimized route found, gathering from individual sources');
            const allWaypoints = [];

            // 1. Start with original route waypoints from spotlight data
            const originalWaypoints = this.extractWaypoints(this.spotlightData.agentData) || [];
            allWaypoints.push(...originalWaypoints);

            // 2. Add cities from destination manager if available
            if (window.destinationManager?.destinations && Array.isArray(window.destinationManager.destinations)) {
                const cityWaypoints = window.destinationManager.destinations
                    .filter(dest => dest && dest.coordinates && Array.isArray(dest.coordinates))
                    .map(dest => ({
                        name: dest.name,
                        lng: dest.coordinates[0],
                        lat: dest.coordinates[1],
                        type: 'city'
                    }));
                allWaypoints.push(...cityWaypoints);
                console.log('Added cities from destination manager:', cityWaypoints.length);
            }

            // 3. Add landmarks from selected landmarks (fallback approach)
            if (window.landmarksOverlay?.selectedLandmarks) {
                const landmarkWaypoints = window.landmarksOverlay.landmarks
                    .filter(landmark => window.landmarksOverlay.selectedLandmarks.has(landmark.id))
                    .map(landmark => ({
                        name: landmark.name,
                        lng: landmark.lng,
                        lat: landmark.lat,
                        type: 'landmark'
                    }));
                allWaypoints.push(...landmarkWaypoints);
                console.log('Added landmarks from selected set:', landmarkWaypoints.length);
            }

            // 4. If waypoints were passed directly (for backward compatibility), add them too
            if (passedWaypoints && Array.isArray(passedWaypoints)) {
                const formattedPassed = passedWaypoints
                    .filter(wp => wp && wp.name)
                    .map(wp => ({
                        name: wp.name,
                        lng: wp.lng || wp.coordinates?.[0] || 0,
                        lat: wp.lat || wp.coordinates?.[1] || 0,
                        type: wp.type || 'waypoint'
                    }));
                allWaypoints.push(...formattedPassed);
                console.log('Added passed waypoints:', formattedPassed.length);
            }

            // Remove duplicates based on name and coordinates
            const uniqueWaypoints = [];
            const seen = new Set();

            allWaypoints.forEach(wp => {
                if (wp && wp.name && wp.lng != null && wp.lat != null) {
                    const key = `${wp.name}-${wp.lng}-${wp.lat}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueWaypoints.push(wp);
                    }
                }
            });

            console.log('Combined waypoints:', uniqueWaypoints);
            return uniqueWaypoints;
        } catch (error) {
            console.warn('Error in getAllCombinedWaypoints:', error);
            // Fallback to original waypoints only
            return this.extractWaypoints(this.spotlightData.agentData) || [];
        }
    }

    restoreAddedLandmarkMarkers() {
        // Re-add all stored landmark markers to the map
        // This ensures they persist through route recalculations
        this.addedLandmarkMarkers.forEach(({ marker, landmark }) => {
            // Check if marker still exists on the map, if not, re-add it
            if (!marker._map) {
                marker.addTo(this.map);
            }
        });
    }

    restoreAddedLandmarksFromStorage() {
        // Restore added landmarks from localStorage when page loads
        if (this.spotlightData?.addedLandmarks && this.spotlightData.addedLandmarks.length > 0) {
            this.spotlightData.addedLandmarks.forEach(landmark => {
                // Create markers for each stored landmark
                this.addLandmarkMarkerToRoute(landmark);
            });
        }
    }

    async addLandmarkToCitiesDisplay(landmark) {
        const container = document.getElementById('citiesContainer');
        const existingCards = container.querySelectorAll('.city-card');

        // Create landmark card
        const landmarkCard = document.createElement('div');
        landmarkCard.className = 'city-card landmark-card';
        landmarkCard.style.border = '2px solid #9333EA';
        landmarkCard.style.background = 'linear-gradient(135deg, #f8f4ff 0%, #e6d9ff 100%)';

        // Start with placeholder, then fetch Wikipedia image
        landmarkCard.innerHTML = `
            <div class="city-image-container">
                <div class="loading-image-placeholder">
                    <div class="loading-spinner">🔍</div>
                    <div class="loading-text">Finding image...</div>
                </div>
            </div>
            <div class="city-content">
                <h3>⭐ ${landmark.name}</h3>
                <p class="city-description">${landmark.description}</p>
                <div class="landmark-details">
                    <span class="landmark-type">${landmark.type.charAt(0).toUpperCase() + landmark.type.slice(1)}</span>
                    <span class="landmark-city">${landmark.city}</span>
                    <span class="landmark-duration">${landmark.duration}</span>
                </div>
                <ul class="city-activities">
                    ${landmark.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
            </div>
        `;

        // Insert in appropriate position based on optimal route
        const waypoints = this.extractWaypoints(this.spotlightData.agentData);
        const landmarkIndex = waypoints.findIndex(w => w.name === landmark.name);

        if (landmarkIndex >= 0 && landmarkIndex < existingCards.length) {
            container.insertBefore(landmarkCard, existingCards[landmarkIndex]);
        } else {
            container.appendChild(landmarkCard);
        }

        // Animate the new card
        landmarkCard.style.transform = 'scale(0.8)';
        landmarkCard.style.opacity = '0';
        setTimeout(() => {
            landmarkCard.style.transition = 'all 0.5s ease';
            landmarkCard.style.transform = 'scale(1)';
            landmarkCard.style.opacity = '1';
        }, 100);

        // Fetch Wikipedia image for the landmark
        try {
            console.log(`🖼️ Fetching Wikipedia image for landmark: ${landmark.name}`);
            const imageUrl = await this.getWikipediaImage(landmark.name, 800, 600);

            const imageContainer = landmarkCard.querySelector('.city-image-container');
            if (imageUrl) {
                console.log(`✅ Found Wikipedia image for ${landmark.name}:`, imageUrl);
                imageContainer.innerHTML = `
                    <img src="${imageUrl}" alt="${landmark.name}" class="city-image"
                         onload="this.classList.add('loaded')"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\"no-image-placeholder\\"><div class=\\"no-image-icon\\">${this.getLandmarkIcon(landmark.type)}</div><div class=\\"no-image-text\\">${landmark.name}</div></div>';">
                `;
            } else {
                console.log(`❌ No Wikipedia image found for ${landmark.name}, using icon placeholder`);
                imageContainer.innerHTML = `
                    <div class="no-image-placeholder">
                        <div class="no-image-icon">${this.getLandmarkIcon(landmark.type)}</div>
                        <div class="no-image-text">${landmark.name}</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error(`Error fetching Wikipedia image for ${landmark.name}:`, error);
            const imageContainer = landmarkCard.querySelector('.city-image-container');
            imageContainer.innerHTML = `
                <div class="no-image-placeholder">
                    <div class="no-image-icon">${this.getLandmarkIcon(landmark.type)}</div>
                    <div class="no-image-text">${landmark.name}</div>
                </div>
            `;
        }
    }

    getLandmarkIcon(type) {
        const icons = {
            monument: '🗼',
            historic: '🏰',
            cultural: '🎭',
            natural: '🏔️'
        };
        return icons[type] || '⭐';
    }

    updateStatsWithLandmark(landmark) {
        // Update total stops count
        const totalStopsElement = document.getElementById('totalStops');
        if (totalStopsElement) {
            const currentStops = parseInt(totalStopsElement.textContent) || 0;
            totalStopsElement.textContent = currentStops + 1;
        }

        // Show success notification
        this.showNotification(`${landmark.name} added to your route!`, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#007AFF'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    showCustomLandmarkPopup(landmark, overlayElement) {
        // Remove any existing popup
        const existingPopup = document.querySelector('.custom-landmark-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create custom popup
        const popup = document.createElement('div');
        popup.className = 'custom-landmark-popup';
        popup.style.cssText = `
            position: absolute;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            z-index: 10000;
            max-width: 250px;
            padding: 0;
            pointer-events: auto;
        `;

        const icon = this.getSpecificLandmarkIcon(landmark.name, landmark.type);
        popup.innerHTML = `
            <div style="padding: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600;">
                        ${icon} ${landmark.name}
                    </h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 16px; cursor: pointer; padding: 0; color: #666;">×</button>
                </div>
                <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                    ${landmark.city}, ${landmark.country}
                </p>
                ${landmark.description ? `
                    <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.4;">
                        ${landmark.description}
                    </p>
                ` : ''}
                ${landmark.rating ? `
                    <div style="display: flex; align-items: center; gap: 5px; font-size: 13px; margin-bottom: 10px;">
                        <span>⭐ ${landmark.rating}</span>
                        ${landmark.visit_duration ? `<span>• ${landmark.visit_duration} min</span>` : ''}
                    </div>
                ` : ''}
                <button onclick="window.spotlightController.addLandmarkToRoute('${landmark.name}', ${landmark.lat}, ${landmark.lng}, '${landmark.type}', '${landmark.description || ''}', '${landmark.city}')"
                        style="background: var(--agent-primary-color, #007AFF); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; width: 100%; margin-top: 5px;">
                    ✚ Add to Route
                </button>
            </div>
        `;

        // Position popup near the overlay element
        const rect = overlayElement.getBoundingClientRect();
        const mapContainer = this.map.getContainer();
        const mapRect = mapContainer.getBoundingClientRect();

        popup.style.left = `${rect.left - mapRect.left + 40}px`;
        popup.style.top = `${rect.top - mapRect.top - 10}px`;

        // Add popup to map container
        mapContainer.appendChild(popup);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 10000);
    }

    getSpecificLandmarkIcon(landmarkName, type) {
        // Normalize name for comparison
        const name = landmarkName.toLowerCase();

        // First check if we have a custom image for this landmark
        const customImage = this.getCustomLandmarkImage(landmarkName);
        console.log(`🔍 Checking landmark: "${landmarkName}" -> Custom image: ${customImage}`);
        if (customImage) {
            console.log(`✅ Using custom image for ${landmarkName}: ${customImage}`);
            return `<img src="${customImage}" alt="${landmarkName}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">`;
        }

        // Specific landmark icons
        const specificLandmarks = {
            // Famous towers and monuments
            'eiffel tower': '🗼',
            'tower of london': '🏰',
            'big ben': '🕰️',
            'london eye': '🎡',
            'arc de triomphe': '🏛️',

            // Spanish landmarks
            'sagrada familia': '⛪',
            'park güell': '🏞️',
            'alhambra': '🏰',
            'guggenheim bilbao': '🎨',
            'santiago de compostela': '⛪',
            'alcázar': '🏰',
            'mezquita': '🕌',

            // Italian landmarks
            'colosseum': '🏟️',
            'leaning tower of pisa': '🗼',
            'vatican': '⛪',
            'sistine chapel': '🎨',
            'st. peters basilica': '⛪',
            'pantheon': '🏛️',
            'trevi fountain': '⛲',
            'ponte vecchio': '🌉',
            'duomo': '⛪',
            'duomo di milano': '⛪',
            'basilica': '⛪',

            // French landmarks
            'notre-dame': '⛪',
            'louvre': '🎨',
            'versailles': '🏰',
            'mont-saint-michel': '🏰',
            'chateau': '🏰',
            'château': '🏰',

            // German landmarks
            'neuschwanstein': '🏰',
            'brandenburg gate': '🏛️',
            'cologne cathedral': '⛪',
            'reichstag': '🏛️',

            // UK landmarks
            'stonehenge': '🗿',
            'windsor castle': '🏰',
            'westminster': '🏛️',
            'buckingham palace': '🏰',
            'edinburgh castle': '🏰',

            // Greek landmarks
            'parthenon': '🏛️',
            'acropolis': '🏛️',
            'santorini': '🏛️',

            // Austrian landmarks
            'schönbrunn': '🏰',
            'salzburg': '🎵',

            // Swiss landmarks
            'matterhorn': '⛰️',
            'jungfraujoch': '🏔️',

            // Dutch landmarks
            'anne frank house': '🏠',
            'rijksmuseum': '🎨',
            'van gogh museum': '🎨',

            // Czech landmarks
            'prague castle': '🏰',
            'charles bridge': '🌉',

            // Portuguese landmarks
            'jerónimos monastery': '⛪',
            'torre de belém': '🗼',
            'pena palace': '🏰',

            // Russian landmarks
            'kremlin': '🏰',
            'red square': '🏛️',
            'hermitage': '🎨',

            // Belgian landmarks
            'atomium': '⚛️',
            'grand place': '🏛️',

            // Norwegian landmarks
            'geirangerfjord': '🏔️',
            'preikestolen': '🗿',

            // Croatian landmarks
            'dubrovnik walls': '🏰',
            'plitvice lakes': '🏞️'
        };

        // Check for specific landmark first
        for (const [key, icon] of Object.entries(specificLandmarks)) {
            if (name.includes(key)) {
                return icon;
            }
        }

        // Fallback to type-based icons
        const typeIcons = {
            monument: '🗼',
            historic: '🏰',
            cultural: '🎭',
            natural: '🏔️',
            religious: '⛪',
            museum: '🎨',
            palace: '🏰',
            castle: '🏰',
            church: '⛪',
            cathedral: '⛪',
            bridge: '🌉',
            tower: '🗼',
            fountain: '⛲',
            park: '🏞️',
            garden: '🌳',
            square: '🏛️',
            market: '🏪'
        };

        // Check name for keywords
        const nameKeywords = {
            'castle': '🏰',
            'château': '🏰',
            'palace': '🏰',
            'church': '⛪',
            'cathedral': '⛪',
            'basilica': '⛪',
            'monastery': '⛪',
            'abbey': '⛪',
            'tower': '🗼',
            'bridge': '🌉',
            'fountain': '⛲',
            'museum': '🎨',
            'gallery': '🎨',
            'park': '🏞️',
            'garden': '🌳',
            'square': '🏛️',
            'plaza': '🏛️',
            'market': '🏪',
            'opera': '🎭',
            'theatre': '🎭',
            'theater': '🎭'
        };

        for (const [keyword, icon] of Object.entries(nameKeywords)) {
            if (name.includes(keyword)) {
                return icon;
            }
        }

        // Return type-based icon or default
        return typeIcons[type] || '📍';
    }

    getCustomLandmarkImage(landmarkName) {
        // Normalize landmark name for comparison
        const name = landmarkName.toLowerCase();

        // Map ALL custom landmark images to their names
        const imageMapping = {
            // Greek landmarks
            'acropolis': 'acropolis_athens.png',
            'acropolis of athens': 'acropolis_athens.png',
            'parthenon': 'parthenon.png',

            // Spanish landmarks
            'alhambra': 'alhambra_granada.png',
            'sagrada familia': 'sagrada_familia.png',

            // French landmarks
            'arc de triomphe': 'arc_de_triomphe.png',
            'eiffel tower': 'eiffel_tower.png',
            'mont saint-michel': 'mont_saint_michel.png',
            'mont saint michel': 'mont_saint_michel.png',
            'notre-dame': 'notre_dame.png',
            'notre dame': 'notre_dame.png',
            'palace of versailles': 'versailles.png',
            'versailles': 'versailles.png',

            // Belgian landmarks
            'atomium': 'atomium_brussels.png',

            // UK landmarks
            'big ben': 'big_ben.png',
            'edinburgh castle': 'edinburgh_castle.png',
            'stonehenge': 'stonehenge.png',
            'tower bridge': 'tower_bridge.png',

            // German landmarks
            'brandenburg gate': 'brandenburg_gate.png',
            'cologne cathedral': 'cologne_cathedral.png',
            'neuschwanstein castle': 'neuschwanstein_castle.png',
            'neuschwanstein': 'neuschwanstein_castle.png',

            // Czech landmarks
            'charles bridge': 'charles_bridge_prague.png',

            // Irish landmarks
            'cliffs of moher': 'cliffs_of_moher.png',

            // Italian landmarks
            'colosseum': 'colosseum.png',
            'duomo di milano': 'duomo_milano.png',
            'duomo': 'duomo_milano.png',
            'milan cathedral': 'duomo_milano.png',
            'leaning tower of pisa': 'pisa.png',
            'pisa': 'pisa.png',
            'tower of pisa': 'pisa.png',
            'st. mark\'s basilica': 'st_mark_venice.png',
            'st marks basilica': 'st_mark_venice.png',
            'san marco': 'st_mark_venice.png',
            'st. peter\'s basilica': 'st_peter.png',
            'st peters basilica': 'st_peter.png',
            'vatican': 'st_peter.png',
            'trevi fountain': 'trevi_fountain.png',

            // Norwegian landmarks
            'geirangerfjord': 'geirangerfjord_norway.png',

            // Austrian landmarks
            'hallstatt': 'hallstatt_village_austria.png',
            'schönbrunn palace': 'schonnbrun_vienna.png',
            'schönbrunn': 'schonnbrun_vienna.png',
            'schonbrunn palace': 'schonnbrun_vienna.png',
            'schonbrunn': 'schonnbrun_vienna.png',

            // Dutch landmarks
            'kinderdijk windmills': 'kinderdijk_windmills.png',
            'kinderdijk': 'kinderdijk_windmills.png',

            // Danish landmarks
            'the little mermaid': 'little_mermaid_copenhagen.png',
            'little mermaid': 'little_mermaid_copenhagen.png',

            // Portuguese landmarks
            'pena palace': 'pena_palace.png',
            'jerónimos monastery': 'pena_palace.png',
            'jeronimos monastery': 'pena_palace.png',

            // Russian landmarks
            'st. basil\'s cathedral': 'st_basils_moscow.png',
            'st basils cathedral': 'st_basils_moscow.png',
            'saint basils': 'st_basils_moscow.png'
        };

        // Check direct matches first
        if (imageMapping[name]) {
            return `/images/landmarks/${imageMapping[name]}`;
        }

        // Check partial matches for complex names
        for (const [key, image] of Object.entries(imageMapping)) {
            if (name.includes(key) || key.includes(name)) {
                return `/images/landmarks/${image}`;
            }
        }

        // Return null if no custom image found (will use emoji fallback)
        return null;
    }

    updateRouteSubtitle(origin, destination) {
        // Map cities to their country codes
        const cityToCountry = {
            'aix-en-provence': 'fr',
            'marseille': 'fr',
            'nice': 'fr',
            'lyon': 'fr',
            'paris': 'fr',
            'barcelona': 'es',
            'madrid': 'es',
            'valencia': 'es',
            'sevilla': 'es',
            'rome': 'it',
            'florence': 'it',
            'venice': 'it',
            'milan': 'it',
            'amsterdam': 'nl',
            'rotterdam': 'nl',
            'berlin': 'de',
            'munich': 'de',
            'cologne': 'de',
            'vienna': 'at',
            'salzburg': 'at',
            'prague': 'cz',
            'budapest': 'hu',
            'warsaw': 'pl',
            'krakow': 'pl',
            'riga': 'lv',
            'tallinn': 'ee',
            'vilnius': 'lt',
            'helsinki': 'fi',
            'stockholm': 'se',
            'copenhagen': 'dk',
            'oslo': 'no',
            'zurich': 'ch',
            'geneva': 'ch',
            'brussels': 'be',
            'lisbon': 'pt',
            'porto': 'pt',
            'dublin': 'ie',
            'london': 'gb',
            'edinburgh': 'gb'
        };

        const originCountry = cityToCountry[origin.toLowerCase()] || 'eu';
        const destCountry = cityToCountry[destination.toLowerCase()] || 'eu';

        const routeSubtitle = document.getElementById('routeSubtitle');
        if (routeSubtitle) {
            routeSubtitle.innerHTML = `
                <span class="route-city">
                    <img src="https://flagcdn.com/24x18/${originCountry}.png" alt="${origin} flag" class="country-flag">
                    ${origin}
                </span>
                <span class="route-arrow">→</span>
                <span class="route-city">
                    <img src="https://flagcdn.com/24x18/${destCountry}.png" alt="${destination} flag" class="country-flag">
                    ${destination}
                </span>
            `;
        }
    }

    setupCustomDropdown() {
        const dropdown = document.getElementById('customBudgetDropdown');
        const toggle = dropdown.querySelector('.custom-dropdown-toggle');
        const menu = dropdown.querySelector('.custom-dropdown-menu');
        const options = dropdown.querySelectorAll('.custom-dropdown-option');
        const hiddenSelect = document.getElementById('budgetFilter');
        const dropdownText = toggle.querySelector('.dropdown-text');

        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const value = option.dataset.value;
                const text = option.textContent;

                // Update visual state
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                dropdownText.textContent = text;

                // Update hidden select
                hiddenSelect.value = value;

                // Trigger change event
                hiddenSelect.dispatchEvent(new Event('change'));

                // Close dropdown
                dropdown.classList.remove('open');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
            }
        });
    }

    // City Modal Methods
    showCityModal(cityName, imageUrl, description, activities) {
        console.log('🏙️ Opening city modal for:', cityName);

        const modal = document.getElementById('cityDetailModal');
        const titleElement = document.getElementById('modalCityTitle');
        const imageElement = document.getElementById('modalCityImage');
        const descriptionElement = document.getElementById('modalCityDescription');
        const activitiesElement = document.getElementById('modalCityActivities');

        // Set modal content
        titleElement.textContent = cityName;
        imageElement.src = imageUrl || '';
        imageElement.alt = cityName;

        // Handle description
        if (description && description !== 'undefined' && description.trim()) {
            descriptionElement.textContent = description;
            descriptionElement.style.display = 'block';
        } else {
            descriptionElement.style.display = 'none';
        }

        // Handle activities
        if (activities && Array.isArray(activities) && activities.length > 0) {
            activitiesElement.innerHTML = activities
                .map(activity => `<li>${activity}</li>`)
                .join('');
        } else {
            activitiesElement.innerHTML = '<li>Discover this amazing destination and its unique attractions!</li>';
        }

        // Show modal
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Setup close functionality if not already done
        if (!modal.hasEventListener) {
            this.setupModalEventListeners();
            modal.hasEventListener = true;
        }
    }

    setupModalEventListeners() {
        const modal = document.getElementById('cityDetailModal');
        const closeBtn = document.getElementById('closeCityModal');

        // Close on button click
        closeBtn.addEventListener('click', () => this.closeCityModal());

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCityModal();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                this.closeCityModal();
            }
        });
    }

    closeCityModal() {
        const modal = document.getElementById('cityDetailModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
        console.log('🏙️ Closed city modal');
    }

    optimizeEntireRouteWithLandmark(currentWaypoints, landmarkWaypoint) {
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Starting full route optimization with landmark');
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Current waypoints:', currentWaypoints.map(wp => wp.name));
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Adding landmark:', landmarkWaypoint.name);

        // Combine all waypoints
        const allWaypoints = [...currentWaypoints, landmarkWaypoint];

        // Use the full route optimization
        const optimizedWaypoints = this.optimizeFullRoute(allWaypoints);

        console.log('🚀 SPOTLIGHT OPTIMIZATION: Optimized order:', optimizedWaypoints.map(wp => wp.name));
        return optimizedWaypoints;
    }

    optimizeFullRoute(waypoints) {
        if (!waypoints || waypoints.length <= 2) {
            console.log('🚀 SPOTLIGHT OPTIMIZATION: Too few waypoints to optimize');
            return waypoints;
        }

        console.log('🚀 SPOTLIGHT OPTIMIZATION: Optimizing route with', waypoints.length, 'waypoints');
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Input order:', waypoints.map(wp => wp.name));
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Waypoint types:');
        waypoints.forEach(wp => console.log(`  - ${wp.name}: ${wp.type || 'undefined'}`));

        // Hardcode start point as Aix-en-Provence
        const startPoint = { name: 'Aix-en-Provence', lat: 43.5297, lng: 5.4474, type: 'start' };

        // Try to find destination (prefer cities over landmarks as destination)
        let destinationPoint = waypoints.find(wp => wp.type === 'destination');

        // If no explicit destination found, determine the true destination
        if (!destinationPoint && waypoints.length > 0) {
            // Strategy: Find the original route destination (usually the last city added to the route)
            // Landmarks should NEVER be destinations - they are waypoints along the route

            // First, separate landmarks from cities/locations
            const landmarkWaypoints = waypoints.filter(wp => wp.type === 'cultural' || wp.isLandmark === true);
            const nonLandmarkWaypoints = waypoints.filter(wp => wp.type !== 'cultural' && wp.isLandmark !== true);

            console.log('🚀 SPOTLIGHT OPTIMIZATION: Found', landmarkWaypoints.length, 'landmarks:', landmarkWaypoints.map(wp => wp.name));
            console.log('🚀 SPOTLIGHT OPTIMIZATION: Found', nonLandmarkWaypoints.length, 'non-landmarks:', nonLandmarkWaypoints.map(wp => wp.name));

            // Use the last non-landmark waypoint as destination (this preserves the user's original destination)
            if (nonLandmarkWaypoints.length > 0) {
                destinationPoint = nonLandmarkWaypoints[nonLandmarkWaypoints.length - 1];
                console.log('🚀 SPOTLIGHT OPTIMIZATION: Using last non-landmark as destination:', destinationPoint.name);
            } else {
                // Extreme fallback: use the last waypoint in the list as destination
                destinationPoint = waypoints[waypoints.length - 1];
                console.log('🚀 SPOTLIGHT OPTIMIZATION: Emergency fallback, using last waypoint as destination:', destinationPoint.name);
            }
        }

        if (!destinationPoint) {
            console.log('🚀 SPOTLIGHT OPTIMIZATION: No destination found, using basic optimization');
            return waypoints;
        }

        // Get intermediate waypoints (everything except destination)
        const intermediatePoints = waypoints.filter(wp => wp !== destinationPoint && wp.name !== destinationPoint.name);

        console.log('🚀 SPOTLIGHT OPTIMIZATION: Destination:', destinationPoint.name, '(type:', destinationPoint.type + ')');
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Intermediate points:', intermediatePoints.map(wp => `${wp.name} (${wp.type})`));

        // Optimize intermediate points using nearest neighbor from start to destination
        const optimizedRoute = this.optimizeFromStartToEndSpotlight(startPoint, intermediatePoints, destinationPoint);

        console.log('🚀 SPOTLIGHT OPTIMIZATION: Optimized order:', optimizedRoute.map(wp => wp.name));
        return optimizedRoute;
    }

    optimizeFromStartToEndSpotlight(startPoint, intermediatePoints, destinationPoint) {
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Starting nearest neighbor optimization');
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Start:', startPoint.name);
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Intermediate points:', intermediatePoints.map(wp => wp.name));
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Destination:', destinationPoint.name);

        if (intermediatePoints.length === 0) {
            return [destinationPoint];
        }

        const route = [];
        const unvisited = [...intermediatePoints];
        let currentPoint = startPoint;

        // Use nearest neighbor algorithm
        while (unvisited.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = this.calculateDistancePoints(currentPoint, unvisited[0]);

            for (let i = 1; i < unvisited.length; i++) {
                const distance = this.calculateDistancePoints(currentPoint, unvisited[i]);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }

            const nearestPoint = unvisited.splice(nearestIndex, 1)[0];
            route.push(nearestPoint);
            currentPoint = nearestPoint;

            console.log('🚀 SPOTLIGHT OPTIMIZATION: Added to route:', nearestPoint.name, 'Distance:', nearestDistance.toFixed(2));
        }

        // Add destination at the end
        route.push(destinationPoint);

        const totalDistance = this.calculateTotalDistancePoints([startPoint, ...route]);
        console.log('🚀 SPOTLIGHT OPTIMIZATION: Total route distance:', totalDistance.toFixed(2), 'km');

        return route;
    }

    calculateDistancePoints(point1, point2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLng = (point2.lng - point1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    calculateTotalDistancePoints(waypoints) {
        if (waypoints.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
            totalDistance += this.calculateDistancePoints(waypoints[i], waypoints[i + 1]);
        }
        return totalDistance;
    }
}

// Initialize the spotlight page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spotlightController = new SpotlightController();
});