/**
 * Remove City Confirmation Dialog
 *
 * An elegant confirmation dialog in the Wanderlust Editorial style.
 * Features a warm, organic design with careful attention to typography
 * and motion that feels intentional yet delightful.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { MapPin, AlertTriangle, X, Trash2 } from 'lucide-react';

interface RemoveCityDialogProps {
  isOpen: boolean;
  cityName: string;
  cityIndex: number;
  totalCities: number;
  onConfirm: () => void;
  onCancel: () => void;
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

export function RemoveCityDialog({
  isOpen,
  cityName,
  cityIndex,
  totalCities,
  onConfirm,
  onCancel,
}: RemoveCityDialogProps) {
  const isFirstCity = cityIndex === 0;
  const isLastCity = cityIndex === totalCities - 1;
  const cityLabel = isFirstCity ? 'starting point' : isLastCity ? 'destination' : 'waypoint';

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onCancel}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: 'rgba(44, 36, 23, 0.4)' }}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
            mass: 0.8
          }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
          style={{
            background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
            boxShadow: '0 25px 50px -12px rgba(44, 36, 23, 0.25), 0 0 0 1px rgba(44, 36, 23, 0.05)'
          }}
        >
          {/* Decorative top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{
              background: `linear-gradient(90deg, ${colors.terracotta} 0%, ${colors.golden} 50%, ${colors.sage} 100%)`
            }}
          />

          {/* Close button */}
          <motion.button
            onClick={onCancel}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: colors.warmWhite,
              border: `1px solid ${colors.border}`,
              color: colors.warmGray
            }}
          >
            <X className="w-4 h-4" />
          </motion.button>

          {/* Content */}
          <div className="p-8 pt-10">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.1,
                type: 'spring',
                stiffness: 260,
                damping: 20
              }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(196, 88, 48, 0.15) 0%, rgba(196, 88, 48, 0.08) 100%)`,
                border: `1px solid rgba(196, 88, 48, 0.2)`
              }}
            >
              <AlertTriangle
                className="w-8 h-8"
                style={{ color: colors.terracotta }}
              />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-center text-2xl font-semibold mb-2"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                color: colors.darkBrown,
                letterSpacing: '-0.02em'
              }}
            >
              Remove {cityName}?
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6 leading-relaxed"
              style={{ color: colors.warmGray }}
            >
              This will remove <span className="font-semibold" style={{ color: colors.darkBrown }}>{cityName}</span> as
              your {cityLabel}. Your route will be recalculated automatically.
            </motion.p>

            {/* City preview card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-4 rounded-2xl mb-6 flex items-center gap-3"
              style={{
                background: 'rgba(196, 88, 48, 0.06)',
                border: `1px solid ${colors.border}`
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${colors.terracotta}, ${colors.terracottaDark})`,
                }}
              >
                {cityIndex + 1}
              </div>
              <div className="flex-1">
                <p
                  className="font-semibold text-sm"
                  style={{ color: colors.darkBrown }}
                >
                  {cityName}
                </p>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" style={{ color: colors.warmGray }} />
                  <p className="text-xs" style={{ color: colors.warmGray }}>
                    Stop {cityIndex + 1} of {totalCities}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3"
            >
              {/* Cancel button */}
              <motion.button
                onClick={onCancel}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: colors.warmWhite,
                  border: `1px solid ${colors.border}`,
                  color: colors.warmGray
                }}
              >
                Keep City
              </motion.button>

              {/* Confirm button */}
              <motion.button
                onClick={onConfirm}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaDark} 100%)`,
                  boxShadow: '0 4px 14px rgba(196, 88, 48, 0.35)'
                }}
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </motion.button>
            </motion.div>
          </div>

          {/* Decorative bottom pattern */}
          <div
            className="h-2 opacity-50"
            style={{
              background: `repeating-linear-gradient(
                90deg,
                ${colors.terracotta} 0px,
                ${colors.terracotta} 2px,
                transparent 2px,
                transparent 8px
              )`
            }}
          />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default RemoveCityDialog;
