/**
 * BrowseTabs
 *
 * Premium editorial-style tab navigation.
 * Design: Refined luxury travel magazine aesthetic
 * - Clean, sophisticated typography
 * - Elegant sliding indicator
 * - Subtle micro-interactions
 * - No visual noise
 */

import { motion } from 'framer-motion';
import { Compass, UtensilsCrossed, Bed } from 'lucide-react';
import type { BrowseTabId } from '../../../types/planning';

interface BrowseTabsProps {
  activeTab: BrowseTabId;
  onTabChange: (tab: BrowseTabId) => void;
  counts?: {
    activities: number;
    restaurants: number;
    hotels: number;
  };
}

// Tab configuration - refined, cohesive palette
const tabs: {
  id: BrowseTabId;
  label: string;
  icon: React.ElementType;
  accentColor: string;
}[] = [
  {
    id: 'activities',
    label: 'Activities',
    icon: Compass,
    accentColor: '#9A6B4C', // Warm bronze
  },
  {
    id: 'restaurants',
    label: 'Restaurants',
    icon: UtensilsCrossed,
    accentColor: '#9A6B4C', // Consistent warm bronze
  },
  {
    id: 'hotels',
    label: 'Hotel',
    icon: Bed,
    accentColor: '#9A6B4C', // Consistent warm bronze
  },
];

export function BrowseTabs({ activeTab, onTabChange }: BrowseTabsProps) {
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className="relative px-6">
      {/* Clean container */}
      <div
        className="
          relative flex items-stretch
          bg-[#F9F6F2]
          rounded-2xl
          p-1.5
        "
      >
        {/* Sliding background indicator */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-sm"
          initial={false}
          animate={{
            left: `calc(${activeIndex * 33.333}% + 6px)`,
            width: 'calc(33.333% - 12px)',
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 35,
          }}
          style={{
            boxShadow: '0 1px 3px rgba(44, 36, 23, 0.08)',
          }}
        />

        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex-1 py-3.5 px-4
                flex items-center justify-center gap-2.5
                font-['Satoshi',system-ui,sans-serif]
                transition-colors duration-200
                rounded-xl
                z-10
              `}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon */}
              <Icon
                className={`
                  w-[18px] h-[18px] transition-colors duration-200
                  ${isActive ? 'text-[#9A6B4C]' : 'text-[#A89F94]'}
                `}
                strokeWidth={isActive ? 2.25 : 1.75}
              />

              {/* Label */}
              <span
                className={`
                  text-[13px] font-semibold tracking-wide
                  transition-colors duration-200
                  ${isActive ? 'text-[#2C2417]' : 'text-[#A89F94]'}
                `}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Subtle bottom accent line */}
      <div className="mt-4 mx-2">
        <div className="h-px bg-gradient-to-r from-transparent via-[#E5DDD0] to-transparent" />
      </div>
    </div>
  );
}

export default BrowseTabs;
