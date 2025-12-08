import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Gem, Check, Plus, Star, X } from 'lucide-react';
import type { DiscoveryCity } from '../../stores/discoveryStore';

/**
 * Visual states for the city pin:
 * - default: Suggested city, not yet added to trip
 * - hovered: User is hovering/focusing
 * - selected: User has tapped/clicked to see preview
 * - added: City is added to the trip
 * - fixed: Origin or destination (always in trip, can't remove)
 */
type PinState = 'default' | 'hovered' | 'selected' | 'added' | 'fixed';

interface DiscoveryCityPinProps {
  city: DiscoveryCity;
  isSelected: boolean;
  onClick: () => void;
  /** Callback when remove button is clicked (for added cities) */
  onRemove?: () => void;
  /** Animation delay for staggered entrance */
  delay?: number;
}

/**
 * DiscoveryCityPin
 *
 * A distinctive map marker for cities in the discovery phase.
 * Inspired by vintage travel stamps with a modern, warm aesthetic.
 *
 * Design decisions:
 * - Large tap target (48px) for mobile-first usability
 * - Clear visual hierarchy: pin → badge → label
 * - Distinct colors for each state (terracotta=fixed, sage=added, white=default)
 * - Subtle pulse animation for suggested cities to draw attention
 * - Hidden gems badge shows place count with golden accent
 */
export function DiscoveryCityPin({
  city,
  isSelected,
  onClick,
  onRemove,
  delay = 0,
}: DiscoveryCityPinProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine visual state
  const getState = (): PinState => {
    if (city.isFixed) return 'fixed';
    if (isSelected) return 'selected';
    if (city.isSelected) return 'added';
    if (isHovered) return 'hovered';
    return 'default';
  };

  const state = getState();

  // State-based styling
  const stateStyles: Record<PinState, { bg: string; text: string; ring: string; shadow: string }> = {
    default: {
      bg: 'bg-white',
      text: 'text-rui-grey-60',
      ring: '',
      shadow: 'shadow-lg shadow-black/10',
    },
    hovered: {
      bg: 'bg-white',
      text: 'text-rui-accent',
      ring: 'ring-2 ring-rui-accent/20',
      shadow: 'shadow-xl shadow-rui-accent/15',
    },
    selected: {
      bg: 'bg-white',
      text: 'text-rui-accent',
      ring: 'ring-4 ring-rui-accent/30',
      shadow: 'shadow-xl shadow-rui-accent/20',
    },
    added: {
      bg: 'bg-rui-sage',
      text: 'text-white',
      ring: '',
      shadow: 'shadow-lg shadow-rui-sage/30',
    },
    fixed: {
      bg: 'bg-rui-accent',
      text: 'text-white',
      ring: '',
      shadow: 'shadow-lg shadow-rui-accent/30',
    },
  };

  const styles = stateStyles[state];

  // Icon based on state
  const PinIcon = () => {
    if (city.isFixed) {
      return city.id === 'origin' ? (
        <div className="relative">
          <MapPin className="w-5 h-5" />
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      ) : (
        <Star className="w-5 h-5" />
      );
    }
    if (city.isSelected) return <Check className="w-5 h-5" strokeWidth={3} />;
    return <Plus className="w-5 h-5" />;
  };

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      initial={{ scale: 0, y: 30, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        delay: delay,
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex flex-col items-center cursor-pointer focus:outline-none group"
      style={{ zIndex: isSelected ? 30 : isHovered ? 20 : 10 }}
      aria-label={`${city.name}${city.isSelected ? ' (in trip)' : ''}`}
    >
      {/* Pulse ring for default state (suggested cities) */}
      <AnimatePresence>
        {state === 'default' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-rui-golden/20"
          />
        )}
      </AnimatePresence>

      {/* Main pin circle */}
      <motion.div
        layout
        className={`
          relative flex items-center justify-center
          w-12 h-12 rounded-full
          border-2 transition-colors duration-200
          ${styles.bg} ${styles.text} ${styles.ring} ${styles.shadow}
          ${state === 'default' ? 'border-rui-grey-15' : 'border-transparent'}
        `}
      >
        <PinIcon />

        {/* Remove button - appears on hover for added (non-fixed) cities */}
        <AnimatePresence>
          {isHovered && city.isSelected && !city.isFixed && onRemove && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="
                absolute -top-2 -left-2
                w-6 h-6 rounded-full
                bg-white border-2 border-rui-grey-15
                flex items-center justify-center
                shadow-md
                hover:bg-danger hover:border-danger hover:text-white
                text-rui-grey-50
                transition-colors duration-150
                z-10
              "
              aria-label={`Remove ${city.name} from trip`}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Hidden gems badge */}
        {city.placeCount && city.placeCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: delay + 0.2 }}
            className={`
              absolute -top-1.5 -right-1.5
              min-w-[22px] h-[22px] px-1 rounded-full
              flex items-center justify-center gap-0.5
              text-[10px] font-bold
              shadow-md
              ${state === 'fixed' || state === 'added'
                ? 'bg-rui-golden text-white'
                : 'bg-rui-golden/90 text-white'
              }
            `}
          >
            <Gem className="w-2.5 h-2.5" />
            <span>{city.placeCount > 99 ? '99+' : city.placeCount}</span>
          </motion.div>
        )}
      </motion.div>

      {/* City name label */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.1 }}
        className={`
          mt-1.5 px-3 py-1.5 rounded-lg
          font-display text-sm font-semibold whitespace-nowrap
          transition-all duration-200
          ${isSelected || isHovered
            ? 'bg-rui-black text-white shadow-lg scale-105'
            : state === 'added' || state === 'fixed'
            ? 'bg-white/95 text-rui-black shadow-md backdrop-blur-sm'
            : 'bg-white/90 text-rui-grey-70 shadow-sm'
          }
        `}
      >
        {city.name}
      </motion.div>

      {/* Connector stem */}
      <div
        className={`
          w-0.5 h-2
          transition-colors duration-200
          ${state === 'fixed'
            ? 'bg-rui-accent'
            : state === 'added'
            ? 'bg-rui-sage'
            : 'bg-rui-grey-20'
          }
        `}
      />

      {/* Expanded info tooltip on hover (desktop) */}
      <AnimatePresence>
        {isHovered && !isSelected && city.description && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="
              absolute top-full mt-8
              px-3 py-2 rounded-xl
              bg-rui-black/90 backdrop-blur-sm
              text-white text-xs text-center
              max-w-[160px]
              shadow-xl
              pointer-events-none
              hidden md:block
            "
          >
            <p className="text-white/90">{city.description}</p>
            {!city.isSelected && !city.isFixed && (
              <p className="mt-1 text-rui-golden font-medium">Tap to add</p>
            )}
            {/* Arrow */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-rui-black/90" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default DiscoveryCityPin;
