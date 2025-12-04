/**
 * Memories Components
 *
 * Phase 4: Trip Memories & Sharing
 *
 * A comprehensive collection of components for capturing, viewing,
 * and sharing travel memories. Designed with a "Collected Moments"
 * aesthetic - warm, nostalgic, scrapbook-inspired.
 */

// Memory Capture - Floating capture button and inline options
export { MemoryCapture, MemoryCaptureInline } from './MemoryCapture';

// Trip Journal - Chronological memory feed with scrapbook styling
export { TripJournal } from './TripJournal';
export type { Memory, DayMemories } from './TripJournal';

// Trip Recap - Full page journey summary with AI story
export { TripRecap } from './TripRecap';
export type { TripRecapData } from './TripRecap';

// Share Sheet - Social sharing modal with platform options
export { ShareSheet } from './ShareSheet';
export type { ShareSheetProps } from './ShareSheet';

// Story Cards - Social media ready card templates
export {
  StoryCards,
  ClassicTemplate,
  MinimalTemplate,
  BoldTemplate,
  CollageTemplate,
  StatsTemplate,
  RouteTemplate,
} from './StoryCards';
export type { StoryCardData, TemplateStyle } from './StoryCards';

// Memories Tab - Past trips gallery and nostalgia features
export { MemoriesTab } from './MemoriesTab';
export type { PastTrip, OnThisDayMemory, TripAnniversary } from './MemoriesTab';
