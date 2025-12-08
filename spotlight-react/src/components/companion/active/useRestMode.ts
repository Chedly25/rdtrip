/**
 * useRestMode Hook
 *
 * WI-7.6: Integration hook for Rest "I'm tired" mode
 *
 * This hook provides:
 * - Filters activities for rest-appropriate places
 * - Sorts by distance (closest first for tired users)
 * - Integrates with ActiveCompanion context
 *
 * Rest-appropriate categories:
 * - Cafés, coffee shops, tea houses
 * - Parks, gardens, squares
 * - Quiet/peaceful spots
 * - Wellness/spa (if available)
 * - Hotel lobbies, lounges
 */

import { useMemo, useCallback, useState } from 'react';
import { useActiveCompanionContextSafe } from '../../../services/tripBrain/companion';
import { useTripBrainSafe } from '../../../services/tripBrain/hooks';
import type { EnrichedActivity } from '../../../services/tripBrain/types';
import type { RestFilter } from './RestMode';

// ============================================================================
// Types
// ============================================================================

export interface UseRestModeOptions {
  /** Maximum results to return */
  maxResults?: number;
  /** Maximum distance in meters */
  maxDistance?: number;
  /** Initial filter */
  initialFilter?: RestFilter;
}

export interface UseRestModeReturn {
  /** Rest spots sorted by distance */
  restSpots: EnrichedActivity[];
  /** Whether loading */
  isLoading: boolean;
  /** Error if any */
  error: string | null;
  /** Current filter */
  activeFilter: RestFilter;
  /** Change filter */
  setFilter: (filter: RestFilter) => void;
  /** Select a rest spot */
  selectRestSpot: (activityId: string) => void;
  /** Go back to choice mode */
  goBackToChoice: () => void;
  /** Refresh rest spots */
  refresh: () => void;
  /** Whether the mode is ready */
  isReady: boolean;
  /** Total available rest spots (before filtering) */
  totalAvailable: number;
}

// ============================================================================
// Rest Keywords
// ============================================================================

const REST_KEYWORDS = {
  cafe: ['café', 'cafe', 'coffee', 'tea', 'bakery', 'patisserie', 'espresso'],
  park: ['park', 'garden', 'jardin', 'square', 'plaza', 'piazza', 'platz'],
  quiet: ['quiet', 'peaceful', 'zen', 'spa', 'wellness', 'meditation'],
  lounge: ['lounge', 'lobby', 'hotel', 'terrace', 'courtyard'],
};

const REST_CATEGORIES = ['food_drink', 'nature', 'wellness'];

// ============================================================================
// Helper Functions
// ============================================================================

function isRestAppropriate(activity: EnrichedActivity): boolean {
  const place = activity.activity.place;
  const category = place.category;

  // Check category first
  if (!REST_CATEGORIES.includes(category)) {
    // Still allow if keywords match
    const text = [place.name, place.description, ...(place.types || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const allKeywords = Object.values(REST_KEYWORDS).flat();
    const hasRestKeyword = allKeywords.some((kw) => text.includes(kw));

    if (!hasRestKeyword) return false;
  }

  // For food_drink, filter out restaurants (too energetic)
  if (category === 'food_drink') {
    const text = [place.name, place.description, ...(place.types || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Must have cafe/coffee keywords
    const cafeKeywords = REST_KEYWORDS.cafe;
    const isCafe = cafeKeywords.some((kw) => text.includes(kw));

    // Exclude if clearly a restaurant
    const restaurantKeywords = ['restaurant', 'dining', 'ristorante', 'bistro', 'brasserie'];
    const isRestaurant = restaurantKeywords.some((kw) => text.includes(kw)) && !isCafe;

    if (isRestaurant) return false;
  }

  return true;
}

function sortByDistance(spots: EnrichedActivity[]): EnrichedActivity[] {
  return [...spots].sort((a, b) => {
    const distA = a.distanceMeters ?? Infinity;
    const distB = b.distanceMeters ?? Infinity;
    return distA - distB;
  });
}

// ============================================================================
// Hook
// ============================================================================

export function useRestMode(options: UseRestModeOptions = {}): UseRestModeReturn {
  const { maxResults = 10, maxDistance = 2000, initialFilter = 'all' } = options;

  // Context access
  const companion = useActiveCompanionContextSafe();
  const tripBrain = useTripBrainSafe();

  // Filter state
  const [activeFilter, setActiveFilter] = useState<RestFilter>(initialFilter);

  // Get all recommendations from companion/tripBrain
  const allActivities = useMemo(() => {
    const recs = companion?.recommendations?.items ?? tripBrain?.recommendations ?? [];
    return recs;
  }, [companion?.recommendations?.items, tripBrain?.recommendations]);

  // Filter for rest-appropriate spots
  const restSpots = useMemo(() => {
    // First, filter for rest-appropriate
    let spots = allActivities.filter(isRestAppropriate);

    // Filter by distance
    if (maxDistance) {
      spots = spots.filter((s) => (s.distanceMeters ?? 0) <= maxDistance);
    }

    // Sort by distance (closest first - tired users want nearby)
    spots = sortByDistance(spots);

    // Limit results
    if (maxResults) {
      spots = spots.slice(0, maxResults);
    }

    return spots;
  }, [allActivities, maxDistance, maxResults]);

  // Total available (before distance/limit filter)
  const totalAvailable = useMemo(() => {
    return allActivities.filter(isRestAppropriate).length;
  }, [allActivities]);

  // Loading state
  const isLoading = companion?.isLoading ?? false;

  // Error state
  const error = companion?.error ?? null;

  // Ready state
  const isReady = companion?.isReady ?? tripBrain?.isReady ?? false;

  // ==================== Actions ====================

  const setFilter = useCallback((filter: RestFilter) => {
    setActiveFilter(filter);
  }, []);

  const selectRestSpot = useCallback(
    (activityId: string) => {
      if (companion) {
        companion.selectActivity(activityId);
      } else if (tripBrain) {
        tripBrain.recordChoice(activityId);
      }
    },
    [companion, tripBrain]
  );

  const goBackToChoice = useCallback(() => {
    if (companion) {
      companion.switchMode('choice');
    }
  }, [companion]);

  const refresh = useCallback(() => {
    if (companion) {
      companion.refreshRecommendations();
    }
  }, [companion]);

  // ==================== Return ====================

  return useMemo(
    () => ({
      restSpots,
      isLoading,
      error,
      activeFilter,
      setFilter,
      selectRestSpot,
      goBackToChoice,
      refresh,
      isReady,
      totalAvailable,
    }),
    [
      restSpots,
      isLoading,
      error,
      activeFilter,
      setFilter,
      selectRestSpot,
      goBackToChoice,
      refresh,
      isReady,
      totalAvailable,
    ]
  );
}

export default useRestMode;
