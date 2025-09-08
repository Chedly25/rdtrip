/**
 * Parallel Agents System - Generates 6 different itineraries simultaneously
 * Each agent specializes in a specific trip type and generates unique routes
 */

export class ParallelAgentSystem {
    constructor(routeCalculator, aiFeatures) {
        this.routeCalculator = routeCalculator;
        this.aiFeatures = aiFeatures;
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
        
        // Create agent-specific options and launch all agents in parallel
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
            // Create agent-specific route options
            const agentOptions = {
                ...baseOptions,
                theme: agentType,
                numStops: Math.max(agent.routePreferences.minStops, baseOptions.numStops || 2),
                detourTolerance: Math.round(agent.routePreferences.detourTolerance * 100)
            };
            
            // Calculate unique route for this agent
            const route = this.routeCalculator.calculateRoute(startId, destId, agentOptions);
            
            // Generate agent-specific itinerary prompt
            const cities = route.route.map(c => c.name).join(', ');
            const prompt = this.createAgentPrompt(agent, cities, route.totalDistance);
            
            // Get AI-powered itinerary from this agent with timeout
            const agentItinerary = await Promise.race([
                this.aiFeatures.callPerplexityAPI(prompt, false),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Agent timeout - using fallback')), 30000)
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
            
            // Provide fallback result instead of throwing error
            const duration = Date.now() - startTime;
            console.log(`🔄 ${agent.name} using fallback (${duration}ms)`);
            
            const fallbackRoute = this.routeCalculator.calculateRoute(startId, destId, {
                ...baseOptions,
                theme: agentType
            });
            
            return {
                agentType,
                agent,
                route: fallbackRoute,
                itinerary: `${agent.name} specializes in ${agent.specialization}. Route includes ${fallbackRoute.route.map(c => c.name).join(' → ')} with ${fallbackRoute.totalDistance}km total distance.`,
                duration,
                timestamp: Date.now(),
                cities: fallbackRoute.route,
                summary: this.createRouteSummary(agent, fallbackRoute),
                fallback: true
            };
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

Format as clean HTML sections with <h4> city headers and bullet points. No markdown. Focus on bookable, extreme activities.`,

            romance: `You are the ROMANCE CURATOR for Provence. Design intimate experiences for couples in ${cities} (${distance}km).

For each location, provide SPECIFIC romantic details:
• Exact sunset viewpoints with best timing
• Named romantic restaurants with signature dishes
• Private/intimate experiences only locals know
• Perfect photo spots for couples
• Wine tasting venues with reservation tips

Format as clean HTML. Include real restaurant names, addresses, and insider secrets.`,

            cultural: `You are the CULTURE MAVEN for Southern France. Curate deep cultural experiences in ${cities} (${distance}km).

For each city, provide DETAILED cultural insights:
• Specific museums/sites with opening hours and fees
• Hidden historical locations with backstories  
• Traditional markets and artisan workshops
• Cultural events and festivals with dates
• Architectural gems with historical context

Format as clean HTML. Include practical details like hours, prices, and cultural significance.`,

            foodie: `You are the CULINARY SCOUT for Provence cuisine. Create a gastronomic adventure in ${cities} (${distance}km).

For each city, provide SPECIFIC food experiences:
• Exact restaurant names with must-try dishes
• Local specialties and where to find the best versions
• Hidden food gems tourists don't know
• Market days and street food locations
• Cooking classes and food tours with booking details

Format as clean HTML. Include real restaurant names, addresses, and insider food tips.`,

            family: `You are the FAMILY GUIDE for Southern France. Plan perfect family experiences in ${cities} (${distance}km).

For each location, provide KID-FRIENDLY specifics:
• Family attractions with age recommendations and prices
• Restaurants with kids' menus and play areas
• Interactive museums and hands-on activities
• Parks, beaches, and safe play areas
• Rainy day alternatives and stroller access info

Format as clean HTML. Include practical family logistics and age-appropriate activities.`,

            luxury: `You are the LUXURY CONCIERGE for Southern France. Craft exclusive experiences in ${cities} (${distance}km).

For each destination, provide PREMIUM options:
• 5-star hotels and luxury villas with rates
• Michelin-starred restaurants with tasting menus
• Private tours and VIP access experiences
• Exclusive shopping and high-end spas
• Luxury transportation and concierge services

Format as clean HTML. Include booking requirements and luxury service details.`
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
     * Cancel all active agents
     */
    cancelAllAgents() {
        console.log('🛑 Canceling all active agents...');
        this.activeAgents.clear();
        // Note: Can't actually cancel fetch requests, but clear tracking
    }
}