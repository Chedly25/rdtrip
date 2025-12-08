/**
 * Companion Booking Prompts
 *
 * WI-10.5: Natural booking suggestions in conversation
 *
 * The companion can suggest bookings when contextually relevant,
 * but should never feel like a salesperson. Think of it as a friend
 * who occasionally mentions "you might want to book that ahead".
 *
 * Design Philosophy:
 * - NATURAL - Suggestions arise from context, not scripts
 * - HELPFUL - Actually useful, not promotional
 * - LEARNABLE - Remembers what users dismiss/ignore
 * - RESPECTFUL - Easy to decline, no guilt trips
 */

import type { EnrichedActivity } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface BookingLearningData {
  /** Total booking suggestions shown */
  totalSuggestions: number;
  /** Suggestions that were dismissed */
  dismissedCount: number;
  /** Suggestions that were clicked */
  clickedCount: number;
  /** Categories user tends to dismiss */
  dismissedCategories: Record<string, number>;
  /** Last suggestion timestamp */
  lastSuggestionAt: number;
  /** User's apparent interest level (0-1) */
  interestLevel: number;
}

export interface BookingContext {
  /** Current city name */
  cityName: string;
  /** Whether user needs accommodation */
  needsAccommodation: boolean;
  /** Upcoming meal times */
  upcomingMeals: ('breakfast' | 'lunch' | 'dinner')[];
  /** Bookable activities nearby */
  bookableActivities: EnrichedActivity[];
  /** Bookable restaurants nearby */
  bookableRestaurants: EnrichedActivity[];
  /** Learning data about user's booking preferences */
  learningData: BookingLearningData;
}

// ============================================================================
// Storage Keys
// ============================================================================

const BOOKING_LEARNING_KEY = 'waycraft_booking_learning';

// ============================================================================
// Learning Data Management
// ============================================================================

/**
 * Get the current booking learning data
 */
export function getBookingLearningData(): BookingLearningData {
  try {
    const stored = localStorage.getItem(BOOKING_LEARNING_KEY);
    if (!stored) {
      return getDefaultLearningData();
    }
    return JSON.parse(stored);
  } catch {
    return getDefaultLearningData();
  }
}

function getDefaultLearningData(): BookingLearningData {
  return {
    totalSuggestions: 0,
    dismissedCount: 0,
    clickedCount: 0,
    dismissedCategories: {},
    lastSuggestionAt: 0,
    interestLevel: 0.5, // Start neutral
  };
}

/**
 * Record a booking suggestion shown
 */
export function recordBookingSuggestion(_category: string): void {
  try {
    const data = getBookingLearningData();
    data.totalSuggestions++;
    data.lastSuggestionAt = Date.now();
    localStorage.setItem(BOOKING_LEARNING_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Record when user dismisses a booking suggestion
 */
export function recordBookingDismissal(category: string): void {
  try {
    const data = getBookingLearningData();
    data.dismissedCount++;
    data.dismissedCategories[category] = (data.dismissedCategories[category] || 0) + 1;

    // Recalculate interest level
    const totalResponses = data.dismissedCount + data.clickedCount;
    if (totalResponses > 0) {
      data.interestLevel = data.clickedCount / totalResponses;
    }

    localStorage.setItem(BOOKING_LEARNING_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Record when user clicks a booking link
 */
export function recordBookingClick(_category: string): void {
  try {
    const data = getBookingLearningData();
    data.clickedCount++;

    // Recalculate interest level
    const totalResponses = data.dismissedCount + data.clickedCount;
    if (totalResponses > 0) {
      data.interestLevel = data.clickedCount / totalResponses;
    }

    localStorage.setItem(BOOKING_LEARNING_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if we should suggest bookings less frequently
 */
export function shouldReduceBookingSuggestions(): boolean {
  const data = getBookingLearningData();

  // If they've dismissed more than 70% of suggestions, pull back
  if (data.totalSuggestions >= 5 && data.interestLevel < 0.3) {
    return true;
  }

  return false;
}

/**
 * Check if a specific category should be avoided
 */
export function shouldAvoidCategory(category: string): boolean {
  const data = getBookingLearningData();
  const dismissals = data.dismissedCategories[category] || 0;

  // If they've dismissed this category 3+ times, avoid it
  return dismissals >= 3;
}

/**
 * Get time since last suggestion in minutes
 */
export function getMinutesSinceLastSuggestion(): number {
  const data = getBookingLearningData();
  if (!data.lastSuggestionAt) return Infinity;
  return (Date.now() - data.lastSuggestionAt) / (1000 * 60);
}

// ============================================================================
// Booking Behaviour Guidelines (for system prompt)
// ============================================================================

/**
 * Core booking behaviour rules for the companion
 */
export const BOOKING_BEHAVIOUR = `## Suggesting Bookings

You can naturally suggest bookings when it genuinely helps them - but you're not a salesperson. Think of how a local friend might casually mention "that place gets busy, might want to book" rather than actively trying to sell something.

**When suggesting bookings makes sense:**
- Popular restaurants at peak times: "Le Bistro gets packed for dinner - might be worth grabbing a spot"
- Timed attractions: "The Louvre skip-the-line tickets are actually worth it"
- They mentioned wanting to try something: "I can help you book that wine tour if you're interested"
- Arriving in a new city without accommodation: "Need help finding a place to stay in Lyon?"

**How to suggest naturally:**
- Weave it into practical advice, don't make it the focus
- Offer to help, don't push
- One mention is enough - if they don't engage, move on
- Be honest about whether booking is actually necessary

**What NOT to do:**
- ❌ "Here are 5 booking options for you!"
- ❌ "Don't miss out! Book now!"
- ❌ "I found these great deals..."
- ❌ Suggest booking for things that don't need it
- ❌ Repeatedly mention bookings they've ignored

**Good examples:**
- "That place is popular, especially weekend evenings. Want me to check if they take reservations?"
- "If you're set on the Vatican, the queue can be brutal. Skip-the-line is genuinely worth it there"
- "There's a great food tour that covers those markets - interested, or prefer to explore on your own?"

**Bad examples:**
- "I recommend booking through our partner for the best prices!"
- "Here are today's top booking deals in Florence..."
- "You should definitely book this, it's really popular!"`;

/**
 * Booking-specific proactive messages
 */
export const BOOKING_PROACTIVE_FORMATS = `### The Booking Nudge

Use sparingly - only when booking genuinely makes a difference.

**Format:** [Context] + [Why booking matters] + [Offer to help]

**Examples:**

Good: "That restaurant you mentioned has fantastic reviews but only 20 tables. If you're thinking Friday night, worth grabbing a spot. Want me to help?"

Good: "The Colosseum at 10am without tickets is a 2-hour queue situation. There's skip-the-line options that are actually worth it - want me to show you?"

Good: "Arriving in Barcelona tomorrow without a hotel sorted? I can find some options in your budget if helpful"

**Remember:**
- They can always figure out bookings themselves
- You're offering help, not selling
- If they don't respond, don't ask again
- Some people just prefer to wing it - respect that`;

// ============================================================================
// Booking Context Generator
// ============================================================================

/**
 * Identify bookable categories
 */
const BOOKABLE_ACTIVITY_CATEGORIES = [
  'museum', 'gallery', 'landmark', 'monument', 'attraction',
  'tour', 'experience', 'castle', 'palace', 'church', 'temple',
];

const DINING_CATEGORIES = [
  'restaurant', 'cafe', 'bar', 'bistro', 'brasserie',
];

function isBookableActivity(category: string): boolean {
  return BOOKABLE_ACTIVITY_CATEGORIES.some(bc =>
    category.toLowerCase().includes(bc)
  );
}

function isDiningPlace(category: string): boolean {
  return DINING_CATEGORIES.some(dc =>
    category.toLowerCase().includes(dc)
  );
}

/**
 * Generate booking context section for the system prompt
 */
export function generateBookingContext(context: BookingContext): string {
  const learningData = context.learningData;

  // Check if we should pull back on suggestions
  const shouldPullBack = shouldReduceBookingSuggestions();

  const sections: string[] = [];

  // Overall booking behaviour guidance based on learning
  if (shouldPullBack) {
    sections.push(`**Booking Suggestions:** User rarely engages with booking suggestions - keep them very minimal. Only mention if they directly ask or it's truly essential (like a sold-out attraction).`);
  } else if (learningData.interestLevel > 0.6) {
    sections.push(`**Booking Suggestions:** User has shown interest in booking suggestions - feel free to mention relevant options naturally.`);
  } else {
    sections.push(`**Booking Suggestions:** Standard approach - mention bookings when contextually relevant, but don't push.`);
  }

  // Accommodation status
  if (context.needsAccommodation) {
    sections.push(`**Accommodation:** They may need accommodation in ${context.cityName}. If the topic comes up, offer to help find options.`);
  }

  // Upcoming meals
  if (context.upcomingMeals.length > 0) {
    const mealList = context.upcomingMeals.join(', ');
    sections.push(`**Upcoming Meals:** ${mealList}. If they mention being hungry or ask for restaurant recommendations, you can offer to help book popular spots.`);
  }

  // Bookable activities nearby
  if (context.bookableActivities.length > 0) {
    const activityNames = context.bookableActivities
      .slice(0, 3)
      .map(a => a.activity.place.name)
      .join(', ');
    sections.push(`**Bookable Attractions Nearby:** ${activityNames}. Only mention booking if they express interest or ask about queues.`);
  }

  // Bookable restaurants nearby
  if (context.bookableRestaurants.length > 0 && !shouldAvoidCategory('restaurant')) {
    const restaurantNames = context.bookableRestaurants
      .slice(0, 3)
      .map(r => r.activity.place.name)
      .join(', ');
    sections.push(`**Notable Restaurants Nearby:** ${restaurantNames}. Mention reservations only if they're asking about dinner plans or it's peak hours.`);
  }

  // Categories to avoid based on dismissals
  const avoidedCategories = Object.entries(learningData.dismissedCategories)
    .filter(([, count]) => count >= 3)
    .map(([cat]) => cat);

  if (avoidedCategories.length > 0) {
    sections.push(`**Note:** User tends to dismiss booking suggestions for: ${avoidedCategories.join(', ')}. Avoid suggesting bookings in these categories.`);
  }

  if (sections.length === 0) {
    return '';
  }

  return `## Booking Context

${sections.join('\n\n')}`;
}

/**
 * Generate booking context from recommendations
 */
export function generateBookingContextFromRecommendations(
  cityName: string,
  recommendations: EnrichedActivity[],
  currentHour: number,
  needsAccommodation: boolean = false
): BookingContext {
  // Determine upcoming meals based on time
  const upcomingMeals: ('breakfast' | 'lunch' | 'dinner')[] = [];
  if (currentHour >= 6 && currentHour < 10) upcomingMeals.push('breakfast');
  if (currentHour >= 10 && currentHour < 14) upcomingMeals.push('lunch');
  if (currentHour >= 16 && currentHour < 21) upcomingMeals.push('dinner');

  // Filter bookable activities
  const bookableActivities = recommendations.filter(rec => {
    const category = rec.activity.place?.category || '';
    return isBookableActivity(category);
  });

  // Filter bookable restaurants
  const bookableRestaurants = recommendations.filter(rec => {
    const category = rec.activity.place?.category || '';
    return isDiningPlace(category);
  });

  return {
    cityName,
    needsAccommodation,
    upcomingMeals,
    bookableActivities,
    bookableRestaurants,
    learningData: getBookingLearningData(),
  };
}

// ============================================================================
// Conversational Booking Prompts
// ============================================================================

/**
 * Generate a conversational prompt for when user asks about a specific place
 * and booking might be helpful
 */
export function generateBookingConversationPrompt(
  placeName: string,
  placeCategory: string,
  context: { isPopular?: boolean; isPeakTime?: boolean; queueTypical?: boolean }
): string {
  const prompts: string[] = [];

  if (context.isPopular) {
    prompts.push(`${placeName} is quite popular`);
  }

  if (context.isPeakTime) {
    prompts.push(`it's peak hours`);
  }

  if (context.queueTypical) {
    prompts.push(`there's often a queue`);
  }

  if (prompts.length === 0) {
    return ''; // Don't suggest booking if there's no good reason
  }

  const reasonPhrase = prompts.join(' and ');

  if (isDiningPlace(placeCategory)) {
    return `Since ${reasonPhrase}, you might want to make a reservation. I can help if you'd like.`;
  } else if (isBookableActivity(placeCategory)) {
    return `Since ${reasonPhrase}, skip-the-line tickets might be worth it. Want me to show you options?`;
  }

  return '';
}

// ============================================================================
// Export
// ============================================================================

export {
  isBookableActivity,
  isDiningPlace,
  BOOKABLE_ACTIVITY_CATEGORIES,
  DINING_CATEGORIES,
};
