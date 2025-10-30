// Popular destinations from Aix-en-Provence
// Each destination includes travel details and best-suited agents

export interface Destination {
  id: string
  name: string
  country: string
  flag: string
  driveTime: string
  driveTimeHours: number
  distance: number // km
  recommendedStops: number
  pitch: string
  description: string
  bestFor: Array<{
    agent: 'adventure' | 'culture' | 'food' | 'hidden-gems'
    reason: string
  }>
  highlights: string[]
  imageUrl: string
  imageFallback: string // Solid color as fallback
}

export const destinations: Destination[] = [
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    flag: '🇪🇸',
    driveTime: '8 hours',
    driveTimeHours: 8,
    distance: 520,
    recommendedStops: 3,
    pitch: 'Mediterranean beaches, Gaudí architecture, vibrant nightlife',
    description: 'The Catalan capital combines world-class art, stunning modernist architecture, pristine beaches, and legendary food scene.',
    bestFor: [
      { agent: 'culture', reason: 'Sagrada Família, Park Güell, Gothic Quarter' },
      { agent: 'food', reason: 'Tapas bars, La Boqueria market, Michelin restaurants' }
    ],
    highlights: ['Sagrada Família', 'Park Güell', 'La Rambla', 'Barceloneta Beach'],
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    imageFallback: '#FF6B6B'
  },
  {
    id: 'milan',
    name: 'Milan',
    country: 'Italy',
    flag: '🇮🇹',
    driveTime: '6 hours',
    driveTimeHours: 6,
    distance: 410,
    recommendedStops: 2,
    pitch: 'Fashion capital, Da Vinci\'s Last Supper, alpine gateway',
    description: 'Italy\'s fashion and design hub blends Renaissance masterpieces with cutting-edge style and proximity to stunning lakes.',
    bestFor: [
      { agent: 'culture', reason: 'Duomo di Milano, The Last Supper, La Scala opera house' },
      { agent: 'hidden-gems', reason: 'Navigli canals, Brera district, Lake Como day trips' }
    ],
    highlights: ['Duomo Cathedral', 'Galleria Vittorio Emanuele II', 'The Last Supper', 'Sforza Castle'],
    imageUrl: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=800',
    imageFallback: '#4ECDC4'
  },
  {
    id: 'geneva',
    name: 'Geneva',
    country: 'Switzerland',
    flag: '🇨🇭',
    driveTime: '5 hours',
    driveTimeHours: 5,
    distance: 330,
    recommendedStops: 2,
    pitch: 'Alpine lakes, international elegance, Swiss chocolate',
    description: 'Sophisticated Swiss city on pristine Lake Geneva, surrounded by Alps and Jura mountains, with world-class dining.',
    bestFor: [
      { agent: 'adventure', reason: 'Mont Salève, Lake Geneva cruises, nearby skiing' },
      { agent: 'food', reason: 'Swiss chocolate, fondue, Michelin-starred restaurants' }
    ],
    highlights: ['Jet d\'Eau fountain', 'Old Town', 'Mont Salève', 'Lake Geneva'],
    imageUrl: 'https://images.unsplash.com/photo-1516911727219-ffbd1df77673?w=800',
    imageFallback: '#95E1D3'
  },
  {
    id: 'munich',
    name: 'Munich',
    country: 'Germany',
    flag: '🇩🇪',
    driveTime: '9 hours',
    driveTimeHours: 9,
    distance: 750,
    recommendedStops: 4,
    pitch: 'Beer gardens, Bavarian Alps, historic castles',
    description: 'Bavaria\'s capital offers legendary beer culture, proximity to fairytale castles, and gateway to the Alps.',
    bestFor: [
      { agent: 'culture', reason: 'Neuschwanstein Castle, Residenz Palace, museums' },
      { agent: 'food', reason: 'Beer gardens, Hofbräuhaus, pretzels & sausages' }
    ],
    highlights: ['Marienplatz', 'English Garden', 'Neuschwanstein day trip', 'BMW Museum'],
    imageUrl: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800',
    imageFallback: '#FFE66D'
  },
  {
    id: 'cinque-terre',
    name: 'Cinque Terre',
    country: 'Italy',
    flag: '🇮🇹',
    driveTime: '5 hours',
    driveTimeHours: 5,
    distance: 340,
    recommendedStops: 2,
    pitch: 'Colorful coastal villages, hiking trails, Italian Riviera',
    description: 'Five stunning fishing villages clinging to rugged cliffs, connected by scenic hiking trails along the Ligurian coast.',
    bestFor: [
      { agent: 'adventure', reason: 'Coastal hiking trails, swimming spots, boat tours' },
      { agent: 'hidden-gems', reason: 'Small villages, local trattorias, authentic Italy' }
    ],
    highlights: ['Vernazza village', 'Sentiero Azzurro trail', 'Manarola at sunset', 'Local pesto'],
    imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800',
    imageFallback: '#FFA07A'
  },
  {
    id: 'lyon',
    name: 'Lyon',
    country: 'France',
    flag: '🇫🇷',
    driveTime: '3 hours',
    driveTimeHours: 3,
    distance: 280,
    recommendedStops: 1,
    pitch: 'Gastronomic capital, secret passages, two rivers',
    description: 'France\'s culinary heart, with UNESCO-listed old town, mysterious traboules, and more Michelin stars than anywhere outside Paris.',
    bestFor: [
      { agent: 'food', reason: 'Bouchons, Paul Bocuse, Les Halles market' },
      { agent: 'culture', reason: 'Vieux Lyon, Roman theaters, Fourvière Basilica' }
    ],
    highlights: ['Vieux Lyon traboules', 'Basilica of Notre-Dame', 'Halles de Lyon', 'Presqu\'île'],
    imageUrl: 'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=800',
    imageFallback: '#A8DADC'
  }
]

// Helper function to get agent color (matches spotlight theme colors)
export function getAgentColor(agent: string): string {
  const colors: Record<string, string> = {
    'adventure': '#0f5132',    // dark green from theme.ts
    'culture': '#d4a017',      // yellow/gold from theme.ts
    'food': '#8b0000',         // dark red from theme.ts
    'hidden-gems': '#1e3a8a'   // dark blue from theme.ts
  }
  return colors[agent] || '#6B7280'
}

// Helper function to get agent icon (returns PNG path)
export function getAgentIconPath(agent: string): string {
  const icons: Record<string, string> = {
    'adventure': '/images/icons/adventure_icon.png',
    'culture': '/images/icons/culture_icon.png',
    'food': '/images/icons/food_icon.png',
    'hidden-gems': '/images/icons/hidden_gem_icon.png'
  }
  return icons[agent] || '/images/icons/best_icon.png'
}
