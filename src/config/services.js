/**
 * Service Registration
 * Configure and register all services in the DI container
 */
const container = require('../core/container');
const config = require('./index');
const { pool } = require('./database');

// External API Clients
const {
  GooglePlacesClient,
  PerplexityClient,
  WikipediaClient,
  MapboxClient,
  ExchangeRateClient
} = require('../infrastructure/external');

// Domain Services
const {
  GooglePlacesService,
  PerplexityAIService,
  WikipediaImageService,
  GeocodingService,
  CurrencyService,
  ReceiptScannerService,
  BudgetCalculatorService,
  ExportService
} = require('../domain/services');

/**
 * Register all external API clients
 */
function registerClients() {
  // Google Places Client
  container.register('googlePlacesClient', () => {
    if (!config.environment.GOOGLE_PLACES_API_KEY) {
      throw new Error('GOOGLE_PLACES_API_KEY is required');
    }
    return new GooglePlacesClient(config.environment.GOOGLE_PLACES_API_KEY);
  });

  // Perplexity Client
  container.register('perplexityClient', () => {
    if (!config.environment.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is required');
    }
    return new PerplexityClient(config.environment.PERPLEXITY_API_KEY);
  });

  // Wikipedia Client (no API key needed)
  container.register('wikipediaClient', () => {
    return new WikipediaClient();
  });

  // Mapbox Client
  container.register('mapboxClient', () => {
    const mapboxKey = config.environment.MAPBOX_API_KEY || config.environment.VITE_MAPBOX_TOKEN;
    if (!mapboxKey) {
      throw new Error('MAPBOX_API_KEY or VITE_MAPBOX_TOKEN is required');
    }
    return new MapboxClient(mapboxKey);
  });

  // Exchange Rate Client
  container.register('exchangeRateClient', () => {
    // Optional API key for paid tier
    return new ExchangeRateClient(config.environment.EXCHANGERATE_API_KEY);
  });

  // Database Pool
  container.register('database', () => pool);
}

/**
 * Register all domain services
 */
function registerServices() {
  // Google Places Service
  container.register('googlePlacesService', (c) => {
    return new GooglePlacesService(
      c.get('googlePlacesClient'),
      c.get('database')
    );
  });

  // Perplexity AI Service
  container.register('perplexityAIService', (c) => {
    return new PerplexityAIService(
      c.get('perplexityClient')
    );
  });

  // Wikipedia Image Service
  container.register('wikipediaImageService', (c) => {
    return new WikipediaImageService(
      c.get('wikipediaClient'),
      c.get('database')
    );
  });

  // Geocoding Service
  container.register('geocodingService', (c) => {
    return new GeocodingService(
      c.get('mapboxClient'),
      c.get('database')
    );
  });

  // Currency Service
  container.register('currencyService', (c) => {
    return new CurrencyService(
      c.get('exchangeRateClient')
    );
  });

  // Receipt Scanner Service
  container.register('receiptScannerService', () => {
    return new ReceiptScannerService(
      config.environment.DEEPSEEK_API_KEY
    );
  });

  // Budget Calculator Service
  container.register('budgetCalculatorService', () => {
    return new BudgetCalculatorService();
  });

  // Export Service
  container.register('exportService', () => {
    return new ExportService();
  });
}

/**
 * Initialize all services
 */
function initializeServices() {
  registerClients();
  registerServices();
}

module.exports = {
  initializeServices,
  container
};

