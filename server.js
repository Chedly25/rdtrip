const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();
const ZTLService = require('./services/ztl-service');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5000;
const ztlService = new ZTLService();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
// For demo purposes - in production, get your own key from https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'lEwczWVNzGvFAp1BtKgfV5KOtJrFbMdaDFEfL4Z6qHQ';

// In-memory job storage (in production, use Redis or a database)
const routeJobs = new Map();

// ==================== WEB SCRAPING UTILITIES ====================

// In-memory cache for this session (reduces DB hits)
const sessionImageCache = new Map();

// Success rate tracking
const scrapingStats = {
  total: 0,
  opengraph: 0,
  jsonld: 0,
  dom: 0,
  unsplash: 0,
  failed: 0
};

// Rate limiter: 2 seconds per domain
const domainLastRequest = new Map();

async function rateLimitedFetch(url, timeout = 5000) {
  try {
    const domain = new URL(url).hostname;
    const lastRequest = domainLastRequest.get(domain) || 0;
    const now = Date.now();

    if (now - lastRequest < 2000) {
      await new Promise(resolve => setTimeout(resolve, 2000 - (now - lastRequest)));
    }

    domainLastRequest.set(domain, Date.now());

    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RDTrip/1.0; +https://rdtrip.com)'
      }
    });

    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error.message);
    return null;
  }
}

// Validate and resolve URLs (handle relative URLs)
function resolveImageUrl(imageUrl, baseUrl) {
  if (!imageUrl) return null;

  try {
    // Already absolute URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // Protocol-relative URL
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }

    // Relative URL
    const base = new URL(baseUrl);
    const resolved = new URL(imageUrl, base.origin);
    return resolved.href;
  } catch (error) {
    console.error(`URL resolution error:`, error.message);
    return null;
  }
}

// Check if URL is valid and returns an image
function isValidImageUrl(url) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const ext = parsed.pathname.toLowerCase();
    return ext.match(/\.(jpg|jpeg|png|webp|gif)$/i) ||
           url.includes('unsplash.com') ||
           url.includes('images') ||
           url.includes('photo');
  } catch {
    return false;
  }
}

// ==================== SCRAPING STRATEGIES ====================

// Strategy 1: Open Graph meta tags (most reliable)
async function scrapeOpenGraphImage(url) {
  try {
    const response = await rateLimitedFetch(url);
    if (!response) return null;

    const $ = cheerio.load(response.data);

    // Try multiple OG tags in priority order
    const ogImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[property="og:image:secure_url"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[name="twitter:image:src"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content');

    if (ogImage) {
      const resolved = resolveImageUrl(ogImage, url);
      if (isValidImageUrl(resolved)) {
        console.log(`✅ Open Graph image found: ${resolved}`);
        return resolved;
      }
    }

    return null;
  } catch (error) {
    console.error(`Open Graph scrape error for ${url}:`, error.message);
    return null;
  }
}

// Strategy 2: JSON-LD structured data
async function scrapeJsonLdImage(url) {
  try {
    const response = await rateLimitedFetch(url);
    if (!response) return null;

    const $ = cheerio.load(response.data);

    // Find all JSON-LD scripts
    const jsonLdScripts = $('script[type="application/ld+json"]');

    for (let i = 0; i < jsonLdScripts.length; i++) {
      try {
        const jsonText = $(jsonLdScripts[i]).html();
        const json = JSON.parse(jsonText);

        // Handle array of objects
        const items = Array.isArray(json) ? json : [json];

        for (const item of items) {
          // Check for image in various schema.org formats
          const imageUrl =
            item.image?.url ||
            item.image?.contentUrl ||
            (typeof item.image === 'string' ? item.image : null) ||
            (Array.isArray(item.image) ? item.image[0]?.url || item.image[0] : null);

          if (imageUrl) {
            const resolved = resolveImageUrl(imageUrl, url);
            if (isValidImageUrl(resolved)) {
              console.log(`✅ JSON-LD image found: ${resolved}`);
              return resolved;
            }
          }
        }
      } catch (parseError) {
        // Skip malformed JSON-LD
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error(`JSON-LD scrape error for ${url}:`, error.message);
    return null;
  }
}

// Strategy 3: DOM parsing (last resort)
async function scrapeDomImages(url) {
  try {
    const response = await rateLimitedFetch(url);
    if (!response) return null;

    const $ = cheerio.load(response.data);

    // Look for common hero image patterns
    const selectors = [
      '.hero img',
      '.hero-image img',
      '.main-image img',
      '.featured-image img',
      '.banner img',
      'article img:first',
      '.gallery img:first',
      '.photo img:first',
      '#main-image',
      '.restaurant-image img',
      '.hotel-image img',
      '.venue-image img',
      'img[class*="hero"]',
      'img[class*="main"]',
      'img[class*="featured"]'
    ];

    for (const selector of selectors) {
      const imgSrc = $(selector).first().attr('src') || $(selector).first().attr('data-src');
      if (imgSrc) {
        const resolved = resolveImageUrl(imgSrc, url);
        if (isValidImageUrl(resolved)) {
          console.log(`✅ DOM image found: ${resolved}`);
          return resolved;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`DOM scrape error for ${url}:`, error.message);
    return null;
  }
}

// Fallback chain: Try all strategies in order
async function scrapeWithFallback(url, entityName, city) {
  scrapingStats.total++;
  console.log(`🔍 [${scrapingStats.total}] Scraping: ${entityName} in ${city}`);
  console.log(`   URL: ${url}`);

  // Try Open Graph (fastest, most reliable)
  const ogImage = await scrapeOpenGraphImage(url);
  if (ogImage) {
    scrapingStats.opengraph++;
    console.log(`✅ [OG ${scrapingStats.opengraph}/${scrapingStats.total}] Success: ${entityName}`);
    return { imageUrl: ogImage, source: 'opengraph' };
  }

  // Try JSON-LD structured data
  const jsonLdImage = await scrapeJsonLdImage(url);
  if (jsonLdImage) {
    scrapingStats.jsonld++;
    console.log(`✅ [JSON-LD ${scrapingStats.jsonld}/${scrapingStats.total}] Success: ${entityName}`);
    return { imageUrl: jsonLdImage, source: 'jsonld' };
  }

  // Try DOM parsing
  const domImage = await scrapeDomImages(url);
  if (domImage) {
    scrapingStats.dom++;
    console.log(`✅ [DOM ${scrapingStats.dom}/${scrapingStats.total}] Success: ${entityName}`);
    return { imageUrl: domImage, source: 'dom' };
  }

  // Final fallback: Unsplash
  scrapingStats.unsplash++;
  console.log(`⚠️  [Unsplash ${scrapingStats.unsplash}/${scrapingStats.total}] Fallback: ${entityName}`);
  const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(entityName + ' ' + city)}`;
  return { imageUrl: unsplashUrl, source: 'unsplash' };
}

// ==================== END WEB SCRAPING UTILITIES ====================

// Auth utilities and middleware
const db = require('./db/connection');
const { hashPassword, comparePassword, validatePasswordStrength } = require('./utils/password');
const { generateToken } = require('./utils/jwt');
const { authenticate, optionalAuth } = require('./middleware/auth');

// City optimization utility
const { selectOptimalCities } = require('./utils/cityOptimization');

// AI Agent configurations with enhanced metrics
const agents = {
  adventure: {
    name: "Adventure Agent",
    color: "#34C759",
    icon: "⛰️",
    prompt: `You are an adventure travel expert. Create a route with CITIES (not specific attractions) that are gateways to outdoor activities, hiking, mountains, and nature. Each waypoint must be a CITY NAME like 'Chamonix' or 'Interlaken', not 'Mont Blanc' or 'Jungfrau'.

For the route, also provide these ADVENTURE METRICS in your response:
- Physical Difficulty: Rate 1-5 (1=easy walks, 5=technical climbing/extreme sports)
- Gear Requirements: "Basic" (comfortable shoes), "Moderate" (hiking boots, layers), or "Extensive" (technical gear, equipment rental needed)
- Weather Dependency: "Low", "Moderate", or "High" (how much weather affects activities)
- Average Outdoor Hours: Number of hours per day spent on outdoor activities
- Equipment Rental Costs: Estimated daily cost range for gear rental if needed

List activities as things to do IN that city with difficulty levels.`,
    metricsExtractor: (response) => ({
      physicalDifficulty: extractRating(response, /Physical Difficulty:?\s*(\d)/i, 3),
      gearRequirement: extractLevel(response, /Gear Requirements?:?\s*(\w+)/i, ["Basic", "Moderate", "Extensive"], "Moderate"),
      weatherDependency: extractLevel(response, /Weather Dependency:?\s*(\w+)/i, ["Low", "Moderate", "High"], "Moderate"),
      outdoorHours: extractNumber(response, /Outdoor Hours:?\s*(\d+)/i, 6),
      equipmentCost: extractRange(response, /Equipment.*Cost:?\s*€?(\d+)-?(\d+)?/i, "€20-50")
    })
  },
  culture: {
    name: "Culture Agent",
    color: "#FFD60A",
    icon: "🏛️",
    prompt: `You are a cultural travel expert. Create a route with CITIES (not specific monuments) rich in history, art, and culture. Each waypoint must be a CITY NAME like 'Florence' or 'Avignon', not 'Uffizi Gallery' or 'Papal Palace'.

For the route, also provide these CULTURE METRICS in your response:
- UNESCO Sites: Total count across the route
- Museum Density: Average museums/cultural sites per day (number)
- Historical Periods: List which periods are covered (Medieval, Renaissance, Modern, etc.)
- Audio Guide Availability: Percentage of sites with audio guides (0-100%)
- Focus Split: Percentage breakdown - Art (%), History (%), Architecture (%) - must total 100%

List cultural sites as things to see IN that city with historical context.`,
    metricsExtractor: (response) => ({
      unescoSites: extractNumber(response, /UNESCO Sites?:?\s*(\d+)/i, 0),
      museumDensity: extractNumber(response, /Museum Density:?\s*(\d+)/i, 3),
      historicalPeriods: extractList(response, /Historical Periods?:?\s*([^.]+)/i, ["Medieval", "Renaissance"]),
      audioGuideAvailability: extractPercentage(response, /Audio Guide.*:?\s*(\d+)%?/i, 70),
      focusSplit: extractFocusSplit(response)
    })
  },
  food: {
    name: "Food Agent",
    color: "#FF3B30",
    icon: "🍽️",
    prompt: `You are a culinary travel expert. Create a route with CITIES (not specific restaurants) known for their food scene. Each waypoint must be a CITY NAME like 'Lyon' or 'San Sebastian', not specific restaurants or markets.

For the route, also provide these FOOD METRICS in your response:
- Must-Try Restaurants: List 2-3 specific restaurant names across the entire route (format: "Restaurant Name (City)")
- Booking Timeline: "Days ahead", "Weeks ahead", or "Months ahead" for popular restaurants
- Price Distribution: Street food (%), Casual dining (%), Fine dining (%) - must total 100%
- Regional Cuisines: Number of distinct regional cuisine types you'll experience
- Experience Types: Count of Markets, Cooking Classes, Tastings, Restaurant visits

List culinary experiences as things to try IN that city with price ranges. Include specific restaurant names where applicable.`,
    metricsExtractor: (response) => ({
      restaurants: extractRestaurants(response),
      bookingTimeline: extractLevel(response, /Booking.*:?\s*(Days?|Weeks?|Months?)/i, ["Days", "Weeks", "Months"], "Weeks"),
      priceDistribution: extractPriceDistribution(response),
      cuisineTypes: extractNumber(response, /Regional Cuisines?:?\s*(\d+)/i, 3),
      experienceTypes: extractExperienceTypes(response)
    })
  },
  "hidden-gems": {
    name: "Hidden Gems Agent",
    color: "#9333ea",
    icon: "💎",
    prompt: `You are a hidden gems travel expert. Create a route with LESSER-KNOWN CITIES that have authentic charm, character, and local flavor but are not famous tourist destinations. Focus on charming small towns, overlooked villages, and underrated cities.

For the route, also provide these HIDDEN GEMS METRICS in your response:
- Tourist Density: Rate 1-5 (1=completely off beaten path, 5=getting discovered)
- Language Requirement: "None", "Basic", or "Moderate" (local language needed)
- Payment Acceptance: Cash (%) vs Card (%) - must total 100%
- Local Dependency: "Low", "Moderate", or "High" (need for local contacts/guides)
- Transport Access: Public transport (%) vs Car required (%) - must total 100%

Each waypoint must be a CITY NAME that tourists typically miss. Explain what makes each place special.`,
    metricsExtractor: (response) => ({
      touristDensity: extractRating(response, /Tourist Density:?\s*(\d)/i, 2),
      languageRequirement: extractLevel(response, /Language.*:?\s*(\w+)/i, ["None", "Basic", "Moderate"], "Basic"),
      paymentAcceptance: extractPaymentSplit(response),
      localDependency: extractLevel(response, /Local Dependency:?\s*(\w+)/i, ["Low", "Moderate", "High"], "Moderate"),
      transportAccess: extractLevel(response, /Transport Access:?\s*(\w+)/i, ["Low", "Moderate", "High"], "Moderate")
    })
  },
  "best-overall": {
    name: "Best Overall",
    color: "#064d51",
    icon: "⭐",
    isMerged: true, // Special flag to indicate this merges other results
    description: "A perfectly balanced route combining the best of adventure, culture, food, and hidden gems",
    prompt: null, // This agent doesn't use AI - it merges results from other agents
    metricsExtractor: null
  }
};

// Helper functions for extracting metrics from AI responses
function extractRating(text, pattern, defaultValue) {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : defaultValue;
}

function extractNumber(text, pattern, defaultValue) {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : defaultValue;
}

function extractLevel(text, pattern, levels, defaultValue) {
  const match = text.match(pattern);
  if (match) {
    const value = match[1].trim();
    return levels.find(l => l.toLowerCase() === value.toLowerCase()) || defaultValue;
  }
  return defaultValue;
}

function extractRange(text, pattern, defaultValue) {
  const match = text.match(pattern);
  if (match && match[1]) {
    return match[2] ? `€${match[1]}-${match[2]}` : `€${match[1]}`;
  }
  return defaultValue;
}

function extractPercentage(text, pattern, defaultValue) {
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : defaultValue;
}

function extractList(text, pattern, defaultValue) {
  const match = text.match(pattern);
  if (match) {
    return match[1].split(',').map(s => s.trim()).filter(s => s);
  }
  return defaultValue;
}

function extractFocusSplit(text) {
  const artMatch = text.match(/Art:?\s*(\d+)%?/i);
  const historyMatch = text.match(/History:?\s*(\d+)%?/i);
  const architectureMatch = text.match(/Architecture:?\s*(\d+)%?/i);

  let art = artMatch ? parseInt(artMatch[1]) : 30;
  let history = historyMatch ? parseInt(historyMatch[1]) : 40;
  let architecture = architectureMatch ? parseInt(architectureMatch[1]) : 30;

  // Normalize to 100%
  const total = art + history + architecture;
  if (total !== 100) {
    const factor = 100 / total;
    art = Math.round(art * factor);
    history = Math.round(history * factor);
    architecture = Math.round(architecture * factor);
  }

  return { art, history, architecture };
}

function extractPriceDistribution(text) {
  const streetMatch = text.match(/Street.*:?\s*(\d+)%?/i);
  const casualMatch = text.match(/Casual.*:?\s*(\d+)%?/i);
  const fineMatch = text.match(/Fine.*:?\s*(\d+)%?/i);

  let street = streetMatch ? parseInt(streetMatch[1]) : 30;
  let casual = casualMatch ? parseInt(casualMatch[1]) : 50;
  let fine = fineMatch ? parseInt(fineMatch[1]) : 20;

  // Normalize to 100%
  const total = street + casual + fine;
  if (total !== 100) {
    const factor = 100 / total;
    street = Math.round(street * factor);
    casual = Math.round(casual * factor);
    fine = Math.round(fine * factor);
  }

  return { street, casual, fine };
}

function extractRestaurants(text) {
  const restaurants = [];

  // Look for restaurant patterns like "Restaurant Name (City)" or "Restaurant Name in City"
  const patterns = [
    /([A-Z][^()]+)\s*\(([^)]+)\)/g,  // Name (City)
    /(?:restaurant:|must-try:|recommended:)\s*([^,\n]+)/gi,  // After keywords
    /\d+\.\s*([^:\n]+)(?:\s*[-–]\s*|:\s*)/g  // Numbered lists
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1]?.trim();
      const city = match[2]?.trim();

      if (name && name.length > 2 && name.length < 50) {
        // Filter out common non-restaurant phrases
        if (!name.match(/^(the|a|an|in|at|for|with|and|or|but)$/i)) {
          restaurants.push({
            name: name,
            city: city || '',
            link: `https://www.google.com/search?q=${encodeURIComponent(name + (city ? ' ' + city : ''))}`
          });
        }
      }
    }
  });

  // Return max 3 restaurants, or defaults if none found
  if (restaurants.length === 0) {
    return [
      { name: "Le Bernardin", city: "Paris" },
      { name: "Osteria Francescana", city: "Modena" },
      { name: "El Celler de Can Roca", city: "Girona" }
    ];
  }

  return restaurants.slice(0, 3);
}

function extractExperienceTypes(text) {
  // Look for percentages in the text, or default to reasonable distribution
  const marketsMatch = text.match(/Markets?:?\s*(\d+)%?/i);
  const classesMatch = text.match(/Classes?:?\s*(\d+)%?/i);
  const tastingsMatch = text.match(/Tastings?:?\s*(\d+)%?/i);
  const diningMatch = text.match(/Dining:?\s*(\d+)%?/i);

  // Return percentages that make sense for food experiences
  return {
    dining: diningMatch ? parseInt(diningMatch[1]) : 60,
    markets: marketsMatch ? parseInt(marketsMatch[1]) : 25,
    classes: classesMatch ? parseInt(classesMatch[1]) : 15
  };
}

function extractPaymentSplit(text) {
  const cashMatch = text.match(/Cash:?\s*(\d+)%?/i);
  const cardMatch = text.match(/Card:?\s*(\d+)%?/i);

  let cash = cashMatch ? parseInt(cashMatch[1]) : 60;
  let card = cardMatch ? parseInt(cardMatch[1]) : 40;

  // Normalize to 100%
  const total = cash + card;
  if (total !== 100) {
    const factor = 100 / total;
    cash = Math.round(cash * factor);
    card = Math.round(card * factor);
  }

  return { cash, card };
}

function extractTransportSplit(text) {
  const publicMatch = text.match(/Public.*:?\s*(\d+)%?/i);
  const carMatch = text.match(/Car.*:?\s*(\d+)%?/i);

  let publicTransport = publicMatch ? parseInt(publicMatch[1]) : 40;
  let car = carMatch ? parseInt(carMatch[1]) : 60;

  // Normalize to 100%
  const total = publicTransport + car;
  if (total !== 100) {
    const factor = 100 / total;
    publicTransport = Math.round(publicTransport * factor);
    car = Math.round(car * factor);
  }

  return { publicTransport, car };
}

// =====================================================
// AUTHENTICATION ENDPOINTS
// =====================================================

/**
 * POST /api/auth/register
 * Register a new user account
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user in database
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email.toLowerCase(), passwordHash, name || null]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = generateToken(user);

    console.log('✅ New user registered:', user.email);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Failed to create account. Please try again.'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const result = await db.query(
      'SELECT id, email, password_hash, name, avatar_url, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    console.log('✅ User logged in:', user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Failed to login. Please try again.'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
app.get('/api/auth/me', authenticate, (req, res) => {
  // User is attached to req by authenticate middleware
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatarUrl: req.user.avatar_url,
      createdAt: req.user.created_at
    }
  });
});

// =====================================================
// SAVED ROUTES ENDPOINTS
// =====================================================

// POST /api/routes - Save a new route (protected)
app.post('/api/routes', authenticate, async (req, res) => {
  try {
    const { name, origin, destination, stops, budget, selectedAgents, routeData } = req.body;

    // Validate required fields
    if (!origin || !destination || !stops || !budget || !selectedAgents || !routeData) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['origin', 'destination', 'stops', 'budget', 'selectedAgents', 'routeData']
      });
    }

    // Save route to database
    const result = await db.query(
      `INSERT INTO routes (user_id, name, origin, destination, stops, budget, selected_agents, route_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, name, origin, destination, stops, budget, selected_agents, route_data, is_favorite, is_public, created_at, updated_at`,
      [
        req.user.id,
        name || `${origin} to ${destination}`,
        origin,
        destination,
        stops,
        budget,
        selectedAgents,
        JSON.stringify(routeData)
      ]
    );

    const savedRoute = result.rows[0];

    res.status(201).json({
      message: 'Route saved successfully',
      route: {
        id: savedRoute.id,
        userId: savedRoute.user_id,
        name: savedRoute.name,
        origin: savedRoute.origin,
        destination: savedRoute.destination,
        stops: savedRoute.stops,
        budget: savedRoute.budget,
        selectedAgents: savedRoute.selected_agents,
        routeData: savedRoute.route_data,
        isFavorite: savedRoute.is_favorite,
        isPublic: savedRoute.is_public,
        createdAt: savedRoute.created_at,
        updatedAt: savedRoute.updated_at
      }
    });
  } catch (error) {
    console.error('Error saving route:', error);
    res.status(500).json({ error: 'Failed to save route' });
  }
});

// GET /api/routes - Get all routes for authenticated user
app.get('/api/routes', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, user_id, name, origin, destination, stops, budget, selected_agents, route_data, is_favorite, is_public, created_at, updated_at
       FROM routes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const routes = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      origin: row.origin,
      destination: row.destination,
      stops: row.stops,
      budget: row.budget,
      selectedAgents: row.selected_agents,
      routeData: row.route_data,
      isFavorite: row.is_favorite,
      isPublic: row.is_public,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ routes });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// GET /api/routes/:id - Get a specific route
app.get('/api/routes/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, user_id, name, origin, destination, stops, budget, selected_agents, route_data, is_favorite, is_public, created_at, updated_at
       FROM routes
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const row = result.rows[0];
    res.json({
      route: {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        origin: row.origin,
        destination: row.destination,
        stops: row.stops,
        budget: row.budget,
        selectedAgents: row.selected_agents,
        routeData: row.route_data,
        isFavorite: row.is_favorite,
        isPublic: row.is_public,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

// DELETE /api/routes/:id - Delete a route
app.delete('/api/routes/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM routes WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

// PATCH /api/routes/:id - Update route (name, favorite status, etc.)
app.patch('/api/routes/:id', authenticate, async (req, res) => {
  try {
    const { name, isFavorite, isPublic } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (isFavorite !== undefined) {
      updates.push(`is_favorite = $${paramIndex++}`);
      values.push(isFavorite);
    }
    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramIndex++}`);
      values.push(isPublic);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id, req.user.id);

    const result = await db.query(
      `UPDATE routes SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING id, user_id, name, origin, destination, stops, budget, selected_agents, route_data, is_favorite, is_public, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const row = result.rows[0];
    res.json({
      message: 'Route updated successfully',
      route: {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        origin: row.origin,
        destination: row.destination,
        stops: row.stops,
        budget: row.budget,
        selectedAgents: row.selected_agents,
        routeData: row.route_data,
        isFavorite: row.is_favorite,
        isPublic: row.is_public,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ error: 'Failed to update route' });
  }
});

// =====================================================
// ROUTE SHARING ENDPOINTS
// =====================================================

// Helper function to generate unique share token
async function generateShareToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  let attempts = 0;

  while (attempts < 10) {
    token = '';
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if token already exists
    const result = await db.query(
      'SELECT COUNT(*) FROM routes WHERE share_token = $1',
      [token]
    );

    if (parseInt(result.rows[0].count) === 0) {
      return token;
    }

    attempts++;
  }

  throw new Error('Could not generate unique share token after 10 attempts');
}

// POST /api/routes/:id/share - Generate share token and make route public
app.post('/api/routes/:id/share', authenticate, async (req, res) => {
  try {
    // First, verify the user owns this route
    const ownerCheck = await db.query(
      'SELECT user_id FROM routes WHERE id = $1',
      [req.params.id]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (ownerCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to share this route' });
    }

    // Generate unique share token
    const shareToken = await generateShareToken();

    // Update route to be public with share token
    const result = await db.query(
      `UPDATE routes
       SET is_public = true,
           share_token = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING share_token`,
      [shareToken, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const baseUrl = req.protocol + '://' + req.get('host');
    const shareUrl = `${baseUrl}/shared/${shareToken}`;

    console.log(`✅ Route ${req.params.id} shared with token: ${shareToken}`);

    res.json({
      message: 'Route shared successfully',
      shareToken: shareToken,
      shareUrl: shareUrl,
      isPublic: true
    });
  } catch (error) {
    console.error('Error sharing route:', error);
    res.status(500).json({ error: 'Failed to share route' });
  }
});

// DELETE /api/routes/:id/share - Revoke sharing (make route private)
app.delete('/api/routes/:id/share', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE routes
       SET is_public = false,
           share_token = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    console.log(`🔒 Route ${req.params.id} sharing revoked`);

    res.json({
      message: 'Sharing disabled successfully',
      isPublic: false,
      shareToken: null
    });
  } catch (error) {
    console.error('Error revoking share:', error);
    res.status(500).json({ error: 'Failed to revoke sharing' });
  }
});

// GET /api/shared/:token - View shared route (public, no auth required)
app.get('/api/shared/:token', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.name as creator_name, u.email as creator_email
       FROM routes r
       JOIN users u ON r.user_id = u.id
       WHERE r.share_token = $1 AND r.is_public = true`,
      [req.params.token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shared route not found or is no longer public' });
    }

    // Increment view count
    await db.query(
      `UPDATE routes
       SET view_count = COALESCE(view_count, 0) + 1,
           last_viewed_at = CURRENT_TIMESTAMP
       WHERE share_token = $1`,
      [req.params.token]
    );

    const row = result.rows[0];

    console.log(`👁️ Shared route ${row.id} viewed (token: ${req.params.token})`);

    res.json({
      id: row.id,
      name: row.name,
      origin: row.origin,
      destination: row.destination,
      stops: row.stops,
      budget: row.budget,
      selectedAgents: row.selected_agents,
      routeData: row.route_data,
      createdAt: row.created_at,
      creator: {
        name: row.creator_name
        // Note: email is excluded from public view for privacy
      },
      viewCount: (row.view_count || 0) + 1 // Include the count we just incremented
    });
  } catch (error) {
    console.error('Error fetching shared route:', error);
    res.status(500).json({ error: 'Failed to fetch shared route' });
  }
});

// GET /api/routes/:id/stats - Get sharing statistics (owner only)
app.get('/api/routes/:id/stats', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT view_count, last_viewed_at, share_token, is_public
       FROM routes
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const row = result.rows[0];

    res.json({
      viewCount: row.view_count || 0,
      lastViewedAt: row.last_viewed_at,
      isPublic: row.is_public,
      shareToken: row.share_token
    });
  } catch (error) {
    console.error('Error fetching route stats:', error);
    res.status(500).json({ error: 'Failed to fetch route statistics' });
  }
});

// =====================================================
// ROUTE GENERATION ENDPOINTS
// =====================================================

// Start route generation job (returns immediately with job ID)
app.post('/api/generate-route', async (req, res) => {
  try {
    const { destination, stops = 3, agents: selectedAgents = ['adventure', 'culture', 'food'], budget = 'budget' } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Create unique job ID
    const jobId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize job status
    const job = {
      id: jobId,
      status: 'processing',
      destination,
      stops,
      budget,
      selectedAgents,
      progress: {
        total: selectedAgents.length,
        completed: 0,
        currentAgent: null,
        percentComplete: 0,
        startTime: Date.now(),
        estimatedTimeRemaining: selectedAgents.length * 20000, // 20s per agent estimate
        currentAgentStartTime: null
      },
      agentResults: [],
      error: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    routeJobs.set(jobId, job);

    // Return immediately with job ID
    res.json({
      jobId,
      status: 'processing',
      message: 'Route generation started. Poll /api/route-status/:jobId for progress.'
    });

    // Start processing in background (don't await)
    processRouteJob(jobId, destination, stops, selectedAgents, budget).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      const failedJob = routeJobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = error.message;
        failedJob.updatedAt = new Date();
      }
    });

  } catch (error) {
    console.error('Error starting route generation:', error);
    res.status(500).json({ error: 'Failed to start route generation', details: error.message });
  }
});

// Get job status and results
app.get('/api/route-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = routeJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Clean up old jobs (optional - remove completed jobs after sending)
  if (job.status === 'completed' || job.status === 'failed') {
    const age = Date.now() - job.createdAt.getTime();
    if (age > 300000) { // 5 minutes
      routeJobs.delete(jobId);
    }
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    route: job.status === 'completed' ? {
      origin: "Aix-en-Provence, France",
      destination: job.destination,
      totalStops: job.stops,
      budget: job.budget,
      agentResults: job.agentResults
    } : null,
    error: job.error
  });
});

// Background job processor
async function processRouteJob(jobId, destination, stops, selectedAgents, budget) {
  const job = routeJobs.get(jobId);
  if (!job) return;

  console.log(`\n=== Starting route job ${jobId} ===`);
  console.log(`Destination: ${destination}`);
  console.log(`Stops: ${stops}`);
  console.log(`Agents: ${selectedAgents.join(', ')}`);
  console.log(`Budget: ${budget}`);

  // Always process sequentially to avoid timeouts
  const agentResults = [];

  for (let i = 0; i < selectedAgents.length; i++) {
    const agentType = selectedAgents[i];
    const agentConfig = agents[agentType];

    try {
      // Update progress - agent starting
      const agentStartTime = Date.now();
      job.progress.currentAgent = agentConfig.name;
      job.progress.currentAgentStartTime = agentStartTime;
      job.progress.percentComplete = Math.round((i / selectedAgents.length) * 100);

      // Calculate estimated time remaining based on average time per completed agent
      const elapsed = agentStartTime - job.progress.startTime;
      const avgTimePerAgent = i > 0 ? elapsed / i : 20000; // Use 20s default for first agent
      job.progress.estimatedTimeRemaining = Math.round(avgTimePerAgent * (selectedAgents.length - i));

      job.updatedAt = new Date();

      console.log(`\n--- Processing ${agentConfig.name} (${i + 1}/${selectedAgents.length}) ---`);

      const result = await queryPerplexityWithMetrics(agentConfig, destination, stops, budget);

      // Parse the response to extract origin, destination, and waypoints
      let parsedResult;
      try {
        parsedResult = JSON.parse(result.recommendations);
      } catch (error) {
        console.error(`Failed to parse recommendations for ${agentConfig.name}:`, error.message);
        throw error;
      }

      // If we have origin, destination, and waypoints, run optimization
      if (parsedResult.origin && parsedResult.destination && parsedResult.waypoints) {
        console.log(`Running city optimization for ${agentConfig.name}...`);
        const optimized = selectOptimalCities(
          parsedResult.waypoints,
          parsedResult.origin,
          parsedResult.destination,
          stops
        );

        // Create optimized result with both selected and alternatives
        const optimizedResult = {
          origin: parsedResult.origin,
          destination: parsedResult.destination,
          waypoints: optimized.selected,
          alternatives: optimized.alternatives
        };

        agentResults.push({
          agent: agentType,
          agentConfig: {
            name: agentConfig.name,
            color: agentConfig.color,
            icon: agentConfig.icon
          },
          recommendations: JSON.stringify(optimizedResult),
          metrics: result.metrics
        });
      } else {
        // Fallback: use result as-is if no optimization data
        console.warn(`No optimization data for ${agentConfig.name}, using raw response`);
        agentResults.push({
          agent: agentType,
          agentConfig: {
            name: agentConfig.name,
            color: agentConfig.color,
            icon: agentConfig.icon
          },
          recommendations: result.recommendations,
          metrics: result.metrics
        });
      }

      // Update progress - agent completed
      job.progress.completed = i + 1;
      job.progress.percentComplete = Math.round(((i + 1) / selectedAgents.length) * 100);

      // Update time estimate based on actual performance
      const completedTime = Date.now();
      const totalElapsed = completedTime - job.progress.startTime;
      const actualAvgTimePerAgent = totalElapsed / (i + 1);
      job.progress.estimatedTimeRemaining = Math.round(actualAvgTimePerAgent * (selectedAgents.length - (i + 1)));

      job.agentResults = agentResults;
      job.updatedAt = new Date();

      console.log(`✓ ${agentConfig.name} completed (${i + 1}/${selectedAgents.length})`);
      console.log(`   Progress: ${job.progress.percentComplete}% | Est. remaining: ${Math.round(job.progress.estimatedTimeRemaining / 1000)}s`);

    } catch (error) {
      console.error(`✗ ${agentConfig.name} failed:`, error.message);

      // Add error result but continue
      agentResults.push({
        agent: agentType,
        agentConfig: {
          name: agentConfig.name,
          color: agentConfig.color,
          icon: agentConfig.icon
        },
        recommendations: JSON.stringify({ waypoints: [], error: `Failed to generate route` }),
        metrics: {}
      });

      // Update progress even on error
      job.progress.completed = i + 1;
      job.progress.percentComplete = Math.round(((i + 1) / selectedAgents.length) * 100);

      // Update time estimate
      const completedTime = Date.now();
      const totalElapsed = completedTime - job.progress.startTime;
      const avgTimePerAgent = totalElapsed / (i + 1);
      job.progress.estimatedTimeRemaining = Math.round(avgTimePerAgent * (selectedAgents.length - (i + 1)));

      job.agentResults = agentResults;
      job.updatedAt = new Date();
    }
  }

  // Create "Best Overall" merged result if we have multiple agents
  if (selectedAgents.length > 1 && !selectedAgents.includes('best-overall')) {
    try {
      console.log('\n--- Creating Best Overall merged route ---');
      const mergedResult = createBestOverallRoute(agentResults, stops);

      // Add to beginning of results array
      agentResults.unshift({
        agent: 'best-overall',
        agentConfig: {
          name: agents['best-overall'].name,
          color: agents['best-overall'].color,
          icon: agents['best-overall'].icon
        },
        recommendations: JSON.stringify(mergedResult),
        metrics: {}
      });

      job.agentResults = agentResults;
      console.log('✓ Best Overall route created');
    } catch (error) {
      console.error('✗ Failed to create Best Overall:', error.message);
    }
  }

  // Mark job as completed
  job.status = 'completed';
  job.progress.currentAgent = null;
  job.updatedAt = new Date();

  console.log(`\n=== Route job ${jobId} completed ===\n`);
}

// Create Best Overall route by merging and optimizing cities from all agents
function createBestOverallRoute(agentResults, requestedStops) {
  console.log('\n=== Creating Best Overall Route ===');

  // Step 1: Pool ALL cities from all agents (selected + alternatives)
  const cityPool = new Map(); // Use Map to deduplicate by city name
  let origin = null;
  let destination = null;

  agentResults.forEach(result => {
    try {
      const parsed = JSON.parse(result.recommendations);
      const agent = result.agent;

      // Extract origin and destination from first result that has them
      if (!origin && parsed.origin) {
        origin = parsed.origin;
        destination = parsed.destination;
      }

      // Pool selected waypoints
      if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
        parsed.waypoints.forEach(city => {
          const cityKey = city.name.toLowerCase().trim();

          if (!cityPool.has(cityKey)) {
            cityPool.set(cityKey, {
              ...city,
              themes: [agent],
              themeCount: 1
            });
          } else {
            // City appears in multiple themes - merge data
            const existing = cityPool.get(cityKey);
            existing.themes.push(agent);
            existing.themeCount = existing.themes.length;

            // Merge activities (deduplicate)
            if (city.activities && Array.isArray(city.activities)) {
              if (!existing.activities) {
                existing.activities = [];
              }
              const activitySet = new Set([...existing.activities, ...city.activities]);
              existing.activities = Array.from(activitySet);
            }

            // Keep currentEvents if available
            if (city.currentEvents && city.currentEvents !== 'None') {
              existing.currentEvents = city.currentEvents;
            }
          }
        });
      }

      // Pool alternatives
      if (parsed.alternatives && Array.isArray(parsed.alternatives)) {
        parsed.alternatives.forEach(city => {
          const cityKey = city.name.toLowerCase().trim();

          if (!cityPool.has(cityKey)) {
            cityPool.set(cityKey, {
              ...city,
              themes: [agent],
              themeCount: 1
            });
          } else {
            // City appears in multiple themes
            const existing = cityPool.get(cityKey);
            if (!existing.themes.includes(agent)) {
              existing.themes.push(agent);
              existing.themeCount = existing.themes.length;
            }
          }
        });
      }
    } catch (e) {
      console.error(`Error parsing ${result.agent} result:`, e.message);
    }
  });

  const pooledCities = Array.from(cityPool.values());
  console.log(`Pooled ${pooledCities.length} unique cities from all agents`);

  // Step 2: If we have origin/destination, run geographic optimization
  if (origin && destination && origin.latitude && destination.latitude) {
    console.log(`Running optimization from ${origin.name} to ${destination.name}`);

    const optimized = selectOptimalCities(pooledCities, origin, destination, requestedStops);

    // Step 3: Add theme metadata to selected cities
    const selectedWithThemes = optimized.selected.map(city => ({
      ...city,
      themesDisplay: city.themes.map(t => agents[t]?.name || t).join(', ')
    }));

    // Step 4: Add theme metadata to alternatives
    const alternativesWithThemes = optimized.alternatives.map(city => ({
      ...city,
      themesDisplay: city.themes.map(t => agents[t]?.name || t).join(', ')
    }));

    console.log(`Selected ${selectedWithThemes.length} cities, ${alternativesWithThemes.length} alternatives`);
    console.log(`Theme distribution: ${selectedWithThemes.map(c => `${c.name} (${c.themes.length})`).join(', ')}`);

    return {
      origin,
      destination,
      waypoints: selectedWithThemes,
      alternatives: alternativesWithThemes,
      description: `A perfectly balanced route combining the best of ${Array.from(new Set(selectedWithThemes.flatMap(c => c.themes))).map(t => agents[t]?.name || t).join(', ')}. Each city has been selected for its unique mix of experiences and optimal positioning along your route.`
    };
  } else {
    // Fallback: No optimization data, use theme-based scoring
    console.warn('No optimization data available, using theme-based scoring');

    // Sort by theme count (multi-theme cities ranked higher)
    const sorted = pooledCities.sort((a, b) => {
      if (a.themeCount !== b.themeCount) {
        return b.themeCount - a.themeCount;
      }
      return 0;
    });

    const selected = sorted.slice(0, requestedStops);
    const alternatives = sorted.slice(requestedStops);

    return {
      waypoints: selected.map(c => ({
        ...c,
        themesDisplay: c.themes.map(t => agents[t]?.name || t).join(', ')
      })),
      alternatives: alternatives.map(c => ({
        ...c,
        themesDisplay: c.themes.map(t => agents[t]?.name || t).join(', ')
      })),
      description: `A perfectly balanced route combining the best of ${Array.from(new Set(selected.flatMap(c => c.themes))).map(t => agents[t]?.name || t).join(', ')}.`
    };
  }
}

// Get hotels and restaurants for a city
app.post('/api/get-hotels-restaurants', async (req, res) => {
  try {
    const { city, budget = 'mid', preferences = {} } = req.body;

    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }

    console.log(`Fetching hotels and restaurants for ${city} with budget ${budget}`);

    const results = await Promise.all([
      getHotelsForCity(city, budget, preferences),
      getRestaurantsForCity(city, budget, preferences),
      getCityImages(city)
    ]);

    const [hotels, restaurants, images] = results;

    res.json({
      city,
      hotels,
      restaurants,
      images
    });

  } catch (error) {
    console.error('Error fetching hotels and restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch hotels and restaurants' });
  }
});

// Generate detailed day-by-day itinerary
app.post('/api/generate-itinerary', async (req, res) => {
  try {
    const { agent, origin, destination, waypoints } = req.body;
    
    if (!agent || !origin || !destination) {
      return res.status(400).json({ error: 'Agent, origin, and destination are required' });
    }

    const agentConfig = agents[agent];
    if (!agentConfig) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }

    const itinerary = await generateDetailedItinerary(agentConfig, origin, destination, waypoints);
    
    res.json({
      agent: agent,
      origin: origin,
      destination: destination,
      itinerary: itinerary
    });
  } catch (error) {
    console.error('Itinerary generation error:', error);
    res.status(500).json({ error: 'Failed to generate itinerary' });
  }
});

async function generateDetailedItinerary(agent, origin, destination, waypoints) {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const waypointNames = waypoints ? waypoints.map(w => w.name).join(', ') : '';
      
      const prompt = `${agent.prompt}

Create a detailed day-by-day itinerary for a road trip from ${origin} to ${destination}.
${waypoints && waypoints.length > 0 ? `Include these waypoints: ${waypointNames}` : ''}

Provide a JSON response with:
- days: array of daily plans
- each day should have:
  - day: day number
  - location: main city/area for the day
  - activities: array of timed activities (with time, title, description)
  - accommodation: suggested place to stay
  - meals: breakfast, lunch, dinner recommendations  
  - travel: driving details if moving to next location

Focus on providing detailed, practical travel information and specific recommendations.

Make it detailed and practical with specific times and recommendations.`;

      console.log(`Attempt ${attempt}/${maxRetries} - Generating itinerary for ${agent.name}`);

      const response = await axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 10000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 120 second timeout
      });

      console.log(`Successfully generated itinerary for ${agent.name} on attempt ${attempt}`);
      return response.data.choices[0].message.content;
      
    } catch (error) {
      const status = error.response?.status;
      const statusText = error.response?.statusText || error.message;
      
      console.error(`Attempt ${attempt}/${maxRetries} failed for ${agent.name}:`, {
        status,
        statusText,
        data: error.response?.data
      });
      
      // If this is the last attempt, return a fallback
      if (attempt === maxRetries) {
        console.error(`All ${maxRetries} attempts failed for ${agent.name}`);
        
        // Return a fallback itinerary
        return JSON.stringify({
          days: [
            {
              day: 1,
              location: origin,
              activities: [
                {
                  time: "09:00",
                  title: "Start your journey",
                  description: `Begin your ${agent.name.toLowerCase()} adventure from ${origin}`
                },
                {
                  time: "12:00", 
                  title: "Lunch break",
                  description: "Stop for a local meal along the route"
                }
              ],
              accommodation: "Local hotel or accommodation",
              meals: {
                breakfast: "Hotel breakfast",
                lunch: "Local restaurant",
                dinner: "Regional cuisine"
              }
            },
            {
              day: 2,
              location: destination,
              activities: [
                {
                  time: "10:00",
                  title: "Explore destination",
                  description: `Discover the highlights of ${destination}`
                }
              ],
              accommodation: "Destination accommodation",
              meals: {
                breakfast: "Local café",
                lunch: "City center restaurant", 
                dinner: "Traditional local cuisine"
              }
            }
          ]
        });
      }
      
      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries) {
        console.log(`Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

// Helper function to get hotels for a city
async function getHotelsForCity(city, budget, preferences) {
  const budgetMap = {
    budget: '€-€€',
    mid: '€€-€€€',
    luxury: '€€€-€€€€'
  };

  const budgetRange = budgetMap[budget] || '€€-€€€';

  const prompt = `Find the top 5 hotels in ${city} with ${budgetRange} price range.

  Return ONLY a JSON array with this exact structure:
  [
    {
      "name": "Hotel Name",
      "stars": 4,
      "priceRange": "${budgetRange}",
      "pricePerNight": "€120-180",
      "distance": "0.5km from city center",
      "amenities": ["WiFi", "Breakfast", "Parking"],
      "highlights": "Brief description of why this hotel stands out",
      "bookingUrl": "https://booking.com/hotel/...",
      "address": "Hotel address"
    }
  ]

  Focus on: location, value for money, guest ratings, and unique features. Include direct booking links when available.`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let result = response.data.choices[0].message.content;

    // Clean up the response - remove markdown formatting
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const hotels = JSON.parse(result);

      // Add images to each hotel
      const hotelsWithImages = await Promise.all(
        hotels.map(async (hotel) => {
          const image = await getHotelImage(hotel.name, city, hotel.stars);
          return { ...hotel, image };
        })
      );

      return hotelsWithImages;
    } catch (parseError) {
      console.warn('Failed to parse hotels JSON, returning fallback');
      const fallbackImage = await getHotelImage(`${city} Hotel`, city, 3);
      return [{
        name: `${city} Hotel`,
        stars: 3,
        priceRange: budgetRange,
        pricePerNight: "€80-120",
        distance: "City center",
        amenities: ["WiFi", "Reception"],
        highlights: "Comfortable stay in the heart of the city",
        bookingUrl: "#",
        address: `${city} city center`,
        image: fallbackImage
      }];
    }
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return [];
  }
}

// Helper function to get restaurants for a city
async function getRestaurantsForCity(city, budget, preferences) {
  const budgetMap = {
    budget: '€-€€',
    mid: '€€-€€€',
    luxury: '€€€-€€€€'
  };

  const budgetRange = budgetMap[budget] || '€€-€€€';

  const prompt = `Find the top 5 restaurants in ${city} with ${budgetRange} price range.

  Return ONLY a JSON array with this exact structure:
  [
    {
      "name": "Restaurant Name",
      "cuisine": "Italian",
      "priceRange": "${budgetRange}",
      "avgPrice": "€25-40 per person",
      "mustTry": ["Signature dish 1", "Signature dish 2"],
      "atmosphere": "Casual/Fine dining/Family-friendly",
      "openingHours": "12:00-22:00",
      "specialFeatures": "Outdoor seating, Local ingredients, etc.",
      "reservationUrl": "https://...",
      "address": "Restaurant address"
    }
  ]

  Include a mix of local specialties, international cuisine, and different price points within the range.`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let result = response.data.choices[0].message.content;

    // Clean up the response
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const restaurants = JSON.parse(result);

      // Add images to each restaurant
      const restaurantsWithImages = await Promise.all(
        restaurants.map(async (restaurant) => {
          const image = await getRestaurantImage(restaurant.name, restaurant.cuisine);
          return { ...restaurant, image };
        })
      );

      return restaurantsWithImages;
    } catch (parseError) {
      console.warn('Failed to parse restaurants JSON, returning fallback');
      const fallbackImage = await getRestaurantImage(`${city} Restaurant`, 'Local');
      return [{
        name: `${city} Restaurant`,
        cuisine: "Local",
        priceRange: budgetRange,
        avgPrice: "€20-35 per person",
        mustTry: ["Local specialty"],
        atmosphere: "Casual",
        openingHours: "12:00-22:00",
        specialFeatures: "Traditional cuisine",
        reservationUrl: "#",
        address: `${city} city center`,
        image: fallbackImage
      }];
    }
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
}

// Helper function to get hotel images from Unsplash
async function getHotelImage(hotelName, city, stars = 3) {
  try {
    // Create search terms based on hotel quality
    let searchTerms = ['hotel'];

    if (stars >= 4) {
      searchTerms.push('luxury', 'elegant', 'boutique');
    } else if (stars === 3) {
      searchTerms.push('modern', 'comfortable');
    } else {
      searchTerms.push('budget', 'cozy');
    }

    searchTerms.push('lobby', 'interior', 'room');

    const query = searchTerms.join(' ');

    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        per_page: 1,
        orientation: 'landscape',
        content_filter: 'high'
      },
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const photo = response.data.results[0];
      return {
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        alt: photo.alt_description || `${hotelName} - Hotel`,
        photographer: photo.user.name,
        source: 'Unsplash'
      };
    }
  } catch (error) {
    console.warn('Error fetching hotel image from Unsplash:', error.message);
  }

  // Fallback to placeholder
  return {
    url: `https://via.placeholder.com/400x300/4A90E2/white?text=Hotel`,
    thumb: `https://via.placeholder.com/200x150/4A90E2/white?text=Hotel`,
    alt: `${hotelName} - Hotel`,
    photographer: 'Placeholder',
    source: 'Placeholder'
  };
}

// Helper function to get restaurant images from Unsplash
async function getRestaurantImage(restaurantName, cuisine = 'restaurant') {
  try {
    // Create search terms based on cuisine type
    let searchTerms = [];

    const cuisineMap = {
      'italian': ['italian food', 'pasta', 'pizza', 'trattoria'],
      'french': ['french cuisine', 'bistro', 'fine dining', 'brasserie'],
      'asian': ['asian cuisine', 'sushi', 'ramen', 'asian restaurant'],
      'mexican': ['mexican food', 'tacos', 'mexican restaurant'],
      'indian': ['indian food', 'curry', 'indian restaurant'],
      'mediterranean': ['mediterranean food', 'greek', 'mezze'],
      'seafood': ['seafood restaurant', 'fish', 'oysters'],
      'steakhouse': ['steakhouse', 'grill', 'meat'],
      'cafe': ['cafe', 'coffee shop', 'pastries'],
      'bakery': ['bakery', 'bread', 'pastries']
    };

    const cuisineLower = cuisine.toLowerCase();
    const matchedCuisine = Object.keys(cuisineMap).find(key =>
      cuisineLower.includes(key) || key.includes(cuisineLower)
    );

    if (matchedCuisine) {
      searchTerms = [...cuisineMap[matchedCuisine]];
    } else {
      searchTerms = ['restaurant', 'dining', 'food', 'cuisine'];
    }

    const query = searchTerms.join(' OR ');

    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: query,
        per_page: 1,
        orientation: 'landscape',
        content_filter: 'high'
      },
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const photo = response.data.results[0];
      return {
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        alt: photo.alt_description || `${restaurantName} - ${cuisine} Restaurant`,
        photographer: photo.user.name,
        source: 'Unsplash'
      };
    }
  } catch (error) {
    console.warn('Error fetching restaurant image from Unsplash:', error.message);
  }

  // Fallback to placeholder
  return {
    url: `https://via.placeholder.com/400x300/FF6B35/white?text=🍽️+Restaurant`,
    thumb: `https://via.placeholder.com/200x150/FF6B35/white?text=🍽️`,
    alt: `${restaurantName} - Restaurant`,
    photographer: 'Placeholder',
    source: 'Placeholder'
  };
}

// Helper function to get city images from Wikimedia with Unsplash fallback
async function getCityImages(city, country) {
  try {
    // Try Wikipedia first
    const searchTerm = country ? `${city}, ${country}` : city;
    const searchResponse = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(searchTerm));

    // Get main image from Wikipedia
    if (searchResponse.data.originalimage && searchResponse.data.originalimage.source) {
      console.log(`✅ Found Wikipedia image for ${city}`);
      return searchResponse.data.originalimage.source;
    }

    // Try without country if we had one
    if (country) {
      const fallbackResponse = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(city));
      if (fallbackResponse.data.originalimage && fallbackResponse.data.originalimage.source) {
        console.log(`✅ Found Wikipedia image for ${city} (without country)`);
        return fallbackResponse.data.originalimage.source;
      }
    }

    // If Wikipedia fails, fall back to Unsplash
    console.log(`⚠️  No Wikipedia image for ${city}, trying Unsplash...`);
    const unsplashResponse = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: `${city} ${country || ''} cityscape landmark`,
        per_page: 1,
        orientation: 'landscape'
      },
      headers: {
        'Accept-Version': 'v1',
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (unsplashResponse.data.results && unsplashResponse.data.results.length > 0) {
      console.log(`✅ Found Unsplash image for ${city}`);
      return unsplashResponse.data.results[0].urls.regular;
    }

    // Final fallback to a generic image
    console.warn(`⚠️  No images found for ${city}, using placeholder`);
    return `https://source.unsplash.com/800x600/?${encodeURIComponent(city)},cityscape`;
  } catch (error) {
    console.error(`❌ Error fetching image for ${city}:`, error.message);
    // Return Unsplash source as ultimate fallback
    return `https://source.unsplash.com/800x600/?${encodeURIComponent(city)},cityscape`;
  }
}

async function queryPerplexityWithMetrics(agent, destination, stops, budget = 'budget') {
  const responseText = await queryPerplexity(agent, destination, stops, budget);

  // Clean markdown code blocks from JSON response
  let cleanedResponse = responseText.trim();

  // Remove ```json and ``` markers
  cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '');
  cleanedResponse = cleanedResponse.replace(/^```\s*/i, '');
  cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');
  cleanedResponse = cleanedResponse.trim();

  // Additional JSON cleaning - be very aggressive
  // Remove trailing commas before closing brackets/braces (multiple passes)
  let previousResponse = '';
  let iterations = 0;
  while (previousResponse !== cleanedResponse && iterations < 5) {
    previousResponse = cleanedResponse;
    cleanedResponse = cleanedResponse.replace(/,(\s*[\]}])/g, '$1');
    iterations++;
  }

  // Remove comments (sometimes AI adds them)
  cleanedResponse = cleanedResponse.replace(/\/\/.*$/gm, '');
  cleanedResponse = cleanedResponse.replace(/\/\*[\s\S]*?\*\//g, '');

  // Try to validate and fix JSON
  try {
    JSON.parse(cleanedResponse);
  } catch (e) {
    console.error(`Invalid JSON from ${agent.name}:`, e.message);
    console.error('Error position:', e.message.match(/position (\d+)/)?.[1]);

    // If JSON is invalid, try to extract just the JSON object
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];

      // Try more aggressive cleaning
      cleanedResponse = cleanedResponse.replace(/,(\s*[\]}])/g, '$1'); // Remove trailing commas again

      // Try to parse again
      try {
        JSON.parse(cleanedResponse);
        console.log(`Fixed JSON for ${agent.name} after extraction`);
      } catch (e2) {
        console.error('Still invalid after extraction:', e2.message);
        const errorPos = parseInt(e2.message.match(/position (\d+)/)?.[1] || '0');
        console.error('Problem area:', cleanedResponse.substring(Math.max(0, errorPos - 50), errorPos + 50));
      }
    }
  }

  // Extract metrics from the response
  const metrics = agent.metricsExtractor ? agent.metricsExtractor(cleanedResponse) : {};

  return {
    recommendations: cleanedResponse,
    metrics: metrics
  };
}

async function queryPerplexity(agent, destination, stops, budget = 'budget', retryCount = 0) {
  const maxRetries = 2;
  const baseTimeout = 45000; // 45 seconds base timeout
  const retryDelay = 3000; // 3 second delay between retries

  try {
    const budgetDescriptions = {
      budget: 'budget-friendly options, affordable accommodations, free or low-cost activities, local food markets',
      moderate: 'mid-range accommodations, mix of free and paid activities, local restaurants and cafes',
      comfort: 'comfortable hotels, paid attractions and activities, nice restaurants and dining experiences',
      luxury: 'luxury hotels and resorts, premium experiences, fine dining, exclusive activities'
    };

    const budgetContext = budgetDescriptions[budget] || budgetDescriptions.budget;

    // Request 2x cities for route optimization (we'll pick the best ones)
    const requestedCities = stops * 2;

    // Adjust max_tokens based on requested cities
    const maxTokens = Math.min(1500 + (requestedCities * 150), 3000);

    const prompt = `${agent.prompt}

Create a road trip from Aix-en-Provence to ${destination} with ${requestedCities} CITY candidates (we need ${stops} final stops, but provide ${requestedCities} options for route optimization).

BUDGET: ${budgetContext}

CRITICAL RULES:
1. Each waypoint MUST be a CITY or TOWN name only
2. Do NOT include the origin (Aix-en-Provence) or destination (${destination}) as stops
3. Do NOT use attraction names as waypoints
4. Examples of CORRECT names: "Grenoble", "Annecy", "Lyon"
5. Examples of WRONG names: "Pont du Gard", "Mont Blanc", "Louvre Museum"
6. MUST include exact coordinates in decimal format (latitude, longitude)
7. Include current events, festivals, or seasonal happenings in the city (check upcoming dates)

Return ONLY valid JSON (no extra text before or after):
{
  "origin": {
    "name": "Aix-en-Provence",
    "latitude": 43.5297,
    "longitude": 5.4474
  },
  "destination": {
    "name": "${destination}",
    "latitude": XX.XXXX,
    "longitude": XX.XXXX
  },
  "waypoints": [
    {
      "name": "CITY_NAME",
      "latitude": 45.1234,
      "longitude": 5.6789,
      "description": "Why this city is great for ${agent.name.toLowerCase()}",
      "activities": ["activity 1", "activity 2", "activity 3"],
      "currentEvents": "Any festivals, markets, or special events happening soon (or 'None' if nothing special)",
      "duration": "1-2 days"
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting, no extra text
- Provide exactly ${requestedCities} cities
- DO NOT include ${destination} or Aix-en-Provence as stops
- Coordinates MUST be valid decimal numbers (latitude between -90 and 90, longitude between -180 and 180)`;

    console.log(`[${agent.name}] Querying Perplexity (attempt ${retryCount + 1}/${maxRetries + 1}, timeout: ${baseTimeout}ms, maxTokens: ${maxTokens})`);

    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: baseTimeout // 45 second timeout
    });

    console.log(`[${agent.name}] Successfully received response`);
    return response.data.choices[0].message.content;

  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
    const is503 = error.response?.status === 503;

    console.error(`[${agent.name}] Error (attempt ${retryCount + 1}/${maxRetries + 1}):`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      isTimeout,
      is503
    });

    // Retry on timeout or 503 errors
    if ((isTimeout || is503) && retryCount < maxRetries) {
      const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff
      console.log(`[${agent.name}] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return queryPerplexity(agent, destination, stops, budget, retryCount + 1);
    }

    // If all retries failed, return error
    console.error(`[${agent.name}] All retry attempts exhausted`);
    throw error;
  }
}

// Chat endpoint for AI assistant
app.post('/api/chat', async (req, res) => {
  try {
    const { message, routeContext } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create context from route data
    let contextInfo = '';
    if (routeContext) {
      contextInfo = `
      
Route Context:
- Origin: ${routeContext.origin}
- Destination: ${routeContext.destination}
- Budget: ${routeContext.budget}
- Stops: ${routeContext.totalStops}
- Selected agents: ${routeContext.agentResults.map(ar => ar.agent).join(', ')}

Previous recommendations:
${routeContext.agentResults.map(ar => `${ar.agent}: ${ar.recommendations.substring(0, 200)}...`).join('\n')}`;
    }

    const prompt = `You are a helpful travel assistant specializing in road trips from Aix-en-Provence, France. 
    
You provide practical travel advice, local tips, budget information, and route suggestions. Be conversational, helpful, and specific.

${contextInfo}

User question: ${message}

Provide a helpful, concise response (2-3 paragraphs maximum) that directly addresses the user's question.`;

    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    res.json({
      response: response.data.choices[0].message.content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get chat response',
      message: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

// Simplified image endpoint - no external validation
app.get('/api/image-info', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  // Simple URL validation without external calls
  try {
    new URL(url);
    res.json({ 
      valid: true, 
      url: url,
      message: 'URL format is valid'
    });
  } catch {
    res.status(400).json({ 
      valid: false, 
      error: 'Invalid URL format'
    });
  }
});

// Simple placeholder image service - no external API calls
app.get('/api/location-image/:location', (req, res) => {
  const { location } = req.params;
  const { agent = 'adventure' } = req.query;
  
  // Simple placeholder that doesn't make external API calls
  const imageId = Math.abs(location.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 1000;
  const placeholderUrl = `https://picsum.photos/400/300?random=${imageId}`;
  
  res.json({
    url: placeholderUrl,
    location: location,
    agent: agent
  });
});

// Generate Mapbox static image for route overview
app.post('/api/mapbox-image', async (req, res) => {
  try {
    const { waypoints, destination, width = 800, height = 400 } = req.body;
    
    if (!waypoints || !destination) {
      return res.status(400).json({ error: 'Waypoints and destination are required' });
    }

    // Create markers for Mapbox Static API
    const markers = [];
    
    // Add origin marker (Aix-en-Provence)
    markers.push('pin-s-a+007AFF(5.4474,43.5297)');
    
    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      if (waypoint.lng && waypoint.lat) {
        const markerColor = getAgentColor(waypoint.agent || 'adventure');
        markers.push(`pin-s-${index + 1}+${markerColor}(${waypoint.lng},${waypoint.lat})`);
      }
    });
    
    // Add destination marker (you'd need to geocode the destination)
    // For now, we'll create a basic map with waypoints
    
    const mapboxToken = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ';
    const markersString = markers.join(',');
    const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markersString}/auto/${width}x${height}@2x?access_token=${mapboxToken}`;
    
    res.json({
      success: true,
      mapUrl: mapboxUrl,
      width: width,
      height: height
    });

  } catch (error) {
    console.error('Mapbox image error:', error);
    res.status(500).json({ error: 'Failed to generate map image' });
  }
});

function getAgentColor(agent) {
  const colors = {
    adventure: '34C759',
    culture: 'FF9500', 
    food: 'FF3B30'
  };
  return colors[agent] || '34C759';
}

// Fallback image service - returns placeholder images
app.get('/api/placeholder-image', (req, res) => {
  const { type = 'location', width = 400, height = 300 } = req.query;
  
  // Use a reliable placeholder service
  const placeholderUrl = `https://picsum.photos/${width}/${height}?random=${Math.floor(Math.random() * 1000)}`;
  
  res.json({
    url: placeholderUrl,
    type: type,
    width: parseInt(width),
    height: parseInt(height)
  });
});

// European Landmarks Database
const europeanLandmarks = [
  // France
  {
    id: 1,
    name: "Eiffel Tower",
    type: "monument",
    lat: 48.8584,
    lng: 2.2945,
    country: "France",
    city: "Paris",
    icon_type: "tower",
    description: "Iconic iron lattice tower and symbol of Paris",
    image_url: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 2,
    name: "Mont Saint-Michel",
    type: "historic",
    lat: 48.6361,
    lng: -1.5115,
    country: "France",
    city: "Normandy",
    icon_type: "castle",
    description: "Medieval abbey perched on a tidal island",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.8,
    visit_duration: 180
  },
  // Italy
  {
    id: 3,
    name: "Colosseum",
    type: "historic",
    lat: 41.8902,
    lng: 12.4922,
    country: "Italy",
    city: "Rome",
    icon_type: "amphitheater",
    description: "Ancient Roman amphitheater and architectural marvel",
    image_url: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500",
    rating: 4.5,
    visit_duration: 150
  },
  {
    id: 4,
    name: "Leaning Tower of Pisa",
    type: "monument",
    lat: 43.7230,
    lng: 10.3966,
    country: "Italy",
    city: "Pisa",
    icon_type: "tower",
    description: "Famous tilted bell tower",
    image_url: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=500",
    rating: 4.3,
    visit_duration: 90
  },
  // Spain
  {
    id: 5,
    name: "Sagrada Familia",
    type: "cultural",
    lat: 41.4036,
    lng: 2.1744,
    country: "Spain",
    city: "Barcelona",
    icon_type: "cathedral",
    description: "Gaudí's unfinished masterpiece basilica",
    image_url: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=500",
    rating: 4.7,
    visit_duration: 120
  },
  {
    id: 6,
    name: "Alhambra",
    type: "historic",
    lat: 37.1760,
    lng: -3.5881,
    country: "Spain",
    city: "Granada",
    icon_type: "palace",
    description: "Moorish palace and fortress complex",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.8,
    visit_duration: 240
  },
  // Germany
  {
    id: 7,
    name: "Neuschwanstein Castle",
    type: "historic",
    lat: 47.5576,
    lng: 10.7498,
    country: "Germany",
    city: "Bavaria",
    icon_type: "castle",
    description: "Fairy-tale castle in the Bavarian Alps",
    image_url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  {
    id: 8,
    name: "Brandenburg Gate",
    type: "monument",
    lat: 52.5163,
    lng: 13.3777,
    country: "Germany",
    city: "Berlin",
    icon_type: "gate",
    description: "Iconic neoclassical monument",
    image_url: "https://images.unsplash.com/photo-1587330979470-3d86d9d4d8be?w=500",
    rating: 4.4,
    visit_duration: 60
  },
  // UK
  {
    id: 9,
    name: "Tower Bridge",
    type: "monument",
    lat: 51.5055,
    lng: -0.0754,
    country: "United Kingdom",
    city: "London",
    icon_type: "bridge",
    description: "Victorian bascule bridge over the Thames",
    image_url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500",
    rating: 4.5,
    visit_duration: 90
  },
  {
    id: 10,
    name: "Stonehenge",
    type: "historic",
    lat: 51.1789,
    lng: -1.8262,
    country: "United Kingdom",
    city: "Salisbury",
    icon_type: "monument",
    description: "Prehistoric stone circle",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.2,
    visit_duration: 120
  },
  // Switzerland
  {
    id: 11,
    name: "Matterhorn",
    type: "natural",
    lat: 45.9763,
    lng: 7.6586,
    country: "Switzerland",
    city: "Zermatt",
    icon_type: "mountain",
    description: "Iconic pyramid-shaped peak in the Alps",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
    rating: 4.9,
    visit_duration: 300
  },
  // Greece
  {
    id: 12,
    name: "Acropolis of Athens",
    type: "historic",
    lat: 37.9715,
    lng: 23.7267,
    country: "Greece",
    city: "Athens",
    icon_type: "temple",
    description: "Ancient citadel with the Parthenon",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  // Portugal
  {
    id: 13,
    name: "Jerónimos Monastery",
    type: "cultural",
    lat: 38.6979,
    lng: -9.2065,
    country: "Portugal",
    city: "Lisbon",
    icon_type: "monastery",
    description: "Manueline architectural masterpiece",
    image_url: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=500",
    rating: 4.5,
    visit_duration: 120
  },
  // Netherlands
  {
    id: 14,
    name: "Kinderdijk Windmills",
    type: "cultural",
    lat: 51.8839,
    lng: 4.6389,
    country: "Netherlands",
    city: "Kinderdijk",
    icon_type: "windmill",
    description: "Historic windmill complex",
    image_url: "https://images.unsplash.com/photo-1580996787472-b4a3c685b1f2?w=500",
    rating: 4.4,
    visit_duration: 150
  },
  // Austria
  {
    id: 15,
    name: "Hallstatt",
    type: "natural",
    lat: 47.5622,
    lng: 13.6493,
    country: "Austria",
    city: "Hallstatt",
    icon_type: "village",
    description: "Picturesque lakeside village",
    image_url: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=500",
    rating: 4.7,
    visit_duration: 240
  },
  // France - Additional landmarks
  {
    id: 16,
    name: "Arc de Triomphe",
    type: "monument",
    lat: 48.8738,
    lng: 2.2950,
    country: "France",
    city: "Paris",
    icon_type: "arch",
    description: "Triumphal arch at the center of Place Charles de Gaulle",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.5,
    visit_duration: 90
  },
  {
    id: 17,
    name: "Notre Dame",
    type: "cultural",
    lat: 48.8530,
    lng: 2.3499,
    country: "France",
    city: "Paris",
    icon_type: "cathedral",
    description: "Medieval Catholic cathedral and masterpiece of Gothic architecture",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 18,
    name: "Palace of Versailles",
    type: "historic",
    lat: 48.8049,
    lng: 2.1204,
    country: "France",
    city: "Versailles",
    icon_type: "palace",
    description: "Opulent royal palace and gardens",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 300
  },
  // UK - Additional landmarks
  {
    id: 19,
    name: "Big Ben",
    type: "monument",
    lat: 51.4994,
    lng: -0.1245,
    country: "United Kingdom",
    city: "London",
    icon_type: "clock",
    description: "Iconic clock tower of the Palace of Westminster",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.5,
    visit_duration: 60
  },
  {
    id: 20,
    name: "Edinburgh Castle",
    type: "historic",
    lat: 55.9486,
    lng: -3.1999,
    country: "United Kingdom",
    city: "Edinburgh",
    icon_type: "castle",
    description: "Historic fortress dominating Edinburgh's skyline",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  // Italy - Additional landmarks
  {
    id: 21,
    name: "Trevi Fountain",
    type: "monument",
    lat: 41.9009,
    lng: 12.4833,
    country: "Italy",
    city: "Rome",
    icon_type: "fountain",
    description: "Baroque fountain and one of Rome's most famous landmarks",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.4,
    visit_duration: 45
  },
  {
    id: 22,
    name: "St. Mark's Basilica",
    type: "cultural",
    lat: 45.4345,
    lng: 12.3403,
    country: "Italy",
    city: "Venice",
    icon_type: "cathedral",
    description: "Byzantine cathedral with stunning mosaics",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 23,
    name: "Duomo di Milano",
    type: "cultural",
    lat: 45.4642,
    lng: 9.1900,
    country: "Italy",
    city: "Milan",
    icon_type: "cathedral",
    description: "Gothic cathedral with elaborate spires and stunning facade",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 150
  },
  {
    id: 24,
    name: "St. Peter's Basilica",
    type: "cultural",
    lat: 41.9022,
    lng: 12.4539,
    country: "Vatican City",
    city: "Vatican City",
    icon_type: "cathedral",
    description: "Renaissance basilica and papal residence",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.8,
    visit_duration: 180
  },
  // Greece - Additional landmarks
  {
    id: 25,
    name: "Parthenon",
    type: "historic",
    lat: 37.9715,
    lng: 23.7267,
    country: "Greece",
    city: "Athens",
    icon_type: "temple",
    description: "Ancient temple dedicated to Athena on the Acropolis",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 120
  },
  // Czech Republic
  {
    id: 26,
    name: "Charles Bridge",
    type: "historic",
    lat: 50.0865,
    lng: 14.4114,
    country: "Czech Republic",
    city: "Prague",
    icon_type: "bridge",
    description: "Historic stone bridge adorned with baroque statues",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 90
  },
  // Germany - Additional landmarks
  {
    id: 27,
    name: "Cologne Cathedral",
    type: "cultural",
    lat: 50.9413,
    lng: 6.9583,
    country: "Germany",
    city: "Cologne",
    icon_type: "cathedral",
    description: "Gothic cathedral and UNESCO World Heritage site",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  // Belgium
  {
    id: 28,
    name: "Atomium",
    type: "monument",
    lat: 50.8950,
    lng: 4.3414,
    country: "Belgium",
    city: "Brussels",
    icon_type: "structure",
    description: "Unique building representing an iron crystal magnified 165 billion times",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.3,
    visit_duration: 120
  },
  // Denmark
  {
    id: 29,
    name: "The Little Mermaid",
    type: "monument",
    lat: 55.6929,
    lng: 12.5993,
    country: "Denmark",
    city: "Copenhagen",
    icon_type: "statue",
    description: "Bronze statue inspired by Hans Christian Andersen's fairy tale",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 3.8,
    visit_duration: 30
  },
  // Norway
  {
    id: 30,
    name: "Geirangerfjord",
    type: "natural",
    lat: 62.1049,
    lng: 7.0062,
    country: "Norway",
    city: "Geiranger",
    icon_type: "fjord",
    description: "UNESCO World Heritage fjord with dramatic waterfalls",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.9,
    visit_duration: 240
  },
  // Ireland
  {
    id: 31,
    name: "Cliffs of Moher",
    type: "natural",
    lat: 52.9715,
    lng: -9.4309,
    country: "Ireland",
    city: "County Clare",
    icon_type: "cliffs",
    description: "Dramatic sea cliffs rising 214 meters above the Atlantic Ocean",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 180
  },
  // Portugal - Additional landmarks
  {
    id: 32,
    name: "Pena Palace",
    type: "historic",
    lat: 38.7877,
    lng: -9.3906,
    country: "Portugal",
    city: "Sintra",
    icon_type: "palace",
    description: "Romantic palace with colorful architecture in Sintra mountains",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  // Austria - Additional landmarks
  {
    id: 33,
    name: "Schönbrunn Palace",
    type: "historic",
    lat: 48.1849,
    lng: 16.3123,
    country: "Austria",
    city: "Vienna",
    icon_type: "palace",
    description: "Imperial palace with baroque architecture and gardens",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 240
  },
  // Russia
  {
    id: 34,
    name: "St. Basil's Cathedral",
    type: "cultural",
    lat: 55.7525,
    lng: 37.6231,
    country: "Russia",
    city: "Moscow",
    icon_type: "cathedral",
    description: "Iconic onion-domed cathedral in Red Square",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 120
  },

  // Additional landmarks with custom images
  {
    id: 16,
    name: "Duomo di Milano",
    type: "cultural",
    lat: 45.4642,
    lng: 9.1900,
    country: "Italy",
    city: "Milan",
    icon_type: "cathedral",
    description: "Gothic cathedral with elaborate spires and stunning facade",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 150
  },
  {
    id: 17,
    name: "Notre-Dame de Paris",
    type: "cultural",
    lat: 48.8530,
    lng: 2.3499,
    country: "France",
    city: "Paris",
    icon_type: "cathedral",
    description: "Medieval Catholic cathedral on the Île de la Cité",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 18,
    name: "Trevi Fountain",
    type: "monument",
    lat: 41.9009,
    lng: 12.4833,
    country: "Italy",
    city: "Rome",
    icon_type: "fountain",
    description: "Baroque fountain and one of Rome's most famous landmarks",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.4,
    visit_duration: 45
  },
  {
    id: 19,
    name: "St. Mark's Basilica",
    type: "cultural",
    lat: 45.4345,
    lng: 12.3398,
    country: "Italy",
    city: "Venice",
    icon_type: "cathedral",
    description: "Byzantine cathedral with stunning mosaics",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 20,
    name: "Charles Bridge",
    type: "monument",
    lat: 50.0865,
    lng: 14.4114,
    country: "Czech Republic",
    city: "Prague",
    icon_type: "bridge",
    description: "Historic stone bridge connecting Prague's Old and New Towns",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.5,
    visit_duration: 60
  },
  {
    id: 21,
    name: "Cologne Cathedral",
    type: "cultural",
    lat: 50.9413,
    lng: 6.9583,
    country: "Germany",
    city: "Cologne",
    icon_type: "cathedral",
    description: "Gothic cathedral and UNESCO World Heritage Site",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 120
  },
  {
    id: 22,
    name: "Edinburgh Castle",
    type: "historic",
    lat: 55.9486,
    lng: -3.1999,
    country: "United Kingdom",
    city: "Edinburgh",
    icon_type: "castle",
    description: "Historic fortress dominating Edinburgh's skyline",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.5,
    visit_duration: 180
  },
  {
    id: 23,
    name: "Big Ben",
    type: "monument",
    lat: 51.4994,
    lng: -0.1245,
    country: "United Kingdom",
    city: "London",
    icon_type: "clock",
    description: "Iconic clock tower at the Palace of Westminster",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.4,
    visit_duration: 60
  },
  {
    id: 24,
    name: "Schönbrunn Palace",
    type: "historic",
    lat: 48.1847,
    lng: 16.3119,
    country: "Austria",
    city: "Vienna",
    icon_type: "palace",
    description: "Imperial summer palace with baroque gardens",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 180
  },
  {
    id: 25,
    name: "Atomium",
    type: "monument",
    lat: 50.8950,
    lng: 4.3415,
    country: "Belgium",
    city: "Brussels",
    icon_type: "structure",
    description: "Iconic building representing an iron crystal magnified 165 billion times",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.2,
    visit_duration: 90
  },
  {
    id: 26,
    name: "Little Mermaid",
    type: "monument",
    lat: 55.6930,
    lng: 12.5993,
    country: "Denmark",
    city: "Copenhagen",
    icon_type: "statue",
    description: "Bronze statue commemorating Hans Christian Andersen's fairy tale",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 3.8,
    visit_duration: 30
  },
  {
    id: 27,
    name: "Pena Palace",
    type: "historic",
    lat: 38.7876,
    lng: -9.3906,
    country: "Portugal",
    city: "Sintra",
    icon_type: "palace",
    description: "Romantic palace with eclectic architectural styles",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 150
  },
  {
    id: 28,
    name: "Cliffs of Moher",
    type: "natural",
    lat: 52.9715,
    lng: -9.4265,
    country: "Ireland",
    city: "County Clare",
    icon_type: "cliff",
    description: "Spectacular sea cliffs rising 214m from the Atlantic Ocean",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.7,
    visit_duration: 120
  },
  {
    id: 29,
    name: "Geirangerfjord",
    type: "natural",
    lat: 62.1049,
    lng: 7.0045,
    country: "Norway",
    city: "Geiranger",
    icon_type: "fjord",
    description: "UNESCO World Heritage fjord with dramatic waterfalls",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.8,
    visit_duration: 240
  },
  {
    id: 30,
    name: "Parthenon",
    type: "historic",
    lat: 37.9715,
    lng: 23.7267,
    country: "Greece",
    city: "Athens",
    icon_type: "temple",
    description: "Ancient temple dedicated to the goddess Athena",
    image_url: "https://images.unsplash.com/photo-1539650116574-75c0c6d73a0e?w=500",
    rating: 4.6,
    visit_duration: 90
  }
];

// Get landmarks within a bounding box (for map region)
app.get('/api/landmarks/region', (req, res) => {
  try {
    const { north, south, east, west, type } = req.query;

    let filtered = europeanLandmarks;

    // Filter by bounding box if provided
    if (north && south && east && west) {
      filtered = filtered.filter(landmark =>
        landmark.lat <= parseFloat(north) &&
        landmark.lat >= parseFloat(south) &&
        landmark.lng >= parseFloat(west) &&
        landmark.lng <= parseFloat(east)
      );
    }

    // Filter by type if provided
    if (type && type !== 'all') {
      filtered = filtered.filter(landmark => landmark.type === type);
    }

    res.json({
      success: true,
      landmarks: filtered,
      count: filtered.length
    });

  } catch (error) {
    console.error('Error fetching landmarks:', error);
    res.status(500).json({ error: 'Failed to fetch landmarks' });
  }
});

// Get all landmark types for filtering
app.get('/api/landmarks/types', (req, res) => {
  try {
    const types = [...new Set(europeanLandmarks.map(landmark => landmark.type))];
    res.json({
      success: true,
      types: types
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch landmark types' });
  }
});

// Recalculate route with added landmark
app.post('/api/route/add-landmark', async (req, res) => {
  try {
    const { originalRoute, landmarkId, insertIndex } = req.body;

    if (!originalRoute || !landmarkId) {
      return res.status(400).json({ error: 'Original route and landmark ID are required' });
    }

    // Find the landmark
    const landmark = europeanLandmarks.find(l => l.id === parseInt(landmarkId));
    if (!landmark) {
      return res.status(404).json({ error: 'Landmark not found' });
    }

    // Create new route with landmark inserted
    const newRoute = {
      ...originalRoute,
      waypoints: [...originalRoute.waypoints]
    };

    // Insert landmark at optimal position (or specified index)
    const insertPosition = insertIndex !== undefined ? insertIndex :
      findOptimalInsertPosition(originalRoute.waypoints, landmark);

    newRoute.waypoints.splice(insertPosition, 0, {
      name: landmark.name,
      lat: landmark.lat,
      lng: landmark.lng,
      type: 'landmark',
      landmark_id: landmark.id,
      visit_duration: landmark.visit_duration,
      description: landmark.description,
      image_url: landmark.image_url
    });

    // Recalculate route using Mapbox (simplified for now)
    const coordinates = newRoute.waypoints.map(wp => [wp.lng, wp.lat]);

    res.json({
      success: true,
      route: newRoute,
      landmark: landmark,
      insertPosition: insertPosition,
      totalDistance: calculateTotalDistance(coordinates),
      estimatedDuration: calculateEstimatedDuration(newRoute.waypoints)
    });

  } catch (error) {
    console.error('Error adding landmark to route:', error);
    res.status(500).json({ error: 'Failed to add landmark to route' });
  }
});

// Helper function to find optimal position to insert landmark
function findOptimalInsertPosition(waypoints, landmark) {
  console.log('🎯 OPTIMIZATION: Finding optimal position for landmark:', landmark.name);
  console.log('🎯 OPTIMIZATION: Current waypoints:', waypoints.map(wp => `${wp.name} (${wp.lat}, ${wp.lng})`));

  if (waypoints.length < 2) {
    console.log('🎯 OPTIMIZATION: Less than 2 waypoints, inserting at end');
    return waypoints.length;
  }

  let minDetour = Infinity;
  let bestPosition = waypoints.length;
  let detourAnalysis = [];

  for (let i = 0; i <= waypoints.length; i++) {
    const prevPoint = i > 0 ? waypoints[i-1] : null;
    const nextPoint = i < waypoints.length ? waypoints[i] : null;

    let detour = 0;
    let description = '';

    if (prevPoint && nextPoint) {
      // Calculate detour: distance(prev->landmark) + distance(landmark->next) - distance(prev->next)
      const originalDistance = calculateDistance(prevPoint, nextPoint);
      const newDistance = calculateDistance(prevPoint, landmark) + calculateDistance(landmark, nextPoint);
      detour = newDistance - originalDistance;
      description = `Between ${prevPoint.name} and ${nextPoint.name}`;
    } else if (prevPoint) {
      detour = calculateDistance(prevPoint, landmark);
      description = `After ${prevPoint.name} (end)`;
    } else if (nextPoint) {
      detour = calculateDistance(landmark, nextPoint);
      description = `Before ${nextPoint.name} (start)`;
    } else {
      description = 'Only waypoint';
    }

    detourAnalysis.push({
      position: i,
      detour: detour.toFixed(2),
      description: description
    });

    if (detour < minDetour) {
      minDetour = detour;
      bestPosition = i;
    }
  }

  console.log('🎯 OPTIMIZATION: Detour analysis:', detourAnalysis);
  console.log('🎯 OPTIMIZATION: Best position:', bestPosition, 'with detour:', minDetour.toFixed(2), 'km');

  return bestPosition;
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to calculate total route distance
function calculateTotalDistance(coordinates) {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = { lat: coordinates[i][1], lng: coordinates[i][0] };
    const point2 = { lat: coordinates[i+1][1], lng: coordinates[i+1][0] };
    total += calculateDistance(point1, point2);
  }
  return Math.round(total);
}

// Helper function to calculate estimated duration
function calculateEstimatedDuration(waypoints) {
  const baseMinutes = waypoints.reduce((total, wp) => {
    return total + (wp.visit_duration || 120); // Default 2 hours per stop
  }, 0);

  const drivingTime = waypoints.length * 60; // Assume 1 hour driving between stops
  return Math.round((baseMinutes + drivingTime) / 60); // Return in hours
}

// ZTL Zone API Endpoints
app.post('/api/ztl/check-route', async (req, res) => {
  try {
    const { route, travelDate } = req.body;

    if (!route || !Array.isArray(route)) {
      return res.status(400).json({
        success: false,
        error: 'Route array is required'
      });
    }

    const ztlWarnings = await ztlService.checkRouteZTL(route, travelDate || new Date());
    const alternatives = ztlService.suggestAlternativeRoute(route, ztlWarnings);

    res.json({
      success: true,
      warnings: ztlWarnings,
      hasRestrictions: ztlWarnings.length > 0,
      alternatives: alternatives,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('ZTL check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check ZTL restrictions'
    });
  }
});

app.get('/api/ztl/city/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { days } = req.query;

    const cityZones = await ztlService.fetchRealTimeStatus(city);

    if (!cityZones) {
      return res.status(404).json({
        success: false,
        error: 'City not found or no ZTL zones'
      });
    }

    const upcomingRestrictions = ztlService.getUpcomingRestrictions(
      city,
      parseInt(days) || 7
    );

    res.json({
      success: true,
      city: cityZones.name,
      zones: cityZones.zones,
      upcoming: upcomingRestrictions,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('ZTL city info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get city ZTL info'
    });
  }
});

app.get('/api/ztl/zones', (req, res) => {
  // Return all available ZTL zones
  const allZones = [];

  for (const [cityKey, cityData] of Object.entries(ztlService.ztlCities)) {
    allZones.push({
      cityKey: cityKey,
      cityName: cityData.name,
      zonesCount: cityData.zones.length,
      zones: cityData.zones.map(z => ({
        name: z.name,
        type: z.type,
        hasSchedule: !!z.schedule,
        fee: z.fee
      }))
    });
  }

  res.json({
    success: true,
    cities: allZones,
    totalCities: allZones.length
  });
});

// =====================================================
// CITY DETAILS API - Rich city information for modals
// =====================================================

/**
 * Get detailed city information (cached from database or generated via Perplexity)
 * POST /api/cities/details
 * Body: { cityName: "Lyon", country: "France" }
 */
app.post('/api/cities/details', async (req, res) => {
  try {
    const { cityName, country } = req.body;

    if (!cityName) {
      return res.status(400).json({
        success: false,
        error: 'City name is required'
      });
    }

    console.log(`📍 City details requested: ${cityName}${country ? `, ${country}` : ''}`);

    // Check if city details exist in database (cache)
    const cachedResult = await db.query(
      'SELECT * FROM city_details WHERE LOWER(city_name) = LOWER($1)',
      [cityName]
    );

    if (cachedResult.rows.length > 0) {
      console.log(`✅ Cache HIT for ${cityName}`);
      return res.json({
        success: true,
        cached: true,
        data: cachedResult.rows[0]
      });
    }

    console.log(`🔍 Cache MISS for ${cityName} - Generating via Perplexity...`);

    // Generate city details using Perplexity API
    const cityDetails = await generateCityDetails(cityName, country);

    // Store in database for future requests
    await db.query(`
      INSERT INTO city_details (
        city_name, country, tagline, main_image_url, rating, recommended_duration,
        why_visit, best_for, highlights, restaurants, accommodations,
        parking_info, parking_difficulty, environmental_zones, best_time_to_visit,
        events_festivals, local_tips, warnings, weather_overview, latitude, longitude
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (city_name) DO UPDATE SET
        country = EXCLUDED.country,
        tagline = EXCLUDED.tagline,
        main_image_url = EXCLUDED.main_image_url,
        rating = EXCLUDED.rating,
        recommended_duration = EXCLUDED.recommended_duration,
        why_visit = EXCLUDED.why_visit,
        best_for = EXCLUDED.best_for,
        highlights = EXCLUDED.highlights,
        restaurants = EXCLUDED.restaurants,
        accommodations = EXCLUDED.accommodations,
        parking_info = EXCLUDED.parking_info,
        parking_difficulty = EXCLUDED.parking_difficulty,
        environmental_zones = EXCLUDED.environmental_zones,
        best_time_to_visit = EXCLUDED.best_time_to_visit,
        events_festivals = EXCLUDED.events_festivals,
        local_tips = EXCLUDED.local_tips,
        warnings = EXCLUDED.warnings,
        weather_overview = EXCLUDED.weather_overview,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = CURRENT_TIMESTAMP
    `, [
      cityName,
      cityDetails.country,
      cityDetails.tagline,
      cityDetails.mainImageUrl,
      cityDetails.rating,
      cityDetails.recommendedDuration,
      cityDetails.whyVisit,
      JSON.stringify(cityDetails.bestFor),
      JSON.stringify(cityDetails.highlights),
      JSON.stringify(cityDetails.restaurants),
      JSON.stringify(cityDetails.accommodations),
      cityDetails.parking?.info,
      cityDetails.parking?.difficulty,
      JSON.stringify(cityDetails.environmentalZones),
      JSON.stringify(cityDetails.bestTimeToVisit),
      JSON.stringify(cityDetails.eventsFestivals),
      JSON.stringify(cityDetails.localTips),
      JSON.stringify(cityDetails.warnings),
      cityDetails.weatherOverview,
      cityDetails.coordinates?.latitude,
      cityDetails.coordinates?.longitude
    ]);

    console.log(`✅ Generated and cached city details for ${cityName}`);

    res.json({
      success: true,
      cached: false,
      data: cityDetails
    });

  } catch (error) {
    console.error('❌ City details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get city details',
      message: error.message
    });
  }
});

/**
 * POST /api/images/scrape
 * Scrape images for restaurants, hotels, and events
 * Request body: { entities: [{ type, name, city, website }] }
 * Returns: { results: [{ name, imageUrl, source }] }
 */
app.post('/api/images/scrape', async (req, res) => {
  try {
    const { entities } = req.body;

    if (!entities || !Array.isArray(entities)) {
      return res.status(400).json({ error: 'entities array is required' });
    }

    console.log(`📸 Scraping images for ${entities.length} entities`);

    const results = [];

    // Process entities with max 5 concurrent scrapes
    const batchSize = 5;
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (entity) => {
          const { type, name, city, website } = entity;

          // Validate entity
          if (!type || !name || !city) {
            console.error(`Invalid entity:`, entity);
            return {
              name,
              imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' ' + city)}`,
              source: 'unsplash'
            };
          }

          try {
            // Check session cache first (in-memory, fastest)
            const sessionCacheKey = `${type}:${name}:${city}`;
            if (sessionImageCache.has(sessionCacheKey)) {
              const cached = sessionImageCache.get(sessionCacheKey);
              console.log(`⚡ Session cache hit for ${name} (${cached.source})`);
              return {
                name,
                imageUrl: cached.imageUrl,
                source: cached.source
              };
            }

            // Check database cache second
            const cacheResult = await db.query(
              `SELECT image_url, source_type, expires_at
               FROM scraped_images
               WHERE entity_type = $1 AND entity_name = $2 AND city = $3
               AND expires_at > NOW()`,
              [type, name, city]
            );

            if (cacheResult.rows.length > 0) {
              const cached = cacheResult.rows[0];
              console.log(`💾 DB cache hit for ${name} (${cached.source_type})`);

              // Store in session cache for next time
              sessionImageCache.set(sessionCacheKey, {
                imageUrl: cached.image_url,
                source: cached.source_type
              });

              return {
                name,
                imageUrl: cached.image_url,
                source: cached.source_type
              };
            }

            // Not in cache - scrape it
            console.log(`🔍 Cache miss for ${name} - scraping...`);

            let imageUrl = null;
            let source = 'unsplash';

            if (website) {
              // Try scraping the website
              const scrapeResult = await scrapeWithFallback(website, name, city);
              imageUrl = scrapeResult.imageUrl;
              source = scrapeResult.source;
            } else {
              // No website - use Unsplash fallback
              imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' ' + city)}`;
              source = 'unsplash';
            }

            // Save to database (90-day cache)
            await db.query(
              `INSERT INTO scraped_images
               (entity_type, entity_name, city, image_url, source_url, source_type, scraped_at, expires_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '90 days')
               ON CONFLICT (entity_type, entity_name, city)
               DO UPDATE SET
                 image_url = $4,
                 source_url = $5,
                 source_type = $6,
                 scraped_at = NOW(),
                 expires_at = NOW() + INTERVAL '90 days'`,
              [type, name, city, imageUrl, website || null, source]
            );

            // Also save to session cache
            sessionImageCache.set(sessionCacheKey, { imageUrl, source });

            console.log(`💾 Saved to DB & session cache: ${name} (${source})`);

            return { name, imageUrl, source };
          } catch (entityError) {
            console.error(`Error scraping ${name}:`, entityError.message);
            // Return Unsplash fallback on error
            return {
              name,
              imageUrl: `https://source.unsplash.com/800x600/?${encodeURIComponent(name + ' ' + city)}`,
              source: 'unsplash'
            };
          }
        })
      );

      results.push(...batchResults);
    }

    // Print success rate summary
    const realImages = scrapingStats.opengraph + scrapingStats.jsonld + scrapingStats.dom;
    const successRate = scrapingStats.total > 0
      ? ((realImages / scrapingStats.total) * 100).toFixed(1)
      : '0.0';

    console.log(`✅ Scraping complete: ${results.length} images processed`);
    console.log(`📊 Success Rate: ${successRate}% (${realImages}/${scrapingStats.total} real images)`);
    console.log(`   Open Graph: ${scrapingStats.opengraph} | JSON-LD: ${scrapingStats.jsonld} | DOM: ${scrapingStats.dom} | Unsplash: ${scrapingStats.unsplash}`);

    res.json({ results });
  } catch (error) {
    console.error('Image scraping error:', error);
    res.status(500).json({
      error: 'Failed to scrape images',
      message: error.message
    });
  }
});

/**
 * POST /api/route/impact
 * Calculate the impact of adding a city to an existing route
 * Returns: distance delta, time delta, optimal position
 */
app.post('/api/route/impact', async (req, res) => {
  try {
    const { cityName, currentRoute } = req.body;

    if (!cityName || !currentRoute || !currentRoute.waypoints || currentRoute.waypoints.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'cityName and currentRoute with at least 2 waypoints are required'
      });
    }

    console.log(`📊 Calculating route impact for adding ${cityName}`);

    // Get city coordinates from database
    const cityResult = await db.query(
      'SELECT latitude, longitude FROM city_details WHERE LOWER(city_name) = LOWER($1)',
      [cityName]
    );

    if (cityResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'City not found - please view city details first to cache coordinates'
      });
    }

    const newCity = {
      name: cityName,
      latitude: cityResult.rows[0].latitude,
      longitude: cityResult.rows[0].longitude
    };

    // Calculate original route distance and time
    const originalDistance = calculateRouteDistance(currentRoute.waypoints);
    const originalTime = estimateRouteTime(originalDistance);

    console.log(`  Original route: ${originalDistance.toFixed(1)} km, ${Math.round(originalTime)} min`);

    // Find optimal position for new city
    const { position, newRoute } = findOptimalPosition(newCity, currentRoute.waypoints);

    // Calculate new route distance and time
    const newDistance = calculateRouteDistance(newRoute);
    const newTime = estimateRouteTime(newDistance);

    console.log(`  New route: ${newDistance.toFixed(1)} km, ${Math.round(newTime)} min`);

    // Calculate deltas
    const distanceDelta = newDistance - originalDistance;
    const timeDelta = newTime - originalTime;

    console.log(`  Delta: +${distanceDelta.toFixed(1)} km, +${Math.round(timeDelta)} min (position: ${position})`);

    res.json({
      success: true,
      impact: {
        distanceDelta: Math.round(distanceDelta),
        timeDelta: Math.round(timeDelta),
        optimalPosition: position,
        original: {
          distance: Math.round(originalDistance),
          time: Math.round(originalTime)
        },
        new: {
          distance: Math.round(newDistance),
          time: Math.round(newTime),
          route: newRoute
        }
      }
    });

  } catch (error) {
    console.error('❌ Route impact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate route impact',
      message: error.message
    });
  }
});

// Helper function to calculate total route distance
function calculateRouteDistance(waypoints) {
  if (!waypoints || waypoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const dist = calculateDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
    totalDistance += dist;
  }

  return totalDistance;
}

// Helper function to estimate route time (using average speed of 80 km/h)
function estimateRouteTime(distanceKm) {
  const averageSpeed = 80; // km/h
  return (distanceKm / averageSpeed) * 60; // return minutes
}

// Helper function to find optimal position for new city in route
function findOptimalPosition(newCity, currentWaypoints) {
  let bestPosition = 1; // default to after origin
  let minDetour = Infinity;

  // Try inserting the city at each position (except at start/end)
  for (let i = 1; i < currentWaypoints.length; i++) {
    // Create route with city inserted at position i
    const testRoute = [
      ...currentWaypoints.slice(0, i),
      newCity,
      ...currentWaypoints.slice(i)
    ];

    // Calculate detour for this position
    const detour = calculateRouteDistance(testRoute) - calculateRouteDistance(currentWaypoints);

    if (detour < minDetour) {
      minDetour = detour;
      bestPosition = i;
    }
  }

  // Create final route with city at optimal position
  const newRoute = [
    ...currentWaypoints.slice(0, bestPosition),
    newCity,
    ...currentWaypoints.slice(bestPosition)
  ];

  return { position: bestPosition, newRoute };
}

/**
 * Generate detailed city information using Perplexity AI
 */
async function generateCityDetails(cityName, country) {
  const fullCityName = country ? `${cityName}, ${country}` : cityName;

  const prompt = `You are a travel expert creating a comprehensive city guide for road trip travelers.

Research the following city using internet search and provide detailed, practical information:

CITY: ${fullCityName}
CONTEXT: This city is a potential stop on a road trip.

Please search the internet for current information and respond with a JSON object containing:

{
  "cityName": "${cityName}",
  "country": "Country name",
  "tagline": "One short compelling tagline (max 60 chars)",
  "whyVisit": "2-3 paragraph description of why this city is worth visiting. Include the vibe, main attractions, and what makes it unique. Be specific and engaging.",
  "bestFor": ["🍷 Foodies", "🏛️ History buffs", "🎨 Art lovers"],
  "recommendedDuration": "2-3 days",
  "rating": 4.7,

  "highlights": [
    {
      "name": "Attraction name",
      "description": "One sentence about this attraction",
      "duration": "2-3 hours",
      "rating": 4.8,
      "type": "landmark"
    }
  ],

  "restaurants": [
    {
      "name": "Restaurant name",
      "cuisine": "Cuisine type",
      "priceRange": "€€",
      "description": "One sentence description",
      "rating": 4.6,
      "specialty": "What they're known for",
      "website": "Official website URL (if available)",
      "googleMapsUrl": "Google Maps search URL for this restaurant",
      "address": "Street address",
      "reviewCount": 250,
      "tripAdvisorRating": 4.5,
      "badges": ["Popular", "Trending", "Local Favorite", "Michelin Guide"] (include 0-2 relevant badges)
    }
  ],

  "accommodations": [
    {
      "areaName": "Neighborhood name",
      "description": "Why this area is good for travelers",
      "priceFrom": "€120/night",
      "bestFor": "First-timers, central location",
      "bookingUrl": "URL to search hotels in this area (e.g., booking.com search link)",
      "hotelExample": "Name of a good hotel in this area",
      "rating": 8.5,
      "reviewCount": 450,
      "badges": ["Popular", "Great Value", "Best Location"] (include 0-2 relevant badges)
    }
  ],

  "parking": {
    "info": "Specific parking recommendations, costs, best garages",
    "difficulty": "Moderate"
  },

  "environmentalZones": {
    "hasRestrictions": true,
    "type": "ZFE, ZTL, LEZ, or other",
    "description": "Detailed explanation of restrictions, which vehicles affected, how to get permits, fines",
    "advice": "Practical advice for road trippers"
  },

  "bestTimeToVisit": {
    "ideal": "April to June",
    "reasoning": "Why this is the best time",
    "avoid": "Times to avoid"
  },

  "eventsFestivals": [
    {
      "name": "Festival name",
      "month": "Month",
      "description": "Brief description",
      "website": "Official event website URL",
      "ticketUrl": "URL to purchase tickets (if applicable)",
      "dates": "Specific dates (e.g., 'June 15-20')",
      "popularity": "High",
      "badges": ["Trending", "Sold Out Often", "Annual Tradition"] (include 0-2 relevant badges)
    }
  ],

  "localTips": [
    "Practical tip 1",
    "Practical tip 2"
  ],

  "warnings": [
    "Important warning 1",
    "Important warning 2"
  ],

  "weatherOverview": "Brief 2-3 sentence overview of typical weather by season.",

  "coordinates": {
    "latitude": 45.7640,
    "longitude": 4.8357
  }
}

IMPORTANT INSTRUCTIONS:
1. Search the internet for CURRENT information
2. Be SPECIFIC with names, prices, locations - no generic advice
3. Focus on PRACTICAL information for road trippers
4. Environmental zones (ZTL/ZFE/LEZ) are CRITICAL - research thoroughly
5. Include actual restaurant/hotel names when possible
6. Ratings should be realistic (most cities 4.5-4.8 range)
7. Return ONLY valid JSON, no markdown formatting
8. If information isn't available, use null rather than making it up
9. Verify coordinates are accurate
10. Include 6-8 highlights, 4-5 restaurants, 3-4 accommodations
11. Price ranges: €, €€, €€€, €€€€
12. bestFor should have 2-4 traveler types with emojis

WEBSITE URLS (CRITICAL):
13. For restaurants: Find actual official website URLs (we'll scrape images from these)
14. For accommodations: Find booking.com search URLs for each neighborhood
15. For events: Find official event website URLs and ticket purchase links
16. googleMapsUrl format: https://www.google.com/maps/search/?api=1&query={restaurant_name}+{city}
17. bookingUrl format: https://www.booking.com/searchresults.html?ss={neighborhood}+{city}
18. Website URLs must be real, working links - verify they exist
19. If you cannot find a real website URL, use null - DO NOT make up URLs

SOCIAL PROOF (IMPORTANT):
20. For restaurants: Include Google/TripAdvisor ratings, review counts, and relevant badges
21. For accommodations: Include Booking.com ratings (out of 10), review counts, and badges
22. For events: Include popularity level and relevant badges (Trending, Sold Out Often, etc.)
23. Badges should be realistic and based on actual popularity/recognition
24. Review counts should be realistic for the city size
25. Only include badges that truly apply - don't over-badge everything

Return the JSON object now:`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000, // Increased for detailed response
      temperature: 0.2 // Lower for more factual responses
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 25000 // 25 second timeout (Heroku has 30s request limit)
    });

    const content = response.data.choices[0].message.content;

    // Try to parse JSON from response (handle markdown code blocks)
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Perplexity response');
    }

    const cityData = JSON.parse(jsonMatch[0]);

    // Fetch city image from Wikipedia/Unsplash
    console.log(`🖼️  Fetching image for ${cityName}...`);
    const mainImageUrl = await getCityImages(cityName, cityData.country);

    // Convert to database-friendly format
    return {
      cityName: cityData.cityName || cityName,
      country: cityData.country,
      tagline: cityData.tagline,
      mainImageUrl: mainImageUrl,
      rating: cityData.rating,
      recommendedDuration: cityData.recommendedDuration,
      whyVisit: cityData.whyVisit,
      bestFor: cityData.bestFor || [],
      highlights: cityData.highlights || [],
      restaurants: cityData.restaurants || [],
      accommodations: cityData.accommodations || [],
      parking: cityData.parking || null,
      environmentalZones: cityData.environmentalZones || null,
      bestTimeToVisit: cityData.bestTimeToVisit || null,
      eventsFestivals: cityData.eventsFestivals || [],
      localTips: cityData.localTips || [],
      warnings: cityData.warnings || [],
      weatherOverview: cityData.weatherOverview,
      coordinates: cityData.coordinates || null
    };

  } catch (error) {
    console.error('Perplexity API error:', error.message);
    throw new Error(`Failed to generate city details: ${error.message}`);
  }
}

// =====================================================
// CATCH-ALL ROUTE - Serve React app for client-side routing
// =====================================================
// This must be AFTER all API routes but BEFORE server startup
// Handles React Router routes like /shared/:token, /my-routes, etc.
app.get('*', (req, res) => {
  // Don't intercept API routes or static files
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return res.status(404).send('Not found');
  }

  // Serve the React app's index.html for all other routes
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================================================
// DATABASE MIGRATION - Run on startup
// =====================================================
async function runDatabaseMigrations() {
  try {
    console.log('🔄 Checking database migrations...');

    // Check if share_token column exists
    const columnCheck = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'routes' AND column_name = 'share_token'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('📦 Running migration: Adding route sharing columns...');

      // Add sharing columns
      await db.query(`
        ALTER TABLE routes ADD COLUMN IF NOT EXISTS share_token VARCHAR(12) UNIQUE;
        ALTER TABLE routes ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
        ALTER TABLE routes ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;
      `);

      // Create index for share tokens
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_routes_share_token
        ON routes(share_token)
        WHERE share_token IS NOT NULL;
      `);

      // Create index for public routes
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_routes_is_public
        ON routes(is_public)
        WHERE is_public = true;
      `);

      console.log('✅ Migration completed: Route sharing columns added');
    } else {
      console.log('✅ Database schema is up to date');
    }

    // Check if scraped_images table exists
    const scrapedImagesCheck = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'scraped_images'
    `);

    if (scrapedImagesCheck.rows.length === 0) {
      console.log('📦 Running migration: Creating scraped_images table...');

      await db.query(`
        CREATE TABLE scraped_images (
          id SERIAL PRIMARY KEY,
          entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('restaurant', 'hotel', 'event')),
          entity_name VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          image_url TEXT,
          source_url TEXT,
          source_type VARCHAR(50) CHECK (source_type IN ('opengraph', 'jsonld', 'dom', 'unsplash', 'failed')),
          scraped_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '90 days',
          CONSTRAINT unique_entity UNIQUE(entity_type, entity_name, city)
        );

        CREATE INDEX idx_scraped_images_lookup
        ON scraped_images(entity_type, entity_name, city);

        CREATE INDEX idx_scraped_images_expiry
        ON scraped_images(expires_at);
      `);

      console.log('✅ Migration completed: scraped_images table created');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't crash the server if migration fails
    console.warn('⚠️  Server will continue, but sharing features may not work');
  }
}

// Run migrations and then start server
runDatabaseMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`🚗 Road Trip Planner MVP running on port ${PORT}`);
    console.log(`📍 Loaded ${europeanLandmarks.length} European landmarks`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});