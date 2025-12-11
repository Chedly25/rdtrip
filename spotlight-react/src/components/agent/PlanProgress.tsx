/**
 * PlanProgress - Agentic Plan Execution Display
 *
 * Phase 1: Enhanced Agent Loop
 *
 * Shows the agent's plan decomposition and tracks progress through each step.
 * Refined editorial aesthetic with warm earthy tones and subtle animations.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { AgentPlan, PlanStep, ReplanEvent } from '../../contexts/AgentProvider';
import { EASING, DURATION } from '../transitions';

interface PlanProgressProps {
  plan: AgentPlan;
  className?: string;
  isReplanning?: boolean;
  replanInfo?: ReplanEvent | null;
}

/**
 * Step status icon with animated transitions
 */
function StepIcon({ status }: { status: PlanStep['status'] }) {
  return (
    <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
      <AnimatePresence mode="wait">
        {status === 'pending' && (
          <motion.div
            key="pending"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="w-2.5 h-2.5 rounded-full bg-rui-grey-30 border-2 border-rui-grey-20"
          />
        )}

        {status === 'in_progress' && (
          <motion.div key="progress" className="relative w-full h-full">
            {/* Pulsing ring */}
            <motion.div
              className="absolute inset-0 rounded-full bg-terracotta/30"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Core dot */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-terracotta"
            />
          </motion.div>
        )}

        {status === 'completed' && (
          <motion.div
            key="completed"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-5 h-5 rounded-full bg-sage flex items-center justify-center"
          >
            <motion.svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
              />
            </motion.svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Complexity indicator badge
 */
function ComplexityBadge({ complexity }: { complexity: AgentPlan['complexity'] }) {
  const config = {
    simple: {
      label: 'Quick task',
      className: 'bg-rui-grey-8 text-rui-grey-60',
    },
    medium: {
      label: 'Multi-step',
      className: 'bg-rui-secondary-light text-rui-secondary',
    },
    complex: {
      label: 'Complex',
      className: 'bg-rui-accent-light text-terracotta',
    },
  };

  const { label, className } = config[complexity];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase',
        className
      )}
    >
      {label}
    </span>
  );
}

/**
 * Progress bar showing completion
 */
function ProgressBar({ steps }: { steps: PlanStep[] }) {
  const completed = steps.filter((s) => s.status === 'completed').length;
  const progress = (completed / steps.length) * 100;

  return (
    <div className="relative h-1 bg-rui-grey-10 rounded-full overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-terracotta to-sage rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: DURATION.normal, ease: EASING.smooth }}
      />
    </div>
  );
}

/**
 * Replan Banner - Shows when agent is adjusting strategy
 */
function ReplanBanner({ replanInfo }: { replanInfo: ReplanEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-3 p-3 rounded-rui-8 bg-gradient-to-r from-gold/10 to-terracotta/10 border border-gold/30"
    >
      <div className="flex items-start gap-2">
        {/* Refresh icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-gold"
          >
            <path
              d="M11.0833 7C11.0833 9.25463 9.25463 11.0833 7 11.0833C4.74537 11.0833 2.91667 9.25463 2.91667 7C2.91667 4.74537 4.74537 2.91667 7 2.91667V1.16667L9.33333 3.5L7 5.83333V4.08333C5.39083 4.08333 4.08333 5.39083 4.08333 7C4.08333 8.60917 5.39083 9.91667 7 9.91667C8.60917 9.91667 9.91667 8.60917 9.91667 7H11.0833Z"
              fill="currentColor"
            />
          </svg>
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="text-emphasis-3 text-gold font-medium">
            Adjusting approach (Attempt {replanInfo.attempt})
          </p>
          <p className="text-body-3 text-rui-grey-60 mt-0.5 line-clamp-2">
            {replanInfo.whatChanged}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Main PlanProgress component
 */
export function PlanProgress({ plan, className, isReplanning, replanInfo }: PlanProgressProps) {
  const completedSteps = plan.steps.filter((s) => s.status === 'completed').length;
  const isComplete = completedSteps === plan.steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: DURATION.normal, ease: EASING.smooth }}
      className={cn(
        'relative overflow-hidden rounded-rui-12',
        'bg-white/60 backdrop-blur-md',
        'border border-rui-grey-10',
        'shadow-rui-1',
        'p-4',
        isReplanning && 'border-gold/40',
        className
      )}
    >
      {/* Replan Banner */}
      <AnimatePresence>
        {isReplanning && replanInfo && (
          <ReplanBanner replanInfo={replanInfo} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {/* Goal text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-emphasis-2 text-rui-black font-display leading-snug"
          >
            {plan.goal}
          </motion.p>

          {/* Progress indicator */}
          <p className="mt-1 text-body-3 text-rui-grey-50">
            {isComplete ? (
              <span className="text-sage font-medium">Complete</span>
            ) : isReplanning ? (
              <span className="text-gold font-medium">Retrying...</span>
            ) : (
              <>
                Step {completedSteps + 1} of {plan.steps.length}
              </>
            )}
          </p>
        </div>

        <ComplexityBadge complexity={plan.complexity} />
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <ProgressBar steps={plan.steps} />
      </div>

      {/* Steps list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {plan.steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: DURATION.fast,
                delay: index * 0.05,
                ease: EASING.smooth,
              }}
              className="relative flex items-start gap-3"
            >
              {/* Connector line */}
              {index < plan.steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[9px] top-5 w-px h-[calc(100%+0.5rem)]',
                    step.status === 'completed' ? 'bg-sage/40' : 'bg-rui-grey-10'
                  )}
                />
              )}

              {/* Step icon */}
              <StepIcon status={step.status} />

              {/* Step text */}
              <motion.span
                className={cn(
                  'text-body-3 leading-relaxed pt-0.5',
                  step.status === 'completed' && 'text-rui-grey-50 line-through decoration-rui-grey-30',
                  step.status === 'in_progress' && 'text-rui-black font-medium',
                  step.status === 'pending' && 'text-rui-grey-40'
                )}
              >
                {step.action}
              </motion.span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Completion celebration */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2, duration: DURATION.normal }}
            className="mt-4 pt-3 border-t border-rui-grey-10"
          >
            <div className="flex items-center gap-2 text-sage">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="flex-shrink-0"
              >
                <path
                  d="M7 0.5C3.41 0.5 0.5 3.41 0.5 7C0.5 10.59 3.41 13.5 7 13.5C10.59 13.5 13.5 10.59 13.5 7C13.5 3.41 10.59 0.5 7 0.5ZM5.75 10.25L2.5 7L3.4075 6.0925L5.75 8.4275L10.5925 3.585L11.5 4.5L5.75 10.25Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-emphasis-3 font-medium">
                All steps completed
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 pointer-events-none rounded-rui-12" />
    </motion.div>
  );
}

/**
 * Compact inline version for chat bubbles
 */
export function PlanProgressInline({ plan }: { plan: AgentPlan }) {
  const completedSteps = plan.steps.filter((s) => s.status === 'completed').length;
  const currentStep = plan.steps.find((s) => s.status === 'in_progress');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 px-3 py-2 bg-rui-grey-5 rounded-rui-8 text-body-3"
    >
      {/* Mini progress dots */}
      <div className="flex items-center gap-1">
        {plan.steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-colors duration-200',
              step.status === 'completed' && 'bg-sage',
              step.status === 'in_progress' && 'bg-terracotta',
              step.status === 'pending' && 'bg-rui-grey-30'
            )}
          />
        ))}
      </div>

      {/* Current action text */}
      <span className="text-rui-grey-60 truncate">
        {currentStep
          ? currentStep.action
          : completedSteps === plan.steps.length
          ? 'Complete'
          : 'Planning...'}
      </span>
    </motion.div>
  );
}

export default PlanProgress;
