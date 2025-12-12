/**
 * IntelligenceCityPreview
 *
 * Enhanced city preview modal that displays rich City Intelligence data.
 * Shows agent progress, story hooks, clusters, match scores, hidden gems,
 * and other intelligence insights as they become available.
 *
 * Design: Editorial magazine aesthetic with elegant typography and
 * progressive reveal animations as intelligence data arrives.
 */

import { useState, useEffect, Component, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Gem,
  Moon,
  Plus,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Clock,
  Sun,
  Camera,
  Car,
  Zap,
  Check,
  Loader2,
  Brain,
  Star,
  Coffee,
  Utensils,
  ShoppingBag,
  TreePine,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import type { DiscoveryCity } from '../../stores/discoveryStore';
import { useDiscoveryStore } from '../../stores/discoveryStore';
import { useCityIntelligenceForCity } from '../../hooks/useCityIntelligence';
import { fetchCityImage } from '../../services/cityImages';
import type { AgentName, Cluster, HiddenGem, PhotoSpot } from '../../types/cityIntelligence';

// =============================================================================
// Error Boundary for Intelligence Preview
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class IntelligencePreviewErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[IntelligenceCityPreview] Render error:', error, errorInfo);
    // Try to clear potentially corrupted localStorage
    try {
      localStorage.removeItem('waycraft-city-intelligence');
    } catch {
      // Ignore
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// =============================================================================
// Types
// =============================================================================

interface IntelligenceCityPreviewProps {
  city: DiscoveryCity | null;
  onClose: () => void;
  onToggleSelection: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const AGENT_LABELS: Record<AgentName, string> = {
  TimeAgent: 'Time Planning',
  StoryAgent: 'Story',
  PreferenceAgent: 'Matching',
  ClusterAgent: 'Areas',
  GemsAgent: 'Hidden Gems',
  LogisticsAgent: 'Logistics',
  WeatherAgent: 'Weather',
  PhotoAgent: 'Photos',
  SynthesisAgent: 'Synthesis',
};

const CLUSTER_ICONS: Record<string, typeof MapPin> = {
  historic: MapPin,
  dining: Utensils,
  shopping: ShoppingBag,
  nature: TreePine,
  nightlife: Moon,
  culture: Star,
  default: MapPin,
};

// =============================================================================
// Fallback Component (shown when Intelligence errors)
// =============================================================================

function IntelligencePreviewFallback({
  city,
  onClose,
}: {
  city: DiscoveryCity | null;
  onClose: () => void;
}) {
  if (!city) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden flex flex-col"
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-stone-900">{city.name}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-amber-600 mb-4">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Intelligence temporarily unavailable</span>
          </div>

          <p className="text-stone-600">{city.description || `Explore ${city.name}, ${city.country}`}</p>
        </div>
      </motion.div>
    </>
  );
}

// =============================================================================
// Main Component (Internal)
// =============================================================================

function IntelligenceCityPreviewContent({
  city,
  onClose,
  onToggleSelection,
}: IntelligenceCityPreviewProps) {
  const [cityImage, setCityImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [_activeSection, _setActiveSection] = useState<string | null>(null);
  void _activeSection; void _setActiveSection; // Available for section navigation

  // Intelligence data for this city
  const {
    intelligence,
    agentStates,
    progress,
    isProcessing,
    isComplete,
    quality,
    completedAgentsCount,
    totalAgentsCount,
  } = useCityIntelligenceForCity(city?.id || '');

  // Get favourites state from store (available for future place favoriting)
  const { isPlaceFavourited: _isPlaceFavourited, togglePlaceFavourite: _togglePlaceFavourite } = useDiscoveryStore();
  void _isPlaceFavourited; void _togglePlaceFavourite;

  // Fetch city image
  useEffect(() => {
    if (!city) return;
    setCityImage(null);
    setImageLoading(true);

    const loadImage = async () => {
      try {
        const imageUrl = await fetchCityImage(city.name, city.country);
        setCityImage(imageUrl);
      } catch (error) {
        console.error('Failed to fetch city image:', error);
      } finally {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [city?.name, city?.country]);

  if (!city) return null;

  const isInTrip = city.isSelected;
  const isFixed = city.isFixed;
  const hasIntelligence = !!intelligence && (isProcessing || isComplete);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="
          fixed bottom-0 left-0 right-0
          md:bottom-auto md:top-1/2 md:left-1/2
          md:-translate-x-1/2 md:-translate-y-1/2
          md:max-w-xl md:w-full md:mx-4
          z-50
          max-h-[92vh] md:max-h-[88vh]
        "
      >
        <div
          className="
            bg-white rounded-t-3xl md:rounded-3xl
            overflow-hidden flex flex-col
            max-h-[92vh] md:max-h-[88vh]
            shadow-2xl
          "
        >
          {/* Header with image */}
          <CityHeader
            city={city}
            cityImage={cityImage}
            imageLoading={imageLoading}
            isFixed={isFixed}
            onClose={onClose}
          />

          {/* Intelligence Status Bar */}
          {hasIntelligence && (
            <IntelligenceStatusBar
              isProcessing={isProcessing}
              isComplete={isComplete}
              progress={progress}
              quality={quality}
              completedCount={completedAgentsCount}
              totalCount={totalAgentsCount}
              agentStates={agentStates}
            />
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-5 space-y-5">
              {/* Story Hook - The narrative intro */}
              {intelligence?.story?.hook && (
                <StorySection story={intelligence.story} />
              )}

              {/* Match Score */}
              {intelligence?.matchScore && (
                <MatchScoreSection matchScore={intelligence.matchScore} />
              )}

              {/* Time Blocks */}
              {intelligence?.timeBlocks?.blocks && intelligence.timeBlocks.blocks.length > 0 && (
                <TimeBlocksSection
                  timeBlocks={intelligence.timeBlocks.blocks}
                  totalHours={intelligence.timeBlocks.totalUsableHours}
                />
              )}

              {/* Clusters / Areas */}
              {intelligence?.clusters?.clusters && intelligence.clusters.clusters.length > 0 && (
                <ClustersSection clusters={intelligence.clusters.clusters} />
              )}

              {/* Hidden Gems */}
              {intelligence?.hiddenGems?.hiddenGems && intelligence.hiddenGems.hiddenGems.length > 0 && (
                <HiddenGemsSection gems={intelligence.hiddenGems.hiddenGems} />
              )}

              {/* Photo Spots */}
              {intelligence?.photoSpots?.spots && intelligence.photoSpots.spots.length > 0 && (
                <PhotoSpotsSection spots={intelligence.photoSpots.spots} />
              )}

              {/* Logistics */}
              {intelligence?.logistics && (
                <LogisticsSection logistics={intelligence.logistics} />
              )}

              {/* Weather */}
              {intelligence?.weather && (
                <WeatherSection weather={intelligence.weather} />
              )}

              {/* Fallback: Basic city info if no intelligence yet */}
              {!hasIntelligence && (
                <BasicCityInfo city={city} />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <ActionButtons
            city={city}
            isInTrip={isInTrip}
            isFixed={isFixed}
            onToggleSelection={onToggleSelection}
            hasIntelligence={hasIntelligence && isComplete}
          />
        </div>
      </motion.div>
    </>
  );
}

// =============================================================================
// City Header
// =============================================================================

interface CityHeaderProps {
  city: DiscoveryCity;
  cityImage: string | null;
  imageLoading: boolean;
  isFixed: boolean;
  onClose: () => void;
}

function CityHeader({ city, cityImage, imageLoading, isFixed, onClose }: CityHeaderProps) {
  return (
    <div className="relative h-44 md:h-52 flex-shrink-0 overflow-hidden">
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      />

      {/* Loading shimmer */}
      {imageLoading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* City image */}
      {(cityImage || city.imageUrl) && (
        <motion.img
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          src={cityImage || city.imageUrl}
          alt={city.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Badge */}
      <div
        className={`
          absolute top-4 left-4 px-3 py-1.5 rounded-full
          text-xs font-semibold backdrop-blur-md
          ${isFixed
            ? 'bg-amber-500/90 text-white'
            : 'bg-white/90 text-stone-800'
          }
        `}
      >
        {isFixed
          ? city.id === 'origin' ? 'Starting Point' : 'Final Destination'
          : 'Suggested Stop'}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="
          absolute top-4 right-4 w-10 h-10 rounded-full
          bg-black/30 backdrop-blur-md hover:bg-black/50
          flex items-center justify-center text-white
          transition-colors duration-200
        "
      >
        <X className="w-5 h-5" />
      </button>

      {/* City name */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2
          className="text-3xl font-bold text-white mb-1"
          style={{ fontFamily: '"Fraunces", serif' }}
        >
          {city.name}
        </h2>
        <p className="text-white/70 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {city.country}
          {city.nights || city.suggestedNights ? (
            <>
              <span className="text-white/40">·</span>
              <Moon className="w-4 h-4" />
              {city.nights || city.suggestedNights} {(city.nights || city.suggestedNights) === 1 ? 'night' : 'nights'}
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Intelligence Status Bar
// =============================================================================

interface IntelligenceStatusBarProps {
  isProcessing: boolean;
  isComplete: boolean;
  progress: number;
  quality: number;
  completedCount: number;
  totalCount: number;
  agentStates: Record<string, any>;
}

function IntelligenceStatusBar({
  isProcessing,
  isComplete,
  progress,
  quality,
  completedCount,
  totalCount,
  agentStates,
}: IntelligenceStatusBarProps) {
  const runningAgents = Object.entries(agentStates)
    .filter(([, state]) => state.status === 'running')
    .map(([name]) => AGENT_LABELS[name as AgentName] || name);

  return (
    <div className={`
      px-5 py-3 border-b
      ${isComplete
        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100'
      }
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className={`w-4 h-4 ${isComplete ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className={`text-sm font-medium ${isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
            {isComplete ? 'Intelligence Ready' : 'Analyzing...'}
          </span>
        </div>

        {isComplete && quality > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">{quality}% quality</span>
          </div>
        )}

        {isProcessing && (
          <span className="text-xs text-amber-600">
            {completedCount}/{totalCount} agents
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/60 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Running agents */}
      {isProcessing && runningAgents.length > 0 && (
        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          {runningAgents.join(', ')}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Story Section
// =============================================================================

function StorySection({ story }: { story: any }) {
  if (!story || !story.hook) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Hook */}
      <p
        className="text-xl font-medium text-stone-900 leading-relaxed"
        style={{ fontFamily: '"Fraunces", serif' }}
      >
        "{story.hook}"
      </p>

      {/* Narrative */}
      {story?.narrative && (
        <p className="text-stone-600 leading-relaxed">
          {story.narrative}
        </p>
      )}

      {/* Differentiators */}
      {story?.differentiators && story.differentiators.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {story.differentiators.map((diff: string, idx: number) => (
            <span
              key={idx}
              className="px-3 py-1 bg-stone-100 text-stone-700 text-sm rounded-full"
            >
              {diff}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Match Score Section
// =============================================================================

function MatchScoreSection({ matchScore }: { matchScore: any }) {
  const score = matchScore?.score || 0;

  // Use explicit class mappings instead of dynamic Tailwind classes
  const colorClasses = score >= 80
    ? {
        container: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200',
        icon: 'text-emerald-600',
        score: 'text-emerald-600',
        check: 'text-emerald-500',
      }
    : score >= 60
    ? {
        container: 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200',
        icon: 'text-amber-600',
        score: 'text-amber-600',
        check: 'text-amber-500',
      }
    : {
        container: 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200',
        icon: 'text-rose-600',
        score: 'text-rose-600',
        check: 'text-rose-500',
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-2xl border ${colorClasses.container}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={`w-5 h-5 ${colorClasses.icon}`} />
          <span className="font-semibold text-stone-900">Match Score</span>
        </div>
        <span className={`text-2xl font-bold ${colorClasses.score}`}>
          {score}%
        </span>
      </div>

      {/* Reasons */}
      {matchScore?.reasons && matchScore.reasons.length > 0 && (
        <div className="space-y-2">
          {matchScore.reasons.slice(0, 3).map((reason: any, idx: number) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <Check className={`w-4 h-4 ${colorClasses.check} flex-shrink-0 mt-0.5`} />
              <span className="text-stone-700">
                <strong>{reason.preference}</strong>: {reason.match}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {matchScore?.warnings && matchScore.warnings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
          {matchScore.warnings.map((warning: any, idx: number) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-amber-700">
                {warning?.preference}: {warning?.gap}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Time Blocks Section
// =============================================================================

function TimeBlocksSection({ timeBlocks, totalHours }: { timeBlocks: any[]; totalHours?: number }) {
  const moodIcons: Record<string, typeof Clock> = {
    explore: MapPin,
    dine: Utensils,
    activity: Star,
    depart: Car,
    arrive: MapPin,
    coffee: Coffee,
    relax: Sun,
  };

  if (!timeBlocks || !Array.isArray(timeBlocks) || timeBlocks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-stone-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Your Time
        </h3>
        {totalHours && (
          <span className="text-sm text-stone-500">{totalHours}h total</span>
        )}
      </div>

      <div className="space-y-2">
        {timeBlocks.map((block, idx) => {
          if (!block) return null;
          const Icon = moodIcons[block.mood] || Clock;
          return (
            <div
              key={block.id || idx}
              className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-stone-900">{block.name || 'Activity'}</p>
                <p className="text-sm text-stone-500">
                  {block.hours || 0}h · {block.suggested || block.mood || 'explore'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Clusters Section
// =============================================================================

function ClustersSection({ clusters }: { clusters: Cluster[] }) {
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  if (!clusters || !Array.isArray(clusters) || clusters.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-emerald-500" />
        Walkable Areas
      </h3>

      <div className="space-y-2">
        {clusters.map((cluster) => {
          if (!cluster) return null;
          const Icon = CLUSTER_ICONS[cluster.theme || 'default'] || MapPin;
          const isExpanded = expandedCluster === cluster.id;

          return (
            <div
              key={cluster.id}
              className="border border-stone-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedCluster(isExpanded ? null : cluster.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-stone-900">{cluster.name}</p>
                  <p className="text-sm text-stone-500">
                    {cluster.walkingMinutes}min walk · {cluster.places?.length || 0} spots
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isExpanded && cluster.places && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-stone-100"
                  >
                    <div className="p-3 space-y-2">
                      {cluster.places.slice(0, 5).map((place, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-stone-700">{place.name}</span>
                          {place.rating && (
                            <span className="text-stone-400">★ {place.rating}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Hidden Gems Section
// =============================================================================

function HiddenGemsSection({ gems }: { gems: HiddenGem[] }) {
  if (!gems || !Array.isArray(gems) || gems.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-3">
        <Gem className="w-5 h-5 text-purple-500" />
        Hidden Gems
      </h3>

      <div className="space-y-3">
        {gems.slice(0, 4).map((gem, idx) => {
          if (!gem) return null;
          return (
            <div
              key={idx}
              className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-stone-900">{gem.name || 'Local Gem'}</h4>
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                  {gem.type || 'experience'}
                </span>
              </div>
              <p className="text-sm text-stone-600 mb-2">{gem.why || 'A local favorite'}</p>
              {gem.insiderTip && (
                <p className="text-xs text-purple-600 italic">
                  💡 {gem.insiderTip}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Photo Spots Section
// =============================================================================

function PhotoSpotsSection({ spots }: { spots: PhotoSpot[] }) {
  if (!spots || !Array.isArray(spots) || spots.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-3">
        <Camera className="w-5 h-5 text-orange-500" />
        Photo Spots
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {spots.slice(0, 4).map((spot, idx) => {
          if (!spot) return null;
          return (
            <div
              key={idx}
              className="p-3 bg-orange-50 rounded-xl border border-orange-100"
            >
              <p className="font-medium text-stone-900 text-sm mb-1">{spot.name || 'Photo Spot'}</p>
              <p className="text-xs text-orange-600">{spot.bestTime || 'Golden hour'}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Logistics Section
// =============================================================================

function LogisticsSection({ logistics }: { logistics: any }) {
  if (!logistics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-3">
        <Car className="w-5 h-5 text-slate-500" />
        Practical Tips
      </h3>

      <div className="space-y-2">
        {logistics?.parking && (
          <div className="flex items-start gap-2 text-sm">
            <Car className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-stone-600">{logistics.parking}</span>
          </div>
        )}

        {logistics?.tips?.map((tip: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-stone-600">{tip}</span>
          </div>
        ))}

        {logistics?.warnings?.map((warning: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-amber-700">{warning}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Weather Section
// =============================================================================

function WeatherSection({ weather }: { weather: any }) {
  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-sky-50 rounded-xl border border-sky-100"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sun className="w-5 h-5 text-sky-500" />
        <span className="font-semibold text-stone-900">Weather</span>
      </div>

      {weather?.forecast && (
        <p className="text-sm text-stone-600 mb-2">{weather.forecast}</p>
      )}

      {weather?.recommendations && (
        <div className="text-xs text-sky-600 space-y-1">
          {weather.recommendations?.goldenHour && (
            <p>🌅 Golden hour: {weather.recommendations.goldenHour}</p>
          )}
          {weather.recommendations?.backup && (
            <p>☔ Backup: {weather.recommendations.backup}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Basic City Info (fallback when no intelligence)
// =============================================================================

function BasicCityInfo({ city }: { city: DiscoveryCity }) {
  return (
    <div className="space-y-4">
      {city.description && (
        <p className="text-stone-600 leading-relaxed">{city.description}</p>
      )}

      <div className="flex items-center gap-4">
        {city.placeCount && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Gem className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">{city.placeCount}</p>
              <p className="text-xs text-stone-500">places</p>
            </div>
          </div>
        )}

        {city.distanceFromRoute !== undefined && city.distanceFromRoute > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">{city.distanceFromRoute}km</p>
              <p className="text-xs text-stone-500">detour</p>
            </div>
          </div>
        )}
      </div>

      {/* Intelligence loading state */}
      <div className="p-4 bg-stone-50 rounded-xl text-center">
        <Loader2 className="w-6 h-6 text-stone-400 mx-auto mb-2 animate-spin" />
        <p className="text-sm text-stone-500">
          Loading city intelligence...
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Action Buttons
// =============================================================================

interface ActionButtonsProps {
  city: DiscoveryCity;
  isInTrip: boolean;
  isFixed: boolean;
  onToggleSelection: () => void;
  hasIntelligence: boolean;
}

function ActionButtons({
  city: _city,
  isInTrip,
  isFixed,
  onToggleSelection,
  hasIntelligence,
}: ActionButtonsProps) {
  void _city; // Available for city-specific actions
  return (
    <div className="flex-shrink-0 p-5 pt-3 border-t border-stone-100 bg-stone-50">
      <div className="flex gap-3">
        {!isFixed && (
          <motion.button
            onClick={onToggleSelection}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex-1 flex items-center justify-center gap-2
              py-4 rounded-2xl font-semibold
              transition-all duration-200
              ${isInTrip
                ? 'bg-stone-200 text-stone-700 hover:bg-rose-100 hover:text-rose-600'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
              }
            `}
          >
            {isInTrip ? (
              <>
                <X className="w-5 h-5" />
                <span>Remove</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Add to Trip</span>
              </>
            )}
          </motion.button>
        )}

        {hasIntelligence && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              ${isFixed ? 'flex-1' : 'w-14'}
              flex items-center justify-center gap-2
              py-4 rounded-2xl
              bg-stone-200 text-stone-700
              font-semibold hover:bg-stone-300
              transition-colors duration-200
            `}
          >
            {isFixed ? (
              <>
                <span>Deep Dive</span>
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Exported Wrapper with Error Boundary
// =============================================================================

export function IntelligenceCityPreview(props: IntelligenceCityPreviewProps) {
  return (
    <IntelligencePreviewErrorBoundary
      fallback={<IntelligencePreviewFallback city={props.city} onClose={props.onClose} />}
    >
      <IntelligenceCityPreviewContent {...props} />
    </IntelligencePreviewErrorBoundary>
  );
}

export default IntelligenceCityPreview;
