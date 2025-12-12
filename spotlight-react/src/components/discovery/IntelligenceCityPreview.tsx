/**
 * IntelligenceCityPreview
 *
 * A luxurious, editorial-style city preview modal that feels like opening
 * a page from Condé Nast Traveler. Warm earth tones, elegant typography,
 * and immersive imagery that makes you want to pack your bags.
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
  Star,
  Coffee,
  Utensils,
  ShoppingBag,
  TreePine,
  AlertTriangle,
  Compass,
  Route,
} from 'lucide-react';
import type { DiscoveryCity } from '../../stores/discoveryStore';
import { useDiscoveryStore } from '../../stores/discoveryStore';
import { useCityIntelligenceForCity } from '../../hooks/useCityIntelligence';
import { fetchCityImage } from '../../services/cityImages';
import type { AgentName, Cluster, HiddenGem, PhotoSpot } from '../../types/cityIntelligence';

// =============================================================================
// Error Boundary
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
// Types & Constants
// =============================================================================

interface IntelligenceCityPreviewProps {
  city: DiscoveryCity | null;
  onClose: () => void;
  onToggleSelection: () => void;
}

const AGENT_LABELS: Record<AgentName, string> = {
  TimeAgent: 'Time',
  StoryAgent: 'Story',
  PreferenceAgent: 'Match',
  ClusterAgent: 'Areas',
  GemsAgent: 'Gems',
  LogisticsAgent: 'Tips',
  WeatherAgent: 'Weather',
  PhotoAgent: 'Photos',
  SynthesisAgent: 'Complete',
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
// Fallback Component
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[#2C2417]/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFBF5] rounded-t-[2rem] shadow-2xl max-h-[70vh] overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-[#2C2417]" style={{ fontFamily: 'Fraunces, serif' }}>
              {city.name}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F5F0E8] transition-colors">
              <X className="w-5 h-5 text-[#8B7355]" />
            </button>
          </div>
          <p className="text-[#8B7355]">{city.description || `Discover ${city.name}, ${city.country}`}</p>
        </div>
      </motion.div>
    </>
  );
}

// =============================================================================
// Main Component
// =============================================================================

function IntelligenceCityPreviewContent({
  city,
  onClose,
  onToggleSelection,
}: IntelligenceCityPreviewProps) {
  const [cityImage, setCityImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

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

  const { isPlaceFavourited: _isPlaceFavourited, togglePlaceFavourite: _togglePlaceFavourite } = useDiscoveryStore();
  void _isPlaceFavourited; void _togglePlaceFavourite;

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
      {/* Backdrop with warm overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(44, 36, 23, 0.7)', backdropFilter: 'blur(8px)' }}
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
          md:max-w-lg md:w-full md:mx-4
          z-50
          max-h-[94vh] md:max-h-[90vh]
        "
      >
        <div
          className="
            rounded-t-[2rem] md:rounded-[2rem]
            overflow-hidden flex flex-col
            max-h-[94vh] md:max-h-[90vh]
          "
          style={{
            backgroundColor: '#FFFBF5',
            boxShadow: '0 -10px 60px rgba(44, 36, 23, 0.3), 0 25px 80px rgba(44, 36, 23, 0.4)',
          }}
        >
          {/* Hero Header */}
          <HeroHeader
            city={city}
            cityImage={cityImage}
            imageLoading={imageLoading}
            isFixed={isFixed}
            onClose={onClose}
          />

          {/* Intelligence Status */}
          {hasIntelligence && (
            <IntelligenceStatus
              isProcessing={isProcessing}
              isComplete={isComplete}
              progress={progress}
              quality={quality}
              completedCount={completedAgentsCount}
              totalCount={totalAgentsCount}
              agentStates={agentStates}
            />
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="px-6 py-5 space-y-6">
              {/* Story Hook */}
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

              {/* Clusters */}
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

              {/* Loading State */}
              {!hasIntelligence && (
                <LoadingState city={city} />
              )}
            </div>
          </div>

          {/* Action Footer */}
          <ActionFooter
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
// Hero Header - Immersive city image with editorial overlay
// =============================================================================

interface HeroHeaderProps {
  city: DiscoveryCity;
  cityImage: string | null;
  imageLoading: boolean;
  isFixed: boolean;
  onClose: () => void;
}

function HeroHeader({ city, cityImage, imageLoading, isFixed, onClose }: HeroHeaderProps) {
  const nights = city.nights || city.suggestedNights;

  return (
    <div className="relative h-56 md:h-64 flex-shrink-0 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #2C2417 0%, #4A3F2F 50%, #5C4D3A 100%)',
        }}
      />

      {/* Loading shimmer */}
      {imageLoading && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,251,245,0.08) 50%, transparent 100%)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* City image with Ken Burns effect */}
      {(cityImage || city.imageUrl) && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <img
            src={cityImage || city.imageUrl}
            alt={city.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#2C2417] via-[#2C2417]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#2C2417]/40 to-transparent" />

      {/* Grain texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-4 left-4"
      >
        <div
          className="px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide backdrop-blur-md"
          style={{
            backgroundColor: isFixed ? 'rgba(196, 88, 48, 0.9)' : 'rgba(255, 251, 245, 0.95)',
            color: isFixed ? '#FFFBF5' : '#2C2417',
            fontFamily: 'Satoshi, sans-serif',
          }}
        >
          {isFixed
            ? city.id === 'origin' ? '◆ Starting Point' : '◆ Destination'
            : '✦ Suggested Stop'}
        </div>
      </motion.div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="
          absolute top-4 right-4 w-10 h-10 rounded-full
          flex items-center justify-center
          transition-all duration-200
          hover:scale-105 active:scale-95
        "
        style={{
          backgroundColor: 'rgba(44, 36, 23, 0.4)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <X className="w-5 h-5 text-[#FFFBF5]" />
      </button>

      {/* City name - Editorial typography */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h2
            className="text-4xl md:text-5xl font-semibold text-[#FFFBF5] mb-2 tracking-tight"
            style={{ fontFamily: 'Fraunces, serif', lineHeight: 1.1 }}
          >
            {city.name}
          </h2>
          <div className="flex items-center gap-3 text-[#FFFBF5]/80 text-sm">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {city.country}
            </span>
            {nights && (
              <>
                <span className="text-[#FFFBF5]/40">•</span>
                <span className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5" />
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </span>
              </>
            )}
            {city.distanceFromRoute !== undefined && city.distanceFromRoute > 0 && (
              <>
                <span className="text-[#FFFBF5]/40">•</span>
                <span className="flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5" />
                  {city.distanceFromRoute}km detour
                </span>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// Intelligence Status - Elegant progress indicator
// =============================================================================

interface IntelligenceStatusProps {
  isProcessing: boolean;
  isComplete: boolean;
  progress: number;
  quality: number;
  completedCount: number;
  totalCount: number;
  agentStates: Record<string, any>;
}

function IntelligenceStatus({
  isProcessing,
  isComplete,
  progress,
  quality,
  completedCount,
  totalCount,
  agentStates,
}: IntelligenceStatusProps) {
  const runningAgents = Object.entries(agentStates)
    .filter(([, state]) => state.status === 'running')
    .map(([name]) => AGENT_LABELS[name as AgentName] || name);

  return (
    <div
      className="px-6 py-4"
      style={{
        backgroundColor: isComplete ? 'rgba(74, 124, 89, 0.08)' : 'rgba(196, 88, 48, 0.06)',
        borderBottom: `1px solid ${isComplete ? 'rgba(74, 124, 89, 0.15)' : 'rgba(196, 88, 48, 0.12)'}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {isComplete ? (
            <div className="w-6 h-6 rounded-full bg-[#4A7C59]/15 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#4A7C59]" />
            </div>
          ) : (
            <motion.div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(196, 88, 48, 0.15)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Compass className="w-3.5 h-3.5 text-[#C45830]" />
            </motion.div>
          )}
          <span
            className="text-sm font-medium"
            style={{
              color: isComplete ? '#4A7C59' : '#C45830',
              fontFamily: 'Satoshi, sans-serif',
            }}
          >
            {isComplete ? 'Intelligence Ready' : 'Discovering insights...'}
          </span>
        </div>

        {isComplete && quality > 0 && (
          <div
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: 'rgba(74, 124, 89, 0.12)',
              color: '#4A7C59',
              fontFamily: 'Satoshi, sans-serif',
            }}
          >
            {quality}% quality
          </div>
        )}

        {isProcessing && (
          <span
            className="text-xs"
            style={{ color: '#C45830', fontFamily: 'Satoshi, sans-serif' }}
          >
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="relative h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: isComplete ? 'rgba(74, 124, 89, 0.15)' : 'rgba(196, 88, 48, 0.15)' }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: isComplete
              ? 'linear-gradient(90deg, #4A7C59, #5A9A6A)'
              : 'linear-gradient(90deg, #C45830, #D4A853)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Running agents */}
      {isProcessing && runningAgents.length > 0 && (
        <p
          className="text-xs mt-2 flex items-center gap-1.5"
          style={{ color: '#C45830', fontFamily: 'Satoshi, sans-serif' }}
        >
          <span className="opacity-60">Analyzing:</span>
          {runningAgents.join(', ')}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Story Section - Editorial quote style
// =============================================================================

function StorySection({ story }: { story: any }) {
  if (!story?.hook) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Large quote */}
      <div className="relative">
        <div
          className="absolute -left-2 -top-2 text-6xl leading-none opacity-10"
          style={{ color: '#C45830', fontFamily: 'Fraunces, serif' }}
        >
          "
        </div>
        <p
          className="text-xl leading-relaxed pl-4"
          style={{
            color: '#2C2417',
            fontFamily: 'Fraunces, serif',
            fontWeight: 500,
          }}
        >
          {story.hook}
        </p>
      </div>

      {/* Narrative */}
      {story.narrative && (
        <p
          className="text-sm leading-relaxed"
          style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}
        >
          {story.narrative}
        </p>
      )}

      {/* Differentiators */}
      {story.differentiators?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {story.differentiators.map((diff: string, idx: number) => (
            <span
              key={idx}
              className="px-3 py-1.5 text-xs font-medium rounded-full"
              style={{
                backgroundColor: '#F5F0E8',
                color: '#8B7355',
                fontFamily: 'Satoshi, sans-serif',
              }}
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

  const colors = score >= 80
    ? { bg: 'rgba(74, 124, 89, 0.08)', border: 'rgba(74, 124, 89, 0.2)', text: '#4A7C59' }
    : score >= 60
    ? { bg: 'rgba(212, 168, 83, 0.1)', border: 'rgba(212, 168, 83, 0.2)', text: '#B8943D' }
    : { bg: 'rgba(181, 74, 74, 0.08)', border: 'rgba(181, 74, 74, 0.2)', text: '#B54A4A' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl"
      style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5" style={{ color: colors.text }} />
          <span className="font-semibold" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>
            Match Score
          </span>
        </div>
        <span
          className="text-3xl font-bold"
          style={{ color: colors.text, fontFamily: 'Fraunces, serif' }}
        >
          {score}%
        </span>
      </div>

      {matchScore?.reasons?.length > 0 && (
        <div className="space-y-2.5">
          {matchScore.reasons.slice(0, 3).map((reason: any, idx: number) => (
            <div key={idx} className="flex items-start gap-2.5 text-sm">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.text }} />
              <span style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>
                <strong>{reason.preference}</strong>: {reason.match}
              </span>
            </div>
          ))}
        </div>
      )}

      {matchScore?.warnings?.length > 0 && (
        <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(212, 168, 83, 0.2)' }}>
          {matchScore.warnings.map((warning: any, idx: number) => (
            <div key={idx} className="flex items-start gap-2.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-[#D4A853] flex-shrink-0 mt-0.5" />
              <span style={{ color: '#B8943D', fontFamily: 'Satoshi, sans-serif' }}>
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

  if (!timeBlocks?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2.5 font-semibold" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>
          <Clock className="w-5 h-5 text-[#4A90A4]" />
          Your Time
        </h3>
        {totalHours && (
          <span className="text-sm" style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>
            {totalHours}h available
          </span>
        )}
      </div>

      <div className="space-y-2">
        {timeBlocks.map((block, idx) => {
          if (!block) return null;
          const Icon = moodIcons[block.mood] || Clock;
          return (
            <div
              key={block.id || idx}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: 'rgba(74, 144, 164, 0.08)', border: '1px solid rgba(74, 144, 164, 0.12)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(74, 144, 164, 0.15)' }}>
                <Icon className="w-5 h-5 text-[#4A90A4]" />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>{block.name || 'Activity'}</p>
                <p className="text-sm" style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>
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
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!clusters?.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="flex items-center gap-2.5 font-semibold mb-4" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>
        <MapPin className="w-5 h-5 text-[#4A7C59]" />
        Walkable Areas
      </h3>

      <div className="space-y-2">
        {clusters.map((cluster) => {
          if (!cluster) return null;
          const Icon = CLUSTER_ICONS[cluster.theme || 'default'] || MapPin;
          const isExpanded = expanded === cluster.id;

          return (
            <div
              key={cluster.id}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid #E5DDD0' }}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : cluster.id)}
                className="w-full flex items-center gap-3 p-3 transition-colors hover:bg-[#FAF7F2]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(74, 124, 89, 0.1)' }}>
                  <Icon className="w-5 h-5 text-[#4A7C59]" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>{cluster.name}</p>
                  <p className="text-sm" style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>
                    {cluster.walkingMinutes}min walk · {cluster.places?.length || 0} spots
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-[#C4B8A5] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isExpanded && cluster.places && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ borderTop: '1px solid #E5DDD0' }}
                  >
                    <div className="p-3 space-y-2">
                      {cluster.places.slice(0, 5).map((place, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />
                          <span style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>{place.name}</span>
                          {place.rating && (
                            <span style={{ color: '#C4B8A5', fontFamily: 'Satoshi, sans-serif' }}>★ {place.rating}</span>
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
  if (!gems?.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="flex items-center gap-2.5 font-semibold mb-4" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>
        <Gem className="w-5 h-5 text-[#C45830]" />
        Hidden Gems
      </h3>

      <div className="space-y-3">
        {gems.slice(0, 4).map((gem, idx) => {
          if (!gem) return null;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.06) 0%, rgba(212, 168, 83, 0.04) 100%)',
                border: '1px solid rgba(196, 88, 48, 0.12)',
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>{gem.name || 'Local Gem'}</h4>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(196, 88, 48, 0.1)', color: '#C45830', fontFamily: 'Satoshi, sans-serif' }}
                >
                  {gem.type || 'experience'}
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>{gem.why || 'A local favorite'}</p>
              {gem.insiderTip && (
                <p className="text-xs italic" style={{ color: '#C45830', fontFamily: 'Satoshi, sans-serif' }}>
                  ✧ {gem.insiderTip}
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
  if (!spots?.length) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="flex items-center gap-2.5 font-semibold mb-4" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>
        <Camera className="w-5 h-5 text-[#D4A853]" />
        Photo Spots
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {spots.slice(0, 4).map((spot, idx) => {
          if (!spot) return null;
          return (
            <div
              key={idx}
              className="p-3 rounded-xl"
              style={{ backgroundColor: 'rgba(212, 168, 83, 0.08)', border: '1px solid rgba(212, 168, 83, 0.15)' }}
            >
              <p className="font-medium text-sm mb-1" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>{spot.name || 'Photo Spot'}</p>
              <p className="text-xs" style={{ color: '#D4A853', fontFamily: 'Satoshi, sans-serif' }}>{spot.bestTime || 'Golden hour'}</p>
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
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <h3 className="flex items-center gap-2.5 font-semibold mb-4" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>
        <Car className="w-5 h-5 text-[#8B7355]" />
        Practical Tips
      </h3>

      <div className="space-y-2.5">
        {logistics.parking && (
          <div className="flex items-start gap-2.5 text-sm">
            <Car className="w-4 h-4 text-[#C4B8A5] flex-shrink-0 mt-0.5" />
            <span style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>{logistics.parking}</span>
          </div>
        )}
        {logistics.tips?.map((tip: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2.5 text-sm">
            <Check className="w-4 h-4 text-[#4A7C59] flex-shrink-0 mt-0.5" />
            <span style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>{tip}</span>
          </div>
        ))}
        {logistics.warnings?.map((warning: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-[#D4A853] flex-shrink-0 mt-0.5" />
            <span style={{ color: '#B8943D', fontFamily: 'Satoshi, sans-serif' }}>{warning}</span>
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl"
      style={{ backgroundColor: 'rgba(74, 144, 164, 0.08)', border: '1px solid rgba(74, 144, 164, 0.15)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sun className="w-5 h-5 text-[#4A90A4]" />
        <span className="font-semibold" style={{ color: '#2C2417', fontFamily: 'Satoshi, sans-serif' }}>Weather</span>
      </div>
      {weather.forecast && (
        <p className="text-sm mb-2" style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>{weather.forecast}</p>
      )}
      {weather.recommendations && (
        <div className="text-xs space-y-1" style={{ color: '#4A90A4', fontFamily: 'Satoshi, sans-serif' }}>
          {weather.recommendations.goldenHour && <p>☀ Golden hour: {weather.recommendations.goldenHour}</p>}
          {weather.recommendations.backup && <p>☂ Backup: {weather.recommendations.backup}</p>}
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Loading State - Beautiful waiting experience
// =============================================================================

function LoadingState({ city }: { city: DiscoveryCity }) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {city.description && (
        <p className="text-base leading-relaxed" style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>
          {city.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-6">
        {city.placeCount && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(196, 88, 48, 0.1)' }}>
              <Gem className="w-5 h-5 text-[#C45830]" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#2C2417', fontFamily: 'Fraunces, serif' }}>{city.placeCount}</p>
              <p className="text-xs" style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>places</p>
            </div>
          </div>
        )}
        {city.distanceFromRoute !== undefined && city.distanceFromRoute > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(74, 144, 164, 0.1)' }}>
              <Route className="w-5 h-5 text-[#4A90A4]" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#2C2417', fontFamily: 'Fraunces, serif' }}>{city.distanceFromRoute}km</p>
              <p className="text-xs" style={{ color: '#8B7355', fontFamily: 'Satoshi, sans-serif' }}>detour</p>
            </div>
          </div>
        )}
      </div>

      {/* Elegant loading */}
      <div className="py-8 text-center">
        <motion.div
          className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(196, 88, 48, 0.08)' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Compass className="w-6 h-6 text-[#C45830]" />
          </motion.div>
        </motion.div>
        <p
          className="text-sm"
          style={{ color: '#C45830', fontFamily: 'Satoshi, sans-serif' }}
        >
          Discovering {city.name}...
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: '#C4B8A5', fontFamily: 'Satoshi, sans-serif' }}
        >
          Finding hidden gems and local insights
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Action Footer - Warm, inviting CTAs
// =============================================================================

interface ActionFooterProps {
  city: DiscoveryCity;
  isInTrip: boolean;
  isFixed: boolean;
  onToggleSelection: () => void;
  hasIntelligence: boolean;
}

function ActionFooter({ isInTrip, isFixed, onToggleSelection, hasIntelligence }: ActionFooterProps) {
  return (
    <div
      className="flex-shrink-0 px-6 py-5"
      style={{
        backgroundColor: '#FAF7F2',
        borderTop: '1px solid #E5DDD0',
      }}
    >
      <div className="flex gap-3">
        {!isFixed && (
          <motion.button
            onClick={onToggleSelection}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold transition-all duration-200"
            style={{
              fontFamily: 'Satoshi, sans-serif',
              ...(isInTrip
                ? {
                    backgroundColor: '#F5F0E8',
                    color: '#8B7355',
                    border: '1px solid #E5DDD0',
                  }
                : {
                    background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                    color: '#FFFBF5',
                    boxShadow: '0 8px 24px rgba(196, 88, 48, 0.3)',
                  }),
            }}
          >
            {isInTrip ? (
              <>
                <X className="w-5 h-5" />
                <span>Remove from Trip</span>
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
              py-4 rounded-2xl font-semibold
              transition-all duration-200
            `}
            style={{
              backgroundColor: '#F5F0E8',
              color: '#2C2417',
              border: '1px solid #E5DDD0',
              fontFamily: 'Satoshi, sans-serif',
            }}
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
// Exported Component with Error Boundary
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
