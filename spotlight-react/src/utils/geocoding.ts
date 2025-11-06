// Simple geocoding utility using Mapbox Geocoding API
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface Coordinates {
  lng: number;
  lat: number;
}

// Cache for geocoded results
const geocodeCache = new Map<string, Coordinates>();

export async function geocodeCity(cityName: string): Promise<Coordinates | null> {
  // Check cache first
  if (geocodeCache.has(cityName)) {
    return geocodeCache.get(cityName)!;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );

    if (!response.ok) {
      console.error('Geocoding failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      const coords = { lng, lat };
      geocodeCache.set(cityName, coords);
      return coords;
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Fallback: approximate coordinates for common European cities
const CITY_FALLBACKS: { [key: string]: Coordinates } = {
  'Madrid': { lng: -3.7038, lat: 40.4168 },
  'Barcelona': { lng: 2.1686, lat: 41.3874 },
  'Paris': { lng: 2.3522, lat: 48.8566 },
  'Rome': { lng: 12.4964, lat: 41.9028 },
  'Lisbon': { lng: -9.1393, lat: 38.7223 },
  'Porto': { lng: -8.6291, lat: 41.1579 },
  'Seville': { lng: -5.9845, lat: 37.3891 },
  'Valencia': { lng: -0.3763, lat: 39.4699 },
  'Milan': { lng: 9.1900, lat: 45.4642 },
  'Florence': { lng: 11.2558, lat: 43.7696 },
  'Venice': { lng: 12.3155, lat: 45.4408 },
  'Amsterdam': { lng: 4.9041, lat: 52.3676 },
  'Brussels': { lng: 4.3517, lat: 50.8503 },
  'London': { lng: -0.1278, lat: 51.5074 },
  'Berlin': { lng: 13.4050, lat: 52.5200 },
  'Munich': { lng: 11.5820, lat: 48.1351 },
  'Vienna': { lng: 16.3738, lat: 48.2082 },
  'Prague': { lng: 14.4378, lat: 50.0755 },
  'Budapest': { lng: 19.0402, lat: 47.4979 }
};

export function getCityCoordinates(cityName: string): Coordinates | null {
  // Clean up city name (remove country, extra info)
  const cleanName = cityName.split(',')[0].trim();

  // Check fallbacks first for immediate response
  return CITY_FALLBACKS[cleanName] || null;
}
