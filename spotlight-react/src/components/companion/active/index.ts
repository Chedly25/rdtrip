/**
 * Active Companion UI Components
 *
 * WI-7.3: Choice Mode - curated recommendations
 * WI-7.4: Craving Mode - "I want..." instant search
 * WI-7.5: Serendipity Mode - "Surprise me" discovery
 * WI-7.6: Rest Mode - "I'm tired" rest spots
 * WI-7.7: Mode Switcher - navigation between modes
 * WI-7.8: Proactive Notifications - contextual suggestions
 * WI-7.9: Arrival Detection - smart proximity-based check-in
 * WI-7.10: Weather Integration - weather-aware companion
 *
 * This module provides:
 * - ChoiceMode: Default mode showing curated recommendations
 * - ChoiceCard: Individual recommendation card with Why Now
 * - CravingMode: "I want..." instant search interface
 * - CravingResultCard: Individual craving result card
 * - SerendipityMode: "Surprise me" magical button interface
 * - SerendipityReveal: Full-screen dramatic reveal
 * - RestMode: "I'm tired" nearby rest spots
 * - RestSpotCard: Individual rest spot with calming design
 * - CompanionModeSwitcher: Bottom navigation for mode switching
 * - ActiveCompanionShell: Complete companion container with all modes
 * - ProactiveNotificationCard: Individual proactive notification
 * - ProactiveNotificationStack: Notification stack manager
 * - ArrivalPrompt: Arrival check-in prompt
 * - useArrivalDetection: Battery-efficient arrival detection hook
 * - WeatherBanner: Compact weather display
 * - Integration hooks for all modes
 */

// WI-7.3: Choice Mode Components
export { ChoiceCard, type ChoiceCardProps } from './ChoiceCard';
export { ChoiceMode, type ChoiceModeProps } from './ChoiceMode';
export { useChoiceMode, type UseChoiceModeOptions, type UseChoiceModeReturn } from './useChoiceMode';

// WI-7.4: Craving Mode Components
export { CravingResultCard, type CravingResultCardProps } from './CravingResultCard';
export { CravingMode, type CravingModeProps } from './CravingMode';
export { useCravingMode, type UseCravingModeOptions, type UseCravingModeReturn } from './useCravingMode';

// WI-7.5: Serendipity Mode Components
export { SerendipityMode, type SerendipityModeProps } from './SerendipityMode';
export { SerendipityReveal, type SerendipityRevealProps } from './SerendipityReveal';
export { useSerendipityMode, type UseSerendipityModeOptions, type UseSerendipityModeReturn } from './useSerendipityMode';

// WI-7.6: Rest Mode Components
export { RestSpotCard, type RestSpotCardProps } from './RestSpotCard';
export { RestMode, type RestModeProps, type RestFilter } from './RestMode';
export { useRestMode, type UseRestModeOptions, type UseRestModeReturn } from './useRestMode';

// WI-7.7: Mode Switcher Components
export { CompanionModeSwitcher, type CompanionModeSwitcherProps } from './CompanionModeSwitcher';
export { ActiveCompanionShell, type ActiveCompanionShellProps } from './ActiveCompanionShell';

// WI-7.8: Proactive Notification Components
export { ProactiveNotificationCard, type ProactiveNotificationCardProps } from './ProactiveNotificationCard';
export { ProactiveNotificationStack, type ProactiveNotificationStackProps } from './ProactiveNotificationStack';
export { useProactiveNotifications, type UseProactiveNotificationsOptions, type UseProactiveNotificationsReturn } from './useProactiveNotifications';

// WI-7.9: Arrival Detection Components
export { ArrivalPrompt, type ArrivalPromptProps, type ArrivalAction } from './ArrivalPrompt';
export {
  useArrivalDetection,
  type ArrivalEvent,
  type ArrivalDetectionState,
  type NearbyActivity,
  type UseArrivalDetectionOptions,
  type UseArrivalDetectionReturn,
} from './useArrivalDetection';

// WI-7.10: Weather Integration Components
export { WeatherBanner, type WeatherBannerProps } from './WeatherBanner';
