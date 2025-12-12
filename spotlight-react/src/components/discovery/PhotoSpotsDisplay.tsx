/**
 * PhotoSpotsDisplay
 *
 * Showcases Instagram-worthy photo spots discovered by the PhotoAgent.
 * Photography-inspired design with viewfinder and exposure aesthetics.
 *
 * Design Philosophy:
 * - Camera viewfinder-inspired frame elements
 * - Time and lighting prominently featured
 * - Practical tips feel like a photographer's notes
 * - Cards arranged like a contact sheet
 * - Rich, cinematic color palette
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Aperture,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  Focus,
  Eye,
  ChevronDown,
} from 'lucide-react';
import type { PhotoSpot } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface PhotoSpotsDisplayProps {
  spots: PhotoSpot[];
  /** Compact mode for card embedding */
  compact?: boolean;
  /** Animation delay */
  delay?: number;
}

interface PhotoSpotCardProps {
  spot: PhotoSpot;
  index: number;
  delay: number;
  compact: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

// Parse time of day from bestTime string
function getTimeIcon(bestTime: string): React.ElementType {
  const lower = bestTime.toLowerCase();

  if (lower.includes('sunrise') || lower.includes('dawn') || lower.includes('morning')) {
    return Sunrise;
  }
  if (lower.includes('sunset') || lower.includes('golden') || lower.includes('evening')) {
    return Sunset;
  }
  if (lower.includes('night') || lower.includes('dark') || lower.includes('blue hour')) {
    return Moon;
  }
  if (lower.includes('noon') || lower.includes('midday')) {
    return Sun;
  }

  return Clock;
}

// Time-based color theming
function getTimeTheme(bestTime: string) {
  const lower = bestTime.toLowerCase();

  if (lower.includes('sunrise') || lower.includes('dawn')) {
    return {
      gradient: 'from-amber-500 via-orange-400 to-rose-400',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      glow: 'rgba(251, 191, 36, 0.2)',
    };
  }
  if (lower.includes('sunset') || lower.includes('golden')) {
    return {
      gradient: 'from-orange-500 via-rose-400 to-purple-400',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      glow: 'rgba(249, 115, 22, 0.2)',
    };
  }
  if (lower.includes('night') || lower.includes('blue hour')) {
    return {
      gradient: 'from-indigo-500 via-purple-500 to-slate-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      glow: 'rgba(99, 102, 241, 0.2)',
    };
  }

  // Default (daytime)
  return {
    gradient: 'from-sky-400 via-blue-400 to-indigo-400',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    glow: 'rgba(56, 189, 248, 0.15)',
  };
}

// =============================================================================
// Main Component
// =============================================================================

export function PhotoSpotsDisplay({
  spots,
  compact = false,
  delay = 0,
}: PhotoSpotsDisplayProps) {
  if (!spots || spots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No photo spots discovered yet</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-4"
    >
      {/* Header with camera aesthetic */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Aperture-inspired icon */}
            <div className="relative">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center"
              >
                <Aperture className="w-6 h-6 text-white" />
              </motion.div>
              {/* Focus ring */}
              <div className="absolute -inset-1 border-2 border-gray-300 rounded-xl opacity-50" />
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-gray-900">
                Photo Spots
              </h3>
              <p className="text-sm text-gray-500">
                {spots.length} picture-perfect locations
              </p>
            </div>
          </div>

          {/* Contact sheet badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-mono">
            <Focus className="w-3.5 h-3.5" />
            {spots.length} shots
          </div>
        </div>
      )}

      {/* Photo spots grid - contact sheet style */}
      <div className={compact ? 'space-y-2' : 'grid gap-3'}>
        {spots.map((spot, idx) => (
          <PhotoSpotCard
            key={spot.name + idx}
            spot={spot}
            index={idx}
            delay={delay + 0.1 + idx * 0.08}
            compact={compact}
          />
        ))}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Photo Spot Card
// =============================================================================

function PhotoSpotCard({ spot, index, delay, compact }: PhotoSpotCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const TimeIcon = getTimeIcon(spot.bestTime);
  const theme = getTimeTheme(spot.bestTime);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay }}
      className={`
        relative overflow-hidden
        rounded-2xl border-2 border-gray-100
        bg-white
        transition-all duration-200
        ${!compact && 'hover:border-gray-200 hover:shadow-lg'}
        group
      `}
    >
      {/* Viewfinder corner brackets */}
      <ViewfinderCorners />

      {/* Film frame number */}
      <div className="absolute top-2 right-2 z-10">
        <span className="font-mono text-[10px] text-gray-400 bg-white/80 px-1.5 py-0.5 rounded">
          #{(index + 1).toString().padStart(2, '0')}
        </span>
      </div>

      {/* Content */}
      <div className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start gap-3">
          {/* Time indicator with gradient */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`
              relative flex-shrink-0
              ${compact ? 'w-10 h-10' : 'w-12 h-12'}
              rounded-xl
              bg-gradient-to-br ${theme.gradient}
              flex items-center justify-center
              shadow-lg
            `}
            style={{ boxShadow: `0 4px 20px ${theme.glow}` }}
          >
            <TimeIcon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-white drop-shadow`} />
          </motion.div>

          {/* Spot info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4
                  className={`
                    font-semibold text-gray-900 leading-tight
                    ${compact ? 'text-sm' : 'text-base'}
                  `}
                >
                  {spot.name}
                </h4>

                {/* Best time badge */}
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className={`text-xs ${theme.text} font-medium`}>
                    {spot.bestTime}
                  </span>
                </div>
              </div>

              {/* Expand toggle */}
              {!compact && spot.tip && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </button>
              )}
            </div>

            {/* Tip preview */}
            {!isExpanded && (
              <p
                className={`
                  mt-2 text-gray-600 leading-relaxed
                  ${compact ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2'}
                `}
              >
                {spot.tip}
              </p>
            )}
          </div>
        </div>

        {/* Expanded tip section */}
        <AnimatePresence>
          {!compact && isExpanded && spot.tip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div
                className={`
                  mt-4 pt-3 border-t border-dashed border-gray-200
                `}
              >
                {/* Photographer's notes header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                    <Eye className="w-3 h-3 text-gray-500" />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Photographer's Tip
                  </span>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed pl-7">
                  {spot.tip}
                </p>

                {/* Decorative exposure indicator */}
                <div className="flex items-center gap-2 mt-3 pl-7">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`
                          w-1 h-3 rounded-sm
                          ${i < 3 ? 'bg-gray-300' : 'bg-gray-100'}
                        `}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {spot.bestTime.includes('golden') ? 'f/2.8 · 1/250' : 'f/8 · 1/125'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Viewfinder Corner Brackets
// =============================================================================

function ViewfinderCorners() {
  const cornerStyle = "absolute w-4 h-4 border-gray-300 opacity-40 group-hover:opacity-60 transition-opacity";

  return (
    <>
      {/* Top-left */}
      <div className={`${cornerStyle} top-2 left-2 border-t-2 border-l-2`} />
      {/* Top-right */}
      <div className={`${cornerStyle} top-2 right-2 border-t-2 border-r-2`} />
      {/* Bottom-left */}
      <div className={`${cornerStyle} bottom-2 left-2 border-b-2 border-l-2`} />
      {/* Bottom-right */}
      <div className={`${cornerStyle} bottom-2 right-2 border-b-2 border-r-2`} />
    </>
  );
}

// =============================================================================
// Compact Timeline View
// =============================================================================

interface PhotoSpotTimelineProps {
  spots: PhotoSpot[];
}

export function PhotoSpotTimeline({ spots }: PhotoSpotTimelineProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {spots.map((spot, idx) => {
        const theme = getTimeTheme(spot.bestTime);
        const TimeIcon = getTimeIcon(spot.bestTime);

        return (
          <motion.div
            key={spot.name + idx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`
              flex-shrink-0 flex items-center gap-1.5
              px-2.5 py-1 rounded-full
              ${theme.bg} ${theme.border} border
            `}
          >
            <TimeIcon className={`w-3 h-3 ${theme.text}`} />
            <span className={`text-xs font-medium ${theme.text} truncate max-w-[80px]`}>
              {spot.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Mini Badge
// =============================================================================

interface PhotoSpotBadgeProps {
  count: number;
}

export function PhotoSpotBadge({ count }: PhotoSpotBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
      <Camera className="w-3 h-3" />
      {count} photo spots
    </span>
  );
}

export default PhotoSpotsDisplay;
