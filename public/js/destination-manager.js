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
        const citiesContainer = document.getElementById('cities-container');

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
        // Add remove buttons to all city cards
        const cityCards = document.querySelectorAll('.city-card');
        cityCards.forEach((card, index) => {
            this.addRemoveButton(card, index);
            this.addDragHandle(card, index);
        });

        // Add "Add Stop" buttons between cities
        this.addInsertButtons();

        // Show optimization toolbar
        this.showOptimizationToolbar();
    }

    exitEditMode() {
        // Remove all edit controls
        document.querySelectorAll('.remove-city-btn').forEach(btn => btn.remove());
        document.querySelectorAll('.drag-handle').forEach(handle => handle.remove());
        document.querySelectorAll('.add-stop-btn').forEach(btn => btn.remove());

        // Hide optimization toolbar
        this.hideOptimizationToolbar();

        // Save changes
        this.saveRoute();
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
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.draggable = true;
        dragHandle.title = 'Drag to reorder';

        // Add all drag event listeners to both handle and card
        dragHandle.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
        dragHandle.addEventListener('dragend', (e) => this.handleDragEnd(e));

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

        card.appendChild(dragHandle);
    }

    addInsertButtons() {
        const citiesContainer = document.getElementById('cities-container');
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
        // Confirm removal
        if (!confirm(`Remove ${this.destinations[index].name} from your route?`)) {
            return;
        }

        // Remove from array
        this.destinations.splice(index, 1);

        // Animate removal
        const cityCards = document.querySelectorAll('.city-card');
        const cardToRemove = cityCards[index];

        cardToRemove.style.transform = 'translateX(100%)';
        cardToRemove.style.opacity = '0';

        setTimeout(() => {
            // Recalculate and update UI
            this.updateRoute();
            this.renderDestinations();
        }, 300);
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
                               placeholder="Search for a city..."
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
                    <button class="btn-add" onclick="destinationManager.addSelectedDestination()">Add to Route</button>
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

    addSelectedDestination() {
        if (!this.selectedDestination) {
            alert('Please select a destination');
            return;
        }

        const modal = document.getElementById('add-destination-modal');
        const insertIndex = parseInt(modal.dataset.insertIndex) || 0;

        // Enhance destination with description
        const enhancedDestination = {
            ...this.selectedDestination,
            description: `Beautiful ${this.selectedDestination.name} with amazing attractions and experiences`,
            highlights: [`Explore ${this.selectedDestination.name}`, `Local cuisine`, `Historic sites`],
            added: new Date().toISOString()
        };

        // Add to destinations array
        this.destinations.splice(insertIndex, 0, enhancedDestination);

        console.log(`✅ Added ${enhancedDestination.name} to route at position ${insertIndex}`);

        // Close modal
        this.closeAddModal();

        // Update route
        this.updateRoute();
        this.renderDestinations();
    }

    closeAddModal() {
        const modal = document.getElementById('add-destination-modal');
        modal.classList.remove('show');
        this.selectedDestination = null;
        document.getElementById('destination-search-input').value = '';
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
        // Update the route on the map
        if (window.spotlightController?.map) {
            console.log('🗺️ Updating map route...');
            // Trigger map update
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

    renderDestinations() {
        const container = document.getElementById('cities-container');
        if (!container) return;

        // Re-render all city cards with current destinations
        container.innerHTML = this.destinations.map((dest, index) => `
            <div class="city-card" data-index="${index}">
                <div class="city-info">
                    <h3>${dest.name}</h3>
                    <p>${dest.description || 'Amazing destination'}</p>
                </div>
            </div>
        `).join('');

        // Re-apply edit mode if active
        if (this.isEditing) {
            this.enterEditMode();
        }
    }

    // Drag and Drop Handlers
    handleDragStart(e, index) {
        this.draggedItem = index;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', ''); // Required for some browsers

        const card = e.target.closest('.city-card');
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
                           document.querySelector('#cities-container');

    if (isSpotlightPage) {
        console.log('✅ Destination Manager: Initializing on spotlight page');
        destinationManager = new DestinationManager();
        window.destinationManager = destinationManager; // Make globally accessible
    } else {
        console.log('❌ Destination Manager: Not a spotlight page, skipping initialization');
    }
});

export { DestinationManager };