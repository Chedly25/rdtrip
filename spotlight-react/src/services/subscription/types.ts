/**
 * Subscription Types
 *
 * WI-10.6: Premium Subscription Model
 *
 * Defines subscription tiers, features, and limits.
 *
 * Design Philosophy:
 * - Free tier must still be useful - not crippled
 * - Premium adds convenience and power-user features
 * - Limits should feel fair, not punishing
 */

// ============================================================================
// Tier Definitions
// ============================================================================

/**
 * Subscription tier identifiers
 */
export type SubscriptionTier = 'free' | 'premium';

/**
 * Subscription billing period
 */
export type BillingPeriod = 'monthly' | 'yearly';

/**
 * Subscription status
 */
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'expired'
  | 'none';

// ============================================================================
// Feature Definitions
// ============================================================================

/**
 * Features that can be gated by subscription
 */
export type SubscriptionFeature =
  | 'unlimited_ai'           // Unlimited AI interactions
  | 'offline_mode'           // Download trips for offline use
  | 'cross_trip_memory'      // AI remembers across all trips
  | 'weather_rerouting'      // Auto-adjust plans for weather
  | 'priority_support'       // Priority customer support
  | 'advanced_preferences'   // Deep preference learning
  | 'collaborative_trips'    // Share and collaborate on trips
  | 'export_itinerary'       // Export to PDF/calendar
  | 'early_access';          // Early access to new features

/**
 * Feature availability by tier
 */
export const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeature[]> = {
  free: [
    'export_itinerary',
  ],
  premium: [
    'unlimited_ai',
    'offline_mode',
    'cross_trip_memory',
    'weather_rerouting',
    'priority_support',
    'advanced_preferences',
    'collaborative_trips',
    'export_itinerary',
    'early_access',
  ],
};

// ============================================================================
// Limit Definitions
// ============================================================================

/**
 * Resource types that have limits
 */
export type LimitedResource =
  | 'ai_interactions'    // AI chat messages per trip
  | 'trips_active'       // Number of active trips
  | 'places_per_trip'    // Places saved per trip
  | 'photos_per_trip';   // Custom photos uploaded

/**
 * Limits by tier (null = unlimited)
 */
export const TIER_LIMITS: Record<SubscriptionTier, Record<LimitedResource, number | null>> = {
  free: {
    ai_interactions: 50,      // 50 AI interactions per trip
    trips_active: 3,          // 3 active trips
    places_per_trip: 50,      // 50 saved places per trip
    photos_per_trip: 10,      // 10 custom photos per trip
  },
  premium: {
    ai_interactions: null,    // Unlimited
    trips_active: null,       // Unlimited
    places_per_trip: null,    // Unlimited
    photos_per_trip: null,    // Unlimited
  },
};

// ============================================================================
// Pricing
// ============================================================================

/**
 * Pricing structure (in cents to avoid floating point issues)
 */
export interface TierPricing {
  monthly: number;  // Price in cents
  yearly: number;   // Price in cents (for full year)
  currency: string;
}

export const TIER_PRICING: Record<SubscriptionTier, TierPricing> = {
  free: {
    monthly: 0,
    yearly: 0,
    currency: 'USD',
  },
  premium: {
    monthly: 999,     // $9.99/month
    yearly: 7999,     // $79.99/year (save ~33%)
    currency: 'USD',
  },
};

// ============================================================================
// Subscription Data Types
// ============================================================================

/**
 * User's subscription information
 */
export interface Subscription {
  /** Subscription tier */
  tier: SubscriptionTier;

  /** Current status */
  status: SubscriptionStatus;

  /** Billing period (for premium) */
  billingPeriod?: BillingPeriod;

  /** When the subscription started */
  startedAt?: Date;

  /** When the current period ends */
  currentPeriodEnd?: Date;

  /** When the subscription will cancel (if scheduled) */
  cancelAt?: Date;

  /** Whether auto-renewal is enabled */
  autoRenew?: boolean;

  /** Stripe customer ID (for integration) */
  stripeCustomerId?: string;

  /** Stripe subscription ID (for integration) */
  stripeSubscriptionId?: string;
}

/**
 * Usage tracking for limited resources
 */
export interface ResourceUsage {
  /** Resource type */
  resource: LimitedResource;

  /** Current usage count */
  used: number;

  /** Limit for the tier (null = unlimited) */
  limit: number | null;

  /** When the usage resets (if applicable) */
  resetsAt?: Date;
}

/**
 * Per-trip usage tracking
 */
export interface TripUsage {
  /** Trip ID */
  tripId: string;

  /** AI interactions used in this trip */
  aiInteractions: number;

  /** Last interaction timestamp */
  lastInteractionAt?: Date;

  /** Places saved count */
  placesSaved: number;

  /** Photos uploaded count */
  photosUploaded: number;
}

// ============================================================================
// Upgrade Prompts
// ============================================================================

/**
 * Context for showing upgrade prompts
 */
export type UpgradePromptContext =
  | 'limit_reached'      // User hit a limit
  | 'feature_locked'     // User tried a premium feature
  | 'settings_page'      // Browsing settings
  | 'trial_ending'       // Trial period ending soon
  | 'seasonal_offer';    // Special promotion

/**
 * Upgrade prompt data
 */
export interface UpgradePrompt {
  /** Prompt context */
  context: UpgradePromptContext;

  /** Title text */
  title: string;

  /** Description text */
  description: string;

  /** Feature being highlighted (if applicable) */
  feature?: SubscriptionFeature;

  /** Resource limit hit (if applicable) */
  limitHit?: LimitedResource;

  /** Call-to-action text */
  ctaText: string;

  /** Whether to show dismiss option */
  dismissible: boolean;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Check result for feature access
 */
export interface FeatureAccessResult {
  /** Whether access is allowed */
  allowed: boolean;

  /** Reason if not allowed */
  reason?: 'not_subscribed' | 'feature_not_in_tier' | 'limit_reached';

  /** Current usage (if limit-based) */
  usage?: ResourceUsage;

  /** Upgrade prompt to show */
  upgradePrompt?: UpgradePrompt;
}

/**
 * Subscription change event
 */
export interface SubscriptionChangeEvent {
  /** Previous tier */
  previousTier: SubscriptionTier;

  /** New tier */
  newTier: SubscriptionTier;

  /** Change type */
  changeType: 'upgrade' | 'downgrade' | 'cancel' | 'renew' | 'trial_start' | 'trial_end';

  /** Timestamp */
  timestamp: Date;
}
