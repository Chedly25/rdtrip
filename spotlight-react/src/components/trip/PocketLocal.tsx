/**
 * Pocket Local - Your Friend in the City
 *
 * A revolutionary trip companion that feels like having a local friend
 * texting you suggestions. Not a checklist - a living, breathing companion.
 *
 * Design Philosophy:
 * - Chat-like interface but elevated - luxury concierge meets friendly local
 * - Context-aware suggestions based on time, weather, location
 * - Three choices at decision points, single focus during experiences
 * - Subtle transitions, no screaming buttons
 *
 * Aesthetic: "Parisian Concierge" - warm, sophisticated, effortlessly chic
 * Typography: Cormorant Garamond (elegant serif), Plus Jakarta Sans (modern)
 * Colors: Deep navy, warm gold, soft cream, accent coral
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  MapPin,
  Clock,
  Star,
  ChevronDown,
  Sparkles,
  Sun,
  Coffee,
  Utensils,
  Camera,
  Mountain,
  ArrowRight,
  Heart,
  Compass,
} from 'lucide-react';
import type { TimeSlot } from './TodayView';

// ==================== Design System ====================
const colors = {
  // Primary palette - Parisian elegance
  navy: '#1A2A3A',
  navyLight: '#2D4257',
  navyDeep: '#0F1A24',

  // Warm accents
  gold: '#C9A962',
  goldLight: '#E4D4A8',
  goldMuted: '#9A8352',

  // Background warmth
  cream: '#FAF8F5',
  warmWhite: '#FFFDF9',
  linen: '#F5F1EA',

  // Accent - coral touches
  coral: '#E07B5A',
  coralLight: '#F4A68D',
  coralMuted: '#C46B4D',

  // Neutrals
  charcoal: '#2C2C2C',
  stone: '#8B8680',
  pebble: '#C5C0B8',
  mist: '#E8E4DE',

  // Transparent layers
  overlay: 'rgba(26, 42, 58, 0.85)',
  glassDark: 'rgba(26, 42, 58, 0.95)',
  glassLight: 'rgba(255, 253, 249, 0.9)',
};

// Contextual "whispers" based on activity type and time
const generateWhisper = (activity: TimeSlot): string => {
  const type = activity.type || 'activity';

  const whispers: Record<string, string[]> = {
    restaurant: [
      `The locals have been coming here since before the tourists discovered it.`,
      `Ask for the table by the window — the light is perfect right now.`,
      `The chef's special is never on the menu. Just ask.`,
      `This is where the neighborhood gathers. Notice the regulars at the bar.`,
    ],
    cafe: [
      `Order what the person before you ordered. Trust the rhythm of the place.`,
      `The best seats aren't the obvious ones. Find the corner with the view.`,
      `Linger here. Some of the best conversations happen when you're not rushing.`,
    ],
    scenic: [
      `The view is different every hour. This one, right now, is yours alone.`,
      `Notice what others are walking past. The details are where the magic hides.`,
      `Stand still for a moment. Let the city breathe around you.`,
      `The best photo is the one you don't take — the memory that stays.`,
    ],
    activity: [
      `Move slowly through this one. Speed kills wonder.`,
      `Look up. Most people forget to look up.`,
      `Find the quiet corner. Every place has one.`,
    ],
    hotel: [
      `You've earned this rest. Tomorrow's adventures can wait.`,
      `Ask the concierge what they'd do with an hour free. They know things.`,
    ],
  };

  const typeWhispers = whispers[type] || whispers.activity;
  const randomIndex = Math.floor(Math.random() * typeWhispers.length);
  return typeWhispers[randomIndex];
};

// Time-aware greeting
const getTimeGreeting = (hour: number): { greeting: string; suggestion: string; icon: typeof Sun } => {
  if (hour >= 5 && hour < 9) {
    return {
      greeting: "The city is waking up",
      suggestion: "Morning light is kind to everything",
      icon: Sun,
    };
  }
  if (hour >= 9 && hour < 12) {
    return {
      greeting: "The morning is yours",
      suggestion: "Perfect time to wander before the crowds",
      icon: Coffee,
    };
  }
  if (hour >= 12 && hour < 15) {
    return {
      greeting: "Midday warmth",
      suggestion: "The golden hour of appetite",
      icon: Utensils,
    };
  }
  if (hour >= 15 && hour < 18) {
    return {
      greeting: "The afternoon unfolds",
      suggestion: "When the light gets interesting",
      icon: Camera,
    };
  }
  if (hour >= 18 && hour < 21) {
    return {
      greeting: "Evening descends",
      suggestion: "The city transforms after dark",
      icon: Star,
    };
  }
  return {
    greeting: "The night is yours",
    suggestion: "Secret hours, secret places",
    icon: Moon,
  };
};

// Placeholder for Moon since it's not in lucide by that name
const Moon = Star; // Using Star as placeholder

// Activity type configurations
const activityTypeConfig: Record<string, { icon: typeof MapPin; label: string; color: string }> = {
  restaurant: { icon: Utensils, label: 'Dining', color: colors.coral },
  cafe: { icon: Coffee, label: 'Café', color: colors.goldMuted },
  scenic: { icon: Mountain, label: 'Experience', color: colors.navyLight },
  activity: { icon: Camera, label: 'Discovery', color: colors.gold },
  hotel: { icon: MapPin, label: 'Rest', color: colors.stone },
  default: { icon: Compass, label: 'Explore', color: colors.navy },
};

// ==================== Choice Card Component ====================
interface ChoiceCardProps {
  activity: TimeSlot;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({
  activity,
  index,
  isSelected,
  onSelect,
}) => {
  const config = activityTypeConfig[activity.type] || activityTypeConfig.default;
  const Icon = config.icon;

  // Photo URL with fallback
  const photoUrl = activity.photo || (activity as unknown as { imageUrl?: string }).imageUrl;

  // Generate a contextual tagline
  const taglines = [
    "A local favorite",
    "Worth the detour",
    "Hidden in plain sight",
  ];

  return (
    <motion.button
      onClick={onSelect}
      className="relative w-full text-left overflow-hidden rounded-2xl"
      style={{
        background: colors.warmWhite,
        border: isSelected ? `2px solid ${colors.gold}` : `1px solid ${colors.mist}`,
        boxShadow: isSelected
          ? `0 8px 32px rgba(201, 169, 98, 0.25)`
          : `0 2px 12px rgba(0,0,0,0.06)`,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{
        y: -4,
        boxShadow: `0 12px 40px rgba(0,0,0,0.12)`,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Photo section */}
      <div className="relative h-32 overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyLight} 100%)`,
            }}
          >
            <Icon size={40} color={colors.goldLight} strokeWidth={1.5} />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)`,
          }}
        />

        {/* Type badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full flex items-center gap-1.5"
          style={{
            background: colors.glassLight,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Icon size={12} color={config.color} />
          <span
            className="text-xs font-medium"
            style={{ color: colors.navy, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {config.label}
          </span>
        </div>

        {/* Rating if available */}
        {activity.rating && (
          <div
            className="absolute top-3 right-3 px-2 py-1 rounded-full flex items-center gap-1"
            style={{
              background: colors.glassDark,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Star size={10} fill={colors.gold} color={colors.gold} />
            <span
              className="text-xs font-medium"
              style={{ color: colors.cream }}
            >
              {activity.rating}
            </span>
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="p-4">
        <h3
          className="text-lg font-semibold mb-1 line-clamp-1"
          style={{
            color: colors.navy,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
          }}
        >
          {activity.title}
        </h3>

        <p
          className="text-sm mb-3 line-clamp-2"
          style={{
            color: colors.stone,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.5,
          }}
        >
          {activity.description || taglines[index % taglines.length]}
        </p>

        {/* Location */}
        {activity.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} color={colors.pebble} />
            <span
              className="text-xs line-clamp-1"
              style={{ color: colors.stone }}
            >
              {activity.location}
            </span>
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: colors.gold }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
};

// ==================== Experience Mode Component ====================
interface ExperienceModeProps {
  activity: TimeSlot;
  cityName: string;
  onNavigate: () => void;
  onComplete: () => void;
  onChangeChoice: () => void;
  whisper: string;
}

const ExperienceMode: React.FC<ExperienceModeProps> = ({
  activity,
  cityName: _cityName,
  onNavigate,
  onComplete,
  onChangeChoice,
  whisper,
}) => {
  // cityName is kept for potential future use (e.g., contextual tips)
  void _cityName;
  const config = activityTypeConfig[activity.type] || activityTypeConfig.default;
  const Icon = config.icon;
  const photoUrl = activity.photo || (activity as unknown as { imageUrl?: string }).imageUrl;

  const [showTips, setShowTips] = useState(false);

  // Insider tips based on activity type
  const insiderTips = {
    restaurant: [
      "Ask the server what they'd order",
      "The bread is baked fresh - don't fill up before the main",
      "Tip: The terrace is where regulars sit",
    ],
    cafe: [
      "The pastries are made in-house",
      "Locals order at the bar - it's cheaper",
      "Best seat: near the window, away from the door",
    ],
    scenic: [
      "Early morning has the best light",
      "Walk counterclockwise for better views",
      "The side entrance is less crowded",
    ],
    activity: [
      "Start from the back and work forward",
      "The gift shop has hidden gems",
      "Audio guide is worth it - trust me",
    ],
    default: [
      "Take your time here",
      "Notice the small details",
      "This place rewards patience",
    ],
  };

  const tips = insiderTips[activity.type as keyof typeof insiderTips] || insiderTips.default;

  return (
    <motion.div
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero image section */}
      <div className="relative h-64 flex-shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyDeep} 100%)`,
            }}
          >
            <Icon size={64} color={colors.goldLight} strokeWidth={1} />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${colors.cream} 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.3) 100%)`,
          }}
        />

        {/* Change option - subtle, top right */}
        <motion.button
          onClick={onChangeChoice}
          className="absolute top-4 right-4 p-2.5 rounded-full"
          style={{
            background: colors.glassLight,
            backdropFilter: 'blur(8px)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Compass size={18} color={colors.navy} />
        </motion.button>

        {/* Type badge */}
        <div
          className="absolute top-4 left-4 px-3 py-1.5 rounded-full flex items-center gap-2"
          style={{
            background: colors.glassDark,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Icon size={14} color={colors.gold} />
          <span
            className="text-xs font-medium tracking-wide"
            style={{ color: colors.cream }}
          >
            {config.label.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content section */}
      <div
        className="flex-1 px-5 -mt-8 relative z-10"
        style={{ background: colors.cream }}
      >
        {/* Title card */}
        <div
          className="p-5 rounded-xl mb-4"
          style={{
            background: colors.warmWhite,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <h1
            className="text-2xl mb-2"
            style={{
              color: colors.navy,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {activity.title}
          </h1>

          {activity.location && (
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} color={colors.stone} />
              <span
                className="text-sm"
                style={{ color: colors.stone }}
              >
                {activity.location}
              </span>
            </div>
          )}

          {/* Rating and details row */}
          <div className="flex items-center gap-4">
            {activity.rating && (
              <div className="flex items-center gap-1">
                <Star size={14} fill={colors.gold} color={colors.gold} />
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.navy }}
                >
                  {activity.rating}
                </span>
              </div>
            )}

            {activity.duration && (
              <div className="flex items-center gap-1">
                <Clock size={14} color={colors.stone} />
                <span
                  className="text-sm"
                  style={{ color: colors.stone }}
                >
                  {activity.duration}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Whisper - the pocket local message */}
        <motion.div
          className="mb-4 p-4 rounded-xl relative"
          style={{
            background: `linear-gradient(135deg, ${colors.navy} 0%, ${colors.navyLight} 100%)`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Chat bubble tail */}
          <div
            className="absolute -top-2 left-6 w-4 h-4 rotate-45"
            style={{ background: colors.navy }}
          />

          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: colors.gold }}
            >
              <Sparkles size={14} color={colors.navy} />
            </div>
            <p
              className="text-sm leading-relaxed italic"
              style={{
                color: colors.cream,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '15px',
              }}
            >
              "{whisper}"
            </p>
          </div>
        </motion.div>

        {/* Insider tips toggle */}
        <motion.button
          onClick={() => setShowTips(!showTips)}
          className="w-full mb-4 p-3 rounded-xl flex items-center justify-between"
          style={{
            background: colors.linen,
            border: `1px solid ${colors.mist}`,
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-2">
            <Heart size={16} color={colors.coral} />
            <span
              className="text-sm font-medium"
              style={{ color: colors.navy }}
            >
              Insider tips
            </span>
          </div>
          <motion.div
            animate={{ rotate: showTips ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} color={colors.stone} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {showTips && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-4"
            >
              <div className="space-y-2 pb-2">
                {tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg"
                    style={{ background: colors.warmWhite }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span style={{ color: colors.gold }}>•</span>
                    <span
                      className="text-sm"
                      style={{ color: colors.charcoal }}
                    >
                      {tip}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons - fixed at bottom */}
      <div
        className="flex-shrink-0 p-5 space-y-3"
        style={{
          background: colors.cream,
          borderTop: `1px solid ${colors.mist}`,
        }}
      >
        {/* Primary action - Navigate */}
        <motion.button
          onClick={onNavigate}
          className="w-full py-4 rounded-xl flex items-center justify-center gap-3"
          style={{
            background: colors.navy,
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Navigation size={18} color={colors.cream} />
          <span
            className="text-base font-medium"
            style={{
              color: colors.cream,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Take me there
          </span>
        </motion.button>

        {/* Secondary action - I'm here / Done */}
        <motion.button
          onClick={onComplete}
          className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
          style={{
            background: 'transparent',
            border: `1px solid ${colors.mist}`,
          }}
          whileHover={{
            background: colors.linen,
          }}
          whileTap={{ scale: 0.98 }}
        >
          <span
            className="text-sm"
            style={{ color: colors.stone }}
          >
            I'm done here
          </span>
          <ArrowRight size={14} color={colors.stone} />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ==================== Main Pocket Local Component ====================
interface PocketLocalProps {
  activities: TimeSlot[];
  dayNumber: number;
  totalDays: number;
  cityName: string;
  onNavigate: (activity: TimeSlot) => void;
  onActivityComplete: (activityId: string) => void;
}

export const PocketLocal: React.FC<PocketLocalProps> = ({
  activities,
  dayNumber,
  totalDays,
  cityName,
  onNavigate,
  onActivityComplete,
}) => {
  const [mode, setMode] = useState<'choice' | 'experience'>('choice');
  const [selectedActivity, setSelectedActivity] = useState<TimeSlot | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentWhisper, setCurrentWhisper] = useState('');

  // Get current hour for time-aware content
  const currentHour = new Date().getHours();
  const timeContext = getTimeGreeting(currentHour);
  const TimeIcon = timeContext.icon;

  // Get uncompleted activities for choices
  const availableActivities = activities.filter(a => !completedIds.has(a.id));
  const choiceActivities = availableActivities.slice(0, 3);

  // Handle activity selection
  const handleSelect = useCallback((activity: TimeSlot) => {
    setSelectedActivity(activity);
    setCurrentWhisper(generateWhisper(activity));
    setMode('experience');
  }, []);

  // Handle navigation
  const handleNavigate = useCallback(() => {
    if (selectedActivity) {
      onNavigate(selectedActivity);
    }
  }, [selectedActivity, onNavigate]);

  // Handle completion
  const handleComplete = useCallback(() => {
    if (selectedActivity) {
      setCompletedIds(prev => new Set([...prev, selectedActivity.id]));
      onActivityComplete(selectedActivity.id);
      setSelectedActivity(null);
      setMode('choice');
    }
  }, [selectedActivity, onActivityComplete]);

  // Handle going back to choices
  const handleChangeChoice = useCallback(() => {
    setSelectedActivity(null);
    setMode('choice');
  }, []);

  // If no activities left
  if (availableActivities.length === 0) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center p-8 text-center"
        style={{ background: colors.cream }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: colors.gold }}
          >
            <Sparkles size={32} color={colors.navy} />
          </div>
        </motion.div>

        <h2
          className="text-2xl mb-3"
          style={{
            color: colors.navy,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 600,
          }}
        >
          Day complete
        </h2>

        <p
          className="text-base max-w-xs"
          style={{
            color: colors.stone,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.6,
          }}
        >
          You've made the most of {cityName} today. Rest well — tomorrow brings new discoveries.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: colors.cream }}>
      <AnimatePresence mode="wait">
        {mode === 'choice' ? (
          <motion.div
            key="choice"
            className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="px-5 pt-6 pb-4">
              {/* Day indicator */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="text-xs tracking-widest"
                  style={{ color: colors.stone }}
                >
                  DAY {dayNumber} OF {totalDays}
                </span>
                <span style={{ color: colors.pebble }}>·</span>
                <span
                  className="text-xs"
                  style={{ color: colors.gold }}
                >
                  {cityName}
                </span>
              </div>

              {/* Time-aware greeting */}
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldMuted} 100%)`,
                  }}
                >
                  <TimeIcon size={18} color={colors.navy} />
                </div>
                <div>
                  <h1
                    className="text-xl"
                    style={{
                      color: colors.navy,
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontWeight: 600,
                    }}
                  >
                    {timeContext.greeting}
                  </h1>
                  <p
                    className="text-sm"
                    style={{ color: colors.stone }}
                  >
                    {timeContext.suggestion}
                  </p>
                </div>
              </div>
            </div>

            {/* Choices prompt */}
            <div className="px-5 mb-4">
              <motion.div
                className="p-4 rounded-xl"
                style={{
                  background: colors.linen,
                  border: `1px solid ${colors.mist}`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p
                  className="text-sm"
                  style={{
                    color: colors.charcoal,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: colors.navy, fontWeight: 500 }}>
                    What are you in the mood for?
                  </span>
                  {' '}Here are three perfect options for right now.
                </p>
              </motion.div>
            </div>

            {/* Choice cards */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <div className="space-y-4">
                {choiceActivities.map((activity, index) => (
                  <ChoiceCard
                    key={activity.id}
                    activity={activity}
                    index={index}
                    isSelected={selectedActivity?.id === activity.id}
                    onSelect={() => handleSelect(activity)}
                  />
                ))}
              </div>

              {/* More options hint */}
              {availableActivities.length > 3 && (
                <motion.p
                  className="text-center mt-4 text-sm"
                  style={{ color: colors.pebble }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  +{availableActivities.length - 3} more for later
                </motion.p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="experience"
            className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {selectedActivity && (
              <ExperienceMode
                activity={selectedActivity}
                cityName={cityName}
                onNavigate={handleNavigate}
                onComplete={handleComplete}
                onChangeChoice={handleChangeChoice}
                whisper={currentWhisper}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PocketLocal;
