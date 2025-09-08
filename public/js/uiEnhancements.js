/**
 * UI Enhancements - Fixes labels, content, and formatting issues
 */

export class UIEnhancements {
    /**
     * Format route marker with city name instead of number
     */
    static getMarkerLabel(city, index, route) {
        const isStart = index === 0;
        const isEnd = index === route.length - 1;
        
        if (isStart) return `📍 ${city.name}`;
        if (isEnd) return `🏁 ${city.name}`;
        return `${index}. ${city.name}`;
    }
    
    /**
     * Create enhanced marker HTML with city info
     */
    static createMarkerHTML(city, index, route, color) {
        const isStart = index === 0;
        const isEnd = index === route.length - 1;
        const icon = isStart ? '🏠' : isEnd ? '🏁' : '📍';
        const bgColor = isStart ? '#4ECDC4' : isEnd ? '#FF6B6B' : color;
        
        return `
            <div style="
                background: ${bgColor};
                color: white;
                min-width: 40px;
                height: 40px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                border: 3px solid white;
                box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                font-size: 18px;
                padding: 0 8px;
            ">
                ${icon}
            </div>
        `;
    }
    
    /**
     * Create detailed popup content for each stop
     */
    static createPopupContent(city, index, route) {
        const isStart = index === 0;
        const isEnd = index === route.length - 1;
        const stopType = isStart ? 'Starting Point' : isEnd ? 'Final Destination' : `Stop ${index}`;
        
        return `
            <div style="min-width: 250px; padding: 10px;">
                <h3 style="margin: 0 0 10px 0; color: #FF6B6B; font-size: 18px;">
                    ${city.name}
                </h3>
                <div style="color: #666; margin-bottom: 10px;">
                    <strong>${stopType}</strong> • ${city.country}
                </div>
                <div style="background: #FFF5F5; padding: 8px; border-radius: 8px; margin-bottom: 10px;">
                    <strong>Population:</strong> ${city.population.toLocaleString()}<br>
                    <strong>Region:</strong> ${city.region || 'Mediterranean'}
                </div>
                ${city.activities && city.activities.length > 0 ? `
                    <div style="margin-top: 10px;">
                        <strong style="color: #FF8C42;">Top Activities:</strong>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            ${city.activities.slice(0, 3).map(act => `<li>${act}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Format itinerary content properly (remove markdown/code formatting)
     */
    static formatItineraryContent(rawContent) {
        if (!rawContent) return this.getDefaultItinerary();
        
        let formatted = rawContent;
        
        // Remove all code blocks and HTML artifacts
        formatted = formatted.replace(/```[\s\S]*?```/g, '');
        formatted = formatted.replace(/`[^`]*`/g, '');
        
        // Remove raw HTML tags and the literal word "html"
        formatted = formatted.replace(/<[^>]*>/g, '');
        formatted = formatted.replace(/\bhtml\b/gi, '');
        formatted = formatted.replace(/html/gi, '');
        
        // Clean up markdown artifacts
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/#{1,6}\s*/g, '');
        
        // Clean up formatting characters
        formatted = formatted.replace(/[\\*#`_~]/g, '');
        
        // Convert bullet points to HTML lists
        const lines = formatted.split('\n').filter(line => line.trim());
        const processedLines = [];
        let inList = false;
        
        for (let line of lines) {
            line = line.trim();
            if (line.match(/^[-•·]/)) {
                if (!inList) {
                    processedLines.push('<ul>');
                    inList = true;
                }
                processedLines.push(`<li>${line.replace(/^[-•·]\s*/, '')}</li>`);
            } else {
                if (inList) {
                    processedLines.push('</ul>');
                    inList = false;
                }
                if (line && line.length > 0) {
                    processedLines.push(`<p>${line}</p>`);
                }
            }
        }
        
        if (inList) {
            processedLines.push('</ul>');
        }
        
        formatted = processedLines.join('');
        
        // If content is too messy or empty, use default
        if (formatted.length < 50 || formatted.includes('undefined') || formatted.includes('null')) {
            return this.getDefaultItinerary();
        }
        
        return `<div class="formatted-itinerary">${formatted}</div>`;
    }
    
    /**
     * Get default quality itinerary content
     */
    static getDefaultItinerary() {
        return `
            <div class="formatted-itinerary">
                <h3>🚗 Your Personalized Road Trip Experience</h3>
                <p>Embark on an unforgettable journey through Southern France and beyond, where every stop offers unique experiences tailored to your interests.</p>
                
                <h3>🌟 Highlights of Your Journey</h3>
                <ul>
                    <li><strong>Scenic Coastal Drives:</strong> Wind along the stunning Mediterranean coastline with breathtaking ocean views</li>
                    <li><strong>Historic Towns:</strong> Explore medieval villages and ancient Roman sites</li>
                    <li><strong>Culinary Delights:</strong> Savor local specialties from Provençal markets to Italian trattorias</li>
                    <li><strong>Natural Wonders:</strong> Discover hidden beaches, lavender fields, and mountain vistas</li>
                </ul>
                
                <h3>💡 Travel Tips</h3>
                <ul>
                    <li>Best time to visit: April-June or September-October for perfect weather</li>
                    <li>Book accommodations in advance during summer months</li>
                    <li>Try local wines and regional specialties at each stop</li>
                    <li>Allow extra time for spontaneous discoveries along the route</li>
                </ul>
            </div>
        `;
    }
    
    /**
     * Create beautiful route summary card
     */
    static createRouteSummaryCard(route, agent) {
        const cities = route.route;
        const startCity = cities[0];
        const endCity = cities[cities.length - 1];
        const stops = cities.slice(1, -1);
        
        return `
            <div class="route-summary-enhanced">
                <div class="route-header" style="background: linear-gradient(135deg, ${agent.color || '#FF6B6B'} 0%, ${agent.gradient ? agent.gradient.split(',')[1] : '#FFB088'} 100%); padding: 20px; border-radius: 12px; color: white; margin-bottom: 20px;">
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 32px;">${agent.icon || '🚗'}</span>
                        ${agent.name || 'Your Journey'}
                    </h2>
                    <p style="margin: 10px 0 0 0; opacity: 0.95;">
                        ${agent.description || 'A carefully curated route for your perfect road trip'}
                    </p>
                </div>
                
                <div class="journey-overview" style="background: #FFF5F5; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="color: #FF6B6B; margin-top: 0;">📍 Journey Overview</h3>
                    
                    <div class="route-flow" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 15px 0;">
                        <div class="city-badge start" style="background: #4ECDC4; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                            🏠 ${startCity.name}
                        </div>
                        
                        ${stops.length > 0 ? `
                            <span style="color: #999;">→</span>
                            ${stops.map((city, i) => `
                                <div class="city-badge stop" style="background: #FFB088; color: white; padding: 8px 16px; border-radius: 20px;">
                                    ${i + 1}. ${city.name}
                                </div>
                                <span style="color: #999;">→</span>
                            `).join('')}
                        ` : '<span style="color: #999;">→</span>'}
                        
                        <div class="city-badge end" style="background: #FF6B6B; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                            🏁 ${endCity.name}
                        </div>
                    </div>
                    
                    <div class="route-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px;">
                        <div style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                            <div style="font-size: 24px; color: #FF6B6B; font-weight: bold;">
                                ${route.totalDistance || '0'}km
                            </div>
                            <div style="color: #999; font-size: 12px; text-transform: uppercase;">Total Distance</div>
                        </div>
                        <div style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                            <div style="font-size: 24px; color: #FFB088; font-weight: bold;">
                                ${route.totalTime || '0'}h
                            </div>
                            <div style="color: #999; font-size: 12px; text-transform: uppercase;">Driving Time</div>
                        </div>
                        <div style="text-align: center; background: white; padding: 15px; border-radius: 8px;">
                            <div style="font-size: 24px; color: #4ECDC4; font-weight: bold;">
                                ${stops.length}
                            </div>
                            <div style="color: #999; font-size: 12px; text-transform: uppercase;">Stops</div>
                        </div>
                    </div>
                </div>
                
                <div class="stops-details" style="background: white; padding: 20px; border-radius: 12px;">
                    <h3 style="color: #FF6B6B; margin-top: 0;">🗺️ Detailed Stops</h3>
                    
                    ${cities.map((city, index) => {
                        const isStart = index === 0;
                        const isEnd = index === cities.length - 1;
                        const stopType = isStart ? 'Starting Point' : isEnd ? 'Final Destination' : `Stop ${index}`;
                        const bgColor = isStart ? '#E8F8F5' : isEnd ? '#FFE8E8' : '#FFF8F0';
                        
                        return `
                            <div style="background: ${bgColor}; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div>
                                        <h4 style="margin: 0; color: #333; font-size: 18px;">
                                            ${isStart ? '🏠' : isEnd ? '🏁' : `${index}.`} ${city.name}
                                        </h4>
                                        <div style="color: #666; margin: 5px 0;">
                                            ${stopType} • ${city.country} • Pop. ${city.population.toLocaleString()}
                                        </div>
                                        ${city.activities && city.activities.length > 0 ? `
                                            <div style="margin-top: 10px;">
                                                <strong style="color: #FF8C42;">Must-Do:</strong>
                                                <span style="color: #666;">${city.activities.slice(0, 2).join(', ')}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    ${index < cities.length - 1 ? `
                                        <div style="text-align: right; color: #999; font-size: 14px;">
                                            <div>↓ Next stop</div>
                                            <div style="font-weight: bold; color: #FF6B6B;">
                                                ${Math.round(route.distances ? route.distances[index] : 100)}km
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Fix agent card to show proper map initialization
     */
    static initializeMapProperly(mapId, result, retryCount = 0) {
        const maxRetries = 5;
        const container = document.getElementById(mapId);
        
        if (!container) {
            if (retryCount < maxRetries) {
                setTimeout(() => this.initializeMapProperly(mapId, result, retryCount + 1), 200);
            }
            return;
        }
        
        // Clear container and show immediate loading state
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;"><span>🗺️</span></div>';
        
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
            setTimeout(() => {
                try {
                    // Clear loading state
                    container.innerHTML = '';
                    
                    // Create map with optimized settings
                    const map = L.map(mapId, {
                        zoomControl: false,
                        attributionControl: false,
                        dragging: false,
                        scrollWheelZoom: false,
                        doubleClickZoom: false,
                        preferCanvas: true,  // Better performance
                        renderer: L.canvas() // Use canvas renderer
                    });
            
            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: ''
            }).addTo(map);
            
            const route = result.route.route;
            const bounds = L.latLngBounds();
            
            // Add markers with proper labels
            route.forEach((city, index) => {
                const markerHTML = this.createMarkerHTML(city, index, route, result.agent.color || '#FF6B6B');
                const marker = L.marker([city.lat, city.lon], {
                    icon: L.divIcon({
                        className: 'custom-marker-enhanced',
                        html: markerHTML,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                    })
                }).addTo(map);
                
                // Add detailed popup
                marker.bindPopup(this.createPopupContent(city, index, route));
                bounds.extend([city.lat, city.lon]);
            });
            
            // Add route line - check for driving routes
            if (result.route.drivingRoute && result.route.drivingRoute.segments) {
                result.route.drivingRoute.segments.forEach(segment => {
                    if (segment.geometry && segment.geometry.coordinates) {
                        const coords = segment.geometry.coordinates.map(c => [c[1], c[0]]);
                        L.polyline(coords, {
                            color: result.agent.color || '#FF6B6B',
                            weight: 4,
                            opacity: 0.8,
                            smoothFactor: 1
                        }).addTo(map);
                    }
                });
            } else {
                // Fallback to straight lines with curve simulation
                for (let i = 0; i < route.length - 1; i++) {
                    const start = route[i];
                    const end = route[i + 1];
                    
                    // Create curved path
                    const coords = this.createCurvedPath(start, end);
                    L.polyline(coords, {
                        color: result.agent.color || '#FF6B6B',
                        weight: 4,
                        opacity: 0.8,
                        dashArray: '10, 5'
                    }).addTo(map);
                }
            }
            
                    // Fit bounds with proper timing
                    setTimeout(() => {
                        map.invalidateSize();
                        map.fitBounds(bounds, { padding: [30, 30] });
                    }, 100);
                    
                } catch (error) {
                    console.error('Map initialization error:', error);
                    container.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #FFF5F5; color: #FF6B6B;">
                            <div style="text-align: center;">
                                <div style="font-size: 32px; margin-bottom: 10px;">🗺️</div>
                                <div>Route Preview</div>
                            </div>
                        </div>
                    `;
                }
            }, 300); // Faster initial delay
        });
    }
    
    /**
     * Create curved path between two points (for better visuals)
     */
    static createCurvedPath(start, end) {
        const points = [];
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            
            // Create slight curve
            const lat = start.lat + (end.lat - start.lat) * t;
            const lon = start.lon + (end.lon - start.lon) * t;
            
            // Add slight curve offset
            const offset = Math.sin(t * Math.PI) * 0.02;
            const curveLat = lat + offset;
            
            points.push([curveLat, lon]);
        }
        
        return points;
    }
}

// Export for use in other modules
window.UIEnhancements = UIEnhancements;