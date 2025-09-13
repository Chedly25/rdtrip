// Spotlight Page Controller
class SpotlightController {
    constructor() {
        this.map = null;
        this.spotlightData = null;
        this.agentColors = {
            adventure: '#34C759',
            culture: '#FF9500',
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
        const data = sessionStorage.getItem('spotlightData');
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

        document.getElementById('routeAgentIcon').textContent = agentEmojis[agent];
        document.getElementById('routeTitle').textContent = agentNames[agent];
        document.getElementById('routeSubtitle').textContent = `${origin} → ${destination}`;
        
        // Set stats
        document.getElementById('totalStops').textContent = this.spotlightData.totalStops;
        
        // Calculate estimated days (assuming 1-2 days per stop + travel days)
        const estimatedDays = Math.max(3, this.spotlightData.totalStops * 1.5);
        document.getElementById('estimatedDays').textContent = Math.ceil(estimatedDays);
    }

    initMap() {
        // Initialize Mapbox map
        mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';
        
        this.map = new mapboxgl.Map({
            container: 'spotlightMap',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [5.4474, 43.5297], // Aix-en-Provence coordinates
            zoom: 6
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
                        waypoints.push({
                            name: waypoint.name,
                            description: waypoint.description,
                            activities: waypoint.activities || [],
                            duration: waypoint.duration,
                            lng: waypoint.coordinates[1], // Note: Mapbox uses [lng, lat]
                            lat: waypoint.coordinates[0]
                        });
                    }
                });
            }
        } catch (e) {
            console.log('Could not parse waypoints from agent data');
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
        const coordinates = [
            [5.4474, 43.5297], // Aix-en-Provence (start)
            ...waypoints.map(w => [w.lng, w.lat]),
            [destinationCoords.lng, destinationCoords.lat] // Destination
        ];

        try {
            const routeGeometry = await this.getDirections(coordinates);
            
            if (routeGeometry) {
                this.map.addSource('spotlight-route', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': routeGeometry
                    }
                });

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
                        'line-opacity': 0.8
                    }
                });
            }
        } catch (error) {
            console.error('Could not get driving directions:', error);
        }
    }

    async getDirections(coordinates) {
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
        // This is a rough estimate - in a real app you'd get this from the directions API
        const totalPoints = waypoints.length + 2; // +2 for origin and destination
        const estimatedDistance = totalPoints * 150; // Rough estimate in km
        document.getElementById('totalDistance').textContent = `${estimatedDistance}km`;
    }

    displayCities() {
        const waypoints = this.extractWaypoints(this.spotlightData.agentData);
        const container = document.getElementById('citiesContainer');
        
        let html = '';
        waypoints.forEach((waypoint, index) => {
            // Generate reliable Unsplash image URL
            const agentKeywords = {
                adventure: 'landscape',
                culture: 'architecture',
                food: 'cuisine'
            };
            
            const keyword = agentKeywords[this.spotlightData.agent] || 'travel';
            const cleanLocation = waypoint.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
            const imageUrl = `https://source.unsplash.com/800x600/?${cleanLocation}-${keyword}`;
            
            html += `
                <div class="city-card">
                    <div class="city-image-container">
                        <img src="${imageUrl}" alt="${waypoint.name}" class="city-image" 
                             onerror="this.src='https://source.unsplash.com/800x600/?travel-destination'" 
                             onload="this.classList.add('loaded')">
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
        });
        
        container.innerHTML = html;
    }

    setupEventListeners() {
        // Back button
        document.getElementById('backButton').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Generate itinerary button
        document.getElementById('generateItinerary').addEventListener('click', () => {
            this.generateDetailedItinerary();
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
                                        <img src="https://source.unsplash.com/400x200/?${day.location.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}-destination" alt="${day.location}" class="day-image" 
                                             onerror="this.src='https://source.unsplash.com/400x200/?travel-destination'" 
                                             onload="this.classList.add('loaded')">
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
                                                    <img src="https://source.unsplash.com/300x200/?${(activity.title || activity.name || '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}-activity" alt="${activity.title || activity.name}" class="activity-image" 
                                                         onerror="this.src='https://source.unsplash.com/300x200/?activity'" 
                                                         onload="this.classList.add('loaded')">
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
}

// Initialize the spotlight page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SpotlightController();
});