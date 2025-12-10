/**
 * QuickActionChips
 *
 * WI-3.7: Quick action chips for companion chat messages
 *
 * Design Direction: Playful conversation accelerators
 * - Feel like message bubbles the user can tap to "say"
 * - Satisfying tap interactions with selection feedback
 * - Staggered entrance animation for delight
 * - Horizontal scroll with subtle fade edges
 * - Auto-dismiss with graceful exit
 *
 * Architecture Decision:
 * - Generic chip system supporting multiple types
 * - Self-managing visibility state (auto-dismiss)
 * - Integrates with chat via callback pattern
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Palette,
  TreePine,
  Wine,
  ShoppingBag,
  Sparkles,
  Check,
  MapPin,
  Gem,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import type { DiscoveryPlace } from '../../stores/discoveryStore';

// ============================================================================
// Types
// ============================================================================

/**
 * Base chip option
 */
interface BaseChipOption {
  id: string;
  label: string;
}

/**
 * Text chip - simple text option
 */
export interface TextChipOption extends BaseChipOption {
  type: 'text';
}

/**
 * Category chip - with icon for vibes/interests
 */
export interface CategoryChipOption extends BaseChipOption {
  type: 'category';
  category: 'food' | 'culture' | 'nature' | 'nightlife' | 'shopping' | 'adventure' | 'relaxation' | 'mix';
}

/**
 * Yes/No chip - for binary choices
 */
export interface YesNoChipOption extends BaseChipOption {
  type: 'yes_no';
  variant: 'yes' | 'no' | 'maybe';
}

/**
 * Place chip - reference to a place
 */
export interface PlaceChipOption extends BaseChipOption {
  type: 'place';
  place: DiscoveryPlace;
}

/**
 * Union of all chip types
 */
export type ChipOption =
  | TextChipOption
  | CategoryChipOption
  | YesNoChipOption
  | PlaceChipOption;

/**
 * Props for QuickActionChips
 */
interface QuickActionChipsProps {
  /** Array of chip options to display */
  options: ChipOption[];
  /** Callback when a chip is selected */
  onSelect: (option: ChipOption) => void;
  /** Whether chips should be visible */
  visible?: boolean;
  /** Auto-dismiss after selection (ms) - 0 to disable */
  dismissDelay?: number;
  /** Maximum chips to show before "more" indicator */
  maxVisible?: number;
  /** Custom className for container */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_CONFIG: Record<CategoryChipOption['category'], {
  icon: LucideIcon;
  color: string;
  bg: string;
}> = {
  food: { icon: Utensils, color: 'text-rui-accent', bg: 'bg-rui-accent/10' },
  culture: { icon: Palette, color: 'text-blue-600', bg: 'bg-blue-50' },
  nature: { icon: TreePine, color: 'text-rui-sage', bg: 'bg-rui-sage/10' },
  nightlife: { icon: Wine, color: 'text-purple-600', bg: 'bg-purple-50' },
  shopping: { icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-50' },
  adventure: { icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
  relaxation: { icon: Sparkles, color: 'text-sky-600', bg: 'bg-sky-50' },
  mix: { icon: Sparkles, color: 'text-rui-golden', bg: 'bg-rui-golden/10' },
};

const YES_NO_CONFIG: Record<YesNoChipOption['variant'], {
  icon: LucideIcon;
  color: string;
  bg: string;
  hoverBg: string;
}> = {
  yes: { icon: ThumbsUp, color: 'text-rui-sage', bg: 'bg-rui-sage/10', hoverBg: 'hover:bg-rui-sage/20' },
  no: { icon: ThumbsDown, color: 'text-rose-500', bg: 'bg-rose-50', hoverBg: 'hover:bg-rose-100' },
  maybe: { icon: HelpCircle, color: 'text-rui-grey-50', bg: 'bg-rui-grey-5', hoverBg: 'hover:bg-rui-grey-10' },
};

// ============================================================================
// Individual Chip Components
// ============================================================================

interface ChipProps {
  option: ChipOption;
  onSelect: () => void;
  index: number;
  isSelected: boolean;
}

/**
 * Text Chip
 */
function TextChip({ option, onSelect, index, isSelected }: ChipProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 0.95 : 1,
        x: 0,
      }}
      exit={{ opacity: 0, scale: 0.8, y: 5 }}
      transition={{
        delay: index * 0.04,
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`
        relative px-4 py-2 rounded-full
        text-body-2 font-medium
        border-2 transition-colors duration-150
        flex-shrink-0
        ${isSelected
          ? 'bg-rui-accent text-white border-rui-accent'
          : 'bg-white text-rui-black border-rui-grey-15 hover:border-rui-accent/50 hover:bg-rui-accent/5'
        }
      `}
    >
      {option.label}

      {/* Selection check */}
      <AnimatePresence>
        {isSelected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-rui-sage flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-white" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Category Chip (with icon) - Compact design
 */
function CategoryChip({ option, onSelect, index, isSelected }: ChipProps & { option: CategoryChipOption }) {
  const config = CATEGORY_CONFIG[option.category];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 0.95 : 1,
        x: 0,
      }}
      exit={{ opacity: 0, scale: 0.8, y: 5 }}
      transition={{
        delay: index * 0.03,
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`
        relative flex items-center gap-1.5
        px-2.5 py-1.5 rounded-full
        text-xs font-medium
        border transition-all duration-150
        flex-shrink-0
        ${isSelected
          ? `${config.bg} ${config.color} border-current`
          : `bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50`
        }
      `}
    >
      <Icon className={`w-3.5 h-3.5 ${isSelected ? config.color : 'text-stone-400'}`} />
      <span className="whitespace-nowrap">{option.label}</span>

      {/* Selection indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={`absolute -right-0.5 -top-0.5 w-4 h-4 rounded-full ${config.bg} flex items-center justify-center ring-1 ring-white`}
          >
            <Check className={`w-2.5 h-2.5 ${config.color}`} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/**
 * Yes/No Chip
 */
function YesNoChip({ option, onSelect, index, isSelected }: ChipProps & { option: YesNoChipOption }) {
  const config = YES_NO_CONFIG[option.variant];
  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 0.95 : 1,
        x: 0,
      }}
      exit={{ opacity: 0, scale: 0.8, y: 5 }}
      transition={{
        delay: index * 0.04,
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={`
        relative flex items-center gap-2
        px-5 py-2.5 rounded-full
        text-body-2 font-semibold
        border-2 transition-all duration-150
        flex-shrink-0
        ${isSelected
          ? `${config.bg} ${config.color} border-current`
          : `bg-white ${config.color} border-rui-grey-15 ${config.hoverBg}`
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {option.label}
    </motion.button>
  );
}

/**
 * Place Chip
 */
function PlaceChip({ option, onSelect, index, isSelected }: ChipProps & { option: PlaceChipOption }) {
  const place = option.place;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 0.95 : 1,
        x: 0,
      }}
      exit={{ opacity: 0, scale: 0.8, y: 5 }}
      transition={{
        delay: index * 0.04,
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        relative flex items-center gap-2
        pl-2 pr-4 py-1.5 rounded-full
        text-body-3 font-medium
        border-2 transition-all duration-150
        flex-shrink-0
        ${isSelected
          ? 'bg-rui-accent/10 text-rui-accent border-rui-accent/30'
          : 'bg-white text-rui-black border-rui-grey-15 hover:border-rui-accent/30'
        }
      `}
    >
      {/* Mini photo */}
      <div className="w-7 h-7 rounded-full overflow-hidden bg-rui-grey-5 flex-shrink-0">
        {place.photoUrl ? (
          <img src={place.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-3 h-3 text-rui-grey-30" />
          </div>
        )}
      </div>

      <span className="max-w-[100px] truncate">{option.label}</span>

      {/* Hidden gem indicator */}
      {place.isHiddenGem && (
        <Gem className="w-3 h-3 text-rui-golden flex-shrink-0" />
      )}
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function QuickActionChips({
  options,
  onSelect,
  visible = true,
  dismissDelay = 300,
  maxVisible = 10,
  className = '',
}: QuickActionChipsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll position for fade edges
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll state
  const updateScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 5);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 5
    );
  }, []);

  useEffect(() => {
    updateScrollState();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      return () => container.removeEventListener('scroll', updateScrollState);
    }
  }, [updateScrollState, options]);

  // Handle chip selection
  const handleSelect = useCallback((option: ChipOption) => {
    if (selectedId || isExiting) return; // Prevent double-tap

    setSelectedId(option.id);

    // Brief delay to show selection, then callback and dismiss
    setTimeout(() => {
      onSelect(option);

      if (dismissDelay > 0) {
        setIsExiting(true);
      }
    }, 150);
  }, [selectedId, isExiting, onSelect, dismissDelay]);

  // Render individual chip based on type
  const renderChip = (option: ChipOption, index: number) => {
    const isSelected = selectedId === option.id;
    const baseProps = {
      option,
      onSelect: () => handleSelect(option),
      index,
      isSelected,
    };

    switch (option.type) {
      case 'category':
        return <CategoryChip key={option.id} {...baseProps} option={option} />;
      case 'yes_no':
        return <YesNoChip key={option.id} {...baseProps} option={option} />;
      case 'place':
        return <PlaceChip key={option.id} {...baseProps} option={option} />;
      case 'text':
      default:
        return <TextChip key={option.id} {...baseProps} />;
    }
  };

  const visibleOptions = options.slice(0, maxVisible);

  return (
    <AnimatePresence>
      {visible && !isExiting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={`relative ${className}`}
        >
          {/* Scroll container */}
          <div className="relative">
            {/* Left fade */}
            <AnimatePresence>
              {canScrollLeft && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="
                    absolute left-0 top-0 bottom-0 w-8
                    bg-gradient-to-r from-white to-transparent
                    pointer-events-none z-10
                  "
                />
              )}
            </AnimatePresence>

            {/* Chips */}
            <div
              ref={containerRef}
              className="
                flex gap-2 py-2 px-1
                overflow-x-auto
                scrollbar-hide
                scroll-smooth
                snap-x snap-mandatory
              "
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {visibleOptions.map((option, index) => (
                <div key={option.id} className="snap-start">
                  {renderChip(option, index)}
                </div>
              ))}

              {/* "More" indicator */}
              {options.length > maxVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="
                    flex-shrink-0 px-3 py-2
                    text-body-3 text-rui-grey-40
                    flex items-center
                  "
                >
                  +{options.length - maxVisible} more
                </motion.div>
              )}
            </div>

            {/* Right fade */}
            <AnimatePresence>
              {canScrollRight && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="
                    absolute right-0 top-0 bottom-0 w-8
                    bg-gradient-to-l from-white to-transparent
                    pointer-events-none z-10
                  "
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Preset Chip Sets
// ============================================================================

/**
 * Create vibe/interest chips - compact labels for mobile
 */
export function createVibeChips(): ChipOption[] {
  return [
    { id: 'food', type: 'category', category: 'food', label: 'Food' },
    { id: 'culture', type: 'category', category: 'culture', label: 'Culture' },
    { id: 'nature', type: 'category', category: 'nature', label: 'Nature' },
    { id: 'nightlife', type: 'category', category: 'nightlife', label: 'Nightlife' },
    { id: 'mix', type: 'category', category: 'mix', label: 'Mix it up' },
  ];
}

/**
 * Create yes/no chips
 */
export function createYesNoChips(
  yesLabel = 'Yes',
  noLabel = 'No',
  maybeLabel?: string
): ChipOption[] {
  const chips: ChipOption[] = [
    { id: 'yes', type: 'yes_no', variant: 'yes', label: yesLabel },
    { id: 'no', type: 'yes_no', variant: 'no', label: noLabel },
  ];

  if (maybeLabel) {
    chips.push({ id: 'maybe', type: 'yes_no', variant: 'maybe', label: maybeLabel });
  }

  return chips;
}

/**
 * Create text chips from strings
 */
export function createTextChips(labels: string[]): ChipOption[] {
  return labels.map((label, index) => ({
    id: `text-${index}`,
    type: 'text',
    label,
  }));
}

/**
 * Create place chips from places
 */
export function createPlaceChips(places: DiscoveryPlace[]): ChipOption[] {
  return places.map((place) => ({
    id: `place-${place.id}`,
    type: 'place',
    label: place.name,
    place,
  }));
}

// ============================================================================
// Exports
// ============================================================================

// Types are exported inline above (ChipOption, TextChipOption, etc.)

export default QuickActionChips;
