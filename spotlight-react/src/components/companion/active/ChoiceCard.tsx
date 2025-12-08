/**
 * ChoiceCard Component
 *
 * WI-7.3: Individual recommendation card for Choice Mode
 *
 * Design Philosophy:
 * - "Why Now" is the hero - the reason you'd choose this RIGHT NOW
 * - Editorial feel - like a magazine's curated pick
 * - Intimate tone - friend's recommendation, not algorithm output
 * - Clear but not pushy - easy to select or dismiss
 *
 * Typography: Fraunces (display) + DM Sans (body)
 * Colors: Warm terracotta/golden palette, time-aware theming
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  Clock,
  Compass,
  Navigation,
  Utensils,
  Camera,
  Mountain,
  Wine,
  Coffee,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

import type { EnrichedActivity, WhyNowCategory } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface ChoiceCardProps {
  /** The enriched activity with scores and Why Now */
  activity: EnrichedActivity;
  /** Card index for stagger animations */
  index: number;
  /** Whether this card is currently selected */
  isSelected?: boolean;
  /** Called when user selects this activity */
  onSelect: (activityId: string) => void;
  /** Called when user skips this activity */
  onSkip: (activityId: string) => void;
  /** Whether it's night time (affects theme) */
  isNightMode?: boolean;
}

// ============================================================================
// Why Now Icon Mapping
// ============================================================================

const WHY_NOW_ICONS: Record<WhyNowCategory, typeof Sparkles> = {
  distance: Navigation,
  time: Clock,
  preference: Sparkles,
  weather: Coffee, // Using coffee for weather (indoor/outdoor vibes)
  serendipity: Compass,
  timing: Clock,
  crowd: MapPin,
  scheduled: Clock,
  trending: Star,
  special: Sparkles,
};

// ============================================================================
// Activity Type Config
// ============================================================================

interface ActivityTypeConfig {
  icon: typeof MapPin;
  label: string;
  color: string;
  gradient: string;
}

const getActivityTypeConfig = (type: string, isNight: boolean): ActivityTypeConfig => {
  const configs: Record<string, ActivityTypeConfig> = {
    restaurant: {
      icon: Utensils,
      label: 'Dining',
      color: isNight ? '#D4A574' : '#C45830',
      gradient: isNight
        ? 'linear-gradient(135deg, #D4A574 0%, #E8C9A0 100%)'
        : 'linear-gradient(135deg, #C45830 0%, #D97650 100%)',
    },
    scenic: {
      icon: Mountain,
      label: 'Experience',
      color: '#6B8E7B',
      gradient: 'linear-gradient(135deg, #6B8E7B 0%, #8BA898 100%)',
    },
    activity: {
      icon: Camera,
      label: 'Discovery',
      color: '#D4A853',
      gradient: 'linear-gradient(135deg, #D4A853 0%, #E8C972 100%)',
    },
    nightlife: {
      icon: Wine,
      label: 'Nightlife',
      color: '#A855F7',
      gradient: 'linear-gradient(135deg, #A855F7 0%, #C084FC 100%)',
    },
    cafe: {
      icon: Coffee,
      label: 'Coffee',
      color: '#8B7355',
      gradient: 'linear-gradient(135deg, #8B7355 0%, #A08060 100%)',
    },
    hotel: {
      icon: MapPin,
      label: 'Rest',
      color: '#6B7280',
      gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
    },
  };

  return configs[type] || {
    icon: Compass,
    label: 'Explore',
    color: isNight ? '#D4A574' : '#C45830',
    gradient: isNight
      ? 'linear-gradient(135deg, #D4A574 0%, #E8C9A0 100%)'
      : 'linear-gradient(135deg, #C45830 0%, #D97650 100%)',
  };
};

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      card: {
        bg: '#18181B',
        border: 'rgba(255, 255, 255, 0.08)',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      text: {
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        muted: '#71717A',
      },
      accent: {
        primary: '#D4A574',
        glow: 'rgba(212, 165, 116, 0.2)',
      },
      whyNow: {
        bg: 'rgba(212, 165, 116, 0.12)',
        border: 'rgba(212, 165, 116, 0.25)',
      },
    };
  }

  return {
    card: {
      bg: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.06)',
      shadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#525252',
      muted: '#737373',
    },
    accent: {
      primary: '#C45830',
      glow: 'rgba(196, 88, 48, 0.15)',
    },
    whyNow: {
      bg: 'rgba(196, 88, 48, 0.08)',
      border: 'rgba(196, 88, 48, 0.2)',
    },
  };
};

// ============================================================================
// Component
// ============================================================================

export const ChoiceCard = memo(function ChoiceCard({
  activity,
  index,
  isSelected = false,
  onSelect,
  onSkip,
  isNightMode = false,
}: ChoiceCardProps) {
  const theme = getTheme(isNightMode);
  const typeConfig = getActivityTypeConfig(
    activity.activity.place.types?.[0] || 'activity',
    isNightMode
  );
  const Icon = typeConfig.icon;
  const WhyNowIcon = WHY_NOW_ICONS[activity.score.whyNow.primary.category] || Sparkles;

  const place = activity.activity.place;
  const photoUrl = place.photoUrl;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 40, rotateX: -5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        delay: index * 0.15,
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <motion.div
        className="relative overflow-hidden rounded-3xl"
        style={{
          background: theme.card.bg,
          border: isSelected
            ? `2px solid ${theme.accent.primary}`
            : `1px solid ${theme.card.border}`,
          boxShadow: isSelected
            ? `0 12px 40px ${theme.accent.glow}, 0 0 0 1px ${theme.accent.primary}40`
            : theme.card.shadow,
        }}
        whileHover={{
          y: -8,
          boxShadow: isNightMode
            ? '0 20px 60px rgba(0,0,0,0.5)'
            : '0 16px 48px rgba(0,0,0,0.12)',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* ============ WHY NOW - Hero Section ============ */}
        <motion.div
          className="relative px-5 pt-5 pb-4"
          style={{
            background: theme.whyNow.bg,
            borderBottom: `1px solid ${theme.whyNow.border}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.15 + 0.2 }}
        >
          {/* Icon with pulse */}
          <div className="flex items-start gap-3">
            <motion.div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: typeConfig.gradient }}
              animate={{
                boxShadow: [
                  `0 0 0 0 ${theme.accent.primary}00`,
                  `0 0 0 6px ${theme.accent.primary}20`,
                  `0 0 0 0 ${theme.accent.primary}00`,
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3 }}
            >
              <WhyNowIcon
                size={16}
                color={isNightMode ? '#0A0A0B' : '#FFFFFF'}
                strokeWidth={2}
              />
            </motion.div>

            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium mb-0.5"
                style={{
                  color: theme.accent.primary,
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '11px',
                }}
              >
                Why now
              </p>
              <p
                className="text-base leading-snug"
                style={{
                  color: theme.text.primary,
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 500,
                }}
              >
                {activity.score.whyNow.primary.text}
              </p>

              {/* Secondary reason if exists */}
              {activity.score.whyNow.secondary && (
                <p
                  className="text-sm mt-1.5"
                  style={{
                    color: theme.text.secondary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {activity.score.whyNow.secondary.text}
                </p>
              )}
            </div>
          </div>

          {/* Urgency badge if present */}
          {activity.score.whyNow.urgency && (
            <motion.div
              className="absolute top-3 right-3 px-2.5 py-1 rounded-full"
              style={{
                background: isNightMode ? 'rgba(251, 146, 60, 0.2)' : 'rgba(234, 88, 12, 0.1)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.15 + 0.4, type: 'spring' }}
            >
              <span
                className="text-xs font-semibold"
                style={{
                  color: isNightMode ? '#FB923C' : '#EA580C',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {activity.score.whyNow.urgency.text}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* ============ Photo + Title Section ============ */}
        <div className="relative h-40 overflow-hidden">
          {photoUrl ? (
            <motion.img
              src={photoUrl}
              alt={place.name}
              className="w-full h-full object-cover"
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8 }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: isNightMode
                  ? 'linear-gradient(135deg, #1F1F23 0%, #0A0A0B 100%)'
                  : `linear-gradient(135deg, ${typeConfig.color}15 0%, ${typeConfig.color}25 100%)`,
              }}
            >
              <Icon size={48} color={typeConfig.color} strokeWidth={1} />
            </div>
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: isNightMode
                ? 'linear-gradient(to top, rgba(24,24,27,1) 0%, rgba(24,24,27,0.7) 40%, transparent 80%)'
                : 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 40%, transparent 80%)',
            }}
          />

          {/* Type badge */}
          <motion.div
            className="absolute top-3 left-3 px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{
              background: isNightMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${theme.card.border}`,
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 + 0.3 }}
          >
            <Icon size={12} color={typeConfig.color} />
            <span
              className="text-xs font-medium"
              style={{
                color: theme.text.primary,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {typeConfig.label}
            </span>
          </motion.div>

          {/* Rating badge */}
          {place.rating && (
            <motion.div
              className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full flex items-center gap-1.5"
              style={{
                background: isNightMode ? 'rgba(212,165,116,0.2)' : 'rgba(196,88,48,0.1)',
                border: `1px solid ${theme.accent.primary}30`,
              }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 + 0.35 }}
            >
              <Star size={11} fill={theme.accent.primary} color={theme.accent.primary} />
              <span
                className="text-xs font-semibold"
                style={{ color: theme.accent.primary }}
              >
                {place.rating.toFixed(1)}
              </span>
            </motion.div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-3 left-4 right-4">
            <h3
              className="text-xl line-clamp-2"
              style={{
                color: theme.text.primary,
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              {place.name}
            </h3>
          </div>
        </div>

        {/* ============ Details Section ============ */}
        <div className="px-4 pb-3 pt-1">
          {/* Location + Distance */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <MapPin size={12} color={theme.text.muted} className="flex-shrink-0" />
              <span
                className="text-xs truncate"
                style={{
                  color: theme.text.muted,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {place.address || 'Location'}
              </span>
            </div>

            {activity.distanceFormatted && (
              <div
                className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-full"
                style={{
                  background: isNightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                }}
              >
                <Navigation size={10} color={theme.accent.primary} />
                <span
                  className="text-xs font-medium"
                  style={{
                    color: theme.accent.primary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {activity.distanceFormatted}
                </span>
              </div>
            )}
          </div>

          {/* Insider tip if present */}
          {activity.score.whyNow.tip && (
            <motion.div
              className="mb-3 p-3 rounded-xl"
              style={{
                background: isNightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${theme.card.border}`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 + 0.5 }}
            >
              <p
                className="text-sm italic"
                style={{
                  color: theme.text.secondary,
                  fontFamily: "'Fraunces', Georgia, serif",
                  lineHeight: 1.5,
                }}
              >
                "{activity.score.whyNow.tip.text}"
              </p>
              {activity.score.whyNow.tip.source && (
                <p
                  className="text-xs mt-1"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {activity.score.whyNow.tip.source}
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* ============ Actions ============ */}
        <div
          className="flex items-center gap-2 px-4 pb-4"
        >
          {/* Select button */}
          <motion.button
            onClick={() => onSelect(activity.activity.id)}
            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
            style={{
              background: typeConfig.gradient,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span
              className="text-sm font-semibold"
              style={{
                color: isNightMode ? '#0A0A0B' : '#FFFFFF',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Let's go
            </span>
            <ArrowRight size={16} color={isNightMode ? '#0A0A0B' : '#FFFFFF'} />
          </motion.button>

          {/* Skip button */}
          <motion.button
            onClick={() => onSkip(activity.activity.id)}
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: isNightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${theme.card.border}`,
            }}
            whileHover={{
              background: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <X size={18} color={theme.text.muted} />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default ChoiceCard;
