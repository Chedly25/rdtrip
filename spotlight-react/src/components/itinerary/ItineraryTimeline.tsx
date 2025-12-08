/**
 * ItineraryTimeline
 *
 * WI-5.5: Bird's-eye view timeline of the entire trip
 *
 * Design: Horizontal scrollable journey visualization
 * - City-to-city flow with connecting route line
 * - Day markers along the timeline
 * - Quick navigation to specific days
 * - Compact summary view
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Gem,
} from 'lucide-react';
import type { Itinerary, ItineraryDay, ItineraryCity } from '../../services/itinerary';

// ============================================================================
// Types
// ============================================================================

interface ItineraryTimelineProps {
  itinerary: Itinerary;
  /** Currently selected day (1-indexed) */
  selectedDay?: number;
  /** Today's day number (1-indexed, if during trip) */
  currentDay?: number;
  /** Callback when day is selected */
  onSelectDay?: (dayNumber: number) => void;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * City node on timeline
 */
function CityNode({
  city,
  isFirst,
  isLast,
  dayRange,
}: {
  city: ItineraryCity;
  isFirst: boolean;
  isLast: boolean;
  dayRange: { start: number; end: number };
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center"
    >
      {/* City marker */}
      <div
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center
          ${isFirst || isLast
            ? 'bg-gradient-to-br from-terracotta to-terracotta/80 text-white shadow-lg shadow-terracotta/30'
            : 'bg-white border-2 border-stone-300 text-stone-600'
          }
        `}
      >
        <MapPin className="w-5 h-5" />
        {/* Origin/Destination badge */}
        {isFirst && (
          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-sage text-white text-[10px] font-bold rounded-full">
            START
          </div>
        )}
        {isLast && (
          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-terracotta text-white text-[10px] font-bold rounded-full">
            END
          </div>
        )}
      </div>

      {/* City name */}
      <p
        className="mt-2 text-sm font-semibold text-stone-800 text-center max-w-[100px] truncate"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        {city.name}
      </p>

      {/* Days info */}
      <p className="text-xs text-stone-500">
        Day {dayRange.start}
        {dayRange.end > dayRange.start ? `-${dayRange.end}` : ''}
      </p>

      {/* Nights badge */}
      {city.nights > 0 && (
        <span className="mt-1 px-2 py-0.5 text-xs bg-stone-100 text-stone-600 rounded-full">
          {city.nights} {city.nights === 1 ? 'night' : 'nights'}
        </span>
      )}
    </motion.div>
  );
}

/**
 * Route connector between cities
 */
function RouteConnector({ distance }: { distance?: number }) {
  return (
    <div className="flex-1 flex items-center justify-center min-w-[80px] mx-2">
      <div className="relative w-full">
        {/* Line */}
        <div className="h-0.5 bg-gradient-to-r from-stone-300 via-stone-400 to-stone-300 rounded-full" />

        {/* Arrow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-stone-400 border-y-[4px] border-y-transparent" />

        {/* Distance label */}
        {distance && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 flex items-center gap-1 text-xs text-stone-400">
            <Car className="w-3 h-3" />
            <span>{Math.round(distance)} km</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Day marker dot for compact view
 */
function DayDot({
  day,
  isSelected,
  isCurrent,
  isCompleted,
  onClick,
}: {
  day: ItineraryDay;
  isSelected: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  // Count hidden gems for this day
  const hiddenGemCount = [
    ...day.slots.morning,
    ...day.slots.afternoon,
    ...day.slots.evening,
  ].filter((a) => a.type === 'place' && a.isHiddenGem).length;

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all
        ${isSelected
          ? 'bg-terracotta/10'
          : 'hover:bg-stone-100'
        }
      `}
    >
      {/* Dot */}
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
          transition-all
          ${isCurrent
            ? 'bg-gradient-to-br from-terracotta to-gold text-white shadow-lg shadow-terracotta/30 ring-2 ring-terracotta/30 ring-offset-2'
            : isSelected
              ? 'bg-terracotta text-white'
              : isCompleted
                ? 'bg-sage/20 text-sage'
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
          }
        `}
      >
        {day.dayNumber}
      </div>

      {/* Hidden gem indicator */}
      {hiddenGemCount > 0 && (
        <div className="absolute -top-1 -right-1">
          <Gem className="w-3.5 h-3.5 text-amber-500" />
        </div>
      )}

      {/* Day label */}
      <span className="text-[10px] text-stone-500 whitespace-nowrap">
        {day.isTravelDay ? (
          <span className="flex items-center gap-0.5">
            <Car className="w-2.5 h-2.5" />
            Travel
          </span>
        ) : (
          day.city.name.slice(0, 6)
        )}
      </span>
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ItineraryTimeline({
  itinerary,
  selectedDay,
  currentDay,
  onSelectDay,
}: ItineraryTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Build city journey from days
  const uniqueCities = new Map<string, { city: ItineraryCity; startDay: number; endDay: number }>();
  itinerary.days.forEach((day) => {
    const existing = uniqueCities.get(day.city.id);
    if (existing) {
      existing.endDay = day.dayNumber;
    } else {
      uniqueCities.set(day.city.id, {
        city: day.city,
        startDay: day.dayNumber,
        endDay: day.dayNumber,
      });
    }
  });
  const cityJourney = Array.from(uniqueCities.values());

  // Scroll controls
  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-terracotta" />
            <h3
              className="font-bold text-stone-800"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Trip Overview
            </h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-stone-500">
            <span>{itinerary.summary.totalDays} days</span>
            <span>•</span>
            <span>{itinerary.summary.cities.length} cities</span>
            {itinerary.summary.hiddenGemsCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-600">
                  <Gem className="w-3.5 h-3.5" />
                  {itinerary.summary.hiddenGemsCount}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* City journey */}
      <div className="p-4 border-b border-stone-100 bg-stone-50/50">
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
          {cityJourney.map((item, index) => (
            <div key={item.city.id} className="flex items-center">
              <CityNode
                city={item.city}
                isFirst={index === 0}
                isLast={index === cityJourney.length - 1}
                dayRange={{ start: item.startDay, end: item.endDay }}
              />
              {index < cityJourney.length - 1 && (
                <RouteConnector />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Day selector */}
      <div className="relative">
        {/* Scroll buttons */}
        {itinerary.days.length > 5 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-white to-transparent"
            >
              <ChevronLeft className="w-5 h-5 text-stone-400" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-white to-transparent"
            >
              <ChevronRight className="w-5 h-5 text-stone-400" />
            </button>
          </>
        )}

        {/* Days */}
        <div
          ref={scrollContainerRef}
          className="flex gap-1 p-3 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {itinerary.days.map((day) => (
            <div key={day.dayNumber} style={{ scrollSnapAlign: 'center' }}>
              <DayDot
                day={day}
                isSelected={selectedDay === day.dayNumber}
                isCurrent={currentDay === day.dayNumber}
                isCompleted={currentDay ? day.dayNumber < currentDay : false}
                onClick={() => onSelectDay?.(day.dayNumber)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-px bg-stone-100">
        <div className="bg-white p-3 text-center">
          <p className="text-lg font-bold text-stone-800">{itinerary.summary.totalActivities}</p>
          <p className="text-xs text-stone-500">Activities</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-lg font-bold text-stone-800">{itinerary.summary.hiddenGemsCount}</p>
          <p className="text-xs text-stone-500">Hidden Gems</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-lg font-bold text-stone-800">{itinerary.summary.favouritedCount}</p>
          <p className="text-xs text-stone-500">Favourites</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-lg font-bold text-stone-800">{Math.round(itinerary.summary.totalDrivingDistanceKm)}</p>
          <p className="text-xs text-stone-500">km Drive</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact mini timeline for embedding
 */
export function ItineraryTimelineMini({
  itinerary,
  currentDay,
  onSelectDay,
}: {
  itinerary: Itinerary;
  currentDay?: number;
  onSelectDay?: (dayNumber: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-2 overflow-x-auto">
      {itinerary.days.map((day, index) => {
        const isCompleted = currentDay ? day.dayNumber < currentDay : false;
        const isCurrent = day.dayNumber === currentDay;

        return (
          <div key={day.dayNumber} className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDay?.(day.dayNumber)}
              className={`
                w-6 h-6 rounded-full text-xs font-medium
                transition-all
                ${isCurrent
                  ? 'bg-terracotta text-white'
                  : isCompleted
                    ? 'bg-sage/30 text-sage'
                    : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                }
              `}
            >
              {day.dayNumber}
            </motion.button>
            {index < itinerary.days.length - 1 && (
              <div
                className={`
                  w-4 h-0.5 mx-0.5
                  ${isCompleted ? 'bg-sage/30' : 'bg-stone-200'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
