/**
 * RestMode Component
 *
 * WI-7.6: "I'm tired" quick access to rest spots
 *
 * Design Philosophy:
 * - CALMING - the interface itself should feel restful
 * - Soft sage greens, warm neutrals, gentle motion
 * - Priority on comfort, not discovery
 * - Distance is king (how far to walk)
 * - The experience should be a visual exhale
 *
 * Features:
 * - Quick filter chips for rest types
 * - Nearby rest spots sorted by distance
 * - Breathing animation for extra calm
 * - Soft, nature-inspired color palette
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  TreePine,
  Flower2,
  ArrowLeft,
  Heart,
} from 'lucide-react';

import { RestSpotCard } from './RestSpotCard';
import type { EnrichedActivity } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface RestModeProps {
  /** Rest spots to display */
  restSpots: EnrichedActivity[];
  /** Called when a rest spot is selected */
  onSelect: (activityId: string) => void;
  /** Go back to choice mode */
  onBack?: () => void;
  /** Whether loading */
  isLoading?: boolean;
  /** Current filter */
  activeFilter?: RestFilter;
  /** Set filter */
  onFilterChange?: (filter: RestFilter) => void;
}

export type RestFilter = 'all' | 'cafe' | 'nature' | 'quiet';

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      bg: '#0F140F',
      bgGradient: 'linear-gradient(180deg, #0F140F 0%, #141A14 50%, #0F140F 100%)',
      card: {
        bg: '#1A201A',
        border: 'rgba(156, 175, 136, 0.1)',
      },
      text: {
        primary: '#E8F0E8',
        secondary: '#A8B8A8',
        muted: '#6B7B6B',
      },
      accent: '#9CAF88',
      accentMuted: 'rgba(156, 175, 136, 0.15)',
    };
  }

  return {
    bg: '#F5F8F5',
    bgGradient: 'linear-gradient(180deg, #F5F8F5 0%, #EDF2ED 50%, #F5F8F5 100%)',
    card: {
      bg: '#FFFFFF',
      border: 'rgba(107, 142, 107, 0.1)',
    },
    text: {
      primary: '#2D3B2D',
      secondary: '#5A6B5A',
      muted: '#8A9B8A',
    },
    accent: '#6B8E6B',
    accentMuted: 'rgba(107, 142, 107, 0.1)',
  };
};

// ============================================================================
// Filter Config
// ============================================================================

const FILTER_CONFIG: Record<RestFilter, {
  label: string;
  icon: typeof Coffee;
  keywords: string[];
}> = {
  all: {
    label: 'All spots',
    icon: Heart,
    keywords: [],
  },
  cafe: {
    label: 'Cafés',
    icon: Coffee,
    keywords: ['café', 'cafe', 'coffee', 'tea', 'bakery', 'patisserie'],
  },
  nature: {
    label: 'Parks',
    icon: TreePine,
    keywords: ['park', 'garden', 'jardin', 'square', 'plaza', 'nature'],
  },
  quiet: {
    label: 'Quiet',
    icon: Flower2,
    keywords: ['quiet', 'peaceful', 'zen', 'wellness', 'spa', 'lounge'],
  },
};

// ============================================================================
// Breathing Animation Component
// ============================================================================

const BreathingCircle = ({ isNightMode }: { isNightMode: boolean }) => {
  const theme = getTheme(isNightMode);

  return (
    <div className="relative w-20 h-20 mx-auto">
      {/* Outer pulse */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${theme.accent}20 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner circle */}
      <motion.div
        className="absolute inset-4 rounded-full flex items-center justify-center"
        style={{
          background: theme.accentMuted,
          border: `1px solid ${theme.accent}30`,
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Heart size={16} color={theme.accent} />
      </motion.div>
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

export function RestMode({
  restSpots,
  onSelect,
  onBack,
  isLoading = false,
  activeFilter = 'all',
  onFilterChange,
}: RestModeProps) {
  // Time-aware theming
  const [currentHour] = useState(() => new Date().getHours());
  const isNightMode = currentHour >= 20 || currentHour < 6;
  const theme = getTheme(isNightMode);

  // Internal filter state if not controlled
  const [internalFilter, setInternalFilter] = useState<RestFilter>('all');
  const filter = onFilterChange ? activeFilter : internalFilter;
  const setFilter = onFilterChange || setInternalFilter;

  // Filter rest spots
  const filteredSpots = useMemo(() => {
    if (filter === 'all') return restSpots;

    const keywords = FILTER_CONFIG[filter].keywords;
    return restSpots.filter((spot) => {
      const text = [
        spot.activity.place.name,
        spot.activity.place.description,
        spot.activity.place.category,
        ...(spot.activity.place.types || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return keywords.some((kw) => text.includes(kw));
    });
  }, [restSpots, filter]);

  return (
    <motion.div
      className="min-h-full flex flex-col"
      style={{ background: theme.bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* ============ Header ============ */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <motion.button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl"
              style={{
                background: theme.card.bg,
                border: `1px solid ${theme.card.border}`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={18} color={theme.text.secondary} />
            </motion.button>
          )}

          <div>
            <h1
              className="text-xl"
              style={{
                color: theme.text.primary,
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 600,
              }}
            >
              Take a break
            </h1>
            <p
              className="text-sm"
              style={{
                color: theme.text.secondary,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Nearby places to rest and recharge
            </p>
          </div>
        </div>
      </div>

      {/* ============ Filter Chips ============ */}
      <div className="px-5 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
          {(Object.keys(FILTER_CONFIG) as RestFilter[]).map((filterKey, i) => {
            const config = FILTER_CONFIG[filterKey];
            const Icon = config.icon;
            const isActive = filter === filterKey;

            return (
              <motion.button
                key={filterKey}
                onClick={() => setFilter(filterKey)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap"
                style={{
                  background: isActive ? theme.accent : theme.card.bg,
                  border: `1px solid ${isActive ? theme.accent : theme.card.border}`,
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon
                  size={14}
                  color={isActive ? (isNightMode ? '#0F140F' : '#FFFFFF') : theme.text.muted}
                />
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isActive ? (isNightMode ? '#0F140F' : '#FFFFFF') : theme.text.secondary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {config.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ============ Main Content ============ */}
      <div className="flex-1 px-5 pb-10">
        <AnimatePresence mode="wait">
          {isLoading ? (
            // Loading state with breathing circle
            <motion.div
              key="loading"
              className="flex flex-col items-center justify-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BreathingCircle isNightMode={isNightMode} />
              <motion.p
                className="mt-6 text-base"
                style={{
                  color: theme.text.secondary,
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontStyle: 'italic',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Finding peaceful spots nearby...
              </motion.p>
            </motion.div>
          ) : filteredSpots.length === 0 ? (
            // Empty state
            <motion.div
              key="empty"
              className="flex flex-col items-center justify-center py-16 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: theme.accentMuted }}
              >
                <TreePine size={28} color={theme.accent} />
              </div>
              <h3
                className="text-lg mb-2"
                style={{
                  color: theme.text.primary,
                  fontFamily: "'Fraunces', Georgia, serif",
                }}
              >
                No rest spots nearby
              </h3>
              <p
                className="text-sm max-w-xs"
                style={{
                  color: theme.text.muted,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {filter !== 'all'
                  ? 'Try removing the filter to see more options'
                  : "We couldn't find rest spots in your current area"}
              </p>
              {filter !== 'all' && (
                <motion.button
                  onClick={() => setFilter('all')}
                  className="mt-4 px-4 py-2 rounded-full"
                  style={{
                    background: theme.accentMuted,
                    color: theme.accent,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Show all spots
                </motion.button>
              )}
            </motion.div>
          ) : (
            // Rest spots list
            <motion.div
              key="list"
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Count indicator */}
              <motion.p
                className="text-xs mb-4"
                style={{
                  color: theme.text.muted,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {filteredSpots.length} peaceful {filteredSpots.length === 1 ? 'spot' : 'spots'} nearby
              </motion.p>

              {filteredSpots.map((spot, index) => (
                <RestSpotCard
                  key={spot.activity.id}
                  activity={spot}
                  index={index}
                  onSelect={onSelect}
                  isNightMode={isNightMode}
                />
              ))}

              {/* Calming message at bottom */}
              <motion.div
                className="pt-6 pb-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: filteredSpots.length * 0.1 + 0.3 }}
              >
                <p
                  className="text-sm"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontStyle: 'italic',
                  }}
                >
                  Rest is part of the journey
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default RestMode;
