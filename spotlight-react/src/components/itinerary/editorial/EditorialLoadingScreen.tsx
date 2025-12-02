/**
 * Editorial Loading Screen
 *
 * A beautiful, warm loading experience for itinerary generation
 * that follows the Wanderlust Editorial design system.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  MapPin,
  Utensils,
  Hotel,
  Camera,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  Star
} from 'lucide-react';

interface EditorialLoadingScreenProps {
  progress: {
    total: number;
    completed: number;
    currentAgent: string | null;
    percentComplete: number;
  };
  totalCities: number;
  totalNights: number;
}

// Poetic loading messages that rotate
const loadingMessages = [
  { text: "Discovering hidden gems along your route...", icon: Compass },
  { text: "Finding the perfect morning espresso spots...", icon: Coffee },
  { text: "Curating authentic local experiences...", icon: Star },
  { text: "Selecting restaurants with a view...", icon: Utensils },
  { text: "Booking stays with character...", icon: Hotel },
  { text: "Planning golden hour photo stops...", icon: Camera },
  { text: "Mapping the scenic detours...", icon: MapPin },
  { text: "Crafting your perfect mornings...", icon: Sun },
  { text: "Planning enchanting evenings...", icon: Moon },
];

export const EditorialLoadingScreen = ({
  progress,
  totalCities,
  totalNights
}: EditorialLoadingScreenProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Rotate through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentMessage = loadingMessages[currentMessageIndex];
  const MessageIcon = currentMessage.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 min-h-[500px] flex flex-col"
    >
      {/* Main Loading Animation */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Animated Orb */}
        <div className="relative w-32 h-32 mb-8">
          {/* Outer rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-[#C45830]/30"
          />

          {/* Middle pulsing ring */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-2 rounded-full bg-gradient-to-br from-[#C45830]/20 to-[#D4A853]/20"
          />

          {/* Inner rotating ring (opposite direction) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border border-[#D4A853]/40"
          />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C45830] to-[#D4A853] flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          </div>

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-10, 10, -10],
                x: [Math.sin(i * 60) * 5, Math.sin(i * 60 + 180) * 5, Math.sin(i * 60) * 5],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2
              }}
              className="absolute w-2 h-2 rounded-full bg-[#D4A853]"
              style={{
                top: `${20 + Math.sin(i * 60) * 30}%`,
                left: `${20 + Math.cos(i * 60) * 30}%`,
              }}
            />
          ))}
        </div>

        {/* Rotating Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-3 mb-8"
          >
            <div className="w-10 h-10 rounded-full bg-[#F5F0E8] flex items-center justify-center">
              <MessageIcon className="w-5 h-5 text-[#C45830]" />
            </div>
            <p className="font-serif text-lg text-[#2C2417] max-w-xs">
              {currentMessage.text}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Section */}
        <div className="w-full max-w-sm space-y-4">
          {/* Progress Bar */}
          <div className="relative h-2 bg-[#E8DFD3] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentComplete}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#C45830] to-[#D4A853] rounded-full"
            />
            {/* Shimmer effect */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </div>

          {/* Progress Text */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#8B7355]">
              {progress.currentAgent || 'Preparing...'}
            </span>
            <span className="font-medium text-[#C45830]">
              {progress.percentComplete}%
            </span>
          </div>
        </div>
      </div>

      {/* Trip Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-auto pt-6 border-t border-[#E8DFD3]"
      >
        <div className="flex items-center justify-center gap-8 text-center">
          <div>
            <div className="text-2xl font-serif font-semibold text-[#2C2417]">
              {totalCities}
            </div>
            <div className="text-xs text-[#8B7355] uppercase tracking-wide">
              Cities
            </div>
          </div>

          <div className="w-px h-10 bg-[#E8DFD3]" />

          <div>
            <div className="text-2xl font-serif font-semibold text-[#2C2417]">
              {totalNights}
            </div>
            <div className="text-xs text-[#8B7355] uppercase tracking-wide">
              Nights
            </div>
          </div>

          <div className="w-px h-10 bg-[#E8DFD3]" />

          <div>
            <div className="text-2xl font-serif font-semibold text-[#2C2417]">
              {totalNights + 1}
            </div>
            <div className="text-xs text-[#8B7355] uppercase tracking-wide">
              Days
            </div>
          </div>
        </div>

        {/* Subtle hint */}
        <p className="text-center text-xs text-[#8B7355] mt-4">
          This usually takes 1-2 minutes
        </p>
      </motion.div>
    </motion.div>
  );
};

export default EditorialLoadingScreen;
