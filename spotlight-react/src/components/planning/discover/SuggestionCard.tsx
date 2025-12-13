/**
 * SuggestionCard
 *
 * Editorial-style suggestion card with large imagery and one-tap add.
 * Design: Wanderlust magazine aesthetic - warm tones, generous spacing,
 * dramatic imagery with subtle overlays.
 *
 * Key features:
 * - 3:2 aspect ratio images (or elegant loading skeleton)
 * - Type badge with icon overlay
 * - One-tap "Add to Plan" button (no cluster selection)
 * - Refined typography and micro-interactions
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Clock,
  Utensils,
  Camera,
  Sparkles,
  Wine,
  Coffee,
  Building2,
  Plus,
  MapPin,
} from 'lucide-react';
import { DistanceBadge } from '../shared/DistanceBadge';
import { PriceBadge } from '../shared/PriceBadge';
import type { PlanCard, PlanCardType } from '../../../types/planning';

// Type icons mapping
const typeIcons: Record<PlanCardType, React.ElementType> = {
  restaurant: Utensils,
  activity: Sparkles,
  photo_spot: Camera,
  hotel: Building2,
  bar: Wine,
  cafe: Coffee,
  experience: Sparkles,
};

// Refined color palette for each type - warm editorial tones
const typeStyles: Record<PlanCardType, {
  accent: string;
  bg: string;
  gradient: string;
  text: string;
}> = {
  restaurant: {
    accent: '#C45830',
    bg: 'rgba(196, 88, 48, 0.08)',
    gradient: 'from-[#2C2417]/60 via-[#2C2417]/20 to-transparent',
    text: '#FEF3EE',
  },
  activity: {
    accent: '#7C5CDB',
    bg: 'rgba(124, 92, 219, 0.08)',
    gradient: 'from-[#2C2417]/60 via-[#2C2417]/20 to-transparent',
    text: '#F5F0FF',
  },
  photo_spot: {
    accent: '#4A90A4',
    bg: 'rgba(74, 144, 164, 0.08)',
    gradient: 'from-[#2C2417]/60 via-[#2C2417]/20 to-transparent',
    text: '#EEF6F8',
  },
  hotel: {
    accent: '#8B7355',
    bg: 'rgba(139, 115, 85, 0.08)',
    gradient: 'from-[#2C2417]/60 via-[#2C2417]/20 to-transparent',
    text: '#F5F0E8',
  },
  bar: {
    accent: '#C4507C',
    bg: 'rgba(196, 80, 124, 0.08)',
    gradient: 'from-[#2C2417]/60 via-[#2C2417]/20 to-transparent',
    text: '#FDF4F8',
  },
  cafe: {
    accent: '#4A7C59',
    bg: 'rgba(74, 124, 89, 0.08)',
    gradient: 'from-[#2C2417]/60 via-[#2C2417]/20 to-transparent',
    text: '#F0F7F4',
  },
  experience: {
    accent: '#D4A853',
    bg: 'rgba(212, 168, 83, 0.08)',
    gradient: 'from-[#2C2417]/60 via-[#2C2417]/20 to-transparent',
    text: '#FFF8E6',
  },
};

// Type labels for display
const typeLabels: Record<PlanCardType, string> = {
  restaurant: 'Restaurant',
  activity: 'Activity',
  photo_spot: 'Photo Spot',
  hotel: 'Hotel',
  bar: 'Bar',
  cafe: 'Café',
  experience: 'Experience',
};

export interface SuggestionCardProps {
  card: PlanCard;
  nearestCluster?: { name: string; walkingMinutes: number };
  onAdd: () => void;
  isAdded: boolean;
}

export function SuggestionCard({
  card,
  nearestCluster,
  onAdd,
  isAdded,
}: SuggestionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const Icon = typeIcons[card.type] || Sparkles;
  const styles = typeStyles[card.type] || typeStyles.activity;

  // Format duration
  const durationText = card.duration >= 60
    ? `${Math.floor(card.duration / 60)}h${card.duration % 60 > 0 ? ` ${card.duration % 60}m` : ''}`
    : `${card.duration}m`;

  const hasImage = card.imageUrl && !imageError;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative bg-[#FFFBF5] rounded-2xl overflow-hidden
        border transition-all duration-300
        ${isAdded
          ? 'border-[#4A7C59]/30 opacity-60 scale-[0.98]'
          : isHovered
            ? 'border-[#C45830]/40 shadow-xl shadow-[#2C2417]/10'
            : 'border-[#E5DDD0] shadow-md shadow-[#2C2417]/5'
        }
        group
      `}
    >
      {/* Image Section - 3:2 aspect ratio */}
      <div className="relative w-full aspect-[3/2] overflow-hidden bg-[#F5F0E8]">
        {/* Loading skeleton */}
        <AnimatePresence>
          {!imageLoaded && hasImage && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-[#F5F0E8] via-[#EDE5D8] to-[#F5F0E8] animate-pulse"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon
                  className="w-12 h-12 opacity-20"
                  style={{ color: styles.accent }}
                  strokeWidth={1}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actual image */}
        {hasImage ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className={`
              absolute inset-0 w-full h-full object-cover
              transition-all duration-500
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              ${isHovered ? 'scale-105' : 'scale-100'}
            `}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback gradient with icon
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${styles.bg} 0%, #F5F0E8 100%)`,
            }}
          >
            <Icon
              className="w-16 h-16 opacity-30 transition-transform duration-300 group-hover:scale-110"
              style={{ color: styles.accent }}
              strokeWidth={1}
            />
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className={`absolute inset-0 bg-gradient-to-t ${styles.gradient} pointer-events-none`} />

        {/* Type badge - top left */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute top-3 left-3 z-10"
        >
          <span
            className="
              inline-flex items-center gap-1.5 px-2.5 py-1.5
              rounded-full text-xs font-semibold
              backdrop-blur-md border border-white/20
              shadow-sm
            "
            style={{
              backgroundColor: `${styles.accent}dd`,
              color: styles.text,
            }}
          >
            <Icon className="w-3 h-3" strokeWidth={2.5} />
            {typeLabels[card.type]}
          </span>
        </motion.div>

        {/* Added overlay */}
        <AnimatePresence>
          {isAdded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#4A7C59]/30 backdrop-blur-[2px] flex items-center justify-center z-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-16 h-16 rounded-full bg-[#4A7C59] flex items-center justify-center shadow-lg"
              >
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <h3
          className="
            font-['Fraunces',Georgia,serif] font-semibold
            text-lg leading-tight text-[#2C2417]
            line-clamp-1
          "
        >
          {card.name}
        </h3>

        {/* Description */}
        <p
          className="
            font-['Satoshi',system-ui,sans-serif] text-sm
            text-[#8B7355] leading-relaxed
            line-clamp-2
          "
        >
          {card.description}
        </p>

        {/* Meta row: Price, Duration, Best Time */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-[#8B7355]">
          <PriceBadge level={card.priceLevel as 1 | 2 | 3 | 4} />

          <span className="w-px h-3 bg-[#E5DDD0]" />

          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 opacity-60" />
            <span className="font-medium">{durationText}</span>
          </span>

          {card.bestTime && (
            <>
              <span className="w-px h-3 bg-[#E5DDD0]" />
              <span className="capitalize font-medium">{card.bestTime}</span>
            </>
          )}
        </div>

        {/* Location area badge */}
        {card.location?.area && (
          <div className="flex items-center gap-1.5 text-xs text-[#8B7355]/80">
            <MapPin className="w-3 h-3 opacity-50" />
            <span>{card.location.area}</span>
          </div>
        )}

        {/* Proximity badge */}
        {nearestCluster && nearestCluster.walkingMinutes < 60 && (
          <div className="pt-1">
            <DistanceBadge
              minutes={nearestCluster.walkingMinutes}
              fromName={nearestCluster.name}
            />
          </div>
        )}

        {/* Add Button - Simple one-tap */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isAdded) onAdd();
          }}
          disabled={isAdded}
          className={`
            w-full mt-2 py-3 rounded-xl
            font-['Satoshi',system-ui,sans-serif] font-semibold text-sm
            flex items-center justify-center gap-2
            transition-all duration-200
            ${isAdded
              ? 'bg-[#F0F7F4] border border-[#4A7C59]/20 text-[#4A7C59] cursor-default'
              : `bg-gradient-to-r from-[${styles.accent}] to-[${styles.accent}]/90 text-white shadow-md hover:shadow-lg`
            }
          `}
          style={!isAdded ? {
            background: `linear-gradient(135deg, ${styles.accent} 0%, ${styles.accent}dd 100%)`,
          } : undefined}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              Added to Plan
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add to Plan
            </>
          )}
        </motion.button>
      </div>
    </motion.article>
  );
}

// Loading skeleton for SuggestionCard
export function SuggestionCardSkeleton() {
  return (
    <div className="bg-[#FFFBF5] rounded-2xl border border-[#E5DDD0] overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-[3/2] bg-gradient-to-br from-[#F5F0E8] via-[#EDE5D8] to-[#F5F0E8]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#E5DDD0]/50" />
        </div>
      </div>

      {/* Content placeholder */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-6 bg-[#F5F0E8] rounded-lg w-3/4" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-[#F5F0E8] rounded w-full" />
          <div className="h-4 bg-[#F5F0E8] rounded w-2/3" />
        </div>

        {/* Meta */}
        <div className="flex gap-3">
          <div className="h-4 bg-[#F5F0E8] rounded w-12" />
          <div className="h-4 bg-[#F5F0E8] rounded w-16" />
        </div>

        {/* Button */}
        <div className="h-12 bg-[#F5F0E8] rounded-xl w-full mt-2" />
      </div>
    </div>
  );
}

export default memo(SuggestionCard);
