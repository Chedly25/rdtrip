/**
 * Day Theme Header
 *
 * Replaces generic "Day 1" headers with contextual themed titles
 * that reflect the character of each day based on activities and
 * user personalization.
 *
 * Design: Warm editorial with a bold day number, themed title,
 * and subtle icon. Uses the terracotta/gold accent palette.
 */

import { motion } from 'framer-motion';
import {
  Heart,
  Palette,
  Mountain,
  Wine,
  Sun,
  Utensils,
  Landmark,
  Compass,
  Camera,
  Users,
  Sparkles,
  Plane,
  TreePine,
  Coffee,
  Moon,
  Music,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import type { DayTheme } from '../../../stores/spotlightStoreV2';

interface DayThemeHeaderProps {
  dayNumber: number;
  city: string;
  theme?: DayTheme;
  variant?: 'default' | 'compact' | 'large';
  className?: string;
}

// Map icon names to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  heart: Heart,
  palette: Palette,
  mountain: Mountain,
  wine: Wine,
  sun: Sun,
  utensils: Utensils,
  landmark: Landmark,
  compass: Compass,
  camera: Camera,
  users: Users,
  sparkles: Sparkles,
  'plane-arrival': Plane,
  'tree-pine': TreePine,
  coffee: Coffee,
  moon: Moon,
  music: Music,
  'shopping-bag': ShoppingBag,
  party: Sparkles,
  cake: Sparkles,
  champagne: Wine,
  star: Sparkles,
  user: Users,
};

// Default icons based on common themes
function getDefaultIcon(theme?: string): LucideIcon {
  if (!theme) return Compass;

  const themeLower = theme.toLowerCase();

  if (themeLower.includes('romantic') || themeLower.includes('love') || themeLower.includes('honeymoon')) {
    return Heart;
  }
  if (themeLower.includes('art') || themeLower.includes('culture') || themeLower.includes('museum')) {
    return Palette;
  }
  if (themeLower.includes('nature') || themeLower.includes('outdoor') || themeLower.includes('hike')) {
    return Mountain;
  }
  if (themeLower.includes('wine') || themeLower.includes('vineyard')) {
    return Wine;
  }
  if (themeLower.includes('food') || themeLower.includes('culinary') || themeLower.includes('tasting')) {
    return Utensils;
  }
  if (themeLower.includes('historic') || themeLower.includes('heritage') || themeLower.includes('ancient')) {
    return Landmark;
  }
  if (themeLower.includes('photo') || themeLower.includes('scenic')) {
    return Camera;
  }
  if (themeLower.includes('arrival') || themeLower.includes('begin')) {
    return Plane;
  }
  if (themeLower.includes('farewell') || themeLower.includes('departure') || themeLower.includes('last')) {
    return Heart;
  }
  if (themeLower.includes('coastal') || themeLower.includes('beach') || themeLower.includes('sun')) {
    return Sun;
  }
  if (themeLower.includes('nightlife') || themeLower.includes('evening')) {
    return Moon;
  }
  if (themeLower.includes('shopping')) {
    return ShoppingBag;
  }
  if (themeLower.includes('family') || themeLower.includes('squad') || themeLower.includes('crew')) {
    return Users;
  }

  return Compass;
}

export function DayThemeHeader({
  dayNumber,
  city,
  theme,
  variant = 'default',
  className = '',
}: DayThemeHeaderProps) {
  // Get the icon component
  const IconComponent = theme?.icon
    ? ICON_MAP[theme.icon] || getDefaultIcon(theme.theme)
    : getDefaultIcon(theme?.theme);

  const themeTitle = theme?.theme || `Exploring ${city}`;
  const subtitle = theme?.subtitle;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-3 ${className}`}
      >
        {/* Day number badge */}
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
          }}
        >
          <span
            className="text-sm font-bold text-white"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            {dayNumber}
          </span>
        </div>

        {/* Theme text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#8B7355]">
              Day {dayNumber} · {city}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconComponent className="h-3 w-3 flex-shrink-0" style={{ color: '#C45830' }} />
            <span
              className="truncate text-sm font-semibold"
              style={{
                color: '#2C2417',
                fontFamily: "'Fraunces', Georgia, serif",
              }}
            >
              {themeTitle}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'large') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl p-6 ${className}`}
        style={{
          background: 'linear-gradient(135deg, #FFFBF5 0%, #FEF7ED 50%, #FAF3E8 100%)',
          border: '1px solid rgba(196, 88, 48, 0.15)',
        }}
      >
        {/* Decorative background icon */}
        <div
          className="pointer-events-none absolute -right-4 -top-4 opacity-[0.06]"
          style={{ transform: 'rotate(15deg)' }}
        >
          <IconComponent className="h-32 w-32" style={{ color: '#C45830' }} />
        </div>

        {/* Content */}
        <div className="relative">
          {/* Day badge and city */}
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                boxShadow: '0 4px 12px rgba(196, 88, 48, 0.25)',
              }}
            >
              <span
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                {dayNumber}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-[#8B7355]">Day {dayNumber}</span>
              <p
                className="text-lg font-semibold"
                style={{
                  color: '#2C2417',
                  fontFamily: "'Satoshi', sans-serif",
                }}
              >
                {city}
              </p>
            </div>
          </div>

          {/* Theme title */}
          <div className="flex items-start gap-3">
            <div
              className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(196, 88, 48, 0.1)' }}
            >
              <IconComponent className="h-4 w-4" style={{ color: '#C45830' }} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold leading-tight"
                style={{
                  color: '#2C2417',
                  fontFamily: "'Fraunces', Georgia, serif",
                  letterSpacing: '-0.01em',
                }}
              >
                {themeTitle}
              </h2>
              {subtitle && (
                <p
                  className="mt-1 text-sm"
                  style={{
                    color: '#8B7355',
                    fontFamily: "'Satoshi', sans-serif",
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-4 ${className}`}
    >
      {/* Day number circle */}
      <div
        className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
          boxShadow: '0 4px 12px rgba(196, 88, 48, 0.2)',
        }}
      >
        <span
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          {dayNumber}
        </span>
        {/* Small icon overlay */}
        <div
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white"
          style={{ background: '#FFFBF5' }}
        >
          <IconComponent className="h-3 w-3" style={{ color: '#C45830' }} />
        </div>
      </div>

      {/* Text content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[#8B7355]">{city}</span>
          {theme?.date && (
            <>
              <span className="text-[#D4C4B0]">·</span>
              <span className="text-[#8B7355]">{theme.date}</span>
            </>
          )}
        </div>
        <h3
          className="text-xl font-bold leading-tight"
          style={{
            color: '#2C2417',
            fontFamily: "'Fraunces', Georgia, serif",
            letterSpacing: '-0.01em',
          }}
        >
          {themeTitle}
        </h3>
        {subtitle && (
          <p
            className="mt-0.5 text-sm"
            style={{
              color: '#8B7355',
              fontFamily: "'Satoshi', sans-serif",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default DayThemeHeader;
