/**
 * TripBrain Core Service
 *
 * WI-6.2: Main orchestrator for the Trip Brain intelligence system
 *
 * The TripBrain service is the central intelligence layer that powers
 * the active trip companion. It takes raw itinerary data and provides
 * contextually-aware recommendations.
 *
 * Architecture:
 * - Singleton-ish pattern (one instance per trip)
 * - Event-based state updates for React integration
 * - Pluggable filters and scorers (to be added in WI-6.3-6.7)
 * - Designed to work with TripBrainProvider (WI-6.9)
 *
 * Key Responsibilities:
 * - Load and manage trip data
 * - Track user location and context
 * - Score and rank activities
 * - Generate "Why Now" recommendations
 * - Handle user choices and skips
 * - Support craving search and serendipity
 */

import {
  DEFAULT_TRIP_BRAIN_CONFIG,
  getTimePeriod,
  type TripBrainState,
  type TripBrainConfig,
  type EnrichedActivity,
  type LocationContext,
  type WeatherContext,
  type RecommendationScore,
  type SkipReason,
  type GetRecommendationsOptions,
  type CravingSearchOptions,
  type CravingSearchResult,
  type SerendipityResult,
  type CrossTripMemory,
} from './types';
import {
  isActivityTimeAppropriate as isTimeAppropriateFilter,
  getTimeScore,
} from './filters/timeFilter';
import {
  calculateDistance,
  formatDistance,
  estimateWalkingTime,
  getDistanceScore,
  generateDistanceWhyNow as generateDistanceReason,
} from './filters/locationFilter';
import {
  getPreferenceScoreResult,
  generatePreferenceReason,
} from './scoring/preferenceScorer';
import {
  createRecommendationScore,
  type ScoreInputs,
  type ScoreContext,
  type ScoreReasons,
} from './scoring/combinedScorer';
import type {
  Itinerary,
  PlaceActivity,
  ItineraryActivity,
} from '../itinerary';
import type { UserPreferences } from '../preferences';

// ============================================================================
// Event System
// ============================================================================

/**
 * Events emitted by TripBrain for state synchronization
 */
export type TripBrainEvent =
  | { type: 'state_changed'; state: TripBrainState }
  | { type: 'activity_completed'; activityId: string }
  | { type: 'activity_skipped'; activityId: string; reason?: string }
  | { type: 'location_updated'; location: LocationContext }
  | { type: 'weather_updated'; weather: WeatherContext }
  | { type: 'recommendations_updated'; recommendations: EnrichedActivity[] }
  | { type: 'error'; error: string };

export type TripBrainEventListener = (event: TripBrainEvent) => void;

// ============================================================================
// TripBrain Class
// ============================================================================

export class TripBrain {
  // ==================== Private State ====================
  private _itinerary: Itinerary | null = null;
  private _userLocation: LocationContext | null = null;
  private _weather: WeatherContext | null = null;
  private _preferences: UserPreferences | null = null;
  private _memory: CrossTripMemory | null = null;
  private _completedIds: Set<string> = new Set();
  private _skippedActivities: Map<string, SkipReason> = new Map();
  private _config: TripBrainConfig;
  private _sessionId: string;
  private _isLoading: boolean = false;
  private _error: string | null = null;
  private _listeners: Set<TripBrainEventListener> = new Set();
  private _enrichedCache: Map<string, EnrichedActivity> = new Map();
  private _lastEnrichmentTime: Date | null = null;

  // ==================== Constructor ====================
  constructor(config: Partial<TripBrainConfig> = {}) {
    this._config = {
      ...DEFAULT_TRIP_BRAIN_CONFIG,
      ...config,
    };
    this._sessionId = `tb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== Event System ====================

  /**
   * Subscribe to TripBrain events
   */
  subscribe(listener: TripBrainEventListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: TripBrainEvent): void {
    this._listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('TripBrain event listener error:', err);
      }
    });
  }

  /**
   * Emit state changed event
   */
  private emitStateChanged(): void {
    this.emit({ type: 'state_changed', state: this.getState() });
  }

  // ==================== State Getters ====================

  /**
   * Get current TripBrain state
   */
  getState(): TripBrainState {
    return {
      itinerary: this._itinerary,
      isLoading: this._isLoading,
      error: this._error,
      userLocation: this._userLocation,
      weather: this._weather,
      preferences: this._preferences,
      memory: this._memory,
      completedActivityIds: new Set(this._completedIds),
      skippedActivities: new Map(this._skippedActivities),
      currentTimePeriod: getTimePeriod(new Date().getHours()),
      lastUpdated: new Date(),
      sessionId: this._sessionId,
    };
  }

  /**
   * Check if TripBrain has data loaded
   */
  get isReady(): boolean {
    return this._itinerary !== null && !this._isLoading;
  }

  /**
   * Get current itinerary
   */
  get itinerary(): Itinerary | null {
    return this._itinerary;
  }

  /**
   * Get user location
   */
  get userLocation(): LocationContext | null {
    return this._userLocation;
  }

  /**
   * Get current weather
   */
  get weather(): WeatherContext | null {
    return this._weather;
  }

  /**
   * Get user preferences
   */
  get preferences(): UserPreferences | null {
    return this._preferences;
  }

  // ==================== Data Loading ====================

  /**
   * Load trip data from an itinerary
   */
  async loadTripData(
    itinerary: Itinerary,
    preferences?: UserPreferences,
    memory?: CrossTripMemory
  ): Promise<void> {
    this._isLoading = true;
    this._error = null;
    this.emitStateChanged();

    try {
      this._itinerary = itinerary;
      this._preferences = preferences || null;
      this._memory = memory || null;

      // Clear caches
      this._enrichedCache.clear();
      this._lastEnrichmentTime = null;

      // Load any persisted state (completed/skipped) from storage
      await this.loadPersistedState(itinerary.id);

      this._isLoading = false;
      this.emitStateChanged();
    } catch (err) {
      this._error = err instanceof Error ? err.message : 'Failed to load trip data';
      this._isLoading = false;
      this.emit({ type: 'error', error: this._error });
      this.emitStateChanged();
    }
  }

  /**
   * Load persisted state from storage
   */
  private async loadPersistedState(tripId: string): Promise<void> {
    try {
      const key = `tripbrain_state_${tripId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.completedIds) {
          this._completedIds = new Set(data.completedIds);
        }
        if (data.skippedActivities) {
          this._skippedActivities = new Map(
            Object.entries(data.skippedActivities).map(([id, reason]) => [
              id,
              {
                ...(reason as SkipReason),
                skippedAt: new Date((reason as SkipReason).skippedAt),
              },
            ])
          );
        }
      }
    } catch (err) {
      console.warn('Failed to load persisted TripBrain state:', err);
    }
  }

  /**
   * Persist state to storage
   */
  private persistState(): void {
    if (!this._itinerary) return;

    try {
      const key = `tripbrain_state_${this._itinerary.id}`;
      const data = {
        completedIds: Array.from(this._completedIds),
        skippedActivities: Object.fromEntries(this._skippedActivities),
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to persist TripBrain state:', err);
    }
  }

  // ==================== Location & Weather Updates ====================

  /**
   * Update user location
   */
  updateLocation(location: LocationContext): void {
    this._userLocation = location;
    this._enrichedCache.clear(); // Invalidate cache since distances changed
    this.emit({ type: 'location_updated', location });
    this.emitStateChanged();
  }

  /**
   * Update weather context
   */
  updateWeather(weather: WeatherContext): void {
    this._weather = weather;
    this.emit({ type: 'weather_updated', weather });
    this.emitStateChanged();
  }

  /**
   * Update preferences
   */
  updatePreferences(preferences: UserPreferences): void {
    this._preferences = preferences;
    this._enrichedCache.clear(); // Invalidate cache since scoring changed
    this.emitStateChanged();
  }

  // ==================== Activity Tracking ====================

  /**
   * Record that user chose an activity
   */
  recordChoice(activityId: string): void {
    // Remove from skipped if it was there
    this._skippedActivities.delete(activityId);

    // Note: We don't add to completed until they actually finish
    // This is for tracking that they selected it
    this.persistState();
    this.emitStateChanged();
  }

  /**
   * Record that user completed an activity
   */
  recordCompletion(activityId: string): void {
    this._completedIds.add(activityId);
    this._skippedActivities.delete(activityId);
    this.persistState();
    this.emit({ type: 'activity_completed', activityId });
    this.emitStateChanged();
  }

  /**
   * Record that user skipped an activity
   */
  recordSkip(activityId: string, reason?: string, category?: SkipReason['category']): void {
    const skipReason: SkipReason = {
      skippedAt: new Date(),
      reason,
      category,
    };
    this._skippedActivities.set(activityId, skipReason);
    this.persistState();
    this.emit({ type: 'activity_skipped', activityId, reason });
    this.emitStateChanged();
  }

  /**
   * Undo a skip
   */
  undoSkip(activityId: string): void {
    this._skippedActivities.delete(activityId);
    this.persistState();
    this.emitStateChanged();
  }

  /**
   * Undo a completion
   */
  undoCompletion(activityId: string): void {
    this._completedIds.delete(activityId);
    this.persistState();
    this.emitStateChanged();
  }

  // ==================== Activity Enrichment ====================

  /**
   * Get all place activities from the current day
   */
  private getCurrentDayActivities(): PlaceActivity[] {
    if (!this._itinerary) return [];

    const today = new Date();
    const todayStr = today.toDateString();

    // Find today's day in the itinerary
    const todayDay = this._itinerary.days.find(
      day => new Date(day.date).toDateString() === todayStr
    );

    if (!todayDay) {
      // If no exact match, return first day for demo purposes
      const firstDay = this._itinerary.days[0];
      if (!firstDay) return [];
      return this.extractPlaceActivities(firstDay);
    }

    return this.extractPlaceActivities(todayDay);
  }

  /**
   * Extract place activities from a day
   */
  private extractPlaceActivities(day: { slots: { morning: ItineraryActivity[]; afternoon: ItineraryActivity[]; evening: ItineraryActivity[] } }): PlaceActivity[] {
    const activities: PlaceActivity[] = [];

    for (const slot of ['morning', 'afternoon', 'evening'] as const) {
      for (const activity of day.slots[slot]) {
        if (activity.type === 'place') {
          activities.push(activity as PlaceActivity);
        }
      }
    }

    return activities;
  }

  /**
   * Enrich a single activity with scoring and context
   */
  private enrichActivity(activity: PlaceActivity): EnrichedActivity {
    // Check cache first
    const cacheKey = `${activity.id}_${this._userLocation?.coordinates.lat}_${this._userLocation?.coordinates.lng}`;
    const cached = this._enrichedCache.get(cacheKey);
    if (cached && this._lastEnrichmentTime) {
      const cacheAge = Date.now() - this._lastEnrichmentTime.getTime();
      if (cacheAge < this._config.enrichmentCacheDuration) {
        return cached;
      }
    }

    const now = new Date();
    const hour = now.getHours();

    // Calculate distance if we have location
    let distanceMeters: number | undefined;
    let distanceFormatted: string | undefined;
    let walkingTimeMinutes: number | undefined;

    if (this._userLocation && activity.place.coordinates) {
      distanceMeters = calculateDistance(
        this._userLocation.coordinates,
        activity.place.coordinates
      );
      distanceFormatted = formatDistance(distanceMeters);
      walkingTimeMinutes = estimateWalkingTime(distanceMeters);
    }

    // Calculate scores
    const score = this.calculateActivityScore(activity, distanceMeters);

    // Time appropriateness
    const isTimeAppropriate = isTimeAppropriateFilter(activity, hour);

    // Weather appropriateness (simple check for now)
    const isWeatherAppropriate = this.checkWeatherAppropriate(activity);

    // Opening status
    const openingInfo = this.getOpeningInfo(activity);

    // Check completion/skip status
    const isCompleted = this._completedIds.has(activity.id);
    const isSkipped = this._skippedActivities.has(activity.id);

    // Build tags for filtering
    const tags = this.buildActivityTags(activity);

    const enriched: EnrichedActivity = {
      activity,
      distanceMeters,
      distanceFormatted,
      walkingTimeMinutes,
      score,
      isTimeAppropriate,
      isWeatherAppropriate,
      isOpen: openingInfo?.status === 'open' || openingInfo?.status === 'closing_soon',
      openingInfo,
      isCompleted,
      isSkipped,
      tags,
      enrichedAt: now,
    };

    // Cache it
    this._enrichedCache.set(cacheKey, enriched);
    this._lastEnrichmentTime = now;

    return enriched;
  }

  /**
   * Calculate score for an activity
   * Uses WI-6.5 Preference Scorer and WI-6.6 Combined Scorer
   */
  private calculateActivityScore(
    activity: PlaceActivity,
    distanceMeters?: number
  ): RecommendationScore {
    const hour = new Date().getHours();

    // Get individual scores from specialized scorers
    const timeScore = getTimeScore(activity, hour);
    const distanceScore = getDistanceScore(distanceMeters);
    const preferenceResult = getPreferenceScoreResult(activity, this._preferences);
    const serendipityScore = activity.isHiddenGem ? 0.8 : 0.4;
    const ratingScore = activity.place.rating ? activity.place.rating / 5 : 0.5;
    const weatherScore = this.checkWeatherAppropriate(activity) ? 1 : 0.5;

    // Build score inputs for combined scorer
    const inputs: ScoreInputs = {
      time: timeScore,
      distance: distanceScore,
      preference: preferenceResult.score,
      serendipity: serendipityScore,
      rating: ratingScore,
      weather: weatherScore,
    };

    // Build context for confidence calculation
    const context: ScoreContext = {
      hasLocation: this._userLocation !== null,
      hasWeather: this._weather !== null,
      hasPreferences: this._preferences !== null,
      preferenceConfidence: preferenceResult.confidence,
      isHiddenGem: activity.isHiddenGem,
      activityRating: activity.place.rating,
      distanceMeters,
    };

    // Build reasons for each component
    const reasons: ScoreReasons = {
      time: timeScore > 0.5 ? 'Good time of day' : 'Not ideal timing',
      distance: distanceMeters ? generateDistanceReason(distanceMeters) : undefined,
      preference: generatePreferenceReason(preferenceResult) || (preferenceResult.score > 0.6 ? 'Matches your interests' : undefined),
      serendipity: activity.isHiddenGem ? 'Hidden gem discovery' : undefined,
      rating: activity.place.rating ? `${activity.place.rating} stars` : undefined,
      weather: weatherScore > 0.5 ? 'Weather appropriate' : 'Check weather',
    };

    // Use combined scorer to generate final recommendation score
    return createRecommendationScore(inputs, context, reasons, {
      mode: 'balanced',
      minimumScore: this._config.minimumScore,
      hiddenGemBoost: 0.1,
      missingDataPenalty: 0.1,
      normalizeWeights: true,
    });
  }

  /**
   * Check if activity is weather-appropriate
   */
  private checkWeatherAppropriate(activity: PlaceActivity): boolean {
    if (!this._weather) return true; // Assume appropriate if no weather data

    const isOutdoor =
      activity.place.category === 'nature' ||
      activity.place.category === 'activities';

    if (!isOutdoor) return true;

    // Check for bad weather
    const badConditions = ['rainy', 'stormy', 'snowy'];
    if (badConditions.includes(this._weather.condition)) {
      return false;
    }

    return true;
  }

  /**
   * Get opening info for an activity
   */
  private getOpeningInfo(_activity: PlaceActivity): EnrichedActivity['openingInfo'] {
    // Simplified implementation - full implementation would check actual hours
    const hour = new Date().getHours();

    // Most places closed late at night
    if (hour >= 22 || hour < 7) {
      return {
        status: 'closed',
        opensAt: '09:00',
      };
    }

    // Assume open during normal hours
    return {
      status: 'open',
      closesAt: '22:00',
    };
  }

  /**
   * Build tags for an activity
   */
  private buildActivityTags(activity: PlaceActivity): string[] {
    const tags: string[] = [activity.place.category];

    if (activity.isHiddenGem) tags.push('hidden-gem');
    if (activity.isFavourited) tags.push('favourited');
    if (activity.place.priceLevel !== undefined) {
      tags.push(`price-${activity.place.priceLevel}`);
    }

    return tags;
  }

  // ==================== Core Recommendation Methods ====================

  /**
   * Get recommended activities for the current context
   */
  getRecommendations(options: GetRecommendationsOptions = {}): EnrichedActivity[] {
    const {
      count = this._config.defaultRecommendationCount,
      mode = 'choice',
      category,
      includeCompleted = false,
      includeSkipped = false,
      minimumScore = this._config.minimumScore,
    } = options;

    if (!this._itinerary) return [];

    // Get today's activities
    let activities = this.getCurrentDayActivities();

    // Filter by category if specified
    if (category) {
      activities = activities.filter(a => a.place.category === category);
    }

    // Enrich all activities
    let enriched = activities.map(a => this.enrichActivity(a));

    // Filter out completed/skipped unless requested
    if (!includeCompleted) {
      enriched = enriched.filter(a => !a.isCompleted);
    }
    if (!includeSkipped) {
      enriched = enriched.filter(a => !a.isSkipped);
    }

    // Apply mode-specific filtering
    if (mode === 'choice') {
      // Only time-appropriate activities
      enriched = enriched.filter(a => a.isTimeAppropriate);
    } else if (mode === 'nearby') {
      // Only activities with distance data, sorted by proximity
      enriched = enriched
        .filter(a => a.distanceMeters !== undefined)
        .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    }

    // Filter by minimum score
    enriched = enriched.filter(a => a.score.score >= minimumScore);

    // Sort by score (descending)
    enriched.sort((a, b) => b.score.score - a.score.score);

    // Assign ranks
    enriched.forEach((activity, index) => {
      activity.score.rank = index + 1;
    });

    // Return requested count
    const result = enriched.slice(0, count);

    this.emit({ type: 'recommendations_updated', recommendations: result });
    return result;
  }

  /**
   * Search for activities matching a craving
   */
  searchCraving(options: CravingSearchOptions): CravingSearchResult {
    const {
      query,
      limit = 5,
      maxDistance,
      requireOpen = false,
    } = options;

    if (!this._itinerary) {
      return {
        results: [],
        query,
        totalMatches: 0,
        interpretation: 'No trip data loaded',
      };
    }

    const queryLower = query.toLowerCase();
    const activities = this.getCurrentDayActivities();

    // Filter by query match
    let matches = activities.filter(activity => {
      const name = activity.place.name.toLowerCase();
      const description = (activity.place.description || '').toLowerCase();
      const category = activity.place.category.toLowerCase();

      return (
        name.includes(queryLower) ||
        description.includes(queryLower) ||
        category.includes(queryLower)
      );
    });

    // Enrich matches
    let enriched = matches.map(a => this.enrichActivity(a));

    // Filter by distance if specified
    if (maxDistance !== undefined) {
      enriched = enriched.filter(
        a => a.distanceMeters !== undefined && a.distanceMeters <= maxDistance
      );
    }

    // Filter by open status if required
    if (requireOpen) {
      enriched = enriched.filter(a => a.isOpen);
    }

    // Sort by relevance (score)
    enriched.sort((a, b) => b.score.score - a.score.score);

    const totalMatches = enriched.length;
    const results = enriched.slice(0, limit);

    // Generate interpretation
    let interpretation: string | undefined;
    if (results.length === 0) {
      interpretation = `No matches found for "${query}"`;
    } else if (results.length === 1) {
      interpretation = `Found a great match for "${query}"`;
    } else {
      interpretation = `Found ${totalMatches} options for "${query}"`;
    }

    return {
      results,
      query,
      totalMatches,
      interpretation,
    };
  }

  /**
   * Get a serendipitous (surprise) recommendation
   */
  getSerendipity(): SerendipityResult | null {
    if (!this._itinerary) return null;

    const activities = this.getCurrentDayActivities();

    // Filter to hidden gems and non-completed activities
    const hiddenGems = activities.filter(
      a => a.isHiddenGem && !this._completedIds.has(a.id) && !this._skippedActivities.has(a.id)
    );

    if (hiddenGems.length === 0) {
      // Fall back to any non-completed activity
      const available = activities.filter(
        a => !this._completedIds.has(a.id) && !this._skippedActivities.has(a.id)
      );
      if (available.length === 0) return null;

      // Pick a random one
      const random = available[Math.floor(Math.random() * available.length)];
      const enriched = this.enrichActivity(random);

      return {
        activity: enriched,
        reason: 'Something different to try',
        serendipityScore: 0.5,
      };
    }

    // Pick a random hidden gem
    const gem = hiddenGems[Math.floor(Math.random() * hiddenGems.length)];
    const enriched = this.enrichActivity(gem);

    return {
      activity: enriched,
      reason: 'A hidden gem the locals love',
      serendipityScore: 0.9,
    };
  }

  // ==================== Utility Methods ====================

  /**
   * Get activities for a specific day
   */
  getActivitiesForDay(dayNumber: number): EnrichedActivity[] {
    if (!this._itinerary) return [];

    const day = this._itinerary.days.find(d => d.dayNumber === dayNumber);
    if (!day) return [];

    const activities = this.extractPlaceActivities(day);
    return activities.map(a => this.enrichActivity(a));
  }

  /**
   * Get completion statistics
   */
  getStats(): {
    total: number;
    completed: number;
    skipped: number;
    remaining: number;
    percentComplete: number;
  } {
    const activities = this.getCurrentDayActivities();
    const total = activities.length;
    const completed = activities.filter(a => this._completedIds.has(a.id)).length;
    const skipped = activities.filter(a => this._skippedActivities.has(a.id)).length;
    const remaining = total - completed - skipped;
    const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      skipped,
      remaining,
      percentComplete,
    };
  }

  /**
   * Reset all progress (for testing/debug)
   */
  resetProgress(): void {
    this._completedIds.clear();
    this._skippedActivities.clear();
    this._enrichedCache.clear();
    this.persistState();
    this.emitStateChanged();
  }

  /**
   * Destroy the TripBrain instance
   */
  destroy(): void {
    this._listeners.clear();
    this._enrichedCache.clear();
    this._itinerary = null;
    this._userLocation = null;
    this._weather = null;
    this._preferences = null;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new TripBrain instance
 */
export function createTripBrain(config?: Partial<TripBrainConfig>): TripBrain {
  return new TripBrain(config);
}

// ============================================================================
// Singleton Instance (optional usage)
// ============================================================================

let _defaultInstance: TripBrain | null = null;

/**
 * Get or create the default TripBrain instance
 */
export function getDefaultTripBrain(): TripBrain {
  if (!_defaultInstance) {
    _defaultInstance = new TripBrain();
  }
  return _defaultInstance;
}

/**
 * Reset the default TripBrain instance
 */
export function resetDefaultTripBrain(): void {
  if (_defaultInstance) {
    _defaultInstance.destroy();
    _defaultInstance = null;
  }
}
