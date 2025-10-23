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
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Provide 3-4 key highlights and attractions for ${cityName}. Focus on must-see places, activities, and unique experiences. Format as bullet points.`,
      }),
    })

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`)
    }

    const data = await response.json()

    // Parse the response to extract highlights
    const highlights = parsePerplexityResponse(data.answer || data.response || '')

    return highlights.length > 0
      ? highlights
      : ['Explore the historic city center', 'Try local cuisine', 'Visit cultural attractions']
  } catch (error) {
    console.warn('Failed to fetch activities from Perplexity:', error)
    return ['Explore the historic city center', 'Try local cuisine', 'Visit cultural attractions']
  }
}

/**
 * Parse Perplexity API response to extract bullet points
 */
function parsePerplexityResponse(response: string): string[] {
  // Extract bullet points or numbered lists
  const bulletPoints =
    response.match(/[-•*]\s*([^\n\r]+)/g) || response.match(/\d+\.\s*([^\n\r]+)/g) || []

  if (bulletPoints.length > 0) {
    return bulletPoints.slice(0, 4).map((point) => {
      const cleaned = point.replace(/^[-•*\d.\s]+/, '').trim()
      return cleaned.length > 60 ? cleaned.substring(0, 57) + '...' : cleaned
    })
  }

  // Fallback: split by sentences and take first few
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 10)
  return sentences.slice(0, 3).map((s) => s.trim().substring(0, 60) + '...')
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
