/**
 * IntelligenceSidebar
 *
 * A collapsible sidebar that shows real-time intelligence gathering status,
 * agent activity, and allows interaction with the orchestrator.
 *
 * Design Philosophy:
 * - Mission control aesthetic - seeing AI agents work in real-time
 * - Clear status visualization with progress rings
 * - Expandable sections for each city being processed
 * - Error handling with recovery options
 * - "Behind the scenes" peek at the AI's work
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Heart,
  MapPin,
  Gem,
  Car,
  CloudSun,
  Camera,
  Layers,
  CheckCircle,
  AlertCircle,
  Loader2,
  Circle,
  RefreshCw,
  X,
  BarChart3,
  Zap,
  Brain,
  MessageSquare,
} from 'lucide-react';

import {
  useCityIntelligence,
  useCityIntelligenceForCity,
  getAgentDisplayName,
} from '../../hooks/useCityIntelligence';
import { DeepDiveRequest, type DeepDiveTopic } from './DeepDiveRequest';
import { QuickFeedbackBar } from './IntelligenceFeedback';
import type { AgentName, AgentExecutionState, OrchestratorPhase } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface IntelligenceSidebarProps {
  /** Whether the sidebar is open by default */
  defaultOpen?: boolean;
  /** Callback when sidebar open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Position of the sidebar */
  position?: 'left' | 'right';
  /** Callback when deep dive is requested */
  onDeepDiveRequest?: (cityId: string, topic: DeepDiveTopic, customQuery?: string) => Promise<void>;
  /** Callback when feedback is submitted */
  onFeedback?: (cityId: string, rating: 'positive' | 'negative') => void;
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

const PHASE_CONFIG: Record<OrchestratorPhase, { label: string; color: string; icon: typeof Brain }> = {
  planning: { label: 'Planning', color: 'text-blue-500', icon: Brain },
  executing: { label: 'Executing', color: 'text-amber-500', icon: Zap },
  reflecting: { label: 'Reflecting', color: 'text-purple-500', icon: BarChart3 },
  refining: { label: 'Refining', color: 'text-orange-500', icon: RefreshCw },
  complete: { label: 'Complete', color: 'text-emerald-500', icon: CheckCircle },
};

// =============================================================================
// Main Component
// =============================================================================

export function IntelligenceSidebar({
  defaultOpen = false,
  onOpenChange,
  position = 'right',
  onDeepDiveRequest,
  onFeedback,
}: IntelligenceSidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedCityForDeepDive, setSelectedCityForDeepDive] = useState<string | null>(null);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);

  const {
    isProcessing,
    isComplete,
    overallProgress,
    currentPhase,
    goal,
    errors,
    hasErrors,
    allCityIntelligence,
    completedCount,
    citiesCount,
    cancel,
  } = useCityIntelligence();

  // Handle deep dive request
  const handleDeepDiveRequest = useCallback(async (topic: DeepDiveTopic, customQuery?: string) => {
    if (!selectedCityForDeepDive || !onDeepDiveRequest) return;

    setIsDeepDiveLoading(true);
    try {
      await onDeepDiveRequest(selectedCityForDeepDive, topic, customQuery);
    } finally {
      setIsDeepDiveLoading(false);
    }
  }, [selectedCityForDeepDive, onDeepDiveRequest]);

  // Get selected city info
  const selectedCityIntel = selectedCityForDeepDive
    ? allCityIntelligence.find(c => c.cityId === selectedCityForDeepDive)
    : null;
  const selectedCityName = selectedCityIntel?.city?.name || selectedCityForDeepDive || '';

  // Notify parent of state changes
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Auto-open when processing starts
  useEffect(() => {
    if (isProcessing && !isOpen) {
      setIsOpen(true);
    }
  }, [isProcessing, isOpen]);

  const toggleOpen = () => setIsOpen(!isOpen);

  const phaseConfig = PHASE_CONFIG[currentPhase] || PHASE_CONFIG.planning;
  const PhaseIcon = phaseConfig.icon;

  // Position classes
  const positionClasses = position === 'left'
    ? 'left-0 border-r'
    : 'right-0 border-l';

  const togglePosition = position === 'left' ? '-right-10' : '-left-10';
  const ToggleChevron = position === 'left'
    ? (isOpen ? ChevronLeft : ChevronRight)
    : (isOpen ? ChevronRight : ChevronLeft);

  return (
    <>
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isOpen ? 320 : 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`
          fixed top-0 ${positionClasses} bottom-0
          bg-white/95 backdrop-blur-lg
          border-gray-200
          shadow-xl z-40
          overflow-hidden
        `}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-80 h-full flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      {isProcessing && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white"
                        />
                      )}
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-gray-900">
                        Intelligence
                      </h2>
                      <p className="text-xs text-gray-500">
                        {isProcessing ? 'Working...' : isComplete ? 'Complete' : 'Ready'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={toggleOpen}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Phase indicator */}
                {(isProcessing || isComplete) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2"
                  >
                    <PhaseIcon className={`w-4 h-4 ${phaseConfig.color}`} />
                    <span className={`text-sm font-medium ${phaseConfig.color}`}>
                      {phaseConfig.label}
                    </span>
                    {isProcessing && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {overallProgress}%
                      </span>
                    )}
                  </motion.div>
                )}

                {/* Progress bar */}
                {isProcessing && (
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${overallProgress}%` }}
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Goal summary */}
                {goal && (
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Current Goal
                    </p>
                    <p className="text-sm text-gray-700">{goal.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{goal.cities.length} cities</span>
                      <span>•</span>
                      <span>Quality: {goal.qualityThreshold}%</span>
                    </div>
                  </div>
                )}

                {/* City progress cards */}
                <div className="p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Cities ({completedCount}/{citiesCount})
                  </p>

                  {allCityIntelligence.map((intel) => (
                    <CityProgressCard
                      key={intel.cityId}
                      cityId={intel.cityId}
                      onFeedback={onFeedback}
                    />
                  ))}

                  {allCityIntelligence.length === 0 && !isProcessing && (
                    <div className="text-center py-8 text-gray-400">
                      <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No intelligence sessions active</p>
                    </div>
                  )}
                </div>

                {/* Errors */}
                {hasErrors && (
                  <div className="p-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                      Errors ({errors.length})
                    </p>
                    {errors.slice(0, 3).map((error, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100 mb-2"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-red-700 line-clamp-2">
                            {error.message}
                          </p>
                          {error.agent && (
                            <p className="text-[10px] text-red-500 mt-0.5">
                              {getAgentDisplayName(error.agent)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Deep Dive Section */}
                {isComplete && allCityIntelligence.length > 0 && onDeepDiveRequest && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Explore Deeper
                      </p>
                    </div>

                    {/* City selector */}
                    <div className="mb-3">
                      <select
                        value={selectedCityForDeepDive || ''}
                        onChange={(e) => setSelectedCityForDeepDive(e.target.value || null)}
                        className="
                          w-full px-3 py-2 rounded-lg
                          text-sm text-gray-900
                          border border-gray-200 bg-white
                          focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
                        "
                      >
                        <option value="">Select a city...</option>
                        {allCityIntelligence
                          .filter(intel => intel.status === 'complete')
                          .map((intel) => (
                            <option key={intel.cityId} value={intel.cityId}>
                              {intel.city?.name || intel.cityId}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Deep dive request component */}
                    <AnimatePresence>
                      {selectedCityForDeepDive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <DeepDiveRequest
                            cityId={selectedCityForDeepDive}
                            cityName={selectedCityName}
                            onRequest={handleDeepDiveRequest}
                            isLoading={isDeepDiveLoading}
                            compact
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              {isProcessing && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                  <button
                    onClick={cancel}
                    className="
                      w-full flex items-center justify-center gap-2
                      px-4 py-2.5 rounded-xl
                      bg-white border border-gray-200
                      text-sm font-medium text-gray-600
                      hover:bg-gray-50 transition-colors
                    "
                  >
                    <X className="w-4 h-4" />
                    Cancel Intelligence
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Toggle button */}
      <motion.button
        initial={false}
        animate={{
          x: isOpen ? 0 : (position === 'left' ? -40 : 40),
        }}
        onClick={toggleOpen}
        className={`
          fixed top-1/2 -translate-y-1/2 ${togglePosition}
          z-50 w-10 h-20
          bg-white/95 backdrop-blur-lg
          border border-gray-200
          ${position === 'left' ? 'rounded-r-xl' : 'rounded-l-xl'}
          shadow-lg
          flex flex-col items-center justify-center gap-1
          hover:bg-gray-50 transition-colors
        `}
      >
        {isProcessing && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-4 h-4 text-violet-500" />
          </motion.div>
        )}
        <ToggleChevron className="w-4 h-4 text-gray-400" />
      </motion.button>
    </>
  );
}

// =============================================================================
// City Progress Card
// =============================================================================

interface CityProgressCardProps {
  cityId: string;
  onFeedback?: (cityId: string, rating: 'positive' | 'negative') => void;
}

function CityProgressCard({ cityId, onFeedback }: CityProgressCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    intelligence,
    agentStates,
    progress,
    isProcessing,
    isComplete,
    quality,
  } = useCityIntelligenceForCity(cityId);

  const cityName = intelligence?.city?.name || cityId;
  const _status = intelligence?.status || 'pending';
  void _status; // Available for status display

  // Calculate agent completion
  const agents = Object.entries(agentStates || {}) as [AgentName, AgentExecutionState][];
  const completedAgents = agents.filter(([, s]) => s.status === 'completed').length;
  const _runningAgents = agents.filter(([, s]) => s.status === 'running');
  void _runningAgents; // Available for running status display
  const failedAgents = agents.filter(([, s]) => s.status === 'failed');

  // Handle feedback
  const handleFeedback = (rating: 'positive' | 'negative') => {
    onFeedback?.(cityId, rating);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border overflow-hidden
        ${isComplete
          ? 'bg-emerald-50/50 border-emerald-200'
          : isProcessing
            ? 'bg-amber-50/50 border-amber-200'
            : 'bg-gray-50 border-gray-200'
        }
      `}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Status indicator */}
        <div className="relative">
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-5 h-5 text-amber-500" />
            </motion.div>
          ) : isComplete ? (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          ) : failedAgents.length > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-300" />
          )}
        </div>

        {/* City info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate text-sm">{cityName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">
              {completedAgents}/{agents.length} agents
            </span>
            {isComplete && (
              <>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-emerald-600 font-medium">
                  {quality}% quality
                </span>
              </>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
        </motion.div>
      </button>

      {/* Progress bar */}
      {isProcessing && (
        <div className="px-3 pb-3">
          <div className="h-1 bg-amber-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Expanded agent list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200/50 overflow-hidden"
          >
            <div className="p-2 space-y-1">
              {agents.map(([agentName, state]) => {
                const Icon = AGENT_ICONS[agentName] || Layers;
                const displayName = getAgentDisplayName(agentName);

                return (
                  <div
                    key={agentName}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/50"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600 flex-1 truncate">
                      {displayName}
                    </span>
                    <AgentStatusBadge status={state.status} progress={state.progress} />
                  </div>
                );
              })}

              {agents.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  No agents started
                </p>
              )}

              {/* Feedback bar for completed cities */}
              {isComplete && onFeedback && (
                <div className="mt-2 pt-2 border-t border-gray-200/50 px-2">
                  <QuickFeedbackBar cityId={cityId} onFeedback={handleFeedback} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// Agent Status Badge
// =============================================================================

interface AgentStatusBadgeProps {
  status: AgentExecutionState['status'];
  progress?: number;
}

function AgentStatusBadge({ status, progress }: AgentStatusBadgeProps) {
  switch (status) {
    case 'completed':
      return (
        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
          <CheckCircle className="w-3 h-3" />
          Done
        </span>
      );

    case 'running':
      return (
        <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-3 h-3" />
          </motion.div>
          {progress !== undefined && progress > 0 ? `${progress}%` : 'Running'}
        </span>
      );

    case 'failed':
      return (
        <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
          <AlertCircle className="w-3 h-3" />
          Failed
        </span>
      );

    default:
      return (
        <span className="text-[10px] text-gray-400">
          Pending
        </span>
      );
  }
}

export default IntelligenceSidebar;
