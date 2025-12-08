/**
 * Place Type Categorisation System
 * WI-2.2: Maps Google Places types to user-friendly Waycraft categories
 *
 * Google Places returns an array of types for each place (e.g., ["restaurant", "food", "point_of_interest"]).
 * This system:
 * 1. Maps these granular types to user-friendly categories
 * 2. Selects the primary category when multiple types exist
 * 3. Supports filtering places by category
 *
 * Architecture Decision:
 * - Categories are designed for road trip discovery (Food & Drink, Culture, Nature, etc.)
 * - Priority ordering ensures the most specific category is selected
 * - Icons use Lucide React for consistency with the design system
 */

// ============================================================================
// Types
// ============================================================================

/**
 * User-friendly Waycraft categories
 */
export type WaycraftCategory =
  | 'food_drink'    // Restaurants, cafes, bars, bakeries
  | 'culture'       // Museums, galleries, theaters, churches
  | 'nature'        // Parks, beaches, natural features
  | 'nightlife'     // Clubs, bars (evening-focused)
  | 'shopping'      // Stores, malls, markets
  | 'activities'    // Attractions, experiences, tours
  | 'wellness'      // Spas, gyms, health
  | 'services'      // Banks, gas stations, essentials
  | 'accommodation' // Hotels, hostels (for reference)
  | 'other';        // Uncategorized

/**
 * Category metadata for display
 */
export interface CategoryMeta {
  id: WaycraftCategory;
  label: string;
  labelPlural: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  gradient: string; // CSS gradient
}

// ============================================================================
// Category Definitions
// ============================================================================

/**
 * Complete category metadata
 */
export const CATEGORY_META: Record<WaycraftCategory, CategoryMeta> = {
  food_drink: {
    id: 'food_drink',
    label: 'Food & Drink',
    labelPlural: 'Food & Drink',
    description: 'Restaurants, cafes, and bars',
    icon: 'Utensils',
    color: 'text-orange-600',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  culture: {
    id: 'culture',
    label: 'Culture',
    labelPlural: 'Cultural Spots',
    description: 'Museums, galleries, and historic sites',
    icon: 'Landmark',
    color: 'text-purple-600',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  nature: {
    id: 'nature',
    label: 'Nature',
    labelPlural: 'Nature & Outdoors',
    description: 'Parks, trails, and scenic spots',
    icon: 'Trees',
    color: 'text-green-600',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  nightlife: {
    id: 'nightlife',
    label: 'Nightlife',
    labelPlural: 'Nightlife',
    description: 'Clubs, bars, and evening entertainment',
    icon: 'Moon',
    color: 'text-indigo-600',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping',
    labelPlural: 'Shopping',
    description: 'Shops, markets, and boutiques',
    icon: 'ShoppingBag',
    color: 'text-pink-600',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  activities: {
    id: 'activities',
    label: 'Activities',
    labelPlural: 'Activities',
    description: 'Attractions, tours, and experiences',
    icon: 'Compass',
    color: 'text-blue-600',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  wellness: {
    id: 'wellness',
    label: 'Wellness',
    labelPlural: 'Wellness',
    description: 'Spas, gyms, and relaxation',
    icon: 'Heart',
    color: 'text-rose-600',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
  services: {
    id: 'services',
    label: 'Services',
    labelPlural: 'Services',
    description: 'Gas stations, banks, and essentials',
    icon: 'Wrench',
    color: 'text-slate-600',
    gradient: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
  },
  accommodation: {
    id: 'accommodation',
    label: 'Stay',
    labelPlural: 'Accommodation',
    description: 'Hotels, hostels, and lodging',
    icon: 'Bed',
    color: 'text-amber-600',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  other: {
    id: 'other',
    label: 'Other',
    labelPlural: 'Other Places',
    description: 'Other points of interest',
    icon: 'MapPin',
    color: 'text-gray-600',
    gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  },
};

// ============================================================================
// Google Places Type Mapping
// ============================================================================

/**
 * Comprehensive mapping of Google Places types to Waycraft categories
 *
 * Types are grouped by category for maintainability.
 * Priority within a category matters for primary type selection.
 */
const GOOGLE_TYPE_TO_CATEGORY: Record<string, WaycraftCategory> = {
  // Food & Drink
  restaurant: 'food_drink',
  cafe: 'food_drink',
  coffee_shop: 'food_drink',
  bakery: 'food_drink',
  food: 'food_drink',
  meal_delivery: 'food_drink',
  meal_takeaway: 'food_drink',
  ice_cream_shop: 'food_drink',
  juice_bar: 'food_drink',
  wine_bar: 'food_drink',
  brewery: 'food_drink',
  distillery: 'food_drink',
  winery: 'food_drink',
  american_restaurant: 'food_drink',
  italian_restaurant: 'food_drink',
  japanese_restaurant: 'food_drink',
  chinese_restaurant: 'food_drink',
  mexican_restaurant: 'food_drink',
  indian_restaurant: 'food_drink',
  french_restaurant: 'food_drink',
  thai_restaurant: 'food_drink',
  vietnamese_restaurant: 'food_drink',
  korean_restaurant: 'food_drink',
  mediterranean_restaurant: 'food_drink',
  middle_eastern_restaurant: 'food_drink',
  seafood_restaurant: 'food_drink',
  steak_house: 'food_drink',
  pizza_restaurant: 'food_drink',
  hamburger_restaurant: 'food_drink',
  vegetarian_restaurant: 'food_drink',
  vegan_restaurant: 'food_drink',
  brunch_restaurant: 'food_drink',
  fast_food_restaurant: 'food_drink',
  sandwich_shop: 'food_drink',
  ramen_restaurant: 'food_drink',
  sushi_restaurant: 'food_drink',
  barbecue_restaurant: 'food_drink',

  // Culture
  museum: 'culture',
  art_gallery: 'culture',
  library: 'culture',
  church: 'culture',
  hindu_temple: 'culture',
  mosque: 'culture',
  synagogue: 'culture',
  place_of_worship: 'culture',
  city_hall: 'culture',
  courthouse: 'culture',
  embassy: 'culture',
  historical_landmark: 'culture',
  performing_arts_theater: 'culture',
  movie_theater: 'culture',
  cultural_center: 'culture',
  art_studio: 'culture',
  concert_hall: 'culture',
  opera_house: 'culture',
  community_center: 'culture',

  // Nature
  park: 'nature',
  national_park: 'nature',
  state_park: 'nature',
  natural_feature: 'nature',
  hiking_area: 'nature',
  campground: 'nature',
  beach: 'nature',
  marina: 'nature',
  garden: 'nature',
  botanical_garden: 'nature',
  zoo: 'nature',
  aquarium: 'nature',
  wildlife_park: 'nature',
  dog_park: 'nature',
  playground: 'nature',
  forest: 'nature',
  mountain: 'nature',
  river: 'nature',
  lake: 'nature',
  waterfall: 'nature',
  cave: 'nature',
  scenic_point: 'nature',

  // Nightlife
  night_club: 'nightlife',
  bar: 'nightlife',
  pub: 'nightlife',
  cocktail_bar: 'nightlife',
  sports_bar: 'nightlife',
  lounge: 'nightlife',
  karaoke: 'nightlife',
  comedy_club: 'nightlife',
  jazz_club: 'nightlife',
  live_music_venue: 'nightlife',
  dance_club: 'nightlife',
  hookah_bar: 'nightlife',

  // Shopping
  store: 'shopping',
  shopping_mall: 'shopping',
  department_store: 'shopping',
  supermarket: 'shopping',
  grocery_or_supermarket: 'shopping',
  convenience_store: 'shopping',
  market: 'shopping',
  farmers_market: 'shopping',
  flea_market: 'shopping',
  book_store: 'shopping',
  clothing_store: 'shopping',
  shoe_store: 'shopping',
  jewelry_store: 'shopping',
  electronics_store: 'shopping',
  furniture_store: 'shopping',
  home_goods_store: 'shopping',
  florist: 'shopping',
  gift_shop: 'shopping',
  pet_store: 'shopping',
  bicycle_store: 'shopping',
  sporting_goods_store: 'shopping',
  toy_store: 'shopping',
  liquor_store: 'shopping',
  hardware_store: 'shopping',
  pharmacy: 'shopping',
  drugstore: 'shopping',
  boutique: 'shopping',
  antique_shop: 'shopping',
  vintage_store: 'shopping',
  outlet_store: 'shopping',

  // Activities
  tourist_attraction: 'activities',
  amusement_park: 'activities',
  theme_park: 'activities',
  water_park: 'activities',
  bowling_alley: 'activities',
  casino: 'activities',
  movie_rental: 'activities',
  stadium: 'activities',
  arena: 'activities',
  golf_course: 'activities',
  ski_resort: 'activities',
  sports_complex: 'activities',
  sports_club: 'activities',
  gym: 'activities',
  swimming_pool: 'activities',
  tennis_court: 'activities',
  skateboard_park: 'activities',
  escape_room: 'activities',
  laser_tag: 'activities',
  mini_golf: 'activities',
  go_kart_track: 'activities',
  trampoline_park: 'activities',
  climbing_gym: 'activities',
  cycling_track: 'activities',
  horse_riding: 'activities',
  scuba_diving: 'activities',
  surfing: 'activities',
  kayaking: 'activities',
  sailing: 'activities',
  fishing: 'activities',
  hunting: 'activities',
  archery: 'activities',
  shooting_range: 'activities',
  paintball: 'activities',
  airsoft: 'activities',
  bungee_jumping: 'activities',
  skydiving: 'activities',
  paragliding: 'activities',
  hot_air_balloon: 'activities',
  helicopter_tour: 'activities',
  boat_tour: 'activities',
  bus_tour: 'activities',
  walking_tour: 'activities',
  food_tour: 'activities',
  wine_tour: 'activities',
  cooking_class: 'activities',
  art_class: 'activities',
  dance_class: 'activities',
  language_school: 'activities',
  point_of_interest: 'activities',
  establishment: 'activities',

  // Wellness
  spa: 'wellness',
  beauty_salon: 'wellness',
  hair_care: 'wellness',
  hair_salon: 'wellness',
  nail_salon: 'wellness',
  skin_care: 'wellness',
  massage: 'wellness',
  sauna: 'wellness',
  hot_spring: 'wellness',
  fitness_center: 'wellness',
  yoga_studio: 'wellness',
  pilates_studio: 'wellness',
  meditation_center: 'wellness',
  health: 'wellness',
  dentist: 'wellness',
  doctor: 'wellness',
  hospital: 'wellness',
  medical_lab: 'wellness',
  physiotherapist: 'wellness',
  chiropractor: 'wellness',

  // Services
  gas_station: 'services',
  car_wash: 'services',
  car_repair: 'services',
  car_rental: 'services',
  car_dealer: 'services',
  parking: 'services',
  atm: 'services',
  bank: 'services',
  post_office: 'services',
  police: 'services',
  fire_station: 'services',
  local_government_office: 'services',
  laundry: 'services',
  dry_cleaning: 'services',
  storage: 'services',
  locksmith: 'services',
  plumber: 'services',
  electrician: 'services',
  roofing_contractor: 'services',
  moving_company: 'services',
  travel_agency: 'services',
  insurance_agency: 'services',
  real_estate_agency: 'services',
  lawyer: 'services',
  accountant: 'services',
  veterinary_care: 'services',
  pet_grooming: 'services',

  // Accommodation
  lodging: 'accommodation',
  hotel: 'accommodation',
  motel: 'accommodation',
  hostel: 'accommodation',
  bed_and_breakfast: 'accommodation',
  resort: 'accommodation',
  inn: 'accommodation',
  guest_house: 'accommodation',
  vacation_rental: 'accommodation',
  rv_park: 'accommodation',

  // Transportation (mapped to services)
  airport: 'services',
  bus_station: 'services',
  train_station: 'services',
  subway_station: 'services',
  light_rail_station: 'services',
  taxi_stand: 'services',
  transit_station: 'services',
  ferry_terminal: 'services',
};

/**
 * Priority order for category selection
 * When a place has multiple types, we prefer categories in this order
 */
const CATEGORY_PRIORITY: WaycraftCategory[] = [
  'food_drink',     // Most specific for road trips
  'nightlife',      // Specific subset of bars
  'culture',        // Museums, etc.
  'nature',         // Parks, trails
  'activities',     // Attractions
  'shopping',       // Stores
  'wellness',       // Spas
  'accommodation',  // Hotels
  'services',       // Essentials
  'other',          // Fallback
];

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get the Waycraft category for a single Google Places type
 */
export function getCategoryForType(googleType: string): WaycraftCategory {
  return GOOGLE_TYPE_TO_CATEGORY[googleType.toLowerCase()] || 'other';
}

/**
 * Get the primary category from an array of Google Places types
 *
 * Uses priority ordering to select the most relevant category.
 * E.g., ["restaurant", "food", "point_of_interest"] → "food_drink"
 *
 * @param types Array of Google Places types
 * @returns Primary Waycraft category
 */
export function getPrimaryCategory(types: string[]): WaycraftCategory {
  if (!types || types.length === 0) return 'other';

  // Get all categories for the types
  const categories = types
    .map((type) => getCategoryForType(type))
    .filter((cat, index, self) => self.indexOf(cat) === index); // unique

  if (categories.length === 0) return 'other';
  if (categories.length === 1) return categories[0];

  // Find the highest priority category
  for (const priorityCategory of CATEGORY_PRIORITY) {
    if (categories.includes(priorityCategory)) {
      return priorityCategory;
    }
  }

  return categories[0];
}

/**
 * Get all categories that apply to a place
 * Useful for filtering and tagging
 */
export function getAllCategories(types: string[]): WaycraftCategory[] {
  if (!types || types.length === 0) return ['other'];

  const categories = types
    .map((type) => getCategoryForType(type))
    .filter((cat, index, self) => self.indexOf(cat) === index);

  return categories.length > 0 ? categories : ['other'];
}

/**
 * Check if a place belongs to a specific category
 */
export function isInCategory(types: string[], category: WaycraftCategory): boolean {
  return types.some((type) => getCategoryForType(type) === category);
}

// ============================================================================
// Filtering Functions
// ============================================================================

/**
 * Filter places by category
 * Uses primary category for matching
 */
export function filterByCategory<T extends { types: string[] }>(
  places: T[],
  category: WaycraftCategory
): T[] {
  return places.filter((place) => getPrimaryCategory(place.types) === category);
}

/**
 * Filter places by multiple categories
 */
export function filterByCategories<T extends { types: string[] }>(
  places: T[],
  categories: WaycraftCategory[]
): T[] {
  return places.filter((place) => categories.includes(getPrimaryCategory(place.types)));
}

/**
 * Group places by their primary category
 */
export function groupByCategory<T extends { types: string[] }>(
  places: T[]
): Record<WaycraftCategory, T[]> {
  const groups: Record<WaycraftCategory, T[]> = {
    food_drink: [],
    culture: [],
    nature: [],
    nightlife: [],
    shopping: [],
    activities: [],
    wellness: [],
    services: [],
    accommodation: [],
    other: [],
  };

  places.forEach((place) => {
    const category = getPrimaryCategory(place.types);
    groups[category].push(place);
  });

  return groups;
}

/**
 * Count places per category
 */
export function countByCategory<T extends { types: string[] }>(
  places: T[]
): Record<WaycraftCategory, number> {
  const counts: Record<WaycraftCategory, number> = {
    food_drink: 0,
    culture: 0,
    nature: 0,
    nightlife: 0,
    shopping: 0,
    activities: 0,
    wellness: 0,
    services: 0,
    accommodation: 0,
    other: 0,
  };

  places.forEach((place) => {
    const category = getPrimaryCategory(place.types);
    counts[category]++;
  });

  return counts;
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Get category metadata
 */
export function getCategoryMeta(category: WaycraftCategory): CategoryMeta {
  return CATEGORY_META[category] || CATEGORY_META.other;
}

/**
 * Get display label for a category
 */
export function getCategoryLabel(category: WaycraftCategory): string {
  return CATEGORY_META[category]?.label || 'Other';
}

/**
 * Get icon name for a category
 */
export function getCategoryIcon(category: WaycraftCategory): string {
  return CATEGORY_META[category]?.icon || 'MapPin';
}

/**
 * Get color class for a category
 */
export function getCategoryColor(category: WaycraftCategory): string {
  return CATEGORY_META[category]?.color || 'text-gray-600';
}

/**
 * Get gradient for a category
 */
export function getCategoryGradient(category: WaycraftCategory): string {
  return CATEGORY_META[category]?.gradient || CATEGORY_META.other.gradient;
}

/**
 * Get human-readable type name from Google Places type
 */
export function formatGoogleType(googleType: string): string {
  return googleType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get primary display type from Google Places types
 * Returns a formatted, user-friendly type name
 */
export function getPrimaryDisplayType(types: string[]): string {
  if (!types || types.length === 0) return 'Place';

  // Priority types for display (most specific first)
  const displayPriority = [
    'restaurant',
    'cafe',
    'bar',
    'bakery',
    'museum',
    'art_gallery',
    'park',
    'night_club',
    'store',
    'tourist_attraction',
    'hotel',
    'spa',
  ];

  for (const priorityType of displayPriority) {
    if (types.includes(priorityType)) {
      return formatGoogleType(priorityType);
    }
  }

  // Use first non-generic type
  const genericTypes = ['point_of_interest', 'establishment', 'food', 'store'];
  const specificType = types.find((t) => !genericTypes.includes(t));

  return formatGoogleType(specificType || types[0]);
}

// ============================================================================
// Category List for UI
// ============================================================================

/**
 * Get all categories suitable for display in filters
 * Excludes accommodation and services by default (less relevant for discovery)
 */
export function getDiscoveryCategories(): WaycraftCategory[] {
  return ['food_drink', 'culture', 'nature', 'nightlife', 'shopping', 'activities'];
}

/**
 * Get all categories with their metadata
 */
export function getAllCategoriesWithMeta(): CategoryMeta[] {
  return Object.values(CATEGORY_META);
}

/**
 * Get discovery categories with metadata
 */
export function getDiscoveryCategoriesWithMeta(): CategoryMeta[] {
  return getDiscoveryCategories().map((cat) => CATEGORY_META[cat]);
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Convert WaycraftCategory to the existing PlaceType from discoveryStore
 * For backward compatibility during migration
 */
export function toPlaceType(category: WaycraftCategory): string {
  const mapping: Record<WaycraftCategory, string> = {
    food_drink: 'restaurant',
    culture: 'museum',
    nature: 'park',
    nightlife: 'bar',
    shopping: 'shop',
    activities: 'experience',
    wellness: 'experience',
    services: 'other',
    accommodation: 'other',
    other: 'other',
  };
  return mapping[category];
}

/**
 * Convert existing PlaceType to WaycraftCategory
 */
export function fromPlaceType(placeType: string): WaycraftCategory {
  const mapping: Record<string, WaycraftCategory> = {
    restaurant: 'food_drink',
    cafe: 'food_drink',
    bar: 'nightlife',
    museum: 'culture',
    gallery: 'culture',
    park: 'nature',
    landmark: 'culture',
    shop: 'shopping',
    market: 'shopping',
    viewpoint: 'nature',
    experience: 'activities',
    other: 'other',
  };
  return mapping[placeType] || 'other';
}
