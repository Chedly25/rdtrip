/**
 * Preference Operations
 *
 * WI-4.1: Helper functions for working with preferences
 *
 * Key Operations:
 * - Update individual preferences with source tracking
 * - Merge preferences from different sources
 * - Calculate overall confidence
 * - Serialize/deserialize for storage
 */

import {
  type UserPreferences,
  type PreferenceValue,
  type PreferenceSource,
  type PreferenceSources,
  type InterestCategories,
  type InterestStrength,
  type SpecificInterest,
  type Avoidance,
  type TripPace,
  type BudgetLevel,
  type DiningStyle,
  type AccommodationStyle,
} from './types';

// ============================================================================
// Source Priority
// ============================================================================

/**
 * Source priority for conflict resolution
 * Higher number = higher priority
 */
const SOURCE_PRIORITY: Record<PreferenceSource, number> = {
  stated: 3,    // User explicitly said - highest priority
  historical: 2, // From past trips - medium priority
  observed: 1,   // Inferred from behaviour - lowest priority
};

/**
 * Get the highest priority source from a PreferenceSources object
 */
export function getHighestPrioritySource(sources: PreferenceSources): PreferenceSource | null {
  let highestSource: PreferenceSource | null = null;
  let highestPriority = 0;

  if (sources.stated && SOURCE_PRIORITY.stated > highestPriority) {
    highestSource = 'stated';
    highestPriority = SOURCE_PRIORITY.stated;
  }
  if (sources.historical && SOURCE_PRIORITY.historical > highestPriority) {
    highestSource = 'historical';
    highestPriority = SOURCE_PRIORITY.historical;
  }
  if (sources.observed && SOURCE_PRIORITY.observed > highestPriority) {
    highestSource = 'observed';
    highestPriority = SOURCE_PRIORITY.observed;
  }

  return highestSource;
}

// ============================================================================
// Update Preference Value
// ============================================================================

/**
 * Update a preference value with new data
 * Handles source tracking and confidence updates
 */
export function updatePreferenceValue<T>(
  current: PreferenceValue<T>,
  newValue: T,
  source: PreferenceSource,
  confidence: number,
  reason?: string
): PreferenceValue<T> {
  const now = new Date();

  // Determine if we should override the current value
  // Higher priority sources always win
  const currentHighestSource = getHighestPrioritySource(current.sources);
  const shouldOverride =
    currentHighestSource === null ||
    SOURCE_PRIORITY[source] >= SOURCE_PRIORITY[currentHighestSource];

  return {
    value: shouldOverride ? newValue : current.value,
    confidence: shouldOverride
      ? Math.max(0, Math.min(1, confidence))
      : current.confidence,
    sources: {
      stated: current.sources.stated || source === 'stated',
      observed: current.sources.observed || source === 'observed',
      historical: current.sources.historical || source === 'historical',
      lastUpdated: {
        ...current.sources.lastUpdated,
        [source]: now,
      },
    },
    updatedAt: now,
    reason: shouldOverride ? reason : current.reason,
  };
}

// ============================================================================
// Interest Operations
// ============================================================================

/**
 * Update a single interest category
 */
export function updateInterestCategory(
  preferences: UserPreferences,
  category: keyof InterestCategories,
  strength: InterestStrength,
  source: PreferenceSource,
  confidence: number = 0.7
): UserPreferences {
  const now = new Date();
  const currentInterests = { ...preferences.interests.value };
  currentInterests[category] = Math.max(0, Math.min(1, strength));

  return {
    ...preferences,
    interests: updatePreferenceValue(
      preferences.interests,
      currentInterests,
      source,
      confidence
    ),
    sources: {
      ...preferences.sources,
      hasStated: preferences.sources.hasStated || source === 'stated',
      hasObserved: preferences.sources.hasObserved || source === 'observed',
      hasHistorical: preferences.sources.hasHistorical || source === 'historical',
    },
    updatedAt: now,
  };
}

/**
 * Adjust interest by delta (positive or negative)
 * Useful for observed preferences that accumulate
 */
export function adjustInterest(
  preferences: UserPreferences,
  category: keyof InterestCategories,
  delta: number,
  source: PreferenceSource
): UserPreferences {
  const currentStrength = preferences.interests.value[category];
  const newStrength = Math.max(0, Math.min(1, currentStrength + delta));

  // Confidence is lower for adjustments than explicit settings
  const confidence = Math.min(0.6, preferences.interests.confidence + 0.1);

  return updateInterestCategory(preferences, category, newStrength, source, confidence);
}

/**
 * Add a specific interest tag
 */
export function addSpecificInterest(
  preferences: UserPreferences,
  tag: string,
  source: PreferenceSource,
  confidence: number = 0.7,
  category?: keyof InterestCategories
): UserPreferences {
  const now = new Date();
  const normalizedTag = tag.toLowerCase().trim();

  // Check if already exists
  const existingIndex = preferences.specificInterests.findIndex(
    (i) => i.tag.toLowerCase() === normalizedTag
  );

  let specificInterests: SpecificInterest[];

  if (existingIndex >= 0) {
    // Update existing
    specificInterests = [...preferences.specificInterests];
    const existing = specificInterests[existingIndex];

    // Only update if new source has higher or equal priority
    if (SOURCE_PRIORITY[source] >= SOURCE_PRIORITY[existing.source]) {
      specificInterests[existingIndex] = {
        ...existing,
        confidence: Math.max(existing.confidence, confidence),
        source,
        addedAt: now,
        category: category || existing.category,
      };
    }
  } else {
    // Add new
    specificInterests = [
      ...preferences.specificInterests,
      {
        tag: normalizedTag,
        confidence,
        source,
        addedAt: now,
        category,
      },
    ];
  }

  return {
    ...preferences,
    specificInterests,
    sources: {
      ...preferences.sources,
      hasStated: preferences.sources.hasStated || source === 'stated',
      hasObserved: preferences.sources.hasObserved || source === 'observed',
      hasHistorical: preferences.sources.hasHistorical || source === 'historical',
    },
    updatedAt: now,
  };
}

/**
 * Remove a specific interest
 */
export function removeSpecificInterest(
  preferences: UserPreferences,
  tag: string
): UserPreferences {
  const normalizedTag = tag.toLowerCase().trim();
  return {
    ...preferences,
    specificInterests: preferences.specificInterests.filter(
      (i) => i.tag.toLowerCase() !== normalizedTag
    ),
    updatedAt: new Date(),
  };
}

// ============================================================================
// Avoidance Operations
// ============================================================================

/**
 * Add an avoidance
 */
export function addAvoidance(
  preferences: UserPreferences,
  tag: string,
  source: PreferenceSource,
  strength: number = 0.7,
  reason?: string
): UserPreferences {
  const now = new Date();
  const normalizedTag = tag.toLowerCase().trim();

  // Check if already exists
  const existingIndex = preferences.avoidances.findIndex(
    (a) => a.tag.toLowerCase() === normalizedTag
  );

  let avoidances: Avoidance[];

  if (existingIndex >= 0) {
    // Update existing
    avoidances = [...preferences.avoidances];
    const existing = avoidances[existingIndex];

    if (SOURCE_PRIORITY[source] >= SOURCE_PRIORITY[existing.source]) {
      avoidances[existingIndex] = {
        ...existing,
        strength: Math.max(existing.strength, strength),
        source,
        addedAt: now,
        reason: reason || existing.reason,
      };
    }
  } else {
    // Add new
    avoidances = [
      ...preferences.avoidances,
      {
        tag: normalizedTag,
        strength,
        source,
        addedAt: now,
        reason,
      },
    ];
  }

  return {
    ...preferences,
    avoidances,
    sources: {
      ...preferences.sources,
      hasStated: preferences.sources.hasStated || source === 'stated',
      hasObserved: preferences.sources.hasObserved || source === 'observed',
      hasHistorical: preferences.sources.hasHistorical || source === 'historical',
    },
    updatedAt: now,
  };
}

/**
 * Remove an avoidance
 */
export function removeAvoidance(
  preferences: UserPreferences,
  tag: string
): UserPreferences {
  const normalizedTag = tag.toLowerCase().trim();
  return {
    ...preferences,
    avoidances: preferences.avoidances.filter(
      (a) => a.tag.toLowerCase() !== normalizedTag
    ),
    updatedAt: new Date(),
  };
}

// ============================================================================
// Dietary & Accessibility Operations
// ============================================================================

/**
 * Add a dietary requirement
 */
export function addDietaryRequirement(
  preferences: UserPreferences,
  tag: string,
  isStrict: boolean,
  source: PreferenceSource
): UserPreferences {
  const now = new Date();
  const normalizedTag = tag.toLowerCase().trim();

  // Check if already exists
  if (preferences.dietaryRequirements.some((d) => d.tag.toLowerCase() === normalizedTag)) {
    return preferences;
  }

  return {
    ...preferences,
    dietaryRequirements: [
      ...preferences.dietaryRequirements,
      { tag: normalizedTag, isStrict, source, addedAt: now },
    ],
    sources: {
      ...preferences.sources,
      hasStated: preferences.sources.hasStated || source === 'stated',
    },
    updatedAt: now,
  };
}

/**
 * Add an accessibility need
 */
export function addAccessibilityNeed(
  preferences: UserPreferences,
  tag: string,
  source: PreferenceSource,
  details?: string
): UserPreferences {
  const now = new Date();
  const normalizedTag = tag.toLowerCase().trim();

  // Check if already exists
  if (preferences.accessibilityNeeds.some((a) => a.tag.toLowerCase() === normalizedTag)) {
    return preferences;
  }

  return {
    ...preferences,
    accessibilityNeeds: [
      ...preferences.accessibilityNeeds,
      { tag: normalizedTag, details, source, addedAt: now },
    ],
    sources: {
      ...preferences.sources,
      hasStated: preferences.sources.hasStated || source === 'stated',
    },
    updatedAt: now,
  };
}

// ============================================================================
// General Preference Updates
// ============================================================================

/**
 * Update pace preference
 */
export function updatePace(
  preferences: UserPreferences,
  pace: TripPace,
  source: PreferenceSource,
  confidence: number = 0.7
): UserPreferences {
  return {
    ...preferences,
    pace: updatePreferenceValue(preferences.pace, pace, source, confidence),
    updatedAt: new Date(),
  };
}

/**
 * Update budget preference
 */
export function updateBudget(
  preferences: UserPreferences,
  budget: BudgetLevel,
  source: PreferenceSource,
  confidence: number = 0.7
): UserPreferences {
  return {
    ...preferences,
    budget: updatePreferenceValue(preferences.budget, budget, source, confidence),
    updatedAt: new Date(),
  };
}

/**
 * Update dining style
 */
export function updateDiningStyle(
  preferences: UserPreferences,
  style: DiningStyle,
  source: PreferenceSource,
  confidence: number = 0.7
): UserPreferences {
  return {
    ...preferences,
    diningStyle: updatePreferenceValue(preferences.diningStyle, style, source, confidence),
    updatedAt: new Date(),
  };
}

/**
 * Update accommodation style
 */
export function updateAccommodationStyle(
  preferences: UserPreferences,
  style: AccommodationStyle,
  source: PreferenceSource,
  confidence: number = 0.7
): UserPreferences {
  return {
    ...preferences,
    accommodationStyle: updatePreferenceValue(preferences.accommodationStyle, style, source, confidence),
    updatedAt: new Date(),
  };
}

/**
 * Update hidden gems preference
 */
export function updatePrefersHiddenGems(
  preferences: UserPreferences,
  prefers: boolean,
  source: PreferenceSource,
  confidence: number = 0.7
): UserPreferences {
  return {
    ...preferences,
    prefersHiddenGems: updatePreferenceValue(preferences.prefersHiddenGems, prefers, source, confidence),
    updatedAt: new Date(),
  };
}

// ============================================================================
// Merge Preferences
// ============================================================================

/**
 * Merge two preference profiles
 * Used when combining stated + observed + historical
 *
 * Priority: stated > historical > observed
 */
export function mergePreferences(
  base: UserPreferences,
  overlay: UserPreferences
): UserPreferences {
  const now = new Date();

  // Helper to merge preference values
  const mergeValue = <T>(
    baseVal: PreferenceValue<T>,
    overlayVal: PreferenceValue<T>
  ): PreferenceValue<T> => {
    const baseSource = getHighestPrioritySource(baseVal.sources);
    const overlaySource = getHighestPrioritySource(overlayVal.sources);

    // If overlay has higher priority source, use it
    if (
      overlaySource &&
      (!baseSource || SOURCE_PRIORITY[overlaySource] > SOURCE_PRIORITY[baseSource])
    ) {
      return {
        value: overlayVal.value,
        confidence: overlayVal.confidence,
        sources: {
          stated: baseVal.sources.stated || overlayVal.sources.stated,
          observed: baseVal.sources.observed || overlayVal.sources.observed,
          historical: baseVal.sources.historical || overlayVal.sources.historical,
          lastUpdated: {
            ...baseVal.sources.lastUpdated,
            ...overlayVal.sources.lastUpdated,
          },
        },
        updatedAt: now,
        reason: overlayVal.reason || baseVal.reason,
      };
    }

    // Keep base value but merge sources
    return {
      ...baseVal,
      sources: {
        stated: baseVal.sources.stated || overlayVal.sources.stated,
        observed: baseVal.sources.observed || overlayVal.sources.observed,
        historical: baseVal.sources.historical || overlayVal.sources.historical,
        lastUpdated: {
          ...baseVal.sources.lastUpdated,
          ...overlayVal.sources.lastUpdated,
        },
      },
      updatedAt: now,
    };
  };

  // Merge specific interests (deduplicate by tag)
  const mergedSpecificInterests = [...base.specificInterests];
  for (const interest of overlay.specificInterests) {
    const existingIdx = mergedSpecificInterests.findIndex(
      (i) => i.tag.toLowerCase() === interest.tag.toLowerCase()
    );
    if (existingIdx >= 0) {
      const existing = mergedSpecificInterests[existingIdx];
      if (SOURCE_PRIORITY[interest.source] >= SOURCE_PRIORITY[existing.source]) {
        mergedSpecificInterests[existingIdx] = interest;
      }
    } else {
      mergedSpecificInterests.push(interest);
    }
  }

  // Merge avoidances (deduplicate by tag)
  const mergedAvoidances = [...base.avoidances];
  for (const avoidance of overlay.avoidances) {
    const existingIdx = mergedAvoidances.findIndex(
      (a) => a.tag.toLowerCase() === avoidance.tag.toLowerCase()
    );
    if (existingIdx >= 0) {
      const existing = mergedAvoidances[existingIdx];
      if (SOURCE_PRIORITY[avoidance.source] >= SOURCE_PRIORITY[existing.source]) {
        mergedAvoidances[existingIdx] = avoidance;
      }
    } else {
      mergedAvoidances.push(avoidance);
    }
  }

  // Merge dietary requirements (unique tags)
  const dietaryTags = new Set(base.dietaryRequirements.map((d) => d.tag.toLowerCase()));
  const mergedDietary = [...base.dietaryRequirements];
  for (const req of overlay.dietaryRequirements) {
    if (!dietaryTags.has(req.tag.toLowerCase())) {
      mergedDietary.push(req);
      dietaryTags.add(req.tag.toLowerCase());
    }
  }

  // Merge accessibility needs (unique tags)
  const accessibilityTags = new Set(base.accessibilityNeeds.map((a) => a.tag.toLowerCase()));
  const mergedAccessibility = [...base.accessibilityNeeds];
  for (const need of overlay.accessibilityNeeds) {
    if (!accessibilityTags.has(need.tag.toLowerCase())) {
      mergedAccessibility.push(need);
      accessibilityTags.add(need.tag.toLowerCase());
    }
  }

  return {
    ...base,
    interests: mergeValue(base.interests, overlay.interests),
    specificInterests: mergedSpecificInterests,
    prefersHiddenGems: mergeValue(base.prefersHiddenGems, overlay.prefersHiddenGems),
    avoidances: mergedAvoidances,
    pace: mergeValue(base.pace, overlay.pace),
    timePreference: mergeValue(base.timePreference, overlay.timePreference),
    crowdPreference: mergeValue(base.crowdPreference, overlay.crowdPreference),
    budget: mergeValue(base.budget, overlay.budget),
    diningStyle: mergeValue(base.diningStyle, overlay.diningStyle),
    dietaryRequirements: mergedDietary,
    accommodationStyle: mergeValue(base.accommodationStyle, overlay.accommodationStyle),
    accessibilityNeeds: mergedAccessibility,
    sources: {
      hasStated: base.sources.hasStated || overlay.sources.hasStated,
      hasObserved: base.sources.hasObserved || overlay.sources.hasObserved,
      hasHistorical: base.sources.hasHistorical || overlay.sources.hasHistorical,
    },
    updatedAt: now,
  };
}

// ============================================================================
// Confidence Calculation
// ============================================================================

/**
 * Calculate overall confidence based on all preference data
 */
export function calculateOverallConfidence(preferences: UserPreferences): number {
  const confidenceScores: number[] = [];

  // Collect all confidence values
  confidenceScores.push(preferences.interests.confidence);
  confidenceScores.push(preferences.prefersHiddenGems.confidence);
  confidenceScores.push(preferences.pace.confidence);
  confidenceScores.push(preferences.budget.confidence);
  confidenceScores.push(preferences.diningStyle.confidence);
  confidenceScores.push(preferences.accommodationStyle.confidence);
  confidenceScores.push(preferences.timePreference.confidence);
  confidenceScores.push(preferences.crowdPreference.confidence);

  // Bonus for having specific data
  if (preferences.specificInterests.length > 0) {
    confidenceScores.push(0.6 + preferences.specificInterests.length * 0.1);
  }
  if (preferences.avoidances.length > 0) {
    confidenceScores.push(0.6 + preferences.avoidances.length * 0.1);
  }
  if (preferences.dietaryRequirements.length > 0) {
    confidenceScores.push(0.8); // Dietary is usually stated explicitly
  }
  if (preferences.accessibilityNeeds.length > 0) {
    confidenceScores.push(0.9); // Accessibility is always stated
  }

  // Bonus for stated preferences
  if (preferences.sources.hasStated) {
    confidenceScores.push(0.7);
  }
  if (preferences.sources.hasHistorical) {
    confidenceScores.push(0.5);
  }

  // Calculate weighted average
  if (confidenceScores.length === 0) return 0;

  const sum = confidenceScores.reduce((a, b) => a + b, 0);
  return Math.min(1, sum / confidenceScores.length);
}

/**
 * Update the overall confidence of a preferences object
 */
export function updateOverallConfidence(preferences: UserPreferences): UserPreferences {
  return {
    ...preferences,
    overallConfidence: calculateOverallConfidence(preferences),
  };
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serialize preferences for storage
 * Converts Dates to ISO strings
 */
export function serializePreferences(preferences: UserPreferences): string {
  return JSON.stringify(preferences, (_key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  });
}

/**
 * Deserialize preferences from storage
 * Converts ISO strings back to Dates
 */
export function deserializePreferences(json: string): UserPreferences {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  });
}

// ============================================================================
// Summary Generation
// ============================================================================

/**
 * Generate a human-readable summary of preferences
 * Useful for AI context
 */
export function generatePreferenceSummary(preferences: UserPreferences): string {
  const lines: string[] = [];

  // Top interests
  const interests = preferences.interests.value;
  const topInterests = Object.entries(interests)
    .filter(([_, strength]) => strength > 0.6)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);

  if (topInterests.length > 0) {
    lines.push(`Strong interests: ${topInterests.join(', ')}`);
  }

  // Specific interests
  if (preferences.specificInterests.length > 0) {
    const tags = preferences.specificInterests
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((i) => i.tag);
    lines.push(`Specific interests: ${tags.join(', ')}`);
  }

  // Avoidances
  if (preferences.avoidances.length > 0) {
    const tags = preferences.avoidances.map((a) => a.tag);
    lines.push(`Wants to avoid: ${tags.join(', ')}`);
  }

  // Travel style
  lines.push(`Pace: ${preferences.pace.value}`);
  lines.push(`Budget: ${preferences.budget.value}`);

  if (preferences.prefersHiddenGems.value && preferences.prefersHiddenGems.confidence > 0.5) {
    lines.push('Prefers hidden gems over tourist spots');
  }

  // Dietary
  if (preferences.dietaryRequirements.length > 0) {
    const reqs = preferences.dietaryRequirements.map((d) =>
      d.isStrict ? `${d.tag} (strict)` : d.tag
    );
    lines.push(`Dietary: ${reqs.join(', ')}`);
  }

  // Accessibility
  if (preferences.accessibilityNeeds.length > 0) {
    const needs = preferences.accessibilityNeeds.map((a) => a.tag);
    lines.push(`Accessibility needs: ${needs.join(', ')}`);
  }

  return lines.join('\n');
}
