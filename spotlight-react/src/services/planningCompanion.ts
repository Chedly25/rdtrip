/**
 * Planning Companion Service
 *
 * WI-3.1: Specialized AI companion for the planning/discovery phase
 *
 * Architecture Decision:
 * - Builds on existing AgentProvider for API communication
 * - Focuses on context building from discoveryStore
 * - Extracts preferences from AI conversation responses
 * - Maintains planning-specific conversation management
 *
 * The planning companion is distinct from the active trip companion:
 * - Planning: Helps users explore, compare, decide on cities/places
 * - Active Trip: Provides in-the-moment assistance during travel
 */

import type {
  DiscoveryCity,
  DiscoveryPlace,
  DiscoveryRoute,
  TripSummary,
  InferredPreferences,
  DiscoveryAction,
  PlaceType,
} from '../stores/discoveryStore';

// ============================================================================
// Types - Planning Context
// ============================================================================

/**
 * Trip overview for AI context
 */
export interface TripContext {
  /** Origin city name and country */
  origin: { name: string; country: string };
  /** Destination city name and country */
  destination: { name: string; country: string };
  /** Trip dates */
  dates: {
    start: Date | null;
    end: Date | null;
    totalNights: number;
  };
  /** Traveller type (solo, couple, family, friends) */
  travellerType: string | null;
  /** Total route distance in km */
  totalDistanceKm: number | null;
  /** Total driving time in minutes */
  totalDrivingMinutes: number | null;
}

/**
 * City summary for AI context (simplified from DiscoveryCity)
 */
export interface CityContextSummary {
  id: string;
  name: string;
  country: string;
  isSelected: boolean;
  isFixed: boolean;
  nights: number;
  distanceFromRoute: number | null;
  placeCount: number;
  /** Top 3 places for context */
  topPlaces: Array<{
    name: string;
    type: PlaceType;
    isHiddenGem: boolean;
  }>;
}

/**
 * User behaviour signals for AI context
 */
export interface BehaviourContext {
  /** Place types user has favourited (ranked) */
  favouritePlaceTypes: PlaceType[];
  /** Whether user tends to favour hidden gems */
  prefersHiddenGems: boolean;
  /** Average nights per city (indicates pace preference) */
  averageNightsPerCity: number;
  /** Cities user has shown interest in (viewed preview) */
  interestedCityIds: string[];
  /** Cities user explicitly removed (indicates what they don't want) */
  removedCityIds: string[];
  /** Total favourited places count */
  totalFavourites: number;
}

/**
 * Recent user actions for AI awareness
 */
export interface RecentActionsContext {
  /** Last 5 actions for immediate context */
  actions: Array<{
    type: DiscoveryAction['type'];
    description: string;
    timestamp: Date;
  }>;
  /** Time since last action (for idle detection) */
  secondsSinceLastAction: number | null;
}

/**
 * Complete planning context sent to AI
 */
export interface PlanningContext {
  /** Session identifier */
  sessionId: string;
  /** Current phase */
  phase: 'loading' | 'exploring' | 'confirming' | 'generating';
  /** Trip overview */
  trip: TripContext;
  /** All cities (selected + suggested) */
  cities: {
    selected: CityContextSummary[];
    available: CityContextSummary[];
  };
  /** Favourited places */
  favourites: Array<{
    id: string;
    name: string;
    type: PlaceType;
    cityName: string;
    isHiddenGem: boolean;
  }>;
  /** User behaviour signals */
  behaviour: BehaviourContext;
  /** Recent actions */
  recentActions: RecentActionsContext;
  /** Current UI state */
  ui: {
    selectedCityId: string | null;
    isCompanionExpanded: boolean;
  };
}

// ============================================================================
// Types - Preference Extraction
// ============================================================================

/**
 * Preference extracted from AI conversation
 */
export interface ExtractedPreference {
  /** Unique ID */
  id: string;
  /** Category of preference */
  category:
    | 'pace'           // How fast they want to travel
    | 'accommodation'  // Hotel preferences
    | 'food'           // Dining preferences
    | 'activities'     // What they want to do
    | 'budget'         // Spending preferences
    | 'style'          // Travel style (adventure, relaxation, etc.)
    | 'timing'         // When they prefer activities
    | 'social'         // Crowds, group size preferences
    | 'other';
  /** The preference value/statement */
  value: string;
  /** Confidence level (0-1) */
  confidence: number;
  /** Source message ID */
  sourceMessageId: string;
  /** When extracted */
  extractedAt: Date;
}

/**
 * Aggregated preferences from conversation
 */
export interface ConversationPreferences {
  /** All extracted preferences */
  preferences: ExtractedPreference[];
  /** Pace preference (slow/moderate/fast) */
  pace: 'slow' | 'moderate' | 'fast' | null;
  /** Budget level (budget/moderate/luxury) */
  budget: 'budget' | 'moderate' | 'luxury' | null;
  /** Activity interests */
  interests: string[];
  /** Things to avoid */
  avoid: string[];
  /** Dietary restrictions */
  dietary: string[];
  /** Accessibility needs */
  accessibility: string[];
  /** Last updated */
  lastUpdated: Date | null;
}

// ============================================================================
// Types - Conversation Management
// ============================================================================

/**
 * Planning companion message (extends base for planning-specific data)
 */
export interface PlanningMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  /** Preferences extracted from this message */
  extractedPreferences?: ExtractedPreference[];
  /** Whether this message triggered a UI action */
  triggeredAction?: {
    type: 'select_city' | 'add_city' | 'remove_city' | 'adjust_nights' | 'favourite_place';
    data: Record<string, unknown>;
  };
  /** Artifact data if message contains structured results */
  artifact?: {
    type: 'city_comparison' | 'place_list' | 'route_suggestion';
    data: unknown;
  };
}

/**
 * Planning conversation session
 */
export interface PlanningConversation {
  /** Session ID (matches discoveryStore) */
  sessionId: string;
  /** Conversation messages */
  messages: PlanningMessage[];
  /** Aggregated preferences from conversation */
  preferences: ConversationPreferences;
  /** Conversation started at */
  startedAt: Date;
  /** Last message at */
  lastMessageAt: Date | null;
}

// ============================================================================
// Context Builder
// ============================================================================

/**
 * Build planning context from discovery store state
 *
 * This creates a rich context object that can be sent to the AI
 * to give it full awareness of the user's planning state
 */
export function buildPlanningContext(
  route: DiscoveryRoute | null,
  tripSummary: TripSummary | null,
  phase: PlanningContext['phase'],
  inferredPreferences: InferredPreferences,
  favouritedPlaceIds: string[],
  removedCityIds: string[],
  recentActions: DiscoveryAction[],
  selectedCityId: string | null,
  isCompanionExpanded: boolean,
  sessionId: string
): PlanningContext {
  // Build trip context
  const trip: TripContext = {
    origin: route
      ? { name: route.origin.name, country: route.origin.country }
      : { name: '', country: '' },
    destination: route
      ? { name: route.destination.name, country: route.destination.country }
      : { name: '', country: '' },
    dates: {
      start: tripSummary?.startDate ?? null,
      end: tripSummary?.endDate ?? null,
      totalNights: tripSummary?.totalNights ?? 0,
    },
    travellerType: tripSummary?.travellerType ?? null,
    totalDistanceKm: route?.totalDistanceKm ?? null,
    totalDrivingMinutes: route?.totalDrivingMinutes ?? null,
  };

  // Build city summaries
  const buildCitySummary = (city: DiscoveryCity): CityContextSummary => ({
    id: city.id,
    name: city.name,
    country: city.country,
    isSelected: city.isSelected,
    isFixed: city.isFixed,
    nights: city.nights ?? city.suggestedNights ?? 1,
    distanceFromRoute: city.distanceFromRoute ?? null,
    placeCount: city.places?.length ?? 0,
    topPlaces: (city.places ?? [])
      .slice(0, 3)
      .map((p) => ({
        name: p.name,
        type: p.type,
        isHiddenGem: p.isHiddenGem ?? false,
      })),
  });

  const allCities = route
    ? [route.origin, ...route.suggestedCities, route.destination]
    : [];

  const selectedCities = allCities.filter((c) => c.isSelected || c.isFixed);
  const availableCities = allCities.filter((c) => !c.isSelected && !c.isFixed);

  // Build favourites context
  const favourites: PlanningContext['favourites'] = [];
  if (route) {
    allCities.forEach((city) => {
      if (city.places) {
        city.places.forEach((place) => {
          if (favouritedPlaceIds.includes(place.id)) {
            favourites.push({
              id: place.id,
              name: place.name,
              type: place.type,
              cityName: city.name,
              isHiddenGem: place.isHiddenGem ?? false,
            });
          }
        });
      }
    });
  }

  // Build behaviour context
  const favouritePlaceTypes = Object.entries(inferredPreferences.favouritePlaceTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type as PlaceType);

  const behaviour: BehaviourContext = {
    favouritePlaceTypes,
    prefersHiddenGems: inferredPreferences.prefersHiddenGems,
    averageNightsPerCity: inferredPreferences.averageNightsPerCity,
    interestedCityIds: inferredPreferences.interestedCityIds,
    removedCityIds,
    totalFavourites: favouritedPlaceIds.length,
  };

  // Build recent actions context
  const last5Actions = recentActions.slice(-5);
  const lastAction = recentActions[recentActions.length - 1];
  const secondsSinceLastAction = lastAction
    ? Math.floor((Date.now() - lastAction.timestamp.getTime()) / 1000)
    : null;

  const recentActionsContext: RecentActionsContext = {
    actions: last5Actions.map((action) => ({
      type: action.type,
      description: formatActionDescription(action),
      timestamp: action.timestamp,
    })),
    secondsSinceLastAction,
  };

  return {
    sessionId,
    phase,
    trip,
    cities: {
      selected: selectedCities.map(buildCitySummary),
      available: availableCities.map(buildCitySummary),
    },
    favourites,
    behaviour,
    recentActions: recentActionsContext,
    ui: {
      selectedCityId,
      isCompanionExpanded,
    },
  };
}

/**
 * Format action for human-readable description
 */
function formatActionDescription(action: DiscoveryAction): string {
  const data = action.data as Record<string, unknown> | undefined;

  switch (action.type) {
    case 'city_added':
      return `Added ${data?.cityName ?? 'a city'} to trip`;
    case 'city_removed':
      return `Removed ${data?.cityName ?? 'a city'} from trip`;
    case 'city_selected':
      return `Selected ${data?.cityName ?? 'a city'} to view`;
    case 'city_reordered':
      return 'Reordered cities in trip';
    case 'place_favourited':
      return `Favourited a ${data?.placeType ?? 'place'}`;
    case 'place_unfavourited':
      return 'Unfavourited a place';
    case 'nights_adjusted':
      return `Changed nights to ${data?.nights ?? '?'} in a city`;
    case 'city_preview_viewed':
      return 'Viewed city preview';
    case 'proceed_clicked':
      return 'Clicked to proceed to itinerary';
    default:
      return 'Unknown action';
  }
}

// ============================================================================
// Context Serializer (for API)
// ============================================================================

/**
 * Serialize planning context to compact string for API
 *
 * This creates a human-readable summary that gives the AI
 * the essential context without overwhelming token usage
 */
export function serializePlanningContext(context: PlanningContext): string {
  const lines: string[] = [];

  // Trip overview
  lines.push('## Trip Overview');
  lines.push(`Route: ${context.trip.origin.name} → ${context.trip.destination.name}`);
  if (context.trip.dates.start) {
    lines.push(`Dates: ${context.trip.dates.totalNights} nights`);
  }
  if (context.trip.travellerType) {
    lines.push(`Traveller: ${context.trip.travellerType}`);
  }
  if (context.trip.totalDistanceKm) {
    lines.push(`Distance: ${context.trip.totalDistanceKm}km`);
  }

  // Selected cities
  lines.push('');
  lines.push('## Selected Cities');
  context.cities.selected.forEach((city, i) => {
    const nights = city.nights > 1 ? `${city.nights} nights` : '1 night';
    lines.push(`${i + 1}. ${city.name} (${nights})`);
    if (city.topPlaces.length > 0) {
      const gems = city.topPlaces.filter((p) => p.isHiddenGem);
      if (gems.length > 0) {
        lines.push(`   Hidden gems: ${gems.map((p) => p.name).join(', ')}`);
      }
    }
  });

  // Available cities (not selected)
  if (context.cities.available.length > 0) {
    lines.push('');
    lines.push('## Available Cities (not selected)');
    context.cities.available.slice(0, 5).forEach((city) => {
      lines.push(`- ${city.name} (${city.placeCount} places)`);
    });
    if (context.cities.available.length > 5) {
      lines.push(`... and ${context.cities.available.length - 5} more`);
    }
  }

  // Favourites
  if (context.favourites.length > 0) {
    lines.push('');
    lines.push('## Favourited Places');
    context.favourites.forEach((fav) => {
      const gem = fav.isHiddenGem ? ' ⭐' : '';
      lines.push(`- ${fav.name} (${fav.type}) in ${fav.cityName}${gem}`);
    });
  }

  // Behaviour signals
  lines.push('');
  lines.push('## User Preferences');
  if (context.behaviour.favouritePlaceTypes.length > 0) {
    lines.push(`Interests: ${context.behaviour.favouritePlaceTypes.join(', ')}`);
  }
  if (context.behaviour.prefersHiddenGems) {
    lines.push('Prefers: hidden gems over popular spots');
  }
  lines.push(`Pace: ${describePace(context.behaviour.averageNightsPerCity)}`);

  // Recent actions (for immediate context)
  if (context.recentActions.actions.length > 0) {
    lines.push('');
    lines.push('## Recent Actions');
    context.recentActions.actions.forEach((action) => {
      lines.push(`- ${action.description}`);
    });
  }

  return lines.join('\n');
}

/**
 * Describe pace from average nights
 */
function describePace(avgNights: number): string {
  if (avgNights >= 3) return 'Relaxed (3+ nights per city)';
  if (avgNights >= 2) return 'Moderate (2 nights per city)';
  return 'Fast-paced (1 night per city)';
}

// ============================================================================
// Preference Extraction
// ============================================================================

/**
 * Preference extraction patterns
 *
 * These patterns detect common preference statements in user messages
 */
const PREFERENCE_PATTERNS: Array<{
  category: ExtractedPreference['category'];
  patterns: RegExp[];
  extractor: (match: RegExpMatchArray) => string;
}> = [
  // Pace preferences
  {
    category: 'pace',
    patterns: [
      /(?:i |we )(?:want|prefer|like) (?:to )?(?:take it |go )?(slow|relaxed|leisurely)/i,
      /(?:i |we )(?:want|prefer|like) (?:to )?(?:move |travel )?(fast|quick|quickly)/i,
      /(?:no more than|at most|maximum) (\d+) (?:night|day)/i,
      /(?:at least|minimum) (\d+) (?:night|day)/i,
    ],
    extractor: (match) => match[1] || match[0],
  },
  // Budget preferences
  {
    category: 'budget',
    patterns: [
      /(?:on a |we're )?(tight |limited )?budget/i,
      /(?:looking for |prefer )?(affordable|cheap|inexpensive)/i,
      /(?:want|prefer) (luxury|upscale|high-end|fancy)/i,
      /(?:mid-range|moderate) (?:budget|price)/i,
    ],
    extractor: (match) => match[1] || match[0],
  },
  // Food preferences
  {
    category: 'food',
    patterns: [
      /(?:i am|i'm|we are|we're) (vegetarian|vegan|pescatarian)/i,
      /(?:avoid|no|don't eat) (meat|dairy|gluten|pork|shellfish)/i,
      /(?:love|enjoy|prefer) (local food|street food|fine dining|seafood)/i,
      /(?:allergic to|allergy) (\w+)/i,
    ],
    extractor: (match) => match[1] || match[0],
  },
  // Activity preferences
  {
    category: 'activities',
    patterns: [
      /(?:love|enjoy|interested in|want to) (?:see |visit |do )?(museums?|art|history|nature|hiking|beaches?|nightlife|shopping)/i,
      /(?:not interested in|skip|avoid) (museums?|art|history|touristy|crowded)/i,
    ],
    extractor: (match) => match[1] || match[0],
  },
  // Timing preferences
  {
    category: 'timing',
    patterns: [
      /(?:prefer |like )?(early (?:morning|start)|sleep in|late riser)/i,
      /(?:evening|night) (?:person|activities|plans)/i,
    ],
    extractor: (match) => match[1] || match[0],
  },
  // Social preferences
  {
    category: 'social',
    patterns: [
      /(?:avoid|hate|don't like) (?:the )?(crowds?|tourist(?:s|y)?|busy)/i,
      /(?:prefer|like) (quiet|off.?the.?beaten.?path|hidden|local)/i,
    ],
    extractor: (match) => match[1] || match[0],
  },
  // Style preferences
  {
    category: 'style',
    patterns: [
      /(?:looking for|want|prefer) (adventure|relaxation|romance|family-friendly)/i,
      /(?:this is|it's) (?:a |our )?(honeymoon|anniversary|birthday|special occasion)/i,
    ],
    extractor: (match) => match[1] || match[0],
  },
];

/**
 * Extract preferences from a user message
 */
export function extractPreferencesFromMessage(
  message: string,
  messageId: string
): ExtractedPreference[] {
  const preferences: ExtractedPreference[] = [];

  for (const { category, patterns, extractor } of PREFERENCE_PATTERNS) {
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        preferences.push({
          id: `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category,
          value: extractor(match).toLowerCase().trim(),
          confidence: 0.7, // Base confidence for pattern matching
          sourceMessageId: messageId,
          extractedAt: new Date(),
        });
        break; // Only one match per category per message
      }
    }
  }

  return preferences;
}

/**
 * Extract preferences from AI response
 *
 * The AI can explicitly tag preferences in its response using
 * a simple format: [PREFERENCE:category:value]
 */
export function extractPreferencesFromAIResponse(
  response: string,
  messageId: string
): ExtractedPreference[] {
  const preferences: ExtractedPreference[] = [];
  const tagPattern = /\[PREFERENCE:(\w+):([^\]]+)\]/g;

  let match;
  while ((match = tagPattern.exec(response)) !== null) {
    const category = match[1].toLowerCase() as ExtractedPreference['category'];
    const value = match[2].trim();

    // Validate category
    const validCategories: ExtractedPreference['category'][] = [
      'pace', 'accommodation', 'food', 'activities',
      'budget', 'style', 'timing', 'social', 'other',
    ];

    if (validCategories.includes(category)) {
      preferences.push({
        id: `pref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category,
        value,
        confidence: 0.9, // Higher confidence for AI-extracted
        sourceMessageId: messageId,
        extractedAt: new Date(),
      });
    }
  }

  return preferences;
}

/**
 * Merge new preferences into existing conversation preferences
 */
export function mergePreferences(
  existing: ConversationPreferences,
  newPreferences: ExtractedPreference[]
): ConversationPreferences {
  const merged = { ...existing };
  merged.preferences = [...existing.preferences, ...newPreferences];
  merged.lastUpdated = new Date();

  // Update aggregated values based on all preferences
  for (const pref of newPreferences) {
    switch (pref.category) {
      case 'pace':
        if (pref.value.includes('slow') || pref.value.includes('relax')) {
          merged.pace = 'slow';
        } else if (pref.value.includes('fast') || pref.value.includes('quick')) {
          merged.pace = 'fast';
        } else {
          merged.pace = 'moderate';
        }
        break;

      case 'budget':
        if (pref.value.includes('budget') || pref.value.includes('cheap') || pref.value.includes('afford')) {
          merged.budget = 'budget';
        } else if (pref.value.includes('luxury') || pref.value.includes('upscale')) {
          merged.budget = 'luxury';
        } else {
          merged.budget = 'moderate';
        }
        break;

      case 'food':
        if (pref.value.includes('vegetarian') || pref.value.includes('vegan') ||
            pref.value.includes('allerg') || pref.value.includes('avoid')) {
          if (!merged.dietary.includes(pref.value)) {
            merged.dietary.push(pref.value);
          }
        }
        break;

      case 'activities':
        if (pref.value.includes('not') || pref.value.includes('skip') || pref.value.includes('avoid')) {
          if (!merged.avoid.includes(pref.value)) {
            merged.avoid.push(pref.value);
          }
        } else {
          if (!merged.interests.includes(pref.value)) {
            merged.interests.push(pref.value);
          }
        }
        break;

      case 'social':
        if (pref.value.includes('avoid') || pref.value.includes('crowd')) {
          if (!merged.avoid.includes('crowds')) {
            merged.avoid.push('crowds');
          }
        }
        break;

      default:
        // Store as general interest
        if (!merged.interests.includes(pref.value)) {
          merged.interests.push(pref.value);
        }
    }
  }

  return merged;
}

// ============================================================================
// Conversation Management
// ============================================================================

/**
 * Create empty conversation preferences
 */
export function createEmptyPreferences(): ConversationPreferences {
  return {
    preferences: [],
    pace: null,
    budget: null,
    interests: [],
    avoid: [],
    dietary: [],
    accessibility: [],
    lastUpdated: null,
  };
}

/**
 * Create new planning conversation
 */
export function createPlanningConversation(sessionId: string): PlanningConversation {
  return {
    sessionId,
    messages: [],
    preferences: createEmptyPreferences(),
    startedAt: new Date(),
    lastMessageAt: null,
  };
}

/**
 * Add message to conversation with preference extraction
 */
export function addMessageToConversation(
  conversation: PlanningConversation,
  message: Omit<PlanningMessage, 'id' | 'timestamp' | 'extractedPreferences'>
): PlanningConversation {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date();

  // Extract preferences based on role
  let extractedPreferences: ExtractedPreference[] = [];
  if (message.role === 'user') {
    extractedPreferences = extractPreferencesFromMessage(message.content, messageId);
  } else if (message.role === 'assistant') {
    extractedPreferences = extractPreferencesFromAIResponse(message.content, messageId);
  }

  const newMessage: PlanningMessage = {
    ...message,
    id: messageId,
    timestamp,
    extractedPreferences: extractedPreferences.length > 0 ? extractedPreferences : undefined,
  };

  // Merge any extracted preferences
  const updatedPreferences = extractedPreferences.length > 0
    ? mergePreferences(conversation.preferences, extractedPreferences)
    : conversation.preferences;

  return {
    ...conversation,
    messages: [...conversation.messages, newMessage],
    preferences: updatedPreferences,
    lastMessageAt: timestamp,
  };
}

// ============================================================================
// System Prompts
// ============================================================================

/**
 * Generate system prompt for planning companion
 *
 * WI-3.2: Uses the comprehensive prompts from companionPrompts.ts
 * that define personality, tone, and behaviour
 *
 * Note: Re-exports from companionPrompts.ts for backwards compatibility
 */
export {
  generatePlanningCompanionPrompt as generatePlanningSystemPrompt,
  generateCompactPlanningPrompt as generateCompactSystemPrompt,
} from './companionPrompts';

// ============================================================================
// Suggestion Generation
// ============================================================================

/**
 * Types of proactive suggestions the companion can make
 */
export type SuggestionType =
  | 'add_city'
  | 'remove_city'
  | 'adjust_nights'
  | 'explore_places'
  | 'compare_cities'
  | 'proceed_prompt';

/**
 * Proactive suggestion from companion
 */
export interface CompanionSuggestion {
  type: SuggestionType;
  message: string;
  action?: {
    label: string;
    handler: string; // Action identifier
    data?: Record<string, unknown>;
  };
  priority: 'low' | 'medium' | 'high';
}

/**
 * Generate proactive suggestions based on context
 */
export function generateProactiveSuggestions(
  context: PlanningContext
): CompanionSuggestion[] {
  const suggestions: CompanionSuggestion[] = [];

  // Check if they've been idle
  const idleMinutes = context.recentActions.secondsSinceLastAction
    ? context.recentActions.secondsSinceLastAction / 60
    : 0;

  // Suggest exploring cities if they haven't selected many
  if (context.cities.selected.length <= 2 && context.cities.available.length > 0) {
    const topCity = context.cities.available[0];
    suggestions.push({
      type: 'add_city',
      message: `${topCity.name} is along your route and has ${topCity.placeCount} interesting places. Want to explore it?`,
      action: {
        label: 'Explore',
        handler: 'select_city',
        data: { cityId: topCity.id },
      },
      priority: 'medium',
    });
  }

  // Suggest based on hidden gem preference
  if (context.behaviour.prefersHiddenGems) {
    const cityWithGems = context.cities.available.find((c) =>
      c.topPlaces.some((p) => p.isHiddenGem)
    );
    if (cityWithGems) {
      suggestions.push({
        type: 'explore_places',
        message: `I found some hidden gems in ${cityWithGems.name} that match your style!`,
        action: {
          label: 'Show me',
          handler: 'show_hidden_gems',
          data: { cityId: cityWithGems.id },
        },
        priority: 'high',
      });
    }
  }

  // Suggest adjusting pace if nights don't match trip duration
  const totalSelectedNights = context.cities.selected.reduce((sum, c) => sum + c.nights, 0);
  const tripNights = context.trip.dates.totalNights;
  if (tripNights > 0 && Math.abs(totalSelectedNights - tripNights) > 2) {
    if (totalSelectedNights < tripNights) {
      suggestions.push({
        type: 'adjust_nights',
        message: `You have ${tripNights - totalSelectedNights} nights unallocated. Want suggestions on where to spend more time?`,
        priority: 'medium',
      });
    } else {
      suggestions.push({
        type: 'adjust_nights',
        message: `Your current plan is ${totalSelectedNights - tripNights} nights over your trip length. Should we adjust?`,
        priority: 'high',
      });
    }
  }

  // Prompt to proceed if they seem ready
  if (
    context.phase === 'exploring' &&
    context.cities.selected.length >= 3 &&
    idleMinutes > 2 &&
    Math.abs(totalSelectedNights - tripNights) <= 1
  ) {
    suggestions.push({
      type: 'proceed_prompt',
      message: 'Your trip is looking great! Ready to generate your detailed itinerary?',
      action: {
        label: 'Generate Itinerary',
        handler: 'proceed_to_itinerary',
      },
      priority: 'low',
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================================
// Exports
// ============================================================================

export type {
  DiscoveryCity,
  DiscoveryPlace,
  DiscoveryRoute,
  TripSummary,
  InferredPreferences,
  DiscoveryAction,
  PlaceType,
};
