/**
 * NearbySection
 *
 * Horizontal scrolling section showing items within 10 min walk of user's picks.
 * Features: compact cards, walking time badges, quick add buttons.
 *
 * Design: Compact horizontal scroll with subtle gradients
 */

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Camera,
  Sparkles,
  Wine,
  Coffee,
  Building2,
} from 'lucide-react';
import { DistanceBadge } from '../shared/DistanceBadge';
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

const typeColors: Record<PlanCardType, { bg: string; text: string }> = {
  restaurant: { bg: '#FEF3EE', text: '#C45830' },
  activity: { bg: '#F5F0FF', text: '#7C5CDB' },
  photo_spot: { bg: '#EEF6F8', text: '#4A90A4' },
  hotel: { bg: '#F5F0E8', text: '#8B7355' },
  bar: { bg: '#FDF4F8', text: '#C4507C' },
  cafe: { bg: '#F0F7F4', text: '#4A7C59' },
  experience: { bg: '#FFF8E6', text: '#D4A853' },
};

interface NearbyCardProps {
  card: PlanCard;
  walkingMinutes: number;
  onAdd: () => void;
  isAdded: boolean;
}

function NearbyCard({ card, walkingMinutes, onAdd, isAdded }: NearbyCardProps) {
  const Icon = typeIcons[card.type] || Sparkles;
  const colors = typeColors[card.type] || typeColors.activity;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className={`
        flex-shrink-0 w-40
        bg-[#FFFBF5] rounded-xl border
        ${isAdded ? 'border-[#4A7C59]/30 opacity-70' : 'border-[#E5DDD0]'}
        hover:border-[#C45830] hover:shadow-md
        transition-all duration-200
        overflow-hidden
      `}
    >
      {/* Compact header with icon */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: colors.bg }}
      >
        <Icon className="w-4 h-4" style={{ color: colors.text }} />
        <DistanceBadge minutes={walkingMinutes} compact />
      </div>

      {/* Content */}
      <div className="p-3 pt-2">
        <h5 className="font-['Satoshi',sans-serif] font-semibold text-sm text-[#2C2417] line-clamp-2 leading-tight mb-2">
          {card.name}
        </h5>

        {/* Add button */}
        {!isAdded ? (
          <button
            onClick={onAdd}
            className="
              w-full py-1.5 rounded-lg
              bg-[#C45830] hover:bg-[#A84828]
              text-white text-xs font-['Satoshi',sans-serif] font-medium
              flex items-center justify-center gap-1
              transition-colors duration-200
            "
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        ) : (
          <div className="
            w-full py-1.5 rounded-lg
            bg-[#F0F7F4] border border-[#4A7C59]/20
            text-[#4A7C59] text-xs font-['Satoshi',sans-serif] font-medium
            flex items-center justify-center gap-1
          ">
            <Check className="w-3 h-3" />
            Added
          </div>
        )}
      </div>
    </motion.div>
  );
}

export interface NearbySectionProps {
  cards: PlanCard[];
  onAddCard: (card: PlanCard) => void;
  addedIds: Set<string>;
}

export function NearbySection({ cards, onAddCard, addedIds }: NearbySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll state
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        ref.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [cards]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 180; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Don't render if no nearby cards
  if (cards.length === 0) {
    return null;
  }

  return (
    <section className="relative">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#F0F7F4] flex items-center justify-center">
          <MapPin className="w-4 h-4 text-[#4A7C59]" />
        </div>
        <div>
          <h4 className="font-['Satoshi',sans-serif] font-semibold text-sm text-[#2C2417] uppercase tracking-wide">
            Near Your Picks
          </h4>
          <p className="text-xs text-[#8B7355] font-['Satoshi',sans-serif]">
            Within 10 min walk
          </p>
        </div>
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="
              absolute left-0 top-1/2 -translate-y-1/2 z-10
              w-8 h-8 rounded-full
              bg-white/90 border border-[#E5DDD0] shadow-md
              flex items-center justify-center
              text-[#8B7355] hover:text-[#C45830]
              transition-all duration-200
            "
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Cards */}
        <div
          ref={scrollRef}
          className="
            flex gap-3 overflow-x-auto scrollbar-hide
            pb-2 -mb-2
            scroll-smooth
          "
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {cards.map((card) => {
            // Get walking minutes from proximity data
            const cardWithProximity = card as PlanCard & {
              proximity?: { walkingMinutes: number };
            };
            const walkingMinutes = cardWithProximity.proximity?.walkingMinutes || 5;

            return (
              <NearbyCard
                key={card.id}
                card={card}
                walkingMinutes={walkingMinutes}
                onAdd={() => onAddCard(card)}
                isAdded={addedIds.has(card.id)}
              />
            );
          })}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="
              absolute right-0 top-1/2 -translate-y-1/2 z-10
              w-8 h-8 rounded-full
              bg-white/90 border border-[#E5DDD0] shadow-md
              flex items-center justify-center
              text-[#8B7355] hover:text-[#C45830]
              transition-all duration-200
            "
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Gradient fades */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-[#FAF7F2] to-transparent pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#FAF7F2] to-transparent pointer-events-none" />
        )}
      </div>
    </section>
  );
}

export default NearbySection;
