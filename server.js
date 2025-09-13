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

async function queryPerplexity(agent, destination, stops) {
  try {
    const prompt = `${agent.prompt}

Create a UNIQUE road trip route from Aix-en-Provence, France to ${destination} with ${stops} interesting stops along the way.

IMPORTANT: Create a route that is completely DIFFERENT from what adventure/culture/food agents would recommend. Focus exclusively on your specialty and avoid popular tourist cities that other agents might choose.

Provide a JSON response with:
- waypoints: array of ${stops} recommended stops with name, exact coordinates [latitude, longitude], and brief description focused on your specialty
- activities: 2-3 activities for each waypoint related to your expertise
- duration: estimated time at each stop

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

app.listen(PORT, () => {
  console.log(`🚗 Road Trip Planner MVP running on port ${PORT}`);
});