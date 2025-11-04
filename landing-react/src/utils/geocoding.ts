/**
 * Geocoding utilities for fetching city coordinates
 * Uses Google Places API via backend for reliable, accurate geocoding
 */

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Fetch coordinates for a city using Google Places API via backend
 * @param cityName - Name of the city to geocode
 * @param countryHint - Optional country hint to improve accuracy (e.g., "France", "Spain")
 * @returns Promise resolving to [lat, lng] coordinates or null if not found
 */
export async function fetchCityCoordinates(
  cityName: string,
  countryHint?: string
): Promise<[number, number] | null> {
  try {
    // Build search query with country hint if provided
    const searchQuery = countryHint ? `${cityName}, ${countryHint}` : cityName

    console.log(`🌍 Fetching coordinates for ${searchQuery}...`)

    // Use our backend geocoding endpoint with Google Places API
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cityName: searchQuery }),
    })

    if (!response.ok) {
      console.warn(`Geocoding failed for ${cityName}: ${response.statusText}`)
      return null
    }

    const data = await response.json()

    if (data && data.coordinates) {
      const { lat, lng } = data.coordinates

      console.log(`✅ Got coordinates for ${cityName}: lat=${lat}, lng=${lng}`)
      return [lat, lng] // Return as [lat, lng] in CORRECT order
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
