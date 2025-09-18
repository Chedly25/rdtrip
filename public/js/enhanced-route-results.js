/**
 * Enhanced Route Results Controller
 * Displays route results with landing page styling and Wikipedia images
 */
class EnhancedRouteResults {
    constructor() {
        this.resultsContainer = null;
        this.currentResults = null;
        this.imageCache = new Map();
        this.isVisible = false;

        this.init();
    }

    init() {
        this.createResultsContainer();
        this.setupEventListeners();
        console.log('✅ Enhanced Route Results Controller initialized');
    }

    createResultsContainer() {
        // Create the enhanced results container
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.id = 'enhanced-route-results';
        this.resultsContainer.className = 'enhanced-route-results';
        this.resultsContainer.innerHTML = this.getResultsTemplate();

        document.body.appendChild(this.resultsContainer);

        // Cache important elements
        this.headerElement = this.resultsContainer.querySelector('.enhanced-results-header');
        this.titleElement = this.resultsContainer.querySelector('.route-main-title');
        this.subtitleElement = this.resultsContainer.querySelector('.route-subtitle');
        this.cardsGrid = this.resultsContainer.querySelector('.route-cards-grid');
        this.closeBtn = this.resultsContainer.querySelector('.close-results-btn');
    }

    getResultsTemplate() {
        return `
            <div class="enhanced-results-header">
                <div class="results-header-content">
                    <div class="route-title-section">
                        <h1 class="route-main-title">Route Results</h1>
                        <div class="route-subtitle">
                            <div class="route-path">
                                <span class="origin-city">Aix-en-Provence</span>
                                <span class="route-arrow">→</span>
                                <span class="destination-city">Loading...</span>
                            </div>
                        </div>
                    </div>
                    <button class="close-results-btn" id="close-enhanced-results">
                        ← Back to Planner
                    </button>
                </div>
            </div>

            <div class="enhanced-results-container">
                <div class="results-intro">
                    <h2>Choose Your Adventure Style</h2>
                    <p>Each route is carefully crafted by our AI agents to match different travel preferences and interests.</p>
                </div>

                <div class="route-cards-grid" id="enhanced-route-cards">
                    <!-- Route cards will be generated here -->
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Close button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-enhanced-results') {
                this.hide();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    async show(results, destination) {
        console.log('🎨 Showing enhanced route results', results);

        this.currentResults = results;

        // Update header
        this.updateHeader(destination);

        // Generate route cards
        await this.generateRouteCards(results);

        // Show container with animation
        this.resultsContainer.classList.add('show');
        this.isVisible = true;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.resultsContainer.classList.remove('show');
        this.isVisible = false;

        // Restore body scroll
        document.body.style.overflow = '';

        console.log('🎨 Enhanced route results hidden');
    }

    updateHeader(destination) {
        const destinationElement = this.subtitleElement.querySelector('.destination-city');
        if (destinationElement) {
            destinationElement.textContent = destination || 'Your Destination';
        }
    }

    async generateRouteCards(results) {
        if (!results || !results.agentResults) {
            console.warn('No agent results to display');
            return;
        }

        this.cardsGrid.innerHTML = '';

        // Process each agent result
        for (const agentResult of results.agentResults) {
            const card = await this.createRouteCard(agentResult);
            this.cardsGrid.appendChild(card);
        }
    }

    async createRouteCard(agentResult) {
        const { agent, recommendations } = agentResult;

        // Parse recommendations
        let parsedRecommendations;
        try {
            const cleanedRecommendations = recommendations
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();
            parsedRecommendations = JSON.parse(cleanedRecommendations);
        } catch (error) {
            console.warn('Failed to parse recommendations for', agent, error);
            parsedRecommendations = { waypoints: [], description: 'Route information available' };
        }

        // Agent configuration
        const agentConfig = this.getAgentConfig(agent);

        // Create card element
        const card = document.createElement('div');
        card.className = 'enhanced-route-card';
        card.setAttribute('data-agent', agent);

        card.innerHTML = `
            <div class="route-card-header">
                <div class="route-type-badge">
                    <div class="route-type-icon">${agentConfig.icon}</div>
                    <div>
                        <div>${agentConfig.name}</div>
                        <div class="route-cities-preview">${this.getCitiesPreview(parsedRecommendations.waypoints)}</div>
                    </div>
                </div>
                <div class="route-stats">
                    <div class="route-stat">
                        <div class="route-stat-value">${parsedRecommendations.waypoints?.length || 0}</div>
                        <div class="route-stat-label">Cities</div>
                    </div>
                    <div class="route-stat">
                        <div class="route-stat-value">${this.estimateDays(parsedRecommendations.waypoints?.length || 0)}</div>
                        <div class="route-stat-label">Days</div>
                    </div>
                </div>
            </div>

            <div class="route-card-body">
                <div class="route-description">
                    ${parsedRecommendations.description || agentConfig.description}
                </div>

                <div class="route-cities-grid" id="cities-grid-${agent}">
                    <!-- Cities will be loaded here -->
                </div>

                <div class="route-card-actions">
                    <button class="btn-view-full-route" onclick="enhancedRouteResults.viewFullRoute('${agent}')">
                        View Full ${agentConfig.name} →
                    </button>
                </div>
            </div>
        `;

        // Load city cards with images
        await this.loadCityCards(card.querySelector(`#cities-grid-${agent}`), parsedRecommendations.waypoints || []);

        return card;
    }

    async loadCityCards(container, waypoints) {
        container.innerHTML = '';

        if (!waypoints || waypoints.length === 0) {
            container.innerHTML = '<p class="no-cities">No cities available for this route</p>';
            return;
        }

        // Limit to first 3 cities for preview
        const citiesToShow = waypoints.slice(0, 3);

        for (const waypoint of citiesToShow) {
            const cityCard = await this.createCityCard(waypoint);
            container.appendChild(cityCard);
        }
    }

    async createCityCard(waypoint) {
        const cityCard = document.createElement('div');
        cityCard.className = 'enhanced-city-card';

        // Create initial structure with placeholder
        cityCard.innerHTML = `
            <div class="city-image-container">
                <div class="city-image-placeholder">${waypoint.name?.charAt(0) || '?'}</div>
                <div class="city-loading-indicator"></div>
            </div>
            <div class="city-info">
                <div class="city-name">${waypoint.name}</div>
                <div class="city-highlights">
                    ${this.formatCityHighlights(waypoint.highlights)}
                </div>
            </div>
        `;

        // Fetch Wikipedia image asynchronously
        this.fetchCityImage(cityCard, waypoint.name);

        return cityCard;
    }

    async fetchCityImage(cityCard, cityName) {
        try {
            const imageUrl = await this.getWikipediaImage(cityName, 320, 320);
            const imageContainer = cityCard.querySelector('.city-image-container');
            const loadingIndicator = cityCard.querySelector('.city-loading-indicator');

            if (imageUrl) {
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = cityName;
                img.className = 'image-loaded';

                img.onload = () => {
                    const placeholder = imageContainer.querySelector('.city-image-placeholder');
                    if (placeholder) {
                        placeholder.remove();
                    }
                    if (loadingIndicator) {
                        loadingIndicator.remove();
                    }
                };

                img.onerror = () => {
                    if (loadingIndicator) {
                        loadingIndicator.remove();
                    }
                };

                imageContainer.appendChild(img);
            } else {
                // Remove loading indicator if no image found
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
            }
        } catch (error) {
            console.warn(`Failed to fetch image for ${cityName}:`, error);
            const loadingIndicator = cityCard.querySelector('.city-loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }

    // Wikipedia image fetching (adapted from spotlight.js)
    async getWikipediaImage(locationName, width = 800, height = 600) {
        const cacheKey = `${locationName}_${width}x${height}`;
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }

        try {
            // Clean location name for Wikipedia search
            const cleanName = locationName.replace(/[,\(\)]/g, '').trim();

            const response = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`,
                { headers: { 'Accept': 'application/json' } }
            );

            if (response.ok) {
                const data = await response.json();

                if (data.thumbnail && data.thumbnail.source) {
                    let imageUrl = data.thumbnail.source;

                    // Resize image URL
                    if (width && height) {
                        imageUrl = imageUrl.replace(/\/\d+px-/, `/${width}px-`);
                    }

                    this.imageCache.set(cacheKey, imageUrl);
                    return imageUrl;
                }
            }
        } catch (error) {
            console.warn(`Could not fetch Wikipedia image for ${locationName}:`, error);
        }

        // Cache null result to avoid repeated failed requests
        this.imageCache.set(cacheKey, null);
        return null;
    }

    formatCityHighlights(highlights) {
        if (!highlights || highlights.length === 0) {
            return '<p>Beautiful destination with unique attractions</p>';
        }

        if (Array.isArray(highlights)) {
            return `<ul>${highlights.slice(0, 3).map(h => `<li>${h}</li>`).join('')}</ul>`;
        }

        return `<p>${highlights}</p>`;
    }

    getCitiesPreview(waypoints) {
        if (!waypoints || waypoints.length === 0) {
            return 'No cities available';
        }

        if (waypoints.length <= 2) {
            return waypoints.map(w => w.name).join(' → ');
        }

        return `${waypoints[0].name} → ${waypoints[waypoints.length - 1].name}`;
    }

    estimateDays(cityCount) {
        if (cityCount <= 1) return 1;
        return Math.max(3, Math.ceil(cityCount * 1.5));
    }

    getAgentConfig(agent) {
        const configs = {
            adventure: {
                name: 'Adventure Route',
                icon: '🏔️',
                description: 'Discover amazing cities perfect for adventure enthusiasts with outdoor activities, hiking trails, and thrilling experiences.'
            },
            culture: {
                name: 'Culture Route',
                icon: '🏛️',
                description: 'Explore cities rich in history, art, and cultural heritage with museums, historic sites, and architectural wonders.'
            },
            food: {
                name: 'Food Route',
                icon: '🍽️',
                description: 'Savor the finest culinary experiences with local specialties, renowned restaurants, and food markets.'
            },
            'hidden-gems': {
                name: 'Hidden Gems Route',
                icon: '💎',
                description: 'Uncover lesser-known treasures and authentic local experiences away from the typical tourist crowds.'
            }
        };

        return configs[agent] || {
            name: 'Custom Route',
            icon: '🗺️',
            description: 'A specially curated route with unique destinations and experiences.'
        };
    }

    viewFullRoute(agent) {
        console.log(`🎯 Viewing full route for agent: ${agent}`);

        // Find the agent result
        const agentResult = this.currentResults?.agentResults?.find(result => result.agent === agent);
        if (!agentResult) {
            console.warn('Agent result not found for:', agent);
            return;
        }

        // Parse recommendations
        let parsedRecommendations;
        try {
            const cleanedRecommendations = agentResult.recommendations
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();
            parsedRecommendations = JSON.parse(cleanedRecommendations);
        } catch (error) {
            console.warn('Failed to parse recommendations for spotlight:', error);
            return;
        }

        // Store data for spotlight page (same format as original)
        const spotlightData = {
            agent: agent,
            destination: this.subtitleElement.querySelector('.destination-city')?.textContent || 'Destination',
            origin: 'Aix-en-Provence',
            waypoints: parsedRecommendations.waypoints || [],
            totalStops: parsedRecommendations.waypoints?.length || 0,
            recommendations: agentResult.recommendations,
            fullItinerary: parsedRecommendations,
            // Include agentData that spotlight.js expects
            agentData: {
                recommendations: agentResult.recommendations
            },
            // Include full route data for compatibility
            routeData: this.currentResults
        };

        // Store in both localStorage and sessionStorage for reliability
        localStorage.setItem('spotlightData', JSON.stringify(spotlightData));
        sessionStorage.setItem('spotlightData', JSON.stringify(spotlightData));

        console.log('🎯 Spotlight data stored:', spotlightData);

        // Open spotlight page in new tab
        window.open('spotlight.html', '_blank');
    }
}

// Initialize when DOM is ready
let enhancedRouteResults;
document.addEventListener('DOMContentLoaded', () => {
    enhancedRouteResults = new EnhancedRouteResults();
    window.enhancedRouteResults = enhancedRouteResults; // Make globally available
});

export { EnhancedRouteResults };