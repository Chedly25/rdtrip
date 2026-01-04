/**
 * DayComparisonView
 *
 * Side-by-side day comparison with visual balance indicators.
 * Allows dragging items between days for easy rebalancing.
 *
 * Design: Warm Editorial with clear visual hierarchy and intuitive interactions.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeftRight,
  Clock,
  Footprints,
  ChevronDown,
  Coffee,
  Sun,
  Sunset,
  Moon,
  AlertTriangle,
  Check,
  Gem,
  GripVertical,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { haversineDistance, CATEGORY_ICONS } from '../../utils/planningEnrichment';
import type { Slot, PlannedItem, DayPlan } from '../../types/planning';

// ============================================================================
// Slot Configuration
// ============================================================================

const SLOT_CONFIG: Record<Slot, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  morning: {
    label: 'Morning',
    icon: <Coffee className="w-3.5 h-3.5" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  afternoon: {
    label: 'Afternoon',
    icon: <Sun className="w-3.5 h-3.5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  evening: {
    label: 'Evening',
    icon: <Sunset className="w-3.5 h-3.5" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
  night: {
    label: 'Night',
    icon: <Moon className="w-3.5 h-3.5" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
};

const SLOT_ORDER: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

// ============================================================================
// Props Interface
// ============================================================================

interface DayComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialLeftDay?: number;
  initialRightDay?: number;
}

// ============================================================================
// Main Component
// ============================================================================

export function DayComparisonView({
  isOpen,
  onClose,
  initialLeftDay = 0,
  initialRightDay = 1,
}: DayComparisonViewProps) {
  const { tripPlan, moveItem, getDayItems } = usePlanningStore();

  const [leftDayIndex, setLeftDayIndex] = useState(initialLeftDay);
  const [rightDayIndex, setRightDayIndex] = useState(initialRightDay);
  const [draggedItem, setDraggedItem] = useState<PlannedItem | null>(null);
  const [dropTarget, setDropTarget] = useState<{ dayIndex: number; slot: Slot } | null>(null);

  // Calculate day statistics
  const getDayStats = useCallback((dayIndex: number) => {
    if (!tripPlan) return null;

    const day = tripPlan.days[dayIndex];
    if (!day) return null;

    const items = getDayItems(dayIndex);
    const totalDuration = items.reduce(
      (sum, item) => sum + item.place.estimated_duration_mins,
      0
    );

    let totalWalkingKm = 0;
    for (let i = 1; i < items.length; i++) {
      const from = items[i - 1].place.geometry.location;
      const to = items[i].place.geometry.location;
      totalWalkingKm += haversineDistance(from.lat, from.lng, to.lat, to.lng);
    }

    const slotDurations: Record<Slot, number> = {
      morning: day.slots.morning.reduce((s, i) => s + i.place.estimated_duration_mins, 0),
      afternoon: day.slots.afternoon.reduce((s, i) => s + i.place.estimated_duration_mins, 0),
      evening: day.slots.evening.reduce((s, i) => s + i.place.estimated_duration_mins, 0),
      night: day.slots.night.reduce((s, i) => s + i.place.estimated_duration_mins, 0),
    };

    return {
      day,
      items,
      totalDuration,
      totalWalkingKm: Math.round(totalWalkingKm * 10) / 10,
      itemCount: items.length,
      slotDurations,
      pacing: totalDuration < 240 ? 'relaxed' : totalDuration < 420 ? 'balanced' : 'packed',
    };
  }, [tripPlan, getDayItems]);

  const leftStats = getDayStats(leftDayIndex);
  const rightStats = getDayStats(rightDayIndex);

  // Handle item drop
  const handleDrop = useCallback((targetDayIndex: number, targetSlot: Slot) => {
    if (!draggedItem) return;

    moveItem(draggedItem.id, targetDayIndex, targetSlot);
    setDraggedItem(null);
    setDropTarget(null);
  }, [draggedItem, moveItem]);

  // Calculate balance indicator
  const balanceIndicator = useMemo(() => {
    if (!leftStats || !rightStats) return null;

    const diff = leftStats.totalDuration - rightStats.totalDuration;
    const absDiff = Math.abs(diff);

    if (absDiff < 30) {
      return { status: 'balanced', message: 'Days are well balanced' };
    } else if (absDiff < 90) {
      return {
        status: 'slight',
        message: diff > 0 ? 'Left day is slightly busier' : 'Right day is slightly busier',
      };
    } else {
      return {
        status: 'imbalanced',
        message: diff > 0 ? 'Left day is quite packed' : 'Right day is quite packed',
      };
    }
  }, [leftStats, rightStats]);

  if (!tripPlan || !leftStats || !rightStats) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl max-h-[90vh] bg-rui-white rounded-2xl shadow-rui-4 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-rui-grey-10 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 via-rose-50/30 to-indigo-50/50" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <ArrowLeftRight className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-rui-black">
                      Compare Days
                    </h2>
                    <p className="text-body-3 text-rui-grey-50">
                      Drag activities between days to rebalance
                    </p>
                  </div>
                </div>

                {/* Balance indicator */}
                {balanceIndicator && (
                  <div className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-body-3 font-medium
                    ${balanceIndicator.status === 'balanced'
                      ? 'bg-emerald-100 text-emerald-700'
                      : balanceIndicator.status === 'slight'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }
                  `}>
                    {balanceIndicator.status === 'balanced' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    {balanceIndicator.message}
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-rui-grey-40 hover:bg-rui-grey-5 hover:text-rui-grey-60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comparison Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left Day */}
              <div className="flex-1 border-r border-rui-grey-10 overflow-y-auto">
                <DayColumn
                  dayIndex={leftDayIndex}
                  stats={leftStats}
                  allDays={tripPlan.days}
                  onDayChange={setLeftDayIndex}
                  otherDayIndex={rightDayIndex}
                  onDragStart={setDraggedItem}
                  onDragEnd={() => {
                    setDraggedItem(null);
                    setDropTarget(null);
                  }}
                  dropTarget={dropTarget}
                  onDropTargetChange={setDropTarget}
                  onDrop={handleDrop}
                  isDragging={!!draggedItem}
                  draggedItem={draggedItem}
                />
              </div>

              {/* Center divider with swap button */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const temp = leftDayIndex;
                    setLeftDayIndex(rightDayIndex);
                    setRightDayIndex(temp);
                  }}
                  className="w-10 h-10 rounded-full bg-rui-white border-2 border-rui-grey-10 shadow-lg flex items-center justify-center text-rui-grey-50 hover:text-rui-accent hover:border-rui-accent transition-colors"
                  title="Swap days"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Right Day */}
              <div className="flex-1 overflow-y-auto">
                <DayColumn
                  dayIndex={rightDayIndex}
                  stats={rightStats}
                  allDays={tripPlan.days}
                  onDayChange={setRightDayIndex}
                  otherDayIndex={leftDayIndex}
                  onDragStart={setDraggedItem}
                  onDragEnd={() => {
                    setDraggedItem(null);
                    setDropTarget(null);
                  }}
                  dropTarget={dropTarget}
                  onDropTargetChange={setDropTarget}
                  onDrop={handleDrop}
                  isDragging={!!draggedItem}
                  draggedItem={draggedItem}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Day Column
// ============================================================================

interface DayColumnProps {
  dayIndex: number;
  stats: {
    day: DayPlan;
    totalDuration: number;
    totalWalkingKm: number;
    itemCount: number;
    slotDurations: Record<Slot, number>;
    pacing: string;
  };
  allDays: DayPlan[];
  onDayChange: (index: number) => void;
  otherDayIndex: number;
  onDragStart: (item: PlannedItem) => void;
  onDragEnd: () => void;
  dropTarget: { dayIndex: number; slot: Slot } | null;
  onDropTargetChange: (target: { dayIndex: number; slot: Slot } | null) => void;
  onDrop: (dayIndex: number, slot: Slot) => void;
  isDragging: boolean;
  draggedItem: PlannedItem | null;
}

function DayColumn({
  dayIndex,
  stats,
  allDays,
  onDayChange,
  otherDayIndex,
  onDragStart,
  onDragEnd,
  dropTarget,
  onDropTargetChange,
  onDrop,
  isDragging,
  draggedItem,
}: DayColumnProps) {
  const [showDaySelector, setShowDaySelector] = useState(false);

  const dateStr = stats.day.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="h-full flex flex-col">
      {/* Day Header */}
      <div className="p-4 border-b border-rui-grey-10 bg-rui-grey-2">
        <div className="flex items-center justify-between mb-3">
          {/* Day selector */}
          <div className="relative">
            <button
              onClick={() => setShowDaySelector(!showDaySelector)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-rui-grey-10 hover:border-rui-grey-30 transition-colors"
            >
              <span className="font-display text-lg text-rui-black">
                Day {dayIndex + 1}
              </span>
              <ChevronDown className={`w-4 h-4 text-rui-grey-40 transition-transform ${showDaySelector ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {showDaySelector && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-rui-3 border border-rui-grey-10 py-1 z-20"
                >
                  {allDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        onDayChange(index);
                        setShowDaySelector(false);
                      }}
                      disabled={index === otherDayIndex}
                      className={`
                        w-full px-3 py-2 text-left text-body-2 transition-colors
                        ${index === dayIndex
                          ? 'bg-rui-accent/10 text-rui-accent'
                          : index === otherDayIndex
                            ? 'text-rui-grey-30 cursor-not-allowed'
                            : 'hover:bg-rui-grey-5 text-rui-grey-70'
                        }
                      `}
                    >
                      Day {index + 1} · {day.city.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pacing badge */}
          <span className={`
            px-2.5 py-1 rounded-full text-body-3 font-medium
            ${stats.pacing === 'relaxed'
              ? 'bg-emerald-100 text-emerald-700'
              : stats.pacing === 'balanced'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'
            }
          `}>
            {stats.pacing}
          </span>
        </div>

        {/* Day info */}
        <div className="flex items-center gap-4 text-body-3 text-rui-grey-50">
          <span>{dateStr}</span>
          <span>·</span>
          <span>{stats.day.city.name}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-2 text-body-3">
          <span className="flex items-center gap-1 text-rui-grey-60">
            <Clock className="w-3.5 h-3.5" />
            {Math.round(stats.totalDuration / 60)}h
          </span>
          <span className="flex items-center gap-1 text-rui-grey-60">
            <Footprints className="w-3.5 h-3.5" />
            {stats.totalWalkingKm} km
          </span>
          <span className="text-rui-grey-40">
            {stats.itemCount} activities
          </span>
        </div>
      </div>

      {/* Slots */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {SLOT_ORDER.map((slot) => (
          <SlotSection
            key={slot}
            slot={slot}
            items={stats.day.slots[slot]}
            duration={stats.slotDurations[slot]}
            dayIndex={dayIndex}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDropTarget={dropTarget?.dayIndex === dayIndex && dropTarget?.slot === slot}
            onDropTargetEnter={() => onDropTargetChange({ dayIndex, slot })}
            onDropTargetLeave={() => onDropTargetChange(null)}
            onDrop={() => onDrop(dayIndex, slot)}
            isDragging={isDragging}
            draggedItem={draggedItem}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Slot Section
// ============================================================================

interface SlotSectionProps {
  slot: Slot;
  items: PlannedItem[];
  duration: number;
  dayIndex: number;
  onDragStart: (item: PlannedItem) => void;
  onDragEnd: () => void;
  isDropTarget: boolean;
  onDropTargetEnter: () => void;
  onDropTargetLeave: () => void;
  onDrop: () => void;
  isDragging: boolean;
  draggedItem: PlannedItem | null;
}

function SlotSection({
  slot,
  items,
  duration,
  dayIndex: _dayIndex,
  onDragStart,
  onDragEnd,
  isDropTarget,
  onDropTargetEnter,
  onDropTargetLeave,
  onDrop,
  isDragging,
  draggedItem,
}: SlotSectionProps) {
  void _dayIndex; // Reserved for future use
  const config = SLOT_CONFIG[slot];

  return (
    <div
      className={`
        rounded-xl border-2 transition-all
        ${isDropTarget
          ? `${config.borderColor} ${config.bgColor} shadow-md`
          : 'border-rui-grey-10 bg-white'
        }
      `}
      onDragOver={(e) => {
        e.preventDefault();
        onDropTargetEnter();
      }}
      onDragLeave={onDropTargetLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      {/* Slot header */}
      <div className={`px-3 py-2 border-b ${isDropTarget ? config.borderColor : 'border-rui-grey-10'} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className="text-body-2 font-medium text-rui-grey-70">{config.label}</span>
        </div>
        <span className="text-body-3 text-rui-grey-50">
          {duration > 0 ? `${Math.round(duration / 60)}h` : 'Empty'}
        </span>
      </div>

      {/* Items */}
      <div className="p-2 space-y-2 min-h-[60px]">
        {items.length === 0 ? (
          <div className={`
            py-4 text-center text-body-3 rounded-lg transition-colors
            ${isDragging ? `${config.bgColor} ${config.color}` : 'text-rui-grey-40'}
          `}>
            {isDragging ? 'Drop here' : 'No activities'}
          </div>
        ) : (
          items.map((item) => (
            <CompactItemCard
              key={item.id}
              item={item}
              onDragStart={() => onDragStart(item)}
              onDragEnd={onDragEnd}
              isDragging={draggedItem?.id === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Item Card
// ============================================================================

interface CompactItemCardProps {
  item: PlannedItem;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function CompactItemCard({ item, onDragStart, onDragEnd, isDragging }: CompactItemCardProps) {
  const categoryIcon = CATEGORY_ICONS[item.place.category] || '📍';

  return (
    <motion.div
      layout
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        flex items-center gap-2 p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing
        ${isDragging
          ? 'opacity-50 border-rui-accent bg-rui-accent/5'
          : 'border-rui-grey-10 bg-white hover:border-rui-grey-20 hover:shadow-sm'
        }
      `}
    >
      <GripVertical className="w-3.5 h-3.5 text-rui-grey-30 flex-shrink-0" />

      <span className="text-lg flex-shrink-0">{categoryIcon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-body-3 font-medium text-rui-grey-70 truncate">
          {item.place.name}
        </p>
        <p className="text-body-3 text-rui-grey-40">
          ~{item.place.estimated_duration_mins} min
        </p>
      </div>

      {item.place.is_hidden_gem && (
        <Gem className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
      )}
    </motion.div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default DayComparisonView;
