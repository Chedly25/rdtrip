/**
 * Match Score Indicator
 *
 * A visual progress bar/percentage showing how well an activity
 * or restaurant matches the user's preferences. Can be displayed
 * in different sizes and with optional label.
 *
 * Design: Gradient progress bar with warm colors reflecting
 * the match quality (terracotta to gold for high matches).
 *
 * Enhanced Features (Phase 3):
 * - Score breakdown by category
 * - Expandable tooltip showing contribution from each preference
 * - Category-specific icons and colors
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Leaf,
  Accessibility,
  Gauge,
  Wallet,
  Star,
  ChevronDown,
  Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Score breakdown by category (from backend)
export interface ScoreBreakdown {
  category: 'occasion' | 'dietary' | 'accessibility' | 'interests' | 'pace' | 'budget' | 'style';
  label: string;
  score: number; // 0-100
  weight: number; // How much this contributes to overall score
}

interface MatchScoreIndicatorProps {
  score: number;              // 0-100
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  variant?: 'bar' | 'badge' | 'circular' | 'detailed';
  className?: string;
  // Enhanced props for Phase 3
  breakdown?: ScoreBreakdown[];
  showBreakdownOnHover?: boolean;
}

// Get color gradient based on score
function getScoreColors(score: number) {
  if (score >= 80) {
    return {
      gradient: 'linear-gradient(90deg, #C45830 0%, #D4A853 100%)',
      text: '#C45830',
      bg: 'rgba(196, 88, 48, 0.1)',
      label: 'Excellent match',
    };
  }
  if (score >= 60) {
    return {
      gradient: 'linear-gradient(90deg, #D4A853 0%, #8B6914 100%)',
      text: '#8B6914',
      bg: 'rgba(212, 168, 83, 0.1)',
      label: 'Great match',
    };
  }
  if (score >= 40) {
    return {
      gradient: 'linear-gradient(90deg, #8B7355 0%, #A09080 100%)',
      text: '#8B7355',
      bg: 'rgba(139, 115, 85, 0.1)',
      label: 'Good match',
    };
  }
  return {
    gradient: 'linear-gradient(90deg, #A09080 0%, #C4B8A8 100%)',
    text: '#8B7355',
    bg: 'rgba(139, 115, 85, 0.08)',
    label: 'Matches your style',
  };
}

// Category configuration for breakdown display
const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  occasion: { icon: Heart, color: '#C45830', bg: '#FEF3EE' },
  dietary: { icon: Leaf, color: '#4A7C59', bg: '#E8F4E8' },
  accessibility: { icon: Accessibility, color: '#4A90A4', bg: '#E8F4F7' },
  interests: { icon: Star, color: '#D4A853', bg: '#FEF8E8' },
  pace: { icon: Gauge, color: '#8B7355', bg: '#F5F0E8' },
  budget: { icon: Wallet, color: '#4A7C59', bg: '#E8F4E8' },
  style: { icon: Sparkles, color: '#8B6914', bg: '#FEF8E8' },
};

// Size configurations
const SIZE_CONFIG = {
  xs: {
    height: 'h-1',
    text: 'text-[10px]',
    icon: 'h-2.5 w-2.5',
    padding: 'px-1.5 py-0.5',
    gap: 'gap-1',
  },
  sm: {
    height: 'h-1.5',
    text: 'text-xs',
    icon: 'h-3 w-3',
    padding: 'px-2 py-1',
    gap: 'gap-1.5',
  },
  md: {
    height: 'h-2',
    text: 'text-sm',
    icon: 'h-3.5 w-3.5',
    padding: 'px-2.5 py-1.5',
    gap: 'gap-2',
  },
  lg: {
    height: 'h-3',
    text: 'text-base',
    icon: 'h-4 w-4',
    padding: 'px-3 py-2',
    gap: 'gap-2',
  },
};

export function MatchScoreIndicator({
  score,
  size = 'sm',
  showLabel = false,
  showIcon = true,
  variant = 'bar',
  className = '',
  breakdown,
  showBreakdownOnHover = false,
}: MatchScoreIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = getScoreColors(score);
  const sizeConfig = SIZE_CONFIG[size];

  // Detailed variant with breakdown
  if (variant === 'detailed') {
    return (
      <div className={`${className}`}>
        {/* Main score display with expand button */}
        <div
          className="relative"
          onMouseEnter={() => showBreakdownOnHover && setShowTooltip(true)}
          onMouseLeave={() => showBreakdownOnHover && setShowTooltip(false)}
        >
          <motion.button
            onClick={() => !showBreakdownOnHover && setShowTooltip(!showTooltip)}
            className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.08) 0%, rgba(212, 168, 83, 0.08) 100%)',
              border: '1px solid rgba(196, 88, 48, 0.15)',
            }}
            whileHover={{ borderColor: 'rgba(196, 88, 48, 0.3)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: colors.bg }}
              >
                <Sparkles className="h-4 w-4" style={{ color: colors.text }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: '#2C2417' }}>
                  {score}% match
                </p>
                <p className="text-xs" style={{ color: '#8B7355' }}>
                  {colors.label}
                </p>
              </div>
            </div>

            {breakdown && breakdown.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" style={{ color: '#8B7355' }} />
                <motion.div
                  animate={{ rotate: showTooltip ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-3.5 w-3.5" style={{ color: '#8B7355' }} />
                </motion.div>
              </div>
            )}
          </motion.button>

          {/* Progress bar */}
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full"
            style={{ background: 'rgba(139, 115, 85, 0.1)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.6, ease: [0.15, 0.5, 0.5, 1] }}
              className="h-full rounded-full"
              style={{ background: colors.gradient }}
            />
          </div>

          {/* Breakdown tooltip */}
          <AnimatePresence>
            {showTooltip && breakdown && breakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl shadow-lg"
                style={{
                  background: 'linear-gradient(180deg, #FFFBF5 0%, #FAF7F2 100%)',
                  border: '1px solid rgba(139, 115, 85, 0.15)',
                }}
              >
                <div
                  className="px-3 py-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.06) 0%, rgba(212, 168, 83, 0.06) 100%)',
                    borderBottom: '1px solid rgba(139, 115, 85, 0.1)',
                  }}
                >
                  <p
                    className="text-xs font-semibold"
                    style={{
                      color: '#2C2417',
                      fontFamily: "'Fraunces', Georgia, serif",
                    }}
                  >
                    Score Breakdown
                  </p>
                </div>

                <div className="p-3 space-y-3">
                  {breakdown.map((item, idx) => {
                    const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG['style'];
                    const Icon = catConfig.icon;
                    const itemColors = getScoreColors(item.score);

                    return (
                      <motion.div
                        key={item.category}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
                          style={{ background: catConfig.bg }}
                        >
                          <Icon className="h-3 w-3" style={{ color: catConfig.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium" style={{ color: '#5C4D3D' }}>
                              {item.label}
                            </span>
                            <span
                              className="text-xs font-semibold"
                              style={{ color: itemColors.text }}
                            >
                              {item.score}%
                            </span>
                          </div>
                          <div
                            className="h-1 w-full overflow-hidden rounded-full"
                            style={{ background: 'rgba(139, 115, 85, 0.1)' }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.score}%` }}
                              transition={{ duration: 0.4, delay: 0.1 + idx * 0.05 }}
                              className="h-full rounded-full"
                              style={{ background: itemColors.gradient }}
                            />
                          </div>
                        </div>

                        {/* Weight indicator */}
                        <span
                          className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(139, 115, 85, 0.08)',
                            color: '#8B7355',
                          }}
                        >
                          {Math.round(item.weight * 100)}%
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div
                  className="px-3 py-2 text-center"
                  style={{
                    background: '#FAF7F2',
                    borderTop: '1px solid rgba(139, 115, 85, 0.1)',
                  }}
                >
                  <p className="text-[10px]" style={{ color: '#8B7355' }}>
                    Percentages show category contribution
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Badge variant - compact pill with percentage
  if (variant === 'badge') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center ${sizeConfig.gap} rounded-full ${sizeConfig.padding} ${className}`}
        style={{ background: colors.bg }}
      >
        {showIcon && (
          <Sparkles className={sizeConfig.icon} style={{ color: colors.text }} />
        )}
        <span
          className={`font-semibold ${sizeConfig.text}`}
          style={{ color: colors.text }}
        >
          {score}%
        </span>
        {showLabel && (
          <span
            className={`${sizeConfig.text} font-medium`}
            style={{ color: colors.text, opacity: 0.8 }}
          >
            match
          </span>
        )}
      </motion.div>
    );
  }

  // Circular variant - radial progress
  if (variant === 'circular') {
    const circumference = 2 * Math.PI * 18; // radius = 18
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative inline-flex items-center justify-center ${className}`}
      >
        <svg
          className={size === 'lg' ? 'h-16 w-16' : size === 'md' ? 'h-12 w-12' : 'h-10 w-10'}
          viewBox="0 0 44 44"
        >
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="rgba(139, 115, 85, 0.1)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <motion.circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="url(#matchGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: [0.15, 0.5, 0.5, 1] }}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
            }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C45830" />
              <stop offset="100%" stopColor="#D4A853" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold ${size === 'lg' ? 'text-lg' : size === 'md' ? 'text-base' : 'text-sm'}`}
            style={{ color: colors.text }}
          >
            {score}
          </span>
          {showLabel && (
            <span className="text-[8px] uppercase tracking-wider text-[#8B7355]">
              match
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Default bar variant
  return (
    <div className={`${className}`}>
      {/* Label row */}
      {showLabel && (
        <div className={`mb-1.5 flex items-center justify-between ${sizeConfig.gap}`}>
          <div className={`flex items-center ${sizeConfig.gap}`}>
            {showIcon && (
              <Sparkles className={sizeConfig.icon} style={{ color: colors.text }} />
            )}
            <span
              className={`font-medium ${sizeConfig.text}`}
              style={{ color: '#5C4D3D' }}
            >
              {colors.label}
            </span>
          </div>
          <span
            className={`font-semibold ${sizeConfig.text}`}
            style={{ color: colors.text }}
          >
            {score}%
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div
        className={`relative w-full overflow-hidden rounded-full ${sizeConfig.height}`}
        style={{ background: 'rgba(139, 115, 85, 0.1)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: [0.15, 0.5, 0.5, 1] }}
          className={`absolute inset-y-0 left-0 rounded-full ${sizeConfig.height}`}
          style={{ background: colors.gradient }}
        />
      </div>

      {/* Inline percentage (when no label) */}
      {!showLabel && (
        <div className={`mt-1 flex items-center ${sizeConfig.gap}`}>
          {showIcon && (
            <Sparkles className={sizeConfig.icon} style={{ color: colors.text }} />
          )}
          <span
            className={`font-semibold ${sizeConfig.text}`}
            style={{ color: colors.text }}
          >
            {score}% match
          </span>
        </div>
      )}
    </div>
  );
}

export default MatchScoreIndicator;
