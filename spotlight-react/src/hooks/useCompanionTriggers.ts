/**
 * useCompanionTriggers Hook
 *
 * Watches for user actions and triggers companion responses.
 * Implements reactive triggers based on:
 * - Adding items to plan
 * - Creating clusters
 * - Generating more suggestions
 * - Removing items
 *
 * Based on spec section 8.4 Reactive Triggers
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlanningStore } from '../stores/planningStore';
import type { PlanCard, Cluster, CompanionMessage } from '../types/planning';

// ============================================
// Types
// ============================================

export type TriggerAction =
  | 'add_item'
  | 'add_item_far'
  | 'add_expensive_item'
  | 'create_cluster'
  | 'generate_more'
  | 'remove_item'
  | 'empty_cluster';

export interface TriggerContext {
  action: TriggerAction;
  item?: PlanCard;
  cluster?: Cluster;
  cityId: string;
  walkingMinutes?: number;
}

interface TriggerConfig {
  action: TriggerAction;
  condition?: (context: TriggerContext) => boolean;
  messageBuilder: (context: TriggerContext) => string;
  debounceMs?: number;
}

// ============================================
// Trigger Configurations
// ============================================

const TRIGGER_CONFIGS: TriggerConfig[] = [
  {
    action: 'add_item',
    messageBuilder: (ctx) =>
      `I just added ${ctx.item?.name} to my plan. What do you think?`,
    debounceMs: 500,
  },
  {
    action: 'add_item_far',
    condition: (ctx) => (ctx.walkingMinutes || 0) > 20,
    messageBuilder: (ctx) =>
      `I added ${ctx.item?.name} which is ${ctx.walkingMinutes} minutes away from my other picks. Is that too far?`,
    debounceMs: 500,
  },
  {
    action: 'add_expensive_item',
    condition: (ctx) => ctx.item?.priceLevel === 4,
    messageBuilder: (ctx) =>
      `I added ${ctx.item?.name} which is quite expensive (${ctx.item?.priceEstimate || '€€€€'}). Is it worth it?`,
    debounceMs: 500,
  },
  {
    action: 'create_cluster',
    messageBuilder: (ctx) =>
      `I just created a new area called "${ctx.cluster?.name}". What should I add there first?`,
    debounceMs: 300,
  },
  {
    action: 'generate_more',
    messageBuilder: (ctx) =>
      `Show me more ${ctx.item?.type || 'suggestions'} please.`,
    debounceMs: 200,
  },
  {
    action: 'remove_item',
    messageBuilder: (ctx) =>
      `I removed ${ctx.item?.name} from my plan. Can you suggest an alternative?`,
    debounceMs: 1000,
  },
];

// ============================================
// Distance Calculation
// ============================================

function calculateWalkingMinutes(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  if (!from?.lat || !to?.lat) return 0;

  const R = 6371; // Earth's radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  return Math.round(distanceKm * 12 * 1.2); // 5 km/h + 20% for paths
}

// ============================================
// Main Hook
// ============================================

interface UseCompanionTriggersOptions {
  enabled?: boolean;
  onTrigger?: (message: string, context: TriggerContext) => void;
}

export function useCompanionTriggers(
  cityId: string,
  options: UseCompanionTriggersOptions = {}
) {
  const { enabled = true, onTrigger } = options;

  const {
    cityPlans,
    companionMessages,
    addCompanionMessage,
    routeId,
  } = usePlanningStore();

  // Get city messages for context
  const cityMessages = companionMessages[cityId] || [];

  // Track previous state for change detection
  const prevCityPlanRef = useRef(cityPlans[cityId]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a unique message ID
  const generateMessageId = () =>
    `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Calculate distance from item to nearest cluster
  const getDistanceToNearestCluster = useCallback(
    (item: PlanCard, clusters: Cluster[]): number => {
      if (!item?.location || clusters.length === 0) return 0;

      let minDistance = Infinity;

      for (const cluster of clusters) {
        if (cluster.center) {
          const distance = calculateWalkingMinutes(item.location, cluster.center);
          minDistance = Math.min(minDistance, distance);
        }

        // Also check distance to items in cluster
        for (const clusterItem of cluster.items || []) {
          if (clusterItem.location) {
            const distance = calculateWalkingMinutes(item.location, clusterItem.location);
            minDistance = Math.min(minDistance, distance);
          }
        }
      }

      return minDistance === Infinity ? 0 : minDistance;
    },
    []
  );

  // Trigger a reactive message via API
  const triggerReactiveMessage = useCallback(
    async (context: TriggerContext) => {
      // Skip if no routeId or already many recent messages (to avoid spam)
      if (!routeId) return;
      if (cityMessages.length > 0) {
        const lastMessage = cityMessages[cityMessages.length - 1];
        const timeSinceLastMessage = Date.now() - new Date(lastMessage.timestamp).getTime();
        // Don't trigger if last message was less than 3 seconds ago
        if (timeSinceLastMessage < 3000) return;
      }

      // Find matching trigger config
      const config = TRIGGER_CONFIGS.find((c) => {
        if (c.action !== context.action) return false;
        if (c.condition && !c.condition(context)) return false;
        return true;
      });

      if (!config) return;

      // Build the message
      const message = config.messageBuilder(context);

      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce to avoid rapid-fire triggers
      debounceTimerRef.current = setTimeout(async () => {
        // Call the onTrigger callback if provided (for SSE handling in CompanionPanel)
        if (onTrigger) {
          onTrigger(message, context);
          return; // Let the callback handle the API call
        }

        // Otherwise, call the reactive API endpoint directly
        try {
          const response = await fetch(`/api/planning/${routeId}/companion/reactive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: {
                type: context.action,
                item: context.item,
                cluster: context.cluster,
              },
              context: {
                cityId,
                currentPlan: cityPlans[cityId],
                history: cityMessages.slice(-5),
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.triggered && data.message) {
              // Add assistant response to messages
              const assistantMessage: CompanionMessage = {
                id: generateMessageId(),
                role: 'assistant',
                content: data.message,
                cards: data.cards,
                actions: data.actions,
                timestamp: new Date(),
              };
              addCompanionMessage(cityId, assistantMessage);
            }
          }
        } catch (error) {
          console.error('[useCompanionTriggers] API error:', error);
        }
      }, config.debounceMs || 500);
    },
    [cityId, routeId, cityPlans, cityMessages, onTrigger, addCompanionMessage]
  );

  // Watch for changes in city plan
  useEffect(() => {
    if (!enabled || !cityId) return;

    const currentPlan = cityPlans[cityId];
    const prevPlan = prevCityPlanRef.current;

    // Skip if no previous state to compare
    if (!prevPlan) {
      prevCityPlanRef.current = currentPlan;
      return;
    }

    // Detect added items
    const currentItems = [
      ...(currentPlan?.clusters?.flatMap((c) => c.items) || []),
      ...(currentPlan?.unclustered || []),
    ];
    const prevItems = [
      ...(prevPlan?.clusters?.flatMap((c) => c.items) || []),
      ...(prevPlan?.unclustered || []),
    ];

    const currentItemIds = new Set(currentItems.map((i) => i.id));
    const prevItemIds = new Set(prevItems.map((i) => i.id));

    // Find newly added items
    const addedItems = currentItems.filter((i) => !prevItemIds.has(i.id));

    for (const item of addedItems) {
      const walkingMinutes = getDistanceToNearestCluster(
        item,
        prevPlan?.clusters || []
      );

      // Check for expensive item first
      if (item.priceLevel === 4) {
        triggerReactiveMessage({
          action: 'add_expensive_item',
          item,
          cityId,
        });
      }
      // Check for far item
      else if (walkingMinutes > 20) {
        triggerReactiveMessage({
          action: 'add_item_far',
          item,
          cityId,
          walkingMinutes,
        });
      }
      // Regular add
      else {
        triggerReactiveMessage({
          action: 'add_item',
          item,
          cityId,
          walkingMinutes,
        });
      }
    }

    // Find removed items
    const removedItems = prevItems.filter((i) => !currentItemIds.has(i.id));
    for (const item of removedItems) {
      triggerReactiveMessage({
        action: 'remove_item',
        item,
        cityId,
      });
    }

    // Detect new clusters
    const prevClusterIds = new Set(prevPlan?.clusters?.map((c) => c.id) || []);
    const newClusters = currentPlan?.clusters?.filter((c) => !prevClusterIds.has(c.id)) || [];
    for (const cluster of newClusters) {
      triggerReactiveMessage({
        action: 'create_cluster',
        cluster,
        cityId,
      });
    }

    // Update ref for next comparison
    prevCityPlanRef.current = currentPlan;
  }, [cityPlans, cityId, enabled, getDistanceToNearestCluster, triggerReactiveMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Manual trigger function for external use
  const trigger = useCallback(
    (action: TriggerAction, context: Partial<TriggerContext> = {}) => {
      triggerReactiveMessage({
        action,
        cityId,
        ...context,
      } as TriggerContext);
    },
    [cityId, triggerReactiveMessage]
  );

  return {
    trigger,
  };
}

export default useCompanionTriggers;
