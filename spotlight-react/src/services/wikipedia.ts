/**
 * Wikipedia API service for fetching city images
 */

/**
 * Fetch a Wikipedia image for a city
 * @param cityName - The name of the city
 * @returns URL of the city image or null if not found
 */
export async function fetchCityImage(cityName: string): Promise<string | null> {
  try {
    // Use Wikipedia REST API to search for the city page
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=${encodeURIComponent(cityName)}&pithumbsize=400&origin=*`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.query && data.query.pages) {
      const pages = Object.values(data.query.pages) as any[];
      const page = pages[0];

      if (page && page.thumbnail) {
        return page.thumbnail.source;
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch Wikipedia image for ${cityName}:`, error);
    return null;
  }
}

/**
 * Cache for storing fetched images to avoid repeated API calls
 */
const imageCache = new Map<string, string | null>();

/**
 * Fetch a Wikipedia image with caching
 * @param cityName - The name of the city
 * @returns URL of the city image or null if not found
 */
export async function fetchCityImageCached(cityName: string): Promise<string | null> {
  if (imageCache.has(cityName)) {
    return imageCache.get(cityName)!;
  }

  const imageUrl = await fetchCityImage(cityName);
  imageCache.set(cityName, imageUrl);
  return imageUrl;
}
