/**
 * SlotContainer - Premium Travel Journal Edition
 *
 * Each time slot feels like a page in a vintage travel notebook.
 * Tactile, warm, with elegant borders and refined typography.
 */

import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Sun, CloudSun, Sunset, Moon, Coffee, UtensilsCrossed, Wine, Music } from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { PlannedItemCard } from './PlannedItemCard';
import { estimateWalkingTime, haversineDistance } from '../../utils/planningEnrichment';
import type { Slot, PlannedItem } from '../../types/planning';

// ============================================================================
// Slot Configuration - Premium Travel Journal Theme
// ============================================================================

const SLOT_STYLES: Record<Slot, {
  label: string;
  icon: React.ReactNode;
  accentIcon: React.ReactNode;
  hours: string;
  bgGradient: string;
  borderColor: string;
  accentColor: string;
  textColor: string;
  iconColor: string;
  stampColor: string;
}> = {
  morning: {
    label: 'Morning',
    icon: <Sun className="w-5 h-5" strokeWidth={2} />,
    accentIcon: <Coffee className="w-4 h-4" />,
    hours: '08:00 — 12:00',
    bgGradient: 'from-amber-50/90 via-orange-50/60 to-amber-50/40',
    borderColor: 'border-amber-300/40',
    accentColor: 'bg-gradient-to-br from-amber-500 to-orange-500',
    textColor: 'text-amber-900',
    iconColor: 'text-amber-600',
    stampColor: 'text-amber-400/30',
  },
  afternoon: {
    label: 'Afternoon',
    icon: <CloudSun className="w-5 h-5" strokeWidth={2} />,
    accentIcon: <UtensilsCrossed className="w-4 h-4" />,
    hours: '12:00 — 18:00',
    bgGradient: 'from-orange-50/90 via-rose-50/60 to-orange-50/40',
    borderColor: 'border-orange-300/40',
    accentColor: 'bg-gradient-to-br from-orange-500 to-rose-500',
    textColor: 'text-orange-900',
    iconColor: 'text-orange-600',
    stampColor: 'text-orange-400/30',
  },
  evening: {
    label: 'Evening',
    icon: <Sunset className="w-5 h-5" strokeWidth={2} />,
    accentIcon: <Wine className="w-4 h-4" />,
    hours: '18:00 — 22:00',
    bgGradient: 'from-rose-50/90 via-pink-50/60 to-rose-50/40',
    borderColor: 'border-rose-300/40',
    accentColor: 'bg-gradient-to-br from-rose-500 to-pink-500',
    textColor: 'text-rose-900',
    iconColor: 'text-rose-600',
    stampColor: 'text-rose-400/30',
  },
  night: {
    label: 'Night',
    icon: <Moon className="w-5 h-5" strokeWidth={2} />,
    accentIcon: <Music className="w-4 h-4" />,
    hours: '22:00 — 02:00',
    bgGradient: 'from-indigo-50/90 via-purple-50/60 to-indigo-50/40',
    borderColor: 'border-indigo-300/40',
    accentColor: 'bg-gradient-to-br from-indigo-500 to-purple-500',
    textColor: 'text-indigo-900',
    iconColor: 'text-indigo-600',
    stampColor: 'text-indigo-400/30',
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
      {/* Decorative journal corner */}
      <div className="absolute -top-1 -right-1 w-8 h-8 pointer-events-none">
        <svg viewBox="0 0 32 32" className={style.stampColor} fill="currentColor">
          <path d="M0 0 L32 0 L0 32 Z" />
        </svg>
      </div>

      <div
        className={`
          relative overflow-hidden
          rounded-2xl border-2 ${style.borderColor}
          bg-gradient-to-br ${style.bgGradient}
          shadow-rui-2
          transition-all duration-500
          hover:shadow-rui-3
        `}
      >
        {/* Subtle paper texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')]" />

        {/* Header - Journal page header style */}
        <div className="relative px-5 py-4 bg-white/40 backdrop-blur-sm border-b-2 border-inherit">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon Badge */}
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-xl
                ${style.accentColor} shadow-md
              `}>
                <span className="text-white">
                  {style.icon}
                </span>
              </div>

              {/* Label & Time */}
              <div>
                <h3 className={`font-display text-lg font-semibold ${style.textColor} tracking-tight`}>
                  {style.label}
                </h3>
                <p className="text-[11px] uppercase tracking-widest text-rui-grey-50 font-medium">
                  {style.hours}
                </p>
              </div>
            </div>

            {/* Duration Badge */}
            {totalDuration > 0 && (
              <motion.div
                className={`
                  px-3 py-1.5 rounded-lg
                  bg-white/60 backdrop-blur-sm
                  border ${style.borderColor}
                  ${style.textColor}
                `}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider">
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
            <motion.button
              onClick={() => openAddPanel(slot, dayIndex)}
              className={`
                w-full mt-4 py-3.5 rounded-xl
                bg-white/50 backdrop-blur-sm
                border-2 border-dashed ${style.borderColor}
                flex items-center justify-center gap-2
                ${style.textColor}
                text-body-2 font-semibold
                transition-all duration-300
                hover:bg-white/80 hover:border-solid hover:shadow-md
                hover:scale-[1.02]
              `}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add more to {style.label.toLowerCase()}
            </motion.button>
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
      { icon: '🏛️', label: 'Historic site' },
    ],
    afternoon: [
      { icon: <UtensilsCrossed className="w-3.5 h-3.5" />, label: 'Lunch spot' },
      { icon: '🛍️', label: 'Local shopping' },
      { icon: '🏖️', label: 'Beach time' },
    ],
    evening: [
      { icon: <Sunset className="w-3.5 h-3.5" />, label: 'Sunset view' },
      { icon: <Wine className="w-3.5 h-3.5" />, label: 'Dinner reservation' },
      { icon: '🌆', label: 'City overlook' },
    ],
    night: [
      { icon: <Music className="w-3.5 h-3.5" />, label: 'Live music' },
      { icon: '🍸', label: 'Cocktail bar' },
      { icon: '🌙', label: 'Night walk' },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="py-8 text-center"
    >
      {/* Large decorative icon */}
      <motion.div
        className={`
          inline-flex items-center justify-center
          w-16 h-16 rounded-2xl
          bg-white/60 backdrop-blur-sm
          ${style.iconColor}
          mb-4 shadow-md
        `}
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        {style.icon}
      </motion.div>

      <p className="text-body-2 text-rui-grey-50 font-medium mb-5">
        Your {style.label.toLowerCase()} is wide open
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {suggestions[slot].map((suggestion, index) => (
          <motion.span
            key={index}
            className={`
              inline-flex items-center gap-1.5
              px-3 py-2 rounded-full
              bg-white/70 backdrop-blur-sm
              border ${style.borderColor}
              ${style.textColor}
              text-[11px] font-medium
              shadow-sm
            `}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.05 }}
          >
            {typeof suggestion.icon === 'string' ? (
              <span>{suggestion.icon}</span>
            ) : (
              suggestion.icon
            )}
            {suggestion.label}
          </motion.span>
        ))}
      </div>

      {/* Add button */}
      <motion.button
        onClick={onAdd}
        className={`
          inline-flex items-center gap-2 px-6 py-3
          rounded-xl
          ${style.accentColor} text-white
          text-body-2 font-semibold
          shadow-md
          transition-all duration-300
          hover:shadow-lg hover:scale-105
        `}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        Start planning {style.label.toLowerCase()}
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
          <span className="text-base">⏱</span>
          <span className="font-medium">{formatDuration(totalDuration)}</span>
          <span className="text-rui-grey-40">of activities</span>
        </div>

        <div className="w-px h-4 bg-rui-grey-20" />

        <div className="flex items-center gap-2 text-rui-grey-60">
          <span className="text-base">🚶</span>
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
