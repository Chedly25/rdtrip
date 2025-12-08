/**
 * Booking Integration Types
 *
 * WI-10.1: Booking Integration Architecture
 *
 * Design Philosophy:
 * - ABSTRACT - Partners hidden behind interfaces for easy switching
 * - EXTENSIBLE - New partners can be added via configuration
 * - TRACKABLE - All clicks tracked for attribution and analytics
 * - GRACEFUL - App works without API keys (affiliate links)
 *
 * Architecture Decision:
 * Start with affiliate links (simpler, works without API keys).
 * Design interfaces to support API integration later.
 * Track clicks for revenue attribution even with affiliate links.
 */

// ============================================================================
// Booking Partner Types
// ============================================================================

/**
 * Supported booking partner categories
 */
export type BookingPartnerCategory = 'hotel' | 'activity' | 'restaurant';

/**
 * Specific booking partners
 */
export type BookingPartner =
  // Hotels
  | 'booking_com'
  | 'hotels_com'
  | 'agoda'
  // Activities
  | 'getyourguide'
  | 'viator'
  | 'klook'
  // Restaurants
  | 'thefork'
  | 'opentable'
  | 'resy';

/**
 * Partner metadata
 */
export interface BookingPartnerInfo {
  /** Partner identifier */
  id: BookingPartner;
  /** Display name */
  name: string;
  /** Category */
  category: BookingPartnerCategory;
  /** Partner logo URL (optional) */
  logoUrl?: string;
  /** Primary color for branding */
  brandColor?: string;
  /** Whether this partner is currently active */
  isActive: boolean;
  /** Whether affiliate ID is configured */
  isConfigured: boolean;
  /** Regions where partner operates (empty = global) */
  regions?: string[];
}

// ============================================================================
// Booking Context Types
// ============================================================================

/**
 * Context for generating hotel booking links
 */
export interface HotelBookingContext {
  /** City or location name */
  cityName: string;
  /** Country (for better matching) */
  country?: string;
  /** Coordinates */
  coordinates?: {
    lat: number;
    lng: number;
  };
  /** Check-in date */
  checkIn?: Date;
  /** Check-out date */
  checkOut?: Date;
  /** Number of adults */
  adults?: number;
  /** Number of children */
  children?: number;
  /** Number of rooms */
  rooms?: number;
  /** Specific hotel name (for deep linking) */
  hotelName?: string;
  /** Hotel ID if known (Booking.com hotel_id, etc.) */
  partnerId?: string;
}

/**
 * Context for generating activity booking links
 */
export interface ActivityBookingContext {
  /** City or location name */
  cityName: string;
  /** Country */
  country?: string;
  /** Coordinates */
  coordinates?: {
    lat: number;
    lng: number;
  };
  /** Activity name or keywords */
  activityName?: string;
  /** Activity category */
  category?: string;
  /** Date for the activity */
  date?: Date;
  /** Number of participants */
  participants?: number;
  /** Partner-specific activity ID */
  partnerId?: string;
}

/**
 * Context for generating restaurant booking links
 */
export interface RestaurantBookingContext {
  /** City name */
  cityName: string;
  /** Country */
  country?: string;
  /** Restaurant name */
  restaurantName: string;
  /** Coordinates */
  coordinates?: {
    lat: number;
    lng: number;
  };
  /** Reservation date */
  date?: Date;
  /** Reservation time (24h format) */
  time?: string;
  /** Party size */
  partySize?: number;
  /** Partner-specific restaurant ID */
  partnerId?: string;
}

/**
 * Union type for all booking contexts
 */
export type BookingContext =
  | { type: 'hotel'; data: HotelBookingContext }
  | { type: 'activity'; data: ActivityBookingContext }
  | { type: 'restaurant'; data: RestaurantBookingContext };

// ============================================================================
// Generated Booking Link Types
// ============================================================================

/**
 * A generated booking link with metadata
 */
export interface BookingLink {
  /** The complete URL with affiliate tracking */
  url: string;
  /** Partner that generated this link */
  partner: BookingPartner;
  /** Category */
  category: BookingPartnerCategory;
  /** Display text for the link */
  label: string;
  /** Call-to-action text */
  cta: string;
  /** Whether this is a deep link to specific item */
  isDeepLink: boolean;
  /** Tracking ID for this specific link */
  trackingId: string;
  /** Context used to generate the link */
  context: BookingContext;
  /** When this link was generated */
  generatedAt: Date;
  /** Expiry time if applicable (e.g., for cached availability) */
  expiresAt?: Date;
}

/**
 * Multiple booking options for a context
 */
export interface BookingOptions {
  /** Primary recommended link */
  primary: BookingLink | null;
  /** Alternative partner links */
  alternatives: BookingLink[];
  /** Booking category */
  category: BookingPartnerCategory;
  /** Original context */
  context: BookingContext;
}

// ============================================================================
// Click Tracking Types
// ============================================================================

/**
 * Booking click event for analytics
 */
export interface BookingClickEvent {
  /** Unique event ID */
  eventId: string;
  /** Timestamp */
  timestamp: Date;
  /** Partner clicked */
  partner: BookingPartner;
  /** Category */
  category: BookingPartnerCategory;
  /** The full URL clicked */
  url: string;
  /** Tracking ID from the link */
  trackingId: string;
  /** Page/context where click occurred */
  sourceContext: BookingClickSource;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Where the booking click originated from
 */
export interface BookingClickSource {
  /** Page type */
  page: 'city_preview' | 'itinerary' | 'place_details' | 'companion' | 'search';
  /** Trip ID if applicable */
  tripId?: string;
  /** City ID if applicable */
  cityId?: string;
  /** Day number if from itinerary */
  dayNumber?: number;
  /** Activity ID if from specific activity */
  activityId?: string;
  /** Place ID if from specific place */
  placeId?: string;
}

// ============================================================================
// Provider Interface (for future API integration)
// ============================================================================

/**
 * Interface for booking providers
 *
 * Currently implemented via affiliate links, but designed to support
 * full API integration in the future.
 */
export interface BookingProvider<TContext, TResult> {
  /** Provider identifier */
  readonly id: BookingPartner;
  /** Generate a booking link */
  generateLink(context: TContext): BookingLink;
  /** Check if provider is available for context */
  isAvailable(context: TContext): boolean;
  /** Search for options (future API integration) */
  search?(context: TContext): Promise<TResult[]>;
  /** Check availability (future API integration) */
  checkAvailability?(context: TContext): Promise<boolean>;
}

/**
 * Hotel provider interface
 */
export type HotelProvider = BookingProvider<HotelBookingContext, HotelSearchResult>;

/**
 * Activity provider interface
 */
export type ActivityProvider = BookingProvider<ActivityBookingContext, ActivitySearchResult>;

/**
 * Restaurant provider interface
 */
export type RestaurantProvider = BookingProvider<RestaurantBookingContext, RestaurantSearchResult>;

// ============================================================================
// Search Result Types (for future API integration)
// ============================================================================

/**
 * Hotel search result from API
 */
export interface HotelSearchResult {
  id: string;
  name: string;
  stars?: number;
  rating?: number;
  reviewCount?: number;
  pricePerNight?: number;
  currency?: string;
  thumbnailUrl?: string;
  address?: string;
  amenities?: string[];
  bookingUrl: string;
}

/**
 * Activity search result from API
 */
export interface ActivitySearchResult {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  duration?: string;
  rating?: number;
  reviewCount?: number;
  thumbnailUrl?: string;
  bookingUrl: string;
}

/**
 * Restaurant search result from API
 */
export interface RestaurantSearchResult {
  id: string;
  name: string;
  cuisine?: string;
  priceRange?: number;
  rating?: number;
  reviewCount?: number;
  address?: string;
  availableTimes?: string[];
  bookingUrl: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Partner-specific configuration
 */
export interface PartnerConfig {
  /** Partner ID */
  partner: BookingPartner;
  /** Affiliate ID or API key */
  affiliateId?: string;
  /** API key (for future) */
  apiKey?: string;
  /** Whether to use this partner */
  enabled: boolean;
  /** Priority for this partner (higher = preferred) */
  priority: number;
  /** Custom tracking parameters */
  trackingParams?: Record<string, string>;
}

/**
 * Complete booking configuration
 */
export interface BookingConfig {
  /** Hotel partners */
  hotels: PartnerConfig[];
  /** Activity partners */
  activities: PartnerConfig[];
  /** Restaurant partners */
  restaurants: PartnerConfig[];
  /** Global tracking parameters (added to all links) */
  globalTrackingParams?: Record<string, string>;
  /** Whether to track clicks */
  trackClicks: boolean;
  /** Fallback behavior when no partner configured */
  fallbackBehavior: 'generic_link' | 'hide' | 'show_disabled';
}
