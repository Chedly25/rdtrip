/**
 * Enhanced Today View - Your Living Travel Companion
 *
 * A radically reimagined trip experience that goes beyond a checklist.
 * Features serendipitous discovery, immersive now moments, and trip storytelling.
 *
 * Design: "Wanderlust Field Notes" - Editorial magazine meets personal journal
 *
 * Key Features:
 * - Immersive "NOW" hero card with atmospheric context
 * - Serendipity cards ("While you're here...")
 * - Smart time hints and contextual suggestions
 * - Trip story being written as you go
 * - Beautiful moment capture
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
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
  CloudSun,
  Compass,
  Lightbulb,
  Footprints,
  Gem,
  BookOpen,
  Quote,
} from 'lucide-react';

// Wanderlust Field Notes Color Palette
const colors = {
  // Base
  parchment: '#FBF8F3',
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  inkBlack: '#1A1612',

  // Primary
  terracotta: '#C45830',
  terracottaLight: '#E07B54',
  terracottaDark: '#9E3E1F',

  // Accent
  amber: '#D4A853',
  amberLight: '#E4C07A',
  amberDark: '#B8923D',

  // Sage/Nature
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  sageDark: '#4D6B5A',

  // Warm Browns
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  taupe: '#B5A48B',

  // Borders & Subtle
  border: '#E8E2D9',
  shadow: 'rgba(44, 36, 23, 0.08)',

  // Time-of-day themes
  dawn: {
    gradient: 'linear-gradient(135deg, #FFD4C4 0%, #FFE8DD 50%, #FFF5F0 100%)',
    primary: '#E07B54',
    secondary: '#FFCDB2',
    accent: '#D96A42',
    glow: 'rgba(224, 123, 84, 0.3)',
  },
  morning: {
    gradient: 'linear-gradient(135deg, #E8F4F8 0%, #F5FBFD 50%, #FFFBF5 100%)',
    primary: '#5B9AA0',
    secondary: '#A8D5DA',
    accent: '#4A8A90',
    glow: 'rgba(91, 154, 160, 0.3)',
  },
  afternoon: {
    gradient: 'linear-gradient(135deg, #FFF3E0 0%, #FFF9F0 50%, #FFFBF5 100%)',
    primary: '#D4A853',
    secondary: '#F5DEB3',
    accent: '#C49840',
    glow: 'rgba(212, 168, 83, 0.3)',
  },
  evening: {
    gradient: 'linear-gradient(135deg, #FFE4D6 0%, #FFF0E8 50%, #FFFBF5 100%)',
    primary: '#E07B39',
    secondary: '#FFB88C',
    accent: '#D06A2D',
    glow: 'rgba(224, 123, 57, 0.3)',
  },
  night: {
    gradient: 'linear-gradient(135deg, #2C2417 0%, #3D3528 50%, #4A4035 100%)',
    primary: '#D4A853',
    secondary: '#8B7355',
    accent: '#B8923D',
    glow: 'rgba(212, 168, 83, 0.3)',
  },
};

// Activity type icons
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
  time: string;
  endTime?: string;
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
  localTip?: string;
}

// Serendipity discovery interface
interface SerendipityItem {
  id: string;
  type: 'hidden_gem' | 'photo_spot' | 'local_tip' | 'nearby' | 'moment';
  title: string;
  description: string;
  distance?: string;
  icon: React.ElementType;
  image?: string;
  action?: string;
}

// Get time of day
const getTimeOfDay = (hour: number): 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' => {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Format time
const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes?.toString().padStart(2, '0') || '00'} ${period}`;
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

// ============================================================
// NOW HERO CARD - Immersive current experience
// ============================================================
const NowHeroCard = ({
  activity,
  timeOfDay,
  weather,
  onNavigate,
  onCall,
  onCheckin,
}: {
  activity: TimeSlot;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: { temp: number; condition: string };
  onNavigate?: (slot: TimeSlot) => void;
  onCall?: (slot: TimeSlot) => void;
  onCheckin?: (slot: TimeSlot) => void;
}) => {
  const theme = colors[timeOfDay];
  const Icon = activityIcons[activity.type] || activityIcons.default;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-4 mb-6 rounded-3xl overflow-hidden relative"
      style={{
        background: colors.parchment,
        boxShadow: `0 20px 60px ${colors.shadow}, 0 0 0 1px ${colors.border}`,
      }}
    >
      {/* Atmospheric image header */}
      <div className="relative h-48 overflow-hidden">
        {activity.photo ? (
          <motion.img
            src={activity.photo}
            alt={activity.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: theme.gradient }}
          />
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg,
              transparent 0%,
              rgba(26, 22, 18, 0.1) 40%,
              rgba(26, 22, 18, 0.6) 80%,
              rgba(26, 22, 18, 0.85) 100%)`,
          }}
        />

        {/* NOW pulse badge */}
        <motion.div
          className="absolute top-4 left-4 px-4 py-2 rounded-full flex items-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
            boxShadow: `0 4px 20px ${theme.glow}`,
          }}
          animate={{
            boxShadow: [
              `0 4px 20px ${theme.glow}`,
              `0 4px 40px ${theme.primary}60`,
              `0 4px 20px ${theme.glow}`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-white"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs font-bold text-white uppercase tracking-[0.15em]">
            Happening Now
          </span>
        </motion.div>

        {/* Weather chip */}
        {weather && (
          <div
            className="absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}
          >
            <Sun className="w-3.5 h-3.5" style={{ color: theme.primary }} />
            <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
              {weather.temp}°
            </span>
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <motion.h2
            className="text-2xl font-serif font-semibold text-white mb-1"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {activity.title}
          </motion.h2>
          <motion.div
            className="flex items-center gap-2 text-white/90"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-sm">{activity.location}</span>
          </motion.div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-5">
        {/* Time and type row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${theme.primary}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: theme.primary }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" style={{ color: colors.lightBrown }} />
                <span className="text-sm font-medium" style={{ color: colors.mediumBrown }}>
                  {formatTime(activity.time)}
                  {activity.endTime && ` - ${formatTime(activity.endTime)}`}
                </span>
              </div>
              <span className="text-xs capitalize" style={{ color: colors.taupe }}>
                {activity.type}
              </span>
            </div>
          </div>

          {activity.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" style={{ color: colors.amber }} />
              <span className="text-sm font-semibold" style={{ color: colors.darkBrown }}>
                {activity.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: colors.mediumBrown }}
          >
            {activity.description}
          </p>
        )}

        {/* Local tip */}
        {activity.localTip && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="p-3 rounded-xl mb-4 flex items-start gap-3"
            style={{
              background: `${colors.amber}10`,
              border: `1px solid ${colors.amber}20`,
            }}
          >
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.amber }} />
            <div>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.amber }}>
                Local Tip
              </span>
              <p className="text-sm mt-0.5" style={{ color: colors.mediumBrown }}>
                {activity.localTip}
              </p>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate?.(activity)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
              boxShadow: `0 4px 15px ${colors.sage}30`,
            }}
          >
            <Navigation className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Navigate</span>
          </motion.button>

          {activity.phone && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCall?.(activity)}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Phone className="w-5 h-5" style={{ color: colors.terracotta }} />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCheckin?.(activity)}
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.amber} 0%, ${colors.amberLight} 100%)`,
              boxShadow: `0 4px 15px ${colors.amber}30`,
            }}
          >
            <Camera className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// SERENDIPITY CARDS - Swipeable discovery suggestions
// ============================================================
const SerendipitySection = ({
  items,
  timeOfDay,
  onItemClick,
}: {
  items: SerendipityItem[];
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  onItemClick?: (item: SerendipityItem) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = colors[timeOfDay];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'right' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6"
    >
      {/* Section header */}
      <div className="px-4 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4" style={{ color: theme.primary }} />
          <span
            className="text-xs font-bold uppercase tracking-[0.15em]"
            style={{ color: theme.primary }}
          >
            While You're Here
          </span>
        </div>
        <div className="flex items-center gap-1">
          {items.map((_, idx) => (
            <div
              key={idx}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: idx === currentIndex ? theme.primary : colors.border,
                transform: idx === currentIndex ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Swipeable cards container */}
      <div className="relative overflow-hidden">
        <motion.div
          className="flex px-4 gap-3"
          animate={{ x: -currentIndex * (280 + 12) }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info: PanInfo) => {
            if (info.offset.x < -50) handleSwipe('left');
            else if (info.offset.x > 50) handleSwipe('right');
          }}
        >
          {items.map((item, index) => (
            <SerendipityCard
              key={item.id}
              item={item}
              theme={theme}
              isActive={index === currentIndex}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

const SerendipityCard = ({
  item,
  theme,
  isActive,
  onClick,
}: {
  item: SerendipityItem;
  theme: typeof colors.afternoon;
  isActive: boolean;
  onClick?: () => void;
}) => {
  const Icon = item.icon;

  const typeStyles = {
    hidden_gem: { bg: `${colors.amber}15`, icon: colors.amber, label: 'Hidden Gem' },
    photo_spot: { bg: `${colors.terracotta}15`, icon: colors.terracotta, label: 'Photo Spot' },
    local_tip: { bg: `${colors.sage}15`, icon: colors.sage, label: 'Local Tip' },
    nearby: { bg: `${theme.primary}15`, icon: theme.primary, label: 'Nearby' },
    moment: { bg: `${colors.amber}15`, icon: colors.amber, label: 'Moment' },
  };

  const style = typeStyles[item.type];

  return (
    <motion.div
      onClick={onClick}
      className="flex-shrink-0 w-[280px] rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: colors.warmWhite,
        border: `1px solid ${isActive ? theme.primary : colors.border}`,
        boxShadow: isActive ? `0 8px 30px ${theme.glow}` : `0 2px 10px ${colors.shadow}`,
      }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {item.image && (
        <div className="h-32 overflow-hidden relative">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)' }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Type badge */}
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2"
          style={{ background: style.bg }}
        >
          <Icon className="w-3 h-3" style={{ color: style.icon }} />
          <span className="text-xs font-medium" style={{ color: style.icon }}>
            {style.label}
          </span>
        </div>

        <h4
          className="text-base font-serif font-medium mb-1"
          style={{ color: colors.darkBrown }}
        >
          {item.title}
        </h4>

        <p
          className="text-sm line-clamp-2 mb-3"
          style={{ color: colors.lightBrown }}
        >
          {item.description}
        </p>

        {(item.distance || item.action) && (
          <div className="flex items-center justify-between">
            {item.distance && (
              <div className="flex items-center gap-1">
                <Footprints className="w-3 h-3" style={{ color: colors.taupe }} />
                <span className="text-xs" style={{ color: colors.taupe }}>
                  {item.distance}
                </span>
              </div>
            )}
            {item.action && (
              <div className="flex items-center gap-1" style={{ color: theme.primary }}>
                <span className="text-xs font-medium">{item.action}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================
// SMART TIME HINT - Contextual time suggestions
// ============================================================
const SmartTimeHint = ({
  nextActivity,
  currentTime,
  timeOfDay,
}: {
  nextActivity: TimeSlot | null;
  currentTime: Date;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
}) => {
  const theme = colors[timeOfDay];

  // Calculate time until next activity
  const getTimeHint = (): { message: string; type: 'urgent' | 'info' | 'free' } | null => {
    if (!nextActivity) return { message: "That's all for today! Enjoy exploring on your own.", type: 'free' };

    const [hours, mins] = nextActivity.time.split(':').map(Number);
    const nextTime = new Date(currentTime);
    nextTime.setHours(hours, mins || 0, 0);

    const diffMs = nextTime.getTime() - currentTime.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 0) return null;
    if (diffMins <= 15) return { message: `Leave now to make it on time!`, type: 'urgent' };
    if (diffMins <= 30) return { message: `Head out in ${diffMins} min for ${nextActivity.title}`, type: 'info' };
    if (diffMins <= 60) return { message: `You have ${diffMins} min free. Perfect for a coffee nearby!`, type: 'free' };

    const hours_left = Math.floor(diffMins / 60);
    const mins_left = diffMins % 60;
    return {
      message: `${hours_left}h ${mins_left > 0 ? `${mins_left}m` : ''} until your next stop. Time to explore!`,
      type: 'free'
    };
  };

  const hint = getTimeHint();
  if (!hint) return null;

  const typeStyles = {
    urgent: { bg: `${colors.terracotta}15`, border: colors.terracotta, icon: Clock },
    info: { bg: `${theme.primary}15`, border: theme.primary, icon: Lightbulb },
    free: { bg: `${colors.sage}15`, border: colors.sage, icon: Compass },
  };

  const style = typeStyles[hint.type];
  const HintIcon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 p-3 rounded-xl flex items-center gap-3"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}30`,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${style.border}20` }}
      >
        <HintIcon className="w-4 h-4" style={{ color: style.border }} />
      </div>
      <p className="text-sm flex-1" style={{ color: colors.mediumBrown }}>
        {hint.message}
      </p>
    </motion.div>
  );
};

// ============================================================
// TRIP STORY SNIPPET - Narrative being written
// ============================================================
const TripStorySnippet = ({
  activities,
  cityName,
  dayNumber,
}: {
  activities: TimeSlot[];
  cityName: string;
  dayNumber: number;
}) => {
  const completedCount = activities.filter(a => a.status === 'completed').length;

  if (completedCount === 0) return null;

  // Generate dynamic story snippet
  const generateStory = () => {
    const completed = activities.filter(a => a.status === 'completed');
    const latest = completed[completed.length - 1];

    const timeOfDay = getTimeOfDay(new Date().getHours());
    const timeWord = timeOfDay === 'morning' ? 'morning' : timeOfDay === 'afternoon' ? 'afternoon' : 'day';

    const storyParts = [
      `Your ${timeWord} in ${cityName} began`,
      completed.length === 1
        ? `with a visit to ${latest.title}.`
        : `exploring ${completed.length} wonderful spots, most recently ${latest.title}.`,
    ];

    return storyParts.join(' ');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mx-4 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4" style={{ color: colors.terracotta }} />
        <span
          className="text-xs font-bold uppercase tracking-[0.15em]"
          style={{ color: colors.terracotta }}
        >
          Your Story
        </span>
      </div>

      <div
        className="p-4 rounded-2xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.parchment} 0%, ${colors.cream} 100%)`,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Decorative quote mark */}
        <Quote
          className="absolute -top-2 -left-2 w-16 h-16 opacity-5"
          style={{ color: colors.terracotta }}
        />

        <p
          className="text-sm leading-relaxed italic relative z-10"
          style={{ color: colors.mediumBrown, fontFamily: 'Georgia, serif' }}
        >
          "{generateStory()}"
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
          <span className="text-xs" style={{ color: colors.taupe }}>
            Day {dayNumber} Journal
          </span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="text-xs flex items-center gap-1"
            style={{ color: colors.terracotta }}
          >
            <span>Continue writing</span>
            <ChevronRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// ENHANCED ACTIVITY CARD - More visual, more context
// ============================================================
const EnhancedActivityCard = ({
  slot,
  index,
  timeOfDay,
  onNavigate,
  onCall: _onCall,
  onCheckin: _onCheckin,
  onComplete,
}: {
  slot: TimeSlot;
  index: number;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  onNavigate?: (slot: TimeSlot) => void;
  onCall?: (slot: TimeSlot) => void;
  onCheckin?: (slot: TimeSlot) => void;
  onComplete?: (slot: TimeSlot) => void;
}) => {
  // Reserved for future use
  void _onCall;
  void _onCheckin;
  const theme = colors[timeOfDay];
  const Icon = activityIcons[slot.type] || activityIcons.default;

  const isCompleted = slot.status === 'completed';
  const isUpcoming = slot.status === 'upcoming';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isCompleted ? 0.7 : 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="mx-4 mb-4"
      style={{ filter: isCompleted ? 'saturate(0.7)' : 'none' }}
    >
      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{
          background: colors.warmWhite,
          border: `1px solid ${isCompleted ? colors.sage : isUpcoming ? colors.border : theme.primary}`,
          boxShadow: isUpcoming
            ? `0 2px 10px ${colors.shadow}`
            : `0 4px 20px ${theme.glow}`,
        }}
        whileHover={!isCompleted ? { y: -4, boxShadow: `0 8px 30px ${theme.glow}` } : {}}
      >
        {/* Mini photo strip for visual interest */}
        {slot.photo && (
          <div className="h-20 overflow-hidden relative">
            <img
              src={slot.photo}
              alt={slot.title}
              className="w-full h-full object-cover"
              style={{ filter: isCompleted ? 'sepia(0.3)' : 'none' }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: isCompleted
                  ? 'linear-gradient(to top, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 100%)'
                  : 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)',
              }}
            />
            {isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: colors.sage }}
              >
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>
        )}

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: isCompleted
                    ? `${colors.sage}15`
                    : `${theme.primary}15`
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: isCompleted ? colors.sage : theme.primary }}
                />
              </div>
              <div>
                <h4
                  className="text-base font-serif font-medium"
                  style={{
                    color: colors.darkBrown,
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    opacity: isCompleted ? 0.7 : 1,
                  }}
                >
                  {slot.title}
                </h4>
                <div className="flex items-center gap-2 text-xs" style={{ color: colors.taupe }}>
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(slot.time)}</span>
                  {slot.duration && <span>({slot.duration})</span>}
                </div>
              </div>
            </div>

            {slot.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" style={{ color: colors.amber }} />
                <span className="text-xs font-medium" style={{ color: colors.darkBrown }}>
                  {slot.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          {slot.location && (
            <div className="flex items-center gap-1.5 mb-3">
              <MapPin className="w-3 h-3" style={{ color: colors.terracotta }} />
              <span className="text-xs" style={{ color: colors.lightBrown }}>
                {slot.location}
              </span>
            </div>
          )}

          {/* Action row for upcoming items */}
          {isUpcoming && (
            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: colors.border }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate?.(slot)}
                className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5"
                style={{
                  background: `${colors.sage}10`,
                  border: `1px solid ${colors.sage}30`,
                }}
              >
                <Navigation className="w-3.5 h-3.5" style={{ color: colors.sage }} />
                <span className="text-xs font-medium" style={{ color: colors.sage }}>
                  Directions
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onComplete?.(slot)}
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Check className="w-4 h-4" style={{ color: colors.lightBrown }} />
              </motion.button>
            </div>
          )}

          {/* Completed state */}
          {isCompleted && (
            <div className="flex items-center gap-2 pt-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: colors.sage }}
              >
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
              <span className="text-xs" style={{ color: colors.sage }}>
                Completed
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================
// MAIN ENHANCED TODAY VIEW
// ============================================================
interface TodayViewEnhancedProps {
  dayNumber: number;
  totalDays: number;
  cityName: string;
  activities?: TimeSlot[];
  weather?: { temp: number; condition: string };
  serendipityItems?: SerendipityItem[];
  onNavigate?: (slot: TimeSlot) => void;
  onCall?: (slot: TimeSlot) => void;
  onCheckin?: (slot: TimeSlot) => void;
  onComplete?: (slot: TimeSlot) => void;
  onSerendipityClick?: (item: SerendipityItem) => void;
}

export const TodayViewEnhanced: React.FC<TodayViewEnhancedProps> = ({
  dayNumber,
  totalDays,
  cityName,
  activities = [],
  weather,
  serendipityItems = [],
  onNavigate,
  onCall,
  onCheckin,
  onComplete,
  onSerendipityClick,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = currentTime.getHours();
  const timeOfDay = getTimeOfDay(currentHour);
  const theme = colors[timeOfDay];
  const TimeIcon = getTimeIcon(currentHour);

  // Process activities with real status
  const processedActivities = useMemo(() => {
    const now = currentHour * 60 + currentTime.getMinutes();

    return activities.map(activity => {
      const [hours, mins] = activity.time.split(':').map(Number);
      const activityTime = hours * 60 + (mins || 0);
      const endTime = activity.endTime
        ? activity.endTime.split(':').map(Number).reduce((h, m) => h * 60 + (m || 0), 0)
        : activityTime + 60;

      let status: TimeSlot['status'] = 'upcoming';
      if (now >= endTime) status = 'completed';
      else if (now >= activityTime && now < endTime) status = 'current';

      return { ...activity, status };
    });
  }, [activities, currentHour, currentTime]);

  const currentActivity = processedActivities.find(a => a.status === 'current');
  const nextActivity = processedActivities.find(a => a.status === 'upcoming');
  const upcomingActivities = processedActivities.filter(a => a.status === 'upcoming');
  const completedActivities = processedActivities.filter(a => a.status === 'completed');

  // Default serendipity items based on location
  const defaultSerendipity: SerendipityItem[] = serendipityItems.length > 0 ? serendipityItems : [
    {
      id: 'gem-1',
      type: 'hidden_gem',
      title: 'Secret Garden Viewpoint',
      description: 'A hidden courtyard with stunning views, known only to locals.',
      distance: '2 min walk',
      icon: Gem,
      action: 'Discover',
    },
    {
      id: 'photo-1',
      type: 'photo_spot',
      title: 'Golden Hour Moment',
      description: 'The light is perfect right now. Capture a memory here.',
      icon: Camera,
      action: 'Take Photo',
    },
    {
      id: 'tip-1',
      type: 'local_tip',
      title: 'Off-Menu Special',
      description: 'Ask for the "maison special" - locals know to order it.',
      icon: Lightbulb,
    },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: theme.gradient }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pt-6 pb-4 relative"
      >
        {/* Day badge and weather */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="px-4 py-1.5 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                boxShadow: `0 4px 15px ${theme.glow}`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-xs font-bold text-white uppercase tracking-[0.1em]">
                Day {dayNumber}
              </span>
            </motion.div>
            <span className="text-sm" style={{ color: colors.lightBrown }}>
              of {totalDays}
            </span>
          </div>

          {weather && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}
            >
              <TimeIcon className="w-4 h-4" style={{ color: theme.primary }} />
              <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
                {weather.temp}°
              </span>
              <span className="text-xs" style={{ color: colors.taupe }}>
                {weather.condition}
              </span>
            </div>
          )}
        </div>

        {/* City name */}
        <h1
          className="text-3xl font-serif font-semibold mb-1"
          style={{ color: colors.darkBrown, letterSpacing: '-0.02em' }}
        >
          {cityName}
        </h1>
        <p className="text-sm" style={{ color: colors.lightBrown }}>
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        {/* Progress indicator */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: colors.border }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
              }}
              initial={{ width: 0 }}
              animate={{
                width: `${processedActivities.length > 0
                  ? (completedActivities.length / processedActivities.length) * 100
                  : 0}%`
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: theme.primary }}>
            {completedActivities.length}/{processedActivities.length}
          </span>
        </div>
      </motion.div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-20">
        {/* Smart time hint */}
        <SmartTimeHint
          nextActivity={nextActivity || null}
          currentTime={currentTime}
          timeOfDay={timeOfDay}
        />

        {/* Current activity hero */}
        {currentActivity && (
          <NowHeroCard
            activity={currentActivity}
            timeOfDay={timeOfDay}
            weather={weather}
            onNavigate={onNavigate}
            onCall={onCall}
            onCheckin={onCheckin}
          />
        )}

        {/* Serendipity section */}
        <SerendipitySection
          items={defaultSerendipity}
          timeOfDay={timeOfDay}
          onItemClick={onSerendipityClick}
        />

        {/* Trip story */}
        <TripStorySnippet
          activities={processedActivities}
          cityName={cityName}
          dayNumber={dayNumber}
        />

        {/* Upcoming activities */}
        {upcomingActivities.length > 0 && (
          <div className="mb-4">
            <div className="px-4 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: theme.primary }} />
              <span
                className="text-xs font-bold uppercase tracking-[0.15em]"
                style={{ color: theme.primary }}
              >
                Coming Up
              </span>
            </div>
            {upcomingActivities.map((slot, index) => (
              <EnhancedActivityCard
                key={slot.id}
                slot={slot}
                index={index}
                timeOfDay={timeOfDay}
                onNavigate={onNavigate}
                onCall={onCall}
                onCheckin={onCheckin}
                onComplete={onComplete}
              />
            ))}
          </div>
        )}

        {/* Completed activities (collapsed) */}
        {completedActivities.length > 0 && (
          <div className="mb-4">
            <div className="px-4 mb-3 flex items-center gap-2">
              <Check className="w-4 h-4" style={{ color: colors.sage }} />
              <span
                className="text-xs font-bold uppercase tracking-[0.15em]"
                style={{ color: colors.sage }}
              >
                Completed ({completedActivities.length})
              </span>
            </div>
            {completedActivities.map((slot, index) => (
              <EnhancedActivityCard
                key={slot.id}
                slot={slot}
                index={index}
                timeOfDay={timeOfDay}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {processedActivities.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-8"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: `${theme.primary}15` }}
            >
              <Compass className="w-10 h-10" style={{ color: theme.primary }} />
            </div>
            <h3
              className="text-xl font-serif font-medium mb-2 text-center"
              style={{ color: colors.darkBrown }}
            >
              Your adventure awaits
            </h3>
            <p
              className="text-sm text-center"
              style={{ color: colors.lightBrown }}
            >
              Generate an itinerary to fill your day with discoveries
            </p>
          </motion.div>
        )}

        {/* End of day marker */}
        {processedActivities.length > 0 && upcomingActivities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="py-8 text-center"
          >
            <Moon className="w-8 h-8 mx-auto mb-3" style={{ color: colors.taupe }} />
            <p className="text-sm font-serif italic" style={{ color: colors.lightBrown }}>
              End of Day {dayNumber}
            </p>
            <p className="text-xs mt-1" style={{ color: colors.taupe }}>
              {completedActivities.length} memories made today
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TodayViewEnhanced;
