/**
 * Trip Recap - Full Page Journey Summary
 *
 * A beautiful, cinematic recap of the completed trip with
 * statistics, photo highlights, route map, and AI-generated story.
 *
 * Design: "Traveler's Chronicle" - magazine editorial layout,
 * hero photography, elegant typography, and layered storytelling
 *
 * Features:
 * - Hero section with cover photo
 * - Animated statistics reveal
 * - Route visualization with visited pins
 * - Day-by-day highlight reel
 * - AI-generated trip narrative
 * - Photo mosaic gallery
 * - Favorite moment spotlight
 */

import { motion, useScroll, useTransform } from 'framer-motion';
import {
  MapPin,
  Calendar,
  Camera,
  Car,
  Star,
  Heart,
  Quote,
  Sparkles,
  Map,
} from 'lucide-react';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
};

// Types
export interface TripRecapData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  cities: Array<{
    name: string;
    country?: string;
    nights: number;
    highlights?: string[];
  }>;
  stats: {
    totalDays: number;
    totalDistance: number;
    photosCount: number;
    checkinsCount: number;
    highlightsCount: number;
  };
  photos: Array<{
    url: string;
    city: string;
    caption?: string;
    isHighlight?: boolean;
  }>;
  highlights: Array<{
    id: string;
    title: string;
    city: string;
    photo?: string;
    note?: string;
  }>;
  favoriteMemory?: {
    title: string;
    description: string;
    photo?: string;
    city: string;
  };
  aiStory?: string;
}

// Hero Section with parallax
const HeroSection = ({
  coverPhoto,
  tripName,
  dates,
  cities,
}: {
  coverPhoto?: string;
  tripName: string;
  dates: string;
  cities: string[];
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 100]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);

  return (
    <motion.div
      className="relative h-[70vh] min-h-[500px] overflow-hidden"
      style={{ y }}
    >
      {/* Background image */}
      {coverPhoto ? (
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${coverPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 50%, ${colors.golden}30 100%)`,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(44,36,23,0.2) 0%, rgba(44,36,23,0.6) 60%, rgba(44,36,23,0.95) 100%)',
        }}
      />

      {/* Content */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-6 pb-12"
        style={{ opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 mb-3"
        >
          <div
            className="px-3 py-1 rounded-full text-xs uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            Trip Complete
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs uppercase tracking-wider flex items-center gap-1"
            style={{ background: `${colors.golden}40`, color: 'white' }}
          >
            <Star className="w-3 h-3" />
            {cities.length} Cities
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-5xl font-serif font-medium text-white mb-3"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
        >
          {tripName}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center gap-4 text-white/80"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{dates}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{cities.join(' → ')}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
          <motion.div
            className="w-1.5 h-3 rounded-full bg-white/60"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Stats Section with animated counters
const StatsSection = ({ stats }: { stats: TripRecapData['stats'] }) => {
  const statItems = [
    { icon: Calendar, value: stats.totalDays, label: 'Days', color: colors.terracotta },
    { icon: Car, value: `${stats.totalDistance}`, label: 'Kilometers', color: colors.sage },
    { icon: Camera, value: stats.photosCount, label: 'Photos', color: colors.golden },
    { icon: Star, value: stats.highlightsCount, label: 'Highlights', color: colors.goldenDark },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-8 -mt-16 relative z-10 px-4"
    >
      <div
        className="grid grid-cols-4 gap-3 p-5 rounded-2xl mx-auto max-w-lg"
        style={{
          background: colors.cream,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: `1px solid ${colors.border}`,
        }}
      >
        {statItems.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl font-serif font-bold"
              style={{ color: colors.darkBrown }}
            >
              {stat.value}
            </motion.div>
            <div className="text-xs uppercase tracking-wider" style={{ color: colors.lightBrown }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// City Journey Timeline
const CityTimeline = ({ cities }: { cities: TripRecapData['cities'] }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    className="py-8 px-4"
  >
    <div className="flex items-center gap-2 mb-6">
      <Map className="w-5 h-5" style={{ color: colors.terracotta }} />
      <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
        Your Route
      </h2>
    </div>

    <div className="relative">
      {/* Timeline line */}
      <div
        className="absolute left-6 top-0 bottom-0 w-0.5"
        style={{ background: `linear-gradient(to bottom, ${colors.terracotta}, ${colors.sage})` }}
      />

      {/* Cities */}
      <div className="space-y-6">
        {cities.map((city, index) => (
          <motion.div
            key={city.name}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4 relative"
          >
            {/* Dot */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10"
              style={{
                background: index === 0
                  ? `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
                  : index === cities.length - 1
                    ? `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
                    : colors.warmWhite,
                border: `2px solid ${index === 0 || index === cities.length - 1 ? 'transparent' : colors.border}`,
                boxShadow: index === 0 || index === cities.length - 1
                  ? '0 4px 15px rgba(0,0,0,0.15)'
                  : 'none',
              }}
            >
              <MapPin
                className="w-5 h-5"
                style={{
                  color: index === 0 || index === cities.length - 1 ? 'white' : colors.lightBrown,
                }}
              />
            </div>

            {/* Content */}
            <div
              className="flex-1 p-4 rounded-xl"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium" style={{ color: colors.darkBrown }}>
                  {city.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${colors.sage}15`, color: colors.sage }}>
                  {city.nights} {city.nights === 1 ? 'night' : 'nights'}
                </span>
              </div>
              {city.country && (
                <p className="text-sm mb-2" style={{ color: colors.lightBrown }}>
                  {city.country}
                </p>
              )}
              {city.highlights && city.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {city.highlights.slice(0, 3).map((highlight) => (
                    <span
                      key={highlight}
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ background: `${colors.golden}15`, color: colors.goldenDark }}
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);

// Photo Mosaic Gallery
const PhotoMosaic = ({ photos }: { photos: TripRecapData['photos'] }) => {
  if (photos.length === 0) return null;

  // Take up to 9 photos for the mosaic
  const displayPhotos = photos.slice(0, 9);
  const remainingCount = photos.length - 9;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-8 px-4"
    >
      <div className="flex items-center gap-2 mb-6">
        <Camera className="w-5 h-5" style={{ color: colors.golden }} />
        <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
          Captured Moments
        </h2>
        <span className="text-sm" style={{ color: colors.lightBrown }}>
          ({photos.length} photos)
        </span>
      </div>

      {/* Mosaic grid */}
      <div className="grid grid-cols-3 gap-2">
        {displayPhotos.map((photo, index) => {
          // Make first and last items larger
          const isLarge = index === 0;
          const gridClass = isLarge ? 'col-span-2 row-span-2' : 'col-span-1';

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`${gridClass} relative aspect-square rounded-xl overflow-hidden group cursor-pointer`}
              whileHover={{ scale: 1.02, zIndex: 10 }}
            >
              <img
                src={photo.url}
                alt={photo.caption || photo.city}
                className="w-full h-full object-cover"
              />

              {/* Highlight badge */}
              {photo.isHighlight && (
                <div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: colors.golden }}
                >
                  <Star className="w-3 h-3 text-white fill-current" />
                </div>
              )}

              {/* Hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3"
                style={{
                  background: 'linear-gradient(to top, rgba(44, 36, 23, 0.8) 0%, transparent 60%)',
                }}
              >
                <span className="text-white text-sm font-medium truncate">
                  {photo.caption || photo.city}
                </span>
              </div>

              {/* Remaining count on last visible photo */}
              {index === 8 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{remainingCount}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// AI Story Section
const StorySection = ({ story }: { story: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="py-8 px-4"
  >
    <div
      className="p-6 rounded-2xl relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Decorative quote */}
      <Quote
        className="absolute top-4 left-4 w-12 h-12 opacity-10"
        style={{ color: colors.sage }}
      />

      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `${colors.sage}15` }}
        >
          <Sparkles className="w-4 h-4" style={{ color: colors.sage }} />
        </div>
        <span className="text-sm uppercase tracking-wider" style={{ color: colors.sage }}>
          Your Story
        </span>
      </div>

      <p
        className="text-lg font-serif leading-relaxed relative z-10"
        style={{ color: colors.darkBrown }}
      >
        {story}
      </p>
    </div>
  </motion.div>
);

// Favorite Memory Spotlight
const FavoriteMemorySpotlight = ({
  memory,
}: {
  memory: TripRecapData['favoriteMemory'];
}) => {
  if (!memory) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-8 px-4"
    >
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-5 h-5" style={{ color: colors.terracotta }} />
        <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
          Favorite Moment
        </h2>
      </div>

      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: `linear-gradient(135deg, ${colors.terracotta}10 0%, ${colors.golden}10 100%)`,
          border: `1px solid ${colors.terracotta}20`,
        }}
      >
        {memory.photo && (
          <div className="aspect-video relative">
            <img
              src={memory.photo}
              alt={memory.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(44,36,23,0.8) 0%, transparent 60%)',
              }}
            />
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5" style={{ color: colors.golden }} />
            <h3 className="text-xl font-serif font-medium" style={{ color: colors.darkBrown }}>
              {memory.title}
            </h3>
          </div>
          <p className="text-base mb-3" style={{ color: colors.mediumBrown }}>
            {memory.description}
          </p>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: colors.terracotta }} />
            <span className="text-sm" style={{ color: colors.lightBrown }}>
              {memory.city}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Day Highlights Carousel
const HighlightsCarousel = ({ highlights }: { highlights: TripRecapData['highlights'] }) => {
  if (highlights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-8"
    >
      <div className="flex items-center gap-2 mb-6 px-4">
        <Star className="w-5 h-5" style={{ color: colors.golden }} />
        <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
          Trip Highlights
        </h2>
      </div>

      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-4 px-4">
          {highlights.map((highlight, index) => (
            <motion.div
              key={highlight.id}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-64"
            >
              <div
                className="rounded-2xl overflow-hidden h-full"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.golden}30`,
                  boxShadow: `0 4px 20px ${colors.golden}15`,
                }}
              >
                {highlight.photo && (
                  <div className="aspect-[4/3] relative">
                    <img
                      src={highlight.photo}
                      alt={highlight.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: colors.golden }}
                    >
                      <Star className="w-3.5 h-3.5 text-white fill-current" />
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-medium mb-1" style={{ color: colors.darkBrown }}>
                    {highlight.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: colors.lightBrown }}>
                    <MapPin className="w-3.5 h-3.5" style={{ color: colors.terracotta }} />
                    {highlight.city}
                  </div>
                  {highlight.note && (
                    <p className="text-sm mt-2 line-clamp-2" style={{ color: colors.mediumBrown }}>
                      {highlight.note}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

interface TripRecapProps {
  data: TripRecapData;
  onShare?: () => void;
  onDownload?: () => void;
  className?: string;
}

export const TripRecap: React.FC<TripRecapProps> = ({
  data,
  className = '',
}) => {
  // Format dates
  const formatDates = () => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const yearOptions: Intl.DateTimeFormatOptions = { ...options, year: 'numeric' };

    if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', yearOptions)}`;
    }
    return `${start.toLocaleDateString('en-US', yearOptions)} - ${end.toLocaleDateString('en-US', yearOptions)}`;
  };

  return (
    <div
      className={`min-h-screen ${className}`}
      style={{ background: colors.cream }}
    >
      {/* Hero Section */}
      <HeroSection
        coverPhoto={data.coverPhoto}
        tripName={data.name}
        dates={formatDates()}
        cities={data.cities.map(c => c.name)}
      />

      {/* Stats Cards */}
      <StatsSection stats={data.stats} />

      {/* AI Story */}
      {data.aiStory && <StorySection story={data.aiStory} />}

      {/* City Timeline */}
      <CityTimeline cities={data.cities} />

      {/* Photo Mosaic */}
      <PhotoMosaic photos={data.photos} />

      {/* Highlights Carousel */}
      <HighlightsCarousel highlights={data.highlights} />

      {/* Favorite Memory */}
      <FavoriteMemorySpotlight memory={data.favoriteMemory} />

      {/* Footer spacing */}
      <div className="h-24" />
    </div>
  );
};

export default TripRecap;
