/**
 * ArrivalPrompt Component
 *
 * WI-7.9: Elegant arrival detection prompt
 *
 * Design Philosophy:
 * - CELEBRATION WHISPER - warm welcome when arriving at a destination
 * - Feels like a thoughtful companion acknowledging your arrival
 * - Quick actions for check-in, skip, or snooze
 * - Beautiful glassmorphism with location-aware theming
 * - Confetti/celebration animation for fun arrivals
 *
 * Actions:
 * - "I'm here!" - Mark as visited
 * - "Skip this" - Skip the activity
 * - "Not now" - Dismiss temporarily (snooze)
 * - Navigate - Open directions
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Check,
  X,
  Clock,
  Navigation,
  Sparkles,
  Star,
  Coffee,
  UtensilsCrossed,
  Camera,
  TreePine,
  ShoppingBag,
  Music,
  Palette,
} from 'lucide-react';

import type { ArrivalEvent } from './useArrivalDetection';

// ============================================================================
// Types
// ============================================================================

export interface ArrivalPromptProps {
  /** The arrival event to display */
  arrival: ArrivalEvent;
  /** Called when user marks as visited */
  onVisited: (activityId: string) => void;
  /** Called when user skips */
  onSkip: (activityId: string) => void;
  /** Called when user dismisses (snooze) */
  onDismiss: (activityId: string) => void;
  /** Called when user wants directions */
  onNavigate?: (activityId: string) => void;
  /** Whether night mode is active */
  isNightMode?: boolean;
  /** Whether to show celebration animation */
  showCelebration?: boolean;
  /** Auto-dismiss timeout in ms (0 to disable) */
  autoDismissMs?: number;
}

export type ArrivalAction = 'visited' | 'skip' | 'dismiss' | 'navigate';

// ============================================================================
// Category Icons
// ============================================================================

const CATEGORY_ICONS: Record<string, typeof MapPin> = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  coffee: Coffee,
  food: UtensilsCrossed,
  attraction: Camera,
  landmark: Camera,
  museum: Palette,
  art: Palette,
  park: TreePine,
  nature: TreePine,
  outdoor: TreePine,
  shopping: ShoppingBag,
  entertainment: Music,
  nightlife: Music,
};

function getCategoryIcon(category: string | undefined): typeof MapPin {
  if (!category) return MapPin;
  const lowerCategory = category.toLowerCase();

  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lowerCategory.includes(key)) {
      return icon;
    }
  }

  return MapPin;
}

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      backdrop: 'rgba(0, 0, 0, 0.7)',
      card: {
        bg: 'rgba(24, 24, 27, 0.95)',
        border: 'rgba(255, 255, 255, 0.1)',
        shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },
      text: {
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        muted: '#71717A',
      },
      accent: {
        primary: '#10B981', // Emerald for arrivals
        bg: 'rgba(16, 185, 129, 0.15)',
        glow: 'rgba(16, 185, 129, 0.3)',
      },
      button: {
        primary: {
          bg: '#10B981',
          text: '#FFFFFF',
          hover: '#059669',
        },
        secondary: {
          bg: 'rgba(255, 255, 255, 0.08)',
          text: '#A1A1AA',
          hover: 'rgba(255, 255, 255, 0.12)',
        },
        muted: {
          bg: 'transparent',
          text: '#71717A',
          hover: 'rgba(255, 255, 255, 0.05)',
        },
      },
    };
  }

  return {
    backdrop: 'rgba(0, 0, 0, 0.4)',
    card: {
      bg: 'rgba(255, 255, 255, 0.98)',
      border: 'rgba(0, 0, 0, 0.08)',
      shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    text: {
      primary: '#18181B',
      secondary: '#52525B',
      muted: '#A1A1AA',
    },
    accent: {
      primary: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
      glow: 'rgba(16, 185, 129, 0.2)',
    },
    button: {
      primary: {
        bg: '#10B981',
        text: '#FFFFFF',
        hover: '#059669',
      },
      secondary: {
        bg: 'rgba(0, 0, 0, 0.05)',
        text: '#52525B',
        hover: 'rgba(0, 0, 0, 0.08)',
      },
      muted: {
        bg: 'transparent',
        text: '#A1A1AA',
        hover: 'rgba(0, 0, 0, 0.03)',
      },
    },
  };
};

// ============================================================================
// Celebration Particles
// ============================================================================

function CelebrationParticles({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 0.5,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            background: `hsl(${140 + Math.random() * 40}, 70%, 60%)`,
          }}
          initial={{ y: '100%', opacity: 0 }}
          animate={{
            y: '-200%',
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ArrivalPrompt({
  arrival,
  onVisited,
  onSkip,
  onDismiss,
  onNavigate,
  isNightMode = false,
  showCelebration = true,
  autoDismissMs = 0,
}: ArrivalPromptProps) {
  const theme = getTheme(isNightMode);
  const [isVisible, setIsVisible] = useState(true);
  const [showParticles, setShowParticles] = useState(showCelebration);

  const activity = arrival.activity;
  const place = activity.activity.place;
  const category = place?.category;
  const CategoryIcon = getCategoryIcon(category);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const timer = setTimeout(() => {
      handleAction('dismiss');
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs]);

  // Stop celebration after animation
  useEffect(() => {
    if (showParticles) {
      const timer = setTimeout(() => setShowParticles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showParticles]);

  const handleAction = useCallback(
    (action: ArrivalAction) => {
      setIsVisible(false);
      const activityId = activity.activity.id;

      // Delay callback for exit animation
      setTimeout(() => {
        switch (action) {
          case 'visited':
            onVisited(activityId);
            break;
          case 'skip':
            onSkip(activityId);
            break;
          case 'dismiss':
            onDismiss(activityId);
            break;
          case 'navigate':
            onNavigate?.(activityId);
            break;
        }
      }, 200);
    },
    [activity.activity.id, onVisited, onSkip, onDismiss, onNavigate]
  );

  // Format distance
  const distanceText =
    arrival.triggerDistance < 50
      ? 'You arrived!'
      : `${Math.round(arrival.triggerDistance)}m away`;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: theme.backdrop }}
            onClick={() => handleAction('dismiss')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: theme.card.bg,
              border: `1px solid ${theme.card.border}`,
              boxShadow: theme.card.shadow,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Celebration particles */}
            <CelebrationParticles isActive={showParticles} />

            {/* Accent glow at top */}
            <div
              className="absolute top-0 left-0 right-0 h-32 opacity-50"
              style={{
                background: `radial-gradient(ellipse at top, ${theme.accent.glow} 0%, transparent 70%)`,
              }}
            />

            {/* Content */}
            <div className="relative p-6">
              {/* Header with icon */}
              <div className="flex items-start gap-4">
                {/* Category Icon */}
                <motion.div
                  className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: theme.accent.bg }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                >
                  <CategoryIcon size={28} color={theme.accent.primary} />
                </motion.div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  {/* Arrival badge */}
                  <motion.div
                    className="flex items-center gap-1.5 mb-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Sparkles size={14} color={theme.accent.primary} />
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: theme.accent.primary,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {distanceText}
                    </span>
                  </motion.div>

                  {/* Place name */}
                  <motion.h2
                    className="text-xl font-semibold leading-tight"
                    style={{
                      color: theme.text.primary,
                      fontFamily: "'Fraunces', Georgia, serif",
                    }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {place?.name || 'Destination'}
                  </motion.h2>

                  {/* Category and rating */}
                  <motion.div
                    className="flex items-center gap-2 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    {category && (
                      <span
                        className="text-sm capitalize"
                        style={{
                          color: theme.text.secondary,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {category}
                      </span>
                    )}
                    {place?.rating && (
                      <>
                        <span style={{ color: theme.text.muted }}>·</span>
                        <div className="flex items-center gap-1">
                          <Star size={12} fill="#F59E0B" color="#F59E0B" />
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
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Dismiss button */}
                <motion.button
                  onClick={() => handleAction('dismiss')}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: theme.button.muted.bg }}
                  whileHover={{ background: theme.button.muted.hover, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={18} color={theme.text.muted} />
                </motion.button>
              </div>

              {/* Why Now reason if available */}
              {activity.score?.whyNow?.primary && (
                <motion.div
                  className="mt-4 p-3 rounded-xl"
                  style={{ background: theme.button.secondary.bg }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p
                    className="text-sm"
                    style={{
                      color: theme.text.secondary,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {activity.score.whyNow.primary.text}
                  </p>
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                className="mt-6 space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {/* Primary action - I'm here */}
                <motion.button
                  onClick={() => handleAction('visited')}
                  className="w-full py-3.5 px-6 rounded-xl flex items-center justify-center gap-2"
                  style={{
                    background: theme.button.primary.bg,
                    color: theme.button.primary.text,
                  }}
                  whileHover={{ scale: 1.02, background: theme.button.primary.hover }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check size={20} />
                  <span
                    className="font-semibold"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    I'm here!
                  </span>
                </motion.button>

                {/* Secondary actions row */}
                <div className="flex gap-3">
                  {/* Navigate */}
                  {onNavigate && place?.coordinates && (
                    <motion.button
                      onClick={() => handleAction('navigate')}
                      className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                      style={{
                        background: theme.button.secondary.bg,
                        color: theme.button.secondary.text,
                      }}
                      whileHover={{ scale: 1.02, background: theme.button.secondary.hover }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Navigation size={18} />
                      <span
                        className="font-medium text-sm"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Navigate
                      </span>
                    </motion.button>
                  )}

                  {/* Skip */}
                  <motion.button
                    onClick={() => handleAction('skip')}
                    className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                    style={{
                      background: theme.button.secondary.bg,
                      color: theme.button.secondary.text,
                    }}
                    whileHover={{ scale: 1.02, background: theme.button.secondary.hover }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X size={18} />
                    <span
                      className="font-medium text-sm"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Skip
                    </span>
                  </motion.button>

                  {/* Not now */}
                  <motion.button
                    onClick={() => handleAction('dismiss')}
                    className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2"
                    style={{
                      background: theme.button.secondary.bg,
                      color: theme.button.secondary.text,
                    }}
                    whileHover={{ scale: 1.02, background: theme.button.secondary.hover }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Clock size={18} />
                    <span
                      className="font-medium text-sm"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Later
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Bottom accent bar */}
            <div
              className="h-1"
              style={{
                background: `linear-gradient(90deg, ${theme.accent.primary} 0%, transparent 100%)`,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ArrivalPrompt;
