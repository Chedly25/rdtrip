const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// AI Agent configurations
const agents = {
  adventure: {
    name: "Adventure Agent",
    prompt: "You are an adventure travel expert. Focus on outdoor activities, hiking, scenic routes, and thrilling experiences."
  },
  culture: {
    name: "Culture Agent", 
    prompt: "You are a cultural travel expert. Focus on museums, historical sites, local traditions, and cultural experiences."
  },
  food: {
    name: "Food Agent",
    prompt: "You are a culinary travel expert. Focus on local cuisine, restaurants, food markets, and gastronomic experiences."
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

Create a road trip route from Aix-en-Provence, France to ${destination} with ${stops} interesting stops along the way. 

Provide a JSON response with:
- waypoints: array of ${stops} recommended stops with name, coordinates, and brief description
- activities: 2-3 activities for each waypoint
- duration: estimated time at each stop

Keep it concise and practical.`;

    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'llama-3.1-sonar-small-128k-online',
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
    console.error(`Error with ${agent.name}:`, error);
    return `Error generating recommendations for ${agent.name}`;
  }
}

app.listen(PORT, () => {
  console.log(`🚗 Road Trip Planner MVP running on port ${PORT}`);
});