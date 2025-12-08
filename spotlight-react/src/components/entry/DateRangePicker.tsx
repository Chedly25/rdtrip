import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Moon, X } from 'lucide-react';
import { calculateNights } from './types';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onClear?: () => void;
  error?: string;
  maxNights?: number;
  /** Optional callback when picker is opened (for analytics) */
  onPickerOpen?: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  error,
  maxNights = 30,
  onPickerOpen,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [focusedDay, setFocusedDay] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Click outside handler (desktop only)
  useEffect(() => {
    if (isMobile) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  // Lock body scroll when modal is open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const handleDateClick = useCallback((day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (selectedDate < today) return;

    if (selecting === 'start') {
      onStartDateChange(selectedDate);
      setSelecting('end');
      // If end date is before new start, clear it
      if (endDate && endDate < selectedDate) {
        onEndDateChange(selectedDate);
      }
    } else {
      // If selected date is before start, swap them
      if (startDate && selectedDate < startDate) {
        onEndDateChange(startDate);
        onStartDateChange(selectedDate);
      } else {
        onEndDateChange(selectedDate);
      }
      setIsOpen(false);
      setSelecting('start');
    }
  }, [currentMonth, selecting, startDate, endDate, onStartDateChange, onEndDateChange, today]);

  const isDateInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date > startDate && date < endDate;
  };

  const isStartDate = (day: number) => {
    if (!startDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === startDate.toDateString();
  };

  const isEndDate = (day: number) => {
    if (!endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === endDate.toDateString();
  };

  const isPastDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date < today;
  };

  // Check if date exceeds max range from start date
  const isExceedsMaxRange = (day: number) => {
    if (!startDate || selecting !== 'end') return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > maxNights;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setFocusedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setFocusedDay(null);
  };

  // Keyboard navigation within calendar
  const handleCalendarKeyDown = (e: React.KeyboardEvent) => {
    const { daysInMonth } = getDaysInMonth(currentMonth);

    if (!focusedDay) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedDay(1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (focusedDay < daysInMonth) {
          setFocusedDay(focusedDay + 1);
        } else {
          goToNextMonth();
          setFocusedDay(1);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (focusedDay > 1) {
          setFocusedDay(focusedDay - 1);
        } else {
          goToPreviousMonth();
          // Set to last day of previous month
          const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
          const prevDaysInMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate();
          setFocusedDay(prevDaysInMonth);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (focusedDay + 7 <= daysInMonth) {
          setFocusedDay(focusedDay + 7);
        } else {
          goToNextMonth();
          setFocusedDay(Math.min(7, new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0).getDate()));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (focusedDay - 7 > 0) {
          setFocusedDay(focusedDay - 7);
        } else {
          goToPreviousMonth();
          const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
          const prevDaysInMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 0).getDate();
          setFocusedDay(prevDaysInMonth - (7 - focusedDay));
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isPastDate(focusedDay) && !isExceedsMaxRange(focusedDay)) {
          handleDateClick(focusedDay);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedDay(1);
        break;
      case 'End':
        e.preventDefault();
        setFocusedDay(daysInMonth);
        break;
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    setSelecting('start');
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);
  const nights = calculateNights(startDate, endDate);

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calendar content (shared between mobile and desktop)
  const CalendarContent = () => (
    <div
      ref={calendarRef}
      onKeyDown={handleCalendarKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Date picker calendar"
      className="outline-none"
    >
      {/* Selection indicator */}
      <div className="px-5 py-4 border-b border-rui-grey-10 bg-rui-grey-2">
        <p className="text-body-3 text-rui-grey-50 text-center">
          {selecting === 'start' ? 'Select your departure date' : 'Select your return date'}
        </p>
        {selecting === 'end' && startDate && (
          <p className="text-body-3 text-rui-accent text-center mt-1">
            Max {maxNights} nights from {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-rui-grey-5 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-rui-grey-50" />
        </button>
        <h3 className="font-display font-semibold text-rui-black" aria-live="polite">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={goToNextMonth}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-rui-grey-5 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-rui-grey-50" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 px-4 pb-2" role="row">
        {DAYS.map((day) => (
          <div
            key={day}
            role="columnheader"
            className="h-10 flex items-center justify-center text-body-3 font-medium text-rui-grey-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 px-4 pb-5" role="grid">
        {/* Empty cells for days before first of month */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-10" role="gridcell" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isPast = isPastDate(day);
          const isStart = isStartDate(day);
          const isEnd = isEndDate(day);
          const isInRange = isDateInRange(day);
          const exceedsMax = isExceedsMaxRange(day);
          const isFocused = focusedDay === day;
          const isDisabled = isPast || exceedsMax;

          return (
            <motion.button
              key={day}
              type="button"
              role="gridcell"
              aria-selected={isStart || isEnd}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => handleDateClick(day)}
              whileTap={{ scale: isDisabled ? 1 : 0.95 }}
              className={`
                h-10 rounded-full flex items-center justify-center text-body-2 font-medium
                transition-all duration-rui-xs relative
                ${isFocused ? 'ring-2 ring-rui-accent ring-offset-2' : ''}
                ${isPast
                  ? 'text-rui-grey-20 cursor-not-allowed'
                  : exceedsMax
                  ? 'text-rui-grey-30 cursor-not-allowed bg-rui-grey-5'
                  : isStart || isEnd
                  ? 'bg-rui-accent text-rui-white shadow-accent'
                  : isInRange
                  ? 'bg-rui-accent/10 text-rui-accent'
                  : 'text-rui-black hover:bg-rui-grey-5'
                }
              `}
            >
              {day}
            </motion.button>
          );
        })}
      </div>

      {/* Quick selection buttons */}
      <div className="px-4 pb-4 flex gap-2">
        {[
          { label: '3 nights', days: 3 },
          { label: 'Week', days: 7 },
          { label: '2 weeks', days: 14 },
        ].map(({ label, days }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              const start = new Date(today);
              start.setDate(today.getDate() + 7); // Start a week from now
              const end = new Date(start);
              end.setDate(start.getDate() + days);
              onStartDateChange(start);
              onEndDateChange(end);
              setIsOpen(false);
            }}
            className="flex-1 py-2 rounded-rui-8 text-body-3 font-medium text-rui-grey-50 bg-rui-grey-5 hover:bg-rui-grey-8 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Label */}
      <label className="block text-body-3 font-medium text-rui-grey-50 mb-2 uppercase tracking-wide">
        When are you traveling?
      </label>

      {/* Date display button */}
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            onPickerOpen?.();
          }
          setIsOpen(!isOpen);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`
          w-full flex items-center gap-4 p-4 rounded-rui-16 border-2 transition-all duration-rui-sm
          bg-rui-white text-left
          ${error
            ? 'border-danger'
            : startDate && endDate
            ? 'border-success'
            : 'border-rui-grey-10 hover:border-rui-grey-20 focus:border-rui-accent'
          }
        `}
      >
        {/* Calendar icon */}
        <div
          className={`
            w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
            transition-colors duration-rui-sm
            ${startDate && endDate ? 'bg-rui-accent text-rui-white' : 'bg-rui-grey-5 text-rui-grey-50'}
          `}
        >
          <Calendar className="w-5 h-5" />
        </div>

        {/* Date range display */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-display font-semibold ${startDate ? 'text-rui-black' : 'text-rui-grey-20'}`}>
              {formatDisplayDate(startDate)}
            </span>
            <span className="text-rui-grey-20">→</span>
            <span className={`font-display font-semibold ${endDate ? 'text-rui-black' : 'text-rui-grey-20'}`}>
              {formatDisplayDate(endDate)}
            </span>
          </div>

          {/* Nights indicator */}
          {nights > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <Moon className="w-3.5 h-3.5 text-rui-accent" />
              <span className="text-body-3 text-rui-accent font-semibold">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </div>
          )}
        </div>

        {/* Clear button */}
        {(startDate || endDate) && onClear && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="w-8 h-8 rounded-full bg-rui-grey-10 hover:bg-rui-grey-20 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Clear dates"
          >
            <X className="w-4 h-4 text-rui-grey-50" />
          </button>
        )}
      </button>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-body-3 text-danger"
        >
          {error}
        </motion.p>
      )}

      {/* Calendar - Desktop dropdown */}
      <AnimatePresence>
        {isOpen && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-50 mt-2 w-full rounded-rui-24 bg-rui-white border border-rui-grey-10 shadow-rui-4 overflow-hidden"
          >
            <CalendarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar - Mobile bottom sheet */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-rui-white rounded-t-rui-24 max-h-[90vh] overflow-auto"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-rui-grey-20" />
              </div>

              {/* Close button */}
              <div className="flex justify-between items-center px-5 pb-2">
                <h2 className="font-display font-semibold text-rui-black">Select dates</h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-rui-grey-5 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-rui-grey-50" />
                </button>
              </div>

              <CalendarContent />

              {/* Confirm button for mobile */}
              {startDate && endDate && (
                <div className="p-4 border-t border-rui-grey-10">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-4 rounded-rui-16 bg-rui-accent text-rui-white font-display font-semibold"
                  >
                    Confirm ({nights} {nights === 1 ? 'night' : 'nights'})
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
