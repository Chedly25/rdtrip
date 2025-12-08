/**
 * Time Allocation Algorithm
 *
 * WI-5.2: Intelligent allocation of trip days across cities
 *
 * Algorithm Overview:
 * 1. Calculate base allocation (total days / city count)
 * 2. Score each city based on importance factors
 * 3. Adjust allocation based on scores and pace preference
 * 4. Apply minimum constraints (no city gets less than threshold)
 * 5. Normalize to exactly match total days
 *
 * Factors considered:
 * - City size/importance (place count as proxy)
 * - User interest match (how well city matches preferences)
 * - Favourited place count
 * - Position in trip (origin/destination get less - arrival/departure overhead)
 * - Pace preference (relaxed = more time per city, packed = less)
 */

import type { TripPace, UserPreferences, InterestCategories } from '../preferences';
import type { WaycraftCategory } from '../../utils/placeCategories';

// ============================================================================
// Types
// ============================================================================

/**
 * Input city for time allocation
 */
export interface AllocationCity {
  /** City ID */
  id: string;
  /** City name */
  name: string;
  /** Total places available in this city */
  placeCount: number;
  /** Number of places user has favourited in this city */
  favouritedPlaceCount: number;
  /** Category breakdown of places in city */
  categoryBreakdown?: Partial<Record<WaycraftCategory, number>>;
  /** Whether this is the origin city */
  isOrigin?: boolean;
  /** Whether this is the destination city */
  isDestination?: boolean;
  /** Pre-calculated interest match score (0-1), if available */
  interestMatchScore?: number;
}

/**
 * Options for time allocation
 */
export interface AllocationOptions {
  /** User's pace preference */
  pace: TripPace;
  /** User's preferences for interest matching */
  preferences?: UserPreferences;
  /** Minimum days for any city */
  minDaysPerCity?: number;
  /** Minimum days for origin city (arrival day) */
  minOriginDays?: number;
  /** Minimum days for destination city (departure day) */
  minDestinationDays?: number;
  /** Weight for city size factor (default: 0.3) */
  sizeWeight?: number;
  /** Weight for interest match factor (default: 0.3) */
  interestWeight?: number;
  /** Weight for favourites factor (default: 0.25) */
  favouritesWeight?: number;
  /** Weight for position factor (default: 0.15) */
  positionWeight?: number;
}

/**
 * Allocation result for a single city
 */
export interface CityAllocation {
  /** City ID */
  cityId: string;
  /** City name */
  cityName: string;
  /** Allocated days (can be fractional) */
  days: number;
  /** Allocated nights (rounded from days) */
  nights: number;
  /** Importance score (0-1) */
  importanceScore: number;
  /** Breakdown of score factors */
  scoreBreakdown: {
    sizeFactor: number;
    interestFactor: number;
    favouritesFactor: number;
    positionFactor: number;
  };
}

/**
 * Complete allocation result
 */
export interface AllocationResult {
  /** Allocations per city */
  allocations: CityAllocation[];
  /** Total days allocated */
  totalDays: number;
  /** Total nights (sum of all city nights) */
  totalNights: number;
  /** Summary statistics */
  stats: {
    avgDaysPerCity: number;
    minDays: number;
    maxDays: number;
    pace: TripPace;
  };
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default minimum days constraints
 */
const DEFAULT_MIN_DAYS = {
  regular: 1,
  origin: 0.5,      // Half day for arrival
  destination: 0.5, // Half day for departure
};

/**
 * Pace multipliers - how pace affects time per city
 * Higher = more time per city (fewer cities covered more deeply)
 */
const PACE_MULTIPLIERS: Record<TripPace, number> = {
  relaxed: 1.15,    // 15% more time per city
  balanced: 1.0,    // No adjustment
  packed: 0.85,     // 15% less time per city
};

/**
 * Default scoring weights
 */
const DEFAULT_WEIGHTS = {
  size: 0.3,
  interest: 0.3,
  favourites: 0.25,
  position: 0.15,
};

/**
 * Internal allocation state during calculation
 */
interface AllocationState {
  city: AllocationCity;
  score: number;
  breakdown: CityAllocation['scoreBreakdown'];
  rawDays: number;
  days: number;
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate size factor based on place count
 * Normalizes to a 0.5 - 1.5 range
 */
function calculateSizeFactor(placeCount: number, allCities: AllocationCity[]): number {
  if (allCities.length === 0) return 1.0;

  const placeCounts = allCities.map((c) => c.placeCount);
  const maxCount = Math.max(...placeCounts);
  const minCount = Math.min(...placeCounts);

  // If all cities have same count, return neutral
  if (maxCount === minCount) return 1.0;

  // Normalize to 0-1, then scale to 0.5-1.5
  const normalized = (placeCount - minCount) / (maxCount - minCount);
  return 0.5 + normalized; // 0.5 to 1.5 range
}

/**
 * Calculate interest match factor
 * How well the city's offerings match user preferences
 */
function calculateInterestFactor(
  city: AllocationCity,
  preferences?: UserPreferences
): number {
  // If pre-calculated, use it
  if (city.interestMatchScore !== undefined) {
    return city.interestMatchScore;
  }

  // If no preferences or category breakdown, return neutral
  if (!preferences || !city.categoryBreakdown) {
    return 0.5;
  }

  const interests = preferences.interests.value;
  const categoryMapping: Record<WaycraftCategory, (keyof InterestCategories)[]> = {
    food_drink: ['food'],
    culture: ['culture'],
    nature: ['nature', 'adventure', 'beach'],
    nightlife: ['nightlife'],
    shopping: ['shopping'],
    activities: ['adventure', 'localExperiences'],
    wellness: ['relaxation'],
    services: [],
    accommodation: [],
    other: [],
  };

  let totalScore = 0;
  let totalPlaces = 0;

  for (const [category, count] of Object.entries(city.categoryBreakdown)) {
    const cat = category as WaycraftCategory;
    const relevantInterests = categoryMapping[cat] || [];

    if (relevantInterests.length > 0) {
      // Get max interest strength for this category
      const maxInterest = Math.max(
        ...relevantInterests.map((i) => interests[i] || 0.5)
      );
      totalScore += maxInterest * count;
    } else {
      totalScore += 0.5 * count; // Neutral for unmapped categories
    }
    totalPlaces += count;
  }

  if (totalPlaces === 0) return 0.5;
  return totalScore / totalPlaces;
}

/**
 * Calculate favourites factor
 * More favourites = more time needed
 */
function calculateFavouritesFactor(
  city: AllocationCity,
  allCities: AllocationCity[]
): number {
  if (city.favouritedPlaceCount === 0) return 0.5;

  const maxFavourites = Math.max(...allCities.map((c) => c.favouritedPlaceCount));
  if (maxFavourites === 0) return 0.5;

  // Normalize to 0-1, then scale to 0.5-1.5
  const normalized = city.favouritedPlaceCount / maxFavourites;
  return 0.5 + normalized;
}

/**
 * Calculate position factor
 * Origin/destination get less time (arrival/departure overhead)
 */
function calculatePositionFactor(city: AllocationCity): number {
  if (city.isOrigin || city.isDestination) {
    return 0.7; // 30% reduction for entry/exit cities
  }
  return 1.0; // Full factor for middle cities
}

/**
 * Calculate overall importance score for a city
 */
function calculateImportanceScore(
  city: AllocationCity,
  allCities: AllocationCity[],
  preferences: UserPreferences | undefined,
  weights: typeof DEFAULT_WEIGHTS
): { score: number; breakdown: CityAllocation['scoreBreakdown'] } {
  const sizeFactor = calculateSizeFactor(city.placeCount, allCities);
  const interestFactor = calculateInterestFactor(city, preferences);
  const favouritesFactor = calculateFavouritesFactor(city, allCities);
  const positionFactor = calculatePositionFactor(city);

  const score =
    sizeFactor * weights.size +
    interestFactor * weights.interest +
    favouritesFactor * weights.favourites +
    positionFactor * weights.position;

  return {
    score,
    breakdown: {
      sizeFactor,
      interestFactor,
      favouritesFactor,
      positionFactor,
    },
  };
}

// ============================================================================
// Main Allocation Function
// ============================================================================

/**
 * Allocate trip days across cities intelligently
 *
 * @param cities - Cities to allocate time to
 * @param totalDays - Total trip days available
 * @param options - Allocation options
 * @returns Allocation result with days per city
 */
export function allocateTripTime(
  cities: AllocationCity[],
  totalDays: number,
  options: AllocationOptions
): AllocationResult {
  const {
    pace,
    preferences,
    minDaysPerCity = DEFAULT_MIN_DAYS.regular,
    minOriginDays = DEFAULT_MIN_DAYS.origin,
    minDestinationDays = DEFAULT_MIN_DAYS.destination,
    sizeWeight = DEFAULT_WEIGHTS.size,
    interestWeight = DEFAULT_WEIGHTS.interest,
    favouritesWeight = DEFAULT_WEIGHTS.favourites,
    positionWeight = DEFAULT_WEIGHTS.position,
  } = options;

  const weights = {
    size: sizeWeight,
    interest: interestWeight,
    favourites: favouritesWeight,
    position: positionWeight,
  };

  // Handle edge cases
  if (cities.length === 0) {
    return {
      allocations: [],
      totalDays: 0,
      totalNights: 0,
      stats: { avgDaysPerCity: 0, minDays: 0, maxDays: 0, pace },
    };
  }

  if (cities.length === 1) {
    // Single city gets all days
    const city = cities[0];
    const { score, breakdown } = calculateImportanceScore(city, cities, preferences, weights);
    return {
      allocations: [
        {
          cityId: city.id,
          cityName: city.name,
          days: totalDays,
          nights: Math.max(0, totalDays - 1),
          importanceScore: score,
          scoreBreakdown: breakdown,
        },
      ],
      totalDays,
      totalNights: Math.max(0, totalDays - 1),
      stats: { avgDaysPerCity: totalDays, minDays: totalDays, maxDays: totalDays, pace },
    };
  }

  // Step 1: Calculate importance scores for all cities
  const scoredCities = cities.map((city) => ({
    city,
    ...calculateImportanceScore(city, cities, preferences, weights),
  }));

  // Step 2: Calculate total score for normalization
  const totalScore = scoredCities.reduce((sum, sc) => sum + sc.score, 0);

  // Step 3: Base allocation proportional to scores
  const paceMultiplier = PACE_MULTIPLIERS[pace];
  let allocations: AllocationState[] = scoredCities.map((sc) => {
    const baseAllocation = (sc.score / totalScore) * totalDays;
    const paceAdjusted = baseAllocation * paceMultiplier;

    // Calculate minimum for this city
    let minDays = minDaysPerCity;
    if (sc.city.isOrigin) minDays = minOriginDays;
    if (sc.city.isDestination) minDays = minDestinationDays;

    return {
      city: sc.city,
      score: sc.score,
      breakdown: sc.breakdown,
      rawDays: paceAdjusted,
      days: Math.max(minDays, paceAdjusted),
    };
  });

  // Step 4: Normalize to exactly match total days
  const currentTotal = allocations.reduce((sum, a) => sum + a.days, 0);
  const scaleFactor = totalDays / currentTotal;

  // Only scale down if we're over, otherwise redistribute excess
  if (scaleFactor < 1) {
    // We're over - scale down proportionally, respecting minimums
    allocations = allocations.map((alloc) => {
      let minDays = minDaysPerCity;
      if (alloc.city.isOrigin) minDays = minOriginDays;
      if (alloc.city.isDestination) minDays = minDestinationDays;

      const scaledDays = alloc.days * scaleFactor;
      return {
        ...alloc,
        days: Math.max(minDays, scaledDays),
      };
    });
  } else if (scaleFactor > 1) {
    // We're under - distribute extra days proportionally to scores
    const extraDays = totalDays - currentTotal;
    const extraPerScore = extraDays / totalScore;

    allocations = allocations.map((alloc) => ({
      ...alloc,
      days: alloc.days + alloc.score * extraPerScore,
    }));
  }

  // Final normalization pass to ensure exact total
  const finalTotal = allocations.reduce((sum, a) => sum + a.days, 0);
  if (Math.abs(finalTotal - totalDays) > 0.01) {
    // Distribute remaining difference to highest-scored city
    const diff = totalDays - finalTotal;
    const highestScoredIdx = allocations.reduce(
      (maxIdx, alloc, idx, arr) =>
        alloc.score > arr[maxIdx].score ? idx : maxIdx,
      0
    );
    allocations[highestScoredIdx].days += diff;
  }

  // Step 5: Convert to final allocations with nights
  const finalAllocations: CityAllocation[] = allocations.map((alloc, idx) => {
    // Calculate nights: generally nights = days for all but last city
    // Last city has days but 0 nights (departure day)
    const isLastCity = idx === allocations.length - 1;
    const nights = isLastCity
      ? Math.max(0, Math.round(alloc.days) - 1)
      : Math.round(alloc.days);

    return {
      cityId: alloc.city.id,
      cityName: alloc.city.name,
      days: Math.round(alloc.days * 10) / 10, // Round to 1 decimal
      nights,
      importanceScore: alloc.score,
      scoreBreakdown: alloc.breakdown,
    };
  });

  // Calculate stats
  const dayValues = finalAllocations.map((a) => a.days);
  const totalNights = finalAllocations.reduce((sum, a) => sum + a.nights, 0);

  return {
    allocations: finalAllocations,
    totalDays,
    totalNights,
    stats: {
      avgDaysPerCity: totalDays / cities.length,
      minDays: Math.min(...dayValues),
      maxDays: Math.max(...dayValues),
      pace,
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick allocation without detailed scoring
 * For simpler use cases where detailed breakdown isn't needed
 */
export function quickAllocate(
  cityCount: number,
  totalDays: number,
  pace: TripPace = 'balanced'
): number[] {
  if (cityCount === 0) return [];
  if (cityCount === 1) return [totalDays];

  const paceMultiplier = PACE_MULTIPLIERS[pace];
  const basePerCity = totalDays / cityCount;

  // Simple even distribution with pace adjustment
  // Pace affects how much buffer we leave (more buffer = fewer activities per day)
  const adjusted = basePerCity * paceMultiplier;
  const minDays = 0.5;

  let allocations = new Array(cityCount).fill(Math.max(minDays, adjusted));

  // Normalize
  const total = allocations.reduce((a, b) => a + b, 0);
  const factor = totalDays / total;
  allocations = allocations.map((d) => Math.max(minDays, d * factor));

  // Round to reasonable values
  return allocations.map((d) => Math.round(d * 2) / 2); // Round to 0.5
}

/**
 * Suggest number of cities based on total days and pace
 */
export function suggestCityCount(
  totalDays: number,
  pace: TripPace = 'balanced'
): { min: number; recommended: number; max: number } {
  // Base days per city by pace
  const daysPerCity: Record<TripPace, { min: number; ideal: number; max: number }> = {
    relaxed: { min: 3, ideal: 4, max: 5 },
    balanced: { min: 2, ideal: 3, max: 4 },
    packed: { min: 1, ideal: 2, max: 3 },
  };

  const paceConfig = daysPerCity[pace];

  return {
    min: Math.max(1, Math.floor(totalDays / paceConfig.max)),
    recommended: Math.max(1, Math.round(totalDays / paceConfig.ideal)),
    max: Math.max(1, Math.ceil(totalDays / paceConfig.min)),
  };
}

/**
 * Validate allocation result
 */
export function validateAllocation(
  result: AllocationResult,
  expectedTotalDays: number
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check total days
  const actualTotal = result.allocations.reduce((sum, a) => sum + a.days, 0);
  if (Math.abs(actualTotal - expectedTotalDays) > 0.5) {
    issues.push(
      `Total days mismatch: expected ${expectedTotalDays}, got ${actualTotal.toFixed(1)}`
    );
  }

  // Check for negative allocations
  result.allocations.forEach((alloc) => {
    if (alloc.days < 0) {
      issues.push(`Negative days for ${alloc.cityName}: ${alloc.days}`);
    }
    if (alloc.nights < 0) {
      issues.push(`Negative nights for ${alloc.cityName}: ${alloc.nights}`);
    }
  });

  // Check for unreasonably small allocations
  result.allocations.forEach((alloc) => {
    if (alloc.days > 0 && alloc.days < 0.25) {
      issues.push(
        `Very small allocation for ${alloc.cityName}: ${alloc.days} days`
      );
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Format allocation for display
 */
export function formatAllocation(alloc: CityAllocation): string {
  const daysStr = alloc.days === 1 ? '1 day' : `${alloc.days} days`;
  const nightsStr = alloc.nights === 1 ? '1 night' : `${alloc.nights} nights`;
  return `${alloc.cityName}: ${daysStr} (${nightsStr})`;
}

/**
 * Get allocation summary as text
 */
export function formatAllocationSummary(result: AllocationResult): string {
  const lines = [
    `Trip: ${result.totalDays} days, ${result.totalNights} nights`,
    `Pace: ${result.stats.pace}`,
    '',
    'Cities:',
    ...result.allocations.map((a) => `  - ${formatAllocation(a)}`),
  ];
  return lines.join('\n');
}
