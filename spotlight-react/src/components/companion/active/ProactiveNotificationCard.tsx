/**
 * ProactiveNotificationCard Component
 *
 * WI-7.8: Individual proactive notification with elegant whisper design
 *
 * Design Philosophy:
 * - ELEGANT WHISPER - like a knowledgeable friend tapping your shoulder
 * - Not alarming, but worth attention
 * - Type-specific accent colors for quick recognition
 * - Swipe to dismiss on mobile
 * - Auto-dismiss with visual progress indicator
 *
 * Types:
 * - location_trigger: "You're near X" (blue accent)
 * - time_trigger: "Golden hour in 20 min" (amber accent)
 * - weather_alert: "Rain coming" (slate accent)
 * - activity_reminder: "Reservation soon" (rose accent)
 * - recommendation: "Great time for..." (emerald accent)
 * - discovery: "Hidden gem nearby" (gold accent)
 * - encouragement: "You've seen 3 spots!" (violet accent)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
  MapPin,
  Clock,
  Cloud,
  Calendar,
  Lightbulb,
  Gem,
  Trophy,
  X,
  ChevronRight,
  Navigation,
} from 'lucide-react';

import type { ProactiveMessage } from '../../../services/tripBrain/companion/types';

// ============================================================================
// Types
// ============================================================================

export interface ProactiveNotificationCardProps {
  /** The proactive message */
  message: ProactiveMessage;
  /** Called when dismissed */
  onDismiss: (id: string) => void;
  /** Called when action is taken */
  onAction: (id: string) => void;
  /** Auto-dismiss timeout in ms (0 to disable) */
  autoDismissMs?: number;
  /** Whether night mode is active */
  isNightMode?: boolean;
  /** Index in stack for animation stagger */
  index?: number;
}

// ============================================================================
// Type Configuration
// ============================================================================

type MessageType = ProactiveMessage['type'];

interface TypeConfig {
  icon: typeof MapPin;
  accentColor: string;
  accentBg: string;
  label: string;
}

const TYPE_CONFIG: Record<MessageType, TypeConfig> = {
  location_trigger: {
    icon: MapPin,
    accentColor: '#3B82F6', // Blue
    accentBg: 'rgba(59, 130, 246, 0.12)',
    label: 'Nearby',
  },
  time_trigger: {
    icon: Clock,
    accentColor: '#F59E0B', // Amber
    accentBg: 'rgba(245, 158, 11, 0.12)',
    label: 'Timing',
  },
  weather_alert: {
    icon: Cloud,
    accentColor: '#64748B', // Slate
    accentBg: 'rgba(100, 116, 139, 0.12)',
    label: 'Weather',
  },
  activity_reminder: {
    icon: Calendar,
    accentColor: '#EC4899', // Rose
    accentBg: 'rgba(236, 72, 153, 0.12)',
    label: 'Reminder',
  },
  recommendation: {
    icon: Lightbulb,
    accentColor: '#10B981', // Emerald
    accentBg: 'rgba(16, 185, 129, 0.12)',
    label: 'Suggestion',
  },
  discovery: {
    icon: Gem,
    accentColor: '#D4A853', // Gold
    accentBg: 'rgba(212, 168, 83, 0.12)',
    label: 'Discovery',
  },
  encouragement: {
    icon: Trophy,
    accentColor: '#8B5CF6', // Violet
    accentBg: 'rgba(139, 92, 246, 0.12)',
    label: 'Nice!',
  },
};

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      card: {
        bg: 'rgba(24, 24, 27, 0.92)',
        border: 'rgba(255, 255, 255, 0.08)',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      text: {
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        muted: '#71717A',
      },
      dismiss: {
        bg: 'rgba(255, 255, 255, 0.08)',
        hover: 'rgba(255, 255, 255, 0.12)',
      },
    };
  }

  return {
    card: {
      bg: 'rgba(255, 255, 255, 0.95)',
      border: 'rgba(0, 0, 0, 0.06)',
      shadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    },
    text: {
      primary: '#18181B',
      secondary: '#52525B',
      muted: '#A1A1AA',
    },
    dismiss: {
      bg: 'rgba(0, 0, 0, 0.04)',
      hover: 'rgba(0, 0, 0, 0.08)',
    },
  };
};

// ============================================================================
// Component
// ============================================================================

export function ProactiveNotificationCard({
  message,
  onDismiss,
  onAction,
  autoDismissMs = 8000,
  isNightMode = false,
  index = 0,
}: ProactiveNotificationCardProps) {
  const theme = getTheme(isNightMode);
  const typeConfig = TYPE_CONFIG[message.type];
  const Icon = typeConfig.icon;

  // Auto-dismiss timer
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const isPausedRef = useRef(false);

  // Swipe to dismiss
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);
  const scale = useTransform(x, [-150, 0, 150], [0.8, 1, 0.8]);

  // Start/pause auto-dismiss
  const startTimer = useCallback(() => {
    if (autoDismissMs <= 0 || isPausedRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = autoDismissMs - elapsed;

    if (remaining <= 0) {
      onDismiss(message.id);
      return;
    }

    const updateInterval = 50;
    timerRef.current = setInterval(() => {
      const currentElapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(currentElapsed / autoDismissMs, 1);
      setProgress(newProgress);

      if (newProgress >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        onDismiss(message.id);
      }
    }, updateInterval);
  }, [autoDismissMs, message.id, onDismiss]);

  const pauseTimer = useCallback(() => {
    isPausedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resumeTimer = useCallback(() => {
    isPausedRef.current = false;
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  // Handle swipe end
  const handleDragEnd = (_: never, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      onDismiss(message.id);
    }
  };

  return (
    <motion.div
      className="relative w-full"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300,
        delay: index * 0.05,
      }}
      style={{ opacity, scale, x }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onTouchStart={pauseTimer}
      onTouchEnd={resumeTimer}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: theme.card.bg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${theme.card.border}`,
          boxShadow: theme.card.shadow,
        }}
      >
        {/* Progress bar */}
        {autoDismissMs > 0 && (
          <motion.div
            className="absolute top-0 left-0 h-0.5 rounded-full"
            style={{
              background: typeConfig.accentColor,
              width: `${(1 - progress) * 100}%`,
            }}
          />
        )}

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Type icon */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: typeConfig.accentBg }}
            >
              <Icon size={20} color={typeConfig.accentColor} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              {/* Type label */}
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{
                  color: typeConfig.accentColor,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {typeConfig.label}
              </span>

              {/* Main message */}
              <p
                className="text-base mt-0.5 leading-snug"
                style={{
                  color: theme.text.primary,
                  fontFamily: "'Fraunces', Georgia, serif",
                }}
              >
                {message.message}
              </p>

              {/* Detail */}
              {message.detail && (
                <p
                  className="text-sm mt-1"
                  style={{
                    color: theme.text.secondary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {message.detail}
                </p>
              )}

              {/* Distance if available */}
              {message.relatedActivity?.distanceFormatted && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Navigation size={12} color={typeConfig.accentColor} />
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: typeConfig.accentColor,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {message.relatedActivity.distanceFormatted}
                  </span>
                </div>
              )}

              {/* Action button */}
              {(message.action || message.relatedActivity) && (
                <motion.button
                  onClick={() => onAction(message.id)}
                  className="flex items-center gap-1 mt-3 px-3 py-1.5 rounded-lg"
                  style={{
                    background: typeConfig.accentBg,
                    border: `1px solid ${typeConfig.accentColor}30`,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: typeConfig.accentColor,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {message.action?.label || 'View'}
                  </span>
                  <ChevronRight size={14} color={typeConfig.accentColor} />
                </motion.button>
              )}
            </div>

            {/* Dismiss button */}
            <motion.button
              onClick={() => onDismiss(message.id)}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: theme.dismiss.bg }}
              whileHover={{ background: theme.dismiss.hover, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={16} color={theme.text.muted} />
            </motion.button>
          </div>
        </div>

        {/* Accent border at bottom */}
        <div
          className="h-0.5"
          style={{
            background: `linear-gradient(90deg, ${typeConfig.accentColor} 0%, transparent 100%)`,
          }}
        />
      </div>
    </motion.div>
  );
}

export default ProactiveNotificationCard;
