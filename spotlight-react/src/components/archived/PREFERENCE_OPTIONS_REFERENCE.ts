/**
 * ARCHIVED PREFERENCE OPTIONS REFERENCE
 *
 * This file documents all the preference options that were available in the
 * old multi-section entry form (QuickPreferenceEditor). These options are
 * now gathered conversationally by the AI Companion instead of through
 * a traditional form.
 *
 * Use this as a reference for the companion's conversational gathering.
 *
 * @deprecated These components are archived. Preferences are now gathered
 * through the AI companion's conversational interface.
 */

// ============================================================================
// TRIP OCCASION OPTIONS
// ============================================================================
export const OCCASION_OPTIONS = [
  { id: 'honeymoon', label: 'Honeymoon', description: 'Romantic getaway for newlyweds' },
  { id: 'anniversary', label: 'Anniversary', description: 'Celebrating years together' },
  { id: 'birthday', label: 'Birthday', description: 'Birthday celebration trip' },
  { id: 'graduation', label: 'Graduation', description: 'Celebrating academic achievement' },
  { id: 'retirement', label: 'Retirement', description: 'Beginning of a new chapter' },
  { id: 'babymoon', label: 'Babymoon', description: 'Pre-baby relaxation trip' },
  { id: 'reunion', label: 'Reunion', description: 'Getting together with friends/family' },
  { id: 'solo-adventure', label: 'Solo Adventure', description: 'Personal exploration trip' },
  { id: 'girls-trip', label: 'Girls Trip', description: 'Getaway with girlfriends' },
  { id: 'guys-trip', label: 'Guys Trip', description: 'Getaway with the guys' },
  { id: 'family-vacation', label: 'Family Vacation', description: 'Trip with the whole family' },
  { id: 'just-because', label: 'Just Because', description: 'No special reason needed' },
] as const;

// ============================================================================
// TRAVEL STYLE OPTIONS
// ============================================================================
export const TRAVEL_STYLE_OPTIONS = [
  { id: 'explorer', label: 'Explorer', description: 'Loves discovering new places and hidden gems' },
  { id: 'relaxer', label: 'Relaxer', description: 'Prefers leisurely pace with downtime' },
  { id: 'culture', label: 'Culture Seeker', description: 'Drawn to museums, history, local traditions' },
  { id: 'adventurer', label: 'Adventurer', description: 'Seeks thrills, outdoor activities, physical challenges' },
  { id: 'foodie', label: 'Foodie', description: 'Trip revolves around culinary experiences' },
] as const;

// ============================================================================
// INTEREST OPTIONS (Multi-select)
// ============================================================================
export const INTEREST_OPTIONS = [
  { id: 'history', label: 'History', description: 'Historical sites and stories' },
  { id: 'art', label: 'Art', description: 'Galleries, street art, artistic expression' },
  { id: 'architecture', label: 'Architecture', description: 'Buildings, design, urban planning' },
  { id: 'nature', label: 'Nature', description: 'Parks, gardens, natural beauty' },
  { id: 'food', label: 'Food', description: 'Local cuisine, restaurants, food tours' },
  { id: 'wine', label: 'Wine', description: 'Vineyards, wine tasting, wine regions' },
  { id: 'nightlife', label: 'Nightlife', description: 'Bars, clubs, evening entertainment' },
  { id: 'shopping', label: 'Shopping', description: 'Markets, boutiques, local crafts' },
  { id: 'photography', label: 'Photography', description: 'Scenic spots, photo opportunities' },
  { id: 'adventure', label: 'Adventure', description: 'Outdoor activities, sports, thrills' },
  { id: 'wellness', label: 'Wellness', description: 'Spas, yoga, mindfulness activities' },
  { id: 'local-culture', label: 'Local Culture', description: 'Authentic local experiences' },
  { id: 'beaches', label: 'Beaches', description: 'Coastal areas, swimming, sunbathing' },
  { id: 'mountains', label: 'Mountains', description: 'Hiking, scenic views, alpine activities' },
  { id: 'museums', label: 'Museums', description: 'Collections, exhibits, cultural institutions' },
] as const;

// ============================================================================
// DINING STYLE OPTIONS
// ============================================================================
export const DINING_STYLE_OPTIONS = [
  { id: 'street', label: 'Street Food', description: 'Authentic local street vendors and markets' },
  { id: 'casual', label: 'Casual', description: 'Relaxed restaurants and cafes' },
  { id: 'mix', label: 'Mixed', description: 'Balance of casual and upscale dining' },
  { id: 'fine', label: 'Fine Dining', description: 'Upscale restaurants and culinary experiences' },
] as const;

// ============================================================================
// BUDGET OPTIONS
// ============================================================================
export const BUDGET_OPTIONS = [
  { id: 'budget', label: 'Budget', price: '$', description: 'Cost-conscious, backpacker style' },
  { id: 'mid', label: 'Mid-Range', price: '$$', description: 'Comfortable without breaking the bank' },
  { id: 'luxury', label: 'Luxury', price: '$$$', description: 'Premium experiences, no expense spared' },
] as const;

// ============================================================================
// ACCOMMODATION OPTIONS
// ============================================================================
export const ACCOMMODATION_OPTIONS = [
  { id: 'budget', label: 'Budget', description: 'Hostels, basic hotels, affordable stays' },
  { id: 'mid', label: 'Comfortable', description: 'Nice hotels with good amenities' },
  { id: 'luxury', label: 'Luxury', description: '5-star hotels, premium service' },
  { id: 'unique', label: 'Unique Stays', description: 'Boutique hotels, treehouses, castles' },
] as const;

// ============================================================================
// PACE OPTIONS (1-5 scale)
// ============================================================================
export const PACE_OPTIONS = [
  { value: 1, label: 'Very Relaxed', description: '1-2 activities per day, lots of downtime' },
  { value: 2, label: 'Relaxed', description: '2-3 activities per day, leisurely pace' },
  { value: 3, label: 'Balanced', description: '3-4 activities per day, good mix' },
  { value: 4, label: 'Active', description: '4-5 activities per day, keep moving' },
  { value: 5, label: 'Packed', description: 'Maximize every moment, full itinerary' },
] as const;

// ============================================================================
// ACCESSIBILITY OPTIONS
// ============================================================================
export const ACCESSIBILITY_OPTIONS = [
  { id: 'wheelchair', label: 'Wheelchair Accessible', description: 'Needs wheelchair-friendly venues' },
  { id: 'mobility', label: 'Limited Mobility', description: 'Minimal walking, avoid stairs' },
  { id: 'stroller', label: 'Stroller Friendly', description: 'Easy access for baby strollers' },
  { id: 'senior', label: 'Senior Friendly', description: 'Comfortable pace for older travelers' },
] as const;

// ============================================================================
// ADDITIONAL PREFERENCES (Boolean toggles)
// ============================================================================
export const TOGGLE_PREFERENCES = [
  { id: 'avoidCrowds', label: 'Avoid Crowds', description: 'Prefer less touristy spots and off-peak times' },
  { id: 'preferOutdoor', label: 'Prefer Outdoor', description: 'Prioritize outdoor activities over indoor' },
  { id: 'earlyBird', label: 'Early Bird', description: 'Prefer morning activities' },
  { id: 'nightOwl', label: 'Night Owl', description: 'Prefer evening and nighttime activities' },
  { id: 'petFriendly', label: 'Pet Friendly', description: 'Traveling with pets' },
  { id: 'kidFriendly', label: 'Kid Friendly', description: 'Need family-appropriate activities' },
] as const;

// ============================================================================
// COMPANION CONVERSATION PROMPTS
// ============================================================================
/**
 * Suggested questions the companion can ask to gather these preferences
 * conversationally instead of through a form.
 */
export const COMPANION_GATHERING_PROMPTS = {
  occasion: "What's the occasion for this trip? Are you celebrating something special?",
  travelStyle: "How would you describe your travel style - are you more of an explorer who wants to see everything, or do you prefer a relaxed pace?",
  interests: "What kind of experiences are you hoping for? History buffs? Foodies? Nature lovers?",
  dining: "For meals, do you prefer finding authentic street food or sitting down at nice restaurants?",
  budget: "What's your budget like for this trip - keeping it affordable, comfortable mid-range, or going all out?",
  pace: "How packed do you want your days to be? Some people like to fill every moment, others prefer more downtime.",
  accessibility: "Are there any accessibility needs I should know about?",
  preferences: "Any other preferences? Like avoiding crowds or preferring outdoor activities?",
} as const;

// Type exports for the companion to use
export type OccasionId = typeof OCCASION_OPTIONS[number]['id'];
export type TravelStyleId = typeof TRAVEL_STYLE_OPTIONS[number]['id'];
export type InterestId = typeof INTEREST_OPTIONS[number]['id'];
export type DiningStyleId = typeof DINING_STYLE_OPTIONS[number]['id'];
export type BudgetId = typeof BUDGET_OPTIONS[number]['id'];
export type AccommodationId = typeof ACCOMMODATION_OPTIONS[number]['id'];
export type PaceValue = typeof PACE_OPTIONS[number]['value'];
export type AccessibilityId = typeof ACCESSIBILITY_OPTIONS[number]['id'];
