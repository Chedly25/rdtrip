/**
 * Subscription Service
 *
 * WI-10.6: Premium Subscription Model
 *
 * Exports for subscription management, feature gating, and usage tracking.
 */

// Types
export * from './types';

// Service functions
export {
  // Subscription management
  getSubscription,
  getCurrentTier,
  isPremium,
  upgradeToPremium,
  cancelSubscription,
  resumeSubscription,
  downgradeToFree,
  startTrial,

  // Feature access
  hasFeature,
  checkFeatureAccess,
  getAvailableFeatures,

  // Usage tracking
  getTripUsage,
  getResourceUsage,
  isLimitReached,
  checkResourceAccess,
  incrementAIInteraction,
  incrementPlacesSaved,
  incrementPhotosUploaded,
  resetTripUsage,

  // Upgrade prompts
  generateUpgradePrompt,
  shouldShowUpgradePrompt,
  dismissUpgradePrompt,

  // Pricing helpers
  getTierPricing,
  formatPrice,
  getMonthlyPrice,
  getYearlyPrice,
  getYearlySavings,

  // Debug utilities
  clearSubscriptionData,
  getSubscriptionDebugInfo,
} from './subscriptionService';
