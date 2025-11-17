/**
 * Wikipedia API Client
 * Thin wrapper for Wikipedia REST API calls
 */
const axios = require('axios');

class WikipediaClient {
  constructor() {
    this.baseUrl = 'https://en.wikipedia.org/api/rest_v1';
    this.commonsUrl = 'https://commons.wikimedia.org/w/api.php';
  }

  /**
   * Get page summary (includes images)
   */
  async getPageSummary(title) {
    try {
      const cleanTitle = title.trim().replace(/[()]/g, '');
      const url = `${this.baseUrl}/page/summary/${encodeURIComponent(cleanTitle)}`;
      
      const response = await axios.get(url, {
        headers: { Accept: 'application/json' },
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Page not found
      }
      throw error;
    }
  }

  /**
   * Search Wikimedia Commons for images
   */
  async searchCommonsImages(searchTerm, limit = 3, width = 800) {
    try {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: searchTerm,
        gsrlimit: limit.toString(),
        prop: 'imageinfo',
        iiprop: 'url',
        iiurlwidth: width.toString(),
        origin: '*'
      });

      const response = await axios.get(`${this.commonsUrl}?${params}`, {
        timeout: 5000
      });

      return response.data.query?.pages || null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = WikipediaClient;

