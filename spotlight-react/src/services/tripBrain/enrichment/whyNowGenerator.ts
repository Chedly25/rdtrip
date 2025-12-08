/**
 * Why Now Generator
 *
 * WI-6.7: Generates contextual "Why Now" recommendations
 *
 * The Why Now Generator creates human-readable, contextual reasons
 * explaining why a particular activity is recommended at this moment.
 * It considers:
 *
 * - Distance and travel time
 * - Time of day and timing windows
 * - Weather conditions
 * - User preferences and history
 * - Crowd patterns
 * - Special timing (golden hour, happy hour, etc.)
 * - Opening/closing times
 * - Hidden gem status
 *
 * Key Features:
 * - Multiple message styles (short, detailed, conversational)
 * - Icon mapping for UI display
 * - Urgency detection (closing soon, limited availability)
 * - Insider tips and local recommendations
 * - Weather-aware suggestions
 */

import type { PlaceActivity } from '../../itinerary';
import type {
  WhyNowReason,
  WhyNowCategory,
  WeatherContext,
  LocationContext,
  ScoreBreakdown,
} from '../types';
import type { WaycraftCategory } from '../../../utils/placeCategories';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Message style for WhyNow reasons
 */
export type MessageStyle = 'short' | 'detailed' | 'conversational';

/**
 * Why Now generator configuration
 */
export interface WhyNowGeneratorConfig {
  /** Message style to use */
  style: MessageStyle;
  /** Include insider tips */
  includeTips: boolean;
  /** Include urgency messages */
  includeUrgency: boolean;
  /** Maximum tip length in characters */
  maxTipLength: number;
  /** Time window for "closing soon" warning (minutes) */
  closingSoonMinutes: number;
  /** Time window for "opens soon" message (minutes) */
  opensSoonMinutes: number;
}

/**
 * Default configuration
 */
export const DEFAULT_WHY_NOW_CONFIG: WhyNowGeneratorConfig = {
  style: 'short',
  includeTips: true,
  includeUrgency: true,
  maxTipLength: 100,
  closingSoonMinutes: 60,
  opensSoonMinutes: 30,
};

// ============================================================================
// Icon Mapping
// ============================================================================

/**
 * Icon names for each WhyNow category (Lucide icons)
 */
export const WHY_NOW_ICONS: Record<WhyNowCategory, string> = {
  distance: 'MapPin',
  time: 'Clock',
  preference: 'Heart',
  weather: 'Cloud',
  serendipity: 'Sparkles',
  timing: 'Sunrise',
  crowd: 'Users',
  scheduled: 'Calendar',
  trending: 'TrendingUp',
  special: 'Star',
};

/**
 * Get icon for a WhyNow category
 */
export function getWhyNowIcon(category: WhyNowCategory): string {
  return WHY_NOW_ICONS[category] || 'Info';
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Full context for WhyNow generation
 */
export interface WhyNowContext {
  /** The activity being evaluated */
  activity: PlaceActivity;

  /** Score breakdown from combined scorer */
  scoreBreakdown?: ScoreBreakdown;

  /** User's current location */
  userLocation?: LocationContext;

  /** Distance in meters */
  distanceMeters?: number;

  /** Walking time in minutes */
  walkingTimeMinutes?: number;

  /** Current weather */
  weather?: WeatherContext;

  /** Current hour (0-23) */
  currentHour: number;

  /** Is the place currently open */
  isOpen?: boolean;

  /** When does it close (if open) */
  closesAt?: string;

  /** When does it open (if closed) */
  opensAt?: string;

  /** Is this a hidden gem */
  isHiddenGem: boolean;

  /** User's preference score for this activity */
  preferenceScore?: number;

  /** Matched preference tags */
  matchedPreferences?: string[];

  /** Is this on the user's itinerary for today */
  isScheduledToday?: boolean;
}

// ============================================================================
// Reason Templates
// ============================================================================

/**
 * Distance-based reason templates
 */
const DISTANCE_TEMPLATES = {
  short: {
    immediate: 'Right here',
    veryClose: '{distance} away',
    walking: '{time} min walk',
    nearby: '{distance} · {time} min',
  },
  detailed: {
    immediate: 'Right around the corner from you',
    veryClose: 'Just {distance} away from your location',
    walking: 'A pleasant {time} minute walk from here',
    nearby: '{distance} away, about {time} minutes on foot',
  },
  conversational: {
    immediate: "You're practically there already!",
    veryClose: "It's just {distance} away - super close!",
    walking: "A nice {time} minute stroll from where you are",
    nearby: "About {time} minutes away - perfect walking distance",
  },
};

/**
 * Time-based reason templates
 */
const TIME_TEMPLATES = {
  short: {
    perfectTime: 'Perfect timing',
    goldenHour: 'Golden hour soon',
    mealTime: 'Great for {meal}',
    happyHour: 'Happy hour!',
    beforeCrowd: 'Beat the crowds',
    closingSoon: 'Closes in {time}',
    openingSoon: 'Opens in {time}',
  },
  detailed: {
    perfectTime: 'Ideal time to visit right now',
    goldenHour: 'Golden hour lighting in about {time} minutes',
    mealTime: 'Perfect timing for {meal}',
    happyHour: 'Happy hour is on right now',
    beforeCrowd: 'Get there before the crowds arrive',
    closingSoon: 'Closing in {time} - still time to visit',
    openingSoon: 'Opens in just {time} minutes',
  },
  conversational: {
    perfectTime: "This is actually the perfect time to go",
    goldenHour: "The light will be amazing there in about {time} minutes",
    mealTime: "Great timing if you're thinking about {meal}",
    happyHour: "They've got happy hour going on!",
    beforeCrowd: "Go now and you'll beat the crowds",
    closingSoon: "Heads up - they close in {time}",
    openingSoon: "They open in {time} minutes - perfect timing",
  },
};

/**
 * Weather-based reason templates
 */
const WEATHER_TEMPLATES = {
  short: {
    perfectOutdoor: 'Perfect weather',
    stayDry: 'Stay dry inside',
    coolOff: 'Great place to cool off',
    warmUp: 'Warm up inside',
    sunsetViews: 'Sunset views',
  },
  detailed: {
    perfectOutdoor: 'Perfect weather for outdoor activities',
    stayDry: 'Great indoor option while it rains',
    coolOff: 'A cool escape from the heat',
    warmUp: 'Cozy spot to warm up',
    sunsetViews: 'Amazing sunset views from here',
  },
  conversational: {
    perfectOutdoor: "The weather is perfect for this right now",
    stayDry: "A great spot to duck in and stay dry",
    coolOff: "Good place to escape the heat for a bit",
    warmUp: "Nice and warm inside - just what you need",
    sunsetViews: "You might catch an amazing sunset from here",
  },
};

/**
 * Preference-based reason templates
 */
const PREFERENCE_TEMPLATES = {
  short: {
    strongMatch: 'Your style',
    categoryMatch: 'You love {category}',
    tagMatch: 'Matches: {tags}',
    hiddenGem: 'Hidden gem',
  },
  detailed: {
    strongMatch: 'This really matches your taste',
    categoryMatch: 'Right up your alley - you love {category}',
    tagMatch: 'Matches your interest in {tags}',
    hiddenGem: 'A hidden gem most tourists miss',
  },
  conversational: {
    strongMatch: "This one's totally your style",
    categoryMatch: "Since you love {category}, you'll probably love this",
    tagMatch: "This matches your thing for {tags}",
    hiddenGem: "A local secret - not many tourists know about it",
  },
};

/**
 * Serendipity reason templates
 */
const SERENDIPITY_TEMPLATES = {
  short: {
    hiddenGem: 'Hidden gem',
    fewReviews: 'Under the radar',
    localFavorite: 'Local favorite',
    unexpected: 'Surprise find',
  },
  detailed: {
    hiddenGem: 'A true hidden gem discovery',
    fewReviews: 'Flying under the radar with just {count} reviews',
    localFavorite: 'A local favorite the tourists miss',
    unexpected: 'Something unexpected you might love',
  },
  conversational: {
    hiddenGem: "This is one of those hidden gems",
    fewReviews: "Only {count} reviews - you're discovering it early",
    localFavorite: "The locals love this place",
    unexpected: "Here's something different you might enjoy",
  },
};

// ============================================================================
// Tip Templates
// ============================================================================

/**
 * Category-specific tips
 */
const CATEGORY_TIPS: Partial<Record<WaycraftCategory, string[]>> = {
  food_drink: [
    'Try asking for the daily special',
    'The outdoor seating has great views',
    'Reservations recommended for dinner',
    'Known for their homemade desserts',
    'Popular brunch spot on weekends',
  ],
  culture: [
    'Audio guides available at the entrance',
    'Free admission on the first Sunday of the month',
    'The gift shop has unique local crafts',
    'Guided tours start every hour',
    'Photography allowed without flash',
  ],
  nature: [
    'Bring water and sunscreen',
    'Best views from the upper trail',
    'Early morning has fewer crowds',
    'Sunset is spectacular from here',
    'Watch for wildlife in the early morning',
  ],
  nightlife: [
    'Best atmosphere after 10pm',
    'Happy hour ends at 7pm',
    'Live music on weekends',
    'No cover charge before 9pm',
    'Known for their craft cocktails',
  ],
  shopping: [
    'Bargaining is expected at this market',
    'Best selection in the morning',
    'Local artisans sell here on weekends',
    'Tax refund available for tourists',
    'Unique handmade items upstairs',
  ],
  activities: [
    'Book in advance during peak season',
    'Comfortable shoes recommended',
    'Great for photos',
    'Family-friendly activity',
    'Best experienced in small groups',
  ],
  wellness: [
    'Booking recommended',
    'Arrive 15 minutes early',
    'Couples treatments available',
    'Bring your own yoga mat',
    'Towels and robes provided',
  ],
};

/**
 * Get a random tip for a category
 */
export function getRandomTip(category: WaycraftCategory): string | undefined {
  const tips = CATEGORY_TIPS[category];
  if (!tips || tips.length === 0) return undefined;
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Hidden gem tip templates
 */
const HIDDEN_GEM_TIPS = [
  'A local favorite that most tourists miss',
  'Discovered by only a handful of travelers',
  'The kind of place locals keep to themselves',
  'Off the beaten path but worth the visit',
  "Not in the guidebooks - that's the beauty of it",
];

/**
 * Get hidden gem tip
 */
export function getHiddenGemTip(): string {
  return HIDDEN_GEM_TIPS[Math.floor(Math.random() * HIDDEN_GEM_TIPS.length)];
}

// ============================================================================
// Core Generation Functions
// ============================================================================

/**
 * Generate a distance-based reason
 */
export function generateDistanceReason(
  distanceMeters: number | undefined,
  walkingTimeMinutes: number | undefined,
  style: MessageStyle = 'short'
): { text: string; category: WhyNowCategory } | undefined {
  if (distanceMeters === undefined) return undefined;

  const templates = DISTANCE_TEMPLATES[style];
  let text: string;

  if (distanceMeters < 100) {
    text = templates.immediate;
  } else if (distanceMeters < 300) {
    text = templates.veryClose
      .replace('{distance}', `${Math.round(distanceMeters)}m`);
  } else if (walkingTimeMinutes && walkingTimeMinutes <= 15) {
    text = templates.walking
      .replace('{time}', String(walkingTimeMinutes));
  } else {
    const distance = distanceMeters < 1000
      ? `${Math.round(distanceMeters)}m`
      : `${(distanceMeters / 1000).toFixed(1)}km`;
    text = templates.nearby
      .replace('{distance}', distance)
      .replace('{time}', String(walkingTimeMinutes || Math.ceil(distanceMeters / 80)));
  }

  return { text, category: 'distance' };
}

/**
 * Generate a time-based reason
 */
export function generateTimeReason(
  context: WhyNowContext,
  style: MessageStyle = 'short'
): { text: string; category: WhyNowCategory } | undefined {
  const templates = TIME_TEMPLATES[style];
  const hour = context.currentHour;

  // Check if closing soon
  if (context.isOpen && context.closesAt) {
    const closeHour = parseInt(context.closesAt.split(':')[0], 10);
    const minutesUntilClose = (closeHour - hour) * 60;
    if (minutesUntilClose > 0 && minutesUntilClose <= 60) {
      return {
        text: templates.closingSoon.replace('{time}', `${minutesUntilClose} min`),
        category: 'time',
      };
    }
  }

  // Check if opening soon
  if (!context.isOpen && context.opensAt) {
    const openHour = parseInt(context.opensAt.split(':')[0], 10);
    const minutesUntilOpen = (openHour - hour) * 60;
    if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
      return {
        text: templates.openingSoon.replace('{time}', String(minutesUntilOpen)),
        category: 'time',
      };
    }
  }

  // Golden hour (1-2 hours before sunset)
  if (context.weather?.sunset) {
    const sunsetHour = context.weather.sunset.getHours();
    const minutesToSunset = (sunsetHour - hour) * 60;
    if (minutesToSunset > 30 && minutesToSunset <= 120) {
      if (context.activity.place.category === 'nature' ||
          context.activity.place.types?.some(t => t.includes('scenic') || t.includes('viewpoint'))) {
        return {
          text: templates.goldenHour.replace('{time}', String(minutesToSunset)),
          category: 'timing',
        };
      }
    }
  }

  // Meal times
  if (context.activity.place.category === 'food_drink') {
    if (hour >= 11 && hour < 14) {
      return {
        text: templates.mealTime.replace('{meal}', 'lunch'),
        category: 'time',
      };
    }
    if (hour >= 18 && hour < 21) {
      return {
        text: templates.mealTime.replace('{meal}', 'dinner'),
        category: 'time',
      };
    }
    if (hour >= 7 && hour < 10) {
      return {
        text: templates.mealTime.replace('{meal}', 'breakfast'),
        category: 'time',
      };
    }
  }

  // Happy hour (typically 4-7pm for bars)
  if (context.activity.place.category === 'nightlife' ||
      context.activity.place.types?.some(t => t.includes('bar'))) {
    if (hour >= 16 && hour < 19) {
      return {
        text: templates.happyHour,
        category: 'time',
      };
    }
  }

  // Before crowd (museums/attractions early)
  if ((context.activity.place.category === 'culture' ||
       context.activity.place.category === 'activities') &&
      hour >= 9 && hour < 11) {
    return {
      text: templates.beforeCrowd,
      category: 'crowd',
    };
  }

  return undefined;
}

/**
 * Generate a weather-based reason
 */
export function generateWeatherReason(
  context: WhyNowContext,
  style: MessageStyle = 'short'
): { text: string; category: WhyNowCategory } | undefined {
  if (!context.weather) return undefined;

  const templates = WEATHER_TEMPLATES[style];
  const category = context.activity.place.category;
  const isOutdoor = category === 'nature' || category === 'activities';
  const isIndoor = category === 'culture' || category === 'shopping' || category === 'wellness';

  // Rainy weather - suggest indoor activities
  if (context.weather.condition === 'rainy' || context.weather.condition === 'stormy') {
    if (isIndoor) {
      return { text: templates.stayDry, category: 'weather' };
    }
  }

  // Hot weather - suggest cooling off
  if (context.weather.temperatureCelsius > 30) {
    if (isIndoor || context.activity.place.types?.some(t =>
      t.includes('cafe') || t.includes('ice_cream') || t.includes('pool'))) {
      return { text: templates.coolOff, category: 'weather' };
    }
  }

  // Cold weather - suggest warming up
  if (context.weather.temperatureCelsius < 10) {
    if (isIndoor || context.activity.place.types?.some(t =>
      t.includes('cafe') || t.includes('restaurant'))) {
      return { text: templates.warmUp, category: 'weather' };
    }
  }

  // Perfect outdoor weather
  if (isOutdoor &&
      context.weather.condition === 'sunny' || context.weather.condition === 'partly_cloudy') {
    if (context.weather.temperatureCelsius >= 18 && context.weather.temperatureCelsius <= 28) {
      return { text: templates.perfectOutdoor, category: 'weather' };
    }
  }

  // Sunset views
  if (context.weather.sunset && context.weather.isDaylight) {
    const sunsetHour = context.weather.sunset.getHours();
    const minutesToSunset = (sunsetHour - context.currentHour) * 60;
    if (minutesToSunset > 0 && minutesToSunset <= 90) {
      if (context.activity.place.types?.some(t =>
        t.includes('viewpoint') || t.includes('beach') || t.includes('rooftop'))) {
        return { text: templates.sunsetViews, category: 'timing' };
      }
    }
  }

  return undefined;
}

/**
 * Generate a preference-based WhyNow reason
 */
export function generatePreferenceWhyNow(
  context: WhyNowContext,
  style: MessageStyle = 'short'
): { text: string; category: WhyNowCategory } | undefined {
  const templates = PREFERENCE_TEMPLATES[style];

  // Strong preference match
  if (context.preferenceScore && context.preferenceScore > 0.7) {
    return { text: templates.strongMatch, category: 'preference' };
  }

  // Matched specific tags
  if (context.matchedPreferences && context.matchedPreferences.length > 0) {
    const tags = context.matchedPreferences.slice(0, 2).join(', ');
    return {
      text: templates.tagMatch.replace('{tags}', tags),
      category: 'preference',
    };
  }

  // Category match with moderate score
  if (context.preferenceScore && context.preferenceScore > 0.5) {
    const categoryLabel = context.activity.place.category.replace('_', ' ');
    return {
      text: templates.categoryMatch.replace('{category}', categoryLabel),
      category: 'preference',
    };
  }

  return undefined;
}

/**
 * Generate a serendipity-based reason
 */
export function generateSerendipityReason(
  context: WhyNowContext,
  style: MessageStyle = 'short'
): { text: string; category: WhyNowCategory } | undefined {
  const templates = SERENDIPITY_TEMPLATES[style];

  if (!context.isHiddenGem) return undefined;

  // Check review count for "under the radar"
  const reviewCount = context.activity.place.reviewCount;
  if (reviewCount && reviewCount < 50) {
    return {
      text: templates.fewReviews.replace('{count}', String(reviewCount)),
      category: 'serendipity',
    };
  }

  // Hidden gem score
  if (context.activity.place.hiddenGemScore && context.activity.place.hiddenGemScore > 0.7) {
    return { text: templates.localFavorite, category: 'serendipity' };
  }

  return { text: templates.hiddenGem, category: 'serendipity' };
}

// ============================================================================
// Urgency Generation
// ============================================================================

/**
 * Generate urgency message if applicable
 */
export function generateUrgency(
  context: WhyNowContext,
  config: WhyNowGeneratorConfig = DEFAULT_WHY_NOW_CONFIG
): WhyNowReason['urgency'] | undefined {
  if (!config.includeUrgency) return undefined;

  // Closing soon
  if (context.isOpen && context.closesAt) {
    const closeHour = parseInt(context.closesAt.split(':')[0], 10);
    const minutesUntilClose = (closeHour - context.currentHour) * 60;

    if (minutesUntilClose > 0 && minutesUntilClose <= config.closingSoonMinutes) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + minutesUntilClose);

      return {
        text: `Closes in ${minutesUntilClose} minutes`,
        expiresAt,
      };
    }
  }

  // Weather changing (if rain expected)
  if (context.weather && context.weather.precipitationChance > 60) {
    const activity = context.activity;
    if (activity.place.category === 'nature' || activity.place.category === 'activities') {
      return {
        text: 'Rain expected later - go now',
      };
    }
  }

  return undefined;
}

// ============================================================================
// Tip Generation
// ============================================================================

/**
 * Generate insider tip
 */
export function generateTip(
  context: WhyNowContext,
  config: WhyNowGeneratorConfig = DEFAULT_WHY_NOW_CONFIG
): WhyNowReason['tip'] | undefined {
  if (!config.includeTips) return undefined;

  // Hidden gem tip
  if (context.isHiddenGem) {
    return {
      text: getHiddenGemTip(),
      source: 'Hidden gem',
    };
  }

  // High rating tip
  if (context.activity.place.rating && context.activity.place.rating >= 4.5) {
    const reviewCount = context.activity.place.reviewCount;
    if (reviewCount && reviewCount > 100) {
      return {
        text: `Consistently excellent with ${reviewCount}+ reviews`,
      };
    }
  }

  // Category-specific tip
  const categoryTip = getRandomTip(context.activity.place.category);
  if (categoryTip) {
    return {
      text: categoryTip,
      source: 'Pro tip',
    };
  }

  return undefined;
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate complete WhyNow reason
 */
export function generateWhyNowReason(
  context: WhyNowContext,
  config: WhyNowGeneratorConfig = DEFAULT_WHY_NOW_CONFIG
): WhyNowReason {
  const style = config.style;

  // Collect all possible reasons
  const reasons: Array<{ text: string; category: WhyNowCategory; priority: number }> = [];

  // Distance reason (high priority if close)
  const distanceReason = generateDistanceReason(
    context.distanceMeters,
    context.walkingTimeMinutes,
    style
  );
  if (distanceReason) {
    const priority = context.distanceMeters && context.distanceMeters < 500 ? 10 : 5;
    reasons.push({ ...distanceReason, priority });
  }

  // Time reason
  const timeReason = generateTimeReason(context, style);
  if (timeReason) {
    reasons.push({ ...timeReason, priority: 8 });
  }

  // Weather reason
  const weatherReason = generateWeatherReason(context, style);
  if (weatherReason) {
    reasons.push({ ...weatherReason, priority: 6 });
  }

  // Preference reason
  const prefReason = generatePreferenceWhyNow(context, style);
  if (prefReason) {
    const priority = context.preferenceScore && context.preferenceScore > 0.7 ? 9 : 4;
    reasons.push({ ...prefReason, priority });
  }

  // Serendipity reason
  const serendipityReason = generateSerendipityReason(context, style);
  if (serendipityReason) {
    reasons.push({ ...serendipityReason, priority: 7 });
  }

  // Scheduled reason (if on itinerary)
  if (context.isScheduledToday) {
    reasons.push({
      text: 'On your itinerary today',
      category: 'scheduled',
      priority: 3,
    });
  }

  // Sort by priority
  reasons.sort((a, b) => b.priority - a.priority);

  // Default if no reasons
  if (reasons.length === 0) {
    return {
      primary: {
        category: 'scheduled',
        text: 'Recommended for you',
        icon: getWhyNowIcon('scheduled'),
      },
    };
  }

  // Build the WhyNowReason
  const primary = reasons[0];
  const secondary = reasons[1];

  const result: WhyNowReason = {
    primary: {
      category: primary.category,
      text: primary.text,
      icon: getWhyNowIcon(primary.category),
    },
  };

  if (secondary) {
    result.secondary = {
      category: secondary.category,
      text: secondary.text,
      icon: getWhyNowIcon(secondary.category),
    };
  }

  // Add tip
  const tip = generateTip(context, config);
  if (tip) {
    result.tip = tip;
  }

  // Add urgency
  const urgency = generateUrgency(context, config);
  if (urgency) {
    result.urgency = urgency;
  }

  return result;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Generate WhyNow from score breakdown (simpler interface)
 */
export function generateWhyNowFromBreakdown(
  breakdown: ScoreBreakdown,
  activity: PlaceActivity,
  config: WhyNowGeneratorConfig = DEFAULT_WHY_NOW_CONFIG
): WhyNowReason {
  // Build context from breakdown
  const context: WhyNowContext = {
    activity,
    scoreBreakdown: breakdown,
    currentHour: new Date().getHours(),
    isHiddenGem: activity.isHiddenGem,
    preferenceScore: breakdown.preference.value,
  };

  return generateWhyNowReason(context, config);
}

/**
 * Get a single-line summary of WhyNow
 */
export function getWhyNowSummary(whyNow: WhyNowReason): string {
  if (whyNow.urgency) {
    return `${whyNow.primary.text} · ${whyNow.urgency.text}`;
  }
  if (whyNow.secondary) {
    return `${whyNow.primary.text} · ${whyNow.secondary.text}`;
  }
  return whyNow.primary.text;
}

/**
 * Check if WhyNow has urgency
 */
export function hasUrgency(whyNow: WhyNowReason): boolean {
  return whyNow.urgency !== undefined;
}

/**
 * Get all icons used in a WhyNow
 */
export function getWhyNowIcons(whyNow: WhyNowReason): string[] {
  const icons: string[] = [];
  if (whyNow.primary.icon) icons.push(whyNow.primary.icon);
  if (whyNow.secondary?.icon) icons.push(whyNow.secondary.icon);
  return icons;
}
