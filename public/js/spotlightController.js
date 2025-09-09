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
                    title: 'Historic Sites',
                    description: 'Explore ancient Roman ruins and medieval architecture'
                },
                {
                    icon: '🍷',
                    title: 'Wine Tasting',
                    description: 'Sample renowned local wines in authentic vineyards'
                },
                {
                    icon: '🌅',
                    title: 'Scenic Views',
                    description: 'Breathtaking panoramas of the Mediterranean coast'
                },
                {
                    icon: '🎨',
                    title: 'Art & Culture',
                    description: 'Museums, galleries, and cultural experiences'
                }
            ];

            highlightsGrid.innerHTML = highlights.map(highlight => `
                <div class="highlight-item" onclick="spotlightController.highlightClicked('${highlight.title}')">
                    <div class="highlight-icon">${highlight.icon}</div>
                    <div class="highlight-title">${highlight.title}</div>
                    <div class="highlight-description">${highlight.description}</div>
                </div>
            `).join('');
        }
    }

    loadCulinaryContent() {
        const restaurantsGrid = document.getElementById('restaurants-list');
        if (restaurantsGrid && !restaurantsGrid.hasChildNodes()) {
            const restaurants = [
                {
                    image: '🍽️',
                    title: 'La Provence Authentique',
                    description: 'Traditional Provençal cuisine with locally sourced ingredients',
                    tags: ['French', 'Fine Dining', 'Local']
                },
                {
                    image: '🍕',
                    title: 'Pizzeria del Mare',
                    description: 'Authentic Italian pizzeria with sea views',
                    tags: ['Italian', 'Casual', 'Family']
                },
                {
                    image: '🥘',
                    title: 'Mediterranean Delights',
                    description: 'Fresh seafood and Mediterranean specialties',
                    tags: ['Mediterranean', 'Seafood', 'Outdoor']
                }
            ];

            restaurantsGrid.innerHTML = restaurants.map(restaurant => `
                <div class="restaurant-item" onclick="spotlightController.restaurantClicked('${restaurant.title}')">
                    <div class="item-image">${restaurant.image}</div>
                    <div class="item-content">
                        <div class="item-title">${restaurant.title}</div>
                        <div class="item-description">${restaurant.description}</div>
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
}

// Initialize the controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spotlightController = new SpotlightController();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpotlightController;
}