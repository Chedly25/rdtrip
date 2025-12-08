/**
 * useAIWithLimits Hook
 *
 * WI-10.6: AI interaction with subscription limits
 *
 * Wraps AI interactions to enforce subscription limits.
 * Shows upgrade prompt when limits are reached.
 *
 * Usage:
 * ```tsx
 * const { canInteract, sendMessage, usage } = useAIWithLimits(tripId);
 *
 * if (canInteract) {
 *   await sendMessage(message);
 * }
 * ```
 */

import { useCallback } from 'react';
import { useSubscriptionStore, useAILimit } from '../stores/subscriptionStore';

// ============================================================================
// Types
// ============================================================================

export interface UseAIWithLimitsOptions {
  /** Callback to send AI message */
  onSendMessage?: (message: string) => Promise<void>;

  /** Callback when limit is reached */
  onLimitReached?: () => void;
}

export interface UseAIWithLimitsReturn {
  /** Whether user can send another message */
  canInteract: boolean;

  /** Number of messages used */
  used: number;

  /** Limit (null = unlimited) */
  limit: number | null;

  /** Messages remaining (null = unlimited) */
  remaining: number | null;

  /** Whether user has unlimited messages */
  isUnlimited: boolean;

  /** Send a message with limit check */
  sendMessage: (message: string) => Promise<boolean>;

  /** Check if interaction is allowed */
  checkLimit: () => boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useAIWithLimits(
  tripId: string | null,
  options: UseAIWithLimitsOptions = {}
): UseAIWithLimitsReturn {
  const store = useSubscriptionStore();
  const aiLimit = useAILimit();

  // Set active trip for tracking
  if (tripId && store.activeTripId !== tripId) {
    store.setActiveTripId(tripId);
  }

  const canInteract = aiLimit.isUnlimited || (aiLimit.remaining ?? 0) > 0;

  const checkLimit = useCallback((): boolean => {
    if (aiLimit.isUnlimited) return true;
    if ((aiLimit.remaining ?? 0) <= 0) {
      store.showUpgrade('limit_reached', { limitHit: 'ai_interactions' });
      options.onLimitReached?.();
      return false;
    }
    return true;
  }, [aiLimit.isUnlimited, aiLimit.remaining, store, options]);

  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    // Check limit first
    if (!checkLimit()) {
      return false;
    }

    // Increment usage
    const allowed = store.incrementAI();
    if (!allowed) {
      return false;
    }

    // Send the message if callback provided
    if (options.onSendMessage) {
      await options.onSendMessage(message);
    }

    return true;
  }, [checkLimit, store, options]);

  return {
    canInteract,
    used: aiLimit.used,
    limit: aiLimit.limit,
    remaining: aiLimit.remaining,
    isUnlimited: aiLimit.isUnlimited,
    sendMessage,
    checkLimit,
  };
}

// ============================================================================
// Feature Gate Hook
// ============================================================================

import type { SubscriptionFeature } from '../services/subscription';

export interface UseFeatureGateReturn {
  /** Whether feature is available */
  hasAccess: boolean;

  /** Try to access feature, shows upgrade prompt if blocked */
  tryAccess: () => boolean;

  /** Whether user is premium */
  isPremium: boolean;
}

/**
 * Hook for gating features behind subscription
 *
 * Usage:
 * ```tsx
 * const offlineMode = useFeatureGate('offline_mode');
 *
 * if (offlineMode.hasAccess) {
 *   // Show offline toggle
 * }
 *
 * function handleToggle() {
 *   if (offlineMode.tryAccess()) {
 *     // Enable offline mode
 *   }
 * }
 * ```
 */
export function useFeatureGate(feature: SubscriptionFeature): UseFeatureGateReturn {
  const store = useSubscriptionStore();

  const hasAccess = store.hasFeature(feature);
  const tryAccess = useCallback(() => store.tryFeature(feature), [store, feature]);

  return {
    hasAccess,
    tryAccess,
    isPremium: store.isPremium,
  };
}

// ============================================================================
// Resource Gate Hook
// ============================================================================

import type { LimitedResource, ResourceUsage } from '../services/subscription';

export interface UseResourceGateReturn {
  /** Current usage */
  usage: ResourceUsage;

  /** Whether limit is reached */
  isReached: boolean;

  /** Remaining uses (null = unlimited) */
  remaining: number | null;

  /** Try to use resource, shows upgrade prompt if blocked */
  tryUse: () => boolean;
}

/**
 * Hook for gating resource usage behind subscription limits
 *
 * Usage:
 * ```tsx
 * const placesLimit = useResourceGate('places_per_trip', tripId);
 *
 * if (!placesLimit.isReached) {
 *   // Show "Add Place" button
 * }
 *
 * function handleAddPlace() {
 *   if (placesLimit.tryUse()) {
 *     // Add the place
 *   }
 * }
 * ```
 */
export function useResourceGate(
  resource: LimitedResource,
  tripId?: string
): UseResourceGateReturn {
  const store = useSubscriptionStore();

  // Set active trip for tracking
  if (tripId && store.activeTripId !== tripId) {
    store.setActiveTripId(tripId);
  }

  const usage = store.getUsage(resource);
  const isReached = store.isLimitReached(resource);
  const remaining = usage.limit === null ? null : Math.max(0, usage.limit - usage.used);

  const tryUse = useCallback(() => store.tryResource(resource), [store, resource]);

  return {
    usage,
    isReached,
    remaining,
    tryUse,
  };
}

export default useAIWithLimits;
