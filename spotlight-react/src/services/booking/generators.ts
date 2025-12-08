/**
 * Booking Link Generators
 *
 * WI-10.1: Affiliate link generation with tracking
 *
 * Design Philosophy:
 * - SMART - Generate deep links when possible, fallback gracefully
 * - TRACKED - All links include tracking parameters
 * - CONTEXTUAL - Links are tailored to the booking context
 * - SAFE - Works without affiliate IDs (generic links)
 */

import type {
  BookingPartner,
  BookingLink,
  BookingOptions,
  BookingConfig,
  HotelBookingContext,
  ActivityBookingContext,
  RestaurantBookingContext,
} from './types';
import {
  URL_TEMPLATES,
  PARTNER_INFO,
  getAffiliateId,
  getDefaultBookingConfig,
  getActivePartners,
  getPartnerCTA,
} from './config';

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate a unique tracking ID
 */
function generateTrackingId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wc-${timestamp}-${random}`;
}

/**
 * Format date for URL (YYYY-MM-DD)
 */
function formatDateForUrl(date: Date | undefined): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Format datetime for URL (YYYY-MM-DDTHH:MM)
 */
function formatDateTimeForUrl(date: Date | undefined, time?: string): string {
  if (!date) return '';
  const dateStr = formatDateForUrl(date);
  if (time) {
    return `${dateStr}T${time}`;
  }
  return `${dateStr}T19:00`; // Default to 7pm for restaurants
}

/**
 * Slugify a string for URLs
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Replace template placeholders with values
 */
function fillTemplate(template: string, values: Record<string, string | number | undefined>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    const placeholder = `{${key}}`;
    const replacement = value !== undefined ? encodeURIComponent(String(value)) : '';
    result = result.replace(new RegExp(placeholder, 'g'), replacement);
  }
  // Clean up any remaining unfilled placeholders
  result = result.replace(/\{[^}]+\}/g, '');
  // Clean up double slashes (except after protocol)
  result = result.replace(/([^:])\/+/g, '$1/');
  // Clean up trailing question marks and ampersands
  result = result.replace(/[?&]+$/, '');
  return result;
}

/**
 * Add tracking parameters to URL
 */
function addTrackingParams(
  url: string,
  trackingId: string,
  partner: BookingPartner,
  affiliateId: string | undefined,
  config: BookingConfig
): string {
  const params = new URLSearchParams();

  // Add affiliate ID based on partner
  if (affiliateId) {
    switch (partner) {
      case 'booking_com':
        params.set('aid', affiliateId);
        break;
      case 'getyourguide':
        params.set('partner_id', affiliateId);
        break;
      case 'viator':
        params.set('pid', affiliateId);
        break;
      case 'thefork':
        params.set('cc', affiliateId);
        break;
      case 'opentable':
        params.set('ref', affiliateId);
        break;
      default:
        params.set('affiliate_id', affiliateId);
    }
  }

  // Add global tracking params
  if (config.globalTrackingParams) {
    for (const [key, value] of Object.entries(config.globalTrackingParams)) {
      params.set(key, value);
    }
  }

  // Add our tracking ID
  params.set('wc_tid', trackingId);

  // Append to URL
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

// ============================================================================
// Hotel Link Generators
// ============================================================================

/**
 * Generate hotel booking link
 */
export function generateHotelLink(
  context: HotelBookingContext,
  partner: BookingPartner = 'booking_com',
  config: BookingConfig = getDefaultBookingConfig()
): BookingLink {
  const templates = URL_TEMPLATES[partner];
  const affiliateId = getAffiliateId(partner);
  const trackingId = generateTrackingId();
  const info = PARTNER_INFO[partner];
  const cta = getPartnerCTA(partner);

  // Determine which template to use
  let baseUrl: string;
  let isDeepLink = false;

  if (context.partnerId && templates.deepLink) {
    // Deep link to specific hotel
    baseUrl = fillTemplate(templates.deepLink, {
      country: slugify(context.country || ''),
      hotelSlug: slugify(context.hotelName || ''),
      checkin: formatDateForUrl(context.checkIn),
      checkout: formatDateForUrl(context.checkOut),
    });
    isDeepLink = true;
  } else if (context.checkIn && context.checkOut) {
    // Search with dates
    baseUrl = fillTemplate(templates.search, {
      city: context.cityName,
      country: context.country || '',
      checkin: formatDateForUrl(context.checkIn),
      checkout: formatDateForUrl(context.checkOut),
      adults: context.adults || 2,
      rooms: context.rooms || 1,
    });
  } else {
    // Fallback search
    baseUrl = fillTemplate(templates.fallback, {
      city: context.cityName,
    });
  }

  // Add tracking
  const url = addTrackingParams(baseUrl, trackingId, partner, affiliateId, config);

  return {
    url,
    partner,
    category: 'hotel',
    label: `${cta.label} on ${info.name}`,
    cta: cta.cta,
    isDeepLink,
    trackingId,
    context: { type: 'hotel', data: context },
    generatedAt: new Date(),
  };
}

/**
 * Generate hotel booking options with alternatives
 */
export function generateHotelOptions(
  context: HotelBookingContext,
  config: BookingConfig = getDefaultBookingConfig()
): BookingOptions {
  const activePartners = getActivePartners('hotel', config);

  const links = activePartners.map(p =>
    generateHotelLink(context, p.partner, config)
  );

  return {
    primary: links[0] || null,
    alternatives: links.slice(1),
    category: 'hotel',
    context: { type: 'hotel', data: context },
  };
}

// ============================================================================
// Activity Link Generators
// ============================================================================

/**
 * Generate activity booking link
 */
export function generateActivityLink(
  context: ActivityBookingContext,
  partner: BookingPartner = 'getyourguide',
  config: BookingConfig = getDefaultBookingConfig()
): BookingLink {
  const templates = URL_TEMPLATES[partner];
  const affiliateId = getAffiliateId(partner);
  const trackingId = generateTrackingId();
  const info = PARTNER_INFO[partner];
  const cta = getPartnerCTA(partner);

  // Build search query
  const query = context.activityName
    ? `${context.activityName} ${context.cityName}`
    : `${context.cityName} things to do`;

  let baseUrl: string;
  let isDeepLink = false;

  if (context.partnerId && templates.deepLink) {
    // Deep link to specific activity
    baseUrl = fillTemplate(templates.deepLink, {
      country: slugify(context.country || ''),
      city: slugify(context.cityName),
      activitySlug: slugify(context.activityName || ''),
      activityId: context.partnerId,
    });
    isDeepLink = true;
  } else {
    // Search
    baseUrl = fillTemplate(templates.search || templates.fallback, {
      query,
      city: context.cityName,
      date: formatDateForUrl(context.date),
    });
  }

  // Add tracking
  const url = addTrackingParams(baseUrl, trackingId, partner, affiliateId, config);

  return {
    url,
    partner,
    category: 'activity',
    label: `${cta.label} on ${info.name}`,
    cta: cta.cta,
    isDeepLink,
    trackingId,
    context: { type: 'activity', data: context },
    generatedAt: new Date(),
  };
}

/**
 * Generate activity booking options with alternatives
 */
export function generateActivityOptions(
  context: ActivityBookingContext,
  config: BookingConfig = getDefaultBookingConfig()
): BookingOptions {
  const activePartners = getActivePartners('activity', config);

  const links = activePartners.map(p =>
    generateActivityLink(context, p.partner, config)
  );

  return {
    primary: links[0] || null,
    alternatives: links.slice(1),
    category: 'activity',
    context: { type: 'activity', data: context },
  };
}

// ============================================================================
// Restaurant Link Generators
// ============================================================================

/**
 * Generate restaurant booking link
 */
export function generateRestaurantLink(
  context: RestaurantBookingContext,
  partner: BookingPartner = 'thefork',
  config: BookingConfig = getDefaultBookingConfig()
): BookingLink {
  const templates = URL_TEMPLATES[partner];
  const affiliateId = getAffiliateId(partner);
  const trackingId = generateTrackingId();
  const info = PARTNER_INFO[partner];
  const cta = getPartnerCTA(partner);

  let baseUrl: string;
  let isDeepLink = false;

  if (context.partnerId && templates.deepLink) {
    // Deep link to specific restaurant
    baseUrl = fillTemplate(templates.deepLink, {
      restaurantSlug: slugify(context.restaurantName),
      restaurantId: context.partnerId,
      date: formatDateForUrl(context.date),
      time: context.time || '19:00',
      datetime: formatDateTimeForUrl(context.date, context.time),
      partySize: context.partySize || 2,
    });
    isDeepLink = true;
  } else {
    // Search/fallback
    baseUrl = fillTemplate(templates.search || templates.fallback, {
      city: context.cityName,
      citySlug: slugify(context.cityName),
      query: context.restaurantName,
      date: formatDateForUrl(context.date),
      time: context.time || '19:00',
      datetime: formatDateTimeForUrl(context.date, context.time),
      partySize: context.partySize || 2,
    });
  }

  // Add tracking
  const url = addTrackingParams(baseUrl, trackingId, partner, affiliateId, config);

  return {
    url,
    partner,
    category: 'restaurant',
    label: `${cta.label} on ${info.name}`,
    cta: cta.cta,
    isDeepLink,
    trackingId,
    context: { type: 'restaurant', data: context },
    generatedAt: new Date(),
  };
}

/**
 * Generate restaurant booking options with alternatives
 */
export function generateRestaurantOptions(
  context: RestaurantBookingContext,
  config: BookingConfig = getDefaultBookingConfig()
): BookingOptions {
  const activePartners = getActivePartners('restaurant', config);

  const links = activePartners.map(p =>
    generateRestaurantLink(context, p.partner, config)
  );

  return {
    primary: links[0] || null,
    alternatives: links.slice(1),
    category: 'restaurant',
    context: { type: 'restaurant', data: context },
  };
}

// ============================================================================
// Universal Generator
// ============================================================================

/**
 * Generate booking link for any category
 */
export function generateBookingLink(
  category: 'hotel' | 'activity' | 'restaurant',
  context: HotelBookingContext | ActivityBookingContext | RestaurantBookingContext,
  config: BookingConfig = getDefaultBookingConfig()
): BookingLink | null {
  const activePartners = getActivePartners(category, config);
  const preferredPartner = activePartners[0];

  if (!preferredPartner) {
    return null;
  }

  switch (category) {
    case 'hotel':
      return generateHotelLink(context as HotelBookingContext, preferredPartner.partner, config);
    case 'activity':
      return generateActivityLink(context as ActivityBookingContext, preferredPartner.partner, config);
    case 'restaurant':
      return generateRestaurantLink(context as RestaurantBookingContext, preferredPartner.partner, config);
  }
}

/**
 * Generate all booking options for any category
 */
export function generateBookingOptions(
  category: 'hotel' | 'activity' | 'restaurant',
  context: HotelBookingContext | ActivityBookingContext | RestaurantBookingContext,
  config: BookingConfig = getDefaultBookingConfig()
): BookingOptions {
  switch (category) {
    case 'hotel':
      return generateHotelOptions(context as HotelBookingContext, config);
    case 'activity':
      return generateActivityOptions(context as ActivityBookingContext, config);
    case 'restaurant':
      return generateRestaurantOptions(context as RestaurantBookingContext, config);
  }
}
