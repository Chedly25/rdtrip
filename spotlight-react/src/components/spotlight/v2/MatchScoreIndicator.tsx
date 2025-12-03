/**
 * Match Score Indicator
 *
 * A visual progress bar/percentage showing how well an activity
 * or restaurant matches the user's preferences. Can be displayed
 * in different sizes and with optional label.
 *
 * Design: Gradient progress bar with warm colors reflecting
 * the match quality (terracotta to gold for high matches).
 */

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface MatchScoreIndicatorProps {
  score: number;              // 0-100
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  variant?: 'bar' | 'badge' | 'circular';
  className?: string;
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
}: MatchScoreIndicatorProps) {
  const colors = getScoreColors(score);
  const sizeConfig = SIZE_CONFIG[size];

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
