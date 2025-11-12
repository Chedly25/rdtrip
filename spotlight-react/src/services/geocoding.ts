/**
 * Geocoding service for converting place names to coordinates
 */

export interface GeocodingResult {
  name: string;
  displayName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  country?: string;
  type?: 'city' | 'landmark' | 'place';
}

/**
 * Geocode a place name using the backend API
 * @param placeName Name of the city or landmark
 * @returns Geocoding result with coordinates
 */
export async function geocodePlace(placeName: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(`/api/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cityName: placeName }),
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.coordinates) {
      return {
        name: placeName,
        displayName: data.displayName || placeName,
        coordinates: data.coordinates,
        country: data.country,
        type: data.type || 'place'
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Search for places matching a query
 * @param query Search query
 * @returns Array of matching places
 */
export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(`/api/city-autocomplete?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return data.map((place: any) => ({
        name: place.name || place.city,
        displayName: place.displayName || `${place.name}, ${place.country}`,
        coordinates: place.coordinates,
        country: place.country,
        type: 'city'
      }));
    }

    return [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Get coordinates from a city object or string
 */
export function extractCoordinates(city: any): { lat: number; lng: number } | null {
  if (typeof city === 'string') {
    return null;
  }
  if (city?.coordinates) {
    return city.coordinates;
  }
  return null;
}
