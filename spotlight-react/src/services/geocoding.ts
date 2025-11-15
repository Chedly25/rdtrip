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
  countryCode?: string;
  type?: 'city' | 'landmark' | 'place';
  photoUrl?: string;
  placeId?: string;
  formattedAddress?: string;
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
 * Search for places matching a query (cities or landmarks)
 * @param query Search query
 * @param type Type of place to search for ('city' or 'landmark')
 * @returns Array of matching places
 */
export async function searchPlaces(
  query: string,
  type: 'city' | 'landmark' = 'city'
): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(`/api/places/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, type }),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data.results)) {
      return data.results.map((place: any) => ({
        name: place.name,
        displayName: place.displayName,
        coordinates: place.coordinates,
        country: place.country,
        countryCode: place.countryCode,
        type: type,
        photoUrl: place.photoUrl,
        placeId: place.placeId,
        formattedAddress: place.formattedAddress
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
