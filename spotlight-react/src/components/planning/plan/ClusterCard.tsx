/**
 * ClusterCard - Day-Based Trip Planner Card
 *
 * Displays a day's worth of planned activities in an editorial style.
 * Shows: day number, items timeline, stats (duration), actions.
 *
 * Design: Warm editorial aesthetic with calendar-based organization
 * Each day feels like a page from a travel journal.
 */

import { useState, useRef, memo, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Calendar,
  Clock,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Coffee,
  Utensils,
  Camera,
  MapPin,
} from 'lucide-react';
import { PlanItem } from './PlanItem';
import type { ClusterCardProps, PlanCard, Cluster } from '../../../types/planning';

// Day stats bar showing time breakdown
interface DayStatsProps {
  items: PlanCard[];
  totalDuration: number;
}

function DayStats({ items, totalDuration }: DayStatsProps) {
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;
  const durationText = hours > 0
    ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
    : `${minutes}m`;

  // Count items by category
  const activities = items.filter(i => ['activity', 'photo_spot', 'experience'].includes(i.type)).length;
  const meals = items.filter(i => ['restaurant', 'cafe'].includes(i.type)).length;
  const bars = items.filter(i => i.type === 'bar').length;

  return (
    <div className="flex items-center gap-4 pt-3 mt-3 border-t border-[#E8E2D9] text-xs">
      {/* Total duration */}
      <div className="flex items-center gap-1.5 text-[#6B5D4D]">
        <Clock className="w-3.5 h-3.5 text-[#B8A89A]" />
        <span className="font-['DM_Sans',sans-serif] font-medium">{durationText}</span>
      </div>

      {/* Activity count */}
      {activities > 0 && (
        <div className="flex items-center gap-1.5 text-[#4A7C59]">
          <Camera className="w-3.5 h-3.5" />
          <span className="font-['DM_Sans',sans-serif]">{activities}</span>
        </div>
      )}

      {/* Meals count */}
      {meals > 0 && (
        <div className="flex items-center gap-1.5 text-[#C45830]">
          <Utensils className="w-3.5 h-3.5" />
          <span className="font-['DM_Sans',sans-serif]">{meals}</span>
        </div>
      )}

      {/* Bars count */}
      {bars > 0 && (
        <div className="flex items-center gap-1.5 text-[#8B6D9B]">
          <Coffee className="w-3.5 h-3.5" />
          <span className="font-['DM_Sans',sans-serif]">{bars}</span>
        </div>
      )}
    </div>
  );
}

// Get day icon based on time of day or day number
function DayIcon({ dayNumber }: { dayNumber: number }) {
  return (
    <div className="
      relative flex-shrink-0 w-14 h-14 rounded-2xl
      bg-gradient-to-br from-[#FFF8F0] via-[#FDF6EE] to-[#F8EEE4]
      flex items-center justify-center
      shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_8px_rgba(139,109,85,0.1)]
      border border-[#E8DFD4]
    ">
      {/* Day number badge */}
      <span className="
        absolute -top-1.5 -right-1.5
        w-6 h-6 rounded-full
        bg-gradient-to-br from-[#2C2417] to-[#4A3F30]
        text-white text-xs font-bold
        flex items-center justify-center
        shadow-md
        font-['DM_Sans',sans-serif]
      ">
        {dayNumber}
      </span>

      <Calendar className="w-6 h-6 text-[#8B6D55]" />
    </div>
  );
}

// Animation variants for new item entrance
const newItemVariants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

interface ExtendedClusterCardProps extends ClusterCardProps {
  allClusters?: Cluster[];
  onMoveItem?: (itemId: string, toClusterId: string) => void;
  onReorderItems?: (reorderedItems: PlanCard[]) => void;
}

export function ClusterCard({
  cluster,
  onAddItem,
  onRemoveItem,
  onRename,
  onDelete,
  isExpanded: initialExpanded = true,
  allClusters = [],
  onMoveItem,
  onReorderItems,
}: ExtendedClusterCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(cluster.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track item count for "item added" animation
  const [prevItemCount, setPrevItemCount] = useState(cluster.items.length);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const prevItemIdsRef = useRef<Set<string>>(new Set(cluster.items.map(i => i.id)));

  // Extract day number from cluster name (e.g., "Day 1" -> 1)
  const dayMatch = cluster.name.match(/Day\s*(\d+)/i);
  const dayNumber = dayMatch ? parseInt(dayMatch[1], 10) : 1;

  // Detect when a new item is added and trigger highlight animation
  useEffect(() => {
    const currentIds = new Set(cluster.items.map(i => i.id));
    const prevIds = prevItemIdsRef.current;

    // Find newly added items
    const addedIds = [...currentIds].filter(id => !prevIds.has(id));

    if (addedIds.length > 0 && cluster.items.length > prevItemCount) {
      // New item was added - trigger highlight
      setIsHighlighted(true);
      setNewlyAddedId(addedIds[0]); // Track the newest item

      // Auto-expand if collapsed
      if (!isExpanded) {
        setIsExpanded(true);
      }

      // Clear highlight after animation
      const timer = setTimeout(() => {
        setIsHighlighted(false);
        setNewlyAddedId(null);
      }, 1500);

      return () => clearTimeout(timer);
    }

    // Update tracking refs
    setPrevItemCount(cluster.items.length);
    prevItemIdsRef.current = currentIds;
  }, [cluster.items, cluster.items.length, prevItemCount, isExpanded]);

  const handleRename = () => {
    if (editName.trim() && editName !== cluster.name) {
      onRename?.(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(cluster.name);
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      layout
      animate={isHighlighted ? {
        boxShadow: [
          '0 2px 8px rgba(44, 36, 23, 0.06)',
          '0 0 0 3px rgba(212, 168, 83, 0.25), 0 8px 32px rgba(212, 168, 83, 0.15)',
          '0 2px 8px rgba(44, 36, 23, 0.06)',
        ],
      } : {}}
      transition={isHighlighted ? {
        duration: 1.2,
        ease: 'easeInOut',
      } : {}}
      className={`
        relative bg-white rounded-3xl border
        shadow-[0_2px_8px_rgba(44,36,23,0.06)]
        hover:shadow-[0_4px_16px_rgba(44,36,23,0.1)]
        transition-all duration-300
        overflow-visible
        ${isHighlighted
          ? 'border-[#D4A853]/50 ring-1 ring-[#D4A853]/20'
          : 'border-[#E8E2D9]'
        }
      `}
    >
      {/* Celebration sparkle for new items */}
      <AnimatePresence>
        {isHighlighted && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-2 -right-2 z-10"
          >
            <motion.div
              animate={{
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <Sparkles className="w-6 h-6 text-[#D4A853]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Day icon with number badge */}
          <DayIcon dayNumber={dayNumber} />

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                autoFocus
                className="
                  w-full px-3 py-1.5 -mx-3 -my-1.5
                  font-['Playfair_Display',serif] font-semibold text-xl text-[#2C2417]
                  bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-[#D4A853]/30 focus:border-[#D4A853]
                "
              />
            ) : (
              <h3 className="font-['Playfair_Display',serif] font-semibold text-xl text-[#2C2417] tracking-tight">
                {cluster.name}
              </h3>
            )}
            {cluster.description && (
              <p className="text-sm text-[#8B7355] font-['DM_Sans',sans-serif] mt-1 leading-relaxed">
                {cluster.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-3">
          {/* Expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              p-2.5 rounded-xl text-[#8B7355]
              hover:bg-[#FAF7F2] hover:text-[#2C2417]
              transition-all duration-200
            "
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="
                p-2.5 rounded-xl text-[#8B7355]
                hover:bg-[#FAF7F2] hover:text-[#2C2417]
                transition-all duration-200
              "
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  {/* Menu dropdown */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="
                      absolute right-0 top-full mt-2 z-20
                      w-44 py-2 bg-white rounded-2xl
                      border border-[#E8E2D9]
                      shadow-[0_4px_24px_rgba(44,36,23,0.12)]
                    "
                  >
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="
                        w-full px-4 py-2.5 text-left text-sm
                        font-['DM_Sans',sans-serif] text-[#2C2417]
                        hover:bg-[#FAF7F2]
                        flex items-center gap-3
                        transition-colors
                      "
                    >
                      <Pencil className="w-4 h-4 text-[#8B7355]" />
                      Rename day
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.();
                        setShowMenu(false);
                      }}
                      className="
                        w-full px-4 py-2.5 text-left text-sm
                        font-['DM_Sans',sans-serif] text-[#C45830]
                        hover:bg-[#FEF3EE]
                        flex items-center gap-3
                        transition-colors
                      "
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete day
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Items list (collapsible) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 space-y-3">
              {/* Items with drag-and-drop reordering */}
              {cluster.items.length > 0 ? (
                onReorderItems ? (
                  <Reorder.Group
                    axis="y"
                    values={cluster.items}
                    onReorder={onReorderItems}
                    className="space-y-3"
                  >
                    {cluster.items.map((item, index) => (
                      <Reorder.Item
                        key={item.id}
                        value={item}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <PlanItem
                          item={item}
                          index={index}
                          onRemove={() => onRemoveItem?.(item.id)}
                          onMove={onMoveItem ? (toClusterId) => onMoveItem(item.id, toClusterId) : undefined}
                          clusters={allClusters}
                          currentClusterId={cluster.id}
                        />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {cluster.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        variants={newItemVariants}
                        initial={item.id === newlyAddedId ? 'initial' : false}
                        animate="animate"
                        exit="exit"
                        layout
                        className={`
                          ${item.id === newlyAddedId
                            ? 'ring-2 ring-[#D4A853]/40 ring-offset-2 ring-offset-white rounded-2xl'
                            : ''
                          }
                        `}
                      >
                        <PlanItem
                          item={item}
                          index={index}
                          onRemove={() => onRemoveItem?.(item.id)}
                          onMove={onMoveItem ? (toClusterId) => onMoveItem(item.id, toClusterId) : undefined}
                          clusters={allClusters}
                          currentClusterId={cluster.id}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )
              ) : (
                <div className="py-8 text-center rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#F5F2EE] border border-dashed border-[#E5DDD0]">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#C4B8A5]" />
                  </div>
                  <p className="text-sm text-[#8B7355] font-['DM_Sans',sans-serif] font-medium">
                    No plans for this day yet
                  </p>
                  <p className="text-xs text-[#B8A89A] font-['DM_Sans',sans-serif] mt-1">
                    Add activities from suggestions →
                  </p>
                </div>
              )}

              {/* Stats */}
              {cluster.items.length > 0 && (
                <DayStats
                  items={cluster.items}
                  totalDuration={cluster.totalDuration}
                />
              )}

              {/* Add more button */}
              <button
                onClick={() => onAddItem?.({} as PlanCard)}
                className="
                  w-full mt-2 py-3
                  border border-dashed border-[#E5DDD0] rounded-2xl
                  text-[#8B7355] font-['DM_Sans',sans-serif] font-medium text-sm
                  hover:border-[#D4A853] hover:text-[#C49A3C] hover:bg-[#FFFBF5]
                  transition-all duration-200
                  flex items-center justify-center gap-2
                  group
                "
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                Add to {cluster.name}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed summary */}
      {!isExpanded && cluster.items.length > 0 && (
        <div className="px-5 pb-4 flex items-center gap-3 text-sm text-[#8B7355]">
          <span className="font-['DM_Sans',sans-serif] font-medium">
            {cluster.items.length} {cluster.items.length === 1 ? 'place' : 'places'}
          </span>
          <span className="w-1 h-1 rounded-full bg-[#D4C9BA]" />
          <span className="font-['DM_Sans',sans-serif]">
            ~{Math.floor(cluster.totalDuration / 60)}h planned
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default memo(ClusterCard);
