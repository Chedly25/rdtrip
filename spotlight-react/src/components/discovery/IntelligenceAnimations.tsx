/**
 * IntelligenceAnimations
 *
 * Production polish: Micro-interactions, animation variants, and
 * delightful effects for the City Intelligence system.
 *
 * Design Philosophy:
 * - Purposeful motion that guides attention
 * - Subtle feedback for every interaction
 * - Celebration for achievements
 * - Respects reduced motion preferences
 */

import React, { useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { motion, useSpring, useTransform, AnimatePresence, Variants, MotionValue, useMotionValue } from 'framer-motion';

// =============================================================================
// Animation Variants
// =============================================================================

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const springVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.9 },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export const cardHoverVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  tap: { scale: 0.98 },
};

export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity },
  },
};

export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
  },
};

// =============================================================================
// Transition Presets
// =============================================================================

export const transitions = {
  fast: { duration: 0.15 },
  normal: { duration: 0.25 },
  slow: { duration: 0.4 },
  spring: { type: 'spring', stiffness: 300, damping: 25 },
  bounce: { type: 'spring', stiffness: 400, damping: 15 },
  gentle: { type: 'spring', stiffness: 100, damping: 20 },
  snappy: { type: 'spring', stiffness: 500, damping: 30 },
} as const;

// =============================================================================
// Magnetic Button Effect
// =============================================================================

interface MagneticButtonProps {
  children: ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  strength = 0.3,
  className = '',
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    x.set(deltaX);
    y.set(deltaY);
  }, [strength, x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
      whileTap={{ scale: 0.95 }}
      transition={transitions.bounce}
    >
      {children}
    </motion.button>
  );
}

// =============================================================================
// Floating Animation
// =============================================================================

interface FloatingProps {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
  className?: string;
}

export function Floating({
  children,
  amplitude = 8,
  duration = 3,
  className = '',
}: FloatingProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-amplitude, amplitude, -amplitude],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// Glow Effect
// =============================================================================

interface GlowOnHoverProps {
  children: ReactNode;
  glowColor?: string;
  className?: string;
}

export function GlowOnHover({
  children,
  glowColor = 'rgba(251, 191, 36, 0.4)',
  className = '',
}: GlowOnHoverProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover="hover"
    >
      <motion.div
        className="absolute inset-0 rounded-xl blur-xl"
        style={{ backgroundColor: glowColor }}
        variants={{
          hover: { opacity: 1, scale: 1.1 },
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        transition={transitions.normal}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

// =============================================================================
// Progress Ring Animation
// =============================================================================

interface AnimatedProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: ReactNode;
}

export function AnimatedProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#F59E0B',
  bgColor = '#FEF3C7',
  children,
}: AnimatedProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const springProgress = useSpring(0, { stiffness: 60, damping: 15 });

  useEffect(() => {
    springProgress.set(progress);
  }, [progress, springProgress]);

  const strokeDashoffset = useTransform(
    springProgress,
    [0, 100],
    [circumference, 0]
  );

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// Confetti Effect
// =============================================================================

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  rotation: number;
  delay: number;
}

interface ConfettiProps {
  trigger: boolean;
  count?: number;
  colors?: string[];
  duration?: number;
}

export function Confetti({
  trigger,
  count = 50,
  colors = ['#F59E0B', '#FB923C', '#FBBF24', '#FDE68A', '#34D399', '#60A5FA'],
  duration = 3000,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger) {
      const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5,
      }));
      setPieces(newPieces);

      const timeout = setTimeout(() => setPieces([]), duration);
      return () => clearTimeout(timeout);
    }
  }, [trigger, count, colors, duration]);

  return (
    <AnimatePresence>
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{
            opacity: 1,
            x: `${piece.x}vw`,
            y: '-10vh',
            rotate: piece.rotation,
            scale: 1,
          }}
          animate={{
            y: '110vh',
            rotate: piece.rotation + 720,
            scale: [1, 0.8, 1, 0.6],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2 + Math.random(),
            delay: piece.delay,
            ease: 'linear',
          }}
          className="fixed pointer-events-none z-50"
          style={{ left: 0, top: 0 }}
        >
          <div
            className="w-3 h-3 rounded-sm"
            style={{
              backgroundColor: piece.color,
              transform: `rotate(${Math.random() * 45}deg)`,
            }}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

// =============================================================================
// Toast Notification
// =============================================================================

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const icons = {
    success: (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={transitions.spring}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${colors[toast.type]}`}
          >
            {icons[toast.type]}
            <span className="text-sm font-medium text-gray-800">{toast.message}</span>
            <button
              onClick={() => onRemove(toast.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Number Counter Animation
// =============================================================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({
  value,
  duration = 1,
  className = '',
  suffix = '',
  prefix = '',
}: AnimatedCounterProps) {
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(springValue, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    return display.on('change', (v) => setDisplayValue(v));
  }, [display]);

  return (
    <span className={className}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}

// =============================================================================
// Ripple Effect Button
// =============================================================================

interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  rippleColor?: string;
}

export function RippleButton({
  children,
  onClick,
  className = '',
  rippleColor = 'rgba(251, 191, 36, 0.4)',
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick?.();
  };

  return (
    <button onClick={handleClick} className={`relative overflow-hidden ${className}`}>
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 50,
            height: 50,
            marginLeft: -25,
            marginTop: -25,
            backgroundColor: rippleColor,
          }}
        />
      ))}
    </button>
  );
}

// =============================================================================
// Shake Animation (for errors)
// =============================================================================

interface ShakeProps {
  children: ReactNode;
  trigger: boolean;
  className?: string;
}

export function Shake({ children, trigger, className = '' }: ShakeProps) {
  return (
    <motion.div
      className={className}
      animate={trigger ? {
        x: [-10, 10, -10, 10, -5, 5, -2, 2, 0],
      } : {}}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// Typewriter Effect
// =============================================================================

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function Typewriter({
  text,
  speed = 50,
  className = '',
  onComplete,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className={className}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[2px] h-[1em] bg-current ml-0.5 align-middle"
      />
    </span>
  );
}

// =============================================================================
// Stagger List Animation Wrapper
// =============================================================================

interface StaggerListProps {
  children: ReactNode[];
  className?: string;
}

export function StaggerList({ children, className = '' }: StaggerListProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={staggerItemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// =============================================================================
// Success Checkmark Animation
// =============================================================================

export function SuccessCheckmark({ size = 80 }: { size?: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={transitions.bounce}
      className="inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <motion.div
        className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, ...transitions.bounce }}
      >
        <motion.svg
          className="w-1/2 h-1/2 text-white"
          viewBox="0 0 24 24"
          fill="none"
          initial="hidden"
          animate="visible"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default {
  // Variants
  fadeVariants,
  slideUpVariants,
  slideDownVariants,
  scaleVariants,
  springVariants,
  staggerContainerVariants,
  staggerItemVariants,
  cardHoverVariants,
  pulseVariants,
  shimmerVariants,

  // Transitions
  transitions,

  // Components
  MagneticButton,
  Floating,
  GlowOnHover,
  AnimatedProgressRing,
  Confetti,
  ToastProvider,
  useToast,
  AnimatedCounter,
  RippleButton,
  Shake,
  Typewriter,
  StaggerList,
  SuccessCheckmark,
};
