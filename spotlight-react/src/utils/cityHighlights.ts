import type { CityData } from '../stores/spotlightStoreV2';

// Known city highlights - curated taglines for popular cities
const CITY_HIGHLIGHTS: Record<string, string> = {
  // France
  'Paris': 'City of Lights',
  'Nice': 'French Riviera Gem',
  'Lyon': 'Gastronomic Capital',
  'Marseille': 'Mediterranean Port City',
  'Bordeaux': 'Wine Country Heart',
  'Strasbourg': 'Franco-German Charm',

  // Spain
  'Barcelona': 'Gothic Quarter & Beaches',
  'Madrid': 'Art & Royal Heritage',
  'Seville': 'Flamenco & Moorish Beauty',
  'Valencia': 'City of Arts & Sciences',
  'Granada': 'Alhambra & Andalusian Soul',
  'San Sebastian': 'Basque Culinary Paradise',
  'Bilbao': 'Guggenheim & Basque Culture',

  // Italy
  'Rome': 'Eternal City',
  'Florence': 'Renaissance Masterpiece',
  'Venice': 'City of Canals',
  'Milan': 'Fashion & Design Hub',
  'Naples': 'Pizza & Pompeii Gateway',
  'Amalfi': 'Coastal Paradise',
  'Cinque Terre': 'Colorful Cliffside Villages',
  'Bologna': 'Italy\'s Culinary Heart',
  'Verona': 'Romeo & Juliet\'s City',

  // Portugal
  'Lisbon': 'City of Seven Hills',
  'Porto': 'Port Wine & River Views',
  'Sintra': 'Fairy Tale Palaces',
  'Lagos': 'Algarve Beach Paradise',

  // Netherlands
  'Amsterdam': 'Canals & Culture',
  'Rotterdam': 'Modern Architecture',
  'Utrecht': 'Medieval Canal City',

  // Belgium
  'Brussels': 'Art Nouveau & Chocolate',
  'Bruges': 'Medieval Fairy Tale',
  'Ghent': 'Hidden Flemish Gem',
  'Antwerp': 'Diamond & Fashion City',

  // Germany
  'Berlin': 'History & Nightlife',
  'Munich': 'Bavarian Traditions',
  'Hamburg': 'Harbor & Music Scene',
  'Cologne': 'Cathedral City',
  'Frankfurt': 'Skyline & Finance',
  'Dresden': 'Baroque Splendor',
  'Heidelberg': 'Romantic University Town',

  // Austria
  'Vienna': 'Imperial Elegance',
  'Salzburg': 'Mozart\'s Birthplace',
  'Innsbruck': 'Alpine Gateway',

  // Switzerland
  'Zurich': 'Lakeside Sophistication',
  'Geneva': 'International Elegance',
  'Lucerne': 'Alpine Lake Beauty',
  'Interlaken': 'Adventure Capital',
  'Zermatt': 'Matterhorn Views',

  // UK
  'London': 'Historic Royal Capital',
  'Edinburgh': 'Castle & Festival City',
  'Oxford': 'Dreaming Spires',
  'Cambridge': 'Academic Elegance',
  'Bath': 'Georgian Grandeur',
  'Liverpool': 'Beatles & Maritime Heritage',

  // Czech Republic
  'Prague': 'City of a Hundred Spires',

  // Hungary
  'Budapest': 'Pearl of the Danube',

  // Poland
  'Krakow': 'Medieval Royal Capital',
  'Warsaw': 'Phoenix From Ashes',
  'Gdansk': 'Baltic Hanseatic Port',

  // Croatia
  'Dubrovnik': 'Pearl of the Adriatic',
  'Split': 'Diocletian\'s Palace',
  'Zagreb': 'Austro-Hungarian Charm',

  // Greece
  'Athens': 'Cradle of Democracy',
  'Santorini': 'Volcanic Sunsets',
  'Mykonos': 'Cycladic Nightlife',
  'Thessaloniki': 'Byzantine Heritage',

  // Scandinavia
  'Copenhagen': 'Hygge & Design',
  'Stockholm': 'Venice of the North',
  'Oslo': 'Fjord City',
  'Helsinki': 'Nordic Design Capital',
  'Bergen': 'Gateway to Fjords',
  'Reykjavik': 'Land of Fire & Ice',

  // Eastern Europe
  'Tallinn': 'Medieval Baltic Gem',
  'Riga': 'Art Nouveau Capital',
  'Vilnius': 'Baroque Old Town',

  // Ireland
  'Dublin': 'Literary & Pub Culture',
  'Galway': 'Bohemian West Coast',

  // Scotland
  'Glasgow': 'Art & Music Scene',
  'Inverness': 'Highlands Gateway',
};

// Activity-based highlight generation
const ACTIVITY_HIGHLIGHTS: Record<string, string> = {
  'beach': 'Coastal Paradise',
  'historic': 'Rich History',
  'museum': 'Cultural Treasures',
  'nightlife': 'Vibrant Nightlife',
  'food': 'Culinary Destination',
  'nature': 'Natural Beauty',
  'adventure': 'Adventure Hub',
  'shopping': 'Shopping Paradise',
  'art': 'Artistic Heritage',
  'architecture': 'Architectural Wonder',
  'wine': 'Wine Country',
  'religious': 'Sacred Heritage',
  'romantic': 'Romantic Escape',
};

/**
 * Get a highlight tagline for a city
 * Priority: Known city highlight > Activity-based > Country
 */
export function getCityHighlight(
  cityName: string,
  cityData?: CityData,
  country?: string
): string {
  // 1. Check known cities first
  const knownHighlight = CITY_HIGHLIGHTS[cityName];
  if (knownHighlight) {
    return knownHighlight;
  }

  // 2. Check activities for theme
  if (cityData?.activities && cityData.activities.length > 0) {
    for (const activity of cityData.activities) {
      const activityType = activity.type?.toLowerCase();
      if (activityType && ACTIVITY_HIGHLIGHTS[activityType]) {
        return ACTIVITY_HIGHLIGHTS[activityType];
      }

      // Check activity name for keywords
      const name = (activity.name || '').toLowerCase();
      if (name.includes('beach')) return ACTIVITY_HIGHLIGHTS.beach;
      if (name.includes('museum')) return ACTIVITY_HIGHLIGHTS.museum;
      if (name.includes('castle') || name.includes('palace')) return ACTIVITY_HIGHLIGHTS.historic;
      if (name.includes('cathedral') || name.includes('church')) return ACTIVITY_HIGHLIGHTS.religious;
    }
  }

  // 3. Check agent recommendations
  if (cityData?.agentData) {
    const agentType = Object.keys(cityData.agentData)[0];
    if (agentType) {
      const agentHighlights: Record<string, string> = {
        'adventure': 'Adventure Awaits',
        'culture': 'Cultural Immersion',
        'food': 'Foodie Paradise',
        'hidden-gems': 'Off the Beaten Path',
        'scenic': 'Scenic Beauty',
        'photo-stops': 'Picture Perfect',
      };
      if (agentHighlights[agentType]) {
        return agentHighlights[agentType];
      }
    }
  }

  // 4. Fallback to country with generic prefix
  if (country) {
    return `Discover ${country}`;
  }

  // 5. Ultimate fallback
  return 'Worth exploring';
}

/**
 * Get highlights for a list of cities
 */
export function getCityHighlights(
  cities: CityData[],
  getCityName: (city: string | { name: string }) => string
): Map<string, string> {
  const highlights = new Map<string, string>();

  cities.forEach((cityData) => {
    const cityName = getCityName(cityData.city);
    const country = typeof cityData.city === 'object' ? cityData.city.country : undefined;
    highlights.set(cityName, getCityHighlight(cityName, cityData, country));
  });

  return highlights;
}
