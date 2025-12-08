/**
 * SerendipityMode Component
 *
 * WI-7.5: "Surprise Me" discovery interface
 *
 * Features:
 * - One-tap magical button to get a hidden gem surprise
 * - Full-screen reveal with dramatic presentation
 * - Shows "Why this is special" text
 * - Accept to add to route, or reject to get another
 * - Never repeats rejected surprises in session
 *
 * Design Philosophy:
 * - MAGICAL - create anticipation and delight
 * - The button itself is an experience
 * - Loading state builds excitement
 * - Reveal is the reward
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wand2,
  Gem,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

import { SerendipityReveal } from './SerendipityReveal';
import type { SerendipityResult } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface SerendipityModeProps {
  /** Get a surprise from TripBrain */
  onGetSurprise: () => void;
  /** Accept the current surprise */
  onAccept: () => void;
  /** Reject and get another */
  onReject: () => void;
  /** Current surprise result */
  result?: SerendipityResult | null;
  /** Whether loading */
  isLoading?: boolean;
  /** Go back to choice mode */
  onBack?: () => void;
  /** Number of surprises shown this session */
  surprisesShown?: number;
}

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      bg: '#0A0A0B',
      bgGradient: 'linear-gradient(180deg, #0A0A0B 0%, #111113 100%)',
      card: {
        bg: '#18181B',
        border: 'rgba(255, 255, 255, 0.08)',
      },
      text: {
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        muted: '#71717A',
      },
      accent: '#D4A853',
      accentGlow: 'rgba(212, 168, 83, 0.15)',
    };
  }

  return {
    bg: '#FAF8F5',
    bgGradient: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)',
    card: {
      bg: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.06)',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#525252',
      muted: '#737373',
    },
    accent: '#D4A853',
    accentGlow: 'rgba(212, 168, 83, 0.1)',
  };
};

// ============================================================================
// Floating Sparkle Component
// ============================================================================

const FloatingSparkle = ({ delay, duration, x, y, size }: {
  delay: number;
  duration: number;
  x: number;
  y: number;
  size: number;
}) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
    }}
    initial={{ opacity: 0, scale: 0, y: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0.5],
      y: [-20, -60],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 3,
    }}
  >
    <Sparkles
      size={size}
      color="#D4A853"
      style={{ filter: 'drop-shadow(0 0 3px rgba(212, 168, 83, 0.5))' }}
    />
  </motion.div>
);

// ============================================================================
// Component
// ============================================================================

export function SerendipityMode({
  onGetSurprise,
  onAccept,
  onReject,
  result,
  isLoading = false,
  onBack,
  surprisesShown = 0,
}: SerendipityModeProps) {
  const [showReveal, setShowReveal] = useState(false);

  // Time-aware theming
  const [currentHour] = useState(() => new Date().getHours());
  const isNightMode = currentHour >= 20 || currentHour < 6;
  const theme = getTheme(isNightMode);

  // Show reveal when result arrives
  useEffect(() => {
    if (result && !isLoading) {
      // Small delay for dramatic effect
      const timer = setTimeout(() => setShowReveal(true), 300);
      return () => clearTimeout(timer);
    }
  }, [result, isLoading]);

  // Handle accept
  const handleAccept = useCallback(() => {
    setShowReveal(false);
    // Small delay for exit animation
    setTimeout(() => {
      onAccept();
    }, 300);
  }, [onAccept]);

  // Handle reject
  const handleReject = useCallback(() => {
    setShowReveal(false);
    onReject();
  }, [onReject]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setShowReveal(false);
    onBack?.();
  }, [onBack]);

  // Generate floating sparkles
  const floatingSparkles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 0.4,
    duration: 2 + Math.random() * 1.5,
    x: 20 + Math.random() * 60,
    y: 30 + Math.random() * 40,
    size: 10 + Math.random() * 6,
  }));

  return (
    <motion.div
      className="min-h-full flex flex-col"
      style={{ background: theme.bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
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
              Surprise me
            </h1>
            <p
              className="text-sm"
              style={{
                color: theme.text.secondary,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Discover a hidden gem nearby
            </p>
          </div>
        </div>
      </div>

      {/* ============ Main Content ============ */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-10">
        {/* Magic Button */}
        <motion.div
          className="relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          {/* Floating sparkles */}
          <div className="absolute inset-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
            {floatingSparkles.map((s) => (
              <FloatingSparkle key={s.id} {...s} />
            ))}
          </div>

          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${theme.accent}30 0%, transparent 70%)`,
              transform: 'scale(1.5)',
            }}
            animate={{
              scale: [1.5, 1.8, 1.5],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Main button */}
          <motion.button
            onClick={onGetSurprise}
            disabled={isLoading}
            className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center"
            style={{
              background: isNightMode
                ? 'linear-gradient(135deg, #2A2520 0%, #1A1815 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F5F3F0 100%)',
              border: `2px solid ${theme.accent}40`,
              boxShadow: `0 8px 40px ${theme.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: `0 12px 50px ${theme.accent}30, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 size={40} color={theme.accent} strokeWidth={1.5} />
              </motion.div>
            ) : (
              <>
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  <Wand2
                    size={40}
                    color={theme.accent}
                    strokeWidth={1.5}
                    style={{ filter: `drop-shadow(0 2px 8px ${theme.accent}50)` }}
                  />
                </motion.div>
                <span
                  className="mt-2 text-sm font-medium"
                  style={{
                    color: theme.accent,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Tap to reveal
                </span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Subtitle text */}
        <motion.div
          className="mt-8 text-center max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p
            className="text-base mb-2"
            style={{
              color: theme.text.primary,
              fontFamily: "'Fraunces', Georgia, serif",
            }}
          >
            Let serendipity guide you
          </p>
          <p
            className="text-sm"
            style={{
              color: theme.text.muted,
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.6,
            }}
          >
            We'll find a hidden gem that most tourists miss - a place the locals love
          </p>
        </motion.div>

        {/* Session counter */}
        {surprisesShown > 0 && (
          <motion.div
            className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: theme.card.bg,
              border: `1px solid ${theme.card.border}`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Gem size={12} color={theme.accent} />
            <span
              className="text-xs"
              style={{
                color: theme.text.muted,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {surprisesShown} gem{surprisesShown > 1 ? 's' : ''} discovered this session
            </span>
          </motion.div>
        )}
      </div>

      {/* ============ Reveal Overlay ============ */}
      <AnimatePresence>
        {showReveal && result && (
          <SerendipityReveal
            result={result}
            onAccept={handleAccept}
            onReject={handleReject}
            onDismiss={handleDismiss}
            isLoadingNext={isLoading}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SerendipityMode;
