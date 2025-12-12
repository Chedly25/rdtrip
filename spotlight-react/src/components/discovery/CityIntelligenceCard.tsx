/**
 * CityIntelligenceCard
 *
 * A living card that progressively reveals city intelligence as AI agents work.
 * Designed to create anticipation and delight as rich information materializes.
 *
 * Design philosophy:
 * - Cards "come alive" as intelligence arrives (not just loading spinners)
 * - Progressive disclosure - show what's ready, indicate what's coming
 * - Rich visual hierarchy that guides attention
 * - Warm, editorial aesthetic matching Waycraft's travel guide feel
 *
 * Visual language:
 * - Soft shadows and rounded corners (travel-magazine warmth)
 * - Golden accents for quality/preference scores
 * - Emerald for nature/exploration themes
 * - Violet/indigo for cultural themes
 * - Amber for hidden gems (treasure feeling)
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MapPin,
  Gem,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Camera,
  Truck,
  CloudSun,
  Heart,
  Check,
  Route,
  ExternalLink,
} from 'lucide-react';
import { AgentStatusGroup, AgentProgressBar } from './AgentStatusIndicator';
import { CityIntelligenceDetailView } from './CityIntelligenceDetailView';
import { useCityIntelligenceForCity } from '../../hooks/useCityIntelligence';
import type { TimeBlock, Cluster, HiddenGem } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface CityIntelligenceCardProps {
  cityId: string;
  /** City name for display while loading */
  cityName?: string;
  /** City photo URL for background */
  imageUrl?: string;
  /** Number of nights */
  nights?: number;
  /** Animation delay for staggered entrance */
  delay?: number;
  /** Callback when card is selected */
  onSelect?: () => void;
  /** Whether this card is currently selected */
  isSelected?: boolean;
}

// =============================================================================
// Main Component
// =============================================================================

export function CityIntelligenceCard({
  cityId,
  cityName,
  imageUrl,
  nights = 1,
  delay = 0,
  onSelect,
  isSelected = false,
}: CityIntelligenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  // Get intelligence data
  const {
    intelligence,
    agentStates,
    progress,
    isProcessing,
    isComplete,
    quality,
  } = useCityIntelligenceForCity(cityId);

  // Derive display values
  const displayName = intelligence?.city?.name || cityName || 'Loading...';
  const displayImage = intelligence?.city?.imageUrl || imageUrl;
  const story = intelligence?.story;
  const matchScore = intelligence?.matchScore;
  const timeBlocks = intelligence?.timeBlocks;
  const clusters = intelligence?.clusters;
  const hiddenGems = intelligence?.hiddenGems;
  const logistics = intelligence?.logistics;
  const weather = intelligence?.weather;
  const photoSpots = intelligence?.photoSpots;

  // Calculate how much content is available
  const contentSections = useMemo(() => {
    const sections = [];
    if (story) sections.push('story');
    if (matchScore) sections.push('match');
    if (timeBlocks?.blocks?.length) sections.push('time');
    if (clusters?.clusters?.length) sections.push('clusters');
    if (hiddenGems?.hiddenGems?.length) sections.push('gems');
    if (logistics) sections.push('logistics');
    if (weather) sections.push('weather');
    if (photoSpots?.spots?.length) sections.push('photos');
    return sections;
  }, [story, matchScore, timeBlocks, clusters, hiddenGems, logistics, weather, photoSpots]);

  const hasContent = contentSections.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative"
    >
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={onSelect}
        className={`
          relative overflow-hidden
          rounded-2xl
          border-2 transition-colors duration-200
          ${isSelected
            ? 'border-rui-accent shadow-lg shadow-rui-accent/10'
            : 'border-transparent shadow-lg shadow-black/5'
          }
          bg-white
          cursor-pointer
        `}
      >
        {/* Header with image and basic info */}
        <div className="relative">
          {/* Background image */}
          <div className="relative h-36 overflow-hidden">
            {displayImage ? (
              <img
                src={displayImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200" />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Processing indicator overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          Gathering intelligence
                        </p>
                        <p className="text-xs text-gray-500">{progress}% complete</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* City name and nights */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-display text-xl font-bold text-white drop-shadow-md">
                {displayName}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-white/90 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </span>
                {matchScore && (
                  <span className="flex items-center gap-1 text-amber-300 text-sm font-medium">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    {matchScore.score}% match
                  </span>
                )}
              </div>
            </div>

            {/* Quality badge */}
            {isComplete && quality >= 85 && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, delay: 0.3 }}
                className="absolute top-3 right-3"
              >
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-lg">
                  <Check className="w-3 h-3" />
                  Ready
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="p-4">
          {/* Story hook */}
          <AnimatePresence>
            {story && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <p className="text-rui-accent font-medium italic text-sm">
                  "{story.hook}"
                </p>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {story.narrative}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent status while processing */}
          <AnimatePresence>
            {isProcessing && Object.keys(agentStates).length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4"
              >
                <AgentProgressBar agentStates={agentStates} showPercent />
                <div className="mt-3">
                  <AgentStatusGroup
                    agentStates={agentStates}
                    layout="horizontal"
                    showLabels={false}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick stats row */}
          {hasContent && (
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              {timeBlocks?.blocks && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {timeBlocks.blocks.length} time blocks
                </span>
              )}
              {clusters?.clusters && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {clusters.clusters.length} clusters
                </span>
              )}
              {hiddenGems?.hiddenGems && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Gem className="w-3.5 h-3.5" />
                  {hiddenGems.hiddenGems.length} gems
                </span>
              )}
            </div>
          )}

          {/* Expandable sections */}
          <AnimatePresence>
            {isExpanded && hasContent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pt-3 border-t border-gray-100"
              >
                {/* Match reasons */}
                {matchScore?.reasons && matchScore.reasons.length > 0 && (
                  <IntelligenceSection
                    icon={Heart}
                    title="Why it's a match"
                    iconColor="text-rose-500"
                  >
                    <div className="space-y-2">
                      {matchScore.reasons.slice(0, 3).map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="text-gray-700 text-sm">
                              {reason.match}
                            </span>
                            <span className="text-gray-400 text-xs ml-1">
                              ({reason.score}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </IntelligenceSection>
                )}

                {/* Time blocks */}
                {timeBlocks?.blocks && timeBlocks.blocks.length > 0 && (
                  <IntelligenceSection
                    icon={Clock}
                    title="Your time"
                    iconColor="text-sky-500"
                  >
                    <div className="flex flex-wrap gap-2">
                      {timeBlocks.blocks.slice(0, 4).map((block) => (
                        <TimeBlockBadge key={block.id} block={block} />
                      ))}
                    </div>
                  </IntelligenceSection>
                )}

                {/* Activity clusters */}
                {clusters?.clusters && clusters.clusters.length > 0 && (
                  <IntelligenceSection
                    icon={Route}
                    title="Activity clusters"
                    iconColor="text-emerald-500"
                  >
                    <div className="space-y-2">
                      {clusters.clusters.slice(0, 3).map((cluster) => (
                        <ClusterPreview key={cluster.id} cluster={cluster} />
                      ))}
                    </div>
                  </IntelligenceSection>
                )}

                {/* Hidden gems */}
                {hiddenGems?.hiddenGems && hiddenGems.hiddenGems.length > 0 && (
                  <IntelligenceSection
                    icon={Gem}
                    title="Hidden gems"
                    iconColor="text-amber-500"
                  >
                    <div className="space-y-2">
                      {hiddenGems.hiddenGems.slice(0, 3).map((gem, idx) => (
                        <HiddenGemCard key={idx} gem={gem} />
                      ))}
                    </div>
                  </IntelligenceSection>
                )}

                {/* Logistics tips */}
                {logistics?.tips && logistics.tips.length > 0 && (
                  <IntelligenceSection
                    icon={Truck}
                    title="Logistics"
                    iconColor="text-slate-500"
                  >
                    <ul className="space-y-1">
                      {logistics.tips.slice(0, 3).map((tip, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-slate-400">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </IntelligenceSection>
                )}

                {/* Weather */}
                {weather && (
                  <IntelligenceSection
                    icon={CloudSun}
                    title="Weather"
                    iconColor="text-cyan-500"
                  >
                    <p className="text-sm text-gray-600">{weather.forecast}</p>
                    {weather.recommendations?.goldenHour && (
                      <p className="text-xs text-amber-600 mt-1">
                        🌅 Golden hour: {weather.recommendations.goldenHour}
                      </p>
                    )}
                  </IntelligenceSection>
                )}

                {/* Photo spots */}
                {photoSpots?.spots && photoSpots.spots.length > 0 && (
                  <IntelligenceSection
                    icon={Camera}
                    title="Photo spots"
                    iconColor="text-pink-500"
                  >
                    <div className="space-y-2">
                      {photoSpots.spots.slice(0, 2).map((spot, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Camera className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700 font-medium">{spot.name}</p>
                            <p className="text-xs text-gray-500">{spot.tip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </IntelligenceSection>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand/collapse button */}
          {hasContent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="
                w-full mt-3 pt-3 border-t border-gray-100
                flex items-center justify-center gap-1
                text-sm text-gray-500 hover:text-gray-700
                transition-colors
              "
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show intelligence ({contentSections.length} sections)
                </>
              )}
            </button>
          )}

          {/* Full details button - shows when intelligence is complete */}
          {isComplete && hasContent && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailViewOpen(true);
              }}
              className="
                w-full mt-3 py-2.5 rounded-xl
                flex items-center justify-center gap-2
                text-sm font-medium
                bg-gradient-to-r from-violet-500 to-purple-600
                text-white
                hover:from-violet-600 hover:to-purple-700
                shadow-md shadow-violet-500/20
                transition-all duration-200
              "
            >
              <ExternalLink className="w-4 h-4" />
              View Full Intelligence
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Full-page detail view modal */}
      <CityIntelligenceDetailView
        cityId={cityId}
        isOpen={isDetailViewOpen}
        onClose={() => setIsDetailViewOpen(false)}
      />
    </motion.div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface IntelligenceSectionProps {
  icon: typeof Clock;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}

function IntelligenceSection({
  icon: Icon,
  title,
  iconColor,
  children,
}: IntelligenceSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function TimeBlockBadge({ block }: { block: TimeBlock }) {
  const moodColors: Record<string, string> = {
    explore: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dine: 'bg-rose-50 text-rose-700 border-rose-200',
    activity: 'bg-sky-50 text-sky-700 border-sky-200',
    depart: 'bg-slate-50 text-slate-700 border-slate-200',
    arrive: 'bg-violet-50 text-violet-700 border-violet-200',
    coffee: 'bg-amber-50 text-amber-700 border-amber-200',
    relax: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-1 rounded-lg
        text-xs font-medium
        border
        ${moodColors[block.mood] || 'bg-gray-50 text-gray-700 border-gray-200'}
      `}
    >
      {block.name}
      <span className="text-gray-400">({block.hours}h)</span>
    </span>
  );
}

function ClusterPreview({ cluster }: { cluster: Cluster }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
      <div>
        <p className="text-sm font-medium text-gray-700">{cluster.name}</p>
        <p className="text-xs text-gray-500">
          {cluster.places.length} places • {cluster.walkingMinutes} min walk
        </p>
      </div>
      <span className="text-xs text-emerald-600 font-medium">
        {cluster.bestFor}
      </span>
    </div>
  );
}

function HiddenGemCard({ gem }: { gem: HiddenGem }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
      <Gem className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-gray-700">{gem.name}</p>
        <p className="text-xs text-gray-600 mt-0.5">{gem.why}</p>
        {gem.insiderTip && (
          <p className="text-xs text-amber-600 mt-1 italic">💡 {gem.insiderTip}</p>
        )}
      </div>
    </div>
  );
}

export default CityIntelligenceCard;
