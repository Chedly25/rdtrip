/**
 * CravingResultCard Component
 *
 * WI-7.4: Individual result card for Craving Mode
 *
 * Design Philosophy:
 * - Compact but informative - quick scanning
 * - Distance is prominent - "how far is it?"
 * - Action-oriented - easy to select
 * - Continues the editorial/intimate aesthetic
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Star,
  Navigation,
  Utensils,
  Coffee,
  Wine,
  Camera,
  Mountain,
  Compass,
  ArrowRight,
  Clock,
} from 'lucide-react';

import type { EnrichedActivity } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface CravingResultCardProps {
  /** The enriched activity */
  activity: EnrichedActivity;
  /** Card index for stagger animations */
  index: number;
  /** Called when user selects this activity */
  onSelect: (activityId: string) => void;
  /** Whether it's night mode */
  isNightMode?: boolean;
}

// ============================================================================
// Activity Type Config
// ============================================================================

const getActivityIcon = (type: string) => {
  const icons: Record<string, typeof MapPin> = {
    restaurant: Utensils,
    cafe: Coffee,
    bar: Wine,
    nightlife: Wine,
    scenic: Mountain,
    activity: Camera,
    default: Compass,
  };
  return icons[type] || icons.default;
};

const getActivityColor = (type: string, isNight: boolean) => {
  const colors: Record<string, { day: string; night: string }> = {
    restaurant: { day: '#C45830', night: '#D4A574' },
    cafe: { day: '#8B7355', night: '#D4A574' },
    bar: { day: '#A855F7', night: '#C084FC' },
    nightlife: { day: '#A855F7', night: '#C084FC' },
    scenic: { day: '#6B8E7B', night: '#8BA898' },
    activity: { day: '#D4A853', night: '#E8C972' },
    default: { day: '#C45830', night: '#D4A574' },
  };
  const c = colors[type] || colors.default;
  return isNight ? c.night : c.day;
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
        hoverBg: '#1F1F23',
      },
      text: {
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        muted: '#71717A',
      },
      accent: '#D4A574',
    };
  }

  return {
    card: {
      bg: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.06)',
      hoverBg: '#F9F8F6',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#525252',
      muted: '#737373',
    },
    accent: '#C45830',
  };
};

// ============================================================================
// Component
// ============================================================================

export const CravingResultCard = memo(function CravingResultCard({
  activity,
  index,
  onSelect,
  isNightMode = false,
}: CravingResultCardProps) {
  const theme = getTheme(isNightMode);
  const place = activity.activity.place;
  const type = place.types?.[0] || place.category || 'activity';
  const Icon = getActivityIcon(type);
  const accentColor = getActivityColor(type, isNightMode);

  return (
    <motion.button
      onClick={() => onSelect(activity.activity.id)}
      className="w-full text-left"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        delay: index * 0.08,
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <motion.div
        className="flex items-center gap-4 p-4 rounded-2xl"
        style={{
          background: theme.card.bg,
          border: `1px solid ${theme.card.border}`,
        }}
        whileHover={{
          background: theme.card.hoverBg,
          x: 4,
          transition: { duration: 0.2 },
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icon / Photo */}
        <div className="relative flex-shrink-0">
          {place.photoUrl ? (
            <div
              className="w-14 h-14 rounded-xl overflow-hidden"
              style={{ border: `1px solid ${theme.card.border}` }}
            >
              <img
                src={place.photoUrl}
                alt={place.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                background: isNightMode
                  ? `${accentColor}15`
                  : `${accentColor}10`,
                border: `1px solid ${accentColor}25`,
              }}
            >
              <Icon size={22} color={accentColor} strokeWidth={1.5} />
            </div>
          )}

          {/* Distance badge - overlaid */}
          {activity.distanceFormatted && (
            <motion.div
              className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md flex items-center gap-1"
              style={{
                background: accentColor,
                boxShadow: `0 2px 8px ${accentColor}40`,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.08 + 0.2, type: 'spring' }}
            >
              <Navigation size={8} color="#FFFFFF" />
              <span
                className="text-[10px] font-bold"
                style={{
                  color: '#FFFFFF',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {activity.distanceFormatted}
              </span>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-base font-semibold truncate mb-0.5"
            style={{
              color: theme.text.primary,
              fontFamily: "'Fraunces', Georgia, serif",
            }}
          >
            {place.name}
          </h4>

          {/* Meta row */}
          <div className="flex items-center gap-3">
            {/* Rating */}
            {place.rating && (
              <div className="flex items-center gap-1">
                <Star size={11} fill={theme.accent} color={theme.accent} />
                <span
                  className="text-xs font-medium"
                  style={{
                    color: theme.text.secondary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {place.rating.toFixed(1)}
                </span>
              </div>
            )}

            {/* Walking time */}
            {activity.walkingTimeMinutes && (
              <div className="flex items-center gap-1">
                <Clock size={10} color={theme.text.muted} />
                <span
                  className="text-xs"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {activity.walkingTimeMinutes} min walk
                </span>
              </div>
            )}

            {/* Address snippet */}
            {place.address && (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <MapPin size={10} color={theme.text.muted} className="flex-shrink-0" />
                <span
                  className="text-xs truncate"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {place.address.split(',')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Why Now reason if compelling */}
          {activity.score.whyNow.primary.text && activity.score.score > 0.6 && (
            <p
              className="text-xs mt-1.5 line-clamp-1"
              style={{
                color: theme.accent,
                fontFamily: "'DM Sans', sans-serif",
                fontStyle: 'italic',
              }}
            >
              {activity.score.whyNow.primary.text}
            </p>
          )}
        </div>

        {/* Arrow */}
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0.5 }}
          whileHover={{ opacity: 1, x: 2 }}
        >
          <ArrowRight size={18} color={theme.text.muted} />
        </motion.div>
      </motion.div>
    </motion.button>
  );
});

export default CravingResultCard;
