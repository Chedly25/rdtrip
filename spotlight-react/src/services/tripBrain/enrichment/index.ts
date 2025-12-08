/**
 * Trip Brain Enrichment
 *
 * Modules for enriching activity data with contextual information
 *
 * WI-6.7: Why Now Generator
 */

// Why Now Generator (WI-6.7)
export {
  // Main generation function
  generateWhyNowReason,
  generateWhyNowFromBreakdown,

  // Component generators
  generateDistanceReason,
  generateTimeReason,
  generateWeatherReason,
  generatePreferenceWhyNow,
  generateSerendipityReason,
  generateUrgency,
  generateTip,

  // Utility functions
  getWhyNowIcon,
  getWhyNowSummary,
  hasUrgency,
  getWhyNowIcons,
  getRandomTip,
  getHiddenGemTip,

  // Configuration
  DEFAULT_WHY_NOW_CONFIG,
  WHY_NOW_ICONS,

  // Types
  type MessageStyle,
  type WhyNowGeneratorConfig,
  type WhyNowContext,
} from './whyNowGenerator';
