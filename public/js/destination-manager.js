/**
 * Destination Manager - Interactive Route Customization System
 * Allows users to add, remove, reorder destinations with live recalculation
 */

class DestinationManager {
    constructor() {
        console.log('🔧 DESTINATION MANAGER: Constructor called');
        this.destinations = [];
        this.origin = '';
        this.finalDestination = '';
        this.isEditing = false;
        this.draggedItem = null;
        this.mapInstance = null;
        this.routeLayer = null;

        console.log('🔧 DESTINATION MANAGER: Calling init()...');
        this.init();
    }

    init() {
        console.log('🔧 DESTINATION MANAGER: Starting initialization...');

        // Load existing route data
        console.log('🔧 INIT: Loading route data...');
        this.loadRouteData();

        // Setup event listeners
        console.log('🔧 INIT: Setting up event listeners...');
        this.setupEventListeners();

        // Initialize UI
        console.log('🔧 INIT: Initializing UI...');
        this.initializeUI();

        // Wait a bit and then check if we need to render existing cities
        setTimeout(() => {
            console.log('🔧 INIT: Delayed check for existing cities...');
            this.checkAndSyncExistingCities();
        }, 1000);

        console.log('✅ Destination Manager initialized successfully');
    }

    loadRouteData() {
        console.log('📊 LOAD ROUTE DATA: Starting...');
        // Load from localStorage or sessionStorage
        const localData = localStorage.getItem('spotlightData');
        const sessionData = sessionStorage.getItem('spotlightData');
        console.log('📊 LocalStorage data:', localData ? 'exists' : 'empty');
        console.log('📊 SessionStorage data:', sessionData ? 'exists' : 'empty');

        const spotlightData = JSON.parse(localData || sessionData || '{}');
        console.log('📊 Parsed spotlight data:', spotlightData);

        if (spotlightData.waypoints) {
            this.destinations = [...spotlightData.waypoints];
            this.origin = spotlightData.origin || 'Aix-en-Provence';
            this.finalDestination = spotlightData.destination || '';
            console.log('📊 Loaded destinations from storage:', this.destinations.length, 'destinations');
            console.log('📊 Destinations:', this.destinations.map(d => d.name));

            // Enrich initial destinations with Wikipedia images if not already enriched
            this.enrichInitialDestinations();
        } else {
            console.log('📊 No waypoints found in storage data');
        }
    }

    async enrichInitialDestinations() {
        console.log('🖼️ ENRICH INITIAL: Starting to enrich initial destinations with Wikipedia images...');

        for (let i = 0; i < this.destinations.length; i++) {
            const destination = this.destinations[i];

            // Skip if already has Wikipedia image
            if (destination.wikipediaImage) {
                console.log(`🖼️ ENRICH INITIAL: ${destination.name} already has Wikipedia image, skipping`);
                continue;
            }

            console.log(`🖼️ ENRICH INITIAL: Fetching Wikipedia image for ${destination.name}...`);

            try {
                const wikipediaImage = await this.getWikipediaImage(destination.name);
                if (wikipediaImage) {
                    this.destinations[i].wikipediaImage = wikipediaImage;
                    console.log(`🖼️ ENRICH INITIAL: Successfully added Wikipedia image for ${destination.name}`);
                } else {
                    console.log(`🖼️ ENRICH INITIAL: No Wikipedia image found for ${destination.name}`);
                }
            } catch (error) {
                console.warn(`🖼️ ENRICH INITIAL: Failed to fetch Wikipedia image for ${destination.name}:`, error);
            }
        }

        // Re-render destinations with new images
        console.log('🖼️ ENRICH INITIAL: Re-rendering destinations with Wikipedia images...');
        this.renderDestinations();
    }

    initializeUI() {
        console.log('🎨 INIT UI: Starting UI initialization...');

        // Add edit mode toggle button
        console.log('🎨 INIT UI: Adding edit mode button...');
        this.addEditModeButton();

        // Enhance existing city cards with controls
        console.log('🎨 INIT UI: Enhancing existing city cards...');
        this.enhanceCityCards();

        // Create add destination modal
        console.log('🎨 INIT UI: Creating add destination modal...');
        this.createAddDestinationModal();

        console.log('🎨 INIT UI: UI initialization complete');
    }

    enhanceCityCards() {
        console.log('🎨 ENHANCE CITY CARDS: Enhancing existing city cards...');
        const cityCards = document.querySelectorAll('.city-card');
        console.log(`🎨 ENHANCE: Found ${cityCards.length} city cards to enhance`);

        cityCards.forEach((card, index) => {
            // Skip if already enhanced
            if (card.querySelector('.remove-city-btn')) {
                console.log(`🎨 ENHANCE: City card ${index} already enhanced`);
                return;
            }

            console.log(`🎨 ENHANCE: Enhancing city card ${index}`);

            // Add to destinations array if not already there
            const cityName = card.querySelector('.city-name')?.textContent?.trim();
            const cityHighlights = card.querySelector('.city-highlights')?.textContent?.trim() || '';

            console.log(`🎨 ENHANCE: Processing city: ${cityName}`);

            if (cityName && !this.destinations.find(d => d.name === cityName)) {
                const newDestination = {
                    name: cityName,
                    coordinates: [0, 0], // Will be updated when route is recalculated
                    highlights: cityHighlights ? [cityHighlights] : [],
                    fromExistingCard: true
                };
                this.destinations.push(newDestination);
                console.log(`🎨 ENHANCE: Added destination from existing card:`, newDestination);
            }

            // Don't add edit controls immediately - only when in edit mode
            // this.addRemoveButton(card, index);
            // this.addDragHandle(card, index);
        });

        console.log('🎨 ENHANCE: Current destinations after enhancement:', this.destinations);
    }

    checkAndSyncExistingCities() {
        console.log('🔄 SYNC CHECK: Checking for existing cities to sync...');

        const cityCards = document.querySelectorAll('.city-card');
        console.log(`🔄 SYNC: Found ${cityCards.length} existing city cards`);

        if (cityCards.length > 0 && this.destinations.length === 0) {
            console.log('🔄 SYNC: No destinations in manager but city cards exist, syncing...');
            this.enhanceCityCards();

            // Update route and map
            if (this.destinations.length > 0) {
                console.log('🔄 SYNC: Synced destinations, updating route...');
                this.updateRoute();
            }
        } else if (cityCards.length === 0 && this.destinations.length > 0) {
            console.log('🔄 SYNC: Have destinations but no city cards, rendering...');
            this.renderDestinations();
        } else {
            console.log('🔄 SYNC: City cards and destinations appear to be in sync');
            console.log(`🔄 SYNC: City cards: ${cityCards.length}, Destinations: ${this.destinations.length}`);
        }
    }

    addEditModeButton() {
        console.log('🔧 EDIT BUTTON: Adding edit mode button...');
        const headerNav = document.querySelector('.header-nav');
        console.log('🔧 EDIT BUTTON: Header nav found:', !!headerNav);

        if (!headerNav) {
            console.warn('❌ EDIT BUTTON: Header nav not found!');
            console.log('🔧 EDIT BUTTON: Available header elements:', document.querySelectorAll('header, .header, .header-content, .nav'));
            return;
        }

        // Check if button already exists
        const existingButton = document.getElementById('edit-route-btn');
        if (existingButton) {
            console.log('⚠️ EDIT BUTTON: Edit button already exists, skipping');
            return;
        }

        const editButton = document.createElement('button');
        editButton.id = 'edit-route-btn';
        editButton.className = 'edit-route-button';
        editButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit Route</span>
        `;

        editButton.addEventListener('click', () => this.toggleEditMode());

        // Insert after the back button in the header nav
        const backButton = document.querySelector('.back-button');
        console.log('Back button found:', !!backButton);

        if (backButton) {
            console.log('✅ Inserting edit button after back button');
            backButton.insertAdjacentElement('afterend', editButton);
        } else {
            console.log('⚠️ Back button not found, using fallback insertion');
            headerNav.insertBefore(editButton, headerNav.firstChild);
        }

        console.log('✅ Edit button added to page');
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        const editButton = document.getElementById('edit-route-btn');
        const citiesContainer = document.getElementById('citiesContainer');

        if (this.isEditing) {
            editButton.classList.add('editing');
            editButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"></path>
                    <path d="M9 9l6 6m0-6l-6 6"></path>
                </svg>
                <span>Done Editing</span>
            `;
            citiesContainer?.classList.add('edit-mode');
            this.enterEditMode();
        } else {
            editButton.classList.remove('editing');
            editButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Edit Route</span>
            `;
            citiesContainer?.classList.remove('edit-mode');
            this.exitEditMode();
        }
    }

    enterEditMode() {
        console.log('🎬 ENTER EDIT MODE: Starting...');

        // Add remove buttons to all city cards
        const cityCards = document.querySelectorAll('.city-card');
        console.log(`🎬 EDIT MODE: Found ${cityCards.length} city cards`);
        console.log(`🎬 EDIT MODE: City cards:`, cityCards);

        cityCards.forEach((card, index) => {
            console.log(`🎬 EDIT MODE: Processing card ${index}:`, card);
            console.log(`🎬 EDIT MODE: Adding remove button to card ${index}`);
            this.addRemoveButton(card, index);
            console.log(`🎬 EDIT MODE: Adding drag handle to card ${index}`);
            this.addDragHandle(card, index);
        });

        // Add main "Add Destination" button
        console.log(`🎬 EDIT MODE: Adding main destination button`);
        this.addMainDestinationButton();

        // Add "Add Stop" buttons between cities
        console.log(`🎬 EDIT MODE: Adding insert buttons`);
        this.addInsertButtons();

        // Show optimization toolbar
        console.log(`🎬 EDIT MODE: Showing optimization toolbar`);
        this.showOptimizationToolbar();

        console.log('✅ EDIT MODE: Edit mode activated successfully');
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
        mainAddBtn.onclick = () => this.showAddDestinationModal(this.destinations.length);

        // Add at the end of the cities container
        citiesContainer.appendChild(mainAddBtn);
    }

    exitEditMode() {
        console.log('🎬 Exiting edit mode...');

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

        console.log('✅ Edit mode deactivated');
    }

    addRemoveButton(card, index) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-city-btn';
        removeBtn.innerHTML = '🗑️';
        removeBtn.title = 'Remove this destination';
        removeBtn.onclick = () => this.removeDestination(index);

        card.appendChild(removeBtn);
    }

    addDragHandle(card, index) {
        console.log(`🎯 ADD DRAG HANDLE: Adding to card at index ${index}`);
        // Skip if already has a drag handle
        if (card.querySelector('.drag-handle')) {
            console.log(`🎯 ADD DRAG HANDLE: Card ${index} already has drag handle, skipping`);
            return;
        }

        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.title = 'Drag to reorder';
        // Don't make the handle itself draggable - let the card handle it
        // dragHandle.draggable = true;
        console.log(`🎯 ADD DRAG HANDLE: Created drag handle for ${index}`);

        // Make the entire card draggable when the handle is present
        card.draggable = true;
        card.style.cursor = 'move';
        card.setAttribute('draggable', 'true'); // Ensure HTML attribute is set
        console.log(`🎯 ADD DRAG HANDLE: Made card ${index} draggable`);

        // Clear any existing event listeners
        this.removeAllDragListeners(card);

        // Remove any conflicting event listeners that might prevent dragging
        card.removeEventListener('mousedown', this.preventDragConflicts);
        card.removeEventListener('touchstart', this.preventDragConflicts);

        // Create unique bound methods for this specific card
        const dragStartHandler = (e) => {
            console.log(`🎯 DRAG START HANDLER: Triggered for index ${index}`);
            console.log(`🎯 DRAG START: index ${index}, destination: ${this.destinations[index]?.name}`);
            console.log(`🎯 DRAG START: Event target:`, e.target);
            console.log(`🎯 DRAG START: Card element:`, card);
            console.log(`🎯 DRAG START: Event type:`, e.type);
            console.log(`🎯 DRAG START: Card draggable:`, card.draggable);

            // Ensure this is actually a drag event
            if (!e.dataTransfer) {
                console.warn(`🎯 DRAG START: No dataTransfer available, not a drag event`);
                return;
            }

            try {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString()); // Use text/plain for better compatibility
                this.draggedItem = index;
                card.classList.add('dragging');
                console.log(`🎯 DRAG START: Set draggedItem to ${index}, added dragging class`);

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
                    console.log(`🎯 DRAG START: Created and set drag image`);

                    setTimeout(() => {
                        if (document.body.contains(dragImage)) {
                            document.body.removeChild(dragImage);
                            console.log(`🎯 DRAG START: Removed temporary drag image`);
                        }
                    }, 100);
                } catch (dragImageError) {
                    console.warn(`🎯 DRAG START: Failed to create drag image:`, dragImageError);
                }
            } catch (error) {
                console.error(`🎯 DRAG START: Error in drag start handler:`, error);
            }
        };

        const dragEndHandler = (e) => {
            console.log(`🎯 DRAG END: index ${index}`);
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
            console.log(`🎯 DROP HANDLER: Triggered for index ${index}`);
            console.log(`🎯 DROP: on index ${index}, dragged item: ${this.draggedItem}`);
            console.log(`🎯 DROP: Event details:`, e);
            console.log(`🎯 DROP: Destinations before reorder:`, this.destinations.map(d => d.name));

            card.classList.remove('drag-over');

            if (this.draggedItem !== null && this.draggedItem !== index) {
                console.log(`🎯 DROP: Valid drop detected, calling reorderDestinations(${this.draggedItem}, ${index})`);
                this.reorderDestinations(this.draggedItem, index);
            } else {
                console.log(`🎯 DROP: Invalid drop - draggedItem: ${this.draggedItem}, dropIndex: ${index}`);
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
        console.log(`🎯 ADD DRAG HANDLE: Adding event listeners to card ${index}`);

        // Use capture phase and ensure events aren't passive
        const eventOptions = { capture: false, passive: false };

        card.addEventListener('dragstart', dragStartHandler, eventOptions);
        card.addEventListener('dragend', dragEndHandler, eventOptions);
        card.addEventListener('dragover', dragOverHandler, eventOptions);
        card.addEventListener('drop', dropHandler, eventOptions);
        card.addEventListener('dragenter', (e) => {
            e.preventDefault();
            console.log(`🎯 DRAG ENTER: Card ${index}`);
        }, eventOptions);
        card.addEventListener('dragleave', (e) => {
            console.log(`🎯 DRAG LEAVE: Card ${index}`);
        }, eventOptions);

        console.log(`🎯 ADD DRAG HANDLE: Event listeners added to card ${index} with options:`, eventOptions);

        // Test drag start with mousedown event
        card.addEventListener('mousedown', (e) => {
            console.log(`🎯 MOUSE DOWN: Card ${index}, preparing for potential drag`);
            console.log(`🎯 MOUSE DOWN: Target:`, e.target);
            console.log(`🎯 MOUSE DOWN: Card draggable:`, card.draggable);
        }, eventOptions);

        // Visual feedback on hover and ensure drag handle doesn't interfere
        dragHandle.addEventListener('mousedown', (e) => {
            console.log(`🎯 DRAG HANDLE MOUSEDOWN: Starting drag on handle for card ${index}`);
            card.style.cursor = 'grabbing';
            // Don't prevent default - let the drag start naturally
        });

        dragHandle.addEventListener('mouseup', () => {
            console.log(`🎯 DRAG HANDLE MOUSEUP: Ending drag on handle for card ${index}`);
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
            addBtn.onclick = () => this.showAddDestinationModal(index);

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
        console.log(`🗑️ Removing destination at index ${index}:`, this.destinations[index]);

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
        console.log('✅ Destination removed. Remaining destinations:', this.destinations);

        // Immediately re-render and update
        this.renderDestinations();
        this.updateRoute();

        // Also update the detailed itinerary if it exists
        this.updateDetailedItinerary();

        console.log(`✅ Successfully removed ${removedCity.name} from route`);
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
                    <button class="btn-add" onclick="destinationManager.addCustomDestination()">Add Custom City</button>
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

            console.log(`✅ Added ${enhancedDestination.name} to route at position ${insertIndex}`);

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
        console.log(`🤖 ENRICH DESTINATION: Enriching data for ${destination.name}...`);

        try {
            // Call Chat API for rich destination description
            console.log(`🤖 ENRICH: Making API call to /api/chat for ${destination.name}`);
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Provide 3-4 key highlights and attractions for ${destination.name}. Focus on must-see places, activities, and unique experiences. Format as bullet points.`
                })
            });

            console.log(`🤖 ENRICH: API response status: ${response.status}`);

            if (response.ok) {
                const data = await response.json();
                console.log(`🤖 ENRICH: API response data:`, data);
                const highlights = this.parseHighlightsFromAI(data.answer || data.response || data.content || '');

                const enrichedDestination = {
                    ...destination,
                    description: `Discover ${destination.name}, a captivating destination with rich culture and amazing attractions`,
                    highlights: highlights,
                    aiGenerated: true,
                    added: new Date().toISOString()
                };

                console.log(`🤖 ENRICH: Successfully enriched ${destination.name}:`, enrichedDestination);
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

            console.log(`🤖 ENRICH: Using fallback data for ${destination.name}:`, fallbackDestination);
            return fallbackDestination;
        }
    }

    parseHighlightsFromAI(content) {
        console.log(`🤖 PARSE HIGHLIGHTS: Parsing content:`, content);

        if (!content || typeof content !== 'string') {
            console.log(`🤖 PARSE: No valid content provided, using fallback`);
            return ['Historic landmarks', 'Local cuisine', 'Cultural attractions', 'Scenic views'];
        }

        // Extract bullet points or numbered items from AI response
        const bulletPoints = content.match(/[-•*]\s*([^\n\r]+)/g) ||
                           content.match(/\d+\.\s*([^\n\r]+)/g) ||
                           content.split('.').filter(item => item.trim().length > 10);

        console.log(`🤖 PARSE: Extracted bullet points:`, bulletPoints);

        if (bulletPoints && bulletPoints.length > 0) {
            const parsed = bulletPoints.slice(0, 4).map(point => {
                const cleaned = point.replace(/^[-•*\d.]\s*/, '').trim();
                return cleaned.length > 60 ? cleaned.substring(0, 57) + '...' : cleaned;
            });
            console.log(`🤖 PARSE: Parsed highlights:`, parsed);
            return parsed;
        }

        // Fallback highlights
        console.log(`🤖 PARSE: No bullet points found, using fallback highlights`);
        return ['Historic landmarks', 'Local cuisine', 'Cultural attractions', 'Scenic views'];
    }

    closeAddModal() {
        const modal = document.getElementById('add-destination-modal');
        modal.classList.remove('show');
        this.selectedDestination = null;
        document.getElementById('destination-search-input').value = '';
    }

    async addCustomDestination(cityName) {
        console.log(`🌍 ADD CUSTOM DESTINATION: Starting with cityName: '${cityName}'`);

        if (!cityName) {
            // Get city name from input if not provided
            cityName = document.getElementById('destination-search-input')?.value?.trim();
            console.log(`🌍 ADD CUSTOM: Got city name from input: '${cityName}'`);
        }

        if (!cityName) {
            console.log(`🌍 ADD CUSTOM: No city name provided, showing alert`);
            alert('Please enter a city name');
            return;
        }

        console.log(`🌍 ADD CUSTOM: Adding custom destination: ${cityName}`);
        console.log(`🌍 ADD CUSTOM: Current destinations before add:`, this.destinations.map(d => d.name));

        // Show loading state
        const addBtn = document.querySelector('.btn-add');
        const originalText = addBtn.textContent;
        addBtn.innerHTML = '<div class="btn-spinner"></div> Adding City...';
        addBtn.disabled = true;
        console.log(`🌍 ADD CUSTOM: Set loading state on button`);

        try {
            // Try to get coordinates for the city from our database first
            const europeanCities = this.getEuropeanCitiesDatabase();
            const cityData = europeanCities.find(city =>
                city.name.toLowerCase() === cityName.toLowerCase()
            );
            const coordinates = cityData ? cityData.coords : [0, 0];
            console.log(`🌍 ADD CUSTOM: Found coordinates for ${cityName}:`, coordinates);

            // Create destination with proper coordinates if available
            const newDestination = {
                name: cityName,
                coordinates: coordinates,
                highlights: ['Loading city information...'],
                isCustom: true
            };
            console.log(`🌍 ADD CUSTOM: Created new destination object:`, newDestination);

            // Add to destinations immediately for UX
            const modal = document.getElementById('add-destination-modal');
            const insertIndex = parseInt(modal.dataset.insertIndex) || this.destinations.length;
            console.log(`🌍 ADD CUSTOM: Insert index: ${insertIndex}`);

            this.destinations.splice(insertIndex, 0, newDestination);
            console.log(`🌍 ADD CUSTOM: Added to destinations array at index ${insertIndex}`);
            console.log(`🌍 ADD CUSTOM: New destinations array:`, this.destinations.map(d => d.name));

            console.log(`🌍 ADD CUSTOM: Calling renderDestinations...`);
            this.renderDestinations();
            console.log(`🌍 ADD CUSTOM: Calling updateRoute...`);
            this.updateRoute();

            // Close modal
            console.log(`🌍 ADD CUSTOM: Closing modal...`);
            this.closeAddModal();

            // Enrich with APIs in background
            console.log(`🌍 ADD CUSTOM: Starting background enrichment...`);
            // Get the actual added destination from the array (not the original object)
            const addedDestination = this.destinations[insertIndex];
            await this.enrichCustomDestination(addedDestination);

        } catch (error) {
            console.error('❌ ADD CUSTOM: Error adding custom destination:', error);
            alert('Failed to add city. Please try again.');
        } finally {
            // Restore button
            console.log('🌍 ADD CUSTOM: Restoring button state...');
            if (addBtn) {
                addBtn.textContent = originalText;
                addBtn.disabled = false;
            }
        }
    }

    async enrichCustomDestination(destination) {
        console.log(`🔍 ENRICH CUSTOM: Enriching data for ${destination.name}...`);

        try {
            // Get Wikipedia image and basic info
            console.log(`🔍 ENRICH CUSTOM: Getting Wikipedia image for ${destination.name}...`);
            const wikipediaImage = await this.getWikipediaImage(destination.name);
            console.log(`🔍 ENRICH CUSTOM: Wikipedia image result:`, wikipediaImage ? 'found' : 'not found');

            // Get AI description
            console.log(`🔍 ENRICH CUSTOM: Getting AI description for ${destination.name}...`);
            const aiData = await this.enrichDestinationData(destination);
            console.log(`🔍 ENRICH CUSTOM: AI data result:`, aiData);

            // Update the destination in our array
            const destIndex = this.destinations.findIndex(d => d.name === destination.name);
            console.log(`🔍 ENRICH CUSTOM: Found destination at index:`, destIndex);

            if (destIndex !== -1) {
                this.destinations[destIndex].highlights = aiData.highlights || destination.highlights;
                this.destinations[destIndex].wikipediaImage = wikipediaImage;
                this.destinations[destIndex].description = aiData.description;
                this.destinations[destIndex].enriched = true;

                console.log(`🔍 ENRICH CUSTOM: Updated destination:`, this.destinations[destIndex]);

                // Re-render to show enriched data
                console.log(`🔍 ENRICH CUSTOM: Re-rendering destinations...`);
                this.renderDestinations();

                // Also update the map
                console.log(`🔍 ENRICH CUSTOM: Updating route...`);
                this.updateRoute();

                console.log(`✅ ENRICH CUSTOM: Successfully enriched ${destination.name}`);
            } else {
                console.warn(`🔍 ENRICH CUSTOM: Could not find destination ${destination.name} in array`);
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
        console.log('🔄 Optimizing route with', this.destinations.length, 'destinations...');

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

        console.log(`🎯 Optimization complete: ${originalDistance}km → ${newDistance}km (${improvementPercent}% improvement)`);
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
        console.log('✅ Route saved successfully');
    }

    resetRoute() {
        if (confirm('Reset to original route? Your changes will be lost.')) {
            this.loadRouteData();
            this.renderDestinations();
        }
    }

    updateRoute() {
        console.log('🔄 Updating route with destinations:', this.destinations);

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
        console.log(`📍 Total calculated distance: ${this.totalDistance} km`);

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
        console.log('🗺️ UPDATE MAP ROUTE: Starting with', this.destinations.length, 'destinations');
        console.log('🗺️ UPDATE MAP ROUTE: Destinations to map:', this.destinations.map(d => ({ name: d.name, coords: d.coordinates })));

        // Check what map objects are available
        console.log('🗺️ AVAILABLE OBJECTS:');
        console.log('  - window.updateMapRoute:', typeof window.updateMapRoute);
        console.log('  - window.spotlightMapController:', !!window.spotlightMapController);
        console.log('  - window.spotlightController:', !!window.spotlightController);
        console.log('  - window.spotlightController.map:', !!(window.spotlightController && window.spotlightController.map));
        console.log('  - window.map:', !!window.map);
        console.log('  - window.updateSpotlightRoute:', typeof window.updateSpotlightRoute);

        try {
            // Try multiple map update strategies
            let updated = false;

            // Strategy 1: Global updateMapRoute function
            if (typeof window.updateMapRoute === 'function') {
                console.log('📍 UPDATE MAP: Using global updateMapRoute function');
                try {
                    window.updateMapRoute(this.destinations);
                    console.log('📍 UPDATE MAP: Global updateMapRoute called successfully');
                    updated = true;
                } catch (err) {
                    console.error('📍 UPDATE MAP: Global updateMapRoute failed:', err);
                }
            }

            // Strategy 2: Spotlight controller with map
            if (window.spotlightController && window.spotlightController.map) {
                console.log('📍 UPDATE MAP: Using spotlight controller with direct map access');
                try {
                    // Use spotlight controller's map directly
                    window.map = window.spotlightController.map; // Set global reference for compatibility
                    this.directMapUpdate();
                    console.log('📍 UPDATE MAP: Spotlight controller map update called successfully');
                    updated = true;
                } catch (err) {
                    console.error('📍 UPDATE MAP: Spotlight controller map update failed:', err);
                }
            }

            // Strategy 2b: Legacy spotlight map controller
            if (!updated && window.spotlightMapController && window.spotlightMapController.updateRoute) {
                console.log('📍 UPDATE MAP: Using legacy spotlight map controller');
                try {
                    window.spotlightMapController.updateRoute(this.destinations);
                    console.log('📍 UPDATE MAP: Legacy spotlight map controller called successfully');
                    updated = true;
                } catch (err) {
                    console.error('📍 UPDATE MAP: Legacy spotlight map controller failed:', err);
                }
            }

            // Strategy 3: Direct map update (window.map or spotlight map)
            const mapInstance = window.map || (window.spotlightController && window.spotlightController.map);
            if (mapInstance) {
                console.log('📍 UPDATE MAP: Using direct map update with map instance');
                try {
                    // Ensure window.map points to the right instance
                    if (!window.map && window.spotlightController && window.spotlightController.map) {
                        window.map = window.spotlightController.map;
                        console.log('📍 UPDATE MAP: Set window.map to spotlight controller map');
                    }
                    this.directMapUpdate();
                    console.log('📍 UPDATE MAP: Direct map update called successfully');
                    updated = true;
                } catch (err) {
                    console.error('📍 UPDATE MAP: Direct map update failed:', err);
                }
            }

            // Strategy 4: Custom event dispatch
            if (!updated) {
                console.log('📍 UPDATE MAP: Triggering custom map update event');
                const event = new CustomEvent('routeUpdated', {
                    detail: { destinations: this.destinations }
                });
                document.dispatchEvent(event);
                console.log('📍 UPDATE MAP: Custom event dispatched');

                // Also try to update via spotlight.js if available
                if (window.updateSpotlightRoute) {
                    console.log('📍 UPDATE MAP: Calling window.updateSpotlightRoute');
                    try {
                        window.updateSpotlightRoute(this.destinations);
                        console.log('📍 UPDATE MAP: window.updateSpotlightRoute called successfully');
                    } catch (err) {
                        console.error('📍 UPDATE MAP: window.updateSpotlightRoute failed:', err);
                    }
                }
            }

            console.log('✅ UPDATE MAP: Map route update completed, updated =', updated);
        } catch (error) {
            console.error('⚠️ UPDATE MAP: Map update failed with error:', error);
        }
    }

    async directMapUpdate() {
        console.log('🗺️ DIRECT MAP UPDATE: Starting direct map update...');

        // Direct map update when global functions aren't available
        if (!window.map) {
            console.log('🗺️ DIRECT MAP: No window.map found');
            return;
        }

        console.log('🗺️ DIRECT MAP: Map instance found, updating...');
        console.log('🗺️ DIRECT MAP: Destinations to map:', this.destinations.map(d => ({ name: d.name, coords: d.coordinates })));

        // Check if spotlight controller has an updateRoute method we can use instead
        if (window.spotlightController && typeof window.spotlightController.updateRoute === 'function') {
            console.log('🗺️ DIRECT MAP: Using spotlight controller updateRoute method');
            try {
                window.spotlightController.updateRoute(this.destinations);
                console.log('🗺️ DIRECT MAP: Successfully updated route via spotlight controller');
                return;
            } catch (error) {
                console.warn('🗺️ DIRECT MAP: Spotlight controller updateRoute failed:', error);
            }
        }

        // Try to update existing spotlight route instead of clearing everything
        if (window.spotlightController) {
            console.log('🗺️ DIRECT MAP: Updating spotlight controller waypoints directly');
            try {
                // Update both spotlightData.waypoints and waypoints property
                if (window.spotlightController.spotlightData) {
                    window.spotlightController.spotlightData.waypoints = this.destinations;
                    console.log('🗺️ DIRECT MAP: Updated spotlightData.waypoints');
                }

                // Also update localStorage so changes persist
                const existingData = JSON.parse(localStorage.getItem('spotlightData') || '{}');
                existingData.waypoints = this.destinations;
                localStorage.setItem('spotlightData', JSON.stringify(existingData));
                console.log('🗺️ DIRECT MAP: Updated localStorage spotlightData');

                // Call spotlight's displayCities method to re-render
                if (typeof window.spotlightController.displayCities === 'function') {
                    await window.spotlightController.displayCities();
                    console.log('🗺️ DIRECT MAP: Called spotlight displayCities()');
                }

                // Call recalculateRoute with new waypoints if available
                if (typeof window.spotlightController.recalculateRoute === 'function') {
                    await window.spotlightController.recalculateRoute(this.destinations);
                    console.log('🗺️ DIRECT MAP: Called spotlight recalculateRoute()');
                }

                console.log('🗺️ DIRECT MAP: Successfully updated spotlight waypoints and route');
                return;
            } catch (error) {
                console.warn('🗺️ DIRECT MAP: Failed to update spotlight waypoints:', error);
            }
        }

        console.log('🗺️ DIRECT MAP: Falling back to custom map updates...');

        // Clear only our custom markers, not spotlight markers
        if (window.mapMarkers) {
            console.log('🗺️ DIRECT MAP: Clearing', window.mapMarkers.length, 'existing custom markers');
            window.mapMarkers.forEach(marker => marker.remove());
            window.mapMarkers = [];
        }

        // Add new markers for destinations
        const markers = [];
        this.destinations.forEach((dest, index) => {
            console.log(`🗺️ DIRECT MAP: Processing destination ${index}: ${dest.name}`);
            console.log(`🗺️ DIRECT MAP: Coordinates for ${dest.name}:`, dest.coordinates);

            if (dest.coordinates && Array.isArray(dest.coordinates) && dest.coordinates.length === 2) {
                const [lng, lat] = dest.coordinates;
                if (lng !== 0 && lat !== 0 && !isNaN(lng) && !isNaN(lat)) {
                    console.log(`🗺️ DIRECT MAP: Adding marker for ${dest.name} at [${lng}, ${lat}]`);
                    try {
                        const marker = new mapboxgl.Marker()
                            .setLngLat([lng, lat])
                            .setPopup(new mapboxgl.Popup({ offset: 25 })
                                .setHTML(`<h3>${dest.name}</h3><p>Stop ${index + 1}</p>`))
                            .addTo(window.map);
                        markers.push(marker);
                        console.log(`🗺️ DIRECT MAP: Successfully added marker for ${dest.name}`);
                    } catch (error) {
                        console.error(`🗺️ DIRECT MAP: Failed to add marker for ${dest.name}:`, error);
                    }
                } else {
                    console.log(`🗺️ DIRECT MAP: Invalid coordinates for ${dest.name}: [${lng}, ${lat}]`);
                }
            } else {
                console.log(`🗺️ DIRECT MAP: No valid coordinates for ${dest.name}:`, dest.coordinates);
            }
        });

        window.mapMarkers = markers;
        console.log(`🗺️ DIRECT MAP: Added ${markers.length} markers to map`);

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

        console.log(`🗺️ DIRECT MAP: Valid coordinates for route line:`, validCoords);

        if (validCoords.length > 1) {
            console.log('🗺️ DIRECT MAP: Creating route line with', validCoords.length, 'points');
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
                    console.log('🗺️ DIRECT MAP: Updating existing route source');
                    window.map.getSource('route').setData(routeData);
                } else {
                    console.log('🗺️ DIRECT MAP: Creating new route source and layer');
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
                console.log('🗺️ DIRECT MAP: Route line updated successfully');
            } catch (error) {
                console.error('🗺️ DIRECT MAP: Failed to update route line:', error);
            }
        } else {
            console.log('🗺️ DIRECT MAP: Not enough valid coordinates for route line');
        }

        console.log('✅ DIRECT MAP: Map updated with', this.destinations.length, 'destinations');
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

        console.log(`📊 Route Stats Updated: ${totalStops} stops, ${this.totalDistance} km, ${estimatedDays} days`);
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

        console.log('💾 Route metadata updated in storage');
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
        console.log('🔄 RENDER DESTINATIONS: Starting render...');
        console.log('🔄 RENDER: Destinations to render:', this.destinations.length);
        console.log('🔄 RENDER: Destination names:', this.destinations.map(d => d.name));
        console.log('🔄 RENDER: Full destinations:', this.destinations);

        const container = document.getElementById('citiesContainer');
        console.log('🔄 RENDER: Cities container found:', !!container);

        if (!container) {
            console.warn('❌ RENDER: Cities container not found!');
            console.log('🔍 RENDER: Available elements with "cities":', document.querySelectorAll('[id*="cities"]'));
            console.log('🔍 RENDER: All elements with city-related classes:', document.querySelectorAll('.city-card, .cities-container, .cities-section'));
            return;
        }

        console.log('🔄 RENDER: Container found, clearing contents...');
        // Clear container completely
        container.innerHTML = '';
        console.log('🔄 RENDER: Container cleared');

        // Re-render all city cards with current destinations
        console.log('🔄 RENDER: Creating city cards...');
        this.destinations.forEach((dest, index) => {
            console.log(`🔄 RENDER: Creating card ${index} for ${dest.name}`);
            const cityCard = this.createCityCard(dest, index);
            console.log(`🔄 RENDER: Created card for ${dest.name}:`, cityCard);
            container.appendChild(cityCard);
            console.log(`🔄 RENDER: Appended card ${index} to container`);
        });

        console.log('🔄 RENDER: All cards created and appended');
        console.log('🔄 RENDER: Container now has', container.children.length, 'children');

        // Re-apply edit mode if active
        if (this.isEditing) {
            console.log('🔄 RENDER: Edit mode is active, re-applying edit controls...');
            setTimeout(() => {
                console.log('🔄 RENDER: Calling enterEditMode()...');
                this.enterEditMode();
            }, 100);
        } else {
            console.log('🔄 RENDER: Edit mode not active');
        }

        console.log('✅ RENDER: Rendered', this.destinations.length, 'destinations successfully');
    }

    createCityCard(destination, index) {
        console.log(`🏠 CREATE CITY CARD: Creating card for ${destination.name} at index ${index}`);
        console.log(`🏠 CREATE CARD: Destination data:`, destination);

        const cityCard = document.createElement('div');
        cityCard.className = 'city-card';
        cityCard.dataset.index = index;
        console.log(`🏠 CREATE CARD: Created div element with class 'city-card'`);

        // Create city card content matching the existing structure
        const highlights = this.formatCityHighlights(destination.highlights || destination.description);
        console.log(`🏠 CREATE CARD: Formatted highlights:`, highlights);
        console.log(`🏠 CREATE CARD: Wikipedia image for ${destination.name}:`, destination.wikipediaImage);

        // Create city card with Wikipedia image if available
        const imageSection = destination.wikipediaImage ? `
            <div class="city-image">
                <img src="${destination.wikipediaImage}" alt="${destination.name}" class="city-thumbnail" onerror="this.style.display='none'">
            </div>
        ` : '';

        cityCard.innerHTML = `
            ${imageSection}
            <div class="city-info">
                <h3 class="city-name">${destination.name}</h3>
                <div class="city-highlights">
                    ${highlights}
                </div>
            </div>
        `;
        console.log(`🏠 CREATE CARD: Set innerHTML for ${destination.name} with image:`, !!destination.wikipediaImage);
        console.log(`🏠 CREATE CARD: Final card structure:`, cityCard.outerHTML);

        return cityCard;
    }

    formatCityHighlights(highlights) {
        if (!highlights) {
            return '<p>Beautiful destination with unique attractions</p>';
        }

        if (Array.isArray(highlights)) {
            return `<ul>${highlights.slice(0, 3).map(h => `<li>${h}</li>`).join('')}</ul>`;
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
                return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
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

        console.log(`🎯 Drag started for item ${index}: ${this.destinations[index]?.name}`);
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
        console.log(`🎯 Dropping ${draggedDestination.name} from position ${this.draggedItem} to ${dropIndex}`);

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

        console.log('🎯 Drag operation completed');
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
            console.log(`🎯 GLOBAL DRAG START: Element:`, e.target);
            console.log(`🎯 GLOBAL DRAG START: Is city card:`, e.target.classList.contains('city-card'));
        });

        document.addEventListener('dragover', (e) => {
            // Prevent default to allow drop
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            console.log(`🎯 GLOBAL DROP: Element:`, e.target);
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

    reorderDestinations(fromIndex, toIndex) {
        console.log(`🔄 REORDER DESTINATIONS: Starting reorder from ${fromIndex} to ${toIndex}`);
        console.log(`🔄 REORDER: Current destinations:`, this.destinations.map(d => d.name));
        console.log(`🔄 REORDER: Moving destination: ${this.destinations[fromIndex]?.name}`);

        if (fromIndex === toIndex) {
            console.log(`🔄 REORDER: Indices are the same, skipping`);
            return;
        }

        // Move the destination
        const draggedDestination = this.destinations[fromIndex];
        console.log(`🔄 REORDER: Extracted destination:`, draggedDestination);

        this.destinations.splice(fromIndex, 1);
        console.log(`🔄 REORDER: After removing from ${fromIndex}:`, this.destinations.map(d => d.name));

        this.destinations.splice(toIndex, 0, draggedDestination);
        console.log(`🔄 REORDER: After inserting at ${toIndex}:`, this.destinations.map(d => d.name));

        console.log('🔄 REORDER: New order final:', this.destinations.map(d => d.name));

        // Re-render and update everything
        console.log('🔄 REORDER: Calling renderDestinations...');
        this.renderDestinations();
        console.log('🔄 REORDER: Calling updateRoute...');
        this.updateRoute();
        console.log('🔄 REORDER: Reorder complete');
    }
}

// Initialize when DOM is ready with improved timing
let destinationManager;

// Function to initialize destination manager with retries
function initializeDestinationManager(attempt = 1, maxAttempts = 5) {
    console.log(`🔍 INITIALIZATION ATTEMPT ${attempt}/${maxAttempts}: Checking page for initialization...`);
    console.log('🔍 INIT: Current path:', window.location.pathname);
    console.log('🔍 INIT: Page title:', document.title);
    console.log('🔍 INIT: Document ready state:', document.readyState);

    // Log all potential spotlight page indicators
    console.log('🔍 INIT: Page indicators:');
    console.log('  - Path includes spotlight:', window.location.pathname.includes('spotlight'));
    console.log('  - .spotlight-main element:', !!document.querySelector('.spotlight-main'));
    console.log('  - #citiesContainer element:', !!document.querySelector('#citiesContainer'));
    console.log('  - .cities-container element:', !!document.querySelector('.cities-container'));
    console.log('  - .city-card elements:', document.querySelectorAll('.city-card').length);
    console.log('  - localStorage spotlightData:', !!localStorage.getItem('spotlightData'));
    console.log('  - sessionStorage spotlightData:', !!sessionStorage.getItem('spotlightData'));

    // Check multiple conditions to ensure we're on the right page
    const isSpotlightPage = window.location.pathname.includes('spotlight') ||
                           document.querySelector('.spotlight-main') ||
                           document.querySelector('#citiesContainer');

    console.log('🔍 INIT: Is spotlight page?', isSpotlightPage);

    if (isSpotlightPage) {
        // Check if we have data to work with
        const hasData = localStorage.getItem('spotlightData') || sessionStorage.getItem('spotlightData');
        const citiesContainer = document.querySelector('#citiesContainer');

        if (!hasData && attempt < maxAttempts) {
            console.log(`🕰️ INIT: No spotlight data found, retrying in 1000ms (attempt ${attempt}/${maxAttempts})`);
            setTimeout(() => initializeDestinationManager(attempt + 1, maxAttempts), 1000);
            return;
        }

        if (!citiesContainer && attempt < maxAttempts) {
            console.log(`🕰️ INIT: Cities container not found, retrying in 500ms (attempt ${attempt}/${maxAttempts})`);
            setTimeout(() => initializeDestinationManager(attempt + 1, maxAttempts), 500);
            return;
        }

        console.log('✅ INITIALIZATION: Detected spotlight page - Initializing Destination Manager...');
        try {
            destinationManager = new DestinationManager();
            window.destinationManager = destinationManager; // Make globally accessible
            console.log('✅ INITIALIZATION: Destination Manager initialized successfully');
            console.log('🔍 INIT: Global destinationManager object:', window.destinationManager);

            // Listen for spotlight page updates to re-sync
            setupSpotlightIntegration();

        } catch (error) {
            console.error('❌ INITIALIZATION: Failed to initialize Destination Manager:', error);
            if (attempt < maxAttempts) {
                console.log(`🕰️ INIT: Error occurred, retrying in 1000ms (attempt ${attempt}/${maxAttempts})`);
                setTimeout(() => initializeDestinationManager(attempt + 1, maxAttempts), 1000);
            }
        }
    } else {
        console.log('❌ INITIALIZATION: Not a spotlight page, skipping initialization');
        console.log('🔍 INIT: Available elements:', document.body.innerHTML.substring(0, 500) + '...');
    }
}

// Setup integration with spotlight page
function setupSpotlightIntegration() {
    console.log('🤝 INTEGRATION: Setting up spotlight integration...');

    // Listen for storage changes (when spotlight.js updates data)
    window.addEventListener('storage', (e) => {
        if (e.key === 'spotlightData' && destinationManager) {
            console.log('🤝 INTEGRATION: Storage updated, reloading route data...');
            destinationManager.loadRouteData();
            destinationManager.renderDestinations();
        }
    });

    // Listen for custom events from spotlight.js
    document.addEventListener('spotlightDataUpdated', (e) => {
        console.log('🤝 INTEGRATION: Spotlight data updated event received:', e.detail);
        if (destinationManager) {
            destinationManager.loadRouteData();
            destinationManager.renderDestinations();
            destinationManager.updateRoute();
        }
    });

    // Wait for spotlight to be fully loaded
    const checkSpotlightLoaded = () => {
        if (window.spotlightMapController || document.querySelectorAll('.city-card').length > 0) {
            console.log('🤝 INTEGRATION: Spotlight appears to be loaded, syncing...');
            if (destinationManager) {
                destinationManager.loadRouteData();
                destinationManager.renderDestinations();
            }
        } else {
            console.log('🤝 INTEGRATION: Waiting for spotlight to load...');
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
        console.log('🕰️ FALLBACK: Window loaded, trying initialization again...');
        initializeDestinationManager();
    }
});

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DestinationManager };
}