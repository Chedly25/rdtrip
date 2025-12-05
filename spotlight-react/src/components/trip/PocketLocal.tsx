/**
 * Pocket Local - The Midnight Confidant
 *
 * A time-aware travel companion that intuitively understands what you need.
 * At 11pm, it won't suggest a museum. It knows you want a bar.
 *
 * Design Philosophy:
 * - TIME-AWARE: Only shows what's actually relevant NOW
 * - INTIMATE: Like a trusted friend whispering suggestions
 * - DYNAMIC: Interface transforms based on time of day
 * - NO FLUFF: No city name (you know where you are), no irrelevant options
 *
 * Typography: Playfair Display (editorial) + DM Sans (friendly)
 * Colors: Dynamic - midnight tones at night, warm cream by day
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  MapPin,
  Clock,
  Star,
  ChevronDown,
  Sparkles,
  Moon,
  Sun,
  Coffee,
  Utensils,
  Wine,
  Camera,
  Mountain,
  ArrowRight,
  Heart,
  Compass,
  Sunrise,
  Sunset,
} from 'lucide-react';
import type { TimeSlot } from './TodayView';

// ==================== Time Intelligence System ====================

type TimePeriod = 'lateNight' | 'earlyMorning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

const getTimePeriod = (hour: number): TimePeriod => {
  if (hour >= 22 || hour < 5) return 'lateNight';
  if (hour >= 5 && hour < 8) return 'earlyMorning';
  if (hour >= 8 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night'; // 21-22
};

// What activity types are appropriate for each time period
const timeAppropriateTypes: Record<TimePeriod, string[]> = {
  lateNight: ['restaurant', 'hotel', 'free'], // NO museums, NO scenic at midnight
  earlyMorning: ['restaurant', 'scenic', 'free', 'hotel'], // Sunrise, cafes
  morning: ['restaurant', 'activity', 'scenic', 'free'], // Everything opens
  midday: ['restaurant', 'activity', 'scenic', 'free'], // Lunch + activities
  afternoon: ['activity', 'scenic', 'restaurant', 'free'], // Peak sightseeing
  evening: ['restaurant', 'scenic', 'activity', 'free', 'hotel'], // Dinner, sunset
  night: ['restaurant', 'hotel', 'free'], // Winding down
};

// Keywords that indicate nightlife-appropriate activities
const nightlifeKeywords = ['bar', 'wine', 'cocktail', 'pub', 'lounge', 'nightclub', 'jazz', 'live music'];
const daylightOnlyKeywords = ['museum', 'musée', 'galerie', 'gallery', 'château', 'palace', 'church', 'cathedral', 'basilica', 'tour'];

// Check if an activity is appropriate for the current time
const isActivityAppropriate = (activity: TimeSlot, hour: number): boolean => {
  const period = getTimePeriod(hour);
  const appropriateTypes = timeAppropriateTypes[period];
  const titleLower = activity.title.toLowerCase();
  const descLower = (activity.description || '').toLowerCase();
  const combined = titleLower + ' ' + descLower;

  // Late night special handling
  if (period === 'lateNight' || period === 'night') {
    // Allow if it's explicitly nightlife
    if (nightlifeKeywords.some(kw => combined.includes(kw))) {
      return true;
    }
    // Block if it's daylight-only
    if (daylightOnlyKeywords.some(kw => combined.includes(kw))) {
      return false;
    }
    // Otherwise check type
    return appropriateTypes.includes(activity.type);
  }

  // Daytime - block closed things but otherwise be permissive
  if (period === 'earlyMorning') {
    // Most museums aren't open at 6am
    if (daylightOnlyKeywords.some(kw => combined.includes(kw))) {
      return false;
    }
  }

  return appropriateTypes.includes(activity.type);
};

// ==================== Dynamic Theme System ====================

const getTheme = (hour: number) => {
  const isNight = hour >= 20 || hour < 6;

  if (isNight) {
    return {
      mode: 'dark' as const,
      // Deep, intimate night colors
      bg: {
        primary: '#0A0A0B',
        secondary: '#111113',
        card: '#18181B',
        cardHover: '#1F1F23',
        elevated: '#0D0D0E',
      },
      text: {
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        muted: '#71717A',
        accent: '#D4A574',
      },
      accent: {
        primary: '#D4A574', // Warm amber
        secondary: '#E8C9A0',
        muted: '#8B7355',
        glow: 'rgba(212, 165, 116, 0.15)',
      },
      border: {
        subtle: 'rgba(255, 255, 255, 0.06)',
        medium: 'rgba(255, 255, 255, 0.1)',
        accent: 'rgba(212, 165, 116, 0.3)',
      },
      shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      gradient: 'linear-gradient(135deg, #D4A574 0%, #E8C9A0 50%, #D4A574 100%)',
    };
  }

  return {
    mode: 'light' as const,
    // Warm, inviting day colors
    bg: {
      primary: '#FAF8F5',
      secondary: '#FFFFFF',
      card: '#FFFFFF',
      cardHover: '#F5F3F0',
      elevated: '#FFFDFB',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#525252',
      muted: '#737373',
      accent: '#C45830',
    },
    accent: {
      primary: '#C45830', // Rich terracotta
      secondary: '#D97650',
      muted: '#A04828',
      glow: 'rgba(196, 88, 48, 0.1)',
    },
    border: {
      subtle: 'rgba(0, 0, 0, 0.04)',
      medium: 'rgba(0, 0, 0, 0.08)',
      accent: 'rgba(196, 88, 48, 0.2)',
    },
    shadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    gradient: 'linear-gradient(135deg, #C45830 0%, #D97650 50%, #C45830 100%)',
  };
};

// ==================== Time-Aware Greetings ====================

interface TimeGreeting {
  headline: string;
  subtext: string;
  icon: typeof Sun;
  mood: string;
}

const getTimeGreeting = (hour: number): TimeGreeting => {
  if (hour >= 22 || hour < 5) {
    return {
      headline: "The night is yours",
      subtext: "Where the city reveals its secrets",
      icon: Moon,
      mood: "intimate",
    };
  }
  if (hour >= 5 && hour < 8) {
    return {
      headline: "First light",
      subtext: "The city awakens, and so do you",
      icon: Sunrise,
      mood: "peaceful",
    };
  }
  if (hour >= 8 && hour < 11) {
    return {
      headline: "Morning unfolds",
      subtext: "Time moves slowly for those who notice",
      icon: Coffee,
      mood: "energizing",
    };
  }
  if (hour >= 11 && hour < 14) {
    return {
      headline: "The golden hours",
      subtext: "When appetite and curiosity align",
      icon: Sun,
      mood: "vibrant",
    };
  }
  if (hour >= 14 && hour < 18) {
    return {
      headline: "Afternoon wanders",
      subtext: "The best discoveries are unplanned",
      icon: Camera,
      mood: "adventurous",
    };
  }
  if (hour >= 18 && hour < 21) {
    return {
      headline: "Evening descends",
      subtext: "The light softens everything",
      icon: Sunset,
      mood: "romantic",
    };
  }
  return {
    headline: "Twilight hour",
    subtext: "Between day and night, magic happens",
    icon: Star,
    mood: "mysterious",
  };
};

// ==================== Whispers - Contextual Insider Tips ====================

const generateWhisper = (activity: TimeSlot, hour: number): string => {
  const type = activity.type || 'activity';
  const period = getTimePeriod(hour);

  const whispersByTypeAndTime: Record<string, Record<string, string[]>> = {
    restaurant: {
      lateNight: [
        "The kitchen's winding down, but the best conversations are just starting.",
        "Ask what the staff eats. That's the real menu.",
        "The last seating is often the most honest.",
      ],
      earlyMorning: [
        "The croissants just came out. You can smell it.",
        "Sit at the bar. Watch the ritual of morning prep.",
      ],
      default: [
        "The corner table has seen a thousand stories. Add yours.",
        "Order what the regulars order. They know.",
        "The chef's special isn't on the menu. Just ask.",
      ],
    },
    hotel: {
      lateNight: [
        "Your pillow is patient. It's waited all day for you.",
        "The city will be here tomorrow. Rest now.",
      ],
      default: [
        "Ask the concierge what they'd do with a free hour. They know things.",
        "The best travel stories happen between adventures.",
      ],
    },
    scenic: {
      earlyMorning: [
        "The light right now? It won't look like this again today.",
        "You'll have this view almost to yourself. That's rare.",
      ],
      evening: [
        "The sunset paints differently every night. This one's yours.",
        "Stand still. Let the view come to you.",
      ],
      default: [
        "Look where no one's looking. That's where it hides.",
        "The photo won't capture it. Your memory will.",
      ],
    },
    activity: {
      morning: [
        "Arrive when doors open. The energy is different.",
        "Start from the back. Everyone rushes the front.",
      ],
      afternoon: [
        "Move slowly. Speed kills wonder.",
        "Find the quiet corner. Every place has one.",
      ],
      default: [
        "Look up. Most people forget to look up.",
        "The gift shop has stories too. Don't skip it.",
      ],
    },
    free: {
      default: [
        "Wander without a destination. That's when you find things.",
        "Sit somewhere. Watch the locals. Learn their rhythm.",
        "Get lost on purpose. The map can wait.",
      ],
    },
  };

  const typeWhispers = whispersByTypeAndTime[type] || whispersByTypeAndTime.activity;
  const periodWhispers = typeWhispers[period] || typeWhispers.default || [];
  const allWhispers = [...periodWhispers, ...(typeWhispers.default || [])];

  return allWhispers[Math.floor(Math.random() * allWhispers.length)] || "Trust your instincts here.";
};

// ==================== Activity Type Configuration ====================

const getActivityConfig = (activity: TimeSlot, hour: number) => {
  const titleLower = activity.title.toLowerCase();
  const isNightlife = nightlifeKeywords.some(kw => titleLower.includes(kw));

  if (isNightlife) {
    return { icon: Wine, label: 'Nightlife', color: '#A855F7' };
  }

  const configs: Record<string, { icon: typeof MapPin; label: string; color: string }> = {
    restaurant: { icon: Utensils, label: 'Dining', color: hour >= 20 ? '#D4A574' : '#C45830' },
    hotel: { icon: MapPin, label: 'Rest', color: '#6B7280' },
    scenic: { icon: Mountain, label: 'Experience', color: '#059669' },
    activity: { icon: Camera, label: 'Discovery', color: '#3B82F6' },
    free: { icon: Compass, label: 'Explore', color: '#8B5CF6' },
    transit: { icon: Navigation, label: 'Transit', color: '#6B7280' },
  };

  return configs[activity.type] || configs.activity;
};

// ==================== Choice Card Component ====================

interface ChoiceCardProps {
  activity: TimeSlot;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  theme: ReturnType<typeof getTheme>;
  hour: number;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({
  activity,
  index,
  isSelected,
  onSelect,
  theme,
  hour,
}) => {
  const config = getActivityConfig(activity, hour);
  const Icon = config.icon;
  const photoUrl = activity.photo || (activity as unknown as { imageUrl?: string }).imageUrl;

  return (
    <motion.button
      onClick={onSelect}
      className="relative w-full text-left overflow-hidden rounded-2xl"
      style={{
        background: theme.bg.card,
        border: isSelected ? `2px solid ${theme.accent.primary}` : `1px solid ${theme.border.subtle}`,
        boxShadow: isSelected ? `0 8px 32px ${theme.accent.glow}` : theme.shadow,
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{
        y: -6,
        boxShadow: theme.mode === 'dark'
          ? '0 20px 50px rgba(0,0,0,0.6)'
          : '0 16px 40px rgba(0,0,0,0.12)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Photo section */}
      <div className="relative h-36 overflow-hidden">
        {photoUrl ? (
          <motion.img
            src={photoUrl}
            alt={activity.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: theme.mode === 'dark'
                ? `linear-gradient(135deg, #1F1F23 0%, #0A0A0B 100%)`
                : `linear-gradient(135deg, ${theme.accent.primary}22 0%, ${theme.accent.muted}33 100%)`,
            }}
          >
            <Icon size={44} color={theme.accent.primary} strokeWidth={1.2} />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: theme.mode === 'dark'
              ? 'linear-gradient(to top, rgba(10,10,11,0.9) 0%, rgba(10,10,11,0.3) 40%, transparent 70%)'
              : 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, transparent 60%)',
          }}
        />

        {/* Type badge */}
        <motion.div
          className="absolute top-3 left-3 px-3 py-1.5 rounded-full flex items-center gap-2"
          style={{
            background: theme.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${theme.border.subtle}`,
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + index * 0.1 }}
        >
          <Icon size={12} color={config.color} />
          <span
            className="text-xs font-medium tracking-wide"
            style={{
              color: theme.text.primary,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {config.label}
          </span>
        </motion.div>

        {/* Rating */}
        {activity.rating && (
          <motion.div
            className="absolute top-3 right-3 px-2.5 py-1.5 rounded-full flex items-center gap-1.5"
            style={{
              background: theme.mode === 'dark' ? 'rgba(212,165,116,0.2)' : 'rgba(196,88,48,0.1)',
              border: `1px solid ${theme.accent.primary}33`,
            }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Star size={11} fill={theme.accent.primary} color={theme.accent.primary} />
            <span
              className="text-xs font-semibold"
              style={{ color: theme.accent.primary }}
            >
              {activity.rating}
            </span>
          </motion.div>
        )}
      </div>

      {/* Content section */}
      <div className="p-4">
        <h3
          className="text-xl mb-1.5 line-clamp-1"
          style={{
            color: theme.text.primary,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {activity.title}
        </h3>

        {activity.description && (
          <p
            className="text-sm mb-3 line-clamp-2"
            style={{
              color: theme.text.secondary,
              fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.55,
            }}
          >
            {activity.description}
          </p>
        )}

        {/* Location - subtle */}
        {activity.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={11} color={theme.text.muted} />
            <span
              className="text-xs line-clamp-1"
              style={{
                color: theme.text.muted,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {activity.location}
            </span>
          </div>
        )}
      </div>

      {/* Selection glow */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: `2px solid ${theme.accent.primary}`,
            borderRadius: '1rem',
            boxShadow: `inset 0 0 20px ${theme.accent.glow}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.button>
  );
};

// ==================== Experience Mode Component ====================

interface ExperienceModeProps {
  activity: TimeSlot;
  onNavigate: () => void;
  onComplete: () => void;
  onChangeChoice: () => void;
  whisper: string;
  theme: ReturnType<typeof getTheme>;
  hour: number;
}

const ExperienceMode: React.FC<ExperienceModeProps> = ({
  activity,
  onNavigate,
  onComplete,
  onChangeChoice,
  whisper,
  theme,
  hour,
}) => {
  const config = getActivityConfig(activity, hour);
  const Icon = config.icon;
  const photoUrl = activity.photo || (activity as unknown as { imageUrl?: string }).imageUrl;
  const [showTips, setShowTips] = useState(false);

  // Contextual insider tips
  const insiderTips = {
    restaurant: [
      "The table by the window catches the best light",
      "Ask what the chef recommends — it's never on the menu",
      "Linger over coffee. The second hour is better than the first",
    ],
    hotel: [
      "Request a room away from the elevator",
      "The minibar is overpriced. The neighborhood is better",
      "Ask housekeeping for extra pillows. They have the good ones",
    ],
    scenic: [
      "The view changes every 20 minutes. Stay for two",
      "Find where the locals stand. They know the angles",
      "The best photos happen when you put the phone down",
    ],
    activity: [
      "Start from the end and work backwards. Beat the crowds",
      "The audio guide knows stories the plaques don't",
      "Find the guard who's been here longest. They've seen everything",
    ],
    free: [
      "Get lost on purpose. The map will still work later",
      "Sit in one spot for 30 minutes. Watch. Listen",
      "The side streets have the real character",
    ],
  };

  const tips = insiderTips[activity.type as keyof typeof insiderTips] || insiderTips.activity;

  return (
    <motion.div
      className="flex flex-col h-full"
      style={{ background: theme.bg.primary }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero image */}
      <div className="relative h-72 flex-shrink-0 overflow-hidden">
        {photoUrl ? (
          <motion.img
            src={photoUrl}
            alt={activity.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: theme.mode === 'dark'
                ? `linear-gradient(135deg, #1a1a1a 0%, #0a0a0b 100%)`
                : `linear-gradient(135deg, ${theme.accent.primary}15 0%, ${theme.accent.muted}25 100%)`,
            }}
          >
            <Icon size={72} color={theme.accent.primary} strokeWidth={0.8} />
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: theme.mode === 'dark'
              ? `linear-gradient(to top, ${theme.bg.primary} 0%, transparent 50%, rgba(0,0,0,0.4) 100%)`
              : `linear-gradient(to top, ${theme.bg.primary} 0%, transparent 50%, rgba(0,0,0,0.2) 100%)`,
          }}
        />

        {/* Back button - subtle compass */}
        <motion.button
          onClick={onChangeChoice}
          className="absolute top-5 right-5 p-3 rounded-full"
          style={{
            background: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${theme.border.subtle}`,
          }}
          whileHover={{ scale: 1.08, background: theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,1)' }}
          whileTap={{ scale: 0.95 }}
        >
          <Compass size={20} color={theme.text.secondary} />
        </motion.button>

        {/* Type badge */}
        <motion.div
          className="absolute top-5 left-5 px-4 py-2 rounded-full flex items-center gap-2"
          style={{
            background: theme.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${theme.border.medium}`,
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Icon size={14} color={config.color} />
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{
              color: theme.text.primary,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {config.label}
          </span>
        </motion.div>
      </div>

      {/* Content */}
      <div
        className="flex-1 px-6 -mt-6 relative z-10 overflow-y-auto"
        style={{ background: theme.bg.primary }}
      >
        {/* Title card */}
        <motion.div
          className="p-6 rounded-2xl mb-5"
          style={{
            background: theme.bg.card,
            boxShadow: theme.shadow,
            border: `1px solid ${theme.border.subtle}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1
            className="text-3xl mb-3"
            style={{
              color: theme.text.primary,
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            {activity.title}
          </h1>

          {activity.location && (
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={14} color={theme.text.muted} />
              <span
                className="text-sm"
                style={{
                  color: theme.text.secondary,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {activity.location}
              </span>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-5">
            {activity.rating && (
              <div className="flex items-center gap-1.5">
                <Star size={14} fill={theme.accent.primary} color={theme.accent.primary} />
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: theme.text.primary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {activity.rating}
                </span>
              </div>
            )}

            {activity.duration && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} color={theme.text.muted} />
                <span
                  className="text-sm"
                  style={{
                    color: theme.text.secondary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {activity.duration}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Whisper - the intimate suggestion */}
        <motion.div
          className="mb-5 p-5 rounded-2xl relative overflow-hidden"
          style={{
            background: theme.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(212,165,116,0.12) 0%, rgba(212,165,116,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(196,88,48,0.08) 0%, rgba(196,88,48,0.03) 100%)',
            border: `1px solid ${theme.accent.primary}22`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Decorative element */}
          <div
            className="absolute top-0 right-0 w-32 h-32 opacity-10"
            style={{
              background: `radial-gradient(circle, ${theme.accent.primary} 0%, transparent 70%)`,
              transform: 'translate(30%, -30%)',
            }}
          />

          <div className="flex items-start gap-4 relative z-10">
            <motion.div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: theme.gradient,
              }}
              animate={{
                boxShadow: [
                  `0 0 0 0 ${theme.accent.primary}00`,
                  `0 0 0 8px ${theme.accent.primary}15`,
                  `0 0 0 0 ${theme.accent.primary}00`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles size={16} color={theme.mode === 'dark' ? '#0A0A0B' : '#FFFFFF'} />
            </motion.div>
            <p
              className="text-base leading-relaxed"
              style={{
                color: theme.text.primary,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              "{whisper}"
            </p>
          </div>
        </motion.div>

        {/* Insider tips accordion */}
        <motion.button
          onClick={() => setShowTips(!showTips)}
          className="w-full mb-4 p-4 rounded-xl flex items-center justify-between"
          style={{
            background: theme.bg.secondary,
            border: `1px solid ${theme.border.subtle}`,
          }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-3">
            <Heart size={16} color={theme.accent.primary} />
            <span
              className="text-sm font-medium"
              style={{
                color: theme.text.primary,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Insider tips
            </span>
          </div>
          <motion.div
            animate={{ rotate: showTips ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronDown size={18} color={theme.text.muted} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {showTips && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="space-y-2">
                {tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{
                      background: theme.bg.card,
                      border: `1px solid ${theme.border.subtle}`,
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <span
                      className="text-lg"
                      style={{ color: theme.accent.primary }}
                    >
                      •
                    </span>
                    <span
                      className="text-sm leading-relaxed"
                      style={{
                        color: theme.text.primary,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
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

      {/* Action buttons */}
      <div
        className="flex-shrink-0 p-6 space-y-3"
        style={{
          background: theme.bg.elevated,
          borderTop: `1px solid ${theme.border.subtle}`,
        }}
      >
        {/* Primary - Navigate */}
        <motion.button
          onClick={onNavigate}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 relative overflow-hidden"
          style={{
            background: theme.gradient,
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <Navigation size={18} color={theme.mode === 'dark' ? '#0A0A0B' : '#FFFFFF'} />
          <span
            className="text-base font-semibold"
            style={{
              color: theme.mode === 'dark' ? '#0A0A0B' : '#FFFFFF',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Take me there
          </span>
        </motion.button>

        {/* Secondary - Done */}
        <motion.button
          onClick={onComplete}
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2"
          style={{
            background: 'transparent',
            border: `1px solid ${theme.border.medium}`,
          }}
          whileHover={{ background: theme.bg.secondary }}
          whileTap={{ scale: 0.98 }}
        >
          <span
            className="text-sm"
            style={{
              color: theme.text.secondary,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            I'm done here
          </span>
          <ArrowRight size={14} color={theme.text.secondary} />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ==================== Empty State - Nothing Open ====================

interface EmptyStateProps {
  theme: ReturnType<typeof getTheme>;
  timeGreeting: TimeGreeting;
  hour: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({ theme, timeGreeting, hour }) => {
  const isLateNight = hour >= 22 || hour < 6;

  return (
    <motion.div
      className="h-full flex flex-col items-center justify-center p-8 text-center"
      style={{ background: theme.bg.primary }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: theme.gradient,
            boxShadow: `0 12px 40px ${theme.accent.glow}`,
          }}
        >
          {isLateNight ? (
            <Moon size={40} color={theme.mode === 'dark' ? '#0A0A0B' : '#FFFFFF'} />
          ) : (
            <Sparkles size={40} color={theme.mode === 'dark' ? '#0A0A0B' : '#FFFFFF'} />
          )}
        </div>
      </motion.div>

      <motion.h2
        className="text-3xl mb-4"
        style={{
          color: theme.text.primary,
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {isLateNight ? "The city rests" : timeGreeting.headline}
      </motion.h2>

      <motion.p
        className="text-lg max-w-xs leading-relaxed"
        style={{
          color: theme.text.secondary,
          fontFamily: "'DM Sans', sans-serif",
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {isLateNight
          ? "Most places have closed for the night. Tomorrow brings new discoveries."
          : "Nothing quite right for this moment. Check back soon."}
      </motion.p>
    </motion.div>
  );
};

// ==================== Main Component ====================

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
  cityName: _cityName, // Intentionally unused - user knows where they are
  onNavigate,
  onActivityComplete,
}) => {
  // Suppress unused variable warning
  void _cityName;

  const [mode, setMode] = useState<'choice' | 'experience'>('choice');
  const [selectedActivity, setSelectedActivity] = useState<TimeSlot | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [currentWhisper, setCurrentWhisper] = useState('');

  // Current time context
  const currentHour = new Date().getHours();
  const theme = getTheme(currentHour);
  const timeGreeting = getTimeGreeting(currentHour);
  const TimeIcon = timeGreeting.icon;

  // CRITICAL: Filter activities by time appropriateness
  const timeAppropriateActivities = useMemo(() => {
    return activities.filter(a =>
      !completedIds.has(a.id) && isActivityAppropriate(a, currentHour)
    );
  }, [activities, completedIds, currentHour]);

  // Get top 3 for choices
  const choiceActivities = timeAppropriateActivities.slice(0, 3);

  const handleSelect = useCallback((activity: TimeSlot) => {
    setSelectedActivity(activity);
    setCurrentWhisper(generateWhisper(activity, currentHour));
    setMode('experience');
  }, [currentHour]);

  const handleNavigate = useCallback(() => {
    if (selectedActivity) {
      onNavigate(selectedActivity);
    }
  }, [selectedActivity, onNavigate]);

  const handleComplete = useCallback(() => {
    if (selectedActivity) {
      setCompletedIds(prev => new Set([...prev, selectedActivity.id]));
      onActivityComplete(selectedActivity.id);
      setSelectedActivity(null);
      setMode('choice');
    }
  }, [selectedActivity, onActivityComplete]);

  const handleChangeChoice = useCallback(() => {
    setSelectedActivity(null);
    setMode('choice');
  }, []);

  // No time-appropriate activities available
  if (choiceActivities.length === 0) {
    return <EmptyState theme={theme} timeGreeting={timeGreeting} hour={currentHour} />;
  }

  return (
    <div
      className="h-full flex flex-col transition-colors duration-700"
      style={{ background: theme.bg.primary }}
    >
      <AnimatePresence mode="wait">
        {mode === 'choice' ? (
          <motion.div
            key="choice"
            className="flex-1 flex flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header - No city name, just time context */}
            <div className="px-6 pt-8 pb-5">
              {/* Subtle day indicator */}
              <motion.div
                className="flex items-center gap-2 mb-5"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span
                  className="text-xs tracking-[0.2em] uppercase font-medium"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Day {dayNumber} of {totalDays}
                </span>
              </motion.div>

              {/* Time greeting - the hero moment */}
              <motion.div
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: theme.gradient,
                    boxShadow: `0 8px 24px ${theme.accent.glow}`,
                  }}
                  animate={{
                    boxShadow: [
                      `0 8px 24px ${theme.accent.glow}`,
                      `0 12px 32px ${theme.accent.primary}30`,
                      `0 8px 24px ${theme.accent.glow}`,
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <TimeIcon size={24} color={theme.mode === 'dark' ? '#0A0A0B' : '#FFFFFF'} />
                </motion.div>
                <div className="pt-1">
                  <h1
                    className="text-2xl mb-1"
                    style={{
                      color: theme.text.primary,
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {timeGreeting.headline}
                  </h1>
                  <p
                    className="text-sm"
                    style={{
                      color: theme.text.secondary,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {timeGreeting.subtext}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Choices prompt */}
            <motion.div
              className="px-6 mb-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div
                className="p-4 rounded-xl"
                style={{
                  background: theme.mode === 'dark'
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${theme.border.subtle}`,
                }}
              >
                <p
                  className="text-sm"
                  style={{
                    color: theme.text.primary,
                    fontFamily: "'DM Sans', sans-serif",
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>What calls to you?</span>
                  {' '}Three perfect choices for right now.
                </p>
              </div>
            </motion.div>

            {/* Choice cards */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <div className="space-y-4">
                {choiceActivities.map((activity, index) => (
                  <ChoiceCard
                    key={activity.id}
                    activity={activity}
                    index={index}
                    isSelected={selectedActivity?.id === activity.id}
                    onSelect={() => handleSelect(activity)}
                    theme={theme}
                    hour={currentHour}
                  />
                ))}
              </div>

              {/* More coming hint */}
              {timeAppropriateActivities.length > 3 && (
                <motion.p
                  className="text-center mt-5 text-sm"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  +{timeAppropriateActivities.length - 3} more waiting
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
                onNavigate={handleNavigate}
                onComplete={handleComplete}
                onChangeChoice={handleChangeChoice}
                whisper={currentWhisper}
                theme={theme}
                hour={currentHour}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PocketLocal;
