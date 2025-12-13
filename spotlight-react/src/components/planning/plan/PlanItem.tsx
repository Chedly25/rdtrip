/**
 * PlanItem
 *
 * Individual plan item within a cluster or unclustered list.
 * Features: type icon, name, metadata, remove button, drag handle.
 *
 * Design: Compact row with warm tones, subtle hover effects
 */

import { useState, forwardRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  GripVertical,
  X,
  MoreVertical,
  ArrowRight,
  Utensils,
  Camera,
  Sparkles,
  Building2,
  Wine,
  Coffee,
} from 'lucide-react';
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

const typeColors: Record<PlanCardType, { bg: string; text: string }> = {
  restaurant: { bg: '#FEF3EE', text: '#C45830' },
  activity: { bg: '#F5F0FF', text: '#7C5CDB' },
  photo_spot: { bg: '#EEF6F8', text: '#4A90A4' },
  hotel: { bg: '#F5F0E8', text: '#8B7355' },
  bar: { bg: '#FDF4F8', text: '#C4507C' },
  cafe: { bg: '#F0F7F4', text: '#4A7C59' },
  experience: { bg: '#FFF8E6', text: '#D4A853' },
};

// Price level display
function PriceLevel({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <span className="text-[#8B7355] font-['Satoshi',sans-serif] text-xs">
      {'€'.repeat(level)}
      <span className="text-[#E5DDD0]">{'€'.repeat(4 - level)}</span>
    </span>
  );
}

export interface PlanItemProps {
  item: PlanCard;
  index?: number;
  onRemove?: () => void;
  onMove?: (targetClusterId: string) => void;
  clusters?: Cluster[];
  currentClusterId?: string;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export const PlanItem = forwardRef<HTMLDivElement, PlanItemProps>(({
  item,
  index = 0,
  onRemove,
  onMove,
  clusters = [],
  currentClusterId,
  isDragging = false,
  dragHandleProps,
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const Icon = typeIcons[item.type] || Sparkles;
  const colors = typeColors[item.type] || typeColors.activity;

  const durationText = item.duration >= 60
    ? `${Math.floor(item.duration / 60)}h${item.duration % 60 > 0 ? ` ${item.duration % 60}m` : ''}`
    : `${item.duration}m`;

  // Get other clusters for move menu
  const otherClusters = clusters.filter((c) => c.id !== currentClusterId);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        x: 0,
        scale: isDragging ? 1.02 : 1,
      }}
      exit={{ opacity: 0, x: 10, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMoveMenu(false);
      }}
      className={`
        group relative flex items-start gap-3 p-3
        bg-[#FFFBF5] rounded-lg border
        ${isDragging
          ? 'border-[#C45830] shadow-lg shadow-[#C45830]/10'
          : 'border-[#F5F0E8] hover:border-[#E5DDD0] hover:shadow-sm'
        }
        transition-all duration-200
      `}
    >
      {/* Drag handle */}
      <div
        {...dragHandleProps}
        className={`
          absolute left-1 top-1/2 -translate-y-1/2
          ${isHovered ? 'opacity-40 hover:opacity-100' : 'opacity-0'}
          cursor-grab active:cursor-grabbing transition-opacity
        `}
      >
        <GripVertical className="w-4 h-4 text-[#C4B8A5]" />
      </div>

      {/* Type icon */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ml-3"
        style={{ backgroundColor: colors.bg }}
      >
        <Icon className="w-4 h-4" style={{ color: colors.text }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-['Satoshi',sans-serif] font-semibold text-sm text-[#2C2417] truncate">
          {item.name}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-[#8B7355]">
          {item.bestTime && (
            <>
              <span className="capitalize">{item.bestTime}</span>
              <span className="text-[#E5DDD0]">·</span>
            </>
          )}
          <PriceLevel level={item.priceLevel} />
          <span className="text-[#E5DDD0]">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {durationText}
          </span>
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            {/* Move to different cluster */}
            {onMove && otherClusters.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowMoveMenu(!showMoveMenu)}
                  className="
                    flex-shrink-0 w-7 h-7 rounded-full
                    bg-[#EEF6F8] hover:bg-[#E0F0F4]
                    flex items-center justify-center
                    text-[#4A90A4] transition-colors
                  "
                  title="Move to another area"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {/* Move menu dropdown */}
                <AnimatePresence>
                  {showMoveMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMoveMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        className="
                          absolute right-0 top-full mt-1 z-20
                          w-48 py-1 bg-[#FFFBF5] rounded-xl
                          border border-[#E5DDD0] shadow-lg
                        "
                      >
                        <p className="px-3 py-1.5 text-xs text-[#C4B8A5] font-['Satoshi',sans-serif] uppercase tracking-wide">
                          Move to
                        </p>
                        {otherClusters.map((cluster) => (
                          <button
                            key={cluster.id}
                            onClick={() => {
                              onMove(cluster.id);
                              setShowMoveMenu(false);
                            }}
                            className="
                              w-full px-3 py-2 text-left text-sm
                              font-['Satoshi',sans-serif] text-[#2C2417]
                              hover:bg-[#FAF7F2]
                              flex items-center gap-2
                            "
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-[#8B7355]" />
                            {cluster.name}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Remove button */}
            {onRemove && (
              <button
                onClick={onRemove}
                className="
                  flex-shrink-0 w-7 h-7 rounded-full
                  bg-[#FEF3EE] hover:bg-[#FCE8DE]
                  flex items-center justify-center
                  text-[#C45830] transition-colors
                "
                title="Remove from plan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

PlanItem.displayName = 'PlanItem';

export default memo(PlanItem);
