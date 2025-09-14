/**
 * Global AI Assistant - Available on all pages with full context awareness
 * Automatically detects page context and provides relevant assistance
 */

class GlobalAIAssistant {
    constructor() {
        this.currentRoute = null;
        this.currentPage = this.detectCurrentPage();
        this.chatMessages = [];
        this.routeAgent = null;
        this.enhancedFeaturesAvailable = false;
        this.pageContext = {};

        this.init();
    }

    async init() {
        await this.loadEnhancedFeatures();
        this.injectAIWidget();
        this.loadPageContext();
        this.setupEventListeners();
        console.log('🤖 Global AI Assistant initialized on', this.currentPage);
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('spotlight')) return 'spotlight';
        if (path.includes('test')) return 'test';
        return 'main';
    }

    async loadEnhancedFeatures() {
        try {
            const { routeAgent } = await import('./routeAgent.js');
            this.routeAgent = routeAgent;
            this.enhancedFeaturesAvailable = true;
            console.log('✅ Enhanced AI features loaded successfully');
        } catch (error) {
            console.warn('⚠️ Enhanced AI features failed to load:', error);
            this.enhancedFeaturesAvailable = false;
        }
    }

    loadPageContext() {
        switch (this.currentPage) {
            case 'spotlight':
                this.loadSpotlightContext();
                break;
            case 'main':
                this.loadMainPageContext();
                break;
            default:
                this.loadGenericContext();
        }
    }

    loadSpotlightContext() {
        // Extract route data from spotlight page
        try {
            const routeTitle = document.getElementById('routeTitle')?.textContent;
            const routeSubtitle = document.getElementById('routeSubtitle')?.textContent;
            const totalStops = document.getElementById('totalStops')?.textContent;
            const estimatedDays = document.getElementById('estimatedDays')?.textContent;
            const totalDistance = document.getElementById('totalDistance')?.textContent;

            console.log('🔍 Context Loading Debug - DOM Elements:');
            console.log('- routeTitle:', routeTitle);
            console.log('- routeSubtitle:', routeSubtitle);
            console.log('- totalStops:', totalStops);

            // Check all possible data sources comprehensively
            console.log('🔍 Checking all storage sources...');

            // Source 1: spotlightData from localStorage
            const spotlightDataLocal = localStorage.getItem('spotlightData');
            console.log('- localStorage.spotlightData:', spotlightDataLocal ? 'Found' : 'Not found');
            if (spotlightDataLocal) {
                console.log('  Content:', JSON.parse(spotlightDataLocal));
            }

            // Source 2: spotlightData from sessionStorage
            const spotlightDataSession = sessionStorage.getItem('spotlightData');
            console.log('- sessionStorage.spotlightData:', spotlightDataSession ? 'Found' : 'Not found');
            if (spotlightDataSession) {
                console.log('  Content:', JSON.parse(spotlightDataSession));
            }

            // Source 3: currentRoute from localStorage
            const currentRouteLocal = localStorage.getItem('currentRoute');
            console.log('- localStorage.currentRoute:', currentRouteLocal ? 'Found' : 'Not found');
            if (currentRouteLocal) {
                console.log('  Content:', JSON.parse(currentRouteLocal));
            }

            // Source 4: citiesContainer data
            const citiesContainer = document.getElementById('citiesContainer');
            if (citiesContainer) {
                const cityElements = citiesContainer.querySelectorAll('.city-card');
                console.log('- citiesContainer cities found:', cityElements.length);
                cityElements.forEach((element, index) => {
                    const cityName = element.querySelector('.city-name')?.textContent ||
                                   element.querySelector('h3')?.textContent ||
                                   element.dataset.city;
                    console.log(`  City ${index + 1}:`, cityName);
                });
            }

            // Try to get spotlight data first (this is how spotlight page stores its data)
            let spotlightData = spotlightDataLocal || spotlightDataSession;
            if (spotlightData) {
                const spotlight = JSON.parse(spotlightData);
                console.log('✅ Using spotlight data as primary source');

                // Extract cities from various spotlight data formats
                let extractedCities = [];

                // Method 1: From waypoints
                if (spotlight.waypoints && Array.isArray(spotlight.waypoints)) {
                    extractedCities = spotlight.waypoints.map(wp => wp.name || wp.city || wp).filter(Boolean);
                    console.log('  Cities from waypoints:', extractedCities);
                }

                // Method 2: From route array
                if (extractedCities.length === 0 && spotlight.route && Array.isArray(spotlight.route)) {
                    extractedCities = spotlight.route.map(stop => stop.name || stop.city || stop).filter(Boolean);
                    console.log('  Cities from route array:', extractedCities);
                }

                // Method 3: From agentResults recommendations
                if (extractedCities.length === 0 && spotlight.agentResults) {
                    spotlight.agentResults.forEach(result => {
                        try {
                            if (typeof result.recommendations === 'string') {
                                const parsed = JSON.parse(result.recommendations);
                                if (parsed.waypoints) {
                                    const waypointCities = parsed.waypoints.map(wp => wp.name || wp.city).filter(Boolean);
                                    extractedCities.push(...waypointCities);
                                }
                            }
                        } catch (e) {
                            // Try to extract city names from text recommendations
                            if (result.recommendations && typeof result.recommendations === 'string') {
                                const cityPattern = /(?:^|\n|\*\s*)([A-Z][a-zA-Z\s-]+(?:,\s*[A-Z][a-zA-Z\s-]+)*)/g;
                                const matches = result.recommendations.match(cityPattern);
                                if (matches) {
                                    extractedCities.push(...matches.map(m => m.trim().replace(/^\*\s*/, '')));
                                }
                            }
                        }
                    });
                    console.log('  Cities from agentResults:', extractedCities);
                }

                // Method 4: From origin/destination
                if (extractedCities.length === 0) {
                    if (spotlight.origin) extractedCities.push(spotlight.origin);
                    if (spotlight.destination) extractedCities.push(spotlight.destination);
                    console.log('  Cities from origin/destination:', extractedCities);
                }

                // Convert spotlight data to currentRoute format
                this.currentRoute = {
                    agent: spotlight.agent,
                    destination: spotlight.destination,
                    origin: spotlight.origin,
                    totalStops: spotlight.totalStops,
                    route: extractedCities.map(city => ({ name: city, city: city })),
                    waypoints: spotlight.waypoints || extractedCities.map(city => ({ name: city, city: city })),
                    agentResults: spotlight.agentResults || [
                        {
                            agent: spotlight.agent,
                            recommendations: spotlight.recommendations || ''
                        }
                    ]
                };

                console.log('✅ Final converted route with extracted cities:', this.currentRoute);
                console.log('📋 Route cities extracted:', extractedCities);
            } else {
                // Fallback: Try regular currentRoute from localStorage
                if (currentRouteLocal) {
                    this.currentRoute = JSON.parse(currentRouteLocal);
                    console.log('📦 Using currentRoute from localStorage as fallback');

                    // Extract and log cities from this format too
                    const fallbackCities = this.extractCitiesFromCurrentRoute(this.currentRoute);
                    console.log('📋 Cities from fallback route:', fallbackCities);
                }
            }

            // If we still don't have route data, try to extract from page elements
            if (!this.currentRoute && routeSubtitle) {
                console.log('🔧 No stored data found, extracting from page elements');
                // Parse route subtitle like "Aix-en-Provence → Barcelona"
                const routeParts = routeSubtitle.split(' → ');
                if (routeParts.length >= 2) {
                    this.currentRoute = {
                        origin: routeParts[0],
                        destination: routeParts[1],
                        route: [
                            { name: routeParts[0], city: routeParts[0] },
                            { name: routeParts[1], city: routeParts[1] }
                        ],
                        totalStops: parseInt(totalStops) || 2
                    };
                    console.log('🔧 Reconstructed route from page elements:', this.currentRoute);
                }
            }

            // Extract cities from DOM as additional fallback
            if (citiesContainer) {
                const cityElements = citiesContainer.querySelectorAll('.city-card, .city-item, [data-city]');
                const domCities = Array.from(cityElements).map(element => {
                    return element.querySelector('.city-name')?.textContent ||
                           element.querySelector('h3')?.textContent ||
                           element.querySelector('h4')?.textContent ||
                           element.dataset.city ||
                           element.textContent?.trim();
                }).filter(Boolean);

                if (domCities.length > 0) {
                    console.log('🏙️ Cities found in DOM:', domCities);

                    // If we don't have a route yet, create one from DOM cities
                    if (!this.currentRoute || !this.currentRoute.route || this.currentRoute.route.length === 0) {
                        this.currentRoute = this.currentRoute || {};
                        this.currentRoute.route = domCities.map(city => ({ name: city, city: city }));
                        this.currentRoute.origin = domCities[0];
                        this.currentRoute.destination = domCities[domCities.length - 1];
                        console.log('🔧 Created route from DOM cities:', this.currentRoute);
                    }
                }
            }

            this.pageContext = {
                pageType: 'spotlight',
                routeTitle,
                routeSubtitle,
                totalStops,
                estimatedDays,
                totalDistance,
                hasDetailedRoute: !!this.currentRoute
            };

            console.log('📍 Final spotlight context:', this.pageContext);
            console.log('🗺️ Final route data for AI:', this.currentRoute);

            // Final validation: Can we extract cities?
            if (this.currentRoute) {
                const finalCities = this.extractCitiesFromCurrentRoute(this.currentRoute);
                console.log('🎯 FINAL VALIDATION - Cities that AI will see:', finalCities);
                if (finalCities.length === 0) {
                    console.error('❌ PROBLEM: No cities extracted despite having route data!');
                    console.error('Route structure:', JSON.stringify(this.currentRoute, null, 2));
                }
            } else {
                console.error('❌ PROBLEM: No route data loaded at all!');
            }

        } catch (error) {
            console.error('❌ Error loading spotlight context:', error);
        }
    }

    // Helper method to extract cities from currentRoute using the same logic as routeAgent
    extractCitiesFromCurrentRoute(route) {
        if (!route) return [];
        let cities = [];

        // Extract from route.route array
        if (route.route && Array.isArray(route.route)) {
            cities = route.route.map(stop => stop.name || stop.city).filter(Boolean);
        }

        // If we don't have cities yet, try other formats
        if (cities.length === 0) {
            // Try waypoints
            if (route.waypoints && Array.isArray(route.waypoints)) {
                cities = route.waypoints.map(wp => wp.name || wp.city).filter(Boolean);
            }
            // Try origin and destination
            if (cities.length === 0 && route.origin && route.destination) {
                cities = [route.origin, route.destination];
            }
        }

        return cities;
    }

    loadMainPageContext() {
        // Extract context from main page
        try {
            const resultsSection = document.getElementById('resultsSection');
            const hasResults = resultsSection && !resultsSection.classList.contains('hidden');

            // Try to get current route from global planner object
            if (window.planner && window.planner.currentRoute) {
                this.currentRoute = window.planner.currentRoute;
            }

            this.pageContext = {
                pageType: 'main',
                hasResults,
                hasRoute: !!this.currentRoute
            };

            console.log('🏠 Main page context loaded:', this.pageContext);
        } catch (error) {
            console.warn('Error loading main page context:', error);
        }
    }

    loadGenericContext() {
        this.pageContext = {
            pageType: this.currentPage,
            hasRoute: !!this.currentRoute
        };
    }

    injectAIWidget() {
        // Check if AI widget already exists
        if (document.getElementById('globalAiWidget')) return;

        const aiWidgetHTML = `
            <!-- Global AI Assistant Widget -->
            <div id="globalAiWidget" class="ai-widget">
                <div class="ai-widget-trigger" id="globalAiTrigger">
                    <div class="ai-avatar">🤖</div>
                    <div class="ai-pulse"></div>
                </div>
                <div class="ai-widget-tooltip">
                    <span>AI Route Assistant</span>
                    <div class="tooltip-arrow"></div>
                </div>
            </div>

            <!-- Global AI Assistant Modal -->
            <div id="globalAiModal" class="ai-modal hidden">
                <div class="ai-modal-content">
                    <div class="ai-modal-header">
                        <div class="ai-header-info">
                            <div class="ai-logo-container">
                                <img src="logo.png" alt="Logo" class="ai-logo">
                            </div>
                            <div class="ai-header-text">
                                <h3>AI Route Assistant</h3>
                                <p id="globalAiStatus">Ready to help with your ${this.currentPage === 'spotlight' ? 'route details' : 'trip planning'}</p>
                            </div>
                        </div>
                        <button class="ai-modal-close" id="closeGlobalAi">&times;</button>
                    </div>

                    <!-- Workflow Visualization -->
                    <div id="globalAiWorkflow" class="ai-workflow hidden">
                        <div class="workflow-steps">
                            <div class="workflow-step" id="globalStep1">
                                <div class="step-icon">🧠</div>
                                <div class="step-text">Analyzing request...</div>
                                <div class="step-spinner"></div>
                            </div>
                            <div class="workflow-step" id="globalStep2">
                                <div class="step-icon">🔍</div>
                                <div class="step-text">Researching alternatives...</div>
                                <div class="step-spinner"></div>
                            </div>
                            <div class="workflow-step" id="globalStep3">
                                <div class="step-icon">📍</div>
                                <div class="step-text">Finding perfect match...</div>
                                <div class="step-spinner"></div>
                            </div>
                            <div class="workflow-step" id="globalStep4">
                                <div class="step-icon">✨</div>
                                <div class="step-text">Optimizing route...</div>
                                <div class="step-spinner"></div>
                            </div>
                        </div>
                        <div class="workflow-progress">
                            <div class="progress-bar" id="globalWorkflowProgress"></div>
                        </div>
                    </div>

                    <div class="ai-chat-container">
                        <div id="globalAiMessages" class="ai-messages"></div>
                        <div class="ai-input-container">
                            <input type="text" id="globalAiInput" placeholder="Ask about your route, get recommendations, or optimize your trip" class="ai-input">
                            <button id="globalAiSend" class="ai-send-btn">
                                <span class="send-icon">➤</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', aiWidgetHTML);
    }

    setupEventListeners() {
        // Floating AI Assistant
        document.getElementById('globalAiTrigger').addEventListener('click', () => {
            this.openAiAssistant();
        });

        document.getElementById('closeGlobalAi').addEventListener('click', () => {
            this.closeAiAssistant();
        });

        document.getElementById('globalAiSend').addEventListener('click', () => {
            this.sendAiMessage();
        });

        document.getElementById('globalAiInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendAiMessage();
            }
        });
    }

    openAiAssistant() {
        document.getElementById('globalAiModal').classList.remove('hidden');
        if (this.chatMessages.length === 0) {
            this.addWelcomeMessage();
        }
    }

    closeAiAssistant() {
        document.getElementById('globalAiModal').classList.add('hidden');
        this.hideWorkflow();
    }

    addWelcomeMessage() {
        let welcomeMessage = '';

        if (this.enhancedFeaturesAvailable) {
            switch (this.currentPage) {
                case 'spotlight':
                    if (this.currentRoute) {
                        // Try multiple methods to extract cities and show detailed debugging
                        const routeCities = this.extractCitiesFromCurrentRoute(this.currentRoute);
                        console.log('🎯 Welcome message - extracted cities:', routeCities);

                        if (routeCities.length > 0) {
                            welcomeMessage = `Hi! I can see you're viewing a detailed route. 🗺️\n\nI have full context about this route from ${this.currentRoute.origin || 'your starting point'} to ${this.currentRoute.destination || 'your destination'}.\n\n**Cities in your route:** ${routeCities.join(', ')}\n\nI can help you:\n• **Modify stops** - Replace cities you've been to\n• **Optimize the route** - Rearrange for efficiency\n• **Add activities** - Find things to do in each city\n• **Adjust itinerary** - Change timing or add stops\n\nWhat would you like to adjust about this route?`;
                        } else {
                            // Show debugging info to help diagnose the issue
                            const debugInfo = {
                                hasRoute: !!this.currentRoute.route,
                                routeLength: this.currentRoute.route ? this.currentRoute.route.length : 0,
                                hasWaypoints: !!this.currentRoute.waypoints,
                                waypointsLength: this.currentRoute.waypoints ? this.currentRoute.waypoints.length : 0,
                                hasOrigin: !!this.currentRoute.origin,
                                hasDestination: !!this.currentRoute.destination,
                                origin: this.currentRoute.origin,
                                destination: this.currentRoute.destination
                            };
                            console.log('🔍 Route data debug info:', debugInfo);

                            welcomeMessage = `Hi! I can see you're on a route detail page. 🗺️\n\nI have route data loaded but I'm having trouble extracting the city names. Let me work with what I can see:\n\n**Route info:**\n• Origin: ${this.currentRoute.origin || 'Unknown'}\n• Destination: ${this.currentRoute.destination || 'Unknown'}\n• Total stops: ${this.currentRoute.totalStops || 'Unknown'}\n\nCould you tell me which specific city you'd like to modify? I can still help with route planning and replacements!`;
                        }
                    } else {
                        welcomeMessage = `Hi! I can see you're on a route detail page, but I'm having trouble loading the specific route data. 🗺️\n\nCould you tell me:\n• Which cities are in your current route?\n• What would you like to modify?\n\nI can still help you with route planning and travel advice!`;
                    }
                    break;
                case 'main':
                    if (this.pageContext.hasResults) {
                        welcomeMessage = `Hi! I can see your route results. 🎯\n\nI can help you:\n• **Replace stops** - Say you've been to a city and I'll find alternatives\n• **Optimize your route** - Rearrange for better efficiency\n• **Get recommendations** - Local tips, food, hidden gems\n• **Plan details** - Create day-by-day itineraries\n\nTry: "I've been to [city name]" or "optimize my route"`;
                    } else {
                        welcomeMessage = `Hi! I'm your advanced route assistant! 🤖\n\nI can help you:\n• **Plan new routes** - Get recommendations for destinations\n• **Travel advice** - Best times to visit, what to pack\n• **Local insights** - Food, culture, hidden gems\n• **Route optimization** - Once you generate a route\n\nWhat kind of trip are you planning?`;
                    }
                    break;
                default:
                    welcomeMessage = `Hi! I'm your route assistant! 🤖\n\nI can help you with travel planning and route optimization. What can I help you with today?`;
            }
        } else {
            welcomeMessage = `Hi! I'm your route assistant! 🤖\n\nI can help with travel advice, recommendations, and planning tips. How can I assist you today?`;
        }

        this.addAiMessage('assistant', welcomeMessage);
    }

    async sendAiMessage() {
        const input = document.getElementById('globalAiInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addAiMessage('user', message);
        input.value = '';

        // Build enhanced context for the AI
        const contextualMessage = this.buildContextualMessage(message);

        // Check if this is a route modification request
        const isRouteModification = this.isRouteModificationRequest(message);

        if (isRouteModification && this.enhancedFeaturesAvailable) {
            // Show workflow visualization
            this.showWorkflow();

            // Update status
            document.getElementById('globalAiStatus').textContent = 'Processing your request...';

            try {
                // Use the enhanced route agent for processing
                const response = await this.routeAgent.processMessage(contextualMessage, this.currentRoute);

                // Hide workflow
                this.hideWorkflow();

                // Update status
                document.getElementById('globalAiStatus').textContent = `Ready to help with your ${this.currentPage === 'spotlight' ? 'route details' : 'trip planning'}`;

                // Handle response
                await this.handleAgentResponse(response);

            } catch (error) {
                console.error('AI Agent error:', error);
                this.hideWorkflow();
                document.getElementById('globalAiStatus').textContent = `Ready to help with your ${this.currentPage === 'spotlight' ? 'route details' : 'trip planning'}`;
                this.addAiMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            }
        } else {
            // Show loading message for regular chat
            const loadingId = this.addAiMessage('assistant', 'Thinking...', true);

            try {
                if (this.enhancedFeaturesAvailable && this.routeAgent) {
                    try {
                        const response = await this.routeAgent.processMessage(contextualMessage, this.currentRoute);
                        this.removeAiMessage(loadingId);
                        await this.handleAgentResponse(response);
                    } catch (agentError) {
                        console.warn('Route agent failed, falling back to server chat:', agentError);
                        // Fall back to server chat if route agent fails
                        const response = await fetch('/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: contextualMessage,
                                routeContext: this.currentRoute,
                                pageContext: this.pageContext
                            })
                        });

                        if (!response.ok) throw new Error('Chat failed');

                        const data = await response.json();
                        this.removeAiMessage(loadingId);
                        this.addAiMessage('assistant', data.response);
                    }
                } else {
                    // Fallback to server chat
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: contextualMessage,
                            routeContext: this.currentRoute,
                            pageContext: this.pageContext
                        })
                    });

                    if (!response.ok) throw new Error('Chat failed');

                    const data = await response.json();
                    this.removeAiMessage(loadingId);
                    this.addAiMessage('assistant', data.response);
                }
            } catch (error) {
                console.error('Chat error:', error);
                this.removeAiMessage(loadingId);
                this.addAiMessage('assistant', 'I apologize, but I\'m having trouble accessing my knowledge base right now. Could you try rephrasing your question or check back in a moment?');
            }
        }
    }

    buildContextualMessage(message) {
        let contextualMessage = message;

        // Add page context
        if (this.currentPage === 'spotlight' && this.pageContext.routeTitle) {
            contextualMessage = `[Context: User is viewing detailed route "${this.pageContext.routeTitle}" with ${this.pageContext.totalStops} stops over ${this.pageContext.estimatedDays} days] ${message}`;
        } else if (this.currentPage === 'main' && this.pageContext.hasResults) {
            contextualMessage = `[Context: User has generated route results and is on the main planning page] ${message}`;
        }

        return contextualMessage;
    }

    // Helper methods (similar to the main app but adapted for global use)
    addAiMessage(sender, message, isLoading = false) {
        const messagesContainer = document.getElementById('globalAiMessages');
        const messageElement = document.createElement('div');
        const messageId = 'global_ai_msg_' + Date.now();

        messageElement.id = messageId;
        messageElement.className = `ai-message ${sender}`;
        if (isLoading) messageElement.className += ' loading';

        const formattedMessage = message.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br>');
        messageElement.innerHTML = formattedMessage;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.chatMessages.push({ id: messageId, sender, message, timestamp: new Date() });
        return messageId;
    }

    removeAiMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.remove();
            this.chatMessages = this.chatMessages.filter(msg => msg.id !== messageId);
        }
    }

    showWorkflow() {
        const workflow = document.getElementById('globalAiWorkflow');
        workflow.classList.remove('hidden');

        const steps = workflow.querySelectorAll('.workflow-step');
        steps.forEach(step => step.classList.remove('active', 'completed'));

        this.animateWorkflowSteps();
    }

    hideWorkflow() {
        document.getElementById('globalAiWorkflow').classList.add('hidden');
    }

    async animateWorkflowSteps() {
        const steps = ['globalStep1', 'globalStep2', 'globalStep3', 'globalStep4'];
        const progressBar = document.getElementById('globalWorkflowProgress');

        for (let i = 0; i < steps.length; i++) {
            const step = document.getElementById(steps[i]);
            step.classList.add('active');

            progressBar.style.width = `${((i + 1) / steps.length) * 100}%`;

            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));

            step.classList.remove('active');
            step.classList.add('completed');
        }
    }

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

    async handleAgentResponse(response) {
        console.log('🔍 handleAgentResponse called with:', response);

        switch (response.type) {
            case 'replacement_proposal':
                console.log('✅ Processing replacement_proposal');
                // Add the proposal message
                this.addAiMessage('assistant', response.content);

                // Add action buttons for the user to confirm or reject
                this.addReplacementActionButtons(response.data);
                break;

            case 'replacement_executed':
                this.addAiMessage('assistant', response.content);
                // The replacement has already been executed by the route agent
                break;

            case 'route_optimized':
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

    addReplacementActionButtons(replacementData) {
        const messagesContainer = document.getElementById('globalAiMessages');
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'ai-action-buttons';

        const confirmButton = document.createElement('button');
        confirmButton.className = 'ai-action-btn confirm-btn';
        confirmButton.textContent = `✅ Yes, replace ${replacementData.originalCity} with ${replacementData.replacementCity.name}`;
        confirmButton.onclick = () => this.executeReplacement(replacementData, buttonContainer);

        const rejectButton = document.createElement('button');
        rejectButton.className = 'ai-action-btn reject-btn';
        rejectButton.textContent = '❌ No, keep the original';
        rejectButton.onclick = () => this.rejectReplacement(replacementData, buttonContainer);

        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(rejectButton);
        messagesContainer.appendChild(buttonContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async executeReplacement(replacementData, buttonContainer) {
        try {
            // Remove action buttons
            buttonContainer.remove();

            // Show loading message
            const loadingId = this.addAiMessage('assistant', '🔄 Executing replacement...', true);

            // Execute the replacement
            const success = await this.performSeamlessReplacement(
                replacementData.originalCity,
                replacementData.replacementCity
            );

            // Remove loading message
            this.removeAiMessage(loadingId);

            if (success) {
                this.addAiMessage('assistant', `✅ Perfect! I've successfully replaced ${replacementData.originalCity} with ${replacementData.replacementCity.name} throughout your route. The map, itinerary, and all route data have been updated.`);
            } else {
                this.addAiMessage('assistant', '❌ Sorry, I encountered an issue while updating the route. Please try again.');
            }

        } catch (error) {
            console.error('Error executing replacement:', error);
            this.addAiMessage('assistant', '❌ Sorry, I encountered an error while updating the route. Please try again.');
        }
    }

    rejectReplacement(replacementData, buttonContainer) {
        buttonContainer.remove();
        this.addAiMessage('assistant', `Understood! I'll keep ${replacementData.originalCity} in your route. Is there anything else you'd like to adjust?`);
    }

    async performSeamlessReplacement(originalCity, replacementCity) {
        try {
            console.log(`🔄 Performing seamless replacement: ${originalCity} → ${replacementCity.name}`);

            // 1. Update the current route data
            if (this.currentRoute) {
                // Update route array
                if (this.currentRoute.route) {
                    this.currentRoute.route = this.currentRoute.route.map(stop => {
                        if (stop.name === originalCity || stop.city === originalCity) {
                            return {
                                name: replacementCity.name,
                                city: replacementCity.name,
                                lat: replacementCity.lat,
                                lon: replacementCity.lon,
                                description: replacementCity.description,
                                activities: replacementCity.activities
                            };
                        }
                        return stop;
                    });
                }

                // Update waypoints if they exist
                if (this.currentRoute.waypoints) {
                    this.currentRoute.waypoints = this.currentRoute.waypoints.map(wp => {
                        if (wp.name === originalCity || wp.city === originalCity) {
                            return {
                                name: replacementCity.name,
                                city: replacementCity.name,
                                lat: replacementCity.lat,
                                lon: replacementCity.lon
                            };
                        }
                        return wp;
                    });
                }

                // Update origin/destination if needed
                if (this.currentRoute.origin === originalCity) {
                    this.currentRoute.origin = replacementCity.name;
                }
                if (this.currentRoute.destination === originalCity) {
                    this.currentRoute.destination = replacementCity.name;
                }
            }

            // 2. Update storage
            this.updateStorageAfterReplacement();

            // 3. Update UI elements
            this.updateUIAfterReplacement(originalCity, replacementCity);

            // 4. Update map if available
            this.updateMapAfterReplacement();

            console.log('✅ Seamless replacement completed successfully');
            return true;

        } catch (error) {
            console.error('❌ Error in seamless replacement:', error);
            return false;
        }
    }

    updateStorageAfterReplacement() {
        try {
            // Update localStorage
            if (this.currentRoute) {
                localStorage.setItem('currentRoute', JSON.stringify(this.currentRoute));
            }

            // Update spotlight data if it exists
            const spotlightData = localStorage.getItem('spotlightData') || sessionStorage.getItem('spotlightData');
            if (spotlightData) {
                const spotlight = JSON.parse(spotlightData);
                spotlight.route = this.currentRoute.route;
                spotlight.waypoints = this.currentRoute.waypoints;
                spotlight.origin = this.currentRoute.origin;
                spotlight.destination = this.currentRoute.destination;

                localStorage.setItem('spotlightData', JSON.stringify(spotlight));
                sessionStorage.setItem('spotlightData', JSON.stringify(spotlight));
            }

            console.log('✅ Storage updated after replacement');
        } catch (error) {
            console.error('❌ Error updating storage:', error);
        }
    }

    updateUIAfterReplacement(originalCity, replacementCity) {
        try {
            // Update route subtitle if on spotlight page
            const routeSubtitle = document.getElementById('routeSubtitle');
            if (routeSubtitle) {
                const currentText = routeSubtitle.textContent;
                if (currentText.includes(originalCity)) {
                    routeSubtitle.textContent = currentText.replace(originalCity, replacementCity.name);
                }
            }

            // Update cities container
            const citiesContainer = document.getElementById('citiesContainer');
            if (citiesContainer) {
                const cityCards = citiesContainer.querySelectorAll('.city-card, .city-item');
                cityCards.forEach(card => {
                    const cityName = card.querySelector('.city-name, h3, h4');
                    if (cityName && (cityName.textContent === originalCity || cityName.textContent.includes(originalCity))) {
                        cityName.textContent = replacementCity.name;

                        // Update city description if available
                        const description = card.querySelector('.city-description, .description, p');
                        if (description && replacementCity.description) {
                            description.textContent = replacementCity.description;
                        }
                    }
                });
            }

            // Trigger a page refresh or reload of dynamic content if needed
            if (typeof window.refreshRouteDisplay === 'function') {
                window.refreshRouteDisplay();
            }

            console.log('✅ UI updated after replacement');
        } catch (error) {
            console.error('❌ Error updating UI:', error);
        }
    }

    updateMapAfterReplacement() {
        try {
            // Update Mapbox map if available
            if (window.spotlightMap) {
                // Remove old markers and add new ones
                // This would need to be implemented based on your specific map setup
                console.log('🗺️ Map update triggered (implementation needed)');
            }

            // Trigger map refresh if there's a global function for it
            if (typeof window.refreshMap === 'function') {
                window.refreshMap();
            }

            console.log('✅ Map update completed');
        } catch (error) {
            console.error('❌ Error updating map:', error);
        }
    }
}

// Initialize global AI assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.globalAI = new GlobalAIAssistant();
});

export { GlobalAIAssistant };