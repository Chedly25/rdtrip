/**
 * Destination Manager - Interactive Route Customization System
 * Allows users to add, remove, reorder destinations with live recalculation
 */

class DestinationManager {
    constructor() {
        this.destinations = [];
        this.origin = '';
        this.finalDestination = '';
        this.isEditing = false;
        this.draggedItem = null;
        this.mapInstance = null;
        this.routeLayer = null;

        this.init();
    }

    init() {

        // Load existing route data
        this.loadRouteData();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize UI
        this.initializeUI();

        // Wait a bit and then check if we need to render existing cities
        setTimeout(() => {
            this.checkAndSyncExistingCities();
        }, 1000);

    }

    loadRouteData() {
        // Load from localStorage or sessionStorage
        const localData = localStorage.getItem('spotlightData');
        const sessionData = sessionStorage.getItem('spotlightData');

        const spotlightData = JSON.parse(localData || sessionData || '{}');

        if (spotlightData.waypoints) {
            this.destinations = [...spotlightData.waypoints];
            this.origin = spotlightData.origin || 'Aix-en-Provence';
            this.finalDestination = spotlightData.destination || '';

            // Enrich initial destinations with Wikipedia images if not already enriched
            this.enrichInitialDestinations();
        } else {
        }
    }

    async enrichInitialDestinations() {

        for (let i = 0; i < this.destinations.length; i++) {
            const destination = this.destinations[i];

            // Skip if already has Wikipedia image
            if (destination.wikipediaImage) {
                continue;
            }


            try {
                const wikipediaImage = await this.getWikipediaImage(destination.name);
                if (wikipediaImage) {
                    this.destinations[i].wikipediaImage = wikipediaImage;
                }
            } catch (error) {
                console.warn(`🖼️ ENRICH INITIAL: Failed to fetch Wikipedia image for ${destination.name}:`, error);
            }
        }

        // Re-render destinations with new images
        this.renderDestinations();
    }

    initializeUI() {

        // No longer need edit mode button - always editable
        // this.addEditModeButton(); // Removed for seamless editing

        // Enhance existing city cards with controls
        this.enhanceCityCards();

        // Create add destination modal
        this.createAddDestinationModal();

        // Setup always-on editing features
        this.setupAlwaysEditableFeatures();

    }

    enhanceCityCards() {
        const cityCards = document.querySelectorAll('.city-card');

        cityCards.forEach((card, index) => {
            // Skip if already enhanced
            if (card.querySelector('.remove-city-btn')) {
                return;
            }


            // Add to destinations array if not already there
            const cityName = card.querySelector('.city-name')?.textContent?.trim();
            const cityHighlights = card.querySelector('.city-highlights')?.textContent?.trim() || '';


            if (cityName && !this.destinations.find(d => d.name === cityName)) {
                const newDestination = {
                    name: cityName,
                    coordinates: [0, 0], // Will be updated when route is recalculated
                    highlights: cityHighlights ? [cityHighlights] : [],
                    fromExistingCard: true
                };
                this.destinations.push(newDestination);
            }

            // Don't add edit controls immediately - only when in edit mode
            // this.addRemoveButton(card, index);
            // this.addDragHandle(card, index);
        });

    }

    checkAndSyncExistingCities() {

        const cityCards = document.querySelectorAll('.city-card');

        if (cityCards.length > 0 && this.destinations.length === 0) {
            this.enhanceCityCards();

            // Update route and map
            if (this.destinations.length > 0) {
                this.updateRoute();
            }
        } else if (cityCards.length === 0 && this.destinations.length > 0) {
            this.renderDestinations();
        } else {
        }
    }

    // Removed edit mode button - users can now edit directly
    setupAlwaysEditableFeatures() {
        // Add event listener for the top Add Destination button
        const addBtn = document.getElementById('add-destination-top');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.showAddDestinationModal(this.destinations.length);
            });
        }

        // Enable drag and drop by default
        const citiesContainer = document.getElementById('citiesContainer');
        if (citiesContainer) {
            // Always enable drag and drop
            this.isEditing = true; // Always in editing mode
            citiesContainer.classList.add('edit-mode');
            // Drag and drop is set up per card in createCityCard

            // Add hover effects setup
            this.setupHoverEffects();
        }
    }

    setupHoverEffects() {
        // This will be called after cards are rendered
        // To add "Add stop here" buttons between cards
    }

    // Removed toggleEditMode - editing is now always available

    enterEditMode() {

        // Add remove buttons to all city cards
        const cityCards = document.querySelectorAll('.city-card');

        cityCards.forEach((card, index) => {
            this.addRemoveButton(card, index);
            this.addDragHandle(card, index);
        });

        // Add main "Add Destination" button
        this.addMainDestinationButton();

        // Add "Add Stop" buttons between cities
        this.addInsertButtons();

        // Show optimization toolbar
        this.showOptimizationToolbar();

    }

    addMainDestinationButton() {
        const citiesContainer = document.getElementById('citiesContainer');
        if (!citiesContainer) return;

        // Check if button already exists
        if (document.getElementById('main-add-destination-btn')) return;

        const mainAddBtn = document.createElement('button');
        mainAddBtn.id = 'main-add-destination-btn';
        mainAddBtn.className = 'add-destination-main';
        mainAddBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14m-7-7h14"/>
            </svg>
            Add New Destination
        `;
        mainAddBtn.onclick = () => {
            // For "Add New Destination", find optimal position instead of just adding at end
            const optimalIndex = this.findOptimalInsertPosition();
            this.showAddDestinationModal(optimalIndex);
        };

        // Add at the end of the cities container
        citiesContainer.appendChild(mainAddBtn);
    }

    exitEditMode() {

        // Remove all edit controls
        document.querySelectorAll('.remove-city-btn').forEach(btn => btn.remove());
        document.querySelectorAll('.drag-handle').forEach(handle => handle.remove());
        document.querySelectorAll('.add-stop-btn').forEach(btn => btn.remove());

        // Remove main add destination button
        const mainAddBtn = document.getElementById('main-add-destination-btn');
        if (mainAddBtn) {
            mainAddBtn.remove();
        }

        // Hide optimization toolbar
        this.hideOptimizationToolbar();

        // Save changes
        this.saveRoute();

    }

    addRemoveButton(card, index) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-city-btn';
        removeBtn.innerHTML = '<img src="/images/trash.png" alt="Remove" style="width: 16px; height: 16px;">';
        removeBtn.title = 'Remove this destination';
        removeBtn.onclick = () => this.removeDestination(index);

        card.appendChild(removeBtn);
    }

    addDragHandle(card, index) {
        // Skip if already has a drag handle
        if (card.querySelector('.drag-handle')) {
            return;
        }

        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.title = 'Drag to reorder';
        // Don't make the handle itself draggable - let the card handle it
        // dragHandle.draggable = true;

        // Make the entire card draggable when the handle is present
        card.draggable = true;
        card.style.cursor = 'move';
        card.setAttribute('draggable', 'true'); // Ensure HTML attribute is set

        // Clear any existing event listeners
        this.removeAllDragListeners(card);

        // Remove any conflicting event listeners that might prevent dragging
        card.removeEventListener('mousedown', this.preventDragConflicts);
        card.removeEventListener('touchstart', this.preventDragConflicts);

        // Create unique bound methods for this specific card
        const dragStartHandler = (e) => {

            // Ensure this is actually a drag event
            if (!e.dataTransfer) {
                console.warn('Drag start: No dataTransfer available');
                return;
            }

            try {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString()); // Use text/plain for better compatibility
                this.draggedItem = index;
                card.classList.add('dragging');

                // Don't prevent default - let the drag event proceed naturally
                // e.stopPropagation();

                // Create simple drag image
                try {
                    const dragImage = card.cloneNode(true);
                    dragImage.style.transform = 'rotate(3deg)';
                    dragImage.style.opacity = '0.8';
                    dragImage.style.position = 'absolute';
                    dragImage.style.top = '-1000px';
                    dragImage.style.pointerEvents = 'none';
                    document.body.appendChild(dragImage);
                    e.dataTransfer.setDragImage(dragImage, 50, 25);

                    setTimeout(() => {
                        if (document.body.contains(dragImage)) {
                            document.body.removeChild(dragImage);
                        }
                    }, 100);
                } catch (dragImageError) {
                }
            } catch (error) {
                console.error('Drag start error:', error);
            }
        };

        const dragEndHandler = (e) => {
            card.classList.remove('dragging');
            document.querySelectorAll('.city-card.drag-over').forEach(c => c.classList.remove('drag-over'));
            this.draggedItem = null;
        };

        const dragOverHandler = (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!card.classList.contains('dragging')) {
                document.querySelectorAll('.city-card.drag-over').forEach(c => c.classList.remove('drag-over'));
                card.classList.add('drag-over');
            }
        };

        const dropHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            card.classList.remove('drag-over');

            if (this.draggedItem !== null && this.draggedItem !== index) {
                this.reorderDestinations(this.draggedItem, index);
            } else {
            }
        };

        // Store handlers on the card for cleanup
        card._dragHandlers = {
            dragstart: dragStartHandler,
            dragend: dragEndHandler,
            dragover: dragOverHandler,
            drop: dropHandler
        };

        // Add event listeners with better options

        // Use capture phase and ensure events aren't passive
        const eventOptions = { capture: false, passive: false };

        card.addEventListener('dragstart', dragStartHandler, eventOptions);
        card.addEventListener('dragend', dragEndHandler, eventOptions);
        card.addEventListener('dragover', dragOverHandler, eventOptions);
        card.addEventListener('drop', dropHandler, eventOptions);
        card.addEventListener('dragenter', (e) => {
            e.preventDefault();
        }, eventOptions);
        card.addEventListener('dragleave', (e) => {
        }, eventOptions);


        // Test drag start with mousedown event
        card.addEventListener('mousedown', (e) => {
        }, eventOptions);

        // Visual feedback on hover and ensure drag handle doesn't interfere
        dragHandle.addEventListener('mousedown', (e) => {
            card.style.cursor = 'grabbing';
            // Don't prevent default - let the drag start naturally
        });

        dragHandle.addEventListener('mouseup', () => {
            card.style.cursor = 'move';
        });

        // Allow pointer events on drag handle but ensure it doesn't interfere with dragging
        dragHandle.style.pointerEvents = 'auto';
        dragHandle.style.cursor = 'grab';

        // Add visual feedback when hovering over drag handle
        dragHandle.addEventListener('mouseenter', () => {
            dragHandle.style.cursor = 'grab';
            card.style.cursor = 'grab';
        });

        dragHandle.addEventListener('mouseleave', () => {
            if (!card.classList.contains('dragging')) {
                card.style.cursor = 'move';
            }
        });

        // Store the index on the card for easier access
        card.dataset.dragIndex = index;

        card.appendChild(dragHandle);
    }

    addInsertButtons() {
        const citiesContainer = document.getElementById('citiesContainer');
        if (!citiesContainer) return;

        const cityCards = citiesContainer.querySelectorAll('.city-card');

        cityCards.forEach((card, index) => {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-stop-btn';
            addBtn.innerHTML = '+ Add Stop Here';
            // FIX: Use index + 1 for "Add Stop Here" to insert AFTER this city
            addBtn.onclick = () => this.showAddDestinationModal(index + 1);

            // Insert after each card except the last one
            if (index < cityCards.length - 1) {
                card.insertAdjacentElement('afterend', addBtn);
            }
        });

        // Add one at the beginning
        const firstAddBtn = document.createElement('button');
        firstAddBtn.className = 'add-stop-btn';
        firstAddBtn.innerHTML = '+ Add Stop Here';
        firstAddBtn.onclick = () => this.showAddDestinationModal(0);
        citiesContainer.insertBefore(firstAddBtn, citiesContainer.firstChild);
    }

    removeDestination(index) {

        // Check bounds first
        if (index < 0 || index >= this.destinations.length || !this.destinations[index]) {
            console.warn(`❌ Invalid index ${index} for destinations array of length ${this.destinations.length}`);
            return;
        }

        // Confirm removal
        if (!confirm(`Remove ${this.destinations[index].name} from your route?`)) {
            return;
        }

        const removedCity = this.destinations[index];

        // Remove from array
        this.destinations.splice(index, 1);

        // Immediately re-render and update
        this.renderDestinations();
        this.updateRoute();

        // Also update the detailed itinerary if it exists
        this.updateDetailedItinerary();

    }

    showAddDestinationModal(insertIndex) {
        const modal = document.getElementById('add-destination-modal');
        modal.classList.add('show');
        modal.dataset.insertIndex = insertIndex;
    }

    createAddDestinationModal() {
        const modal = document.createElement('div');
        modal.id = 'add-destination-modal';
        modal.className = 'destination-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Destination</h3>
                    <button class="modal-close" onclick="destinationManager.closeAddModal()">×</button>
                </div>
                <div class="modal-body">
                    <div class="destination-search">
                        <input type="text" id="destination-search-input"
                               placeholder="Type any city name and press Enter..."
                               autocomplete="off">
                        <div id="search-suggestions" class="suggestions-list"></div>
                    </div>
                    <div class="popular-destinations">
                        <h4>Popular Stops Nearby</h4>
                        <div id="nearby-suggestions" class="suggestion-chips"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="destinationManager.closeAddModal()">Cancel</button>
                    <button class="btn-add" onclick="destinationManager.addCustomDestination()" id="addCustomCityBtn">Add Custom City</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup search functionality
        this.setupDestinationSearch();

        // Load popular nearby suggestions
        this.loadNearbyDestinations();
    }

    setupDestinationSearch() {
        const searchInput = document.getElementById('destination-search-input');
        let debounceTimer;

        searchInput?.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.searchDestinations(e.target.value);
            }, 300);
        });

        // Add Enter key support for custom cities
        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const cityName = e.target.value.trim();
                if (cityName) {
                    this.addCustomDestination(cityName);
                }
            }
        });
    }

    async searchDestinations(query) {
        if (!query || query.length < 2) {
            document.getElementById('search-suggestions').innerHTML = '';
            return;
        }

        const europeanCities = this.getEuropeanCitiesDatabase();
        const results = europeanCities
            .filter(city => city.name.toLowerCase().includes(query.toLowerCase()) ||
                           city.country.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 8); // Limit to 8 results

        this.displaySearchResults(results);
    }

    loadNearbyDestinations() {
        // Popular European destinations that work well as stops
        const popularDestinations = [
            'Nice', 'Lyon', 'Milan', 'Monaco', 'Turin', 'Marseille',
            'Geneva', 'Zurich', 'Valencia', 'Florence', 'Cannes'
        ];

        const nearbyContainer = document.getElementById('nearby-suggestions');
        if (nearbyContainer) {
            nearbyContainer.innerHTML = popularDestinations.map(city => `
                <div class="suggestion-chip" onclick="destinationManager.quickSelectDestination('${city}')">
                    ${city}
                </div>
            `).join('');
        }
    }

    quickSelectDestination(cityName) {
        // Find the city in our database
        const europeanCities = this.getEuropeanCitiesDatabase();
        const city = europeanCities.find(c => c.name === cityName);

        if (city) {
            this.selectDestination(city.name, city.coords);
        }
    }

    getEuropeanCitiesDatabase() {
        // Return the same database used in search
        return [
            // France
            { name: 'Nice', country: 'France', coords: [7.2620, 43.7102] },
            { name: 'Lyon', country: 'France', coords: [4.8357, 45.7640] },
            { name: 'Marseille', country: 'France', coords: [5.3698, 43.2965] },
            { name: 'Toulouse', country: 'France', coords: [1.4442, 43.6047] },
            { name: 'Strasbourg', country: 'France', coords: [7.7521, 48.5734] },
            { name: 'Bordeaux', country: 'France', coords: [-0.5792, 44.8378] },
            { name: 'Montpellier', country: 'France', coords: [3.8767, 43.6119] },
            { name: 'Cannes', country: 'France', coords: [7.0179, 43.5528] },
            { name: 'Avignon', country: 'France', coords: [4.8059, 43.9493] },

            // Spain
            { name: 'Barcelona', country: 'Spain', coords: [2.1734, 41.3851] },
            { name: 'Madrid', country: 'Spain', coords: [-3.7038, 40.4168] },
            { name: 'Valencia', country: 'Spain', coords: [-0.3774, 39.4699] },
            { name: 'Seville', country: 'Spain', coords: [-5.9845, 37.3891] },
            { name: 'Bilbao', country: 'Spain', coords: [-2.9253, 43.2627] },
            { name: 'Granada', country: 'Spain', coords: [-3.5986, 37.1773] },
            { name: 'San Sebastian', country: 'Spain', coords: [-1.9812, 43.3183] },
            { name: 'Zaragoza', country: 'Spain', coords: [-0.8773, 41.6488] },

            // Italy
            { name: 'Milan', country: 'Italy', coords: [9.1900, 45.4642] },
            { name: 'Rome', country: 'Italy', coords: [12.4964, 41.9028] },
            { name: 'Florence', country: 'Italy', coords: [11.2558, 43.7696] },
            { name: 'Venice', country: 'Italy', coords: [12.3155, 45.4408] },
            { name: 'Naples', country: 'Italy', coords: [14.2681, 40.8518] },
            { name: 'Turin', country: 'Italy', coords: [7.6869, 45.0703] },
            { name: 'Pisa', country: 'Italy', coords: [10.4017, 43.7228] },
            { name: 'Genoa', country: 'Italy', coords: [8.9463, 44.4056] },
            { name: 'Bologna', country: 'Italy', coords: [11.3426, 44.4949] },

            // Switzerland
            { name: 'Zurich', country: 'Switzerland', coords: [8.5417, 47.3769] },
            { name: 'Geneva', country: 'Switzerland', coords: [6.1432, 46.2044] },
            { name: 'Bern', country: 'Switzerland', coords: [7.4474, 46.9480] },
            { name: 'Basel', country: 'Switzerland', coords: [7.5886, 47.5596] },
            { name: 'Lucerne', country: 'Switzerland', coords: [8.3093, 47.0502] },
            { name: 'Interlaken', country: 'Switzerland', coords: [7.8632, 46.6863] },

            // Germany
            { name: 'Munich', country: 'Germany', coords: [11.5820, 48.1351] },
            { name: 'Berlin', country: 'Germany', coords: [13.4050, 52.5200] },
            { name: 'Hamburg', country: 'Germany', coords: [9.9937, 53.5511] },
            { name: 'Frankfurt', country: 'Germany', coords: [8.6821, 50.1109] },
            { name: 'Cologne', country: 'Germany', coords: [6.9603, 50.9375] },
            { name: 'Stuttgart', country: 'Germany', coords: [9.1829, 48.7758] },

            // Netherlands
            { name: 'Amsterdam', country: 'Netherlands', coords: [4.9041, 52.3676] },
            { name: 'Rotterdam', country: 'Netherlands', coords: [4.4777, 51.9244] },
            { name: 'Utrecht', country: 'Netherlands', coords: [5.1214, 52.0907] },
            { name: 'The Hague', country: 'Netherlands', coords: [4.3007, 52.0705] },

            // Belgium
            { name: 'Brussels', country: 'Belgium', coords: [4.3517, 50.8503] },
            { name: 'Antwerp', country: 'Belgium', coords: [4.4025, 51.2194] },
            { name: 'Ghent', country: 'Belgium', coords: [3.7174, 51.0543] },
            { name: 'Bruges', country: 'Belgium', coords: [3.2247, 51.2093] },

            // Austria
            { name: 'Vienna', country: 'Austria', coords: [16.3738, 48.2082] },
            { name: 'Salzburg', country: 'Austria', coords: [13.0550, 47.8095] },
            { name: 'Innsbruck', country: 'Austria', coords: [11.4041, 47.2692] },

            // Monaco & Luxembourg
            { name: 'Monaco', country: 'Monaco', coords: [7.4167, 43.7333] },
            { name: 'Luxembourg City', country: 'Luxembourg', coords: [6.1296, 49.8153] }
        ];
    }

    displaySearchResults(results) {
        const suggestionsDiv = document.getElementById('search-suggestions');

        suggestionsDiv.innerHTML = results.map(city => `
            <div class="suggestion-item" onclick="destinationManager.selectDestination('${city.name}', [${city.coords}])">
                <span class="city-name">${city.name}</span>
                <span class="city-country">${city.country}</span>
            </div>
        `).join('');
    }

    selectDestination(name, coords) {
        this.selectedDestination = { name, coordinates: coords };
        document.getElementById('destination-search-input').value = name;
        document.getElementById('search-suggestions').innerHTML = '';
    }

    async addSelectedDestination() {
        if (!this.selectedDestination) {
            alert('Please select a destination');
            return;
        }

        const modal = document.getElementById('add-destination-modal');
        const insertIndex = parseInt(modal.dataset.insertIndex) || 0;

        // Show loading state
        const addButton = modal.querySelector('.btn-add');
        const originalText = addButton.innerHTML;
        addButton.innerHTML = '<div class="btn-spinner"></div> Adding...';
        addButton.disabled = true;

        try {
            // Enhance destination with AI-generated description
            const enhancedDestination = await this.enrichDestinationData(this.selectedDestination);

            // Add to destinations array
            this.destinations.splice(insertIndex, 0, enhancedDestination);


            // Close modal
            this.closeAddModal();

            // Update route
            this.updateRoute();
            this.renderDestinations();
            this.updateDetailedItinerary();

        } catch (error) {
            console.error('❌ Error adding destination:', error);

            // Fallback: add basic destination
            const basicDestination = {
                ...this.selectedDestination,
                description: `Beautiful ${this.selectedDestination.name} with amazing attractions and experiences`,
                highlights: [`Explore ${this.selectedDestination.name}`, `Local cuisine`, `Historic sites`],
                added: new Date().toISOString()
            };

            this.destinations.splice(insertIndex, 0, basicDestination);
            this.closeAddModal();
            this.updateRoute();
            this.renderDestinations();
            this.updateDetailedItinerary();
        } finally {
            // Restore button state
            addButton.innerHTML = originalText;
            addButton.disabled = false;
        }
    }

    async enrichDestinationData(destination) {

        try {
            // Call Chat API for rich destination description
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Provide 3-4 key highlights and attractions for ${destination.name}. Focus on must-see places, activities, and unique experiences. Format as bullet points.`
                })
            });


            if (response.ok) {
                const data = await response.json();
                const highlights = this.parseHighlightsFromAI(data.answer || data.response || data.content || '');

                const enrichedDestination = {
                    ...destination,
                    description: `Discover ${destination.name}, a captivating destination with rich culture and amazing attractions`,
                    highlights: highlights,
                    aiGenerated: true,
                    added: new Date().toISOString()
                };

                return enrichedDestination;
            } else {
                throw new Error(`Chat API request failed with status: ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ ENRICH: AI enrichment failed, using fallback data:', error);

            // Fallback to basic destination data
            const fallbackDestination = {
                ...destination,
                description: `Beautiful ${destination.name} with amazing attractions and experiences`,
                highlights: [`Explore ${destination.name}`, `Local cuisine`, `Historic sites`, `Local culture`],
                added: new Date().toISOString()
            };

            return fallbackDestination;
        }
    }

    parseHighlightsFromAI(content) {

        if (!content || typeof content !== 'string') {
            return ['Historic landmarks', 'Local cuisine', 'Cultural attractions', 'Scenic views'];
        }

        // Extract bullet points or numbered items from AI response
        const bulletPoints = content.match(/[-•*]\s*([^\n\r]+)/g) ||
                           content.match(/\d+\.\s*([^\n\r]+)/g) ||
                           content.split('.').filter(item => item.trim().length > 10);


        if (bulletPoints && bulletPoints.length > 0) {
            const parsed = bulletPoints.slice(0, 4).map(point => {
                const cleaned = point.replace(/^[-•*\d.]\s*/, '').trim();
                return cleaned.length > 60 ? cleaned.substring(0, 57) + '...' : cleaned;
            });
            return parsed;
        }

        // Fallback highlights
        return ['Historic landmarks', 'Local cuisine', 'Cultural attractions', 'Scenic views'];
    }

    closeAddModal() {
        const modal = document.getElementById('add-destination-modal');
        if (modal) {
            modal.classList.remove('show');

            // Reset modal state
            const loadingOverlay = document.getElementById('modal-loading');
            const successMessage = document.getElementById('modal-success');
            const modalBody = modal.querySelector('.modal-body');
            const modalFooter = modal.querySelector('.modal-footer');
            const addButton = modal.querySelector('.btn-add');

            // Hide overlays and show body
            if (loadingOverlay) loadingOverlay.classList.remove('show');
            if (successMessage) successMessage.classList.remove('show');
            if (modalBody) modalBody.style.display = '';
            if (modalFooter) modalFooter.style.display = '';

            // Reset form
            const searchInput = document.getElementById('destination-search-input');
            if (searchInput) searchInput.value = '';
            const suggestions = document.getElementById('search-suggestions');
            if (suggestions) suggestions.innerHTML = '';
            if (addButton) addButton.disabled = true;
            this.selectedDestination = null;
        }
    }

    async addCustomDestination(cityName) {

        if (!cityName) {
            // Get city name from input if not provided
            cityName = document.getElementById('destination-search-input')?.value?.trim();
        }

        if (!cityName) {
            alert('Please enter a city name');
            return;
        }


        // Show loading state
        const addBtn = document.querySelector('.btn-add');
        const originalText = addBtn.textContent;
        addBtn.innerHTML = '<div class="btn-spinner"></div> Adding City...';
        addBtn.disabled = true;

        try {
            // Try to get coordinates for the city from our database first
            const europeanCities = this.getEuropeanCitiesDatabase();
            const cityData = europeanCities.find(city =>
                city.name.toLowerCase() === cityName.toLowerCase()
            );
            const coordinates = cityData ? cityData.coords : [0, 0];

            // Create destination with proper coordinates if available
            const newDestination = {
                name: cityName,
                coordinates: coordinates,
                highlights: ['Loading city information...'],
                isCustom: true
            };

            // Add to destinations immediately for UX
            const modal = document.getElementById('add-destination-modal');
            let insertIndex = parseInt(modal.dataset.insertIndex) || this.destinations.length;

            // If this was called from "Add New Destination" (at the end), calculate optimal position
            if (insertIndex === this.destinations.length && this.destinations.length > 0) {
                const optimalIndex = this.findOptimalInsertPositionForDestination(newDestination);
                insertIndex = optimalIndex;
            }

            this.destinations.splice(insertIndex, 0, newDestination);

            this.renderDestinations();
            this.updateRoute();

            // Direct map update - use the new addCityToRoute method for proper optimization
            if (window.spotlightController) {
                try {
                    if (typeof window.spotlightController.addCityToRoute === 'function') {
                        // Use the new optimized city addition method
                        await window.spotlightController.addCityToRoute(newDestination);
                    } else if (typeof window.spotlightController.recalculateRoute === 'function') {
                        // Fallback to old method
                        await window.spotlightController.recalculateRoute();
                    }
                } catch (error) {
                    console.warn('Map update failed:', error);
                }
            }

            // Close modal
            this.closeAddModal();

            // Enrich with APIs in background
            // Get the actual added destination from the array (not the original object)
            const addedDestination = this.destinations[insertIndex];
            await this.enrichCustomDestination(addedDestination);

        } catch (error) {
            console.error('❌ ADD CUSTOM: Error adding custom destination:', error);
            alert('Failed to add city. Please try again.');
        } finally {
            // Restore button
            if (addBtn) {
                addBtn.textContent = originalText;
                addBtn.disabled = false;
            }
        }
    }

    async enrichCustomDestination(destination) {

        try {
            // Get Wikipedia image and basic info
            const wikipediaImage = await this.getWikipediaImage(destination.name);

            // Get AI description
            const aiData = await this.enrichDestinationData(destination);

            // Update the destination in our array
            const destIndex = this.destinations.findIndex(d => d.name === destination.name);

            if (destIndex !== -1) {
                this.destinations[destIndex].highlights = aiData.highlights || destination.highlights;
                this.destinations[destIndex].wikipediaImage = wikipediaImage;
                this.destinations[destIndex].description = aiData.description;
                this.destinations[destIndex].enriched = true;


                // Re-render to show enriched data
                this.renderDestinations();

                // Also update the map
                this.updateRoute();

            } else {
                console.warn(`Could not find destination ${destination.name} in array`);
            }

        } catch (error) {
            console.error(`❌ ENRICH CUSTOM: Failed to enrich ${destination.name}:`, error);
        }
    }

    async enrichDestinationData(destination) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Provide 3-4 key highlights and attractions for ${destination.name}. Focus on must-see places, activities, and unique experiences. Format as bullet points.`
                })
            });

            if (!response.ok) {
                throw new Error(`Chat API error: ${response.status}`);
            }

            const data = await response.json();

            // Parse the response to extract highlights
            const highlights = this.parsePerplexityResponse(data.answer || data.response || '');

            return {
                highlights: highlights,
                description: data.answer || data.response || 'Beautiful destination with unique attractions'
            };

        } catch (error) {
            console.warn('Perplexity API call failed:', error);
            return {
                highlights: ['Historic city center', 'Local cuisine', 'Cultural attractions'],
                description: 'Beautiful destination with unique attractions'
            };
        }
    }

    parsePerplexityResponse(response) {
        // Extract bullet points or numbered lists from Perplexity response
        const bulletPoints = response.match(/[-•*]\s*([^\n\r]+)/g) ||
                           response.match(/\d+\.\s*([^\n\r]+)/g) || [];

        if (bulletPoints.length > 0) {
            return bulletPoints.slice(0, 4).map(point => {
                const cleaned = point.replace(/^[-•*\d.\s]+/, '').trim();
                return cleaned.length > 60 ? cleaned.substring(0, 57) + '...' : cleaned;
            });
        }

        // Fallback: split by sentences and take first few
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
        return sentences.slice(0, 3).map(s => s.trim().substring(0, 60) + '...');
    }

    // Wikipedia image fetching (adapted from enhanced-route-results.js)
    async getWikipediaImage(locationName, width = 800, height = 600) {
        const cacheKey = `${locationName}_${width}x${height}`;
        if (this.imageCache && this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }

        // Initialize cache if not exists
        if (!this.imageCache) {
            this.imageCache = new Map();
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

    showOptimizationToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'optimization-toolbar';
        toolbar.className = 'optimization-toolbar';
        toolbar.innerHTML = `
            <button onclick="destinationManager.optimizeRoute()">
                🔄 Optimize Route
            </button>
            <button onclick="destinationManager.saveRoute()">
                💾 Save Changes
            </button>
            <button onclick="destinationManager.resetRoute()">
                ↻ Reset to Original
            </button>
        `;

        const container = document.querySelector('.enhanced-results-container') ||
                         document.querySelector('.cities-section');
        container?.insertBefore(toolbar, container.firstChild);
    }

    hideOptimizationToolbar() {
        const toolbar = document.getElementById('optimization-toolbar');
        toolbar?.remove();
    }

    optimizeRoute() {

        if (this.destinations.length <= 2) {
            alert('Route optimization works best with 3 or more destinations.');
            return;
        }

        // Store original route for comparison
        const originalDestinations = [...this.destinations];
        const originalDistance = this.calculateDistances();

        // Implement a simple but effective nearest neighbor algorithm
        const optimizedDestinations = this.nearestNeighborOptimization();

        // Update destinations with optimized order
        this.destinations = optimizedDestinations;

        // Calculate new distance
        const newDistance = this.calculateDistances();
        const improvement = originalDistance - newDistance;
        const improvementPercent = ((improvement / originalDistance) * 100).toFixed(1);

        // Update UI
        this.renderDestinations();
        this.updateRoute();

        // Show results to user
        if (improvement > 0) {
            alert(`Route optimized! 🎉\n\nDistance reduced by ${Math.round(improvement)} km (${improvementPercent}%)\nOld route: ${originalDistance} km\nNew route: ${newDistance} km`);
        } else {
            alert('Your route was already well-optimized! 👍\n\nNo significant improvement found.');
            // Restore original route if no improvement
            this.destinations = originalDestinations;
            this.renderDestinations();
            this.updateRoute();
        }

    }

    nearestNeighborOptimization() {
        if (this.destinations.length <= 1) return [...this.destinations];

        const originCoords = [5.4474, 43.5297]; // Aix-en-Provence coordinates
        const unvisited = [...this.destinations];
        const optimized = [];

        // Start from the destination closest to origin
        let currentCoords = originCoords;

        while (unvisited.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = Infinity;

            // Find nearest unvisited destination
            for (let i = 0; i < unvisited.length; i++) {
                const destination = unvisited[i];
                if (destination.coordinates) {
                    const distance = this.calculateHaversineDistance(
                        currentCoords[1], currentCoords[0],
                        destination.coordinates[1], destination.coordinates[0]
                    );

                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestIndex = i;
                    }
                }
            }

            // Move nearest destination to optimized route
            const nearest = unvisited.splice(nearestIndex, 1)[0];
            optimized.push(nearest);

            // Update current position
            if (nearest.coordinates) {
                currentCoords = nearest.coordinates;
            }
        }

        return optimized;
    }

    // Alternative optimization using 2-opt algorithm for better results
    twoOptOptimization() {
        if (this.destinations.length < 4) return [...this.destinations];

        let route = [...this.destinations];
        let improved = true;

        while (improved) {
            improved = false;

            for (let i = 1; i < route.length - 2; i++) {
                for (let j = i + 1; j < route.length; j++) {
                    if (j - i === 1) continue; // Skip adjacent edges

                    const newRoute = this.twoOptSwap(route, i, j);
                    const currentDistance = this.calculateRouteDistance(route);
                    const newDistance = this.calculateRouteDistance(newRoute);

                    if (newDistance < currentDistance) {
                        route = newRoute;
                        improved = true;
                    }
                }
            }
        }

        return route;
    }

    twoOptSwap(route, i, j) {
        const newRoute = [...route];
        // Reverse the segment between i and j
        const segment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, j - i + 1, ...segment);
        return newRoute;
    }

    calculateRouteDistance(destinations) {
        if (destinations.length === 0) return 0;

        let totalDistance = 0;
        const originCoords = [5.4474, 43.5297]; // Aix-en-Provence coordinates

        // Distance from origin to first destination
        if (destinations[0]?.coordinates) {
            totalDistance += this.calculateHaversineDistance(
                originCoords[1], originCoords[0],
                destinations[0].coordinates[1], destinations[0].coordinates[0]
            );
        }

        // Distances between consecutive destinations
        for (let i = 0; i < destinations.length - 1; i++) {
            if (destinations[i]?.coordinates && destinations[i + 1]?.coordinates) {
                totalDistance += this.calculateHaversineDistance(
                    destinations[i].coordinates[1], destinations[i].coordinates[0],
                    destinations[i + 1].coordinates[1], destinations[i + 1].coordinates[0]
                );
            }
        }

        return totalDistance;
    }

    saveRoute() {
        const routeData = {
            origin: this.origin,
            destination: this.finalDestination,
            waypoints: this.destinations,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('customRoute', JSON.stringify(routeData));
    }

    resetRoute() {
        if (confirm('Reset to original route? Your changes will be lost.')) {
            this.loadRouteData();
            this.renderDestinations();
        }
    }

    updateRoute() {

        // Recalculate distances and times
        this.calculateDistances();

        // Update map if available
        this.updateMapRoute();

        // Update UI elements
        this.updateRouteStats();

        // Update route metadata
        this.updateRouteMetadata();
    }

    calculateDistances() {
        // Calculate distances between consecutive destinations using Haversine formula
        let totalDistance = 0;

        if (this.destinations.length === 0) return 0;

        // Add distance from origin to first destination
        const originCoords = [5.4474, 43.5297]; // Aix-en-Provence coordinates
        if (this.destinations[0] && this.destinations[0].coordinates) {
            totalDistance += this.calculateHaversineDistance(
                originCoords[1], originCoords[0],
                this.destinations[0].coordinates[1], this.destinations[0].coordinates[0]
            );
        }

        // Calculate distances between consecutive destinations
        for (let i = 0; i < this.destinations.length - 1; i++) {
            if (this.destinations[i].coordinates && this.destinations[i + 1].coordinates) {
                const distance = this.calculateHaversineDistance(
                    this.destinations[i].coordinates[1],
                    this.destinations[i].coordinates[0],
                    this.destinations[i + 1].coordinates[1],
                    this.destinations[i + 1].coordinates[0]
                );
                totalDistance += distance;
            }
        }

        this.totalDistance = Math.round(totalDistance);

        return this.totalDistance;
    }

    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    updateMapRoute() {

        // Check what map objects are available

        try {
            // Try multiple map update strategies
            let updated = false;

            // Strategy 1: Global updateMapRoute function
            if (typeof window.updateMapRoute === 'function') {
                try {
                    window.updateMapRoute(this.destinations);
                    updated = true;
                } catch (err) {
                    console.error('Global updateMapRoute failed:', err);
                }
            }

            // Strategy 2: Spotlight controller with map
            if (window.spotlightController && window.spotlightController.map) {
                try {
                    // Use spotlight controller's map directly
                    window.map = window.spotlightController.map; // Set global reference for compatibility
                    this.directMapUpdate();
                    updated = true;
                } catch (err) {
                    console.error('Spotlight controller map update failed:', err);
                }
            }

            // Strategy 2b: Legacy spotlight map controller
            if (!updated && window.spotlightMapController && window.spotlightMapController.updateRoute) {
                try {
                    window.spotlightMapController.updateRoute(this.destinations);
                    updated = true;
                } catch (err) {
                    console.error('Legacy spotlight map controller failed:', err);
                }
            }

            // Strategy 3: Direct map update (window.map or spotlight map)
            const mapInstance = window.map || (window.spotlightController && window.spotlightController.map);
            if (mapInstance) {
                try {
                    // Ensure window.map points to the right instance
                    if (!window.map && window.spotlightController && window.spotlightController.map) {
                        window.map = window.spotlightController.map;
                    }
                    this.directMapUpdate();
                    updated = true;
                } catch (err) {
                    console.error('Direct map update failed:', err);
                }
            }

            // Strategy 4: Custom event dispatch
            if (!updated) {
                const event = new CustomEvent('routeUpdated', {
                    detail: { destinations: this.destinations }
                });
                document.dispatchEvent(event);

                // Also try to update via spotlight.js if available
                if (window.updateSpotlightRoute) {
                    try {
                        window.updateSpotlightRoute(this.destinations);
                    } catch (err) {
                        console.error('window.updateSpotlightRoute failed:', err);
                    }
                }
            }

        } catch (error) {
            console.error('Map update failed:', error);
        }
    }

    async directMapUpdate() {

        // Direct map update when global functions aren't available
        if (!window.map) {
            return;
        }


        // Check if spotlight controller has a recalculateRoute method we can use instead
        if (window.spotlightController && typeof window.spotlightController.recalculateRoute === 'function') {
            try {
                await window.spotlightController.recalculateRoute();
                return;
            } catch (error) {
                console.warn('Spotlight controller recalculateRoute failed:', error);
            }
        }

        // Try to update existing spotlight route instead of clearing everything
        if (window.spotlightController) {
            try {
                // Update both spotlightData.waypoints and agentData
                if (window.spotlightController.spotlightData) {
                    window.spotlightController.spotlightData.waypoints = this.destinations;

                    // Also update agentData so displayCities() works correctly
                    if (window.spotlightController.spotlightData.agentData) {
                        // Convert destinations back to the JSON format that agentData.recommendations expects
                        const waypointsForAgent = this.destinations.map(dest => ({
                            name: dest.name,
                            coordinates: dest.coordinates || [0, 0],
                            description: dest.description || '',
                            activities: dest.activities || dest.highlights || [],
                            duration: dest.duration || '1-2 days'
                        }));

                        // Update the recommendations JSON within agentData
                        const agentData = window.spotlightController.spotlightData.agentData;
                        const updatedRecommendations = JSON.stringify({
                            waypoints: waypointsForAgent,
                            description: agentData.recommendations.includes('description') ?
                                JSON.parse(agentData.recommendations.replace(/```json\s*/g, '').replace(/```\s*/g, '')).description :
                                'Updated route with new destinations'
                        });
                        agentData.recommendations = `\`\`\`json\n${updatedRecommendations}\n\`\`\``;
                    }
                }

                // Also update localStorage so changes persist
                const existingData = JSON.parse(localStorage.getItem('spotlightData') || '{}');
                existingData.waypoints = this.destinations;
                localStorage.setItem('spotlightData', JSON.stringify(existingData));

                // Call spotlight's displayCities method to re-render
                if (typeof window.spotlightController.displayCities === 'function') {
                    await window.spotlightController.displayCities();
                }

                // Call recalculateRoute to update the map
                if (typeof window.spotlightController.recalculateRoute === 'function') {
                    await window.spotlightController.recalculateRoute();
                }

                return;
            } catch (error) {
                console.warn('Failed to update spotlight waypoints:', error);
            }
        }

        // Note: We don't want to create custom routes anymore to avoid conflicts
        // All route updates should go through spotlight controller's recalculateRoute()
        return;

        // Clear only our custom markers, not spotlight markers
        if (window.mapMarkers) {
            window.mapMarkers.forEach(marker => marker.remove());
            window.mapMarkers = [];
        }

        // Add new markers for destinations
        const markers = [];
        this.destinations.forEach((dest, index) => {

            if (dest.coordinates && Array.isArray(dest.coordinates) && dest.coordinates.length === 2) {
                const [lng, lat] = dest.coordinates;
                if (lng !== 0 && lat !== 0 && !isNaN(lng) && !isNaN(lat)) {
                    try {
                        const marker = new mapboxgl.Marker()
                            .setLngLat([lng, lat])
                            .setPopup(new mapboxgl.Popup({ offset: 25 })
                                .setHTML(`<h3>${dest.name}</h3><p>Stop ${index + 1}</p>`))
                            .addTo(window.map);
                        markers.push(marker);
                    } catch (error) {
                        console.error(`Failed to add marker for ${dest.name}:`, error);
                    }
                } else {
                }
            } else {
            }
        });

        window.mapMarkers = markers;

        // Update route line if we have coordinates
        const validCoords = this.destinations
            .filter(dest => {
                if (!dest.coordinates || !Array.isArray(dest.coordinates) || dest.coordinates.length !== 2) {
                    return false;
                }
                const [lng, lat] = dest.coordinates;
                return lng !== 0 && lat !== 0 && !isNaN(lng) && !isNaN(lat);
            })
            .map(dest => dest.coordinates);


        if (validCoords.length > 1) {
            // Add route line
            const routeData = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: validCoords
                }
            };

            try {
                if (window.map.getSource('route')) {
                    window.map.getSource('route').setData(routeData);
                } else {
                    window.map.addSource('route', {
                        type: 'geojson',
                        data: routeData
                    });

                    window.map.addLayer({
                        id: 'route',
                        type: 'line',
                        source: 'route',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#6366f1',
                            'line-width': 4
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to update route line:', error);
            }
        } else {
        }

    }

    updateRouteStats() {
        // Update total distance, time, etc.
        const totalStops = this.destinations.length;
        const totalStopsElement = document.getElementById('totalStops');
        if (totalStopsElement) {
            totalStopsElement.textContent = totalStops;
        }

        // Update total distance display
        const totalDistanceElement = document.getElementById('totalDistance');
        if (totalDistanceElement && this.totalDistance) {
            totalDistanceElement.textContent = `${this.totalDistance} km`;
        }

        // Estimate travel days based on distance and stops
        const estimatedDays = this.calculateEstimatedDays();
        const estimatedDaysElement = document.getElementById('estimatedDays');
        if (estimatedDaysElement) {
            estimatedDaysElement.textContent = estimatedDays;
        }

    }

    calculateEstimatedDays() {
        if (this.destinations.length === 0) return 1;

        // Base calculation: 1 day per city + travel days based on distance
        const baseDays = Math.max(2, this.destinations.length);
        const travelDays = Math.ceil((this.totalDistance || 0) / 400); // Assume 400km per travel day

        return Math.max(baseDays, travelDays);
    }

    updateRouteMetadata() {
        // Update stored route data
        const updatedRouteData = {
            origin: this.origin,
            destination: this.finalDestination,
            waypoints: this.destinations,
            totalStops: this.destinations.length,
            totalDistance: this.totalDistance,
            estimatedDays: this.calculateEstimatedDays(),
            lastModified: new Date().toISOString()
        };

        // Update localStorage
        const existingData = JSON.parse(localStorage.getItem('spotlightData') || '{}');
        const mergedData = { ...existingData, ...updatedRouteData };
        localStorage.setItem('spotlightData', JSON.stringify(mergedData));

        // Update sessionStorage as well
        const existingSessionData = JSON.parse(sessionStorage.getItem('spotlightData') || '{}');
        const mergedSessionData = { ...existingSessionData, ...updatedRouteData };
        sessionStorage.setItem('spotlightData', JSON.stringify(mergedSessionData));

    }

    updateDetailedItinerary() {
        // Clear existing itinerary if present
        const itineraryContainer = document.getElementById('itineraryContainer');
        if (itineraryContainer) {
            itineraryContainer.innerHTML = `
                <div class="itinerary-placeholder">
                    <p>Route updated! Click "Generate Day-by-Day Plan" to get a detailed itinerary with your new destinations.</p>
                </div>
            `;
        }
    }

    renderDestinations() {

        const container = document.getElementById('citiesContainer');

        if (!container) {
            console.warn('❌ RENDER: Cities container not found!');
            return;
        }

        // Clear container completely
        container.innerHTML = '';

        // Get landmarks from spotlightData if available
        const spotlightData = JSON.parse(localStorage.getItem('spotlightData') || '{}');
        const landmarksToRender = spotlightData.addedLandmarks || [];

        // Combine destinations (cities) with landmarks for rendering
        const allWaypoints = [...this.destinations];

        // Add landmarks that aren't already in destinations
        landmarksToRender.forEach(landmark => {
            // Check if landmark is not already in destinations array
            const exists = allWaypoints.some(dest =>
                dest.name === landmark.name &&
                (dest.type === 'landmark' || dest.isLandmark)
            );

            if (!exists) {
                // Add landmark with proper structure for rendering
                allWaypoints.push({
                    name: landmark.name,
                    coordinates: landmark.coordinates || [landmark.lng, landmark.lat],
                    description: landmark.description || `Historic landmark in ${landmark.city || 'this area'}`,
                    highlights: landmark.highlights || [],
                    type: 'landmark',
                    isLandmark: true,
                    city: landmark.city,
                    fromSpotlight: true // Mark as coming from spotlight to differentiate
                });
            }
        });

        // Re-render all city and landmark cards with "Add stop here" buttons
        allWaypoints.forEach((dest, index) => {
            // Add "Add stop here" button before each card (except the first)
            if (index > 0) {
                const addStopContainer = document.createElement('div');
                addStopContainer.className = 'add-stop-container';
                addStopContainer.innerHTML = `
                    <button class="add-stop-btn" onclick="destinationManager.showAddDestinationModal(${index})">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="margin-right: 4px;">
                            <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        Add stop here
                    </button>
                `;
                container.appendChild(addStopContainer);
            }

            const cityCard = this.createCityCard(dest, index);
            container.appendChild(cityCard);
        });

        // Add final "Add stop here" button at the end
        if (allWaypoints.length > 0) {
            const addStopContainer = document.createElement('div');
            addStopContainer.className = 'add-stop-container';
            addStopContainer.innerHTML = `
                <button class="add-stop-btn" onclick="destinationManager.showAddDestinationModal(${allWaypoints.length})">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" style="margin-right: 4px;">
                        <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    Add destination
                </button>
            `;
            container.appendChild(addStopContainer);
        }

        // Add click event listeners for modal functionality
        container.querySelectorAll('.city-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Only trigger modal if not clicking on control buttons
                if (e.target.closest('.add-stop-btn, .move-up-btn, .move-down-btn, .remove-btn')) {
                    return;
                }

                const cityName = card.getAttribute('data-city-name');
                const cityImage = card.getAttribute('data-city-image');
                const cityDescription = card.getAttribute('data-city-description');
                const cityActivities = card.getAttribute('data-city-activities');

                let activities = [];
                try {
                    if (cityActivities) {
                        activities = JSON.parse(decodeURIComponent(cityActivities));
                    }
                } catch (err) {
                }

                // Use spotlight modal if available
                if (window.spotlightController && typeof window.spotlightController.showCityModal === 'function') {
                    window.spotlightController.showCityModal(cityName, cityImage, cityDescription, activities);
                }
            });
        });


        // Re-apply edit mode if active
        if (this.isEditing) {
            setTimeout(() => {
                this.enterEditMode();
            }, 100);
        }

    }

    createCityCard(destination, index) {

        const cityCard = document.createElement('div');
        cityCard.className = 'city-card';
        cityCard.dataset.index = index;

        // Create city card content matching the existing structure
        const highlightsData = destination.activities || destination.highlights || destination.description;
        const highlights = this.formatCityHighlights(highlightsData);

        // Use spotlight.js compatible structure with data attributes for modal
        cityCard.setAttribute('data-city-name', destination.name);
        cityCard.setAttribute('data-city-image', destination.wikipediaImage || '');
        cityCard.setAttribute('data-city-description', destination.description || '');
        cityCard.setAttribute('data-city-activities', encodeURIComponent(JSON.stringify(destination.activities || destination.highlights || [])));
        cityCard.style.cursor = 'pointer';

        const imageSection = destination.wikipediaImage ? `
            <div class="city-image-container">
                <img src="${destination.wikipediaImage}" alt="${destination.name}" class="city-image"
                     onload="this.classList.add('loaded')"
                     onerror="this.style.display='none'">
            </div>
        ` : `
            <div class="city-image-container">
                <div class="no-image-placeholder">
                    <div class="no-image-icon">🏛️</div>
                    <div class="no-image-text">${destination.name}</div>
                </div>
            </div>
        `;

        cityCard.innerHTML = `
            ${imageSection}
            <div class="city-content">
                <h3>${destination.name}</h3>
                ${highlights}
            </div>
            <div class="card-actions">
                <button class="action-btn drag-handle" data-tooltip="Drag to reorder" draggable="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="4" cy="4" r="1.5"/>
                        <circle cx="12" cy="4" r="1.5"/>
                        <circle cx="4" cy="8" r="1.5"/>
                        <circle cx="12" cy="8" r="1.5"/>
                        <circle cx="4" cy="12" r="1.5"/>
                        <circle cx="12" cy="12" r="1.5"/>
                    </svg>
                </button>
                <button class="action-btn remove-btn" data-tooltip="Remove" onclick="destinationManager.removeDestination(${index})">
                    <img src="/images/trash.png" alt="Remove" style="width: 16px; height: 16px;">
                </button>
            </div>
        `;

        // Make the card draggable via the drag handle
        const dragHandle = cityCard.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
            dragHandle.addEventListener('dragend', (e) => this.handleDragEnd(e));
        }

        // Add drag over events to the card itself
        cityCard.addEventListener('dragover', (e) => this.handleDragOver(e));
        cityCard.addEventListener('drop', (e) => this.handleDrop(e, index));
        cityCard.addEventListener('dragleave', () => cityCard.classList.remove('drag-over'));

        return cityCard;
    }

    formatCityHighlights(highlights) {
        if (!highlights) {
            return '<p class="no-activities">Click to see details</p>';
        }

        if (Array.isArray(highlights)) {
            return `<ul class="city-activities">${highlights.slice(0, 3).map(h => {
                // Handle if h is an object or string
                const text = typeof h === 'object' ? (h.activity || h.name || h.title || JSON.stringify(h)) : h;
                return `<li>${text}</li>`;
            }).join('')}</ul>`;
        }

        if (typeof highlights === 'string') {
            // Look for bullet points or numbered lists
            const listItems = highlights.match(/[-•*]\\s*([^\\n\\r]+)/g) ||
                            highlights.match(/\\d+\\.\\s*([^\\n\\r]+)/g);
            if (listItems) {
                const items = listItems.slice(0, 3).map(item => {
                    const cleaned = item.replace(/^[-•*\\d.]\\s*/, '').trim();
                    return cleaned.length > 40 ? cleaned.substring(0, 37) + '...' : cleaned;
                });
                return `<ul class="city-activities">${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
            } else {
                const truncated = highlights.length > 100 ? highlights.substring(0, 97) + '...' : highlights;
                return `<p>${truncated}</p>`;
            }
        }

        return '<p>Beautiful destination with unique attractions</p>';
    }

    // Drag and Drop Handlers
    handleDragStart(e, index) {
        this.draggedItem = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', ''); // Required for some browsers

        // Find city card using safer method
        let card = e.target;
        while (card && !card.classList.contains('city-card')) {
            card = card.parentElement;
        }

        if (card) {
            card.classList.add('dragging');

            // Create a custom drag image
            const dragImage = card.cloneNode(true);
            dragImage.style.opacity = '0.8';
            dragImage.style.transform = 'rotate(5deg)';
            dragImage.style.pointerEvents = 'none';
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            document.body.appendChild(dragImage);

            // Set the custom drag image
            e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);

            // Remove the temporary element after a short delay
            setTimeout(() => {
                if (document.body.contains(dragImage)) {
                    document.body.removeChild(dragImage);
                }
            }, 100);
        }

    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Visual feedback
        const card = e.target.closest('.city-card');
        if (card && !card.classList.contains('dragging')) {
            document.querySelectorAll('.city-card.drag-over').forEach(c => c.classList.remove('drag-over'));
            card.classList.add('drag-over');
        }
    }

    handleDragEnter(e) {
        e.preventDefault();
        const card = e.target.closest('.city-card');
        if (card && !card.classList.contains('dragging')) {
            card.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const card = e.target.closest('.city-card');
        if (card && !card.contains(e.relatedTarget)) {
            card.classList.remove('drag-over');
        }
    }

    handleDrop(e, dropIndex) {
        e.preventDefault();

        // Remove visual feedback
        document.querySelectorAll('.city-card.drag-over').forEach(c => c.classList.remove('drag-over'));

        if (this.draggedItem === null || this.draggedItem === dropIndex) {
            return;
        }

        const draggedDestination = this.destinations[this.draggedItem];

        // Remove from old position
        this.destinations.splice(this.draggedItem, 1);

        // Adjust drop index if necessary
        if (dropIndex > this.draggedItem) dropIndex--;

        // Insert at new position
        this.destinations.splice(dropIndex, 0, draggedDestination);

        // Update UI with animation
        setTimeout(() => {
            this.renderDestinations();
            this.updateRoute();
        }, 100);
    }

    handleDragEnd(e) {
        // Clean up all drag states
        document.querySelectorAll('.city-card').forEach(card => {
            card.classList.remove('dragging', 'drag-over');
        });

        this.draggedItem = null;
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isEditing) {
                this.toggleEditMode();
            }
        });

        // Global drag event listeners for debugging
        document.addEventListener('dragstart', (e) => {
        });

        document.addEventListener('dragover', (e) => {
            // Prevent default to allow drop
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });
    }

    removeAllDragListeners(card) {
        if (card._dragHandlers) {
            Object.entries(card._dragHandlers).forEach(([event, handler]) => {
                card.removeEventListener(event, handler);
            });
            delete card._dragHandlers;
        }
    }

    findOptimalInsertPosition() {
        // If no destinations yet, add at the beginning
        if (this.destinations.length === 0) {
            return 0;
        }

        // For now, return the end position (this will be enhanced when we know the destination)
        // The real optimization happens in addCustomDestination when we have coordinates
        return this.destinations.length;
    }

    findOptimalInsertPositionForDestination(newDestination) {
        // Similar to spotlight's insertLandmarkOptimally method
        if (this.destinations.length === 0) {
            return 0;
        }

        if (!newDestination.coordinates) {
            // If no coordinates, add at end
            return this.destinations.length;
        }

        const newLat = newDestination.coordinates[1];
        const newLng = newDestination.coordinates[0];
        const originLat = 43.5297; // Aix-en-Provence
        const originLng = 5.4474;

        let bestPosition = 0;
        let minAdditionalDistance = Infinity;

        // Calculate distances for each possible insertion position
        for (let i = 0; i <= this.destinations.length; i++) {
            let additionalDistance = 0;

            if (i === 0) {
                // Insert at beginning
                const distanceFromOrigin = this.calculateHaversineDistance(originLat, originLng, newLat, newLng);
                const distanceToFirst = this.destinations.length > 0 && this.destinations[0].coordinates ?
                    this.calculateHaversineDistance(newLat, newLng, this.destinations[0].coordinates[1], this.destinations[0].coordinates[0]) : 0;
                const originalDistanceToFirst = this.destinations.length > 0 && this.destinations[0].coordinates ?
                    this.calculateHaversineDistance(originLat, originLng, this.destinations[0].coordinates[1], this.destinations[0].coordinates[0]) : 0;
                additionalDistance = distanceFromOrigin + distanceToFirst - originalDistanceToFirst;
            } else if (i === this.destinations.length) {
                // Insert at end
                if (this.destinations[i-1].coordinates) {
                    additionalDistance = this.calculateHaversineDistance(
                        this.destinations[i-1].coordinates[1],
                        this.destinations[i-1].coordinates[0],
                        newLat,
                        newLng
                    );
                }
            } else {
                // Insert between waypoints
                if (this.destinations[i-1].coordinates && this.destinations[i].coordinates) {
                    const distanceFromPrev = this.calculateHaversineDistance(
                        this.destinations[i-1].coordinates[1],
                        this.destinations[i-1].coordinates[0],
                        newLat,
                        newLng
                    );
                    const distanceToNext = this.calculateHaversineDistance(
                        newLat,
                        newLng,
                        this.destinations[i].coordinates[1],
                        this.destinations[i].coordinates[0]
                    );
                    const originalDistance = this.calculateHaversineDistance(
                        this.destinations[i-1].coordinates[1],
                        this.destinations[i-1].coordinates[0],
                        this.destinations[i].coordinates[1],
                        this.destinations[i].coordinates[0]
                    );
                    additionalDistance = distanceFromPrev + distanceToNext - originalDistance;
                }
            }

            if (additionalDistance < minAdditionalDistance) {
                minAdditionalDistance = additionalDistance;
                bestPosition = i;
            }
        }

        return bestPosition;
    }

    reorderDestinations(fromIndex, toIndex) {

        if (fromIndex === toIndex) {
            return;
        }

        // Move the destination
        const draggedDestination = this.destinations[fromIndex];

        this.destinations.splice(fromIndex, 1);

        this.destinations.splice(toIndex, 0, draggedDestination);


        // Re-render and update everything
        this.renderDestinations();
        this.updateRoute();
    }
}

// Initialize when DOM is ready with improved timing
let destinationManager;

// Function to initialize destination manager with retries
function initializeDestinationManager(attempt = 1, maxAttempts = 5) {

    // Log all potential spotlight page indicators

    // Check multiple conditions to ensure we're on the right page
    const isSpotlightPage = window.location.pathname.includes('spotlight') ||
                           document.querySelector('.spotlight-main') ||
                           document.querySelector('#citiesContainer');


    if (isSpotlightPage) {
        // Check if we have data to work with
        const hasData = localStorage.getItem('spotlightData') || sessionStorage.getItem('spotlightData');
        const citiesContainer = document.querySelector('#citiesContainer');

        if (!hasData && attempt < maxAttempts) {
            setTimeout(() => initializeDestinationManager(attempt + 1, maxAttempts), 1000);
            return;
        }

        if (!citiesContainer && attempt < maxAttempts) {
            setTimeout(() => initializeDestinationManager(attempt + 1, maxAttempts), 500);
            return;
        }

        try {
            destinationManager = new DestinationManager();
            window.destinationManager = destinationManager; // Make globally accessible

            // Listen for spotlight page updates to re-sync
            setupSpotlightIntegration();

        } catch (error) {
            console.error('Failed to initialize Destination Manager:', error);
            if (attempt < maxAttempts) {
                setTimeout(() => initializeDestinationManager(attempt + 1, maxAttempts), 1000);
            }
        }
    } else {
    }
}

// Setup integration with spotlight page
function setupSpotlightIntegration() {

    // Listen for storage changes (when spotlight.js updates data)
    window.addEventListener('storage', (e) => {
        if (e.key === 'spotlightData' && destinationManager) {
            destinationManager.loadRouteData();
            destinationManager.renderDestinations();
        }
    });

    // Listen for custom events from spotlight.js
    document.addEventListener('spotlightDataUpdated', (e) => {
        if (destinationManager) {
            destinationManager.loadRouteData();
            destinationManager.renderDestinations();
            destinationManager.updateRoute();
        }
    });

    // Wait for spotlight to be fully loaded
    const checkSpotlightLoaded = () => {
        if (window.spotlightMapController || document.querySelectorAll('.city-card').length > 0) {
            if (destinationManager) {
                destinationManager.loadRouteData();
                destinationManager.renderDestinations();
            }
        } else {
            setTimeout(checkSpotlightLoaded, 1000);
        }
    };

    setTimeout(checkSpotlightLoaded, 500);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeDestinationManager();
});

// Also try to initialize when window loads (as a fallback)
window.addEventListener('load', () => {
    if (!destinationManager) {
        initializeDestinationManager();
    }
});

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DestinationManager };
}