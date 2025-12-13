/**
 * FilterBar
 *
 * Price filter buttons + sort dropdown for suggestions.
 * Features: toggleable price levels (€ to €€€€), sort options.
 *
 * Design: Compact horizontal bar with pill buttons
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Star, TrendingDown } from 'lucide-react';

export interface FilterBarProps {
  priceFilter: number[] | null;
  sortBy: 'proximity' | 'rating' | 'price';
  onPriceChange: (levels: number[] | null) => void;
  onSortChange: (sort: 'proximity' | 'rating' | 'price') => void;
}

const sortOptions = [
  { value: 'proximity' as const, label: 'Nearby first', icon: MapPin },
  { value: 'rating' as const, label: 'Highest rated', icon: Star },
  { value: 'price' as const, label: 'Price: low to high', icon: TrendingDown },
];

export function FilterBar({
  priceFilter,
  sortBy,
  onPriceChange,
  onSortChange,
}: FilterBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle a price level
  const togglePrice = (level: number) => {
    if (!priceFilter) {
      // No filter active - start with just this level
      onPriceChange([level]);
    } else if (priceFilter.includes(level)) {
      // Level is active - remove it
      const newFilter = priceFilter.filter((l) => l !== level);
      onPriceChange(newFilter.length > 0 ? newFilter : null);
    } else {
      // Level not active - add it
      onPriceChange([...priceFilter, level].sort());
    }
  };

  // Check if a price level is active
  const isPriceActive = (level: number) => {
    return priceFilter?.includes(level) ?? false;
  };

  // Check if "All" should appear selected (no filter)
  const isAllActive = priceFilter === null;

  const currentSort = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      {/* Price filter buttons */}
      <div className="flex items-center gap-1.5">
        {/* All button */}
        <button
          onClick={() => onPriceChange(null)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-['Satoshi',sans-serif] font-medium
            transition-all duration-200
            ${isAllActive
              ? 'bg-[#C45830] text-white shadow-sm'
              : 'bg-[#FAF7F2] text-[#8B7355] hover:bg-[#F5F0E8] border border-[#E5DDD0]'
            }
          `}
        >
          All
        </button>

        {/* Price level buttons */}
        {[1, 2, 3, 4].map((level) => (
          <button
            key={level}
            onClick={() => togglePrice(level)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-['Satoshi',sans-serif] font-medium
              transition-all duration-200
              ${isPriceActive(level)
                ? 'bg-[#C45830] text-white shadow-sm'
                : 'bg-[#FAF7F2] text-[#8B7355] hover:bg-[#F5F0E8] border border-[#E5DDD0]'
              }
            `}
          >
            {'€'.repeat(level)}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-[#E5DDD0]" />

      {/* Sort dropdown */}
      <div ref={sortRef} className="relative">
        <button
          onClick={() => setSortOpen(!sortOpen)}
          className="
            flex items-center gap-2 px-3 py-1.5
            bg-[#FAF7F2] border border-[#E5DDD0] rounded-lg
            text-xs font-['Satoshi',sans-serif] font-medium text-[#8B7355]
            hover:bg-[#F5F0E8] hover:border-[#C4B8A5]
            transition-all duration-200
          "
        >
          <currentSort.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{currentSort.label}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {sortOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setSortOpen(false)}
              />

              {/* Dropdown menu */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="
                  absolute right-0 top-full mt-1.5 z-20
                  w-48 py-1
                  bg-[#FFFBF5] border border-[#E5DDD0] rounded-xl
                  shadow-lg shadow-[#2C2417]/10
                "
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setSortOpen(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-left text-sm
                      font-['Satoshi',sans-serif]
                      flex items-center gap-2
                      transition-colors duration-150
                      ${sortBy === option.value
                        ? 'bg-[#FEF3EE] text-[#C45830]'
                        : 'text-[#2C2417] hover:bg-[#FAF7F2]'
                      }
                    `}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                    {sortBy === option.value && (
                      <motion.div
                        layoutId="sort-indicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C45830]"
                      />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FilterBar;
