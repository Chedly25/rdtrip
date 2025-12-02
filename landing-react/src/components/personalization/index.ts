/**
 * Personalization Components
 *
 * A suite of components for capturing user preferences and trip context,
 * enabling deeply personalized route generation.
 *
 * Main components:
 * - TripStoryInput: Free-form text input for trip context
 * - PersonalizationAccordion: Collapsible container for all preference sections
 *
 * Section components:
 * - OccasionSection: Trip occasion (honeymoon, anniversary, etc.)
 * - TravelStyleSection: How you like to travel
 * - PaceSection: Trip pace from relaxed to packed
 * - InterestsSection: What draws you to places
 * - DiningSection: Food preferences and dietary needs
 * - BudgetSection: Budget and accommodation preferences
 * - AccessibilitySection: Physical considerations
 *
 * Shared components:
 * - SectionHeader: Consistent section headers
 * - OptionPill: Selectable pill/tag component
 * - SliderInput: Range slider with labels
 * - ToggleCard: Card-style toggle option
 */

// Main personalization components
export { TripStoryInput } from './TripStoryInput'
export { PersonalizationAccordion } from './PersonalizationAccordion'
export type { PersonalizationData } from './PersonalizationAccordion'

// Section components
export {
  OccasionSection,
  TravelStyleSection,
  PaceSection,
  InterestsSection,
  DiningSection,
  BudgetSection,
  AccessibilitySection,
} from './sections'

// Shared components
export {
  SectionHeader,
  OptionPill,
  SliderInput,
  ToggleCard,
} from './shared'
