/**
 * currencyConversion - Currency Conversion
 *
 * Converts amounts between currencies using Exchange Rate API.
 * Free tier: 1500 requests/month
 */

const axios = require('axios');

/**
 * @param {Object} args
 * @param {number} args.amount - Amount to convert
 * @param {string} args.from - Source currency code (e.g., 'USD')
 * @param {string} args.to - Target currency code (e.g., 'EUR')
 */
async function currencyConversion({ amount, from, to }) {
  try {
    console.log(`💱 Converting ${amount} ${from} to ${to}`);

    const apiKey = process.env.EXCHANGERATE_API_KEY || 'free';

    // Use ExchangeRate-API (has free tier)
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`);

    if (!response.data || !response.data.rates) {
      return {
        success: false,
        error: 'Could not fetch exchange rates'
      };
    }

    const rates = response.data.rates;
    const targetRate = rates[to.toUpperCase()];

    if (!targetRate) {
      return {
        success: false,
        error: `Currency code "${to}" not found`
      };
    }

    const convertedAmount = amount * targetRate;

    console.log(`✅ Converted: ${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`);

    return {
      success: true,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      rate: targetRate,
      timestamp: response.data.time_last_updated || new Date().toISOString()
    };

  } catch (error) {
    console.error('Error converting currency:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to convert currency'
    };
  }
}

module.exports = currencyConversion;
