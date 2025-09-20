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

// AI Agent configurations with enhanced metrics
const agents = {
  adventure: {
    name: "Adventure Agent",
    color: "#34C759",
    icon: "⛰️",
    prompt: `You are an adventure travel expert. Create a route with CITIES (not specific attractions) that are gateways to outdoor activities, hiking, mountains, and nature. Each waypoint must be a CITY NAME like 'Chamonix' or 'Interlaken', not 'Mont Blanc' or 'Jungfrau'.

For the route, also provide these ADVENTURE METRICS in your response:
- Physical Difficulty: Rate 1-5 (1=easy walks, 5=technical climbing/extreme sports)
- Gear Requirements: "Basic" (comfortable shoes), "Moderate" (hiking boots, layers), or "Extensive" (technical gear, equipment rental needed)
- Weather Dependency: "Low", "Moderate", or "High" (how much weather affects activities)
- Average Outdoor Hours: Number of hours per day spent on outdoor activities
- Equipment Rental Costs: Estimated daily cost range for gear rental if needed

List activities as things to do IN that city with difficulty levels.`,
    metricsExtractor: (response) => ({
      physicalDifficulty: extractRating(response, /Physical Difficulty:?\s*(\d)/i, 3),
      gearRequirement: extractLevel(response, /Gear Requirements?:?\s*(\w+)/i, ["Basic", "Moderate", "Extensive"], "Moderate"),
      weatherDependency: extractLevel(response, /Weather Dependency:?\s*(\w+)/i, ["Low", "Moderate", "High"], "Moderate"),
      outdoorHours: extractNumber(response, /Outdoor Hours:?\s*(\d+)/i, 6),
      equipmentCost: extractRange(response, /Equipment.*Cost:?\s*€?(\d+)-?(\d+)?/i, "€20-50")
    })
  },
  culture: {
    name: "Culture Agent",
    color: "#FFD60A",
    icon: "🏛️",
    prompt: `You are a cultural travel expert. Create a route with CITIES (not specific monuments) rich in history, art, and culture. Each waypoint must be a CITY NAME like 'Florence' or 'Avignon', not 'Uffizi Gallery' or 'Papal Palace'.

For the route, also provide these CULTURE METRICS in your response:
- UNESCO Sites: Total count across the route
- Museum Density: Average museums/cultural sites per day (number)
- Historical Periods: List which periods are covered (Medieval, Renaissance, Modern, etc.)
- Audio Guide Availability: Percentage of sites with audio guides (0-100%)
- Focus Split: Percentage breakdown - Art (%), History (%), Architecture (%) - must total 100%

List cultural sites as things to see IN that city with historical context.`,
    metricsExtractor: (response) => ({
      unescoSites: extractNumber(response, /UNESCO Sites?:?\s*(\d+)/i, 0),
      museumDensity: extractNumber(response, /Museum Density:?\s*(\d+)/i, 3),
      historicalPeriods: extractList(response, /Historical Periods?:?\s*([^.]+)/i, ["Medieval", "Renaissance"]),
      audioGuideAvailability: extractPercentage(response, /Audio Guide.*:?\s*(\d+)%?/i, 70),
      focusSplit: extractFocusSplit(response)
    })
  },
  food: {
    name: "Food Agent",
    color: "#FF3B30",
    icon: "🍽️",
    prompt: `You are a culinary travel expert. Create a route with CITIES (not specific restaurants) known for their food scene. Each waypoint must be a CITY NAME like 'Lyon' or 'San Sebastian', not specific restaurants or markets.

For the route, also provide these FOOD METRICS in your response:
- Michelin Stars: Total count of Michelin-starred restaurants across the route
- Booking Timeline: "Days ahead", "Weeks ahead", or "Months ahead" for popular restaurants
- Price Distribution: Street food (%), Casual dining (%), Fine dining (%) - must total 100%
- Regional Cuisines: Number of distinct regional cuisine types you'll experience
- Experience Types: Count of Markets, Cooking Classes, Tastings, Restaurant visits

List culinary experiences as things to try IN that city with price ranges.`,
    metricsExtractor: (response) => ({
      michelinStars: extractNumber(response, /Michelin Stars?:?\s*(\d+)/i, 0),
      bookingTimeline: extractLevel(response, /Booking.*:?\s*(Days?|Weeks?|Months?)/i, ["Days", "Weeks", "Months"], "Weeks"),
      priceDistribution: extractPriceDistribution(response),
      cuisineTypes: extractNumber(response, /Regional Cuisines?:?\s*(\d+)/i, 3),
      experienceTypes: extractExperienceTypes(response)
    })
  },
  "hidden-gems": {
    name: "Hidden Gems Agent",
    color: "#9333ea",
    icon: "💎",
    prompt: `You are a hidden gems travel expert. Create a route with LESSER-KNOWN CITIES that have authentic charm, character, and local flavor but are not famous tourist destinations. Focus on charming small towns, overlooked villages, and underrated cities.

For the route, also provide these HIDDEN GEMS METRICS in your response:
- Tourist Density: Rate 1-5 (1=completely off beaten path, 5=getting discovered)
- Language Requirement: "None", "Basic", or "Moderate" (local language needed)
- Payment Acceptance: Cash (%) vs Card (%) - must total 100%
- Local Dependency: "Low", "Moderate", or "High" (need for local contacts/guides)
- Transport Access: Public transport (%) vs Car required (%) - must total 100%

Each waypoint must be a CITY NAME that tourists typically miss. Explain what makes each place special.`,
    metricsExtractor: (response) => ({
      touristDensity: extractRating(response, /Tourist Density:?\s*(\d)/i, 2),
      languageRequirement: extractLevel(response, /Language.*:?\s*(\w+)/i, ["None", "Basic", "Moderate"], "Basic"),
      paymentAcceptance: extractPaymentSplit(response),
      localDependency: extractLevel(response, /Local Dependency:?\s*(\w+)/i, ["Low", "Moderate", "High"], "Moderate"),
      transportAccess: extractLevel(response, /Transport Access:?\s*(\w+)/i, ["Low", "Moderate", "High"], "Moderate")
    })
  }
};

// Helper functions for extracting metrics from AI responses
function extractRating(text, pattern, defaultValue) {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : defaultValue;
}

function extractNumber(text, pattern, defaultValue) {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : defaultValue;
}

function extractLevel(text, pattern, levels, defaultValue) {
  const match = text.match(pattern);
  if (match) {
    const value = match[1].trim();
    return levels.find(l => l.toLowerCase() === value.toLowerCase()) || defaultValue;
  }
  return defaultValue;
}

function extractRange(text, pattern, defaultValue) {
  const match = text.match(pattern);
  if (match && match[1]) {
    return match[2] ? `€${match[1]}-${match[2]}` : `€${match[1]}`;
  }
  return defaultValue;
}

function extractPercentage(text, pattern, defaultValue) {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : defaultValue;
}

function extractList(text, pattern, defaultValue) {
  const match = text.match(pattern);
  if (match) {
    return match[1].split(',').map(s => s.trim()).filter(s => s);
  }
  return defaultValue;
}

function extractFocusSplit(text) {
  const artMatch = text.match(/Art:?\s*(\d+)%?/i);
  const historyMatch = text.match(/History:?\s*(\d+)%?/i);
  const architectureMatch = text.match(/Architecture:?\s*(\d+)%?/i);

  let art = artMatch ? parseInt(artMatch[1]) : 30;
  let history = historyMatch ? parseInt(historyMatch[1]) : 40;
  let architecture = architectureMatch ? parseInt(architectureMatch[1]) : 30;

  // Normalize to 100%
  const total = art + history + architecture;
  if (total !== 100) {
    const factor = 100 / total;
    art = Math.round(art * factor);
    history = Math.round(history * factor);
    architecture = Math.round(architecture * factor);
  }

  return { art, history, architecture };
}

function extractPriceDistribution(text) {
  const streetMatch = text.match(/Street.*:?\s*(\d+)%?/i);
  const casualMatch = text.match(/Casual.*:?\s*(\d+)%?/i);
  const fineMatch = text.match(/Fine.*:?\s*(\d+)%?/i);

  let street = streetMatch ? parseInt(streetMatch[1]) : 30;
  let casual = casualMatch ? parseInt(casualMatch[1]) : 50;
  let fine = fineMatch ? parseInt(fineMatch[1]) : 20;

  // Normalize to 100%
  const total = street + casual + fine;
  if (total !== 100) {
    const factor = 100 / total;
    street = Math.round(street * factor);
    casual = Math.round(casual * factor);
    fine = Math.round(fine * factor);
  }

  return { street, casual, fine };
}

function extractExperienceTypes(text) {
  // Look for percentages in the text, or default to reasonable distribution
  const marketsMatch = text.match(/Markets?:?\s*(\d+)%?/i);
  const classesMatch = text.match(/Classes?:?\s*(\d+)%?/i);
  const tastingsMatch = text.match(/Tastings?:?\s*(\d+)%?/i);
  const diningMatch = text.match(/Dining:?\s*(\d+)%?/i);

  // Return percentages that make sense for food experiences
  return {
    dining: diningMatch ? parseInt(diningMatch[1]) : 60,
    markets: marketsMatch ? parseInt(marketsMatch[1]) : 25,
    classes: classesMatch ? parseInt(classesMatch[1]) : 15
  };
}

function extractPaymentSplit(text) {
  const cashMatch = text.match(/Cash:?\s*(\d+)%?/i);
  const cardMatch = text.match(/Card:?\s*(\d+)%?/i);

  let cash = cashMatch ? parseInt(cashMatch[1]) : 60;
  let card = cardMatch ? parseInt(cardMatch[1]) : 40;

  // Normalize to 100%
  const total = cash + card;
  if (total !== 100) {
    const factor = 100 / total;
    cash = Math.round(cash * factor);
    card = Math.round(card * factor);
  }

  return { cash, card };
}

function extractTransportSplit(text) {
  const publicMatch = text.match(/Public.*:?\s*(\d+)%?/i);
  const carMatch = text.match(/Car.*:?\s*(\d+)%?/i);

  let publicTransport = publicMatch ? parseInt(publicMatch[1]) : 40;
  let car = carMatch ? parseInt(carMatch[1]) : 60;

  // Normalize to 100%
  const total = publicTransport + car;
  if (total !== 100) {
    const factor = 100 / total;
    publicTransport = Math.round(publicTransport * factor);
    car = Math.round(car * factor);
  }

  return { publicTransport, car };
}

// Generate route with AI agents
app.post('/api/generate-route', async (req, res) => {
  try {
    const { destination, stops = 3, agents: selectedAgents = ['adventure', 'culture', 'food'], budget = 'budget' } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Process with selected agents
    const agentPromises = selectedAgents.map(agentType =>
      queryPerplexityWithMetrics(agents[agentType], destination, stops, budget)
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
        agentConfig: {
          name: agents[selectedAgents[index]].name,
          color: agents[selectedAgents[index]].color,
          icon: agents[selectedAgents[index]].icon
        },
        recommendations: result.recommendations,
        metrics: result.metrics
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
        max_tokens: 10000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 120 second timeout
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
    url: `https://via.placeholder.com/400x300/4A90E2/white?text=Hotel`,
    thumb: `https://via.placeholder.com/200x150/4A90E2/white?text=Hotel`,
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

async function queryPerplexityWithMetrics(agent, destination, stops, budget = 'budget') {
  const responseText = await queryPerplexity(agent, destination, stops, budget);

  // Extract metrics from the response
  const metrics = agent.metricsExtractor ? agent.metricsExtractor(responseText) : {};

  return {
    recommendations: responseText,
    metrics: metrics
  };
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

// European Landmarks Database
const europeanLandmarks = [
  // France
  {
    id: 1,
    name: "Eiffel Tower",
    type: "monument",
    lat: 48.8584,
    lng: 2.2945,
    country: "France",
    city: "Paris",
    icon_type: "tower",
    description: "Iconic iron lattice tower and symbol of Paris",
    image_url: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 2,
    name: "Mont Saint-Michel",
    type: "historic",
    lat: 48.6361,
    lng: -1.5115,
    country: "France",
    city: "Normandy",
    icon_type: "castle",
    description: "Medieval abbey perched on a tidal island",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.8,
    visit_duration: 180
  },
  // Italy
  {
    id: 3,
    name: "Colosseum",
    type: "historic",
    lat: 41.8902,
    lng: 12.4922,
    country: "Italy",
    city: "Rome",
    icon_type: "amphitheater",
    description: "Ancient Roman amphitheater and architectural marvel",
    image_url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500",
    rating: 4.5,
    visit_duration: 150
  },
  {
    id: 4,
    name: "Leaning Tower of Pisa",
    type: "monument",
    lat: 43.7230,
    lng: 10.3966,
    country: "Italy",
    city: "Pisa",
    icon_type: "tower",
    description: "Famous tilted bell tower",
    image_url: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=500",
    rating: 4.3,
    visit_duration: 90
  },
  // Spain
  {
    id: 5,
    name: "Sagrada Familia",
    type: "cultural",
    lat: 41.4036,
    lng: 2.1744,
    country: "Spain",
    city: "Barcelona",
    icon_type: "cathedral",
    description: "Gaudí's unfinished masterpiece basilica",
    image_url: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=500",
    rating: 4.7,
    visit_duration: 120
  },
  {
    id: 6,
    name: "Alhambra",
    type: "historic",
    lat: 37.1760,
    lng: -3.5881,
    country: "Spain",
    city: "Granada",
    icon_type: "palace",
    description: "Moorish palace and fortress complex",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.8,
    visit_duration: 240
  },
  // Germany
  {
    id: 7,
    name: "Neuschwanstein Castle",
    type: "historic",
    lat: 47.5576,
    lng: 10.7498,
    country: "Germany",
    city: "Bavaria",
    icon_type: "castle",
    description: "Fairy-tale castle in the Bavarian Alps",
    image_url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  {
    id: 8,
    name: "Brandenburg Gate",
    type: "monument",
    lat: 52.5163,
    lng: 13.3777,
    country: "Germany",
    city: "Berlin",
    icon_type: "gate",
    description: "Iconic neoclassical monument",
    image_url: "https://images.unsplash.com/photo-1587330979470-3d86d9d4d8be?w=500",
    rating: 4.4,
    visit_duration: 60
  },
  // UK
  {
    id: 9,
    name: "Tower Bridge",
    type: "monument",
    lat: 51.5055,
    lng: -0.0754,
    country: "United Kingdom",
    city: "London",
    icon_type: "bridge",
    description: "Victorian bascule bridge over the Thames",
    image_url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500",
    rating: 4.5,
    visit_duration: 90
  },
  {
    id: 10,
    name: "Stonehenge",
    type: "historic",
    lat: 51.1789,
    lng: -1.8262,
    country: "United Kingdom",
    city: "Salisbury",
    icon_type: "monument",
    description: "Prehistoric stone circle",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.2,
    visit_duration: 120
  },
  // Switzerland
  {
    id: 11,
    name: "Matterhorn",
    type: "natural",
    lat: 45.9763,
    lng: 7.6586,
    country: "Switzerland",
    city: "Zermatt",
    icon_type: "mountain",
    description: "Iconic pyramid-shaped peak in the Alps",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
    rating: 4.9,
    visit_duration: 300
  },
  // Greece
  {
    id: 12,
    name: "Acropolis of Athens",
    type: "historic",
    lat: 37.9715,
    lng: 23.7267,
    country: "Greece",
    city: "Athens",
    icon_type: "temple",
    description: "Ancient citadel with the Parthenon",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  // Portugal
  {
    id: 13,
    name: "Jerónimos Monastery",
    type: "cultural",
    lat: 38.6979,
    lng: -9.2065,
    country: "Portugal",
    city: "Lisbon",
    icon_type: "monastery",
    description: "Manueline architectural masterpiece",
    image_url: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=500",
    rating: 4.5,
    visit_duration: 120
  },
  // Netherlands
  {
    id: 14,
    name: "Kinderdijk Windmills",
    type: "cultural",
    lat: 51.8839,
    lng: 4.6389,
    country: "Netherlands",
    city: "Kinderdijk",
    icon_type: "windmill",
    description: "Historic windmill complex",
    image_url: "https://images.unsplash.com/photo-1580996787472-b4a3c685b1f2?w=500",
    rating: 4.4,
    visit_duration: 150
  },
  // Austria
  {
    id: 15,
    name: "Hallstatt",
    type: "natural",
    lat: 47.5622,
    lng: 13.6493,
    country: "Austria",
    city: "Hallstatt",
    icon_type: "village",
    description: "Picturesque lakeside village",
    image_url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=500",
    rating: 4.7,
    visit_duration: 240
  },
  // France - Additional landmarks
  {
    id: 16,
    name: "Arc de Triomphe",
    type: "monument",
    lat: 48.8738,
    lng: 2.2950,
    country: "France",
    city: "Paris",
    icon_type: "arch",
    description: "Triumphal arch at the center of Place Charles de Gaulle",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.5,
    visit_duration: 90
  },
  {
    id: 17,
    name: "Notre Dame",
    type: "cultural",
    lat: 48.8530,
    lng: 2.3499,
    country: "France",
    city: "Paris",
    icon_type: "cathedral",
    description: "Medieval Catholic cathedral and masterpiece of Gothic architecture",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 18,
    name: "Palace of Versailles",
    type: "historic",
    lat: 48.8049,
    lng: 2.1204,
    country: "France",
    city: "Versailles",
    icon_type: "palace",
    description: "Opulent royal palace and gardens",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 300
  },
  // UK - Additional landmarks
  {
    id: 19,
    name: "Big Ben",
    type: "monument",
    lat: 51.4994,
    lng: -0.1245,
    country: "United Kingdom",
    city: "London",
    icon_type: "clock",
    description: "Iconic clock tower of the Palace of Westminster",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.5,
    visit_duration: 60
  },
  {
    id: 20,
    name: "Edinburgh Castle",
    type: "historic",
    lat: 55.9486,
    lng: -3.1999,
    country: "United Kingdom",
    city: "Edinburgh",
    icon_type: "castle",
    description: "Historic fortress dominating Edinburgh's skyline",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  // Italy - Additional landmarks
  {
    id: 21,
    name: "Trevi Fountain",
    type: "monument",
    lat: 41.9009,
    lng: 12.4833,
    country: "Italy",
    city: "Rome",
    icon_type: "fountain",
    description: "Baroque fountain and one of Rome's most famous landmarks",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.4,
    visit_duration: 45
  },
  {
    id: 22,
    name: "St. Mark's Basilica",
    type: "cultural",
    lat: 45.4345,
    lng: 12.3403,
    country: "Italy",
    city: "Venice",
    icon_type: "cathedral",
    description: "Byzantine cathedral with stunning mosaics",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 23,
    name: "Duomo di Milano",
    type: "cultural",
    lat: 45.4642,
    lng: 9.1900,
    country: "Italy",
    city: "Milan",
    icon_type: "cathedral",
    description: "Gothic cathedral with elaborate spires and stunning facade",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 150
  },
  {
    id: 24,
    name: "St. Peter's Basilica",
    type: "cultural",
    lat: 41.9022,
    lng: 12.4539,
    country: "Vatican City",
    city: "Vatican City",
    icon_type: "cathedral",
    description: "Renaissance basilica and papal residence",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.8,
    visit_duration: 180
  },
  // Greece - Additional landmarks
  {
    id: 25,
    name: "Parthenon",
    type: "historic",
    lat: 37.9715,
    lng: 23.7267,
    country: "Greece",
    city: "Athens",
    icon_type: "temple",
    description: "Ancient temple dedicated to Athena on the Acropolis",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 120
  },
  // Czech Republic
  {
    id: 26,
    name: "Charles Bridge",
    type: "historic",
    lat: 50.0865,
    lng: 14.4114,
    country: "Czech Republic",
    city: "Prague",
    icon_type: "bridge",
    description: "Historic stone bridge adorned with baroque statues",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 90
  },
  // Germany - Additional landmarks
  {
    id: 27,
    name: "Cologne Cathedral",
    type: "cultural",
    lat: 50.9413,
    lng: 6.9583,
    country: "Germany",
    city: "Cologne",
    icon_type: "cathedral",
    description: "Gothic cathedral and UNESCO World Heritage site",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  // Belgium
  {
    id: 28,
    name: "Atomium",
    type: "monument",
    lat: 50.8950,
    lng: 4.3414,
    country: "Belgium",
    city: "Brussels",
    icon_type: "structure",
    description: "Unique building representing an iron crystal magnified 165 billion times",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.3,
    visit_duration: 120
  },
  // Denmark
  {
    id: 29,
    name: "The Little Mermaid",
    type: "monument",
    lat: 55.6929,
    lng: 12.5993,
    country: "Denmark",
    city: "Copenhagen",
    icon_type: "statue",
    description: "Bronze statue inspired by Hans Christian Andersen's fairy tale",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 3.8,
    visit_duration: 30
  },
  // Norway
  {
    id: 30,
    name: "Geirangerfjord",
    type: "natural",
    lat: 62.1049,
    lng: 7.0062,
    country: "Norway",
    city: "Geiranger",
    icon_type: "fjord",
    description: "UNESCO World Heritage fjord with dramatic waterfalls",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.9,
    visit_duration: 240
  },
  // Ireland
  {
    id: 31,
    name: "Cliffs of Moher",
    type: "natural",
    lat: 52.9715,
    lng: -9.4309,
    country: "Ireland",
    city: "County Clare",
    icon_type: "cliffs",
    description: "Dramatic sea cliffs rising 214 meters above the Atlantic Ocean",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 180
  },
  // Portugal - Additional landmarks
  {
    id: 32,
    name: "Pena Palace",
    type: "historic",
    lat: 38.7877,
    lng: -9.3906,
    country: "Portugal",
    city: "Sintra",
    icon_type: "palace",
    description: "Romantic palace with colorful architecture in Sintra mountains",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  // Austria - Additional landmarks
  {
    id: 33,
    name: "Schönbrunn Palace",
    type: "historic",
    lat: 48.1849,
    lng: 16.3123,
    country: "Austria",
    city: "Vienna",
    icon_type: "palace",
    description: "Imperial palace with baroque architecture and gardens",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 240
  },
  // Russia
  {
    id: 34,
    name: "St. Basil's Cathedral",
    type: "cultural",
    lat: 55.7525,
    lng: 37.6231,
    country: "Russia",
    city: "Moscow",
    icon_type: "cathedral",
    description: "Iconic onion-domed cathedral in Red Square",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 120
  },

  // Additional landmarks with custom images
  {
    id: 16,
    name: "Duomo di Milano",
    type: "cultural",
    lat: 45.4642,
    lng: 9.1900,
    country: "Italy",
    city: "Milan",
    icon_type: "cathedral",
    description: "Gothic cathedral with elaborate spires and stunning facade",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 150
  },
  {
    id: 17,
    name: "Notre-Dame de Paris",
    type: "cultural",
    lat: 48.8530,
    lng: 2.3499,
    country: "France",
    city: "Paris",
    icon_type: "cathedral",
    description: "Medieval Catholic cathedral on the Île de la Cité",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 18,
    name: "Trevi Fountain",
    type: "monument",
    lat: 41.9009,
    lng: 12.4833,
    country: "Italy",
    city: "Rome",
    icon_type: "fountain",
    description: "Baroque fountain and one of Rome's most famous landmarks",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.4,
    visit_duration: 45
  },
  {
    id: 19,
    name: "St. Mark's Basilica",
    type: "cultural",
    lat: 45.4345,
    lng: 12.3398,
    country: "Italy",
    city: "Venice",
    icon_type: "cathedral",
    description: "Byzantine cathedral with stunning mosaics",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 20,
    name: "Charles Bridge",
    type: "monument",
    lat: 50.0865,
    lng: 14.4114,
    country: "Czech Republic",
    city: "Prague",
    icon_type: "bridge",
    description: "Historic stone bridge connecting Prague's Old and New Towns",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.5,
    visit_duration: 60
  },
  {
    id: 21,
    name: "Cologne Cathedral",
    type: "cultural",
    lat: 50.9413,
    lng: 6.9583,
    country: "Germany",
    city: "Cologne",
    icon_type: "cathedral",
    description: "Gothic cathedral and UNESCO World Heritage Site",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 22,
    name: "Edinburgh Castle",
    type: "historic",
    lat: 55.9486,
    lng: -3.1999,
    country: "United Kingdom",
    city: "Edinburgh",
    icon_type: "castle",
    description: "Historic fortress dominating Edinburgh's skyline",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.5,
    visit_duration: 180
  },
  {
    id: 23,
    name: "Big Ben",
    type: "monument",
    lat: 51.4994,
    lng: -0.1245,
    country: "United Kingdom",
    city: "London",
    icon_type: "clock",
    description: "Iconic clock tower at the Palace of Westminster",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.4,
    visit_duration: 60
  },
  {
    id: 24,
    name: "Schönbrunn Palace",
    type: "historic",
    lat: 48.1847,
    lng: 16.3119,
    country: "Austria",
    city: "Vienna",
    icon_type: "palace",
    description: "Imperial summer palace with baroque gardens",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  {
    id: 25,
    name: "Atomium",
    type: "monument",
    lat: 50.8950,
    lng: 4.3415,
    country: "Belgium",
    city: "Brussels",
    icon_type: "structure",
    description: "Iconic building representing an iron crystal magnified 165 billion times",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.2,
    visit_duration: 90
  },
  {
    id: 26,
    name: "Little Mermaid",
    type: "monument",
    lat: 55.6930,
    lng: 12.5993,
    country: "Denmark",
    city: "Copenhagen",
    icon_type: "statue",
    description: "Bronze statue commemorating Hans Christian Andersen's fairy tale",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 3.8,
    visit_duration: 30
  },
  {
    id: 27,
    name: "Pena Palace",
    type: "historic",
    lat: 38.7876,
    lng: -9.3906,
    country: "Portugal",
    city: "Sintra",
    icon_type: "palace",
    description: "Romantic palace with eclectic architectural styles",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 150
  },
  {
    id: 28,
    name: "Cliffs of Moher",
    type: "natural",
    lat: 52.9715,
    lng: -9.4265,
    country: "Ireland",
    city: "County Clare",
    icon_type: "cliff",
    description: "Spectacular sea cliffs rising 214m from the Atlantic Ocean",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 120
  },
  {
    id: 29,
    name: "Geirangerfjord",
    type: "natural",
    lat: 62.1049,
    lng: 7.0045,
    country: "Norway",
    city: "Geiranger",
    icon_type: "fjord",
    description: "UNESCO World Heritage fjord with dramatic waterfalls",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.8,
    visit_duration: 240
  },
  {
    id: 30,
    name: "Parthenon",
    type: "historic",
    lat: 37.9715,
    lng: 23.7267,
    country: "Greece",
    city: "Athens",
    icon_type: "temple",
    description: "Ancient temple dedicated to the goddess Athena",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 90
  }
];

// Get landmarks within a bounding box (for map region)
app.get('/api/landmarks/region', (req, res) => {
  try {
    const { north, south, east, west, type } = req.query;

    let filtered = europeanLandmarks;

    // Filter by bounding box if provided
    if (north && south && east && west) {
      filtered = filtered.filter(landmark =>
        landmark.lat <= parseFloat(north) &&
        landmark.lat >= parseFloat(south) &&
        landmark.lng >= parseFloat(west) &&
        landmark.lng <= parseFloat(east)
      );
    }

    // Filter by type if provided
    if (type && type !== 'all') {
      filtered = filtered.filter(landmark => landmark.type === type);
    }

    res.json({
      success: true,
      landmarks: filtered,
      count: filtered.length
    });

  } catch (error) {
    console.error('Error fetching landmarks:', error);
    res.status(500).json({ error: 'Failed to fetch landmarks' });
  }
});

// Get all landmark types for filtering
app.get('/api/landmarks/types', (req, res) => {
  try {
    const types = [...new Set(europeanLandmarks.map(landmark => landmark.type))];
    res.json({
      success: true,
      types: types
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch landmark types' });
  }
});

// Recalculate route with added landmark
app.post('/api/route/add-landmark', async (req, res) => {
  try {
    const { originalRoute, landmarkId, insertIndex } = req.body;

    if (!originalRoute || !landmarkId) {
      return res.status(400).json({ error: 'Original route and landmark ID are required' });
    }

    // Find the landmark
    const landmark = europeanLandmarks.find(l => l.id === parseInt(landmarkId));
    if (!landmark) {
      return res.status(404).json({ error: 'Landmark not found' });
    }

    // Create new route with landmark inserted
    const newRoute = {
      ...originalRoute,
      waypoints: [...originalRoute.waypoints]
    };

    // Insert landmark at optimal position (or specified index)
    const insertPosition = insertIndex !== undefined ? insertIndex :
      findOptimalInsertPosition(originalRoute.waypoints, landmark);

    newRoute.waypoints.splice(insertPosition, 0, {
      name: landmark.name,
      lat: landmark.lat,
      lng: landmark.lng,
      type: 'landmark',
      landmark_id: landmark.id,
      visit_duration: landmark.visit_duration,
      description: landmark.description,
      image_url: landmark.image_url
    });

    // Recalculate route using Mapbox (simplified for now)
    const coordinates = newRoute.waypoints.map(wp => [wp.lng, wp.lat]);

    res.json({
      success: true,
      route: newRoute,
      landmark: landmark,
      insertPosition: insertPosition,
      totalDistance: calculateTotalDistance(coordinates),
      estimatedDuration: calculateEstimatedDuration(newRoute.waypoints)
    });

  } catch (error) {
    console.error('Error adding landmark to route:', error);
    res.status(500).json({ error: 'Failed to add landmark to route' });
  }
});

// Helper function to find optimal position to insert landmark
function findOptimalInsertPosition(waypoints, landmark) {
  console.log('🎯 OPTIMIZATION: Finding optimal position for landmark:', landmark.name);
  console.log('🎯 OPTIMIZATION: Current waypoints:', waypoints.map(wp => `${wp.name} (${wp.lat}, ${wp.lng})`));

  if (waypoints.length < 2) {
    console.log('🎯 OPTIMIZATION: Less than 2 waypoints, inserting at end');
    return waypoints.length;
  }

  let minDetour = Infinity;
  let bestPosition = waypoints.length;
  let detourAnalysis = [];

  for (let i = 0; i <= waypoints.length; i++) {
    const prevPoint = i > 0 ? waypoints[i-1] : null;
    const nextPoint = i < waypoints.length ? waypoints[i] : null;

    let detour = 0;
    let description = '';

    if (prevPoint && nextPoint) {
      // Calculate detour: distance(prev->landmark) + distance(landmark->next) - distance(prev->next)
      const originalDistance = calculateDistance(prevPoint, nextPoint);
      const newDistance = calculateDistance(prevPoint, landmark) + calculateDistance(landmark, nextPoint);
      detour = newDistance - originalDistance;
      description = `Between ${prevPoint.name} and ${nextPoint.name}`;
    } else if (prevPoint) {
      detour = calculateDistance(prevPoint, landmark);
      description = `After ${prevPoint.name} (end)`;
    } else if (nextPoint) {
      detour = calculateDistance(landmark, nextPoint);
      description = `Before ${nextPoint.name} (start)`;
    } else {
      description = 'Only waypoint';
    }

    detourAnalysis.push({
      position: i,
      detour: detour.toFixed(2),
      description: description
    });

    if (detour < minDetour) {
      minDetour = detour;
      bestPosition = i;
    }
  }

  console.log('🎯 OPTIMIZATION: Detour analysis:', detourAnalysis);
  console.log('🎯 OPTIMIZATION: Best position:', bestPosition, 'with detour:', minDetour.toFixed(2), 'km');

  return bestPosition;
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to calculate total route distance
function calculateTotalDistance(coordinates) {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = { lat: coordinates[i][1], lng: coordinates[i][0] };
    const point2 = { lat: coordinates[i+1][1], lng: coordinates[i+1][0] };
    total += calculateDistance(point1, point2);
  }
  return Math.round(total);
}

// Helper function to calculate estimated duration
function calculateEstimatedDuration(waypoints) {
  const baseMinutes = waypoints.reduce((total, wp) => {
    return total + (wp.visit_duration || 120); // Default 2 hours per stop
  }, 0);

  const drivingTime = waypoints.length * 60; // Assume 1 hour driving between stops
  return Math.round((baseMinutes + drivingTime) / 60); // Return in hours
}

app.listen(PORT, () => {
  console.log(`🚗 Road Trip Planner MVP running on port ${PORT}`);
  console.log(`📍 Loaded ${europeanLandmarks.length} European landmarks`);
});