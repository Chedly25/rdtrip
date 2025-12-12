/**
 * AgentStatusIndicator
 *
 * Visual indicator showing the status of AI agents working on city intelligence.
 * Designed to create anticipation and transparency during the intelligence gathering process.
 *
 * Design philosophy:
 * - Organic, pulsing animations for running agents (feels alive, not mechanical)
 * - Clear status differentiation through color and motion
 * - Compact but informative - shows what's happening without overwhelming
 * - Staggered entrance animations for visual delight
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  BookOpen,
  Heart,
  MapPin,
  Gem,
  Truck,
  CloudSun,
  Camera,
  Layers,
  Loader2,
  Check,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import type { AgentName, AgentExecutionState } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface AgentStatusIndicatorProps {
  agentName: AgentName;
  state: AgentExecutionState | null;
  /** Show label next to icon */
  showLabel?: boolean;
  /** Compact mode for inline usage */
  compact?: boolean;
  /** Animation delay for staggered entrance */
  delay?: number;
}

interface AgentStatusGroupProps {
  agentStates: Record<string, AgentExecutionState>;
  /** Show as horizontal row or vertical list */
  layout?: 'horizontal' | 'vertical';
  /** Show labels */
  showLabels?: boolean;
}

// =============================================================================
// Agent Configuration
// =============================================================================

const AGENT_CONFIG: Record<
  AgentName,
  {
    icon: typeof Clock;
    label: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  TimeAgent: {
    icon: Clock,
    label: 'Time',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    description: 'Planning time blocks',
  },
  StoryAgent: {
    icon: BookOpen,
    label: 'Story',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    description: 'Crafting city narrative',
  },
  PreferenceAgent: {
    icon: Heart,
    label: 'Match',
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    description: 'Matching preferences',
  },
  ClusterAgent: {
    icon: MapPin,
    label: 'Clusters',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Grouping activities',
  },
  GemsAgent: {
    icon: Gem,
    label: 'Gems',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    description: 'Finding hidden gems',
  },
  LogisticsAgent: {
    icon: Truck,
    label: 'Logistics',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    description: 'Planning logistics',
  },
  WeatherAgent: {
    icon: CloudSun,
    label: 'Weather',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    description: 'Checking weather',
  },
  PhotoAgent: {
    icon: Camera,
    label: 'Photos',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    description: 'Finding photo spots',
  },
  SynthesisAgent: {
    icon: Layers,
    label: 'Synthesis',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    description: 'Combining intelligence',
  },
};

// =============================================================================
// Single Agent Indicator
// =============================================================================

export function AgentStatusIndicator({
  agentName,
  state,
  showLabel = true,
  compact = false,
  delay = 0,
}: AgentStatusIndicatorProps) {
  const config = AGENT_CONFIG[agentName] || {
    icon: Cpu,
    label: agentName,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    description: 'Processing',
  };

  const Icon = config.icon;
  const status = state?.status || 'pending';
  const progress = state?.progress || 0;

  // Status-specific styling
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return {
          ringColor: 'ring-emerald-500/30',
          iconColor: 'text-emerald-500',
          bgColor: 'bg-emerald-50',
        };
      case 'running':
        return {
          ringColor: 'ring-amber-500/30',
          iconColor: config.color,
          bgColor: config.bgColor,
        };
      case 'failed':
        return {
          ringColor: 'ring-rose-500/30',
          iconColor: 'text-rose-500',
          bgColor: 'bg-rose-50',
        };
      default: // pending
        return {
          ringColor: 'ring-gray-200',
          iconColor: 'text-gray-300',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const styles = getStatusStyles();
  const size = compact ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={`flex items-center gap-2 ${compact ? '' : 'p-1'}`}
    >
      {/* Icon container with status ring */}
      <div className="relative">
        <motion.div
          className={`
            ${size} rounded-full
            ${styles.bgColor}
            ring-2 ${styles.ringColor}
            flex items-center justify-center
            transition-all duration-300
          `}
          animate={
            status === 'running'
              ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(245, 158, 11, 0)',
                    '0 0 0 6px rgba(245, 158, 11, 0.15)',
                    '0 0 0 0 rgba(245, 158, 11, 0)',
                  ],
                }
              : {}
          }
          transition={
            status === 'running'
              ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
        >
          <AnimatePresence mode="wait">
            {status === 'completed' ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Check className={`${iconSize} text-emerald-500`} />
              </motion.div>
            ) : status === 'failed' ? (
              <motion.div
                key="error"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <AlertCircle className={`${iconSize} text-rose-500`} />
              </motion.div>
            ) : status === 'running' ? (
              <motion.div
                key="running"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Icon className={`${iconSize} ${styles.iconColor}`} />
              </motion.div>
            ) : (
              <motion.div key="pending">
                <Icon className={`${iconSize} ${styles.iconColor}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Progress ring for running state */}
        {status === 'running' && progress > 0 && progress < 100 && (
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 36 36"
            style={{ width: compact ? 32 : 40, height: compact ? 32 : 40 }}
          >
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-amber-500/30"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-amber-500"
              strokeDasharray={100}
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - progress }}
              transition={{ duration: 0.3 }}
            />
          </svg>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex flex-col">
          <span
            className={`
              text-sm font-medium leading-tight
              ${status === 'pending' ? 'text-gray-400' : 'text-gray-700'}
            `}
          >
            {config.label}
          </span>
          {status === 'running' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-400"
            >
              {config.description}
            </motion.span>
          )}
          {status === 'failed' && state?.error && (
            <span className="text-xs text-rose-500 line-clamp-1">
              {state.error}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Agent Status Group
// =============================================================================

export function AgentStatusGroup({
  agentStates,
  layout = 'horizontal',
  showLabels = false,
}: AgentStatusGroupProps) {
  const agents = Object.entries(agentStates) as [AgentName, AgentExecutionState][];

  // Sort agents: running first, then completed, then pending
  const sortedAgents = agents.sort(([, a], [, b]) => {
    const order = { running: 0, completed: 1, pending: 2, failed: 3 };
    return (order[a.status] || 4) - (order[b.status] || 4);
  });

  return (
    <motion.div
      className={`
        flex flex-wrap
        ${layout === 'vertical' ? 'flex-col gap-3' : 'flex-row gap-2'}
      `}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
    >
      {sortedAgents.map(([name, state], index) => (
        <AgentStatusIndicator
          key={name}
          agentName={name as AgentName}
          state={state}
          showLabel={showLabels}
          compact={!showLabels}
          delay={index * 0.05}
        />
      ))}
    </motion.div>
  );
}

// =============================================================================
// Compact Progress Bar
// =============================================================================

interface AgentProgressBarProps {
  agentStates: Record<string, AgentExecutionState>;
  /** Show percentage label */
  showPercent?: boolean;
}

export function AgentProgressBar({
  agentStates,
  showPercent = true,
}: AgentProgressBarProps) {
  const agents = Object.values(agentStates);
  if (agents.length === 0) return null;

  // Calculate overall progress
  const totalProgress = agents.reduce((sum, state) => {
    if (state.status === 'completed') return sum + 100;
    if (state.status === 'running') return sum + (state.progress || 0);
    return sum;
  }, 0);
  const overallProgress = Math.round(totalProgress / agents.length);

  // Count by status
  const completed = agents.filter((s) => s.status === 'completed').length;
  const running = agents.filter((s) => s.status === 'running').length;

  return (
    <div className="flex items-center gap-3">
      {/* Progress bar */}
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Status label */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
        {running > 0 && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-3.5 h-3.5 text-amber-500" />
          </motion.div>
        )}
        {showPercent && (
          <span className="font-medium tabular-nums">{overallProgress}%</span>
        )}
        <span className="text-gray-400">
          {completed}/{agents.length}
        </span>
      </div>
    </div>
  );
}

export default AgentStatusIndicator;
