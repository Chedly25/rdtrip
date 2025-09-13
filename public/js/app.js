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
            this.displayRoute(routeData, destinationCoords);
            
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

    displayRoute(routeData, destinationCoords) {
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
        
        // Add waypoint markers to map
        allWaypoints.forEach((waypoint, index) => {
            new mapboxgl.Marker({ color: '#34C759' })
                .setLngLat([waypoint.lng, waypoint.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <h3>📍 ${waypoint.name}</h3>
                    <p>${waypoint.description || ''}</p>
                `))
                .addTo(this.map);
        });

        // Add destination marker
        new mapboxgl.Marker({ color: '#FF3B30' })
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
            this.addRouteToMap(allWaypoints, destinationCoords);
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

    addRouteToMap(waypoints, destinationCoords) {
        // Create route coordinates array
        const routeCoords = [
            [5.4474, 43.5297], // Aix-en-Provence (start)
            ...waypoints.map(w => [w.lng, w.lat]),
            [destinationCoords.lng, destinationCoords.lat] // Destination
        ];

        // Add route line to map
        if (this.map.getSource('route')) {
            this.map.removeLayer('route');
            this.map.removeSource('route');
        }

        this.map.addSource('route', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': routeCoords
                }
            }
        });

        this.map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#007AFF',
                'line-width': 4,
                'line-opacity': 0.8
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
            html += `<div class="route-item">
                <h4>${agentEmoji} ${this.capitalizeFirst(result.agent)} Recommendations</h4>
                <p>${this.formatAgentResult(result.recommendations)}</p>
            </div>`;
        });

        routeResults.innerHTML = html;
        resultsSection.classList.remove('hidden');
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RoadTripPlanner();
});