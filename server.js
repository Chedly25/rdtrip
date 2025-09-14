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