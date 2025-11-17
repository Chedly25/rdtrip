/**
 * Exchange Rate API Client
 * Thin wrapper for currency conversion API calls
 */
const axios = require('axios');

class ExchangeRateClient {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.baseUrl = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}`
      : 'https://api.exchangerate-api.com/v4/latest';
  }

  /**
   * Get exchange rates for a base currency
   */
  async getRates(baseCurrency = 'EUR') {
    try {
      let url;
      
      if (this.apiKey) {
        url = `${this.baseUrl}/latest/${baseCurrency}`;
      } else {
        url = `${this.baseUrl}/${baseCurrency}`;
      }

      const response = await axios.get(url, {
        timeout: 5000,
        headers: { Accept: 'application/json' }
      });

      // Extract rates (format differs between paid/free API)
      const rates = this.apiKey
        ? response.data.conversion_rates
        : response.data.rates;

      if (!rates) {
        throw new Error('Invalid API response format');
      }

      return rates;
    } catch (error) {
      if (error.response) {
        throw new Error(`Exchange rate API error: ${error.response.status}`);
      }
      throw error;
    }
  }
}

module.exports = ExchangeRateClient;

