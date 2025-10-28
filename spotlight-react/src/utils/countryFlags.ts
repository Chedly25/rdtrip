// Country name to flag emoji mapping
const countryToFlag: Record<string, string> = {
  // Europe
  france: '🇫🇷',
  spain: '🇪🇸',
  italy: '🇮🇹',
  germany: '🇩🇪',
  netherlands: '🇳🇱',
  belgium: '🇧🇪',
  switzerland: '🇨🇭',
  austria: '🇦🇹',
  portugal: '🇵🇹',
  greece: '🇬🇷',
  poland: '🇵🇱',
  czechia: '🇨🇿',
  'czech republic': '🇨🇿',
  hungary: '🇭🇺',
  sweden: '🇸🇪',
  norway: '🇳🇴',
  denmark: '🇩🇰',
  finland: '🇫🇮',
  ireland: '🇮🇪',
  croatia: '🇭🇷',
  romania: '🇷🇴',
  bulgaria: '🇧🇬',
  slovenia: '🇸🇮',
  slovakia: '🇸🇰',
  luxembourg: '🇱🇺',
  iceland: '🇮🇸',

  // North America
  'united states': '🇺🇸',
  usa: '🇺🇸',
  canada: '🇨🇦',
  mexico: '🇲🇽',

  // Asia
  japan: '🇯🇵',
  china: '🇨🇳',
  'south korea': '🇰🇷',
  india: '🇮🇳',
  thailand: '🇹🇭',
  vietnam: '🇻🇳',
  singapore: '🇸🇬',
  malaysia: '🇲🇾',
  indonesia: '🇮🇩',
  philippines: '🇵🇭',

  // Oceania
  australia: '🇦🇺',
  'new zealand': '🇳🇿',

  // Middle East
  'united arab emirates': '🇦🇪',
  uae: '🇦🇪',
  israel: '🇮🇱',
  turkey: '🇹🇷',

  // Africa
  'south africa': '🇿🇦',
  egypt: '🇪🇬',
  morocco: '🇲🇦',

  // South America
  brazil: '🇧🇷',
  argentina: '🇦🇷',
  chile: '🇨🇱',
  peru: '🇵🇪',
  colombia: '🇨🇴',

  // UK
  'united kingdom': '🇬🇧',
  uk: '🇬🇧',
  england: '🇬🇧',
  scotland: '🏴󐁧󐁢󐁳󐁣󐁴󐁿',
  wales: '🏴󐁧󐁢󐁷󐁬󐁳󐁿',
}

/**
 * Get flag emoji for a country name
 */
export function getCountryFlag(country: string): string {
  if (!country) return '🏳️'

  const normalized = country.toLowerCase().trim()
  return countryToFlag[normalized] || '🌍'
}

/**
 * Extract country from city name (e.g., "Paris, France" -> "France")
 * Returns null if no country found
 */
export function extractCountry(cityName: string): string | null {
  if (!cityName) return null

  // Check if the city name has ", Country" format
  const parts = cityName.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    return parts[parts.length - 1] // Return the last part (country)
  }

  return null
}

/**
 * Get country from Mapbox geocoding result
 */
export async function getCountryFromGeocoding(cityName: string): Promise<string | null> {
  const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ'

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${MAPBOX_TOKEN}&types=place&limit=1`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]

      // Look for country in context
      if (feature.context) {
        for (const ctx of feature.context) {
          if (ctx.id.startsWith('country.')) {
            return ctx.text
          }
        }
      }

      // Try place_name (e.g., "Amsterdam, Netherlands")
      if (feature.place_name) {
        const extracted = extractCountry(feature.place_name)
        if (extracted) return extracted
      }
    }
  } catch (error) {
    console.error('Failed to get country from geocoding:', error)
  }

  return null
}

/**
 * Format city with country and flag
 * Example: "Amsterdam" + "Netherlands" -> "🇳🇱 Amsterdam, Netherlands"
 */
export function formatCityWithCountry(cityName: string, country: string | null): { display: string; flag: string; country: string | null } {
  if (!country) {
    return {
      display: cityName,
      flag: '🌍',
      country: null,
    }
  }

  const flag = getCountryFlag(country)

  // If city name already contains country, don't duplicate it
  if (cityName.toLowerCase().includes(country.toLowerCase())) {
    return {
      display: cityName,
      flag,
      country,
    }
  }

  return {
    display: `${cityName}, ${country}`,
    flag,
    country,
  }
}
