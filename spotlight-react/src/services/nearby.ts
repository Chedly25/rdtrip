/**
 * Nearby Places Service
 * Phase 2: Trip in Progress Mode
 *
 * Frontend service for fetching nearby places during a trip
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get auth token from localStorage
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('rdtrip_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Nearby place interface
export interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  distance: string;
  distanceMeters: number;
  walkingTime: number;
  drivingTime: number;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;
  isOpen: boolean | null;
  closingTime: string | null;
  photo: string | null;
  tags: string[];
  coordinates: { lat: number; lng: number };
  address: string | null;
  matchReason: string | null;
}

// Search options
export interface NearbySearchOptions {
  latitude: number;
  longitude: number;
  category?: string;
  radius?: number;
  limit?: number;
}

// Search response
export interface NearbySearchResponse {
  places: NearbyPlace[];
  source: 'google' | 'mock';
  count?: number;
}

/**
 * Fetch nearby places
 */
export async function fetchNearbyPlaces(options: NearbySearchOptions): Promise<NearbySearchResponse> {
  const params = new URLSearchParams({
    lat: options.latitude.toString(),
    lng: options.longitude.toString(),
  });

  if (options.category) {
    params.set('category', options.category);
  }
  if (options.radius) {
    params.set('radius', options.radius.toString());
  }
  if (options.limit) {
    params.set('limit', options.limit.toString());
  }

  const response = await fetch(`${API_BASE_URL}/nearby?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch nearby places: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Open navigation to a place
 */
export function navigateToPlace(
  place: NearbyPlace,
  options?: {
    preferredApp?: 'google' | 'apple' | 'waze';
    mode?: 'driving' | 'walking' | 'transit';
  }
): void {
  const { lat, lng } = place.coordinates;

  // Detect platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const preferredApp = options?.preferredApp || (isIOS ? 'apple' : 'google');
  const mode = options?.mode || 'driving';

  let url: string;

  switch (preferredApp) {
    case 'apple':
      // Apple Maps
      url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=${mode === 'walking' ? 'w' : 'd'}`;
      break;
    case 'waze':
      // Waze
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
      break;
    case 'google':
    default:
      // Google Maps
      const modeParam = mode === 'walking' ? 'walking' : mode === 'transit' ? 'transit' : 'driving';
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${place.id}&travelmode=${modeParam}`;
      break;
  }

  window.open(url, '_blank');
}

/**
 * Call a place (if phone number available)
 */
export function callPlace(phone: string): void {
  const cleanPhone = phone.replace(/\D/g, '');
  window.location.href = `tel:${cleanPhone}`;
}

/**
 * Get category icon name for a place type
 */
export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    food: 'utensils',
    coffee: 'coffee',
    sights: 'camera',
    shopping: 'shopping-bag',
    gas: 'fuel',
    pharmacy: 'pill',
  };
  return iconMap[category] || 'map-pin';
}

/**
 * Format price level
 */
export function formatPriceLevel(level: number | null): string {
  if (level === null) return '';
  return '$'.repeat(level);
}
