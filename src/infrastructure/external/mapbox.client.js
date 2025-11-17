/**
 * Mapbox API Client
 * Thin wrapper for Mapbox API calls
 */
const axios = require('axios');

class MapboxClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.mapbox.com';
    
    if (!this.accessToken) {
      throw new Error('Mapbox access token is required');
    }
  }

  /**
   * Forward geocoding (address → coordinates)
   */
  async geocode(searchText, options = {}) {
    try {
      const params = {
        access_token: this.accessToken,
        limit: options.limit || 5,
        ...options
      };

      const response = await axios.get(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json`,
        { params, timeout: 10000 }
      );

      return response.data.features || [];
    } catch (error) {
      throw new Error(`Geocoding error: ${error.message}`);
    }
  }

  /**
   * Reverse geocoding (coordinates → address)
   */
  async reverseGeocode(longitude, latitude, options = {}) {
    try {
      const params = {
        access_token: this.accessToken,
        ...options
      };

      const response = await axios.get(
        `${this.baseUrl}/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
        { params, timeout: 10000 }
      );

      return response.data.features || [];
    } catch (error) {
      throw new Error(`Reverse geocoding error: ${error.message}`);
    }
  }

  /**
   * Get directions
   */
  async getDirections(coordinates, profile = 'driving', options = {}) {
    try {
      // coordinates should be array of [lng, lat] pairs
      const coords = coordinates.map(c => `${c[0]},${c[1]}`).join(';');
      
      const params = {
        access_token: this.accessToken,
        geometries: 'geojson',
        overview: 'full',
        steps: true,
        ...options
      };

      const response = await axios.get(
        `${this.baseUrl}/directions/v5/mapbox/${profile}/${coords}`,
        { params, timeout: 15000 }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Directions error: ${error.message}`);
    }
  }
}

module.exports = MapboxClient;

