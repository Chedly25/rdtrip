/**
 * SmartTimeHint - Contextual Time Intelligence
 *
 * Surfaces smart, actionable hints about timing:
 * - "Leave in 15 min to arrive perfectly"
 * - "Crowds thin out after 3pm"
 * - "Golden hour in 45 min - perfect for photos"
 *
 * Design: Attention-grabbing but not intrusive. Animated entrance,
 * countdown for time-sensitive hints, color-coded urgency.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Users,
  CloudRain,
  DoorOpen,
  Navigation,
  X,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { useTimeTheme } from '../hooks/useTimeOfDay';
import type { SmartHint } from '../services/tripCompanion';

interface SmartTimeHintProps {
  hints: SmartHint[];
  onAction?: (hint: SmartHint) => void;
  onDismiss?: (hint: SmartHint) => void;
}

// Map hint type to icon and color
const hintConfig = {
  departure: {
    icon: Navigation,
    bgColor: (theme: any) => theme.primary,
    label: 'Time to go',
  },
  crowd: {
    icon: Users,
    bgColor: () => '#6B8E7B', // Sage
    label: 'Crowd insight',
  },
  golden_hour: {
    icon: Camera,
    bgColor: () => '#D4A853', // Golden
    label: 'Photo opportunity',
  },
  weather: {
    icon: CloudRain,
    bgColor: () => '#5B9BD5', // Blue
    label: 'Weather alert',
  },
  closing: {
    icon: DoorOpen,
    bgColor: () => '#E07B39', // Orange
    label: 'Closing soon',
  },
};

// Urgency colors
const urgencyColors = {
  low: { bg: 'rgba(107, 142, 123, 0.15)', border: '#6B8E7B', text: '#6B8E7B' },
  medium: { bg: 'rgba(212, 168, 83, 0.15)', border: '#D4A853', text: '#C49B4A' },
  high: { bg: 'rgba(224, 123, 57, 0.15)', border: '#E07B39', text: '#D4622B' },
};

// Single Hint Card
const HintCard: React.FC<{
  hint: SmartHint;
  index: number;
  onAction?: () => void;
  onDismiss?: () => void;
}> = ({ hint, index, onAction, onDismiss }) => {
  const { theme, isNight } = useTimeTheme();
  const [timeLeft, setTimeLeft] = useState(hint.expiresIn || 0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!hint.expiresIn) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [hint.expiresIn]);

  const config = hintConfig[hint.type] || hintConfig.departure;
  const urgency = urgencyColors[hint.urgency];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => onDismiss?.(), 300);
  };

  if (isDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        delay: index * 0.1,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden rounded-2xl mx-4 mb-3"
      style={{
        background: isNight ? 'rgba(42, 36, 56, 0.95)' : urgency.bg,
        border: `1px solid ${urgency.border}40`,
        boxShadow: `0 4px 20px ${urgency.border}20`,
      }}
    >
      {/* Urgency indicator bar */}
      {hint.urgency === 'high' && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: urgency.border }}
          animate={{
            opacity: [1, 0.5, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${urgency.border}20`,
          }}
          animate={
            hint.urgency === 'high'
              ? { scale: [1, 1.1, 1] }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Icon className="w-5 h-5" style={{ color: urgency.text }} />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: urgency.text }}
            >
              {config.label}
            </span>

            {/* Countdown */}
            {hint.expiresIn && timeLeft > 0 && (
              <motion.div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: `${urgency.border}30`,
                  color: urgency.text,
                }}
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock className="w-3 h-3" />
                <span>{timeLeft}m</span>
              </motion.div>
            )}
          </div>

          {/* Message */}
          <p
            className="text-sm font-medium"
            style={{ color: isNight ? theme.textPrimary : theme.textPrimary }}
          >
            {hint.message}
          </p>

          {/* Action Button */}
          {hint.actionLabel && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAction}
              className="mt-3 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: urgency.border,
                color: 'white',
              }}
            >
              {hint.actionLabel}
            </motion.button>
          )}
        </div>

        {/* Dismiss Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDismiss}
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: `${urgency.border}20`,
          }}
        >
          <X className="w-3 h-3" style={{ color: urgency.text }} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export const SmartTimeHint: React.FC<SmartTimeHintProps> = ({
  hints,
  onAction,
  onDismiss,
}) => {
  const { theme } = useTimeTheme();
  const [visibleHints, setVisibleHints] = useState(hints);

  // Update visible hints when props change
  useEffect(() => {
    setVisibleHints(hints);
  }, [hints]);

  const handleDismiss = (hint: SmartHint) => {
    setVisibleHints((prev) => prev.filter((h) => h !== hint));
    onDismiss?.(hint);
  };

  if (visibleHints.length === 0) return null;

  return (
    <div className="mb-4">
      <AnimatePresence mode="popLayout">
        {visibleHints.slice(0, 3).map((hint, index) => (
          <HintCard
            key={`${hint.type}-${hint.message.slice(0, 20)}`}
            hint={hint}
            index={index}
            onAction={() => onAction?.(hint)}
            onDismiss={() => handleDismiss(hint)}
          />
        ))}
      </AnimatePresence>

      {/* More hints indicator */}
      {visibleHints.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-4 flex items-center gap-2 text-xs"
          style={{ color: theme.textMuted }}
        >
          <AlertCircle className="w-3 h-3" />
          <span>+{visibleHints.length - 3} more hints</span>
        </motion.div>
      )}
    </div>
  );
};

export default SmartTimeHint;
