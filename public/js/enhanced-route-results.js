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
                    <button class="close-results-btn back-button" id="close-enhanced-results">
                        ← Back to Planner
                    </button>
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
                    <div class="header-spacer"></div>
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
        const { agent, recommendations, metrics } = agentResult;

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

        // Create metrics HTML if metrics are available
        const metricsHTML = metrics ? this.createMetricsHTML(agent, metrics) : '';

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

                ${metricsHTML}

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


        // Extract highlights from various possible locations
        let highlights = waypoint.highlights || waypoint.activities || waypoint.attractions || waypoint.description;

        // If highlights is a string, try to extract bullet points or activities
        if (typeof highlights === 'string') {
            // Look for bullet points or numbered lists
            const listItems = highlights.match(/[-•*]\s*([^\n\r]+)/g) ||
                            highlights.match(/\d+\.\s*([^\n\r]+)/g);
            if (listItems) {
                highlights = listItems.slice(0, 3).map(item => {
                    const cleaned = item.replace(/^[-•*\d.]\s*/, '').trim();
                    // Truncate to max 40 characters for consistent card height
                    return cleaned.length > 40 ? cleaned.substring(0, 37) + '...' : cleaned;
                });
            } else {
                // Keep as single string, but truncate if too long
                const truncated = highlights.length > 40 ? highlights.substring(0, 37) + '...' : highlights;
                highlights = [truncated];
            }
        } else if (Array.isArray(highlights)) {
            // Truncate each array item and limit to 3 items
            highlights = highlights.slice(0, 3).map(item => {
                const str = String(item).trim();
                return str.length > 40 ? str.substring(0, 37) + '...' : str;
            });
        }


        // Create initial structure with placeholder
        cityCard.innerHTML = `
            <div class="city-image-container">
                <div class="city-image-placeholder">${waypoint.name?.charAt(0) || '?'}</div>
                <div class="city-loading-indicator"></div>
            </div>
            <div class="city-info">
                <div class="city-name">${waypoint.name}</div>
                <div class="city-highlights">
                    ${this.formatCityHighlights(highlights)}
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
            return `<ul>${highlights.slice(0, 3).map(h => {
                // Handle objects in array
                const text = typeof h === 'object' ? (h.activity || h.name || h.title || h.description || JSON.stringify(h)) : h;
                return `<li>${text}</li>`;
            }).join('')}</ul>`;
        }

        // Handle single object
        if (typeof highlights === 'object') {
            const text = highlights.activity || highlights.name || highlights.title || highlights.description || JSON.stringify(highlights);
            return `<p>${text}</p>`;
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
                icon: '<img src="/images/icons/adventure_icon.png" alt="Adventure" style="width: 24px; height: 24px;">',
                description: 'Discover amazing cities perfect for adventure enthusiasts with outdoor activities, hiking trails, and thrilling experiences.'
            },
            culture: {
                name: 'Culture Route',
                icon: '<img src="/images/icons/culture_icon.png" alt="Culture" style="width: 24px; height: 24px;">',
                description: 'Explore cities rich in history, art, and cultural heritage with museums, historic sites, and architectural wonders.'
            },
            food: {
                name: 'Food Route',
                icon: '<img src="/images/icons/food_icon.png" alt="Food" style="width: 24px; height: 24px;">',
                description: 'Savor the finest culinary experiences with local specialties, renowned restaurants, and food markets.'
            },
            'hidden-gems': {
                name: 'Hidden Gems Route',
                icon: '<img src="/images/icons/hidden_gem_icon.png" alt="Hidden Gems" style="width: 24px; height: 24px;">',
                description: 'Uncover lesser-known treasures and authentic local experiences away from the typical tourist crowds.'
            }
        };

        return configs[agent] || {
            name: 'Custom Route',
            icon: '<img src="/images/logo.png" alt="Route" style="width: 24px; height: 24px;">',
            description: 'A specially curated route with unique destinations and experiences.'
        };
    }

    createMetricsHTML(agent, metrics) {
        if (!metrics) return '';

        let metricsContent = '';

        switch(agent) {
            case 'adventure':
                metricsContent = this.createAdventureMetrics(metrics);
                break;
            case 'food':
                metricsContent = this.createFoodMetrics(metrics);
                break;
            case 'culture':
                metricsContent = this.createCultureMetrics(metrics);
                break;
            case 'hidden-gems':
                metricsContent = this.createHiddenGemsMetrics(metrics);
                break;
            default:
                return '';
        }

        const agentConfig = this.getAgentConfig(agent);

        return `
            <div class="route-metrics-card ${agent}-metrics">
                <div class="metrics-header">
                    <div class="metrics-icon">${agentConfig.icon}</div>
                    <div class="metrics-title">Route Requirements</div>
                </div>
                <div class="metrics-grid">
                    ${metricsContent}
                </div>
            </div>
        `;
    }

    createAdventureMetrics(metrics) {
        return `
            <div class="metric-item">
                <div class="metric-label">Physical Difficulty</div>
                <div class="metric-value">${this.createRatingDots(metrics.physicalDifficulty || 3, 5)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Gear Required</div>
                <div class="metric-value">
                    <span class="metric-badge level-${this.getLevelClass(metrics.gearRequirement)}">${metrics.gearRequirement || 'Moderate'}</span>
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Weather Dependent</div>
                <div class="metric-value">${this.createPercentageBar(metrics.weatherDependency || 60)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Outdoor Hours</div>
                <div class="metric-value">${metrics.outdoorHours || '6-8'} hrs/day</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Equipment Cost</div>
                <div class="metric-value">${metrics.equipmentCost || '€200-500'}</div>
            </div>
        `;
    }

    createFoodMetrics(metrics) {
        return `
            <div class="metric-item">
                <div class="metric-label">Michelin Stars</div>
                <div class="metric-value">${metrics.michelinStars || '3-5'} restaurants</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Book Ahead</div>
                <div class="metric-value">${metrics.bookingTimeline || '2-4'} weeks</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Price Range</div>
                <div class="metric-value">${this.createPriceDistribution(metrics.priceDistribution)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Cuisines</div>
                <div class="metric-value">${metrics.regionalCuisines || '5+'} regional</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Experience Types</div>
                <div class="metric-value">${this.createExperienceTypes(metrics.experienceTypes)}</div>
            </div>
        `;
    }

    createCultureMetrics(metrics) {
        return `
            <div class="metric-item">
                <div class="metric-label">UNESCO Sites</div>
                <div class="metric-value">${metrics.unescoSites || '2-3'} sites</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Museum Density</div>
                <div class="metric-value">
                    <span class="metric-badge level-${this.getLevelClass(metrics.museumDensity)}">${metrics.museumDensity || 'High'}</span>
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Historical Periods</div>
                <div class="metric-value">${this.formatHistoricalPeriods(metrics.historicalPeriods)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Audio Guides</div>
                <div class="metric-value">${this.createPercentageBar(metrics.audioGuideAvailability || 80)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Focus Split</div>
                <div class="metric-value">${this.createFocusSplit(metrics.artVsHistory)}</div>
            </div>
        `;
    }

    createHiddenGemsMetrics(metrics) {
        return `
            <div class="metric-item">
                <div class="metric-label">Tourist Density</div>
                <div class="metric-value">
                    <span class="metric-badge level-${this.getLevelClass(metrics.touristDensity, true)}">${metrics.touristDensity || 'Low'}</span>
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Language Barrier</div>
                <div class="metric-value">${this.createRatingDots(metrics.languageBarrier || 3, 5)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Cash vs Card</div>
                <div class="metric-value">${this.createPaymentSplit(metrics.cashVsCard)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Local Interaction</div>
                <div class="metric-value">${this.createPercentageBar(metrics.localInteraction || 75)}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Transport Access</div>
                <div class="metric-value">
                    <span class="metric-badge level-${this.getLevelClass(metrics.transportAccess)}">${metrics.transportAccess || 'Moderate'}</span>
                </div>
            </div>
        `;
    }

    createRatingDots(rating, max = 5) {
        let dots = '';
        for (let i = 1; i <= max; i++) {
            dots += `<span class="metric-dot ${i <= rating ? 'filled' : ''}"></span>`;
        }
        return `<div class="metric-rating">${dots}</div>`;
    }

    createPercentageBar(percentage) {
        return `
            <div class="metric-bar">
                <div class="metric-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <span style="font-size: 0.8rem; margin-left: 4px">${percentage}%</span>
        `;
    }

    createPriceDistribution(distribution) {
        // Handle if distribution is not an object or is undefined
        if (!distribution || typeof distribution !== 'object') {
            distribution = { budget: 30, mid: 50, fine: 20 };
        }

        // Extract percentages with proper fallbacks
        const budget = parseInt(distribution.budget) || parseInt(distribution.street) || 30;
        const mid = parseInt(distribution.mid) || parseInt(distribution.casual) || 50;
        const fine = parseInt(distribution.fine) || parseInt(distribution.luxury) || 20;

        return `
            <div class="metric-split">
                <span title="Budget">€</span> ${budget}% |
                <span title="Mid-range">€€</span> ${mid}% |
                <span title="Fine dining">€€€</span> ${fine}%
            </div>
        `;
    }

    createExperienceTypes(types) {
        const exp = types || { dining: 60, markets: 25, classes: 15 };
        const dining = exp.dining || exp.tastings || 60;
        const markets = exp.markets || 25;
        const classes = exp.classes || 15;
        return `<span style="font-size: 0.85rem">Din ${dining}% | Mkt ${markets}% | Cls ${classes}%</span>`;
    }

    createFocusSplit(split) {
        const focus = split || { art: 40, history: 60 };
        return `
            <div class="metric-split">
                Art ${focus.art}% | History ${focus.history}%
            </div>
        `;
    }

    createPaymentSplit(split) {
        const payment = split || { cash: 40, card: 60 };
        return `
            <div class="metric-split">
                Cash ${payment.cash}% | Card ${payment.card}%
            </div>
        `;
    }

    formatHistoricalPeriods(periods) {
        if (!periods) return '3-4 eras';
        if (typeof periods === 'string') {
            try {
                const parsed = JSON.parse(periods);
                if (Array.isArray(parsed)) {
                    return `${parsed.length} eras`;
                }
            } catch (e) {
                return periods.includes(',') ? `${periods.split(',').length} eras` : periods;
            }
        }
        if (Array.isArray(periods)) {
            return `${periods.length} eras`;
        }
        return periods;
    }

    getLevelClass(level, inverse = false) {
        const levelMap = {
            'Low': inverse ? 'low' : 'high',
            'Basic': 'low',
            'Moderate': 'medium',
            'High': inverse ? 'high' : 'low',
            'Extensive': 'high'
        };
        return levelMap[level] || 'medium';
    }

    viewFullRoute(agent) {

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