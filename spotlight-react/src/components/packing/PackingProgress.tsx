/**
 * Packing Progress - Visual Progress Dashboard
 *
 * A beautiful progress visualization showing packing completion
 * with trunk filling animation and category breakdown.
 *
 * Design: "The Filling Trunk" - vintage suitcase that fills up,
 * category ribbons, brass gauge meter
 *
 * Features:
 * - Animated trunk filling visualization
 * - Category-by-category breakdown
 * - Countdown to departure
 * - Motivational messages
 * - Confetti on completion
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Luggage,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Plane,
} from 'lucide-react';

// Wanderlust Editorial Colors with Trunk Accents
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
  leather: '#8B4513',
  leatherLight: '#A0522D',
  leatherDark: '#5D2E0C',
  brass: '#B8860B',
  brassLight: '#DAA520',
  brassDark: '#8B6914',
  strap: '#654321',
  canvas: '#F5F5DC',
};

// Category colors
const categoryColors: Record<string, string> = {
  clothing: colors.terracotta,
  toiletries: colors.sage,
  electronics: colors.brass,
  documents: colors.mediumBrown,
  health: '#E07B7B',
  accessories: colors.golden,
  food: colors.goldenDark,
  work: colors.darkBrown,
  weather: '#6B9BD1',
  misc: colors.lightBrown,
};

// Types
interface CategoryProgress {
  category: string;
  label: string;
  total: number;
  packed: number;
}

// Confetti Particle
const ConfettiParticle = ({ index, delay }: { index: number; delay: number }) => {
  const confettiColors = [colors.golden, colors.terracotta, colors.sage, colors.brass, '#FFB4A2'];
  const color = confettiColors[index % confettiColors.length];
  const startX = Math.random() * 100;
  const duration = 2 + Math.random() * 1.5;
  const size = 6 + Math.random() * 6;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${startX}%`,
        top: -10,
        width: size,
        height: size * 0.6,
        background: color,
        borderRadius: 2,
      }}
      initial={{ y: -10, rotate: 0, opacity: 1 }}
      animate={{
        y: 200,
        rotate: Math.random() * 360,
        opacity: [1, 1, 0],
        x: (Math.random() - 0.5) * 100,
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
    />
  );
};

// Brass Gauge Meter
const GaugeMeter = ({ progress }: { progress: number }) => {
  const angle = -135 + (progress / 100) * 270; // -135 to 135 degrees

  return (
    <div className="relative w-40 h-24 mx-auto">
      {/* Gauge background */}
      <svg viewBox="0 0 200 120" className="w-full h-full">
        {/* Outer brass ring */}
        <defs>
          <linearGradient id="brassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.brass} />
            <stop offset="50%" stopColor={colors.brassLight} />
            <stop offset="100%" stopColor={colors.brassDark} />
          </linearGradient>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.terracotta} />
            <stop offset="50%" stopColor={colors.golden} />
            <stop offset="100%" stopColor={colors.sage} />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={colors.border}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress / 100 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
        />

        {/* Center decoration */}
        <circle cx="100" cy="100" r="15" fill="url(#brassGradient)" />
        <circle cx="100" cy="100" r="10" fill={colors.leatherDark} />
      </svg>

      {/* Needle */}
      <motion.div
        className="absolute bottom-5 left-1/2 origin-bottom"
        style={{
          width: 4,
          height: 50,
          marginLeft: -2,
          background: `linear-gradient(to top, ${colors.brass}, ${colors.brassLight})`,
          borderRadius: 2,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
        initial={{ rotate: -135 }}
        animate={{ rotate: angle }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />

      {/* Percentage display */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <motion.span
          className="text-2xl font-serif font-bold"
          style={{ color: colors.darkBrown }}
          key={Math.round(progress)}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
};

// Category Progress Bar
const CategoryBar = ({
  category,
  index,
}: {
  category: CategoryProgress;
  index: number;
}) => {
  const progress = category.total > 0 ? (category.packed / category.total) * 100 : 0;
  const isComplete = category.packed === category.total;
  const color = categoryColors[category.category] || colors.lightBrown;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3"
    >
      {/* Label */}
      <div className="w-24 text-right">
        <span className="text-xs font-medium" style={{ color: colors.mediumBrown }}>
          {category.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: colors.border }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isComplete
              ? `linear-gradient(90deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`
              : `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        />
      </div>

      {/* Count */}
      <div className="w-12 text-right">
        <span className="text-xs" style={{ color: isComplete ? colors.sage : colors.lightBrown }}>
          {category.packed}/{category.total}
        </span>
        {isComplete && <CheckCircle2 className="w-3 h-3 inline ml-1" style={{ color: colors.sage }} />}
      </div>
    </motion.div>
  );
};

// Countdown Timer
const CountdownTimer = ({ departureDate }: { departureDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = departureDate.getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [departureDate]);

  const isUrgent = timeLeft.days <= 1;

  return (
    <motion.div
      className="p-4 rounded-2xl"
      style={{
        background: isUrgent
          ? `linear-gradient(135deg, ${colors.terracotta}15 0%, ${colors.terracottaLight}10 100%)`
          : `linear-gradient(135deg, ${colors.sage}15 0%, ${colors.sageLight}10 100%)`,
        border: `1px solid ${isUrgent ? colors.terracotta + '30' : colors.sage + '30'}`,
      }}
      animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 2, repeat: isUrgent ? Infinity : 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        {isUrgent ? (
          <AlertCircle className="w-5 h-5" style={{ color: colors.terracotta }} />
        ) : (
          <Plane className="w-5 h-5" style={{ color: colors.sage }} />
        )}
        <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
          {isUrgent ? 'Departure Soon!' : 'Time Until Departure'}
        </span>
      </div>

      <div className="flex justify-center gap-4">
        {[
          { value: timeLeft.days, label: 'days' },
          { value: timeLeft.hours, label: 'hours' },
          { value: timeLeft.minutes, label: 'min' },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <motion.div
              className="text-3xl font-serif font-bold"
              style={{ color: isUrgent ? colors.terracotta : colors.darkBrown }}
              key={item.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {item.value}
            </motion.div>
            <div className="text-xs uppercase tracking-wide" style={{ color: colors.lightBrown }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Motivational Message
const MotivationalMessage = ({ progress }: { progress: number }) => {
  const getMessage = () => {
    if (progress === 100) return { text: "You're all set! Have an amazing trip! ✨", emoji: '🎉' };
    if (progress >= 80) return { text: 'Almost there! Just a few more items to go.', emoji: '🏁' };
    if (progress >= 60) return { text: "Great progress! You're over halfway done.", emoji: '💪' };
    if (progress >= 40) return { text: 'Keep going! Your trunk is filling up nicely.', emoji: '📦' };
    if (progress >= 20) return { text: "Good start! Don't forget the essentials.", emoji: '👍' };
    return { text: "Let's get packing! Start with the essentials.", emoji: '🧳' };
  };

  const message = getMessage();

  return (
    <motion.div
      key={message.text}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-4 rounded-xl"
      style={{
        background: `linear-gradient(135deg, ${colors.golden}10 0%, ${colors.goldenLight}05 100%)`,
        border: `1px solid ${colors.golden}20`,
      }}
    >
      <span className="text-2xl mr-2">{message.emoji}</span>
      <span className="text-sm" style={{ color: colors.mediumBrown }}>
        {message.text}
      </span>
    </motion.div>
  );
};

// Trunk Visualization
const TrunkVisualization = ({ progress }: { progress: number }) => {
  const isComplete = progress === 100;

  return (
    <div className="relative">
      {/* Confetti on completion */}
      <AnimatePresence>
        {isComplete && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <ConfettiParticle key={i} index={i} delay={i * 0.05} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Trunk SVG */}
      <svg viewBox="0 0 200 150" className="w-full max-w-xs mx-auto">
        <defs>
          <linearGradient id="trunkLeather" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.leatherLight} />
            <stop offset="50%" stopColor={colors.leather} />
            <stop offset="100%" stopColor={colors.leatherDark} />
          </linearGradient>
          <linearGradient id="trunkFill" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={colors.sage} />
            <stop offset="100%" stopColor={colors.sageLight} />
          </linearGradient>
          <clipPath id="trunkClip">
            <rect x="25" y="40" width="150" height="90" rx="5" />
          </clipPath>
        </defs>

        {/* Trunk body */}
        <rect
          x="20"
          y="35"
          width="160"
          height="100"
          rx="8"
          fill="url(#trunkLeather)"
          stroke={colors.leatherDark}
          strokeWidth="2"
        />

        {/* Fill level */}
        <g clipPath="url(#trunkClip)">
          <motion.rect
            x="25"
            y="130"
            width="150"
            height="90"
            fill="url(#trunkFill)"
            initial={{ y: 130 }}
            animate={{ y: 130 - (progress / 100) * 90 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </g>

        {/* Straps */}
        <rect x="60" y="30" width="12" height="110" fill={colors.strap} rx="2" />
        <rect x="128" y="30" width="12" height="110" fill={colors.strap} rx="2" />

        {/* Brass buckles */}
        <rect x="58" y="75" width="16" height="10" fill={colors.brass} rx="2" />
        <rect x="126" y="75" width="16" height="10" fill={colors.brass} rx="2" />

        {/* Handle */}
        <path
          d="M 80 35 Q 100 15 120 35"
          fill="none"
          stroke={colors.strap}
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Brass corners */}
        <polygon points="20,35 35,35 20,50" fill={colors.brass} />
        <polygon points="180,35 165,35 180,50" fill={colors.brass} />
        <polygon points="20,135 35,135 20,120" fill={colors.brass} />
        <polygon points="180,135 165,135 180,120" fill={colors.brass} />

        {/* Lock */}
        <rect x="90" y="125" width="20" height="15" fill={colors.brass} rx="2" />
        <circle cx="100" cy="132" r="3" fill={colors.brassDark} />
      </svg>
    </div>
  );
};

interface PackingProgressProps {
  totalItems: number;
  packedItems: number;
  categories: CategoryProgress[];
  departureDate?: Date;
  className?: string;
}

export const PackingProgress: React.FC<PackingProgressProps> = ({
  totalItems,
  packedItems,
  categories,
  departureDate,
  className = '',
}) => {
  const progress = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;
  const isComplete = packedItems === totalItems && totalItems > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Luggage className="w-5 h-5" style={{ color: colors.leather }} />
          <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
            Packing Progress
          </h2>
        </div>
        <p className="text-sm" style={{ color: colors.lightBrown }}>
          {packedItems} of {totalItems} items packed
        </p>
      </div>

      {/* Trunk visualization */}
      <TrunkVisualization progress={progress} />

      {/* Gauge meter */}
      <GaugeMeter progress={progress} />

      {/* Motivational message */}
      <MotivationalMessage progress={progress} />

      {/* Countdown timer */}
      {departureDate && <CountdownTimer departureDate={departureDate} />}

      {/* Category breakdown */}
      <div
        className="p-4 rounded-2xl space-y-3"
        style={{
          background: colors.warmWhite,
          border: `1px solid ${colors.border}`,
        }}
      >
        <h3 className="text-sm font-medium mb-4" style={{ color: colors.darkBrown }}>
          Category Breakdown
        </h3>
        {categories.map((category, index) => (
          <CategoryBar key={category.category} category={category} index={index} />
        ))}
      </div>

      {/* Completion celebration */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-6 rounded-2xl text-center"
            style={{
              background: `linear-gradient(135deg, ${colors.sage}15 0%, ${colors.golden}10 100%)`,
              border: `2px solid ${colors.sage}`,
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              <Sparkles className="w-12 h-12 mx-auto mb-3" style={{ color: colors.golden }} />
            </motion.div>
            <h3 className="text-xl font-serif font-medium mb-2" style={{ color: colors.darkBrown }}>
              All Packed!
            </h3>
            <p className="text-sm" style={{ color: colors.mediumBrown }}>
              Your trunk is ready for adventure. Have an amazing trip!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PackingProgress;
