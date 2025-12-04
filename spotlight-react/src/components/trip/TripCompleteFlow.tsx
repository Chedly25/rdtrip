/**
 * Trip Complete Flow - Journey's End Celebration
 *
 * A cinematic, celebratory experience when the traveler completes their trip.
 * Shows trip recap, generates shareable content, and invites reflection.
 *
 * Design: "Grand Finale" - confetti, golden moments, travel scrapbook reveal
 *
 * Features:
 * - Confetti celebration animation
 * - Trip statistics summary
 * - Photo montage reveal
 * - AI-generated trip story
 * - Shareable recap card
 * - "Plan Your Next Adventure" CTA
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Camera,
  Car,
  Calendar,
  Star,
  Heart,
  Share2,
  Download,
  ChevronRight,
  Trophy,
  Plane,
  Quote,
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

// Confetti Particle
const ConfettiParticle = ({ index }: { index: number }) => {
  const confettiColors = [colors.golden, colors.terracotta, colors.sage, colors.goldenLight, '#FFB4A2'];
  const color = confettiColors[index % confettiColors.length];
  const startX = Math.random() * 100;
  const duration = 3 + Math.random() * 2;
  const delay = Math.random() * 0.5;
  const rotation = Math.random() * 360;
  const size = 8 + Math.random() * 8;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${startX}%`,
        top: -20,
        width: size,
        height: size * 0.6,
        background: color,
        borderRadius: 2,
      }}
      initial={{ y: -20, rotate: 0, opacity: 1 }}
      animate={{
        y: '100vh',
        rotate: rotation + 720,
        opacity: [1, 1, 0],
        x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 150],
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
        repeat: Infinity,
        repeatDelay: Math.random() * 2,
      }}
    />
  );
};

// Confetti Burst
const ConfettiBurst = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
    {Array.from({ length: 50 }).map((_, i) => (
      <ConfettiParticle key={i} index={i} />
    ))}
  </div>
);

// Stat Bubble
const StatBubble = ({
  icon: Icon,
  value,
  label,
  delay,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 200 }}
    className="flex flex-col items-center p-4 rounded-2xl"
    style={{ background: 'rgba(255,255,255,0.9)' }}
  >
    <Icon className="w-6 h-6 mb-2" style={{ color: colors.golden }} />
    <span className="text-2xl font-serif font-bold" style={{ color: colors.darkBrown }}>
      {value}
    </span>
    <span className="text-xs uppercase tracking-wider" style={{ color: colors.lightBrown }}>
      {label}
    </span>
  </motion.div>
);

// Photo Montage
const PhotoMontage = ({ photos }: { photos: string[] }) => {
  if (photos.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      className="relative h-48 mx-4 mb-6"
    >
      {photos.slice(0, 5).map((photo, index) => {
        const positions = [
          { left: '5%', top: '10%', rotate: -8, scale: 1 },
          { left: '25%', top: '5%', rotate: 5, scale: 1.1 },
          { left: '45%', top: '15%', rotate: -3, scale: 0.95 },
          { left: '65%', top: '8%', rotate: 7, scale: 1.05 },
          { left: '80%', top: '12%', rotate: -5, scale: 0.9 },
        ];
        const pos = positions[index];

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: 1,
              scale: pos.scale,
              rotate: pos.rotate,
            }}
            transition={{ delay: 1.5 + index * 0.15, type: 'spring', stiffness: 200 }}
            className="absolute w-24 h-24 rounded-lg overflow-hidden shadow-lg"
            style={{
              left: pos.left,
              top: pos.top,
              border: '3px solid white',
            }}
          >
            <img src={photo} alt="" className="w-full h-full object-cover" />
          </motion.div>
        );
      })}
    </motion.div>
  );
};

// Trip Story Quote
const TripStoryQuote = ({ story }: { story: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 2 }}
    className="mx-4 mb-6 p-5 rounded-2xl relative"
    style={{
      background: `linear-gradient(135deg, ${colors.golden}15 0%, ${colors.terracotta}10 100%)`,
      border: `1px solid ${colors.golden}30`,
    }}
  >
    <Quote
      className="absolute top-3 left-3 w-6 h-6 opacity-30"
      style={{ color: colors.golden }}
    />
    <p
      className="text-base font-serif italic text-center px-4 leading-relaxed"
      style={{ color: colors.darkBrown }}
    >
      {story}
    </p>
  </motion.div>
);

// Shareable Card Preview
const ShareableCardPreview = ({
  tripName,
  dates,
  cities,
  stats,
  coverPhoto,
}: {
  tripName: string;
  dates: string;
  cities: string[];
  stats: { distance: number; days: number; photos: number };
  coverPhoto?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 2.3 }}
    className="mx-4 mb-6 rounded-2xl overflow-hidden shadow-xl"
    style={{ border: `1px solid ${colors.border}` }}
  >
    {/* Card header with photo */}
    <div className="relative h-32">
      {coverPhoto ? (
        <img src={coverPhoto} alt="" className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 30%, rgba(44, 36, 23, 0.7) 100%)',
        }}
      />
      <div className="absolute bottom-3 left-4 right-4">
        <h3 className="text-white text-lg font-serif font-medium">{tripName}</h3>
        <p className="text-white/80 text-sm">{dates}</p>
      </div>
    </div>

    {/* Card content */}
    <div className="p-4" style={{ background: colors.cream }}>
      {/* Cities route */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {cities.map((city, index) => (
          <div key={city} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
              {city}
            </span>
            {index < cities.length - 1 && (
              <ChevronRight className="w-4 h-4" style={{ color: colors.lightBrown }} />
            )}
          </div>
        ))}
      </div>

      {/* Mini stats */}
      <div className="flex justify-around py-3 border-t border-b" style={{ borderColor: colors.border }}>
        <div className="text-center">
          <span className="text-lg font-bold" style={{ color: colors.darkBrown }}>
            {stats.distance}
          </span>
          <span className="text-xs block" style={{ color: colors.lightBrown }}>
            km
          </span>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold" style={{ color: colors.darkBrown }}>
            {stats.days}
          </span>
          <span className="text-xs block" style={{ color: colors.lightBrown }}>
            days
          </span>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold" style={{ color: colors.darkBrown }}>
            {stats.photos}
          </span>
          <span className="text-xs block" style={{ color: colors.lightBrown }}>
            photos
          </span>
        </div>
      </div>

      {/* rdtrip branding */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <MapPin className="w-4 h-4" style={{ color: colors.terracotta }} />
        <span className="text-xs font-medium" style={{ color: colors.lightBrown }}>
          Made with rdtrip
        </span>
      </div>
    </div>
  </motion.div>
);

interface TripCompleteFlowProps {
  isOpen: boolean;
  onClose: () => void;
  tripData: {
    name: string;
    dates: string;
    cities: string[];
    stats: {
      distance: number;
      days: number;
      photos: number;
      checkins: number;
    };
    photos?: string[];
    coverPhoto?: string;
    story?: string;
  };
  onShare?: () => void;
  onDownload?: () => void;
  onPlanNext?: () => void;
}

export const TripCompleteFlow: React.FC<TripCompleteFlowProps> = ({
  isOpen,
  onClose,
  tripData,
  onShare,
  onDownload,
  onPlanNext,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [stage, setStage] = useState<'celebration' | 'recap'>('celebration');

  // Trigger confetti on open
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setStage('celebration');

      // Transition to recap after celebration
      const timer = setTimeout(() => {
        setStage('recap');
      }, 3000);

      // Stop confetti after a while
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(confettiTimer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col"
        style={{
          background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
        }}
      >
        {/* Confetti */}
        {showConfetti && <ConfettiBurst />}

        {/* Close button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-50"
          style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5" style={{ color: colors.lightBrown }} />
        </motion.button>

        {/* Celebration Stage */}
        <AnimatePresence>
          {stage === 'celebration' && (
            <motion.div
              key="celebration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              className="flex-1 flex flex-col items-center justify-center px-6"
            >
              {/* Trophy icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{
                  background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
                  boxShadow: `0 15px 40px ${colors.golden}50`,
                }}
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>

              {/* Celebration text */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-serif font-medium text-center mb-3"
                style={{ color: colors.darkBrown }}
              >
                Journey Complete!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-lg text-center"
                style={{ color: colors.lightBrown }}
              >
                What an incredible adventure
              </motion.p>

              {/* Quick stats preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex gap-4 mt-8"
              >
                <StatBubble icon={Calendar} value={tripData.stats.days} label="days" delay={1.1} />
                <StatBubble icon={MapPin} value={tripData.cities.length} label="cities" delay={1.2} />
                <StatBubble icon={Camera} value={tripData.stats.photos} label="photos" delay={1.3} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recap Stage */}
        <AnimatePresence>
          {stage === 'recap' && (
            <motion.div
              key="recap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-y-auto"
            >
              {/* Header */}
              <div className="text-center pt-6 pb-4">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 mb-2"
                >
                  <Star className="w-5 h-5" style={{ color: colors.golden }} />
                  <span className="text-sm uppercase tracking-wider" style={{ color: colors.golden }}>
                    Trip Recap
                  </span>
                  <Star className="w-5 h-5" style={{ color: colors.golden }} />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-serif font-medium"
                  style={{ color: colors.darkBrown }}
                >
                  {tripData.name}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm"
                  style={{ color: colors.lightBrown }}
                >
                  {tripData.dates}
                </motion.p>
              </div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-around mx-4 mb-6 p-4 rounded-2xl"
                style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
              >
                <div className="text-center">
                  <Car className="w-5 h-5 mx-auto mb-1" style={{ color: colors.sage }} />
                  <span className="text-xl font-bold block" style={{ color: colors.darkBrown }}>
                    {tripData.stats.distance}
                  </span>
                  <span className="text-xs" style={{ color: colors.lightBrown }}>km traveled</span>
                </div>
                <div className="text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1" style={{ color: colors.golden }} />
                  <span className="text-xl font-bold block" style={{ color: colors.darkBrown }}>
                    {tripData.stats.days}
                  </span>
                  <span className="text-xs" style={{ color: colors.lightBrown }}>days</span>
                </div>
                <div className="text-center">
                  <Camera className="w-5 h-5 mx-auto mb-1" style={{ color: colors.terracotta }} />
                  <span className="text-xl font-bold block" style={{ color: colors.darkBrown }}>
                    {tripData.stats.photos}
                  </span>
                  <span className="text-xs" style={{ color: colors.lightBrown }}>memories</span>
                </div>
              </motion.div>

              {/* Photo Montage */}
              {tripData.photos && tripData.photos.length > 0 && (
                <PhotoMontage photos={tripData.photos} />
              )}

              {/* Trip Story */}
              {tripData.story && <TripStoryQuote story={tripData.story} />}

              {/* Shareable Card */}
              <ShareableCardPreview
                tripName={tripData.name}
                dates={tripData.dates}
                cities={tripData.cities}
                stats={tripData.stats}
                coverPhoto={tripData.coverPhoto}
              />

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5 }}
                className="px-4 pb-8 space-y-3"
              >
                {/* Share & Download */}
                <div className="flex gap-3">
                  <motion.button
                    onClick={onShare}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Share2 className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Share</span>
                  </motion.button>
                  <motion.button
                    onClick={onDownload}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl"
                    style={{
                      background: colors.warmWhite,
                      border: `2px solid ${colors.border}`,
                    }}
                    whileHover={{ scale: 1.02, borderColor: colors.golden }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download className="w-5 h-5" style={{ color: colors.mediumBrown }} />
                    <span style={{ color: colors.mediumBrown }} className="font-medium">
                      Download
                    </span>
                  </motion.button>
                </div>

                {/* Plan Next */}
                <motion.button
                  onClick={onPlanNext}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                    boxShadow: `0 4px 15px ${colors.sage}30`,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plane className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">Plan Your Next Adventure</span>
                  <Heart className="w-4 h-4 text-white ml-1" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default TripCompleteFlow;
