/**
 * Geocoding utilities for fetching city coordinates
 * Uses Nominatim (OpenStreetMap) API - free, no API key needed
 */

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Fetch coordinates for a city using Nominatim API (OpenStreetMap)
 * @param cityName - Name of the city to geocode
 * @param countryHint - Optional country hint to improve accuracy (e.g., "France", "Spain")
 * @returns Promise resolving to [lng, lat] coordinates or null if not found
 */
export async function fetchCityCoordinates(
  cityName: string,
  countryHint?: string
): Promise<[number, number] | null> {
  try {
    // Build search query
    const searchQuery = countryHint ? `${cityName}, ${countryHint}` : cityName

    // Use Nominatim API (OpenStreetMap) - free, no key required
    const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
      q: searchQuery,
      format: 'json',
      limit: '1',
      addressdetails: '1'
    })

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RDTrip-RouteOptimization/1.0' // Required by Nominatim
      }
    })

    if (!response.ok) {
      console.warn(`Geocoding failed for ${cityName}: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    if (data && data.length > 0) {
      const result = data[0]
      const lat = parseFloat(result.lat)
      const lng = parseFloat(result.lon)

      console.log(`✓ Geocoded ${cityName}: [${lng}, ${lat}]`)
      return [lng, lat] // Return as [lng, lat] to match our coordinate format
    }

    console.warn(`No coordinates found for ${cityName}`)
    return null
  } catch (error) {
    console.error(`Error geocoding ${cityName}:`, error)
    return null
  }
}

/**
 * Attempt to infer country from existing route cities
 * Helps improve geocoding accuracy
 */
export function inferCountryFromRoute(routeCities: { name: string }[]): string | undefined {
  // Common European countries in our routes
  const europeanCountries = {
    france: ['paris', 'lyon', 'marseille', 'nice', 'toulouse', 'bordeaux', 'nantes', 'strasbourg', 'avignon', 'aix-en-provence'],
    spain: ['barcelona', 'madrid', 'valencia', 'seville', 'bilbao', 'malaga', 'granada', 'figueres', 'girona'],
    italy: ['rome', 'milan', 'florence', 'venice', 'naples', 'turin', 'bologna'],
    switzerland: ['geneva', 'zurich', 'bern', 'lausanne', 'basel'],
    germany: ['berlin', 'munich', 'hamburg', 'cologne', 'frankfurt']
  }

  // Check which country appears most in the route
  const countryMatches: Record<string, number> = {}

  for (const city of routeCities) {
    const cityLower = city.name.toLowerCase()
    for (const [country, cities] of Object.entries(europeanCountries)) {
      if (cities.some(c => cityLower.includes(c) || c.includes(cityLower))) {
        countryMatches[country] = (countryMatches[country] || 0) + 1
      }
    }
  }

  // Return most common country
  const entries = Object.entries(countryMatches)
  if (entries.length > 0) {
    const [country] = entries.reduce((a, b) => (a[1] > b[1] ? a : b))
    return country.charAt(0).toUpperCase() + country.slice(1) // Capitalize
  }

  return undefined
}
