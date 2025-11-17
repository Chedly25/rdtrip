/**
 * Google Places API Client
 * Thin wrapper for Google Places API calls
 */
const axios = require('axios');

class GooglePlacesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    
    if (!this.apiKey) {
      throw new Error('Google Places API key is required');
    }
  }

  /**
   * Text search for places
   */
  async textSearch(query, location = null) {
    const params = {
      query,
      key: this.apiKey
    };

    if (location) {
      params.location = `${location.lat},${location.lng}`;
      params.radius = 5000;
    }

    const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
      params,
      timeout: 10000
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${response.data.status}`);
    }

    return response.data.results || [];
  }

  /**
   * Nearby search
   */
  async nearbySearch(location, radius, type = null, keyword = null) {
    const params = {
      location: `${location.lat},${location.lng}`,
      radius,
      key: this.apiKey
    };

    if (type) params.type = type;
    if (keyword) params.keyword = keyword;

    const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
      params,
      timeout: 10000
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Nearby search error: ${response.data.status}`);
    }

    return response.data.results || [];
  }

  /**
   * Get place details
   */
  async getDetails(placeId) {
    const response = await axios.get(`${this.baseUrl}/details/json`, {
      params: {
        place_id: placeId,
        key: this.apiKey,
        fields: 'place_id,name,formatted_address,formatted_phone_number,geometry,rating,user_ratings_total,price_level,opening_hours,photos,types,website,url,reviews,editorial_summary'
      },
      timeout: 10000
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Place details error: ${response.data.status}`);
    }

    return response.data.result;
  }

  /**
   * Get photo URL
   */
  getPhotoUrl(photoReference, maxWidth = 800) {
    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  /**
   * Get distance matrix
   */
  async getDistanceMatrix(origins, destinations, mode = 'walking') {
    const originsStr = origins.map(o => `${o.lat},${o.lng}`).join('|');
    const destinationsStr = destinations.map(d => `${d.lat},${d.lng}`).join('|');

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: originsStr,
        destinations: destinationsStr,
        mode,
        units: 'metric',
        key: this.apiKey
      },
      timeout: 15000
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Distance Matrix error: ${response.data.status}`);
    }

    return response.data;
  }
}

module.exports = GooglePlacesClient;

