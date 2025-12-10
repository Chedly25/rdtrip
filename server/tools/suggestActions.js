/**
 * Tool: Suggest Actions (Quick Action Chips)
 *
 * Allows the AI agent to present interactive quick-reply chips to the user.
 * When included in a response, chips render as colorful tappable buttons.
 *
 * When user taps a chip, its `value` is sent as their next message.
 * This streamlines conversations by giving users one-tap response options.
 *
 * Chip Types:
 * - Travel interests (food, culture, nature, nightlife)
 * - Yes/No confirmations
 * - Pace preferences (relaxed, balanced, packed)
 * - Time of day preferences
 * - "More options" / "This is perfect" choices
 *
 * Usage:
 * 1. Agent calls suggestActions({ chips: [...] })
 * 2. Tool returns { success: true, marker: "[[chips:BASE64...]]" }
 * 3. Agent includes the marker in its response text
 * 4. Frontend renders QuickActionChips component
 */

/**
 * Execute suggest actions
 * @param {Object} params - Tool parameters
 * @param {Array} params.chips - Array of chip objects
 * @param {string} params.chips[].id - Unique chip ID
 * @param {string} params.chips[].label - Display text
 * @param {string} params.chips[].value - Message sent when tapped
 * @param {string} [params.chips[].icon] - Icon name (food, culture, nature, etc.)
 * @param {string} [params.chips[].color] - Color (teal, amber, rose, violet, emerald, sky, orange)
 * @param {string} [params.preset] - Use a preset chip set instead of custom chips
 * @param {Object} context - Agent context
 * @returns {Object} Marker for embedding chips in response
 */
function suggestActions(params, _context) {
  const { chips, preset } = params;

  // Preset chip sets for common scenarios
  const presets = {
    // Travel interest categories
    travelInterests: [
      { id: 'food', label: 'Food & Wine', value: "I'm interested in food and wine experiences", icon: 'food', color: 'amber' },
      { id: 'culture', label: 'Culture & History', value: "I'm interested in culture and history", icon: 'culture', color: 'violet' },
      { id: 'nature', label: 'Nature & Adventure', value: "I'm interested in nature and adventure", icon: 'nature', color: 'emerald' },
      { id: 'nightlife', label: 'Nightlife', value: "I'm interested in nightlife and entertainment", icon: 'nightlife', color: 'rose' },
      { id: 'mix', label: 'Mix of everything', value: 'I want a mix of everything', icon: 'sparkles', color: 'sky' },
    ],

    // Yes/No confirmation
    yesNo: [
      { id: 'yes', label: 'Yes!', value: 'Yes', icon: '👍', color: 'emerald' },
      { id: 'no', label: 'No thanks', value: 'No', icon: '👎', color: 'rose' },
    ],

    // Pace preferences
    pace: [
      { id: 'relaxed', label: 'Relaxed', value: 'I prefer a relaxed pace with fewer activities', icon: 'coffee', color: 'sky' },
      { id: 'balanced', label: 'Balanced', value: 'I prefer a balanced pace', icon: 'compass', color: 'teal' },
      { id: 'packed', label: 'Action-packed', value: 'I prefer an action-packed schedule with lots of activities', icon: 'sparkles', color: 'orange' },
    ],

    // Time of day preferences
    timeOfDay: [
      { id: 'morning', label: 'Morning', value: 'Morning works best for me', icon: 'day', color: 'amber' },
      { id: 'afternoon', label: 'Afternoon', value: 'Afternoon works best for me', icon: 'day', color: 'sky' },
      { id: 'evening', label: 'Evening', value: 'Evening works best for me', icon: 'night', color: 'violet' },
    ],

    // More options / satisfaction
    moreOptions: [
      { id: 'more', label: 'Show me more', value: 'Show me more options', icon: 'sparkles', color: 'teal' },
      { id: 'different', label: 'Something different', value: 'Show me something different', icon: 'compass', color: 'amber' },
      { id: 'perfect', label: 'This is perfect!', value: "This is perfect, let's go with this", icon: 'heart', color: 'rose' },
    ],

    // Budget preferences
    budget: [
      { id: 'budget', label: 'Budget-friendly', value: 'I prefer budget-friendly options', icon: '💰', color: 'emerald' },
      { id: 'moderate', label: 'Moderate', value: 'I prefer moderate pricing', icon: '💳', color: 'sky' },
      { id: 'luxury', label: 'Splurge!', value: "I'm ready to splurge on this trip", icon: '✨', color: 'amber' },
    ],

    // Dining preferences
    dining: [
      { id: 'local', label: 'Local cuisine', value: 'I want to try authentic local cuisine', icon: 'food', color: 'amber' },
      { id: 'international', label: 'International', value: 'I prefer international/familiar food', icon: 'compass', color: 'sky' },
      { id: 'vegetarian', label: 'Vegetarian', value: 'I need vegetarian options', icon: 'nature', color: 'emerald' },
    ],

    // Continue or stop
    continueOrStop: [
      { id: 'continue', label: 'Keep going!', value: "Yes, let's continue planning", icon: 'sparkles', color: 'teal' },
      { id: 'pause', label: "That's enough", value: "That's enough for now, thanks!", icon: 'check', color: 'emerald' },
    ],

    // Accommodation type
    accommodation: [
      { id: 'hotel', label: 'Hotels', value: 'I prefer hotels', icon: '🏨', color: 'sky' },
      { id: 'airbnb', label: 'Airbnb', value: 'I prefer Airbnb/apartments', icon: '🏠', color: 'amber' },
      { id: 'hostel', label: 'Hostels', value: 'I prefer hostels/budget stays', icon: '🛏️', color: 'emerald' },
    ],
  };

  let chipsToUse;

  // Use preset if specified
  if (preset && presets[preset]) {
    chipsToUse = presets[preset];
    console.log(`🎯 [suggestActions] Using preset: ${preset}`);
  } else if (chips && Array.isArray(chips) && chips.length > 0) {
    // Validate custom chips
    chipsToUse = chips.map((chip, index) => ({
      id: chip.id || `chip_${index}`,
      label: chip.label || chip.value,
      value: chip.value,
      icon: chip.icon || null,
      color: chip.color || null,
    }));
    console.log(`🎯 [suggestActions] Using ${chipsToUse.length} custom chips`);
  } else {
    return {
      success: false,
      error: 'Either chips array or preset name is required'
    };
  }

  // Validate we have chips
  if (chipsToUse.length === 0) {
    return {
      success: false,
      error: 'At least one chip is required'
    };
  }

  // Limit to 5 chips max for good UX
  if (chipsToUse.length > 5) {
    chipsToUse = chipsToUse.slice(0, 5);
    console.log('⚠️ [suggestActions] Trimmed chips to 5 max');
  }

  // Encode to base64 for marker
  const chipsData = { chips: chipsToUse };
  const jsonString = JSON.stringify(chipsData);
  const base64Data = Buffer.from(jsonString).toString('base64');
  const marker = `[[chips:${base64Data}]]`;

  console.log(`✅ [suggestActions] Created chips marker with ${chipsToUse.length} options`);

  return {
    success: true,
    marker: marker,
    chips: chipsToUse,
    message: `Include this marker in your response to show quick-reply chips: ${marker}`,
    instructions: 'Include the marker string exactly as provided at the END of your response text. It will render as colorful tappable buttons. When the user taps one, their selected value is sent as their next message.'
  };
}

module.exports = suggestActions;
