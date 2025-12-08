/**
 * ItineraryDayCard
 *
 * WI-5.5: Expandable day card showing full day schedule
 *
 * Design: Travel Journal with timeline visualization
 * - Expandable/collapsible day view
 * - Time slot sections (morning, afternoon, evening)
 * - Visual timeline connecting activities
 * - City header with day summary
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  MapPin,
  Sunrise,
  Sun,
  Moon,
  Car,
  Plus,
  Calendar,
} from 'lucide-react';
import type { ItineraryDay, ItineraryActivity, TimeSlot } from '../../services/itinerary';
import { ItineraryActivityCard } from './ItineraryActivityCard';

// ============================================================================
// Types
// ============================================================================

interface ItineraryDayCardProps {
  day: ItineraryDay;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Is this today? */
  isToday?: boolean;
  /** Is this day completed? */
  isCompleted?: boolean;
  /** Completed activity IDs */
  completedActivityIds?: Set<string>;
  /** Callbacks */
  onActivityClick?: (activity: ItineraryActivity) => void;
  onSwapActivity?: (activity: ItineraryActivity) => void;
  onRemoveActivity?: (activity: ItineraryActivity) => void;
  onAddActivity?: (day: ItineraryDay, slot: TimeSlot) => void;
  onNavigate?: (activity: ItineraryActivity) => void;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Time slot header
 */
function TimeSlotHeader({
  slot,
  activityCount,
  isActive,
}: {
  slot: TimeSlot;
  activityCount: number;
  isActive: boolean;
}) {
  const slotConfig = {
    morning: {
      label: 'Morning',
      time: '9 AM - 12 PM',
      icon: Sunrise,
      gradient: 'from-amber-100 to-orange-100',
      iconColor: 'text-amber-500',
      emoji: '🌅',
    },
    afternoon: {
      label: 'Afternoon',
      time: '12 PM - 6 PM',
      icon: Sun,
      gradient: 'from-sky-100 to-blue-100',
      iconColor: 'text-sky-500',
      emoji: '☀️',
    },
    evening: {
      label: 'Evening',
      time: '6 PM - 10 PM',
      icon: Moon,
      gradient: 'from-indigo-100 to-purple-100',
      iconColor: 'text-indigo-500',
      emoji: '🌙',
    },
  };

  const config = slotConfig[slot];

  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`
          flex items-center justify-center w-8 h-8 rounded-full
          bg-gradient-to-br ${config.gradient}
          ${isActive ? 'ring-2 ring-offset-2 ring-terracotta/30' : ''}
        `}
      >
        <span className="text-sm">{config.emoji}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-800">{config.label}</span>
          <span className="text-xs text-stone-400">{config.time}</span>
        </div>
        <span className="text-xs text-stone-500">
          {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
        </span>
      </div>
    </div>
  );
}

/**
 * Add activity button
 */
function AddActivityButton({
  slot,
  onClick,
}: {
  slot: TimeSlot;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-terracotta/30 hover:text-terracotta hover:bg-terracotta/5 transition-all"
    >
      <Plus className="w-4 h-4" />
      <span className="text-sm font-medium">Add {slot} activity</span>
    </motion.button>
  );
}

/**
 * Travel day indicator
 */
function TravelDayBanner({ day }: { day: ItineraryDay }) {
  const travelActivity = day.slots.morning.find((a) => a.type === 'travel');

  if (!travelActivity || travelActivity.type !== 'travel') return null;

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-sage/10 to-sage/5 border border-sage/20 mb-4">
      <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
        <Car className="w-5 h-5 text-sage" />
      </div>
      <div>
        <p className="font-semibold text-stone-800">Travel Day</p>
        <p className="text-sm text-stone-500">
          {travelActivity.from.name} → {travelActivity.to.name}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ItineraryDayCard({
  day,
  defaultExpanded = false,
  isToday = false,
  isCompleted = false,
  completedActivityIds = new Set(),
  onActivityClick,
  onSwapActivity,
  onRemoveActivity,
  onAddActivity,
  onNavigate,
}: ItineraryDayCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isToday);

  // Format date nicely
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Count total activities
  const totalActivities =
    day.slots.morning.length +
    day.slots.afternoon.length +
    day.slots.evening.length;

  // Count place activities for summary
  const placeCount = [
    ...day.slots.morning,
    ...day.slots.afternoon,
    ...day.slots.evening,
  ].filter((a) => a.type === 'place').length;

  // Get current time slot (for today highlighting)
  const getCurrentSlot = (): TimeSlot | null => {
    if (!isToday) return null;
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return null;
  };
  const currentSlot = getCurrentSlot();

  // Slots configuration
  const slots: { key: TimeSlot; activities: ItineraryActivity[] }[] = [
    { key: 'morning', activities: day.slots.morning },
    { key: 'afternoon', activities: day.slots.afternoon },
    { key: 'evening', activities: day.slots.evening },
  ];

  return (
    <motion.div
      layout
      className={`
        rounded-2xl overflow-hidden transition-all duration-300
        ${isToday
          ? 'bg-gradient-to-br from-white to-amber-50/50 border-2 border-terracotta/30 shadow-lg shadow-terracotta/10'
          : isCompleted
            ? 'bg-stone-50 border border-stone-200 opacity-80'
            : 'bg-white border border-stone-200 hover:border-stone-300 hover:shadow-md'
        }
      `}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center gap-4 text-left group"
      >
        {/* Day number badge */}
        <div
          className={`
            relative w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0
            ${isToday
              ? 'bg-gradient-to-br from-terracotta to-terracotta/80 text-white shadow-lg shadow-terracotta/30'
              : isCompleted
                ? 'bg-sage/20 text-sage'
                : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
            }
            transition-all duration-300
          `}
        >
          <span className="text-xs font-medium uppercase tracking-wider opacity-80">Day</span>
          <span className="text-xl font-bold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            {day.dayNumber}
          </span>
          {isToday && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Day info */}
        <div className="flex-1 min-w-0">
          {/* City & Date */}
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-bold text-lg text-stone-900 truncate"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {day.city.name}
            </h3>
            {day.isTravelDay && (
              <span className="px-2 py-0.5 text-xs font-medium bg-sage/20 text-sage rounded-full">
                Travel
              </span>
            )}
          </div>

          {/* Date & Summary */}
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(day.date)}
            </span>
            <span>•</span>
            <span>{placeCount} {placeCount === 1 ? 'place' : 'places'}</span>
          </div>

          {/* Theme if present */}
          {day.theme && (
            <p className="text-xs text-terracotta/80 mt-1 italic">
              {day.themeIcon && <span className="mr-1">{day.themeIcon}</span>}
              {day.theme}
            </p>
          )}
        </div>

        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="p-2 rounded-full bg-stone-100 group-hover:bg-stone-200 transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-stone-500" />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent mb-4" />

              {/* Travel day banner */}
              {day.isTravelDay && <TravelDayBanner day={day} />}

              {/* Day summary if available */}
              {day.summary && !day.isTravelDay && (
                <p className="text-sm text-stone-600 italic mb-4 px-2">
                  "{day.summary}"
                </p>
              )}

              {/* Time slots */}
              <div className="space-y-6">
                {slots.map(({ key, activities }) => {
                  // Skip empty slots for travel days
                  if (day.isTravelDay && activities.length === 0) return null;

                  return (
                    <div key={key}>
                      <TimeSlotHeader
                        slot={key}
                        activityCount={activities.length}
                        isActive={currentSlot === key}
                      />

                      {/* Activities */}
                      <div className="space-y-3 pl-2">
                        {activities.map((activity, index) => (
                          <ItineraryActivityCard
                            key={activity.id}
                            activity={activity}
                            isActive={isToday && currentSlot === key && index === 0}
                            isCompleted={completedActivityIds.has(activity.id)}
                            showConnector={index < activities.length - 1}
                            onViewDetails={onActivityClick}
                            onSwap={onSwapActivity}
                            onRemove={onRemoveActivity}
                            onNavigate={onNavigate}
                          />
                        ))}

                        {/* Add activity button */}
                        {!day.isTravelDay && onAddActivity && (
                          <AddActivityButton
                            slot={key}
                            onClick={() => onAddActivity(day, key)}
                          />
                        )}

                        {/* Empty slot placeholder */}
                        {activities.length === 0 && !day.isTravelDay && !onAddActivity && (
                          <div className="text-center py-6 text-stone-400 text-sm italic">
                            No activities planned
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed preview */}
      {!isExpanded && totalActivities > 0 && (
        <div className="px-4 pb-4 flex items-center gap-2 overflow-x-auto">
          {[...day.slots.morning, ...day.slots.afternoon, ...day.slots.evening]
            .filter((a) => a.type === 'place')
            .slice(0, 4)
            .map((activity) => {
              if (activity.type !== 'place') return null;
              const place = activity.place;
              return (
                <div
                  key={activity.id}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-full"
                >
                  <MapPin className="w-3 h-3 text-stone-400" />
                  <span className="text-xs text-stone-600 whitespace-nowrap max-w-[120px] truncate">
                    {place.name}
                  </span>
                </div>
              );
            })}
          {placeCount > 4 && (
            <span className="text-xs text-stone-400 whitespace-nowrap">
              +{placeCount - 4} more
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
