/**
 * Interactive Landmarks Overlay - Roadtrippers-style landmark discovery
 * Shows European landmarks on an interactive map that users can add to their routes
 */

class LandmarksOverlay {
    constructor() {
        this.map = null;
        this.currentRoute = null;
        this.landmarks = [];
        this.landmarkMarkers = [];
        this.routeMarkers = [];
        this.currentRouteLayer = null;
        this.selectedLandmarks = new Set();
        this.isVisible = false;

        // Landmark icon mapping
        this.landmarkIcons = {
            monument: '🗿',
            historic: '🏛️',
            cultural: '🎨',
            natural: '🏔️',
            tower: '🗼',
            castle: '🏰',
            amphitheater: '🏟️',
            cathedral: '⛪',
            palace: '🏯',
            gate: '🚪',
            bridge: '🌉',
            temple: '🏛️',
            monastery: '⛪',
            windmill: '🌾',
            village: '🏘️',
            mountain: '⛰️'
        };

        this.landmarkColors = {
            monument: '#FF6B6B',
            historic: '#4ECDC4',
            cultural: '#45B7D1',
            natural: '#96CEB4'
        };

        this.init();
    }

    init() {
        this.createOverlayHTML();
        this.setupEventListeners();
        console.log('🏛️ Landmarks Overlay initialized');
    }

    createOverlayHTML() {
        const overlayHTML = `
            <div id="landmarksOverlay" class="landmarks-overlay hidden">
                <div class="landmarks-header">
                    <div class="landmarks-header-left">
                        <h2 class="landmarks-title">
                            <span class="landmarks-icon">🗺️</span>
                            Discover European Landmarks
                        </h2>
                        <p class="landmarks-subtitle">Click on landmarks to add them to your route</p>
                    </div>
                    <div class="landmarks-header-right">
                        <div class="landmarks-filters">
                            <select id="landmarkTypeFilter" class="landmark-filter-select">
                                <option value="all">All Types</option>
                                <option value="monument">Monuments</option>
                                <option value="historic">Historic</option>
                                <option value="cultural">Cultural</option>
                                <option value="natural">Natural</option>
                            </select>
                        </div>
                        <button id="closeLandmarksOverlay" class="landmarks-close-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="landmarks-content">
                    <div class="landmarks-map-container">
                        <div id="landmarksMap" class="landmarks-map"></div>

                        <!-- Map Controls -->
                        <div class="landmarks-map-controls">
                            <div class="map-legend">
                                <div class="legend-item">
                                    <span class="legend-icon">🗿</span>
                                    <span class="legend-text">Monuments</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-icon">🏛️</span>
                                    <span class="legend-text">Historic</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-icon">🎨</span>
                                    <span class="legend-text">Cultural</span>
                                </div>
                                <div class="legend-item">
                                    <span class="legend-icon">🏔️</span>
                                    <span class="legend-text">Natural</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Route Sidebar -->
                    <div class="landmarks-sidebar">
                        <div class="current-route-section">
                            <h3 class="route-section-title">Current Route</h3>
                            <div id="currentRouteStops" class="route-stops-list">
                                <!-- Route stops will be populated here -->
                            </div>
                        </div>

                        <div class="selected-landmarks-section">
                            <h3 class="route-section-title">Selected Landmarks</h3>
                            <div id="selectedLandmarksList" class="selected-landmarks-list">
                                <p class="no-landmarks-message">No landmarks selected yet</p>
                            </div>
                        </div>

                        <div class="route-actions">
                            <button id="saveUpdatedRoute" class="save-route-btn disabled">
                                <span class="btn-icon">💾</span>
                                Save Updated Route
                            </button>
                            <button id="resetToOriginal" class="reset-route-btn">
                                <span class="btn-icon">🔄</span>
                                Reset to Original
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Landmark Detail Modal -->
                <div id="landmarkDetailModal" class="landmark-detail-modal hidden">
                    <div class="landmark-detail-content">
                        <div class="landmark-detail-header">
                            <h3 id="landmarkDetailTitle"></h3>
                            <button class="landmark-detail-close">×</button>
                        </div>
                        <div class="landmark-detail-body">
                            <img id="landmarkDetailImage" class="landmark-detail-image" alt="">
                            <div class="landmark-detail-info">
                                <p id="landmarkDetailDescription"></p>
                                <div class="landmark-detail-meta">
                                    <span id="landmarkDetailLocation"></span>
                                    <span id="landmarkDetailDuration"></span>
                                    <span id="landmarkDetailRating"></span>
                                </div>
                            </div>
                        </div>
                        <div class="landmark-detail-actions">
                            <button id="addLandmarkToRoute" class="add-landmark-btn">
                                <span class="btn-icon">➕</span>
                                Add to Route
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }

    setupEventListeners() {
        // Close overlay
        document.getElementById('closeLandmarksOverlay').addEventListener('click', () => {
            this.hide();
        });

        // Filter landmarks
        document.getElementById('landmarkTypeFilter').addEventListener('change', (e) => {
            this.filterLandmarks(e.target.value);
        });

        // Route actions
        document.getElementById('saveUpdatedRoute').addEventListener('click', () => {
            this.saveUpdatedRoute();
        });

        document.getElementById('resetToOriginal').addEventListener('click', () => {
            this.resetToOriginalRoute();
        });

        // Landmark detail modal
        document.getElementById('landmarkDetailModal').addEventListener('click', (e) => {
            if (e.target.id === 'landmarkDetailModal') {
                this.hideLandmarkDetail();
            }
        });

        document.querySelector('.landmark-detail-close').addEventListener('click', () => {
            this.hideLandmarkDetail();
        });

        document.getElementById('addLandmarkToRoute').addEventListener('click', () => {
            this.addCurrentLandmarkToRoute();
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    async show(routeData) {
        this.currentRoute = routeData;
        this.isVisible = true;

        console.log('🗺️ Showing landmarks overlay for route:', routeData);

        document.getElementById('landmarksOverlay').classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Initialize map after overlay is visible
        await this.initializeMap();

        // Load and display landmarks
        await this.loadLandmarks();

        // Display current route
        this.displayCurrentRoute();

        // Show route on map
        this.displayRouteOnMap();
    }

    hide() {
        this.isVisible = false;
        document.getElementById('landmarksOverlay').classList.add('hidden');
        document.body.style.overflow = '';

        // Clean up map
        if (this.map) {
            this.clearAllMarkers();
        }

        console.log('🗺️ Landmarks overlay hidden');
    }

    async initializeMap() {
        if (this.map) {
            this.map.remove();
        }

        // Set access token for landmarks map
        mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';

        // Calculate bounds from current route
        const bounds = this.calculateRouteBounds();

        this.map = new mapboxgl.Map({
            container: 'landmarksMap',
            style: 'mapbox://styles/mapbox/light-v11',
            bounds: bounds,
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            // Disable telemetry collection to prevent ad-blocker issues
            collectResourceTiming: false
        });

        await new Promise(resolve => {
            this.map.on('load', resolve);
        });

        console.log('🗺️ Landmarks map initialized');
    }

    calculateRouteBounds() {
        // Extract waypoints using the same method as the main app
        const waypoints = this.extractWaypoints(this.currentRoute);

        if (!waypoints?.length) {
            // Default to Europe view
            return [
                [-10.0, 35.0], // Southwest coordinates
                [40.0, 70.0]   // Northeast coordinates
            ];
        }

        const lats = waypoints.map(wp => wp.lat);
        const lngs = waypoints.map(wp => wp.lng);

        const minLat = Math.min(...lats) - 1;
        const maxLat = Math.max(...lats) + 1;
        const minLng = Math.min(...lngs) - 1;
        const maxLng = Math.max(...lngs) + 1;

        return [
            [minLng, minLat], // Southwest coordinates
            [maxLng, maxLat]  // Northeast coordinates
        ];
    }

    extractWaypoints(routeData) {
        if (!routeData?.agentResults?.length) return [];

        const waypoints = [];
        routeData.agentResults.forEach(agentResult => {
            try {
                // First try to parse as JSON
                let parsed;
                let cleanedRecommendations = agentResult.recommendations
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*$/g, '')
                    .trim();

                try {
                    parsed = JSON.parse(cleanedRecommendations);
                } catch (jsonError) {
                    console.log('JSON parsing failed, extracting from text for agent:', agentResult.agent);
                    // Extract location names from the text
                    const locationMatches = cleanedRecommendations.match(/"name":\s*"([^"]+)"/g) ||
                        cleanedRecommendations.match(/\*\*([^*]+)\*\*/g) ||
                        cleanedRecommendations.match(/(\w+(?:\s+\w+)*),\s*\w+/g);

                    if (locationMatches && locationMatches.length > 0) {
                        locationMatches.slice(0, 3).forEach((match, index) => {
                            let name = match.replace(/["*]/g, '').replace(/name:\s*/g, '').trim();
                            if (name.length > 0) {
                                // Use city name for display
                                const cityName = this.extractCityName(name);
                                waypoints.push({
                                    name: cityName,
                                    fullName: name,
                                    agent: agentResult.agent,
                                    description: `${this.capitalizeFirst(agentResult.agent)} destination`,
                                    lng: 2.0 + Math.random() * 8.0, // European coordinates
                                    lat: 44.0 + Math.random() * 6.0
                                });
                            }
                        });
                    }
                    return;
                }

                // If we have parsed JSON with waypoints
                if (parsed && parsed.waypoints && Array.isArray(parsed.waypoints)) {
                    parsed.waypoints.forEach(waypoint => {
                        if (waypoint.name) {
                            // Use city name for display
                            const cityName = this.extractCityName(waypoint.name);
                            waypoints.push({
                                name: cityName,
                                fullName: waypoint.name,
                                agent: agentResult.agent,
                                description: waypoint.description || `${this.capitalizeFirst(agentResult.agent)} destination`,
                                lng: waypoint.coordinates ? waypoint.coordinates[1] : (2.0 + Math.random() * 8.0),
                                lat: waypoint.coordinates ? waypoint.coordinates[0] : (44.0 + Math.random() * 6.0)
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('Error extracting waypoints for agent:', agentResult.agent, error);
                // Fallback: create a generic waypoint for this agent
                waypoints.push({
                    name: `${this.capitalizeFirst(agentResult.agent)} Destination`,
                    fullName: `${this.capitalizeFirst(agentResult.agent)} Destination`,
                    agent: agentResult.agent,
                    description: `Recommended ${agentResult.agent} stop`,
                    lng: 2.0 + Math.random() * 8.0,
                    lat: 44.0 + Math.random() * 6.0
                });
            }
        });

        // Ensure we have at least as many waypoints as requested
        const targetWaypoints = routeData?.totalStops || 3;
        while (waypoints.length < targetWaypoints) {
            waypoints.push({
                name: `Stop ${waypoints.length + 1}`,
                fullName: `Stop ${waypoints.length + 1}`,
                agent: 'general',
                description: 'Recommended stop along your route',
                lng: 2.0 + Math.random() * 8.0,
                lat: 44.0 + Math.random() * 6.0
            });
        }

        return waypoints.slice(0, targetWaypoints);
    }

    extractCityName(locationName) {
        // Common location patterns to extract city names
        const patterns = [
            /^([^,]+),/, // City, Country
            /^([^-]+)-/, // City - Description
            /^([^(]+)\(/, // City (Description)
            /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/  // Proper case city names
        ];

        for (const pattern of patterns) {
            const match = locationName.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        // Fallback: return first 2-3 words
        const words = locationName.split(/\s+/);
        return words.slice(0, Math.min(3, words.length)).join(' ').trim();
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    async loadLandmarks() {
        try {
            const bounds = this.map.getBounds();
            const response = await fetch(`/api/landmarks/region?north=${bounds.getNorth()}&south=${bounds.getSouth()}&east=${bounds.getEast()}&west=${bounds.getWest()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch landmarks');
            }

            const data = await response.json();
            this.landmarks = data.landmarks || [];

            console.log(`🏛️ Loaded ${this.landmarks.length} landmarks`);

            this.displayLandmarksOnMap();

        } catch (error) {
            console.error('Error loading landmarks:', error);
            this.showNotification('Failed to load landmarks', 'error');
        }
    }

    displayLandmarksOnMap() {
        this.clearLandmarkMarkers();

        this.landmarks.forEach(landmark => {
            const icon = this.landmarkIcons[landmark.icon_type] || '📍';
            const color = this.landmarkColors[landmark.type] || '#666666';

            // Create custom marker element
            const markerEl = document.createElement('div');
            markerEl.className = 'landmark-marker';
            markerEl.innerHTML = `
                <div class="landmark-marker-icon" style="background-color: ${color}">
                    ${icon}
                </div>
                <div class="landmark-marker-label">${landmark.name}</div>
            `;

            // Add click handler
            markerEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showLandmarkDetail(landmark);
            });

            // Create marker
            const marker = new mapboxgl.Marker({ element: markerEl })
                .setLngLat([landmark.lng, landmark.lat])
                .addTo(this.map);

            this.landmarkMarkers.push(marker);
        });

        console.log(`🗺️ Displayed ${this.landmarkMarkers.length} landmark markers`);
    }

    displayCurrentRoute() {
        const container = document.getElementById('currentRouteStops');
        const waypoints = this.extractWaypoints(this.currentRoute);

        if (!waypoints?.length) {
            container.innerHTML = '<p class="no-route-message">No route data available</p>';
            return;
        }

        const stopsHTML = waypoints.map((waypoint, index) => `
            <div class="route-stop-item">
                <div class="stop-number">${index + 1}</div>
                <div class="stop-info">
                    <div class="stop-name">${waypoint.name}</div>
                    <div class="stop-meta">${waypoint.agent || ''}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = stopsHTML;
    }

    displayRouteOnMap() {
        const waypoints = this.extractWaypoints(this.currentRoute);
        if (!waypoints?.length) return;

        // Add route markers
        waypoints.forEach((waypoint, index) => {
            const markerEl = document.createElement('div');
            markerEl.className = 'route-marker';
            markerEl.innerHTML = `
                <div class="route-marker-number">${index + 1}</div>
            `;

            const marker = new mapboxgl.Marker({ element: markerEl })
                .setLngLat([waypoint.lng, waypoint.lat])
                .addTo(this.map);

            this.routeMarkers.push(marker);
        });

        // Add route line (simplified - in production would use Mapbox Directions API)
        this.drawRouteLineSimple();
    }

    drawRouteLineSimple() {
        const waypoints = this.extractWaypoints(this.currentRoute);
        if (!waypoints?.length) return;

        const coordinates = waypoints.map(wp => [wp.lng, wp.lat]);

        const geojson = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        };

        if (this.map.getSource('route')) {
            this.map.getSource('route').setData(geojson);
        } else {
            this.map.addSource('route', {
                type: 'geojson',
                data: geojson
            });

            this.map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#007AFF',
                    'line-width': 4,
                    'line-opacity': 0.8
                }
            });
        }
    }

    showLandmarkDetail(landmark) {
        const modal = document.getElementById('landmarkDetailModal');

        document.getElementById('landmarkDetailTitle').textContent = landmark.name;
        document.getElementById('landmarkDetailImage').src = landmark.image_url;
        document.getElementById('landmarkDetailDescription').textContent = landmark.description;
        document.getElementById('landmarkDetailLocation').textContent = `${landmark.city}, ${landmark.country}`;
        document.getElementById('landmarkDetailDuration').textContent = `${landmark.visit_duration} minutes`;
        document.getElementById('landmarkDetailRating').textContent = `★ ${landmark.rating}`;

        modal.classList.remove('hidden');
        modal.dataset.landmarkId = landmark.id;
    }

    hideLandmarkDetail() {
        document.getElementById('landmarkDetailModal').classList.add('hidden');
    }

    async addCurrentLandmarkToRoute() {
        const modal = document.getElementById('landmarkDetailModal');
        const landmarkId = parseInt(modal.dataset.landmarkId);

        if (!landmarkId) return;

        try {
            const response = await fetch('/api/route/add-landmark', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    originalRoute: this.currentRoute,
                    landmarkId: landmarkId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add landmark to route');
            }

            const data = await response.json();

            if (data.success) {
                this.currentRoute = data.route;
                this.selectedLandmarks.add(landmarkId);

                this.updateSelectedLandmarksList();
                this.displayCurrentRoute();
                this.redrawRouteOnMap();

                // Also update the main spotlight map with the combined route (cities + landmarks)
                if (window.spotlightController && typeof window.spotlightController.recalculateRoute === 'function') {
                    console.log('🗺️ LANDMARK: Updating main spotlight map with combined cities and landmarks');
                    try {
                        // Get cities from destination manager if available
                        const cities = window.destinationManager?.destinations || [];

                        // Extract waypoints from current route (includes landmarks)
                        const routeWaypoints = this.extractWaypoints(this.currentRoute) || [];

                        // Combine cities and landmarks for spotlight
                        const allWaypoints = [
                            ...cities.map(dest => ({
                                name: dest.name,
                                coordinates: dest.coordinates,
                                type: 'city'
                            })),
                            ...routeWaypoints.map(wp => ({
                                name: wp.name,
                                coordinates: [wp.lng, wp.lat],
                                type: 'landmark'
                            }))
                        ];

                        console.log('🗺️ LANDMARK: Combined waypoints:', allWaypoints);
                        await window.spotlightController.recalculateRoute(allWaypoints);
                    } catch (error) {
                        console.warn('🗺️ LANDMARK: Failed to update main map:', error);
                    }
                }

                this.hideLandmarkDetail();

                document.getElementById('saveUpdatedRoute').classList.remove('disabled');

                this.showNotification(`${data.landmark.name} added to route!`, 'success');
            }

        } catch (error) {
            console.error('Error adding landmark:', error);
            this.showNotification('Failed to add landmark to route', 'error');
        }
    }

    updateSelectedLandmarksList() {
        const container = document.getElementById('selectedLandmarksList');

        if (this.selectedLandmarks.size === 0) {
            container.innerHTML = '<p class="no-landmarks-message">No landmarks selected yet</p>';
            return;
        }

        const selectedLandmarksArray = this.landmarks.filter(landmark =>
            this.selectedLandmarks.has(landmark.id)
        );

        const landmarksHTML = selectedLandmarksArray.map(landmark => `
            <div class="selected-landmark-item" data-id="${landmark.id}">
                <div class="landmark-icon">${this.landmarkIcons[landmark.icon_type] || '📍'}</div>
                <div class="landmark-info">
                    <div class="landmark-name">${landmark.name}</div>
                    <div class="landmark-location">${landmark.city}, ${landmark.country}</div>
                </div>
                <button class="remove-landmark-btn" onclick="landmarksOverlay.removeLandmark(${landmark.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        `).join('');

        container.innerHTML = landmarksHTML;
    }

    removeLandmark(landmarkId) {
        this.selectedLandmarks.delete(landmarkId);

        // Remove landmark from route structure
        // For now, we'll just track which landmarks are selected
        // In a full implementation, you'd modify the route's agentResults

        this.updateSelectedLandmarksList();
        this.displayCurrentRoute();
        this.redrawRouteOnMap();

        if (this.selectedLandmarks.size === 0) {
            document.getElementById('saveUpdatedRoute').classList.add('disabled');
        }

        this.showNotification('Landmark removed from route', 'info');
    }

    redrawRouteOnMap() {
        // Clear existing route markers
        this.routeMarkers.forEach(marker => marker.remove());
        this.routeMarkers = [];

        // Redraw route
        this.displayRouteOnMap();
    }

    filterLandmarks(type) {
        const filteredLandmarks = type === 'all' ?
            this.landmarks :
            this.landmarks.filter(landmark => landmark.type === type);

        // Update landmarks array temporarily for display
        const originalLandmarks = this.landmarks;
        this.landmarks = filteredLandmarks;
        this.displayLandmarksOnMap();
        this.landmarks = originalLandmarks;

        console.log(`🔍 Filtered to ${filteredLandmarks.length} landmarks of type: ${type}`);
    }

    saveUpdatedRoute() {
        if (this.selectedLandmarks.size === 0) return;

        // Save to localStorage (integrate with existing app state management)
        localStorage.setItem('currentRoute', JSON.stringify(this.currentRoute));

        // Emit event for app to update
        window.dispatchEvent(new CustomEvent('routeUpdated', {
            detail: { route: this.currentRoute }
        }));

        this.showNotification('Route updated successfully!', 'success');
        this.hide();
    }

    resetToOriginalRoute() {
        this.selectedLandmarks.clear();

        // Reset to original route (you'll need to store original route when overlay opens)
        if (this.originalRoute) {
            this.currentRoute = JSON.parse(JSON.stringify(this.originalRoute));
            this.updateSelectedLandmarksList();
            this.displayCurrentRoute();
            this.redrawRouteOnMap();
            document.getElementById('saveUpdatedRoute').classList.add('disabled');

            this.showNotification('Route reset to original', 'info');
        }
    }

    clearAllMarkers() {
        this.clearLandmarkMarkers();
        this.routeMarkers.forEach(marker => marker.remove());
        this.routeMarkers = [];
    }

    clearLandmarkMarkers() {
        this.landmarkMarkers.forEach(marker => marker.remove());
        this.landmarkMarkers = [];
    }

    showNotification(message, type = 'info') {
        // Create a simple notification (enhance as needed)
        const notification = document.createElement('div');
        notification.className = `landmark-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global instance
window.landmarksOverlay = new LandmarksOverlay();