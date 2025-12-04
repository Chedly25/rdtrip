/**
 * Why This Card - Enhanced Personalization Visibility
 *
 * A compact, expandable card that shows WHY a specific activity or
 * restaurant was selected based on the user's personalization preferences.
 * Appears as a small badge that expands to reveal match reasons.
 *
 * Design: Subtle glass-morphism with warm accents, appearing as an
 * overlay or inline element within activity/restaurant cards.
 *
 * Enhanced Features (Phase 3):
 * - Richer personalizationMatch.reasons from backend
 * - Category badges for each reason
 * - "Find alternatives" action button
 * - Animated reason reveals with staggered timing
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  Heart,
  Utensils,
  Palette,
  Mountain,
  Wine,
  Users,
  Leaf,
  Moon,
  Coffee,
  Landmark,
  Camera,
  X,
  Check,
  RefreshCw,
  Accessibility,
  Wallet,
  Gauge,
  Star,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MatchReason } from '../../../stores/spotlightStoreV2';

// Enhanced reason type from backend (Phase 3)
export interface EnhancedMatchReason {
  category: 'occasion' | 'dietary' | 'accessibility' | 'style' | 'interests' | 'pace' | 'budget';
  text: string;
  icon?: string;
  confidence?: number; // 0-1
}

// Full personalization match data from backend
export interface PersonalizationMatch {
  score: number; // Overall match score (0-100)
  reasons: EnhancedMatchReason[];
}

interface WhyThisCardProps {
  matchReasons?: MatchReason[];
  matchScore?: number;
  placeName: string;
  variant?: 'badge' | 'inline' | 'floating';
  className?: string;
  // Enhanced props for Phase 3
  personalizationMatch?: PersonalizationMatch;
  onFindAlternatives?: () => void;
}

// Category config for enhanced reasons (Phase 3)
const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
  occasion: { icon: Heart, color: '#C45830', bg: '#FEF3EE', label: 'Occasion' },
  dietary: { icon: Leaf, color: '#4A7C59', bg: '#E8F4E8', label: 'Dietary' },
  accessibility: { icon: Accessibility, color: '#4A90A4', bg: '#E8F4F7', label: 'Accessibility' },
  style: { icon: Sparkles, color: '#8B6914', bg: '#FEF8E8', label: 'Style' },
  interests: { icon: Star, color: '#D4A853', bg: '#FEF8E8', label: 'Interest' },
  pace: { icon: Gauge, color: '#8B7355', bg: '#F5F0E8', label: 'Pace' },
  budget: { icon: Wallet, color: '#4A7C59', bg: '#E8F4E8', label: 'Budget' },
};

// Map factor types to icons and colors
const FACTOR_CONFIG: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  // Interests
  interest_art: { icon: Palette, color: '#8B6914', label: 'Art interest' },
  interest_history: { icon: Landmark, color: '#8B6914', label: 'History interest' },
  interest_nature: { icon: Leaf, color: '#4A7C59', label: 'Nature interest' },
  interest_food: { icon: Utensils, color: '#8B3A3A', label: 'Food interest' },
  interest_wine: { icon: Wine, color: '#8B3A3A', label: 'Wine interest' },
  interest_adventure: { icon: Mountain, color: '#3A6247', label: 'Adventure interest' },
  interest_photography: { icon: Camera, color: '#8B6914', label: 'Photography interest' },
  interest_nightlife: { icon: Moon, color: '#4A4A8B', label: 'Nightlife interest' },
  interest_wellness: { icon: Heart, color: '#C45830', label: 'Wellness interest' },

  // Occasions
  occasion_honeymoon: { icon: Heart, color: '#C45830', label: 'Perfect for honeymoon' },
  occasion_anniversary: { icon: Heart, color: '#C45830', label: 'Great for anniversary' },
  occasion_birthday: { icon: Sparkles, color: '#D4A853', label: 'Birthday celebration' },
  occasion_romantic: { icon: Heart, color: '#C45830', label: 'Romantic setting' },
  occasion_family: { icon: Users, color: '#4A7C59', label: 'Family-friendly' },
  occasion_solo: { icon: Landmark, color: '#4A90A4', label: 'Solo traveler friendly' },

  // Dining
  dining_fine: { icon: Sparkles, color: '#D4A853', label: 'Fine dining' },
  dining_casual: { icon: Coffee, color: '#8B7355', label: 'Casual atmosphere' },
  dining_street: { icon: Utensils, color: '#8B3A3A', label: 'Street food experience' },
  dining_local: { icon: Utensils, color: '#8B3A3A', label: 'Local cuisine' },

  // Preferences
  avoid_crowds: { icon: Users, color: '#4A90A4', label: 'Off the beaten path' },
  prefer_outdoor: { icon: Leaf, color: '#4A7C59', label: 'Outdoor setting' },
  budget_friendly: { icon: Check, color: '#4A7C59', label: 'Budget-friendly' },
  luxury: { icon: Sparkles, color: '#D4A853', label: 'Luxury experience' },

  // Default
  default: { icon: Sparkles, color: '#C45830', label: 'Matched preference' },
};

function getFactorConfig(factor: string) {
  return FACTOR_CONFIG[factor] || FACTOR_CONFIG['default'];
}

export function WhyThisCard({
  matchReasons,
  matchScore,
  placeName,
  variant = 'badge',
  className = '',
  personalizationMatch,
  onFindAlternatives,
}: WhyThisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Use enhanced data if available, otherwise fall back to legacy
  const effectiveScore = personalizationMatch?.score ?? matchScore;
  const hasEnhancedReasons = personalizationMatch?.reasons && personalizationMatch.reasons.length > 0;

  // Don't render if no match reasons
  if (!matchReasons?.length && !hasEnhancedReasons) {
    return null;
  }

  // Calculate overall sentiment based on score
  const scoreLabel = effectiveScore && effectiveScore >= 80 ? 'Excellent match' :
                     effectiveScore && effectiveScore >= 60 ? 'Great match' :
                     effectiveScore && effectiveScore >= 40 ? 'Good match' : 'Matches your style';

  if (variant === 'badge') {
    return (
      <div className={`relative ${className}`}>
        {/* Compact badge */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="group flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)',
            border: '1px solid rgba(196, 88, 48, 0.2)',
            backdropFilter: 'blur(8px)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Sparkles className="h-3 w-3" style={{ color: '#C45830' }} />
          <span className="text-[10px] font-semibold" style={{ color: '#C45830' }}>
            {effectiveScore ? `${effectiveScore}% match` : 'Why this?'}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-2.5 w-2.5" style={{ color: '#8B7355' }} />
          </motion.div>
        </motion.button>

        {/* Expanded panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.15, 0.5, 0.5, 1] }}
              className="absolute top-full left-0 z-50 mt-2 w-64 overflow-hidden rounded-xl shadow-lg"
              style={{
                background: 'linear-gradient(180deg, #FFFBF5 0%, #FAF7F2 100%)',
                border: '1px solid rgba(139, 115, 85, 0.15)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-3 py-2.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.08) 0%, rgba(212, 168, 83, 0.08) 100%)',
                  borderBottom: '1px solid rgba(139, 115, 85, 0.1)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: '#C45830' }} />
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: '#2C2417',
                      fontFamily: "'Fraunces', Georgia, serif",
                    }}
                  >
                    Why {placeName}?
                  </span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="rounded-full p-1 transition-colors hover:bg-black/5"
                >
                  <X className="h-3 w-3" style={{ color: '#8B7355' }} />
                </button>
              </div>

              {/* Match score indicator */}
              {effectiveScore && (
                <div className="px-3 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: '#8B7355' }}>{scoreLabel}</span>
                    <span
                      className="font-semibold"
                      style={{ color: '#C45830' }}
                    >
                      {effectiveScore}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${effectiveScore}%` }}
                      transition={{ duration: 0.5, delay: 0.1, ease: [0.15, 0.5, 0.5, 1] }}
                      className="h-full rounded-full"
                      style={{
                        background: effectiveScore >= 80
                          ? 'linear-gradient(90deg, #C45830 0%, #D4A853 100%)'
                          : effectiveScore >= 60
                            ? 'linear-gradient(90deg, #D4A853 0%, #8B6914 100%)'
                            : '#8B7355',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Match reasons - Enhanced or Legacy */}
              <div className="space-y-2 p-3">
                {/* Enhanced reasons with category badges (Phase 3) */}
                {hasEnhancedReasons ? (
                  personalizationMatch!.reasons.slice(0, 4).map((reason, idx) => {
                    const catConfig = CATEGORY_CONFIG[reason.category] || CATEGORY_CONFIG['style'];
                    const Icon = catConfig.icon;

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        className="flex items-start gap-2"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                            style={{ background: catConfig.bg }}
                          >
                            <Icon className="h-2.5 w-2.5" style={{ color: catConfig.color }} />
                          </div>
                          <span
                            className="text-[8px] font-medium uppercase tracking-wider"
                            style={{ color: catConfig.color }}
                          >
                            {catConfig.label}
                          </span>
                        </div>
                        <p
                          className="flex-1 text-xs leading-relaxed"
                          style={{
                            color: '#5C4D3D',
                            fontFamily: "'Satoshi', sans-serif",
                          }}
                        >
                          {reason.text}
                        </p>
                      </motion.div>
                    );
                  })
                ) : (
                  /* Legacy reasons */
                  matchReasons?.slice(0, 4).map((reason, idx) => {
                    const config = getFactorConfig(reason.factor);
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        className="flex items-start gap-2"
                      >
                        <div
                          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ background: `${config.color}15` }}
                        >
                          <Icon className="h-2.5 w-2.5" style={{ color: config.color }} />
                        </div>
                        <p
                          className="text-xs leading-relaxed"
                          style={{
                            color: '#5C4D3D',
                            fontFamily: "'Satoshi', sans-serif",
                          }}
                        >
                          {reason.explanation}
                        </p>
                      </motion.div>
                    );
                  })
                )}

                {/* More reasons indicator */}
                {((hasEnhancedReasons && personalizationMatch!.reasons.length > 4) ||
                  (!hasEnhancedReasons && matchReasons && matchReasons.length > 4)) && (
                  <p className="text-[10px] text-center" style={{ color: '#8B7355' }}>
                    +{(hasEnhancedReasons ? personalizationMatch!.reasons.length : matchReasons!.length) - 4} more reasons
                  </p>
                )}
              </div>

              {/* Footer with Find Alternatives button */}
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{
                  background: '#FAF7F2',
                  borderTop: '1px solid rgba(139, 115, 85, 0.1)',
                }}
              >
                <p className="text-[10px]" style={{ color: '#8B7355' }}>
                  Selected based on your preferences
                </p>
                {onFindAlternatives && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFindAlternatives();
                    }}
                    className="flex items-center gap-1 text-[10px] font-medium"
                    style={{ color: '#C45830' }}
                    whileHover={{ x: 2 }}
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    Find alternatives
                    <ChevronRight className="h-2.5 w-2.5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Inline variant - shows directly in the card
  if (variant === 'inline') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-3 ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.06) 0%, rgba(212, 168, 83, 0.06) 100%)',
          border: '1px solid rgba(196, 88, 48, 0.12)',
        }}
      >
        {/* Header with score */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" style={{ color: '#C45830' }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: '#C45830' }}
            >
              Why this pick
            </span>
          </div>
          {effectiveScore && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: 'rgba(196, 88, 48, 0.15)',
                color: '#C45830',
              }}
            >
              {effectiveScore}% match
            </span>
          )}
        </div>

        {/* Reasons list - Enhanced or Legacy */}
        <div className="space-y-1.5">
          {hasEnhancedReasons ? (
            personalizationMatch!.reasons.slice(0, 3).map((reason, idx) => {
              const catConfig = CATEGORY_CONFIG[reason.category] || CATEGORY_CONFIG['style'];
              const Icon = catConfig.icon;

              return (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: catConfig.bg }}
                  >
                    <Icon className="h-2.5 w-2.5" style={{ color: catConfig.color }} />
                  </div>
                  <span
                    className="text-[11px] leading-tight"
                    style={{ color: '#5C4D3D' }}
                  >
                    {reason.text}
                  </span>
                </div>
              );
            })
          ) : (
            matchReasons?.slice(0, 3).map((reason, idx) => {
              const config = getFactorConfig(reason.factor);
              const Icon = config.icon;

              return (
                <div key={idx} className="flex items-center gap-2">
                  <Icon className="h-3 w-3 flex-shrink-0" style={{ color: config.color }} />
                  <span
                    className="text-[11px] leading-tight"
                    style={{ color: '#5C4D3D' }}
                  >
                    {reason.explanation}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Find alternatives link for inline variant */}
        {onFindAlternatives && (
          <motion.button
            onClick={onFindAlternatives}
            className="mt-2 flex items-center gap-1 text-[10px] font-medium"
            style={{ color: '#C45830' }}
            whileHover={{ x: 2 }}
          >
            Not quite right?
            <ChevronRight className="h-2.5 w-2.5" />
          </motion.button>
        )}
      </motion.div>
    );
  }

  // Floating variant - absolute positioned overlay
  const floatingReason = hasEnhancedReasons
    ? personalizationMatch!.reasons[0]?.text
    : matchReasons?.[0]?.explanation;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute bottom-2 left-2 right-2 rounded-lg p-2 ${className}`}
      style={{
        background: 'rgba(255, 251, 245, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(196, 88, 48, 0.15)',
        boxShadow: '0 4px 12px rgba(44, 36, 23, 0.1)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'rgba(196, 88, 48, 0.1)' }}
        >
          <Sparkles className="h-3 w-3" style={{ color: '#C45830' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[10px] font-medium"
            style={{ color: '#C45830' }}
          >
            {effectiveScore ? `${effectiveScore}% match` : 'Matches your style'}
          </p>
          <p
            className="truncate text-[10px]"
            style={{ color: '#8B7355' }}
          >
            {floatingReason || 'Selected for you'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default WhyThisCard;
