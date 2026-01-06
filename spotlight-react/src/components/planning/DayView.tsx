/**
 * DayView
 *
 * Full day layout showing all four slots stacked vertically.
 * Displays: Morning, Afternoon, Evening, Night containers.
 *
 * Features:
 * - Responsive layout (single column mobile, can be wider on desktop)
 * - Day summary at bottom
 * - Smooth transitions between days
 * - Pass previous slot's last item for travel time calculation
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, CloudSun, Sunset, Moon } from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { SlotContainer, DaySummary } from './SlotContainer';
import type { Slot, PlannedItem } from '../../types/planning';

// ============================================================================
// Slot Order
// ============================================================================

const SLOTS: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

// ============================================================================
// Component
// ============================================================================

export function DayView() {
  const { tripPlan, currentDayIndex } = usePlanningStore();

  const currentDay = tripPlan?.days[currentDayIndex];

  // Build a map of last items per slot for travel time calculation
  const lastItemPerSlot = useMemo((): Record<Slot, PlannedItem | null> => {
    if (!currentDay) {
      return {
        morning: null,
        afternoon: null,
        evening: null,
        night: null,
      };
    }

    const map: Record<Slot, PlannedItem | null> = {
      morning: null,
      afternoon: null,
      evening: null,
      night: null,
    };

    SLOTS.forEach((slot) => {
      const items = currentDay.slots[slot];
      if (items.length > 0) {
        map[slot] = items[items.length - 1];
      }
    });

    return map;
  }, [currentDay]);

  if (!tripPlan || !currentDay) {
    return (
      <div className="flex items-center justify-center h-64 text-rui-grey-50">
        No trip plan loaded
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentDayIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="space-y-4 pb-8"
      >
        {/* City Header for this day */}
        <div className="text-center py-2">
          <p className="text-body-3 text-rui-grey-50 uppercase tracking-wide">
            {currentDay.city.country}
          </p>
        </div>

        {/* Slot Containers */}
        {SLOTS.map((slot, index) => {
          // Get the previous slot's last item
          const prevSlot = index > 0 ? SLOTS[index - 1] : null;
          const previousSlotLastItem = prevSlot ? lastItemPerSlot[prevSlot] : null;

          return (
            <SlotContainer
              key={slot}
              slot={slot}
              dayIndex={currentDayIndex}
              previousSlotLastItem={previousSlotLastItem}
            />
          );
        })}

        {/* Day Summary */}
        <DaySummary dayIndex={currentDayIndex} />
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Day Overview Card (Compact)
// ============================================================================

interface DayOverviewCardProps {
  dayIndex: number;
  onClick?: () => void;
  isActive?: boolean;
}

export function DayOverviewCard({ dayIndex, onClick, isActive = false }: DayOverviewCardProps) {
  const { tripPlan, getDayItems, getTotalDuration } = usePlanningStore();

  const day = tripPlan?.days[dayIndex];
  if (!day) return null;

  const items = getDayItems(dayIndex);
  const totalDuration = getTotalDuration(dayIndex);

  // Count items per slot
  const slotCounts = {
    morning: day.slots.morning.length,
    afternoon: day.slots.afternoon.length,
    evening: day.slots.evening.length,
    night: day.slots.night.length,
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl border text-left
        transition-all duration-200
        ${isActive
          ? 'bg-rui-accent/5 border-rui-accent shadow-accent/20'
          : 'bg-rui-white border-rui-grey-10 hover:border-rui-grey-20 hover:shadow-rui-1'
        }
      `}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-display text-lg text-rui-black">
            Day {dayIndex + 1}
          </span>
          <span className="text-rui-grey-40 mx-2">·</span>
          <span className="text-body-2 text-rui-grey-50">
            {day.city.name}
          </span>
        </div>
        <span className="text-body-3 text-rui-grey-40">
          {formatDate(day.date)}
        </span>
      </div>

      {/* Slot Indicators */}
      <div className="flex items-center gap-3 mb-2">
        <SlotIndicator slot="morning" count={slotCounts.morning} />
        <SlotIndicator slot="afternoon" count={slotCounts.afternoon} />
        <SlotIndicator slot="evening" count={slotCounts.evening} />
        <SlotIndicator slot="night" count={slotCounts.night} />
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <p className="text-body-3 text-rui-grey-50">
          {items.length} {items.length === 1 ? 'activity' : 'activities'} · ~{formatDuration(totalDuration)}
        </p>
      )}
    </motion.button>
  );
}

// ============================================================================
// Slot Indicator
// ============================================================================

interface SlotIndicatorProps {
  slot: Slot;
  count: number;
}

const SLOT_COLORS: Record<Slot, { empty: string; filled: string }> = {
  morning: { empty: 'bg-amber-100', filled: 'bg-amber-400' },
  afternoon: { empty: 'bg-orange-100', filled: 'bg-orange-400' },
  evening: { empty: 'bg-rose-100', filled: 'bg-rose-400' },
  night: { empty: 'bg-indigo-100', filled: 'bg-indigo-400' },
};

const SLOT_ICONS: Record<Slot, React.ReactNode> = {
  morning: <Sun className="w-3 h-3" />,
  afternoon: <CloudSun className="w-3 h-3" />,
  evening: <Sunset className="w-3 h-3" />,
  night: <Moon className="w-3 h-3" />,
};

function SlotIndicator({ slot, count }: SlotIndicatorProps) {
  const colors = SLOT_COLORS[slot];
  const Icon = SLOT_ICONS[slot];

  return (
    <div className="flex items-center gap-1">
      {Icon}
      <div
        className={`
          w-6 h-2 rounded-full
          ${count > 0 ? colors.filled : colors.empty}
        `}
        title={`${count} items in ${slot}`}
      />
    </div>
  );
}

// ============================================================================
// All Days Overview
// ============================================================================

export function AllDaysOverview() {
  const { tripPlan, currentDayIndex, setCurrentDay } = usePlanningStore();

  if (!tripPlan) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg text-rui-black px-1">
        Trip Overview
      </h3>
      <div className="space-y-2">
        {tripPlan.days.map((day, index) => (
          <DayOverviewCard
            key={day.day_index}
            dayIndex={index}
            onClick={() => setCurrentDay(index)}
            isActive={index === currentDayIndex}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export default DayView;
