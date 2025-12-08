/**
 * RestSpotCard Component
 *
 * WI-7.6: Individual rest spot card with calming design
 *
 * Design Philosophy:
 * - SERENE - the card itself should feel restful
 * - Soft colors, rounded shapes, gentle motion
 * - Distance as the hero (how far to walk)
 * - Comfort-focused information hierarchy
 * - The interface should calm, not stimulate
 */

import { motion } from 'framer-motion';
import {
  Coffee,
  TreePine,
  Wind,
  Flower2,
  Sofa,
  Navigation,
  Star,
} from 'lucide-react';

import type { EnrichedActivity } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface RestSpotCardProps {
  /** Enriched activity data */
  activity: EnrichedActivity;
  /** Card index for stagger animation */
  index: number;
  /** Called when card is selected */
  onSelect: (activityId: string) => void;
  /** Whether night mode is active */
  isNightMode?: boolean;
}

// ============================================================================
// Rest Type Detection
// ============================================================================

type RestType = 'cafe' | 'park' | 'garden' | 'quiet' | 'lounge' | 'general';

function detectRestType(activity: EnrichedActivity): RestType {
  const text = [
    activity.activity.place.name,
    activity.activity.place.description,
    activity.activity.place.category,
    ...(activity.activity.place.types || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (text.includes('café') || text.includes('cafe') || text.includes('coffee')) {
    return 'cafe';
  }
  if (text.includes('park') || text.includes('square') || text.includes('plaza')) {
    return 'park';
  }
  if (text.includes('garden') || text.includes('jardin') || text.includes('botanical')) {
    return 'garden';
  }
  if (text.includes('quiet') || text.includes('peaceful') || text.includes('zen')) {
    return 'quiet';
  }
  if (text.includes('lounge') || text.includes('hotel') || text.includes('lobby')) {
    return 'lounge';
  }

  return 'general';
}

const REST_TYPE_CONFIG: Record<RestType, {
  icon: typeof Coffee;
  label: string;
  color: string;
  bgColor: string;
}> = {
  cafe: {
    icon: Coffee,
    label: 'Café',
    color: '#8B7355',
    bgColor: 'rgba(139, 115, 85, 0.1)',
  },
  park: {
    icon: TreePine,
    label: 'Park',
    color: '#6B8E6B',
    bgColor: 'rgba(107, 142, 107, 0.1)',
  },
  garden: {
    icon: Flower2,
    label: 'Garden',
    color: '#9CAF88',
    bgColor: 'rgba(156, 175, 136, 0.1)',
  },
  quiet: {
    icon: Wind,
    label: 'Quiet spot',
    color: '#8FA3BF',
    bgColor: 'rgba(143, 163, 191, 0.1)',
  },
  lounge: {
    icon: Sofa,
    label: 'Lounge',
    color: '#B8A090',
    bgColor: 'rgba(184, 160, 144, 0.1)',
  },
  general: {
    icon: Wind,
    label: 'Rest spot',
    color: '#9CA3AF',
    bgColor: 'rgba(156, 163, 175, 0.1)',
  },
};

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      card: {
        bg: 'linear-gradient(135deg, #1E2A1E 0%, #1A1F1A 100%)',
        border: 'rgba(156, 175, 136, 0.12)',
        shadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
      },
      text: {
        primary: '#E8F0E8',
        secondary: '#A8B8A8',
        muted: '#6B7B6B',
      },
      accent: '#9CAF88',
    };
  }

  return {
    card: {
      bg: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAF8 100%)',
      border: 'rgba(107, 142, 107, 0.15)',
      shadow: '0 4px 24px rgba(107, 142, 107, 0.08)',
    },
    text: {
      primary: '#2D3B2D',
      secondary: '#5A6B5A',
      muted: '#8A9B8A',
    },
    accent: '#6B8E6B',
  };
};

// ============================================================================
// Component
// ============================================================================

export function RestSpotCard({
  activity,
  index,
  onSelect,
  isNightMode = false,
}: RestSpotCardProps) {
  const theme = getTheme(isNightMode);
  const place = activity.activity.place;
  const restType = detectRestType(activity);
  const typeConfig = REST_TYPE_CONFIG[restType];
  const TypeIcon = typeConfig.icon;

  return (
    <motion.button
      onClick={() => onSelect(activity.activity.id)}
      className="w-full text-left rounded-2xl overflow-hidden"
      style={{
        background: theme.card.bg,
        border: `1px solid ${theme.card.border}`,
        boxShadow: theme.card.shadow,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94], // Gentle ease
      }}
      whileHover={{
        scale: 1.01,
        boxShadow: isNightMode
          ? '0 8px 32px rgba(156, 175, 136, 0.15)'
          : '0 8px 32px rgba(107, 142, 107, 0.12)',
      }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="p-5">
        {/* Header: Type badge + Distance */}
        <div className="flex items-center justify-between mb-4">
          {/* Rest type badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: typeConfig.bgColor }}
          >
            <TypeIcon size={14} color={typeConfig.color} />
            <span
              className="text-xs font-medium"
              style={{
                color: typeConfig.color,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {typeConfig.label}
            </span>
          </div>

          {/* Distance - the hero info */}
          {activity.distanceFormatted && (
            <motion.div
              className="flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Navigation size={12} color={theme.accent} />
              <span
                className="text-sm font-semibold"
                style={{
                  color: theme.accent,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {activity.distanceFormatted}
              </span>
            </motion.div>
          )}
        </div>

        {/* Name */}
        <h3
          className="text-lg mb-2"
          style={{
            color: theme.text.primary,
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          {place.name}
        </h3>

        {/* Address snippet */}
        {place.address && (
          <p
            className="text-sm mb-3 line-clamp-1"
            style={{
              color: theme.text.muted,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {place.address.split(',')[0]}
          </p>
        )}

        {/* Rating if available */}
        {place.rating && (
          <div className="flex items-center gap-1.5">
            <Star size={12} fill={theme.accent} color={theme.accent} />
            <span
              className="text-sm"
              style={{
                color: theme.text.secondary,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {place.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Gentle gradient bottom accent */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, ${typeConfig.color}40 0%, transparent 100%)`,
        }}
      />
    </motion.button>
  );
}

export default RestSpotCard;
