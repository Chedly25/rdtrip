/**
 * Enhanced Trip Components - Living Travel Companion
 *
 * Export all enhanced components for the trip experience
 */

export { NowHeroCard } from './NowHeroCard';
export { SerendipityCarousel } from './SerendipityCarousel';
export { SmartTimeHint } from './SmartTimeHint';
export { MomentCapture } from './MomentCapture';
export { TripStorySnippet } from './TripStorySnippet';
export { WeatherAwareCard } from './WeatherAwareCard';
export { LiveTripPanelEnhanced } from './LiveTripPanelEnhanced';

// Re-export types from services
export type {
  SerendipityCard,
  SmartHint,
  TripMoment,
  TripNarrative,
  WeatherAlternative,
} from '../services/tripCompanion';
