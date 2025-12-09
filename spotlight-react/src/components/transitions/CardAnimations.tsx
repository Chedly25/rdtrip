/**
 * CardAnimations
 *
 * WI-11.3: Reusable card animation presets and components
 *
 * Provides consistent, polished card animations across the app:
 * - Entry animations (fade, slide, scale)
 * - Hover effects (lift, glow, grow)
 * - Press feedback
 * - Skeleton loading states
 *
 * Design Philosophy:
 * - Subtle and premium - never distracting
 * - Performance-optimized with will-change hints
 * - Composable - mix and match as needed
 * - Accessible - respects reduced motion preferences
 */

import { motion, type Variants, type Transition, type HTMLMotionProps, type TargetAndTransition } from 'framer-motion';
import { type ReactNode, forwardRef } from 'react';

// ============================================================================
// Animation Configuration
// ============================================================================

/**
 * Base easing curves matching RUI design system
 */
export const EASING = {
  // Smooth deceleration - natural feel for entrances
  smooth: [0.23, 1, 0.32, 1] as const,
  // Gentle bounce - playful micro-interactions
  bounce: [0.34, 1.56, 0.64, 1] as const,
  // Quick - snappy feedback
  quick: [0.4, 0, 0.2, 1] as const,
  // Emphasized - attention-grabbing
  emphasized: [0.2, 0, 0, 1] as const,
};

/**
 * Standard durations in seconds
 */
export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  gentle: 0.4,
};

// ============================================================================
// Entry Animation Variants
// ============================================================================

export type CardEntryVariant =
  | 'fadeIn'
  | 'slideUp'
  | 'slideRight'
  | 'slideLeft'
  | 'scaleUp'
  | 'popIn'
  | 'none';

const entryVariants: Record<CardEntryVariant, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -16 },
    visible: { opacity: 1, x: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 16 },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
  popIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
  },
  none: {
    hidden: {},
    visible: {},
  },
};

// ============================================================================
// Hover Effect Presets
// ============================================================================

export type CardHoverEffect =
  | 'lift'
  | 'glow'
  | 'grow'
  | 'tilt'
  | 'none';

interface HoverConfig {
  whileHover: TargetAndTransition;
  transition?: Transition;
}

const hoverEffects: Record<CardHoverEffect, HoverConfig> = {
  lift: {
    whileHover: {
      y: -4,
      boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.04)',
    },
    transition: { duration: DURATION.fast, ease: EASING.quick },
  },
  glow: {
    whileHover: {
      boxShadow: '0 0 24px -4px rgba(196, 88, 48, 0.3), 0 8px 16px -8px rgba(0, 0, 0, 0.1)',
    },
    transition: { duration: DURATION.normal },
  },
  grow: {
    whileHover: {
      scale: 1.02,
    },
    transition: { duration: DURATION.fast, ease: EASING.bounce },
  },
  tilt: {
    whileHover: {
      y: -2,
      rotateX: -2,
      rotateY: 2,
    },
    transition: { duration: DURATION.normal },
  },
  none: {
    whileHover: {},
  },
};

// ============================================================================
// Press Effect Presets
// ============================================================================

export type CardPressEffect =
  | 'sink'
  | 'squeeze'
  | 'none';

const pressEffects: Record<CardPressEffect, TargetAndTransition> = {
  sink: { scale: 0.98 },
  squeeze: { scale: 0.96 },
  none: {},
};

// ============================================================================
// AnimatedCard Component
// ============================================================================

export interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'onAnimationStart'> {
  children: ReactNode;
  /** Entry animation variant */
  entry?: CardEntryVariant;
  /** Hover effect type */
  hover?: CardHoverEffect;
  /** Press/tap effect type */
  press?: CardPressEffect;
  /** Stagger delay index (for lists) */
  index?: number;
  /** Base stagger delay in seconds */
  staggerDelay?: number;
  /** Additional delay before animation */
  delay?: number;
  /** Custom className */
  className?: string;
  /** Whether card is currently active/selected */
  isActive?: boolean;
  /** Disable all animations */
  disabled?: boolean;
}

/**
 * AnimatedCard
 *
 * A composable animated card wrapper that applies consistent
 * entry, hover, and press animations.
 *
 * @example
 * // Simple fade-in card with lift hover
 * <AnimatedCard entry="fadeIn" hover="lift">
 *   <CardContent />
 * </AnimatedCard>
 *
 * @example
 * // Staggered list of cards
 * {items.map((item, i) => (
 *   <AnimatedCard
 *     key={item.id}
 *     entry="slideUp"
 *     hover="lift"
 *     press="sink"
 *     index={i}
 *     staggerDelay={0.05}
 *   >
 *     <ItemCard data={item} />
 *   </AnimatedCard>
 * ))}
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  function AnimatedCard(
    {
      children,
      entry = 'fadeIn',
      hover = 'lift',
      press = 'sink',
      index = 0,
      staggerDelay = 0.05,
      delay = 0,
      className = '',
      isActive = false,
      disabled = false,
      ...motionProps
    },
    ref
  ) {
    if (disabled) {
      return (
        <div ref={ref} className={className}>
          {children}
        </div>
      );
    }

    const totalDelay = delay + index * staggerDelay;
    const entryVariant = entryVariants[entry];
    const hoverConfig = hoverEffects[hover];
    const pressConfig = pressEffects[press];

    return (
      <motion.div
        ref={ref}
        variants={entryVariant}
        initial="hidden"
        animate="visible"
        transition={{
          duration: DURATION.normal,
          ease: EASING.smooth,
          delay: totalDelay,
        }}
        whileHover={hoverConfig.whileHover}
        whileTap={pressConfig}
        className={className}
        style={{ willChange: 'transform, opacity' }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

// ============================================================================
// Card List Container (Stagger Animation)
// ============================================================================

export interface AnimatedCardListProps {
  children: ReactNode;
  /** Stagger delay between children */
  staggerDelay?: number;
  /** Custom className */
  className?: string;
  /** Whether to animate on mount */
  animateOnMount?: boolean;
}

/**
 * AnimatedCardList
 *
 * Container that staggers child card animations.
 * Children should use motion.div with the itemVariants.
 *
 * @example
 * <AnimatedCardList>
 *   {items.map(item => (
 *     <AnimatedCard key={item.id} entry="slideUp">
 *       <ItemCard data={item} />
 *     </AnimatedCard>
 *   ))}
 * </AnimatedCardList>
 */
export function AnimatedCardList({
  children,
  staggerDelay = 0.05,
  className = '',
  animateOnMount = true,
}: AnimatedCardListProps) {
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial={animateOnMount ? 'hidden' : 'visible'}
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Skeleton Card Animation
// ============================================================================

export interface CardSkeletonProps {
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Whether to show pulse animation */
  animate?: boolean;
  /** Border radius */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Custom className */
  className?: string;
}

/**
 * CardSkeleton
 *
 * Animated loading placeholder for cards.
 * Uses a shimmer effect that feels premium.
 */
export function CardSkeleton({
  width = '100%',
  height = 120,
  animate = true,
  rounded = 'xl',
  className = '',
}: CardSkeletonProps) {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <motion.div
      animate={animate ? {
        backgroundPosition: ['200% 0', '-200% 0'],
      } : undefined}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={`
        ${roundedClass}
        bg-gradient-to-r from-rui-grey-5 via-rui-grey-10 via-50% to-rui-grey-5
        bg-[length:200%_100%]
        ${className}
      `}
      style={{ width, height }}
    />
  );
}

// ============================================================================
// Card Appear Animation (Exit Animation Support)
// ============================================================================

export interface CardAppearProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  /** Whether card is visible */
  isVisible?: boolean;
  /** Entry variant */
  entry?: CardEntryVariant;
  /** Custom className */
  className?: string;
}

/**
 * CardAppear
 *
 * Card with both enter and exit animations.
 * Use within AnimatePresence for exit animations.
 *
 * @example
 * <AnimatePresence>
 *   {isOpen && (
 *     <CardAppear entry="scaleUp">
 *       <ExpandedContent />
 *     </CardAppear>
 *   )}
 * </AnimatePresence>
 */
export function CardAppear({
  children,
  isVisible = true,
  entry = 'scaleUp',
  className = '',
  ...motionProps
}: CardAppearProps) {
  const variant = entryVariants[entry];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={variant}
      transition={{
        duration: DURATION.normal,
        ease: EASING.smooth,
      }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// Interactive Card Button
// ============================================================================

export interface CardButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Whether button is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * CardButton
 *
 * Animated button for card actions with consistent feedback.
 */
export function CardButton({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  ...motionProps
}: CardButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-body-3',
    md: 'px-4 py-2 text-body-2',
    lg: 'px-6 py-3 text-body-1',
  }[size];

  const variantClasses = {
    primary: 'bg-rui-accent text-white hover:bg-rui-accent/90',
    secondary: 'bg-rui-grey-5 text-rui-black hover:bg-rui-grey-10',
    ghost: 'bg-transparent text-rui-grey-50 hover:bg-rui-grey-5 hover:text-rui-black',
  }[variant];

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: DURATION.instant }}
      disabled={disabled}
      className={`
        ${sizeClasses}
        ${variantClasses}
        rounded-rui-12 font-medium
        transition-colors duration-rui-sm
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}

// ============================================================================
// Pulsing Badge (for notifications/counts)
// ============================================================================

export interface PulsingBadgeProps {
  children: ReactNode;
  /** Whether to pulse */
  pulse?: boolean;
  /** Color variant */
  variant?: 'accent' | 'warning' | 'success' | 'danger';
  /** Custom className */
  className?: string;
}

/**
 * PulsingBadge
 *
 * Animated badge for drawing attention to counts or status.
 */
export function PulsingBadge({
  children,
  pulse = true,
  variant = 'accent',
  className = '',
}: PulsingBadgeProps) {
  const colorClasses = {
    accent: 'bg-rui-accent text-white',
    warning: 'bg-warning text-white',
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
  }[variant];

  const glowColor = {
    accent: 'rgba(196, 88, 48, 0.4)',
    warning: 'rgba(212, 168, 83, 0.4)',
    success: 'rgba(107, 142, 123, 0.4)',
    danger: 'rgba(220, 53, 69, 0.4)',
  }[variant];

  return (
    <motion.span
      animate={pulse ? {
        boxShadow: [
          `0 0 0 0 ${glowColor}`,
          `0 0 0 8px transparent`,
        ],
      } : undefined}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeOut',
      }}
      className={`
        inline-flex items-center justify-center
        min-w-[20px] h-5 px-1.5
        rounded-full text-body-3 font-bold
        ${colorClasses}
        ${className}
      `}
    >
      {children}
    </motion.span>
  );
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Get animation variants for a specific entry type
 */
export function getEntryVariants(entry: CardEntryVariant): Variants {
  return entryVariants[entry];
}

/**
 * Get hover config for a specific hover type
 */
export function getHoverConfig(hover: CardHoverEffect): HoverConfig {
  return hoverEffects[hover];
}

/**
 * Get press config for a specific press type
 */
export function getPressConfig(press: CardPressEffect): TargetAndTransition {
  return pressEffects[press];
}

/**
 * Create staggered delay for list items
 */
export function staggerDelay(index: number, baseDelay: number = 0.05): number {
  return index * baseDelay;
}

export default AnimatedCard;
