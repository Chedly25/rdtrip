/**
 * useChoiceMode Hook
 *
 * WI-7.3: Integration hook connecting ChoiceMode UI with TripBrain
 *
 * This hook provides:
 * - Recommendations from TripBrain (top 3)
 * - Actions: select, skip, refresh
 * - Location/time-aware updates
 * - Integration with ActiveCompanion context
 */

import { useCallback, useMemo } from 'react';
import { useActiveCompanionContextSafe } from '../../../services/tripBrain/companion';
import { useTripBrainSafe } from '../../../services/tripBrain/hooks';
import type { EnrichedActivity } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface UseChoiceModeOptions {
  /** Maximum number of recommendations to show */
  maxRecommendations?: number;
  /** Auto-refresh interval in ms (0 = disabled) */
  autoRefreshInterval?: number;
}

export interface UseChoiceModeReturn {
  /** Top recommendations */
  recommendations: EnrichedActivity[];
  /** Whether recommendations are loading */
  isLoading: boolean;
  /** Whether TripBrain is ready */
  isReady: boolean;
  /** Current day number */
  dayNumber: number;
  /** Current city name */
  cityName?: string;
  /** Whether location is being tracked */
  isTrackingLocation: boolean;
  /** Select an activity (marks as chosen) */
  selectActivity: (activityId: string) => void;
  /** Skip an activity with optional reason */
  skipActivity: (activityId: string, reason?: string) => void;
  /** Refresh recommendations */
  refreshRecommendations: () => void;
  /** Switch to chat mode */
  openChat: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useChoiceMode(
  options: UseChoiceModeOptions = {}
): UseChoiceModeReturn {
  const { maxRecommendations = 3 } = options;

  // Try to get ActiveCompanion context (may be null)
  const companion = useActiveCompanionContextSafe();

  // Also try TripBrain directly as fallback
  const tripBrain = useTripBrainSafe();

  // Get recommendations - prefer companion context, fall back to TripBrain
  const allRecommendations = useMemo(() => {
    if (companion?.recommendations.items) {
      return companion.recommendations.items;
    }
    if (tripBrain?.recommendations) {
      return tripBrain.recommendations;
    }
    return [];
  }, [companion?.recommendations.items, tripBrain?.recommendations]);

  // Limit to max recommendations
  const recommendations = useMemo(() => {
    return allRecommendations.slice(0, maxRecommendations);
  }, [allRecommendations, maxRecommendations]);

  // Loading state
  const isLoading = companion?.isLoading ?? tripBrain?.state?.isLoading ?? false;

  // Ready state
  const isReady = companion?.isReady ?? tripBrain?.isReady ?? false;

  // Day number
  const dayNumber = companion?.modeContext?.currentDay ?? 1;

  // City name
  const cityName = companion?.context?.currentCity ?? tripBrain?.location?.cityName;

  // Location tracking
  const isTrackingLocation = companion?.context?.isTrackingLocation ?? tripBrain?.isTrackingLocation ?? false;

  // ==================== Actions ====================

  const selectActivity = useCallback((activityId: string) => {
    if (companion) {
      companion.selectActivity(activityId);
    } else if (tripBrain) {
      tripBrain.recordChoice(activityId);
    }
  }, [companion, tripBrain]);

  const skipActivity = useCallback((activityId: string, reason?: string) => {
    if (companion) {
      companion.skipActivity(activityId, reason);
    } else if (tripBrain) {
      tripBrain.recordSkip(activityId, reason);
    }
  }, [companion, tripBrain]);

  const refreshRecommendations = useCallback(() => {
    if (companion) {
      companion.refreshRecommendations();
    } else if (tripBrain) {
      tripBrain.getRecommendations({ count: maxRecommendations });
    }
  }, [companion, tripBrain, maxRecommendations]);

  const openChat = useCallback(() => {
    if (companion) {
      companion.switchMode('chat');
    }
    // If no companion context, this is a no-op
    // The parent component should handle this case
  }, [companion]);

  return {
    recommendations,
    isLoading,
    isReady,
    dayNumber,
    cityName,
    isTrackingLocation,
    selectActivity,
    skipActivity,
    refreshRecommendations,
    openChat,
  };
}

export default useChoiceMode;
