/**
 * Personalization Reasoner Service
 *
 * Phase 3: Personalization Visibility (Sprint 3.1)
 *
 * Generates WHY a specific activity or restaurant matches user preferences.
 * Provides rich reasoning data that feeds into frontend components:
 * - WhyThisCard (confidence scores, category badges)
 * - MatchScoreIndicator (score breakdown by category)
 *
 * Key outputs:
 * - reasons: Array of categorized match reasons with confidence
 * - score: Overall match percentage (0-100)
 * - breakdown: Score contribution by category
 */

class PersonalizationReasoner {
  constructor() {
    // Category weights for score calculation
    this.categoryWeights = {
      occasion: 0.20,      // Trip occasion match (honeymoon, anniversary, etc.)
      dietary: 0.15,       // Dietary requirements match
      accessibility: 0.15, // Accessibility needs match
      interests: 0.20,     // Interest alignment
      pace: 0.10,          // Pace preference match
      budget: 0.10,        // Budget tier match
      style: 0.10          // Travel style match
    };
  }

  /**
   * Generate personalization reasoning for a single recommendation
   * @param {Object} recommendation - Activity or restaurant
   * @param {Object} personalization - User's preferences
   * @returns {Object} Match data with reasons, score, and breakdown
   */
  generateReasoning(recommendation, personalization) {
    if (!personalization || !recommendation) {
      return this.getDefaultMatch();
    }

    const reasons = [];
    const breakdown = {};

    // Analyze each category
    const occasionResult = this.analyzeOccasion(recommendation, personalization);
    if (occasionResult.score > 0) {
      reasons.push(...occasionResult.reasons);
      breakdown.occasion = { score: occasionResult.score, weight: this.categoryWeights.occasion, label: 'Trip Occasion' };
    }

    const dietaryResult = this.analyzeDietary(recommendation, personalization);
    if (dietaryResult.score > 0) {
      reasons.push(...dietaryResult.reasons);
      breakdown.dietary = { score: dietaryResult.score, weight: this.categoryWeights.dietary, label: 'Dietary' };
    }

    const accessibilityResult = this.analyzeAccessibility(recommendation, personalization);
    if (accessibilityResult.score > 0) {
      reasons.push(...accessibilityResult.reasons);
      breakdown.accessibility = { score: accessibilityResult.score, weight: this.categoryWeights.accessibility, label: 'Accessibility' };
    }

    const interestsResult = this.analyzeInterests(recommendation, personalization);
    if (interestsResult.score > 0) {
      reasons.push(...interestsResult.reasons);
      breakdown.interests = { score: interestsResult.score, weight: this.categoryWeights.interests, label: 'Your Interests' };
    }

    const paceResult = this.analyzePace(recommendation, personalization);
    if (paceResult.score > 0) {
      reasons.push(...paceResult.reasons);
      breakdown.pace = { score: paceResult.score, weight: this.categoryWeights.pace, label: 'Travel Pace' };
    }

    const budgetResult = this.analyzeBudget(recommendation, personalization);
    if (budgetResult.score > 0) {
      reasons.push(...budgetResult.reasons);
      breakdown.budget = { score: budgetResult.score, weight: this.categoryWeights.budget, label: 'Budget' };
    }

    const styleResult = this.analyzeStyle(recommendation, personalization);
    if (styleResult.score > 0) {
      reasons.push(...styleResult.reasons);
      breakdown.style = { score: styleResult.score, weight: this.categoryWeights.style, label: 'Travel Style' };
    }

    // Calculate overall score
    const score = this.calculateOverallScore(breakdown);

    // Sort reasons by confidence
    reasons.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    return {
      score: Math.round(score),
      reasons: reasons.slice(0, 5), // Top 5 reasons
      breakdown: Object.entries(breakdown).map(([category, data]) => ({
        category,
        ...data
      }))
    };
  }

  /**
   * Analyze occasion match
   */
  analyzeOccasion(rec, prefs) {
    const reasons = [];
    let score = 50; // Base score

    if (!prefs.occasion) {
      return { score: 0, reasons: [] };
    }

    const name = (rec.name || '').toLowerCase();
    const desc = (rec.description || '').toLowerCase();
    const types = (rec.types || []).map(t => t.toLowerCase());
    const combined = `${name} ${desc} ${types.join(' ')}`;

    const occasionKeywords = {
      honeymoon: ['romantic', 'intimate', 'couples', 'luxury', 'sunset', 'candlelit', 'champagne', 'spa', 'private', 'secluded'],
      anniversary: ['romantic', 'elegant', 'fine dining', 'special', 'celebration', 'intimate'],
      birthday: ['celebration', 'party', 'festive', 'fun', 'lively', 'special'],
      'family-vacation': ['family', 'kids', 'children', 'playground', 'interactive', 'educational'],
      'solo-adventure': ['solo', 'independent', 'local', 'authentic', 'community'],
      'girls-trip': ['fun', 'trendy', 'spa', 'brunch', 'shopping', 'lively'],
      'guys-trip': ['sports', 'craft beer', 'adventure', 'action', 'pub', 'games']
    };

    const keywords = occasionKeywords[prefs.occasion] || [];
    const matches = keywords.filter(kw => combined.includes(kw));

    if (matches.length >= 3) {
      score = 95;
      reasons.push({
        category: 'occasion',
        text: `Perfect for your ${this.formatOccasion(prefs.occasion)}`,
        confidence: 0.95
      });
    } else if (matches.length >= 2) {
      score = 80;
      reasons.push({
        category: 'occasion',
        text: `Great choice for ${this.formatOccasion(prefs.occasion)}s`,
        confidence: 0.80
      });
    } else if (matches.length >= 1) {
      score = 65;
      reasons.push({
        category: 'occasion',
        text: `Suitable for your ${this.formatOccasion(prefs.occasion)}`,
        confidence: 0.65
      });
    }

    return { score, reasons };
  }

  /**
   * Analyze dietary requirements match
   */
  analyzeDietary(rec, prefs) {
    const reasons = [];
    let score = 50;

    if (!prefs.dietary || prefs.dietary.length === 0) {
      return { score: 0, reasons: [] };
    }

    const desc = (rec.description || '').toLowerCase();
    const name = (rec.name || '').toLowerCase();
    const combined = `${name} ${desc}`;

    const dietaryKeywords = {
      vegetarian: ['vegetarian', 'vegan', 'plant-based', 'veggie'],
      vegan: ['vegan', 'plant-based'],
      'gluten-free': ['gluten-free', 'gluten free', 'celiac'],
      halal: ['halal'],
      kosher: ['kosher'],
      'dairy-free': ['dairy-free', 'dairy free', 'lactose']
    };

    let matchCount = 0;
    for (const diet of prefs.dietary) {
      const keywords = dietaryKeywords[diet] || [];
      if (keywords.some(kw => combined.includes(kw))) {
        matchCount++;
        reasons.push({
          category: 'dietary',
          text: `Offers ${diet} options`,
          confidence: 0.90
        });
      }
    }

    if (matchCount > 0) {
      score = 60 + (matchCount * 15);
    }

    return { score: Math.min(score, 100), reasons };
  }

  /**
   * Analyze accessibility match
   */
  analyzeAccessibility(rec, prefs) {
    const reasons = [];
    let score = 50;

    if (!prefs.accessibility || prefs.accessibility.length === 0) {
      return { score: 0, reasons: [] };
    }

    const desc = (rec.description || '').toLowerCase();
    const combined = `${desc} ${(rec.types || []).join(' ')}`;

    const accessibilityKeywords = {
      wheelchair: ['wheelchair', 'accessible', 'step-free', 'ramp', 'elevator'],
      'limited-mobility': ['easy access', 'flat', 'ground level', 'accessible'],
      'visual-impairment': ['audio guide', 'braille', 'tactile'],
      'hearing-impairment': ['sign language', 'captions', 'hearing loop']
    };

    let matchCount = 0;
    for (const need of prefs.accessibility) {
      const keywords = accessibilityKeywords[need] || [];
      if (keywords.some(kw => combined.includes(kw))) {
        matchCount++;
        reasons.push({
          category: 'accessibility',
          text: need === 'wheelchair' ? 'Wheelchair accessible' : `Accommodates ${need.replace('-', ' ')}`,
          confidence: 0.85
        });
      }
    }

    if (matchCount > 0) {
      score = 70 + (matchCount * 10);
    }

    return { score: Math.min(score, 100), reasons };
  }

  /**
   * Analyze interests match
   */
  analyzeInterests(rec, prefs) {
    const reasons = [];
    let score = 50;

    if (!prefs.interests || prefs.interests.length === 0) {
      return { score: 0, reasons: [] };
    }

    const desc = (rec.description || '').toLowerCase();
    const name = (rec.name || '').toLowerCase();
    const types = (rec.types || []).map(t => t.toLowerCase());
    const combined = `${name} ${desc} ${types.join(' ')}`;

    const interestKeywords = {
      history: ['historic', 'history', 'ancient', 'century', 'medieval', 'heritage', 'museum'],
      art: ['art', 'gallery', 'museum', 'exhibition', 'painting', 'sculpture'],
      nature: ['nature', 'park', 'garden', 'trail', 'wildlife', 'scenic', 'outdoor'],
      food: ['food', 'culinary', 'cuisine', 'gastronomy', 'tasting', 'market'],
      wine: ['wine', 'vineyard', 'winery', 'cellar', 'tasting'],
      adventure: ['adventure', 'extreme', 'thrilling', 'hiking', 'climbing'],
      architecture: ['architecture', 'building', 'cathedral', 'palace', 'castle'],
      photography: ['viewpoint', 'scenic', 'panoramic', 'vista', 'photo spot'],
      nightlife: ['bar', 'club', 'nightlife', 'cocktail', 'live music'],
      wellness: ['spa', 'wellness', 'relaxation', 'thermal', 'massage']
    };

    let matchCount = 0;
    for (const interest of prefs.interests) {
      const keywords = interestKeywords[interest] || [];
      if (keywords.some(kw => combined.includes(kw))) {
        matchCount++;
        reasons.push({
          category: 'interests',
          text: `Matches your love of ${interest}`,
          confidence: 0.80 + (matchCount * 0.05)
        });
      }
    }

    if (matchCount >= 3) {
      score = 95;
    } else if (matchCount >= 2) {
      score = 85;
    } else if (matchCount >= 1) {
      score = 70;
    }

    return { score, reasons: reasons.slice(0, 2) }; // Max 2 interest reasons
  }

  /**
   * Analyze pace preference match
   */
  analyzePace(rec, prefs) {
    const reasons = [];
    let score = 50;

    if (prefs.pace === undefined) {
      return { score: 0, reasons: [] };
    }

    const desc = (rec.description || '').toLowerCase();
    const duration = rec.duration || rec.estimatedDuration;

    // Slow pace (1-2): Prefers leisurely, relaxed
    // Medium pace (3): Balanced
    // Fast pace (4-5): Prefers quick visits, action-packed

    if (prefs.pace <= 2) {
      // Slow travelers
      const slowKeywords = ['leisurely', 'relaxed', 'peaceful', 'quiet', 'tranquil', 'slow'];
      if (slowKeywords.some(kw => desc.includes(kw)) || (duration && duration >= 120)) {
        score = 85;
        reasons.push({
          category: 'pace',
          text: 'Perfect for leisurely exploration',
          confidence: 0.80
        });
      }
    } else if (prefs.pace >= 4) {
      // Fast travelers
      const fastKeywords = ['quick', 'highlight', 'must-see', 'popular', 'efficient'];
      if (fastKeywords.some(kw => desc.includes(kw)) || (duration && duration <= 60)) {
        score = 85;
        reasons.push({
          category: 'pace',
          text: 'Efficient experience for active travelers',
          confidence: 0.80
        });
      }
    } else {
      // Balanced pace
      score = 70;
      reasons.push({
        category: 'pace',
        text: 'Fits your balanced travel pace',
        confidence: 0.65
      });
    }

    return { score, reasons };
  }

  /**
   * Analyze budget match
   */
  analyzeBudget(rec, prefs) {
    const reasons = [];
    let score = 50;

    if (!prefs.budget) {
      return { score: 0, reasons: [] };
    }

    const priceLevel = rec.priceLevel || rec.price_level;
    const desc = (rec.description || '').toLowerCase();

    const budgetMapping = {
      budget: { level: 1, keywords: ['budget', 'affordable', 'cheap', 'free'] },
      moderate: { level: 2, keywords: ['moderate', 'reasonable', 'mid-range'] },
      comfort: { level: 3, keywords: ['quality', 'comfortable', 'nice'] },
      luxury: { level: 4, keywords: ['luxury', 'premium', 'exclusive', 'fine', 'upscale'] }
    };

    const userBudget = budgetMapping[prefs.budget];
    if (!userBudget) {
      return { score: 0, reasons: [] };
    }

    // Check price level
    if (priceLevel) {
      const diff = Math.abs(priceLevel - userBudget.level);
      if (diff === 0) {
        score = 90;
        reasons.push({
          category: 'budget',
          text: `Matches your ${prefs.budget} budget`,
          confidence: 0.90
        });
      } else if (diff === 1) {
        score = 70;
        reasons.push({
          category: 'budget',
          text: 'Within your price range',
          confidence: 0.70
        });
      }
    }

    // Check keywords
    if (userBudget.keywords.some(kw => desc.includes(kw))) {
      score = Math.max(score, 75);
      if (reasons.length === 0) {
        reasons.push({
          category: 'budget',
          text: `Fits your ${prefs.budget} preferences`,
          confidence: 0.75
        });
      }
    }

    return { score, reasons };
  }

  /**
   * Analyze travel style match
   */
  analyzeStyle(rec, prefs) {
    const reasons = [];
    let score = 50;

    if (!prefs.travelStyle) {
      return { score: 0, reasons: [] };
    }

    const desc = (rec.description || '').toLowerCase();
    const types = (rec.types || []).map(t => t.toLowerCase());
    const combined = `${desc} ${types.join(' ')}`;

    const styleKeywords = {
      explorer: ['discover', 'explore', 'hidden gem', 'local', 'authentic', 'off-beaten'],
      relaxer: ['relax', 'peaceful', 'calm', 'spa', 'beach', 'garden', 'serene'],
      culture: ['museum', 'historic', 'cultural', 'heritage', 'art', 'tradition'],
      adventurer: ['adventure', 'hiking', 'extreme', 'active', 'outdoor', 'thrill'],
      foodie: ['culinary', 'gastronomy', 'food', 'tasting', 'chef', 'local cuisine']
    };

    const keywords = styleKeywords[prefs.travelStyle] || [];
    const matches = keywords.filter(kw => combined.includes(kw));

    if (matches.length >= 2) {
      score = 90;
      reasons.push({
        category: 'style',
        text: `Perfect for ${prefs.travelStyle}s like you`,
        confidence: 0.90
      });
    } else if (matches.length >= 1) {
      score = 75;
      reasons.push({
        category: 'style',
        text: `Matches your ${prefs.travelStyle} style`,
        confidence: 0.75
      });
    }

    return { score, reasons };
  }

  /**
   * Calculate overall score from breakdown
   */
  calculateOverallScore(breakdown) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [category, data] of Object.entries(breakdown)) {
      const weight = this.categoryWeights[category] || 0.1;
      totalWeight += weight;
      weightedSum += data.score * weight;
    }

    // If no categories matched, return base score
    if (totalWeight === 0) {
      return 60; // Base score for unmatched items
    }

    return weightedSum / totalWeight;
  }

  /**
   * Get default match when no personalization
   */
  getDefaultMatch() {
    return {
      score: 70,
      reasons: [
        {
          category: 'style',
          text: 'Popular recommendation for this area',
          confidence: 0.70
        }
      ],
      breakdown: []
    };
  }

  /**
   * Format occasion for display
   */
  formatOccasion(occasion) {
    const labels = {
      honeymoon: 'honeymoon',
      anniversary: 'anniversary',
      birthday: 'birthday trip',
      'family-vacation': 'family vacation',
      'solo-adventure': 'solo adventure',
      'girls-trip': "girls' trip",
      'guys-trip': "guys' trip",
      graduation: 'graduation trip',
      retirement: 'retirement celebration',
      babymoon: 'babymoon',
      reunion: 'reunion',
      'just-because': 'getaway'
    };
    return labels[occasion] || occasion;
  }

  /**
   * Batch process multiple recommendations
   * @param {Array} recommendations - Activities or restaurants
   * @param {Object} personalization - User's preferences
   * @returns {Array} Array of recommendations with personalizationMatch added
   */
  processRecommendations(recommendations, personalization) {
    return recommendations.map(rec => ({
      ...rec,
      personalizationMatch: this.generateReasoning(rec, personalization)
    }));
  }
}

module.exports = PersonalizationReasoner;
