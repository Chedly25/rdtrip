/**
 * StoryAgent - Narrative Hook Generator
 *
 * Creates emotionally resonant city narratives using Claude AI.
 * Generates:
 * - Hook: One compelling line that captures the city's essence
 * - Narrative: 2-3 sentences that paint a picture
 * - Differentiators: What makes this city unique
 *
 * The narrative is personalized based on:
 * - User preferences (couple? foodie? adventure seeker?)
 * - Trip context (honeymoon? road trip? cultural exploration?)
 * - City characteristics
 *
 * Philosophy:
 * - Stories sell destinations, not lists of attractions
 * - Emotional connection > factual accuracy
 * - Specific > generic (mention actual places, not "historic center")
 */

const BaseAgent = require('./BaseAgent');

class StoryAgent extends BaseAgent {
  constructor() {
    super({
      name: 'StoryAgent',
      description: 'Create emotional narrative hook for the city',
      requiredInputs: ['city', 'preferences'],
      optionalInputs: ['tripContext', 'travellerType'],
      outputs: ['hook', 'narrative', 'differentiators'],
      dependsOn: [],
      canRefine: true
    });
  }

  /**
   * Main execution logic
   */
  async run(input, context) {
    const { city, preferences, refinementInstructions } = input;
    const travellerType = input.travellerType || preferences?.travellerType || 'traveller';

    this.reportProgress(10, 'Researching city character...');

    // Build the prompt
    const prompt = this.buildPrompt(city, preferences, travellerType, refinementInstructions);

    this.reportProgress(30, 'Crafting narrative...');

    try {
      // Call Claude to generate the story
      const response = await this.callClaudeJSON(
        this.getSystemPrompt(),
        prompt,
        { maxTokens: 800 }
      );

      this.reportProgress(90, 'Polishing story...');

      // Validate and clean response
      const story = this.validateResponse(response, city);

      this.reportProgress(100, 'Complete');

      return {
        data: story,
        confidence: this.calculateConfidence(story),
        gaps: this.identifyGaps(story, preferences),
        suggestions: []
      };

    } catch (error) {
      console.error(`[StoryAgent] Error generating story:`, error.message);

      // Return fallback story
      return {
        data: this.generateFallbackStory(city, preferences),
        confidence: 50,
        gaps: ['AI generation failed, using fallback narrative'],
        suggestions: ['Consider re-running StoryAgent']
      };
    }
  }

  /**
   * System prompt for Claude
   */
  getSystemPrompt() {
    return `You are a master travel storyteller for Waycraft, a premium road trip planning platform. Your job is to craft irresistible city narratives that make travelers excited to visit.

VOICE & TONE:
- Evocative and sensory, not generic or Wikipedia-like
- Specific details beat vague descriptions
- Emotional resonance over factual completeness
- Confident and warm, like a well-traveled friend sharing tips

RULES:
1. NEVER use clichés like "hidden gem," "off the beaten path," "must-see," "picture-perfect"
2. NEVER start with "Welcome to..." or "Discover..."
3. ALWAYS mention at least one specific place, street, or experience
4. Keep hooks punchy (under 10 words if possible)
5. Narratives should be 2-3 sentences, vivid and specific
6. Differentiators should be unique selling points, not generic features

Return valid JSON only, no markdown.`;
  }

  /**
   * Build the user prompt
   */
  buildPrompt(city, preferences, travellerType, refinementInstructions) {
    let prompt = `Create a compelling narrative for: ${city.name}, ${city.country}

TRAVELLER PROFILE:
- Type: ${travellerType}
- Interests: ${preferences?.interests?.join(', ') || 'general exploration'}
- Dining: ${preferences?.diningStyle || 'varied'}
- Pace: ${preferences?.pace || 'moderate'}

TASK:
Generate a JSON object with:
1. "hook" - A single memorable line (the headline). Think magazine cover line. Examples of GOOD hooks:
   - "Where the Alps meet la dolce vita"
   - "France's best-kept foodie secret"
   - "Medieval charm without the crowds"

2. "narrative" - 2-3 sentences that paint a picture. Be specific and sensory. Mention actual places if you know them.

3. "differentiators" - Array of 3 things that make this city unique (not generic like "great food" but specific like "birthplace of tartiflette")

`;

    // Add refinement context if this is a re-run
    if (refinementInstructions) {
      prompt += `\nREFINEMENT REQUESTED:
${refinementInstructions}

Please improve the previous attempt based on this feedback.
`;
    }

    // Add preference-specific guidance
    if (preferences?.interests?.includes('food') || preferences?.diningStyle) {
      prompt += `\nFOCUS: This traveler loves food. Mention culinary aspects prominently.`;
    }

    if (preferences?.interests?.includes('culture') || preferences?.interests?.includes('art')) {
      prompt += `\nFOCUS: This traveler appreciates culture and art. Highlight cultural depth.`;
    }

    if (preferences?.interests?.includes('nature') || preferences?.interests?.includes('outdoor')) {
      prompt += `\nFOCUS: This traveler loves the outdoors. Mention natural settings and outdoor opportunities.`;
    }

    if (travellerType === 'couple' || travellerType === 'honeymoon') {
      prompt += `\nFOCUS: This is a romantic trip. Emphasize romantic aspects without being cheesy.`;
    }

    if (travellerType === 'family') {
      prompt += `\nFOCUS: Family trip. Mention family-friendly aspects naturally.`;
    }

    prompt += `\n\nReturn JSON:
{
  "hook": "your hook here",
  "narrative": "your narrative here",
  "differentiators": ["point 1", "point 2", "point 3"]
}`;

    return prompt;
  }

  /**
   * Validate and clean the response
   */
  validateResponse(response, city) {
    const result = {
      hook: response.hook || `Discover ${city.name}`,
      narrative: response.narrative || `${city.name} offers a unique blend of experiences waiting to be explored.`,
      differentiators: response.differentiators || ['Authentic local culture', 'Scenic beauty', 'Culinary traditions']
    };

    // Clean up hook (remove quotes if Claude added them)
    result.hook = result.hook.replace(/^["']|["']$/g, '').trim();

    // Ensure hook isn't too long
    if (result.hook.length > 60) {
      // Try to find a natural break point
      const shortHook = result.hook.split(/[,\.\-–—]/)[0].trim();
      if (shortHook.length >= 15) {
        result.hook = shortHook;
      }
    }

    // Ensure differentiators is an array of 3
    if (!Array.isArray(result.differentiators)) {
      result.differentiators = [result.differentiators];
    }
    while (result.differentiators.length < 3) {
      result.differentiators.push('Local character');
    }
    result.differentiators = result.differentiators.slice(0, 3);

    return result;
  }

  /**
   * Calculate confidence based on output quality
   */
  calculateConfidence(story) {
    let confidence = 70; // Base confidence

    // Hook quality checks
    if (story.hook.length >= 10 && story.hook.length <= 50) confidence += 10;
    if (!story.hook.toLowerCase().includes('discover')) confidence += 5;
    if (!story.hook.toLowerCase().includes('welcome')) confidence += 5;

    // Narrative quality checks
    if (story.narrative.length >= 80 && story.narrative.length <= 300) confidence += 5;
    if (story.narrative.includes(',')) confidence += 2; // Has some complexity

    // Differentiators quality
    if (story.differentiators.length === 3) confidence += 3;

    return Math.min(95, confidence);
  }

  /**
   * Identify gaps for reflection
   */
  identifyGaps(story, preferences) {
    const gaps = [];

    // Check if hook is generic
    const genericHooks = ['discover', 'explore', 'visit', 'welcome', 'experience'];
    if (genericHooks.some(g => story.hook.toLowerCase().startsWith(g))) {
      gaps.push('Hook starts with generic verb');
    }

    // Check if narrative mentions preferences
    if (preferences?.interests?.includes('food')) {
      const foodTerms = ['food', 'cuisine', 'restaurant', 'dish', 'culinary', 'eat', 'taste'];
      if (!foodTerms.some(t => story.narrative.toLowerCase().includes(t))) {
        gaps.push('Narrative missing food focus despite preference');
      }
    }

    // Check narrative length
    if (story.narrative.length < 80) {
      gaps.push('Narrative too short');
    }

    return gaps;
  }

  /**
   * Generate fallback story when AI fails
   */
  generateFallbackStory(city, preferences) {
    const templates = {
      default: {
        hook: `The soul of ${city.country} awaits`,
        narrative: `${city.name} blends historic charm with vibrant local life. Wander through streets that reveal surprises at every corner, from cozy cafes to centuries-old architecture.`,
        differentiators: ['Authentic local atmosphere', 'Rich cultural heritage', 'Walkable historic center']
      },
      foodie: {
        hook: `Where every meal tells a story`,
        narrative: `${city.name} is a feast for the senses. Local markets brim with regional specialties, while family-run restaurants serve recipes passed down through generations.`,
        differentiators: ['Celebrated regional cuisine', 'Vibrant food markets', 'Farm-to-table tradition']
      },
      romantic: {
        hook: `Romance written in every street`,
        narrative: `${city.name} sets the stage for unforgettable moments. Intimate squares, candlelit dinners, and golden hour walks create the perfect backdrop for connection.`,
        differentiators: ['Romantic atmosphere', 'Intimate dining scene', 'Scenic evening walks']
      }
    };

    // Select template based on preferences
    let template = templates.default;
    if (preferences?.interests?.includes('food') || preferences?.diningStyle) {
      template = templates.foodie;
    }
    if (preferences?.travellerType === 'couple' || preferences?.occasion === 'honeymoon') {
      template = templates.romantic;
    }

    return {
      hook: template.hook,
      narrative: template.narrative.replace(/\${city\.name}/g, city.name),
      differentiators: template.differentiators
    };
  }
}

module.exports = StoryAgent;
