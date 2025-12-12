/**
 * DiscoveryIntelligenceView
 *
 * The main integration component that connects the City Intelligence Agent system
 * to the Discovery phase. Shows real-time agent progress, rich city cards, and
 * allows users to explore deeply before proceeding.
 *
 * Design: Editorial/magazine aesthetic with refined typography and elegant animations.
 * The cards "come alive" as intelligence arrives, creating a sense of discovery.
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ChevronRight,
  Brain,
  Clock,
  MapPin,
  Gem,
  Sun,
  Camera,
  Car,
  Zap,
  Check,
  Loader2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useCityIntelligence, useCityIntelligenceForCity } from '../../hooks/useCityIntelligence';
import type { DiscoveryCity, DiscoveryRoute, TripSummary } from '../../stores/discoveryStore';
import type { AgentName, CityData, CityIntelligence } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface DiscoveryIntelligenceViewProps {
  route: DiscoveryRoute | null;
  tripSummary: TripSummary | null;
  selectedCityId: string | null;
  onCitySelect: (cityId: string) => void;
  onProceed: () => void;
  isDesktop?: boolean;
}

interface IntelligenceCityCardProps {
  city: DiscoveryCity;
  nights: number;
  isSelected: boolean;
  onSelect: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const AGENT_ICONS: Record<AgentName, typeof Clock> = {
  TimeAgent: Clock,
  StoryAgent: Sparkles,
  PreferenceAgent: Zap,
  ClusterAgent: MapPin,
  GemsAgent: Gem,
  LogisticsAgent: Car,
  WeatherAgent: Sun,
  PhotoAgent: Camera,
  SynthesisAgent: Brain,
};

// Agent colors available for future use
const _AGENT_COLORS: Record<AgentName, string> = {
  TimeAgent: '#6366f1',
  StoryAgent: '#ec4899',
  PreferenceAgent: '#f59e0b',
  ClusterAgent: '#10b981',
  GemsAgent: '#8b5cf6',
  LogisticsAgent: '#64748b',
  WeatherAgent: '#0ea5e9',
  PhotoAgent: '#f97316',
  SynthesisAgent: '#06b6d4',
};
void _AGENT_COLORS;

// =============================================================================
// Main Component
// =============================================================================

export function DiscoveryIntelligenceView({
  route,
  tripSummary,
  selectedCityId,
  onCitySelect,
  onProceed,
  isDesktop: _isDesktop = false,
}: DiscoveryIntelligenceViewProps) {
  void _isDesktop; // Available for desktop-specific layouts
  const reducedMotion = useReducedMotion();
  const intelligenceStarted = useRef(false);
  const [_viewMode, _setViewMode] = useState<'cards' | 'detail'>('cards');
  void _viewMode; void _setViewMode; // Available for future view switching

  // Intelligence state
  const {
    isProcessing,
    isComplete,
    overallProgress,
    currentPhase,
    allCityIntelligence: _allCityIntelligence,
    completedCount,
    citiesCount,
    start,
    hasErrors,
  } = useCityIntelligence();
  void _allCityIntelligence; // Available for detailed views

  // Get selected cities from route
  const selectedCities = route?.suggestedCities.filter(c => c.isSelected) || [];
  const allCities = [
    ...(route?.origin ? [route.origin] : []),
    ...selectedCities,
    ...(route?.destination ? [route.destination] : []),
  ];

  // Start intelligence gathering when cities are ready
  useEffect(() => {
    if (!route || !tripSummary || intelligenceStarted.current || allCities.length < 2) {
      return;
    }

    // Convert discovery cities to CityData format
    const cities: CityData[] = allCities.map(city => ({
      id: city.id,
      name: city.name,
      country: city.country,
      coordinates: city.coordinates,
    }));

    // Build nights map
    const nights: Record<string, number> = {};
    allCities.forEach(city => {
      nights[city.id] = city.nights || city.suggestedNights || 1;
    });

    // Start intelligence gathering
    console.log('🚀 Starting City Intelligence for discovery...');
    intelligenceStarted.current = true;

    start({
      cities,
      nights,
      preferences: {
        travellerType: tripSummary.travellerType,
      },
      trip: {
        origin: cities[0],
        destination: cities[cities.length - 1],
        totalNights: tripSummary.totalNights,
        travellerType: tripSummary.travellerType,
        transportMode: 'car',
        startDate: tripSummary.startDate?.toISOString(),
        endDate: tripSummary.endDate?.toISOString(),
      },
    });
  }, [route, tripSummary, allCities, start]);

  // Reset when route changes significantly
  useEffect(() => {
    return () => {
      intelligenceStarted.current = false;
    };
  }, [route?.origin?.id, route?.destination?.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with progress */}
      <IntelligenceHeader
        isProcessing={isProcessing}
        isComplete={isComplete}
        progress={overallProgress}
        phase={currentPhase}
        completedCount={completedCount}
        totalCount={citiesCount}
        hasErrors={hasErrors}
      />

      {/* City Cards Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {allCities.map((city, index) => (
            <motion.div
              key={city.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: reducedMotion ? 0 : 0.4,
                delay: reducedMotion ? 0 : index * 0.1,
              }}
            >
              <IntelligenceCityCard
                city={city}
                nights={city.nights || city.suggestedNights || 1}
                isSelected={selectedCityId === city.id}
                onSelect={() => onCitySelect(city.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Proceed Button */}
      <div className="p-4 border-t border-stone-200 bg-white/80 backdrop-blur-sm">
        <motion.button
          onClick={onProceed}
          disabled={!isComplete && isProcessing}
          className={`
            w-full py-4 px-6 rounded-2xl font-medium text-lg
            flex items-center justify-center gap-3
            transition-all duration-300
            ${isComplete
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40'
              : isProcessing
              ? 'bg-stone-100 text-stone-400 cursor-wait'
              : 'bg-stone-900 text-white hover:bg-stone-800'
            }
          `}
          whileHover={isComplete ? { scale: 1.02 } : {}}
          whileTap={isComplete ? { scale: 0.98 } : {}}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Building your intelligence...</span>
            </>
          ) : isComplete ? (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Continue with AI Insights</span>
              <ArrowRight className="w-5 h-5" />
            </>
          ) : (
            <>
              <span>Generate Itinerary</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        {isComplete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-emerald-600 mt-2 font-medium"
          >
            ✨ Intelligence ready for {citiesCount} cities
          </motion.p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Intelligence Header
// =============================================================================

interface IntelligenceHeaderProps {
  isProcessing: boolean;
  isComplete: boolean;
  progress: number;
  phase: string;
  completedCount: number;
  totalCount: number;
  hasErrors: boolean;
}

function IntelligenceHeader({
  isProcessing,
  isComplete,
  progress,
  phase,
  completedCount,
  totalCount,
  hasErrors,
}: IntelligenceHeaderProps) {
  const getPhaseLabel = () => {
    switch (phase) {
      case 'planning': return 'Planning analysis...';
      case 'executing': return 'Gathering intelligence...';
      case 'reflecting': return 'Evaluating quality...';
      case 'refining': return 'Enhancing results...';
      case 'complete': return 'Analysis complete';
      default: return 'Preparing...';
    }
  };

  return (
    <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-stone-50 to-amber-50/30">
      {/* Title Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`
            p-2 rounded-xl
            ${isComplete ? 'bg-emerald-100' : isProcessing ? 'bg-amber-100' : 'bg-stone-100'}
          `}>
            <Brain className={`
              w-5 h-5
              ${isComplete ? 'text-emerald-600' : isProcessing ? 'text-amber-600' : 'text-stone-500'}
            `} />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900" style={{ fontFamily: '"Fraunces", serif' }}>
              City Intelligence
            </h3>
            <p className="text-xs text-stone-500">
              {getPhaseLabel()}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`
          px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5
          ${isComplete
            ? 'bg-emerald-100 text-emerald-700'
            : isProcessing
            ? 'bg-amber-100 text-amber-700'
            : hasErrors
            ? 'bg-rose-100 text-rose-700'
            : 'bg-stone-100 text-stone-600'
          }
        `}>
          {isComplete ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Ready</span>
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{completedCount}/{totalCount}</span>
            </>
          ) : hasErrors ? (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Issues</span>
            </>
          ) : (
            <span>Pending</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(isProcessing || isComplete) && (
        <div className="relative h-2 bg-stone-200 rounded-full overflow-hidden">
          <motion.div
            className={`
              absolute inset-y-0 left-0 rounded-full
              ${isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }
            `}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {isProcessing && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Intelligence City Card
// =============================================================================

function IntelligenceCityCard({
  city,
  nights,
  isSelected,
  onSelect,
}: IntelligenceCityCardProps) {
  const { intelligence, agentStates, progress, isProcessing, isComplete, quality } =
    useCityIntelligenceForCity(city.id);

  const _runningAgents = Object.entries(agentStates)
    .filter(([, state]) => state.status === 'running')
    .map(([name]) => name as AgentName);
  void _runningAgents;

  const _completedAgents = Object.entries(agentStates)
    .filter(([, state]) => state.status === 'completed')
    .map(([name]) => name as AgentName);
  void _completedAgents;

  return (
    <motion.div
      onClick={onSelect}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        transition-all duration-300
        ${isSelected
          ? 'ring-2 ring-amber-500 shadow-xl shadow-amber-500/20'
          : 'hover:shadow-lg hover:shadow-stone-900/10'
        }
      `}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Gradient */}
      <div className={`
        absolute inset-0
        ${isComplete
          ? 'bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/30'
          : isProcessing
          ? 'bg-gradient-to-br from-white via-amber-50/50 to-orange-50/30'
          : 'bg-gradient-to-br from-white to-stone-50'
        }
      `} />

      {/* Content */}
      <div className="relative p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className="text-lg font-semibold text-stone-900"
                style={{ fontFamily: '"Fraunces", serif' }}
              >
                {city.name}
              </h4>
              {city.isFixed && (
                <span className="px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-600 rounded-full">
                  {city.id === 'origin' ? 'Start' : 'End'}
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500">
              {city.country} · {nights} {nights === 1 ? 'night' : 'nights'}
            </p>
          </div>

          {/* Quality Score */}
          {isComplete && quality > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">{quality}%</span>
            </div>
          )}
        </div>

        {/* Story Hook (if available) */}
        {intelligence?.story?.hook && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-sm text-stone-700 mb-3 italic"
            style={{ fontFamily: '"Fraunces", serif' }}
          >
            "{intelligence.story.hook}"
          </motion.p>
        )}

        {/* Agent Progress Pills */}
        {(isProcessing || isComplete) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(AGENT_ICONS).slice(0, 6).map(([name, Icon]) => {
              const agentName = name as AgentName;
              const state = agentStates[agentName];
              const isRunning = state?.status === 'running';
              const isDone = state?.status === 'completed';

              return (
                <motion.div
                  key={name}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                    ${isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isRunning
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-stone-100 text-stone-400'
                    }
                  `}
                  animate={isRunning ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
                >
                  <Icon className="w-3 h-3" />
                  {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
                  {isDone && <Check className="w-3 h-3" />}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Intelligence Highlights */}
        {isComplete && intelligence && (
          <IntelligenceHighlights intelligence={intelligence} />
        )}

        {/* Progress Bar (when processing) */}
        {isProcessing && (
          <div className="relative h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Select Indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ChevronRight className={`
            w-5 h-5 transition-colors
            ${isSelected ? 'text-amber-500' : 'text-stone-300'}
          `} />
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Intelligence Highlights (Summary of key data)
// =============================================================================

interface IntelligenceHighlightsProps {
  intelligence: CityIntelligence;
}

function IntelligenceHighlights({ intelligence }: IntelligenceHighlightsProps) {
  const highlights: { icon: typeof MapPin; label: string; value: string }[] = [];

  // Match Score
  if (intelligence.matchScore?.score) {
    highlights.push({
      icon: Zap,
      label: 'Match',
      value: `${intelligence.matchScore.score}%`,
    });
  }

  // Clusters
  if (intelligence.clusters?.clusters?.length) {
    highlights.push({
      icon: MapPin,
      label: 'Areas',
      value: `${intelligence.clusters.clusters.length}`,
    });
  }

  // Hidden Gems
  if (intelligence.hiddenGems?.hiddenGems?.length) {
    highlights.push({
      icon: Gem,
      label: 'Gems',
      value: `${intelligence.hiddenGems.hiddenGems.length}`,
    });
  }

  // Photo Spots
  if (intelligence.photoSpots?.spots?.length) {
    highlights.push({
      icon: Camera,
      label: 'Photos',
      value: `${intelligence.photoSpots.spots.length}`,
    });
  }

  if (highlights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 pt-2 border-t border-stone-100"
    >
      {highlights.slice(0, 4).map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-1.5 text-stone-600">
          <Icon className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-xs font-medium">{value}</span>
          <span className="text-xs text-stone-400">{label}</span>
        </div>
      ))}
    </motion.div>
  );
}

export default DiscoveryIntelligenceView;
