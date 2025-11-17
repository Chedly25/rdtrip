# 🏗️ RdTrip Clean Architecture

This directory contains the refactored, clean architecture implementation of the RdTrip application.

## 📁 Structure

```
src/
├── api/                    # API Layer (Presentation)
│   ├── routes/            # Route definitions
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   └── validators/        # Request validation
│
├── domain/                # Domain Layer (Business Logic)
│   ├── services/         # Business logic services
│   ├── models/           # Domain models
│   └── entities/         # Value objects
│
├── infrastructure/        # Infrastructure Layer
│   ├── database/         # Data access
│   │   └── repositories/ # Repository pattern
│   ├── cache/           # Caching layer
│   ├── external/        # External API clients
│   └── jobs/            # Background jobs
│
├── shared/               # Shared utilities
│   ├── utils/           # Utility functions
│   ├── constants/       # Constants
│   ├── errors/          # Custom error classes
│   └── helpers/         # Helper classes
│
├── config/              # Configuration
│   ├── environment.js   # Environment variables
│   ├── database.js      # Database connection
│   └── index.js        # Config aggregator
│
└── core/                # Core infrastructure
    ├── logger.js        # Logging
    └── container.js     # Dependency injection
```

## 🎯 Architecture Principles

### 1. **Separation of Concerns**
Each layer has a specific responsibility:
- **API Layer**: HTTP interface, validation, response formatting
- **Domain Layer**: Business logic, domain rules
- **Infrastructure Layer**: Data access, external services

### 2. **Dependency Injection**
Use the container to manage dependencies:

```javascript
const container = require('./core/container');

// Register services
container.register('userRepository', () => new UserRepository());
container.register('userService', (c) => new UserService(c.get('userRepository')));

// Use in controllers
const userService = container.get('userService');
```

### 3. **Error Handling**
Use custom error classes for consistent error handling:

```javascript
const { NotFoundError, ValidationError } = require('./shared/errors');

throw new NotFoundError('User', userId);
throw new ValidationError('Invalid input', errors);
```

### 4. **Logging**
Use the centralized logger:

```javascript
const logger = require('./core/logger');

logger.info('User created', { userId: user.id });
logger.error('Failed to create user', error);
```

## 📝 How to Create New Features

### Step 1: Create Repository (Data Access)

```javascript
// infrastructure/database/repositories/user.repository.js
const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }
}

module.exports = UserRepository;
```

### Step 2: Create Service (Business Logic)

```javascript
// domain/services/user.service.js
const BaseService = require('./BaseService');
const { ConflictError } = require('../../shared/errors');

class UserService extends BaseService {
  constructor(userRepository) {
    super('User');
    this.userRepository = userRepository;
  }

  async createUser(userData) {
    // Check if email exists
    const existing = await this.userRepository.findByEmail(userData.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Create user
    return this.userRepository.create(userData);
  }
}

module.exports = UserService;
```

### Step 3: Create Controller (Request Handler)

```javascript
// api/controllers/user.controller.js
const BaseController = require('./BaseController');

class UserController extends BaseController {
  constructor(userService) {
    super('User');
    this.userService = userService;
  }

  createUser = this.asyncHandler(async (req, res) => {
    const user = await this.userService.createUser(req.body);
    return this.created(res, user, 'User created successfully');
  });
}

module.exports = UserController;
```

### Step 4: Create Routes

```javascript
// api/routes/v1/user.routes.js
const express = require('express');
const container = require('../../../core/container');

const router = express.Router();
const userController = container.get('userController');

router.post('/', userController.createUser);

module.exports = router;
```

### Step 5: Register in Container

```javascript
// config/container.js
const container = require('../core/container');

// Repositories
container.register('userRepository', () => new UserRepository());

// Services
container.register('userService', (c) => 
  new UserService(c.get('userRepository'))
);

// Controllers
container.register('userController', (c) => 
  new UserController(c.get('userService'))
);
```

## 🧪 Testing

Each layer can be tested independently:

```javascript
// Test repository
const repository = new UserRepository();
const user = await repository.create({ email: 'test@example.com' });

// Test service (with mock repository)
const mockRepo = { findByEmail: jest.fn(), create: jest.fn() };
const service = new UserService(mockRepo);

// Test controller (with mock service)
const mockService = { createUser: jest.fn() };
const controller = new UserController(mockService);
```

## 🚀 Migration Strategy

The old `server.js` (11,312 lines) will be gradually refactored:

1. ✅ Phase 1: Infrastructure setup (DONE)
2. Phase 2: Extract services from server.js
3. Phase 3: Create repositories
4. Phase 4: Create controllers and routes
5. Phase 5: Replace old server.js

During migration, both old and new code coexist.

## 📚 Best Practices

1. **Keep controllers thin** - Business logic goes in services
2. **Use async/await** - Wrap handlers with `asyncHandler`
3. **Validate early** - Use validators before calling services
4. **Log important actions** - Use structured logging
5. **Handle errors properly** - Use custom error classes
6. **Write tests** - Test each layer independently
7. **Use dependency injection** - Makes testing easier

## 🔄 Request Flow

```
Client Request
    ↓
Middleware (logging, auth, etc.)
    ↓
Route → Controller
    ↓
Service (business logic)
    ↓
Repository (data access)
    ↓
Database
    ↓
Response ← Controller
    ↓
Client Response
```

## 📖 Additional Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

