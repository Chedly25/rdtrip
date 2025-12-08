/**
 * WeatherBanner Component
 *
 * WI-7.10: Compact weather display for active companion
 *
 * Design Philosophy:
 * - GLANCEABLE - essential info at a glance
 * - CONTEXTUAL - shows weather-appropriate tips
 * - ELEGANT - glass morphism, subtle animations
 * - NON-INTRUSIVE - small footprint, expandable
 *
 * Features:
 * - Current temperature and condition
 * - Condition icon with subtle animation
 * - Rain prediction warning
 * - Expandable for more details
 * - Weather-appropriate activity tip
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sunrise,
  Sunset,
} from 'lucide-react';
import type { WeatherContext } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface WeatherBannerProps {
  /** Weather data */
  weather: WeatherContext | null;
  /** Hours until rain (null if no rain) */
  hoursUntilRain?: number | null;
  /** Weather-based activity suggestion */
  suggestion?: string;
  /** Whether night mode is active */
  isNightMode?: boolean;
  /** Weather greeting text */
  greeting?: string;
  /** Whether to show expanded view initially */
  initialExpanded?: boolean;
  /** Called when expand state changes */
  onExpandChange?: (expanded: boolean) => void;
}

// ============================================================================
// Weather Icons
// ============================================================================

const WEATHER_ICONS: Record<WeatherContext['condition'], typeof Sun> = {
  sunny: Sun,
  partly_cloudy: Cloud,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  snowy: CloudSnow,
  foggy: CloudFog,
  windy: Wind,
};

function getWeatherIcon(condition: WeatherContext['condition'], isDaylight: boolean) {
  if (condition === 'sunny' && !isDaylight) {
    return Moon;
  }
  return WEATHER_ICONS[condition] || Cloud;
}

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      bg: 'rgba(24, 24, 27, 0.85)',
      border: 'rgba(255, 255, 255, 0.08)',
      text: {
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        muted: '#71717A',
      },
      accent: {
        temp: '#F59E0B',    // Amber for temperature
        rain: '#3B82F6',    // Blue for rain
        warning: '#EF4444', // Red for warnings
      },
      iconBg: 'rgba(255, 255, 255, 0.08)',
    };
  }

  return {
    bg: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(0, 0, 0, 0.06)',
    text: {
      primary: '#18181B',
      secondary: '#52525B',
      muted: '#A1A1AA',
    },
    accent: {
      temp: '#F59E0B',
      rain: '#3B82F6',
      warning: '#EF4444',
    },
    iconBg: 'rgba(0, 0, 0, 0.05)',
  };
};

// ============================================================================
// Weather Icon Animation
// ============================================================================

function WeatherIconAnimated({
  condition,
  isDaylight,
  size = 24,
  color,
}: {
  condition: WeatherContext['condition'];
  isDaylight: boolean;
  size?: number;
  color: string;
}) {
  const Icon = getWeatherIcon(condition, isDaylight);

  // Get animation props based on condition
  const getAnimationProps = () => {
    switch (condition) {
      case 'sunny':
        return {
          animate: { rotate: 360 },
          transition: { duration: 20, repeat: Infinity, ease: 'linear' as const },
        };
      case 'rainy':
        return {
          animate: { y: [0, 2, 0] },
          transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'stormy':
        return {
          animate: { scale: [1, 1.1, 1] },
          transition: { duration: 0.5, repeat: Infinity },
        };
      case 'snowy':
        return {
          animate: { y: [0, -2, 0] },
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'windy':
        return {
          animate: { x: [-2, 2, -2] },
          transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' as const },
        };
      default:
        return {};
    }
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div {...animationProps}>
      <Icon size={size} color={color} />
    </motion.div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function WeatherBanner({
  weather,
  hoursUntilRain,
  suggestion,
  isNightMode = false,
  greeting,
  initialExpanded = false,
  onExpandChange,
}: WeatherBannerProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const theme = getTheme(isNightMode);

  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  // Format temperature
  const tempDisplay = useMemo(() => {
    if (!weather) return '--';
    return `${Math.round(weather.temperatureCelsius)}°`;
  }, [weather]);

  // Format feels like
  const feelsLikeDisplay = useMemo(() => {
    if (!weather) return null;
    const diff = Math.abs(weather.temperatureCelsius - weather.feelsLikeCelsius);
    if (diff < 2) return null;
    return `Feels like ${Math.round(weather.feelsLikeCelsius)}°`;
  }, [weather]);

  // Rain warning
  const rainWarning = useMemo(() => {
    if (hoursUntilRain === null || hoursUntilRain === undefined) return null;
    if (hoursUntilRain < 1) return 'Rain very soon';
    if (hoursUntilRain < 2) return `Rain in ~${Math.round(hoursUntilRain * 60)} min`;
    return `Rain in ~${Math.round(hoursUntilRain)} hrs`;
  }, [hoursUntilRain]);

  // No weather data state
  if (!weather) {
    return (
      <div
        className="rounded-xl px-4 py-3"
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: theme.iconBg }}
          >
            <Cloud size={20} color={theme.text.muted} />
          </div>
          <span
            className="text-sm"
            style={{
              color: theme.text.secondary,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Weather loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      layout
    >
      {/* Compact View */}
      <div
        className="px-4 py-3 cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left: Icon + Temp + Condition */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: theme.iconBg }}
            >
              <WeatherIconAnimated
                condition={weather.condition}
                isDaylight={weather.isDaylight}
                size={22}
                color={theme.accent.temp}
              />
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-2xl font-semibold"
                  style={{
                    color: theme.text.primary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {tempDisplay}
                </span>
                <span
                  className="text-sm capitalize"
                  style={{
                    color: theme.text.secondary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {weather.description}
                </span>
              </div>

              {/* Feels like or rain warning */}
              {rainWarning ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Droplets size={12} color={theme.accent.rain} />
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: theme.accent.rain,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {rainWarning}
                  </span>
                </div>
              ) : feelsLikeDisplay ? (
                <span
                  className="text-xs"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {feelsLikeDisplay}
                </span>
              ) : null}
            </div>
          </div>

          {/* Right: Expand toggle */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <ChevronUp size={20} color={theme.text.muted} />
            ) : (
              <ChevronDown size={20} color={theme.text.muted} />
            )}
          </motion.div>
        </div>

        {/* Greeting or suggestion (compact view) */}
        {!isExpanded && (greeting || suggestion) && (
          <div className="mt-2">
            <p
              className="text-sm"
              style={{
                color: theme.text.secondary,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {greeting || suggestion}
            </p>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-2 border-t"
              style={{ borderColor: theme.border }}
            >
              {/* Weather details grid */}
              <div className="grid grid-cols-3 gap-4 mb-3">
                {/* Humidity */}
                <div className="flex items-center gap-2">
                  <Droplets size={16} color={theme.accent.rain} />
                  <div>
                    <p
                      className="text-xs"
                      style={{
                        color: theme.text.muted,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Humidity
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: theme.text.primary,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {weather.humidity}%
                    </p>
                  </div>
                </div>

                {/* Wind */}
                <div className="flex items-center gap-2">
                  <Wind size={16} color={theme.text.secondary} />
                  <div>
                    <p
                      className="text-xs"
                      style={{
                        color: theme.text.muted,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Wind
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: theme.text.primary,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {Math.round(weather.windSpeedKmh)} km/h
                    </p>
                  </div>
                </div>

                {/* UV Index */}
                <div className="flex items-center gap-2">
                  <Thermometer size={16} color={theme.accent.temp} />
                  <div>
                    <p
                      className="text-xs"
                      style={{
                        color: theme.text.muted,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      UV Index
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: theme.text.primary,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {weather.uvIndex}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sunrise/Sunset */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Sunrise size={14} color={theme.accent.temp} />
                  <span
                    className="text-xs"
                    style={{
                      color: theme.text.secondary,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {weather.sunrise instanceof Date
                      ? weather.sunrise.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Sunset size={14} color={theme.accent.temp} />
                  <span
                    className="text-xs"
                    style={{
                      color: theme.text.secondary,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {weather.sunset instanceof Date
                      ? weather.sunset.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                  </span>
                </div>
              </div>

              {/* Precipitation warning */}
              {weather.precipitationChance > 30 && (
                <div
                  className="flex items-center gap-2 p-2 rounded-lg mb-3"
                  style={{
                    background: `${theme.accent.rain}15`,
                  }}
                >
                  <AlertTriangle size={14} color={theme.accent.rain} />
                  <span
                    className="text-xs"
                    style={{
                      color: theme.accent.rain,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {weather.precipitationChance}% chance of rain
                  </span>
                </div>
              )}

              {/* Activity suggestion */}
              {suggestion && (
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: theme.iconBg,
                  }}
                >
                  <p
                    className="text-sm"
                    style={{
                      color: theme.text.secondary,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {suggestion}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default WeatherBanner;
