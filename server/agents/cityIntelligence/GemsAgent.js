/**
 * GemsAgent - Hidden Gems Discovery Agent
 *
 * Finds non-touristy local favorites and insider recommendations.
 * Uses preference context to find alternatives to popular spots.
 *
 * Architecture Notes:
 * - Depends on PreferenceAgent for match context
 * - Uses Claude for intelligent gem discovery
 * - Provides "instead of" alternatives to tourist traps
 * - Includes insider tips for each gem
 */

const BaseAgent = require('./BaseAgent');

class GemsAgent extends BaseAgent {
  constructor() {
    super({
      name: 'GemsAgent',
      description: 'Find non-touristy local favorites based on preferences',
      requiredInputs: ['city', 'preferences'],
      optionalInputs: ['prev:PreferenceAgent'],
      outputs: ['hiddenGems'],
      dependsOn: ['PreferenceAgent'],
      canRefine: true
    });

    // Use a smarter model for creative discovery
    this.model = 'claude-haiku-4-5-20251001';
  }

  /**
   * Main execution logic
   */
  async run(input, context) {
    const { city, preferences, previousAgentOutputs, refinementInstructions } = input;

    // Get preference context if available
    const preferenceData = previousAgentOutputs?.PreferenceAgent?.data;
    const matchReasons = preferenceData?.reasons || [];
    const warnings = preferenceData?.warnings || [];

    this.reportProgress(20, 'Analyzing preferences...');

    // Build focused search based on preferences and gaps
    const focusAreas = this.buildFocusAreas(preferences, matchReasons, warnings);

    this.reportProgress(40, 'Discovering hidden gems...');

    // Call Claude to discover gems
    const gems = await this.discoverGems(city, preferences, focusAreas, refinementInstructions);

    this.reportProgress(80, 'Generating insider tips...');

    // Identify any gaps
    const gaps = this.identifyGaps(gems, preferences);

    return {
      data: {
        hiddenGems: gems
      },
      confidence: this.calculateConfidence(gems, preferences),
      gaps,
      suggestions: gaps.length > 0 ? ['Consider refining with specific category focus'] : []
    };
  }

  /**
   * Build focus areas based on preferences and match data
   */
  buildFocusAreas(preferences, matchReasons, warnings) {
    const areas = [];

    // Add areas from preferences
    if (preferences.interests) {
      areas.push(...preferences.interests);
    }

    // Add focus from high-scoring matches
    matchReasons
      .filter(r => r.score >= 80)
      .forEach(r => areas.push(r.preference));

    // Prioritize areas where there are warnings (gaps to fill)
    warnings
      .filter(w => w.score < 60)
      .forEach(w => areas.push(`${w.preference} alternatives`));

    // Add dining if mentioned
    if (preferences.diningStyle) {
      areas.push(`${preferences.diningStyle} dining`);
    }

    // Default areas if nothing specific
    if (areas.length === 0) {
      areas.push('local restaurants', 'unique experiences', 'scenic spots');
    }

    return [...new Set(areas)].slice(0, 6); // Dedupe and limit
  }

  /**
   * Call Claude to discover hidden gems
   */
  async discoverGems(city, preferences, focusAreas, refinementInstructions) {
    const systemPrompt = `You are a local travel expert who knows ${city.name}, ${city.country} intimately.
Your specialty is finding the hidden gems that locals love but tourists miss.

IMPORTANT RULES:
1. NEVER recommend famous landmarks or well-known tourist attractions
2. Focus on places with character and authenticity
3. Each gem should feel like an insider secret
4. Include specific, actionable tips
5. Provide "instead of" alternatives when relevant

Respond with a JSON object containing an array of hidden gems.`;

    const userPrompt = `Find 4-6 hidden gems in ${city.name} for a traveler with these preferences:

PREFERENCES:
- Traveller type: ${preferences.travellerType || 'General traveler'}
- Interests: ${preferences.interests?.join(', ') || 'Varied'}
- Dining style: ${preferences.diningStyle || 'Open to anything'}
- Pace: ${preferences.pace || 'moderate'}
- Avoids crowds: ${preferences.avoidCrowds ? 'Yes' : 'No'}
- Prefers outdoor: ${preferences.preferOutdoor ? 'Yes' : 'Not necessarily'}

FOCUS AREAS TO PRIORITIZE:
${focusAreas.map((a, i) => `${i + 1}. ${a}`).join('\n')}

${refinementInstructions ? `\nADDITIONAL INSTRUCTIONS:\n${refinementInstructions}` : ''}

Respond with this exact JSON structure:
{
  "gems": [
    {
      "name": "Place name",
      "type": "restaurant|cafe|bar|shop|viewpoint|activity|neighborhood|market",
      "why": "One compelling sentence about why locals love this place",
      "insteadOf": "Famous tourist alternative this replaces (or null)",
      "insiderTip": "Specific actionable tip (best time, what to order, how to find it, etc.)"
    }
  ]
}`;

    try {
      const response = await this.callClaudeJSON(systemPrompt, userPrompt, {
        maxTokens: 1500
      });

      // Validate and normalize the response
      const gems = (response.gems || []).map((gem, idx) => ({
        name: gem.name || `Hidden Gem ${idx + 1}`,
        type: this.normalizeType(gem.type),
        why: gem.why || 'A local favorite',
        insteadOf: gem.insteadOf || null,
        insiderTip: gem.insiderTip || null
      }));

      return gems;

    } catch (error) {
      console.error(`[GemsAgent] Claude error:`, error.message);

      // Return fallback gems
      return this.getFallbackGems(city, focusAreas);
    }
  }

  /**
   * Normalize gem type to valid categories
   */
  normalizeType(type) {
    const validTypes = ['restaurant', 'cafe', 'bar', 'shop', 'viewpoint', 'activity', 'neighborhood', 'market'];
    const normalized = (type || '').toLowerCase();

    if (validTypes.includes(normalized)) {
      return normalized;
    }

    // Map common variations
    if (normalized.includes('food') || normalized.includes('dining')) return 'restaurant';
    if (normalized.includes('drink') || normalized.includes('wine')) return 'bar';
    if (normalized.includes('coffee')) return 'cafe';
    if (normalized.includes('view') || normalized.includes('scenic')) return 'viewpoint';
    if (normalized.includes('shop') || normalized.includes('store') || normalized.includes('boutique')) return 'shop';

    return 'activity';
  }

  /**
   * Fallback gems when Claude fails
   */
  getFallbackGems(city, focusAreas) {
    return [
      {
        name: `Local Quarter of ${city.name}`,
        type: 'neighborhood',
        why: 'Where residents actually spend their weekends, away from tourist crowds',
        insteadOf: 'Main tourist center',
        insiderTip: 'Walk the side streets and follow locals into cafes'
      },
      {
        name: 'Morning Market',
        type: 'market',
        why: 'The real local market where chefs shop, not the tourist-oriented one',
        insteadOf: 'Tourist market stalls',
        insiderTip: 'Arrive before 9am for the best selection and atmosphere'
      },
      {
        name: 'Neighborhood Restaurant',
        type: 'restaurant',
        why: 'Family-run spot serving authentic local cuisine at fair prices',
        insteadOf: 'Restaurants in the main square',
        insiderTip: 'Ask for the daily special - it\'s always the freshest'
      }
    ];
  }

  /**
   * Identify gaps in gem coverage
   */
  identifyGaps(gems, preferences) {
    const gaps = [];
    const gemTypes = gems.map(g => g.type);

    // Check for dining gaps
    if (preferences.diningStyle && !gemTypes.some(t => ['restaurant', 'cafe', 'bar'].includes(t))) {
      gaps.push(`No dining gems found despite ${preferences.diningStyle} preference`);
    }

    // Check for outdoor gaps
    if (preferences.preferOutdoor && !gemTypes.some(t => ['viewpoint', 'activity'].includes(t))) {
      gaps.push('No outdoor/nature gems found despite preference');
    }

    // Check minimum count
    if (gems.length < 3) {
      gaps.push('Fewer than 3 gems discovered');
    }

    return gaps;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(gems, preferences) {
    let confidence = 50; // Base

    // More gems = higher confidence
    confidence += Math.min(gems.length * 8, 25);

    // All gems have insider tips = higher confidence
    const tipsCount = gems.filter(g => g.insiderTip).length;
    confidence += (tipsCount / Math.max(gems.length, 1)) * 15;

    // Variety of types = higher confidence
    const uniqueTypes = new Set(gems.map(g => g.type)).size;
    confidence += Math.min(uniqueTypes * 5, 15);

    return Math.min(Math.round(confidence), 95);
  }
}

module.exports = GemsAgent;
