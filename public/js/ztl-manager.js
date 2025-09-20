// ZTL (Zona a Traffico Limitato) Manager
// Handles display and interaction with traffic restriction zones

class ZTLManager {
    constructor() {
        this.ztlWarnings = [];
        this.ztlMarkers = [];
        this.ztlOverlay = null;
        this.isZTLEnabled = true;
    }

    // Check route for ZTL restrictions
    async checkRoute(cities, travelDate) {
        try {
            console.log('ZTL Manager: Checking route for cities:', cities);

            const response = await fetch('/api/ztl/check-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    route: cities,
                    travelDate: travelDate || new Date().toISOString()
                })
            });

            const data = await response.json();
            console.log('ZTL Manager: Response from server:', data);

            if (data.success) {
                this.ztlWarnings = data.warnings;
                this.displayWarnings(data);
                return data;
            }
        } catch (error) {
            console.error('Failed to check ZTL zones:', error);
        }
        return null;
    }

    // Display ZTL warnings in the UI
    displayWarnings(ztlData) {
        console.log('displayWarnings called with:', ztlData);

        if (!ztlData.hasRestrictions) {
            this.hideWarnings();
            return;
        }

        const warningContainer = this.getOrCreateWarningContainer();
        console.log('Warning container created/found:', warningContainer);

        // Create a compact warning banner
        const cities = [...new Set(ztlData.warnings.map(w => w.city))].join(', ');
        const warningsHTML = `
            <div class="ztl-warning-banner">
                <div class="ztl-banner-content">
                    <div class="ztl-banner-left">
                        <svg class="ztl-icon-small" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                  stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span class="ztl-banner-text">
                            <strong>Traffic Restriction Zone</strong> - ${cities} has ${ztlData.warnings.length} ZTL zone${ztlData.warnings.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div class="ztl-banner-right">
                        <button class="ztl-details-btn" onclick="ztlManager.showFullDetails(${JSON.stringify(ztlData).replace(/"/g, '&quot;')})">
                            View Details
                        </button>
                        <button class="ztl-close-btn" onclick="ztlManager.hideWarnings()">×</button>
                    </div>
                </div>
            </div>
        `;

        warningContainer.innerHTML = warningsHTML;
        warningContainer.style.display = 'block';

        // Ensure visibility
        warningContainer.style.visibility = 'visible';
        warningContainer.style.opacity = '1';
        console.log('ZTL warnings HTML injected and container shown');
    }

    // Create individual warning item
    createWarningItem(warning) {
        const feeText = warning.fee > 0 ? `€${warning.fee}/day` : 'Permit required';
        const typeIcon = warning.type === 'congestion' ? '🚦' : '🏛️';

        return `
            <div class="ztl-zone-item">
                <div class="ztl-zone-header">
                    <span class="ztl-type-icon">${typeIcon}</span>
                    <strong>${warning.city} - ${warning.zone}</strong>
                    <span class="ztl-fee">${feeText}</span>
                </div>
                <div class="ztl-zone-details">
                    <span class="ztl-schedule">📅 ${warning.message}</span>
                    ${warning.exemptions ? `
                        <div class="ztl-exemptions">
                            Exemptions: ${warning.exemptions.map(e =>
                                `<span class="ztl-exemption-tag">${this.formatExemption(e)}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Format exemption types
    formatExemption(exemption) {
        const exemptionMap = {
            'electric': '🔋 Electric',
            'residents': '🏠 Residents',
            'permits': '📋 Permits',
            'hotels': '🏨 Hotels',
            'disabled': '♿ Disabled'
        };
        return exemptionMap[exemption] || exemption;
    }

    // Get or create warning container
    getOrCreateWarningContainer() {
        let container = document.getElementById('ztl-warnings');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ztl-warnings';
            container.className = 'ztl-warnings-container';

            // Try multiple insertion points
            const resultsOverlay = document.getElementById('results-overlay');
            const routeResults = document.getElementById('routeResults');
            const spotlight = document.querySelector('.spotlight-container');
            const mainContent = document.querySelector('.container');

            if (resultsOverlay) {
                // Insert at the top of results overlay
                resultsOverlay.insertBefore(container, resultsOverlay.firstChild);
                console.log('ZTL container inserted into results-overlay');
            } else if (spotlight) {
                // Insert at the top of spotlight
                spotlight.insertBefore(container, spotlight.firstChild);
                console.log('ZTL container inserted into spotlight');
            } else if (routeResults) {
                // Insert before route results
                routeResults.parentNode.insertBefore(container, routeResults);
                console.log('ZTL container inserted before routeResults');
            } else if (mainContent) {
                // Insert at the top of main content
                mainContent.insertBefore(container, mainContent.firstChild);
                console.log('ZTL container inserted at top of main container');
            } else {
                // Fallback to body
                document.body.insertBefore(container, document.body.firstChild);
                console.log('ZTL container inserted at top of body');
            }
        }
        return container;
    }

    // Hide warnings
    hideWarnings() {
        const container = document.getElementById('ztl-warnings');
        if (container) {
            container.style.display = 'none';
        }
    }

    // Show full details in modal
    showFullDetails(ztlData) {
        const modal = document.createElement('div');
        modal.className = 'ztl-modal';
        modal.innerHTML = `
            <div class="ztl-modal-content">
                <div class="ztl-modal-header">
                    <h2>ZTL Traffic Restriction Details</h2>
                    <button class="ztl-modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="ztl-modal-body">
                    <div class="ztl-zones-grid">
                        ${ztlData.warnings.map(warning => `
                            <div class="ztl-zone-card">
                                <h3>${warning.city} - ${warning.zone}</h3>
                                <div class="ztl-zone-info">
                                    <p><strong>Schedule:</strong> ${warning.message}</p>
                                    <p><strong>Type:</strong> ${warning.type === 'congestion' ? 'Congestion Charge' : 'Historic Center'}</p>
                                    <p><strong>Fee:</strong> ${warning.fee > 0 ? `€${warning.fee}/day` : 'Permit required'}</p>
                                    ${warning.exemptions ? `
                                        <p><strong>Exemptions:</strong> ${warning.exemptions.map(e =>
                                            this.formatExemption(e)
                                        ).join(', ')}</p>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    ${ztlData.alternatives && ztlData.alternatives.length > 0 ? `
                        <div class="ztl-alternatives-section">
                            <h3>Parking Alternatives</h3>
                            ${ztlData.alternatives.map(alt => `
                                <div class="ztl-alternative-item">
                                    <strong>${alt.city}:</strong> ${alt.suggestion}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="ztl-modal-footer">
                    <button class="ztl-action-btn" onclick="ztlManager.showOnMap()">Show on Map</button>
                    <button class="ztl-action-btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Show detailed ZTL information
    async showDetails() {
        const modal = document.createElement('div');
        modal.className = 'ztl-modal';
        modal.innerHTML = `
            <div class="ztl-modal-content">
                <div class="ztl-modal-header">
                    <h2>ZTL Zone Details</h2>
                    <button class="ztl-modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="ztl-modal-body">
                    ${await this.getDetailedInfo()}
                </div>
                <div class="ztl-modal-footer">
                    <p class="ztl-disclaimer">
                        ⚠️ Always verify current restrictions with local authorities.
                        Rules may change for holidays and special events.
                    </p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Get detailed ZTL information
    async getDetailedInfo() {
        let detailsHTML = '<div class="ztl-details-grid">';

        for (const warning of this.ztlWarnings) {
            const cityInfo = await this.fetchCityZTLInfo(warning.city);

            detailsHTML += `
                <div class="ztl-city-details">
                    <h3>${warning.city}</h3>
                    <div class="ztl-zone-info">
                        <h4>${warning.zone}</h4>
                        <table class="ztl-schedule-table">
                            <tr>
                                <th>Day</th>
                                <th>Hours</th>
                            </tr>
                            ${this.createScheduleTable(cityInfo)}
                        </table>
                        <div class="ztl-zone-map" id="ztl-map-${warning.city.toLowerCase()}">
                            <!-- Mini map would go here -->
                        </div>
                    </div>
                </div>
            `;
        }

        detailsHTML += '</div>';
        return detailsHTML;
    }

    // Fetch city-specific ZTL info
    async fetchCityZTLInfo(city) {
        try {
            const response = await fetch(`/api/ztl/city/${encodeURIComponent(city)}`);
            const data = await response.json();
            return data.success ? data : null;
        } catch (error) {
            console.error('Failed to fetch city ZTL info:', error);
            return null;
        }
    }

    // Create schedule table
    createScheduleTable(cityInfo) {
        if (!cityInfo || !cityInfo.zones || cityInfo.zones.length === 0) {
            return '<tr><td colspan="2">Schedule information unavailable</td></tr>';
        }

        const zone = cityInfo.zones[0];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        return days.map(day => {
            const schedule = zone.schedule[day];
            const hours = schedule === 'closed' ? 'No restrictions' :
                         schedule ? `${schedule.start} - ${schedule.end}` : 'No restrictions';
            return `
                <tr class="${schedule === 'closed' ? 'ztl-day-free' : 'ztl-day-restricted'}">
                    <td>${day.charAt(0).toUpperCase() + day.slice(1)}</td>
                    <td>${hours}</td>
                </tr>
            `;
        }).join('');
    }

    // Show ZTL zones on map
    showOnMap() {
        if (typeof window.routeMap === 'undefined') {
            console.warn('Map not available');
            return;
        }

        // Clear existing markers
        this.clearZTLMarkers();

        // Add ZTL zone markers
        this.ztlWarnings.forEach(warning => {
            if (warning.coordinates) {
                const marker = L.marker(warning.coordinates, {
                    icon: L.divIcon({
                        className: 'ztl-map-marker',
                        html: `<div class="ztl-marker-content">
                            <span class="ztl-marker-icon">⚠️</span>
                            <span class="ztl-marker-label">ZTL</span>
                        </div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 40]
                    })
                }).addTo(window.routeMap);

                marker.bindPopup(`
                    <div class="ztl-popup">
                        <strong>${warning.zone}</strong><br>
                        ${warning.city}<br>
                        ${warning.message}<br>
                        ${warning.fee > 0 ? `Fee: €${warning.fee}` : 'Permit required'}
                    </div>
                `);

                this.ztlMarkers.push(marker);
            }
        });

        // Zoom to show all ZTL markers
        if (this.ztlMarkers.length > 0) {
            const group = L.featureGroup(this.ztlMarkers);
            window.routeMap.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Clear ZTL markers from map
    clearZTLMarkers() {
        this.ztlMarkers.forEach(marker => {
            if (window.routeMap && marker) {
                window.routeMap.removeLayer(marker);
            }
        });
        this.ztlMarkers = [];
    }

    // Toggle ZTL checking
    toggleZTLChecking(enabled) {
        this.isZTLEnabled = enabled;
        if (!enabled) {
            this.hideWarnings();
            this.clearZTLMarkers();
        }
    }

    // Get all available ZTL zones
    async getAllZones() {
        try {
            const response = await fetch('/api/ztl/zones');
            const data = await response.json();
            return data.success ? data.cities : [];
        } catch (error) {
            console.error('Failed to fetch all ZTL zones:', error);
            return [];
        }
    }
}

// Initialize ZTL Manager
const ztlManager = new ZTLManager();

// Export for use in other modules
window.ztlManager = ztlManager;