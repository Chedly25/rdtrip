/**
 * PhotoAgent - Photo Spots Discovery Agent
 *
 * Identifies Instagram-worthy locations and scenic viewpoints.
 * Provides photography-specific tips including:
 * - Best times for lighting
 * - Composition tips
 * - Crowd avoidance strategies
 * - Hidden photo spots locals know
 *
 * Architecture Notes:
 * - No dependencies on other agents
 * - Uses Claude for local photography knowledge
 * - Focus on practical photo tips, not just lists
 * - Does not refine (spots are factual)
 */

const BaseAgent = require('./BaseAgent');

class PhotoAgent extends BaseAgent {
  constructor() {
    super({
      name: 'PhotoAgent',
      description: 'Identify Instagram-worthy photo spots and viewpoints',
      requiredInputs: ['city'],
      optionalInputs: ['preferences'],
      outputs: ['spots'],
      dependsOn: [],
      canRefine: false
    });

    this.model = 'claude-haiku-4-5-20251001';
  }

  /**
   * Main execution logic
   */
  async run(input, context) {
    const { city, preferences } = input;

    this.reportProgress(30, 'Discovering photo spots...');

    // Call Claude to discover photo spots
    const spots = await this.discoverPhotoSpots(city, preferences);

    this.reportProgress(100, 'Complete');

    return {
      data: {
        spots
      },
      confidence: spots.length >= 3 ? 85 : 65,
      gaps: spots.length < 3 ? ['Limited photo spots discovered'] : []
    };
  }

  /**
   * Call Claude to discover photo spots
   */
  async discoverPhotoSpots(city, preferences) {
    const systemPrompt = `You are a travel photographer who has extensively photographed ${city.name}, ${city.country}.
You know not just the famous viewpoints, but also the hidden angles and perfect timing that make photos special.

Your advice should be:
1. Specific and actionable (exact locations, times)
2. Include both famous spots AND lesser-known angles
3. Focus on practical photography tips
4. Consider light, crowds, and composition`;

    const userPrompt = `Recommend 4-5 photo spots in ${city.name}, ${city.country}.

For each spot, provide:
1. The name/location
2. BEST TIME to photograph (be specific about lighting)
3. A PRACTICAL TIP for getting the best shot

Include a mix of:
- One iconic/famous view (the classic shot everyone wants)
- One elevated viewpoint (rooftop, hill, bridge)
- One street-level scene (atmospheric, local life)
- One sunrise/sunset specific spot

Respond in this exact JSON format:
{
  "spots": [
    {
      "name": "Spot name or location",
      "bestTime": "Specific time and why (e.g., 'Golden hour, 7-8pm - sun lights the facade')",
      "tip": "Practical photography tip (position, lens, avoid crowds, etc.)"
    }
  ]
}`;

    try {
      const response = await this.callClaudeJSON(systemPrompt, userPrompt, {
        maxTokens: 1200
      });

      // Validate and normalize the response
      const spots = (response.spots || []).map((spot, idx) => ({
        name: spot.name || `Photo Spot ${idx + 1}`,
        bestTime: spot.bestTime || 'Golden hour (1 hour before sunset)',
        tip: spot.tip || 'Arrive early to find the best angle'
      }));

      return spots;

    } catch (error) {
      console.error(`[PhotoAgent] Claude error:`, error.message);

      // Return fallback spots
      return this.getFallbackSpots(city);
    }
  }

  /**
   * Fallback photo spots when Claude fails
   */
  getFallbackSpots(city) {
    return [
      {
        name: `${city.name} Old Town/Historic Center`,
        bestTime: 'Early morning (7-8am) for empty streets and soft light',
        tip: 'Position yourself in narrow alleys where morning light creates dramatic shadows'
      },
      {
        name: 'Main Square or Cathedral',
        bestTime: 'Blue hour (30 mins after sunset) when buildings are lit',
        tip: 'Use a low angle to capture architecture against the twilight sky'
      },
      {
        name: 'Elevated Viewpoint',
        bestTime: 'Golden hour (1 hour before sunset)',
        tip: 'Scout the location in advance - best views often require a short walk'
      },
      {
        name: 'Local Market or Street Scene',
        bestTime: 'Mid-morning (9-11am) when locals are active',
        tip: 'Ask permission before photographing vendors, and consider buying something'
      }
    ];
  }
}

module.exports = PhotoAgent;
