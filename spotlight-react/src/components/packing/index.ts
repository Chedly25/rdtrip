// =============================================================================
// PACKING COMPONENTS - "The Traveler's Trunk" Collection
// =============================================================================
// Smart packing list system with vintage luggage aesthetic
// Part of Phase 5: Smart Packing List
// =============================================================================

// Main packing list UI with categorized items
export { default as PackingList } from './PackingList';
export type { PackingItem, PackingListData, WeatherInfo } from './PackingList';

// Visual progress indicator with trunk filling animation
export { default as PackingProgress } from './PackingProgress';

// Pre-trip reminder notifications (telegram style)
export { default as PackingReminders } from './PackingReminders';
export type { PackingReminder, PackingRemindersProps, ReminderUrgency } from './PackingReminders';

// AI-powered list generation wizard
export { default as PackingGenerator } from './PackingGenerator';
export type { TripDetails, PackingGeneratorProps } from './PackingGenerator';
