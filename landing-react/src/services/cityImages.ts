/**
 * Unified City Image Service
 *
 * Provides a smart multi-layer caching system for city images:
 * 1. localStorage cache (7-day TTL) - instant load
 * 2. Wikipedia API - free, high-quality images
 * 3. Backend API (checks DB → Google Places) - reliable fallback
 *
 * This minimizes API calls and provides fast, cost-effective image loading.
 */

import { getWikipediaImage } from '../utils/wikipedia';

// Cache interface for localStorage
interface CityImageCache {
  url: string;
  timestamp: number;
  source: 'wikipedia' | 'google-places';
}

// Cache duration: 7 days in milliseconds
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// LocalStorage key prefix
const CACHE_KEY_PREFIX = 'cityImage:';

/**
 * Get cache key for a city
 */
function getCacheKey(cityName: string, country?: string): string {
  const normalizedCity = cityName.toLowerCase().trim();
  const normalizedCountry = country?.toLowerCase().trim() || '';
  return `${CACHE_KEY_PREFIX}${normalizedCity}${normalizedCountry ? `:${normalizedCountry}` : ''}`;
}

/**
 * Get cached image from localStorage
 */
function getCachedImage(cityName: string, country?: string): string | null {
  try {
    const cacheKey = getCacheKey(cityName, country);
    const cachedData = localStorage.getItem(cacheKey);

    if (!cachedData) {
      return null;
    }

    const cache: CityImageCache = JSON.parse(cachedData);

    // Check if cache is expired
    const age = Date.now() - cache.timestamp;
    if (age > CACHE_DURATION_MS) {
      console.log(`⏰ LocalStorage cache expired for ${cityName} (age: ${Math.round(age / (24 * 60 * 60 * 1000))} days)`);
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log(`✅ LocalStorage cache hit for ${cityName} (source: ${cache.source}, age: ${Math.round(age / (24 * 60 * 60 * 1000))} days)`);
    return cache.url;

  } catch (error) {
    console.error('❌ Failed to get cached image:', error);
    return null;
  }
}

/**
 * Save image to localStorage cache
 */
function setCachedImage(cityName: string, url: string, source: 'wikipedia' | 'google-places', country?: string): void {
  try {
    const cacheKey = getCacheKey(cityName, country);
    const cache: CityImageCache = {
      url,
      timestamp: Date.now(),
      source
    };

    localStorage.setItem(cacheKey, JSON.stringify(cache));
    console.log(`💾 Cached ${cityName} image in localStorage (source: ${source})`);

  } catch (error) {
    console.error('❌ Failed to cache image:', error);
    // Continue anyway - caching is optional
  }
}

/**
 * Fetch city image from backend API (which checks DB cache + Google Places)
 */
async function fetchFromBackend(cityName: string, country?: string): Promise<string | null> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const params = new URLSearchParams({ city: cityName });
    if (country) {
      params.append('country', country);
    }

    const response = await fetch(`${apiUrl}/api/places/city-image?${params}`);

    if (!response.ok) {
      console.warn(`⚠️ Backend API returned ${response.status} for ${cityName}`);
      return null;
    }

    const data = await response.json();

    if (data.imageUrl) {
      console.log(`✅ Got image from backend for ${cityName} (source: ${data.source})`);

      // Cache in localStorage
      if (data.source) {
        setCachedImage(cityName, data.imageUrl, data.source, country);
      }

      return data.imageUrl;
    }

    return null;

  } catch (error) {
    console.error(`❌ Backend API error for ${cityName}:`, error);
    return null;
  }
}

/**
 * Main function: Fetch city image with smart fallback chain
 *
 * Fallback chain:
 * 1. LocalStorage cache (instant)
 * 2. Wikipedia API (free, high-quality)
 * 3. Backend API → DB cache → Google Places API (reliable)
 * 4. null (caller should show placeholder gradient)
 *
 * @param cityName - Name of the city (e.g., "Paris")
 * @param country - Optional country name for better search accuracy (e.g., "France")
 * @returns Image URL or null if no image found
 */
export async function fetchCityImage(cityName: string, country?: string): Promise<string | null> {
  try {
    console.log(`🖼️ Fetching image for: ${cityName}${country ? `, ${country}` : ''}`);

    // Step 1: Check localStorage cache (instant load)
    const cachedUrl = getCachedImage(cityName, country);
    if (cachedUrl) {
      return cachedUrl;
    }

    // Step 2: Try Wikipedia (free, high-quality images)
    console.log(`📚 Trying Wikipedia for ${cityName}...`);
    const wikipediaUrl = await getWikipediaImage(cityName, 800);

    if (wikipediaUrl) {
      console.log(`✅ Found Wikipedia image for ${cityName}`);
      // Cache the Wikipedia result
      setCachedImage(cityName, wikipediaUrl, 'wikipedia', country);
      return wikipediaUrl;
    }

    // Step 3: Try backend API (checks DB cache + Google Places)
    console.log(`🌐 Trying backend API for ${cityName}...`);
    const backendUrl = await fetchFromBackend(cityName, country);

    if (backendUrl) {
      return backendUrl;
    }

    // Step 4: No image found
    console.log(`❌ No image found for ${cityName}`);
    return null;

  } catch (error) {
    console.error(`❌ fetchCityImage error for ${cityName}:`, error);
    return null;
  }
}

/**
 * Clear all city image caches from localStorage
 * Useful for debugging or freeing up storage
 */
export function clearCityImageCache(): void {
  try {
    const keys = Object.keys(localStorage);
    let count = 0;

    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
        count++;
      }
    });

    console.log(`🧹 Cleared ${count} city image cache entries from localStorage`);

  } catch (error) {
    console.error('❌ Failed to clear city image cache:', error);
  }
}

/**
 * Get cache statistics
 * Useful for monitoring cache usage
 */
export function getCityImageCacheStats(): { count: number; totalSize: number } {
  try {
    const keys = Object.keys(localStorage);
    let count = 0;
    let totalSize = 0;

    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        count++;
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
    });

    return { count, totalSize };

  } catch (error) {
    console.error('❌ Failed to get cache stats:', error);
    return { count: 0, totalSize: 0 };
  }
}
