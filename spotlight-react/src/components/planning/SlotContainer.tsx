/**
 * SlotContainer
 *
 * Container for a single time slot (Morning, Afternoon, Evening, Night).
 * Displays items with drag-and-drop reordering.
 *
 * Features:
 * - Distinct visual style per slot
 * - Empty state with add button
 * - Drag-and-drop reordering
 * - Travel time indicators between items
 * - Collapsed/expanded state for empty slots
 */

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Sun, CloudSun, Sunset, Moon } from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { PlannedItemCard } from './PlannedItemCard';
import { estimateWalkingTime, haversineDistance } from '../../utils/planningEnrichment';
import type { Slot, PlannedItem } from '../../types/planning';

// ============================================================================
// Slot Configuration
// ============================================================================

const SLOT_STYLES: Record<Slot, {
  label: string;
  icon: React.ReactNode;
  hours: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  accentClass: string;
  emptyBgClass: string;
}> = {
  morning: {
    label: 'Morning',
    icon: <Sun className="w-4 h-4" />,
    hours: '8am - 12pm',
    bgClass: 'bg-amber-50/40',
    borderClass: 'border-amber-200/50',
    textClass: 'text-amber-700',
    accentClass: 'bg-amber-500',
    emptyBgClass: 'bg-amber-50/20',
  },
  afternoon: {
    label: 'Afternoon',
    icon: <CloudSun className="w-4 h-4" />,
    hours: '12pm - 6pm',
    bgClass: 'bg-orange-50/35',
    borderClass: 'border-orange-200/45',
    textClass: 'text-orange-700',
    accentClass: 'bg-orange-500',
    emptyBgClass: 'bg-orange-50/15',
  },
  evening: {
    label: 'Evening',
    icon: <Sunset className="w-4 h-4" />,
    hours: '6pm - 10pm',
    bgClass: 'bg-rose-50/30',
    borderClass: 'border-rose-200/40',
    textClass: 'text-rose-700',
    accentClass: 'bg-rose-500',
    emptyBgClass: 'bg-rose-50/10',
  },
  night: {
    label: 'Night',
    icon: <Moon className="w-4 h-4" />,
    hours: '10pm - 2am',
    bgClass: 'bg-indigo-50/25',
    borderClass: 'border-indigo-200/35',
    textClass: 'text-indigo-700',
    accentClass: 'bg-indigo-500',
    emptyBgClass: 'bg-indigo-50/10',
  },
};

// ============================================================================
// Props
// ============================================================================

interface SlotContainerProps {
  slot: Slot;
  dayIndex: number;
  previousSlotLastItem?: PlannedItem | null;
}

// ============================================================================
// Component
// ============================================================================

export function SlotContainer({ slot, dayIndex, previousSlotLastItem }: SlotContainerProps) {
  const { getSlotItems, openAddPanel, reorderInSlot } = usePlanningStore();

  const items = getSlotItems(dayIndex, slot);
  const style = SLOT_STYLES[slot];
  const isEmpty = items.length === 0;

  // Calculate total duration for this slot
  const totalDuration = useMemo(() => {
    return items.reduce((sum, item) => sum + item.place.estimated_duration_mins, 0);
  }, [items]);

  // Calculate travel times between items
  const travelTimes = useMemo(() => {
    const times: { mins: number; km: number }[] = [];

    // First item - travel from previous slot's last item
    if (items.length > 0 && previousSlotLastItem) {
      const from = previousSlotLastItem.place.geometry.location;
      const to = items[0].place.geometry.location;
      const mins = estimateWalkingTime(from.lat, from.lng, to.lat, to.lng);
      const km = haversineDistance(from.lat, from.lng, to.lat, to.lng);
      times.push({ mins, km });
    } else {
      times.push({ mins: 0, km: 0 });
    }

    // Between items
    for (let i = 1; i < items.length; i++) {
      const from = items[i - 1].place.geometry.location;
      const to = items[i].place.geometry.location;
      const mins = estimateWalkingTime(from.lat, from.lng, to.lat, to.lng);
      const km = haversineDistance(from.lat, from.lng, to.lat, to.lng);
      times.push({ mins, km });
    }

    return times;
  }, [items, previousSlotLastItem]);

  // Handle reorder
  const handleReorder = useCallback(
    (reorderedItems: PlannedItem[]) => {
      // Find what moved
      const oldOrder = items.map((i) => i.id);
      const newOrder = reorderedItems.map((i) => i.id);

      // Find the item that moved
      for (let i = 0; i < newOrder.length; i++) {
        if (newOrder[i] !== oldOrder[i]) {
          const movedId = newOrder[i];
          const fromIndex = oldOrder.indexOf(movedId);
          const toIndex = i;
          if (fromIndex !== toIndex) {
            reorderInSlot(dayIndex, slot, fromIndex, toIndex);
          }
          break;
        }
      }
    },
    [items, dayIndex, slot, reorderInSlot]
  );

  return (
    <div
      className={`
        rounded-2xl border transition-all duration-300
        ${isEmpty ? style.emptyBgClass : style.bgClass}
        ${style.borderClass}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
        <div className="flex items-center gap-2">
          <span className={`${style.textClass}`}>{style.icon}</span>
          <h3 className={`font-display text-lg font-medium ${style.textClass}`}>
            {style.label}
          </h3>
          <span className="text-body-3 text-rui-grey-40 ml-1">
            {style.hours}
          </span>
        </div>

        {/* Duration Summary */}
        {totalDuration > 0 && (
          <span className="text-body-3 text-rui-grey-50">
            ~{formatDuration(totalDuration)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {isEmpty ? (
          // Empty State
          <EmptySlotState
            slot={slot}
            onAdd={() => openAddPanel(slot, dayIndex)}
          />
        ) : (
          // Items with Drag-and-Drop
          <Reorder.Group
            axis="y"
            values={items}
            onReorder={handleReorder}
            className="space-y-1"
          >
            <AnimatePresence initial={false}>
              {items.map((item, index) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className="cursor-default"
                >
                  <PlannedItemCard
                    item={item}
                    showTravelIndicator={index > 0 && travelTimes[index]?.mins > 0}
                    travelMins={travelTimes[index]?.mins}
                    travelKm={travelTimes[index]?.km}
                    dragHandleProps={{}}
                  />
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}

        {/* Add Button */}
        {!isEmpty && (
          <motion.button
            onClick={() => openAddPanel(slot, dayIndex)}
            className={`
              w-full mt-3 py-3 rounded-xl border-2 border-dashed
              flex items-center justify-center gap-2
              text-body-2 font-medium
              transition-all duration-200
              ${style.borderClass} ${style.textClass}
              hover:bg-white/50 hover:border-solid
            `}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Plus className="w-4 h-4" />
            Add to {style.label.toLowerCase()}
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Empty Slot State
// ============================================================================

interface EmptySlotStateProps {
  slot: Slot;
  onAdd: () => void;
}

function EmptySlotState({ slot, onAdd }: EmptySlotStateProps) {
  const style = SLOT_STYLES[slot];

  const suggestions: Record<Slot, string[]> = {
    morning: ['Grab a coffee', 'Visit a museum', 'Explore a market'],
    afternoon: ['Have lunch', 'Go shopping', 'See a landmark'],
    evening: ['Watch the sunset', 'Have dinner', 'Find a viewpoint'],
    night: ['Try a local bar', 'Late-night food', 'Live music'],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-6 text-center"
    >
      <p className="text-body-2 text-rui-grey-50 mb-3">
        No plans yet for {style.label.toLowerCase()}
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {suggestions[slot].map((suggestion) => (
          <span
            key={suggestion}
            className={`
              px-3 py-1 rounded-full text-body-3
              ${style.emptyBgClass} ${style.textClass}
              border ${style.borderClass}
            `}
          >
            {suggestion}
          </span>
        ))}
      </div>

      <motion.button
        onClick={onAdd}
        className={`
          inline-flex items-center gap-2 px-5 py-2.5
          rounded-xl border-2 border-dashed
          ${style.borderClass} ${style.textClass}
          text-body-2 font-medium
          transition-all duration-200
          hover:bg-white/50 hover:border-solid hover:shadow-sm
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-4 h-4" />
        Add to {style.label.toLowerCase()}
      </motion.button>
    </motion.div>
  );
}

// ============================================================================
// Day Summary
// ============================================================================

interface DaySummaryProps {
  dayIndex: number;
}

export function DaySummary({ dayIndex }: DaySummaryProps) {
  const { getDayItems, getTotalDuration } = usePlanningStore();

  const items = getDayItems(dayIndex);
  const totalDuration = getTotalDuration(dayIndex);

  // Calculate total walking distance
  const totalWalkingKm = useMemo(() => {
    let total = 0;
    for (let i = 1; i < items.length; i++) {
      const from = items[i - 1].place.geometry.location;
      const to = items[i].place.geometry.location;
      total += haversineDistance(from.lat, from.lng, to.lat, to.lng);
    }
    return total;
  }, [items]);

  // Determine pacing
  const pacing = totalDuration < 240 ? 'relaxed' : totalDuration < 420 ? 'balanced' : 'packed';

  const pacingConfig = {
    relaxed: { label: 'Relaxed', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    balanced: { label: 'Balanced', color: 'text-amber-600', bg: 'bg-amber-100' },
    packed: { label: 'Packed', color: 'text-rose-600', bg: 'bg-rose-100' },
  };

  if (items.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-4 text-body-3 text-rui-grey-50">
      <span className="flex items-center gap-1">
        <span className="text-sm">⏱</span>
        ~{formatDuration(totalDuration)} activities
      </span>
      <span className="w-1 h-1 rounded-full bg-rui-grey-30" />
      <span className="flex items-center gap-1">
        <span className="text-sm">🚶</span>
        {totalWalkingKm.toFixed(1)} km walking
      </span>
      <span className="w-1 h-1 rounded-full bg-rui-grey-30" />
      <span
        className={`px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide ${pacingConfig[pacing].bg} ${pacingConfig[pacing].color}`}
      >
        {pacingConfig[pacing].label}
      </span>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (remainder === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours}h ${remainder}m`;
}

export default SlotContainer;
