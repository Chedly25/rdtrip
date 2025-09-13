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

// AI Agent configurations
const agents = {
  adventure: {
    name: "Adventure Agent",
    prompt: "You are an adventure travel expert. Create a UNIQUE route focusing ONLY on outdoor activities, hiking trails, national parks, mountains, coastal areas, and thrilling experiences. AVOID cities that other agents might choose - prefer nature-based destinations, smaller adventure towns, and outdoor activity centers."
  },
  culture: {
    name: "Culture Agent", 
    prompt: "You are a cultural travel expert. Create a UNIQUE route focusing ONLY on museums, UNESCO heritage sites, historical monuments, ancient ruins, and cultural landmarks. Choose DIFFERENT cities from other agents - prefer places rich in history, art, and cultural significance that adventure/food agents wouldn't typically recommend."
  },
  food: {
    name: "Food Agent",
    prompt: "You are a culinary travel expert. Create a UNIQUE route focusing ONLY on food markets, wine regions, local restaurants, culinary traditions, and gastronomic experiences. Select DIFFERENT destinations from other agents - prefer food capitals, wine regions, and places known for specific culinary specialties."
  }
};

// Generate route with AI agents
app.post('/api/generate-route', async (req, res) => {
  try {
    const { destination, stops = 3, agents: selectedAgents = ['adventure', 'culture', 'food'] } = req.body;
    
    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Process with selected agents
    const agentPromises = selectedAgents.map(agentType => 
      queryPerplexity(agents[agentType], destination, stops)
    );

    const agentResults = await Promise.all(agentPromises);
    
    // Combine results
    const route = {
      origin: "Aix-en-Provence, France",
      destination: destination,
      totalStops: stops,
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
  - imageUrl: representative image URL for the day's main location
  - activities: array of timed activities (with time, title, description, and optional imageUrl for major activities)
  - accommodation: suggested place to stay
  - meals: breakfast, lunch, dinner recommendations
  - travel: driving details if moving to next location

For imageUrl fields, please search for and provide direct URLs to high-quality images that represent each location or activity. Include landscape photos, landmark images, or activity photos relevant to your ${agent.name.toLowerCase()} expertise.

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

async function queryPerplexity(agent, destination, stops) {
  try {
    const prompt = `${agent.prompt}

Create a UNIQUE road trip route from Aix-en-Provence, France to ${destination} with ${stops} interesting stops along the way.

IMPORTANT: Create a route that is completely DIFFERENT from what adventure/culture/food agents would recommend. Focus exclusively on your specialty and avoid popular tourist cities that other agents might choose.

Provide a JSON response with:
- waypoints: array of ${stops} recommended stops with name, exact coordinates [latitude, longitude], brief description focused on your specialty, and imageUrl (find a representative image URL for each location)
- activities: 2-3 activities for each waypoint related to your expertise
- duration: estimated time at each stop

For imageUrl, please search for and provide direct URLs to high-quality images that represent each waypoint. Include landscape photos, landmark images, or activity photos relevant to your specialty.

Make this route unique to your travel style and avoid mainstream destinations.`;

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

// Image validation and proxy endpoint
app.get('/api/image-proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if the URL returns a valid image
    const response = await axios.head(url, {
      timeout: 5000,
      validateStatus: (status) => status < 400
    });

    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'URL does not point to an image' });
    }

    // Return validated image URL
    res.json({ 
      valid: true, 
      url: url,
      contentType: contentType,
      size: response.headers['content-length']
    });

  } catch (error) {
    console.error('Image validation error:', error.message);
    res.status(400).json({ 
      valid: false, 
      error: 'Image not accessible or invalid',
      originalUrl: req.query.url
    });
  }
});

// Image fetching service - get real images for locations and activities
app.post('/api/fetch-images', async (req, res) => {
  try {
    const { locations, agentType, waypoints } = req.body;
    
    if (!locations || !Array.isArray(locations)) {
      return res.status(400).json({ error: 'Locations array is required' });
    }

    const images = {};
    
    // Generate images for each location
    for (const location of locations) {
      images[location] = await generateImageForLocation(location, agentType);
    }
    
    // Generate images for waypoints if provided
    if (waypoints && Array.isArray(waypoints)) {
      for (const waypoint of waypoints) {
        if (waypoint.name) {
          images[waypoint.name] = await generateImageForLocation(waypoint.name, agentType, waypoint.activities);
        }
      }
    }

    res.json({
      success: true,
      images: images,
      agentType: agentType
    });

  } catch (error) {
    console.error('Image fetching error:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Generate image URL for a specific location
async function generateImageForLocation(locationName, agentType, activities = []) {
  // Create search terms based on agent type
  const agentKeywords = {
    adventure: ['landscape', 'nature', 'outdoor', 'hiking', 'mountains'],
    culture: ['architecture', 'museum', 'historic', 'monument', 'art'],
    food: ['restaurant', 'cuisine', 'market', 'food', 'dining']
  };
  
  const keywords = agentKeywords[agentType] || ['travel', 'destination'];
  
  // Clean location name for search
  const cleanLocation = locationName
    .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase();
  
  // Generate Unsplash URL - they provide free stock photos
  const searchTerm = `${cleanLocation}-${keywords[0]}`;
  const unsplashUrl = `https://source.unsplash.com/800x600/?${searchTerm}`;
  
  // Also generate a backup URL with different keywords
  const backupSearchTerm = `${cleanLocation}-${keywords[1] || 'travel'}`;
  const backupUrl = `https://source.unsplash.com/800x600/?${backupSearchTerm}`;
  
  return {
    primary: unsplashUrl,
    backup: backupUrl,
    location: locationName,
    searchTerms: [searchTerm, backupSearchTerm]
  };
}

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