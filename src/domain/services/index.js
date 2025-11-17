/**
 * Services Index
 * Central export for all domain services
 */
module.exports = {
  BaseService: require('./BaseService'),
  GooglePlacesService: require('./googlePlaces.service'),
  PerplexityAIService: require('./perplexityAI.service'),
  WikipediaImageService: require('./wikipediaImage.service'),
  GeocodingService: require('./geocoding.service'),
  CurrencyService: require('./currency.service'),
  ReceiptScannerService: require('./receiptScanner.service'),
  BudgetCalculatorService: require('./budgetCalculator.service'),
  ExportService: require('./export.service')
};

