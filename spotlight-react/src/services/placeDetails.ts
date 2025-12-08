/**
 * Place Details Enrichment Service
 * WI-2.4: Fetches additional details for places on-demand
 *
 * This service enriches basic place data with full details from Google Places
 * Details API when a user wants to learn more about a specific place.
 *
 * Architecture Decisions:
 * - On-demand fetching only (not for all places upfront) to minimize API costs
 * - Aggressive caching since place details don't change frequently
 * - Review analysis extracts key phrases for "why visit" text
 * - Separate from hiddenGems service to keep concerns isolated
 *
 * API Cost Optimization:
 * - Only fetch when user explicitly views a place
 * - Cache for 24 hours (places rarely change)
 * - Request only needed fields to reduce response size
 */

import { type Coordinates, type PhotoReference, type OpeningHours } from './hiddenGems';

// ============================================================================
// Types
// ============================================================================

/**
 * Individual review from Google Places
 */
export interface PlaceReview {
  /** Reviewer's display name */
  authorName: string;
  /** Reviewer's profile photo URL */
  authorPhotoUrl?: string;
  /** Rating given in this review (1-5) */
  rating: number;
  /** Full review text */
  text: string;
  /** When the review was posted */
  relativeTimeDescription: string;
  /** Unix timestamp of review */
  time: number;
  /** Language of the review */
  language?: string;
}

/**
 * Extracted highlights from reviews
 */
export interface ReviewHighlights {
  /** Key positive phrases mentioned frequently */
  positives: string[];
  /** What people commonly praise */
  commonPraise: string[];
  /** Generated "why visit" summary */
  whyVisit: string;
  /** Best quote from reviews */
  bestQuote?: string;
  /** Number of reviews analyzed */
  reviewsAnalyzed: number;
}

/**
 * Enhanced photo with more details
 */
export interface EnrichedPhoto extends PhotoReference {
  /** Photo attribution (photographer credit) */
  attribution?: string;
  /** Resolved full-size URL */
  fullUrl?: string;
  /** Resolved thumbnail URL */
  thumbnailUrl?: string;
}

/**
 * Detailed opening hours
 */
export interface DetailedOpeningHours extends OpeningHours {
  /** Full weekday text for each day */
  weekdayText: string[];
  /** Special hours (holidays, etc.) */
  specialDays?: Array<{
    date: string;
    hours: string;
  }>;
  /** Current status string (e.g., "Open until 10 PM") */
  currentStatus?: string;
}

/**
 * Full place details response
 */
export interface PlaceDetails {
  /** Google Places ID */
  placeId: string;
  /** Place name */
  name: string;
  /** Full formatted address */
  formattedAddress: string;
  /** Coordinates */
  coordinates: Coordinates;
  /** Rating (1-5) */
  rating: number;
  /** Total number of reviews */
  reviewCount: number;
  /** Price level (1-4) */
  priceLevel: number | null;
  /** Google Places types */
  types: string[];

  // Contact Information
  /** Website URL */
  website?: string;
  /** Phone number (formatted) */
  phoneNumber?: string;
  /** International phone format */
  internationalPhoneNumber?: string;
  /** Google Maps URL */
  googleMapsUrl?: string;

  // Hours
  /** Detailed opening hours */
  openingHours: DetailedOpeningHours | null;
  /** Whether currently open */
  isOpenNow?: boolean;

  // Photos (enriched)
  /** All available photos */
  photos: EnrichedPhoto[];

  // Reviews
  /** Top reviews */
  reviews: PlaceReview[];
  /** Extracted review highlights */
  reviewHighlights: ReviewHighlights;

  // Editorial
  /** Google's editorial summary */
  editorialSummary?: string;
  /** User-generated summary from reviews */
  generatedSummary?: string;

  // Attributes
  /** Accessibility features */
  accessibilityFeatures?: string[];
  /** Amenities (wifi, parking, etc.) */
  amenities?: string[];
  /** Dining options (dine-in, takeout, delivery) */
  diningOptions?: string[];
  /** Payment options */
  paymentOptions?: string[];

  // Meta
  /** When details were fetched */
  fetchedAt: Date;
  /** Whether from cache */
  fromCache: boolean;
}

/**
 * Fetch options
 */
export interface FetchPlaceDetailsOptions {
  /** Skip cache and force fresh fetch */
  forceRefresh?: boolean;
  /** Include full reviews (vs just highlights) */
  includeFullReviews?: boolean;
  /** Maximum number of photos to fetch */
  maxPhotos?: number;
  /** Use mock data for development */
  useMock?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** API base URL */
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'
);

/** Cache TTL - 24 hours (place details rarely change) */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/** Default max photos */
const DEFAULT_MAX_PHOTOS = 10;

/**
 * Common positive phrases to look for in reviews
 */
const POSITIVE_PHRASES = [
  'amazing', 'incredible', 'fantastic', 'excellent', 'wonderful',
  'delicious', 'perfect', 'beautiful', 'lovely', 'great',
  'best', 'favorite', 'favourite', 'must visit', 'must-visit',
  'highly recommend', 'hidden gem', 'local favorite', 'authentic',
  'friendly staff', 'great service', 'cozy', 'charming', 'unique',
  'fresh', 'homemade', 'traditional', 'stunning', 'breathtaking',
  'peaceful', 'relaxing', 'memorable', 'special', 'worth',
];

/**
 * Categories of praise to track
 */
const PRAISE_CATEGORIES = {
  food: ['delicious', 'tasty', 'fresh', 'flavorful', 'authentic', 'homemade', 'best food'],
  service: ['friendly', 'helpful', 'attentive', 'welcoming', 'great service', 'staff'],
  atmosphere: ['cozy', 'charming', 'beautiful', 'peaceful', 'relaxing', 'ambiance', 'vibe'],
  value: ['worth', 'reasonable', 'good value', 'affordable', 'prices'],
  location: ['view', 'location', 'scenic', 'beautiful setting'],
  uniqueness: ['unique', 'special', 'hidden gem', 'one of a kind', 'original'],
};

// ============================================================================
// Cache
// ============================================================================

interface DetailsCacheEntry {
  data: PlaceDetails;
  fetchedAt: Date;
  expiresAt: Date;
}

class PlaceDetailsCache {
  private cache: Map<string, DetailsCacheEntry> = new Map();

  get(placeId: string): PlaceDetails | null {
    const entry = this.cache.get(placeId);

    if (!entry) return null;

    // Check expiry
    if (new Date() > entry.expiresAt) {
      this.cache.delete(placeId);
      return null;
    }

    return {
      ...entry.data,
      fromCache: true,
    };
  }

  set(placeId: string, data: PlaceDetails): void {
    const now = new Date();
    this.cache.set(placeId, {
      data,
      fetchedAt: now,
      expiresAt: new Date(now.getTime() + CACHE_TTL),
    });

    this.cleanup();
  }

  private cleanup(): void {
    const now = new Date();
    const maxEntries = 100;

    // Remove expired
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // Limit size
    if (this.cache.size > maxEntries) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].fetchedAt.getTime() - b[1].fetchedAt.getTime());

      entries.slice(0, this.cache.size - maxEntries)
        .forEach(([key]) => this.cache.delete(key));
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number } {
    return { size: this.cache.size };
  }
}

const detailsCache = new PlaceDetailsCache();

// ============================================================================
// Review Analysis
// ============================================================================

/**
 * Extract key phrases from review text
 */
function extractKeyPhrases(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];

  POSITIVE_PHRASES.forEach((phrase) => {
    if (lowerText.includes(phrase)) {
      found.push(phrase);
    }
  });

  return found;
}

/**
 * Categorize praise from reviews
 */
function categorizePraise(reviews: PlaceReview[]): Record<string, number> {
  const counts: Record<string, number> = {};

  reviews.forEach((review) => {
    const lowerText = review.text.toLowerCase();

    Object.entries(PRAISE_CATEGORIES).forEach(([category, keywords]) => {
      keywords.forEach((keyword) => {
        if (lowerText.includes(keyword)) {
          counts[category] = (counts[category] || 0) + 1;
        }
      });
    });
  });

  return counts;
}

/**
 * Find the best quote from reviews
 */
function findBestQuote(reviews: PlaceReview[]): string | undefined {
  // Filter to high-rated reviews with substantial text
  const goodReviews = reviews
    .filter((r) => r.rating >= 4 && r.text.length >= 50 && r.text.length <= 300)
    .sort((a, b) => b.rating - a.rating);

  if (goodReviews.length === 0) return undefined;

  // Find one with positive phrases
  for (const review of goodReviews) {
    const phrases = extractKeyPhrases(review.text);
    if (phrases.length >= 2) {
      // Extract a sentence containing positive words
      const sentences = review.text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
      for (const sentence of sentences) {
        const sentencePhrases = extractKeyPhrases(sentence);
        if (sentencePhrases.length >= 1) {
          return sentence.trim();
        }
      }
    }
  }

  // Fallback to first good review's first sentence
  const firstSentence = goodReviews[0].text.split(/[.!?]+/)[0];
  return firstSentence?.trim();
}

/**
 * Generate "why visit" text from reviews
 */
function generateWhyVisit(
  reviews: PlaceReview[],
  placeName: string,
  praiseCategories: Record<string, number>
): string {
  if (reviews.length === 0) {
    return `${placeName} is a hidden gem waiting to be discovered.`;
  }

  // Sort praise by frequency
  const sortedPraise = Object.entries(praiseCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  // Build why visit text based on top praise categories
  const parts: string[] = [];

  if (sortedPraise.includes('food')) {
    parts.push('exceptional food that locals rave about');
  }
  if (sortedPraise.includes('atmosphere')) {
    parts.push('a charming atmosphere');
  }
  if (sortedPraise.includes('service')) {
    parts.push('warm, welcoming service');
  }
  if (sortedPraise.includes('uniqueness')) {
    parts.push('a truly unique experience');
  }
  if (sortedPraise.includes('location')) {
    parts.push('stunning views');
  }
  if (sortedPraise.includes('value')) {
    parts.push('great value');
  }

  if (parts.length === 0) {
    return `Discover ${placeName} - a local favorite with consistently positive reviews.`;
  }

  if (parts.length === 1) {
    return `${placeName} stands out for ${parts[0]}.`;
  }

  const lastPart = parts.pop();
  return `${placeName} is known for ${parts.join(', ')} and ${lastPart}.`;
}

/**
 * Analyze reviews and extract highlights
 */
function analyzeReviews(reviews: PlaceReview[], placeName: string): ReviewHighlights {
  if (reviews.length === 0) {
    return {
      positives: [],
      commonPraise: [],
      whyVisit: `${placeName} is a hidden gem waiting to be discovered.`,
      reviewsAnalyzed: 0,
    };
  }

  // Extract all positive phrases
  const allPhrases: string[] = [];
  reviews.forEach((review) => {
    allPhrases.push(...extractKeyPhrases(review.text));
  });

  // Count phrase frequency
  const phraseCounts: Record<string, number> = {};
  allPhrases.forEach((phrase) => {
    phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
  });

  // Get top positives (mentioned multiple times)
  const positives = Object.entries(phraseCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);

  // Categorize praise
  const praiseCategories = categorizePraise(reviews);
  const commonPraise = Object.entries(praiseCategories)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => {
      // Convert category to display text
      const displayMap: Record<string, string> = {
        food: 'Great food',
        service: 'Excellent service',
        atmosphere: 'Lovely atmosphere',
        value: 'Good value',
        location: 'Perfect location',
        uniqueness: 'Unique experience',
      };
      return displayMap[category] || category;
    });

  // Find best quote
  const bestQuote = findBestQuote(reviews);

  // Generate why visit
  const whyVisit = generateWhyVisit(reviews, placeName, praiseCategories);

  return {
    positives,
    commonPraise,
    whyVisit,
    bestQuote,
    reviewsAnalyzed: reviews.length,
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get auth headers
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Transform raw API response to PlaceDetails
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPlaceDetails(raw: any, maxPhotos: number): PlaceDetails {
  // Transform reviews
  const reviews: PlaceReview[] = (raw.reviews || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (review: any) => ({
      authorName: review.author_name || review.authorName || 'Anonymous',
      authorPhotoUrl: review.profile_photo_url || review.authorPhotoUrl,
      rating: review.rating || 5,
      text: review.text || '',
      relativeTimeDescription: review.relative_time_description || review.relativeTimeDescription || 'Recently',
      time: review.time || Date.now() / 1000,
      language: review.language,
    })
  );

  // Transform photos
  const photos: EnrichedPhoto[] = (raw.photos || [])
    .slice(0, maxPhotos)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((photo: any) => ({
      reference: photo.photo_reference || photo.reference || '',
      width: photo.width || 800,
      height: photo.height || 600,
      attribution: photo.html_attributions?.[0] || photo.attribution,
      url: photo.url,
      fullUrl: photo.fullUrl,
      thumbnailUrl: photo.thumbnailUrl,
    }));

  // Transform opening hours
  let openingHours: DetailedOpeningHours | null = null;
  const rawHours = raw.opening_hours || raw.openingHours;
  if (rawHours) {
    openingHours = {
      openNow: rawHours.open_now ?? rawHours.openNow ?? false,
      weekdayText: rawHours.weekday_text || rawHours.weekdayText || [],
      periods: rawHours.periods,
      currentStatus: rawHours.current_opening_hours?.open_now
        ? `Open${rawHours.weekday_text?.[new Date().getDay()] ? ` - ${rawHours.weekday_text[new Date().getDay()]}` : ''}`
        : 'Closed',
    };
  }

  // Extract coordinates
  const location = raw.geometry?.location || raw.coordinates || {};

  // Analyze reviews
  const reviewHighlights = analyzeReviews(reviews, raw.name || 'This place');

  return {
    placeId: raw.place_id || raw.placeId,
    name: raw.name || 'Unknown Place',
    formattedAddress: raw.formatted_address || raw.formattedAddress || raw.vicinity || '',
    coordinates: {
      lat: location.lat || 0,
      lng: location.lng || 0,
    },
    rating: raw.rating || 0,
    reviewCount: raw.user_ratings_total || raw.reviewCount || 0,
    priceLevel: raw.price_level ?? raw.priceLevel ?? null,
    types: raw.types || [],

    // Contact
    website: raw.website,
    phoneNumber: raw.formatted_phone_number || raw.phoneNumber,
    internationalPhoneNumber: raw.international_phone_number || raw.internationalPhoneNumber,
    googleMapsUrl: raw.url || raw.googleMapsUrl,

    // Hours
    openingHours,
    isOpenNow: rawHours?.open_now ?? rawHours?.openNow,

    // Photos & Reviews
    photos,
    reviews,
    reviewHighlights,

    // Editorial
    editorialSummary: raw.editorial_summary?.overview || raw.editorialSummary,
    generatedSummary: reviewHighlights.whyVisit,

    // Attributes (if available)
    accessibilityFeatures: raw.accessibility_features || raw.accessibilityFeatures,
    amenities: raw.amenities,
    diningOptions: extractDiningOptions(raw),
    paymentOptions: raw.payment_options || raw.paymentOptions,

    // Meta
    fetchedAt: new Date(),
    fromCache: false,
  };
}

/**
 * Extract dining options from raw data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDiningOptions(raw: any): string[] {
  const options: string[] = [];

  if (raw.dine_in || raw.dineIn) options.push('Dine-in');
  if (raw.takeout) options.push('Takeout');
  if (raw.delivery) options.push('Delivery');
  if (raw.reservable) options.push('Reservations');
  if (raw.serves_breakfast || raw.servesBreakfast) options.push('Breakfast');
  if (raw.serves_lunch || raw.servesLunch) options.push('Lunch');
  if (raw.serves_dinner || raw.servesDinner) options.push('Dinner');
  if (raw.serves_beer || raw.servesBeer) options.push('Beer');
  if (raw.serves_wine || raw.servesWine) options.push('Wine');

  return options;
}

/**
 * Fetch detailed information for a place
 *
 * @param placeId Google Places ID
 * @param options Fetch options
 * @returns Promise with full place details
 */
export async function fetchPlaceDetails(
  placeId: string,
  options: FetchPlaceDetailsOptions = {}
): Promise<PlaceDetails> {
  const {
    forceRefresh = false,
    maxPhotos = DEFAULT_MAX_PHOTOS,
    useMock = false,
  } = options;

  // Check cache first
  if (!forceRefresh) {
    const cached = detailsCache.get(placeId);
    if (cached) return cached;
  }

  // Use mock data for development
  if (useMock) {
    const mockData = generateMockPlaceDetails(placeId);
    detailsCache.set(placeId, mockData);
    return mockData;
  }

  // Fetch from API
  const response = await fetch(
    `${API_BASE_URL}/places/${encodeURIComponent(placeId)}/details`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch place details: ${response.statusText}`);
  }

  const data = await response.json();
  const details = transformPlaceDetails(data.result || data, maxPhotos);

  // Cache the result
  detailsCache.set(placeId, details);

  return details;
}

/**
 * Prefetch details for multiple places
 * Fetches in background, returns immediately
 */
export function prefetchPlaceDetails(placeIds: string[]): void {
  placeIds.forEach((placeId, index) => {
    // Stagger requests
    setTimeout(() => {
      fetchPlaceDetails(placeId).catch((error) => {
        console.warn(`Prefetch failed for ${placeId}:`, error);
      });
    }, index * 200);
  });
}

/**
 * Get just the review highlights for a place
 */
export async function getPlaceHighlights(
  placeId: string,
  options?: FetchPlaceDetailsOptions
): Promise<ReviewHighlights> {
  const details = await fetchPlaceDetails(placeId, options);
  return details.reviewHighlights;
}

/**
 * Get the "why visit" text for a place
 */
export async function getWhyVisit(
  placeId: string,
  options?: FetchPlaceDetailsOptions
): Promise<string> {
  const details = await fetchPlaceDetails(placeId, options);
  return details.reviewHighlights.whyVisit;
}

/**
 * Clear the details cache
 */
export function clearPlaceDetailsCache(): void {
  detailsCache.clear();
}

/**
 * Get cache statistics
 */
export function getPlaceDetailsCacheStats(): { size: number } {
  return detailsCache.getStats();
}

// ============================================================================
// Mock Data Generator
// ============================================================================

/**
 * Generate mock place details for development
 */
export function generateMockPlaceDetails(placeId: string): PlaceDetails {
  const mockReviews: PlaceReview[] = [
    {
      authorName: 'Sarah M.',
      authorPhotoUrl: undefined,
      rating: 5,
      text: 'Absolutely amazing hidden gem! The food was delicious and the atmosphere was so cozy and charming. The staff were incredibly friendly and made us feel right at home. Highly recommend the house special!',
      relativeTimeDescription: '2 weeks ago',
      time: Date.now() / 1000 - 14 * 24 * 60 * 60,
    },
    {
      authorName: 'James K.',
      authorPhotoUrl: undefined,
      rating: 5,
      text: 'This place is a local favorite for good reason. Fresh ingredients, authentic recipes, and great value. The view from the terrace is stunning at sunset. Must visit if you\'re in the area!',
      relativeTimeDescription: '1 month ago',
      time: Date.now() / 1000 - 30 * 24 * 60 * 60,
    },
    {
      authorName: 'Emma L.',
      authorPhotoUrl: undefined,
      rating: 4,
      text: 'Wonderful experience! The homemade bread was incredible and the service was excellent. A bit hard to find but worth the effort. We\'ll definitely be back.',
      relativeTimeDescription: '3 weeks ago',
      time: Date.now() / 1000 - 21 * 24 * 60 * 60,
    },
    {
      authorName: 'Michael R.',
      authorPhotoUrl: undefined,
      rating: 5,
      text: 'Best kept secret in town! Authentic local cuisine, reasonable prices, and such a unique atmosphere. The owner is passionate about what they do and it shows.',
      relativeTimeDescription: '2 months ago',
      time: Date.now() / 1000 - 60 * 24 * 60 * 60,
    },
    {
      authorName: 'Lisa T.',
      authorPhotoUrl: undefined,
      rating: 4,
      text: 'Charming spot with delicious food. The traditional dishes are prepared with care and the portions are generous. Lovely garden seating in summer.',
      relativeTimeDescription: '1 month ago',
      time: Date.now() / 1000 - 35 * 24 * 60 * 60,
    },
  ];

  const reviewHighlights = analyzeReviews(mockReviews, 'This Place');

  return {
    placeId,
    name: 'The Hidden Kitchen',
    formattedAddress: '42 Cobblestone Lane, Old Town',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    rating: 4.7,
    reviewCount: 89,
    priceLevel: 2,
    types: ['restaurant', 'food', 'point_of_interest', 'establishment'],

    website: 'https://example.com',
    phoneNumber: '+1 234 567 8900',
    internationalPhoneNumber: '+1 234 567 8900',
    googleMapsUrl: 'https://maps.google.com/?cid=12345',

    openingHours: {
      openNow: true,
      weekdayText: [
        'Monday: 11:00 AM – 10:00 PM',
        'Tuesday: 11:00 AM – 10:00 PM',
        'Wednesday: 11:00 AM – 10:00 PM',
        'Thursday: 11:00 AM – 10:00 PM',
        'Friday: 11:00 AM – 11:00 PM',
        'Saturday: 10:00 AM – 11:00 PM',
        'Sunday: 10:00 AM – 9:00 PM',
      ],
      currentStatus: 'Open until 10:00 PM',
    },
    isOpenNow: true,

    photos: [
      { reference: 'mock-photo-1', width: 800, height: 600, url: 'https://picsum.photos/800/600?random=1' },
      { reference: 'mock-photo-2', width: 800, height: 600, url: 'https://picsum.photos/800/600?random=2' },
      { reference: 'mock-photo-3', width: 800, height: 600, url: 'https://picsum.photos/800/600?random=3' },
    ],

    reviews: mockReviews,
    reviewHighlights,

    editorialSummary: 'A beloved neighborhood restaurant serving authentic local cuisine in a charming historic building.',
    generatedSummary: reviewHighlights.whyVisit,

    diningOptions: ['Dine-in', 'Takeout', 'Reservations'],
    paymentOptions: ['Credit cards', 'Cash'],

    fetchedAt: new Date(),
    fromCache: false,
  };
}
