/**
 * Trip Types Module - Handles 6 different themed itineraries
 * Each trip type has its own color scheme, icon, and specialized content
 */
import { UIEnhancements } from './uiEnhancements.js';

export class TripTypesManager {
    constructor(routeManager, aiFeatures) {
        this.routeManager = routeManager;
        this.aiFeatures = aiFeatures;
        this.currentRoute = null;
        this.miniMaps = new Map();
        
        // Define the 6 trip types with colors, icons, and themes
        this.tripTypes = {
            adventure: {
                name: 'Adventure Trip',
                icon: '<img src="/adventure.png" alt="Adventure" style="width: 20px; height: 20px; vertical-align: middle;">',
                color: '#28a745',
                gradient: 'linear-gradient(135deg, #28a745, #20c997)',
                description: 'Hiking, outdoor activities, and adrenaline experiences',
                keywords: ['hiking', 'climbing', 'adventure sports', 'outdoor activities', 'nature trails']
            },
            romantic: {
                name: 'Romantic Getaway',
                icon: '💕',
                color: '#e91e63',
                gradient: 'linear-gradient(135deg, #e91e63, #f8bbd9)',
                description: 'Intimate restaurants, sunset views, and couples activities',
                keywords: ['romantic dining', 'sunset spots', 'couples activities', 'wine tasting', 'intimate venues']
            },
            cultural: {
                name: 'Cultural Journey',
                icon: '🏛️',
                color: '#6f42c1',
                gradient: 'linear-gradient(135deg, #6f42c1, #b794f6)',
                description: 'Museums, historical sites, and artistic experiences',
                keywords: ['museums', 'historical sites', 'art galleries', 'architecture', 'cultural events']
            },
            foodie: {
                name: 'Culinary Experience',
                icon: '🍽️',
                color: '#fd7e14',
                gradient: 'linear-gradient(135deg, #fd7e14, #ffc107)',
                description: 'Local cuisine, markets, and gastronomic adventures',
                keywords: ['local restaurants', 'food markets', 'cooking classes', 'wine tours', 'culinary specialties']
            },
            family: {
                name: 'Family Adventure',
                icon: '👨‍👩‍👧‍👦',
                color: '#17a2b8',
                gradient: 'linear-gradient(135deg, #17a2b8, #6cc3d0)',
                description: 'Kid-friendly activities and family bonding experiences',
                keywords: ['family activities', 'parks', 'kid-friendly', 'educational', 'safe attractions']
            },
            luxury: {
                name: 'Luxury Escape',
                icon: '✨',
                color: '#6610f2',
                gradient: 'linear-gradient(135deg, #6610f2, #9d5fff)',
                description: 'Premium experiences, luxury hotels, and exclusive venues',
                keywords: ['luxury hotels', 'premium experiences', 'exclusive venues', 'spa treatments', 'fine dining']
            }
        };
        
        this.initializeEventListeners();
    }
    
    /**
     * Initialize event listeners for trip types functionality
     */
    initializeEventListeners() {
        // Show trip types button
        const showTripTypesBtn = document.getElementById('show-trip-types');
        if (showTripTypesBtn) {
            showTripTypesBtn.addEventListener('click', () => this.showTripTypesModal());
        }
        
        // Close buttons
        const closeTripTypes = document.getElementById('close-trip-types');
        if (closeTripTypes) {
            closeTripTypes.addEventListener('click', () => this.closeTripTypesModal());
        }
        
        const closeItinerary = document.getElementById('close-itinerary');
        if (closeItinerary) {
            closeItinerary.addEventListener('click', () => this.closeItineraryModal());
        }
        
        // Close modals when clicking outside
        document.getElementById('trip-types-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeTripTypesModal();
        });
        
        document.getElementById('itinerary-modal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeItineraryModal();
        });
        
        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTripTypesModal();
                this.closeItineraryModal();
            }
        });
    }
    
    /**
     * Set the current route for generating trip types
     */
    setCurrentRoute(route) {
        this.currentRoute = route;
        
        // Generate route coordinates for mini maps if not available
        if (route && !route.routeCoordinates) {
            route.routeCoordinates = route.route.map(city => [city.lat, city.lon]);
        }
        
        // Show the trip types section in sidebar
        const tripTypesSection = document.getElementById('trip-types-section');
        if (tripTypesSection && route) {
            tripTypesSection.style.display = 'block';
        }
    }
    
    /**
     * Set all agent results for display in trip types
     */
    setAllAgentResults(agentResults) {
        this.agentResults = agentResults;
        
        // Update trip types display to show real results instead of same route
        this.updateTripTypesWithAgentResults();
    }
    
    /**
     * Update trip types display with actual agent results
     */
    updateTripTypesWithAgentResults() {
        if (!this.agentResults || this.agentResults.size === 0) {
            return;
        }
        
        
        // This will be called when user opens the trip types modal
        // The agent results will be used instead of generating new ones
    }
    
    /**
     * Show the trip types selection modal
     */
    showTripTypesModal() {
        if (!this.currentRoute) {
            alert('Please calculate a route first!');
            return;
        }
        
        this.generateTripTypeCards();
        document.getElementById('trip-types-modal').style.display = 'block';
    }
    
    /**
     * Close the trip types modal
     */
    closeTripTypesModal() {
        document.getElementById('trip-types-modal').style.display = 'none';
    }
    
    /**
     * Close the itinerary modal
     */
    closeItineraryModal() {
        document.getElementById('itinerary-modal').style.display = 'none';
        
        // Clean up mini map
        const miniMapContainer = document.getElementById('itinerary-mini-map');
        if (miniMapContainer && this.currentMiniMap) {
            miniMapContainer.innerHTML = '';
            this.currentMiniMap = null;
        }
    }
    
    /**
     * Generate trip type cards in the modal
     */
    generateTripTypeCards() {
        const container = document.getElementById('trip-types-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(this.tripTypes).forEach(([key, tripType]) => {
            const card = this.createTripTypeCard(key, tripType);
            container.appendChild(card);
        });
    }
    
    /**
     * Create a single trip type card
     */
    createTripTypeCard(key, tripType) {
        const card = document.createElement('div');
        card.className = 'trip-type-card';
        card.style.background = tripType.gradient;
        
        // Create mini map for this trip type
        const miniMapId = `mini-map-${key}`;
        
        card.innerHTML = `
            <div class="trip-type-header">
                <span class="trip-type-icon">${tripType.icon}</span>
                <h3 class="trip-type-name">${tripType.name}</h3>
            </div>
            <div class="trip-type-mini-map" id="${miniMapId}"></div>
            <div class="trip-type-description">
                <p>${tripType.description}</p>
                <div class="trip-cities-preview">
                    ${this.getCitiesPreview()}
                </div>
            </div>
            <button class="select-trip-btn" data-trip-type="${key}">
                Select This Style
            </button>
        `;
        
        // Add click event to select this trip type
        const selectBtn = card.querySelector('.select-trip-btn');
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectTripType(key, tripType);
        });
        
        // Initialize mini map after the card is added to DOM
        setTimeout(() => this.initializeMiniMap(miniMapId, tripType.color), 100);
        
        return card;
    }
    
    /**
     * Get preview of cities for the trip type cards
     */
    getCitiesPreview() {
        if (!this.currentRoute || !this.currentRoute.route) return '';
        
        const cities = this.currentRoute.route.map(city => city.name).slice(0, 3);
        return cities.join(' → ') + (this.currentRoute.route.length > 3 ? '...' : '');
    }
    
    /**
     * Initialize a mini map for a trip type card
     */
    initializeMiniMap(containerId, color) {
        const container = document.getElementById(containerId);
        if (!container || !this.currentRoute) return;
        
        // Clear container and reset Leaflet internal state
        container.innerHTML = '';
        if (container._leaflet_id) {
            container._leaflet_id = null;
            delete container._leaflet_id;
        }
        
        try {
            const miniMap = L.map(containerId, {
                zoomControl: false,
                attributionControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false
            });
            
            // Add map tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
            
            // Add route markers and lines
            const route = this.currentRoute.route;
            const bounds = L.latLngBounds();
            
            // Add markers for each city
            route.forEach((city, index) => {
                const marker = L.circleMarker([city.lat, city.lon], {
                    radius: 4,
                    fillColor: color,
                    color: 'white',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(miniMap);
                
                bounds.extend([city.lat, city.lon]);
            });
            
            // Add route line
            if (this.currentRoute.routeCoordinates) {
                L.polyline(this.currentRoute.routeCoordinates, {
                    color: color,
                    weight: 2,
                    opacity: 0.7
                }).addTo(miniMap);
            }
            
            // Fit map to bounds
            miniMap.fitBounds(bounds, { padding: [5, 5] });
            
            // Store reference
            this.miniMaps.set(containerId, miniMap);
            
        } catch (error) {
            console.error('Error initializing mini map:', error);
            container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">🗺️ Map Preview</div>';
        }
    }
    
    /**
     * Select a trip type and show detailed itinerary
     */
    async selectTripType(key, tripType) {
        // Close trip types modal
        this.closeTripTypesModal();
        
        // Open itinerary modal
        this.showItineraryModal(key, tripType);
        
        // Generate detailed itinerary
        await this.generateDetailedItinerary(key, tripType);
    }
    
    /**
     * Show the detailed itinerary modal
     */
    showItineraryModal(key, tripType) {
        // Update modal header
        const tripTypeElement = document.getElementById('selected-trip-type');
        if (tripTypeElement) {
            tripTypeElement.innerHTML = `
                <span class="trip-icon" style="color: ${tripType.color}">${tripType.icon}</span>
                <span class="trip-name">${tripType.name}</span>
            `;
            tripTypeElement.style.background = tripType.gradient;
        }
        
        // Update cities
        const tripCitiesElement = document.getElementById('trip-cities');
        if (tripCitiesElement && this.currentRoute) {
            const cities = this.currentRoute.route.map(city => city.name);
            tripCitiesElement.textContent = cities.join(' → ');
        }
        
        // Initialize itinerary mini map
        this.initializeItineraryMiniMap(tripType.color);
        
        // Show modal
        document.getElementById('itinerary-modal').style.display = 'block';
        
        // Show loading state
        document.querySelector('.loading-itinerary').style.display = 'block';
        document.getElementById('itinerary-details').innerHTML = '';
    }
    
    /**
     * Initialize the mini map in the itinerary modal
     */
    initializeItineraryMiniMap(color) {
        const container = document.getElementById('itinerary-mini-map');
        if (!container || !this.currentRoute) return;
        
        // Clean up existing map and reset Leaflet internal state
        container.innerHTML = '';
        if (container._leaflet_id) {
            container._leaflet_id = null;
            delete container._leaflet_id;
        }
        
        setTimeout(() => {
            try {
                const miniMap = L.map('itinerary-mini-map', {
                    zoomControl: false,
                    attributionControl: false,
                    dragging: false,
                    scrollWheelZoom: false,
                    doubleClickZoom: false,
                    boxZoom: false,
                    keyboard: false
                });
                
                // Add map tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
                
                // Add route
                const route = this.currentRoute.route;
                const bounds = L.latLngBounds();
                
                // Add markers
                route.forEach((city, index) => {
                    const isStart = index === 0;
                    const isEnd = index === route.length - 1;
                    
                    let markerColor = color;
                    let radius = 5;
                    
                    if (isStart || isEnd) {
                        radius = 7;
                    }
                    
                    L.circleMarker([city.lat, city.lon], {
                        radius: radius,
                        fillColor: markerColor,
                        color: 'white',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.9
                    }).addTo(miniMap);
                    
                    bounds.extend([city.lat, city.lon]);
                });
                
                // Add route line
                if (this.currentRoute.routeCoordinates) {
                    L.polyline(this.currentRoute.routeCoordinates, {
                        color: color,
                        weight: 3,
                        opacity: 0.8
                    }).addTo(miniMap);
                }
                
                // Fit bounds
                miniMap.fitBounds(bounds, { padding: [10, 10] });
                
                this.currentMiniMap = miniMap;
                
            } catch (error) {
                console.error('Error initializing itinerary mini map:', error);
                container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 0.9rem;">🗺️</div>';
            }
        }, 100);
    }
    
    /**
     * Generate detailed day-by-day itinerary using AI
     */
    async generateDetailedItinerary(key, tripType) {
        try {
            const route = this.currentRoute.route;
            const totalDays = Math.max(3, Math.ceil(route.length * 1.5)); // More days for detailed planning
            const cityNames = route.map(c => c.name).join(', ');
            const distance = this.currentRoute.totalDistance;
            
            // Create specialized prompt for this trip type
            const prompt = `Create a detailed ${totalDays}-day ${tripType.name.toLowerCase()} itinerary for this route: ${cityNames} (${distance}km total).
            
            This is a ${tripType.description.toLowerCase()} focused trip. Please emphasize: ${tripType.keywords.join(', ')}.
            
            For each day, provide:
            
            **Day X - [City Name]**
            - **Morning (9:00-12:00):** Specific activities with times and locations
            - **Afternoon (12:00-18:00):** Activities, lunch recommendations with restaurant names
            - **Evening (18:00-22:00):** Dinner and evening activities with specific venues
            - **Where to Stay:** Accommodation recommendations suited for ${tripType.name.toLowerCase()}
            - **Daily Budget:** Estimated costs for meals, activities, accommodation
            - **${tripType.name} Highlights:** Special experiences unique to this trip style
            
            Include:
            - Specific venue names, addresses when possible
            - Opening hours and reservation requirements
            - Transportation between locations
            - ${tripType.name} specific tips and insider information
            - Weather considerations and what to pack
            - Photo opportunities and must-see moments
            
            Make each day balanced with ${tripType.keywords.slice(0, 3).join(', ')} experiences. Provide practical, actionable details that someone can follow step-by-step.`;
            
            // Set current route for AI features
            this.aiFeatures.setCurrentRoute(this.currentRoute);
            
            // Get detailed itinerary from AI
            const itineraryContent = await this.aiFeatures.callPerplexityAPI(prompt);
            
            // Hide loading and show content
            document.querySelector('.loading-itinerary').style.display = 'none';
            
            // Format and display the itinerary
            this.displayItinerary(itineraryContent, tripType);
            
        } catch (error) {
            console.error('Error generating itinerary:', error);
            
            // Hide loading and show error
            document.querySelector('.loading-itinerary').style.display = 'none';
            
            // Show fallback itinerary
            this.showFallbackItinerary(key, tripType);
        }
    }
    
    /**
     * Display the formatted itinerary
     */
    displayItinerary(content, tripType) {
        const container = document.getElementById('itinerary-details');
        if (!container) return;
        
        // Format the content with enhanced styling
        const formattedContent = UIEnhancements.formatItineraryContent(content);
        container.innerHTML = formattedContent;
    }
    
    /**
     * Format itinerary content with proper HTML styling
     */
    formatItineraryContent(content, tripType) {
        // Split content into sections and format
        let formatted = content;
        
        // Format day headers
        formatted = formatted.replace(/\*\*Day (\d+)[^*]*\*\*/g, 
            `<div class="day-header" style="background: ${tripType.gradient};">
                <span class="day-number">Day $1</span>
                <span class="day-location">$&</span>
            </div>`);
        
        // Format time sections
        formatted = formatted.replace(/\*\*(Morning|Afternoon|Evening)[^*]*\*\*/g, 
            '<h4 class="time-section">$&</h4>');
        
        // Format other bold sections
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="section-title">$1</strong>');
        
        // Format lists
        formatted = formatted.replace(/^- (.+)$/gm, '<li class="itinerary-item">$1</li>');
        
        // Wrap consecutive list items in ul tags
        formatted = formatted.replace(/((?:<li class="itinerary-item">[^<]*<\/li>\s*)+)/g, '<ul class="itinerary-list">$1</ul>');
        
        // Format paragraphs
        formatted = formatted.split('\n\n').map(paragraph => {
            if (paragraph.trim() && !paragraph.includes('<div') && !paragraph.includes('<h4') && !paragraph.includes('<ul')) {
                return `<p class="itinerary-paragraph">${paragraph.trim()}</p>`;
            }
            return paragraph;
        }).join('\n\n');
        
        return `<div class="formatted-itinerary">${formatted}</div>`;
    }
    
    /**
     * Show fallback itinerary when AI is unavailable
     */
    showFallbackItinerary(key, tripType) {
        const container = document.getElementById('itinerary-details');
        if (!container || !this.currentRoute) return;
        
        const cities = this.currentRoute.route;
        const totalDays = Math.max(3, Math.ceil(cities.length * 1.5));
        
        let fallbackContent = `
            <div class="formatted-itinerary">
                <div class="day-header" style="background: ${tripType.gradient};">
                    <span class="day-number">Your ${tripType.name}</span>
                </div>
                <p class="itinerary-paragraph">
                    Experience the perfect ${tripType.description.toLowerCase()} through ${cities.map(c => c.name).join(', ')} 
                    over ${totalDays} unforgettable days.
                </p>
                
                <h4 class="time-section"><strong>Trip Highlights:</strong></h4>
                <ul class="itinerary-list">
        `;
        
        // Add trip-specific highlights based on keywords
        tripType.keywords.forEach(keyword => {
            fallbackContent += `<li class="itinerary-item">Discover amazing ${keyword} experiences</li>`;
        });
        
        fallbackContent += `
                </ul>
                
                <div class="day-header" style="background: ${tripType.gradient};">
                    <span class="day-number">Your Route</span>
                </div>
        `;
        
        // Add city-by-city breakdown
        cities.forEach((city, index) => {
            const dayNum = Math.ceil((index + 1) * totalDays / cities.length);
            fallbackContent += `
                <h4 class="time-section"><strong>Day ${dayNum} - ${city.name}, ${city.country}</strong></h4>
                <ul class="itinerary-list">
                    <li class="itinerary-item">Explore the best ${tripType.keywords[0]} in ${city.name}</li>
                    <li class="itinerary-item">Visit local ${tripType.keywords[1] || 'attractions'} and hidden gems</li>
                    <li class="itinerary-item">Experience authentic ${tripType.keywords[2] || 'culture'} and cuisine</li>
                </ul>
            `;
        });
        
        fallbackContent += `
                <div style="margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <p style="color: #6c757d; margin: 0;">
                        ✨ <em>For detailed AI-generated itinerary with specific venues, times, and recommendations, 
                        please ensure your internet connection is working and try again.</em>
                    </p>
                </div>
            </div>
        `;
        
        container.innerHTML = fallbackContent;
    }
}