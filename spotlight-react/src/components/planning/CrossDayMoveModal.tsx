/**
 * CrossDayMoveModal
 *
 * Elegant modal for moving planned items between days.
 * Features visual day previews, slot selection, and smooth animations.
 *
 * Design: Warm Editorial with layered depth and purposeful motion.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  ArrowRight,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import type { Slot, PlannedItem, DayPlan } from '../../types/planning';

// ============================================================================
// Slot Configuration
// ============================================================================

const SLOT_CONFIG: Record<Slot, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  maxHours: number;
}> = {
  morning: {
    label: 'Morning',
    icon: <Coffee className="w-4 h-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    maxHours: 4,
  },
  afternoon: {
    label: 'Afternoon',
    icon: <Sun className="w-4 h-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    maxHours: 6,
  },
  evening: {
    label: 'Evening',
    icon: <Sunset className="w-4 h-4" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    maxHours: 4,
  },
  night: {
    label: 'Night',
    icon: <Moon className="w-4 h-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    maxHours: 4,
  },
};

const SLOT_ORDER: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

// ============================================================================
// Props Interface
// ============================================================================

interface CrossDayMoveModalProps {
  item: PlannedItem;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function CrossDayMoveModal({ item, isOpen, onClose }: CrossDayMoveModalProps) {
  const { tripPlan, moveItem } = usePlanningStore();

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Calculate slot capacities for each day
  const dayCapacities = useMemo(() => {
    if (!tripPlan) return [];

    return tripPlan.days.map((day) => {
      const capacities: Record<Slot, { current: number; max: number; items: number }> = {
        morning: { current: 0, max: SLOT_CONFIG.morning.maxHours * 60, items: 0 },
        afternoon: { current: 0, max: SLOT_CONFIG.afternoon.maxHours * 60, items: 0 },
        evening: { current: 0, max: SLOT_CONFIG.evening.maxHours * 60, items: 0 },
        night: { current: 0, max: SLOT_CONFIG.night.maxHours * 60, items: 0 },
      };

      for (const slot of SLOT_ORDER) {
        const slotItems = day.slots[slot];
        capacities[slot].items = slotItems.length;
        capacities[slot].current = slotItems.reduce(
          (sum, i) => sum + i.place.estimated_duration_mins,
          0
        );
      }

      return capacities;
    });
  }, [tripPlan]);

  // Handle move action
  const handleMove = async () => {
    if (selectedDayIndex === null || selectedSlot === null) return;

    setIsMoving(true);

    // Simulate a brief delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 300));

    moveItem(item.id, selectedDayIndex, selectedSlot);
    setIsMoving(false);
    onClose();
  };

  // Check if selected slot is valid for this item
  const isSlotValid = (slot: Slot) => {
    return item.place.valid_slots.includes(slot);
  };

  // Check if slot would be overpacked
  const isSlotOverpacked = (dayIndex: number, slot: Slot) => {
    if (!dayCapacities[dayIndex]) return false;
    const capacity = dayCapacities[dayIndex][slot];
    const newDuration = capacity.current + item.place.estimated_duration_mins;
    return newDuration > capacity.max;
  };

  if (!tripPlan) return null;

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-rui-white rounded-2xl shadow-rui-4 overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-rui-grey-10">
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-rose-50/50" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rui-accent/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-rui-accent" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-rui-black">
                      Move to Another Day
                    </h2>
                    <p className="text-body-3 text-rui-grey-50">
                      Choose where to place {item.place.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-rui-grey-40 hover:bg-rui-grey-5 hover:text-rui-grey-60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Current Location */}
              <div className="mb-6 p-4 rounded-xl bg-rui-grey-5 border border-rui-grey-10">
                <p className="text-body-3 text-rui-grey-50 mb-2">Currently in</p>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${SLOT_CONFIG[item.slot].bgColor} flex items-center justify-center ${SLOT_CONFIG[item.slot].color}`}>
                    {SLOT_CONFIG[item.slot].icon}
                  </div>
                  <div>
                    <p className="text-body-2 font-medium text-rui-black">
                      Day {item.day_index + 1} · {SLOT_CONFIG[item.slot].label}
                    </p>
                    <p className="text-body-3 text-rui-grey-50">
                      {tripPlan.days[item.day_index]?.city.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Day Selector */}
              <div className="mb-6">
                <p className="text-body-2 font-medium text-rui-black mb-3">
                  Select a day
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {tripPlan.days.map((day, index) => (
                    <DayCard
                      key={index}
                      day={day}
                      dayIndex={index}
                      isSelected={selectedDayIndex === index}
                      isCurrent={item.day_index === index}
                      capacities={dayCapacities[index]}
                      onSelect={() => {
                        setSelectedDayIndex(index);
                        setSelectedSlot(null);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Slot Selector (appears when day is selected) */}
              <AnimatePresence mode="wait">
                {selectedDayIndex !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRight className="w-4 h-4 text-rui-grey-40" />
                      <p className="text-body-2 font-medium text-rui-black">
                        Select a time slot
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {SLOT_ORDER.map((slot) => (
                        <SlotCard
                          key={slot}
                          slot={slot}
                          config={SLOT_CONFIG[slot]}
                          capacity={dayCapacities[selectedDayIndex]?.[slot]}
                          itemDuration={item.place.estimated_duration_mins}
                          isSelected={selectedSlot === slot}
                          isValid={isSlotValid(slot)}
                          isOverpacked={isSlotOverpacked(selectedDayIndex, slot)}
                          onSelect={() => setSelectedSlot(slot)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview (appears when slot is selected) */}
              <AnimatePresence mode="wait">
                {selectedDayIndex !== null && selectedSlot !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50"
                  >
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                      <Check className="w-4 h-4" />
                      <p className="text-body-2 font-medium">Preview</p>
                    </div>
                    <p className="text-body-2 text-emerald-800">
                      <span className="font-medium">{item.place.name}</span> will be moved to{' '}
                      <span className="font-medium">Day {selectedDayIndex + 1}</span>'s{' '}
                      <span className="font-medium">{SLOT_CONFIG[selectedSlot].label.toLowerCase()}</span>
                      {tripPlan.days[selectedDayIndex]?.city.name !== tripPlan.days[item.day_index]?.city.name && (
                        <span className="text-emerald-600">
                          {' '}in {tripPlan.days[selectedDayIndex]?.city.name}
                        </span>
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-rui-grey-10 bg-rui-grey-2 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-body-2 font-medium text-rui-grey-60 hover:bg-rui-grey-10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMove}
                disabled={selectedDayIndex === null || selectedSlot === null || isMoving}
                className={`
                  relative px-6 py-2.5 rounded-xl text-body-2 font-medium
                  transition-all duration-200 overflow-hidden
                  ${selectedDayIndex !== null && selectedSlot !== null
                    ? 'bg-rui-accent text-white hover:bg-rui-accent/90 shadow-md hover:shadow-lg'
                    : 'bg-rui-grey-20 text-rui-grey-50 cursor-not-allowed'
                  }
                `}
              >
                {isMoving ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Moving...
                  </motion.div>
                ) : (
                  'Move Item'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface DayCardProps {
  day: DayPlan;
  dayIndex: number;
  isSelected: boolean;
  isCurrent: boolean;
  capacities: Record<Slot, { current: number; max: number; items: number }>;
  onSelect: () => void;
}

function DayCard({ day, dayIndex, isSelected, isCurrent, capacities, onSelect }: DayCardProps) {
  const totalItems = Object.values(capacities).reduce((sum, c) => sum + c.items, 0);

  // Format date
  const dateStr = day.date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      disabled={isCurrent}
      className={`
        relative p-3 rounded-xl border-2 text-left transition-all
        ${isSelected
          ? 'border-rui-accent bg-rui-accent/5 shadow-md'
          : isCurrent
            ? 'border-rui-grey-20 bg-rui-grey-5 opacity-50 cursor-not-allowed'
            : 'border-rui-grey-10 bg-white hover:border-rui-grey-30 hover:shadow-sm'
        }
      `}
    >
      {/* Current indicator */}
      {isCurrent && (
        <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-rui-grey-40 text-white text-[10px] font-medium">
          Current
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rui-accent flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}

      <p className="font-display text-base text-rui-black mb-0.5">
        Day {dayIndex + 1}
      </p>
      <p className="text-body-3 text-rui-grey-50 mb-2">
        {dateStr}
      </p>

      {/* Mini slot preview */}
      <div className="flex gap-1">
        {SLOT_ORDER.map((slot) => {
          const cap = capacities[slot];
          const fillPercent = Math.min((cap.current / cap.max) * 100, 100);
          return (
            <div
              key={slot}
              className="flex-1 h-1.5 rounded-full bg-rui-grey-10 overflow-hidden"
              title={`${SLOT_CONFIG[slot].label}: ${cap.items} items`}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  fillPercent > 80 ? 'bg-rose-400' :
                  fillPercent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          );
        })}
      </div>

      <p className="text-body-3 text-rui-grey-40 mt-2">
        {totalItems} {totalItems === 1 ? 'activity' : 'activities'}
      </p>
    </motion.button>
  );
}

interface SlotCardProps {
  slot: Slot;
  config: typeof SLOT_CONFIG[Slot];
  capacity: { current: number; max: number; items: number };
  itemDuration: number;
  isSelected: boolean;
  isValid: boolean;
  isOverpacked: boolean;
  onSelect: () => void;
}

function SlotCard({
  slot: _slot,
  config,
  capacity,
  itemDuration,
  isSelected,
  isValid,
  isOverpacked,
  onSelect,
}: SlotCardProps) {
  void _slot; // Reserved for future use
  const fillPercent = Math.min((capacity.current / capacity.max) * 100, 100);
  const newFillPercent = Math.min(((capacity.current + itemDuration) / capacity.max) * 100, 100);

  return (
    <motion.button
      whileHover={{ scale: isValid ? 1.02 : 1 }}
      whileTap={{ scale: isValid ? 0.98 : 1 }}
      onClick={onSelect}
      disabled={!isValid}
      className={`
        relative p-4 rounded-xl border-2 text-left transition-all
        ${isSelected
          ? 'border-rui-accent bg-rui-accent/5 shadow-md'
          : !isValid
            ? 'border-rui-grey-10 bg-rui-grey-5 opacity-50 cursor-not-allowed'
            : 'border-rui-grey-10 bg-white hover:border-rui-grey-30 hover:shadow-sm'
        }
      `}
    >
      {/* Invalid slot indicator */}
      {!isValid && (
        <div className="absolute top-2 right-2 text-rui-grey-40" title="Not ideal for this activity type">
          <AlertCircle className="w-4 h-4" />
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rui-accent flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <p className="text-body-2 font-medium text-rui-black">{config.label}</p>
          <p className="text-body-3 text-rui-grey-50">
            {capacity.items} {capacity.items === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="relative h-2 rounded-full bg-rui-grey-10 overflow-hidden mb-2">
        {/* Current fill */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all ${
            fillPercent > 80 ? 'bg-rose-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${fillPercent}%` }}
        />
        {/* Projected fill */}
        {isSelected && (
          <motion.div
            initial={{ width: `${fillPercent}%` }}
            animate={{ width: `${newFillPercent}%` }}
            className={`absolute inset-y-0 left-0 rounded-full ${
              isOverpacked ? 'bg-rose-400' : 'bg-amber-400'
            }`}
          />
        )}
      </div>

      {/* Time info */}
      <div className="flex items-center gap-1 text-body-3 text-rui-grey-50">
        <Clock className="w-3 h-3" />
        <span>{Math.round(capacity.current / 60)}h</span>
        {isSelected && (
          <span className={isOverpacked ? 'text-rose-600' : 'text-amber-600'}>
            → {Math.round((capacity.current + itemDuration) / 60)}h
          </span>
        )}
        <span className="text-rui-grey-30">/ {config.maxHours}h</span>
      </div>

      {/* Overpacked warning */}
      {isSelected && isOverpacked && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-body-3 text-rose-600 mt-2"
        >
          This will make the slot quite full
        </motion.p>
      )}
    </motion.button>
  );
}

// ============================================================================
// Export
// ============================================================================

export default CrossDayMoveModal;
