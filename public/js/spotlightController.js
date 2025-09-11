/**
 * Premium Spotlight Page Controller
 * Manages all interactive features and animations for the route spotlight page
 */

class SpotlightController {
    constructor() {
        this.currentTab = 'overview';
        this.isDarkMode = false;
        this.assistantOpen = false;
        this.journeyProgress = 0;
        this.currentRoute = null;
        this.currentAgentResult = null;
        this.routeData = null;
        
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupDarkModeToggle();
        this.setupAIAssistant();
        this.setupMapControls();
        this.setupJourneyProgress();
        this.setupFilters();
        this.setupAnimations();
        
        console.log('🚀 Premium Spotlight Controller initialized');
    }
    
    /**
     * Initialize spotlight with route data from agent result
     * @param {Object} agentResult - Result from selected agent
     */
    initializeWithRoute(agentResult) {
        console.log('🗺️ Initializing spotlight with route data:', agentResult);
        this.currentAgentResult = agentResult;
        this.routeData = agentResult.route;
        
        // Update agent badge
        this.updateAgentBadge(agentResult);
        
        // Refresh all tab content with new data
        this.loadOverviewContent();
        this.loadRouteBasedItinerary();
        this.loadRouteBasedRestaurants();
        this.loadRouteBasedPhotoSpots();
        
        // Update progress bar with actual cities
        this.updateProgressWithRoute();
    }
    
    updateAgentBadge(agentResult) {
        const badge = document.getElementById('spotlight-agent-badge');
        if (badge && agentResult.agent) {
            const iconSpan = badge.querySelector('.agent-icon');
            const nameSpan = badge.querySelector('.agent-name');
            
            if (iconSpan) iconSpan.textContent = agentResult.agent.icon;
            if (nameSpan) nameSpan.textContent = agentResult.agent.name;
        }
    }

    // ===== TAB NAVIGATION SYSTEM =====
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');
        const tabIndicator = document.querySelector('.tab-indicator');

        tabButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab, index, tabButtons, tabPanels, tabIndicator);
            });
        });

        // Initialize first tab
        this.switchTab('overview', 0, tabButtons, tabPanels, tabIndicator);
    }

    async switchTab(tabName, index, buttons, panels, indicator) {
        // Update current tab
        this.currentTab = tabName;

        // Remove active classes
        buttons.forEach(btn => btn.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));

        // Add active classes
        buttons[index].classList.add('active');
        const targetPanel = document.getElementById(`tab-${tabName}`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        // Move indicator
        if (indicator) {
            const indicatorWidth = 100 / buttons.length;
            indicator.style.width = `${indicatorWidth}%`;
            indicator.style.left = `${index * indicatorWidth}%`;
        }

        // Load tab content
        await this.loadTabContent(tabName);

        // Trigger animation
        this.triggerTabAnimation(targetPanel);
    }

    async loadTabContent(tabName) {
        switch (tabName) {
            case 'overview':
                this.loadOverviewContent();
                break;
            case 'day-by-day':
                await this.loadItineraryContent();
                break;
            case 'food-wine':
                this.loadCulinaryContent();
                break;
            case 'photo-spots':
                this.loadPhotographyContent();
                break;
        }
    }

    loadOverviewContent() {
        this.loadRouteBasedHighlights();
        this.loadRouteStatistics();
        this.setupExportFunctions();
    }
    
    loadRouteBasedHighlights() {
        const highlightsGrid = document.getElementById('trip-highlights');
        if (!highlightsGrid) return;
        
        // Clear existing content
        highlightsGrid.innerHTML = '';
        
        // Get highlights from current route data
        let highlights = [];
        
        if (this.currentAgentResult && this.currentAgentResult.cities) {
            // Generate highlights based on the agent's route cities
            highlights = this.generateHighlightsFromRoute(this.currentAgentResult);
        } else {
            // Fallback highlights that are more generic
            highlights = this.getGenericHighlights();
        }
        
        highlightsGrid.innerHTML = highlights.map((highlight, index) => `
            <div class="highlight-item" onclick="spotlightController.highlightClicked('${highlight.title}', ${index})" 
                 tabindex="0" role="button" aria-label="View ${highlight.title}">
                <div class="item-actions">
                    <button class="item-action-btn" onclick="event.stopPropagation(); spotlightController.bookHighlight(${index})" 
                            title="Book now" aria-label="Book ${highlight.title}">📅</button>
                    <button class="item-action-btn" onclick="event.stopPropagation(); spotlightController.shareHighlight(${index})" 
                            title="Share" aria-label="Share ${highlight.title}">📤</button>
                </div>
                <div class="highlight-icon">${highlight.icon}</div>
                <div class="highlight-title">${highlight.title}</div>
                <div class="highlight-description">${highlight.description}</div>
                <div class="highlight-meta">
                    <span class="location">📍 ${highlight.location}</span>
                    <span class="price">💰 ${highlight.price}</span>
                    <span class="rating">⭐ ${highlight.rating}</span>
                </div>
            </div>
        `).join('');
    }
    
    generateHighlightsFromRoute(agentResult) {
        const highlights = [];
        const cities = agentResult.cities || [];
        const agentType = agentResult.agentType;
        
        cities.forEach((city, index) => {
            if (index === 0 || index === cities.length - 1) return; // Skip start/end cities
            
            const highlight = this.createCityHighlight(city, agentType, index);
            if (highlight) highlights.push(highlight);
        });
        
        return highlights.length > 0 ? highlights : this.getGenericHighlights();
    }
    
    createCityHighlight(city, agentType, index) {
        const cityName = city.name || city;
        const agentTypeIcons = {
            adventure: '🏔️',
            romantic: '💕', 
            cultural: '🏛️',
            foodie: '🍽️',
            family: '👨‍👩‍👧‍👦',
            luxury: '✨'
        };
        
        const cityAttractions = {
            'Nice': { icon: '🌅', attraction: 'Promenade des Anglais', description: 'Iconic waterfront promenade with stunning views', price: 'Free' },
            'Cannes': { icon: '🎬', attraction: 'Film Festival Palace', description: 'Walk the famous red carpet steps', price: 'Free' },
            'Monaco': { icon: '🏁', attraction: 'Monte Carlo Casino', description: 'Legendary gambling destination', price: '€17' },
            'Avignon': { icon: '🏛️', attraction: 'Palace of the Popes', description: 'Gothic palace, UNESCO World Heritage site', price: '€12' },
            'Marseille': { icon: '🌊', attraction: 'Calanques National Park', description: 'Stunning limestone cliffs and waters', price: 'Free' },
            'Turin': { icon: '🏛️', attraction: 'Mole Antonelliana', description: 'Iconic tower with panoramic views', price: '€8' },
            'Florence': { icon: '🎨', attraction: 'Uffizi Gallery', description: 'Renaissance masterpieces collection', price: '€25' },
            'Venice': { icon: '🚤', attraction: 'Gondola Ride', description: 'Classic Venetian experience', price: '€80' },
            'Genoa': { icon: '🏰', attraction: 'Historic Center', description: 'UNESCO World Heritage medieval streets', price: 'Free' },
            'Aix-en-Provence': { icon: '🎨', attraction: 'Cézanne Studio', description: 'Artist\'s preserved workspace', price: '€5' }
        };
        
        const cityData = cityAttractions[cityName] || {
            icon: agentTypeIcons[agentType] || '📍',
            attraction: `${cityName} Experience`,
            description: `Discover the best of ${cityName}`,
            price: '€15'
        };
        
        return {
            icon: cityData.icon,
            title: cityData.attraction,
            description: cityData.description,
            location: cityName,
            price: cityData.price,
            rating: (4.2 + Math.random() * 0.7).toFixed(1)
        };
    }
    
    getGenericHighlights() {
        return [
            {
                icon: '🗺️',
                title: 'Scenic Route',
                description: 'Beautiful landscapes and views along your journey',
                location: 'Along the route',
                price: 'Free',
                rating: 4.5
            },
            {
                icon: '🍽️',
                title: 'Local Cuisine',
                description: 'Taste authentic regional specialties',
                location: 'Various stops',
                price: '€25-45',
                rating: 4.3
            },
            {
                icon: '📸',
                title: 'Photo Opportunities',
                description: 'Capture memorable moments at scenic spots',
                location: 'Throughout journey',
                price: 'Free',
                rating: 4.8
            }
        ];
    }
    
    loadRouteStatistics() {
        const statsContainer = document.getElementById('spotlight-stats');
        const citiesContainer = document.getElementById('spotlight-cities');
        
        if (this.currentAgentResult && this.currentAgentResult.route) {
            const route = this.currentAgentResult.route;
            const cities = route.route || [];
            
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="stat-item">
                        <div class="stat-value">${route.totalDistance} km</div>
                        <div class="stat-label">Total Distance</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${route.totalTime}h</div>
                        <div class="stat-label">Driving Time</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${cities.length - 2}</div>
                        <div class="stat-label">Stops</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${route.detourFactor}%</div>
                        <div class="stat-label">Scenic Factor</div>
                    </div>
                `;
            }
            
            if (citiesContainer) {
                citiesContainer.innerHTML = cities.map((city, index) => {
                    const isLast = index === cities.length - 1;
                    return `
                        <div class="route-city">
                            <div class="city-name">${city.name}</div>
                            ${!isLast ? '<div class="city-arrow">→</div>' : ''}
                        </div>
                    `;
                }).join('');
            }
        }
    }

    async loadItineraryContent() {
        // Load day-by-day itinerary - this is for the old system
        const itineraryContainer = document.getElementById('itinerary-container');
        if (itineraryContainer && !itineraryContainer.hasChildNodes()) {
            this.loadRouteBasedItinerary();
        }
    }
    
    async loadRouteBasedItinerary() {
        const itineraryContainer = document.getElementById('spotlight-itinerary') || document.getElementById('itinerary-container');
        if (!itineraryContainer) return;
        
        // Clear existing content
        itineraryContainer.innerHTML = '';
        
        if (this.currentAgentResult && this.currentAgentResult.itinerary) {
            // Use AI-generated itinerary if available
            itineraryContainer.innerHTML = this.formatItineraryContent(this.currentAgentResult.itinerary);
        } else if (this.currentAgentResult && this.currentAgentResult.cities) {
            // Generate itinerary from route cities
            this.generateItineraryFromRoute(itineraryContainer);
        } else {
            // Show loading and then fallback
            this.loadFallbackItinerary(itineraryContainer);
        }
    }
    
    generateItineraryFromRoute(container) {
        const cities = this.currentAgentResult.cities || [];
        const agentType = this.currentAgentResult.agentType;
        
        if (cities.length < 2) {
            this.loadFallbackItinerary(container);
            return;
        }
        
        const days = this.createDayPlan(cities, agentType);
        
        container.innerHTML = `
            <div class="itinerary-header">
                <h3>📅 Your ${days.length}-Day ${this.currentAgentResult.agent?.name || 'Adventure'}</h3>
                <p>Personalized itinerary based on your ${agentType} preferences</p>
            </div>
            ${days.map((day, index) => `
                <div class="day-card" data-day="${index + 1}">
                    <div class="day-header">
                        <h4>Day ${index + 1}: ${day.title}</h4>
                        <span class="day-distance">${day.distance} • ${day.duration}</span>
                    </div>
                    <div class="day-timeline">
                        ${day.activities.map(activity => `
                            <div class="timeline-item">
                                <span class="time">${activity.time}</span>
                                <div class="activity">
                                    <strong>${activity.title}</strong>
                                    ${activity.details.map(detail => `<p>• ${detail}</p>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="day-budget">
                        <strong>Daily Budget:</strong> ${day.budget} per person
                        <span class="budget-breakdown">${day.budgetBreakdown}</span>
                    </div>
                </div>
            `).join('')}
            
            <div class="itinerary-summary">
                <h4>Trip Summary</h4>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-label">Total Distance:</span>
                        <span class="stat-value">${this.routeData?.totalDistance || 0} km</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Driving Time:</span>
                        <span class="stat-value">${this.routeData?.totalTime || '0'}h</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Theme Focus:</span>
                        <span class="stat-value">${this.getThemeFocus(agentType)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    createDayPlan(cities, agentType) {
        const days = [];
        const cityPairs = [];
        
        // Create city pairs for each day
        for (let i = 0; i < cities.length - 1; i++) {
            cityPairs.push({
                from: cities[i],
                to: cities[i + 1],
                dayIndex: i
            });
        }
        
        cityPairs.forEach((pair, index) => {
            const day = {
                title: `${pair.from.name} to ${pair.to.name}`,
                distance: this.calculateSegmentDistance(pair.from, pair.to),
                duration: this.calculateSegmentDuration(pair.from, pair.to),
                activities: this.generateActivitiesForDay(pair, agentType, index),
                budget: this.calculateDayBudget(agentType),
                budgetBreakdown: this.getBudgetBreakdown(agentType)
            };
            days.push(day);
        });
        
        return days;
    }
    
    loadFallbackItinerary(container) {
        container.innerHTML = `
                <div class="itinerary-header">
                    <h3>📅 Your 3-Day Journey</h3>
                </div>
                
                <div class="day-card">
                    <div class="day-header">
                        <h4>Day 1: Aix-en-Provence to Avignon</h4>
                        <span class="day-distance">85 km • 1h 15min drive</span>
                    </div>
                    <div class="day-timeline">
                        <div class="timeline-item">
                            <span class="time">9:00 AM</span>
                            <div class="activity">
                                <strong>Depart from Aix-en-Provence</strong>
                                <p>• Start with coffee at Cours Mirabeau</p>
                                <p>• Stock up on local pastries for the road</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">11:00 AM</span>
                            <div class="activity">
                                <strong>Stop at Châteauneuf-du-Pape</strong>
                                <p>• Wine tasting at historic vineyard</p>
                                <p>• Explore medieval village (45 min)</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">1:00 PM</span>
                            <div class="activity">
                                <strong>Lunch in Avignon</strong>
                                <p>• Restaurant Les Halles</p>
                                <p>• Traditional Provençal cuisine</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">3:00 PM</span>
                            <div class="activity">
                                <strong>Palace of the Popes</strong>
                                <p>• UNESCO World Heritage site tour</p>
                                <p>• Explore medieval architecture (2 hours)</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">6:00 PM</span>
                            <div class="activity">
                                <strong>Check-in & Relax</strong>
                                <p>• Hotel d'Europe check-in</p>
                                <p>• Evening stroll on Pont d'Avignon</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">8:30 PM</span>
                            <div class="activity">
                                <strong>Dinner</strong>
                                <p>• La Mirande restaurant</p>
                                <p>• Michelin-starred dining experience</p>
                            </div>
                        </div>
                    </div>
                    <div class="day-budget">
                        <strong>Daily Budget:</strong> €120-150 per person
                        <span class="budget-breakdown">(Meals: €60 • Activities: €30 • Accommodation: €60)</span>
                    </div>
                </div>

                <div class="day-card">
                    <div class="day-header">
                        <h4>Day 2: Avignon to Cassis</h4>
                        <span class="day-distance">110 km • 1h 45min drive</span>
                    </div>
                    <div class="day-timeline">
                        <div class="timeline-item">
                            <span class="time">9:30 AM</span>
                            <div class="activity">
                                <strong>Morning Market Visit</strong>
                                <p>• Les Halles d'Avignon</p>
                                <p>• Pick up picnic supplies</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">11:00 AM</span>
                            <div class="activity">
                                <strong>Drive via Scenic Route</strong>
                                <p>• D7N through Alpilles mountains</p>
                                <p>• Photo stop at Les Baux-de-Provence</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">1:30 PM</span>
                            <div class="activity">
                                <strong>Arrival in Cassis</strong>
                                <p>• Waterfront lunch at Le Grand Bleu</p>
                                <p>• Fresh seafood with harbor views</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">3:30 PM</span>
                            <div class="activity">
                                <strong>Calanques Boat Tour</strong>
                                <p>• 2-hour cruise through limestone cliffs</p>
                                <p>• Swimming stop in turquoise coves</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">6:30 PM</span>
                            <div class="activity">
                                <strong>Beach Time</strong>
                                <p>• Relax at Plage de la Grande Mer</p>
                                <p>• Sunset aperitif at beach bar</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">8:00 PM</span>
                            <div class="activity">
                                <strong>Dinner</strong>
                                <p>• La Villa Madie (2 Michelin stars)</p>
                                <p>• Spectacular cliff-top dining</p>
                            </div>
                        </div>
                    </div>
                    <div class="day-budget">
                        <strong>Daily Budget:</strong> €140-180 per person
                        <span class="budget-breakdown">(Meals: €70 • Boat tour: €40 • Accommodation: €70)</span>
                    </div>
                </div>

                <div class="day-card">
                    <div class="day-header">
                        <h4>Day 3: Cassis to Nice</h4>
                        <span class="day-distance">195 km • 2h 30min drive</span>
                    </div>
                    <div class="day-timeline">
                        <div class="timeline-item">
                            <span class="time">10:00 AM</span>
                            <div class="activity">
                                <strong>Depart Cassis</strong>
                                <p>• Coastal drive along Corniche roads</p>
                                <p>• Stop for coffee in Bandol</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">12:30 PM</span>
                            <div class="activity">
                                <strong>Lunch in Saint-Tropez</strong>
                                <p>• Club 55 beach restaurant</p>
                                <p>• Celebrity-watching optional</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">3:00 PM</span>
                            <div class="activity">
                                <strong>Arrive in Nice</strong>
                                <p>• Check into Hotel Negresco</p>
                                <p>• Promenade des Anglais walk</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">5:00 PM</span>
                            <div class="activity">
                                <strong>Old Town Exploration</strong>
                                <p>• Vieux Nice walking tour</p>
                                <p>• Cours Saleya flower market</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">7:30 PM</span>
                            <div class="activity">
                                <strong>Sunset at Castle Hill</strong>
                                <p>• Panoramic views of Baie des Anges</p>
                                <p>• Perfect photo opportunity</p>
                            </div>
                        </div>
                        <div class="timeline-item">
                            <span class="time">9:00 PM</span>
                            <div class="activity">
                                <strong>Farewell Dinner</strong>
                                <p>• La Petite Maison</p>
                                <p>• Mediterranean fine dining</p>
                            </div>
                        </div>
                    </div>
                    <div class="day-budget">
                        <strong>Daily Budget:</strong> €160-200 per person
                        <span class="budget-breakdown">(Meals: €80 • Activities: €20 • Accommodation: €100)</span>
                    </div>
                </div>

                <div class="itinerary-summary">
                    <h4>Trip Summary</h4>
                    <div class="summary-stats">
                        <div class="stat">
                            <span class="stat-label">Total Distance:</span>
                            <span class="stat-value">390 km</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Driving Time:</span>
                            <span class="stat-value">5h 30min</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Average Daily Budget:</span>
                            <span class="stat-value">€140-180 per person</span>
                        </div>
                    </div>
                </div>
                `;
                
                itineraryContainer.innerHTML = itinerary;
            }
        }
    }

    formatAIContent(aiContent, options = {}) {
        // Generic method to convert AI text content into structured HTML with image support
        const { 
            containerClass = 'ai-content-with-images', 
            headerTitle = '🤖 AI-Generated Content', 
            headerSubtitle = 'Generated with real-time travel data and images',
            sectionClass = 'content-section'
        } = options;
        
        // Enhanced formatting - convert markdown-style content to HTML including images
        let formattedContent = aiContent
            // Convert markdown images to HTML
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" title="$1">')
            // Convert bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Convert italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Convert headers
            .replace(/## (.*$)/gm, '<h3>$1</h3>')
            .replace(/### (.*$)/gm, '<h4>$1</h4>')
            // Convert bullet points
            .replace(/- (.*$)/gm, '<p>• $1</p>')
            // Convert numbered lists
            .replace(/^\d+\. (.*$)/gm, '<p>$1</p>')
            // Convert line breaks
            .replace(/\n\n/g, `</div><div class="${sectionClass}">`)
            .replace(/\n/g, '<br>');
            
        return `
            <div class="${containerClass}">
                ${headerTitle ? `<div class="content-header">
                    <h3>${headerTitle}</h3>
                    ${headerSubtitle ? `<p class="ai-note">${headerSubtitle}</p>` : ''}
                </div>` : ''}
                <div class="${sectionClass}">
                    ${formattedContent}
                </div>
            </div>
        `;
    }

    formatItineraryContent(aiContent) {
        return this.formatAIContent(aiContent, {
            containerClass: 'ai-generated-itinerary ai-content-with-images',
            headerTitle: '🤖 Your AI-Generated Itinerary',
            headerSubtitle: 'Generated with real-time travel data and images',
            sectionClass: 'day-section'
        });
    }

    loadCulinaryContent() {
        const restaurantsGrid = document.getElementById('restaurants-list');
        if (restaurantsGrid && !restaurantsGrid.hasChildNodes()) {
            const restaurants = [
                {
                    image: '🍽️',
                    title: 'La Mère Germaine',
                    description: 'Legendary bouillabaisse restaurant in Villefranche-sur-Mer',
                    tags: ['French', 'Seafood', 'Historic'],
                    location: 'Villefranche-sur-Mer',
                    price: '€€€',
                    rating: 4.6,
                    phone: '+33 4 93 01 71 39',
                    website: 'https://lameregermaine.com'
                },
                {
                    image: '🍕',
                    title: 'Chez Madie Les Galinettes',
                    description: 'Authentic bouillabaisse in Marseille\'s old port',
                    tags: ['French', 'Traditional', 'Waterfront'],
                    location: 'Marseille',
                    price: '€€',
                    rating: 4.4,
                    phone: '+33 4 91 90 40 87',
                    website: 'https://chez-madie.com'
                },
                {
                    image: '🥘',
                    title: 'Le Chaudron',
                    description: 'Cozy bistro serving traditional Provençal dishes',
                    tags: ['Provençal', 'Local', 'Intimate'],
                    location: 'Aix-en-Provence',
                    price: '€€',
                    rating: 4.5,
                    phone: '+33 4 42 26 52 30',
                    website: 'https://lechaudron-aix.fr'
                }
            ];

            restaurantsGrid.innerHTML = restaurants.map((restaurant, index) => `
                <div class="restaurant-item" data-restaurant="${restaurant.title}" data-index="${index}"
                     tabindex="0" role="button" aria-label="View ${restaurant.title}">
                    <div class="item-actions">
                        <button class="item-action-btn call-btn" data-phone="${restaurant.phone}" 
                                title="Call restaurant" aria-label="Call ${restaurant.title}">📞</button>
                        <button class="item-action-btn website-btn" data-website="${restaurant.website}" 
                                title="Visit website" aria-label="Visit ${restaurant.title} website">🌐</button>
                        <button class="item-action-btn directions-btn" data-location="${restaurant.location}" 
                                title="Get directions" aria-label="Get directions to ${restaurant.title}">🗺️</button>
                    </div>
                    <div class="item-image">${restaurant.image}</div>
                    <div class="item-content">
                        <div class="item-title">${restaurant.title}</div>
                        <div class="item-description">${restaurant.description}</div>
                        <div class="restaurant-meta">
                            <span class="location">📍 ${restaurant.location}</span>
                            <span class="price">💰 ${restaurant.price}</span>
                            <span class="rating">⭐ ${restaurant.rating}</span>
                        </div>
                        <div class="item-tags">
                            ${restaurant.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners after creating elements
            restaurantsGrid.querySelectorAll('.restaurant-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    const title = item.dataset.restaurant;
                    const idx = item.dataset.index;
                    this.restaurantClicked(title, parseInt(idx));
                });
            });
            
            restaurantsGrid.querySelectorAll('.call-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.callRestaurant(btn.dataset.phone);
                });
            });
            
            restaurantsGrid.querySelectorAll('.website-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.visitWebsite(btn.dataset.website);
                });
            });
            
            restaurantsGrid.querySelectorAll('.directions-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.getDirections(btn.dataset.location);
                });
            });
        }
    }

    loadPhotographyContent() {
        this.loadRouteBasedPhotoSpots();
    }
    
    loadRouteBasedPhotoSpots() {
        const photoSpotsGrid = document.getElementById('photo-spots-list');
        if (!photoSpotsGrid) return;
        
        // Clear existing content
        photoSpotsGrid.innerHTML = '';
        
        let photoSpots = [];
        
        if (this.currentAgentResult && this.currentAgentResult.cities) {
            photoSpots = this.generatePhotoSpotsFromRoute();
        } else {
            photoSpots = this.getGenericPhotoSpots();
        }
        
        if (photoSpots.length === 0) {
            photoSpotsGrid.innerHTML = '<div class="no-content">No photo spots found for this route.</div>';
            return;
        }
        
        photoSpotsGrid.innerHTML = photoSpots.map(spot => `
            <div class="photo-spot-item" onclick="spotlightController.photoSpotClicked('${spot.title}')">
                <div class="item-image">${spot.image}</div>
                <div class="item-content">
                    <div class="item-title">${spot.title}</div>
                    <div class="item-description">${spot.description}</div>
                    <div class="item-location">📍 ${spot.location}</div>
                    <div class="item-tags">
                        ${spot.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    generatePhotoSpotsFromRoute() {
        const cities = this.currentAgentResult.cities || [];
        const agentType = this.currentAgentResult.agentType;
        const photoSpots = [];
        
        cities.forEach(city => {
            const citySpots = this.getCityPhotoSpots(city.name, agentType);
            photoSpots.push(...citySpots);
        });
        
        return photoSpots.length > 0 ? photoSpots : this.getGenericPhotoSpots();
    }
    
    getCityPhotoSpots(cityName, agentType) {
        const cityPhotoSpots = {
            'Nice': [
                { type: 'golden', title: 'Promenade des Anglais Sunset', image: '🌅', description: 'Golden hour along the famous waterfront' },
                { type: 'blue', title: 'Castle Hill Blue Hour', image: '🌆', description: 'Panoramic city views during blue hour' },
                { type: 'architecture', title: 'Old Town Colors', image: '🏠', description: 'Colorful buildings in Vieux Nice' }
            ],
            'Cannes': [
                { type: 'golden', title: 'La Croisette Golden Hour', image: '🌅', description: 'Luxury hotels and palm trees at sunset' },
                { type: 'architecture', title: 'Film Festival Palace', image: '🎬', description: 'Iconic red carpet steps' },
                { type: 'blue', title: 'Old Port Blue Hour', image: '🚤', description: 'Luxury yachts and harbor lights' }
            ],
            'Monaco': [
                { type: 'golden', title: 'Monte Carlo Casino', image: '🎰', description: 'Luxury and glamour in golden light' },
                { type: 'architecture', title: 'Prince\'s Palace', image: '🏰', description: 'Royal architecture and gardens' },
                { type: 'blue', title: 'Monaco Harbor', image: '🚤', description: 'Superyachts and city lights at dusk' }
            ],
            'Marseille': [
                { type: 'golden', title: 'Old Port Sunset', image: '🌅', description: 'Historic harbor with fishing boats' },
                { type: 'architecture', title: 'Notre-Dame de la Garde', image: '⛪', description: 'Basilica overlooking the city' },
                { type: 'nature', title: 'Calanques Views', image: '🏔️', description: 'Dramatic limestone cliffs and turquoise water' }
            ],
            'Avignon': [
                { type: 'golden', title: 'Palace of the Popes', image: '🏛️', description: 'Gothic architecture in warm light' },
                { type: 'architecture', title: 'Pont d\'Avignon', image: '🌉', description: 'Famous medieval bridge over the Rhône' },
                { type: 'blue', title: 'Ramparts Walk', image: '🌆', description: 'Medieval city walls at twilight' }
            ],
            'Turin': [
                { type: 'architecture', title: 'Mole Antonelliana', image: '🏛️', description: 'Iconic tower and city symbol' },
                { type: 'golden', title: 'Piazza Castello', image: '🌅', description: 'Royal architecture in golden hour' },
                { type: 'blue', title: 'Po River Views', image: '🌊', description: 'River and Alps backdrop at dusk' }
            ],
            'Florence': [
                { type: 'golden', title: 'Piazzale Michelangelo', image: '🌅', description: 'Classic Florence skyline at sunset' },
                { type: 'architecture', title: 'Duomo Cathedral', image: '⛪', description: 'Renaissance dome and facade details' },
                { type: 'blue', title: 'Ponte Vecchio', image: '🌉', description: 'Medieval bridge over the Arno at twilight' }
            ],
            'Venice': [
                { type: 'golden', title: 'St. Mark\'s Square Sunrise', image: '🌅', description: 'Iconic square without crowds' },
                { type: 'blue', title: 'Grand Canal Blue Hour', image: '🚤', description: 'Gondolas and palazzi in evening light' },
                { type: 'architecture', title: 'Rialto Bridge', image: '🌉', description: 'Famous bridge and canal views' }
            ]
        };
        
        const spots = cityPhotoSpots[cityName] || [];
        
        return spots.map(spot => ({
            image: spot.image,
            title: `${spot.title} - ${cityName}`,
            description: spot.description,
            location: cityName,
            tags: this.getPhotoSpotTags(spot.type, agentType)
        }));
    }
    
    getPhotoSpotTags(spotType, agentType) {
        const baseTags = {
            golden: ['Golden Hour', 'Sunset', 'Warm Light'],
            blue: ['Blue Hour', 'Twilight', 'Night'],
            architecture: ['Architecture', 'Historic', 'Urban'],
            nature: ['Nature', 'Landscape', 'Scenic']
        };
        
        const agentTags = {
            adventure: ['Outdoor', 'Active'],
            romantic: ['Romantic', 'Intimate'],
            cultural: ['Cultural', 'Historic'],
            foodie: ['Local', 'Authentic'],
            family: ['Family-Friendly', 'Accessible'],
            luxury: ['Premium', 'Exclusive']
        };
        
        return [...(baseTags[spotType] || []), ...(agentTags[agentType] || [])];
    }
    
    getGenericPhotoSpots() {
        return [
            {
                image: '📸',
                title: 'Scenic Viewpoints',
                description: 'Beautiful landscapes and panoramic views along your route',
                location: 'Various locations',
                tags: ['Scenic', 'Landscape', 'Views']
            },
            {
                image: '🏛️',
                title: 'Historic Architecture',
                description: 'Architectural gems and historic buildings',
                location: 'City centers',
                tags: ['Architecture', 'Historic', 'Culture']
            },
            {
                image: '🌅',
                title: 'Golden Hour Spots',
                description: 'Perfect locations for sunset and sunrise photography',
                location: 'Elevated areas',
                tags: ['Golden Hour', 'Sunset', 'Photography']
            }
        ];
    }

    // ===== DARK MODE FUNCTIONALITY =====
    setupDarkModeToggle() {
        const toggleBtn = document.getElementById('dark-mode-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        const spotlightPage = document.getElementById('route-spotlight-page');
        const toggleBtn = document.getElementById('dark-mode-toggle');
        
        if (this.isDarkMode) {
            spotlightPage?.classList.add('dark-mode');
            toggleBtn?.classList.add('active');
            toggleBtn.textContent = '☀️';
        } else {
            spotlightPage?.classList.remove('dark-mode');
            toggleBtn?.classList.remove('active');
            toggleBtn.textContent = '🌙';
        }

        this.showNotification('Dark mode ' + (this.isDarkMode ? 'enabled' : 'disabled'), 'info');
    }

    // ===== AI ASSISTANT FUNCTIONALITY =====
    setupAIAssistant() {
        const assistantToggle = document.getElementById('ai-assistant-toggle');
        const sidebar = document.getElementById('ai-assistant-sidebar');
        const closeAssistant = document.getElementById('close-assistant');
        const sendBtn = document.getElementById('send-chat');
        const chatInput = document.getElementById('chat-input');

        assistantToggle?.addEventListener('click', () => {
            this.toggleAIAssistant();
        });

        closeAssistant?.addEventListener('click', () => {
            this.closeAIAssistant();
        });

        sendBtn?.addEventListener('click', () => {
            this.sendChatMessage();
        });

        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Quick suggestion buttons
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleQuickSuggestion(btn.dataset.action);
            });
        });
    }

    toggleAIAssistant() {
        this.assistantOpen = !this.assistantOpen;
        const sidebar = document.getElementById('ai-assistant-sidebar');
        
        if (this.assistantOpen) {
            sidebar?.classList.add('active');
            this.showWelcomeMessage();
        } else {
            sidebar?.classList.remove('active');
        }
    }

    closeAIAssistant() {
        this.assistantOpen = false;
        const sidebar = document.getElementById('ai-assistant-sidebar');
        sidebar?.classList.remove('active');
    }

    showWelcomeMessage() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages && chatMessages.children.length === 0) {
            this.addChatMessage('assistant', '👋 Hello! I\'m your travel assistant. I can help you with weather updates, traffic information, nearby attractions, and local tips for your trip!');
        }
    }

    async sendChatMessage() {
        const chatInput = document.getElementById('chat-input');
        if (chatInput && chatInput.value.trim()) {
            const message = chatInput.value.trim();
            this.addChatMessage('user', message);
            chatInput.value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            try {
                // Use actual AI to respond to the message
                const aiFeatures = (await import('./aiFeatures.js')).aiFeatures;
                const contextualPrompt = this.createContextualPrompt(message);
                const response = await aiFeatures.callPerplexityAPI(contextualPrompt, true);
                
                this.hideTypingIndicator();
                this.addChatMessage('assistant', response || 'I\'m having trouble processing that right now. Please try again!');
            } catch (error) {
                console.error('AI chat error:', error);
                this.hideTypingIndicator();
                
                // Fallback to contextual responses based on route data
                const contextualResponse = this.getContextualResponse(message);
                this.addChatMessage('assistant', contextualResponse);
            }
        }
    }
    
    createContextualPrompt(message) {
        const routeContext = this.getRouteContext();
        return `You are a travel assistant helping with a road trip. Current route context: ${routeContext}. User question: "${message}". Provide a helpful, concise response about this specific trip.`;
    }
    
    getRouteContext() {
        if (this.currentAgentResult) {
            const cities = this.currentAgentResult.cities?.map(c => c.name).join(' → ') || 'various destinations';
            const agentType = this.currentAgentResult.agentType || 'general';
            return `${agentType} trip from ${cities}`;
        }
        return 'road trip through France and Italy';
    }
    
    getContextualResponse(message) {
        const messageLower = message.toLowerCase();
        
        if (messageLower.includes('weather')) {
            return 'Perfect weather for your trip! ☀️ Expect sunny skies in most locations. Pack layers for evening temperatures.';
        } else if (messageLower.includes('traffic') || messageLower.includes('road')) {
            return '🚗 Traffic is generally light on your route. Avoid major cities during rush hours (7-9 AM, 5-7 PM).';
        } else if (messageLower.includes('food') || messageLower.includes('restaurant')) {
            return '🍽️ Your route has excellent dining options! Each city offers unique specialties. Check the Food & Wine tab for recommendations.';
        } else if (messageLower.includes('photo') || messageLower.includes('picture')) {
            return '📸 Great photo opportunities along your route! Check the Photo Spots tab for the best locations and timing.';
        } else if (messageLower.includes('time') || messageLower.includes('long')) {
            const totalTime = this.routeData?.totalTime || '4-6';
            return `⏱️ Your trip will take approximately ${totalTime} hours of driving time, plus stops and activities.`;
        } else {
            return 'I\'m here to help with your trip! Ask me about weather, traffic, restaurants, photo spots, or anything else about your route.';
        }
    }
    
    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const indicator = document.createElement('div');
            indicator.className = 'chat-message assistant typing-indicator';
            indicator.id = 'typing-indicator';
            indicator.innerHTML = '<span class="typing-dots">...</span>';
            chatMessages.appendChild(indicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    addChatMessage(sender, message) {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${sender}`;
            messageDiv.textContent = message;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    handleQuickSuggestion(action) {
        const suggestions = {
            weather: 'What\'s the weather like for my trip?',
            traffic: 'Any traffic updates for my route?',
            nearby: 'Show me nearby points of interest',
            tips: 'Give me some local tips'
        };

        if (suggestions[action]) {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = suggestions[action];
                this.sendChatMessage();
            }
        }
    }

    // ===== MAP CONTROLS =====
    setupMapControls() {
        const fullscreenBtn = document.getElementById('fullscreen-map');
        const resetBtn = document.getElementById('reset-map-view');

        fullscreenBtn?.addEventListener('click', () => {
            this.toggleFullscreenMap();
        });

        resetBtn?.addEventListener('click', () => {
            this.resetMapView();
        });
    }

    toggleFullscreenMap() {
        const mapSection = document.querySelector('.spotlight-map-section');
        if (mapSection) {
            if (mapSection.classList.contains('fullscreen')) {
                mapSection.classList.remove('fullscreen');
                document.body.classList.remove('map-fullscreen');
            } else {
                mapSection.classList.add('fullscreen');
                document.body.classList.add('map-fullscreen');
            }
        }
    }

    resetMapView() {
        // Reset map to initial view
        this.showNotification('Map view reset', 'info');
    }

    // ===== JOURNEY PROGRESS =====
    setupJourneyProgress() {
        this.updateJourneyProgress(0);
        // Simulate progress updates
        setTimeout(() => this.updateJourneyProgress(25), 1000);
        setTimeout(() => this.updateJourneyProgress(75), 2000);
        setTimeout(() => this.updateJourneyProgress(100), 3000);
    }

    updateJourneyProgress(percentage) {
        const progressFill = document.getElementById('journey-progress-fill');
        const progressStops = document.getElementById('journey-progress-stops');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        this.updateProgressWithRoute(percentage);
    }
    
    updateProgressWithRoute(percentage = 0) {
        const progressStops = document.getElementById('journey-progress-stops');
        if (!progressStops) return;
        
        let stops = [];
        
        if (this.currentAgentResult && this.currentAgentResult.cities) {
            stops = this.currentAgentResult.cities.map(city => city.name || city);
        } else {
            stops = ['Start', 'Destination'];
        }
        
        if (stops.length < 2) {
            stops = ['Start', 'Destination'];
        }
        
        progressStops.innerHTML = stops.map((stop, index) => {
            const stopPercentage = stops.length > 1 ? (index / (stops.length - 1)) * 100 : 50;
            const isCompleted = percentage >= stopPercentage;
            const isCurrent = percentage >= stopPercentage - 15 && percentage < stopPercentage + 15;
            
            return `<div class="progress-stop ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}" 
                         title="${stop}" 
                         style="left: ${stopPercentage}%">
                        <div class="stop-label">${stop}</div>
                    </div>`;
        }).join('');
    }

    // ===== FILTER FUNCTIONALITY =====
    setupFilters() {
        // Cuisine filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterCuisine(btn.dataset.cuisine);
            });
        });

        // Photo time filters
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterPhotoTime(btn.dataset.time);
            });
        });
    }

    filterCuisine(cuisine) {
        const restaurants = document.querySelectorAll('.restaurant-item');
        restaurants.forEach(restaurant => {
            if (cuisine === 'all') {
                restaurant.style.display = 'block';
            } else {
                const tags = restaurant.querySelectorAll('.item-tag');
                const hasTag = Array.from(tags).some(tag => 
                    tag.textContent.toLowerCase().includes(cuisine.toLowerCase())
                );
                restaurant.style.display = hasTag ? 'block' : 'none';
            }
        });
    }

    filterPhotoTime(time) {
        const photoSpots = document.querySelectorAll('.photo-spot-item');
        photoSpots.forEach(spot => {
            if (time === 'all') {
                spot.style.display = 'block';
            } else {
                const tags = spot.querySelectorAll('.item-tag');
                const hasTag = Array.from(tags).some(tag => 
                    tag.textContent.toLowerCase().includes(time)
                );
                spot.style.display = hasTag ? 'block' : 'none';
            }
        });
    }

    // ===== ANIMATIONS & EFFECTS =====
    setupAnimations() {
        // Add entrance animations when page loads
        const page = document.getElementById('route-spotlight-page');
        if (page) {
            page.addEventListener('transitionend', () => {
                this.triggerEntranceAnimations();
            });
        }
    }

    triggerEntranceAnimations() {
        const cards = document.querySelectorAll('.gradient-card, .highlights-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'slideInFromRight 0.6s ease-out forwards';
            }, index * 100);
        });
    }

    triggerTabAnimation(panel) {
        if (panel) {
            panel.style.animation = 'none';
            setTimeout(() => {
                panel.style.animation = 'slideInFromRight 0.4s ease-out';
            }, 10);
        }
    }

    // ===== INTERACTIVE HANDLERS =====
    highlightClicked(title) {
        this.showNotification(`Exploring ${title}...`, 'info');
        this.triggerConfetti();
    }

    restaurantClicked(name) {
        this.showNotification(`Opening ${name} details...`, 'info');
    }

    photoSpotClicked(name) {
        this.showNotification(`Viewing ${name} gallery...`, 'info');
    }

    // ===== UTILITY FUNCTIONS =====
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type} show`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${type === 'info' ? 'ℹ️' : '✅'}</div>
                <div class="notification-text">
                    <div class="notification-message">${message}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    triggerConfetti() {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-particle';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = Math.random() * 2 + 2 + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (document.body.contains(confetti)) {
                    document.body.removeChild(confetti);
                }
            }, 5000);
        }
    }

    // ===== NEW FUNCTIONAL METHODS =====

    setupExportFunctions() {
        console.log('🔧 Setting up export functions and button listeners');
        
        // Remove existing event listeners first
        this.removeExistingListeners();
        
        // Export to Google Maps
        const googleMapsBtn = document.getElementById('export-google-maps');
        if (googleMapsBtn) {
            googleMapsBtn.removeEventListener('click', this.exportToGoogleMaps);
            googleMapsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🗺️ Export to Google Maps clicked');
                this.exportToGoogleMaps();
            });
        }

        // Export to PDF
        const pdfBtn = document.getElementById('export-pdf');
        if (pdfBtn) {
            pdfBtn.removeEventListener('click', this.exportToPDF);
            pdfBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('📄 Export to PDF clicked');
                this.exportToPDF();
            });
        }

        // Email sharing
        const emailBtn = document.getElementById('export-email');
        if (emailBtn) {
            emailBtn.removeEventListener('click', this.shareViaEmail);
            emailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('✉️ Share via email clicked');
                this.shareViaEmail();
            });
        }

        // Save route
        const saveBtn = document.getElementById('save-route');
        if (saveBtn) {
            saveBtn.removeEventListener('click', this.saveRoute);
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('💾 Save route clicked');
                this.saveRoute();
            });
        }

        // Add highlight
        const addHighlightBtn = document.getElementById('add-highlight');
        if (addHighlightBtn) {
            addHighlightBtn.removeEventListener('click', this.addCustomHighlight);
            addHighlightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('⭐ Add highlight clicked');
                this.addCustomHighlight();
            });
        }

        // Setup drag and drop
        this.setupDragAndDrop();

        // Setup itinerary controls
        this.setupItineraryControls();
        
        console.log('✓ Export functions setup complete');
    }
    
    removeExistingListeners() {
        // Remove any existing listeners to prevent duplicates
        const buttons = [
            'export-google-maps', 'export-pdf', 'export-email', 'save-route', 'add-highlight'
        ];
        
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.replaceWith(btn.cloneNode(true));
            }
        });
    }

    exportToGoogleMaps() {
        console.log('🗺️ Exporting route to Google Maps');
        
        let waypoints = [];
        
        // Use actual route data if available
        if (this.currentAgentResult && this.currentAgentResult.cities) {
            waypoints = this.currentAgentResult.cities.map(city => {
                const name = city.name || city;
                return `${name}, ${this.getCityCountry(name)}`;
            });
        } else {
            // Fallback waypoints
            waypoints = [
                'Aix-en-Provence, France',
                'Nice, France'
            ];
        }
        
        console.log('Waypoints for Google Maps:', waypoints);

        const googleMapsUrl = `https://www.google.com/maps/dir/${waypoints.join('/')}/`;
        
        // Create a shareable link
        if (navigator.share) {
            navigator.share({
                title: `My ${this.currentAgentResult?.agent?.name || 'Road Trip'} Route`,
                text: 'Check out this amazing road trip route!',
                url: googleMapsUrl
            }).catch(err => {
                console.log('Share failed, opening in new tab instead');
                window.open(googleMapsUrl, '_blank');
            });
        } else {
            window.open(googleMapsUrl, '_blank');
        }

        this.showNotification('Route opened in Google Maps!', 'info');
        this.triggerConfetti();
    }
    
    getCityCountry(cityName) {
        const cityCountries = {
            'Nice': 'France', 'Cannes': 'France', 'Monaco': 'Monaco', 'Marseille': 'France',
            'Avignon': 'France', 'Aix-en-Provence': 'France', 'Turin': 'Italy', 
            'Florence': 'Italy', 'Venice': 'Italy', 'Rome': 'Italy', 'Genoa': 'Italy'
        };
        return cityCountries[cityName] || 'France';
    }

    async exportToPDF() {
        this.showNotification('Generating PDF itinerary...', 'info');

        // Simulate PDF generation (in a real app, this would call a server endpoint)
        setTimeout(() => {
            // Create a simple text representation for download
            const itineraryText = `
PROVENCE ROAD TRIP ITINERARY
=============================

Day 1: Aix-en-Provence
- Morning: Explore Cours Mirabeau
- Afternoon: Visit Musée Granet
- Evening: Dinner at Le Chaudron

Day 2: Avignon
- Morning: Palace of the Popes tour
- Afternoon: Walk the city walls
- Evening: Traditional Provençal dinner

Day 3: Wine Country
- Full day: Châteauneuf-du-Pape wine tasting
- Multiple cellar visits included

Day 4: Coastal Beauty
- Morning: Calanques National Park
- Afternoon: Cassis harbor exploration
- Evening: Seafood dinner by the port

Day 5: French Riviera
- Arrival in Nice
- Promenade des Anglais walk
- Beach time and local markets

Total Distance: 285 km
Estimated Cost: €245 per person
Best Season: Spring-Summer

Generated on ${new Date().toLocaleDateString()}
            `;

            const blob = new Blob([itineraryText], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'provence-road-trip-itinerary.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showNotification('PDF itinerary downloaded!', 'success');
        }, 2000);
    }

    shareViaEmail() {
        const subject = encodeURIComponent('Amazing Provence Road Trip Itinerary');
        const body = encodeURIComponent(`
Check out this incredible road trip through Provence!

🗺️ Route: Aix-en-Provence → Avignon → Wine Country → Cassis → Nice
📅 Duration: 5 days
💰 Estimated cost: €245 per person

Highlights include:
🏛️ Palace of the Popes in Avignon
🍷 Wine tasting in Châteauneuf-du-Pape  
🌅 Stunning Calanques National Park
🎨 Art and culture in Aix-en-Provence

View the full interactive itinerary: ${window.location.href}

Happy travels! ✈️
        `);

        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
        window.location.href = mailtoUrl;

        this.showNotification('Email composer opened!', 'success');
    }

    saveRoute() {
        const routeData = {
            id: Date.now(),
            name: 'Provence Discovery Tour',
            waypoints: ['Aix-en-Provence', 'Avignon', 'Châteauneuf-du-Pape', 'Cassis', 'Nice'],
            highlights: 4,
            duration: '5 days',
            savedAt: new Date().toISOString()
        };

        // Save to localStorage (in a real app, this would sync to a server)
        const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
        savedRoutes.push(routeData);
        localStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));

        this.showNotification('Route saved to your favorites!', 'success');
        this.triggerConfetti();
    }

    // Highlight interactions
    bookHighlight(index) {
        const highlights = [
            { name: 'Palace of the Popes', bookingUrl: 'https://www.palais-des-papes.com/en/prepare-your-visit' },
            { name: 'Châteauneuf-du-Pape', bookingUrl: 'https://www.chateauneuf-du-pape-tourisme.fr/' },
            { name: 'Calanques National Park', bookingUrl: 'https://www.calanques-parcnational.fr/' },
            { name: 'Musée Granet', bookingUrl: 'https://museegranet-aixenprovence.fr/' }
        ];

        const highlight = highlights[index];
        if (highlight) {
            window.open(highlight.bookingUrl, '_blank');
            this.showNotification(`Opening booking for ${highlight.name}...`, 'info');
        }
    }

    shareHighlight(index) {
        const highlights = [
            { name: 'Palace of the Popes', location: 'Avignon' },
            { name: 'Châteauneuf-du-Pape', location: 'Wine Country' },
            { name: 'Calanques National Park', location: 'Cassis' },
            { name: 'Musée Granet', location: 'Aix-en-Provence' }
        ];

        const highlight = highlights[index];
        if (highlight && navigator.share) {
            navigator.share({
                title: highlight.name,
                text: `Check out this amazing place: ${highlight.name} in ${highlight.location}!`,
                url: window.location.href
            });
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(`${highlight.name} in ${highlight.location} - ${window.location.href}`);
            this.showNotification('Link copied to clipboard!', 'success');
        }
    }

    // Restaurant interactions
    callRestaurant(phone) {
        window.location.href = `tel:${phone}`;
        this.showNotification('Opening phone dialer...', 'info');
    }

    visitWebsite(website) {
        window.open(website, '_blank');
        this.showNotification('Opening restaurant website...', 'info');
    }

    getDirections(location) {
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
        window.open(mapsUrl, '_blank');
        this.showNotification(`Getting directions to ${location}...`, 'info');
    }

    // Drag and Drop functionality
    setupDragAndDrop() {
        const dragModeToggle = document.getElementById('drag-mode');
        const sortableContainer = document.getElementById('spotlight-itinerary');

        dragModeToggle?.addEventListener('change', (e) => {
            if (e.target.checked) {
                sortableContainer?.classList.add('drag-mode');
                this.enableDragAndDrop();
                this.showNotification('Drag mode enabled - you can now reorder activities!', 'info');
            } else {
                sortableContainer?.classList.remove('drag-mode');
                this.disableDragAndDrop();
                this.showNotification('Drag mode disabled', 'info');
            }
        });
    }

    enableDragAndDrop() {
        const itineraryDays = document.querySelectorAll('.itinerary-day');
        
        itineraryDays.forEach(day => {
            day.draggable = true;
            
            day.addEventListener('dragstart', (e) => {
                day.classList.add('dragging');
                e.dataTransfer.setData('text/html', day.outerHTML);
                e.dataTransfer.effectAllowed = 'move';
            });

            day.addEventListener('dragend', () => {
                day.classList.remove('dragging');
            });

            day.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            day.addEventListener('drop', (e) => {
                e.preventDefault();
                // Handle reordering logic here
                this.showNotification('Activities reordered!', 'success');
            });
        });
    }

    disableDragAndDrop() {
        const itineraryDays = document.querySelectorAll('.itinerary-day');
        itineraryDays.forEach(day => {
            day.draggable = false;
            day.replaceWith(day.cloneNode(true)); // Remove all event listeners
        });
    }

    // Itinerary controls
    setupItineraryControls() {
        document.getElementById('add-stop')?.addEventListener('click', () => {
            this.addCustomStop();
        });

        document.getElementById('optimize-route')?.addEventListener('click', () => {
            this.optimizeRoute();
        });
    }

    addCustomStop() {
        const stopName = prompt('Enter the name of the stop you\'d like to add:');
        if (stopName && stopName.trim()) {
            this.showNotification(`Added "${stopName}" to your itinerary!`, 'success');
            // In a real app, this would update the itinerary data and re-render
            this.triggerConfetti();
        }
    }

    optimizeRoute() {
        this.showNotification('Optimizing route for minimum travel time...', 'info');
        
        // Simulate route optimization
        setTimeout(() => {
            this.showNotification('Route optimized! Saved 45 minutes of travel time.', 'success');
            // Update statistics
            document.getElementById('total-driving-time').textContent = '4.0h';
            this.triggerConfetti();
        }, 2000);
    }

    addCustomHighlight() {
        const highlightName = prompt('Enter a custom highlight for your trip:');
        if (highlightName && highlightName.trim()) {
            this.showNotification(`Added "${highlightName}" to your highlights!`, 'success');
            this.triggerConfetti();
        }
    }

    // Enhanced AI Assistant with route-specific suggestions
    handleQuickSuggestion(action) {
        const routeSpecificSuggestions = this.getRouteSpecificSuggestions();
        const suggestion = routeSpecificSuggestions[action];
        
        if (suggestion) {
            this.addChatMessage('assistant', suggestion.message);
            if (suggestion.followUp) {
                setTimeout(() => {
                    this.addChatMessage('assistant', suggestion.followUp);
                }, 1000);
            }
        }
    }
    
    getRouteSpecificSuggestions() {
        const cities = this.currentAgentResult?.cities?.map(c => c.name).join(', ') || 'your destinations';
        const agentType = this.currentAgentResult?.agentType || 'general';
        const distance = this.routeData?.totalDistance || 'estimated';
        
        return {
            weather: {
                message: `Perfect weather for your ${agentType} trip! ☀️ Expect sunny skies along your ${distance}km route through ${cities}. Pack layers for elevation changes.`,
                followUp: 'Would you like specific weather for each stop?'
            },
            traffic: {
                message: `🚗 Traffic update for your route through ${cities}: Main highways are clear. Avoid city centers during rush hours (7-9 AM, 5-7 PM).`,
                followUp: 'Need alternative routes for any segment?'
            },
            nearby: {
                message: `📍 Hidden gems near ${cities}: Local markets (Saturday mornings), scenic viewpoints, artisan workshops, and off-the-beaten-path attractions.`,
                followUp: 'Want detailed info on any of these locations?'
            },
            tips: {
                message: `💡 Expert tips for ${cities}: Book restaurants in advance, parking can be limited in historic centers. Try regional specialties and respect local customs!`,
                followUp: 'Need more specific advice for any location?'
            }
        };
    }
}

// Initialize the controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spotlightController = new SpotlightController();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpotlightController;
}