/**
 * useDiscoveryTriggers
 *
 * Watches for trigger events in the discovery phase and reports them
 * to the backend for proactive suggestion generation.
 *
 * Triggers detected:
 * - city_added: User adds a city to route
 * - cities_removed: Multiple cities removed in short time
 * - idle_exploring: User idle on map for 2+ minutes
 * - route_imbalance: Route has unbalanced nights/variety
 * - preference_detected: Clear preference pattern emerges
 * - trip_ready: Route looks complete
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDiscoveryStore } from '../stores/discoveryStore';

// ============================================================================
// Types
// ============================================================================

export interface TriggerEvent {
  trigger: string;
  triggerData: Record<string, unknown>;
  timestamp: Date;
}

export interface TriggerConfig {
  /** Enable trigger detection */
  enabled?: boolean;
  /** Callback when a trigger fires */
  onTrigger?: (event: TriggerEvent) => void;
  /** Session ID for the discovery session */
  sessionId?: string;
}

// ============================================================================
// Constants
// ============================================================================

const IDLE_THRESHOLD_MS = 120000; // 2 minutes
const REMOVAL_WINDOW_MS = 60000; // 1 minute
const MIN_CITIES_FOR_READY = 3;
const MIN_NIGHTS_FOR_READY = 3;

// ============================================================================
// Hook
// ============================================================================

export function useDiscoveryTriggers(config: TriggerConfig = {}) {
  const { enabled = true, onTrigger } = config;

  // Store access
  const route = useDiscoveryStore((state) => state.route);
  const getSelectedCities = useDiscoveryStore((state) => state.getSelectedCities);
  const getPreferenceSignals = useDiscoveryStore((state) => state.getPreferenceSignals);

  // Track last activity for idle detection
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track recent removals for multi-removal detection
  const recentRemovalsRef = useRef<Date[]>([]);

  // Track fired triggers to prevent duplicates
  const firedTriggersRef = useRef<Map<string, number>>(new Map());

  // ============================================================================
  // Trigger Firing
  // ============================================================================

  const fireTrigger = useCallback((trigger: string, triggerData: Record<string, unknown>) => {
    if (!enabled || !onTrigger) return;

    // Check cooldown (30 seconds between same trigger type)
    const lastFired = firedTriggersRef.current.get(trigger);
    if (lastFired && Date.now() - lastFired < 30000) {
      return;
    }

    const event: TriggerEvent = {
      trigger,
      triggerData,
      timestamp: new Date()
    };

    console.log('🎯 Trigger fired:', trigger, triggerData);
    firedTriggersRef.current.set(trigger, Date.now());
    onTrigger(event);
  }, [enabled, onTrigger]);

  // ============================================================================
  // Activity Tracking
  // ============================================================================

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // ============================================================================
  // City Added Detection
  // ============================================================================

  useEffect(() => {
    if (!enabled || !route) return;

    const unsubscribe = useDiscoveryStore.subscribe(
      (state, prevState) => {
        const prevCities = prevState.route?.suggestedCities?.filter(c => c.isSelected) || [];
        const currentCities = state.route?.suggestedCities?.filter(c => c.isSelected) || [];

        // Detect new city added
        if (currentCities.length > prevCities.length) {
          const newCities = currentCities.filter(
            c => !prevCities.some(p => p.id === c.id)
          );

          for (const city of newCities) {
            if (!city.isFixed) { // Don't trigger for origin/destination
              fireTrigger('city_added', {
                cityName: city.name,
                cityId: city.id,
                position: currentCities.findIndex(c => c.id === city.id)
              });
              recordActivity();
            }
          }
        }

        // Detect city removed
        if (currentCities.length < prevCities.length) {
          const removedCities = prevCities.filter(
            p => !currentCities.some(c => c.id === p.id)
          );

          for (const _city of removedCities) {
            recentRemovalsRef.current.push(new Date());
          }

          // Clean old removals
          const now = Date.now();
          recentRemovalsRef.current = recentRemovalsRef.current.filter(
            date => now - date.getTime() < REMOVAL_WINDOW_MS
          );

          // Check for multiple removals
          if (recentRemovalsRef.current.length >= 2) {
            fireTrigger('cities_removed', {
              count: recentRemovalsRef.current.length,
              removedCities: removedCities.map(c => c.name)
            });
            recentRemovalsRef.current = []; // Reset after firing
          }

          recordActivity();
        }
      }
    );

    return unsubscribe;
  }, [enabled, route, fireTrigger, recordActivity]);

  // ============================================================================
  // Idle Detection
  // ============================================================================

  useEffect(() => {
    if (!enabled) return;

    const checkIdle = () => {
      const idleDuration = Date.now() - lastActivityRef.current;

      if (idleDuration >= IDLE_THRESHOLD_MS) {
        // Get current map center if available
        const mapCenter = useDiscoveryStore.getState().mapCenter;

        fireTrigger('idle_exploring', {
          idleDurationMs: idleDuration,
          mapCenter
        });

        // Reset activity to prevent repeated triggers
        lastActivityRef.current = Date.now();
      }
    };

    idleTimerRef.current = setInterval(checkIdle, 30000); // Check every 30 seconds

    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [enabled, fireTrigger]);

  // ============================================================================
  // Route Balance Detection
  // ============================================================================

  useEffect(() => {
    if (!enabled || !route) return;

    const checkRouteBalance = () => {
      const selectedCities = getSelectedCities();
      if (selectedCities.length < 3) return;

      // Check night distribution
      const nights = selectedCities.map(c => c.nights || c.suggestedNights || 1);
      const maxNights = Math.max(...nights);
      const minNights = Math.min(...nights);

      if (maxNights > minNights * 3) {
        fireTrigger('route_imbalance', {
          type: 'night_distribution',
          maxNights,
          minNights,
          cities: selectedCities.map(c => ({ name: c.name, nights: c.nights || 1 }))
        });
      }
    };

    // Check on route changes
    const unsubscribe = useDiscoveryStore.subscribe(
      (state, prevState) => {
        const prevCount = prevState.route?.suggestedCities?.filter(c => c.isSelected).length || 0;
        const currentCount = state.route?.suggestedCities?.filter(c => c.isSelected).length || 0;

        if (currentCount !== prevCount && currentCount >= 3) {
          // Delay to let other triggers fire first
          setTimeout(checkRouteBalance, 1000);
        }
      }
    );

    return unsubscribe;
  }, [enabled, route, getSelectedCities, fireTrigger]);

  // ============================================================================
  // Preference Detection
  // ============================================================================

  useEffect(() => {
    if (!enabled || !route) return;

    const checkPreferences = () => {
      const signals = getPreferenceSignals();

      // Check if we have strong enough signals to trigger
      const hasStrongPreference = signals.topPlaceTypes.length >= 2 || signals.prefersHiddenGems;

      if (hasStrongPreference) {
        const topPreference = signals.prefersHiddenGems
          ? 'hidden_gems'
          : signals.topPlaceTypes[0] || 'general';

        fireTrigger('preference_detected', {
          preferenceType: topPreference,
          confidence: signals.topPlaceTypes.length >= 3 ? 0.8 : 0.6,
          evidence: signals.topPlaceTypes
        });
      }
    };

    // Check periodically
    const interval = setInterval(checkPreferences, 60000); // Every minute

    return () => clearInterval(interval);
  }, [enabled, route, getPreferenceSignals, fireTrigger]);

  // ============================================================================
  // Trip Ready Detection
  // ============================================================================

  useEffect(() => {
    if (!enabled || !route) return;

    const checkTripReady = () => {
      const selectedCities = getSelectedCities();
      const totalNights = selectedCities.reduce(
        (sum, c) => sum + (c.nights || c.suggestedNights || 1),
        0
      );

      if (selectedCities.length >= MIN_CITIES_FOR_READY &&
          totalNights >= MIN_NIGHTS_FOR_READY) {
        fireTrigger('trip_ready', {
          cityCount: selectedCities.length,
          totalNights,
          cities: selectedCities.map(c => c.name)
        });
      }
    };

    // Check on route changes
    const unsubscribe = useDiscoveryStore.subscribe(
      (state, prevState) => {
        const prevCount = prevState.route?.suggestedCities?.filter(c => c.isSelected).length || 0;
        const currentCount = state.route?.suggestedCities?.filter(c => c.isSelected).length || 0;

        if (currentCount > prevCount && currentCount >= MIN_CITIES_FOR_READY) {
          // Delay to let route settle
          setTimeout(checkTripReady, 2000);
        }
      }
    );

    return unsubscribe;
  }, [enabled, route, getSelectedCities, fireTrigger]);

  // ============================================================================
  // Return API
  // ============================================================================

  return {
    /** Record user activity (resets idle timer) */
    recordActivity,

    /** Manually fire a trigger */
    fireTrigger,

    /** Check if a trigger is on cooldown */
    isOnCooldown: useCallback((trigger: string) => {
      const lastFired = firedTriggersRef.current.get(trigger);
      return lastFired ? Date.now() - lastFired < 30000 : false;
    }, []),

    /** Clear all cooldowns */
    clearCooldowns: useCallback(() => {
      firedTriggersRef.current.clear();
    }, [])
  };
}

// ============================================================================
// Helper: Report trigger to backend
// ============================================================================

export async function reportTriggerToBackend(
  trigger: string,
  triggerData: Record<string, unknown>,
  sessionId: string,
  routeData?: unknown,
  preferences?: unknown
): Promise<{
  shouldShow: boolean;
  message?: string;
  quickActions?: Array<{ label: string; action: string; data?: unknown }>;
  priority?: 'high' | 'medium' | 'low';
}> {
  try {
    const response = await fetch('/api/discovery/proactive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger,
        triggerData,
        sessionId,
        routeData,
        preferences
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return {
      shouldShow: data.shouldShow || false,
      message: data.message,
      quickActions: data.quickActions,
      priority: data.priority
    };
  } catch (error) {
    console.error('Failed to report trigger:', error);
    return { shouldShow: false };
  }
}

// ============================================================================
// Helper: Dismiss suggestion
// ============================================================================

export async function dismissSuggestion(
  suggestionId: string,
  sessionId: string
): Promise<void> {
  try {
    await fetch('/api/discovery/trigger/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionId, sessionId })
    });
  } catch (error) {
    console.error('Failed to dismiss suggestion:', error);
  }
}
