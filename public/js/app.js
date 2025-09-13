// Road Trip Planner App
class RoadTripPlanner {
    constructor() {
        this.map = null;
        this.selectedAgents = ['adventure', 'culture', 'food'];
        this.currentRoute = null;
        
        this.init();
    }

    init() {
        this.initMap();
        this.setupEventListeners();
    }

    initMap() {
        // Initialize Mapbox map
        mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';
        
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [5.4474, 43.5297], // Aix-en-Provence coordinates
            zoom: 6
        });

        // Add navigation controls
        this.map.addControl(new mapboxgl.NavigationControl());

        // Add origin marker for Aix-en-Provence
        new mapboxgl.Marker({ color: '#007AFF' })
            .setLngLat([5.4474, 43.5297])
            .setPopup(new mapboxgl.Popup().setHTML('<h3>🏠 Aix-en-Provence</h3><p>Your journey starts here</p>'))
            .addTo(this.map);
    }

    setupEventListeners() {
        // Agent selection buttons
        document.querySelectorAll('.agent-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleAgent(btn));
        });

        // Generate route button
        document.getElementById('generateRoute').addEventListener('click', () => {
            this.generateRoute();
        });

        // Enter key for destination input
        document.getElementById('destination').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateRoute();
            }
        });
    }

    toggleAgent(btn) {
        const agent = btn.dataset.agent;
        
        if (btn.classList.contains('active')) {
            // Ensure at least one agent remains selected
            if (this.selectedAgents.length > 1) {
                btn.classList.remove('active');
                this.selectedAgents = this.selectedAgents.filter(a => a !== agent);
            }
        } else {
            btn.classList.add('active');
            this.selectedAgents.push(agent);
        }
    }

    async generateRoute() {
        const destination = document.getElementById('destination').value.trim();
        const stops = parseInt(document.getElementById('stops').value);
        
        if (!destination) {
            this.showError('Please enter a destination');
            return;
        }

        this.setLoading(true);

        try {
            // Get destination coordinates first
            const destinationCoords = await this.geocodeDestination(destination);
            
            if (!destinationCoords) {
                throw new Error('Could not find destination coordinates');
            }

            // Generate route with AI agents
            const response = await fetch('/api/generate-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: destination,
                    stops: stops,
                    agents: this.selectedAgents
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate route');
            }

            const routeData = await response.json();
            await this.displayRoute(routeData, destinationCoords);
            
        } catch (error) {
            console.error('Error generating route:', error);
            this.showError('Failed to generate route. Please try again.');
        } finally {
            this.setLoading(false);
        }
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
            
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    async displayRoute(routeData, destinationCoords) {
        this.currentRoute = routeData;
        
        // Clear existing markers except origin
        const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
        existingMarkers.forEach((marker, index) => {
            if (index > 0) { // Keep the first marker (origin)
                marker.remove();
            }
        });

        // Extract all waypoints from AI responses
        const allWaypoints = this.extractWaypoints(routeData);
        
        // Agent colors for markers
        const agentColors = {
            adventure: '#34C759', // Green for nature/adventure
            culture: '#FF9500',   // Orange for culture/history  
            food: '#FF3B30'       // Red for food/cuisine
        };

        // Add waypoint markers to map with agent-specific colors
        allWaypoints.forEach((waypoint, index) => {
            const color = agentColors[waypoint.agent] || '#34C759';
            const agentEmoji = this.getAgentEmoji(waypoint.agent);
            
            new mapboxgl.Marker({ color: color })
                .setLngLat([waypoint.lng, waypoint.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <h3>${agentEmoji} ${waypoint.name}</h3>
                    <p>${waypoint.description || ''}</p>
                    <small><strong>${this.capitalizeFirst(waypoint.agent)} Recommendation</strong></small>
                `))
                .addTo(this.map);
        });

        // Add destination marker
        new mapboxgl.Marker({ color: '#8E44AD' })
            .setLngLat([destinationCoords.lng, destinationCoords.lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<h3>🎯 ${destinationCoords.name}</h3><p>Your destination</p>`))
            .addTo(this.map);

        // Fit map to show all points
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([5.4474, 43.5297]); // Aix-en-Provence
        allWaypoints.forEach(waypoint => {
            bounds.extend([waypoint.lng, waypoint.lat]);
        });
        bounds.extend([destinationCoords.lng, destinationCoords.lat]); // Destination
        
        this.map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 8
        });

        // Add route line if we have waypoints
        if (allWaypoints.length > 0) {
            await this.addRouteToMap(allWaypoints, destinationCoords);
        }

        // Display results
        this.displayResults(routeData);
    }

    extractWaypoints(routeData) {
        const waypoints = [];
        
        routeData.agentResults.forEach(result => {
            try {
                let jsonData = null;
                
                // Try to extract JSON from the result
                const jsonMatch = result.recommendations.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    jsonData = JSON.parse(jsonMatch[1]);
                } else {
                    // Fallback: look for JSON without code blocks
                    const jsonStart = result.recommendations.indexOf('{');
                    const jsonEnd = result.recommendations.lastIndexOf('}');
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonString = result.recommendations.substring(jsonStart, jsonEnd + 1);
                        jsonData = JSON.parse(jsonString);
                    }
                }
                
                if (jsonData && jsonData.waypoints) {
                    jsonData.waypoints.forEach(waypoint => {
                        if (waypoint.coordinates && waypoint.coordinates.length === 2) {
                            waypoints.push({
                                name: waypoint.name,
                                description: waypoint.description,
                                imageUrl: waypoint.imageUrl,
                                lng: waypoint.coordinates[1], // Note: Mapbox uses [lng, lat]
                                lat: waypoint.coordinates[0],
                                agent: result.agent
                            });
                        }
                    });
                }
            } catch (e) {
                console.log('Could not parse waypoints from', result.agent);
            }
        });
        
        // Remove duplicates based on name
        const uniqueWaypoints = waypoints.filter((waypoint, index, self) => 
            index === self.findIndex(w => w.name === waypoint.name)
        );
        
        return uniqueWaypoints;
    }

    extractSingleWaypoints(recommendations) {
        const waypoints = [];
        
        try {
            let jsonData = null;
            
            // Try to extract JSON from the result
            const jsonMatch = recommendations.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonData = JSON.parse(jsonMatch[1]);
            } else {
                // Fallback: look for JSON without code blocks
                const jsonStart = recommendations.indexOf('{');
                const jsonEnd = recommendations.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    const jsonString = recommendations.substring(jsonStart, jsonEnd + 1);
                    jsonData = JSON.parse(jsonString);
                }
            }
            
            if (jsonData && jsonData.waypoints) {
                jsonData.waypoints.forEach(waypoint => {
                    if (waypoint.coordinates && waypoint.coordinates.length === 2) {
                        waypoints.push({
                            name: waypoint.name,
                            description: waypoint.description,
                            imageUrl: waypoint.imageUrl,
                            lng: waypoint.coordinates[1], // Note: Mapbox uses [lng, lat]
                            lat: waypoint.coordinates[0]
                        });
                    }
                });
            }
        } catch (e) {
            console.log('Could not parse waypoints from recommendations');
        }
        
        return waypoints;
    }

    async addRouteToMap(waypoints, destinationCoords) {
        // Clear existing routes
        this.clearExistingRoutes();

        // Group waypoints by agent
        const waypointsByAgent = this.groupWaypointsByAgent(waypoints);
        
        // Agent colors
        const agentColors = {
            adventure: '#34C759', // Green for nature/adventure
            culture: '#FF9500',   // Orange for culture/history  
            food: '#FF3B30'       // Red for food/cuisine
        };

        // Create separate routes for each agent
        for (const [agent, agentWaypoints] of Object.entries(waypointsByAgent)) {
            if (agentWaypoints.length > 0) {
                await this.addAgentRoute(agent, agentWaypoints, destinationCoords, agentColors[agent]);
            }
        }
    }

    clearExistingRoutes() {
        // Remove all existing route layers and sources
        ['adventure', 'culture', 'food', 'route'].forEach(routeId => {
            if (this.map.getSource(`route-${routeId}`)) {
                this.map.removeLayer(`route-${routeId}`);
                this.map.removeSource(`route-${routeId}`);
            }
            if (this.map.getSource(routeId)) {
                this.map.removeLayer(routeId);
                this.map.removeSource(routeId);
            }
        });
    }

    groupWaypointsByAgent(waypoints) {
        const grouped = {
            adventure: [],
            culture: [],
            food: []
        };
        
        waypoints.forEach(waypoint => {
            if (waypoint.agent && grouped[waypoint.agent]) {
                grouped[waypoint.agent].push(waypoint);
            }
        });
        
        return grouped;
    }

    async addAgentRoute(agent, agentWaypoints, destinationCoords, color) {
        // Create route coordinates for this agent
        const coordinates = [
            [5.4474, 43.5297], // Aix-en-Provence (start)
            ...agentWaypoints.map(w => [w.lng, w.lat]),
            [destinationCoords.lng, destinationCoords.lat] // Destination
        ];

        try {
            // Get real driving directions from Mapbox
            const routeGeometry = await this.getDirections(coordinates);
            
            if (routeGeometry) {
                this.map.addSource(`route-${agent}`, {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': { agent: agent },
                        'geometry': routeGeometry
                    }
                });

                this.map.addLayer({
                    'id': `route-${agent}`,
                    'type': 'line',
                    'source': `route-${agent}`,
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': color,
                        'line-width': 3,
                        'line-opacity': 0.8
                    }
                });
            }
        } catch (error) {
            console.error(`Could not get driving directions for ${agent}:`, error);
            // Fallback to straight line if directions fail
            this.addStraightLineRoute(coordinates, `route-${agent}`, color);
        }
    }

    async getDirections(coordinates) {
        // Build waypoints string for Mapbox Directions API
        const coordinatesStr = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');
        
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesStr}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                return data.routes[0].geometry;
            }
        } catch (error) {
            console.error('Directions API error:', error);
        }
        
        return null;
    }

    addStraightLineRoute(coordinates, sourceId = 'route', color = '#007AFF') {
        // Fallback: Add straight line route
        this.map.addSource(sourceId, {
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

        this.map.addLayer({
            'id': sourceId,
            'type': 'line',
            'source': sourceId,
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': color,
                'line-width': 3,
                'line-opacity': 0.6
            }
        });
    }

    displayResults(routeData) {
        const resultsSection = document.getElementById('resultsSection');
        const routeResults = document.getElementById('routeResults');
        
        let html = '';
        
        html += `<div class="route-item">
            <h4>📍 Route Overview</h4>
            <p><strong>From:</strong> ${routeData.origin}</p>
            <p><strong>To:</strong> ${routeData.destination}</p>
            <p><strong>Planned stops:</strong> ${routeData.totalStops}</p>
        </div>`;

        routeData.agentResults.forEach(result => {
            const agentEmoji = this.getAgentEmoji(result.agent);
            const waypoints = this.extractSingleWaypoints(result.recommendations);
            const firstLocation = waypoints.length > 0 ? waypoints[0].name : routeData.destination;
            
            html += `<div class="route-item" data-agent="${result.agent}">
                <div class="route-item-header">
                    <h4>${agentEmoji} ${this.capitalizeFirst(result.agent)} Recommendations</h4>
                    <button class="view-details-btn" data-agent="${result.agent}" data-destination="${routeData.destination}">
                        View Details →
                    </button>
                </div>
                <div class="route-image-container loading" data-location="${firstLocation}">
                    <div class="image-loading">🖼️ Loading ${result.agent} image...</div>
                </div>
                <p>${this.formatAgentResult(result.recommendations)}</p>
            </div>`;
        });

        routeResults.innerHTML = html;
        resultsSection.classList.remove('hidden');
        
        // Fetch images for each route
        this.fetchRouteImages(routeData);
        
        // Add event listeners for View Details buttons
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const agent = e.target.dataset.agent;
                const destination = e.target.dataset.destination;
                this.openSpotlight(agent, destination, routeData);
            });
        });
    }

    async fetchRouteImages(routeData) {
        // Fetch images for each agent route
        for (const result of routeData.agentResults) {
            try {
                const waypoints = this.extractSingleWaypoints(result.recommendations);
                const locations = waypoints.map(w => w.name).filter(name => name);
                
                if (locations.length === 0) {
                    locations.push(routeData.destination); // Fallback to destination
                }
                
                // Use Unsplash directly for reliable images
                const location = locations[0];
                const agentKeywords = {
                    adventure: 'landscape',
                    culture: 'architecture', 
                    food: 'cuisine'
                };
                
                const keyword = agentKeywords[result.agent] || 'travel';
                const cleanLocation = location.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
                const imageUrl = `https://source.unsplash.com/800x600/?${cleanLocation}-${keyword}`;
                
                this.updateRouteImage(result.agent, imageUrl, location);
                
            } catch (error) {
                console.error(`Error fetching image for ${result.agent}:`, error);
                this.updateRouteImageError(result.agent);
            }
        }
    }

    updateRouteImage(agent, imageUrl, locationName) {
        const routeItem = document.querySelector(`[data-agent="${agent}"]`);
        if (routeItem) {
            const imageContainer = routeItem.querySelector('.route-image-container');
            imageContainer.classList.remove('loading');
            imageContainer.innerHTML = `
                <img src="${imageUrl}" alt="${locationName}" class="route-image" 
                     onerror="this.parentElement.querySelector('.image-error').style.display='block'; this.style.display='none';" 
                     onload="this.classList.add('loaded')">
                <div class="image-error" style="display: none;">📷 Image unavailable</div>
            `;
        }
    }

    updateRouteImageError(agent) {
        const routeItem = document.querySelector(`[data-agent="${agent}"]`);
        if (routeItem) {
            const imageContainer = routeItem.querySelector('.route-image-container');
            imageContainer.classList.remove('loading');
            imageContainer.innerHTML = `<div class="image-error">📷 No image available</div>`;
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

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatAgentResult(result) {
        if (typeof result === 'string') {
            try {
                // Try to extract JSON from the result
                const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    const jsonData = JSON.parse(jsonMatch[1]);
                    return this.formatWaypoints(jsonData.waypoints || []);
                }
                
                // Fallback: look for JSON without code blocks
                const jsonStart = result.indexOf('{');
                const jsonEnd = result.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    const jsonString = result.substring(jsonStart, jsonEnd + 1);
                    const jsonData = JSON.parse(jsonString);
                    return this.formatWaypoints(jsonData.waypoints || []);
                }
            } catch (e) {
                console.log('Could not parse JSON, showing raw text');
            }
            
            // Fallback to truncated text
            return result.replace(/\n\n/g, '<br><br>').slice(0, 300) + '...';
        }
        return 'Processing recommendations...';
    }

    formatWaypoints(waypoints) {
        if (!waypoints || waypoints.length === 0) {
            return 'No waypoints found';
        }
        
        let html = '';
        waypoints.forEach((waypoint, index) => {
            html += `
                <div class="waypoint-item">
                    <h5>${index + 1}. ${waypoint.name}</h5>
                    <p class="waypoint-description">${waypoint.description || ''}</p>
                    ${waypoint.activities ? `
                        <ul class="waypoint-activities">
                            ${waypoint.activities.map(activity => `<li>${activity}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${waypoint.duration ? `<p class="waypoint-duration"><strong>Duration:</strong> ${waypoint.duration}</p>` : ''}
                </div>
            `;
        });
        return html;
    }

    setLoading(isLoading) {
        const btn = document.getElementById('generateRoute');
        const btnText = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.btn-spinner');
        
        if (isLoading) {
            btn.disabled = true;
            btnText.textContent = 'Generating...';
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            btnText.textContent = 'Generate Route';
            spinner.classList.add('hidden');
        }
    }

    showError(message) {
        // Simple error display - can be enhanced with a toast/modal
        alert(message);
    }

    openSpotlight(agent, destination, routeData) {
        // Store route data for the spotlight page
        const agentData = routeData.agentResults.find(result => result.agent === agent);
        const spotlightData = {
            agent: agent,
            destination: destination,
            origin: routeData.origin,
            agentData: agentData,
            totalStops: routeData.totalStops
        };
        
        // Store data in sessionStorage to pass to spotlight page
        sessionStorage.setItem('spotlightData', JSON.stringify(spotlightData));
        
        // Navigate to spotlight page
        window.location.href = `spotlight.html?agent=${agent}&destination=${encodeURIComponent(destination)}`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RoadTripPlanner();
});