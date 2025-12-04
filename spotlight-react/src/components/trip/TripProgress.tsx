/**
 * Trip Progress Dashboard - Journey Milestones
 *
 * A beautiful dashboard showing the traveler's progress through their trip,
 * with stats, city milestones, and collected memories.
 *
 * Design: "Travel Scrapbook" - vintage stamps, collected moments, achievement badges
 *
 * Features:
 * - Visual progress through cities
 * - Stats: distance, days, photos, check-ins
 * - City stamps (collected vs upcoming)
 * - Photo gallery preview
 * - Memory highlights
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Camera,
  Car,
  Calendar,
  CheckCircle,
  Star,
  Footprints,
  Trophy,
  Sparkles,
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
  stampRed: '#C45830',
  stampBlue: '#4A6FA5',
  stampGreen: '#6B8E7B',
};

// Stat Card Component
const StatCard = ({
  icon: Icon,
  value,
  label,
  color,
  index,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="flex flex-col items-center p-4 rounded-2xl"
    style={{
      background: colors.warmWhite,
      border: `1px solid ${colors.border}`,
    }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
      style={{ background: `${color}15` }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <span className="text-2xl font-serif font-bold" style={{ color: colors.darkBrown }}>
      {value}
    </span>
    <span className="text-xs uppercase tracking-wider" style={{ color: colors.lightBrown }}>
      {label}
    </span>
  </motion.div>
);

// City Stamp Component (passport-style)
const CityStamp = ({
  city,
  isVisited,
  isCurrent,
  index,
}: {
  city: { name: string; country?: string; dates?: string };
  isVisited: boolean;
  isCurrent: boolean;
  index: number;
}) => {
  const stampColors = [colors.stampRed, colors.stampBlue, colors.stampGreen];
  const stampColor = stampColors[index % stampColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{
        opacity: isVisited || isCurrent ? 1 : 0.4,
        scale: 1,
        rotate: (index % 2 === 0 ? -3 : 3) + Math.random() * 2,
      }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      className="relative"
    >
      <div
        className="relative p-4 rounded-lg"
        style={{
          border: `3px solid ${isVisited ? stampColor : colors.border}`,
          borderStyle: 'dashed',
          background: isVisited ? `${stampColor}08` : 'transparent',
        }}
      >
        {/* Stamp content */}
        <div className="text-center">
          <div
            className="text-lg font-serif font-bold uppercase tracking-wide"
            style={{ color: isVisited ? stampColor : colors.lightBrown }}
          >
            {city.name}
          </div>
          {city.country && (
            <div
              className="text-xs uppercase tracking-wider mt-1"
              style={{ color: isVisited ? stampColor : colors.lightBrown, opacity: 0.7 }}
            >
              {city.country}
            </div>
          )}
          {city.dates && (
            <div
              className="text-xs mt-2"
              style={{ color: isVisited ? stampColor : colors.lightBrown }}
            >
              {city.dates}
            </div>
          )}
        </div>

        {/* Current indicator */}
        {isCurrent && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: colors.golden }}
          >
            <MapPin className="w-3 h-3 text-white" />
          </motion.div>
        )}

        {/* Visited checkmark */}
        {isVisited && !isCurrent && (
          <div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: colors.sage }}
          >
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Achievement Badge Component
const AchievementBadge = ({
  achievement,
  index,
}: {
  achievement: {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    unlocked: boolean;
  };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="flex items-center gap-3 p-3 rounded-xl"
    style={{
      background: achievement.unlocked ? `${colors.golden}10` : colors.warmWhite,
      border: `1px solid ${achievement.unlocked ? colors.golden : colors.border}`,
      opacity: achievement.unlocked ? 1 : 0.5,
    }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center"
      style={{
        background: achievement.unlocked
          ? `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`
          : colors.border,
      }}
    >
      <achievement.icon
        className="w-6 h-6"
        style={{ color: achievement.unlocked ? 'white' : colors.lightBrown }}
      />
    </div>
    <div className="flex-1">
      <h4
        className="text-sm font-medium"
        style={{ color: achievement.unlocked ? colors.darkBrown : colors.lightBrown }}
      >
        {achievement.title}
      </h4>
      <p className="text-xs" style={{ color: colors.lightBrown }}>
        {achievement.description}
      </p>
    </div>
    {achievement.unlocked && (
      <Sparkles className="w-5 h-5" style={{ color: colors.golden }} />
    )}
  </motion.div>
);

// Photo Memory Tile
const PhotoMemoryTile = ({
  photo,
  index,
}: {
  photo: { url: string; city: string; caption?: string };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
    whileHover={{ scale: 1.05, zIndex: 10 }}
  >
    <img
      src={photo.url}
      alt={photo.caption || photo.city}
      className="w-full h-full object-cover"
    />
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2"
      style={{
        background: 'linear-gradient(to top, rgba(44, 36, 23, 0.8) 0%, transparent 60%)',
      }}
    >
      <span className="text-white text-xs font-medium truncate">
        {photo.caption || photo.city}
      </span>
    </div>
  </motion.div>
);

// Progress Ring Component
const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 8,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.sage}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-serif font-bold" style={{ color: colors.darkBrown }}>
          {Math.round(progress)}%
        </span>
        <span className="text-xs uppercase tracking-wider" style={{ color: colors.lightBrown }}>
          Complete
        </span>
      </div>
    </div>
  );
};

interface TripProgressProps {
  tripData: {
    currentDay: number;
    totalDays: number;
    currentCityIndex: number;
    cities: Array<{
      name: string;
      country?: string;
      dates?: string;
    }>;
    stats: {
      distanceTraveled: number;
      photosCaptures: number;
      checkinsComplete: number;
      totalCheckins: number;
    };
    photos?: Array<{
      url: string;
      city: string;
      caption?: string;
    }>;
  };
  className?: string;
}

export const TripProgress: React.FC<TripProgressProps> = ({
  tripData,
  className = '',
}) => {
  const {
    currentDay,
    totalDays,
    currentCityIndex,
    cities,
    stats,
    photos = [],
  } = tripData;

  // Calculate progress
  const progress = useMemo(() => {
    return totalDays > 0 ? (currentDay / totalDays) * 100 : 0;
  }, [currentDay, totalDays]);

  // Generate achievements
  const achievements = useMemo(() => [
    {
      id: 'first-checkin',
      icon: CheckCircle,
      title: 'First Check-in',
      description: 'You checked in at your first stop',
      unlocked: stats.checkinsComplete > 0,
    },
    {
      id: 'photographer',
      icon: Camera,
      title: 'Memory Maker',
      description: 'Capture 10 photos',
      unlocked: stats.photosCaptures >= 10,
    },
    {
      id: 'road-warrior',
      icon: Car,
      title: 'Road Warrior',
      description: 'Travel 500+ kilometers',
      unlocked: stats.distanceTraveled >= 500,
    },
    {
      id: 'explorer',
      icon: Footprints,
      title: 'City Explorer',
      description: 'Visit 3 cities',
      unlocked: currentCityIndex >= 2,
    },
    {
      id: 'halfway',
      icon: Trophy,
      title: 'Halfway There',
      description: 'Complete 50% of your trip',
      unlocked: progress >= 50,
    },
  ], [stats, currentCityIndex, progress]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Progress Ring */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl"
        style={{
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-medium mb-1" style={{ color: colors.darkBrown }}>
              Your Journey
            </h2>
            <p className="text-sm" style={{ color: colors.lightBrown }}>
              Day {currentDay} of {totalDays}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <MapPin className="w-4 h-4" style={{ color: colors.terracotta }} />
              <span className="text-base font-medium" style={{ color: colors.darkBrown }}>
                {cities[currentCityIndex]?.name || 'On the road'}
              </span>
            </div>
          </div>
          <ProgressRing progress={progress} />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Car}
          value={`${stats.distanceTraveled}`}
          label="km traveled"
          color={colors.sage}
          index={0}
        />
        <StatCard
          icon={Camera}
          value={stats.photosCaptures}
          label="photos"
          color={colors.terracotta}
          index={1}
        />
        <StatCard
          icon={Calendar}
          value={`${totalDays - currentDay}`}
          label="days left"
          color={colors.golden}
          index={2}
        />
        <StatCard
          icon={CheckCircle}
          value={`${stats.checkinsComplete}/${stats.totalCheckins}`}
          label="check-ins"
          color={colors.stampBlue}
          index={3}
        />
      </div>

      {/* City Stamps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-5 rounded-2xl"
        style={{
          background: colors.warmWhite,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5" style={{ color: colors.golden }} />
          <h3 className="text-base font-medium" style={{ color: colors.darkBrown }}>
            Passport Stamps
          </h3>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          {cities.map((city, index) => (
            <CityStamp
              key={city.name}
              city={city}
              isVisited={index < currentCityIndex}
              isCurrent={index === currentCityIndex}
              index={index}
            />
          ))}
        </div>
      </motion.div>

      {/* Photo Memories */}
      {photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="p-5 rounded-2xl"
          style={{
            background: colors.warmWhite,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" style={{ color: colors.terracotta }} />
              <h3 className="text-base font-medium" style={{ color: colors.darkBrown }}>
                Recent Memories
              </h3>
            </div>
            <span className="text-sm" style={{ color: colors.lightBrown }}>
              {photos.length} photos
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map((photo, index) => (
              <PhotoMemoryTile key={index} photo={photo} index={index} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-5 rounded-2xl"
        style={{
          background: colors.warmWhite,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5" style={{ color: colors.golden }} />
          <h3 className="text-base font-medium" style={{ color: colors.darkBrown }}>
            Trip Achievements
          </h3>
          <span
            className="ml-auto text-sm px-2 py-0.5 rounded-full"
            style={{ background: `${colors.golden}15`, color: colors.golden }}
          >
            {achievements.filter(a => a.unlocked).length}/{achievements.length}
          </span>
        </div>
        <div className="space-y-2">
          {achievements.map((achievement, index) => (
            <AchievementBadge key={achievement.id} achievement={achievement} index={index} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TripProgress;
