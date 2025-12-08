/**
 * Preference Extraction from Conversation
 *
 * WI-4.3: Extracts structured preferences from natural language conversation
 *
 * Architecture Decisions:
 * - Uses Claude to analyze user messages for preference signals
 * - Returns structured data that maps to UserPreferences
 * - Conservative extraction: only extract clear, explicit preferences
 * - Confidence based on explicitness of statement
 * - Non-blocking: extraction runs in background after message sent
 *
 * Examples:
 * - "We love wine" → interests.food +0.3, specificInterests: ["wine"]
 * - "Not really into museums" → avoidances: ["museums"], interests.culture -0.2
 * - "We want to take it easy" → pace: "relaxed"
 */

import {
  type PreferenceSource,
  type InterestCategories,
  type TripPace,
  type BudgetLevel,
  isValidPace,
  isValidBudgetLevel,
  isValidDiningStyle,
  isValidTimePreference,
  isValidCrowdPreference,
  isValidInterestCategory,
} from './types';
import { usePreferencesStore } from '../../stores/preferencesStore';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'
);

// ============================================================================
// Types - Extraction Results
// ============================================================================

/**
 * Individual preference signal extracted from message
 */
export interface ExtractedSignal {
  /** Type of preference */
  type:
    | 'interest_increase'    // User shows interest in category
    | 'interest_decrease'    // User shows disinterest in category
    | 'specific_interest'    // Specific thing they like
    | 'avoidance'            // Something they want to avoid
    | 'pace'                 // Travel pace preference
    | 'budget'               // Budget level
    | 'dining_style'         // Food/dining preference
    | 'time_preference'      // Morning/evening preference
    | 'crowd_preference'     // Crowds tolerance
    | 'dietary'              // Dietary requirement
    | 'accessibility'        // Accessibility need
    | 'hidden_gems';         // Preference for off-beaten-path

  /** The value extracted */
  value: string;

  /** Which interest category this affects (if applicable) */
  category?: keyof InterestCategories;

  /** How much to adjust (for interest changes, -1 to 1) */
  delta?: number;

  /** Confidence in this extraction (0-1) */
  confidence: number;

  /** The phrase that triggered this extraction */
  evidence: string;
}

/**
 * Complete extraction result from a message
 */
export interface ExtractionResult {
  /** Signals extracted from the message */
  signals: ExtractedSignal[];

  /** Whether any preferences were found */
  hasPreferences: boolean;

  /** Summary of what was extracted (for debugging) */
  summary: string;
}

/**
 * Request payload for extraction API
 */
interface ExtractionRequest {
  /** The user message to analyze */
  message: string;

  /** Optional conversation context (last few messages) */
  conversationContext?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;

  /** Current trip context (if any) */
  tripContext?: {
    destination?: string;
    duration?: number;
    travellerType?: string;
  };
}

// ============================================================================
// Extraction Prompt
// ============================================================================

/**
 * System prompt for preference extraction
 * Designed to be conservative and only extract clear signals
 */
const EXTRACTION_SYSTEM_PROMPT = `You are a preference extraction system for a travel planning app. Your job is to analyze user messages and extract clear preference signals.

## Your Task
Analyze the user's message and extract any travel preferences they express. Be CONSERVATIVE - only extract preferences that are clearly stated or strongly implied.

## What to Extract

### Interest Categories (0-1 scale adjustments)
- food: restaurants, cuisine, culinary experiences
- culture: museums, history, architecture, art
- nature: parks, hiking, outdoor activities
- nightlife: bars, clubs, evening entertainment
- shopping: markets, boutiques, retail
- adventure: active/thrilling experiences
- relaxation: spa, wellness, slow travel
- photography: scenic spots, photo opportunities
- beach: coastal activities
- localExperiences: off-beaten-path, local culture

### Specific Interests & Avoidances
- Things they specifically mention wanting to do or see
- Things they explicitly want to avoid

### Travel Style
- pace: "relaxed" | "balanced" | "packed"
- budget: "budget" | "moderate" | "comfort" | "luxury"
- dining_style: "street_food" | "casual" | "mixed" | "fine_dining"
- time_preference: "early_bird" | "flexible" | "late_riser"
- crowd_preference: "avoid_crowds" | "dont_mind" | "like_busy"

### Special Requirements
- dietary: vegetarian, vegan, gluten-free, halal, kosher, allergies
- accessibility: wheelchair, limited walking, hearing, vision

## Confidence Levels
- 0.9-1.0: Explicit statement ("We're vegetarian", "I hate museums")
- 0.7-0.8: Strong implication ("We love trying local food" → food interest)
- 0.5-0.6: Moderate inference ("That looks nice" about a restaurant → possible food interest)
- Below 0.5: Don't extract - too uncertain

## Rules
1. Only extract what's clearly stated or strongly implied
2. Don't infer preferences from single word responses
3. Questions don't indicate preferences (asking about museums ≠ wanting museums)
4. Negative statements are as valuable as positive ones
5. When in doubt, don't extract

## Output Format
Return a JSON object with this structure:
{
  "signals": [
    {
      "type": "interest_increase" | "interest_decrease" | "specific_interest" | "avoidance" | "pace" | "budget" | "dining_style" | "time_preference" | "crowd_preference" | "dietary" | "accessibility" | "hidden_gems",
      "value": "the extracted value",
      "category": "food" | "culture" | etc (only for interest changes),
      "delta": 0.3 (only for interest changes, range -0.5 to 0.5),
      "confidence": 0.8,
      "evidence": "the exact phrase that indicates this"
    }
  ],
  "hasPreferences": true/false,
  "summary": "Brief description of what was extracted"
}

If no preferences are found, return:
{
  "signals": [],
  "hasPreferences": false,
  "summary": "No clear preferences detected"
}`;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('rdtrip_auth_token') || localStorage.getItem('token');
}

/**
 * Call the extraction API endpoint
 */
export async function callExtractionAPI(
  request: ExtractionRequest
): Promise<ExtractionResult> {
  const token = getAuthToken();

  try {
    const response = await fetch(`${API_BASE_URL}/preferences/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: request.message,
        conversationContext: request.conversationContext,
        tripContext: request.tripContext,
        systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      }),
    });

    if (!response.ok) {
      console.warn('[PreferenceExtraction] API call failed:', response.status);
      return {
        signals: [],
        hasPreferences: false,
        summary: 'Extraction failed',
      };
    }

    const data = await response.json();
    return validateExtractionResult(data);
  } catch (error) {
    console.error('[PreferenceExtraction] Error:', error);
    return {
      signals: [],
      hasPreferences: false,
      summary: 'Extraction error',
    };
  }
}

/**
 * Fallback: Extract preferences locally using pattern matching
 * Used when API is unavailable or for quick common patterns
 */
export function extractPreferencesLocally(message: string): ExtractionResult {
  const signals: ExtractedSignal[] = [];
  const lowerMessage = message.toLowerCase();

  // Pace patterns
  const pacePatterns: Array<{ pattern: RegExp; value: TripPace; confidence: number }> = [
    { pattern: /take it easy|relaxed|slow pace|no rush/i, value: 'relaxed', confidence: 0.85 },
    { pattern: /packed schedule|see everything|maximize|busy/i, value: 'packed', confidence: 0.85 },
    { pattern: /balanced|moderate pace|mix of/i, value: 'balanced', confidence: 0.75 },
  ];

  for (const { pattern, value, confidence } of pacePatterns) {
    const match = message.match(pattern);
    if (match) {
      signals.push({
        type: 'pace',
        value,
        confidence,
        evidence: match[0],
      });
      break;
    }
  }

  // Budget patterns
  const budgetPatterns: Array<{ pattern: RegExp; value: BudgetLevel; confidence: number }> = [
    { pattern: /budget|cheap|affordable|backpack/i, value: 'budget', confidence: 0.8 },
    { pattern: /luxury|splurge|high.?end|fancy/i, value: 'luxury', confidence: 0.85 },
    { pattern: /comfortable|mid.?range|decent/i, value: 'comfort', confidence: 0.75 },
  ];

  for (const { pattern, value, confidence } of budgetPatterns) {
    const match = message.match(pattern);
    if (match) {
      signals.push({
        type: 'budget',
        value,
        confidence,
        evidence: match[0],
      });
      break;
    }
  }

  // Interest increase patterns
  const interestPatterns: Array<{
    pattern: RegExp;
    category: keyof InterestCategories;
    delta: number;
    confidence: number;
  }> = [
    { pattern: /love food|foodie|culinary|cuisine|restaurants/i, category: 'food', delta: 0.3, confidence: 0.8 },
    { pattern: /love (the )?outdoors|hiking|nature|parks/i, category: 'nature', delta: 0.3, confidence: 0.8 },
    { pattern: /love history|museums|architecture|art/i, category: 'culture', delta: 0.3, confidence: 0.8 },
    { pattern: /nightlife|bars|clubs|party/i, category: 'nightlife', delta: 0.3, confidence: 0.75 },
    { pattern: /shopping|markets|boutiques/i, category: 'shopping', delta: 0.25, confidence: 0.75 },
    { pattern: /adventure|thrill|adrenaline|extreme/i, category: 'adventure', delta: 0.3, confidence: 0.8 },
    { pattern: /relax|spa|wellness|unwind/i, category: 'relaxation', delta: 0.3, confidence: 0.8 },
    { pattern: /photos|photography|instagram|scenic/i, category: 'photography', delta: 0.25, confidence: 0.75 },
    { pattern: /beach|coastal|ocean|sea/i, category: 'beach', delta: 0.3, confidence: 0.8 },
    { pattern: /local|authentic|off.?beaten|hidden gems/i, category: 'localExperiences', delta: 0.3, confidence: 0.8 },
  ];

  for (const { pattern, category, delta, confidence } of interestPatterns) {
    const match = message.match(pattern);
    if (match) {
      signals.push({
        type: 'interest_increase',
        value: category,
        category,
        delta,
        confidence,
        evidence: match[0],
      });
    }
  }

  // Interest decrease / avoidance patterns
  const avoidPatterns: Array<{
    pattern: RegExp;
    category?: keyof InterestCategories;
    value: string;
    confidence: number;
  }> = [
    { pattern: /hate museums|not into museums|skip museums/i, category: 'culture', value: 'museums', confidence: 0.85 },
    { pattern: /don't like hiking|not into nature|avoid outdoors/i, category: 'nature', value: 'hiking', confidence: 0.85 },
    { pattern: /avoid crowds|hate crowds|tourist traps/i, value: 'crowded tourist spots', confidence: 0.8 },
    { pattern: /not a night owl|not into nightlife|no clubs/i, category: 'nightlife', value: 'nightlife', confidence: 0.8 },
    { pattern: /hate shopping|not into shopping/i, category: 'shopping', value: 'shopping', confidence: 0.8 },
  ];

  for (const { pattern, category, value, confidence } of avoidPatterns) {
    const match = message.match(pattern);
    if (match) {
      signals.push({
        type: 'avoidance',
        value,
        category,
        delta: category ? -0.25 : undefined,
        confidence,
        evidence: match[0],
      });
    }
  }

  // Specific interests (wine, coffee, street art, etc.)
  const specificPatterns: Array<{ pattern: RegExp; value: string; category?: keyof InterestCategories }> = [
    { pattern: /love wine|wine lovers?|wine tasting/i, value: 'wine', category: 'food' },
    { pattern: /coffee lovers?|great coffee|cafe culture/i, value: 'coffee culture', category: 'food' },
    { pattern: /street art|graffiti|murals/i, value: 'street art', category: 'culture' },
    { pattern: /local markets|farmers? markets?/i, value: 'local markets', category: 'localExperiences' },
    { pattern: /live music|concerts/i, value: 'live music', category: 'nightlife' },
    { pattern: /street food/i, value: 'street food', category: 'food' },
  ];

  for (const { pattern, value, category } of specificPatterns) {
    const match = message.match(pattern);
    if (match) {
      signals.push({
        type: 'specific_interest',
        value,
        category,
        confidence: 0.8,
        evidence: match[0],
      });
    }
  }

  // Dietary requirements
  const dietaryPatterns: Array<{ pattern: RegExp; value: string; isStrict: boolean }> = [
    { pattern: /i'm vegetarian|we're vegetarian|vegetarian/i, value: 'vegetarian', isStrict: true },
    { pattern: /i'm vegan|we're vegan|vegan/i, value: 'vegan', isStrict: true },
    { pattern: /gluten.?free|celiac/i, value: 'gluten-free', isStrict: true },
    { pattern: /halal/i, value: 'halal', isStrict: true },
    { pattern: /kosher/i, value: 'kosher', isStrict: true },
    { pattern: /allergic to|allergy/i, value: 'food allergies', isStrict: true },
  ];

  for (const { pattern, value } of dietaryPatterns) {
    const match = message.match(pattern);
    if (match) {
      signals.push({
        type: 'dietary',
        value,
        confidence: 0.95,
        evidence: match[0],
      });
    }
  }

  // Time preference
  if (/early (bird|riser|morning)|wake up early|morning person/i.test(lowerMessage)) {
    signals.push({
      type: 'time_preference',
      value: 'early_bird',
      confidence: 0.85,
      evidence: lowerMessage.match(/early (bird|riser|morning)|wake up early|morning person/i)?.[0] || '',
    });
  } else if (/night owl|sleep in|late riser|hate mornings/i.test(lowerMessage)) {
    signals.push({
      type: 'time_preference',
      value: 'late_riser',
      confidence: 0.85,
      evidence: lowerMessage.match(/night owl|sleep in|late riser|hate mornings/i)?.[0] || '',
    });
  }

  // Crowd preference
  if (/avoid crowds|hate crowds|off.?beaten|less touristy/i.test(lowerMessage)) {
    signals.push({
      type: 'crowd_preference',
      value: 'avoid_crowds',
      confidence: 0.85,
      evidence: lowerMessage.match(/avoid crowds|hate crowds|off.?beaten|less touristy/i)?.[0] || '',
    });
  }

  // Hidden gems preference
  if (/hidden gems?|off.?beaten|local secrets?|not touristy|authentic/i.test(lowerMessage)) {
    signals.push({
      type: 'hidden_gems',
      value: 'true',
      confidence: 0.8,
      evidence: lowerMessage.match(/hidden gems?|off.?beaten|local secrets?|not touristy|authentic/i)?.[0] || '',
    });
  }

  return {
    signals,
    hasPreferences: signals.length > 0,
    summary: signals.length > 0
      ? `Extracted ${signals.length} preference signal(s): ${signals.map(s => s.type).join(', ')}`
      : 'No clear preferences detected',
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate and sanitize extraction result from API
 */
function validateExtractionResult(data: unknown): ExtractionResult {
  if (!data || typeof data !== 'object') {
    return { signals: [], hasPreferences: false, summary: 'Invalid response' };
  }

  const result = data as Record<string, unknown>;

  if (!Array.isArray(result.signals)) {
    return { signals: [], hasPreferences: false, summary: 'Invalid signals array' };
  }

  const validSignals: ExtractedSignal[] = [];

  for (const signal of result.signals) {
    if (!signal || typeof signal !== 'object') continue;

    const s = signal as Record<string, unknown>;

    // Validate required fields
    if (typeof s.type !== 'string' || typeof s.value !== 'string') continue;
    if (typeof s.confidence !== 'number' || s.confidence < 0 || s.confidence > 1) continue;

    // Validate type-specific fields
    const validSignal: ExtractedSignal = {
      type: s.type as ExtractedSignal['type'],
      value: s.value,
      confidence: s.confidence,
      evidence: typeof s.evidence === 'string' ? s.evidence : '',
    };

    // Add optional fields if valid
    if (typeof s.category === 'string' && isValidInterestCategory(s.category)) {
      validSignal.category = s.category;
    }

    if (typeof s.delta === 'number' && s.delta >= -1 && s.delta <= 1) {
      validSignal.delta = s.delta;
    }

    validSignals.push(validSignal);
  }

  return {
    signals: validSignals,
    hasPreferences: validSignals.length > 0,
    summary: typeof result.summary === 'string' ? result.summary : '',
  };
}

// ============================================================================
// Apply to Store
// ============================================================================

/**
 * Apply extracted signals to the preferences store
 */
export function applyExtractedPreferences(
  result: ExtractionResult,
  tripId?: string | null
): void {
  if (!result.hasPreferences || result.signals.length === 0) {
    return;
  }

  const store = usePreferencesStore.getState();
  const source: PreferenceSource = 'stated'; // Conversation = stated preferences

  for (const signal of result.signals) {
    // Skip low confidence signals
    if (signal.confidence < 0.6) continue;

    switch (signal.type) {
      case 'interest_increase':
      case 'interest_decrease':
        if (signal.category && signal.delta) {
          store.adjustInterestBy(
            signal.category,
            signal.delta,
            source,
            tripId
          );
        }
        break;

      case 'specific_interest':
        store.addInterest(
          signal.value,
          source,
          signal.confidence,
          signal.category,
          tripId
        );
        break;

      case 'avoidance':
        store.addAvoidanceTag(
          signal.value,
          signal.confidence,
          source,
          signal.evidence,
          tripId
        );
        // Also decrease interest in related category
        if (signal.category && signal.delta) {
          store.adjustInterestBy(
            signal.category,
            signal.delta,
            source,
            tripId
          );
        }
        break;

      case 'pace':
        if (isValidPace(signal.value)) {
          store.setPace(signal.value, source, tripId);
        }
        break;

      case 'budget':
        if (isValidBudgetLevel(signal.value)) {
          store.setBudget(signal.value, source, tripId);
        }
        break;

      case 'dining_style':
        if (isValidDiningStyle(signal.value)) {
          store.setDiningStyle(signal.value, source, tripId);
        }
        break;

      case 'time_preference':
        if (isValidTimePreference(signal.value)) {
          store.setTimePreference(signal.value, source, tripId);
        }
        break;

      case 'crowd_preference':
        if (isValidCrowdPreference(signal.value)) {
          store.setCrowdPreference(signal.value, source, tripId);
        }
        break;

      case 'dietary':
        store.addDietary(
          signal.value,
          true, // Strict by default for dietary
          source,
          tripId
        );
        break;

      case 'accessibility':
        store.addAccessibility(
          signal.value,
          signal.evidence,
          source,
          tripId
        );
        break;

      case 'hidden_gems':
        store.setHiddenGemsPreference(
          signal.value === 'true',
          source,
          tripId
        );
        break;
    }
  }

  console.log('[PreferenceExtraction] Applied', result.signals.length, 'signals to store');
}

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Extract preferences from a user message and apply to store
 *
 * This is the main function to call when a user sends a message.
 * It:
 * 1. First tries local pattern matching (fast, no API call)
 * 2. If complex message, calls API for deeper extraction
 * 3. Applies results to preferences store
 *
 * @param message - The user's message
 * @param options - Optional configuration
 * @returns Extraction result
 */
export async function extractAndApplyPreferences(
  message: string,
  options: {
    tripId?: string | null;
    conversationContext?: Array<{ role: 'user' | 'assistant'; content: string }>;
    tripContext?: { destination?: string; duration?: number; travellerType?: string };
    useAPI?: boolean;
  } = {}
): Promise<ExtractionResult> {
  const { tripId, conversationContext, tripContext, useAPI = false } = options;

  // Skip very short messages
  if (message.trim().length < 10) {
    return { signals: [], hasPreferences: false, summary: 'Message too short' };
  }

  // First, try local extraction (fast)
  const localResult = extractPreferencesLocally(message);

  // If local extraction found preferences, apply and return
  if (localResult.hasPreferences) {
    applyExtractedPreferences(localResult, tripId);
    return localResult;
  }

  // If API is enabled and message is complex, try API extraction
  if (useAPI && message.length > 50) {
    const apiResult = await callExtractionAPI({
      message,
      conversationContext,
      tripContext,
    });

    if (apiResult.hasPreferences) {
      applyExtractedPreferences(apiResult, tripId);
      return apiResult;
    }
  }

  return localResult;
}

// ============================================================================
// React Hook
// ============================================================================

/**
 * Hook for extracting preferences from messages
 *
 * Usage:
 * ```tsx
 * const { extract, isExtracting, lastResult } = usePreferenceExtraction();
 *
 * // When user sends a message
 * const result = await extract(userMessage);
 * if (result.hasPreferences) {
 *   console.log('Extracted:', result.summary);
 * }
 * ```
 */
export function usePreferenceExtraction(options: {
  tripId?: string | null;
  useAPI?: boolean;
} = {}) {
  const { tripId, useAPI = false } = options;

  // Track state in a simple closure (stateless hook for now)
  let isExtracting = false;
  let lastResult: ExtractionResult | null = null;

  const extract = async (
    message: string,
    context?: {
      conversationContext?: Array<{ role: 'user' | 'assistant'; content: string }>;
      tripContext?: { destination?: string; duration?: number; travellerType?: string };
    }
  ): Promise<ExtractionResult> => {
    isExtracting = true;

    try {
      const result = await extractAndApplyPreferences(message, {
        tripId,
        useAPI,
        ...context,
      });
      lastResult = result;
      return result;
    } finally {
      isExtracting = false;
    }
  };

  return {
    extract,
    extractLocally: extractPreferencesLocally,
    isExtracting,
    lastResult,
  };
}
