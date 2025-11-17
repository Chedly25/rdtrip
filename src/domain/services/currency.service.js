/**
 * Currency Service
 * Real-time currency conversion with caching
 */
const BaseService = require('./BaseService');

// Major European and international currencies
const SUPPORTED_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF',
  'RON', 'BGN', 'HRK', 'ISK', 'TRY', 'RUB', 'UAH', 'CAD', 'AUD', 'NZD',
  'JPY', 'CNY', 'INR', 'BRL', 'MXN', 'ZAR', 'SGD', 'HKD', 'KRW', 'THB'
];

// Fallback exchange rates (updated periodically, used when API fails)
const FALLBACK_RATES = {
  'USD': 1.08, 'GBP': 0.86, 'CHF': 0.96, 'SEK': 11.50, 'NOK': 11.80,
  'DKK': 7.46, 'PLN': 4.35, 'CZK': 24.50, 'HUF': 390.00, 'RON': 4.97,
  'BGN': 1.96, 'HRK': 7.53, 'ISK': 150.00, 'TRY': 35.00, 'RUB': 100.00,
  'UAH': 40.00, 'CAD': 1.47, 'AUD': 1.66, 'NZD': 1.78, 'JPY': 162.00,
  'CNY': 7.85, 'INR': 90.00, 'BRL': 5.40, 'MXN': 18.50, 'ZAR': 20.00,
  'SGD': 1.45, 'HKD': 8.45, 'KRW': 1430.00, 'THB': 38.00
};

class CurrencyService extends BaseService {
  constructor(exchangeRateClient) {
    super('Currency');
    this.client = exchangeRateClient;
    this.baseCurrency = 'EUR';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Convert amount from one currency to EUR
   */
  async convertToEUR(amount, fromCurrency) {
    if (fromCurrency === 'EUR') {
      return amount;
    }

    this.logAction('Convert to EUR', { amount, fromCurrency });

    try {
      const rate = await this.getExchangeRate(fromCurrency, 'EUR');
      const convertedAmount = amount * rate;

      this.logger.info(`Converted ${amount} ${fromCurrency} to ${convertedAmount.toFixed(2)} EUR (rate: ${rate})`);
      return parseFloat(convertedAmount.toFixed(2));

    } catch (error) {
      this.logger.warn('Currency conversion failed, using fallback', { error: error.message });

      // Use fallback rate
      const fallbackRate = this.getFallbackRate(fromCurrency);
      const convertedAmount = amount / fallbackRate;

      return parseFloat(convertedAmount.toFixed(2));
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(from, to) {
    this.logAction('Get exchange rate', { from, to });

    // Check cache first
    const cacheKey = `${from}_${to}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      this.logger.debug(`Using cached rate for ${from} → ${to}`);
      return cached.rate;
    }

    try {
      // Fetch latest rates
      const rates = await this.client.getRates(from);
      const rate = rates[to];

      if (!rate) {
        throw new Error(`No rate available for ${from} → ${to}`);
      }

      // Cache the rate
      this.cache.set(cacheKey, {
        rate,
        timestamp: Date.now()
      });

      this.logger.info(`Fetched exchange rate ${from} → ${to}: ${rate}`);
      return rate;

    } catch (error) {
      this.logger.error('Failed to fetch exchange rate', { from, to, error: error.message });

      // Try to calculate from fallback rates
      if (to === 'EUR') {
        const fallbackRate = this.getFallbackRate(from);
        return 1 / fallbackRate;
      }

      throw error;
    }
  }

  /**
   * Convert amount between any two currencies
   */
  async convert(amount, from, to) {
    if (from === to) {
      return amount;
    }

    this.logAction('Convert currency', { amount, from, to });

    try {
      const rate = await this.getExchangeRate(from, to);
      return parseFloat((amount * rate).toFixed(2));

    } catch (error) {
      this.logger.warn('Direct conversion failed, using EUR as intermediate');

      // Try fallback conversion via EUR
      if (from !== 'EUR' && to !== 'EUR') {
        const toEUR = await this.convertToEUR(amount, from);
        const fromEURRate = await this.getExchangeRate('EUR', to);
        return parseFloat((toEUR * fromEURRate).toFixed(2));
      }

      throw error;
    }
  }

  /**
   * Batch convert multiple amounts to EUR
   */
  async batchConvertToEUR(expenses) {
    this.logAction('Batch convert to EUR', { count: expenses.length });

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

    const results = await Promise.all(conversions);
    const successCount = results.filter(r => r.success).length;

    this.logger.info(`Batch conversion complete: ${successCount}/${results.length} successful`);
    return results;
  }

  /**
   * Get fallback exchange rate (EUR-based)
   */
  getFallbackRate(currency) {
    if (currency === 'EUR') {
      return 1.0;
    }

    const rate = FALLBACK_RATES[currency];

    if (!rate) {
      this.logger.warn(`No fallback rate for ${currency}, using 1.0`);
      return 1.0;
    }

    return rate;
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES;
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(currency) {
    return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
  }

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currency) {
    const symbols = {
      'EUR': '€', 'USD': '$', 'GBP': '£', 'JPY': '¥', 'CNY': '¥',
      'INR': '₹', 'RUB': '₽', 'CHF': 'Fr', 'SEK': 'kr', 'NOK': 'kr',
      'DKK': 'kr', 'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft', 'RON': 'lei',
      'TRY': '₺', 'BRL': 'R$', 'MXN': '$', 'ZAR': 'R', 'CAD': '$',
      'AUD': '$', 'NZD': '$', 'SGD': '$', 'HKD': '$', 'KRW': '₩', 'THB': '฿'
    };

    return symbols[currency] || currency;
  }

  /**
   * Format amount with currency
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
    this.logger.info('Exchange rate cache cleared');
  }

  /**
   * Get cache statistics
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
   */
  getHealthStatus() {
    return {
      serviceName: 'CurrencyService',
      status: 'ready',
      baseCurrency: this.baseCurrency,
      apiConfigured: !!this.client,
      supportedCurrencies: SUPPORTED_CURRENCIES.length,
      cache: this.getCacheStats()
    };
  }
}

module.exports = CurrencyService;

