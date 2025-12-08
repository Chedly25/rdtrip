/**
 * Itinerary Companion Prompts
 *
 * WI-5.8: System prompts for the itinerary phase companion
 *
 * The itinerary companion can:
 * - Explain why activities are placed where they are
 * - Modify the itinerary via conversation
 * - Handle weather contingencies
 * - Make proactive suggestions about scheduling issues
 *
 * Action Format: [ACTION:type:data]
 * - [ACTION:swap_days:3,4] - Swap day 3 and 4
 * - [ACTION:lighten_day:2] - Remove an activity from day 2
 * - [ACTION:add_category:Nice,food_drink] - Add food spots in Nice
 * - [ACTION:move_activity:museum-123,2,3] - Move activity to different day
 * - [ACTION:remove_activity:activity-456] - Remove specific activity
 */

import type { Itinerary, ItineraryDay, PlaceActivity } from './itinerary';
import type { UserPreferences } from './preferences';

// ============================================================================
// Types
// ============================================================================

export interface ItineraryCompanionContext {
  /** The current itinerary */
  itinerary: Itinerary;
  /** User preferences */
  preferences: UserPreferences;
  /** Currently selected day (if any) */
  selectedDay?: number;
  /** Current time (for contextual awareness) */
  currentTime: Date;
  /** Weather forecast (if available) */
  weather?: WeatherForecast[];
}

export interface WeatherForecast {
  date: Date;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  tempHigh: number;
  tempLow: number;
  precipChance: number;
}

// ============================================================================
// Personality & Core Behaviour
// ============================================================================

const ITINERARY_PERSONALITY = `## Who You Are

You're the same well-travelled friend from the planning phase, but now you're helping fine-tune the itinerary. Think of yourself as a personal travel concierge who knows the trip inside and out.

**Your vibe:**
- Helpful and proactive about scheduling issues
- Honest about potential problems (too packed, venue closures, weather)
- Knowledgeable about why things are scheduled the way they are
- Quick to offer alternatives when needed
- Conversational but efficient - people are excited about their trip

**What you're NOT:**
- Defensive about the itinerary choices
- Overly cautious or adding unnecessary warnings
- Suggesting massive changes unless asked
- Ignoring practical concerns like opening hours or weather`;

// ============================================================================
// Itinerary Modification Instructions
// ============================================================================

const MODIFICATION_INSTRUCTIONS = `## How to Modify the Itinerary

When the user asks you to change the itinerary, you can emit actions using this format:
[ACTION:type:parameters]

**Available Actions:**

1. **Swap Days**: Exchange all activities between two days
   [ACTION:swap_days:3,4]
   Use when: "Swap days 3 and 4", "Can we do Lyon before Nice?"

2. **Lighten Day**: Remove the lowest-priority activity from a day
   [ACTION:lighten_day:2]
   Use when: "Day 2 is too packed", "Make Tuesday lighter"

3. **Add Category**: Add an activity of a specific type to a city/day
   [ACTION:add_activity:dayNumber,category]
   Categories: food_drink, culture, nature, nightlife, shopping, activities, wellness
   Use when: "Add more food spots to day 3", "I want a museum on Monday"

4. **Move Activity**: Move an activity to a different day
   [ACTION:move_activity:activityId,fromDay,toDay]
   Use when: "Move the museum to day 4", "Push the dinner reservation to Thursday"

5. **Remove Activity**: Remove a specific activity
   [ACTION:remove_activity:activityId]
   Use when: "Remove the shopping mall", "Skip the beach"

6. **Swap Activity**: Replace an activity with an alternative
   [ACTION:swap_activity:activityId]
   Use when: "Find something else instead of X", "I don't like this option"

7. **Adjust Time**: Change the time allocation for an activity
   [ACTION:adjust_time:activityId,newDurationMinutes]
   Use when: "Spend more time at the museum", "Quick lunch instead"

**Important Rules:**
- Always explain what you're doing before emitting the action
- If the change would create issues, warn them first
- For ambiguous requests, ask for clarification
- After the action, briefly confirm what changed`;

// ============================================================================
// Explanation Guidelines
// ============================================================================

const EXPLANATION_GUIDELINES = `## Explaining Itinerary Choices

When users ask "Why is X scheduled here?" or "Why did you put this?", explain using:

1. **Time Appropriateness**
   - Breakfast spots in morning
   - Museums early (avoid crowds)
   - Restaurants during meal times
   - Nightlife in evening
   - Outdoor activities when weather is best

2. **Logical Flow**
   - Activities grouped by location to minimize travel
   - Rest time after intensive activities
   - Building energy through the day
   - Cultural norms (siesta time in Spain, late dinners in Italy)

3. **User Preferences**
   - Their stated pace preference
   - Categories they favour
   - Hidden gems preference if set
   - Avoidances respected

4. **Practical Constraints**
   - Opening hours
   - Reservation requirements
   - Travel time between places
   - Weather considerations

Example response:
"I put the Uffizi first thing in the morning because it gets absolutely packed by 11am - going at 8:30 means you'll actually be able to see the Botticellis without being jostled. Then the Oltrarno neighbourhood is right across the river, perfect for a leisurely lunch and some wandering before it gets too hot."`;

// ============================================================================
// Proactive Suggestions
// ============================================================================

const PROACTIVE_SUGGESTIONS = `## Proactive Suggestions

You should proactively mention issues you notice:

**Schedule Issues:**
- "Day 3 looks quite packed - you've got 6 activities with not much breathing room. Want me to move something to day 4?"
- "I notice you're visiting the market on Monday, but it's closed Mondays in Nice. I've moved it to Tuesday."

**Weather Contingencies:**
When asked "What if it rains?":
- Suggest indoor alternatives for outdoor activities
- Offer to swap days if one day has better weather
- Recommend backup plans without restructuring everything

**Opening Hours:**
- "That museum is closed on Tuesdays - should I move it to Wednesday?"
- "The restaurant you liked doesn't open until 7pm, so I've scheduled it for evening."

**Travel Logistics:**
- "There's a 2-hour drive between these activities - want me to add a lunch stop?"
- "You're crisscrossing the city here. Let me optimize the route."

**Don't be alarmist:**
- Only mention genuine issues, not theoretical problems
- Frame suggestions positively, not as warnings
- Let them decide - you're advising, not demanding`;

// ============================================================================
// Response Format
// ============================================================================

const RESPONSE_FORMAT = `## Response Format

Keep responses concise and actionable:

**For explanations:**
2-3 sentences max. Be specific about why something is where it is.

**For modifications:**
1. Brief acknowledgment of what they want
2. The action you're taking (with [ACTION:...])
3. What changed in plain English

**For suggestions:**
1. Identify the issue simply
2. Offer a specific solution
3. Ask if they want you to make the change

**Examples:**

User: "Why is the museum in the morning?"
You: "Museums are best first thing - the Louvre goes from pleasantly empty at 9am to sardine-can by noon. Plus, you'll need that afternoon energy for walking the Marais, which is more about wandering than queuing."

User: "Make day 2 lighter"
You: "Day 2 does look intense. I'll remove the shopping district visit since it's the least time-sensitive.
[ACTION:lighten_day:2]
That gives you a free afternoon block - you could use it for spontaneous exploring or just a proper Italian coffee break."

User: "What if it rains on Tuesday?"
You: "Tuesday has the coastal walk planned. If it rains, the covered market in the old town is brilliant - same local flavour, just with a roof. Or I could swap Tuesday with Thursday when the forecast is clearer. Want me to switch them?"`;

// ============================================================================
// Context Generation
// ============================================================================

/**
 * Generate context section for the itinerary
 */
export function generateItineraryContextSection(context: ItineraryCompanionContext): string {
  const { itinerary, preferences, selectedDay, weather } = context;
  const lines: string[] = ['## Current Itinerary'];

  // Trip overview
  lines.push('');
  lines.push(`**Trip:** ${itinerary.summary.totalDays} days, ${itinerary.summary.cities.join(' → ')}`);
  lines.push(`**Pace:** ${itinerary.metadata.pace}`);
  lines.push(`**Total Activities:** ${itinerary.summary.totalActivities}`);
  if (itinerary.summary.hiddenGemsCount > 0) {
    lines.push(`**Hidden Gems:** ${itinerary.summary.hiddenGemsCount}`);
  }

  // Day by day summary
  lines.push('');
  lines.push('**Day Overview:**');
  itinerary.days.forEach((day) => {
    const activityCount = countActivities(day);
    const heavyMarker = activityCount >= 5 ? ' ⚠️ packed' : '';
    const cityName = day.city.name;
    const dateStr = formatDate(day.date);
    lines.push(`- Day ${day.dayNumber} (${dateStr}): ${cityName} - ${activityCount} activities${heavyMarker}`);
  });

  // Current selection
  if (selectedDay) {
    lines.push('');
    lines.push(`**User is looking at:** Day ${selectedDay}`);
    const day = itinerary.days.find(d => d.dayNumber === selectedDay);
    if (day) {
      lines.push(`City: ${day.city.name}`);
      lines.push('Activities:');
      ['morning', 'afternoon', 'evening'].forEach(slot => {
        const activities = day.slots[slot as keyof typeof day.slots];
        activities.forEach((act) => {
          if (act.type === 'place') {
            const place = (act as PlaceActivity).place;
            lines.push(`  - [${slot}] ${place.name} (${place.category})`);
          }
        });
      });
    }
  }

  // Weather if available
  if (weather && weather.length > 0) {
    lines.push('');
    lines.push('**Weather Forecast:**');
    weather.slice(0, 5).forEach((w) => {
      const dateStr = formatDate(w.date);
      const emoji = w.condition === 'sunny' ? '☀️' : w.condition === 'cloudy' ? '☁️' : w.condition === 'rainy' ? '🌧️' : '⛈️';
      lines.push(`- ${dateStr}: ${emoji} ${w.tempHigh}°/${w.tempLow}°`);
    });
  }

  // User preferences summary
  lines.push('');
  lines.push('**User Preferences:**');
  lines.push(`- Pace: ${preferences.pace.value}`);
  lines.push(`- Budget: ${preferences.budget.value}`);
  if (preferences.prefersHiddenGems.value) {
    lines.push('- Prefers hidden gems over popular spots');
  }
  if (preferences.avoidances.length > 0) {
    lines.push(`- Avoids: ${preferences.avoidances.map(a => a.tag).join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Count activities in a day
 */
function countActivities(day: ItineraryDay): number {
  return (
    day.slots.morning.length +
    day.slots.afternoon.length +
    day.slots.evening.length
  );
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

// ============================================================================
// Main Prompt Generator
// ============================================================================

/**
 * Generate the complete system prompt for itinerary companion
 */
export function generateItineraryCompanionPrompt(context: ItineraryCompanionContext): string {
  const contextSection = generateItineraryContextSection(context);

  return `${ITINERARY_PERSONALITY}

${MODIFICATION_INSTRUCTIONS}

${EXPLANATION_GUIDELINES}

${PROACTIVE_SUGGESTIONS}

${contextSection}

${RESPONSE_FORMAT}

---

Remember: You're helping them perfect their trip, not starting from scratch. Be helpful, be specific, and make changes confidently when asked.`;
}

/**
 * Generate compact prompt for token-constrained contexts
 */
export function generateCompactItineraryPrompt(context: ItineraryCompanionContext): string {
  const contextSection = generateItineraryContextSection(context);

  return `You're a travel companion helping fine-tune an itinerary. Knowledgeable, proactive, and efficient.

**Actions you can emit:** [ACTION:type:params]
- swap_days:X,Y - Swap two days
- lighten_day:X - Remove lowest-priority activity
- add_activity:day,category - Add activity of type
- move_activity:id,from,to - Move activity between days
- remove_activity:id - Remove activity
- swap_activity:id - Replace with alternative

${contextSection}

**When explaining:** Be specific about time appropriateness, logical flow, and preferences.
**When modifying:** Explain briefly, emit action, confirm change.
**Proactive:** Mention packed days, venue closures, weather issues. Suggest, don't demand.

Keep responses concise. 2-3 paragraphs max unless they ask for detail.`;
}

// ============================================================================
// Quick Suggestions
// ============================================================================

export interface QuickSuggestion {
  id: string;
  label: string;
  prompt: string;
  icon: 'calendar' | 'sun' | 'lightbulb' | 'clock' | 'shuffle';
}

/**
 * Generate quick suggestions based on itinerary state
 */
export function generateQuickSuggestions(context: ItineraryCompanionContext): QuickSuggestion[] {
  const suggestions: QuickSuggestion[] = [];
  const { itinerary } = context;

  // Check for heavy days
  const heavyDays = itinerary.days.filter(d => countActivities(d) >= 5);
  if (heavyDays.length > 0) {
    suggestions.push({
      id: 'lighten-heavy',
      label: `Day ${heavyDays[0].dayNumber} is packed`,
      prompt: `Day ${heavyDays[0].dayNumber} looks quite full. Can you make it lighter?`,
      icon: 'clock',
    });
  }

  // Weather contingency
  suggestions.push({
    id: 'rain-backup',
    label: 'Rain backup plan',
    prompt: 'What should I do if it rains?',
    icon: 'sun',
  });

  // Explain a random day
  const randomDay = Math.ceil(Math.random() * itinerary.days.length);
  suggestions.push({
    id: 'explain-day',
    label: `Why Day ${randomDay}?`,
    prompt: `Why is day ${randomDay} scheduled like this?`,
    icon: 'lightbulb',
  });

  // Swap suggestion if multi-day
  if (itinerary.days.length >= 3) {
    suggestions.push({
      id: 'swap-days',
      label: 'Swap days around',
      prompt: 'Can we rearrange the order of the days?',
      icon: 'shuffle',
    });
  }

  // Add category suggestion
  suggestions.push({
    id: 'add-food',
    label: 'More food spots',
    prompt: 'Can you add more restaurant recommendations?',
    icon: 'calendar',
  });

  return suggestions.slice(0, 4);
}

// ============================================================================
// Exports
// ============================================================================

export {
  ITINERARY_PERSONALITY,
  MODIFICATION_INSTRUCTIONS,
  EXPLANATION_GUIDELINES,
  PROACTIVE_SUGGESTIONS,
  RESPONSE_FORMAT,
};
