/**
 * SuggestionCard
 *
 * Individual suggestion card showing a place recommendation.
 * Features: image, name, description, price, duration, proximity badge, add button.
 *
 * Design: Editorial card with warm tones, hover effects, refined typography
 */

import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Clock,
  Utensils,
  Camera,
  Sparkles,
  Wine,
  Coffee,
  Building2,
} from 'lucide-react';
import { DistanceBadge } from '../shared/DistanceBadge';
import { PriceBadge } from '../shared/PriceBadge';
import { ClusterSelectorDropdown } from '../shared/ClusterSelectorDropdown';
import type { PlanCard, PlanCardType, Cluster } from '../../../types/planning';

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

const typeColors: Record<PlanCardType, { bg: string; text: string; gradient: string }> = {
  restaurant: { bg: '#FEF3EE', text: '#C45830', gradient: 'from-[#FEF3EE] to-[#FCE8DE]' },
  activity: { bg: '#F5F0FF', text: '#7C5CDB', gradient: 'from-[#F5F0FF] to-[#EDE5FF]' },
  photo_spot: { bg: '#EEF6F8', text: '#4A90A4', gradient: 'from-[#EEF6F8] to-[#E0F0F4]' },
  hotel: { bg: '#F5F0E8', text: '#8B7355', gradient: 'from-[#F5F0E8] to-[#EDE5D8]' },
  bar: { bg: '#FDF4F8', text: '#C4507C', gradient: 'from-[#FDF4F8] to-[#FCE8F0]' },
  cafe: { bg: '#F0F7F4', text: '#4A7C59', gradient: 'from-[#F0F7F4] to-[#E0F0E8]' },
  experience: { bg: '#FFF8E6', text: '#D4A853', gradient: 'from-[#FFF8E6] to-[#FFF0CC]' },
};

export interface SuggestionCardProps {
  card: PlanCard;
  nearestCluster?: { name: string; walkingMinutes: number };
  onAdd: (clusterId?: string) => void;
  onCreateCluster?: () => void;
  isAdded: boolean;
  clusters?: Cluster[];
}

export function SuggestionCard({
  card,
  nearestCluster,
  onAdd,
  onCreateCluster,
  isAdded,
  clusters = [],
}: SuggestionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = typeIcons[card.type] || Sparkles;
  const colors = typeColors[card.type] || typeColors.activity;

  // Format duration
  const durationText = card.duration >= 60
    ? `~${Math.floor(card.duration / 60)}h${card.duration % 60 > 0 ? ` ${card.duration % 60}m` : ''}`
    : `~${card.duration}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative bg-[#FFFBF5] rounded-xl border
        ${isAdded ? 'border-[#4A7C59]/30 opacity-70' : 'border-[#E5DDD0]'}
        ${!isAdded && isHovered ? 'border-[#C45830] shadow-lg shadow-[#2C2417]/8' : 'shadow-sm'}
        transition-all duration-200 overflow-hidden
        group
      `}
    >
      {/* Image placeholder / gradient header */}
      <div
        className={`
          relative w-full aspect-[16/10]
          bg-gradient-to-br ${colors.gradient}
          flex items-center justify-center
          overflow-hidden
        `}
      >
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Icon
            className="w-10 h-10 transition-transform duration-300 group-hover:scale-110"
            style={{ color: colors.text }}
            strokeWidth={1.5}
          />
        )}

        {/* Type badge overlay */}
        <div
          className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium font-['Satoshi',sans-serif]"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          <Icon className="w-3 h-3 inline-block mr-1" strokeWidth={2} />
          {card.type.replace('_', ' ')}
        </div>

        {/* Added checkmark overlay */}
        {isAdded && (
          <div className="absolute inset-0 bg-[#4A7C59]/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#4A7C59] flex items-center justify-center">
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Name */}
        <h4 className="font-['Satoshi',sans-serif] font-semibold text-base text-[#2C2417] leading-tight mb-1 line-clamp-1">
          {card.name}
        </h4>

        {/* Description */}
        <p className="font-['Satoshi',sans-serif] text-sm text-[#8B7355] leading-snug mb-2 line-clamp-2">
          {card.description}
        </p>

        {/* Meta row: Price + Duration */}
        <div className="flex items-center gap-2 text-xs text-[#8B7355] mb-2">
          <PriceBadge level={card.priceLevel as 1 | 2 | 3 | 4} />
          <span className="text-[#E5DDD0]">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {durationText}
          </span>
          {card.bestTime && (
            <>
              <span className="text-[#E5DDD0]">·</span>
              <span className="capitalize">{card.bestTime}</span>
            </>
          )}
        </div>

        {/* Proximity badge */}
        {nearestCluster && (
          <div className="mb-3">
            <DistanceBadge
              minutes={nearestCluster.walkingMinutes}
              fromName={nearestCluster.name}
            />
          </div>
        )}

        {/* Add button / Cluster selector */}
        {!isAdded ? (
          <ClusterSelectorDropdown
            clusters={clusters}
            onSelectCluster={(clusterId) => onAdd(clusterId)}
            onCreateNew={() => onCreateCluster?.()}
            itemLocation={card.location}
          />
        ) : (
          <div className="
            w-full py-2.5 rounded-lg
            bg-[#F0F7F4] border border-[#4A7C59]/20
            text-[#4A7C59] font-['Satoshi',sans-serif] font-medium text-sm
            flex items-center justify-center gap-2
          ">
            <Check className="w-4 h-4" />
            Added to Plan
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Loading skeleton for SuggestionCard
export function SuggestionCardSkeleton() {
  return (
    <div className="bg-[#FFFBF5] rounded-xl border border-[#E5DDD0] overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-[16/10] bg-gradient-to-br from-[#F5F0E8] to-[#EDE5D8]" />

      {/* Content */}
      <div className="p-3 space-y-3">
        <div className="h-5 bg-[#F5F0E8] rounded w-3/4" />
        <div className="space-y-1.5">
          <div className="h-3 bg-[#F5F0E8] rounded w-full" />
          <div className="h-3 bg-[#F5F0E8] rounded w-2/3" />
        </div>
        <div className="flex gap-2">
          <div className="h-3 bg-[#F5F0E8] rounded w-12" />
          <div className="h-3 bg-[#F5F0E8] rounded w-16" />
        </div>
        <div className="h-10 bg-[#F5F0E8] rounded w-full" />
      </div>
    </div>
  );
}

export default memo(SuggestionCard);
