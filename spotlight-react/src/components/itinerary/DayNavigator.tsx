import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface DayNavigatorProps {
  days: any[];
  activeDay: number;
  onDayClick: (dayNumber: number) => void;
}

export function DayNavigator({ days, activeDay, onDayClick }: DayNavigatorProps) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const scrollToDay = (dayNumber: number) => {
    const element = document.getElementById(`day-${dayNumber}`);
    if (element) {
      const offset = 100; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
    onDayClick(dayNumber);
  };

  return (
    <div
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isSticky
          ? 'bg-white/95 backdrop-blur-lg shadow-md'
          : 'bg-white border-b border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap mr-2">
            Days:
          </span>
          {days.map((day) => (
            <motion.button
              key={day.day}
              onClick={() => scrollToDay(day.day)}
              className={`
                relative flex flex-col items-center px-4 py-2 rounded-lg
                transition-all duration-200 whitespace-nowrap
                ${activeDay === day.day
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xs font-medium">Day {day.day}</span>
              <span className="text-[10px] opacity-80">{formatShortDate(day.date)}</span>

              {/* Active indicator dot */}
              {activeDay === day.day && (
                <motion.div
                  layoutId="activeDay"
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
