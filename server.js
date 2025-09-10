const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple caching system
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCacheKey(prompt) {
    return Buffer.from(prompt.toLowerCase().trim()).toString('base64').substring(0, 50);
}

function getCachedResponse(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    cache.delete(key);
    return null;
}

function cacheResponse(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

// Request queue for API rate limiting
class RequestQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.lastRequestTime = 0;
        this.minDelay = 1000; // 1 second between requests (reduced from 2)
    }
    
    async add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.process();
        });
    }
    
    async process() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        
        while (this.queue.length > 0) {
            const { requestFn, resolve, reject } = this.queue.shift();
            
            // Ensure minimum delay between requests
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.minDelay) {
                await new Promise(r => setTimeout(r, this.minDelay - timeSinceLastRequest));
            }
            
            try {
                const result = await requestFn();
                this.lastRequestTime = Date.now();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }
        
        this.processing = false;
    }
}

const perplexityQueue = new RequestQueue();

// Enhanced API call with better error handling and logging
async function makePerplexityRequest(prompt, apiKey, retryCount = 0) {
    const maxRetries = 3;
    const baseDelay = 1500;
    
    console.log(`Making Perplexity request (attempt ${retryCount + 1}/${maxRetries + 1})`);
    console.log(`Prompt length: ${prompt.length} characters`);
    
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'RoadTripPlanner/1.0'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a knowledgeable travel expert. Provide detailed and accurate travel advice.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                top_p: 0.9,
                stream: false
            })
        });
        
        console.log(`Perplexity response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`Perplexity API Error ${response.status}:`, errorText);
            
            // Log more details about the error
            console.error(`Request headers:`, {
                'Authorization': `Bearer ${apiKey.substring(0, 10)}...`,
                'Content-Type': 'application/json'
            });
            
            // If it's a rate limit or server error, retry with exponential backoff
            if ((response.status === 503 || response.status === 429 || response.status >= 500) && retryCount < maxRetries) {
                const delay = baseDelay * Math.pow(2, retryCount);
                console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
                await new Promise(r => setTimeout(r, delay));
                return makePerplexityRequest(prompt, apiKey, retryCount + 1);
            }
            
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from Perplexity API');
        }
        
        console.log('Perplexity request successful!');
        console.log(`Response length: ${data.choices[0].message.content.length} characters`);
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('Error in makePerplexityRequest:', error.message);
        console.error('Error stack:', error.stack);
        
        if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount);
            console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(r => setTimeout(r, delay));
            return makePerplexityRequest(prompt, apiKey, retryCount + 1);
        }
        throw error;
    }
}

// Simplified fallback response generator
function generateFallbackResponse(prompt) {
    const fallbackResponses = {
        adventure: "🏔️ Adventure Route: Aix-en-Provence to Venice\n\nThis scenic route takes you through the French Riviera and Italian Riviera, offering breathtaking mountain views, coastal drives, and charming medieval villages. Expect diverse landscapes from lavender fields to Alpine passes.\n\nHighlights:\n• Dramatic mountain passes with panoramic views\n• Coastal roads along the Mediterranean\n• Historic villages and local markets\n• Outdoor activities: hiking, cycling, water sports\n\nNote: This is a fallback response. For real-time AI insights, please try again.",
        
        romantic: "💕 Romantic Journey: Aix-en-Provence to Venice\n\nA perfect route for couples, combining the charm of Provence with the magic of Venice. Enjoy intimate dinners, sunset views, and romantic walks through historic city centers.\n\nPerfect for:\n• Candlelit dinners with local wine\n• Sunset views over the Mediterranean\n• Romantic gondola rides in Venice\n• Cozy boutique hotels and B&Bs\n\nNote: This is a fallback response. For personalized recommendations, please try again.",
        
        cultural: "🏛️ Cultural Discovery: Aix-en-Provence to Venice\n\nA journey through centuries of art, architecture, and history. From Roman ruins to Renaissance masterpieces, this route offers rich cultural experiences at every stop.\n\nCultural Highlights:\n• Museums and art galleries\n• Historical architecture and monuments\n• Local festivals and traditions\n• Artisan workshops and cultural sites\n\nNote: This is a fallback response. For detailed cultural insights, please try again.",
        
        foodie: "🍽️ Culinary Adventure: Aix-en-Provence to Venice\n\nExperience the finest flavors of Southern France and Northern Italy. From Provençal markets to Venetian cicchetti, discover regional specialties and hidden culinary gems.\n\nCulinary Experiences:\n• Local markets and food tours\n• Wine tastings in renowned regions\n• Traditional restaurants and local specialties\n• Cooking classes with local chefs\n\nNote: This is a fallback response. For current restaurant recommendations, please try again.",
        
        family: "👨‍👩‍👧‍👦 Family-Friendly Route: Aix-en-Provence to Venice\n\nDesigned for families with children, featuring activities and attractions suitable for all ages, comfortable accommodations, and manageable driving distances.\n\nFamily Features:\n• Kid-friendly attractions and activities\n• Safe, family-oriented accommodations\n• Interactive museums and parks\n• Beach access and outdoor activities\n\nNote: This is a fallback response. For current family activities, please try again.",
        
        luxury: "✨ Luxury Experience: Aix-en-Provence to Venice\n\nIndulge in the finest accommodations, exclusive experiences, and personalized services. From 5-star hotels to private tours, enjoy the ultimate in comfort and elegance.\n\nLuxury Elements:\n• Premium hotels and resorts\n• Private tours and exclusive access\n• Fine dining at Michelin-starred restaurants\n• Luxury transportation and concierge services\n\nNote: This is a fallback response. For exclusive luxury recommendations, please try again."
    };
    
    // Determine response type based on prompt keywords
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes('adventure') || promptLower.includes('outdoor')) return fallbackResponses.adventure;
    if (promptLower.includes('romantic') || promptLower.includes('couple')) return fallbackResponses.romantic;
    if (promptLower.includes('cultural') || promptLower.includes('history')) return fallbackResponses.cultural;
    if (promptLower.includes('food') || promptLower.includes('culinary')) return fallbackResponses.foodie;
    if (promptLower.includes('family') || promptLower.includes('children')) return fallbackResponses.family;
    if (promptLower.includes('luxury') || promptLower.includes('premium')) return fallbackResponses.luxury;
    
    return fallbackResponses.adventure; // Default fallback
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://unpkg.com"],
            connectSrc: ["'self'", "https://api.perplexity.ai"],
            imgSrc: ["'self'", "data:", "https://*"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://r2cdn.perplexity.ai"],
        },
    },
}));

app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

// Perplexity API proxy with queue and retry logic
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        // Check cache first
        const cacheKey = getCacheKey(prompt);
        const cachedResponse = getCachedResponse(cacheKey);
        if (cachedResponse) {
            console.log('Returning cached response');
            return res.json(cachedResponse);
        }
        
        // Use environment variable or encoded fallback
        let apiKey = process.env.PERPLEXITY_API_KEY;
        
        // If no environment variable, use the encoded fallback
        if (!apiKey || apiKey.trim() === '') {
            console.log('Using fallback API key');
            apiKey = Buffer.from('cHBseC1QY1VsOUFLUlFiYkZRZm15clM4OEUxcVowZld0VlBucVV1ajAwT0w0cWVJQllzdDEK', 'base64').toString().trim();
        } else {
            console.log('Using environment API key');
        }
        
        // Validate API key format
        if (!apiKey || apiKey.length < 10) {
            console.error('Invalid API key format');
            return res.status(500).json({ error: 'Invalid API key configuration' });
        }
        
        console.log(`API key length: ${apiKey.length}`);
        console.log(`Making queued API request for prompt: ${prompt.substring(0, 100)}...`);
        
        console.log(`Making queued API request for prompt: ${prompt.substring(0, 100)}...`);
        
        try {
            console.log('Starting API request processing');
            // Use the queue to ensure proper rate limiting
            const content = await Promise.race([
                perplexityQueue.add(() => makePerplexityRequest(prompt, apiKey)),
                new Promise((_, reject) => {
                    console.log('Setting up timeout for API request');
                    return setTimeout(() => {
                        console.log('API request timeout reached');
                        reject(new Error('Server timeout - using fallback'));
                    }, 12000);
                })
            ]);
            
            console.log('API request completed successfully');
            // Cache successful response
            const response = { content };
            cacheResponse(cacheKey, response);
            console.log('API request successful, returning response');
            console.log(`Response length: ${content ? content.length : 0} characters`);
            res.json(response);
            
        } catch (apiError) {
            console.error('API request failed after all retries:', apiError.message);
            
            // Return fallback response
            const fallbackContent = generateFallbackResponse(prompt);
            const fallbackResponse = { content: fallbackContent };
            console.log('Returning fallback response');
            res.json(fallbackResponse);
        }
        
    } catch (error) {
        console.error('Server error:', error);
        
        // Return fallback even for server errors
        const fallbackContent = generateFallbackResponse(req.body?.prompt || '');
        res.json({ content: fallbackContent });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        queue_size: perplexityQueue.queue.length,
        cache_size: cache.size
    });
});

// Static routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Request queue initialized');
    console.log('Cache system active');
});  
} 
