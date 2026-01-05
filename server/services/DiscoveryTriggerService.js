/**
 * DiscoveryTriggerService
 *
 * Detects when Voyager should proactively offer suggestions.
 * Monitors user behavior and route state to find moments of opportunity.
 *
 * Triggers:
 * - city_added: User adds a city → suggest related discoveries
 * - cities_removed: Multiple removals → offer simplification help
 * - idle_exploring: User idle on map → suggest based on map position
 * - route_imbalance: Unbalanced route → offer rebalancing
 * - preference_detected: Clear preference pattern → acknowledge and enhance
 * - trip_ready: Route looks complete → prompt for itinerary generation
 */

const Anthropic = require('@anthropic-ai/sdk');

// ============================================================================
// Trigger Definitions
// ============================================================================

const TRIGGERS = {
  city_added: {
    id: 'city_added',
    cooldownMs: 30000, // 30 seconds between triggers
    priority: 'medium',
    description: 'User added a city to route',
    conditions: (data, context) => {
      return data.cityName && context.routeData?.waypoints?.length > 0;
    }
  },

  cities_removed: {
    id: 'cities_removed',
    cooldownMs: 120000, // 2 minutes
    priority: 'low',
    description: 'Multiple cities removed recently',
    conditions: (data, context) => {
      const recentRemovals = context.recentActions?.filter(
        a => a.type === 'city_removed' &&
        Date.now() - new Date(a.timestamp).getTime() < 60000
      );
      return recentRemovals?.length >= 2;
    }
  },

  idle_exploring: {
    id: 'idle_exploring',
    cooldownMs: 300000, // 5 minutes
    priority: 'low',
    description: 'User idle on map for 2+ minutes',
    conditions: (data, context) => {
      return data.idleDurationMs >= 120000 && data.mapCenter;
    }
  },

  route_imbalance: {
    id: 'route_imbalance',
    cooldownMs: 600000, // 10 minutes
    priority: 'medium',
    description: 'Route is unbalanced (all big cities, uneven nights)',
    conditions: (data, context) => {
      const waypoints = context.routeData?.waypoints || [];
      if (waypoints.length < 3) return false;

      // Check for night imbalance
      const nights = waypoints.map(w => w.nights || 1);
      const maxNights = Math.max(...nights);
      const minNights = Math.min(...nights);
      if (maxNights > minNights * 3) return true;

      return false;
    }
  },

  preference_detected: {
    id: 'preference_detected',
    cooldownMs: 180000, // 3 minutes
    priority: 'high',
    description: 'Clear preference pattern detected',
    conditions: (data, context) => {
      return data.preferenceType && data.confidence >= 0.7;
    }
  },

  trip_ready: {
    id: 'trip_ready',
    cooldownMs: 300000, // 5 minutes
    priority: 'high',
    description: 'Route looks complete, ready for itinerary',
    conditions: (data, context) => {
      const waypoints = context.routeData?.waypoints || [];
      const totalNights = context.routeData?.totalNights || 0;
      return waypoints.length >= 3 && totalNights >= 3;
    }
  },

  hidden_gem_nearby: {
    id: 'hidden_gem_nearby',
    cooldownMs: 120000, // 2 minutes
    priority: 'medium',
    description: 'Hidden gem near current route',
    conditions: (data, context) => {
      return data.hiddenGem && data.distanceFromRoute < 50;
    }
  }
};

// ============================================================================
// DiscoveryTriggerService Class
// ============================================================================

class DiscoveryTriggerService {
  constructor(options = {}) {
    this.anthropic = new Anthropic();
    this.model = options.model || 'claude-3-5-haiku-20241022';

    // Track trigger cooldowns per session
    this.sessionCooldowns = new Map();

    // Track dismissed suggestions
    this.dismissedSuggestions = new Map();
  }

  /**
   * Check if a trigger should fire
   */
  shouldTrigger(triggerId, sessionId, data, context) {
    const trigger = TRIGGERS[triggerId];
    if (!trigger) return false;

    // Check conditions
    if (!trigger.conditions(data, context)) {
      return false;
    }

    // Check cooldown
    const cooldownKey = `${sessionId}:${triggerId}`;
    const lastFired = this.sessionCooldowns.get(cooldownKey);
    if (lastFired && Date.now() - lastFired < trigger.cooldownMs) {
      return false;
    }

    return true;
  }

  /**
   * Record that a trigger was fired
   */
  recordTrigger(triggerId, sessionId) {
    const cooldownKey = `${sessionId}:${triggerId}`;
    this.sessionCooldowns.set(cooldownKey, Date.now());
  }

  /**
   * Record that a suggestion was dismissed
   */
  recordDismissal(suggestionId, sessionId) {
    const key = `${sessionId}:${suggestionId}`;
    this.dismissedSuggestions.set(key, Date.now());
  }

  /**
   * Generate proactive suggestion for a trigger
   */
  async generateSuggestion(triggerId, triggerData, context) {
    const trigger = TRIGGERS[triggerId];
    if (!trigger) {
      return { shouldShow: false };
    }

    // Check if should trigger
    if (!this.shouldTrigger(triggerId, context.sessionId, triggerData, context)) {
      return { shouldShow: false };
    }

    try {
      // Generate contextual suggestion using Claude
      const suggestion = await this.generateContextualSuggestion(
        triggerId,
        triggerData,
        context
      );

      if (suggestion.shouldShow) {
        this.recordTrigger(triggerId, context.sessionId);
      }

      return suggestion;
    } catch (error) {
      console.error('Suggestion generation failed:', error);
      return { shouldShow: false };
    }
  }

  /**
   * Generate contextual suggestion using Claude
   */
  async generateContextualSuggestion(triggerId, triggerData, context) {
    const prompt = this.buildSuggestionPrompt(triggerId, triggerData, context);

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0]?.text || '';
      return this.parseSuggestionResponse(content, triggerId);
    } catch (error) {
      console.error('Claude suggestion generation failed:', error);
      return this.getFallbackSuggestion(triggerId, triggerData);
    }
  }

  /**
   * Build prompt for suggestion generation
   */
  buildSuggestionPrompt(triggerId, triggerData, context) {
    const routeInfo = context.routeData ?
      `Current route: ${context.routeData.origin} → ${context.routeData.destination} with ${context.routeData.waypoints?.length || 0} stops` :
      'No route yet';

    const preferencesInfo = context.preferences ?
      `User preferences: ${JSON.stringify(context.preferences)}` :
      'No preferences detected yet';

    const triggerInfo = this.getTriggerInfo(triggerId, triggerData);

    return `You are Voyager, a sophisticated travel companion. Generate a brief proactive suggestion.

CONTEXT:
${routeInfo}
${preferencesInfo}

TRIGGER: ${triggerInfo}

Generate a JSON response with:
{
  "shouldShow": true/false,
  "message": "Your warm, concise suggestion (1-2 sentences max)",
  "quickActions": [
    { "label": "Button text", "action": "action_id" }
  ],
  "priority": "high/medium/low"
}

RULES:
- Be warm but not pushy
- Keep message under 100 characters
- Max 2 quick actions
- Only suggest if genuinely helpful
- Use British English, sophisticated tone

Return ONLY the JSON, no other text.`;
  }

  /**
   * Get human-readable trigger info
   */
  getTriggerInfo(triggerId, data) {
    switch (triggerId) {
      case 'city_added':
        return `User just added ${data.cityName} to their route`;
      case 'cities_removed':
        return `User removed multiple cities, may be simplifying`;
      case 'idle_exploring':
        return `User has been exploring the map near ${data.mapCenter?.lat?.toFixed(2)}, ${data.mapCenter?.lng?.toFixed(2)}`;
      case 'route_imbalance':
        return `Route has uneven distribution of nights or city types`;
      case 'preference_detected':
        return `User shows preference for ${data.preferenceType} (confidence: ${data.confidence})`;
      case 'trip_ready':
        return `Route looks complete with enough stops and nights`;
      case 'hidden_gem_nearby':
        return `Hidden gem "${data.hiddenGem?.name}" is near the route`;
      default:
        return `Trigger: ${triggerId}`;
    }
  }

  /**
   * Parse Claude's suggestion response
   */
  parseSuggestionResponse(content, triggerId) {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          shouldShow: parsed.shouldShow !== false,
          message: parsed.message || '',
          quickActions: parsed.quickActions || [],
          priority: parsed.priority || 'medium',
          triggerId
        };
      }
    } catch (e) {
      console.warn('Failed to parse suggestion response:', e.message);
    }

    return { shouldShow: false };
  }

  /**
   * Get fallback suggestion when Claude fails
   */
  getFallbackSuggestion(triggerId, data) {
    const fallbacks = {
      city_added: {
        shouldShow: true,
        message: `${data.cityName} is a great choice! Want me to find similar cities nearby?`,
        quickActions: [
          { label: 'Find similar', action: 'search_similar' },
          { label: 'City highlights', action: 'get_highlights' }
        ],
        priority: 'medium'
      },
      route_imbalance: {
        shouldShow: true,
        message: 'Your route might benefit from some rebalancing. Shall I help?',
        quickActions: [
          { label: 'Rebalance', action: 'auto_rebalance' },
          { label: 'Not now', action: 'dismiss' }
        ],
        priority: 'low'
      },
      trip_ready: {
        shouldShow: true,
        message: 'Your route is looking great! Ready to generate a detailed itinerary?',
        quickActions: [
          { label: 'Generate itinerary', action: 'generate_itinerary' },
          { label: 'Keep exploring', action: 'dismiss' }
        ],
        priority: 'high'
      },
      preference_detected: {
        shouldShow: true,
        message: `I notice you love ${data.preferenceType} destinations. Want more like these?`,
        quickActions: [
          { label: 'Show me more', action: 'search_preference' },
          { label: 'Noted!', action: 'dismiss' }
        ],
        priority: 'medium'
      }
    };

    return fallbacks[triggerId] || { shouldShow: false };
  }

  /**
   * Infer preferences from user behavior
   */
  inferPreferences(actions, routeData) {
    const preferences = {
      types: {},
      behaviors: {},
      confidence: 0
    };

    if (!actions || actions.length === 0) {
      return preferences;
    }

    // Count place type interactions
    for (const action of actions) {
      if (action.type === 'place_favorited' && action.data?.placeType) {
        preferences.types[action.data.placeType] =
          (preferences.types[action.data.placeType] || 0) + 1;
      }
      if (action.type === 'city_added' && action.data?.tags) {
        for (const tag of action.data.tags) {
          preferences.types[tag] = (preferences.types[tag] || 0) + 1;
        }
      }
    }

    // Detect behavior patterns
    const removals = actions.filter(a => a.type === 'city_removed');
    const additions = actions.filter(a => a.type === 'city_added');

    if (removals.length > additions.length) {
      preferences.behaviors.simplifying = true;
    }

    // Calculate top preference
    const topTypes = Object.entries(preferences.types)
      .sort((a, b) => b[1] - a[1]);

    if (topTypes.length > 0 && topTypes[0][1] >= 3) {
      preferences.topPreference = topTypes[0][0];
      preferences.confidence = Math.min(topTypes[0][1] / 5, 1);
    }

    return preferences;
  }

  /**
   * Analyze route for issues
   */
  analyzeRoute(routeData) {
    const issues = [];
    const waypoints = routeData?.waypoints || [];

    if (waypoints.length < 2) {
      return { issues, healthy: true };
    }

    // Check night distribution
    const nights = waypoints.map(w => w.nights || 1);
    const totalNights = nights.reduce((a, b) => a + b, 0);
    const avgNights = totalNights / waypoints.length;

    const nightVariance = nights.reduce((sum, n) =>
      sum + Math.pow(n - avgNights, 2), 0) / waypoints.length;

    if (nightVariance > 2) {
      issues.push({
        type: 'night_imbalance',
        severity: 'medium',
        message: 'Nights are unevenly distributed'
      });
    }

    // Check for variety (not all big cities or all small towns)
    // This would need city data to implement properly

    return {
      issues,
      healthy: issues.length === 0,
      stats: {
        totalNights,
        avgNights,
        stopCount: waypoints.length
      }
    };
  }

  /**
   * Clean up old cooldowns
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [key, timestamp] of this.sessionCooldowns.entries()) {
      if (now - timestamp > maxAge) {
        this.sessionCooldowns.delete(key);
      }
    }

    for (const [key, timestamp] of this.dismissedSuggestions.entries()) {
      if (now - timestamp > maxAge) {
        this.dismissedSuggestions.delete(key);
      }
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = { DiscoveryTriggerService, TRIGGERS };
