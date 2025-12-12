/**
 * HiddenGemsDisplay
 *
 * Showcases non-touristy local favorites discovered by the GemsAgent.
 * Each gem feels like a whispered secret from a trusted local friend.
 *
 * Design Philosophy:
 * - Intimate, "insider knowledge" aesthetic
 * - Handwritten/personal touch through typography
 * - Warm amber/gold tones suggesting treasure
 * - Cards that feel like handwritten notes
 * - "Instead of" comparisons show savvy alternatives
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gem,
  Sparkles,
  MapPin,
  Utensils,
  Coffee,
  Wine,
  ShoppingBag,
  Mountain,
  Store,
  Users,
  ArrowRight,
  Lightbulb,
  ChevronDown,
  Star,
} from 'lucide-react';
import type { HiddenGem, GemsOutput } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface HiddenGemsDisplayProps {
  gems: HiddenGem[];
  /** Compact mode for card embedding */
  compact?: boolean;
  /** Animation delay */
  delay?: number;
}

interface GemCardProps {
  gem: HiddenGem;
  index: number;
  delay: number;
  compact: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

const GEM_TYPE_CONFIG = {
  restaurant: {
    icon: Utensils,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    accent: 'from-rose-400 to-orange-400',
  },
  cafe: {
    icon: Coffee,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    accent: 'from-amber-400 to-yellow-400',
  },
  bar: {
    icon: Wine,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    accent: 'from-purple-400 to-pink-400',
  },
  shop: {
    icon: ShoppingBag,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    accent: 'from-teal-400 to-emerald-400',
  },
  viewpoint: {
    icon: Mountain,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    accent: 'from-sky-400 to-blue-400',
  },
  activity: {
    icon: Star,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    accent: 'from-indigo-400 to-violet-400',
  },
  neighborhood: {
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'from-emerald-400 to-green-400',
  },
  market: {
    icon: Store,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    accent: 'from-orange-400 to-amber-400',
  },
};

// =============================================================================
// Main Component
// =============================================================================

export function HiddenGemsDisplay({
  gems,
  compact = false,
  delay = 0,
}: HiddenGemsDisplayProps) {
  if (!gems || gems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Gem className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hidden gems discovered yet</p>
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
      {/* Header with decorative elements */}
      {!compact && (
        <div className="relative">
          {/* Decorative sparkles */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </motion.div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Gem className="w-5 h-5 text-amber-600" />
              </div>
              {/* Subtle glow */}
              <div className="absolute inset-0 rounded-xl bg-amber-400/20 blur-md -z-10" />
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-gray-900">
                Hidden Gems
              </h3>
              <p className="text-sm text-gray-500">
                Local secrets the guidebooks miss
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gems list */}
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {gems.map((gem, idx) => (
          <GemCard
            key={gem.name + idx}
            gem={gem}
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
// Gem Card
// =============================================================================

function GemCard({ gem, index, delay, compact }: GemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = GEM_TYPE_CONFIG[gem.type as keyof typeof GEM_TYPE_CONFIG] || GEM_TYPE_CONFIG.activity;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`
        relative overflow-hidden
        rounded-2xl border-2 ${config.border}
        bg-gradient-to-br from-white to-gray-50
        transition-all duration-200
        ${!compact && 'hover:shadow-lg hover:border-amber-200'}
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      {/* Decorative corner accent */}
      <div
        className={`
          absolute top-0 right-0 w-16 h-16
          bg-gradient-to-bl ${config.accent}
          opacity-10 rounded-bl-[4rem]
        `}
      />

      {/* Main content */}
      <div className="relative">
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div
            className={`
              flex-shrink-0
              ${compact ? 'w-9 h-9' : 'w-11 h-11'}
              rounded-xl ${config.bg}
              flex items-center justify-center
              border ${config.border}
            `}
          >
            <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${config.color}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4
                  className={`
                    font-semibold text-gray-900 leading-tight
                    ${compact ? 'text-sm' : 'text-base'}
                  `}
                >
                  {gem.name}
                </h4>
                <span
                  className={`
                    inline-block mt-0.5
                    text-xs font-medium capitalize
                    ${config.color} opacity-80
                  `}
                >
                  {gem.type}
                </span>
              </div>

              {/* Expand toggle for non-compact */}
              {!compact && gem.insiderTip && (
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

            {/* Why this place */}
            <p
              className={`
                mt-2 text-gray-600 leading-relaxed
                ${compact ? 'text-xs line-clamp-2' : 'text-sm'}
              `}
            >
              {gem.why}
            </p>

            {/* Instead of badge */}
            {gem.insteadOf && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: delay + 0.15 }}
                className="mt-2.5"
              >
                <div
                  className={`
                    inline-flex items-center gap-1.5
                    px-2.5 py-1 rounded-full
                    bg-gradient-to-r from-amber-50 to-orange-50
                    border border-amber-200/60
                    ${compact ? 'text-[10px]' : 'text-xs'}
                  `}
                >
                  <span className="text-amber-600 font-medium">Instead of</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                  <span className="text-gray-600">{gem.insteadOf}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Expandable insider tip */}
        <AnimatePresence>
          {!compact && isExpanded && gem.insiderTip && (
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
                  flex items-start gap-2
                `}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Insider Tip
                  </span>
                  <p className="text-sm text-gray-600 mt-0.5 italic">
                    "{gem.insiderTip}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compact inline tip */}
        {compact && gem.insiderTip && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600">
            <Lightbulb className="w-3 h-3" />
            <span className="truncate italic">"{gem.insiderTip}"</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Compact Pills View (for inline display)
// =============================================================================

interface GemPillsProps {
  gems: HiddenGem[];
  maxShow?: number;
}

export function GemPills({ gems, maxShow = 3 }: GemPillsProps) {
  const visibleGems = gems.slice(0, maxShow);
  const remaining = gems.length - maxShow;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleGems.map((gem, idx) => {
        const config = GEM_TYPE_CONFIG[gem.type as keyof typeof GEM_TYPE_CONFIG] || GEM_TYPE_CONFIG.activity;
        const Icon = config.icon;

        return (
          <span
            key={gem.name + idx}
            className={`
              inline-flex items-center gap-1
              px-2 py-1 rounded-lg
              text-xs font-medium
              ${config.bg} ${config.color}
              border ${config.border}
            `}
          >
            <Icon className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{gem.name}</span>
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="text-xs text-amber-600 font-medium">
          +{remaining} more gems
        </span>
      )}
    </div>
  );
}

export default HiddenGemsDisplay;
