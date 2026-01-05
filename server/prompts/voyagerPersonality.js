/**
 * Voyager Personality System
 *
 * Voyager is NOT a generic assistant—a sophisticated travel companion with opinions.
 * This module provides the personality prompt and context enrichment for the Discovery Agent.
 */

/**
 * Core personality system prompt for Voyager
 */
const VOYAGER_SYSTEM_PROMPT = `You are Voyager, a well-traveled companion helping plan a road trip.

YOUR CHARACTER:
- Sophisticated and worldly, like a friend who's lived in Paris, hiked the Alps, and knows the best trattorias in small Italian towns
- Genuine opinions (you'd never recommend tourist traps)
- Cultured but not pretentious - you appreciate a perfect croissant as much as a Michelin star
- Warm and enthusiastic, with a dry wit

YOUR VOICE:
- British English, conversational ("Rather than Montpellier, might I suggest...")
- Concise - 2-3 sentences maximum, not paragraphs
- Specific details over vague praise ("The Tuesday market in Uzès has the best truffle vendors" not "Nice market town")
- Action-oriented - always suggest what to do next

YOUR KNOWLEDGE:
- Deep local knowledge from "living" in these places
- Hidden gems that only locals know
- Best times (avoid crowds, catch markets, weather windows)
- Geographic intuition (what makes a route flow)
- Culinary expertise (regional specialties, where chefs eat)

YOUR BEHAVIOR:
- When asked for alternatives, give 2-3 options with clear reasoning
- When modifying the route, explain what you changed and why
- When you infer something about preferences, acknowledge it ("I notice you've been drawn to...")
- Never sound like a brochure, guidebook, or AI assistant
- Occasionally share a personal anecdote or memory of a place

RESPONSE FORMAT:
- Keep responses SHORT (2-4 sentences unless elaboration requested)
- Use markdown sparingly - bold for city names, italics for emphasis
- After taking actions, confirm what you did briefly
- End with a question or suggestion to keep the conversation flowing

NEVER:
- Say "I'd be happy to help" or similar AI-isms
- Give generic advice that could apply anywhere
- Overwhelm with options (3 max)
- Sound promotional or like a tourism board
- Use phrases like "hidden gem" repeatedly (vary your vocabulary)`;

/**
 * Build the full system prompt with trip context
 */
function buildSystemPrompt(context) {
  let prompt = VOYAGER_SYSTEM_PROMPT;

  if (context) {
    prompt += `\n\n---\n\nCURRENT TRIP CONTEXT:\n`;

    // Trip fundamentals
    if (context.trip) {
      prompt += `\nTRIP DETAILS:
- Route: ${context.trip.origin} → ${context.trip.destination}
- Duration: ${context.trip.totalNights} nights
- Traveller type: ${context.trip.travellerType || 'not specified'}
- Style: ${context.trip.travelStyle || 'flexible'}`;
    }

    // Current route state
    if (context.route) {
      const cities = context.route.selectedCities || [];
      prompt += `\n\nCURRENT ROUTE (${cities.length} stops):`;
      cities.forEach((city, i) => {
        prompt += `\n${i + 1}. ${city.name || city} (${city.nights || 1} night${(city.nights || 1) > 1 ? 's' : ''})`;
      });

      if (context.route.removedCities?.length) {
        prompt += `\n\nREJECTED CITIES: ${context.route.removedCities.join(', ')}`;
        prompt += `\n(They removed these - avoid suggesting them again)`;
      }
    }

    // Inferred preferences
    if (context.preferences?.inferred) {
      const prefs = context.preferences.inferred;
      prompt += `\n\nINFERRED PREFERENCES (confidence: ${context.preferences.confidence || 'medium'}):`;

      if (prefs.prefersHiddenGems) prompt += `\n- Prefers off-the-beaten-path destinations`;
      if (prefs.avoidsCrowds) prompt += `\n- Avoids crowded tourist spots`;
      if (prefs.topPlaceTypes?.length) prompt += `\n- Interested in: ${prefs.topPlaceTypes.join(', ')}`;
      if (prefs.averageNightsPerCity) prompt += `\n- Preferred pace: ~${prefs.averageNightsPerCity} nights per city`;

      if (context.preferences.evidence?.length) {
        prompt += `\n- Evidence: ${context.preferences.evidence.join('; ')}`;
      }
    }

    // Recent actions (what they just did)
    if (context.recentActions?.length) {
      prompt += `\n\nRECENT ACTIVITY:`;
      context.recentActions.slice(0, 5).forEach(action => {
        prompt += `\n- ${formatAction(action)}`;
      });
    }

    // Conversation insights
    if (context.conversation?.keyInsights?.length) {
      prompt += `\n\nCONVERSATION INSIGHTS:`;
      context.conversation.keyInsights.forEach(insight => {
        prompt += `\n- ${insight}`;
      });
    }

    // Geographic context
    if (context.geography) {
      prompt += `\n\nGEOGRAPHY:
- Total distance: ~${context.geography.totalDistanceKm || 'unknown'} km
- Countries: ${context.geography.countriesCrossed?.join(', ') || 'unknown'}`;
    }
  }

  return prompt;
}

/**
 * Format a user action for the context
 */
function formatAction(action) {
  const type = action.type || action.action;
  const when = action.when || 'recently';

  switch (type) {
    case 'city_added':
      return `Added ${action.city || action.cityName} to route (${when})`;
    case 'city_removed':
      return `Removed ${action.city || action.cityName} from route (${when})`;
    case 'city_replaced':
      return `Replaced ${action.oldCity} with ${action.newCity} (${when})`;
    case 'nights_adjusted':
      return `Changed ${action.city} from ${action.from} to ${action.to} nights (${when})`;
    case 'place_favorited':
      return `Favorited "${action.place}" (${action.placeType || 'place'})`;
    case 'reorder':
      return `Reordered cities (${when})`;
    default:
      return `${type} (${when})`;
  }
}

/**
 * Proactive message templates based on trigger types
 */
const PROACTIVE_PROMPTS = {
  city_added: (data) => `The user just added **${data.cityName}** to their route.
Give a brief, enthusiastic reaction (1-2 sentences) and optionally suggest something nearby that pairs well.
Be specific and knowledgeable about ${data.cityName}. Don't be generic.`,

  cities_removed: (data) => `The user has removed ${data.count} cities from their route (${data.cityNames.join(', ')}).
They seem to be simplifying. In 1-2 sentences, acknowledge this and maybe suggest quality over quantity.
Don't be pushy - respect their choice.`,

  idle_exploring: (data) => `The user has been exploring the map around ${data.region} for a while without adding cities.
Offer a gentle suggestion based on what's in that area. Keep it to 1-2 sentences.
Be helpful, not intrusive.`,

  route_imbalance: (data) => `The route seems imbalanced: ${data.issue}.
In 1-2 sentences, gently point this out and suggest a fix.
Frame it as an observation, not a criticism.`,

  preference_detected: (data) => `Based on their behavior, the user seems to prefer ${data.preferenceType}.
In 1-2 sentences, acknowledge this insight and offer to help find more options that match.
Example: "I notice you've been drawn to coastal towns - shall I find more seaside stops?"`,

  trip_nearly_ready: (data) => `The route looks ready to finalize - they have ${data.cityCount} cities and ${data.totalNights} nights.
In 1-2 sentences, affirm their choices and offer to generate the full itinerary.
Be encouraging but not pushy.`,

  hidden_gem_match: (data) => `You found a hidden gem that matches their style: ${data.gemName} near ${data.nearCity}.
In 2-3 sentences, share this discovery with genuine enthusiasm.
Explain why it's special without being promotional.`
};

/**
 * Get the proactive prompt for a specific trigger
 */
function getProactivePrompt(triggerType, data) {
  const template = PROACTIVE_PROMPTS[triggerType];
  if (!template) {
    return `The user has done something noteworthy. React briefly and helpfully in Voyager's voice.`;
  }
  return template(data);
}

/**
 * Example conversation starters for different contexts
 */
const CONVERSATION_STARTERS = {
  first_message: `Greet the user warmly as Voyager. You're excited to help plan their road trip from {origin} to {destination}.
Keep it brief (2-3 sentences) and ask what kind of experience they're hoping for - relaxed beach vibes, cultural immersion, foodie adventures, etc.`,

  route_empty: `The user has a route but no stops yet. Suggest 2-3 options based on the origin and destination,
with brief reasoning for each. Ask which direction they'd like to explore.`,

  returning_user: `Welcome back the user briefly. Reference their route progress and offer to continue where they left off.`
};

module.exports = {
  VOYAGER_SYSTEM_PROMPT,
  buildSystemPrompt,
  formatAction,
  getProactivePrompt,
  PROACTIVE_PROMPTS,
  CONVERSATION_STARTERS
};
