import { RouteCalculator } from './routeCalculator.js';
import { aiFeatures } from './aiFeatures.js';
import { TripTypesManager } from './tripTypes.js';
import { animationController } from './animations.js';
import { ParallelAgentSystem } from './parallelAgents.js';
import { UIEnhancements } from './uiEnhancements.js';

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
        this.parallelAgents = new ParallelAgentSystem(this.routeCalculator, aiFeatures);
        this.tripTypesManager = new TripTypesManager(this.routeCalculator, aiFeatures);
        this.agentResults = new Map();
        
        // Performance optimizations - Cache DOM elements
        this.domCache = new Map();
        this.eventListenerCache = new Map();
        this.updateThrottlers = new Map();
        
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
            
            // Cache frequently accessed DOM elements
            this.cacheDOMElements();
            
            // Skip main map initialization since we removed it
            this.setupEventListeners();
            this.setupAutocomplete();
            
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
            if (document.getElementById('destination')) {
                resolve();
            } else {
                setTimeout(() => resolve(this.waitForDOM()), 50);
            }
        });
    }
    
    /**
     * Cache frequently accessed DOM elements for performance
     */
    cacheDOMElements() {
        const elements = {
            destination: document.getElementById('destination'),
            autocomplete: document.getElementById('autocomplete'),
            calculateBtn: document.getElementById('calculate-btn'),
            routeInfo: document.getElementById('route-info'),
            stopsList: document.getElementById('stops-list'),
            totalDistance: document.getElementById('total-distance'),
            totalTime: document.getElementById('total-time'),
            totalStops: document.getElementById('total-stops'),
            aiResults: document.getElementById('ai-results'),
            aiTitle: document.getElementById('ai-title'),
            aiContent: document.getElementById('ai-content'),
            agentsLoadingModal: document.getElementById('agents-loading-modal'),
            overallProgressFill: document.getElementById('overall-progress-fill'),
            overallProgressCount: document.getElementById('overall-progress-count'),
            agentsResultsPage: document.getElementById('agents-results-page'),
            agentsResultsGrid: document.getElementById('agents-results-grid'),
            routeSpotlightPage: document.getElementById('route-spotlight-page')
        };
        
        Object.entries(elements).forEach(([key, element]) => {
            if (element) this.domCache.set(key, element);
        });
    }
    
    /**
     * Get cached DOM element
     */
    getCachedElement(key) {
        return this.domCache.get(key) || document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
    }

    /**
     * Throttle function to prevent excessive DOM updates
     */
    throttle(key, fn, delay = 50) {
        if (this.updateThrottlers.has(key)) {
            clearTimeout(this.updateThrottlers.get(key));
        }
        
        const timeoutId = setTimeout(fn, delay);
        this.updateThrottlers.set(key, timeoutId);
    }

    /**
     * Cleanup method for proper resource disposal
     */
    cleanup() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        // Clear cached DOM elements
        this.domCache.clear();
        
        // Clear event listener cache
        this.eventListenerCache.forEach((listener, element) => {
            if (element && listener) {
                element.removeEventListener(listener.type, listener.fn);
            }
        });
        this.eventListenerCache.clear();
        
        // Clear throttlers
        this.updateThrottlers.clear();
        
        // Main map container was removed, no cleanup needed
        console.log('Main map cleanup skipped - container removed');
        
        // Cleanup animation controller
        if (animationController) {
            animationController.cleanup();
        }
        
        this.routeLayer = null;
        this.markersLayer = null;
        this.currentRoute = null;
    }
    
    /**
     * Initialize Leaflet map
     */
    initializeMap() {
        // Main map was removed for better performance
        // Maps are now only created in spotlight view and agent results
        console.log('Main map initialization skipped - using dedicated maps instead');
        return;
    }
    
    /**
     * Add the starting point marker (Aix-en-Provence)
     */
    addStartingPointMarker() {
        // No longer needed since main map was removed
        console.log('Starting point marker not needed - main map removed');
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
     * Calculate route using parallel agents system for 6 different trip types
     */
    async calculateRoute() {
        const destInput = document.getElementById('destination');
        const destName = destInput.value.trim();
        const calculateBtn = document.getElementById('calculate-btn');
        
        if (!destName) {
            this.showError('Please enter a destination city');
            return;
        }
        
        // Show enhanced loading modal
        this.showAgentsLoadingModal();
        calculateBtn.disabled = true;
        
        try {
            // Find destination city
            let destCity = this.routeCalculator.findCityByName(destName);
            
            if (!destCity) {
                throw new Error('Destination not found. Please select from the suggestions or try a different spelling.');
            }
            
            // Get base route options
            const baseOptions = {
                numStops: document.getElementById('stops-slider').value,
                detourTolerance: document.getElementById('detour-slider').value
            };
            
            // Launch all 6 parallel agents with progress tracking
            console.log('🚀 Launching parallel agents for:', destName);
            this.agentResults = await this.launchAgentsWithProgress('aix-en-provence', destCity.id, baseOptions);
            
            // Use the adventure route as the main display route (first agent result)
            const firstAgentResult = Array.from(this.agentResults.values())[0];
            if (firstAgentResult) {
                this.currentRoute = firstAgentResult.route;
                aiFeatures.setCurrentRoute(firstAgentResult.route);
                
                // Update route info - main map was removed for performance
                this.updateRouteInfo(firstAgentResult.route);
            }
            
            // Hide loading modal and show results page
            this.hideAgentsLoadingModal();
            this.showAgentsResultsPage(destName, this.agentResults);
            
            // Update trip types manager with all results
            this.tripTypesManager.setAllAgentResults(this.agentResults);
            
            // Hide any previous error messages
            this.hideError();
            
        } catch (error) {
            console.error('Parallel agents calculation error:', error);
            this.showError('Failed to calculate routes: ' + error.message);
        } finally {
            // Reset button state
            this.hideAgentsLoadingModal();
            calculateBtn.textContent = '🧭 Calculate Route';
            calculateBtn.disabled = false;
        }
    }
    
    /**
     * Display route on the map (main map removed - display route info only)
     */
    displayRoute(routeData) {
        // Main map was removed for performance - route is displayed in spotlight/agent views
        console.log('Route display called for:', routeData);
        
        const { route } = routeData;
        
        // Main map was removed - route visualization is handled in spotlight and agent views
        console.log('Route visualization skipped - using dedicated maps in spotlight/agent views');
    }
    
    /**
     * Update route information panel
     */
    updateRouteInfo(routeData, agent = null) {
        const { route, totalDistance, totalTime, directDistance, detourFactor, actualDistance, actualTime } = routeData;
        
        // Use actual driving distances/times if available, otherwise use calculated values
        const displayDistance = actualDistance || totalDistance;
        const displayTime = actualTime || totalTime;
        
        // Update statistics
        document.getElementById('total-distance').textContent = displayDistance;
        document.getElementById('total-time').textContent = displayTime;
        document.getElementById('total-stops').textContent = route.length - 2;
        
        // Create enhanced stops list with UIEnhancements
        const stopsList = document.getElementById('stops-list');
        const routeTypeIndicator = routeData.hasDrivingDirections ? 
            '<span style="color: #28a745; font-size: 0.8rem;">🚗 Driving Route</span>' : 
            '<span style="color: #ffc107; font-size: 0.8rem;">📏 Estimated Route</span>';
        
        // Use enhanced route summary if agent is provided
        if (agent) {
            const enhancedSummary = UIEnhancements.createRouteSummaryCard(routeData, agent);
            stopsList.innerHTML = enhancedSummary;
        } else {
            // Fallback to basic display
            stopsList.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0;">Route Stops</h3>
                        ${routeTypeIndicator}
                    </div>
                    <small style="color: #666;">Direct: ${directDistance}km (+${detourFactor}%)</small>
                </div>
            `;
        }
        
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
        
        // Refresh display - only update route info since main map was removed
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
        
        // Show enhanced loading state
        aiResults.classList.add('active');
        aiTitle.innerHTML = `${feature.title} <span class="loading"></span>`;
        aiContent.textContent = 'Loading AI insights...';
        animationController.animateLoading(aiContent, true);
        
        try {
            const result = await aiFeatures[feature.method]();
            
            // Display result with animation
            animationController.animateLoading(aiContent, false);
            aiTitle.textContent = feature.title;
            aiContent.textContent = result;
            
            // Smooth scroll to results
            animationController.smoothScrollTo(aiResults, 100);
            
        } catch (error) {
            console.error('AI Feature Error:', error);
            animationController.animateLoading(aiContent, false);
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
    
    /**
     * Show success message
     */
    showSuccess(message) {
        let successDiv = document.querySelector('.success-message');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.style.cssText = `
                background: #d4edda; 
                color: #155724; 
                padding: 0.75rem 1rem; 
                margin: 1rem 0; 
                border-left: 4px solid #28a745; 
                border-radius: 4px; 
                font-size: 0.9rem;
                display: block;
                animation: slideInDown 0.3s ease-out;
            `;
            document.querySelector('.sidebar').insertBefore(successDiv, document.querySelector('.control-group'));
        }
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (successDiv) {
                successDiv.style.display = 'none';
            }
        }, 5000);
    }
    
    /**
     * Display all trip types with their unique routes
     */
    displayAllTripTypes(agentResults) {
        console.log('🎨 Displaying all trip types results:', agentResults.size);
        
        // Create or update the trip types comparison section
        let comparisonSection = document.getElementById('trip-comparison-section');
        if (!comparisonSection) {
            comparisonSection = document.createElement('div');
            comparisonSection.id = 'trip-comparison-section';
            comparisonSection.className = 'trip-comparison-section';
            comparisonSection.innerHTML = `
                <h3>🤖 AI Agent Results</h3>
                <p>6 specialized agents found unique routes for you:</p>
                <div id="agent-results-grid" class="agent-results-grid"></div>
            `;
            
            // Insert after route info
            const routeInfo = document.querySelector('.route-info');
            if (routeInfo) {
                routeInfo.parentNode.insertBefore(comparisonSection, routeInfo.nextSibling);
            }
        }
        
        const gridContainer = document.getElementById('agent-results-grid');
        gridContainer.innerHTML = '';
        
        // Display each agent's result
        agentResults.forEach((result, agentType) => {
            const agentCard = document.createElement('div');
            agentCard.className = 'agent-result-card';
            agentCard.style.background = result.agent.gradient;
            
            const cities = result.cities.map(c => c.name).slice(0, 3).join(' → ');
            const moreText = result.cities.length > 3 ? `... (+${result.cities.length - 3})` : '';
            
            agentCard.innerHTML = `
                <div class="agent-header">
                    <span class="agent-icon">${result.agent.icon}</span>
                    <div class="agent-info">
                        <h4>${result.agent.name}</h4>
                        <span class="agent-duration">${result.duration}ms</span>
                    </div>
                </div>
                <div class="agent-route-preview">
                    <strong>${cities}${moreText}</strong>
                </div>
                <div class="agent-stats">
                    <span>📏 ${result.route.totalDistance}km</span>
                    <span>⏱️ ${result.route.totalTime}h</span>
                    <span>🏛️ ${result.cities.length - 2} stops</span>
                </div>
                <button class="view-agent-details" data-agent="${agentType}">
                    View Details
                </button>
            `;
            
            // Add click handler to view details
            const viewBtn = agentCard.querySelector('.view-agent-details');
            viewBtn.addEventListener('click', () => this.showAgentDetails(agentType, result));
            
            gridContainer.appendChild(agentCard);
        });
        
        // Show the section
        comparisonSection.style.display = 'block';
    }
    
    /**
     * Show route in full-screen spotlight mode
     */
    showRouteSpotlight(agentType, result) {
        console.log(`🎯 Opening route spotlight for ${result.agent.name}`);
        
        // Hide results page
        document.getElementById('agents-results-page').style.display = 'none';
        
        // Show spotlight page
        const spotlightPage = document.getElementById('route-spotlight-page');
        spotlightPage.style.display = 'block';
        
        // Update agent badge
        const agentBadge = document.getElementById('spotlight-agent-badge');
        agentBadge.innerHTML = `
            <span class="agent-icon">${result.agent.icon}</span>
            <span class="agent-name">${result.agent.name}</span>
        `;
        agentBadge.style.background = result.agent.gradient;
        
        // Update stats
        const statsContainer = document.getElementById('spotlight-stats');
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${result.route.totalDistance}</div>
                <div class="stat-label">Kilometers</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${result.route.totalTime}</div>
                <div class="stat-label">Hours</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${result.cities.length - 2}</div>
                <div class="stat-label">Stops</div>
            </div>
        `;
        
        // Update cities flow
        const citiesContainer = document.getElementById('spotlight-cities');
        citiesContainer.innerHTML = result.cities.map((city, index) => {
            const isLast = index === result.cities.length - 1;
            return `
                <span class="city-badge">${city.name}</span>
                ${!isLast ? '<span class="arrow-separator">→</span>' : ''}
            `;
        }).join('');
        
        // Update itinerary with clean HTML (no markdown)
        const itineraryContainer = document.getElementById('spotlight-itinerary');
        itineraryContainer.innerHTML = result.itinerary || UIEnhancements.getDefaultItinerary();
        
        // Initialize spotlight map
        this.initializeSpotlightMap(result);
        
        // Add back navigation
        document.getElementById('back-from-spotlight').onclick = () => this.hideRouteSpotlight();
    }
    
    /**
     * Hide route spotlight and return to results
     */
    hideRouteSpotlight() {
        document.getElementById('route-spotlight-page').style.display = 'none';
        document.getElementById('agents-results-page').style.display = 'block';
    }
    
    /**
     * Initialize the spotlight map
     */
    initializeSpotlightMap(result) {
        const mapContainer = document.getElementById('spotlight-map');
        
        // Clear any existing map
        mapContainer.innerHTML = '';
        
        try {
            const spotlightMap = L.map('spotlight-map').setView([43.5297, 5.4474], 8);
            
            // Add tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '© OpenStreetMap contributors'
            }).addTo(spotlightMap);
            
            // Add route
            this.displayRouteOnMap(spotlightMap, result.route, result.agent.color);
            
        } catch (error) {
            console.error('Error initializing spotlight map:', error);
            mapContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white;">Map loading...</div>';
        }
    }
    
    /**
     * Display route on specific map instance
     */
    displayRouteOnMap(mapInstance, routeData, color = '#667eea') {
        const { route } = routeData;
        
        // Add markers for each city
        route.forEach((city, index) => {
            const isStart = index === 0;
            const isEnd = index === route.length - 1;
            
            const label = isStart ? 'A' : isEnd ? 'B' : index.toString();
            const markerColor = isStart ? '#28a745' : isEnd ? '#dc3545' : color;
            
            const marker = L.marker([city.lat, city.lon], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background: ${markerColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${label}</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })
            }).addTo(mapInstance);
            
            // Add popup
            marker.bindPopup(`<strong>${city.name}</strong><br>${city.country}`);
        });
        
        // Draw route line (use driving route if available, otherwise straight lines)
        if (routeData.drivingRoute && routeData.drivingRoute.segments) {
            routeData.drivingRoute.segments.forEach(segment => {
                if (segment.geometry && segment.geometry.coordinates) {
                    const leafletCoords = segment.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    L.polyline(leafletCoords, {
                        color: color,
                        weight: 4,
                        opacity: 0.8
                    }).addTo(mapInstance);
                }
            });
        } else {
            // Fallback to straight lines
            const coordinates = route.map(city => [city.lat, city.lon]);
            L.polyline(coordinates, {
                color: color,
                weight: 4,
                opacity: 0.8
            }).addTo(mapInstance);
        }
        
        // Fit map to route
        const bounds = L.latLngBounds(route.map(city => [city.lat, city.lon]));
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
    }

    /**
     * Show detailed view of a specific agent's result
     */
    showAgentDetails(agentType, result) {
        console.log(`📱 Showing details for ${result.agent.name}`);
        
        // Create modal or expanded view
        let modal = document.getElementById('agent-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'agent-details-modal';
            modal.className = 'modal agent-details-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal" id="close-agent-details">&times;</span>
                    <div id="agent-details-content"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add close handler
            document.getElementById('close-agent-details').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        const content = document.getElementById('agent-details-content');
        content.innerHTML = `
            <div class="agent-header-large" style="background: ${result.agent.gradient};">
                <span class="agent-icon-large">${result.agent.icon}</span>
                <div>
                    <h2>${result.agent.name}</h2>
                    <p>${result.agent.description}</p>
                </div>
            </div>
            
            <div class="agent-route-details">
                <h3>🗺️ Route Details</h3>
                <div class="route-cities">
                    ${result.cities.map((city, index) => `
                        <div class="city-stop">
                            <span class="stop-number">${index + 1}</span>
                            <span class="city-name">${city.name}, ${city.country}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="route-stats-detailed">
                    <div class="stat-item">
                        <strong>Distance:</strong> ${result.route.totalDistance}km
                    </div>
                    <div class="stat-item">
                        <strong>Time:</strong> ${result.route.totalTime} hours
                    </div>
                    <div class="stat-item">
                        <strong>Stops:</strong> ${result.cities.length - 2} intermediate
                    </div>
                </div>
            </div>
            
            <div class="agent-itinerary">
                <h3>🎯 ${result.agent.name} Recommendations</h3>
                <div class="itinerary-content">
                    ${UIEnhancements.formatItineraryContent(result.itinerary)}
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="use-this-route" data-agent="${agentType}">
                    Use This Route
                </button>
                <button class="close-modal-btn">Close</button>
            </div>
        `;
        
        // Add action handlers
        content.querySelector('.use-this-route').addEventListener('click', () => {
            this.switchToAgentRoute(agentType, result);
            modal.style.display = 'none';
        });
        
        content.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.style.display = 'block';
    }
    
    /**
     * Switch to using a specific agent's route
     */
    switchToAgentRoute(agentType, result) {
        console.log(`🔄 Switching to ${result.agent.name} route`);
        
        this.currentRoute = result.route;
        aiFeatures.setCurrentRoute(result.route);
        this.tripTypesManager.setCurrentRoute(result.route);
        
        // Main map container was removed for performance
        console.log('Main map container not needed - using dedicated maps only');
        
        // Update display - only route info since main map was removed
        this.updateRouteInfo(result.route);
        
        // Show confirmation
        this.showSuccess(`Switched to ${result.agent.name} route with ${result.cities.length - 2} stops!`);
    }
    
    /**
     * Show the enhanced agents loading modal
     */
    showAgentsLoadingModal() {
        const modal = document.getElementById('agents-loading-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // Reset all progress bars
            const progressBars = modal.querySelectorAll('.progress-bar');
            const overallFill = document.getElementById('overall-progress-fill');
            const overallCount = document.getElementById('overall-progress-count');
            
            progressBars.forEach(bar => bar.style.width = '0%');
            if (overallFill) overallFill.style.width = '0%';
            if (overallCount) overallCount.textContent = '0/6';
            
            // Reset all loading cards
            const loadingCards = modal.querySelectorAll('.agent-loading-card');
            loadingCards.forEach(card => {
                card.classList.remove('active', 'completed');
                const status = card.querySelector('.loading-status');
                if (status) status.textContent = 'Launching...';
            });
        }
    }
    
    /**
     * Hide the agents loading modal
     */
    hideAgentsLoadingModal() {
        const modal = document.getElementById('agents-loading-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Update agent progress in loading modal
     */
    updateAgentProgress(agentType, progress, status) {
        // Throttle updates to prevent excessive DOM manipulation
        this.throttle(`agent-progress-${agentType}`, () => {
            const card = document.querySelector(`[data-agent="${agentType}"]`);
            if (card) {
                const progressBar = card.querySelector('.progress-bar');
                const statusElement = card.querySelector('.loading-status');
                
                // Use standard width property for progress bars
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
                if (statusElement) statusElement.textContent = status;
                
                // Use requestAnimationFrame for smooth class updates
                requestAnimationFrame(() => {
                    card.classList.add('active');
                    if (progress >= 100) {
                        card.classList.add('completed');
                        card.classList.remove('active');
                    }
                });
            }
        }, 100);
    }
    
    /**
     * Update overall progress
     */
    updateOverallProgress(completed, total) {
        // Throttle updates for better performance
        this.throttle('overall-progress', () => {
            const overallFill = this.getCachedElement('overallProgressFill') || document.getElementById('overall-progress-fill');
            const overallCount = this.getCachedElement('overallProgressCount') || document.getElementById('overall-progress-count');
            
            const percentage = (completed / total) * 100;
            
            // Use standard width property for progress bars
            if (overallFill) {
                overallFill.style.width = `${percentage}%`;
            }
            if (overallCount) overallCount.textContent = `${completed}/${total}`;
            
            // Auto-hide modal when complete
            if (completed === total) {
                setTimeout(() => {
                    this.hideAgentsLoadingModal();
                }, 1000);
            }
        }, 100);
    }
    
    /**
     * Format itinerary content for better display
     */
    formatItineraryContent(itinerary, cities) {
        if (!itinerary) {
            return UIEnhancements.getDefaultItinerary();
        }

        // Parse the itinerary and create a structured display
        const sections = itinerary.split(/\n\n|\*\*|\##/).filter(section => section.trim());
        
        return `
            <div class="itinerary-structured">
                <div class="itinerary-overview">
                    <div class="route-timeline">
                        ${cities.map((city, index) => `
                            <div class="timeline-item ${index === 0 ? 'start' : index === cities.length - 1 ? 'end' : 'stop'}">
                                <div class="timeline-marker">
                                    <span>${index === 0 ? '🏁' : index === cities.length - 1 ? '🏆' : '📍'}</span>
                                </div>
                                <div class="timeline-content">
                                    <h4>${city.name}</h4>
                                    <span class="city-type">${index === 0 ? 'Starting Point' : index === cities.length - 1 ? 'Destination' : `Stop ${index}`}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="itinerary-recommendations">
                    <div class="recommendations-content">
                        ${sections.map((section, index) => `
                            <div class="recommendation-section">
                                <div class="section-content">
                                    ${section.trim().replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format itinerary preview for cards
     */
    formatItineraryPreview(itinerary, cities) {
        if (!itinerary) {
            return `
                <div class="preview-enhanced">
                    <span class="preview-text">✨ Curated experiences awaiting your discovery</span>
                </div>
            `;
        }

        // Extract first few key points
        const lines = itinerary.split('\n').filter(line => line.trim());
        const highlights = lines.slice(0, 3).map(line => line.trim().substring(0, 80) + '...');
        
        return `
            <div class="itinerary-highlights">
                ${highlights.map(highlight => `
                    <div class="highlight-item">
                        <span class="highlight-bullet">•</span>
                        <span class="highlight-text">${highlight}</span>
                    </div>
                `).join('')}
                <div class="preview-more">
                    <span>Click 'View Details' for full recommendations</span>
                </div>
            </div>
        `;
    }

    /**
     * Launch agents with progress tracking
     */
    async launchAgentsWithProgress(startId, destId, baseOptions) {
        
        // Update initial progress for each agent type
        const agentTypes = Object.keys(this.parallelAgents.agents);
        agentTypes.forEach(agentType => {
            this.updateAgentProgress(agentType, 25, 'Launching...');
        });
        
        let completedCount = 0;
        
        // Create a modified version that updates progress
        const originalLaunchAgent = this.parallelAgents.launchAgent.bind(this.parallelAgents);
        this.parallelAgents.launchAgent = async (agentType, startId, destId, baseOptions, agent) => {
            try {
                this.updateAgentProgress(agentType, 50, 'Calculating route...');
                
                const result = await originalLaunchAgent(agentType, startId, destId, baseOptions, agent);
                
                this.updateAgentProgress(agentType, 100, 'Complete!');
                completedCount++;
                this.updateOverallProgress(completedCount, agentTypes.length);
                
                return result;
                
            } catch (error) {
                this.updateAgentProgress(agentType, 100, 'Error - using fallback');
                completedCount++;
                this.updateOverallProgress(completedCount, agentTypes.length);
                throw error;
            }
        };
        
        // Launch all agents using the ParallelAgentSystem
        const agentResults = await this.parallelAgents.launchAllAgents(startId, destId, baseOptions);
        
        // Restore original method
        this.parallelAgents.launchAgent = originalLaunchAgent;
        
        return agentResults;
    }
    
    /**
     * Show the agents results page
     */
    showAgentsResultsPage(destination, agentResults) {
        const resultsPage = document.getElementById('agents-results-page');
        const destinationSpan = document.getElementById('results-destination');
        const resultsGrid = document.getElementById('agents-results-grid');
        
        if (!resultsPage || !resultsGrid) return;
        
        // Update destination
        if (destinationSpan) destinationSpan.textContent = destination;
        
        // Hide main interface and show results page
        document.querySelector('.container').style.display = 'none';
        resultsPage.style.display = 'block';
        
        // Generate agent results cards
        resultsGrid.innerHTML = '';
        
        agentResults.forEach((result, agentType) => {
            const card = this.createAgentResultCard(result, agentType);
            resultsGrid.appendChild(card);
        });
        
        // Setup back button
        const backBtn = document.getElementById('back-to-planner');
        if (backBtn) {
            backBtn.onclick = () => this.hideAgentsResultsPage();
        }
    }
    
    /**
     * Hide the agents results page
     */
    hideAgentsResultsPage() {
        const resultsPage = document.getElementById('agents-results-page');
        const mainContainer = document.querySelector('.container');
        
        if (resultsPage) resultsPage.style.display = 'none';
        if (mainContainer) mainContainer.style.display = 'flex';
    }
    
    /**
     * Create an agent result card with individual map
     */
    createAgentResultCard(result, agentType) {
        const card = document.createElement('div');
        card.className = 'agent-results-card';
        card.style.setProperty('--agent-color', result.agent.color);
        card.style.setProperty('--agent-color-dark', this.darkenColor(result.agent.color, 0.2));
        
        const cities = result.cities.map(c => c.name);
        const mapId = `agent-map-${agentType}`;
        
        card.innerHTML = `
            <div class="agent-card-header">
                <div class="agent-title">
                    <div class="agent-title-icon">${result.agent.icon}</div>
                    <div class="agent-title-text">
                        <h3>${result.agent.name}</h3>
                        <p>${result.agent.description}</p>
                    </div>
                </div>
                <div class="agent-stats">
                    <div class="agent-stat">
                        <span>📏</span>
                        <span>${result.route.totalDistance}km</span>
                    </div>
                    <div class="agent-stat">
                        <span>⏱️</span>
                        <span>${result.route.totalTime}h</span>
                    </div>
                    <div class="agent-stat">
                        <span>🏛️</span>
                        <span>${result.cities.length - 2} stops</span>
                    </div>
                </div>
            </div>
            
            <div class="agent-map-container">
                <div id="${mapId}" class="agent-individual-map"></div>
            </div>
            
            <div class="agent-card-body">
                <div class="agent-route-summary">
                    <h4>Route Overview</h4>
                    <div class="route-cities-list">
                        ${cities.map(city => `<span class="route-city-tag">${city}</span>`).join('')}
                    </div>
                </div>
                
                <div class="agent-itinerary-preview">
                    ${this.formatItineraryPreview(result.itinerary, result.cities)}
                </div>
                
                <div class="agent-card-actions">
                    <button class="select-agent-route" data-agent="${agentType}">
                        Use This Route
                    </button>
                    <button class="view-full-details" data-agent="${agentType}">
                        View Details
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        card.querySelector('.select-agent-route').addEventListener('click', () => {
            this.switchToAgentRoute(agentType, result);
            this.hideAgentsResultsPage();
        });
        
        card.querySelector('.view-full-details').addEventListener('click', () => {
            this.showRouteSpotlight(agentType, result);
        });
        
        // Initialize map with enhanced UI
        requestAnimationFrame(() => {
            setTimeout(() => UIEnhancements.initializeMapProperly(mapId, result), 500);
        });
        
        return card;
    }
    
    /**
     * Initialize individual map for an agent
     */
    initializeAgentMap(mapId, result) {
        // Use enhanced UI method for proper map initialization
        UIEnhancements.initializeMapProperly(mapId, result);
    }
    
    /**
     * Helper function to darken a color
     */
    darkenColor(color, factor) {
        // Simple color darkening - convert hex to rgb, darken, convert back
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
        
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }
}