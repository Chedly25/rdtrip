/**
 * Planning Phase Components
 *
 * Components for the trip planning/discovery phase UI
 */

export { PlanningCompanionChat } from './PlanningCompanionChat';

// WI-3.6: Place cards for chat
export {
  ChatPlaceCard,
  InlinePlaceMention,
  ChatPlaceCardList,
  TYPE_CONFIG as PLACE_TYPE_CONFIG,
} from './ChatPlaceCard';

// WI-3.7: Quick action chips for chat
export {
  QuickActionChips,
  createVibeChips,
  createYesNoChips,
  createTextChips,
  createPlaceChips,
  type ChipOption,
  type TextChipOption,
  type CategoryChipOption,
  type YesNoChipOption,
  type PlaceChipOption,
} from './QuickActionChips';
