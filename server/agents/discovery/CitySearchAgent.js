/**
 * CitySearchAgent
 *
 * An intelligent sub-agent that REASONS about how to find cities.
 * This is NOT just a search function - it understands user intent,
 * plans a multi-source search strategy, and synthesizes results.
 *
 * Example:
 *   User: "Find me foodie cities"
 *   Agent thinks: "Foodie means culinary excellence. I should search for
 *                  Michelin stars, food markets, regional cuisine reputation..."
 *   Agent executes: Curated DB query + Perplexity search + Google Places
 *   Agent synthesizes: "Lyon is the gastronomic capital - Paul Bocuse's legacy..."
 */

const Anthropic = require('@anthropic-ai/sdk');
const {
  classifyIntent,
  getStrategy,
  buildPerplexityQuery,
  scoreCityForStrategy
} = require('../../services/CitySearchStrategies');

// ============================================================================
// Curated City Database
// ============================================================================

// Rich city database with detailed attributes for intelligent matching
const CURATED_CITIES = {
  // === FRANCE ===
  lyon: {
    name: 'Lyon',
    country: 'France',
    region: 'Auvergne-Rhône-Alpes',
    coordinates: { lat: 45.7640, lng: 4.8357 },
    population: 516092,
    tags: ['gastronomy', 'food', 'michelin', 'historic', 'culture', 'silk'],
    highlights: [
      'Gastronomic capital of France',
      'Les Halles de Lyon Paul Bocuse',
      'Traditional bouchons',
      'UNESCO World Heritage old town',
      'Traboules secret passages'
    ],
    description: 'The undisputed gastronomic capital of France. Home to Paul Bocuse and countless Michelin stars. The old town is a UNESCO site with secret traboules.',
    hiddenGem: false,
    touristLevel: 'medium',
    rating: 4.7,
    bestFor: ['food lovers', 'history buffs', 'culture seekers'],
    nearWater: true,
    michelin: { stars: 15, bibs: 25 }
  },

  sete: {
    name: 'Sète',
    country: 'France',
    region: 'Occitanie',
    coordinates: { lat: 43.4035, lng: 3.6948 },
    population: 44270,
    tags: ['coastal', 'hidden_gem', 'seafood', 'artistic', 'port', 'authentic'],
    highlights: [
      'Venice of Languedoc - canal-threaded old town',
      'Georges Brassens birthplace',
      'Fresh oyster bars by the port',
      'Mont Saint-Clair panoramic views',
      'Water jousting tournaments'
    ],
    description: 'The Venice of Languedoc. Canals thread through the old port where fishermen still work. Birthplace of Georges Brassens, with oyster bars where locals actually eat.',
    hiddenGem: true,
    touristLevel: 'low',
    rating: 4.5,
    bestFor: ['hidden gem seekers', 'seafood lovers', 'authentic experiences'],
    nearWater: true
  },

  avignon: {
    name: 'Avignon',
    country: 'France',
    region: 'Provence',
    coordinates: { lat: 43.9493, lng: 4.8055 },
    population: 92130,
    tags: ['historic', 'medieval', 'papal', 'culture', 'wine', 'festival'],
    highlights: [
      'Palace of the Popes - largest Gothic palace',
      'Famous bridge - Pont d\'Avignon',
      'Medieval ramparts',
      'Gateway to Châteauneuf-du-Pape',
      'World-famous theater festival'
    ],
    description: 'City of the Popes with the largest Gothic palace in the world. Medieval ramparts encircle a vibrant city, gateway to the best wines of the Rhône.',
    hiddenGem: false,
    touristLevel: 'high',
    rating: 4.6,
    bestFor: ['history lovers', 'wine enthusiasts', 'culture seekers'],
    nearWater: true
  },

  collioure: {
    name: 'Collioure',
    country: 'France',
    region: 'Occitanie',
    coordinates: { lat: 42.5247, lng: 3.0833 },
    population: 2980,
    tags: ['coastal', 'artistic', 'charming', 'romantic', 'colorful', 'hidden_gem'],
    highlights: [
      'Where Matisse invented Fauvism',
      'Pink and ochre buildings tumbling to harbor',
      'Royal Castle on the waterfront',
      'Anchovy tradition since medieval times',
      'Artist trail through the village'
    ],
    description: 'Where Matisse invented Fauvism, inspired by the extraordinary light. Pink and ochre buildings tumble into a tiny harbor. Still feels like a secret despite its fame among artists.',
    hiddenGem: true,
    touristLevel: 'medium',
    rating: 4.7,
    bestFor: ['art lovers', 'romantics', 'photographers'],
    nearWater: true
  },

  carcassonne: {
    name: 'Carcassonne',
    country: 'France',
    region: 'Occitanie',
    coordinates: { lat: 43.2130, lng: 2.3491 },
    population: 46513,
    tags: ['historic', 'medieval', 'castle', 'unesco', 'fortress'],
    highlights: [
      'Largest medieval fortress in Europe',
      'UNESCO World Heritage double walls',
      '52 towers and 3km of ramparts',
      'Night illumination is magical',
      'Gateway to Cathar country'
    ],
    description: 'The largest medieval fortress in Europe, a UNESCO World Heritage site with double walls and 52 towers. At night, the illumination is magical. Step into the Middle Ages.',
    hiddenGem: false,
    touristLevel: 'high',
    rating: 4.5,
    bestFor: ['history lovers', 'castle enthusiasts', 'photographers'],
    nearWater: false
  },

  uzes: {
    name: 'Uzès',
    country: 'France',
    region: 'Occitanie',
    coordinates: { lat: 44.0125, lng: 4.4194 },
    population: 8723,
    tags: ['hidden_gem', 'market', 'charming', 'provencal', 'truffle', 'authentic'],
    highlights: [
      'First duchy of France',
      'Famous Saturday market (truffles in season)',
      'Perfectly preserved medieval center',
      'Pont du Gard nearby',
      'Provençal charm without the crowds'
    ],
    description: 'The first duchy of France, with a Saturday market famous for truffles. Medieval perfection without the Provence crowds. The Pont du Gard is just 15 minutes away.',
    hiddenGem: true,
    touristLevel: 'low',
    rating: 4.6,
    bestFor: ['market lovers', 'hidden gem seekers', 'foodies'],
    nearWater: false
  },

  arles: {
    name: 'Arles',
    country: 'France',
    region: 'Provence',
    coordinates: { lat: 43.6766, lng: 4.6278 },
    population: 52439,
    tags: ['historic', 'roman', 'artistic', 'van_gogh', 'photography', 'unesco'],
    highlights: [
      'Roman amphitheater still hosting events',
      'Van Gogh painted 300 works here',
      'LUMA Arles contemporary art center',
      'Camargue gateway',
      'Rencontres photography festival'
    ],
    description: 'Where Van Gogh found his yellow. Roman amphitheater still hosts bullfights. Now reinvented with LUMA Arles and the famous photography festival. Gateway to the wild Camargue.',
    hiddenGem: false,
    touristLevel: 'medium',
    rating: 4.5,
    bestFor: ['art lovers', 'history buffs', 'photographers'],
    nearWater: true
  },

  gordes: {
    name: 'Gordes',
    country: 'France',
    region: 'Provence',
    coordinates: { lat: 43.9116, lng: 5.2003 },
    population: 2092,
    tags: ['picturesque', 'hilltop', 'provence', 'romantic', 'scenic', 'charming'],
    highlights: [
      'Most beautiful village in France (often voted)',
      'Stone houses cascading down hillside',
      'Sénanque Abbey lavender fields',
      'Panoramic Luberon views',
      'Artisan markets'
    ],
    description: 'Often voted the most beautiful village in France. Stone houses cascade down the hillside with views over the Luberon. Nearby Sénanque Abbey is iconic during lavender season.',
    hiddenGem: false,
    touristLevel: 'high',
    rating: 4.7,
    bestFor: ['romantics', 'photographers', 'lavender enthusiasts'],
    nearWater: false
  },

  nimes: {
    name: 'Nîmes',
    country: 'France',
    region: 'Occitanie',
    coordinates: { lat: 43.8367, lng: 4.3601 },
    population: 151001,
    tags: ['historic', 'roman', 'ancient', 'arena', 'culture'],
    highlights: [
      'Best-preserved Roman amphitheater in the world',
      'Maison Carrée - perfect Roman temple',
      'Jardins de la Fontaine',
      'Denim was invented here (de Nîmes)',
      'Brandade de morue local dish'
    ],
    description: 'The Rome of France. The arena is the best-preserved in the world, still hosting concerts and bullfights. The Maison Carrée is a perfect Roman temple. Denim was invented here.',
    hiddenGem: false,
    touristLevel: 'medium',
    rating: 4.4,
    bestFor: ['history lovers', 'Roman architecture fans'],
    nearWater: false
  },

  montpellier: {
    name: 'Montpellier',
    country: 'France',
    region: 'Occitanie',
    coordinates: { lat: 43.6108, lng: 3.8767 },
    population: 290053,
    tags: ['young', 'student', 'nightlife', 'modern', 'beach', 'vibrant'],
    highlights: [
      'Youngest city in France',
      'Historic Écusson old town',
      'MOCO contemporary art museum',
      'Easy beach access',
      'Vibrant nightlife and café culture'
    ],
    description: 'The youngest city in France with incredible energy. The medieval Écusson contrasts with bold modern architecture. Great nightlife, easy beach access, and year-round sun.',
    hiddenGem: false,
    touristLevel: 'medium',
    rating: 4.3,
    bestFor: ['young travelers', 'nightlife seekers', 'beach lovers'],
    nearWater: true
  },

  perpignan: {
    name: 'Perpignan',
    country: 'France',
    region: 'Occitanie',
    coordinates: { lat: 42.6886, lng: 2.8948 },
    population: 121875,
    tags: ['catalan', 'historic', 'culture', 'affordable', 'authentic'],
    highlights: [
      'Capital of French Catalonia',
      'Palace of the Kings of Majorca',
      'Dalí proclaimed the station center of the universe',
      'Authentic tapas culture',
      'Gateway to Costa Brava'
    ],
    description: 'Capital of French Catalonia with a unique blend of French and Catalan culture. Dalí called the train station the center of the universe. Authentic and affordable, gateway to Spain.',
    hiddenGem: false,
    touristLevel: 'low',
    rating: 4.2,
    bestFor: ['culture seekers', 'budget travelers', 'Spain-France crossover'],
    nearWater: false
  },

  aigues_mortes: {
    name: 'Aigues-Mortes',
    country: 'France',
    region: 'Occitanie',
    coordinates: { lat: 43.5667, lng: 4.1908 },
    population: 8565,
    tags: ['medieval', 'fortress', 'camargue', 'salt', 'unique', 'hidden_gem'],
    highlights: [
      'Perfectly preserved medieval grid town',
      'Complete rampart walk',
      'Pink salt flats nearby',
      'Camargue flamingos',
      'Crusaders departed from here'
    ],
    description: 'A perfectly preserved medieval walled town rising from the Camargue marshes. Walk the complete ramparts. Nearby pink salt flats with flamingos. Crusaders left for the Holy Land from here.',
    hiddenGem: true,
    touristLevel: 'medium',
    rating: 4.5,
    bestFor: ['history lovers', 'photographers', 'unique experiences'],
    nearWater: true
  },

  marseille: {
    name: 'Marseille',
    country: 'France',
    region: 'Provence',
    coordinates: { lat: 43.2965, lng: 5.3698 },
    population: 870731,
    tags: ['coastal', 'port', 'multicultural', 'seafood', 'gritty', 'authentic'],
    highlights: [
      'Oldest city in France (2600 years)',
      'Vieux-Port fish market',
      'Bouillabaisse birthplace',
      'Calanques National Park',
      'MuCEM contemporary museum'
    ],
    description: 'France\'s oldest and grittiest city, with incredible authenticity. The Vieux-Port fish market at dawn, bouillabaisse, and the stunning Calanques. MuCEM is world-class.',
    hiddenGem: false,
    touristLevel: 'high',
    rating: 4.3,
    bestFor: ['seafood lovers', 'urban explorers', 'authentic experiences'],
    nearWater: true
  },

  nice: {
    name: 'Nice',
    country: 'France',
    region: 'Provence-Alpes-Côte d\'Azur',
    coordinates: { lat: 43.7102, lng: 7.2620 },
    population: 342669,
    tags: ['coastal', 'riviera', 'art', 'beach', 'glamorous'],
    highlights: [
      'Promenade des Anglais',
      'Vieux Nice old town',
      'Matisse and Chagall museums',
      'Cours Saleya flower market',
      'Gateway to Monaco'
    ],
    description: 'Queen of the Riviera with the famous Promenade des Anglais. The old town is charming, and the Matisse and Chagall museums are exceptional. Gateway to Monaco and the coast.',
    hiddenGem: false,
    touristLevel: 'high',
    rating: 4.5,
    bestFor: ['beach lovers', 'art enthusiasts', 'glamour seekers'],
    nearWater: true
  },

  aix_en_provence: {
    name: 'Aix-en-Provence',
    country: 'France',
    region: 'Provence',
    coordinates: { lat: 43.5297, lng: 5.4474 },
    population: 143097,
    tags: ['elegant', 'artistic', 'cezanne', 'fountains', 'market', 'refined'],
    highlights: [
      'City of a thousand fountains',
      'Cézanne\'s studio and Mont Sainte-Victoire',
      'Cours Mirabeau elegant boulevard',
      'Outstanding markets',
      'Refined café culture'
    ],
    description: 'The elegant city of a thousand fountains. Cézanne\'s beloved hometown with views of Mont Sainte-Victoire. The Cours Mirabeau is one of France\'s most beautiful boulevards.',
    hiddenGem: false,
    touristLevel: 'high',
    rating: 4.6,
    bestFor: ['art lovers', 'refined travelers', 'market enthusiasts'],
    nearWater: false
  },

  dijon: {
    name: 'Dijon',
    country: 'France',
    region: 'Bourgogne-Franche-Comté',
    coordinates: { lat: 47.3220, lng: 5.0415 },
    population: 156920,
    tags: ['gastronomy', 'wine', 'mustard', 'medieval', 'historic'],
    highlights: [
      'Mustard capital of the world',
      'Gateway to Burgundy wine route',
      'Dukes of Burgundy palace',
      'Les Halles market by Eiffel',
      'Owl trail through old town'
    ],
    description: 'Mustard capital and gateway to the Burgundy wine route. The Dukes of Burgundy made it wealthy, visible in the stunning architecture. Les Halles market was designed by Eiffel.',
    hiddenGem: false,
    touristLevel: 'medium',
    rating: 4.5,
    bestFor: ['foodies', 'wine lovers', 'history buffs'],
    nearWater: false
  },

  // === SPAIN ===
  barcelona: {
    name: 'Barcelona',
    country: 'Spain',
    region: 'Catalonia',
    coordinates: { lat: 41.3851, lng: 2.1734 },
    population: 1620343,
    tags: ['artistic', 'gaudi', 'beach', 'nightlife', 'culture', 'architecture'],
    highlights: [
      'Gaudí masterpieces - Sagrada Familia, Park Güell',
      'Gothic Quarter labyrinth',
      'La Boqueria market',
      'Legendary nightlife',
      'Beach and culture combined'
    ],
    description: 'Gaudí\'s modernist playground. The Sagrada Familia alone is worth the trip. Gothic Quarter for getting lost, Boqueria for eating, beaches for lounging, and some of Europe\'s best nightlife.',
    hiddenGem: false,
    touristLevel: 'very_high',
    rating: 4.7,
    bestFor: ['architecture lovers', 'nightlife seekers', 'culture enthusiasts'],
    nearWater: true
  },

  girona: {
    name: 'Girona',
    country: 'Spain',
    region: 'Catalonia',
    coordinates: { lat: 41.9794, lng: 2.8214 },
    population: 103369,
    tags: ['medieval', 'jewish_quarter', 'game_of_thrones', 'charming', 'gastronomy'],
    highlights: [
      'Best-preserved Jewish Quarter in Europe',
      'Game of Thrones filming location',
      'Colorful houses on the Onyar',
      'El Celler de Can Roca nearby',
      'Cathedral with widest Gothic nave'
    ],
    description: 'Medieval gem with the best-preserved Jewish Quarter in Europe. Game of Thrones fans will recognize Braavos. The colorful houses on the Onyar are iconic. El Celler de Can Roca is nearby.',
    hiddenGem: false,
    touristLevel: 'medium',
    rating: 4.6,
    bestFor: ['history lovers', 'foodies', 'Game of Thrones fans'],
    nearWater: true
  },

  cadaques: {
    name: 'Cadaqués',
    country: 'Spain',
    region: 'Catalonia',
    coordinates: { lat: 42.2883, lng: 3.2767 },
    population: 2879,
    tags: ['coastal', 'artistic', 'dali', 'charming', 'hidden_gem', 'whitewashed'],
    highlights: [
      'Dalí\'s beloved village',
      'Whitewashed houses, blue shutters',
      'Dramatic Cap de Creus coastline',
      'Artist colony atmosphere',
      'Difficult access keeps crowds away'
    ],
    description: 'Dalí\'s beloved whitewashed village on a remote peninsula. The difficult drive keeps mass tourism away. Cap de Creus has the most dramatic coastline in Catalonia. Artists still come here.',
    hiddenGem: true,
    touristLevel: 'medium',
    rating: 4.7,
    bestFor: ['art lovers', 'romantics', 'hidden gem seekers'],
    nearWater: true
  },

  figueres: {
    name: 'Figueres',
    country: 'Spain',
    region: 'Catalonia',
    coordinates: { lat: 42.2667, lng: 2.9611 },
    population: 46600,
    tags: ['artistic', 'dali', 'surreal', 'museum', 'culture'],
    highlights: [
      'Dalí Theatre-Museum - most surreal museum ever',
      'Artist\'s birthplace and burial place',
      'Sant Ferran fortress',
      'Gateway to Costa Brava'
    ],
    description: 'Home to the most surreal museum in the world - Dalí designed it as a complete experience. He was born here and is buried in the crypt. The fortress is one of Europe\'s largest.',
    hiddenGem: false,
    touristLevel: 'high',
    rating: 4.4,
    bestFor: ['art lovers', 'Dalí fans', 'surrealism enthusiasts'],
    nearWater: false
  },

  tossa_de_mar: {
    name: 'Tossa de Mar',
    country: 'Spain',
    region: 'Catalonia',
    coordinates: { lat: 41.7208, lng: 2.9333 },
    population: 6025,
    tags: ['coastal', 'medieval', 'beach', 'charming', 'romantic'],
    highlights: [
      'Only fortified medieval town on Costa Brava',
      'Blue paradise - Marc Chagall',
      'Vila Vella walled old town',
      'Spectacular beaches and coves',
      'Roman villa mosaics'
    ],
    description: 'The only fortified medieval town on the Costa Brava. Chagall called it a blue paradise. The Vila Vella rises above perfect beaches. Roman villa with beautiful mosaics.',
    hiddenGem: false,
    touristLevel: 'high',
    rating: 4.5,
    bestFor: ['beach lovers', 'history buffs', 'romantics'],
    nearWater: true
  },

  tarragona: {
    name: 'Tarragona',
    country: 'Spain',
    region: 'Catalonia',
    coordinates: { lat: 41.1189, lng: 1.2445 },
    population: 132299,
    tags: ['historic', 'roman', 'unesco', 'beach', 'archaeological'],
    highlights: [
      'UNESCO Roman Tarraco ruins',
      'Amphitheater overlooking the sea',
      'Aqueduct in the forest',
      'Cathedral with Romanesque cloister',
      'Beach within the city'
    ],
    description: 'The Roman capital of Hispania, now a UNESCO World Heritage site. The amphitheater overlooks the Mediterranean. The aqueduct in the forest is magical. Beach culture meets ancient history.',
    hiddenGem: false,
    touristLevel: 'medium',
    rating: 4.4,
    bestFor: ['history lovers', 'Roman archaeology fans', 'beach lovers'],
    nearWater: true
  },

  besalu: {
    name: 'Besalú',
    country: 'Spain',
    region: 'Catalonia',
    coordinates: { lat: 42.1989, lng: 2.6989 },
    population: 2461,
    tags: ['medieval', 'jewish', 'bridge', 'hidden_gem', 'charming', 'atmospheric'],
    highlights: [
      'Iconic Romanesque bridge',
      'Medieval Jewish quarter with mikveh',
      'Perfectly preserved medieval town',
      'Game of Thrones atmosphere',
      'Off most tourist radars'
    ],
    description: 'Step through the iconic Romanesque bridge into the Middle Ages. One of the best-preserved medieval towns in Catalonia, with a rare Jewish mikveh. Atmospheric and uncrowded.',
    hiddenGem: true,
    touristLevel: 'low',
    rating: 4.6,
    bestFor: ['medieval enthusiasts', 'photographers', 'hidden gem seekers'],
    nearWater: true
  },

  // === ITALY ===
  cinque_terre: {
    name: 'Cinque Terre',
    country: 'Italy',
    region: 'Liguria',
    coordinates: { lat: 44.1461, lng: 9.6444 },
    population: 4000,
    tags: ['coastal', 'colorful', 'hiking', 'unesco', 'romantic', 'scenic'],
    highlights: [
      'Five colorful villages clinging to cliffs',
      'UNESCO World Heritage coast',
      'Hiking trails between villages',
      'Pesto birthplace',
      'Car-free villages'
    ],
    description: 'Five impossibly colorful villages clinging to cliffs above the Ligurian Sea. Connected by hiking trails and train. Birthplace of pesto. UNESCO World Heritage and utterly romantic.',
    hiddenGem: false,
    touristLevel: 'very_high',
    rating: 4.8,
    bestFor: ['hikers', 'romantics', 'photographers'],
    nearWater: true
  },

  portofino: {
    name: 'Portofino',
    country: 'Italy',
    region: 'Liguria',
    coordinates: { lat: 44.3033, lng: 9.2097 },
    population: 400,
    tags: ['coastal', 'glamorous', 'exclusive', 'charming', 'romantic'],
    highlights: [
      'Italy\'s most exclusive harbor',
      'Pastel houses around tiny bay',
      'Celebrity yacht watching',
      'Castello Brown views',
      'Hiking to San Fruttuoso'
    ],
    description: 'Italy\'s most exclusive harbor village. Pastel houses curve around a tiny bay filled with mega-yachts. Hike to San Fruttuoso for a secret beach. Glamorous but genuinely beautiful.',
    hiddenGem: false,
    touristLevel: 'very_high',
    rating: 4.6,
    bestFor: ['luxury seekers', 'romantics', 'photographers'],
    nearWater: true
  },

  genoa: {
    name: 'Genoa',
    country: 'Italy',
    region: 'Liguria',
    coordinates: { lat: 44.4056, lng: 8.9463 },
    population: 580097,
    tags: ['historic', 'port', 'palaces', 'underrated', 'authentic', 'seafood'],
    highlights: [
      'Europe\'s largest historic center',
      'Rolli palaces UNESCO site',
      'Columbus\'s birthplace',
      'Authentic port atmosphere',
      'Pesto and focaccia'
    ],
    description: 'Hugely underrated port city with Europe\'s largest historic center. UNESCO Rolli palaces, Columbus\'s birthplace, and authentic working port. The best pesto and focaccia you\'ll ever have.',
    hiddenGem: true,
    touristLevel: 'low',
    rating: 4.4,
    bestFor: ['authentic seekers', 'foodies', 'history buffs'],
    nearWater: true
  },

  san_remo: {
    name: 'San Remo',
    country: 'Italy',
    region: 'Liguria',
    coordinates: { lat: 43.8168, lng: 7.7767 },
    population: 54430,
    tags: ['coastal', 'elegant', 'casino', 'belle_epoque', 'flowers'],
    highlights: [
      'Italian Riviera gem',
      'Belle Époque casino',
      'La Pigna medieval quarter',
      'Flower market capital',
      'San Remo music festival'
    ],
    description: 'The pearl of the Italian Riviera with Belle Époque elegance. The casino, the flower market, and the medieval La Pigna quarter. Host of the famous Italian music festival.',
    hiddenGem: false,
    touristLevel: 'medium',
    rating: 4.3,
    bestFor: ['elegant travelers', 'casino goers', 'flower lovers'],
    nearWater: true
  }
};

// ============================================================================
// CitySearchAgent Class
// ============================================================================

class CitySearchAgent {
  constructor(options = {}) {
    this.anthropic = new Anthropic();
    this.model = options.model || 'claude-3-5-haiku-20241022';
    this.cities = CURATED_CITIES;
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.cache = options.cache || null; // Optional CitySearchCache instance
  }

  /**
   * Main search method - orchestrates the entire search flow
   */
  async search(query, context = {}) {
    console.log('🔍 CitySearchAgent: Starting search for:', query);

    // Step 1: Classify intent
    const intents = classifyIntent(query);
    const primaryIntent = intents[0];
    console.log('🎯 Classified intent:', primaryIntent);

    // Step 1.5: Check cache
    if (this.cache && !context.skipCache) {
      const cached = await this.cache.get(query, {
        intent: primaryIntent.intent,
        region: context.nearCity || context.region,
        nearCity: context.nearCity
      });

      if (cached) {
        console.log('📦 Using cached results');
        return {
          intent: primaryIntent,
          strategy: 'cached',
          cities: cached.cities.slice(0, context.maxResults || 5),
          narrative: cached.narrative,
          confidence: cached.confidence,
          cached: true
        };
      }
    }

    // Step 2: Get search strategy
    const strategy = getStrategy(primaryIntent.intent);
    console.log('📋 Using strategy:', strategy.description);

    // Step 3: Build search plan
    const searchPlan = this.buildSearchPlan(strategy, query, context);
    console.log('📝 Search plan:', searchPlan);

    // Step 4: Execute searches in parallel
    const searchResults = await this.executeSearches(searchPlan, context);

    // Step 5: Synthesize and rank results
    const rankedResults = this.synthesizeResults(searchResults, strategy, query, context);

    // Step 6: Generate reasoning narrative
    const narrative = await this.generateNarrative(rankedResults, primaryIntent, context);

    const result = {
      intent: primaryIntent,
      strategy: strategy.description,
      cities: rankedResults.slice(0, context.maxResults || 5),
      narrative,
      searchPlan,
      confidence: this.calculateConfidence(rankedResults, primaryIntent)
    };

    // Step 7: Cache results
    if (this.cache && result.cities.length > 0) {
      await this.cache.set(query, {
        intent: primaryIntent.intent,
        region: context.nearCity || context.region,
        nearCity: context.nearCity
      }, {
        cities: result.cities,
        narrative: result.narrative,
        confidence: result.confidence
      });
    }

    return result;
  }

  /**
   * Build search plan based on strategy
   */
  buildSearchPlan(strategy, query, context) {
    const plan = {
      sources: [],
      query,
      region: context.nearCity || context.region || 'Southern France and Northern Spain'
    };

    for (const source of strategy.sources) {
      switch (source.type) {
        case 'curated':
          plan.sources.push({
            type: 'curated',
            filter: source.filter,
            weight: source.weight
          });
          break;

        case 'perplexity':
          if (this.perplexityApiKey) {
            plan.sources.push({
              type: 'perplexity',
              query: buildPerplexityQuery(strategy, { region: plan.region }),
              weight: source.weight
            });
          }
          break;

        case 'google_places':
          plan.sources.push({
            type: 'google_places',
            placeTypes: source.placeTypes,
            minRating: source.minRating,
            weight: source.weight
          });
          break;

        case 'geographic':
          plan.sources.push({
            type: 'geographic',
            filter: source.filter,
            weight: source.weight
          });
          break;
      }
    }

    return plan;
  }

  /**
   * Execute all searches in the plan
   */
  async executeSearches(plan, context) {
    const results = [];

    for (const source of plan.sources) {
      try {
        switch (source.type) {
          case 'curated':
            const curatedResults = this.searchCurated(source.filter, context);
            results.push({
              source: 'curated',
              cities: curatedResults,
              weight: source.weight
            });
            break;

          case 'perplexity':
            if (source.query) {
              const perplexityResults = await this.searchPerplexity(source.query);
              results.push({
                source: 'perplexity',
                cities: perplexityResults,
                weight: source.weight
              });
            }
            break;

          case 'geographic':
            const geoResults = this.searchGeographic(source.filter, context);
            results.push({
              source: 'geographic',
              cities: geoResults,
              weight: source.weight
            });
            break;
        }
      } catch (error) {
        console.warn(`Search source ${source.type} failed:`, error.message);
      }
    }

    return results;
  }

  /**
   * Search curated database with filter
   */
  searchCurated(filter, context) {
    const matches = [];
    const excludeSet = new Set((context.excludeCities || []).map(c => c.toLowerCase()));

    for (const [key, city] of Object.entries(this.cities)) {
      // Skip excluded cities
      if (excludeSet.has(city.name.toLowerCase())) continue;

      // Apply filter if provided
      if (filter && typeof filter === 'function') {
        try {
          if (!filter(city)) continue;
        } catch {
          // Filter failed, skip city
          continue;
        }
      }

      // Geographic filtering if nearCity is provided
      if (context.nearCity && context.maxDistanceKm) {
        const distance = this.calculateDistance(
          city.coordinates,
          context.nearCityCoords || { lat: 43.5, lng: 4.0 } // Default to South France
        );
        if (distance > context.maxDistanceKm) continue;
      }

      matches.push({
        ...city,
        source: 'curated',
        matchReason: 'Matched curated filter'
      });
    }

    return matches;
  }

  /**
   * Search using Perplexity API
   */
  async searchPerplexity(query) {
    if (!this.perplexityApiKey) {
      console.log('⚠️ Perplexity API key not configured');
      return [];
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a travel expert. Return ONLY a JSON array of city recommendations. Each city should have: name, country, reason (1 sentence why it matches). Maximum 5 cities. No markdown, just JSON.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const cities = JSON.parse(jsonMatch[0]);
        return cities.map(city => ({
          name: city.name,
          country: city.country,
          source: 'perplexity',
          matchReason: city.reason,
          coordinates: { lat: 0, lng: 0 } // Will need geocoding
        }));
      }

      return [];
    } catch (error) {
      console.warn('Perplexity search failed:', error.message);
      return [];
    }
  }

  /**
   * Geographic search based on distance
   */
  searchGeographic(filter, context) {
    const matches = [];

    for (const [key, city] of Object.entries(this.cities)) {
      // Coastal filter
      if (filter.maxDistanceFromCoast && city.nearWater) {
        matches.push({
          ...city,
          source: 'geographic',
          matchReason: 'Near water/coast'
        });
      }
    }

    return matches;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Synthesize and rank results from all sources
   */
  synthesizeResults(searchResults, strategy, query, context) {
    const cityScores = new Map();

    // Collect all cities with weighted scores
    for (const result of searchResults) {
      for (const city of result.cities) {
        const key = city.name.toLowerCase();
        const existing = cityScores.get(key) || {
          city,
          score: 0,
          sources: [],
          reasons: []
        };

        // Base score from source weight
        let sourceScore = result.weight || 1.0;

        // Apply strategy scoring
        const strategyScore = scoreCityForStrategy(city, strategy, query);
        sourceScore += strategyScore.score;

        existing.score += sourceScore;
        existing.sources.push(result.source);
        existing.reasons.push(city.matchReason);
        existing.reasons.push(...strategyScore.reasons);

        cityScores.set(key, existing);
      }
    }

    // Convert to array and sort by score
    const ranked = Array.from(cityScores.values())
      .sort((a, b) => b.score - a.score)
      .map(item => ({
        ...item.city,
        score: item.score,
        sources: [...new Set(item.sources)],
        reasons: [...new Set(item.reasons.filter(Boolean))]
      }));

    return ranked;
  }

  /**
   * Generate narrative explanation using Claude
   */
  async generateNarrative(cities, intent, context) {
    if (cities.length === 0) {
      return "I couldn't find cities matching your criteria. Could you try describing what you're looking for differently?";
    }

    const topCities = cities.slice(0, 3);
    const cityDescriptions = topCities.map(c =>
      `${c.name} (${c.country}): ${c.description || c.matchReason}`
    ).join('\n');

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `You are Voyager, a sophisticated travel companion. Based on a search for "${intent.intent}" cities, summarize these top matches in 2-3 sentences. Be warm but concise, with specific details. Speak naturally, not like a brochure.

Top matches:
${cityDescriptions}

Write a brief, conversational recommendation.`
          }
        ]
      });

      return response.content[0]?.text || 'Here are some excellent options for you.';
    } catch (error) {
      console.warn('Narrative generation failed:', error.message);
      return `I found some great ${intent.intent} destinations for you.`;
    }
  }

  /**
   * Calculate confidence in the results
   */
  calculateConfidence(results, intent) {
    if (results.length === 0) return 0;

    // Higher confidence if multiple sources agree
    const topCity = results[0];
    const sourceCount = topCity.sources?.length || 1;
    const scoreConfidence = Math.min(topCity.score / 10, 1);
    const sourceConfidence = Math.min(sourceCount / 2, 1);

    return (scoreConfidence + sourceConfidence + intent.confidence) / 3;
  }

  /**
   * Quick search for inline tool use - returns just city names and brief info
   */
  async quickSearch(criteria, context = {}) {
    const result = await this.search(criteria, {
      ...context,
      maxResults: context.maxResults || 5
    });

    return result.cities.map(city => ({
      name: city.name,
      country: city.country,
      reason: city.reasons?.[0] || city.description?.slice(0, 100),
      coordinates: city.coordinates,
      highlights: city.highlights?.slice(0, 2)
    }));
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = { CitySearchAgent, CURATED_CITIES };
