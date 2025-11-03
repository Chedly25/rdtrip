/**
 * Wikipedia Image Fetching Utility
 * Fetches high-quality images from Wikipedia for city waypoints
 */

const imageCache = new Map<string, string>()

export async function getWikipediaImage(
  locationName: string,
  width: number = 800
): Promise<string | null> {
  // Validate input
  if (!locationName || typeof locationName !== 'string') {
    console.warn('Wikipedia image search: invalid location name', locationName)
    return null
  }

  // Check cache first
  const cacheKey = `${locationName}_${width}`
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!
  }

  try {
    // Clean location name for Wikipedia search
    const cleanName = locationName.replace(/[,()]/g, '').trim()

    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`,
      { headers: { Accept: 'application/json' } }
    )

    if (response.ok) {
      const data = await response.json()

      if (data.thumbnail && data.thumbnail.source) {
        // Get higher resolution image
        const imageUrl = data.thumbnail.source.replace(/\/\d+px-/, `/${width}px-`)
        imageCache.set(cacheKey, imageUrl)
        return imageUrl
      }
    }
  } catch (error) {
    console.warn(`Wikipedia image search failed for ${locationName}:`, error)
  }

  return null
}
