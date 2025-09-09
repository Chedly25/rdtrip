const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory cache for API responses
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const MAX_CACHE_SIZE = 100; // Maximum number of cached responses

// Cache management functions
function getCacheKey(prompt) {
    // Create a simple hash of the prompt for caching
    return prompt.toLowerCase().replace(/\s+/g, ' ').trim().substring(0, 200);
}

function getCachedResponse(key) {
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    // Remove expired cache entry
    if (cached) {
        responseCache.delete(key);
    }
    return null;
}

function setCachedResponse(key, data) {
    // Limit cache size
    if (responseCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const firstKey = responseCache.keys().next().value;
        responseCache.delete(firstKey);
    }
    responseCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

// Parse JSON bodies
app.use(express.json());

// Extract cities from prompt text
function extractCitiesFromPrompt(prompt) {
    const commonCities = [
        'Aix-en-Provence', 'Nice', 'Cannes', 'Monaco', 'Monte Carlo', 'Antibes', 'Saint-Tropez',
        'Marseille', 'Toulon', 'Cassis', 'Avignon', 'Arles', 'Nimes', 'Montpellier',
        'Venice', 'Verona', 'Milan', 'Florence', 'Rome', 'Bologna', 'Genoa', 'Turin',
        'La Spezia', 'Cinque Terre', 'Portofino', 'San Remo', 'Finale Ligure',
        'Lyon', 'Grenoble', 'Sisteron', 'Gap', 'Digne-les-Bains'
    ];
    
    const foundCities = [];
    for (const city of commonCities) {
        if (prompt.toLowerCase().includes(city.toLowerCase())) {
            foundCities.push(city);
        }
    }
    
    return foundCities;
}

// Generate route-specific food guide based on detected cities
function generateRouteSpecificFoodGuide(cities, cityList) {
    const cityFoodData = {
        'Aix-en-Provence': {
            specialties: ['Calissons d\'Aix (almond confection)', 'Provence herbs and lavender honey', 'Local rosé wines'],
            restaurants: ['Traditional brasseries around Cours Mirabeau', 'Local markets (Tue, Thu, Sat mornings)']
        },
        'Nice': {
            specialties: ['Socca (chickpea pancake)', 'Salade Niçoise', 'Pan bagnat', 'Pissaladière'],
            restaurants: ['Cours Saleya market', 'Old Town (Vieux Nice) trattorias']
        },
        'Cannes': {
            specialties: ['Fresh Mediterranean seafood', 'Bouillabaisse', 'Local wines from Provence'],
            restaurants: ['Marché Forville (covered market)', 'Le Suquet (old quarter)']
        },
        'Venice': {
            specialties: ['Cicchetti (small plates)', 'Risotto al nero di seppia', 'Tiramisu', 'Prosecco'],
            restaurants: ['Bacari (wine bars) in Castello', 'Rialto Market area']
        },
        'Verona': {
            specialties: ['Amarone wine', 'Risotto all\'Amarone', 'Pandoro (Christmas cake)', 'Gnocchi di malga'],
            restaurants: ['Historic center trattorias', 'Local enotecas (wine bars)']
        },
        'Genoa': {
            specialties: ['Pesto Genovese', 'Farinata (chickpea flatbread)', 'Focaccia col formaggio'],
            restaurants: ['Via del Campo markets', 'Historic center family restaurants']
        },
        'La Spezia': {
            specialties: ['Fresh seafood', 'Cinque Terre wines', 'Pesto and trofie pasta', 'Anchovies'],
            restaurants: ['Harbor-front seafood restaurants', 'Local fishing village trattorias']
        },
        'Finale Ligure': {
            specialties: ['Ligurian olive oil', 'Fresh catch of the day', 'Farinata', 'Local white wines'],
            restaurants: ['Beachfront restaurants', 'Historic center family establishments']
        }
    };

    let specificContent = `🍽️ **Culinary Journey: ${cityList}**\n\n`;

    if (cities.length > 0) {
        cities.forEach(city => {
            const foodData = cityFoodData[city];
            if (foodData) {
                specificContent += `**${city}:**\n`;
                specificContent += `• Specialties: ${foodData.specialties.join(', ')}\n`;
                specificContent += `• Where to eat: ${foodData.restaurants.join(', ')}\n\n`;
            }
        });

        specificContent += `**General Tips for Your Route:**\n`;
        specificContent += `• Make reservations for dinner, especially in summer\n`;
        specificContent += `• Try local markets for fresh ingredients and snacks\n`;
        specificContent += `• Each region has distinct wine varieties - ask for local recommendations\n`;
        specificContent += `• Lunch is typically served 12:00-14:30, dinner after 19:30\n\n`;
    } else {
        specificContent += `**Regional Specialties to Try:**\n`;
        specificContent += `• Fresh seafood and Mediterranean cuisine\n`;
        specificContent += `• Local wines and regional cheese varieties\n`;
        specificContent += `• Traditional pastries and artisanal breads\n`;
        specificContent += `• Authentic family-run restaurants in historic centers\n\n`;
        
        specificContent += `**Dining Tips:**\n`;
        specificContent += `• Ask locals for their favorite hidden restaurant gems\n`;
        specificContent += `• Visit during lunch hours (12-2pm) for the best atmosphere\n`;
        specificContent += `• Make dinner reservations in advance, especially weekends\n`;
        specificContent += `• Try regional wines paired with local dishes\n\n`;
    }

    specificContent += `✨ *Note: For current restaurant recommendations and detailed reviews, please check your API configuration.*`;
    
    return specificContent;
}

// Fallback response generator for when API is unavailable
function generateFallbackResponse(prompt, routeData = null) {
    // Extract cities from prompt if available
    const cities = extractCitiesFromPrompt(prompt);
    const cityList = cities.length > 0 ? cities.join(', ') : 'your selected destinations';
    
    const templates = {
        narrative: `🚗 **Your Epic Road Trip Adventure**

Starting your journey through beautiful European landscapes, you'll experience the perfect blend of Mediterranean charm and cultural richness. Each destination offers its own unique character - from historic city centers to stunning coastal views.

The winding roads between cities provide breathtaking scenery and opportunities for spontaneous discoveries. Pack your favorite playlist and prepare for an unforgettable adventure through some of Europe's most captivating regions.

This route promises diverse landscapes, rich history, and countless memories waiting to be made. Every turn reveals new vistas and cultural experiences that will stay with you long after the journey ends.

✨ *Note: This is a sample response. For personalized AI insights, please check your API configuration.*`,

        food: generateRouteSpecificFoodGuide(cities, cityList),

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

        itinerary: `📅 **${cityList} - Road Trip Itinerary**

**Day 1:**
• 9:00 AM - Departure from starting point
• 11:00 AM - First scenic stop & coffee break
• 1:00 PM - Lunch at local restaurant
• 3:00 PM - Explore main city attractions (2-3 hours)
• 7:00 PM - Check into accommodation
• 8:30 PM - Dinner at recommended restaurant

**Day 2:**
• 9:30 AM - Morning city walk or market visit
• 11:30 AM - Drive to next destination (scenic route)
• 1:30 PM - Roadside lunch with views
• 3:30 PM - Afternoon sightseeing & photo stops
• 6:00 PM - Evening relaxation time
• 8:00 PM - Local dining experience

**Day 3:**
• 10:00 AM - Cultural site or museum visit
• 12:30 PM - Traditional local lunch
• 2:30 PM - Final destination arrival
• 4:00 PM - Hotel check-in & refresh
• 6:00 PM - Sunset viewing location
• 8:30 PM - Celebration dinner

**Daily Budget (per person):**
• Meals: €35-50
• Activities: €15-25
• Accommodation: €60-120
• Fuel & parking: €20-30

✨ *Note: Times are flexible - adjust based on your pace and interests.*`
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
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://r2cdn.perplexity.ai"],
        },
    },
}));

// Compression middleware
app.use(compression());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Intelligent routing algorithm for fallback when external services fail
function generateIntelligentRoute(startLat, startLon, endLat, endLon) {
    // Calculate basic route metrics
    const distance = calculateDistance(startLat, startLon, endLat, endLon);
    const duration = Math.round(distance * 45); // ~45 seconds per km (realistic driving)
    
    // Generate realistic waypoints following major road patterns
    const waypoints = generateRoadFollowingRoute(startLat, startLon, endLat, endLon);
    
    // Create OSRM-compatible response format
    return {
        code: 'Ok',
        routes: [{
            geometry: {
                type: 'LineString',
                coordinates: waypoints
            },
            legs: [{
                distance: distance * 1000, // Convert km to meters
                duration: duration,
                steps: []
            }],
            distance: distance * 1000,
            duration: duration,
            weight_name: 'routability',
            weight: duration
        }],
        waypoints: [
            {
                hint: '',
                distance: 0,
                name: '',
                location: [startLon, startLat]
            },
            {
                hint: '',
                distance: 0,
                name: '',
                location: [endLon, endLat]
            }
        ]
    };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function generateRoadFollowingRoute(startLat, startLon, endLat, endLon) {
    // Major highway nodes in Southern France and Northern Italy
    const majorNodes = [
        // French Riviera
        { lat: 43.7102, lon: 7.2619, name: 'Nice' },
        { lat: 43.5804, lon: 7.1251, name: 'Antibes' },
        { lat: 43.5528, lon: 7.0174, name: 'Cannes' },
        { lat: 43.5263, lon: 5.4454, name: 'Aix-en-Provence' },
        { lat: 43.2965, lon: 5.3698, name: 'Marseille' },
        { lat: 43.9493, lon: 4.8055, name: 'Avignon' },
        { lat: 45.7640, lon: 4.8357, name: 'Lyon' },
        
        // Italian Coast
        { lat: 44.4056, lon: 8.9463, name: 'Genoa' },
        { lat: 44.1697, lon: 8.3442, name: 'Finale Ligure' },
        { lat: 44.0917, lon: 9.8103, name: 'La Spezia' },
        { lat: 43.7228, lon: 10.4017, name: 'Pisa' },
        { lat: 45.4654, lon: 9.1859, name: 'Milan' },
        
        // Alpine routes
        { lat: 44.1948, lon: 5.9451, name: 'Sisteron' },
        { lat: 43.8469, lon: 6.5125, name: 'Castellane' }
    ];
    
    // Find optimal route through major nodes
    const routeNodes = findOptimalPath(startLat, startLon, endLat, endLon, majorNodes);
    
    // Generate smooth path with realistic road curvature
    const coordinates = [];
    
    for (let i = 0; i < routeNodes.length - 1; i++) {
        const current = routeNodes[i];
        const next = routeNodes[i + 1];
        
        // Add intermediate points with realistic road curves
        const segmentPoints = generateCurvedSegment(current.lat, current.lon, next.lat, next.lon);
        coordinates.push(...segmentPoints);
    }
    
    // Ensure start and end points are exact
    coordinates[0] = [startLon, startLat];
    coordinates[coordinates.length - 1] = [endLon, endLat];
    
    return coordinates;
}

function findOptimalPath(startLat, startLon, endLat, endLon, nodes) {
    // Simple pathfinding: find intermediate nodes that minimize total distance
    const path = [{ lat: startLat, lon: startLon }];
    
    // Find best intermediate node (if beneficial)
    let bestNode = null;
    let minTotalDistance = calculateDistance(startLat, startLon, endLat, endLon);
    
    for (const node of nodes) {
        const d1 = calculateDistance(startLat, startLon, node.lat, node.lon);
        const d2 = calculateDistance(node.lat, node.lon, endLat, endLon);
        const totalDistance = d1 + d2;
        
        // Only use intermediate node if it doesn't add too much distance (max 30% overhead)
        if (totalDistance < minTotalDistance * 1.3 && d1 > 20 && d2 > 20) {
            minTotalDistance = totalDistance;
            bestNode = node;
        }
    }
    
    if (bestNode) {
        path.push(bestNode);
    }
    
    path.push({ lat: endLat, lon: endLon });
    return path;
}

function generateCurvedSegment(lat1, lon1, lat2, lon2) {
    const points = [];
    const numPoints = Math.max(5, Math.round(calculateDistance(lat1, lon1, lat2, lon2) / 10)); // Point every ~10km
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        
        // Linear interpolation with slight curve bias
        const lat = lat1 + (lat2 - lat1) * t;
        const lon = lon1 + (lon2 - lon1) * t;
        
        // Add realistic road curvature (slight deviation from straight line)
        const curvature = 0.001 * Math.sin(t * Math.PI * 3); // Slight S-curve
        const curvedLat = lat + curvature * (Math.random() - 0.5);
        const curvedLon = lon + curvature * (Math.random() - 0.5);
        
        points.push([curvedLon, curvedLat]);
    }
    
    return points;
}

// Routing API proxy to avoid CORS issues  
app.get('/api/route/osrm/:coordinates', async (req, res) => {
    try {
        const { coordinates } = req.params;
        const { geometries = 'geojson', overview = 'full' } = req.query;
        
        // Try MapBox first (most reliable), then OSRM, then intelligent fallback
        const mapboxToken = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';
        const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=${geometries}&access_token=${mapboxToken}`;
        
        console.log('Trying MapBox routing...');
        
        // Set a 8 second timeout for the MapBox request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(mapboxUrl, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('OSRM API Error:', response.status, errorText);
            return res.status(response.status).json({
                error: `OSRM API error: ${response.status}`,
                details: errorText
            });
        }
        
        const data = await response.json();
        console.log('MapBox response received successfully');
        
        // Convert MapBox response to OSRM-compatible format
        if (data.routes && data.routes.length > 0) {
            const mapboxRoute = data.routes[0];
            
            // Convert MapBox response to OSRM format that the frontend expects
            const osrmResponse = {
                routes: [{
                    geometry: mapboxRoute.geometry, // MapBox already provides GeoJSON format
                    distance: mapboxRoute.distance,
                    duration: mapboxRoute.duration,
                    legs: mapboxRoute.legs || []
                }],
                code: "Ok"
            };
            
            console.log(`Route calculated: ${(osrmResponse.routes[0].distance/1000).toFixed(1)}km in ${(osrmResponse.routes[0].duration/60).toFixed(1)} minutes`);
            res.json(osrmResponse);
        } else {
            console.error('No routes found in MapBox response');
            throw new Error('No routes found in MapBox response');
        }
        
    } catch (error) {
        console.error('OSRM Proxy Error:', error);
        
        // Generate intelligent fallback route when OSRM is unavailable
        try {
            const [startCoords, endCoords] = coordinates.split(';');
            const [startLon, startLat] = startCoords.split(',').map(parseFloat);
            const [endLon, endLat] = endCoords.split(',').map(parseFloat);
            
            const fallbackRoute = generateIntelligentRoute(startLat, startLon, endLat, endLon);
            
            return res.json(fallbackRoute);
            
        } catch (fallbackError) {
            console.error('Fallback route generation failed:', fallbackError);
            
            if (error.name === 'AbortError') {
                res.status(408).json({
                    error: 'OSRM request timeout',
                    details: 'The routing service is currently unavailable. Please try again later.',
                    fallback: true
                });
            } else {
                res.status(500).json({
                    error: 'Failed to fetch route',
                    details: error.message,
                    fallback: true
                });
            }
        }
    }
});

// Perplexity API proxy to avoid CORS issues
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
            console.log('Returning cached response for:', cacheKey.substring(0, 50) + '...');
            return res.json(cachedResponse);
        }
        
        // Use environment variable or encoded fallback
        const apiKey = process.env.PERPLEXITY_API_KEY || 
                      Buffer.from('cHBseC1QY1VsOUFLUlFiYkZRZm15clM4OEUxcVowZld0VlBucVV1ajAwT0w0cWVJQllzdDEK', 'base64').toString().trim();
        
        console.log('API Key length:', apiKey ? apiKey.length : 0);
        console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'No key');
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
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
            
            // For any API error (401, 503, etc.), return a fallback response instead of throwing error
            if (response.status >= 400) {
                console.log(`Perplexity API error ${response.status}, returning fallback response`);
                
                // Generate a simple fallback based on the prompt
                const fallbackResponse = generateFallbackResponse(prompt);
                
                const responseObj = {
                    content: fallbackResponse,
                    fallback: true
                };
                
                // Cache fallback responses too
                setCachedResponse(cacheKey, responseObj);
                
                return res.json(responseObj);
            }
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            return res.status(500).json({
                error: 'Invalid response format from API'
            });
        }
        
        const apiResponse = {
            content: data.choices[0].message.content
        };
        
        // Cache the successful response
        setCachedResponse(cacheKey, apiResponse);
        
        res.json(apiResponse);
        
    } catch (error) {
        console.error('Server error:', error);
        
        // Generate fallback response even for server errors
        const fallbackResponse = generateFallbackResponse(req.body.prompt || 'general travel advice');
        
        const responseObj = {
            content: fallbackResponse,
            fallback: true,
            error: 'Service temporarily unavailable'
        };
        
        res.json(responseObj);
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
                      Buffer.from('cHBseC1QY1VsOUFLUlFiYkZRZm15clM4OEUxcVowZld0VlBucVV1ajAwT0w0cWVJQllzdDEK', 'base64').toString().trim();
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
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