/**
 * Trip Journal - Chronological Memory Feed
 *
 * A beautiful scrapbook-style view of all trip memories,
 * organized chronologically with a masonry layout.
 *
 * Design: "Travel Scrapbook" - scattered photos, handwritten notes,
 * washi tape, stamps, and nostalgic textures
 *
 * Features:
 * - Day-by-day memory timeline
 * - Mixed media: photos, notes, highlights
 * - Masonry grid with varied sizes
 * - Polaroid and postcard styling
 * - Washi tape and stamp decorations
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Camera,
  PenLine,
  Star,
  ChevronDown,
  Sparkles,
  Clock,
  Quote,
} from 'lucide-react';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  paperWhite: '#F8F6F0',
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
  stampRed: '#C45830',
  stampBlue: '#4A6FA5',
  stampGreen: '#6B8E7B',
};

// Washi tape colors for decoration
const washiColors = [
  { bg: '#FFE4D6', pattern: 'dots' },
  { bg: '#D4E8DC', pattern: 'stripes' },
  { bg: '#FFF3CD', pattern: 'solid' },
  { bg: '#E8D5E0', pattern: 'zigzag' },
];

// Memory types
export interface Memory {
  id: string;
  type: 'photo' | 'note' | 'highlight' | 'checkin';
  timestamp: string;
  cityName: string;
  activityName?: string;
  content: {
    photoUrl?: string;
    caption?: string;
    note?: string;
    mood?: string;
    weather?: string;
    rating?: number;
  };
  isHighlight?: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface DayMemories {
  date: string;
  dayNumber: number;
  cityName: string;
  memories: Memory[];
}

// Washi Tape Decoration Component
const WashiTape = ({
  color,
  rotation,
  position,
}: {
  color: typeof washiColors[0];
  rotation: number;
  position: 'top-left' | 'top-right' | 'top-center';
}) => {
  const positionStyles: Record<string, { left?: string; right?: string; top: number }> = {
    'top-left': { left: '10%', top: -8 },
    'top-right': { right: '10%', top: -8 },
    'top-center': { left: '50%', top: -8 },
  };

  const baseTransform = position === 'top-center' ? 'translateX(-50%)' : '';

  return (
    <div
      className="absolute w-16 h-5 rounded-sm pointer-events-none"
      style={{
        ...positionStyles[position],
        background: color.bg,
        transform: `${baseTransform} rotate(${rotation}deg)`,
        opacity: 0.85,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {color.pattern === 'dots' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, ${colors.darkBrown}15 1px, transparent 1px)`,
            backgroundSize: '6px 6px',
          }}
        />
      )}
      {color.pattern === 'stripes' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, ${colors.darkBrown}08 3px, ${colors.darkBrown}08 6px)`,
          }}
        />
      )}
    </div>
  );
};

// Photo Memory Card (Polaroid style)
const PhotoMemoryCard = ({
  memory,
  index,
  onSelect,
}: {
  memory: Memory;
  index: number;
  onSelect: (memory: Memory) => void;
}) => {
  const rotation = (index % 2 === 0 ? -1 : 1) * (1 + Math.random() * 3);
  const washiColor = washiColors[index % washiColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotation * 2 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      className="relative cursor-pointer group"
      onClick={() => onSelect(memory)}
      whileHover={{
        scale: 1.03,
        rotate: 0,
        zIndex: 10,
        transition: { type: 'spring', stiffness: 300 },
      }}
    >
      {/* Washi tape decoration */}
      <WashiTape
        color={washiColor}
        rotation={(index % 3 - 1) * 5}
        position={index % 2 === 0 ? 'top-left' : 'top-right'}
      />

      {/* Polaroid frame */}
      <div
        className="p-2 pb-12 rounded-sm shadow-lg"
        style={{
          background: colors.paperWhite,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)',
        }}
      >
        {/* Photo */}
        <div className="aspect-square rounded-sm overflow-hidden relative">
          {memory.content.photoUrl && (
            <img
              src={memory.content.photoUrl}
              alt={memory.content.caption || memory.activityName || 'Memory'}
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(0.95) contrast(1.02)' }}
            />
          )}

          {/* Highlight badge */}
          {memory.isHighlight && (
            <motion.div
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
                boxShadow: `0 2px 8px ${colors.golden}50`,
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="w-4 h-4 text-white fill-current" />
            </motion.div>
          )}

          {/* Film grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Caption area (handwritten style) */}
        <div
          className="absolute bottom-2 left-2 right-2 h-8 flex items-center justify-center"
          style={{ fontFamily: "'Caveat', cursive" }}
        >
          <span
            className="text-base truncate px-2"
            style={{ color: colors.mediumBrown }}
          >
            {memory.content.caption || memory.activityName || memory.cityName}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Note Memory Card (Postcard style)
const NoteMemoryCard = ({
  memory,
  index,
  onSelect,
}: {
  memory: Memory;
  index: number;
  onSelect: (memory: Memory) => void;
}) => {
  const rotation = (index % 2 === 0 ? 1 : -1) * (0.5 + Math.random() * 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: rotation * 2 }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      className="relative cursor-pointer group"
      onClick={() => onSelect(memory)}
      whileHover={{
        scale: 1.02,
        rotate: 0,
        zIndex: 10,
      }}
    >
      {/* Note card */}
      <div
        className="p-4 rounded-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
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

        {/* Quote icon */}
        <Quote
          className="absolute top-3 left-3 w-5 h-5 opacity-20"
          style={{ color: colors.sage }}
        />

        {/* Note content */}
        <div className="relative z-10 pt-4">
          <p
            className="text-lg leading-relaxed"
            style={{
              fontFamily: "'Caveat', cursive",
              color: colors.darkBrown,
              minHeight: '72px',
            }}
          >
            {memory.content.note}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" style={{ color: colors.terracotta }} />
              <span className="text-xs" style={{ color: colors.lightBrown }}>
                {memory.cityName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" style={{ color: colors.lightBrown }} />
              <span className="text-xs" style={{ color: colors.lightBrown }}>
                {new Date(memory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Mood emoji if present */}
        {memory.content.mood && (
          <div className="absolute top-3 right-3 text-lg">
            {memory.content.mood === 'amazing' && '🤩'}
            {memory.content.mood === 'happy' && '😊'}
            {memory.content.mood === 'peaceful' && '😌'}
            {memory.content.mood === 'adventurous' && '🤠'}
            {memory.content.mood === 'tired' && '😴'}
            {memory.content.mood === 'hungry' && '🤤'}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Highlight Memory Card (Special golden card)
const HighlightMemoryCard = ({
  memory,
  index,
  onSelect,
}: {
  memory: Memory;
  index: number;
  onSelect: (memory: Memory) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
    className="relative cursor-pointer col-span-2"
    onClick={() => onSelect(memory)}
    whileHover={{ scale: 1.02, zIndex: 10 }}
  >
    <div
      className="p-5 rounded-2xl relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.golden}15 0%, ${colors.goldenLight}10 100%)`,
        border: `2px solid ${colors.golden}40`,
        boxShadow: `0 8px 25px ${colors.golden}20`,
      }}
    >
      {/* Sparkle decoration */}
      <motion.div
        className="absolute top-4 right-4"
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkles className="w-6 h-6" style={{ color: colors.golden }} />
      </motion.div>

      {/* Content */}
      <div className="flex items-start gap-4">
        {/* Star badge */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
            boxShadow: `0 4px 15px ${colors.golden}40`,
          }}
        >
          <Star className="w-6 h-6 text-white fill-current" />
        </div>

        <div className="flex-1">
          <span className="text-xs uppercase tracking-wider" style={{ color: colors.golden }}>
            Trip Highlight
          </span>
          <h4 className="text-lg font-serif font-medium mt-1" style={{ color: colors.darkBrown }}>
            {memory.activityName || memory.content.caption || 'Special Moment'}
          </h4>
          <p className="text-sm mt-2" style={{ color: colors.lightBrown }}>
            {memory.content.note || `A memorable moment at ${memory.cityName}`}
          </p>

          {/* Location and time */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" style={{ color: colors.terracotta }} />
              <span className="text-xs" style={{ color: colors.lightBrown }}>{memory.cityName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" style={{ color: colors.sage }} />
              <span className="text-xs" style={{ color: colors.lightBrown }}>
                {new Date(memory.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Photo thumbnail if exists */}
        {memory.content.photoUrl && (
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src={memory.content.photoUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

// Day Header Component
const DayHeader = ({
  dayData,
  isExpanded,
  onToggle,
}: {
  dayData: DayMemories;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <motion.button
    onClick={onToggle}
    className="w-full flex items-center justify-between p-4 rounded-2xl mb-3 group"
    style={{
      background: colors.warmWhite,
      border: `1px solid ${colors.border}`,
    }}
    whileHover={{ background: colors.cream }}
  >
    <div className="flex items-center gap-4">
      {/* Day number badge */}
      <div
        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
          boxShadow: `0 4px 12px ${colors.terracotta}30`,
        }}
      >
        <span className="text-white text-xs uppercase tracking-wide">Day</span>
        <span className="text-white text-lg font-bold">{dayData.dayNumber}</span>
      </div>

      <div className="text-left">
        <h3 className="text-base font-medium" style={{ color: colors.darkBrown }}>
          {dayData.cityName}
        </h3>
        <p className="text-sm flex items-center gap-2" style={{ color: colors.lightBrown }}>
          <Calendar className="w-3.5 h-3.5" />
          {new Date(dayData.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
          <span className="mx-1">•</span>
          <Camera className="w-3.5 h-3.5" />
          {dayData.memories.filter(m => m.type === 'photo').length} photos
          <PenLine className="w-3.5 h-3.5" />
          {dayData.memories.filter(m => m.type === 'note').length} notes
        </p>
      </div>
    </div>

    <motion.div
      animate={{ rotate: isExpanded ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <ChevronDown className="w-5 h-5" style={{ color: colors.lightBrown }} />
    </motion.div>
  </motion.button>
);

// Filter Pills
const FilterPills = ({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}) => {
  const filters = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'notes', label: 'Notes', icon: PenLine },
    { id: 'highlights', label: 'Highlights', icon: Star },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap"
            style={{
              background: isActive ? colors.darkBrown : colors.warmWhite,
              color: isActive ? 'white' : colors.mediumBrown,
              border: `1px solid ${isActive ? colors.darkBrown : colors.border}`,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{filter.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

// Empty State
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <motion.div
      className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${colors.sage}15 0%, ${colors.sageLight}10 100%)`,
        border: `2px dashed ${colors.sage}40`,
      }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <Camera className="w-8 h-8" style={{ color: colors.sage }} />
    </motion.div>
    <h3 className="text-lg font-serif font-medium mb-2" style={{ color: colors.darkBrown }}>
      No memories yet
    </h3>
    <p className="text-sm" style={{ color: colors.lightBrown }}>
      Start capturing moments during your trip!
    </p>
  </motion.div>
);

interface TripJournalProps {
  days: DayMemories[];
  onMemorySelect?: (memory: Memory) => void;
  className?: string;
}

export const TripJournal: React.FC<TripJournalProps> = ({
  days,
  onMemorySelect,
  className = '',
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(days.slice(0, 2).map(d => d.date))
  );

  // Filter memories based on active filter
  const filteredDays = useMemo(() => {
    if (activeFilter === 'all') return days;

    return days.map(day => ({
      ...day,
      memories: day.memories.filter(m => {
        if (activeFilter === 'photos') return m.type === 'photo';
        if (activeFilter === 'notes') return m.type === 'note';
        if (activeFilter === 'highlights') return m.isHighlight;
        return true;
      }),
    })).filter(day => day.memories.length > 0);
  }, [days, activeFilter]);

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const handleMemorySelect = (memory: Memory) => {
    onMemorySelect?.(memory);
  };

  // Stats
  const totalPhotos = days.reduce((acc, d) => acc + d.memories.filter(m => m.type === 'photo').length, 0);
  const totalNotes = days.reduce((acc, d) => acc + d.memories.filter(m => m.type === 'note').length, 0);
  const totalHighlights = days.reduce((acc, d) => acc + d.memories.filter(m => m.isHighlight).length, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2
          className="text-2xl font-serif font-medium mb-2"
          style={{ color: colors.darkBrown }}
        >
          Travel Journal
        </h2>
        <p className="text-sm" style={{ color: colors.lightBrown }}>
          {totalPhotos} photos • {totalNotes} notes • {totalHighlights} highlights
        </p>
      </motion.div>

      {/* Filters */}
      <FilterPills activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Days list */}
      {filteredDays.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {filteredDays.map((dayData) => {
            const isExpanded = expandedDays.has(dayData.date);

            return (
              <motion.div
                key={dayData.date}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Day Header */}
                <DayHeader
                  dayData={dayData}
                  isExpanded={isExpanded}
                  onToggle={() => toggleDay(dayData.date)}
                />

                {/* Memories Grid */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-4 p-2">
                        {dayData.memories.map((memory, index) => {
                          if (memory.isHighlight && memory.type !== 'note') {
                            return (
                              <HighlightMemoryCard
                                key={memory.id}
                                memory={memory}
                                index={index}
                                onSelect={handleMemorySelect}
                              />
                            );
                          }

                          if (memory.type === 'photo') {
                            return (
                              <PhotoMemoryCard
                                key={memory.id}
                                memory={memory}
                                index={index}
                                onSelect={handleMemorySelect}
                              />
                            );
                          }

                          if (memory.type === 'note') {
                            return (
                              <NoteMemoryCard
                                key={memory.id}
                                memory={memory}
                                index={index}
                                onSelect={handleMemorySelect}
                              />
                            );
                          }

                          return null;
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TripJournal;
