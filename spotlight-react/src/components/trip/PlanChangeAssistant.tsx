/**
 * Plan Change Assistant
 * Sprint 2.3: Real-Time Adaptations
 *
 * Elegant modal that appears when weather or circumstances suggest
 * changing planned activities. Offers alternatives and one-tap rescheduling.
 *
 * Design: "Weather Bureau Telegram" - official yet warm, helpful authority
 * A vintage weather advisory aesthetic with modern UX
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain,
  Sun,
  CloudSnow,
  CloudLightning,
  Umbrella,
  MapPin,
  Clock,
  ArrowRight,
  X,
  Check,
  Sparkles,
  Coffee,
  Building2,
  Palette,
  ShoppingBag,
  Utensils,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { CurrentWeather, WeatherCondition } from '../../services/weather';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  parchment: '#F5EDE0',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  sageDark: '#5A7A6A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
  // Weather-specific
  stormDark: '#3D4F5F',
  rainBlue: '#5B7B8C',
  snowWhite: '#E8EFF5',
};

// Activity interface
interface Activity {
  id: string;
  name: string;
  type: 'outdoor' | 'indoor' | 'flexible';
  time: string;
  location: string;
  originalPlan?: boolean;
}

// Alternative suggestion
interface Alternative {
  id: string;
  name: string;
  category: 'museum' | 'cafe' | 'shopping' | 'restaurant' | 'gallery' | 'spa' | 'indoor_attraction';
  distance: string;
  rating?: number;
  matchReason: string;
  photo?: string;
}

interface PlanChangeAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  weather: CurrentWeather;
  affectedActivity: Activity;
  alternatives: Alternative[];
  onAcceptAlternative: (alternative: Alternative) => void;
  onKeepOriginal: () => void;
  onPostpone: (activity: Activity) => void;
}

// Weather condition to visual config
const weatherVisuals: Record<WeatherCondition, {
  icon: React.ElementType;
  gradient: string;
  accent: string;
  title: string;
  subtitle: string;
}> = {
  rain: {
    icon: CloudRain,
    gradient: `linear-gradient(135deg, ${colors.rainBlue} 0%, ${colors.stormDark} 100%)`,
    accent: colors.rainBlue,
    title: 'Rain Expected',
    subtitle: 'Time to explore indoors',
  },
  drizzle: {
    icon: Umbrella,
    gradient: `linear-gradient(135deg, ${colors.rainBlue}90 0%, ${colors.stormDark}90 100%)`,
    accent: colors.rainBlue,
    title: 'Light Rain',
    subtitle: 'Consider indoor alternatives',
  },
  thunderstorm: {
    icon: CloudLightning,
    gradient: `linear-gradient(135deg, ${colors.stormDark} 0%, #2D3A45 100%)`,
    accent: colors.golden,
    title: 'Storm Warning',
    subtitle: 'Stay safe indoors',
  },
  snow: {
    icon: CloudSnow,
    gradient: `linear-gradient(135deg, ${colors.snowWhite} 0%, #C5D5E5 100%)`,
    accent: colors.sage,
    title: 'Snow Expected',
    subtitle: 'Cozy indoor day ahead',
  },
  clear: {
    icon: Sun,
    gradient: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.terracotta} 100%)`,
    accent: colors.golden,
    title: 'Beautiful Day',
    subtitle: 'Perfect for your plans',
  },
  clouds: {
    icon: CloudRain,
    gradient: `linear-gradient(135deg, #8899AA 0%, #667788 100%)`,
    accent: colors.lightBrown,
    title: 'Overcast',
    subtitle: 'Outdoor activities may be affected',
  },
  mist: {
    icon: CloudRain,
    gradient: `linear-gradient(135deg, #9AACB8 0%, #7A8C98 100%)`,
    accent: colors.lightBrown,
    title: 'Misty Conditions',
    subtitle: 'Limited visibility outdoors',
  },
  fog: {
    icon: CloudRain,
    gradient: `linear-gradient(135deg, #8A9CA8 0%, #6A7C88 100%)`,
    accent: colors.lightBrown,
    title: 'Foggy Weather',
    subtitle: 'Consider indoor options',
  },
  haze: {
    icon: Sun,
    gradient: `linear-gradient(135deg, #B8A890 0%, #988870 100%)`,
    accent: colors.lightBrown,
    title: 'Hazy Conditions',
    subtitle: 'Air quality may be affected',
  },
};

// Category icons
const categoryIcons: Record<Alternative['category'], React.ElementType> = {
  museum: Palette,
  cafe: Coffee,
  shopping: ShoppingBag,
  restaurant: Utensils,
  gallery: Palette,
  spa: Sparkles,
  indoor_attraction: Building2,
};

export const PlanChangeAssistant: React.FC<PlanChangeAssistantProps> = ({
  isOpen,
  onClose,
  weather,
  affectedActivity,
  alternatives,
  onAcceptAlternative,
  onKeepOriginal,
  onPostpone,
}) => {
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const visual = weatherVisuals[weather.condition] || weatherVisuals.clouds;
  const WeatherIcon = visual.icon;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAlternative(null);
      setShowConfirm(false);
    }
  }, [isOpen]);

  const handleSelectAlternative = (alt: Alternative) => {
    setSelectedAlternative(alt.id);
    setShowConfirm(true);
  };

  const handleConfirmChange = () => {
    const alt = alternatives.find(a => a.id === selectedAlternative);
    if (alt) {
      onAcceptAlternative(alt);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(44, 36, 23, 0.6)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 z-50 max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl"
            style={{
              background: colors.cream,
              maxWidth: '500px',
              margin: '0 auto',
            }}
          >
            {/* Weather Header - Dramatic visual */}
            <div
              className="relative overflow-hidden"
              style={{
                background: visual.gradient,
                minHeight: '140px',
              }}
            >
              {/* Decorative pattern */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='%23fff' fill-opacity='0.3'/%3E%3C/svg%3E")`,
                  backgroundSize: '30px 30px',
                }}
              />

              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)' }}
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>

              {/* Content */}
              <div className="relative p-6 pt-8 flex items-center gap-4">
                {/* Weather icon */}
                <motion.div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <WeatherIcon className="w-8 h-8 text-white" />
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-white/80" />
                    <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                      Weather Advisory
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{visual.title}</h2>
                  <p className="text-sm text-white/80">{visual.subtitle}</p>
                </div>
              </div>

              {/* Temperature badge */}
              <div
                className="absolute bottom-4 right-6 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <span className="text-lg font-bold text-white">
                  {Math.round(weather.temperature)}°C
                </span>
              </div>
            </div>

            {/* Affected Activity Card */}
            <div className="px-6 py-4">
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: colors.terracotta }} />
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.terracotta }}>
                    May Be Affected
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: colors.darkBrown }}>
                  {affectedActivity.name}
                </h3>
                <div className="flex items-center gap-4 text-sm" style={{ color: colors.lightBrown }}>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{affectedActivity.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{affectedActivity.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternatives Section */}
            <div className="px-6 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: colors.golden }} />
                <span className="text-sm font-medium" style={{ color: colors.mediumBrown }}>
                  Suggested Alternatives
                </span>
              </div>

              {/* Alternative Cards */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {alternatives.map((alt, index) => {
                  const CategoryIcon = categoryIcons[alt.category] || Building2;
                  const isSelected = selectedAlternative === alt.id;

                  return (
                    <motion.button
                      key={alt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSelectAlternative(alt)}
                      className="w-full p-3 rounded-xl text-left transition-all"
                      style={{
                        background: isSelected
                          ? `linear-gradient(135deg, ${colors.sage}15 0%, ${colors.sageLight}10 100%)`
                          : colors.warmWhite,
                        border: `2px solid ${isSelected ? colors.sage : colors.border}`,
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Category Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isSelected ? `${colors.sage}20` : `${colors.golden}15`,
                          }}
                        >
                          <CategoryIcon
                            className="w-5 h-5"
                            style={{ color: isSelected ? colors.sage : colors.golden }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate" style={{ color: colors.darkBrown }}>
                            {alt.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs" style={{ color: colors.lightBrown }}>
                            <span>{alt.distance}</span>
                            {alt.rating && (
                              <>
                                <span>•</span>
                                <span>{alt.rating.toFixed(1)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Selection indicator */}
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isSelected ? colors.sage : colors.border,
                          }}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" style={{ color: colors.lightBrown }} />
                          )}
                        </div>
                      </div>

                      {/* Match reason */}
                      <p className="mt-2 text-xs pl-13" style={{ color: colors.lightBrown }}>
                        {alt.matchReason}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-4 space-y-3">
              {/* Primary action - changes based on selection */}
              <AnimatePresence mode="wait">
                {showConfirm && selectedAlternative ? (
                  <motion.button
                    key="confirm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={handleConfirmChange}
                    className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-medium"
                    style={{
                      background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`,
                      color: 'white',
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Check className="w-5 h-5" />
                    <span>Confirm Change</span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <motion.button
                      onClick={() => onPostpone(affectedActivity)}
                      className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                      style={{
                        background: colors.warmWhite,
                        border: `1px solid ${colors.border}`,
                        color: colors.mediumBrown,
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm font-medium">Postpone</span>
                    </motion.button>

                    <motion.button
                      onClick={onKeepOriginal}
                      className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                      style={{
                        background: colors.warmWhite,
                        border: `1px solid ${colors.border}`,
                        color: colors.mediumBrown,
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-sm font-medium">Keep Plan</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Secondary link */}
              <button
                onClick={onClose}
                className="w-full py-2 text-sm"
                style={{ color: colors.lightBrown }}
              >
                Decide later
              </button>
            </div>

            {/* Bottom decorative line */}
            <div
              className="h-1"
              style={{
                background: visual.gradient,
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PlanChangeAssistant;
