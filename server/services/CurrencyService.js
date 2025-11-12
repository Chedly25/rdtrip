/**
 * CurrencyService
 *
 * Real-time currency conversion service using ExchangeRate-API.
 * Converts expenses to EUR for accurate balance calculations across multiple currencies.
 */

const axios = require('axios');

// Major European and international currencies
const SUPPORTED_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF',
  'RON', 'BGN', 'HRK', 'ISK', 'TRY', 'RUB', 'UAH', 'CAD', 'AUD', 'NZD',
  'JPY', 'CNY', 'INR', 'BRL', 'MXN', 'ZAR', 'SGD', 'HKD', 'KRW', 'THB'
];

// Fallback exchange rates (updated periodically, used when API fails)
const FALLBACK_RATES = {
  'USD': 1.08,
  'GBP': 0.86,
  'CHF': 0.96,
  'SEK': 11.50,
  'NOK': 11.80,
  'DKK': 7.46,
  'PLN': 4.35,
  'CZK': 24.50,
  'HUF': 390.00,
  'RON': 4.97,
  'BGN': 1.96,
  'HRK': 7.53,
  'ISK': 150.00,
  'TRY': 35.00,
  'RUB': 100.00,
  'UAH': 40.00,
  'CAD': 1.47,
  'AUD': 1.66,
  'NZD': 1.78,
  'JPY': 162.00,
  'CNY': 7.85,
  'INR': 90.00,
  'BRL': 5.40,
  'MXN': 18.50,
  'ZAR': 20.00,
  'SGD': 1.45,
  'HKD': 8.45,
  'KRW': 1430.00,
  'THB': 38.00
};

class CurrencyService {
  constructor() {
    this.baseCurrency = 'EUR';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.apiKey = process.env.EXCHANGERATE_API_KEY || null;

    // ExchangeRate-API endpoints
    this.apiBaseUrl = this.apiKey
      ? `https://v6.exchangerate-api.com/v6/${this.apiKey}`
      : 'https://api.exchangerate-api.com/v4/latest'; // Free tier (limited)

    if (!this.apiKey) {
      console.warn('EXCHANGERATE_API_KEY not set - using free tier with rate limits');
    }
  }

  /**
   * Convert amount from one currency to EUR
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @returns {Promise<number>} Amount in EUR
   */
  async convertToEUR(amount, fromCurrency) {
    // If already in EUR, no conversion needed
    if (fromCurrency === 'EUR') {
      return amount;
    }

    try {
      const rate = await this.getExchangeRate(fromCurrency, 'EUR');
      const convertedAmount = amount * rate;

      console.log(`Converted ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} EUR (rate: ${rate})`);

      return parseFloat(convertedAmount.toFixed(2));
    } catch (error) {
      console.error(`Currency conversion failed for ${fromCurrency}:`, error);

      // Use fallback rate
      const fallbackRate = this._getFallbackRate(fromCurrency);
      const convertedAmount = amount / fallbackRate;

      console.warn(`Using fallback rate for ${fromCurrency}: ${fallbackRate}`);

      return parseFloat(convertedAmount.toFixed(2));
    }
  }

  /**
   * Get exchange rate between two currencies
   * @param {string} from - Source currency code
   * @param {string} to - Target currency code
   * @returns {Promise<number>} Exchange rate
   */
  async getExchangeRate(from, to) {
    // Check cache first
    const cacheKey = `${from}_${to}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`Using cached rate for ${from} → ${to}`);
      return cached.rate;
    }

    try {
      // Fetch latest rates
      const rates = await this._fetchRates(from);
      const rate = rates[to];

      if (!rate) {
        throw new Error(`No rate available for ${from} → ${to}`);
      }

      // Cache the rate
      this.cache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      });

      return rate;
    } catch (error) {
      console.error(`Failed to fetch exchange rate ${from} → ${to}:`, error);

      // Try to calculate from fallback rates
      if (to === 'EUR') {
        const fallbackRate = this._getFallbackRate(from);
        return 1 / fallbackRate;
      }

      throw error;
    }
  }

  /**
   * Fetch latest exchange rates from API
   * @param {string} baseCurrency - Base currency code
   * @returns {Promise<Object>} Exchange rates object
   */
  async _fetchRates(baseCurrency) {
    try {
      let url;

      if (this.apiKey) {
        // Paid API - more reliable
        url = `${this.apiBaseUrl}/latest/${baseCurrency}`;
      } else {
        // Free API
        url = `${this.apiBaseUrl}/${baseCurrency}`;
      }

      console.log(`Fetching exchange rates for ${baseCurrency}...`);

      const response = await axios.get(url, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Accept': 'application/json'
        }
      });

      // Extract rates from response (format differs between APIs)
      const rates = this.apiKey
        ? response.data.conversion_rates
        : response.data.rates;

      if (!rates) {
        throw new Error('Invalid API response format');
      }

      console.log(`Successfully fetched ${Object.keys(rates).length} exchange rates`);

      return rates;
    } catch (error) {
      if (error.response) {
        // API returned error response
        console.error('Exchange rate API error:', error.response.status, error.response.data);
      } else if (error.request) {
        // No response received
        console.error('Exchange rate API timeout or network error');
      } else {
        console.error('Exchange rate request error:', error.message);
      }

      throw new Error('Failed to fetch exchange rates from API');
    }
  }

  /**
   * Get fallback exchange rate (EUR-based)
   * @param {string} currency - Currency code
   * @returns {number} Fallback rate
   */
  _getFallbackRate(currency) {
    if (currency === 'EUR') {
      return 1.0;
    }

    const rate = FALLBACK_RATES[currency];

    if (!rate) {
      console.warn(`No fallback rate for ${currency}, using 1.0`);
      return 1.0;
    }

    return rate;
  }

  /**
   * Convert amount between any two currencies
   * @param {number} amount - Amount to convert
   * @param {string} from - Source currency code
   * @param {string} to - Target currency code
   * @returns {Promise<number>} Converted amount
   */
  async convert(amount, from, to) {
    if (from === to) {
      return amount;
    }

    try {
      const rate = await this.getExchangeRate(from, to);
      return parseFloat((amount * rate).toFixed(2));
    } catch (error) {
      console.error(`Currency conversion failed ${from} → ${to}:`, error);

      // Try fallback conversion via EUR
      if (from !== 'EUR' && to !== 'EUR') {
        const toEUR = await this.convertToEUR(amount, from);
        const fromEUR = await this.getExchangeRate('EUR', to);
        return parseFloat((toEUR * fromEUR).toFixed(2));
      }

      throw error;
    }
  }

  /**
   * Get all supported currencies
   * @returns {Array} Array of currency codes
   */
  getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES;
  }

  /**
   * Check if currency is supported
   * @param {string} currency - Currency code
   * @returns {boolean} Whether currency is supported
   */
  isCurrencySupported(currency) {
    return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
  }

  /**
   * Get currency symbol
   * @param {string} currency - Currency code
   * @returns {string} Currency symbol
   */
  getCurrencySymbol(currency) {
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹',
      'RUB': '₽',
      'CHF': 'Fr',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'PLN': 'zł',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'RON': 'lei',
      'TRY': '₺',
      'BRL': 'R$',
      'MXN': '$',
      'ZAR': 'R',
      'CAD': '$',
      'AUD': '$',
      'NZD': '$',
      'SGD': '$',
      'HKD': '$',
      'KRW': '₩',
      'THB': '฿'
    };

    return symbols[currency] || currency;
  }

  /**
   * Format amount with currency
   * @param {number} amount - Amount
   * @param {string} currency - Currency code
   * @returns {string} Formatted string
   */
  formatAmount(amount, currency) {
    const symbol = this.getCurrencySymbol(currency);
    const formatted = amount.toFixed(2);

    // Currency symbol position varies by currency
    if (['EUR', 'GBP', 'CHF'].includes(currency)) {
      return `${symbol}${formatted}`;
    }

    return `${formatted} ${symbol}`;
  }

  /**
   * Clear exchange rate cache
   */
  clearCache() {
    this.cache.clear();
    console.log('Exchange rate cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheExpiry) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheExpiryHours: this.cacheExpiry / (60 * 60 * 1000)
    };
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      serviceName: 'CurrencyService',
      status: 'ready',
      baseCurrency: this.baseCurrency,
      apiKeyConfigured: !!this.apiKey,
      apiTier: this.apiKey ? 'paid' : 'free',
      supportedCurrencies: SUPPORTED_CURRENCIES.length,
      cache: this.getCacheStats()
    };
  }

  /**
   * Batch convert multiple amounts to EUR
   * @param {Array} expenses - Array of {amount, currency} objects
   * @returns {Promise<Array>} Array of EUR amounts
   */
  async batchConvertToEUR(expenses) {
    const conversions = expenses.map(async (expense) => {
      try {
        const eurAmount = await this.convertToEUR(expense.amount, expense.currency);
        return {
          original: expense.amount,
          currency: expense.currency,
          eur: eurAmount,
          success: true
        };
      } catch (error) {
        return {
          original: expense.amount,
          currency: expense.currency,
          eur: null,
          success: false,
          error: error.message
        };
      }
    });

    return Promise.all(conversions);
  }
}

// Export singleton instance
module.exports = new CurrencyService();
