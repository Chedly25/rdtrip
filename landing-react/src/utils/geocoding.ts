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
  // Defensive: Ensure routeCities is actually an array
  if (!Array.isArray(routeCities)) {
    console.error('❌ inferCountryFromRoute: routeCities is not an array:', typeof routeCities, routeCities)
    return undefined
  }

  // Edge case: Empty route
  if (routeCities.length === 0) {
    console.log('⚠️ inferCountryFromRoute: Empty route, cannot infer country')
    return undefined
  }

  // Common European countries in our routes - EXPANDED
  const europeanCountries = {
    france: ['paris', 'lyon', 'marseille', 'nice', 'toulouse', 'bordeaux', 'nantes', 'strasbourg', 'avignon', 'aix-en-provence', 'annecy', 'grenoble', 'montpellier', 'nimes', 'nîmes', 'dijon', 'reims', 'lille', 'cannes', 'antibes'],
    spain: ['barcelona', 'madrid', 'valencia', 'seville', 'bilbao', 'malaga', 'granada', 'figueres', 'girona', 'san sebastian', 'toledo', 'cordoba', 'zaragoza'],
    italy: ['rome', 'milan', 'florence', 'venice', 'naples', 'turin', 'bologna', 'verona', 'pisa', 'genoa', 'siena', 'padua'],
    switzerland: ['geneva', 'zurich', 'bern', 'lausanne', 'basel', 'lucerne', 'interlaken', 'zermatt', 'montreux'],
    austria: ['vienna', 'salzburg', 'innsbruck', 'graz', 'hallstatt', 'linz'],
    germany: ['berlin', 'munich', 'hamburg', 'cologne', 'frankfurt', 'stuttgart', 'dresden', 'nuremberg', 'heidelberg']
  }

  // Check which country appears most in the route
  const countryMatches: Record<string, number> = {}

  for (const city of routeCities) {
    const cityLower = city.name.toLowerCase().trim()
    for (const [country, cities] of Object.entries(europeanCountries)) {
      // Exact match gets higher priority (score of 3)
      if (cities.includes(cityLower)) {
        countryMatches[country] = (countryMatches[country] || 0) + 3
      }
      // Partial match gets lower score (score of 1)
      else if (cities.some(c => cityLower.includes(c) || c.includes(cityLower))) {
        countryMatches[country] = (countryMatches[country] || 0) + 1
      }
    }
  }

  console.log('🌍 Country inference:', {
    cities: routeCities.map(c => c.name),
    matches: countryMatches
  })

  // Return most common country
  const entries = Object.entries(countryMatches)
  if (entries.length > 0) {
    const [country, score] = entries.reduce((a, b) => (a[1] > b[1] ? a : b))
    const capitalizedCountry = country.charAt(0).toUpperCase() + country.slice(1)
    console.log(`✅ Inferred country: ${capitalizedCountry} (score: ${score})`)
    return capitalizedCountry
  }

  console.log('⚠️ Could not infer country from route')
  return undefined
}
