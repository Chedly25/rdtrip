/**
 * Trip Memories Gallery
 * Sprint 2.4: Check-ins & Progress Tracking
 *
 * A beautiful scrapbook-style gallery showcasing all check-in memories
 * from the trip with photos, moods, ratings, and notes.
 *
 * Design: "Travel Scrapbook" - polaroid cards, handwritten notes,
 * vintage stickers, and elegant animations
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Clock,
  Star,
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Heart,
  Sparkles,
} from 'lucide-react';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  polaroidWhite: '#F8F6F0',
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

// Mood configuration
const moodConfig: Record<string, { emoji: string; label: string; color: string }> = {
  amazing: { emoji: '🤩', label: 'Amazing', color: colors.golden },
  happy: { emoji: '😊', label: 'Happy', color: colors.sage },
  peaceful: { emoji: '😌', label: 'Peaceful', color: '#87CEEB' },
  adventurous: { emoji: '🤠', label: 'Adventurous', color: colors.terracotta },
  tired: { emoji: '😴', label: 'Tired', color: colors.lightBrown },
  hungry: { emoji: '🤤', label: 'Hungry', color: '#E07B39' },
};

// Weather icons
const weatherIcons: Record<string, React.ElementType> = {
  sunny: Sun,
  cloudy: Cloud,
  'partly-cloudy': CloudSun,
  rainy: CloudRain,
};

// Memory/Check-in type
export interface TripMemory {
  id: string;
  photo?: string;
  note: string;
  mood?: string;
  weather?: string;
  rating?: number;
  timestamp: string;
  location: {
    name: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  dayNumber?: number;
}

// Filter options
type FilterType = 'all' | 'photos' | 'ratings' | 'moods';

// Polaroid Memory Card
const MemoryCard = ({
  memory,
  index,
  onClick,
}: {
  memory: TripMemory;
  index: number;
  onClick: () => void;
}) => {
  const rotation = useMemo(() => (index % 2 === 0 ? -2 : 2) + Math.random() * 2 - 1, [index]);
  const moodData = memory.mood ? moodConfig[memory.mood] : null;
  const WeatherIcon = memory.weather ? weatherIcons[memory.weather] : null;
  const date = new Date(memory.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotation - 5 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      className="cursor-pointer"
      whileHover={{
        scale: 1.05,
        rotate: 0,
        zIndex: 20,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div
        className="p-3 pb-16 rounded-sm relative"
        style={{
          background: colors.polaroidWhite,
          boxShadow: '0 10px 30px -5px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        {/* Photo area */}
        <div
          className="aspect-square rounded-sm overflow-hidden relative"
          style={{
            background: memory.photo
              ? 'transparent'
              : `linear-gradient(135deg, ${colors.sage}30 0%, ${colors.golden}30 100%)`,
          }}
        >
          {memory.photo ? (
            <>
              <img
                src={memory.photo}
                alt={memory.note || memory.location.name}
                className="w-full h-full object-cover"
                style={{ filter: 'sepia(0.1) contrast(1.05)' }}
              />
              {/* Film grain overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {moodData ? (
                <span className="text-5xl">{moodData.emoji}</span>
              ) : (
                <MapPin className="w-10 h-10" style={{ color: colors.lightBrown }} />
              )}
            </div>
          )}

          {/* Rating overlay */}
          {memory.rating && memory.rating > 0 && (
            <div
              className="absolute top-2 right-2 px-2 py-1 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(255,255,255,0.9)' }}
            >
              <Star className="w-3 h-3" style={{ color: colors.golden, fill: colors.golden }} />
              <span className="text-xs font-medium" style={{ color: colors.darkBrown }}>
                {memory.rating}
              </span>
            </div>
          )}

          {/* Mood badge */}
          {moodData && memory.photo && (
            <div
              className="absolute bottom-2 left-2 px-2 py-1 rounded-full"
              style={{ background: `${moodData.color}E0` }}
            >
              <span className="text-sm">{moodData.emoji}</span>
            </div>
          )}
        </div>

        {/* Polaroid bottom */}
        <div className="absolute bottom-2 left-3 right-3">
          <p
            className="text-base truncate"
            style={{
              fontFamily: "'Caveat', cursive",
              color: colors.mediumBrown,
            }}
          >
            {memory.note || memory.location.name}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs" style={{ color: colors.lightBrown }}>
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            {WeatherIcon && (
              <WeatherIcon className="w-3.5 h-3.5" style={{ color: colors.lightBrown }} />
            )}
          </div>
        </div>

        {/* Decorative tape */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 -rotate-1"
          style={{
            background: 'linear-gradient(180deg, rgba(255,250,240,0.85) 0%, rgba(245,235,220,0.85) 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
      </div>
    </motion.div>
  );
};

// Memory Detail Modal
const MemoryDetailModal = ({
  memory,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  memory: TripMemory;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) => {
  const moodData = memory.mood ? moodConfig[memory.mood] : null;
  const WeatherIcon = memory.weather ? weatherIcons[memory.weather] : null;
  const date = new Date(memory.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(44, 36, 23, 0.9)' }}
      onClick={onClose}
    >
      {/* Navigation buttons */}
      {hasPrev && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center z-10"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.3)' }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {hasNext && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center z-10"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.3)' }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Close button */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
        style={{ background: 'rgba(255,255,255,0.2)' }}
        onClick={onClose}
        whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.3)' }}
        whileTap={{ scale: 0.9 }}
      >
        <X className="w-5 h-5 text-white" />
      </motion.button>

      {/* Memory detail card */}
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: colors.cream }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo */}
        {memory.photo ? (
          <div className="aspect-[4/3] relative">
            <img
              src={memory.photo}
              alt={memory.note || memory.location.name}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5) 100%)',
              }}
            />
          </div>
        ) : (
          <div
            className="aspect-[4/3] flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.sage}20 0%, ${colors.golden}20 100%)`,
            }}
          >
            {moodData ? (
              <span className="text-8xl">{moodData.emoji}</span>
            ) : (
              <Heart className="w-16 h-16" style={{ color: colors.terracotta }} />
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Location & Time */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: colors.terracotta }} />
              <div>
                <h3 className="font-serif text-lg font-medium" style={{ color: colors.darkBrown }}>
                  {memory.location.name}
                </h3>
                {memory.location.city && (
                  <p className="text-sm" style={{ color: colors.lightBrown }}>
                    {memory.location.city}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1" style={{ color: colors.lightBrown }}>
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: colors.lightBrown }}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Mood & Weather & Rating */}
          <div className="flex items-center gap-3 flex-wrap">
            {moodData && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-full"
                style={{ background: `${moodData.color}15`, border: `1px solid ${moodData.color}30` }}
              >
                <span className="text-lg">{moodData.emoji}</span>
                <span className="text-sm font-medium" style={{ color: moodData.color }}>
                  {moodData.label}
                </span>
              </div>
            )}

            {WeatherIcon && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-full"
                style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
              >
                <WeatherIcon className="w-4 h-4" style={{ color: colors.sage }} />
                <span className="text-sm capitalize" style={{ color: colors.mediumBrown }}>
                  {memory.weather?.replace('-', ' ')}
                </span>
              </div>
            )}

            {memory.rating && memory.rating > 0 && (
              <div
                className="flex items-center gap-1 px-3 py-2 rounded-full"
                style={{ background: `${colors.golden}15`, border: `1px solid ${colors.golden}30` }}
              >
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4"
                    style={{
                      color: i < memory.rating! ? colors.golden : colors.border,
                      fill: i < memory.rating! ? colors.golden : 'transparent',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Note */}
          {memory.note && (
            <div
              className="p-4 rounded-xl relative overflow-hidden"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`,
              }}
            >
              {/* Lined paper effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(transparent, transparent 23px, ${colors.border}40 24px)`,
                  backgroundPosition: '0 8px',
                }}
              />
              <p
                className="relative z-10 text-lg leading-relaxed"
                style={{
                  fontFamily: "'Caveat', cursive",
                  color: colors.darkBrown,
                }}
              >
                "{memory.note}"
              </p>
            </div>
          )}

          {/* Day number badge */}
          {memory.dayNumber && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: colors.golden }} />
              <span className="text-sm font-medium" style={{ color: colors.golden }}>
                Day {memory.dayNumber} of your trip
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Filter Chip Component
const FilterChip = ({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) => (
  <motion.button
    onClick={onClick}
    className="flex items-center gap-1.5 px-4 py-2 rounded-full transition-all"
    style={{
      background: active ? colors.terracotta : colors.warmWhite,
      border: `1px solid ${active ? colors.terracotta : colors.border}`,
    }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <span
      className="text-sm font-medium"
      style={{ color: active ? 'white' : colors.mediumBrown }}
    >
      {label}
    </span>
    {count !== undefined && (
      <span
        className="text-xs px-1.5 py-0.5 rounded-full"
        style={{
          background: active ? 'rgba(255,255,255,0.2)' : colors.border,
          color: active ? 'white' : colors.lightBrown,
        }}
      >
        {count}
      </span>
    )}
  </motion.button>
);

// Main Component Props
interface TripMemoriesProps {
  memories: TripMemory[];
  tripName?: string;
  className?: string;
}

export const TripMemories: React.FC<TripMemoriesProps> = ({
  memories,
  tripName = 'Your Journey',
  className = '',
}) => {
  const [selectedMemory, setSelectedMemory] = useState<TripMemory | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  // Filter memories
  const filteredMemories = useMemo(() => {
    switch (filter) {
      case 'photos':
        return memories.filter((m) => m.photo);
      case 'ratings':
        return memories.filter((m) => m.rating && m.rating >= 4);
      case 'moods':
        return memories.filter((m) => m.mood);
      default:
        return memories;
    }
  }, [memories, filter]);

  // Counts for filters
  const counts = useMemo(() => ({
    all: memories.length,
    photos: memories.filter((m) => m.photo).length,
    ratings: memories.filter((m) => m.rating && m.rating >= 4).length,
    moods: memories.filter((m) => m.mood).length,
  }), [memories]);

  // Navigation handlers
  const currentIndex = selectedMemory
    ? filteredMemories.findIndex((m) => m.id === selectedMemory.id)
    : -1;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedMemory(filteredMemories[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredMemories.length - 1) {
      setSelectedMemory(filteredMemories[currentIndex + 1]);
    }
  };

  if (memories.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
            style={{ background: `${colors.golden}15` }}
          >
            <Sparkles className="w-10 h-10" style={{ color: colors.golden }} />
          </div>
          <h3 className="text-xl font-serif" style={{ color: colors.darkBrown }}>
            No Memories Yet
          </h3>
          <p className="text-sm" style={{ color: colors.lightBrown }}>
            Check in at places to start capturing your travel memories!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-serif font-medium" style={{ color: colors.darkBrown }}>
          {tripName}
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.lightBrown }}>
          {memories.length} {memories.length === 1 ? 'memory' : 'memories'} captured
        </p>
      </motion.div>

      {/* Filter chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 overflow-x-auto pb-2"
      >
        <Filter className="w-4 h-4 flex-shrink-0" style={{ color: colors.lightBrown }} />
        <FilterChip
          label="All"
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          count={counts.all}
        />
        <FilterChip
          label="With Photos"
          active={filter === 'photos'}
          onClick={() => setFilter('photos')}
          count={counts.photos}
        />
        <FilterChip
          label="Top Rated"
          active={filter === 'ratings'}
          onClick={() => setFilter('ratings')}
          count={counts.ratings}
        />
        <FilterChip
          label="With Mood"
          active={filter === 'moods'}
          onClick={() => setFilter('moods')}
          count={counts.moods}
        />
      </motion.div>

      {/* Memories Grid - Scrapbook style */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredMemories.map((memory, index) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              index={index}
              onClick={() => setSelectedMemory(memory)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty filter state */}
      {filteredMemories.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p style={{ color: colors.lightBrown }}>
            No memories match this filter.
          </p>
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <MemoryDetailModal
            memory={selectedMemory}
            onClose={() => setSelectedMemory(null)}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={currentIndex > 0}
            hasNext={currentIndex < filteredMemories.length - 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripMemories;
