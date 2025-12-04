/**
 * Memories Tab - Past Trips Gallery & Nostalgia
 *
 * A beautiful gallery of all past trips with nostalgia features
 * like "On This Day" memories and trip anniversaries.
 *
 * Design: "Travel Archive" - elegant gallery, vintage postcards,
 * timeline visualization, and memory triggers
 *
 * Features:
 * - Past trips grid/list view
 * - "On This Day" memories section
 * - Trip anniversaries highlights
 * - Photo memories timeline
 * - Search and filter
 * - Trip comparison stats
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Camera,
  Star,
  ChevronRight,
  Grid3x3,
  List,
  Search,
  Sparkles,
  Heart,
  Gift,
  SunMedium,
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
export interface PastTrip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  cities: string[];
  stats: {
    days: number;
    distance: number;
    photos: number;
  };
  isHighlight?: boolean;
}

export interface OnThisDayMemory {
  id: string;
  type: 'photo' | 'checkin' | 'note';
  tripId: string;
  tripName: string;
  city: string;
  date: string;
  yearsAgo: number;
  content: {
    photoUrl?: string;
    caption?: string;
    note?: string;
  };
}

export interface TripAnniversary {
  tripId: string;
  tripName: string;
  coverPhoto?: string;
  cities: string[];
  yearsAgo: number;
  date: string;
}

// On This Day Section
const OnThisDaySection = ({
  memories,
  onMemoryClick,
}: {
  memories: OnThisDayMemory[];
  onMemoryClick?: (memory: OnThisDayMemory) => void;
}) => {
  if (memories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
            boxShadow: `0 4px 15px ${colors.golden}30`,
          }}
        >
          <SunMedium className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
            On This Day
          </h2>
          <p className="text-sm" style={{ color: colors.lightBrown }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Memories horizontal scroll */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-4">
          {memories.map((memory, index) => (
            <motion.button
              key={memory.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onMemoryClick?.(memory)}
              className="flex-shrink-0 w-48"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.golden}30`,
                  boxShadow: `0 4px 20px ${colors.golden}15`,
                }}
              >
                {/* Photo */}
                {memory.content.photoUrl && (
                  <div className="aspect-[4/3] relative">
                    <img
                      src={memory.content.photoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs"
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
                    >
                      {memory.yearsAgo} {memory.yearsAgo === 1 ? 'year' : 'years'} ago
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-1 truncate" style={{ color: colors.darkBrown }}>
                    {memory.city}
                  </h4>
                  <p className="text-xs truncate" style={{ color: colors.lightBrown }}>
                    {memory.tripName}
                  </p>
                  {memory.content.caption && (
                    <p
                      className="text-xs mt-2 line-clamp-2"
                      style={{ color: colors.mediumBrown, fontStyle: 'italic' }}
                    >
                      "{memory.content.caption}"
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Anniversary Banner
const AnniversaryBanner = ({
  anniversary,
  onClick,
}: {
  anniversary: TripAnniversary;
  onClick?: () => void;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="w-full mb-8 rounded-2xl overflow-hidden relative"
    style={{ minHeight: '140px' }}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
  >
    {/* Background */}
    {anniversary.coverPhoto ? (
      <img
        src={anniversary.coverPhoto}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
    ) : (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.golden} 100%)`,
        }}
      />
    )}

    {/* Overlay */}
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(135deg, rgba(44,36,23,0.7) 0%, rgba(44,36,23,0.5) 100%)',
      }}
    />

    {/* Confetti decoration */}
    <motion.div
      className="absolute top-4 right-4"
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Gift className="w-8 h-8 text-white/80" />
    </motion.div>

    {/* Content */}
    <div className="relative z-10 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-4 h-4 text-white" />
        <span className="text-xs uppercase tracking-widest text-white/80">
          Trip Anniversary
        </span>
      </div>
      <h3 className="text-xl font-serif font-medium text-white mb-1">
        {anniversary.tripName}
      </h3>
      <p className="text-sm text-white/80 mb-3">
        {anniversary.yearsAgo} {anniversary.yearsAgo === 1 ? 'year' : 'years'} ago today
      </p>
      <div className="flex items-center gap-2 text-white/70 text-sm">
        <MapPin className="w-4 h-4" />
        {anniversary.cities.slice(0, 3).join(' → ')}
        {anniversary.cities.length > 3 && ` +${anniversary.cities.length - 3}`}
      </div>
    </div>
  </motion.button>
);

// Trip Card - Grid View
const TripCardGrid = ({
  trip,
  onClick,
}: {
  trip: PastTrip;
  onClick?: () => void;
}) => (
  <motion.button
    onClick={onClick}
    className="w-full rounded-2xl overflow-hidden text-left"
    style={{
      background: colors.warmWhite,
      border: `1px solid ${colors.border}`,
    }}
    whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
    whileTap={{ scale: 0.98 }}
  >
    {/* Cover photo */}
    <div className="aspect-[4/3] relative">
      {trip.coverPhoto ? (
        <img
          src={trip.coverPhoto}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
          }}
        />
      )}

      {/* Highlight badge */}
      {trip.isHighlight && (
        <div
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: colors.golden }}
        >
          <Star className="w-4 h-4 text-white fill-current" />
        </div>
      )}

      {/* Gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{
          background: 'linear-gradient(to top, rgba(44,36,23,0.6) 0%, transparent 100%)',
        }}
      />

      {/* City count */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white/90 text-xs">
        <MapPin className="w-3 h-3" />
        {trip.cities.length} cities
      </div>
    </div>

    {/* Content */}
    <div className="p-3">
      <h3 className="font-medium text-sm mb-1 truncate" style={{ color: colors.darkBrown }}>
        {trip.name}
      </h3>
      <p className="text-xs" style={{ color: colors.lightBrown }}>
        {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </p>

      {/* Mini stats */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t" style={{ borderColor: colors.border }}>
        <div className="flex items-center gap-1 text-xs" style={{ color: colors.lightBrown }}>
          <Calendar className="w-3 h-3" />
          {trip.stats.days}d
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: colors.lightBrown }}>
          <Camera className="w-3 h-3" />
          {trip.stats.photos}
        </div>
      </div>
    </div>
  </motion.button>
);

// Trip Card - List View
const TripCardList = ({
  trip,
  onClick,
}: {
  trip: PastTrip;
  onClick?: () => void;
}) => (
  <motion.button
    onClick={onClick}
    className="w-full rounded-xl overflow-hidden flex gap-4 p-3 text-left"
    style={{
      background: colors.warmWhite,
      border: `1px solid ${colors.border}`,
    }}
    whileHover={{ scale: 1.01, borderColor: colors.sage }}
    whileTap={{ scale: 0.99 }}
  >
    {/* Thumbnail */}
    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
      {trip.coverPhoto ? (
        <img
          src={trip.coverPhoto}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
          }}
        />
      )}
      {trip.isHighlight && (
        <div
          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: colors.golden }}
        >
          <Star className="w-3 h-3 text-white fill-current" />
        </div>
      )}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-sm mb-1 truncate" style={{ color: colors.darkBrown }}>
        {trip.name}
      </h3>
      <p className="text-xs mb-2" style={{ color: colors.lightBrown }}>
        {new Date(trip.startDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
      <p className="text-xs truncate" style={{ color: colors.mediumBrown }}>
        {trip.cities.join(' → ')}
      </p>
    </div>

    {/* Stats */}
    <div className="flex flex-col items-end justify-center gap-1 flex-shrink-0">
      <div className="flex items-center gap-1 text-xs" style={{ color: colors.lightBrown }}>
        <Calendar className="w-3 h-3" />
        {trip.stats.days} days
      </div>
      <div className="flex items-center gap-1 text-xs" style={{ color: colors.lightBrown }}>
        <Camera className="w-3 h-3" />
        {trip.stats.photos} photos
      </div>
    </div>

    <ChevronRight className="w-5 h-5 self-center flex-shrink-0" style={{ color: colors.lightBrown }} />
  </motion.button>
);

// Stats Summary Card
const StatsSummary = ({
  trips,
}: {
  trips: PastTrip[];
}) => {
  const totalTrips = trips.length;
  const totalDays = trips.reduce((acc, t) => acc + t.stats.days, 0);
  const totalPhotos = trips.reduce((acc, t) => acc + t.stats.photos, 0);
  const uniqueCities = new Set(trips.flatMap(t => t.cities)).size;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl mb-6"
      style={{
        background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" style={{ color: colors.golden }} />
        <span className="text-sm text-white/80">Your Travel Story</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <span className="text-2xl font-serif font-bold text-white">{totalTrips}</span>
          <span className="text-xs text-white/60 block">trips</span>
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <span className="text-2xl font-serif font-bold text-white">{totalDays}</span>
          <span className="text-xs text-white/60 block">days traveled</span>
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <span className="text-2xl font-serif font-bold text-white">{uniqueCities}</span>
          <span className="text-xs text-white/60 block">cities visited</span>
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <span className="text-2xl font-serif font-bold text-white">{totalPhotos}</span>
          <span className="text-xs text-white/60 block">memories</span>
        </div>
      </div>
    </motion.div>
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
      className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${colors.sage}15 0%, ${colors.golden}10 100%)`,
        border: `2px dashed ${colors.sage}40`,
      }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <MapPin className="w-10 h-10" style={{ color: colors.sage }} />
    </motion.div>
    <h3 className="text-xl font-serif font-medium mb-2" style={{ color: colors.darkBrown }}>
      No trips yet
    </h3>
    <p className="text-sm mb-6" style={{ color: colors.lightBrown }}>
      Your travel memories will appear here after your first adventure
    </p>
    <motion.button
      className="px-6 py-3 rounded-xl"
      style={{
        background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
        color: 'white',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      Plan Your First Trip
    </motion.button>
  </motion.div>
);

// View Toggle
const ViewToggle = ({
  view,
  onViewChange,
}: {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}) => (
  <div
    className="flex rounded-lg p-1"
    style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
  >
    <button
      onClick={() => onViewChange('grid')}
      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all"
      style={{
        background: view === 'grid' ? colors.darkBrown : 'transparent',
        color: view === 'grid' ? 'white' : colors.lightBrown,
      }}
    >
      <Grid3x3 className="w-4 h-4" />
      <span className="text-xs font-medium">Grid</span>
    </button>
    <button
      onClick={() => onViewChange('list')}
      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md transition-all"
      style={{
        background: view === 'list' ? colors.darkBrown : 'transparent',
        color: view === 'list' ? 'white' : colors.lightBrown,
      }}
    >
      <List className="w-4 h-4" />
      <span className="text-xs font-medium">List</span>
    </button>
  </div>
);

// Search Bar
const SearchBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div
    className="flex items-center gap-3 px-4 py-3 rounded-xl"
    style={{
      background: colors.warmWhite,
      border: `1px solid ${colors.border}`,
    }}
  >
    <Search className="w-5 h-5" style={{ color: colors.lightBrown }} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search trips..."
      className="flex-1 bg-transparent outline-none text-sm"
      style={{ color: colors.darkBrown }}
    />
  </div>
);

interface MemoriesTabProps {
  trips: PastTrip[];
  onThisDayMemories?: OnThisDayMemory[];
  anniversary?: TripAnniversary;
  onTripSelect?: (trip: PastTrip) => void;
  onMemoryClick?: (memory: OnThisDayMemory) => void;
  onAnniversaryClick?: () => void;
  className?: string;
}

export const MemoriesTab: React.FC<MemoriesTabProps> = ({
  trips,
  onThisDayMemories = [],
  anniversary,
  onTripSelect,
  onMemoryClick,
  onAnniversaryClick,
  className = '',
}) => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter trips by search
  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;

    const query = searchQuery.toLowerCase();
    return trips.filter(
      (trip) =>
        trip.name.toLowerCase().includes(query) ||
        trip.cities.some((city) => city.toLowerCase().includes(query))
    );
  }, [trips, searchQuery]);

  // Sort trips by date (most recent first)
  const sortedTrips = useMemo(() => {
    return [...filteredTrips].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [filteredTrips]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-4"
      >
        <h1
          className="text-2xl font-serif font-medium mb-1"
          style={{ color: colors.darkBrown }}
        >
          Memories
        </h1>
        <p className="text-sm" style={{ color: colors.lightBrown }}>
          Your travel story so far
        </p>
      </motion.div>

      {/* Anniversary Banner */}
      {anniversary && (
        <AnniversaryBanner anniversary={anniversary} onClick={onAnniversaryClick} />
      )}

      {/* On This Day */}
      <OnThisDaySection memories={onThisDayMemories} onMemoryClick={onMemoryClick} />

      {/* Stats Summary */}
      {trips.length > 0 && <StatsSummary trips={trips} />}

      {/* Search and View Toggle */}
      {trips.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      )}

      {/* Trips Grid/List */}
      {sortedTrips.length === 0 ? (
        trips.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: colors.lightBrown }}>
              No trips match "{searchQuery}"
            </p>
          </div>
        )
      ) : (
        <AnimatePresence mode="wait">
          {view === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              {sortedTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TripCardGrid trip={trip} onClick={() => onTripSelect?.(trip)} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {sortedTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <TripCardList trip={trip} onClick={() => onTripSelect?.(trip)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Footer spacing */}
      <div className="h-8" />
    </div>
  );
};

export default MemoriesTab;
