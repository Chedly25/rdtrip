/**
 * InlineTip
 *
 * Contextual tip component that appears inline in the plan.
 * Design: Handwritten travel notes - warm, personal, non-intrusive.
 *
 * Each tip type has its own personality:
 * - cluster_complete: Celebratory green with sparkle
 * - missing_meal: Appetizing terracotta with utensils
 * - far_item: Cautionary amber with footprints
 * - too_packed: Calming blue with clock
 * - hotel_suggestion: Slate with bed icon
 * - great_start: Encouraging purple with sparkle
 * - walkable_day: Fresh teal with walking icon
 *
 * Aesthetic: Editorial magazine meets sticky notes
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Utensils,
  Footprints,
  Clock,
  Bed,
  X,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';
import type { TipType, CompanionTip } from '../../../hooks/useCompanionTips';

// ============================================
// Tip Configurations
// ============================================

interface TipConfig {
  icon: React.ElementType;
  bgGradient: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  textColor: string;
  subtextColor: string;
  accentColor: string;
}

const tipConfigs: Record<TipType, TipConfig> = {
  cluster_complete: {
    icon: PartyPopper,
    bgGradient: 'from-[#F0F7F4] via-[#F5FAF7] to-[#F0F7F4]',
    borderColor: 'border-[#4A7C59]/25',
    iconBg: 'bg-[#4A7C59]',
    iconColor: 'text-white',
    textColor: 'text-[#2C5E3F]',
    subtextColor: 'text-[#4A7C59]',
    accentColor: '#4A7C59',
  },
  missing_meal: {
    icon: Utensils,
    bgGradient: 'from-[#FEF3EE] via-[#FFF8F5] to-[#FEF3EE]',
    borderColor: 'border-[#C45830]/25',
    iconBg: 'bg-[#C45830]',
    iconColor: 'text-white',
    textColor: 'text-[#8B3D20]',
    subtextColor: 'text-[#C45830]',
    accentColor: '#C45830',
  },
  far_item: {
    icon: Footprints,
    bgGradient: 'from-[#FEF9EE] via-[#FFFBF5] to-[#FEF9EE]',
    borderColor: 'border-[#D4A853]/30',
    iconBg: 'bg-[#D4A853]',
    iconColor: 'text-white',
    textColor: 'text-[#8B6914]',
    subtextColor: 'text-[#B8922E]',
    accentColor: '#D4A853',
  },
  too_packed: {
    icon: Clock,
    bgGradient: 'from-[#EEF6F8] via-[#F5FAFC] to-[#EEF6F8]',
    borderColor: 'border-[#4A90A4]/25',
    iconBg: 'bg-[#4A90A4]',
    iconColor: 'text-white',
    textColor: 'text-[#2A5A6B]',
    subtextColor: 'text-[#4A90A4]',
    accentColor: '#4A90A4',
  },
  hotel_suggestion: {
    icon: Bed,
    bgGradient: 'from-[#F0F2F5] via-[#F7F8FA] to-[#F0F2F5]',
    borderColor: 'border-[#5C6B7A]/25',
    iconBg: 'bg-[#5C6B7A]',
    iconColor: 'text-white',
    textColor: 'text-[#3A4754]',
    subtextColor: 'text-[#5C6B7A]',
    accentColor: '#5C6B7A',
  },
  great_start: {
    icon: Sparkles,
    bgGradient: 'from-[#F5F0FF] via-[#FAF7FF] to-[#F5F0FF]',
    borderColor: 'border-[#7C5CDB]/25',
    iconBg: 'bg-[#7C5CDB]',
    iconColor: 'text-white',
    textColor: 'text-[#4A3580]',
    subtextColor: 'text-[#7C5CDB]',
    accentColor: '#7C5CDB',
  },
  walkable_day: {
    icon: Footprints,
    bgGradient: 'from-[#E8F5F2] via-[#F0FAF7] to-[#E8F5F2]',
    borderColor: 'border-[#2A9D8F]/25',
    iconBg: 'bg-[#2A9D8F]',
    iconColor: 'text-white',
    textColor: 'text-[#1A6B61]',
    subtextColor: 'text-[#2A9D8F]',
    accentColor: '#2A9D8F',
  },
};

// ============================================
// Component Props
// ============================================

interface InlineTipProps {
  tip: CompanionTip;
  onDismiss?: (tipId: string) => void;
  onAction?: (actionType: string) => void;
}

// ============================================
// Main Component
// ============================================

export function InlineTip({ tip, onDismiss, onAction }: InlineTipProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const config = tipConfigs[tip.type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => {
      onDismiss?.(tip.id);
    }, 300);
  };

  const handleAction = () => {
    if (tip.action) {
      onAction?.(tip.action.actionType);
    }
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
          }}
          className={`
            relative overflow-hidden
            rounded-xl border ${config.borderColor}
            bg-gradient-to-r ${config.bgGradient}
          `}
          style={{
            boxShadow: `0 2px 12px -2px ${config.accentColor}15`,
          }}
        >
          {/* Decorative accent line */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
            style={{ backgroundColor: config.accentColor }}
          />

          {/* Content */}
          <div className="flex items-start gap-3 p-4 pl-5">
            {/* Icon */}
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={`
                flex-shrink-0 w-9 h-9 rounded-lg
                ${config.iconBg} ${config.iconColor}
                flex items-center justify-center
                shadow-sm
              `}
            >
              <Icon className="w-4.5 h-4.5" strokeWidth={2} />
            </motion.div>

            {/* Text content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={`
                font-['Satoshi',system-ui,sans-serif] font-semibold text-sm
                ${config.textColor}
                leading-snug
              `}>
                {tip.message}
              </p>

              {tip.subtext && (
                <p className={`
                  mt-1 font-['Satoshi',system-ui,sans-serif] text-xs
                  ${config.subtextColor}
                  leading-relaxed opacity-90
                `}>
                  {tip.subtext}
                </p>
              )}

              {/* Action button */}
              {tip.action && (
                <motion.button
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAction}
                  className={`
                    mt-2.5 inline-flex items-center gap-1
                    text-xs font-semibold
                    ${config.subtextColor}
                    hover:opacity-80 transition-opacity
                  `}
                >
                  {tip.action.label}
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>

            {/* Dismiss button */}
            {tip.dismissible && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDismiss}
                className={`
                  flex-shrink-0 w-6 h-6 rounded-full
                  flex items-center justify-center
                  ${config.subtextColor} opacity-50
                  hover:opacity-100 hover:bg-white/50
                  transition-all duration-200
                `}
                aria-label="Dismiss tip"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>

          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Tip Stack Component (for multiple tips)
// ============================================

interface InlineTipStackProps {
  tips: CompanionTip[];
  onDismiss?: (tipId: string) => void;
  onAction?: (actionType: string) => void;
}

export function InlineTipStack({ tips, onDismiss, onAction }: InlineTipStackProps) {
  if (tips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      <AnimatePresence mode="popLayout">
        {tips.map((tip, index) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: index * 0.1 },
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
          >
            <InlineTip
              tip={tip}
              onDismiss={onDismiss}
              onAction={onAction}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export default InlineTip;
