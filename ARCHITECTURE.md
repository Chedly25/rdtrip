# 🏗️ RdTrip Architecture Documentation

## Current Status: Phase 1 Complete ✅

The foundation for clean architecture has been implemented. The old `server.js` (11,312 lines) is still in use while we gradually migrate to the new structure.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Routes    │→ │ Controllers │→ │ Middleware  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Services   │→ │   Models    │→ │  Entities   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Repositories │→ │   Cache     │→ │  External   │         │
│  └─────────────┘  └─────────────┘  └───APIs──────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

### New Architecture (`src/`)

```
src/
├── api/                    # API Layer (HTTP Interface)
│   ├── routes/            # Route definitions
│   │   ├── index.js       # Route aggregator
│   │   └── v1/           # API v1 routes
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   └── validators/        # Request validation
│
├── domain/                # Business Logic Layer
│   ├── services/         # Business logic
│   │   └── BaseService.js # Base service class
│   ├── models/           # Domain models
│   └── entities/         # Value objects
│
├── infrastructure/        # Infrastructure Layer
│   ├── database/
│   │   └── repositories/ # Data access
│   │       └── BaseRepository.js
│   ├── cache/           # Caching layer
│   ├── external/        # External API clients
│   └── jobs/            # Background jobs
│
├── shared/               # Shared Utilities
│   ├── utils/           # Utility functions
│   ├── constants/       # Constants
│   │   ├── httpStatus.js
│   │   └── index.js
│   ├── errors/          # Custom errors
│   │   ├── AppError.js
│   │   ├── ValidationError.js
│   │   ├── AuthenticationError.js
│   │   ├── AuthorizationError.js
│   │   ├── NotFoundError.js
│   │   ├── ConflictError.js
│   │   └── index.js
│   └── helpers/         # Helper classes
│       ├── ResponseBuilder.js
│       ├── Paginator.js
│       └── index.js
│
├── config/              # Configuration
│   ├── environment.js   # Environment variables
│   ├── database.js      # Database connection
│   └── index.js        # Config aggregator
│
├── core/                # Core Infrastructure
│   ├── logger.js        # Centralized logging
│   └── container.js     # Dependency injection
│
├── app.js              # Express app setup
├── server.js           # Server entry point
├── README.md           # Architecture documentation
├── EXAMPLES.md         # Code examples
└── MIGRATION_GUIDE.md  # Migration strategy
```

### Legacy Code

```
server.js              # Old monolithic server (11,312 lines)
server/               # Existing agents and services
├── agents/          # AI agents (keep)
├── services/        # Services (will migrate)
├── tools/          # AI tools (keep)
└── utils/          # Utilities (will migrate)
```

## Key Components

### 1. Error Handling

Custom error classes for consistent error handling:

```javascript
const { NotFoundError, ValidationError } = require('./src/shared/errors');

throw new NotFoundError('User', userId);
throw new ValidationError('Invalid input', errors);
```

### 2. Logging

Centralized logger with context:

```javascript
const logger = require('./src/core/logger');

logger.info('User created', { userId: user.id });
logger.error('Failed to create user', error);
```

### 3. Database Access

Repository pattern with base class:

```javascript
class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }
}
```

### 4. Business Logic

Services with base class:

```javascript
class UserService extends BaseService {
  constructor(userRepository) {
    super('User');
    this.userRepository = userRepository;
  }

  async createUser(userData) {
    // Business logic here
  }
}
```

### 5. Request Handling

Controllers with base class:

```javascript
class UserController extends BaseController {
  constructor(userService) {
    super('User');
    this.userService = userService;
  }

  create = this.asyncHandler(async (req, res) => {
    const user = await this.userService.createUser(req.body);
    return this.created(res, user);
  });
}
```

### 6. Dependency Injection

Container for managing dependencies:

```javascript
const container = require('./src/core/container');

// Register
container.register('userRepository', () => new UserRepository());
container.register('userService', (c) => 
  new UserService(c.get('userRepository'))
);

// Use
const userService = container.get('userService');
```

## Running the Application

### Current (Old Architecture)
```bash
npm start          # Uses server.js (11,312 lines)
```

### New Architecture (Testing)
```bash
npm run start:new  # Uses src/server.js (new clean architecture)
```

During migration, both can run simultaneously on different ports for comparison.

## Migration Progress

### ✅ Phase 1: Infrastructure Setup (COMPLETE)
- [x] Folder structure created
- [x] Configuration module (database, environment)
- [x] Base classes (Repository, Service, Controller)
- [x] Error handling (custom errors, middleware)
- [x] Logger utility
- [x] Helper utilities (ResponseBuilder, Paginator)
- [x] Dependency injection container
- [x] New entry points (app.js, server.js)

### 🔄 Phase 2: Extract Services (NEXT)
- [ ] Google Places service (integrate existing server/services/googlePlacesService.js)
- [ ] Perplexity AI service (AI-powered route discovery)
- [ ] Wikipedia Image service (integrate existing server/services/wikipediaImageService.js)
- [ ] Geocoding service (Mapbox integration)
- [ ] Budget calculator service
- [ ] Export services (GPX, ICS, KML, PDF)
- [ ] ZTL service (refactor existing services/ztl-service.js)
- [ ] Currency service (integrate existing server/services/CurrencyService.js)
- [ ] Receipt scanner service (integrate existing server/services/ReceiptScannerService.js)
- [ ] City service (city details and activities)
- [ ] Itinerary service (orchestration)
- [ ] Notification service

### ⏳ Phase 3: Create Repositories
- [ ] User repository
- [ ] Route repository
- [ ] Itinerary repository
- [ ] Collaboration repository
- [ ] Marketplace repository
- [ ] Expense repository
- [ ] Notification repository

### ⏳ Phase 4: Refactor Routes & Controllers
- [ ] Auth routes (2 endpoints)
- [ ] Route CRUD (6 endpoints)
- [ ] Itinerary routes (8 endpoints)
- [ ] Collaboration routes (11 endpoints)
- [ ] Marketplace routes (6 endpoints)
- [ ] And 70+ more endpoints...

### ⏳ Phase 5: Replace Old server.js
- [ ] Verify all functionality migrated
- [ ] Performance testing
- [ ] Delete old server.js

## Benefits of New Architecture

### 1. **Maintainability**
- **Before:** 11,312 lines in one file
- **After:** ~100-200 lines per file, organized by feature

### 2. **Testability**
- **Before:** Hard to test, everything coupled
- **After:** Each layer tested independently with mocks

### 3. **Scalability**
- **Before:** Adding features = more chaos
- **After:** Clear structure, know exactly where code goes

### 4. **Team Collaboration**
- **Before:** Merge conflicts nightmare
- **After:** Work on different features in different files

### 5. **Code Reusability**
- **Before:** Copy-paste similar code
- **After:** Base classes provide common functionality

### 6. **Error Handling**
- **Before:** Inconsistent error responses
- **After:** Standardized error handling with custom classes

### 7. **Debugging**
- **Before:** Difficult to trace issues
- **After:** Structured logging, clear flow

## Design Patterns Used

1. **Repository Pattern** - Data access abstraction
2. **Service Layer Pattern** - Business logic separation
3. **Dependency Injection** - Loose coupling
4. **Factory Pattern** - Object creation (container)
5. **Template Method** - Base classes define structure
6. **Strategy Pattern** - Different error handling strategies
7. **Singleton Pattern** - Logger, container

## Best Practices

1. ✅ **Single Responsibility** - Each class has one job
2. ✅ **DRY** - Base classes eliminate duplication
3. ✅ **Separation of Concerns** - Layers are isolated
4. ✅ **Dependency Inversion** - Depend on abstractions
5. ✅ **Open/Closed** - Open for extension, closed for modification
6. ✅ **Error Handling** - Consistent, structured errors
7. ✅ **Logging** - Centralized, contextual logging

## Documentation

- **`src/README.md`** - Architecture overview
- **`src/EXAMPLES.md`** - Complete code examples
- **`src/MIGRATION_GUIDE.md`** - Migration strategy
- **`ARCHITECTURE.md`** (this file) - High-level documentation

## Testing Strategy

### Unit Tests
```javascript
// Test individual services
const service = new UserService(mockRepository);
const result = await service.createUser(userData);
```

### Integration Tests
```javascript
// Test with real database
const repository = new UserRepository();
const user = await repository.create(userData);
```

### API Tests
```javascript
// Test endpoints
const response = await request(app)
  .post('/api/users')
  .send(userData);
```

## Performance

The new architecture has:
- ✅ **Same runtime performance** as old code
- ✅ **Better caching** capabilities
- ✅ **Faster development** time
- ✅ **Easier optimization** (identify bottlenecks)

## Security

Enhanced security through:
- ✅ **Input validation** at API layer
- ✅ **Authorization checks** in services
- ✅ **SQL injection prevention** in repositories
- ✅ **Error message sanitization** in production

## Next Steps

1. **Review Phase 1** - Verify infrastructure is solid
2. **Start Phase 2** - Extract first service (scraping)
3. **Test thoroughly** - Ensure no regressions
4. **Continue migration** - One feature at a time
5. **Update documentation** - As we progress

## Questions?

Refer to:
- `src/README.md` - Detailed architecture guide
- `src/EXAMPLES.md` - Working code examples
- `src/MIGRATION_GUIDE.md` - Step-by-step migration
- Base class files - Implementation details

---

**Last Updated:** November 2025  
**Status:** Phase 1 Complete, Ready for Phase 2  
**Contributors:** Development Team

