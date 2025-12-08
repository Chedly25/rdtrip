/**
 * ChoiceMode Component
 *
 * WI-7.3: Choice Mode - default active companion mode showing curated recommendations
 *
 * Features:
 * - Shows top 3 recommendations based on TripBrain scoring
 * - Each with prominent "Why Now" reasoning
 * - User can select, skip, or ask for more options
 * - Refreshes based on location/time changes
 * - Time-aware theming (day/night modes)
 *
 * Design Philosophy:
 * - Editorial feel - curated picks, not a list
 * - "Why Now" is the hero - reason to act right now
 * - Easy decisions - clear actions, no overwhelm
 * - Respects their time - 3 options, not 30
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  MessageCircle,
  Clock,
  MapPin,
  Compass,
  Sun,
  Moon,
  Coffee,
  Sunset,
} from 'lucide-react';

import { ChoiceCard } from './ChoiceCard';
import type { EnrichedActivity } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface ChoiceModeProps {
  /** Top recommendations from TripBrain */
  recommendations: EnrichedActivity[];
  /** Whether recommendations are loading */
  isLoading?: boolean;
  /** Called when user selects an activity */
  onSelect: (activityId: string) => void;
  /** Called when user skips an activity */
  onSkip: (activityId: string, reason?: string) => void;
  /** Called when user wants to refresh recommendations */
  onRefresh: () => void;
  /** Called when user wants to chat instead */
  onOpenChat?: () => void;
  /** Current day number */
  dayNumber?: number;
  /** City name if known */
  cityName?: string;
  /** Whether location is being tracked */
  isTrackingLocation?: boolean;
}

// ============================================================================
// Time Period Detection
// ============================================================================

type TimePeriod = 'earlyMorning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

const getTimePeriod = (hour: number): TimePeriod => {
  if (hour >= 5 && hour < 8) return 'earlyMorning';
  if (hour >= 8 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
};

interface TimeGreeting {
  headline: string;
  subtext: string;
  icon: typeof Sun;
}

const getTimeGreeting = (hour: number): TimeGreeting => {
  const period = getTimePeriod(hour);
  const greetings: Record<TimePeriod, TimeGreeting> = {
    earlyMorning: {
      headline: 'First light',
      subtext: 'The city stirs. What calls to you?',
      icon: Coffee,
    },
    morning: {
      headline: 'Morning unfolds',
      subtext: 'A day of discoveries awaits',
      icon: Sun,
    },
    midday: {
      headline: 'Golden hours',
      subtext: 'Where does your appetite lead?',
      icon: Sun,
    },
    afternoon: {
      headline: 'Afternoon wanders',
      subtext: 'The best finds are unplanned',
      icon: Compass,
    },
    evening: {
      headline: 'Evening descends',
      subtext: 'The light softens everything',
      icon: Sunset,
    },
    night: {
      headline: 'The night is yours',
      subtext: 'Where the city reveals its secrets',
      icon: Moon,
    },
  };
  return greetings[period];
};

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      bg: '#0A0A0B',
      bgGradient: 'linear-gradient(180deg, #0A0A0B 0%, #111113 100%)',
      text: {
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        muted: '#71717A',
      },
      accent: '#D4A574',
      accentGlow: 'rgba(212, 165, 116, 0.15)',
      border: 'rgba(255, 255, 255, 0.08)',
      cardBg: '#18181B',
    };
  }

  return {
    bg: '#FAF8F5',
    bgGradient: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)',
    text: {
      primary: '#1A1A1A',
      secondary: '#525252',
      muted: '#737373',
    },
    accent: '#C45830',
    accentGlow: 'rgba(196, 88, 48, 0.1)',
    border: 'rgba(0, 0, 0, 0.06)',
    cardBg: '#FFFFFF',
  };
};

// ============================================================================
// Empty State
// ============================================================================

interface EmptyStateProps {
  isNight: boolean;
  onRefresh: () => void;
  onOpenChat?: () => void;
}

const EmptyState = ({ isNight, onRefresh, onOpenChat }: EmptyStateProps) => {
  const theme = getTheme(isNight);

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: isNight
            ? 'linear-gradient(135deg, rgba(212,165,116,0.2) 0%, rgba(212,165,116,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(196,88,48,0.15) 0%, rgba(196,88,48,0.05) 100%)',
          border: `1px solid ${theme.border}`,
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Compass size={28} color={theme.accent} />
      </motion.div>

      <h3
        className="text-xl mb-2"
        style={{
          color: theme.text.primary,
          fontFamily: "'Fraunces', Georgia, serif",
          fontWeight: 600,
        }}
      >
        No recommendations yet
      </h3>

      <p
        className="text-sm mb-6 max-w-xs"
        style={{
          color: theme.text.secondary,
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.6,
        }}
      >
        We're figuring out what's perfect for you right now. Give it a moment, or tell us what you're craving.
      </p>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={onRefresh}
          className="px-5 py-2.5 rounded-xl flex items-center gap-2"
          style={{
            background: isNight
              ? 'linear-gradient(135deg, #D4A574 0%, #E8C9A0 100%)'
              : 'linear-gradient(135deg, #C45830 0%, #D97650 100%)',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <RefreshCw size={16} color={isNight ? '#0A0A0B' : '#FFFFFF'} />
          <span
            className="text-sm font-semibold"
            style={{
              color: isNight ? '#0A0A0B' : '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Refresh
          </span>
        </motion.button>

        {onOpenChat && (
          <motion.button
            onClick={onOpenChat}
            className="px-5 py-2.5 rounded-xl flex items-center gap-2"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <MessageCircle size={16} color={theme.accent} />
            <span
              className="text-sm font-medium"
              style={{
                color: theme.text.primary,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Ask instead
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Loading State
// ============================================================================

const LoadingState = ({ isNight }: { isNight: boolean }) => {
  const theme = getTheme(isNight);

  return (
    <div className="space-y-4 py-6">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-3xl overflow-hidden"
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {/* Why Now skeleton */}
          <div
            className="px-5 py-4"
            style={{ background: theme.accentGlow }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 rounded-xl"
                style={{ background: theme.border }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="flex-1 space-y-2">
                <motion.div
                  className="h-3 w-16 rounded"
                  style={{ background: theme.border }}
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                />
                <motion.div
                  className="h-4 w-48 rounded"
                  style={{ background: theme.border }}
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
              </div>
            </div>
          </div>

          {/* Photo skeleton */}
          <motion.div
            className="h-40"
            style={{ background: theme.border }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />

          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <motion.div
              className="h-3 w-32 rounded"
              style={{ background: theme.border }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className="h-10 w-full rounded-xl"
              style={{ background: theme.border }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function ChoiceMode({
  recommendations,
  isLoading = false,
  onSelect,
  onSkip,
  onRefresh,
  onOpenChat,
  dayNumber = 1,
  cityName,
  isTrackingLocation = false,
}: ChoiceModeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Time-aware state
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  // Update hour every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isNightMode = currentHour >= 20 || currentHour < 6;
  const theme = getTheme(isNightMode);
  const greeting = getTimeGreeting(currentHour);
  const TimeIcon = greeting.icon;

  // Take top 3 recommendations
  const topRecommendations = useMemo(() => {
    return recommendations.slice(0, 3);
  }, [recommendations]);

  // Handle selection
  const handleSelect = useCallback((activityId: string) => {
    setSelectedId(activityId);
    onSelect(activityId);
  }, [onSelect]);

  // Handle skip
  const handleSkip = useCallback((activityId: string) => {
    onSkip(activityId, 'not_interested');
  }, [onSkip]);

  // Handle refresh with animation
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    onRefresh();
    // Brief delay for animation
    setTimeout(() => setIsRefreshing(false), 600);
  }, [onRefresh]);

  return (
    <motion.div
      className="min-h-full"
      style={{
        background: theme.bgGradient,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* ============ Header ============ */}
      <div className="px-5 pt-6 pb-4">
        {/* Time greeting */}
        <motion.div
          className="flex items-center gap-3 mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isNightMode
                ? 'linear-gradient(135deg, rgba(212,165,116,0.2) 0%, rgba(212,165,116,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(196,88,48,0.15) 0%, rgba(196,88,48,0.05) 100%)',
              border: `1px solid ${theme.border}`,
            }}
          >
            <TimeIcon size={20} color={theme.accent} />
          </motion.div>

          <div>
            <h1
              className="text-2xl"
              style={{
                color: theme.text.primary,
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {greeting.headline}
            </h1>
          </div>
        </motion.div>

        <motion.p
          className="text-sm mb-4"
          style={{
            color: theme.text.secondary,
            fontFamily: "'DM Sans', sans-serif",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {greeting.subtext}
        </motion.p>

        {/* Meta row: Day + Location + Refresh */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-4">
            {/* Day badge */}
            <div className="flex items-center gap-1.5">
              <Clock size={12} color={theme.text.muted} />
              <span
                className="text-xs font-medium"
                style={{
                  color: theme.text.muted,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Day {dayNumber}
              </span>
            </div>

            {/* City if known */}
            {cityName && (
              <div className="flex items-center gap-1.5">
                <MapPin size={12} color={theme.text.muted} />
                <span
                  className="text-xs font-medium"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {cityName}
                </span>
              </div>
            )}

            {/* Location status */}
            {isTrackingLocation && (
              <motion.div
                className="flex items-center gap-1"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#22C55E' }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Live
                </span>
              </motion.div>
            )}
          </div>

          {/* Refresh button */}
          <motion.button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading || isRefreshing}
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 0.6, ease: 'linear' }}
            >
              <RefreshCw
                size={16}
                color={isRefreshing ? theme.accent : theme.text.muted}
              />
            </motion.div>
          </motion.button>
        </motion.div>
      </div>

      {/* ============ Recommendations ============ */}
      <div className="px-5 pb-6">
        {isLoading ? (
          <LoadingState isNight={isNightMode} />
        ) : topRecommendations.length === 0 ? (
          <EmptyState
            isNight={isNightMode}
            onRefresh={onRefresh}
            onOpenChat={onOpenChat}
          />
        ) : (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.12,
                },
              },
            }}
          >
            <AnimatePresence mode="popLayout">
              {topRecommendations.map((activity, index) => (
                <ChoiceCard
                  key={activity.activity.id}
                  activity={activity}
                  index={index}
                  isSelected={selectedId === activity.activity.id}
                  onSelect={handleSelect}
                  onSkip={handleSkip}
                  isNightMode={isNightMode}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ============ More Options Row ============ */}
        {topRecommendations.length > 0 && (
          <motion.div
            className="mt-6 flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              onClick={handleRefresh}
              className="px-4 py-2.5 rounded-xl flex items-center gap-2"
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles size={14} color={theme.accent} />
              <span
                className="text-sm font-medium"
                style={{
                  color: theme.text.primary,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Show me others
              </span>
            </motion.button>

            {onOpenChat && (
              <motion.button
                onClick={onOpenChat}
                className="px-4 py-2.5 rounded-xl flex items-center gap-2"
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageCircle size={14} color={theme.text.muted} />
                <span
                  className="text-sm font-medium"
                  style={{
                    color: theme.text.primary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  I want something else
                </span>
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default ChoiceMode;
