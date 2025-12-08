/**
 * Chain/Franchise Detection Utility
 * WI-2.5: Identifies chain restaurants, cafes, and hotels
 *
 * This utility helps filter out chains from hidden gems results while
 * still allowing users to find them when needed (e.g., for convenience).
 *
 * Architecture Decisions:
 * - Flag, don't remove: Users might want chains for reliable options
 * - Pattern matching: Handles variations like "McDonald's", "McDonalds", "Mc Donald's"
 * - Extensible: Easy to add regional chains
 * - Categorized: Know what type of chain (fast food, coffee, hotel)
 *
 * Detection Methods:
 * 1. Exact name matching (normalized)
 * 2. Pattern/prefix matching (e.g., "Holiday Inn Express")
 * 3. Google Places types (some include 'chain' or specific chain types)
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Chain category types
 */
export type ChainCategory =
  | 'fast_food'
  | 'coffee'
  | 'casual_dining'
  | 'hotel'
  | 'convenience'
  | 'retail'
  | 'gas_station'
  | 'pharmacy'
  | 'other';

/**
 * Chain detection result
 */
export interface ChainInfo {
  /** Whether this is detected as a chain */
  isChain: boolean;
  /** Category of chain */
  category?: ChainCategory;
  /** Matched chain name (normalized) */
  chainName?: string;
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
  /** How it was detected */
  detectionMethod?: 'exact' | 'pattern' | 'type';
}

/**
 * Chain entry in the database
 */
interface ChainEntry {
  /** Normalized name for matching */
  name: string;
  /** Alternative spellings/variations */
  aliases?: string[];
  /** Patterns to match (prefix matching) */
  patterns?: string[];
  /** Chain category */
  category: ChainCategory;
  /** Region (for regional chains) */
  region?: 'global' | 'us' | 'eu' | 'uk' | 'asia' | 'aus';
}

// ============================================================================
// Chain Database
// ============================================================================

/**
 * Comprehensive list of known chains
 *
 * Organized by category for maintainability.
 * Includes global chains and major regional ones.
 */
const CHAIN_DATABASE: ChainEntry[] = [
  // =========================================================================
  // FAST FOOD
  // =========================================================================
  { name: "mcdonald's", aliases: ['mcdonalds', 'mcd', 'mickey d'], category: 'fast_food', region: 'global' },
  { name: 'burger king', aliases: ['bk'], category: 'fast_food', region: 'global' },
  { name: 'kfc', aliases: ['kentucky fried chicken'], category: 'fast_food', region: 'global' },
  { name: 'subway', category: 'fast_food', region: 'global' },
  { name: "wendy's", aliases: ['wendys'], category: 'fast_food', region: 'global' },
  { name: 'taco bell', category: 'fast_food', region: 'global' },
  { name: 'pizza hut', category: 'fast_food', region: 'global' },
  { name: "domino's", aliases: ['dominos', "domino's pizza"], category: 'fast_food', region: 'global' },
  { name: "papa john's", aliases: ['papa johns'], category: 'fast_food', region: 'global' },
  { name: 'chipotle', aliases: ['chipotle mexican grill'], category: 'fast_food', region: 'global' },
  { name: 'five guys', category: 'fast_food', region: 'global' },
  { name: 'popeyes', aliases: ["popeye's", 'popeyes louisiana kitchen'], category: 'fast_food', region: 'global' },
  { name: "chick-fil-a", aliases: ['chick fil a', 'chickfila'], category: 'fast_food', region: 'us' },
  { name: 'in-n-out', aliases: ['in n out', 'in-n-out burger'], category: 'fast_food', region: 'us' },
  { name: "carl's jr", aliases: ['carls jr', "carl's junior"], category: 'fast_food', region: 'us' },
  { name: "hardee's", aliases: ['hardees'], category: 'fast_food', region: 'us' },
  { name: 'sonic', aliases: ['sonic drive-in'], category: 'fast_food', region: 'us' },
  { name: "arby's", aliases: ['arbys'], category: 'fast_food', region: 'us' },
  { name: 'jack in the box', category: 'fast_food', region: 'us' },
  { name: 'whataburger', category: 'fast_food', region: 'us' },
  { name: "culver's", aliases: ['culvers'], category: 'fast_food', region: 'us' },
  { name: 'shake shack', category: 'fast_food', region: 'us' },
  { name: "jimmy john's", aliases: ['jimmy johns'], category: 'fast_food', region: 'us' },
  { name: "jersey mike's", aliases: ['jersey mikes'], category: 'fast_food', region: 'us' },
  { name: 'firehouse subs', category: 'fast_food', region: 'us' },
  { name: 'wingstop', category: 'fast_food', region: 'us' },
  { name: "zaxby's", aliases: ['zaxbys'], category: 'fast_food', region: 'us' },
  { name: "raising cane's", aliases: ['raising canes'], category: 'fast_food', region: 'us' },
  { name: 'panda express', category: 'fast_food', region: 'us' },
  { name: 'el pollo loco', category: 'fast_food', region: 'us' },
  { name: 'del taco', category: 'fast_food', region: 'us' },
  { name: 'little caesars', aliases: ["little caesar's"], category: 'fast_food', region: 'us' },
  { name: 'nando\'s', aliases: ['nandos'], category: 'fast_food', region: 'global' },
  { name: 'greggs', category: 'fast_food', region: 'uk' },
  { name: 'pret a manger', aliases: ['pret'], category: 'fast_food', region: 'uk' },
  { name: 'leon', category: 'fast_food', region: 'uk' },
  { name: 'itsu', category: 'fast_food', region: 'uk' },
  { name: 'wasabi', category: 'fast_food', region: 'uk' },
  { name: 'yo sushi', aliases: ['yo! sushi'], category: 'fast_food', region: 'uk' },
  { name: 'quick', category: 'fast_food', region: 'eu' },
  { name: 'nordsee', category: 'fast_food', region: 'eu' },
  { name: 'vapiano', category: 'fast_food', region: 'eu' },
  { name: 'mos burger', category: 'fast_food', region: 'asia' },
  { name: 'yoshinoya', category: 'fast_food', region: 'asia' },
  { name: 'sukiya', category: 'fast_food', region: 'asia' },
  { name: 'jollibee', category: 'fast_food', region: 'asia' },
  { name: 'lotteria', category: 'fast_food', region: 'asia' },
  { name: "hungry jack's", aliases: ['hungry jacks'], category: 'fast_food', region: 'aus' },

  // =========================================================================
  // COFFEE CHAINS
  // =========================================================================
  { name: 'starbucks', category: 'coffee', region: 'global' },
  { name: 'costa coffee', aliases: ['costa'], category: 'coffee', region: 'global' },
  { name: "dunkin'", aliases: ['dunkin', 'dunkin donuts', "dunkin' donuts"], category: 'coffee', region: 'global' },
  { name: 'tim hortons', aliases: ["tim horton's", 'tims'], category: 'coffee', region: 'global' },
  { name: "peet's coffee", aliases: ['peets', "peet's"], category: 'coffee', region: 'us' },
  { name: 'caribou coffee', category: 'coffee', region: 'us' },
  { name: 'dutch bros', aliases: ['dutch brothers'], category: 'coffee', region: 'us' },
  { name: 'the coffee bean', aliases: ['coffee bean & tea leaf'], category: 'coffee', region: 'us' },
  { name: 'panera bread', aliases: ['panera'], category: 'coffee', region: 'us' },
  { name: 'au bon pain', category: 'coffee', region: 'us' },
  { name: 'nero', aliases: ['caffè nero', 'caffe nero'], category: 'coffee', region: 'uk' },
  { name: "mccafé", aliases: ['mccafe'], category: 'coffee', region: 'global' },
  { name: 'coffee island', category: 'coffee', region: 'eu' },
  { name: 'douwe egberts', category: 'coffee', region: 'eu' },
  { name: 'segafredo', category: 'coffee', region: 'eu' },
  { name: 'lavazza', category: 'coffee', region: 'eu' },
  { name: 'illy', aliases: ['illy caffè'], category: 'coffee', region: 'eu' },
  { name: 'blue bottle', aliases: ['blue bottle coffee'], category: 'coffee', region: 'global' },
  { name: 'paul', patterns: ['paul bakery'], category: 'coffee', region: 'eu' },
  { name: "gloria jean's", aliases: ['gloria jeans'], category: 'coffee', region: 'aus' },

  // =========================================================================
  // CASUAL DINING
  // =========================================================================
  { name: "applebee's", aliases: ['applebees'], category: 'casual_dining', region: 'us' },
  { name: "chili's", aliases: ['chilis'], category: 'casual_dining', region: 'us' },
  { name: 'olive garden', category: 'casual_dining', region: 'us' },
  { name: 'red lobster', category: 'casual_dining', region: 'us' },
  { name: 'outback steakhouse', aliases: ['outback'], category: 'casual_dining', region: 'global' },
  { name: 'tgi fridays', aliases: ["tgi friday's", 'fridays'], category: 'casual_dining', region: 'global' },
  { name: 'red robin', category: 'casual_dining', region: 'us' },
  { name: "denny's", aliases: ['dennys'], category: 'casual_dining', region: 'us' },
  { name: 'ihop', aliases: ['international house of pancakes'], category: 'casual_dining', region: 'us' },
  { name: 'cracker barrel', category: 'casual_dining', region: 'us' },
  { name: 'buffalo wild wings', aliases: ['bdubs', 'bww'], category: 'casual_dining', region: 'us' },
  { name: 'hooters', category: 'casual_dining', region: 'us' },
  { name: 'cheesecake factory', aliases: ['the cheesecake factory'], category: 'casual_dining', region: 'us' },
  { name: "p.f. chang's", aliases: ['pf changs'], category: 'casual_dining', region: 'us' },
  { name: 'texas roadhouse', category: 'casual_dining', region: 'us' },
  { name: "longhorn steakhouse", category: 'casual_dining', region: 'us' },
  { name: "carrabba's", aliases: ['carrabbas'], category: 'casual_dining', region: 'us' },
  { name: 'yard house', category: 'casual_dining', region: 'us' },
  { name: "bj's restaurant", aliases: ['bjs brewhouse'], category: 'casual_dining', region: 'us' },
  { name: 'wagamama', category: 'casual_dining', region: 'global' },
  { name: 'pizza express', category: 'casual_dining', region: 'uk' },
  { name: "zizzi", category: 'casual_dining', region: 'uk' },
  { name: 'ask italian', category: 'casual_dining', region: 'uk' },
  { name: 'prezzo', category: 'casual_dining', region: 'uk' },
  { name: 'frankie & benny\'s', aliases: ['frankie and bennys'], category: 'casual_dining', region: 'uk' },
  { name: "côte", aliases: ['cote brasserie'], category: 'casual_dining', region: 'uk' },
  { name: 'bills', aliases: ["bill's"], category: 'casual_dining', region: 'uk' },
  { name: 'hans im glück', category: 'casual_dining', region: 'eu' },
  { name: 'block house', category: 'casual_dining', region: 'eu' },
  { name: 'hard rock cafe', category: 'casual_dining', region: 'global' },
  { name: 'planet hollywood', category: 'casual_dining', region: 'global' },
  { name: 'rainforest cafe', category: 'casual_dining', region: 'global' },

  // =========================================================================
  // HOTELS
  // =========================================================================
  { name: 'hilton', patterns: ['hilton garden inn', 'doubletree', 'hampton inn', 'embassy suites', 'waldorf astoria', 'conrad'], category: 'hotel', region: 'global' },
  { name: 'marriott', patterns: ['courtyard by marriott', 'fairfield inn', 'residence inn', 'springhill suites', 'ritz-carlton', 'sheraton', 'westin', 'w hotel', 'st. regis', 'le meridien', 'aloft'], category: 'hotel', region: 'global' },
  { name: 'hyatt', patterns: ['hyatt regency', 'hyatt place', 'hyatt house', 'grand hyatt', 'park hyatt', 'andaz'], category: 'hotel', region: 'global' },
  { name: 'ihg', patterns: ['holiday inn', 'holiday inn express', 'crowne plaza', 'intercontinental', 'kimpton', 'indigo'], category: 'hotel', region: 'global' },
  { name: 'best western', patterns: ['best western plus', 'best western premier'], category: 'hotel', region: 'global' },
  { name: 'wyndham', patterns: ['ramada', 'days inn', 'super 8', 'la quinta', 'wingate'], category: 'hotel', region: 'global' },
  { name: 'choice hotels', patterns: ['comfort inn', 'comfort suites', 'quality inn', 'sleep inn', 'clarion', 'econo lodge', 'rodeway inn'], category: 'hotel', region: 'global' },
  { name: 'accor', patterns: ['novotel', 'ibis', 'mercure', 'sofitel', 'pullman', 'mgallery', 'fairmont'], category: 'hotel', region: 'global' },
  { name: 'radisson', patterns: ['radisson blu', 'radisson red', 'park inn', 'park plaza'], category: 'hotel', region: 'global' },
  { name: 'motel 6', aliases: ['motel6'], category: 'hotel', region: 'us' },
  { name: 'red roof inn', category: 'hotel', region: 'us' },
  { name: 'extended stay', patterns: ['extended stay america'], category: 'hotel', region: 'us' },
  { name: 'travelodge', category: 'hotel', region: 'global' },
  { name: 'premier inn', category: 'hotel', region: 'uk' },
  { name: 'ibis budget', category: 'hotel', region: 'global' },
  { name: 'b&b hotels', aliases: ['b and b hotels'], category: 'hotel', region: 'eu' },
  { name: 'moxy', aliases: ['moxy hotels'], category: 'hotel', region: 'global' },
  { name: 'citizenm', aliases: ['citizen m'], category: 'hotel', region: 'global' },
  { name: 'four seasons', category: 'hotel', region: 'global' },
  { name: 'mandarin oriental', category: 'hotel', region: 'global' },
  { name: 'peninsula', patterns: ['the peninsula'], category: 'hotel', region: 'global' },
  { name: 'aman', patterns: ['amanresorts'], category: 'hotel', region: 'global' },

  // =========================================================================
  // CONVENIENCE STORES
  // =========================================================================
  { name: '7-eleven', aliases: ['7 eleven', 'seven eleven', '7-11'], category: 'convenience', region: 'global' },
  { name: 'circle k', category: 'convenience', region: 'global' },
  { name: 'wawa', category: 'convenience', region: 'us' },
  { name: 'sheetz', category: 'convenience', region: 'us' },
  { name: "casey's", aliases: ['caseys'], category: 'convenience', region: 'us' },
  { name: 'quiktrip', aliases: ['qt'], category: 'convenience', region: 'us' },
  { name: 'kum & go', category: 'convenience', region: 'us' },
  { name: 'loves', aliases: ["love's", "love's travel stop"], category: 'convenience', region: 'us' },
  { name: 'pilot flying j', aliases: ['pilot', 'flying j'], category: 'convenience', region: 'us' },
  { name: 'am pm', aliases: ['ampm'], category: 'convenience', region: 'us' },
  { name: 'spar', category: 'convenience', region: 'global' },
  { name: 'lawson', category: 'convenience', region: 'asia' },
  { name: 'family mart', aliases: ['familymart'], category: 'convenience', region: 'asia' },
  { name: 'ministop', category: 'convenience', region: 'asia' },

  // =========================================================================
  // GAS STATIONS
  // =========================================================================
  { name: 'shell', category: 'gas_station', region: 'global' },
  { name: 'bp', aliases: ['british petroleum'], category: 'gas_station', region: 'global' },
  { name: 'exxon', aliases: ['exxonmobil', 'esso'], category: 'gas_station', region: 'global' },
  { name: 'mobil', category: 'gas_station', region: 'global' },
  { name: 'chevron', category: 'gas_station', region: 'global' },
  { name: 'texaco', category: 'gas_station', region: 'global' },
  { name: 'total', aliases: ['totalenergies'], category: 'gas_station', region: 'global' },
  { name: 'sunoco', category: 'gas_station', region: 'us' },
  { name: 'valero', category: 'gas_station', region: 'us' },
  { name: 'marathon', category: 'gas_station', region: 'us' },
  { name: 'phillips 66', category: 'gas_station', region: 'us' },
  { name: 'arco', category: 'gas_station', region: 'us' },
  { name: 'costco gas', aliases: ['costco gasoline'], category: 'gas_station', region: 'us' },
  { name: "sam's club gas", category: 'gas_station', region: 'us' },

  // =========================================================================
  // PHARMACIES
  // =========================================================================
  { name: 'cvs', aliases: ['cvs pharmacy'], category: 'pharmacy', region: 'us' },
  { name: 'walgreens', category: 'pharmacy', region: 'us' },
  { name: 'rite aid', category: 'pharmacy', region: 'us' },
  { name: 'boots', aliases: ['boots pharmacy'], category: 'pharmacy', region: 'uk' },
  { name: 'superdrug', category: 'pharmacy', region: 'uk' },
  { name: 'dm', aliases: ['dm drogerie markt'], category: 'pharmacy', region: 'eu' },
  { name: 'rossmann', category: 'pharmacy', region: 'eu' },
  { name: 'müller', aliases: ['muller'], category: 'pharmacy', region: 'eu' },

  // =========================================================================
  // RETAIL (for completeness)
  // =========================================================================
  { name: 'walmart', aliases: ['wal-mart'], category: 'retail', region: 'global' },
  { name: 'target', category: 'retail', region: 'us' },
  { name: 'costco', category: 'retail', region: 'global' },
  { name: "sam's club", aliases: ['sams club'], category: 'retail', region: 'us' },
  { name: 'tesco', category: 'retail', region: 'uk' },
  { name: 'sainsbury', aliases: ["sainsbury's"], category: 'retail', region: 'uk' },
  { name: 'asda', category: 'retail', region: 'uk' },
  { name: 'morrisons', category: 'retail', region: 'uk' },
  { name: 'aldi', category: 'retail', region: 'global' },
  { name: 'lidl', category: 'retail', region: 'global' },
  { name: 'carrefour', category: 'retail', region: 'global' },
  { name: 'ikea', category: 'retail', region: 'global' },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize a place name for matching
 * - Lowercase
 * - Remove special characters except spaces
 * - Collapse multiple spaces
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`´]/g, "'") // Normalize apostrophes
    .replace(/[^\w\s'-]/g, '') // Remove special chars except apostrophe and hyphen
    .replace(/\s+/g, ' ') // Collapse spaces
    .trim();
}

/**
 * Check if a name matches a chain entry
 */
function matchesChain(normalizedName: string, chain: ChainEntry): boolean {
  // Exact match
  if (normalizedName === chain.name) return true;

  // Check aliases
  if (chain.aliases?.some((alias) => normalizedName === alias)) return true;

  // Check if name contains the chain name (for "McDonald's Paris" style names)
  if (normalizedName.includes(chain.name)) return true;
  if (chain.aliases?.some((alias) => normalizedName.includes(alias))) return true;

  // Check patterns (prefix matching)
  if (chain.patterns?.some((pattern) => normalizedName.includes(pattern.toLowerCase()))) {
    return true;
  }

  return false;
}

// ============================================================================
// Main Detection Functions
// ============================================================================

/**
 * Detect if a place is a chain
 *
 * @param placeName Name of the place
 * @param placeTypes Optional Google Places types array
 * @returns ChainInfo with detection results
 */
export function detectChain(placeName: string, placeTypes?: string[]): ChainInfo {
  const normalizedName = normalizeName(placeName);

  // Check against database
  for (const chain of CHAIN_DATABASE) {
    if (matchesChain(normalizedName, chain)) {
      return {
        isChain: true,
        category: chain.category,
        chainName: chain.name,
        confidence: 'high',
        detectionMethod: 'exact',
      };
    }
  }

  // Check Google Places types for chain indicators
  if (placeTypes) {
    const chainIndicators = ['chain', 'franchise', 'fast_food_restaurant'];
    const hasChainType = placeTypes.some((type) =>
      chainIndicators.some((indicator) => type.includes(indicator))
    );

    if (hasChainType) {
      return {
        isChain: true,
        category: 'other',
        confidence: 'medium',
        detectionMethod: 'type',
      };
    }
  }

  // No match found
  return {
    isChain: false,
    confidence: 'high',
  };
}

/**
 * Check if a place is a chain (simple boolean check)
 */
export function isChain(placeName: string, placeTypes?: string[]): boolean {
  return detectChain(placeName, placeTypes).isChain;
}

/**
 * Filter out chains from a list of places
 */
export function filterOutChains<T extends { name: string; types?: string[] }>(
  places: T[]
): T[] {
  return places.filter((place) => !isChain(place.name, place.types));
}

/**
 * Partition places into chains and non-chains
 */
export function partitionByChain<T extends { name: string; types?: string[] }>(
  places: T[]
): { independents: T[]; chains: T[] } {
  const independents: T[] = [];
  const chains: T[] = [];

  places.forEach((place) => {
    if (isChain(place.name, place.types)) {
      chains.push(place);
    } else {
      independents.push(place);
    }
  });

  return { independents, chains };
}

/**
 * Add chain info to places
 */
export function addChainInfo<T extends { name: string; types?: string[] }>(
  places: T[]
): Array<T & { chainInfo: ChainInfo }> {
  return places.map((place) => ({
    ...place,
    chainInfo: detectChain(place.name, place.types),
  }));
}

// ============================================================================
// Extensibility
// ============================================================================

/** Custom chains added at runtime */
const customChains: ChainEntry[] = [];

/**
 * Add a custom chain to the detection database
 * Useful for regional chains discovered during usage
 */
export function addCustomChain(chain: ChainEntry): void {
  customChains.push({
    ...chain,
    name: normalizeName(chain.name),
    aliases: chain.aliases?.map(normalizeName),
  });

  // Add to main database for immediate use
  CHAIN_DATABASE.push(chain);
}

/**
 * Add multiple custom chains
 */
export function addCustomChains(chains: ChainEntry[]): void {
  chains.forEach(addCustomChain);
}

/**
 * Get all known chains (for debugging/admin)
 */
export function getAllKnownChains(): ChainEntry[] {
  return [...CHAIN_DATABASE];
}

/**
 * Get chains by category
 */
export function getChainsByCategory(category: ChainCategory): ChainEntry[] {
  return CHAIN_DATABASE.filter((chain) => chain.category === category);
}

/**
 * Get chains by region
 */
export function getChainsByRegion(region: string): ChainEntry[] {
  return CHAIN_DATABASE.filter((chain) => chain.region === region);
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get statistics about the chain database
 */
export function getChainDatabaseStats(): {
  total: number;
  byCategory: Record<ChainCategory, number>;
  byRegion: Record<string, number>;
} {
  const byCategory: Record<ChainCategory, number> = {
    fast_food: 0,
    coffee: 0,
    casual_dining: 0,
    hotel: 0,
    convenience: 0,
    retail: 0,
    gas_station: 0,
    pharmacy: 0,
    other: 0,
  };

  const byRegion: Record<string, number> = {};

  CHAIN_DATABASE.forEach((chain) => {
    byCategory[chain.category]++;
    const region = chain.region || 'unknown';
    byRegion[region] = (byRegion[region] || 0) + 1;
  });

  return {
    total: CHAIN_DATABASE.length,
    byCategory,
    byRegion,
  };
}
