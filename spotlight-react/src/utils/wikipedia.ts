/**
 * Wikipedia Image Fetching Utility
 * Fetches high-quality images from Wikipedia for city waypoints
 */

const imageCache = new Map<string, string>()

export async function getWikipediaImage(
  locationName: string,
  width: number = 800,
  height: number = 600
): Promise<string | null> {
  // Check cache first
  const cacheKey = `${locationName}_${width}x${height}`
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!
  }

  try {
    // Strategy 1: Try Wikipedia page summary (fastest)
    const summaryResult = await getWikipediaPageImage(locationName, width)
    if (summaryResult) {
      imageCache.set(cacheKey, summaryResult)
      return summaryResult
    }

    // Strategy 2: Search Wikimedia Commons
    const commonsResult = await searchWikimediaCommons(locationName, width, height)
    if (commonsResult) {
      imageCache.set(cacheKey, commonsResult)
      return commonsResult
    }

    // Strategy 3: Try simplified search terms
    const simplifiedResult = await getSimplifiedLocationImage(locationName, width, height)
    if (simplifiedResult) {
      imageCache.set(cacheKey, simplifiedResult)
      return simplifiedResult
    }
  } catch (error) {
    console.warn(`Could not fetch Wikipedia image for ${locationName}:`, error)
  }

  return null // No placeholder - we want real images only
}

async function getWikipediaPageImage(locationName: string, width: number = 800): Promise<string | null> {
  try {
    // Try to extract just the city name (before comma)
    // e.g., "Aix-en-Provence, France" -> "Aix-en-Provence"
    const cityName = locationName.split(',')[0].trim()

    // Remove parentheses but keep hyphens (important for cities like Aix-en-Provence)
    const cleanName = cityName.replace(/[()]/g, '').trim()

    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`,
      { headers: { Accept: 'application/json' } }
    )

    if (response.ok) {
      const data = await response.json()

      // Prefer original image for best quality, fallback to thumbnail
      if (data.originalimage && data.originalimage.source) {
        console.log(`Found original image for ${cleanName}:`, data.originalimage.source)
        return data.originalimage.source
      }

      if (data.thumbnail && data.thumbnail.source) {
        // Get higher resolution image
        const imageUrl = data.thumbnail.source.replace(/\/\d+px-/, `/${width}px-`)
        console.log(`Found thumbnail for ${cleanName}, scaled to ${width}px:`, imageUrl)
        return imageUrl
      }

      console.warn(`No image found in Wikipedia response for ${cleanName}`)
    }
  } catch (error) {
    console.warn(`Wikipedia page image search failed for ${locationName}:`, error)
  }

  return null
}

async function searchWikimediaCommons(
  locationName: string,
  width: number = 800,
  height: number = 600
): Promise<string | null> {
  try {
    const searchTerm = `${locationName} city view OR ${locationName} panorama OR ${locationName} skyline`

    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?` +
        new URLSearchParams({
          action: 'query',
          format: 'json',
          generator: 'search',
          gsrsearch: searchTerm,
          gsrlimit: '5',
          prop: 'imageinfo',
          iiprop: 'url',
          iiurlwidth: width.toString(),
          iiurlheight: height.toString(),
          origin: '*',
        })
    )

    if (response.ok) {
      const data = await response.json()
      const pages = data.query?.pages

      if (pages) {
        const firstPage = Object.values(pages)[0] as any
        if (firstPage?.imageinfo?.[0]?.thumburl) {
          return firstPage.imageinfo[0].thumburl
        }
      }
    }
  } catch (error) {
    console.warn(`Wikimedia Commons search failed for ${locationName}:`, error)
  }

  return null
}

async function getSimplifiedLocationImage(
  locationName: string,
  width: number = 800,
  height: number = 600
): Promise<string | null> {
  try {
    // Extract just the city name (before comma or hyphen)
    const cityMatch = locationName.match(/^([^,\-()]+)/)
    if (!cityMatch) return null

    const cityName = cityMatch[1].trim()

    // Try with just city name
    const result = await getWikipediaPageImage(cityName, width)
    if (result) return result

    // Try Wikimedia Commons with city name
    return await searchWikimediaCommons(cityName, width, height)
  } catch (error) {
    console.warn(`Simplified location image search failed for ${locationName}:`, error)
  }

  return null
}
