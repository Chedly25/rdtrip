const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');
const ZTLService = require('./services/ztl-service');
const cheerio = require('cheerio');
const ItineraryAgentOrchestrator = require('./server/agents/ItineraryAgentOrchestrator');
const RouteDiscoveryAgentV2 = require('./server/agents/RouteDiscoveryAgentV2');
const RoutePlanningAgent = require('./server/agents/RoutePlanningAgent');
const UnifiedRouteAgent = require('./server/agents/UnifiedRouteAgent');
const GooglePlacesService = require('./server/services/googlePlacesService');
const ReceiptScannerService = require('./server/services/ReceiptScannerService');
const CurrencyService = require('./server/services/CurrencyService');
const { authenticate, optionalAuth } = require('./middleware/auth');
const authMiddleware = authenticate; // Alias for compatibility
const { generateToken } = require('./utils/jwt');

const app = express();
const PORT = process.env.PORT || 5000;
const ztlService = new ZTLService();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('amazonaws.com') ? { rejectUnauthorized: false } : false
});

// In-memory job storage (in production, use Redis or a database)
const routeJobs = new Map();
const cityDetailsJobs = new Map();
const itineraryJobs = new Map(); // For itinerary generation jobs

// Job cleanup: Remove jobs older than 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  for (const [jobId, job] of cityDetailsJobs.entries()) {
    if (job.createdAt < fiveMinutesAgo) {
      console.log(`🧹 Cleaning up old city job: ${jobId}`);
      cityDetailsJobs.delete(jobId);
    }
  }

  for (const [jobId, job] of itineraryJobs.entries()) {
    if (job.createdAt < fiveMinutesAgo) {
      console.log(`🧹 Cleaning up old itinerary job: ${jobId}`);
      itineraryJobs.delete(jobId);
    }
  }
}, 60000); // Clean every minute

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
        'User-Agent': 'Mozilla/5.0 (compatible; Waycraft/1.0; +https://waycraft.com)'
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

// Auth utilities
const db = require('./db/connection');
const { hashPassword, comparePassword, validatePasswordStrength } = require('./utils/password');
// Note: generateToken, authenticate, and optionalAuth are imported at the top of the file

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

    // Link any pending invitations for this email
    try {
      const pendingInvitations = await db.query(
        `UPDATE route_collaborators
         SET user_id = $1, invited_email = NULL
         WHERE invited_email = $2 AND user_id IS NULL
         RETURNING route_id, role`,
        [user.id, email.toLowerCase()]
      );

      if (pendingInvitations.rows.length > 0) {
        console.log(`🔗 Linked ${pendingInvitations.rows.length} pending invitation(s) for ${user.email}`);
      }
    } catch (linkError) {
      // Don't fail registration if linking fails
      console.error('Failed to link pending invitations:', linkError);
    }

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
    const { name, origin, destination, stops, budget, selectedAgents, routeData, totalNights, tripPace } = req.body;

    // Validate required fields (accept either old or new format)
    if (!origin || !destination || !budget || !selectedAgents || !routeData) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['origin', 'destination', 'budget', 'selectedAgents', 'routeData']
      });
    }

    // Helper to extract city name from string or object
    const getCityName = (city) => {
      if (typeof city === 'string') return city;
      if (city && typeof city === 'object') {
        return city.name || city.city || JSON.stringify(city);
      }
      return String(city);
    };

    // Extract city names for storage (keep full objects in routeData)
    const originName = getCityName(origin);
    const destinationName = getCityName(destination);

    // Extract totalNights, tripPace, and stops (from request or routeData)
    let finalTotalNights = totalNights;
    let finalTripPace = tripPace;
    let finalStops = stops;

    if (!finalTotalNights && routeData.totalNights) {
      finalTotalNights = routeData.totalNights;
    }
    // Compute totalNights from cities if still not set
    if (!finalTotalNights && routeData.cities && Array.isArray(routeData.cities)) {
      finalTotalNights = routeData.cities.reduce((sum, city) => sum + (city.nights || 0), 0);
    }
    if (!finalTripPace && routeData.tripPace) {
      finalTripPace = routeData.tripPace;
    }
    // Compute stops from cities array if not provided (exclude origin and destination)
    if (finalStops === undefined || finalStops === null) {
      if (routeData.cities && Array.isArray(routeData.cities)) {
        // Cities array includes origin and destination, so subtract 2 for waypoints only
        finalStops = Math.max(0, routeData.cities.length - 2);
      } else {
        finalStops = 0; // Default to 0 stops if no cities data
      }
    }

    // Ensure selectedAgents is an array for PostgreSQL
    let agentsArray = selectedAgents;
    if (typeof selectedAgents === 'string') {
      agentsArray = [selectedAgents];
    } else if (!Array.isArray(selectedAgents)) {
      agentsArray = ['best-overall'];
    }

    // Save route to database (with new columns)
    const result = await db.query(
      `INSERT INTO routes (user_id, name, origin, destination, stops, budget, selected_agents, route_data, total_nights, trip_pace)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, user_id, name, origin, destination, stops, budget, selected_agents, route_data, total_nights, trip_pace, is_favorite, is_public, created_at, updated_at`,
      [
        req.user.id,
        name || `${originName} to ${destinationName}`,
        originName,
        destinationName,
        finalStops,
        budget,
        agentsArray,
        JSON.stringify(routeData),
        finalTotalNights,
        finalTripPace
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
        totalNights: savedRoute.total_nights,
        tripPace: savedRoute.trip_pace,
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

// PUT /api/routes/:id/landmarks - Update landmarks for a route
app.put('/api/routes/:id/landmarks', authenticate, async (req, res) => {
  try {
    const { landmarks } = req.body;

    if (!Array.isArray(landmarks)) {
      return res.status(400).json({ error: 'Landmarks must be an array' });
    }

    // Get current route_data
    const currentRoute = await db.query(
      `SELECT route_data FROM routes WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (currentRoute.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Merge landmarks into route_data
    const routeData = currentRoute.rows[0].route_data || {};
    routeData.landmarks = landmarks;

    // Update route with new landmarks
    const result = await db.query(
      `UPDATE routes
       SET route_data = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING id, route_data`,
      [JSON.stringify(routeData), req.params.id, req.user.id]
    );

    console.log(`✅ Updated landmarks for route ${req.params.id}: ${landmarks.length} landmarks`);

    res.json({
      message: 'Landmarks updated successfully',
      landmarks: result.rows[0].route_data.landmarks
    });
  } catch (error) {
    console.error('Error updating landmarks:', error);
    res.status(500).json({ error: 'Failed to update landmarks' });
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

// GET /api/stats - Get public stats for landing page (no auth required)
app.get('/api/stats', async (req, res) => {
  try {
    // Get total routes ever created
    const totalResult = await db.query('SELECT COUNT(*) as count FROM routes');
    const totalRoutes = parseInt(totalResult.rows[0].count);

    // Get routes created today
    const todayResult = await db.query(
      `SELECT COUNT(*) as count FROM routes
       WHERE created_at >= CURRENT_DATE`
    );
    const routesToday = parseInt(todayResult.rows[0].count);

    // Get routes created this week
    const weekResult = await db.query(
      `SELECT COUNT(*) as count FROM routes
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );
    const routesThisWeek = parseInt(weekResult.rows[0].count);

    // Get recent routes (last 10) with destination and time, anonymized
    const recentResult = await db.query(
      `SELECT destination, created_at, selected_agents
       FROM routes
       ORDER BY created_at DESC
       LIMIT 10`
    );

    const recentRoutes = recentResult.rows.map(row => ({
      destination: row.destination,
      createdAt: row.created_at,
      agents: row.selected_agents
    }));

    res.json({
      totalRoutes,
      routesToday,
      routesThisWeek,
      recentRoutes
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Return zeros if database query fails (better than error for landing page)
    res.json({
      totalRoutes: 0,
      routesToday: 0,
      routesThisWeek: 0,
      recentRoutes: []
    });
  }
});

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
    // BACKWARD COMPATIBILITY: Convert old format to new format
    let { origin, destination, stops, agents: selectedAgents = ['adventure', 'culture', 'food'], budget = 'budget', nightsOnRoad, nightsAtDestination, totalNights, tripPace } = req.body;

    // If old format (stops, nightsOnRoad, nightsAtDestination) is used, convert to new format
    if (stops !== undefined && !totalNights) {
      console.log('⚠️  Old format detected - converting to nights-based format');

      // Calculate total nights from old format
      if (nightsOnRoad !== undefined && nightsAtDestination !== undefined) {
        totalNights = nightsOnRoad + nightsAtDestination;
      } else {
        // Fallback: estimate 2 nights per stop
        totalNights = stops * 2;
      }

      // Default to balanced pace
      tripPace = 'balanced';

      console.log(`   Converted: ${stops} stops → ${totalNights} nights (${tripPace} pace)`);
    }

    // Use new format if provided, otherwise keep old logic
    if (totalNights && tripPace) {
      // Redirect to new nights-based endpoint
      console.log('🔀 Redirecting to nights-based route generation');

      const response = await fetch(`${req.protocol}://${req.get('host')}/api/generate-route-nights-based`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          totalNights,
          tripPace,
          agents: selectedAgents,
          budget
        })
      });

      const result = await response.json();
      return res.json(result);
    }

    // OLD LOGIC: Continue with stops-based generation for pure legacy calls
    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    if (!origin) {
      return res.status(400).json({ error: 'Origin is required' });
    }

    stops = stops || 3;

    // Create unique job ID
    const jobId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize job status
    const job = {
      id: jobId,
      status: 'processing',
      origin,
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
    // Use agentic route discovery if flag is enabled
    const useAgenticRoute = process.env.USE_AGENTIC_ROUTES === 'true';
    const processFunction = useAgenticRoute ? processRouteJobAgentic : processRouteJob;

    processFunction(jobId, origin, destination, stops, selectedAgents, budget).catch(error => {
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

// NEW: Nights-based route generation (Phase 1 of stops removal)
// Start nights-based route generation job (returns immediately with job ID)
app.post('/api/generate-route-nights-based', async (req, res) => {
  try {
    const {
      origin,
      destination,
      totalNights,
      tripPace = 'balanced',
      agents: selectedAgents = ['adventure', 'culture', 'food'],
      budget = 'mid'
    } = req.body;

    // ============= ENHANCED VALIDATION =============

    // Validate destination exists
    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Validate origin exists
    if (!origin) {
      return res.status(400).json({ error: 'Origin is required' });
    }

    // NEW: Support both string (backward compatibility) and object format
    let originData = origin;
    let destinationData = destination;

    // If origin is a string, geocode it (backward compatibility)
    if (typeof origin === 'string') {
      console.log(`⚠️ Origin is string format (legacy), geocoding: ${origin}`);
      const googlePlacesService = new GooglePlacesService(process.env.GOOGLE_PLACES_API_KEY);
      const result = await googlePlacesService.textSearch(origin);
      if (result && result.length > 0) {
        const place = result[0];
        const countryComponent = place.address_components?.find(c => c.types.includes('country'));
        originData = {
          name: place.name,
          country: countryComponent?.long_name || 'Unknown',
          coordinates: [place.geometry.location.lat, place.geometry.location.lng]
        };
      } else {
        return res.status(400).json({ error: `Could not geocode origin: ${origin}` });
      }
    }

    // If destination is a string, geocode it (backward compatibility)
    if (typeof destination === 'string') {
      console.log(`⚠️ Destination is string format (legacy), geocoding: ${destination}`);
      const googlePlacesService = new GooglePlacesService(process.env.GOOGLE_PLACES_API_KEY);
      const result = await googlePlacesService.textSearch(destination);
      if (result && result.length > 0) {
        const place = result[0];
        const countryComponent = place.address_components?.find(c => c.types.includes('country'));
        destinationData = {
          name: place.name,
          country: countryComponent?.long_name || 'Unknown',
          coordinates: [place.geometry.location.lat, place.geometry.location.lng]
        };
      } else {
        return res.status(400).json({ error: `Could not geocode destination: ${destination}` });
      }
    }

    // NEW: Validate origin has required fields
    if (!originData.name || !originData.coordinates || !originData.country) {
      return res.status(400).json({
        error: 'Origin must include name, coordinates, and country'
      });
    }

    // NEW: Validate destination has required fields
    if (!destinationData.name || !destinationData.coordinates || !destinationData.country) {
      return res.status(400).json({
        error: 'Destination must include name, coordinates, and country'
      });
    }

    // NEW: Validate coordinates format
    if (!Array.isArray(originData.coordinates) || originData.coordinates.length !== 2 ||
        typeof originData.coordinates[0] !== 'number' || typeof originData.coordinates[1] !== 'number') {
      return res.status(400).json({
        error: 'Origin coordinates must be [latitude, longitude]'
      });
    }

    if (!Array.isArray(destinationData.coordinates) || destinationData.coordinates.length !== 2 ||
        typeof destinationData.coordinates[0] !== 'number' || typeof destinationData.coordinates[1] !== 'number') {
      return res.status(400).json({
        error: 'Destination coordinates must be [latitude, longitude]'
      });
    }

    // NEW: Calculate distance between origin and destination
    const distance = calculateDistance(
      { lat: originData.coordinates[0], lng: originData.coordinates[1] },
      { lat: destinationData.coordinates[0], lng: destinationData.coordinates[1] }
    );

    console.log(`📏 Distance: ${distance.toFixed(0)} km`);

    // NEW: Validate minimum distance (50km)
    if (distance < 50) {
      return res.status(400).json({
        error: `Destination too close to origin (${distance.toFixed(0)} km). Minimum distance is 50 km for a road trip.`,
        distance: Math.round(distance)
      });
    }

    // NEW: Validate maximum distance (3000km)
    if (distance > 3000) {
      return res.status(400).json({
        error: `Destination too far from origin (${distance.toFixed(0)} km). Maximum distance is 3000 km. Consider flying or splitting into multiple trips.`,
        distance: Math.round(distance)
      });
    }

    // Validate nights
    if (!totalNights || totalNights < 2 || totalNights > 30) {
      return res.status(400).json({ error: 'Total nights must be between 2 and 30' });
    }

    // Validate trip pace
    if (!['leisurely', 'balanced', 'fast-paced'].includes(tripPace)) {
      return res.status(400).json({ error: 'Trip pace must be leisurely, balanced, or fast-paced' });
    }

    console.log(`\n🗺️  === NEW NIGHTS-BASED ROUTE GENERATION ===`);
    console.log(`   Origin: ${originData.name}, ${originData.country} (${originData.coordinates[0].toFixed(4)}, ${originData.coordinates[1].toFixed(4)})`);
    console.log(`   Destination: ${destinationData.name}, ${destinationData.country} (${destinationData.coordinates[0].toFixed(4)}, ${destinationData.coordinates[1].toFixed(4)})`);
    console.log(`   Distance: ${distance.toFixed(0)} km`);
    console.log(`   Total nights: ${totalNights}`);
    console.log(`   Trip pace: ${tripPace}`);
    console.log(`   Budget: ${budget}`);
    console.log(`   Agents: ${selectedAgents.join(', ')}`);

    // Create unique job ID
    const jobId = `route_nights_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize job status
    const job = {
      id: jobId,
      status: 'processing',
      origin: originData,  // Store full object
      destination: destinationData,  // Store full object
      totalNights,
      tripPace,
      budget,
      selectedAgents,
      progress: {
        phase: 'route_planning',
        message: 'Planning optimal route and night allocations...',
        total: selectedAgents.length + 1, // +1 for route planning phase
        completed: 0,
        currentAgent: null,
        percentComplete: 0,
        startTime: Date.now(),
        estimatedTimeRemaining: (selectedAgents.length + 1) * 20000, // 20s per phase estimate
        currentAgentStartTime: null
      },
      agentResults: [],
      routePlan: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    routeJobs.set(jobId, job);

    // Return immediately with job ID
    res.json({
      jobId,
      status: 'processing',
      message: 'Nights-based route generation started. Poll /api/route-status/:jobId for progress.'
    });

    // Start processing in background (don't await)
    processRouteJobNightsBased(jobId, originData, destinationData, totalNights, tripPace, selectedAgents, budget).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      const failedJob = routeJobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = error.message;
        failedJob.updatedAt = new Date();
      }
    });

  } catch (error) {
    console.error('Error starting nights-based route generation:', error);
    res.status(500).json({ error: 'Failed to start route generation', details: error.message });
  }
});

// Geocode a city name to coordinates using Google Places API
app.post('/api/geocode', async (req, res) => {
  try {
    const { cityName } = req.body;

    if (!cityName) {
      return res.status(400).json({ error: 'City name is required' });
    }

    console.log(`🌍 Geocoding request for: ${cityName}`);

    // Use Google Places API for geocoding
    const googlePlacesService = new GooglePlacesService(process.env.GOOGLE_PLACES_API_KEY);
    const result = await googlePlacesService.textSearch(cityName);

    if (result && result.length > 0) {
      const place = result[0];
      const coordinates = {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      };

      console.log(`✅ Geocoded ${cityName} to:`, coordinates);
      return res.json({ coordinates });
    }

    // Fallback coordinates (center of Europe)
    console.warn(`⚠️ Could not geocode ${cityName}, using fallback`);
    res.json({ coordinates: { lat: 48.8566, lng: 2.3522 } });
  } catch (error) {
    console.error('Geocoding error:', error);
    // Return fallback coordinates on error
    res.json({ coordinates: { lat: 48.8566, lng: 2.3522 } });
  }
});

// =====================================================
// UNIFIED ROUTE GENERATION (New preference-based system)
// =====================================================

// Start unified route generation job (returns immediately with job ID)
app.post('/api/generate-unified-route', async (req, res) => {
  try {
    const {
      origin,
      destination,
      totalNights,
      tripPace = 'balanced',
      budget = 'mid',
      preferences,
      personalization  // User's trip story, occasion, interests, etc.
    } = req.body;

    // ============= VALIDATION =============

    // Validate destination exists
    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Validate origin exists
    if (!origin) {
      return res.status(400).json({ error: 'Origin is required' });
    }

    // Validate origin has required fields
    if (!origin.name || !origin.coordinates || !origin.country) {
      return res.status(400).json({
        error: 'Origin must include name, coordinates, and country'
      });
    }

    // Validate destination has required fields
    if (!destination.name || !destination.coordinates || !destination.country) {
      return res.status(400).json({
        error: 'Destination must include name, coordinates, and country'
      });
    }

    // Validate coordinates format
    if (!Array.isArray(origin.coordinates) || origin.coordinates.length !== 2 ||
        typeof origin.coordinates[0] !== 'number' || typeof origin.coordinates[1] !== 'number') {
      return res.status(400).json({
        error: 'Origin coordinates must be [latitude, longitude]'
      });
    }

    if (!Array.isArray(destination.coordinates) || destination.coordinates.length !== 2 ||
        typeof destination.coordinates[0] !== 'number' || typeof destination.coordinates[1] !== 'number') {
      return res.status(400).json({
        error: 'Destination coordinates must be [latitude, longitude]'
      });
    }

    // Calculate distance
    const distance = calculateDistance(
      { lat: origin.coordinates[0], lng: origin.coordinates[1] },
      { lat: destination.coordinates[0], lng: destination.coordinates[1] }
    );

    // Validate distance constraints
    if (distance < 50) {
      return res.status(400).json({
        error: `Destination too close to origin (${distance.toFixed(0)} km). Minimum distance is 50 km.`,
        distance: Math.round(distance)
      });
    }

    if (distance > 3000) {
      return res.status(400).json({
        error: `Destination too far from origin (${distance.toFixed(0)} km). Maximum distance is 3000 km.`,
        distance: Math.round(distance)
      });
    }

    // Validate nights
    if (!totalNights || totalNights < 2 || totalNights > 30) {
      return res.status(400).json({ error: 'Total nights must be between 2 and 30' });
    }

    // Validate trip pace
    if (!['leisurely', 'balanced', 'fast-paced'].includes(tripPace)) {
      return res.status(400).json({ error: 'Trip pace must be leisurely, balanced, or fast-paced' });
    }

    // Validate preferences
    if (!preferences || !preferences.companions || !preferences.interests || preferences.interests.length === 0) {
      return res.status(400).json({ error: 'Preferences with companions and at least one interest are required' });
    }

    console.log(`\n🗺️  === UNIFIED ROUTE GENERATION ===`);
    console.log(`   Origin: ${origin.name}, ${origin.country}`);
    console.log(`   Destination: ${destination.name}, ${destination.country}`);
    console.log(`   Distance: ${distance.toFixed(0)} km`);
    console.log(`   Total nights: ${totalNights}`);
    console.log(`   Trip pace: ${tripPace}`);
    console.log(`   Budget: ${budget}`);
    console.log(`   Companions: ${preferences.companions}`);
    console.log(`   Interests: ${preferences.interests.map(i => i.id).join(', ')}`);
    if (personalization) {
      console.log(`   Personalization: tripStory=${!!personalization.tripStory}, occasion=${personalization.occasion || 'none'}`);
    }

    // Create unique job ID
    const jobId = `unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize job status
    const job = {
      id: jobId,
      status: 'processing',
      origin,
      destination,
      totalNights,
      tripPace,
      budget,
      preferences,
      personalization,  // Include user's trip story, occasion, etc.
      progress: {
        phase: 'research',
        message: 'Analyzing route corridor...',
        total: 6, // 6 phases
        completed: 0,
        currentAgent: null,
        percentComplete: 0,
        startTime: Date.now(),
        estimatedTimeRemaining: 60000 // 60s estimate
      },
      route: null,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    routeJobs.set(jobId, job);

    // Return immediately with job ID
    res.json({
      jobId,
      status: 'processing',
      message: 'Unified route generation started. Poll /api/route-status/:jobId for progress.'
    });

    // Start processing in background (don't await)
    processUnifiedRouteJob(jobId, origin, destination, totalNights, tripPace, budget, preferences, personalization).catch(error => {
      console.error(`Job ${jobId} failed:`, error);
      const failedJob = routeJobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.error = error.message;
        failedJob.updatedAt = new Date();
      }
    });

  } catch (error) {
    console.error('Error starting unified route generation:', error);
    res.status(500).json({ error: 'Failed to start route generation', details: error.message });
  }
});

// POST /api/geocode/autocomplete - Get city suggestions for autocomplete
// Returns European cities only with full details (name, country, coordinates)
app.post('/api/geocode/autocomplete', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.length < 2) {
      return res.json({ cities: [] });
    }

    console.log(`🔍 Autocomplete search for: ${query}`);

    // Use Google Places Autocomplete API
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

    // European country codes for filtering (Google API limits to 5 countries in components parameter)
    const europeanCountryCodes = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB'];

    // Don't use components parameter (Google limits to 5), filter results server-side instead
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${googleApiKey}`;

    const response = await axios.get(autocompleteUrl);

    if (!response.data || !response.data.predictions) {
      console.log(`⚠️ No predictions for "${query}"`);
      return res.json({ cities: [] });
    }

    console.log(`📍 Found ${response.data.predictions.length} predictions`);

    // Get place details for each prediction to get coordinates
    const cityPromises = response.data.predictions.slice(0, 5).map(async (prediction) => {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=name,geometry,address_components&key=${googleApiKey}`;
        const detailsResponse = await axios.get(detailsUrl);

        if (!detailsResponse.data || !detailsResponse.data.result) {
          return null;
        }

        const place = detailsResponse.data.result;

        // Extract country from address components
        const countryComponent = place.address_components?.find(
          (component) => component.types.includes('country')
        );
        const country = countryComponent?.long_name || 'Unknown';
        const countryCode = countryComponent?.short_name || '';

        return {
          name: place.name,
          country: country,
          countryCode: countryCode,
          coordinates: [
            place.geometry.location.lat,
            place.geometry.location.lng
          ],
          displayName: `${place.name}, ${country}`
        };
      } catch (error) {
        console.error(`Failed to get details for ${prediction.description}:`, error.message);
        return null;
      }
    });

    // Wait for all city details to resolve
    const cities = await Promise.all(cityPromises);

    // Filter out nulls and non-European cities
    const validCities = cities.filter(city => {
      if (city === null) return false;
      // Only include European cities
      return europeanCountryCodes.includes(city.countryCode);
    });

    console.log(`✅ Returning ${validCities.length} European cities for "${query}"`);
    res.json({ cities: validCities });

  } catch (error) {
    console.error('Autocomplete error:', error);
    res.json({ cities: [] });
  }
});

// POST /api/places/search - Universal search for cities and landmarks
// Supports both city autocomplete and landmark search with photos
app.post('/api/places/search', async (req, res) => {
  try {
    const { query, type = 'city' } = req.body; // type: 'city' or 'landmark'

    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    console.log(`🔍 ${type} search for: ${query}`);

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!googleApiKey) {
      console.error('❌ GOOGLE_PLACES_API_KEY not configured');
      return res.json({ results: [] });
    }

    // Build autocomplete URL based on search type
    let autocompleteUrl;
    if (type === 'landmark') {
      // For landmarks, use establishment type (covers tourist attractions, museums, monuments, etc.)
      autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=establishment&key=${googleApiKey}`;
    } else {
      // For cities, use (cities) type
      autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${googleApiKey}`;
    }

    const response = await axios.get(autocompleteUrl);

    if (!response.data || !response.data.predictions || response.data.predictions.length === 0) {
      console.log(`⚠️ No ${type}s found for "${query}"`);
      return res.json({ results: [] });
    }

    console.log(`📍 Found ${response.data.predictions.length} predictions`);

    // Get place details for each prediction (top 5 results)
    const placePromises = response.data.predictions.slice(0, 5).map(async (prediction) => {
      try {
        // Request fields including photos
        const fields = 'name,geometry,address_components,photos,types,place_id,formatted_address';
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=${fields}&key=${googleApiKey}`;
        const detailsResponse = await axios.get(detailsUrl);

        if (!detailsResponse.data || !detailsResponse.data.result) {
          return null;
        }

        const place = detailsResponse.data.result;

        // Extract country from address components
        const countryComponent = place.address_components?.find(
          (component) => component.types.includes('country')
        );
        const country = countryComponent?.long_name || '';
        const countryCode = countryComponent?.short_name || '';

        // Get photo URL if available
        let photoUrl = null;
        if (place.photos && place.photos.length > 0) {
          const photoReference = place.photos[0].photo_reference;
          photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoReference}&key=${googleApiKey}`;
        }

        return {
          name: place.name,
          country: country,
          countryCode: countryCode,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          displayName: type === 'landmark'
            ? place.name
            : `${place.name}, ${country}`,
          photoUrl: photoUrl,
          placeId: place.place_id,
          types: place.types,
          formattedAddress: place.formatted_address
        };
      } catch (error) {
        console.error(`Failed to get details for ${prediction.description}:`, error.message);
        return null;
      }
    });

    // Wait for all place details to resolve
    const places = await Promise.all(placePromises);

    // Filter out nulls
    const validPlaces = places.filter(place => place !== null);

    // For cities, filter to European countries only
    if (type === 'city') {
      const europeanCountryCodes = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB'];
      const europeanPlaces = validPlaces.filter(place =>
        europeanCountryCodes.includes(place.countryCode)
      );
      console.log(`✅ Returning ${europeanPlaces.length} European cities for "${query}"`);
      return res.json({ results: europeanPlaces });
    }

    console.log(`✅ Returning ${validPlaces.length} ${type}s for "${query}"`);
    res.json({ results: validPlaces });

  } catch (error) {
    console.error('Places search error:', error);
    res.json({ results: [] });
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

  // NEW: Use origin directly from job (no more hardcoded fallback!)
  // Origin is now stored as full object {name, country, coordinates} in job

  // Determine the route data based on job type
  let routeData = null;
  if (job.status === 'completed') {
    // Check for unified job format (has job.route)
    if (job.route) {
      routeData = job.route;
    }
    // Check for nights-based job format (has job.result)
    else if (job.result) {
      routeData = job.result;
    }
    // Fallback to old agent format
    else {
      routeData = {
        origin: job.origin,
        destination: job.destination,
        totalStops: job.stops,
        budget: job.budget,
        agentResults: job.agentResults
      };
    }
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    route: routeData,
    error: job.error
  });
});

// UNIFIED Background Job Processor - Uses UnifiedRouteAgent (6-phase workflow)
async function processUnifiedRouteJob(jobId, origin, destination, totalNights, tripPace, budget, preferences, personalization) {
  const job = routeJobs.get(jobId);
  if (!job) return;

  console.log(`\n🎯 === Starting UNIFIED route job ${jobId} ===`);

  try {
    // Initialize the Unified Route Agent
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    const unifiedAgent = new UnifiedRouteAgent(pool, googleApiKey);

    // Progress callback to update job status
    const onProgress = (progress) => {
      job.progress.phase = progress.phase;
      job.progress.message = progress.message;
      job.progress.percentComplete = progress.percentComplete;
      job.progress.estimatedTimeRemaining = progress.estimatedTimeRemaining;
      job.updatedAt = new Date();
    };

    // Run the unified route generation
    const result = await unifiedAgent.generateRoute({
      origin,
      destination,
      totalNights,
      tripPace,
      budget,
      preferences,
      personalization,  // User's trip story, occasion, interests, etc.
      onProgress
    });

    // Mark job as completed
    job.status = 'completed';
    job.progress.percentComplete = 100;
    job.progress.phase = 'completed';
    job.progress.message = 'Route generation complete!';
    job.route = result;
    job.updatedAt = new Date();

    const duration = (Date.now() - job.progress.startTime) / 1000;
    console.log(`\n✅ === Unified route job ${jobId} completed in ${duration.toFixed(1)}s ===`);

  } catch (error) {
    console.error(`\n❌ === Unified route job ${jobId} failed ===`);
    console.error(error);

    job.status = 'failed';
    job.error = error.message;
    job.updatedAt = new Date();

    throw error;
  }
}

// NIGHTS-BASED Background Job Processor - Uses RoutePlanningAgent
async function processRouteJobNightsBased(jobId, origin, destination, totalNights, tripPace, selectedAgents, budget) {
  const job = routeJobs.get(jobId);
  if (!job) return;

  // Origin and destination are now full objects: {name, country, coordinates}
  console.log(`\n🗺️  === Starting NIGHTS-BASED route job ${jobId} ===`);
  console.log(`Origin: ${origin.name}, ${origin.country} (${origin.coordinates[0].toFixed(4)}, ${origin.coordinates[1].toFixed(4)})`);
  console.log(`Destination: ${destination.name}, ${destination.country} (${destination.coordinates[0].toFixed(4)}, ${destination.coordinates[1].toFixed(4)})`);
  console.log(`Total nights: ${totalNights}`);
  console.log(`Trip pace: ${tripPace}`);
  console.log(`Agents: ${selectedAgents.join(', ')}`);
  console.log(`Budget: ${budget}`);

  try {
    // PHASE 1: Route Planning - Let AI determine optimal cities and night allocations
    console.log(`\n📍 PHASE 1: Route Planning`);
    job.progress.phase = 'route_planning';
    job.progress.message = 'AI is planning optimal route and allocating nights...';
    job.progress.percentComplete = 5;
    job.updatedAt = new Date();

    const routePlanner = new RoutePlanningAgent();
    const routePlan = await routePlanner.planRoute({
      origin: origin.name,  // Pass city name to RoutePlanningAgent
      destination: destination.name,  // Pass city name to RoutePlanningAgent
      totalNights,
      tripPace,
      budget
    });

    console.log(`✅ Route plan complete:`);
    console.log(`   - ${routePlan.numCities} cities recommended`);
    routePlan.cities.forEach(city => {
      console.log(`   - ${city.name}: ${city.nights} nights`);
    });

    // Store route plan in job
    job.routePlan = routePlan;
    job.progress.percentComplete = 15;
    job.updatedAt = new Date();

    // Convert to waypoints format (exclude first and last cities = origin/destination)
    const waypoints = routePlan.cities
      .slice(1, -1) // Remove first (origin) and last (destination)
      .map(city => ({
        name: city.name,
        country: city.country || '',
        description: city.description || '',
        highlights: city.highlights || []
      }));

    // Build night allocations object
    const nightAllocations = {};
    routePlan.cities.forEach(city => {
      nightAllocations[city.name] = city.nights;
    });

    console.log(`\n📦 Night allocations:`, nightAllocations);

    // PHASE 2: Agent Discovery - Get recommendations from each agent
    console.log(`\n🤖 PHASE 2: Agent Discovery`);
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    const routeAgent = new RouteDiscoveryAgentV2(pool, googleApiKey);

    const agentResults = [];

    // Process each agent style
    for (let i = 0; i < selectedAgents.length; i++) {
      const agentType = selectedAgents[i];
      const agentConfig = agents[agentType];

      try {
        // Update progress
        const agentStartTime = Date.now();
        job.progress.phase = 'agent_discovery';
        job.progress.currentAgent = agentConfig.name;
        job.progress.currentAgentStartTime = agentStartTime;
        job.progress.percentComplete = 15 + Math.round(((i + 1) / selectedAgents.length) * 80);

        const elapsed = agentStartTime - job.progress.startTime;
        const avgTimePerAgent = i > 0 ? elapsed / (i + 1) : 15000;
        job.progress.estimatedTimeRemaining = Math.round(avgTimePerAgent * (selectedAgents.length - i));

        job.updatedAt = new Date();

        console.log(`\n--- Processing ${agentConfig.name} (${i + 1}/${selectedAgents.length}) ---`);

        // Use agentic discovery with the planned cities
        // Note: We pass routePlan.numCities as "stops" for compatibility with existing agent code
        const result = await routeAgent.discoverRoute(
          origin.name,  // Pass city name to RouteDiscoveryAgentV2
          destination.name,  // Pass city name to RouteDiscoveryAgentV2
          routePlan.numCities,
          agentType,
          budget
        );

        console.log(`✓ ${agentConfig.name} completed`);

        // Add to results
        agentResults.push({
          agent: agentType,
          name: agentConfig.name,
          recommendations: JSON.stringify(result),  // FIX: result is the route object, not result.route
          metricsRaw: result.metrics,
          metrics: result.formattedMetrics || {}
        });

        // Update progress
        job.progress.completed = i + 1;
        job.updatedAt = new Date();

      } catch (error) {
        console.error(`❌ ${agentConfig.name} failed:`, error.message);
        // Continue with other agents even if one fails
        agentResults.push({
          agent: agentType,
          name: agentConfig.name,
          recommendations: JSON.stringify({ error: error.message }),
          metrics: {}
        });
      }
    }

    // PHASE 3: Merge results
    console.log(`\n🔗 PHASE 3: Merging Results`);
    job.progress.phase = 'merging';
    job.progress.message = 'Creating best overall route...';
    job.progress.percentComplete = 95;
    job.updatedAt = new Date();

    // Create best-overall route (reuse existing function, but pass numCities instead of stops)
    const mergedResult = createBestOverallRoute(agentResults, routePlan.numCities);

    // Add to agent results
    agentResults.push({
      agent: 'best-overall',
      name: 'Best Overall',
      recommendations: JSON.stringify(mergedResult),  // FIX: mergedResult is the route object, not mergedResult.route
      metrics: mergedResult.metrics || {}
    });

    // FINAL: Mark job complete with night allocations
    job.status = 'completed';
    job.progress.percentComplete = 100;
    job.progress.phase = 'completed';
    job.progress.message = 'Route generation complete!';
    job.agentResults = agentResults;

    // IMPORTANT: Include night allocations in the result
    job.result = {
      origin,
      destination,
      totalNights,
      tripPace,
      waypoints,
      nightAllocations,  // ← KEY: This is what Phase 4 needs
      routePlan,
      agentResults
    };

    job.updatedAt = new Date();

    const duration = (Date.now() - job.progress.startTime) / 1000;
    console.log(`\n✅ === Route job ${jobId} completed in ${duration.toFixed(1)}s ===`);
    console.log(`   - ${routePlan.numCities} cities`);
    console.log(`   - ${totalNights} nights total`);
    console.log(`   - ${selectedAgents.length} agent perspectives`);

  } catch (error) {
    console.error(`\n❌ === Route job ${jobId} failed ===`);
    console.error(error);

    job.status = 'failed';
    job.error = error.message;
    job.updatedAt = new Date();

    throw error;
  }
}

// AGENTIC Background Job Processor - Uses RouteDiscoveryAgentV2
async function processRouteJobAgentic(jobId, origin, destination, stops, selectedAgents, budget) {
  const job = routeJobs.get(jobId);
  if (!job) return;

  console.log(`\n🎯 === Starting AGENTIC route job ${jobId} ===`);
  console.log(`Origin: ${origin}`);
  console.log(`Destination: ${destination}`);
  console.log(`Stops: ${stops}`);
  console.log(`Agents: ${selectedAgents.join(', ')}`);
  console.log(`Budget: ${budget}`);

  try {
    // Initialize RouteDiscoveryAgentV2
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    const routeAgent = new RouteDiscoveryAgentV2(pool, googleApiKey);

    const agentResults = [];

    // Process each agent style
    for (let i = 0; i < selectedAgents.length; i++) {
      const agentType = selectedAgents[i];
      const agentConfig = agents[agentType];

      try {
        // Update progress
        const agentStartTime = Date.now();
        job.progress.currentAgent = agentConfig.name;
        job.progress.currentAgentStartTime = agentStartTime;
        job.progress.percentComplete = Math.round((i / selectedAgents.length) * 100);

        const elapsed = agentStartTime - job.progress.startTime;
        const avgTimePerAgent = i > 0 ? elapsed / i : 15000; // 15s estimate (faster than old method)
        job.progress.estimatedTimeRemaining = Math.round(avgTimePerAgent * (selectedAgents.length - i));

        job.updatedAt = new Date();

        console.log(`\n--- Processing ${agentConfig.name} with agentic discovery (${i + 1}/${selectedAgents.length}) ---`);

        // Use agentic discovery with validation
        const result = await routeAgent.discoverRoute(
          origin,
          destination,
          stops,
          agentType,
          budget
        );

        // Format result to match expected structure
        const formattedResult = {
          origin: result.origin,
          destination: result.destination,
          waypoints: result.waypoints,
          alternatives: result.alternatives
        };

        agentResults.push({
          agent: agentType,
          agentConfig: {
            name: agentConfig.name,
            color: agentConfig.color,
            icon: agentConfig.icon
          },
          recommendations: JSON.stringify(formattedResult),
          metrics: result.themeInsights || {}
        });

        // Update progress
        job.progress.completed = i + 1;
        job.progress.percentComplete = Math.round(((i + 1) / selectedAgents.length) * 100);

        const completedTime = Date.now();
        const totalElapsed = completedTime - job.progress.startTime;
        const actualAvgTimePerAgent = totalElapsed / (i + 1);
        job.progress.estimatedTimeRemaining = Math.round(actualAvgTimePerAgent * (selectedAgents.length - (i + 1)));

        job.agentResults = agentResults;
        job.updatedAt = new Date();

        console.log(`✓ ${agentConfig.name} completed with ${result.waypoints.length} validated cities`);
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
          recommendations: JSON.stringify({
            origin: { city: destination, country: 'Unknown' },
            destination: { city: destination, country: 'Unknown' },
            waypoints: [],
            error: `Failed to generate route`
          }),
          metrics: { error: true }
        });

        // Update progress even on error
        job.progress.completed = i + 1;
        job.progress.percentComplete = Math.round(((i + 1) / selectedAgents.length) * 100);

        const completedTime = Date.now();
        const totalElapsed = completedTime - job.progress.startTime;
        const avgTimePerAgent = totalElapsed / (i + 1);
        job.progress.estimatedTimeRemaining = Math.round(avgTimePerAgent * (selectedAgents.length - (i + 1)));

        job.agentResults = agentResults;
        job.updatedAt = new Date();
      }
    }

    // Create "Best Overall" if multiple agents (use same logic as old version)
    if (selectedAgents.length > 1 && !selectedAgents.includes('best-overall')) {
      try {
        console.log('\n--- Creating Best Overall merged route ---');
        const mergedResult = createBestOverallRoute(agentResults, stops);

        // Generate Best Overall theme insights
        const selectedCities = mergedResult.waypoints || [];
        const themeCounts = {};
        selectedCities.forEach(city => {
          city.themes?.forEach(theme => {
            themeCounts[theme] = (themeCounts[theme] || 0) + 1;
          });
        });

        const totalThemes = Object.keys(themeCounts).length;
        const themePercentages = Object.entries(themeCounts)
          .map(([theme, count]) => `${Math.round((count / selectedCities.length) * 100)}% ${agents[theme]?.name || theme}`)
          .join(', ');

        const bestOverallInsights = {
          balance: themePercentages || 'Balanced across all themes',
          diversity: `${selectedCities.length} cities spanning ${totalThemes} different travel themes`,
          route_quality: `Optimal ${Math.round(selectedCities.reduce((sum, city) => sum + (city.themeCount || 1), 0) / selectedCities.length * 10) / 10}x multi-theme coverage per city`,
          highlight: `Best combination: ${selectedCities.filter(c => c.themeCount >= 2).map(c => c.name).slice(0, 3).join(', ') || selectedCities[0]?.name || 'Multiple cities'}`,
          flexibility: `${mergedResult.alternatives?.length || 0} alternatives available for complete route customization`
        };

        agentResults.unshift({
          agent: 'best-overall',
          agentConfig: {
            name: agents['best-overall'].name,
            color: agents['best-overall'].color,
            icon: agents['best-overall'].icon
          },
          recommendations: JSON.stringify(mergedResult),
          metrics: bestOverallInsights
        });

        job.agentResults = agentResults;
        console.log('✓ Best Overall route created from validated cities');
      } catch (error) {
        console.error('✗ Failed to create Best Overall:', error.message);
      }
    }

    // Mark job as completed
    job.status = 'completed';
    job.progress.currentAgent = null;
    job.updatedAt = new Date();

    console.log(`\n🎉 === Agentic route job ${jobId} completed ===\n`);

  } catch (error) {
    console.error(`❌ Agentic route job ${jobId} failed:`, error);
    job.status = 'failed';
    job.error = error.message;
    job.updatedAt = new Date();
    throw error;
  }
}

// Background job processor (OLD METHOD - KEPT FOR COMPATIBILITY)
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
        // Normalize origin and destination to handle both formats
        origin = {
          ...parsed.origin,
          name: parsed.origin.name || parsed.origin.city,
          latitude: parsed.origin.latitude || parsed.origin.coordinates?.lat,
          longitude: parsed.origin.longitude || parsed.origin.coordinates?.lng
        };
        destination = {
          ...parsed.destination,
          name: parsed.destination.name || parsed.destination.city,
          latitude: parsed.destination.latitude || parsed.destination.coordinates?.lat,
          longitude: parsed.destination.longitude || parsed.destination.coordinates?.lng
        };
      }

      // Pool selected waypoints
      if (parsed.waypoints && Array.isArray(parsed.waypoints)) {
        parsed.waypoints.forEach(city => {
          // Handle both old format (name) and new RouteDiscoveryAgentV2 format (city)
          const cityName = city.name || city.city;
          if (!cityName) return; // Skip if no city name

          const cityKey = cityName.toLowerCase().trim();

          // Normalize city data to common format
          const normalizedCity = {
            ...city,
            name: cityName,
            // Handle both formats for coordinates
            latitude: city.latitude || city.coordinates?.lat,
            longitude: city.longitude || city.coordinates?.lng,
            country: city.country,
            verified: city.verified || false
          };

          if (!cityPool.has(cityKey)) {
            cityPool.set(cityKey, {
              ...normalizedCity,
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

            // Update coordinates if new data has them
            if (!existing.latitude && normalizedCity.latitude) {
              existing.latitude = normalizedCity.latitude;
              existing.longitude = normalizedCity.longitude;
            }
          }
        });
      }

      // Pool alternatives
      if (parsed.alternatives && Array.isArray(parsed.alternatives)) {
        parsed.alternatives.forEach(city => {
          // Handle both old format (name) and new RouteDiscoveryAgentV2 format (city)
          const cityName = city.name || city.city;
          if (!cityName) return; // Skip if no city name

          const cityKey = cityName.toLowerCase().trim();

          // Normalize city data to common format
          const normalizedCity = {
            ...city,
            name: cityName,
            latitude: city.latitude || city.coordinates?.lat,
            longitude: city.longitude || city.coordinates?.lng,
            country: city.country,
            verified: city.verified || false
          };

          if (!cityPool.has(cityKey)) {
            cityPool.set(cityKey, {
              ...normalizedCity,
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

            // Update coordinates if new data has them
            if (!existing.latitude && normalizedCity.latitude) {
              existing.latitude = normalizedCity.latitude;
              existing.longitude = normalizedCity.longitude;
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

  if (pooledCities.length > 0) {
    console.log(`Sample city structure:`, {
      name: pooledCities[0].name,
      hasLatitude: !!pooledCities[0].latitude,
      hasLongitude: !!pooledCities[0].longitude,
      themes: pooledCities[0].themes
    });
  }

  if (origin) {
    console.log(`Origin/Destination:`, {
      origin: { name: origin.name, hasLatLng: !!(origin.latitude && origin.longitude) },
      destination: { name: destination.name, hasLatLng: !!(destination.latitude && destination.longitude) }
    });
  }

  // Step 2: If we have origin/destination, run geographic optimization
  if (origin && destination && origin.latitude && destination.latitude) {
    console.log(`Running optimization from ${origin.name} to ${destination.name}`);

    const optimized = selectOptimalCities(pooledCities, origin, destination, requestedStops);

    // Step 3: Add theme metadata to selected cities
    const selectedWithThemes = optimized.selected.map(city => ({
      ...city,
      themesDisplay: city.themes.map(t => agents[t]?.name || t).join(', ')
    }));

    // Step 4: For Best Overall, ALL cities not selected should be alternatives
    // This gives users maximum flexibility to customize their route
    const selectedNames = new Set(selectedWithThemes.map(c => c.name.toLowerCase().trim()));
    const allAlternatives = pooledCities
      .filter(city => !selectedNames.has(city.name.toLowerCase().trim()))
      .map(city => ({
        ...city,
        themesDisplay: city.themes.map(t => agents[t]?.name || t).join(', ')
      }));

    console.log(`Selected ${selectedWithThemes.length} cities, ${allAlternatives.length} alternatives (ALL non-selected cities)`);
    console.log(`Theme distribution: ${selectedWithThemes.map(c => `${c.name} (${c.themes.length})`).join(', ')}`);

    return {
      origin,
      destination,
      waypoints: selectedWithThemes,
      alternatives: allAlternatives,
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

// =====================================================
// BUDGET CALCULATOR ENDPOINT
// =====================================================

// POST /api/calculate-budget - Calculate comprehensive trip budget using Perplexity
app.post('/api/calculate-budget', async (req, res) => {
  try {
    const { route, tripDetails } = req.body;

    if (!route || !tripDetails) {
      return res.status(400).json({ error: 'Route and trip details are required' });
    }

    // Parse route if it's stringified
    const routeData = typeof route === 'string' ? JSON.parse(route) : route;

    // Validate required fields
    if (!routeData.origin || !routeData.destination) {
      return res.status(400).json({ error: 'Route must have origin and destination' });
    }

    console.log('🔢 Calculating budget via Perplexity...');
    console.log(`   Route: ${routeData.origin.name} → ${routeData.destination.name}`);
    console.log(`   Waypoints: ${routeData.waypoints?.map(w => w.name).join(', ') || 'None'}`);
    console.log(`   Duration: ${tripDetails.duration} days, Travelers: ${tripDetails.travelers}, Budget: ${tripDetails.budgetLevel}`);

    // Calculate total distance
    const totalDistance = calculateTotalRouteDistance(routeData);
    console.log(`   Total distance: ${totalDistance}km`);

    // Build comprehensive budget prompt
    const budgetPrompt = buildBudgetPrompt(routeData, tripDetails, totalDistance);

    // Call Perplexity with retry logic
    const budgetData = await callPerplexityForBudget(budgetPrompt);

    // Add metadata
    budgetData.metadata = {
      calculatedAt: new Date().toISOString(),
      route: {
        origin: routeData.origin.name,
        destination: routeData.destination.name,
        waypoints: routeData.waypoints?.map(w => w.name) || [],
        distance: totalDistance
      },
      tripDetails,
      dataSource: 'perplexity',
      apiVersion: 'v1'
    };

    console.log(`✅ Budget calculated: €${budgetData.summary.total} total (€${budgetData.summary.perPerson}/person)`);

    res.json(budgetData);

  } catch (error) {
    console.error('❌ Budget calculation failed:', error);
    res.status(500).json({
      error: 'Budget calculation failed',
      message: error.message,
      fallback: generateFallbackBudget(req.body)
    });
  }
});

// ==================== CITY REPLACEMENT API ====================

/**
 * POST /api/route/suggest-replacement
 * Get AI-powered city replacement suggestions based on route context and personalization
 */
app.post('/api/route/suggest-replacement', async (req, res) => {
  try {
    const {
      currentCity,       // City to replace
      cityIndex,         // Position in route
      routeContext,      // Full route info: { cities, origin, destination, personalization }
      reason             // Optional: why user wants to replace ("too expensive", "not enough activities", etc.)
    } = req.body;

    console.log('🔄 City replacement request:', {
      currentCity: currentCity?.name || currentCity,
      cityIndex,
      reason,
      hasPersonalization: !!routeContext?.personalization
    });

    if (!currentCity || !routeContext?.cities) {
      return res.status(400).json({ error: 'Current city and route context required' });
    }

    // Build context for AI
    const cityNames = routeContext.cities.map(c =>
      typeof c.city === 'string' ? c.city : c.city?.name || 'Unknown'
    );
    const prevCity = cityIndex > 0 ? cityNames[cityIndex - 1] : null;
    const nextCity = cityIndex < cityNames.length - 1 ? cityNames[cityIndex + 1] : null;

    // Get personalization context
    const personalization = routeContext.personalization || {};
    const personalizationContext = [];

    if (personalization.travelStyle) personalizationContext.push(`Travel style: ${personalization.travelStyle}`);
    if (personalization.pace) personalizationContext.push(`Pace: ${personalization.pace}/5`);
    if (personalization.interests?.length) personalizationContext.push(`Interests: ${personalization.interests.join(', ')}`);
    if (personalization.diningStyle) personalizationContext.push(`Dining: ${personalization.diningStyle}`);
    if (personalization.budget) personalizationContext.push(`Budget: ${personalization.budget}`);
    if (personalization.occasion) personalizationContext.push(`Occasion: ${personalization.occasion}`);
    if (personalization.tripStory) personalizationContext.push(`Trip context: "${personalization.tripStory.substring(0, 150)}..."`);

    const prompt = `You are a travel expert helping find replacement cities for a road trip route.

CURRENT ROUTE:
${cityNames.map((name, i) => `${i + 1}. ${name}${i === cityIndex ? ' ← REPLACING THIS' : ''}`).join('\n')}

CITY TO REPLACE: ${typeof currentCity === 'string' ? currentCity : currentCity.name}
${prevCity ? `Previous stop: ${prevCity}` : 'This is the starting city'}
${nextCity ? `Next stop: ${nextCity}` : 'This is the final destination'}

${reason ? `USER'S REASON: "${reason}"` : ''}

${personalizationContext.length > 0 ? `
TRAVELER PREFERENCES:
${personalizationContext.join('\n')}
` : ''}

Suggest 3 alternative cities that:
1. Are geographically logical (between ${prevCity || 'origin'} and ${nextCity || 'destination'})
2. Match the traveler's preferences and interests
3. Offer something the current city might be missing
4. Are diverse options (e.g., one cultural hub, one scenic/relaxed, one off-the-beaten-path)

Return ONLY valid JSON with no markdown:
{
  "suggestions": [
    {
      "name": "City Name",
      "country": "Country",
      "coordinates": { "lat": 0.0, "lng": 0.0 },
      "whyReplace": "One sentence explaining why this is better than current city",
      "highlights": ["3-4 key attractions or experiences"],
      "matchScore": 85,
      "matchReasons": ["Matches your interest in X", "Perfect for Y travelers"],
      "estimatedDetourKm": 50,
      "bestFor": "culture|nature|food|adventure|relaxation"
    }
  ]
}`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a travel expert. Return ONLY valid JSON with no markdown formatting, no code blocks.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Clean markdown if present
    const jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const suggestions = JSON.parse(jsonContent);

    console.log(`✅ Generated ${suggestions.suggestions?.length || 0} replacement suggestions`);

    res.json({
      currentCity: typeof currentCity === 'string' ? currentCity : currentCity.name,
      cityIndex,
      suggestions: suggestions.suggestions || [],
      reason
    });

  } catch (error) {
    console.error('❌ City replacement suggestion failed:', error);
    res.status(500).json({
      error: 'Failed to generate replacement suggestions',
      message: error.message
    });
  }
});

/**
 * POST /api/route/parse-command
 * Parse natural language commands for route modification
 */
app.post('/api/route/parse-command', async (req, res) => {
  try {
    const { command, routeContext } = req.body;

    console.log('🗣️ Parsing command:', command);

    if (!command || !routeContext?.cities) {
      return res.status(400).json({ error: 'Command and route context required' });
    }

    const cityNames = routeContext.cities.map(c => c.name);

    const prompt = `You are a travel route modification assistant. Parse the user's command and identify their intent.

CURRENT ROUTE:
${cityNames.map((name, i) => `${i + 1}. ${name} (${routeContext.cities[i]?.nights || 1} nights)`).join('\n')}

USER COMMAND: "${command}"

Identify the intent and extract entities. Possible intents:
- remove: Remove a city from the route
- replace: Replace a city with another
- add: Add a new city to the route
- reorder: Change the order of cities
- adjust_nights: Change how many nights in a city
- unknown: Cannot understand the request

Return ONLY valid JSON with no markdown:
{
  "intent": "remove|replace|add|reorder|adjust_nights|unknown",
  "confidence": 0.0-1.0,
  "entities": {
    "city": "city name if mentioned",
    "nights": null or number,
    "position": "before|after" if mentioned,
    "referenceCity": "city name for position reference"
  },
  "suggestedActions": [
    {
      "id": "action-1",
      "type": "remove|replace|add|reorder|nights|custom",
      "label": "Human readable action label",
      "description": "What this action will do",
      "cityIndex": 0,
      "cityName": "City Name",
      "value": null
    }
  ]
}

For cityIndex, use the index from the CURRENT ROUTE (0-based).
For confidence, be conservative - only high confidence if command is very clear.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You parse travel commands. Return ONLY valid JSON, no markdown.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Clean markdown if present
    const jsonContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(jsonContent);

    // Add icon mappings for frontend
    const iconMap = {
      remove: 'Trash2',
      replace: 'RefreshCw',
      add: 'Plus',
      reorder: 'ArrowUpDown',
      nights: 'Moon',
      custom: 'Wand2'
    };

    if (parsed.suggestedActions) {
      parsed.suggestedActions = parsed.suggestedActions.map(action => ({
        ...action,
        icon: iconMap[action.type] || 'Wand2'
      }));
    }

    console.log(`✅ Parsed command: ${parsed.intent} (${Math.round(parsed.confidence * 100)}% confidence)`);

    res.json(parsed);

  } catch (error) {
    console.error('❌ Command parsing failed:', error);
    res.status(500).json({
      intent: 'unknown',
      confidence: 0,
      entities: {},
      suggestedActions: [],
      error: error.message
    });
  }
});

/**
 * POST /api/route/handle-constraint-change
 * Handle trip-wide constraint changes (duration, budget, preferences, dates)
 * Returns intelligent suggestions for adapting the route
 */
app.post('/api/route/handle-constraint-change', async (req, res) => {
  try {
    const { constraintType, change, routeContext, personalization } = req.body;

    console.log('🔄 Handling constraint change:', constraintType, change);

    if (!constraintType || !routeContext) {
      return res.status(400).json({
        error: 'Missing constraintType or routeContext'
      });
    }

    // Build prompt for AI to suggest adaptations
    const cityList = routeContext.cities
      .map((c, i) => `${i + 1}. ${c.name} (${c.nights} nights)`)
      .join('\n');

    const totalNights = routeContext.cities.reduce((sum, c) => sum + c.nights, 0);
    const totalCities = routeContext.cities.length;

    let constraintPrompt = '';
    let suggestionType = '';

    switch (constraintType) {
      case 'duration':
        const dayChange = change.days || 0;
        suggestionType = dayChange < 0 ? 'shorten' : 'extend';
        constraintPrompt = `
The traveler needs to ${dayChange < 0 ? 'shorten' : 'extend'} their trip by ${Math.abs(dayChange)} day${Math.abs(dayChange) !== 1 ? 's' : ''}.

Current trip: ${totalNights} nights across ${totalCities} cities
${cityList}

${dayChange < 0 ? `
Suggest the BEST ways to reduce ${Math.abs(dayChange)} night(s):
1. Which city/cities to remove entirely (if significant reduction needed)
2. Which cities to reduce nights in (and by how much)
3. Consider: travel time between cities, must-see highlights, logical flow

Prioritize keeping cities that are:
- Essential for the route flow (don't create huge detours)
- Have the most unique attractions
- Match user preferences
` : `
Suggest the BEST ways to add ${Math.abs(dayChange)} night(s):
1. Which existing cities deserve more time
2. Any new cities that could be added (consider route geography)
3. Consider: hidden gems near the route, day trip potential
`}`;
        break;

      case 'budget':
        const budgetChange = change.direction || 'tighter';
        suggestionType = budgetChange === 'tighter' ? 'budget_down' : 'budget_up';
        constraintPrompt = `
The traveler's budget is now ${budgetChange === 'tighter' ? 'tighter' : 'more generous'}.

Current trip: ${totalNights} nights across ${totalCities} cities
${cityList}

${budgetChange === 'tighter' ? `
Suggest ways to make this trip more budget-friendly:
1. Cheaper alternative cities (similar vibe, lower cost)
2. Cities to reduce nights in (expensive destinations)
3. General tips for the route
` : `
Suggest ways to enhance this trip with the increased budget:
1. Upgrade opportunities (cities worth more time)
2. Premium destinations to add
3. Cities where luxury experiences shine
`}`;
        break;

      case 'travelers':
        const travelerChange = change.description || 'traveling with kids now';
        suggestionType = 'traveler_change';
        constraintPrompt = `
The travel group has changed: ${travelerChange}

Current trip: ${totalNights} nights across ${totalCities} cities
${cityList}

Analyze which parts of this route might need adjustment:
1. Flag any cities that might not be suitable
2. Suggest alternatives or adjustments
3. Recommend changes to night distribution
4. Note any activities that might need reconsideration`;
        break;

      case 'dates':
        const newSeason = change.season || change.month || 'different time';
        suggestionType = 'date_change';
        constraintPrompt = `
The trip is moving to: ${newSeason}

Current trip: ${totalNights} nights across ${totalCities} cities
${cityList}

Consider seasonal implications:
1. Weather impact on each destination
2. Any cities to avoid during this time
3. Cities that become better during this time
4. Special events or considerations`;
        break;

      default:
        return res.status(400).json({
          error: `Unknown constraint type: ${constraintType}`
        });
    }

    // Add personalization context if available
    const personalizationContext = personalization ? `

User preferences:
- Trip style: ${personalization.travelStyle || 'Not specified'}
- Interests: ${personalization.interests?.join(', ') || 'Not specified'}
- Occasion: ${personalization.occasion || 'General travel'}
- Pace: ${personalization.pace || 'Moderate'}
` : '';

    const fullPrompt = constraintPrompt + personalizationContext + `

IMPORTANT: Respond with a JSON object containing:
{
  "summary": "One sentence explaining the recommended approach",
  "impact": {
    "nightsChange": number (positive or negative),
    "citiesAffected": number,
    "estimatedSavings": string (for budget) or null
  },
  "suggestions": [
    {
      "type": "remove_city" | "reduce_nights" | "add_nights" | "replace_city" | "add_city" | "reorder" | "tip",
      "priority": "high" | "medium" | "low",
      "cityName": string or null,
      "cityIndex": number or null,
      "value": any (nights change, replacement city name, etc),
      "reason": "Why this change helps",
      "tradeoff": "What you lose/gain"
    }
  ],
  "alternativeApproach": {
    "summary": "A different way to handle this",
    "suggestions": [...same format...]
  }
}

Be specific and actionable. Max 5 suggestions per approach.`;

    // Call Perplexity API for intelligent suggestions
    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a travel planning expert. Provide practical, specific suggestions for adapting travel itineraries. Always respond with valid JSON only, no markdown.'
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!perplexityResponse.ok) {
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const aiResponse = perplexityData.choices[0]?.message?.content || '{}';

    // Parse AI response
    let parsed;
    try {
      // Clean response - remove markdown code blocks if present
      const cleanedResponse = aiResponse
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Provide fallback response
      parsed = {
        summary: 'Unable to generate specific suggestions. Please try adjusting manually.',
        impact: { nightsChange: 0, citiesAffected: 0 },
        suggestions: [],
        alternativeApproach: null
      };
    }

    // Add metadata
    const result = {
      constraintType,
      suggestionType,
      originalRequest: change,
      ...parsed,
      metadata: {
        originalNights: totalNights,
        originalCities: totalCities,
        processedAt: new Date().toISOString()
      }
    };

    console.log(`✅ Generated ${parsed.suggestions?.length || 0} suggestions for ${constraintType} change`);

    res.json(result);

  } catch (error) {
    console.error('❌ Constraint change handling failed:', error);
    res.status(500).json({
      error: error.message,
      suggestions: []
    });
  }
});

// Helper: Calculate total route distance using Haversine
function calculateTotalRouteDistance(route) {
  const { calculateDistance } = require('./utils/cityOptimization');

  const points = [
    route.origin,
    ...(route.waypoints || []),
    route.destination
  ];

  let totalDistance = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const point1 = points[i];
    const point2 = points[i + 1];

    // Use calculateDistance from cityOptimization (expects lat/lon properties)
    const distance = calculateDistance(
      point1.latitude,
      point1.longitude,
      point2.latitude,
      point2.longitude
    );

    totalDistance += distance;
  }

  // Account for road detours (roads aren't straight lines - multiply by ~1.3)
  const actualDrivingDistance = Math.round(totalDistance * 1.3);

  return actualDrivingDistance;
}

// Helper: Build comprehensive Perplexity prompt for budget calculation
function buildBudgetPrompt(route, tripDetails, totalDistance) {
  const { duration, travelers, budgetLevel, preferences } = tripDetails;

  const waypoints = route.waypoints || [];
  // Handle both old format (name) and new RouteDiscoveryAgentV2 format (city)
  const originName = route.origin.name || route.origin.city;
  const destName = route.destination.name || route.destination.city;
  const originCountry = getCountryFromCity(originName);
  const destCountry = getCountryFromCity(destName);

  const budgetGuidance = {
    'budget': 'Focus on hostels/budget hotels (€30-60/night), street food and casual dining (€8-20/meal), free attractions and parks. Minimize toll roads where possible.',
    'mid': 'Focus on 3-star hotels (€70-120/night), local restaurants and cafes (€15-35/meal), main attractions and museums (€8-15 each). Use normal highways.',
    'luxury': 'Focus on 4-5 star hotels (€150-300/night), fine dining restaurants (€40-80/meal), premium experiences and guided tours (€50-150 each). Prioritize comfort over cost.'
  };

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return `You are a European road trip budget calculator with access to current ${currentYear} prices. Calculate realistic cost estimates for this specific route.

**Route Details:**
- Origin: ${originName}, ${originCountry}
- Destination: ${destName}, ${destCountry}
- Waypoints: ${waypoints.map(w => w.name || w.city).join(', ') || 'Direct route (no stops)'}
- Total Driving Distance: ${totalDistance}km
- Trip Duration: ${duration} days
- Number of Travelers: ${travelers} people
- Budget Level: ${budgetLevel}
- Current Month: ${currentMonth} ${currentYear}

**Budget Guidelines:**
${budgetGuidance[budgetLevel] || budgetGuidance.mid}

**IMPORTANT INSTRUCTIONS:**
1. Use CURRENT ${currentYear} prices for ${currentMonth}
2. Account for seasonal variations (${currentMonth} may have high/low season pricing)
3. Be specific to the actual cities in the route
4. Include realistic toll costs for European highways
5. Use current fuel prices (€/liter) in ${originCountry} and ${destCountry}
6. Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text

**Return this EXACT JSON structure:**

{
  "transportation": {
    "fuel": {
      "total": <number in EUR>,
      "pricePerLiter": <current EUR fuel price>,
      "litersNeeded": <number>,
      "consumption": "7L/100km"
    },
    "tolls": {
      "total": <number in EUR>,
      "breakdown": [
        {"section": "Highway name", "cost": <number>}
      ]
    },
    "parking": {
      "total": <number in EUR>,
      "perCity": [
        {"city": "CityName", "days": <number>, "dailyRate": <number>, "total": <number>}
      ]
    }
  },
  "accommodation": {
    "total": <number in EUR>,
    "avgPerNight": <number>,
    "nights": <number of nights = ${Math.max(1, duration - 1)}>,
    "byCity": [
      {"city": "CityName", "priceRange": {"min": <number>, "max": <number>}, "avgPrice": <number>, "nights": 1}
    ]
  },
  "dining": {
    "total": <number in EUR>,
    "breakdown": {
      "breakfast": {"perPerson": <number>, "dailyTotal": <number>, "tripTotal": <number>},
      "lunch": {"perPerson": <number>, "dailyTotal": <number>, "tripTotal": <number>},
      "dinner": {"perPerson": <number>, "dailyTotal": <number>, "tripTotal": <number>},
      "snacks": {"dailyTotal": <number>, "tripTotal": <number>}
    }
  },
  "activities": {
    "total": <number in EUR>,
    "estimatedCount": <number>,
    "items": [
      {"name": "Specific attraction name", "city": "CityName", "cost": <number per person>}
    ]
  },
  "misc": {
    "total": <5% of subtotal in EUR>,
    "note": "Contingency for unexpected costs"
  },
  "summary": {
    "total": <sum of all categories in EUR>,
    "perPerson": <total divided by ${travelers} travelers>,
    "confidence": "medium",
    "currency": "EUR"
  },
  "savingsTips": [
    "Specific actionable tip 1 with estimated savings amount",
    "Specific actionable tip 2 with estimated savings amount",
    "Specific actionable tip 3 with estimated savings amount"
  ],
  "priceContext": {
    "bestMonthsForPrices": ["month1", "month2"],
    "expensivePeriods": ["period1", "period2"],
    "currentMonthContext": "Brief note about ${currentMonth} pricing trends"
  }
}`;
}

// Helper: Call Perplexity API for budget calculation with retry logic
async function callPerplexityForBudget(prompt) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a precise budget calculator. Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text. Use current 2025 European prices.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent, factual pricing
          max_tokens: 2500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Clean markdown formatting if present
      const jsonContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const budgetData = JSON.parse(jsonContent);

      // Validate required fields
      if (!budgetData.summary || typeof budgetData.summary.total !== 'number') {
        throw new Error('Invalid budget data structure - missing summary.total');
      }

      if (!budgetData.transportation || !budgetData.accommodation || !budgetData.dining) {
        throw new Error('Invalid budget data structure - missing required categories');
      }

      return budgetData;

    } catch (error) {
      lastError = error;
      console.warn(`⚠️  Budget calculation attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, attempt - 1);
        console.log(`   Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Budget calculation failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Helper: Get country from city name (simple heuristic)
function getCountryFromCity(cityName) {
  const countryMap = {
    'france': ['aix-en-provence', 'marseille', 'montpellier', 'perpignan', 'narbonne', 'nice', 'lyon', 'toulouse', 'avignon', 'cannes', 'antibes', 'arles', 'nimes'],
    'spain': ['barcelona', 'figueres', 'girona', 'valencia', 'madrid', 'seville', 'bilbao', 'zaragoza', 'tarragona', 'lleida'],
    'italy': ['milan', 'rome', 'florence', 'venice', 'genoa', 'turin', 'pisa', 'verona', 'bologna', 'naples'],
    'portugal': ['lisbon', 'porto', 'faro', 'coimbra', 'braga'],
    'switzerland': ['geneva', 'zurich', 'bern', 'lausanne', 'basel'],
    'germany': ['munich', 'berlin', 'hamburg', 'frankfurt', 'cologne'],
    'belgium': ['brussels', 'bruges', 'antwerp', 'ghent']
  };

  const cityLower = cityName.toLowerCase();

  for (const [country, cities] of Object.entries(countryMap)) {
    if (cities.some(c => cityLower.includes(c) || c.includes(cityLower))) {
      return country.charAt(0).toUpperCase() + country.slice(1);
    }
  }

  return 'Europe';
}

// Helper: Generate fallback budget estimate if Perplexity fails
function generateFallbackBudget(requestData) {
  const { route, tripDetails } = requestData;
  if (!tripDetails) {
    return {
      summary: { total: 0, perPerson: 0, confidence: 'error' },
      error: 'Missing trip details'
    };
  }

  const { duration, travelers, budgetLevel } = tripDetails;

  // Ultra-simple static estimates as fallback
  const baseRates = {
    budget: { hotel: 45, meal: 12, activities: 15, parkingDaily: 15 },
    mid: { hotel: 95, meal: 25, activities: 30, parkingDaily: 25 },
    luxury: { hotel: 220, meal: 55, activities: 80, parkingDaily: 40 }
  };

  const rates = baseRates[budgetLevel] || baseRates.mid;
  const distance = 800; // Rough estimate if we can't calculate

  const accommodation = rates.hotel * Math.max(1, duration - 1);
  const dining = rates.meal * 3 * duration * travelers;
  const activities = rates.activities * 3 * duration * travelers;
  const fuel = (distance / 100) * 7 * 1.65; // 7L/100km, €1.65/L
  const tolls = 60;
  const parking = rates.parkingDaily * duration;

  const subtotal = accommodation + dining + activities + fuel + tolls + parking;
  const misc = subtotal * 0.05;
  const total = subtotal + misc;

  return {
    summary: {
      total: Math.round(total),
      perPerson: Math.round(total / travelers),
      confidence: 'low',
      currency: 'EUR',
      note: 'Fallback estimate - Perplexity API unavailable. Actual prices may vary significantly.'
    },
    breakdown: {
      transportation: {
        fuel: { total: Math.round(fuel) },
        tolls: { total: tolls },
        parking: { total: parking }
      },
      accommodation: { total: accommodation, nights: Math.max(1, duration - 1) },
      dining: { total: dining },
      activities: { total: activities },
      misc: { total: Math.round(misc) }
    },
    warning: 'This is a basic static estimate. Try again later for detailed AI-powered pricing.',
    savingsTips: [
      'Park outside city centers to save on parking costs',
      'Eat at local markets and bakeries for budget meals',
      'Visit free attractions and parks to reduce activity costs'
    ]
  };
}

// =====================================================
// EXPORT ENDPOINTS - PHASE 1
// =====================================================

const ics = require('ics');
const tokml = require('tokml');

// Helper: Escape XML special characters
function escapeXML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Helper: Generate single GPX waypoint
function generateGPXWaypoint(point, type, name, description = '') {
  const lat = point.latitude;
  const lon = point.longitude;
  const cleanName = escapeXML(name);
  const cleanDesc = escapeXML(description);

  return `  <wpt lat="${lat}" lon="${lon}">
    <name>${cleanName}</name>
    <desc>${cleanDesc}</desc>
    <type>${type}</type>
    <sym>${type === 'origin' ? 'Flag, Green' : type === 'destination' ? 'Flag, Red' : 'Pin, Blue'}</sym>
  </wpt>\n`;
}

// Helper: Generate GPX XML
function generateGPX(recommendations, agentConfig) {
  const origin = recommendations.origin;
  const destination = recommendations.destination;
  const waypoints = recommendations.waypoints || [];

  // GPX header with metadata
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     creator="Waycraft - https://waycraft.com"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXML(origin.name + ' to ' + destination.name)}</name>
    <desc>Road trip route crafted by Waycraft (${escapeXML(agentConfig.name)})</desc>
    <author>
      <name>Waycraft</name>
      <link href="https://waycraft.com">
        <text>Waycraft - Your Journey, Personally Crafted</text>
      </link>
    </author>
    <time>${new Date().toISOString()}</time>
  </metadata>

  <!-- Route waypoints -->\n`;

  // Add origin
  gpx += generateGPXWaypoint(origin, 'origin', 'Start: ' + origin.name);

  // Add intermediate waypoints
  waypoints.forEach((city, index) => {
    const wptType = 'waypoint';
    const wptName = `Stop ${index + 1}: ${city.name}`;
    const wptDesc = city.description || (city.activities ? city.activities.slice(0, 3).join(', ') : '');
    gpx += generateGPXWaypoint(city, wptType, wptName, wptDesc);
  });

  // Add destination
  gpx += generateGPXWaypoint(destination, 'destination', 'End: ' + destination.name);

  // Close GPX
  gpx += `</gpx>`;

  return gpx;
}

// Helper: Parse duration string like "1-2 days" to number
function parseDuration(durationStr) {
  if (!durationStr) return 1;
  const match = durationStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

// Helper: Generate calendar events for route
function generateCalendarEvents(recommendations, startDate, agentConfig) {
  const origin = recommendations.origin;
  const destination = recommendations.destination;
  const waypoints = recommendations.waypoints || [];

  const events = [];
  let currentDate = new Date(startDate);

  // Event 1: Departure from origin
  events.push({
    start: [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate(), 9, 0],
    duration: { hours: 1 },
    title: `Depart: ${origin.name}`,
    description: `Start your ${agentConfig.name} road trip from ${origin.name} to ${destination.name}`,
    location: origin.name,
    geo: { lat: origin.latitude, lon: origin.longitude },
    categories: ['Travel', 'Road Trip'],
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    alarms: [{ action: 'display', trigger: { hours: 2, before: true }, description: 'Pack and prepare for departure' }]
  });

  // Events for each waypoint city
  waypoints.forEach((city, index) => {
    // Advance date
    currentDate.setDate(currentDate.getDate() + (index > 0 ? 1 : 0));

    // Arrival event
    events.push({
      start: [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate(), 15, 0],
      duration: { hours: 1 },
      title: `Arrive: ${city.name}`,
      description: city.description || `Explore ${city.name}`,
      location: city.name,
      geo: city.latitude && city.longitude ? { lat: city.latitude, lon: city.longitude } : undefined,
      categories: ['Travel', 'Road Trip'],
      status: 'CONFIRMED'
    });

    // Activities in the city
    if (city.activities && city.activities.length > 0) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);

      city.activities.slice(0, 3).forEach((activity, actIndex) => {
        const activityName = typeof activity === 'string' ? activity : (activity.name || activity.activity || 'Activity');
        const startHour = 10 + (actIndex * 3);

        events.push({
          start: [nextDay.getFullYear(), nextDay.getMonth() + 1, nextDay.getDate(), startHour, 0],
          duration: { hours: 2 },
          title: `Activity: ${activityName}`,
          description: `${activityName} in ${city.name}`,
          location: city.name,
          geo: city.latitude && city.longitude ? { lat: city.latitude, lon: city.longitude } : undefined,
          categories: ['Activity', agentConfig.name],
          status: 'TENTATIVE'
        });
      });
    }
  });

  // Final event: Arrival at destination
  currentDate.setDate(currentDate.getDate() + 1);
  events.push({
    start: [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate(), 18, 0],
    duration: { hours: 1 },
    title: `Arrive: ${destination.name}`,
    description: `Complete your ${agentConfig.name} road trip`,
    location: destination.name,
    geo: { lat: destination.latitude, lon: destination.longitude },
    categories: ['Travel', 'Road Trip'],
    status: 'CONFIRMED',
    busyStatus: 'BUSY'
  });

  return events;
}

// Helper: Generate rich HTML description for city in KML
function generateCityKMLDescription(city, stopNumber) {
  let html = `<h3>Stop ${stopNumber}: ${city.name}</h3>`;

  if (city.description) {
    html += `<p><strong>About:</strong> ${city.description}</p>`;
  }

  if (city.duration) {
    html += `<p><strong>Duration:</strong> ${city.duration}</p>`;
  }

  if (city.activities && city.activities.length > 0) {
    html += `<p><strong>Activities:</strong></p><ul>`;
    city.activities.slice(0, 5).forEach(activity => {
      const actName = typeof activity === 'string' ? activity : (activity.name || activity.activity || 'Activity');
      html += `<li>${actName}</li>`;
    });
    html += `</ul>`;
  }

  if (city.imageUrl || city.image) {
    const imgUrl = city.imageUrl || city.image;
    html += `<br><img src="${imgUrl}" width="300" style="max-width:100%;height:auto;" />`;
  }

  html += `<p><em>Crafted by Waycraft - https://waycraft.com</em></p>`;

  return html;
}

// Helper: Generate GeoJSON for KML conversion
function generateGeoJSON(recommendations, agentConfig) {
  const origin = recommendations.origin;
  const destination = recommendations.destination;
  const waypoints = recommendations.waypoints || [];

  const features = [];

  // Add origin
  features.push({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [origin.longitude, origin.latitude]
    },
    properties: {
      name: `🏁 Start: ${origin.name}`,
      description: `<h3>Trip Origin</h3><p>Your ${agentConfig.name} journey begins here!</p>`,
      'marker-color': '#22c55e',
      'marker-size': 'large',
      'marker-symbol': 'star'
    }
  });

  // Add waypoints
  waypoints.forEach((city, index) => {
    const description = generateCityKMLDescription(city, index + 1);

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [city.longitude, city.latitude]
      },
      properties: {
        name: `📍 Stop ${index + 1}: ${city.name}`,
        description: description,
        'marker-color': agentConfig.color || '#3b82f6',
        'marker-size': 'medium',
        'marker-symbol': (index + 1).toString()
      }
    });
  });

  // Add destination
  features.push({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [destination.longitude, destination.latitude]
    },
    properties: {
      name: `🏁 End: ${destination.name}`,
      description: `<h3>Trip Destination</h3><p>Congratulations on completing your ${agentConfig.name} road trip!</p>`,
      'marker-color': '#ef4444',
      'marker-size': 'large',
      'marker-symbol': 'star'
    }
  });

  // Add route line connecting all points
  const coordinates = [
    [origin.longitude, origin.latitude],
    ...waypoints.map(w => [w.longitude, w.latitude]),
    [destination.longitude, destination.latitude]
  ];

  features.push({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordinates
    },
    properties: {
      name: 'Route',
      description: `${origin.name} to ${destination.name}`,
      stroke: agentConfig.color || '#3b82f6',
      'stroke-width': 4,
      'stroke-opacity': 0.7
    }
  });

  return {
    type: 'FeatureCollection',
    features: features
  };
}

// GET /api/export/gpx - Generate GPX file for GPS devices
app.get('/api/export/gpx', async (req, res) => {
  try {
    const spotlightData = req.query.data ? JSON.parse(decodeURIComponent(req.query.data)) : null;

    if (!spotlightData || !spotlightData.agentResults) {
      return res.status(400).json({ error: 'Route data required' });
    }

    // Get the first agent's route (or specific agent if provided)
    const agentIndex = parseInt(req.query.agentIndex) || 0;
    const agentResult = spotlightData.agentResults[agentIndex];
    const recommendations = JSON.parse(agentResult.recommendations);

    // Generate GPX XML
    const gpx = generateGPX(recommendations, agentResult.agentConfig);

    // Set headers for download
    const filename = `waycraft-${recommendations.destination.name.toLowerCase().replace(/\s+/g, '-')}.gpx`;
    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(gpx);

    console.log(`✅ GPX export: ${filename}`);

  } catch (error) {
    console.error('❌ GPX export error:', error);
    res.status(500).json({ error: 'Failed to generate GPX file', message: error.message });
  }
});

// GET /api/export/ics - Generate iCalendar file
app.get('/api/export/ics', async (req, res) => {
  try {
    const spotlightData = req.query.data ? JSON.parse(decodeURIComponent(req.query.data)) : null;

    if (!spotlightData || !spotlightData.agentResults) {
      return res.status(400).json({ error: 'Route data required' });
    }

    const agentIndex = parseInt(req.query.agentIndex) || 0;
    const agentResult = spotlightData.agentResults[agentIndex];
    const recommendations = JSON.parse(agentResult.recommendations);

    // Get trip dates (default to 1 week from now)
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Generate calendar events
    const events = generateCalendarEvents(recommendations, startDate, agentResult.agentConfig);

    // Create ICS file
    const { error, value } = ics.createEvents(events);

    if (error) {
      throw new Error('Failed to create calendar events: ' + error);
    }

    // Send file
    const filename = `waycraft-${recommendations.destination.name.toLowerCase().replace(/\s+/g, '-')}.ics`;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(value);

    console.log(`✅ ICS export: ${filename}`);

  } catch (error) {
    console.error('❌ ICS export error:', error);
    res.status(500).json({ error: 'Failed to generate calendar file', message: error.message });
  }
});

// GET /api/export/kml - Generate KML file for Google Earth/Maps
app.get('/api/export/kml', async (req, res) => {
  try {
    const spotlightData = req.query.data ? JSON.parse(decodeURIComponent(req.query.data)) : null;

    if (!spotlightData || !spotlightData.agentResults) {
      return res.status(400).json({ error: 'Route data required' });
    }

    const agentIndex = parseInt(req.query.agentIndex) || 0;
    const agentResult = spotlightData.agentResults[agentIndex];
    const recommendations = JSON.parse(agentResult.recommendations);

    // Create GeoJSON for tokml
    const geojson = generateGeoJSON(recommendations, agentResult.agentConfig);

    // Convert to KML
    const kml = tokml(geojson, {
      name: 'name',
      description: 'description',
      documentName: `${recommendations.origin.name} to ${recommendations.destination.name}`,
      documentDescription: `Road trip route crafted by Waycraft (${agentResult.agentConfig.name})`
    });

    // Send file
    const filename = `waycraft-${recommendations.destination.name.toLowerCase().replace(/\s+/g, '-')}.kml`;
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(kml);

    console.log(`✅ KML export: ${filename}`);

  } catch (error) {
    console.error('❌ KML export error:', error);
    res.status(500).json({ error: 'Failed to generate KML file', message: error.message });
  }
});

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
    const { agent, origin, destination, waypoints, nightAllocations = {} } = req.body;

    if (!agent || !origin || !destination) {
      return res.status(400).json({ error: 'Agent, origin, and destination are required' });
    }

    const agentConfig = agents[agent];
    if (!agentConfig) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }

    // Log night allocations if provided
    if (Object.keys(nightAllocations).length > 0) {
      console.log('📦 Night allocations for itinerary generation:', nightAllocations);
    }

    const itinerary = await generateDetailedItinerary(agentConfig, origin, destination, waypoints, nightAllocations);

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

async function generateDetailedItinerary(agent, origin, destination, waypoints, nightAllocations = {}) {
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const waypointNames = waypoints ? waypoints.map(w => w.name).join(', ') : '';

      // Build night allocation info for prompt
      let nightInfo = '';
      if (Object.keys(nightAllocations).length > 0) {
        nightInfo = '\n\nDURATION ALLOCATION:\n';
        if (waypoints && waypoints.length > 0) {
          waypoints.forEach(w => {
            const cityName = w.name || w.city;
            const nights = nightAllocations[cityName] || 2;
            nightInfo += `- ${cityName}: ${nights} ${nights === 1 ? 'night' : 'nights'}\n`;
          });
        }
        const destNights = nightAllocations[destination] || 3;
        nightInfo += `- ${destination} (destination): ${destNights} ${destNights === 1 ? 'night' : 'nights'}\n`;
        nightInfo += '\nPlease create a day-by-day itinerary that respects these night allocations for each city.';
      }

      const prompt = `${agent.prompt}

Create a detailed day-by-day itinerary for a road trip from ${origin} to ${destination}.
${waypoints && waypoints.length > 0 ? `Include these waypoints: ${waypointNames}` : ''}${nightInfo}

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

// Helper function to remove accents from strings
function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Helper function to get English city name variations
function getCityNameVariations(city) {
  const variations = [city];

  // Known translations
  const translations = {
    'Sevilla': 'Seville',
    'Seville': 'Sevilla',
    'München': 'Munich',
    'Munich': 'München',
    'Firenze': 'Florence',
    'Florence': 'Firenze',
    'Venezia': 'Venice',
    'Venice': 'Venezia',
    'Roma': 'Rome',
    'Rome': 'Roma',
    'Milano': 'Milan',
    'Milan': 'Milano',
    'Lisboa': 'Lisbon',
    'Lisbon': 'Lisboa',
    'København': 'Copenhagen',
    'Copenhagen': 'København'
  };

  if (translations[city]) {
    variations.push(translations[city]);
  }

  // Add version without accents
  const withoutAccents = removeAccents(city);
  if (withoutAccents !== city) {
    variations.push(withoutAccents);
  }

  return variations;
}

// Helper function to get city images from Wikimedia with Unsplash fallback
async function getCityImages(city, country) {
  console.log(`🔍 [IMAGE FETCH] Starting image search for: "${city}", ${country || 'no country'}`);

  const cityVariations = getCityNameVariations(city);
  console.log(`📋 [IMAGE FETCH] City name variations to try: ${cityVariations.join(', ')}`);

  // Try Wikipedia with all variations
  for (const cityVariation of cityVariations) {
    // Try with country first
    if (country) {
      try {
        const searchTerm = `${cityVariation}, ${country}`;
        console.log(`🌐 [WIKIPEDIA] Attempt 1: Trying "${searchTerm}"`);
        const searchResponse = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(searchTerm));

        if (searchResponse.data.originalimage && searchResponse.data.originalimage.source) {
          console.log(`✅ [WIKIPEDIA] SUCCESS! Found image for "${searchTerm}"`);
          console.log(`📸 [WIKIPEDIA] Image URL: ${searchResponse.data.originalimage.source}`);
          return searchResponse.data.originalimage.source;
        } else {
          console.log(`⚠️  [WIKIPEDIA] No image in response for "${searchTerm}"`);
        }
      } catch (error) {
        console.log(`❌ [WIKIPEDIA] Error for "${cityVariation}, ${country}": ${error.response?.status} ${error.message}`);
      }
    }

    // Try without country
    try {
      console.log(`🌐 [WIKIPEDIA] Attempt 2: Trying "${cityVariation}" (no country)`);
      const fallbackResponse = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(cityVariation));
      if (fallbackResponse.data.originalimage && fallbackResponse.data.originalimage.source) {
        console.log(`✅ [WIKIPEDIA] SUCCESS! Found image for "${cityVariation}" (no country)`);
        console.log(`📸 [WIKIPEDIA] Image URL: ${fallbackResponse.data.originalimage.source}`);
        return fallbackResponse.data.originalimage.source;
      } else {
        console.log(`⚠️  [WIKIPEDIA] No image in response for "${cityVariation}"`);
      }
    } catch (error) {
      console.log(`❌ [WIKIPEDIA] Error for "${cityVariation}": ${error.response?.status} ${error.message}`);
    }
  }

  console.log(`⚠️  [WIKIPEDIA] All Wikipedia attempts failed for ${city}`);

  // If Wikipedia fails, fall back to Unsplash API
  console.log(`🔄 [UNSPLASH] Trying Unsplash API for "${city}"`);
  try {
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
      console.log(`✅ [UNSPLASH] SUCCESS! Found image for "${city}"`);
      console.log(`📸 [UNSPLASH] Image URL: ${unsplashResponse.data.results[0].urls.regular}`);
      return unsplashResponse.data.results[0].urls.regular;
    } else {
      console.log(`⚠️  [UNSPLASH] No results for "${city}"`);
    }
  } catch (error) {
    console.error(`❌ [UNSPLASH] API error for ${city}:`, error.response?.status, error.message);
  }

  // Final fallback to Unsplash source (dynamic, no API key needed)
  console.warn(`⚠️  [FALLBACK] Using Unsplash source fallback for "${city}"`);
  const fallbackUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(city)},cityscape`;
  console.log(`📸 [FALLBACK] Fallback URL: ${fallbackUrl}`);
  return fallbackUrl;
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

// ==================== AI AGENT ENDPOINT ====================

// Initialize Agent Orchestrator
const AgentOrchestrator = require('./server/services/AgentOrchestrator');
const agentOrchestrator = new AgentOrchestrator();

/**
 * POST /api/agent/query
 * Main endpoint for AI agent queries
 * Handles streaming responses with Server-Sent Events (SSE)
 */
app.post('/api/agent/query', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId, pageContext, routeId, itineraryId } = req.body;
    const userId = req.user?.id || null;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 [BACKEND] /api/agent/query RECEIVED');
    console.log('   🔑 Authorization header:', req.headers.authorization ? `Bearer ${req.headers.authorization.substring(7, 27)}...` : 'NOT PROVIDED');
    console.log('   👤 req.user:', req.user ? `{id: ${req.user.id}, email: ${req.user.email}}` : 'NULL (optionalAuth failed to populate)');
    console.log('   User ID:', userId || 'anonymous');
    console.log('   Session ID:', sessionId);
    console.log('   Route ID:', routeId);
    console.log('   Itinerary ID:', itineraryId);
    console.log('   Page Context:', pageContext);
    console.log('   Message:', message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.log('❌ [BACKEND] Validation failed: empty message');
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    if (!sessionId) {
      console.log('❌ [BACKEND] Validation failed: no session ID');
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    console.log('✅ [BACKEND] Validation passed');

    // Set up Server-Sent Events (SSE) for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx

    // Disable any socket timeout to keep connection alive
    if (req.socket) {
      req.socket.setTimeout(0);
      console.log('📡 [BACKEND] Socket timeout disabled');
    }

    // Flush headers immediately to establish SSE connection
    res.flushHeaders();

    console.log('📡 [BACKEND] SSE headers set and flushed');

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
    // Flush immediately after write to ensure client receives it
    if (typeof res.flush === 'function') res.flush();
    console.log('📤 [BACKEND] Sent and flushed "connected" event');

    // Track if client is still connected
    let clientConnected = true;

    // Keep connection alive with heartbeat
    let heartbeatInterval = setInterval(() => {
      try {
        // Send SSE comment to keep connection alive
        res.write(': heartbeat\n\n');
        if (typeof res.flush === 'function') res.flush();
        console.log('💓 [BACKEND] Sent heartbeat');
      } catch (error) {
        console.log('❌ [BACKEND] Heartbeat failed (client truly disconnected), clearing interval');
        clearInterval(heartbeatInterval);
      }
    }, 15000); // Every 15 seconds

    // Handle client disconnect - DON'T end response yet, let orchestrator finish
    // NOTE: req.on('close') fires prematurely on Heroku due to proxy behavior
    // We rely on write errors (in streamHandler) to detect real disconnects
    req.on('close', () => {
      console.log('🔌 [BACKEND] Client close event fired (may be false positive from proxy)');
      clearInterval(heartbeatInterval);
      // DON'T set clientConnected = false here - causes premature event skipping
      // Let write errors in streamHandler detect real disconnects
    });

    // Stream handler - send tokens to client in real-time
    let streamEventCount = 0;
    const streamHandler = (event) => {
      // Skip if client already disconnected
      if (!clientConnected) {
        console.log(`⏭️  [BACKEND] Skipping event #${streamEventCount + 1} (client disconnected):`, event.type);
        return;
      }

      try {
        streamEventCount++;
        console.log(`📤 [BACKEND] Streaming event #${streamEventCount}:`, event.type);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        // Flush immediately to prevent buffering
        if (typeof res.flush === 'function') res.flush();
      } catch (error) {
        console.error('❌ [BACKEND] Error writing to stream:', error.message);
        clientConnected = false; // Mark as disconnected on write error
      }
    };

    console.log('🔄 [BACKEND] Calling agentOrchestrator.handleQuery...');

    // Call agent orchestrator with streaming
    const response = await agentOrchestrator.handleQuery({
      userId: userId,
      routeId: routeId || null,
      itineraryId: itineraryId || null,
      message: message.trim(),
      sessionId: sessionId,
      pageContext: pageContext || 'unknown',
      onStream: streamHandler
    });

    console.log('✅ [BACKEND] agentOrchestrator.handleQuery completed');
    console.log('   Response content length:', response.content?.length || 0);
    console.log('   Tool calls:', response.toolCalls?.length || 0);

    // Send final response
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      content: response.content,
      toolCalls: response.toolCalls?.length || 0,
      timestamp: new Date().toISOString()
    })}\n\n`);
    // Flush the final event
    if (typeof res.flush === 'function') res.flush();

    console.log('📤 [BACKEND] Sent and flushed "complete" event');

    res.end();
    console.log('🏁 [BACKEND] SSE stream ended');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Agent query error:', error.message);
    console.error(error.stack);

    // Try to send error via SSE if connection still open
    try {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'An error occurred processing your request. Please try again.',
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    } catch {
      // If SSE not set up yet, send JSON error
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to process agent query',
          message: error.message
        });
      }
    }
  }
});

/**
 * GET /api/agent/history/:sessionId
 * Get conversation history for a session
 */
app.get('/api/agent/history/:sessionId', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || null;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Get conversation history
    const history = await pool.query(
      `SELECT
        am.id,
        am.role,
        am.content,
        am.tool_calls,
        am.tool_results,
        am.created_at
       FROM agent_messages am
       INNER JOIN agent_conversations ac ON am.conversation_id = ac.id
       WHERE ac.session_id = $1
       AND (ac.user_id = $2 OR $2 IS NULL)
       ORDER BY am.created_at ASC`,
      [sessionId, userId]
    );

    res.json({
      success: true,
      sessionId: sessionId,
      messageCount: history.rows.length,
      messages: history.rows.map(row => ({
        id: row.id,
        role: row.role,
        content: row.content,
        toolCalls: row.tool_calls,
        toolResults: row.tool_results,
        timestamp: row.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching agent history:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation history'
    });
  }
});

// ==================== END AI AGENT ENDPOINT ====================

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

// City Image Service with Database + Google Places Caching
app.get('/api/places/city-image', async (req, res) => {
  try {
    const { city, country } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'City name is required' });
    }

    console.log(`🖼️ Fetching image for city: ${city}${country ? `, ${country}` : ''}`);

    // Step 1: Check database cache first
    const cacheQuery = `
      SELECT image_url, source, created_at
      FROM city_images
      WHERE LOWER(city_name) = LOWER($1)
      ${country ? 'AND LOWER(country) = LOWER($2)' : ''}
      LIMIT 1
    `;
    const cacheParams = country ? [city, country] : [city];

    const cacheResult = await pool.query(cacheQuery, cacheParams);

    // Check if cache exists and is not expired (30 days)
    if (cacheResult.rows.length > 0) {
      const cached = cacheResult.rows[0];
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      if (cacheAge < thirtyDaysMs) {
        console.log(`✅ Cache hit for ${city} (source: ${cached.source}, age: ${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days)`);
        return res.json({
          imageUrl: cached.image_url,
          source: cached.source,
          cached: true
        });
      } else {
        console.log(`⏰ Cache expired for ${city} (age: ${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days)`);
      }
    }

    // Step 2: Cache miss or expired - fetch from Google Places API
    console.log(`🌐 Fetching from Google Places API for ${city}`);

    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ Google Places API key not configured');
      return res.status(500).json({ error: 'Google Places API not configured' });
    }

    // Text Search to get place_id
    const searchQuery = country ? `${city}, ${country}` : city;
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&type=locality&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await axios.get(textSearchUrl);

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      console.log(`❌ No results from Google Places for ${city}`);
      return res.json({ imageUrl: null, source: null, cached: false });
    }

    const place = searchResponse.data.results[0];

    // Check if place has photos
    if (!place.photos || place.photos.length === 0) {
      console.log(`📷 No photos available for ${city}`);
      return res.json({ imageUrl: null, source: null, cached: false });
    }

    // Get the first photo reference
    const photo = place.photos[0];
    const photoReference = photo.photo_reference;
    const photoWidth = photo.width || 400;
    const photoHeight = photo.height || 300;

    // Construct Google Places Photo URL (maxwidth=400 for performance)
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;

    console.log(`✅ Found image for ${city} from Google Places`);

    // Step 3: Save to database cache
    try {
      const insertQuery = `
        INSERT INTO city_images (city_name, country, image_url, photo_reference, source, width, height)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (city_name, country)
        DO UPDATE SET
          image_url = EXCLUDED.image_url,
          photo_reference = EXCLUDED.photo_reference,
          source = EXCLUDED.source,
          width = EXCLUDED.width,
          height = EXCLUDED.height,
          updated_at = CURRENT_TIMESTAMP
      `;

      await pool.query(insertQuery, [
        city,
        country || null,
        photoUrl,
        photoReference,
        'google-places',
        photoWidth,
        photoHeight
      ]);

      console.log(`💾 Cached image for ${city} in database`);
    } catch (dbError) {
      console.error('⚠️ Failed to cache image in database:', dbError.message);
      // Continue anyway - we have the image URL
    }

    // Return the photo URL
    res.json({
      imageUrl: photoUrl,
      source: 'google-places',
      cached: false
    });

  } catch (error) {
    console.error('❌ City image error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch city image',
      message: error.message
    });
  }
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
// NOTE: coordinates array format is [lat, lng] not [lng, lat]
function calculateTotalDistance(coordinates) {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const point1 = { lat: coordinates[i][0], lng: coordinates[i][1] };
    const point2 = { lat: coordinates[i+1][0], lng: coordinates[i+1][1] };
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
 * POST /api/cities/details/async
 * Start background job to generate city details
 * Body: { cityName: "Lyon", country: "France" }
 * Returns: { jobId: "abc123", status: "processing" }
 */
app.post('/api/cities/details/async', async (req, res) => {
  const startTime = Date.now();

  try {
    const { cityName, country } = req.body;

    if (!cityName) {
      return res.status(400).json({
        success: false,
        error: 'City name is required'
      });
    }

    console.log(`📍 Async city details requested: ${cityName}${country ? `, ${country}` : ''}`);

    // Check if city details exist in database (cache)
    const cacheCheckStart = Date.now();
    const cachedResult = await db.query(
      'SELECT * FROM city_details WHERE LOWER(city_name) = LOWER($1)',
      [cityName]
    );
    const cacheCheckTime = Date.now() - cacheCheckStart;

    if (cachedResult.rows.length > 0) {
      const totalTime = Date.now() - startTime;
      console.log(`✅ Cache HIT for ${cityName} - cache check: ${cacheCheckTime}ms, total: ${totalTime}ms`);
      return res.json({
        success: true,
        cached: true,
        status: 'complete',
        data: cachedResult.rows[0],
        timing: {
          total: totalTime,
          cacheCheck: cacheCheckTime
        }
      });
    }

    console.log(`🔍 Cache MISS for ${cityName} - cache check: ${cacheCheckTime}ms`);

    // Not cached - create background job
    const jobId = `city_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    cityDetailsJobs.set(jobId, {
      id: jobId,
      cityName,
      country,
      status: 'processing',
      progress: 0,
      createdAt: Date.now(),
      result: null,
      error: null
    });

    console.log(`🚀 Created background job ${jobId} for ${cityName}`);

    // Start background processing (don't await)
    processCityDetailsJobAsync(jobId, cityName, country);

    res.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'City details generation started'
    });

  } catch (error) {
    console.error('❌ Async city details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start city details job',
      message: error.message
    });
  }
});

/**
 * GET /api/cities/details/job/:jobId
 * Check status of background job
 * Returns: { status: "processing" | "complete" | "failed", data?: {...}, error?: "..." }
 */
app.get('/api/cities/details/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = cityDetailsJobs.get(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        message: 'Job may have expired or never existed'
      });
    }

    if (job.status === 'complete') {
      return res.json({
        success: true,
        status: 'complete',
        data: job.result
      });
    }

    if (job.status === 'failed') {
      return res.json({
        success: false,
        status: 'failed',
        error: job.error
      });
    }

    // Still processing - but may have partial data (Phase 1)
    res.json({
      success: true,
      status: 'processing',
      progress: job.progress,
      message: job.message || 'Generating city details...',
      data: job.result || null // Include Phase 1 data if available
    });

  } catch (error) {
    console.error('❌ Job status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
      message: error.message
    });
  }
});

/**
 * POST /api/city-activities/update-nights
 * Update nights for a city (MVP: No full regeneration, just acknowledgment)
 * Full activity regeneration happens in Spotlight
 */
app.post('/api/city-activities/update-nights', async (req, res) => {
  try {
    const {
      city,
      country,
      nights,
      theme = 'best-overall',
      budget = 'mid'
    } = req.body;

    // Validation
    if (!city) {
      return res.status(400).json({
        error: 'Missing required field: city'
      });
    }

    if (nights === undefined || nights < 0 || nights > 14) {
      return res.status(400).json({
        error: 'Nights must be between 0 and 14'
      });
    }

    console.log(`🔄 Updating nights for ${city}${country ? `, ${country}` : ''} to ${nights} nights (${theme} theme)`);

    // MVP: Return success without full regeneration
    // Activities will be regenerated in Spotlight when user views the itinerary
    if (nights === 0) {
      return res.json({
        success: true,
        city,
        country,
        nights: 0,
        message: `${city} marked as pass-through (0 nights)`,
        note: 'Full itinerary will be generated in Spotlight'
      });
    }

    res.json({
      success: true,
      city,
      country,
      nights,
      days: nights + 1,
      message: `Updated ${city} to ${nights} ${nights === 1 ? 'night' : 'nights'}`,
      note: 'Full itinerary will be generated in Spotlight'
    });

  } catch (error) {
    console.error('❌ Night update failed:', error);
    res.status(500).json({
      error: 'Failed to update nights',
      details: error.message
    });
  }
});

/**
 * POST /api/itinerary/regenerate-city
 * Regenerate FULL schedule for a city (activities, hotels, restaurants)
 * This is an expensive operation used when user edits nights in Spotlight
 */
app.post('/api/itinerary/regenerate-city', async (req, res) => {
  try {
    const {
      city,
      country,
      nights,
      theme = 'best-overall',
      budget = 'mid',
      coordinates,
      previousCity,
      nextCity
    } = req.body;

    // Validation
    if (!city) {
      return res.status(400).json({
        error: 'Missing required field: city'
      });
    }

    if (nights === undefined || nights < 1 || nights > 14) {
      return res.status(400).json({
        error: 'Nights must be between 1 and 14'
      });
    }

    console.log(`🔄 FULL schedule regeneration for ${city}${country ? `, ${country}` : ''} - ${nights} nights`);
    console.log(`   Theme: ${theme}, Budget: ${budget}`);
    if (previousCity) console.log(`   Previous city: ${previousCity}`);
    if (nextCity) console.log(`   Next city: ${nextCity}`);

    const days = nights + 1;

    // MVP: Return structured response that client can use
    // Full implementation would call ItineraryAgentOrchestrator here
    const schedule = {
      city,
      country,
      nights,
      days,
      activities: generatePlaceholderActivities(city, days),
      hotels: generatePlaceholderHotels(city, budget),
      restaurants: generatePlaceholderRestaurants(city, days, budget),
      note: 'MVP: Placeholder data. Full orchestrator integration coming soon.'
    };

    console.log(`✓ Generated ${days}-day schedule for ${city}`);

    res.json({
      success: true,
      schedule,
      message: `Generated ${nights}-night schedule for ${city}`,
      metadata: {
        regeneratedAt: new Date().toISOString(),
        theme,
        budget,
        days
      }
    });

  } catch (error) {
    console.error('❌ Schedule regeneration failed:', error);
    res.status(500).json({
      error: 'Failed to regenerate schedule',
      details: error.message
    });
  }
});

// Helper functions for MVP placeholder data
function generatePlaceholderActivities(city, days) {
  const activities = [];
  for (let day = 1; day <= days; day++) {
    activities.push({
      day,
      time: '09:00',
      title: `Explore ${city} - Day ${day}`,
      description: `Discover the highlights of ${city}`,
      type: 'activity'
    });
    activities.push({
      day,
      time: '14:00',
      title: `Afternoon in ${city}`,
      description: `Continue exploring ${city}`,
      type: 'activity'
    });
  }
  return activities;
}

function generatePlaceholderHotels(city, budget) {
  return [
    {
      name: `Hotel in ${city}`,
      type: budget === 'luxury' ? '5-star' : budget === 'comfort' ? '4-star' : '3-star',
      price: budget === 'luxury' ? 200 : budget === 'comfort' ? 100 : 50
    }
  ];
}

function generatePlaceholderRestaurants(city, days, budget) {
  return [
    {
      name: `Restaurant in ${city}`,
      cuisine: 'Local',
      priceRange: budget === 'luxury' ? '$$$' : budget === 'comfort' ? '$$' : '$'
    }
  ];
}

/**
 * PHASE 5: Regenerate full itinerary with new night allocations
 * POST /api/itinerary/:id/regenerate
 *
 * When user edits trip duration in Spotlight, regenerate the entire itinerary
 * with new night allocations using the full ItineraryAgentOrchestrator
 */
app.post('/api/itinerary/:id/regenerate', async (req, res) => {
  try {
    const { nightAllocations, agent, origin, destination, waypoints } = req.body;
    const itineraryId = req.params.id;

    console.log(`🔄 FULL ITINERARY REGENERATION - ID: ${itineraryId}`);
    console.log(`   Agent: ${agent}`);
    console.log(`   Route: ${origin} → ${destination}`);
    console.log(`   Night allocations:`, nightAllocations);

    // Validation
    if (!agent || !origin || !destination) {
      return res.status(400).json({
        error: 'Missing required fields: agent, origin, destination'
      });
    }

    if (!nightAllocations || Object.keys(nightAllocations).length === 0) {
      return res.status(400).json({
        error: 'Missing night allocations'
      });
    }

    // Get agent config
    const agentConfig = agents[agent];
    if (!agentConfig) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }

    // Generate new itinerary with updated night allocations
    console.log('🚀 Calling generateDetailedItinerary with new night allocations...');
    const newItinerary = await generateDetailedItinerary(
      agentConfig,
      origin,
      destination,
      waypoints,
      nightAllocations
    );

    // Add ID to match the expected format
    newItinerary.id = itineraryId;

    console.log(`✅ Itinerary regenerated successfully - ${newItinerary.dayStructure?.days?.length || 0} days`);

    res.json({
      success: true,
      itinerary: newItinerary,
      message: 'Itinerary regenerated with new night allocations'
    });
  } catch (error) {
    console.error('❌ Itinerary regeneration failed:', error);
    res.status(500).json({
      error: 'Failed to regenerate itinerary',
      details: error.message
    });
  }
});

// Background processor for city details jobs
async function processCityDetailsJobAsync(jobId, cityName, country) {
  const startTime = Date.now();
  const JOB_TIMEOUT = 2 * 60 * 1000; // 2 minutes max

  try {
    const job = cityDetailsJobs.get(jobId);
    if (!job) return;

    console.log(`⚙️  Processing job ${jobId} for ${cityName}...`);

    job.status = 'processing';
    job.progress = 10;
    job.message = 'Getting basic city info...';

    // ========== PHASE 1: QUICK GENERATION (5-10 seconds) ==========
    const phase1Start = Date.now();
    console.log(`🚀 Phase 1: Quick generation for ${cityName} - Starting at ${new Date().toISOString()}`);
    const quickDetails = await Promise.race([
      retryWithBackoff(
        () => generateCityDetailsQuick(cityName, country),
        2, // Max 2 attempts
        `Phase 1 (Quick) for ${cityName}`
      ),
      // Phase 1 timeout
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Phase 1 took too long (60s timeout)'));
        }, 60000);
      })
    ]);

    const phase1Duration = Date.now() - phase1Start;
    console.log(`✅ Phase 1 complete for ${cityName} in ${phase1Duration}ms (${(phase1Duration/1000).toFixed(2)}s)`);

    job.progress = 40;
    job.message = 'Saving basic info...';

    // Save Phase 1 data to database
    await db.query(`
      INSERT INTO city_details (
        city_name, country, tagline, main_image_url, rating, recommended_duration,
        why_visit, best_for, highlights, restaurants, accommodations,
        parking_info, parking_difficulty, environmental_zones, best_time_to_visit,
        events_festivals, local_tips, warnings, weather_overview, latitude, longitude,
        generation_phase
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (city_name) DO UPDATE SET
        country = EXCLUDED.country,
        tagline = EXCLUDED.tagline,
        main_image_url = EXCLUDED.main_image_url,
        rating = EXCLUDED.rating,
        recommended_duration = EXCLUDED.recommended_duration,
        why_visit = EXCLUDED.why_visit,
        best_for = EXCLUDED.best_for,
        highlights = EXCLUDED.highlights,
        weather_overview = EXCLUDED.weather_overview,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        generation_phase = EXCLUDED.generation_phase,
        updated_at = CURRENT_TIMESTAMP
    `, [
      cityName,
      quickDetails.country,
      quickDetails.tagline,
      quickDetails.mainImageUrl,
      quickDetails.rating,
      quickDetails.recommendedDuration,
      quickDetails.whyVisit,
      JSON.stringify(quickDetails.bestFor),
      JSON.stringify(quickDetails.highlights),
      JSON.stringify(quickDetails.restaurants),
      JSON.stringify(quickDetails.accommodations),
      quickDetails.parking?.info,
      quickDetails.parking?.difficulty,
      JSON.stringify(quickDetails.environmentalZones),
      JSON.stringify(quickDetails.bestTimeToVisit),
      JSON.stringify(quickDetails.eventsFestivals),
      JSON.stringify(quickDetails.localTips),
      JSON.stringify(quickDetails.warnings),
      quickDetails.weatherOverview,
      quickDetails.coordinates?.latitude,
      quickDetails.coordinates?.longitude,
      'quick' // Phase 1 marker
    ]);

    // Update job with Phase 1 data (user can see this immediately)
    job.result = quickDetails;
    job.progress = 50;
    job.message = 'Getting detailed info...';

    console.log(`✅ Phase 1 complete for ${cityName}, starting Phase 2 (parallel agents)...`);

    // ========== PHASE 2: PARALLEL AGENTS (5-8 seconds total) ==========
    const phase2Start = Date.now();
    console.log(`🚀 Phase 2: Launching 4 parallel agents for ${cityName} - Starting at ${new Date().toISOString()}`);

    // Launch all 4 agents in PARALLEL with Promise.allSettled (one failure doesn't break others)
    const agentResults = await Promise.allSettled([
      generateRestaurants(cityName, quickDetails.country).catch(err => {
        console.error(`Agent 1 (Restaurants) error:`, err);
        return [];
      }),
      generateAccommodations(cityName, quickDetails.country).catch(err => {
        console.error(`Agent 2 (Accommodations) error:`, err);
        return [];
      }),
      generatePracticalInfo(cityName, quickDetails.country).catch(err => {
        console.error(`Agent 3 (Practical Info) error:`, err);
        return { parking: null, environmentalZones: null, bestTimeToVisit: null };
      }),
      generateEventsAndTips(cityName, quickDetails.country).catch(err => {
        console.error(`Agent 4 (Events & Tips) error:`, err);
        return { eventsFestivals: [], localTips: [], warnings: [] };
      })
    ]);

    const phase2Duration = Date.now() - phase2Start;
    const totalDuration = Date.now() - phase1Start;
    console.log(`✅ Phase 2 parallel agents complete for ${cityName} in ${phase2Duration}ms (${(phase2Duration/1000).toFixed(2)}s)`);
    console.log(`⏱️  Total generation time for ${cityName}: ${totalDuration}ms (${(totalDuration/1000).toFixed(2)}s)`);

    // Extract results (use default values if agent failed)
    const restaurants = agentResults[0].status === 'fulfilled' ? agentResults[0].value : [];
    const accommodations = agentResults[1].status === 'fulfilled' ? agentResults[1].value : [];
    const practicalInfo = agentResults[2].status === 'fulfilled' ? agentResults[2].value : { parking: null, environmentalZones: null, bestTimeToVisit: null };
    const eventsAndTips = agentResults[3].status === 'fulfilled' ? agentResults[3].value : { eventsFestivals: [], localTips: [], warnings: [] };

    job.progress = 90;
    job.message = 'Saving complete details...';

    // Update database with Phase 2 data (complete)
    await db.query(`
      UPDATE city_details SET
        restaurants = $2,
        accommodations = $3,
        parking_info = $4,
        parking_difficulty = $5,
        environmental_zones = $6,
        best_time_to_visit = $7,
        events_festivals = $8,
        local_tips = $9,
        warnings = $10,
        generation_phase = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE city_name = $1
    `, [
      cityName,
      JSON.stringify(restaurants),
      JSON.stringify(accommodations),
      practicalInfo.parking?.info,
      practicalInfo.parking?.difficulty,
      JSON.stringify(practicalInfo.environmentalZones),
      JSON.stringify(practicalInfo.bestTimeToVisit),
      JSON.stringify(eventsAndTips.eventsFestivals),
      JSON.stringify(eventsAndTips.localTips),
      JSON.stringify(eventsAndTips.warnings),
      'complete' // Phase 2 marker
    ]);

    // Merge Phase 1 + Phase 2 data for final result
    const fullDetails = {
      ...quickDetails,
      restaurants,
      accommodations,
      parking: practicalInfo.parking,
      environmentalZones: practicalInfo.environmentalZones,
      bestTimeToVisit: practicalInfo.bestTimeToVisit,
      eventsFestivals: eventsAndTips.eventsFestivals,
      localTips: eventsAndTips.localTips,
      warnings: eventsAndTips.warnings
    };

    job.status = 'complete';
    job.progress = 100;
    job.result = fullDetails;
    job.message = 'Complete!';

    console.log(`✅ Job ${jobId} completed successfully for ${cityName} (parallel agents: ${phase2Duration}ms)`);

  } catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error);
    const job = cityDetailsJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.progress = 0;

      // User-friendly error messages
      if (error.message.includes('timeout') || error.message.includes('took too long')) {
        job.error = `⏱️ Generation took too long. This city might have limited data. Please try again or choose a different city.`;
        job.errorType = 'timeout';
      } else if (error.message.includes('rate limit')) {
        job.error = `⏳ Too many requests. Please wait a moment and try again.`;
        job.errorType = 'rate_limit';
      } else if (error.message.includes('API') || error.message.includes('network')) {
        job.error = `🌐 Connection issue. Please check your internet and try again.`;
        job.errorType = 'network';
      } else if (error.message.includes('JSON') || error.message.includes('parse')) {
        job.error = `❌ Invalid data received. Please try again.`;
        job.errorType = 'data_error';
      } else {
        job.error = `❌ Failed to generate city details. ${error.message}`;
        job.errorType = 'unknown';
      }

      console.log(`💬 User-friendly error: ${job.error}`);
    }
  }
}

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
              // No website - use Wikipedia API fallback (like city hero images)
              console.log(`⚠️  No website for ${name}, trying Wikipedia API...`);
              try {
                // Try with full name + city first
                const searchTerm = city ? `${name}, ${city}` : name;
                console.log(`🔍 Wikipedia API query: "${searchTerm}"`);

                const wikiResponse = await axios.get(
                  'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(searchTerm),
                  { timeout: 5000 }
                );

                if (wikiResponse.data.originalimage && wikiResponse.data.originalimage.source) {
                  imageUrl = wikiResponse.data.originalimage.source;
                  source = 'wikipedia';
                  console.log(`✅ Found Wikipedia image for ${name}: ${imageUrl}`);
                } else {
                  // Try without city if we had one
                  if (city) {
                    console.log(`⚠️  No Wikipedia image with city, trying without city...`);
                    const fallbackResponse = await axios.get(
                      'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(name),
                      { timeout: 5000 }
                    );

                    if (fallbackResponse.data.originalimage && fallbackResponse.data.originalimage.source) {
                      imageUrl = fallbackResponse.data.originalimage.source;
                      source = 'wikipedia';
                      console.log(`✅ Found Wikipedia image without city for ${name}`);
                    } else {
                      // No Wikipedia image found - use gradient placeholder
                      imageUrl = null;
                      source = 'placeholder';
                      console.log(`⚠️  No Wikipedia image found, will use gradient placeholder`);
                    }
                  } else {
                    // No Wikipedia image found - use gradient placeholder
                    imageUrl = null;
                    source = 'placeholder';
                    console.log(`⚠️  No Wikipedia image found, will use gradient placeholder`);
                  }
                }
              } catch (wikiError) {
                console.log(`⚠️  Wikipedia API error for ${name}: ${wikiError.message}`);
                // Use gradient placeholder on error
                imageUrl = null;
                source = 'placeholder';
              }
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
            // Use gradient placeholder on error
            console.log(`⚠️  Using gradient placeholder for ${name} due to error`);
            return {
              name,
              imageUrl: null,
              source: 'placeholder'
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

// ==================== ERROR HANDLING & RETRY LOGIC ====================

/**
 * Retry wrapper with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {string} operationName - Name for logging
 * @returns {Promise<any>} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 2, operationName = 'operation') {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName}: Attempt ${attempt}/${maxRetries}`);
      const result = await fn();
      if (attempt > 1) {
        console.log(`✅ ${operationName}: Succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️  ${operationName}: Attempt ${attempt}/${maxRetries} failed:`, error.message);

      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s, etc.
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ ${operationName}: Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  console.error(`❌ ${operationName}: All ${maxRetries} attempts failed`);
  throw lastError;
}

// ==================== CITY DETAILS GENERATION ====================

/**
 * Generate detailed city information using Perplexity AI
 */
/**
 * Phase 1: Quick city details generation (5-10 seconds)
 * Returns basic information to show users immediately
 */
async function generateCityDetailsQuick(cityName, country) {
  const fullCityName = country ? `${cityName}, ${country}` : cityName;

  const prompt = `You are a travel expert creating a quick city overview for road trip travelers.

Research the following city using internet search and provide BASIC information quickly:

CITY: ${fullCityName}

Please search the internet and respond with a JSON object containing ONLY:

{
  "cityName": "${cityName}",
  "country": "Country name",
  "tagline": "One short compelling tagline (max 60 chars)",
  "whyVisit": "1-2 paragraph description of why this city is worth visiting. Include the vibe and what makes it unique.",
  "bestFor": ["🍷 Foodies", "🏛️ History buffs"],
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

  "weatherOverview": "Brief 2-3 sentence overview of typical weather by season.",

  "coordinates": {
    "latitude": 45.7640,
    "longitude": 4.8357
  }
}

IMPORTANT INSTRUCTIONS:
1. Search the internet for CURRENT information
2. Be SPECIFIC with names - no generic advice
3. Include 3-4 highlights ONLY
4. Ratings should be realistic (most cities 4.5-4.8 range)
5. Return ONLY valid JSON, no markdown formatting
6. Verify coordinates are accurate
7. Keep it FAST - we'll get detailed info later

Return the JSON object now:`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500, // Reduced for faster response
      temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });

    const content = response.data.choices[0].message.content;

    // Try to parse JSON from response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Perplexity response');
    }

    const cityData = JSON.parse(jsonMatch[0]);

    // Fetch city image from Wikipedia/Unsplash
    console.log(`🖼️  Fetching image for ${cityName}...`);
    const mainImageUrl = await getCityImages(cityName, cityData.country);

    // Return basic structure (Phase 1)
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
      restaurants: [], // Empty for Phase 1
      accommodations: [], // Empty for Phase 1
      parking: null, // Empty for Phase 1
      environmentalZones: null, // Empty for Phase 1
      bestTimeToVisit: null, // Empty for Phase 1
      eventsFestivals: [], // Empty for Phase 1
      localTips: [], // Empty for Phase 1
      warnings: [], // Empty for Phase 1
      weatherOverview: cityData.weatherOverview,
      coordinates: cityData.coordinates || null
    };

  } catch (error) {
    console.error('Perplexity API error (quick):', error.message);
    throw new Error(`Failed to generate quick city details: ${error.message}`);
  }
}

/**
 * Phase 2: Full city details generation (30-45 seconds)
 * Returns complete information with all details
 */
async function generateCityDetailsFull(cityName, country) {
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
      timeout: 60000 // 60 second timeout (background jobs can handle this)
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

// ==================== PHASE 2 PARALLEL AGENTS ====================
// These run independently and update the database as they complete

/**
 * Agent 1: Restaurants (5-8 seconds)
 * Finds best restaurants with real URLs and social proof
 */
async function generateRestaurants(cityName, country) {
  const fullCityName = country ? `${cityName}, ${country}` : cityName;

  const prompt = `Find the top 5-6 restaurants in ${fullCityName} for road trip travelers.

Research current information and return ONLY a JSON object:

{
  "restaurants": [
    {
      "name": "Restaurant name",
      "cuisine": "Cuisine type",
      "priceRange": "€€",
      "description": "One compelling sentence",
      "rating": 4.6,
      "specialty": "What they're famous for",
      "website": "Official website URL (or null)",
      "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=RestaurantName+${cityName}",
      "address": "Street address",
      "reviewCount": 250,
      "tripAdvisorRating": 4.5,
      "badges": ["Popular", "Local Favorite"]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. All restaurants must be REAL and currently operating
2. Include mix of price ranges: 2x €, 2x €€, 1-2x €€€
3. Include actual Google Maps search URLs
4. Website URLs must be real or null - NO fake URLs
5. Ratings and review counts must be realistic
6. Badges: Choose 0-2 from [Popular, Trending, Local Favorite, Michelin Guide, Hidden Gem]
7. Return ONLY valid JSON, no markdown
8. 5-6 restaurants total

Return JSON now:`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout (increased for reliability)
    });

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in restaurants response');

    const data = JSON.parse(jsonMatch[0]);
    console.log(`✅ Agent 1 (Restaurants): Generated ${data.restaurants?.length || 0} restaurants for ${cityName}`);
    return data.restaurants || [];

  } catch (error) {
    console.error(`❌ Agent 1 (Restaurants) failed for ${cityName}:`, error.message);
    return []; // Return empty array on failure
  }
}

/**
 * Agent 2: Accommodations (4-6 seconds)
 * Finds best neighborhoods with booking links
 */
async function generateAccommodations(cityName, country) {
  const fullCityName = country ? `${cityName}, ${country}` : cityName;

  const prompt = `Find the 3-4 best neighborhoods/areas for accommodation in ${fullCityName}.

Research current information and return ONLY a JSON object:

{
  "accommodations": [
    {
      "areaName": "Neighborhood name",
      "description": "Why this area is perfect for travelers (2 sentences)",
      "priceFrom": "€120/night",
      "bestFor": "First-timers, families, central location",
      "bookingUrl": "https://www.booking.com/searchresults.html?ss=${cityName}+AreaName",
      "hotelExample": "Name of a good hotel here",
      "rating": 8.5,
      "reviewCount": 450,
      "badges": ["Popular", "Great Value"]
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Areas must be real neighborhoods
2. Include price range (budget €60-90, mid €90-150, upscale €150+)
3. Booking.com search URLs must use real neighborhood names
4. Hotel examples must be real hotels
5. Ratings out of 10 (Booking.com style)
6. Badges: Choose 0-2 from [Popular, Great Value, Best Location, Quiet, Central, Trendy]
7. Return ONLY valid JSON, no markdown
8. 3-4 areas total

Return JSON now:`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout (increased for reliability)
    });

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in accommodations response');

    const data = JSON.parse(jsonMatch[0]);
    console.log(`✅ Agent 2 (Accommodations): Generated ${data.accommodations?.length || 0} areas for ${cityName}`);
    return data.accommodations || [];

  } catch (error) {
    console.error(`❌ Agent 2 (Accommodations) failed for ${cityName}:`, error.message);
    return []; // Return empty array on failure
  }
}

/**
 * Agent 3: Practical Info (3-5 seconds)
 * Parking, ZTL/environmental zones, best time to visit
 */
async function generatePracticalInfo(cityName, country) {
  const fullCityName = country ? `${cityName}, ${country}` : cityName;

  const prompt = `Provide practical travel information for ${fullCityName} - focus on road trippers driving into the city.

Research current information and return ONLY a JSON object:

{
  "parking": {
    "info": "Specific parking recommendations: garage names, street parking zones, costs per hour/day, best locations",
    "difficulty": "Easy/Moderate/Difficult"
  },
  "environmentalZones": {
    "hasRestrictions": true,
    "type": "ZTL/ZFE/LEZ/None",
    "description": "Detailed restrictions: which vehicles affected, permit requirements, restricted hours, fines",
    "advice": "Practical advice for road trippers"
  },
  "bestTimeToVisit": {
    "ideal": "April to June",
    "reasoning": "Why this is best (weather, crowds, events)",
    "avoid": "July-August (too hot and crowded)"
  }
}

CRITICAL REQUIREMENTS:
1. Be SPECIFIC: actual garage names, actual costs, actual zones
2. Environmental zones are CRITICAL - research thoroughly (ZTL in Italy, ZFE in France, etc.)
3. If no environmental restrictions exist, set hasRestrictions: false
4. Parking difficulty based on: availability, cost, ease of finding spots
5. Best time reasoning should mention weather AND crowds
6. Return ONLY valid JSON, no markdown

Return JSON now:`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout (increased for reliability)
    });

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in practical info response');

    const data = JSON.parse(jsonMatch[0]);
    console.log(`✅ Agent 3 (Practical Info): Generated for ${cityName}`);
    return {
      parking: data.parking || null,
      environmentalZones: data.environmentalZones || null,
      bestTimeToVisit: data.bestTimeToVisit || null
    };

  } catch (error) {
    console.error(`❌ Agent 3 (Practical Info) failed for ${cityName}:`, error.message);
    return { parking: null, environmentalZones: null, bestTimeToVisit: null };
  }
}

/**
 * Agent 4: Events & Tips (4-7 seconds)
 * Major events/festivals, local tips, warnings
 */
async function generateEventsAndTips(cityName, country) {
  const fullCityName = country ? `${cityName}, ${country}` : cityName;

  const prompt = `Find events/festivals and local knowledge for ${fullCityName}.

Research current information and return ONLY a JSON object:

{
  "eventsFestivals": [
    {
      "name": "Festival/Event name",
      "month": "June",
      "description": "Brief exciting description",
      "website": "Official website URL (or null)",
      "ticketUrl": "Ticket purchase URL (or null)",
      "dates": "June 15-20" or "Every weekend in summer",
      "popularity": "High/Medium/Low",
      "badges": ["Trending", "Annual Tradition"]
    }
  ],
  "localTips": [
    "Practical tip about getting around",
    "Insider tip about best time to visit attractions",
    "Money-saving tip",
    "Cultural etiquette tip"
  ],
  "warnings": [
    "Safety warning (pickpockets in X area)",
    "Scam warning (common tourist scams)",
    "Practical warning (shops closed on Sundays)"
  ]
}

CRITICAL REQUIREMENTS:
1. Events must be REAL, recurring annual events (not one-time past events)
2. Include 2-4 major events/festivals
3. Website/ticket URLs must be real or null
4. Badges: Choose 0-2 from [Trending, Sold Out Often, Annual Tradition, Free Entry, Family-Friendly]
5. localTips: 3-5 practical, actionable tips
6. warnings: 2-4 important things to know (safety, scams, practical)
7. Return ONLY valid JSON, no markdown

Return JSON now:`;

  try {
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1800,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout (increased for reliability)
    });

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in events/tips response');

    const data = JSON.parse(jsonMatch[0]);
    console.log(`✅ Agent 4 (Events & Tips): Generated ${data.eventsFestivals?.length || 0} events, ${data.localTips?.length || 0} tips for ${cityName}`);
    return {
      eventsFestivals: data.eventsFestivals || [],
      localTips: data.localTips || [],
      warnings: data.warnings || []
    };

  } catch (error) {
    console.error(`❌ Agent 4 (Events & Tips) failed for ${cityName}:`, error.message);
    return { eventsFestivals: [], localTips: [], warnings: [] };
  }
}

// ==================== CACHE STATISTICS & MONITORING ====================

/**
 * Get cache statistics for monitoring
 * GET /api/cache/stats
 */
app.get('/api/cache/stats', async (req, res) => {
  try {
    // Get city details cache stats
    const cityDetailsStats = await db.query(`
      SELECT
        COUNT(*) as total_cities,
        COUNT(DISTINCT country) as total_countries,
        MAX(created_at) as latest_cached_city,
        MIN(created_at) as oldest_cached_city
      FROM city_details
    `);

    // Get scraped images cache stats
    const imagesStats = await db.query(`
      SELECT
        COUNT(*) as total_images,
        COUNT(*) FILTER (WHERE entity_type = 'restaurant') as restaurant_images,
        COUNT(*) FILTER (WHERE entity_type = 'hotel') as hotel_images,
        COUNT(*) FILTER (WHERE entity_type = 'event') as event_images,
        COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_images,
        COUNT(*) FILTER (WHERE expires_at >= NOW()) as active_images
      FROM scraped_images
    `);

    // Get top cached cities
    const topCities = await db.query(`
      SELECT city_name, country, created_at
      FROM city_details
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Job queue stats
    const activeJobs = cityDetailsJobs.size;
    const processingJobs = Array.from(cityDetailsJobs.values()).filter(j => j.status === 'processing').length;
    const completedJobs = Array.from(cityDetailsJobs.values()).filter(j => j.status === 'complete').length;
    const failedJobs = Array.from(cityDetailsJobs.values()).filter(j => j.status === 'failed').length;

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      cache: {
        cityDetails: cityDetailsStats.rows[0],
        scrapedImages: imagesStats.rows[0],
        sessionCache: {
          size: sessionImageCache.size,
          description: 'In-memory cache for current session'
        }
      },
      jobs: {
        active: activeJobs,
        processing: processingJobs,
        completed: completedJobs,
        failed: failedJobs
      },
      recentCities: topCities.rows
    });

  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache statistics'
    });
  }
});

// ==================== ITINERARY ROUTES ====================
const itineraryRoutes = require('./server/routes/itinerary');
app.use('/api/itinerary', itineraryRoutes.initializeRoutes(itineraryJobs, pool));

// ==================== PROACTIVE NOTIFICATIONS ROUTES ====================
const notificationsRoutes = require('./server/routes/notifications');
app.use('/api/notifications', notificationsRoutes);

// ==================== TRIP IN PROGRESS ROUTES ====================
const tripRoutes = require('./server/routes/trip');
app.use('/api/trip', tripRoutes);

const nearbyRoutes = require('./server/routes/nearby');
app.use('/api/nearby', nearbyRoutes);

const weatherRoutes = require('./server/routes/weather');
app.use('/api/weather', weatherRoutes);

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

  // Serve the landing page for root route
  if (req.path === '/') {
    return res.sendFile(path.join(__dirname, 'public', 'landing-react', 'index.html'));
  }

  // Serve the spotlight app for spotlight routes
  if (req.path.startsWith('/spotlight-new')) {
    return res.sendFile(path.join(__dirname, 'public', 'spotlight-new', 'index.html'));
  }

  // Serve the React app's index.html for all other routes (fallback)
  res.sendFile(path.join(__dirname, 'public', 'landing-react', 'index.html'));
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

    // Check if generation_phase column exists in city_details
    const generationPhaseCheck = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'city_details' AND column_name = 'generation_phase'
    `);

    if (generationPhaseCheck.rows.length === 0) {
      console.log('📦 Running migration: Adding generation_phase column...');

      await db.query(`
        ALTER TABLE city_details
        ADD COLUMN IF NOT EXISTS generation_phase VARCHAR(20) DEFAULT 'complete';
      `);

      console.log('✅ Migration completed: generation_phase column added');
    }

    // Check if agent_memory table exists
    const agentMemoryCheck = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'agent_memory'
    `);

    if (agentMemoryCheck.rows.length === 0) {
      console.log('📦 Running migration: Creating AI agent tables with pgvector...');

      // Enable required extensions
      await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
      await db.query(`CREATE EXTENSION IF NOT EXISTS vector`);

      // Create agent_conversations table
      await db.query(`
        CREATE TABLE IF NOT EXISTS agent_conversations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
          session_id UUID NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_conversations_user ON agent_conversations(user_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_conversations_session ON agent_conversations(session_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_conversations_route ON agent_conversations(route_id)`);

      // Create agent_messages table
      await db.query(`
        CREATE TABLE IF NOT EXISTS agent_messages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
          role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          tool_calls JSONB,
          tool_results JSONB,
          context_snapshot JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation ON agent_messages(conversation_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_messages_created ON agent_messages(created_at DESC)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_messages_role ON agent_messages(role)`);

      // Create agent_memory table with vector embeddings
      await db.query(`
        CREATE TABLE IF NOT EXISTS agent_memory (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          message_id UUID REFERENCES agent_messages(id) ON DELETE SET NULL,
          content TEXT NOT NULL,
          embedding vector(1024),
          metadata JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_memory_user ON agent_memory(user_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_memory_created ON agent_memory(created_at DESC)`);

      // Create vector index for similarity search
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_agent_memory_embedding ON agent_memory
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);

      // Create agent_user_preferences table
      await db.query(`
        CREATE TABLE IF NOT EXISTS agent_user_preferences (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
          preferences JSONB NOT NULL DEFAULT '{}',
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_preferences_user ON agent_user_preferences(user_id)`);

      // Create agent_suggestions table
      await db.query(`
        CREATE TABLE IF NOT EXISTS agent_suggestions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          suggestion_type VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB NOT NULL DEFAULT '{}',
          dismissed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ
        )
      `);

      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_suggestions_route ON agent_suggestions(route_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_suggestions_user ON agent_suggestions(user_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_agent_suggestions_dismissed ON agent_suggestions(dismissed)`);

      // Create update trigger function if not exists
      await db.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      await db.query(`
        DROP TRIGGER IF EXISTS update_agent_conversations_updated_at ON agent_conversations;
        CREATE TRIGGER update_agent_conversations_updated_at BEFORE UPDATE ON agent_conversations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);

      await db.query(`
        DROP TRIGGER IF EXISTS update_agent_preferences_updated_at ON agent_user_preferences;
        CREATE TRIGGER update_agent_preferences_updated_at BEFORE UPDATE ON agent_user_preferences
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);

      console.log('✅ Migration completed: AI agent tables created with pgvector support');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    // Don't crash the server if migration fails
    console.warn('⚠️  Server will continue, but some features may not work');
  }
}

// ==================== COLLABORATION ENDPOINTS (PHASE 2) ====================

/**
 * Helper function: Check if user has permission to access a route
 * Returns { role: 'owner'|'editor'|'viewer' } or null
 */
async function checkRoutePermission(routeId, userId) {
  try {
    // Check if collaborator with accepted status
    const collabResult = await pool.query(`
      SELECT role FROM route_collaborators
      WHERE route_id = $1 AND user_id = $2 AND status = 'accepted'
    `, [routeId, userId]);

    if (collabResult.rows.length > 0) {
      return collabResult.rows[0];
    }

    // Check if owner
    const ownerResult = await pool.query(`
      SELECT 1 FROM routes WHERE id = $1 AND user_id = $2
    `, [routeId, userId]);

    if (ownerResult.rows.length > 0) {
      return { role: 'owner' };
    }

    return null;
  } catch (error) {
    console.error('Error checking route permission:', error);
    return null;
  }
}

/**
 * Helper function: Log activity to route_activity table
 */
async function logRouteActivity(routeId, userId, action, description = null, metadata = null) {
  try {
    await pool.query(`
      INSERT INTO route_activity (route_id, user_id, action, description, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [routeId, userId, action, description, metadata ? JSON.stringify(metadata) : null]);
  } catch (error) {
    console.error('Error logging route activity:', error);
  }
}

// POST /api/routes/:id/collaborators - Invite collaborator
app.post('/api/routes/:id/collaborators', authMiddleware, async (req, res) => {
  try {
    const { email, role = 'editor', message } = req.body;
    const routeId = req.params.id;
    const inviterId = req.user.id;

    // Validate inputs
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be editor or viewer' });
    }

    // Verify user is owner or editor
    const permission = await checkRoutePermission(routeId, inviterId);
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Not authorized to invite collaborators' });
    }

    // Find user by email (they may or may not exist)
    const invitee = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    const userExists = invitee.rows.length > 0;
    const inviteeId = userExists ? invitee.rows[0].id : null;
    const inviteeName = userExists ? invitee.rows[0].name : email;

    // Check if user is inviting themselves
    if (userExists && inviteeId === inviterId) {
      return res.status(400).json({ error: 'You cannot invite yourself' });
    }

    // Check if already a collaborator (by user_id or by email)
    let existing;
    if (userExists) {
      existing = await pool.query(
        'SELECT * FROM route_collaborators WHERE route_id = $1 AND user_id = $2',
        [routeId, inviteeId]
      );
    } else {
      existing = await pool.query(
        'SELECT * FROM route_collaborators WHERE route_id = $1 AND invited_email = $2',
        [routeId, email.toLowerCase()]
      );
    }

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'This email has already been invited to this trip' });
    }

    // Insert collaborator (with user_id if they exist, or just email if they don't)
    if (userExists) {
      await pool.query(`
        INSERT INTO route_collaborators (route_id, user_id, role, invited_by, status)
        VALUES ($1, $2, $3, $4, 'pending')
      `, [routeId, inviteeId, role, inviterId]);
    } else {
      // Store pending invitation by email - will be linked when user signs up
      await pool.query(`
        INSERT INTO route_collaborators (route_id, invited_email, role, invited_by, status)
        VALUES ($1, $2, $3, $4, 'pending')
      `, [routeId, email.toLowerCase(), role, inviterId]);
    }

    // Get route details for notification
    const route = await pool.query('SELECT name, destination FROM routes WHERE id = $1', [routeId]);
    const routeName = route.rows[0].name || `Trip to ${route.rows[0].destination}`;

    // Log activity
    await logRouteActivity(
      routeId,
      inviterId,
      'collaborator_invited',
      `Invited ${inviteeName} as ${role}`,
      { invitee: email, role, isPending: !userExists }
    );

    // TODO: Send email notification (implement sendCollaborationInvite)
    console.log(`📧 Would send invitation email to ${email} for route ${routeId}`);

    const responseMessage = userExists
      ? 'Invitation sent! They can now see this trip.'
      : 'Invitation sent! They\'ll get access when they create an account with this email.';

    res.json({
      success: true,
      message: responseMessage,
      isPending: !userExists
    });
  } catch (error) {
    console.error('Error inviting collaborator:', error);
    res.status(500).json({ error: 'Failed to invite collaborator' });
  }
});

// GET /api/routes/:id/collaborators - List collaborators
app.get('/api/routes/:id/collaborators', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;

    // Verify user has access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized to view collaborators' });
    }

    // Get collaborators
    const result = await pool.query(`
      SELECT
        c.id,
        c.role,
        c.status,
        c.invited_at,
        c.accepted_at,
        c.last_viewed_at,
        c.last_edited_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url,
        i.name as invited_by_name
      FROM route_collaborators c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users i ON c.invited_by = i.id
      WHERE c.route_id = $1
      ORDER BY
        CASE c.role
          WHEN 'owner' THEN 1
          WHEN 'editor' THEN 2
          WHEN 'viewer' THEN 3
        END,
        c.created_at ASC
    `, [routeId]);

    // Add route owner as well
    const owner = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar_url
      FROM routes r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `, [routeId]);

    const collaborators = [
      {
        user_id: owner.rows[0].id,
        user_name: owner.rows[0].name,
        user_email: owner.rows[0].email,
        avatar_url: owner.rows[0].avatar_url,
        role: 'owner',
        status: 'accepted',
        invited_at: null,
        accepted_at: null
      },
      ...result.rows
    ];

    res.json({ collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

// PATCH /api/routes/:id/collaborators/:userId - Update collaborator role
app.patch('/api/routes/:id/collaborators/:userId', authMiddleware, async (req, res) => {
  try {
    const { id: routeId, userId: targetUserId } = req.params;
    const { role } = req.body;
    const requesterId = req.user.id;

    // Validate role
    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Role must be editor or viewer' });
    }

    // Only owner can update roles
    const permission = await checkRoutePermission(routeId, requesterId);
    if (!permission || permission.role !== 'owner') {
      return res.status(403).json({ error: 'Only the owner can update roles' });
    }

    // Update role
    const result = await pool.query(`
      UPDATE route_collaborators
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE route_id = $2 AND user_id = $3
      RETURNING *
    `, [role, routeId, targetUserId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    // Log activity
    await logRouteActivity(
      routeId,
      requesterId,
      'collaborator_role_updated',
      `Changed collaborator role to ${role}`
    );

    res.json({ success: true, collaborator: result.rows[0] });
  } catch (error) {
    console.error('Error updating collaborator:', error);
    res.status(500).json({ error: 'Failed to update collaborator' });
  }
});

// DELETE /api/routes/:id/collaborators/:userId - Remove collaborator
app.delete('/api/routes/:id/collaborators/:userId', authMiddleware, async (req, res) => {
  try {
    const { id: routeId, userId: targetUserId } = req.params;
    const requesterId = req.user.id;

    // Only owner can remove others, or users can remove themselves
    const permission = await checkRoutePermission(routeId, requesterId);
    if (permission.role !== 'owner' && requesterId !== targetUserId) {
      return res.status(403).json({ error: 'Not authorized to remove collaborator' });
    }

    // Remove collaborator
    const result = await pool.query(`
      DELETE FROM route_collaborators
      WHERE route_id = $1 AND user_id = $2
      RETURNING *
    `, [routeId, targetUserId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    // Log activity
    const description = requesterId === targetUserId ? 'Left the trip' : 'Removed a collaborator';
    await logRouteActivity(routeId, requesterId, 'collaborator_removed', description);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

// POST /api/routes/:id/collaborators/:userId/accept - Accept invitation
app.post('/api/routes/:id/collaborators/:userId/accept', authMiddleware, async (req, res) => {
  try {
    const { id: routeId, userId } = req.params;
    const requesterId = req.user.id;

    // User can only accept their own invitation
    if (requesterId !== userId) {
      return res.status(403).json({ error: 'You can only accept your own invitations' });
    }

    // Update status to accepted
    const result = await pool.query(`
      UPDATE route_collaborators
      SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
      WHERE route_id = $1 AND user_id = $2
      RETURNING *
    `, [routeId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Log activity
    await logRouteActivity(routeId, userId, 'collaborator_joined', 'Accepted invitation to collaborate');

    res.json({ success: true, message: 'Invitation accepted' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// POST /api/routes/:id/messages - Send chat message
app.post('/api/routes/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { message, messageType = 'text', metadata, mentionedUsers, parentMessageId } = req.body;
    const routeId = req.params.id;
    const userId = req.user.id;

    // Validate message
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized to send messages' });
    }

    // Insert message with mentions and thread support
    const result = await pool.query(`
      INSERT INTO trip_messages (route_id, user_id, message, message_type, message_metadata, mentioned_users, parent_message_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        *,
        (SELECT name FROM users WHERE id = $2) as user_name,
        (SELECT avatar_url FROM users WHERE id = $2) as user_avatar
    `, [
      routeId,
      userId,
      message,
      messageType,
      metadata ? JSON.stringify(metadata) : null,
      mentionedUsers || null,
      parentMessageId || null
    ]);

    const newMessage = result.rows[0];

    // Broadcast via WebSocket if available
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'chat_message',
        data: newMessage
      });
    }

    // TODO: Send notifications to mentioned users (Phase 1.1 enhancement)

    res.json({ message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/routes/:id/messages - Get chat history
app.get('/api/routes/:id/messages', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;
    const { limit = 100, offset = 0 } = req.query;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized to view messages' });
    }

    // Get messages
    const result = await pool.query(`
      SELECT
        m.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM trip_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.route_id = $1
        AND m.is_deleted = false
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [routeId, parseInt(limit), parseInt(offset)]);

    res.json({ messages: result.rows.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/routes/:id/messages/:messageId/reactions - Add reaction to message
app.post('/api/routes/:id/messages/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const routeId = req.params.id;
    const messageId = req.params.messageId;
    const userId = req.user.id;

    // Validate emoji
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'Valid emoji required' });
    }

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verify message exists and belongs to route
    const msgCheck = await pool.query(
      'SELECT id FROM trip_messages WHERE id = $1 AND route_id = $2',
      [messageId, routeId]
    );

    if (msgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Add reaction (using PostgreSQL JSONB operations)
    const reaction = {
      emoji,
      userId,
      createdAt: new Date().toISOString()
    };

    await pool.query(`
      UPDATE trip_messages
      SET reactions = reactions || $1::jsonb
      WHERE id = $2
    `, [JSON.stringify([reaction]), messageId]);

    // Get updated message
    const result = await pool.query(`
      SELECT m.*, u.name as user_name, u.avatar_url as user_avatar
      FROM trip_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `, [messageId]);

    const updatedMessage = result.rows[0];

    // Broadcast via WebSocket
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'message_reaction_added',
        data: {
          messageId,
          reaction,
          message: updatedMessage
        }
      });
    }

    res.json({ success: true, message: updatedMessage });

  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// DELETE /api/routes/:id/messages/:messageId/reactions - Remove reaction from message
app.delete('/api/routes/:id/messages/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const routeId = req.params.id;
    const messageId = req.params.messageId;
    const userId = req.user.id;

    // Validate emoji
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'Valid emoji required' });
    }

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Remove reaction (filter out reactions matching userId and emoji)
    await pool.query(`
      UPDATE trip_messages
      SET reactions = (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(reactions) elem
        WHERE NOT (elem->>'userId' = $1 AND elem->>'emoji' = $2)
      )
      WHERE id = $3
    `, [userId, emoji, messageId]);

    // Get updated message
    const result = await pool.query(`
      SELECT m.*, u.name as user_name, u.avatar_url as user_avatar
      FROM trip_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `, [messageId]);

    const updatedMessage = result.rows[0];

    // Broadcast via WebSocket
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'message_reaction_removed',
        data: {
          messageId,
          emoji,
          userId,
          message: updatedMessage
        }
      });
    }

    res.json({ success: true, message: updatedMessage });

  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// ============================================================================
// ACTIVITY COMMENTS API (Phase 2: Activity-Level Collaboration)
// ============================================================================

// GET /api/routes/:routeId/comments - Get comments for a target
app.get('/api/routes/:routeId/comments', authMiddleware, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { targetType, targetId, dayNumber } = req.query;
    const userId = req.user.id;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized to view comments' });
    }

    let query = `
      SELECT
        c.id,
        c.target_type,
        c.target_id,
        c.day_number,
        c.comment,
        c.parent_comment_id,
        c.resolved,
        c.resolved_by,
        c.resolved_at,
        c.created_at,
        c.updated_at,
        u.id as user_id,
        u.name as user_name,
        u.avatar as user_avatar,
        resolver.name as resolved_by_name
      FROM activity_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users resolver ON c.resolved_by = resolver.id
      WHERE c.route_id = $1
    `;

    const params = [routeId];
    let paramIndex = 2;

    if (targetType) {
      query += ` AND c.target_type = $${paramIndex}`;
      params.push(targetType);
      paramIndex++;
    }

    if (targetId) {
      query += ` AND c.target_id = $${paramIndex}`;
      params.push(targetId);
      paramIndex++;
    }

    if (dayNumber) {
      query += ` AND c.day_number = $${paramIndex}`;
      params.push(parseInt(dayNumber));
      paramIndex++;
    }

    query += ` ORDER BY c.created_at ASC`;

    const result = await pool.query(query, params);

    // Build nested comment structure (parent comments with replies)
    const comments = result.rows;
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    res.json({
      success: true,
      comments: rootComments,
      count: rootComments.length,
      totalCount: comments.length
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/routes/:routeId/comments - Add comment
app.post('/api/routes/:routeId/comments', authMiddleware, async (req, res) => {
  try {
    const { routeId } = req.params;
    const {
      targetType,
      targetId,
      dayNumber,
      comment,
      parentCommentId,
      itineraryId
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (!targetType || !targetId || !comment) {
      return res.status(400).json({
        error: 'targetType, targetId, and comment are required'
      });
    }

    const validTypes = ['activity', 'day', 'restaurant', 'route'];
    if (!validTypes.includes(targetType)) {
      return res.status(400).json({
        error: `targetType must be one of: ${validTypes.join(', ')}`
      });
    }

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized to comment' });
    }

    // Insert comment
    const result = await pool.query(`
      INSERT INTO activity_comments (
        route_id,
        itinerary_id,
        target_type,
        target_id,
        day_number,
        user_id,
        comment,
        parent_comment_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      routeId,
      itineraryId || null,
      targetType,
      targetId,
      dayNumber || null,
      userId,
      comment,
      parentCommentId || null
    ]);

    const newComment = result.rows[0];

    // Get user details
    const userResult = await pool.query(
      'SELECT id, name, avatar FROM users WHERE id = $1',
      [userId]
    );

    const commentWithUser = {
      ...newComment,
      user_id: userResult.rows[0].id,
      user_name: userResult.rows[0].name,
      user_avatar: userResult.rows[0].avatar,
      replies: []
    };

    // Broadcast via WebSocket
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'comment_added',
        data: commentWithUser
      });
    }

    // Log activity
    await logRouteActivity(routeId, userId, 'comment_added',
      `Added comment on ${targetType}: ${targetId}`,
      { commentId: newComment.id, targetType, targetId }
    );

    res.json({ success: true, comment: commentWithUser });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// PATCH /api/routes/:routeId/comments/:commentId/resolve - Toggle resolve status
app.patch('/api/routes/:routeId/comments/:commentId/resolve', authMiddleware, async (req, res) => {
  try {
    const { routeId, commentId } = req.params;
    const { resolved } = req.body;
    const userId = req.user.id;

    // Verify access (editors and owners can resolve)
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Not authorized to resolve comments' });
    }

    // Update comment
    const result = await pool.query(`
      UPDATE activity_comments
      SET
        resolved = $1,
        resolved_by = CASE WHEN $1 = true THEN $2 ELSE NULL END,
        resolved_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END,
        updated_at = NOW()
      WHERE id = $3 AND route_id = $4
      RETURNING *
    `, [resolved, userId, commentId, routeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const updatedComment = result.rows[0];

    // Get resolver name if resolved
    if (resolved) {
      const userResult = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [userId]
      );
      updatedComment.resolved_by_name = userResult.rows[0].name;
    }

    // Broadcast via WebSocket
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'comment_resolved',
        data: {
          commentId,
          resolved,
          resolvedBy: userId,
          resolvedByName: updatedComment.resolved_by_name,
          resolvedAt: updatedComment.resolved_at
        }
      });
    }

    res.json({ success: true, comment: updatedComment });

  } catch (error) {
    console.error('Error resolving comment:', error);
    res.status(500).json({ error: 'Failed to resolve comment' });
  }
});

// DELETE /api/routes/:routeId/comments/:commentId - Delete comment
app.delete('/api/routes/:routeId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { routeId, commentId } = req.params;
    const userId = req.user.id;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if user owns the comment or is route owner/editor
    const commentCheck = await pool.query(
      'SELECT user_id FROM activity_comments WHERE id = $1 AND route_id = $2',
      [commentId, routeId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const isOwner = commentCheck.rows[0].user_id === userId;
    const canDelete = isOwner || permission.role === 'owner' || permission.role === 'editor';

    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Delete comment (CASCADE will delete replies)
    await pool.query(
      'DELETE FROM activity_comments WHERE id = $1',
      [commentId]
    );

    // Broadcast via WebSocket
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'comment_deleted',
        data: { commentId }
      });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ===========================
// POLLING ENDPOINTS (Phase 3)
// ===========================

// POST /api/routes/:routeId/polls - Create poll
app.post('/api/routes/:routeId/polls', authMiddleware, async (req, res) => {
  try {
    const { routeId } = req.params;
    const {
      question,
      pollType,
      options,
      multipleChoice,
      deadline,
      autoExecute,
      consensusThreshold,
      targetType,
      targetId,
      dayNumber
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        error: 'Question and at least 2 options are required'
      });
    }

    // Verify access to route
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission.hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Insert poll
    const result = await pool.query(`
      INSERT INTO trip_polls (
        route_id,
        created_by,
        question,
        poll_type,
        target_type,
        target_id,
        day_number,
        options,
        multiple_choice,
        deadline,
        auto_execute,
        consensus_threshold
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      routeId,
      userId,
      question,
      pollType || 'general',
      targetType || null,
      targetId || null,
      dayNumber || null,
      JSON.stringify(options),
      multipleChoice || false,
      deadline || null,
      autoExecute || false,
      consensusThreshold || 50
    ]);

    const poll = result.rows[0];

    // Get creator info
    const userResult = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    const pollWithUser = {
      ...poll,
      options: typeof poll.options === 'string' ? JSON.parse(poll.options) : poll.options,
      created_by_name: userResult.rows[0]?.name,
      votes: []
    };

    // Broadcast via WebSocket
    if (collaborationService) {
      collaborationService.broadcast(routeId, {
        type: 'poll_created',
        poll: pollWithUser
      });
    }

    res.json({ success: true, poll: pollWithUser });

  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// GET /api/routes/:routeId/polls - Get polls for route
app.get('/api/routes/:routeId/polls', authMiddleware, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { status } = req.query;
    const userId = req.user.id;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission.hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT
        p.*,
        u.name as created_by_name,
        (
          SELECT json_agg(json_build_object(
            'user_id', v.user_id,
            'user_name', vu.name,
            'selected_options', v.selected_options,
            'created_at', v.created_at
          ))
          FROM poll_votes v
          JOIN users vu ON v.user_id = vu.id
          WHERE v.poll_id = p.id
        ) as votes
      FROM trip_polls p
      JOIN users u ON p.created_by = u.id
      WHERE p.route_id = $1
    `;

    const params = [routeId];

    if (status) {
      query += ` AND p.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);

    // Parse JSONB fields
    const polls = result.rows.map(poll => ({
      ...poll,
      options: typeof poll.options === 'string' ? JSON.parse(poll.options) : poll.options,
      votes: poll.votes || []
    }));

    res.json({
      success: true,
      polls
    });

  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// POST /api/routes/:routeId/polls/:pollId/vote - Vote on poll
app.post('/api/routes/:routeId/polls/:pollId/vote', authMiddleware, async (req, res) => {
  try {
    const { routeId, pollId } = req.params;
    const { selectedOptions } = req.body;
    const userId = req.user.id;

    // Validation
    if (!selectedOptions || !Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      return res.status(400).json({ error: 'selectedOptions array is required' });
    }

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission.hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if poll exists and is active
    const pollCheck = await pool.query(
      'SELECT id, status, multiple_choice, options, max_choices FROM trip_polls WHERE id = $1 AND route_id = $2',
      [pollId, routeId]
    );

    if (pollCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const poll = pollCheck.rows[0];

    if (poll.status !== 'active') {
      return res.status(400).json({ error: 'Poll is closed' });
    }

    // Validate single choice
    if (!poll.multiple_choice && selectedOptions.length > 1) {
      return res.status(400).json({ error: 'Poll only allows single choice' });
    }

    // Validate max choices
    if (poll.max_choices && selectedOptions.length > poll.max_choices) {
      return res.status(400).json({ error: `Poll allows maximum ${poll.max_choices} choices` });
    }

    // Insert or update vote
    await pool.query(`
      INSERT INTO poll_votes (poll_id, user_id, selected_options)
      VALUES ($1, $2, $3)
      ON CONFLICT (poll_id, user_id)
      DO UPDATE SET selected_options = $3, updated_at = NOW()
    `, [pollId, userId, JSON.stringify(selectedOptions)]);

    // Get updated votes
    const votesResult = await pool.query(`
      SELECT
        v.user_id,
        v.selected_options,
        v.created_at,
        u.name as user_name
      FROM poll_votes v
      JOIN users u ON v.user_id = u.id
      WHERE v.poll_id = $1
    `, [pollId]);

    const votes = votesResult.rows.map(v => ({
      ...v,
      selected_options: typeof v.selected_options === 'string' ? JSON.parse(v.selected_options) : v.selected_options
    }));

    // Broadcast via WebSocket
    if (collaborationService) {
      collaborationService.broadcast(routeId, {
        type: 'vote_cast',
        pollId,
        userId,
        selectedOptions,
        votes
      });
    }

    res.json({ success: true, votes });

  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// POST /api/routes/:routeId/polls/:pollId/close - Close poll
app.post('/api/routes/:routeId/polls/:pollId/close', authMiddleware, async (req, res) => {
  try {
    const { routeId, pollId } = req.params;
    const userId = req.user.id;

    // Check if user is poll creator or route owner/editor
    const permissionCheck = await pool.query(`
      SELECT p.id
      FROM trip_polls p
      LEFT JOIN route_collaborators rc ON rc.route_id = p.route_id AND rc.user_id = $3
      WHERE p.id = $1
        AND p.route_id = $2
        AND (
          p.created_by = $3
          OR rc.role IN ('owner', 'editor')
        )
    `, [pollId, routeId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Permission denied. Only poll creator or route owner/editor can close polls.' });
    }

    // Close poll
    const result = await pool.query(`
      UPDATE trip_polls
      SET status = 'closed', closed_at = NOW(), closed_by = $1
      WHERE id = $2 AND route_id = $3
      RETURNING *
    `, [userId, pollId, routeId]);

    const poll = result.rows[0];

    // Parse JSONB
    const pollParsed = {
      ...poll,
      options: typeof poll.options === 'string' ? JSON.parse(poll.options) : poll.options
    };

    // Broadcast via WebSocket
    if (collaborationService) {
      collaborationService.broadcast(routeId, {
        type: 'poll_closed',
        pollId,
        poll: pollParsed
      });
    }

    res.json({ success: true, poll: pollParsed });

  } catch (error) {
    console.error('Error closing poll:', error);
    res.status(500).json({ error: 'Failed to close poll' });
  }
});

// =====================================================
// PHASE 4: TASK MANAGEMENT ENDPOINTS
// =====================================================

// POST /api/routes/:routeId/tasks - Create task
app.post('/api/routes/:routeId/tasks', authMiddleware, async (req, res) => {
  try {
    const { routeId } = req.params;
    const {
      title,
      description,
      taskType,
      assignedTo,
      relatedActivity,
      relatedDay,
      relatedRestaurant,
      priority,
      dueDate,
      itineraryId
    } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Verify assignee is a collaborator (if specified)
    if (assignedTo && assignedTo !== userId) {
      const collabCheck = await pool.query(
        'SELECT id FROM route_collaborators WHERE route_id = $1 AND user_id = $2',
        [routeId, assignedTo]
      );

      if (collabCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assigned user is not a collaborator' });
      }
    }

    // Create task
    const result = await pool.query(`
      INSERT INTO trip_tasks (
        route_id,
        itinerary_id,
        title,
        description,
        task_type,
        assigned_to,
        assigned_by,
        related_activity,
        related_day,
        related_restaurant,
        priority,
        due_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      routeId,
      itineraryId || null,
      title.trim(),
      description?.trim() || null,
      taskType || 'custom',
      assignedTo || null,
      userId,
      relatedActivity || null,
      relatedDay || null,
      relatedRestaurant || null,
      priority || 'medium',
      dueDate || null
    ]);

    const task = result.rows[0];

    // Get user info for enrichment
    const userQuery = `
      SELECT
        u1.name as assigned_to_name,
        u2.name as assigned_by_name
      FROM users u2
      LEFT JOIN users u1 ON u1.id = $1
      WHERE u2.id = $2
    `;

    const userInfo = await pool.query(userQuery, [assignedTo || null, userId]);

    const taskWithUsers = {
      ...task,
      assigned_to_name: userInfo.rows[0]?.assigned_to_name,
      assigned_by_name: userInfo.rows[0]?.assigned_by_name
    };

    // Broadcast via WebSocket
    if (collaborationService) {
      collaborationService.broadcast(routeId, {
        type: 'task_created',
        task: taskWithUsers
      });
    }

    res.json({ success: true, task: taskWithUsers });

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /api/routes/:routeId/tasks - Get tasks with optional filters
app.get('/api/routes/:routeId/tasks', authMiddleware, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { status, assignedTo, priority } = req.query;
    const userId = req.user.id;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission.hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = `
      SELECT
        t.*,
        u1.name as assigned_to_name,
        u2.name as assigned_by_name
      FROM trip_tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      JOIN users u2 ON t.assigned_by = u2.id
      WHERE t.route_id = $1
    `;

    const params = [routeId];
    let paramIndex = 2;

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (assignedTo) {
      query += ` AND t.assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    if (priority) {
      query += ` AND t.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    query += ` ORDER BY
      CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC
    `;

    const result = await pool.query(query, params);

    // Parse JSONB completion_proof if exists
    const tasks = result.rows.map(task => ({
      ...task,
      completion_proof: task.completion_proof && typeof task.completion_proof === 'string'
        ? JSON.parse(task.completion_proof)
        : task.completion_proof
    }));

    // Group by status for Kanban board
    const grouped = {
      pending: [],
      in_progress: [],
      completed: [],
      cancelled: []
    };

    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    res.json({
      success: true,
      tasks,
      grouped,
      counts: {
        total: tasks.length,
        pending: grouped.pending.length,
        in_progress: grouped.in_progress.length,
        completed: grouped.completed.length,
        cancelled: grouped.cancelled.length
      }
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// PATCH /api/routes/:routeId/tasks/:taskId - Update task
app.patch('/api/routes/:routeId/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { routeId, taskId } = req.params;
    const {
      title,
      description,
      assignedTo,
      status,
      priority,
      dueDate,
      completionNotes,
      completionProof
    } = req.body;
    const userId = req.user.id;

    // Check if user has permission (assigned user, assigner, or route owner/editor)
    const permissionCheck = await pool.query(`
      SELECT t.id
      FROM trip_tasks t
      WHERE t.id = $1
        AND t.route_id = $2
        AND (
          t.assigned_to = $3
          OR t.assigned_by = $3
          OR EXISTS (
            SELECT 1 FROM route_collaborators rc
            WHERE rc.route_id = $2 AND rc.user_id = $3 AND rc.role IN ('owner', 'editor')
          )
        )
    `, [taskId, routeId, userId]);

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [taskId, routeId];
    let paramIndex = 3;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(title.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description?.trim() || null);
      paramIndex++;
    }

    if (assignedTo !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`);
      values.push(assignedTo || null);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;

      // Auto-set completion timestamp
      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
      }
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      values.push(priority);
      paramIndex++;
    }

    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex}`);
      values.push(dueDate || null);
      paramIndex++;
    }

    if (completionNotes !== undefined) {
      updates.push(`completion_notes = $${paramIndex}`);
      values.push(completionNotes?.trim() || null);
      paramIndex++;
    }

    if (completionProof !== undefined) {
      updates.push(`completion_proof = $${paramIndex}`);
      values.push(JSON.stringify(completionProof));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = NOW()');

    const query = `
      UPDATE trip_tasks
      SET ${updates.join(', ')}
      WHERE id = $1 AND route_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, values);

    const task = result.rows[0];

    // Parse JSONB
    const taskParsed = {
      ...task,
      completion_proof: task.completion_proof && typeof task.completion_proof === 'string'
        ? JSON.parse(task.completion_proof)
        : task.completion_proof
    };

    // Broadcast via WebSocket
    if (collaborationService) {
      collaborationService.broadcast(routeId, {
        type: 'task_updated',
        taskId,
        task: taskParsed,
        updatedBy: userId
      });
    }

    res.json({ success: true, task: taskParsed });

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/routes/:routeId/tasks/:taskId - Delete task
app.delete('/api/routes/:routeId/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { routeId, taskId } = req.params;
    const userId = req.user.id;

    // Check if user created the task or is route owner
    const result = await pool.query(`
      DELETE FROM trip_tasks
      WHERE id = $1
        AND route_id = $2
        AND (
          assigned_by = $3
          OR EXISTS (
            SELECT 1 FROM route_collaborators
            WHERE route_id = $2 AND user_id = $3 AND role = 'owner'
          )
        )
      RETURNING id
    `, [taskId, routeId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or permission denied' });
    }

    // Broadcast via WebSocket
    if (collaborationService) {
      collaborationService.broadcast(routeId, {
        type: 'task_deleted',
        taskId
      });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// =====================================================
// PHASE 5: NOTIFICATION ENDPOINTS
// =====================================================

// POST /api/notifications/devices - Register device for push notifications
app.post('/api/notifications/devices', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId, fcmToken, platform } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    // Upsert device (insert or update if exists)
    await pool.query(`
      INSERT INTO user_devices (user_id, device_id, fcm_token, platform, last_active)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, device_id)
      DO UPDATE SET
        fcm_token = EXCLUDED.fcm_token,
        platform = EXCLUDED.platform,
        last_active = NOW()
    `, [userId, deviceId, fcmToken || null, platform || 'web']);

    console.log(`✅ Registered device for user ${userId}: ${deviceId}`);

    res.json({ success: true, message: 'Device registered successfully' });

  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// GET /api/notifications - Get user's notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly = false, limit = 50 } = req.query;

    let query = `
      SELECT
        id, type, title, message, route_id, itinerary_id,
        read, read_at, metadata, created_at
      FROM notifications
      WHERE user_id = $1
    `;

    const params = [userId];

    if (unreadOnly === 'true') {
      query += ' AND read = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $2';
    params.push(parseInt(limit) || 50);

    const result = await pool.query(query, params);

    // Get unread count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );

    const notifications = result.rows.map(row => ({
      ...row,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
    }));

    res.json({
      notifications,
      unreadCount: parseInt(countResult.rows[0].count)
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:notificationId/read - Mark notification as read
app.patch('/api/notifications/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    // Update and verify ownership
    const result = await pool.query(`
      UPDATE notifications
      SET read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found or not authorized' });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/read-all - Mark all notifications as read
app.post('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      UPDATE notifications
      SET read = true, read_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING id
    `, [userId]);

    console.log(`✅ Marked ${result.rows.length} notifications as read for user ${userId}`);

    res.json({ success: true, count: result.rows.length });

  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// GET /api/notifications/preferences - Get notification preferences
app.get('/api/notifications/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    let result = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    // If no preferences exist, create defaults
    if (result.rows.length === 0) {
      await pool.query(
        'INSERT INTO notification_preferences (user_id) VALUES ($1)',
        [userId]
      );

      result = await pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId]
      );
    }

    res.json({ preferences: result.rows[0] });

  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// PATCH /api/notifications/preferences - Update notification preferences
app.patch('/api/notifications/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Whitelist of allowed fields
    const allowedFields = [
      'push_enabled', 'email_enabled', 'in_app_enabled',
      'notify_mention', 'notify_task_assigned', 'notify_task_due_soon',
      'notify_poll_created', 'notify_comment_on_activity',
      'notify_activity_changed', 'notify_message',
      'quiet_hours_start', 'quiet_hours_end', 'quiet_hours_timezone'
    ];

    // Build dynamic update query
    const updateFields = [];
    const params = [userId];
    let paramCounter = 2;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCounter}`);
        params.push(updates[key]);
        paramCounter++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = NOW()');

    const query = `
      UPDATE notification_preferences
      SET ${updateFields.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }

    res.json({ preferences: result.rows[0] });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// GET /api/routes/:id/activity - Get activity log
app.get('/api/routes/:id/activity', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized to view activity' });
    }

    // Get activity log
    const result = await pool.query(`
      SELECT
        a.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM route_activity a
      JOIN users u ON a.user_id = u.id
      WHERE a.route_id = $1
      ORDER BY a.created_at DESC
      LIMIT $2
    `, [routeId, parseInt(limit)]);

    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/routes/:id/presence - Get current presence (who's online)
app.get('/api/routes/:id/presence', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get presence (users seen in last 5 minutes)
    const result = await pool.query(`
      SELECT
        p.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM user_presence p
      JOIN users u ON p.user_id = u.id
      WHERE p.route_id = $1
        AND p.last_seen_at > NOW() - INTERVAL '5 minutes'
      ORDER BY p.last_seen_at DESC
    `, [routeId]);

    res.json({ presence: result.rows });
  } catch (error) {
    console.error('Error fetching presence:', error);
    res.status(500).json({ error: 'Failed to fetch presence' });
  }
});

console.log('✅ Collaboration API endpoints initialized');

// ==================== PHASE 3: EXPENSE TRACKING & SPLITTING ====================

/**
 * Middleware for file upload (receipts)
 */
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and HEIC images are allowed.'));
    }
  }
});

// POST /api/routes/:id/expenses - Create new expense
app.post('/api/routes/:id/expenses', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;
    const {
      description,
      category,
      amount,
      currency = 'EUR',
      expenseDate,
      location,
      cityName,
      receiptUrl,
      receiptData,
      splitMethod = 'equal',
      splitData,
      participants,
      notes,
      tags
    } = req.body;

    // Verify user has edit access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Not authorized to add expenses' });
    }

    // Validate required fields
    if (!description || !category || !amount || !expenseDate || !participants || participants.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert amount to EUR for calculations
    const amountEur = await CurrencyService.convertToEUR(parseFloat(amount), currency);

    // Insert expense
    const result = await pool.query(`
      INSERT INTO trip_expenses (
        route_id, paid_by, description, category, amount, currency, amount_eur,
        expense_date, location, city_name, receipt_url, receipt_data,
        split_method, split_data, participants, notes, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      routeId,
      userId,
      description,
      category,
      parseFloat(amount),
      currency,
      amountEur,
      expenseDate,
      location,
      cityName,
      receiptUrl,
      receiptData ? JSON.stringify(receiptData) : null,
      splitMethod,
      splitData ? JSON.stringify(splitData) : null,
      participants,
      notes,
      tags
    ]);

    const expense = result.rows[0];

    // Log activity
    await logRouteActivity(
      routeId,
      userId,
      'expense_added',
      `Added expense: ${description} (${CurrencyService.formatAmount(parseFloat(amount), currency)})`
    );

    // Broadcast via WebSocket
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'expense_added',
        data: expense
      });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// GET /api/routes/:id/expenses - List expenses
app.get('/api/routes/:id/expenses', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;
    const { category, startDate, endDate, paidBy } = req.query;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Build query with filters
    let query = `
      SELECT
        e.*,
        u.name as paid_by_name,
        u.avatar_url as paid_by_avatar
      FROM trip_expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.route_id = $1
    `;
    const params = [routeId];
    let paramIndex = 2;

    if (category) {
      query += ` AND e.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND e.expense_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND e.expense_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (paidBy) {
      query += ` AND e.paid_by = $${paramIndex}`;
      params.push(paidBy);
      paramIndex++;
    }

    query += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

    const result = await pool.query(query, params);

    // Get total summary
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*) as total_count,
        SUM(amount_eur) as total_eur,
        category
      FROM trip_expenses
      WHERE route_id = $1
      GROUP BY category
    `, [routeId]);

    res.json({
      expenses: result.rows,
      summary: summaryResult.rows
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/routes/:id/expenses/:expenseId - Get single expense
app.get('/api/routes/:id/expenses/:expenseId', authMiddleware, async (req, res) => {
  try {
    const { id: routeId, expenseId } = req.params;
    const userId = req.user.id;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(`
      SELECT
        e.*,
        u.name as paid_by_name,
        u.avatar_url as paid_by_avatar
      FROM trip_expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.id = $1 AND e.route_id = $2
    `, [expenseId, routeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ expense: result.rows[0] });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// PATCH /api/routes/:id/expenses/:expenseId - Update expense
app.patch('/api/routes/:id/expenses/:expenseId', authMiddleware, async (req, res) => {
  try {
    const { id: routeId, expenseId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Verify edit access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Not authorized to edit expenses' });
    }

    // Check if user is the one who paid (or is owner)
    const expenseCheck = await pool.query(
      'SELECT paid_by FROM trip_expenses WHERE id = $1 AND route_id = $2',
      [expenseId, routeId]
    );

    if (expenseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expenseCheck.rows[0].paid_by !== userId && permission.role !== 'owner') {
      return res.status(403).json({ error: 'Only the payer or owner can edit this expense' });
    }

    // Build update query dynamically
    const allowedFields = [
      'description', 'category', 'amount', 'currency', 'expense_date',
      'location', 'city_name', 'split_method', 'split_data', 'participants',
      'notes', 'tags', 'is_reimbursed'
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        updateFields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Recalculate EUR amount if amount or currency changed
    if (updates.amount || updates.currency) {
      const currentExpense = expenseCheck.rows[0];
      const newAmount = updates.amount || currentExpense.amount;
      const newCurrency = updates.currency || currentExpense.currency;
      const amountEur = await CurrencyService.convertToEUR(parseFloat(newAmount), newCurrency);
      updateFields.push(`amount_eur = $${paramIndex}`);
      values.push(amountEur);
      paramIndex++;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(expenseId, routeId);

    const query = `
      UPDATE trip_expenses
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND route_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    // Log activity
    await logRouteActivity(routeId, userId, 'expense_updated', `Updated expense: ${result.rows[0].description}`);

    // Broadcast update
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'expense_updated',
        data: result.rows[0]
      });
    }

    res.json({ expense: result.rows[0] });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/routes/:id/expenses/:expenseId - Delete expense
app.delete('/api/routes/:id/expenses/:expenseId', authMiddleware, async (req, res) => {
  try {
    const { id: routeId, expenseId } = req.params;
    const userId = req.user.id;

    // Verify edit access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Not authorized to delete expenses' });
    }

    // Check if user is the one who paid (or is owner)
    const expenseCheck = await pool.query(
      'SELECT paid_by, description FROM trip_expenses WHERE id = $1 AND route_id = $2',
      [expenseId, routeId]
    );

    if (expenseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expenseCheck.rows[0].paid_by !== userId && permission.role !== 'owner') {
      return res.status(403).json({ error: 'Only the payer or owner can delete this expense' });
    }

    // Delete expense
    await pool.query('DELETE FROM trip_expenses WHERE id = $1 AND route_id = $2', [expenseId, routeId]);

    // Log activity
    await logRouteActivity(routeId, userId, 'expense_deleted', `Deleted expense: ${expenseCheck.rows[0].description}`);

    // Broadcast deletion
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'expense_deleted',
        data: { expenseId }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// POST /api/routes/:id/expenses/scan-receipt - Scan receipt with AI
app.post('/api/routes/:id/expenses/scan-receipt', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;

    // Verify edit access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No receipt image provided' });
    }

    console.log(`Scanning receipt for route ${routeId}...`);

    // Scan receipt with AI
    const scannedData = await ReceiptScannerService.scanReceipt(req.file.buffer, req.file.mimetype);

    res.json({
      success: true,
      data: scannedData,
      message: 'Receipt scanned successfully'
    });
  } catch (error) {
    console.error('Error scanning receipt:', error);
    res.status(500).json({ error: error.message || 'Failed to scan receipt' });
  }
});

// GET /api/routes/:id/expenses/balances - Get user balances
app.get('/api/routes/:id/expenses/balances', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get balances from view
    const result = await pool.query(`
      SELECT
        b.user_id,
        b.balance,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar
      FROM user_balances b
      JOIN users u ON b.user_id = u.id
      WHERE b.route_id = $1
      ORDER BY b.balance DESC
    `, [routeId]);

    // Calculate simplified settlements (who owes whom)
    const balances = result.rows;
    const settlements = calculateSimplifiedSettlements(balances);

    res.json({
      balances: balances,
      settlements: settlements
    });
  } catch (error) {
    console.error('Error calculating balances:', error);
    res.status(500).json({ error: 'Failed to calculate balances' });
  }
});

// POST /api/routes/:id/expenses/settlements - Create settlement
app.post('/api/routes/:id/expenses/settlements', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;
    const { debtorId, creditorId, amount, currency = 'EUR', paymentMethod, paymentReference } = req.body;

    // Verify edit access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Validate
    if (!debtorId || !creditorId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (debtorId === creditorId) {
      return res.status(400).json({ error: 'Debtor and creditor cannot be the same' });
    }

    // Insert settlement
    const result = await pool.query(`
      INSERT INTO expense_settlements (
        route_id, debtor, creditor, amount, currency, payment_method, payment_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [routeId, debtorId, creditorId, parseFloat(amount), currency, paymentMethod, paymentReference]);

    const settlement = result.rows[0];

    // Log activity
    await logRouteActivity(routeId, userId, 'settlement_created', `Created settlement: ${CurrencyService.formatAmount(parseFloat(amount), currency)}`);

    // Broadcast
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'settlement_created',
        data: settlement
      });
    }

    res.json({ settlement });
  } catch (error) {
    console.error('Error creating settlement:', error);
    res.status(500).json({ error: 'Failed to create settlement' });
  }
});

// GET /api/routes/:id/expenses/settlements - List settlements
app.get('/api/routes/:id/expenses/settlements', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(`
      SELECT
        s.*,
        d.name as debtor_name,
        d.avatar_url as debtor_avatar,
        c.name as creditor_name,
        c.avatar_url as creditor_avatar
      FROM expense_settlements s
      JOIN users d ON s.debtor = d.id
      JOIN users c ON s.creditor = c.id
      WHERE s.route_id = $1
      ORDER BY s.created_at DESC
    `, [routeId]);

    res.json({ settlements: result.rows });
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

// PATCH /api/routes/:id/expenses/settlements/:settlementId - Update settlement status
app.patch('/api/routes/:id/expenses/settlements/:settlementId', authMiddleware, async (req, res) => {
  try {
    const { id: routeId, settlementId } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    // Verify edit access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Validate status
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update settlement
    const result = await pool.query(`
      UPDATE expense_settlements
      SET
        status = $1,
        settled_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE settled_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND route_id = $3
      RETURNING *
    `, [status, settlementId, routeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settlement not found' });
    }

    // Log activity
    await logRouteActivity(routeId, userId, 'settlement_updated', `Updated settlement status to ${status}`);

    // Broadcast
    if (global.collaborationService) {
      global.collaborationService.broadcast(routeId, {
        type: 'settlement_updated',
        data: result.rows[0]
      });
    }

    res.json({ settlement: result.rows[0] });
  } catch (error) {
    console.error('Error updating settlement:', error);
    res.status(500).json({ error: 'Failed to update settlement' });
  }
});

// POST /api/routes/:id/budgets - Create/update budget
app.post('/api/routes/:id/budgets', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;
    const { category, budgetedAmount, currency = 'EUR', alertThreshold = 0.8 } = req.body;

    // Verify edit access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission || permission.role === 'viewer') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Validate
    if (!category || !budgetedAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Upsert budget
    const result = await pool.query(`
      INSERT INTO trip_budgets (route_id, category, budgeted_amount, currency, alert_threshold)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (route_id, category)
      DO UPDATE SET
        budgeted_amount = EXCLUDED.budgeted_amount,
        currency = EXCLUDED.currency,
        alert_threshold = EXCLUDED.alert_threshold,
        alert_sent = false,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [routeId, category, parseFloat(budgetedAmount), currency, parseFloat(alertThreshold)]);

    res.json({ budget: result.rows[0] });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// GET /api/routes/:id/budgets - Get budgets with actual spending
app.get('/api/routes/:id/budgets', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;

    // Verify access
    const permission = await checkRoutePermission(routeId, userId);
    if (!permission) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get budgets with actual spending from view
    const result = await pool.query(`
      SELECT
        budget_id,
        route_id,
        category,
        budgeted_amount,
        currency,
        actual_spent,
        remaining,
        spend_percentage,
        alert_threshold,
        alert_sent
      FROM budget_vs_actual
      WHERE route_id = $1
      ORDER BY spend_percentage DESC
    `, [routeId]);

    res.json({ budgets: result.rows });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

/**
 * Helper: Calculate simplified settlements using greedy algorithm
 * Minimizes number of transactions needed to settle all debts
 */
function calculateSimplifiedSettlements(balances) {
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = balances
    .filter(b => b.balance > 0.01) // Small threshold to avoid floating point issues
    .map(b => ({ ...b, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const debtors = balances
    .filter(b => b.balance < -0.01)
    .map(b => ({ ...b, remaining: Math.abs(b.balance) }))
    .sort((a, b) => b.remaining - a.remaining);

  const settlements = [];

  // Greedy algorithm: match largest creditor with largest debtor
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.remaining, debtor.remaining);

    if (amount > 0.01) {
      settlements.push({
        from: debtor.user_id,
        fromName: debtor.user_name,
        to: creditor.user_id,
        toName: creditor.user_name,
        amount: parseFloat(amount.toFixed(2)),
        currency: 'EUR'
      });

      creditor.remaining -= amount;
      debtor.remaining -= amount;
    }

    // Move to next creditor/debtor if current one is settled
    if (creditor.remaining < 0.01) i++;
    if (debtor.remaining < 0.01) j++;
  }

  return settlements;
}

console.log('✅ Expense tracking API endpoints initialized');

// ==================== PHASE 4: MARKETPLACE API ENDPOINTS ====================

/**
 * Helper: Generate SEO-friendly slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 255); // Limit to 255 chars
}

/**
 * Helper: Ensure unique slug by appending counter if needed
 */
async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = excludeId
      ? 'SELECT id FROM published_routes WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM published_routes WHERE slug = $1';
    const params = excludeId ? [slug, excludeId] : [slug];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// GET /api/marketplace/routes - Browse and search marketplace routes
app.get('/api/marketplace/routes', async (req, res) => {
  try {
    const {
      search = '',
      style = 'all',
      duration = 'any',
      difficulty = 'any',
      season = 'any',
      sortBy = 'popular',
      page = 1,
      pageSize = 12
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Build WHERE clause
    let whereConditions = ["pr.status = 'published'"];
    let queryParams = [];
    let paramCounter = 1;

    // Full-text search
    if (search && search.trim()) {
      whereConditions.push(`(
        to_tsvector('english', pr.title || ' ' || pr.description || ' ' ||
          COALESCE(array_to_string(pr.tags, ' '), '') || ' ' ||
          COALESCE(array_to_string(pr.cities_visited, ' '), ''))
        @@ plainto_tsquery('english', $${paramCounter})
      )`);
      queryParams.push(search.trim());
      paramCounter++;
    }

    // Style filter
    if (style !== 'all') {
      whereConditions.push(`pr.primary_style = $${paramCounter}`);
      queryParams.push(style);
      paramCounter++;
    }

    // Duration filter
    if (duration !== 'any') {
      const durationMap = {
        'weekend': [2, 3],
        'week': [4, 7],
        '2-weeks': [8, 14],
        'month': [15, 365]
      };
      const [min, max] = durationMap[duration] || [0, 365];
      whereConditions.push(`pr.duration_days >= $${paramCounter} AND pr.duration_days <= $${paramCounter + 1}`);
      queryParams.push(min, max);
      paramCounter += 2;
    }

    // Difficulty filter
    if (difficulty !== 'any') {
      whereConditions.push(`pr.difficulty_level = $${paramCounter}`);
      queryParams.push(difficulty);
      paramCounter++;
    }

    // Season filter
    if (season !== 'any') {
      whereConditions.push(`(pr.best_season = $${paramCounter} OR pr.best_season = 'year-round')`);
      queryParams.push(season);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Sorting
    const sortMap = {
      'popular': 'pr.clone_count DESC, pr.view_count DESC',
      'recent': 'pr.created_at DESC',
      'rating': 'pr.rating DESC, pr.review_count DESC',
      'clones': 'pr.clone_count DESC'
    };
    const orderBy = sortMap[sortBy] || sortMap['popular'];

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM published_routes pr
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get routes with author info
    queryParams.push(limit, offset);
    const routesQuery = `
      SELECT
        pr.*,
        u.name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar
      FROM published_routes pr
      JOIN users u ON pr.user_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const routesResult = await pool.query(routesQuery, queryParams);

    res.json({
      routes: routesResult.rows.map(row => ({
        id: row.id,
        routeId: row.route_id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        coverImageUrl: row.cover_image_url,
        difficultyLevel: row.difficulty_level,
        durationDays: row.duration_days,
        totalDistanceKm: parseFloat(row.total_distance_km) || 0,
        citiesVisited: row.cities_visited || [],
        countriesVisited: row.countries_visited || [],
        primaryStyle: row.primary_style,
        tags: row.tags || [],
        bestSeason: row.best_season,
        isPremium: row.is_premium,
        price: row.price ? parseFloat(row.price) : null,
        currency: row.currency,
        viewCount: row.view_count,
        cloneCount: row.clone_count,
        rating: parseFloat(row.rating) || 0,
        reviewCount: row.review_count,
        status: row.status,
        featured: row.featured,
        slug: row.slug,
        metaDescription: row.meta_description,
        isModerated: row.is_moderated,
        moderatedAt: row.moderated_at,
        moderatedBy: row.moderated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        authorName: row.author_name,
        authorEmail: row.author_email,
        authorAvatar: row.author_avatar
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('Error fetching marketplace routes:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace routes' });
  }
});

// GET /api/marketplace/routes/:slug - Get route detail by slug
app.get('/api/marketplace/routes/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.headers.authorization ?
      (await authMiddleware(req, res, () => {}), req.user?.id) : null;

    // Increment view count
    await pool.query(`
      UPDATE published_routes
      SET view_count = view_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE slug = $1
    `, [slug]);

    // Get route with author info
    const routeResult = await pool.query(`
      SELECT
        pr.*,
        u.name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar
      FROM published_routes pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.slug = $1 AND pr.status = 'published'
    `, [slug]);

    if (routeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const route = routeResult.rows[0];

    // Get reviews
    const reviewsResult = await pool.query(`
      SELECT
        rr.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM route_reviews rr
      JOIN users u ON rr.user_id = u.id
      WHERE rr.published_route_id = $1
      ORDER BY rr.helpful_count DESC, rr.created_at DESC
    `, [route.id]);

    // Check if user has cloned this route
    let isClonedByUser = false;
    let userReview = null;

    if (userId) {
      const cloneResult = await pool.query(`
        SELECT id FROM route_clones
        WHERE published_route_id = $1 AND user_id = $2
      `, [route.id, userId]);
      isClonedByUser = cloneResult.rows.length > 0;

      // Get user's review if exists
      const userReviewResult = reviewsResult.rows.find(r => r.user_id === userId);
      if (userReviewResult) {
        userReview = {
          id: userReviewResult.id,
          publishedRouteId: userReviewResult.published_route_id,
          userId: userReviewResult.user_id,
          rating: userReviewResult.rating,
          title: userReviewResult.title,
          comment: userReviewResult.comment,
          helpfulCount: userReviewResult.helpful_count,
          notHelpfulCount: userReviewResult.not_helpful_count,
          tripCompletedAt: userReviewResult.trip_completed_at,
          traveledWith: userReviewResult.traveled_with,
          isVerified: userReviewResult.is_verified,
          isFlagged: userReviewResult.is_flagged,
          flaggedReason: userReviewResult.flagged_reason,
          createdAt: userReviewResult.created_at,
          updatedAt: userReviewResult.updated_at,
          userName: userReviewResult.user_name,
          userAvatar: userReviewResult.user_avatar
        };
      }
    }

    res.json({
      route: {
        id: route.id,
        routeId: route.route_id,
        userId: route.user_id,
        title: route.title,
        description: route.description,
        coverImageUrl: route.cover_image_url,
        difficultyLevel: route.difficulty_level,
        durationDays: route.duration_days,
        totalDistanceKm: parseFloat(route.total_distance_km) || 0,
        citiesVisited: route.cities_visited || [],
        countriesVisited: route.countries_visited || [],
        primaryStyle: route.primary_style,
        tags: route.tags || [],
        bestSeason: route.best_season,
        isPremium: route.is_premium,
        price: route.price ? parseFloat(route.price) : null,
        currency: route.currency,
        viewCount: route.view_count,
        cloneCount: route.clone_count,
        rating: parseFloat(route.rating) || 0,
        reviewCount: route.review_count,
        status: route.status,
        featured: route.featured,
        slug: route.slug,
        metaDescription: route.meta_description,
        isModerated: route.is_moderated,
        moderatedAt: route.moderated_at,
        moderatedBy: route.moderated_by,
        createdAt: route.created_at,
        updatedAt: route.updated_at,
        authorName: route.author_name,
        authorEmail: route.author_email,
        authorAvatar: route.author_avatar
      },
      reviews: reviewsResult.rows.map(r => ({
        id: r.id,
        publishedRouteId: r.published_route_id,
        userId: r.user_id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        helpfulCount: r.helpful_count,
        notHelpfulCount: r.not_helpful_count,
        tripCompletedAt: r.trip_completed_at,
        traveledWith: r.traveled_with,
        isVerified: r.is_verified,
        isFlagged: r.is_flagged,
        flaggedReason: r.flagged_reason,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        userName: r.user_name,
        userAvatar: r.user_avatar
      })),
      isClonedByUser,
      userReview
    });
  } catch (error) {
    console.error('Error fetching route detail:', error);
    res.status(500).json({ error: 'Failed to fetch route detail' });
  }
});

// GET /api/marketplace/featured - Get featured routes
app.get('/api/marketplace/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const result = await pool.query(`
      SELECT
        pr.*,
        u.name as author_name,
        u.avatar_url as author_avatar
      FROM published_routes pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.status = 'published' AND pr.featured = true
      ORDER BY pr.created_at DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({
      routes: result.rows.map(row => ({
        id: row.id,
        routeId: row.route_id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        coverImageUrl: row.cover_image_url,
        difficultyLevel: row.difficulty_level,
        durationDays: row.duration_days,
        totalDistanceKm: parseFloat(row.total_distance_km) || 0,
        citiesVisited: row.cities_visited || [],
        countriesVisited: row.countries_visited || [],
        primaryStyle: row.primary_style,
        tags: row.tags || [],
        bestSeason: row.best_season,
        isPremium: row.is_premium,
        price: row.price ? parseFloat(row.price) : null,
        currency: row.currency,
        viewCount: row.view_count,
        cloneCount: row.clone_count,
        rating: parseFloat(row.rating) || 0,
        reviewCount: row.review_count,
        status: row.status,
        featured: row.featured,
        slug: row.slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        authorName: row.author_name,
        authorAvatar: row.author_avatar
      }))
    });
  } catch (error) {
    console.error('Error fetching featured routes:', error);
    res.status(500).json({ error: 'Failed to fetch featured routes' });
  }
});

// GET /api/marketplace/trending - Get trending routes (most cloned recently)
app.get('/api/marketplace/trending', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const result = await pool.query(`
      SELECT
        pr.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        COUNT(rc.id) as recent_clones
      FROM published_routes pr
      JOIN users u ON pr.user_id = u.id
      LEFT JOIN route_clones rc ON pr.id = rc.published_route_id
        AND rc.created_at > NOW() - INTERVAL '30 days'
      WHERE pr.status = 'published'
      GROUP BY pr.id, u.name, u.avatar_url
      ORDER BY recent_clones DESC, pr.clone_count DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({
      routes: result.rows.map(row => ({
        id: row.id,
        routeId: row.route_id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        coverImageUrl: row.cover_image_url,
        difficultyLevel: row.difficulty_level,
        durationDays: row.duration_days,
        totalDistanceKm: parseFloat(row.total_distance_km) || 0,
        citiesVisited: row.cities_visited || [],
        countriesVisited: row.countries_visited || [],
        primaryStyle: row.primary_style,
        tags: row.tags || [],
        bestSeason: row.best_season,
        isPremium: row.is_premium,
        price: row.price ? parseFloat(row.price) : null,
        currency: row.currency,
        viewCount: row.view_count,
        cloneCount: row.clone_count,
        rating: parseFloat(row.rating) || 0,
        reviewCount: row.review_count,
        status: row.status,
        featured: row.featured,
        slug: row.slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        authorName: row.author_name,
        authorAvatar: row.author_avatar
      }))
    });
  } catch (error) {
    console.error('Error fetching trending routes:', error);
    res.status(500).json({ error: 'Failed to fetch trending routes' });
  }
});

// POST /api/routes/:id/publish - Publish a route to marketplace
app.post('/api/routes/:id/publish', authMiddleware, async (req, res) => {
  try {
    const routeId = req.params.id;
    const userId = req.user.id;
    const {
      title,
      description,
      coverImageUrl,
      difficultyLevel,
      primaryStyle,
      tags = [],
      bestSeason,
      isPremium = false,
      price = null
    } = req.body;

    // Verify route ownership
    const routeResult = await pool.query(`
      SELECT * FROM routes WHERE id = $1 AND user_id = $2
    `, [routeId, userId]);

    if (routeResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to publish this route' });
    }

    const route = routeResult.rows[0];
    const routeData = route.route_data || {};

    // Extract route metadata
    const waypoints = routeData.waypoints || [];
    const citiesVisited = waypoints.map(w => w.city || w.name).filter(Boolean);
    const countriesVisited = [...new Set(waypoints.map(w => w.country).filter(Boolean))];
    const durationDays = routeData.nights ? routeData.nights + 1 : waypoints.length;
    const totalDistanceKm = routeData.totalDistance || 0;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!description || description.trim().length < 50) {
      return res.status(400).json({ error: 'Description must be at least 50 characters' });
    }
    if (citiesVisited.length < 2) {
      return res.status(400).json({ error: 'Route must have at least 2 cities' });
    }
    if (!difficultyLevel || !['easy', 'moderate', 'challenging'].includes(difficultyLevel)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }

    // Generate unique slug
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    // Insert published route
    const result = await pool.query(`
      INSERT INTO published_routes (
        route_id, user_id, title, description, cover_image_url,
        difficulty_level, duration_days, total_distance_km,
        cities_visited, countries_visited, primary_style, tags,
        best_season, is_premium, price, slug
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      routeId, userId, title, description, coverImageUrl,
      difficultyLevel, durationDays, totalDistanceKm,
      citiesVisited, countriesVisited, primaryStyle, tags,
      bestSeason, isPremium, price, slug
    ]);

    res.json({
      success: true,
      publishedRoute: {
        id: result.rows[0].id,
        routeId: result.rows[0].route_id,
        userId: result.rows[0].user_id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        coverImageUrl: result.rows[0].cover_image_url,
        difficultyLevel: result.rows[0].difficulty_level,
        durationDays: result.rows[0].duration_days,
        totalDistanceKm: parseFloat(result.rows[0].total_distance_km) || 0,
        citiesVisited: result.rows[0].cities_visited || [],
        countriesVisited: result.rows[0].countries_visited || [],
        primaryStyle: result.rows[0].primary_style,
        tags: result.rows[0].tags || [],
        bestSeason: result.rows[0].best_season,
        isPremium: result.rows[0].is_premium,
        price: result.rows[0].price ? parseFloat(result.rows[0].price) : null,
        currency: result.rows[0].currency,
        viewCount: result.rows[0].view_count,
        cloneCount: result.rows[0].clone_count,
        rating: parseFloat(result.rows[0].rating) || 0,
        reviewCount: result.rows[0].review_count,
        status: result.rows[0].status,
        featured: result.rows[0].featured,
        slug: result.rows[0].slug,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error publishing route:', error);
    res.status(500).json({ error: 'Failed to publish route' });
  }
});

// PATCH /api/marketplace/routes/:id - Update published route
app.patch('/api/marketplace/routes/:id', authMiddleware, async (req, res) => {
  try {
    const publishedRouteId = req.params.id;
    const userId = req.user.id;
    const {
      title,
      description,
      coverImageUrl,
      difficultyLevel,
      primaryStyle,
      tags,
      bestSeason,
      status
    } = req.body;

    // Verify ownership
    const ownerCheck = await pool.query(`
      SELECT user_id FROM published_routes WHERE id = $1
    `, [publishedRouteId]);

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Published route not found' });
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this route' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCounter = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCounter}`);
      values.push(title);
      paramCounter++;

      // Update slug if title changed
      const newBaseSlug = generateSlug(title);
      const newSlug = await ensureUniqueSlug(newBaseSlug, publishedRouteId);
      updates.push(`slug = $${paramCounter}`);
      values.push(newSlug);
      paramCounter++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCounter}`);
      values.push(description);
      paramCounter++;
    }

    if (coverImageUrl !== undefined) {
      updates.push(`cover_image_url = $${paramCounter}`);
      values.push(coverImageUrl);
      paramCounter++;
    }

    if (difficultyLevel !== undefined) {
      updates.push(`difficulty_level = $${paramCounter}`);
      values.push(difficultyLevel);
      paramCounter++;
    }

    if (primaryStyle !== undefined) {
      updates.push(`primary_style = $${paramCounter}`);
      values.push(primaryStyle);
      paramCounter++;
    }

    if (tags !== undefined) {
      updates.push(`tags = $${paramCounter}`);
      values.push(tags);
      paramCounter++;
    }

    if (bestSeason !== undefined) {
      updates.push(`best_season = $${paramCounter}`);
      values.push(bestSeason);
      paramCounter++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCounter}`);
      values.push(status);
      paramCounter++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(publishedRouteId);

    const query = `
      UPDATE published_routes
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      publishedRoute: {
        id: result.rows[0].id,
        routeId: result.rows[0].route_id,
        userId: result.rows[0].user_id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        coverImageUrl: result.rows[0].cover_image_url,
        difficultyLevel: result.rows[0].difficulty_level,
        durationDays: result.rows[0].duration_days,
        totalDistanceKm: parseFloat(result.rows[0].total_distance_km) || 0,
        citiesVisited: result.rows[0].cities_visited || [],
        countriesVisited: result.rows[0].countries_visited || [],
        primaryStyle: result.rows[0].primary_style,
        tags: result.rows[0].tags || [],
        bestSeason: result.rows[0].best_season,
        isPremium: result.rows[0].is_premium,
        price: result.rows[0].price ? parseFloat(result.rows[0].price) : null,
        currency: result.rows[0].currency,
        viewCount: result.rows[0].view_count,
        cloneCount: result.rows[0].clone_count,
        rating: parseFloat(result.rows[0].rating) || 0,
        reviewCount: result.rows[0].review_count,
        status: result.rows[0].status,
        featured: result.rows[0].featured,
        slug: result.rows[0].slug,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error updating published route:', error);
    res.status(500).json({ error: 'Failed to update published route' });
  }
});

// DELETE /api/marketplace/routes/:id - Unpublish route
app.delete('/api/marketplace/routes/:id', authMiddleware, async (req, res) => {
  try {
    const publishedRouteId = req.params.id;
    const userId = req.user.id;

    // Verify ownership
    const ownerCheck = await pool.query(`
      SELECT user_id FROM published_routes WHERE id = $1
    `, [publishedRouteId]);

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Published route not found' });
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this route' });
    }

    // Delete (CASCADE will handle reviews, clones, etc.)
    await pool.query(`
      DELETE FROM published_routes WHERE id = $1
    `, [publishedRouteId]);

    res.json({ success: true, message: 'Route unpublished successfully' });
  } catch (error) {
    console.error('Error unpublishing route:', error);
    res.status(500).json({ error: 'Failed to unpublish route' });
  }
});

// POST /api/marketplace/routes/:slug/clone - Clone a route
app.post('/api/marketplace/routes/:slug/clone', authMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    // Get published route
    const publishedRouteResult = await pool.query(`
      SELECT * FROM published_routes WHERE slug = $1 AND status = 'published'
    `, [slug]);

    if (publishedRouteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const publishedRoute = publishedRouteResult.rows[0];

    // Check if already cloned
    const existingClone = await pool.query(`
      SELECT cloned_route_id FROM route_clones
      WHERE published_route_id = $1 AND user_id = $2
    `, [publishedRoute.id, userId]);

    if (existingClone.rows.length > 0) {
      return res.json({
        success: true,
        clonedRouteId: existingClone.rows[0].cloned_route_id,
        message: 'Already cloned, returning existing clone'
      });
    }

    // Get original route data
    const originalRoute = await pool.query(`
      SELECT * FROM routes WHERE id = $1
    `, [publishedRoute.route_id]);

    if (originalRoute.rows.length === 0) {
      return res.status(404).json({ error: 'Original route data not found' });
    }

    const routeData = originalRoute.rows[0];

    // Create cloned route
    const clonedRouteResult = await pool.query(`
      INSERT INTO routes (user_id, route_data, origin, destination, trip_style, created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      userId,
      routeData.route_data,
      routeData.origin,
      routeData.destination,
      routeData.trip_style
    ]);

    const clonedRouteId = clonedRouteResult.rows[0].id;

    // Create clone tracking entry
    await pool.query(`
      INSERT INTO route_clones (
        published_route_id, original_route_id, cloned_route_id, user_id
      ) VALUES ($1, $2, $3, $4)
    `, [publishedRoute.id, publishedRoute.route_id, clonedRouteId, userId]);

    res.json({
      success: true,
      clonedRouteId,
      message: 'Route cloned successfully'
    });
  } catch (error) {
    console.error('Error cloning route:', error);
    res.status(500).json({ error: 'Failed to clone route' });
  }
});

// POST /api/marketplace/routes/:id/reviews - Add a review
app.post('/api/marketplace/routes/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const publishedRouteId = req.params.id;
    const userId = req.user.id;
    const {
      rating,
      title = null,
      comment,
      tripCompletedAt = null,
      traveledWith = null
    } = req.body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ error: 'Comment must be at least 10 characters' });
    }

    // Check if route exists
    const routeCheck = await pool.query(`
      SELECT user_id FROM published_routes WHERE id = $1 AND status = 'published'
    `, [publishedRouteId]);

    if (routeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Published route not found' });
    }

    // Can't review own route
    if (routeCheck.rows[0].user_id === userId) {
      return res.status(400).json({ error: 'Cannot review your own route' });
    }

    // Check for existing review
    const existingReview = await pool.query(`
      SELECT id FROM route_reviews
      WHERE published_route_id = $1 AND user_id = $2
    `, [publishedRouteId, userId]);

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this route' });
    }

    // Insert review
    const result = await pool.query(`
      INSERT INTO route_reviews (
        published_route_id, user_id, rating, title, comment,
        trip_completed_at, traveled_with
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [publishedRouteId, userId, rating, title, comment, tripCompletedAt, traveledWith]);

    res.json({
      success: true,
      review: {
        id: result.rows[0].id,
        publishedRouteId: result.rows[0].published_route_id,
        userId: result.rows[0].user_id,
        rating: result.rows[0].rating,
        title: result.rows[0].title,
        comment: result.rows[0].comment,
        helpfulCount: result.rows[0].helpful_count,
        notHelpfulCount: result.rows[0].not_helpful_count,
        tripCompletedAt: result.rows[0].trip_completed_at,
        traveledWith: result.rows[0].traveled_with,
        isVerified: result.rows[0].is_verified,
        isFlagged: result.rows[0].is_flagged,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// GET /api/marketplace/routes/:id/reviews - Get reviews for a route
app.get('/api/marketplace/routes/:id/reviews', async (req, res) => {
  try {
    const publishedRouteId = req.params.id;

    const result = await pool.query(`
      SELECT
        rr.*,
        u.name as user_name,
        u.avatar_url as user_avatar
      FROM route_reviews rr
      JOIN users u ON rr.user_id = u.id
      WHERE rr.published_route_id = $1
      ORDER BY rr.helpful_count DESC, rr.created_at DESC
    `, [publishedRouteId]);

    res.json({
      reviews: result.rows.map(r => ({
        id: r.id,
        publishedRouteId: r.published_route_id,
        userId: r.user_id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        helpfulCount: r.helpful_count,
        notHelpfulCount: r.not_helpful_count,
        tripCompletedAt: r.trip_completed_at,
        traveledWith: r.traveled_with,
        isVerified: r.is_verified,
        isFlagged: r.is_flagged,
        flaggedReason: r.flagged_reason,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        userName: r.user_name,
        userAvatar: r.user_avatar
      }))
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

console.log('✅ Marketplace API endpoints initialized');

// ==================== CACHE WARMING (OPTIONAL) ====================

/**
 * Warm cache for popular European cities on startup
 * This pre-generates city details for instant loads
 */
async function warmCacheForPopularCities() {
  const popularCities = [
    { name: 'Paris', country: 'France' },
    { name: 'Barcelona', country: 'Spain' },
    { name: 'Rome', country: 'Italy' },
    { name: 'Amsterdam', country: 'Netherlands' },
    { name: 'Prague', country: 'Czech Republic' },
    { name: 'Vienna', country: 'Austria' },
    { name: 'Lisbon', country: 'Portugal' },
    { name: 'Budapest', country: 'Hungary' },
    { name: 'Berlin', country: 'Germany' },
    { name: 'Copenhagen', country: 'Denmark' },
    { name: 'Dublin', country: 'Ireland' },
    { name: 'Edinburgh', country: 'Scotland' },
    { name: 'Bruges', country: 'Belgium' },
    { name: 'Santorini', country: 'Greece' },
    { name: 'Venice', country: 'Italy' },
    { name: 'Florence', country: 'Italy' },
    { name: 'Lyon', country: 'France' },
    { name: 'Porto', country: 'Portugal' },
    { name: 'Krakow', country: 'Poland' },
    { name: 'Seville', country: 'Spain' }
  ];

  console.log(`🔥 Starting cache warming for ${popularCities.length} popular cities...`);

  let alreadyCached = 0;
  let needsGeneration = 0;

  for (const city of popularCities) {
    try {
      // Check if already cached
      const cached = await db.query(
        'SELECT city_name FROM city_details WHERE LOWER(city_name) = LOWER($1)',
        [city.name]
      );

      if (cached.rows.length > 0) {
        alreadyCached++;
      } else {
        needsGeneration++;
        // Generate full details in background (don't await - let it run)
        generateCityDetailsFull(city.name, city.country)
          .then(async (fullDetails) => {
            // Save to database
            await db.query(`
              INSERT INTO city_details (
                city_name, country, tagline, main_image_url, rating, recommended_duration,
                why_visit, best_for, highlights, restaurants, accommodations,
                parking_info, parking_difficulty, environmental_zones, best_time_to_visit,
                events_festivals, local_tips, warnings, weather_overview, latitude, longitude,
                generation_phase
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
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
                generation_phase = EXCLUDED.generation_phase,
                updated_at = CURRENT_TIMESTAMP
            `, [
              city.name,
              fullDetails.country,
              fullDetails.tagline,
              fullDetails.mainImageUrl,
              fullDetails.rating,
              fullDetails.recommendedDuration,
              fullDetails.whyVisit,
              JSON.stringify(fullDetails.bestFor),
              JSON.stringify(fullDetails.highlights),
              JSON.stringify(fullDetails.restaurants),
              JSON.stringify(fullDetails.accommodations),
              fullDetails.parking?.info,
              fullDetails.parking?.difficulty,
              JSON.stringify(fullDetails.environmentalZones),
              JSON.stringify(fullDetails.bestTimeToVisit),
              JSON.stringify(fullDetails.eventsFestivals),
              JSON.stringify(fullDetails.localTips),
              JSON.stringify(fullDetails.warnings),
              fullDetails.weatherOverview,
              fullDetails.coordinates?.latitude,
              fullDetails.coordinates?.longitude,
              'complete'
            ]);
            console.log(`✅ Cache warmed: ${city.name}`);
          })
          .catch(err => {
            console.warn(`⚠️  Failed to warm cache for ${city.name}:`, err.message);
          });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.warn(`⚠️  Error checking cache for ${city.name}:`, error.message);
    }
  }

  console.log(`🔥 Cache warming status: ${alreadyCached} already cached, ${needsGeneration} generating...`);
}

// =====================================================
// TRIP IN PROGRESS MODE API
// Real-time trip tracking, check-ins, and location updates
// =====================================================

/**
 * Start or resume a trip
 * POST /api/trip/:routeId/start
 */
app.post('/api/trip/:routeId/start', authenticateToken, async (req, res) => {
  const { routeId } = req.params;
  const { itineraryId } = req.body;
  const userId = req.user.id;

  console.log(`🚀 [Trip] Starting trip for route ${routeId} by user ${userId}`);

  try {
    // Check if route exists and user has access
    const routeResult = await pool.query(
      `SELECT r.*,
              COALESCE(r.total_nights, 0) + 1 as total_days
       FROM routes r
       LEFT JOIN route_collaborators rc ON r.id = rc.route_id AND rc.user_id = $2
       WHERE r.id = $1 AND (r.user_id = $2 OR rc.user_id = $2 OR r.is_public = true)`,
      [routeId, userId]
    );

    if (routeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Route not found or access denied' });
    }

    const route = routeResult.rows[0];

    // Check if user already has an active trip for this route
    const existingTrip = await pool.query(
      `SELECT * FROM active_trips
       WHERE route_id = $1 AND user_id = $2 AND status IN ('active', 'paused')`,
      [routeId, userId]
    );

    if (existingTrip.rows.length > 0) {
      const trip = existingTrip.rows[0];

      // If paused, resume it
      if (trip.status === 'paused') {
        const resumedTrip = await pool.query(
          `UPDATE active_trips
           SET status = 'active', paused_at = NULL, updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [trip.id]
        );

        console.log(`▶️ [Trip] Resumed trip ${trip.id}`);
        return res.json({
          success: true,
          tripId: trip.id,
          trip: {
            ...resumedTrip.rows[0],
            origin_city: route.origin,
            destination_city: route.destination,
            route_data: route.route_data,
          },
          isNew: false,
          resumed: true,
        });
      }

      // Already active
      console.log(`ℹ️ [Trip] Trip ${trip.id} already active`);
      return res.json({
        success: true,
        tripId: trip.id,
        trip: {
          ...trip,
          origin_city: route.origin,
          destination_city: route.destination,
          route_data: route.route_data,
        },
        isNew: false,
        resumed: false,
      });
    }

    // Calculate total checkins from route data
    const routeData = route.route_data || {};
    const cities = routeData.cities || [];
    let totalCheckins = 0;
    cities.forEach(city => {
      if (city.activities) totalCheckins += city.activities.length;
      if (city.restaurants) totalCheckins += city.restaurants.length;
    });

    // Create new trip
    const newTrip = await pool.query(
      `INSERT INTO active_trips (
        route_id, itinerary_id, user_id, status, current_day, current_city_index,
        stats, started_at
      ) VALUES ($1, $2, $3, 'active', 1, 0, $4, NOW())
      RETURNING *`,
      [
        routeId,
        itineraryId || null,
        userId,
        JSON.stringify({
          distance_traveled: 0,
          photos_captured: 0,
          checkins_complete: 0,
          total_checkins: totalCheckins,
        }),
      ]
    );

    const trip = newTrip.rows[0];
    console.log(`✅ [Trip] Created new trip ${trip.id}`);

    res.json({
      success: true,
      tripId: trip.id,
      trip: {
        ...trip,
        origin_city: route.origin,
        destination_city: route.destination,
        route_data: route.route_data,
      },
      isNew: true,
      resumed: false,
    });
  } catch (error) {
    console.error('❌ [Trip] Error starting trip:', error);
    res.status(500).json({ error: 'Failed to start trip' });
  }
});

/**
 * Get user's currently active trip
 * GET /api/trip/active
 */
app.get('/api/trip/active', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.*, r.origin, r.destination, r.route_data,
              COALESCE(r.total_nights, 0) + 1 as total_days
       FROM active_trips t
       JOIN routes r ON t.route_id = r.id
       WHERE t.user_id = $1 AND t.status = 'active'
       ORDER BY t.started_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ hasActiveTrip: false, trip: null });
    }

    const trip = result.rows[0];
    res.json({
      hasActiveTrip: true,
      trip: {
        ...trip,
        origin_city: trip.origin,
        destination_city: trip.destination,
      },
    });
  } catch (error) {
    console.error('❌ [Trip] Error getting active trip:', error);
    res.status(500).json({ error: 'Failed to get active trip' });
  }
});

/**
 * Get trip by ID
 * GET /api/trip/:tripId
 */
app.get('/api/trip/:tripId', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user.id;

  // Skip if tripId looks like a routeId endpoint (e.g., "active")
  if (tripId === 'active') {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  try {
    const result = await pool.query(
      `SELECT t.*, r.origin, r.destination, r.route_data,
              COALESCE(r.total_nights, 0) + 1 as total_days
       FROM active_trips t
       JOIN routes r ON t.route_id = r.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [tripId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = result.rows[0];
    res.json({
      trip: {
        ...trip,
        origin_city: trip.origin,
        destination_city: trip.destination,
      },
    });
  } catch (error) {
    console.error('❌ [Trip] Error getting trip:', error);
    res.status(500).json({ error: 'Failed to get trip' });
  }
});

/**
 * Get today's activities for a trip
 * GET /api/trip/:tripId/today
 */
app.get('/api/trip/:tripId/today', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user.id;

  try {
    // Get trip with route data
    const tripResult = await pool.query(
      `SELECT t.*, r.route_data, r.origin, r.destination,
              COALESCE(r.total_nights, 0) + 1 as total_days
       FROM active_trips t
       JOIN routes r ON t.route_id = r.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [tripId, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];
    const routeData = trip.route_data || {};
    const cities = routeData.cities || [];
    const currentDay = trip.current_day || 1;
    const currentCityIndex = trip.current_city_index || 0;

    // Get the current city
    const currentCity = cities[currentCityIndex] || cities[0] || { name: 'Unknown', activities: [], restaurants: [] };

    // Get check-ins for today to mark completed activities
    const checkinsResult = await pool.query(
      `SELECT activity_id, status FROM trip_checkins
       WHERE trip_id = $1 AND day_number = $2`,
      [tripId, currentDay]
    );
    const completedActivities = new Set(
      checkinsResult.rows.filter(c => c.status === 'completed').map(c => c.activity_id)
    );

    // Build today's activities from route data
    const activities = [];
    let timeCounter = 9; // Start at 9 AM

    // Add activities
    const cityActivities = currentCity.activities || currentCity.agentResults?.activities || [];
    cityActivities.forEach((activity, index) => {
      const activityId = `activity-${currentDay}-${index}`;
      const hour = timeCounter;
      timeCounter += 2; // Each activity takes ~2 hours

      activities.push({
        id: activityId,
        type: activity.type || 'activity',
        time: `${hour.toString().padStart(2, '0')}:00`,
        title: activity.name || activity.title || 'Activity',
        location: activity.address || activity.location || currentCity.name,
        duration: activity.duration || '2h',
        description: activity.description || activity.why,
        status: completedActivities.has(activityId) ? 'completed' : (hour <= new Date().getHours() ? 'current' : 'upcoming'),
        coordinates: activity.coordinates,
        image: activity.image,
        rating: activity.rating,
        phone: activity.phone,
      });
    });

    // Add restaurants
    const restaurants = currentCity.restaurants || currentCity.agentResults?.restaurants || [];
    restaurants.forEach((restaurant, index) => {
      const restaurantId = `restaurant-${currentDay}-${index}`;
      // Lunch at 12, Dinner at 19
      const hour = index === 0 ? 12 : 19;

      activities.push({
        id: restaurantId,
        type: 'restaurant',
        time: `${hour.toString().padStart(2, '0')}:00`,
        title: restaurant.name || 'Restaurant',
        location: restaurant.address || restaurant.location || currentCity.name,
        duration: '1.5h',
        description: restaurant.description || restaurant.cuisine,
        status: completedActivities.has(restaurantId) ? 'completed' : (hour <= new Date().getHours() ? 'current' : 'upcoming'),
        coordinates: restaurant.coordinates,
        image: restaurant.image,
        rating: restaurant.rating,
        phone: restaurant.phone,
        priceLevel: restaurant.price_level,
      });
    });

    // Sort by time
    activities.sort((a, b) => a.time.localeCompare(b.time));

    // Mark the first non-completed activity as current
    let foundCurrent = false;
    activities.forEach(act => {
      if (!foundCurrent && act.status !== 'completed') {
        act.status = 'current';
        foundCurrent = true;
      } else if (act.status === 'current' && foundCurrent) {
        act.status = 'upcoming';
      }
    });

    res.json({
      activities,
      day: currentDay,
      totalDays: trip.total_days || cities.length,
      city: currentCity.name || currentCity.city || 'Unknown',
      date: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('❌ [Trip] Error getting today activities:', error);
    res.status(500).json({ error: 'Failed to get today activities' });
  }
});

/**
 * Get trip progress dashboard
 * GET /api/trip/:tripId/progress
 */
app.get('/api/trip/:tripId/progress', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user.id;

  try {
    // Get trip with route data
    const tripResult = await pool.query(
      `SELECT t.*, r.route_data, r.origin, r.destination,
              COALESCE(r.total_nights, 0) + 1 as total_days
       FROM active_trips t
       JOIN routes r ON t.route_id = r.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [tripId, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];
    const routeData = trip.route_data || {};
    const cities = routeData.cities || [];
    const stats = trip.stats || {};

    // Get photos from check-ins
    const photosResult = await pool.query(
      `SELECT photo_urls, location_name, note
       FROM trip_checkins
       WHERE trip_id = $1 AND photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0
       ORDER BY checked_in_at DESC
       LIMIT 20`,
      [tripId]
    );

    const photos = [];
    photosResult.rows.forEach(row => {
      if (row.photo_urls) {
        row.photo_urls.forEach(url => {
          photos.push({
            url,
            city: row.location_name || 'Unknown',
            caption: row.note,
          });
        });
      }
    });

    res.json({
      tripId,
      currentDay: trip.current_day || 1,
      totalDays: trip.total_days || cities.length,
      currentCityIndex: trip.current_city_index || 0,
      cities: cities.map(city => ({
        name: city.name || city.city || 'Unknown',
        country: city.country,
        dates: city.dates,
      })),
      stats: {
        distanceTraveled: stats.distance_traveled || 0,
        photosCaptures: stats.photos_captured || 0,
        checkinsComplete: stats.checkins_complete || 0,
        totalCheckins: stats.total_checkins || 0,
      },
      photos,
    });
  } catch (error) {
    console.error('❌ [Trip] Error getting trip progress:', error);
    res.status(500).json({ error: 'Failed to get trip progress' });
  }
});

/**
 * Update trip location (GPS tracking)
 * POST /api/trip/:tripId/location
 */
app.post('/api/trip/:tripId/location', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { latitude, longitude, accuracy, altitude, speed, heading, city, country, address } = req.body;
  const userId = req.user.id;

  try {
    // Verify trip ownership
    const tripResult = await pool.query(
      'SELECT id FROM active_trips WHERE id = $1 AND user_id = $2 AND status = $3',
      [tripId, userId, 'active']
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Active trip not found' });
    }

    // Update trip with latest location
    const locationData = {
      lat: latitude,
      lng: longitude,
      accuracy,
      timestamp: new Date().toISOString(),
      city,
      country,
      address,
    };

    await pool.query(
      `UPDATE active_trips
       SET last_location = $1, last_location_update = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(locationData), tripId]
    );

    // Store in location history
    await pool.query(
      `INSERT INTO trip_location_updates
       (trip_id, user_id, latitude, longitude, accuracy, altitude, speed, heading, city, country, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [tripId, userId, latitude, longitude, accuracy, altitude, speed, heading, city, country, address]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('❌ [Trip] Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * Create a check-in
 * POST /api/trip/:tripId/checkin
 */
app.post('/api/trip/:tripId/checkin', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const {
    activityId, activityName, activityType, dayNumber,
    locationName, coordinates, photoUrls, note, rating, mood, weather, status
  } = req.body;
  const userId = req.user.id;

  try {
    // Verify trip ownership
    const tripResult = await pool.query(
      'SELECT id, current_day FROM active_trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];
    const day = dayNumber || trip.current_day;

    // Create check-in
    const checkinResult = await pool.query(
      `INSERT INTO trip_checkins (
        trip_id, user_id, activity_id, activity_name, activity_type, day_number,
        location_name, coordinates, photo_urls, note, rating, mood, weather, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        tripId, userId, activityId, activityName, activityType, day,
        locationName, coordinates ? JSON.stringify(coordinates) : null,
        photoUrls || null, note, rating, mood, weather, status || 'completed'
      ]
    );

    const checkin = checkinResult.rows[0];
    console.log(`📍 [Trip] Check-in created for trip ${tripId}: ${activityName}`);

    res.json({ success: true, checkin });
  } catch (error) {
    console.error('❌ [Trip] Error creating check-in:', error);
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

/**
 * Get check-ins for a trip
 * GET /api/trip/:tripId/checkins
 */
app.get('/api/trip/:tripId/checkins', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const { dayNumber, limit } = req.query;
  const userId = req.user.id;

  try {
    let query = `
      SELECT * FROM trip_checkins
      WHERE trip_id = $1 AND user_id = $2
    `;
    const params = [tripId, userId];

    if (dayNumber) {
      query += ` AND day_number = $${params.length + 1}`;
      params.push(dayNumber);
    }

    query += ` ORDER BY checked_in_at DESC`;

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(query, params);
    res.json({ checkins: result.rows });
  } catch (error) {
    console.error('❌ [Trip] Error getting check-ins:', error);
    res.status(500).json({ error: 'Failed to get check-ins' });
  }
});

/**
 * Advance to the next day
 * POST /api/trip/:tripId/advance-day
 */
app.post('/api/trip/:tripId/advance-day', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE active_trips
       SET current_day = current_day + 1,
           current_city_index = current_city_index + 1,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'active'
       RETURNING current_day`,
      [tripId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active trip not found' });
    }

    console.log(`📅 [Trip] Advanced to day ${result.rows[0].current_day}`);
    res.json({ success: true, currentDay: result.rows[0].current_day });
  } catch (error) {
    console.error('❌ [Trip] Error advancing day:', error);
    res.status(500).json({ error: 'Failed to advance day' });
  }
});

/**
 * Pause the trip
 * POST /api/trip/:tripId/pause
 */
app.post('/api/trip/:tripId/pause', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE active_trips
       SET status = 'paused', paused_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'active'
       RETURNING *`,
      [tripId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active trip not found' });
    }

    console.log(`⏸️ [Trip] Paused trip ${tripId}`);
    res.json({ success: true, trip: result.rows[0] });
  } catch (error) {
    console.error('❌ [Trip] Error pausing trip:', error);
    res.status(500).json({ error: 'Failed to pause trip' });
  }
});

/**
 * Complete the trip
 * POST /api/trip/:tripId/complete
 */
app.post('/api/trip/:tripId/complete', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE active_trips
       SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('active', 'paused')
       RETURNING *`,
      [tripId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    console.log(`🏁 [Trip] Completed trip ${tripId}`);
    res.json({ success: true, trip: result.rows[0] });
  } catch (error) {
    console.error('❌ [Trip] Error completing trip:', error);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
});

/**
 * Update trip statistics
 * POST /api/trip/:tripId/stats
 */
app.post('/api/trip/:tripId/stats', authenticateToken, async (req, res) => {
  const { tripId } = req.params;
  const statsUpdate = req.body;
  const userId = req.user.id;

  try {
    // Get current stats
    const tripResult = await pool.query(
      'SELECT stats FROM active_trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const currentStats = tripResult.rows[0].stats || {};
    const newStats = { ...currentStats, ...statsUpdate };

    const result = await pool.query(
      `UPDATE active_trips
       SET stats = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING stats`,
      [JSON.stringify(newStats), tripId, userId]
    );

    res.json({ success: true, stats: result.rows[0].stats });
  } catch (error) {
    console.error('❌ [Trip] Error updating stats:', error);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// =====================================================
// END TRIP IN PROGRESS MODE API
// =====================================================

// Run migrations and then start server
runDatabaseMigrations().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚗 Road Trip Planner MVP running on port ${PORT}`);
    console.log(`📍 Loaded ${europeanLandmarks.length} European landmarks`);

    // Initialize WebSocket CollaborationService for real-time features
    const CollaborationService = require('./server/services/CollaborationService');
    const collaborationService = new CollaborationService(server, pool);
    global.collaborationService = collaborationService; // Make available to API endpoints

    // Initialize Proactive AI Monitoring Service (STEP 4 Phase 1)
    const { getInstance: getProactiveAgent } = require('./server/services/ProactiveAgentService');
    const proactiveAgent = getProactiveAgent();
    proactiveAgent.start(); // Start background monitoring
    global.proactiveAgent = proactiveAgent; // Make available for manual triggers

    // Cache warming enabled for instant loads on popular cities
    warmCacheForPopularCities();

    // Graceful shutdown handler
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, closing server gracefully...');
      collaborationService.close();
      proactiveAgent.stop();
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, closing server gracefully...');
      collaborationService.close();
      proactiveAgent.stop();
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});