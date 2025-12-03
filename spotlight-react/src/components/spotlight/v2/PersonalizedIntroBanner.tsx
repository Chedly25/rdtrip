/**
 * Personalized Intro Card
 *
 * A compact, elegant notification card that appears when the route
 * has personalization. Designed as a floating "boarding pass" aesthetic -
 * minimal by default, expandable for details.
 *
 * Design: Refined editorial with warm cream tones, subtle gold accents,
 * and elegant Fraunces typography. Compact footprint, maximum impact.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, X } from 'lucide-react';
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

// Soft warm palette for style bars
const STYLE_COLORS: Record<string, string> = {
  cultural: '#B8860B',
  adventure: '#2E7D4A',
  relaxation: '#4A90A4',
  culinary: '#A0522D',
  nature: '#228B22',
};

const STYLE_LABELS: Record<string, string> = {
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    onDismiss?.();
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Get first highlight or personalized tag for the subtitle
  const subtitle = intro.highlights?.[0] || intro.personalizedFor?.[0] || `${totalCities} cities · ${totalDays} days`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`mx-4 md:mx-6 ${className}`}
    >
      {/* Main Card */}
      <motion.div
        layout
        onClick={toggleExpand}
        className="relative cursor-pointer overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(145deg, #FFFDF9 0%, #FFF9F0 100%)',
          boxShadow: '0 4px 24px rgba(44, 36, 23, 0.08), 0 1px 4px rgba(44, 36, 23, 0.04)',
          border: '1px solid rgba(196, 88, 48, 0.08)',
        }}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
      >
        {/* Subtle accent line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, #C45830 0%, #D4A853 50%, #C45830 100%)',
          }}
        />

        {/* Compact Header Row */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Icon */}
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.1) 0%, rgba(212, 168, 83, 0.1) 100%)',
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: '#C45830' }} />
          </motion.div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-base font-semibold leading-snug"
              style={{
                color: '#2C2417',
                fontFamily: "'Fraunces', Georgia, serif",
                letterSpacing: '-0.01em',
              }}
            >
              {intro.headline}
            </h2>
            <p
              className="truncate text-sm"
              style={{ color: '#8B7355' }}
            >
              {subtitle}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5"
            >
              <ChevronRight className="h-4 w-4" style={{ color: '#8B7355' }} />
            </motion.div>
            <button
              onClick={handleDismiss}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" style={{ color: '#8B7355' }} />
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div
                className="border-t px-4 pb-4 pt-3"
                style={{ borderColor: 'rgba(139, 115, 85, 0.1)' }}
              >
                {/* Narrative */}
                {(intro.narrative || tripNarrative) && (
                  <p
                    className="mb-3 text-sm leading-relaxed"
                    style={{
                      color: '#5C4D3D',
                      fontStyle: 'italic',
                    }}
                  >
                    "{intro.narrative || tripNarrative}"
                  </p>
                )}

                {/* Highlights */}
                {intro.highlights && intro.highlights.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {intro.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: 'rgba(212, 168, 83, 0.12)',
                          color: '#8B6914',
                        }}
                      >
                        <span style={{ color: '#D4A853' }}>✦</span>
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}

                {/* Trip Style Profile */}
                {tripStyleProfile && Object.keys(tripStyleProfile).length > 0 && (
                  <div className="mt-3 rounded-xl bg-black/[0.02] p-3">
                    <p
                      className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: '#8B7355' }}
                    >
                      Your Trip Profile
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {Object.entries(tripStyleProfile)
                        .filter(([, value]) => value > 0)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 4)
                        .map(([style, value]) => (
                          <div key={style} className="flex items-center gap-2">
                            <div
                              className="h-1.5 flex-1 overflow-hidden rounded-full"
                              style={{ background: 'rgba(0,0,0,0.05)' }}
                            >
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="h-full rounded-full"
                                style={{
                                  background: STYLE_COLORS[style] || '#8B7355',
                                }}
                              />
                            </div>
                            <span
                              className="w-16 text-[11px]"
                              style={{ color: '#5C4D3D' }}
                            >
                              {STYLE_LABELS[style] || style}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Personalized For Tags */}
                {intro.personalizedFor && intro.personalizedFor.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {intro.personalizedFor.slice(1).map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-full px-2 py-0.5 text-[11px]"
                        style={{
                          background: 'rgba(196, 88, 48, 0.08)',
                          color: '#C45830',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default PersonalizedIntroBanner;
