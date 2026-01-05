/**
 * CitySearchStrategies
 *
 * Defines search strategies for different user intents.
 * Each strategy specifies which sources to query, what signals to look for,
 * and how to rank results.
 *
 * This is the "brain" behind intelligent city search - it knows that
 * "foodie cities" means searching for Michelin stars and food markets,
 * while "hidden gems" means looking for low tourist counts but high
 * local sentiment.
 */

// ============================================================================
// Intent Classification
// ============================================================================

const INTENT_KEYWORDS = {
  foodie: [
    'food', 'foodie', 'culinary', 'gastronom', 'restaurant', 'michelin',
    'cuisine', 'eat', 'wine', 'vineyard', 'market', 'chef', 'bistro',
    'gastronomic', 'gourmet', 'delicious', 'taste', 'flavor'
  ],
  hidden_gem: [
    'hidden', 'gem', 'secret', 'undiscovered', 'off-beat', 'offbeat',
    'unusual', 'quirky', 'unique', 'authentic', 'local', 'unknown',
    'lesser-known', 'underrated', 'overlooked', 'untouristy'
  ],
  coastal: [
    'coast', 'coastal', 'beach', 'sea', 'ocean', 'port', 'harbor',
    'harbour', 'seaside', 'mediterranean', 'atlantic', 'water',
    'maritime', 'fishing', 'island', 'bay', 'cove'
  ],
  historic: [
    'historic', 'history', 'medieval', 'ancient', 'roman', 'castle',
    'cathedral', 'unesco', 'heritage', 'old', 'monument', 'ruins',
    'archaeological', 'fortress', 'palace', 'renaissance'
  ],
  artistic: [
    'art', 'artistic', 'museum', 'gallery', 'artist', 'creative',
    'culture', 'cultural', 'music', 'theater', 'theatre', 'design',
    'architecture', 'picasso', 'matisse', 'van gogh', 'impressionist'
  ],
  nature: [
    'nature', 'natural', 'hiking', 'mountain', 'park', 'forest',
    'lake', 'river', 'outdoor', 'scenic', 'landscape', 'wildlife',
    'gorge', 'canyon', 'waterfall', 'trail', 'green', 'countryside'
  ],
  nightlife: [
    'nightlife', 'night', 'party', 'bar', 'club', 'dancing',
    'entertainment', 'lively', 'vibrant', 'young', 'student',
    'festival', 'music venue', 'pub', 'cocktail'
  ],
  relaxation: [
    'relax', 'relaxation', 'peaceful', 'quiet', 'calm', 'spa',
    'wellness', 'tranquil', 'serene', 'slow', 'retreat', 'escape',
    'unwind', 'rest', 'lazy', 'chill'
  ],
  romantic: [
    'romantic', 'romance', 'couple', 'honeymoon', 'charming',
    'picturesque', 'beautiful', 'sunset', 'intimate', 'cozy',
    'lovely', 'enchanting', 'fairy-tale', 'dreamy'
  ],
  adventure: [
    'adventure', 'adventurous', 'thrill', 'extreme', 'sport',
    'climbing', 'kayak', 'surf', 'dive', 'cycling', 'active',
    'adrenaline', 'exciting', 'challenge'
  ]
};

/**
 * Classify user intent from their query
 * Returns array of intents with confidence scores
 */
function classifyIntent(query) {
  const normalizedQuery = query.toLowerCase();
  const scores = {};

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    let matchedKeywords = [];

    for (const keyword of keywords) {
      if (normalizedQuery.includes(keyword)) {
        score += keyword.length > 5 ? 2 : 1; // Longer keywords = stronger signal
        matchedKeywords.push(keyword);
      }
    }

    if (score > 0) {
      scores[intent] = {
        score,
        confidence: Math.min(score / 5, 1), // Cap at 1.0
        matchedKeywords
      };
    }
  }

  // Sort by score descending
  const sortedIntents = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([intent, data]) => ({ intent, ...data }));

  // If no matches, default to general discovery
  if (sortedIntents.length === 0) {
    return [{ intent: 'general', score: 1, confidence: 0.5, matchedKeywords: [] }];
  }

  return sortedIntents;
}

// ============================================================================
// Search Strategies by Intent
// ============================================================================

const SEARCH_STRATEGIES = {
  foodie: {
    description: 'Search for cities known for culinary excellence',
    sources: [
      {
        type: 'curated',
        filter: city => city.tags?.some(t =>
          ['gastronomy', 'food', 'wine', 'michelin', 'culinary'].includes(t)
        ),
        weight: 1.5
      },
      {
        type: 'perplexity',
        queryTemplate: 'Best food and culinary cities near {region} for travelers',
        weight: 1.2
      },
      {
        type: 'google_places',
        placeTypes: ['restaurant', 'food', 'bakery', 'cafe'],
        minRating: 4.5,
        weight: 1.0
      }
    ],
    rankingSignals: [
      { signal: 'michelin_stars', weight: 3.0 },
      { signal: 'food_market_count', weight: 2.0 },
      { signal: 'restaurant_density', weight: 1.5 },
      { signal: 'regional_cuisine_reputation', weight: 2.0 }
    ],
    boostKeywords: ['michelin', 'gastronomy', 'bouchon', 'market', 'vineyard']
  },

  hidden_gem: {
    description: 'Search for lesser-known but charming destinations',
    sources: [
      {
        type: 'curated',
        filter: city => city.hiddenGem === true ||
          (city.touristLevel === 'low' && city.localRating >= 4.0),
        weight: 2.0
      },
      {
        type: 'perplexity',
        queryTemplate: 'Hidden gem towns and lesser-known destinations near {region} that locals love',
        weight: 1.5
      }
    ],
    rankingSignals: [
      { signal: 'inverse_popularity', weight: 2.5 }, // Less popular = better
      { signal: 'local_sentiment', weight: 2.0 },
      { signal: 'authenticity_score', weight: 1.5 },
      { signal: 'unique_attractions', weight: 1.0 }
    ],
    boostKeywords: ['secret', 'local', 'authentic', 'undiscovered', 'charming'],
    penalizeKeywords: ['tourist', 'crowded', 'famous', 'popular']
  },

  coastal: {
    description: 'Search for seaside and coastal destinations',
    sources: [
      {
        type: 'curated',
        filter: city => city.tags?.some(t =>
          ['coastal', 'beach', 'port', 'mediterranean', 'seaside'].includes(t)
        ) || city.nearWater === true,
        weight: 1.5
      },
      {
        type: 'geographic',
        filter: { maxDistanceFromCoast: 20 }, // km
        weight: 2.0
      },
      {
        type: 'perplexity',
        queryTemplate: 'Beautiful coastal towns and seaside destinations near {region}',
        weight: 1.0
      }
    ],
    rankingSignals: [
      { signal: 'beach_quality', weight: 2.0 },
      { signal: 'port_charm', weight: 1.5 },
      { signal: 'coastal_activities', weight: 1.0 },
      { signal: 'seafood_reputation', weight: 1.0 }
    ],
    boostKeywords: ['harbor', 'beach', 'cove', 'fishing', 'marina', 'promenade']
  },

  historic: {
    description: 'Search for cities rich in history and heritage',
    sources: [
      {
        type: 'curated',
        filter: city => city.tags?.some(t =>
          ['historic', 'medieval', 'roman', 'unesco', 'heritage'].includes(t)
        ),
        weight: 1.5
      },
      {
        type: 'perplexity',
        queryTemplate: 'Historic cities with medieval old towns and UNESCO sites near {region}',
        weight: 1.2
      },
      {
        type: 'google_places',
        placeTypes: ['museum', 'church', 'tourist_attraction'],
        keywords: ['historic', 'medieval', 'castle', 'cathedral'],
        weight: 1.0
      }
    ],
    rankingSignals: [
      { signal: 'unesco_sites', weight: 3.0 },
      { signal: 'monument_density', weight: 2.0 },
      { signal: 'old_town_quality', weight: 1.5 },
      { signal: 'historical_significance', weight: 2.0 }
    ],
    boostKeywords: ['unesco', 'medieval', 'roman', 'castle', 'cathedral', 'heritage']
  },

  artistic: {
    description: 'Search for cities with strong art and culture scenes',
    sources: [
      {
        type: 'curated',
        filter: city => city.tags?.some(t =>
          ['art', 'culture', 'museums', 'architecture', 'creative'].includes(t)
        ),
        weight: 1.5
      },
      {
        type: 'perplexity',
        queryTemplate: 'Cities with great art museums and cultural attractions near {region}',
        weight: 1.2
      },
      {
        type: 'google_places',
        placeTypes: ['museum', 'art_gallery'],
        minRating: 4.0,
        weight: 1.0
      }
    ],
    rankingSignals: [
      { signal: 'museum_quality', weight: 2.5 },
      { signal: 'gallery_density', weight: 1.5 },
      { signal: 'artist_connections', weight: 2.0 },
      { signal: 'architectural_significance', weight: 1.5 }
    ],
    boostKeywords: ['museum', 'gallery', 'artist', 'architecture', 'design']
  },

  nature: {
    description: 'Search for destinations with natural beauty',
    sources: [
      {
        type: 'curated',
        filter: city => city.tags?.some(t =>
          ['nature', 'hiking', 'mountains', 'national_park', 'scenic'].includes(t)
        ),
        weight: 1.5
      },
      {
        type: 'perplexity',
        queryTemplate: 'Towns near natural parks and scenic landscapes in {region} for outdoor lovers',
        weight: 1.3
      }
    ],
    rankingSignals: [
      { signal: 'park_proximity', weight: 2.5 },
      { signal: 'trail_quality', weight: 2.0 },
      { signal: 'scenic_views', weight: 1.5 },
      { signal: 'outdoor_activities', weight: 1.5 }
    ],
    boostKeywords: ['park', 'gorge', 'mountain', 'trail', 'lake', 'forest']
  },

  nightlife: {
    description: 'Search for cities with vibrant nightlife',
    sources: [
      {
        type: 'curated',
        filter: city => city.tags?.some(t =>
          ['nightlife', 'party', 'young', 'student', 'vibrant'].includes(t)
        ),
        weight: 1.5
      },
      {
        type: 'perplexity',
        queryTemplate: 'Cities with best nightlife and entertainment near {region}',
        weight: 1.2
      }
    ],
    rankingSignals: [
      { signal: 'bar_density', weight: 2.0 },
      { signal: 'club_scene', weight: 1.5 },
      { signal: 'festival_calendar', weight: 1.5 },
      { signal: 'young_population', weight: 1.0 }
    ],
    boostKeywords: ['bar', 'club', 'festival', 'music', 'entertainment']
  },

  relaxation: {
    description: 'Search for peaceful, relaxing destinations',
    sources: [
      {
        type: 'curated',
        filter: city => city.tags?.some(t =>
          ['relaxation', 'spa', 'peaceful', 'quiet', 'wellness'].includes(t)
        ) || city.touristLevel === 'low',
        weight: 1.5
      },
      {
        type: 'perplexity',
        queryTemplate: 'Peaceful quiet towns for relaxation and wellness near {region}',
        weight: 1.2
      }
    ],
    rankingSignals: [
      { signal: 'tranquility_score', weight: 2.5 },
      { signal: 'spa_facilities', weight: 1.5 },
      { signal: 'inverse_crowd_level', weight: 2.0 },
      { signal: 'natural_setting', weight: 1.5 }
    ],
    boostKeywords: ['spa', 'wellness', 'quiet', 'peaceful', 'retreat'],
    penalizeKeywords: ['busy', 'crowded', 'party', 'nightlife']
  },

  romantic: {
    description: 'Search for romantic, charming destinations',
    sources: [
      {
        type: 'curated',
        filter: city => city.tags?.some(t =>
          ['romantic', 'charming', 'picturesque', 'beautiful'].includes(t)
        ),
        weight: 1.5
      },
      {
        type: 'perplexity',
        queryTemplate: 'Most romantic and charming towns for couples near {region}',
        weight: 1.3
      }
    ],
    rankingSignals: [
      { signal: 'charm_score', weight: 2.5 },
      { signal: 'scenic_beauty', weight: 2.0 },
      { signal: 'intimate_dining', weight: 1.5 },
      { signal: 'romantic_activities', weight: 1.5 }
    ],
    boostKeywords: ['charming', 'beautiful', 'romantic', 'sunset', 'intimate']
  },

  adventure: {
    description: 'Search for destinations with adventure activities',
    sources: [
      {
        type: 'curated',
        filter: city => city.tags?.some(t =>
          ['adventure', 'sports', 'active', 'outdoor', 'extreme'].includes(t)
        ),
        weight: 1.5
      },
      {
        type: 'perplexity',
        queryTemplate: 'Best adventure and outdoor activity destinations near {region}',
        weight: 1.3
      }
    ],
    rankingSignals: [
      { signal: 'activity_variety', weight: 2.0 },
      { signal: 'adventure_sports', weight: 2.5 },
      { signal: 'terrain_quality', weight: 1.5 },
      { signal: 'equipment_rental', weight: 1.0 }
    ],
    boostKeywords: ['adventure', 'sports', 'climbing', 'kayak', 'surf', 'cycling']
  },

  general: {
    description: 'General city search with balanced criteria',
    sources: [
      {
        type: 'curated',
        filter: () => true, // All cities
        weight: 1.0
      },
      {
        type: 'perplexity',
        queryTemplate: 'Best cities and towns to visit near {region}',
        weight: 1.0
      }
    ],
    rankingSignals: [
      { signal: 'overall_rating', weight: 1.5 },
      { signal: 'visitor_satisfaction', weight: 1.5 },
      { signal: 'attraction_variety', weight: 1.0 },
      { signal: 'accessibility', weight: 1.0 }
    ],
    boostKeywords: []
  }
};

/**
 * Get search strategy for a given intent
 */
function getStrategy(intent) {
  return SEARCH_STRATEGIES[intent] || SEARCH_STRATEGIES.general;
}

/**
 * Build Perplexity query from strategy template
 */
function buildPerplexityQuery(strategy, context) {
  const source = strategy.sources.find(s => s.type === 'perplexity');
  if (!source) return null;

  let query = source.queryTemplate;

  // Replace placeholders
  if (context.region) {
    query = query.replace('{region}', context.region);
  }
  if (context.nearCity) {
    query = query.replace('{region}', `${context.nearCity}`);
  }
  if (context.countries) {
    query = query.replace('{region}', context.countries.join(' and '));
  }

  return query;
}

/**
 * Score a city against a strategy
 */
function scoreCityForStrategy(city, strategy, query) {
  let score = 0;
  const reasons = [];

  // Apply boost keywords
  if (strategy.boostKeywords) {
    for (const keyword of strategy.boostKeywords) {
      if (city.description?.toLowerCase().includes(keyword) ||
          city.tags?.some(t => t.includes(keyword)) ||
          city.highlights?.some(h => h.toLowerCase().includes(keyword))) {
        score += 1;
        reasons.push(`Matches "${keyword}"`);
      }
    }
  }

  // Apply penalty keywords
  if (strategy.penalizeKeywords) {
    for (const keyword of strategy.penalizeKeywords) {
      if (city.description?.toLowerCase().includes(keyword)) {
        score -= 0.5;
        reasons.push(`Penalized for "${keyword}"`);
      }
    }
  }

  // Base quality score
  if (city.rating) {
    score += city.rating / 5 * 2; // 0-2 points for rating
    reasons.push(`Rating: ${city.rating}`);
  }

  // Hidden gem bonus
  if (city.hiddenGem && strategy === SEARCH_STRATEGIES.hidden_gem) {
    score += 3;
    reasons.push('Marked as hidden gem');
  }

  return { score, reasons };
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  classifyIntent,
  getStrategy,
  buildPerplexityQuery,
  scoreCityForStrategy,
  SEARCH_STRATEGIES,
  INTENT_KEYWORDS
};
