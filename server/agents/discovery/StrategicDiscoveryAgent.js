/**
 * StrategicDiscoveryAgent - Intelligent activity discovery with reasoning
 *
 * This agent REASONS about what to discover based on context, then
 * discovers MULTIPLE CANDIDATES (not final choices) using Perplexity.
 *
 * Key Innovations:
 * - Strategy building based on SharedContext
 * - Discovers 3-5 candidates (not just 1) for selection
 * - Context-aware prompts (budget, previous activities, diversification)
 * - Learns from validation failures
 * - Tracks reasoning for every discovery
 */

const axios = require('axios');

class StrategicDiscoveryAgent {
  constructor(sharedContext) {
    this.context = sharedContext;
    this.apiKey = process.env.PERPLEXITY_API_KEY;
  }

  /**
   * Main entry point: Discover activity candidates with strategic reasoning
   */
  async discoverCandidates(request) {
    console.log(`\n🧠 StrategicDiscoveryAgent: Discovering candidates for ${request.city}`);
    console.log(`   Time window: ${request.timeWindow.start} - ${request.timeWindow.end}`);
    console.log(`   Day theme: ${request.dayTheme}`);

    // STEP 1: Build discovery strategy based on context
    const strategy = this.buildDiscoveryStrategy(request);

    console.log(`📋 Strategy: ${strategy.reasoning}`);

    this.context.logCommunication(
      'StrategicDiscoveryAgent',
      'SharedContext',
      'Analyzing context for strategy',
      { request, strategy }
    );

    // STEP 2: Build intelligent prompt for Perplexity
    const prompt = this.buildStrategicPrompt(request, strategy);

    // STEP 3: Call Perplexity to discover candidates
    const perplexityResponse = await this.callPerplexity(prompt);

    // STEP 4: Parse and enrich candidates
    const candidates = this.parseCandidates(perplexityResponse, request.city);

    console.log(`✓ Discovered ${candidates.length} candidates`);

    // Log decision
    this.context.recordDecision({
      phase: 'discovery',
      agent: 'StrategicDiscoveryAgent',
      candidatesFound: candidates.length,
      strategy: strategy,
      reasoning: strategy.reasoning,
      request: request
    });

    return {
      candidates,
      strategy,
      reasoning: strategy.reasoning,
      metadata: {
        searchCriteria: request,
        timestamp: Date.now(),
        agent: 'StrategicDiscoveryAgent'
      }
    };
  }

  /**
   * Build discovery strategy based on SharedContext
   * This is where the INTELLIGENCE happens
   */
  buildDiscoveryStrategy(request) {
    const strategy = {
      focus: null,
      constraints: [],
      preferences: [],
      avoidance: [],
      reasoning: ''
    };

    const reasoningParts = [];

    // Get current schedule statistics
    const stats = this.context.getScheduleStatistics();

    // 1. DIVERSIFICATION LOGIC
    const diversification = this.context.needsDiversification();
    if (diversification.needsDiversification) {
      strategy.avoidance.push(diversification.overrepresentedType);
      strategy.focus = 'diversify';
      reasoningParts.push(diversification.suggestion);
    }

    // 2. BUDGET AWARENESS
    const budgetStatus = this.context.getBudgetStatus();
    if (budgetStatus.remaining !== null) {
      if (budgetStatus.remaining < 100) {
        strategy.constraints.push('free_or_low_cost');
        strategy.preferences.push('free', 'under_10_euros');
        reasoningParts.push('Low budget remaining - prioritizing free/cheap activities');
      } else if (budgetStatus.percentUsed > 70) {
        strategy.preferences.push('good_value');
        reasoningParts.push('Budget 70% used - seeking value');
      }
    }

    // 3. TIME-OF-DAY AWARENESS
    const startHour = parseInt(request.timeWindow.start.split(':')[0]);
    if (startHour < 10) {
      strategy.preferences.push('early_opening', 'breakfast_friendly');
      strategy.avoidance.push('late_opening');
      reasoningParts.push('Early morning - need early-opening venues');
    } else if (startHour >= 19) {
      strategy.preferences.push('evening_activity', 'night_life');
      reasoningParts.push('Evening - seeking nighttime activities');
    }

    // 4. DAY OF WEEK AWARENESS
    if (request.dayOfWeek === 'Monday') {
      strategy.constraints.push('must_be_open_monday');
      reasoningParts.push('Monday - many museums closed, need open venues');
    } else if (request.dayOfWeek === 'Sunday') {
      strategy.constraints.push('must_be_open_sunday');
      reasoningParts.push('Sunday - verifying opening hours crucial');
    }

    // 5. ENERGY LEVEL BALANCING
    const energyStats = stats.energyLevelBreakdown;
    const highEnergy = energyStats.high || 0;
    const relaxed = energyStats.relaxed || 0;

    if (highEnergy > relaxed + 1) {
      strategy.preferences.push('relaxed', 'leisurely');
      strategy.avoidance.push('strenuous', 'high_energy');
      reasoningParts.push('Balancing energy - need relaxed activity');
    } else if (relaxed > highEnergy + 1) {
      strategy.preferences.push('active', 'engaging');
      reasoningParts.push('Adding active element for variety');
    }

    // 6. TRAVEL STYLE ALIGNMENT
    const travelStyle = this.context.knowledgeBase.constraints.travelStyle;
    strategy.preferences.push(`${travelStyle}_style`);

    // 7. LEARN FROM FAILURES
    const invalidPlaces = this.context.getInvalidPlaces();
    if (invalidPlaces.length > 0) {
      strategy.avoidance.push(...invalidPlaces);
      reasoningParts.push(`Avoiding ${invalidPlaces.length} previously failed places`);
    }

    // 8. LOCATION CONTINUITY
    const lastLocation = this.context.getLastLocation();
    if (lastLocation) {
      strategy.preferences.push('nearby_previous');
      reasoningParts.push('Preferring locations near previous activity');
    }

    // 9. WINDOW DURATION AWARENESS
    const windowDuration = this.calculateWindowDuration(request.timeWindow);
    if (windowDuration < 90) {
      strategy.constraints.push('short_duration');
      reasoningParts.push(`Short window (${windowDuration}min) - need quick activities`);
    } else if (windowDuration > 240) {
      strategy.preferences.push('substantial', 'immersive');
      reasoningParts.push(`Long window (${windowDuration}min) - can do immersive activities`);
    }

    // Compile reasoning
    strategy.reasoning = reasoningParts.length > 0
      ? reasoningParts.join('; ')
      : 'Standard discovery with no special constraints';

    return strategy;
  }

  /**
   * Build intelligent prompt for Perplexity
   */
  buildStrategicPrompt(request, strategy) {
    const travelStyle = this.context.knowledgeBase.constraints.travelStyle;

    // Build constraints section
    let constraintsText = '';
    if (strategy.constraints.length > 0) {
      constraintsText = '\n\nCRITICAL CONSTRAINTS (MUST follow):\n' +
        strategy.constraints.map(c => `- ${this.humanizeConstraint(c)}`).join('\n');
    }

    // Build preferences section
    let preferencesText = '';
    if (strategy.preferences.length > 0) {
      preferencesText = '\n\nPREFERENCES (strongly favor):\n' +
        strategy.preferences.map(p => `- ${this.humanizePreference(p)}`).join('\n');
    }

    // Build avoidance section
    let avoidanceText = '';
    if (strategy.avoidance.length > 0) {
      const avoidList = strategy.avoidance
        .filter(a => !a.includes('/')) // Filter out place names with slashes
        .slice(0, 10); // Limit to 10 items

      if (avoidList.length > 0) {
        avoidanceText = '\n\nAVOID:\n' + avoidList.map(a => `- ${a}`).join('\n');
      }
    }

    return `You are a ${travelStyle} travel expert discovering activity CANDIDATES for ${request.city}.

CONTEXT:
- Time window: ${request.timeWindow.start} - ${request.timeWindow.end}
- Day: ${request.dayOfWeek}, ${request.date}
- Day theme: ${request.dayTheme}
- Window purpose: ${request.purpose || 'General activities'}

STRATEGY:
${strategy.reasoning}
${constraintsText}
${preferencesText}
${avoidanceText}

YOUR TASK:
Find 3-5 CANDIDATE activities (NOT just 1 - we need OPTIONS for selection!).

Each candidate must be:
1. A REAL, SPECIFIC place with exact address (not "explore old town" or "wander around")
2. OPEN on ${request.dayOfWeek} during ${request.timeWindow.start}-${request.timeWindow.end}
3. Appropriate for the time window duration
4. Aligned with ${travelStyle} travel style
5. Fitting the strategy above

For each candidate, provide:
- Exact name and address
- Estimated duration (minutes)
- Estimated cost (€)
- Energy level (relaxed/moderate/high)
- Opening hours for ${request.dayOfWeek}
- Why it's recommended (strategic fit)
- Type (museum/outdoor/cultural/shopping/etc)

OUTPUT FORMAT (JSON only, no markdown):
{
  "candidates": [
    {
      "name": "Musée Granet",
      "type": "museum",
      "address": "Place Saint-Jean de Malte, 13100 Aix-en-Provence",
      "estimatedDuration": 120,
      "estimatedCost": 8,
      "energyLevel": "relaxed",
      "openingHours": "Tuesday-Sunday 10:00-18:00, Closed Monday",
      "whyRecommended": "Top-rated art museum, fits culture focus, appropriate for ${request.timeWindow.start} start",
      "strategicFit": "high"
    }
  ]
}

IMPORTANT:
- Return 3-5 candidates minimum
- Each must be OPEN during scheduled time
- Each must be a SPECIFIC place, not a generic activity
- Return ONLY valid JSON, no markdown, no explanations`;
  }

  /**
   * Call Perplexity API
   */
  async callPerplexity(prompt, retries = 2) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`   🎯 Calling Perplexity (attempt ${attempt}/${retries})...`);

        const response = await axios.post(
          'https://api.perplexity.ai/chat/completions',
          {
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a strategic travel discovery agent. Return ONLY valid JSON with multiple candidate options, no markdown, no code blocks, no explanations.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 3000,
            temperature: 0.5 // Slightly higher for creativity in finding candidates
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 45000
          }
        );

        console.log(`   ✓ Perplexity responded`);
        return response.data.choices[0].message.content;

      } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        const isLastAttempt = attempt === retries;

        console.error(`   ❌ Perplexity attempt ${attempt}/${retries} failed:`, error.message);

        if (isLastAttempt || !isTimeout) {
          throw new Error(`Discovery failed after ${attempt} attempts: ${error.message}`);
        }

        const waitTime = attempt * 2000;
        console.log(`   ⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Parse candidates from Perplexity response
   */
  parseCandidates(responseText, city) {
    try {
      let jsonText = responseText.trim();

      // Remove markdown code blocks
      if (jsonText.includes('```json')) {
        const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      } else if (jsonText.includes('```')) {
        const match = jsonText.match(/```\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      }

      // Extract JSON object
      const jsonStart = jsonText.indexOf('{');
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
      }

      const parsed = JSON.parse(jsonText);

      if (!Array.isArray(parsed.candidates)) {
        throw new Error('Invalid response format: missing candidates array');
      }

      // Validate and enrich candidates
      const candidates = parsed.candidates
        .filter(c => c.name && c.address) // Must have name and address
        .map(candidate => ({
          ...candidate,
          city,
          discoveredAt: Date.now(),
          source: 'perplexity'
        }));

      if (candidates.length === 0) {
        throw new Error('No valid candidates in response');
      }

      return candidates;

    } catch (error) {
      console.error('Failed to parse candidates:', error.message);
      console.error('Response text:', responseText.substring(0, 500));

      // Return fallback candidate
      return [{
        name: `Explore ${city} City Center`,
        type: 'general',
        address: city,
        estimatedDuration: 120,
        estimatedCost: 0,
        energyLevel: 'moderate',
        openingHours: 'Always open',
        whyRecommended: 'Fallback activity due to discovery error',
        strategicFit: 'low',
        city,
        discoveredAt: Date.now(),
        source: 'fallback'
      }];
    }
  }

  /**
   * Helper: Calculate window duration in minutes
   */
  calculateWindowDuration(timeWindow) {
    const start = timeWindow.start.split(':');
    const end = timeWindow.end.split(':');
    const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
    const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
    return endMinutes - startMinutes;
  }

  /**
   * Helper: Humanize constraint for prompt
   */
  humanizeConstraint(constraint) {
    const map = {
      'free_or_low_cost': 'Must be free or under €10',
      'must_be_open_monday': 'MUST be open on Monday (many museums closed)',
      'must_be_open_sunday': 'MUST be open on Sunday',
      'short_duration': 'Must be completable in under 90 minutes',
      'must_have_address': 'Must provide exact street address'
    };
    return map[constraint] || constraint;
  }

  /**
   * Helper: Humanize preference for prompt
   */
  humanizePreference(preference) {
    const map = {
      'early_opening': 'Opens before 10 AM',
      'breakfast_friendly': 'Suitable for morning visits',
      'evening_activity': 'Available in evening hours',
      'night_life': 'Evening/nighttime venue',
      'relaxed': 'Low energy, leisurely pace',
      'leisurely': 'Calm, unhurried experience',
      'active': 'Engaging, dynamic activity',
      'engaging': 'Interesting, interactive',
      'good_value': 'High quality for reasonable price',
      'free': 'Free admission preferred',
      'under_10_euros': 'Under €10 entrance fee',
      'nearby_previous': 'Close to previous location (walking distance)',
      'substantial': 'Can occupy 3+ hours',
      'immersive': 'Deep, thorough experience'
    };
    return map[preference] || preference;
  }
}

module.exports = StrategicDiscoveryAgent;
