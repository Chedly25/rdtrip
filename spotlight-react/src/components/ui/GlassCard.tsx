/**
 * GlassCard
 *
 * WI-11.3: Updated with card animation system
 *
 * Glass-morphism card with backdrop blur and subtle animations.
 * Premium editorial aesthetic for Waycraft.
 */

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { EASING, DURATION } from '../transitions';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  /** Enable hover animation */
  hover?: boolean;
  /** Backdrop blur intensity */
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  /** Entry animation (stagger index for lists) */
  index?: number;
  /** Whether card is interactive (clickable) */
  interactive?: boolean;
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  blur = 'md',
  index = 0,
  interactive = false,
  ...props
}: GlassCardProps) {
  const blurMap = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: DURATION.normal,
        ease: EASING.smooth,
        delay: index * 0.05,
      }}
      whileHover={
        hover
          ? {
              y: -3,
              boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.2)',
            }
          : undefined
      }
      whileTap={interactive ? { scale: 0.98 } : undefined}
      className={cn(
        'relative overflow-hidden rounded-rui-24',
        'bg-white/70',
        blurMap[blur],
        'border border-white/30',
        'shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]',
        'transition-colors duration-rui-sm',
        hover && 'hover:bg-white/80',
        interactive && 'cursor-pointer',
        className
      )}
      style={{ willChange: 'transform, opacity' }}
      {...props}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 pointer-events-none" />

      {/* Content */}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
