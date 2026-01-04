/**
 * Planning Enrichment Utilities
 *
 * Core intelligence functions that determine:
 * - Valid slots for a place (when can you visit)
 * - Best slot for a place (optimal time)
 * - Duration estimation (how long to spend)
 * - Hidden gem detection (high quality, low tourist count)
 * - Geographic clustering (group nearby places)
 */

import type {
  Slot,
  PlaceCategory,
  VibeTags,
  EnrichedPlace,
  OpeningPeriod,
} from '../types/planning';

// ============================================================================
// Type Mappings
// ============================================================================

/**
 * Map Google Places types to our PlaceCategory
 */
const TYPE_TO_CATEGORY: Record<string, PlaceCategory> = {
  // Food & Drink
  cafe: 'cafe',
  coffee_shop: 'cafe',
  bakery: 'cafe',
  restaurant: 'restaurant',
  food: 'restaurant',
  meal_delivery: 'restaurant',
  meal_takeaway: 'restaurant',
  bar: 'bar',
  night_club: 'nightlife',
  casino: 'nightlife',

  // Culture
  museum: 'museum',
  art_gallery: 'gallery',
  library: 'museum',
  church: 'church',
  hindu_temple: 'church',
  mosque: 'church',
  synagogue: 'church',
  place_of_worship: 'church',

  // Outdoors
  park: 'park',
  natural_feature: 'park',
  campground: 'park',
  zoo: 'activity',
  amusement_park: 'activity',
  aquarium: 'activity',

  // Landmarks & Attractions
  tourist_attraction: 'landmark',
  point_of_interest: 'landmark',
  establishment: 'landmark',
  premise: 'landmark',

  // Shopping
  shopping_mall: 'shopping',
  store: 'shopping',
  clothing_store: 'shopping',
  department_store: 'shopping',
  jewelry_store: 'shopping',
  shoe_store: 'shopping',
  book_store: 'shopping',

  // Markets
  supermarket: 'market',
  grocery_or_supermarket: 'market',

  // Beach
  // Note: Google doesn't have a specific 'beach' type, detected via name
  natural_feature_beach: 'beach',

  // Viewpoints
  // Note: Detected via name keywords

  // Accommodation
  lodging: 'accommodation',
  hotel: 'accommodation',
  guest_house: 'accommodation',

  // Activities
  spa: 'activity',
  gym: 'activity',
  bowling_alley: 'activity',
  movie_theater: 'activity',
  stadium: 'activity',
};

/**
 * Map Google Places types to valid slots
 */
const TYPE_TO_SLOTS: Record<string, Slot[]> = {
  // Food & Drink
  cafe: ['morning', 'afternoon'],
  bakery: ['morning'],
  restaurant: ['afternoon', 'evening'],
  bar: ['evening', 'night'],
  night_club: ['night'],

  // Culture
  museum: ['morning', 'afternoon'],
  art_gallery: ['morning', 'afternoon'],
  church: ['morning', 'afternoon'],
  library: ['morning', 'afternoon'],

  // Outdoors
  park: ['morning', 'afternoon', 'evening'],
  natural_feature: ['morning', 'afternoon'],

  // Activities
  shopping_mall: ['afternoon'],
  supermarket: ['morning'],
  spa: ['morning', 'afternoon'],
  gym: ['morning'],
  movie_theater: ['afternoon', 'evening'],
  bowling_alley: ['afternoon', 'evening'],
  casino: ['evening', 'night'],

  // Landmarks - flexible
  tourist_attraction: ['morning', 'afternoon', 'evening'],
  point_of_interest: ['morning', 'afternoon', 'evening'],
};

/**
 * Duration estimates by type (in minutes)
 */
const TYPE_TO_DURATION: Record<string, number> = {
  cafe: 45,
  bakery: 20,
  restaurant: 75,
  bar: 60,
  night_club: 180,
  museum: 120,
  art_gallery: 90,
  church: 30,
  library: 60,
  park: 60,
  beach: 180,
  viewpoint: 30,
  market: 60,
  shopping_mall: 90,
  spa: 120,
  gym: 60,
  movie_theater: 150,
  bowling_alley: 90,
  casino: 120,
  tourist_attraction: 60,
  landmark: 45,
  activity: 90,
  accommodation: 0, // Not a visit duration
};

// ============================================================================
// Core Enrichment Functions
// ============================================================================

/**
 * Infer the PlaceCategory from Google Places types
 */
export function inferCategory(types: string[], name: string): PlaceCategory {
  // Check name for special keywords first
  const nameLower = name.toLowerCase();

  // Beach detection
  if (nameLower.includes('beach') || nameLower.includes('playa') || nameLower.includes('plage')) {
    return 'beach';
  }

  // Viewpoint detection
  if (
    nameLower.includes('viewpoint') ||
    nameLower.includes('mirador') ||
    nameLower.includes('belvedere') ||
    nameLower.includes('panorama') ||
    nameLower.includes('lookout')
  ) {
    return 'viewpoint';
  }

  // Market detection
  if (nameLower.includes('market') || nameLower.includes('mercado') || nameLower.includes('marché')) {
    return 'market';
  }

  // Check types
  for (const type of types) {
    if (TYPE_TO_CATEGORY[type]) {
      return TYPE_TO_CATEGORY[type];
    }
  }

  return 'other';
}

/**
 * Infer valid time slots for a place based on type and opening hours
 */
export function inferValidSlots(
  types: string[],
  name: string,
  openingHours?: { periods?: OpeningPeriod[] }
): Slot[] {
  const nameLower = name.toLowerCase();

  // Special cases based on name
  if (nameLower.includes('sunrise')) {
    return ['morning'];
  }
  if (nameLower.includes('sunset') || nameLower.includes('rooftop')) {
    return ['afternoon', 'evening'];
  }

  // Get base slots from type
  let slots: Slot[] = ['morning', 'afternoon', 'evening'];

  for (const type of types) {
    if (TYPE_TO_SLOTS[type]) {
      slots = TYPE_TO_SLOTS[type];
      break;
    }
  }

  // If we have opening hours, filter based on actual hours
  if (openingHours?.periods && openingHours.periods.length > 0) {
    slots = filterByActualHours(slots, openingHours.periods);
  }

  return slots.length > 0 ? slots : ['morning', 'afternoon', 'evening'];
}

/**
 * Filter slots based on actual opening hours
 */
function filterByActualHours(slots: Slot[], periods: OpeningPeriod[]): Slot[] {
  const slotToHours: Record<Slot, { start: number; end: number }> = {
    morning: { start: 800, end: 1200 },
    afternoon: { start: 1200, end: 1800 },
    evening: { start: 1800, end: 2200 },
    night: { start: 2200, end: 200 },
  };

  const validSlots: Slot[] = [];

  for (const slot of slots) {
    const { start, end } = slotToHours[slot];

    // Check if any period overlaps with this slot
    const hasOverlap = periods.some((period) => {
      const openTime = parseInt(period.open.time, 10);
      const closeTime = parseInt(period.close.time, 10);

      // Handle overnight hours
      if (closeTime < openTime) {
        // Place is open overnight
        return openTime <= end || closeTime >= start;
      }

      // Normal hours
      return openTime < end && closeTime > start;
    });

    if (hasOverlap) {
      validSlots.push(slot);
    }
  }

  return validSlots;
}

/**
 * Infer the best/optimal time slot for a place
 */
export function inferBestSlot(
  types: string[],
  name: string,
  category: PlaceCategory
): Slot | null {
  const nameLower = name.toLowerCase();

  // Sunset spots → evening
  if (
    nameLower.includes('sunset') ||
    nameLower.includes('panorama') ||
    nameLower.includes('mirador') ||
    nameLower.includes('viewpoint') ||
    category === 'viewpoint'
  ) {
    return 'evening';
  }

  // Museums → morning (beat the crowds)
  if (types.includes('museum') || types.includes('art_gallery') || category === 'museum' || category === 'gallery') {
    return 'morning';
  }

  // Markets → morning (freshest)
  if (types.includes('market') || nameLower.includes('market') || category === 'market') {
    return 'morning';
  }

  // Cafes → morning
  if (types.includes('cafe') || category === 'cafe') {
    return 'morning';
  }

  // Rooftop bars → evening
  if (nameLower.includes('rooftop') && (types.includes('bar') || category === 'bar')) {
    return 'evening';
  }

  // Beaches → morning or afternoon
  if (category === 'beach') {
    return 'morning';
  }

  // Restaurants → depends on time
  if (category === 'restaurant') {
    // Lunch spots vs dinner spots could be inferred from price level
    return null; // No strong preference
  }

  // Bars → evening
  if (category === 'bar') {
    return 'evening';
  }

  // Nightlife → night
  if (category === 'nightlife') {
    return 'night';
  }

  return null; // No strong preference
}

/**
 * Estimate how long to spend at a place
 */
export function estimateDuration(types: string[], category: PlaceCategory, name: string): number {
  // Check category first
  if (TYPE_TO_DURATION[category]) {
    return TYPE_TO_DURATION[category];
  }

  // Check types
  for (const type of types) {
    if (TYPE_TO_DURATION[type]) {
      return TYPE_TO_DURATION[type];
    }
  }

  // Name-based adjustments
  const nameLower = name.toLowerCase();

  if (nameLower.includes('cathedral') || nameLower.includes('basilica')) {
    return 45; // Longer than regular church
  }

  if (nameLower.includes('palace') || nameLower.includes('castle')) {
    return 90;
  }

  if (nameLower.includes('garden') || nameLower.includes('botanical')) {
    return 75;
  }

  return 60; // Default
}

/**
 * Detect if a place is a "hidden gem" - high quality but not tourist-flooded
 */
export function isHiddenGem(rating?: number, reviewCount?: number): boolean {
  const r = rating || 0;
  const reviews = reviewCount || 0;

  // High quality (4.3+) but not tourist-flooded (<500 reviews)
  // Also needs minimum reviews to be credible (20+)
  return r >= 4.3 && reviews >= 20 && reviews < 500;
}

/**
 * Infer vibe tags for a place
 */
export function inferVibeTags(
  types: string[],
  name: string,
  category: PlaceCategory,
  rating?: number,
  reviewCount?: number,
  priceLevel?: number
): VibeTags[] {
  const tags: VibeTags[] = [];
  const nameLower = name.toLowerCase();

  // Romantic indicators
  if (
    nameLower.includes('romantic') ||
    nameLower.includes('intimate') ||
    nameLower.includes('cozy') ||
    (category === 'restaurant' && priceLevel && priceLevel >= 3)
  ) {
    tags.push('romantic');
  }

  // Chill/relaxed
  if (
    nameLower.includes('chill') ||
    nameLower.includes('relax') ||
    category === 'cafe' ||
    category === 'park' ||
    category === 'beach'
  ) {
    tags.push('chill');
  }

  // Lively
  if (
    category === 'bar' ||
    category === 'nightlife' ||
    nameLower.includes('club') ||
    nameLower.includes('pub')
  ) {
    tags.push('lively');
  }

  // Family-friendly
  if (
    category === 'park' ||
    types.includes('zoo') ||
    types.includes('amusement_park') ||
    types.includes('aquarium')
  ) {
    tags.push('family-friendly');
  }

  // Local favourite (hidden gem indicator)
  if (isHiddenGem(rating, reviewCount)) {
    tags.push('local-favourite');
  }

  // Instagrammable (viewpoints, famous landmarks)
  if (
    category === 'viewpoint' ||
    nameLower.includes('panorama') ||
    nameLower.includes('iconic') ||
    (rating && rating >= 4.5 && reviewCount && reviewCount > 5000)
  ) {
    tags.push('instagrammable');
  }

  // Historic
  if (
    category === 'church' ||
    category === 'museum' ||
    nameLower.includes('historic') ||
    nameLower.includes('ancient') ||
    nameLower.includes('medieval') ||
    nameLower.includes('castle') ||
    nameLower.includes('palace')
  ) {
    tags.push('historic');
  }

  // Scenic
  if (category === 'viewpoint' || category === 'beach' || category === 'park') {
    tags.push('scenic');
  }

  // Foodie
  if (
    category === 'restaurant' ||
    category === 'market' ||
    nameLower.includes('gourmet') ||
    nameLower.includes('michelin') ||
    nameLower.includes('tasting')
  ) {
    tags.push('foodie');
  }

  return tags;
}

// ============================================================================
// Full Enrichment Function
// ============================================================================

/**
 * Enrich a raw Google Places result with computed fields
 */
export function enrichPlace(rawPlace: {
  place_id: string;
  name: string;
  types?: string[];
  geometry?: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  opening_hours?: { periods?: OpeningPeriod[]; weekday_text?: string[] };
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  photos?: { url: string }[];
}): EnrichedPlace {
  const types = rawPlace.types || [];
  const name = rawPlace.name;

  const category = inferCategory(types, name);
  const validSlots = inferValidSlots(types, name, rawPlace.opening_hours);
  const bestSlot = inferBestSlot(types, name, category);
  const duration = estimateDuration(types, category, name);
  const hiddenGem = isHiddenGem(rawPlace.rating, rawPlace.user_ratings_total);
  const vibeTags = inferVibeTags(
    types,
    name,
    category,
    rawPlace.rating,
    rawPlace.user_ratings_total,
    rawPlace.price_level
  );

  return {
    place_id: rawPlace.place_id,
    name: rawPlace.name,
    types,
    geometry: rawPlace.geometry || { location: { lat: 0, lng: 0 } },
    rating: rawPlace.rating,
    user_ratings_total: rawPlace.user_ratings_total,
    price_level: rawPlace.price_level,
    opening_hours: rawPlace.opening_hours,
    formatted_address: rawPlace.formatted_address,
    formatted_phone_number: rawPlace.formatted_phone_number,
    website: rawPlace.website,
    photos: rawPlace.photos?.map((p) => ({ url: p.url })),

    // Enriched fields
    cluster_id: null, // Set by clustering algorithm
    valid_slots: validSlots,
    best_slot: bestSlot,
    estimated_duration_mins: duration,
    category,
    vibe_tags: vibeTags,
    is_hidden_gem: hiddenGem,
  };
}

// ============================================================================
// Geographic Clustering (Simple K-Means)
// ============================================================================

/**
 * Haversine distance between two points (in km)
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate walking time between two points (in minutes)
 * Assumes average walking speed of 5 km/h
 */
export function estimateWalkingTime(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const distanceKm = haversineDistance(lat1, lng1, lat2, lng2);
  // 5 km/h average walking speed, add 20% for real-world conditions
  return Math.round((distanceKm / 5) * 60 * 1.2);
}

/**
 * Estimate driving time between two points (in minutes)
 * Very rough estimate - assumes 30 km/h average city speed
 */
export function estimateDrivingTime(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const distanceKm = haversineDistance(lat1, lng1, lat2, lng2);
  // 30 km/h average city speed, add 30% for traffic/parking
  return Math.round((distanceKm / 30) * 60 * 1.3);
}

/**
 * Simple K-Means clustering for places
 */
export function clusterPlaces(
  places: EnrichedPlace[],
  k: number = 4,
  maxIterations: number = 50
): EnrichedPlace[] {
  if (places.length <= k) {
    // Each place is its own cluster
    return places.map((place, i) => ({
      ...place,
      cluster_id: `cluster_${i}`,
    }));
  }

  // Initialize centroids randomly from existing points
  const shuffled = [...places].sort(() => Math.random() - 0.5);
  let centroids = shuffled.slice(0, k).map((p) => ({
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
  }));

  let assignments: number[] = new Array(places.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each point to nearest centroid
    const newAssignments = places.map((place) => {
      let minDist = Infinity;
      let minIdx = 0;

      centroids.forEach((centroid, idx) => {
        const dist = haversineDistance(
          place.geometry.location.lat,
          place.geometry.location.lng,
          centroid.lat,
          centroid.lng
        );
        if (dist < minDist) {
          minDist = dist;
          minIdx = idx;
        }
      });

      return minIdx;
    });

    // Check convergence
    if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
      break;
    }
    assignments = newAssignments;

    // Update centroids
    centroids = centroids.map((_, idx) => {
      const clusterPoints = places.filter((_, i) => assignments[i] === idx);
      if (clusterPoints.length === 0) return centroids[idx];

      return {
        lat: clusterPoints.reduce((sum, p) => sum + p.geometry.location.lat, 0) / clusterPoints.length,
        lng: clusterPoints.reduce((sum, p) => sum + p.geometry.location.lng, 0) / clusterPoints.length,
      };
    });
  }

  // Return places with cluster assignments
  return places.map((place, i) => ({
    ...place,
    cluster_id: `cluster_${assignments[i]}`,
  }));
}

// ============================================================================
// Price Level Display
// ============================================================================

export function formatPriceLevel(level?: number): string {
  if (level === undefined || level === null) return '';
  if (level === 0) return 'Free';
  return '€'.repeat(level);
}

// ============================================================================
// Category Icons
// ============================================================================

export const CATEGORY_ICONS: Record<PlaceCategory, string> = {
  cafe: '☕',
  restaurant: '🍽️',
  bar: '🍷',
  museum: '🏛️',
  gallery: '🎨',
  landmark: '🏛️',
  park: '🌳',
  beach: '🏖️',
  viewpoint: '🌇',
  shopping: '🛍️',
  activity: '🎯',
  nightlife: '🎉',
  accommodation: '🏨',
  market: '🥖',
  church: '⛪',
  other: '📍',
};
