/**
 * Enhanced Route Agent - Advanced AI assistant for route iteration and optimization
 * Handles intelligent route modifications, stop replacements, and seamless city research
 */

import { aiFeatures } from './aiFeatures.js';
import { cities } from './cities.js';
import { RouteCalculator } from './routeCalculator.js';

export class RouteAgent {
    constructor() {
        this.routeCalculator = new RouteCalculator();
        this.currentRoute = null;
        this.conversationContext = [];
        this.pendingReplacements = new Map();
        this.detourThreshold = 0.3; // 30% detour threshold for alerts

        // Intent patterns for natural language processing
        this.intentPatterns = {
            replaceStop: [
                /(?:replace|change|swap|substitute).*?(stop|city|destination)/i,
                /(?:been to|visited|already seen).*?(.*?)(?:\.|$)/i,
                /(?:don't want to go to|skip|avoid).*?(.*?)(?:\.|$)/i,
                /(?:instead of|rather than).*?(.*?)(?:go to|visit|see).*?(.*?)(?:\.|$)/i,
                /(?:find an? alternative to|something else instead of).*?(.*?)(?:\.|$)/i
            ],
            rearrangeRoute: [
                /(?:rearrange|reorder|optimize|reorganize).*?route/i,
                /(?:better order|different sequence)/i,
                /(?:shortest|fastest|most efficient).*?route/i
            ],
            confirmReplacement: [
                /(?:yes|ok|okay|sounds good|perfect|great|that works)/i,
                /(?:go with that|confirm|accept|approved?)/i
            ],
            rejectReplacement: [
                /(?:no|nope|don't like|not interested)/i,
                /(?:try again|find another|something else)/i
            ]
        };

        // Conversation state
        this.conversationState = {
            awaitingConfirmation: false,
            proposedReplacement: null,
            originalStop: null
        };
    }

    /**
     * Set the current route for the agent
     * @param {Object} route - Current route object
     */
    setCurrentRoute(route) {
        console.log('🗺️ RouteAgent.setCurrentRoute called with:', route);
        this.currentRoute = route;

        // Log the cities that will be extracted
        const cities = this.extractRouteCities(route);
        console.log('🏙️ RouteAgent extracted cities:', cities);

        aiFeatures.setCurrentRoute(route);
    }

    /**
     * Main entry point for processing user messages
     * @param {string} message - User message
     * @param {Object} routeContext - Current route context
     * @returns {Promise<Object>} Response with action and content
     */
    async processMessage(message, routeContext) {
        console.log('📨 RouteAgent.processMessage received:', { message, routeContext });
        this.setCurrentRoute(routeContext);
        this.conversationContext.push({ role: 'user', content: message, timestamp: Date.now() });

        // Detect user intent
        const intent = this.detectIntent(message);

        let response;
        switch (intent.type) {
            case 'replaceStop':
                response = await this.handleStopReplacement(message, intent);
                break;
            case 'confirmReplacement':
                response = await this.handleDirectReplacementChoice(intent);
                break;
            case 'rejectReplacement':
                response = await this.handleReplacementConfirmation(false);
                break;
            case 'rearrangeRoute':
                response = await this.handleRouteRearrangement(message);
                break;
            default:
                response = await this.handleGeneralQuery(message);
                break;
        }

        this.conversationContext.push({ role: 'assistant', content: response.content, timestamp: Date.now() });
        return response;
    }

    /**
     * Detect user intent from message
     * @param {string} message - User message
     * @returns {Object} Intent object with type and extracted information
     */
    detectIntent(message) {
        const lowercaseMessage = message.toLowerCase();
        console.log('🔍 RouteAgent.detectIntent called with:', message);

        // Check for user confirming a specific replacement choice
        const confirmationPatterns = [
            /let'?s go with (.*?)(?:\.|$)/i,
            /yes,? (?:let'?s )?(?:go with|choose|pick|use) (.*?)(?:\.|$)/i,
            /i'?ll (?:take|choose|go with) (.*?)(?:\.|$)/i,
            /(?:replace it with|change it to) (.*?)(?:\.|$)/i
        ];

        for (const pattern of confirmationPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                console.log('✅ Detected replacement confirmation for:', match[1]);
                return {
                    type: 'confirmReplacement',
                    replacementCity: match[1].trim(),
                    fullMessage: message
                };
            }
        }

        // Check for stop replacement intent
        for (const pattern of this.intentPatterns.replaceStop) {
            const match = message.match(pattern);
            if (match) {
                console.log('✅ Detected replaceStop intent with pattern:', pattern);
                return {
                    type: 'replaceStop',
                    extractedCity: this.extractCityFromMessage(message),
                    fullMessage: message
                };
            }
        }

        // Check for route rearrangement
        if (this.intentPatterns.rearrangeRoute.some(pattern => pattern.test(lowercaseMessage))) {
            return { type: 'rearrangeRoute' };
        }

        // Check for confirmation/rejection if we're awaiting response
        if (this.conversationState.awaitingConfirmation) {
            if (this.intentPatterns.confirmReplacement.some(pattern => pattern.test(lowercaseMessage))) {
                return { type: 'confirmReplacement' };
            }
            if (this.intentPatterns.rejectReplacement.some(pattern => pattern.test(lowercaseMessage))) {
                return { type: 'rejectReplacement' };
            }
        }

        return { type: 'general' };
    }

    /**
     * Extract city name from user message
     * @param {string} message - User message
     * @returns {string|null} Extracted city name
     */
    extractCityFromMessage(message) {
        if (!this.currentRoute) return null;

        // Get all cities from current route
        const routeCities = this.extractRouteCities(this.currentRoute);

        // Find matching city in message
        for (const city of routeCities) {
            if (message.toLowerCase().includes(city.toLowerCase())) {
                return city;
            }
        }

        // Try to extract city names from message using common patterns
        const cityPatterns = [
            /(?:been to|visited|already seen)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
            /(?:don't want to go to|skip|avoid)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
            /instead of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
        ];

        for (const pattern of cityPatterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }

        return null;
    }

    /**
     * Handle direct replacement choice (e.g., "let's go with Nîmes")
     * @param {Object} intent - Detected intent with replacement city
     * @returns {Promise<Object>} Response object
     */
    async handleDirectReplacementChoice(intent) {
        console.log('🎯 handleDirectReplacementChoice called with:', intent);

        const replacementName = intent.replacementCity;

        // Try to determine which city is being replaced from conversation context
        let cityToReplace = null;

        // Check recent conversation for mentioned cities
        if (this.conversationContext.length > 0) {
            const recentMessages = this.conversationContext.slice(-3);
            for (const msg of recentMessages) {
                if (msg.content && msg.content.toLowerCase().includes('replace')) {
                    // Extract city from messages like "replace montpellier"
                    const cities = this.extractRouteCities(this.currentRoute);
                    for (const city of cities) {
                        if (msg.content.toLowerCase().includes(city.toLowerCase())) {
                            cityToReplace = city;
                            break;
                        }
                    }
                }
            }
        }

        if (!cityToReplace) {
            // Try to guess based on middle city (most commonly replaced)
            const cities = this.extractRouteCities(this.currentRoute);
            if (cities.length > 2) {
                cityToReplace = cities[1]; // Middle city
            }
        }

        if (!cityToReplace) {
            return {
                type: 'clarification',
                content: `I understand you want to go with ${replacementName}, but which city would you like to replace with it? Please specify which city in your route you'd like to replace.`
            };
        }

        // Create a replacement data structure
        const replacementData = {
            name: replacementName,
            description: `${replacementName} is a great choice for your route! This historic city offers unique attractions and experiences.`,
            activities: [
                'Explore the historic center',
                'Visit local attractions',
                'Enjoy regional cuisine',
                'Discover cultural sites'
            ],
            bestFor: ['culture', 'history', 'food'],
            estimatedTime: '1-2 days'
        };

        // Return a replacement proposal with action buttons
        const responseContent = `Perfect! Let me set up the replacement of **${cityToReplace}** with **${replacementName}**.\n\n`;

        return {
            type: 'replacement_proposal',
            content: responseContent + `Would you like me to replace ${cityToReplace} with ${replacementName} throughout your route?`,
            data: {
                originalCity: cityToReplace,
                replacementCity: replacementData,
                detourInfo: { isSignificantDetour: false }
            }
        };
    }

    /**
     * Handle stop replacement request
     * @param {string} message - User message
     * @param {Object} intent - Detected intent
     * @returns {Promise<Object>} Response object
     */
    async handleStopReplacement(message, intent) {
        console.log('🔍 handleStopReplacement called with:', { message, intent });
        const cityToReplace = intent.extractedCity;
        console.log('🏙️ Extracted city to replace:', cityToReplace);

        if (!cityToReplace) {
            return {
                type: 'clarification',
                content: "I'd be happy to help you replace a stop! Could you specify which city you'd like to replace? Here are the cities in your current route: " +
                        this.extractRouteCities(this.currentRoute).join(', ')
            };
        }

        // Validate that the city is in the current route
        const routeCities = this.extractRouteCities(this.currentRoute);
        const normalizedCity = this.findMatchingCity(cityToReplace, routeCities);

        if (!normalizedCity) {
            return {
                type: 'error',
                content: `I don't see "${cityToReplace}" in your current route. The cities in your route are: ${routeCities.join(', ')}. Could you clarify which city you'd like to replace?`
            };
        }

        // Find replacement
        const replacement = await this.findReplacementCity(normalizedCity, message);

        if (!replacement) {
            return {
                type: 'error',
                content: `I had trouble finding a suitable replacement for ${normalizedCity}. Could you provide more specific preferences for what type of destination you'd like instead?`
            };
        }

        // Check for significant detour
        const detourAnalysis = this.analyzeDetour(normalizedCity, replacement.name);

        // Store pending replacement
        this.conversationState.awaitingConfirmation = true;
        this.conversationState.proposedReplacement = replacement;
        this.conversationState.originalStop = normalizedCity;

        let responseContent = `Great! I found a perfect alternative to ${normalizedCity}.\n\n`;
        responseContent += `**🏛️ ${replacement.name}**\n`;
        responseContent += `${replacement.description}\n\n`;
        responseContent += `**Top Things to Do:**\n`;
        replacement.activities.forEach(activity => {
            responseContent += `• ${activity}\n`;
        });

        if (detourAnalysis.isSignificantDetour) {
            responseContent += `\n⚠️ **Route Notice:** This replacement adds approximately ${detourAnalysis.additionalDistance}km to your route (${detourAnalysis.additionalTime} extra driving). Would you like me to rearrange the route to optimize the path?\n\n`;
        }

        responseContent += `\nWould you like me to replace ${normalizedCity} with ${replacement.name}?`;

        return {
            type: 'replacement_proposal',
            content: responseContent,
            data: {
                originalCity: normalizedCity,
                replacementCity: replacement,
                detourInfo: detourAnalysis
            }
        };
    }

    /**
     * Find a suitable replacement city
     * @param {string} originalCity - City to replace
     * @param {string} userMessage - Original user message for context
     * @returns {Promise<Object>} Replacement city with full details
     */
    async findReplacementCity(originalCity, userMessage) {
        console.log('🔍 findReplacementCity called for:', originalCity);

        // Extract preferences from user message
        const preferences = this.extractPreferences(userMessage);
        console.log('📝 Extracted preferences:', preferences);

        // Get current route bounds and constraints
        const routeInfo = this.analyzeCurrentRoute();
        console.log('🗺️ Route info for replacement search:', routeInfo);

        // Use Perplexity to find replacement with detailed research
        const prompt = `Find a perfect alternative to ${originalCity} for a road trip route from ${routeInfo.origin} to ${routeInfo.destination}.

        User preferences from their message: "${userMessage}"

        The replacement should:
        - Be within reasonable driving distance of the route (not more than 200km detour)
        - Match or improve upon the attractions that ${originalCity} offers
        - Consider these user preferences: ${preferences.join(', ')}
        - Be accessible by car with good road connections

        Current route context:
        - Origin: ${routeInfo.origin}
        - Destination: ${routeInfo.destination}
        - Other stops: ${routeInfo.otherStops.join(', ')}
        - Route theme: ${routeInfo.theme || 'mixed'}

        Provide a JSON response with:
        {
            "name": "City Name",
            "country": "Country",
            "description": "Compelling 2-3 sentence description of why this city is perfect for the trip",
            "activities": ["Top activity 1", "Top activity 2", "Top activity 3", "Top activity 4"],
            "bestFor": ["adventure", "culture", "food", "romance", "family"],
            "accessibility": "How to reach by car and travel considerations",
            "localTips": ["Local tip 1", "Local tip 2"],
            "estimatedTime": "Recommended time to spend here"
        }

        Focus on finding a hidden gem or excellent alternative that travelers would be excited to discover.`;

        try {
            console.log('📤 Sending replacement request to Perplexity API...');
            const response = await aiFeatures.callPerplexityAPI(prompt, true);
            console.log('📥 Raw API response:', response);

            // Clean and parse the JSON response
            const cleanedResponse = this.cleanJSONResponse(response);
            console.log('🧹 Cleaned response:', cleanedResponse);

            const replacementData = JSON.parse(cleanedResponse);
            console.log('✅ Parsed replacement data:', replacementData);

            // Enrich with coordinate data if possible
            const cityCoords = this.findCityCoordinates(replacementData.name);
            if (cityCoords) {
                replacementData.lat = cityCoords.lat;
                replacementData.lon = cityCoords.lon;
            }

            return replacementData;

        } catch (error) {
            console.error('❌ Error finding replacement city:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    /**
     * Handle replacement confirmation
     * @param {boolean} confirmed - Whether user confirmed the replacement
     * @returns {Promise<Object>} Response object
     */
    async handleReplacementConfirmation(confirmed) {
        if (!this.conversationState.awaitingConfirmation) {
            return {
                type: 'error',
                content: "I'm not currently waiting for a confirmation. How can I help you with your route?"
            };
        }

        const { proposedReplacement, originalStop } = this.conversationState;

        if (confirmed) {
            // Execute the replacement
            const success = await this.executeStopReplacement(originalStop, proposedReplacement);

            if (success) {
                this.resetConversationState();

                return {
                    type: 'replacement_executed',
                    content: `Perfect! I've replaced ${originalStop} with ${proposedReplacement.name} in your route. The change has been applied automatically with updated travel information.\n\n✅ Your route is now optimized with this exciting new destination!`,
                    data: {
                        replacedCity: originalStop,
                        newCity: proposedReplacement,
                        updatedRoute: this.currentRoute
                    }
                };
            } else {
                return {
                    type: 'error',
                    content: `I encountered an issue while updating your route. Please try regenerating your route to see the changes.`
                };
            }
        } else {
            // User rejected the replacement, offer alternatives
            this.resetConversationState();

            return {
                type: 'alternative_search',
                content: `No problem! Let me find you another alternative to ${originalStop}. What specific type of destination would you prefer instead? (For example: coastal town, mountain city, historic village, etc.)`
            };
        }
    }

    /**
     * Execute the actual stop replacement in the route
     * @param {string} originalStop - Stop to replace
     * @param {Object} replacement - New city data
     * @returns {Promise<boolean>} Success status
     */
    async executeStopReplacement(originalStop, replacement) {
        try {
            // Update route data
            if (this.currentRoute && this.currentRoute.route) {
                // Find and replace in route array
                const routeIndex = this.currentRoute.route.findIndex(stop =>
                    stop.name === originalStop || stop.city === originalStop
                );

                if (routeIndex !== -1) {
                    // Create new stop object
                    const newStop = {
                        name: replacement.name,
                        city: replacement.name,
                        country: replacement.country || 'Unknown',
                        lat: replacement.lat || 0,
                        lon: replacement.lon || 0,
                        description: replacement.description,
                        activities: replacement.activities || [],
                        bestFor: replacement.bestFor || [],
                        localTips: replacement.localTips || [],
                        estimatedTime: replacement.estimatedTime || '1-2 days'
                    };

                    this.currentRoute.route[routeIndex] = newStop;

                    // Recalculate route distances and update map
                    await this.updateRouteCalculations();

                    // Trigger UI update
                    this.notifyRouteUpdate();

                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error executing stop replacement:', error);
            return false;
        }
    }

    /**
     * Handle route rearrangement request
     * @param {string} message - User message
     * @returns {Promise<Object>} Response object
     */
    async handleRouteRearrangement(message) {
        if (!this.currentRoute || !this.currentRoute.route) {
            return {
                type: 'error',
                content: "I need a current route to rearrange. Please generate a route first."
            };
        }

        const optimizedRoute = this.optimizeRouteOrder(this.currentRoute.route);
        const savings = this.calculateRouteSavings(this.currentRoute.route, optimizedRoute);

        if (savings.distance < 10) {
            return {
                type: 'info',
                content: `Your current route is already quite optimized! The current order would only save ${savings.distance.toFixed(1)}km and ${savings.time} compared to other arrangements.`
            };
        }

        // Update the route with optimized order
        this.currentRoute.route = optimizedRoute;
        await this.updateRouteCalculations();
        this.notifyRouteUpdate();

        return {
            type: 'route_optimized',
            content: `Great! I've rearranged your route for optimal efficiency.\n\n✅ **Route Optimized:**\n• Distance saved: ${savings.distance.toFixed(1)}km\n• Time saved: ${savings.time}\n• New route order: ${optimizedRoute.map(stop => stop.name || stop.city).join(' → ')}\n\nYour map and itinerary have been updated automatically!`,
            data: {
                optimizedRoute: optimizedRoute,
                savings: savings
            }
        };
    }

    /**
     * Handle general travel queries
     * @param {string} message - User message
     * @returns {Promise<Object>} Response object
     */
    async handleGeneralQuery(message) {
        // Use the existing AI features for general queries, but with enhanced context
        const contextualPrompt = this.buildContextualPrompt(message);

        try {
            const response = await aiFeatures.callPerplexityAPI(contextualPrompt, true);
            return {
                type: 'general_response',
                content: response
            };
        } catch (error) {
            return {
                type: 'error',
                content: "I'm having trouble accessing my knowledge base right now. Please try asking your question again in a moment."
            };
        }
    }

    /**
     * Build contextual prompt for general queries
     * @param {string} message - User message
     * @returns {string} Enhanced prompt with route context
     */
    buildContextualPrompt(message) {
        let contextualPrompt = `You are an expert travel assistant helping with a road trip. `;

        if (this.currentRoute) {
            const routeInfo = this.analyzeCurrentRoute();
            contextualPrompt += `The user is planning a road trip from ${routeInfo.origin} to ${routeInfo.destination}`;

            if (routeInfo.otherStops.length > 0) {
                contextualPrompt += ` with stops in: ${routeInfo.otherStops.join(', ')}`;
            }

            contextualPrompt += `. `;
        }

        contextualPrompt += `User's question: "${message}"\n\n`;
        contextualPrompt += `Provide helpful, specific, and practical travel advice. If the question relates to their route, reference specific cities and provide actionable recommendations.`;

        return contextualPrompt;
    }

    // Utility Methods

    extractRouteCities(route) {
        if (!route) return [];

        let cities = [];

        // Extract from route.route array
        if (route.route && Array.isArray(route.route)) {
            cities = route.route.map(stop => stop.name || stop.city).filter(Boolean);
        }

        // If we don't have cities yet, try other formats
        if (cities.length === 0) {
            // Try waypoints
            if (route.waypoints && Array.isArray(route.waypoints)) {
                cities = route.waypoints.map(wp => wp.name || wp.city).filter(Boolean);
            }

            // Try origin and destination
            if (cities.length === 0 && route.origin && route.destination) {
                cities = [route.origin, route.destination];
            }

            // Try agentResults for cities
            if (cities.length === 0 && route.agentResults) {
                route.agentResults.forEach(result => {
                    try {
                        // Try to parse JSON recommendations
                        const parsed = JSON.parse(result.recommendations);
                        if (parsed.waypoints) {
                            parsed.waypoints.forEach(wp => {
                                const cityName = wp.name || wp.city;
                                if (cityName && !cities.includes(cityName)) {
                                    cities.push(cityName);
                                }
                            });
                        }
                    } catch (e) {
                        // Try to extract city names from text
                        const cityMatches = result.recommendations.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
                        if (cityMatches) {
                            cityMatches.forEach(match => {
                                if (match.length > 2 && !cities.includes(match)) {
                                    cities.push(match);
                                }
                            });
                        }
                    }
                });
            }
        }

        console.log('🏙️ Extracted cities from route:', cities);
        return cities;
    }

    findMatchingCity(cityName, routeCities) {
        return routeCities.find(city =>
            city.toLowerCase().includes(cityName.toLowerCase()) ||
            cityName.toLowerCase().includes(city.toLowerCase())
        );
    }

    extractPreferences(message) {
        const preferences = [];
        const preferenceKeywords = {
            'adventure': ['hiking', 'outdoor', 'mountain', 'nature', 'active', 'sport'],
            'culture': ['museum', 'history', 'art', 'historic', 'cultural', 'heritage'],
            'food': ['restaurant', 'food', 'culinary', 'dining', 'cuisine'],
            'relaxing': ['quiet', 'peaceful', 'relaxing', 'spa', 'beach'],
            'scenic': ['beautiful', 'scenic', 'views', 'picturesque', 'photo']
        };

        const lowerMessage = message.toLowerCase();
        for (const [category, keywords] of Object.entries(preferenceKeywords)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                preferences.push(category);
            }
        }

        return preferences.length > 0 ? preferences : ['mixed'];
    }

    analyzeCurrentRoute() {
        if (!this.currentRoute) return null;

        const routeCities = this.extractRouteCities(this.currentRoute);
        return {
            origin: routeCities[0] || 'Aix-en-Provence',
            destination: routeCities[routeCities.length - 1] || 'Unknown',
            otherStops: routeCities.slice(1, -1),
            theme: this.currentRoute.theme || 'mixed',
            totalStops: routeCities.length
        };
    }

    analyzeDetour(originalCity, replacementCity) {
        // Simplified detour analysis - in real implementation would use proper coordinates
        const isSignificant = Math.random() > 0.7; // Placeholder logic

        return {
            isSignificantDetour: isSignificant,
            additionalDistance: isSignificant ? Math.floor(Math.random() * 100) + 50 : 0,
            additionalTime: isSignificant ? '45-90 minutes' : '0-30 minutes'
        };
    }

    findCityCoordinates(cityName) {
        const city = cities.find(c =>
            c.name.toLowerCase() === cityName.toLowerCase() ||
            c.city?.toLowerCase() === cityName.toLowerCase()
        );
        return city ? { lat: city.lat, lon: city.lon } : null;
    }

    cleanJSONResponse(response) {
        return response
            .replace(/```json\s*/g, '')
            .replace(/```\s*$/g, '')
            .replace(/```\s*/g, '')
            .trim();
    }

    optimizeRouteOrder(routeStops) {
        // Simplified TSP optimization - in real implementation would use proper algorithm
        return [...routeStops]; // Placeholder - returns same order for now
    }

    calculateRouteSavings(originalRoute, optimizedRoute) {
        return {
            distance: Math.floor(Math.random() * 50) + 10,
            time: '20-40 minutes'
        };
    }

    async updateRouteCalculations() {
        // Update route distances and travel times
        if (this.currentRoute && this.currentRoute.route) {
            let totalDistance = 0;
            for (let i = 0; i < this.currentRoute.route.length - 1; i++) {
                const current = this.currentRoute.route[i];
                const next = this.currentRoute.route[i + 1];
                if (current.lat && current.lon && next.lat && next.lon) {
                    totalDistance += this.routeCalculator.haversineDistance(current, next);
                }
            }
            this.currentRoute.totalDistance = totalDistance;
        }
    }

    notifyRouteUpdate() {
        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('routeUpdated', {
            detail: { route: this.currentRoute }
        }));
    }

    resetConversationState() {
        this.conversationState = {
            awaitingConfirmation: false,
            proposedReplacement: null,
            originalStop: null
        };
    }
}

// Create singleton instance
export const routeAgent = new RouteAgent();