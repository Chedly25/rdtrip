/**
 * IntelligenceProgressPanel
 *
 * A compact, embeddable panel showing real-time intelligence gathering status.
 * Perfect for floating over content or embedding in headers/footers.
 *
 * Design Philosophy:
 * - Compact but information-dense
 * - Animated progress with agent activity visualization
 * - Expandable for more detail
 * - Can be dismissed when complete
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  BookOpen,
  Heart,
  MapPin,
  Gem,
  Car,
  CloudSun,
  Camera,
  Layers,
  Zap,
} from 'lucide-react';

import { useCityIntelligence, getAgentDisplayName } from '../../hooks/useCityIntelligence';
import type { AgentName, AgentExecutionState } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface IntelligenceProgressPanelProps {
  /** Show as floating panel */
  floating?: boolean;
  /** Position when floating */
  position?: 'top' | 'bottom';
  /** Allow dismissing */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Compact mode */
  compact?: boolean;
}

// =============================================================================
// Configuration
// =============================================================================

const AGENT_ICONS: Record<AgentName, typeof Clock> = {
  TimeAgent: Clock,
  StoryAgent: BookOpen,
  PreferenceAgent: Heart,
  ClusterAgent: MapPin,
  GemsAgent: Gem,
  LogisticsAgent: Car,
  WeatherAgent: CloudSun,
  PhotoAgent: Camera,
  SynthesisAgent: Layers,
};

// =============================================================================
// Main Component
// =============================================================================

export function IntelligenceProgressPanel({
  floating = true,
  position = 'bottom',
  dismissible = true,
  onDismiss,
  compact = false,
}: IntelligenceProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const {
    isProcessing,
    isComplete,
    overallProgress,
    currentPhase,
    allCityIntelligence,
    completedCount,
    citiesCount,
    hasErrors,
    errors,
    cancel,
  } = useCityIntelligence();

  // Don't show if dismissed or nothing to show
  if (isDismissed || (!isProcessing && !isComplete)) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Gather all running agents across cities
  const runningAgents: { cityName: string; agentName: AgentName; progress?: number }[] = [];
  allCityIntelligence.forEach((intel) => {
    const cityAgents = Object.entries(intel) as [string, unknown][];
    // This is a simplification - in reality we'd get agent states from the store
  });

  // Position classes
  const positionClasses = floating
    ? position === 'top'
      ? 'fixed top-4 left-1/2 -translate-x-1/2 z-50'
      : 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
      className={`${positionClasses} ${compact ? 'max-w-xs' : 'max-w-md'} w-full`}
    >
      <div
        className={`
          bg-white/95 backdrop-blur-xl
          ${floating ? 'rounded-2xl shadow-2xl border border-gray-200/50' : 'rounded-xl border border-gray-200'}
          overflow-hidden
        `}
      >
        {/* Main content */}
        <div className={compact ? 'p-3' : 'p-4'}>
          <div className="flex items-center gap-3">
            {/* Status icon */}
            <div className="relative">
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className={`
                    ${compact ? 'w-10 h-10' : 'w-12 h-12'}
                    rounded-xl bg-gradient-to-br from-violet-500 to-purple-600
                    flex items-center justify-center
                    shadow-lg shadow-violet-500/25
                  `}
                >
                  <Sparkles className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
                </motion.div>
              ) : isComplete ? (
                <div
                  className={`
                    ${compact ? 'w-10 h-10' : 'w-12 h-12'}
                    rounded-xl bg-gradient-to-br from-emerald-500 to-green-600
                    flex items-center justify-center
                    shadow-lg shadow-emerald-500/25
                  `}
                >
                  <CheckCircle className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
                </div>
              ) : hasErrors ? (
                <div
                  className={`
                    ${compact ? 'w-10 h-10' : 'w-12 h-12'}
                    rounded-xl bg-gradient-to-br from-red-500 to-rose-600
                    flex items-center justify-center
                  `}
                >
                  <AlertCircle className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
                </div>
              ) : null}

              {/* Progress ring */}
              {isProcessing && (
                <svg
                  className="absolute inset-0 -rotate-90"
                  viewBox="0 0 48 48"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={125.6}
                    animate={{ strokeDashoffset: 125.6 - (overallProgress / 100) * 125.6 }}
                    transition={{ duration: 0.3 }}
                  />
                </svg>
              )}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : ''}`}>
                  {isProcessing
                    ? 'Gathering Intelligence'
                    : isComplete
                      ? 'Intelligence Ready'
                      : 'Processing'
                  }
                </h3>

                <div className="flex items-center gap-1">
                  {/* Expand button */}
                  {!compact && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    </button>
                  )}

                  {/* Dismiss button */}
                  {dismissible && isComplete && (
                    <button
                      onClick={handleDismiss}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress info */}
              <div className={`flex items-center gap-2 mt-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>
                {isProcessing ? (
                  <>
                    <span className="text-gray-600">
                      {completedCount}/{citiesCount} cities
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-violet-600 font-medium">
                      {overallProgress}%
                    </span>
                  </>
                ) : isComplete ? (
                  <span className="text-emerald-600">
                    All {citiesCount} cities processed
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {isProcessing && !compact && (
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
              />
            </div>
          )}

          {/* Active agents indicator */}
          {isProcessing && !compact && (
            <div className="mt-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <div className="flex items-center gap-1">
                <AgentActivityDots />
              </div>
              <span className="text-xs text-gray-500">
                Agents working...
              </span>
            </div>
          )}
        </div>

        {/* Expanded section */}
        <AnimatePresence>
          {isExpanded && !compact && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Cities progress */}
                <div className="space-y-2">
                  {allCityIntelligence.map((intel) => (
                    <CityProgressRow
                      key={intel.cityId}
                      cityName={intel.city?.name || intel.cityId}
                      status={intel.status}
                      quality={intel.quality}
                    />
                  ))}
                </div>

                {/* Errors */}
                {hasErrors && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-red-600 mb-1.5">
                      {errors.length} error{errors.length > 1 ? 's' : ''}
                    </p>
                    {errors.slice(0, 2).map((error, idx) => (
                      <p key={idx} className="text-xs text-red-500 truncate">
                        {error.message}
                      </p>
                    ))}
                  </div>
                )}

                {/* Cancel button */}
                {isProcessing && (
                  <button
                    onClick={cancel}
                    className="
                      w-full flex items-center justify-center gap-2
                      py-2 rounded-lg
                      text-xs font-medium text-gray-500
                      hover:bg-gray-50 transition-colors
                    "
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Agent Activity Dots
// =============================================================================

function AgentActivityDots() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className="w-1.5 h-1.5 rounded-full bg-violet-500"
        />
      ))}
    </div>
  );
}

// =============================================================================
// City Progress Row
// =============================================================================

interface CityProgressRowProps {
  cityName: string;
  status: string;
  quality?: number;
}

function CityProgressRow({ cityName, status, quality }: CityProgressRowProps) {
  const isComplete = status === 'complete';
  const isProcessing = status === 'processing';

  return (
    <div className="flex items-center gap-2">
      {/* Status icon */}
      {isComplete ? (
        <CheckCircle className="w-4 h-4 text-emerald-500" />
      ) : isProcessing ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-4 h-4 text-amber-500" />
        </motion.div>
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
      )}

      {/* City name */}
      <span className="flex-1 text-sm text-gray-700 truncate">{cityName}</span>

      {/* Quality badge */}
      {isComplete && quality !== undefined && (
        <span
          className={`
            text-xs font-medium px-1.5 py-0.5 rounded
            ${quality >= 85
              ? 'bg-emerald-100 text-emerald-700'
              : quality >= 70
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-600'
            }
          `}
        >
          {quality}%
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Minimal Progress Badge
// =============================================================================

interface IntelligenceBadgeProps {
  onClick?: () => void;
}

export function IntelligenceBadge({ onClick }: IntelligenceBadgeProps) {
  const { isProcessing, isComplete, overallProgress, hasErrors } = useCityIntelligence();

  if (!isProcessing && !isComplete) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        ${isProcessing
          ? 'bg-violet-100 text-violet-700'
          : hasErrors
            ? 'bg-red-100 text-red-700'
            : 'bg-emerald-100 text-emerald-700'
        }
        text-sm font-medium
        hover:opacity-80 transition-opacity
      `}
    >
      {isProcessing ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.div>
          <span>{overallProgress}%</span>
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Ready</span>
        </>
      )}
    </motion.button>
  );
}

export default IntelligenceProgressPanel;
