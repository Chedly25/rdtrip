import { RouteCalculator } from './routeCalculator.js';
import { aiFeatures } from './aiFeatures.js';
import { TripTypesManager } from './tripTypes.js';

/**
 * UI Controller - Manages all user interface interactions and map display
 */
export class UIController {
    constructor() {
        this.map = null;
        this.routeLayer = null;
        this.markersLayer = null;
        this.currentRoute = null;
        this.selectedTheme = 'balanced';
        this.routeCalculator = new RouteCalculator();
        this.tripTypesManager = new TripTypesManager(this.routeCalculator, aiFeatures);
        
        // Bind methods to maintain context
        this.calculateRoute = this.calculateRoute.bind(this);
        this.removeStop = this.removeStop.bind(this);
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Wait for DOM to be fully ready
            await this.waitForDOM();
            
            this.initializeMap();
            this.setupEventListeners();
            this.setupAutocomplete();
            this.addStartingPointMarker();
            
            console.log('Road Trip Planner initialized successfully');
            
        } catch (error) {
            console.error('Initialization error:', error);
            throw error;
        }
    }
    
    /**
     * Wait for DOM elements to be ready
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.getElementById('map') && document.getElementById('destination')) {
                resolve();
            } else {
                setTimeout(() => resolve(this.waitForDOM()), 50);
            }
        });
    }
    
    /**
     * Cleanup method for proper resource disposal
     */
    cleanup() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        // Clear Leaflet's internal references to the container
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = '';
            mapContainer._leaflet_id = null;
            delete mapContainer._leaflet_id;
        }
        
        this.routeLayer = null;
        this.markersLayer = null;
        this.currentRoute = null;
    }
    
    /**
     * Initialize Leaflet map
     */
    initializeMap() {
        try {
            // Check if map container exists
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                throw new Error('Map container not found');
            }
            
            // Remove existing map if it exists
            if (this.map) {
                this.map.remove();
                this.map = null;
            }
            
            // Clear any existing map instance in the container and reset Leaflet's internal state
            mapContainer.innerHTML = '';
            mapContainer._leaflet_id = null;
            delete mapContainer._leaflet_id;
            
            // Initialize new map
            this.map = L.map('map', {
                zoomControl: true,
                attributionControl: true
            }).setView([43.5263, 5.4454], 8);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                minZoom: 3
            }).addTo(this.map);
            
            this.routeLayer = L.layerGroup().addTo(this.map);
            this.markersLayer = L.layerGroup().addTo(this.map);
            
            console.log('Map initialized successfully');
            
        } catch (error) {
            console.error('Map initialization error:', error);
            throw new Error('Failed to initialize map: ' + error.message);
        }
    }
    
    /**
     * Add the starting point marker (Aix-en-Provence)
     */
    addStartingPointMarker() {
        const startMarker = L.marker([43.5263, 5.4454], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">A</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        }).addTo(this.markersLayer);
        
        startMarker.bindPopup('<b>Aix-en-Provence</b><br>Starting Point<br>Population: 147,933');
    }
    
    /**
     * Setup autocomplete functionality for destination input
     */
    setupAutocomplete() {
        const input = document.getElementById('destination');
        const dropdown = document.getElementById('autocomplete');
        let selectedIndex = -1;
        
        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase().trim();
            selectedIndex = -1;
            
            if (value.length < 2) {
                dropdown.style.display = 'none';
                return;
            }
            
            const suggestions = this.routeCalculator.getSuggestions(value, 8);
            
            if (suggestions.length > 0) {
                dropdown.innerHTML = suggestions.map((city, index) => 
                    `<div class="autocomplete-item" data-id="${city.id}" data-name="${city.name}" data-index="${index}">
                        <strong>${city.name}</strong>
                        <span style="color: #999; font-size: 0.85rem; margin-left: 8px;">
                            (${city.country}) - ${city.population.toLocaleString()} inhabitants
                        </span>
                    </div>`
                ).join('');
                dropdown.style.display = 'block';
                
                // Add click handlers
                dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
                    item.addEventListener('click', () => {
                        this.selectDestination(item.dataset.name, item.dataset.id);
                    });
                    
                    item.addEventListener('mouseenter', () => {
                        this.highlightSuggestion(index);
                    });
                });
            } else {
                dropdown.style.display = 'none';
            }
        });
        
        // Keyboard navigation for autocomplete
        input.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                this.highlightSuggestion(selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                this.highlightSuggestion(selectedIndex);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    const item = items[selectedIndex];
                    this.selectDestination(item.dataset.name, item.dataset.id);
                } else {
                    this.calculateRoute();
                }
            } else if (e.key === 'Escape') {
                dropdown.style.display = 'none';
                selectedIndex = -1;
            }
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
                selectedIndex = -1;
            }
        });
    }
    
    /**
     * Highlight a suggestion in the dropdown
     */
    highlightSuggestion(index) {
        const items = document.querySelectorAll('.autocomplete-item');
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === index);
        });
    }
    
    /**
     * Select a destination from autocomplete
     */
    selectDestination(name, id) {
        const input = document.getElementById('destination');
        const dropdown = document.getElementById('autocomplete');
        
        input.value = name;
        input.dataset.cityId = id;
        dropdown.style.display = 'none';
    }
    
    /**
     * Setup event listeners for UI elements
     */
    setupEventListeners() {
        // Theme selector
        document.querySelectorAll('.theme-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedTheme = e.target.dataset.theme;
            });
        });
        
        // Set default theme
        document.querySelector('[data-theme="balanced"]').classList.add('active');
        
        // Sliders
        const stopsSlider = document.getElementById('stops-slider');
        const detourSlider = document.getElementById('detour-slider');
        
        stopsSlider.addEventListener('input', (e) => {
            document.getElementById('stops-value').textContent = e.target.value;
        });
        
        detourSlider.addEventListener('input', (e) => {
            document.getElementById('detour-value').textContent = e.target.value + '%';
        });
        
        // Calculate button
        document.getElementById('calculate-btn').addEventListener('click', this.calculateRoute);
        
        // API key input for AI features
        const apiKeyInput = document.getElementById('api-key');
        apiKeyInput.addEventListener('input', (e) => {
            aiFeatures.setApiKey(e.target.value.trim());
        });
        
        // Export buttons with proper event listeners
        document.getElementById('export-google')?.addEventListener('click', () => this.exportToGoogle());
        document.getElementById('export-gpx')?.addEventListener('click', () => this.exportGPX());
        
        // AI feature buttons with proper event listeners
        document.getElementById('ai-narrator')?.addEventListener('click', () => this.callAIFeature('narrative'));
        document.getElementById('ai-food')?.addEventListener('click', () => this.callAIFeature('food'));
        document.getElementById('ai-weather')?.addEventListener('click', () => this.callAIFeature('weather'));
        document.getElementById('ai-gems')?.addEventListener('click', () => this.callAIFeature('hidden'));
        document.getElementById('ai-itinerary')?.addEventListener('click', () => this.callAIFeature('itinerary'));
        
        // Keep removeStop as global function for dynamic HTML (will fix this separately)
        window.removeStop = (index) => this.removeStop(index);
        
        console.log('=== AI EVENT LISTENERS SET ===');
        console.log('AI buttons found:', {
            narrator: !!document.getElementById('ai-narrator'),
            food: !!document.getElementById('ai-food'),
            weather: !!document.getElementById('ai-weather'),
            gems: !!document.getElementById('ai-gems'),
            itinerary: !!document.getElementById('ai-itinerary')
        });
    }
    
    /**
     * Calculate route based on user input
     */
    async calculateRoute() {
        const destInput = document.getElementById('destination');
        const destName = destInput.value.trim();
        const calculateBtn = document.getElementById('calculate-btn');
        
        if (!destName) {
            this.showError('Please enter a destination city');
            return;
        }
        
        // Show loading state
        calculateBtn.textContent = 'Calculating...';
        calculateBtn.disabled = true;
        
        try {
            // Find destination city
            let destCity = this.routeCalculator.findCityByName(destName);
            
            if (!destCity) {
                throw new Error('Destination not found. Please select from the suggestions or try a different spelling.');
            }
            
            // Get route options
            const options = {
                numStops: document.getElementById('stops-slider').value,
                detourTolerance: document.getElementById('detour-slider').value,
                theme: this.selectedTheme
            };
            
            // Calculate route
            const result = this.routeCalculator.calculateRoute('aix-en-provence', destCity.id, options);
            
            // Fetch actual driving directions
            calculateBtn.textContent = 'Fetching driving directions...';
            
            try {
                console.log('=== STARTING ROUTE FETCH ===');
                console.log('Route cities:', result.route.map(city => city.name));
                console.log('Route length:', result.route.length);
                
                const drivingRoute = await this.routeCalculator.fetchCompleteRoute(result.route);
                console.log('=== COMPLETE ROUTE FETCHED ===');
                console.log('Driving route data:', drivingRoute);
                console.log('Segments count:', drivingRoute.segments?.length);
                
                // Merge route data with driving directions
                result.drivingRoute = drivingRoute;
                result.actualDistance = drivingRoute.totalDistance;
                result.actualTime = drivingRoute.totalDuration;
                result.hasDrivingDirections = true;
                
                console.log('=== ROUTE DATA MERGED ===');
                console.log('Final result:', {
                    hasDrivingDirections: result.hasDrivingDirections,
                    segmentCount: result.drivingRoute?.segments?.length,
                    actualDistance: result.actualDistance
                });
                
            } catch (drivingError) {
                console.error('=== DRIVING ROUTE ERROR ===');
                console.error('Error details:', drivingError);
                console.error('Stack trace:', drivingError.stack);
                result.hasDrivingDirections = false;
                
                // Show user-friendly message
                this.showWarning('Using estimated route - driving directions temporarily unavailable');
            }
            
            this.currentRoute = result;
            aiFeatures.setCurrentRoute(result);
            this.tripTypesManager.setCurrentRoute(result);
            
            // Display results
            this.displayRoute(result);
            this.updateRouteInfo(result);
            
            // Hide any previous error messages
            this.hideError();
            
        } catch (error) {
            console.error('Route calculation error:', error);
            this.showError(error.message);
        } finally {
            // Reset button state
            calculateBtn.textContent = 'Calculate Route';
            calculateBtn.disabled = false;
        }
    }
    
    /**
     * Display route on the map
     */
    displayRoute(routeData) {
        // Clear existing route and markers (except starting point)
        this.routeLayer.clearLayers();
        this.markersLayer.clearLayers();
        this.addStartingPointMarker();
        
        const { route } = routeData;
        
        // Add markers for each city
        route.forEach((city, index) => {
            const isStart = index === 0;
            const isEnd = index === route.length - 1;
            
            if (isStart) return; // Starting point already added
            
            const label = isEnd ? 'B' : index.toString();
            const color = isEnd ? '#764ba2' : '#00c9ff';
            
            const marker = L.marker([city.lat, city.lon], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background: ${color}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${label}</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })
            }).addTo(this.markersLayer);
            
            // Create popup content
            const activities = city.activities.slice(0, 3).join('<br>• ');
            const popupContent = `
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #333;">${city.name}</h4>
                    <p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">
                        ${city.country} • Population: ${city.population.toLocaleString()}
                    </p>
                    <div style="font-size: 0.85rem; color: #555;">
                        <strong>Activities:</strong><br>
                        • ${activities}
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent, { maxWidth: 300 });
        });
        
        // Draw actual driving routes if available
        if (routeData.drivingRoute && routeData.drivingRoute.segments) {
            console.log('Drawing driving routes with segments:', routeData.drivingRoute.segments.length);
            const segments = routeData.drivingRoute.segments;
            let allBounds = [];
            
            segments.forEach((segment, index) => {
                if (segment.geometry && segment.geometry.coordinates) {
                    // Convert GeoJSON coordinates to Leaflet format [lat, lng]
                    const leafletCoords = segment.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    
                    console.log(`=== DRAWING SEGMENT ${index + 1} ===`);
                    console.log('Segment from:', segment.from, 'to:', segment.to);
                    console.log('Coordinates count:', leafletCoords.length);
                    console.log('Service used:', segment.service || 'Unknown');
                    console.log('First coords:', leafletCoords[0]);
                    console.log('Last coords:', leafletCoords[leafletCoords.length - 1]);
                    
                    // Create polyline for this segment
                    const segmentPolyline = L.polyline(leafletCoords, {
                        color: segment.service === 'Fallback' ? '#ff6b6b' : '#667eea', // Red for fallback, blue for API
                        weight: 4,
                        opacity: 0.8,
                        smoothFactor: 1
                    }).addTo(this.routeLayer);
                    
                    console.log('Polyline added to map:', !!segmentPolyline);
                    
                    // Add to bounds for fitting map
                    allBounds = allBounds.concat(leafletCoords);
                    
                    // Add distance label at midpoint of segment
                    if (leafletCoords.length > 0) {
                        const midIndex = Math.floor(leafletCoords.length / 2);
                        const midPoint = leafletCoords[midIndex];
                        
                        L.marker(midPoint, {
                            icon: L.divIcon({
                                className: 'distance-label',
                                html: `<div style="background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #667eea; border: 1px solid #667eea;">${segment.distance}km</div>`,
                                iconSize: [50, 20],
                                iconAnchor: [25, 10]
                            })
                        }).addTo(this.routeLayer);
                    }
                }
            });
            
            // Fit map to all route segments
            if (allBounds.length > 0) {
                const bounds = L.latLngBounds(allBounds);
                this.map.fitBounds(bounds, { padding: [20, 20] });
            }
        } else {
            // Fallback to straight line if no driving route available
            const coordinates = route.map(city => [city.lat, city.lon]);
            const polyline = L.polyline(coordinates, {
                color: '#667eea',
                weight: 4,
                opacity: 0.8,
                smoothFactor: 1
            }).addTo(this.routeLayer);
            
            // Add distance labels on route segments
            for (let i = 0; i < route.length - 1; i++) {
                const dist = Math.round(this.routeCalculator.haversineDistance(route[i], route[i + 1]));
                const midLat = (route[i].lat + route[i + 1].lat) / 2;
                const midLon = (route[i].lon + route[i + 1].lon) / 2;
                
                L.marker([midLat, midLon], {
                    icon: L.divIcon({
                        className: 'distance-label',
                        html: `<div style="background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 12px; font-size: 12px; font-weight: bold; color: #667eea; border: 1px solid #667eea;">${dist}km</div>`,
                        iconSize: [50, 20],
                        iconAnchor: [25, 10]
                    })
                }).addTo(this.routeLayer);
            }
            
            // Fit map to route with padding
            const bounds = polyline.getBounds();
            this.map.fitBounds(bounds, { padding: [20, 20] });
        }
    }
    
    /**
     * Update route information panel
     */
    updateRouteInfo(routeData) {
        const { route, totalDistance, totalTime, directDistance, detourFactor, actualDistance, actualTime } = routeData;
        
        // Use actual driving distances/times if available, otherwise use calculated values
        const displayDistance = actualDistance || totalDistance;
        const displayTime = actualTime || totalTime;
        
        // Update statistics
        document.getElementById('total-distance').textContent = displayDistance;
        document.getElementById('total-time').textContent = displayTime;
        document.getElementById('total-stops').textContent = route.length - 2;
        
        // Create stops list
        const stopsList = document.getElementById('stops-list');
        const routeTypeIndicator = routeData.hasDrivingDirections ? 
            '<span style="color: #28a745; font-size: 0.8rem;">🚗 Driving Route</span>' : 
            '<span style="color: #ffc107; font-size: 0.8rem;">📏 Estimated Route</span>';
        
        stopsList.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                    <h3 style="margin: 0;">Route Stops</h3>
                    ${routeTypeIndicator}
                </div>
                <small style="color: #666;">Direct: ${directDistance}km (+${detourFactor}%)</small>
            </div>
        `;
        
        // Add stop cards for intermediate stops
        route.forEach((city, index) => {
            if (index === 0 || index === route.length - 1) return;
            
            const stopCard = document.createElement('div');
            stopCard.className = 'stop-card';
            
            const themeScores = Object.entries(city.themes)
                .map(([theme, score]) => `${theme}: ${Math.round(score * 100)}%`)
                .join(' • ');
            
            stopCard.innerHTML = `
                <div class="stop-number">${index}</div>
                <div class="stop-content">
                    <div class="stop-name">${city.name}</div>
                    <div style="font-size: 0.8rem; color: #888; margin-top: 2px;">
                        Pop: ${city.population.toLocaleString()} • ${city.country}
                    </div>
                    <div class="stop-activities">
                        ${city.activities.slice(0, 2).join(' • ')}
                    </div>
                    <div style="font-size: 0.75rem; color: #999; margin-top: 4px;">
                        ${themeScores}
                    </div>
                </div>
                <button class="stop-remove" onclick="removeStop(${index})">Remove</button>
            `;
            
            stopsList.appendChild(stopCard);
        });
        
        // Show route info panel
        document.getElementById('route-info').style.display = 'block';
    }
    
    /**
     * Remove a stop from the route
     */
    removeStop(index) {
        if (!this.currentRoute || index <= 0 || index >= this.currentRoute.route.length - 1) {
            return;
        }
        
        // Create new route without the selected stop
        const newRoute = [...this.currentRoute.route];
        newRoute.splice(index, 1);
        
        // Recalculate distances and metrics
        const totalDistance = Math.round(this.routeCalculator.calculateTotalDistance(newRoute));
        const totalTime = this.routeCalculator.estimateTime(newRoute);
        const directDistance = this.currentRoute.directDistance;
        const detourFactor = ((totalDistance - directDistance) / directDistance * 100).toFixed(1);
        
        // Update current route
        this.currentRoute = {
            route: newRoute,
            totalDistance,
            totalTime: totalTime.toFixed(1),
            directDistance,
            detourFactor
        };
        
        aiFeatures.setCurrentRoute(this.currentRoute);
        this.tripTypesManager.setCurrentRoute(this.currentRoute);
        
        // Refresh display
        this.displayRoute(this.currentRoute);
        this.updateRouteInfo(this.currentRoute);
    }
    
    /**
     * Export route to Google Maps
     */
    exportToGoogle() {
        if (!this.currentRoute) {
            alert('Please calculate a route first');
            return;
        }
        
        const waypoints = this.currentRoute.route.map(city => 
            encodeURIComponent(city.name + ', ' + (city.country === 'FR' ? 'France' : city.country === 'IT' ? 'Italy' : 'Monaco'))
        ).join('/');
        
        const url = `https://www.google.com/maps/dir/${waypoints}`;
        window.open(url, '_blank');
    }
    
    /**
     * Export route as GPX file
     */
    exportGPX() {
        if (!this.currentRoute) {
            alert('Please calculate a route first');
            return;
        }
        
        const route = this.currentRoute.route;
        const routeName = `Road Trip from Aix to ${route[route.length - 1].name}`;
        
        const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Aix Road Trip Planner" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${routeName}</name>
    <desc>Generated road trip route (${this.currentRoute.totalDistance}km, ${this.currentRoute.totalTime}h)</desc>
  </metadata>
  <rte>
    <name>${routeName}</name>
    ${route.map((city, index) => `
    <rtept lat="${city.lat}" lon="${city.lon}">
      <name>${city.name}</name>
      <desc>${city.activities[0] || 'Stop ' + index}</desc>
      <type>waypoint</type>
    </rtept>`).join('')}
  </rte>
</gpx>`;
        
        // Create and download file
        const blob = new Blob([gpx], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roadtrip-${route[route.length - 1].name.toLowerCase().replace(/\s+/g, '-')}.gpx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Call AI feature and display results
     */
    async callAIFeature(featureType) {
        console.log('=== AI FEATURE CALLED ===');
        console.log('Feature type:', featureType);
        console.log('Current route:', this.currentRoute);
        console.log('AI Features object:', aiFeatures);
        
        const aiResults = document.getElementById('ai-results');
        const aiTitle = document.getElementById('ai-title');
        const aiContent = document.getElementById('ai-content');
        
        console.log('DOM elements found:', { aiResults: !!aiResults, aiTitle: !!aiTitle, aiContent: !!aiContent });
        
        const featureMap = {
            narrative: { title: 'Trip Narrator', method: 'generateTripNarrative' },
            food: { title: 'Local Food Guide', method: 'findLocalFood' },
            weather: { title: 'Weather & Best Time', method: 'getWeatherAdvice' },
            hidden: { title: 'Hidden Gems', method: 'discoverHiddenGems' },
            itinerary: { title: 'Full Itinerary', method: 'generateFullItinerary' }
        };
        
        const feature = featureMap[featureType];
        if (!feature) return;
        
        // Show loading state
        aiResults.classList.add('active');
        aiTitle.innerHTML = `${feature.title} <span class="loading"></span>`;
        aiContent.textContent = 'Loading AI insights...';
        
        try {
            const result = await aiFeatures[feature.method]();
            
            // Display result
            aiTitle.textContent = feature.title;
            aiContent.textContent = result;
            
            // Scroll to results
            aiResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
        } catch (error) {
            console.error('AI Feature Error:', error);
            aiTitle.textContent = `${feature.title} - Error`;
            aiContent.textContent = `Error: ${error.message}\n\nPlease check your API key and try again.`;
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            document.querySelector('.sidebar').insertBefore(errorDiv, document.querySelector('.control-group'));
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    /**
     * Hide error message
     */
    hideError() {
        const errorDiv = document.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
    
    /**
     * Show warning message
     */
    showWarning(message) {
        let warningDiv = document.querySelector('.warning-message');
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.className = 'warning-message';
            warningDiv.style.cssText = `
                background: #fff3cd; 
                color: #856404; 
                padding: 0.75rem 1rem; 
                margin: 1rem 0; 
                border-left: 4px solid #ffc107; 
                border-radius: 4px; 
                font-size: 0.9rem;
                display: block;
            `;
            document.querySelector('.sidebar').insertBefore(warningDiv, document.querySelector('.control-group'));
        }
        warningDiv.textContent = message;
        warningDiv.style.display = 'block';
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (warningDiv) {
                warningDiv.style.display = 'none';
            }
        }, 8000);
    }
}