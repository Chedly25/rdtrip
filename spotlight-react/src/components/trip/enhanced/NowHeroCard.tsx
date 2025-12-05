/**
 * NowHeroCard - Immersive "Right Now" Experience
 *
 * Design Direction: Editorial Travel Magazine meets Living Journal
 *
 * This is THE moment - full-bleed imagery, cinematic aspect ratio,
 * with contextual intelligence that makes you feel present.
 *
 * Typography: Playfair Display for headlines, clean sans for UI
 * Motion: Spring physics, parallax on scroll, pulse animations
 * Color: Time-aware palette that shifts throughout the day
 */

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  Clock,
  Star,
  Sparkles,
  ChevronDown,
  Camera,
  Lightbulb,
  MapPin,
} from 'lucide-react';
import { useTimeTheme } from '../hooks/useTimeOfDay';

interface NowHeroCardProps {
  activity: {
    id?: string;
    name: string;
    photo?: string;
    type?: string;
    address?: string;
    rating?: number;
    whyYoureHere?: string;
    insiderTip?: string;
    coordinates?: { lat: number; lng: number };
    duration?: string;
  };
  timeRemaining?: string;
  optimalUntil?: string;
  onNavigate?: () => void;
  onCaptureMoment?: () => void;
  onShowTip?: () => void;
}

export const NowHeroCard: React.FC<NowHeroCardProps> = ({
  activity,
  timeRemaining,
  optimalUntil,
  onNavigate,
  onCaptureMoment,
  onShowTip,
}) => {
  const { theme, formattedTime, isNight } = useTimeTheme();
  const [showTip, setShowTip] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Parallax scroll effect
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.6]);

  // Fallback gradient if no image
  const fallbackGradient = `linear-gradient(135deg, ${theme.primary}40 0%, ${theme.secondary}30 100%)`;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl mx-4 mb-6"
      style={{
        boxShadow: theme.shadow,
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      {/* Background Image with Parallax */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ y: imageY }}
      >
        {activity.photo ? (
          <img
            src={activity.photo}
            alt={activity.name}
            className="w-full h-full object-cover scale-110"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: fallbackGradient }}
          />
        )}

        {/* Gradient Overlays */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top,
              ${isNight ? 'rgba(26, 22, 33, 0.95)' : 'rgba(0,0,0,0.7)'} 0%,
              ${isNight ? 'rgba(26, 22, 33, 0.4)' : 'rgba(0,0,0,0.2)'} 40%,
              transparent 70%)`,
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ opacity }}
        />
      </motion.div>

      {/* Grain Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 pt-48 pb-6">
        {/* NOW Badge */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute top-5 left-5 flex items-center gap-2"
        >
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md"
            style={{
              background: `${theme.primary}E6`,
              boxShadow: `0 0 20px ${theme.glow}`,
            }}
            animate={{
              boxShadow: [
                `0 0 20px ${theme.glow}`,
                `0 0 30px ${theme.glow}`,
                `0 0 20px ${theme.glow}`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-white"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs font-bold text-white uppercase tracking-[0.15em]">
              Now
            </span>
          </motion.div>

          <span className="text-white/80 text-sm font-medium backdrop-blur-sm px-2 py-1 rounded-full bg-black/20">
            {formattedTime}
          </span>
        </motion.div>

        {/* Type Badge */}
        {activity.type && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-5 right-5"
          >
            <div
              className="px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-medium uppercase tracking-wider"
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              {activity.type}
            </div>
          </motion.div>
        )}

        {/* Activity Name */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl font-bold text-white mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {activity.name}
        </motion.h2>

        {/* Address */}
        {activity.address && (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 text-white/70 text-sm mb-4"
          >
            <MapPin className="w-4 h-4" />
            <span>{activity.address}</span>
          </motion.div>
        )}

        {/* Rating & Time Info */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-4 mb-5"
        >
          {activity.rating && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-current text-yellow-400" />
              <span className="text-white font-medium">
                {activity.rating.toFixed(1)}
              </span>
            </div>
          )}

          {timeRemaining && (
            <div className="flex items-center gap-1.5 text-white/80">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{timeRemaining} remaining</span>
            </div>
          )}

          {optimalUntil && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
              style={{
                background: `${theme.primary}30`,
                color: theme.secondary,
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span>Best until {optimalUntil}</span>
            </div>
          )}
        </motion.div>

        {/* Why You're Here (expandable) */}
        {activity.whyYoureHere && (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-5"
          >
            <p className="text-white/90 text-sm leading-relaxed">
              {activity.whyYoureHere}
            </p>
          </motion.div>
        )}

        {/* Insider Tip (toggle) */}
        {activity.insiderTip && (
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <button
              onClick={() => {
                setShowTip(!showTip);
                onShowTip?.();
              }}
              className="flex items-center gap-2 text-sm mb-3"
              style={{ color: theme.secondary }}
            >
              <Lightbulb className="w-4 h-4" />
              <span className="font-medium">Insider Tip</span>
              <motion.div
                animate={{ rotate: showTip ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showTip && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div
                    className="p-3 rounded-xl mb-4 text-sm"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'white',
                    }}
                  >
                    {activity.insiderTip}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-3"
        >
          {/* Navigate Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNavigate}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium"
            style={{
              background: theme.primary,
              color: 'white',
              boxShadow: `0 4px 20px ${theme.glow}`,
            }}
          >
            <Navigation className="w-5 h-5" />
            <span>Navigate</span>
          </motion.button>

          {/* Capture Moment Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onCaptureMoment}
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Camera className="w-6 h-6 text-white" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NowHeroCard;
