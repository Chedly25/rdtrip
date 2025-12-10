/**
 * IdeaCard - Swipeable polaroid-style recommendation card
 *
 * Aesthetic: Vintage travel postcard / scrapbook
 * - Cream paper texture background
 * - Subtle drop shadow and rotation
 * - Handwritten-style details
 * - Tape/pin decorative elements
 *
 * Interactions:
 * - Swipe right → Save/favorite
 * - Swipe left → Skip/dismiss
 * - Tap → Add to trip (opens day picker)
 */

import { useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import {
  Heart,
  X,
  Plus,
  Star,
  MapPin,
  DollarSign,
  Utensils,
  Building2,
  Landmark,
  Trees,
  Clock
} from 'lucide-react';
import type { Idea, IdeaCategory } from '../../../contexts/IdeasBoardContext';

interface IdeaCardProps {
  idea: Idea;
  onSave: () => void;
  onSkip: () => void;
  onAddToTrip: () => void;
  isTopCard?: boolean;
  stackPosition?: number;
}

// Category styling
const categoryConfig: Record<IdeaCategory, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  label: string;
}> = {
  activity: {
    icon: Landmark,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    label: 'Activity',
  },
  restaurant: {
    icon: Utensils,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    label: 'Restaurant',
  },
  hotel: {
    icon: Building2,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    label: 'Hotel',
  },
  attraction: {
    icon: Trees,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    label: 'Attraction',
  },
  place: {
    icon: MapPin,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    label: 'Place',
  },
};

export function IdeaCard({
  idea,
  onSave,
  onSkip,
  onAddToTrip,
  isTopCard = false,
  stackPosition = 0,
}: IdeaCardProps) {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  // Motion values for swipe
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Save/Skip indicator opacity
  const saveOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);

  // Get category config
  const config = categoryConfig[idea.category] || categoryConfig.place;
  const CategoryIcon = config.icon;

  // Handle drag end
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      // Swiped right - Save
      setExitDirection('right');
      onSave();
    } else if (info.offset.x < -threshold) {
      // Swiped left - Skip
      setExitDirection('left');
      onSkip();
    }
  };

  // Stack offset for cards behind
  const stackOffset = stackPosition * 4;
  const stackScale = 1 - stackPosition * 0.02;
  const stackRotate = stackPosition * -1.5;

  return (
    <motion.div
      className="absolute w-full"
      style={{
        zIndex: 10 - stackPosition,
        y: stackOffset,
        scale: stackScale,
        rotate: stackRotate,
      }}
      initial={false}
    >
      <motion.div
        drag={isTopCard ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        style={{ x, rotate, opacity }}
        animate={exitDirection ? {
          x: exitDirection === 'right' ? 400 : -400,
          opacity: 0,
          rotate: exitDirection === 'right' ? 30 : -30,
        } : {}}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`
          relative cursor-grab active:cursor-grabbing
          ${!isTopCard ? 'pointer-events-none' : ''}
        `}
      >
        {/* Polaroid frame */}
        <div
          className="
            bg-gradient-to-br from-[#fefcf9] via-[#fdfbf7] to-[#f9f5ef]
            rounded-sm shadow-2xl
            border border-[#e8e2d9]
            overflow-hidden
          "
          style={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Decorative tape strips */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-4 bg-amber-100/80 -rotate-1 z-20 border border-amber-200/50" />

          {/* Save indicator (right swipe) */}
          <motion.div
            style={{ opacity: saveOpacity }}
            className="absolute top-4 left-4 z-30 flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-sm shadow-lg"
          >
            <Heart className="w-4 h-4 fill-white" />
            SAVE
          </motion.div>

          {/* Skip indicator (left swipe) */}
          <motion.div
            style={{ opacity: skipOpacity }}
            className="absolute top-4 right-4 z-30 flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-500 text-white font-bold text-sm shadow-lg"
          >
            <X className="w-4 h-4" />
            SKIP
          </motion.div>

          {/* Photo section */}
          <div className="relative h-48 bg-gradient-to-br from-stone-200 to-stone-300 m-3 mb-0">
            {idea.photo ? (
              <img
                src={idea.photo}
                alt={idea.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <CategoryIcon className="w-16 h-16 text-stone-400" />
              </div>
            )}

            {/* Category badge */}
            <div
              className={`
                absolute top-2 right-2 px-2.5 py-1 rounded-full
                ${config.bgColor} ${config.color}
                text-xs font-semibold
                backdrop-blur-sm border border-white/50
                flex items-center gap-1
              `}
            >
              <CategoryIcon className="w-3 h-3" />
              {config.label}
            </div>

            {/* Open/Closed indicator */}
            {idea.isOpen !== undefined && (
              <div
                className={`
                  absolute bottom-2 right-2 px-2 py-0.5 rounded-full
                  text-xs font-bold flex items-center gap-1
                  ${idea.isOpen
                    ? 'bg-emerald-500 text-white'
                    : 'bg-red-500 text-white'
                  }
                `}
              >
                <Clock className="w-3 h-3" />
                {idea.isOpen ? 'Open' : 'Closed'}
              </div>
            )}

            {/* Vintage photo corner overlays */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-white/30" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-white/30" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-white/30" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-white/30" />
          </div>

          {/* Content section - like polaroid caption area */}
          <div className="p-4 pt-3 space-y-2">
            {/* Name - handwritten style */}
            <h3
              className="text-xl font-bold text-stone-800 leading-tight"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {idea.name}
            </h3>

            {/* Rating & Reviews */}
            {idea.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-stone-700">{idea.rating}</span>
                </div>
                {idea.userRatingsTotal && (
                  <span className="text-xs text-stone-500">
                    ({idea.userRatingsTotal.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Location */}
            {(idea.city || idea.vicinity || idea.address) && (
              <div className="flex items-start gap-1.5 text-sm text-stone-600">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">
                  {idea.vicinity || idea.address || idea.city}
                </span>
              </div>
            )}

            {/* Price level */}
            {idea.priceLevel && (
              <div className="flex items-center gap-1 text-sm text-stone-600">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {'$'.repeat(idea.priceLevel)}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip();
                }}
                className="
                  flex-1 py-2 px-3 rounded-lg
                  bg-stone-100 hover:bg-stone-200
                  text-stone-600 font-medium text-sm
                  transition-colors flex items-center justify-center gap-1.5
                "
              >
                <X className="w-4 h-4" />
                Skip
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToTrip();
                }}
                className="
                  flex-1 py-2 px-3 rounded-lg
                  bg-teal-600 hover:bg-teal-700
                  text-white font-medium text-sm
                  transition-colors flex items-center justify-center gap-1.5
                  shadow-md shadow-teal-600/20
                "
              >
                <Plus className="w-4 h-4" />
                Add to Trip
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSave();
                }}
                className="
                  py-2 px-3 rounded-lg
                  bg-rose-50 hover:bg-rose-100
                  text-rose-600 font-medium text-sm
                  transition-colors flex items-center justify-center
                  border border-rose-200
                "
                title="Save for later"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vintage stamp decoration */}
          <div
            className="absolute bottom-3 right-3 text-[8px] text-stone-400 font-mono uppercase tracking-wider"
            style={{ transform: 'rotate(-5deg)' }}
          >
            ✈ {idea.source === 'mentionPlace' ? 'Recommended' : 'Discovered'}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default IdeaCard;
