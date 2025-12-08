/**
 * Subscription Service
 *
 * WI-10.6: Premium Subscription Model
 *
 * Core service for subscription management, feature gating, and usage tracking.
 * Currently uses localStorage for mock subscriptions - ready for Stripe integration.
 *
 * Architecture:
 * - Mock mode: localStorage-based subscription simulation
 * - Production mode: Will integrate with Stripe via backend API
 * - Graceful degradation: Works offline, syncs when connected
 */

import {
  type SubscriptionTier,
  type BillingPeriod,
  type Subscription,
  type SubscriptionFeature,
  type LimitedResource,
  type ResourceUsage,
  type TripUsage,
  type FeatureAccessResult,
  type UpgradePrompt,
  type UpgradePromptContext,
  TIER_FEATURES,
  TIER_LIMITS,
  TIER_PRICING,
} from './types';

// ============================================================================
// Storage Keys
// ============================================================================

const SUBSCRIPTION_KEY = 'waycraft_subscription';
const USAGE_KEY = 'waycraft_usage';
const TRIP_USAGE_KEY = 'waycraft_trip_usage';
const UPGRADE_DISMISSED_KEY = 'waycraft_upgrade_dismissed';

// ============================================================================
// Storage Helpers
// ============================================================================

function getStoredSubscription(): Subscription | null {
  try {
    const stored = localStorage.getItem(SUBSCRIPTION_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    // Rehydrate dates
    if (data.startedAt) data.startedAt = new Date(data.startedAt);
    if (data.currentPeriodEnd) data.currentPeriodEnd = new Date(data.currentPeriodEnd);
    if (data.cancelAt) data.cancelAt = new Date(data.cancelAt);

    return data as Subscription;
  } catch {
    return null;
  }
}

function setStoredSubscription(subscription: Subscription): void {
  try {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscription));
  } catch {
    // Ignore storage errors
  }
}

function getStoredTripUsage(): Record<string, TripUsage> {
  try {
    const stored = localStorage.getItem(TRIP_USAGE_KEY);
    if (!stored) return {};

    const data = JSON.parse(stored);
    // Rehydrate dates
    for (const tripId of Object.keys(data)) {
      if (data[tripId].lastInteractionAt) {
        data[tripId].lastInteractionAt = new Date(data[tripId].lastInteractionAt);
      }
    }

    return data;
  } catch {
    return {};
  }
}

function setStoredTripUsage(usage: Record<string, TripUsage>): void {
  try {
    localStorage.setItem(TRIP_USAGE_KEY, JSON.stringify(usage));
  } catch {
    // Ignore storage errors
  }
}

function getUpgradeDismissals(): Record<string, number> {
  try {
    const stored = localStorage.getItem(UPGRADE_DISMISSED_KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

function setUpgradeDismissals(dismissals: Record<string, number>): void {
  try {
    localStorage.setItem(UPGRADE_DISMISSED_KEY, JSON.stringify(dismissals));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Get the current subscription
 */
export function getSubscription(): Subscription {
  const stored = getStoredSubscription();

  if (!stored) {
    // Return default free subscription
    return {
      tier: 'free',
      status: 'active',
    };
  }

  // Check if subscription has expired
  if (stored.tier === 'premium' && stored.currentPeriodEnd) {
    if (new Date() > stored.currentPeriodEnd && !stored.autoRenew) {
      // Subscription has expired
      return {
        ...stored,
        status: 'expired',
      };
    }
  }

  return stored;
}

/**
 * Get the current tier
 */
export function getCurrentTier(): SubscriptionTier {
  const subscription = getSubscription();
  return subscription.status === 'active' || subscription.status === 'trialing'
    ? subscription.tier
    : 'free';
}

/**
 * Check if user has premium subscription
 */
export function isPremium(): boolean {
  return getCurrentTier() === 'premium';
}

/**
 * Upgrade to premium (mock implementation)
 */
export function upgradeToPremium(billingPeriod: BillingPeriod = 'monthly'): Subscription {
  const now = new Date();
  const periodEnd = new Date(now);

  if (billingPeriod === 'monthly') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const subscription: Subscription = {
    tier: 'premium',
    status: 'active',
    billingPeriod,
    startedAt: now,
    currentPeriodEnd: periodEnd,
    autoRenew: true,
  };

  setStoredSubscription(subscription);
  return subscription;
}

/**
 * Cancel subscription
 */
export function cancelSubscription(): Subscription {
  const current = getSubscription();

  if (current.tier !== 'premium') {
    return current;
  }

  const updated: Subscription = {
    ...current,
    autoRenew: false,
    cancelAt: current.currentPeriodEnd,
  };

  setStoredSubscription(updated);
  return updated;
}

/**
 * Resume a canceled subscription
 */
export function resumeSubscription(): Subscription {
  const current = getSubscription();

  if (current.tier !== 'premium' || !current.cancelAt) {
    return current;
  }

  const updated: Subscription = {
    ...current,
    autoRenew: true,
    cancelAt: undefined,
  };

  setStoredSubscription(updated);
  return updated;
}

/**
 * Downgrade to free tier
 */
export function downgradeToFree(): Subscription {
  const subscription: Subscription = {
    tier: 'free',
    status: 'active',
  };

  setStoredSubscription(subscription);
  return subscription;
}

/**
 * Start a trial period
 */
export function startTrial(days: number = 7): Subscription {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + days);

  const subscription: Subscription = {
    tier: 'premium',
    status: 'trialing',
    startedAt: now,
    currentPeriodEnd: trialEnd,
    autoRenew: false,
  };

  setStoredSubscription(subscription);
  return subscription;
}

// ============================================================================
// Feature Access
// ============================================================================

/**
 * Check if a feature is available
 */
export function hasFeature(feature: SubscriptionFeature): boolean {
  const tier = getCurrentTier();
  return TIER_FEATURES[tier].includes(feature);
}

/**
 * Check feature access with detailed result
 */
export function checkFeatureAccess(feature: SubscriptionFeature): FeatureAccessResult {
  const tier = getCurrentTier();
  const hasAccess = TIER_FEATURES[tier].includes(feature);

  if (hasAccess) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'feature_not_in_tier',
    upgradePrompt: generateUpgradePrompt('feature_locked', { feature }),
  };
}

/**
 * Get all features for current tier
 */
export function getAvailableFeatures(): SubscriptionFeature[] {
  const tier = getCurrentTier();
  return TIER_FEATURES[tier];
}

// ============================================================================
// Usage Tracking
// ============================================================================

/**
 * Get usage for a trip
 */
export function getTripUsage(tripId: string): TripUsage {
  const allUsage = getStoredTripUsage();
  return allUsage[tripId] || {
    tripId,
    aiInteractions: 0,
    placesSaved: 0,
    photosUploaded: 0,
  };
}

/**
 * Get resource usage with limit info
 */
export function getResourceUsage(resource: LimitedResource, tripId?: string): ResourceUsage {
  const tier = getCurrentTier();
  const limit = TIER_LIMITS[tier][resource];

  let used = 0;

  switch (resource) {
    case 'ai_interactions':
      if (tripId) {
        used = getTripUsage(tripId).aiInteractions;
      }
      break;

    case 'trips_active':
      // Count active trips from storage
      used = Object.keys(getStoredTripUsage()).length;
      break;

    case 'places_per_trip':
      if (tripId) {
        used = getTripUsage(tripId).placesSaved;
      }
      break;

    case 'photos_per_trip':
      if (tripId) {
        used = getTripUsage(tripId).photosUploaded;
      }
      break;
  }

  return {
    resource,
    used,
    limit,
  };
}

/**
 * Check if a resource limit has been reached
 */
export function isLimitReached(resource: LimitedResource, tripId?: string): boolean {
  const usage = getResourceUsage(resource, tripId);
  if (usage.limit === null) return false; // Unlimited
  return usage.used >= usage.limit;
}

/**
 * Check resource access with detailed result
 */
export function checkResourceAccess(
  resource: LimitedResource,
  tripId?: string
): FeatureAccessResult {
  const usage = getResourceUsage(resource, tripId);

  if (usage.limit === null || usage.used < usage.limit) {
    return { allowed: true, usage };
  }

  return {
    allowed: false,
    reason: 'limit_reached',
    usage,
    upgradePrompt: generateUpgradePrompt('limit_reached', { limitHit: resource, usage }),
  };
}

/**
 * Increment AI interaction count
 */
export function incrementAIInteraction(tripId: string): ResourceUsage {
  const allUsage = getStoredTripUsage();
  const tripUsage = allUsage[tripId] || {
    tripId,
    aiInteractions: 0,
    placesSaved: 0,
    photosUploaded: 0,
  };

  tripUsage.aiInteractions++;
  tripUsage.lastInteractionAt = new Date();

  allUsage[tripId] = tripUsage;
  setStoredTripUsage(allUsage);

  return getResourceUsage('ai_interactions', tripId);
}

/**
 * Increment places saved count
 */
export function incrementPlacesSaved(tripId: string): ResourceUsage {
  const allUsage = getStoredTripUsage();
  const tripUsage = allUsage[tripId] || {
    tripId,
    aiInteractions: 0,
    placesSaved: 0,
    photosUploaded: 0,
  };

  tripUsage.placesSaved++;
  allUsage[tripId] = tripUsage;
  setStoredTripUsage(allUsage);

  return getResourceUsage('places_per_trip', tripId);
}

/**
 * Increment photos uploaded count
 */
export function incrementPhotosUploaded(tripId: string): ResourceUsage {
  const allUsage = getStoredTripUsage();
  const tripUsage = allUsage[tripId] || {
    tripId,
    aiInteractions: 0,
    placesSaved: 0,
    photosUploaded: 0,
  };

  tripUsage.photosUploaded++;
  allUsage[tripId] = tripUsage;
  setStoredTripUsage(allUsage);

  return getResourceUsage('photos_per_trip', tripId);
}

/**
 * Reset trip usage
 */
export function resetTripUsage(tripId: string): void {
  const allUsage = getStoredTripUsage();
  delete allUsage[tripId];
  setStoredTripUsage(allUsage);
}

// ============================================================================
// Upgrade Prompts
// ============================================================================

/**
 * Generate an upgrade prompt based on context
 */
export function generateUpgradePrompt(
  context: UpgradePromptContext,
  data?: {
    feature?: SubscriptionFeature;
    limitHit?: LimitedResource;
    usage?: ResourceUsage;
  }
): UpgradePrompt {
  const prompts: Record<UpgradePromptContext, () => UpgradePrompt> = {
    limit_reached: () => {
      const limitNames: Record<LimitedResource, string> = {
        ai_interactions: 'AI messages',
        trips_active: 'active trips',
        places_per_trip: 'saved places',
        photos_per_trip: 'photos',
      };

      const limitName = data?.limitHit ? limitNames[data.limitHit] : 'resources';
      const usageInfo = data?.usage
        ? `${data.usage.used}/${data.usage.limit}`
        : '';

      return {
        context: 'limit_reached',
        title: `You've reached your ${limitName} limit`,
        description: `Free accounts have limited ${limitName}${usageInfo ? ` (${usageInfo})` : ''}. Upgrade to Premium for unlimited access.`,
        limitHit: data?.limitHit,
        ctaText: 'Unlock unlimited',
        dismissible: true,
      };
    },

    feature_locked: () => {
      const featureNames: Record<SubscriptionFeature, string> = {
        unlimited_ai: 'Unlimited AI',
        offline_mode: 'Offline Mode',
        cross_trip_memory: 'Cross-Trip Memory',
        weather_rerouting: 'Weather Rerouting',
        priority_support: 'Priority Support',
        advanced_preferences: 'Advanced Preferences',
        collaborative_trips: 'Collaborative Trips',
        export_itinerary: 'Export Itinerary',
        early_access: 'Early Access',
      };

      const featureName = data?.feature ? featureNames[data.feature] : 'this feature';

      return {
        context: 'feature_locked',
        title: `${featureName} is a Premium feature`,
        description: `Upgrade to Premium to unlock ${featureName.toLowerCase()} and many other powerful features.`,
        feature: data?.feature,
        ctaText: 'Upgrade to Premium',
        dismissible: true,
      };
    },

    settings_page: () => ({
      context: 'settings_page',
      title: 'Upgrade to Premium',
      description: 'Unlock unlimited AI, offline mode, cross-trip memory, and more.',
      ctaText: 'View Premium benefits',
      dismissible: false,
    }),

    trial_ending: () => ({
      context: 'trial_ending',
      title: 'Your trial is ending soon',
      description: 'Keep all your Premium features by subscribing before your trial ends.',
      ctaText: 'Subscribe now',
      dismissible: true,
    }),

    seasonal_offer: () => ({
      context: 'seasonal_offer',
      title: 'Special offer: 50% off Premium',
      description: 'Limited time offer. Get all Premium features at half price.',
      ctaText: 'Claim offer',
      dismissible: true,
    }),
  };

  return prompts[context]();
}

/**
 * Check if an upgrade prompt should be shown
 */
export function shouldShowUpgradePrompt(context: UpgradePromptContext): boolean {
  // Don't show to premium users (except for settings page info)
  if (isPremium() && context !== 'settings_page') {
    return false;
  }

  // Check if recently dismissed
  const dismissals = getUpgradeDismissals();
  const lastDismissed = dismissals[context];

  if (lastDismissed) {
    const hoursSinceDismissal = (Date.now() - lastDismissed) / (1000 * 60 * 60);

    // Different cooldowns for different contexts
    const cooldowns: Record<UpgradePromptContext, number> = {
      limit_reached: 2,        // 2 hours
      feature_locked: 4,       // 4 hours
      settings_page: 0,        // Always show
      trial_ending: 24,        // 24 hours
      seasonal_offer: 72,      // 72 hours
    };

    if (hoursSinceDismissal < cooldowns[context]) {
      return false;
    }
  }

  return true;
}

/**
 * Record that an upgrade prompt was dismissed
 */
export function dismissUpgradePrompt(context: UpgradePromptContext): void {
  const dismissals = getUpgradeDismissals();
  dismissals[context] = Date.now();
  setUpgradeDismissals(dismissals);
}

// ============================================================================
// Pricing Helpers
// ============================================================================

/**
 * Get pricing for a tier
 */
export function getTierPricing(tier: SubscriptionTier) {
  return TIER_PRICING[tier];
}

/**
 * Format price for display
 */
export function formatPrice(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Get formatted monthly price
 */
export function getMonthlyPrice(tier: SubscriptionTier): string {
  const pricing = TIER_PRICING[tier];
  return formatPrice(pricing.monthly, pricing.currency);
}

/**
 * Get formatted yearly price
 */
export function getYearlyPrice(tier: SubscriptionTier): string {
  const pricing = TIER_PRICING[tier];
  return formatPrice(pricing.yearly, pricing.currency);
}

/**
 * Get savings percentage for yearly vs monthly
 */
export function getYearlySavings(tier: SubscriptionTier): number {
  const pricing = TIER_PRICING[tier];
  const monthlyAnnual = pricing.monthly * 12;
  if (monthlyAnnual === 0) return 0;
  return Math.round((1 - pricing.yearly / monthlyAnnual) * 100);
}

// ============================================================================
// Dev/Debug Utilities
// ============================================================================

/**
 * Clear all subscription data (for testing)
 */
export function clearSubscriptionData(): void {
  localStorage.removeItem(SUBSCRIPTION_KEY);
  localStorage.removeItem(USAGE_KEY);
  localStorage.removeItem(TRIP_USAGE_KEY);
  localStorage.removeItem(UPGRADE_DISMISSED_KEY);
}

/**
 * Get subscription debug info
 */
export function getSubscriptionDebugInfo() {
  return {
    subscription: getSubscription(),
    tier: getCurrentTier(),
    isPremium: isPremium(),
    features: getAvailableFeatures(),
    tripUsage: getStoredTripUsage(),
  };
}
