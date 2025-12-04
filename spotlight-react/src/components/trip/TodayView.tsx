/**
 * Today View - Your Living Travel Journal
 *
 * A vertically flowing timeline that makes time itself visible during your trip.
 * The "now" moment is the focal point - past fades into warm memories,
 * future awaits with anticipation.
 *
 * Design: "Living Travel Journal" - editorial meets real-time awareness
 *
 * Features:
 * - Continuous timeline spine with time markers
 * - Glowing "Now" indicator that travels down the timeline
 * - Activity cards with status states (past/current/future)
 * - Time-aware color temperature (morning=dawn, afternoon=golden, evening=amber)
 * - "Up Next" prominent preview card
 * - Quick stats (activities done, distance traveled)
 * - Weather integration
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  MapPin,
  Clock,
  Check,
  ChevronRight,
  Navigation,
  Phone,
  Camera,
  Star,
  Utensils,
  Coffee,
  Bed,
  Mountain,
  Sparkles,
  Play,
  CloudSun,
} from 'lucide-react';

// Wanderlust Editorial Colors with time-of-day variations
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
  // Time-of-day colors
  dawn: {
    primary: '#FFB4A2',
    secondary: '#FFCDB2',
    accent: '#E5989B',
    bg: 'linear-gradient(180deg, #FFCDB2 0%, #FFE5D9 100%)',
  },
  morning: {
    primary: '#87CEEB',
    secondary: '#B4E4FF',
    accent: '#6BB3D9',
    bg: 'linear-gradient(180deg, #E8F4F8 0%, #FFFBF5 100%)',
  },
  afternoon: {
    primary: '#D4A853',
    secondary: '#E4BE73',
    accent: '#C49B4A',
    bg: 'linear-gradient(180deg, #FFF8E7 0%, #FFFBF5 100%)',
  },
  evening: {
    primary: '#E07B39',
    secondary: '#F4A261',
    accent: '#D4622B',
    bg: 'linear-gradient(180deg, #FFE8D6 0%, #FFF0E5 100%)',
  },
  night: {
    primary: '#6D6875',
    secondary: '#9D8189',
    accent: '#555060',
    bg: 'linear-gradient(180deg, #2C2417 0%, #3D3835 100%)',
  },
};

// Activity type to icon mapping
const activityIcons: Record<string, React.ElementType> = {
  restaurant: Utensils,
  cafe: Coffee,
  hotel: Bed,
  accommodation: Bed,
  scenic: Mountain,
  attraction: Star,
  activity: MapPin,
  default: MapPin,
};

// Time slot interface
export interface TimeSlot {
  id: string;
  time: string; // "09:00"
  endTime?: string; // "11:00"
  title: string;
  description?: string;
  type: 'activity' | 'restaurant' | 'hotel' | 'scenic' | 'transit' | 'free';
  location?: string;
  coordinates?: { lat: number; lng: number };
  photo?: string;
  rating?: number;
  phone?: string;
  status: 'completed' | 'current' | 'upcoming';
  duration?: string;
}

// Get time of day from hour
const getTimeOfDay = (hour: number): 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' => {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Get time icon
const getTimeIcon = (hour: number) => {
  const tod = getTimeOfDay(hour);
  switch (tod) {
    case 'dawn': return Sunrise;
    case 'morning': return Sun;
    case 'afternoon': return CloudSun;
    case 'evening': return Sunset;
    case 'night': return Moon;
  }
};

// Parse time string to hour
const parseHour = (time: string): number => {
  const [hours] = time.split(':').map(Number);
  return hours || 9;
};

// Format time for display
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes?.toString().padStart(2, '0') || '00'} ${period}`;
};

// Timeline Spine Component
const TimelineSpine = ({
  progress,
  timeOfDay
}: {
  progress: number;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
}) => {
  const todColors = colors[timeOfDay];

  return (
    <div className="absolute left-8 top-0 bottom-0 w-px">
      {/* Background line */}
      <div
        className="absolute inset-0 w-px"
        style={{ background: colors.border }}
      />
      {/* Progress line */}
      <motion.div
        className="absolute top-0 left-0 w-px origin-top"
        style={{
          background: `linear-gradient(180deg, ${todColors.primary} 0%, ${todColors.accent} 100%)`,
          height: `${progress}%`,
          boxShadow: `0 0 10px ${todColors.primary}40`,
        }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
};

// Now Indicator - The glowing orb showing current position
const NowIndicator = ({
  timeOfDay,
  currentTime,
}: {
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  currentTime: string;
}) => {
  const todColors = colors[timeOfDay];

  return (
    <motion.div
      className="relative flex items-center gap-4 py-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      {/* Glowing orb */}
      <div className="relative flex items-center justify-center w-16">
        <motion.div
          className="absolute w-10 h-10 rounded-full"
          style={{
            background: `radial-gradient(circle, ${todColors.primary} 0%, ${todColors.accent} 100%)`,
            boxShadow: `0 0 20px ${todColors.primary}60, 0 0 40px ${todColors.primary}30`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              `0 0 20px ${todColors.primary}60, 0 0 40px ${todColors.primary}30`,
              `0 0 30px ${todColors.primary}80, 0 0 60px ${todColors.primary}50`,
              `0 0 20px ${todColors.primary}60, 0 0 40px ${todColors.primary}30`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="relative z-10 w-4 h-4 rounded-full bg-white"
          animate={{ scale: [1, 0.8, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Now label */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: todColors.primary }}
          >
            Now
          </span>
          <span
            className="text-lg font-serif font-medium"
            style={{ color: colors.darkBrown }}
          >
            {currentTime}
          </span>
        </div>
        <p
          className="text-sm mt-0.5"
          style={{ color: colors.lightBrown }}
        >
          Your moment in time
        </p>
      </div>
    </motion.div>
  );
};

// Time Marker Component (reserved for future timeline markers)
const _TimeMarker = ({
  time,
  isActive,
  timeOfDay,
}: {
  time: string;
  isActive: boolean;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
}) => {
  const todColors = colors[timeOfDay];
  const TimeIcon = getTimeIcon(parseHour(time));

  return (
    <div className="relative flex items-center py-2">
      <div
        className="w-16 flex items-center justify-center"
      >
        <motion.div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: isActive ? todColors.primary : colors.warmWhite,
            border: `1px solid ${isActive ? todColors.accent : colors.border}`,
          }}
          whileHover={{ scale: 1.1 }}
        >
          <TimeIcon
            className="w-3 h-3"
            style={{ color: isActive ? 'white' : colors.lightBrown }}
          />
        </motion.div>
      </div>
      <span
        className="text-xs font-medium tracking-wide"
        style={{ color: isActive ? todColors.primary : colors.lightBrown }}
      >
        {formatTime(time)}
      </span>
    </div>
  );
};
void _TimeMarker; // Suppress unused warning

// Activity Card Component
const ActivityCard = ({
  slot,
  index,
  timeOfDay,
  onNavigate,
  onCall,
  onCheckin,
}: {
  slot: TimeSlot;
  index: number;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  onNavigate?: (slot: TimeSlot) => void;
  onCall?: (slot: TimeSlot) => void;
  onCheckin?: (slot: TimeSlot) => void;
}) => {
  const todColors = colors[timeOfDay];
  const Icon = activityIcons[slot.type] || activityIcons.default;

  const statusStyles = {
    completed: {
      bg: colors.warmWhite,
      border: colors.border,
      opacity: 0.7,
      filter: 'sepia(0.2)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    current: {
      bg: 'white',
      border: todColors.primary,
      opacity: 1,
      filter: 'none',
      boxShadow: `0 4px 20px ${todColors.primary}20, 0 0 0 2px ${todColors.primary}30`,
    },
    upcoming: {
      bg: colors.cream,
      border: colors.border,
      opacity: 0.9,
      filter: 'saturate(0.8)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
  };

  const style = statusStyles[slot.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: style.opacity, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative ml-16 mb-4"
      style={{ filter: style.filter }}
    >
      {/* Connector line to timeline */}
      <div
        className="absolute left-0 top-1/2 w-8 h-px -translate-x-8"
        style={{
          background: slot.status === 'current'
            ? todColors.primary
            : colors.border
        }}
      />

      {/* Status dot on timeline */}
      <div
        className="absolute -left-10 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
        style={{
          background: slot.status === 'completed'
            ? colors.sage
            : slot.status === 'current'
              ? todColors.primary
              : colors.border,
          boxShadow: slot.status === 'current'
            ? `0 0 10px ${todColors.primary}60`
            : 'none',
        }}
      >
        {slot.status === 'completed' && (
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        )}
      </div>

      {/* Card */}
      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          boxShadow: style.boxShadow,
        }}
        whileHover={{ scale: slot.status === 'current' ? 1.02 : 1, y: -2 }}
        transition={{ duration: 0.2 }}
      >
        {/* Photo header for current activity */}
        {slot.photo && slot.status === 'current' && (
          <div className="relative h-32 overflow-hidden">
            <img
              src={slot.photo}
              alt={slot.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)',
              }}
            />
            {/* Current badge */}
            <div
              className="absolute top-3 left-3 px-3 py-1 rounded-full flex items-center gap-1.5"
              style={{
                background: todColors.primary,
                boxShadow: `0 2px 10px ${todColors.primary}40`,
              }}
            >
              <Play className="w-3 h-3 text-white" fill="white" />
              <span className="text-xs font-semibold text-white uppercase tracking-wide">
                Now
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {/* Time and type */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock
                className="w-3.5 h-3.5"
                style={{ color: slot.status === 'current' ? todColors.primary : colors.lightBrown }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: slot.status === 'current' ? todColors.primary : colors.lightBrown }}
              >
                {formatTime(slot.time)}
                {slot.endTime && ` - ${formatTime(slot.endTime)}`}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                background: `${todColors.primary}15`,
                border: `1px solid ${todColors.primary}30`,
              }}
            >
              <Icon className="w-3 h-3" style={{ color: todColors.primary }} />
              <span
                className="text-xs capitalize"
                style={{ color: todColors.primary }}
              >
                {slot.type}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-lg font-serif font-medium mb-1"
            style={{ color: colors.darkBrown }}
          >
            {slot.title}
          </h3>

          {/* Description */}
          {slot.description && (
            <p
              className="text-sm mb-3 line-clamp-2"
              style={{ color: colors.lightBrown }}
            >
              {slot.description}
            </p>
          )}

          {/* Location */}
          {slot.location && (
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin className="w-3.5 h-3.5" style={{ color: colors.terracotta }} />
              <span className="text-sm" style={{ color: colors.mediumBrown }}>
                {slot.location}
              </span>
            </div>
          )}

          {/* Rating */}
          {slot.rating && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="w-3.5 h-3.5 fill-current" style={{ color: colors.golden }} />
              <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
                {slot.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Action buttons for current activity */}
          {slot.status === 'current' && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: colors.border }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate?.(slot)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                }}
              >
                <Navigation className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Navigate</span>
              </motion.button>

              {slot.phone && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCall?.(slot)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: colors.warmWhite,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <Phone className="w-4 h-4" style={{ color: colors.terracotta }} />
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCheckin?.(slot)}
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Camera className="w-4 h-4" style={{ color: colors.golden }} />
              </motion.button>
            </div>
          )}

          {/* Completed checkmark */}
          {slot.status === 'completed' && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: colors.sage }}
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <span className="text-sm" style={{ color: colors.sage }}>
                Completed
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Up Next Card Component
const UpNextCard = ({
  slot,
  timeOfDay,
  onNavigate,
}: {
  slot: TimeSlot | null;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  onNavigate?: (slot: TimeSlot) => void;
}) => {
  const todColors = colors[timeOfDay];

  if (!slot) return null;

  const Icon = activityIcons[slot.type] || activityIcons.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4" style={{ color: todColors.primary }} />
        <span
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: todColors.primary }}
        >
          Up Next
        </span>
      </div>

      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${todColors.primary}10 0%, ${todColors.secondary}10 100%)`,
          border: `2px dashed ${todColors.primary}40`,
        }}
        whileHover={{ scale: 1.02, borderStyle: 'solid' }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-4 flex items-center gap-4">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `${todColors.primary}20`,
            }}
          >
            <Icon className="w-6 h-6" style={{ color: todColors.primary }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3" style={{ color: todColors.primary }} />
              <span className="text-sm font-medium" style={{ color: todColors.primary }}>
                {formatTime(slot.time)}
              </span>
            </div>
            <h4
              className="text-base font-serif font-medium truncate"
              style={{ color: colors.darkBrown }}
            >
              {slot.title}
            </h4>
            {slot.location && (
              <p className="text-sm truncate" style={{ color: colors.lightBrown }}>
                {slot.location}
              </p>
            )}
          </div>

          {/* Navigate button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate?.(slot)}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: todColors.primary,
            }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Day Stats Component
const DayStats = ({
  completed,
  total,
  timeOfDay,
}: {
  completed: number;
  total: number;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
}) => {
  const todColors = colors[timeOfDay];
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mx-4 mb-6 p-4 rounded-2xl"
      style={{
        background: colors.warmWhite,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium" style={{ color: colors.mediumBrown }}>
          Today's Progress
        </span>
        <span className="text-sm font-serif font-medium" style={{ color: todColors.primary }}>
          {completed} of {total}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: colors.border }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${todColors.primary} 0%, ${todColors.accent} 100%)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
        />
      </div>
    </motion.div>
  );
};

// Weather Widget
const WeatherWidget = ({
  temp,
  condition,
  timeOfDay,
}: {
  temp: number;
  condition: string;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
}) => {
  const todColors = colors[timeOfDay];
  const TimeIcon = getTimeIcon(new Date().getHours());

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: `${todColors.primary}15`,
      }}
    >
      <TimeIcon className="w-4 h-4" style={{ color: todColors.primary }} />
      <span className="text-sm font-medium" style={{ color: todColors.primary }}>
        {temp}°
      </span>
      <span className="text-xs" style={{ color: colors.lightBrown }}>
        {condition}
      </span>
    </div>
  );
};

// Main TodayView Component
interface TodayViewProps {
  dayNumber: number;
  totalDays: number;
  cityName: string;
  activities?: TimeSlot[];
  weather?: { temp: number; condition: string };
  onNavigate?: (slot: TimeSlot) => void;
  onCall?: (slot: TimeSlot) => void;
  onCheckin?: (slot: TimeSlot) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  dayNumber,
  totalDays,
  cityName,
  activities = [],
  weather,
  onNavigate,
  onCall,
  onCheckin,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Current hour and time of day
  const currentHour = currentTime.getHours();
  const timeOfDay = getTimeOfDay(currentHour);
  const todColors = colors[timeOfDay];

  // Format current time
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Calculate timeline progress based on time
  const timelineProgress = useMemo(() => {
    // Day runs from 6am to 10pm (16 hours)
    const dayStart = 6;
    const dayEnd = 22;
    const totalHours = dayEnd - dayStart;
    const hoursPassed = Math.max(0, Math.min(currentHour - dayStart, totalHours));
    return (hoursPassed / totalHours) * 100;
  }, [currentHour]);

  // Determine activity status based on current time
  const processedActivities = useMemo(() => {
    const now = currentHour * 60 + currentTime.getMinutes();

    return activities.map(activity => {
      const [hours, mins] = activity.time.split(':').map(Number);
      const activityTime = hours * 60 + (mins || 0);
      const endTime = activity.endTime
        ? activity.endTime.split(':').map(Number).reduce((h, m) => h * 60 + m, 0)
        : activityTime + 60; // Default 1 hour duration

      let status: TimeSlot['status'] = 'upcoming';
      if (now >= endTime) {
        status = 'completed';
      } else if (now >= activityTime && now < endTime) {
        status = 'current';
      }

      return { ...activity, status };
    });
  }, [activities, currentHour, currentTime]);

  // Find current and next activities
  const currentActivity = processedActivities.find(a => a.status === 'current');
  const nextActivity = processedActivities.find(a => a.status === 'upcoming');
  const completedCount = processedActivities.filter(a => a.status === 'completed').length;

  // Scroll to current activity
  useEffect(() => {
    if (currentActivity && scrollRef.current) {
      const element = document.getElementById(`activity-${currentActivity.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentActivity?.id]);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: todColors.bg }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4"
        style={{
          background: 'linear-gradient(to bottom, white 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1 rounded-full"
              style={{
                background: todColors.primary,
              }}
            >
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Day {dayNumber}
              </span>
            </div>
            <span className="text-sm" style={{ color: colors.lightBrown }}>
              of {totalDays}
            </span>
          </div>

          {weather && (
            <WeatherWidget
              temp={weather.temp}
              condition={weather.condition}
              timeOfDay={timeOfDay}
            />
          )}
        </div>

        <h1
          className="text-3xl font-serif font-medium"
          style={{ color: colors.darkBrown }}
        >
          {cityName}
        </h1>
        <p className="text-sm mt-1" style={{ color: colors.lightBrown }}>
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </motion.div>

      {/* Day Progress */}
      <DayStats
        completed={completedCount}
        total={processedActivities.length}
        timeOfDay={timeOfDay}
      />

      {/* Up Next */}
      {nextActivity && !currentActivity && (
        <UpNextCard
          slot={nextActivity}
          timeOfDay={timeOfDay}
          onNavigate={onNavigate}
        />
      )}

      {/* Timeline */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative px-4 pb-20"
      >
        <TimelineSpine progress={timelineProgress} timeOfDay={timeOfDay} />

        {/* Now Indicator */}
        <NowIndicator timeOfDay={timeOfDay} currentTime={formattedTime} />

        {/* Activities */}
        {processedActivities.map((slot, index) => (
          <div key={slot.id} id={`activity-${slot.id}`}>
            <ActivityCard
              slot={slot}
              index={index}
              timeOfDay={timeOfDay}
              onNavigate={onNavigate}
              onCall={onCall}
              onCheckin={onCheckin}
            />
          </div>
        ))}

        {/* End of day */}
        {processedActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="ml-16 mt-8 py-4 text-center"
          >
            <Moon className="w-6 h-6 mx-auto mb-2" style={{ color: colors.lightBrown }} />
            <p className="text-sm" style={{ color: colors.lightBrown }}>
              End of Day {dayNumber}
            </p>
          </motion.div>
        )}

        {/* Empty state */}
        {processedActivities.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: `${todColors.primary}15` }}
            >
              <Sparkles className="w-8 h-8" style={{ color: todColors.primary }} />
            </div>
            <h3
              className="text-lg font-serif font-medium mb-2"
              style={{ color: colors.darkBrown }}
            >
              No Activities Yet
            </h3>
            <p
              className="text-sm text-center px-8"
              style={{ color: colors.lightBrown }}
            >
              Your day's activities will appear here once you generate an itinerary
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TodayView;
