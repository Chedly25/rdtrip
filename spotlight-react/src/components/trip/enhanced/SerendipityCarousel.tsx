/**
 * SerendipityCarousel - "While You're Here" Discoveries
 *
 * A horizontally scrollable carousel of discovery cards that surface
 * unexpected delights, local secrets, and hidden gems near the traveler.
 *
 * Design: Playful cards with subtle tilt on hover, photo backgrounds,
 * swipeable with momentum scrolling. Each card feels like a whispered secret.
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
  Sparkles,
  Gem,
  Camera,
  Utensils,
  Clock,
  MapPin,
  Star,
  Shuffle,
  ChevronRight,
  Heart,
  Lightbulb,
} from 'lucide-react';
import { useTimeTheme } from '../hooks/useTimeOfDay';
import type { SerendipityCard } from '../services/tripCompanion';

interface SerendipityCarouselProps {
  discoveries: SerendipityCard[];
  onCardClick?: (card: SerendipityCard) => void;
  onSave?: (card: SerendipityCard) => void;
  onShuffle?: () => void;
  loading?: boolean;
}

// Map discovery type to icon and label
const typeConfig = {
  hidden_gem: { icon: Gem, label: 'Hidden Gem', color: '#9D8189' },
  local_event: { icon: Sparkles, label: 'Happening Now', color: '#E07B39' },
  photo_spot: { icon: Camera, label: 'Photo Spot', color: '#5B9BD5' },
  food_gem: { icon: Utensils, label: 'Local Favorite', color: '#6B8E7B' },
  timing_tip: { icon: Clock, label: 'Timing Tip', color: '#D4A853' },
};

// Individual Discovery Card
const DiscoveryCard: React.FC<{
  card: SerendipityCard;
  index: number;
  onClick?: () => void;
  onSave?: () => void;
}> = ({ card, index, onClick, onSave }) => {
  const { theme } = useTimeTheme();
  const [isSaved, setIsSaved] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const config = typeConfig[card.type] || typeConfig.hidden_gem;
  const Icon = config.icon;

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    onSave?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, rotateY: -10 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, rotateY: 3, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex-shrink-0 w-72 cursor-pointer group"
      style={{ perspective: 1000 }}
    >
      <div
        className="relative h-80 rounded-2xl overflow-hidden"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
          boxShadow: theme.shadow,
        }}
      >
        {/* Photo or Gradient Background */}
        <div className="absolute inset-0">
          {card.photo ? (
            <img
              src={card.photo}
              alt={card.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${config.color}30 0%, ${theme.primary}20 100%)`,
              }}
            />
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${theme.isNight ? 'rgba(26,22,33,0.95)' : 'rgba(0,0,0,0.7)'} 0%, transparent 60%)`,
            }}
          />
        </div>

        {/* Type Badge */}
        <div
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md"
          style={{
            background: `${config.color}E6`,
            color: 'white',
          }}
        >
          <Icon className="w-3 h-3" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            {config.label}
          </span>
        </div>

        {/* Save Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md"
          style={{
            background: isSaved ? theme.primary : 'rgba(255,255,255,0.2)',
          }}
        >
          <Heart
            className={`w-4 h-4 ${isSaved ? 'fill-white text-white' : 'text-white'}`}
          />
        </motion.button>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Title */}
          <h3
            className="text-lg font-bold text-white mb-1 line-clamp-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {card.title}
          </h3>

          {/* Description */}
          {card.description && (
            <p className="text-white/70 text-sm mb-3 line-clamp-2">
              {card.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 text-white/60 text-xs">
            {card.distance !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {card.walkingTime
                    ? `${card.walkingTime} min walk`
                    : `${card.distance}m`}
                </span>
              </div>
            )}

            {card.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current text-yellow-400" />
                <span>{card.rating.toFixed(1)}</span>
              </div>
            )}

            {card.bestTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{card.bestTime}</span>
              </div>
            )}
          </div>

          {/* Insider Tip Toggle */}
          {card.insiderTip && (
            <motion.div className="mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTip(!showTip);
                }}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: theme.secondary }}
              >
                <Lightbulb className="w-3 h-3" />
                <span>{showTip ? 'Hide tip' : 'Show tip'}</span>
              </button>

              <AnimatePresence>
                {showTip && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-2 text-xs text-white/80 italic">
                      "{card.insiderTip}"
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Hover Reveal - "Why Special" */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none"
          style={{
            background: `${theme.primary}E6`,
          }}
        >
          {card.whySpecial && (
            <p className="text-white text-center text-sm font-medium">
              {card.whySpecial}
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

// Loading Skeleton
const SkeletonCard: React.FC<{ index: number }> = ({ index }) => {
  const { theme } = useTimeTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="flex-shrink-0 w-72 h-80 rounded-2xl overflow-hidden"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      <div className="animate-pulse h-full flex flex-col">
        <div
          className="flex-1"
          style={{ background: `${theme.primary}20` }}
        />
        <div className="p-4 space-y-3">
          <div
            className="h-5 rounded w-3/4"
            style={{ background: `${theme.primary}20` }}
          />
          <div
            className="h-3 rounded w-full"
            style={{ background: `${theme.primary}10` }}
          />
          <div
            className="h-3 rounded w-2/3"
            style={{ background: `${theme.primary}10` }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const SerendipityCarousel: React.FC<SerendipityCarouselProps> = ({
  discoveries,
  onCardClick,
  onSave,
  onShuffle,
  loading = false,
}) => {
  const { theme } = useTimeTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag/swipe
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.scrollLeft -= info.offset.x;
    }
  };

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" style={{ color: theme.primary }} />
          <h3
            className="text-lg font-semibold"
            style={{ color: theme.textPrimary }}
          >
            While You're Here
          </h3>
        </div>

        {onShuffle && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
            style={{
              background: `${theme.primary}15`,
              color: theme.primary,
            }}
          >
            <Shuffle className="w-4 h-4" />
            <span>Surprise me</span>
          </motion.button>
        )}
      </div>

      {/* Carousel */}
      <motion.div
        ref={scrollRef}
        className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-4"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))
        ) : discoveries.length === 0 ? (
          // Empty state
          <div
            className="flex-shrink-0 w-72 h-80 rounded-2xl flex flex-col items-center justify-center p-6"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <Sparkles
              className="w-12 h-12 mb-4"
              style={{ color: `${theme.primary}40` }}
            />
            <p
              className="text-center text-sm"
              style={{ color: theme.textMuted }}
            >
              Discovering nearby gems...
            </p>
          </div>
        ) : (
          // Discovery cards
          discoveries.map((card, index) => (
            <DiscoveryCard
              key={card.id}
              card={card}
              index={index}
              onClick={() => !isDragging && onCardClick?.(card)}
              onSave={() => onSave?.(card)}
            />
          ))
        )}

        {/* See More Card */}
        {discoveries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: discoveries.length * 0.1 }}
            className="flex-shrink-0 w-40 h-80 rounded-2xl flex flex-col items-center justify-center cursor-pointer group"
            style={{
              background: `${theme.primary}10`,
              border: `2px dashed ${theme.primary}40`,
            }}
            whileHover={{
              background: `${theme.primary}20`,
              borderStyle: 'solid',
            }}
          >
            <motion.div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: `${theme.primary}20` }}
              whileHover={{ scale: 1.1 }}
            >
              <ChevronRight
                className="w-6 h-6"
                style={{ color: theme.primary }}
              />
            </motion.div>
            <span
              className="text-sm font-medium"
              style={{ color: theme.primary }}
            >
              Explore More
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SerendipityCarousel;
