/**
 * ClusterCard
 *
 * A geographic area cluster containing planned activities.
 * Shows: area name, items list, stats (duration, walking distance), actions.
 *
 * Design: Editorial card with warm tones, subtle shadows, refined typography
 *
 * Phase 6 Enhancement:
 * - Warm glow animation when new items are added
 * - Items slide in with delight micro-interactions
 */

import { useState, useRef, memo, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  MapPin,
  Clock,
  Footprints,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { PlanItem } from './PlanItem';
import type { ClusterCardProps, PlanCard, Cluster } from '../../../types/planning';

// Cluster stats bar
interface ClusterStatsProps {
  totalDuration: number;
  maxWalkingDistance: number;
}

function ClusterStats({ totalDuration, maxWalkingDistance }: ClusterStatsProps) {
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;
  const durationText = hours > 0
    ? `~${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
    : `~${minutes}m`;

  // Determine walking status color
  const walkingColor = maxWalkingDistance <= 5
    ? 'text-[#4A7C59]' // Green - all very close
    : maxWalkingDistance <= 10
      ? 'text-[#D4A853]' // Yellow - moderate
      : 'text-[#C45830]'; // Red - getting far

  return (
    <div className="flex items-center gap-4 pt-3 mt-3 border-t border-[#F5F0E8] text-xs text-[#8B7355]">
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-[#C4B8A5]" />
        <span className="font-['Satoshi',sans-serif]">{durationText} total</span>
      </div>
      <div className={`flex items-center gap-1.5 ${walkingColor}`}>
        <Footprints className="w-3.5 h-3.5" />
        <span className="font-['Satoshi',sans-serif]">
          {maxWalkingDistance <= 5 ? 'all <5 min walk' : `max ${maxWalkingDistance} min walk`}
        </span>
      </div>
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
          '0 1px 3px rgba(44, 36, 23, 0.05)',
          '0 0 0 3px rgba(196, 88, 48, 0.15), 0 8px 25px rgba(196, 88, 48, 0.2)',
          '0 1px 3px rgba(44, 36, 23, 0.05)',
        ],
      } : {}}
      transition={isHighlighted ? {
        duration: 1.2,
        ease: 'easeInOut',
      } : {}}
      className={`
        relative bg-[#FFFBF5] rounded-2xl border
        shadow-sm hover:shadow-md
        transition-all duration-300
        overflow-visible
        ${isHighlighted
          ? 'border-[#C45830]/40 bg-gradient-to-br from-[#FFFBF5] via-[#FEF8F5] to-[#FFFBF5]'
          : 'border-[#E5DDD0]'
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
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Area icon */}
          <div className="
            flex-shrink-0 w-10 h-10 rounded-xl
            bg-gradient-to-br from-[#FEF3EE] to-[#FCE8DE]
            flex items-center justify-center
            shadow-inner
          ">
            <MapPin className="w-5 h-5 text-[#C45830]" />
          </div>

          {/* Title */}
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
                  w-full px-2 py-1 -mx-2 -my-1
                  font-['Satoshi',sans-serif] font-semibold text-lg text-[#2C2417]
                  bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[#C45830]/20 focus:border-[#C45830]
                "
              />
            ) : (
              <h3 className="font-['Satoshi',sans-serif] font-semibold text-lg text-[#2C2417] uppercase tracking-wide truncate">
                {cluster.name}
              </h3>
            )}
            {cluster.description && (
              <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif] mt-0.5 truncate">
                {cluster.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          {/* Expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              p-2 rounded-lg text-[#8B7355]
              hover:bg-[#FAF7F2] hover:text-[#2C2417]
              transition-colors
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
                p-2 rounded-lg text-[#8B7355]
                hover:bg-[#FAF7F2] hover:text-[#2C2417]
                transition-colors
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
                      absolute right-0 top-full mt-1 z-20
                      w-40 py-1 bg-[#FFFBF5] rounded-xl
                      border border-[#E5DDD0] shadow-lg
                    "
                  >
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="
                        w-full px-4 py-2 text-left text-sm
                        font-['Satoshi',sans-serif] text-[#2C2417]
                        hover:bg-[#FAF7F2]
                        flex items-center gap-2
                      "
                    >
                      <Pencil className="w-4 h-4 text-[#8B7355]" />
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.();
                        setShowMenu(false);
                      }}
                      className="
                        w-full px-4 py-2 text-left text-sm
                        font-['Satoshi',sans-serif] text-[#C45830]
                        hover:bg-[#FEF3EE]
                        flex items-center gap-2
                      "
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete area
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
            <div className="px-4 pb-4 space-y-2">
              {/* Items with drag-and-drop reordering */}
              {cluster.items.length > 0 ? (
                onReorderItems ? (
                  <Reorder.Group
                    axis="y"
                    values={cluster.items}
                    onReorder={onReorderItems}
                    className="space-y-2"
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
                            ? 'ring-2 ring-[#C45830]/30 ring-offset-2 ring-offset-[#FFFBF5] rounded-xl'
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
                <div className="py-6 text-center">
                  <p className="text-sm text-[#C4B8A5] font-['Satoshi',sans-serif]">
                    No items yet. Add from suggestions →
                  </p>
                </div>
              )}

              {/* Stats */}
              {cluster.items.length > 0 && (
                <ClusterStats
                  totalDuration={cluster.totalDuration}
                  maxWalkingDistance={cluster.maxWalkingDistance}
                />
              )}

              {/* Add more button - triggers parent to show filtered suggestions */}
              <button
                onClick={() => onAddItem?.({} as PlanCard)}
                className="
                  w-full mt-3 py-2.5
                  border border-dashed border-[#E5DDD0] rounded-lg
                  text-[#8B7355] font-['Satoshi',sans-serif] font-medium text-sm
                  hover:border-[#C45830] hover:text-[#C45830] hover:bg-[#FEF3EE]/30
                  transition-all duration-200
                  flex items-center justify-center gap-2
                "
              >
                <Plus className="w-4 h-4" />
                Add more to {cluster.name}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed summary */}
      {!isExpanded && cluster.items.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-3 text-xs text-[#8B7355]">
          <span className="font-['Satoshi',sans-serif]">
            {cluster.items.length} {cluster.items.length === 1 ? 'place' : 'places'}
          </span>
          <span className="text-[#E5DDD0]">·</span>
          <span className="font-['Satoshi',sans-serif]">
            ~{Math.floor(cluster.totalDuration / 60)}h total
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default memo(ClusterCard);
