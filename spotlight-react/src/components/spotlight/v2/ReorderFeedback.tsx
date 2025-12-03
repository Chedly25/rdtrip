/**
 * Reorder Feedback Component
 *
 * Shows distance change feedback after reordering cities.
 * Features a warm, editorial design with animated entrance/exit.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowDown, ArrowUp, RotateCcw, Sparkles, Route } from 'lucide-react';
import type { CityData, CityCoordinates } from '../../../stores/spotlightStoreV2';

export interface ReorderFeedbackData {
  isVisible: boolean;
  oldDistance: number;  // in km
  newDistance: number;  // in km
  oldOrder: string[];   // city names in old order
  newOrder: string[];   // city names in new order
  movedCity: string;    // name of city that was moved
  fromIndex: number;
  toIndex: number;
}

interface ReorderFeedbackProps {
  data: ReorderFeedbackData;
  onUndo: () => void;
  onOptimize?: () => void;
  onDismiss: () => void;
}

// Wanderlust Editorial colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaDark: '#A84828',
  golden: '#D4A853',
  darkBrown: '#2C2417',
  warmGray: '#8B7355',
  sage: '#6B8E7B',
  border: '#E5DDD0',
};

/**
 * Calculate total route distance using Haversine formula
 */
export function calculateRouteDistance(cities: CityData[]): number {
  if (cities.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 0; i < cities.length - 1; i++) {
    const coord1 = cities[i].coordinates;
    const coord2 = cities[i + 1].coordinates;

    if (!coord1 || !coord2) continue;

    const distance = haversineDistance(coord1, coord2);
    totalDistance += distance;
  }

  return totalDistance;
}

/**
 * Haversine formula for distance between two coordinates
 */
function haversineDistance(coord1: CityCoordinates, coord2: CityCoordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) *
    Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function ReorderFeedback({
  data,
  onUndo,
  onOptimize,
  onDismiss
}: ReorderFeedbackProps) {
  const { isVisible, oldDistance, newDistance, movedCity, fromIndex, toIndex } = data;

  const distanceChange = newDistance - oldDistance;
  const isWorse = distanceChange > 5; // More than 5km added is considered worse
  const isBetter = distanceChange < -5; // More than 5km saved is considered better
  const isNeutral = !isWorse && !isBetter;

  // Format distance for display
  const formatDistance = (km: number) => {
    if (Math.abs(km) >= 100) {
      return `${Math.round(km)} km`;
    }
    return `${km.toFixed(1)} km`;
  };

  const changeText = distanceChange > 0
    ? `+${formatDistance(distanceChange)}`
    : formatDistance(distanceChange);

  // Determine message and styling based on change
  const getMessage = () => {
    if (isBetter) {
      return {
        icon: <ArrowDown className="w-4 h-4" />,
        title: 'Great choice!',
        subtitle: `Saved ${formatDistance(Math.abs(distanceChange))} on your route`,
        bgColor: `linear-gradient(135deg, rgba(107, 142, 123, 0.15) 0%, rgba(107, 142, 123, 0.08) 100%)`,
        borderColor: colors.sage,
        accentColor: colors.sage,
      };
    }
    if (isWorse) {
      return {
        icon: <ArrowUp className="w-4 h-4" />,
        title: 'Longer route',
        subtitle: `This adds ${formatDistance(distanceChange)} to your journey`,
        bgColor: `linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(196, 88, 48, 0.06) 100%)`,
        borderColor: colors.terracotta,
        accentColor: colors.terracotta,
      };
    }
    return {
      icon: <Route className="w-4 h-4" />,
      title: 'Route updated',
      subtitle: `${movedCity} moved to position ${toIndex + 1}`,
      bgColor: `linear-gradient(135deg, rgba(212, 168, 83, 0.12) 0%, rgba(212, 168, 83, 0.06) 100%)`,
      borderColor: colors.golden,
      accentColor: colors.golden,
    };
  };

  const message = getMessage();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
            mass: 0.8
          }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4"
        >
          <motion.div
            className="relative rounded-2xl shadow-2xl overflow-hidden"
            style={{
              background: colors.cream,
              boxShadow: '0 20px 40px -12px rgba(44, 36, 23, 0.25), 0 0 0 1px rgba(44, 36, 23, 0.05)'
            }}
          >
            {/* Accent top bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: message.accentColor }}
            />

            {/* Main content */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: message.bgColor,
                    border: `1px solid ${message.borderColor}40`,
                    color: message.accentColor
                  }}
                >
                  {message.icon}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4
                      className="font-semibold text-sm"
                      style={{ color: colors.darkBrown }}
                    >
                      {message.title}
                    </h4>
                    {!isNeutral && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: message.bgColor,
                          color: message.accentColor
                        }}
                      >
                        {changeText}
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: colors.warmGray }}>
                    {message.subtitle}
                  </p>

                  {/* Route preview - compact */}
                  <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: colors.warmGray }}>
                    <span className="font-medium" style={{ color: colors.darkBrown }}>
                      {fromIndex + 1}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-medium" style={{ color: message.accentColor }}>
                      {toIndex + 1}
                    </span>
                    <span className="mx-1">•</span>
                    <span className="truncate">{movedCity}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Undo button */}
                  <motion.button
                    onClick={onUndo}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      background: colors.warmWhite,
                      border: `1px solid ${colors.border}`,
                      color: colors.warmGray
                    }}
                    title="Undo reorder"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>

                  {/* Optimize button - only show if route is worse */}
                  {isWorse && onOptimize && (
                    <motion.button
                      onClick={onOptimize}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-colors"
                      style={{
                        background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sage}dd 100%)`,
                        color: 'white',
                        boxShadow: `0 2px 8px ${colors.sage}40`
                      }}
                      title="Optimize route order"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Optimize
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              onAnimationComplete={onDismiss}
              className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
              style={{ background: message.accentColor + '60' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ReorderFeedback;
