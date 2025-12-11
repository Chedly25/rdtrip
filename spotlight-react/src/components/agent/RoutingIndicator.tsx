/**
 * RoutingIndicator - Specialized Agent Routing Display
 *
 * Phase 3: Specialized Agent Routing
 *
 * Shows which specialized agent is handling the user's request.
 * Each agent type has a distinctive visual identity with
 * animated icons and contextual colors.
 *
 * Design: "Intelligent Compass" - A compact indicator visualizing
 * the routing decision with confidence and reasoning.
 */

import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { RoutingInfo, AgentType } from '../../contexts/AgentProvider';
import { EASING, DURATION } from '../transitions';

interface RoutingIndicatorProps {
  routingInfo: RoutingInfo;
  className?: string;
  /** Compact mode for inline display */
  compact?: boolean;
}

/**
 * Agent configuration with icons, colors, and labels
 */
const AGENT_CONFIG: Record<
  AgentType,
  {
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
  }
> = {
  discovery: {
    label: 'Discovery Mode',
    shortLabel: 'Discovery',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1.16667L8.91667 5.14583L13.4167 5.76042L10.2083 8.81458L10.8333 13.2708L7 11.1875L3.16667 13.2708L3.79167 8.81458L0.583333 5.76042L5.08333 5.14583L7 1.16667Z"
          fill="currentColor"
        />
      </svg>
    ),
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Exploring destinations & experiences',
  },
  itinerary: {
    label: 'Itinerary Mode',
    shortLabel: 'Itinerary',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M11.0833 1.75H2.91667C2.27233 1.75 1.75 2.27233 1.75 2.91667V11.0833C1.75 11.7277 2.27233 12.25 2.91667 12.25H11.0833C11.7277 12.25 12.25 11.7277 12.25 11.0833V2.91667C12.25 2.27233 11.7277 1.75 11.0833 1.75Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4.66667 4.66667H9.33333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M4.66667 7H9.33333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M4.66667 9.33333H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    color: 'text-terracotta',
    bgColor: 'bg-terracotta/10',
    borderColor: 'border-terracotta/30',
    description: 'Modifying your schedule',
  },
  booking: {
    label: 'Booking Mode',
    shortLabel: 'Booking',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M11.6667 5.83333H2.33333C1.68899 5.83333 1.16667 6.35566 1.16667 7V11.6667C1.16667 12.311 1.68899 12.8333 2.33333 12.8333H11.6667C12.311 12.8333 12.8333 12.311 12.8333 11.6667V7C12.8333 6.35566 12.311 5.83333 11.6667 5.83333Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 5.83333V3.5C3.5 2.57174 3.86875 1.6815 4.52513 1.02513C5.1815 0.368749 6.07174 0 7 0C7.92826 0 8.8185 0.368749 9.47487 1.02513C10.1313 1.6815 10.5 2.57174 10.5 3.5V5.83333"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    description: 'Hotels & practical arrangements',
  },
  general: {
    label: 'General Assistance',
    shortLabel: 'Assist',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M7 4.08333V7L9.33333 8.16667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    color: 'text-sage',
    bgColor: 'bg-sage/10',
    borderColor: 'border-sage/30',
    description: 'Weather, info & travel tips',
  },
};

/**
 * Confidence bar visualization
 */
function ConfidenceBar({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1 w-16 bg-rui-grey-10 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-sage to-terracotta rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: DURATION.normal, ease: EASING.smooth, delay: 0.2 }}
        />
      </div>
      <span className="text-[10px] text-rui-grey-50 tabular-nums font-medium">{percentage}%</span>
    </div>
  );
}

/**
 * Animated agent icon with pulsing effect
 */
function AgentIcon({ agent, isActive = true }: { agent: AgentType; isActive?: boolean }) {
  const config = AGENT_CONFIG[agent];

  return (
    <div className="relative flex items-center justify-center w-7 h-7 flex-shrink-0">
      {/* Pulsing background when active */}
      {isActive && (
        <motion.div
          className={cn('absolute inset-0 rounded-full', config.bgColor)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Icon container */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'relative w-7 h-7 rounded-full flex items-center justify-center',
          config.bgColor,
          'border',
          config.borderColor
        )}
      >
        <span className={config.color}>{config.icon}</span>
      </motion.div>
    </div>
  );
}

/**
 * Multi-agent indicator for complex requests
 */
function MultiAgentIndicator({ agents }: { agents: AgentType[] }) {
  return (
    <div className="flex items-center gap-0.5">
      {agents.slice(0, 3).map((agent, index) => {
        const config = AGENT_CONFIG[agent];
        return (
          <motion.div
            key={agent}
            initial={{ scale: 0, x: -10 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
            className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center',
              config.bgColor,
              'border',
              config.borderColor,
              index > 0 && '-ml-1.5'
            )}
            style={{ zIndex: agents.length - index }}
          >
            <span className={cn(config.color, 'scale-75')}>{config.icon}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Main RoutingIndicator component
 */
export function RoutingIndicator({ routingInfo, className, compact = false }: RoutingIndicatorProps) {
  const config = AGENT_CONFIG[routingInfo.primaryAgent];

  if (compact) {
    // Compact inline version
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: DURATION.fast, ease: EASING.smooth }}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-full',
          config.bgColor,
          'border',
          config.borderColor,
          className
        )}
      >
        <span className={cn(config.color, 'scale-75')}>{config.icon}</span>
        <span className={cn('text-[10px] font-medium tracking-wide', config.color)}>
          {config.shortLabel}
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
        'bg-white/70 backdrop-blur-md',
        'border',
        config.borderColor,
        'shadow-rui-1',
        'p-3',
        className
      )}
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 opacity-30 pointer-events-none',
          'bg-gradient-to-br',
          routingInfo.primaryAgent === 'discovery' && 'from-amber-100/50 to-transparent',
          routingInfo.primaryAgent === 'itinerary' && 'from-terracotta/20 to-transparent',
          routingInfo.primaryAgent === 'booking' && 'from-teal-100/50 to-transparent',
          routingInfo.primaryAgent === 'general' && 'from-sage/20 to-transparent'
        )}
      />

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        {routingInfo.requiresMultiple ? (
          <MultiAgentIndicator agents={routingInfo.agents} />
        ) : (
          <AgentIcon agent={routingInfo.primaryAgent} />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: DURATION.fast }}
            className="flex items-center gap-2"
          >
            <span className={cn('text-emphasis-3 font-medium', config.color)}>
              {routingInfo.requiresMultiple ? 'Multi-Agent' : config.label}
            </span>

            {/* Confidence */}
            <ConfidenceBar confidence={routingInfo.confidence} />
          </motion.div>

          {/* Description / Reasoning */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: DURATION.fast }}
            className="mt-1 text-body-3 text-rui-grey-50 line-clamp-1"
          >
            {routingInfo.reasoning || config.description}
          </motion.p>

          {/* Multi-agent list */}
          {routingInfo.requiresMultiple && routingInfo.agents.length > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.3, duration: DURATION.fast }}
              className="mt-2 flex flex-wrap gap-1"
            >
              {routingInfo.agents.map((agent) => {
                const agentConfig = AGENT_CONFIG[agent];
                return (
                  <span
                    key={agent}
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium',
                      agentConfig.bgColor,
                      agentConfig.color
                    )}
                  >
                    {agentConfig.shortLabel}
                  </span>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Decorative corner accent */}
      <div
        className={cn(
          'absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none',
          'bg-gradient-to-bl rounded-bl-full',
          routingInfo.primaryAgent === 'discovery' && 'from-amber-500',
          routingInfo.primaryAgent === 'itinerary' && 'from-terracotta',
          routingInfo.primaryAgent === 'booking' && 'from-teal-500',
          routingInfo.primaryAgent === 'general' && 'from-sage'
        )}
      />
    </motion.div>
  );
}

/**
 * Inline badge version for chat messages
 */
export function RoutingBadge({ agent }: { agent: AgentType }) {
  const config = AGENT_CONFIG[agent];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
        config.bgColor,
        config.color,
        'border',
        config.borderColor
      )}
    >
      <span className="scale-75">{config.icon}</span>
      {config.shortLabel}
    </motion.span>
  );
}

export default RoutingIndicator;
