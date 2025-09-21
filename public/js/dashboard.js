// Dashboard Module
class DashboardManager {
    constructor() {
        this.currentTab = 'my-trips';
        this.currentPage = 1;
        this.trips = [];
        this.totalPages = 1;
        this.sortBy = '-createdAt';
        this.filterPrivacy = '';
        this.init();
    }

    async init() {
        // Check authentication
        if (!authManager.isAuthenticated) {
            window.location.href = '/';
            return;
        }

        this.setupEventListeners();
        await this.loadUserStats();
        await this.loadTrips();
        this.updateUserDisplay();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Sort and filter
        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.loadTrips();
        });

        document.getElementById('filterPrivacy').addEventListener('change', (e) => {
            this.filterPrivacy = e.target.value;
            this.loadTrips();
        });

        // User menu toggle
        const userMenuToggle = document.querySelector('.user-menu-toggle');
        const userMenuDropdown = document.querySelector('.user-menu-dropdown');

        userMenuToggle.addEventListener('click', () => {
            userMenuDropdown.classList.toggle('active');
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                userMenuDropdown.classList.remove('active');
            }
        });
    }

    updateUserDisplay() {
        const user = authManager.user;
        if (user) {
            // Update user initial
            const initial = (user.profile?.displayName || user.username).charAt(0).toUpperCase();
            document.getElementById('userInitial').textContent = initial;

            // Update display name
            document.querySelector('.user-display-name').textContent =
                user.profile?.displayName || user.username;
        }
    }

    async loadUserStats() {
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${authManager.token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                const stats = data.user.stats || {};

                // Update stat cards
                document.getElementById('tripsCount').textContent = stats.tripsCreated || 0;
                document.getElementById('savedCount').textContent = stats.tripsSaved || 0;
                document.getElementById('distanceCount').textContent =
                    `${(stats.totalDistance || 0).toLocaleString()} km`;
                document.getElementById('followersCount').textContent = stats.followers || 0;
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.currentPage = 1;

        // Update tab UI
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Load appropriate content
        this.loadTrips();
    }

    async loadTrips() {
        const tripsGrid = document.getElementById('tripsGrid');
        const emptyState = document.getElementById('emptyState');

        // Show loading state
        tripsGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading trips...</p>
            </div>
        `;
        emptyState.style.display = 'none';

        try {
            let url = '/api/trips';
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: 12,
                sort: this.sortBy
            });

            if (this.filterPrivacy) {
                params.append('privacy', this.filterPrivacy);
            }

            // Handle different tabs
            switch (this.currentTab) {
                case 'saved':
                    // Would need a separate endpoint for saved trips
                    params.append('saved', 'true');
                    break;
                case 'drafts':
                    params.append('isDraft', 'true');
                    break;
                case 'shared':
                    // Would need a separate endpoint for shared trips
                    params.append('shared', 'true');
                    break;
            }

            const response = await fetch(`${url}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${authManager.token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                this.trips = data.trips;
                this.totalPages = data.totalPages;
                this.renderTrips();
                this.renderPagination();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading trips:', error);
            tripsGrid.innerHTML = '';
            emptyState.style.display = 'block';
        }
    }

    renderTrips() {
        const tripsGrid = document.getElementById('tripsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.trips.length === 0) {
            tripsGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tripsGrid.innerHTML = this.trips.map(trip => this.createTripCard(trip)).join('');

        // Add event listeners for trip options
        document.querySelectorAll('.trip-options-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTripOptions(e, btn.dataset.tripId);
            });
        });
    }

    createTripCard(trip) {
        const privacyIcon = {
            public: '🌍',
            private: '🔒',
            unlisted: '🔗'
        };

        const agentIcons = {
            adventure: '⛰️',
            culture: '🏛️',
            food: '🍽️',
            budget: '💰',
            luxury: '💎',
            family: '👨‍👩‍👧‍👦'
        };

        const formatDate = (date) => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        const imageUrl = trip.images?.[0] || `https://source.unsplash.com/800x600/?${encodeURIComponent(trip.route?.destination || 'travel')}`;

        return `
            <div class="trip-card" data-trip-id="${trip._id}">
                <div class="trip-card-image">
                    <img src="${imageUrl}" alt="${trip.title}" loading="lazy">
                    <div class="trip-privacy-badge">
                        ${privacyIcon[trip.privacy]} ${trip.privacy}
                    </div>
                    <button class="trip-options-btn" data-trip-id="${trip._id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2"/>
                            <circle cx="12" cy="12" r="2"/>
                            <circle cx="12" cy="19" r="2"/>
                        </svg>
                    </button>
                </div>
                <div class="trip-card-content">
                    <h3 class="trip-card-title">
                        ${agentIcons[trip.agentType] || '🗺️'} ${trip.title}
                    </h3>
                    <div class="trip-card-route">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        ${trip.route?.start || 'Start'} → ${trip.route?.destination || 'Destination'}
                    </div>
                    <div class="trip-card-stats">
                        <span class="trip-stat">
                            👁️ ${trip.stats?.views || 0}
                        </span>
                        <span class="trip-stat">
                            ❤️ ${trip.stats?.likes || 0}
                        </span>
                        <span class="trip-stat">
                            💾 ${trip.stats?.saves || 0}
                        </span>
                        <span class="trip-card-date">
                            ${formatDate(trip.createdAt)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    showTripOptions(event, tripId) {
        const menu = document.getElementById('tripOptionsMenu');
        const rect = event.target.getBoundingClientRect();

        // Position menu
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left - 150}px`;
        menu.style.display = 'block';

        // Store current trip ID
        menu.dataset.tripId = tripId;

        // Setup menu actions
        this.setupMenuActions(tripId);

        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', this.closeOptionsMenu, { once: true });
        }, 0);
    }

    closeOptionsMenu() {
        document.getElementById('tripOptionsMenu').style.display = 'none';
    }

    setupMenuActions(tripId) {
        const menu = document.getElementById('tripOptionsMenu');

        // Remove old listeners by replacing with clones
        const newMenu = menu.cloneNode(true);
        menu.parentNode.replaceChild(newMenu, menu);

        // Add new listeners
        newMenu.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                this.closeOptionsMenu();

                switch (action) {
                    case 'edit':
                        this.editTrip(tripId);
                        break;
                    case 'share':
                        this.shareTrip(tripId);
                        break;
                    case 'duplicate':
                        await this.duplicateTrip(tripId);
                        break;
                    case 'delete':
                        if (confirm('Are you sure you want to delete this trip?')) {
                            await this.deleteTrip(tripId);
                        }
                        break;
                }
            });
        });
    }

    editTrip(tripId) {
        // Redirect to edit page or open edit modal
        window.location.href = `/?edit=${tripId}`;
    }

    shareTrip(tripId) {
        const trip = this.trips.find(t => t._id === tripId);
        if (trip) {
            const shareUrl = `${window.location.origin}/trip/${trip.shareId}`;

            // Copy to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert(`Share URL copied to clipboard:\n${shareUrl}`);
            });
        }
    }

    async duplicateTrip(tripId) {
        try {
            const response = await fetch(`/api/trips/${tripId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authManager.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                alert('Trip duplicated successfully!');
                await this.loadTrips();
            } else {
                alert('Failed to duplicate trip: ' + data.message);
            }
        } catch (error) {
            console.error('Error duplicating trip:', error);
            alert('Failed to duplicate trip');
        }
    }

    async deleteTrip(tripId) {
        try {
            const response = await fetch(`/api/trips/${tripId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authManager.token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                // Remove from UI
                const card = document.querySelector(`[data-trip-id="${tripId}"]`);
                if (card) {
                    card.style.animation = 'fadeOut 0.3s ease';
                    setTimeout(() => {
                        card.remove();
                        if (this.trips.length === 1) {
                            document.getElementById('emptyState').style.display = 'block';
                        }
                    }, 300);
                }

                // Update trips array
                this.trips = this.trips.filter(t => t._id !== tripId);

                // Update stats
                await this.loadUserStats();
            } else {
                alert('Failed to delete trip: ' + data.message);
            }
        } catch (error) {
            console.error('Error deleting trip:', error);
            alert('Failed to delete trip');
        }
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');

        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';

        // Previous button
        html += `
            <button ${this.currentPage === 1 ? 'disabled' : ''}
                    onclick="dashboardManager.goToPage(${this.currentPage - 1})">
                Previous
            </button>
        `;

        // Page numbers
        const maxButtons = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(this.totalPages, startPage + maxButtons - 1);

        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="${i === this.currentPage ? 'active' : ''}"
                        onclick="dashboardManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        html += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''}
                    onclick="dashboardManager.goToPage(${this.currentPage + 1})">
                Next
            </button>
        `;

        pagination.innerHTML = html;
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadTrips();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Add fade out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.9); }
    }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});