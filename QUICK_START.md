# 🚀 Quick Start Guide - New Architecture

## Overview

The RdTrip application is being refactored from a monolithic `server.js` (11,312 lines) to a clean, modular architecture.

## Current State

✅ **Phase 1 Complete** - Infrastructure is ready
⏳ **Phase 2-5** - Gradual migration in progress

Both old and new servers can run simultaneously during migration.

## Running the Application

### Production (Old Server)
```bash
npm start
# Uses: server.js (current production code)
# Port: 5000
```

### Testing (New Server)
```bash
npm run start:new
# Uses: src/server.js (new clean architecture)
# Port: 5000
# Note: Limited functionality during migration
```

## Architecture at a Glance

```
┌─────────────────────────────────────────┐
│  Client Request                          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  API Layer (src/api/)                   │
│  • Routes: Define endpoints             │
│  • Controllers: Handle requests         │
│  • Middleware: Auth, logging, errors    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Domain Layer (src/domain/)             │
│  • Services: Business logic             │
│  • Models: Domain entities              │
│  • Validation: Business rules           │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Infrastructure (src/infrastructure/)   │
│  • Repositories: Database access        │
│  • Cache: Redis/Memory cache            │
│  • External: API clients                │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Database / External APIs               │
└─────────────────────────────────────────┘
```

## Key Files

### Core Infrastructure
- `src/core/logger.js` - Logging
- `src/core/container.js` - Dependency injection
- `src/config/database.js` - Database connection
- `src/config/environment.js` - Environment variables

### Base Classes (Extend these!)
- `src/infrastructure/database/repositories/BaseRepository.js`
- `src/domain/services/BaseService.js`
- `src/api/controllers/BaseController.js`

### Utilities
- `src/shared/errors/` - Custom error classes
- `src/shared/helpers/ResponseBuilder.js` - API responses
- `src/shared/helpers/Paginator.js` - Pagination
- `src/api/middleware/errorHandler.js` - Error handling

## Creating a New Feature

### Example: Add a Blog Feature

#### 1. Create Repository
```javascript
// src/infrastructure/database/repositories/blog.repository.js
const BaseRepository = require('./BaseRepository');

class BlogRepository extends BaseRepository {
  constructor() {
    super('blog_posts');
  }

  async findPublished() {
    return this.findAll({ published: true });
  }
}

module.exports = BlogRepository;
```

#### 2. Create Service
```javascript
// src/domain/services/blog.service.js
const BaseService = require('./BaseService');

class BlogService extends BaseService {
  constructor(blogRepository) {
    super('Blog');
    this.blogRepository = blogRepository;
  }

  async getPublishedPosts() {
    return this.blogRepository.findPublished();
  }
}

module.exports = BlogService;
```

#### 3. Create Controller
```javascript
// src/api/controllers/blog.controller.js
const BaseController = require('./BaseController');

class BlogController extends BaseController {
  constructor(blogService) {
    super('Blog');
    this.blogService = blogService;
  }

  list = this.asyncHandler(async (req, res) => {
    const posts = await this.blogService.getPublishedPosts();
    return this.success(res, posts);
  });
}

module.exports = BlogController;
```

#### 4. Create Routes
```javascript
// src/api/routes/v1/blog.routes.js
const express = require('express');
const container = require('../../../core/container');

const router = express.Router();
const blogController = container.get('blogController');

router.get('/', blogController.list);

module.exports = router;
```

#### 5. Register in Container
```javascript
// In initialization
container.register('blogRepository', () => new BlogRepository());
container.register('blogService', (c) => 
  new BlogService(c.get('blogRepository'))
);
container.register('blogController', (c) => 
  new BlogController(c.get('blogService'))
);
```

#### 6. Mount Routes
```javascript
// In src/app.js
const blogRoutes = require('./api/routes/v1/blog.routes');
app.use('/api/v1/blog', blogRoutes);
```

## Common Tasks

### Add Error Handling
```javascript
const { NotFoundError } = require('../../shared/errors');

if (!user) {
  throw new NotFoundError('User', userId);
}
```

### Add Logging
```javascript
const logger = require('../../core/logger');

logger.info('User created', { userId: user.id });
logger.error('Failed to create user', error);
```

### Return Response
```javascript
// Success
return this.success(res, data, 'Operation successful');

// Created
return this.created(res, data, 'Resource created');

// Paginated
return this.paginated(res, data, pagination);
```

### Database Queries
```javascript
// Find by ID
const user = await this.userRepository.findById(id);

// Find by criteria
const user = await this.userRepository.findOne({ email });

// Find all with pagination
const users = await this.userRepository.findAll(
  { status: 'active' },
  { limit: 10, offset: 0 }
);

// Create
const user = await this.userRepository.create(userData);

// Update
const user = await this.userRepository.update(id, updates);

// Delete
await this.userRepository.delete(id);
```

## Testing

### Test Repository
```javascript
const repository = new UserRepository();
const user = await repository.create({ email: 'test@example.com' });
```

### Test Service (with mock)
```javascript
const mockRepo = { findById: jest.fn() };
const service = new UserService(mockRepo);
```

### Test API
```bash
curl http://localhost:5000/api/v1/users
```

## Useful Commands

```bash
# Start servers
npm start              # Old server (production)
npm run start:new      # New server (testing)

# Database
npm run db:migrate     # Run migrations

# Logs
# Development: Colored console logs
# Production: JSON format for log aggregation
```

## Documentation

📖 **Read These:**
- `ARCHITECTURE.md` - Overview
- `src/README.md` - Detailed guide
- `src/EXAMPLES.md` - Code examples
- `src/MIGRATION_GUIDE.md` - Migration strategy
- `PHASE1_COMPLETE_SUMMARY.md` - What's done

## Need Help?

1. Check `src/EXAMPLES.md` for working code
2. Look at base classes for available methods
3. Review existing implementations
4. Check error classes for proper error handling

## Best Practices

✅ Always extend base classes
✅ Use dependency injection
✅ Throw custom errors (not generic Error)
✅ Use structured logging
✅ Validate at API layer
✅ Keep controllers thin
✅ Keep services focused
✅ Write tests

## Migration Status

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Complete | Infrastructure setup |
| 2 | ⏳ Next | Extract services |
| 3 | 📋 Planned | Create repositories |
| 4 | 📋 Planned | Refactor routes |
| 5 | 📋 Planned | Replace old server.js |

---

**Last Updated:** November 2025  
**Current Phase:** 1 Complete, Phase 2 Ready  
**Old Server:** Still running (production)  
**New Server:** Infrastructure ready
