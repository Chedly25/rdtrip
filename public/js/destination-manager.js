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

        console.log('✅ Destination Manager initialized');
    }

    loadRouteData() {
        // Load from localStorage or sessionStorage
        const spotlightData = JSON.parse(localStorage.getItem('spotlightData') || sessionStorage.getItem('spotlightData') || '{}');

        if (spotlightData.waypoints) {
            this.destinations = [...spotlightData.waypoints];
            this.origin = spotlightData.origin || 'Aix-en-Provence';
            this.finalDestination = spotlightData.destination || '';
        }
    }

    initializeUI() {
        // Add edit mode toggle button
        this.addEditModeButton();

        // Enhance existing city cards with controls
        this.enhanceCityCards();

        // Create add destination modal
        this.createAddDestinationModal();
    }

    enhanceCityCards() {
        console.log('🎨 Enhancing existing city cards...');
        const cityCards = document.querySelectorAll('.city-card');
        console.log(`Found ${cityCards.length} city cards to enhance`);

        cityCards.forEach((card, index) => {
            // Skip if already enhanced
            if (card.querySelector('.remove-city-btn')) {
                console.log(`City card ${index} already enhanced`);
                return;
            }

            console.log(`Enhancing city card ${index}`);

            // Add to destinations array if not already there
            const cityName = card.querySelector('.city-name')?.textContent?.trim();
            if (cityName && !this.destinations.find(d => d.name === cityName)) {
                this.destinations.push({
                    name: cityName,
                    coordinates: [0, 0], // Will be updated when route is recalculated
                    highlights: card.querySelector('.city-highlights')?.textContent?.trim() || []
                });
            }

            // Add edit controls when in edit mode
            this.addRemoveButton(card, index);
            this.addDragHandle(card, index);
        });

        console.log('Current destinations:', this.destinations);
    }

    addEditModeButton() {
        console.log('🔧 Adding edit mode button...');
        const headerNav = document.querySelector('.header-nav');
        console.log('Header nav found:', !!headerNav);

        if (!headerNav) {
            console.warn('❌ Header nav not found!');
            return;
        }

        // Check if button already exists
        const existingButton = document.getElementById('edit-route-btn');
        if (existingButton) {
            console.log('⚠️ Edit button already exists, skipping');
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
        console.log('🎬 Entering edit mode...');

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

        console.log('✅ Edit mode activated');
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
        // Skip if already has a drag handle
        if (card.querySelector('.drag-handle')) return;

        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.draggable = true;
        dragHandle.title = 'Drag to reorder';

        // Make the entire card draggable when the handle is present
        card.draggable = true;

        // Add all drag event listeners to both handle and card
        card.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        card.addEventListener('dragend', (e) => this.handleDragEnd(e));
        card.addEventListener('dragover', (e) => this.handleDragOver(e));
        card.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        card.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        card.addEventListener('drop', (e) => this.handleDrop(e, index));

        // Visual feedback on hover
        dragHandle.addEventListener('mousedown', () => {
            card.style.cursor = 'grabbing';
        });

        dragHandle.addEventListener('mouseup', () => {
            card.style.cursor = '';
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
        console.log(`🤖 Enriching data for ${destination.name}...`);

        try {
            // Call Perplexity API for rich destination description
            const response = await fetch('/api/perplexity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: `Provide 3-4 key highlights and attractions for ${destination.name}. Focus on must-see places, activities, and unique experiences. Format as bullet points.`
                })
            });

            if (response.ok) {
                const data = await response.json();
                const highlights = this.parseHighlightsFromAI(data.content);

                return {
                    ...destination,
                    description: `Discover ${destination.name}, a captivating destination with rich culture and amazing attractions`,
                    highlights: highlights,
                    aiGenerated: true,
                    added: new Date().toISOString()
                };
            } else {
                throw new Error('Perplexity API request failed');
            }
        } catch (error) {
            console.warn('⚠️ AI enrichment failed, using fallback data:', error);

            // Fallback to basic destination data
            return {
                ...destination,
                description: `Beautiful ${destination.name} with amazing attractions and experiences`,
                highlights: [`Explore ${destination.name}`, `Local cuisine`, `Historic sites`, `Local culture`],
                added: new Date().toISOString()
            };
        }
    }

    parseHighlightsFromAI(content) {
        // Extract bullet points or numbered items from AI response
        const bulletPoints = content.match(/[-•*]\\s*([^\\n\\r]+)/g) ||
                           content.match(/\\d+\\.\\s*([^\\n\\r]+)/g) ||
                           content.split('.').filter(item => item.trim().length > 10);

        if (bulletPoints && bulletPoints.length > 0) {
            return bulletPoints.slice(0, 4).map(point => {
                const cleaned = point.replace(/^[-•*\\d.]\\s*/, '').trim();
                return cleaned.length > 60 ? cleaned.substring(0, 57) + '...' : cleaned;
            });
        }

        // Fallback highlights
        return ['Historic landmarks', 'Local cuisine', 'Cultural attractions', 'Scenic views'];
    }

    closeAddModal() {
        const modal = document.getElementById('add-destination-modal');
        modal.classList.remove('show');
        this.selectedDestination = null;
        document.getElementById('destination-search-input').value = '';
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

        console.log(`🌍 Adding custom destination: ${cityName}`);

        // Show loading state
        const addBtn = document.querySelector('.btn-add');
        const originalText = addBtn.textContent;
        addBtn.innerHTML = '<div class="btn-spinner"></div> Adding City...';
        addBtn.disabled = true;

        try {
            // Create destination with default coordinates (will be updated)
            const newDestination = {
                name: cityName,
                coordinates: [0, 0], // Default coordinates
                highlights: ['Loading city information...'],
                isCustom: true
            };

            // Add to destinations immediately for UX
            const modal = document.getElementById('add-destination-modal');
            const insertIndex = parseInt(modal.dataset.insertIndex) || this.destinations.length;

            this.destinations.splice(insertIndex, 0, newDestination);
            this.renderDestinations();
            this.updateRoute();

            // Close modal
            this.closeAddModal();

            // Enrich with APIs in background
            await this.enrichCustomDestination(newDestination);

        } catch (error) {
            console.error('❌ Error adding custom destination:', error);
            alert('Failed to add city. Please try again.');
        } finally {
            // Restore button
            addBtn.textContent = originalText;
            addBtn.disabled = false;
        }
    }

    async enrichCustomDestination(destination) {
        console.log(`🔍 Enriching data for ${destination.name}...`);

        try {
            // Get Wikipedia image and basic info
            const wikipediaImage = await this.getWikipediaImage(destination.name);

            // Get Perplexity description
            const perplexityData = await this.enrichDestinationData(destination);

            // Update the destination in our array
            const destIndex = this.destinations.findIndex(d => d.name === destination.name);
            if (destIndex !== -1) {
                this.destinations[destIndex].highlights = perplexityData.highlights || destination.highlights;
                this.destinations[destIndex].wikipediaImage = wikipediaImage;
                this.destinations[destIndex].description = perplexityData.description;

                // Re-render to show enriched data
                this.renderDestinations();

                console.log(`✅ Successfully enriched ${destination.name}`);
            }

        } catch (error) {
            console.error(`❌ Failed to enrich ${destination.name}:`, error);
        }
    }

    async enrichDestinationData(destination) {
        try {
            const response = await fetch('/api/perplexity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `Provide 3-4 key highlights and attractions for ${destination.name}. Focus on must-see places, activities, and unique experiences. Format as bullet points.`
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status}`);
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
        console.log('🗺️ Updating map route...');

        try {
            // Check if spotlight map exists
            if (typeof window.updateMapRoute === 'function') {
                // Call the global map update function
                window.updateMapRoute(this.destinations);
            } else if (window.map) {
                // Direct access to map object
                this.directMapUpdate();
            } else {
                console.log('ℹ️ Map not available for update');
            }
        } catch (error) {
            console.warn('⚠️ Map update failed:', error);
        }
    }

    directMapUpdate() {
        // Direct map update when global functions aren't available
        if (!window.map) return;

        // Clear existing markers and route
        if (window.mapMarkers) {
            window.mapMarkers.forEach(marker => marker.remove());
            window.mapMarkers = [];
        }

        // Add new markers for destinations
        const markers = [];
        this.destinations.forEach((dest, index) => {
            if (dest.coordinates && dest.coordinates[0] !== 0) {
                const marker = new mapboxgl.Marker()
                    .setLngLat(dest.coordinates)
                    .setPopup(new mapboxgl.Popup({ offset: 25 })
                        .setHTML(`<h3>${dest.name}</h3><p>Stop ${index + 1}</p>`))
                    .addTo(window.map);
                markers.push(marker);
            }
        });

        window.mapMarkers = markers;

        // Update route line if we have coordinates
        const validCoords = this.destinations
            .filter(dest => dest.coordinates && dest.coordinates[0] !== 0)
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
        }

        console.log('✅ Map updated with', this.destinations.length, 'destinations');
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
        console.log('🔄 Rendering destinations:', this.destinations);
        const container = document.getElementById('citiesContainer');
        if (!container) {
            console.warn('❌ Cities container not found!');
            console.log('🔍 Available elements with "cities":', document.querySelectorAll('[id*="cities"]'));
            return;
        }

        // Clear container completely
        container.innerHTML = '';

        // Re-render all city cards with current destinations
        this.destinations.forEach((dest, index) => {
            const cityCard = this.createCityCard(dest, index);
            container.appendChild(cityCard);
        });

        // Re-apply edit mode if active
        if (this.isEditing) {
            setTimeout(() => {
                this.enterEditMode();
            }, 100);
        }

        console.log('✅ Rendered', this.destinations.length, 'destinations');
    }

    createCityCard(destination, index) {
        const cityCard = document.createElement('div');
        cityCard.className = 'city-card';
        cityCard.dataset.index = index;

        // Create city card content matching the existing structure
        cityCard.innerHTML = `
            <div class="city-info">
                <h3 class="city-name">${destination.name}</h3>
                <div class="city-highlights">
                    ${this.formatCityHighlights(destination.highlights || destination.description)}
                </div>
            </div>
        `;

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
    }
}

// Initialize when DOM is ready
let destinationManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 Destination Manager: Checking page for initialization...');
    console.log('Current path:', window.location.pathname);
    console.log('Page title:', document.title);

    // Check multiple conditions to ensure we're on the right page
    const isSpotlightPage = window.location.pathname.includes('spotlight') ||
                           document.querySelector('.spotlight-main') ||
                           document.querySelector('#citiesContainer');

    if (isSpotlightPage) {
        console.log('✅ Destination Manager: Initializing on spotlight page');
        destinationManager = new DestinationManager();
        window.destinationManager = destinationManager; // Make globally accessible
    } else {
        console.log('❌ Destination Manager: Not a spotlight page, skipping initialization');
    }
});

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DestinationManager };
}