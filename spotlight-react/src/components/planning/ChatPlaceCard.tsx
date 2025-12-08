/**
 * ChatPlaceCard
 *
 * WI-3.6: Compact place card for embedding in companion chat messages
 *
 * Design Direction: Refined editorial mini-card
 * - Polaroid/travel-journal snippet aesthetic
 * - Compact but informative (~60px height)
 * - Photo as hero with overlaid badges
 * - Native to chat flow - doesn't disrupt conversation rhythm
 *
 * Architecture Decision:
 * - Separate from main PlaceCard for optimal chat UX
 * - Shares type config for visual consistency
 * - Self-contained with all interactions
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Star,
  Gem,
  Utensils,
  Coffee,
  Wine,
  Building2,
  Palette,
  TreePine,
  Store,
  MapPin,
  Eye,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import type { DiscoveryPlace, PlaceType } from '../../stores/discoveryStore';

// ============================================================================
// Types
// ============================================================================

interface ChatPlaceCardProps {
  place: DiscoveryPlace;
  isFavourited: boolean;
  onToggleFavourite: () => void;
  onTap?: () => void;
  /** Compact mode for inline lists */
  compact?: boolean;
  /** Show action arrow */
  showArrow?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Type-specific styling (shared with main PlaceCard)
 */
const TYPE_CONFIG: Record<PlaceType, {
  icon: typeof Utensils;
  color: string;
  bg: string;
  label: string;
}> = {
  restaurant: { icon: Utensils, color: 'text-rui-accent', bg: 'bg-rui-accent/10', label: 'Restaurant' },
  cafe: { icon: Coffee, color: 'text-amber-700', bg: 'bg-amber-50', label: 'Café' },
  bar: { icon: Wine, color: 'text-purple-700', bg: 'bg-purple-50', label: 'Bar' },
  museum: { icon: Building2, color: 'text-blue-700', bg: 'bg-blue-50', label: 'Museum' },
  gallery: { icon: Palette, color: 'text-pink-700', bg: 'bg-pink-50', label: 'Gallery' },
  park: { icon: TreePine, color: 'text-rui-sage', bg: 'bg-rui-sage/10', label: 'Park' },
  landmark: { icon: MapPin, color: 'text-rui-accent', bg: 'bg-rui-accent/10', label: 'Landmark' },
  shop: { icon: Store, color: 'text-indigo-700', bg: 'bg-indigo-50', label: 'Shop' },
  market: { icon: Store, color: 'text-orange-700', bg: 'bg-orange-50', label: 'Market' },
  viewpoint: { icon: Eye, color: 'text-sky-700', bg: 'bg-sky-50', label: 'Viewpoint' },
  experience: { icon: Sparkles, color: 'text-rui-golden', bg: 'bg-rui-golden/10', label: 'Experience' },
  other: { icon: MapPin, color: 'text-rui-grey-50', bg: 'bg-rui-grey-5', label: 'Place' },
};

// ============================================================================
// Component
// ============================================================================

export function ChatPlaceCard({
  place,
  isFavourited,
  onToggleFavourite,
  onTap,
  compact = false,
  showArrow = true,
}: ChatPlaceCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const config = TYPE_CONFIG[place.type] || TYPE_CONFIG.other;
  const TypeIcon = config.icon;

  // Handle card tap (separate from favourite)
  const handleCardTap = useCallback(() => {
    onTap?.();
  }, [onTap]);

  // Handle favourite toggle
  const handleFavourite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavourite();
  }, [onToggleFavourite]);

  // Format rating for display
  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      onClick={handleCardTap}
      className="group cursor-pointer"
    >
      <motion.div
        animate={{
          scale: isPressed ? 0.98 : 1,
          backgroundColor: isPressed ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,1)',
        }}
        transition={{ duration: 0.15 }}
        className={`
          relative flex items-center gap-3
          ${compact ? 'p-2' : 'p-2.5'}
          bg-white rounded-xl
          border border-rui-grey-10
          shadow-sm shadow-black/[0.03]
          hover:shadow-md hover:shadow-black/[0.06]
          hover:border-rui-grey-15
          transition-shadow duration-200
        `}
      >
        {/* Photo Container */}
        <div className="relative flex-shrink-0">
          <div
            className={`
              ${compact ? 'w-11 h-11' : 'w-12 h-12'}
              rounded-lg overflow-hidden
              bg-gradient-to-br from-rui-cream to-rui-grey-5
              ring-1 ring-black/[0.04]
            `}
          >
            {place.photoUrl ? (
              <img
                src={place.photoUrl}
                alt={place.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <TypeIcon className={`w-5 h-5 ${config.color} opacity-40`} />
              </div>
            )}
          </div>

          {/* Hidden Gem Badge */}
          <AnimatePresence>
            {place.isHiddenGem && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 45 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className={`
                  absolute -top-1 -right-1
                  ${compact ? 'w-4.5 h-4.5' : 'w-5 h-5'}
                  rounded-full
                  bg-gradient-to-br from-rui-golden via-amber-400 to-amber-500
                  flex items-center justify-center
                  shadow-md shadow-rui-golden/40
                  ring-[1.5px] ring-white
                `}
              >
                <Gem className={`${compact ? 'w-2' : 'w-2.5'} ${compact ? 'h-2' : 'h-2.5'} text-white`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-0.5">
          {/* Name */}
          <h4
            className={`
              font-display font-semibold text-rui-black
              leading-tight truncate
              ${compact ? 'text-body-3' : 'text-body-2'}
            `}
          >
            {place.name}
          </h4>

          {/* Meta Row: Type + Rating */}
          <div className="flex items-center gap-2 mt-0.5">
            {/* Type badge (icon only for compactness) */}
            <span
              className={`
                inline-flex items-center gap-1
                px-1.5 py-0.5 rounded-md
                ${config.bg} ${config.color}
              `}
            >
              <TypeIcon className="w-3 h-3" />
              <span className={`font-medium ${compact ? 'text-[10px]' : 'text-body-3'}`}>
                {config.label}
              </span>
            </span>

            {/* Rating */}
            {place.rating && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-rui-golden fill-rui-golden" />
                <span className={`font-medium text-rui-grey-60 ${compact ? 'text-[10px]' : 'text-body-3'}`}>
                  {formatRating(place.rating)}
                </span>
              </div>
            )}

            {/* Price Level */}
            {place.priceLevel && !compact && (
              <span className="text-body-3 text-rui-grey-40">
                {'€'.repeat(place.priceLevel)}
              </span>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1">
          {/* Favourite Button */}
          <motion.button
            onClick={handleFavourite}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            className={`
              ${compact ? 'w-7 h-7' : 'w-8 h-8'}
              rounded-full
              flex items-center justify-center
              hover:bg-rui-grey-5
              active:bg-rui-grey-10
              transition-colors duration-150
            `}
            aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
          >
            <motion.div
              animate={isFavourited ? {
                scale: [1, 1.4, 1],
              } : {}}
              transition={{ duration: 0.35 }}
            >
              <Heart
                className={`
                  ${compact ? 'w-4 h-4' : 'w-[18px] h-[18px]'}
                  transition-colors duration-150
                  ${isFavourited
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-rui-grey-30 group-hover:text-rui-grey-50'
                  }
                `}
              />
            </motion.div>
          </motion.button>

          {/* Tap indicator */}
          {showArrow && onTap && (
            <ChevronRight
              className={`
                ${compact ? 'w-4 h-4' : 'w-5 h-5'}
                text-rui-grey-25
                group-hover:text-rui-grey-40
                group-hover:translate-x-0.5
                transition-all duration-200
              `}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Inline Place Mention (for within message text)
// ============================================================================

interface InlinePlaceMentionProps {
  place: DiscoveryPlace;
  onTap?: () => void;
}

/**
 * InlinePlaceMention
 *
 * Ultra-compact place reference for embedding within text.
 * Shows as a styled inline element that can be tapped.
 */
export function InlinePlaceMention({ place, onTap }: InlinePlaceMentionProps) {
  const config = TYPE_CONFIG[place.type] || TYPE_CONFIG.other;
  const TypeIcon = config.icon;

  return (
    <motion.button
      onClick={onTap}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5 rounded-md
        ${config.bg}
        border border-current/10
        text-body-3 font-medium ${config.color}
        hover:shadow-sm
        transition-all duration-150
        align-middle
      `}
    >
      <TypeIcon className="w-3 h-3" />
      <span className="max-w-[120px] truncate">{place.name}</span>
      {place.isHiddenGem && (
        <Gem className="w-2.5 h-2.5 text-rui-golden" />
      )}
      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
    </motion.button>
  );
}

// ============================================================================
// Place Card List (for multiple places in chat)
// ============================================================================

interface ChatPlaceCardListProps {
  places: DiscoveryPlace[];
  favouritedIds: string[];
  onToggleFavourite: (placeId: string) => void;
  onTapPlace?: (place: DiscoveryPlace) => void;
  maxVisible?: number;
}

/**
 * ChatPlaceCardList
 *
 * Renders a stack of place cards optimized for chat.
 * Shows a limited number with "show more" option.
 */
export function ChatPlaceCardList({
  places,
  favouritedIds,
  onToggleFavourite,
  onTapPlace,
  maxVisible = 3,
}: ChatPlaceCardListProps) {
  const [showAll, setShowAll] = useState(false);

  const visiblePlaces = showAll ? places : places.slice(0, maxVisible);
  const hiddenCount = places.length - maxVisible;

  return (
    <div className="space-y-2">
      {visiblePlaces.map((place, index) => (
        <motion.div
          key={place.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: index * 0.05,
            duration: 0.25,
          }}
        >
          <ChatPlaceCard
            place={place}
            isFavourited={favouritedIds.includes(place.id)}
            onToggleFavourite={() => onToggleFavourite(place.id)}
            onTap={() => onTapPlace?.(place)}
            compact={places.length > 2}
          />
        </motion.div>
      ))}

      {/* Show more button */}
      {!showAll && hiddenCount > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: maxVisible * 0.05 }}
          onClick={() => setShowAll(true)}
          className="
            w-full py-2 px-3
            text-body-3 font-medium text-rui-accent
            bg-rui-accent/5 hover:bg-rui-accent/10
            rounded-lg
            transition-colors duration-150
          "
        >
          Show {hiddenCount} more {hiddenCount === 1 ? 'place' : 'places'}
        </motion.button>
      )}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { TYPE_CONFIG };
export default ChatPlaceCard;
