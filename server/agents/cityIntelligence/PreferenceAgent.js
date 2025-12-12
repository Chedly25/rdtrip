/**
 * PreferenceAgent - Preference Matcher
 *
 * Scores how well a city matches user preferences.
 * Uses Claude AI to analyze city characteristics and compare against
 * user preferences for a personalized match score.
 *
 * Outputs:
 * - Overall match score (0-100)
 * - Reasons explaining high scores (why it's a good match)
 * - Warnings for preference mismatches (potential concerns)
 *
 * Scoring Dimensions:
 * - Walkability
 * - Food scene
 * - Cultural offerings
 * - Nature/outdoor access
 * - Nightlife
 * - Family friendliness
 * - Budget alignment
 * - Pace/vibe match
 */

const BaseAgent = require('./BaseAgent');

class PreferenceAgent extends BaseAgent {
  constructor() {
    super({
      name: 'PreferenceAgent',
      description: 'Score how well city matches user preferences',
      requiredInputs: ['city', 'preferences'],
      optionalInputs: ['travellerType', 'tripContext'],
      outputs: ['matchScore', 'reasons', 'warnings'],
      dependsOn: [],
      canRefine: true
    });

    // Dimension weights for overall score
    this.dimensionWeights = {
      primary: 0.35,    // User's explicitly stated interests
      secondary: 0.25,  // Related interests
      practical: 0.25,  // Practical concerns (walkability, budget)
      vibe: 0.15        // Overall vibe match
    };
  }

  /**
   * Main execution logic
   */
  async run(input, context) {
    const { city, preferences, refinementInstructions } = input;
    const travellerType = input.travellerType || preferences?.travellerType || 'traveller';

    this.reportProgress(10, 'Analyzing city characteristics...');

    try {
      // Get city analysis from Claude
      const cityAnalysis = await this.analyzeCityCharacteristics(city);

      this.reportProgress(40, 'Matching against preferences...');

      // Calculate dimension scores
      const dimensionScores = this.calculateDimensionScores(cityAnalysis, preferences, travellerType);

      this.reportProgress(70, 'Generating insights...');

      // Generate match reasons and warnings
      const { reasons, warnings } = await this.generateInsights(
        city,
        cityAnalysis,
        dimensionScores,
        preferences
      );

      this.reportProgress(90, 'Calculating final score...');

      // Calculate weighted overall score
      const overallScore = this.calculateOverallScore(dimensionScores, preferences);

      this.reportProgress(100, 'Complete');

      return {
        data: {
          score: overallScore,
          reasons,
          warnings,
          dimensions: dimensionScores
        },
        confidence: 85,
        gaps: warnings.length > 2 ? ['Multiple preference mismatches detected'] : [],
        suggestions: warnings.map(w => `GemsAgent: Focus on finding alternatives for ${w.preference}`)
      };

    } catch (error) {
      console.error(`[PreferenceAgent] Error:`, error.message);

      // Return reasonable fallback
      return {
        data: this.generateFallbackScore(city, preferences),
        confidence: 50,
        gaps: ['AI analysis failed, using heuristic scoring'],
        suggestions: []
      };
    }
  }

  /**
   * Analyze city characteristics using Claude
   */
  async analyzeCityCharacteristics(city) {
    const prompt = `Analyze the travel characteristics of ${city.name}, ${city.country}.

Rate each dimension from 0-100 and provide a brief reason:

1. walkability - How walkable is the main tourist/historic area?
2. foodScene - Quality and variety of restaurants, local cuisine reputation
3. culturalDepth - Museums, galleries, historic sites, cultural events
4. natureAccess - Parks, nearby nature, outdoor activities within reach
5. nightlife - Bars, clubs, evening entertainment options
6. familyFriendly - Kid-friendly attractions, safety, practical for families
7. budgetFriendly - Is it affordable for budget travelers?
8. luxuryOptions - High-end dining, hotels, experiences available?
9. offbeat - Unique, unusual, non-mainstream appeal
10. romantic - Suitable for couples, romantic atmosphere

Return JSON only:
{
  "walkability": { "score": 85, "reason": "Compact old town, pedestrian center" },
  "foodScene": { "score": 90, "reason": "..." },
  ...
}`;

    const response = await this.callClaudeJSON(
      'You are a knowledgeable travel analyst. Provide accurate, balanced assessments of city characteristics. Be specific and honest - not every city excels at everything.',
      prompt,
      { maxTokens: 1000 }
    );

    return response;
  }

  /**
   * Calculate scores for each dimension based on preferences
   */
  calculateDimensionScores(cityAnalysis, preferences, travellerType) {
    const scores = {};
    const interests = preferences?.interests || [];

    // Map interests to city dimensions
    const interestDimensionMap = {
      food: ['foodScene'],
      culinary: ['foodScene'],
      culture: ['culturalDepth'],
      art: ['culturalDepth'],
      history: ['culturalDepth'],
      nature: ['natureAccess'],
      outdoor: ['natureAccess'],
      hiking: ['natureAccess'],
      nightlife: ['nightlife'],
      party: ['nightlife'],
      shopping: ['walkability'], // Shopping usually better in walkable areas
      relaxation: ['natureAccess', 'walkability'],
      adventure: ['natureAccess', 'offbeat']
    };

    // Score primary interests (user explicitly stated)
    interests.forEach(interest => {
      const dimensions = interestDimensionMap[interest.toLowerCase()] || [];
      dimensions.forEach(dim => {
        if (cityAnalysis[dim]) {
          scores[dim] = {
            score: cityAnalysis[dim].score,
            reason: cityAnalysis[dim].reason,
            isPrimary: true,
            matchedInterest: interest
          };
        }
      });
    });

    // Add practical scores
    if (preferences?.pace === 'relaxed') {
      scores.walkability = {
        score: cityAnalysis.walkability?.score || 70,
        reason: cityAnalysis.walkability?.reason || 'Walkable areas available',
        isPrimary: false,
        matchedInterest: 'relaxed pace'
      };
    }

    if (preferences?.budget === 'budget') {
      scores.budgetFriendly = {
        score: cityAnalysis.budgetFriendly?.score || 60,
        reason: cityAnalysis.budgetFriendly?.reason || 'Budget options available',
        isPrimary: true,
        matchedInterest: 'budget travel'
      };
    }

    if (preferences?.budget === 'luxury') {
      scores.luxuryOptions = {
        score: cityAnalysis.luxuryOptions?.score || 70,
        reason: cityAnalysis.luxuryOptions?.reason || 'Luxury options available',
        isPrimary: true,
        matchedInterest: 'luxury experience'
      };
    }

    // Add traveller type specific scores
    if (travellerType === 'couple' || travellerType === 'honeymoon') {
      scores.romantic = {
        score: cityAnalysis.romantic?.score || 75,
        reason: cityAnalysis.romantic?.reason || 'Romantic atmosphere',
        isPrimary: true,
        matchedInterest: 'romantic trip'
      };
    }

    if (travellerType === 'family') {
      scores.familyFriendly = {
        score: cityAnalysis.familyFriendly?.score || 70,
        reason: cityAnalysis.familyFriendly?.reason || 'Family-friendly options',
        isPrimary: true,
        matchedInterest: 'family trip'
      };
    }

    // Always include walkability as baseline
    if (!scores.walkability) {
      scores.walkability = {
        score: cityAnalysis.walkability?.score || 70,
        reason: cityAnalysis.walkability?.reason || 'Walkable areas available',
        isPrimary: false,
        matchedInterest: 'general exploration'
      };
    }

    return scores;
  }

  /**
   * Generate human-readable reasons and warnings
   */
  async generateInsights(city, cityAnalysis, dimensionScores, preferences) {
    const reasons = [];
    const warnings = [];

    // Convert dimension scores to reasons/warnings
    Object.entries(dimensionScores).forEach(([dimension, data]) => {
      if (data.score >= 75) {
        reasons.push({
          preference: data.matchedInterest,
          match: data.reason,
          score: data.score
        });
      } else if (data.score < 50 && data.isPrimary) {
        warnings.push({
          preference: data.matchedInterest,
          gap: data.reason || `${dimension} may not meet expectations`,
          score: data.score
        });
      }
    });

    // Sort reasons by score (highest first)
    reasons.sort((a, b) => b.score - a.score);

    // Limit to top 4 reasons
    const topReasons = reasons.slice(0, 4);

    return { reasons: topReasons, warnings };
  }

  /**
   * Calculate overall weighted score
   */
  calculateOverallScore(dimensionScores, preferences) {
    const scores = Object.values(dimensionScores);
    if (scores.length === 0) return 75; // Default score

    // Weight primary interests higher
    const primaryScores = scores.filter(s => s.isPrimary);
    const secondaryScores = scores.filter(s => !s.isPrimary);

    let totalWeight = 0;
    let weightedSum = 0;

    // Primary interests get 2x weight
    primaryScores.forEach(s => {
      weightedSum += s.score * 2;
      totalWeight += 2;
    });

    // Secondary get 1x weight
    secondaryScores.forEach(s => {
      weightedSum += s.score;
      totalWeight += 1;
    });

    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 75;

    // Normalize to 0-100 range with some floor
    return Math.round(Math.max(40, Math.min(98, rawScore)));
  }

  /**
   * Generate fallback score using simple heuristics
   */
  generateFallbackScore(city, preferences) {
    // Simple keyword-based scoring
    const cityName = city.name.toLowerCase();
    let baseScore = 75;

    // Boost for well-known cities
    const popularCities = ['paris', 'rome', 'barcelona', 'amsterdam', 'florence', 'prague', 'vienna', 'lisbon'];
    if (popularCities.some(c => cityName.includes(c))) {
      baseScore += 10;
    }

    const reasons = [
      {
        preference: 'Exploration',
        match: 'Great destination for discovering',
        score: baseScore
      }
    ];

    const warnings = [];

    return {
      score: baseScore,
      reasons,
      warnings,
      dimensions: {}
    };
  }
}

module.exports = PreferenceAgent;
