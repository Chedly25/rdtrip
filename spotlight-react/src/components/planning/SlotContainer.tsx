/**
 * SlotContainer - Premium Travel Journal Edition
 *
 * Each time slot feels like a page in a vintage travel notebook.
 * Tactile, warm, with elegant borders and refined typography.
 */

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Sun, CloudSun, Sunset, Moon, Coffee, UtensilsCrossed, Wine, Music, Landmark, ShoppingBag, Palmtree, Building2, Martini, User as UserIcon, Clock } from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { PlannedItemCard } from './PlannedItemCard';
import { estimateWalkingTime, haversineDistance } from '../../utils/planningEnrichment';
import type { Slot, PlannedItem } from '../../types/planning';

// ============================================================================
// Slot Configuration - Clean Professional Design
// ============================================================================

const SLOT_STYLES: Record<Slot, {
  label: string;
  icon: React.ReactNode;
  accentIcon: React.ReactNode;
  hours: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  textColor: string;
  iconColor: string;
}> = {
  morning: {
    label: 'Morning',
    icon: <Sun className="w-4 h-4" strokeWidth={1.5} />,
    accentIcon: <Coffee className="w-3.5 h-3.5" />,
    hours: '08:00 — 12:00',
    bgColor: 'bg-slate-50/50',
    borderColor: 'border-slate-200/60',
    accentColor: 'bg-teal-500',
    textColor: 'text-slate-700',
    iconColor: 'text-slate-500',
  },
  afternoon: {
    label: 'Afternoon',
    icon: <CloudSun className="w-4 h-4" strokeWidth={1.5} />,
    accentIcon: <UtensilsCrossed className="w-3.5 h-3.5" />,
    hours: '12:00 — 18:00',
    bgColor: 'bg-slate-50/50',
    borderColor: 'border-slate-200/60',
    accentColor: 'bg-blue-500',
    textColor: 'text-slate-700',
    iconColor: 'text-slate-500',
  },
  evening: {
    label: 'Evening',
    icon: <Sunset className="w-4 h-4" strokeWidth={1.5} />,
    accentIcon: <Wine className="w-3.5 h-3.5" />,
    hours: '18:00 — 22:00',
    bgColor: 'bg-slate-50/50',
    borderColor: 'border-slate-200/60',
    accentColor: 'bg-indigo-500',
    textColor: 'text-slate-700',
    iconColor: 'text-slate-500',
  },
  night: {
    label: 'Night',
    icon: <Moon className="w-4 h-4" strokeWidth={1.5} />,
    accentIcon: <Music className="w-3.5 h-3.5" />,
    hours: '22:00 — 02:00',
    bgColor: 'bg-slate-50/50',
    borderColor: 'border-slate-200/60',
    accentColor: 'bg-slate-600',
    textColor: 'text-slate-700',
    iconColor: 'text-slate-500',
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

  const totalDuration = useMemo(() => {
    return items.reduce((sum, item) => sum + item.place.estimated_duration_mins, 0);
  }, [items]);

  const travelTimes = useMemo(() => {
    const times: { mins: number; km: number }[] = [];

    if (items.length > 0 && previousSlotLastItem) {
      const from = previousSlotLastItem.place.geometry.location;
      const to = items[0].place.geometry.location;
      const mins = estimateWalkingTime(from.lat, from.lng, to.lat, to.lng);
      const km = haversineDistance(from.lat, from.lng, to.lat, to.lng);
      times.push({ mins, km });
    } else {
      times.push({ mins: 0, km: 0 });
    }

    for (let i = 1; i < items.length; i++) {
      const from = items[i - 1].place.geometry.location;
      const to = items[i].place.geometry.location;
      const mins = estimateWalkingTime(from.lat, from.lng, to.lat, to.lng);
      const km = haversineDistance(from.lat, from.lng, to.lat, to.lng);
      times.push({ mins, km });
    }

    return times;
  }, [items, previousSlotLastItem]);

  const handleReorder = useCallback(
    (reorderedItems: PlannedItem[]) => {
      const oldOrder = items.map((i) => i.id);
      const newOrder = reorderedItems.map((i) => i.id);

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
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
    >
      <div
        className={`
          relative overflow-hidden
          rounded-lg border ${style.borderColor}
          ${style.bgColor}
          transition-all duration-200
        `}
      >
        {/* Header - Clean, minimal design */}
        <div className="relative px-4 py-3 bg-white border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Icon - subtle color indicator */}
              <div className={`w-1 h-6 rounded-full ${style.accentColor}`} />

              {/* Label & Time */}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`${style.iconColor}`}>
                    {style.icon}
                  </span>
                  <h3 className={`text-sm font-semibold ${style.textColor}`}>
                    {style.label}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {style.hours}
                </p>
              </div>
            </div>

            {/* Duration Badge */}
            {totalDuration > 0 && (
              <motion.div
                className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-xs font-medium">
                  {formatDuration(totalDuration)}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative p-4">
          {isEmpty ? (
            <EmptySlotState
              slot={slot}
              style={style}
              onAdd={() => openAddPanel(slot, dayIndex)}
            />
          ) : (
            <Reorder.Group
              axis="y"
              values={items}
              onReorder={handleReorder}
              className="space-y-3"
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

          {/* Add Another Button */}
          {!isEmpty && (
            <button
              onClick={() => openAddPanel(slot, dayIndex)}
              className="
                w-full mt-3 py-2 rounded-md
                bg-white
                border border-dashed border-slate-300
                flex items-center justify-center gap-2
                text-slate-600
                text-sm font-medium
                transition-all duration-150
                hover:bg-slate-50 hover:border-slate-400
              "
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Add more
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Empty Slot State
// ============================================================================

interface EmptySlotStateProps {
  slot: Slot;
  style: typeof SLOT_STYLES[Slot];
  onAdd: () => void;
}

function EmptySlotState({ slot, style, onAdd }: EmptySlotStateProps) {
  const suggestions: Record<Slot, { icon: React.ReactNode; label: string }[]> = {
    morning: [
      { icon: <Coffee className="w-3.5 h-3.5" />, label: 'Coffee & pastries' },
      { icon: <Sun className="w-3.5 h-3.5" />, label: 'Museum visit' },
      { icon: <Landmark className="w-3.5 h-3.5" />, label: 'Historic site' },
    ],
    afternoon: [
      { icon: <UtensilsCrossed className="w-3.5 h-3.5" />, label: 'Lunch spot' },
      { icon: <ShoppingBag className="w-3.5 h-3.5" />, label: 'Local shopping' },
      { icon: <Palmtree className="w-3.5 h-3.5" />, label: 'Beach time' },
    ],
    evening: [
      { icon: <Sunset className="w-3.5 h-3.5" />, label: 'Sunset view' },
      { icon: <Wine className="w-3.5 h-3.5" />, label: 'Dinner reservation' },
      { icon: <Building2 className="w-3.5 h-3.5" />, label: 'City overlook' },
    ],
    night: [
      { icon: <Music className="w-3.5 h-3.5" />, label: 'Live music' },
      { icon: <Martini className="w-3.5 h-3.5" />, label: 'Cocktail bar' },
      { icon: <UserIcon className="w-3.5 h-3.5" />, label: 'Night walk' },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="py-6 text-center"
    >
      {/* Simple icon */}
      <div className={`inline-flex items-center justify-center mb-3 ${style.iconColor}`}>
        {style.icon}
      </div>

      <p className="text-sm text-slate-600 mb-4">
        No activities planned for {style.label.toLowerCase()}
      </p>

      {/* Suggestion chips - minimal */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-5">
        {suggestions[slot].map((suggestion, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs"
          >
            {suggestion.icon}
            {suggestion.label}
          </span>
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={onAdd}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          rounded-md
          ${style.accentColor} text-white
          text-sm font-medium
          transition-all duration-150
          hover:opacity-90
        `}
      >
        <Plus className="w-4 h-4" strokeWidth={2} />
        Add activities
      </button>
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

  const totalWalkingKm = useMemo(() => {
    let total = 0;
    for (let i = 1; i < items.length; i++) {
      const from = items[i - 1].place.geometry.location;
      const to = items[i].place.geometry.location;
      total += haversineDistance(from.lat, from.lng, to.lat, to.lng);
    }
    return total;
  }, [items]);

  const pacing = totalDuration < 240 ? 'relaxed' : totalDuration < 420 ? 'balanced' : 'packed';

  const pacingConfig = {
    relaxed: { label: 'Relaxed Pace', color: 'text-emerald-700', bg: 'bg-emerald-100/80', border: 'border-emerald-300' },
    balanced: { label: 'Balanced', color: 'text-amber-700', bg: 'bg-amber-100/80', border: 'border-amber-300' },
    packed: { label: 'Action-Packed', color: 'text-rose-700', bg: 'bg-rose-100/80', border: 'border-rose-300' },
  };

  if (items.length === 0) return null;

  return (
    <motion.div
      className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-rui-white/80 to-rui-grey-2/60 backdrop-blur-sm border-2 border-rui-grey-10 shadow-rui-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-body-3">
        <div className="flex items-center gap-2 text-rui-grey-60">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{formatDuration(totalDuration)}</span>
          <span className="text-rui-grey-40">of activities</span>
        </div>

        <div className="w-px h-4 bg-rui-grey-20" />

        <div className="flex items-center gap-2 text-rui-grey-60">
          <UserIcon className="w-4 h-4" />
          <span className="font-medium">{totalWalkingKm.toFixed(1)} km</span>
          <span className="text-rui-grey-40">walking</span>
        </div>

        <div className="w-px h-4 bg-rui-grey-20" />

        <span
          className={`
            inline-flex items-center gap-1.5
            px-3 py-1.5 rounded-full
            ${pacingConfig[pacing].bg} ${pacingConfig[pacing].color}
            border ${pacingConfig[pacing].border}
            text-[11px] font-semibold uppercase tracking-wide
            shadow-sm
          `}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {pacingConfig[pacing].label}
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export default SlotContainer;
