/**
 * Preferences Data Model
 *
 * WI-4.1: Comprehensive preference structure for the Waycraft app
 *
 * Architecture Decisions:
 * - Unified model that consolidates existing preference types
 * - Every preference has confidence and source tracking
 * - Designed for extensibility (new categories can be added)
 * - Supports both trip-specific and global user preferences
 * - Numeric interests use 0-1 scale for weighted scoring
 *
 * Source Priority (for merge conflicts):
 * 1. Stated (explicit user input) - highest priority
 * 2. Historical (from past trips) - medium priority
 * 3. Observed (inferred from behaviour) - lowest priority
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * How a preference was determined
 */
export type PreferenceSource = 'stated' | 'observed' | 'historical';

/**
 * Track where a preference value came from
 */
export interface PreferenceSources {
  /** User explicitly stated this preference */
  stated: boolean;
  /** Inferred from user behaviour */
  observed: boolean;
  /** Derived from past trip data */
  historical: boolean;
  /** When each source last updated this */
  lastUpdated: {
    stated?: Date;
    observed?: Date;
    historical?: Date;
  };
}

/**
 * Wrapper for any preference value with metadata
 */
export interface PreferenceValue<T> {
  /** The actual preference value */
  value: T;
  /** Confidence in this preference (0-1) */
  confidence: number;
  /** Where this preference came from */
  sources: PreferenceSources;
  /** Last time this preference was updated */
  updatedAt: Date;
  /** Optional note about why this preference was set */
  reason?: string;
}

/**
 * Interest strength (0-1 scale)
 * 0 = no interest, 0.5 = neutral, 1 = strong interest
 */
export type InterestStrength = number;

/**
 * Create a default preference value
 */
export function createPreferenceValue<T>(
  value: T,
  source: PreferenceSource,
  confidence: number = 0.5,
  reason?: string
): PreferenceValue<T> {
  const now = new Date();
  return {
    value,
    confidence: Math.max(0, Math.min(1, confidence)),
    sources: {
      stated: source === 'stated',
      observed: source === 'observed',
      historical: source === 'historical',
      lastUpdated: {
        [source]: now,
      },
    },
    updatedAt: now,
    reason,
  };
}

// ============================================================================
// Interest Categories
// ============================================================================

/**
 * Broad interest categories with strength (0-1)
 */
export interface InterestCategories {
  /** Food, restaurants, culinary experiences */
  food: InterestStrength;
  /** Museums, history, architecture */
  culture: InterestStrength;
  /** Parks, hiking, outdoor activities */
  nature: InterestStrength;
  /** Bars, clubs, evening entertainment */
  nightlife: InterestStrength;
  /** Markets, boutiques, retail */
  shopping: InterestStrength;
  /** Active/thrilling experiences */
  adventure: InterestStrength;
  /** Spa, wellness, slow travel */
  relaxation: InterestStrength;
  /** Scenic spots, photography opportunities */
  photography: InterestStrength;
  /** Beaches, coastal activities */
  beach: InterestStrength;
  /** Local culture, off-beaten-path */
  localExperiences: InterestStrength;
}

/**
 * Default interest values (neutral)
 */
export function createDefaultInterests(): InterestCategories {
  return {
    food: 0.5,
    culture: 0.5,
    nature: 0.5,
    nightlife: 0.5,
    shopping: 0.5,
    adventure: 0.5,
    relaxation: 0.5,
    photography: 0.5,
    beach: 0.5,
    localExperiences: 0.5,
  };
}

// ============================================================================
// Specific Preferences
// ============================================================================

/**
 * Trip pace preference
 */
export type TripPace = 'relaxed' | 'balanced' | 'packed';

/**
 * Budget level preference
 */
export type BudgetLevel = 'budget' | 'moderate' | 'comfort' | 'luxury';

/**
 * Dining style preference
 */
export type DiningStyle = 'street_food' | 'casual' | 'mixed' | 'fine_dining';

/**
 * Accommodation style preference
 */
export type AccommodationStyle = 'budget' | 'comfortable' | 'luxury' | 'unique';

/**
 * Time of day preference for activities
 */
export type TimePreference = 'early_bird' | 'flexible' | 'late_riser';

/**
 * Crowd preference
 */
export type CrowdPreference = 'avoid_crowds' | 'dont_mind' | 'like_busy';

// ============================================================================
// Tagged Preferences (Lists)
// ============================================================================

/**
 * Specific interest tag (extracted from conversation)
 * More granular than broad categories
 */
export interface SpecificInterest {
  /** The interest (e.g., "wine", "street art", "local markets") */
  tag: string;
  /** Confidence in this interest (0-1) */
  confidence: number;
  /** How it was determined */
  source: PreferenceSource;
  /** When it was added */
  addedAt: Date;
  /** Related broad category */
  category?: keyof InterestCategories;
}

/**
 * Something to avoid
 */
export interface Avoidance {
  /** What to avoid (e.g., "crowded tourist spots", "hiking", "museums") */
  tag: string;
  /** How strongly to avoid (0-1) */
  strength: number;
  /** How it was determined */
  source: PreferenceSource;
  /** When it was added */
  addedAt: Date;
  /** Optional reason */
  reason?: string;
}

/**
 * Dietary requirement or restriction
 */
export interface DietaryRequirement {
  /** The requirement (e.g., "vegetarian", "gluten-free", "halal") */
  tag: string;
  /** Is this a strict requirement or preference */
  isStrict: boolean;
  /** How it was determined */
  source: PreferenceSource;
  /** When it was added */
  addedAt: Date;
}

/**
 * Accessibility need
 */
export interface AccessibilityNeed {
  /** The need (e.g., "wheelchair accessible", "limited walking", "hearing assistance") */
  tag: string;
  /** Additional details */
  details?: string;
  /** How it was determined */
  source: PreferenceSource;
  /** When it was added */
  addedAt: Date;
}

// ============================================================================
// Complete Preference Profile
// ============================================================================

/**
 * Complete user preferences
 */
export interface UserPreferences {
  /** Unique identifier */
  id: string;

  /** User this belongs to (null for anonymous/session) */
  userId: string | null;

  /** Trip this is specific to (null for global preferences) */
  tripId: string | null;

  // ==================== Interest Categories ====================
  /**
   * Broad interest categories (0-1 scale)
   * Higher values = more interested
   */
  interests: PreferenceValue<InterestCategories>;

  /**
   * Specific interests extracted from conversation
   * More granular than broad categories
   */
  specificInterests: SpecificInterest[];

  /**
   * Whether user prefers hidden gems over popular spots
   */
  prefersHiddenGems: PreferenceValue<boolean>;

  // ==================== Avoidances ====================
  /**
   * Things the user wants to avoid
   */
  avoidances: Avoidance[];

  // ==================== Trip Style ====================
  /**
   * Preferred pace of travel
   */
  pace: PreferenceValue<TripPace>;

  /**
   * Time of day preference for activities
   */
  timePreference: PreferenceValue<TimePreference>;

  /**
   * Crowd tolerance
   */
  crowdPreference: PreferenceValue<CrowdPreference>;

  // ==================== Budget ====================
  /**
   * Overall budget level
   */
  budget: PreferenceValue<BudgetLevel>;

  // ==================== Dining ====================
  /**
   * Dining style preference
   */
  diningStyle: PreferenceValue<DiningStyle>;

  /**
   * Dietary requirements and restrictions
   */
  dietaryRequirements: DietaryRequirement[];

  // ==================== Accommodation ====================
  /**
   * Accommodation style preference
   */
  accommodationStyle: PreferenceValue<AccommodationStyle>;

  // ==================== Accessibility ====================
  /**
   * Accessibility needs
   */
  accessibilityNeeds: AccessibilityNeed[];

  // ==================== Metadata ====================
  /**
   * Overall confidence in this preference profile (0-1)
   * Based on amount and quality of data
   */
  overallConfidence: number;

  /**
   * Aggregate source information
   */
  sources: {
    /** Has any stated preferences */
    hasStated: boolean;
    /** Has any observed preferences */
    hasObserved: boolean;
    /** Has any historical preferences */
    hasHistorical: boolean;
  };

  /**
   * Version for migration/updates
   */
  version: number;

  /**
   * When this profile was created
   */
  createdAt: Date;

  /**
   * When this profile was last updated
   */
  updatedAt: Date;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create empty preference value with default confidence
 */
export function createEmptyPreferenceValue<T>(
  defaultValue: T
): PreferenceValue<T> {
  return {
    value: defaultValue,
    confidence: 0,
    sources: {
      stated: false,
      observed: false,
      historical: false,
      lastUpdated: {},
    },
    updatedAt: new Date(),
  };
}

/**
 * Create a new empty user preferences object
 */
export function createEmptyPreferences(
  userId: string | null = null,
  tripId: string | null = null
): UserPreferences {
  const now = new Date();

  return {
    id: `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    tripId,

    // Interest categories
    interests: createEmptyPreferenceValue(createDefaultInterests()),
    specificInterests: [],
    prefersHiddenGems: createEmptyPreferenceValue(false),

    // Avoidances
    avoidances: [],

    // Trip style
    pace: createEmptyPreferenceValue<TripPace>('balanced'),
    timePreference: createEmptyPreferenceValue<TimePreference>('flexible'),
    crowdPreference: createEmptyPreferenceValue<CrowdPreference>('dont_mind'),

    // Budget
    budget: createEmptyPreferenceValue<BudgetLevel>('moderate'),

    // Dining
    diningStyle: createEmptyPreferenceValue<DiningStyle>('mixed'),
    dietaryRequirements: [],

    // Accommodation
    accommodationStyle: createEmptyPreferenceValue<AccommodationStyle>('comfortable'),

    // Accessibility
    accessibilityNeeds: [],

    // Metadata
    overallConfidence: 0,
    sources: {
      hasStated: false,
      hasObserved: false,
      hasHistorical: false,
    },
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// Type Guards
// ============================================================================

export function isValidInterestCategory(
  key: string
): key is keyof InterestCategories {
  return [
    'food', 'culture', 'nature', 'nightlife', 'shopping',
    'adventure', 'relaxation', 'photography', 'beach', 'localExperiences',
  ].includes(key);
}

export function isValidPace(value: string): value is TripPace {
  return ['relaxed', 'balanced', 'packed'].includes(value);
}

export function isValidBudgetLevel(value: string): value is BudgetLevel {
  return ['budget', 'moderate', 'comfort', 'luxury'].includes(value);
}

export function isValidDiningStyle(value: string): value is DiningStyle {
  return ['street_food', 'casual', 'mixed', 'fine_dining'].includes(value);
}

export function isValidAccommodationStyle(value: string): value is AccommodationStyle {
  return ['budget', 'comfortable', 'luxury', 'unique'].includes(value);
}

export function isValidTimePreference(value: string): value is TimePreference {
  return ['early_bird', 'flexible', 'late_riser'].includes(value);
}

export function isValidCrowdPreference(value: string): value is CrowdPreference {
  return ['avoid_crowds', 'dont_mind', 'like_busy'].includes(value);
}

// ============================================================================
// Exports
// ============================================================================

export const PREFERENCE_VERSION = 1;
