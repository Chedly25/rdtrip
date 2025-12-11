/**
 * GoalProgress - Multi-Step Goal Tracking Display
 *
 * Phase 4: Goal Tracking & Progress
 *
 * Shows the agent's tracked goals with subtask progress.
 * Features a circular progress ring as the hero element,
 * evoking a journey/compass metaphor for travel planning.
 *
 * Design: "Journey Compass" - warm earthy editorial aesthetic
 * with animated circular progress and flowing subtask list.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { GoalInfo, GoalSubtask, GoalComplexity } from '../../contexts/AgentProvider';
import { EASING, DURATION } from '../transitions';

interface GoalProgressProps {
  goal: GoalInfo;
  className?: string;
  /** Compact mode for inline display in chat */
  compact?: boolean;
}

// ============================================================================
// Circular Progress Ring - The Hero Element
// ============================================================================

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function ProgressRing({ progress, size = 56, strokeWidth = 4, className }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      {/* Decorative outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-terracotta/20 to-sage/20 blur-md"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG Ring */}
      <svg
        className="relative transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-rui-grey-10"
        />

        {/* Progress arc with gradient */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#goalProgressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: DURATION.slow, ease: EASING.smooth }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="goalProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4785B" /> {/* terracotta */}
            <stop offset="50%" stopColor="#D4A574" /> {/* gold */}
            <stop offset="100%" stopColor="#87A878" /> {/* sage */}
          </linearGradient>
        </defs>
      </svg>

      {/* Center content - percentage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={progress}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-emphasis-2 font-display font-semibold text-rui-black tabular-nums"
        >
          {progress}
          <span className="text-[10px] text-rui-grey-50">%</span>
        </motion.span>
      </div>
    </div>
  );
}

// ============================================================================
// Subtask Item with Status Indicator
// ============================================================================

interface SubtaskItemProps {
  subtask: GoalSubtask;
  index: number;
  isLast: boolean;
}

function SubtaskItem({ subtask, index, isLast }: SubtaskItemProps) {
  const statusConfig = {
    todo: {
      icon: (
        <div className="w-2 h-2 rounded-full bg-rui-grey-30 border border-rui-grey-20" />
      ),
      textClass: 'text-rui-grey-40',
    },
    in_progress: {
      icon: (
        <motion.div
          className="relative w-2.5 h-2.5"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="absolute inset-0 rounded-full bg-terracotta/40" />
          <div className="absolute inset-0.5 rounded-full bg-terracotta" />
        </motion.div>
      ),
      textClass: 'text-rui-black font-medium',
    },
    done: {
      icon: (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-3.5 h-3.5 rounded-full bg-sage flex items-center justify-center"
        >
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path
              d="M1 3L2.8 5L7 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      ),
      textClass: 'text-rui-grey-50 line-through decoration-rui-grey-30',
    },
    skipped: {
      icon: (
        <div className="w-3 h-3 rounded-full bg-rui-grey-20 flex items-center justify-center">
          <div className="w-1.5 h-0.5 bg-rui-grey-40 rounded-full" />
        </div>
      ),
      textClass: 'text-rui-grey-40 line-through decoration-rui-grey-20',
    },
  };

  const config = statusConfig[subtask.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: DURATION.fast }}
      className="relative flex items-start gap-2.5 py-1"
    >
      {/* Connector line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-[5px] top-4 w-px h-[calc(100%)]',
            subtask.status === 'done' ? 'bg-sage/30' : 'bg-rui-grey-10'
          )}
        />
      )}

      {/* Status icon */}
      <div className="relative z-10 mt-0.5 flex items-center justify-center w-3.5">
        {config.icon}
      </div>

      {/* Subtask text */}
      <span className={cn('text-body-3 leading-relaxed flex-1', config.textClass)}>
        {subtask.description}
      </span>
    </motion.div>
  );
}

// ============================================================================
// Complexity Badge
// ============================================================================

function ComplexityBadge({ complexity }: { complexity: GoalComplexity }) {
  const config = {
    simple: {
      label: 'Quick',
      icon: (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1L5 9M1 5L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      className: 'bg-rui-grey-8 text-rui-grey-60 border-rui-grey-15',
    },
    medium: {
      label: 'Multi-step',
      icon: (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 5H4L5 3L6 7L7 5H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      className: 'bg-gold/10 text-gold border-gold/30',
    },
    complex: {
      label: 'Journey',
      icon: (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 3V5L6.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
      className: 'bg-terracotta/10 text-terracotta border-terracotta/30',
    },
  };

  const { label, icon, className } = config[complexity];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'text-[10px] font-medium tracking-wide uppercase border',
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}

// ============================================================================
// Main GoalProgress Component
// ============================================================================

export function GoalProgress({ goal, className, compact = false }: GoalProgressProps) {
  const completedSubtasks = goal.subtasks.filter(
    (s) => s.status === 'done' || s.status === 'skipped'
  ).length;
  const totalSubtasks = goal.subtasks.length;
  const isComplete = goal.progress >= 100;

  // Compact inline version
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
          'bg-gradient-to-r from-terracotta/5 to-sage/5',
          'border border-terracotta/20',
          className
        )}
      >
        {/* Mini progress ring */}
        <div className="relative w-5 h-5">
          <svg className="transform -rotate-90" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="none" stroke="#E5E5E5" strokeWidth="2" />
            <motion.circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="url(#miniGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={50.26}
              initial={{ strokeDashoffset: 50.26 }}
              animate={{ strokeDashoffset: 50.26 - (goal.progress / 100) * 50.26 }}
            />
            <defs>
              <linearGradient id="miniGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C4785B" />
                <stop offset="100%" stopColor="#87A878" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <span className="text-[11px] font-medium text-rui-grey-70 truncate max-w-[140px]">
          {goal.description}
        </span>

        <span className="text-[10px] text-rui-grey-50 tabular-nums">
          {goal.progress}%
        </span>
      </motion.div>
    );
  }

  // Full expanded version
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: DURATION.normal, ease: EASING.smooth }}
      className={cn(
        'relative overflow-hidden rounded-rui-12',
        'bg-gradient-to-br from-white/80 via-white/70 to-terracotta/5',
        'backdrop-blur-md',
        'border border-terracotta/15',
        'shadow-rui-1',
        'p-4',
        className
      )}
    >
      {/* Decorative corner accent */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-bl from-terracotta/10 to-transparent rounded-full blur-xl pointer-events-none" />

      {/* Header with progress ring */}
      <div className="relative flex items-start gap-4 mb-4">
        {/* Progress Ring */}
        <ProgressRing progress={goal.progress} />

        {/* Goal info */}
        <div className="flex-1 min-w-0 pt-1">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-emphasis-2 text-rui-black font-display leading-snug line-clamp-2"
          >
            {goal.description}
          </motion.p>

          <div className="flex items-center gap-2 mt-2">
            <ComplexityBadge complexity={goal.complexity} />

            {totalSubtasks > 0 && (
              <span className="text-body-3 text-rui-grey-50">
                {completedSubtasks}/{totalSubtasks} steps
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subtasks list */}
      {goal.subtasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="pl-1 space-y-0.5"
        >
          <AnimatePresence mode="popLayout">
            {goal.subtasks.map((subtask, index) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                index={index}
                isLast={index === goal.subtasks.length - 1}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Success criteria hint */}
      {goal.successCriteria && !isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 pt-3 border-t border-rui-grey-10"
        >
          <p className="text-[11px] text-rui-grey-50 italic">
            <span className="text-rui-grey-40">Goal:</span> {goal.successCriteria}
          </p>
        </motion.div>
      )}

      {/* Completion celebration */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2, duration: DURATION.normal }}
            className="mt-4 pt-3 border-t border-sage/30"
          >
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-sage to-sage/80 flex items-center justify-center"
              >
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path
                    d="M1 5L4 8L11 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
              <span className="text-emphasis-3 font-medium text-sage">
                Goal achieved!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none rounded-rui-12"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// Inline Badge Version for Chat Bubbles
// ============================================================================

export function GoalBadge({ goal }: { goal: GoalInfo }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full',
        'text-[10px] font-medium',
        'bg-gradient-to-r from-terracotta/10 to-sage/10',
        'text-terracotta border border-terracotta/20'
      )}
    >
      {/* Tiny progress indicator */}
      <svg width="12" height="12" viewBox="0 0 12 12" className="transform -rotate-90">
        <circle cx="6" cy="6" r="4" fill="none" stroke="#E5E5E5" strokeWidth="1.5" />
        <circle
          cx="6"
          cy="6"
          r="4"
          fill="none"
          stroke="#C4785B"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={25.13}
          strokeDashoffset={25.13 - (goal.progress / 100) * 25.13}
        />
      </svg>

      <span className="truncate max-w-[100px]">{goal.description}</span>
    </motion.span>
  );
}

export default GoalProgress;
