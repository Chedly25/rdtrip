/**
 * Parallel Agents System - Generates 6 different itineraries simultaneously
 * Each agent specializes in a specific trip type and generates unique routes
 */

export class ParallelAgentSystem {
    constructor(routeCalculator, aiFeatures) {
        this.routeCalculator = routeCalculator;
        this.aiFeatures = aiFeatures;
        this.cities = routeCalculator.cities; // Access to cities data
        this.activeAgents = new Map();
        this.agentResults = new Map();
        
        // Define 6 specialized agents with unique characteristics
        this.agents = {
            adventure: {
                name: 'Adventure Explorer',
                icon: '🏔️',
                color: '#28a745',
                gradient: 'linear-gradient(135deg, #28a745, #20c997)',
                description: 'Discovers thrilling outdoor activities and scenic routes',
                specialization: 'Focuses on hiking trails, adventure sports, and natural wonders',
                routePreferences: {
                    preferMountainous: true,
                    avoidCities: false,
                    detourTolerance: 0.4,
                    minStops: 3
                }
            },
            romantic: {
                name: 'Romance Curator',
                icon: '💕',
                color: '#e91e63',
                gradient: 'linear-gradient(135deg, #e91e63, #f8bbd9)',
                description: 'Creates intimate experiences and sunset moments',
                specialization: 'Specializes in romantic dining, scenic views, and couples activities',
                routePreferences: {
                    preferCoastal: true,
                    avoidCrowded: true,
                    detourTolerance: 0.3,
                    minStops: 2
                }
            },
            cultural: {
                name: 'Culture Maven',
                icon: '🏛️',
                color: '#6f42c1',
                gradient: 'linear-gradient(135deg, #6f42c1, #b794f6)',
                description: 'Uncovers historical sites and artistic treasures',
                specialization: 'Expert in museums, architecture, and cultural events',
                routePreferences: {
                    preferHistoric: true,
                    avoidNature: false,
                    detourTolerance: 0.5,
                    minStops: 4
                }
            },
            foodie: {
                name: 'Culinary Scout',
                icon: '🍽️',
                color: '#fd7e14',
                gradient: 'linear-gradient(135deg, #fd7e14, #ffc107)',
                description: 'Finds exceptional local cuisine and markets',
                specialization: 'Discovers local restaurants, food markets, and culinary experiences',
                routePreferences: {
                    preferFoodRegions: true,
                    avoidFastFood: true,
                    detourTolerance: 0.6,
                    minStops: 3
                }
            },
            family: {
                name: 'Family Guide',
                icon: '👨‍👩‍👧‍👦',
                color: '#17a2b8',
                gradient: 'linear-gradient(135deg, #17a2b8, #6cc3d0)',
                description: 'Plans safe and engaging family activities',
                specialization: 'Focuses on kid-friendly attractions and family bonding',
                routePreferences: {
                    preferSafe: true,
                    avoidExtreme: true,
                    detourTolerance: 0.2,
                    minStops: 2
                }
            },
            luxury: {
                name: 'Luxury Concierge',
                icon: '✨',
                color: '#6610f2',
                gradient: 'linear-gradient(135deg, #6610f2, #9d5fff)',
                description: 'Curates premium and exclusive experiences',
                specialization: 'Selects luxury hotels, fine dining, and exclusive venues',
                routePreferences: {
                    preferUpscale: true,
                    avoidBudget: true,
                    detourTolerance: 0.3,
                    minStops: 2
                }
            }
        };
    }
    
    /**
     * Launch all 6 agents simultaneously for route calculation
     * @param {string} startId - Starting city ID
     * @param {string} destId - Destination city ID  
     * @param {Object} baseOptions - Base route options
     * @returns {Promise<Map>} Map of agent results
     */
    async launchAllAgents(startId, destId, baseOptions) {
        console.log('🚀 Launching 6 parallel agents for route calculation...');
        
        // Clear previous results
        this.agentResults.clear();
        this.activeAgents.clear();
        
        // Create agent-specific options and launch all agents in parallel (backend handles queuing)
        const agentPromises = Object.entries(this.agents).map(([agentType, agent]) => {
            return this.launchAgent(agentType, startId, destId, baseOptions, agent);
        });
        
        // Wait for all agents to complete
        const results = await Promise.allSettled(agentPromises);
        
        // Process results
        results.forEach((result, index) => {
            const agentType = Object.keys(this.agents)[index];
            if (result.status === 'fulfilled') {
                this.agentResults.set(agentType, result.value);
                console.log(`✅ Agent ${agentType} completed successfully`);
            } else {
                console.error(`❌ Agent ${agentType} failed:`, result.reason);
                // Create fallback result
                this.agentResults.set(agentType, this.createFallbackResult(agentType, startId, destId));
            }
        });
        
        console.log('🎉 All agents completed!');
        return this.agentResults;
    }
    
    /**
     * Launch a single specialized agent
     * @param {string} agentType - Type of agent
     * @param {string} startId - Starting city ID
     * @param {string} destId - Destination city ID
     * @param {Object} baseOptions - Base options
     * @param {Object} agent - Agent configuration
     * @returns {Promise<Object>} Agent result
     */
    async launchAgent(agentType, startId, destId, baseOptions, agent) {
        const startTime = Date.now();
        console.log(`🤖 ${agent.name} starting route calculation...`);
        
        try {
            // First, ask the API for city suggestions based on agent type
            const startCity = this.cities.find(c => c.id === startId)?.name || startId;
            const destCity = this.cities.find(c => c.id === destId)?.name || destId;
            const numStops = Math.max(agent.routePreferences.minStops, baseOptions.numStops || 2);
            
            // Create a prompt to get city suggestions from the API
            const citySuggestionPrompt = `You are a travel expert. I need exactly ${numStops} city names for intermediate stops on a road trip from ${startCity} to ${destCity}.
                
                Trip focus: ${agentType} travel (${agent.description}).
                
                Please respond with ONLY the city names separated by commas. Do not include any other text, explanations, or formatting. Just the city names.
                
                Example format: Nice, Cannes, Monaco`;
            
            console.log(`🔍 ${agent.name} requesting city suggestions from AI...`);
            
            // Get city suggestions from AI with extended timeout
            let suggestedCities = [];
            try {
                const citySuggestions = await Promise.race([
                    this.aiFeatures.callPerplexityAPI(citySuggestionPrompt, true),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('City suggestion timeout')), 30000)
                    )
                ]);
                
                // Parse the city suggestions
                if (citySuggestions && typeof citySuggestions === 'string') {
                    suggestedCities = citySuggestions.split(',').map(city => city.trim()).filter(c => c.length > 0);
                    console.log(`✨ ${agent.name} received AI city suggestions:`, suggestedCities);
                }
            } catch (suggestionError) {
                console.warn(`⚠️ ${agent.name} couldn't get AI city suggestions:`, suggestionError.message);
            }
            
            // Create agent-specific route options
            const agentOptions = {
                ...baseOptions,
                theme: agentType,
                numStops: numStops,
                detourTolerance: Math.round(agent.routePreferences.detourTolerance * 100),
                suggestedCities: suggestedCities // Pass AI suggestions to route calculator
            };
            
            // Calculate unique route for this agent with specific preferences
            const route = this.routeCalculator.calculateRoute(startId, destId, {
                ...agentOptions,
                // Make each agent prefer different types of stops/routing
                priorityType: agent.routePreferences.priorityType || agentType,
                avoidHighways: agent.routePreferences.avoidHighways || false,
                preferScenic: agent.routePreferences.preferScenic || (agentType === 'adventure' || agentType === 'romantic'),
                culturalWeight: agentType === 'cultural' ? 2.0 : 1.0,
                foodWeight: agentType === 'foodie' ? 2.0 : 1.0,
                familyFriendly: agentType === 'family',
                luxuryLevel: agentType === 'luxury' ? 'high' : 'standard'
            });
            
            // Generate agent-specific itinerary prompt
            const cities = route.route.map(c => c.name).join(', ');
            const prompt = this.createAgentPrompt(agent, cities, route.totalDistance);
            
            // Get AI-powered itinerary from this agent with extended timeout
            const agentItinerary = await Promise.race([
                this.aiFeatures.callPerplexityAPI(prompt, true), // Skip debounce for parallel agents
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Agent timeout - using fallback')), 120000)
                )
            ]);
            
            const duration = Date.now() - startTime;
            console.log(`⚡ ${agent.name} completed in ${duration}ms`);
            
            return {
                agentType,
                agent,
                route,
                itinerary: agentItinerary,
                duration,
                timestamp: Date.now(),
                cities: route.route,
                summary: this.createRouteSummary(agent, route)
            };
            
        } catch (error) {
            console.error(`❌ ${agent.name} encountered error:`, error);
            
            // Try one more time with a simpler approach before using fallback
            try {
                console.log(`🔄 ${agent.name} retrying with simplified approach`);
                
                // Try to calculate route again in case it was the route calculation that failed
                const retryRoute = this.routeCalculator.calculateRoute(startId, destId, {
                    ...agentOptions,
                    priorityType: agent.routePreferences.priorityType || agentType,
                    avoidHighways: agent.routePreferences.avoidHighways || false,
                    preferScenic: agent.routePreferences.preferScenic || (agentType === 'adventure' || agentType === 'romantic'),
                    culturalWeight: agentType === 'cultural' ? 2.0 : 1.0,
                    foodWeight: agentType === 'foodie' ? 2.0 : 1.0,
                    familyFriendly: agentType === 'family',
                    luxuryLevel: agentType === 'luxury' ? 'high' : 'standard'
                });
                
                const simplifiedPrompt = `Create a brief travel itinerary for a route from ${startId} to ${destId} focusing on ${agent.description.toLowerCase()}. Keep it concise and practical.`;
                const retryItinerary = await this.aiFeatures.callPerplexityAPI(simplifiedPrompt, true);
                
                const duration = Date.now() - startTime;
                console.log(`✅ ${agent.name} retry successful (${duration}ms)`);
                
                return {
                    agentType,
                    agent,
                    route: retryRoute,
                    itinerary: retryItinerary,
                    duration,
                    timestamp: Date.now(),
                    cities: retryRoute.route,
                    summary: this.createRouteSummary(agent, retryRoute)
                };
            } catch (retryError) {
                console.error(`❌ ${agent.name} retry failed:`, retryError);
                
                // Provide fallback result only after retry fails
                const duration = Date.now() - startTime;
                console.log(`🔄 ${agent.name} using fallback (${duration}ms)`);
                
                // Generate unique fallback route for this specific agent
                const agentOptions = {
                    ...baseOptions,
                    theme: agentType,
                    numStops: Math.max(agent.routePreferences.minStops, baseOptions.numStops || 2),
                    detourTolerance: Math.round(agent.routePreferences.detourTolerance * 100),
                    priorityType: agent.routePreferences.priorityType || agentType,
                    avoidHighways: agent.routePreferences.avoidHighways || false,
                    preferScenic: agent.routePreferences.preferScenic || (agentType === 'adventure' || agentType === 'romantic'),
                    culturalWeight: agentType === 'cultural' ? 2.0 : 1.0,
                    foodWeight: agentType === 'foodie' ? 2.0 : 1.0,
                    familyFriendly: agentType === 'family',
                    luxuryLevel: agentType === 'luxury' ? 'high' : 'standard'
                };
                
                const fallbackRoute = this.routeCalculator.calculateRoute(startId, destId, agentOptions);
                
                return {
                    agentType,
                    agent,
                    route: fallbackRoute,
                    itinerary: this.createFallbackItinerary(agent, fallbackRoute),
                    duration,
                    timestamp: Date.now(),
                    cities: fallbackRoute.route,
                    summary: this.createRouteSummary(agent, fallbackRoute),
                    fallback: true
                };
            }
        }
    }
    
    /**
     * Create agent-specific prompt for itinerary generation
     * @param {Object} agent - Agent configuration
     * @param {string} cities - City names
     * @param {number} distance - Total distance
     * @returns {string} Specialized prompt
     */
    createAgentPrompt(agent, cities, distance) {
        const cityList = cities.split(', ');
        const agentType = agent.name.toLowerCase().split(' ')[0]; // Get first word
        
        const prompts = {
            adventure: `You are the ADVENTURE EXPLORER for Southern France. Create a hardcore adventure guide for ${cities} (${distance}km).

For each city, provide SPECIFIC activities with exact details:
• Exact company names for adventures (rock climbing, canyoning, paragliding)
• Precise locations and booking info
• Real prices and seasons
• Hidden adventure spots tourists miss

Format as clean HTML sections with <h4> city headers and bullet points. Focus on bookable, extreme activities. Do not include any images.`,

            romance: `You are the ROMANCE CURATOR for Provence. Design intimate experiences for couples in ${cities} (${distance}km).

For each location, provide SPECIFIC romantic details:
• Exact sunset viewpoints with best timing
• Named romantic restaurants with signature dishes
• Private/intimate experiences only locals know
• Perfect photo spots for couples
• Wine tasting venues with reservation tips

Format as clean HTML. Include real restaurant names, addresses, and insider secrets. Do not include any images.`,

            cultural: `You are the CULTURE MAVEN for Southern France. Curate deep cultural experiences in ${cities} (${distance}km).

For each city, provide DETAILED cultural insights:
• Specific museums/sites with opening hours and fees
• Hidden historical locations with backstories  
• Traditional markets and artisan workshops
• Cultural events and festivals with dates
• Architectural gems with historical context

Format as clean HTML. Include practical details like hours, prices, and cultural significance. Do not include any images.`,

            foodie: `You are the CULINARY SCOUT for Provence cuisine. Create a gastronomic adventure in ${cities} (${distance}km).

For each city, provide SPECIFIC food experiences:
• Exact restaurant names with must-try dishes
• Local specialties and where to find the best versions
• Hidden food gems tourists don't know
• Market days and street food locations
• Cooking classes and food tours with booking details

Format as clean HTML. Include real restaurant names, addresses, and insider food tips. Do not include any images.`,

            family: `You are the FAMILY GUIDE for Southern France. Plan perfect family experiences in ${cities} (${distance}km).

For each location, provide KID-FRIENDLY specifics:
• Family attractions with age recommendations and prices
• Restaurants with kids' menus and play areas
• Interactive museums and hands-on activities
• Parks, beaches, and safe play areas
• Rainy day alternatives and stroller access info

Format as clean HTML. Include practical family logistics and age-appropriate activities. Do not include any images.`,

            luxury: `You are the LUXURY CONCIERGE for Southern France. Craft exclusive experiences in ${cities} (${distance}km).

For each destination, provide PREMIUM options:
• 5-star hotels and luxury villas with rates
• Michelin-starred restaurants with tasting menus
• Private tours and VIP access experiences
• Exclusive shopping and high-end spas
• Luxury transportation and concierge services

Format as clean HTML. Include booking requirements and luxury service details. Do not include any images.`
        };

        return prompts[agentType] || prompts.adventure;
    }
    
    /**
     * Create a route summary for quick comparison
     * @param {Object} agent - Agent configuration
     * @param {Object} route - Route data
     * @returns {Object} Route summary
     */
    createRouteSummary(agent, route) {
        return {
            agentName: agent.name,
            totalDistance: route.totalDistance,
            totalTime: route.totalTime,
            numStops: route.route.length - 2,
            detourFactor: route.detourFactor,
            cities: route.route.map(city => ({
                name: city.name,
                country: city.country,
                specialScore: city.themes[route.route[0].id === 'aix-en-provence' ? 'cultural' : 'adventure'] || 0
            }))
        };
    }
    
    /**
     * Create fallback result when agent fails
     * @param {string} agentType - Agent type
     * @param {string} startId - Start city
     * @param {string} destId - Destination city
     * @returns {Object} Fallback result
     */
    createFallbackResult(agentType, startId, destId) {
        const agent = this.agents[agentType];
        const fallbackRoute = {
            route: [
                this.routeCalculator.cities.find(c => c.id === startId),
                this.routeCalculator.cities.find(c => c.id === destId)
            ],
            totalDistance: 0,
            totalTime: '0.0',
            directDistance: 0,
            detourFactor: '0.0'
        };
        
        return {
            agentType,
            agent,
            route: fallbackRoute,
            itinerary: `${agent.name} is temporarily unavailable. Please try calculating the route again for specialized ${agent.description.toLowerCase()}.`,
            duration: 0,
            timestamp: Date.now(),
            cities: fallbackRoute.route,
            summary: this.createRouteSummary(agent, fallbackRoute),
            fallback: true
        };
    }
    
    /**
     * Get results from all agents
     * @returns {Map} Agent results
     */
    getAllResults() {
        return this.agentResults;
    }
    
    /**
     * Get result from specific agent
     * @param {string} agentType - Agent type
     * @returns {Object|null} Agent result
     */
    getAgentResult(agentType) {
        return this.agentResults.get(agentType) || null;
    }
    
    /**
     * Get comparison of all routes
     * @returns {Array} Array of route comparisons
     */
    getRouteComparison() {
        const comparison = [];
        
        this.agentResults.forEach((result, agentType) => {
            comparison.push({
                agentType,
                name: result.agent.name,
                icon: result.agent.icon,
                color: result.agent.color,
                gradient: result.agent.gradient,
                cities: result.cities.map(c => c.name),
                distance: result.route.totalDistance,
                time: result.route.totalTime,
                detour: result.route.detourFactor,
                uniqueStops: result.cities.length - 2,
                fallback: result.fallback || false
            });
        });
        
        // Sort by distance for easy comparison
        comparison.sort((a, b) => a.distance - b.distance);
        
        return comparison;
    }
    
    /**
     * Create realistic fallback itinerary for each agent type
     */
    createFallbackItinerary(agent, route) {
        const cities = route.route.map(c => c.name);
        const agentItineraries = {
            'Adventure Explorer': `
                <h3>🏔️ Adventure Journey: ${cities.join(' → ')}</h3>
                <p>Experience the thrill of Southern France and Italy with this adventure-packed route covering ${route.totalDistance}km.</p>
                
                <h4>Adventure Highlights:</h4>
                <ul>
                    <li><strong>Hiking Trails:</strong> Explore scenic mountain paths and coastal cliff walks</li>
                    <li><strong>Water Sports:</strong> Kayaking, sailing, and diving opportunities along the coast</li>
                    <li><strong>Rock Climbing:</strong> Challenge yourself on Mediterranean limestone cliffs</li>
                    <li><strong>Cycling Routes:</strong> Mountain biking through lavender fields and vineyards</li>
                </ul>
                
                <h4>Adventure Activities by Stop:</h4>
                ${cities.map((city, i) => `
                    <p><strong>Stop ${i + 1}: ${city}</strong><br>
                    ${this.getAdventureActivities(city)}</p>
                `).join('')}
            `,
            'Romance Curator': `
                <h3>💕 Romantic Escape: ${cities.join(' → ')}</h3>
                <p>Fall in love all over again on this enchanting ${route.totalDistance}km journey through the most romantic destinations in Europe.</p>
                
                <h4>Romantic Highlights:</h4>
                <ul>
                    <li><strong>Sunset Dinners:</strong> Intimate restaurants with panoramic Mediterranean views</li>
                    <li><strong>Wine Tastings:</strong> Private cellar tours in historic châteaux</li>
                    <li><strong>Boutique Hotels:</strong> Charming accommodations in historic palazzos</li>
                    <li><strong>Couples Experiences:</strong> Cooking classes, art workshops, and spa treatments</li>
                </ul>
                
                <h4>Romance by Destination:</h4>
                ${cities.map((city, i) => `
                    <p><strong>${city} Romance</strong><br>
                    ${this.getRomanticActivities(city)}</p>
                `).join('')}
            `,
            'Culture Maven': `
                <h3>🏛️ Cultural Discovery: ${cities.join(' → ')}</h3>
                <p>Immerse yourself in centuries of art, history, and culture on this enriching ${route.totalDistance}km cultural expedition.</p>
                
                <h4>Cultural Treasures:</h4>
                <ul>
                    <li><strong>Museums & Galleries:</strong> World-class art collections and historical exhibits</li>
                    <li><strong>Architecture:</strong> Roman ruins, medieval churches, and Renaissance palaces</li>
                    <li><strong>Local Traditions:</strong> Festivals, markets, and artisan workshops</li>
                    <li><strong>Historical Sites:</strong> UNESCO World Heritage locations and ancient monuments</li>
                </ul>
                
                <h4>Cultural Highlights by City:</h4>
                ${cities.map((city, i) => `
                    <p><strong>${city} Culture</strong><br>
                    ${this.getCulturalActivities(city)}</p>
                `).join('')}
            `,
            'Culinary Scout': `
                <h3>🍽️ Gastronomic Journey: ${cities.join(' → ')}</h3>
                <p>Savor the flavors of France and Italy on this delicious ${route.totalDistance}km culinary adventure.</p>
                
                <h4>Culinary Experiences:</h4>
                <ul>
                    <li><strong>Local Markets:</strong> Fresh ingredients and regional specialties</li>
                    <li><strong>Cooking Classes:</strong> Learn from local chefs and home cooks</li>
                    <li><strong>Wine & Olive Oil:</strong> Tastings at family-owned vineyards and mills</li>
                    <li><strong>Street Food:</strong> Authentic flavors from local food vendors</li>
                </ul>
                
                <h4>Culinary Highlights:</h4>
                ${cities.map((city, i) => `
                    <p><strong>${city} Cuisine</strong><br>
                    ${this.getCulinaryActivities(city)}</p>
                `).join('')}
            `,
            'Family Guide': `
                <h3>👨‍👩‍👧‍👦 Family Adventure: ${cities.join(' → ')}</h3>
                <p>Create lasting memories with the whole family on this ${route.totalDistance}km kid-friendly journey.</p>
                
                <h4>Family Fun:</h4>
                <ul>
                    <li><strong>Interactive Museums:</strong> Hands-on exhibits perfect for curious minds</li>
                    <li><strong>Beach Time:</strong> Safe swimming spots and sandcastle building</li>
                    <li><strong>Parks & Playgrounds:</strong> Green spaces for kids to run and play</li>
                    <li><strong>Family Restaurants:</strong> Kid-friendly menus and welcoming atmospheres</li>
                </ul>
                
                <h4>Family Activities by Stop:</h4>
                ${cities.map((city, i) => `
                    <p><strong>${city} for Families</strong><br>
                    ${this.getFamilyActivities(city)}</p>
                `).join('')}
            `,
            'Luxury Concierge': `
                <h3>✨ Luxury Experience: ${cities.join(' → ')}</h3>
                <p>Indulge in the finest experiences along this ${route.totalDistance}km luxury escape through Europe's most exclusive destinations.</p>
                
                <h4>Luxury Highlights:</h4>
                <ul>
                    <li><strong>5-Star Accommodations:</strong> World-renowned hotels and private villas</li>
                    <li><strong>Michelin Dining:</strong> Award-winning restaurants and celebrity chefs</li>
                    <li><strong>VIP Experiences:</strong> Private tours, exclusive access, and personalized service</li>
                    <li><strong>Luxury Transport:</strong> Premium vehicles and helicopter transfers</li>
                </ul>
                
                <h4>Luxury by Destination:</h4>
                ${cities.map((city, i) => `
                    <p><strong>${city} Luxury</strong><br>
                    ${this.getLuxuryActivities(city)}</p>
                `).join('')}
            `
        };
        
        return agentItineraries[agent.name] || `
            <h3>${agent.icon} ${agent.name}: ${cities.join(' → ')}</h3>
            <p>Discover the best of ${cities.join(', ')} with our specialized ${agent.name.toLowerCase()} recommendations.</p>
            <p>This ${route.totalDistance}km journey offers unique experiences tailored to ${agent.specialization}.</p>
        `;
    }
    
    getAdventureActivities(city) {
        const activities = {
            'Aix-en-Provence': 'Hike Montagne Sainte-Victoire, rock climbing at Calanques, mountain biking through countryside',
            'Nice': 'Coastal hiking, sea kayaking, paragliding over the Riviera, diving in crystal waters',
            'Florence': 'Cycling through Tuscan hills, hiking in Chianti region, adventure tours to Cinque Terre',
            'Venice': 'Stand-up paddleboarding in canals, island hopping adventures, photography walks',
            'Rome': 'Underground catacombs exploration, Villa Borghese cycling, Appian Way hiking',
            'Cannes': 'Sailing excursions, scuba diving, coastal cliff walks, jet skiing'
        };
        return activities[city] || 'Outdoor adventures and thrilling activities await in this stunning location';
    }
    
    getRomanticActivities(city) {
        const activities = {
            'Aix-en-Provence': 'Couples wine tasting, romantic strolls through old town, sunset at Cours Mirabeau',
            'Nice': 'Private yacht charter, candlelit dinner on Promenade des Anglais, couples spa treatments',
            'Florence': 'Private Uffizi tour, romantic dinner with Arno views, sunset at Piazzale Michelangelo',
            'Venice': 'Gondola serenade, intimate osteria dining, sunrise at St. Mark\'s Square',
            'Rome': 'Private Vatican tour, rooftop dining with city views, romantic villa gardens',
            'Cannes': 'Beach picnics, luxury hotel spas, private cinema screenings'
        };
        return activities[city] || 'Romantic experiences and intimate moments in this enchanting destination';
    }
    
    getCulturalActivities(city) {
        const activities = {
            'Aix-en-Provence': 'Cézanne Studio visit, historic walking tour, local art galleries and markets',
            'Nice': 'Musée Matisse, Old Town architecture, traditional Niçoise culture experiences',
            'Florence': 'Renaissance masterpieces, historic palazzos, artisan workshops and demonstrations',
            'Venice': 'Doge\'s Palace, Byzantine art, traditional glassmaking and mask-making',
            'Rome': 'Ancient Roman sites, Vatican treasures, archaeological wonders and museums',
            'Cannes': 'Film festival history, Belle Époque architecture, Provence cultural traditions'
        };
        return activities[city] || 'Rich cultural heritage and artistic treasures to explore';
    }
    
    getCulinaryActivities(city) {
        const activities = {
            'Aix-en-Provence': 'Provençal cooking class, local market tours, olive oil and wine tastings',
            'Nice': 'Socca making, seafood specialties, local bistros and food markets',
            'Florence': 'Tuscan cuisine workshops, Chianti wine tours, traditional trattorias',
            'Venice': 'Cicchetti bar tours, seafood markets, prosecco tastings, cooking classes',
            'Rome': 'Pasta making classes, street food tours, gelato tastings, local markets',
            'Cannes': 'Mediterranean gastronomy, rosé wine tastings, coastal seafood specialties'
        };
        return activities[city] || 'Delicious local cuisine and culinary traditions to discover';
    }
    
    getFamilyActivities(city) {
        const activities = {
            'Aix-en-Provence': 'Interactive science museums, family parks, kid-friendly cafes and ice cream shops',
            'Nice': 'Beach games, family-friendly museums, parks with playgrounds, aquarium visits',
            'Florence': 'Interactive history exhibits, gelato tours, family cooking classes, treasure hunts',
            'Venice': 'Mask-making workshops, family gondola rides, interactive maritime museums',
            'Rome': 'Gladiator experiences, interactive archaeology, family pizza tours, park adventures',
            'Cannes': 'Beach activities, family hotels with kids clubs, interactive film exhibits'
        };
        return activities[city] || 'Family-friendly attractions and activities for all ages';
    }
    
    getLuxuryActivities(city) {
        const activities = {
            'Aix-en-Provence': 'Private château tours, luxury spa treatments, exclusive wine cellars, helicopter tours',
            'Nice': 'Michelin-starred dining, luxury yacht charters, 5-star hotel suites, private beach clubs',
            'Florence': 'Private Uffizi after-hours, luxury villa stays, exclusive art collections, personal shoppers',
            'Venice': 'Private palace tours, luxury hotel suites on Grand Canal, exclusive restaurant access',
            'Rome': 'Vatican private tours, luxury rooftop dining, 5-star spa treatments, personal guides',
            'Cannes': 'Film festival VIP access, luxury beachfront suites, private yacht experiences'
        };
        return activities[city] || 'Exclusive luxury experiences and premium services await';
    }

    /**
     * Cancel all active agents
     */
    cancelAllAgents() {
        console.log('🛑 Canceling all active agents...');
        this.activeAgents.clear();
        // Note: Can't actually cancel fetch requests, but clear tracking
    }
}