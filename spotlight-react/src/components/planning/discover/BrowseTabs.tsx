/**
 * BrowseTabs
 *
 * Editorial-style tab navigation for the browse panel.
 * Design: Travel journal chapter tabs - elegant underlines, icon animations,
 * each tab with its own personality while maintaining cohesion.
 *
 * Aesthetic: Kinfolk meets Condé Nast Traveler
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

// Tab configuration with distinct personalities
const tabs: {
  id: BrowseTabId;
  label: string;
  icon: React.ElementType;
  accentColor: string;
  hoverBg: string;
  description: string;
}[] = [
  {
    id: 'activities',
    label: 'Activities',
    icon: Compass,
    accentColor: '#C45830', // Warm terracotta - adventure, discovery
    hoverBg: 'rgba(196, 88, 48, 0.06)',
    description: 'Explore & discover',
  },
  {
    id: 'restaurants',
    label: 'Restaurants',
    icon: UtensilsCrossed,
    accentColor: '#8B4A5E', // Deep burgundy - culinary warmth
    hoverBg: 'rgba(139, 74, 94, 0.06)',
    description: 'Dine & taste',
  },
  {
    id: 'hotels',
    label: 'Hotel',
    icon: Bed,
    accentColor: '#5C6B7A', // Slate blue - refined sanctuary
    hoverBg: 'rgba(92, 107, 122, 0.06)',
    description: 'Rest & recharge',
  },
];

export function BrowseTabs({ activeTab, onTabChange, counts }: BrowseTabsProps) {
  return (
    <div className="relative">
      {/* Tab container with subtle paper texture */}
      <div
        className="
          flex items-stretch
          bg-gradient-to-b from-[#FFFBF5] to-[#FAF7F2]
          border-b border-[#E5DDD0]
          rounded-t-2xl
          overflow-hidden
        "
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundBlendMode: 'soft-light',
          backgroundSize: '150px',
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const count = counts?.[tab.id] ?? 0;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex-1 py-4 px-3
                flex flex-col items-center gap-1.5
                font-['Satoshi',system-ui,sans-serif]
                transition-all duration-300 ease-out
                group
                ${isActive ? '' : 'hover:bg-[#FAF7F2]/80'}
              `}
              style={{
                backgroundColor: isActive ? tab.hoverBg : 'transparent',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon with animation */}
              <motion.div
                className="relative"
                animate={{
                  y: isActive ? 0 : 0,
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon
                  className={`
                    w-5 h-5 transition-colors duration-300
                    ${isActive ? '' : 'text-[#8B7355] group-hover:text-[#2C2417]'}
                  `}
                  style={{ color: isActive ? tab.accentColor : undefined }}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                {/* Subtle glow behind icon when active */}
                {isActive && (
                  <motion.div
                    layoutId="tab-glow"
                    className="absolute inset-0 -m-2 rounded-full blur-md opacity-30"
                    style={{ backgroundColor: tab.accentColor }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.5 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <span
                className={`
                  text-sm font-semibold tracking-wide
                  transition-colors duration-300
                  ${isActive ? '' : 'text-[#8B7355] group-hover:text-[#2C2417]'}
                `}
                style={{ color: isActive ? tab.accentColor : undefined }}
              >
                {tab.label}
              </span>

              {/* Count badge (only show if > 0) */}
              {count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    absolute top-2 right-3
                    min-w-[18px] h-[18px] px-1
                    rounded-full text-[10px] font-bold
                    flex items-center justify-center
                    transition-all duration-300
                  `}
                  style={{
                    backgroundColor: isActive ? tab.accentColor : '#E5DDD0',
                    color: isActive ? 'white' : '#8B7355',
                  }}
                >
                  {count > 99 ? '99+' : count}
                </motion.span>
              )}

              {/* Active indicator - elegant underline */}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full"
                  style={{ backgroundColor: tab.accentColor }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Separator line between tabs (not after last) */}
              {index < tabs.length - 1 && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-[#E5DDD0]/60" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Decorative bottom shadow */}
      <div className="absolute -bottom-2 left-4 right-4 h-2 bg-gradient-to-b from-[#2C2417]/5 to-transparent rounded-b-full blur-sm" />
    </div>
  );
}

export default BrowseTabs;
