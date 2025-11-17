# 🔄 Migration Guide

Guide for migrating from the monolithic `server.js` (11,312 lines) to the clean architecture.

## Overview

We're gradually refactoring the codebase without breaking existing functionality. The old and new code will coexist during the transition.

## Migration Strategy

### Phase 1: Infrastructure Setup ✅ COMPLETE

**What we did:**
- Created folder structure
- Setup configuration (database, environment)
- Created base classes (Repository, Service, Controller)
- Setup error handling
- Created logger utility
- Created helper utilities
- Setup dependency injection container
- Created new entry points (app.js, server.js)

**Result:** Foundation is ready for refactoring!

### Phase 2: Extract Services (NEXT)

Extract business logic from `server.js` into services.

**Priority order:**
1. **Google Places Service** - Place search, details, photos
2. **Perplexity AI Service** - AI-powered content generation
3. **Wikipedia Image Service** - Fetch images from Wikipedia
4. **Geocoding Service** - Mapbox geocoding and autocomplete
5. **Budget Calculator Service** - Budget calculations and estimations
6. **Export Services** - GPX, ICS, KML, PDF generation
7. **ZTL Service** - Zone management and route checking
8. **Currency Service** - Currency conversion
9. **Receipt Scanner Service** - Receipt processing

**Example: Extract Google Places Service**

```javascript
// Before (scattered in server.js)
app.post('/api/places/search', async (req, res) => {
  const googlePlaces = new GooglePlacesService();
  const results = await googlePlaces.searchPlaces(query);
  // ...
});

// After (in domain/services/googlePlaces.service.js)
class GooglePlacesService extends BaseService {
  constructor(googlePlacesClient) {
    super('GooglePlaces');
    this.client = googlePlacesClient;
  }

  async searchPlaces(query, location) {
    // Moved from server.js
    // All Google Places API logic here
  }

  async getPlaceDetails(placeId) {
    // Centralized place details fetching
  }

  async getPlacePhotos(photoReference) {
    // Photo fetching logic
  }
}
```

**Steps:**
1. Create service file
2. Move functions to service class
3. Update server.js to use service:
   ```javascript
   const scrapingService = container.get('scrapingService');
   const image = await scrapingService.scrapeOpenGraphImage(url);
   ```
4. Test thoroughly
5. Remove old functions from server.js

### Phase 3: Create Repositories

Create repository classes for database operations.

**Priority order:**
1. User repository
2. Route repository
3. Itinerary repository
4. Collaboration repository
5. Marketplace repository
6. Expense repository
7. Notification repository

**Example: Route Repository**

```javascript
// Before (in server.js)
app.get('/api/routes', authenticate, async (req, res) => {
  const result = await pool.query(`
    SELECT * FROM routes 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `, [req.user.id]);
  
  res.json(result.rows);
});

// After
// 1. Create repository
class RouteRepository extends BaseRepository {
  constructor() {
    super('routes');
  }

  async findByUserId(userId, options) {
    return this.findAll({ user_id: userId }, options);
  }
}

// 2. Create service
class RouteService extends BaseService {
  constructor(routeRepository) {
    super('Route');
    this.routeRepository = routeRepository;
  }

  async getUserRoutes(userId, pagination) {
    return this.routeRepository.findByUserId(userId, pagination);
  }
}

// 3. Use in server.js (temporary during migration)
const routeService = container.get('routeService');
app.get('/api/routes', authenticate, async (req, res) => {
  const routes = await routeService.getUserRoutes(req.user.id, pagination);
  res.json(routes);
});
```

### Phase 4: Refactor Routes & Controllers

Move route handlers to controllers and organize routes.

**Priority order:**
1. Auth routes (/api/auth/*)
2. Route CRUD (/api/routes/*)
3. Itinerary routes (/api/itinerary/*)
4. Collaboration routes (/api/routes/:id/collaborators/*)
5. Marketplace routes (/api/marketplace/*)
6. Budget routes (/api/calculate-budget)
7. Export routes (/api/export/*)
8. Image routes (/api/images/*, /api/places/city-image)
9. Landmark routes (/api/landmarks/*)
10. ZTL routes (/api/ztl/*)
11. City routes (/api/cities/*)
12. Notification routes (/api/notifications/*)
13. Expense routes (/api/routes/:id/expenses/*)
14. Agent routes (/api/agent/*)

**Example: Migrate Auth Routes**

```javascript
// Before (in server.js - lines 601-760)
app.post('/api/auth/register', async (req, res) => {
  // ... 80 lines of code ...
});

app.post('/api/auth/login', async (req, res) => {
  // ... 60 lines of code ...
});

// After
// 1. Create controller (see EXAMPLES.md)
// 2. Create routes file
// 3. Mount in app.js:
const authRoutes = require('./api/routes/v1/auth.routes');
app.use('/api/v1/auth', authRoutes);

// 4. Remove from server.js
```

### Phase 5: Replace Old server.js

Once all routes are migrated:

1. Rename old `server.js` to `server.legacy.js`
2. Update `package.json` to use new entry point
3. Test everything
4. Delete `server.legacy.js`

## Migration Checklist

### Services to Extract

- [ ] Google Places service (already exists in server/services/, needs integration)
- [ ] Perplexity AI service (AI content generation)
- [ ] Wikipedia Image service (already exists in server/services/, needs integration)
- [ ] Geocoding service (Mapbox integration)
- [ ] Budget calculator service
- [ ] Export services (GPX, ICS, KML, PDF)
- [ ] ZTL service (already exists, needs refactoring)
- [ ] Currency service (already exists in server/services/, needs integration)
- [ ] Receipt scanner service (already exists in server/services/, needs integration)
- [ ] City service (city details and activities)
- [ ] Itinerary service (itinerary generation and management)
- [ ] Notification service

### Repositories to Create

- [ ] User repository
- [ ] Route repository
- [ ] Itinerary repository
- [ ] Collaboration repository
- [ ] Marketplace repository
- [ ] Expense repository
- [ ] Notification repository
- [ ] Comment repository
- [ ] Poll repository
- [ ] Task repository

### Routes to Migrate

- [ ] Auth routes (2 endpoints)
- [ ] Route CRUD (6 endpoints)
- [ ] Route sharing (3 endpoints)
- [ ] Itinerary routes (8 endpoints)
- [ ] Collaboration routes (7 endpoints)
- [ ] Collaboration messages (4 endpoints)
- [ ] Comments (4 endpoints)
- [ ] Polls (3 endpoints)
- [ ] Tasks (5 endpoints)
- [ ] Marketplace (6 endpoints)
- [ ] Expenses (10 endpoints)
- [ ] Budget (1 endpoint)
- [ ] Export (3 endpoints)
- [ ] Images (4 endpoints)
- [ ] Landmarks (3 endpoints)
- [ ] ZTL (3 endpoints)
- [ ] Cities (5 endpoints)
- [ ] Notifications (3 endpoints)
- [ ] Agent/Chat (3 endpoints)

**Total:** ~101 endpoints

## Testing During Migration

### 1. Unit Tests
Test individual services and repositories:

```javascript
// Test service
const service = new RouteService(mockRepository);
const result = await service.getUserRoutes('user123');
expect(result).toBeDefined();
```

### 2. Integration Tests
Test with real database:

```javascript
// Test repository
const repository = new RouteRepository();
const route = await repository.create({ ... });
expect(route.id).toBeDefined();
```

### 3. API Tests
Test endpoints work the same:

```javascript
// Before and after should return same result
const response = await request(app)
  .get('/api/routes')
  .set('Authorization', `Bearer ${token}`);

expect(response.status).toBe(200);
```

## Backward Compatibility

During migration, ensure:

1. **Same API contracts** - Responses should be identical
2. **Same authentication** - Use existing auth middleware
3. **Same database schema** - No schema changes needed
4. **Same environment variables** - Use existing .env

## Rollback Strategy

If issues arise:

1. Keep old `server.js` as `server.legacy.js`
2. Can quickly revert by updating package.json:
   ```json
   {
     "scripts": {
       "start": "node server.legacy.js"
     }
   }
   ```
3. New code doesn't affect old code - isolated

## Performance Considerations

The new architecture:

- **Slightly slower on first call** (container initialization)
- **Same speed after** (no performance impact)
- **Better for caching** (services can cache internally)
- **Better for testing** (isolated components)

## Timeline Estimate

- **Phase 2** (Services): 1-2 weeks
- **Phase 3** (Repositories): 1-2 weeks
- **Phase 4** (Routes/Controllers): 3-4 weeks
- **Phase 5** (Cleanup): 1 week

**Total:** 6-9 weeks for complete migration

## Tips

1. **Migrate gradually** - One service/route at a time
2. **Test thoroughly** - After each migration
3. **Keep commits small** - Easy to rollback
4. **Update documentation** - As you migrate
5. **Pair program** - For complex migrations
6. **Ask questions** - Use EXAMPLES.md for reference

## Questions?

See:
- `src/README.md` - Architecture overview
- `src/EXAMPLES.md` - Code examples
- Base classes - Common functionality

