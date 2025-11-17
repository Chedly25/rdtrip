# 🚀 Quick Reference Guide

## Running the Application

### Old Server (Legacy)
```bash
npm start
# or
npm run dev
```
Runs on port 5000 with all original endpoints

### New Server (Clean Architecture)
```bash
npm run start:new
# or
npm run dev:new
```
Runs on port 5000 with new `/api/v1` endpoints

## New API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Health Check
```bash
GET /health
GET /api/v1/health
```

### Places API

#### Search Places
```bash
POST /api/v1/places/search
Content-Type: application/json

{
  "query": "restaurants in Paris",
  "location": {
    "lat": 48.8566,
    "lng": 2.3522
  }
}
```

#### Find Nearby
```bash
POST /api/v1/places/nearby
Content-Type: application/json

{
  "location": {
    "lat": 48.8566,
    "lng": 2.3522
  },
  "radius": 1000,
  "type": "restaurant"
}
```

#### Get Place Details
```bash
GET /api/v1/places/:placeId
```

## Using Services in Code

### Import from Container
```javascript
const { container } = require('./src/config/services');

// Get a service
const placesService = container.get('googlePlacesService');
const geocodingService = container.get('geocodingService');
```

### Available Services
- `googlePlacesService`
- `perplexityAIService`
- `wikipediaImageService`
- `geocodingService`
- `currencyService`
- `receiptScannerService`
- `budgetCalculatorService`
- `exportService`

## Creating a New Service

### 1. Create Service File
```javascript
// src/domain/services/myNew.service.js
const BaseService = require('./BaseService');

class MyNewService extends BaseService {
  constructor(myClient, database) {
    super('MyNew');
    this.client = myClient;
    this.db = database;
  }

  async myMethod(params) {
    this.logAction('My action', { params });
    
    try {
      const result = await this.client.doSomething(params);
      return result;
    } catch (error) {
      this.handleError(error, 'myMethod');
    }
  }
}

module.exports = MyNewService;
```

### 2. Register in Container
```javascript
// src/config/services.js
container.register('myNewService', (c) => {
  return new MyNewService(
    c.get('myClient'),
    c.get('database')
  );
});
```

### 3. Create Controller
```javascript
// src/api/controllers/myNew.controller.js
const BaseController = require('./BaseController');

class MyNewController extends BaseController {
  constructor(myNewService) {
    super('MyNew');
    this.myNewService = myNewService;
  }

  doSomething = this.asyncHandler(async (req, res) => {
    const { param } = req.body;
    const result = await this.myNewService.myMethod(param);
    return this.success(res, result);
  });
}

module.exports = MyNewController;
```

### 4. Create Routes
```javascript
// src/api/routes/v1/myNew.routes.js
const express = require('express');
const router = express.Router();
const MyNewController = require('../../controllers/myNew.controller');
const { container } = require('../../../config/services');

const controller = new MyNewController(
  container.get('myNewService')
);

router.post('/do-something', controller.doSomething);

module.exports = router;
```

### 5. Mount Routes
```javascript
// src/api/routes/v1/index.js
const myNewRoutes = require('./myNew.routes');
router.use('/mynew', myNewRoutes);
```

## File Structure

```
src/
├── api/
│   ├── controllers/         # HTTP request handlers
│   ├── routes/             # Express routes
│   └── middleware/         # Middleware functions
├── domain/
│   └── services/           # Business logic
├── infrastructure/
│   ├── external/           # External API clients
│   └── database/           # Database access
├── shared/
│   ├── errors/            # Custom error classes
│   ├── helpers/           # Helper utilities
│   └── constants/         # Constants
├── config/                # Configuration
└── core/                  # Core infrastructure
```

## Common Tasks

### Add New API Endpoint
1. Add method to appropriate service
2. Add controller method
3. Add route definition
4. Test!

### Add External API Client
1. Create client in `src/infrastructure/external/`
2. Register in `src/config/services.js`
3. Use in service via constructor injection

### Access Database
```javascript
// In service
const result = await this.db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### Cache Data
```javascript
// In service (GooglePlacesService has example)
async getFromCache(key) {
  // Check memory
  if (this.memoryCache.has(key)) {
    return this.memoryCache.get(key);
  }
  
  // Check database
  const result = await this.db.query(
    'SELECT data FROM cache WHERE key = $1 AND expires_at > NOW()',
    [key]
  );
  
  return result.rows[0]?.data;
}
```

### Log Actions
```javascript
// In service
this.logAction('My action', { userId, action: 'delete' });
this.logger.info('Something happened', { data });
this.logger.error('Error occurred', { error: error.message });
```

### Handle Errors
```javascript
// In service
try {
  // ... do something
} catch (error) {
  this.handleError(error, 'methodName');
}

// Or throw custom errors
throw new ValidationError('Invalid input');
throw new NotFoundError('User', userId);
```

## Testing

### Unit Test Example
```javascript
const MyService = require('../src/domain/services/my.service');

describe('MyService', () => {
  let service;
  let mockClient;

  beforeEach(() => {
    mockClient = {
      doSomething: jest.fn()
    };
    service = new MyService(mockClient);
  });

  it('should do something', async () => {
    mockClient.doSomething.mockResolvedValue({ data: 'test' });
    
    const result = await service.myMethod({ param: 'value' });
    
    expect(result.data).toBe('test');
    expect(mockClient.doSomething).toHaveBeenCalledWith({ param: 'value' });
  });
});
```

### Integration Test Example
```javascript
const request = require('supertest');
const app = require('../src/app')();

describe('MyNew API', () => {
  it('should handle request', async () => {
    const response = await request(app)
      .post('/api/v1/mynew/do-something')
      .send({ param: 'value' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Environment Variables

Required:
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

Optional (for specific features):
```env
# API Keys
GOOGLE_PLACES_API_KEY=your_key
PERPLEXITY_API_KEY=your_key
MAPBOX_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
EXCHANGERATE_API_KEY=your_key

# JWT
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d

# App
PORT=5000
NODE_ENV=development
```

## Debugging

### Check Service Registration
```javascript
const { container } = require('./src/config/services');
console.log(container.dependencies); // See registered services
```

### Enable Debug Logging
```javascript
// In service
this.logger.level = 'debug';
this.logger.debug('Debug message', { data });
```

### Check Database Connection
```javascript
const { pool } = require('./src/config/database');
pool.query('SELECT NOW()').then(result => {
  console.log('Database connected:', result.rows[0]);
});
```

## Useful Commands

```bash
# Count files
find src -type f | wc -l

# Count lines
find src -name "*.js" -exec wc -l {} + | tail -1

# Find a service
find src -name "*service.js"

# Find a controller
find src -name "*controller.js"

# View directory structure
tree src/ -L 3
```

## Documentation Files

- `ARCHITECTURE.md` - High-level architecture overview
- `src/README.md` - Detailed architecture guide
- `src/EXAMPLES.md` - Code examples
- `src/MIGRATION_GUIDE.md` - Migration strategy
- `PHASE1_COMPLETE_SUMMARY.md` - Phase 1 summary
- `PHASE2_COMPLETE.md` - Phase 2 summary
- `PHASE2_STATUS.md` - Phase 2 checklist
- `QUICK_START.md` - Getting started guide

## Getting Help

### Check Examples
Look at existing services for patterns:
- `src/domain/services/googlePlaces.service.js` - Complete service example
- `src/api/controllers/places.controller.js` - Complete controller example
- `src/api/routes/v1/places.routes.js` - Complete routes example

### Read Base Classes
Understand available methods:
- `src/domain/services/BaseService.js`
- `src/api/controllers/BaseController.js`
- `src/infrastructure/database/repositories/BaseRepository.js`

### Check Tests (When Available)
Tests show how to use services in isolation.

---

**Last Updated:** November 2025  
**Version:** 2.0 (Clean Architecture)

