import { useRef, useId } from 'react';
import { motion } from 'framer-motion';
import { User, Heart, Users, UserPlus } from 'lucide-react';
import type { TravellerType } from './types';

interface TravellerTypeChipsProps {
  value: TravellerType;
  onChange: (type: TravellerType) => void;
  /** Optional callback when any chip receives focus (for analytics) */
  onChipFocus?: () => void;
}

const TRAVELLER_TYPES: {
  type: TravellerType;
  label: string;
  icon: React.ElementType;
}[] = [
  { type: 'solo', label: 'Solo', icon: User },
  { type: 'couple', label: 'Couple', icon: Heart },
  { type: 'family', label: 'Family', icon: Users },
  { type: 'friends', label: 'Friends', icon: Users },
  { type: 'group', label: 'Group', icon: UserPlus },
];

export function TravellerTypeChips({ value, onChange, onChipFocus }: TravellerTypeChipsProps) {
  const groupId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const hasFiredFocusRef = useRef(false);

  const handleChipFocus = () => {
    if (!hasFiredFocusRef.current && onChipFocus) {
      hasFiredFocusRef.current = true;
      onChipFocus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % TRAVELLER_TYPES.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (currentIndex - 1 + TRAVELLER_TYPES.length) % TRAVELLER_TYPES.length;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = TRAVELLER_TYPES.length - 1;
        break;
    }

    if (newIndex !== null) {
      const newType = TRAVELLER_TYPES[newIndex].type;
      onChange(newType);

      // Focus the new button
      const buttons = containerRef.current?.querySelectorAll('[role="radio"]');
      (buttons?.[newIndex] as HTMLElement)?.focus();
    }
  };

  return (
    <div>
      {/* Label */}
      <label
        id={`${groupId}-label`}
        className="block text-body-3 font-medium text-rui-grey-50 mb-3 uppercase tracking-wide"
      >
        Who's traveling?
      </label>

      {/* Chips container - horizontal scroll on mobile, wrap on desktop */}
      <div
        ref={containerRef}
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        className="
          flex gap-2
          overflow-x-auto pb-2 -mb-2
          snap-x snap-mandatory
          scrollbar-hide
          md:flex-wrap md:overflow-x-visible md:pb-0 md:mb-0
        "
      >
        {TRAVELLER_TYPES.map(({ type, label, icon: Icon }, index) => {
          const isSelected = value === type;

          return (
            <motion.button
              key={type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(type)}
              onFocus={handleChipFocus}
              onKeyDown={(e) => handleKeyDown(e, index)}
              whileTap={{ scale: 0.95 }}
              className={`
                relative flex items-center gap-2.5 px-5 py-3 rounded-full
                font-body font-medium text-body-2
                transition-all duration-rui-sm
                flex-shrink-0 snap-start
                focus:outline-none focus-visible:ring-2 focus-visible:ring-rui-accent focus-visible:ring-offset-2
                ${isSelected
                  ? 'bg-rui-black text-rui-white shadow-rui-2'
                  : 'bg-rui-grey-5 text-rui-grey-50 hover:bg-rui-grey-8 hover:text-rui-black'
                }
              `}
            >
              {/* Selection indicator ring */}
              {isSelected && (
                <motion.span
                  layoutId="traveller-ring"
                  className="absolute inset-0 rounded-full ring-2 ring-rui-accent ring-offset-2"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <Icon className={`w-4 h-4 ${isSelected ? 'text-rui-white' : 'text-rui-grey-50'}`} />
              <span>{label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
