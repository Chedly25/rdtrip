/**
 * Booking Partner Configuration
 *
 * WI-10.1: Partner configurations and URL templates
 *
 * Architecture Decision:
 * - All affiliate IDs read from environment variables
 * - App works without keys (shows generic links)
 * - Easy to enable/disable partners via config
 * - URL templates support deep linking where available
 *
 * To configure partners, set these environment variables:
 * - VITE_BOOKING_COM_AFFILIATE_ID
 * - VITE_GETYOURGUIDE_PARTNER_ID
 * - VITE_VIATOR_PARTNER_ID
 * - VITE_THEFORK_PARTNER_ID
 * - VITE_OPENTABLE_PARTNER_ID
 */

import type {
  BookingPartner,
  BookingPartnerCategory,
  BookingPartnerInfo,
  BookingConfig,
  PartnerConfig,
} from './types';

// ============================================================================
// Environment Variable Keys
// ============================================================================

const ENV_KEYS = {
  // Hotels
  booking_com: 'VITE_BOOKING_COM_AFFILIATE_ID',
  hotels_com: 'VITE_HOTELS_COM_AFFILIATE_ID',
  agoda: 'VITE_AGODA_AFFILIATE_ID',
  // Activities
  getyourguide: 'VITE_GETYOURGUIDE_PARTNER_ID',
  viator: 'VITE_VIATOR_PARTNER_ID',
  klook: 'VITE_KLOOK_AFFILIATE_ID',
  // Restaurants
  thefork: 'VITE_THEFORK_PARTNER_ID',
  opentable: 'VITE_OPENTABLE_PARTNER_ID',
  resy: 'VITE_RESY_PARTNER_ID',
} as const;

// ============================================================================
// Partner Metadata
// ============================================================================

export const PARTNER_INFO: Record<BookingPartner, BookingPartnerInfo> = {
  // Hotels
  booking_com: {
    id: 'booking_com',
    name: 'Booking.com',
    category: 'hotel',
    brandColor: '#003580',
    isActive: true,
    isConfigured: !!import.meta.env[ENV_KEYS.booking_com],
    regions: [], // Global
  },
  hotels_com: {
    id: 'hotels_com',
    name: 'Hotels.com',
    category: 'hotel',
    brandColor: '#D32F2F',
    isActive: false, // Disabled by default, Booking.com is primary
    isConfigured: !!import.meta.env[ENV_KEYS.hotels_com],
  },
  agoda: {
    id: 'agoda',
    name: 'Agoda',
    category: 'hotel',
    brandColor: '#5C2D91',
    isActive: false,
    isConfigured: !!import.meta.env[ENV_KEYS.agoda],
    regions: ['asia'],
  },
  // Activities
  getyourguide: {
    id: 'getyourguide',
    name: 'GetYourGuide',
    category: 'activity',
    brandColor: '#FF5533',
    isActive: true,
    isConfigured: !!import.meta.env[ENV_KEYS.getyourguide],
  },
  viator: {
    id: 'viator',
    name: 'Viator',
    category: 'activity',
    brandColor: '#00AA6C',
    isActive: true,
    isConfigured: !!import.meta.env[ENV_KEYS.viator],
  },
  klook: {
    id: 'klook',
    name: 'Klook',
    category: 'activity',
    brandColor: '#FF5722',
    isActive: false,
    isConfigured: !!import.meta.env[ENV_KEYS.klook],
    regions: ['asia'],
  },
  // Restaurants
  thefork: {
    id: 'thefork',
    name: 'TheFork',
    category: 'restaurant',
    brandColor: '#00A699',
    isActive: true,
    isConfigured: !!import.meta.env[ENV_KEYS.thefork],
    regions: ['europe'],
  },
  opentable: {
    id: 'opentable',
    name: 'OpenTable',
    category: 'restaurant',
    brandColor: '#DA3743',
    isActive: true,
    isConfigured: !!import.meta.env[ENV_KEYS.opentable],
    regions: ['north_america', 'europe'],
  },
  resy: {
    id: 'resy',
    name: 'Resy',
    category: 'restaurant',
    brandColor: '#C41230',
    isActive: false,
    isConfigured: !!import.meta.env[ENV_KEYS.resy],
    regions: ['north_america'],
  },
};

// ============================================================================
// URL Templates
// ============================================================================

/**
 * URL templates for each partner
 * Placeholders: {city}, {country}, {checkin}, {checkout}, {adults}, {query}, etc.
 * Affiliate IDs are added by the generator
 */
export const URL_TEMPLATES: Record<BookingPartner, {
  search: string;
  deepLink?: string;
  fallback: string;
}> = {
  // Hotels
  booking_com: {
    search: 'https://www.booking.com/searchresults.html?ss={city}%2C+{country}&checkin={checkin}&checkout={checkout}&group_adults={adults}&no_rooms={rooms}',
    deepLink: 'https://www.booking.com/hotel/{country}/{hotelSlug}.html?checkin={checkin}&checkout={checkout}',
    fallback: 'https://www.booking.com/searchresults.html?ss={city}',
  },
  hotels_com: {
    search: 'https://www.hotels.com/search.do?q-destination={city}%2C+{country}&q-check-in={checkin}&q-check-out={checkout}&q-rooms=1&q-room-0-adults={adults}',
    fallback: 'https://www.hotels.com/search.do?q-destination={city}',
  },
  agoda: {
    search: 'https://www.agoda.com/search?city={cityId}&checkIn={checkin}&checkOut={checkout}&rooms=1&adults={adults}',
    fallback: 'https://www.agoda.com/search?city={city}',
  },
  // Activities
  getyourguide: {
    search: 'https://www.getyourguide.com/s/?q={query}&lc={city}&date_from={date}',
    deepLink: 'https://www.getyourguide.com/{country}/{city}-l{cityId}/{activitySlug}-t{activityId}/',
    fallback: 'https://www.getyourguide.com/s/?q={city}+things+to+do',
  },
  viator: {
    search: 'https://www.viator.com/searchResults/all?text={query}&destId={destId}',
    deepLink: 'https://www.viator.com/tours/{country}/{city}/{activitySlug}/d{destId}-{productCode}',
    fallback: 'https://www.viator.com/searchResults/all?text={city}',
  },
  klook: {
    search: 'https://www.klook.com/en-US/search/result/?keyword={query}&city_id={cityId}',
    fallback: 'https://www.klook.com/en-US/search/result/?keyword={city}',
  },
  // Restaurants
  thefork: {
    search: 'https://www.thefork.com/search?cityId={cityId}&date={date}&time={time}&partySize={partySize}',
    deepLink: 'https://www.thefork.com/restaurant/{restaurantSlug}-r{restaurantId}?date={date}&time={time}&partySize={partySize}',
    fallback: 'https://www.thefork.com/search?q={city}',
  },
  opentable: {
    search: 'https://www.opentable.com/s?covers={partySize}&dateTime={datetime}&metroId={metroId}&term={query}',
    deepLink: 'https://www.opentable.com/r/{restaurantSlug}?covers={partySize}&dateTime={datetime}',
    fallback: 'https://www.opentable.com/s?term={city}+restaurants',
  },
  resy: {
    search: 'https://resy.com/cities/{citySlug}?date={date}&seats={partySize}',
    deepLink: 'https://resy.com/cities/{citySlug}/venues/{restaurantSlug}?date={date}&seats={partySize}',
    fallback: 'https://resy.com/cities/{city}',
  },
};

// ============================================================================
// Default Partner Priority by Category
// ============================================================================

const DEFAULT_PRIORITIES: Record<BookingPartnerCategory, BookingPartner[]> = {
  hotel: ['booking_com', 'hotels_com', 'agoda'],
  activity: ['getyourguide', 'viator', 'klook'],
  restaurant: ['thefork', 'opentable', 'resy'],
};

// ============================================================================
// Configuration Builders
// ============================================================================

/**
 * Get affiliate ID from environment
 */
export function getAffiliateId(partner: BookingPartner): string | undefined {
  const envKey = ENV_KEYS[partner];
  return import.meta.env[envKey] as string | undefined;
}

/**
 * Check if partner is configured with affiliate ID
 */
export function isPartnerConfigured(partner: BookingPartner): boolean {
  return !!getAffiliateId(partner);
}

/**
 * Get partner config with environment-based settings
 */
function getPartnerConfig(partner: BookingPartner, priority: number): PartnerConfig {
  const info = PARTNER_INFO[partner];
  return {
    partner,
    affiliateId: getAffiliateId(partner),
    enabled: info.isActive && (isPartnerConfigured(partner) || true), // Enable even without config for fallback
    priority,
  };
}

/**
 * Build default booking configuration
 */
export function getDefaultBookingConfig(): BookingConfig {
  return {
    hotels: DEFAULT_PRIORITIES.hotel.map((p, i) => getPartnerConfig(p, DEFAULT_PRIORITIES.hotel.length - i)),
    activities: DEFAULT_PRIORITIES.activity.map((p, i) => getPartnerConfig(p, DEFAULT_PRIORITIES.activity.length - i)),
    restaurants: DEFAULT_PRIORITIES.restaurant.map((p, i) => getPartnerConfig(p, DEFAULT_PRIORITIES.restaurant.length - i)),
    globalTrackingParams: {
      utm_source: 'waycraft',
      utm_medium: 'app',
    },
    trackClicks: true,
    fallbackBehavior: 'generic_link',
  };
}

// ============================================================================
// Partner Selection
// ============================================================================

/**
 * Get active partners for a category, sorted by priority
 */
export function getActivePartners(
  category: BookingPartnerCategory,
  config: BookingConfig = getDefaultBookingConfig()
): PartnerConfig[] {
  const categoryConfig = {
    hotel: config.hotels,
    activity: config.activities,
    restaurant: config.restaurants,
  }[category];

  return categoryConfig
    .filter(p => p.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get preferred partner for a category
 */
export function getPreferredPartner(
  category: BookingPartnerCategory,
  config: BookingConfig = getDefaultBookingConfig()
): PartnerConfig | undefined {
  const active = getActivePartners(category, config);
  // Prefer configured partners, then fall back to first active
  return active.find(p => p.affiliateId) || active[0];
}

/**
 * Get partners by region (for geo-targeting)
 */
export function getPartnersForRegion(
  category: BookingPartnerCategory,
  region: string
): BookingPartner[] {
  return Object.values(PARTNER_INFO)
    .filter(p =>
      p.category === category &&
      p.isActive &&
      (!p.regions || p.regions.length === 0 || p.regions.includes(region))
    )
    .map(p => p.id);
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Get CTA text for a partner
 */
export function getPartnerCTA(partner: BookingPartner): { label: string; cta: string } {
  const ctas: Record<BookingPartnerCategory, { label: string; cta: string }> = {
    hotel: { label: 'Book Hotel', cta: 'Check availability' },
    activity: { label: 'Book Activity', cta: 'See tickets' },
    restaurant: { label: 'Reserve Table', cta: 'Make reservation' },
  };

  const info = PARTNER_INFO[partner];
  return ctas[info.category];
}

/**
 * Get partner display info
 */
export function getPartnerDisplayInfo(partner: BookingPartner): {
  name: string;
  color: string;
  icon: string;
} {
  const info = PARTNER_INFO[partner];
  const icons: Record<BookingPartnerCategory, string> = {
    hotel: 'building-2',
    activity: 'ticket',
    restaurant: 'utensils',
  };

  return {
    name: info.name,
    color: info.brandColor || '#666666',
    icon: icons[info.category],
  };
}
