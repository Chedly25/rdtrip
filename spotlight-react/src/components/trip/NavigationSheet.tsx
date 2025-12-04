/**
 * Navigation Sheet - Wayfinder Design
 *
 * An elegant navigation handoff component that lets users choose
 * their preferred maps app and launch directions seamlessly.
 *
 * Design: "Compass Rose" - vintage navigation meets modern utility
 *
 * Features:
 * - Platform detection (iOS/Android/Desktop)
 * - Multiple maps app support (Google, Apple, Waze)
 * - Beautiful app icons with hover states
 * - Walking/Driving toggle
 * - Estimated time display
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Navigation,
  Car,
  Footprints,
  ExternalLink,
  Clock,
  MapPin,
  Compass,
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

// Maps app configurations
const mapsApps = [
  {
    id: 'google',
    name: 'Google Maps',
    icon: '🗺️',
    color: '#4285F4',
    getUrl: (dest: Coordinates, mode: 'driving' | 'walking') => {
      const travelMode = mode === 'walking' ? 'walking' : 'driving';
      return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=${travelMode}`;
    },
    available: () => true, // Always available
  },
  {
    id: 'apple',
    name: 'Apple Maps',
    icon: '🍎',
    color: '#000000',
    getUrl: (dest: Coordinates, mode: 'driving' | 'walking') => {
      const dirflg = mode === 'walking' ? 'w' : 'd';
      return `http://maps.apple.com/?daddr=${dest.lat},${dest.lng}&dirflg=${dirflg}`;
    },
    available: () => {
      // Check if iOS or macOS
      const userAgent = navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod|macintosh/.test(userAgent);
    },
  },
  {
    id: 'waze',
    name: 'Waze',
    icon: '👻',
    color: '#33CCFF',
    getUrl: (dest: Coordinates) => {
      return `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;
    },
    available: () => true,
  },
];

interface Coordinates {
  lat: number;
  lng: number;
}

interface NavigationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  destination: {
    name: string;
    address?: string;
    coordinates: Coordinates;
  };
  estimatedTime?: {
    driving: number; // minutes
    walking: number; // minutes
  };
}

// Compass Rose Decoration
const CompassRose = () => (
  <motion.div
    className="absolute -top-12 -right-12 w-24 h-24 opacity-10"
    animate={{ rotate: 360 }}
    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
  >
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <g fill={colors.goldenDark}>
        {/* Cardinal directions */}
        <polygon points="50,0 55,45 50,40 45,45" />
        <polygon points="100,50 55,55 60,50 55,45" />
        <polygon points="50,100 45,55 50,60 55,55" />
        <polygon points="0,50 45,45 40,50 45,55" />
        {/* Intercardinal directions */}
        <polygon points="85,15 55,48 52,45 55,42" opacity="0.5" />
        <polygon points="85,85 55,52 58,55 55,58" opacity="0.5" />
        <polygon points="15,85 45,52 48,55 45,58" opacity="0.5" />
        <polygon points="15,15 45,48 42,45 45,42" opacity="0.5" />
      </g>
      <circle cx="50" cy="50" r="8" fill={colors.golden} />
      <circle cx="50" cy="50" r="4" fill={colors.cream} />
    </svg>
  </motion.div>
);

// Travel Mode Toggle
const TravelModeToggle = ({
  mode,
  onModeChange,
  estimates,
}: {
  mode: 'driving' | 'walking';
  onModeChange: (mode: 'driving' | 'walking') => void;
  estimates?: { driving: number; walking: number };
}) => (
  <div className="flex gap-2 p-1 rounded-xl" style={{ background: colors.warmWhite }}>
    {(['driving', 'walking'] as const).map((m) => {
      const isActive = mode === m;
      const Icon = m === 'driving' ? Car : Footprints;
      const time = estimates?.[m];

      return (
        <motion.button
          key={m}
          onClick={() => onModeChange(m)}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all"
          style={{
            background: isActive ? colors.sage : 'transparent',
            color: isActive ? 'white' : colors.mediumBrown,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium capitalize">{m}</span>
          {time && (
            <span
              className="text-sm opacity-80"
              style={{ color: isActive ? 'white' : colors.lightBrown }}
            >
              {time} min
            </span>
          )}
        </motion.button>
      );
    })}
  </div>
);

// Maps App Button
const MapsAppButton = ({
  app,
  destination,
  mode,
  index,
}: {
  app: typeof mapsApps[0];
  destination: Coordinates;
  mode: 'driving' | 'walking';
  index: number;
}) => {
  const handleClick = () => {
    const url = app.getUrl(destination, mode);
    window.open(url, '_blank');
  };

  if (!app.available()) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={handleClick}
      className="flex items-center gap-4 w-full p-4 rounded-2xl transition-all group"
      style={{
        background: colors.warmWhite,
        border: `2px solid ${colors.border}`,
      }}
      whileHover={{
        scale: 1.02,
        borderColor: app.color,
        boxShadow: `0 8px 30px ${app.color}20`,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* App Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
        style={{
          background: `${app.color}15`,
          border: `1px solid ${app.color}30`,
        }}
      >
        {app.icon}
      </div>

      {/* App Info */}
      <div className="flex-1 text-left">
        <h4 className="text-lg font-medium" style={{ color: colors.darkBrown }}>
          {app.name}
        </h4>
        <p className="text-sm" style={{ color: colors.lightBrown }}>
          Open in {app.name}
        </p>
      </div>

      {/* External Link Icon */}
      <motion.div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: `${app.color}10` }}
        whileHover={{ background: app.color }}
      >
        <ExternalLink
          className="w-5 h-5 transition-colors group-hover:text-white"
          style={{ color: app.color }}
        />
      </motion.div>
    </motion.button>
  );
};

export const NavigationSheet: React.FC<NavigationSheetProps> = ({
  isOpen,
  onClose,
  destination,
  estimatedTime,
}) => {
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');

  // Filter available apps
  const availableApps = useMemo(() => {
    return mapsApps.filter((app) => app.available());
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{
            background: 'rgba(44, 36, 23, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
          style={{
            background: colors.cream,
            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Compass Rose Decoration */}
          <CompassRose />

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 rounded-full" style={{ background: colors.border }} />
          </div>

          {/* Header */}
          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                  boxShadow: `0 4px 15px ${colors.sage}30`,
                }}
              >
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-medium" style={{ color: colors.darkBrown }}>
                  Navigate
                </h2>
                <p className="text-sm" style={{ color: colors.lightBrown }}>
                  Choose your compass
                </p>
              </div>
            </div>

            <motion.button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: colors.warmWhite, border: `1px solid ${colors.border}` }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" style={{ color: colors.lightBrown }} />
            </motion.button>
          </div>

          {/* Content */}
          <div className="px-6 pb-8">
            {/* Destination Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl mb-5"
              style={{
                background: `linear-gradient(135deg, ${colors.golden}10 0%, ${colors.terracotta}05 100%)`,
                border: `1px solid ${colors.golden}20`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${colors.terracotta}15` }}
                >
                  <MapPin className="w-5 h-5" style={{ color: colors.terracotta }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-base font-medium truncate"
                    style={{ color: colors.darkBrown }}
                  >
                    {destination.name}
                  </h3>
                  {destination.address && (
                    <p
                      className="text-sm truncate mt-0.5"
                      style={{ color: colors.lightBrown }}
                    >
                      {destination.address}
                    </p>
                  )}
                </div>
                {estimatedTime && (
                  <div className="flex items-center gap-1 text-sm" style={{ color: colors.sage }}>
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {travelMode === 'driving'
                        ? `${estimatedTime.driving} min`
                        : `${estimatedTime.walking} min`}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Travel Mode Toggle */}
            <div className="mb-5">
              <TravelModeToggle
                mode={travelMode}
                onModeChange={setTravelMode}
                estimates={estimatedTime}
              />
            </div>

            {/* Maps Apps */}
            <div className="space-y-3">
              <p
                className="text-xs uppercase tracking-wider mb-3"
                style={{ color: colors.lightBrown }}
              >
                Open with
              </p>
              {availableApps.map((app, index) => (
                <MapsAppButton
                  key={app.id}
                  app={app}
                  destination={destination.coordinates}
                  mode={travelMode}
                  index={index}
                />
              ))}
            </div>

            {/* Quick Copy Coordinates */}
            <motion.button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${destination.coordinates.lat}, ${destination.coordinates.lng}`
                );
              }}
              className="w-full mt-4 py-3 text-center text-sm"
              style={{ color: colors.lightBrown }}
              whileHover={{ color: colors.sage }}
            >
              <Navigation className="w-4 h-4 inline mr-2" />
              Copy coordinates
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default NavigationSheet;
