/**
 * City Enrichment Service
 * Fetches activities/highlights and images for cities using Perplexity API
 */

import { getWikipediaImage } from '../utils/wikipedia'

/**
 * Call Perplexity API to get city highlights and activities
 */
export async function fetchCityActivities(cityName: string): Promise<string[]> {
  try {
    console.log(`Fetching activities for ${cityName} from Perplexity...`)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `List exactly 3 must-do activities or attractions in ${cityName}. Be very specific with names of places. Format as:
- Activity 1
- Activity 2
- Activity 3`,
      }),
    })

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Perplexity response:', data)

    // Parse the response to extract highlights
    const highlights = parsePerplexityResponse(data.answer || data.response || '')
    console.log(`Parsed ${highlights.length} activities for ${cityName}:`, highlights)

    if (highlights.length >= 3) {
      return highlights.slice(0, 3)
    }

    // If we got less than 3, return what we have with fallbacks
    const fallbacks = [
      'Explore the historic city center',
      'Try local cuisine',
      'Visit cultural attractions'
    ]

    return [...highlights, ...fallbacks].slice(0, 3)
  } catch (error) {
    console.error('Failed to fetch activities from Perplexity:', error)
    return ['Explore the historic city center', 'Try local cuisine', 'Visit cultural attractions']
  }
}

/**
 * Parse Perplexity API response to extract bullet points
 */
function parsePerplexityResponse(response: string): string[] {
  if (!response || response.trim().length === 0) {
    return []
  }

  console.log('Full response to parse:', response)

  const activities: string[] = []

  // Format 1: Bullet points with -, •, or *
  const bulletMatches = response.match(/[-•*]\s*([^\n\r]+)/g)
  if (bulletMatches && bulletMatches.length > 0) {
    bulletMatches.forEach((match) => {
      const cleaned = match.replace(/^[-•*]\s*/, '').trim()
      // Filter out incomplete sentences and meta text
      if (
        cleaned.length > 15 &&
        cleaned.length < 150 &&
        !cleaned.toLowerCase().includes('here are') &&
        !cleaned.toLowerCase().includes('must-do') &&
        cleaned.includes(' ') && // Must have at least one space (multiple words)
        /[A-Z]/.test(cleaned[0]) // Must start with capital letter
      ) {
        activities.push(cleaned)
      }
    })
  }

  // Format 2: Numbered list (1., 2., 3.)
  if (activities.length === 0) {
    const numberedMatches = response.match(/\d+\.\s*([^\n\r.]+(?:\.[^\n\r.]+)*)/g)
    if (numberedMatches && numberedMatches.length > 0) {
      numberedMatches.forEach((match) => {
        let cleaned = match.replace(/^\d+\.\s*/, '').trim()
        // Remove any trailing incomplete text
        cleaned = cleaned.replace(/\s+for\s*$/, '').replace(/\s+in\s*$/, '').trim()

        if (
          cleaned.length > 15 &&
          cleaned.length < 150 &&
          !cleaned.toLowerCase().includes('here are') &&
          cleaned.includes(' ')
        ) {
          activities.push(cleaned)
        }
      })
    }
  }

  // Format 3: Look for complete sentences
  if (activities.length === 0) {
    const sentences = response.split(/[.!?]+/)
    sentences.forEach((sentence) => {
      const trimmed = sentence.trim()
      if (
        trimmed.length > 20 &&
        trimmed.length < 150 &&
        trimmed.includes(' ') &&
        !trimmed.toLowerCase().includes('here are') &&
        !trimmed.toLowerCase().includes('activities') &&
        /[A-Z]/.test(trimmed[0])
      ) {
        activities.push(trimmed)
      }
    })
  }

  console.log(`Extracted ${activities.length} clean activities:`, activities)
  return activities.slice(0, 3)
}

/**
 * Enrich a city with activities and image
 */
export async function enrichCityData(
  cityName: string
): Promise<{ activities: string[]; imageUrl: string | null }> {
  console.log(`Enriching city data for: ${cityName}`)

  // Fetch both activities and image in parallel
  const [activities, imageUrl] = await Promise.all([
    fetchCityActivities(cityName),
    getWikipediaImage(cityName, 800, 600),
  ])

  console.log(`Enriched ${cityName}:`, {
    activities: activities.length,
    hasImage: !!imageUrl,
  })

  return {
    activities,
    imageUrl,
  }
}
