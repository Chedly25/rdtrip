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
        max_tokens: 2000,
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