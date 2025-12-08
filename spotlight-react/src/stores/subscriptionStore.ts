/**
 * Subscription Store
 *
 * WI-10.6: Zustand store for subscription state management
 *
 * Provides reactive subscription state for UI components.
 * Wraps the subscription service with Zustand for reactivity.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type Subscription,
  type SubscriptionTier,
  type BillingPeriod,
  type SubscriptionFeature,
  type LimitedResource,
  type ResourceUsage,
  type TripUsage,
  type UpgradePrompt,
  type UpgradePromptContext,
} from '../services/subscription/types';
import {
  getSubscription,
  getCurrentTier,
  isPremium as checkIsPremium,
  upgradeToPremium as doUpgrade,
  cancelSubscription as doCancel,
  resumeSubscription as doResume,
  downgradeToFree as doDowngrade,
  startTrial as doStartTrial,
  hasFeature as checkHasFeature,
  checkFeatureAccess,
  getResourceUsage,
  isLimitReached as checkLimitReached,
  checkResourceAccess,
  incrementAIInteraction as doIncrementAI,
  getTripUsage,
  generateUpgradePrompt,
  shouldShowUpgradePrompt,
  dismissUpgradePrompt as doDismiss,
} from '../services/subscription';
import {
  trackTrialStarted,
  trackTrialConverted,
  trackSubscriptionStarted,
  trackSubscriptionCanceled,
  trackSubscriptionResumed,
  trackUpgradePromptShown,
  trackUpgradePromptClicked,
  trackUpgradePromptDismissed,
} from '../services/analytics';

// ============================================================================
// Types
// ============================================================================

interface SubscriptionState {
  // ==================== Core State ====================
  /** Current subscription */
  subscription: Subscription;

  /** Current tier (convenience) */
  tier: SubscriptionTier;

  /** Whether user has premium */
  isPremium: boolean;

  /** Whether upgrade prompt is visible */
  showUpgradePrompt: boolean;

  /** Current upgrade prompt data */
  upgradePrompt: UpgradePrompt | null;

  /** Active trip ID for usage tracking */
  activeTripId: string | null;

  // ==================== Actions ====================

  /** Refresh subscription state from storage */
  refresh: () => void;

  /** Set active trip for usage tracking */
  setActiveTripId: (tripId: string | null) => void;

  /** Upgrade to premium */
  upgrade: (billingPeriod?: BillingPeriod) => void;

  /** Cancel subscription */
  cancel: () => void;

  /** Resume canceled subscription */
  resume: () => void;

  /** Downgrade to free */
  downgrade: () => void;

  /** Start a trial */
  startTrial: (days?: number) => void;

  /** Check if feature is available */
  hasFeature: (feature: SubscriptionFeature) => boolean;

  /** Check if limit is reached */
  isLimitReached: (resource: LimitedResource) => boolean;

  /** Get resource usage */
  getUsage: (resource: LimitedResource) => ResourceUsage;

  /** Get trip usage */
  getTripUsage: () => TripUsage | null;

  /** Increment AI interaction (returns true if allowed, false if limit reached) */
  incrementAI: () => boolean;

  /** Check and show upgrade prompt if needed */
  checkAndShowUpgrade: (context: UpgradePromptContext, data?: {
    feature?: SubscriptionFeature;
    limitHit?: LimitedResource;
  }) => boolean;

  /** Show upgrade prompt */
  showUpgrade: (context: UpgradePromptContext, data?: {
    feature?: SubscriptionFeature;
    limitHit?: LimitedResource;
  }) => void;

  /** Dismiss upgrade prompt */
  dismissUpgrade: () => void;

  /** Check feature access and show prompt if blocked */
  tryFeature: (feature: SubscriptionFeature) => boolean;

  /** Check resource access and show prompt if blocked */
  tryResource: (resource: LimitedResource) => boolean;
}

// ============================================================================
// Store
// ============================================================================

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // ==================== Initial State ====================
      subscription: getSubscription(),
      tier: getCurrentTier(),
      isPremium: checkIsPremium(),
      showUpgradePrompt: false,
      upgradePrompt: null,
      activeTripId: null,

      // ==================== Actions ====================

      refresh: () => {
        const subscription = getSubscription();
        set({
          subscription,
          tier: getCurrentTier(),
          isPremium: checkIsPremium(),
        });
      },

      setActiveTripId: (tripId) => {
        set({ activeTripId: tripId });
      },

      upgrade: (billingPeriod = 'monthly') => {
        const { subscription: prevSub, upgradePrompt } = get();
        const subscription = doUpgrade(billingPeriod);

        // Track analytics
        if (prevSub.status === 'trialing') {
          // Converting from trial
          trackTrialConverted(billingPeriod);
        } else {
          // Direct subscription
          trackSubscriptionStarted(billingPeriod);
        }

        // Track if upgrading from a prompt
        if (upgradePrompt) {
          trackUpgradePromptClicked(upgradePrompt.context);
        }

        set({
          subscription,
          tier: 'premium',
          isPremium: true,
          showUpgradePrompt: false,
          upgradePrompt: null,
        });
      },

      cancel: () => {
        const subscription = doCancel();
        trackSubscriptionCanceled();
        set({ subscription });
      },

      resume: () => {
        const subscription = doResume();
        trackSubscriptionResumed();
        set({ subscription });
      },

      downgrade: () => {
        const subscription = doDowngrade();
        set({
          subscription,
          tier: 'free',
          isPremium: false,
        });
      },

      startTrial: (days = 7) => {
        const subscription = doStartTrial(days);
        trackTrialStarted();
        set({
          subscription,
          tier: 'premium',
          isPremium: true,
        });
      },

      hasFeature: (feature) => {
        return checkHasFeature(feature);
      },

      isLimitReached: (resource) => {
        const { activeTripId } = get();
        return checkLimitReached(resource, activeTripId || undefined);
      },

      getUsage: (resource) => {
        const { activeTripId } = get();
        return getResourceUsage(resource, activeTripId || undefined);
      },

      getTripUsage: () => {
        const { activeTripId } = get();
        if (!activeTripId) return null;
        return getTripUsage(activeTripId);
      },

      incrementAI: () => {
        const { activeTripId, isPremium } = get();
        if (!activeTripId) return true; // No trip, allow

        // Check limit first
        if (!isPremium && checkLimitReached('ai_interactions', activeTripId)) {
          get().showUpgrade('limit_reached', { limitHit: 'ai_interactions' });
          return false;
        }

        // Increment
        doIncrementAI(activeTripId);
        return true;
      },

      checkAndShowUpgrade: (context, data) => {
        if (!shouldShowUpgradePrompt(context)) {
          return false;
        }

        get().showUpgrade(context, data);
        return true;
      },

      showUpgrade: (context, data) => {
        const prompt = generateUpgradePrompt(context, data);
        trackUpgradePromptShown(context);
        set({
          showUpgradePrompt: true,
          upgradePrompt: prompt,
        });
      },

      dismissUpgrade: () => {
        const { upgradePrompt } = get();
        if (upgradePrompt) {
          doDismiss(upgradePrompt.context);
          trackUpgradePromptDismissed(upgradePrompt.context);
        }
        set({
          showUpgradePrompt: false,
          upgradePrompt: null,
        });
      },

      tryFeature: (feature) => {
        const result = checkFeatureAccess(feature);
        if (!result.allowed && result.upgradePrompt) {
          set({
            showUpgradePrompt: true,
            upgradePrompt: result.upgradePrompt,
          });
        }
        return result.allowed;
      },

      tryResource: (resource) => {
        const { activeTripId } = get();
        const result = checkResourceAccess(resource, activeTripId || undefined);
        if (!result.allowed && result.upgradePrompt) {
          set({
            showUpgradePrompt: true,
            upgradePrompt: result.upgradePrompt,
          });
        }
        return result.allowed;
      },
    }),
    {
      name: 'waycraft-subscription-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist minimal state - rest comes from service
        activeTripId: state.activeTripId,
      }),
    }
  )
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get subscription state
 */
export function useSubscription() {
  return useSubscriptionStore((state) => ({
    subscription: state.subscription,
    tier: state.tier,
    isPremium: state.isPremium,
  }));
}

/**
 * Hook for subscription actions
 */
export function useSubscriptionActions() {
  return useSubscriptionStore((state) => ({
    upgrade: state.upgrade,
    cancel: state.cancel,
    resume: state.resume,
    downgrade: state.downgrade,
    startTrial: state.startTrial,
    refresh: state.refresh,
  }));
}

/**
 * Hook for feature gating
 */
export function useFeatureGate(feature: SubscriptionFeature) {
  const store = useSubscriptionStore();
  const hasAccess = store.hasFeature(feature);

  return {
    hasAccess,
    tryAccess: () => store.tryFeature(feature),
  };
}

/**
 * Hook for resource limits
 */
export function useResourceLimit(resource: LimitedResource) {
  const store = useSubscriptionStore();
  const usage = store.getUsage(resource);
  const isReached = store.isLimitReached(resource);

  return {
    usage,
    isReached,
    remaining: usage.limit === null ? null : Math.max(0, usage.limit - usage.used),
    tryAccess: () => store.tryResource(resource),
  };
}

/**
 * Hook for upgrade prompt
 */
export function useUpgradePrompt() {
  return useSubscriptionStore((state) => ({
    show: state.showUpgradePrompt,
    prompt: state.upgradePrompt,
    dismiss: state.dismissUpgrade,
    showPrompt: state.showUpgrade,
  }));
}

/**
 * Hook for AI interaction limit
 */
export function useAILimit() {
  const store = useSubscriptionStore();
  const usage = store.getUsage('ai_interactions');

  return {
    used: usage.used,
    limit: usage.limit,
    remaining: usage.limit === null ? null : Math.max(0, usage.limit - usage.used),
    isUnlimited: usage.limit === null,
    increment: store.incrementAI,
  };
}

export default useSubscriptionStore;
