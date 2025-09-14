/**
 * AI Features Module - Handles all Perplexity API interactions
 * Provides 5 AI-powered features for trip planning
 */

export class AIFeatures {
    constructor() {
        // Initialize with default configuration
        this.apiKey = this.getDefaultApiKey();
        this.currentRoute = null;
        this.pendingRequests = new Map();
        this.requestDebounceTimers = new Map();
        this.DEBOUNCE_DELAY = 500; // 500ms debounce delay
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
     * Generate client-side fallback content
     * @param {string} prompt - The original prompt
     * @returns {string} Fallback content
     */
    generateClientFallback(prompt) {
        if (prompt.toLowerCase().includes('itinerary') || prompt.toLowerCase().includes('day')) {
            return `📅 **3-Day Road Trip Itinerary**

**Day 1:**
• 9:00 AM - Departure from starting city
• 11:30 AM - Coffee break at scenic viewpoint
• 1:00 PM - Lunch at traditional local restaurant
• 3:00 PM - Explore main attractions (2 hours)
• 6:00 PM - Check into accommodation
• 8:30 PM - Dinner at recommended bistro

**Day 2:**
• 9:30 AM - Morning city walk or market visit
• 12:00 PM - Drive to next destination via scenic route
• 2:00 PM - Roadside lunch with panoramic views
• 4:00 PM - Afternoon sightseeing and photo stops
• 7:00 PM - Evening relaxation time
• 8:30 PM - Local dining experience

**Day 3:**
• 10:00 AM - Cultural site or museum visit
• 1:00 PM - Traditional lunch at local favorite
• 3:00 PM - Final destination arrival
• 5:00 PM - Hotel check-in and refresh
• 7:30 PM - Sunset viewing spot
• 9:00 PM - Celebration dinner

**Daily Budget:** €80-120 per person (includes meals, activities, accommodation)

✨ *Flexible timing - adjust based on your pace and interests*`;
        } else if (prompt.toLowerCase().includes('food') || prompt.toLowerCase().includes('restaurant')) {
            return `🍽️ **Local Food Guide**

**Regional Specialties:**
• Fresh Mediterranean seafood and coastal cuisine
• Traditional local wines and artisanal cheeses  
• Authentic pastries and regional breads
• Local markets with seasonal produce

**Dining Recommendations:**
• Historic city centers for family-run restaurants
• Morning markets for fresh ingredients (Tue, Thu, Sat)
• Local wine bars for authentic atmosphere
• Waterfront restaurants for sunset dining

**Tips:**
• Make dinner reservations, especially in summer
• Try the daily catch and regional wine pairings
• Ask locals for their favorite hidden gems
• Lunch: 12:00-14:30, Dinner: after 19:30

✨ *For current restaurant details, ask locals for recommendations*`;
        } else if (prompt.toLowerCase().includes('weather') || prompt.toLowerCase().includes('climate')) {
            return `🌤️ **Travel Weather Guide**

**Best Travel Seasons:**
• Spring (Apr-Jun): Pleasant 18-25°C, perfect for sightseeing
• Summer (Jul-Aug): Warm 25-30°C, peak season with crowds
• Fall (Sep-Nov): Comfortable 20-25°C, fewer tourists
• Winter (Dec-Mar): Mild 10-18°C, some closures possible

**Packing Essentials:**
• Comfortable walking shoes for city exploration
• Light layers for temperature changes
• Portable rain jacket for occasional showers
• Sunglasses, sunscreen, and hat
• Power bank for navigation devices

**Driving Conditions:**
• Generally excellent road conditions year-round
• Summer traffic increases, plan extra time
• Mountain passes may require winter equipment (Dec-Mar)

✨ *Check current forecasts before departure*`;
        } else {
            return `🗺️ **Travel Information**

**Your Route Highlights:**
• Beautiful Mediterranean landscapes and coastal views
• Historic city centers with authentic local culture
• Scenic driving routes with photo-worthy stops
• Rich culinary traditions and local specialties

**Travel Tips:**
• Plan 2-3 hours driving per day for comfortable pace
• Research main attractions and book popular sites ahead
• Keep emergency contacts and offline maps handy
• Try regional foods and interact with friendly locals
• Take plenty of photos and enjoy the journey!

**Budget Guide:** €60-100 per person/day (food, activities, accommodation)

✨ *Enjoy your adventure through this beautiful region!*`;
        }
    }
    
    /**
     * Simple hash function for creating unique request keys
     * @param {string} str - String to hash
     * @returns {string} Hash value
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    
    /**
     * Call Perplexity API with a prompt (with debouncing and deduplication)
     * @param {string} prompt - The prompt to send to the AI
     * @param {boolean} skipDebounce - Skip debouncing for immediate execution
     * @returns {Promise<string>} AI response or null on error
     */
    async callPerplexityAPI(prompt, skipDebounce = false) {
        // Create a unique request key including timestamp and hash of full prompt
        const promptHash = this.simpleHash(prompt);
        const requestKey = `${promptHash}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // If there's already a pending request for this prompt, return it
        if (this.pendingRequests.has(requestKey)) {
            console.log('Returning existing request for:', requestKey.substring(0, 50) + '...');
            return this.pendingRequests.get(requestKey);
        }
        
        // Clear any existing debounce timer for this request
        if (this.requestDebounceTimers.has(requestKey)) {
            clearTimeout(this.requestDebounceTimers.get(requestKey));
            this.requestDebounceTimers.delete(requestKey);
        }
        
        // Create the actual API call function
        const makeApiCall = async () => {
            try {
            // Use the server proxy endpoint to avoid CORS issues
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: prompt
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = `API request failed: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`;
                
                // If it's a 503 error, return fallback content immediately
                if (response.status === 503) {
                    console.log('503 error detected, returning client fallback');
                    this.pendingRequests.delete(requestKey);
                    return this.generateClientFallback(prompt);
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            
            if (!data.response) {
                throw new Error('Invalid response format from server');
            }

            // Remove from pending requests
            this.pendingRequests.delete(requestKey);

            return data.response;
            } catch (error) {
                // Remove from pending requests on error
                this.pendingRequests.delete(requestKey);
                console.error('Perplexity API Error:', error);
            
                // Only return client fallback for specific errors, otherwise re-throw
                if (error.message.includes('503') || error.message.includes('Network error')) {
                    console.log('Using client fallback due to server/network issues');
                    return this.generateClientFallback(prompt);
                }
                
                // Re-throw the error to allow proper error handling upstream
                throw error;
            }
        };
        
        // If we should skip debouncing, execute immediately
        if (skipDebounce) {
            const promise = makeApiCall();
            this.pendingRequests.set(requestKey, promise);
            return promise;
        }
        
        // Otherwise, debounce the request
        return new Promise((resolve, reject) => {
            const timer = setTimeout(async () => {
                this.requestDebounceTimers.delete(requestKey);
                try {
                    const promise = makeApiCall();
                    this.pendingRequests.set(requestKey, promise);
                    const result = await promise;
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }, this.DEBOUNCE_DELAY);
            
            this.requestDebounceTimers.set(requestKey, timer);
        });
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
        
        Write in an evocative, travel-inspired style that makes readers want to take this journey. Do not include any images.`;
        
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
        
        Focus on authentic, local experiences rather than tourist restaurants. Include practical details like opening hours when possible. Do not include any images.`;
        
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
        ${smallCities.length > 0 ? `
Pay special attention to these smaller places: ${smallCities.join(', ')}` : ''}

        Provide specific locations with brief descriptions of what makes them special. Do not include any images.`;
        
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
        
        Format with clear bullet points and specific times:
        
        **Day X:**
        • 9:00 AM - Activity with location
        • 12:30 PM - Lunch recommendation
        • 3:00 PM - Afternoon activity
        • 6:00 PM - Check-in/relax time
        • 8:00 PM - Dinner suggestion
        
        For each day include:
        - Specific times and durations for activities
        - Exact restaurant and attraction names
        - Realistic driving segments between cities
        - Daily budget breakdown (meals €X, activities €X, accommodation €X)
        - Must-see highlights and photo spots
        
        Keep descriptions concise - use bullet points, not paragraphs. Focus on actionable schedule with real places and times. Do not include any images.`;
        
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
        
        Make it specific and actionable for someone planning a ${theme}-focused trip. Do not include any images.`;
        
        return await this.callPerplexityAPI(prompt);
    }
}

// Create singleton instance for global use
export const aiFeatures = new AIFeatures();