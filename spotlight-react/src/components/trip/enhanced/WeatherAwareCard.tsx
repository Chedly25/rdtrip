/**
 * WeatherAwareCard - Atmospheric Weather Adaptation
 *
 * When weather changes threaten outdoor activities, this component
 * transforms the experience into an opportunity for cozy discovery.
 *
 * Design Direction: "Storm Shelter Elegance"
 * - Animated weather effects (rain, mist, clouds)
 * - Glass morphism cards floating on atmospheric backdrop
 * - Warm, inviting alternatives that feel like hidden discoveries
 * - Typography: Playfair Display headers, refined body text
 * - Motion: Gentle rain, floating clouds, cozy transitions
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain,
  Cloud,
  CloudSnow,
  Wind,
  Umbrella,
  Coffee,
  Building2,
  ChevronRight,
  X,
  Sparkles,
  MapPin,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useTimeTheme } from '../hooks/useTimeOfDay';
import type { WeatherAlternative } from '../services/tripCompanion';

// Weather condition types
type WeatherCondition = 'rain' | 'heavy_rain' | 'snow' | 'wind' | 'storm' | 'cloudy';

interface WeatherAwareCardProps {
  condition: WeatherCondition;
  originalActivity: {
    id: string;
    name: string;
    type: string;
  };
  alternatives: WeatherAlternative[];
  onSelectAlternative: (alternative: WeatherAlternative) => void;
  onDismiss: () => void;
  onKeepOriginal?: () => void;
}

// Weather configuration with atmospheric details
const weatherConfig: Record<WeatherCondition, {
  icon: typeof CloudRain;
  title: string;
  subtitle: string;
  color: string;
  particleCount: number;
  particleType: 'rain' | 'snow' | 'mist';
}> = {
  rain: {
    icon: CloudRain,
    title: 'Gentle Rain',
    subtitle: 'Perfect weather for indoor discoveries',
    color: '#5B9BD5',
    particleCount: 40,
    particleType: 'rain',
  },
  heavy_rain: {
    icon: CloudRain,
    title: 'Heavy Rain',
    subtitle: 'Time to find a cozy shelter',
    color: '#4A7AAD',
    particleCount: 80,
    particleType: 'rain',
  },
  snow: {
    icon: CloudSnow,
    title: 'Snowfall',
    subtitle: 'Warm up with something special',
    color: '#8BA5B5',
    particleCount: 50,
    particleType: 'snow',
  },
  wind: {
    icon: Wind,
    title: 'Strong Winds',
    subtitle: 'Seek shelter from the gusts',
    color: '#7A9AA8',
    particleCount: 20,
    particleType: 'mist',
  },
  storm: {
    icon: CloudRain,
    title: 'Storm Approaching',
    subtitle: 'Find refuge and enjoy the atmosphere',
    color: '#6D6875',
    particleCount: 100,
    particleType: 'rain',
  },
  cloudy: {
    icon: Cloud,
    title: 'Overcast Skies',
    subtitle: 'Indoor activities might be nicer',
    color: '#9D8189',
    particleCount: 15,
    particleType: 'mist',
  },
};

// Rain/Snow Particle Effect
const WeatherParticles: React.FC<{
  type: 'rain' | 'snow' | 'mist';
  count: number;
  color: string;
}> = ({ type, count, color }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = type === 'snow' ? 3 + Math.random() * 2 : 0.8 + Math.random() * 0.4;
        const size = type === 'snow' ? 4 + Math.random() * 4 : type === 'mist' ? 2 : 1;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              top: -10,
              width: type === 'rain' ? 2 : size,
              height: type === 'rain' ? 12 + Math.random() * 8 : size,
              background: type === 'mist'
                ? `radial-gradient(circle, ${color}40 0%, transparent 70%)`
                : `linear-gradient(to bottom, transparent, ${color}60)`,
              filter: type === 'snow' ? 'blur(0.5px)' : 'none',
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: type === 'snow' ? [0, Math.random() * 30 - 15] : 0,
              opacity: type === 'mist' ? [0, 0.6, 0] : [0.3, 0.7, 0.3],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: type === 'snow' ? 'easeInOut' : 'linear',
            }}
          />
        );
      })}
    </div>
  );
};

// Floating Cloud Effect
const FloatingClouds: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: 20 + i * 30,
            left: -100,
            width: 150 + i * 50,
            height: 40 + i * 20,
            background: `radial-gradient(ellipse at center, ${color}25 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(10px)',
          }}
          animate={{
            x: ['0%', '150%'],
          }}
          transition={{
            duration: 15 + i * 5,
            delay: i * 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

// Alternative Card
const AlternativeCard: React.FC<{
  alternative: WeatherAlternative;
  index: number;
  onSelect: () => void;
  theme: any;
  isNight: boolean;
}> = ({ alternative, index, onSelect, theme, isNight }) => {
  const getTypeIcon = (type: string) => {
    const typeMap: Record<string, typeof Coffee> = {
      cafe: Coffee,
      museum: Building2,
      restaurant: Coffee,
      gallery: Building2,
      shopping: Building2,
      indoor: Building2,
    };
    return typeMap[type.toLowerCase()] || Building2;
  };

  const TypeIcon = getTypeIcon(alternative.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        delay: 0.2 + index * 0.1,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{
        background: isNight
          ? 'linear-gradient(135deg, rgba(42, 36, 56, 0.95) 0%, rgba(60, 50, 80, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 250, 245, 0.9) 100%)',
        border: `1px solid ${isNight ? 'rgba(139, 126, 200, 0.3)' : 'rgba(212, 168, 83, 0.3)'}`,
        boxShadow: isNight
          ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 8px 32px rgba(212, 168, 83, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.primary}15 0%, transparent 70%)`,
        }}
      />

      <div className="relative p-4 flex items-start gap-4">
        {/* Photo or Icon */}
        {alternative.photo ? (
          <div
            className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <img
              src={alternative.photo}
              alt={alternative.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}20 0%, ${theme.secondary}20 100%)`,
              border: `1px solid ${theme.primary}30`,
            }}
          >
            <TypeIcon className="w-7 h-7" style={{ color: theme.primary }} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className="font-semibold text-base truncate mb-1"
            style={{
              color: theme.textPrimary,
              fontFamily: '"Playfair Display", Georgia, serif',
            }}
          >
            {alternative.name}
          </h4>

          {/* Rating */}
          {alternative.rating && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3.5 h-3.5 fill-current" style={{ color: '#D4A853' }} />
              <span className="text-xs font-medium" style={{ color: '#D4A853' }}>
                {alternative.rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Reason */}
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: theme.textSecondary }}
          >
            {alternative.reason}
          </p>

          {/* Address */}
          {alternative.address && (
            <div className="flex items-center gap-1 mt-2">
              <MapPin className="w-3 h-3" style={{ color: theme.textMuted }} />
              <span
                className="text-xs truncate"
                style={{ color: theme.textMuted }}
              >
                {alternative.address}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <motion.div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: `${theme.primary}15`,
          }}
          whileHover={{ scale: 1.1 }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: theme.primary }} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export const WeatherAwareCard: React.FC<WeatherAwareCardProps> = ({
  condition,
  originalActivity,
  alternatives,
  onSelectAlternative,
  onDismiss,
  onKeepOriginal,
}) => {
  const { theme, isNight } = useTimeTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  const config = weatherConfig[condition] || weatherConfig.rain;
  const WeatherIcon = config.icon;

  const handleDismiss = useCallback(() => {
    setIsExpanded(false);
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-4 mb-6 overflow-hidden rounded-3xl relative"
          style={{
            background: isNight
              ? 'linear-gradient(180deg, rgba(30, 25, 45, 0.98) 0%, rgba(40, 35, 55, 0.95) 100%)'
              : 'linear-gradient(180deg, rgba(240, 245, 250, 0.98) 0%, rgba(255, 252, 248, 0.95) 100%)',
            border: `1px solid ${config.color}30`,
            boxShadow: `0 12px 48px ${config.color}25, inset 0 1px 0 ${isNight ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}`,
          }}
        >
          {/* Weather Effects */}
          <WeatherParticles
            type={config.particleType}
            count={config.particleCount}
            color={config.color}
          />
          <FloatingClouds color={config.color} />

          {/* Content */}
          <div className="relative z-10 p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Weather Icon with Glow */}
                <motion.div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: `linear-gradient(135deg, ${config.color}30 0%, ${config.color}10 100%)`,
                    boxShadow: `0 0 20px ${config.color}30`,
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      `0 0 20px ${config.color}30`,
                      `0 0 30px ${config.color}50`,
                      `0 0 20px ${config.color}30`,
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <WeatherIcon
                    className="w-6 h-6"
                    style={{ color: config.color }}
                  />
                </motion.div>

                <div>
                  <h3
                    className="text-lg font-bold"
                    style={{
                      color: theme.textPrimary,
                      fontFamily: '"Playfair Display", Georgia, serif',
                    }}
                  >
                    {config.title}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {config.subtitle}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `${theme.textMuted}15`,
                }}
              >
                <X className="w-4 h-4" style={{ color: theme.textMuted }} />
              </motion.button>
            </div>

            {/* Original Activity Notice */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 p-3 rounded-xl flex items-center gap-3"
              style={{
                background: isNight
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)',
                border: `1px dashed ${theme.textMuted}30`,
              }}
            >
              <Umbrella className="w-5 h-5" style={{ color: config.color }} />
              <div className="flex-1">
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  Instead of outdoor
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  {originalActivity.name}
                </p>
              </div>
              {onKeepOriginal && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onKeepOriginal}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    color: config.color,
                    background: `${config.color}15`,
                    border: `1px solid ${config.color}30`,
                  }}
                >
                  Keep anyway
                </motion.button>
              )}
            </motion.div>

            {/* Alternatives Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: theme.primary }} />
                <h4
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: theme.textMuted }}
                >
                  Cozy Alternatives
                </h4>
              </div>

              {/* Alternatives List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {alternatives.slice(0, 3).map((alt, index) => (
                    <AlternativeCard
                      key={alt.id}
                      alternative={alt}
                      index={index}
                      onSelect={() => onSelectAlternative(alt)}
                      theme={theme}
                      isNight={isNight}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* See More Button */}
            {alternatives.length > 3 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full py-3 flex items-center justify-center gap-2 rounded-xl"
                style={{
                  background: `${theme.primary}10`,
                  color: theme.primary,
                }}
                whileHover={{ background: `${theme.primary}20` }}
              >
                <span className="text-sm font-medium">
                  +{alternatives.length - 3} more alternatives
                </span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WeatherAwareCard;
