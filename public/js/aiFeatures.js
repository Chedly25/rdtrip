/**
 * AI Features Module - Handles all Perplexity API interactions
 * Provides 5 AI-powered features for trip planning
 */

export class AIFeatures {
    constructor() {
        // Initialize with default configuration
        this.apiKey = this.getDefaultApiKey();
        this.currentRoute = null;
    }
    
    /**
     * Get the default API key from configuration
     * @returns {string} The default API key
     */
    getDefaultApiKey() {
        // Default API key for the application
        return atob('cHBseC04b0hSaHdPZWlkR09vWlpkY3doVU5RMnNxYjF5ajRlaHlSNmJ1RGtrd2x0c2tyNVY=');
    }
    
    /**
     * Set the API key for Perplexity (now optional since key is integrated)
     * @param {string} apiKey - The API key
     */
    setApiKey(apiKey) {
        // If a custom API key is provided, use it, otherwise keep the default
        if (apiKey && apiKey.trim()) {
            this.apiKey = apiKey;
        }
    }
    
    /**
     * Set the current route for AI features
     * @param {Object} route - Current route object
     */
    setCurrentRoute(route) {
        this.currentRoute = route;
    }
    
    /**
     * Call Perplexity API with a prompt
     * @param {string} prompt - The prompt to send to the AI
     * @returns {Promise<string>} AI response or null on error
     */
    async callPerplexityAPI(prompt) {        
        try {
            // Use the server proxy endpoint to avoid CORS issues
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
            }
            
            const data = await response.json();
            
            if (!data.content) {
                throw new Error('Invalid response format from server');
            }
            
            return data.content;
        } catch (error) {
            console.error('Perplexity API Error:', error);
            
            if (error.message.includes('API request failed')) {
                throw error;
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Please check your internet connection');
            } else {
                throw new Error('Failed to communicate with AI service: ' + error.message);
            }
        }
    }
    
    /**
     * Generate a poetic trip narrative
     * @returns {Promise<string>} Trip narrative
     */
    async generateTripNarrative() {
        if (!this.currentRoute) {
            throw new Error('Please calculate a route first');
        }
        
        const cityNames = this.currentRoute.route.map(c => c.name).join(', ');
        const distance = this.currentRoute.totalDistance;
        const countries = [...new Set(this.currentRoute.route.map(c => c.country))];
        
        const prompt = `Write a poetic and inspiring 150-word description of a road trip through these cities: ${cityNames}. 
        
        The journey covers ${distance}km across ${countries.join(' and ')}. Focus on:
        - The emotional journey and sense of adventure
        - Landscapes and cultural transitions
        - The magic of discovery along the route
        - Vivid imagery of the Mediterranean region
        
        Write in an evocative, travel-inspired style that makes readers want to take this journey.`;
        
        return await this.callPerplexityAPI(prompt);
    }
    
    /**
     * Find local food specialties and restaurants
     * @returns {Promise<string>} Local food guide
     */
    async findLocalFood() {
        if (!this.currentRoute) {
            throw new Error('Please calculate a route first');
        }
        
        const cityNames = this.currentRoute.route.map(c => c.name).join(', ');
        
        const prompt = `Create a food lover's guide for these cities: ${cityNames}.
        
        For each city, provide:
        - 1-2 must-try local dishes or specialties
        - 1 recommended restaurant with specific name and what to order
        - Any unique food experiences or markets
        
        Focus on authentic, local experiences rather than tourist restaurants. Include practical details like opening hours when possible.`;
        
        return await this.callPerplexityAPI(prompt);
    }
    
    /**
     * Get weather advice and best travel times
     * @returns {Promise<string>} Weather and timing advice
     */
    async getWeatherAdvice() {
        if (!this.currentRoute) {
            throw new Error('Please calculate a route first');
        }
        
        const destination = this.currentRoute.route[this.currentRoute.route.length - 1].name;
        const region = this.currentRoute.route.some(c => c.country === 'IT') ? 
                      'France and Italy' : 'Southern France';
        
        const prompt = `Provide current weather and seasonal travel advice for a road trip to ${destination} through ${region}.
        
        Include:
        - Current weather conditions and forecast
        - Best months to visit and why
        - What to pack for each season
        - Any seasonal events or considerations (festivals, crowds, closures)
        - Driving conditions and seasonal road considerations
        
        Keep it practical and current.`;
        
        return await this.callPerplexityAPI(prompt);
    }
    
    /**
     * Discover hidden gems along the route
     * @returns {Promise<string>} Hidden gems guide
     */
    async discoverHiddenGems() {
        if (!this.currentRoute) {
            throw new Error('Please calculate a route first');
        }
        
        const cityNames = this.currentRoute.route.map(c => c.name).join(', ');
        const smallCities = this.currentRoute.route.filter(c => c.population < 50000).map(c => c.name);
        
        const prompt = `Reveal hidden gems and secret spots that tourists usually miss along this route: ${cityNames}.
        
        Focus on:
        - Off-the-beaten-path attractions and viewpoints
        - Local secrets and insider spots
        - Hidden beaches, trails, or natural areas
        - Authentic local experiences away from crowds
        - Small villages or neighborhoods worth exploring
        ${smallCities.length > 0 ? `\nPay special attention to these smaller places: ${smallCities.join(', ')}` : ''}
        
        Provide specific locations with brief descriptions of what makes them special.`;
        
        return await this.callPerplexityAPI(prompt);
    }
    
    /**
     * Generate complete day-by-day itinerary
     * @returns {Promise<string>} Full itinerary
     */
    async generateFullItinerary() {
        if (!this.currentRoute) {
            throw new Error('Please calculate a route first');
        }
        
        const route = this.currentRoute.route;
        const totalDays = Math.max(2, Math.ceil(route.length / 2)); // Minimum 2 days
        const cityNames = route.map(c => c.name).join(', ');
        const distance = this.currentRoute.totalDistance;
        
        const prompt = `Create a detailed ${totalDays}-day road trip itinerary for this route: ${cityNames} (${distance}km total).
        
        For each day, provide:
        - Morning: Where to start, what to see/do (with times)
        - Afternoon: Activities, lunch recommendations
        - Evening: Dinner suggestions, where to stay
        - Driving segments: Duration and scenic stops
        - Daily budget estimate (meals, activities, accommodation)
        
        Balance driving time with sightseeing. Include:
        - Specific activity names and locations
        - Recommended visit durations
        - Meal times and restaurant suggestions
        - Accommodation recommendations
        - Total daily cost estimates
        
        Make it practical and actionable.`;
        
        return await this.callPerplexityAPI(prompt);
    }
    
    /**
     * Get themed recommendations based on user's selected theme
     * @param {string} theme - Selected theme (adventure, romantic, cultural, etc.)
     * @returns {Promise<string>} Themed recommendations
     */
    async getThemedRecommendations(theme) {
        if (!this.currentRoute) {
            throw new Error('Please calculate a route first');
        }
        
        const cityNames = this.currentRoute.route.map(c => c.name).join(', ');
        
        const themePrompts = {
            adventure: 'outdoor activities, hiking trails, water sports, climbing, adventure tours, and adrenaline experiences',
            romantic: 'romantic restaurants, sunset viewpoints, couples activities, scenic drives, intimate hotels, and romantic experiences',
            cultural: 'museums, historical sites, art galleries, cultural events, architectural highlights, and local traditions',
            hidden: 'off-the-beaten-path locations, local secrets, hidden viewpoints, authentic experiences, and lesser-known attractions',
            family: 'family-friendly activities, kid-safe attractions, playgrounds, family restaurants, and educational experiences'
        };
        
        const themeDescription = themePrompts[theme] || themePrompts.balanced;
        
        const prompt = `Create a ${theme}-themed guide for this route: ${cityNames}.
        
        Focus specifically on ${themeDescription}.
        
        For each city, provide:
        - Top 2-3 ${theme}-focused activities or attractions
        - Practical details (times, costs, age requirements if applicable)
        - Pro tips for the best experience
        - What makes each recommendation special for ${theme} travelers
        
        Make it specific and actionable for someone planning a ${theme}-focused trip.`;
        
        return await this.callPerplexityAPI(prompt);
    }
}

// Create singleton instance for global use
export const aiFeatures = new AIFeatures();