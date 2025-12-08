/**
 * SerendipityReveal Component
 *
 * WI-7.5: Full-screen dramatic reveal for hidden gem surprises
 *
 * Design Philosophy:
 * - MAGICAL - like opening a treasure chest
 * - Dramatic entrance with orchestrated animation
 * - "Why this is special" as the hero text
 * - Golden/amber accents for treasure-found feeling
 * - Celebration when accepted
 *
 * Animation Sequence:
 * 1. Backdrop fades in with blur
 * 2. Card scales up from center with spring physics
 * 3. Photo reveals with ken burns effect
 * 4. Text elements stagger in
 * 5. Sparkle particles animate
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Star,
  Navigation,
  X,
  Check,
  RefreshCw,
  Gem,
} from 'lucide-react';

import type { SerendipityResult } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface SerendipityRevealProps {
  /** The serendipity result to reveal */
  result: SerendipityResult;
  /** Called when user accepts the surprise */
  onAccept: () => void;
  /** Called when user rejects (wants another) */
  onReject: () => void;
  /** Called when user dismisses entirely */
  onDismiss: () => void;
  /** Whether another surprise is loading */
  isLoadingNext?: boolean;
}

// ============================================================================
// Sparkle Particle Component
// ============================================================================

const SparkleParticle = ({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotate: [0, 180],
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 2,
    }}
  >
    <Sparkles
      size={size}
      color="#D4A853"
      fill="#D4A853"
      style={{ filter: 'drop-shadow(0 0 4px rgba(212, 168, 83, 0.6))' }}
    />
  </motion.div>
);

// ============================================================================
// Component
// ============================================================================

export function SerendipityReveal({
  result,
  onAccept,
  onReject,
  onDismiss,
  isLoadingNext = false,
}: SerendipityRevealProps) {
  const place = result.activity.activity.place;
  const photoUrl = place.photoUrl;

  // Generate sparkle positions (memoized to avoid re-randomizing)
  const sparkles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        delay: i * 0.15,
        size: 12 + Math.random() * 8,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
      })),
    []
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* ============ Backdrop ============ */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(10,10,11,0.95) 0%, rgba(26,20,12,0.98) 100%)',
            backdropFilter: 'blur(20px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          onClick={onDismiss}
        />

        {/* ============ Sparkle Particles ============ */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {sparkles.map((s) => (
            <SparkleParticle key={s.id} {...s} />
          ))}
        </div>

        {/* ============ Close Button ============ */}
        <motion.button
          onClick={onDismiss}
          className="absolute top-6 right-6 z-10 p-3 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.95 }}
        >
          <X size={20} color="#A1A1AA" />
        </motion.button>

        {/* ============ Main Card ============ */}
        <motion.div
          className="relative w-[90vw] max-w-md mx-4 overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(180deg, #1A1815 0%, #0F0D0A 100%)',
            border: '1px solid rgba(212, 168, 83, 0.2)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212, 168, 83, 0.1)',
          }}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
            delay: 0.1,
          }}
        >
          {/* ============ Header Badge ============ */}
          <motion.div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(212,168,83,0.25) 0%, rgba(212,168,83,0.1) 100%)',
              border: '1px solid rgba(212,168,83,0.3)',
              boxShadow: '0 4px 20px rgba(212,168,83,0.2)',
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              <Gem size={14} color="#D4A853" fill="#D4A853" />
            </motion.div>
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{
                color: '#D4A853',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Hidden Gem
            </span>
          </motion.div>

          {/* ============ Photo Section ============ */}
          <div className="relative h-56 overflow-hidden">
            {photoUrl ? (
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              >
                <img
                  src={photoUrl}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #2A2520 0%, #1A1815 100%)',
                }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  <Gem size={64} color="#D4A853" strokeWidth={1} />
                </motion.div>
              </div>
            )}

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, #0F0D0A 0%, rgba(15,13,10,0.8) 30%, transparent 60%)',
              }}
            />

            {/* Rating badge */}
            {place.rating && (
              <motion.div
                className="absolute top-14 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(212,168,83,0.3)',
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Star size={12} fill="#D4A853" color="#D4A853" />
                <span
                  className="text-sm font-semibold"
                  style={{ color: '#D4A853' }}
                >
                  {place.rating.toFixed(1)}
                </span>
              </motion.div>
            )}
          </div>

          {/* ============ Content Section ============ */}
          <div className="px-6 pb-6 -mt-4 relative z-10">
            {/* Title */}
            <motion.h2
              className="text-2xl mb-2"
              style={{
                color: '#F4F4F5',
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {place.name}
            </motion.h2>

            {/* Location + Distance */}
            <motion.div
              className="flex items-center gap-4 mb-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {place.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} color="#71717A" />
                  <span
                    className="text-sm"
                    style={{
                      color: '#A1A1AA',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {place.address.split(',')[0]}
                  </span>
                </div>
              )}

              {result.activity.distanceFormatted && (
                <div className="flex items-center gap-1.5">
                  <Navigation size={12} color="#D4A853" />
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: '#D4A853',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {result.activity.distanceFormatted}
                  </span>
                </div>
              )}
            </motion.div>

            {/* ============ "Why This is Special" Section ============ */}
            <motion.div
              className="mb-6 p-4 rounded-2xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(212,168,83,0.12) 0%, rgba(212,168,83,0.04) 100%)',
                border: '1px solid rgba(212,168,83,0.2)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {/* Decorative glow */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30"
                style={{
                  background: 'radial-gradient(circle, rgba(212,168,83,0.4) 0%, transparent 70%)',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} color="#D4A853" />
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: '#D4A853',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Why this is special
                  </span>
                </div>

                <p
                  className="text-base leading-relaxed"
                  style={{
                    color: '#F4F4F5',
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontStyle: 'italic',
                  }}
                >
                  "{result.reason}"
                </p>

                {/* Serendipity score indicator */}
                {result.serendipityScore > 0.7 && (
                  <motion.div
                    className="flex items-center gap-2 mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: i < Math.round(result.serendipityScore * 5) ? '#D4A853' : '#3F3F46',
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.9 + i * 0.05 }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-xs"
                      style={{
                        color: '#71717A',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Rare find
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* ============ Action Buttons ============ */}
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {/* Accept Button */}
              <motion.button
                onClick={onAccept}
                className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #D4A853 0%, #C49A45 100%)',
                  boxShadow: '0 4px 20px rgba(212,168,83,0.3)',
                }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 8px 30px rgba(212,168,83,0.4)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Check size={18} color="#0F0D0A" strokeWidth={2.5} />
                <span
                  className="text-base font-semibold"
                  style={{
                    color: '#0F0D0A',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Let's go here
                </span>
              </motion.button>

              {/* Reject / Try Another Button */}
              <motion.button
                onClick={onReject}
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                whileHover={{
                  scale: 1.05,
                  background: 'rgba(255,255,255,0.1)',
                }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoadingNext}
              >
                {isLoadingNext ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw size={18} color="#A1A1AA" />
                  </motion.div>
                ) : (
                  <RefreshCw size={18} color="#A1A1AA" />
                )}
              </motion.button>
            </motion.div>

            {/* Hint text */}
            <motion.p
              className="text-center text-xs mt-3"
              style={{
                color: '#525252',
                fontFamily: "'DM Sans', sans-serif",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Tap the refresh to discover another gem
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SerendipityReveal;
