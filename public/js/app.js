// Enhanced Road Trip Planner App
class RoadTripPlanner {
    constructor() {
        console.log('🔥 RoadTripPlanner constructor called');
        this.map = null;
        this.selectedAgents = ['adventure', 'culture', 'food', 'hidden-gems'];
        this.selectedBudget = 'budget';
        this.currentRoute = null;
        this.chatMessages = [];
        this.routeAgent = null;
        this.enhancedFeaturesAvailable = false;

        console.log('🔥 Calling init()...');
        this.init();
    }

    async init() {
        this.initMap();
        this.setupEventListeners();
        await this.loadEnhancedFeatures();
        this.setupRouteUpdateListener();
    }

    async loadEnhancedFeatures() {
        try {
            const { routeAgent } = await import('./routeAgent.js');
            this.routeAgent = routeAgent;
            this.enhancedFeaturesAvailable = true;
            console.log('✅ Enhanced AI features loaded successfully');
        } catch (error) {
            console.warn('⚠️ Enhanced AI features failed to load:', error);
            console.log('💬 Using fallback chat functionality');
            this.enhancedFeaturesAvailable = false;
        }
    }

    initMap() {
        // Initialize Mapbox access token first (needed for geocoding even without map)
        mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';

        // Check if map container exists before initializing
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.log('Map container not found, skipping map initialization');
            this.map = null;
            return;
        }

        // Disable Mapbox telemetry to prevent ad-blocker conflicts
        if (window.mapboxgl) {
            window.mapboxgl.supported({ failIfMajorPerformanceCaveat: true });
        }

        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [5.4474, 43.5297], // Aix-en-Provence coordinates
            zoom: 6,
            // Disable telemetry collection to prevent ad-blocker issues
            collectResourceTiming: false
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
        console.log('🔥 Setting up event listeners...');

        // Agent selection buttons
        const agentBtns = document.querySelectorAll('.agent-btn');
        console.log('🔥 Found agent buttons:', agentBtns.length);
        agentBtns.forEach(btn => {
            btn.addEventListener('click', () => this.toggleAgent(btn));
        });

        // Budget selection buttons
        const budgetBtns = document.querySelectorAll('.budget-btn');
        console.log('🔥 Found budget buttons:', budgetBtns.length);
        budgetBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectBudget(btn));
        });

        // Generate route button
        const generateBtn = document.getElementById('generateRoute');
        console.log('🔥 Found generate button:', generateBtn);
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                console.log('🔥 Generate button clicked!');
                this.generateRoute();
            });
            console.log('🔥 Generate button event listener added');
        } else {
            console.error('🔥 Generate button not found!');
        }

        // Enter key for destination input
        document.getElementById('destination').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateRoute();
            }
        });

        // Note: Export buttons and chat are now handled in the results overlay
        // These elements no longer exist in the main form

        // Close modal on backdrop click for legacy modal
        const chatModal = document.getElementById('chatModal');
        if (chatModal) {
            chatModal.addEventListener('click', (e) => {
                if (e.target.id === 'chatModal') {
                    this.closeAiAssistant();
                }
            });
        }
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

    selectBudget(btn) {
        // Remove active class from all budget buttons
        document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        this.selectedBudget = btn.dataset.budget;
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
            console.log('🔥 SENDING API REQUEST WITH AGENTS:', this.selectedAgents);
            console.log('🔥 Hidden in selectedAgents?', this.selectedAgents.includes('hidden-gems'));

            const response = await fetch('/api/generate-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    destination: destination,
                    stops: stops,
                    agents: this.selectedAgents,
                    budget: this.selectedBudget
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate route');
            }

            const routeData = await response.json();
            console.log('🔥 API RESPONSE RECEIVED:', routeData);
            console.log('🔥 Agent Results in response:', routeData.agentResults?.map(ar => ar.agent));

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

        // Update global AI with route context
        if (window.globalAI) {
            window.globalAI.currentRoute = routeData;
            window.globalAI.loadPageContext();
            console.log('🤖 Global AI updated with new route data');
        }

        // Store route in localStorage for other pages
        localStorage.setItem('currentRoute', JSON.stringify(routeData));

        // Show prominent results overlay
        this.showResultsOverlay(routeData, destinationCoords);
        
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
            food: '#FF3B30',      // Red for food/cuisine
            'hidden-gems': '#9333ea'     // Purple for hidden gems
        };

        // Add waypoint markers to map with agent-specific colors (only if map exists)
        if (this.map) {
            allWaypoints.forEach((waypoint, index) => {
                const color = agentColors[waypoint.agent] || '#34C759';
                const agentEmoji = this.getAgentEmoji(waypoint.agent);

                new mapboxgl.Marker({ color: color })
                    .setLngLat([waypoint.lng, waypoint.lat])
                    .setPopup(new mapboxgl.Popup().setHTML(`
                        <h3>${agentEmoji} ${waypoint.name}</h3>
                        ${waypoint.fullName && waypoint.fullName !== waypoint.name ? `<p><small>${waypoint.fullName}</small></p>` : ''}
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
        }

        // Fit map to show all points (if map exists)
        if (this.map) {
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
        }

        // Add route line if we have waypoints (only if map exists)
        if (allWaypoints.length > 0 && this.map) {
            await this.addRouteToMap(allWaypoints, destinationCoords);
        }

        // Display route information through the results overlay
        // The results overlay will handle all the display
    }

    displayRouteTimeline(waypoints, destination) {
        const timelineContainer = document.getElementById('routeTimeline');
        if (!timelineContainer) return; // Element no longer exists
        timelineContainer.innerHTML = '<h4>🗺️ Route Timeline</h4>';

        // Add starting point
        const startingPoint = document.createElement('div');
        startingPoint.className = 'timeline-item';
        startingPoint.innerHTML = `
            <div class="timeline-marker">🏠</div>
            <div class="timeline-content">
                <div class="timeline-title">Aix-en-Provence</div>
                <div class="timeline-description">Starting point</div>
                <div class="timeline-duration">Day 0 - Departure</div>
            </div>
        `;
        timelineContainer.appendChild(startingPoint);

        // Add waypoints
        waypoints.forEach((waypoint, index) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div class="timeline-marker">${index + 1}</div>
                <div class="timeline-content">
                    <div class="timeline-title">${waypoint.name}</div>
                    <div class="timeline-description">${waypoint.description || `${this.capitalizeFirst(waypoint.agent)} destination`}</div>
                    <div class="timeline-duration">Day ${index + 1} - ${this.getEstimatedDuration(waypoint)}</div>
                </div>
            `;
            
            // Add click handler
            timelineItem.addEventListener('click', () => {
                // Highlight on map (if map exists)
                if (this.map) {
                    this.map.flyTo({
                        center: [waypoint.lng, waypoint.lat],
                        zoom: 10
                    });
                }

                // Toggle active state
                document.querySelectorAll('.timeline-item').forEach(item => item.classList.remove('active'));
                timelineItem.classList.add('active');
            });

            timelineContainer.appendChild(timelineItem);
        });

        // Add destination
        const destinationItem = document.createElement('div');
        destinationItem.className = 'timeline-item';
        destinationItem.innerHTML = `
            <div class="timeline-marker">🎯</div>
            <div class="timeline-content">
                <div class="timeline-title">${destination.name}</div>
                <div class="timeline-description">Final destination</div>
                <div class="timeline-duration">Day ${waypoints.length + 1} - Arrival</div>
            </div>
        `;
        
        destinationItem.addEventListener('click', () => {
            if (this.map) {
                this.map.flyTo({
                    center: [destination.lng, destination.lat],
                    zoom: 10
                });
            }
            document.querySelectorAll('.timeline-item').forEach(item => item.classList.remove('active'));
            destinationItem.classList.add('active');
        });

        timelineContainer.appendChild(destinationItem);
    }

    displayBudgetSummary(waypoints) {
        const budgetContainer = document.getElementById('budgetSummary');
        if (!budgetContainer) return; // Element no longer exists
        const budgetInfo = this.calculateBudget(waypoints);
        
        budgetContainer.innerHTML = `
            <h4>💰 Budget Estimate</h4>
            <div class="budget-breakdown">
                <div class="budget-item">
                    <div class="budget-indicator">${budgetInfo.indicator}</div>
                    <div class="budget-amount">€${budgetInfo.total}</div>
                    <div class="budget-label">Total</div>
                </div>
                <div class="budget-item">
                    <div class="budget-indicator">🏨</div>
                    <div class="budget-amount">€${budgetInfo.accommodation}</div>
                    <div class="budget-label">Hotels</div>
                </div>
                <div class="budget-item">
                    <div class="budget-indicator">🍽️</div>
                    <div class="budget-amount">€${budgetInfo.food}</div>
                    <div class="budget-label">Food</div>
                </div>
                <div class="budget-item">
                    <div class="budget-indicator">⛽</div>
                    <div class="budget-amount">€${budgetInfo.transport}</div>
                    <div class="budget-label">Transport</div>
                </div>
                <div class="budget-item">
                    <div class="budget-indicator">🎫</div>
                    <div class="budget-amount">€${budgetInfo.activities}</div>
                    <div class="budget-label">Activities</div>
                </div>
            </div>
        `;
    }

    displayLocalTips(waypoints, destination) {
        const tipsContainer = document.getElementById('localTips');
        if (!tipsContainer) return; // Element no longer exists
        const tips = this.generateLocalTips(waypoints, destination);
        
        tipsContainer.innerHTML = `
            <h4>💡 Local Tips</h4>
            <div class="tips-grid">
                <div class="tip-category">
                    <h5>💎 Hidden Gems</h5>
                    <ul>
                        ${tips.hiddenGems.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                <div class="tip-category">
                    <h5>🚫 Avoid Tourist Traps</h5>
                    <ul>
                        ${tips.avoidTraps.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                <div class="tip-category">
                    <h5>📸 Best Photo Spots</h5>
                    <ul>
                        ${tips.photoSpots.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    displayRouteResults(routeData) {
        console.log('🔥 DISPLAYING ROUTE RESULTS:', routeData);
        console.log('🔥 Agent Results:', routeData.agentResults);
        console.log('🔥 Hidden Gems present?', routeData.agentResults.find(ar => ar.agent === 'hidden-gems'));

        const resultsContainer = document.getElementById('routeResults');
        if (!resultsContainer) return; // Element no longer exists

        let resultsHTML = '<h4 style="margin-bottom: 20px; font-size: 20px;">🎯 Agent Recommendations</h4>';

        routeData.agentResults.forEach(agentResult => {
            console.log(`🔥 Processing agent: ${agentResult.agent}`);
            const agentEmoji = this.getAgentEmoji(agentResult.agent);
            const agentColor = this.getAgentColor(agentResult.agent);

            let cities = [];
            let waypointCount = 0;

            try {
                // Clean up and parse the JSON
                let jsonText = agentResult.recommendations;
                jsonText = jsonText
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*$/g, '')
                    .replace(/```\s*/g, '')  // Remove any remaining markdown
                    .trim();

                // More robust JSON extraction
                if (!jsonText.startsWith('{')) {
                    // Try to find JSON object in the text
                    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        jsonText = jsonMatch[0];
                    } else {
                        const waypointsMatch = jsonText.match(/"waypoints"\s*:\s*\[[\s\S]*?\]/);
                        if (waypointsMatch) {
                            jsonText = `{${waypointsMatch[0]}}`;
                        }
                    }
                }

                // Clean up any trailing non-JSON text
                const lastBraceIndex = jsonText.lastIndexOf('}');
                if (lastBraceIndex !== -1) {
                    jsonText = jsonText.substring(0, lastBraceIndex + 1);
                }

                const parsed = JSON.parse(jsonText);

                if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
                    waypointCount = parsed.waypoints.length;

                    // Group waypoints by city
                    const cityMap = new Map();

                    parsed.waypoints.forEach(wp => {
                        // Extract city name from the waypoint name
                        let cityName = this.extractCityName(wp.name);

                        if (!cityMap.has(cityName)) {
                            cityMap.set(cityName, []);
                        }

                        cityMap.get(cityName).push({
                            name: wp.name,
                            description: wp.description || '',
                            activities: wp.activities || []
                        });
                    });

                    // Convert to cities array
                    cities = Array.from(cityMap.entries()).map(([city, activities]) => ({
                        city: city,
                        activities: activities
                    }));
                }
            } catch (e) {
                console.warn('Could not parse agent recommendations for', agentResult.agent, ':', e);
                console.log('Raw response:', agentResult.recommendations.substring(0, 500) + '...');

                // Fallback: try to extract location names
                try {
                    // Try multiple patterns to extract location information
                    const patterns = [
                        /"name"\s*:\s*"([^"]+)"/g,
                        /\*\*([^*]+)\*\*/g,
                        /\d+\.\s*([^\n]+)/g,
                        /^-\s*([^\n]+)/gm
                    ];

                    let names = [];
                    for (const pattern of patterns) {
                        const matches = [...agentResult.recommendations.matchAll(pattern)];
                        if (matches.length > 0) {
                            names = matches.map(match => match[1].trim()).filter(name => name.length > 3);
                            if (names.length >= 2) break;
                        }
                    }

                    if (names.length > 0) {
                        waypointCount = names.length;

                        // Group by city
                        const cityMap = new Map();
                        names.forEach(name => {
                            const cityName = this.extractCityName(name);
                            if (!cityMap.has(cityName)) {
                                cityMap.set(cityName, []);
                            }
                            cityMap.get(cityName).push({ name: name, description: '', activities: [] });
                        });

                        cities = Array.from(cityMap.entries()).map(([city, activities]) => ({
                            city: city,
                            activities: activities
                        }));
                    } else {
                        waypointCount = 3;
                        cities = [{ city: `${this.capitalizeFirst(agentResult.agent)} destinations`, activities: [{ name: `Curated ${agentResult.agent} experiences` }] }];
                    }
                } catch (fallbackError) {
                    console.warn('Fallback parsing also failed for', agentResult.agent, ':', fallbackError);
                    waypointCount = 3;
                    cities = [{ city: `${this.capitalizeFirst(agentResult.agent)} destinations`, activities: [{ name: `Curated ${agentResult.agent} experiences` }] }];
                }
            }

            // Build city cards HTML
            let cityCardsHTML = '';
            if (cities.length > 0) {
                cityCardsHTML = '<div class="city-cards">';
                cities.forEach(cityData => {
                    cityCardsHTML += `
                        <div class="city-card">
                            <div class="city-card-header">
                                📍 ${cityData.city}
                            </div>
                            <ul class="city-activities">`;

                    cityData.activities.forEach(activity => {
                        const displayName = activity.name.replace(cityData.city, '').replace(/,\s*/, '').trim() || activity.name;
                        cityCardsHTML += `<li>${displayName}</li>`;
                    });

                    cityCardsHTML += `
                            </ul>
                        </div>`;
                });
                cityCardsHTML += '</div>';
            }

            resultsHTML += `
                <div class="route-item ${agentResult.agent}-theme">
                    <div class="route-item-header">
                        <h4>${agentEmoji} ${this.capitalizeFirst(agentResult.agent)} Experience</h4>
                        <div class="route-item-meta">
                            <span class="waypoint-count">${waypointCount} stops</span>
                            <button class="view-details-btn" onclick="planner.viewAgentDetails('${agentResult.agent}')">View Details</button>
                        </div>
                    </div>
                    <p>Discover the best ${agentResult.agent} experiences across ${cities.length} destination${cities.length > 1 ? 's' : ''}.</p>
                    ${cityCardsHTML}
                </div>
            `;
        });

        resultsContainer.innerHTML = resultsHTML;
    }

    // Enhanced AI Assistant functionality
    openAiAssistant() {
        document.getElementById('aiAssistantModal').classList.remove('hidden');
        if (this.chatMessages.length === 0) {
            if (this.enhancedFeaturesAvailable) {
                this.addAiMessage('assistant', "Hi! I'm your advanced route assistant! 🤖\n\nI can help you:\n• **Replace stops** - Say you've been to a city and I'll find a perfect alternative\n• **Optimize your route** - Ask me to rearrange for efficiency\n• **Get travel advice** - Local tips, food recommendations, hidden gems\n• **Plan itineraries** - Detailed day-by-day planning\n\nTry saying: \"I've been to [city name], can you find me an alternative?\" or \"Can you rearrange my route for the shortest distance?\"");
            } else {
                this.addAiMessage('assistant', "Hi! I'm your route assistant! 🤖\n\nI can help you with:\n• **Travel advice** - Local tips, food recommendations, hidden gems\n• **Route questions** - Ask about your current itinerary\n• **Planning help** - Get suggestions for your trip\n\nAsk me anything about your route or travel plans!");
            }
        }
    }

    closeAiAssistant() {
        document.getElementById('aiAssistantModal').classList.add('hidden');
        this.hideWorkflow();
    }

    async sendAiMessage() {
        const input = document.getElementById('aiInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addAiMessage('user', message);
        input.value = '';

        // Check if this is a route modification request
        const isRouteModification = this.isRouteModificationRequest(message);

        if (isRouteModification && this.enhancedFeaturesAvailable) {
            // Show workflow visualization
            this.showWorkflow();

            // Update status
            document.getElementById('aiStatus').textContent = 'Processing your request...';

            try {
                // Use the enhanced route agent for processing
                const response = await this.routeAgent.processMessage(message, this.currentRoute);

                // Hide workflow
                this.hideWorkflow();

                // Update status
                document.getElementById('aiStatus').textContent = 'Ready to help optimize your trip';

                // Handle different response types
                await this.handleAgentResponse(response);

            } catch (error) {
                console.error('AI Agent error:', error);
                this.hideWorkflow();
                document.getElementById('aiStatus').textContent = 'Ready to help optimize your trip';
                this.addAiMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            }
        } else {
            // Show loading message for regular chat
            const loadingId = this.addAiMessage('assistant', 'Thinking...', true);

            try {
                if (this.enhancedFeaturesAvailable && this.routeAgent) {
                    // Use the enhanced route agent for processing
                    const response = await this.routeAgent.processMessage(message, this.currentRoute);

                    // Remove loading message
                    this.removeAiMessage(loadingId);

                    // Handle different response types
                    await this.handleAgentResponse(response);
                } else {
                    // Fallback to original chat functionality
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: message,
                            routeContext: this.currentRoute
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to get chat response');
                    }

                    const data = await response.json();

                    // Remove loading message and add real response
                    this.removeAiMessage(loadingId);
                    this.addAiMessage('assistant', data.response);
                }

            } catch (error) {
                console.error('Chat error:', error);
                this.removeAiMessage(loadingId);
                this.addAiMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            }
        }
    }

    /**
     * Handle different types of responses from the RouteAgent
     * @param {Object} response - Response from RouteAgent
     */
    async handleAgentResponse(response) {
        switch (response.type) {
            case 'replacement_proposal':
                this.addAiMessage('assistant', response.content);
                // Could add special UI for replacement proposals
                break;

            case 'replacement_executed':
                this.addAiMessage('assistant', response.content);
                // Update the current route and refresh display
                if (response.data && response.data.updatedRoute) {
                    this.currentRoute = response.data.updatedRoute;
                    this.displayCurrentRoute();
                }
                break;

            case 'route_optimized':
                this.addAiMessage('assistant', response.content);
                // Update the route display with optimized route
                if (response.data && response.data.optimizedRoute) {
                    this.displayCurrentRoute();
                }
                break;

            case 'clarification':
            case 'error':
            case 'general_response':
            case 'info':
            case 'alternative_search':
            default:
                this.addAiMessage('assistant', response.content);
                break;
        }
    }

    // New AI Message handling methods
    addAiMessage(sender, message, isLoading = false) {
        const messagesContainer = document.getElementById('aiMessages');
        const messageElement = document.createElement('div');
        const messageId = 'ai_msg_' + Date.now();

        messageElement.id = messageId;
        messageElement.className = `ai-message ${sender}`;
        if (isLoading) {
            messageElement.className += ' loading';
        }

        // Handle markdown-style formatting
        const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        messageElement.innerHTML = formattedMessage;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.chatMessages.push({
            id: messageId,
            sender: sender,
            message: message,
            timestamp: new Date()
        });

        return messageId;
    }

    removeAiMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.remove();
            this.chatMessages = this.chatMessages.filter(msg => msg.id !== messageId);
        }
    }

    // Workflow visualization methods
    showWorkflow() {
        const workflow = document.getElementById('aiWorkflow');
        workflow.classList.remove('hidden');

        // Reset all steps
        const steps = workflow.querySelectorAll('.workflow-step');
        steps.forEach(step => {
            step.classList.remove('active', 'completed');
        });

        // Start the workflow animation
        this.animateWorkflowSteps();
    }

    hideWorkflow() {
        document.getElementById('aiWorkflow').classList.add('hidden');
    }

    async animateWorkflowSteps() {
        const steps = ['step1', 'step2', 'step3', 'step4'];
        const progressBar = document.getElementById('workflowProgress');

        for (let i = 0; i < steps.length; i++) {
            const step = document.getElementById(steps[i]);
            step.classList.add('active');

            // Update progress bar
            progressBar.style.width = `${((i + 1) / steps.length) * 100}%`;

            // Wait for step to complete
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

            step.classList.remove('active');
            step.classList.add('completed');
        }
    }

    // Detect if message is a route modification request
    isRouteModificationRequest(message) {
        const routeModificationKeywords = [
            'replace', 'change', 'swap', 'substitute', 'alternative',
            'been to', 'visited', 'already seen',
            'optimize', 'rearrange', 'reorder', 'efficient',
            'shortest', 'fastest', 'better route'
        ];

        const lowerMessage = message.toLowerCase();
        return routeModificationKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    addChatMessage(sender, message, isLoading = false) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        const messageId = 'msg_' + Date.now();
        
        messageElement.id = messageId;
        messageElement.className = `message ${sender} ${isLoading ? 'loading' : ''}`;
        messageElement.textContent = message;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        this.chatMessages.push({
            id: messageId,
            sender: sender,
            message: message,
            timestamp: new Date()
        });
        
        return messageId;
    }

    removeChatMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.remove();
            this.chatMessages = this.chatMessages.filter(msg => msg.id !== messageId);
        }
    }

    // PDF generation
    async downloadPDF() {
        if (!this.currentRoute) {
            this.showError('No route to download. Please generate a route first.');
            return;
        }

        try {
            // Show loading (if button exists)
            const btn = document.getElementById('downloadPdf');
            let originalText = '📄 Download PDF';
            if (btn) {
                originalText = btn.textContent;
                btn.textContent = '📄 Generating PDF...';
                btn.disabled = true;
            }

            // Create PDF using jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Add title
            pdf.setFontSize(20);
            pdf.text('Road Trip Itinerary', 20, 20);
            
            // Add route info
            pdf.setFontSize(12);
            pdf.text(`From: Aix-en-Provence`, 20, 35);
            pdf.text(`To: ${this.currentRoute.destination}`, 20, 45);
            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
            
            // Add waypoints
            let y = 70;
            const waypoints = this.extractWaypoints(this.currentRoute);
            
            pdf.setFontSize(14);
            pdf.text('Route Stops:', 20, y);
            y += 10;
            
            pdf.setFontSize(10);
            waypoints.forEach((waypoint, index) => {
                if (y > 280) {
                    pdf.addPage();
                    y = 20;
                }
                
                pdf.text(`${index + 1}. ${waypoint.name}`, 25, y);
                y += 7;
                if (waypoint.description) {
                    const lines = pdf.splitTextToSize(`   ${waypoint.description}`, 160);
                    pdf.text(lines, 25, y);
                    y += lines.length * 5;
                }
                y += 5;
            });
            
            // Add budget info
            if (y > 250) {
                pdf.addPage();
                y = 20;
            }
            
            const budgetInfo = this.calculateBudget(waypoints);
            pdf.setFontSize(14);
            pdf.text('Budget Estimate:', 20, y);
            y += 10;
            
            pdf.setFontSize(10);
            pdf.text(`Total: €${budgetInfo.total}`, 25, y);
            pdf.text(`Accommodation: €${budgetInfo.accommodation}`, 25, y + 7);
            pdf.text(`Food: €${budgetInfo.food}`, 25, y + 14);
            pdf.text(`Transport: €${budgetInfo.transport}`, 25, y + 21);
            pdf.text(`Activities: €${budgetInfo.activities}`, 25, y + 28);
            
            // Save PDF
            pdf.save(`road-trip-itinerary-${new Date().toISOString().split('T')[0]}.pdf`);
            
            // Reset button (if it exists)
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showError('Failed to generate PDF. Please try again.');
            
            // Reset button (if it exists)
            const btn = document.getElementById('downloadPdf');
            if (btn) {
                btn.textContent = '📄 Download PDF';
                btn.disabled = false;
            }
        }
    }

    // Utility methods
    calculateBudget(waypoints) {
        const budgetMultipliers = {
            budget: 1,
            moderate: 1.5,
            comfort: 2.5,
            luxury: 4
        };
        
        const multiplier = budgetMultipliers[this.selectedBudget];
        const days = waypoints.length + 1;
        
        const baseCosts = {
            accommodation: 50 * days,
            food: 35 * days,
            transport: 100 + (waypoints.length * 20),
            activities: 25 * days
        };
        
        const adjustedCosts = {
            accommodation: Math.round(baseCosts.accommodation * multiplier),
            food: Math.round(baseCosts.food * multiplier),
            transport: Math.round(baseCosts.transport * Math.min(multiplier, 2)), // Transport doesn't scale as much
            activities: Math.round(baseCosts.activities * multiplier)
        };
        
        const total = Object.values(adjustedCosts).reduce((sum, cost) => sum + cost, 0);
        
        const indicators = {
            budget: '$',
            moderate: '$$',
            comfort: '$$$',
            luxury: '$$$$'
        };
        
        return {
            ...adjustedCosts,
            total,
            indicator: indicators[this.selectedBudget]
        };
    }

    generateLocalTips(waypoints, destination) {
        const hiddenGems = [];
        const avoidTraps = [];
        const photoSpots = [];

        // Extract specific tips from the current route's agent results
        if (this.currentRoute && this.currentRoute.agentResults) {
            this.currentRoute.agentResults.forEach(agentResult => {
                try {
                    const cleanedRecommendations = agentResult.recommendations
                        .replace(/```json\s*/g, '')
                        .replace(/```\s*$/g, '')
                        .trim();

                    const parsed = JSON.parse(cleanedRecommendations);

                    if (parsed.budget_tips && Array.isArray(parsed.budget_tips)) {
                        hiddenGems.push(...parsed.budget_tips.slice(0, 2));
                    }

                    if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
                        parsed.waypoints.forEach(waypoint => {
                            if (waypoint.activities && Array.isArray(waypoint.activities)) {
                                // Add photo spot tips from activities
                                const photoTip = waypoint.activities.find(act =>
                                    act.toLowerCase().includes('photo') ||
                                    act.toLowerCase().includes('view') ||
                                    act.toLowerCase().includes('scenery')
                                );
                                if (photoTip) {
                                    photoSpots.push(`${waypoint.name}: ${photoTip.split('.')[0]}`);
                                }
                            }
                        });
                    }
                } catch (e) {
                    // Silent fail for parsing errors
                }
            });
        }

        // Add fallback tips based on waypoint locations
        waypoints.forEach(waypoint => {
            if (waypoint.name) {
                hiddenGems.push(`Explore the local markets and small villages around ${waypoint.name}`);
                avoidTraps.push(`Skip overpriced restaurants near main attractions in ${waypoint.name}`);
                photoSpots.push(`Best views: Early morning or sunset at ${waypoint.name}`);
            }
        });

        // Add destination-specific tip
        if (destination && destination.name) {
            hiddenGems.push(`Ask locals in ${destination.name} for their favorite neighborhood spots`);
        }

        // Ensure we have enough tips (fallback to generic ones if needed)
        const fallbackHiddenGems = [
            "Visit local farmers markets for authentic regional produce",
            "Stay in family-run accommodations for insider tips",
            "Take detours through small villages for unique discoveries",
            "Look for restaurants where locals eat, not tourists"
        ];

        const fallbackAvoidTraps = [
            "Avoid restaurants with multilingual tourist menus",
            "Skip expensive parking near major attractions",
            "Be cautious of overpriced souvenir shops in tourist areas",
            "Avoid tours that only visit crowded mainstream sites"
        ];

        const fallbackPhotoSpots = [
            "Golden hour shots at historical sites",
            "Local bridges and waterfront areas",
            "Elevated viewpoints and hills",
            "Colorful local neighborhoods and street art"
        ];

        return {
            hiddenGems: [...new Set([...hiddenGems, ...fallbackHiddenGems])].slice(0, 4),
            avoidTraps: [...new Set([...avoidTraps, ...fallbackAvoidTraps])].slice(0, 4),
            photoSpots: [...new Set([...photoSpots, ...fallbackPhotoSpots])].slice(0, 4)
        };
    }

    extractWaypoints(routeData) {
        const waypoints = [];

        routeData.agentResults.forEach(agentResult => {
            try {
                // First try to parse as JSON
                let parsed;
                const cleanedRecommendations = agentResult.recommendations
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*$/g, '')
                    .trim();

                try {
                    parsed = JSON.parse(cleanedRecommendations);
                } catch (jsonError) {
                    // If JSON parsing fails, extract waypoints from text
                    console.log('JSON parsing failed, extracting from text for agent:', agentResult.agent);
                    console.log('Failed JSON:', cleanedRecommendations.substring(0, 200) + '...');

                    // Extract location names from the text
                    const locationMatches = cleanedRecommendations.match(/"name":\s*"([^"]+)"/g) ||
                                          cleanedRecommendations.match(/\*\*(.*?)\*\*/g) ||
                                          cleanedRecommendations.match(/(\b[A-Z][a-z]+ [A-Z][a-z]+\b)/g);

                    if (locationMatches) {
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
                                lat: waypoint.coordinates ? waypoint.coordinates[0] : (44.0 + Math.random() * 6.0),
                                activities: waypoint.activities || [],
                                duration: waypoint.duration || '2-3 hours'
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
        const targetWaypoints = this.currentRoute?.totalStops || 3;
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
            // Match "Something, City" pattern
            /,\s*([^,]+)$/,
            // Match "Something in City" pattern
            /\bin\s+([A-Z][a-zA-Z\s]+)$/,
            // Match "Something near City" pattern
            /\bnear\s+([A-Z][a-zA-Z\s]+)$/,
            // Match "Something at City" pattern
            /\bat\s+([A-Z][a-zA-Z\s]+)$/,
            // Match "Something de City" (French pattern)
            /\bde\s+([A-Z][a-zA-Z\s]+)$/,
            // Match "Something di City" (Italian pattern)
            /\bdi\s+([A-Z][a-zA-Z\s]+)$/
        ];

        // Special cases for known attractions and their cities
        const knownLocations = {
            'Pont d\'Espagne': 'Cauterets',
            'Cirque de Gavarnie': 'Gavarnie',
            'Pic du Midi': 'La Mongie',
            'Col du Tourmalet': 'Barèges',
            'Lac de Gaube': 'Cauterets',
            'Gorges du Verdon': 'Moustiers-Sainte-Marie',
            'Calanques': 'Cassis',
            'Mont Ventoux': 'Bedoin',
            'Pont du Gard': 'Vers-Pont-du-Gard',
            'Arena di Verona': 'Verona',
            'Piazza San Marco': 'Venice',
            'Duomo': 'Florence',
            'Colosseum': 'Rome',
            'Sagrada Familia': 'Barcelona',
            'Park Güell': 'Barcelona',
            'Alhambra': 'Granada',
            'La Rambla': 'Barcelona'
        };

        // Check if it's a known location
        for (const [attraction, city] of Object.entries(knownLocations)) {
            if (locationName.includes(attraction)) {
                return city;
            }
        }

        // Try to extract city from patterns
        for (const pattern of patterns) {
            const match = locationName.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        // If location already looks like a city name (single or two words, capitalized)
        if (/^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?$/.test(locationName)) {
            return locationName;
        }

        // Extract the last capitalized word group as city name
        const words = locationName.split(/\s+/);
        const capitalizedWords = [];
        for (let i = words.length - 1; i >= 0; i--) {
            if (/^[A-Z]/.test(words[i])) {
                capitalizedWords.unshift(words[i]);
                if (capitalizedWords.length >= 2 || i === 0) {
                    break;
                }
            } else {
                break;
            }
        }

        if (capitalizedWords.length > 0) {
            return capitalizedWords.join(' ');
        }

        // Fallback: return the original name
        return locationName;
    }

    getAgentEmoji(agent) {
        const emojis = {
            adventure: '🏔️',
            culture: '🏛️',
            food: '🍽️',
            hidden: '💎'
        };
        return emojis[agent] || '📍';
    }

    getAgentColor(agent) {
        const colors = {
            adventure: '#34C759',
            culture: '#FFD60A',
            food: '#FF3B30',
            'hidden-gems': '#9333ea'
        };
        return colors[agent] || '#007AFF';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    extractCitiesFromAgent(agentResult) {
        try {
            const recommendations = JSON.parse(agentResult.recommendations);
            if (recommendations.waypoints && Array.isArray(recommendations.waypoints)) {
                return recommendations.waypoints.map(waypoint => ({
                    city: waypoint.name,
                    coordinates: waypoint.coordinates,
                    description: waypoint.description,
                    activities: waypoint.activities,
                    duration: waypoint.duration
                }));
            }
            return [];
        } catch (error) {
            console.error('Error parsing agent recommendations:', error);
            return [];
        }
    }

    extractWaypoints(routeData) {
        const allWaypoints = [];

        routeData.agentResults.forEach(agentResult => {
            try {
                const recommendations = JSON.parse(agentResult.recommendations);
                if (recommendations.waypoints && Array.isArray(recommendations.waypoints)) {
                    recommendations.waypoints.forEach(waypoint => {
                        allWaypoints.push({
                            name: waypoint.name,
                            lat: waypoint.coordinates[1],
                            lng: waypoint.coordinates[0],
                            agent: agentResult.agent,
                            description: waypoint.description,
                            activities: waypoint.activities,
                            duration: waypoint.duration
                        });
                    });
                }
            } catch (error) {
                console.error(`Error parsing recommendations for ${agentResult.agent}:`, error);
            }
        });

        return allWaypoints;
    }

    async addRouteToMap(waypoints, destinationCoords) {
        if (!this.map) return;

        try {
            // Create coordinates array for the route line
            const coordinates = [
                [5.4474, 43.5297], // Aix-en-Provence starting point
                ...waypoints.map(wp => [wp.lng, wp.lat]),
                [destinationCoords.lng, destinationCoords.lat]
            ];

            // Add route line to map
            this.map.addSource('route', {
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
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#667eea',
                    'line-width': 4
                }
            });
        } catch (error) {
            console.error('Error adding route to map:', error);
        }
    }

    getEstimatedDuration(waypoint) {
        const durations = {
            adventure: '2-3 hours',
            culture: '3-4 hours',
            food: '1-2 hours'
        };
        return durations[waypoint.agent] || '2-3 hours';
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    async addRouteToMap(waypoints, destination) {
        if (!this.map) {
            console.log('Map not available, skipping route display');
            return;
        }

        try {
            // Create the coordinates array for the Directions API
            const coordinates = [
                [5.4474, 43.5297] // Start from Aix-en-Provence
            ];

            // Add all waypoints
            waypoints.forEach(waypoint => {
                coordinates.push([waypoint.lng, waypoint.lat]);
            });

            // Add destination
            if (destination) {
                coordinates.push([destination.lng, destination.lat]);
            }

            // Get the actual driving route using Mapbox Directions API
            const routeGeometry = await this.getDirectionsRoute(coordinates);

            if (routeGeometry) {
                // Wait for map to be loaded
                if (!this.map.isStyleLoaded()) {
                    this.map.once('styledata', () => {
                        this.addRouteLayer(routeGeometry);
                    });
                } else {
                    this.addRouteLayer(routeGeometry);
                }
            } else {
                // Fallback to straight lines if Directions API fails
                console.warn('Directions API failed, using straight line route');
                this.addRouteLayer(coordinates);
            }

        } catch (error) {
            console.warn('Could not add route to map:', error);
        }
    }

    async getDirectionsRoute(coordinates) {
        try {
            // Format coordinates for the Directions API (lng,lat pairs)
            const coordString = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');

            // Make request to Mapbox Directions API
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${mapboxgl.accessToken}`
            );

            if (!response.ok) {
                throw new Error(`Directions API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                return data.routes[0].geometry.coordinates;
            } else {
                throw new Error('No routes found');
            }

        } catch (error) {
            console.warn('Directions API request failed:', error);
            return null;
        }
    }

    addRouteLayer(coordinates) {
        if (!this.map) {
            console.log('Map not available, skipping route layer');
            return;
        }

        try {
            // Remove existing route if it exists
            if (this.map.getSource('route')) {
                if (this.map.getLayer('route-arrows')) {
                    this.map.removeLayer('route-arrows');
                }
                if (this.map.getLayer('route')) {
                    this.map.removeLayer('route');
                }
                if (this.map.getLayer('route-outline')) {
                    this.map.removeLayer('route-outline');
                }
                this.map.removeSource('route');
            }

            // Ensure coordinates are in the right format
            if (!coordinates || coordinates.length === 0) {
                console.warn('No coordinates provided for route');
                return;
            }

            // Add route source
            this.map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                }
            });

            // Add route layer with improved styling
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
                    'line-width': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        8, 3,
                        14, 6
                    ],
                    'line-opacity': 0.9
                }
            });

            // Add route outline for better visibility
            this.map.addLayer({
                id: 'route-outline',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#FFFFFF',
                    'line-width': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        8, 5,
                        14, 8
                    ],
                    'line-opacity': 0.6
                }
            }, 'route');

            // Add route arrows to show direction (only if the route has multiple points)
            if (coordinates.length > 10) { // Only for detailed routes
                this.map.addLayer({
                    id: 'route-arrows',
                    type: 'symbol',
                    source: 'route',
                    layout: {
                        'symbol-placement': 'line',
                        'symbol-spacing': 100,
                        'text-field': '→',
                        'text-size': 14,
                        'text-rotation-alignment': 'map',
                        'text-pitch-alignment': 'viewport'
                    },
                    paint: {
                        'text-color': '#007AFF',
                        'text-halo-color': 'white',
                        'text-halo-width': 2
                    }
                });
            }

            console.log(`Route added with ${coordinates.length} coordinate points`);

        } catch (error) {
            console.warn('Could not add route layer:', error);
        }
    }

    viewAgentDetails(agent) {
        // Find the agent's recommendations
        const agentResult = this.currentRoute?.agentResults.find(ar => ar.agent === agent);
        if (agentResult && this.currentRoute) {
            // Store the agent data in localStorage for the spotlight page in the format spotlight.js expects
            const spotlightData = {
                agent: agent,
                agentData: agentResult, // spotlight.js expects this key
                destination: this.currentRoute.destination,
                origin: this.currentRoute.origin,
                totalStops: this.currentRoute.totalStops,
                routeData: this.currentRoute, // Keep for compatibility
                timestamp: Date.now()
            };

            localStorage.setItem('spotlightData', JSON.stringify(spotlightData));

            // Open spotlight page in new window/tab
            window.open('./spotlight.html', '_blank');
        } else {
            alert(`No detailed recommendations available for ${agent} agent.`);
        }
    }

    setLoading(isLoading) {
        const btn = document.getElementById('generateRoute');
        const spinner = btn.querySelector('.btn-spinner');
        const text = btn.querySelector('.btn-text');

        if (isLoading) {
            btn.disabled = true;
            spinner.classList.remove('hidden');
            text.textContent = 'Generating...';
        } else {
            btn.disabled = false;
            spinner.classList.add('hidden');
            text.textContent = 'Generate Route';
        }
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        alert(message);
    }

    showResultsOverlay(routeData, destinationCoords) {
        // Create overlay HTML
        const overlayHTML = `
            <div class="results-overlay" id="resultsOverlay">
                <div class="results-overlay-header">
                    <div class="header-content">
                        <img src="tiguan.png" alt="Road Trip" class="header-icon">
                        <div class="header-text">
                            <h1>Route Results</h1>
                            <div class="route-path">
                                <span class="origin">Aix-en-Provence</span>
                                <span class="arrow">→</span>
                                <span class="destination">${routeData.destination}</span>
                            </div>
                        </div>
                    </div>
                    <button class="close-results" onclick="planner.closeResultsOverlay()">×</button>
                </div>

                <!-- Horizontal Overview -->
                <div class="agents-overview">
                    <h2>Choose Your Adventure Style</h2>
                    <div class="agents-row">
                        ${this.createQuickCards(routeData)}
                    </div>
                </div>

                <!-- Detailed Cards -->
                <div class="agents-detailed">
                    ${this.createDetailedCards(routeData)}
                </div>

            </div>
        `;

        // Add overlay to body
        const overlayDiv = document.createElement('div');
        overlayDiv.innerHTML = overlayHTML;
        document.body.appendChild(overlayDiv.firstElementChild);

        // Initialize mini maps for each card
        setTimeout(() => {
            this.initializeResultMaps(routeData, destinationCoords);
        }, 100);
    }

    createQuickCards(routeData) {
        return routeData.agentResults.map(agentResult => {
            const cities = this.extractCitiesFromAgent(agentResult);
            const cityNames = cities.slice(0, 3).map(c => c.city).join(' → ');

            return `
                <div class="agent-quick-card ${agentResult.agent}" onclick="planner.scrollToAgent('${agentResult.agent}')">
                    <h3><span class="emoji">${this.getAgentEmoji(agentResult.agent)}</span> ${this.capitalizeFirst(agentResult.agent)}</h3>
                    <div class="cities-count">${cities.length} cities</div>
                    <div class="cities-preview">${cityNames}</div>
                </div>
            `;
        }).join('');
    }

    createDetailedCards(routeData) {
        return routeData.agentResults.map(agentResult => {
            const cities = this.extractCitiesFromAgent(agentResult);
            const agentEmoji = this.getAgentEmoji(agentResult.agent);

            return `
                <div class="agent-detailed-card ${agentResult.agent}" id="agent-${agentResult.agent}" onclick="planner.viewAgentDetails('${agentResult.agent}')">
                    <div class="agent-card-header">
                        <h3><span class="emoji">${agentEmoji}</span> ${this.capitalizeFirst(agentResult.agent)} Route</h3>
                        <p>Discover ${cities.length} amazing cities perfect for ${agentResult.agent} enthusiasts</p>
                    </div>
                    <div class="agent-card-body">
                        <div class="agent-card-content">
                            <div class="city-list">
                                ${this.createCityList(cities, agentResult.agent)}
                            </div>
                        </div>
                        <div class="agent-card-map" id="map-${agentResult.agent}">
                            <!-- Map will be initialized here -->
                        </div>
                    </div>
                    <button class="view-full-route">View Full ${this.capitalizeFirst(agentResult.agent)} Route →</button>
                </div>
            `;
        }).join('');
    }

    createCityList(cities, agentType) {
        return cities.map(cityData => `
            <div class="city-item">
                <div class="city-name">📍 ${cityData.city}</div>
                <div class="city-description">${cityData.description || `Perfect for ${agentType} experiences`}</div>
                <ul class="city-activities">
                    ${cityData.activities.slice(0, 3).map(activity =>
                        `<li>${activity.name || activity}</li>`
                    ).join('')}
                </ul>
            </div>
        `).join('');
    }

    extractCitiesFromAgent(agentResult) {
        const cities = [];

        try {
            let jsonText = agentResult.recommendations
                .replace(/```json\s*/g, '')
                .replace(/```\s*$/g, '')
                .trim();

            if (!jsonText.startsWith('{')) {
                const waypointsMatch = jsonText.match(/"waypoints"\s*:\s*\[[\s\S]*?\]/);
                if (waypointsMatch) {
                    jsonText = `{${waypointsMatch[0]}}`;
                }
            }

            const parsed = JSON.parse(jsonText);

            if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
                parsed.waypoints.forEach(wp => {
                    const cityName = this.extractCityName(wp.name);
                    cities.push({
                        city: cityName,
                        description: wp.description || '',
                        activities: wp.activities || [],
                        coordinates: wp.coordinates || null
                    });
                });
            }
        } catch (e) {
            // Fallback
            cities.push({
                city: 'Various destinations',
                description: `Curated ${agentResult.agent} experiences`,
                activities: [],
                coordinates: null
            });
        }

        return cities;
    }

    initializeResultMaps(routeData, destinationCoords) {
        routeData.agentResults.forEach(agentResult => {
            const mapContainer = document.getElementById(`map-${agentResult.agent}`);
            if (!mapContainer) return;

            // Clear any existing map content
            mapContainer.innerHTML = '';

            const miniMap = new mapboxgl.Map({
                container: `map-${agentResult.agent}`,
                style: 'mapbox://styles/mapbox/light-v11',
                center: [2.3522, 48.8566], // Center of France
                zoom: 5,
                interactive: false,
                attributionControl: false,
                collectResourceTiming: false
            });

            miniMap.on('load', () => {
                // Extract waypoints for this specific agent
                const waypoints = this.extractWaypointsForAgent(agentResult);
                const color = this.getAgentColor(agentResult.agent);

                // Create coordinates array for route
                const routeCoordinates = [
                    [5.4474, 43.5297] // Start from Aix-en-Provence
                ];

                // Add origin marker
                new mapboxgl.Marker({ color: '#007AFF' })
                    .setLngLat([5.4474, 43.5297])
                    .setPopup(new mapboxgl.Popup().setHTML('<h3>🏠 Start</h3>'))
                    .addTo(miniMap);

                // Add waypoint markers and coordinates
                waypoints.forEach((waypoint, index) => {
                    let coords;
                    if (waypoint.coordinates && Array.isArray(waypoint.coordinates) && waypoint.coordinates.length === 2) {
                        coords = waypoint.coordinates; // Should be [lng, lat]
                    } else if (waypoint.lng && waypoint.lat) {
                        coords = [waypoint.lng, waypoint.lat];
                    } else {
                        // Generate random coordinates in Western/Central Europe
                        coords = [
                            2.0 + Math.random() * 8.0,  // longitude: 2° to 10° E (Western/Central Europe)
                            44.0 + Math.random() * 6.0  // latitude: 44° to 50° N (France/Germany area)
                        ];
                    }

                    routeCoordinates.push(coords);

                    new mapboxgl.Marker({ color: color })
                        .setLngLat(coords)
                        .setPopup(new mapboxgl.Popup().setHTML(`
                            <h3>${this.getAgentEmoji(agentResult.agent)} ${waypoint.name}</h3>
                            <p>${waypoint.description || ''}</p>
                        `))
                        .addTo(miniMap);
                });

                // Add destination marker and coordinates
                if (destinationCoords) {
                    routeCoordinates.push([destinationCoords.lng, destinationCoords.lat]);
                    new mapboxgl.Marker({ color: '#8E44AD' })
                        .setLngLat([destinationCoords.lng, destinationCoords.lat])
                        .setPopup(new mapboxgl.Popup().setHTML('<h3>🎯 Destination</h3>'))
                        .addTo(miniMap);
                }

                // Add route line using actual roads
                if (routeCoordinates.length > 1) {
                    this.addMiniMapRoute(miniMap, routeCoordinates, color, agentResult.agent);
                }

                // Fit map to show all points
                if (routeCoordinates.length > 1) {
                    const bounds = new mapboxgl.LngLatBounds();
                    routeCoordinates.forEach(coord => {
                        bounds.extend(coord);
                    });
                    miniMap.fitBounds(bounds, {
                        padding: 30,
                        maxZoom: 8
                    });
                }
            });
        });
    }

    extractWaypointsForAgent(agentResult) {
        const waypoints = [];

        try {
            let parsed;
            const cleanedRecommendations = agentResult.recommendations
                .replace(/```json\s*/g, '')
                .replace(/```\s*$/g, '')
                .replace(/```\s*/g, '')
                .trim();

            // More robust JSON extraction
            if (!cleanedRecommendations.startsWith('{')) {
                const jsonMatch = cleanedRecommendations.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const lastBraceIndex = jsonMatch[0].lastIndexOf('}');
                    if (lastBraceIndex !== -1) {
                        parsed = JSON.parse(jsonMatch[0].substring(0, lastBraceIndex + 1));
                    }
                }
            } else {
                const lastBraceIndex = cleanedRecommendations.lastIndexOf('}');
                if (lastBraceIndex !== -1) {
                    parsed = JSON.parse(cleanedRecommendations.substring(0, lastBraceIndex + 1));
                }
            }

            if (parsed && parsed.waypoints && Array.isArray(parsed.waypoints)) {
                parsed.waypoints.forEach(waypoint => {
                    if (waypoint.name) {
                        const cityName = this.extractCityName(waypoint.name);
                        waypoints.push({
                            name: cityName,
                            fullName: waypoint.name,
                            agent: agentResult.agent,
                            description: waypoint.description || `${this.capitalizeFirst(agentResult.agent)} destination`,
                            coordinates: waypoint.coordinates || null,
                            lng: waypoint.coordinates ? waypoint.coordinates[0] : (2.0 + Math.random() * 8.0),
                            lat: waypoint.coordinates ? waypoint.coordinates[1] : (44.0 + Math.random() * 6.0),
                            activities: waypoint.activities || [],
                            duration: waypoint.duration || '2-3 hours'
                        });
                    }
                });
            }
        } catch (error) {
            console.log('Could not parse waypoints for mini map:', agentResult.agent, error);

            // Fallback: create sample waypoints
            for (let i = 0; i < 3; i++) {
                waypoints.push({
                    name: `${this.capitalizeFirst(agentResult.agent)} Stop ${i + 1}`,
                    agent: agentResult.agent,
                    description: `${this.capitalizeFirst(agentResult.agent)} destination`,
                    lng: 2.0 + Math.random() * 8.0,  // Western/Central Europe longitude
                    lat: 44.0 + Math.random() * 6.0  // Central Europe latitude
                });
            }
        }

        return waypoints;
    }

    async addMiniMapRoute(miniMap, coordinates, color, agentId) {
        try {
            // Get actual road route using Mapbox Directions API
            const actualRoute = await this.getMiniMapDirections(coordinates);

            if (actualRoute) {
                // Add route source with actual road geometry
                miniMap.addSource(`route-${agentId}`, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: actualRoute
                        }
                    }
                });
            } else {
                // Fallback to straight lines if Directions API fails
                miniMap.addSource(`route-${agentId}`, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    }
                });
            }

            // Add route line layer
            miniMap.addLayer({
                id: `route-${agentId}`,
                type: 'line',
                source: `route-${agentId}`,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': color,
                    'line-width': 2,
                    'line-opacity': 0.8
                }
            });

        } catch (error) {
            console.warn('Could not add route to mini map:', error);
        }
    }

    async getMiniMapDirections(coordinates) {
        try {
            // Limit to 3-4 waypoints for mini maps to avoid API limits
            const limitedCoords = coordinates.length > 4 ?
                [coordinates[0], ...coordinates.slice(1, -1).slice(0, 2), coordinates[coordinates.length - 1]] :
                coordinates;

            // Format coordinates for the Directions API (lng,lat pairs)
            const coordString = limitedCoords.map(coord => `${coord[0]},${coord[1]}`).join(';');

            // Make request to Mapbox Directions API
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&access_token=${mapboxgl.accessToken}`
            );

            if (!response.ok) {
                throw new Error(`Directions API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                return data.routes[0].geometry.coordinates;
            } else {
                return null;
            }

        } catch (error) {
            console.warn('Mini map directions request failed:', error);
            return null;
        }
    }

    scrollToAgent(agentType) {
        const element = document.getElementById(`agent-${agentType}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    closeResultsOverlay() {
        const overlay = document.getElementById('resultsOverlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }

    exportToGoogleMaps() {
        if (!this.currentRoute) {
            this.showError('Please generate a route first');
            return;
        }

        try {
            const waypoints = this.extractWaypoints(this.currentRoute);
            const destination = this.currentRoute.destination;

            // Create Google Maps URL with waypoints
            const origin = 'Aix-en-Provence, France';
            const waypointCoords = waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|');

            let googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}`;

            if (waypointCoords) {
                // Add waypoints
                waypoints.forEach(wp => {
                    googleMapsUrl += `/${encodeURIComponent(wp.name)}`;
                });
            }

            googleMapsUrl += `/${encodeURIComponent(destination)}`;

            // Open in new tab
            window.open(googleMapsUrl, '_blank');

        } catch (error) {
            console.error('Error exporting to Google Maps:', error);
            this.showError('Could not export to Google Maps. Please try again.');
        }
    }

    exportToWaze() {
        if (!this.currentRoute) {
            this.showError('Please generate a route first');
            return;
        }

        try {
            const waypoints = this.extractWaypoints(this.currentRoute);
            const destination = this.currentRoute.destination;

            // Waze doesn't support multiple waypoints well, so we'll create a route to the final destination
            // and show a message about waypoints
            if (waypoints.length > 0) {
                const waypointNames = waypoints.map(wp => wp.name).join(', ');
                const confirmMessage = `Waze will navigate directly to ${destination}.\n\nPlanned stops along the way: ${waypointNames}\n\nContinue?`;

                if (!confirm(confirmMessage)) {
                    return;
                }
            }

            // Create Waze URL to final destination
            const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(destination)}&navigate=yes`;

            // Open in new tab
            window.open(wazeUrl, '_blank');

        } catch (error) {
            console.error('Error exporting to Waze:', error);
            this.showError('Could not export to Waze. Please try again.');
        }
    }

    /**
     * Set up listener for route updates from the RouteAgent
     */
    setupRouteUpdateListener() {
        window.addEventListener('routeUpdated', (event) => {
            if (event.detail && event.detail.route) {
                this.currentRoute = event.detail.route;
                this.displayCurrentRoute();
                this.refreshMapWithNewRoute();
            }
        });
    }

    /**
     * Display the current route information
     */
    displayCurrentRoute() {
        if (this.currentRoute) {
            // Update route agent with new route
            this.routeAgent.setCurrentRoute(this.currentRoute);
            // Refresh route display
            this.displayRouteResults(this.currentRoute);
        }
    }

    /**
     * Refresh map with new route data
     */
    refreshMapWithNewRoute() {
        if (this.currentRoute && this.currentRoute.route) {
            // Clear existing markers and routes
            this.clearMapLayers();

            // Add new route to map
            const waypoints = this.extractWaypoints(this.currentRoute);
            this.addMarkersAndRoute(waypoints, this.currentRoute.destination);
        }
    }

    /**
     * Clear existing map layers (routes and waypoint markers)
     */
    clearMapLayers() {
        if (!this.map) {
            console.log('Map not available, skipping layer cleanup');
            return;
        }

        // Remove route layer if it exists
        if (this.map.getLayer('route')) {
            this.map.removeLayer('route');
        }
        if (this.map.getSource('route')) {
            this.map.removeSource('route');
        }

        // Remove waypoint markers (keep origin marker)
        const markers = document.querySelectorAll('.mapboxgl-marker:not(.origin-marker)');
        markers.forEach(marker => marker.remove());
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔥 DOM loaded, creating RoadTripPlanner...');
    window.planner = new RoadTripPlanner();
    console.log('🔥 RoadTripPlanner created and assigned to window.planner');
});