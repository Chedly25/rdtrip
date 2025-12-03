/**
 * Night Editor - Redistribute Nights Across Your Journey
 *
 * A beautiful floating panel for adjusting how many nights to spend in each city.
 * Design: "Moonlit Allocation" - warm, organic, treating nights like precious resources.
 *
 * Features:
 * - Total nights budget with visual progress
 * - Per-city night adjustment with +/- steppers
 * - Moon phase visualization for each night
 * - "Redistribute evenly" option
 * - Smart warnings for over/under allocation
 * - Smooth animations throughout
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Moon,
  Plus,
  Minus,
  Sparkles,
  X,
  RotateCcw,
  Check,
  AlertTriangle,
  Wand2
} from 'lucide-react';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';

interface NightEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  cardBg: 'rgba(255, 251, 245, 0.95)',
};

// Moon phase component for visual night representation
const MoonPhase = ({
  filled,
  index,
  animate = true
}: {
  filled: boolean;
  index: number;
  animate?: boolean;
}) => (
  <motion.div
    initial={animate ? { scale: 0, opacity: 0 } : false}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
    className="relative"
  >
    <div
      className={`w-5 h-5 rounded-full transition-all duration-300 ${
        filled
          ? 'shadow-[0_0_8px_rgba(212,168,83,0.5)]'
          : ''
      }`}
      style={{
        background: filled
          ? `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`
          : colors.border,
        border: filled ? 'none' : `1px dashed ${colors.lightBrown}`,
      }}
    />
    {filled && (
      <motion.div
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        className="absolute inset-0 rounded-full"
        style={{ background: colors.golden }}
      />
    )}
  </motion.div>
);

// Night stepper for individual city
const NightStepper = ({
  cityName,
  nights,
  minNights,
  maxNights,
  onChange,
  isOrigin,
}: {
  cityName: string;
  nights: number;
  minNights: number;
  maxNights: number;
  onChange: (newNights: number) => void;
  isOrigin: boolean;
}) => {
  const canDecrease = nights > minNights;
  const canIncrease = nights < maxNights;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between py-4 border-b"
      style={{ borderColor: colors.border }}
    >
      {/* City name */}
      <div className="flex-1 min-w-0 mr-4">
        <h4
          className="font-medium text-base truncate"
          style={{ color: colors.darkBrown }}
        >
          {cityName}
        </h4>
        {isOrigin && (
          <span
            className="text-xs"
            style={{ color: colors.lightBrown }}
          >
            Starting point
          </span>
        )}
      </div>

      {/* Moon phases visualization */}
      <div className="flex items-center gap-1 mr-4">
        <AnimatePresence mode="popLayout">
          {Array.from({ length: Math.min(nights, 5) }).map((_, i) => (
            <MoonPhase key={`moon-${i}`} filled={true} index={i} />
          ))}
          {nights > 5 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-medium ml-1"
              style={{ color: colors.golden }}
            >
              +{nights - 5}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Stepper controls */}
      <div className="flex items-center gap-2">
        {/* Decrease button */}
        <motion.button
          whileHover={canDecrease ? { scale: 1.1 } : {}}
          whileTap={canDecrease ? { scale: 0.95 } : {}}
          onClick={() => canDecrease && onChange(nights - 1)}
          disabled={!canDecrease}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            canDecrease
              ? 'cursor-pointer'
              : 'cursor-not-allowed opacity-40'
          }`}
          style={{
            background: canDecrease
              ? `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
              : colors.border,
            boxShadow: canDecrease
              ? `0 2px 8px rgba(196, 88, 48, 0.3)`
              : 'none',
          }}
        >
          <Minus className="w-4 h-4 text-white" />
        </motion.button>

        {/* Night count */}
        <motion.div
          key={nights}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-12 text-center"
        >
          <span
            className="text-xl font-bold tabular-nums"
            style={{
              color: colors.darkBrown,
              fontFamily: "'Playfair Display', Georgia, serif"
            }}
          >
            {nights}
          </span>
        </motion.div>

        {/* Increase button */}
        <motion.button
          whileHover={canIncrease ? { scale: 1.1 } : {}}
          whileTap={canIncrease ? { scale: 0.95 } : {}}
          onClick={() => canIncrease && onChange(nights + 1)}
          disabled={!canIncrease}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            canIncrease
              ? 'cursor-pointer'
              : 'cursor-not-allowed opacity-40'
          }`}
          style={{
            background: canIncrease
              ? `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
              : colors.border,
            boxShadow: canIncrease
              ? `0 2px 8px rgba(107, 142, 123, 0.3)`
              : 'none',
          }}
        >
          <Plus className="w-4 h-4 text-white" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export function NightEditor({ isOpen, onClose }: NightEditorProps) {
  const { route, getCityName, updateCityNights } = useSpotlightStoreV2();

  // Local state for editing before applying
  const [localNights, setLocalNights] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local nights from route
  useEffect(() => {
    if (isOpen && route?.cities) {
      const nights: Record<string, number> = {};
      route.cities.forEach(city => {
        const name = getCityName(city.city);
        nights[name] = city.nights;
      });
      setLocalNights(nights);
      setHasChanges(false);
    }
  }, [isOpen, route, getCityName]);

  // Calculate totals
  const { totalNights, originalTotal, budgetStatus } = useMemo(() => {
    const total = Object.values(localNights).reduce((sum, n) => sum + n, 0);
    const original = route?.cities.reduce((sum, city) => sum + city.nights, 0) || 0;

    let status: 'under' | 'exact' | 'over' = 'exact';
    if (total < original) status = 'under';
    if (total > original) status = 'over';

    return { totalNights: total, originalTotal: original, budgetStatus: status };
  }, [localNights, route]);

  // Handle night change for a city
  const handleNightChange = (cityName: string, newNights: number) => {
    setLocalNights(prev => ({ ...prev, [cityName]: newNights }));
    setHasChanges(true);
  };

  // Redistribute nights evenly
  const handleRedistribute = () => {
    if (!route?.cities) return;

    const citiesWithNights = route.cities.filter((_, i) => i > 0); // Skip origin
    const nightsPerCity = Math.floor(originalTotal / citiesWithNights.length);
    const remainder = originalTotal % citiesWithNights.length;

    const newNights: Record<string, number> = {};

    // Origin gets 0 nights
    newNights[getCityName(route.cities[0].city)] = 0;

    // Distribute evenly with remainder going to first cities
    citiesWithNights.forEach((city, i) => {
      const name = getCityName(city.city);
      newNights[name] = nightsPerCity + (i < remainder ? 1 : 0);
    });

    setLocalNights(newNights);
    setHasChanges(true);
  };

  // Apply changes
  const handleApply = () => {
    Object.entries(localNights).forEach(([cityName, nights]) => {
      updateCityNights(cityName, nights);
    });
    onClose();
  };

  // Reset to original
  const handleReset = () => {
    if (route?.cities) {
      const nights: Record<string, number> = {};
      route.cities.forEach(city => {
        const name = getCityName(city.city);
        nights[name] = city.nights;
      });
      setLocalNights(nights);
      setHasChanges(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{
            background: 'rgba(44, 36, 23, 0.6)',
            backdropFilter: 'blur(8px)'
          }}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 25px 60px -15px rgba(44, 36, 23, 0.4)'
          }}
        >
          {/* Decorative header gradient */}
          <div
            className="absolute top-0 left-0 right-0 h-32 opacity-30"
            style={{
              background: `linear-gradient(180deg, ${colors.golden}40 0%, transparent 100%)`
            }}
          />

          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
                    boxShadow: `0 4px 12px rgba(212, 168, 83, 0.3)`
                  }}
                >
                  <Moon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{
                      color: colors.darkBrown,
                      fontFamily: "'Playfair Display', Georgia, serif"
                    }}
                  >
                    Allocate Your Nights
                  </h2>
                  <p className="text-sm" style={{ color: colors.lightBrown }}>
                    Distribute time across your journey
                  </p>
                </div>
              </div>

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ background: colors.border }}
              >
                <X className="w-5 h-5" style={{ color: colors.mediumBrown }} />
              </motion.button>
            </div>

            {/* Budget indicator */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: colors.mediumBrown }}>
                  Night Budget
                </span>
                <div className="flex items-center gap-2">
                  {budgetStatus !== 'exact' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1"
                    >
                      <AlertTriangle
                        className="w-4 h-4"
                        style={{
                          color: budgetStatus === 'over' ? colors.terracotta : colors.sage
                        }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: budgetStatus === 'over' ? colors.terracotta : colors.sage
                        }}
                      >
                        {budgetStatus === 'over'
                          ? `${totalNights - originalTotal} over budget`
                          : `${originalTotal - totalNights} remaining`}
                      </span>
                    </motion.div>
                  )}
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{
                      color: colors.darkBrown,
                      fontFamily: "'Playfair Display', Georgia, serif"
                    }}
                  >
                    {totalNights}
                  </span>
                  <span className="text-sm" style={{ color: colors.lightBrown }}>
                    / {originalTotal} nights
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: colors.border }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((totalNights / originalTotal) * 100, 100)}%`
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  className="h-full rounded-full"
                  style={{
                    background: budgetStatus === 'over'
                      ? `linear-gradient(90deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
                      : budgetStatus === 'under'
                      ? `linear-gradient(90deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
                      : `linear-gradient(90deg, ${colors.golden} 0%, ${colors.goldenLight} 100%)`,
                  }}
                />
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mt-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRedistribute}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: colors.border,
                    color: colors.mediumBrown
                  }}
                >
                  <Wand2 className="w-4 h-4" />
                  Redistribute Evenly
                </motion.button>
                {hasChanges && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: 'transparent',
                      color: colors.terracotta,
                      border: `1px solid ${colors.terracotta}40`
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* City list */}
          <div
            className="px-6 max-h-[40vh] overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {route?.cities.map((city, index) => {
              const cityName = getCityName(city.city);
              const isOrigin = index === 0;

              return (
                <NightStepper
                  key={cityName}
                  cityName={cityName}
                  nights={localNights[cityName] || 0}
                  minNights={isOrigin ? 0 : 1}
                  maxNights={isOrigin ? 0 : 14}
                  onChange={(newNights) => handleNightChange(cityName, newNights)}
                  isOrigin={isOrigin}
                />
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{
              background: colors.warmWhite,
              borderTop: `1px solid ${colors.border}`
            }}
          >
            <div className="flex items-center gap-2 text-sm" style={{ color: colors.lightBrown }}>
              <Sparkles className="w-4 h-4" style={{ color: colors.golden }} />
              <span>Changes apply instantly to your route</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApply}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                hasChanges ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
              style={{
                background: hasChanges
                  ? `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`
                  : colors.border,
                color: hasChanges ? 'white' : colors.lightBrown,
                boxShadow: hasChanges
                  ? `0 4px 12px rgba(212, 168, 83, 0.4)`
                  : 'none',
              }}
            >
              <Check className="w-4 h-4" />
              Apply Changes
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default NightEditor;
