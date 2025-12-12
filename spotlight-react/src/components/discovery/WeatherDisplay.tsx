/**
 * WeatherDisplay
 *
 * Shows weather forecast and activity recommendations.
 * Atmospheric design with gradients that reflect weather conditions.
 *
 * Design Philosophy:
 * - Visual atmosphere that mirrors the weather
 * - Temperature feels tangible through color
 * - Recommendations are actionable, not just decorative
 * - Golden hour gets special treatment (for photographers)
 * - Risk assessment is clear but not alarming
 */

import { motion } from 'framer-motion';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Sunrise,
  Camera,
  Umbrella,
  ShieldAlert,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { WeatherOutput } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface WeatherDisplayProps {
  weather: WeatherOutput;
  /** Compact mode for card embedding */
  compact?: boolean;
  /** Animation delay */
  delay?: number;
}

// =============================================================================
// Configuration
// =============================================================================

interface WeatherConditionConfig {
  icon: React.ElementType;
  gradient: string;
  textColor: string;
  bgPattern: string;
}

const CONDITION_CONFIG: Record<string, WeatherConditionConfig> = {
  sunny: {
    icon: Sun,
    gradient: 'from-amber-400 via-orange-300 to-yellow-200',
    textColor: 'text-amber-800',
    bgPattern: 'radial-gradient(circle at 30% 20%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)',
  },
  clear: {
    icon: Sun,
    gradient: 'from-sky-400 via-blue-300 to-cyan-200',
    textColor: 'text-sky-800',
    bgPattern: 'radial-gradient(circle at 70% 30%, rgba(56, 189, 248, 0.12) 0%, transparent 50%)',
  },
  cloudy: {
    icon: Cloud,
    gradient: 'from-slate-400 via-gray-300 to-slate-200',
    textColor: 'text-slate-700',
    bgPattern: 'linear-gradient(180deg, rgba(148, 163, 184, 0.08) 0%, transparent 100%)',
  },
  partly_cloudy: {
    icon: Cloud,
    gradient: 'from-sky-400 via-slate-300 to-blue-200',
    textColor: 'text-sky-800',
    bgPattern: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(148, 163, 184, 0.08) 100%)',
  },
  rain: {
    icon: CloudRain,
    gradient: 'from-slate-500 via-blue-400 to-slate-300',
    textColor: 'text-slate-800',
    bgPattern: 'linear-gradient(180deg, rgba(71, 85, 105, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
  },
  light_rain: {
    icon: Droplets,
    gradient: 'from-blue-400 via-slate-300 to-blue-200',
    textColor: 'text-blue-800',
    bgPattern: 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)',
  },
  snow: {
    icon: CloudSnow,
    gradient: 'from-blue-200 via-slate-100 to-white',
    textColor: 'text-blue-900',
    bgPattern: 'radial-gradient(circle at 50% 0%, rgba(191, 219, 254, 0.2) 0%, transparent 70%)',
  },
  wind: {
    icon: Wind,
    gradient: 'from-teal-400 via-cyan-300 to-emerald-200',
    textColor: 'text-teal-800',
    bgPattern: 'linear-gradient(45deg, rgba(20, 184, 166, 0.08) 0%, transparent 100%)',
  },
  default: {
    icon: Cloud,
    gradient: 'from-sky-400 via-blue-300 to-indigo-200',
    textColor: 'text-sky-800',
    bgPattern: 'linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, transparent 100%)',
  },
};

function getConditionConfig(conditions: string): WeatherConditionConfig {
  const normalized = (conditions || '').toLowerCase().replace(/[^a-z_]/g, '_');

  // Match condition patterns
  if (normalized.includes('sun') || normalized.includes('clear')) return CONDITION_CONFIG.sunny;
  if (normalized.includes('rain') && normalized.includes('light')) return CONDITION_CONFIG.light_rain;
  if (normalized.includes('rain') || normalized.includes('shower')) return CONDITION_CONFIG.rain;
  if (normalized.includes('snow')) return CONDITION_CONFIG.snow;
  if (normalized.includes('cloud') && normalized.includes('part')) return CONDITION_CONFIG.partly_cloudy;
  if (normalized.includes('cloud') || normalized.includes('overcast')) return CONDITION_CONFIG.cloudy;
  if (normalized.includes('wind')) return CONDITION_CONFIG.wind;

  return CONDITION_CONFIG.default;
}

// =============================================================================
// Main Component
// =============================================================================

export function WeatherDisplay({
  weather,
  compact = false,
  delay = 0,
}: WeatherDisplayProps) {
  const config = getConditionConfig(weather.conditions || '');
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-4"
    >
      {/* Main weather card with atmospheric background */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay + 0.1 }}
        className={`
          relative overflow-hidden rounded-2xl
          bg-gradient-to-br ${config.gradient}
          ${compact ? 'p-4' : 'p-5'}
        `}
        style={{ backgroundImage: config.bgPattern }}
      >
        {/* Decorative sun rays / clouds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {config.icon === Sun && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-16 -right-16 w-40 h-40"
            >
              <div className="w-full h-full bg-white/10 rounded-full blur-xl" />
            </motion.div>
          )}
        </div>

        <div className="relative flex items-start justify-between">
          {/* Weather icon and conditions */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: delay + 0.2, type: 'spring' }}
              className={`
                ${compact ? 'w-12 h-12' : 'w-16 h-16'}
                rounded-2xl bg-white/30 backdrop-blur-sm
                flex items-center justify-center
                shadow-lg shadow-black/5
              `}
            >
              <Icon className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} text-white drop-shadow`} />
            </motion.div>

            <div>
              <p
                className={`
                  font-display font-semibold text-white drop-shadow-sm
                  ${compact ? 'text-base' : 'text-lg'}
                `}
              >
                {weather.conditions || 'Weather'}
              </p>
              <p className="text-white/80 text-sm">
                {weather.forecast}
              </p>
            </div>
          </div>

          {/* Temperature */}
          {weather.temperature && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: delay + 0.3 }}
              className="text-right"
            >
              <div className="flex items-start gap-1">
                <span
                  className={`
                    font-display font-bold text-white drop-shadow
                    ${compact ? 'text-3xl' : 'text-4xl'}
                  `}
                >
                  {weather.temperature.high}
                </span>
                <span className="text-white/80 text-lg mt-1">°C</span>
              </div>
              <p className="text-white/70 text-xs">
                Low: {weather.temperature.low}°C
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Recommendations section */}
      {weather.recommendations && (
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
          {/* Outdoor safe times */}
          {weather.recommendations.outdoorSafe?.length > 0 && (
            <RecommendationCard
              icon={CheckCircle}
              title="Best for Outdoors"
              color="emerald"
              delay={delay + 0.3}
              compact={compact}
            >
              <div className="flex flex-wrap gap-1.5">
                {weather.recommendations.outdoorSafe.map((time, idx) => (
                  <span
                    key={idx}
                    className={`
                      inline-flex items-center gap-1
                      ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}
                      rounded-full font-medium
                      bg-emerald-100 text-emerald-700
                    `}
                  >
                    <Clock className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                    {time}
                  </span>
                ))}
              </div>
            </RecommendationCard>
          )}

          {/* Backup plan */}
          {weather.recommendations.backup && (
            <RecommendationCard
              icon={Umbrella}
              title="Backup Plan"
              color="amber"
              delay={delay + 0.35}
              compact={compact}
            >
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>
                {weather.recommendations.backup}
              </p>
            </RecommendationCard>
          )}

          {/* Golden hour */}
          {weather.recommendations.goldenHour && (
            <RecommendationCard
              icon={Camera}
              title="Golden Hour"
              color="orange"
              delay={delay + 0.4}
              compact={compact}
            >
              <div className="flex items-center gap-2">
                <Sunrise className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-orange-500`} />
                <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-orange-700`}>
                  {weather.recommendations.goldenHour}
                </span>
              </div>
            </RecommendationCard>
          )}
        </div>
      )}

      {/* Risk assessment */}
      {weather.riskAssessment && (
        <RiskBadge risk={weather.riskAssessment} delay={delay + 0.45} compact={compact} />
      )}
    </motion.div>
  );
}

// =============================================================================
// Recommendation Card
// =============================================================================

interface RecommendationCardProps {
  icon: React.ElementType;
  title: string;
  color: 'emerald' | 'amber' | 'orange' | 'blue';
  delay: number;
  compact: boolean;
  children: React.ReactNode;
}

const REC_COLOR_CONFIG = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconColor: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconColor: 'text-amber-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    iconColor: 'text-orange-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconColor: 'text-blue-600',
  },
};

function RecommendationCard({
  icon: Icon,
  title,
  color,
  delay,
  compact,
  children,
}: RecommendationCardProps) {
  const colorConfig = REC_COLOR_CONFIG[color];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        rounded-xl border
        ${colorConfig.bg} ${colorConfig.border}
        ${compact ? 'p-2.5' : 'p-3'}
      `}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${colorConfig.iconColor}`} />
        <span className={`font-semibold ${colorConfig.iconColor} ${compact ? 'text-xs' : 'text-sm'}`}>
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  );
}

// =============================================================================
// Risk Badge
// =============================================================================

interface RiskBadgeProps {
  risk: string;
  delay: number;
  compact: boolean;
}

function RiskBadge({ risk, delay, compact }: RiskBadgeProps) {
  const isHigh = risk.toLowerCase().includes('high');
  const isModerate = risk.toLowerCase().includes('moderate');

  let config = {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: CheckCircle,
    label: 'Low Risk',
  };

  if (isHigh) {
    config = {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: AlertCircle,
      label: 'Weather Alert',
    };
  } else if (isModerate) {
    config = {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: ShieldAlert,
      label: 'Moderate Risk',
    };
  }

  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`
        flex items-center gap-2
        ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}
        rounded-xl border
        ${config.bg} ${config.border}
      `}
    >
      <IconComponent className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${config.text}`} />
      <div className="flex-1">
        <span className={`font-medium ${config.text} ${compact ? 'text-xs' : 'text-sm'}`}>
          {config.label}
        </span>
        <span className={`${config.text} opacity-75 ${compact ? 'text-[10px]' : 'text-xs'} ml-1`}>
          — {risk}
        </span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Compact Badge
// =============================================================================

interface WeatherBadgeProps {
  weather: WeatherOutput;
}

export function WeatherBadge({ weather }: WeatherBadgeProps) {
  const config = getConditionConfig(weather.conditions || '');
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1 rounded-full
        bg-gradient-to-r ${config.gradient}
        text-white text-xs font-medium
        shadow-sm
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {weather.temperature ? `${weather.temperature.high}°C` : weather.conditions}
    </span>
  );
}

export default WeatherDisplay;
