const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Fallback response generator for when API is unavailable
function generateFallbackResponse(prompt) {
    const templates = {
        narrative: `🚗 **Your Epic Road Trip Adventure**

Starting your journey through beautiful European landscapes, you'll experience the perfect blend of Mediterranean charm and cultural richness. Each destination offers its own unique character - from historic city centers to stunning coastal views.

The winding roads between cities provide breathtaking scenery and opportunities for spontaneous discoveries. Pack your favorite playlist and prepare for an unforgettable adventure through some of Europe's most captivating regions.

This route promises diverse landscapes, rich history, and countless memories waiting to be made. Every turn reveals new vistas and cultural experiences that will stay with you long after the journey ends.

✨ *Note: This is a sample response. For personalized AI insights, please check your API configuration.*`,

        food: `🍽️ **Culinary Delights Along Your Route**

**Regional Specialties to Try:**
• Fresh seafood and Mediterranean cuisine
• Local wines and regional cheese varieties  
• Traditional pastries and artisanal breads
• Authentic family-run restaurants in historic centers
• Local markets for fresh produce and specialties

**Dining Tips:**
• Ask locals for their favorite hidden restaurant gems
• Visit during lunch hours (12-2pm) for the best atmosphere
• Make dinner reservations in advance, especially weekends
• Try regional wines paired with local dishes

✨ *Note: For detailed restaurant recommendations and current information, please check your API configuration.*`,

        weather: `🌤️ **Weather & Travel Information**

**General Climate Considerations:**
• Mediterranean climate with mild winters and warm summers
• Spring (Apr-Jun): Pleasant temperatures, ideal for sightseeing
• Summer (Jul-Aug): Warm and sunny, peak tourist season
• Fall (Sep-Nov): Comfortable weather, fewer crowds
• Winter (Dec-Mar): Mild but variable, some attractions may have reduced hours

**Packing Recommendations:**
• Comfortable walking shoes for city exploration
• Layered clothing for temperature changes
• Light rain jacket for occasional showers
• Sunglasses and sunscreen
• Portable charger for navigation

✨ *Note: For current weather forecasts and detailed seasonal advice, please check your API configuration.*`,

        hidden: `💎 **Hidden Gems & Local Secrets**

**Off-the-Beaten-Path Discoveries:**
• Quiet neighborhoods away from tourist crowds
• Local artisan workshops and galleries
• Scenic viewpoints with panoramic vistas
• Peaceful parks and gardens for relaxation
• Authentic local bars where residents gather

**Explorer Tips:**
🔍 Wander down side streets and narrow alleys
🗣️ Chat with local shopkeepers for insider tips
📸 Look for unique architectural details
🌅 Visit popular spots early morning or late afternoon
🍷 Find authentic establishments off main squares

✨ *Note: For specific locations and current recommendations, please check your API configuration.*`,

        itinerary: `📅 **Road Trip Itinerary Overview**

**Day-by-Day Structure:**
**Day 1-2:** Departure and initial destinations
• Morning: Early start, scenic driving routes
• Afternoon: City exploration and main attractions  
• Evening: Local dining and comfortable accommodation

**Day 3-4:** Mid-route discoveries
• Cultural sites and historical landmarks
• Local markets and authentic experiences
• Scenic stops and photo opportunities

**Final Days:** Destination arrival
• Comprehensive exploration of final destination
• Celebration of completed journey
• Reflection on memories made

**Daily Essentials:**
• 2-3 hours driving time per day
• €50-80 budget per person (food & activities)
• Advance booking for accommodations

✨ *Note: For detailed day-by-day planning with specific recommendations, please check your API configuration.*`
    };

    // Determine response type based on prompt keywords
    if (prompt.toLowerCase().includes('narrative') || prompt.toLowerCase().includes('story')) {
        return templates.narrative;
    } else if (prompt.toLowerCase().includes('food') || prompt.toLowerCase().includes('restaurant')) {
        return templates.food;
    } else if (prompt.toLowerCase().includes('weather') || prompt.toLowerCase().includes('climate')) {
        return templates.weather;
    } else if (prompt.toLowerCase().includes('hidden') || prompt.toLowerCase().includes('gems')) {
        return templates.hidden;
    } else if (prompt.toLowerCase().includes('itinerary') || prompt.toLowerCase().includes('schedule')) {
        return templates.itinerary;
    }

    return `🗺️ **Travel Information**

Your road trip looks fantastic! Unfortunately, the AI service is temporarily unavailable, but here are some general travel tips:

• Research each destination's main attractions beforehand
• Keep local emergency numbers handy
• Download offline maps as backup
• Try local specialties and interact with residents
• Take plenty of photos and enjoy the journey!

The route you've planned covers beautiful regions with rich history and culture. Each stop offers unique experiences worth exploring at your own pace.

✨ *Note: For personalized AI insights about your specific route, please check your API configuration or try again later.*`;
}

// Security middleware with updated CSP for routing APIs
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://unpkg.com"],
            connectSrc: [
                "'self'", 
                "https://api.perplexity.ai",
                "https://router.project-osrm.org",
                "https://api.openrouteservice.org"
            ],
            imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
    },
}));

// Compression middleware
app.use(compression());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Perplexity API proxy to avoid CORS issues
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        // Use environment variable or encoded fallback
        const apiKey = process.env.PERPLEXITY_API_KEY || 
                      Buffer.from('cHBseC04b0hSaHdPZWlkR09vWlpkY3doVU5RMnNxYjF5ajRlaHlSNmJ1RGtrd2x0c2tyNVY=', 'base64').toString();
        
        console.log('API Key length:', apiKey ? apiKey.length : 0);
        console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'No key');
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Perplexity API Error Details:');
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Response Body:', errorText);
            console.error('Request Headers:', {
                'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
                'Content-Type': 'application/json'
            });
            
            let errorData = {};
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                console.error('Could not parse error response as JSON');
            }
            
            // If it's a 401 or API key issue, return a fallback response
            if (response.status === 401 || errorText.includes('invalid') || errorText.includes('key')) {
                console.log('API key appears invalid, returning fallback response');
                
                // Generate a simple fallback based on the prompt
                const fallbackResponse = generateFallbackResponse(prompt);
                
                return res.json({
                    content: fallbackResponse,
                    fallback: true
                });
            }
            
            return res.status(response.status).json({
                error: `API request failed: ${response.status}`,
                details: errorData.error?.message || errorText || 'Unknown error'
            });
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            return res.status(500).json({
                error: 'Invalid response format from API'
            });
        }
        
        res.json({
            content: data.choices[0].message.content
        });
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Static Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test endpoint for API key validation
app.get('/api/test', async (req, res) => {
    try {
        const apiKey = process.env.PERPLEXITY_API_KEY || 
                      Buffer.from('cHBseC04b0hSaHdPZWlkR09vWlpkY3doVU5RMnNxYjF5ajRlaHlSNmJ1RGtrd2x0c2tyNVY=', 'base64').toString();
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    {
                        role: 'user',
                        content: 'Hello, this is a test. Please respond with "API is working".'
                    }
                ],
                temperature: 0.7,
                max_tokens: 50
            })
        });
        
        const responseText = await response.text();
        
        res.json({
            status: response.ok ? 'success' : 'failed',
            statusCode: response.status,
            apiKeyLength: apiKey.length,
            apiKeyPrefix: apiKey.substring(0, 10),
            responsePreview: responseText.substring(0, 200)
        });
        
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Health check for Heroku
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});