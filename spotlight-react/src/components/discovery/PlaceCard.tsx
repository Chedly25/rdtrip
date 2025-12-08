import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Gem, Utensils, Coffee, Wine, Building2, Palette, TreePine, Store, MapPin, Eye, Sparkles } from 'lucide-react';
import type { DiscoveryPlace, PlaceType } from '../../stores/discoveryStore';

interface PlaceCardProps {
  place: DiscoveryPlace;
  isFavourited: boolean;
  onToggleFavourite: () => void;
  /** Animation delay for staggered entrance */
  delay?: number;
}

/**
 * PlaceCard
 *
 * Displays an individual place/POI in the city preview panel.
 * Warm editorial aesthetic matching Waycraft's travel guide feel.
 *
 * Design decisions:
 * - Horizontal layout for list scanning efficiency
 * - Square photo with rounded corners (64x64 on mobile, 80x80 on desktop)
 * - Type badge uses category-specific icons and colors
 * - Hidden gem badge has golden sparkle treatment
 * - Favourite button with heart animation
 * - Subtle hover elevation for interactivity
 */
export function PlaceCard({
  place,
  isFavourited,
  onToggleFavourite,
  delay = 0,
}: PlaceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Type-specific styling
  const typeConfig: Record<PlaceType, { icon: typeof Utensils; color: string; bg: string; label: string }> = {
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

  const config = typeConfig[place.type] || typeConfig.other;
  const TypeIcon = config.icon;

  // Format review count
  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Render rating stars
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < fullStars
                  ? 'text-rui-golden fill-rui-golden'
                  : i === fullStars && hasHalfStar
                  ? 'text-rui-golden fill-rui-golden/50'
                  : 'text-rui-grey-20'
              }`}
            />
          ))}
        </div>
        <span className="text-body-3 font-medium text-rui-grey-70">
          {rating.toFixed(1)}
        </span>
        {place.reviewCount && (
          <span className="text-body-3 text-rui-grey-40">
            ({formatReviewCount(place.reviewCount)})
          </span>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      <motion.div
        animate={{
          y: isHovered ? -2 : 0,
          boxShadow: isHovered
            ? '0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.05)'
            : '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
        transition={{ duration: 0.2 }}
        className="
          flex items-start gap-3 p-3
          bg-white rounded-xl
          border border-rui-grey-10
          cursor-pointer
        "
      >
        {/* Photo */}
        <div className="relative flex-shrink-0">
          <div
            className="
              w-16 h-16 md:w-20 md:h-20
              rounded-lg overflow-hidden
              bg-gradient-to-br from-rui-cream to-rui-grey-5
            "
          >
            {place.photoUrl ? (
              <img
                src={place.photoUrl}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            ) : (
              // Placeholder pattern
              <div className="w-full h-full flex items-center justify-center">
                <TypeIcon className={`w-6 h-6 ${config.color} opacity-40`} />
              </div>
            )}
          </div>

          {/* Hidden gem badge */}
          <AnimatePresence>
            {place.isHiddenGem && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="
                  absolute -top-1.5 -right-1.5
                  w-6 h-6 rounded-full
                  bg-gradient-to-br from-rui-golden to-amber-500
                  flex items-center justify-center
                  shadow-lg shadow-rui-golden/30
                  ring-2 ring-white
                "
              >
                <Gem className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-0.5">
          {/* Name and type */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-display text-body-1 font-semibold text-rui-black leading-tight line-clamp-2">
              {place.name}
            </h4>
          </div>

          {/* Type badge */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`
                inline-flex items-center gap-1
                px-2 py-0.5 rounded-full
                text-body-3 font-medium
                ${config.bg} ${config.color}
              `}
            >
              <TypeIcon className="w-3 h-3" />
              {config.label}
            </span>

            {/* Price level */}
            {place.priceLevel && (
              <span className="text-body-3 text-rui-grey-40">
                {'€'.repeat(place.priceLevel)}
                <span className="text-rui-grey-15">{'€'.repeat(4 - place.priceLevel)}</span>
              </span>
            )}
          </div>

          {/* Rating */}
          {place.rating && renderRating(place.rating)}

          {/* Description (if available and hovered) */}
          <AnimatePresence>
            {isHovered && place.description && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-body-3 text-rui-grey-50 mt-2 line-clamp-2"
              >
                {place.description}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Favourite button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="
            flex-shrink-0
            w-9 h-9 rounded-full
            flex items-center justify-center
            transition-colors duration-200
            hover:bg-rui-grey-5
          "
          aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
        >
          <motion.div
            animate={{
              scale: isFavourited ? [1, 1.3, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <Heart
              className={`
                w-5 h-5 transition-colors duration-200
                ${isFavourited
                  ? 'text-rose-500 fill-rose-500'
                  : 'text-rui-grey-30 group-hover:text-rui-grey-50'
                }
              `}
            />
          </motion.div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default PlaceCard;
