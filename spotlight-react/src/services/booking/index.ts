/**
 * Booking Integration Service
 *
 * WI-10.1: Complete booking integration architecture
 *
 * Epic 10: Booking & Monetisation
 *
 * This module provides:
 * - Partner abstraction for easy switching/addition
 * - Affiliate link generation with tracking
 * - Click tracking for revenue attribution
 * - Context utilities for integration with app data
 *
 * Usage:
 * ```typescript
 * import {
 *   generateHotelOptions,
 *   createHotelContextFromCity,
 *   trackBookingClick,
 *   createItinerarySource,
 * } from '@/services/booking';
 *
 * // Generate booking links for a city
 * const context = createHotelContextFromCity(city, { checkIn, checkOut });
 * const options = generateHotelOptions(context);
 *
 * // Track a click
 * const source = createItinerarySource(tripId, cityId, dayNumber);
 * trackBookingClick(options.primary!, source);
 * ```
 *
 * Configuration:
 * Set these environment variables to enable partners:
 * - VITE_BOOKING_COM_AFFILIATE_ID
 * - VITE_GETYOURGUIDE_PARTNER_ID
 * - VITE_VIATOR_PARTNER_ID
 * - VITE_THEFORK_PARTNER_ID
 * - VITE_OPENTABLE_PARTNER_ID
 *
 * The app works without these keys, showing generic links instead.
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Partner types
  BookingPartnerCategory,
  BookingPartner,
  BookingPartnerInfo,

  // Context types
  HotelBookingContext,
  ActivityBookingContext,
  RestaurantBookingContext,
  BookingContext,

  // Link types
  BookingLink,
  BookingOptions,

  // Click tracking types
  BookingClickEvent,
  BookingClickSource,

  // Provider interfaces (for future API integration)
  BookingProvider,
  HotelProvider,
  ActivityProvider,
  RestaurantProvider,

  // Search result types (for future API integration)
  HotelSearchResult,
  ActivitySearchResult,
  RestaurantSearchResult,

  // Configuration types
  PartnerConfig,
  BookingConfig,
} from './types';

// ============================================================================
// Configuration Exports
// ============================================================================

export {
  // Partner metadata
  PARTNER_INFO,
  URL_TEMPLATES,

  // Configuration
  getDefaultBookingConfig,
  getAffiliateId,
  isPartnerConfigured,

  // Partner selection
  getActivePartners,
  getPreferredPartner,
  getPartnersForRegion,

  // Display helpers
  getPartnerCTA,
  getPartnerDisplayInfo,
} from './config';

// ============================================================================
// Generator Exports
// ============================================================================

export {
  // Hotel generators
  generateHotelLink,
  generateHotelOptions,

  // Activity generators
  generateActivityLink,
  generateActivityOptions,

  // Restaurant generators
  generateRestaurantLink,
  generateRestaurantOptions,

  // Universal generators
  generateBookingLink,
  generateBookingOptions,
} from './generators';

// ============================================================================
// Tracking Exports
// ============================================================================

export {
  // Core tracking
  trackBookingClick,
  createClickEvent,
  onBookingClick,

  // Storage
  getStoredClickEvents,
  clearStoredClickEvents,
  getClickEventsSince,

  // Analytics integration
  toAnalyticsProperties,
  setupBookingAnalytics,
  type BookingClickAnalyticsProperties,

  // Statistics
  getClickStatistics,

  // UI helpers
  createBookingClickHandler,
  createTrackingOnlyHandler,
} from './tracking';

// Re-export StoredClickEvent type for external use
export type { StoredClickEvent } from './tracking';

// ============================================================================
// Utility Exports
// ============================================================================

export {
  // Context builders
  createHotelContextFromCity,
  createHotelContextFromDay,
  createActivityContextFromPlace,
  createActivityContextFromDay,
  createRestaurantContextFromPlace,
  createRestaurantContextFromMeal,

  // Click source builders
  createCityPreviewSource,
  createItinerarySource,
  createPlaceDetailsSource,
  createCompanionSource,

  // Quick generators
  generateCityBookingOptions,
  generatePlaceBookingOptions,

  // Display helpers
  getBookingButtonText,
  hasBookingOptions,
  getAllBookingLinks,
  formatPriceRange,

  // Date utilities
  calculateNights,
  getDefaultCheckout,
  formatDateRange,
} from './utils';
