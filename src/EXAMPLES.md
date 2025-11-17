# 📘 Code Examples

Complete examples showing how to implement features using the clean architecture.

## Example 1: User Authentication

### 1. Repository
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

  async createUser(userData) {
    return this.create({
      ...userData,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  async updateLastLogin(userId) {
    return this.update(userId, {
      last_login: new Date()
    });
  }
}

module.exports = UserRepository;
```

### 2. Service
```javascript
// domain/services/auth.service.js
const BaseService = require('./BaseService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AuthenticationError, ConflictError } = require('../../shared/errors');
const { env } = require('../../config');

class AuthService extends BaseService {
  constructor(userRepository) {
    super('Auth');
    this.userRepository = userRepository;
  }

  async register(email, password, name) {
    // Validate
    this.validateRequired({ email, password }, ['email', 'password']);

    // Check if user exists
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userRepository.createUser({
      email,
      password_hash,
      name
    });

    this.logAction('User registered', { userId: user.id });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  async login(email, password) {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    this.logAction('User logged in', { userId: user.id });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  sanitizeUser(user) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = AuthService;
```

### 3. Controller
```javascript
// api/controllers/auth.controller.js
const BaseController = require('./BaseController');
const { ValidationError } = require('../../shared/errors');

class AuthController extends BaseController {
  constructor(authService) {
    super('Auth');
    this.authService = authService;
  }

  register = this.asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    // Validate
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Register
    const result = await this.authService.register(email, password, name);

    this.logAction(req, 'User registered', { email });
    
    return this.created(res, result, 'Registration successful');
  });

  login = this.asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Login
    const result = await this.authService.login(email, password);

    this.logAction(req, 'User logged in', { email });
    
    return this.success(res, result, 'Login successful');
  });

  me = this.asyncHandler(async (req, res) => {
    // User is attached by auth middleware
    const user = this.getUser(req);
    
    return this.success(res, user, 'User retrieved');
  });
}

module.exports = AuthController;
```

### 4. Routes
```javascript
// api/routes/v1/auth.routes.js
const express = require('express');
const container = require('../../../core/container');
const { authenticate } = require('../../../middleware/auth');

const router = express.Router();

// Get controller from container
const authController = container.get('authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.me);

module.exports = router;
```

### 5. Container Setup
```javascript
// In your container initialization file
const UserRepository = require('./infrastructure/database/repositories/user.repository');
const AuthService = require('./domain/services/auth.service');
const AuthController = require('./api/controllers/auth.controller');

// Register
container.register('userRepository', () => new UserRepository());

container.register('authService', (c) => 
  new AuthService(c.get('userRepository'))
);

container.register('authController', (c) => 
  new AuthController(c.get('authService'))
);
```

### 6. Mount Routes
```javascript
// In app.js
const authRoutes = require('./api/routes/v1/auth.routes');
app.use('/api/v1/auth', authRoutes);
```

## Example 2: CRUD Operations (Routes)

### 1. Repository
```javascript
// infrastructure/database/repositories/route.repository.js
const BaseRepository = require('./BaseRepository');

class RouteRepository extends BaseRepository {
  constructor() {
    super('routes');
  }

  async findByUserId(userId, options = {}) {
    return this.findAll({ user_id: userId }, options);
  }

  async findPublicRoutes(options = {}) {
    return this.findAll({ is_public: true }, options);
  }

  async createRoute(userId, routeData) {
    return this.create({
      ...routeData,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    });
  }
}

module.exports = RouteRepository;
```

### 2. Service
```javascript
// domain/services/route.service.js
const BaseService = require('./BaseService');
const { NotFoundError, AuthorizationError } = require('../../shared/errors');

class RouteService extends BaseService {
  constructor(routeRepository) {
    super('Route');
    this.routeRepository = routeRepository;
  }

  async getUserRoutes(userId, pagination) {
    const routes = await this.routeRepository.findByUserId(userId, {
      orderBy: 'created_at DESC',
      limit: pagination.limit,
      offset: pagination.offset
    });

    const total = await this.routeRepository.count({ user_id: userId });

    return { routes, total };
  }

  async getRoute(routeId, userId = null) {
    const route = await this.routeRepository.findById(routeId);

    if (!route) {
      throw new NotFoundError('Route', routeId);
    }

    // Check access: must be owner or route must be public
    if (!route.is_public && route.user_id !== userId) {
      throw new AuthorizationError('You do not have access to this route');
    }

    return route;
  }

  async createRoute(userId, routeData) {
    // Validate
    this.validateRequired(routeData, ['origin', 'destination']);

    // Create
    const route = await this.routeRepository.createRoute(userId, routeData);

    this.logAction('Route created', { routeId: route.id, userId });

    return route;
  }

  async updateRoute(routeId, userId, updates) {
    // Get route and verify ownership
    const route = await this.routeRepository.findById(routeId);

    if (!route) {
      throw new NotFoundError('Route', routeId);
    }

    if (route.user_id !== userId) {
      throw new AuthorizationError('You can only update your own routes');
    }

    // Update
    const updated = await this.routeRepository.update(routeId, updates);

    this.logAction('Route updated', { routeId, userId });

    return updated;
  }

  async deleteRoute(routeId, userId) {
    // Verify ownership
    const route = await this.routeRepository.findById(routeId);

    if (!route) {
      throw new NotFoundError('Route', routeId);
    }

    if (route.user_id !== userId) {
      throw new AuthorizationError('You can only delete your own routes');
    }

    // Delete
    await this.routeRepository.delete(routeId);

    this.logAction('Route deleted', { routeId, userId });
  }
}

module.exports = RouteService;
```

### 3. Controller
```javascript
// api/controllers/route.controller.js
const BaseController = require('./BaseController');
const { Paginator } = require('../../shared/helpers');

class RouteController extends BaseController {
  constructor(routeService) {
    super('Route');
    this.routeService = routeService;
  }

  list = this.asyncHandler(async (req, res) => {
    const userId = this.getUserId(req);
    const pagination = Paginator.parse(req.query);

    const { routes, total } = await this.routeService.getUserRoutes(
      userId, 
      pagination
    );

    return this.paginated(res, routes, { ...pagination, total });
  });

  get = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    const route = await this.routeService.getRoute(id, userId);

    return this.success(res, route);
  });

  create = this.asyncHandler(async (req, res) => {
    const userId = this.getUserId(req);

    const route = await this.routeService.createRoute(userId, req.body);

    this.logAction(req, 'Route created', { routeId: route.id });

    return this.created(res, route);
  });

  update = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    const route = await this.routeService.updateRoute(id, userId, req.body);

    return this.success(res, route, 'Route updated successfully');
  });

  delete = this.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = this.getUserId(req);

    await this.routeService.deleteRoute(id, userId);

    return this.noContent(res);
  });
}

module.exports = RouteController;
```

### 4. Routes
```javascript
// api/routes/v1/route.routes.js
const express = require('express');
const container = require('../../../core/container');
const { authenticate } = require('../../../middleware/auth');

const router = express.Router();
const routeController = container.get('routeController');

// All routes require authentication
router.use(authenticate);

router.get('/', routeController.list);
router.post('/', routeController.create);
router.get('/:id', routeController.get);
router.patch('/:id', routeController.update);
router.delete('/:id', routeController.delete);

module.exports = router;
```

## Testing Examples

### Test Repository
```javascript
const UserRepository = require('./user.repository');

describe('UserRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new UserRepository();
  });

  it('should create a user', async () => {
    const user = await repository.createUser({
      email: 'test@example.com',
      password_hash: 'hashed',
      name: 'Test User'
    });

    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
  });

  it('should find user by email', async () => {
    const user = await repository.findByEmail('test@example.com');
    expect(user).toBeTruthy();
  });
});
```

### Test Service (with Mocks)
```javascript
const AuthService = require('./auth.service');

describe('AuthService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      findByEmail: jest.fn(),
      createUser: jest.fn()
    };
    service = new AuthService(mockRepository);
  });

  it('should register new user', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);
    mockRepository.createUser.mockResolvedValue({
      id: '123',
      email: 'test@example.com'
    });

    const result = await service.register('test@example.com', 'password123');

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('token');
  });

  it('should throw error if email exists', async () => {
    mockRepository.findByEmail.mockResolvedValue({ id: '123' });

    await expect(
      service.register('test@example.com', 'password123')
    ).rejects.toThrow('Email already registered');
  });
});
```

### Test Controller (with Mocks)
```javascript
const AuthController = require('./auth.controller');

describe('AuthController', () => {
  let controller;
  let mockService;
  let req, res, next;

  beforeEach(() => {
    mockService = {
      register: jest.fn(),
      login: jest.fn()
    };
    controller = new AuthController(mockService);

    req = {
      body: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should register user', async () => {
    req.body = {
      email: 'test@example.com',
      password: 'password123'
    };

    mockService.register.mockResolvedValue({
      user: { id: '123' },
      token: 'token123'
    });

    await controller.register(req, res);

    expect(mockService.register).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

## Tips

1. **Always use base classes** - They provide consistent behavior
2. **Keep layers separated** - Don't skip layers
3. **Use dependency injection** - Makes testing easier
4. **Write integration tests** - Test the full flow
5. **Use transactions** - For operations that modify multiple tables
6. **Cache expensive operations** - Use Redis or in-memory cache
7. **Validate at boundaries** - Controller validates input, service validates business rules

