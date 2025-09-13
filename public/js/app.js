// Enhanced Road Trip Planner App
class RoadTripPlanner {
    constructor() {
        this.map = null;
        this.selectedAgents = ['adventure', 'culture', 'food'];
        this.selectedBudget = 'budget';
        this.currentRoute = null;
        this.chatMessages = [];
        
        this.init();
    }

    init() {
        this.initMap();
        this.setupEventListeners();
    }

    initMap() {
        // Initialize Mapbox map
        mapboxgl.accessToken = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';

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
        // Agent selection buttons
        document.querySelectorAll('.agent-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleAgent(btn));
        });

        // Budget selection buttons
        document.querySelectorAll('.budget-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectBudget(btn));
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

        // PDF download button
        document.getElementById('downloadPdf').addEventListener('click', () => {
            this.downloadPDF();
        });

        // Chat modal controls
        document.getElementById('openChat').addEventListener('click', () => {
            this.openChatModal();
        });

        document.getElementById('closeChatModal').addEventListener('click', () => {
            this.closeChatModal();
        });

        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Close modal on backdrop click
        document.getElementById('chatModal').addEventListener('click', (e) => {
            if (e.target.id === 'chatModal') {
                this.closeChatModal();
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

        // Display route information
        this.displayRouteTimeline(allWaypoints, destinationCoords);
        this.displayBudgetSummary(allWaypoints);
        this.displayLocalTips(allWaypoints, destinationCoords);
        this.displayRouteResults(routeData);

        // Show results section
        document.getElementById('resultsSection').classList.remove('hidden');
    }

    displayRouteTimeline(waypoints, destination) {
        const timelineContainer = document.getElementById('routeTimeline');
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
                // Highlight on map
                this.map.flyTo({
                    center: [waypoint.lng, waypoint.lat],
                    zoom: 10
                });
                
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
            this.map.flyTo({
                center: [destination.lng, destination.lat],
                zoom: 10
            });
            document.querySelectorAll('.timeline-item').forEach(item => item.classList.remove('active'));
            destinationItem.classList.add('active');
        });

        timelineContainer.appendChild(destinationItem);
    }

    displayBudgetSummary(waypoints) {
        const budgetContainer = document.getElementById('budgetSummary');
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
        const resultsContainer = document.getElementById('routeResults');

        let resultsHTML = '';
        routeData.agentResults.forEach(agentResult => {
            const agentEmoji = this.getAgentEmoji(agentResult.agent);
            const agentColor = this.getAgentColor(agentResult.agent);

            let displayText = '';
            let waypointCount = 0;

            try {
                // Clean up and parse the JSON
                let jsonText = agentResult.recommendations;

                // Remove markdown code blocks and fix JSON formatting
                jsonText = jsonText
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*$/g, '')
                    .trim();

                // Handle malformed JSON by trying to extract just the waypoints section
                if (!jsonText.startsWith('{')) {
                    // Try to find the waypoints section
                    const waypointsMatch = jsonText.match(/"waypoints"\s*:\s*\[[\s\S]*?\]/);
                    if (waypointsMatch) {
                        jsonText = `{${waypointsMatch[0]}}`;
                    }
                }

                // Try to parse the JSON
                const parsed = JSON.parse(jsonText);

                if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
                    waypointCount = parsed.waypoints.length;
                    // Create a readable summary
                    const waypoints = parsed.waypoints.slice(0, 3); // Show first 3 waypoints
                    displayText = waypoints.map(wp => wp.name).join(' → ');

                    if (parsed.waypoints.length > 3) {
                        displayText += ` and ${parsed.waypoints.length - 3} more stops`;
                    }

                    // Add route overview if available
                    if (parsed.route_overview) {
                        displayText += '. ' + parsed.route_overview.substring(0, 150) + '...';
                    } else if (waypoints[0] && waypoints[0].description) {
                        displayText += '. Starting with ' + waypoints[0].description.substring(0, 100) + '...';
                    }
                }
            } catch (e) {
                console.warn('Could not parse agent recommendations for', agentResult.agent, ':', e);

                // Try to extract waypoint names from the raw text as fallback
                try {
                    const nameMatches = agentResult.recommendations.match(/"name"\s*:\s*"([^"]+)"/g);
                    if (nameMatches && nameMatches.length > 0) {
                        const names = nameMatches.map(match => match.match(/"name"\s*:\s*"([^"]+)"/)[1]);
                        displayText = names.slice(0, 3).join(' → ');
                        waypointCount = names.length;

                        if (names.length > 3) {
                            displayText += ` and ${names.length - 3} more stops`;
                        }
                    } else {
                        displayText = `Curated ${agentResult.agent} experiences and hidden gems along your route.`;
                        waypointCount = 3; // Default assumption
                    }
                } catch (fallbackError) {
                    displayText = `Curated ${agentResult.agent} experiences and hidden gems along your route.`;
                    waypointCount = 3; // Default assumption
                }
            }

            // Fallback if no display text
            if (!displayText) {
                displayText = `Discover amazing ${agentResult.agent} destinations and experiences tailored to your journey.`;
            }

            resultsHTML += `
                <div class="route-item" style="border-left-color: ${agentColor}">
                    <div class="route-item-header">
                        <h4>${agentEmoji} ${this.capitalizeFirst(agentResult.agent)} Agent</h4>
                        <div class="route-item-meta">
                            <span class="waypoint-count">${waypointCount} stops</span>
                            <button class="view-details-btn" onclick="planner.viewAgentDetails('${agentResult.agent}')">View Details</button>
                        </div>
                    </div>
                    <p>${displayText}</p>
                </div>
            `;
        });

        resultsContainer.innerHTML = resultsHTML;
    }

    // Chat functionality
    openChatModal() {
        document.getElementById('chatModal').classList.remove('hidden');
        if (this.chatMessages.length === 0) {
            this.addChatMessage('assistant', "Hi! I'm your route assistant. Ask me anything about your trip, local tips, or travel advice!");
        }
    }

    closeChatModal() {
        document.getElementById('chatModal').classList.add('hidden');
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addChatMessage('user', message);
        input.value = '';

        // Show loading message
        const loadingId = this.addChatMessage('assistant', 'Thinking...', true);

        try {
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
            this.removeChatMessage(loadingId);
            this.addChatMessage('assistant', data.response);
            
        } catch (error) {
            console.error('Chat error:', error);
            this.removeChatMessage(loadingId);
            this.addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
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
            // Show loading
            const btn = document.getElementById('downloadPdf');
            const originalText = btn.textContent;
            btn.textContent = '📄 Generating PDF...';
            btn.disabled = true;

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
            
            // Reset button
            btn.textContent = originalText;
            btn.disabled = false;
            
        } catch (error) {
            console.error('PDF generation error:', error);
            this.showError('Failed to generate PDF. Please try again.');
            
            // Reset button
            const btn = document.getElementById('downloadPdf');
            btn.textContent = '📄 Download PDF';
            btn.disabled = false;
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
                    
                    // Extract location names from the text
                    const locationMatches = cleanedRecommendations.match(/"name":\s*"([^"]+)"/g) || 
                                          cleanedRecommendations.match(/\*\*(.*?)\*\*/g) ||
                                          cleanedRecommendations.match(/(\b[A-Z][a-z]+ [A-Z][a-z]+\b)/g);
                    
                    if (locationMatches) {
                        locationMatches.slice(0, 3).forEach((match, index) => {
                            let name = match.replace(/["*]/g, '').replace(/name:\s*/g, '').trim();
                            if (name.length > 0) {
                                waypoints.push({
                                    name: name,
                                    agent: agentResult.agent,
                                    description: `${this.capitalizeFirst(agentResult.agent)} destination`,
                                    lng: 5.4474 + (Math.random() - 0.5) * 8, // Varied coordinates
                                    lat: 43.5297 + (Math.random() - 0.5) * 4
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
                            waypoints.push({
                                name: waypoint.name,
                                agent: agentResult.agent,
                                description: waypoint.description || `${this.capitalizeFirst(agentResult.agent)} destination`,
                                lng: waypoint.coordinates ? waypoint.coordinates[1] : (5.4474 + (Math.random() - 0.5) * 8),
                                lat: waypoint.coordinates ? waypoint.coordinates[0] : (43.5297 + (Math.random() - 0.5) * 4),
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
                    agent: agentResult.agent,
                    description: `Recommended ${agentResult.agent} stop`,
                    lng: 5.4474 + (Math.random() - 0.5) * 8,
                    lat: 43.5297 + (Math.random() - 0.5) * 4
                });
            }
        });
        
        // Ensure we have at least as many waypoints as requested
        const targetWaypoints = this.currentRoute?.totalStops || 3;
        while (waypoints.length < targetWaypoints) {
            waypoints.push({
                name: `Stop ${waypoints.length + 1}`,
                agent: 'general',
                description: 'Recommended stop along your route',
                lng: 5.4474 + (Math.random() - 0.5) * 8,
                lat: 43.5297 + (Math.random() - 0.5) * 4
            });
        }
        
        return waypoints.slice(0, targetWaypoints);
    }

    getAgentEmoji(agent) {
        const emojis = {
            adventure: '🏔️',
            culture: '🏛️',
            food: '🍽️'
        };
        return emojis[agent] || '📍';
    }

    getAgentColor(agent) {
        const colors = {
            adventure: '#34C759',
            culture: '#FF9500',
            food: '#FF3B30'
        };
        return colors[agent] || '#007AFF';
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.planner = new RoadTripPlanner();
});