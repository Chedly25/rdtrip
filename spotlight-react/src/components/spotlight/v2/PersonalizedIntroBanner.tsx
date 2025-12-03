/**
 * Personalized Intro Banner
 *
 * A cinematic hero banner that appears at the top of the spotlight view
 * when the route has personalization. Shows the AI-generated headline,
 * narrative, and tags indicating what preferences shaped the journey.
 *
 * Design: Warm editorial with gradient overlays, refined typography,
 * and subtle motion. Inspired by luxury travel magazine covers.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  Heart,
  MapPin,
  Calendar,
  Compass,
  X,
} from 'lucide-react';
import type { PersonalizedIntro, TripStyleProfile } from '../../../stores/spotlightStoreV2';

interface PersonalizedIntroBannerProps {
  intro: PersonalizedIntro;
  tripStyleProfile?: TripStyleProfile;
  tripNarrative?: string;
  totalDays: number;
  totalCities: number;
  className?: string;
  onDismiss?: () => void;
}

// Soft color palette for style profile bars
const STYLE_COLORS = {
  cultural: '#8B6914',    // Gold
  adventure: '#3A6247',   // Forest green
  relaxation: '#4A90A4',  // Mediterranean blue
  culinary: '#8B3A3A',    // Brick red
  nature: '#4A7C59',      // Earthy green
};

const STYLE_LABELS = {
  cultural: 'Cultural',
  adventure: 'Adventure',
  relaxation: 'Relaxation',
  culinary: 'Culinary',
  nature: 'Nature',
};

export function PersonalizedIntroBanner({
  intro,
  tripStyleProfile,
  tripNarrative,
  totalDays,
  totalCities,
  className = '',
  onDismiss,
}: PersonalizedIntroBannerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.15, 0.5, 0.5, 1] }}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, #FFFBF5 0%, #FEF7ED 50%, #FAF3E8 100%)',
        borderBottom: '1px solid rgba(139, 115, 85, 0.15)',
      }}
    >
      {/* Subtle decorative pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B7355' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <div className="relative px-4 py-5 md:px-6 md:py-6">
        {/* Header row with sparkle and dismiss */}
        <div className="mb-3 flex items-start justify-between">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex items-center gap-2"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.15) 0%, rgba(212, 168, 83, 0.15) 100%)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: '#C45830' }} />
            </div>
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#C45830' }}
            >
              Personalized for you
            </span>
          </motion.div>

          <button
            onClick={handleDismiss}
            className="rounded-full p-1.5 transition-all hover:bg-black/5 active:scale-95"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" style={{ color: '#8B7355' }} />
          </button>
        </div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-2 text-2xl font-bold leading-tight md:text-3xl"
          style={{
            color: '#2C2417',
            fontFamily: "'Fraunces', Georgia, serif",
            letterSpacing: '-0.01em',
          }}
        >
          {intro.headline}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-4 text-base"
          style={{
            color: '#5C4D3D',
            fontFamily: "'Satoshi', sans-serif",
          }}
        >
          {intro.subheadline}
        </motion.p>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-4 flex flex-wrap items-center gap-4 text-sm"
          style={{ color: '#8B7355' }}
        >
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {totalDays} days
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {totalCities} cities
          </span>
          {intro.personalizedFor && intro.personalizedFor.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" style={{ color: '#C45830' }} />
              Tailored for {intro.personalizedFor[0]}
            </span>
          )}
        </motion.div>

        {/* Personalized For tags */}
        {intro.personalizedFor && intro.personalizedFor.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mb-4 flex flex-wrap gap-2"
          >
            {intro.personalizedFor.map((tag, idx) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: 'rgba(196, 88, 48, 0.1)',
                  color: '#C45830',
                  border: '1px solid rgba(196, 88, 48, 0.2)',
                }}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Narrative */}
        {(intro.narrative || tripNarrative) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-4 text-sm leading-relaxed"
            style={{
              color: '#5C4D3D',
              fontFamily: "'Satoshi', sans-serif",
              fontStyle: 'italic',
            }}
          >
            "{intro.narrative || tripNarrative}"
          </motion.p>
        )}

        {/* Highlights preview */}
        {intro.highlights && intro.highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="mb-4"
          >
            <div className="flex flex-wrap gap-2">
              {intro.highlights.slice(0, 3).map((highlight, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: '#8B7355' }}
                >
                  <span style={{ color: '#D4A853' }}>+</span>
                  {highlight}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Expand for trip style profile */}
        {tripStyleProfile && (
          <>
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: '#C45830' }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Compass className="h-4 w-4" />
              {showDetails ? 'Hide trip profile' : 'View your trip profile'}
              <motion.div
                animate={{ rotate: showDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.15, 0.5, 0.5, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className="mt-4 rounded-xl p-4"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      border: '1px solid rgba(139, 115, 85, 0.1)',
                    }}
                  >
                    <h3
                      className="mb-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#8B7355' }}
                    >
                      Your Trip Style Mix
                    </h3>
                    <div className="space-y-2.5">
                      {Object.entries(tripStyleProfile).map(([style, value]) => (
                        <div key={style} className="flex items-center gap-3">
                          <span
                            className="w-20 text-xs font-medium"
                            style={{ color: '#5C4D3D' }}
                          >
                            {STYLE_LABELS[style as keyof typeof STYLE_LABELS]}
                          </span>
                          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ duration: 0.6, delay: 0.1, ease: [0.15, 0.5, 0.5, 1] }}
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{
                                background: STYLE_COLORS[style as keyof typeof STYLE_COLORS],
                              }}
                            />
                          </div>
                          <span
                            className="w-8 text-right text-xs font-medium"
                            style={{ color: '#8B7355' }}
                          >
                            {value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Gradient fade at bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-4"
        style={{
          background: 'linear-gradient(to top, rgba(250, 243, 232, 0.8) 0%, transparent 100%)',
        }}
      />
    </motion.div>
  );
}

export default PersonalizedIntroBanner;
