# 📋 Phase 2: Extract & Integrate Services

## Overview

Phase 2 focuses on extracting business logic from the monolithic `server.js` and integrating existing services into the new clean architecture.

## Key Insight

Several services **already exist** in `server/services/`:
- ✅ `googlePlacesService.js` - Google Places API integration
- ✅ `wikipediaImageService.js` - Wikipedia image fetching
- ✅ `CurrencyService.js` - Currency conversion
- ✅ `ReceiptScannerService.js` - Receipt processing
- ✅ `CollaborationService.js` - Collaboration features
- ✅ `NotificationService.js` - Notifications

**Goal:** Refactor these to use base classes and dependency injection, then integrate into the new architecture.

## Services to Extract/Integrate

### Priority 1: Core API Services

#### 1. Google Places Service ⭐
**Status:** Exists in `server/services/googlePlacesService.js`  
**Action:** Refactor to extend `BaseService` and integrate

**Current Usage:**
```javascript
// In server.js
const GooglePlacesService = require('./server/services/googlePlacesService');
const googlePlaces = new GooglePlacesService();
```

**Target Architecture:**
```javascript
// domain/services/googlePlaces.service.js
const BaseService = require('./BaseService');
const { env } = require('../../config');

class GooglePlacesService extends BaseService {
  constructor(googlePlacesClient) {
    super('GooglePlaces');
    this.client = googlePlacesClient;
    this.apiKey = env.GOOGLE_PLACES_API_KEY;
  }

  async searchPlaces(query, location, radius = 50000) {
    this.logAction('Search places', { query, location });
    
    try {
      // Implementation from existing service
      return await this.client.searchPlaces(query, location, radius);
    } catch (error) {
      this.handleError(error, 'searchPlaces');
    }
  }

  async getPlaceDetails(placeId) {
    // Get detailed information about a place
  }

  async getPlacePhotos(photoReference, maxWidth = 400) {
    // Fetch photos for a place
  }

  async getNearbyPlaces(location, type, radius = 5000) {
    // Find nearby places of a specific type
  }
}

module.exports = GooglePlacesService;
```

**Benefits:**
- ✅ Structured logging
- ✅ Consistent error handling
- ✅ Testable with mocks
- ✅ Centralized Google Places logic

#### 2. Perplexity AI Service ⭐⭐
**Status:** Logic scattered in `server.js`  
**Action:** Extract and centralize

**Current Usage:**
```javascript
// In server.js (line 27)
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// Throughout server.js
const response = await axios.post('https://api.perplexity.ai/...', {
  // Perplexity API calls
});
```

**Target Architecture:**
```javascript
// domain/services/perplexityAI.service.js
const BaseService = require('./BaseService');
const axios = require('axios');
const { env } = require('../../config');

class PerplexityAIService extends BaseService {
  constructor() {
    super('PerplexityAI');
    this.apiKey = env.PERPLEXITY_API_KEY;
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
  }

  async generateRouteRecommendations(origin, destination, preferences) {
    this.logAction('Generate route recommendations', { origin, destination });

    const prompt = this.buildRoutePrompt(origin, destination, preferences);
    
    try {
      const response = await axios.post(this.baseUrl, {
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return this.parseRouteResponse(response.data);
    } catch (error) {
      this.handleError(error, 'generateRouteRecommendations');
    }
  }

  async generateCityContent(city, contentType = 'overview') {
    // Generate AI content for cities
  }

  async generateItinerarySuggestions(cities, days, travelStyle) {
    // Generate itinerary suggestions
  }

  buildRoutePrompt(origin, destination, preferences) {
    // Build optimized prompts for Perplexity
  }

  parseRouteResponse(data) {
    // Parse and validate Perplexity responses
  }
}

module.exports = PerplexityAIService;
```

**Benefits:**
- ✅ Centralized AI logic
- ✅ Reusable prompt building
- ✅ Response parsing in one place
- ✅ Easy to switch AI providers later

#### 3. Wikipedia Image Service ⭐
**Status:** Exists in `server/services/wikipediaImageService.js`  
**Action:** Refactor to extend `BaseService` and integrate

**Target Architecture:**
```javascript
// domain/services/wikipediaImage.service.js
const BaseService = require('./BaseService');
const axios = require('axios');

class WikipediaImageService extends BaseService {
  constructor(cacheService) {
    super('WikipediaImage');
    this.cache = cacheService;
    this.baseUrl = 'https://en.wikipedia.org/api/rest_v1';
  }

  async getCityImage(cityName, country = null) {
    this.logAction('Get city image', { cityName, country });

    // Check cache first
    const cacheKey = `wiki:image:${cityName}:${country}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const searchTerm = country ? `${cityName}, ${country}` : cityName;
      const image = await this.fetchWikipediaImage(searchTerm);
      
      // Cache for 7 days
      await this.cache.set(cacheKey, image, 604800);
      
      return image;
    } catch (error) {
      this.handleError(error, 'getCityImage');
      return this.getPlaceholderImage(cityName);
    }
  }

  async fetchWikipediaImage(searchTerm) {
    // Implementation from existing service
  }

  async getLandmarkImage(landmarkName) {
    // Get images for landmarks
  }

  getPlaceholderImage(name) {
    // Return placeholder when no image found
    return {
      url: `https://via.placeholder.com/800x600?text=${encodeURIComponent(name)}`,
      source: 'placeholder'
    };
  }
}

module.exports = WikipediaImageService;
```

### Priority 2: Business Logic Services

#### 4. Geocoding Service
**Status:** Logic in `server.js`  
**Action:** Extract Mapbox integration

```javascript
// domain/services/geocoding.service.js
class GeocodingService extends BaseService {
  constructor() {
    super('Geocoding');
    this.mapboxToken = env.MAPBOX_API_KEY;
    this.baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  }

  async geocode(address) {
    // Forward geocoding (address → coordinates)
  }

  async reverseGeocode(lat, lng) {
    // Reverse geocoding (coordinates → address)
  }

  async autocomplete(query, proximity = null) {
    // Autocomplete suggestions
  }
}
```

#### 5. Budget Calculator Service
**Status:** Large section in `server.js` (~400 lines)  
**Action:** Extract to service

```javascript
// domain/services/budgetCalculator.service.js
class BudgetCalculatorService extends BaseService {
  constructor(currencyService) {
    super('BudgetCalculator');
    this.currencyService = currencyService;
  }

  async calculateTripBudget(route, tripDetails) {
    // Main budget calculation logic
    const transportation = await this.calculateTransportation(route);
    const accommodation = await this.calculateAccommodation(route, tripDetails);
    const dining = await this.calculateDining(tripDetails);
    const activities = await this.calculateActivities(route, tripDetails);
    
    return {
      total: transportation + accommodation + dining + activities,
      breakdown: { transportation, accommodation, dining, activities },
      perPerson: (transportation + accommodation + dining + activities) / tripDetails.travelers
    };
  }

  async calculateTransportation(route) {
    // Fuel, tolls, parking
  }

  async calculateAccommodation(route, tripDetails) {
    // Hotel costs per city
  }

  async calculateDining(tripDetails) {
    // Meal costs
  }

  async calculateActivities(route, tripDetails) {
    // Activity and attraction costs
  }
}
```

### Priority 3: Existing Services Integration

#### 6. Currency Service (Integrate)
**File:** `server/services/CurrencyService.js`  
**Action:** Refactor to extend `BaseService`

#### 7. Receipt Scanner Service (Integrate)
**File:** `server/services/ReceiptScannerService.js`  
**Action:** Refactor to extend `BaseService`

#### 8. Collaboration Service (Integrate)
**File:** `server/services/CollaborationService.js`  
**Action:** Refactor to extend `BaseService`

#### 9. Notification Service (Integrate)
**File:** `server/services/NotificationService.js`  
**Action:** Refactor to extend `BaseService`

### Priority 4: Utility Services

#### 10. Export Services
**Status:** Exist in `server/export/`  
**Action:** Refactor and integrate

```javascript
// domain/services/export.service.js
class ExportService extends BaseService {
  constructor() {
    super('Export');
  }

  async generateGPX(routeData) {
    // GPX generation
  }

  async generateICS(itinerary) {
    // iCalendar generation
  }

  async generateKML(routeData) {
    // KML for Google Earth
  }

  async generatePDF(itinerary) {
    // PDF generation
  }
}
```

#### 11. ZTL Service (Refactor)
**File:** `services/ztl-service.js`  
**Action:** Move to `domain/services/` and refactor

## Implementation Steps

### Step 1: Create External API Clients

First, create thin client wrappers for external APIs:

```javascript
// infrastructure/external/googlePlaces.client.js
class GooglePlacesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  async searchPlaces(query, location, radius) {
    // Raw API call
  }
}

// infrastructure/external/perplexity.client.js
class PerplexityClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.perplexity.ai';
  }

  async chat(messages, model = 'llama-3.1-sonar-large-128k-online') {
    // Raw API call
  }
}
```

### Step 2: Create Services

Create services that use the clients:

```javascript
// domain/services/googlePlaces.service.js
class GooglePlacesService extends BaseService {
  constructor(googlePlacesClient) {
    super('GooglePlaces');
    this.client = googlePlacesClient;
  }

  // Business logic methods
}
```

### Step 3: Register in Container

```javascript
// config/services.js
const container = require('../core/container');
const GooglePlacesClient = require('../infrastructure/external/googlePlaces.client');
const GooglePlacesService = require('../domain/services/googlePlaces.service');

// Register clients
container.register('googlePlacesClient', () => 
  new GooglePlacesClient(env.GOOGLE_PLACES_API_KEY)
);

// Register services
container.register('googlePlacesService', (c) => 
  new GooglePlacesService(c.get('googlePlacesClient'))
);
```

### Step 4: Use in Controllers

```javascript
// api/controllers/places.controller.js
class PlacesController extends BaseController {
  constructor(googlePlacesService) {
    super('Places');
    this.googlePlacesService = googlePlacesService;
  }

  search = this.asyncHandler(async (req, res) => {
    const { query, location } = req.body;
    const results = await this.googlePlacesService.searchPlaces(query, location);
    return this.success(res, results);
  });
}
```

## Testing Strategy

### Test External Clients (Mocked)
```javascript
const GooglePlacesClient = require('./googlePlaces.client');

jest.mock('axios');

test('should search places', async () => {
  const client = new GooglePlacesClient('test-key');
  const results = await client.searchPlaces('restaurant', { lat: 48, lng: 2 });
  expect(results).toBeDefined();
});
```

### Test Services (With Mock Clients)
```javascript
const GooglePlacesService = require('./googlePlaces.service');

test('should search and cache places', async () => {
  const mockClient = {
    searchPlaces: jest.fn().mockResolvedValue([{ name: 'Test' }])
  };
  
  const service = new GooglePlacesService(mockClient);
  const results = await service.searchPlaces('test', { lat: 48, lng: 2 });
  
  expect(mockClient.searchPlaces).toHaveBeenCalled();
  expect(results).toHaveLength(1);
});
```

## Timeline

| Week | Tasks | Status |
|------|-------|--------|
| 1 | Create external clients (Google Places, Perplexity, Wikipedia) | 📋 |
| 1 | Refactor Google Places Service | 📋 |
| 1-2 | Create Perplexity AI Service | 📋 |
| 2 | Integrate Wikipedia Image Service | 📋 |
| 2 | Create Geocoding Service | 📋 |
| 2 | Extract Budget Calculator Service | 📋 |
| 2 | Refactor existing services (Currency, Receipt, etc.) | 📋 |

**Total:** 2 weeks

## Success Criteria

- [ ] All Google Places API calls go through service
- [ ] All Perplexity API calls go through service
- [ ] Wikipedia images fetched through service
- [ ] Budget calculations in dedicated service
- [ ] All services extend BaseService
- [ ] All services registered in container
- [ ] All services have unit tests
- [ ] No breaking changes to API endpoints
- [ ] Logging added to all service methods
- [ ] Error handling consistent

## Benefits

✅ **Centralized API Logic** - One place for each integration  
✅ **Easy Testing** - Mock clients, test services  
✅ **Better Error Handling** - Consistent across all services  
✅ **Logging** - Know exactly what's happening  
✅ **Reusability** - Services used across controllers  
✅ **Maintainability** - Clear separation of concerns  

## Next: Phase 3

After services are extracted, we'll create repositories for database access.

