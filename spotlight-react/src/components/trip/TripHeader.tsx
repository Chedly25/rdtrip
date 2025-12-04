/**
 * Trip Header - Your Journey at a Glance
 *
 * A compact header showing trip progress, current city, weather, and day status.
 * Designed to be ever-present during Trip Mode, providing instant context.
 *
 * Features:
 * - Day X of Y progress indicator
 * - Current city with animated location dot
 * - Weather conditions (temp + icon)
 * - Trip progress bar (journey completion)
 * - Time-of-day aware color adaptation
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sunrise,
  Sunset,
  Wind,
  Navigation,
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

// Time-of-day configurations
const timeOfDayConfig = {
  dawn: {
    primary: '#FFB4A2',
    secondary: '#FFCDB2',
    icon: Sunrise,
    label: 'Dawn',
  },
  morning: {
    primary: '#87CEEB',
    secondary: '#B4E4FF',
    icon: Sun,
    label: 'Morning',
  },
  afternoon: {
    primary: '#D4A853',
    secondary: '#E4BE73',
    icon: CloudSun,
    label: 'Afternoon',
  },
  evening: {
    primary: '#E07B39',
    secondary: '#F4A261',
    icon: Sunset,
    label: 'Evening',
  },
  night: {
    primary: '#6D6875',
    secondary: '#9D8189',
    icon: Moon,
    label: 'Night',
  },
};

// Weather icon mapping
const weatherIcons: Record<string, React.ElementType> = {
  sunny: Sun,
  clear: Sun,
  cloudy: Cloud,
  'partly-cloudy': CloudSun,
  rain: CloudRain,
  rainy: CloudRain,
  snow: CloudSnow,
  snowy: CloudSnow,
  windy: Wind,
  default: CloudSun,
};

// Get time of day
const getTimeOfDay = (hour: number): keyof typeof timeOfDayConfig => {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

interface TripHeaderProps {
  currentDay: number;
  totalDays: number;
  cityName: string;
  weather?: {
    temp: number;
    condition: string;
    high?: number;
    low?: number;
  };
  onCityClick?: () => void;
  onWeatherClick?: () => void;
  className?: string;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  currentDay,
  totalDays,
  cityName,
  weather,
  onCityClick,
  onWeatherClick,
  className = '',
}) => {
  const currentHour = new Date().getHours();
  const timeOfDay = getTimeOfDay(currentHour);
  const todConfig = timeOfDayConfig[timeOfDay];
  const TimeIcon = todConfig.icon;

  // Progress percentage
  const progress = useMemo(() => {
    return totalDays > 0 ? (currentDay / totalDays) * 100 : 0;
  }, [currentDay, totalDays]);

  // Weather icon
  const WeatherIcon = weather
    ? weatherIcons[weather.condition.toLowerCase()] || weatherIcons.default
    : weatherIcons.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/95 backdrop-blur-md ${className}`}
      style={{
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
      }}
    >
      <div className="px-4 py-3">
        {/* Top row: Day indicator + Weather */}
        <div className="flex items-center justify-between mb-3">
          {/* Day badge with time icon */}
          <div className="flex items-center gap-3">
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${todConfig.primary} 0%, ${todConfig.secondary} 100%)`,
                boxShadow: `0 2px 10px ${todConfig.primary}30`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              <TimeIcon className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">
                Day {currentDay}
              </span>
            </motion.div>
            <span className="text-sm" style={{ color: colors.lightBrown }}>
              of {totalDays}
            </span>
          </div>

          {/* Weather widget */}
          {weather && (
            <motion.button
              onClick={onWeatherClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`,
              }}
              whileHover={{ scale: 1.02, background: colors.cream }}
              whileTap={{ scale: 0.98 }}
            >
              <WeatherIcon
                className="w-4 h-4"
                style={{ color: todConfig.primary }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: colors.darkBrown }}
              >
                {weather.temp}°
              </span>
              {weather.high && weather.low && (
                <span className="text-xs" style={{ color: colors.lightBrown }}>
                  H:{weather.high}° L:{weather.low}°
                </span>
              )}
            </motion.button>
          )}
        </div>

        {/* City name with location indicator */}
        <motion.button
          onClick={onCityClick}
          className="flex items-center gap-2 mb-3 w-full text-left"
          whileHover={{ x: 2 }}
        >
          {/* Animated location dot */}
          <div className="relative">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ background: colors.terracotta }}
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: [
                  `0 0 0 0 ${colors.terracotta}40`,
                  `0 0 0 6px ${colors.terracotta}00`,
                  `0 0 0 0 ${colors.terracotta}40`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <h1
            className="text-xl font-serif font-medium truncate"
            style={{ color: colors.darkBrown }}
          >
            {cityName}
          </h1>
          <Navigation
            className="w-4 h-4 flex-shrink-0"
            style={{ color: colors.lightBrown }}
          />
        </motion.button>

        {/* Trip progress bar */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: colors.lightBrown }}
            >
              Trip Progress
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: todConfig.primary }}
            >
              {Math.round(progress)}%
            </span>
          </div>

          {/* Progress bar track */}
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: colors.border }}
          >
            {/* Progress fill */}
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          {/* Day markers */}
          <div className="absolute top-6 left-0 right-0 flex justify-between px-px">
            {Array.from({ length: totalDays }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center"
                style={{ width: `${100 / totalDays}%` }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1"
                  style={{
                    background: i < currentDay ? colors.sage : colors.border,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Compact version for mobile/overlay use
export const TripHeaderCompact: React.FC<TripHeaderProps> = ({
  currentDay,
  totalDays: _totalDays,
  cityName,
  weather,
}) => {
  void _totalDays; // Reserved for future progress indicator
  const currentHour = new Date().getHours();
  const timeOfDay = getTimeOfDay(currentHour);
  const todConfig = timeOfDayConfig[timeOfDay];

  const WeatherIcon = weather
    ? weatherIcons[weather.condition.toLowerCase()] || weatherIcons.default
    : weatherIcons.default;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between px-4 py-2"
      style={{
        background: `linear-gradient(135deg, ${todConfig.primary}15 0%, ${todConfig.secondary}10 100%)`,
        borderRadius: '12px',
      }}
    >
      {/* Left: Day + City */}
      <div className="flex items-center gap-2">
        <div
          className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
          style={{ background: todConfig.primary }}
        >
          Day {currentDay}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" style={{ color: colors.terracotta }} />
          <span
            className="text-sm font-medium truncate max-w-[120px]"
            style={{ color: colors.darkBrown }}
          >
            {cityName}
          </span>
        </div>
      </div>

      {/* Right: Weather */}
      {weather && (
        <div className="flex items-center gap-1.5">
          <WeatherIcon className="w-4 h-4" style={{ color: todConfig.primary }} />
          <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
            {weather.temp}°
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default TripHeader;
