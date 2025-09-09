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

    switchTab(tabName, index, buttons, panels, indicator) {
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
        this.loadTabContent(tabName);

        // Trigger animation
        this.triggerTabAnimation(targetPanel);
    }

    loadTabContent(tabName) {
        switch (tabName) {
            case 'overview':
                this.loadOverviewContent();
                break;
            case 'day-by-day':
                this.loadItineraryContent();
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
        // Load trip highlights
        const highlightsGrid = document.getElementById('trip-highlights');
        if (highlightsGrid && !highlightsGrid.hasChildNodes()) {
            const highlights = [
                {
                    icon: '🏛️',
                    title: 'Palace of the Popes',
                    description: 'Gothic palace in Avignon, UNESCO World Heritage site',
                    location: 'Avignon',
                    price: '€12',
                    rating: 4.5
                },
                {
                    icon: '🍷',
                    title: 'Châteauneuf-du-Pape',
                    description: 'Famous wine region with cellar tours and tastings',
                    location: 'Châteauneuf-du-Pape',
                    price: '€25',
                    rating: 4.8
                },
                {
                    icon: '🌅',
                    title: 'Calanques National Park',
                    description: 'Stunning limestone cliffs and turquoise waters',
                    location: 'Cassis',
                    price: 'Free',
                    rating: 4.9
                },
                {
                    icon: '🎨',
                    title: 'Musée Granet',
                    description: 'Fine arts museum with Cézanne collection',
                    location: 'Aix-en-Provence',
                    price: '€5',
                    rating: 4.3
                }
            ];

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
        
        // Setup export functionality
        this.setupExportFunctions();
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
                <div class="restaurant-item" onclick="spotlightController.restaurantClicked('${restaurant.title}', ${index})"
                     tabindex="0" role="button" aria-label="View ${restaurant.title}">
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="event.stopPropagation(); spotlightController.callRestaurant('${restaurant.phone}')" 
                                title="Call restaurant" aria-label="Call ${restaurant.title}">📞</button>
                        <button class="item-action-btn" onclick="event.stopPropagation(); spotlightController.visitWebsite('${restaurant.website}')" 
                                title="Visit website" aria-label="Visit ${restaurant.title} website">🌐</button>
                        <button class="item-action-btn" onclick="event.stopPropagation(); spotlightController.getDirections('${restaurant.location}')" 
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
        }
    }

    loadPhotographyContent() {
        const photoSpotsGrid = document.getElementById('photo-spots-list');
        if (photoSpotsGrid && !photoSpotsGrid.hasChildNodes()) {
            const photoSpots = [
                {
                    image: '📸',
                    title: 'Golden Hour at the Harbor',
                    description: 'Perfect lighting for coastal photography during sunset',
                    tags: ['Sunset', 'Coast', 'Harbor']
                },
                {
                    image: '🏛️',
                    title: 'Ancient Architecture',
                    description: 'Historic buildings with stunning architectural details',
                    tags: ['Architecture', 'History', 'Culture']
                },
                {
                    image: '🌸',
                    title: 'Lavender Fields',
                    description: 'Iconic purple landscapes perfect for nature photography',
                    tags: ['Nature', 'Lavender', 'Countryside']
                }
            ];

            photoSpotsGrid.innerHTML = photoSpots.map(spot => `
                <div class="photo-spot-item" onclick="spotlightController.photoSpotClicked('${spot.title}')">
                    <div class="item-image">${spot.image}</div>
                    <div class="item-content">
                        <div class="item-title">${spot.title}</div>
                        <div class="item-description">${spot.description}</div>
                        <div class="item-tags">
                            ${spot.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `).join('');
        }
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

    sendChatMessage() {
        const chatInput = document.getElementById('chat-input');
        if (chatInput && chatInput.value.trim()) {
            const message = chatInput.value.trim();
            this.addChatMessage('user', message);
            chatInput.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    'Great question! Let me help you with that.',
                    'Based on your route, I recommend checking out the local markets.',
                    'The weather looks perfect for your trip! ☀️',
                    'That\'s a fantastic spot for photography!',
                    'I can provide more detailed information about that location.'
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                this.addChatMessage('assistant', randomResponse);
            }, 1000);
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

        // Update progress stops
        if (progressStops && !progressStops.hasChildNodes()) {
            const stops = ['Aix-en-Provence', 'Marseille', 'Cassis', 'Nice'];
            progressStops.innerHTML = stops.map((stop, index) => {
                const stopPercentage = (index / (stops.length - 1)) * 100;
                const isCompleted = percentage >= stopPercentage;
                const isCurrent = percentage >= stopPercentage - 25 && percentage < stopPercentage + 25;
                
                return `<div class="progress-stop ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}" 
                             title="${stop}" 
                             style="left: ${stopPercentage}%"></div>`;
            }).join('');
        }
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
        // Export to Google Maps
        document.getElementById('export-google-maps')?.addEventListener('click', () => {
            this.exportToGoogleMaps();
        });

        // Export to PDF
        document.getElementById('export-pdf')?.addEventListener('click', () => {
            this.exportToPDF();
        });

        // Email sharing
        document.getElementById('export-email')?.addEventListener('click', () => {
            this.shareViaEmail();
        });

        // Save route
        document.getElementById('save-route')?.addEventListener('click', () => {
            this.saveRoute();
        });

        // Add highlight
        document.getElementById('add-highlight')?.addEventListener('click', () => {
            this.addCustomHighlight();
        });

        // Setup drag and drop
        this.setupDragAndDrop();

        // Setup itinerary controls
        this.setupItineraryControls();
    }

    exportToGoogleMaps() {
        const waypoints = [
            'Aix-en-Provence, France',
            'Avignon, France',
            'Châteauneuf-du-Pape, France',
            'Cassis, France',
            'Nice, France'
        ];

        const googleMapsUrl = `https://www.google.com/maps/dir/${waypoints.join('/')}/`;
        
        // Create a shareable link
        if (navigator.share) {
            navigator.share({
                title: 'My Provence Road Trip',
                text: 'Check out this amazing road trip route!',
                url: googleMapsUrl
            });
        } else {
            window.open(googleMapsUrl, '_blank');
        }

        this.showNotification('Route opened in Google Maps!', 'success');
        this.triggerConfetti();
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

    // Enhanced AI Assistant with real suggestions
    handleQuickSuggestion(action) {
        const routeSpecificSuggestions = {
            weather: {
                message: 'Perfect weather for your trip! ☀️ Expect sunny skies (22-26°C) in Provence. Pack light layers for evenings in Nice. Best months: April-October.',
                followUp: 'Would you like specific weather for each stop?'
            },
            traffic: {
                message: '🚗 Current traffic: A7 highway is clear. Avoid Marseille during rush hours (7-9 AM, 5-7 PM). Weekend traffic is lighter on coastal roads.',
                followUp: 'Need alternative routes for any segment?'
            },
            nearby: {
                message: '📍 Based on your route: Lavender fields (Valensole), Roman theater (Orange), local markets (Sat mornings), hidden beaches (Calanque d\'En-Vau).',
                followUp: 'Want detailed info on any of these?'
            },
            tips: {
                message: '💡 Local tips: Book restaurants early in Cassis, parking is limited. Try the local rosé wine. Many museums close on Tuesdays. Bring comfortable walking shoes!',
                followUp: 'Need more specific advice for any location?'
            }
        };

        const suggestion = routeSpecificSuggestions[action];
        if (suggestion) {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                this.addChatMessage('assistant', suggestion.message);
                setTimeout(() => {
                    this.addChatMessage('assistant', suggestion.followUp);
                }, 1000);
            }
        }
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