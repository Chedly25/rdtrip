/**
 * Trip Activation - The Gateway to Your Adventure
 *
 * A cinematic transition from planning mode to live trip mode.
 * Design: "Dawn Awakening" - the magical moment when your journey begins.
 *
 * Features:
 * - Stunning full-screen activation modal
 * - Animated sunrise/compass visualization
 * - Trip summary with key stats
 * - Countdown feel with date confirmation
 * - Celebratory animation on activation
 * - Wanderlust Editorial design system
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Compass,
  MapPin,
  Moon,
  Sun,
  Plane,
  Check,
  Sparkles,
  ArrowRight,
  X,
  Navigation,
  Clock,
  Heart
} from 'lucide-react';
import { useSpotlightStoreV2 } from '../../stores/spotlightStoreV2';

interface TripActivationProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: () => void;
  tripStartDate?: Date;
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
  cardBg: 'rgba(255, 251, 245, 0.98)',
  // Dawn colors for the sunrise effect
  dawnPink: '#FFB4A2',
  dawnOrange: '#FFCDB2',
  dawnPurple: '#9D8189',
  horizonBlue: '#6D6875',
};

// Animated compass rose component
const CompassRose = ({ isActivating }: { isActivating: boolean }) => {
  return (
    <motion.div
      className="relative w-32 h-32"
      animate={isActivating ? { rotate: 720, scale: [1, 1.2, 1] } : { rotate: 0 }}
      transition={{ duration: 2, ease: 'easeInOut' }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: `2px solid ${colors.golden}`,
          boxShadow: `0 0 30px ${colors.golden}40`,
        }}
        animate={{
          boxShadow: isActivating
            ? [`0 0 30px ${colors.golden}40`, `0 0 60px ${colors.golden}80`, `0 0 30px ${colors.golden}40`]
            : `0 0 30px ${colors.golden}40`,
        }}
        transition={{ duration: 1.5, repeat: isActivating ? Infinity : 0 }}
      />

      {/* Compass directions */}
      {['N', 'E', 'S', 'W'].map((dir, i) => (
        <motion.span
          key={dir}
          className="absolute text-xs font-serif tracking-wider"
          style={{
            color: dir === 'N' ? colors.terracotta : colors.lightBrown,
            fontWeight: dir === 'N' ? 600 : 400,
            top: i === 0 ? '4px' : i === 2 ? 'auto' : '50%',
            bottom: i === 2 ? '4px' : 'auto',
            left: i === 3 ? '6px' : i === 1 ? 'auto' : '50%',
            right: i === 1 ? '6px' : 'auto',
            transform: i === 0 || i === 2 ? 'translateX(-50%)' : 'translateY(-50%)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
        >
          {dir}
        </motion.span>
      ))}

      {/* Inner decorative ring */}
      <motion.div
        className="absolute inset-4 rounded-full"
        style={{
          border: `1px solid ${colors.border}`,
        }}
      />

      {/* Compass needle */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={isActivating ? { rotate: [0, 360] } : {}}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <div className="relative w-full h-full">
          {/* North needle */}
          <div
            className="absolute left-1/2 top-6 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: `20px solid ${colors.terracotta}`,
            }}
          />
          {/* South needle */}
          <div
            className="absolute left-1/2 bottom-6 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `20px solid ${colors.lightBrown}`,
            }}
          />
          {/* Center dot */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
              boxShadow: `0 0 10px ${colors.golden}60`,
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Animated sun rays for the dawn effect
const SunRays = ({ isActivating }: { isActivating: boolean }) => {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: isActivating ? 1 : 0.3 }}
      transition={{ duration: 1 }}
    >
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 bottom-0 origin-bottom"
          style={{
            width: '2px',
            height: '150%',
            background: `linear-gradient(to top, ${colors.golden}30, transparent)`,
            transform: `rotate(${i * 30}deg)`,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={isActivating ? {
            scaleY: [0, 1, 0.8],
            opacity: [0, 0.6, 0.3],
          } : { scaleY: 0, opacity: 0 }}
          transition={{
            duration: 2,
            delay: i * 0.05,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
};

// Trip stat card component
const StatCard = ({
  icon: Icon,
  label,
  value,
  delay,
  accentColor = colors.golden,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  delay: number;
  accentColor?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    className="flex flex-col items-center gap-2 px-4 py-3"
  >
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{
        background: `${accentColor}15`,
        border: `1px solid ${accentColor}30`,
      }}
    >
      <Icon className="w-5 h-5" style={{ color: accentColor }} />
    </div>
    <span
      className="text-2xl font-serif font-medium"
      style={{ color: colors.darkBrown }}
    >
      {value}
    </span>
    <span
      className="text-xs uppercase tracking-widest"
      style={{ color: colors.lightBrown }}
    >
      {label}
    </span>
  </motion.div>
);

// City path visualization
const CityPath = ({ cities }: { cities: string[] }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.8, duration: 0.6 }}
    className="flex items-center justify-center flex-wrap gap-2 px-4"
  >
    {cities.map((city, i) => (
      <motion.div
        key={city}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9 + i * 0.1 }}
        className="flex items-center gap-2"
      >
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3" style={{ color: colors.terracotta }} />
          <span
            className="text-sm font-medium"
            style={{ color: colors.mediumBrown }}
          >
            {city}
          </span>
        </div>
        {i < cities.length - 1 && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1 + i * 0.1, duration: 0.3 }}
            className="flex items-center gap-1"
          >
            <div
              className="w-8 h-px"
              style={{ background: colors.border }}
            />
            <ArrowRight
              className="w-3 h-3"
              style={{ color: colors.lightBrown }}
            />
          </motion.div>
        )}
      </motion.div>
    ))}
  </motion.div>
);

export const TripActivation: React.FC<TripActivationProps> = ({
  isOpen,
  onClose,
  onActivate,
  tripStartDate,
}) => {
  const { route } = useSpotlightStoreV2();
  const [isActivating, setIsActivating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculate trip stats
  const tripStats = useMemo(() => {
    if (!route) return null;

    const totalNights = route.cities.reduce((sum, city) => sum + (city.nights || 0), 0);
    const cityNames = route.cities.map(c =>
      typeof c.city === 'string' ? c.city : (c.city as { name: string })?.name || 'City'
    );

    return {
      cities: cityNames.length,
      nights: totalNights,
      cityNames,
      origin: typeof route.origin === 'string' ? route.origin : route.origin?.name || 'Origin',
      destination: typeof route.destination === 'string' ? route.destination : route.destination?.name || 'Destination',
    };
  }, [route]);

  // Handle activation
  const handleActivate = async () => {
    setIsActivating(true);

    // Simulate activation process with animations
    await new Promise(resolve => setTimeout(resolve, 2000));

    setShowSuccess(true);

    // Wait for success animation then close
    await new Promise(resolve => setTimeout(resolve, 1500));

    onActivate();
    onClose();
  };

  // Format start date
  const formattedDate = useMemo(() => {
    if (!tripStartDate) return 'Today';
    return tripStartDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [tripStartDate]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: 'rgba(44, 36, 23, 0.7)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => e.target === e.currentTarget && !isActivating && onClose()}
      >
        {/* Dawn gradient background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isActivating ? 0.5 : 0.2 }}
          transition={{ duration: 1 }}
          style={{
            background: `linear-gradient(to top,
              ${colors.dawnOrange}40 0%,
              ${colors.dawnPink}20 30%,
              transparent 60%
            )`,
          }}
        />

        <SunRays isActivating={isActivating} />

        {/* Main card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden"
          style={{
            background: colors.cardBg,
            boxShadow: `
              0 25px 50px -12px rgba(44, 36, 23, 0.4),
              0 0 0 1px ${colors.border},
              inset 0 1px 0 rgba(255, 255, 255, 0.5)
            `,
          }}
        >
          {/* Close button */}
          {!isActivating && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`,
              }}
            >
              <X className="w-4 h-4" style={{ color: colors.lightBrown }} />
            </motion.button>
          )}

          {/* Success overlay */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  </div>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 text-xl font-serif text-white"
                >
                  Your adventure begins!
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="p-8 flex flex-col items-center">
            {/* Header with compass */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-6 mb-8"
            >
              <CompassRose isActivating={isActivating} />

              <div className="text-center">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-serif mb-2"
                  style={{ color: colors.darkBrown }}
                >
                  Ready to Begin?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm"
                  style={{ color: colors.lightBrown }}
                >
                  Activate your trip to unlock live companion features
                </motion.p>
              </div>
            </motion.div>

            {/* Date banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="w-full px-6 py-4 rounded-2xl mb-6 flex items-center justify-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${colors.golden}15 0%, ${colors.terracotta}10 100%)`,
                border: `1px solid ${colors.golden}30`,
              }}
            >
              <Sun className="w-5 h-5" style={{ color: colors.golden }} />
              <span
                className="text-base font-medium font-serif"
                style={{ color: colors.darkBrown }}
              >
                {formattedDate}
              </span>
            </motion.div>

            {/* Trip stats */}
            {tripStats && (
              <div
                className="w-full grid grid-cols-3 gap-2 py-4 rounded-2xl mb-6"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <StatCard
                  icon={MapPin}
                  label="Cities"
                  value={tripStats.cities}
                  delay={0.7}
                  accentColor={colors.terracotta}
                />
                <StatCard
                  icon={Moon}
                  label="Nights"
                  value={tripStats.nights}
                  delay={0.8}
                  accentColor={colors.golden}
                />
                <StatCard
                  icon={Navigation}
                  label="Days"
                  value={tripStats.nights + 1}
                  delay={0.9}
                  accentColor={colors.sage}
                />
              </div>
            )}

            {/* City path */}
            {tripStats && (
              <CityPath cities={tripStats.cityNames} />
            )}

            {/* Features preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="w-full mt-6 mb-8"
            >
              <p
                className="text-xs uppercase tracking-widest text-center mb-4"
                style={{ color: colors.lightBrown }}
              >
                Unlock these features
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Clock, text: "Today's Timeline" },
                  { icon: Navigation, text: 'One-tap Navigation' },
                  { icon: Sparkles, text: 'Live Suggestions' },
                  { icon: Heart, text: 'Check-in Memories' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + i * 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: `${colors.sage}10`,
                      border: `1px solid ${colors.sage}20`,
                    }}
                  >
                    <feature.icon
                      className="w-4 h-4"
                      style={{ color: colors.sage }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: colors.mediumBrown }}
                    >
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Activate button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              whileHover={{ scale: isActivating ? 1 : 1.02 }}
              whileTap={{ scale: isActivating ? 1 : 0.98 }}
              onClick={handleActivate}
              disabled={isActivating}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
              style={{
                background: isActivating
                  ? `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`
                  : `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                boxShadow: isActivating
                  ? `0 8px 30px ${colors.golden}40, inset 0 1px 0 rgba(255,255,255,0.2)`
                  : `0 8px 30px ${colors.terracotta}30, inset 0 1px 0 rgba(255,255,255,0.2)`,
                cursor: isActivating ? 'default' : 'pointer',
              }}
            >
              {isActivating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Compass className="w-5 h-5 text-white" />
                  </motion.div>
                  <span className="text-white font-serif text-lg">
                    Preparing your journey...
                  </span>
                </>
              ) : (
                <>
                  <Plane className="w-5 h-5 text-white" />
                  <span className="text-white font-serif text-lg">
                    Start Your Adventure
                  </span>
                  <ArrowRight className="w-5 h-5 text-white" />
                </>
              )}
            </motion.button>

            {/* Cancel link */}
            {!isActivating && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                onClick={onClose}
                className="mt-4 text-sm transition-colors hover:underline"
                style={{ color: colors.lightBrown }}
              >
                I'm still planning
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default TripActivation;
