/**
 * MatchScoreRing
 *
 * A captivating circular score display showing how well a city matches
 * user preferences. Think fitness tracker ring but for travel compatibility.
 *
 * Design Philosophy:
 * - Animated ring that fills based on score
 * - Gradient coloring from amber (low) through emerald (high)
 * - Central score with elegant typography
 * - Expandable reasons panel showing match details
 * - Warm, inviting aesthetic with subtle depth
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  Heart,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import type { MatchScoreOutput, MatchReason, MatchWarning } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface MatchScoreRingProps {
  score: number;
  reasons?: MatchReason[];
  warnings?: MatchWarning[];
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show reasons inline */
  showReasons?: boolean;
  /** Animation delay */
  delay?: number;
}

interface MatchScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md';
  className?: string;
}

// =============================================================================
// Configuration
// =============================================================================

// Score thresholds for color gradients
const SCORE_COLORS = {
  excellent: { ring: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', label: 'Excellent Match' },
  great: { ring: '#22c55e', glow: 'rgba(34, 197, 94, 0.25)', label: 'Great Match' },
  good: { ring: '#84cc16', glow: 'rgba(132, 204, 22, 0.2)', label: 'Good Match' },
  moderate: { ring: '#eab308', glow: 'rgba(234, 179, 8, 0.2)', label: 'Moderate Match' },
  fair: { ring: '#f97316', glow: 'rgba(249, 115, 22, 0.2)', label: 'Fair Match' },
};

function getScoreConfig(score: number) {
  if (score >= 90) return SCORE_COLORS.excellent;
  if (score >= 80) return SCORE_COLORS.great;
  if (score >= 70) return SCORE_COLORS.good;
  if (score >= 55) return SCORE_COLORS.moderate;
  return SCORE_COLORS.fair;
}

// =============================================================================
// Main Component
// =============================================================================

export function MatchScoreRing({
  score,
  reasons = [],
  warnings = [],
  size = 'md',
  showReasons = true,
  delay = 0,
}: MatchScoreRingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const config = getScoreConfig(score);

  // Size configurations
  const sizes = {
    sm: { ring: 80, stroke: 6, fontSize: 'text-xl', icon: 14 },
    md: { ring: 120, stroke: 8, fontSize: 'text-3xl', icon: 18 },
    lg: { ring: 160, stroke: 10, fontSize: 'text-4xl', icon: 24 },
  };
  const s = sizes[size];

  // Calculate ring properties
  const radius = (s.ring - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="flex flex-col items-center"
    >
      {/* Ring */}
      <div
        className="relative"
        style={{ width: s.ring, height: s.ring }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-50 transition-opacity duration-500"
          style={{
            background: config.glow,
            opacity: isInView ? 0.5 : 0,
          }}
        />

        {/* SVG Ring */}
        <svg
          width={s.ring}
          height={s.ring}
          viewBox={`0 0 ${s.ring} ${s.ring}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={s.stroke}
          />

          {/* Progress ring */}
          <motion.circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke={config.ring}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: isInView ? circumference - progress : circumference,
            }}
            transition={{
              duration: 1.2,
              delay: delay + 0.3,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />

          {/* Animated sparkle dots */}
          {score >= 80 && isInView && (
            <motion.circle
              cx={s.ring / 2 + radius}
              cy={s.ring / 2}
              r={3}
              fill="white"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1,
                delay: delay + 1.2,
                repeat: 2,
                repeatDelay: 0.5,
              }}
            />
          )}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: isInView ? 1 : 0, scale: isInView ? 1 : 0.5 }}
            transition={{ duration: 0.5, delay: delay + 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-baseline">
              <span
                className={`font-display font-bold ${s.fontSize} tabular-nums`}
                style={{ color: config.ring }}
              >
                {isInView ? score : 0}
              </span>
              <span className="text-gray-400 text-sm ml-0.5">%</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Heart
                className="fill-current"
                style={{ color: config.ring, width: s.icon, height: s.icon }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: isInView ? 1 : 0 }}
        transition={{ duration: 0.3, delay: delay + 1 }}
        className="text-sm font-medium text-gray-600 mt-3"
      >
        {config.label}
      </motion.p>

      {/* Expandable reasons */}
      {showReasons && (reasons.length > 0 || warnings.length > 0) && (
        <div className="w-full mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              w-full flex items-center justify-center gap-2
              py-2 px-4 rounded-xl
              text-sm text-gray-600
              hover:bg-gray-50 transition-colors
            "
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {reasons.length} reasons
                {warnings.length > 0 && ` • ${warnings.length} notes`}
              </>
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-4">
                  {/* Reasons */}
                  {reasons.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Why it matches
                      </h4>
                      <div className="space-y-2">
                        {reasons.map((reason, idx) => (
                          <MatchReasonItem key={idx} reason={reason} delay={idx * 0.05} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {warnings.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Things to note
                      </h4>
                      <div className="space-y-2">
                        {warnings.map((warning, idx) => (
                          <MatchWarningItem key={idx} warning={warning} delay={idx * 0.05} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Reason Item
// =============================================================================

interface MatchReasonItemProps {
  reason: MatchReason;
  delay: number;
}

function MatchReasonItem({ reason, delay }: MatchReasonItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100">
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{reason.match}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-emerald-600 font-medium">
            {reason.preference}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500 tabular-nums">
            {reason.score}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Warning Item
// =============================================================================

interface MatchWarningItemProps {
  warning: MatchWarning;
  delay: number;
}

function MatchWarningItem({ warning, delay }: MatchWarningItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{warning.gap}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-amber-600 font-medium">
            {warning.preference}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Compact Badge Variant
// =============================================================================

export function MatchScoreBadge({
  score,
  size = 'md',
  className = '',
}: MatchScoreBadgeProps) {
  const config = getScoreConfig(score);

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center gap-1.5
        rounded-full font-semibold
        ${sizes[size]}
        ${className}
      `}
      style={{
        backgroundColor: `${config.ring}15`,
        color: config.ring,
      }}
    >
      <Heart className="w-3.5 h-3.5 fill-current" />
      <span className="tabular-nums">{score}%</span>
    </motion.div>
  );
}

// =============================================================================
// Mini Inline Score
// =============================================================================

export function MatchScoreInline({ score }: { score: number }) {
  const config = getScoreConfig(score);

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold"
      style={{ color: config.ring }}
    >
      <Heart className="w-3 h-3 fill-current" />
      {score}%
    </span>
  );
}

export default MatchScoreRing;
