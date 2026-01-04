/**
 * DayNavigator
 *
 * Day switcher component for Planning Mode.
 * Shows: ◀ Day 2 · Tuesday, Dec 24 · BARCELONA ▶
 *
 * Features:
 * - Horizontal scroll through days
 * - Current day highlight
 * - City indicator for multi-city trips
 * - Keyboard navigation (arrow keys)
 */

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import type { DayPlan } from '../../types/planning';

// ============================================================================
// Day Navigator Component
// ============================================================================

export function DayNavigator() {
  const {
    tripPlan,
    currentDayIndex,
    setCurrentDay,
    nextDay,
    prevDay,
  } = usePlanningStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current day when it changes
  useEffect(() => {
    if (scrollRef.current) {
      const dayButtons = scrollRef.current.querySelectorAll('[data-day-index]');
      const currentButton = dayButtons[currentDayIndex];
      if (currentButton) {
        currentButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentDayIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevDay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextDay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextDay, prevDay]);

  if (!tripPlan) return null;

  const days = tripPlan.days;
  const currentDay = days[currentDayIndex];
  const canGoPrev = currentDayIndex > 0;
  const canGoNext = currentDayIndex < days.length - 1;

  return (
    <div className="bg-rui-white border-b border-rui-grey-10">
      {/* Desktop View - Full width with arrows */}
      <div className="hidden lg:flex items-center justify-between px-6 py-4">
        {/* Previous Button */}
        <button
          onClick={prevDay}
          disabled={!canGoPrev}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full
            transition-all duration-200
            ${canGoPrev
              ? 'bg-rui-grey-5 hover:bg-rui-grey-10 text-rui-black cursor-pointer'
              : 'text-rui-grey-30 cursor-not-allowed'
            }
          `}
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Day Info Center */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDayIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl text-rui-black">
                Day {currentDayIndex + 1}
              </span>
              <span className="text-rui-grey-40">·</span>
              <span className="text-rui-grey-50 text-body-1">
                {formatDate(currentDay.date)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-rui-accent" />
              <span className="text-emphasis-2 text-rui-accent uppercase tracking-wide">
                {currentDay.city.name}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next Button */}
        <button
          onClick={nextDay}
          disabled={!canGoNext}
          className={`
            flex items-center justify-center w-10 h-10 rounded-full
            transition-all duration-200
            ${canGoNext
              ? 'bg-rui-grey-5 hover:bg-rui-grey-10 text-rui-black cursor-pointer'
              : 'text-rui-grey-30 cursor-not-allowed'
            }
          `}
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile View - Scrollable pills */}
      <div className="lg:hidden">
        {/* Current Day Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-rui-grey-8">
          <button
            onClick={prevDay}
            disabled={!canGoPrev}
            className={`touch-target flex items-center justify-center ${
              canGoPrev ? 'text-rui-black' : 'text-rui-grey-30'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentDayIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <div className="font-display text-lg text-rui-black">
                Day {currentDayIndex + 1} · {currentDay.city.name}
              </div>
              <div className="text-body-3 text-rui-grey-50">
                {formatDate(currentDay.date)}
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={nextDay}
            disabled={!canGoNext}
            className={`touch-target flex items-center justify-center ${
              canGoNext ? 'text-rui-black' : 'text-rui-grey-30'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Pills */}
        <div
          ref={scrollRef}
          className="scroll-x-container px-4 py-2 gap-2"
        >
          {days.map((day, index) => (
            <DayPill
              key={day.day_index}
              day={day}
              index={index}
              isActive={index === currentDayIndex}
              onClick={() => setCurrentDay(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Day Pill Component
// ============================================================================

interface DayPillProps {
  day: DayPlan;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function DayPill({ day, index, isActive, onClick }: DayPillProps) {
  const itemCount =
    day.slots.morning.length +
    day.slots.afternoon.length +
    day.slots.evening.length +
    day.slots.night.length;

  return (
    <button
      data-day-index={index}
      onClick={onClick}
      className={`
        flex flex-col items-center px-4 py-2 rounded-xl
        transition-all duration-200 min-w-[72px]
        ${isActive
          ? 'bg-rui-accent text-white shadow-accent'
          : 'bg-rui-grey-5 text-rui-grey-60 hover:bg-rui-grey-10'
        }
      `}
    >
      <span className="text-emphasis-3 uppercase tracking-wide">
        {formatDayOfWeek(day.date)}
      </span>
      <span className={`text-lg font-semibold ${isActive ? 'text-white' : 'text-rui-black'}`}>
        {day.date.getDate()}
      </span>
      {itemCount > 0 && (
        <span className={`text-body-3 ${isActive ? 'text-white/80' : 'text-rui-grey-50'}`}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// Compact Day Navigator (for header use)
// ============================================================================

export function CompactDayNavigator() {
  const { tripPlan, currentDayIndex, setCurrentDay } = usePlanningStore();

  if (!tripPlan) return null;

  const days = tripPlan.days;

  return (
    <div className="flex items-center gap-1">
      {days.map((day, index) => {
        const isActive = index === currentDayIndex;
        const isSameCity =
          index > 0 && days[index - 1].city.name === day.city.name;

        return (
          <button
            key={day.day_index}
            onClick={() => setCurrentDay(index)}
            className={`
              relative w-8 h-8 rounded-full flex items-center justify-center
              text-body-3 font-medium transition-all duration-200
              ${isActive
                ? 'bg-rui-accent text-white'
                : 'bg-rui-grey-5 text-rui-grey-60 hover:bg-rui-grey-10'
              }
              ${!isSameCity && index > 0 ? 'ml-3' : ''}
            `}
            title={`Day ${index + 1} - ${day.city.name}`}
          >
            {index + 1}
            {!isSameCity && index > 0 && (
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-rui-grey-30" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatDayOfWeek(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short' });
}

export default DayNavigator;
