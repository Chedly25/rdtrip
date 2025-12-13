/**
 * Card Generation Service
 *
 * Uses Claude to generate place suggestions based on:
 * - City context
 * - User preferences
 * - Existing plan (for relevance)
 * - Filters (price, type, proximity)
 */

const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');

// Initialize Anthropic client
const anthropic = new Anthropic();

// ============================================
// ID Generation
// ============================================

function generateId(prefix = 'card') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

// ============================================
// Prompt Templates
// ============================================

function buildRestaurantPrompt(request) {
  const {
    city,
    count,
    travelerType,
    preferences,
    priceRange,
    nights,
    clusterNames,
    existingRestaurants,
    excludeNames,
  } = request;

  return `Generate ${count} restaurant recommendations for ${city} for a ${travelerType || 'couple'} trip.

## User Context
- Traveler type: ${travelerType || 'couple'}
- Preferences: ${preferences || 'quality local food, authentic experiences'}
- Budget: ${priceRange || 'moderate'}
- Nights in city: ${nights || 2}

## Current Plan Context
- Areas they're visiting: ${clusterNames?.join(', ') || 'city center'}
- Restaurants already in plan: ${existingRestaurants?.join(', ') || 'none yet'}

## Requirements
1. ${count} unique restaurants, not duplicating: ${excludeNames?.join(', ') || 'none'}
2. Mix of:
   - At least 1 within 10-min walk of city center
   - Different cuisines unless they specified one
   - Different price points within their range
3. Focus on:
   - Where locals actually eat (not tourist traps)
   - Places with character/story
   - Good value at each price point
4. For couples: romantic atmosphere matters
5. Each must have accurate location (lat/lng) for ${city}

## Output Format
Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "id": "rest-${Date.now()}-unique",
    "type": "restaurant",
    "name": "Restaurant Name",
    "description": "1-2 sentences about what makes it special",
    "whyGreat": "Why this matches their trip specifically",
    "location": {
      "lat": 43.2965,
      "lng": 5.3698,
      "address": "123 Rue Example",
      "area": "Le Panier"
    },
    "duration": 90,
    "priceLevel": 2,
    "priceEstimate": "€25-35 per person",
    "bestTime": "dinner",
    "tags": ["seafood", "romantic", "waterfront"]
  }
]

Generate ${count} restaurants now:`;
}

function buildActivityPrompt(request) {
  const {
    city,
    count,
    travelerType,
    preferences,
    nights,
    clusterNames,
    existingActivities,
    excludeNames,
    season,
  } = request;

  return `You are recommending places to TOURISTS visiting ${city} for ${nights || 2} nights.

## CRITICAL: What Tourists Actually Want

Tourists visiting ${city} want to see what makes this city FAMOUS. They want the bucket-list items, the Instagram shots, the "must-sees" that ${city} is known for.

## Priority Hierarchy (FOLLOW THIS STRICTLY)

**1. ICONIC LANDMARKS & MONUMENTS (50% of your suggestions)**
Examples of what this means:
- Paris → Eiffel Tower, Notre-Dame, Arc de Triomphe
- Rome → Colosseum, Trevi Fountain, Pantheon
- Barcelona → Sagrada Familia, Park Güell, La Rambla
- Amsterdam → Anne Frank House, Rijksmuseum, Canal Ring

For ${city}, think: What are the 5 places that DEFINE this city? What appears on every postcard? What would a tourist regret missing?

**2. WORLD-CLASS MUSEUMS & CULTURAL SITES (25% of suggestions)**
- Major museums with renowned collections
- UNESCO World Heritage sites
- Famous churches, cathedrals, palaces
- Historic districts or neighborhoods worth exploring

**3. GENUINE LOCAL EXPERIENCES (25% of suggestions)**
- Charming neighborhoods for walking
- Scenic viewpoints
- Famous local markets
- ONLY workshops/classes if they're ICONIC to ${city}
  (Example: Pasta-making in Rome = YES. Random pottery class = NO)

## NEVER SUGGEST (These are banned)
- Generic workshops (pottery, photography, cooking classes unless world-famous)
- "Hidden courtyard hunts" or scavenger-type activities
- "Photography walks" or "food tours" unless it's a specific famous location
- Activities that exist in every city (escape rooms, bike rentals, etc.)
- Airbnb Experience-style filler content

## Already Planned (exclude these)
${existingActivities?.join(', ') || 'nothing yet'}

## Output Requirements
Generate exactly ${count} places, not duplicating: ${excludeNames?.join(', ') || 'none'}

Each must have:
- Real, accurate coordinates for ${city}
- Actual place names (not made-up activities)
- Realistic duration and pricing

## Output Format
Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "id": "act-${Date.now()}-unique",
    "type": "activity",
    "name": "Actual Place Name",
    "description": "What it is and why it's worth visiting",
    "whyGreat": "Why tourists love this place",
    "location": {
      "lat": 43.2965,
      "lng": 5.3698,
      "address": "Real street address",
      "area": "Neighborhood name"
    },
    "duration": 120,
    "priceLevel": 2,
    "priceEstimate": "€15 or Free",
    "bestTime": "morning",
    "tags": ["landmark", "must-see", "historic"]
  }
]

Generate ${count} must-visit places in ${city}:`;
}

function buildPhotoSpotPrompt(request) {
  const {
    city,
    count,
    travelerType,
    clusterNames,
    excludeNames,
  } = request;

  return `You are recommending the BEST photo spots in ${city} for tourists.

## What Makes a Great Tourist Photo Spot

These are the locations where tourists take their BEST, most memorable photos. Think:
- Where do people post their ${city} photos on Instagram?
- What views appear on postcards and travel magazines?
- What are the "money shots" every visitor wants?

## Priority Hierarchy (FOLLOW STRICTLY)

**1. ICONIC VIEWPOINTS & LANDMARKS (60% of suggestions)**
The famous shots everyone wants:
- Panoramic city views from famous viewpoints
- In front of/with famous landmarks as backdrop
- Classic architectural shots (bridges, squares, monuments)
- The angles that made ${city} famous

Examples:
- Paris → Trocadéro view of Eiffel Tower, Sacré-Cœur steps
- Barcelona → Park Güell mosaic bench, Bunkers del Carmel sunset
- Amsterdam → Skinny Bridge at dusk, canal house reflections

**2. PHOTOGENIC ARCHITECTURE & STREETS (30% of suggestions)**
- Colorful or historic streets worth photographing
- Famous bridges, staircases, or courtyards
- Unique architectural features specific to ${city}
- Charming squares and plazas

**3. SCENIC NATURE SPOTS (10% of suggestions)**
- Waterfront locations with city skyline
- Parks with famous views
- Gardens or natural features

## NEVER SUGGEST
- "Photography walks" or "photo tours" (those aren't places)
- Generic parks without scenic value
- Spots that require hiring a guide
- Interior-only locations (museums, etc.)

## Output Requirements
Generate exactly ${count} photo spots, not duplicating: ${excludeNames?.join(', ') || 'none'}

Each must have:
- Exact coordinates where to stand/shoot
- Specific location name (not "somewhere in old town")
- Best time of day for lighting
- Free access (or note if paid entry required)

## Output Format
Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "id": "photo-${Date.now()}-unique",
    "type": "photo_spot",
    "name": "Specific Location Name",
    "description": "What shot you'll get and why it's special",
    "whyGreat": "The iconic photo you'll capture here",
    "location": {
      "lat": 43.2965,
      "lng": 5.3698,
      "address": "Exact viewpoint location",
      "area": "Neighborhood"
    },
    "duration": 30,
    "priceLevel": 1,
    "priceEstimate": "Free",
    "bestTime": "sunset",
    "tags": ["panorama", "iconic", "instagram"]
  }
]

Generate ${count} must-photograph spots in ${city}:`;
}

function buildBarPrompt(request) {
  const {
    city,
    count,
    travelerType,
    priceRange,
    clusterNames,
    excludeNames,
  } = request;

  return `Generate ${count} bar and cafe recommendations for ${city} for a ${travelerType || 'couple'} trip.

## User Context
- Traveler type: ${travelerType || 'couple'}
- Budget: ${priceRange || 'moderate'}
- Areas they're visiting: ${clusterNames?.join(', ') || 'city center'}

## Requirements
1. ${count} unique bars/cafes, not duplicating: ${excludeNames?.join(', ') || 'none'}
2. Mix of:
   - Wine bars, cocktail bars, casual cafes
   - Different vibes (romantic, lively, chill)
   - Different price points
3. For couples: atmosphere and ambiance matter
4. Include at least one with a view or special setting

## Output Format
Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "id": "bar-${Date.now()}-unique",
    "type": "bar",
    "name": "Bar Name",
    "description": "What makes this place special",
    "whyGreat": "Why it's perfect for their trip",
    "location": {
      "lat": 43.2965,
      "lng": 5.3698,
      "address": "Address",
      "area": "Le Panier"
    },
    "duration": 60,
    "priceLevel": 2,
    "priceEstimate": "€8-15 per drink",
    "bestTime": "evening",
    "tags": ["wine", "romantic", "terrace"]
  }
]

Generate ${count} bars/cafes now:`;
}

// ============================================
// Core Generation Function
// ============================================

async function generateCards(request) {
  const { cityId, cityName, type, count = 4, filters, excludeIds, context } = request;

  // Build prompt based on type
  let prompt;
  const promptContext = {
    city: cityName || cityId,
    count,
    travelerType: context?.travelerType || 'couple',
    preferences: context?.preferences,
    priceRange: filters?.priceMax ? `up to ${'€'.repeat(filters.priceMax)}` : 'moderate',
    nights: context?.nights || 2,
    clusterNames: context?.clusterNames || [],
    existingRestaurants: context?.existingNames?.filter(n => n.type === 'restaurant') || [],
    existingActivities: context?.existingNames?.filter(n => n.type === 'activity') || [],
    excludeNames: context?.excludeNames || [],
    season: context?.season || 'spring',
  };

  switch (type) {
    case 'restaurant':
      prompt = buildRestaurantPrompt(promptContext);
      break;
    case 'activity':
      prompt = buildActivityPrompt(promptContext);
      break;
    case 'photo_spot':
      prompt = buildPhotoSpotPrompt(promptContext);
      break;
    case 'bar':
    case 'cafe':
      prompt = buildBarPrompt(promptContext);
      break;
    default:
      prompt = buildActivityPrompt(promptContext);
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent) {
      throw new Error('No text content in response');
    }

    // Parse JSON response
    let cards;
    try {
      // Try to extract JSON from the response
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cards = JSON.parse(jsonMatch[0]);
      } else {
        cards = JSON.parse(textContent.text);
      }
    } catch (parseError) {
      console.error('[cardGeneration] JSON parse error:', parseError);
      console.error('[cardGeneration] Raw response:', textContent.text.substring(0, 500));
      throw new Error('Failed to parse generated cards');
    }

    // Validate and enrich cards
    const validatedCards = cards.map((card, index) => ({
      id: card.id || generateId(type),
      type: card.type || type,
      name: card.name || `${type} ${index + 1}`,
      description: card.description || '',
      whyGreat: card.whyGreat || '',
      location: {
        lat: card.location?.lat || 0,
        lng: card.location?.lng || 0,
        address: card.location?.address || '',
        area: card.location?.area || '',
      },
      duration: card.duration || 60,
      priceLevel: Math.min(4, Math.max(1, card.priceLevel || 2)),
      priceEstimate: card.priceEstimate || '',
      bestTime: card.bestTime || '',
      tags: card.tags || [],
      source: 'ai_generated',
      generatedAt: new Date(),
    }));

    return validatedCards;
  } catch (error) {
    console.error('[cardGeneration] Error generating cards:', error);
    throw error;
  }
}

// ============================================
// Proximity Functions
// ============================================

/**
 * Calculate walking minutes between two points using Haversine formula
 */
function calculateWalkingMinutes(from, to) {
  if (!from || !to || !from.lat || !to.lat) return Infinity;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // 5 km/h walking speed, add 20% for non-straight paths
  const walkingHours = (distanceKm / 5) * 1.2;
  return Math.round(walkingHours * 60);
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Enrich cards with proximity data relative to user's clusters
 */
function enrichWithProximity(cards, clusters) {
  if (!clusters || clusters.length === 0) {
    // No clusters yet - return cards without proximity
    return cards.map(card => ({
      card,
      nearestCluster: null,
      isNearPlan: false,
    }));
  }

  return cards.map(card => {
    const distances = clusters.map(cluster => ({
      id: cluster.id,
      name: cluster.name,
      walkingMinutes: calculateWalkingMinutes(card.location, cluster.center),
    }));

    const nearest = distances.reduce(
      (min, d) => (d.walkingMinutes < min.walkingMinutes ? d : min),
      { walkingMinutes: Infinity }
    );

    return {
      card,
      nearestCluster: nearest.walkingMinutes < Infinity ? nearest : null,
      isNearPlan: nearest.walkingMinutes <= 10,
    };
  });
}

/**
 * Sort cards by proximity (near items first)
 */
function sortByProximity(enrichedCards) {
  return enrichedCards.sort((a, b) => {
    // Near items first
    if (a.isNearPlan && !b.isNearPlan) return -1;
    if (!a.isNearPlan && b.isNearPlan) return 1;

    // Then by distance
    const aMin = a.nearestCluster?.walkingMinutes ?? Infinity;
    const bMin = b.nearestCluster?.walkingMinutes ?? Infinity;
    return aMin - bMin;
  });
}

/**
 * Filter cards to only those within walking distance
 */
function filterNearby(enrichedCards, maxMinutes = 10) {
  return enrichedCards.filter(
    item => item.nearestCluster && item.nearestCluster.walkingMinutes <= maxMinutes
  );
}

module.exports = {
  generateCards,
  enrichWithProximity,
  sortByProximity,
  filterNearby,
  calculateWalkingMinutes,
};
