/**
 * QuickActionChips - Tappable option chips below agent messages
 *
 * When the agent offers choices, these chips appear as quick-tap options.
 * Tapping a chip sends that option as a user message.
 *
 * Design: Travel sticker/passport stamp aesthetic
 * - Colorful, playful chips
 * - Staggered entrance animation
 * - Satisfying tap feedback
 * - Auto-dismiss after selection
 *
 * Chip Types:
 * - text: Simple text option
 * - emoji: Icon + text option
 * - category: Category selection (food, culture, etc.)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Landmark,
  TreePine,
  Music,
  ShoppingBag,
  Camera,
  Wine,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Heart,
  Map,
  Compass,
  Check
} from 'lucide-react';

export interface QuickActionChip {
  id: string;
  label: string;
  value: string; // What gets sent as user message
  icon?: string; // Emoji or icon name
  color?: 'teal' | 'amber' | 'rose' | 'violet' | 'emerald' | 'sky' | 'orange';
  category?: string;
}

interface QuickActionChipsProps {
  chips: QuickActionChip[];
  onSelect: (chip: QuickActionChip) => void;
  variant?: 'default' | 'category' | 'yesno';
  disabled?: boolean;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  food: Utensils,
  culture: Landmark,
  nature: TreePine,
  nightlife: Music,
  shopping: ShoppingBag,
  photo: Camera,
  wine: Wine,
  sparkles: Sparkles,
  day: Sun,
  night: Moon,
  coffee: Coffee,
  heart: Heart,
  map: Map,
  compass: Compass,
  check: Check,
};

// Color schemes for each chip color
const colorSchemes = {
  teal: {
    bg: 'bg-gradient-to-r from-teal-500 to-cyan-400',
    hover: 'hover:from-teal-400 hover:to-cyan-300',
    ring: 'ring-teal-300',
    text: 'text-white',
    shadow: 'shadow-teal-500/30',
  },
  amber: {
    bg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    hover: 'hover:from-amber-400 hover:to-yellow-300',
    ring: 'ring-amber-300',
    text: 'text-amber-950',
    shadow: 'shadow-amber-500/30',
  },
  rose: {
    bg: 'bg-gradient-to-r from-rose-500 to-pink-400',
    hover: 'hover:from-rose-400 hover:to-pink-300',
    ring: 'ring-rose-300',
    text: 'text-white',
    shadow: 'shadow-rose-500/30',
  },
  violet: {
    bg: 'bg-gradient-to-r from-violet-500 to-purple-400',
    hover: 'hover:from-violet-400 hover:to-purple-300',
    ring: 'ring-violet-300',
    text: 'text-white',
    shadow: 'shadow-violet-500/30',
  },
  emerald: {
    bg: 'bg-gradient-to-r from-emerald-500 to-green-400',
    hover: 'hover:from-emerald-400 hover:to-green-300',
    ring: 'ring-emerald-300',
    text: 'text-white',
    shadow: 'shadow-emerald-500/30',
  },
  sky: {
    bg: 'bg-gradient-to-r from-sky-500 to-blue-400',
    hover: 'hover:from-sky-400 hover:to-blue-300',
    ring: 'ring-sky-300',
    text: 'text-white',
    shadow: 'shadow-sky-500/30',
  },
  orange: {
    bg: 'bg-gradient-to-r from-orange-500 to-amber-400',
    hover: 'hover:from-orange-400 hover:to-amber-300',
    ring: 'ring-orange-300',
    text: 'text-white',
    shadow: 'shadow-orange-500/30',
  },
};

// Default colors to cycle through
const defaultColors: Array<keyof typeof colorSchemes> = [
  'teal', 'amber', 'rose', 'violet', 'emerald', 'sky', 'orange'
];

export function QuickActionChips({
  chips,
  onSelect,
  variant = 'default',
  disabled = false
}: QuickActionChipsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleSelect = (chip: QuickActionChip) => {
    if (disabled || selectedId) return;

    setSelectedId(chip.id);

    // Brief delay for visual feedback before sending
    setTimeout(() => {
      setIsExiting(true);
      // Another delay for exit animation
      setTimeout(() => {
        onSelect(chip);
      }, 200);
    }, 150);
  };

  // Get icon component
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;

    // Check if it's an emoji (starts with emoji character)
    if (/^\p{Emoji}/u.test(iconName)) {
      return <span className="text-base">{iconName}</span>;
    }

    // Otherwise, look up icon component
    const IconComponent = iconMap[iconName.toLowerCase()];
    if (IconComponent) {
      return <IconComponent className="w-4 h-4" />;
    }

    return null;
  };

  // Get color for chip
  const getColor = (chip: QuickActionChip, index: number) => {
    if (chip.color) return colorSchemes[chip.color];
    return colorSchemes[defaultColors[index % defaultColors.length]];
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="mt-3 mb-1"
        >
          {/* Label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-stone-500 mb-2 font-medium"
          >
            Quick replies:
          </motion.p>

          {/* Chips container */}
          <div className="flex flex-wrap gap-2">
            {chips.map((chip, index) => {
              const colors = getColor(chip, index);
              const isSelected = selectedId === chip.id;
              const icon = getIcon(chip.icon);

              return (
                <motion.button
                  key={chip.id}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{
                    opacity: 1,
                    scale: isSelected ? 1.05 : 1,
                    y: 0,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 400,
                    damping: 25
                  }}
                  whileHover={!disabled && !selectedId ? {
                    scale: 1.05,
                    y: -2,
                  } : {}}
                  whileTap={!disabled && !selectedId ? {
                    scale: 0.95
                  } : {}}
                  onClick={() => handleSelect(chip)}
                  disabled={disabled || !!selectedId}
                  className={`
                    relative px-4 py-2 rounded-full font-medium text-sm
                    flex items-center gap-2
                    transition-all duration-200
                    ${colors.bg} ${colors.hover} ${colors.text}
                    shadow-lg ${colors.shadow}
                    disabled:opacity-60 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 ${colors.ring} focus:ring-offset-2
                    ${isSelected ? 'ring-2 ring-offset-2 ' + colors.ring : ''}
                    ${variant === 'category' ? 'min-w-[100px] justify-center' : ''}
                  `}
                >
                  {/* Icon */}
                  {icon && (
                    <span className={isSelected ? 'animate-bounce' : ''}>
                      {icon}
                    </span>
                  )}

                  {/* Label */}
                  <span>{chip.label}</span>

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-1"
                    >
                      <Check className="w-4 h-4" />
                    </motion.span>
                  )}

                  {/* Decorative stamp effect for category variant */}
                  {variant === 'category' && (
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/30 pointer-events-none" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Pre-built chip sets for common scenarios
 */
export const prebuiltChipSets = {
  // Travel interest categories
  travelInterests: [
    { id: 'food', label: 'Food & Wine', value: 'I\'m interested in food and wine experiences', icon: 'food', color: 'amber' as const },
    { id: 'culture', label: 'Culture & History', value: 'I\'m interested in culture and history', icon: 'culture', color: 'violet' as const },
    { id: 'nature', label: 'Nature & Adventure', value: 'I\'m interested in nature and adventure', icon: 'nature', color: 'emerald' as const },
    { id: 'nightlife', label: 'Nightlife', value: 'I\'m interested in nightlife', icon: 'nightlife', color: 'rose' as const },
    { id: 'mix', label: 'Mix of everything', value: 'I want a mix of everything', icon: 'sparkles', color: 'sky' as const },
  ],

  // Yes/No
  yesNo: [
    { id: 'yes', label: 'Yes!', value: 'Yes', icon: '👍', color: 'emerald' as const },
    { id: 'no', label: 'No thanks', value: 'No', icon: '👎', color: 'rose' as const },
  ],

  // Pace preferences
  pace: [
    { id: 'relaxed', label: 'Relaxed', value: 'I prefer a relaxed pace', icon: 'coffee', color: 'sky' as const },
    { id: 'balanced', label: 'Balanced', value: 'I prefer a balanced pace', icon: 'compass', color: 'teal' as const },
    { id: 'packed', label: 'Action-packed', value: 'I prefer an action-packed schedule', icon: 'sparkles', color: 'orange' as const },
  ],

  // Time of day
  timeOfDay: [
    { id: 'morning', label: 'Morning', value: 'Morning works best for me', icon: 'day', color: 'amber' as const },
    { id: 'afternoon', label: 'Afternoon', value: 'Afternoon works best for me', icon: 'day', color: 'sky' as const },
    { id: 'evening', label: 'Evening', value: 'Evening works best for me', icon: 'night', color: 'violet' as const },
  ],

  // Continue / more options
  moreOptions: [
    { id: 'more', label: 'Show me more', value: 'Show me more options', icon: 'sparkles', color: 'teal' as const },
    { id: 'different', label: 'Something different', value: 'Show me something different', icon: 'compass', color: 'amber' as const },
    { id: 'perfect', label: 'This is perfect!', value: 'This is perfect, let\'s go with this', icon: 'heart', color: 'rose' as const },
  ],
};

export default QuickActionChips;
