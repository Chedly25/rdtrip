/**
 * TripDayView - Beautiful, Functional Day Navigator
 *
 * Design Direction: "Travel Journal Editorial"
 * - Warm, inviting editorial magazine aesthetic
 * - Clear timeline showing day progress
 * - Full-bleed activity cards with stunning visuals
 * - Intuitive swipe/tap navigation
 * - Clear, labeled action buttons that work
 *
 * Typography: Fraunces (display), DM Sans (body)
 * Colors: Warm cream, terracotta, espresso, golden ochre, sage
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  Check,
  SkipForward,
  Shuffle,
  MapPin,
  Clock,
  Utensils,
  Camera,
  Hotel,
  Mountain,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Star,
  Phone,
  X,
  Sparkles,
} from 'lucide-react';
import type { TimeSlot } from './TodayView';

// ==================== Design Tokens ====================
const colors = {
  cream: '#FBF9F6',
  warmWhite: '#F5F2ED',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  terracottaDark: '#A23D1E',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  sage: '#6B8E7B',
  sageMuted: '#8BA99A',
  espresso: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
  overlay: 'rgba(44, 36, 23, 0.7)',
};

// Activity type icons and colors
const activityConfig: Record<string, { icon: typeof MapPin; color: string; bgGradient: string }> = {
  restaurant: {
    icon: Utensils,
    color: colors.terracotta,
    bgGradient: 'linear-gradient(135deg, #E07B5A 0%, #C45830 50%, #8B3A1F 100%)',
  },
  hotel: {
    icon: Hotel,
    color: colors.golden,
    bgGradient: 'linear-gradient(135deg, #E4BE73 0%, #D4A853 50%, #A68532 100%)',
  },
  scenic: {
    icon: Mountain,
    color: colors.sage,
    bgGradient: 'linear-gradient(135deg, #8EC4A3 0%, #6B8E7B 50%, #4A6354 100%)',
  },
  activity: {
    icon: Camera,
    color: colors.terracottaLight,
    bgGradient: 'linear-gradient(135deg, #F2A47A 0%, #D96A42 50%, #A84E2B 100%)',
  },
  transit: {
    icon: Navigation,
    color: colors.mediumBrown,
    bgGradient: 'linear-gradient(135deg, #8B7355 0%, #4A3F35 50%, #2C2417 100%)',
  },
  free: {
    icon: Coffee,
    color: colors.lightBrown,
    bgGradient: 'linear-gradient(135deg, #C4A882 0%, #8B7355 50%, #5C4D3C 100%)',
  },
};

// ==================== Timeline Component ====================
interface TimelineProps {
  activities: TimeSlot[];
  currentIndex: number;
  completedIds: Set<string>;
  skippedIds: Set<string>;
  onSelectActivity: (index: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  activities,
  currentIndex,
  completedIds,
  skippedIds,
  onSelectActivity,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep current activity centered
  useEffect(() => {
    if (scrollRef.current) {
      const itemWidth = 56; // w-12 (48px) + gap
      const scrollPosition = currentIndex * itemWidth - (scrollRef.current.offsetWidth / 2) + itemWidth / 2;
      scrollRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
    }
  }, [currentIndex]);

  return (
    <div className="relative px-4 py-3" style={{ background: colors.warmWhite }}>
      {/* Progress bar background */}
      <div
        className="absolute top-1/2 left-6 right-6 h-0.5 -translate-y-1/2"
        style={{ background: colors.border }}
      />
      {/* Progress bar fill */}
      <motion.div
        className="absolute top-1/2 left-6 h-0.5 -translate-y-1/2"
        style={{ background: colors.terracotta }}
        initial={{ width: 0 }}
        animate={{ width: `${(currentIndex / Math.max(1, activities.length - 1)) * 100}%` }}
        transition={{ duration: 0.3 }}
      />

      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide relative"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {activities.map((activity, index) => {
          const config = activityConfig[activity.type] || activityConfig.activity;
          const Icon = config.icon;
          const isCompleted = completedIds.has(activity.id);
          const isSkipped = skippedIds.has(activity.id);
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;

          return (
            <motion.button
              key={activity.id}
              onClick={() => onSelectActivity(index)}
              className="relative flex-shrink-0 flex flex-col items-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Time label */}
              <span
                className="text-[10px] font-medium mb-1 opacity-60"
                style={{ color: colors.espresso, fontFamily: "'DM Sans', sans-serif" }}
              >
                {activity.time}
              </span>

              {/* Activity dot */}
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center relative"
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  boxShadow: isCurrent ? `0 4px 20px ${config.color}50` : 'none',
                }}
                style={{
                  background: isCompleted
                    ? colors.sage
                    : isSkipped
                    ? colors.lightBrown
                    : isCurrent
                    ? config.color
                    : isPast
                    ? `${config.color}30`
                    : colors.warmWhite,
                  border: `2px solid ${isCompleted ? colors.sage : isSkipped ? colors.lightBrown : config.color}`,
                }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : isSkipped ? (
                  <SkipForward className="w-4 h-4 text-white" />
                ) : (
                  <Icon
                    className="w-5 h-5"
                    style={{ color: isCurrent ? 'white' : config.color }}
                  />
                )}

                {/* Current indicator ring */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${config.color}` }}
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ==================== Activity Card Component ====================
interface ActivityCardProps {
  activity: TimeSlot;
  isCompleted: boolean;
  isSkipped: boolean;
  onNavigate: () => void;
  onMarkDone: () => void;
  onSkip: () => void;
  onSwap: () => void;
  direction: number;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isCompleted,
  isSkipped,
  onNavigate,
  onMarkDone,
  onSkip,
  onSwap,
  direction,
}) => {
  const config = activityConfig[activity.type] || activityConfig.activity;
  const Icon = config.icon;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex-1 flex flex-col overflow-hidden"
    >
      {/* Hero Image/Placeholder */}
      <div className="relative h-[45%] min-h-[200px] overflow-hidden">
        {activity.photo ? (
          <motion.img
            src={activity.photo}
            alt={activity.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
          />
        ) : (
          <motion.div
            className="w-full h-full flex items-center justify-center relative overflow-hidden"
            style={{ background: config.bgGradient }}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1.5" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Icon className="w-24 h-24 text-white/40" strokeWidth={1} />
            </motion.div>
          </motion.div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(44, 36, 23, 0.9) 0%, rgba(44, 36, 23, 0.4) 40%, transparent 70%)',
          }}
        />

        {/* Status badge */}
        {(isCompleted || isSkipped) && (
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{
              background: isCompleted ? colors.sage : colors.lightBrown,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            {isCompleted ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Done</span>
              </>
            ) : (
              <>
                <SkipForward className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Skipped</span>
              </>
            )}
          </motion.div>
        )}

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {/* Type badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <Icon className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-medium uppercase tracking-wider">
              {activity.type === 'restaurant' ? (activity as unknown as { mealType?: string }).mealType || 'Restaurant' : activity.type}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl font-bold text-white mb-2"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {activity.title}
          </motion.h2>

          {/* Location */}
          {activity.location && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 text-white/80"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{activity.location}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Details & Actions */}
      <div className="flex-1 p-5 flex flex-col" style={{ background: colors.cream }}>
        {/* Time & Rating */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="flex items-center gap-2" style={{ color: colors.mediumBrown }}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{activity.time}</span>
            {activity.duration && (
              <span className="text-sm opacity-60">({activity.duration})</span>
            )}
          </div>

          {activity.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" style={{ color: colors.golden }} />
              <span className="text-sm font-medium" style={{ color: colors.mediumBrown }}>
                {activity.rating.toFixed(1)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Description */}
        {activity.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm leading-relaxed mb-4 flex-1"
            style={{ color: colors.mediumBrown, fontFamily: "'DM Sans', sans-serif" }}
          >
            {activity.description}
          </motion.p>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {/* Primary Actions */}
          <div className="flex gap-3">
            {/* Navigate Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNavigate}
              disabled={!activity.coordinates}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaDark} 100%)`,
                boxShadow: `0 4px 20px ${colors.terracotta}40`,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Navigation className="w-5 h-5 text-white" />
              <span className="text-white">Navigate</span>
            </motion.button>

            {/* Mark Done Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMarkDone}
              disabled={isCompleted}
              className="w-14 h-14 rounded-2xl flex items-center justify-center disabled:opacity-50"
              style={{
                background: isCompleted ? colors.sage : colors.warmWhite,
                border: `2px solid ${isCompleted ? colors.sage : colors.sage}`,
              }}
            >
              <Check className="w-6 h-6" style={{ color: isCompleted ? 'white' : colors.sage }} />
            </motion.button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-3">
            {/* Skip Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              disabled={isSkipped || isCompleted}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium disabled:opacity-50"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`,
                color: colors.mediumBrown,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <SkipForward className="w-4 h-4" />
              <span>Skip This</span>
            </motion.button>

            {/* Swap Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSwap}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
              style={{
                background: `${colors.golden}15`,
                border: `1px solid ${colors.golden}40`,
                color: colors.golden,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Shuffle className="w-4 h-4" />
              <span>Find Alternative</span>
            </motion.button>
          </div>

          {/* Call Button (if phone available) */}
          {activity.phone && (
            <motion.a
              href={`tel:${activity.phone}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`,
                color: colors.lightBrown,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Phone className="w-4 h-4" />
              <span className="text-sm">{activity.phone}</span>
            </motion.a>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

// ==================== Swap Alternatives Sheet ====================
interface SwapSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activity: TimeSlot | null;
  onSelectAlternative: (alt: AlternativeActivity) => void;
}

interface AlternativeActivity {
  id: string;
  name: string;
  type: string;
  distance?: string;
  rating?: number;
  reason: string;
}

const SwapSheet: React.FC<SwapSheetProps> = ({ isOpen, onClose, activity, onSelectAlternative }) => {
  // Mock alternatives - in production, fetch from API
  const alternatives: AlternativeActivity[] = activity ? [
    {
      id: 'alt-1',
      name: activity.type === 'restaurant' ? 'Local Bistro' : 'Art Gallery',
      type: activity.type,
      distance: '0.3 km',
      rating: 4.7,
      reason: 'Highly rated nearby alternative',
    },
    {
      id: 'alt-2',
      name: activity.type === 'restaurant' ? 'Cozy Cafe' : 'Historic Museum',
      type: activity.type,
      distance: '0.5 km',
      rating: 4.5,
      reason: 'Popular with travelers',
    },
    {
      id: 'alt-3',
      name: activity.type === 'restaurant' ? 'Garden Terrace' : 'City Park',
      type: activity.type,
      distance: '0.8 km',
      rating: 4.8,
      reason: 'Perfect for the current weather',
    },
  ] : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ background: colors.cream, maxHeight: '70vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 rounded-full" style={{ background: colors.border }} />
            </div>

            {/* Header */}
            <div className="px-5 pb-4 flex items-center justify-between">
              <div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: colors.espresso, fontFamily: "'Fraunces', serif" }}
                >
                  Find Alternative
                </h3>
                <p className="text-sm" style={{ color: colors.lightBrown }}>
                  Similar options nearby
                </p>
              </div>
              <button onClick={onClose} className="p-2">
                <X className="w-5 h-5" style={{ color: colors.lightBrown }} />
              </button>
            </div>

            {/* Alternatives List */}
            <div className="px-5 pb-8 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)' }}>
              {alternatives.map((alt, index) => {
                const config = activityConfig[alt.type] || activityConfig.activity;
                const Icon = config.icon;

                return (
                  <motion.button
                    key={alt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectAlternative(alt)}
                    className="w-full p-4 rounded-2xl text-left flex items-start gap-4"
                    style={{
                      background: colors.warmWhite,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${config.color}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: config.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className="font-semibold truncate"
                          style={{ color: colors.espresso, fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {alt.name}
                        </h4>
                        {alt.rating && (
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-current" style={{ color: colors.golden }} />
                            <span className="text-xs font-medium" style={{ color: colors.golden }}>
                              {alt.rating}
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs mb-1.5" style={{ color: colors.lightBrown }}>
                        {alt.distance} away
                      </p>

                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" style={{ color: colors.sage }} />
                        <span className="text-xs" style={{ color: colors.sage }}>
                          {alt.reason}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: colors.lightBrown }} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ==================== Main TripDayView Component ====================
interface TripDayViewProps {
  activities: TimeSlot[];
  dayNumber: number;
  totalDays: number;
  cityName: string;
  onNavigate: (activity: TimeSlot) => void;
  onActivityComplete: (activityId: string) => void;
  onActivitySkip: (activityId: string) => void;
  onSwapActivity?: (activityId: string, newActivity: AlternativeActivity) => void;
  className?: string;
}

export const TripDayView: React.FC<TripDayViewProps> = ({
  activities,
  dayNumber,
  totalDays,
  cityName,
  onNavigate,
  onActivityComplete,
  onActivitySkip,
  onSwapActivity,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [showSwapSheet, setShowSwapSheet] = useState(false);

  const currentActivity = activities[currentIndex];

  // Navigate to activity
  const goToActivity = useCallback((index: number) => {
    if (index >= 0 && index < activities.length) {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    }
  }, [currentIndex, activities.length]);

  // Next/Previous
  const goNext = useCallback(() => goToActivity(currentIndex + 1), [currentIndex, goToActivity]);
  const goPrev = useCallback(() => goToActivity(currentIndex - 1), [currentIndex, goToActivity]);

  // Mark complete
  const handleMarkDone = useCallback(() => {
    if (currentActivity) {
      setCompletedIds(prev => new Set(prev).add(currentActivity.id));
      onActivityComplete(currentActivity.id);
      // Auto-advance to next
      if (currentIndex < activities.length - 1) {
        setTimeout(() => goNext(), 500);
      }
    }
  }, [currentActivity, currentIndex, activities.length, onActivityComplete, goNext]);

  // Skip
  const handleSkip = useCallback(() => {
    if (currentActivity) {
      setSkippedIds(prev => new Set(prev).add(currentActivity.id));
      onActivitySkip(currentActivity.id);
      // Auto-advance to next
      if (currentIndex < activities.length - 1) {
        setTimeout(() => goNext(), 500);
      }
    }
  }, [currentActivity, currentIndex, activities.length, onActivitySkip, goNext]);

  // Swap
  const handleSwap = useCallback(() => {
    setShowSwapSheet(true);
  }, []);

  const handleSelectAlternative = useCallback((alt: AlternativeActivity) => {
    if (currentActivity && onSwapActivity) {
      onSwapActivity(currentActivity.id, alt);
    }
    setShowSwapSheet(false);
  }, [currentActivity, onSwapActivity]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  if (activities.length === 0) {
    return (
      <div
        className={`h-full flex items-center justify-center ${className}`}
        style={{ background: colors.cream }}
      >
        <div className="text-center p-8">
          <Mountain className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: colors.lightBrown }} />
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: colors.espresso, fontFamily: "'Fraunces', serif" }}
          >
            No Activities Today
          </h3>
          <p style={{ color: colors.lightBrown }}>Enjoy your free day in {cityName}!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`} style={{ background: colors.cream }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        className="flex-shrink-0 px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div>
          <h1
            className="text-lg font-bold"
            style={{ color: colors.espresso, fontFamily: "'Fraunces', serif" }}
          >
            Day {dayNumber} of {totalDays}
          </h1>
          <p className="text-sm flex items-center gap-1.5" style={{ color: colors.lightBrown }}>
            <MapPin className="w-3.5 h-3.5" />
            {cityName}
          </p>
        </div>

        {/* Progress */}
        <div className="text-right">
          <p className="text-xs" style={{ color: colors.lightBrown }}>
            {completedIds.size} of {activities.length} done
          </p>
          <div className="w-20 h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: colors.border }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: colors.sage }}
              initial={{ width: 0 }}
              animate={{ width: `${(completedIds.size / activities.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Timeline
        activities={activities}
        currentIndex={currentIndex}
        completedIds={completedIds}
        skippedIds={skippedIds}
        onSelectActivity={goToActivity}
      />

      {/* Activity Card with Navigation */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {currentActivity && (
            <ActivityCard
              key={currentActivity.id}
              activity={currentActivity}
              isCompleted={completedIds.has(currentActivity.id)}
              isSkipped={skippedIds.has(currentActivity.id)}
              onNavigate={() => onNavigate(currentActivity)}
              onMarkDone={handleMarkDone}
              onSkip={handleSkip}
              onSwap={handleSwap}
              direction={direction}
            />
          )}
        </AnimatePresence>

        {/* Prev/Next Navigation Arrows */}
        {currentIndex > 0 && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            className="absolute left-3 top-1/3 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-20"
            style={{
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: colors.espresso }} />
          </motion.button>
        )}

        {currentIndex < activities.length - 1 && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goNext}
            className="absolute right-3 top-1/3 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-20"
            style={{
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: colors.espresso }} />
          </motion.button>
        )}
      </div>

      {/* Swap Sheet */}
      <SwapSheet
        isOpen={showSwapSheet}
        onClose={() => setShowSwapSheet(false)}
        activity={currentActivity}
        onSelectAlternative={handleSelectAlternative}
      />
    </div>
  );
};

export default TripDayView;
