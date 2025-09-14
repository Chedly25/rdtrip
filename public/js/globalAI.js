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

            // Try to get route data from URL params or localStorage
            const urlParams = new URLSearchParams(window.location.search);
            const routeDataParam = urlParams.get('routeData');

            if (routeDataParam) {
                this.currentRoute = JSON.parse(decodeURIComponent(routeDataParam));
            } else {
                // Try localStorage
                const storedRoute = localStorage.getItem('currentRoute');
                if (storedRoute) {
                    this.currentRoute = JSON.parse(storedRoute);
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

            console.log('📍 Spotlight page context loaded:', this.pageContext);
        } catch (error) {
            console.warn('Error loading spotlight context:', error);
        }
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
                    welcomeMessage = `Hi! I can see you're viewing a detailed route. 🗺️\n\nI have full context about this route and can help you:\n• **Modify stops** - Replace cities you've been to\n• **Optimize the route** - Rearrange for efficiency\n• **Add activities** - Find things to do in each city\n• **Adjust itinerary** - Change timing or add stops\n\nWhat would you like to adjust about this route?`;
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
                    const response = await this.routeAgent.processMessage(contextualMessage, this.currentRoute);
                    this.removeAiMessage(loadingId);
                    await this.handleAgentResponse(response);
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
                this.addAiMessage('assistant', 'Sorry, I encountered an error. Please try again.');
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
        switch (response.type) {
            case 'replacement_proposal':
            case 'replacement_executed':
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
}

// Initialize global AI assistant when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.globalAI = new GlobalAIAssistant();
});

export { GlobalAIAssistant };