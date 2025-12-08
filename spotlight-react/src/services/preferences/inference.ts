/**
 * Preference Inference from Behaviour
 *
 * WI-4.4: Infers preferences from passive user behaviour observation
 *
 * Architecture Decisions:
 * - Subscribes to discovery store for behaviour signals
 * - Uses rules engine to map behaviours to preference updates
 * - Lower confidence than stated preferences ('observed' source)
 * - Implements decay when behaviour contradicts previous inferences
 * - Non-intrusive: runs in background, no UI interruption
 *
 * Key Principle: Be subtle - observed preferences should inform, not dictate.
 *
 * Inference Examples:
 * - Favourite 3+ restaurants → interests.food += 0.2
 * - Remove all hiking spots → avoid.push("hiking")
 * - Click on 5 nightlife venues → interests.nightlife += 0.15
 * - Ignore all shopping listings → interests.shopping -= 0.1
 */

import type { InterestCategories } from './types';
import { usePreferencesStore } from '../../stores/preferencesStore';
import {
  useDiscoveryStore,
  type PlaceType,
  type DiscoveryAction,
  type InferredPreferences,
} from '../../stores/discoveryStore';

// ============================================================================
// Configuration
// ============================================================================

/** Minimum actions before inferring (avoid snap judgments) */
const MIN_ACTIONS_THRESHOLD = 3;

/** Base confidence for observed preferences (lower than stated) */
const OBSERVED_CONFIDENCE = 0.5;

/** Decay rate when contradicting behaviour detected */
const CONTRADICTION_DECAY = 0.15;

/** Maximum delta per inference (don't swing too hard) */
const MAX_DELTA = 0.25;

// ============================================================================
// Types
// ============================================================================

/**
 * Mapping from PlaceType to InterestCategory
 */
type PlaceTypeMapping = {
  placeTypes: PlaceType[];
  category: keyof InterestCategories;
};

/**
 * Inference rule definition
 */
export interface InferenceRule {
  /** Unique rule ID */
  id: string;

  /** Human-readable description */
  description: string;

  /** Condition to check */
  condition: (context: InferenceContext) => boolean;

  /** Action to take if condition met */
  action: (context: InferenceContext) => InferenceAction[];

  /** Priority (higher = checked first) */
  priority: number;

  /** Cooldown in ms (prevent rapid re-triggering) */
  cooldownMs: number;
}

/**
 * Context available to inference rules
 */
export interface InferenceContext {
  /** Current inferred preferences from discovery store */
  inferredPreferences: InferredPreferences;

  /** Recent actions */
  recentActions: DiscoveryAction[];

  /** Favourited place IDs */
  favouritedPlaceIds: string[];

  /** Removed city IDs */
  removedCityIds: string[];

  /** Action counts by type */
  actionCounts: Record<DiscoveryAction['type'], number>;

  /** Place type favourite counts */
  placeTypeCounts: Record<PlaceType, number>;

  /** Last action that triggered this evaluation */
  triggerAction?: DiscoveryAction;

  /** Trip ID (if any) */
  tripId: string | null;
}

/**
 * Action to take based on inference
 */
export interface InferenceAction {
  /** Type of update */
  type:
    | 'interest_adjust'    // Adjust interest category
    | 'add_avoidance'      // Add to avoidances
    | 'set_pace'           // Set pace preference
    | 'set_hidden_gems'    // Set hidden gems preference
    | 'decay_interest';    // Reduce interest (contradiction)

  /** Category to update (for interest_adjust) */
  category?: keyof InterestCategories;

  /** Delta to apply (for interest_adjust, -1 to 1) */
  delta?: number;

  /** Value (for avoidance, pace, etc.) */
  value?: string;

  /** Confidence for this inference (0-1) */
  confidence: number;

  /** Reason for this inference (debugging) */
  reason: string;
}

/**
 * Rule execution state (for cooldowns)
 */
interface RuleState {
  lastTriggered: number;
  triggerCount: number;
}

// ============================================================================
// Place Type to Interest Mapping
// ============================================================================

const PLACE_TYPE_MAPPINGS: PlaceTypeMapping[] = [
  { placeTypes: ['restaurant', 'cafe'], category: 'food' },
  { placeTypes: ['bar'], category: 'nightlife' },
  { placeTypes: ['museum', 'gallery', 'landmark'], category: 'culture' },
  { placeTypes: ['park'], category: 'nature' },
  { placeTypes: ['shop', 'market'], category: 'shopping' },
  { placeTypes: ['viewpoint'], category: 'photography' },
  { placeTypes: ['experience'], category: 'localExperiences' },
];

/**
 * Get interest category for a place type
 */
function getInterestCategory(placeType: PlaceType): keyof InterestCategories | null {
  for (const mapping of PLACE_TYPE_MAPPINGS) {
    if (mapping.placeTypes.includes(placeType)) {
      return mapping.category;
    }
  }
  return null;
}

// ============================================================================
// Inference Rules
// ============================================================================

const ruleStates: Map<string, RuleState> = new Map();

/**
 * Check if rule is in cooldown
 */
function isRuleInCooldown(ruleId: string, cooldownMs: number): boolean {
  const state = ruleStates.get(ruleId);
  if (!state) return false;
  return Date.now() - state.lastTriggered < cooldownMs;
}

/**
 * Mark rule as triggered
 */
function markRuleTriggered(ruleId: string): void {
  const existing = ruleStates.get(ruleId);
  ruleStates.set(ruleId, {
    lastTriggered: Date.now(),
    triggerCount: (existing?.triggerCount || 0) + 1,
  });
}

/**
 * Default inference rules
 */
export const DEFAULT_INFERENCE_RULES: InferenceRule[] = [
  // ==================== Positive Interest Rules ====================

  {
    id: 'food_favourites',
    description: 'User favourites 3+ food places → increase food interest',
    priority: 10,
    cooldownMs: 60000, // 1 minute
    condition: (ctx) => {
      const foodCount = (ctx.placeTypeCounts.restaurant || 0) + (ctx.placeTypeCounts.cafe || 0);
      return foodCount >= 3;
    },
    action: (ctx) => {
      const foodCount = (ctx.placeTypeCounts.restaurant || 0) + (ctx.placeTypeCounts.cafe || 0);
      const delta = Math.min(0.1 + (foodCount - 3) * 0.03, MAX_DELTA);
      return [{
        type: 'interest_adjust',
        category: 'food',
        delta,
        confidence: OBSERVED_CONFIDENCE,
        reason: `Favourited ${foodCount} food places`,
      }];
    },
  },

  {
    id: 'nightlife_favourites',
    description: 'User favourites 2+ bars → increase nightlife interest',
    priority: 10,
    cooldownMs: 60000,
    condition: (ctx) => (ctx.placeTypeCounts.bar || 0) >= 2,
    action: (ctx) => {
      const count = ctx.placeTypeCounts.bar || 0;
      return [{
        type: 'interest_adjust',
        category: 'nightlife',
        delta: Math.min(0.15 + (count - 2) * 0.05, MAX_DELTA),
        confidence: OBSERVED_CONFIDENCE,
        reason: `Favourited ${count} nightlife venues`,
      }];
    },
  },

  {
    id: 'culture_favourites',
    description: 'User favourites 3+ museums/galleries → increase culture interest',
    priority: 10,
    cooldownMs: 60000,
    condition: (ctx) => {
      const cultureCount = (ctx.placeTypeCounts.museum || 0) +
        (ctx.placeTypeCounts.gallery || 0) +
        (ctx.placeTypeCounts.landmark || 0);
      return cultureCount >= 3;
    },
    action: (ctx) => {
      const cultureCount = (ctx.placeTypeCounts.museum || 0) +
        (ctx.placeTypeCounts.gallery || 0) +
        (ctx.placeTypeCounts.landmark || 0);
      return [{
        type: 'interest_adjust',
        category: 'culture',
        delta: Math.min(0.15 + (cultureCount - 3) * 0.03, MAX_DELTA),
        confidence: OBSERVED_CONFIDENCE,
        reason: `Favourited ${cultureCount} cultural places`,
      }];
    },
  },

  {
    id: 'nature_favourites',
    description: 'User favourites 2+ parks → increase nature interest',
    priority: 10,
    cooldownMs: 60000,
    condition: (ctx) => (ctx.placeTypeCounts.park || 0) >= 2,
    action: (ctx) => {
      const count = ctx.placeTypeCounts.park || 0;
      return [{
        type: 'interest_adjust',
        category: 'nature',
        delta: Math.min(0.15 + (count - 2) * 0.05, MAX_DELTA),
        confidence: OBSERVED_CONFIDENCE,
        reason: `Favourited ${count} parks`,
      }];
    },
  },

  {
    id: 'shopping_favourites',
    description: 'User favourites 2+ shops/markets → increase shopping interest',
    priority: 10,
    cooldownMs: 60000,
    condition: (ctx) => {
      const shoppingCount = (ctx.placeTypeCounts.shop || 0) + (ctx.placeTypeCounts.market || 0);
      return shoppingCount >= 2;
    },
    action: (ctx) => {
      const shoppingCount = (ctx.placeTypeCounts.shop || 0) + (ctx.placeTypeCounts.market || 0);
      return [{
        type: 'interest_adjust',
        category: 'shopping',
        delta: Math.min(0.15 + (shoppingCount - 2) * 0.05, MAX_DELTA),
        confidence: OBSERVED_CONFIDENCE,
        reason: `Favourited ${shoppingCount} shopping places`,
      }];
    },
  },

  {
    id: 'photography_favourites',
    description: 'User favourites 2+ viewpoints → increase photography interest',
    priority: 10,
    cooldownMs: 60000,
    condition: (ctx) => (ctx.placeTypeCounts.viewpoint || 0) >= 2,
    action: (ctx) => {
      const count = ctx.placeTypeCounts.viewpoint || 0;
      return [{
        type: 'interest_adjust',
        category: 'photography',
        delta: Math.min(0.15 + (count - 2) * 0.05, MAX_DELTA),
        confidence: OBSERVED_CONFIDENCE,
        reason: `Favourited ${count} viewpoints`,
      }];
    },
  },

  // ==================== Hidden Gems Preference ====================

  {
    id: 'hidden_gems_preference',
    description: 'User frequently favourites hidden gems → prefer hidden gems',
    priority: 15,
    cooldownMs: 120000, // 2 minutes
    condition: (ctx) => ctx.inferredPreferences.prefersHiddenGems,
    action: () => [{
      type: 'set_hidden_gems',
      value: 'true',
      confidence: OBSERVED_CONFIDENCE + 0.1,
      reason: 'Consistently favourites hidden gems over popular spots',
    }],
  },

  // ==================== Pace Inference ====================

  {
    id: 'relaxed_pace',
    description: 'User allocates many nights per city → relaxed pace',
    priority: 12,
    cooldownMs: 180000, // 3 minutes
    condition: (ctx) => ctx.inferredPreferences.averageNightsPerCity >= 2.5,
    action: (ctx) => [{
      type: 'set_pace',
      value: 'relaxed',
      confidence: OBSERVED_CONFIDENCE,
      reason: `Average ${ctx.inferredPreferences.averageNightsPerCity.toFixed(1)} nights/city suggests relaxed pace`,
    }],
  },

  {
    id: 'packed_pace',
    description: 'User allocates few nights per city → packed pace',
    priority: 12,
    cooldownMs: 180000,
    condition: (ctx) => ctx.inferredPreferences.averageNightsPerCity <= 1.2 &&
      ctx.inferredPreferences.averageNightsPerCity > 0,
    action: (ctx) => [{
      type: 'set_pace',
      value: 'packed',
      confidence: OBSERVED_CONFIDENCE,
      reason: `Average ${ctx.inferredPreferences.averageNightsPerCity.toFixed(1)} nights/city suggests packed pace`,
    }],
  },

  // ==================== Negative/Avoidance Rules ====================

  {
    id: 'avoids_museums',
    description: 'User unfavourites or skips all museums → add museum avoidance',
    priority: 8,
    cooldownMs: 300000, // 5 minutes
    condition: (ctx) => {
      // Check if user has specifically unfavourited museums
      const unfavouriteActions = ctx.recentActions.filter(
        a => a.type === 'place_unfavourited' &&
          (a.data?.placeType === 'museum' || a.data?.placeType === 'gallery')
      );
      return unfavouriteActions.length >= 2;
    },
    action: () => [{
      type: 'add_avoidance',
      value: 'museums',
      confidence: OBSERVED_CONFIDENCE - 0.1, // Lower confidence for avoidance
      reason: 'Unfavourited multiple museums',
    }, {
      type: 'decay_interest',
      category: 'culture',
      delta: -0.15,
      confidence: OBSERVED_CONFIDENCE - 0.1,
      reason: 'Unfavourited multiple museums',
    }],
  },

  {
    id: 'removes_nature_cities',
    description: 'User removes cities known for nature/hiking → possible hiking avoidance',
    priority: 8,
    cooldownMs: 300000,
    condition: (ctx) => {
      // This would need city metadata, simplified for now
      const removeActions = ctx.recentActions.filter(a => a.type === 'city_removed');
      return removeActions.length >= 2;
    },
    action: () => [{
      type: 'decay_interest',
      category: 'nature',
      delta: -0.1,
      confidence: OBSERVED_CONFIDENCE - 0.15,
      reason: 'Removed multiple cities',
    }],
  },

  // ==================== Contradiction/Decay Rules ====================

  {
    id: 'unfavourite_decay',
    description: 'User unfavourites a place → slight decay in that category',
    priority: 5,
    cooldownMs: 30000, // 30 seconds
    condition: (ctx) => ctx.triggerAction?.type === 'place_unfavourited',
    action: (ctx) => {
      const placeType = ctx.triggerAction?.data?.placeType as PlaceType | undefined;
      if (!placeType) return [];

      const category = getInterestCategory(placeType);
      if (!category) return [];

      return [{
        type: 'decay_interest',
        category,
        delta: -CONTRADICTION_DECAY,
        confidence: OBSERVED_CONFIDENCE - 0.2,
        reason: `Unfavourited a ${placeType}`,
      }];
    },
  },
];

// ============================================================================
// Inference Engine
// ============================================================================

/**
 * Build inference context from current state
 */
export function buildInferenceContext(
  discoveryState: {
    inferredPreferences: InferredPreferences;
    recentActions: DiscoveryAction[];
    favouritedPlaceIds: string[];
    removedCityIds: string[];
    route: { suggestedCities: Array<{ places?: Array<{ id: string; type: PlaceType }> }> } | null;
  },
  triggerAction?: DiscoveryAction,
  tripId: string | null = null
): InferenceContext {
  // Count actions by type
  const actionCounts: Record<string, number> = {};
  for (const action of discoveryState.recentActions) {
    actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;
  }

  // Count favourited place types
  const placeTypeCounts: Record<PlaceType, number> = {} as Record<PlaceType, number>;

  // Get place types from favourited IDs
  if (discoveryState.route?.suggestedCities) {
    for (const city of discoveryState.route.suggestedCities) {
      if (city.places) {
        for (const place of city.places) {
          if (discoveryState.favouritedPlaceIds.includes(place.id)) {
            placeTypeCounts[place.type] = (placeTypeCounts[place.type] || 0) + 1;
          }
        }
      }
    }
  }

  // Also use inferredPreferences.favouritePlaceTypes
  for (const [type, count] of Object.entries(discoveryState.inferredPreferences.favouritePlaceTypes)) {
    if (count > 0) {
      placeTypeCounts[type as PlaceType] = Math.max(
        placeTypeCounts[type as PlaceType] || 0,
        count
      );
    }
  }

  return {
    inferredPreferences: discoveryState.inferredPreferences,
    recentActions: discoveryState.recentActions,
    favouritedPlaceIds: discoveryState.favouritedPlaceIds,
    removedCityIds: discoveryState.removedCityIds,
    actionCounts: actionCounts as Record<DiscoveryAction['type'], number>,
    placeTypeCounts,
    triggerAction,
    tripId,
  };
}

/**
 * Run inference rules and get actions to apply
 */
export function runInferenceRules(
  context: InferenceContext,
  rules: InferenceRule[] = DEFAULT_INFERENCE_RULES
): InferenceAction[] {
  const actions: InferenceAction[] = [];

  // Sort by priority (higher first)
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    // Check cooldown
    if (isRuleInCooldown(rule.id, rule.cooldownMs)) {
      continue;
    }

    // Check condition
    try {
      if (rule.condition(context)) {
        const ruleActions = rule.action(context);
        actions.push(...ruleActions);
        markRuleTriggered(rule.id);
      }
    } catch (error) {
      console.warn(`[Inference] Rule ${rule.id} failed:`, error);
    }
  }

  return actions;
}

/**
 * Apply inference actions to preferences store
 */
export function applyInferenceActions(
  actions: InferenceAction[],
  tripId?: string | null
): void {
  if (actions.length === 0) return;

  const store = usePreferencesStore.getState();
  const source = 'observed'; // All inferences use 'observed' source

  for (const action of actions) {
    switch (action.type) {
      case 'interest_adjust':
        if (action.category && action.delta !== undefined) {
          store.adjustInterestBy(
            action.category,
            action.delta,
            source,
            tripId
          );
        }
        break;

      case 'decay_interest':
        if (action.category && action.delta !== undefined) {
          // Decay uses negative delta
          store.adjustInterestBy(
            action.category,
            action.delta,
            source,
            tripId
          );
        }
        break;

      case 'add_avoidance':
        if (action.value) {
          store.addAvoidanceTag(
            action.value,
            action.confidence,
            source,
            action.reason,
            tripId
          );
        }
        break;

      case 'set_pace':
        if (action.value === 'relaxed' || action.value === 'balanced' || action.value === 'packed') {
          store.setPace(action.value, source, tripId);
        }
        break;

      case 'set_hidden_gems':
        store.setHiddenGemsPreference(action.value === 'true', source, tripId);
        break;
    }
  }

  if (actions.length > 0) {
    console.log('[Inference] Applied', actions.length, 'preference updates');
  }
}

// ============================================================================
// Behaviour Tracking & Subscription
// ============================================================================

let unsubscribe: (() => void) | null = null;

/**
 * Setup behaviour tracking subscription
 * Call this once on app initialization
 */
export function setupBehaviourTracking(tripId?: string | null): () => void {
  // Unsubscribe from previous if exists
  if (unsubscribe) {
    unsubscribe();
  }

  // Subscribe to discovery store changes
  unsubscribe = useDiscoveryStore.subscribe((state, prevState) => {
    // Only process if actions changed
    if (state.recentActions.length === prevState.recentActions.length) {
      return;
    }

    // Check if we have enough actions
    if (state.recentActions.length < MIN_ACTIONS_THRESHOLD) {
      return;
    }

    // Get the new action(s)
    const newActions = state.recentActions.slice(prevState.recentActions.length);

    for (const action of newActions) {
      // Build context with trigger action
      const context = buildInferenceContext(
        {
          inferredPreferences: state.inferredPreferences,
          recentActions: state.recentActions,
          favouritedPlaceIds: state.favouritedPlaceIds,
          removedCityIds: state.removedCityIds,
          route: state.route,
        },
        action,
        tripId
      );

      // Run rules
      const inferenceActions = runInferenceRules(context);

      // Apply if any
      if (inferenceActions.length > 0) {
        applyInferenceActions(inferenceActions, tripId);
      }
    }
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}

/**
 * Manually trigger inference evaluation
 * Useful when you want to run rules without waiting for an action
 */
export function evaluateInferenceRules(tripId?: string | null): InferenceAction[] {
  const state = useDiscoveryStore.getState();

  const context = buildInferenceContext(
    {
      inferredPreferences: state.inferredPreferences,
      recentActions: state.recentActions,
      favouritedPlaceIds: state.favouritedPlaceIds,
      removedCityIds: state.removedCityIds,
      route: state.route,
    },
    undefined,
    tripId
  );

  const actions = runInferenceRules(context);
  applyInferenceActions(actions, tripId);

  return actions;
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * Hook for preference inference from behaviour
 *
 * Usage:
 * ```tsx
 * function DiscoveryContainer() {
 *   const { isTracking, triggerEvaluation } = usePreferenceInference({ tripId });
 *
 *   // Tracking starts automatically
 *   // Call triggerEvaluation() to manually run rules
 * }
 * ```
 */
export function usePreferenceInference(options: {
  tripId?: string | null;
  enabled?: boolean;
} = {}) {
  const { tripId, enabled = true } = options;

  // Track whether we're set up
  let isTracking = false;

  // Setup on mount
  if (enabled && typeof window !== 'undefined') {
    setupBehaviourTracking(tripId);
    isTracking = true;

    // Note: In a real React hook, you'd use useEffect
    // This is simplified for the service pattern
  }

  const triggerEvaluation = () => evaluateInferenceRules(tripId);

  return {
    isTracking,
    triggerEvaluation,
    runInferenceRules,
    buildInferenceContext,
  };
}

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Get current inference state for debugging
 */
export function getInferenceDebugState() {
  const discoveryState = useDiscoveryStore.getState();
  const preferencesState = usePreferencesStore.getState();

  return {
    actionCount: discoveryState.recentActions.length,
    favouriteCount: discoveryState.favouritedPlaceIds.length,
    removedCityCount: discoveryState.removedCityIds.length,
    inferredPreferences: discoveryState.inferredPreferences,
    effectivePreferences: preferencesState.getEffectivePreferences(),
    ruleStates: Object.fromEntries(ruleStates),
  };
}

/**
 * Reset rule cooldowns (for testing)
 */
export function resetRuleCooldowns(): void {
  ruleStates.clear();
}
