/**
 * EmptyClusterSuggestion
 *
 * A suggested area card for places the user hasn't started building yet.
 * Shows area name, description, and CTA to start building.
 *
 * Design: Soft, inviting card with subtle gradient and warm tones
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, X, Info, Sparkles } from 'lucide-react';
import type { EmptyClusterSuggestionProps } from '../../../types/planning';

export function EmptyClusterSuggestion({
  area,
  onStart,
  onDismiss,
}: EmptyClusterSuggestionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="
        relative group
        bg-gradient-to-br from-[#FFFBF5] via-[#FFFBF5] to-[#FEF8F3]
        rounded-2xl border border-dashed border-[#E5DDD0]
        hover:border-[#D4C4B0] hover:shadow-sm
        transition-all duration-300
        overflow-hidden
      "
    >
      {/* Subtle decorative pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#C45830" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="
              flex-shrink-0 w-10 h-10 rounded-xl
              bg-gradient-to-br from-[#F5F0E8] to-[#EDE5D8]
              border border-[#E5DDD0]
              flex items-center justify-center
            ">
              <MapPin className="w-5 h-5 text-[#8B7355]" />
            </div>

            {/* Title */}
            <div>
              <h3 className="font-['Satoshi',sans-serif] font-semibold text-base text-[#2C2417] uppercase tracking-wide">
                {area.name}
              </h3>
              {area.description && (
                <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif] mt-0.5 line-clamp-2 leading-relaxed">
                  {area.description}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Info button */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="
                p-2 rounded-lg text-[#C4B8A5]
                hover:bg-[#F5F0E8] hover:text-[#8B7355]
                transition-colors
              "
              title="More info"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Dismiss button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="
                  p-2 rounded-lg text-[#C4B8A5]
                  hover:bg-[#FEF3EE] hover:text-[#C45830]
                  transition-colors
                "
                title="Dismiss suggestion"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Info panel (expandable) */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-[#F5F0E8]/50 rounded-lg border border-[#E5DDD0]"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#D4A853] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#8B7355] font-['Satoshi',sans-serif] leading-relaxed">
                This area was suggested based on your preferences and the most interesting spots nearby.
                Start building here to see specific recommendations.
              </p>
            </div>
          </motion.div>
        )}

        {/* CTA Button */}
        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="
            w-full py-3 px-4 mt-2
            bg-gradient-to-r from-[#2C2417] to-[#3D342A]
            text-white font-['Satoshi',sans-serif] font-semibold text-sm
            rounded-xl
            shadow-sm hover:shadow-md
            transition-all duration-200
            flex items-center justify-center gap-2
            group/btn
          "
        >
          <span>Start building here</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </motion.button>

        {/* Subtle hint */}
        <p className="mt-3 text-center text-xs text-[#C4B8A5] font-['Satoshi',sans-serif]">
          We'll suggest things to do in this area
        </p>
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="
          absolute -inset-px rounded-2xl
          bg-gradient-to-br from-[#C45830]/5 to-transparent
          pointer-events-none
        "
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

export default EmptyClusterSuggestion;
