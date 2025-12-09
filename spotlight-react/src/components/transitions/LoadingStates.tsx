/**
 * LoadingStates
 *
 * WI-11.4: Unified loading state components
 *
 * Provides consistent, polished loading experiences:
 * - Spinners (inline, button, page)
 * - Skeletons (shimmer effect)
 * - Overlays (blocking operations)
 * - Inline indicators (non-blocking feedback)
 *
 * Design Philosophy:
 * - Premium editorial feel matching Waycraft aesthetic
 * - Subtle animations that feel fast, not sluggish
 * - RUI design system colors and spacing
 * - Accessible with proper ARIA attributes
 */

import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode } from 'react';
import { EASING, DURATION } from './CardAnimations';

// ============================================================================
// Spinner Component
// ============================================================================

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'default' | 'accent' | 'white' | 'muted';

export interface SpinnerProps {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Color variant */
  variant?: SpinnerVariant;
  /** Custom className */
  className?: string;
  /** Accessible label */
  label?: string;
}

const spinnerSizes: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
  xl: 'w-12 h-12 border-[3px]',
};

const spinnerColors: Record<SpinnerVariant, string> = {
  default: 'border-rui-grey-20 border-t-rui-accent',
  accent: 'border-rui-accent/20 border-t-rui-accent',
  white: 'border-white/30 border-t-white',
  muted: 'border-rui-grey-10 border-t-rui-grey-40',
};

/**
 * Spinner
 *
 * Animated loading spinner with size and color variants.
 *
 * @example
 * // Button loading state
 * <button disabled={loading}>
 *   {loading ? <Spinner size="sm" variant="white" /> : 'Submit'}
 * </button>
 *
 * @example
 * // Inline loading
 * <Spinner size="md" label="Loading data..." />
 */
export function Spinner({
  size = 'md',
  variant = 'default',
  className = '',
  label,
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label || 'Loading'}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'linear',
        }}
        className={`
          rounded-full
          ${spinnerSizes[size]}
          ${spinnerColors[variant]}
        `}
      />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

// ============================================================================
// Dots Loading Indicator
// ============================================================================

export interface LoadingDotsProps {
  /** Size of dots */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: SpinnerVariant;
  /** Custom className */
  className?: string;
}

const dotSizes = {
  sm: 'w-1 h-1',
  md: 'w-1.5 h-1.5',
  lg: 'w-2 h-2',
};

const dotColors: Record<SpinnerVariant, string> = {
  default: 'bg-rui-grey-40',
  accent: 'bg-rui-accent',
  white: 'bg-white',
  muted: 'bg-rui-grey-20',
};

/**
 * LoadingDots
 *
 * Three bouncing dots for inline loading indication.
 * Great for chat messages or typing indicators.
 */
export function LoadingDots({
  size = 'md',
  variant = 'default',
  className = '',
}: LoadingDotsProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
          className={`rounded-full ${dotSizes[size]} ${dotColors[variant]}`}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

// ============================================================================
// Shimmer Effect (Base for Skeletons)
// ============================================================================

export interface ShimmerProps {
  /** Width (CSS value) */
  width?: string | number;
  /** Height (CSS value) */
  height?: string | number;
  /** Border radius preset */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Custom className */
  className?: string;
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

/**
 * Shimmer
 *
 * Base shimmer effect component for building skeletons.
 * Uses a smooth gradient sweep animation.
 */
export function Shimmer({
  width = '100%',
  height = 16,
  rounded = 'md',
  className = '',
}: ShimmerProps) {
  return (
    <motion.div
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={`
        bg-gradient-to-r from-rui-grey-5 via-rui-grey-10 via-50% to-rui-grey-5
        bg-[length:200%_100%]
        ${roundedClasses[rounded]}
        ${className}
      `}
      style={{ width, height }}
    />
  );
}

// ============================================================================
// Skeleton Text
// ============================================================================

export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Gap between lines */
  gap?: 'sm' | 'md' | 'lg';
  /** Last line width percentage */
  lastLineWidth?: number;
  /** Custom className */
  className?: string;
}

const gapClasses = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

/**
 * SkeletonText
 *
 * Multi-line text skeleton with staggered widths.
 */
export function SkeletonText({
  lines = 3,
  gap = 'md',
  lastLineWidth = 60,
  className = '',
}: SkeletonTextProps) {
  return (
    <div className={`flex flex-col ${gapClasses[gap]} ${className}`}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1;
        const width = isLast ? `${lastLineWidth}%` : '100%';
        return (
          <Shimmer
            key={i}
            width={width}
            height={14}
            rounded="sm"
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Content Skeleton Presets
// ============================================================================

/**
 * SkeletonAvatar
 *
 * Circular avatar placeholder.
 */
export function SkeletonAvatar({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Shimmer
      width={size}
      height={size}
      rounded="full"
      className={className}
    />
  );
}

/**
 * SkeletonButton
 *
 * Button placeholder with configurable size.
 */
export function SkeletonButton({
  width = 100,
  size = 'md',
  className = '',
}: {
  width?: number | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const heights = { sm: 32, md: 40, lg: 48 };
  return (
    <Shimmer
      width={width}
      height={heights[size]}
      rounded="xl"
      className={className}
    />
  );
}

/**
 * SkeletonImage
 *
 * Image placeholder with aspect ratio support.
 */
export function SkeletonImage({
  aspectRatio = '16/9',
  rounded = 'xl',
  className = '',
}: {
  aspectRatio?: string;
  rounded?: ShimmerProps['rounded'];
  className?: string;
}) {
  return (
    <div
      className={`relative w-full ${className}`}
      style={{ aspectRatio }}
    >
      <Shimmer
        width="100%"
        height="100%"
        rounded={rounded}
        className="absolute inset-0"
      />
    </div>
  );
}

// ============================================================================
// Loading Overlay
// ============================================================================

export interface LoadingOverlayProps {
  /** Whether overlay is visible */
  isLoading: boolean;
  /** Loading message */
  message?: string;
  /** Spinner size */
  spinnerSize?: SpinnerSize;
  /** Background blur intensity */
  blur?: 'none' | 'sm' | 'md' | 'lg';
  /** Children to render behind overlay */
  children?: ReactNode;
  /** Custom className */
  className?: string;
}

const blurClasses = {
  none: '',
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
};

/**
 * LoadingOverlay
 *
 * Full-coverage loading overlay for blocking operations.
 * Animates in/out smoothly.
 *
 * @example
 * <LoadingOverlay isLoading={saving} message="Saving changes...">
 *   <FormContent />
 * </LoadingOverlay>
 */
export function LoadingOverlay({
  isLoading,
  message,
  spinnerSize = 'lg',
  blur = 'sm',
  children,
  className = '',
}: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            className={`
              absolute inset-0 z-50
              flex flex-col items-center justify-center
              bg-rui-white/80 ${blurClasses[blur]}
              rounded-inherit
            `}
          >
            <Spinner size={spinnerSize} variant="accent" />
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 text-body-2 text-rui-grey-50"
              >
                {message}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Inline Loading Indicator
// ============================================================================

export interface InlineLoadingProps {
  /** Whether loading */
  isLoading: boolean;
  /** Loading text */
  text?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Custom className */
  className?: string;
}

/**
 * InlineLoading
 *
 * Non-blocking inline loading indicator with text.
 * Great for refresh buttons or form submissions.
 */
export function InlineLoading({
  isLoading,
  text = 'Loading...',
  size = 'sm',
  className = '',
}: InlineLoadingProps) {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        inline-flex items-center gap-2
        ${size === 'sm' ? 'text-body-3' : 'text-body-2'}
        text-rui-grey-50
        ${className}
      `}
    >
      <Spinner size={size === 'sm' ? 'xs' : 'sm'} variant="muted" />
      <span>{text}</span>
    </motion.div>
  );
}

// ============================================================================
// Page Loading Screen
// ============================================================================

export interface PageLoadingProps {
  /** Loading message */
  message?: string;
  /** Show progress ring */
  showProgress?: boolean;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Custom className */
  className?: string;
}

/**
 * PageLoading
 *
 * Full-page loading screen with optional progress.
 * Premium editorial feel for major transitions.
 */
export function PageLoading({
  message = 'Loading...',
  showProgress = false,
  progress = 0,
  className = '',
}: PageLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`
        fixed inset-0 z-50
        flex flex-col items-center justify-center
        bg-rui-cream
        ${className}
      `}
    >
      {/* Animated orb */}
      <div className="relative w-24 h-24 mb-8">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-rui-accent/20"
        />

        {/* Inner ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 rounded-full border-2 border-dashed border-rui-golden/30"
        />

        {/* Center orb */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-4 rounded-full bg-gradient-to-br from-rui-accent to-rui-golden shadow-lg"
        />

        {/* Progress ring (optional) */}
        {showProgress && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-rui-accent"
              strokeDasharray={276}
              strokeDashoffset={276 - (276 * progress) / 100}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
        )}
      </div>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-body-1 text-rui-grey-60 font-display"
      >
        {message}
      </motion.p>

      {/* Progress percentage */}
      {showProgress && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-body-2 text-rui-grey-40"
        >
          {Math.round(progress)}%
        </motion.p>
      )}
    </motion.div>
  );
}

// ============================================================================
// Card Loading Skeleton (Using CardAnimations system)
// ============================================================================

export interface CardLoadingProps {
  /** Card variant */
  variant?: 'default' | 'horizontal' | 'compact';
  /** Show image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  textLines?: number;
  /** Show action buttons */
  showActions?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * CardLoading
 *
 * Pre-built card skeleton matching common card layouts.
 * Uses RUI design tokens for consistency.
 */
export function CardLoading({
  variant = 'default',
  showImage = true,
  textLines = 2,
  showActions = false,
  className = '',
}: CardLoadingProps) {
  if (variant === 'horizontal') {
    return (
      <div
        className={`
          flex items-start gap-3 p-rui-16
          bg-rui-white rounded-rui-16
          border border-rui-grey-10
          ${className}
        `}
      >
        {showImage && <Shimmer width={64} height={64} rounded="lg" />}
        <div className="flex-1 space-y-2">
          <Shimmer width="70%" height={18} rounded="sm" />
          <SkeletonText lines={textLines} gap="sm" lastLineWidth={50} />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`
          flex items-center gap-3 p-rui-12
          bg-rui-white rounded-rui-12
          border border-rui-grey-10
          ${className}
        `}
      >
        {showImage && <Shimmer width={40} height={40} rounded="lg" />}
        <div className="flex-1">
          <Shimmer width="60%" height={14} rounded="sm" />
        </div>
        <Shimmer width={24} height={24} rounded="md" />
      </div>
    );
  }

  // Default vertical card
  return (
    <div
      className={`
        bg-rui-white rounded-rui-16
        border border-rui-grey-10
        overflow-hidden
        ${className}
      `}
    >
      {showImage && (
        <SkeletonImage aspectRatio="16/10" rounded="none" />
      )}
      <div className="p-rui-16 space-y-3">
        <Shimmer width="75%" height={20} rounded="sm" />
        <SkeletonText lines={textLines} gap="sm" lastLineWidth={40} />
        {showActions && (
          <div className="flex gap-2 pt-2">
            <SkeletonButton width={100} size="sm" />
            <SkeletonButton width={80} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// List Loading Skeleton
// ============================================================================

export interface ListLoadingProps {
  /** Number of items */
  count?: number;
  /** Card variant */
  cardVariant?: CardLoadingProps['variant'];
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

const listGaps = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

/**
 * ListLoading
 *
 * Multiple card skeletons for list views.
 */
export function ListLoading({
  count = 3,
  cardVariant = 'horizontal',
  gap = 'md',
  className = '',
}: ListLoadingProps) {
  return (
    <div className={`flex flex-col ${listGaps[gap]} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.05,
            duration: DURATION.fast,
            ease: EASING.smooth,
          }}
        >
          <CardLoading variant={cardVariant} />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// Button Loading State Helper
// ============================================================================

export interface ButtonLoadingContentProps {
  /** Whether button is loading */
  isLoading: boolean;
  /** Default content */
  children: ReactNode;
  /** Loading text (optional) */
  loadingText?: string;
  /** Spinner variant */
  spinnerVariant?: SpinnerVariant;
}

/**
 * ButtonLoadingContent
 *
 * Helper component for button loading states.
 * Swaps content with spinner when loading.
 */
export function ButtonLoadingContent({
  isLoading,
  children,
  loadingText,
  spinnerVariant = 'white',
}: ButtonLoadingContentProps) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2">
        <Spinner size="sm" variant={spinnerVariant} />
        {loadingText && <span>{loadingText}</span>}
      </span>
    );
  }

  return <>{children}</>;
}

export default Spinner;
