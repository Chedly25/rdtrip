const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
// For demo purposes - in production, get your own key from https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'lEwczWVNzGvFAp1BtKgfV5KOtJrFbMdaDFEfL4Z6qHQ';

// AI Agent configurations
const agents = {
  adventure: {
    name: "Adventure Agent",
    color: "#34C759",
    prompt: "You are an adventure travel expert. Create a route with CITIES (not specific attractions) that are gateways to outdoor activities, hiking, mountains, and nature. Each waypoint must be a CITY NAME like 'Chamonix' or 'Interlaken', not 'Mont Blanc' or 'Jungfrau'. List activities as things to do IN that city."
  },
  culture: {
    name: "Culture Agent",
    color: "#FFD60A",
    prompt: "You are a cultural travel expert. Create a route with CITIES (not specific monuments) rich in history, art, and culture. Each waypoint must be a CITY NAME like 'Florence' or 'Avignon', not 'Uffizi Gallery' or 'Papal Palace'. List cultural sites as things to see IN that city."
  },
  food: {
    name: "Food Agent",
    color: "#FF3B30",
    prompt: "You are a culinary travel expert. Create a route with CITIES (not specific restaurants) known for their food scene. Each waypoint must be a CITY NAME like 'Lyon' or 'San Sebastian', not specific restaurants or markets. List culinary experiences as things to try IN that city."
  },
  hidden: {
    name: "Hidden Gems Agent",
    color: "#9333ea",
    prompt: "You are a hidden gems travel expert. Create a route with LESSER-KNOWN CITIES that have authentic charm, character, and local flavor but are not famous tourist destinations. Focus on charming small towns, overlooked villages, and underrated cities. For example: L'Isle-sur-la-Sorgue instead of Avignon, Pienza instead of Florence, or Guimarães instead of Porto. Each waypoint must be a CITY NAME that tourists typically miss. Explain what makes each place special and worth the detour - unique local markets, artisan workshops, architectural gems, natural beauty, or authentic local life."
  }
};

// Generate route with AI agents
app.post('/api/generate-route', async (req, res) => {
  try {
    const { destination, stops = 3, agents: selectedAgents = ['adventure', 'culture', 'food'], budget = 'budget' } = req.body;
    
    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Process with selected agents
    const agentPromises = selectedAgents.map(agentType => 
      queryPerplexity(agents[agentType], destination, stops, budget)
    );

    const agentResults = await Promise.all(agentPromises);
    
    // Combine results
    const route = {
      origin: "Aix-en-Provence, France",
      destination: destination,
      totalStops: stops,
      budget: budget,
      agentResults: agentResults.map((result, index) => ({
        agent: selectedAgents[index],
        recommendations: result
      }))
    };

    res.json(route);
  } catch (error) {
    console.error('Route generation error:', error);
    res.status(500).json({ error: 'Failed to generate route' });
  }
});

// Get hotels and restaurants for a city
app.post('/api/get-hotels-restaurants', async (req, res) => {
  try {
    const { city, budget = 'mid', preferences = {} } = req.body;

    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    console.log(`Fetching hotels and restaurants for ${city} with budget ${budget}`);

    const results = await Promise.all([
      getHotelsForCity(city, budget, preferences),
      getRestaurantsForCity(city, budget, preferences),
      getCityImages(city)
    ]);

    const [hotels, restaurants, images] = results;

    res.json({
      city,
      hotels,
      restaurants,
      images
    });

  } catch (error) {
    console.error('Error fetching hotels and restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch hotels and restaurants' });
  }
});

// Generate detailed day-by-day itinerary
app.post('/api/generate-itinerary', async (req, res) => {
  try {
    const { agent, origin, destination, waypoints } = req.body;
    
    if (!agent || !origin || !destination) {
      return res.status(400).json({ error: 'Agent, origin, and destination are required' });
    }

    const agentConfig = agents[agent];
    if (!agentConfig) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }

    const itinerary = await generateDetailedItinerary(agentConfig, origin, destination, waypoints);
    
    res.json({
      agent: agent,
      origin: origin,
      destination: destination,
      itinerary: itinerary
    });
  } catch (error) {
    console.error('Itinerary generation error:', error);
    res.status(500).json({ error: 'Failed to generate itinerary' });
  }
});

async function generateDetailedItinerary(agent, origin, destination, waypoints) {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const waypointNames = waypoints ? waypoints.map(w => w.name).join(', ') : '';
      
      const prompt = `${agent.prompt}

Create a detailed day-by-day itinerary for a road trip from ${origin} to ${destination}.
${waypoints && waypoints.length > 0 ? `Include these waypoints: ${waypointNames}` : ''}

Provide a JSON response with:
- days: array of daily plans
- each day should have:
  - day: day number
  - location: main city/area for the day
  - activities: array of timed activities (with time, title, description)
  - accommodation: suggested place to stay
  - meals: breakfast, lunch, dinner recommendations  
  - travel: driving details if moving to next location

Focus on providing detailed, practical travel information and specific recommendations.

Make it detailed and practical with specific times and recommendations.`;

      console.log(`Attempt ${attempt}/${maxRetries} - Generating itinerary for ${agent.name}`);

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log(`Successfully generated itinerary for ${agent.name} on attempt ${attempt}`);
      return response.data.choices[0].message.content;
      
    } catch (error) {
      const status = error.response?.status;
      const statusText = error.response?.statusText || error.message;
      
      console.error(`Attempt ${attempt}/${maxRetries} failed for ${agent.name}:`, {
        status,
        statusText,
        data: error.response?.data
      });
      
      // If this is the last attempt, return a fallback
      if (attempt === maxRetries) {
        console.error(`All ${maxRetries} attempts failed for ${agent.name}`);
        
        // Return a fallback itinerary
        return JSON.stringify({
          days: [
            {
              day: 1,
              location: origin,
              activities: [
                {
                  time: "09:00",
                  title: "Start your journey",
                  description: `Begin your ${agent.name.toLowerCase()} adventure from ${origin}`
                },
                {
                  time: "12:00", 
                  title: "Lunch break",
                  description: "Stop for a local meal along the route"
                }
              ],
              accommodation: "Local hotel or accommodation",
              meals: {
                breakfast: "Hotel breakfast",
                lunch: "Local restaurant",
                dinner: "Regional cuisine"
              }
            },
            {
              day: 2,
              location: destination,
              activities: [
                {
                  time: "10:00",
                  title: "Explore destination",
                  description: `Discover the highlights of ${destination}`
                }
              ],
              accommodation: "Destination accommodation",
              meals: {
                breakfast: "Local café",
                lunch: "City center restaurant", 
                dinner: "Traditional local cuisine"
              }
            }
          ]
        });
      }
      
      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

// Helper function to get hotels for a city
async function getHotelsForCity(city, budget, preferences) {
  const budgetMap = {
    budget: '€-€€',
    mid: '€€-€€€',
    luxury: '€€€-€€€€'
  };

  const budgetRange = budgetMap[budget] || '€€-€€€';

  const prompt = `Find the top 5 hotels in ${city} with ${budgetRange} price range.

  Return ONLY a JSON array with this exact structure:
  [
    {
      "name": "Hotel Name",
      "stars": 4,
      "priceRange": "${budgetRange}",
      "pricePerNight": "€120-180",
      "distance": "0.5km from city center",
      "amenities": ["WiFi", "Breakfast", "Parking"],
      "highlights": "Brief description of why this hotel stands out",
      "bookingUrl": "https://booking.com/hotel/...",
      "address": "Hotel address"
    }
  ]

  Focus on: location, value for money, guest ratings, and unique features. Include direct booking links when available.`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let result = response.data.choices[0].message.content;

    // Clean up the response - remove markdown formatting
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const hotels = JSON.parse(result);

      // Add images to each hotel
      const hotelsWithImages = await Promise.all(
        hotels.map(async (hotel) => {
          const image = await getHotelImage(hotel.name, city, hotel.stars);
          return { ...hotel, image };
        })
      );

      return hotelsWithImages;
    } catch (parseError) {
      console.warn('Failed to parse hotels JSON, returning fallback');
      const fallbackImage = await getHotelImage(`${city} Hotel`, city, 3);
      return [{
        name: `${city} Hotel`,
        stars: 3,
        priceRange: budgetRange,
        pricePerNight: "€80-120",
        distance: "City center",
        amenities: ["WiFi", "Reception"],
        highlights: "Comfortable stay in the heart of the city",
        bookingUrl: "#",
        address: `${city} city center`,
        image: fallbackImage
      }];
    }
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return [];
  }
}

// Helper function to get restaurants for a city
async function getRestaurantsForCity(city, budget, preferences) {
  const budgetMap = {
    budget: '€-€€',
    mid: '€€-€€€',
    luxury: '€€€-€€€€'
  };

  const budgetRange = budgetMap[budget] || '€€-€€€';

  const prompt = `Find the top 5 restaurants in ${city} with ${budgetRange} price range.

  Return ONLY a JSON array with this exact structure:
  [
    {
      "name": "Restaurant Name",
      "cuisine": "Italian",
      "priceRange": "${budgetRange}",
      "avgPrice": "€25-40 per person",
      "mustTry": ["Signature dish 1", "Signature dish 2"],
      "atmosphere": "Casual/Fine dining/Family-friendly",
      "openingHours": "12:00-22:00",
      "specialFeatures": "Outdoor seating, Local ingredients, etc.",
      "reservationUrl": "https://...",
      "address": "Restaurant address"
    }
  ]

  Include a mix of local specialties, international cuisine, and different price points within the range.`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let result = response.data.choices[0].message.content;

    // Clean up the response
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const restaurants = JSON.parse(result);

      // Add images to each restaurant
      const restaurantsWithImages = await Promise.all(
        restaurants.map(async (restaurant) => {
          const image = await getRestaurantImage(restaurant.name, restaurant.cuisine);
          return { ...restaurant, image };
        })
      );

      return restaurantsWithImages;
    } catch (parseError) {
      console.warn('Failed to parse restaurants JSON, returning fallback');
      const fallbackImage = await getRestaurantImage(`${city} Restaurant`, 'Local');
      return [{
        name: `${city} Restaurant`,
        cuisine: "Local",
        priceRange: budgetRange,
        avgPrice: "€20-35 per person",
        mustTry: ["Local specialty"],
        atmosphere: "Casual",
        openingHours: "12:00-22:00",
        specialFeatures: "Traditional cuisine",
        reservationUrl: "#",
        address: `${city} city center`,
        image: fallbackImage
      }];
    }
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
}

// Helper function to get hotel images from Unsplash
async function getHotelImage(hotelName, city, stars = 3) {
  try {
    // Create search terms based on hotel quality
    let searchTerms = ['hotel'];

    if (stars >= 4) {
      searchTerms.push('luxury', 'elegant', 'boutique');
    } else if (stars === 3) {
      searchTerms.push('modern', 'comfortable');
    } else {
      searchTerms.push('budget', 'cozy');
    }

    searchTerms.push('lobby', 'interior', 'room');

    const query = searchTerms.join(' ');

    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        per_page: 1,
        orientation: 'landscape',
        content_filter: 'high'
      },
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const photo = response.data.results[0];
      return {
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        alt: photo.alt_description || `${hotelName} - Hotel`,
        photographer: photo.user.name,
        source: 'Unsplash'
      };
    }
  } catch (error) {
    console.warn('Error fetching hotel image from Unsplash:', error.message);
  }

  // Fallback to placeholder
  return {
    url: `https://via.placeholder.com/400x300/4A90E2/white?text=🏨+Hotel`,
    thumb: `https://via.placeholder.com/200x150/4A90E2/white?text=🏨`,
    alt: `${hotelName} - Hotel`,
    photographer: 'Placeholder',
    source: 'Placeholder'
  };
}

// Helper function to get restaurant images from Unsplash
async function getRestaurantImage(restaurantName, cuisine = 'restaurant') {
  try {
    // Create search terms based on cuisine type
    let searchTerms = [];

    const cuisineMap = {
      'italian': ['italian food', 'pasta', 'pizza', 'trattoria'],
      'french': ['french cuisine', 'bistro', 'fine dining', 'brasserie'],
      'asian': ['asian cuisine', 'sushi', 'ramen', 'asian restaurant'],
      'mexican': ['mexican food', 'tacos', 'mexican restaurant'],
      'indian': ['indian food', 'curry', 'indian restaurant'],
      'mediterranean': ['mediterranean food', 'greek', 'mezze'],
      'seafood': ['seafood restaurant', 'fish', 'oysters'],
      'steakhouse': ['steakhouse', 'grill', 'meat'],
      'cafe': ['cafe', 'coffee shop', 'pastries'],
      'bakery': ['bakery', 'bread', 'pastries']
    };

    const cuisineLower = cuisine.toLowerCase();
    const matchedCuisine = Object.keys(cuisineMap).find(key =>
      cuisineLower.includes(key) || key.includes(cuisineLower)
    );

    if (matchedCuisine) {
      searchTerms = [...cuisineMap[matchedCuisine]];
    } else {
      searchTerms = ['restaurant', 'dining', 'food', 'cuisine'];
    }

    const query = searchTerms.join(' OR ');

    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        per_page: 1,
        orientation: 'landscape',
        content_filter: 'high'
      },
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const photo = response.data.results[0];
      return {
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        alt: photo.alt_description || `${restaurantName} - ${cuisine} Restaurant`,
        photographer: photo.user.name,
        source: 'Unsplash'
      };
    }
  } catch (error) {
    console.warn('Error fetching restaurant image from Unsplash:', error.message);
  }

  // Fallback to placeholder
  return {
    url: `https://via.placeholder.com/400x300/FF6B35/white?text=🍽️+Restaurant`,
    thumb: `https://via.placeholder.com/200x150/FF6B35/white?text=🍽️`,
    alt: `${restaurantName} - Restaurant`,
    photographer: 'Placeholder',
    source: 'Placeholder'
  };
}

// Helper function to get city images from Wikimedia
async function getCityImages(city) {
  try {
    // Search for city images on Wikipedia/Wikimedia Commons
    const searchResponse = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(city));

    const images = [];

    // Get main image from Wikipedia
    if (searchResponse.data.originalimage) {
      images.push({
        url: searchResponse.data.originalimage.source,
        caption: `${city} - Main view`,
        source: 'Wikipedia'
      });
    }

    // If we have the main image, try to get a few more from Wikimedia Commons
    if (images.length > 0) {
      try {
        const commonsSearch = await axios.get(`https://commons.wikimedia.org/w/api.php`, {
          params: {
            action: 'query',
            generator: 'search',
            gsrnamespace: 6,
            gsrsearch: `${city} landscape OR ${city} cityscape OR ${city} architecture`,
            gsrlimit: 3,
            prop: 'imageinfo',
            iiprop: 'url|size',
            iiurlwidth: 800,
            format: 'json'
          }
        });

        if (commonsSearch.data.query && commonsSearch.data.query.pages) {
          Object.values(commonsSearch.data.query.pages).forEach(page => {
            if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].thumburl) {
              images.push({
                url: page.imageinfo[0].thumburl,
                caption: page.title.replace('File:', '').replace(/\.(jpg|png|jpeg)$/i, ''),
                source: 'Wikimedia Commons'
              });
            }
          });
        }
      } catch (commonsError) {
        console.warn('Could not fetch additional images from Commons:', commonsError.message);
      }
    }

    return images.slice(0, 4); // Limit to 4 images
  } catch (error) {
    console.error('Error fetching city images:', error);
    return [{
      url: 'https://via.placeholder.com/800x400?text=' + encodeURIComponent(city),
      caption: `${city} - Image not available`,
      source: 'Placeholder'
    }];
  }
}

async function queryPerplexity(agent, destination, stops, budget = 'budget') {
  try {
    const budgetDescriptions = {
      budget: 'budget-friendly options, affordable accommodations, free or low-cost activities, local food markets',
      moderate: 'mid-range accommodations, mix of free and paid activities, local restaurants and cafes',
      comfort: 'comfortable hotels, paid attractions and activities, nice restaurants and dining experiences',
      luxury: 'luxury hotels and resorts, premium experiences, fine dining, exclusive activities'
    };
    
    const budgetContext = budgetDescriptions[budget] || budgetDescriptions.budget;
    
    const prompt = `${agent.prompt}

Create a road trip from Aix-en-Provence to ${destination} with ${stops} CITY stops.

BUDGET: ${budgetContext}

CRITICAL RULES:
1. Each waypoint MUST be a CITY or TOWN name only
2. Do NOT use attraction names as waypoints
3. Examples of CORRECT names: "Grenoble", "Annecy", "Lyon"
4. Examples of WRONG names: "Pont du Gard", "Mont Blanc", "Louvre Museum"

Return ONLY valid JSON (no extra text before or after):
{
  "waypoints": [
    {
      "name": "CITY_NAME",
      "coordinates": [longitude, latitude],
      "description": "Why this city is great for ${agent.name.toLowerCase()}",
      "activities": ["activity 1", "activity 2", "activity 3"],
      "duration": "1-2 days"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no extra text.`;

    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(`Error with ${agent.name}:`, error.response?.data || error.message);
    return `Error generating recommendations for ${agent.name}`;
  }
}

// Chat endpoint for AI assistant
app.post('/api/chat', async (req, res) => {
  try {
    const { message, routeContext } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create context from route data
    let contextInfo = '';
    if (routeContext) {
      contextInfo = `
      
Route Context:
- Origin: ${routeContext.origin}
- Destination: ${routeContext.destination}
- Budget: ${routeContext.budget}
- Stops: ${routeContext.totalStops}
- Selected agents: ${routeContext.agentResults.map(ar => ar.agent).join(', ')}

Previous recommendations:
${routeContext.agentResults.map(ar => `${ar.agent}: ${ar.recommendations.substring(0, 200)}...`).join('\n')}`;
    }

    const prompt = `You are a helpful travel assistant specializing in road trips from Aix-en-Provence, France. 
    
You provide practical travel advice, local tips, budget information, and route suggestions. Be conversational, helpful, and specific.

${contextInfo}

User question: ${message}

Provide a helpful, concise response (2-3 paragraphs maximum) that directly addresses the user's question.`;

    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    res.json({
      response: response.data.choices[0].message.content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get chat response',
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

// Simplified image endpoint - no external validation
app.get('/api/image-info', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  // Simple URL validation without external calls
  try {
    new URL(url);
    res.json({ 
      valid: true, 
      url: url,
      message: 'URL format is valid'
    });
  } catch {
    res.status(400).json({ 
      valid: false, 
      error: 'Invalid URL format'
    });
  }
});

// Simple placeholder image service - no external API calls
app.get('/api/location-image/:location', (req, res) => {
  const { location } = req.params;
  const { agent = 'adventure' } = req.query;
  
  // Simple placeholder that doesn't make external API calls
  const imageId = Math.abs(location.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 1000;
  const placeholderUrl = `https://picsum.photos/400/300?random=${imageId}`;
  
  res.json({
    url: placeholderUrl,
    location: location,
    agent: agent
  });
});

// Generate Mapbox static image for route overview
app.post('/api/mapbox-image', async (req, res) => {
  try {
    const { waypoints, destination, width = 800, height = 400 } = req.body;
    
    if (!waypoints || !destination) {
      return res.status(400).json({ error: 'Waypoints and destination are required' });
    }

    // Create markers for Mapbox Static API
    const markers = [];
    
    // Add origin marker (Aix-en-Provence)
    markers.push('pin-s-a+007AFF(5.4474,43.5297)');
    
    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      if (waypoint.lng && waypoint.lat) {
        const markerColor = getAgentColor(waypoint.agent || 'adventure');
        markers.push(`pin-s-${index + 1}+${markerColor}(${waypoint.lng},${waypoint.lat})`);
      }
    });
    
    // Add destination marker (you'd need to geocode the destination)
    // For now, we'll create a basic map with waypoints
    
    const mapboxToken = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';
    const markersString = markers.join(',');
    const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markersString}/auto/${width}x${height}@2x?access_token=${mapboxToken}`;
    
    res.json({
      success: true,
      mapUrl: mapboxUrl,
      width: width,
      height: height
    });

  } catch (error) {
    console.error('Mapbox image error:', error);
    res.status(500).json({ error: 'Failed to generate map image' });
  }
});

function getAgentColor(agent) {
  const colors = {
    adventure: '34C759',
    culture: 'FF9500', 
    food: 'FF3B30'
  };
  return colors[agent] || '34C759';
}

// Fallback image service - returns placeholder images
app.get('/api/placeholder-image', (req, res) => {
  const { type = 'location', width = 400, height = 300 } = req.query;
  
  // Use a reliable placeholder service
  const placeholderUrl = `https://picsum.photos/${width}/${height}?random=${Math.floor(Math.random() * 1000)}`;
  
  res.json({
    url: placeholderUrl,
    type: type,
    width: parseInt(width),
    height: parseInt(height)
  });
});

app.listen(PORT, () => {
  console.log(`🚗 Road Trip Planner MVP running on port ${PORT}`);
});