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
            
            // Clean up the recommendations text
            let cleanText = agentResult.recommendations;
            
            // Remove JSON markers and backticks
            cleanText = cleanText
                .replace(/```json\s*/g, '')
                .replace(/```\s*$/g, '')
                .replace(/^\s*{\s*"waypoints":/g, '')
                .replace(/}\s*$/g, '');
            
            // Try to extract meaningful content
            let displayText = '';
            try {
                // Try to parse as JSON first
                const parsed = JSON.parse('{' + cleanText + '}');
                if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
                    displayText = parsed.waypoints.map(wp => `${wp.name}: ${wp.description || 'Great destination'}`).join(' • ');
                }
            } catch (e) {
                // Fallback to cleaned text
                displayText = cleanText
                    .replace(/[{}"]/g, '')
                    .replace(/name:\s*/g, '')
                    .replace(/coordinates:\s*\[[^\]]+\]/g, '')
                    .replace(/description:\s*/g, '')
                    .replace(/,\s*,/g, ',')
                    .trim();
            }
            
            // If still too messy, create a friendly message
            if (displayText.length < 10 || displayText.includes('waypoints')) {
                displayText = `Specialized ${agentResult.agent} recommendations for unique stops along your route to Rome.`;
            }
            
            resultsHTML += `
                <div class="route-item" style="border-left-color: ${agentColor}">
                    <div class="route-item-header">
                        <h4>${agentEmoji} ${this.capitalizeFirst(agentResult.agent)} Agent</h4>
                        <button class="view-details-btn" onclick="planner.viewAgentDetails('${agentResult.agent}')">View Details</button>
                    </div>
                    <p>${this.truncateText(displayText, 200)}</p>
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
        return {
            hiddenGems: [
                "Visit local markets early morning for best selection",
                "Ask locals for their favorite neighborhood restaurants",
                "Explore residential areas for authentic experiences",
                "Check community bulletin boards for local events"
            ],
            avoidTraps: [
                "Restaurants with tourist menus in multiple languages",
                "Overpriced souvenir shops near main attractions",
                "Tours that only visit crowded landmarks",
                "Expensive parking near popular sites"
            ],
            photoSpots: [
                "Golden hour at historical monuments",
                "Rooftop bars with city views",
                "Local bridges and waterfront areas",
                "Colorful street art districts"
            ]
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
        // This would implement route drawing on the map
        // For now, we'll skip the complex routing implementation
    }

    viewAgentDetails(agent) {
        // Find the agent's recommendations
        const agentResult = this.currentRoute?.agentResults.find(ar => ar.agent === agent);
        if (agentResult) {
            // Create a simple alert with formatted content
            let content = agentResult.recommendations;
            
            // Clean up the content for display
            content = content
                .replace(/```json\s*/g, '')
                .replace(/```\s*$/g, '')
                .replace(/\n/g, '\n\n'); // Add spacing for readability
            
            alert(`${this.capitalizeFirst(agent)} Agent Recommendations:\n\n${content}`);
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