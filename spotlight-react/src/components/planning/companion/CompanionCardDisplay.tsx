/**
 * CompanionCardDisplay
 *
 * Mini card grid for displaying AI-suggested places inline within messages.
 * Compact design with quick-add functionality.
 *
 * Design: Wanderlust Editorial - warm tones, refined typography
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Check,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Utensils,
  Camera,
  Wine,
  Coffee,
  Sparkles,
  Building,
} from 'lucide-react';
import type { PlanCard, Cluster } from '../../../types/planning';

// ============================================
// Types
// ============================================

interface CompanionCardDisplayProps {
  cards: PlanCard[];
  onAdd: (card: PlanCard, clusterId?: string) => void;
  onCreateCluster?: () => void;
  clusters: Cluster[];
  maxDisplay?: number;
  addedCardIds?: string[];
}

interface MiniCardProps {
  card: PlanCard;
  onAdd: (clusterId?: string) => void;
  clusters: Cluster[];
  isAdded?: boolean;
}

// ============================================
// Icon Mapping
// ============================================

const typeIcons: Record<string, React.ElementType> = {
  restaurant: Utensils,
  activity: Sparkles,
  photo_spot: Camera,
  bar: Wine,
  cafe: Coffee,
  hotel: Building,
  experience: Sparkles,
};

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  restaurant: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  activity: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  photo_spot: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  bar: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  cafe: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  hotel: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  experience: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

// ============================================
// MiniCard Component
// ============================================

function MiniCard({ card, onAdd, clusters, isAdded }: MiniCardProps) {
  const [showClusterSelect, setShowClusterSelect] = useState(false);
  const Icon = typeIcons[card.type] || Sparkles;
  const colors = typeColors[card.type] || typeColors.activity;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clusters.length > 1) {
      setShowClusterSelect(!showClusterSelect);
    } else if (clusters.length === 1) {
      onAdd(clusters[0].id);
    } else {
      onAdd();
    }
  };

  const handleClusterSelect = (clusterId: string) => {
    onAdd(clusterId);
    setShowClusterSelect(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative group
        bg-[#FFFBF5] rounded-xl border border-[#E5DDD0]
        p-3 min-w-[140px] max-w-[160px]
        hover:border-[#C45830]/30 hover:shadow-md
        transition-all duration-200
        ${isAdded ? 'opacity-60' : ''}
      `}
    >
      {/* Type badge */}
      <div className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full
        ${colors.bg} ${colors.text} ${colors.border} border
        text-[10px] font-medium font-['Satoshi',sans-serif] uppercase tracking-wide
        mb-2
      `}>
        <Icon className="w-2.5 h-2.5" />
        {card.type.replace('_', ' ')}
      </div>

      {/* Name */}
      <h4 className="font-['Fraunces',serif] text-sm text-[#2C2417] font-medium leading-tight mb-1 line-clamp-2">
        {card.name}
      </h4>

      {/* Meta info */}
      <div className="flex items-center gap-2 text-[10px] text-[#8B7355] font-['Satoshi',sans-serif] mb-2">
        <span className="flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          {card.duration}min
        </span>
        <span>{'€'.repeat(card.priceLevel)}</span>
      </div>

      {/* Area */}
      {card.location?.area && (
        <div className="flex items-center gap-1 text-[10px] text-[#8B7355] font-['Satoshi',sans-serif] mb-2">
          <MapPin className="w-2.5 h-2.5" />
          <span className="truncate">{card.location.area}</span>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={isAdded}
        className={`
          w-full py-1.5 rounded-lg
          font-['Satoshi',sans-serif] text-xs font-medium
          flex items-center justify-center gap-1
          transition-all duration-200
          ${
            isAdded
              ? 'bg-[#4A7C59]/10 text-[#4A7C59] cursor-default'
              : 'bg-[#C45830] text-white hover:bg-[#A84828] active:scale-[0.98]'
          }
        `}
      >
        {isAdded ? (
          <>
            <Check className="w-3 h-3" />
            Added
          </>
        ) : (
          <>
            <Plus className="w-3 h-3" />
            Add
          </>
        )}
      </button>

      {/* Cluster selection dropdown */}
      <AnimatePresence>
        {showClusterSelect && !isAdded && clusters.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="
              absolute top-full left-0 right-0 mt-1 z-10
              bg-white rounded-lg border border-[#E5DDD0] shadow-lg
              overflow-hidden
            "
          >
            <div className="py-1">
              <div className="px-2 py-1 text-[9px] text-[#8B7355] uppercase tracking-wide font-['Satoshi',sans-serif]">
                Add to area
              </div>
              {clusters.map((cluster) => (
                <button
                  key={cluster.id}
                  onClick={() => handleClusterSelect(cluster.id)}
                  className="
                    w-full px-2 py-1.5 text-left
                    text-xs text-[#2C2417] font-['Satoshi',sans-serif]
                    hover:bg-[#FEF3EE] transition-colors
                  "
                >
                  {cluster.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function CompanionCardDisplay({
  cards,
  onAdd,
  clusters,
  maxDisplay = 4,
  addedCardIds = [],
}: CompanionCardDisplayProps) {
  const [showAll, setShowAll] = useState(false);

  if (!cards || cards.length === 0) return null;

  const displayCards = showAll ? cards : cards.slice(0, maxDisplay);
  const hasMore = cards.length > maxDisplay;

  return (
    <div className="mt-3">
      {/* Card grid */}
      <div className="flex flex-wrap gap-2">
        {displayCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <MiniCard
              card={card}
              onAdd={(clusterId) => onAdd(card, clusterId)}
              clusters={clusters}
              isAdded={addedCardIds.includes(card.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Show more/less toggle */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="
            mt-2 flex items-center gap-1
            text-xs text-[#C45830] font-['Satoshi',sans-serif] font-medium
            hover:text-[#A84828] transition-colors
          "
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Show all {cards.length} suggestions
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default CompanionCardDisplay;
