/**
 * CityIntelligenceDetailView
 *
 * A full-page immersive view of city intelligence that opens as a modal/drawer.
 * Think luxury travel magazine meets interactive data visualization.
 *
 * Design Philosophy:
 * - Editorial layout with generous whitespace and dramatic typography
 * - Sections reveal progressively as you scroll (intersection observer)
 * - Rich visual hierarchy guiding the eye through intelligence
 * - Magazine-style "spreads" for different content types
 * - Sticky header with navigation between sections
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  X,
  Heart,
  Clock,
  MapPin,
  Gem,
  Car,
  CloudSun,
  Camera,
  ChevronDown,
  Layers,
  Sparkles,
  BookOpen,
  Navigation,
  Star,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

// Import all Phase 2 & 3 components
import { MatchScoreRing } from './MatchScoreRing';
import { TimeBlocksDisplay } from './TimeBlocksDisplay';
import { ClusterVisualization } from './ClusterVisualization';
import { HiddenGemsDisplay } from './HiddenGemsDisplay';
import { LogisticsPanel } from './LogisticsPanel';
import { WeatherDisplay } from './WeatherDisplay';
import { PhotoSpotsDisplay } from './PhotoSpotsDisplay';
import { AgentStatusGroup } from './AgentStatusIndicator';

import { useCityIntelligenceForCity } from '../../hooks/useCityIntelligence';
import type { CityIntelligence, Cluster } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface CityIntelligenceDetailViewProps {
  cityId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Callback when a cluster is selected (for map integration) */
  onClusterSelect?: (cluster: Cluster) => void;
}

type SectionId = 'overview' | 'time' | 'clusters' | 'gems' | 'logistics' | 'weather' | 'photos';

interface Section {
  id: SectionId;
  label: string;
  icon: typeof Heart;
  available: boolean;
}

// =============================================================================
// Main Component
// =============================================================================

export function CityIntelligenceDetailView({
  cityId,
  isOpen,
  onClose,
  onClusterSelect,
}: CityIntelligenceDetailViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    overview: null,
    time: null,
    clusters: null,
    gems: null,
    logistics: null,
    weather: null,
    photos: null,
  });

  // Get intelligence data
  const {
    intelligence,
    agentStates,
    isProcessing,
    isComplete,
    quality,
  } = useCityIntelligenceForCity(cityId);

  // Scroll progress for parallax effects
  const { scrollYProgress } = useScroll({ container: containerRef });
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  // Determine available sections
  const sections: Section[] = [
    { id: 'overview', label: 'Overview', icon: BookOpen, available: true },
    { id: 'time', label: 'Your Time', icon: Clock, available: !!intelligence?.timeBlocks?.blocks?.length },
    { id: 'clusters', label: 'Explore', icon: MapPin, available: !!intelligence?.clusters?.clusters?.length },
    { id: 'gems', label: 'Hidden Gems', icon: Gem, available: !!intelligence?.hiddenGems?.hiddenGems?.length },
    { id: 'logistics', label: 'Know Before', icon: Car, available: !!intelligence?.logistics },
    { id: 'weather', label: 'Weather', icon: CloudSun, available: !!intelligence?.weather },
    { id: 'photos', label: 'Photo Spots', icon: Camera, available: !!intelligence?.photoSpots?.spots?.length },
  ].filter(s => s.available);

  // Intersection observer for section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section') as SectionId;
            if (id) setActiveSection(id);
          }
        });
      },
      { threshold: 0.3, root: containerRef.current }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isOpen, intelligence]);

  // Scroll to section
  const scrollToSection = useCallback((sectionId: SectionId) => {
    const ref = sectionRefs.current[sectionId];
    if (ref && containerRef.current) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!intelligence) return null;

  const displayName = intelligence.city?.name || 'City';
  const displayCountry = intelligence.city?.country || '';
  const story = intelligence.story;
  const matchScore = intelligence.matchScore;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-12 md:inset-8 lg:inset-12 z-50 flex flex-col"
          >
            <div className="relative flex-1 bg-white rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              {/* Sticky Navigation Header */}
              <motion.header
                style={{ opacity: headerOpacity }}
                className="
                  absolute top-0 left-0 right-0 z-20
                  bg-white/95 backdrop-blur-md
                  border-b border-gray-100
                  px-6 py-3
                "
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-lg font-bold text-gray-900">
                      {displayName}
                    </h2>
                    {matchScore && (
                      <span className="flex items-center gap-1 text-sm text-rose-500 font-medium">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        {matchScore.score}%
                      </span>
                    )}
                  </div>

                  {/* Section nav */}
                  <nav className="hidden md:flex items-center gap-1">
                    {sections.slice(0, 6).map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium
                          transition-colors duration-200
                          ${activeSection === section.id
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                          }
                        `}
                      >
                        {section.label}
                      </button>
                    ))}
                  </nav>

                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </motion.header>

              {/* Scrollable Content */}
              <div
                ref={containerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
              >
                {/* Hero Section */}
                <motion.section
                  style={{ scale: heroScale }}
                  className="relative"
                >
                  {/* Hero Image */}
                  <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
                    {intelligence.city?.imageUrl ? (
                      <img
                        src={intelligence.city.imageUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
                    )}

                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

                    {/* Close button (visible before scroll) */}
                    <button
                      onClick={onClose}
                      className="absolute top-4 right-4 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>

                    {/* Quality badge */}
                    {isComplete && quality >= 85 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                        className="absolute top-4 left-4"
                      >
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-semibold">
                          <Sparkles className="w-4 h-4" />
                          Intelligence Complete
                        </div>
                      </motion.div>
                    )}

                    {/* Hero content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-2">
                          {displayCountry}
                        </p>
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                          {displayName}
                        </h1>

                        {story?.hook && (
                          <p className="text-xl text-white/90 italic max-w-xl">
                            "{story.hook}"
                          </p>
                        )}
                      </motion.div>
                    </div>
                  </div>

                  {/* Scroll indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2"
                  >
                    <motion.div
                      animate={{ y: [0, 8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-white/60"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </motion.div>
                  </motion.div>
                </motion.section>

                {/* Content Sections */}
                <div className="px-6 md:px-12 lg:px-16 py-12 space-y-16">
                  {/* Overview Section */}
                  <section
                    ref={(el) => (sectionRefs.current.overview = el)}
                    data-section="overview"
                    className="scroll-mt-20"
                  >
                    <SectionHeader icon={BookOpen} title="Overview" />

                    <div className="grid md:grid-cols-2 gap-8 mt-8">
                      {/* Story */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      >
                        {story && (
                          <div className="space-y-4">
                            <p className="text-lg text-gray-700 leading-relaxed">
                              {story.narrative}
                            </p>

                            {story.differentiators && story.differentiators.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {story.differentiators.map((diff, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium"
                                  >
                                    <Star className="w-3.5 h-3.5 text-amber-500" />
                                    {diff}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Processing state */}
                        {isProcessing && Object.keys(agentStates).length > 0 && (
                          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                            <p className="text-sm font-medium text-amber-800 mb-3">
                              Still gathering intelligence...
                            </p>
                            <AgentStatusGroup
                              agentStates={agentStates}
                              layout="horizontal"
                              showLabels
                            />
                          </div>
                        )}
                      </motion.div>

                      {/* Match Score */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex justify-center"
                      >
                        {matchScore && (
                          <MatchScoreRing
                            score={matchScore.score}
                            reasons={matchScore.reasons}
                            warnings={matchScore.warnings}
                            size="lg"
                          />
                        )}
                      </motion.div>
                    </div>
                  </section>

                  {/* Time Section */}
                  {intelligence.timeBlocks?.blocks?.length > 0 && (
                    <section
                      ref={(el) => (sectionRefs.current.time = el)}
                      data-section="time"
                      className="scroll-mt-20"
                    >
                      <SectionHeader icon={Clock} title="Your Time" />
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-8"
                      >
                        <TimeBlocksDisplay
                          blocks={intelligence.timeBlocks.blocks}
                          totalHours={intelligence.timeBlocks.totalUsableHours}
                        />
                      </motion.div>
                    </section>
                  )}

                  {/* Clusters Section */}
                  {intelligence.clusters?.clusters?.length > 0 && (
                    <section
                      ref={(el) => (sectionRefs.current.clusters = el)}
                      data-section="clusters"
                      className="scroll-mt-20"
                    >
                      <SectionHeader icon={MapPin} title="Activity Zones" />
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-8"
                      >
                        <ClusterVisualization
                          clusters={intelligence.clusters.clusters}
                          onClusterSelect={onClusterSelect}
                        />
                      </motion.div>
                    </section>
                  )}

                  {/* Hidden Gems Section */}
                  {intelligence.hiddenGems?.hiddenGems?.length > 0 && (
                    <section
                      ref={(el) => (sectionRefs.current.gems = el)}
                      data-section="gems"
                      className="scroll-mt-20"
                    >
                      <SectionHeader icon={Gem} title="Hidden Gems" />
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-8"
                      >
                        <HiddenGemsDisplay gems={intelligence.hiddenGems.hiddenGems} />
                      </motion.div>
                    </section>
                  )}

                  {/* Two-column: Logistics & Weather */}
                  {(intelligence.logistics || intelligence.weather) && (
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Logistics */}
                      {intelligence.logistics && (
                        <section
                          ref={(el) => (sectionRefs.current.logistics = el)}
                          data-section="logistics"
                          className="scroll-mt-20"
                        >
                          <SectionHeader icon={Car} title="Know Before You Go" small />
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-6"
                          >
                            <LogisticsPanel logistics={intelligence.logistics} />
                          </motion.div>
                        </section>
                      )}

                      {/* Weather */}
                      {intelligence.weather && (
                        <section
                          ref={(el) => (sectionRefs.current.weather = el)}
                          data-section="weather"
                          className="scroll-mt-20"
                        >
                          <SectionHeader icon={CloudSun} title="Weather" small />
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-6"
                          >
                            <WeatherDisplay weather={intelligence.weather} />
                          </motion.div>
                        </section>
                      )}
                    </div>
                  )}

                  {/* Photo Spots Section */}
                  {intelligence.photoSpots?.spots?.length > 0 && (
                    <section
                      ref={(el) => (sectionRefs.current.photos = el)}
                      data-section="photos"
                      className="scroll-mt-20"
                    >
                      <SectionHeader icon={Camera} title="Photo Spots" />
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-8"
                      >
                        <PhotoSpotsDisplay spots={intelligence.photoSpots.spots} />
                      </motion.div>
                    </section>
                  )}

                  {/* Footer CTA */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center py-12 border-t border-gray-100"
                  >
                    <p className="text-gray-500 text-sm mb-4">
                      Intelligence quality: {quality}%
                    </p>
                    <button
                      onClick={onClose}
                      className="
                        inline-flex items-center gap-2
                        px-6 py-3 rounded-full
                        bg-gray-900 text-white font-medium
                        hover:bg-gray-800 transition-colors
                      "
                    >
                      Back to Discovery
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Section Header
// =============================================================================

interface SectionHeaderProps {
  icon: typeof Heart;
  title: string;
  small?: boolean;
}

function SectionHeader({ icon: Icon, title, small = false }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`
          ${small ? 'w-10 h-10' : 'w-12 h-12'}
          rounded-xl bg-gray-100
          flex items-center justify-center
        `}
      >
        <Icon className={`${small ? 'w-5 h-5' : 'w-6 h-6'} text-gray-600`} />
      </div>
      <h2
        className={`
          font-display font-bold text-gray-900
          ${small ? 'text-xl' : 'text-2xl'}
        `}
      >
        {title}
      </h2>
    </div>
  );
}

export default CityIntelligenceDetailView;
