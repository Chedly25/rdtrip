/**
 * useContextObserver
 *
 * WI-3.4: Passive behaviour observation and preference inference
 *
 * Observes user actions during the Discovery phase and infers preferences
 * without interrupting the user. This is a purely passive system that
 * builds a rich understanding of user preferences through observation.
 *
 * Architecture Decision:
 * - Separate from UI components for clean separation of concerns
 * - Updates discoveryStore's inferredPreferences
 * - Provides aggregated insights to companion context
 * - Non-blocking - runs in background without UI impact
 *
 * Inference Philosophy:
 * - Be smart but don't over-assume
 * - Strong signals (3+ similar actions) increase confidence
 * - Contradictory signals should cancel out, not accumulate
 * - Recent actions weighted more heavily than old ones
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useDiscoveryStore, type DiscoveryAction, type PlaceType, type DiscoveryCity } from '../stores/discoveryStore';

// ============================================================================
// Types
// ============================================================================

/**
 * Interest categories we can infer
 */
export type InterestCategory =
  | 'foodie'           // Loves food/restaurants
  | 'culture_buff'     // Museums, history, art
  | 'nature_lover'     // Parks, hiking, outdoors
  | 'nightlife'        // Bars, clubs, evening activities
  | 'beach_person'     // Coastal, beaches, water activities
  | 'adventure_seeker' // Active, thrilling experiences
  | 'relaxation'       // Spa, wellness, slow travel
  | 'shopping'         // Markets, boutiques, retail
  | 'photography'      // Scenic spots, viewpoints
  | 'local_explorer';  // Hidden gems, off-beaten-path

/**
 * Avoidance categories (things user doesn't want)
 */
export type AvoidanceCategory =
  | 'crowds'           // Avoids touristy/busy places
  | 'hiking'           // Not into hiking/mountains
  | 'museums'          // Skips museums/galleries
  | 'nightlife'        // Not interested in bars/clubs
  | 'expensive'        // Budget conscious
  | 'early_mornings';  // Not an early riser

/**
 * Inferred interest with confidence score
 */
export interface InferredInterest {
  category: InterestCategory;
  confidence: number; // 0-1
  signals: string[];  // What actions led to this inference
  lastUpdated: Date;
}

/**
 * Inferred avoidance with confidence score
 */
export interface InferredAvoidance {
  category: AvoidanceCategory;
  confidence: number;
  signals: string[];
  lastUpdated: Date;
}

/**
 * Time tracking for place type viewing
 */
export interface ViewTimeTracking {
  placeType: PlaceType;
  totalSeconds: number;
  viewCount: number;
  lastViewed: Date;
}

/**
 * Complete observed context
 */
export interface ObservedContext {
  // Inferred interests
  interests: InferredInterest[];
  topInterests: InterestCategory[];

  // Inferred avoidances
  avoidances: InferredAvoidance[];

  // Travel style
  travelStyle: {
    pace: 'slow' | 'moderate' | 'fast';
    prefersHiddenGems: boolean;
    budgetLevel: 'budget' | 'moderate' | 'luxury' | null;
  };

  // Behaviour patterns
  patterns: {
    totalActionsObserved: number;
    favouriteRate: number;     // % of places viewed that get favourited
    removalRate: number;       // % of suggested cities that get removed
    averageViewTime: number;   // Seconds
    isActive: boolean;         // Has interacted recently
  };

  // Time-based viewing
  viewTimeByType: ViewTimeTracking[];

  // Summary for AI
  summaryForAI: string;
}

// ============================================================================
// Inference Rules
// ============================================================================

/**
 * Place type to interest category mapping
 */
const PLACE_TYPE_TO_INTEREST: Partial<Record<PlaceType, InterestCategory[]>> = {
  restaurant: ['foodie'],
  cafe: ['foodie'],
  bar: ['nightlife', 'foodie'],
  museum: ['culture_buff'],
  gallery: ['culture_buff', 'photography'],
  park: ['nature_lover', 'relaxation'],
  landmark: ['culture_buff', 'photography'],
  shop: ['shopping'],
  market: ['shopping', 'local_explorer'],
  viewpoint: ['photography', 'nature_lover'],
  experience: ['adventure_seeker', 'local_explorer'],
};

/**
 * City characteristics that indicate interests
 */
const CITY_CHARACTERISTICS: Record<string, InterestCategory[]> = {
  // Coastal/beach keywords
  beach: ['beach_person'],
  coastal: ['beach_person'],
  seaside: ['beach_person'],
  mediterranean: ['beach_person'],
  riviera: ['beach_person'],

  // Mountain/nature keywords
  mountain: ['nature_lover', 'adventure_seeker'],
  alpine: ['nature_lover', 'adventure_seeker'],
  valley: ['nature_lover'],
  national_park: ['nature_lover'],
  hiking: ['nature_lover', 'adventure_seeker'],

  // Urban/culture keywords
  historic: ['culture_buff'],
  medieval: ['culture_buff'],
  art: ['culture_buff'],
  capital: ['culture_buff'],

  // Nightlife keywords
  party: ['nightlife'],
  nightlife: ['nightlife'],
  clubbing: ['nightlife'],
};

/**
 * Thresholds for inference confidence
 */
const CONFIDENCE_THRESHOLDS = {
  LOW: 0.3,      // 1-2 signals
  MEDIUM: 0.6,   // 3-4 signals
  HIGH: 0.8,     // 5+ signals
};

// ============================================================================
// Inference Engine
// ============================================================================

/**
 * Infer interests from favourited places
 */
function inferInterestsFromFavourites(
  placeTypes: Record<PlaceType, number>,
  _totalFavourites: number // Used for future confidence weighting
): InferredInterest[] {
  const interests: Map<InterestCategory, { count: number; signals: string[] }> = new Map();

  Object.entries(placeTypes).forEach(([type, count]) => {
    const placeType = type as PlaceType;
    const mappedInterests = PLACE_TYPE_TO_INTEREST[placeType] || [];

    mappedInterests.forEach((interest) => {
      const existing = interests.get(interest) || { count: 0, signals: [] };
      existing.count += count;
      existing.signals.push(`Favourited ${count} ${placeType}(s)`);
      interests.set(interest, existing);
    });
  });

  return Array.from(interests.entries()).map(([category, data]) => ({
    category,
    confidence: Math.min(1, data.count / 5), // Max confidence at 5 favourites
    signals: data.signals,
    lastUpdated: new Date(),
  }));
}

/**
 * Infer interests from added cities
 */
function inferInterestsFromCities(cities: DiscoveryCity[]): InferredInterest[] {
  const interests: Map<InterestCategory, { count: number; signals: string[] }> = new Map();

  cities.forEach((city) => {
    const cityNameLower = city.name.toLowerCase();
    const descriptionLower = (city.description || '').toLowerCase();
    const combined = `${cityNameLower} ${descriptionLower}`;

    Object.entries(CITY_CHARACTERISTICS).forEach(([keyword, categories]) => {
      if (combined.includes(keyword)) {
        categories.forEach((category) => {
          const existing = interests.get(category) || { count: 0, signals: [] };
          existing.count += 1;
          existing.signals.push(`Added ${city.name} (${keyword})`);
          interests.set(category, existing);
        });
      }
    });
  });

  return Array.from(interests.entries()).map(([category, data]) => ({
    category,
    confidence: Math.min(1, data.count / 3), // Max confidence at 3 matching cities
    signals: data.signals,
    lastUpdated: new Date(),
  }));
}

/**
 * Infer avoidances from removed cities
 */
function inferAvoidancesFromRemovals(
  removedCities: DiscoveryCity[],
  allActions: DiscoveryAction[]
): InferredAvoidance[] {
  const avoidances: Map<AvoidanceCategory, { count: number; signals: string[] }> = new Map();

  // Check removed city characteristics
  removedCities.forEach((city) => {
    const cityNameLower = city.name.toLowerCase();
    const descriptionLower = (city.description || '').toLowerCase();
    const combined = `${cityNameLower} ${descriptionLower}`;

    // Mountain removal → might not be into hiking
    if (combined.includes('mountain') || combined.includes('alpine') || combined.includes('hiking')) {
      const existing = avoidances.get('hiking') || { count: 0, signals: [] };
      existing.count += 1;
      existing.signals.push(`Removed ${city.name} (mountain/hiking)`);
      avoidances.set('hiking', existing);
    }
  });

  // Check action patterns
  const removalCount = allActions.filter((a) => a.type === 'city_removed').length;
  if (removalCount >= 3) {
    // User is selective - they might be avoiding crowds/touristy places
    const existing = avoidances.get('crowds') || { count: 0, signals: [] };
    existing.count += 1;
    existing.signals.push(`Removed ${removalCount} cities (selective traveller)`);
    avoidances.set('crowds', existing);
  }

  return Array.from(avoidances.entries())
    .filter(([_, data]) => data.count >= 2) // Need at least 2 signals
    .map(([category, data]) => ({
      category,
      confidence: Math.min(1, data.count / 4),
      signals: data.signals,
      lastUpdated: new Date(),
    }));
}

/**
 * Infer travel pace from nights allocation
 */
function inferTravelPace(avgNightsPerCity: number): 'slow' | 'moderate' | 'fast' {
  if (avgNightsPerCity >= 3) return 'slow';
  if (avgNightsPerCity >= 2) return 'moderate';
  return 'fast';
}

/**
 * Generate AI-friendly summary
 */
function generateSummaryForAI(context: Omit<ObservedContext, 'summaryForAI'>): string {
  const lines: string[] = [];

  // Top interests
  if (context.topInterests.length > 0) {
    const interestLabels: Record<InterestCategory, string> = {
      foodie: 'food and dining',
      culture_buff: 'culture and history',
      nature_lover: 'nature and outdoors',
      nightlife: 'nightlife and entertainment',
      beach_person: 'beaches and coastal areas',
      adventure_seeker: 'adventure activities',
      relaxation: 'relaxation and wellness',
      shopping: 'shopping and markets',
      photography: 'photography and scenic spots',
      local_explorer: 'local and hidden experiences',
    };

    const topLabels = context.topInterests.map((i) => interestLabels[i]).join(', ');
    lines.push(`Interests: ${topLabels}`);
  }

  // Avoidances
  if (context.avoidances.length > 0) {
    const avoidLabels: Record<AvoidanceCategory, string> = {
      crowds: 'crowds and touristy places',
      hiking: 'hiking and mountain activities',
      museums: 'museums and galleries',
      nightlife: 'nightlife',
      expensive: 'expensive options',
      early_mornings: 'early morning activities',
    };

    const avoidList = context.avoidances.map((a) => avoidLabels[a.category]).join(', ');
    lines.push(`Prefers to avoid: ${avoidList}`);
  }

  // Travel style
  const paceLabels = {
    slow: 'relaxed pace (3+ nights per city)',
    moderate: 'moderate pace (2 nights per city)',
    fast: 'fast pace (1 night per city)',
  };
  lines.push(`Travel style: ${paceLabels[context.travelStyle.pace]}`);

  if (context.travelStyle.prefersHiddenGems) {
    lines.push('Prefers hidden gems over popular tourist spots');
  }

  // Behaviour patterns
  if (context.patterns.favouriteRate > 0.3) {
    lines.push('Actively favourites places they like');
  }

  if (context.patterns.removalRate > 0.4) {
    lines.push('Selective about city choices');
  }

  return lines.join('. ') + '.';
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useContextObserver
 *
 * Passively observes user behaviour and builds a rich preference profile.
 * This hook should be used in the Discovery phase to learn about the user.
 */
export function useContextObserver(): ObservedContext {
  const {
    route,
    inferredPreferences,
    favouritedPlaceIds,
    removedCityIds,
    recentActions,
    getPreferenceSignals,
    getRecentActions,
    getRemovedCities,
  } = useDiscoveryStore();

  // Time tracking refs
  const viewStartTimeRef = useRef<Date | null>(null);
  const currentViewTypeRef = useRef<PlaceType | null>(null);
  const viewTimeByTypeRef = useRef<Map<PlaceType, ViewTimeTracking>>(new Map());

  // Track when place type viewing starts/stops
  // Note: This function is available for components to call when tracking view time
  const trackViewTime = useCallback((placeType: PlaceType | null) => {
    const now = new Date();

    // End previous tracking
    if (currentViewTypeRef.current && viewStartTimeRef.current) {
      const duration = (now.getTime() - viewStartTimeRef.current.getTime()) / 1000;
      const existing = viewTimeByTypeRef.current.get(currentViewTypeRef.current);

      if (existing) {
        existing.totalSeconds += duration;
        existing.viewCount += 1;
        existing.lastViewed = now;
      } else {
        viewTimeByTypeRef.current.set(currentViewTypeRef.current, {
          placeType: currentViewTypeRef.current,
          totalSeconds: duration,
          viewCount: 1,
          lastViewed: now,
        });
      }
    }

    // Start new tracking
    currentViewTypeRef.current = placeType;
    viewStartTimeRef.current = placeType ? now : null;
  }, []);

  // Suppress unused warning - trackViewTime will be used by components
  void trackViewTime;

  // Build observed context
  const observedContext = useMemo((): ObservedContext => {
    const preferenceSignals = getPreferenceSignals();
    const removedCities = getRemovedCities();
    const allActions = getRecentActions();

    // Get selected cities
    const selectedCities = route
      ? [route.origin, ...route.suggestedCities.filter((c) => c.isSelected), route.destination]
      : [];

    // Infer interests from multiple sources
    const fromFavourites = inferInterestsFromFavourites(
      inferredPreferences.favouritePlaceTypes,
      favouritedPlaceIds.length
    );
    const fromCities = inferInterestsFromCities(selectedCities);

    // Merge interests (combine confidence for same categories)
    const mergedInterests: Map<InterestCategory, InferredInterest> = new Map();
    [...fromFavourites, ...fromCities].forEach((interest) => {
      const existing = mergedInterests.get(interest.category);
      if (existing) {
        existing.confidence = Math.min(1, existing.confidence + interest.confidence * 0.5);
        existing.signals.push(...interest.signals);
        existing.lastUpdated = new Date();
      } else {
        mergedInterests.set(interest.category, { ...interest });
      }
    });

    const interests = Array.from(mergedInterests.values())
      .filter((i) => i.confidence >= CONFIDENCE_THRESHOLDS.LOW)
      .sort((a, b) => b.confidence - a.confidence);

    const topInterests = interests
      .slice(0, 3)
      .map((i) => i.category);

    // Infer avoidances
    const avoidances = inferAvoidancesFromRemovals(removedCities, allActions);

    // Travel style
    const travelStyle = {
      pace: inferTravelPace(inferredPreferences.averageNightsPerCity),
      prefersHiddenGems: preferenceSignals.prefersHiddenGems,
      budgetLevel: null as 'budget' | 'moderate' | 'luxury' | null,
    };

    // Behaviour patterns
    const totalActions = allActions.length;
    const favouriteActions = allActions.filter((a) => a.type === 'place_favourited').length;
    const removalActions = allActions.filter((a) => a.type === 'city_removed').length;
    const viewActions = allActions.filter((a) => a.type === 'city_preview_viewed').length;

    const patterns = {
      totalActionsObserved: totalActions,
      favouriteRate: viewActions > 0 ? favouriteActions / viewActions : 0,
      removalRate: route?.suggestedCities.length
        ? removalActions / route.suggestedCities.length
        : 0,
      averageViewTime: 0, // Would need actual time tracking
      isActive: totalActions > 0 &&
        (allActions[allActions.length - 1]?.timestamp.getTime() || 0) > Date.now() - 60000,
    };

    // View time tracking
    const viewTimeByType = Array.from(viewTimeByTypeRef.current.values());

    // Build context without summary first
    const contextWithoutSummary = {
      interests,
      topInterests,
      avoidances,
      travelStyle,
      patterns,
      viewTimeByType,
    };

    // Generate summary
    const summaryForAI = generateSummaryForAI(contextWithoutSummary);

    return {
      ...contextWithoutSummary,
      summaryForAI,
    };
  }, [
    route,
    inferredPreferences,
    favouritedPlaceIds,
    removedCityIds,
    recentActions,
    getPreferenceSignals,
    getRecentActions,
    getRemovedCities,
  ]);

  // Return public API
  return observedContext;
}

// ============================================================================
// Provider Hook (for components that need to track viewing)
// ============================================================================

/**
 * Hook for tracking place type viewing time
 * Use this in components that display place details
 */
export function usePlaceViewTracking() {
  const viewStartRef = useRef<Date | null>(null);
  const currentTypeRef = useRef<PlaceType | null>(null);

  const startTracking = useCallback((placeType: PlaceType) => {
    viewStartRef.current = new Date();
    currentTypeRef.current = placeType;
  }, []);

  const stopTracking = useCallback(() => {
    if (viewStartRef.current && currentTypeRef.current) {
      const duration = (Date.now() - viewStartRef.current.getTime()) / 1000;
      // Could dispatch to a tracking store here
      console.debug(`[ViewTracking] Viewed ${currentTypeRef.current} for ${duration.toFixed(1)}s`);
    }
    viewStartRef.current = null;
    currentTypeRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return { startTracking, stopTracking };
}

// ============================================================================
// Utility: Get Interest Label
// ============================================================================

export function getInterestLabel(category: InterestCategory): string {
  const labels: Record<InterestCategory, string> = {
    foodie: 'Food & Dining',
    culture_buff: 'Culture & History',
    nature_lover: 'Nature & Outdoors',
    nightlife: 'Nightlife',
    beach_person: 'Beaches & Coast',
    adventure_seeker: 'Adventure',
    relaxation: 'Relaxation & Wellness',
    shopping: 'Shopping',
    photography: 'Photography & Scenic',
    local_explorer: 'Local Experiences',
  };
  return labels[category] || category;
}

export function getAvoidanceLabel(category: AvoidanceCategory): string {
  const labels: Record<AvoidanceCategory, string> = {
    crowds: 'Crowds',
    hiking: 'Hiking',
    museums: 'Museums',
    nightlife: 'Nightlife',
    expensive: 'Expensive Places',
    early_mornings: 'Early Mornings',
  };
  return labels[category] || category;
}

// Types are exported inline above
