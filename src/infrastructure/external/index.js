/**
 * External API Clients
 * Central export for all external API clients
 */
module.exports = {
  GooglePlacesClient: require('./googlePlaces.client'),
  PerplexityClient: require('./perplexity.client'),
  WikipediaClient: require('./wikipedia.client'),
  MapboxClient: require('./mapbox.client'),
  ExchangeRateClient: require('./exchangeRate.client')
};

