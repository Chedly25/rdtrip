/**
 * LogisticsAgent - Practical Tips & Logistics Agent
 *
 * Provides practical travel logistics including:
 * - Parking recommendations (if driving)
 * - Pedestrian zones and walkability info
 * - Market days and local events
 * - Tips and warnings for visiting
 * - Best times to visit attractions
 *
 * Architecture Notes:
 * - No dependencies on other agents
 * - Uses Claude for local knowledge
 * - Transport mode aware (driving vs train)
 * - Focus on actionable, practical advice
 */

const BaseAgent = require('./BaseAgent');

class LogisticsAgent extends BaseAgent {
  constructor() {
    super({
      name: 'LogisticsAgent',
      description: 'Practical tips for visiting the city',
      requiredInputs: ['city'],
      optionalInputs: ['transportMode', 'preferences'],
      outputs: ['parking', 'tips', 'warnings', 'bestTimes', 'marketDays'],
      dependsOn: [],
      canRefine: false // Pure info gathering, no refinement needed
    });

    this.model = 'claude-haiku-4-5-20251001';
  }

  /**
   * Main execution logic
   */
  async run(input, context) {
    const { city, preferences } = input;

    // Get transport mode from context or default
    const transportMode = context?.transportMode || 'car';

    this.reportProgress(20, 'Gathering logistics info...');

    // Gather logistics via Claude
    const logistics = await this.gatherLogistics(city, transportMode, preferences);

    this.reportProgress(100, 'Complete');

    return {
      data: logistics,
      confidence: 85, // Logistics info is relatively stable
      gaps: logistics.tips.length < 2 ? ['Limited practical tips available'] : []
    };
  }

  /**
   * Call Claude to gather logistics information
   */
  async gatherLogistics(city, transportMode, preferences) {
    const isDriving = transportMode === 'car';
    const pace = preferences?.pace || 'moderate';
    const avoidCrowds = preferences?.avoidCrowds || false;

    const systemPrompt = `You are a practical travel advisor specializing in ${city.name}, ${city.country}.
Your job is to provide actionable logistics information that helps travelers avoid common pitfalls.

Focus on:
1. Genuinely useful, specific information
2. Local knowledge that isn't in guidebooks
3. Time-sensitive info (best times, days to avoid)
4. Money-saving tips
5. Common mistakes tourists make

Be concise but specific. Every tip should be actionable.`;

    const userPrompt = `Provide practical logistics for visiting ${city.name}, ${city.country}.

TRAVELER CONTEXT:
- Transport: ${isDriving ? 'Arriving by car' : 'Arriving by train/public transport'}
- Pace: ${pace}
- Avoids crowds: ${avoidCrowds ? 'Yes, prefers quieter times' : 'No strong preference'}

Please provide:
${isDriving ? '1. PARKING: Best parking option (name, approximate cost, distance to center)' : '1. PARKING: Skip this (not driving)'}
2. TIPS: 3-4 practical tips for visiting (specific and actionable)
3. WARNINGS: 1-2 things to watch out for or avoid
4. BEST TIMES: Best times/days to visit the main areas
5. MARKET DAYS: Any regular markets, their days and times

Respond in this exact JSON format:
{
  "parking": "${isDriving ? 'P+R Name (€X/day), Xmin walk to center' : null}",
  "tips": [
    "Specific actionable tip 1",
    "Specific actionable tip 2",
    "Specific actionable tip 3"
  ],
  "warnings": [
    "Warning about something to avoid or watch out for"
  ],
  "bestTimes": [
    "Morning: X is best for Y",
    "Afternoon: Z is best for W"
  ],
  "marketDays": [
    "Tuesday: Market name at Location",
    "Saturday: Market name at Location"
  ]
}`;

    try {
      const response = await this.callClaudeJSON(systemPrompt, userPrompt, {
        maxTokens: 1200
      });

      // Normalize and validate response
      return {
        parking: isDriving ? (response.parking || null) : null,
        tips: this.ensureArray(response.tips, 3),
        warnings: this.ensureArray(response.warnings, 1),
        bestTimes: this.ensureArray(response.bestTimes, 2),
        marketDays: this.ensureArray(response.marketDays, 0)
      };

    } catch (error) {
      console.error(`[LogisticsAgent] Claude error:`, error.message);

      // Return fallback logistics
      return this.getFallbackLogistics(city, isDriving);
    }
  }

  /**
   * Ensure result is an array with minimum items
   */
  ensureArray(value, minItems) {
    if (!Array.isArray(value)) return [];
    // Filter out empty strings and null values
    return value.filter(item => item && typeof item === 'string' && item.trim());
  }

  /**
   * Fallback logistics when Claude fails
   */
  getFallbackLogistics(city, isDriving) {
    return {
      parking: isDriving ? 'Look for P+R (Park & Ride) options on the outskirts for best value' : null,
      tips: [
        'The old town/historic center is usually best explored on foot',
        'Many shops and restaurants close for a long lunch (12-2pm) in smaller European cities',
        'Local tourist offices often have free maps and can recommend current events'
      ],
      warnings: [
        'Be aware of pickpockets in crowded tourist areas'
      ],
      bestTimes: [
        'Morning: Best for outdoor markets and avoiding crowds',
        'Evening: Main squares come alive with locals after 6pm'
      ],
      marketDays: []
    };
  }
}

module.exports = LogisticsAgent;
